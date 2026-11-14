---
description: Convenciones de pruebas unitarias, de base de datos y e2e
paths:
  - "app/tests/**"
  - "app/vitest.config.ts"
  - "app/playwright.config.ts"
---

# Pruebas

- `tests/unit/**` sin base de datos; `tests/db/**` contra el Supabase local (Docker abierto, `pnpm -C app db:start`); `tests/e2e/**` con Playwright contra el build en :3100.
- Variables: Vitest y Playwright cargan `.env.test.local` en su config; los scripts llaman a `loadLocalEnv()`. Si falta, corre `pnpm -C app env:local`.
- Cada prueba crea sus propias usuarias con correos aleatorios (`test-<uuid>@example.test`); ninguna depende de otra ni del orden.
- RLS se prueba con sesiones reales, nunca con el cliente admin.
- Reloj inyectado (`now`) en toda lógica con fechas; nada depende de la hora del equipo (`TZ=UTC` en `tests/setup/env.ts`).
- Componentes con `// @vitest-environment jsdom` en la primera línea.
- e2e: importaciones relativas (`./fixtures`); accesibilidad con `expectNoAxeViolations` (0 violaciones, tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa).
- Prohibido `.skip` y `.only` en archivos versionados.
- `vitest.config.ts` y `playwright.config.ts` vienen del plano: no se editan.
