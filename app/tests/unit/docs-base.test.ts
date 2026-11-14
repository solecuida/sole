import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Las pruebas corren con cwd = app/; los documentos viven en la raíz del repo.
const root = path.resolve(process.cwd(), "..");
const read = (relative: string) =>
  readFileSync(path.join(root, relative), "utf8");

/** Filas de datos (sin encabezado ni separador) de las tablas de un documento. */
function tableRows(markdown: string): string[] {
  return markdown
    .split(/\r?\n/)
    .filter((line) => line.startsWith("|"))
    .filter((line) => !/^\|[\s|:-]+\|$/.test(line));
}

describe("DECISIONES.md", () => {
  const doc = read("DECISIONES.md");
  const header = "| Decisión | Alternativa descartada | Por qué | Fecha |";

  it("tiene la tabla de decisiones con al menos una fila", () => {
    expect(doc).toContain(header);
    const rows = tableRows(doc).filter((line) => line !== header);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row, row).toMatch(/\| \d{4}-\d{2}-\d{2} \|$/);
    }
  });
});

describe("PENDIENTES.md", () => {
  const doc = read("PENDIENTES.md");

  it("tiene título, estado y las tres prioridades", () => {
    expect(doc).toMatch(/^# Pendientes$/m);
    expect(doc).toMatch(/^Estado:/m);
    for (const heading of [
      "## Prioridad alta",
      "## Prioridad media",
      "## Prioridad baja",
    ]) {
      expect(doc).toMatch(new RegExp(`^${heading}$`, "m"));
    }
  });

  it("deja F16 y F17 para la fase 8", () => {
    const low = doc.slice(doc.indexOf("## Prioridad baja"));
    expect(low).toContain("F16");
    expect(low).toContain("F17");
    expect(low).toContain("se construyen en la fase 8 si sobra tiempo");
  });
});

describe("docs/limites.md", () => {
  const rows = tableRows(read("docs/limites.md"));

  for (const service of [
    "Supabase",
    "Vercel",
    "Resend",
    "Sentry",
    "Cloudflare Turnstile",
    "GitHub Actions",
  ]) {
    it(`tiene una fila para ${service} con fuente o [VERIFICAR]`, () => {
      const matching = rows.filter((row) => row.startsWith(`| ${service} |`));
      expect(matching).toHaveLength(1);
      expect(matching[0]).toMatch(/\[VERIFICAR\]|https:\/\//);
    });
  }
});

describe("docs/licencias.md", () => {
  const rows = tableRows(read("docs/licencias.md"));

  it("registra Atkinson Hyperlegible con su licencia", () => {
    const row = rows.find((line) => line.includes("Atkinson Hyperlegible"));
    expect(row).toBeDefined();
    expect(row).toContain("SIL Open Font License 1.1");
  });

  it("registra las librerías que nombra el plano", () => {
    for (const [resource, license] of [
      ["lucide-react", "ISC"],
      ["Next.js", "MIT"],
      ["Supabase JS", "MIT"],
      ["Recharts", "MIT"],
      ["Serwist", "MIT"],
      ["web-push", "MPL-2.0"],
    ]) {
      const row = rows.find((line) => line.includes(resource));
      expect(row, resource).toBeDefined();
      expect(row, resource).toContain(`| ${license} |`);
    }
  });
});

describe("contexto humano", () => {
  it('ningún documento base usa "en memoria"', () => {
    for (const file of [
      "DECISIONES.md",
      "PENDIENTES.md",
      "docs/limites.md",
      "docs/licencias.md",
    ]) {
      expect(read(file).toLowerCase(), file).not.toContain("en memoria");
    }
  });
});
