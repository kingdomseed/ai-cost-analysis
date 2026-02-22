import { readdir, readFile, writeFile } from "node:fs/promises";
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

function parseNumber(str) {
  const n = Number(String(str).trim());
  return Number.isFinite(n) ? n : null;
}

function canonicalProvider(provider) {
  const p = String(provider).trim().toLowerCase();
  if (p === "openai") return "openai";
  if (p === "anthropic") return "anthropic";
  if (p === "google") return "google";
  if (p === "xai") return "xai";
  if (p === "deepseek") return "deepseek";
  if (p === "meta") return "meta";
  if (p === "mistral" || p === "mistral ai") return "mistral";
  if (p === "cohere") return "cohere";
  if (p === "microsoft") return "microsoft";
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

function canonicalArenaModelId(label) {
  // Keep this conservative: we do NOT infer equivalence to API model IDs.
  // We just normalize the arena label into a stable identifier.
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9.\-:]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqStrings(values) {
  return Array.from(new Set(values.map((v) => String(v).trim()).filter((v) => v.length > 0)));
}

async function fetchCsv(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText} for ${url}`);
  return await res.text();
}

async function main() {
  const args = process.argv.slice(2);
  const dateFlagIndex = args.indexOf("--date");
  const explicitDate = dateFlagIndex >= 0 ? args[dateFlagIndex + 1] : null;
  const asOf = explicitDate ?? new Date().toISOString().slice(0, 10);

  const modelsLatest = await resolveLatestSnapshotFile("models");
  const modelsRaw = await readFile(modelsLatest.absolutePath, "utf8");
  const snapshot = JSON.parse(modelsRaw);

  if (!snapshot || typeof snapshot !== "object" || !Array.isArray(snapshot.models)) {
    throw new Error("Latest models snapshot is missing models[]");
  }

  const sourceId = "chatbot_arena_elo_dataset";
  const arenaDatasetUrl = "https://huggingface.co/datasets/mathewhe/chatbot-arena-elo";
  const arenaCsvUrl =
    "https://huggingface.co/datasets/mathewhe/chatbot-arena-elo/resolve/main/elo.csv";

  const csvText = await fetchCsv(arenaCsvUrl);
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("Arena CSV appears empty");

  const header = parseCsvLine(lines[0]);
  const colIndex = Object.fromEntries(header.map((h, i) => [h, i]));
  for (const required of ["Model", "Arena Score", "95% CI", "Votes", "Organization"]) {
    if (!(required in colIndex)) throw new Error(`Missing column: ${required}`);
  }

  const byKey = new Map(snapshot.models.map((m) => [`${m.provider}:${m.model}`, m]));

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const org = row[colIndex.Organization];
    const providerId = canonicalProvider(org);
    const arenaLabel = row[colIndex.Model];
    const modelId = canonicalArenaModelId(arenaLabel);
    const score = parseNumber(row[colIndex["Arena Score"]]);
    if (score == null) continue;

    const ci = row[colIndex["95% CI"]];
    const votes = parseNumber(row[colIndex.Votes]);

    const key = `${providerId}:${modelId}`;
    const rating = {
      system: "lmsys-chatbot-arena",
      metric: "arena_score_elo",
      score,
      scale: "elo",
      as_of: asOf,
      source_ids: [sourceId],
      ci_95: ci,
      votes: votes ?? null,
      arena_model_label: arenaLabel,
      arena_organization_label: org,
      notes:
        "Arena score is a comparative rating; do not treat as a direct measure of cost/latency/quality on specific tasks.",
    };

    const existing = byKey.get(key);
    if (!existing) {
      const entry = {
        provider: providerId,
        model: modelId,
        channels: [],
        family: familyForProvider(providerId),
        aliases: uniqStrings([arenaLabel, String(arenaLabel).toLowerCase()]),
        modalities: null,
        ratings: [rating],
        notes:
          "Added from Chatbot Arena ELO dataset; this may represent a chat surface variant, not an API model ID.",
      };
      snapshot.models.push(entry);
      byKey.set(key, entry);
      continue;
    }

    existing.ratings = Array.isArray(existing.ratings) ? [...existing.ratings, rating] : [rating];
    existing.aliases = uniqStrings([
      ...(existing.aliases ?? []),
      arenaLabel,
      String(arenaLabel).toLowerCase(),
    ]);
  }

  snapshot.meta = {
    ...(snapshot.meta ?? {}),
    retrieved_at: asOf,
    last_verified_at: asOf,
    notes: "Merged Azure Foundry and Chatbot Arena ratings into a single models snapshot.",
  };

  snapshot.sources = Array.isArray(snapshot.sources) ? snapshot.sources : [];
  snapshot.sources.push({
    id: sourceId,
    url: arenaDatasetUrl,
    retrieved_at: asOf,
    verified: false,
    notes: `Fetched elo.csv from ${arenaCsvUrl}.`,
  });

  const outFile = path.join(dataDirFromSiteCwd(), `models.${asOf}.json`);
  await writeFile(outFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  // eslint-disable-next-line no-console
  console.log(
    `Wrote ${path.relative(repoRootFromSiteCwd(), outFile)} (models=${snapshot.models.length})`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
