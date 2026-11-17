import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OPTIONS, POST } from "@/app/api/web/contact/route";

// `fetch` se reemplaza solo para Turnstile y para el proyecto `sole-web`: lo
// demás (el límite de frecuencia, que usa la base local) pasa al `fetch` real.

const WEB_URL = "https://sole-web.example.test";
const TURNSTILE = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const realFetch = globalThis.fetch;

interface Call {
  url: string;
  body: string;
}

let calls: Call[];
let turnstileOk: boolean;
const saved: Record<string, string | undefined> = {};
const ENV = [
  "WEB_ALLOWED_ORIGINS",
  "TURNSTILE_SECRET_KEY",
  "WEB_CONTACT_SUPABASE_URL",
  "WEB_CONTACT_SUPABASE_SECRET_KEY",
];

beforeEach(() => {
  calls = [];
  turnstileOk = true;
  for (const name of ENV) {
    saved[name] = process.env[name];
  }
  delete process.env.WEB_ALLOWED_ORIGINS;
  process.env.TURNSTILE_SECRET_KEY = "secreto-de-prueba";
  process.env.WEB_CONTACT_SUPABASE_URL = WEB_URL;
  process.env.WEB_CONTACT_SUPABASE_SECRET_KEY = "clave-secreta-web";
  vi.stubGlobal(
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === TURNSTILE) {
        calls.push({ url, body: String(init?.body ?? "") });
        return Response.json({ success: turnstileOk });
      }
      if (url.startsWith(WEB_URL)) {
        calls.push({ url, body: String(init?.body ?? "") });
        return new Response(null, { status: 201 });
      }
      return realFetch(input, init);
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const name of ENV) {
    if (saved[name] === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = saved[name];
    }
  }
});

/** Cada caso usa su propia IP, así el límite de frecuencia no se cruza entre casos. */
function post(
  body: unknown,
  origin = "https://solecuida.com",
): Promise<Response> {
  return POST(
    new Request("http://localhost:3000/api/web/contact", {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/json",
        "x-forwarded-for": `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
      },
      body: JSON.stringify(body),
    }),
  );
}

function valid(extra: Record<string, unknown> = {}) {
  return {
    nombre: "Ana",
    contacto: "ana@example.test",
    relacion: "cuidador-conviviente",
    comuna: "Renca",
    mensaje: `Hola ${randomUUID()}`,
    consentimiento: true,
    trampa: "",
    llenadoMs: 12_000,
    turnstileToken: "token-de-prueba",
    ...extra,
  };
}

const inserts = () => calls.filter((call) => call.url.startsWith(WEB_URL));
const captchas = () => calls.filter((call) => call.url === TURNSTILE);

describe("OPTIONS /api/web/contact", () => {
  it("responde 204 al sitio y 403 a cualquier otro origen", async () => {
    const ok = await OPTIONS(
      new Request("http://localhost:3000/api/web/contact", {
        method: "OPTIONS",
        headers: { origin: "https://solecuida.com" },
      }),
    );
    expect(ok.status).toBe(204);
    expect(ok.headers.get("access-control-allow-origin")).toBe(
      "https://solecuida.com",
    );
    expect(ok.headers.get("access-control-allow-methods")).toBe(
      "POST, OPTIONS",
    );

    for (const origin of [
      "https://evil.example",
      "https://solecuida.com.evil.example",
      "null",
    ]) {
      const denied = await OPTIONS(
        new Request("http://localhost:3000/api/web/contact", {
          method: "OPTIONS",
          headers: { origin },
        }),
      );
      expect(denied.status).toBe(403);
      expect(denied.headers.get("access-control-allow-origin")).toBeNull();
    }
  });

  it("acepta www y una lista propia en WEB_ALLOWED_ORIGINS, sin comodín", async () => {
    const www = await OPTIONS(
      new Request("http://x/api/web/contact", {
        method: "OPTIONS",
        headers: { origin: "https://www.solecuida.com" },
      }),
    );
    expect(www.status).toBe(204);
    process.env.WEB_ALLOWED_ORIGINS = "http://localhost:8080";
    const local = await OPTIONS(
      new Request("http://x/api/web/contact", {
        method: "OPTIONS",
        headers: { origin: "http://localhost:8080" },
      }),
    );
    expect(local.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:8080",
    );
  });
});

describe("POST /api/web/contact", () => {
  it("con Turnstile aceptado guarda una fila en `contactos` y responde 200", async () => {
    const response = await post(valid());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://solecuida.com",
    );
    expect(captchas()).toHaveLength(1);
    expect(inserts()).toHaveLength(1);
    const saved = JSON.parse(inserts()[0].body);
    expect(inserts()[0].url).toBe(`${WEB_URL}/rest/v1/contactos`);
    expect(saved).toMatchObject({
      nombre: "Ana",
      contacto: "ana@example.test",
      relacion: "cuidador-conviviente",
      comuna: "Renca",
      consentimiento: true,
    });
    // Nada del control anti-robots se guarda.
    expect(Object.keys(saved).sort()).toEqual(
      [
        "comuna",
        "consentimiento",
        "contacto",
        "mensaje",
        "nombre",
        "origen",
        "relacion",
      ].sort(),
    );
  });

  it("con el campo trampa lleno o enviado en menos de 3 s responde 200 y no llama a nada", async () => {
    for (const extra of [
      { trampa: "https://spam.example" },
      { llenadoMs: 800 },
    ]) {
      const response = await post(valid(extra));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
    }
    expect(calls).toEqual([]);
  });

  it("si Turnstile rechaza responde 400 captcha_failed y no guarda", async () => {
    turnstileOk = false;
    const response = await post(valid());
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("captcha_failed");
    expect(inserts()).toEqual([]);

    const noToken = await post(valid({ turnstileToken: undefined }));
    expect(noToken.status).toBe(400);
    expect(inserts()).toEqual([]);
  });

  it("sin la clave de Turnstile no la exige; sin el proyecto de la web responde 503", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect((await post(valid())).status).toBe(200);
    expect(captchas()).toEqual([]);

    delete process.env.WEB_CONTACT_SUPABASE_SECRET_KEY;
    const response = await post(valid());
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("unavailable");
  });

  it("sin consentimiento, sin nombre o con una relación inventada responde 422", async () => {
    for (const extra of [
      { consentimiento: false },
      { nombre: "  " },
      { relacion: "hacker" },
      { mensaje: "x".repeat(2001) },
    ]) {
      const response = await post(valid(extra));
      expect(response.status, JSON.stringify(extra)).toBe(422);
    }
    expect(inserts()).toEqual([]);
  });

  it("desde otro origen responde 403 y no guarda", async () => {
    const response = await post(valid(), "https://evil.example");
    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(calls).toEqual([]);
  });

  it("desde una misma IP, el sexto envío en una hora responde 429", async () => {
    const ip = `10.250.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    let status = 0;
    for (let i = 0; i < 6; i += 1) {
      const response = await POST(
        new Request("http://localhost:3000/api/web/contact", {
          method: "POST",
          headers: {
            origin: "https://solecuida.com",
            "content-type": "application/json",
            "x-forwarded-for": ip,
          },
          body: JSON.stringify(valid()),
        }),
      );
      status = response.status;
    }
    expect(status).toBe(429);
    expect(inserts()).toHaveLength(5);
  });
});
