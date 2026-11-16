import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptField, encryptField } from "@/lib/crypto/field";
import { rotateAll } from "../../scripts/rotate-field-key";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

// OJO: la base local es compartida. Cada caso trabaja con claves desechables y
// limita la rotación a SU círculo (`circleId`): así nunca vuelve a cifrar datos
// de otra prueba ni los del computador del fundador con una clave que se pierde.

const admin = adminClient();
const newKey = (version: number) =>
  `${version}:${randomBytes(32).toString("base64")}`;

const TEXTS = {
  medName: "Losartán 50 mg",
  medInstructions: "1 pastilla con el desayuno",
  note: 'Durmió bien; dijo "gracias" 🌼',
  contactNotes: "Atiende hasta las 21 h",
};

let savedCurrent: string | undefined;
let savedPrevious: string | undefined;

beforeEach(() => {
  savedCurrent = process.env.FIELD_ENCRYPTION_KEY;
  savedPrevious = process.env.FIELD_ENCRYPTION_KEY_PREVIOUS;
});

afterEach(() => {
  for (const [name, value] of [
    ["FIELD_ENCRYPTION_KEY", savedCurrent],
    ["FIELD_ENCRYPTION_KEY_PREVIOUS", savedPrevious],
  ] as const) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

/** Siembra un círculo con los cuatro campos cifrados con la clave que esté vigente. */
async function seed(): Promise<{ user: TestUser; circleId: string }> {
  const user = await createTestUser({ consents: true });
  const circleId = await createCircleFor(user.client, "Marta");
  const reminder = await user.client.from("reminders").insert({
    circle_id: circleId,
    created_by: user.userId,
    kind: "medication",
    title: "Remedio de la mañana",
    med_name_enc: encryptField(TEXTS.medName, "reminders.med_name"),
    med_instructions_enc: encryptField(
      TEXTS.medInstructions,
      "reminders.med_instructions",
    ),
    rule: { freq: "daily", times: ["08:00"], startDate: "2026-11-14" },
  });
  expect(reminder.error).toBeNull();
  // Un recordatorio sin campos cifrados: debe quedar intacto.
  const plain = await user.client.from("reminders").insert({
    circle_id: circleId,
    created_by: user.userId,
    kind: "custom",
    title: "Regar las plantas",
    rule: { freq: "daily", times: ["09:00"], startDate: "2026-11-14" },
  });
  expect(plain.error).toBeNull();
  const journal = await user.client.from("journal_entries").insert({
    circle_id: circleId,
    author_id: user.userId,
    entry_date: "2026-11-14",
    day_rating: "bueno",
    note_enc: encryptField(TEXTS.note, "journal_entries.note"),
  });
  expect(journal.error).toBeNull();
  const contact = await user.client.from("contacts").insert({
    circle_id: circleId,
    name: "Farmacia",
    kind: "farmacia",
    phone: "+56 2 2345 6789",
    notes_enc: encryptField(TEXTS.contactNotes, "contacts.notes"),
  });
  expect(contact.error).toBeNull();
  return { user, circleId };
}

async function stored(circleId: string) {
  const reminders = await admin
    .from("reminders")
    .select("med_name_enc, med_instructions_enc")
    .eq("circle_id", circleId)
    .not("med_name_enc", "is", null);
  const journal = await admin
    .from("journal_entries")
    .select("note_enc")
    .eq("circle_id", circleId);
  const contacts = await admin
    .from("contacts")
    .select("notes_enc")
    .eq("circle_id", circleId);
  return {
    medName: reminders.data?.[0]?.med_name_enc ?? "",
    medInstructions: reminders.data?.[0]?.med_instructions_enc ?? "",
    note: journal.data?.[0]?.note_enc ?? "",
    contactNotes: contacts.data?.[0]?.notes_enc ?? "",
  };
}

function decryptAll(values: Awaited<ReturnType<typeof stored>>) {
  return {
    medName: decryptField(values.medName, "reminders.med_name"),
    medInstructions: decryptField(
      values.medInstructions,
      "reminders.med_instructions",
    ),
    note: decryptField(values.note, "journal_entries.note"),
    contactNotes: decryptField(values.contactNotes, "contacts.notes"),
  };
}

/** Deja la clave 1 como anterior y una clave 2 nueva como vigente. */
function moveToVersion2(oldKey: string) {
  process.env.FIELD_ENCRYPTION_KEY = newKey(2);
  process.env.FIELD_ENCRYPTION_KEY_PREVIOUS = oldKey;
}

describe("rotateAll", () => {
  it("vuelve a cifrar con la versión 2 todo lo que estaba con la 1, sin cambiar el texto", async () => {
    const oldKey = newKey(1);
    process.env.FIELD_ENCRYPTION_KEY = oldKey;
    delete process.env.FIELD_ENCRYPTION_KEY_PREVIOUS;
    const { circleId } = await seed();
    const before = await stored(circleId);
    for (const value of Object.values(before)) {
      expect(value.startsWith("v1.")).toBe(true);
    }

    moveToVersion2(oldKey);
    const result = await rotateAll(admin, { dryRun: false, circleId });
    expect(result).toEqual({
      reminders: { scanned: 2, rotated: 2, current: 0, failed: 0 },
      journal_entries: { scanned: 1, rotated: 1, current: 0, failed: 0 },
      contacts: { scanned: 1, rotated: 1, current: 0, failed: 0 },
    });

    const after = await stored(circleId);
    for (const value of Object.values(after)) {
      expect(value.startsWith("v2.")).toBe(true);
    }
    expect(decryptAll(after)).toEqual(TEXTS);

    // Ya no depende de la clave anterior.
    delete process.env.FIELD_ENCRYPTION_KEY_PREVIOUS;
    expect(decryptAll(after)).toEqual(TEXTS);

    // Repetirlo no cambia nada.
    const again = await rotateAll(admin, { dryRun: false, circleId });
    expect(again.reminders).toEqual({
      scanned: 2,
      rotated: 0,
      current: 2,
      failed: 0,
    });
    expect(await stored(circleId)).toEqual(after);
  });

  it("en simulacro cuenta lo que haría y no cambia ninguna fila", async () => {
    const oldKey = newKey(1);
    process.env.FIELD_ENCRYPTION_KEY = oldKey;
    delete process.env.FIELD_ENCRYPTION_KEY_PREVIOUS;
    const { circleId } = await seed();
    const before = await stored(circleId);

    moveToVersion2(oldKey);
    const result = await rotateAll(admin, { dryRun: true, circleId });
    expect(result.reminders.rotated).toBe(2);
    expect(result.journal_entries.rotated).toBe(1);
    expect(result.contacts.rotated).toBe(1);
    expect(await stored(circleId)).toEqual(before);
  });

  it("sin la clave anterior no pierde nada: deja los valores como estaban y lo informa", async () => {
    const oldKey = newKey(1);
    process.env.FIELD_ENCRYPTION_KEY = oldKey;
    delete process.env.FIELD_ENCRYPTION_KEY_PREVIOUS;
    const { circleId } = await seed();
    const before = await stored(circleId);

    // Clave nueva, pero se olvidó dejar la anterior (o se puso una equivocada).
    process.env.FIELD_ENCRYPTION_KEY = newKey(2);
    process.env.FIELD_ENCRYPTION_KEY_PREVIOUS = newKey(1);
    const result = await rotateAll(admin, { dryRun: false, circleId });
    expect(result.reminders).toEqual({
      scanned: 2,
      rotated: 0,
      current: 0,
      failed: 2,
    });
    expect(result.journal_entries.failed).toBe(1);
    expect(result.contacts.failed).toBe(1);
    expect(await stored(circleId)).toEqual(before);

    // Con la clave anterior correcta, todo se recupera.
    process.env.FIELD_ENCRYPTION_KEY_PREVIOUS = oldKey;
    const fixed = await rotateAll(admin, { dryRun: false, circleId });
    expect(fixed.reminders.rotated).toBe(2);
    expect(decryptAll(await stored(circleId))).toEqual(TEXTS);
  });

  it("no toca los datos de otro círculo cuando se le indica uno", async () => {
    const oldKey = newKey(1);
    process.env.FIELD_ENCRYPTION_KEY = oldKey;
    delete process.env.FIELD_ENCRYPTION_KEY_PREVIOUS;
    const mine = await seed();
    const other = await seed();
    const otherBefore = await stored(other.circleId);

    moveToVersion2(oldKey);
    await rotateAll(admin, { dryRun: false, circleId: mine.circleId });
    expect(await stored(other.circleId)).toEqual(otherBefore);
  });
});
