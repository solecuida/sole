import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Las pruebas corren con cwd = app/; la raíz del repo está un nivel arriba.
const root = path.resolve(process.cwd(), "..");
const read = (relative: string) =>
  readFileSync(path.join(root, relative), "utf8");

describe("CI", () => {
  const ci = read(".github/workflows/ci.yml");

  it("tiene los jobs quality, e2e, gitleaks, audit y semgrep", () => {
    for (const job of ["quality", "e2e", "gitleaks", "audit", "semgrep"]) {
      expect(ci).toMatch(new RegExp(`^ {2}${job}:$`, "m"));
    }
  });

  it("corre con permisos mínimos y escanea todo el historial", () => {
    expect(ci).toMatch(/^permissions:\n {2}contents: read$/m);
    expect(ci).toContain("fetch-depth: 0");
    expect(ci).toContain("gitleaks/gitleaks-action@");
    expect(ci).toContain("GITLEAKS_CONFIG: .gitleaks.toml");
  });

  it("instala con lockfile congelado y corre las compuertas del plano", () => {
    for (const command of [
      "pnpm -C app install --frozen-lockfile",
      "pnpm -C app exec biome ci .",
      "pnpm -C app typecheck",
      "pnpm -C app db:test",
      "pnpm -C app test",
      "pnpm -C app test:e2e",
      "pnpm -C app audit --prod --audit-level high",
    ]) {
      expect(ci).toContain(command);
    }
  });
});

describe("Dependabot", () => {
  const dependabot = read(".github/dependabot.yml");

  it("vigila npm en /app y las acciones de GitHub", () => {
    expect(dependabot).toMatch(/package-ecosystem: npm\n\s+directory: \/app\n/);
    expect(dependabot).toContain("package-ecosystem: github-actions");
  });
});

describe("escaneo de secretos", () => {
  it(".gitleaks.toml extiende las reglas por defecto", () => {
    const config = read(".gitleaks.toml");
    expect(config).toMatch(/\[extend\]\s+useDefault = true/);
    expect(config).toContain("blueprints/");
  });

  it("el hook pre-commit usa gitleaks si existe y avisa si no", () => {
    const hook = read(".githooks/pre-commit");
    expect(hook).toContain("command -v gitleaks");
    expect(hook).toContain("gitleaks git --pre-commit --staged --redact");
    expect(hook).toContain(
      "gitleaks no está instalado: el escaneo corre en CI",
    );
    expect(hook.trimEnd().endsWith("exit 0")).toBe(true);
  });
});

describe(".gitignore", () => {
  it("la raíz ignora .env.* y después exceptúa .env.example", () => {
    const lines = read(".gitignore").split(/\r?\n/);
    const ignore = lines.indexOf(".env.*");
    const exception = lines.indexOf("!.env.example");
    expect(ignore).toBeGreaterThanOrEqual(0);
    expect(exception).toBeGreaterThan(ignore);
  });

  it("app/.gitignore exceptúa .env.example", () => {
    const lines = read("app/.gitignore").split(/\r?\n/);
    expect(lines).toContain("!.env.example");
  });
});
