import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev-tools badge is dev-server chrome, not app UI — hide it
  // during Playwright runs so it can't leak into visual regression snapshots.
  ...(process.env.PLAYWRIGHT_TEST ? { devIndicators: false } : {}),
  // In sandbox environments (e.g. super.engineering) the project root may be
  // read-only, causing Turbopack panics. Write dev chunks to /tmp instead.
  ...(process.env.NODE_ENV !== "production" ? { distDir: "/tmp/next-dist-mc-ui-builder" } : {}),
};

export default nextConfig;
