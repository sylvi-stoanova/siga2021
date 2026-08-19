import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    cpus: 1,
    workerThreads: true,
  },
};

export default nextConfig;
