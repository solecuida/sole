import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/occurrences/mark/route";
import { encryptField } from "@/lib/crypto/field";
import { zonedInstant } from "@/server/reminders/recurrence";
import { getToday } from "@/server/today/today";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

const TZ = "America/Santiago";
const admin = adminClient();

/** Cada prueba usa su propio día de 2027, para no cruzarse con otras. */
let dayCounter = 0;
function nextDay(): string {
  dayCounter += 1;
  return `2027-06-${String(dayCounter).padStart(2, "0")}`;
}

async function setup() {
  const user = await createTestUser({ consents: true });
  const circleId = await createCircleFor(user.client, "Marta");
  return { user, circleId };
}

async function addReminder(
  circleId: string,
  userId: string,
  day: string,
  time: string,
  fields: Record<string, unknown> = {},
) {
  const { data, error } = await admin
    .from("reminders")
    .insert({
      circle_id: circleId,
      created_by: userId,
      kind: "custom",
      title: `Ítem de las ${time}`,
      rule: { freq: "once", date: day, times: [time], startDate: day },
      ...fields,
    } as never)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`recordatorio: ${error?.message}`);
  }
  return data.id;
}

function mark(user: TestUser | null, body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost:3000/api/occurrences/mark", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(user ? { authorization: `Bearer ${user.accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

async function occurrence(id: string) {
  const { data } = await admin
    .from("reminder_occurrences")
    .select(
      "status, not_done_reason, snoozed_until, done_by, done_via, done_at",
    )
    .eq("id", id)
    .single();
  if (!data) {
    throw new Error("ocurrencia no encontrada");
  }
  return data;
}

async function marksOf(occurrenceId: string) {
  const { data } = await admin
    .from("occurrence_marks")
    .select("idempotency_key, status, via, marked_by")
    .eq("occurrence_id", occurrenceId);
  return data ?? [];
}

/** Un día con tres ítems y su "Hoy" a la hora indicada. */
async function dayWithItems(at = "07:00") {
  const { user, circleId } = await setup();
  const day = nextDay();
  await addReminder(circleId, user.userId, day, "13:00");
  await addReminder(circleId, user.userId, day, "08:00", {
    importance: "important",
  });
  await addReminder(circleId, user.userId, day, "20:00", {
    importance: "whenever",
  });
  await addReminder(circleId, user.userId, day, "06:30", {
    importance: "important",
  });
  const now = zonedInstant(day, at, TZ);
  const today = await getToday(user.client, admin, circleId, now);
  if (!today) {
    throw new Error("sin datos de hoy");
  }
  return { user, circleId, day, now, today };
}

describe("getToday", () => {
  it("agrupa por importancia y ordena cada grupo por hora", async () => {
    const { today, day, circleId } = await dayWithItems();
    expect(today.circleId).toBe(circleId);
    expect(today.caredName).toBe("Persona de prueba");
    expect(today.localDate).toBe(day);
    expect(today.groups.important.map((item) => item.time)).toEqual([
      "06:30",
      "08:00",
    ]);
    expect(today.groups.normal.map((item) => item.time)).toEqual(["13:00"]);
    expect(today.groups.whenever.map((item) => item.time)).toEqual(["20:00"]);
    expect(today.groups.normal[0]).toMatchObject({
      title: "Ítem de las 13:00",
      kind: "custom",
      importance: "normal",
      status: "pending",
      detail: null,
    });
  });

  it("marca como atrasado lo que ya pasó y sigue pendiente", async () => {
    const { today } = await dayWithItems("09:00");
    const all = [
      ...today.groups.important,
      ...today.groups.normal,
      ...today.groups.whenever,
    ];
    expect(all.map((item) => [item.time, item.overdue]).sort()).toEqual([
      ["06:30", true],
      ["08:00", true],
      ["13:00", false],
      ["20:00", false],
    ]);
  });

  it("cuenta lo hecho en el avance del día y lo hecho no queda atrasado", async () => {
    const { user, circleId, now, today } = await dayWithItems("09:00");
    expect(today.progress.day).toEqual({ done: 0, total: 4 });
    const first = today.groups.important[0];
    const response = await mark(user, {
      occurrenceId: first.id,
      status: "done",
      idempotencyKey: randomUUID(),
      via: "app",
    });
    expect(response.status).toBe(200);

    const after = await getToday(user.client, admin, circleId, now);
    expect(after?.progress.day).toEqual({ done: 1, total: 4 });
    expect(after?.progress.week.done).toBeGreaterThanOrEqual(1);
    expect(after?.groups.important[0]).toMatchObject({
      status: "done",
      overdue: false,
    });
  });

  it("muestra el medicamento descifrado solo dentro de la app", async () => {
    const { user, circleId } = await setup();
    const day = nextDay();
    await addReminder(circleId, user.userId, day, "08:00", {
      kind: "medication",
      title: "Remedio de la mañana",
      med_name_enc: encryptField("Losartán", "reminders.med_name"),
      med_instructions_enc: encryptField(
        "1 pastilla con comida",
        "reminders.med_instructions",
      ),
    });
    const today = await getToday(
      user.client,
      admin,
      circleId,
      zonedInstant(day, "07:00", TZ),
    );
    expect(today?.groups.normal[0].detail).toBe(
      "Losartán · 1 pastilla con comida",
    );
  });

  it("lista en «próximos días» los controles y fechas de la semana, no los de hoy", async () => {
    const { user, circleId } = await setup();
    const day = nextDay();
    const [year, month, date] = day.split("-").map(Number);
    const plus = (days: number) =>
      new Date(Date.UTC(year, month - 1, date + days))
        .toISOString()
        .slice(0, 10);
    await addReminder(circleId, user.userId, plus(3), "15:00", {
      kind: "appointment",
      title: "Control mensual",
    });
    await addReminder(circleId, user.userId, plus(10), "15:00", {
      kind: "appointment",
      title: "Demasiado lejos",
    });
    await addReminder(circleId, user.userId, day, "15:00", {
      kind: "errand",
      title: "Trámite de hoy",
    });
    await addReminder(circleId, user.userId, plus(1), "09:00", {
      title: "Actividad común",
    });
    const today = await getToday(
      user.client,
      admin,
      circleId,
      zonedInstant(day, "07:00", TZ),
    );
    expect(today?.upcoming).toEqual([
      expect.objectContaining({
        title: "Control mensual",
        kind: "appointment",
        date: plus(3),
        time: "15:00",
      }),
    ]);
    expect(today?.groups.normal.map((item) => item.title)).toEqual([
      "Trámite de hoy",
    ]);
  });

  it("devuelve null para quien no es miembro, y no prepara nada", async () => {
    const { user, circleId } = await setup();
    const day = nextDay();
    const reminderId = await addReminder(circleId, user.userId, day, "08:00");
    const stranger = await createTestUser({ consents: true });
    const result = await getToday(
      stranger.client,
      admin,
      circleId,
      zonedInstant(day, "07:00", TZ),
    );
    expect(result).toBeNull();
    const rows = await admin
      .from("reminder_occurrences")
      .select("id")
      .eq("reminder_id", reminderId);
    expect(rows.data).toEqual([]);
  });

  it("un día sin ítems devuelve grupos vacíos y avance 0 de 0", async () => {
    const { user, circleId } = await setup();
    const today = await getToday(
      user.client,
      admin,
      circleId,
      zonedInstant(nextDay(), "07:00", TZ),
    );
    expect(today?.groups).toEqual({ important: [], normal: [], whenever: [] });
    expect(today?.progress.day).toEqual({ done: 0, total: 0 });
  });
});

describe("POST /api/occurrences/mark", () => {
  it("la misma clave dos veces aplica el cambio una vez y responde 200 ambas", async () => {
    const { user, today } = await dayWithItems();
    const id = today.groups.normal[0].id;
    const body = {
      occurrenceId: id,
      status: "done",
      idempotencyKey: randomUUID(),
      via: "app",
    };
    const first = await mark(user, body);
    const second = await mark(user, body);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const json = await first.json();
    expect(json).toMatchObject({ ok: true, data: { id, status: "done" } });
    expect(json.data.done_at).toBeTruthy();
    expect((await second.json()).data.status).toBe("done");

    expect(await marksOf(id)).toEqual([
      {
        idempotency_key: body.idempotencyKey,
        status: "done",
        via: "app",
        marked_by: user.userId,
      },
    ]);
    expect(await occurrence(id)).toMatchObject({
      status: "done",
      done_by: user.userId,
      done_via: "app",
    });
  });

  it("«no se hizo» guarda el motivo", async () => {
    const { user, today } = await dayWithItems();
    const id = today.groups.normal[0].id;
    const response = await mark(user, {
      occurrenceId: id,
      status: "not_done",
      reason: "rechazo",
      idempotencyKey: randomUUID(),
    });
    expect(response.status).toBe(200);
    expect(await occurrence(id)).toMatchObject({
      status: "not_done",
      not_done_reason: "rechazo",
      done_at: null,
    });
  });

  it("«posponer» 30 minutos deja snoozed_until 30 minutos adelante", async () => {
    const { user, today } = await dayWithItems();
    const id = today.groups.normal[0].id;
    const before = Date.now();
    const response = await mark(user, {
      occurrenceId: id,
      status: "snoozed",
      snoozeMinutes: 30,
      idempotencyKey: randomUUID(),
    });
    expect(response.status).toBe(200);
    const row = await occurrence(id);
    expect(row.status).toBe("snoozed");
    const until = new Date(row.snoozed_until ?? "").getTime();
    expect(until - before).toBeGreaterThanOrEqual(30 * 60_000 - 5_000);
    expect(until - before).toBeLessThanOrEqual(30 * 60_000 + 30_000);
  });

  it("una marca posterior con otra clave cambia el estado y deja historial", async () => {
    const { user, today } = await dayWithItems();
    const id = today.groups.normal[0].id;
    await mark(user, {
      occurrenceId: id,
      status: "not_done",
      reason: "otro",
      idempotencyKey: randomUUID(),
    });
    await mark(user, {
      occurrenceId: id,
      status: "done",
      idempotencyKey: randomUUID(),
    });
    expect(await occurrence(id)).toMatchObject({
      status: "done",
      not_done_reason: null,
    });
    expect(await marksOf(id)).toHaveLength(2);
  });

  it("quien no es miembro recibe 403 forbidden y nada cambia", async () => {
    const { today } = await dayWithItems();
    const id = today.groups.normal[0].id;
    const stranger = await createTestUser({ consents: true });
    const response = await mark(stranger, {
      occurrenceId: id,
      status: "done",
      idempotencyKey: randomUUID(),
    });
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("forbidden");
    expect((await occurrence(id)).status).toBe("pending");
    expect(await marksOf(id)).toEqual([]);
  });

  it("una clave ya usada para otra ocurrencia responde 409 conflict y nada cambia", async () => {
    const { user, today } = await dayWithItems();
    const first = today.groups.normal[0].id;
    const second = today.groups.whenever[0].id;
    const key = randomUUID();
    await mark(user, {
      occurrenceId: first,
      status: "done",
      idempotencyKey: key,
    });
    const response = await mark(user, {
      occurrenceId: second,
      status: "done",
      idempotencyKey: key,
    });
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("conflict");
    expect((await occurrence(second)).status).toBe("pending");
    expect(await marksOf(second)).toEqual([]);
  });

  it("con el círculo cerrado responde 409 conflict y nada cambia", async () => {
    const { user, circleId, today } = await dayWithItems();
    const id = today.groups.normal[0].id;
    await admin
      .from("circles")
      .update({ closed_at: new Date().toISOString(), closed_reason: "otro" })
      .eq("id", circleId);
    const response = await mark(user, {
      occurrenceId: id,
      status: "done",
      idempotencyKey: randomUUID(),
    });
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("conflict");
    expect((await occurrence(id)).status).toBe("pending");
  });

  it("sin sesión 401, ocurrencia inexistente 404, cuerpo inválido 422", async () => {
    const { user, today } = await dayWithItems();
    const id = today.groups.normal[0].id;
    const valid = {
      occurrenceId: id,
      status: "done",
      idempotencyKey: randomUUID(),
    };
    expect((await mark(null, valid)).status).toBe(401);
    expect(
      (await mark(user, { ...valid, occurrenceId: randomUUID() })).status,
    ).toBe(404);
    for (const patch of [
      { status: "pending" },
      { status: "skipped" },
      { idempotencyKey: "no-es-uuid" },
      { occurrenceId: "no-es-uuid" },
      { reason: "rechazo" },
      { status: "not_done", reason: "porque sí" },
      { status: "snoozed", snoozeMinutes: 1 },
      { status: "snoozed", snoozeMinutes: 500 },
      { via: "cared_link" },
    ]) {
      const response = await mark(user, { ...valid, ...patch });
      expect(response.status, JSON.stringify(patch)).toBe(422);
    }
    expect((await occurrence(id)).status).toBe("pending");
  });

  it("registra occurrence.marked sin el título, solo con consentimiento de investigación", async () => {
    const { user, today } = await dayWithItems();
    await admin.from("consents").insert({
      user_id: user.userId,
      layer: "research",
      version: "2026-11-14",
      granted: true,
    });
    await mark(user, {
      occurrenceId: today.groups.normal[0].id,
      status: "done",
      idempotencyKey: randomUUID(),
    });
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
      {
        name: "occurrence.marked",
        props: { status: "done", via: "app", kind: "custom" },
      },
    ]);
  });
});
