import { describe, expect, it } from "vitest";
import { isPublicPath, safeNextPath } from "@/lib/auth/route-rules";

describe("isPublicPath", () => {
  it("deja pasar sin sesión las rutas públicas", () => {
    for (const path of [
      "/",
      "/entrar",
      "/auth/confirm",
      "/v/abc",
      "/invitar/abc",
      "/org/abc",
      "/~offline",
      "/manifest.webmanifest",
      "/sw.js",
      "/swe-worker-abc123.js",
      "/icons/192",
      "/monitoring",
      "/api/health",
      "/api/cron/dispatch",
      "/_next/static/chunk.js",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml",
    ]) {
      expect(isPublicPath(path), path).toBe(true);
    }
  });

  it("protege las rutas de la app y del panel", () => {
    for (const path of [
      "/hoy",
      "/cuenta",
      "/admin",
      "/admin/mfa",
      "/bienvenida",
      "/bienvenida/consentimientos",
      "/recordatorios/editar",
      "/entrar-falso",
      "/v",
      "/organizacion",
    ]) {
      expect(isPublicPath(path), path).toBe(false);
    }
  });
});

describe("safeNextPath", () => {
  it("acepta rutas internas", () => {
    expect(safeNextPath("/hoy")).toBe("/hoy");
    expect(safeNextPath("/calendario?mes=2026-11")).toBe(
      "/calendario?mes=2026-11",
    );
  });

  it("convierte en /hoy todo lo que podría salir del sitio", () => {
    for (const next of [
      "//evil.example",
      "https://evil.example",
      "/\\evil.example",
      "evil.example",
      "javascript:alert(1)",
      "",
      null,
      undefined,
    ]) {
      expect(safeNextPath(next), String(next)).toBe("/hoy");
    }
  });
});
