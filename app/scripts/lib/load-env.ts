import { existsSync } from "node:fs";

// Los scripts con tsx no cargan .env por sí solos. Todo script de scripts/ llama a esto primero.
export function loadLocalEnv(): void {
  for (const file of [".env.local", ".env.test.local"]) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
    }
  }
}
