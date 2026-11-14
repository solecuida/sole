# Sole — instrucciones para agentes

PWA gratuita para personas que cuidan a otra persona en Chile. App en `app/` (Next.js + Supabase), sitio estático en `web/`.

## Comandos (desde la raíz del repo)

| Tarea | Comando |
|---|---|
| Instalar | `pnpm -C app install --frozen-lockfile` |
| Dev | `pnpm -C app dev` — http://localhost:3000 |
| Build | `pnpm -C app build` |
| Typecheck | `pnpm -C app typecheck` |
| Lint / formato | `pnpm -C app lint` · `pnpm -C app format` |
| Pruebas | `pnpm -C app test` · un archivo: `pnpm -C app test tests/unit/x.test.ts` |
| E2E | `pnpm -C app test:e2e` |
| Supabase local | `pnpm -C app db:start` · `pnpm -C app db:reset` · `pnpm -C app db:test` |
| Variables locales | `pnpm -C app env:local` |

Compuerta antes de dar algo por hecho: `pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test`.

Qué construir y en qué orden: `blueprints/sole-prototipo/tasks.json` y `blueprints/sole-prototipo/epics/`.

## No negociable

1. RLS en toda tabla de `public` y prueba de aislamiento por rol para cada tabla nueva.
2. Claves secretas solo en el servidor; nunca en `NEXT_PUBLIC_*`, logs, eventos ni Sentry.
3. Notas de bitácora, medicamentos y notas de contactos van cifrados; nunca en un aviso push.
4. Sin datos clínicos ni consejo médico.
5. La tía Sole está viva: nunca "en memoria".
6. Sin secretos ni build generado en git; no se editan migraciones aplicadas ni tipos generados.
7. Ninguna tarea se marca hecha con su compuerta fallando; los comandos de verificación no se editan.
8. Los agentes nunca envían correos.

Arquitectura completa, capas, tokens de diseño y reglas por área: `CLAUDE.md` en esta misma carpeta.
