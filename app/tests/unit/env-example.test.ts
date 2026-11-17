import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Las pruebas corren con cwd = app/; los documentos viven en la raíz del repo.
const appDir = process.cwd();
const root = path.resolve(appDir, "..");

// Las pone la plataforma o el framework; nadie las configura.
const PLATFORM_VARS = new Set(["NODE_ENV", "CI", "NEXT_RUNTIME"]);

const SCANNED = [
  "src",
  "scripts",
  "next.config.ts",
  "vitest.config.ts",
  "playwright.config.ts",
];

function listFiles(target: string): string[] {
  const full = path.join(appDir, target);
  let isFile: boolean;
  try {
    isFile = statSync(full).isFile();
  } catch {
    return [];
  }
  if (isFile) {
    return [full];
  }
  return readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return listFiles(path.join(target, entry.name));
    }
    return /\.(ts|tsx|mts|mjs|js)$/.test(entry.name)
      ? [path.join(full, entry.name)]
      : [];
  });
}

/** Nombres de variables leídos con literales en el código fuente. */
function variablesRead(): Map<string, string> {
  const found = new Map<string, string>();
  const patterns = [
    /process\.env\.([A-Z][A-Z0-9_]*)/g,
    /process\.env\[\s*["']([A-Z][A-Z0-9_]*)["']\s*\]/g,
    /\b(?:requireEnv|readEnv)\(\s*["']([A-Z][A-Z0-9_]*)["']/g,
  ];
  for (const file of SCANNED.flatMap(listFiles)) {
    const text = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        const name = match[1];
        if (name && !found.has(name)) {
          found.set(name, path.relative(appDir, file));
        }
      }
    }
  }
  return found;
}

function exampleText(): string {
  return readFileSync(path.join(appDir, ".env.example"), "utf8");
}

function parseExample(): Map<string, string> {
  const values = new Map<string, string>();
  for (const line of exampleText().split(/\r?\n/)) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (match?.[1] !== undefined && match[2] !== undefined) {
      values.set(match[1], match[2]);
    }
  }
  return values;
}

describe(".env.example", () => {
  it("el escaneo encuentra variables (la prueba no está ciega)", () => {
    const read = variablesRead();
    expect(read.has("SUPABASE_URL")).toBe(true);
    expect(read.has("CRON_SECRET")).toBe(true);
  });

  it("tiene como clave cada variable que lee el código, salvo las de la plataforma", () => {
    const example = parseExample();
    const missing = [...variablesRead()]
      .filter(([name]) => !PLATFORM_VARS.has(name) && !example.has(name))
      .map(([name, file]) => `${name} (${file})`);
    expect(missing).toEqual([]);
  });

  it("incluye las claves de cifrado, que se leen por nombre dinámico", () => {
    const example = parseExample();
    expect(example.has("FIELD_ENCRYPTION_KEY")).toBe(true);
    expect(example.has("FIELD_ENCRYPTION_KEY_PREVIOUS")).toBe(true);
  });

  it("deja cada valor vacío o local, nunca un valor real", () => {
    const offenders = [...parseExample()]
      .filter(
        ([, value]) =>
          value !== "" &&
          !value.startsWith("http://localhost") &&
          !value.startsWith("mailto:"),
      )
      .map(([name]) => name);
    expect(offenders).toEqual([]);
  });

  it("no repite ninguna clave", () => {
    const names = [...exampleText().matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(
      (match) => match[1],
    );
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("docs/lanzamiento.md", () => {
  const doc = readFileSync(path.join(root, "docs/lanzamiento.md"), "utf8");

  it("tiene los encabezados de la lista de lanzamiento", () => {
    const lines = doc.split(/\r?\n/);
    for (const heading of [
      "## Cuentas y dominios",
      "## Variables en Vercel",
      "## Supabase de producción",
      "## Correo",
      "## Antes de abrir al público",
    ]) {
      expect(lines).toContain(heading);
    }
  });

  it("nombra cada variable de .env.example", () => {
    const missing = [...parseExample().keys()].filter(
      (name) => !doc.includes(name),
    );
    expect(missing).toEqual([]);
  });

  it("usa casillas y deja todas sin marcar", () => {
    expect(doc).toMatch(/^- \[ \] /m);
    expect(doc).not.toMatch(/\[\s*[xX]\s*\]/);
  });

  it("nombra los secretos de GitHub Actions", () => {
    for (const name of [
      "GITLEAKS_LICENSE",
      "SUPABASE_DB_URL",
      "AGE_PUBLIC_KEY",
    ]) {
      expect(doc).toContain(name);
    }
  });
});
