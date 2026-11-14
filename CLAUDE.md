# Sole — prototipo

PWA gratuita para personas que cuidan a otra persona en Chile: recordatorios, "Hoy", bitácora, informes y cuidado de quien cuida. App en `app/` (Next.js), sitio estático en `web/`.

## Comandos

Todo se corre **desde la raíz del repo**. La app vive en `app/`, así que cada comando lleva `pnpm -C app`.

| Tarea | Comando |
|---|---|
| Instalar | `pnpm -C app install --frozen-lockfile` |
| Dev | `pnpm -C app dev` — http://localhost:3000 |
| Build | `pnpm -C app build` (usa `next build --webpack`: lo exige Serwist) |
| Typecheck | `pnpm -C app typecheck` |
| Lint / formato | `pnpm -C app lint` · `pnpm -C app format` |
| Pruebas (unit + base) | `pnpm -C app test` · un archivo: `pnpm -C app test tests/unit/x.test.ts` |
| E2E (build + start :3100) | `pnpm -C app test:e2e` · uno: `pnpm -C app test:e2e tests/e2e/x.spec.ts` |
| Supabase local | `pnpm -C app db:start` · `pnpm -C app db:stop` · estado: `pnpm -C app exec supabase status` |
| Reiniciar base local | `pnpm -C app db:reset` (aplica migraciones + `seed.sql`) |
| Pruebas pgTAP | `pnpm -C app db:test` |
| Tipos de la base | `pnpm -C app db:types` |
| Variables locales | `pnpm -C app env:local` (escribe `.env.local` y `.env.test.local`) |
| Cron en local | `pnpm -C app cron:dispatch` · `pnpm -C app cron:daily` (con `dev` corriendo) |
| Script | `pnpm -C app exec tsx scripts/<nombre>.ts` |

**Compuerta:** `pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test` debe pasar antes de marcar una tarea como hecha. Las pruebas de `tests/db/` necesitan Docker Desktop abierto y Supabase local corriendo.

Runtime: Node 22 (`engines` en `app/package.json`), pnpm 12.18.0 (instalado con npm en `~/.local`; en una terminal nueva: `export PATH="$HOME/.local:$HOME/.local/bin:$PATH"`). Las versiones están en `app/pnpm-lock.yaml`: léelas ahí, nunca las adivines.

## Plan de construcción

`blueprints/sole-prototipo/tasks.json` dice qué sigue; cada tarea se ejecuta desde su archivo en `blueprints/sole-prototipo/epics/`. Una tarea = un commit + su etiqueta `step-NN-<slug>`.

## Stack

Next.js 16 (App Router) · TypeScript 6 · Tailwind CSS 4 · componentes propios sobre HTML nativo · Supabase (Postgres, Auth, RLS, pg_cron, pg_net, Vault) · SQL a mano, sin ORM · Serwist (PWA) · Web Push (VAPID) · Sentry · Turnstile · Vercel.

## Arquitectura

**Camino de una petición.** Navegador → `src/proxy.ts` (refresca la sesión, nonce de CSP, redirige si no hay sesión) → `src/app/(app)/hoy/page.tsx` (Server Component) → `src/server/today/today.ts` → `createSupabaseServerClient()` de `src/lib/supabase/server.ts` → PostgREST con el JWT de la usuaria → Postgres con RLS. Las mutaciones van por Server Actions o por `src/app/api/**/route.ts` (con `createSupabaseRouteClient(request)`). **El navegador nunca consulta tablas de Supabase.**

**Trabajos programados.** `pg_cron` (cada minuto / diario) → `private.call_app_job` → `pg_net` POST con `x-cron-secret` → `src/app/api/cron/dispatch/route.ts` → `src/server/reminders/dispatch.ts` → `src/server/push/send.ts` (Web Push).

| Capa | Puede importar | Nunca |
|---|---|---|
| `src/app/**` (rutas, páginas) | `components`, `server`, `lib` | consultar tablas directo con un cliente propio |
| `src/components/**` | `lib`, otros componentes | `src/server/**`, `src/lib/supabase/admin.ts` |
| `src/server/**` | `lib` | React, `components` |
| `src/lib/**` | `lib` | `server`, `components` |
| `scripts/**` | `lib/crypto`, `scripts/lib` | módulos que lean cookies (`server.ts`) |

**Dónde vive cada cosa.**

| Tema | Única fuente |
|---|---|
| Esquema de la base | `app/supabase/migrations/*.sql` (SQL a mano; nunca el editor del panel) |
| Tipos de la base | `src/lib/supabase/database.types.ts` (generado: `pnpm -C app db:types`) |
| Variables de entorno | `src/lib/env.ts` (`requireEnv` / `readEnv`); nadie más lee `process.env` salvo `NEXT_PUBLIC_*` en cliente |
| Tokens de diseño | `src/app/globals.css` + `src/lib/design/tokens.ts` (mismos hex) |
| Eventos de investigación | `src/server/events/catalog.ts` + `docs/eventos.md` (siempre iguales) |
| Cifrado de campos | `src/lib/crypto/field.ts` |
| Límites de frecuencia | `src/server/security/rate-limit.ts` (`RATE_LIMITS`) |

## Reglas de código

1. **Un componente por archivo, máximo 300 líneas.** Más largo: se divide por responsabilidad.
2. **Imports con el alias `@/` → `app/src/`**, sin extensión (`@/lib/env`). Las pruebas e2e y los scripts pueden usar rutas relativas.
3. **Server Components por defecto.** `"use client"` solo en la hoja que necesita estado, efectos o eventos.
4. **Sin barrel files** (`index.ts` que re-exporta): se importa desde el módulo real.
5. **Validar en el borde con zod**: cada Server Action y cada Route Handler parsea su entrada antes de tocar `src/server/`.
6. **Resultados tipados**: `{ ok: true, data } | { ok: false, error: { code, message } }`. Códigos: `unauthorized`, `forbidden`, `not_found`, `validation_failed`, `rate_limited`, `captcha_failed`, `conflict`, `invitation_invalid`, `unavailable`, `internal`.
7. **Autorizar dentro de cada Server Action y ruta** (`getUser()`); el proxy no basta.
8. **Texto para personas en español de Chile**, tuteo cálido, frases cortas, sin jerga médica ni técnica. Código, commits y comentarios técnicos pueden ir en inglés.
9. **Ninguna dependencia nueva** sin motivo en el mensaje del commit; las versiones salen de `blueprints/sole-prototipo/blueprint.md` §11.

## Sistema de diseño

Tokens en `src/app/globals.css` (claro en `:root`, oscuro en `@media (prefers-color-scheme: dark)`). Componentes usan nombres de token (`bg-primary`, `text-fg`), nunca hex.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--background` | `#faf6ef` | `#16120e` | fondo de página |
| `--surface` | `#f4ede1` | `#1e1913` | tarjetas, paneles, diálogos |
| `--fg` | `#241f1a` | `#f0e8dc` | texto |
| `--fg-muted` | `#5f5548` | `#b6a894` | texto secundario |
| `--fg-subtle` | `#726556` | `#9c8e7c` | pistas, metadatos |
| `--primary` | `#9c5b34` | `#dc9264` | botón principal, enlaces |
| `--primary-fg` | `#ffffff` | `#16120e` | texto sobre primario |
| `--primary-hover` | `#84492a` | `#eaad84` | hover del botón principal, con `--primary-fg` encima |
| `--border` | `#e3d9c9` | `#322a20` | divisores decorativos |
| `--border-strong` | `#726556` | `#9c8e7c` | bordes de campos y controles (≥ 3:1) |
| `--focus` | `#9c5b34` | `#dc9264` | anillo de foco, 3 px |
| `--success` / `--success-bg` | `#2f6b3a` / `#e6f1e7` | `#86c793` / `#1b2a1d` | confirmaciones |
| `--warning` / `--warning-bg` | `#7a5200` / `#f8ecd2` | `#e5b764` / `#2c2414` | atención |
| `--danger` / `--danger-bg` | `#a3312b` / `#f8e3e0` | `#f2958a` / `#2f1b18` | errores, borrar, emergencia |
| `--info` / `--info-bg` | `#2b5a86` / `#e2ecf5` | `#93bde8` / `#18232f` | información |

- **Tipo:** Atkinson Hyperlegible (`next/font/google`, 400 y 700). Base 18 px (`html { font-size: 112.5% }`); escala 18 / 20 / 24 / 30 / 36 px; interlineado 1.5.
- **Espaciado:** base 4 px — 4, 8, 12, 16, 24, 32, 48. **Toques:** mínimo 48 × 48 px.
- **Radios:** 12 px botones y campos, 16 px tarjetas, completo para insignias.
- **Elevación:** plana; bordes `--border`. Solo los diálogos llevan sombra `0 8px 24px rgb(0 0 0 / 0.18)`.
- **Movimiento:** 150 ms `ease-out`, solo `opacity` y `transform`; con `prefers-reduced-motion: reduce`, nada se anima.
- **Diseño:** móvil primero; ancho de contenido máx. 40rem; F12 (persona cuidada) con títulos ≥ 28 px y uno o dos botones por pantalla.
- **Logo:** cuadrado redondeado `--primary` con una "S" `--background` (el de la web). No se usa la estética de carta de la web.

## Variables de entorno

Lista completa con dónde obtener cada una y desde qué paso se exige: `blueprints/sole-prototipo/blueprint.md` §10 y `app/.env.example` (versionado, sin valores). `.env.local` y `.env.test.local` nunca se versionan ni se leen en una conversación.

## Reglas por área

Léelas antes de tocar esa área (se cargan solas al editar esos archivos):

| Archivo | Aplica a |
|---|---|
| `.claude/rules/database.md` | `app/supabase/**`, `app/src/lib/supabase/**` |
| `.claude/rules/server.md` | `app/src/server/**`, `app/src/app/api/**`, `app/src/proxy.ts` |
| `.claude/rules/ui.md` | `app/src/app/**/*.tsx`, `app/src/components/**` |
| `.claude/rules/tests.md` | `app/tests/**`, `app/vitest.config.ts`, `app/playwright.config.ts` |
| `.claude/rules/web.md` | `web/**` |
| `.claude/rules/docs.md` | `docs/**`, `alianzas/**`, `DECISIONES.md`, `PENDIENTES.md` |

## No negociable

1. **RLS en toda tabla de `public` y prueba de aislamiento por rol** para cada tabla nueva. La interfaz nunca es la barrera de seguridad.
2. **La clave secreta de Supabase, `FIELD_ENCRYPTION_KEY`, `CRON_SECRET`, `VAPID_PRIVATE_KEY` e `IP_HASH_SECRET` solo en el servidor**; jamás en una variable `NEXT_PUBLIC_*`, un log, un evento o Sentry.
3. **Notas de bitácora, nombre e indicación de medicamentos y notas de contactos van cifrados** con `src/lib/crypto/field.ts`. Nunca en un aviso push.
4. **Sin datos clínicos** (diagnósticos, dosis, escalas, alergias) y **sin consejo médico** en ningún texto.
5. **La tía Sole está viva**: nada puede sugerir lo contrario ("en memoria" está prohibido).
6. Nunca se versionan secretos, `.env*` con valores ni build generado; nunca se edita a mano una migración ya aplicada ni `database.types.ts`.
7. Nunca se marca una tarea como hecha con su compuerta fallando, y nunca se edita un comando `verify` para que pase.
8. Los agentes **nunca envían correos** a organizaciones ni a personas: preparan textos; los envía el fundador.
