import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "gateway.pinata.cloud" },
      { protocol: "https", hostname: "ipfs.io" },
    ],
  },
  serverExternalPackages: ["pino", "pino-pretty"],
  webpack: (config) => {
    // Stub out the missing react-native module that MetaMask SDK imports
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": path.resolve("./lib/empty-module.js"),
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, net: false, tls: false,
    };
    return config;
  },
};

export default nextConfig;
