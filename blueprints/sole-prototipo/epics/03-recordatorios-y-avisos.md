# Epic 03: Recordatorios y avisos

> La cuidadora crea recordatorios con repetición en horario de Chile, el sistema materializa las próximas 48 horas, y un despachador con secreto envía avisos Web Push y el "¿Lo hiciste?"; la app es instalable.

| | |
|---|---|
| **Epic id** | `03-recordatorios-y-avisos` |
| **Tasks** | `E3-T1` … `E3-T8` (pasos 17–24 de `blueprint.md` §9) |
| **Fase del brief** | Fase 2 del brief, primera mitad (F3 y notificaciones reales). |
| **Depends on** | 02-cimientos |
| **Unlocks** | 04-dia-a-dia |
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
app/src/server/reminders/recurrence.ts                       # NUEVO en E3-T1
app/tests/unit/recurrence.test.ts                            # NUEVO en E3-T1
app/tests/unit/recurrence-dst.test.ts                        # NUEVO en E3-T1
app/src/lib/crypto/field.ts                                  # NUEVO en E3-T2
app/tests/unit/field-crypto.test.ts                          # NUEVO en E3-T2
app/src/server/reminders/reminders.ts                        # NUEVO en E3-T2
app/tests/db/reminders.test.ts                               # NUEVO en E3-T2
app/src/app/(app)/recordatorios/page.tsx                     # NUEVO en E3-T3
app/src/app/(app)/recordatorios/editar/page.tsx              # NUEVO en E3-T3
app/src/app/(app)/recordatorios/actions.ts                   # NUEVO en E3-T3
app/src/components/reminders/reminder-form.tsx               # NUEVO en E3-T3
app/tests/e2e/reminders.spec.ts                              # NUEVO en E3-T3
app/src/server/reminders/materialize.ts                      # NUEVO en E3-T4
app/tests/db/materialize.test.ts                             # NUEVO en E3-T4
app/src/server/push/send.ts                                  # NUEVO en E3-T5
app/src/server/reminders/dispatch.ts                         # NUEVO en E3-T5
app/src/app/api/cron/dispatch/route.ts                       # NUEVO en E3-T5
app/scripts/trigger-cron.ts                                  # NUEVO en E3-T5
app/tests/db/dispatch.test.ts                                # NUEVO en E3-T5
app/src/app/manifest.ts                                      # NUEVO en E3-T6
app/src/app/icons/[size]/route.tsx                           # NUEVO en E3-T6
app/tests/e2e/manifest.spec.ts                               # NUEVO en E3-T6
app/src/sw.ts                                                # NUEVO en E3-T7
app/next.config.ts                                           # existe — se edita en E3-T7
app/tsconfig.json                                            # NUEVO en E3-T7
app/tests/e2e/pwa.spec.ts                                    # NUEVO en E3-T7
app/src/server/push/subscriptions.ts                         # NUEVO en E3-T8
app/src/app/api/push/route.ts                                # NUEVO en E3-T8
app/src/components/push/push-settings.tsx                    # NUEVO en E3-T8
app/src/app/(app)/avisos/page.tsx                            # NUEVO en E3-T8
app/tests/db/push-subscriptions.test.ts                      # NUEVO en E3-T8
```

Everything outside this subtree is out of scope (leer otros archivos está bien; modificarlos no). If a task seems to require editing a file not listed here, stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entidad | Qué toca esta épica | Notas |
|---|---|---|
| `reminders` | crea, edita, desactiva; `med_name_enc`, `med_instructions_enc` cifrados | `rule` JSON validada con `ruleSchema` |
| `reminder_occurrences` | materializa (`main`, `advance`); el despachador escribe `notified_at`, `followup_sent_at`, estado de pospuestas | único `(reminder_id, kind, event_at, advance_days)` |
| `push_subscriptions` | alta, baja, limpieza por 404/410 | solo las propias |
| `private.job_leases` | bloqueo `dispatch` | `acquire_job_lease` / `release_job_lease` |
| `profiles.followup_minutes` | minutos del "¿Lo hiciste?" | 5 a 120, por defecto 15 |

## Contracts

**Consumed** — already exists, do not rebuild:

| De | Interfaz | Garantía |
|---|---|---|
| `02-cimientos` | `ruleSchema`, `track`, `checkRateLimit`, `resolveActiveCircle`, fixtures e2e | ver épica 02 |
| migración `20261114000400_cron.sql` | jobs `sole-dispatch` y `sole-daily` que llaman a `/api/cron/dispatch` y `/api/cron/daily` con `x-cron-secret` | en local no hacen nada (sin secretos en Vault) |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Exporta | Firma | La usan |
|---|---|---|
| `src/server/reminders/recurrence.ts` → `expandRule`, `localDateOf`, `advanceNotices` | `(rule, tz, fromUtc: Date, toUtc: Date) => Date[]` | 04 (Hoy, calendario), 05 |
| `src/lib/crypto/field.ts` → `encryptField`, `decryptField`, `FieldDecryptError` | `(plain: string, context: string) => string` | 04, 07, 08 |
| `src/server/reminders/reminders.ts` → `createReminder`, `updateReminder`, `deleteReminder`, `listReminders` | resultado tipado | 04 |
| `src/server/reminders/materialize.ts` → `materializeOccurrences` | `(admin, { now, horizonHours?, circleIds? }) => Promise<{ created: number }>` | 04, 07 |
| `src/server/push/send.ts` → `PushSender`, `webPushSender`, `sendToUser` | ver `E3-T5` | 04, 08, 10 |
| `src/server/reminders/dispatch.ts` → `runDispatch` | `({ admin, now, sender }) => Promise<{ skipped?: true, notified, followups, woken }>` | 10 |

## Conventions that bite in this area

- Todo cálculo de fechas recibe `now` y la zona del círculo; nunca `new Date()` dentro de la lógica ni la zona del equipo.
- Los avisos push nunca llevan el nombre del medicamento: solo el `title` que escribió la cuidadora.
- Reclamar antes de enviar: `update … where notified_at is null` y enviar solo si se actualizó la fila.
- En local el cron no corre: con `pnpm -C app dev` arriba, `pnpm -C app cron:dispatch` dispara el despachador.
- No barrel files; imports con `@/` → `app/src/` (las e2e y `scripts/lib`, relativas).
- Resultados tipados `{ ok: true, data } | { ok: false, error: { code, message } }`; textos para personas en español de Chile.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/database.md`, `server.md`, `ui.md`, `tests.md`, `web.md`, `docs.md`. Both sit in the project root — the builder copied them there from the bundle's `workspace/` before task one.

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do not re-rank by priority or by what looks quick.

### `E3-T1` — Expandir reglas de repetición con horario de Chile

**Depends on:** `E2-T6` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 17

Módulo puro, sin base de datos y con el reloj inyectado. Usa `TZDate` de `@date-fns/tz` y funciones de `date-fns`; nunca la zona horaria del equipo.
- `expandRule(rule, tz, fromUtc, toUtc): Date[]` — instantes del evento entre `fromUtc` y `toUtc`, ordenados y sin duplicados, para cada hora de `rule.times` en la zona `tz`. `monthly` con un día que el mes no tiene → último día del mes. `yearly` del 29 de febrero → 28 de febrero en años no bisiestos. Nada después del final del día local de `endDate`.
- Cambio de hora (regla de la casa, documentada en el código): una hora local que no existe (salto hacia adelante) se corre hacia adelante lo que dura el salto; una hora que ocurre dos veces (atraso) usa la **primera**. Chile cambia la hora a medianoche, así que el caso real es 00:00–00:59 del día del adelanto y 23:00–23:59 del día del atraso.
- `localDateOf(instant, tz): string` (`YYYY-MM-DD`).
- `advanceNotices(eventInstant, tz, advanceDays): Array<{ daysBefore, fireAt }>` — aviso a las 09:00 locales `daysBefore` días antes; para 0 días, 09:00 del mismo día solo si el evento es después de las 09:00.
- `recurrence-dst.test.ts` no escribe fechas de cambio a mano: recorre 2027 completo y verifica la propiedad.

**Files**
- `app/src/server/reminders/recurrence.ts` — new
- `app/tests/unit/recurrence.test.ts` — new
- `app/tests/unit/recurrence-dst.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a `daily` rule with times `["08:00","20:00"]` is expanded over 14 local days in `America/Santiago` **THE SYSTEM SHALL** return 28 instants, each formatting to 08:00 or 20:00 in that zone.
2. **WHEN** a `weekly` rule with weekdays `[1,3,5]` is expanded over two weeks **THE SYSTEM SHALL** return only Mondays, Wednesdays and Fridays.
3. **WHEN** a `monthly` rule with `dayOfMonth: 31` is expanded over a year **THE SYSTEM SHALL** use the last day of every shorter month, and a `yearly` rule on February 29 SHALL fall on February 28 in non-leap years.
4. **WHEN** a `daily` rule with times `["00:30","08:00","23:30"]` is expanded over all of 2027 in `America/Santiago` **THE SYSTEM SHALL** return exactly one instant per time per local day, strictly increasing, each at the requested local time or, only on the spring-forward day, at most 60 minutes later.
5. **WHEN** `advanceNotices` gets an appointment at 15:00 local with `[3,1,0]` **THE SYSTEM SHALL** return fire times at 09:00 local 3 days before, 1 day before and the same day, and for an appointment at 08:00 SHALL omit the same-day notice.
6. **WHEN** a rule has an `endDate` **THE SYSTEM SHALL** return no instant after the end of that local day.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/recurrence.test.ts
pnpm -C app test tests/unit/recurrence-dst.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T1: Expandir reglas de repetición con horario de Chile"
git tag step-17-recurrencia
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E3-T2` — Cifrar campos sensibles y guardar recordatorios

**Depends on:** `E3-T1`, `E2-T1`, `E2-T5` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 18

- `app/src/lib/crypto/field.ts` — AES-256-GCM con `node:crypto`. `FIELD_ENCRYPTION_KEY` tiene la forma `<versión>:<32 bytes en base64>`; `FIELD_ENCRYPTION_KEY_PREVIOUS` (opcional) igual, para rotar. `encryptField(plain, context)` → `v<versión>.<iv base64url>.<cifrado+tag base64url>` con IV aleatorio de 12 bytes y `context` (por ejemplo `"reminders.med_name"`) como AAD. `decryptField(value, context)` elige la clave por versión; cualquier alteración lanza `FieldDecryptError`. Sin dependencias del framework (lo usa también un script).
- `app/src/server/reminders/reminders.ts` — `createReminder`, `updateReminder`, `deleteReminder` (pone `active = false`; el historial se conserva) y `listReminders(client, circleId)` que descifra. zod: `kind`, `importance`, `title` 1–120, `medName` ≤ 120 y `medInstructions` ≤ 300 solo para `medication`, `rule` con `ruleSchema`, `advanceDays` (por defecto `[3,1,0]` para `appointment`, `errand` e `important_date`; `[]` para el resto), `visibleToCared`. Los errores de Postgres `42501` se traducen a `forbidden`. Registra `reminder.created`.

**Files**
- `app/src/lib/crypto/field.ts` — new
- `app/tests/unit/field-crypto.test.ts` — new
- `app/src/server/reminders/reminders.ts` — new
- `app/tests/db/reminders.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `encryptField` and then `decryptField` run with the same context **THE SYSTEM SHALL** return the original text, the ciphertext SHALL start with `v1.`, and two encryptions of the same text SHALL differ.
2. **WHEN** `decryptField` receives a ciphertext with one character changed or a different context **THE SYSTEM SHALL** throw `FieldDecryptError`.
3. **WHEN** `FIELD_ENCRYPTION_KEY` moves to version 2 with the old key in `FIELD_ENCRYPTION_KEY_PREVIOUS` **THE SYSTEM SHALL** still decrypt `v1.` values and encrypt new values as `v2.`.
4. **WHEN** a caregiver creates a medication reminder whose name is "Losartán" **THE SYSTEM SHALL** store `med_name_enc` starting with `v1.` and never the plain name, and `listReminders` SHALL return `medName: "Losartán"`.
5. **WHEN** a `family` member calls `createReminder` on that circle **THE SYSTEM SHALL** return `{ ok: false, error: { code: "forbidden" } }`, and WHEN the caregiver deletes a reminder THE SYSTEM SHALL set `active = false` and keep its occurrences.
6. **WHEN** an `appointment` reminder is created without `advanceDays` **THE SYSTEM SHALL** store `{3,1,0}`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/field-crypto.test.ts
pnpm -C app test tests/db/reminders.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T2: Cifrar campos sensibles y guardar recordatorios"
git tag step-18-recordatorios-datos
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E3-T3` — Crear y editar recordatorios desde la app (F3)

**Depends on:** `E3-T2`, `E2-T8` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 19

- `recordatorios/page.tsx` — lista del círculo activo (`?c=`), agrupada por tipo, con hora(s), repetición en palabras ("todos los días a las 08:00", "lunes, miércoles y viernes") y etiqueta de importancia en texto ("Importante", "Normal", "Cuando puedas"); botón "Nuevo recordatorio".
- `recordatorios/editar/page.tsx` — sin `id` crea, con `?id=` edita; `?fecha=YYYY-MM-DD` precarga la fecha de inicio (lo usa el calendario).
- `recordatorios/actions.ts` — `"use server"`: `saveReminder`, `removeReminder`; validan sesión y llaman a `reminders.ts`.
- `reminder-form.tsx` (cliente, react-hook-form + `@hookform/resolvers/zod`): tipo (7 opciones), título, importancia, nombre e indicación del medicamento (solo si es medicamento, con la nota "Sin catálogo de fármacos ni dosis: escribe lo que diga la receta"), repetición, horas (agregar/quitar), fecha de inicio y de término opcional, días de aviso previo (para controles, trámites y fechas), "Visible para <nombre>". Errores con `Field`. Mensaje si no hay horas: "Agrega al menos una hora."

**Files**
- `app/src/app/(app)/recordatorios/page.tsx` — new
- `app/src/app/(app)/recordatorios/editar/page.tsx` — new
- `app/src/app/(app)/recordatorios/actions.ts` — new
- `app/src/components/reminders/reminder-form.tsx` — new
- `app/tests/e2e/reminders.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a caregiver creates from `/recordatorios/editar` a medication reminder titled "Medicamento de la mañana", daily at 08:00, importance important **THE SYSTEM SHALL** list it on `/recordatorios` with "08:00" and the label "Importante".
2. **WHEN** `tests/e2e/reminders.spec.ts` creates a daily reminder **THE SYSTEM SHALL** need at most 8 field interactions before pressing "Guardar" (H2: under 60 seconds).
3. **WHEN** the form is submitted with no time **THE SYSTEM SHALL** show "Agrega al menos una hora." inside an element with `role="alert"` and create nothing.
4. **WHEN** `/recordatorios/editar?fecha=2027-03-10` is opened **THE SYSTEM SHALL** prefill the start date with `2027-03-10`.
5. **WHEN** axe runs on `/recordatorios` and `/recordatorios/editar` **THE SYSTEM SHALL** report 0 violations.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test:e2e tests/e2e/reminders.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T3: Crear y editar recordatorios desde la app (F3)"
git tag step-19-recordatorios-ui
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E3-T4` — Materializar las ocurrencias de las próximas 48 horas

**Depends on:** `E3-T2` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 20

- `materializeOccurrences(admin, { now, horizonHours = 48, circleIds? })` — para cada recordatorio activo de un círculo abierto cuya cuidadora (creadora del círculo) no tenga `deactivated_at`: expande con `expandRule` en la zona del círculo entre `now − 6 h` y `now + horizonHours` y crea las ocurrencias `main` (`due_at = event_at`, `local_date`); para avisos previos expande hasta `now + horizonHours + max(advanceDays)` días y crea las `advance` cuyo `fireAt` cae en la ventana (`due_at = fireAt`, `event_at` = evento). Inserta con `upsert(..., { onConflict: "reminder_id,kind,event_at,advance_days", ignoreDuplicates: true })`. Devuelve `{ created }`. Usa el cliente admin: corre en el despachador y al abrir "Hoy".

**Files**
- `app/src/server/reminders/materialize.ts` — new
- `app/tests/db/materialize.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `materializeOccurrences` runs with a fixed `now` for a daily 08:00 reminder **THE SYSTEM SHALL** create the `main` occurrences that fall inside the next 48 hours, each with `local_date` computed in `America/Santiago`.
2. **WHEN** it runs a second time with the same `now` **THE SYSTEM SHALL** create zero new rows.
3. **WHEN** an appointment falls 3 days after `now` with advance days `[3,1,0]` **THE SYSTEM SHALL** create the 3-days-before `advance` occurrence once its fire time enters the 48-hour window, and only once.
4. **WHEN** the circle is closed, the reminder is inactive, or the caregiver's profile has `deactivated_at` set **THE SYSTEM SHALL** create no occurrence for it.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/materialize.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T4: Materializar las ocurrencias de las próximas 48 horas"
git tag step-20-materializacion
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E3-T5` — Enviar avisos y el "¿Lo hiciste?" a los 15 minutos

**Depends on:** `E3-T4` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 21

- `app/src/server/push/send.ts` — `type PushSender = (subscription, payload) => Promise<{ statusCode: number }>`; `webPushSender()` con `web-push` y `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (TTL 3600, `urgency: "high"` para importantes); `sendToUser(admin, userId, payload, sender)`: 404/410 → borra la suscripción; otro error → `failed_count + 1`; éxito → `last_success_at`.
- `app/src/server/reminders/dispatch.ts` — `runDispatch({ admin, now, sender })`: toma el bloqueo `acquire_job_lease('dispatch', 55)` (si no, `{ skipped: true }`); materializa; **avisos**: ocurrencias `pending` con `due_at` entre `now − 6 h` y `now` y `notified_at` nulo — se reclaman con `update … set notified_at = now where id = … and notified_at is null` antes de enviar (nunca dos envíos); **seguimiento**: `main` aún `pending`, con `notified_at` y sin `followup_sent_at`, cuando pasaron `followup_minutes` de la cuidadora; **pospuestas**: `snoozed` con `snoozed_until ≤ now` vuelven a `pending` con `notified_at` nulo. Destinatarias en este paso: las cuidadoras del círculo. Payload: `{ title, body, url: "/hoy?c=<círculo>", occurrenceId, tag, actions? }`; el título es el `title` del recordatorio (para medicamentos nunca el nombre descifrado); el seguimiento usa el título "¿Lo hiciste?" y las acciones `done` ("Sí, listo") y `not_done` ("No"). Libera el bloqueo en `finally`. Devuelve conteos.
- `app/src/app/api/cron/dispatch/route.ts` — solo `POST`; compara `x-cron-secret` con `CRON_SECRET` usando `timingSafeEqual`; sin él → 401 `{ ok: false, error: { code: "unauthorized" } }`; con él → `runDispatch` con `webPushSender()` y 200 con los conteos.
- `app/scripts/trigger-cron.ts` — `tsx scripts/trigger-cron.ts dispatch|daily`: llama a `loadLocalEnv()` y hace `POST ${APP_URL}/api/cron/<trabajo>` con el secreto; imprime el estado; sale con 0 solo si la respuesta es 200. En local reemplaza a pg_cron (`pnpm -C app cron:dispatch` con `pnpm -C app dev` corriendo).

**Files**
- `app/src/server/push/send.ts` — new
- `app/src/server/reminders/dispatch.ts` — new
- `app/src/app/api/cron/dispatch/route.ts` — new
- `app/scripts/trigger-cron.ts` — new
- `app/tests/db/dispatch.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `runDispatch` runs at 08:00:30 for a pending 08:00 occurrence with a fake sender **THE SYSTEM SHALL** send exactly one notification to each caregiver subscription and set `notified_at`, and a second run SHALL send nothing more.
2. **WHEN** that occurrence is still `pending` 15 minutes after `notified_at` and the caregiver has `followup_minutes = 15` **THE SYSTEM SHALL** send one follow-up whose payload has the title "¿Lo hiciste?" and the actions `done` ("Sí, listo") and `not_done` ("No"), and set `followup_sent_at`.
3. **WHEN** the fake sender answers 410 for a subscription **THE SYSTEM SHALL** delete that `push_subscriptions` row.
4. **WHEN** two `runDispatch` calls overlap **THE SYSTEM SHALL** let only one hold the `dispatch` lease and the other SHALL return `{ skipped: true }`.
5. **WHEN** `POST /api/cron/dispatch` arrives without the correct `x-cron-secret` **THE SYSTEM SHALL** return 401 and send nothing.
6. **WHEN** a payload is built for a medication reminder **THE SYSTEM SHALL** not contain the decrypted medication name.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/dispatch.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T5: Enviar avisos y el '¿Lo hiciste?' a los 15 minutos"
git tag step-21-despachador
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E3-T6` — Publicar el manifiesto y los íconos de la PWA

**Depends on:** `E1-T4`, `E3-T5` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 22

- `app/src/app/manifest.ts` — `name: "Sole · el día a día del cuidado"`, `short_name: "Sole"`, `start_url: "/hoy"`, `scope: "/"`, `display: "standalone"`, `lang: "es-CL"`, colores desde `tokens.light`, íconos `/icons/192` (192x192), `/icons/512` (512x512) y `/icons/512-maskable` (512x512, `purpose: "maskable"`).
- `app/src/app/icons/[size]/route.tsx` — `ImageResponse` de `next/og`: el logo de Sole (cuadrado redondeado color `tokens.light.primary` con una "S" color `tokens.light.background`, igual al favicon de la web). Tamaños `96`, `192`, `512`, `512-maskable` (con margen de seguridad); cualquier otro → 404. `generateStaticParams` para generarlos en el build.
- `app/tests/e2e/manifest.spec.ts` — pide el manifiesto y los íconos con `request` de Playwright.

**Files**
- `app/src/app/manifest.ts` — new
- `app/src/app/icons/[size]/route.tsx` — new
- `app/tests/e2e/manifest.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `GET /manifest.webmanifest` is requested **THE SYSTEM SHALL** return JSON with `short_name` "Sole", `start_url` "/hoy", `display` "standalone", `lang` "es-CL" and icons of sizes `192x192` and `512x512`, one of them with purpose `maskable`.
2. **WHEN** `GET /icons/192` and `GET /icons/512` are requested **THE SYSTEM SHALL** answer 200 with `content-type: image/png`, and `GET /icons/7` SHALL answer 404.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test:e2e tests/e2e/manifest.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T6: Publicar el manifiesto y los íconos de la PWA"
git tag step-22-pwa-manifiesto
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E3-T7` — Registrar el service worker con avisos push (Serwist)

**Depends on:** `E3-T6` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 23

- `app/next.config.ts` — envuelve la config con `withSerwist({ swSrc: "src/sw.ts", swDest: "public/sw.js", disable: process.env.NODE_ENV === "development", reloadOnOnline: false })` de `@serwist/next`.
- `app/tsconfig.json` — agrega `"webworker"` a `compilerOptions.lib` (tipos de `ServiceWorkerGlobalScope`, `PushEvent`, `NotificationEvent`); nada más cambia.
- `app/src/sw.ts` — tipado como indica el README de Serwist (`declare global { interface WorkerGlobalScope extends SerwistGlobalConfig { __SW_MANIFEST: (PrecacheEntry | string)[] | undefined } }` y `declare const self: ServiceWorkerGlobalScope`). `Serwist` con `precacheEntries: self.__SW_MANIFEST`, `defaultCache` de `@serwist/next/worker`, `skipWaiting`, `clientsClaim`, `navigationPreload`. Evento `push`: `showNotification(title, { body, icon: "/icons/192", badge: "/icons/96", tag, data: { url, occurrenceId }, actions, requireInteraction })`. Evento `notificationclick`: con acción `done` o `not_done` hace `POST /api/occurrences/mark` (`credentials: "same-origin"`, `idempotencyKey: crypto.randomUUID()`, `via: "push"`); si responde 401, o sin acción, abre o enfoca `data.url`. La página sin conexión (`fallbacks`) llega en paso 28 (`sin-conexion-lectura`).
- `app/tests/e2e/pwa.spec.ts` — solo en el proyecto `android-gama-media` (`test.skip` en WebKit).

**Files**
- `app/src/sw.ts` — new
- `app/next.config.ts` — edit
- `app/tsconfig.json` — new
- `app/tests/e2e/pwa.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `GET /sw.js` is requested from the production build **THE SYSTEM SHALL** answer 200 with a JavaScript content type.
2. **WHEN** a page is loaded in the `android-gama-media` project **THE SYSTEM SHALL** register a service worker whose scope is the site root, checked with `navigator.serviceWorker.ready`.
3. **WHEN** `pnpm -C app typecheck` runs **THE SYSTEM SHALL** exit 0 with `src/sw.ts` included in the program.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test:e2e tests/e2e/pwa.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T7: Registrar el service worker con avisos push (Serwist)"
git tag step-23-pwa-service-worker
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E3-T8` — Activar, probar y mostrar el estado de los avisos

**Depends on:** `E3-T7` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 24

- `app/src/server/push/subscriptions.ts` — `saveSubscription(client, admin, userId, sub, userAgent)` (si el `endpoint` existe para otra usuaria, el admin borra esa fila; luego inserta o actualiza la propia), `removeSubscription(client, endpoint)`, `pushStatus(client)` → `{ active: boolean, count }`.
- `app/src/app/api/push/route.ts` — `POST` con `{ action: "subscribe" | "unsubscribe" | "test", subscription? }` validado con zod; usa `createSupabaseRouteClient(request)`; sin sesión → 401 `{ ok: false, error: { code: "unauthorized" } }`; `test` (límite `push_test`) manda "Así se verá un aviso de Sole" a las suscripciones propias.
- `push-settings.tsx` (cliente) — explica para qué sirven los avisos; "Activar avisos" pide permiso **solo al tocarlo** y suscribe con `NEXT_PUBLIC_VAPID_PUBLIC_KEY`; "Probar aviso"; indicador en texto "Avisos activos ✓" / "Avisos desactivados ✗" (no solo color); nota de iPhone (instalar en inicio, iOS 16.4+) y de ahorro de batería en Android. Registra `push.permission` con el resultado.
- `app/src/app/(app)/avisos/page.tsx` — el componente, más minutos para el "¿Lo hiciste?" (5 a 120, por defecto 15) y hora sugerida para la bitácora.

**Files**
- `app/src/server/push/subscriptions.ts` — new
- `app/src/app/api/push/route.ts` — new
- `app/src/components/push/push-settings.tsx` — new
- `app/src/app/(app)/avisos/page.tsx` — new
- `app/tests/db/push-subscriptions.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** an authenticated user posts `{ action: "subscribe", subscription }` to `/api/push` **THE SYSTEM SHALL** store one `push_subscriptions` row for that user, and posting the same endpoint again SHALL leave exactly one row.
2. **WHEN** a second user subscribes with an endpoint already stored for the first **THE SYSTEM SHALL** move that row to the second user and leave none for the first.
3. **WHEN** `/api/push` is called without a session **THE SYSTEM SHALL** return 401 with `{ ok: false, error: { code: "unauthorized" } }`.
4. **WHEN** `{ action: "unsubscribe" }` is posted **THE SYSTEM SHALL** delete only the caller's row for that endpoint.
5. **WHEN** `pushStatus` is read for a user with no subscription **THE SYSTEM SHALL** return `{ active: false, count: 0 }`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/push-subscriptions.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T8: Activar, probar y mostrar el estado de los avisos"
git tag step-24-avisos-suscripcion
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `tests/db/dispatch.test.ts` and `tests/db/materialize.test.ts` run **THE SYSTEM SHALL** exit 0, proving one notification per occurrence, the follow-up at 15 minutes and idempotent materialization.
2. **WHEN** `tests/e2e/pwa.spec.ts` and `tests/e2e/reminders.spec.ts` run **THE SYSTEM SHALL** exit 0, proving the app is installable and a caregiver can create a reminder.

```bash
pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test
pnpm -C app test:e2e tests/e2e/pwa.spec.ts
pnpm -C app test:e2e tests/e2e/reminders.spec.ts
```

Run from the project root. Both criteria are decided by these commands.

## Pitfalls

- **Chile cambia la hora a medianoche**: las horas 00:00–00:59 del día del adelanto no existen y las 23:00–23:59 del día del atraso ocurren dos veces; la prueba recorre todo 2027 en vez de fijar fechas.
- **`@serwist/next` no funciona con Turbopack**: por eso `dev` y `build` llevan `--webpack`.
- **No pidas permiso de notificaciones al abrir la app**: solo cuando la persona toca "Activar avisos".
- **iPhone**: Web Push solo con la app instalada en la pantalla de inicio (iOS 16.4+); la interfaz lo explica, el código no lo puede forzar.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `git tag -l 'step-*'` lists `step-17-recurrencia`, `step-18-recordatorios-datos`, `step-19-recordatorios-ui`, `step-20-materializacion`, `step-21-despachador`, `step-22-pwa-manifiesto`, `step-23-pwa-service-worker`, `step-24-avisos-suscripcion`.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `app/.env.example` updated if this epic added a variable.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
- [ ] Si esta épica cierra una fase del brief: resumen corto al fundador (qué funciona, cómo probarlo, qué se decidió en `DECISIONES.md`, qué necesita) y `PENDIENTES.md` al día.
