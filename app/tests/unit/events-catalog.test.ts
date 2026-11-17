import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { EVENT_CATALOG, isEventName } from "@/server/events/catalog";

const doc = readFileSync(
  path.resolve(process.cwd(), "..", "docs", "eventos.md"),
  "utf8",
);

interface DocRow {
  when: string;
  props: string[];
  hypotheses: string[];
  technical: boolean;
}

/** Filas de la tabla "Eventos" de docs/eventos.md, por nombre de evento. */
function docRows(): Map<string, DocRow> {
  const lines = doc.split(/\r?\n/);
  const header = lines.indexOf(
    "| Evento | Cuándo se dispara | Propiedades | Hipótesis | Técnico |",
  );
  expect(header).toBeGreaterThanOrEqual(0);
  const rows = new Map<string, DocRow>();
  for (const line of lines.slice(header + 2)) {
    if (!line.startsWith("|")) {
      break;
    }
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    const name = cells[0].replaceAll("`", "");
    rows.set(name, {
      when: cells[1],
      props:
        cells[2] === "ninguna"
          ? []
          : cells[2].split(",").map((prop) => prop.trim().replaceAll("`", "")),
      hypotheses: cells[3].split(",").map((item) => item.trim()),
      technical: cells[4] === "sí",
    });
  }
  return rows;
}

function propKeys(schema: z.ZodType): string[] {
  expect(schema).toBeInstanceOf(z.ZodObject);
  return Object.keys((schema as z.ZodObject).shape);
}

describe("catálogo ↔ docs/eventos.md", () => {
  const rows = docRows();
  const names = Object.keys(EVENT_CATALOG);

  it("tienen exactamente los mismos eventos", () => {
    expect([...rows.keys()].sort()).toEqual([...names].sort());
  });

  for (const [name, definition] of Object.entries(EVENT_CATALOG)) {
    it(`${name}: misma descripción, propiedades, hipótesis y marca de técnico`, () => {
      const row = rows.get(name);
      expect(row).toBeDefined();
      expect(row?.when).toBe(definition.when);
      expect(row?.props.sort()).toEqual(propKeys(definition.props).sort());
      expect(row?.hypotheses).toEqual([...definition.hypotheses]);
      expect(row?.technical).toBe(definition.technical);
    });
  }

  it("cada evento alimenta al menos una hipótesis entre H1 y H6", () => {
    for (const [name, definition] of Object.entries(EVENT_CATALOG)) {
      expect(definition.hypotheses.length, name).toBeGreaterThan(0);
      for (const hypothesis of definition.hypotheses) {
        expect(hypothesis, name).toMatch(/^H[1-6]$/);
      }
    }
  });

  it("los nombres cumplen el formato area.accion que exige la base", () => {
    for (const name of names) {
      expect(name).toMatch(/^[a-z]+(_[a-z]+)*\.[a-z]+(_[a-z]+)*$/);
      expect(isEventName(name)).toBe(true);
    }
    expect(isEventName("no.existe")).toBe(false);
    expect(isEventName("toString")).toBe(false);
  });
});

describe("las propiedades nunca aceptan texto libre", () => {
  it("rechaza una clave no declarada", () => {
    const result = EVENT_CATALOG["app.opened"].props.safeParse({
      screen: "hoy",
      nota: "texto libre",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un texto fuera de su lista cerrada", () => {
    expect(
      EVENT_CATALOG["app.opened"].props.safeParse({ screen: "mi mamá Rosa" })
        .success,
    ).toBe(false);
    expect(
      EVENT_CATALOG["fake_door.interest"].props.safeParse({
        door: "plan_familiar",
        choice: "9990",
      }).success,
    ).toBe(false);
  });

  it("rechaza números que no son enteros de 0 o más", () => {
    const schema = EVENT_CATALOG["flow.completed"].props;
    expect(schema.safeParse({ flow: "journal", duration_ms: -1 }).success).toBe(
      false,
    );
    expect(
      schema.safeParse({ flow: "journal", duration_ms: 1.5 }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ flow: "journal", duration_ms: 8200 }).success,
    ).toBe(true);
  });

  it("ningún esquema declara un texto abierto", () => {
    for (const [name, definition] of Object.entries(EVENT_CATALOG)) {
      const shape = (definition.props as z.ZodObject).shape;
      for (const [key, field] of Object.entries(shape)) {
        expect(field, `${name}.${key}`).not.toBeInstanceOf(z.ZodString);
      }
    }
  });

  it("los eventos sin propiedades rechazan cualquier clave", () => {
    const schema = EVENT_CATALOG["selfcare.checked_in"].props;
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ score: 2 }).success).toBe(false);
  });
});
