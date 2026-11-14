import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Las pruebas corren con cwd = app/; el diseño funcional vive en la raíz del repo.
const designDir = path.resolve(process.cwd(), "..", "docs", "diseno");
const read = (file: string) => readFileSync(path.join(designDir, file), "utf8");

/** Qué funcionalidades (F) debe describir cada archivo. */
const REQUIRED: Record<string, string[]> = {
  "nucleo.md": ["F1", "F2", "F3", "F4"],
  "registro-y-cuidado.md": ["F5", "F6", "F8", "F9"],
  "informes-y-escucha.md": ["F7", "F10", "F11", "F14"],
  "familiares.md": ["F16"],
};

const SUBSECTIONS = [
  "### Flujo",
  "### Datos",
  "### Permisos",
  "### Criterios de aceptación",
];

/** Texto de la sección `## F<n> ·` hasta el siguiente `## ` (o el final). */
function featureSection(markdown: string, feature: string): string | null {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`## ${feature} ·`));
  if (start < 0) {
    return null;
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

describe("diseño funcional por F", () => {
  for (const [file, features] of Object.entries(REQUIRED)) {
    for (const feature of features) {
      it(`${file} describe ${feature} con sus cuatro subsecciones`, () => {
        const section = featureSection(read(file), feature);
        expect(section, `falta "## ${feature} ·" en ${file}`).not.toBeNull();
        const lines = (section ?? "").split("\n");
        for (const heading of SUBSECTIONS) {
          expect(lines, `${feature}: falta "${heading}"`).toContain(heading);
        }
      });
    }
  }
});

describe("familiares.md (F16)", () => {
  const doc = read("familiares.md");

  it("tiene Notificaciones y Modelo de datos", () => {
    const lines = doc.split(/\r?\n/);
    expect(lines).toContain("### Notificaciones");
    expect(lines).toContain("### Modelo de datos");
  });

  it("nombra las piezas del modelo que la soportan", () => {
    for (const word of ["accept_invitation", "claim_task", "notify_kinds"]) {
      expect(doc).toContain(word);
    }
  });
});

describe("palabras que no van en el diseño", () => {
  it("ningún archivo usa vocabulario clínico ni «en memoria»", () => {
    const files = readdirSync(designDir).filter((file) => file.endsWith(".md"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = read(file).toLowerCase();
      for (const word of ["diagnóstico", "dosis", "en memoria"]) {
        expect(text, `${file} contiene "${word}"`).not.toContain(word);
      }
    }
  });
});
