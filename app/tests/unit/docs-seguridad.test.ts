import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Las pruebas corren con cwd = app/; los documentos viven en la raíz del repo.
const root = path.resolve(process.cwd(), "..");
const read = (relative: string) =>
  readFileSync(path.join(root, relative), "utf8");

const SECURITY_DOCS = [
  "docs/seguridad/checklist-6.2.md",
  "docs/seguridad/asvs-checklist.md",
  "docs/seguridad/owasp-top10.md",
  "docs/seguridad/iso27001-anexo-a.md",
  "docs/seguridad/modelo-amenazas.md",
  "docs/seguridad/plan-incidentes.md",
  "docs/legal/registro-actividades.md",
  "docs/legal/eipd.md",
];

/** Celdas de una fila de tabla Markdown (los documentos no usan `|` dentro de una celda). */
function cells(row: string): string[] {
  return row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

/** Filas de datos (sin encabezado ni separador) que siguen a un encabezado exacto. */
function tableAfter(markdown: string, header: string): string[][] {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === header);
  if (start < 0) {
    return [];
  }
  const rows: string[][] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith("|")) {
      break;
    }
    if (/^\|[\s|:-]+\|$/.test(line)) {
      continue;
    }
    rows.push(cells(line));
  }
  return rows;
}

/** Rutas del repositorio entre comillas invertidas (no rutas de la web, como `/api/...`). */
function citedPaths(text: string): string[] {
  const tokens = [...text.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]);
  return tokens.filter(
    (token) =>
      /^(?:app|docs|web|blueprints|alianzas|\.github|\.githooks|\.claude)\/\S+$/.test(
        token,
      ) ||
      /^(?:\.gitignore|\.gitleaks\.toml|CLAUDE\.md|PENDIENTES\.md|DECISIONES\.md)$/.test(
        token,
      ),
  );
}

const pathExists = (relative: string) =>
  existsSync(path.join(root, relative.replace(/\/$/, "")));

/** Texto de una sección `## <prefijo>` hasta el siguiente `## `. */
function section(markdown: string, prefix: string): string {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`## ${prefix}`));
  if (start < 0) {
    return "";
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

describe("docs de seguridad y privacidad (E6-T5 y E6-T6)", () => {
  it("checklist-6.2: los 30 puntos una vez, con evidencia real o de lanzamiento", () => {
    const rows = tableAfter(
      read("docs/seguridad/checklist-6.2.md"),
      "| # | Requisito | Estado | Evidencia |",
    );
    const numbers = rows.map((row) => Number(row[0]));
    expect(numbers).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));

    for (const [number, , status, evidence] of rows) {
      expect(["Cumple", "Lista de lanzamiento"], `punto ${number}`).toContain(
        status,
      );
      expect(
        evidence.length,
        `punto ${number}: evidencia vacía`,
      ).toBeGreaterThan(0);
      const paths = citedPaths(evidence);
      for (const cited of paths) {
        expect(pathExists(cited), `punto ${number}: ${cited}`).toBe(true);
      }
      if (status === "Cumple") {
        expect(
          paths.length,
          `punto ${number}: Cumple sin ruta`,
        ).toBeGreaterThan(0);
      } else {
        expect(evidence, `punto ${number}`).toMatch(/Lista de lanzamiento:/);
      }
    }
  });

  it("asvs-checklist: cada estado es válido y cada Cumple trae una ruta que existe", () => {
    const text = read("docs/seguridad/asvs-checklist.md");
    const rows = tableAfter(
      text,
      "| Requisito ASVS 5.0 | Nivel | Estado | Evidencia |",
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const [requirement, , status, evidence] of rows) {
      expect(["Cumple", "No aplica", "Pendiente"], requirement).toContain(
        status,
      );
      expect(evidence.length, requirement).toBeGreaterThan(0);
      if (status === "Cumple") {
        const paths = citedPaths(evidence);
        expect(paths.length, requirement).toBeGreaterThan(0);
      }
    }
    for (const chapter of [
      "Autenticación",
      "Sesión",
      "Control de acceso",
      "Validación",
      "Criptografía almacenada",
      "Manejo de errores",
      "Protección de datos",
      "Configuración",
    ]) {
      expect(text, chapter).toContain(`${chapter}:`);
    }
  });

  it("owasp-top10: de A01 a A10, cada una con una ruta que existe", () => {
    const text = read("docs/seguridad/owasp-top10.md");
    expect(text).toContain("[VERIFICAR edición]");
    for (let n = 1; n <= 10; n++) {
      const id = `A${String(n).padStart(2, "0")}`;
      expect(text, id).toMatch(new RegExp(`^## ${id}\\b`, "m"));
      const paths = citedPaths(section(text, id));
      expect(paths.length, id).toBeGreaterThan(0);
      for (const cited of paths) {
        expect(pathExists(cited), `${id}: ${cited}`).toBe(true);
      }
    }
  });

  it("iso27001-anexo-a: encabezado esperado y al menos una fila", () => {
    const rows = tableAfter(
      read("docs/seguridad/iso27001-anexo-a.md"),
      "| Control | Aplica | Cómo se cumple | Evidencia |",
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.length, row[0]).toBe(4);
      expect(row[3].length, row[0]).toBeGreaterThan(0);
    }
  });

  it("modelo-amenazas: una fila por cada activo que pide E6-T6", () => {
    const rows = tableAfter(
      read("docs/seguridad/modelo-amenazas.md"),
      "| Activo | Amenaza | Categoría STRIDE | Control | Evidencia |",
    );
    const assets = rows.map((row) => row[0].toLowerCase());
    for (const asset of [
      "sesiones",
      "bitácora",
      "medicamentos",
      "enlace de la persona cuidada",
      "botón de emergencia",
      "cron",
      "panel de administración",
      "respaldos",
    ]) {
      expect(assets, asset).toContain(asset);
    }
    for (const row of rows) {
      expect(row.length, row[0]).toBe(5);
      expect(row[4].length, row[0]).toBeGreaterThan(0);
    }
  });

  it("plan-incidentes: las cinco fases y el responsable", () => {
    const text = read("docs/seguridad/plan-incidentes.md");
    for (const heading of [
      "## Detección",
      "## Contención",
      "## Notificación",
      "## Recuperación",
      "## Lecciones",
    ]) {
      expect(text, heading).toMatch(new RegExp(`^${heading}$`, "m"));
    }
    expect(text).toContain("hola@solecuida.com");
    expect(text).toContain("[VERIFICAR]");
  });

  it("registro-actividades: destinatarios y transferencia internacional", () => {
    const text = read("docs/legal/registro-actividades.md");
    for (const recipient of [
      "Supabase",
      "Vercel",
      "Sentry",
      "Resend",
      "Cloudflare",
    ]) {
      expect(text, recipient).toContain(recipient);
    }
    expect(text.toLowerCase()).toContain("transferencia internacional");
    expect(text).toContain("Zoho");
    expect(text).toContain("7 días");
    expect(text).toContain("12 meses");
  });

  it("eipd: encabezado de riesgos y al menos una fila", () => {
    const rows = tableAfter(
      read("docs/legal/eipd.md"),
      "| Riesgo | Probabilidad | Impacto | Medida |",
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.length, row[0]).toBe(4);
      expect(["Baja", "Media", "Alta"], row[0]).toContain(row[1]);
      expect(["Baja", "Media", "Alta"], row[0]).toContain(row[2]);
    }
  });

  it("todas las rutas citadas existen y los textos respetan las reglas del proyecto", () => {
    for (const doc of SECURITY_DOCS) {
      const text = read(doc);
      for (const cited of citedPaths(text)) {
        expect(pathExists(cited), `${doc}: ${cited}`).toBe(true);
      }
      expect(text.toLowerCase(), doc).not.toContain("en memoria");
      const emails = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? [];
      for (const email of emails) {
        expect(email, doc).toBe("hola@solecuida.com");
      }
    }
  });
});
