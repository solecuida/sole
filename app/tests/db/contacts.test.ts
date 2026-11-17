import { beforeAll, describe, expect, it } from "vitest";
import {
  createContact,
  deleteContact,
  emergencyContactFor,
  getContact,
  listContacts,
  telHref,
  updateContact,
} from "@/server/contacts/contacts";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

const DOCTOR = {
  name: "Dra. Pérez",
  kind: "medico",
  phone: "+56 2 2345 6789",
  notes: "Atiende los martes por la tarde.",
};

let caregiver: TestUser;
let family: TestUser;
let stranger: TestUser;
let circleId: string;
let otherCircleId: string;

async function rawRow(id: string) {
  const { data } = await adminClient()
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) {
    throw new Error("contacto no encontrado");
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
  otherCircleId = await createCircleFor(stranger.client, "Otra");
  const member = await adminClient().from("circle_members").insert({
    circle_id: circleId,
    user_id: family.userId,
    role: "family",
    display_name: "Pedro",
  });
  expect(member.error).toBeNull();
});

describe("telHref", () => {
  it("deja solo el + inicial y los dígitos", () => {
    expect(telHref("+56 2 2345 6789")).toBe("tel:+56223456789");
    expect(telHref("(02) 2345-6789")).toBe("tel:0223456789");
    expect(telHref("  600 360 7777 ")).toBe("tel:6003607777");
  });
});

describe("createContact", () => {
  it("lista el contacto con el enlace tel: y cifra la nota con v1.", async () => {
    const result = await createContact(caregiver.client, circleId, DOCTOR);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const row = await rawRow(result.data.id);
    expect(row.notes_enc?.startsWith("v1.")).toBe(true);
    expect(JSON.stringify(row)).not.toContain("martes");
    expect(row).toMatchObject({
      name: "Dra. Pérez",
      kind: "medico",
      phone: "+56 2 2345 6789",
      is_emergency: false,
      circle_id: circleId,
    });

    const list = await listContacts(caregiver.client, circleId);
    const saved = list.find((contact) => contact.id === result.data.id);
    expect(saved).toMatchObject({
      name: "Dra. Pérez",
      notes: "Atiende los martes por la tarde.",
    });
    expect(telHref(saved?.phone ?? "")).toBe("tel:+56223456789");
  });

  it("sin nota no guarda nada cifrado", async () => {
    const result = await createContact(caregiver.client, circleId, {
      name: "Farmacia del barrio",
      kind: "farmacia",
      phone: "223456789",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((await rawRow(result.data.id)).notes_enc).toBeNull();
    }
  });

  it("rechaza un teléfono con letras", async () => {
    const result = await createContact(caregiver.client, circleId, {
      ...DOCTOR,
      phone: "llamar al 2345",
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "validation_failed" },
    });
  });

  it("rechaza un tipo desconocido, un nombre vacío y una nota larga", async () => {
    for (const bad of [
      { ...DOCTOR, kind: "alergias" },
      { ...DOCTOR, name: "   " },
      { ...DOCTOR, notes: "x".repeat(301) },
    ]) {
      const result = await createContact(caregiver.client, circleId, bad);
      expect(result).toMatchObject({
        ok: false,
        error: { code: "validation_failed" },
      });
    }
  });

  it("una familiar no puede crear, cambiar ni quitar contactos", async () => {
    const created = await createContact(family.client, circleId, DOCTOR);
    expect(created).toMatchObject({ ok: false, error: { code: "forbidden" } });

    const mine = await createContact(caregiver.client, circleId, {
      ...DOCTOR,
      name: "Para la familia",
    });
    expect(mine.ok).toBe(true);
    if (!mine.ok) {
      return;
    }
    // La familiar sí lo ve…
    expect(await getContact(family.client, mine.data.id)).not.toBeNull();
    // …pero no lo cambia ni lo borra.
    expect(
      await updateContact(family.client, mine.data.id, DOCTOR),
    ).toMatchObject({ ok: false, error: { code: "forbidden" } });
    expect(await deleteContact(family.client, mine.data.id)).toMatchObject({
      ok: false,
      error: { code: "forbidden" },
    });
    expect((await rawRow(mine.data.id)).name).toBe("Para la familia");
  });

  it("alguien de otro círculo ni lo ve ni lo cambia", async () => {
    const mine = await createContact(caregiver.client, circleId, {
      ...DOCTOR,
      name: "Solo de este círculo",
    });
    expect(mine.ok).toBe(true);
    if (!mine.ok) {
      return;
    }
    expect(await getContact(stranger.client, mine.data.id)).toBeNull();
    expect(
      await updateContact(stranger.client, mine.data.id, DOCTOR),
    ).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(
      await createContact(stranger.client, circleId, DOCTOR),
    ).toMatchObject({ ok: false, error: { code: "forbidden" } });
  });
});

describe("updateContact y deleteContact", () => {
  it("edita, vuelve a cifrar la nota y la deja vacía si se borra", async () => {
    const created = await createContact(caregiver.client, circleId, DOCTOR);
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const edited = await updateContact(caregiver.client, created.data.id, {
      ...DOCTOR,
      phone: "+56 9 8765 4321",
      notes: "Nueva nota",
    });
    expect(edited.ok).toBe(true);
    const view = await getContact(caregiver.client, created.data.id);
    expect(view).toMatchObject({
      phone: "+56 9 8765 4321",
      notes: "Nueva nota",
    });

    await updateContact(caregiver.client, created.data.id, {
      ...DOCTOR,
      notes: "",
    });
    expect((await rawRow(created.data.id)).notes_enc).toBeNull();

    const removed = await deleteContact(caregiver.client, created.data.id);
    expect(removed.ok).toBe(true);
    expect(await getContact(caregiver.client, created.data.id)).toBeNull();
  });

  it("un contacto que no existe responde not_found", async () => {
    expect(
      await deleteContact(caregiver.client, crypto.randomUUID()),
    ).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(await deleteContact(caregiver.client, "no-es-un-id")).toMatchObject({
      ok: false,
      error: { code: "not_found" },
    });
  });

  it("una nota que no se puede descifrar se muestra vacía y la lista sigue", async () => {
    const created = await createContact(caregiver.client, circleId, {
      ...DOCTOR,
      name: "Nota dañada",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    await adminClient()
      .from("contacts")
      .update({ notes_enc: "v1.AAAA.BBBB" })
      .eq("id", created.data.id);
    const list = await listContacts(caregiver.client, circleId);
    expect(list.find((c) => c.id === created.data.id)?.notes).toBe("");
    expect(list.length).toBeGreaterThan(1);
  });
});

describe("emergencyContactFor", () => {
  it("devuelve el contacto de emergencia actualizado más recientemente, solo con nombre y teléfono", async () => {
    const admin = adminClient();
    expect(await emergencyContactFor(admin, circleId)).toBeNull();

    const first = await createContact(caregiver.client, circleId, {
      name: "Hijo mayor",
      kind: "familia",
      phone: "+56 9 1111 1111",
      notes: "No debe salir en la emergencia",
      isEmergency: true,
    });
    const second = await createContact(caregiver.client, circleId, {
      name: "Vecina",
      kind: "otro",
      phone: "+56 9 2222 2222",
      isEmergency: true,
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }

    const latest = await emergencyContactFor(admin, circleId);
    expect(latest).toEqual({ name: "Vecina", phone: "+56 9 2222 2222" });
    expect(Object.keys(latest ?? {}).sort()).toEqual(["name", "phone"]);

    // Editar el primero lo vuelve el más reciente.
    await updateContact(caregiver.client, first.data.id, {
      name: "Hijo mayor",
      kind: "familia",
      phone: "+56 9 1111 1111",
      isEmergency: true,
    });
    expect(await emergencyContactFor(admin, circleId)).toEqual({
      name: "Hijo mayor",
      phone: "+56 9 1111 1111",
    });
  });

  it("no devuelve el contacto de otro círculo ni uno que no es de emergencia", async () => {
    const admin = adminClient();
    const other = await createContact(stranger.client, otherCircleId, {
      name: "Contacto ajeno",
      kind: "medico",
      phone: "+56 9 3333 3333",
      isEmergency: true,
    });
    expect(other.ok).toBe(true);

    const mine = await emergencyContactFor(admin, otherCircleId);
    expect(mine).toEqual({ name: "Contacto ajeno", phone: "+56 9 3333 3333" });

    const fromFirst = await emergencyContactFor(admin, circleId);
    expect(fromFirst?.name).not.toBe("Contacto ajeno");

    // Un círculo sin contactos de emergencia no toma prestado el de otro.
    const empty = await createTestUser({ consents: true });
    const emptyCircle = await createCircleFor(empty.client, "Sin contactos");
    await createContact(empty.client, emptyCircle, {
      name: "No es de emergencia",
      kind: "otro",
      phone: "223456789",
    });
    expect(await emergencyContactFor(admin, emptyCircle)).toBeNull();
    expect(await emergencyContactFor(admin, "no-es-un-id")).toBeNull();
  });
});
