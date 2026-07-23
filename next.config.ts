import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Abaikan error ESLint saat proses build di Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    // Ensure pages are always dynamically rendered
  },
};

export default nextConfig;
