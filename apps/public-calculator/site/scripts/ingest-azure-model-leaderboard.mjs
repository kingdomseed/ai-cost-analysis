import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

function repoRootFromSiteCwd() {
  return path.resolve(process.cwd(), "..", "..", "..");
}

function publicCalculatorDirFromSiteCwd() {
  return path.resolve(process.cwd(), "..");
}

function dataDirFromSiteCwd() {
  return path.join(publicCalculatorDirFromSiteCwd(), "data");
}

function parseDatedFilename(filename, prefix) {
  const match = filename.match(new RegExp(`^${prefix}\\.(\\d{4}-\\d{2}-\\d{2})\\.json$`));
  return match?.[1] ?? null;
}

async function resolveLatestSnapshotFile(prefix) {
  const dir = dataDirFromSiteCwd();
  const entries = await readdir(dir);
  const candidates = [];
  for (const file of entries) {
    const date = parseDatedFilename(file, prefix);
    if (date) candidates.push({ date, file });
  }
  candidates.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  if (candidates.length === 0) throw new Error(`No ${prefix} snapshots found in ${dir}`);
  return { date: candidates[0].date, absolutePath: path.join(dir, candidates[0].file) };
}

function parseCsvLine(line) {
  // Minimal CSV parser for this specific export (quoted values, comma-delimited).
  // We avoid adding dependencies; if Azure changes the format, update here.
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map((s) => s.trim());
}

function parsePercent(str) {
  const cleaned = String(str).trim().replace("%", "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseUsd(str) {
  const cleaned = String(str).trim().replace("$", "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseNumber(str) {
  const n = Number(String(str).trim());
  return Number.isFinite(n) ? n : null;
}

function canonicalProvider(provider) {
  const p = String(provider).trim().toLowerCase();
  if (p === "openai") return "openai";
  if (p === "anthropic") return "anthropic";
  if (p === "moonshot ai" || p === "moonshot") return "moonshot";
  if (p === "google") return "google";
  if (p === "microsoft") return "microsoft";
  if (p === "xai") return "xai";
  if (p === "meta") return "meta";
  if (p === "deepseek") return "deepseek";
  if (p === "mistral ai" || p === "mistral") return "mistral";
  if (p === "cohere") return "cohere";
  return p.replace(/\s+/g, "-");
}

function familyForProvider(providerId) {
  switch (providerId) {
    case "openai":
    case "azure":
      return "gpt";
    case "anthropic":
      return "claude";
    case "google":
      return "gemini";
    case "moonshot":
      return "kimi";
    default:
      return null;
  }
}

function canonicalModel(providerId, azureModelLabel) {
  const raw = String(azureModelLabel).trim();
  const lower = raw.toLowerCase();

  if (providerId === "anthropic") {
    // Azure uses hyphens like claude-opus-4-6; our pricing snapshot uses claude-opus-4.6.
    return lower.replace(/-4-6$/, "-4.6").replace(/-4-5$/, "-4.5").replace(/-4-1$/, "-4.1");
  }

  if (providerId === "moonshot") {
    // Examples: Kimi-K2.5, Kimi-K2-Thinking -> kimi-k2.5, kimi-k2-thinking
    return lower
      .replace(/^kimi-/, "kimi-")
      .replace(/\s+/g, "-")
      .replace(/thinking/g, "thinking");
  }

  // Default: keep as lowercase with spaces->hyphen.
  return lower.replace(/\s+/g, "-");
}

async function main() {
  const args = process.argv.slice(2);
  const csvArg = args.find((a) => !a.startsWith("--"));
  if (!csvArg) {
    // eslint-disable-next-line no-console
    console.error(
      "Usage: node scripts/ingest-azure-model-leaderboard.mjs <path-to-csv> [--date YYYY-MM-DD]",
    );
    process.exit(1);
  }

  const dateFlagIndex = args.indexOf("--date");
  const explicitDate = dateFlagIndex >= 0 ? args[dateFlagIndex + 1] : null;

  const csvPath = path.resolve(csvArg);
  const raw = await readFile(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV is empty or missing rows");

  const header = parseCsvLine(lines[0]);
  const colIndex = Object.fromEntries(header.map((h, i) => [h, i]));
  for (const required of [
    "Model",
    "Provider",
    "Quality_Index",
    "Safety_Attack_Success_Rate",
    "Throughput_tokens_per_sec",
    "Estimated_Cost_USD_per_1M_tokens",
  ]) {
    if (!(required in colIndex)) throw new Error(`Missing column: ${required}`);
  }

  const mtime = await stat(csvPath);
  const inferredAsOf = new Date(mtime.mtimeMs).toISOString().slice(0, 10);
  const asOf = explicitDate ?? inferredAsOf;

  const azureSourceId = "azure_foundry_model_leaderboard_export";
  const pricingSourceId = "pricing_snapshot_for_channel_mapping";

  const pricingLatest = await resolveLatestSnapshotFile("pricing");
  const pricingRaw = await readFile(pricingLatest.absolutePath, "utf8");
  const pricing = JSON.parse(pricingRaw);
  const apiRates = Array.isArray(pricing.api_rates) ? pricing.api_rates : [];

  /** @type {Map<string, any>} */
  const modelsByKey = new Map();

  // Seed with the current pricing universe so channels are present for known models.
  for (const rate of apiRates) {
    if (!rate || typeof rate !== "object") continue;
    const provider = rate.provider;
    const model = rate.model;
    const channel = rate.channel;
    if (typeof provider !== "string" || typeof model !== "string" || typeof channel !== "string")
      continue;
    const key = `${provider}:${model}`;
    const existing = modelsByKey.get(key);
    if (!existing) {
      modelsByKey.set(key, {
        provider,
        model,
        channels: [channel],
        family: familyForProvider(provider),
        modalities: null,
        ratings: null,
        notes:
          "Seeded from pricing snapshot; ratings may be added from leaderboards where sourced.",
      });
    } else {
      existing.channels = Array.from(new Set([...(existing.channels ?? []), channel]));
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const azureLabel = row[colIndex.Model];
    const providerRaw = row[colIndex.Provider];
    const providerId = canonicalProvider(providerRaw);
    const modelId = canonicalModel(providerId, azureLabel);

    const key = `${providerId}:${modelId}`;
    const ratings = [
      {
        system: "azure-foundry-model-leaderboard",
        metric: "quality_index",
        score: parseNumber(row[colIndex.Quality_Index]),
        scale: "0-1",
        as_of: asOf,
        source_ids: [azureSourceId],
      },
      {
        system: "azure-foundry-model-leaderboard",
        metric: "safety_attack_success_rate_percent",
        score: parsePercent(row[colIndex.Safety_Attack_Success_Rate]),
        scale: "percent",
        as_of: asOf,
        source_ids: [azureSourceId],
      },
      {
        system: "azure-foundry-model-leaderboard",
        metric: "throughput_tokens_per_sec",
        score: parseNumber(row[colIndex.Throughput_tokens_per_sec]),
        scale: "tokens/sec",
        as_of: asOf,
        source_ids: [azureSourceId],
      },
      {
        system: "azure-foundry-model-leaderboard",
        metric: "estimated_cost_usd_per_1m_tokens",
        score: parseUsd(row[colIndex.Estimated_Cost_USD_per_1M_tokens]),
        scale: "USD/1M",
        as_of: asOf,
        source_ids: [azureSourceId],
      },
    ].filter((r) => typeof r.score === "number" && Number.isFinite(r.score));

    const existing = modelsByKey.get(key);
    if (!existing) {
      modelsByKey.set(key, {
        provider: providerId,
        model: modelId,
        channels: [],
        family: familyForProvider(providerId),
        modalities: null,
        ratings,
        azure_model_label: azureLabel,
        azure_provider_label: providerRaw,
      });
    } else {
      existing.ratings = [...(existing.ratings ?? []), ...ratings];
      if (!existing.azure_model_label) existing.azure_model_label = azureLabel;
      if (!existing.azure_provider_label) existing.azure_provider_label = providerRaw;
    }
  }

  const models = Array.from(modelsByKey.values()).sort((a, b) => {
    const ak = `${a.provider}:${a.model}`;
    const bk = `${b.provider}:${b.model}`;
    return ak.localeCompare(bk);
  });

  const out = {
    meta: {
      schema_version: "v0.1",
      retrieved_at: asOf,
      last_verified_at: asOf,
      notes:
        "Model ratings ingested from a user-downloaded Azure Foundry model leaderboard CSV export. Ratings are external signals and should not be treated as canonical pricing.",
    },
    sources: [
      {
        id: azureSourceId,
        url: "https://ai.azure.com/ (leaderboard export from Azure Foundry UI)",
        retrieved_at: asOf,
        verified: false,
        notes: `Derived from local export at ${csvPath}. Prefer a stable Azure URL if/when available.`,
      },
      {
        id: pricingSourceId,
        url: path.relative(repoRootFromSiteCwd(), pricingLatest.absolutePath),
        retrieved_at: pricing?.meta?.retrieved_at ?? pricingLatest.date,
        verified: true,
        notes: "Used to seed provider/model/channel identities for known priced models.",
      },
    ],
    models,
  };

  const outFile = path.join(dataDirFromSiteCwd(), `models.${asOf}.json`);
  await writeFile(outFile, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  // eslint-disable-next-line no-console
  console.log(
    `Wrote ${path.relative(repoRootFromSiteCwd(), outFile)} with ${models.length} models`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
