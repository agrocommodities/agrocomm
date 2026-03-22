import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.2.1", "localhost"],
  experimental: {
    serverActions: {
      bodySizeLimit: "35mb",
    },
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
