import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("vercel.json", () => {
  const config = JSON.parse(
    readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
  ) as Record<string, unknown>;

  it("despliega en gru1 con pnpm build", () => {
    expect(config.regions).toEqual(["gru1"]);
    expect(config.buildCommand).toBe("pnpm build");
  });

  it("omite el build en toda rama que no sea main", () => {
    const ignore = String(config.ignoreCommand);
    expect(ignore).toContain("VERCEL_GIT_COMMIT_REF");
    expect(ignore).toContain("main");
    expect(ignore).toContain("!=");
  });
});

describe("robots y sitemap", () => {
  const previous = process.env.APP_URL;

  beforeEach(() => {
    process.env.APP_URL = "https://app.solecuida.com";
  });

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = previous;
    }
  });

  it("robots permite solo la portada y apunta al sitemap", () => {
    const result = robots();
    expect(result.rules).toEqual({
      userAgent: "*",
      allow: "/$",
      disallow: "/",
    });
    expect(result.sitemap).toBe("https://app.solecuida.com/sitemap.xml");
  });

  it("sitemap trae solo la portada", () => {
    expect(sitemap()).toEqual([{ url: "https://app.solecuida.com/" }]);
  });
});

describe("GET /api/health con base", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("@/lib/supabase/admin");
  });

  async function loadWith(
    from: () => unknown,
  ): Promise<() => Promise<Response>> {
    vi.doMock("@/lib/supabase/admin", () => ({
      createSupabaseAdminClient: () => ({ from }),
    }));
    return (await import("@/app/api/health/route")).GET;
  }

  function query(result: Promise<{ error: unknown }>) {
    const builder = {
      select: () => builder,
      limit: () => builder,
      abortSignal: () => builder,
      // biome-ignore lint/suspicious/noThenProperty: imita el constructor de consultas de Supabase
      then: (resolve: (v: { error: unknown }) => unknown) =>
        result.then(resolve),
    };
    return builder;
  }

  it("responde 200 con db ok y sin caché", async () => {
    const GET = await loadWith(() => query(Promise.resolve({ error: null })));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { status: "ok", db: "ok" } });
  });

  it("responde 503 db_unavailable sin filtrar el mensaje de error", async () => {
    const GET = await loadWith(() =>
      query(Promise.resolve({ error: { message: "secreto-interno" } })),
    );
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({
      ok: false,
      error: { code: "db_unavailable" },
    });
    expect(text).not.toContain("secreto-interno");
  });

  it("responde 503 si el cliente lanza (faltan variables)", async () => {
    const GET = await loadWith(() => {
      throw new Error("falta SUPABASE_URL");
    });
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("SUPABASE_URL");
  });

  it("corta a los 3 segundos si la base no responde", async () => {
    vi.useFakeTimers();
    try {
      const GET = await loadWith(() => query(new Promise(() => undefined)));
      const pending = GET();
      await vi.advanceTimersByTimeAsync(3000);
      const response = await pending;
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        ok: false,
        error: { code: "db_unavailable" },
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
