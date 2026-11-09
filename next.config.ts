import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle used by the Docker image on a VPS.
  output: "standalone",
  // This project is nested inside a folder that has its own lockfile; pin the
  // tracing root to this app so builds do not walk up to the parent workspace.
  outputFileTracingRoot: process.cwd(),
  // Product imagery is served as SVG placeholders or admin-uploaded files, both of
  // which are referenced directly. Remote Supabase Storage URLs are allowed below.
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;
