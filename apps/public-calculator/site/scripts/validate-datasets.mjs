import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";

function repoRootFromSiteCwd() {
  // When run from apps/public-calculator/site, repo root is ../../..
  return path.resolve(process.cwd(), "..", "..", "..");
}

function publicCalculatorDirFromSiteCwd() {
  // apps/public-calculator
  return path.resolve(process.cwd(), "..");
}

function schemaDirFromSiteCwd() {
  return path.join(publicCalculatorDirFromSiteCwd(), "schemas");
}

function dataDirFromSiteCwd() {
  return path.join(publicCalculatorDirFromSiteCwd(), "data");
}

async function readJson(absolutePath) {
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw);
}

async function loadSchema(absolutePath) {
  const schema = await readJson(absolutePath);
  return schema;
}

function parseDatedFilename(filename, prefix) {
  const match = filename.match(new RegExp(`^${prefix}\\.(\\d{4}-\\d{2}-\\d{2})\\.json$`));
  return match?.[1] ?? null;
}

async function listSnapshotFiles(prefix) {
  const dir = dataDirFromSiteCwd();
  const entries = await readdir(dir);
  const files = [];
  for (const file of entries) {
    if (file === `${prefix}.sample.json`) {
      files.push(file);
      continue;
    }
    const date = parseDatedFilename(file, prefix);
    if (date) files.push(file);
  }
  files.sort();
  return files.map((f) => path.join(dir, f));
}

function formatAjvError(err) {
  const instancePath = err.instancePath || "/";
  const schemaPath = err.schemaPath || "";
  const message = err.message || "validation error";
  return `${instancePath} ${message} (${schemaPath})`;
}

async function main() {
  // Keep this tool deterministic: always validate ALL public snapshot files.
  // For “latest-only” validation, add an explicit flag later.
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
    allowUnionTypes: true,
  });

  const schemaDir = schemaDirFromSiteCwd();
  const sourceSchemaPath = path.join(schemaDir, "source.schema.json");
  const pricingSchemaPath = path.join(schemaDir, "pricing.schema.v0.1.json");
  const entitlementsSchemaPath = path.join(schemaDir, "entitlements.schema.v0.1.json");
  const fxSchemaPath = path.join(schemaDir, "fx.schema.v0.1.json");
  const modelsSchemaPath = path.join(schemaDir, "models.schema.v0.1.json");

  const sourceSchema = await loadSchema(sourceSchemaPath);
  ajv.addSchema(sourceSchema, sourceSchema.$id);
  ajv.addSchema(sourceSchema, "source.schema.json"); // allow relative $ref

  const pricingSchema = await loadSchema(pricingSchemaPath);
  const entitlementsSchema = await loadSchema(entitlementsSchemaPath);
  const fxSchema = await loadSchema(fxSchemaPath);
  const modelsSchema = await loadSchema(modelsSchemaPath);

  const validatePricing = ajv.compile(pricingSchema);
  const validateEntitlements = ajv.compile(entitlementsSchema);
  const validateFx = ajv.compile(fxSchema);
  const validateModels = ajv.compile(modelsSchema);

  const pricingFiles = await listSnapshotFiles("pricing");
  const entitlementsFiles = await listSnapshotFiles("entitlements");
  const fxFiles = await listSnapshotFiles("fx");
  const modelsFiles = await listSnapshotFiles("models");

  const failures = [];

  for (const file of pricingFiles) {
    const data = await readJson(file);
    const ok = validatePricing(data);
    if (!ok) {
      failures.push({
        file,
        errors: validatePricing.errors?.map(formatAjvError) ?? ["unknown validation error"],
      });
    }
  }

  for (const file of entitlementsFiles) {
    const data = await readJson(file);
    const ok = validateEntitlements(data);
    if (!ok) {
      failures.push({
        file,
        errors: validateEntitlements.errors?.map(formatAjvError) ?? ["unknown validation error"],
      });
    }
  }

  for (const file of fxFiles) {
    const data = await readJson(file);
    const ok = validateFx(data);
    if (!ok) {
      failures.push({
        file,
        errors: validateFx.errors?.map(formatAjvError) ?? ["unknown validation error"],
      });
    }
  }

  for (const file of modelsFiles) {
    const data = await readJson(file);
    const ok = validateModels(data);
    if (!ok) {
      failures.push({
        file,
        errors: validateModels.errors?.map(formatAjvError) ?? ["unknown validation error"],
      });
    }
  }

  if (failures.length > 0) {
    // eslint-disable-next-line no-console
    console.error("Dataset validation failed:");
    for (const failure of failures) {
      // eslint-disable-next-line no-console
      console.error(`\n- ${path.relative(repoRootFromSiteCwd(), failure.file)}`);
      for (const line of failure.errors) {
        // eslint-disable-next-line no-console
        console.error(`  - ${line}`);
      }
    }
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log("OK: all dataset snapshots validate against v0.1 schemas.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
