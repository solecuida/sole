import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  computeMetrics,
  type EventRow,
  loadMetricRows,
  type MetricRows,
  type ProfileRow,
} from "@/server/admin/metrics";
import { totp } from "../support/totp";
import { adminClient, createTestUser, type TestUser } from "./helpers";

const admin = adminClient();
const NOW = new Date("2026-11-15T18:00:00Z");
const NO_FILTER = { org: null, cohort: null };

async function createAdminUser(mfa: boolean): Promise<TestUser> {
  const user = await createTestUser({ consents: true });
  await admin.from("profiles").update({ is_admin: true }).eq("id", user.userId);
  if (mfa) {
    const enrolled = await user.client.auth.mfa.enroll({ factorType: "totp" });
    const verified = await user.client.auth.mfa.challengeAndVerify({
      factorId: enrolled.data?.id ?? "",
      code: totp(enrolled.data?.totp.secret ?? ""),
    });
    expect(verified.error).toBeNull();
  }
  return user;
}

function profile(n: string, org: string | null, createdAt: string): ProfileRow {
  return {
    id: `user-${n}`,
    pseudonym_id: `pseudo-${n}`,
    org_code: org,
    created_at: createdAt,
  };
}

function event(
  n: string,
  name: string,
  createdAt: string,
  props: EventRow["props"] = {},
  org: string | null = null,
): EventRow {
  return {
    pseudonym_id: `pseudo-${n}`,
    name,
    props,
    org_code: org,
    created_at: createdAt,
  };
}

function rowsOf(parts: Partial<MetricRows>): MetricRows {
  return {
    profiles: [],
    events: [],
    surveys: [],
    doors: [],
    truncated: false,
    ...parts,
  };
}

describe("computeMetrics", () => {
  it("H1: dos usuarias activas 5 y 3 días distintos de una semana dan 4 días por semana", () => {
    // Semana del lunes 9 al domingo 15 de noviembre de 2026.
    const days = ["09", "10", "11", "12", "13"];
    const events = [
      ...days.map((d) => event("a", "app.opened", `2026-11-${d}T15:00:00Z`)),
      // Dos aperturas el mismo día cuentan una sola vez.
      event("a", "app.opened", "2026-11-09T16:00:00Z"),
      ...["09", "11", "13"].map((d) =>
        event("b", "app.opened", `2026-11-${d}T15:00:00Z`),
      ),
    ];
    const metrics = computeMetrics(
      rowsOf({
        profiles: [
          profile("a", null, "2026-11-01T15:00:00Z"),
          profile("b", null, "2026-11-01T15:00:00Z"),
        ],
        events,
      }),
      NO_FILTER,
      NOW,
    );
    expect(metrics.h1.avgActiveDaysPerWeek).toBe(4);
    expect(metrics.h1.activeUsers).toBe(2);
  });

  it("H1: retención en la semana 1 por cohorte, solo con cohortes que ya cumplieron", () => {
    const metrics = computeMetrics(
      rowsOf({
        profiles: [
          profile("a", null, "2026-11-02T15:00:00Z"), // semana del 2 de nov
          profile("b", null, "2026-11-02T15:00:00Z"),
          profile("c", null, "2026-11-10T15:00:00Z"), // esta semana: aún no cumple la 1
        ],
        events: [event("a", "app.opened", "2026-11-10T15:00:00Z")],
      }),
      NO_FILTER,
      NOW,
    );
    const week1 = metrics.h1.retention.find((p) => p.week === 1);
    expect(week1).toEqual({ week: 1, eligible: 2, retained: 1, rate: 0.5 });
    expect(metrics.h1.retention.find((p) => p.week === 4)?.rate).toBeNull();
  });

  it("H2: la mediana de 10000, 12000 y 20000 ms de journal es 12000", () => {
    const events = [10_000, 12_000, 20_000].map((ms, i) =>
      event(`u${i}`, "flow.completed", "2026-11-10T15:00:00Z", {
        flow: "journal",
        duration_ms: ms,
      }),
    );
    const metrics = computeMetrics(rowsOf({ events }), NO_FILTER, NOW);
    expect(metrics.h2.flows.find((f) => f.flow === "journal")?.medianMs).toBe(
      12_000,
    );
  });

  it("H2: tasa de abandono = abandonados / empezados", () => {
    const at = "2026-11-10T15:00:00Z";
    const events = [
      event("a", "flow.started", at, { flow: "journal" }),
      event("b", "flow.started", at, { flow: "journal" }),
      event("c", "flow.started", at, { flow: "journal" }),
      event("d", "flow.started", at, { flow: "journal" }),
      event("a", "flow.abandoned", at, { flow: "journal", step: 1 }),
    ];
    const metrics = computeMetrics(rowsOf({ events }), NO_FILTER, NOW);
    expect(
      metrics.h2.flows.find((f) => f.flow === "journal")?.abandonRate,
    ).toBe(0.25);
  });

  it("H3: dos «Muy decepcionada» y tres «Algo decepcionada» dan 0.4", () => {
    const answers = [
      "muy_decepcionada",
      "muy_decepcionada",
      "algo_decepcionada",
      "algo_decepcionada",
      "algo_decepcionada",
    ];
    const metrics = computeMetrics(
      rowsOf({
        profiles: answers.map((_, i) =>
          profile(String(i), null, "2026-10-01T15:00:00Z"),
        ),
        surveys: [
          ...answers.map((answer, i) => ({
            user_id: `user-${i}`,
            survey_key: "d28",
            answers: { answer },
            dismissed: false,
          })),
          // Una descartada no cuenta.
          {
            user_id: "user-0",
            survey_key: "d28",
            answers: {},
            dismissed: true,
          },
        ],
      }),
      NO_FILTER,
      NOW,
    );
    expect(metrics.h3.answered).toBe(5);
    expect(metrics.h3.shares.muy_decepcionada).toBe(0.4);
  });

  it("filtrar por org = DEMO-LOCAL cuenta solo los eventos de ese código", () => {
    const events = [
      event(
        "a",
        "invitation.created",
        "2026-11-10T15:00:00Z",
        {},
        "DEMO-LOCAL",
      ),
      event(
        "b",
        "invitation.created",
        "2026-11-10T15:00:00Z",
        {},
        "DEMO-LOCAL",
      ),
      event("c", "invitation.created", "2026-11-10T15:00:00Z", {}, "OTRA-ORG"),
      event("d", "invitation.created", "2026-11-10T15:00:00Z", {}, null),
    ];
    const rows = rowsOf({ events });
    expect(
      computeMetrics(rows, { org: "DEMO-LOCAL", cohort: null }, NOW).h5
        .invitations,
    ).toBe(2);
    expect(computeMetrics(rows, NO_FILTER, NOW).h5.invitations).toBe(4);
  });

  it("H4 y H6: puertas falsas y altas por organización, sin ids en la salida", () => {
    const metrics = computeMetrics(
      rowsOf({
        profiles: [
          profile("a", "ORG-A", "2026-11-01T15:00:00Z"),
          profile("b", null, "2026-11-01T15:00:00Z"),
        ],
        doors: [
          {
            user_id: "user-a",
            door_key: "plan_familiar",
            choice: "4990",
            notify_me: true,
          },
          {
            user_id: "user-b",
            door_key: "plan_familiar",
            choice: null,
            notify_me: false,
          },
        ],
        events: [
          event("a", "premium.used", "2026-11-10T15:00:00Z", {
            feature: "informe_medico",
          }),
        ],
      }),
      NO_FILTER,
      NOW,
    );
    const plan = metrics.h4.doors.find((d) => d.door === "plan_familiar");
    expect(plan?.interested).toBe(1);
    expect(plan?.choices["4990"]).toBe(1);
    expect(metrics.h4.premiumUsed).toBe(1);
    expect(metrics.h6.map((o) => [o.org, o.signups])).toEqual([
      [null, 1],
      ["ORG-A", 1],
    ]);
    expect(JSON.stringify(metrics)).not.toContain("user-");
    expect(JSON.stringify(metrics)).not.toContain("pseudo-");
  });
});

describe("loadMetricRows", () => {
  async function seedOrg() {
    const code = `T${randomUUID().slice(0, 8).toUpperCase()}`;
    const created = await admin
      .from("organizations")
      .insert({ code, name: "Organización de prueba", kind: "otro" });
    expect(created.error).toBeNull();
    const member = await createTestUser({ consents: true });
    await admin
      .from("profiles")
      .update({ org_code: code })
      .eq("id", member.userId);
    const { data } = await admin
      .from("profiles")
      .select("pseudonym_id")
      .eq("id", member.userId)
      .single();
    const pseudonym = data?.pseudonym_id ?? "";
    const inserted = await admin.from("events").insert([
      {
        pseudonym_id: pseudonym,
        name: "app.opened",
        org_code: code,
        props: { screen: "hoy" },
      },
      {
        pseudonym_id: pseudonym,
        name: "invitation.created",
        org_code: code,
        props: {},
      },
    ]);
    expect(inserted.error).toBeNull();
    return { code, pseudonym };
  }

  it("un admin con segundo factor lee los eventos de su organización y las métricas salen", async () => {
    const { code, pseudonym } = await seedOrg();
    const boss = await createAdminUser(true);
    const loaded = await loadMetricRows(boss.client, {
      org: code,
      cohort: null,
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }
    expect(loaded.data.events).toHaveLength(2);
    expect(loaded.data.events.every((e) => e.org_code === code)).toBe(true);

    const metrics = computeMetrics(
      loaded.data,
      { org: code, cohort: null },
      new Date(),
    );
    expect(metrics.users).toBe(1);
    expect(metrics.h5.invitations).toBe(1);
    expect(metrics.h1.activeUsers).toBe(1);
    // Nada identificable en lo que se muestra.
    expect(JSON.stringify(metrics)).not.toContain(pseudonym);
  });

  it("una usuaria común lee cero eventos", async () => {
    const { code } = await seedOrg();
    const user = await createTestUser({ consents: true });
    const loaded = await loadMetricRows(user.client, {
      org: code,
      cohort: null,
    });
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.events).toHaveLength(0);
    }
  });

  it("un admin sin segundo factor lee cero eventos", async () => {
    const { code } = await seedOrg();
    const boss = await createAdminUser(false);
    const loaded = await loadMetricRows(boss.client, {
      org: code,
      cohort: null,
    });
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.data.events).toHaveLength(0);
    }
  });
});
