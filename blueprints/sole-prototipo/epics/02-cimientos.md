# Epic 02: Cimientos: seguridad, ingreso y bienvenida

> Una persona puede registrarse con enlace mágico o contraseña, aceptar los consentimientos por capas, crear su círculo desde una plantilla y llegar a "Hoy"; el aislamiento por rol está probado y la capa de eventos existe.

| | |
|---|---|
| **Epic id** | `02-cimientos` |
| **Tasks** | `E2-T1` … `E2-T8` (pasos 9–16 de `blueprint.md` §9) |
| **Fase del brief** | Fase 1 del brief (cimientos). |
| **Depends on** | 01-preparacion |
| **Unlocks** | 03-recordatorios-y-avisos |
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
app/src/server/security/rate-limit.ts                        # NUEVO en E2-T1
app/tests/db/rls-circles.test.ts                             # NUEVO en E2-T1
app/tests/db/rls-private.test.ts                             # NUEVO en E2-T1
app/tests/db/rate-limit.test.ts                              # NUEVO en E2-T1
app/src/server/auth/login.ts                                 # NUEVO en E2-T2
app/src/app/(auth)/entrar/page.tsx                           # NUEVO en E2-T2
app/src/app/(auth)/entrar/actions.ts                         # NUEVO en E2-T2
app/tests/unit/auth-login.test.ts                            # NUEVO en E2-T2
app/src/lib/auth/route-rules.ts                              # NUEVO en E2-T3
app/src/proxy.ts                                             # NUEVO en E2-T3
app/src/app/auth/confirm/route.ts                            # NUEVO en E2-T3
app/tests/unit/proxy-rules.test.ts                           # NUEVO en E2-T3
app/tests/e2e/auth.spec.ts                                   # NUEVO en E2-T3
app/src/server/consents/consents.ts                          # NUEVO en E2-T4
app/src/app/(onboarding)/layout.tsx                          # NUEVO en E2-T4
app/src/app/(onboarding)/bienvenida/consentimientos/page.tsx # NUEVO en E2-T4
app/src/app/(app)/layout.tsx                                 # NUEVO en E2-T4
app/tests/db/consents.test.ts                                # NUEVO en E2-T4
app/src/server/events/catalog.ts                             # NUEVO en E2-T5
app/src/server/events/track.ts                               # NUEVO en E2-T5
docs/eventos.md                                              # NUEVO en E2-T5
app/tests/unit/events-catalog.test.ts                        # NUEVO en E2-T5
app/tests/db/events.test.ts                                  # NUEVO en E2-T5
app/supabase/migrations/20261114001000_contenido_inicial.sql # NUEVO en E2-T6
app/src/server/reminders/rule-schema.ts                      # NUEVO en E2-T6
app/tests/db/content.test.ts                                 # NUEVO en E2-T6
app/src/server/circles/circles.ts                            # NUEVO en E2-T7
app/src/app/(onboarding)/bienvenida/page.tsx                 # NUEVO en E2-T7
app/src/components/onboarding/care-type-picker.tsx           # NUEVO en E2-T7
app/src/components/onboarding/install-guide.tsx              # NUEVO en E2-T7
app/tests/db/create-circle.test.ts                           # NUEVO en E2-T7
app/tests/e2e/fixtures.ts                                    # NUEVO en E2-T8
app/tests/e2e/onboarding.spec.ts                             # NUEVO en E2-T8
app/src/app/(app)/hoy/page.tsx                               # NUEVO en E2-T8
app/src/app/page.tsx                                         # existe — se edita en E2-T8
app/tests/db/org-attribution.test.ts                         # NUEVO en E2-T8
```

Everything outside this subtree is out of scope (leer otros archivos está bien; modificarlos no). If a task seems to require editing a file not listed here, stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entidad | Qué toca esta épica | Notas |
|---|---|---|
| `profiles` | `display_name`, `onboarding_completed_at`, `last_active_at`, `org_code` (trigger) | `is_admin` nunca se concede desde la app |
| `consents` | inserta filas por capa (`terms`, `sensitive`, `research`), versión `2026-11-14` | solo se agregan filas |
| `circles`, `circle_members` | crea vía RPC `create_circle` | la creadora queda como `caregiver` |
| `care_templates`, `tips`, `resources` | contenido inicial por migración | lectura para usuarias con sesión |
| `reminders` | crea los de la plantilla (`source = 'template'`) | `rule` validada con `ruleSchema` |
| `events` | `track()` con seudónimo | sin texto libre |
| `private.rate_limits` | `rate_limit_hit` vía cliente admin | claves con HMAC |

## Contracts

**Consumed** — already exists, do not rebuild:

| De | Interfaz | Garantía |
|---|---|---|
| `01-preparacion` | `requireEnv`, `appUrl`, clientes de Supabase, helpers de prueba, `Button`, `Field`, `ChoiceGroup`, `Dialog` | ver épica 01 |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Exporta | Firma | La usan |
|---|---|---|
| `src/server/security/rate-limit.ts` → `checkRateLimit`, `RATE_LIMITS`, `hashKey` | `(scope, raw, limit, windowSeconds) => Promise<{ allowed: boolean }>` | 03 a 10 |
| `src/lib/auth/route-rules.ts` → `isPublicPath`, `safeNextPath` | `(path: string) => boolean` · `(next?: string \| null) => string` | proxy, rutas públicas |
| `src/server/consents/consents.ts` → `getConsentState`, `recordConsents`, `revokeResearch`, `CONSENT_VERSION` | ver `E2-T4` | 04 (cuenta), 10 (invitaciones) |
| `src/server/events/track.ts` → `track` | `(client, userId, name, props) => Promise<{ stored: boolean }>` | todas las épicas siguientes |
| `src/server/reminders/rule-schema.ts` → `ruleSchema`, `templateItemSchema` | zod | 03, 05 |
| `src/server/circles/circles.ts` → `createCircleWithTemplate`, `listMyCircles`, `resolveActiveCircle` | ver `E2-T7` | 03 en adelante |
| `tests/e2e/fixtures.ts` → `test` con `admin`, `newUser`, `login`, `expectNoAxeViolations` | Playwright | todas las pruebas e2e |

## Conventions that bite in this area

- Los Route Handlers aceptan `Authorization: Bearer <accessToken>` (así prueban las pruebas de base) además de la cookie de sesión.
- Ninguna casilla de consentimiento viene marcada; quitar el consentimiento de investigación no quita el acceso.
- El ingreso nunca revela si una cuenta existe.
- `(onboarding)` exige sesión; `(app)` exige sesión, consentimientos y al menos un círculo.
- No barrel files; imports con `@/` → `app/src/` (las e2e y `scripts/lib`, relativas).
- Resultados tipados `{ ok: true, data } | { ok: false, error: { code, message } }`; textos para personas en español de Chile.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/database.md`, `server.md`, `ui.md`, `tests.md`, `web.md`, `docs.md`. Both sit in the project root — the builder copied them there from the bundle's `workspace/` before task one.

## Catálogo de eventos (fuente para `catalog.ts` y `docs/eventos.md`)

| Evento | Cuándo se dispara | Propiedades | Hipótesis | Técnico |
|---|---|---|---|---|
| `app.opened` | al cargar una página de `(app)` una vez por sesión de navegador | `screen` (enum de rutas) | H1 | no |
| `screen.viewed` | al ver una pantalla de `(app)` | `screen` | H1, H2 | no |
| `flow.started` | al empezar un flujo medido | `flow` (`onboarding`, `reminder_create`, `journal`) | H2 | no |
| `flow.completed` | al terminarlo | `flow`, `duration_ms` (entero ≥ 0) | H2 | no |
| `flow.abandoned` | al salir sin terminar | `flow`, `step` (entero) | H2 | no |
| `app.error` | error mostrado a la usuaria | `code` (enum de códigos), `screen` | H2 | sí |
| `onboarding.completed` | círculo creado | `care_type`, `template_items` (entero) | H1, H6 | no |
| `reminder.created` | recordatorio creado | `kind`, `importance`, `source` | H1 | no |
| `occurrence.marked` | ítem marcado | `status`, `via`, `kind` | H1 | no |
| `journal.saved` | bitácora guardada | `duration_ms`, `has_note` (boolean) | H1, H2 | no |
| `selfcare.checked_in` | pregunta diaria respondida (sin el puntaje) | ninguna | H1 | no |
| `report.viewed` | informe abierto | `period` (`dia`, `semana`, `mes`) | H3 | no |
| `report.shared` | informe compartido | `format` (`png`, `pdf`) | H3 | no |
| `survey.answered` | microencuesta respondida o descartada | `survey` (`d3`, `d14`, `d28`, `d56`), `dismissed` (boolean) | H3 | no |
| `fake_door.viewed` | puerta falsa abierta | `door` | H4 | no |
| `fake_door.interest` | "Sí, avísame" o precio elegido | `door`, `choice` (enum de precios o `none`) | H4 | no |
| `premium.used` | función Premium usada | `feature` (`informe_medico`) | H4 | no |
| `push.permission` | respuesta al permiso de avisos | `result` (`granted`, `denied`, `default`) | H1 | no |
| `invitation.created` | invitación a familiar creada | ninguna | H5 | no |
| `cared_link.created` | vínculo de persona cuidada creado | ninguna | H5 | no |
| `account.deletion_requested` | pedido de borrado | ninguna | H1 | sí |

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do not re-rank by priority or by what looks quick.

### `E2-T1` — Probar el aislamiento por rol y los límites de frecuencia

**Depends on:** `E1-T2` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 9

Las políticas ya existen en las migraciones; este paso las prueba con usuarias reales a través de PostgREST (claves y JWT de verdad, nada simulado).
- `app/src/server/security/rate-limit.ts` — `hashKey(scope, raw)` = HMAC-SHA256 con `IP_HASH_SECRET` (nunca se guarda una IP ni un correo en claro); `checkRateLimit(scope, raw, limit, windowSeconds)` llama a la RPC `rate_limit_hit` con el cliente admin y devuelve `{ allowed: boolean }`; `RATE_LIMITS` = `login` 5/900 s (por correo), `login_ip` 300/900 s (por IP; holgado para que las pruebas e2e, que entran muchas veces desde 127.0.0.1, no choquen), `feedback` 10/3600 s, `emergency` 3/600 s, `invitation` 10/86400 s, `web_contact` 5/3600 s, `cared_done` 30/600 s, `push_test` 5/3600 s.
- Pruebas: cuidadoras A y B con su círculo (helpers de paso 2 (`supabase-local`)); F se agrega como `family` al círculo de A con el cliente admin (`insert` directo en `circle_members`); `anon` con la clave publicable sin sesión. Cada prueba crea sus usuarias con correos aleatorios: no hay estado compartido entre archivos.

**Files**
- `app/src/server/security/rate-limit.ts` — new
- `app/tests/db/rls-circles.test.ts` — new
- `app/tests/db/rls-private.test.ts` — new
- `app/tests/db/rate-limit.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/db/rls-circles.test.ts` runs with caregivers A and B **THE SYSTEM SHALL** return zero rows to B for every select on A's `circles`, `reminders`, `reminder_occurrences`, `journal_entries`, `tasks` and `contacts`, and SHALL reject B's insert of a reminder into A's circle with `42501`.
2. **WHEN** a `family` member of A's circle selects A's reminders **THE SYSTEM SHALL** return them, SHALL reject that member's reminder insert and delete with `42501`, and that member's update SHALL affect zero rows.
3. **WHEN** caregiver A updates `circle_members.role`, `reminders.circle_id`, `reminders.created_by` or `profiles.is_admin` **THE SYSTEM SHALL** reject each with `42501`.
4. **WHEN** `tests/db/rls-private.test.ts` runs **THE SYSTEM SHALL** return zero rows when anyone other than the owner selects `selfcare_checkins` or `push_subscriptions`, zero rows when a non-admin selects `events`, and SHALL reject any update to `consents` with `42501`.
5. **WHEN** `checkRateLimit` is called 4 times inside one window with limit 3 **THE SYSTEM SHALL** return `allowed: true` three times and `allowed: false` the fourth, while a different key stays allowed.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/rls-circles.test.ts
pnpm -C app test tests/db/rls-private.test.ts
pnpm -C app test tests/db/rate-limit.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T1: Probar el aislamiento por rol y los límites de frecuencia"
git tag step-09-rls-y-limites
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E2-T2` — Construir el ingreso con enlace mágico y contraseña

**Depends on:** `E1-T2`, `E1-T5`, `E2-T1` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 10

- `app/src/server/auth/login.ts` — lógica pura con dependencias inyectadas (`{ auth, rateLimit, appUrl }`) para poder probarla sin red: `requestMagicLink(deps, input)` y `passwordSignIn(deps, input)`. Entrada validada con zod (`email` recortado, en minúsculas, máx. 254; `captchaToken` opcional; `org` opcional `^[A-Za-z0-9-]{3,32}$`). El enlace usa `signInWithOtp({ email, options: { emailRedirectTo: appUrl + "/auth/confirm", shouldCreateUser: true, captchaToken, data: { org_code } } })`. Límites `login` (por hash de correo) y `login_ip` (por hash de IP).
- `app/src/app/(auth)/entrar/actions.ts` — `"use server"`; solo funciones async que arman las dependencias reales (cliente de servidor, `checkRateLimit`, `appUrl()`) y llaman a `login.ts`; además `signOut()`.
- `app/src/app/(auth)/entrar/page.tsx` — campo de correo y botón "Enviarme el enlace"; debajo, plegado, "Entrar con contraseña"; widget Turnstile (`@marsidev/react-turnstile`) solo si existe `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; campo oculto `org` desde `?org=`; mensajes con `role="alert"`/`aria-live`. Texto: "Te mandamos un enlace a tu correo. Ábrelo en este mismo teléfono."

**Files**
- `app/src/server/auth/login.ts` — new
- `app/src/app/(auth)/entrar/page.tsx` — new
- `app/src/app/(auth)/entrar/actions.ts` — new
- `app/tests/unit/auth-login.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `requestMagicLink` receives a valid email **THE SYSTEM SHALL** call `signInWithOtp` once with `emailRedirectTo` equal to `APP_URL + "/auth/confirm"`, `shouldCreateUser: true` and the uppercase `org_code` in `data`, and SHALL return `{ ok: true }`.
2. **WHEN** the email is malformed **THE SYSTEM SHALL** return `{ ok: false, error: { code: "validation_failed" } }` without calling Supabase.
3. **WHEN** the rate limiter refuses **THE SYSTEM SHALL** return `{ ok: false, error: { code: "rate_limited" } }` without calling Supabase.
4. **WHEN** `signInWithOtp` returns an error **THE SYSTEM SHALL** still return `{ ok: true }`, so the answer never reveals whether an account exists.
5. **WHEN** `passwordSignIn` gets a wrong password or an unknown email **THE SYSTEM SHALL** return the same `{ ok: false, error: { code: "invalid_credentials", message: "Correo o contraseña incorrectos." } }` in both cases.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/auth-login.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T2: Construir el ingreso con enlace mágico y contraseña"
git tag step-10-autenticacion-login
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E2-T3` — Proteger rutas, confirmar enlaces y fijar cookies seguras

**Depends on:** `E2-T2` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 11

- `app/src/lib/auth/route-rules.ts` — `isPublicPath(pathname)`: públicas `/`, `/entrar`, `/auth/*`, `/v/*`, `/invitar/*`, `/org/*`, `/~offline`, `/manifest.webmanifest`, `/sw.js`, `/swe-worker-*`, `/icons/*`, `/monitoring`, `/api/*` (cada API valida su propia sesión o secreto), `/_next/*`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`. `safeNextPath(next)` acepta solo rutas que empiezan con `/` y no con `//`; si no, `/hoy`.
- `app/src/proxy.ts` — Next 16 usa `proxy.ts` (no `middleware.ts`) y exporta `proxy`. Crea el cliente `@supabase/ssr` sobre la request/response (mismas opciones de cookie que `server.ts`), refresca la sesión con `auth.getUser()`, y si la ruta no es pública y no hay usuaria redirige a `/entrar?next=<ruta>`. `config.matcher` excluye estáticos de `_next`.
- `app/src/app/auth/confirm/route.ts` — `GET` con `token_hash` y `type`: `verifyOtp`; éxito → `safeNextPath(next)`; error → `/entrar?error=enlace`.
- `app/tests/e2e/auth.spec.ts` — crea la usuaria con contraseña usando `@supabase/supabase-js` admin dentro del spec (las variables llegan por `playwright.config.ts`).

**Files**
- `app/src/lib/auth/route-rules.ts` — new
- `app/src/proxy.ts` — new
- `app/src/app/auth/confirm/route.ts` — new
- `app/tests/unit/proxy-rules.test.ts` — new
- `app/tests/e2e/auth.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/proxy-rules.test.ts` runs **THE SYSTEM SHALL** classify `/`, `/entrar`, `/auth/confirm`, `/v/abc`, `/org/abc`, `/~offline`, `/manifest.webmanifest`, `/icons/192` and `/api/health` as public and `/hoy`, `/cuenta` and `/admin` as protected, and `safeNextPath` SHALL turn `//evil.example` and `https://evil.example` into `/hoy`.
2. **WHEN** an anonymous browser requests `/hoy` **THE SYSTEM SHALL** redirect to `/entrar?next=%2Fhoy`.
3. **WHEN** a user signs in with email and password on `/entrar` **THE SYSTEM SHALL** set a session cookie whose name starts with `sb-` and that is `HttpOnly` with `SameSite=Lax`.
4. **WHEN** `/auth/confirm` is requested with an invalid `token_hash` **THE SYSTEM SHALL** redirect to `/entrar?error=enlace`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/proxy-rules.test.ts
pnpm -C app test:e2e tests/e2e/auth.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T3: Proteger rutas, confirmar enlaces y fijar cookies seguras"
git tag step-11-autenticacion-sesion
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E2-T4` — Pedir los consentimientos por capas antes de guardar datos

**Depends on:** `E2-T3` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 12

- `app/src/server/consents/consents.ts` — `CONSENT_VERSION = "2026-11-14"`; `getConsentState(client, userId)` → `{ terms, sensitive, research }` según la última fila de cada capa; `recordConsents(client, userId, input)` con zod: `terms`, `sensitive`, `research` y dos declaraciones obligatorias `ageConfirmed` ("Tengo 18 años o más") y `authorizationDeclared` ("Cuento con la autorización de la persona que cuido o actúo en su interés; si es menor de edad, soy su madre, padre o tutor"). Sin las dos declaraciones, o sin `terms` y `sensitive`, devuelve `validation_failed` y no inserta nada. `revokeResearch(client, userId)` agrega `granted = false`.
- `app/src/app/(onboarding)/layout.tsx` — exige sesión (si no, `/entrar`); sin navegación.
- `app/src/app/(onboarding)/bienvenida/consentimientos/page.tsx` — tres capas explicadas en lenguaje simple: (1) términos y uso básico, (2) datos sensibles de rutina, ánimo y medicamentos, (3) investigación, opcional ("puedes usar Sole igual"). Ninguna casilla viene marcada. Enlaces a `https://solecuida.com/privacidad.html`, `terminos.html` y `cookies.html`. Server Action en línea que llama a `recordConsents` y redirige a `/bienvenida`.
- `app/src/app/(app)/layout.tsx` — exige sesión; sin consentimientos requeridos → `/bienvenida/consentimientos`; sin círculos → `/bienvenida`; actualiza `profiles.last_active_at` como máximo una vez por día; `metadata.robots = { index: false }`; navegación principal: Hoy, Calendario, Recordatorios, Tareas, Bitácora, Para ti, Informes, Contactos, Avisos, Cuenta y "Próximamente" (`/pronto`); botón "Salir" (acción `signOut`); `<main id="contenido">`. Las rutas que todavía no existen se construyen en pasos posteriores.

**Files**
- `app/src/server/consents/consents.ts` — new
- `app/src/app/(onboarding)/layout.tsx` — new
- `app/src/app/(onboarding)/bienvenida/consentimientos/page.tsx` — new
- `app/src/app/(app)/layout.tsx` — new
- `app/tests/db/consents.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `recordConsents` is called with `terms` and `sensitive` true and both declarations accepted **THE SYSTEM SHALL** insert one `consents` row per layer with version `2026-11-14`, and `getConsentState` SHALL report `{ terms: true, sensitive: true, research: false }` when research was not granted.
2. **WHEN** `recordConsents` is called with either declaration unchecked **THE SYSTEM SHALL** return `{ ok: false, error: { code: "validation_failed" } }` and insert no row.
3. **WHEN** a user without the required consents calls the RPC `create_circle` **THE SYSTEM SHALL** reject it with the message `consent_required`.
4. **WHEN** research consent is revoked with `revokeResearch` **THE SYSTEM SHALL** append a row with `granted = false`, `getConsentState` SHALL report `research: false`, and the earlier rows SHALL remain unchanged.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/consents.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T4: Pedir los consentimientos por capas antes de guardar datos"
git tag step-12-consentimientos
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E2-T5` — Crear el catálogo de eventos y su registro seudónimo

**Depends on:** `E2-T4` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 13

- `app/src/server/events/catalog.ts` — `EVENT_CATALOG` con exactamente los eventos de la tabla "Catálogo de eventos" de esta épica (nombre, cuándo se dispara, propiedades, hipótesis, técnico). Cada `props` es un `z.strictObject` con solo enums, números y booleanos: nunca texto libre.
- `app/src/server/events/track.ts` — `track(client, userId, name, props)`: valida con el catálogo; si la usuaria no dio consentimiento de investigación y el evento no es técnico, no guarda nada y devuelve `{ stored: false }`; si guarda, escribe `pseudonym_id`, `org_code` y `technical` leídos de su perfil, nunca el id ni el correo. Nunca lanza hacia quien la llama: un fallo devuelve `{ stored: false }`.
- `docs/eventos.md` — tabla `| Evento | Cuándo se dispara | Propiedades | Hipótesis | Técnico |` con las mismas filas.

**Files**
- `app/src/server/events/catalog.ts` — new
- `app/src/server/events/track.ts` — new
- `docs/eventos.md` — new
- `app/tests/unit/events-catalog.test.ts` — new
- `app/tests/db/events.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/events-catalog.test.ts` runs **THE SYSTEM SHALL** find every event of `EVENT_CATALOG` as a row of the table in `docs/eventos.md` and every row of that table in the catalog, each listing at least one hypothesis among H1 to H6.
2. **WHEN** a catalog schema parses props with an undeclared key or a string outside its enum **THE SYSTEM SHALL** reject them.
3. **WHEN** `track` is called for a non-technical event by a user without research consent **THE SYSTEM SHALL** insert nothing and return `{ stored: false }`, and for the technical event `app.error` SHALL insert one row.
4. **WHEN** `track` stores an event **THE SYSTEM SHALL** write the user's `pseudonym_id` and `org_code` and no column containing the user id or email.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/events-catalog.test.ts
pnpm -C app test tests/db/events.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T5: Crear el catálogo de eventos y su registro seudónimo"
git tag step-13-eventos-base
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E2-T6` — Cargar plantillas, consejos y recursos iniciales

**Depends on:** `E1-T2` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 14

Contenido redactado por el rol de Contenidos (brief §8): organización práctica, cálida, **sin consejo médico, dieta, líquidos ni dosis**. El fundador lo revisa y lo edita después desde F15.
- `app/src/server/reminders/rule-schema.ts` — `ruleSchema` (zod, unión discriminada por `freq`): `once` `{ date }`, `daily`, `weekly` `{ weekdays: 1..7 ISO, sin repetir }`, `interval` `{ everyDays: 2..365 }`, `monthly` `{ dayOfMonth: 1..31 }`, `yearly` `{ month: 1..12, day: 1..31 }`; todos con `times` (1 a 8 horas `HH:MM` distintas), `startDate` `YYYY-MM-DD` válida y `endDate` opcional ≥ `startDate`. `templateItemSchema` = `{ title, kind, importance, rule (ruleSchema sin startDate ni endDate), advanceDays: enteros 0..30, visibleToCared }`.
- La migración (archivo escrito a mano con ese nombre exacto) inserta: una fila de `care_templates` por cada valor de `care_type`, con 3 a 6 ítems válidos según `templateItemSchema`, salvo `desde_cero` con cero ítems. Ejemplo `dialisis`: "Sesión de diálisis" lun-mié-vie (`weekly`), "Preparar el bolso para la sesión" (día anterior), "Control mensual" (`monthly`, `appointment`, `advanceDays` [3,1,0]). Al menos 20 `tips` (al menos 5 de tipo `actividad`, con `activity_title`). Al menos 6 `resources` chilenos con `source_url` oficial `https://` y `verified_at` en null (por ejemplo SAMU 131, Salud Responde, Red Local de Apoyos y Cuidados, SENAMA, SENADIS); toda cifra o teléfono en la descripción lleva `[VERIFICAR]`.
- `app/tests/db/content.test.ts` — usa `Constants.public.Enums.care_type` de `database.types.ts`.

**Files**
- `app/supabase/migrations/20261114001000_contenido_inicial.sql` — new
- `app/src/server/reminders/rule-schema.ts` — new
- `app/tests/db/content.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `pnpm -C app db:reset` runs **THE SYSTEM SHALL** apply `supabase/migrations/20261114001000_contenido_inicial.sql` and exit 0.
2. **WHEN** `tests/db/content.test.ts` runs **THE SYSTEM SHALL** find one `care_templates` row for every value of `Constants.public.Enums.care_type`, the `desde_cero` row with zero items and every other row with between 3 and 6 items that parse with `templateItemSchema`.
3. **WHEN** the test reads `tips` **THE SYSTEM SHALL** find at least 20 active rows, at least 5 of kind `actividad`, and none containing the words `dosis`, `mg`, `diagnóstico` or `dieta`.
4. **WHEN** the test reads the `resources` created by the migration (every row except the local seed row `Recurso de prueba (solo local)`) **THE SYSTEM SHALL** find each with an `https://` `source_url` and `verified_at` null.
5. **WHEN** `ruleSchema` parses `{ freq: "weekly", weekdays: [8], times: ["25:00"], startDate: "2026-02-30" }` **THE SYSTEM SHALL** reject it with issues on `weekdays`, `times` and `startDate`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app db:reset
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/content.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T6: Cargar plantillas, consejos y recursos iniciales"
git tag step-14-contenido-inicial
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E2-T7` — Crear la persona cuidada desde una plantilla (F1)

**Depends on:** `E2-T4`, `E2-T5`, `E2-T6` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 15

- `app/src/server/circles/circles.ts` — `createCircleWithTemplate(client, userId, input)`: zod (`displayName` 1–60, `caredName` 1–60, `relation` 1–40, `careType`); llama a la RPC `create_circle`, lee la plantilla del tipo y crea un recordatorio por ítem (`source = 'template'`, `startDate` = hoy en `America/Santiago`, `created_by` = usuaria); guarda `display_name` y `onboarding_completed_at` en su perfil; registra `flow.completed` (`flow: "onboarding"`) con `track`. También `listMyCircles(client)` y `resolveActiveCircle(client, requestedId)` (el pedido si es miembro; si no, el primero).
- `app/src/app/(onboarding)/bienvenida/page.tsx` — exige consentimientos (si faltan → `/bienvenida/consentimientos`); un solo formulario: tu nombre, nombre o apodo de la persona, relación (atajos "mi mamá", "mi papá", "mi hijo", "mi hija", "mi pareja", u "otra"), tipo de cuidado, y vista previa de lo que la plantilla carga ("todo se puede editar"). Server Action en línea → `/hoy?bienvenida=1`.
- `care-type-picker.tsx` (cliente) — `ChoiceGroup` con los 9 tipos y una línea de descripción cada uno.
- `install-guide.tsx` — instrucciones separadas "Android con Chrome" e "iPhone con Safari" (Compartir → "Agregar a inicio"; en iPhone los avisos funcionan solo con la app instalada, iOS 16.4 o superior). No pide permiso de notificaciones.

**Files**
- `app/src/server/circles/circles.ts` — new
- `app/src/app/(onboarding)/bienvenida/page.tsx` — new
- `app/src/components/onboarding/care-type-picker.tsx` — new
- `app/src/components/onboarding/install-guide.tsx` — new
- `app/tests/db/create-circle.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `createCircleWithTemplate` runs for a consented user with care type `dialisis` **THE SYSTEM SHALL** create one circle, one `caregiver` membership for that user and one `reminders` row per item of the `dialisis` template with `source = 'template'` and `rule.startDate` equal to today in `America/Santiago`.
2. **WHEN** it runs with care type `desde_cero` **THE SYSTEM SHALL** create the circle and zero reminders.
3. **WHEN** the cared name is empty or longer than 60 characters **THE SYSTEM SHALL** return `{ ok: false, error: { code: "validation_failed" } }` and create nothing.
4. **WHEN** the same caregiver creates a second circle **THE SYSTEM SHALL** succeed, and `listMyCircles` SHALL return both.
5. **WHEN** creation succeeds for a user with research consent **THE SYSTEM SHALL** store one `flow.completed` event with `flow = "onboarding"`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/create-circle.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T7: Crear la persona cuidada desde una plantilla (F1)"
git tag step-15-bienvenida-f1
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E2-T8` — Probar la bienvenida completa y el origen por organización

**Depends on:** `E2-T7` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 16

- `app/tests/e2e/fixtures.ts` — `test.extend` con `admin` (cliente admin), `newUser({ consents?, circle? })` (crea con contraseña vía admin), `login(page, user)` (formulario de contraseña de `/entrar`) y `expectNoAxeViolations(page)` (`AxeBuilder` con tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`; espera `violations` vacío). Las pruebas e2e importan solo con rutas relativas.
- `app/src/app/(app)/hoy/page.tsx` — versión mínima: saludo "Hola, <nombre>", nombre de la persona cuidada y, con `?bienvenida=1`, la guía de instalación. paso 25 (`hoy`) la reemplaza.
- `app/src/app/page.tsx` — completa la portada mínima de paso 4 (`tokens-diseno`): qué es Sole en tres frases, botón "Entrar" hacia `/entrar` conservando `?org=`, enlace a `https://solecuida.com`.
- `app/tests/db/org-attribution.test.ts` — crea usuarias con `user_metadata.org_code`.

**Files**
- `app/tests/e2e/fixtures.ts` — new
- `app/tests/e2e/onboarding.spec.ts` — new
- `app/src/app/(app)/hoy/page.tsx` — new
- `app/src/app/page.tsx` — edit
- `app/tests/db/org-attribution.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a new user without consents signs in **THE SYSTEM SHALL** redirect any `(app)` route to `/bienvenida/consentimientos`, where every checkbox starts unchecked.
2. **WHEN** the consent form is submitted without the age and authorization declarations **THE SYSTEM SHALL** show an error inside an element with `role="alert"` and stay on the page.
3. **WHEN** the user completes the consents and the welcome form with care type `adulto_mayor` **THE SYSTEM SHALL** land on `/hoy` showing the cared person's name and the install guide with separate "Android con Chrome" and "iPhone con Safari" instructions.
4. **WHEN** axe runs on `/`, `/entrar`, `/bienvenida/consentimientos`, `/bienvenida` and `/hoy` with the tags wcag2a, wcag2aa, wcag21a, wcag21aa and wcag22aa **THE SYSTEM SHALL** report 0 violations.
5. **WHEN** a user is created with `org_code` metadata `demo-local` **THE SYSTEM SHALL** store `DEMO-LOCAL` in `profiles.org_code`, and an unknown code SHALL be stored as null.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/org-attribution.test.ts
pnpm -C app test:e2e tests/e2e/onboarding.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T8: Probar la bienvenida completa y el origen por organización"
git tag step-16-e2e-bienvenida
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `pnpm -C app test` runs at the end of this epic **THE SYSTEM SHALL** exit 0, including the RLS isolation suites `tests/db/rls-circles.test.ts` and `tests/db/rls-private.test.ts`.
2. **WHEN** `tests/e2e/onboarding.spec.ts` runs **THE SYSTEM SHALL** take a new user from sign-in through consents and the welcome form to `/hoy` with 0 axe violations on every page it visits.

```bash
pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test
pnpm -C app test:e2e tests/e2e/onboarding.spec.ts
```

Run from the project root. Both criteria are decided by these commands.

## Pitfalls

- **Recursión de RLS**: una política que consulta `circle_members` directamente se llama a sí misma; usa siempre `private.is_member` y compañía.
- **`supabase.auth.getSession()` en el servidor no valida el JWT**: usa `getUser()`.
- **El enlace mágico debe abrirse en el mismo teléfono**: la plantilla usa `token_hash` y `verifyOtp`, que funciona aunque se abra en otro navegador; no cambies a `exchangeCodeForSession`.
- **Plantillas = organización práctica**: si un ítem suena a indicación médica, se reescribe.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `git tag -l 'step-*'` lists `step-09-rls-y-limites`, `step-10-autenticacion-login`, `step-11-autenticacion-sesion`, `step-12-consentimientos`, `step-13-eventos-base`, `step-14-contenido-inicial`, `step-15-bienvenida-f1`, `step-16-e2e-bienvenida`.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `app/.env.example` updated if this epic added a variable.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
- [ ] Si esta épica cierra una fase del brief: resumen corto al fundador (qué funciona, cómo probarlo, qué se decidió en `DECISIONES.md`, qué necesita) y `PENDIENTES.md` al día.
