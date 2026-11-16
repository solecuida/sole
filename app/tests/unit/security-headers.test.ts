import { describe, expect, it } from "vitest";
import {
  buildCsp,
  createNonce,
  STATIC_SECURITY_HEADERS,
} from "@/lib/security/headers";

describe("buildCsp", () => {
  it("en producción solo deja correr los scripts con el nonce", () => {
    const csp = buildCsp("abc", { dev: false });
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain(
      "script-src 'self' 'nonce-abc' 'strict-dynamic' https://challenges.cloudflare.com",
    );
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("no abre la política de scripts con 'unsafe-inline' ni comodines", () => {
    const csp = buildCsp("abc", { dev: false });
    const script = csp
      .split("; ")
      .find((part) => part.startsWith("script-src"));
    expect(script).not.toContain("unsafe-inline");
    expect(csp).not.toContain("*");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("solo deja de exigir https cuando la app corre en http (localhost)", () => {
    expect(buildCsp("abc", { dev: false })).toContain(
      "upgrade-insecure-requests",
    );
    expect(buildCsp("abc", { dev: false, insecureOrigin: false })).toContain(
      "upgrade-insecure-requests",
    );
    const local = buildCsp("abc", { dev: false, insecureOrigin: true });
    expect(local).not.toContain("upgrade-insecure-requests");
    expect(`${local}; upgrade-insecure-requests`).toBe(
      buildCsp("abc", { dev: false }),
    );
  });

  it("en desarrollo agrega 'unsafe-eval' y nada más", () => {
    const dev = buildCsp("abc", { dev: true });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev.replace(" 'unsafe-eval'", "")).toBe(
      buildCsp("abc", { dev: false }),
    );
  });
});

describe("createNonce", () => {
  it("entrega un valor distinto cada vez, apto para una cabecera", () => {
    const first = createNonce();
    const second = createNonce();
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9+/=]{20,}$/);
  });
});

describe("STATIC_SECURITY_HEADERS", () => {
  it("trae las cinco cabeceras fijas con su valor exacto", () => {
    const headers = Object.fromEntries(
      STATIC_SECURITY_HEADERS.map((header) => [header.key, header.value]),
    );
    expect(headers).toEqual({
      "Strict-Transport-Security":
        "max-age=63072000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "X-Frame-Options": "DENY",
    });
  });
});
