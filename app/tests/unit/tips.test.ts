import { describe, expect, it } from "vitest";
import { type Tip, tipOfDay } from "@/server/today/tips";

function tip(id: string, fields: Partial<Tip> = {}): Tip {
  return {
    id,
    kind: "consejo",
    text: `Consejo ${id}`,
    activityTitle: null,
    careTypes: [],
    ...fields,
  };
}

/** 30 fechas seguidas desde el 1 de noviembre de 2026. */
const DATES = Array.from({ length: 30 }, (_, i) =>
  new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10),
);

describe("tipOfDay", () => {
  const tips = [tip("a"), tip("b"), tip("c"), tip("d"), tip("e")];

  it("la misma fecha devuelve siempre el mismo consejo", () => {
    for (const date of DATES) {
      expect(tipOfDay(tips, date, "adulto_mayor")).toBe(
        tipOfDay(tips, date, "adulto_mayor"),
      );
    }
  });

  it("no depende del orden en que llegan los consejos", () => {
    const reversed = [...tips].reverse();
    for (const date of DATES) {
      expect(tipOfDay(reversed, date, "adulto_mayor")?.id).toBe(
        tipOfDay(tips, date, "adulto_mayor")?.id,
      );
    }
  });

  it("en 30 días seguidos muestra al menos 2 consejos distintos", () => {
    const two = [tip("a"), tip("b")];
    const seen = new Set(
      DATES.map((date) => tipOfDay(two, date, "adulto_mayor")?.id),
    );
    expect(seen.size).toBe(2);
    const many = new Set(
      DATES.map((date) => tipOfDay(tips, date, "adulto_mayor")?.id),
    );
    expect(many.size).toBeGreaterThanOrEqual(3);
  });

  it("solo elige entre los que aplican a ese tipo de cuidado o a todos", () => {
    const mixed = [
      tip("general"),
      tip("dialisis", { careTypes: ["dialisis"] }),
      tip("demencias", { careTypes: ["demencias"] }),
    ];
    const forDialysis = new Set(
      DATES.map((date) => tipOfDay(mixed, date, "dialisis")?.id),
    );
    expect([...forDialysis].sort()).toEqual(["dialisis", "general"]);
    const forOther = new Set(
      DATES.map((date) => tipOfDay(mixed, date, "adulto_mayor")?.id),
    );
    expect([...forOther]).toEqual(["general"]);
  });

  it("sin consejos que apliquen devuelve null", () => {
    expect(tipOfDay([], "2026-11-14", "adulto_mayor")).toBeNull();
    expect(
      tipOfDay(
        [tip("x", { careTypes: ["dialisis"] })],
        "2026-11-14",
        "adulto_mayor",
      ),
    ).toBeNull();
  });
});
