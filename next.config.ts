import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Evita race sul resolve dei chunk server (es. `Cannot find module './7627.js'` da `pages/_document`). */
  experimental: {
    webpackBuildWorker: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "tagymkqywjlrqwduxvcw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
