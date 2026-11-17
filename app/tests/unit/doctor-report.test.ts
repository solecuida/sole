import { describe, expect, it } from "vitest";
import {
  buildDoctorReport,
  type DoctorRows,
  monthRange,
  parseMonth,
  shiftMonth,
} from "@/server/reports/doctor-report";
import { BANNED_WORDS } from "@/server/reports/summary";

const TZ = "America/Santiago";

function rows(overrides: Partial<DoctorRows> = {}): DoctorRows {
  return {
    timezone: TZ,
    reminders: [
      {
        id: "med-1",
        kind: "medication",
        title: "Pastilla",
        medName: "Losartán",
      },
      {
        id: "med-2",
        kind: "medication",
        title: "Gotas de la noche",
        medName: null,
      },
      { id: "act-1", kind: "activity", title: "Caminata", medName: null },
    ],
    occurrences: [],
    journal: [],
    ...overrides,
  };
}

const day = (n: number) => `2027-03-${String(n).padStart(2, "0")}`;

describe("buildDoctorReport", () => {
  it("cuenta el cumplimiento por recordatorio de medicamento", () => {
    const report = buildDoctorReport(
      rows({
        occurrences: [
          ...Array.from({ length: 10 }, (_, index) => ({
            reminderId: "med-1",
            localDate: day(index + 1),
            status: index < 9 ? ("done" as const) : ("not_done" as const),
          })),
          { reminderId: "med-2", localDate: day(3), status: "done" as const },
          {
            reminderId: "med-2",
            localDate: day(4),
            status: "not_done" as const,
          },
        ],
      }),
      "2027-03",
    );
    expect(report.medication).toEqual([
      expect.objectContaining({
        label: "Gotas de la noche",
        done: 1,
        total: 2,
        text: "50 %",
      }),
      expect.objectContaining({
        label: "Losartán",
        done: 9,
        total: 10,
        text: "90 %",
      }),
    ]);
    expect(report.hasData).toBe(true);
  });

  it("muestra el título si el nombre del medicamento no se pudo leer", () => {
    const report = buildDoctorReport(
      rows({
        occurrences: [
          { reminderId: "med-2", localDate: day(1), status: "done" },
        ],
      }),
      "2027-03",
    );
    expect(report.medication[0].label).toBe("Gotas de la noche");
  });

  it("cuenta las actividades hechas y el resumen de la bitácora por calificación", () => {
    const report = buildDoctorReport(
      rows({
        occurrences: [
          { reminderId: "act-1", localDate: day(2), status: "done" },
          { reminderId: "act-1", localDate: day(3), status: "done" },
          { reminderId: "act-1", localDate: day(4), status: "not_done" },
        ],
        journal: [
          { entryDate: day(1), dayRating: "bueno" },
          { entryDate: day(2), dayRating: "dificil" },
          { entryDate: day(3), dayRating: "dificil" },
          { entryDate: "2027-04-01", dayRating: "regular" },
        ],
      }),
      "2027-03",
    );
    expect(report.activities).toEqual({
      total: 2,
      items: [{ label: "Caminata", done: 2 }],
    });
    expect(report.journal).toEqual({
      days: 3,
      bueno: 1,
      regular: 0,
      dificil: 2,
    });
    expect(report.sentences).toContain("Hubo 2 días difíciles.");
  });

  it("ignora lo saltado y lo de otros meses", () => {
    const report = buildDoctorReport(
      rows({
        occurrences: [
          { reminderId: "med-1", localDate: day(1), status: "skipped" },
          { reminderId: "med-1", localDate: "2027-02-28", status: "done" },
        ],
      }),
      "2027-03",
    );
    expect(report.medication).toEqual([]);
    expect(report.hasData).toBe(false);
  });

  it("trae la sección vacía de preguntas de la familia", () => {
    const report = buildDoctorReport(rows(), "2027-03");
    expect(report.questions.title).toBe(
      "Preguntas de la familia para el control",
    );
    expect(report.questions.blankLines).toBeGreaterThan(0);
  });

  it("no incluye bienestar ni palabras prohibidas", () => {
    const report = buildDoctorReport(
      rows({
        occurrences: [
          { reminderId: "med-1", localDate: day(1), status: "done" },
          { reminderId: "act-1", localDate: day(2), status: "done" },
        ],
        journal: [{ entryDate: day(1), dayRating: "dificil" }],
      }),
      "2027-03",
    );
    const text = JSON.stringify(report).toLowerCase();
    for (const word of BANNED_WORDS) {
      expect(text).not.toContain(word);
    }
    expect(text).not.toContain("respondiste");
    expect(text).not.toContain("selfcare");
    expect(report.sentences.join(" ")).not.toContain("promedio");
  });
});

describe("meses", () => {
  it("parseMonth acepta YYYY-MM y si no, usa el mes de hoy", () => {
    expect(parseMonth("2027-03", "2026-11-15")).toBe("2027-03");
    expect(parseMonth("2027-13", "2026-11-15")).toBe("2026-11");
    expect(parseMonth(undefined, "2026-11-15")).toBe("2026-11");
    expect(parseMonth(["2027-03"], "2026-11-15")).toBe("2026-11");
  });

  it("monthRange y shiftMonth cuidan febrero y el cambio de año", () => {
    expect(monthRange("2028-02")).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
    expect(monthRange("2027-02").to).toBe("2027-02-28");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});
