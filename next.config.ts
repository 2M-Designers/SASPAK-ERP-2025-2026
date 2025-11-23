import type { NextConfig } from "next";
//import { i18n } from "./next-i18next.config";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "188.245.83.20",
        port: "8082",
        pathname: "/uploads/**",
      },
    ],
    domains: ["188.245.83.20"], // Alternative method
  },
  // Increase timeout to 180 seconds (3 minutes)
  staticPageGenerationTimeout: 180,
};

//module.exports = {
//  i18n,
//};

export default nextConfig;
