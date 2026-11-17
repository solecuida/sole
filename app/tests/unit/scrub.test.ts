import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";
import {
  buildSentryOptions,
  scrubBreadcrumb,
  scrubEvent,
  scrubText,
} from "@/lib/observability/scrub";

function sample(): ErrorEvent {
  return {
    type: undefined,
    user: { id: "seud-1", email: "ana@example.cl", ip_address: "1.2.3.4" },
    request: {
      url: "https://sole.cl/auth/confirmar?token_hash=abc&type=magiclink",
      cookies: { sb: "secreto" },
      data: { nota: "algo privado" },
      headers: { cookie: "sb=secreto", "user-agent": "Prueba/1.0" },
    },
    exception: {
      values: [{ type: "Error", value: "falló para ana@example.cl" }],
    },
    breadcrumbs: [
      {
        message: "contacto ana@example.cl o +56 9 1234 5678",
        data: { url: "/entrar?next=/hoy&code=xyz" },
      },
    ],
  };
}

describe("scrubEvent", () => {
  it("quita correo, IP, cookies, datos y cabeceras salvo user-agent", () => {
    const result = scrubEvent(sample());
    expect(result.user).toEqual({ id: "seud-1" });
    expect(result.request?.cookies).toBeUndefined();
    expect(result.request?.data).toBeUndefined();
    expect(result.request?.headers).toEqual({ "user-agent": "Prueba/1.0" });
    expect(JSON.stringify(result)).not.toContain("ana@example.cl");
    expect(JSON.stringify(result)).not.toContain("1.2.3.4");
  });

  it("reemplaza correos y teléfonos en migas y excepciones", () => {
    const result = scrubEvent(sample());
    expect(result.breadcrumbs?.[0]?.message).toBe(
      "contacto [filtrado] o [filtrado]",
    );
    expect(result.exception?.values?.[0]?.value).toBe("falló para [filtrado]");
  });

  it("filtra el valor de los parámetros sensibles de la URL", () => {
    const result = scrubEvent(sample());
    expect(result.request?.url).toContain("token_hash=[filtrado]");
    expect(result.request?.url).toContain("type=magiclink");
    expect(result.breadcrumbs?.[0]?.data?.url).toBe(
      "/entrar?next=[filtrado]&code=[filtrado]",
    );
  });

  it("deja el usuario vacío si no hay seudónimo", () => {
    const event = sample();
    event.user = { email: "ana@example.cl" };
    expect(scrubEvent(event).user).toEqual({});
  });
});

describe("scrubBreadcrumb", () => {
  it("filtra el mensaje", () => {
    expect(scrubBreadcrumb({ message: "tel 600-123-4567" }).message).toBe(
      "tel [filtrado]",
    );
  });
});

describe("buildSentryOptions", () => {
  it("queda apagado sin DSN", () => {
    expect(buildSentryOptions("").enabled).toBe(false);
    expect(buildSentryOptions(undefined).enabled).toBe(false);
  });

  it("se enciende con DSN y no envía datos personales por defecto", () => {
    const options = buildSentryOptions("https://k@o0.ingest.sentry.io/1");
    expect(options.enabled).toBe(true);
    expect(options.sendDefaultPii).toBe(false);
    expect(options.tracesSampleRate).toBe(0.1);
    expect(options.beforeSend).toBe(scrubEvent);
    expect(options.beforeBreadcrumb).toBe(scrubBreadcrumb);
  });
});

describe("enlaces secretos en la ruta", () => {
  const token = "Zk3vX9aQ_-7TtYb2LmN0pRsUwEeHhJjKkCcDdFfGg1A";

  it("borra el enlace de la persona cuidada y el de invitación, en páginas y en la API", () => {
    for (const url of [
      `https://app.solecuida.com/v/${token}`,
      `https://app.solecuida.com/api/v/${token}/listo`,
      `https://app.solecuida.com/api/v/${token}/emergencia?x=1`,
      `https://app.solecuida.com/invitar/${token}`,
      `GET /v/${token} 500`,
    ]) {
      const clean = scrubText(url);
      expect(clean).not.toContain(token);
      expect(clean).toContain("[filtrado]");
    }
    expect(scrubText(`https://app.solecuida.com/api/v/${token}/listo`)).toBe(
      "https://app.solecuida.com/api/v/[filtrado]/listo",
    );
  });

  it("no toca rutas comunes", () => {
    expect(scrubText("https://app.solecuida.com/hoy")).toBe(
      "https://app.solecuida.com/hoy",
    );
    expect(scrubText("/informes/medico?mes=2026-11")).toBe(
      "/informes/medico?mes=2026-11",
    );
  });

  it("también lo borra de la dirección de la petición de un evento", () => {
    const event = scrubEvent({
      type: undefined,
      request: { url: `https://app.solecuida.com/v/${token}` },
      transaction: `GET /api/v/${token}/listo`,
    });
    expect(JSON.stringify(event)).not.toContain(token);
  });
});
