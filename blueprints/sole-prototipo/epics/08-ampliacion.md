# Epic 08: Ampliación

> Hay tareas sin fecha, contactos importantes, la vista grande de la persona cuidada con su botón de emergencia y el informe para el médico marcado como Premium gratis durante el piloto.

| | |
|---|---|
| **Epic id** | `08-ampliacion` |
| **Tasks** | `E8-T1` … `E8-T6` (pasos 54–59 de `blueprint.md` §9) |
| **Fase del brief** | Fase 6 del brief (F5, F9, F12, F14). |
| **Depends on** | 07-despliegue |
| **Unlocks** | 10-si-sobra-tiempo |
| **Parallel with** | 09-fuera-de-la-app |

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
app/src/server/tasks/tasks.ts                                # NUEVO en E8-T1
app/src/app/(app)/tareas/page.tsx                            # NUEVO en E8-T1
app/src/components/tasks/task-item.tsx                       # NUEVO en E8-T1
app/src/server/today/today.ts                                # existe — se edita en E8-T1
app/tests/db/tasks.test.ts                                   # NUEVO en E8-T1
app/src/server/contacts/contacts.ts                          # NUEVO en E8-T2
app/src/app/(app)/contactos/page.tsx                         # NUEVO en E8-T2
app/src/components/contacts/contact-form.tsx                 # NUEVO en E8-T2
app/tests/db/contacts.test.ts                                # NUEVO en E8-T2
app/tests/e2e/contacts.spec.ts                               # NUEVO en E8-T2
app/src/server/cared-link/links.ts                           # NUEVO en E8-T3
app/src/app/(app)/persona-cuidada/page.tsx                   # NUEVO en E8-T3
app/src/app/api/v/[token]/listo/route.ts                     # NUEVO en E8-T3
app/tests/db/cared-link.test.ts                              # NUEVO en E8-T3
app/src/server/cared-link/emergency.ts                       # NUEVO en E8-T4
app/src/app/api/v/[token]/emergencia/route.ts                # NUEVO en E8-T4
app/tests/db/emergency.test.ts                               # NUEVO en E8-T4
app/src/app/v/[token]/page.tsx                               # NUEVO en E8-T5
app/src/components/cared/emergency-button.tsx                # NUEVO en E8-T5
app/tests/e2e/cared-view.spec.ts                             # NUEVO en E8-T5
app/src/server/reports/doctor-report.ts                      # NUEVO en E8-T6
app/src/app/(app)/informes/medico/page.tsx                   # NUEVO en E8-T6
app/tests/unit/doctor-report.test.ts                         # NUEVO en E8-T6
app/tests/e2e/doctor-report.spec.ts                          # NUEVO en E8-T6
docs/negocio/planes.md                                       # NUEVO en E8-T6
```

Everything outside this subtree is out of scope (leer otros archivos está bien; modificarlos no). If a task seems to require editing a file not listed here, stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entidad | Qué toca esta épica | Notas |
|---|---|---|
| `tasks` | alta, pasar a hoy, completar | toma de tareas en la épica 10 |
| `contacts` | CRUD, `notes_enc`, `is_emergency` | sin datos clínicos |
| `cared_links` | token hasheado, vence en 90 días, revocable | |
| `emergency_events` | una fila por alerta | |
| `reminder_occurrences` | `done_via = 'cared_link'` desde la vista | |

## Contracts

**Consumed** — already exists, do not rebuild:

| De | Interfaz | Garantía |
|---|---|---|
| `04-dia-a-dia` | `getToday` | ver épica 04 |
| `03-recordatorios-y-avisos` | `sendToUser`, `PushSender`, `encryptField` | ver épica 03 |
| `05-informes-y-escucha` | `summarize`, `BANNED_WORDS`, `FAMILY_ENABLED` | ver épica 05 |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Exporta | Firma | La usan |
|---|---|---|
| `src/server/tasks/tasks.ts` → `addTask`, `moveToToday`, `completeTask`, `listTasks`, `helpLinkFor` | | 10 |
| `src/server/contacts/contacts.ts` → `emergencyContactFor`, `telHref` | | 08, 10 |
| `src/server/cared-link/links.ts` → `createLink`, `resolveLink`, `visibleToday`, `markDoneFromLink` | | 10 |
| `src/server/cared-link/emergency.ts` → `triggerEmergency` | `({ admin, link, sender }) => Promise<Result<{ callNumber: string }>>` | 10 |

## Conventions that bite in this area

- La llamada telefónica (`tel:`) es el camino confiable de la emergencia; el aviso push es un extra.
- El número 131 (SAMU) va marcado `[VERIFICAR en fuente oficial]` en la documentación y se verifica antes de lanzar.
- No barrel files; imports con `@/` → `app/src/` (las e2e y `scripts/lib`, relativas).
- Resultados tipados `{ ok: true, data } | { ok: false, error: { code, message } }`; textos para personas en español de Chile.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/database.md`, `server.md`, `ui.md`, `tests.md`, `web.md`, `docs.md`. Both sit in the project root — the builder copied them there from the bundle's `workspace/` before task one.

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do not re-rank by priority or by what looks quick.

### `E8-T1` — Agregar tareas sin fecha y pasarlas a hoy (F5)

**Depends on:** `E7-T5` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 54

- `app/src/server/tasks/tasks.ts` — `addTask`, `moveToToday` (pone `scheduled_for` = hoy en `America/Santiago`), `completeTask` (pone `done_at` y `done_by`), `removeTask`, `listTasks`; `helpLinkFor(taskId, familyEnabled = FAMILY_ENABLED)` → `/pronto/invitar-familiar` si `familyEnabled` es `false`, si no `/circulo?pedir=<taskId>` (la prueba pasa el valor explícito, así paso 66 (`familiares-invitaciones`) puede cambiar la constante sin romperla).
- `tareas/page.tsx` — "Para hoy", "Sin fecha" y "Hechas"; campo rápido "Agregar tarea".
- `task-item.tsx` (cliente) — "Pasar a hoy", "Hecha" y "Pedir ayuda con esto".
- `app/src/server/today/today.ts` — `getToday` también trae las tareas con `scheduled_for` = hoy dentro del grupo `whenever`.

**Files**
- `app/src/server/tasks/tasks.ts` — new
- `app/src/app/(app)/tareas/page.tsx` — new
- `app/src/components/tasks/task-item.tsx` — new
- `app/src/server/today/today.ts` — edit
- `app/tests/db/tasks.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a caregiver adds the task "Comprar pañales" **THE SYSTEM SHALL** list it under "Sin fecha".
2. **WHEN** `moveToToday` runs on it **THE SYSTEM SHALL** set `scheduled_for` to today in `America/Santiago`, and `getToday` SHALL include it in the `whenever` group.
3. **WHEN** the caregiver completes it **THE SYSTEM SHALL** set `done_at` and `done_by`.
4. **WHEN** a `family` member calls `addTask` **THE SYSTEM SHALL** return `{ ok: false, error: { code: "forbidden" } }`.
5. **WHEN** `helpLinkFor(taskId, false)` and `helpLinkFor(taskId, true)` run **THE SYSTEM SHALL** return `/pronto/invitar-familiar` and `/circulo?pedir=<taskId>` respectively.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/tasks.test.ts
pnpm -C app test tests/db/today.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E8-T1: Agregar tareas sin fecha y pasarlas a hoy (F5)"
git tag step-54-tareas-f5
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E8-T2` — Guardar contactos importantes y el de emergencia (F9)

**Depends on:** `E7-T5` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 55

- `app/src/server/contacts/contacts.ts` — CRUD; zod: `name` 1–80, `kind` (`familia|medico|centro_salud|farmacia|transporte|otro`), `phone` `^\+?[0-9 ()-]{6,20}$`, `notes` ≤ 300 cifradas con contexto `"contacts.notes"`, `isEmergency`. `telHref(phone)` deja solo `+` y dígitos. `emergencyContactFor(admin, circleId)` → el contacto de emergencia actualizado más recientemente, o `null`.
- `contactos/page.tsx` — lista con botón "Llamar" (`tel:`), marca "Contacto de emergencia".
- `contact-form.tsx` — sin campos de alergias, diagnósticos ni previsión (regla del brief).

**Files**
- `app/src/server/contacts/contacts.ts` — new
- `app/src/app/(app)/contactos/page.tsx` — new
- `app/src/components/contacts/contact-form.tsx` — new
- `app/tests/db/contacts.test.ts` — new
- `app/tests/e2e/contacts.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a caregiver adds "Dra. Pérez" with kind `medico` and phone `+56 2 2345 6789` **THE SYSTEM SHALL** list it with a link whose `href` is `tel:+56223456789`.
2. **WHEN** the phone contains letters **THE SYSTEM SHALL** return `{ ok: false, error: { code: "validation_failed" } }`.
3. **WHEN** two contacts are marked as emergency contacts **THE SYSTEM SHALL** have `emergencyContactFor` return the one updated most recently.
4. **WHEN** notes are saved **THE SYSTEM SHALL** store `notes_enc` starting with `v1.`, and the form SHALL contain no field labelled "alergias", "diagnóstico" or "previsión".
5. **WHEN** axe runs on `/contactos` **THE SYSTEM SHALL** report 0 violations.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/contacts.test.ts
pnpm -C app test:e2e tests/e2e/contacts.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E8-T2: Guardar contactos importantes y el de emergencia (F9)"
git tag step-55-contactos-f9
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E8-T3` — Crear y revocar el vínculo de la persona cuidada (F12)

**Depends on:** `E8-T2` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 56

- `app/src/server/cared-link/links.ts` — `createLink(client, userId, circleId, label)`: token = 32 bytes aleatorios en base64url (43 caracteres), guarda solo `sha256` hex, vence en 90 días; registra `cared_link.created`. `revokeLink`. `resolveLink(admin, token)` → `{ linkId, circleId, caredName }` o `null` si no existe, venció o fue revocado (actualiza `last_used_at`). `visibleToday(admin, circleId, now)` → ocurrencias `main` de hoy de recordatorios con `visible_to_cared = true`. `markDoneFromLink(admin, link, occurrenceId)` → `done`, `done_via = 'cared_link'`, `done_by` nulo; rechaza ocurrencias de otro círculo o de recordatorios no visibles.
- `persona-cuidada/page.tsx` — crear (muestra el enlace `<APP_URL>/v/<token>` una sola vez, con botón copiar), listar y revocar vínculos; explica qué verá la persona.
- `api/v/[token]/listo/route.ts` — `POST { occurrenceId }`; límite `cared_done`; token inválido u ocurrencia no visible → 404.

**Files**
- `app/src/server/cared-link/links.ts` — new
- `app/src/app/(app)/persona-cuidada/page.tsx` — new
- `app/src/app/api/v/[token]/listo/route.ts` — new
- `app/tests/db/cared-link.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a caregiver creates a link **THE SYSTEM SHALL** return a token of at least 43 base64url characters, store only its SHA-256 hex in `cared_links.token_hash`, and set `expires_at` 90 days ahead.
2. **WHEN** `visibleToday` runs for a valid link **THE SYSTEM SHALL** return only today's occurrences of reminders with `visible_to_cared = true`.
3. **WHEN** `POST /api/v/<token>/listo` marks a visible occurrence **THE SYSTEM SHALL** set it `done` with `done_via = 'cared_link'` and `done_by` null, and for an occurrence of a non-visible reminder SHALL answer 404 and change nothing.
4. **WHEN** the link is revoked or expired **THE SYSTEM SHALL** have `resolveLink` return null and answer 404 on `/api/v/<token>/listo`.
5. **WHEN** a `family` member calls `createLink` **THE SYSTEM SHALL** return `{ ok: false, error: { code: "forbidden" } }`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/cared-link.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E8-T3: Crear y revocar el vínculo de la persona cuidada (F12)"
git tag step-56-vinculo-persona-cuidada
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E8-T4` — Registrar emergencias y avisar a la cuidadora (F12)

**Depends on:** `E8-T3` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 57

- `app/src/server/cared-link/emergency.ts` — `triggerEmergency({ admin, link, sender })`: límite `emergency` por vínculo; inserta `emergency_events`; envía a cada suscripción de las cuidadoras un aviso con `requireInteraction: true` y título "Emergencia: <nombre> pidió ayuda"; devuelve `{ callNumber }` = teléfono del contacto de emergencia (`emergencyContactFor`) o `131` (`[VERIFICAR en fuente oficial]` antes de lanzar).
- `api/v/[token]/emergencia/route.ts` — `POST`; token inválido → 404; límite excedido → 429 `rate_limited`; si no, 200 `{ ok: true, data: { callNumber } }`.

**Files**
- `app/src/server/cared-link/emergency.ts` — new
- `app/src/app/api/v/[token]/emergencia/route.ts` — new
- `app/tests/db/emergency.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `triggerEmergency` runs for a valid link with a fake sender **THE SYSTEM SHALL** insert one `emergency_events` row, send a notification with `requireInteraction: true` and the title "Emergencia: <nombre> pidió ayuda" to every caregiver subscription, and return the emergency contact's phone or `131` when there is none.
2. **WHEN** it runs a 4th time within 10 minutes for the same link **THE SYSTEM SHALL** return `rate_limited` and insert no further row.
3. **WHEN** `POST /api/v/<token>/emergencia` arrives with an unknown token **THE SYSTEM SHALL** answer 404 and send nothing.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/emergency.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E8-T4: Registrar emergencias y avisar a la cuidadora (F12)"
git tag step-57-emergencia-servidor
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E8-T5` — Construir la vista grande de la persona cuidada (F12)

**Depends on:** `E8-T4` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 58

- `v/[token]/page.tsx` — pública, `robots: noindex`; token inválido → `notFound()`. Letra muy grande (títulos de ítem de al menos 28 px), uno o dos botones por pantalla, "Listo" por ítem (llama a `/api/v/<token>/listo`), y el botón de emergencia. Siempre visible: "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue."
- `emergency-button.tsx` (cliente) — botón grande "Pedir ayuda"; primero pregunta "¿Quieres pedir ayuda ahora?" con "Sí, llamar" y "No"; solo "Sí, llamar" llama a `/api/v/<token>/emergencia` y muestra el enlace `tel:` con el número que devuelve (la llamada es el camino confiable).
- `app/tests/e2e/cared-view.spec.ts` — crea círculo, recordatorio visible y vínculo con el cliente admin.

**Files**
- `app/src/app/v/[token]/page.tsx` — new
- `app/src/components/cared/emergency-button.tsx` — new
- `app/tests/e2e/cared-view.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `/v/<token>` opens with a valid token **THE SYSTEM SHALL** list today's visible items, and activating "Listo" on one SHALL show it as done.
2. **WHEN** the emergency button is pressed **THE SYSTEM SHALL** first ask "¿Quieres pedir ayuda ahora?" with "Sí, llamar" and "No", and only "Sí, llamar" SHALL reveal a `tel:` link and record the alert.
3. **WHEN** `/v/<token>` renders **THE SYSTEM SHALL** show "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue." and each item title with a computed font size of at least 28 px.
4. **WHEN** `/v/<token>` opens with an unknown token **THE SYSTEM SHALL** answer 404.
5. **WHEN** axe runs on `/v/<token>` **THE SYSTEM SHALL** report 0 violations.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test:e2e tests/e2e/cared-view.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E8-T5: Construir la vista grande de la persona cuidada (F12)"
git tag step-58-vista-persona-cuidada
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E8-T6` — Crear el informe para el médico, Premium en piloto (F14)

**Depends on:** `E5-T2`, `E7-T5` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 59

- `app/src/server/reports/doctor-report.ts` — `buildDoctorReport(rows, month)`: cumplimiento por recordatorio de medicamento, actividades hechas, resumen de la bitácora por calificación del día y la sección vacía "Preguntas de la familia para el control"; usa las frases y la lista de palabras prohibidas de `summary.ts`; sin datos de bienestar.
- `informes/medico/page.tsx` — `?mes=YYYY-MM`; etiqueta "Premium · gratis durante el piloto"; una página A4 (`@page { size: A4; margin: 15mm }`); botón "Imprimir o guardar como PDF"; registra `premium.used` con `feature: "informe_medico"`.
- `docs/negocio/planes.md` — del rol de Monetización: `## Planes`, `## Precios de prueba` (los de la puerta falsa: $2.990, $4.990, $7.990 al mes, solo para medir), `## Qué incluiría la versión con IA`, `## Cómo leer los datos de H4`. No implementa cobros.

**Files**
- `app/src/server/reports/doctor-report.ts` — new
- `app/src/app/(app)/informes/medico/page.tsx` — new
- `app/tests/unit/doctor-report.test.ts` — new
- `app/tests/e2e/doctor-report.spec.ts` — new
- `docs/negocio/planes.md` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `buildDoctorReport` runs for a month **THE SYSTEM SHALL** return compliance per medication reminder, activities done, the journal summary by day rating and an empty section titled "Preguntas de la familia para el control".
2. **WHEN** it runs **THE SYSTEM SHALL** include no self-care value and none of the words `diagnóstico`, `deterioro`, `empeora` or `síntoma`.
3. **WHEN** `/informes/medico?mes=2027-03` opens **THE SYSTEM SHALL** show "Premium · gratis durante el piloto" and the button "Imprimir o guardar como PDF", and SHALL store one `premium.used` event with `feature = "informe_medico"` for a user with research consent.
4. **WHEN** `docs/negocio/planes.md` is read **THE SYSTEM SHALL** contain the headings `## Planes`, `## Precios de prueba`, `## Qué incluiría la versión con IA` and `## Cómo leer los datos de H4`.
5. **WHEN** axe runs on `/informes/medico` **THE SYSTEM SHALL** report 0 violations.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/doctor-report.test.ts
pnpm -C app test:e2e tests/e2e/doctor-report.spec.ts
grep -q "## Precios de prueba" docs/negocio/planes.md
grep -q "## Cómo leer los datos de H4" docs/negocio/planes.md
```

**Checkpoint**

```bash
git add -A && git commit -m "E8-T6: Crear el informe para el médico, Premium en piloto (F14)"
git tag step-59-informe-medico-f14
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `pnpm -C app test` runs at the end of this epic **THE SYSTEM SHALL** exit 0 with `tasks`, `contacts`, `cared-link`, `emergency` and `doctor-report` passing.
2. **WHEN** `tests/e2e/cared-view.spec.ts` runs **THE SYSTEM SHALL** require a confirmation before the emergency alert and show the disclaimer.

```bash
pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test
pnpm -C app test:e2e tests/e2e/cared-view.spec.ts
```

Run from the project root. Both criteria are decided by these commands.

## Pitfalls

- **La vista de la persona cuidada no tiene sesión**: todo pasa por el token y el cliente admin, siempre filtrando por el círculo del token.
- **Nunca prometer seguridad física**: el texto dice que Sole no reemplaza a un servicio de emergencia.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `git tag -l 'step-*'` lists `step-54-tareas-f5`, `step-55-contactos-f9`, `step-56-vinculo-persona-cuidada`, `step-57-emergencia-servidor`, `step-58-vista-persona-cuidada`, `step-59-informe-medico-f14`.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `app/.env.example` updated if this epic added a variable.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
- [ ] Si esta épica cierra una fase del brief: resumen corto al fundador (qué funciona, cómo probarlo, qué se decidió en `DECISIONES.md`, qué necesita) y `PENDIENTES.md` al día.
