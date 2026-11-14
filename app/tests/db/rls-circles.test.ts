import { beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  anonClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

// Aislamiento por círculo con sesiones reales a través de PostgREST:
// A y B son cuidadoras con su propio círculo; F es familiar en el círculo de A.
const RULE = { freq: "daily", times: ["09:00"], startDate: "2026-11-14" };

let a: TestUser;
let b: TestUser;
let f: TestUser;
let circleA: string;
let circleB: string;
let reminderA: string;

beforeAll(async () => {
  [a, b, f] = await Promise.all([
    createTestUser({ consents: true }),
    createTestUser({ consents: true }),
    createTestUser({ consents: true }),
  ]);
  circleA = await createCircleFor(a.client, "Ana");
  circleB = await createCircleFor(b.client, "Berta");

  const admin = adminClient();
  const member = await admin.from("circle_members").insert({
    circle_id: circleA,
    user_id: f.userId,
    role: "family",
    display_name: "Felipe",
  });
  expect(member.error).toBeNull();

  const reminder = await a.client
    .from("reminders")
    .insert({
      circle_id: circleA,
      created_by: a.userId,
      kind: "custom",
      title: "Regar las plantas",
      rule: RULE,
    })
    .select("id")
    .single();
  expect(reminder.error).toBeNull();
  reminderA = reminder.data?.id ?? "";

  const occurrence = await admin.from("reminder_occurrences").insert({
    reminder_id: reminderA,
    circle_id: circleA,
    due_at: "2026-11-14T12:00:00Z",
    event_at: "2026-11-14T12:00:00Z",
    local_date: "2026-11-14",
  });
  expect(occurrence.error).toBeNull();

  const journal = await a.client.from("journal_entries").insert({
    circle_id: circleA,
    author_id: a.userId,
    entry_date: "2026-11-14",
    day_rating: "bueno",
  });
  expect(journal.error).toBeNull();

  const task = await a.client.from("tasks").insert({
    circle_id: circleA,
    created_by: a.userId,
    title: "Comprar pañales",
  });
  expect(task.error).toBeNull();

  const contact = await a.client.from("contacts").insert({
    circle_id: circleA,
    name: "Farmacia del barrio",
    kind: "farmacia",
    phone: "+56 2 2345 6789",
  });
  expect(contact.error).toBeNull();
});

const CIRCLE_TABLES = [
  "reminders",
  "reminder_occurrences",
  "journal_entries",
  "tasks",
  "contacts",
] as const;

describe("una cuidadora ajena (B) no ve ni toca el círculo de A", () => {
  it("B no ve el círculo de A", async () => {
    const { data, error } = await b.client
      .from("circles")
      .select("id")
      .eq("id", circleA);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  for (const table of CIRCLE_TABLES) {
    it(`B recibe cero filas de ${table} del círculo de A`, async () => {
      const { data, error } = await b.client
        .from(table)
        .select("id")
        .eq("circle_id", circleA);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it(`A sí ve sus filas de ${table}`, async () => {
      const { data, error } = await a.client
        .from(table)
        .select("id")
        .eq("circle_id", circleA);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });
  }

  it("B no puede insertar un recordatorio en el círculo de A (42501)", async () => {
    const { error } = await b.client.from("reminders").insert({
      circle_id: circleA,
      created_by: b.userId,
      kind: "custom",
      title: "Intruso",
      rule: RULE,
    });
    expect(error?.code).toBe("42501");
  });

  it("B no puede editar ni borrar lo de A", async () => {
    const update = await b.client
      .from("reminders")
      .update({ title: "Cambiado por B" })
      .eq("id", reminderA)
      .select("id");
    expect(update.data ?? []).toEqual([]);

    const removed = await b.client
      .from("tasks")
      .delete()
      .eq("circle_id", circleA)
      .select("id");
    expect(removed.data ?? []).toEqual([]);

    const check = await adminClient()
      .from("reminders")
      .select("title")
      .eq("id", reminderA)
      .single();
    expect(check.data?.title).toBe("Regar las plantas");
    const tasks = await adminClient()
      .from("tasks")
      .select("id")
      .eq("circle_id", circleA);
    expect(tasks.data).toHaveLength(1);
  });

  it("A no ve el círculo de B", async () => {
    const { data } = await a.client.from("circles").select("id");
    expect(data?.map((row) => row.id)).toEqual([circleA]);
    expect(circleB).not.toBe(circleA);
  });

  it("sin sesión no se lee ninguna tabla del círculo (42501)", async () => {
    for (const table of ["circles", ...CIRCLE_TABLES] as const) {
      const { data, error } = await anonClient().from(table).select("id");
      expect(error?.code, table).toBe("42501");
      expect(data, table).toBeNull();
    }
  });
});

describe("un familiar (F) del círculo de A lee pero no administra", () => {
  it("F ve los recordatorios de A", async () => {
    const { data, error } = await f.client
      .from("reminders")
      .select("id, title")
      .eq("circle_id", circleA);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: reminderA, title: "Regar las plantas" }]);
  });

  it("F no puede insertar un recordatorio (42501)", async () => {
    const { error } = await f.client.from("reminders").insert({
      circle_id: circleA,
      created_by: f.userId,
      kind: "custom",
      title: "Del familiar",
      rule: RULE,
    });
    expect(error?.code).toBe("42501");
  });

  it("F no puede borrar un recordatorio (42501)", async () => {
    const { error } = await f.client
      .from("reminders")
      .delete()
      .eq("id", reminderA);
    expect(error?.code).toBe("42501");
  });

  it("la edición de F no afecta ninguna fila", async () => {
    const { data, error } = await f.client
      .from("reminders")
      .update({ title: "Cambiado por F" })
      .eq("id", reminderA)
      .select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
    const check = await adminClient()
      .from("reminders")
      .select("title")
      .eq("id", reminderA)
      .single();
    expect(check.data?.title).toBe("Regar las plantas");
  });
});

describe("campos protegidos: ni la cuidadora los cambia", () => {
  it("A no puede cambiar circle_members.role (42501)", async () => {
    const { error } = await a.client
      .from("circle_members")
      .update({ role: "family" })
      .eq("circle_id", circleA)
      .eq("user_id", f.userId);
    expect(error?.code).toBe("42501");
  });

  it("A no puede mover un recordatorio a otro círculo (42501)", async () => {
    const { error } = await a.client
      .from("reminders")
      .update({ circle_id: circleB })
      .eq("id", reminderA);
    expect(error?.code).toBe("42501");
  });

  it("A no puede cambiar quién creó un recordatorio (42501)", async () => {
    const { error } = await a.client
      .from("reminders")
      .update({ created_by: f.userId })
      .eq("id", reminderA);
    expect(error?.code).toBe("42501");
  });

  it("A no puede hacerse administradora (42501)", async () => {
    const { error } = await a.client
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", a.userId);
    expect(error?.code).toBe("42501");
    const check = await adminClient()
      .from("profiles")
      .select("is_admin")
      .eq("id", a.userId)
      .single();
    expect(check.data?.is_admin).toBe(false);
  });
});
