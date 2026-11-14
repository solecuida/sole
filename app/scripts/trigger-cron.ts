import { loadLocalEnv } from "./lib/load-env";

// Dispara a mano un trabajo programado. En local reemplaza a pg_cron:
//   pnpm -C app cron:dispatch   (avisos; con `pnpm -C app dev` corriendo)
//   pnpm -C app cron:daily      (borrados e inactividad)
// Sale con 0 solo si la app respondió 200.

loadLocalEnv();

const JOBS = ["dispatch", "daily"] as const;

async function main(): Promise<number> {
  const job = process.argv[2];
  if (!JOBS.includes(job as (typeof JOBS)[number])) {
    console.error(`Uso: tsx scripts/trigger-cron.ts ${JOBS.join("|")}`);
    return 2;
  }
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("Falta CRON_SECRET: corre `pnpm -C app env:local`.");
    return 2;
  }
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const url = `${base}/api/cron/${job}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "x-cron-secret": secret, "content-type": "application/json" },
      body: "{}",
    });
    console.log(`${job}: ${response.status} ${await response.text()}`);
    return response.status === 200 ? 0 : 1;
  } catch {
    console.error(
      `${job}: no se pudo conectar con ${url}. ¿Está corriendo \`pnpm -C app dev\`?`,
    );
    return 1;
  }
}

main().then((code) => {
  process.exitCode = code;
});
