import { beforeAll, describe, expect, it } from "vitest";
import { recordConsents } from "@/server/consents/consents";
import {
  checkIn,
  emergencyContacts,
  lowStreak,
  todayScore,
  verifiedResources,
} from "@/server/selfcare/selfcare";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

// 14 de noviembre de 2026, mediodía en Chile (UTC-3 en verano).
const NOW = new Date("2026-11-14T15:00:00Z");
const TODAY = "2026-11-14";
const YESTERDAY = "2026-11-13";
const TWO_DAYS_AGO = "2026-11-12";

async function rowsOf(userId: string) {
  const { data } = await adminClient()
    .from("selfcare_checkins")
    .select("checkin_date, score")
    .eq("user_id", userId)
    .order("checkin_date", { ascending: true });
  return data ?? [];
}

async function seed(userId: string, days: [string, number][]) {
  const { error } = await adminClient()
    .from("selfcare_checkins")
    .insert(
      days.map(([checkin_date, score]) => ({
        user_id: userId,
        checkin_date,
        score,
      })),
    );
  expect(error).toBeNull();
}

describe("checkIn", () => {
  it("guarda una fila para hoy y responder de nuevo la actualiza", async () => {
    const user = await createTestUser({ consents: true });
    const first = await checkIn(user.client, user.userId, 4, NOW);
    expect(first).toEqual({ ok: true, data: { checkinDate: TODAY } });
    expect(await rowsOf(user.userId)).toEqual([
      { checkin_date: TODAY, score: 4 },
    ]);
    expect(await todayScore(user.client, user.userId, NOW)).toBe(4);

    const second = await checkIn(user.client, user.userId, 2, NOW);
    expect(second.ok).toBe(true);
    expect(await rowsOf(user.userId)).toEqual([
      { checkin_date: TODAY, score: 2 },
    ]);
    expect(await todayScore(user.client, user.userId, NOW)).toBe(2);
  });

  it("usa el día local de Chile, no el de UTC", async () => {
    const user = await createTestUser({ consents: true });
    // 01:30 UTC del 15 es todavía el 14 a las 22:30 en Chile.
    const late = new Date("2026-11-15T01:30:00Z");
    const result = await checkIn(user.client, user.userId, 3, late);
    expect(result).toEqual({ ok: true, data: { checkinDate: TODAY } });
  });

  it.each([0, 6, 2.5, Number.NaN])("rechaza el puntaje %s", async (score) => {
    const user = await createTestUser({ consents: true });
    const result = await checkIn(user.client, user.userId, score, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation_failed");
    }
    expect(await rowsOf(user.userId)).toEqual([]);
  });

  it("todayScore es null si no respondió", async () => {
    const user = await createTestUser({ consents: true });
    expect(await todayScore(user.client, user.userId, NOW)).toBeNull();
  });
});

describe("lowStreak", () => {
  it("es true con puntajes de 2 o menos en hoy, ayer y anteayer", async () => {
    const user = await createTestUser({ consents: true });
    await seed(user.userId, [
      [TODAY, 1],
      [YESTERDAY, 2],
      [TWO_DAYS_AGO, 2],
    ]);
    expect(await lowStreak(user.client, user.userId, NOW)).toBe(true);
  });

  it("es false si uno de los tres días es 3 o más", async () => {
    const user = await createTestUser({ consents: true });
    await seed(user.userId, [
      [TODAY, 2],
      [YESTERDAY, 3],
      [TWO_DAYS_AGO, 1],
    ]);
    expect(await lowStreak(user.client, user.userId, NOW)).toBe(false);
  });

  it("es false si falta un día", async () => {
    const user = await createTestUser({ consents: true });
    await seed(user.userId, [
      [TODAY, 1],
      [TWO_DAYS_AGO, 1],
      ["2026-11-11", 1],
    ]);
    expect(await lowStreak(user.client, user.userId, NOW)).toBe(false);
  });

  it("es false sin respuestas", async () => {
    const user = await createTestUser({ consents: true });
    expect(await lowStreak(user.client, user.userId, NOW)).toBe(false);
  });
});

describe("privacidad del bienestar", () => {
  let caregiver: TestUser;
  let family: TestUser;
  let circleId: string;

  beforeAll(async () => {
    [caregiver, family] = await Promise.all([
      createTestUser({ consents: true }),
      createTestUser({ consents: true }),
    ]);
    circleId = await createCircleFor(caregiver.client, "Marta");
    const member = await adminClient().from("circle_members").insert({
      circle_id: circleId,
      user_id: family.userId,
      role: "family",
      display_name: "Pedro",
    });
    expect(member.error).toBeNull();
  });

  it("un familiar del mismo círculo recibe cero filas", async () => {
    await checkIn(caregiver.client, caregiver.userId, 1, NOW);
    expect(await rowsOf(caregiver.userId)).toHaveLength(1);

    const seen = await family.client.from("selfcare_checkins").select("*");
    expect(seen.error).toBeNull();
    expect(seen.data).toEqual([]);

    const byOwner = await family.client
      .from("selfcare_checkins")
      .select("*")
      .eq("user_id", caregiver.userId);
    expect(byOwner.data).toEqual([]);
  });

  it("emergencyContacts devuelve solo los contactos de emergencia, sin notas", async () => {
    const { error } = await adminClient()
      .from("contacts")
      .insert([
        {
          circle_id: circleId,
          name: "Ana (emergencia)",
          kind: "familia",
          phone: "+56 9 1111 2222",
          is_emergency: true,
        },
        {
          circle_id: circleId,
          name: "Farmacia del barrio",
          kind: "farmacia",
          phone: "+56 2 2333 4444",
          is_emergency: false,
        },
      ]);
    expect(error).toBeNull();

    const contacts = await emergencyContacts(family.client, circleId);
    expect(contacts).toHaveLength(1);
    expect(Object.keys(contacts[0]).sort()).toEqual(["id", "name", "phone"]);
    expect(contacts[0]).toMatchObject({
      name: "Ana (emergencia)",
      phone: "+56 9 1111 2222",
    });
  });
});

describe("verifiedResources", () => {
  it("lista solo recursos verificados y activos, con su fuente", async () => {
    const user = await createTestUser({ consents: true });
    const resources = await verifiedResources(user.client);
    expect(resources.length).toBeGreaterThan(0);
    for (const resource of resources) {
      expect(resource.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(resource.sourceUrl).toMatch(/^https:\/\//);
    }
    expect(resources.map((resource) => resource.name)).toContain(
      "Recurso de prueba (solo local)",
    );
    expect(resources.map((resource) => resource.name)).not.toContain(
      "Salud Responde",
    );
  });
});

describe("evento selfcare.checked_in", () => {
  it("se guarda sin el puntaje", async () => {
    const user = await createTestUser();
    const consents = await recordConsents(user.client, user.userId, {
      terms: true,
      sensitive: true,
      research: true,
      ageConfirmed: true,
      authorizationDeclared: true,
    });
    expect(consents.ok).toBe(true);

    const result = await checkIn(user.client, user.userId, 5, NOW);
    expect(result.ok).toBe(true);

    const { data: profile } = await adminClient()
      .from("profiles")
      .select("pseudonym_id")
      .eq("id", user.userId)
      .single();
    const { data: events } = await adminClient()
      .from("events")
      .select("name, props")
      .eq("pseudonym_id", profile?.pseudonym_id ?? "")
      .eq("name", "selfcare.checked_in");
    expect(events).toEqual([{ name: "selfcare.checked_in", props: {} }]);
  });
});
