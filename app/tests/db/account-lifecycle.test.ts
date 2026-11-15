import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  closeCircle,
  getAccountState,
  requestDeletion,
  restoreAccount,
} from "@/server/account/lifecycle";
import { materializeOccurrences } from "@/server/reminders/materialize";
import { zonedInstant } from "@/server/reminders/recurrence";
import { adminClient, createCircleFor, createTestUser } from "./helpers";

const admin = adminClient();
const NOW = new Date("2026-11-14T15:00:00.000Z");
const DAY = 86_400_000;

async function profileOf(userId: string) {
  const { data } = await admin
    .from("profiles")
    .select("deletion_requested_at, deactivated_at")
    .eq("id", userId)
    .single();
  return data;
}

async function addDailyReminder(circleId: string, userId: string) {
  const { data, error } = await admin
    .from("reminders")
    .insert({
      circle_id: circleId,
      created_by: userId,
      kind: "custom",
      title: "Regar las plantas",
      rule: { freq: "daily", times: ["08:00"], startDate: "2026-11-01" },
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`recordatorio: ${error?.message}`);
  }
  return data.id;
}

describe("requestDeletion", () => {
  it("desactiva la cuenta, cierra sus sesiones y detiene los avisos", async () => {
    const user = await createTestUser({ consents: true });
    const circleId = await createCircleFor(user.client, "Marta");
    const reminderId = await addDailyReminder(circleId, user.userId);
    const session = await user.client.auth.getSession();
    const refreshToken = session.data.session?.refresh_token ?? "";
    expect(refreshToken).not.toBe("");

    const result = await requestDeletion(
      user.client,
      admin,
      user.userId,
      user.accessToken,
      NOW,
    );
    expect(result).toEqual({
      ok: true,
      data: { purgeAfter: new Date(NOW.getTime() + 7 * DAY).toISOString() },
    });

    const profile = await profileOf(user.userId);
    expect(new Date(profile?.deletion_requested_at ?? "").toISOString()).toBe(
      NOW.toISOString(),
    );
    expect(new Date(profile?.deactivated_at ?? "").toISOString()).toBe(
      NOW.toISOString(),
    );

    // El token de refresco ya no sirve en ningún teléfono.
    const other = createClient(
      process.env.SUPABASE_URL ?? "",
      process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const refreshed = await other.auth.refreshSession({
      refresh_token: refreshToken,
    });
    expect(refreshed.error).not.toBeNull();
    expect(refreshed.data.session).toBeNull();

    // No se preparan más avisos para sus círculos.
    const materialized = await materializeOccurrences(admin, {
      now: zonedInstant("2026-11-14", "07:00", "America/Santiago"),
      circleIds: [circleId],
    });
    expect(materialized.created).toBe(0);
    const occurrences = await admin
      .from("reminder_occurrences")
      .select("id")
      .eq("reminder_id", reminderId);
    expect(occurrences.data).toEqual([]);
  });

  it("registra el evento técnico aunque no haya consentimiento de investigación", async () => {
    const user = await createTestUser({ consents: true });
    await requestDeletion(
      user.client,
      admin,
      user.userId,
      user.accessToken,
      NOW,
    );
    const profile = await admin
      .from("profiles")
      .select("pseudonym_id")
      .eq("id", user.userId)
      .single();
    const events = await admin
      .from("events")
      .select("name, technical, props")
      .eq("pseudonym_id", profile.data?.pseudonym_id ?? "");
    expect(events.data).toEqual([
      { name: "account.deletion_requested", technical: true, props: {} },
    ]);
  });

  it("una usuaria no puede marcar ni desmarcar el borrado por su cuenta", async () => {
    const user = await createTestUser({ consents: true });
    for (const patch of [
      { deletion_requested_at: NOW.toISOString() },
      { deactivated_at: NOW.toISOString() },
    ]) {
      const { error } = await user.client
        .from("profiles")
        .update(patch)
        .eq("id", user.userId);
      expect(error?.code).toBe("42501");
    }
    expect(await profileOf(user.userId)).toEqual({
      deletion_requested_at: null,
      deactivated_at: null,
    });
  });
});

describe("getAccountState y restoreAccount", () => {
  it("una cuenta normal está activa", async () => {
    const user = await createTestUser();
    expect(await getAccountState(user.client, user.userId)).toEqual({
      status: "active",
    });
  });

  it("tras pedir el borrado queda pendiente, con fecha 7 días después; recuperarla limpia todo", async () => {
    const user = await createTestUser({ consents: true });
    await requestDeletion(
      user.client,
      admin,
      user.userId,
      user.accessToken,
      NOW,
    );
    // El JWT ya emitido sigue sirviendo unos minutos para leer el propio perfil;
    // el cliente admin da la misma respuesta.
    expect(await getAccountState(admin, user.userId)).toEqual({
      status: "pending_deletion",
      requestedAt: NOW.toISOString(),
      purgeAfter: new Date(NOW.getTime() + 7 * DAY).toISOString(),
    });

    const restored = await restoreAccount(admin, user.userId);
    expect(restored.ok).toBe(true);
    expect(await profileOf(user.userId)).toEqual({
      deletion_requested_at: null,
      deactivated_at: null,
    });
    expect(await getAccountState(admin, user.userId)).toEqual({
      status: "active",
    });
  });

  it("recuperar una cuenta que no existe responde error", async () => {
    const result = await restoreAccount(
      admin,
      "00000000-0000-4000-8000-000000000000",
    );
    expect(result).toMatchObject({ ok: false, error: { code: "internal" } });
  });
});

describe("closeCircle", () => {
  async function circleWithItems() {
    const user = await createTestUser({ consents: true });
    const circleId = await createCircleFor(user.client, "Marta");
    const reminderId = await addDailyReminder(circleId, user.userId);
    const base = { reminder_id: reminderId, circle_id: circleId };
    const inserted = await admin.from("reminder_occurrences").insert([
      {
        ...base,
        due_at: "2026-11-12T11:00:00Z",
        event_at: "2026-11-12T11:00:00Z",
        local_date: "2026-11-12",
        status: "done",
      },
      {
        ...base,
        due_at: "2026-11-13T11:00:00Z",
        event_at: "2026-11-13T11:00:00Z",
        local_date: "2026-11-13",
        status: "snoozed",
      },
      {
        ...base,
        due_at: "2026-11-14T11:00:00Z",
        event_at: "2026-11-14T11:00:00Z",
        local_date: "2026-11-14",
        status: "pending",
      },
    ]);
    expect(inserted.error).toBeNull();
    return { user, circleId, reminderId };
  }

  it("por fallecimiento: cierra, desactiva los recordatorios y salta lo pendiente", async () => {
    const { user, circleId, reminderId } = await circleWithItems();
    const result = await closeCircle(user.client, circleId, "fallecimiento");
    expect(result).toEqual({ ok: true, data: { reason: "fallecimiento" } });

    const circle = await admin
      .from("circles")
      .select("closed_at, closed_reason")
      .eq("id", circleId)
      .single();
    expect(circle.data?.closed_at).toBeTruthy();
    expect(circle.data?.closed_reason).toBe("fallecimiento");

    const reminders = await admin
      .from("reminders")
      .select("active")
      .eq("circle_id", circleId);
    expect(reminders.data).toEqual([{ active: false }]);

    const occurrences = await admin
      .from("reminder_occurrences")
      .select("local_date, status")
      .eq("reminder_id", reminderId)
      .order("local_date", { ascending: true });
    expect(occurrences.data).toEqual([
      { local_date: "2026-11-12", status: "done" },
      { local_date: "2026-11-13", status: "skipped" },
      { local_date: "2026-11-14", status: "skipped" },
    ]);

    // Y no se prepara nada nuevo para un círculo cerrado.
    const materialized = await materializeOccurrences(admin, {
      now: zonedInstant("2026-11-14", "07:00", "America/Santiago"),
      circleIds: [circleId],
    });
    expect(materialized.created).toBe(0);
  });

  it("un familiar no puede cerrarlo: forbidden, y nada cambia", async () => {
    const { circleId } = await circleWithItems();
    const family = await createTestUser({ consents: true });
    await admin.from("circle_members").insert({
      circle_id: circleId,
      user_id: family.userId,
      role: "family",
      display_name: "Felipe",
    });
    const result = await closeCircle(family.client, circleId, "otro");
    expect(result).toMatchObject({ ok: false, error: { code: "forbidden" } });
    const circle = await admin
      .from("circles")
      .select("closed_at")
      .eq("id", circleId)
      .single();
    expect(circle.data?.closed_at).toBeNull();
  });

  it("una persona ajena tampoco: forbidden", async () => {
    const { circleId } = await circleWithItems();
    const stranger = await createTestUser({ consents: true });
    expect(
      await closeCircle(stranger.client, circleId, "ya_no_cuido"),
    ).toMatchObject({ ok: false, error: { code: "forbidden" } });
  });

  it("un motivo desconocido o un id mal formado responde validation_failed", async () => {
    const { user, circleId } = await circleWithItems();
    expect(await closeCircle(user.client, circleId, "porque sí")).toMatchObject(
      { ok: false, error: { code: "validation_failed" } },
    );
    expect(await closeCircle(user.client, "no-es-uuid", "otro")).toMatchObject({
      ok: false,
      error: { code: "validation_failed" },
    });
  });
});
