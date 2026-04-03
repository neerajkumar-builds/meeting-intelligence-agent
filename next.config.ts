import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type checking runs locally and in CI — skip on Vercel to avoid
    // memory issues on 2-core build machines with large dependency trees
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
