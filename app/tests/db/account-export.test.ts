import { beforeAll, describe, expect, it } from "vitest";
import { GET } from "@/app/api/cuenta/exportar/route";
import { encryptField } from "@/lib/crypto/field";
import { type AccountExport, toCsv } from "@/server/account/export";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

const admin = adminClient();
const BASE = "http://localhost:3000/api/cuenta/exportar";

function request(user: TestUser | null, query: string): Promise<Response> {
  return GET(
    new Request(`${BASE}${query}`, {
      headers: user ? { authorization: `Bearer ${user.accessToken}` } : {},
    }),
  );
}

let a: TestUser;
let b: TestUser;
let circleA: string;
let circleB: string;

/** Siembra un círculo completo con datos reconocibles por su marca. */
async function seed(user: TestUser, circleId: string, mark: string) {
  const reminder = await user.client
    .from("reminders")
    .insert({
      circle_id: circleId,
      created_by: user.userId,
      kind: "medication",
      title: `Remedio ${mark}`,
      med_name_enc: encryptField(`Losartán ${mark}`, "reminders.med_name"),
      med_instructions_enc: encryptField(
        `1 pastilla ${mark}`,
        "reminders.med_instructions",
      ),
      rule: { freq: "daily", times: ["08:00"], startDate: "2026-11-14" },
    })
    .select("id")
    .single();
  expect(reminder.error).toBeNull();
  const occurrence = await admin.from("reminder_occurrences").insert({
    reminder_id: reminder.data?.id ?? "",
    circle_id: circleId,
    due_at: "2026-11-14T11:00:00Z",
    event_at: "2026-11-14T11:00:00Z",
    local_date: "2026-11-14",
    status: "done",
    done_at: "2026-11-14T11:05:00Z",
    done_via: "app",
  });
  expect(occurrence.error).toBeNull();
  const journal = await user.client.from("journal_entries").insert({
    circle_id: circleId,
    author_id: user.userId,
    entry_date: "2026-11-14",
    day_rating: "regular",
    moods: ["tranquila", "con_dolor"],
    sleep: "poco",
    food: "bien",
    note_enc: encryptField(
      `Le dolía la rodilla, "pero" sonrió ${mark}`,
      "journal_entries.note",
    ),
  });
  expect(journal.error).toBeNull();
  const task = await user.client.from("tasks").insert({
    circle_id: circleId,
    created_by: user.userId,
    title: `Comprar pañales ${mark}`,
  });
  expect(task.error).toBeNull();
  const contact = await user.client.from("contacts").insert({
    circle_id: circleId,
    name: `Farmacia ${mark}`,
    kind: "farmacia",
    phone: "+56 2 2345 6789",
    notes_enc: encryptField(`Atiende hasta las 21 ${mark}`, "contacts.notes"),
    is_emergency: true,
  });
  expect(contact.error).toBeNull();
  const checkin = await user.client.from("selfcare_checkins").insert({
    user_id: user.userId,
    checkin_date: "2026-11-14",
    score: mark === "AAA" ? 4 : 1,
  });
  expect(checkin.error).toBeNull();
}

beforeAll(async () => {
  [a, b] = await Promise.all([
    createTestUser({ consents: true }),
    createTestUser({ consents: true }),
  ]);
  circleA = await createCircleFor(a.client, "Ana");
  circleB = await createCircleFor(b.client, "Berta");
  await seed(a, circleA, "AAA");
  await seed(b, circleB, "BBB");
});

describe("GET /api/cuenta/exportar?formato=json", () => {
  it("entrega todo lo de la usuaria, con los campos cifrados ya legibles", async () => {
    const response = await request(a, "?formato=json");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="sole-datos-\d{4}-\d{2}-\d{2}\.json"$/,
    );
    expect(response.headers.get("cache-control")).toBe("no-store");

    const data = (await response.json()) as AccountExport;
    expect(data.perfil).toMatchObject({
      correo: a.email,
      zona_horaria: "America/Santiago",
    });
    expect(data.consentimientos.map((row) => row.capa).sort()).toEqual([
      "sensitive",
      "terms",
    ]);
    expect(data.circulos).toEqual([
      expect.objectContaining({
        persona_cuidada: "Persona de prueba",
        mi_rol: "caregiver",
        mi_nombre_en_el_circulo: "Ana",
      }),
    ]);
    expect(data.recordatorios).toEqual([
      expect.objectContaining({
        titulo: "Remedio AAA",
        medicamento: "Losartán AAA",
        indicacion: "1 pastilla AAA",
        tipo: "medication",
      }),
    ]);
    expect(data.cumplimiento).toEqual([
      expect.objectContaining({
        recordatorio: "Remedio AAA",
        fecha: "2026-11-14",
        estado: "done",
        hecho_desde: "app",
      }),
    ]);
    expect(data.bitacora).toEqual([
      expect.objectContaining({
        fecha: "2026-11-14",
        como_fue_el_dia: "regular",
        animo: ["tranquila", "con_dolor"],
        sueno: "poco",
        comida: "bien",
        nota: 'Le dolía la rodilla, "pero" sonrió AAA',
      }),
    ]);
    expect(data.tareas).toEqual([
      expect.objectContaining({ titulo: "Comprar pañales AAA" }),
    ]);
    expect(data.contactos).toEqual([
      expect.objectContaining({
        nombre: "Farmacia AAA",
        telefono: "+56 2 2345 6789",
        de_emergencia: true,
        nota: "Atiende hasta las 21 AAA",
      }),
    ]);
    expect(data.bienestar).toEqual([{ fecha: "2026-11-14", puntaje: 4 }]);
  });

  it("no incluye nada de círculos donde no es miembro, ni identificadores internos", async () => {
    const text = await (await request(a, "?formato=json")).text();
    expect(text).not.toContain("BBB");
    expect(text).not.toContain(b.email);
    expect(text).not.toContain(circleB);
    // Tampoco se filtra texto cifrado ni el seudónimo de investigación.
    expect(text).not.toMatch(/"v1\.[A-Za-z0-9_-]{16}\./);
    expect(text).not.toContain("pseudonym");
    expect(text).not.toContain("is_admin");
  });

  it("un familiar exporta el círculo que comparte, pero no el bienestar de la cuidadora", async () => {
    const family = await createTestUser({ consents: true });
    await admin.from("circle_members").insert({
      circle_id: circleA,
      user_id: family.userId,
      role: "family",
      display_name: "Felipe",
    });
    const data = (await (
      await request(family, "?formato=json")
    ).json()) as AccountExport;
    expect(data.circulos).toEqual([
      expect.objectContaining({ mi_rol: "family" }),
    ]);
    expect(data.bitacora).toHaveLength(1);
    expect(data.recordatorios).toHaveLength(1);
    expect(data.bienestar).toEqual([]);
  });
});

describe("GET /api/cuenta/exportar?formato=csv", () => {
  it("la bitácora sale como CSV con encabezado y una fila por entrada", async () => {
    const response = await request(a, "?formato=csv&tabla=bitacora");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/csv; charset=utf-8",
    );
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="sole-bitacora-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    const bytes = new Uint8Array(await response.arrayBuffer());
    // BOM UTF-8: Excel lo necesita para mostrar bien las tildes.
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const lines = new TextDecoder()
      .decode(bytes)
      .replace(/^﻿/, "")
      .trimEnd()
      .split("\r\n");
    expect(lines).toEqual([
      '"persona_cuidada","fecha","como_fue_el_dia","animo","sueno","comida","nota"',
      '"Persona de prueba","2026-11-14","regular","tranquila; con_dolor","poco","bien","Le dolía la rodilla, ""pero"" sonrió AAA"',
    ]);
  });

  it("cada tabla CSV responde con su encabezado", async () => {
    for (const table of [
      "recordatorios",
      "cumplimiento",
      "tareas",
      "contactos",
      "bienestar",
    ]) {
      const response = await request(a, `?formato=csv&tabla=${table}`);
      expect(response.status, table).toBe(200);
      const lines = (await response.text()).trimEnd().split("\r\n");
      expect(lines.length, table).toBe(2);
    }
  });

  it("una tabla sin filas igual trae su encabezado", async () => {
    const empty = await createTestUser();
    const text = await (
      await request(empty, "?formato=csv&tabla=bienestar")
    ).text();
    expect(text.replace(/^﻿/, "")).toBe('"fecha","puntaje"\r\n');
  });
});

describe("GET /api/cuenta/exportar · errores", () => {
  it("sin sesión responde 401", async () => {
    for (const query of ["?formato=json", "?formato=csv&tabla=bitacora"]) {
      const response = await request(null, query);
      expect(response.status).toBe(401);
      expect((await response.json()).error.code).toBe("unauthorized");
    }
  });

  it("formato o tabla desconocidos responden 422", async () => {
    for (const query of [
      "",
      "?formato=xml",
      "?formato=csv",
      "?formato=csv&tabla=profiles",
      "?formato=csv&tabla=events",
    ]) {
      expect((await request(a, query)).status, query).toBe(422);
    }
  });
});

describe("toCsv", () => {
  it("escapa comillas, comas y saltos de línea", () => {
    const csv = toCsv([{ a: 'dijo "hola"', b: "uno, dos", c: "línea\nnueva" }]);
    expect(csv).toBe(
      '﻿"a","b","c"\r\n"dijo ""hola""","uno, dos","línea\nnueva"\r\n',
    );
  });

  it("neutraliza celdas que una planilla leería como fórmula", () => {
    const csv = toCsv([
      { a: "=SUMA(A1:A9)", b: "+56 2 2345 6789", c: "-1", d: "@cmd" },
    ]);
    expect(csv).toContain(
      '"\'=SUMA(A1:A9)","\'+56 2 2345 6789","\'-1","\'@cmd"',
    );
  });

  it("convierte vacíos, listas, objetos y sí/no", () => {
    const csv = toCsv([
      { a: null, b: undefined, c: ["x", "y"], d: { k: 1 }, e: true, f: false },
    ]);
    expect(csv.split("\r\n")[1]).toBe('"","","x; y","{""k"":1}","sí","no"');
  });
});
