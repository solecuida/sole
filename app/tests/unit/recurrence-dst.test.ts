import { TZDate, tzOffset } from "@date-fns/tz";
import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import { expandRule, localDateOf } from "@/server/reminders/recurrence";
import type { ReminderRule } from "@/server/reminders/rule-schema";

// Cambio de hora: no se escribe ninguna fecha de cambio a mano. Se recorre 2027
// completo y se comprueba la propiedad, sea cual sea el día en que Chile cambie.

const TIMES = ["00:30", "08:00", "23:30"];
const MINUTE = 60_000;

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

for (const tz of [
  "America/Santiago",
  "America/Punta_Arenas",
  "Pacific/Easter",
]) {
  describe(`todo 2027 en ${tz}`, () => {
    const rule: ReminderRule = {
      freq: "daily",
      times: TIMES,
      startDate: "2026-12-01",
    };
    const instants = expandRule(
      rule,
      tz,
      new Date("2026-12-30T00:00:00Z"),
      new Date("2028-01-03T00:00:00Z"),
    ).filter((instant) => localDateOf(instant, tz).startsWith("2027-"));

    const byDay = new Map<string, Date[]>();
    for (const instant of instants) {
      const day = localDateOf(instant, tz);
      byDay.set(day, [...(byDay.get(day) ?? []), instant]);
    }

    it("hay exactamente un instante por hora y por día local", () => {
      expect(byDay.size).toBe(365);
      for (const [day, list] of byDay) {
        expect(list, day).toHaveLength(TIMES.length);
      }
      expect(instants).toHaveLength(365 * TIMES.length);
    });

    it("los instantes son estrictamente crecientes", () => {
      for (let i = 1; i < instants.length; i += 1) {
        expect(instants[i].getTime()).toBeGreaterThan(
          instants[i - 1].getTime(),
        );
      }
    });

    it("cada uno cae a su hora local, o hasta 60 minutos después solo el día del adelanto", () => {
      const shiftedDays = new Set<string>();
      for (const [day, list] of byDay) {
        list.forEach((instant, index) => {
          const shown = minutesOf(format(new TZDate(instant, tz), "HH:mm"));
          const delay = shown - minutesOf(TIMES[index]);
          expect(delay, `${day} ${TIMES[index]}`).toBeGreaterThanOrEqual(0);
          expect(delay, `${day} ${TIMES[index]}`).toBeLessThanOrEqual(60);
          if (delay > 0) {
            shiftedDays.add(day);
          }
        });
      }
      // Como mucho un día corrido, y ese día el reloj efectivamente se adelantó.
      expect(shiftedDays.size).toBeLessThanOrEqual(1);
      for (const day of shiftedDays) {
        const list = byDay.get(day) ?? [];
        const first = list[0];
        const before = tzOffset(tz, new Date(first.getTime() - 120 * MINUTE));
        const after = tzOffset(tz, first);
        expect(after, day).toBeGreaterThan(before);
      }
    });

    it("la zona realmente cambia de hora en 2027 (la prueba no pasa en vacío)", () => {
      const offsets = new Set(instants.map((instant) => tzOffset(tz, instant)));
      // Punta Arenas no cambia de hora; Santiago e Isla de Pascua sí.
      expect(offsets.size).toBe(tz === "America/Punta_Arenas" ? 1 : 2);
    });

    it("el día del atraso, la hora repetida usa la primera vez que ocurre", () => {
      for (const [day, list] of byDay) {
        const last = list[TIMES.length - 1];
        const offsetAtLast = tzOffset(tz, last);
        const offsetAnHourLater = tzOffset(
          tz,
          new Date(last.getTime() + 60 * MINUTE),
        );
        if (offsetAnHourLater < offsetAtLast) {
          // La misma hora local vuelve a ocurrir una hora después: se eligió la primera.
          const repeated = new Date(last.getTime() + 60 * MINUTE);
          expect(format(new TZDate(repeated, tz), "HH:mm"), day).toBe("23:30");
          expect(format(new TZDate(last, tz), "HH:mm"), day).toBe("23:30");
        }
      }
    });
  });
}
