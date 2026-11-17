import { describe, expect, it } from "vitest";
import {
  createCircleWithTemplate,
  listCareTemplates,
  listMyCircles,
  localDate,
  resolveActiveCircle,
} from "@/server/circles/circles";
import { grantResearch } from "@/server/consents/consents";
import { ruleSchema } from "@/server/reminders/rule-schema";
import { adminClient, createTestUser } from "./helpers";

const INPUT = {
  displayName: "Marta",
  caredName: "Rosa",
  relation: "mi mamá",
  careType: "dialisis",
};

// 2026-11-15 02:30 UTC todavía es 14 de noviembre en Chile (UTC-3 en verano).
const NOW = new Date("2026-11-15T02:30:00Z");

async function templateItemsOf(careType: string) {
  const templates = await listCareTemplates(adminClient());
  return templates.find((item) => item.careType === careType)?.items ?? [];
}

describe("localDate", () => {
  it("usa el día de Chile, no el del servidor", () => {
    expect(localDate(NOW)).toBe("2026-11-14");
    expect(localDate(new Date("2026-11-15T03:00:00Z"))).toBe("2026-11-15");
  });
});

describe("createCircleWithTemplate", () => {
  it("con diálisis crea el círculo, la cuidadora y un recordatorio por ítem de la plantilla", async () => {
    const user = await createTestUser({ consents: true });
    const result = await createCircleWithTemplate(
      user.client,
      user.userId,
      INPUT,
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const { circleId, templateItems } = result.data;
    const expected = await templateItemsOf("dialisis");
    expect(expected.length).toBeGreaterThan(0);
    expect(templateItems).toBe(expected.length);

    const admin = adminClient();
    const circles = await admin
      .from("circles")
      .select("id, cared_name, relation, care_type, created_by")
      .eq("created_by", user.userId);
    expect(circles.data).toEqual([
      {
        id: circleId,
        cared_name: "Rosa",
        relation: "mi mamá",
        care_type: "dialisis",
        created_by: user.userId,
      },
    ]);

    const members = await admin
      .from("circle_members")
      .select("user_id, role, display_name")
      .eq("circle_id", circleId);
    expect(members.data).toEqual([
      { user_id: user.userId, role: "caregiver", display_name: "Marta" },
    ]);

    const reminders = await admin
      .from("reminders")
      .select("title, kind, source, rule, created_by, advance_days, active")
      .eq("circle_id", circleId);
    expect(reminders.data).toHaveLength(expected.length);
    expect(reminders.data?.map((row) => row.title).sort()).toEqual(
      expected.map((item) => item.title).sort(),
    );
    for (const reminder of reminders.data ?? []) {
      expect(reminder.source).toBe("template");
      expect(reminder.created_by).toBe(user.userId);
      expect(reminder.active).toBe(true);
      const rule = ruleSchema.safeParse(reminder.rule);
      expect(rule.success, JSON.stringify(reminder.rule)).toBe(true);
      expect(rule.data?.startDate).toBe("2026-11-14");
    }
    const session = reminders.data?.find(
      (row) => row.title === "Sesión de diálisis",
    );
    expect(session?.rule).toMatchObject({
      freq: "weekly",
      weekdays: [1, 3, 5],
    });

    const profile = await admin
      .from("profiles")
      .select("display_name, onboarding_completed_at")
      .eq("id", user.userId)
      .single();
    expect(profile.data?.display_name).toBe("Marta");
    expect(
      new Date(profile.data?.onboarding_completed_at ?? "").toISOString(),
    ).toBe(NOW.toISOString());
  });

  it("con «desde cero» crea el círculo sin recordatorios", async () => {
    const user = await createTestUser({ consents: true });
    const result = await createCircleWithTemplate(user.client, user.userId, {
      ...INPUT,
      careType: "desde_cero",
    });
    expect(result).toMatchObject({ ok: true, data: { templateItems: 0 } });
    if (!result.ok) {
      return;
    }
    const reminders = await adminClient()
      .from("reminders")
      .select("id")
      .eq("circle_id", result.data.circleId);
    expect(reminders.data).toEqual([]);
  });

  for (const [label, patch] of [
    ["nombre de la persona vacío", { caredName: "   " }],
    [
      "nombre de la persona de más de 60 caracteres",
      { caredName: "x".repeat(61) },
    ],
    ["relación vacía", { relation: "" }],
    ["tipo de cuidado desconocido", { careType: "otro_tipo" }],
    ["sin tu nombre", { displayName: "" }],
  ] as const) {
    it(`con ${label} responde validation_failed y no crea nada`, async () => {
      const user = await createTestUser({ consents: true });
      const result = await createCircleWithTemplate(user.client, user.userId, {
        ...INPUT,
        ...patch,
      });
      expect(result).toMatchObject({
        ok: false,
        error: { code: "validation_failed" },
      });
      expect(await listMyCircles(user.client)).toEqual([]);
    });
  }

  it("sin consentimientos responde forbidden y no crea nada", async () => {
    const user = await createTestUser();
    const result = await createCircleWithTemplate(
      user.client,
      user.userId,
      INPUT,
    );
    expect(result).toMatchObject({ ok: false, error: { code: "forbidden" } });
    expect(await listMyCircles(user.client)).toEqual([]);
  });

  it("la misma cuidadora puede crear un segundo círculo", async () => {
    const user = await createTestUser({ consents: true });
    const first = await createCircleWithTemplate(user.client, user.userId, {
      ...INPUT,
      careType: "desde_cero",
    });
    const second = await createCircleWithTemplate(user.client, user.userId, {
      ...INPUT,
      caredName: "Tía Sole",
      relation: "mi tía",
      careType: "adulto_mayor",
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }

    const circles = await listMyCircles(user.client);
    expect(circles.map((circle) => circle.caredName)).toEqual([
      "Rosa",
      "Tía Sole",
    ]);

    expect((await resolveActiveCircle(user.client))?.id).toBe(
      first.data.circleId,
    );
    expect(
      (await resolveActiveCircle(user.client, second.data.circleId))?.id,
    ).toBe(second.data.circleId);

    // Un id ajeno o inventado cae en el primero propio.
    const other = await createTestUser({ consents: true });
    const foreign = await createCircleWithTemplate(other.client, other.userId, {
      ...INPUT,
      careType: "desde_cero",
    });
    expect(foreign.ok).toBe(true);
    if (foreign.ok) {
      expect(
        (await resolveActiveCircle(user.client, foreign.data.circleId))?.id,
      ).toBe(first.data.circleId);
    }
  });

  it("sin círculos, resolveActiveCircle devuelve null", async () => {
    const user = await createTestUser({ consents: true });
    expect(await resolveActiveCircle(user.client)).toBeNull();
  });
});

describe("eventos de la bienvenida", () => {
  async function eventsOf(userId: string) {
    const admin = adminClient();
    const profile = await admin
      .from("profiles")
      .select("pseudonym_id")
      .eq("id", userId)
      .single();
    const { data } = await admin
      .from("events")
      .select("name, props")
      .eq("pseudonym_id", profile.data?.pseudonym_id ?? "");
    return data ?? [];
  }

  it("con consentimiento de investigación guarda un flow.completed de onboarding", async () => {
    const user = await createTestUser({ consents: true });
    await grantResearch(user.client, user.userId);
    const result = await createCircleWithTemplate(user.client, user.userId, {
      ...INPUT,
      durationMs: 95_000,
    });
    expect(result.ok).toBe(true);

    const events = await eventsOf(user.userId);
    const completed = events.filter((event) => event.name === "flow.completed");
    expect(completed).toEqual([
      {
        name: "flow.completed",
        props: { flow: "onboarding", duration_ms: 95_000 },
      },
    ]);
    const expected = await templateItemsOf("dialisis");
    expect(
      events.filter((event) => event.name === "onboarding.completed"),
    ).toEqual([
      {
        name: "onboarding.completed",
        props: { care_type: "dialisis", template_items: expected.length },
      },
    ]);
  });

  it("sin consentimiento de investigación no guarda eventos", async () => {
    const user = await createTestUser({ consents: true });
    const result = await createCircleWithTemplate(
      user.client,
      user.userId,
      INPUT,
    );
    expect(result.ok).toBe(true);
    expect(await eventsOf(user.userId)).toEqual([]);
  });
});
