# Epic 07: Despliegue y operación

> Los trabajos diarios borran cuentas vencidas y avisan inactividad, la app está lista para Vercel en São Paulo sin vistas previas, hay respaldo cifrado nocturno, keep-alive, CodeQL y ZAP, y el fundador tiene su manual y su lista de lanzamiento.

| | |
|---|---|
| **Epic id** | `07-despliegue` |
| **Tasks** | `E7-T1` … `E7-T5` (pasos 49–53 de `blueprint.md` §9) |
| **Fase del brief** | Fase 5 del brief. |
| **Depends on** | 06-seguridad-y-calidad |
| **Unlocks** | 08-ampliacion, 09-fuera-de-la-app |
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
app/src/server/email/resend.ts                               # NUEVO en E7-T1
app/src/server/jobs/daily.ts                                 # NUEVO en E7-T1
app/src/app/api/cron/daily/route.ts                          # NUEVO en E7-T1
app/tests/db/daily-jobs.test.ts                              # NUEVO en E7-T1
app/vercel.json                                              # NUEVO en E7-T2
app/src/app/robots.ts                                        # NUEVO en E7-T2
app/src/app/sitemap.ts                                       # NUEVO en E7-T2
app/src/app/api/health/route.ts                              # existe — se edita en E7-T2
app/tests/unit/deploy-config.test.ts                         # NUEVO en E7-T2
.github/workflows/backup.yml                                 # NUEVO en E7-T3
.github/workflows/keepalive.yml                              # NUEVO en E7-T3
.github/workflows/codeql.yml                                 # NUEVO en E7-T3
.github/workflows/zap.yml                                    # NUEVO en E7-T3
app/tests/unit/workflows.test.ts                             # NUEVO en E7-T3
docs/mantenimiento.md                                        # NUEVO en E7-T4
app/scripts/rotate-field-key.ts                              # NUEVO en E7-T4
app/tests/db/rotate-field-key.test.ts                        # NUEVO en E7-T4
app/tests/unit/docs-mantenimiento.test.ts                    # NUEVO en E7-T4
docs/lanzamiento.md                                          # NUEVO en E7-T5
app/.env.example                                             # existe — se edita en E7-T5
app/tests/unit/env-example.test.ts                           # NUEVO en E7-T5
PENDIENTES.md                                                # existe — se edita en E7-T5
```

Everything outside this subtree is out of scope (leer otros archivos está bien; modificarlos no). If a task seems to require editing a file not listed here, stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entidad | Qué toca esta épica | Notas |
|---|---|---|
| `profiles` | `inactivity_notice_sent_at`; purga por RPC `purge_user` | |
| `private.rate_limits` | limpieza diaria con `cleanup_rate_limits` | |
| campos `*_enc` | rotación de clave con `scripts/rotate-field-key.ts` | |

## Contracts

**Consumed** — already exists, do not rebuild:

| De | Interfaz | Garantía |
|---|---|---|
| `04-dia-a-dia` | `requestDeletion` deja `deletion_requested_at` | ver épica 04 |
| `03-recordatorios-y-avisos` | patrón de ruta de cron con `x-cron-secret` | ver épica 03 |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Exporta | Firma | La usan |
|---|---|---|
| `src/server/jobs/daily.ts` → `runDaily` | `({ admin, now, mailer }) => Promise<Counts>` | — |
| `src/server/email/resend.ts` → `Mailer`, `resendMailer` | | — |
| `docs/mantenimiento.md`, `docs/lanzamiento.md` | documentos | fundador |

## Conventions that bite in this area

- El despliegue real (cuentas, DNS, variables en Vercel, secretos de Vault, SMTP) es de la lista de lanzamiento: ningún paso toca una cuenta en línea.
- Correo de la app: Resend en `notificaciones.solecuida.com`. Nunca Zoho.
- No barrel files; imports con `@/` → `app/src/` (las e2e y `scripts/lib`, relativas).
- Resultados tipados `{ ok: true, data } | { ok: false, error: { code, message } }`; textos para personas en español de Chile.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/database.md`, `server.md`, `ui.md`, `tests.md`, `web.md`, `docs.md`. Both sit in the project root — the builder copied them there from the bundle's `workspace/` before task one.

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do not re-rank by priority or by what looks quick.

### `E7-T1` — Borrar cuentas vencidas y avisar inactividad cada día

**Depends on:** `E4-T9`, `E3-T5` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 49

- `app/src/server/email/resend.ts` — `type Mailer = (msg: { to, subject, text }) => Promise<{ sent: boolean }>`; `resendMailer()` hace `POST https://api.resend.com/emails` con `Authorization: Bearer RESEND_API_KEY` y `from: EMAIL_FROM` (`Sole <avisos@notificaciones.solecuida.com>`); sin `RESEND_API_KEY` devuelve `{ sent: false }`. Nunca Zoho.
- `app/src/server/jobs/daily.ts` — `runDaily({ admin, now, mailer })` con el bloqueo `daily`: (1) `purge_user` para perfiles con `deletion_requested_at` de hace 7 días o más; (2) aviso de inactividad a quien lleva 11 meses sin actividad y no fue avisada (correo de `auth.admin.getUserById`; asunto "Tu cuenta de Sole se borrará en 30 días"; texto con cómo evitarlo: entrar una vez; se marca `inactivity_notice_sent_at` solo si `sent: true`); (3) `purge_user` a quien lleva 12 meses inactiva **y** fue avisada hace 30 días o más; (4) `cleanup_rate_limits`. Devuelve conteos.
- `app/src/app/api/cron/daily/route.ts` — igual que el de dispatch (`POST`, `x-cron-secret`, 401 sin él) llamando a `runDaily` con `resendMailer()`.

**Files**
- `app/src/server/email/resend.ts` — new
- `app/src/server/jobs/daily.ts` — new
- `app/src/app/api/cron/daily/route.ts` — new
- `app/tests/db/daily-jobs.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `runDaily` runs 8 days after a deletion request **THE SYSTEM SHALL** remove the auth user and every row of that user in `profiles`, `circles`, `reminders`, `reminder_occurrences`, `journal_entries`, `selfcare_checkins`, `push_subscriptions` and `events`.
2. **WHEN** it runs 6 days after the request **THE SYSTEM SHALL** delete nothing for that user.
3. **WHEN** a user has been inactive for 11 months **THE SYSTEM SHALL** send one notice through the injected mailer with the subject "Tu cuenta de Sole se borrará en 30 días" and set `inactivity_notice_sent_at`, and a second run SHALL send no other notice.
4. **WHEN** a user has been inactive for 12 months and was notified at least 30 days earlier **THE SYSTEM SHALL** purge the account, and without a prior notice SHALL not.
5. **WHEN** `POST /api/cron/daily` arrives without the correct `x-cron-secret` **THE SYSTEM SHALL** return 401.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/daily-jobs.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E7-T1: Borrar cuentas vencidas y avisar inactividad cada día"
git tag step-49-trabajos-diarios
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E7-T2` — Preparar Vercel y la salud con base de datos

**Depends on:** `E7-T1`, `E6-T4` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 50

- `app/vercel.json` — `{"$schema": "https://openapi.vercel.sh/vercel.json", "framework": "nextjs", "regions": ["gru1"], "installCommand": "pnpm install --frozen-lockfile", "buildCommand": "pnpm build", "ignoreCommand": "[ \"$VERCEL_GIT_COMMIT_REF\" != \"main\" ]"}`. `ignoreCommand` sale con 0 (se omite el build) en toda rama que no sea `main`: sin despliegues de vista previa.
- `app/src/app/robots.ts` — `allow: "/$"`, `disallow: "/"`, `sitemap: <APP_URL>/sitemap.xml`: solo se indexa la portada de la app.
- `app/src/app/sitemap.ts` — solo `<APP_URL>/`.
- `app/src/app/api/health/route.ts` — agrega el chequeo de base: con el cliente admin, `select id` de `organizations` con `head: true` (también mantiene vivo el proyecto gratuito). OK → `{ ok: true, data: { status: "ok", db: "ok", time } }`; falla o tarda más de 3 s → 503 `{ ok: false, error: { code: "db_unavailable" } }`.

**Files**
- `app/vercel.json` — new
- `app/src/app/robots.ts` — new
- `app/src/app/sitemap.ts` — new
- `app/src/app/api/health/route.ts` — edit
- `app/tests/unit/deploy-config.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/deploy-config.test.ts` reads `app/vercel.json` **THE SYSTEM SHALL** find `regions` equal to `["gru1"]`, `buildCommand` equal to `pnpm build` and an `ignoreCommand` that compares `VERCEL_GIT_COMMIT_REF` with `main`.
2. **WHEN** the test calls the default exports of `robots.ts` and `sitemap.ts` **THE SYSTEM SHALL** return a robots rule that allows only `/$` and disallows `/`, and a sitemap with only the home URL built from `APP_URL`.
3. **WHEN** `GET /api/health` runs with the local database up **THE SYSTEM SHALL** return 200 with `data.db = "ok"`, and with `SUPABASE_URL` pointing to `http://127.0.0.1:9` SHALL return 503 with code `db_unavailable`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/deploy-config.test.ts
pnpm -C app test tests/unit/env-health.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E7-T2: Preparar Vercel y la salud con base de datos"
git tag step-50-vercel-config
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E7-T3` — Programar respaldos cifrados, keep-alive y escaneos

**Depends on:** `E7-T2`, `E1-T3` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 51

- `backup.yml` — `schedule` diario (`30 6 * * *`, UTC) y `workflow_dispatch`. Pasos: `npx --yes supabase@2.122.1 db dump --db-url "$SUPABASE_DB_URL" -f schema.sql`, lo mismo con `--data-only -f data.sql` y `--role-only -f roles.sql`; `sudo apt-get install -y age`; `tar czf` de los tres y `age -r "$AGE_PUBLIC_KEY"` hacia `backup-<fecha>.tgz.age`; borra los `.sql` y el `.tgz` sin cifrar; sube solo el `.age` con `actions/upload-artifact` y `retention-days: 7`. Secretos del repo: `SUPABASE_DB_URL` (conexión de producción) y `AGE_PUBLIC_KEY` (la clave privada la guarda el fundador fuera de línea).
- `keepalive.yml` — `schedule` diario (`0 12 * * *`) que hace `curl -fsS` a `https://app.solecuida.com/api/health` (la ruta toca la base, así Supabase no pausa el proyecto).
- `codeql.yml` — CodeQL para `javascript-typescript`, solo si el repositorio es público (`if: github.event.repository.private == false`; en privado CodeQL es de pago y Semgrep en `ci.yml` cubre el análisis estático).
- `zap.yml` — `workflow_dispatch` con `target` por defecto `https://app.solecuida.com`, acción oficial de OWASP ZAP baseline.
- Todas las acciones con etiqueta de versión mayor y permisos mínimos.

**Files**
- `.github/workflows/backup.yml` — new
- `.github/workflows/keepalive.yml` — new
- `.github/workflows/codeql.yml` — new
- `.github/workflows/zap.yml` — new
- `app/tests/unit/workflows.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/workflows.test.ts` reads `.github/workflows/backup.yml` **THE SYSTEM SHALL** find a daily `schedule`, `supabase@2.122.1 db dump` for schema, data and roles, encryption with `age -r` before the upload step, `retention-days: 7`, and no upload of a `.sql` or unencrypted `.tgz` file.
2. **WHEN** it reads `.github/workflows/keepalive.yml` **THE SYSTEM SHALL** find a daily `schedule` requesting `https://app.solecuida.com/api/health`.
3. **WHEN** it reads `.github/workflows/codeql.yml` and `.github/workflows/zap.yml` **THE SYSTEM SHALL** find CodeQL for `javascript-typescript` and the ZAP baseline action targeting `https://app.solecuida.com` on `workflow_dispatch`.
4. **WHEN** it scans every file in `.github/workflows` **THE SYSTEM SHALL** find secrets only as `secrets.` references and every `uses:` pinned to a version tag or commit SHA.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test tests/unit/workflows.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E7-T3: Programar respaldos cifrados, keep-alive y escaneos"
git tag step-51-respaldos-keepalive
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E7-T4` — Escribir el manual del fundador y rotar la clave de cifrado

**Depends on:** `E7-T3` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 52

- `app/scripts/rotate-field-key.ts` — exporta `rotateAll(admin, { dryRun })` y, si se ejecuta directo, llama a `loadLocalEnv()` y procesa `--dry-run`. Recorre `reminders` (`med_name_enc`, `med_instructions_enc`), `journal_entries` (`note_enc`) y `contacts` (`notes_enc`); todo valor cuya versión no sea la actual se descifra con `FIELD_ENCRYPTION_KEY_PREVIOUS` y se vuelve a cifrar con `FIELD_ENCRYPTION_KEY` (mismo contexto). Imprime conteos por tabla.
- `docs/mantenimiento.md` — manual en español claro, con comandos copiables: `## Desplegar`, `## Respaldar y restaurar`, `## Simulacro de restauración` (descargar el artefacto, `age -d -i clave.txt`, restaurar en el Supabase local con `pnpm -C app db:reset` y `psql` sobre `roles.sql`, `schema.sql`, `data.sql`, y verificar conteos; hacerlo al menos una vez), `## Rotar claves` (FIELD_ENCRYPTION_KEY con el script, CRON_SECRET en Vercel y en Vault, VAPID, claves de Supabase, Resend), `## Revisar errores` (Sentry y `/admin/comentarios`), `## Agregar una organización`, `## Dar acceso de admin` (SQL manual: `update public.profiles set is_admin = true where id = '<uuid>';`), `## Secretos en Vault` (`select vault.create_secret('https://app.solecuida.com', 'app_base_url');` y lo mismo con `cron_secret`), `## Si Supabase pausa el proyecto`.

**Files**
- `docs/mantenimiento.md` — new
- `app/scripts/rotate-field-key.ts` — new
- `app/tests/db/rotate-field-key.test.ts` — new
- `app/tests/unit/docs-mantenimiento.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `rotateAll` runs after `FIELD_ENCRYPTION_KEY` moves to version 2 with the old key in `FIELD_ENCRYPTION_KEY_PREVIOUS` **THE SYSTEM SHALL** rewrite every `v1.` value in `reminders`, `journal_entries` and `contacts` as `v2.`, and each value SHALL decrypt to its original text.
2. **WHEN** it runs with `dryRun: true` **THE SYSTEM SHALL** report the counts and change no row.
3. **WHEN** `tests/unit/docs-mantenimiento.test.ts` reads `docs/mantenimiento.md` **THE SYSTEM SHALL** find the headings `## Desplegar`, `## Respaldar y restaurar`, `## Simulacro de restauración`, `## Rotar claves`, `## Revisar errores`, `## Agregar una organización`, `## Dar acceso de admin`, `## Secretos en Vault` and `## Si Supabase pausa el proyecto`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/db/rotate-field-key.test.ts
pnpm -C app test tests/unit/docs-mantenimiento.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E7-T4: Escribir el manual del fundador y rotar la clave de cifrado"
git tag step-52-manual-mantenimiento
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E7-T5` — Cerrar variables de entorno y la lista de lanzamiento

**Depends on:** `E7-T4` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 53

- `app/tests/unit/env-example.test.ts` — busca `process.env.X` y `requireEnv("X")`/`readEnv("X")` en `src/`, `scripts/`, `next.config.ts`, `vitest.config.ts` y `playwright.config.ts`.
- `app/.env.example` — agrega cualquier variable que falte según esa prueba (sin valores reales).
- `docs/lanzamiento.md` — la lista de lanzamiento de §20.1 del plano, en orden y con casillas: `## Cuentas y dominios`, `## Variables en Vercel`, `## Supabase de producción` (región São Paulo, migraciones con `supabase db push`, secretos de Vault, SMTP de Resend, captcha Turnstile, URL del sitio y redirecciones, plantilla del enlace mágico, MFA del admin, advisors sin hallazgos críticos), `## Correo` (Resend + SPF/DKIM en `notificaciones.solecuida.com`; nunca Zoho), `## Antes de abrir al público` (ZAP, Lighthouse, prueba en Android y en iPhone instalado, 131/SAMU y recursos verificados, simulacro de restauración).
- `PENDIENTES.md` — actualizado con lo que quede.

**Files**
- `docs/lanzamiento.md` — new
- `app/.env.example` — edit
- `app/tests/unit/env-example.test.ts` — new
- `PENDIENTES.md` — edit

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/env-example.test.ts` scans the source for environment variable reads **THE SYSTEM SHALL** find every variable as a key in `app/.env.example`, except `NODE_ENV`, `CI` and `NEXT_RUNTIME`.
2. **WHEN** the same test reads `app/.env.example` **THE SYSTEM SHALL** find every value empty or local (`http://localhost`, `mailto:`).
3. **WHEN** `docs/lanzamiento.md` is read **THE SYSTEM SHALL** contain the headings `## Cuentas y dominios`, `## Variables en Vercel`, `## Supabase de producción`, `## Correo` and `## Antes de abrir al público`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test tests/unit/env-example.test.ts
grep -q "## Cuentas y dominios" docs/lanzamiento.md
grep -q "## Variables en Vercel" docs/lanzamiento.md
grep -q "## Supabase de producción" docs/lanzamiento.md
grep -q "## Correo" docs/lanzamiento.md
grep -q "## Antes de abrir al público" docs/lanzamiento.md
```

**Checkpoint**

```bash
git add -A && git commit -m "E7-T5: Cerrar variables de entorno y la lista de lanzamiento"
git tag step-53-checklist-lanzamiento
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `pnpm -C app test` runs at the end of this epic **THE SYSTEM SHALL** exit 0 with `daily-jobs`, `deploy-config`, `workflows`, `rotate-field-key`, `docs-mantenimiento` and `env-example` passing.
2. **WHEN** `pnpm -C app build` runs **THE SYSTEM SHALL** exit 0 with the production configuration.

```bash
pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test
pnpm -C app build
```

Run from the project root. Both criteria are decided by these commands.

## Pitfalls

- **`supabase db dump` corre en GitHub Actions con Docker**: no necesitas `pg_dump` instalado.
- **El archivo cifrado es lo único que se sube**: nunca un `.sql` suelto, ni siquiera un instante.
- **Supabase gratis se pausa tras 7 días sin actividad**: el keep-alive toca la base por `/api/health`.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `git tag -l 'step-*'` lists `step-49-trabajos-diarios`, `step-50-vercel-config`, `step-51-respaldos-keepalive`, `step-52-manual-mantenimiento`, `step-53-checklist-lanzamiento`.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `app/.env.example` updated if this epic added a variable.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
- [ ] Si esta épica cierra una fase del brief: resumen corto al fundador (qué funciona, cómo probarlo, qué se decidió en `DECISIONES.md`, qué necesita) y `PENDIENTES.md` al día.
