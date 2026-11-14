import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// El build corre con `next build --webpack` (lo exige @serwist/next) y Tailwind
// entra por postcss.config.mjs: aquí no van reglas de Turbopack.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

// Genera public/sw.js desde src/sw.ts en cada build. En desarrollo no hay
// service worker: así un cambio de código nunca queda tapado por una caché.
const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
});

export default withSerwist(nextConfig);
