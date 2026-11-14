import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Las pruebas corren con cwd = app/; el diseño funcional vive en la raíz del repo.
const designDir = path.resolve(process.cwd(), "..", "docs", "diseno");
const read = (file: string) => readFileSync(path.join(designDir, file), "utf8");
const linesOf = (text: string) => text.split(/\r?\n/);
const designFiles = () =>
  readdirSync(designDir).filter((file) => file.endsWith(".md"));

/** Qué funcionalidades (F) debe describir cada archivo. */
const REQUIRED: Record<string, string[]> = {
  "nucleo.md": ["F1", "F2", "F3", "F4"],
  "registro-y-cuidado.md": ["F5", "F6", "F8", "F9"],
  "informes-y-escucha.md": ["F7", "F10", "F11", "F14"],
  "familiares.md": ["F16"],
  "persona-cuidada.md": ["F12"],
  "cuenta.md": ["F13"],
  "admin-y-organizaciones.md": ["F15", "F17"],
};

const SUBSECTIONS = [
  "### Flujo",
  "### Datos",
  "### Permisos",
  "### Criterios de aceptación",
];

/** Líneas de la sección `## F<n> ·` hasta el siguiente `## ` (o el final). */
function featureSection(markdown: string, feature: string): string[] | null {
  const lines = linesOf(markdown);
  const start = lines.findIndex((line) => line.startsWith(`## ${feature} ·`));
  if (start < 0) {
    return null;
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return end < 0 ? rest : rest.slice(0, end);
}

describe("diseño funcional por F", () => {
  for (const [file, features] of Object.entries(REQUIRED)) {
    for (const feature of features) {
      it(`${file} describe ${feature} con sus cuatro subsecciones`, () => {
        const section = featureSection(read(file), feature);
        expect(section, `falta "## ${feature} ·" en ${file}`).not.toBeNull();
        for (const heading of SUBSECTIONS) {
          expect(section, `${feature}: falta "${heading}"`).toContain(heading);
        }
      });
    }
  }
});

describe("cobertura de F1 a F17", () => {
  it("cada F aparece exactamente una vez en docs/diseno", () => {
    const allLines = designFiles().flatMap((file) => linesOf(read(file)));
    for (let n = 1; n <= 17; n += 1) {
      const count = allLines.filter((line) =>
        line.startsWith(`## F${n} ·`),
      ).length;
      expect(count, `F${n}`).toBe(1);
    }
  });

  it("REQUIRED cubre las 17 funcionalidades", () => {
    const listed = Object.values(REQUIRED).flat().sort();
    const expected = Array.from({ length: 17 }, (_, i) => `F${i + 1}`).sort();
    expect(listed).toEqual(expected);
  });
});

describe("familiares.md (F16)", () => {
  const doc = read("familiares.md");

  it("tiene Notificaciones y Modelo de datos", () => {
    const lines = linesOf(doc);
    expect(lines).toContain("### Notificaciones");
    expect(lines).toContain("### Modelo de datos");
  });

  it("nombra las piezas del modelo que la soportan", () => {
    for (const word of ["accept_invitation", "claim_task", "notify_kinds"]) {
      expect(doc).toContain(word);
    }
  });
});

describe("persona-cuidada.md (F12)", () => {
  const doc = read("persona-cuidada.md");

  it("lleva la advertencia de emergencia y el marcador de verificación", () => {
    expect(doc).toContain(
      "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue.",
    );
    expect(doc).toContain("[VERIFICAR");
  });
});

describe("transversal.md", () => {
  const lines = linesOf(read("transversal.md"));

  it("tiene las cuatro secciones y ninguna F", () => {
    for (const heading of [
      "## Sin conexión",
      "## Rendimiento",
      "## Textos",
      "## Investigación",
    ]) {
      expect(lines).toContain(heading);
    }
    expect(lines.some((line) => /^## F[0-9]+ ·/.test(line))).toBe(false);
  });
});

describe("palabras que no van en el diseño", () => {
  it("ningún archivo usa vocabulario clínico ni «en memoria»", () => {
    const files = designFiles();
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = read(file).toLowerCase();
      for (const word of ["diagnóstico", "dosis", "en memoria"]) {
        expect(text, `${file} contiene "${word}"`).not.toContain(word);
      }
    }
  });
});
