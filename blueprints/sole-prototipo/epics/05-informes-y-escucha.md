# Epic 05: Informes y escucha

> La cuidadora ve sus resúmenes, hitos y los comparte; Sole escucha con un botón permanente, microencuestas y puertas falsas; el fundador tiene su panel con MFA, métricas H1–H6, gestión de contenido y vigilancia de límites.

| | |
|---|---|
| **Epic id** | `05-informes-y-escucha` |
| **Tasks** | `E5-T1` … `E5-T9` (pasos 34–42 de `blueprint.md` §9) |
| **Fase del brief** | Fase 3 del brief (F7, F10, F11, F15 y catálogo de eventos en uso). |
| **Depends on** | 04-dia-a-dia |
| **Unlocks** | 06-seguridad-y-calidad |
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
app/src/server/reports/summary.ts                            # NUEVO en E5-T1
app/src/server/reports/milestones.ts                         # NUEVO en E5-T1
app/tests/unit/reports.test.ts                               # NUEVO en E5-T1
app/src/app/(app)/informes/page.tsx                          # NUEVO en E5-T1
app/src/components/reports/compliance-chart.tsx              # NUEVO en E5-T1
app/src/components/reports/share-report.tsx                  # NUEVO en E5-T2
app/src/app/(app)/informes/imprimir/page.tsx                 # NUEVO en E5-T2
app/tests/e2e/reports.spec.ts                                # NUEVO en E5-T2
app/src/server/feedback/feedback.ts                          # NUEVO en E5-T3
app/src/server/feedback/actions.ts                           # NUEVO en E5-T3
app/src/components/feedback/feedback-button.tsx              # NUEVO en E5-T3
app/src/app/(app)/layout.tsx                                 # existe — se edita en E5-T3
app/tests/db/feedback.test.ts                                # NUEVO en E5-T3
app/src/server/surveys/surveys.ts                            # NUEVO en E5-T4
app/src/components/feedback/survey-card.tsx                  # NUEVO en E5-T4
app/src/app/(app)/hoy/page.tsx                               # existe — se edita en E5-T4
app/tests/db/surveys.test.ts                                 # NUEVO en E5-T4
app/tests/e2e/feedback.spec.ts                               # NUEVO en E5-T4
app/src/server/fake-doors/doors.ts                           # NUEVO en E5-T5
app/src/app/(app)/pronto/page.tsx                            # NUEVO en E5-T5
app/src/app/(app)/pronto/[puerta]/page.tsx                   # NUEVO en E5-T5
app/tests/db/fake-doors.test.ts                              # NUEVO en E5-T5
app/tests/e2e/fake-doors.spec.ts                             # NUEVO en E5-T5
app/src/server/admin/guard.ts                                # NUEVO en E5-T6
app/src/app/admin/layout.tsx                                 # NUEVO en E5-T6
app/src/app/admin/mfa/page.tsx                               # NUEVO en E5-T6
app/tests/support/totp.ts                                    # NUEVO en E5-T6
app/tests/db/admin-access.test.ts                            # NUEVO en E5-T6
app/src/server/admin/metrics.ts                              # NUEVO en E5-T7
app/src/app/admin/page.tsx                                   # NUEVO en E5-T7
app/src/components/admin/metric-chart.tsx                    # NUEVO en E5-T7
app/tests/db/admin-metrics.test.ts                           # NUEVO en E5-T7
app/src/server/admin/content.ts                              # NUEVO en E5-T8
app/src/app/admin/organizaciones/page.tsx                    # NUEVO en E5-T8
app/src/app/admin/contenido/page.tsx                         # NUEVO en E5-T8
app/src/app/admin/comentarios/page.tsx                       # NUEVO en E5-T8
app/tests/e2e/admin.spec.ts                                  # NUEVO en E5-T8
app/src/server/admin/limits.ts                               # NUEVO en E5-T9
app/src/app/api/admin/export/route.ts                        # NUEVO en E5-T9
app/src/app/admin/limites/page.tsx                           # NUEVO en E5-T9
app/tests/db/admin-export.test.ts                            # NUEVO en E5-T9
```

Everything outside this subtree is out of scope (leer otros archivos está bien; modificarlos no). If a task seems to require editing a file not listed here, stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entidad | Qué toca esta épica | Notas |
|---|---|---|
| `feedback` | inserta la usuaria; lee y marca leído admin `aal2` | |
| `survey_responses` | una por usuaria y encuesta | |
| `fake_door_interest` | `door_key`, `choice`, `notify_me` | |
| `events` | lectura de admin `aal2` para métricas y exportación | seudónimos |
| `organizations`, `tips`, `resources`, `care_templates` | escritura de admin `aal2` | |
| `admin_audit_log` | una fila por acceso o acción de admin | |

## Contracts

**Consumed** — already exists, do not rebuild:

| De | Interfaz | Garantía |
|---|---|---|
| `04-dia-a-dia` | `getToday`, `listEntries`, `verifiedResources` | ver épica 04 |
| `02-cimientos` | `track`, `checkRateLimit`, `templateItemSchema` | ver épica 02 |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Exporta | Firma | La usan |
|---|---|---|
| `src/server/reports/summary.ts` → `summarize`, `loadReportRows`, `BANNED_WORDS` | `(rows, period, audience) => Summary` | 08, 10 |
| `src/server/reports/milestones.ts` → `milestones` | | 10 |
| `src/server/admin/guard.ts` → `requireAdmin`, `logAdminAccess` | | 10 |
| `src/server/fake-doors/doors.ts` → `FAMILY_ENABLED`, `DOORS`, `visibleDoors`, `registerInterest` | | 08, 10 |
| `tests/support/totp.ts` → `totp` | `(secretBase32: string, now?: number) => string` | 06 |

## Conventions that bite in this area

- Porcentajes sin `Intl`: `Math.round(rate * 100) + " %"`.
- Ningún informe usa vocabulario clínico ni interpreta; lista `BANNED_WORDS` en `summary.ts`.
- Todo gráfico tiene su tabla equivalente para lectores de pantalla.
- `/admin` responde 404 a quien no es admin (no revela que existe).
- No barrel files; imports con `@/` → `app/src/` (las e2e y `scripts/lib`, relativas).
- Resultados tipados `{ ok: true, data } | { ok: false, error: { code, message } }`; textos para personas en español de Chile.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/database.md`, `server.md`, `ui.md`, `tests.md`, `web.md`, `docs.md`. Both sit in the project root — the builder copied them there from the bundle's `workspace/` before task one.

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do not re-rank by priority or by what looks quick.

### `E5-T1` — Calcular resúmenes, avances e hitos (F7)

**Depends on:** `E4-T9` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 34

- `app/src/server/reports/summary.ts` — `summarize(rows, period, audience)` puro: `period` = `dia|semana|mes`; cumplimiento por tipo de recordatorio (solo ocurrencias `main`, sin contar `skipped`), actividades hechas, días de bitácora por calificación, tareas cerradas y, solo con `audience: "caregiver"`, el bienestar propio. Frases fijas, sin `Intl`: el porcentaje es `Math.round(rate * 100) + " %"` (espacio normal U+0020). Ejemplos exactos: "Esta semana se cumplió el 90 % de los medicamentos." y "Hubo 3 días difíciles." (singular: "Hubo 1 día difícil."). Lista de palabras prohibidas exportada: `diagnóstico`, `deterioro`, `empeora`, `síntoma`. `loadReportRows(client, circleId, range)` trae los datos.
- `app/src/server/reports/milestones.ts` — `milestones(rows, now)`: `medicamentos_30_dias` (30 días seguidos con todas las ocurrencias de medicamento `done`) y `un_mes_con_sole` (30 días desde la primera actividad), con su texto.
- `informes/page.tsx` — `?periodo=dia|semana|mes`; frases, hitos y el gráfico. Registra `report.viewed`.
- `compliance-chart.tsx` (cliente, Recharts) — barras simples con colores de token y, debajo, la misma información como `<table>` para lectores de pantalla.

**Files**
- `app/src/server/reports/summary.ts` — new
- `app/src/server/reports/milestones.ts` — new
- `app/tests/unit/reports.test.ts` — new
- `app/src/app/(app)/informes/page.tsx` — new
- `app/src/components/reports/compliance-chart.tsx` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `summarize` receives a week with 10 medication occurrences of which 9 are `done` **THE SYSTEM SHALL** report `medication.rate = 0.9` and the sentence "Esta semana se cumplió el 90 % de los medicamentos.".
2. **WHEN** the week has 3 journal entries rated `dificil` **THE SYSTEM SHALL** produce "Hubo 3 días difíciles." and no sentence SHALL contain `diagnóstico`, `deterioro`, `empeora` or `síntoma`.
3. **WHEN** `summarize` runs with audience `family` **THE SYSTEM SHALL** omit every self-care value.
4. **WHEN** `milestones` receives 30 consecutive days where every medication occurrence is `done` **THE SYSTEM SHALL** return `medicamentos_30_dias`, and for a first activity 30 days ago SHALL return `un_mes_con_sole`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/reports.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E5-T1: Calcular resúmenes, avances e hitos (F7)"
git tag step-34-informes-f7
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E5-T2` — Compartir un informe como imagen o PDF desde el navegador

**Depends on:** `E5-T1` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 35

- `share-report.tsx` (cliente) — botón "Compartir"; primero un `Dialog` con "Lo que compartes sale de Sole y queda bajo tu responsabilidad." y los botones "Compartir igual" y "Cancelar"; luego `toPng` de `html-to-image` sobre la tarjeta del informe; si `navigator.canShare({ files })` → `navigator.share`; si no, descarga `sole-informe-<periodo>-<YYYY-MM-DD>.png`. Registra `report.shared` (`format: "png"` o `"pdf"`). Todo ocurre en el navegador: nada se sube a un servidor.
- `informes/imprimir/page.tsx` — versión para imprimir (`?periodo=`), con `@media print` (sin navegación, letra 12 pt, `@page { size: A4; margin: 15mm }`) y el botón "Imprimir o guardar como PDF" que llama a `window.print()`.
- `app/tests/e2e/reports.spec.ts` — siembra una semana de datos con el cliente admin.

**Files**
- `app/src/components/reports/share-report.tsx` — new
- `app/src/app/(app)/informes/imprimir/page.tsx` — new
- `app/tests/e2e/reports.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a user with a week of data opens `/informes?periodo=semana` **THE SYSTEM SHALL** show the medication compliance sentence and a chart whose values also appear in an HTML table.
2. **WHEN** the user activates "Compartir" **THE SYSTEM SHALL** first show "Lo que compartes sale de Sole y queda bajo tu responsabilidad." with "Compartir igual" and "Cancelar".
3. **WHEN** "Compartir igual" is chosen in a browser without `navigator.share` **THE SYSTEM SHALL** download a file whose name matches `sole-informe-semana-YYYY-MM-DD.png`.
4. **WHEN** `/informes/imprimir?periodo=mes` is opened **THE SYSTEM SHALL** render the button "Imprimir o guardar como PDF" and a stylesheet containing `@media print`.
5. **WHEN** axe runs on `/informes` and `/informes/imprimir` **THE SYSTEM SHALL** report 0 violations.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test:e2e tests/e2e/reports.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E5-T2: Compartir un informe como imagen o PDF desde el navegador"
git tag step-35-compartir-informe
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E5-T3` — Poner el botón permanente "Contarle algo a Sole" (F10)

**Depends on:** `E4-T9` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 36

- `app/src/server/feedback/feedback.ts` — `sendFeedback(client, userId, input)`: zod (`kind` `comentario|problema`, `message` 1–2000, `screen` ≤ 80); límite `feedback` por usuaria; `insert` sin devolver filas: nunca `.insert(...).select()` (la usuaria no tiene permiso de lectura sobre `feedback`, a propósito, así que pedir la fila de vuelta fallaría con `42501`).
- `app/src/server/feedback/actions.ts` — `"use server"`: `submitFeedback(formData)` valida sesión y llama a `sendFeedback`.
- `feedback-button.tsx` (cliente) — botón fijo "Contarle algo a Sole" que no tapa contenido enfocado (WCAG 2.4.11); abre un `Dialog` con "¿Es un comentario o un problema?", texto libre y "Enviar"; confirma "Gracias. Recibimos tu mensaje." en una región `aria-live`.
- `(app)/layout.tsx` — monta el botón en todas las páginas de la app.

**Files**
- `app/src/server/feedback/feedback.ts` — new
- `app/src/server/feedback/actions.ts` — new
- `app/src/components/feedback/feedback-button.tsx` — new
- `app/src/app/(app)/layout.tsx` — edit
- `app/tests/db/feedback.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a user sends "La letra se ve chica" as kind `problema` from screen `/hoy` **THE SYSTEM SHALL** store one `feedback` row with that text, kind and screen.
2. **WHEN** the message is empty or longer than 2000 characters **THE SYSTEM SHALL** return `{ ok: false, error: { code: "validation_failed" } }`.
3. **WHEN** a user sends an 11th message within one hour **THE SYSTEM SHALL** return `{ ok: false, error: { code: "rate_limited" } }`.
4. **WHEN** a non-admin user selects from `feedback` **THE SYSTEM SHALL** return zero rows, including their own messages.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/feedback.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E5-T3: Poner el botón permanente 'Contarle algo a Sole' (F10)"
git tag step-36-comentarios-f10
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E5-T4` — Mostrar las microencuestas de los días 3, 14, 28 y 56

**Depends on:** `E5-T3` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 37

- `app/src/server/surveys/surveys.ts` — `SURVEYS`: `d3` "¿Qué tan fácil te resulta usar Sole?" (1 a 5); `d14` "¿Sole te ayuda en tu día a día?" ("Sí", "Algo", "No"); `d28` "¿Cómo te sentirías si Sole dejara de existir?" ("Muy decepcionada", "Algo decepcionada", "No me importaría"); `d56` "¿Recomendarías Sole a una organización que conozcas?" ("Sí", "Tal vez", "No"). `dueSurvey(profile, answeredKeys, now)`: la encuesta de mayor día ya cumplido (días desde `profiles.created_at`) que no se haya respondido ni descartado. `answerSurvey` y `dismissSurvey` insertan en `survey_responses` y registran `survey.answered`.
- `survey-card.tsx` (cliente) — una pregunta, opciones grandes, "Ahora no".
- `hoy/page.tsx` — monta la tarjeta si hay encuesta pendiente.
- `app/tests/e2e/feedback.spec.ts` — ajusta `profiles.created_at` con el cliente admin para simular el día 3.

**Files**
- `app/src/server/surveys/surveys.ts` — new
- `app/src/components/feedback/survey-card.tsx` — new
- `app/src/app/(app)/hoy/page.tsx` — edit
- `app/tests/db/surveys.test.ts` — new
- `app/tests/e2e/feedback.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `dueSurvey` runs for a user registered 3 days ago with no answers **THE SYSTEM SHALL** return `d3`, and for a user registered 2 days ago SHALL return null.
2. **WHEN** a user registered 30 days ago has answered `d3` and `d14` **THE SYSTEM SHALL** return `d28`, whose question is "¿Cómo te sentirías si Sole dejara de existir?" with the options "Muy decepcionada", "Algo decepcionada" and "No me importaría".
3. **WHEN** a survey is answered or dismissed **THE SYSTEM SHALL** store one `survey_responses` row and not offer that survey again.
4. **WHEN** the e2e user opens `/hoy` **THE SYSTEM SHALL** show the button "Contarle algo a Sole", and sending a comment SHALL show "Gracias. Recibimos tu mensaje." in an `aria-live` region.
5. **WHEN** a user registered 3 days ago opens `/hoy` **THE SYSTEM SHALL** show the day-3 survey card.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/surveys.test.ts
pnpm -C app test:e2e tests/e2e/feedback.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E5-T4: Mostrar las microencuestas de los días 3, 14, 28 y 56"
git tag step-37-microencuestas
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E5-T5` — Medir interés con puertas falsas honestas (F11)

**Depends on:** `E4-T9` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 38

- `app/src/server/fake-doors/doors.ts` — `export const FAMILY_ENABLED = false;` (lo cambia paso 66 (`familiares-invitaciones`)); toda función que dependa de él lo recibe como parámetro con ese valor por defecto, así las pruebas fijan ambos valores y cambiar la constante no rompe ninguna prueba. `DOORS` con slug de URL y clave: `ia`→`ia` ("Sole con IA": le hablas y ella ordena la bitácora y los recordatorios), `recetas`→`recetas`, `plan-familiar`→`plan_familiar` (3 o 4 personas; precios de prueba `$2.990`, `$4.990` y `$7.990` al mes con la leyenda "Precio de prueba: hoy no se cobra nada"), `comunidad`→`comunidad`, `fotos`→`fotos`, `invitar-familiar`→`invitar_familiar` (solo mientras `FAMILY_ENABLED` sea `false`). `visibleDoors(familyEnabled = FAMILY_ENABLED)` y `registerInterest(client, userId, doorKey, { notifyMe, choice })`.
- `pronto/page.tsx` — lista honesta de lo que viene.
- `pronto/[puerta]/page.tsx` — "Esto todavía no existe. ¿Quieres que te avisemos cuando esté?" con "Sí, avísame" y "No, gracias"; en `plan-familiar` además los tres precios para elegir. Slug desconocido → `notFound()`. Registra `fake_door.viewed` y `fake_door.interest`.

**Files**
- `app/src/server/fake-doors/doors.ts` — new
- `app/src/app/(app)/pronto/page.tsx` — new
- `app/src/app/(app)/pronto/[puerta]/page.tsx` — new
- `app/tests/db/fake-doors.test.ts` — new
- `app/tests/e2e/fake-doors.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `/pronto/ia` is opened **THE SYSTEM SHALL** show "Esto todavía no existe. ¿Quieres que te avisemos cuando esté?".
2. **WHEN** the user activates "Sí, avísame" **THE SYSTEM SHALL** store one `fake_door_interest` row with `door_key = 'ia'` and `notify_me = true` and confirm it on screen.
3. **WHEN** `/pronto/plan-familiar` is opened **THE SYSTEM SHALL** show "$2.990", "$4.990" and "$7.990" with "Precio de prueba: hoy no se cobra nada", and choosing one SHALL store it in `choice`.
4. **WHEN** `/pronto/no-existe` is opened **THE SYSTEM SHALL** answer 404.
5. **WHEN** `visibleDoors(false)` and `visibleDoors(true)` run **THE SYSTEM SHALL** include `invitar-familiar` in the first result and exclude it from the second, whatever the current value of `FAMILY_ENABLED`.
6. **WHEN** axe runs on `/pronto` and `/pronto/plan-familiar` **THE SYSTEM SHALL** report 0 violations.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/fake-doors.test.ts
pnpm -C app test:e2e tests/e2e/fake-doors.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E5-T5: Medir interés con puertas falsas honestas (F11)"
git tag step-38-puertas-falsas-f11
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E5-T6` — Proteger el panel de administración con rol y MFA

**Depends on:** `E4-T9` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 39

El rol de admin se asigna solo con SQL manual del fundador (ver `docs/mantenimiento.md`); ninguna vía de la app lo concede.
- `app/src/server/admin/guard.ts` — `requireAdmin(client)` → `{ ok: true, userId }` o `{ ok: false, reason: "not_admin" | "mfa_required" }` (lee `profiles.is_admin` y el `aal` de la sesión con `auth.mfa.getAuthenticatorAssuranceLevel()`); `logAdminAccess(client, action, target)` inserta en `admin_audit_log`.
- `admin/layout.tsx` — sin sesión → `/entrar`; `not_admin` → `notFound()`; `mfa_required` → `/admin/mfa`; si está OK registra el acceso. `metadata.robots = { index: false }`.
- `admin/mfa/page.tsx` — Server Actions en línea: inscribir TOTP (`auth.mfa.enroll({ factorType: "totp" })`, muestra el QR y el secreto en texto "o escribe este código"), y verificar (`challenge` + `verify`).
- `app/tests/support/totp.ts` — TOTP RFC 6238 (SHA-1, 6 dígitos, 30 s) con `node:crypto`, para pruebas.

**Files**
- `app/src/server/admin/guard.ts` — new
- `app/src/app/admin/layout.tsx` — new
- `app/src/app/admin/mfa/page.tsx` — new
- `app/tests/support/totp.ts` — new
- `app/tests/db/admin-access.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a non-admin user calls `requireAdmin` **THE SYSTEM SHALL** return `{ ok: false, reason: "not_admin" }`.
2. **WHEN** an admin with an `aal1` session calls `requireAdmin` **THE SYSTEM SHALL** return `{ ok: false, reason: "mfa_required" }`, and an insert into `tips` with that session SHALL be rejected with `42501`.
3. **WHEN** the admin enrolls TOTP and verifies a code generated by `tests/support/totp.ts` **THE SYSTEM SHALL** issue an `aal2` session with which `requireAdmin` returns `ok: true` and an insert into `tips` succeeds.
4. **WHEN** `logAdminAccess` runs with an `aal2` admin session **THE SYSTEM SHALL** append one `admin_audit_log` row with that admin's id and action.
5. **WHEN** any authenticated user updates their own `profiles.is_admin` **THE SYSTEM SHALL** reject it with `42501`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/admin-access.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E5-T6: Proteger el panel de administración con rol y MFA"
git tag step-39-admin-acceso
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E5-T7` — Mostrar las métricas de las hipótesis H1–H6 (F15)

**Depends on:** `E5-T6`, `E5-T4`, `E5-T5` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 40

- `app/src/server/admin/metrics.ts` — `loadMetricRows(client, filters)` con la sesión `aal2` del admin (RLS deja leer `events`, `profiles`, `survey_responses`, `fake_door_interest`) más conteos del cliente admin para `push_subscriptions`; `computeMetrics(rows, filters)` puro: H1 promedio de días activos por semana (días distintos con `app.opened` por seudónimo) y retención en las semanas 1, 4 y 8 por cohorte de registro; H2 mediana de `duration_ms` de `flow.completed` por flujo y tasa de abandono (`flow.abandoned` / `flow.started`); H3 distribución de `d28`; H4 interés y elección por puerta y usos `premium.used`; H5 `invitation.created`, `cared_link.created` e interés en `invitar_familiar`; H6 retención por `org_code`; además % de usuarias activas en 7 días con al menos una suscripción push. Filtros: organización y cohorte (semana de registro).
- `admin/page.tsx` — tarjetas y gráficos con filtros por organización y cohorte; cada gráfico con su tabla equivalente.
- `metric-chart.tsx` (cliente, Recharts).

**Files**
- `app/src/server/admin/metrics.ts` — new
- `app/src/app/admin/page.tsx` — new
- `app/src/components/admin/metric-chart.tsx` — new
- `app/tests/db/admin-metrics.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `computeMetrics` receives events for 2 users active on 5 and on 3 distinct days of one week **THE SYSTEM SHALL** report `h1.avgActiveDaysPerWeek = 4`.
2. **WHEN** it receives `flow.completed` durations of 10000, 12000 and 20000 ms for flow `journal` **THE SYSTEM SHALL** report a median of 12000 for that flow.
3. **WHEN** it receives `d28` answers "Muy decepcionada" twice and "Algo decepcionada" three times **THE SYSTEM SHALL** report a share of 0.4 for "Muy decepcionada".
4. **WHEN** it is filtered by `org = DEMO-LOCAL` **THE SYSTEM SHALL** count only events whose `org_code` is `DEMO-LOCAL`.
5. **WHEN** `loadMetricRows` runs with a non-admin session **THE SYSTEM SHALL** read zero events.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/admin-metrics.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E5-T7: Mostrar las métricas de las hipótesis H1–H6 (F15)"
git tag step-40-admin-metricas
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E5-T8` — Gestionar organizaciones, contenido y comentarios (F15)

**Depends on:** `E5-T7`, `E4-T7` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 41

- `app/src/server/admin/content.ts` — con la sesión `aal2`: `createOrganization` (código en mayúsculas `^[A-Z0-9-]{3,32}$`), `toggleOrganization`, CRUD de `tips`, `resources` (incluido marcar verificado con fecha) y `care_templates` (ítems validados con `templateItemSchema`), `markFeedbackRead`. Cada acción registra `logAdminAccess`.
- `admin/organizaciones/page.tsx` — lista y alta; muestra el enlace `<APP_URL>/?org=<CODIGO>` para copiar.
- `admin/contenido/page.tsx` — pestañas Consejos, Recursos, Plantillas; los recursos no verificados se marcan en texto "Sin verificar".
- `admin/comentarios/page.tsx` — comentarios del más nuevo al más antiguo, conteo de eventos `app.error` de los últimos 7 días y enlace a Sentry (`https://sentry.io/`).
- `app/tests/e2e/admin.spec.ts` — crea una usuaria, la hace admin con el cliente admin (`update profiles set is_admin = true`), inscribe TOTP en `/admin/mfa` leyendo el secreto en texto y calculando el código con `../support/totp`.

**Files**
- `app/src/server/admin/content.ts` — new
- `app/src/app/admin/organizaciones/page.tsx` — new
- `app/src/app/admin/contenido/page.tsx` — new
- `app/src/app/admin/comentarios/page.tsx` — new
- `app/tests/e2e/admin.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** an `aal2` admin creates the organization "Fundación Prueba" with code `FUND-PRUEBA` **THE SYSTEM SHALL** list it with the link `<APP_URL>/?org=FUND-PRUEBA`.
2. **WHEN** the admin edits a tip's text and saves **THE SYSTEM SHALL** show the new text in the list.
3. **WHEN** the admin marks a resource as verified with a check date **THE SYSTEM SHALL** set `verified_at`, and that resource SHALL then appear on `/para-ti`.
4. **WHEN** the admin opens `/admin/comentarios` **THE SYSTEM SHALL** list feedback newest first and show the count of `app.error` events of the last 7 days with a link to Sentry.
5. **WHEN** a user marked as admin opens `/admin` without TOTP **THE SYSTEM SHALL** send them to `/admin/mfa`, and only after a valid code SHALL `/admin` load.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test:e2e tests/e2e/admin.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E5-T8: Gestionar organizaciones, contenido y comentarios (F15)"
git tag step-41-admin-gestion
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E5-T9` — Exportar datos seudónimos y vigilar los límites gratuitos

**Depends on:** `E5-T6` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 42

- `app/src/server/admin/limits.ts` — `FREE_LIMITS` con los valores de `docs/limites.md` (cada uno con su comentario `// [VERIFICAR] fuente: …`); `usageSnapshot(admin)` → tamaño de la base en MB (RPC `admin_db_size_bytes`), usuarias activas del mes (perfiles con `last_active_at` en 30 días), suscripciones push y eventos del mes, cada uno con su límite y `warning: true` desde el 80 %.
- `app/src/app/api/admin/export/route.ts` — `GET`: exige admin `aal2` (si no, 404 para no revelar la ruta); CSV `pseudonym_id,name,props,org_code,created_at` de `events` (con `?desde=YYYY-MM-DD`); registra `logAdminAccess(..., "export")`.
- `admin/limites/page.tsx` — tabla de uso contra límite con aviso en texto desde el 80 %.

**Files**
- `app/src/server/admin/limits.ts` — new
- `app/src/app/api/admin/export/route.ts` — new
- `app/src/app/admin/limites/page.tsx` — new
- `app/tests/db/admin-export.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** an `aal2` admin requests `GET /api/admin/export` **THE SYSTEM SHALL** answer CSV whose header is exactly `pseudonym_id,name,props,org_code,created_at` with no user id or email in any row.
2. **WHEN** a non-admin or an `aal1` admin requests it **THE SYSTEM SHALL** answer 404.
3. **WHEN** `usageSnapshot` runs **THE SYSTEM SHALL** return database size in MB, monthly active users, push subscriptions and monthly events, each next to its limit from `FREE_LIMITS`, with `warning: true` at 80 % or more.
4. **WHEN** the export succeeds **THE SYSTEM SHALL** append an `admin_audit_log` row with action `export`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/admin-export.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E5-T9: Exportar datos seudónimos y vigilar los límites gratuitos"
git tag step-42-admin-export-limites
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `pnpm -C app test` runs at the end of this epic **THE SYSTEM SHALL** exit 0 with the suites `reports`, `feedback`, `surveys`, `fake-doors`, `admin-access`, `admin-metrics` and `admin-export` passing.
2. **WHEN** `tests/e2e/admin.spec.ts` runs **THE SYSTEM SHALL** let an admin into `/admin` only after a valid TOTP code.

```bash
pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test
pnpm -C app test:e2e tests/e2e/admin.spec.ts
```

Run from the project root. Both criteria are decided by these commands.

## Pitfalls

- **`html-to-image` necesita que las fuentes estén cargadas**: espera `document.fonts.ready` antes de `toPng`.
- **MFA en Supabase**: después de `verify`, refresca la sesión para que el JWT traiga `aal2`.
- **Puertas falsas honestas**: nunca simular que algo existe; el texto dice que no existe todavía.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `git tag -l 'step-*'` lists `step-34-informes-f7`, `step-35-compartir-informe`, `step-36-comentarios-f10`, `step-37-microencuestas`, `step-38-puertas-falsas-f11`, `step-39-admin-acceso`, `step-40-admin-metricas`, `step-41-admin-gestion`, `step-42-admin-export-limites`.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `app/.env.example` updated if this epic added a variable.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
- [ ] Si esta épica cierra una fase del brief: resumen corto al fundador (qué funciona, cómo probarlo, qué se decidió en `DECISIONES.md`, qué necesita) y `PENDIENTES.md` al día.
