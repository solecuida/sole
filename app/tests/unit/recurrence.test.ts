import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  advanceNotices,
  expandRule,
  localDateOf,
  zonedInstant,
} from "@/server/reminders/recurrence";
import type { ReminderRule } from "@/server/reminders/rule-schema";

const TZ = "America/Santiago";
const local = (instant: Date, pattern = "yyyy-MM-dd HH:mm") =>
  format(new TZDate(instant, TZ), pattern);
/** Inicio del día local. */
const startOf = (date: string) => zonedInstant(date, "00:00", TZ);
/** Último minuto del día local. */
const endOf = (date: string) => zonedInstant(date, "23:59", TZ);

describe("localDateOf y zonedInstant", () => {
  it("el día local no es el día UTC", () => {
    // 02:30 UTC del 15 todavía es 14 en Chile (UTC-3 en noviembre).
    expect(localDateOf(new Date("2026-11-15T02:30:00Z"), TZ)).toBe(
      "2026-11-14",
    );
    expect(localDateOf(new Date("2026-11-15T03:00:00Z"), TZ)).toBe(
      "2026-11-15",
    );
  });

  it("convierte fecha y hora local a UTC según la época del año", () => {
    // Verano: UTC-3. Invierno: UTC-4.
    expect(zonedInstant("2027-01-15", "08:00", TZ).toISOString()).toBe(
      "2027-01-15T11:00:00.000Z",
    );
    expect(zonedInstant("2027-07-15", "08:00", TZ).toISOString()).toBe(
      "2027-07-15T12:00:00.000Z",
    );
  });

  it("sirve para otras zonas de Chile", () => {
    expect(
      zonedInstant("2027-07-15", "08:00", "America/Punta_Arenas").toISOString(),
    ).toBe("2027-07-15T11:00:00.000Z");
  });
});

describe("expandRule", () => {
  it("diaria a las 08:00 y 20:00 durante 14 días: 28 instantes a esas horas", () => {
    const rule: ReminderRule = {
      freq: "daily",
      times: ["08:00", "20:00"],
      startDate: "2026-11-01",
    };
    const instants = expandRule(
      rule,
      TZ,
      startOf("2026-11-14"),
      endOf("2026-11-27"),
    );
    expect(instants).toHaveLength(28);
    for (const instant of instants) {
      expect(["08:00", "20:00"]).toContain(local(instant, "HH:mm"));
    }
    expect(local(instants[0])).toBe("2026-11-14 08:00");
    expect(local(instants[27])).toBe("2026-11-27 20:00");
  });

  it("devuelve los instantes ordenados y sin duplicados aunque las horas vengan desordenadas", () => {
    const instants = expandRule(
      { freq: "daily", times: ["20:00", "08:00"], startDate: "2026-11-01" },
      TZ,
      startOf("2026-11-14"),
      endOf("2026-11-16"),
    );
    const times = instants.map((instant) => instant.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
  });

  it("semanal lunes, miércoles y viernes durante dos semanas", () => {
    const instants = expandRule(
      {
        freq: "weekly",
        weekdays: [1, 3, 5],
        times: ["09:00"],
        startDate: "2026-11-01",
      },
      TZ,
      startOf("2026-11-16"), // lunes
      endOf("2026-11-29"), // domingo
    );
    expect(instants.map((instant) => local(instant, "yyyy-MM-dd i"))).toEqual([
      "2026-11-16 1",
      "2026-11-18 3",
      "2026-11-20 5",
      "2026-11-23 1",
      "2026-11-25 3",
      "2026-11-27 5",
    ]);
  });

  it("cada 3 días cuenta desde la fecha de inicio", () => {
    const instants = expandRule(
      {
        freq: "interval",
        everyDays: 3,
        times: ["10:00"],
        startDate: "2026-11-10",
      },
      TZ,
      startOf("2026-11-01"),
      endOf("2026-11-20"),
    );
    expect(instants.map((instant) => local(instant, "yyyy-MM-dd"))).toEqual([
      "2026-11-10",
      "2026-11-13",
      "2026-11-16",
      "2026-11-19",
    ]);
  });

  it("mensual el día 31 usa el último día de los meses más cortos", () => {
    const instants = expandRule(
      {
        freq: "monthly",
        dayOfMonth: 31,
        times: ["10:00"],
        startDate: "2027-01-01",
      },
      TZ,
      startOf("2027-01-01"),
      endOf("2027-12-31"),
    );
    expect(instants.map((instant) => local(instant, "MM-dd"))).toEqual([
      "01-31",
      "02-28",
      "03-31",
      "04-30",
      "05-31",
      "06-30",
      "07-31",
      "08-31",
      "09-30",
      "10-31",
      "11-30",
      "12-31",
    ]);
  });

  it("anual el 29 de febrero cae el 28 en años no bisiestos", () => {
    const instants = expandRule(
      {
        freq: "yearly",
        month: 2,
        day: 29,
        times: ["09:00"],
        startDate: "2026-01-01",
      },
      TZ,
      startOf("2026-01-01"),
      endOf("2029-12-31"),
    );
    expect(instants.map((instant) => local(instant, "yyyy-MM-dd"))).toEqual([
      "2026-02-28",
      "2027-02-28",
      "2028-02-29",
      "2029-02-28",
    ]);
  });

  it("una sola vez: solo en su fecha", () => {
    const rule: ReminderRule = {
      freq: "once",
      date: "2026-12-01",
      times: ["15:00"],
      startDate: "2026-11-14",
    };
    const instants = expandRule(
      rule,
      TZ,
      startOf("2026-11-01"),
      endOf("2027-12-31"),
    );
    expect(instants.map((instant) => local(instant))).toEqual([
      "2026-12-01 15:00",
    ]);
  });

  it("nada antes de la fecha de inicio", () => {
    const instants = expandRule(
      { freq: "daily", times: ["08:00"], startDate: "2026-11-16" },
      TZ,
      startOf("2026-11-14"),
      endOf("2026-11-17"),
    );
    expect(instants.map((instant) => local(instant, "yyyy-MM-dd"))).toEqual([
      "2026-11-16",
      "2026-11-17",
    ]);
  });

  it("con fecha de término, nada después del final de ese día local", () => {
    const instants = expandRule(
      {
        freq: "daily",
        times: ["08:00", "23:30"],
        startDate: "2026-11-14",
        endDate: "2026-11-15",
      },
      TZ,
      startOf("2026-11-14"),
      endOf("2026-11-30"),
    );
    expect(instants.map((instant) => local(instant))).toEqual([
      "2026-11-14 08:00",
      "2026-11-14 23:30",
      "2026-11-15 08:00",
      "2026-11-15 23:30",
    ]);
    const endOfLastDay = startOf("2026-11-16").getTime();
    for (const instant of instants) {
      expect(instant.getTime()).toBeLessThan(endOfLastDay);
    }
  });

  it("respeta los bordes de la ventana e ignora una ventana invertida", () => {
    const rule: ReminderRule = {
      freq: "daily",
      times: ["08:00"],
      startDate: "2026-11-01",
    };
    const at = zonedInstant("2026-11-14", "08:00", TZ);
    expect(expandRule(rule, TZ, at, at)).toEqual([at]);
    expect(
      expandRule(rule, TZ, new Date(at.getTime() + 1), endOf("2026-11-14")),
    ).toEqual([]);
    expect(expandRule(rule, TZ, endOf("2026-11-14"), at)).toEqual([]);
  });
});

describe("advanceNotices", () => {
  it("control a las 15:00 con [3,1,0]: avisos a las 09:00 tres días antes, el día anterior y el mismo día", () => {
    const event = zonedInstant("2026-11-20", "15:00", TZ);
    const notices = advanceNotices(event, TZ, [3, 1, 0]);
    expect(
      notices.map((notice) => [notice.daysBefore, local(notice.fireAt)]),
    ).toEqual([
      [3, "2026-11-17 09:00"],
      [1, "2026-11-19 09:00"],
      [0, "2026-11-20 09:00"],
    ]);
  });

  it("control a las 08:00: no hay aviso el mismo día", () => {
    const event = zonedInstant("2026-11-20", "08:00", TZ);
    const notices = advanceNotices(event, TZ, [3, 1, 0]);
    expect(notices.map((notice) => notice.daysBefore)).toEqual([3, 1]);
  });

  it("control justo a las 09:00: tampoco hay aviso el mismo día", () => {
    const event = zonedInstant("2026-11-20", "09:00", TZ);
    expect(
      advanceNotices(event, TZ, [0]).map((notice) => notice.daysBefore),
    ).toEqual([]);
  });

  it("ignora días repetidos y acepta una lista vacía", () => {
    const event = zonedInstant("2026-11-20", "15:00", TZ);
    expect(
      advanceNotices(event, TZ, [1, 1, 3]).map((notice) => notice.daysBefore),
    ).toEqual([3, 1]);
    expect(advanceNotices(event, TZ, [])).toEqual([]);
  });
});
