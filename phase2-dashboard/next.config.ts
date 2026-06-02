import type { NextConfig } from "next";

// Static export for GitHub Pages.
// Repo is a project page, so it is served from /BravaOpsDashboard.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/BravaOpsDashboard",
  images: { unoptimized: true },
};

export default nextConfig;
