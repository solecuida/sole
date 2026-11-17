import { randomUUID } from "node:crypto";
import { withSentryConfig } from "@sentry/nextjs/config";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import { STATIC_SECURITY_HEADERS } from "./src/lib/security/headers";

// El build corre con `next build --webpack` (lo exige @serwist/next) y Tailwind
// entra por postcss.config.mjs: aquí no van reglas de Turbopack.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // La CSP va aparte: lleva un nonce distinto por petición y la pone src/proxy.ts.
  async headers() {
    return [{ source: "/:path*", headers: [...STATIC_SECURITY_HEADERS] }];
  },
};

// Genera public/sw.js desde src/sw.ts en cada build. En desarrollo no hay
// service worker: así un cambio de código nunca queda tapado por una caché.
const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
  // La página sin conexión se guarda en el teléfono en cada versión nueva.
  additionalPrecacheEntries: [{ url: "/~offline", revision: randomUUID() }],
});

// Sentry: los errores salen por el túnel /monitoring (mismo origen, así la CSP
// no necesita abrir otro dominio). Los mapas de código solo se suben cuando hay
// SENTRY_AUTH_TOKEN, se borran después de subir y nunca se publican. Sin DSN,
// Sentry queda apagado (src/lib/observability/scrub.ts).
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default withSentryConfig(withSerwist(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  telemetry: false,
  tunnelRoute: "/monitoring",
  sourcemaps: {
    disable: !uploadSourceMaps,
    deleteSourcemapsAfterUpload: true,
  },
});
