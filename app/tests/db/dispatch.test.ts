import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/cron/dispatch/route";
import { encryptField } from "@/lib/crypto/field";
import type { PushPayload, PushSender, PushTarget } from "@/server/push/send";
import { runDispatch } from "@/server/reminders/dispatch";
import { zonedInstant } from "@/server/reminders/recurrence";
import { adminClient, createCircleFor, createTestUser } from "./helpers";

const TZ = "America/Santiago";
const MINUTE = 60_000;
const admin = adminClient();

/** Emisor falso: anota lo que se enviaría. Solo interesa lo de esta prueba. */
function fakeSender(statusFor: (endpoint: string) => number = () => 201) {
  const sent: { endpoint: string; payload: PushPayload }[] = [];
  const sender: PushSender = async (target: PushTarget, payload) => {
    sent.push({ endpoint: target.endpoint, payload });
    return { statusCode: statusFor(target.endpoint) };
  };
  return { sender, sent };
}

/** Cada prueba usa su propio día, para no cruzarse con las demás. */
let dayOffset = 0;
function nextDay(): string {
  dayOffset += 1;
  return `2027-05-${String(dayOffset).padStart(2, "0")}`;
}

async function setup(options: { followupMinutes?: number } = {}) {
  const user = await createTestUser({ consents: true });
  const circleId = await createCircleFor(user.client, "Marta");
  if (options.followupMinutes) {
    await admin
      .from("profiles")
      .update({ followup_minutes: options.followupMinutes })
      .eq("id", user.userId);
  }
  const endpoints = [0, 1].map(
    () => `https://push.example.test/${randomUUID()}`,
  );
  const subscriptions = await admin.from("push_subscriptions").insert(
    endpoints.map((endpoint) => ({
      user_id: user.userId,
      endpoint,
      p256dh: "clave-publica",
      auth: "secreto",
    })),
  );
  expect(subscriptions.error).toBeNull();
  return { user, circleId, endpoints };
}

async function addReminder(
  circleId: string,
  userId: string,
  day: string,
  fields: Record<string, unknown> = {},
) {
  const { data, error } = await admin
    .from("reminders")
    .insert({
      circle_id: circleId,
      created_by: userId,
      kind: "custom",
      title: "Regar las plantas",
      rule: { freq: "once", date: day, times: ["08:00"], startDate: day },
      ...fields,
    } as never)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`recordatorio: ${error?.message}`);
  }
  return data.id;
}

async function occurrenceOf(reminderId: string) {
  const { data } = await admin
    .from("reminder_occurrences")
    .select("id, status, notified_at, followup_sent_at, snoozed_until")
    .eq("reminder_id", reminderId)
    .eq("kind", "main")
    .single();
  if (!data) {
    throw new Error("ocurrencia no encontrada");
  }
  return data;
}

const mine = (
  sent: { endpoint: string; payload: PushPayload }[],
  endpoints: string[],
) => sent.filter((item) => endpoints.includes(item.endpoint));

describe("runDispatch: aviso a la hora", () => {
  it("a las 08:00:30 envía un aviso por suscripción y no repite en el turno siguiente", async () => {
    const { user, circleId, endpoints } = await setup();
    const day = nextDay();
    const reminderId = await addReminder(circleId, user.userId, day);
    const at = zonedInstant(day, "08:00", TZ);
    const now = new Date(at.getTime() + 30_000);

    const first = fakeSender();
    const result = await runDispatch({ admin, now, sender: first.sender });
    expect(result.skipped).toBeUndefined();
    expect(result.notified).toBeGreaterThanOrEqual(1);

    const delivered = mine(first.sent, endpoints);
    expect(delivered.map((item) => item.endpoint).sort()).toEqual(
      [...endpoints].sort(),
    );
    const occurrence = await occurrenceOf(reminderId);
    expect(delivered[0].payload).toEqual({
      title: "Regar las plantas",
      body: "Es ahora, a las 08:00. Toca para marcarlo.",
      url: `/hoy?c=${circleId}`,
      tag: `occ-${occurrence.id}`,
      occurrenceId: occurrence.id,
      urgent: false,
    });
    expect(new Date(occurrence.notified_at ?? "").toISOString()).toBe(
      now.toISOString(),
    );

    const subscriptions = await admin
      .from("push_subscriptions")
      .select("last_success_at")
      .eq("user_id", user.userId);
    expect(subscriptions.data?.every((row) => row.last_success_at)).toBe(true);

    const second = fakeSender();
    await runDispatch({
      admin,
      now: new Date(now.getTime() + MINUTE),
      sender: second.sender,
    });
    expect(mine(second.sent, endpoints)).toEqual([]);
  });

  it("antes de la hora no envía nada", async () => {
    const { user, circleId, endpoints } = await setup();
    const day = nextDay();
    await addReminder(circleId, user.userId, day);
    const { sender, sent } = fakeSender();
    await runDispatch({
      admin,
      now: new Date(zonedInstant(day, "08:00", TZ).getTime() - MINUTE),
      sender,
    });
    expect(mine(sent, endpoints)).toEqual([]);
  });

  it("el aviso de un medicamento no lleva su nombre ni su indicación", async () => {
    const { user, circleId, endpoints } = await setup();
    const day = nextDay();
    await addReminder(circleId, user.userId, day, {
      kind: "medication",
      importance: "important",
      title: "Remedio de la mañana",
      med_name_enc: encryptField("Losartán", "reminders.med_name"),
      med_instructions_enc: encryptField(
        "1 pastilla con el desayuno",
        "reminders.med_instructions",
      ),
    });
    const at = zonedInstant(day, "08:00", TZ);

    const first = fakeSender();
    await runDispatch({ admin, now: at, sender: first.sender });
    const followup = fakeSender();
    await runDispatch({
      admin,
      now: new Date(at.getTime() + 15 * MINUTE),
      sender: followup.sender,
    });

    const all = [
      ...mine(first.sent, endpoints),
      ...mine(followup.sent, endpoints),
    ];
    expect(all.length).toBe(4);
    const serialized = JSON.stringify(all);
    expect(serialized).not.toContain("Losart");
    expect(serialized).not.toContain("pastilla");
    expect(all[0].payload.title).toBe("Remedio de la mañana");
    expect(all[0].payload.urgent).toBe(true);
  });

  it("un aviso previo dice cuántos días faltan", async () => {
    const { user, circleId, endpoints } = await setup();
    const day = nextDay();
    const [year, month, date] = day.split("-").map(Number);
    const eventDay = new Date(Date.UTC(year, month - 1, date + 1))
      .toISOString()
      .slice(0, 10);
    await addReminder(circleId, user.userId, day, {
      kind: "appointment",
      title: "Control mensual",
      rule: {
        freq: "once",
        date: eventDay,
        times: ["15:00"],
        startDate: day,
      },
      advance_days: [1],
    });
    const { sender, sent } = fakeSender();
    await runDispatch({
      admin,
      now: zonedInstant(day, "09:00", TZ),
      sender,
    });
    const delivered = mine(sent, endpoints);
    expect(delivered).toHaveLength(2);
    expect(delivered[0].payload.title).toBe("Control mensual");
    expect(delivered[0].payload.body).toBe("Es mañana, a las 15:00.");
  });
});

describe("runDispatch: ¿Lo hiciste?", () => {
  it("a los 15 minutos sin respuesta envía un seguimiento con sus dos botones", async () => {
    const { user, circleId, endpoints } = await setup({ followupMinutes: 15 });
    const day = nextDay();
    const reminderId = await addReminder(circleId, user.userId, day);
    const at = zonedInstant(day, "08:00", TZ);
    await runDispatch({ admin, now: at, sender: fakeSender().sender });

    const early = fakeSender();
    await runDispatch({
      admin,
      now: new Date(at.getTime() + 14 * MINUTE),
      sender: early.sender,
    });
    expect(mine(early.sent, endpoints)).toEqual([]);

    const onTime = fakeSender();
    const now = new Date(at.getTime() + 15 * MINUTE);
    const result = await runDispatch({ admin, now, sender: onTime.sender });
    expect(result.followups).toBeGreaterThanOrEqual(1);

    const delivered = mine(onTime.sent, endpoints);
    expect(delivered).toHaveLength(2);
    const occurrence = await occurrenceOf(reminderId);
    expect(delivered[0].payload).toEqual({
      title: "¿Lo hiciste?",
      body: "Regar las plantas",
      url: `/hoy?c=${circleId}`,
      tag: `occ-${occurrence.id}`,
      occurrenceId: occurrence.id,
      actions: [
        { action: "done", title: "Sí, listo" },
        { action: "not_done", title: "No" },
      ],
      urgent: false,
    });
    expect(new Date(occurrence.followup_sent_at ?? "").toISOString()).toBe(
      now.toISOString(),
    );

    const later = fakeSender();
    await runDispatch({
      admin,
      now: new Date(at.getTime() + 30 * MINUTE),
      sender: later.sender,
    });
    expect(mine(later.sent, endpoints)).toEqual([]);
  });

  it("respeta los minutos que eligió la cuidadora", async () => {
    const { user, circleId, endpoints } = await setup({ followupMinutes: 30 });
    const day = nextDay();
    await addReminder(circleId, user.userId, day);
    const at = zonedInstant(day, "08:00", TZ);
    await runDispatch({ admin, now: at, sender: fakeSender().sender });

    const at15 = fakeSender();
    await runDispatch({
      admin,
      now: new Date(at.getTime() + 15 * MINUTE),
      sender: at15.sender,
    });
    expect(mine(at15.sent, endpoints)).toEqual([]);

    const at30 = fakeSender();
    await runDispatch({
      admin,
      now: new Date(at.getTime() + 30 * MINUTE),
      sender: at30.sender,
    });
    expect(mine(at30.sent, endpoints)).toHaveLength(2);
  });

  it("si ya se marcó como hecho, no pregunta", async () => {
    const { user, circleId, endpoints } = await setup();
    const day = nextDay();
    const reminderId = await addReminder(circleId, user.userId, day);
    const at = zonedInstant(day, "08:00", TZ);
    await runDispatch({ admin, now: at, sender: fakeSender().sender });
    await admin
      .from("reminder_occurrences")
      .update({ status: "done", done_at: at.toISOString() })
      .eq("reminder_id", reminderId);

    const { sender, sent } = fakeSender();
    await runDispatch({
      admin,
      now: new Date(at.getTime() + 20 * MINUTE),
      sender,
    });
    expect(mine(sent, endpoints)).toEqual([]);
  });
});

describe("runDispatch: pospuestas y suscripciones", () => {
  it("una pospuesta vuelve a pendiente al vencer su plazo y se avisa de nuevo", async () => {
    const { user, circleId, endpoints } = await setup();
    const day = nextDay();
    const reminderId = await addReminder(circleId, user.userId, day);
    const at = zonedInstant(day, "08:00", TZ);
    await runDispatch({ admin, now: at, sender: fakeSender().sender });
    await admin
      .from("reminder_occurrences")
      .update({
        status: "snoozed",
        snoozed_until: new Date(at.getTime() + 30 * MINUTE).toISOString(),
      })
      .eq("reminder_id", reminderId);

    const before = fakeSender();
    await runDispatch({
      admin,
      now: new Date(at.getTime() + 20 * MINUTE),
      sender: before.sender,
    });
    expect(mine(before.sent, endpoints)).toEqual([]);
    expect((await occurrenceOf(reminderId)).status).toBe("snoozed");

    const after = fakeSender();
    const result = await runDispatch({
      admin,
      now: new Date(at.getTime() + 30 * MINUTE),
      sender: after.sender,
    });
    expect(result.woken).toBeGreaterThanOrEqual(1);
    expect(mine(after.sent, endpoints)).toHaveLength(2);
    const occurrence = await occurrenceOf(reminderId);
    expect(occurrence.status).toBe("pending");
    expect(occurrence.snoozed_until).toBeNull();
  });

  it("si el navegador responde 410, borra esa suscripción y conserva la otra", async () => {
    const { user, circleId, endpoints } = await setup();
    const day = nextDay();
    await addReminder(circleId, user.userId, day);
    const [gone, alive] = endpoints;
    const { sender } = fakeSender((endpoint) =>
      endpoint === gone ? 410 : 201,
    );
    await runDispatch({ admin, now: zonedInstant(day, "08:00", TZ), sender });

    const remaining = await admin
      .from("push_subscriptions")
      .select("endpoint")
      .eq("user_id", user.userId);
    expect(remaining.data).toEqual([{ endpoint: alive }]);
  });

  it("otro error suma un fallo y no borra la suscripción", async () => {
    const { user, circleId } = await setup();
    const day = nextDay();
    await addReminder(circleId, user.userId, day);
    const { sender } = fakeSender(() => 500);
    await runDispatch({ admin, now: zonedInstant(day, "08:00", TZ), sender });
    const rows = await admin
      .from("push_subscriptions")
      .select("failed_count")
      .eq("user_id", user.userId);
    expect(rows.data).toEqual([{ failed_count: 1 }, { failed_count: 1 }]);
  });
});

describe("runDispatch: un solo turno a la vez", () => {
  it("con el bloqueo tomado, el turno se salta sin enviar nada", async () => {
    const { user, circleId, endpoints } = await setup();
    const day = nextDay();
    const reminderId = await addReminder(circleId, user.userId, day);
    const taken = await admin.rpc("acquire_job_lease", {
      p_name: "dispatch",
      p_seconds: 55,
    });
    expect(taken.data).toBe(true);
    try {
      const { sender, sent } = fakeSender();
      const result = await runDispatch({
        admin,
        now: zonedInstant(day, "08:00", TZ),
        sender,
      });
      expect(result).toEqual({
        skipped: true,
        notified: 0,
        followups: 0,
        woken: 0,
      });
      expect(mine(sent, endpoints)).toEqual([]);
      const rows = await admin
        .from("reminder_occurrences")
        .select("id")
        .eq("reminder_id", reminderId);
      expect(rows.data).toEqual([]);
    } finally {
      await admin.rpc("release_job_lease", { p_name: "dispatch" });
    }
  });

  it("dos turnos cruzados: uno trabaja, el otro se salta, y sale un solo aviso por suscripción", async () => {
    const { user, circleId, endpoints } = await setup();
    const day = nextDay();
    await addReminder(circleId, user.userId, day);
    const now = zonedInstant(day, "08:00", TZ);

    const sent: string[] = [];
    // Emisor lento: el primer turno sigue ocupado mientras llega el segundo.
    const slow: PushSender = async (target) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      sent.push(target.endpoint);
      return { statusCode: 201 };
    };
    const [a, b] = await Promise.all([
      runDispatch({ admin, now, sender: slow }),
      runDispatch({ admin, now, sender: slow }),
    ]);
    expect([a.skipped === true, b.skipped === true].sort()).toEqual([
      false,
      true,
    ]);
    expect(
      sent.filter((endpoint) => endpoints.includes(endpoint)).sort(),
    ).toEqual([...endpoints].sort());
  });

  it("al terminar libera el bloqueo, también si algo falla", async () => {
    const exploding: PushSender = async () => {
      throw new Error("sin red");
    };
    const { user, circleId } = await setup();
    const day = nextDay();
    await addReminder(circleId, user.userId, day);
    await runDispatch({
      admin,
      now: zonedInstant(day, "08:00", TZ),
      sender: exploding,
    });
    const next = await runDispatch({
      admin,
      now: zonedInstant(day, "08:01", TZ),
      sender: fakeSender().sender,
    });
    expect(next.skipped).toBeUndefined();
  });
});

describe("POST /api/cron/dispatch", () => {
  const url = "http://localhost:3000/api/cron/dispatch";

  it("sin el secreto, o con uno equivocado, responde 401", async () => {
    const attempts: Record<string, string>[] = [
      {},
      { "x-cron-secret": "" },
      { "x-cron-secret": "no-es-el-secreto" },
      { "x-cron-secret": `${process.env.CRON_SECRET}x` },
    ];
    for (const headers of attempts) {
      const response = await POST(
        new Request(url, { method: "POST", headers }),
      );
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        ok: false,
        error: { code: "unauthorized" },
      });
    }
  });

  it("sin CRON_SECRET configurado nadie pasa", async () => {
    const saved = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    try {
      const response = await POST(
        new Request(url, { method: "POST", headers: { "x-cron-secret": "" } }),
      );
      expect(response.status).toBe(401);
    } finally {
      process.env.CRON_SECRET = saved;
    }
  });

  it("con el secreto correcto corre el despachador y responde 200 con los conteos", async () => {
    const response = await POST(
      new Request(url, {
        method: "POST",
        headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(typeof body.data.notified).toBe("number");
    expect(typeof body.data.followups).toBe("number");
    expect(typeof body.data.woken).toBe("number");
  });
});
