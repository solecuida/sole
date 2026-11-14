import { beforeAll, describe, expect, it } from "vitest";
import {
  createReminder,
  deleteReminder,
  getReminder,
  listReminders,
  updateReminder,
} from "@/server/reminders/reminders";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

const RULE = { freq: "daily", times: ["08:00"], startDate: "2026-11-14" };
const MEDICATION = {
  kind: "medication",
  importance: "important",
  title: "Medicamento de la mañana",
  medName: "Losartán",
  medInstructions: "1 pastilla con el desayuno",
  rule: RULE,
};

let caregiver: TestUser;
let family: TestUser;
let stranger: TestUser;
let circleId: string;

async function rawRow(id: string) {
  const { data } = await adminClient()
    .from("reminders")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) {
    throw new Error("recordatorio no encontrado");
  }
  return data;
}

beforeAll(async () => {
  [caregiver, family, stranger] = await Promise.all([
    createTestUser({ consents: true }),
    createTestUser({ consents: true }),
    createTestUser({ consents: true }),
  ]);
  circleId = await createCircleFor(caregiver.client, "Marta");
  await createCircleFor(stranger.client, "Otra");
  const member = await adminClient().from("circle_members").insert({
    circle_id: circleId,
    user_id: family.userId,
    role: "family",
    display_name: "Pedro",
  });
  expect(member.error).toBeNull();
});

describe("createReminder", () => {
  it("guarda el medicamento cifrado y listReminders lo devuelve legible", async () => {
    const result = await createReminder(
      caregiver.client,
      caregiver.userId,
      circleId,
      MEDICATION,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const row = await rawRow(result.data.id);
    expect(row.med_name_enc?.startsWith("v1.")).toBe(true);
    expect(row.med_instructions_enc?.startsWith("v1.")).toBe(true);
    expect(JSON.stringify(row)).not.toContain("Losart");
    expect(JSON.stringify(row)).not.toContain("pastilla");
    expect(row).toMatchObject({
      title: "Medicamento de la mañana",
      kind: "medication",
      importance: "important",
      source: "manual",
      created_by: caregiver.userId,
      advance_days: [],
      visible_to_cared: false,
      active: true,
    });

    const listed = await listReminders(caregiver.client, circleId);
    const mine = listed.find((item) => item.id === result.data.id);
    expect(mine).toMatchObject({
      medName: "Losartán",
      medInstructions: "1 pastilla con el desayuno",
      rule: RULE,
    });
  });

  it("un familiar también lo lee descifrado", async () => {
    const listed = await listReminders(family.client, circleId);
    expect(listed.some((item) => item.medName === "Losartán")).toBe(true);
  });

  it("si no es medicamento, no guarda nombre ni indicación", async () => {
    const result = await createReminder(
      caregiver.client,
      caregiver.userId,
      circleId,
      { ...MEDICATION, kind: "activity", title: "Caminata" },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const row = await rawRow(result.data.id);
      expect(row.med_name_enc).toBeNull();
      expect(row.med_instructions_enc).toBeNull();
    }
  });

  it("un control sin días de aviso guarda {3,1,0}; con días propios, los respeta", async () => {
    const byDefault = await createReminder(
      caregiver.client,
      caregiver.userId,
      circleId,
      {
        kind: "appointment",
        title: "Control mensual",
        rule: {
          freq: "monthly",
          dayOfMonth: 5,
          times: ["10:00"],
          startDate: "2026-11-14",
        },
      },
    );
    const custom = await createReminder(
      caregiver.client,
      caregiver.userId,
      circleId,
      {
        kind: "important_date",
        title: "Cumpleaños de la Rosa",
        rule: {
          freq: "yearly",
          month: 3,
          day: 10,
          times: ["09:00"],
          startDate: "2026-11-14",
        },
        advanceDays: [7, 0],
      },
    );
    expect(byDefault.ok && custom.ok).toBe(true);
    if (byDefault.ok && custom.ok) {
      expect((await rawRow(byDefault.data.id)).advance_days).toEqual([3, 1, 0]);
      expect((await rawRow(byDefault.data.id)).importance).toBe("normal");
      expect((await rawRow(custom.data.id)).advance_days).toEqual([7, 0]);
    }
  });

  it("con datos inválidos responde validation_failed y no guarda", async () => {
    const before = (await listReminders(caregiver.client, circleId)).length;
    for (const patch of [
      { title: "" },
      { title: "x".repeat(121) },
      { kind: "otro" },
      { rule: { ...RULE, times: [] } },
      { rule: { ...RULE, times: ["25:00"] } },
      { medName: "x".repeat(121) },
      { advanceDays: [31] },
    ]) {
      const result = await createReminder(
        caregiver.client,
        caregiver.userId,
        circleId,
        { ...MEDICATION, ...patch },
      );
      expect(result, JSON.stringify(patch)).toMatchObject({
        ok: false,
        error: { code: "validation_failed" },
      });
    }
    expect((await listReminders(caregiver.client, circleId)).length).toBe(
      before,
    );
  });

  it("un familiar no puede crear: forbidden", async () => {
    const result = await createReminder(
      family.client,
      family.userId,
      circleId,
      MEDICATION,
    );
    expect(result).toMatchObject({ ok: false, error: { code: "forbidden" } });
  });

  it("una persona ajena no puede crear en este círculo: forbidden", async () => {
    const result = await createReminder(
      stranger.client,
      stranger.userId,
      circleId,
      MEDICATION,
    );
    expect(result).toMatchObject({ ok: false, error: { code: "forbidden" } });
  });
});

describe("updateReminder y deleteReminder", () => {
  it("la cuidadora edita y el medicamento se vuelve a cifrar", async () => {
    const created = await createReminder(
      caregiver.client,
      caregiver.userId,
      circleId,
      MEDICATION,
    );
    if (!created.ok) {
      throw new Error("no se creó");
    }
    const before = await rawRow(created.data.id);
    const result = await updateReminder(caregiver.client, created.data.id, {
      ...MEDICATION,
      title: "Remedio de la presión",
      medName: "Enalapril",
      rule: { ...RULE, times: ["09:30"] },
    });
    expect(result.ok).toBe(true);
    const after = await rawRow(created.data.id);
    expect(after.title).toBe("Remedio de la presión");
    expect(after.med_name_enc).not.toBe(before.med_name_enc);
    expect(after.circle_id).toBe(circleId);
    expect(after.created_by).toBe(caregiver.userId);
    expect(
      (await getReminder(caregiver.client, created.data.id))?.medName,
    ).toBe("Enalapril");
  });

  it("un familiar no puede editar ni borrar: forbidden; una ajena: not_found", async () => {
    const created = await createReminder(
      caregiver.client,
      caregiver.userId,
      circleId,
      MEDICATION,
    );
    if (!created.ok) {
      throw new Error("no se creó");
    }
    const id = created.data.id;
    expect(await updateReminder(family.client, id, MEDICATION)).toMatchObject({
      ok: false,
      error: { code: "forbidden" },
    });
    expect(await deleteReminder(family.client, id)).toMatchObject({
      ok: false,
      error: { code: "forbidden" },
    });
    expect(await deleteReminder(stranger.client, id)).toMatchObject({
      ok: false,
      error: { code: "not_found" },
    });
    expect(await getReminder(stranger.client, id)).toBeNull();
    expect((await rawRow(id)).active).toBe(true);
    expect((await rawRow(id)).title).toBe("Medicamento de la mañana");
  });

  it("borrar desactiva el recordatorio y conserva sus ocurrencias", async () => {
    const created = await createReminder(
      caregiver.client,
      caregiver.userId,
      circleId,
      MEDICATION,
    );
    if (!created.ok) {
      throw new Error("no se creó");
    }
    const id = created.data.id;
    const admin = adminClient();
    const occurrence = await admin.from("reminder_occurrences").insert({
      reminder_id: id,
      circle_id: circleId,
      due_at: "2026-11-14T11:00:00Z",
      event_at: "2026-11-14T11:00:00Z",
      local_date: "2026-11-14",
      status: "done",
    });
    expect(occurrence.error).toBeNull();

    const result = await deleteReminder(caregiver.client, id);
    expect(result.ok).toBe(true);

    expect((await rawRow(id)).active).toBe(false);
    const kept = await admin
      .from("reminder_occurrences")
      .select("status")
      .eq("reminder_id", id);
    expect(kept.data).toEqual([{ status: "done" }]);
    const listed = await listReminders(caregiver.client, circleId);
    expect(listed.some((item) => item.id === id)).toBe(false);
  });

  it("un id inexistente o mal formado responde not_found", async () => {
    for (const id of ["00000000-0000-4000-8000-000000000000", "no-es-uuid"]) {
      expect(await deleteReminder(caregiver.client, id)).toMatchObject({
        ok: false,
        error: { code: "not_found" },
      });
    }
  });
});

describe("evento reminder.created", () => {
  it("se guarda sin el título ni el medicamento", async () => {
    const user = await createTestUser({ consents: true });
    const admin = adminClient();
    await admin.from("consents").insert({
      user_id: user.userId,
      layer: "research",
      version: "2026-11-14",
      granted: true,
    });
    const circle = await createCircleFor(user.client, "Marta");
    await createReminder(user.client, user.userId, circle, MEDICATION);
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
        name: "reminder.created",
        props: {
          kind: "medication",
          importance: "important",
          source: "manual",
        },
      },
    ]);
  });
});
