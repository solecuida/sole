# Epic 10: Si sobra tiempo: familiares, organizaciones y pulido

> Los familiares se suman por invitación, verifican ítems, toman tareas y reciben avisos configurables; las organizaciones ven su panel agregado; el rendimiento queda medido y los documentos cerrados.

| | |
|---|---|
| **Epic id** | `10-si-sobra-tiempo` |
| **Tasks** | `E10-T1` … `E10-T5` (pasos 66–70 de `blueprint.md` §9) |
| **Fase del brief** | Fase 8 del brief. Opcional: se construye solo si sobra tiempo o cuota. |
| **Depends on** | 08-ampliacion, 09-fuera-de-la-app |
| **Unlocks** | nada — es la última |
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
app/src/server/family/invitations.ts                         # NUEVO en E10-T1
app/src/app/(app)/circulo/page.tsx                           # NUEVO en E10-T1
app/src/app/invitar/[token]/page.tsx                         # NUEVO en E10-T1
app/src/server/fake-doors/doors.ts                           # existe — se edita en E10-T1
app/tests/db/family-invitations.test.ts                      # NUEVO en E10-T1
app/src/server/today/today.ts                                # existe — se edita en E10-T2
app/src/components/today/occurrence-item.tsx                 # existe — se edita en E10-T2
app/src/server/tasks/tasks.ts                                # existe — se edita en E10-T2
app/tests/db/family-permissions.test.ts                      # NUEVO en E10-T2
app/src/server/family/feed.ts                                # NUEVO en E10-T3
app/src/app/(app)/circulo/actividad/page.tsx                 # NUEVO en E10-T3
app/src/server/reminders/dispatch.ts                         # existe — se edita en E10-T3
app/src/server/cared-link/emergency.ts                       # existe — se edita en E10-T3
app/tests/db/family-notifications.test.ts                    # NUEVO en E10-T3
app/src/server/org/org-dashboard.ts                          # NUEVO en E10-T4
app/src/app/org/[token]/page.tsx                             # NUEVO en E10-T4
app/src/app/admin/organizaciones/page.tsx                    # existe — se edita en E10-T4
app/tests/db/org-dashboard.test.ts                           # NUEVO en E10-T4
app/tests/e2e/performance.spec.ts                            # NUEVO en E10-T5
PENDIENTES.md                                                # existe — se edita en E10-T5
DECISIONES.md                                                # existe — se edita en E10-T5
docs/diseno/familiares.md                                    # existe — se edita en E10-T5
docs/diseno/admin-y-organizaciones.md                        # existe — se edita en E10-T5
```

Everything outside this subtree is out of scope (leer otros archivos está bien; modificarlos no). If a task seems to require editing a file not listed here, stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entidad | Qué toca esta épica | Notas |
|---|---|---|
| `invitations` | alta, aceptación (RPC `accept_invitation`), revocación | token hasheado, 7 días |
| `circle_members` | rol `family`, `notify_kinds` (RPC `set_member_notify_kinds`) | |
| `occurrence_marks` | "verificado por" | |
| `tasks.claimed_by` | RPC `claim_task` | |
| `organizations.dashboard_token_hash` | panel F17 | |

## Contracts

**Consumed** — already exists, do not rebuild:

| De | Interfaz | Garantía |
|---|---|---|
| `04-dia-a-dia` | `getToday` | ver épica 04 |
| `08-ampliacion` | `listTasks`, `triggerEmergency` | ver épica 08 |
| `03-recordatorios-y-avisos` | `runDispatch` | ver épica 03 |
| `05-informes-y-escucha` | `requireAdmin`, `summarize` | ver épica 05 |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Exporta | Firma | La usan |
|---|---|---|
| `src/server/family/invitations.ts` → `createInvitation`, `acceptInvitation`, `revokeInvitation`, `updateNotifyKinds` | | — |
| `src/server/family/feed.ts` → `circleFeed` | | — |
| `src/server/org/org-dashboard.ts` → `createDashboardLink`, `orgDashboard` | | — |

## Conventions that bite in this area

- El familiar nunca cambia configuración, recordatorios ni permisos; el bienestar de la cuidadora nunca se le muestra.
- Ningún agregado de F17 muestra grupos de menos de 5 personas.
- No barrel files; imports con `@/` → `app/src/` (las e2e y `scripts/lib`, relativas).
- Resultados tipados `{ ok: true, data } | { ok: false, error: { code, message } }`; textos para personas en español de Chile.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/database.md`, `server.md`, `ui.md`, `tests.md`, `web.md`, `docs.md`. Both sit in the project root — the builder copied them there from the bundle's `workspace/` before task one.

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do not re-rank by priority or by what looks quick.

### `E10-T1` — Invitar familiares al círculo por enlace (F16)

**Depends on:** `E9-T6`, `E8-T6`, `E8-T5`, `E8-T1` · **Priority:** p2 — metadata for scope cuts, not a running order · **Paso de §9:** 66

Solo si sobra tiempo o cuota (fase 8). El diseño completo está en `docs/diseno/familiares.md`.
- `app/src/server/family/invitations.ts` — `createInvitation(client, userId, circleId)`: límite `invitation`; token de 32 bytes base64url, guarda `sha256` hex, vence en 7 días; devuelve `<APP_URL>/invitar/<token>`; registra `invitation.created`. `acceptInvitation(client, token, displayName)` → RPC `accept_invitation` (errores → `invitation_invalid`). `revokeInvitation`. `updateNotifyKinds` → RPC `set_member_notify_kinds`.
- `circulo/page.tsx` — miembros con su rol, "Invitar a un familiar", invitaciones pendientes con "Revocar", y por familiar los avisos que recibe (por defecto fechas importantes, controles y emergencias).
- `invitar/[token]/page.tsx` — exige sesión (si no, `/entrar?next=`) y consentimientos; muestra a qué círculo se suma y qué podrá hacer; botón "Unirme".
- `doors.ts` — `FAMILY_ENABLED = true`.

**Files**
- `app/src/server/family/invitations.ts` — new
- `app/src/app/(app)/circulo/page.tsx` — new
- `app/src/app/invitar/[token]/page.tsx` — new
- `app/src/server/fake-doors/doors.ts` — edit
- `app/tests/db/family-invitations.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a caregiver creates an invitation **THE SYSTEM SHALL** return a link `<APP_URL>/invitar/<token>` valid for 7 days and store only the token's SHA-256 hex.
2. **WHEN** a signed-in user with the required consents accepts it **THE SYSTEM SHALL** add them to the circle with role `family` and notify kinds `important_date`, `appointment` and `emergency`, and mark the invitation accepted.
3. **WHEN** the token is expired, revoked or already used **THE SYSTEM SHALL** refuse with `invitation_invalid`.
4. **WHEN** the same caregiver creates an 11th invitation within 24 hours **THE SYSTEM SHALL** return `rate_limited`.
5. **WHEN** `FAMILY_ENABLED` is true **THE SYSTEM SHALL** have `visibleDoors()` called without arguments exclude `invitar-familiar`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/family-invitations.test.ts
pnpm -C app test tests/db/fake-doors.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E10-T1: Invitar familiares al círculo por enlace (F16)"
git tag step-66-familiares-invitaciones
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E10-T2` — Dejar que el familiar verifique y tome tareas (F16)

**Depends on:** `E10-T1` · **Priority:** p2 — metadata for scope cuts, not a running order · **Paso de §9:** 67

- `today.ts` — cada ítem `done` trae `verifiedBy` (el `display_name` de `circle_members` de quien lo marcó, según `occurrence_marks.marked_by`) cuando no fue la propia usuaria; el familiar ve "Hoy" del círculo.
- `occurrence-item.tsx` — muestra "Verificado por <nombre>".
- `tasks.ts` — `claimTask(client, taskId)` → RPC `claim_task`; `listTasks` trae `claimedByName`; en la página de tareas se lee "Yo me encargo" / "Se encarga <nombre>".

**Files**
- `app/src/server/today/today.ts` — edit
- `app/src/components/today/occurrence-item.tsx` — edit
- `app/src/server/tasks/tasks.ts` — edit
- `app/tests/db/family-permissions.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** a family member marks an occurrence `done` **THE SYSTEM SHALL** store `done_by` as that member, and `getToday` for the caregiver SHALL return `verifiedBy` with the member's `display_name`.
2. **WHEN** a family member tries to update a reminder, a member's role or the circle's fields **THE SYSTEM SHALL** change nothing.
3. **WHEN** a family member claims a task **THE SYSTEM SHALL** set `claimed_by` to that member, and `listTasks` for the caregiver SHALL return `claimedByName` with the member's name.
4. **WHEN** a family member reads the circle's report through `summarize` with audience `family` **THE SYSTEM SHALL** get no self-care value, and selecting `selfcare_checkins` SHALL return zero rows.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/family-permissions.test.ts
pnpm -C app test tests/db/today.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E10-T2: Dejar que el familiar verifique y tome tareas (F16)"
git tag step-67-familiares-permisos
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E10-T3` — Mostrar la actividad del círculo y avisar a la familia (F16)

**Depends on:** `E10-T2` · **Priority:** p2 — metadata for scope cuts, not a running order · **Paso de §9:** 68

- `feed.ts` — `circleFeed(client, circleId, limit = 50)`: marcas (`occurrence_marks` con nombre de quien marcó), tareas tomadas o cerradas e hitos, del más nuevo al más antiguo; nunca bienestar.
- `circulo/actividad/page.tsx` — la lista, con fecha y hora locales.
- `dispatch.ts` — destinatarias: cuidadoras + familiares cuyo `notify_kinds` incluye el `kind` del recordatorio.
- `emergency.ts` — además de las cuidadoras, avisa a familiares con `emergency` en `notify_kinds`.

**Files**
- `app/src/server/family/feed.ts` — new
- `app/src/app/(app)/circulo/actividad/page.tsx` — new
- `app/src/server/reminders/dispatch.ts` — edit
- `app/src/server/cared-link/emergency.ts` — edit
- `app/tests/db/family-notifications.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `circleFeed` runs **THE SYSTEM SHALL** list marks with the name of who made them, claimed or closed tasks and milestones, newest first, with no self-care data.
2. **WHEN** a reminder of kind `appointment` fires **THE SYSTEM SHALL** notify family members whose `notify_kinds` include `appointment` and SHALL not notify a family member whose `notify_kinds` exclude it.
3. **WHEN** an emergency is triggered from the cared link **THE SYSTEM SHALL** notify every caregiver and every family member with `emergency` in `notify_kinds`.
4. **WHEN** a family member calls `set_member_notify_kinds` for another member **THE SYSTEM SHALL** reject it with `42501`, and the caregiver's call SHALL store the new kinds.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/family-notifications.test.ts
pnpm -C app test tests/db/dispatch.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E10-T3: Mostrar la actividad del círculo y avisar a la familia (F16)"
git tag step-68-familiares-actividad
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E10-T4` — Abrir el panel agregado para organizaciones (F17)

**Depends on:** `E10-T3`, `E5-T8` · **Priority:** p2 — metadata for scope cuts, not a running order · **Paso de §9:** 69

- `org-dashboard.ts` — `createDashboardLink(client, orgId)` (admin `aal2`; token de 32 bytes base64url; guarda `sha256` hex en `organizations.dashboard_token_hash`; muestra el enlace una sola vez); `orgDashboard(admin, token, now)`: resuelve el hash y calcula, solo con usuarias de ese `org_code`, personas que llegaron, activas por semana, retención en las semanas 1, 4 y 8 y promedio de días activos; todo grupo con menos de 5 personas se reemplaza por "Menos de 5 personas: no se muestra".
- `org/[token]/page.tsx` — pública, `robots: noindex`, solo agregados; token desconocido → `notFound()`.
- `admin/organizaciones/page.tsx` — botón "Generar enlace del panel".

**Files**
- `app/src/server/org/org-dashboard.ts` — new
- `app/src/app/org/[token]/page.tsx` — new
- `app/src/app/admin/organizaciones/page.tsx` — edit
- `app/tests/db/org-dashboard.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** an `aal2` admin generates a dashboard link **THE SYSTEM SHALL** store only the SHA-256 hex of the token in `organizations.dashboard_token_hash` and return the link once.
2. **WHEN** `orgDashboard` resolves a valid token **THE SYSTEM SHALL** return only aggregates for users whose `org_code` matches that organization.
3. **WHEN** a group has fewer than 5 users **THE SYSTEM SHALL** return "Menos de 5 personas: no se muestra" instead of the number.
4. **WHEN** the token is unknown **THE SYSTEM SHALL** return null and the page SHALL answer 404.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/org-dashboard.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E10-T4: Abrir el panel agregado para organizaciones (F17)"
git tag step-69-panel-organizaciones-f17
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E10-T5` — Medir rendimiento y cerrar documentos de fase 8

**Depends on:** `E10-T4` · **Priority:** p2 — metadata for scope cuts, not a running order · **Paso de §9:** 70

- `performance.spec.ts` — solo en el proyecto `android-gama-media`: carga `/hoy` con una usuaria con datos, suma `(await response.request().sizes()).responseBodySize` de las respuestas de tipo script y lee el LCP con `PerformanceObserver` (`largest-contentful-paint`).
- `PENDIENTES.md` — estado final: lo que no se construyó, por prioridad, con instrucciones para retomarlo.
- `DECISIONES.md` — agrega las decisiones de la fase 8.
- `docs/diseno/familiares.md` y `docs/diseno/admin-y-organizaciones.md` — sección `## Estado` que dice qué quedó construido, para que el diseño coincida con lo construido (definición de terminado, punto 7).

**Files**
- `app/tests/e2e/performance.spec.ts` — new
- `PENDIENTES.md` — edit
- `DECISIONES.md` — edit
- `docs/diseno/familiares.md` — edit
- `docs/diseno/admin-y-organizaciones.md` — edit

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/e2e/performance.spec.ts` loads `/hoy` on the `android-gama-media` project **THE SYSTEM SHALL** transfer less than 350 KB of compressed JavaScript and report a Largest Contentful Paint under 2500 ms against the local production build.
2. **WHEN** `docs/diseno/familiares.md` and `docs/diseno/admin-y-organizaciones.md` are read **THE SYSTEM SHALL** contain the heading `## Estado`.
3. **WHEN** `tests/unit/docs-diseno.test.ts` runs **THE SYSTEM SHALL** still pass.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test:e2e tests/e2e/performance.spec.ts
grep -q "## Estado" docs/diseno/familiares.md
grep -q "## Estado" docs/diseno/admin-y-organizaciones.md
pnpm -C app test tests/unit/docs-diseno.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E10-T5: Medir rendimiento y cerrar documentos de fase 8"
git tag step-70-pulido-rendimiento
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `pnpm -C app test` runs at the end of this epic **THE SYSTEM SHALL** exit 0 with `family-invitations`, `family-permissions`, `family-notifications` and `org-dashboard` passing.
2. **WHEN** `tests/e2e/performance.spec.ts` runs **THE SYSTEM SHALL** report less than 350 KB of compressed JavaScript on `/hoy`.

```bash
pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test
pnpm -C app test:e2e tests/e2e/performance.spec.ts
```

Run from the project root. Both criteria are decided by these commands.

## Pitfalls

- **Activar F16 cambia la puerta falsa**: `FAMILY_ENABLED = true` oculta "invitar familiar"; la prueba de puertas falsas lo comprueba sola.
- **Si no alcanza el tiempo**, esta épica queda completa en `docs/diseno/familiares.md` y en `PENDIENTES.md`; nada de la app depende de ella.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `git tag -l 'step-*'` lists `step-66-familiares-invitaciones`, `step-67-familiares-permisos`, `step-68-familiares-actividad`, `step-69-panel-organizaciones-f17`, `step-70-pulido-rendimiento`.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `app/.env.example` updated if this epic added a variable.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
- [ ] Si esta épica cierra una fase del brief: resumen corto al fundador (qué funciona, cómo probarlo, qué se decidió en `DECISIONES.md`, qué necesita) y `PENDIENTES.md` al día.
