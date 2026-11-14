import type { NextConfig } from "next";

// El build corre con `next build --webpack` (lo exige @serwist/next) y Tailwind
// entra por postcss.config.mjs: aquí no van reglas de Turbopack.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
