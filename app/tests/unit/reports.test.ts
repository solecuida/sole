import { describe, expect, it } from "vitest";
import { milestones } from "@/server/reports/milestones";
import {
  BANNED_WORDS,
  type ReportRows,
  summarize,
} from "@/server/reports/summary";

const TZ = "America/Santiago";
// Mediodía en Chile del 15 de noviembre de 2026.
const NOW = new Date("2026-11-15T15:00:00Z");

const empty = (): ReportRows => ({
  timezone: TZ,
  occurrences: [],
  journal: [],
  tasks: [],
  selfcare: [],
  firstActivity: null,
});

function medWeek(done: number, total: number): ReportRows["occurrences"] {
  return Array.from({ length: total }, (_, index) => ({
    localDate: `2026-11-${String(9 + (index % 7)).padStart(2, "0")}`,
    kind: "medication" as const,
    status: index < done ? ("done" as const) : ("not_done" as const),
  }));
}

describe("summarize", () => {
  it("10 medicamentos con 9 hechos dan 0.9 y la frase fija", () => {
    const summary = summarize(
      { ...empty(), occurrences: medWeek(9, 10) },
      "semana",
      "caregiver",
    );
    expect(summary.medication.rate).toBe(0.9);
    expect(summary.sentences).toContain(
      "Esta semana se cumplió el 90 % de los medicamentos.",
    );
    // El espacio es un espacio normal, no uno duro.
    expect(summary.sentences.join(" ")).not.toContain(" ");
  });

  it("no cuenta lo saltado", () => {
    const rows = {
      ...empty(),
      occurrences: [
        ...medWeek(1, 2),
        {
          localDate: "2026-11-10",
          kind: "medication" as const,
          status: "skipped" as const,
        },
      ],
    };
    expect(summarize(rows, "semana", "caregiver").medication.total).toBe(2);
  });

  it("3 días difíciles dicen 'Hubo 3 días difíciles.' y ninguna frase usa palabras prohibidas", () => {
    const rows: ReportRows = {
      ...empty(),
      occurrences: medWeek(5, 10),
      journal: [
        { entryDate: "2026-11-09", dayRating: "dificil" },
        { entryDate: "2026-11-10", dayRating: "dificil" },
        { entryDate: "2026-11-11", dayRating: "dificil" },
        { entryDate: "2026-11-12", dayRating: "bueno" },
        { entryDate: "2026-11-13", dayRating: "regular" },
      ],
      tasks: [{ doneDate: "2026-11-12" }],
      selfcare: [{ date: "2026-11-12", score: 3 }],
    };
    const summary = summarize(rows, "semana", "caregiver");
    expect(summary.sentences).toContain("Hubo 3 días difíciles.");
    for (const sentence of summary.sentences) {
      for (const word of BANNED_WORDS) {
        expect(sentence.toLowerCase()).not.toContain(word);
      }
    }
  });

  it("usa el singular con 1 día difícil", () => {
    const rows: ReportRows = {
      ...empty(),
      journal: [{ entryDate: "2026-11-09", dayRating: "dificil" }],
    };
    expect(summarize(rows, "dia", "family").sentences).toContain(
      "Hubo 1 día difícil.",
    );
  });

  it("para la familia no sale ningún dato de bienestar propio", () => {
    const rows: ReportRows = {
      ...empty(),
      occurrences: medWeek(9, 10),
      selfcare: [
        { date: "2026-11-12", score: 2 },
        { date: "2026-11-13", score: 4 },
      ],
    };
    const family = summarize(rows, "semana", "family");
    expect(family.selfcare).toBeNull();
    expect(family.sentences.some((s) => s.includes("Respondiste"))).toBe(false);
    expect(summarize(rows, "semana", "caregiver").selfcare).toEqual({
      days: 2,
      average: 3,
    });
  });

  it("sin datos no hay frases ni 'hasData'", () => {
    const summary = summarize(empty(), "semana", "caregiver");
    expect(summary.hasData).toBe(false);
    expect(summary.sentences).toEqual([]);
    expect(summary.medication.rate).toBeNull();
  });
});

/** Medicamentos `done` desde `from` hasta `to` (días locales), uno por día. */
function streak(from: number, to: number): ReportRows["occurrences"] {
  const base = Date.UTC(2026, 10, 15);
  const rows: ReportRows["occurrences"] = [];
  for (let back = from; back <= to; back += 1) {
    rows.push({
      localDate: new Date(base - back * 86_400_000).toISOString().slice(0, 10),
      kind: "medication",
      status: "done",
    });
  }
  return rows;
}

describe("milestones", () => {
  it("30 días seguidos con todo hecho dan medicamentos_30_dias", () => {
    const keys = milestones(
      { ...empty(), occurrences: streak(0, 29) },
      NOW,
    ).map((item) => item.key);
    expect(keys).toContain("medicamentos_30_dias");
  });

  it("si hoy aún hay algo pendiente, cuenta hasta ayer", () => {
    const rows = {
      ...empty(),
      occurrences: [
        ...streak(1, 30),
        {
          localDate: "2026-11-15",
          kind: "medication" as const,
          status: "pending" as const,
        },
      ],
    };
    expect(milestones(rows, NOW).map((item) => item.key)).toContain(
      "medicamentos_30_dias",
    );
  });

  it("un solo olvido en el medio corta la racha", () => {
    const occurrences = streak(0, 29);
    occurrences[10] = { ...occurrences[10], status: "not_done" };
    expect(
      milestones({ ...empty(), occurrences }, NOW).map((item) => item.key),
    ).not.toContain("medicamentos_30_dias");
  });

  it("29 días no alcanzan", () => {
    expect(milestones({ ...empty(), occurrences: streak(0, 28) }, NOW)).toEqual(
      [],
    );
  });

  it("un mes desde la primera actividad da un_mes_con_sole", () => {
    const keys = (firstActivity: string) =>
      milestones({ ...empty(), firstActivity }, NOW).map((item) => item.key);
    expect(keys("2026-10-16")).toEqual(["un_mes_con_sole"]);
    expect(keys("2026-10-17")).toEqual([]);
  });

  it("los textos no usan palabras prohibidas", () => {
    const items = milestones(
      { ...empty(), occurrences: streak(0, 29), firstActivity: "2026-01-01" },
      NOW,
    );
    expect(items).toHaveLength(2);
    for (const item of items) {
      for (const word of BANNED_WORDS) {
        expect(item.text.toLowerCase()).not.toContain(word);
      }
    }
  });
});
