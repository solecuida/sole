import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  checkRateLimit,
  hashKey,
  RATE_LIMITS,
} from "@/server/security/rate-limit";
import { anonClient, createTestUser } from "./helpers";

describe("límites de frecuencia", () => {
  it("deja pasar hasta el límite y niega el siguiente; otra clave sigue libre", async () => {
    const key = `prueba-${randomUUID()}`;
    const results: boolean[] = [];
    for (let i = 0; i < 4; i += 1) {
      results.push((await checkRateLimit("test", key, 3, 3600)).allowed);
    }
    expect(results).toEqual([true, true, true, false]);

    const other = await checkRateLimit("test", `otra-${randomUUID()}`, 3, 3600);
    expect(other.allowed).toBe(true);
  });

  it("el mismo valor en otro ámbito se cuenta aparte", async () => {
    const key = `prueba-${randomUUID()}`;
    expect((await checkRateLimit("ambito_a", key, 1, 3600)).allowed).toBe(true);
    expect((await checkRateLimit("ambito_a", key, 1, 3600)).allowed).toBe(
      false,
    );
    expect((await checkRateLimit("ambito_b", key, 1, 3600)).allowed).toBe(true);
  });

  it("hashKey es estable, depende del ámbito y no contiene el valor original", () => {
    const email = "persona@example.test";
    const hashed = hashKey("login", email);
    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
    expect(hashed).toBe(hashKey("login", email));
    expect(hashed).not.toBe(hashKey("login_ip", email));
    expect(hashed).not.toContain("persona");
  });

  it("RATE_LIMITS fija los límites del plano", () => {
    expect(RATE_LIMITS).toEqual({
      login: { limit: 5, windowSeconds: 900 },
      login_ip: { limit: 300, windowSeconds: 900 },
      feedback: { limit: 10, windowSeconds: 3600 },
      emergency: { limit: 3, windowSeconds: 600 },
      invitation: { limit: 10, windowSeconds: 86400 },
      web_contact: { limit: 5, windowSeconds: 3600 },
      cared_done: { limit: 30, windowSeconds: 600 },
      push_test: { limit: 5, windowSeconds: 3600 },
    });
  });

  it("ni anónimos ni usuarias pueden llamar a rate_limit_hit", async () => {
    const args = { p_key: "x", p_limit: 1, p_window_seconds: 60 };
    const anon = await anonClient().rpc("rate_limit_hit", args);
    expect(anon.error?.code).toBe("42501");
    const user = await createTestUser();
    const authed = await user.client.rpc("rate_limit_hit", args);
    expect(authed.error?.code).toBe("42501");
  });
});
