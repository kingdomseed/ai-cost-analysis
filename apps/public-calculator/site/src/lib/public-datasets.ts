import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type SnapshotKind = "pricing" | "entitlements" | "fx";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertSnapshotEnvelope(
  kind: SnapshotKind,
  value: unknown,
): asserts value is { meta: unknown; sources: unknown[] } {
  if (!isRecord(value)) {
    throw new Error(`${kind} snapshot is not an object`);
  }
  if (!("meta" in value)) {
    throw new Error(`${kind} snapshot is missing top-level meta`);
  }
  if (!Array.isArray((value as { sources?: unknown }).sources)) {
    throw new Error(`${kind} snapshot is missing top-level sources[]`);
  }
}

function datasetDirAbsolute(): string {
  // Repo layout:
  //   apps/public-calculator/site (this Next.js app)
  //   apps/public-calculator/data (versioned datasets)
  return path.join(process.cwd(), "..", "data");
}

function parseDatedFilename(filename: string, prefix: string): string | null {
  // Example: pricing.2026-02-21.json
  const match = filename.match(new RegExp(`^${prefix}\\.(\\d{4}-\\d{2}-\\d{2})\\.json$`));
  return match?.[1] ?? null;
}

async function resolveLatestSnapshotFile(
  kind: SnapshotKind,
): Promise<{ date: string; file: string }> {
  const dir = datasetDirAbsolute();
  const entries = await readdir(dir);

  const candidates: Array<{ date: string; file: string }> = [];
  for (const file of entries) {
    const date = parseDatedFilename(file, kind);
    if (date) candidates.push({ date, file });
  }

  if (candidates.length === 0) {
    throw new Error(`No ${kind} snapshots found in ${dir}`);
  }

  candidates.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return candidates[0];
}

async function readJsonFile<T>(absolutePath: string): Promise<T> {
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function loadLatestSnapshot<T>(
  kind: SnapshotKind,
): Promise<{ date: string; data: T }> {
  const { date, file } = await resolveLatestSnapshotFile(kind);
  const absolutePath = path.join(datasetDirAbsolute(), file);
  const data = await readJsonFile<T>(absolutePath);
  assertSnapshotEnvelope(kind, data);
  return { date, data };
}

export async function loadLatestPricingSnapshot(): Promise<{ date: string; data: unknown }> {
  return loadLatestSnapshot("pricing");
}

export async function loadLatestEntitlementsSnapshot(): Promise<{ date: string; data: unknown }> {
  return loadLatestSnapshot("entitlements");
}

export async function loadLatestFxSnapshot(): Promise<{ date: string; data: unknown }> {
  return loadLatestSnapshot("fx");
}
