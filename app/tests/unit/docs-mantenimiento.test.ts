import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Las pruebas corren con cwd = app/; los documentos viven en la raíz del repo.
const root = path.resolve(process.cwd(), "..");
const doc = readFileSync(path.join(root, "docs/mantenimiento.md"), "utf8");
const packageJson = JSON.parse(
  readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
) as { scripts: Record<string, string> };

/** Contenido de una sección `## Título`, hasta el siguiente `## `. */
function section(title: string): string {
  const lines = doc.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `## ${title}`);
  if (start === -1) {
    return "";
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

describe("docs/mantenimiento.md", () => {
  it("tiene los encabezados del manual", () => {
    for (const heading of [
      "Desplegar",
      "Respaldar y restaurar",
      "Simulacro de restauración",
      "Rotar claves",
      "Revisar errores",
      "Agregar una organización",
      "Dar acceso de admin",
      "Secretos en Vault",
      "Si Supabase pausa el proyecto",
    ]) {
      expect(doc, heading).toMatch(new RegExp(`^## ${heading}$`, "m"));
      expect(section(heading).trim().length, heading).toBeGreaterThan(50);
    }
  });

  it("cada script de pnpm que cita existe en package.json", () => {
    const cited = [...doc.matchAll(/pnpm -C app ([a-z][\w:-]*)/g)].map(
      (match) => match[1] as string,
    );
    expect(cited.length).toBeGreaterThan(0);
    // `exec` es un subcomando de pnpm, no un script.
    for (const name of cited.filter((item) => item !== "exec")) {
      expect(packageJson.scripts, name).toHaveProperty(name);
    }
  });

  it("el simulacro cita el descifrado, el reinicio local y los tres archivos", () => {
    const text = section("Simulacro de restauración");
    expect(text).toContain("age -d -i clave.txt");
    expect(text).toContain("pnpm -C app db:reset");
    for (const file of ["roles.sql", "schema.sql", "data.sql"]) {
      expect(text, file).toContain(file);
    }
  });

  it("rotar claves cita el script con simulacro y las claves a cambiar", () => {
    const text = section("Rotar claves");
    expect(text).toContain(
      "pnpm -C app exec tsx scripts/rotate-field-key.ts --dry-run",
    );
    for (const name of [
      "FIELD_ENCRYPTION_KEY_PREVIOUS",
      "CRON_SECRET",
      "VAPID",
      "Resend",
    ]) {
      expect(text, name).toContain(name);
    }
  });

  it("el acceso de admin incluye el SQL por correo y por identificador", () => {
    const text = section("Dar acceso de admin");
    expect(text).toContain(
      "update public.profiles set is_admin = true where id = (select id from auth.users where email = 'TU-CORREO');",
    );
    expect(text).toContain(
      "update public.profiles set is_admin = true where id = '<uuid>';",
    );
  });

  it("el Vault crea app_base_url y cron_secret", () => {
    const text = section("Secretos en Vault");
    expect(text).toContain(
      "select vault.create_secret('https://app.solecuida.com', 'app_base_url');",
    );
    expect(text).toContain("'cron_secret'");
  });

  it("no escribe secretos y no usa «en memoria»", () => {
    expect(doc.toLowerCase()).not.toContain("en memoria");
    expect(doc).not.toMatch(/\beyJ[\w-]{20,}/);
    expect(doc).not.toMatch(/AGE-SECRET-KEY-/);
    expect(doc).not.toMatch(/\bsb_secret_/);
    expect(doc).not.toMatch(
      /postgres(ql)?:\/\/[^\s:]+:[^\s@]+@(?!127\.0\.0\.1)/,
    );
  });
});
