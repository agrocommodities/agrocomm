import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "ui-avatars.com" },
      { hostname: "cdn.agrocomm.com.br" },
    ],
  },
};

export default nextConfig;
