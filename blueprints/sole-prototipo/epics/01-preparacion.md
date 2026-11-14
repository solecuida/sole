# Epic 01: Preparación

> Existe una app Next.js que compila, corre y responde su salud; Supabase local con el esquema completo; CI, escaneo de secretos, sistema de diseño, componentes base, documentos vivos y el diseño funcional de las 17 funcionalidades.

| | |
|---|---|
| **Epic id** | `01-preparacion` |
| **Tasks** | `E1-T1` … `E1-T8` (pasos 1–8 de `blueprint.md` §9) |
| **Fase del brief** | Fase 0 (preparación) y la parte de diseño funcional de la fase 1 del brief. |
| **Depends on** | nada — se empieza aquí, después del Bootstrap de §10 |
| **Unlocks** | 02-cimientos |
| **Parallel with** | — |

You do not need any other file to complete this epic. Everything below is repeated here on purpose.

---

## Stack

Next.js 16 (App Router; `dev` y `build` con `--webpack`) · TypeScript 6 · Tailwind CSS 4 (PostCSS) · componentes propios sobre HTML nativo · Supabase Postgres con RLS · SQL a mano en `app/supabase/migrations` (sin ORM) · Supabase Auth (enlace mágico, TOTP para admin) · Serwist + Web Push · Sentry · Turnstile · Vercel.
Package manager: `pnpm` 12.18.0 (instalado con npm en `~/.local`). Runtime fijado en `app/package.json` → `engines.node` (`>=22.12.0 <23`). Las versiones de las dependencias están en `app/pnpm-lock.yaml`: léelas ahí, nunca las adivines.

Todo comando corre **desde la raíz del repo** (la app vive en `app/`).

| Task | Command |
|---|---|
| Dev | `pnpm -C app dev` — http://localhost:3000 |
| Typecheck | `pnpm -C app typecheck` |
| Lint | `pnpm -C app lint` (arreglar formato: `pnpm -C app format`) |
| Test (one file) | `pnpm -C app test tests/unit/<archivo>.test.ts` · base: `pnpm -C app test tests/db/<archivo>.test.ts` |
| E2E (one file) | `pnpm -C app test:e2e tests/e2e/<archivo>.spec.ts` (hace build y levanta :3100) |
| Base local | `pnpm -C app db:start` / `pnpm -C app db:stop` · reiniciar: `pnpm -C app db:reset` · pgTAP: `pnpm -C app db:test` · tipos: `pnpm -C app db:types` |
| Variables locales | `pnpm -C app env:local` |

**Gate:** `pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test` passes before any task here is marked done.

Las pruebas de `tests/db/` y las e2e usan el Supabase local: abre Docker Desktop y corre `pnpm -C app db:start` antes. El archivo que lo define (`app/supabase/config.toml`) llegó desde `workspace/` y ya está en el proyecto: no lo escribes, y nunca reemplazas por un doble falso un servicio que nombran los criterios.

## Directory subtree

Only the parts this epic touches:

```
app/next.config.ts                                           # NUEVO en E1-T1
app/src/lib/env.ts                                           # NUEVO en E1-T1
app/src/app/api/health/route.ts                              # NUEVO en E1-T1
app/tests/unit/env-health.test.ts                            # NUEVO en E1-T1
app/tests/e2e/smoke.spec.ts                                  # NUEVO en E1-T1
app/src/lib/supabase/database.types.ts                       # NUEVO en E1-T2
app/src/lib/supabase/server.ts                               # NUEVO en E1-T2
app/src/lib/supabase/admin.ts                                # NUEVO en E1-T2
app/tests/db/helpers.ts                                      # NUEVO en E1-T2
app/tests/db/connection.test.ts                              # NUEVO en E1-T2
.github/workflows/ci.yml                                     # NUEVO en E1-T3
.github/dependabot.yml                                       # NUEVO en E1-T3
.gitleaks.toml                                               # NUEVO en E1-T3
.githooks/pre-commit                                         # NUEVO en E1-T3
app/tests/unit/repo-config.test.ts                           # NUEVO en E1-T3
app/src/app/globals.css                                      # NUEVO en E1-T4
app/src/app/layout.tsx                                       # NUEVO en E1-T4
app/src/app/page.tsx                                         # NUEVO en E1-T4
app/src/lib/design/tokens.ts                                 # NUEVO en E1-T4
app/tests/unit/design-system.test.ts                         # NUEVO en E1-T4
app/src/components/ui/button.tsx                             # NUEVO en E1-T5
app/src/components/ui/field.tsx                              # NUEVO en E1-T5
app/src/components/ui/choice-group.tsx                       # NUEVO en E1-T5
app/src/components/ui/dialog.tsx                             # NUEVO en E1-T5
app/tests/unit/ui-components.test.tsx                        # NUEVO en E1-T5
DECISIONES.md                                                # NUEVO en E1-T6
PENDIENTES.md                                                # NUEVO en E1-T6
docs/limites.md                                              # NUEVO en E1-T6
docs/licencias.md                                            # NUEVO en E1-T6
app/tests/unit/docs-base.test.ts                             # NUEVO en E1-T6
docs/diseno/nucleo.md                                        # NUEVO en E1-T7
docs/diseno/registro-y-cuidado.md                            # NUEVO en E1-T7
docs/diseno/informes-y-escucha.md                            # NUEVO en E1-T7
docs/diseno/familiares.md                                    # NUEVO en E1-T7
app/tests/unit/docs-diseno.test.ts                           # NUEVO en E1-T7
docs/diseno/persona-cuidada.md                               # NUEVO en E1-T8
docs/diseno/cuenta.md                                        # NUEVO en E1-T8
docs/diseno/admin-y-organizaciones.md                        # NUEVO en E1-T8
docs/diseno/transversal.md                                   # NUEVO en E1-T8
```

Everything outside this subtree is out of scope (leer otros archivos está bien; modificarlos no). If a task seems to require editing a file not listed here, stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entidad | Qué toca esta épica | Notas |
|---|---|---|
| todas las de `app/supabase/migrations/` | solo lectura: tipos generados y prueba pgTAP | el esquema llegó con la copia de `workspace/`; ningún paso de esta épica lo cambia |
| `organizations` | lectura de `DEMO-LOCAL` en la prueba de conexión | fila de `seed.sql`, solo local |
| `profiles` | se crea por trigger al crear usuarias de prueba | `on_auth_user_created` |

## Contracts

**Consumed** — already exists, do not rebuild:

| De | Interfaz | Garantía |
|---|---|---|
| Bootstrap (§10) | `app/` con scripts de `package.json`, dependencias instaladas, Supabase local corriendo, `.env.local` y `.env.test.local` | `pnpm -C app lint` y `pnpm -C app typecheck` salen con 0 |
| `workspace/` | `vitest.config.ts`, `playwright.config.ts`, `tests/setup/env.ts`, migraciones, `config.toml`, `seed.sql`, `scripts/write-local-env.ts`, `scripts/lib/load-env.ts`, `biome.json`, `postcss.config.mjs` | archivos completos, no se editan |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Exporta | Firma | La usan |
|---|---|---|
| `app/src/lib/env.ts` → `requireEnv`, `readEnv`, `appUrl` | `(name: string) => string` · `(name) => string \| undefined` · `() => string` | todas las épicas |
| `app/src/lib/supabase/server.ts` → `createSupabaseServerClient`, `createSupabaseRouteClient` | `() => Promise<SupabaseClient<Database>>` · `(request: Request) => SupabaseClient<Database>` | 02 en adelante |
| `app/src/lib/supabase/admin.ts` → `createSupabaseAdminClient` | `() => SupabaseClient<Database>` | 02 en adelante |
| `app/tests/db/helpers.ts` → `createTestUser`, `grantRequiredConsents`, `createCircleFor`, `adminClient` | ver tarea `E1-T2` | todas las pruebas de base |
| `app/src/components/ui/*` → `Button`, `Field`, `ChoiceGroup`, `Dialog` | props descritas en `E1-T5` | 02 en adelante |
| `app/src/lib/design/tokens.ts` → `tokens`, `contrastRatio`, `contrastPairs` | objetos de hex por tema | íconos, manifiesto, pruebas |

## Conventions that bite in this area

- Todo comando corre desde la raíz del repo con `pnpm -C app …`; las pruebas que leen archivos fuera de `app/` usan `path.resolve(process.cwd(), "..")` como raíz.
- `next.config.ts` es de los pasos (este lo crea; otros lo editan). `biome.json`, `vitest.config.ts` y `playwright.config.ts` vienen del plano y no se editan. `typecheck` es `next typegen && tsc --noEmit`: genera `next-env.d.ts` aunque no haya build.
- Tipografía por `next/font/google`: el build descarga Atkinson Hyperlegible y necesita red, igual que `pnpm install`.
- No barrel files; imports con `@/` → `app/src/` (las e2e y `scripts/lib`, relativas).
- Resultados tipados `{ ok: true, data } | { ok: false, error: { code, message } }`; textos para personas en español de Chile.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/database.md`, `server.md`, `ui.md`, `tests.md`, `web.md`, `docs.md`. Both sit in the project root — the builder copied them there from the bundle's `workspace/` before task one.

## Resumen funcional por F (para `docs/diseno/`)

| F | Prioridad | Qué hace | Datos | Permisos |
|---|---|---|---|---|
| F1 Bienvenida | P1 | Enlace mágico (contraseña opcional), consentimientos por capas antes de guardar datos, persona cuidada y plantilla por tipo de cuidado, guía de instalación; permiso de avisos solo cuando la persona lo pide | `profiles`, `consents`, `circles`, `circle_members`, `care_templates`, `reminders` | cada quien lo suyo; crear círculo por RPC `create_circle` |
| F2 Hoy | P1 | Lo de hoy por importancia (importante, normal, cuando puedas), hecho/no se hizo/posponer, atrasado, próximos días, consejo del día, avance amable, cambio de círculo | `reminder_occurrences`, `occurrence_marks`, `tips` | miembros leen; marcan cuidadora y familia por RPC `mark_occurrence` |
| F3 Recordatorios | P1 | 7 tipos, importancia, medicamento en texto libre cifrado, repetición diaria/semanal/cada N días/mensual/anual, "¿Lo hiciste?" a los 15 min, avisos previos 3/1/0 días, horario de Chile | `reminders`, `reminder_occurrences`, `push_subscriptions` | cuidadora escribe; miembros leen |
| F4 Calendario | P1 | Mes y semana; crear desde un día | `reminders` | miembros leen |
| F5 Tareas | P2 | Sin fecha, pasar a hoy, "pedir ayuda con esto" | `tasks` | cuidadora escribe; familia toma por RPC `claim_task` |
| F6 Bitácora | P1 | Día, ánimo, sueño, comida, nota (cifrada) en menos de 15 s | `journal_entries` | cuidadora escribe; familia lee |
| F7 Informes | P1 | Diario, semanal, mensual, hitos, compartir como imagen o PDF | lectura de lo anterior | el bienestar de la cuidadora solo lo ve ella |
| F8 Cuidar a quien cuida | P1 | Pregunta 1–5 privada, racha baja con suavidad, respiro, directorio verificado | `selfcare_checkins`, `resources` | solo la dueña |
| F9 Contactos | P2 | Llamar con un toque, contacto de emergencia, sin datos clínicos | `contacts` | cuidadora escribe; miembros leen |
| F10 Escuchar | P1 | Botón "Contarle algo a Sole", microencuestas días 3/14/28/56 | `feedback`, `survey_responses` | inserta la usuaria; lee admin con MFA |
| F11 Puertas falsas | P1 | IA, recetas, plan familiar (precios de prueba), comunidad, fotos, invitar familiar | `fake_door_interest` | propias |
| F12 Persona cuidada | P2 | Enlace sin cuenta, solo lo visible, "Listo", emergencia con confirmación + `tel:` + aviso | `cared_links`, `emergency_events` | token hasheado, revocable, vence |
| F13 Mi cuenta | P1 | Consentimientos, descarga JSON/CSV, borrado con 7 días de gracia, cerrar círculo (fallecimiento) | todas | solo la dueña |
| F14 Premium en piloto | P2 | Informe para el médico imprimible | lectura | cuidadora |
| F15 Panel del fundador | P1 | Métricas H1–H6, organizaciones, contenido, comentarios, exportación seudónima, límites | `events`, `organizations`, `tips`, `resources`, `care_templates`, `admin_audit_log` | admin con MFA (`aal2`) |
| F16 Familiares | S | Invitación por enlace, ver Hoy y calendario, "verificado por", tomar tareas, avisos configurables, feed | `invitations`, `circle_members.notify_kinds`, `occurrence_marks` | no cambia configuración ni permisos |
| F17 Panel de organizaciones | P3 | Solo agregados, nunca grupos de menos de 5 | `organizations.dashboard_token_hash` | enlace privado |

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do not re-rank by priority or by what looks quick.

### `E1-T1` — Montar el esqueleto de la app y su endpoint de salud

**Depends on:** nothing · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 1

Bootstrap (§10) ya creó `app/` con `create-next-app`, fijó los scripts de `package.json` e instaló todo. Este paso deja la base sobre la que se apoya el resto.
- `app/next.config.ts` — reemplaza el del scaffold por uno propio: `reactStrictMode: true`, `poweredByHeader: false`, `productionBrowserSourceMaps: false`. Sin `turbopack.rules`: el build corre con `next build --webpack` (lo exige @serwist/next) y Tailwind entra por `postcss.config.mjs`.
- `app/src/lib/env.ts` — `readEnv(name)` (string o `undefined`), `requireEnv(name)` que lanza `MissingEnvError` con el nombre de la variable en el mensaje, y `appUrl()` que devuelve `APP_URL` o `http://localhost:3000`. Ninguna variable se exige al importar el módulo: cada función la pide cuando la usa (así ningún paso rompe la compuerta de uno anterior). Fuera de este archivo nadie lee `process.env`, salvo las `NEXT_PUBLIC_*` en componentes de cliente, que Next solo incrusta si se escriben literales.
- `app/src/app/api/health/route.ts` — `GET` devuelve `Response.json({ ok: true, data: { status: "ok", time } })` con `cache-control: no-store`. El chequeo de base de datos llega en paso 50 (`vercel-config`).
- `app/tests/unit/env-health.test.ts` — prueba `requireEnv` y el `GET` importado directamente; compara el cuerpo con `toMatchObject` (parcial), así el campo `db` que agrega paso 50 (`vercel-config`) no la rompe.
- `app/tests/e2e/smoke.spec.ts` — pide `/api/health` al servidor que levanta `webServer` de `playwright.config.ts` (build + start en el puerto 3100). Es la primera vez que algo **corre** la app.

**Files**
- `app/next.config.ts` — new
- `app/src/lib/env.ts` — new
- `app/src/app/api/health/route.ts` — new
- `app/tests/unit/env-health.test.ts` — new
- `app/tests/e2e/smoke.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `pnpm -C app test tests/unit/env-health.test.ts` runs **THE SYSTEM SHALL** pass, asserting that `GET` from `src/app/api/health/route.ts` answers 200 with body `{ ok: true, data: { status: "ok" } }` plus a `time` field and the header `cache-control: no-store`.
2. **WHEN** `requireEnv("SOLE_NO_EXISTE")` is called with that variable unset **THE SYSTEM SHALL** throw `MissingEnvError` whose message contains `SOLE_NO_EXISTE`.
3. **WHEN** `tests/e2e/smoke.spec.ts` runs against the production build started on port 3100 **THE SYSTEM SHALL** answer `GET /api/health` with status 200 and `ok: true`.
4. **WHEN** `pnpm -C app lint` and `pnpm -C app typecheck` run **THE SYSTEM SHALL** exit 0.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/env-health.test.ts
pnpm -C app test:e2e tests/e2e/smoke.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T1: Montar el esqueleto de la app y su endpoint de salud"
git tag step-01-esqueleto
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E1-T2` — Conectar Supabase local, tipos generados y clientes

**Depends on:** `E1-T1` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 2

Las migraciones de `app/supabase/migrations/` y `app/supabase/seed.sql` llegaron con la copia de `workspace/` y Bootstrap ya las aplicó. Aquí se generan los tipos y se crean los únicos tres caminos para hablar con la base.
- `app/src/lib/supabase/database.types.ts` — se genera con `pnpm -C app db:types` (nunca se edita a mano; Biome lo excluye).
- `app/src/lib/supabase/server.ts` — dos fábricas con `@supabase/ssr`: `createSupabaseServerClient()` para Server Components y Server Actions (cookies de `next/headers`) y `createSupabaseRouteClient(request)` para Route Handlers (lee las cookies del `Request`; si llega `Authorization: Bearer <jwt>` lo usa como sesión, que es lo que hacen las pruebas). Opciones de cookie: `httpOnly: true`, `sameSite: "lax"`, `secure` cuando `APP_URL` empieza con `https://`, `path: "/"`. Usan `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` vía `requireEnv`.
- `app/src/lib/supabase/admin.ts` — `createSupabaseAdminClient()` con `SUPABASE_SECRET_KEY`, `auth: { persistSession: false, autoRefreshToken: false }`; lanza si `typeof window !== "undefined"`. Solo lo importan `src/server/**`, rutas de cron/admin y pruebas.
- `app/tests/db/helpers.ts` — `adminClient()`, `createTestUser({ consents?: boolean })` (crea el usuario con `auth.admin.createUser({ email: "test-<uuid>@example.test", password, email_confirm: true })` y contraseña `"Aa1" + crypto.randomUUID()`, que cumple el mínimo de 10 caracteres con minúsculas, mayúsculas y dígitos de `config.toml`, inicia sesión con la clave publicable y devuelve `{ client, userId, email, password, accessToken }`), `grantRequiredConsents(client, userId)` (inserta `terms` y `sensitive` con versión `2026-11-14`) y `createCircleFor(client, displayName)` (llama a la RPC `create_circle`).
- `app/tests/db/connection.test.ts` — las aserciones de abajo.

**Files**
- `app/src/lib/supabase/database.types.ts` — new
- `app/src/lib/supabase/server.ts` — new
- `app/src/lib/supabase/admin.ts` — new
- `app/tests/db/helpers.ts` — new
- `app/tests/db/connection.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `pnpm -C app db:reset` runs **THE SYSTEM SHALL** apply every migration in `supabase/migrations` and `supabase/seed.sql` and exit 0.
2. **WHEN** `pnpm -C app db:test` runs **THE SYSTEM SHALL** pass `supabase/tests/database.test.sql`, which asserts that every table in schema `public` has RLS enabled, that the cron jobs `sole-dispatch` and `sole-daily` exist and that `authenticated` has no UPDATE privilege on `profiles.is_admin`.
3. **WHEN** `tests/db/connection.test.ts` runs **THE SYSTEM SHALL** read the organization `DEMO-LOCAL` with the admin client and SHALL receive error code `42501` and no rows when an anonymous client selects from `profiles`.
4. **WHEN** a user is created through `createTestUser` **THE SYSTEM SHALL** have a `profiles` row for that user created by the trigger `on_auth_user_created`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app db:reset
pnpm -C app db:test
pnpm -C app db:types
pnpm -C app typecheck
pnpm -C app lint
pnpm -C app test tests/db/connection.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T2: Conectar Supabase local, tipos generados y clientes"
git tag step-02-supabase-local
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E1-T3` — Configurar CI, Dependabot y escaneo de secretos

**Depends on:** `E1-T1` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 3

- `.github/workflows/ci.yml` — en `push` a `main` y en `pull_request`. Jobs: `quality` (checkout, `pnpm/action-setup` con la versión de `packageManager`, `actions/setup-node` con Node 22 y caché pnpm, `pnpm -C app install --frozen-lockfile`, `pnpm -C app exec biome ci .`, `pnpm -C app typecheck`, `pnpm -C app db:start`, `pnpm -C app env:local`, `pnpm -C app db:test`, `pnpm -C app test`); `e2e` (needs `quality`; instala navegadores con `pnpm -C app exec playwright install --with-deps chromium webkit`, levanta Supabase, `pnpm -C app env:local`, `pnpm -C app test:e2e`, sube `app/playwright-report` como artefacto solo si falla); `gitleaks` (`fetch-depth: 0` para escanear todo el historial, acción oficial `gitleaks/gitleaks-action`, config `.gitleaks.toml`); `audit` (`pnpm -C app audit --prod --audit-level high`); `semgrep` (contenedor `semgrep/semgrep`, `semgrep scan --config p/typescript --config p/react --config p/secrets --error app/src`). Permisos mínimos: `permissions: contents: read`.
- `.github/dependabot.yml` — `npm` en `/app` y `github-actions` en `/`, ambos semanales.
- `.gitleaks.toml` — `[extend] useDefault = true` y una `allowlist` de rutas para `app/.env.example` y `blueprints/`.
- `.githooks/pre-commit` — script `sh`: si `command -v gitleaks` existe, ejecuta `gitleaks git --pre-commit --staged --redact --config .gitleaks.toml` y devuelve su código; si no existe, imprime "gitleaks no está instalado: el escaneo corre en CI" y sale con 0. Luego activa los hooks: `git config core.hooksPath .githooks`. El hook local es solo una comodidad: **la compuerta real de secretos es el job `gitleaks` de CI** (historial completo en cada push); este paso verifica que ese job exista y esté bien configurado.
- `app/tests/unit/repo-config.test.ts` — lee esos archivos y los dos `.gitignore` desde la raíz del repo (`path.resolve(process.cwd(), "..")`).

**Files**
- `.github/workflows/ci.yml` — new
- `.github/dependabot.yml` — new
- `.gitleaks.toml` — new
- `.githooks/pre-commit` — new
- `app/tests/unit/repo-config.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/repo-config.test.ts` reads `.github/workflows/ci.yml` **THE SYSTEM SHALL** find the jobs `quality`, `e2e`, `gitleaks`, `audit` and `semgrep`, and in `.github/dependabot.yml` the ecosystems `npm` with directory `/app` and `github-actions`.
2. **WHEN** `git config core.hooksPath` is read **THE SYSTEM SHALL** print `.githooks`.
3. **WHEN** the test reads `.githooks/pre-commit` **THE SYSTEM SHALL** find the `command -v gitleaks` guard, the warning branch that exits 0 and the invocation `gitleaks git --pre-commit --staged --redact`.
4. **WHEN** the test reads the root `.gitignore` **THE SYSTEM SHALL** find `.env.*` followed later by `!.env.example`, and `app/.gitignore` SHALL contain the line `!.env.example`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test tests/unit/repo-config.test.ts
test "$(git config core.hooksPath)" = .githooks
sh .githooks/pre-commit
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T3: Configurar CI, Dependabot y escaneo de secretos"
git tag step-03-ci-y-secretos
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E1-T4` — Definir las variables de diseño y la tipografía

**Depends on:** `E1-T1` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 4

Los valores exactos están en la tabla de tokens de `CLAUDE.md` (y en §7 del plano). No se inventa ningún color.
- `app/src/lib/design/tokens.ts` — `export const tokens = { light: {...}, dark: {...} }` con las claves `background`, `surface`, `fg`, `fgMuted`, `fgSubtle`, `primary`, `primaryFg`, `primaryHover`, `border`, `borderStrong`, `focus`, `success`, `warning`, `danger`, `info`, `successBg`, `warningBg`, `dangerBg`, `infoBg`; más `contrastRatio(a, b)` (fórmula WCAG 2.x) y la lista `contrastPairs` (texto ≥ 4.5, bordes de control y foco ≥ 3).
- `app/src/app/globals.css` — `@import "tailwindcss";`, las mismas variables CSS en `:root` (claro) y dentro de `@media (prefers-color-scheme: dark) { :root { ... } }`, `@theme inline` que mapea `--color-*` a esas variables y `--font-sans` a `var(--font-atkinson)`. Base: `html { font-size: 112.5%; }` (18 px), `body` con fondo y texto de token, `:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }`, y `@media (prefers-reduced-motion: reduce)` que reduce animaciones y transiciones a 0.01ms.
- `app/src/app/layout.tsx` — `<html lang="es-CL">`, `Atkinson_Hyperlegible` de `next/font/google` (pesos 400 y 700, `subsets: ["latin"]`, `display: "swap"`, `variable: "--font-atkinson"`), metadata (`title.template: "%s · Sole"`, descripción en español), `viewport.themeColor` claro/oscuro desde `tokens`, y el enlace "Saltar al contenido" hacia `#contenido` como primer elemento del `body`.
- `app/src/app/page.tsx` — reemplaza la página demo del scaffold (que trae colores hex sueltos) por una portada mínima con tokens: título "Sole" y una frase; paso 16 (`e2e-bienvenida`) la completa.
- `app/tests/unit/design-system.test.ts` — contraste de todos los pares, paridad con `globals.css`, ausencia de hex sueltos y revisión de `layout.tsx`.

**Files**
- `app/src/app/globals.css` — new
- `app/src/app/layout.tsx` — new
- `app/src/app/page.tsx` — new
- `app/src/lib/design/tokens.ts` — new
- `app/tests/unit/design-system.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/design-system.test.ts` runs **THE SYSTEM SHALL** find every text pair in `contrastPairs` at 4.5:1 or more and every `borderStrong` and `focus` pair at 3:1 or more against `background` and `surface`, in light and in dark.
2. **WHEN** the same test reads `src/app/globals.css` **THE SYSTEM SHALL** find every token of `tokens.ts` declared with the same hex in `:root` for light and inside the `prefers-color-scheme: dark` block for dark.
3. **WHEN** the same test scans `src/` **THE SYSTEM SHALL** find zero hex color literals outside `src/app/globals.css` and `src/lib/design/tokens.ts`.
4. **WHEN** the same test reads `src/app/layout.tsx` **THE SYSTEM SHALL** find `lang="es-CL"`, `Atkinson_Hyperlegible` with `display: "swap"` and a link to `#contenido` with the text "Saltar al contenido".
5. **WHEN** `pnpm -C app build` runs **THE SYSTEM SHALL** exit 0.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/design-system.test.ts
pnpm -C app build
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T4: Definir las variables de diseño y la tipografía"
git tag step-04-tokens-diseno
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E1-T5` — Crear los componentes base accesibles

**Depends on:** `E1-T4` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 5

Sin librería de componentes: elementos nativos con estilos de token (ver §2 y la decisión registrada en `DECISIONES.md`). Clases solo con tokens (`bg-primary`, `text-fg`, …), nunca hex.
- `button.tsx` — variantes `primary`, `secondary`, `danger`, `ghost`; siempre `min-h-12 min-w-12` (48 px) y `text-lg`; prop `pending` pone `aria-busy="true"` y `disabled`.
- `field.tsx` — `<label htmlFor>` + input/textarea/select + pista + error. Con error: `aria-invalid="true"`, `aria-describedby` hacia un elemento con `role="alert"`.
- `choice-group.tsx` (cliente) — `<fieldset>` + `<legend>`; una opción nativa (`radio`, o `checkbox` con `multiple`) por ítem, en tarjetas grandes de 48 px de alto mínimo.
- `dialog.tsx` (cliente) — `<dialog>` nativo: `showModal()` si existe, si no el atributo `open`; `aria-labelledby` al título; botón "Cerrar"; devuelve el foco al disparador.
- `ui-components.test.tsx` — primera línea `// @vitest-environment jsdom`; usa `@testing-library/react`.

**Files**
- `app/src/components/ui/button.tsx` — new
- `app/src/components/ui/field.tsx` — new
- `app/src/components/ui/choice-group.tsx` — new
- `app/src/components/ui/dialog.tsx` — new
- `app/tests/unit/ui-components.test.tsx` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `Field` renders with an `error` **THE SYSTEM SHALL** give the control `aria-invalid="true"`, link it through `aria-describedby` to an element with `role="alert"` that holds the error text, and associate the `<label>` through `htmlFor`.
2. **WHEN** `ChoiceGroup` renders three options **THE SYSTEM SHALL** output one `<fieldset>` with a `<legend>` and three native radio inputs, or three checkboxes when `multiple` is set, each with an accessible name.
3. **WHEN** `Button` renders **THE SYSTEM SHALL** carry the classes `min-h-12` and `min-w-12`, and with `pending` SHALL set `aria-busy="true"` and `disabled`.
4. **WHEN** `Dialog` opens **THE SYSTEM SHALL** expose `aria-labelledby` pointing at its title and a button whose accessible name is "Cerrar".

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/ui-components.test.tsx
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T5: Crear los componentes base accesibles"
git tag step-05-componentes-base
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E1-T6` — Abrir DECISIONES, PENDIENTES, límites y licencias

**Depends on:** `E1-T1` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 6

Archivos vivos que pide el brief (§0.2). Todo en español de Chile.
- `DECISIONES.md` — tabla `| Decisión | Alternativa descartada | Por qué | Fecha |` con una fila por cada decisión A CRITERIO de §20.3 del plano (sin librería de componentes, Supabase dentro de `app/`, Resend en vez de Zoho para el correo de la app, despachador en una ruta de Next en vez de Edge Function, build con webpack por Serwist, precios de prueba del plan familiar, nombre del medicamento fuera del aviso push, formulario web vía la app, Semgrep + CodeQL, cuenta borrada a los 7 días, sin respaldo por correo de los recordatorios).
- `PENDIENTES.md` — `# Pendientes`, línea "Estado:" y secciones `## Prioridad alta`, `## Prioridad media`, `## Prioridad baja`; parte con F16 y F17 en baja ("se construyen en la fase 8 si sobra tiempo").
- `docs/limites.md` — tabla `| Servicio | Límite del plan gratuito | Qué pasa al alcanzarlo | Cómo se vigila |` con una fila para Supabase, Vercel, Resend, Sentry, Cloudflare Turnstile y GitHub Actions. Cada límite lleva `[VERIFICAR]` o la URL oficial de donde salió. Incluye: Supabase pausa tras 7 días sin actividad (mitigado por `keepalive.yml`), dos proyectos gratis por organización (el sitio ya usa uno: `sole-web`), Vercel Hobby es solo para uso no comercial, Resend 3.000 correos al mes y 100 al día según el brief.
- `docs/licencias.md` — tabla `| Recurso | Licencia | Fuente |`: Atkinson Hyperlegible (SIL Open Font License 1.1), lucide-react (ISC), Next.js (MIT), Supabase JS (MIT), Recharts (MIT), Serwist (MIT), web-push (MPL-2.0); el logo "S" es propio.
- `app/tests/unit/docs-base.test.ts` — lee desde la raíz del repo.

**Files**
- `DECISIONES.md` — new
- `PENDIENTES.md` — new
- `docs/limites.md` — new
- `docs/licencias.md` — new
- `app/tests/unit/docs-base.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/docs-base.test.ts` runs **THE SYSTEM SHALL** find in `DECISIONES.md` a table with the header `| Decisión | Alternativa descartada | Por qué | Fecha |` and at least one data row.
2. **WHEN** it reads `PENDIENTES.md` **THE SYSTEM SHALL** find the headings `## Prioridad alta`, `## Prioridad media` and `## Prioridad baja`.
3. **WHEN** it reads `docs/limites.md` **THE SYSTEM SHALL** find one table row for each of Supabase, Vercel, Resend, Sentry, Cloudflare Turnstile and GitHub Actions, each containing `[VERIFICAR]` or an `https://` source.
4. **WHEN** it reads `docs/licencias.md` **THE SYSTEM SHALL** find Atkinson Hyperlegible with the license `SIL Open Font License 1.1`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test tests/unit/docs-base.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T6: Abrir DECISIONES, PENDIENTES, límites y licencias"
git tag step-06-documentos-base
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E1-T7` — Escribir el diseño funcional de F1–F11, F14 y F16

**Depends on:** `E1-T6` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 7

Diseño funcional que exige el brief (§0.2 y fase 1), escrito desde `PROTOTIPO-Brief-Fable.md` §3 y el "Resumen funcional por F" de esta épica. Cada F es una sección `## F<n> · <nombre>` con cuatro subsecciones fijas: `### Flujo`, `### Datos`, `### Permisos`, `### Criterios de aceptación`.
- `nucleo.md` — F1, F2, F3, F4.
- `registro-y-cuidado.md` — F5, F6, F8, F9.
- `informes-y-escucha.md` — F7, F10, F11, F14.
- `familiares.md` — F16 completa aunque se construya al final: además de las cuatro subsecciones, `### Notificaciones` (por defecto fechas importantes, controles y emergencias) y `### Modelo de datos` (`circle_members.role = 'family'`, `notify_kinds`, `invitations`, `occurrence_marks.marked_by`, RPC `accept_invitation`, `claim_task`, `set_member_notify_kinds`).
- `docs-diseno.test.ts` — `const REQUIRED = { "nucleo.md": ["F1","F2","F3","F4"], "registro-y-cuidado.md": ["F5","F6","F8","F9"], "informes-y-escucha.md": ["F7","F10","F11","F14"], "familiares.md": ["F16"] }`; paso 8 (`diseno-funcional-2`) lo amplía.

**Files**
- `docs/diseno/nucleo.md` — new
- `docs/diseno/registro-y-cuidado.md` — new
- `docs/diseno/informes-y-escucha.md` — new
- `docs/diseno/familiares.md` — new
- `app/tests/unit/docs-diseno.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/docs-diseno.test.ts` runs **THE SYSTEM SHALL** find, for every F listed in its `REQUIRED` map, a heading `## F<n> ·` in the mapped file followed by the subsections `### Flujo`, `### Datos`, `### Permisos` and `### Criterios de aceptación`.
2. **WHEN** it reads `docs/diseno/familiares.md` **THE SYSTEM SHALL** also find `### Notificaciones` and `### Modelo de datos`, and the words `accept_invitation`, `claim_task` and `notify_kinds`.
3. **WHEN** it scans `docs/diseno/` **THE SYSTEM SHALL** find none of the words `diagnóstico`, `dosis` or `en memoria`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test tests/unit/docs-diseno.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T7: Escribir el diseño funcional de F1–F11, F14 y F16"
git tag step-07-diseno-funcional-1
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E1-T8` — Completar el diseño funcional de F12, F13, F15 y F17

**Depends on:** `E1-T7` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 8

Mismo formato que paso 7 (`diseno-funcional-1`).
- `persona-cuidada.md` — F12: enlace o código sin cuenta, solo recordatorios visibles, botón "Listo", botón de emergencia con confirmación, `tel:` al contacto de emergencia o al 131 `[VERIFICAR en fuente oficial]`, aviso urgente, registro, revocación y el texto "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue."
- `cuenta.md` — F13: consentimientos por capas, descarga JSON/CSV, borrado con 7 días de gracia (al borrarse la cuenta de la cuidadora se borran los círculos que ella creó, incluidos los datos que ven sus familiares; la pantalla de borrado lo advierte), cierre de círculo (incluido fallecimiento, con lenguaje cuidadoso y recordatorios silenciados desde el primer momento).
- `admin-y-organizaciones.md` — F15 y F17 (agregados, nunca grupos de menos de 5 personas).
- `transversal.md` — sin `## F`; secciones `## Sin conexión`, `## Rendimiento`, `## Textos`, `## Investigación` (eventos seudónimos, consentimiento separado).
- `docs-diseno.test.ts` — agrega `"persona-cuidada.md": ["F12"]`, `"cuenta.md": ["F13"]`, `"admin-y-organizaciones.md": ["F15","F17"]` a `REQUIRED` y verifica las cuatro secciones de `transversal.md`.

**Files**
- `docs/diseno/persona-cuidada.md` — new
- `docs/diseno/cuenta.md` — new
- `docs/diseno/admin-y-organizaciones.md` — new
- `docs/diseno/transversal.md` — new
- `app/tests/unit/docs-diseno.test.ts` — edit

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/docs-diseno.test.ts` runs **THE SYSTEM SHALL** find each of F1 to F17 exactly once across `docs/diseno/`, each with the subsections `### Flujo`, `### Datos`, `### Permisos` and `### Criterios de aceptación`.
2. **WHEN** it reads `docs/diseno/persona-cuidada.md` **THE SYSTEM SHALL** find the sentence "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue." and the marker `[VERIFICAR`.
3. **WHEN** it reads `docs/diseno/transversal.md` **THE SYSTEM SHALL** find the headings `## Sin conexión`, `## Rendimiento`, `## Textos` and `## Investigación`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test tests/unit/docs-diseno.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T8: Completar el diseño funcional de F12, F13, F15 y F17"
git tag step-08-diseno-funcional-2
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test` runs at the end of this epic **THE SYSTEM SHALL** exit 0 with 0 failed tests.
2. **WHEN** `pnpm -C app db:test` and the e2e smoke test run **THE SYSTEM SHALL** exit 0, proving the schema is protected and the built app answers `/api/health`.

```bash
pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test
pnpm -C app db:test
pnpm -C app test:e2e tests/e2e/smoke.spec.ts
```

Run from the project root. Both criteria are decided by these commands.

## Pitfalls

- **El scaffold trae su propio `next.config.ts` con reglas de Turbopack** — se reemplaza entero; el build es `next build --webpack` y Tailwind entra por `postcss.config.mjs`.
- **`create-next-app` deja una página demo con colores hex sueltos** — `E1-T4` la reemplaza por una portada mínima con tokens; no la uses como referencia de estilo.
- **Docker Desktop cerrado** — `pnpm -C app db:reset` y las pruebas de `tests/db/` fallan con error de conexión; ábrelo y corre `pnpm -C app db:start`.
- **El diseño funcional no inventa**: si algo no está en el brief ni en esta épica, va como pregunta en `PENDIENTES.md`, no como requisito.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `git tag -l 'step-*'` lists `step-01-esqueleto`, `step-02-supabase-local`, `step-03-ci-y-secretos`, `step-04-tokens-diseno`, `step-05-componentes-base`, `step-06-documentos-base`, `step-07-diseno-funcional-1`, `step-08-diseno-funcional-2`.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `app/.env.example` updated if this epic added a variable.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
- [ ] Si esta épica cierra una fase del brief: resumen corto al fundador (qué funciona, cómo probarlo, qué se decidió en `DECISIONES.md`, qué necesita) y `PENDIENTES.md` al día.
