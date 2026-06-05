import type { NextConfig } from "next";

// Server-rendered Next.js app (Node.js server: `next build` + `next start`,
// deploy target Vercel). The static-export config (output:"export", basePath,
// trailingSlash for GitHub Pages, images.unoptimized) was removed in Phase 2:
// live secret-backed reads and domain-locked Google SSO cannot run in a static
// export. The default (no `output` key) is full server mode.
const nextConfig: NextConfig = {};

export default nextConfig;
