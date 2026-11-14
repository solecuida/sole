import { describe, expect, it } from "vitest";
import { Constants } from "@/lib/supabase/database.types";
import { ruleSchema, templateItemSchema } from "@/server/reminders/rule-schema";
import { adminClient, createTestUser } from "./helpers";

const CARE_TYPES = Constants.public.Enums.care_type;
const SEED_RESOURCE = "Recurso de prueba (solo local)";

/** Texto sin tildes y en minúsculas, para buscar palabras prohibidas. */
function plain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

describe("plantillas por tipo de cuidado", () => {
  it("hay una plantilla por cada tipo de cuidado", async () => {
    const { data, error } = await adminClient()
      .from("care_templates")
      .select("care_type");
    expect(error).toBeNull();
    expect(data?.map((row) => row.care_type).sort()).toEqual(
      [...CARE_TYPES].sort(),
    );
  });

  for (const careType of CARE_TYPES) {
    it(`${careType}: sus ítems son válidos`, async () => {
      const { data } = await adminClient()
        .from("care_templates")
        .select("name, description, items")
        .eq("care_type", careType)
        .single();
      const items = data?.items;
      expect(Array.isArray(items)).toBe(true);
      const list = items as unknown[];
      if (careType === "desde_cero") {
        expect(list).toHaveLength(0);
        return;
      }
      expect(list.length).toBeGreaterThanOrEqual(3);
      expect(list.length).toBeLessThanOrEqual(6);
      for (const item of list) {
        const parsed = templateItemSchema.safeParse(item);
        expect(
          parsed.success,
          `${careType}: ${JSON.stringify(item)} → ${JSON.stringify(parsed.error?.issues)}`,
        ).toBe(true);
      }
    });
  }

  it("ninguna plantilla trae consejo médico, de alimentación ni cantidades", async () => {
    const { data } = await adminClient()
      .from("care_templates")
      .select("name, description, items");
    const text = plain(JSON.stringify(data));
    for (const word of ["dosis", "diagnostico", "dieta", "gramos", "litros"]) {
      expect(text).not.toContain(word);
    }
    expect(text).not.toMatch(/\bmg\b/);
  });

  it("una usuaria con sesión puede leer las plantillas", async () => {
    const user = await createTestUser();
    const { data, error } = await user.client
      .from("care_templates")
      .select("care_type");
    expect(error).toBeNull();
    expect(data).toHaveLength(CARE_TYPES.length);
  });
});

describe("consejos y actividades", () => {
  it("hay al menos 20 activos, 5 de ellos actividades con título", async () => {
    const { data, error } = await adminClient()
      .from("tips")
      .select("kind, text, activity_title")
      .eq("active", true);
    expect(error).toBeNull();
    const tips = data ?? [];
    expect(tips.length).toBeGreaterThanOrEqual(20);
    const activities = tips.filter((tip) => tip.kind === "actividad");
    expect(activities.length).toBeGreaterThanOrEqual(5);
    for (const activity of activities) {
      expect(activity.activity_title).toBeTruthy();
    }
  });

  it("ninguno contiene dosis, mg, diagnóstico ni dieta", async () => {
    const { data } = await adminClient()
      .from("tips")
      .select("text, activity_title");
    for (const tip of data ?? []) {
      const text = plain(`${tip.text} ${tip.activity_title ?? ""}`);
      for (const word of ["dosis", "diagnostico", "dieta"]) {
        expect(text, tip.text).not.toContain(word);
      }
      expect(text, tip.text).not.toMatch(/\bmg\b/);
    }
  });
});

describe("directorio de recursos", () => {
  it("los recursos de la migración tienen fuente https y están sin verificar", async () => {
    const { data, error } = await adminClient()
      .from("resources")
      .select("name, description, source_url, verified_at")
      .neq("name", SEED_RESOURCE);
    expect(error).toBeNull();
    const resources = data ?? [];
    expect(resources.length).toBeGreaterThanOrEqual(6);
    for (const resource of resources) {
      expect(resource.source_url, resource.name).toMatch(/^https:\/\//);
      expect(resource.verified_at, resource.name).toBeNull();
    }
  });

  it("toda descripción con una cifra o teléfono lleva [VERIFICAR]", async () => {
    const { data } = await adminClient()
      .from("resources")
      .select("name, description")
      .neq("name", SEED_RESOURCE);
    for (const resource of data ?? []) {
      if (/\d/.test(resource.description)) {
        expect(resource.description, resource.name).toContain("[VERIFICAR]");
      }
    }
  });

  it("una usuaria no ve recursos sin verificar", async () => {
    const user = await createTestUser();
    const { data, error } = await user.client.from("resources").select("name");
    expect(error).toBeNull();
    expect(data?.map((row) => row.name)).toEqual([SEED_RESOURCE]);
  });
});

describe("ruleSchema", () => {
  it("rechaza día de semana, hora y fecha inválidos, cada uno con su aviso", () => {
    const result = ruleSchema.safeParse({
      freq: "weekly",
      weekdays: [8],
      times: ["25:00"],
      startDate: "2026-02-30",
    });
    expect(result.success).toBe(false);
    const paths = (result.error?.issues ?? []).map((issue) => issue.path[0]);
    expect(paths).toContain("weekdays");
    expect(paths).toContain("times");
    expect(paths).toContain("startDate");
  });

  it("acepta cada frecuencia bien formada", () => {
    const base = { times: ["09:00"], startDate: "2026-11-14" };
    for (const rule of [
      { ...base, freq: "once", date: "2026-12-01" },
      { ...base, freq: "daily" },
      { ...base, freq: "weekly", weekdays: [1, 3, 5] },
      { ...base, freq: "interval", everyDays: 2 },
      { ...base, freq: "monthly", dayOfMonth: 31 },
      { ...base, freq: "yearly", month: 2, day: 29 },
      { ...base, freq: "daily", endDate: "2026-11-14" },
    ]) {
      expect(ruleSchema.safeParse(rule).success, JSON.stringify(rule)).toBe(
        true,
      );
    }
  });

  it("rechaza horas repetidas, más de 8 horas, término antes del inicio y claves extra", () => {
    const base = { freq: "daily", times: ["09:00"], startDate: "2026-11-14" };
    for (const rule of [
      { ...base, times: ["09:00", "09:00"] },
      { ...base, times: [] },
      {
        ...base,
        times: [
          "01:00",
          "02:00",
          "03:00",
          "04:00",
          "05:00",
          "06:00",
          "07:00",
          "08:00",
          "09:00",
        ],
      },
      { ...base, endDate: "2026-11-13" },
      { ...base, nota: "texto libre" },
      { ...base, freq: "weekly", weekdays: [1, 1] },
      { ...base, freq: "interval", everyDays: 1 },
      { ...base, freq: "hourly" },
    ]) {
      expect(ruleSchema.safeParse(rule).success, JSON.stringify(rule)).toBe(
        false,
      );
    }
  });
});
