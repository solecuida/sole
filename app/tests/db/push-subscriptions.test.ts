import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/push/route";
import {
  getNotificationPreferences,
  pushStatus,
  updateNotificationPreferences,
} from "@/server/push/subscriptions";
import { adminClient, createTestUser, type TestUser } from "./helpers";

const admin = adminClient();

function subscription(endpoint = `https://push.example.test/${randomUUID()}`) {
  return { endpoint, keys: { p256dh: "clave-publica", auth: "secreto" } };
}

/** Llama a la ruta con la sesión de la usuaria (Bearer), como lo hace el plano. */
function call(user: TestUser | null, body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost:3000/api/push", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Prueba/1.0",
        ...(user ? { authorization: `Bearer ${user.accessToken}` } : {}),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function rowsOf(userId: string) {
  const { data } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_agent")
    .eq("user_id", userId);
  return data ?? [];
}

describe("POST /api/push · subscribe", () => {
  it("guarda una fila y repetir el mismo endpoint deja exactamente una", async () => {
    const user = await createTestUser();
    const sub = subscription();

    const first = await call(user, { action: "subscribe", subscription: sub });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({
      ok: true,
      data: { active: true, count: 1 },
    });

    const again = await call(user, {
      action: "subscribe",
      subscription: { ...sub, keys: { p256dh: "clave-nueva", auth: "otro" } },
    });
    expect(again.status).toBe(200);
    expect(await rowsOf(user.userId)).toEqual([
      {
        endpoint: sub.endpoint,
        p256dh: "clave-nueva",
        auth: "otro",
        user_agent: "Prueba/1.0",
      },
    ]);
  });

  it("una cuenta puede tener varios navegadores", async () => {
    const user = await createTestUser();
    await call(user, { action: "subscribe", subscription: subscription() });
    const second = await call(user, {
      action: "subscribe",
      subscription: subscription(),
    });
    expect((await second.json()).data).toEqual({ active: true, count: 2 });
  });

  it("si otra usuaria se suscribe con el mismo endpoint, la fila pasa a ella", async () => {
    const first = await createTestUser();
    const second = await createTestUser();
    const sub = subscription();

    await call(first, { action: "subscribe", subscription: sub });
    const moved = await call(second, {
      action: "subscribe",
      subscription: sub,
    });
    expect(moved.status).toBe(200);

    expect(await rowsOf(first.userId)).toEqual([]);
    expect((await rowsOf(second.userId)).map((row) => row.endpoint)).toEqual([
      sub.endpoint,
    ]);
    expect(await pushStatus(first.client)).toEqual({ active: false, count: 0 });
  });

  it("rechaza suscripciones mal formadas con 422", async () => {
    const user = await createTestUser();
    for (const body of [
      { action: "subscribe" },
      {
        action: "subscribe",
        subscription: {
          endpoint: "http://sin-https.test/x",
          keys: { p256dh: "a", auth: "b" },
        },
      },
      {
        action: "subscribe",
        subscription: {
          endpoint: "no-es-url",
          keys: { p256dh: "a", auth: "b" },
        },
      },
      {
        action: "subscribe",
        subscription: { endpoint: "https://push.example.test/x" },
      },
      { action: "otra-cosa" },
      "esto no es json",
    ]) {
      const response = await call(user, body);
      expect(response.status, JSON.stringify(body)).toBe(422);
      expect((await response.json()).error.code).toBe("validation_failed");
    }
    expect(await rowsOf(user.userId)).toEqual([]);
  });
});

describe("POST /api/push · sin sesión", () => {
  it("responde 401 unauthorized para cualquier acción", async () => {
    for (const body of [
      { action: "subscribe", subscription: subscription() },
      { action: "unsubscribe", subscription: { endpoint: "https://x.test/1" } },
      { action: "test" },
    ]) {
      const response = await call(null, body);
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        ok: false,
        error: { code: "unauthorized" },
      });
    }
  });

  it("un token inventado también responde 401", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/push", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer no.es.un.jwt",
        },
        body: JSON.stringify({ action: "test" }),
      }),
    );
    expect(response.status).toBe(401);
  });
});

describe("POST /api/push · unsubscribe", () => {
  it("borra solo la fila de quien llama para ese endpoint", async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    const mine = subscription();
    const keep = subscription();
    const theirs = subscription();
    await call(user, { action: "subscribe", subscription: mine });
    await call(user, { action: "subscribe", subscription: keep });
    await call(other, { action: "subscribe", subscription: theirs });

    // Intentar borrar la de otra persona no hace nada.
    const foreign = await call(user, {
      action: "unsubscribe",
      subscription: { endpoint: theirs.endpoint },
    });
    expect(foreign.status).toBe(200);
    expect(await rowsOf(other.userId)).toHaveLength(1);

    const response = await call(user, {
      action: "unsubscribe",
      subscription: { endpoint: mine.endpoint },
    });
    expect(await response.json()).toEqual({
      ok: true,
      data: { active: true, count: 1 },
    });
    expect((await rowsOf(user.userId)).map((row) => row.endpoint)).toEqual([
      keep.endpoint,
    ]);
  });
});

describe("pushStatus", () => {
  it("sin suscripciones devuelve active:false y count:0", async () => {
    const user = await createTestUser();
    expect(await pushStatus(user.client)).toEqual({ active: false, count: 0 });
  });
});

describe("POST /api/push · test y permission", () => {
  it("sin avisos activos, probar responde 200 y no envía nada; al sexto intento en una hora, 429", async () => {
    const user = await createTestUser();
    for (let i = 0; i < 5; i += 1) {
      const response = await call(user, { action: "test" });
      expect(response.status).toBe(200);
      expect((await response.json()).data).toEqual({ active: false, count: 0 });
    }
    const limited = await call(user, { action: "test" });
    expect(limited.status).toBe(429);
    expect((await limited.json()).error.code).toBe("rate_limited");
  });

  it("registra la respuesta al permiso solo con consentimiento de investigación", async () => {
    const user = await createTestUser({ consents: true });
    await admin.from("consents").insert({
      user_id: user.userId,
      layer: "research",
      version: "2026-11-14",
      granted: true,
    });
    const response = await call(user, {
      action: "permission",
      result: "granted",
    });
    expect(response.status).toBe(200);
    const profile = await admin
      .from("profiles")
      .select("pseudonym_id")
      .eq("id", user.userId)
      .single();
    const events = await admin
      .from("events")
      .select("name, props")
      .eq("pseudonym_id", profile.data?.pseudonym_id ?? "");
    expect(events.data).toEqual([
      { name: "push.permission", props: { result: "granted" } },
    ]);
  });
});

describe("preferencias de aviso", () => {
  it("por defecto 15 minutos y sin hora de bitácora; se pueden cambiar", async () => {
    const user = await createTestUser();
    expect(await getNotificationPreferences(user.client, user.userId)).toEqual({
      followupMinutes: 15,
      journalReminderTime: null,
    });
    const result = await updateNotificationPreferences(
      user.client,
      user.userId,
      { followupMinutes: 30, journalReminderTime: "21:30" },
    );
    expect(result.ok).toBe(true);
    expect(await getNotificationPreferences(user.client, user.userId)).toEqual({
      followupMinutes: 30,
      journalReminderTime: "21:30",
    });
  });

  it("rechaza minutos fuera de 5 a 120 y horas mal escritas", async () => {
    const user = await createTestUser();
    for (const input of [
      { followupMinutes: 4, journalReminderTime: null },
      { followupMinutes: 121, journalReminderTime: null },
      { followupMinutes: 15.5, journalReminderTime: null },
      { followupMinutes: 15, journalReminderTime: "25:00" },
      { followupMinutes: Number.NaN, journalReminderTime: null },
    ]) {
      expect(
        await updateNotificationPreferences(user.client, user.userId, input),
      ).toMatchObject({ ok: false, error: { code: "validation_failed" } });
    }
    expect(
      (await getNotificationPreferences(user.client, user.userId))
        .followupMinutes,
    ).toBe(15);
  });
});
