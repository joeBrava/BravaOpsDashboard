import type { NextConfig } from "next";

// Static export for GitHub Pages.
// Repo is a project page, so it is served from /BravaOpsDashboard.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/BravaOpsDashboard",
  images: { unoptimized: true },
  // Emit each route as a directory index (out/invoices/index.html) so GitHub
  // Pages serves clean URLs like /invoices/ reliably on any static host.
  trailingSlash: true,
};

export default nextConfig;
