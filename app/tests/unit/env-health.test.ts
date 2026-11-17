import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import { appUrl, MissingEnvError, readEnv, requireEnv } from "@/lib/env";

describe("env", () => {
  it("requireEnv lanza MissingEnvError con el nombre de la variable", () => {
    delete process.env.SOLE_NO_EXISTE;
    expect(() => requireEnv("SOLE_NO_EXISTE")).toThrow(MissingEnvError);
    expect(() => requireEnv("SOLE_NO_EXISTE")).toThrow(/SOLE_NO_EXISTE/);
  });

  it("requireEnv devuelve el valor cuando existe", () => {
    process.env.SOLE_PRUEBA = "valor";
    expect(requireEnv("SOLE_PRUEBA")).toBe("valor");
    delete process.env.SOLE_PRUEBA;
  });

  it("readEnv trata el valor vacío como ausente", () => {
    process.env.SOLE_VACIA = "";
    expect(readEnv("SOLE_VACIA")).toBeUndefined();
    delete process.env.SOLE_VACIA;
  });

  it("appUrl usa APP_URL o el valor local por defecto", () => {
    const previous = process.env.APP_URL;
    delete process.env.APP_URL;
    expect(appUrl()).toBe("http://localhost:3000");
    process.env.APP_URL = "https://app.solecuida.com";
    expect(appUrl()).toBe("https://app.solecuida.com");
    if (previous === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = previous;
    }
  });
});

describe("GET /api/health", () => {
  it("responde 200 con ok, status y time, sin caché", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { status: "ok" } });
    expect(typeof body.data.time).toBe("string");
    expect(Number.isNaN(Date.parse(body.data.time))).toBe(false);
  });
});
