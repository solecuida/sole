# Epic 04: El día a día

> "Hoy" muestra y resuelve lo del día (también sin conexión), con consejo del día, calendario, bitácora en menos de 15 segundos, cuidado de quien cuida y la cuenta con descarga y borrado.

| | |
|---|---|
| **Epic id** | `04-dia-a-dia` |
| **Tasks** | `E4-T1` … `E4-T9` (pasos 25–33 de `blueprint.md` §9) |
| **Fase del brief** | Fase 2 del brief, segunda mitad (F2, F4, F6, F8, F13 y sin conexión). |
| **Depends on** | 03-recordatorios-y-avisos |
| **Unlocks** | 05-informes-y-escucha |
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
app/src/server/today/today.ts                                # NUEVO en E4-T1
app/src/app/(app)/hoy/page.tsx                               # existe — se edita en E4-T1
app/src/components/today/occurrence-item.tsx                 # NUEVO en E4-T1
app/src/app/api/occurrences/mark/route.ts                    # NUEVO en E4-T1
app/tests/db/today.test.ts                                   # NUEVO en E4-T1
app/src/server/today/tips.ts                                 # NUEVO en E4-T2
app/src/components/today/tip-card.tsx                        # NUEVO en E4-T2
app/tests/unit/tips.test.ts                                  # NUEVO en E4-T2
app/tests/e2e/today.spec.ts                                  # NUEVO en E4-T2
app/src/lib/offline/outbox.ts                                # NUEVO en E4-T3
app/src/components/today/offline-sync.tsx                    # NUEVO en E4-T3
app/tests/e2e/offline-queue.spec.ts                          # NUEVO en E4-T3
app/src/app/~offline/page.tsx                                # NUEVO en E4-T4
app/src/sw.ts                                                # existe — se edita en E4-T4
app/tests/e2e/offline-reload.spec.ts                         # NUEVO en E4-T4
app/src/server/calendar/calendar.ts                          # NUEVO en E4-T5
app/src/app/(app)/calendario/page.tsx                        # NUEVO en E4-T5
app/src/components/calendar/month-grid.tsx                   # NUEVO en E4-T5
app/tests/unit/calendar.test.ts                              # NUEVO en E4-T5
app/tests/e2e/calendar.spec.ts                               # NUEVO en E4-T5
app/src/server/journal/journal.ts                            # NUEVO en E4-T6
app/src/app/(app)/bitacora/page.tsx                          # NUEVO en E4-T6
app/src/components/journal/journal-form.tsx                  # NUEVO en E4-T6
app/tests/db/journal.test.ts                                 # NUEVO en E4-T6
app/tests/e2e/journal.spec.ts                                # NUEVO en E4-T6
app/src/server/selfcare/selfcare.ts                          # NUEVO en E4-T7
app/src/app/(app)/para-ti/page.tsx                           # NUEVO en E4-T7
app/src/components/selfcare/respiro-dialog.tsx               # NUEVO en E4-T7
app/tests/db/selfcare.test.ts                                # NUEVO en E4-T7
app/tests/e2e/selfcare.spec.ts                               # NUEVO en E4-T7
app/src/server/account/export.ts                             # NUEVO en E4-T8
app/src/app/api/cuenta/exportar/route.ts                     # NUEVO en E4-T8
app/src/app/(app)/cuenta/page.tsx                            # NUEVO en E4-T8
app/tests/db/account-export.test.ts                          # NUEVO en E4-T8
app/src/server/account/lifecycle.ts                          # NUEVO en E4-T9
app/src/components/account/restore-account.tsx               # NUEVO en E4-T9
app/src/app/(app)/layout.tsx                                 # existe — se edita en E4-T9
app/tests/db/account-lifecycle.test.ts                       # NUEVO en E4-T9
```

Everything outside this subtree is out of scope (leer otros archivos está bien; modificarlos no). If a task seems to require editing a file not listed here, stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entidad | Qué toca esta épica | Notas |
|---|---|---|
| `reminder_occurrences`, `occurrence_marks` | marcar por RPC `mark_occurrence` con `idempotencyKey` | `via` = `app`, `push`, `offline_sync` |
| `tips` | consejo del día; actividad aceptada → recordatorio `once` con `source = 'tip'` | |
| `journal_entries` | una por círculo y día; `note_enc` cifrada | |
| `selfcare_checkins` | una por usuaria y día | privada siempre |
| `resources` | solo `verified_at` no nulo | |
| `profiles` | `deletion_requested_at`, `deactivated_at` (cliente admin) | 7 días de gracia |
| `circles` | cierre por RPC `close_circle` | silencia recordatorios |

## Contracts

**Consumed** — already exists, do not rebuild:

| De | Interfaz | Garantía |
|---|---|---|
| `03-recordatorios-y-avisos` | `materializeOccurrences`, `expandRule`, `encryptField`/`decryptField`, `listReminders` | ver épica 03 |
| `02-cimientos` | `track`, `checkRateLimit`, fixtures e2e, `resolveActiveCircle` | ver épica 02 |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Exporta | Firma | La usan |
|---|---|---|
| `src/server/today/today.ts` → `getToday` | `(client, admin, circleId, now) => Promise<TodayData>` | 06, 08, 10 |
| `src/lib/offline/outbox.ts` → `saveSnapshot`, `readSnapshot`, `enqueueMark`, `replayOutbox`, `pendingCount` | IndexedDB `sole` | — |
| `src/server/journal/journal.ts` → `saveEntry`, `listEntries` | resultado tipado | 05, 07 |
| `src/server/selfcare/selfcare.ts` → `checkIn`, `lowStreak`, `verifiedResources` | | 05 |
| `src/server/account/export.ts` → `exportAll`, `toCsv` | | — |
| `src/server/account/lifecycle.ts` → `requestDeletion`, `getAccountState`, `restoreAccount`, `closeCircle` | | 07 |

## Conventions that bite in this area

- "Hoy" materializa su propio círculo al cargar (no depende de que el cron haya corrido).
- Cada marca lleva un `idempotencyKey` nuevo (`crypto.randomUUID()`), también las que se encolan sin conexión.
- Bienestar de la cuidadora: nunca en eventos (solo que respondió), nunca para la familia, nunca en informes compartidos.
- Lenguaje sin culpa: "Vas 3 de 5 hoy", nunca "fallaste".
- No barrel files; imports con `@/` → `app/src/` (las e2e y `scripts/lib`, relativas).
- Resultados tipados `{ ok: true, data } | { ok: false, error: { code, message } }`; textos para personas en español de Chile.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/database.md`, `server.md`, `ui.md`, `tests.md`, `web.md`, `docs.md`. Both sit in the project root — the builder copied them there from the bundle's `workspace/` before task one.

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do not re-rank by priority or by what looks quick.

### `E4-T1` — Construir "Hoy" y la marca idempotente de ítems (F2)

**Depends on:** `E3-T8`, `E3-T3` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 25

- `app/src/server/today/today.ts` — `getToday(client, admin, circleId, now)`: primero `materializeOccurrences` para ese círculo (así "Hoy" está completo aunque el cron no haya corrido); luego las ocurrencias `main` del día local agrupadas en `important`, `normal`, `whenever`, cada grupo por hora; `overdue: true` si ya pasó y sigue `pending`; `upcoming`: controles, trámites y fechas importantes de los próximos 7 días; `progress` del día y de la semana (`done` / total, sin porcentajes que culpen).
- `app/src/app/(app)/hoy/page.tsx` — reemplaza la versión mínima: saludo, persona cuidada, avance amable ("Vas 3 de 5 hoy"), grupos "Importante", "Normal", "Cuando puedas", lo hecho y "Próximos días". Mantiene la guía de instalación con `?bienvenida=1`.
- `occurrence-item.tsx` (cliente) — "Hecho", "No se hizo" (motivos "Lo rechazó", "No había", "Otro") y "Posponer" (30 min, 1 h, 2 h); actualización optimista; `fetch` a la ruta con `idempotencyKey = crypto.randomUUID()`.
- `app/src/app/api/occurrences/mark/route.ts` — `POST` `{ occurrenceId, status, reason?, snoozeMinutes?, idempotencyKey, via }` (zod) → RPC `mark_occurrence` con `createSupabaseRouteClient`; errores: sin sesión 401, `forbidden` 403, `not_found` 404, validación 422, `conflict` 409 (la misma `idempotencyKey` ya se usó para otra ocurrencia, o el círculo está cerrado). Registra `occurrence.marked`.

**Files**
- `app/src/server/today/today.ts` — new
- `app/src/app/(app)/hoy/page.tsx` — edit
- `app/src/components/today/occurrence-item.tsx` — new
- `app/src/app/api/occurrences/mark/route.ts` — new
- `app/tests/db/today.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `getToday` runs for a circle with an important 08:00 item, a normal 13:00 item and a whenever item **THE SYSTEM SHALL** return them in the groups `important`, `normal` and `whenever`, each sorted by time.
2. **WHEN** an item's time has passed and it is still `pending` **THE SYSTEM SHALL** flag it `overdue: true`, and items marked `done` SHALL be counted in `progress.day.done`.
3. **WHEN** `POST /api/occurrences/mark` receives the same `idempotencyKey` twice **THE SYSTEM SHALL** apply the change once, write one `occurrence_marks` row and answer 200 both times.
4. **WHEN** it receives `status: "not_done"` with `reason: "rechazo"` **THE SYSTEM SHALL** store `not_done_reason = 'rechazo'`, and WHEN it receives `status: "snoozed"` with `snoozeMinutes: 30` THE SYSTEM SHALL set `snoozed_until` 30 minutes ahead.
5. **WHEN** a user who is not a member posts a mark **THE SYSTEM SHALL** answer 403 with code `forbidden` and change nothing.
6. **WHEN** an `idempotencyKey` already used for another occurrence is posted, or the occurrence's circle is closed, **THE SYSTEM SHALL** answer 409 with code `conflict` and change nothing.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/today.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E4-T1: Construir 'Hoy' y la marca idempotente de ítems (F2)"
git tag step-25-hoy
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E4-T2` — Sumar el consejo del día y el cambio de círculo

**Depends on:** `E4-T1` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 26

- `app/src/server/today/tips.ts` — `tipOfDay(tips, localDate, careType)`: elige de forma determinista (hash de la fecha) entre los consejos activos que aplican a ese tipo de cuidado o a todos; `acceptActivity(client, userId, circleId, tip, now)` crea un recordatorio `once` para hoy a la próxima hora en punto, importancia `whenever`, `source = 'tip'`.
- `tip-card.tsx` (cliente) — tarjeta breve y cálida; si es actividad, botón "Aceptar" que llama a la Server Action que recibe por props.
- `hoy/page.tsx` — monta `TipCard` (con una Server Action en línea que llama a `acceptActivity`) y, si la usuaria tiene más de un círculo, un cambiador arriba ("Estás viendo: <nombre>") hecho con enlaces `?c=<id>` renderizados en el servidor.
- `app/tests/e2e/today.spec.ts` — marca hecho, no hecho con motivo y pospuesto; cambia de círculo; axe.

**Files**
- `app/src/server/today/tips.ts` — new
- `app/src/components/today/tip-card.tsx` — new
- `app/src/app/(app)/hoy/page.tsx` — edit
- `app/tests/unit/tips.test.ts` — new
- `app/tests/e2e/today.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tipOfDay` is called twice with the same date **THE SYSTEM SHALL** return the same tip, and over 30 consecutive dates SHALL return at least 2 different tips when 2 or more are active.
2. **WHEN** the tip is an activity and the user activates "Aceptar" **THE SYSTEM SHALL** show it in today's `whenever` group, backed by a one-time reminder with `source = 'tip'`.
3. **WHEN** a caregiver with two circles opens `/hoy` **THE SYSTEM SHALL** show the circle switcher, and choosing the second circle SHALL show only that circle's items.
4. **WHEN** the user activates "Hecho" on an item **THE SYSTEM SHALL** show it as done without a full page reload, and "No se hizo" SHALL offer the reasons "Lo rechazó", "No había" and "Otro".
5. **WHEN** axe runs on `/hoy` **THE SYSTEM SHALL** report 0 violations.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/tips.test.ts
pnpm -C app test:e2e tests/e2e/today.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E4-T2: Sumar el consejo del día y el cambio de círculo"
git tag step-26-hoy-consejos-circulos
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E4-T3` — Encolar marcas sin conexión y reenviarlas al volver la señal

**Depends on:** `E4-T2` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 27

- `app/src/lib/offline/outbox.ts` — base IndexedDB `sole` (con `idb`) y dos almacenes: `snapshot` (clave: id del círculo; valor: los datos de "Hoy" + `savedAt`) y `outbox` (clave: `idempotencyKey`). `saveSnapshot`, `readSnapshot`, `enqueueMark`, `pendingCount`, `replayOutbox(fetchFn)`: reenvía cada marca con `via: "offline_sync"`; 2xx, 403, 404 o 422 → la saca de la cola; error de red o 5xx → la deja; 401 → se detiene y deja todo.
- `occurrence-item.tsx` — si el `fetch` falla por red, encola y muestra "Guardado sin conexión · se enviará cuando vuelva la señal".
- `offline-sync.tsx` (cliente) — guarda el snapshot cada vez que "Hoy" carga con conexión; escucha `online` y reintenta al montar; muestra "Sin conexión" en una región `aria-live="polite"` y cuántas marcas esperan.
- `hoy/page.tsx` — monta `OfflineSync` con los datos del día.

**Files**
- `app/src/lib/offline/outbox.ts` — new
- `app/src/components/today/offline-sync.tsx` — new
- `app/src/components/today/occurrence-item.tsx` — edit
- `app/src/app/(app)/hoy/page.tsx` — edit
- `app/tests/e2e/offline-queue.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** the browser goes offline after `/hoy` loaded and the user marks an item "Hecho" **THE SYSTEM SHALL** show "Guardado sin conexión · se enviará cuando vuelva la señal" and keep the item shown as done.
2. **WHEN** the browser comes back online **THE SYSTEM SHALL** replay the queued mark with `via = 'offline_sync'`, the occurrence SHALL be `done` in the database, and the pending counter SHALL disappear.
3. **WHEN** the same queued mark is replayed twice **THE SYSTEM SHALL** keep exactly one `occurrence_marks` row for its `idempotencyKey`.
4. **WHEN** the browser is offline **THE SYSTEM SHALL** announce "Sin conexión" in an `aria-live="polite"` region.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test:e2e tests/e2e/offline-queue.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E4-T3: Encolar marcas sin conexión y reenviarlas al volver la señal"
git tag step-27-sin-conexion-cola
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E4-T4` — Mostrar "Hoy" guardado cuando no hay señal

**Depends on:** `E4-T3` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 28

- `app/src/app/~offline/page.tsx` (cliente) — lee el último snapshot de IndexedDB y muestra la lista del día en modo lectura, con la hora en que se guardó ("Guardado a las 09:12"), y los botones de marcar que encolan como en "Hoy". Sin snapshot: "Todavía no hay nada guardado en este teléfono. Abre Sole con conexión una vez."
- `app/src/sw.ts` — agrega `fallbacks: { entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }] }`.

**Files**
- `app/src/app/~offline/page.tsx` — new
- `app/src/sw.ts` — edit
- `app/tests/e2e/offline-reload.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `/hoy` was opened once online and the page is reloaded with the network offline **THE SYSTEM SHALL** show the saved list of the day with the text "Guardado a las" followed by the save time.
2. **WHEN** a navigation to a page never visited happens offline **THE SYSTEM SHALL** serve the `/~offline` page instead of the browser's error page.
3. **WHEN** no snapshot exists and the offline page opens **THE SYSTEM SHALL** show "Todavía no hay nada guardado en este teléfono. Abre Sole con conexión una vez."

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test:e2e tests/e2e/offline-reload.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E4-T4: Mostrar 'Hoy' guardado cuando no hay señal"
git tag step-28-sin-conexion-lectura
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E4-T5` — Mostrar el calendario de mes y de semana (F4)

**Depends on:** `E4-T1` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 29

- `app/src/server/calendar/calendar.ts` — `buildMonth(reminders, tz, year, month)` y `buildWeek(reminders, tz, isoDate)` con `expandRule`; semanas de lunes a domingo; cada día con sus ítems (título, hora, importancia, tipo).
- `calendario/page.tsx` — `?vista=mes|semana&fecha=YYYY-MM-DD`; anterior/siguiente; selector "Mes" / "Semana"; en cada día, enlace "Agregar" hacia `/recordatorios/editar?fecha=<día>`.
- `month-grid.tsx` — tabla con encabezados de día (`<th scope="col">`); en pantallas angostas la semana se ve como lista.

**Files**
- `app/src/server/calendar/calendar.ts` — new
- `app/src/app/(app)/calendario/page.tsx` — new
- `app/src/components/calendar/month-grid.tsx` — new
- `app/tests/unit/calendar.test.ts` — new
- `app/tests/e2e/calendar.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `buildMonth` runs for March 2027 with a weekly Monday reminder **THE SYSTEM SHALL** place it on every Monday of March 2027 and on no other day, in weeks that start on Monday.
2. **WHEN** `buildWeek` runs for a week that contains a yearly birthday **THE SYSTEM SHALL** include the birthday on its day.
3. **WHEN** the user opens `/calendario?vista=semana` **THE SYSTEM SHALL** show 7 day columns with that week's items, and the "Mes" control SHALL switch back to the month grid.
4. **WHEN** the user activates "Agregar" on a day **THE SYSTEM SHALL** open `/recordatorios/editar` with `fecha` set to that day.
5. **WHEN** axe runs on both calendar views **THE SYSTEM SHALL** report 0 violations.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/calendar.test.ts
pnpm -C app test:e2e tests/e2e/calendar.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E4-T5: Mostrar el calendario de mes y de semana (F4)"
git tag step-29-calendario-f4
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E4-T6` — Registrar la bitácora diaria en menos de 15 segundos (F6)

**Depends on:** `E4-T1` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 30

- `app/src/server/journal/journal.ts` — `saveEntry(client, userId, circleId, input, now)`: una entrada por círculo y día local (`upsert` sobre `circle_id, entry_date`); zod con los valores exactos de la migración (`bueno|regular|dificil`; ánimos `tranquila|feliz|triste|irritable|ansiosa|desorientada|con_dolor|cansada|otro`; sueño y comida `bien|regular|poco`); nota ≤ 1000 cifrada con contexto `"journal_entries.note"`. `listEntries` descifra. Registra `journal.saved` con `duration_ms` y `has_note`.
- `journal-form.tsx` (cliente) — botones grandes, una sola pantalla: día, ánimos (multi), sueño, comida, nota opcional con la pista "Puedes dictar con el micrófono del teclado". Sin vocabulario clínico.
- `bitacora/page.tsx` — formulario de hoy arriba y los últimos 14 días abajo.

**Files**
- `app/src/server/journal/journal.ts` — new
- `app/src/app/(app)/bitacora/page.tsx` — new
- `app/src/components/journal/journal-form.tsx` — new
- `app/tests/db/journal.test.ts` — new
- `app/tests/e2e/journal.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a caregiver saves today's entry with day `regular`, moods `tranquila` and `con_dolor`, sleep `poco`, food `bien` and a note **THE SYSTEM SHALL** store one `journal_entries` row whose `note_enc` starts with `v1.` and return the decrypted note on read.
2. **WHEN** the caregiver saves again on the same local day **THE SYSTEM SHALL** update that same row.
3. **WHEN** a mood outside the allowed list is sent **THE SYSTEM SHALL** return `{ ok: false, error: { code: "validation_failed" } }`.
4. **WHEN** a `family` member reads the circle's entries **THE SYSTEM SHALL** return them, and WHEN a non-member reads THE SYSTEM SHALL return zero rows.
5. **WHEN** `tests/e2e/journal.spec.ts` records an entry **THE SYSTEM SHALL** need at most 5 taps before "Guardar" (H2: under 15 seconds), and the note field SHALL show the hint "Puedes dictar con el micrófono del teclado".
6. **WHEN** axe runs on `/bitacora` **THE SYSTEM SHALL** report 0 violations.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/journal.test.ts
pnpm -C app test:e2e tests/e2e/journal.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E4-T6: Registrar la bitácora diaria en menos de 15 segundos (F6)"
git tag step-30-bitacora-f6
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E4-T7` — Cuidar a quien cuida: pregunta, respiro y recursos (F8)

**Depends on:** `E4-T1` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 31

- `app/src/server/selfcare/selfcare.ts` — `checkIn(client, userId, score, now)` (1 a 5; `upsert` por día local); `lowStreak(client, userId, now)` → `true` si los últimos 3 días consecutivos tienen puntaje ≤ 2; `verifiedResources(client)` (solo `verified_at` no nulo). Registra `selfcare.checked_in` **sin** el puntaje.
- `para-ti/page.tsx` — "¿Cómo estás tú hoy?" (1 a 5 con palabras, no solo números), "Esto es solo para ti: no lo ve nadie más"; con racha baja, mensaje suave ("Han sido días pesados. No tienes que poder con todo.") y recursos; botón "Necesito un respiro"; directorio de recursos con su fuente y la fecha de verificación.
- `respiro-dialog.tsx` — `Dialog` con una pausa breve (respirar 1 minuto, con temporizador opcional que respeta `prefers-reduced-motion`), recursos verificados y contactos de emergencia del círculo.

**Files**
- `app/src/server/selfcare/selfcare.ts` — new
- `app/src/app/(app)/para-ti/page.tsx` — new
- `app/src/components/selfcare/respiro-dialog.tsx` — new
- `app/tests/db/selfcare.test.ts` — new
- `app/tests/e2e/selfcare.spec.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** the caregiver answers the daily check-in with score 4 **THE SYSTEM SHALL** store one `selfcare_checkins` row for today, and answering again the same day SHALL update it instead of adding another.
2. **WHEN** the last 3 consecutive days have scores of 2 or less **THE SYSTEM SHALL** return `lowStreak: true`, and `/para-ti` SHALL show the message "Han sido días pesados. No tienes que poder con todo." without the words `diagnóstico` or `depresión`.
3. **WHEN** a `family` member of the same circle selects `selfcare_checkins` **THE SYSTEM SHALL** return zero rows.
4. **WHEN** "Necesito un respiro" is activated **THE SYSTEM SHALL** open a dialog with a pause exercise and the verified resources, operable with the keyboard alone.
5. **WHEN** `/para-ti` lists resources **THE SYSTEM SHALL** show only resources with `verified_at` set, each with its source link and check date.
6. **WHEN** axe runs on `/para-ti` **THE SYSTEM SHALL** report 0 violations.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/selfcare.test.ts
pnpm -C app test:e2e tests/e2e/selfcare.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E4-T7: Cuidar a quien cuida: pregunta, respiro y recursos (F8)"
git tag step-31-para-ti-f8
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E4-T8` — Ver consentimientos y descargar todos mis datos (F13)

**Depends on:** `E4-T6`, `E4-T7` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 32

- `app/src/server/account/export.ts` — `exportAll(client, userId)` → perfil, consentimientos, círculos, recordatorios (medicamentos descifrados), ocurrencias, bitácora (notas descifradas), bienestar, tareas y contactos (notas descifradas) de los círculos donde es miembro; `toCsv(rows)` con encabezado, separador `,`, comillas dobles y BOM UTF-8. Tablas CSV: `recordatorios`, `cumplimiento`, `bitacora`, `tareas`, `contactos`, `bienestar`.
- `app/src/app/api/cuenta/exportar/route.ts` — `GET ?formato=json` o `?formato=csv&tabla=<tabla>`; sin sesión 401; `content-disposition: attachment; filename="sole-<tabla|datos>-<fecha>.<ext>"`; `cache-control: no-store`.
- `cuenta/page.tsx` — consentimientos vigentes con fecha y botón para retirar el de investigación ("Puedes seguir usando Sole igual"); descargas JSON y CSV; las secciones de borrado y cierre de círculo llegan en paso 33 (`cuenta-borrado`).

**Files**
- `app/src/server/account/export.ts` — new
- `app/src/app/api/cuenta/exportar/route.ts` — new
- `app/src/app/(app)/cuenta/page.tsx` — new
- `app/tests/db/account-export.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** an authenticated user requests `GET /api/cuenta/exportar?formato=json` **THE SYSTEM SHALL** answer `application/json` with `content-disposition: attachment` containing the profile, consents, circles, reminders with decrypted medication names, occurrences, journal entries with decrypted notes, self-care check-ins, tasks and contacts of that user.
2. **WHEN** `formato=csv&tabla=bitacora` is requested **THE SYSTEM SHALL** answer `text/csv; charset=utf-8` with a header row and one row per journal entry.
3. **WHEN** the export is requested without a session **THE SYSTEM SHALL** answer 401.
4. **WHEN** user A exports **THE SYSTEM SHALL** include no row from circles where A is not a member.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/account-export.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E4-T8: Ver consentimientos y descargar todos mis datos (F13)"
git tag step-32-cuenta-datos
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E4-T9` — Borrar la cuenta con gracia de 7 días y cerrar círculo

**Depends on:** `E4-T8` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 33

- `app/src/server/account/lifecycle.ts` — `requestDeletion(client, admin, userId, accessToken)`: con el cliente admin pone `deletion_requested_at` y `deactivated_at`, y cierra todas las sesiones (`auth.admin.signOut(accessToken, "global")`); registra `account.deletion_requested`. `getAccountState(client)` → `{ status: "active" }` o `{ status: "pending_deletion", purgeAfter }` (pedido + 7 días). `restoreAccount(admin, userId)` limpia ambos campos. `closeCircle(client, circleId, reason)` → RPC `close_circle`.
- `restore-account.tsx` — "Pediste borrar tu cuenta. Se borrará definitivamente el <fecha>." con "Recuperar mi cuenta" y "Mantener el borrado".
- `(app)/layout.tsx` — si `getAccountState` dice `pending_deletion`, muestra `RestoreAccount` en vez de la app.
- `cuenta/page.tsx` — "Borrar mi cuenta" con confirmación escrita (tan fácil como crearla) y explicación de los 7 días y de que se borran también los círculos que creó, con todo lo que ven sus familiares ("Si alguien de tu familia usa estos círculos, también dejará de verlos"); "Cerrar un círculo" con motivos; si el motivo es fallecimiento, el texto es especialmente cuidadoso ("Lo sentimos mucho. Ya silenciamos todos los recordatorios.") y ofrece primero descargar la bitácora y los informes.

**Files**
- `app/src/server/account/lifecycle.ts` — new
- `app/src/components/account/restore-account.tsx` — new
- `app/src/app/(app)/layout.tsx` — edit
- `app/src/app/(app)/cuenta/page.tsx` — edit
- `app/tests/db/account-lifecycle.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `requestDeletion` runs **THE SYSTEM SHALL** set `deletion_requested_at` and `deactivated_at`, the user's refresh token SHALL stop working, and `materializeOccurrences` SHALL create nothing more for that user's circles.
2. **WHEN** `getAccountState` runs for that user within 7 days **THE SYSTEM SHALL** return `status: "pending_deletion"` with `purgeAfter` 7 days after the request, and `restoreAccount` SHALL clear both fields.
3. **WHEN** `closeCircle` runs with reason `fallecimiento` **THE SYSTEM SHALL** set `closed_at`, set `active = false` on every reminder of the circle and mark its `pending` and `snoozed` occurrences `skipped`.
4. **WHEN** a `family` member calls `closeCircle` **THE SYSTEM SHALL** return `{ ok: false, error: { code: "forbidden" } }`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/account-lifecycle.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E4-T9: Borrar la cuenta con gracia de 7 días y cerrar círculo"
git tag step-33-cuenta-borrado
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `pnpm -C app test` runs at the end of this epic **THE SYSTEM SHALL** exit 0 with the suites `today`, `journal`, `selfcare`, `account-export` and `account-lifecycle` passing.
2. **WHEN** `tests/e2e/offline-queue.spec.ts` runs **THE SYSTEM SHALL** mark an item offline and find it `done` in the database after reconnecting.

```bash
pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test
pnpm -C app test:e2e tests/e2e/today.spec.ts
pnpm -C app test:e2e tests/e2e/offline-queue.spec.ts
```

Run from the project root. Both criteria are decided by these commands.

## Pitfalls

- **La página sin conexión necesita que el service worker la haya precargado**: por eso `fallbacks` se agrega recién cuando `/~offline` existe.
- **Playwright `context.setOffline(true)` no apaga el service worker**: la prueba de recarga sin conexión corre solo en Chromium.
- **El borrado cierra sesiones con el JWT de la usuaria**: guárdalo antes de marcar el perfil.
- **Cierre por fallecimiento**: el texto se revisa con cuidado; primero ofrecer descargar, nunca celebrar ni culpar.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `git tag -l 'step-*'` lists `step-25-hoy`, `step-26-hoy-consejos-circulos`, `step-27-sin-conexion-cola`, `step-28-sin-conexion-lectura`, `step-29-calendario-f4`, `step-30-bitacora-f6`, `step-31-para-ti-f8`, `step-32-cuenta-datos`, `step-33-cuenta-borrado`.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `app/.env.example` updated if this epic added a variable.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
- [ ] Si esta épica cierra una fase del brief: resumen corto al fundador (qué funciona, cómo probarlo, qué se decidió en `DECISIONES.md`, qué necesita) y `PENDIENTES.md` al día.
