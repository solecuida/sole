// Cabeceras de seguridad de toda la app.
//
// El navegador nunca habla con Supabase (todo pasa por el servidor) y Sentry usa
// el túnel `/monitoring`: por eso `connect-src 'self'` basta. El único tercero
// que carga código en la página es Turnstile (challenges.cloudflare.com).

const TURNSTILE = "https://challenges.cloudflare.com";

/**
 * Política de contenido para una petición. `nonce` es único por petición: solo
 * los scripts que lo llevan (los que emite Next) pueden ejecutarse.
 * `'unsafe-eval'` entra solo en desarrollo, donde lo necesita la recarga en caliente.
 *
 * `upgrade-insecure-requests` va siempre, salvo que la app se sirva por http
 * (solo pasa en `localhost`): ahí Safari intentaría pasar a https, que no existe,
 * y ningún formulario funcionaría.
 */
export function buildCsp(
  nonce: string,
  opts: { dev: boolean; insecureOrigin?: boolean },
): string {
  const script = [
    "script-src 'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    TURNSTILE,
    ...(opts.dev ? ["'unsafe-eval'"] : []),
  ].join(" ");
  return [
    "default-src 'self'",
    script,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    `frame-src ${TURNSTILE}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(opts.insecureOrigin ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/** Un nonce nuevo, impredecible, para cada petición. */
export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

/** Cabeceras que no cambian entre peticiones: las aplica `next.config.ts` a todas las rutas. */
export const STATIC_SECURITY_HEADERS: ReadonlyArray<{
  key: string;
  value: string;
}> = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
];
