import { describe, expect, it } from "vitest";
import {
  buildMonth,
  buildWeek,
  type CalendarReminder,
} from "@/server/calendar/calendar";

const TZ = "America/Santiago";

const weeklyMonday: CalendarReminder = {
  id: "r-lunes",
  title: "Control de presión",
  kind: "activity",
  importance: "important",
  rule: {
    freq: "weekly",
    weekdays: [1],
    times: ["09:00"],
    startDate: "2027-01-01",
  },
};

const birthday: CalendarReminder = {
  id: "r-cumple",
  title: "Cumpleaños de Ana",
  kind: "important_date",
  importance: "normal",
  rule: {
    freq: "yearly",
    month: 3,
    day: 10,
    times: ["10:00"],
    startDate: "2020-03-10",
  },
};

function withTimes(base: CalendarReminder, times: string[]): CalendarReminder {
  return { ...base, rule: { ...base.rule, times } };
}

describe("buildMonth", () => {
  it("pone un recordatorio semanal de los lunes en cada lunes de marzo de 2027 y en ningún otro día", () => {
    const weeks = buildMonth([weeklyMonday], TZ, 2027, 3);

    // Marzo de 2027 empieza lunes 1 y termina miércoles 31: 5 semanas completas.
    expect(weeks).toHaveLength(5);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
    expect(weeks[0][0].date).toBe("2027-03-01");
    expect(weeks[4][6].date).toBe("2027-04-04");

    const withItems = weeks.flat().filter((day) => day.items.length > 0);
    expect(withItems.map((day) => day.date)).toEqual([
      "2027-03-01",
      "2027-03-08",
      "2027-03-15",
      "2027-03-22",
      "2027-03-29",
    ]);
    // Cada semana empieza en la columna de lunes.
    for (const week of weeks) {
      expect(week[0].items).toHaveLength(1);
      expect(week.slice(1).every((day) => day.items.length === 0)).toBe(true);
    }
    expect(withItems[0].items[0]).toEqual({
      reminderId: "r-lunes",
      title: "Control de presión",
      time: "09:00",
      importance: "important",
      kind: "activity",
    });
  });

  it("completa la grilla con días del mes anterior y siguiente marcados fuera del mes", () => {
    // Febrero de 2027: empieza lunes 1 y termina domingo 28; no sobra nada.
    const february = buildMonth([], TZ, 2027, 2).flat();
    expect(february.every((day) => day.inMonth)).toBe(true);

    // Abril de 2027 empieza jueves 1: la grilla parte el lunes 29 de marzo.
    const april = buildMonth([], TZ, 2027, 4);
    expect(april[0][0]).toMatchObject({ date: "2027-03-29", inMonth: false });
    expect(april[0][3]).toMatchObject({ date: "2027-04-01", inMonth: true });
    expect(april.at(-1)?.[6]).toMatchObject({
      date: "2027-05-02",
      inMonth: false,
    });
  });

  it("ordena los ítems de un día por hora", () => {
    const early = {
      ...withTimes(weeklyMonday, ["21:00", "07:30"]),
      id: "r-temprano",
      title: "Agua",
    };
    const day = buildMonth([weeklyMonday, early], TZ, 2027, 3)[0][0];
    expect(day.items.map((item) => item.time)).toEqual([
      "07:30",
      "09:00",
      "21:00",
    ]);
  });

  it("usa la zona del círculo, no la del equipo", () => {
    // 23:30 en Chile ya es el día siguiente en UTC: igual cae en el día local.
    const late = withTimes(weeklyMonday, ["23:30"]);
    const day = buildMonth([late], TZ, 2027, 3)[0][0];
    expect(day.date).toBe("2027-03-01");
    expect(day.items.map((item) => item.time)).toEqual(["23:30"]);
  });
});

describe("buildWeek", () => {
  it("incluye un cumpleaños anual en su día", () => {
    // 2027-03-10 es miércoles: la semana va del lunes 8 al domingo 14.
    const week = buildWeek([birthday, weeklyMonday], TZ, "2027-03-10");
    expect(week.map((day) => day.date)).toEqual([
      "2027-03-08",
      "2027-03-09",
      "2027-03-10",
      "2027-03-11",
      "2027-03-12",
      "2027-03-13",
      "2027-03-14",
    ]);
    expect(week[2].items.map((item) => item.title)).toEqual([
      "Cumpleaños de Ana",
    ]);
    expect(week[0].items.map((item) => item.title)).toEqual([
      "Control de presión",
    ]);
  });

  it("muestra el cumpleaños también en el año siguiente", () => {
    const week = buildWeek([birthday], TZ, "2028-03-10");
    const day = week.find((entry) => entry.date === "2028-03-10");
    expect(day?.items).toHaveLength(1);
  });

  it("una fecha en domingo da la semana que termina ese domingo", () => {
    const week = buildWeek([], TZ, "2027-03-14");
    expect(week[0].date).toBe("2027-03-08");
    expect(week[6].date).toBe("2027-03-14");
  });
});
