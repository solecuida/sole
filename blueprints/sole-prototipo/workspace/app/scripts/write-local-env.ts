import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import webpush from "web-push";

// Uso (desde app/): pnpm env:local
//   = supabase status -o json | tsx scripts/write-local-env.ts
// Escribe .env.local (next dev/start) y .env.test.local (Vitest/Playwright) con los
// valores del Supabase local. Conserva los secretos generados si el archivo ya existe,
// para que los datos cifrados en local sigan legibles.

type Status = Record<string, string | undefined>;

function readStdin(): string {
  return readFileSync(0, "utf8");
}

function parseExisting(file: string): Map<string, string> {
  const values = new Map<string, string>();
  if (!existsSync(file)) {
    return values;
  }
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (match?.[1] && match[2] !== undefined && match[2] !== "") {
      values.set(match[1], match[2]);
    }
  }
  return values;
}

function pick(status: Status, names: string[]): string {
  for (const name of names) {
    const value = status[name];
    if (value) {
      return value;
    }
  }
  throw new Error(`supabase status no entregó ninguna de: ${names.join(", ")}`);
}

function main(): void {
  const raw = readStdin();
  const start = raw.indexOf("{");
  if (start === -1) {
    throw new Error("No llegó JSON por stdin. ¿Está corriendo `pnpm db:start`?");
  }
  const status = JSON.parse(raw.slice(start)) as Status;
  const previous = parseExisting(".env.local");
  const vapid = webpush.generateVAPIDKeys();

  const keep = (name: string, fresh: () => string): string =>
    previous.get(name) ?? fresh();

  const values: Array<[string, string]> = [
    ["APP_URL", "http://localhost:3000"],
    ["SUPABASE_URL", pick(status, ["API_URL"])],
    ["SUPABASE_PUBLISHABLE_KEY", pick(status, ["PUBLISHABLE_KEY", "ANON_KEY"])],
    ["SUPABASE_SECRET_KEY", pick(status, ["SECRET_KEY", "SERVICE_ROLE_KEY"])],
    [
      "FIELD_ENCRYPTION_KEY",
      keep("FIELD_ENCRYPTION_KEY", () => `1:${randomBytes(32).toString("base64")}`),
    ],
    ["CRON_SECRET", keep("CRON_SECRET", () => randomBytes(32).toString("hex"))],
    ["IP_HASH_SECRET", keep("IP_HASH_SECRET", () => randomBytes(32).toString("hex"))],
    [
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
      keep("NEXT_PUBLIC_VAPID_PUBLIC_KEY", () => vapid.publicKey),
    ],
    ["VAPID_PRIVATE_KEY", keep("VAPID_PRIVATE_KEY", () => vapid.privateKey)],
    ["VAPID_SUBJECT", "mailto:hola@solecuida.com"],
    ["WEB_ALLOWED_ORIGINS", "http://localhost:5500"],
  ];

  const render = (appUrl: string): string =>
    `${values
      .map(([key, value]) => `${key}=${key === "APP_URL" ? appUrl : value}`)
      .join("\n")}\n`;
  // next dev usa :3000; las pruebas e2e levantan el build en :3100.
  writeFileSync(".env.local", render("http://localhost:3000"));
  writeFileSync(".env.test.local", render("http://localhost:3100"));
  process.stdout.write("Listo: .env.local y .env.test.local\n");
}

main();
