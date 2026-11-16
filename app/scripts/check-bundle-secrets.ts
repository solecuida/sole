import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadLocalEnv } from "./lib/load-env";

// Busca los secretos del servidor dentro de lo que se manda al navegador
// (.next/static). Corre después de `pnpm -C app build`. Imprime el archivo,
// nunca el valor. Sale con 0 si no hay nada; con 1 si encuentra algo.

loadLocalEnv();

const SECRETS = [
  "SUPABASE_SECRET_KEY",
  "FIELD_ENCRYPTION_KEY",
  "CRON_SECRET",
  "VAPID_PRIVATE_KEY",
  "IP_HASH_SECRET",
] as const;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function main(): number {
  const root = join(".next", "static");
  let files: string[];
  try {
    files = walk(root);
  } catch {
    console.error(`No existe ${root}: corre \`pnpm -C app build\` primero.`);
    return 2;
  }

  const values = SECRETS.map((name) => ({
    name,
    value: process.env[name] ?? "",
  })).filter((entry) => entry.value.length > 0);
  if (values.length === 0) {
    console.error(
      "No hay ningún secreto cargado: corre `pnpm -C app env:local`.",
    );
    return 2;
  }

  let leaks = 0;
  for (const file of files) {
    const content = readFileSync(file);
    for (const { name, value } of values) {
      if (content.includes(value)) {
        console.error(`FILTRADO: ${name} aparece en ${file}`);
        leaks += 1;
      }
    }
  }

  if (leaks > 0) {
    return 1;
  }
  console.log(
    `Sin secretos en ${root}: ${files.length} archivos, ${values.length} valores revisados.`,
  );
  return 0;
}

process.exit(main());
