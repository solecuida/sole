import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

// Datos que son solo de su dueña: bienestar, suscripciones de aviso, consentimientos.
// F es familiar en el círculo de A: ni así ve lo privado de A.
let a: TestUser;
let b: TestUser;
let f: TestUser;
let pseudonymA: string;

beforeAll(async () => {
  [a, b, f] = await Promise.all([
    createTestUser({ consents: true }),
    createTestUser({ consents: true }),
    createTestUser({ consents: true }),
  ]);
  const circleA = await createCircleFor(a.client, "Ana");
  const admin = adminClient();
  const member = await admin.from("circle_members").insert({
    circle_id: circleA,
    user_id: f.userId,
    role: "family",
    display_name: "Felipe",
  });
  expect(member.error).toBeNull();

  const checkin = await a.client.from("selfcare_checkins").insert({
    user_id: a.userId,
    checkin_date: "2026-11-14",
    score: 2,
  });
  expect(checkin.error).toBeNull();

  const subscription = await a.client.from("push_subscriptions").insert({
    user_id: a.userId,
    endpoint: `https://push.example.test/${randomUUID()}`,
    p256dh: "clave-publica-de-prueba",
    auth: "secreto-de-prueba",
  });
  expect(subscription.error).toBeNull();

  const profile = await admin
    .from("profiles")
    .select("pseudonym_id")
    .eq("id", a.userId)
    .single();
  pseudonymA = profile.data?.pseudonym_id ?? "";
  const event = await a.client.from("events").insert({
    pseudonym_id: pseudonymA,
    name: "app.opened",
    props: { screen: "hoy" },
  });
  expect(event.error).toBeNull();
});

describe("bienestar de la cuidadora (selfcare_checkins)", () => {
  it("la dueña ve su respuesta", async () => {
    const { data } = await a.client.from("selfcare_checkins").select("score");
    expect(data).toEqual([{ score: 2 }]);
  });

  it("otra cuidadora y un familiar de su círculo reciben cero filas", async () => {
    for (const other of [b, f]) {
      const { data, error } = await other.client
        .from("selfcare_checkins")
        .select("id")
        .eq("user_id", a.userId);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    }
  });

  it("nadie puede escribir una respuesta a nombre de otra persona (42501)", async () => {
    const { error } = await b.client.from("selfcare_checkins").insert({
      user_id: a.userId,
      checkin_date: "2026-11-13",
      score: 5,
    });
    expect(error?.code).toBe("42501");
  });
});

describe("suscripciones de aviso (push_subscriptions)", () => {
  it("la dueña ve la suya", async () => {
    const { data } = await a.client.from("push_subscriptions").select("id");
    expect(data).toHaveLength(1);
  });

  it("otra cuidadora y un familiar reciben cero filas", async () => {
    for (const other of [b, f]) {
      const { data, error } = await other.client
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", a.userId);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    }
  });
});

describe("eventos de investigación (events)", () => {
  it("quien no es admin recibe cero filas, también de sus propios eventos", async () => {
    for (const user of [a, b, f]) {
      const { data, error } = await user.client.from("events").select("id");
      expect(error).toBeNull();
      expect(data).toEqual([]);
    }
  });

  it("el evento sí quedó guardado (lo confirma el cliente admin)", async () => {
    const { data } = await adminClient()
      .from("events")
      .select("name")
      .eq("pseudonym_id", pseudonymA);
    expect(data).toEqual([{ name: "app.opened" }]);
  });

  it("nadie puede insertar un evento con el seudónimo de otra persona (42501)", async () => {
    const { error } = await b.client.from("events").insert({
      pseudonym_id: pseudonymA,
      name: "app.opened",
      props: { screen: "hoy" },
    });
    expect(error?.code).toBe("42501");
  });
});

describe("consentimientos (consents): solo se agregan filas", () => {
  it("la dueña ve los suyos y nadie más", async () => {
    const own = await a.client.from("consents").select("layer");
    expect(own.data?.map((row) => row.layer).sort()).toEqual([
      "sensitive",
      "terms",
    ]);
    const other = await b.client
      .from("consents")
      .select("id")
      .eq("user_id", a.userId);
    expect(other.data).toEqual([]);
  });

  it("ni la dueña ni otra persona pueden editarlos (42501)", async () => {
    for (const user of [a, b]) {
      const { error } = await user.client
        .from("consents")
        .update({ granted: false })
        .eq("user_id", a.userId);
      expect(error?.code).toBe("42501");
    }
  });

  it("tampoco se pueden borrar (42501)", async () => {
    const { error } = await a.client
      .from("consents")
      .delete()
      .eq("user_id", a.userId);
    expect(error?.code).toBe("42501");
  });
});
