import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Las pruebas corren con cwd = app/; la raíz del repo está un nivel arriba.
const root = path.resolve(process.cwd(), "..");
const dir = path.join(root, ".github/workflows");
const read = (name: string) => readFileSync(path.join(dir, name), "utf8");

describe("backup.yml", () => {
  const backup = read("backup.yml");

  it("corre cada día y también a mano", () => {
    expect(backup).toMatch(/schedule:\n\s+- cron: "30 6 \* \* \*"/);
    expect(backup).toContain("workflow_dispatch:");
  });

  it("vuelca esquema, datos y roles con la versión fija de supabase", () => {
    expect(backup).toContain(
      'supabase@2.122.1 db dump --db-url "$SUPABASE_DB_URL" -f schema.sql',
    );
    expect(backup).toContain("--data-only -f data.sql");
    expect(backup).toContain("--role-only -f roles.sql");
  });

  it("cifra con age antes de subir y borra lo que quedó sin cifrar", () => {
    const cifrar = backup.indexOf('age -r "$AGE_PUBLIC_KEY"');
    const borrar = backup.indexOf(
      "rm -f schema.sql data.sql roles.sql respaldo.tgz",
    );
    const subir = backup.indexOf("actions/upload-artifact@");
    expect(cifrar).toBeGreaterThan(0);
    expect(borrar).toBeGreaterThan(cifrar);
    expect(subir).toBeGreaterThan(borrar);
  });

  it("sube solo el .age, con retención de 7 días", () => {
    const subida = backup.slice(backup.indexOf("actions/upload-artifact@"));
    expect(subida).toContain("path: backup-*.tgz.age");
    expect(subida).toContain("retention-days: 7");
    expect(subida).not.toMatch(/\.sql|\.tgz(?!\.age)/);
  });

  it("falla con un mensaje claro si falta un secreto y no imprime la base", () => {
    expect(backup).toContain('if [ -z "$SUPABASE_DB_URL" ]');
    expect(backup).toContain('if [ -z "$AGE_PUBLIC_KEY" ]');
    expect(backup).toContain("::error::Falta el secreto SUPABASE_DB_URL");
    expect(backup).toContain("::error::Falta el secreto AGE_PUBLIC_KEY");
    expect(backup).toContain("set +x");
    expect(backup).not.toMatch(
      /echo[^\n]*\$\{?(SUPABASE_DB_URL|AGE_PUBLIC_KEY)/,
    );
  });
});

describe("keepalive.yml", () => {
  const keepalive = read("keepalive.yml");

  it("pide cada día la ruta de salud de producción", () => {
    expect(keepalive).toMatch(/schedule:\n\s+- cron: "0 12 \* \* \*"/);
    expect(keepalive).toContain("curl -fsS");
    expect(keepalive).toContain("https://app.solecuida.com/api/health");
  });
});

describe("codeql.yml y zap.yml", () => {
  it("CodeQL analiza javascript-typescript solo en repos públicos", () => {
    const codeql = read("codeql.yml");
    expect(codeql).toContain("languages: javascript-typescript");
    expect(codeql).toContain("if: github.event.repository.private == false");
    // security-events: write solo en el job, no en el nivel superior.
    expect(codeql).toMatch(/^permissions:\n {2}contents: read$/m);
    expect(codeql.match(/security-events: write/g)).toHaveLength(1);
  });

  it("ZAP baseline se lanza a mano contra la app de producción", () => {
    const zap = read("zap.yml");
    expect(zap).toContain("workflow_dispatch:");
    expect(zap).toContain("default: https://app.solecuida.com");
    expect(zap).toContain("zaproxy/action-baseline@");
    expect(zap).toMatch(/target: \$\{\{ inputs\.target \}\}/);
  });
});

describe("todos los flujos", () => {
  const archivos = readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));

  it("hay flujos que revisar", () => {
    expect(archivos.length).toBeGreaterThanOrEqual(5);
  });

  it.each(archivos)(
    "%s: permisos, tiempo límite y acciones fijadas",
    (archivo) => {
      const texto = read(archivo);
      expect(texto).toMatch(/^permissions:/m);
      expect(texto).toContain("timeout-minutes:");
      for (const [, accion] of texto.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)) {
        expect(accion, accion).toMatch(/@(v\d+(\.\d+){0,2}|[0-9a-f]{40})$/);
      }
    },
  );

  it.each(archivos)("%s: los secretos solo van como referencias", (archivo) => {
    const texto = read(archivo);
    // Cualquier valor asignado a un nombre de secreto debe ser ${{ secrets.X }}.
    for (const [, valor] of texto.matchAll(
      /^\s*[A-Z][A-Z0-9_]*(?:KEY|TOKEN|URL|LICENSE|SECRET|PASSWORD):\s*(.+)$/gm,
    )) {
      expect(valor, valor).toMatch(/^\$\{\{ secrets\.[A-Z0-9_]+ \}\}$/);
    }
    expect(texto).not.toMatch(/age1[a-z0-9]{50,}/);
    expect(texto).not.toMatch(/postgres(ql)?:\/\//);
  });
});
