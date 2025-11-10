import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: ['@ai-sdk/anthropic', '@ai-sdk/react', 'ai'],
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production (except errors/warnings)
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // Performance optimizations
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
