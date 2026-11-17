import { describe, expect, it } from "vitest";
import { materializeOccurrences } from "@/server/reminders/materialize";
import { zonedInstant } from "@/server/reminders/recurrence";
import { adminClient, createCircleFor, createTestUser } from "./helpers";

const TZ = "America/Santiago";
// Sábado 14 de noviembre de 2026, 07:00 en Chile (10:00 UTC).
const NOW = zonedInstant("2026-11-14", "07:00", TZ);
const HOUR = 3_600_000;
const admin = adminClient();

async function setup() {
  const user = await createTestUser({ consents: true });
  const circleId = await createCircleFor(user.client, "Marta");
  return { user, circleId };
}

async function addReminder(
  circleId: string,
  userId: string,
  fields: Record<string, unknown>,
) {
  const { data, error } = await admin
    .from("reminders")
    .insert({
      circle_id: circleId,
      created_by: userId,
      kind: "custom",
      title: "Prueba",
      rule: { freq: "daily", times: ["08:00"], startDate: "2026-11-01" },
      ...fields,
    } as never)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`recordatorio: ${error?.message}`);
  }
  return data.id;
}

async function occurrencesOf(reminderId: string) {
  const { data } = await admin
    .from("reminder_occurrences")
    .select("kind, advance_days, due_at, event_at, local_date, status")
    .eq("reminder_id", reminderId)
    .order("due_at", { ascending: true });
  return (data ?? []).map((row) => ({
    ...row,
    due_at: new Date(row.due_at).toISOString(),
    event_at: new Date(row.event_at).toISOString(),
  }));
}

describe("materializeOccurrences", () => {
  it("crea las ocurrencias de las próximas 48 horas con su día local", async () => {
    const { user, circleId } = await setup();
    const reminderId = await addReminder(circleId, user.userId, {});

    const result = await materializeOccurrences(admin, {
      now: NOW,
      circleIds: [circleId],
    });
    expect(result.created).toBe(2);

    // 08:00 del 14 y del 15; la del 16 a las 08:00 queda fuera (49 horas después).
    expect(await occurrencesOf(reminderId)).toEqual([
      {
        kind: "main",
        advance_days: 0,
        due_at: "2026-11-14T11:00:00.000Z",
        event_at: "2026-11-14T11:00:00.000Z",
        local_date: "2026-11-14",
        status: "pending",
      },
      {
        kind: "main",
        advance_days: 0,
        due_at: "2026-11-15T11:00:00.000Z",
        event_at: "2026-11-15T11:00:00.000Z",
        local_date: "2026-11-15",
        status: "pending",
      },
    ]);
  });

  it("el día local es el de Chile aunque en UTC ya sea el día siguiente", async () => {
    const { user, circleId } = await setup();
    const reminderId = await addReminder(circleId, user.userId, {
      rule: { freq: "daily", times: ["23:30"], startDate: "2026-11-01" },
    });
    await materializeOccurrences(admin, { now: NOW, circleIds: [circleId] });
    const rows = await occurrencesOf(reminderId);
    const tonight = rows.find((row) => row.local_date === "2026-11-14");
    // 23:30 del 14 en Chile son las 02:30 UTC del 15.
    expect(tonight?.event_at).toBe("2026-11-15T02:30:00.000Z");
  });

  it("incluye lo que venció hace menos de 6 horas, pero no lo más antiguo", async () => {
    const { user, circleId } = await setup();
    const reminderId = await addReminder(circleId, user.userId, {
      rule: {
        freq: "daily",
        times: ["00:30", "02:00"],
        startDate: "2026-11-01",
      },
    });
    await materializeOccurrences(admin, { now: NOW, circleIds: [circleId] });
    const today = (await occurrencesOf(reminderId)).filter(
      (row) => row.local_date === "2026-11-14",
    );
    // A las 07:00, las 02:00 pasaron hace 5 horas (entra); las 00:30, hace 6,5 (no).
    expect(today.map((row) => row.event_at)).toEqual([
      "2026-11-14T05:00:00.000Z",
    ]);
  });

  it("una segunda corrida con el mismo reloj no crea nada", async () => {
    const { user, circleId } = await setup();
    const reminderId = await addReminder(circleId, user.userId, {});
    await materializeOccurrences(admin, { now: NOW, circleIds: [circleId] });
    const second = await materializeOccurrences(admin, {
      now: NOW,
      circleIds: [circleId],
    });
    expect(second.created).toBe(0);
    expect(await occurrencesOf(reminderId)).toHaveLength(2);
  });

  it("una corrida posterior solo agrega lo nuevo y no pisa lo ya marcado", async () => {
    const { user, circleId } = await setup();
    const reminderId = await addReminder(circleId, user.userId, {});
    await materializeOccurrences(admin, { now: NOW, circleIds: [circleId] });
    await admin
      .from("reminder_occurrences")
      .update({ status: "done" })
      .eq("reminder_id", reminderId)
      .eq("local_date", "2026-11-14");

    const later = await materializeOccurrences(admin, {
      now: new Date(NOW.getTime() + 24 * HOUR),
      circleIds: [circleId],
    });
    expect(later.created).toBe(1);
    const rows = await occurrencesOf(reminderId);
    expect(rows.map((row) => [row.local_date, row.status])).toEqual([
      ["2026-11-14", "done"],
      ["2026-11-15", "pending"],
      ["2026-11-16", "pending"],
    ]);
  });

  it("el aviso de 3 días antes aparece cuando su hora entra en la ventana, y una sola vez", async () => {
    const { user, circleId } = await setup();
    // Control el martes 17 a las 15:00: avisos a las 09:00 del 14, del 16 y del 17.
    const reminderId = await addReminder(circleId, user.userId, {
      kind: "appointment",
      rule: {
        freq: "once",
        date: "2026-11-17",
        times: ["15:00"],
        startDate: "2026-11-01",
      },
      advance_days: [3, 1, 0],
    });

    // El 12 a las 07:00, el aviso del 14 a las 09:00 queda a 50 horas: todavía no.
    const tooEarly = await materializeOccurrences(admin, {
      now: new Date(NOW.getTime() - 48 * HOUR),
      circleIds: [circleId],
    });
    expect(tooEarly.created).toBe(0);

    const first = await materializeOccurrences(admin, {
      now: NOW,
      circleIds: [circleId],
    });
    expect(first.created).toBe(1);
    expect(await occurrencesOf(reminderId)).toEqual([
      {
        kind: "advance",
        advance_days: 3,
        due_at: "2026-11-14T12:00:00.000Z",
        event_at: "2026-11-17T18:00:00.000Z",
        local_date: "2026-11-17",
        status: "pending",
      },
    ]);

    const again = await materializeOccurrences(admin, {
      now: NOW,
      circleIds: [circleId],
    });
    expect(again.created).toBe(0);

    // Dos días después entran el aviso del día anterior, el del mismo día y el control.
    await materializeOccurrences(admin, {
      now: new Date(NOW.getTime() + 48 * HOUR),
      circleIds: [circleId],
    });
    expect(
      (await occurrencesOf(reminderId)).map((row) => [
        row.kind,
        row.advance_days,
        row.due_at,
      ]),
    ).toEqual([
      ["advance", 3, "2026-11-14T12:00:00.000Z"],
      ["advance", 1, "2026-11-16T12:00:00.000Z"],
      ["advance", 0, "2026-11-17T12:00:00.000Z"],
      ["main", 0, "2026-11-17T18:00:00.000Z"],
    ]);
  });

  it("no crea nada para un recordatorio inactivo", async () => {
    const { user, circleId } = await setup();
    const reminderId = await addReminder(circleId, user.userId, {
      active: false,
    });
    await materializeOccurrences(admin, { now: NOW, circleIds: [circleId] });
    expect(await occurrencesOf(reminderId)).toEqual([]);
  });

  it("no crea nada para un círculo cerrado", async () => {
    const { user, circleId } = await setup();
    const reminderId = await addReminder(circleId, user.userId, {});
    await admin
      .from("circles")
      .update({ closed_at: NOW.toISOString(), closed_reason: "otro" })
      .eq("id", circleId);
    const result = await materializeOccurrences(admin, {
      now: NOW,
      circleIds: [circleId],
    });
    expect(result.created).toBe(0);
    expect(await occurrencesOf(reminderId)).toEqual([]);
  });

  it("no crea nada si la cuenta de la cuidadora está desactivada", async () => {
    const { user, circleId } = await setup();
    const reminderId = await addReminder(circleId, user.userId, {});
    await admin
      .from("profiles")
      .update({ deactivated_at: NOW.toISOString() })
      .eq("id", user.userId);
    const result = await materializeOccurrences(admin, {
      now: NOW,
      circleIds: [circleId],
    });
    expect(result.created).toBe(0);
    expect(await occurrencesOf(reminderId)).toEqual([]);
  });

  it("una regla ilegible se salta sin frenar a las demás", async () => {
    const { user, circleId } = await setup();
    const broken = await addReminder(circleId, user.userId, {
      rule: { freq: "cada-rato", startDate: "2026-11-01" },
    });
    const fine = await addReminder(circleId, user.userId, {});
    const result = await materializeOccurrences(admin, {
      now: NOW,
      circleIds: [circleId],
    });
    expect(result.created).toBe(2);
    expect(await occurrencesOf(broken)).toEqual([]);
    expect(await occurrencesOf(fine)).toHaveLength(2);
  });

  it("sin circleIds recorre todos los círculos; con lista vacía, ninguno", async () => {
    const { user, circleId } = await setup();
    const reminderId = await addReminder(circleId, user.userId, {});
    expect(
      await materializeOccurrences(admin, { now: NOW, circleIds: [] }),
    ).toEqual({ created: 0 });
    expect(await occurrencesOf(reminderId)).toEqual([]);

    await materializeOccurrences(admin, { now: NOW });
    expect(await occurrencesOf(reminderId)).toHaveLength(2);
  });
});
