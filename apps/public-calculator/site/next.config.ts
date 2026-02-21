import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(configDir, "..", "..", "..");

const nextConfig: NextConfig = {
  turbopack: {
    root: repoRoot,
  },
  transpilePackages: ["@ai-cost-analysis/core"],
};

export default nextConfig;
