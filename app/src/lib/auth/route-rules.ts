// Qué rutas se pueden ver sin sesión. El proxy usa esta lista para redirigir a /entrar.
// Ojo: "pública" aquí solo significa "el proxy no exige sesión"; cada API valida
// su propia sesión, secreto o token.

const PUBLIC_EXACT = new Set([
  "/",
  "/entrar",
  "/~offline",
  "/manifest.webmanifest",
  "/sw.js",
  "/monitoring",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

const PUBLIC_PREFIXES = [
  "/auth/",
  "/v/",
  "/invitar/",
  "/org/",
  "/icons/",
  "/api/",
  "/_next/",
  "/swe-worker-",
];

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/**
 * Destino después de entrar. Solo acepta rutas internas: empieza con "/" y no con
 * "//" ni "/\" (que un navegador leería como otro sitio). Cualquier otra cosa → /hoy.
 */
export function safeNextPath(next?: string | null): string {
  if (
    typeof next !== "string" ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return "/hoy";
  }
  return next;
}
