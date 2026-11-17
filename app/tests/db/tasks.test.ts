import { beforeAll, describe, expect, it } from "vitest";
import {
  addTask,
  completeTask,
  helpLinkFor,
  listTasks,
  moveToToday,
  removeTask,
  todayTasks,
} from "@/server/tasks/tasks";
import { getToday } from "@/server/today/today";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

// 23:30 del 14 en Santiago (verano, UTC-3) ya es el 15 en UTC: prueba la zona.
const LATE_NIGHT = new Date("2026-11-15T02:30:00Z");
const TODAY = "2026-11-14";
const MARK = `tarea-${Date.now()}`;

let caregiver: TestUser;
let family: TestUser;
let stranger: TestUser;
let circleId: string;

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

async function add(title: string): Promise<string> {
  const result = await addTask(
    caregiver.client,
    caregiver.userId,
    circleId,
    title,
  );
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("no se pudo agregar");
  }
  return result.data.id;
}

describe("tareas", () => {
  it("agrega una tarea y la lista en «Sin fecha»", async () => {
    const id = await add(`Comprar pañales ${MARK}`);
    const lists = await listTasks(caregiver.client, circleId, TODAY);
    expect(lists.undated.map((task) => task.id)).toContain(id);
    expect(lists.today.map((task) => task.id)).not.toContain(id);
  });

  it("pasa a hoy con el día de Santiago y aparece en las tareas de hoy", async () => {
    const id = await add(`Llamar a la farmacia ${MARK}`);
    const moved = await moveToToday(caregiver.client, id, LATE_NIGHT);
    expect(moved).toEqual({ ok: true, data: { scheduledFor: TODAY } });

    const row = await adminClient()
      .from("tasks")
      .select("scheduled_for")
      .eq("id", id)
      .single();
    expect(row.data?.scheduled_for).toBe(TODAY);

    const forToday = await todayTasks(caregiver.client, circleId, TODAY);
    expect(forToday.map((task) => task.id)).toContain(id);
    const lists = await listTasks(caregiver.client, circleId, TODAY);
    expect(lists.today.map((task) => task.id)).toContain(id);
    expect(lists.undated.map((task) => task.id)).not.toContain(id);
  });

  it("getToday la muestra en «Cuando puedas», sin contarla en el avance del día", async () => {
    const id = await add(`Comprar pañales ${MARK}`);
    await moveToToday(caregiver.client, id, LATE_NIGHT);
    const today = await getToday(
      caregiver.client,
      adminClient(),
      circleId,
      LATE_NIGHT,
    );
    const item = today?.groups.whenever.find((entry) => entry.id === id);
    expect(item).toMatchObject({
      source: "task",
      title: `Comprar pañales ${MARK}`,
      importance: "whenever",
      status: "pending",
    });
    expect(today?.progress.day).toEqual({ done: 0, total: 0 });

    // Una vez hecha, sale de «Hoy».
    await completeTask(caregiver.client, caregiver.userId, id, LATE_NIGHT);
    const after = await getToday(
      caregiver.client,
      adminClient(),
      circleId,
      LATE_NIGHT,
    );
    expect(after?.groups.whenever.map((entry) => entry.id)).not.toContain(id);
  });

  it("al completarla guarda done_at y done_by, y pasa a «Hechas»", async () => {
    const id = await add(`Pagar la cuenta de luz ${MARK}`);
    await moveToToday(caregiver.client, id, LATE_NIGHT);
    const done = await completeTask(
      caregiver.client,
      caregiver.userId,
      id,
      LATE_NIGHT,
    );
    expect(done.ok).toBe(true);

    const row = await adminClient()
      .from("tasks")
      .select("done_at, done_by")
      .eq("id", id)
      .single();
    expect(row.data?.done_by).toBe(caregiver.userId);
    expect(new Date(row.data?.done_at ?? "").toISOString()).toBe(
      LATE_NIGHT.toISOString(),
    );

    const forToday = await todayTasks(caregiver.client, circleId, TODAY);
    expect(forToday.map((task) => task.id)).not.toContain(id);
    const lists = await listTasks(caregiver.client, circleId, TODAY);
    expect(lists.done.map((task) => task.id)).toContain(id);
  });

  it("una tarea de un día anterior sin hacer sigue en las de hoy", async () => {
    const id = await add(`Sacar hora al control ${MARK}`);
    await moveToToday(caregiver.client, id, new Date("2026-11-10T15:00:00Z"));
    const forToday = await todayTasks(caregiver.client, circleId, TODAY);
    expect(forToday.map((task) => task.id)).toContain(id);
  });

  it("rechaza títulos vacíos o de más de 120 letras", async () => {
    for (const title of ["   ", "a".repeat(121), 42]) {
      const result = await addTask(
        caregiver.client,
        caregiver.userId,
        circleId,
        title,
      );
      expect(result).toMatchObject({
        ok: false,
        error: { code: "validation_failed" },
      });
    }
  });

  it("un familiar no puede agregar, mover, completar ni borrar", async () => {
    const id = await add(`Cambiar la ampolleta ${MARK}`);
    const added = await addTask(
      family.client,
      family.userId,
      circleId,
      `Intento ${MARK}`,
    );
    expect(added).toMatchObject({ ok: false, error: { code: "forbidden" } });

    const moved = await moveToToday(family.client, id, LATE_NIGHT);
    expect(moved).toMatchObject({ ok: false, error: { code: "forbidden" } });
    const done = await completeTask(
      family.client,
      family.userId,
      id,
      LATE_NIGHT,
    );
    expect(done).toMatchObject({ ok: false, error: { code: "forbidden" } });
    const removed = await removeTask(family.client, id);
    expect(removed).toMatchObject({ ok: false, error: { code: "forbidden" } });

    const lists = await listTasks(family.client, circleId, TODAY);
    expect(lists.undated.map((task) => task.id)).toContain(id);
  });

  it("alguien de otro círculo no ve ni toca las tareas", async () => {
    const id = await add(`Tarea privada ${MARK}`);
    const lists = await listTasks(stranger.client, circleId, TODAY);
    expect(lists.undated).toHaveLength(0);
    const done = await completeTask(
      stranger.client,
      stranger.userId,
      id,
      LATE_NIGHT,
    );
    expect(done).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("quien cuida puede quitar una tarea", async () => {
    const id = await add(`Tarea de más ${MARK}`);
    const removed = await removeTask(caregiver.client, id);
    expect(removed.ok).toBe(true);
    const lists = await listTasks(caregiver.client, circleId, TODAY);
    expect(lists.undated.map((task) => task.id)).not.toContain(id);
  });
});

describe("helpLinkFor", () => {
  const id = "0b8f2b3e-6f5c-4c1e-9d7a-3a1f1d2c4e5f";

  it("lleva a la puerta mientras no existan los familiares", () => {
    expect(helpLinkFor(id, false)).toBe("/pronto/invitar-familiar");
  });

  it("lleva al círculo con la tarea elegida cuando existen", () => {
    expect(helpLinkFor(id, true)).toBe(`/circulo?pedir=${id}`);
  });
});
