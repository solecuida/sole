import { existsSync } from "node:fs";

// Cada worker de Vitest vuelve a cargar las variables locales (no pisa las ya definidas).
if (existsSync(".env.test.local")) {
  process.loadEnvFile(".env.test.local");
}

process.env.TZ = "UTC";
