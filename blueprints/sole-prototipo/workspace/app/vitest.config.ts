import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Vitest no carga .env por sí solo: este archivo lo genera `pnpm -C app env:local`.
if (existsSync(".env.test.local")) {
  process.loadEnvFile(".env.test.local");
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/db/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/blueprints/**", "tests/e2e/**"],
    setupFiles: ["tests/setup/env.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
