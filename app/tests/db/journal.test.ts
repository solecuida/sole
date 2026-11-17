import { beforeAll, describe, expect, it } from "vitest";
import { getEntry, listEntries, saveEntry } from "@/server/journal/journal";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

const NOW = new Date("2026-11-14T15:00:00Z"); // 12:00 en Santiago
const TOMORROW = new Date("2026-11-15T15:00:00Z");
const NOTE = "Hoy comió poco pero se rió con la visita de la tarde";

const ENTRY = {
  dayRating: "regular",
  moods: ["tranquila", "con_dolor"],
  sleep: "poco",
  food: "bien",
  note: NOTE,
  durationMs: 9000,
};

let caregiver: TestUser;
let family: TestUser;
let stranger: TestUser;
let circleId: string;

async function rawRows() {
  const { data } = await adminClient()
    .from("journal_entries")
    .select("*")
    .eq("circle_id", circleId);
  return data ?? [];
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

describe("saveEntry", () => {
  it("guarda la entrada de hoy con la nota cifrada y la lee descifrada", async () => {
    const result = await saveEntry(
      caregiver.client,
      caregiver.userId,
      circleId,
      ENTRY,
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.entryDate).toBe("2026-11-14");

    const rows = await rawRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      day_rating: "regular",
      moods: ["tranquila", "con_dolor"],
      sleep: "poco",
      food: "bien",
      author_id: caregiver.userId,
      entry_date: "2026-11-14",
    });
    expect(rows[0].note_enc).toMatch(/^v1\./);
    expect(JSON.stringify(rows[0])).not.toContain(NOTE);

    const entries = await listEntries(caregiver.client, circleId);
    expect(entries).toHaveLength(1);
    expect(entries[0].note).toBe(NOTE);
    expect(entries[0].moods).toEqual(["tranquila", "con_dolor"]);
  });

  it("guardar de nuevo el mismo día local actualiza la misma fila", async () => {
    const before = (await rawRows())[0];
    const result = await saveEntry(
      caregiver.client,
      caregiver.userId,
      circleId,
      { dayRating: "bueno", moods: ["feliz"] },
      new Date("2026-11-15T01:00:00Z"), // 22:00 del 14 en Santiago
    );
    expect(result.ok).toBe(true);
    const rows = await rawRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(before.id);
    expect(rows[0]).toMatchObject({
      day_rating: "bueno",
      moods: ["feliz"],
      sleep: null,
      food: null,
      note_enc: null,
    });
    const today = await getEntry(caregiver.client, circleId, "2026-11-14");
    expect(today?.note).toBeNull();
  });

  it("otro día local crea otra entrada y la lista va de la más reciente a la más antigua", async () => {
    const result = await saveEntry(
      caregiver.client,
      caregiver.userId,
      circleId,
      { dayRating: "dificil", moods: [], note: "   " },
      TOMORROW,
    );
    expect(result.ok).toBe(true);
    const entries = await listEntries(caregiver.client, circleId);
    expect(entries.map((entry) => entry.entryDate)).toEqual([
      "2026-11-15",
      "2026-11-14",
    ]);
    expect(entries[0].note).toBeNull();
  });

  it("rechaza lo que no calza y no guarda nada", async () => {
    const before = (await rawRows()).length;
    const bad: unknown[] = [
      { dayRating: "bueno", moods: ["eufórica"] },
      { dayRating: "bueno", moods: ["feliz", "feliz"] },
      { dayRating: "genial", moods: [] },
      { moods: ["feliz"] },
      { dayRating: "bueno", sleep: "mucho" },
      { dayRating: "bueno", note: "x".repeat(1001) },
    ];
    for (const input of bad) {
      const result = await saveEntry(
        caregiver.client,
        caregiver.userId,
        circleId,
        input,
        new Date("2026-11-20T15:00:00Z"),
      );
      expect(result).toMatchObject({
        ok: false,
        error: { code: "validation_failed" },
      });
    }
    expect(await rawRows()).toHaveLength(before);
  });
});

describe("permisos", () => {
  it("un familiar lee las entradas pero no puede guardar", async () => {
    const entries = await listEntries(family.client, circleId);
    expect(entries.length).toBeGreaterThanOrEqual(2);

    // Día sin entrada: el insert lo frena RLS.
    const newDay = await saveEntry(
      family.client,
      family.userId,
      circleId,
      { dayRating: "bueno" },
      new Date("2026-11-25T15:00:00Z"),
    );
    expect(newDay).toMatchObject({ ok: false, error: { code: "forbidden" } });

    // Día con entrada: el update no toca ninguna fila.
    const sameDay = await saveEntry(
      family.client,
      family.userId,
      circleId,
      { dayRating: "dificil" },
      NOW,
    );
    expect(sameDay).toMatchObject({ ok: false, error: { code: "forbidden" } });
    const today = await getEntry(caregiver.client, circleId, "2026-11-14");
    expect(today?.dayRating).toBe("bueno");
  });

  it("quien no es del círculo lee cero entradas y no puede guardar", async () => {
    expect(await listEntries(stranger.client, circleId)).toEqual([]);
    const result = await saveEntry(
      stranger.client,
      stranger.userId,
      circleId,
      { dayRating: "bueno" },
      NOW,
    );
    expect(result.ok).toBe(false);
  });
});
