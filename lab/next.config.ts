import type { NextConfig } from "next";
import localConfig from "./lib/local-config.cjs";

localConfig.loadLocalConfig()

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default nextConfig;
