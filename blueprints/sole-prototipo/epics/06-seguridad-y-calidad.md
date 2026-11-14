# Epic 06: Seguridad y calidad

> La app tiene CSP con nonce y cabeceras de seguridad, Sentry con datos filtrados, producción limpia, accesibilidad y teclado probados en todas las páginas P1, y la evidencia de la sección 6 del brief documentada.

| | |
|---|---|
| **Epic id** | `06-seguridad-y-calidad` |
| **Tasks** | `E6-T1` … `E6-T6` (pasos 43–48 de `blueprint.md` §9) |
| **Fase del brief** | Fase 4 del brief. |
| **Depends on** | 05-informes-y-escucha |
| **Unlocks** | 07-despliegue |
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
app/src/lib/security/headers.ts                              # NUEVO en E6-T1
app/src/proxy.ts                                             # existe — se edita en E6-T1
app/next.config.ts                                           # existe — se edita en E6-T1
app/tests/unit/security-headers.test.ts                      # NUEVO en E6-T1
app/tests/e2e/security-headers.spec.ts                       # NUEVO en E6-T1
app/src/lib/observability/scrub.ts                           # NUEVO en E6-T2
app/src/instrumentation.ts                                   # NUEVO en E6-T2
app/src/instrumentation-client.ts                            # NUEVO en E6-T2
app/tests/unit/scrub.test.ts                                 # NUEVO en E6-T2
app/src/app/error.tsx                                        # NUEVO en E6-T3
app/src/app/global-error.tsx                                 # NUEVO en E6-T3
app/src/app/not-found.tsx                                    # NUEVO en E6-T3
app/tests/unit/production-hygiene.test.tsx                   # NUEVO en E6-T3
app/scripts/check-bundle-secrets.ts                          # NUEVO en E6-T3
app/tests/e2e/a11y.spec.ts                                   # NUEVO en E6-T4
app/tests/e2e/keyboard.spec.ts                               # NUEVO en E6-T4
app/tests/e2e/p1-flows.spec.ts                               # NUEVO en E6-T4
docs/seguridad/checklist-6.2.md                              # NUEVO en E6-T5
docs/seguridad/asvs-checklist.md                             # NUEVO en E6-T5
docs/seguridad/owasp-top10.md                                # NUEVO en E6-T5
docs/seguridad/iso27001-anexo-a.md                           # NUEVO en E6-T5
app/tests/unit/docs-seguridad.test.ts                        # NUEVO en E6-T5
docs/seguridad/modelo-amenazas.md                            # NUEVO en E6-T6
docs/seguridad/plan-incidentes.md                            # NUEVO en E6-T6
docs/legal/registro-actividades.md                           # NUEVO en E6-T6
docs/legal/eipd.md                                           # NUEVO en E6-T6
```

Everything outside this subtree is out of scope (leer otros archivos está bien; modificarlos no). If a task seems to require editing a file not listed here, stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entidad | Qué toca esta épica | Notas |
|---|---|---|
| ninguna nueva | — | esta épica endurece y documenta |

## Contracts

**Consumed** — already exists, do not rebuild:

| De | Interfaz | Garantía |
|---|---|---|
| todas las anteriores | rutas y páginas P1 | ver épicas 01 a 05 |
| `05-informes-y-escucha` | `tests/support/totp.ts` para entrar a `/admin` en la prueba de accesibilidad | |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Exporta | Firma | La usan |
|---|---|---|
| `src/lib/security/headers.ts` → `buildCsp`, `STATIC_SECURITY_HEADERS` | `(nonce: string, opts: { dev: boolean }) => string` | proxy, `next.config.ts` |
| `src/lib/observability/scrub.ts` → `scrubEvent`, `scrubBreadcrumb`, `buildSentryOptions` | | instrumentación |
| `docs/seguridad/*`, `docs/legal/registro-actividades.md`, `docs/legal/eipd.md` | documentos | fundador, lista de lanzamiento |

## Conventions that bite in this area

- Si una prueba de accesibilidad falla, se arregla la página, nunca la prueba.
- La evidencia de seguridad cita rutas reales del repo; lo que solo se comprueba en producción va a la lista de lanzamiento.
- No barrel files; imports con `@/` → `app/src/` (las e2e y `scripts/lib`, relativas).
- Resultados tipados `{ ok: true, data } | { ok: false, error: { code, message } }`; textos para personas en español de Chile.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/database.md`, `server.md`, `ui.md`, `tests.md`, `web.md`, `docs.md`. Both sit in the project root — the builder copied them there from the bundle's `workspace/` before task one.

## Evidencia de la sección 6.2 (fuente para `checklist-6.2.md`)

| # | Evidencia |
|---|---|
| 1 | `app/tests/unit/production-hygiene.test.tsx`, `app/scripts/check-bundle-secrets.ts` |
| 2 | `.gitleaks.toml`, `.githooks/pre-commit`, `.github/workflows/ci.yml` (job `gitleaks` con historial completo), raíz `.gitignore` |
| 3 | Lista de lanzamiento: planes gratuitos sin tarjeta o con tope de gasto en cero |
| 4 | `app/tests/db/rls-circles.test.ts`, `app/tests/db/rls-private.test.ts`, `app/supabase/tests/database.test.sql` |
| 5 | `app/src/proxy.ts`, `app/src/lib/auth/route-rules.ts`, `app/tests/e2e/auth.spec.ts` |
| 6 | `app/supabase/migrations/20261114000100_base.sql` (grants por columna), `app/tests/db/rls-circles.test.ts` |
| 7 | `app/supabase/tests/database.test.sql`, `app/tests/db/admin-access.test.ts` |
| 8 | `app/src/server/admin/guard.ts`, `app/tests/db/admin-access.test.ts` |
| 9 | `app/src/server/cared-link/links.ts`, `app/tests/db/cared-link.test.ts` |
| 10 | `app/src/lib/supabase/server.ts`, `app/tests/e2e/auth.spec.ts`, `app/supabase/config.toml` |
| 11 | `app/supabase/config.toml` (largo mínimo y requisitos); Lista de lanzamiento: protección de contraseñas filtradas si el plan lo permite |
| 12 | `app/src/server/security/rate-limit.ts`, `app/tests/db/rate-limit.test.ts` |
| 13 | `app/src/app/(auth)/entrar/page.tsx`, `app/src/app/api/web/contact/route.ts` (en la épica 09; mientras tanto "Lista de lanzamiento: captcha de Supabase Auth") |
| 14 | `app/src/server/reminders/rule-schema.ts`, migraciones con `check` |
| 15 | `app/supabase/migrations/20261114000200_cuidado.sql` (RPC sin SQL dinámico) |
| 16 | `app/tests/unit/production-hygiene.test.tsx` |
| 17 | `app/supabase/config.toml` (`[storage] enabled = false`) |
| 18 | `app/supabase/config.toml` (`max_rows = 1000`) |
| 19 | `app/src/app/error.tsx`, `app/tests/unit/scrub.test.ts` |
| 20 | `app/src/lib/security/headers.ts` (HSTS) |
| 21 | `app/tests/e2e/security-headers.spec.ts` |
| 22 | `app/tests/e2e/security-headers.spec.ts` (sin `access-control-allow-origin`) |
| 23 | `app/src/lib/crypto/field.ts`, `app/tests/unit/field-crypto.test.ts` |
| 24 | `.github/dependabot.yml`, `.github/workflows/ci.yml` (job `audit`), `app/pnpm-lock.yaml` |
| 25 | `.github/workflows/ci.yml` (job `semgrep`) |
| 26 | Lista de lanzamiento: ZAP baseline contra producción (`.github/workflows/zap.yml`, en la épica 07) |
| 27 | Lista de lanzamiento: Security y Performance Advisors de Supabase sin hallazgos críticos |
| 28 | Lista de lanzamiento: respaldo nocturno cifrado y simulacro de restauración (`.github/workflows/backup.yml`, en la épica 07) |
| 29 | `app/tests/unit/production-hygiene.test.tsx`, `app/tests/unit/scrub.test.ts` |
| 30 | `app/src/server/admin/guard.ts` (`admin_audit_log`) |

Al escribir la tabla, cita solo rutas que ya existen en el repo; si una ruta de la columna llega en una épica posterior, escribe "Lista de lanzamiento:" con el ítem correspondiente.

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do not re-rank by priority or by what looks quick.

### `E6-T1` — Aplicar CSP con nonce y cabeceras de seguridad

**Depends on:** `E5-T8` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 43

- `app/src/lib/security/headers.ts` — `buildCsp(nonce, { dev })`: `default-src 'self'; script-src 'self' 'nonce-<n>' 'strict-dynamic' https://challenges.cloudflare.com` (más `'unsafe-eval'` solo si `dev`); `style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src https://challenges.cloudflare.com; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests`. `STATIC_SECURITY_HEADERS`: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: DENY`. El navegador nunca habla con Supabase (todo pasa por el servidor) y Sentry usa el túnel `/monitoring`, por eso `connect-src 'self'` basta.
- `app/src/proxy.ts` — genera un nonce por request (`crypto.randomUUID()` en base64), lo pasa en el header de request `x-nonce` y fija `content-security-policy` en la respuesta.
- `app/next.config.ts` — `headers()` aplica `STATIC_SECURITY_HEADERS` a `/:path*`.
- Ninguna ruta agrega `access-control-allow-origin`; la única API pensada para otro origen (formulario de la web) define su lista explícita en paso 63 (`web-contacto`).

**Files**
- `app/src/lib/security/headers.ts` — new
- `app/src/proxy.ts` — edit
- `app/next.config.ts` — edit
- `app/tests/unit/security-headers.test.ts` — new
- `app/tests/e2e/security-headers.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `buildCsp("abc", { dev: false })` runs **THE SYSTEM SHALL** return a policy containing `default-src 'self'`, `script-src 'self' 'nonce-abc' 'strict-dynamic' https://challenges.cloudflare.com`, `frame-ancestors 'none'`, `object-src 'none'` and `base-uri 'self'`, and not containing `unsafe-eval`.
2. **WHEN** the production build serves `/entrar` **THE SYSTEM SHALL** send `content-security-policy` with a nonce, `strict-transport-security: max-age=63072000; includeSubDomains; preload`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=()` and `x-frame-options: DENY`.
3. **WHEN** `/entrar` is requested twice **THE SYSTEM SHALL** return two different nonces.
4. **WHEN** `/`, `/entrar` and `/hoy` render in the browser **THE SYSTEM SHALL** log no CSP violation in the console.
5. **WHEN** `/api/health` is requested with `Origin: https://evil.example` **THE SYSTEM SHALL** not send `access-control-allow-origin`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/security-headers.test.ts
pnpm -C app test:e2e tests/e2e/security-headers.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E6-T1: Aplicar CSP con nonce y cabeceras de seguridad"
git tag step-43-cabeceras-csp
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E6-T2` — Capturar errores en Sentry con datos personales filtrados

**Depends on:** `E6-T1` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 44

- `app/src/lib/observability/scrub.ts` — sin importar `@sentry/nextjs` en tiempo de ejecución (solo `import type`). `scrubEvent(event)`: `user` queda solo con `id` (el seudónimo si existe), sin `email` ni `ip_address`; borra `request.cookies`, `request.data` y `request.headers` salvo `user-agent`; en mensajes, excepciones y migas reemplaza correos y teléfonos (secuencias de 8 o más dígitos con espacios, `+` o guiones) por `[filtrado]`; en URLs reemplaza el valor de `token_hash`, `token`, `code`, `email` y `next` por `[filtrado]`. `scrubBreadcrumb(b)` igual. `buildSentryOptions(dsn)` → `{ enabled: Boolean(dsn), dsn, sendDefaultPii: false, tracesSampleRate: 0.1, beforeSend: scrubEvent, beforeBreadcrumb: scrubBreadcrumb }`.
- `app/src/instrumentation.ts` — `register()` inicia Sentry en `nodejs` y `edge` con `buildSentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN)`; `onRequestError` de Sentry.
- `app/src/instrumentation-client.ts` — `Sentry.init(buildSentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN))`.
- `app/next.config.ts` — envuelve con `withSentryConfig` (`silent: true`, `tunnelRoute: "/monitoring"`, mapas de código fuente subidos solo cuando existe `SENTRY_AUTH_TOKEN` y borrados después de subir; nunca se publican). Sin DSN, Sentry queda apagado.

**Files**
- `app/src/lib/observability/scrub.ts` — new
- `app/src/instrumentation.ts` — new
- `app/src/instrumentation-client.ts` — new
- `app/next.config.ts` — edit
- `app/tests/unit/scrub.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `scrubEvent` receives an event with `user.email`, `user.ip_address`, `request.cookies`, `request.data`, a breadcrumb message containing `ana@example.cl` and `+56 9 1234 5678`, and a URL with `token_hash=abc` **THE SYSTEM SHALL** return it with no email, IP, cookies or request data, with both values in the message replaced by `[filtrado]` and the URL showing `token_hash=[filtrado]`.
2. **WHEN** `buildSentryOptions("")` runs **THE SYSTEM SHALL** return `enabled: false`, and with a DSN SHALL return `enabled: true` and `sendDefaultPii: false`.
3. **WHEN** `pnpm -C app build` runs without `SENTRY_AUTH_TOKEN` **THE SYSTEM SHALL** exit 0 and leave no `.map` file under `app/.next/static`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/scrub.test.ts
pnpm -C app build
test -d app/.next/static
test -z "$(find app/.next/static -name '*.map' -print -quit)"
```

**Checkpoint**

```bash
git add -A && git commit -m "E6-T2: Capturar errores en Sentry con datos personales filtrados"
git tag step-44-sentry
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E6-T3` — Dejar producción limpia y sin secretos en el bundle

**Depends on:** `E6-T2` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 45

- `error.tsx` y `global-error.tsx` — "Algo salió mal. Ya nos llegó el aviso." y botón "Intentar de nuevo"; nunca muestran `error.message` ni la traza (Sentry las recibe filtradas). `global-error.tsx` llama a `Sentry.captureException`.
- `not-found.tsx` — "No encontramos esta página." con enlace a `/hoy`.
- `production-hygiene.test.tsx` — primera línea `// @vitest-environment jsdom`; recorre `src/` con `node:fs` y renderiza `error.tsx`.
- `app/scripts/check-bundle-secrets.ts` — `loadLocalEnv()`; lee los valores de `SUPABASE_SECRET_KEY`, `FIELD_ENCRYPTION_KEY`, `CRON_SECRET`, `VAPID_PRIVATE_KEY` e `IP_HASH_SECRET` y busca cada uno en todos los archivos de `.next/static`; si encuentra alguno imprime el archivo (nunca el valor) y sale con 1; si no, sale con 0.

**Files**
- `app/src/app/error.tsx` — new
- `app/src/app/global-error.tsx` — new
- `app/src/app/not-found.tsx` — new
- `app/tests/unit/production-hygiene.test.tsx` — new
- `app/scripts/check-bundle-secrets.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/production-hygiene.test.tsx` scans `src/` **THE SYSTEM SHALL** find no `console.log`, no `dangerouslySetInnerHTML`, no `eval(`, no route folder named `debug`, `test` or `dev` under `src/app`, and no `NEXT_PUBLIC_` variable other than `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `NEXT_PUBLIC_SENTRY_DSN`.
2. **WHEN** the same test renders `error.tsx` with an error whose message is "detalle interno" **THE SYSTEM SHALL** show "Algo salió mal. Ya nos llegó el aviso." and not the text "detalle interno".
3. **WHEN** `scripts/check-bundle-secrets.ts` runs after `pnpm -C app build` **THE SYSTEM SHALL** find none of the values of `SUPABASE_SECRET_KEY`, `FIELD_ENCRYPTION_KEY`, `CRON_SECRET`, `VAPID_PRIVATE_KEY` and `IP_HASH_SECRET` under `.next/static` and exit 0.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/production-hygiene.test.tsx
pnpm -C app build
pnpm -C app exec tsx scripts/check-bundle-secrets.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E6-T3: Dejar producción limpia y sin secretos en el bundle"
git tag step-45-produccion-limpia
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E6-T4` — Probar accesibilidad, teclado y el día completo P1

**Depends on:** `E6-T3` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 46

- `a11y.spec.ts` — recorre `/`, `/entrar`, `/bienvenida/consentimientos`, `/bienvenida`, `/hoy`, `/recordatorios`, `/recordatorios/editar`, `/calendario`, `/bitacora`, `/para-ti`, `/informes`, `/cuenta`, `/avisos`, `/pronto` y `/admin` (como admin `aal2`), en claro y en oscuro (`page.emulateMedia({ colorScheme: "dark" })`), con `expectNoAxeViolations`. Si una página falla, se arregla la página, nunca la prueba.
- `keyboard.spec.ts` — Tab desde el inicio de `/hoy`; formulario de recordatorio completo solo con teclado.
- `p1-flows.spec.ts` — un día completo y la prueba de 320 px.

**Files**
- `app/tests/e2e/a11y.spec.ts` — new
- `app/tests/e2e/keyboard.spec.ts` — new
- `app/tests/e2e/p1-flows.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/e2e/a11y.spec.ts` visits every page in its list in light and in dark color schemes **THE SYSTEM SHALL** report 0 axe violations for the tags wcag2a, wcag2aa, wcag21a, wcag21aa and wcag22aa.
2. **WHEN** `tests/e2e/keyboard.spec.ts` presses Tab from the top of `/hoy` **THE SYSTEM SHALL** first focus the link "Saltar al contenido" and then reach the "Hecho" button of the first item, with a computed `outline-style` other than `none` on the focused element.
3. **WHEN** the reminder form is completed with the keyboard alone **THE SYSTEM SHALL** create the reminder.
4. **WHEN** `tests/e2e/p1-flows.spec.ts` opens `/hoy`, `/recordatorios/editar` and `/bitacora` at a 320 px wide viewport **THE SYSTEM SHALL** have `document.documentElement.scrollWidth` no greater than 320.
5. **WHEN** the full P1 day runs (create a reminder, see it on `/hoy`, mark it done, write the journal, answer the check-in, open the weekly report) **THE SYSTEM SHALL** show the item as done on `/hoy` and counted on `/informes?periodo=semana`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test:e2e tests/e2e/a11y.spec.ts
pnpm -C app test:e2e tests/e2e/keyboard.spec.ts
pnpm -C app test:e2e tests/e2e/p1-flows.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E6-T4: Probar accesibilidad, teclado y el día completo P1"
git tag step-46-e2e-p1-accesibilidad
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E6-T5` — Documentar la evidencia de la lista de seguridad (6.2)

**Depends on:** `E6-T4` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 47

- `checklist-6.2.md` — tabla `| # | Requisito | Estado | Evidencia |` con los 30 puntos de la sección 6.2 del brief. `Estado` ∈ `Cumple`, `Lista de lanzamiento`. `Evidencia` nombra entre comillas invertidas una ruta del repo que existe (prueba, migración, config, workflow) o dice "Lista de lanzamiento: <ítem>" para lo que solo se puede comprobar en producción (ZAP, advisors de Supabase, tope de gasto, respaldo restaurado). La tabla "Evidencia de la sección 6.2" de esta épica da la ruta de cada punto.
- `asvs-checklist.md` — tabla `| Requisito ASVS 5.0 | Nivel | Estado | Evidencia |`, `Estado` ∈ `Cumple`, `No aplica`, `Pendiente`; cubre al menos los capítulos de autenticación, sesión, control de acceso, validación, criptografía almacenada, manejo de errores, protección de datos y configuración.
- `owasp-top10.md` — una sección `## A01` … `## A10` (edición vigente `[VERIFICAR edición]`) con la prueba o el control que la cubre.
- `iso27001-anexo-a.md` — tabla `| Control | Aplica | Cómo se cumple | Evidencia |`.
- `docs-seguridad.test.ts` — verifica que cada ruta citada exista (`fs.existsSync` desde la raíz del repo).

**Files**
- `docs/seguridad/checklist-6.2.md` — new
- `docs/seguridad/asvs-checklist.md` — new
- `docs/seguridad/owasp-top10.md` — new
- `docs/seguridad/iso27001-anexo-a.md` — new
- `app/tests/unit/docs-seguridad.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/docs-seguridad.test.ts` reads `docs/seguridad/checklist-6.2.md` **THE SYSTEM SHALL** find each item number from 1 to 30 exactly once, each with a non-empty `Evidencia` cell that names an existing repository path or starts with "Lista de lanzamiento:".
2. **WHEN** it reads `docs/seguridad/asvs-checklist.md` **THE SYSTEM SHALL** find every row's status in `Cumple`, `No aplica` or `Pendiente`, and every `Cumple` row with non-empty evidence.
3. **WHEN** it reads `docs/seguridad/owasp-top10.md` **THE SYSTEM SHALL** find the headings `## A01` to `## A10`, each followed by at least one existing repository path.
4. **WHEN** it reads `docs/seguridad/iso27001-anexo-a.md` **THE SYSTEM SHALL** find the header `| Control | Aplica | Cómo se cumple | Evidencia |` and at least one data row.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test tests/unit/docs-seguridad.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E6-T5: Documentar la evidencia de la lista de seguridad (6.2)"
git tag step-47-evidencia-seguridad
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E6-T6` — Escribir el modelo de amenazas y la privacidad

**Depends on:** `E6-T5` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 48

- `modelo-amenazas.md` — tabla STRIDE `| Activo | Amenaza | Categoría STRIDE | Control | Evidencia |` que cubre al menos: sesiones, bitácora y medicamentos (datos sensibles), enlace de la persona cuidada, botón de emergencia, rutas de cron, panel de administración y respaldos.
- `plan-incidentes.md` — `## Detección`, `## Contención`, `## Notificación` (a las personas afectadas y a la autoridad según la Ley 21.719, plazos `[VERIFICAR]`), `## Recuperación`, `## Lecciones`; responsable: el fundador, `hola@solecuida.com`.
- `docs/legal/registro-actividades.md` — por cada tratamiento: finalidad, base de licitud, categorías de datos, destinatarios (Supabase, Vercel, Sentry, Resend, Cloudflare; Zoho solo para el correo `hola@`), transferencia internacional (país `[VERIFICAR]`), plazo de conservación (borrado a pedido con 7 días de gracia; 12 meses de inactividad con aviso previo).
- `docs/legal/eipd.md` — evaluación de impacto simplificada: `| Riesgo | Probabilidad | Impacto | Medida |`.
- `docs-seguridad.test.ts` — agrega estas comprobaciones.

**Files**
- `docs/seguridad/modelo-amenazas.md` — new
- `docs/seguridad/plan-incidentes.md` — new
- `docs/legal/registro-actividades.md` — new
- `docs/legal/eipd.md` — new
- `app/tests/unit/docs-seguridad.test.ts` — edit

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/docs-seguridad.test.ts` reads `docs/seguridad/modelo-amenazas.md` **THE SYSTEM SHALL** find rows for the assets sesiones, bitácora, medicamentos, enlace de la persona cuidada, botón de emergencia, cron, panel de administración and respaldos.
2. **WHEN** it reads `docs/seguridad/plan-incidentes.md` **THE SYSTEM SHALL** find the headings `## Detección`, `## Contención`, `## Notificación`, `## Recuperación` and `## Lecciones`.
3. **WHEN** it reads `docs/legal/registro-actividades.md` **THE SYSTEM SHALL** find Supabase, Vercel, Sentry, Resend and Cloudflare as recipients and the words "transferencia internacional".
4. **WHEN** it reads `docs/legal/eipd.md` **THE SYSTEM SHALL** find the header `| Riesgo | Probabilidad | Impacto | Medida |`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test tests/unit/docs-seguridad.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E6-T6: Escribir el modelo de amenazas y la privacidad"
git tag step-48-amenazas-y-privacidad
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `pnpm -C app test` runs at the end of this epic **THE SYSTEM SHALL** exit 0 with `security-headers`, `scrub`, `production-hygiene` and `docs-seguridad` passing.
2. **WHEN** `tests/e2e/a11y.spec.ts` runs **THE SYSTEM SHALL** report 0 axe violations on every P1 page in light and dark.

```bash
pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test
pnpm -C app test:e2e tests/e2e/a11y.spec.ts
pnpm -C app test:e2e tests/e2e/security-headers.spec.ts
```

Run from the project root. Both criteria are decided by these commands.

## Pitfalls

- **CSP con nonce obliga a render dinámico**: está bien (toda la app es por sesión); no la "arregles" con `'unsafe-inline'` en `script-src`.
- **Turnstile carga desde `challenges.cloudflare.com`**: va en `script-src` y `frame-src`.
- **Sentry sin DSN queda apagado**: el build no debe fallar por eso.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `git tag -l 'step-*'` lists `step-43-cabeceras-csp`, `step-44-sentry`, `step-45-produccion-limpia`, `step-46-e2e-p1-accesibilidad`, `step-47-evidencia-seguridad`, `step-48-amenazas-y-privacidad`.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `app/.env.example` updated if this epic added a variable.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
- [ ] Si esta épica cierra una fase del brief: resumen corto al fundador (qué funciona, cómo probarlo, qué se decidió en `DECISIONES.md`, qué necesita) y `PENDIENTES.md` al día.
