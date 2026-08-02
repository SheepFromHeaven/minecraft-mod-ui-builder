import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev-tools badge is dev-server chrome, not app UI — hide it
  // during Playwright runs so it can't leak into visual regression snapshots.
  ...(process.env.PLAYWRIGHT_TEST ? { devIndicators: false } : {}),
};

export default nextConfig;
