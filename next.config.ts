import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.2.1", "localhost"],
  outputFileTracingExcludes: {
    "*": ["public/images/**"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "35mb",
    },
    turbopackFileSystemCacheForDev: false,
    turboPersistentCaching: true,
  },
};

export default nextConfig;
