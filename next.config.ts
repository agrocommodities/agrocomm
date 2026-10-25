import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.2.1", "localhost"],
  outputFileTracingExcludes: {
    "*": ["public/images/**"],
  },
  // O type-check roda no GitHub Actions (job "check"): na VPS (1.7GB RAM) o build é morto por OOM.
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "35mb",
    },
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
