import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/cron/daily/route";
import { grantResearch } from "@/server/consents/consents";
import type { MailMessage } from "@/server/email/resend";
import { resendMailer } from "@/server/email/resend";
import { track } from "@/server/events/track";
import {
  type DailyResult,
  INACTIVITY_SUBJECT,
  runDaily,
} from "@/server/jobs/daily";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

// OJO: estas pruebas corren sobre la base local compartida. `runDaily` siempre
// recibe la hora real y lo que se mueve al pasado son las fechas de UNA usuaria
// de prueba: así nunca se borra por accidente a otra cuenta.

const admin = adminClient();
const DAY = 86_400_000;
const NOW = new Date();

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * DAY).toISOString();
}

/** Un cartero falso que guarda lo que "envió". */
function fakeMailer(sent = true) {
  const outbox: MailMessage[] = [];
  return {
    outbox,
    mailer: async (message: MailMessage) => {
      outbox.push(message);
      return { sent };
    },
    to(email: string) {
      return outbox.filter((message) => message.to === email);
    },
  };
}

async function run(mailer = fakeMailer()): Promise<DailyResult> {
  const result = await runDaily({ admin, now: NOW, mailer: mailer.mailer });
  expect(result.skipped).toBeUndefined();
  return result;
}

async function setProfile(
  userId: string,
  values: {
    last_active_at?: string;
    inactivity_notice_sent_at?: string | null;
    deletion_requested_at?: string | null;
    deactivated_at?: string | null;
    is_admin?: boolean;
  },
) {
  const { error } = await admin
    .from("profiles")
    .update(values)
    .eq("id", userId);
  expect(error).toBeNull();
}

async function profileOf(userId: string) {
  const { data } = await admin
    .from("profiles")
    .select("id, last_active_at, inactivity_notice_sent_at")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

async function authUserExists(userId: string): Promise<boolean> {
  const { data } = await admin.auth.admin.getUserById(userId);
  return Boolean(data.user);
}

/** Una usuaria con un poco de todo, para comprobar que el borrado no deja nada. */
async function seededUser(): Promise<{
  user: TestUser;
  circleId: string;
  pseudonym: string;
}> {
  const user = await createTestUser({ consents: true });
  const circleId = await createCircleFor(user.client, "Marta");
  const reminder = await user.client
    .from("reminders")
    .insert({
      circle_id: circleId,
      created_by: user.userId,
      kind: "custom",
      title: "Regar las plantas",
      rule: { freq: "daily", times: ["08:00"], startDate: "2026-11-01" },
    })
    .select("id")
    .single();
  expect(reminder.error).toBeNull();
  const occurrence = await admin.from("reminder_occurrences").insert({
    reminder_id: reminder.data?.id ?? "",
    circle_id: circleId,
    due_at: "2026-11-14T11:00:00Z",
    event_at: "2026-11-14T11:00:00Z",
    local_date: "2026-11-14",
  });
  expect(occurrence.error).toBeNull();
  const journal = await user.client.from("journal_entries").insert({
    circle_id: circleId,
    author_id: user.userId,
    entry_date: "2026-11-14",
    day_rating: "regular",
  });
  expect(journal.error).toBeNull();
  const checkin = await user.client.from("selfcare_checkins").insert({
    user_id: user.userId,
    checkin_date: "2026-11-14",
    score: 3,
  });
  expect(checkin.error).toBeNull();
  const push = await admin.from("push_subscriptions").insert({
    user_id: user.userId,
    endpoint: `https://fcm.googleapis.com/fcm/send/${randomUUID()}`,
    p256dh: "clave-publica",
    auth: "secreto",
  });
  expect(push.error).toBeNull();
  await grantResearch(user.client, user.userId);
  await track(user.client, user.userId, "flow.completed", {
    flow: "journal",
    duration_ms: 1000,
  });
  const profile = await admin
    .from("profiles")
    .select("pseudonym_id")
    .eq("id", user.userId)
    .single();
  return { user, circleId, pseudonym: profile.data?.pseudonym_id ?? "" };
}

/** Cuántas filas quedan de esa usuaria en cada tabla. */
async function footprint(seed: {
  user: TestUser;
  circleId: string;
  pseudonym: string;
}): Promise<Record<string, number>> {
  const count = async (
    table:
      | "profiles"
      | "circles"
      | "reminders"
      | "reminder_occurrences"
      | "journal_entries"
      | "selfcare_checkins"
      | "push_subscriptions"
      | "events",
    column: string,
    value: string,
  ) => {
    const { count: total, error } = await admin
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(column, value);
    expect(error).toBeNull();
    return total ?? -1;
  };
  return {
    profiles: await count("profiles", "id", seed.user.userId),
    circles: await count("circles", "id", seed.circleId),
    reminders: await count("reminders", "circle_id", seed.circleId),
    reminder_occurrences: await count(
      "reminder_occurrences",
      "circle_id",
      seed.circleId,
    ),
    journal_entries: await count("journal_entries", "circle_id", seed.circleId),
    selfcare_checkins: await count(
      "selfcare_checkins",
      "user_id",
      seed.user.userId,
    ),
    push_subscriptions: await count(
      "push_subscriptions",
      "user_id",
      seed.user.userId,
    ),
    events: await count("events", "pseudonym_id", seed.pseudonym),
  };
}

const NOTHING = {
  profiles: 0,
  circles: 0,
  reminders: 0,
  reminder_occurrences: 0,
  journal_entries: 0,
  selfcare_checkins: 0,
  push_subscriptions: 0,
  events: 0,
};

describe("runDaily · borrado pedido por la usuaria", () => {
  it("a los 8 días borra la cuenta y todo lo suyo; a los 6 días no toca nada", async () => {
    const old = await seededUser();
    const recent = await seededUser();
    const before = await footprint(recent);
    expect(Object.values(await footprint(old)).every((n) => n >= 1)).toBe(true);
    await setProfile(old.user.userId, {
      deletion_requested_at: daysAgo(8),
      deactivated_at: daysAgo(8),
    });
    await setProfile(recent.user.userId, {
      deletion_requested_at: daysAgo(6),
      deactivated_at: daysAgo(6),
    });

    const result = await run();
    expect(result.deleted).toBeGreaterThanOrEqual(1);

    expect(await footprint(old)).toEqual(NOTHING);
    expect(await authUserExists(old.user.userId)).toBe(false);

    expect(await footprint(recent)).toEqual(before);
    expect(await authUserExists(recent.user.userId)).toBe(true);
  });

  it("no borra a quien recuperó su cuenta", async () => {
    const seed = await seededUser();
    // Pidió el borrado hace 8 días, pero lo deshizo: las columnas quedaron vacías.
    await setProfile(seed.user.userId, {
      deletion_requested_at: null,
      deactivated_at: null,
    });
    await run();
    expect(await authUserExists(seed.user.userId)).toBe(true);
    expect((await footprint(seed)).profiles).toBe(1);
  });
});

describe("runDaily · inactividad", () => {
  it("a los 11 meses envía un solo aviso y lo deja anotado; el segundo turno no repite", async () => {
    const user = await createTestUser({ consents: true });
    await setProfile(user.userId, { last_active_at: daysAgo(336) });

    const first = fakeMailer();
    const result = await run(first);
    expect(result.notified).toBeGreaterThanOrEqual(1);
    const mine = first.to(user.email);
    expect(mine).toHaveLength(1);
    expect(mine[0].subject).toBe(INACTIVITY_SUBJECT);
    expect(mine[0].subject).toBe("Tu cuenta de Sole se borrará en 30 días");
    expect(mine[0].text).toContain("entrar una vez");
    expect(mine[0].text).toContain("/entrar");
    const profile = await profileOf(user.userId);
    expect(new Date(profile?.inactivity_notice_sent_at ?? 0).getTime()).toBe(
      NOW.getTime(),
    );

    const second = fakeMailer();
    await run(second);
    expect(second.to(user.email)).toHaveLength(0);
    // Avisar no es borrar.
    expect(await authUserExists(user.userId)).toBe(true);
  });

  it("a los 10 meses no avisa", async () => {
    const user = await createTestUser({ consents: true });
    await setProfile(user.userId, { last_active_at: daysAgo(300) });
    const mail = fakeMailer();
    await run(mail);
    expect(mail.to(user.email)).toHaveLength(0);
    expect(
      (await profileOf(user.userId))?.inactivity_notice_sent_at,
    ).toBeNull();
  });

  it("si el correo no sale, no anota el aviso y lo reintenta al otro día", async () => {
    const user = await createTestUser({ consents: true });
    await setProfile(user.userId, { last_active_at: daysAgo(340) });

    const failing = fakeMailer(false);
    const result = await run(failing);
    expect(failing.to(user.email)).toHaveLength(1);
    expect(result.errors).toBeGreaterThanOrEqual(1);
    expect(
      (await profileOf(user.userId))?.inactivity_notice_sent_at,
    ).toBeNull();

    const working = fakeMailer();
    await run(working);
    expect(working.to(user.email)).toHaveLength(1);
  });

  it("a los 12 meses borra solo a quien fue avisada hace 30 días o más", async () => {
    const noticed = await seededUser();
    const noNotice = await createTestUser({ consents: true });
    const lateNotice = await createTestUser({ consents: true });
    await setProfile(noticed.user.userId, {
      last_active_at: daysAgo(366),
      inactivity_notice_sent_at: daysAgo(31),
    });
    await setProfile(noNotice.userId, { last_active_at: daysAgo(400) });
    await setProfile(lateNotice.userId, {
      last_active_at: daysAgo(366),
      inactivity_notice_sent_at: daysAgo(29),
    });

    const mail = fakeMailer();
    const result = await run(mail);
    expect(result.purgedInactive).toBeGreaterThanOrEqual(1);

    expect(await footprint(noticed)).toEqual(NOTHING);
    expect(await authUserExists(noticed.user.userId)).toBe(false);

    // Sin aviso previo no se borra: en este turno recién recibe el aviso.
    expect(await authUserExists(noNotice.userId)).toBe(true);
    expect(mail.to(noNotice.email)).toHaveLength(1);
    // Avisada hace 29 días: todavía no.
    expect(await authUserExists(lateNotice.userId)).toBe(true);
    expect(mail.to(lateNotice.email)).toHaveLength(0);
  });

  it("quien volvió a entrar después del aviso no se borra, y si deja de entrar recibe un aviso nuevo", async () => {
    const user = await createTestUser({ consents: true });
    // Fue avisada hace 500 días, volvió a entrar hace 400 y no ha vuelto.
    await setProfile(user.userId, {
      inactivity_notice_sent_at: daysAgo(500),
      last_active_at: daysAgo(400),
    });
    const mail = fakeMailer();
    await run(mail);
    expect(await authUserExists(user.userId)).toBe(true);
    expect(mail.to(user.email)).toHaveLength(1);
    // Y con el aviso recién enviado tampoco se borra en el turno siguiente.
    await run();
    expect(await authUserExists(user.userId)).toBe(true);
  });

  it("no avisa ni borra por inactividad a quien administra el panel", async () => {
    const user = await createTestUser({ consents: true });
    await setProfile(user.userId, {
      is_admin: true,
      last_active_at: daysAgo(400),
      inactivity_notice_sent_at: daysAgo(40),
    });
    const mail = fakeMailer();
    await run(mail);
    expect(await authUserExists(user.userId)).toBe(true);
    expect(mail.to(user.email)).toHaveLength(0);
    // Limpieza: no dejar una cuenta de prueba con rol de administración.
    await setProfile(user.userId, { is_admin: false });
    await admin.auth.admin.deleteUser(user.userId);
  });
});

describe("runDaily · turnos", () => {
  it("devuelve conteos y limpia los contadores de límite; dos turnos a la vez no se pisan", async () => {
    const [a, b] = await Promise.all([
      runDaily({ admin, now: NOW, mailer: fakeMailer().mailer }),
      runDaily({ admin, now: NOW, mailer: fakeMailer().mailer }),
    ]);
    const ran = [a, b].filter((result) => !result.skipped);
    expect(ran.length).toBeGreaterThanOrEqual(1);
    for (const result of ran) {
      expect(result.rateLimitsCleaned).toBeGreaterThanOrEqual(0);
      expect(Object.keys(result).sort()).toEqual(
        [
          "deleted",
          "errors",
          "notified",
          "purgedInactive",
          "rateLimitsCleaned",
        ].sort(),
      );
    }
    // El bloqueo quedó libre para el turno siguiente.
    expect((await run()).skipped).toBeUndefined();
  });
});

describe("resendMailer", () => {
  it("sin clave de Resend no envía y lo dice", async () => {
    const previous = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    try {
      const result = await resendMailer()({
        to: "nadie@example.test",
        subject: "x",
        text: "x",
      });
      expect(result).toEqual({ sent: false });
    } finally {
      if (previous !== undefined) {
        process.env.RESEND_API_KEY = previous;
      }
    }
  });
});

describe("POST /api/cron/daily", () => {
  it("sin el secreto correcto responde 401", async () => {
    const attempts: Record<string, string>[] = [
      {},
      { "x-cron-secret": "incorrecto" },
    ];
    for (const headers of attempts) {
      const response = await POST(
        new Request("http://localhost:3000/api/cron/daily", {
          method: "POST",
          headers,
        }),
      );
      expect(response.status).toBe(401);
      expect((await response.json()).error.code).toBe("unauthorized");
    }
  });
});
