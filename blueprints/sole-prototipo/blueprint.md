# Sole — prototipo — Blueprint

> Generado por The Architect el 2026-11-13 (America/Santiago)
> Forma: saas-webapp · `knowledge/shapes/saas-webapp.md`
> Pista de runtime: ts-node · `knowledge/runtime-tracks/ts-node.md` (Node 22 por decisión del fundador, no 24)
> Modo de emisión: bundle (70 pasos)
> Versión del plano: 1
> Versiones verificadas: 2026-11-14 UTC / 2026-11-13 America/Santiago — procedencia por paquete en §11

**Fuente del QUÉ:** `PROTOTIPO-Brief-Fable.md` (v1.2, raíz del repo). Este plano es el CÓMO: no reemplaza ni reabre nada marcado DECIDIDO en el brief. Donde el brief y las resoluciones posteriores difieren, mandan las resoluciones (registro en §20.3): por ejemplo, el correo de la app sale por **Resend**, nunca por Zoho, y los avisos se despachan desde una ruta de Next.js, no desde una Edge Function.

**Cómo se usa este bundle.** `workspace/` se copia una sola vez a la raíz del repo con el comando de §10 (no pisa nada existente). El orden de construcción vive en §9, en `tasks.json` (lo que el constructor lee para saber qué sigue) y en `epics/` (cada épica se ejecuta sin abrir este archivo). Los tres dicen lo mismo, palabra por palabra.

---

## 1. Project Overview & Non-Goals

### Vision

Sole es una app web instalable (PWA) en `app.solecuida.com`, gratuita y pública, para **personas que cuidan a otra persona en Chile** —una mamá con demencia, un hijo con discapacidad intelectual, un papá en diálisis, una pareja recuperándose de una cirugía—. La cuidadora típica tiene entre 45 y 65 años, está cansada, usa un Android de gama media y tiene poco tiempo. Sole le ordena el día: recuerda medicamentos, controles, trámites y cumpleaños; le pregunta a los 15 minutos si se hizo; le deja anotar en 15 segundos cómo estuvo el día; le muestra su semana sin culpa; y le pregunta a ella cómo está. Todo con letra grande, botones grandes, en español de Chile, sin datos clínicos, sin IA, sin cobros y sin publicidad.

El prototipo tiene dos trabajos a la vez: ser algo usable que una fundación, un municipio o un centro de salud pueda recomendar en vez de pedir una reunión, y producir evidencia real (uso, retención, tiempos, interés en funciones pagadas) para decidir la app definitiva. Lo construye y lo mantiene un solo fundador, con empleo, sin presupuesto recurrente: cada elección de este plano favorece lo que él pueda entender y arreglar en una tarde.

### Users

| Persona | Qué viene a hacer | Frecuencia |
|---|---|---|
| Cuidadora principal | Ver y resolver lo de hoy, crear recordatorios, anotar la bitácora, revisar avances, cuidarse | Diaria |
| Persona cuidada (vista vinculada, sin cuenta) | Ver solo lo que la cuidadora marcó como visible, tocar "Listo", pedir ayuda | Diaria, opcional |
| Familiar del círculo (F16, si sobra tiempo) | Ver "Hoy", verificar ítems a distancia, tomar tareas | Semanal o diaria |
| Fundador (admin con MFA) | Métricas H1–H6, organizaciones, contenido, comentarios, límites | Semanal |
| Organización aliada (F17, si sobra tiempo) | Ver datos agregados de quienes llegaron con su código | Mensual |

### Goals — v1 scope

1. La cuidadora se registra, acepta los consentimientos por capas y deja configurada a la persona cuidada desde una plantilla en menos de 5 minutos.
2. Cada recordatorio llega como aviso Web Push a su hora (horario de Chile, con cambio de hora correcto), con un "¿Lo hiciste?" a los 15 minutos y avisos previos para fechas, y se resuelve con un toque desde "Hoy", también sin conexión.
3. La cuidadora registra la bitácora en menos de 15 segundos, ve resúmenes diarios, semanales y mensuales con hitos, y los comparte como imagen o PDF generados en su teléfono.
4. Sole cuida a quien cuida: pregunta diaria privada, botón de respiro y directorio de recursos chilenos verificados.
5. El fundador mide las hipótesis H1–H6 en un panel protegido con MFA, edita el contenido y vigila los límites gratuitos, con datos seudónimos.
6. La aplicación cumple la lista técnica de seguridad del brief (6.2, 30 puntos) con evidencia, WCAG 2.2 AA y la Ley 21.719 como si ya rigiera.
7. Todo corre a costo recurrente cero, con respaldos cifrados nocturnos y un manual para operarlo solo.

### Non-Goals — explicitly out of scope for v1

| No se construye | Por qué no ahora | Se revisa cuando |
|---|---|---|
| Apps en Google Play o App Store | La PWA llega a Android e iPhone sin cuentas de tienda ni revisión; el brief lo decide | La retención de la semana 8 supera el umbral de H1 y los avisos en iPhone resultan insuficientes |
| Inteligencia artificial (Sole con IA), recetas, comunidad, fotos | Solo puertas falsas (F11) para medir interés; agregan costo y riesgo | El interés registrado en F11 lo justifica (H4) y hay financiamiento |
| Cobros reales, suscripciones y publicidad | El piloto es gratuito; los precios se prueban sin cobrar | H4 muestra disposición a pagar y existe una política de reembolsos |
| Datos clínicos: diagnósticos, signos vitales, escalas, catálogo de fármacos, dosis calculadas, consejo médico o de dieta | Convierte la app en software sanitario y agranda el riesgo legal | Hay asesoría regulatoria (ISP) y una razón de producto validada |
| Interfaz para profesionales o terapeutas | El modelo de datos lo soporta (`member_role = 'professional'`), sin pantallas | Una organización aliada lo pide por escrito |
| Geolocalización o cualquier promesa de seguridad física | El botón de emergencia solo facilita llamar y avisar | Nunca en esta línea de producto sin evaluación legal |
| Envío de correos a organizaciones por parte de agentes | Lo decide el brief: los envía el fundador | Nunca |
| Respaldo por correo o SMS de los recordatorios | Decisión del fundador: sin push, los pendientes se ven en "Hoy" con un aviso persistente | La métrica de usuarias con push activo queda bajo lo esperado |
| Ambiente de staging y vistas previas en Vercel | Un solo proyecto de producción; local con Supabase CLI | Aparece un segundo desarrollador o una organización exige un ambiente de prueba |

**The builder must not implement anything in this table**, aunque parezca un agregado pequeño mientras trabaja en un paso vecino. Si un paso parece necesitar algo de esta tabla, es un defecto del plano: se detiene y lo reporta.

### Success metrics

Los umbrales son orientativos (brief §1.1): sirven para leer resultados, no bloquean nada. Todo se calcula en `/admin` (paso paso 40 (`admin-metricas`)) desde `events`, `profiles`, `survey_responses` y `fake_door_interest`.

| Métrica | Meta | Cómo se mide |
|---|---|---|
| H1 · Días activos por semana | ≥ 4 días/semana; ≥ 40 % activas en la semana 4 (cohortes de 8 semanas) | Días distintos con `app.opened` por seudónimo; retención semanas 1, 4 y 8 por cohorte de registro |
| H2 · Tareas clave rápidas | Bitácora < 15 s; recordatorio < 60 s | Mediana de `duration_ms` en `flow.completed` (`journal`, `reminder_create`); abandono `flow.abandoned` / `flow.started` |
| H3 · Valor percibido | ≥ 40 % "Muy decepcionada" | Respuestas de la microencuesta `d28` |
| H4 · Disposición a pagar | Comparativo por función | `fake_door.interest` y `choice` en `plan_familiar`; `premium.used` |
| H5 · Sumar a otras personas | % de usuarias que lo intentan | `invitation.created`, interés en `invitar_familiar`, `cared_link.created` |
| H6 · Canales que retienen | Comparativo entre orígenes | Retención por `profiles.org_code` |
| Avisos activos | Seguimiento semanal | % de usuarias activas en 7 días con al menos una fila en `push_subscriptions` |

---

## 2. Tech Stack

**Runtime track: ts-node.** Esta tabla nombra decisiones, no versiones: cada versión vive en §11. Las versiones vienen del informe de `stack-researcher` de esta sesión (registro npm en vivo); la pista `knowledge/runtime-tracks/ts-node.md` solo aporta procedimientos y advertencias.

| Capa | Elección | Por qué esta y no otra |
|---|---|---|
| Lenguaje / runtime | TypeScript 6 sobre Node.js 22 LTS | Un solo lenguaje para servidor, cliente, scripts y pruebas. Node 22 porque es el que tiene el fundador instalado (24 es la pista por defecto, pero no aporta nada que este proyecto necesite). TypeScript 7 se descarta: aún sin API estable para herramientas |
| Framework | Next.js 16 (App Router), build con `--webpack` | Server Components y Server Actions dejan toda consulta en el servidor con la sesión de la usuaria. `--webpack` porque `@serwist/next` no funciona con Turbopack |
| Estilos | Tailwind CSS 4 vía PostCSS, tokens en CSS | Tokens en variables CSS que un estudio de marca puede cambiar sin tocar componentes (brief §7). PostCSS porque el cargador de Turbopack no corre bajo webpack |
| Componentes | Propios, sobre HTML nativo (`button`, `fieldset`, `dialog`) | Pocos componentes, máxima accesibilidad nativa, cero dependencias que el fundador deba mantener. Se descartó shadcn/Radix: instala dependencias sin versión verificada y agrega capas que no hacen falta |
| Base de datos | Supabase Postgres (São Paulo) | RLS en la base, Auth, `pg_cron`, `pg_net` y Vault en un solo servicio gratuito; latencia razonable desde Chile |
| Acceso a datos | `@supabase/supabase-js` + `@supabase/ssr` desde el servidor; SQL a mano en migraciones de la CLI; tipos generados | El JWT de la usuaria viaja en cada consulta y RLS decide. Sin ORM: un ORM agregaría un segundo dueño del esquema y no ve las políticas |
| Autenticación | Supabase Auth: enlace mágico (contraseña opcional), TOTP para admin, captcha Turnstile | Ya está en la base y en las políticas; un segundo proveedor de identidad duplicaría usuarios y sesiones |
| Trabajo en segundo plano | `pg_cron` → `pg_net` → ruta `/api/cron/*` en Vercel, con secreto | Sin servidor siempre encendido y sin costo; el despachador es TypeScript probado como el resto. Vercel Cron Hobby se descarta: frecuencia insuficiente para avisos al minuto |
| Pagos | NOT APPLICABLE — el piloto es gratuito; los precios solo se muestran en una puerta falsa | — |
| Archivos | NOT APPLICABLE — sin subida de archivos en esta versión (brief 6.2 #17); informes se generan en el navegador | — |
| Correo / avisos | Web Push (VAPID, librería `web-push`) para avisos; Resend como SMTP de Supabase Auth y para avisos de inactividad, desde `notificaciones.solecuida.com` | Push es gratis y llega a la pantalla bloqueada. Resend separa la reputación del dominio personal; Zoho está prohibido para correo de la app (`CORREO-Configuracion-Zoho.md` §6) |
| Sin conexión | Serwist (service worker) + IndexedDB (`idb`) para la foto del día y la cola de marcas | Consultar "Hoy" y marcar sin señal es requisito; la cola con clave de idempotencia evita dobles marcas |
| Errores | Sentry (gratis) con filtrado de datos personales y túnel `/monitoring` | Errores con contexto sin exponer datos; el túnel mantiene la CSP en `connect-src 'self'` |
| Anti-bots | Cloudflare Turnstile (captcha de Supabase Auth y formulario web) | Gratis y sin rompecabezas para personas cansadas |
| Hosting | Vercel Hobby, proyecto con raíz `app/`, región `gru1`, solo `main` | El framework corre ahí sin configuración; el sitio `web/` sigue en su propio proyecto |
| Gestor de paquetes | pnpm 12.18.0 (instalado con npm en ~/.local) | `node_modules` estricto detecta dependencias fantasma; versión fijada en `packageManager` |

### Compatibility check

Revisado contra `knowledge/stack-compatibility.md`. Dos combinaciones de la lista de conflictos aparecen y este plano las evita así:

- **Linter que parsea CSS + Tailwind 4 (`@theme`)**: `app/biome.json` lleva `"css": { "parser": { "tailwindDirectives": true } }` y excluye `**/*.svg` (Biome 2.5+ falla con los SVG del scaffold).
- **Proceso de larga vida en un host por petición**: no hay worker ni programador en memoria; el reloj es `pg_cron` en la base y cada ejecución es una petición corta e idempotente con bloqueo.

Además, una incompatibilidad que la pista documenta y que este plano resuelve explícitamente: **`@serwist/next` (plugin de webpack) con el Turbopack por defecto de Next 16** → `dev` y `build` usan `--webpack`, y Tailwind entra por `@tailwindcss/postcss` con `app/postcss.config.mjs`, porque bajo webpack el cargador de Turbopack no hace nada.

---

## 3. Directory Structure

```
<raíz del repo>/                      # repo existente; la app se agrega en app/
  .github/
    workflows/
      ci.yml                          # paso paso 3 (`ci-y-secretos`): quality, e2e, gitleaks, audit, semgrep
      backup.yml                      # paso paso 51 (`respaldos-keepalive`): pg dump nocturno cifrado con age
      keepalive.yml                   # paso paso 51 (`respaldos-keepalive`): GET /api/health diario
      codeql.yml                      # paso paso 51 (`respaldos-keepalive`): solo si el repo es público
      zap.yml                         # paso paso 51 (`respaldos-keepalive`): ZAP baseline manual contra producción
    dependabot.yml                    # paso paso 3 (`ci-y-secretos`)
  .githooks/pre-commit                # paso paso 3 (`ci-y-secretos`): gitleaks si está instalado
  .gitleaks.toml                      # paso paso 3 (`ci-y-secretos`)
  .gitignore                          # existe; Bootstrap le agrega líneas (§10)
  .gitattributes                      # Bootstrap: `* text=auto eol=lf` (Windows con autocrlf → LF, como espera Biome)
  .claude/                            # workspace/: settings.json, skills/, rules/ (§19)
  CLAUDE.md · AGENTS.md               # workspace/ (§19.1, §19.2)
  DECISIONES.md · PENDIENTES.md       # paso paso 6 (`documentos-base`) (vivos hasta el final)
  PROTOTIPO-Brief-Fable.md            # el brief (no se edita)
  docs/
    diseno/                           # pasos paso 7 (`diseno-funcional-1`) y paso 8 (`diseno-funcional-2`): F1–F17
    seguridad/                        # pasos paso 47 (`evidencia-seguridad`) y paso 48 (`amenazas-y-privacidad`)
    legal/                            # registro de actividades y EIPD
    negocio/planes.md                 # paso paso 59 (`informe-medico-f14`)
    eventos.md                        # paso paso 13 (`eventos-base`) (igual a catalog.ts)
    limites.md · licencias.md         # paso paso 6 (`documentos-base`)
    mantenimiento.md                  # paso paso 52 (`manual-mantenimiento`)
    lanzamiento.md                    # paso paso 53 (`checklist-lanzamiento`)
  alianzas/                           # pasos paso 64 (`alianzas-plantillas`) y paso 65 (`alianzas-kit`)
  web/                                # sitio estático existente (pasos paso 60 (`web-base`) a paso 63 (`web-contacto`))
  blueprints/sole-prototipo/          # este bundle (los configs de app/ nunca recorren esta carpeta)
  app/                                # creada por create-next-app en Bootstrap
    package.json · pnpm-lock.yaml · pnpm-workspace.yaml   # scaffold + scripts de §10
    tsconfig.json · next-env.d.ts · .gitignore            # scaffold; tsconfig lo edita paso 23 (`pwa-service-worker`); next-env.d.ts lo genera `next typegen`
    next.config.ts                    # paso paso 1 (`esqueleto`); lo editan paso 23 (`pwa-service-worker`), paso 43 (`cabeceras-csp`), paso 44 (`sentry`)
    postcss.config.mjs · biome.json   # workspace/ (§19.6)
    vitest.config.ts · playwright.config.ts   # workspace/ (§19.6)
    vercel.json                       # paso paso 50 (`vercel-config`)
    .env.example                      # workspace/; versionado, sin valores
    .env.local · .env.test.local      # generados por `pnpm -C app env:local`; ignorados
    supabase/
      config.toml · seed.sql          # workspace/ (seed solo local)
      migrations/                     # 4 migraciones en workspace/ + la de contenido del paso paso 14 (`contenido-inicial`)
      tests/database.test.sql         # workspace/: pgTAP
      templates/magic-link.html       # workspace/: correo del enlace mágico
    scripts/
      write-local-env.ts · lib/load-env.ts      # workspace/
      trigger-cron.ts                 # paso paso 21 (`despachador`)
      check-bundle-secrets.ts         # paso paso 45 (`produccion-limpia`)
      rotate-field-key.ts             # paso paso 52 (`manual-mantenimiento`)
      check-alianzas.ts               # paso paso 64 (`alianzas-plantillas`)
    public/                           # sw.js lo genera el build (ignorado)
    src/
      proxy.ts                        # sesión, redirección, nonce CSP
      instrumentation.ts · instrumentation-client.ts   # Sentry
      sw.ts                           # service worker (Serwist + push)
      app/
        layout.tsx · globals.css · page.tsx · manifest.ts · robots.ts · sitemap.ts
        error.tsx · global-error.tsx · not-found.tsx
        (auth)/entrar/                # ingreso
        (onboarding)/bienvenida/      # consentimientos y creación del círculo
        (app)/                        # hoy, calendario, recordatorios, tareas, bitacora, para-ti,
                                      # informes, contactos, persona-cuidada, circulo, avisos, cuenta, pronto
        admin/                        # panel F15 (rol + MFA)
        auth/confirm/route.ts         # verificación del enlace mágico
        v/[token]/                    # vista de la persona cuidada (F12)
        invitar/[token]/ · org/[token]/   # F16 y F17
        ~offline/                     # página sin conexión
        icons/[size]/route.tsx        # íconos PNG del logo
        api/                          # health, cron/*, push, occurrences/mark, cuenta/exportar,
                                      # v/[token]/*, web/contact, admin/export
      components/                     # ui/ (primitivas) y uno por área
      lib/                            # env.ts, supabase/, crypto/, design/, auth/, offline/, security/, observability/
      server/                         # lógica por área (sin React)
    tests/
      setup/env.ts                    # workspace/
      support/totp.ts                 # paso paso 39 (`admin-acceso`)
      unit/  db/  e2e/                # cada archivo lo crea el paso que lo verifica
```

**Boundary rules**
- Ninguna página ni componente consulta tablas con un cliente propio: los datos llegan desde `src/server/**` usando `createSupabaseServerClient()` o `createSupabaseRouteClient(request)`.
- `src/lib/supabase/admin.ts` (clave secreta) solo se importa desde `src/server/**`, rutas `api/cron/*`, `api/admin/*`, `api/v/*`, `api/web/*` y pruebas.
- `src/components/**` nunca importa de `src/server/**`; recibe datos y Server Actions por props.
- `src/server/**` no importa React.
- Un componente usado por una sola ruta vive junto a esa ruta; los compartidos, en `src/components/<área>/`.
- **Convención de imports:** alias `@/` → `app/src/`, sin extensión. Está reconciliada contra cada cargador en §19.6 (*Resolution convention matrix*); este párrafo no la repite.

---

## 4. Data Model

### Entities

Todas las tablas de la app viven en `public`, con RLS; las dos tablas de servicio (`private.rate_limits`, `private.job_leases`) viven en `private`, que la API no expone (ver más abajo). Fechas en `timestamptz` (UTC); días locales en `date` calculados en la zona del círculo. Llaves primarias `uuid` con `gen_random_uuid()`.

**organizations** — organización aliada y su código de origen.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| code | text | unique, `^[A-Z0-9-]{3,32}$` | va en `?org=CODIGO` |
| name | text | 2–200 | |
| kind | text | `fundacion`, `municipio`, `centro_salud`, `agrupacion`, `asociacion_pacientes`, `otro` | |
| dashboard_token_hash | text | unique, 64 car. o null | SHA-256 del token de F17 |
| active | boolean | default true | |
| created_at | timestamptz | default now() | |

**profiles** — una por usuaria de Auth; la crea el trigger `on_auth_user_created`.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, FK `auth.users` on delete cascade | |
| display_name | text | ≤ 80 | cómo saludarla |
| timezone | text | `America/Santiago` (default), `America/Punta_Arenas`, `Pacific/Easter` | |
| pseudonym_id | uuid | unique, default aleatorio | único id que llega a `events` |
| org_code | text | FK `organizations.code`, set null | origen, validado por el trigger |
| is_admin | boolean | default false; sin grant de update | solo SQL manual |
| followup_minutes | smallint | 5–120, default 15 | "¿Lo hiciste?" |
| journal_reminder_time | time | null | sugerencia de bitácora |
| onboarding_completed_at | timestamptz | null | |
| last_active_at | timestamptz | default now() | inactividad de 12 meses |
| deactivated_at · deletion_requested_at | timestamptz | null; sin grant de update | 7 días de gracia |
| inactivity_notice_sent_at | timestamptz | null | aviso previo |
| created_at · updated_at | timestamptz | | cohorte de registro |

**consents** — registro de consentimientos; solo se agregan filas.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | FK profiles cascade | |
| layer | consent_layer | `terms`, `sensitive`, `research` | capas del brief 6.3 |
| version | text | `YYYY-MM-DD` | `2026-11-14` en v1 |
| granted | boolean | not null | revocar = nueva fila `false` |
| created_at | timestamptz | | |

**circles** — el círculo de cuidado: una persona cuidada y sus miembros.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| cared_name | text | 1–60 | nombre o apodo |
| relation | text | 1–40 | "mi mamá" |
| care_type | care_type | 9 valores | elige la plantilla |
| timezone | text | zonas de Chile | |
| created_by | uuid | FK profiles cascade | cuidadora administradora |
| closed_at · closed_reason | timestamptz · text | `fallecimiento`, `ya_no_cuido`, `otro` | F13 |
| created_at · updated_at | timestamptz | | |

**circle_members** — quién está en cada círculo y con qué rol.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| circle_id · user_id | uuid | PK compuesta; FKs cascade | |
| role | member_role | `caregiver`, `family`, `cared`, `professional` | sin grant de update |
| display_name | text | 1–60 | "verificado por …" |
| notify_kinds | text[] | ⊆ tipos de recordatorio + `emergency` | F16; por defecto fechas, controles, emergencias |
| created_at | timestamptz | | |

**invitations** (F16), **cared_links** (F12) — tokens hasheados.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| circle_id | uuid | FK circles cascade | |
| token_hash | text | unique, 64 car. | SHA-256 hex; el token nunca se guarda |
| created_by | uuid | FK profiles cascade | |
| expires_at | timestamptz | not null | 7 días (invitación) · 90 días (vínculo) |
| revoked_at | timestamptz | null; único campo actualizable | |
| accepted_by · accepted_at | uuid · timestamptz | solo `invitations` | |
| label · last_used_at | text · timestamptz | solo `cared_links` | |

**reminders** — la regla; nunca se borra (se desactiva).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| circle_id | uuid | FK circles cascade; sin grant de update | |
| created_by | uuid | FK profiles set null; sin grant de update | |
| kind | reminder_kind | `medication`, `food`, `activity`, `appointment`, `errand`, `important_date`, `custom` | |
| importance | importance | `important`, `normal`, `whenever` | orden en "Hoy" |
| title | text | 1–120 | lo único que va en el aviso push |
| med_name_enc · med_instructions_enc | text | `^v[0-9]+\.` | cifrados AES-256-GCM |
| rule | jsonb | objeto con `freq` y `startDate` | validado con `ruleSchema` |
| advance_days | smallint[] | ≤ 5 elementos | `{3,1,0}` por defecto en fechas |
| visible_to_cared | boolean | default false | F12 |
| active · source | boolean · text | `manual`, `template`, `tip` | |
| created_at · updated_at | timestamptz | | |

**reminder_occurrences** — instancias materializadas (48 h).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| reminder_id · circle_id | uuid | FKs cascade | |
| kind · advance_days | occurrence_kind · smallint | `main`/`advance`; 0–30 | |
| due_at | timestamptz | not null | cuándo avisar |
| event_at | timestamptz | not null | cuándo ocurre |
| local_date | date | not null | día local del evento |
| status | occurrence_status | `pending`, `done`, `not_done`, `snoozed`, `skipped` | |
| not_done_reason | text | `rechazo`, `no_habia`, `otro` | |
| snoozed_until · done_at · notified_at · followup_sent_at | timestamptz | | |
| done_by · done_via | uuid · text | `app`, `push`, `offline_sync`, `cared_link` | |
| — | — | unique `(reminder_id, kind, event_at, advance_days)` | idempotencia |

**occurrence_marks** — una fila por marca, con clave de idempotencia.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| idempotency_key | uuid | PK | reintentos sin duplicar |
| occurrence_id · circle_id | uuid | FKs cascade | |
| marked_by | uuid | FK profiles set null | "verificado por" |
| status · via · created_at | | | |

**push_subscriptions**, **tasks**, **journal_entries**, **selfcare_checkins**, **contacts**, **emergency_events**

| Tabla | Campos clave | Notas |
|---|---|---|
| push_subscriptions | `user_id`, `endpoint` (unique, https), `p256dh`, `auth`, `failed_count`, `last_success_at` | solo propias |
| tasks | `circle_id`, `title` 1–120, `claimed_by`, `scheduled_for`, `done_at`, `done_by` | F5 |
| journal_entries | `circle_id`, `author_id`, `entry_date`, `day_rating` (`bueno`/`regular`/`dificil`), `moods[]`, `sleep`, `food`, `note_enc`; unique `(circle_id, entry_date)` | F6 |
| selfcare_checkins | `user_id`, `checkin_date`, `score` 1–5; unique `(user_id, checkin_date)` | F8, privado |
| contacts | `circle_id`, `name`, `kind`, `phone` (`^\+?[0-9 ()-]{6,20}$`), `notes_enc`, `is_emergency` | F9, sin datos clínicos |
| emergency_events | `circle_id`, `link_id`, `recipients`, `triggered_at` | F12 |

**tips**, **resources**, **care_templates**, **feedback**, **survey_responses**, **fake_door_interest**, **admin_audit_log**, **events**

| Tabla | Campos clave | Notas |
|---|---|---|
| tips | `kind` (`consejo`/`actividad`), `text` 5–200, `activity_title`, `care_types[]`, `active` | editable en F15 |
| resources | `name`, `description`, `phone`, `url`, `source_url` (https), `verified_at`, `region` | se muestra solo si está verificado |
| care_templates | `care_type` (PK), `name`, `description`, `items` (jsonb) | ítems con `templateItemSchema` |
| feedback | `user_id`, `kind`, `message` 1–2000, `screen`, `read_at` | F10 |
| survey_responses | `user_id`, `survey_key` (`d3`/`d14`/`d28`/`d56`), `answers`, `dismissed`; unique por usuaria y encuesta | F10 |
| fake_door_interest | `user_id`, `door_key`, `choice`, `notify_me` | F11 |
| admin_audit_log | `admin_id`, `action`, `target`, `created_at` | 6.2 #30 |
| events | `pseudonym_id`, `name` (`area.accion`), `props` (< 2 KB), `org_code`, `technical` | sin FK a la usuaria; sin texto libre |

Fuera de `public`, en el esquema `private`: `rate_limits (key, window_start, hits)` y `job_leases (name, locked_until)`. Son tablas solo de servicio: PostgREST no expone `private`, no tienen RLS (nadie fuera de las funciones `security definer` puede tocarlas) y solo se usan mediante `rate_limit_hit`, `cleanup_rate_limits`, `acquire_job_lease` y `release_job_lease`, ejecutables únicamente por `service_role`. Todas las tablas de la app viven en `public` con RLS.

### Relationships

- `auth.users` —(1:1)→ `profiles` · cascade: borrar la usuaria borra su perfil y, en cadena, todo lo que cuelga de él.
- `profiles` —(1:N)→ `circles` (como `created_by`) · cascade; `purge_user` borra los eventos del seudónimo y la fila de `auth.users`, y la cascada hace el resto.
- `circles` —(N:M vía `circle_members`)→ `profiles` · cascade en ambos lados.
- `circles` —(1:N)→ `reminders`, `reminder_occurrences`, `occurrence_marks`, `tasks`, `journal_entries`, `contacts`, `cared_links`, `invitations`, `emergency_events` · cascade.
- `reminders` —(1:N)→ `reminder_occurrences` · cascade (pero los recordatorios no se borran: se desactivan, así el historial se conserva).
- `reminder_occurrences` —(1:N)→ `occurrence_marks` · cascade.
- `profiles` —(1:N)→ `consents`, `push_subscriptions`, `selfcare_checkins`, `feedback`, `survey_responses`, `fake_door_interest` · cascade.
- Referencias "quién hizo" (`done_by`, `marked_by`, `claimed_by`, `created_by` en recordatorios y tareas, `admin_id`) · set null: borrar a un familiar no borra el historial del círculo.
- `organizations.code` —(1:N)→ `profiles.org_code` · on update cascade, on delete set null.
- `events` no tiene FK: se enlaza por `pseudonym_id` y se borra en `purge_user`.

### Indexes

| Table | Index | Why |
|---|---|---|
| consents | `(user_id, layer, created_at desc)` | último estado por capa (`created_at` usa `clock_timestamp()`, así dos filas de la misma transacción quedan ordenadas) |
| circles | `(created_by)` | purga y "mis círculos" |
| circle_members | `(user_id)` | círculos de una usuaria; las funciones de RLS |
| reminders | `(circle_id) where active` | materialización y listas |
| reminder_occurrences | `(circle_id, local_date)` | "Hoy", calendario, informes |
| reminder_occurrences | `(due_at) where status in ('pending','snoozed')` | despachador cada minuto |
| occurrence_marks | `(occurrence_id)` | "verificado por" |
| push_subscriptions | `(user_id)` | envío por usuaria |
| tasks · contacts · invitations · cared_links | `(circle_id)` | listas por círculo |
| emergency_events | `(circle_id, triggered_at desc)` | historial |
| feedback | `(created_at desc)` | panel |
| events | `(name, created_at)` y `(pseudonym_id, created_at)` | métricas y purga |

### Schema

El esquema completo es SQL escrito a mano y se entrega como archivos reales del bundle (§19.6), aplicados por Bootstrap antes del paso 1:

| Archivo | Contenido |
|---|---|
| `app/supabase/migrations/20261114000100_base.sql` | esquema `private`, enums, `organizations`, `profiles` + trigger, `consents`, `circles`, `circle_members`, funciones de pertenencia, `invitations`, `cared_links`, `admin_audit_log`, `events`, `rate_limits`, `job_leases`, RPC `create_circle`, `accept_invitation`, `set_member_notify_kinds`, `rate_limit_hit`, `cleanup_rate_limits`, `acquire_job_lease`, `release_job_lease`, RLS y privilegios |
| `app/supabase/migrations/20261114000200_cuidado.sql` | `reminders`, `reminder_occurrences`, `occurrence_marks`, `push_subscriptions`, `tasks`, `journal_entries`, `selfcare_checkins`, `contacts`, `emergency_events`, RPC `mark_occurrence`, `close_circle`, `claim_task`, `purge_user`, RLS y privilegios |
| `app/supabase/migrations/20261114000300_contenido_y_escucha.sql` | `tips`, `resources`, `care_templates`, `feedback`, `survey_responses`, `fake_door_interest`, `admin_db_size_bytes`, RLS y privilegios |
| `app/supabase/migrations/20261114000400_cron.sql` | `pg_cron`, `pg_net`, `private.call_app_job` con secretos de Vault, jobs `sole-dispatch` (cada minuto) y `sole-daily` (07:15 UTC) |
| `app/supabase/migrations/20261114001000_contenido_inicial.sql` | escrito en el paso paso 14 (`contenido-inicial`): plantillas, consejos y recursos iniciales |

El texto literal de los cuatro primeros archivos está en §19.6 (mismos bytes que en `workspace/`).

### Migrations

- **Herramienta:** Supabase CLI (`supabase` como dependencia de desarrollo de `app/`). Local: `pnpm -C app db:reset` aplica todo y carga `seed.sql`. Producción: `pnpm -C app exec supabase db push` desde la máquina del fundador (lista de lanzamiento), nunca desde CI ni desde un agente (está en `deny` de `.claude/settings.json`).
- **Nombres:** escritos a mano, `<AAAAMMDDHHMMSS>_<descripcion>.sql`, siempre mayores que el último. No se usa `supabase migration new` (su nombre lo inventa la herramienta); el plano fija cada nombre.
- **Reglas:** una migración aplicada no se edita. En producción, expandir y luego contraer: primero agregar (columna nullable, tabla nueva), desplegar el código que la usa, y recién después restringir o borrar en otra migración. Nunca un cambio destructivo en el mismo despliegue que el código.
- **Tipos:** después de cada migración, `pnpm -C app db:types`.

### Seed data

`app/supabase/seed.sql` (solo local; la CLI no lo aplica en producción): la organización `DEMO-LOCAL` y un recurso verificado de prueba. Las usuarias de prueba las crea cada prueba con correos aleatorios. El contenido real (plantillas, consejos, recursos sin verificar) llega por la migración del paso paso 14 (`contenido-inicial`), porque producción también lo necesita.

---

## 5. API Design

### Conventions

- **Base:** la UI usa Server Components y Server Actions. Los Route Handlers bajo `/api` existen solo donde hace falta una URL: service worker, cron, descargas, vista sin cuenta, formulario de la web y exportación del admin.
- **Sobre de respuesta (único):** éxito `{ "ok": true, "data": … }`; error `{ "ok": false, "error": { "code": "<código>", "message": "<texto para la persona, en español>" } }`.
- **Códigos y estado HTTP:** `unauthorized` 401 · `forbidden` 403 · `not_found` 404 · `conflict` 409 · `validation_failed` 422 · `rate_limited` 429 · `captcha_failed` 400 · `invitation_invalid` 400 · `unavailable` 503 · `db_unavailable` 503 · `internal` 500.
- **Validación:** zod 4 en el borde (cada handler y Server Action); los esquemas viven junto a su lógica en `src/server/<área>/`.
- **Paginación:** listas acotadas por diseño (día, semana, mes, últimos 14 días, últimos 50 del feed); PostgREST corta en 1000 filas (`max_rows`).
- **Idempotencia:** `POST /api/occurrences/mark` exige `idempotencyKey` (uuid) guardado como PK en `occurrence_marks`; las rutas de cron son idempotentes por diseño (reclamar antes de enviar, `on conflict do nothing`).
- **Límites de frecuencia:** tabla `private.rate_limits` (sin servicios externos), ventanas fijas, claves con HMAC: ingreso 5/15 min por correo y 300/15 min por IP, comentarios 10/h, emergencia 3/10 min por vínculo, invitaciones 10/día, contacto web 5/h por IP, "Listo" de la persona cuidada 30/10 min, prueba de aviso 5/h. Además, los límites propios de Supabase Auth.
- **Autenticación de rutas:** cookie de sesión (`HttpOnly`) o `Authorization: Bearer <jwt>`; cron con `x-cron-secret`; vista sin cuenta con el token en la URL.

### Routes

| Method | Path | Description | Auth | Rate limit |
|---|---|---|---|---|
| GET | `/api/health` | estado y base de datos | público | — |
| POST | `/api/cron/dispatch` | materializa y envía avisos | `x-cron-secret` | bloqueo `dispatch` |
| POST | `/api/cron/daily` | purgas, inactividad, limpieza | `x-cron-secret` | bloqueo `daily` |
| POST | `/api/push` | `subscribe`, `unsubscribe`, `test` | usuaria | `test` 5/h |
| POST | `/api/occurrences/mark` | marcar hecho / no hecho / pospuesto | usuaria (cuidadora o familia) | — (idempotente) |
| GET | `/api/cuenta/exportar` | descarga JSON o CSV de mis datos | usuaria | — |
| POST | `/api/v/[token]/listo` | la persona cuidada marca "Listo" | token del vínculo | 30/10 min |
| POST | `/api/v/[token]/emergencia` | alerta de emergencia | token del vínculo | 3/10 min |
| OPTIONS, POST | `/api/web/contact` | formulario de solecuida.com | público + Turnstile + CORS explícito | 5/h por IP |
| GET | `/api/admin/export` | eventos seudónimos en CSV | admin `aal2` | — |
| GET | `/auth/confirm` | verifica el enlace mágico | público | límites de Supabase Auth |
| GET | `/icons/[size]` | íconos PNG | público | — |

### Critical endpoints — full detail

**`POST /api/occurrences/mark`**
- Request: `{ occurrenceId: uuid, status: "done" | "not_done" | "snoozed", reason?: "rechazo" | "no_habia" | "otro", snoozeMinutes?: 5..240, idempotencyKey: uuid, via: "app" | "push" | "offline_sync" }`.
- Response 200: `{ ok: true, data: { id, status, done_at, snoozed_until } }`.
- Errores: sin sesión 401 `unauthorized`; no es miembro (o es `cared`) 403 `forbidden`; ocurrencia inexistente 404 `not_found`; esquema inválido 422 `validation_failed`; la clave ya se usó para otra ocurrencia, o el círculo está cerrado, 409 `conflict`.
- Efectos: una fila en `occurrence_marks` (si la clave es nueva) y la actualización de la ocurrencia en la misma transacción (RPC `mark_occurrence`); evento `occurrence.marked`. Repetir la clave no cambia nada y responde 200.

**`POST /api/cron/dispatch`**
- Request: header `x-cron-secret`; cuerpo ignorado.
- Response 200: `{ ok: true, data: { skipped?: true, notified, followups, woken } }`; sin el secreto, 401.
- Efectos: materializa 48 h; envía avisos y seguimientos (cada ocurrencia se reclama antes de enviar); vuelve a `pending` las pospuestas vencidas; borra suscripciones 404/410. Duración objetivo < 10 s; bloqueo de 55 s.

**`POST /api/push`**
- Request: `{ action: "subscribe", subscription: { endpoint: https-url, keys: { p256dh, auth } } }` · `{ action: "unsubscribe", subscription: { endpoint } }` · `{ action: "test" }`.
- Response 200: `{ ok: true, data: { active, count } }`. Errores 401, 422, 429.
- Efectos: alta/baja en `push_subscriptions` (un endpoint pertenece a una sola usuaria).

**`POST /api/v/[token]/emergencia`**
- Request: sin cuerpo. Response 200: `{ ok: true, data: { callNumber } }` (teléfono del contacto de emergencia o `131`).
- Errores: token inexistente, revocado o vencido 404; límite 429 `rate_limited`.
- Efectos: fila en `emergency_events`; aviso urgente a cuidadoras (y a familiares con `emergency` en sus avisos, si F16 existe).

**`GET /api/cuenta/exportar`**
- Query: `formato=json` | `formato=csv&tabla=recordatorios|cumplimiento|bitacora|tareas|contactos|bienestar`.
- Response 200 con `content-disposition: attachment`; JSON o CSV UTF-8 con BOM; campos cifrados ya descifrados para su dueña. Errores 401 y 422.

---

## 6. Frontend Architecture

### Routes

| Route | Page | Data source | Auth |
|---|---|---|---|
| `/` | Portada de la app (única indexable) | estática | pública |
| `/entrar` | Ingreso (enlace mágico, contraseña opcional) | Server Actions | pública |
| `/bienvenida/consentimientos` | Consentimientos por capas | `consents.ts` | sesión |
| `/bienvenida` | Persona cuidada + plantilla | `circles.ts` | sesión + consentimientos |
| `/hoy` | Hoy (F2) | `today.ts` | app |
| `/recordatorios`, `/recordatorios/editar` | Recordatorios (F3) | `reminders.ts` | app |
| `/calendario` | Mes y semana (F4) | `calendar.ts` | app |
| `/tareas` | Tareas (F5) | `tasks.ts` | app |
| `/bitacora` | Bitácora (F6) | `journal.ts` | app |
| `/informes`, `/informes/imprimir`, `/informes/medico` | Informes (F7, F14) | `summary.ts`, `doctor-report.ts` | app |
| `/para-ti` | Cuidar a quien cuida (F8) | `selfcare.ts` | app |
| `/contactos` | Contactos (F9) | `contacts.ts` | app |
| `/pronto`, `/pronto/[puerta]` | Puertas falsas (F11) | `doors.ts` | app |
| `/persona-cuidada` | Vínculos (F12) | `links.ts` | app (cuidadora) |
| `/avisos` | Avisos push y preferencias | `subscriptions.ts` | app |
| `/cuenta` | Mi cuenta (F13) | `export.ts`, `lifecycle.ts` | app |
| `/circulo`, `/circulo/actividad` | Familiares (F16) | `invitations.ts`, `feed.ts` | app |
| `/admin`, `/admin/mfa`, `/admin/organizaciones`, `/admin/contenido`, `/admin/comentarios`, `/admin/limites` | Panel (F15) | `metrics.ts`, `content.ts`, `limits.ts` | admin `aal2` |
| `/v/[token]` | Vista de la persona cuidada (F12) | `links.ts` | token |
| `/invitar/[token]` | Aceptar invitación (F16) | `invitations.ts` | sesión |
| `/org/[token]` | Panel de organización (F17) | `org-dashboard.ts` | token |
| `/~offline` | Hoy guardado | IndexedDB | — |

"app" = sesión + consentimientos requeridos + al menos un círculo + cuenta no pendiente de borrado (lo decide `src/app/(app)/layout.tsx`).

### Rendering strategy

Todo es dinámico y por sesión: la CSP con nonce (paso paso 43 (`cabeceras-csp`)) obliga a render por petición, y ningún dato personal se cachea en el CDN. Páginas = Server Components que leen con el cliente de servidor; mutaciones = Server Actions (formularios) o `fetch` a Route Handlers (marcas, push, cola sin conexión). La portada `/` no lee datos. `manifest.ts`, `robots.ts`, `sitemap.ts` e íconos se generan en el build (`generateStaticParams` en `/icons/[size]`). El service worker precachea solo recursos estáticos del build; las páginas se sirven con red primero y `/~offline` como respaldo.

### Component hierarchy

```
src/app/layout.tsx (servidor: html lang="es-CL", fuente, "Saltar al contenido")
└─ (app)/layout.tsx (servidor: sesión, consentimientos, círculo, estado de cuenta, navegación)
   ├─ FeedbackButton (cliente, fijo)
   └─ hoy/page.tsx (servidor: getToday)
      ├─ cambiador de círculo (enlaces ?c=, servidor)
      ├─ SurveyCard (cliente)
      ├─ TipCard (cliente) ← Server Action acceptActivity
      ├─ OccurrenceItem × n (cliente) → POST /api/occurrences/mark · cola IndexedDB si no hay red
      └─ OfflineSync (cliente: guarda la foto del día, reenvía la cola, "Sin conexión")

recordatorios/editar/page.tsx (servidor)
└─ ReminderForm (cliente: react-hook-form + zod) → Server Action saveReminder

v/[token]/page.tsx (servidor: resolveLink + visibleToday)
├─ ítems con "Listo" (cliente) → POST /api/v/[token]/listo
└─ EmergencyButton (cliente: confirmación → POST /api/v/[token]/emergencia → enlace tel:)
```

### State management

- **Estado del servidor:** lo traen los Server Components en cada navegación; después de una Server Action, `revalidatePath` de la ruta. Sin librería de caché del lado del cliente: no hace falta.
- **Estado del cliente:** solo local al componente (formularios con react-hook-form, diálogos, actualización optimista de una marca).
- **Sin conexión:** IndexedDB `sole` con `snapshot` (último "Hoy" por círculo) y `outbox` (marcas pendientes con su `idempotencyKey`).
- **Deliberadamente fuera de estado global:** sesión (cookie `HttpOnly`), círculo activo (va en la URL `?c=`, no en una cookie) y datos de otras pantallas.

### Loading, empty, and error states

| Superficie | Cargando | Vacío | Error |
|---|---|---|---|
| Hoy | esqueleto de 3 ítems (`loading.tsx`) | "Hoy no hay nada pendiente. Si quieres, agrega un recordatorio." | "No pudimos cargar tu día. Revisa tu conexión." + reintentar; sin red → `/~offline` |
| Recordatorios | esqueleto | "Todavía no hay recordatorios. Crea el primero." | mensaje + reintentar |
| Calendario | esqueleto de grilla | día sin ítems = celda vacía con "Agregar" | mensaje |
| Bitácora | botón con `aria-busy` | "Aún no escribes en la bitácora. Hoy puede ser el primer día." | error de campo con `role="alert"` |
| Informes | esqueleto | "Cuando tengas una semana de uso, aquí verás tu resumen." | mensaje |
| Para ti (recursos) | — | "Estamos verificando los recursos. Vuelve pronto." | mensaje |
| Contactos · Tareas | esqueleto | frase cálida + acción | mensaje |
| Admin | esqueleto | "Sin datos para este filtro." | mensaje (sin detalles internos) |
| Marcar un ítem | optimista | — | sin red: "Guardado sin conexión · se enviará cuando vuelva la señal"; otro error: se revierte y se avisa |

Errores no controlados: `error.tsx` / `global-error.tsx` ("Algo salió mal. Ya nos llegó el aviso."), nunca el mensaje interno.

---

## 7. Design System

Neutro y cálido para personas cansadas; no es la estética de carta de la web, pero conserva su paleta y su logo. Valores derivados de `web/assets/estilo.css` (decisión registrada en §20.3). Fuente única de verdad: `app/src/app/globals.css` y `app/src/lib/design/tokens.ts` (mismos hex; una prueba lo exige).

### Colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | #faf6ef | #16120e | fondo de página |
| `--surface` | #f4ede1 | #1e1913 | tarjetas, paneles, diálogos |
| `--fg` | #241f1a | #f0e8dc | texto |
| `--fg-muted` | #5f5548 | #b6a894 | texto secundario |
| `--fg-subtle` | #726556 | #9c8e7c | pistas, metadatos |
| `--primary` | #9c5b34 | #dc9264 | botón principal, enlaces, foco |
| `--primary-fg` | #ffffff | #16120e | texto sobre primario |
| `--primary-hover` | #84492a | #eaad84 | hover del botón principal |
| `--border` | #e3d9c9 | #322a20 | divisores decorativos (no delimitan controles) |
| `--border-strong` | #726556 | #9c8e7c | borde de campos y controles |
| `--focus` | #9c5b34 | #dc9264 | anillo de foco de 3 px |
| `--success` / `--success-bg` | #2f6b3a / #e6f1e7 | #86c793 / #1b2a1d | confirmaciones |
| `--warning` / `--warning-bg` | #7a5200 / #f8ecd2 | #e5b764 / #2c2414 | atención |
| `--danger` / `--danger-bg` | #a3312b / #f8e3e0 | #f2958a / #2f1b18 | errores, borrar, emergencia |
| `--info` / `--info-bg` | #2b5a86 / #e2ecf5 | #93bde8 / #18232f | información |

**Contrast** (WCAG 2.x, calculados para este plano; `tests/unit/design-system.test.ts` los vuelve a calcular):

| Par | Claro | Oscuro | Mínimo |
|---|---|---|---|
| `--fg` sobre `--background` / `--surface` | 15.16 / 14.03 | 15.33 / 14.36 | 4.5 |
| `--fg-muted` sobre `--background` / `--surface` | 6.77 / 6.27 | 8.00 / 7.49 | 4.5 |
| `--fg-subtle` sobre `--background` / `--surface` | 5.25 / 4.86 | 5.83 / 5.46 | 4.5 |
| `--primary` (enlaces) sobre `--background` / `--surface` | 4.92 / 4.56 | 7.40 / 6.93 | 4.5 |
| `--primary-fg` sobre `--primary` | 5.30 | 7.40 | 4.5 |
| `--primary-fg` sobre `--primary-hover` | 7.08 | 9.59 | 4.5 |
| `--success` sobre `--background` / `--surface` / `--success-bg` | 5.93 / 5.49 / 5.51 | 9.41 / 8.81 / 7.60 | 4.5 |
| `--warning` sobre `--background` / `--surface` / `--warning-bg` | 6.42 / 5.95 / 5.91 | 10.02 / 9.38 / 8.24 | 4.5 |
| `--danger` sobre `--background` / `--surface` / `--danger-bg` | 6.43 / 5.95 / 5.63 | 8.38 / 7.84 / 7.31 | 4.5 |
| `--info` sobre `--background` / `--surface` / `--info-bg` | 6.70 / 6.20 / 6.03 | 9.48 / 8.88 / 8.09 | 4.5 |
| `--border-strong` sobre `--background` / `--surface` | 5.25 / 4.86 | 5.83 / 5.46 | 3 |
| `--focus` sobre `--background` / `--surface` | 4.92 / 4.56 | 7.40 / 6.93 | 3 |

Los tres pares más riesgosos son `--primary` sobre `--surface` en claro (4.56), `--fg-subtle` sobre `--surface` en claro (4.86) y `--primary-fg` sobre `--primary` en claro (5.30); todos pasan. `#b8734a` (acento claro de la web) no se usa con texto encima: con blanco da 3.76; por eso el hover claro es `#84492a`. `--border` (1.68 sobre el fondo) es solo decorativo; los controles usan `--border-strong`.

### Typography

| Role | Family | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| Display | Atkinson Hyperlegible | 36 px / 1.2 (2rem) | 700 | 0 |
| Heading | Atkinson Hyperlegible | 30 · 24 · 20 px / 1.3 | 700 | 0 |
| Body | Atkinson Hyperlegible | 18 px / 1.5 (`html { font-size: 112.5% }`) | 400 | 0 |
| Mono | `ui-monospace, monospace` (solo códigos y admin) | 16 px / 1.5 | 400 | 0 |

Vista de la persona cuidada (F12): títulos de ítem ≥ 28 px, botones de 64 px de alto.

**Font loading:** `next/font/google` descarga Atkinson Hyperlegible en el build y la sirve desde el propio dominio (sin llamada a Google en el navegador), pesos 400 y 700, subconjunto `latin`, `display: "swap"`, variable `--font-atkinson`, respaldo `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Licencia SIL OFL 1.1 (`docs/licencias.md`).

### Spacing, radius, elevation

- Espaciado: base 4 px — 4, 8, 12, 16, 24, 32, 48, 64 (escala de Tailwind 1, 2, 3, 4, 6, 8, 12, 16).
- Radio: 12 px botones y campos; 16 px tarjetas y diálogos; completo para insignias.
- Sombras: plano con bordes; solo diálogos `0 8px 24px rgb(0 0 0 / 0.18)`.
- Ancho máximo de contenido: 40rem (720 px a 18 px). Puntos de quiebre: 640 px y 1024 px (móvil primero).
- Objetivos táctiles: mínimo 48 × 48 px (WCAG 2.5.8 pide 24; aquí se dobla por el público).

### Motion

150 ms `ease-out` para aparecer/desaparecer (`opacity`, `transform`); nada más se anima. Con `prefers-reduced-motion: reduce` todas las animaciones y transiciones quedan en 0.01ms (regla global en `globals.css`). Sin animaciones decorativas, sin parpadeos, sin confeti en los hitos.

### Component style

Calmo, legible y obvio: superficies planas color papel, un solo color de acción (el terracota del logo), texto grande, un botón principal por pantalla y etiquetas que dicen exactamente qué pasa ("Hecho", "No se hizo", "Posponer"). Un componente nuevo pertenece al sistema si usa solo tokens, tiene objetivos de 48 px, se entiende sin color y no necesita instrucciones.

---

## 8. Authentication & Authorization

### Provider and rationale

Supabase Auth (`knowledge/capabilities/auth.md`, fila de autenticación de la plataforma): la sesión ya es el contexto de las políticas RLS, así que la base aplica los permisos en cada consulta. Enlace mágico como camino principal (sin contraseñas que olvidar), contraseña opcional, TOTP obligatorio para admin, Turnstile como captcha.

### Flows

1. **Registro / ingreso con enlace:** `/entrar` (`?org=CODIGO` opcional) → Server Action `requestMagicLink` (límite, Turnstile) → Supabase envía el correo por Resend (plantilla `magic-link.html`: `…/auth/confirm?token_hash=…&type=email&next=/hoy`) → `/auth/confirm` hace `verifyOtp` → cookie de sesión → `/hoy`. El trigger crea `profiles` y guarda `org_code` si el código existe. La respuesta es siempre la misma, exista o no la cuenta.
2. **Ingreso con contraseña:** opcional; se crea desde `/cuenta` (`updateUser({ password })`, mínimo 10 caracteres con mayúsculas, minúsculas y números). Error genérico "Correo o contraseña incorrectos.".
3. **Bienvenida:** `(app)/layout.tsx` → sin consentimientos `terms` y `sensitive` vigentes → `/bienvenida/consentimientos` (edad ≥ 18 y declaración de autorización obligatorias; investigación opcional; nada marcado) → sin círculo → `/bienvenida` → `/hoy?bienvenida=1` (guía de instalación; el permiso de avisos se pide recién en `/avisos` al tocar el botón).
4. **Enlace vencido o inválido:** `/entrar?error=enlace` con "El enlace venció o ya se usó. Pide uno nuevo.".
5. **Expiración de sesión:** JWT de 1 hora con rotación del token de refresco (el proxy refresca en cada petición); sin sesión válida, el proxy redirige a `/entrar?next=…` (solo rutas relativas).
6. **Salir:** botón "Salir" → `signOut()` → `/`.
7. **Borrado de cuenta:** `/cuenta` → confirmación → `deletion_requested_at` + `deactivated_at` + cierre de todas las sesiones → durante 7 días, al volver a entrar ve "Recuperar mi cuenta"; el trabajo diario purga al octavo día con la RPC `purge_user`, que borra la fila de `auth.users` (después de los eventos del seudónimo): la cascada de llaves foráneas elimina en una sola sentencia el perfil, los círculos que creó —también los que ven sus familiares, cosa que la pantalla de borrado advierte— y todo lo que cuelga de ellos, sin depender de que el código recuerde cada tabla. Inactividad: aviso a los 11 meses, purga a los 12 si hubo aviso hace ≥ 30 días.
8. **Admin:** `profiles.is_admin = true` solo por SQL manual del fundador → `/admin` → si la sesión es `aal1`, `/admin/mfa` (inscribir o verificar TOTP) → `aal2`.
9. **Persona cuidada:** sin cuenta; token de 43 caracteres en `/v/<token>`, revocable, vence en 90 días.
10. **Familiar (F16):** `/invitar/<token>` → ingresa o se registra → consentimientos → "Unirme" → rol `family`.

### Route protection

| Surface | Rule | Enforced where |
|---|---|---|
| `(app)/*` | sesión + consentimientos + círculo + cuenta activa | `app/src/proxy.ts` (sesión) y `app/src/app/(app)/layout.tsx` (lo demás) |
| `(onboarding)/*` | sesión | `app/src/app/(onboarding)/layout.tsx` |
| `/admin/*` | `is_admin` + `aal2` (si no, 404 o `/admin/mfa`) | `app/src/app/admin/layout.tsx` + `app/src/server/admin/guard.ts` + RLS `private.is_admin_mfa()` |
| `/api/admin/export` | admin `aal2` (si no, 404) | el handler + RLS |
| `/api/cron/*` | `x-cron-secret` = `CRON_SECRET` (comparación de tiempo constante) | cada handler |
| `/api/push`, `/api/occurrences/mark`, `/api/cuenta/exportar` | sesión (cookie o Bearer) | cada handler con `createSupabaseRouteClient` + RLS/RPC |
| `/v/[token]`, `/api/v/[token]/*` | token válido, no revocado, no vencido; solo ítems visibles de ese círculo | `app/src/server/cared-link/links.ts` |
| `/org/[token]` | token válido; solo agregados con k ≥ 5 | `app/src/server/org/org-dashboard.ts` |
| Server Actions | `getUser()` dentro de cada acción | cada acción |

**Enforcement rule:** la autorización se comprueba en el servidor en cada petición y, debajo, la base la vuelve a comprobar con RLS. Un botón oculto no es un permiso.

### Roles and permissions

| Role | Can | Cannot |
|---|---|---|
| Cuidadora (`caregiver`) | todo en sus círculos: recordatorios, tareas, bitácora, contactos, vínculos, invitaciones, cierre; sus datos de bienestar, consentimientos, exportación y borrado | ver círculos ajenos; tocar `circle_id`, `created_by`, roles, `is_admin`; leer `events` o `feedback` |
| Familiar (`family`, F16) | ver "Hoy", calendario, recordatorios, bitácora, informes del círculo; marcar ítems; tomar tareas; sus propias preferencias de aviso | crear o editar recordatorios, tareas, contactos o vínculos; cambiar roles o configuración; ver el bienestar de la cuidadora |
| Persona cuidada (vínculo, sin cuenta) | ver los ítems de hoy marcados como visibles; "Listo"; pedir ayuda | cualquier otra cosa |
| Admin (`is_admin` + `aal2`) | métricas, organizaciones, contenido, comentarios, exportación seudónima, límites | leer datos personales de cuidado (bitácora, medicamentos, contactos, bienestar); darse admin a sí mismo o a otros desde la app |
| Organización (token F17) | agregados de su código con k ≥ 5 | ver filas individuales |
| `anon` | nada en tablas | — |

### Sessions

Cookies de `@supabase/ssr` con `HttpOnly`, `Secure` (en https), `SameSite=Lax`, `Path=/`; el navegador nunca las lee porque nunca habla con Supabase. JWT de 1 hora, rotación del token de refresco con reuso de 10 s (`config.toml` y panel en producción). CSRF: Server Actions comparan el origen (Next.js); las rutas que cambian estado reciben JSON (preflight CORS sin permiso para otros orígenes) o requieren un secreto/token; las cookies `SameSite=Lax` no viajan en POST de otros sitios.

### Multi-tenancy / row-level isolation

El "inquilino" es el círculo. Mecanismo: **RLS en todas las tablas** con funciones `security definer` (`private.is_member`, `private.is_caregiver`, `private.member_role_of`, `private.is_admin_mfa`) + **privilegios por columna** (`grant update (…)` sin columnas sensibles) + **RPC** para escrituras con reglas (`create_circle`, `mark_occurrence`, `close_circle`, `claim_task`, `accept_invitation`, `set_member_notify_kinds`). El cliente admin (que se salta RLS) solo se usa en código de servidor que primero resolvió y validó el círculo (token, secreto de cron o sesión). Las pruebas de `tests/db/rls-*.test.ts` lo demuestran con sesiones reales.

---

## 9. BUILD ORDER

Esta sección es el conjunto de instrucciones; todo lo anterior es contexto. Quien construye sigue los pasos en orden y se detiene cuando cada compuerta queda en verde. Los mismos pasos, con los mismos criterios palabra por palabra, están en `tasks.json` (qué sigue) y en `epics/` (cómo se hace cada uno sin abrir este archivo).

### The rules of a step

1. **Una sentada por paso.** Máximo 5 archivos y entre 2 y 6 criterios de aceptación por paso. Si algo no cabe, el plano está mal: se reporta.
2. **Cada paso tiene sus cuatro campos:** `Do`, `Done when`, `Verify`, `Checkpoint`. El `Checkpoint` es un bloque de shell literal: `git add -A && git commit -m "step N: <slug>"` y `git tag step-NN-<slug>`.
3. **"Done when" en forma EARS** (WHEN … THE SYSTEM SHALL …), observable y decidible por un comando en esta máquina.
4. **Prohibido "se ve bien"**, "funciona", "está implementado". Cada criterio nombra un estado, un código, una fila o un texto.
5. **`Verify` es shell literal** que sale con 0 cuando el paso está bien, corrido desde la raíz del repo; el comentario `# expect:` documenta, el código de salida decide.
6. **Un paso no está hecho hasta que su `Verify` pasa y los de los pasos anteriores siguen pasando.**
7. **Checkpoint en cada paso.** Si un paso sale mal: `git reset --hard step-<NN-1>-<slug-anterior>` (la etiqueta real del paso anterior) y se reintenta; nunca se depura hacia adelante sobre un checkpoint roto.
8. **Nunca adelantarse.** Si un paso queda bloqueado, se detiene y se reporta; no se empieza el siguiente "mientras tanto".
9. **Ningún paso rompe la compuerta de uno anterior.** Las variables de entorno se exigen solo desde el paso que indica §10 ("Required by step"): `src/lib/env.ts` las pide cuando se usan, nunca al importar. Las reglas de lint y de tipos ya están completas desde el Bootstrap.
10. **Ningún número contado a ojo.** Las compuertas afirman propiedades ("toda tabla de `public` tiene RLS", "0 failed") en vez de conteos del plano. Los únicos números fijos son invariantes del producto (30 puntos de la lista 6.2 del brief, 5 personas como mínimo en F17, 48 horas de materialización, 7 días de gracia).
11. **Un `Verify` sale con 0 cuando el paso es correcto**; si el resultado correcto es un código distinto de 0, se envuelve: `status=0; cmd || status=$?; test "$status" -eq N`.
12. **Cada comprobación es posible en su medio**: los tipos los ve `tsc`; la conducta, las pruebas; los textos de la web, una prueba que lee los archivos.
13. **El primer paso que produce algo ejecutable lo ejecuta**: el paso 1 levanta el build en :3100 y pide `/api/health`.
14. **Un `Verify` no depende de su propio `Checkpoint`**: nada de `git status` limpio, `git ls-files` sobre archivos del mismo paso ni etiquetas propias.
15. **Sin salidas literales escritas antes que su productor** que dependan del runtime: los textos que se comparan los produce el propio código desde plantillas fijas (sin `Intl` ni mensajes de error del motor).
16. **Una compuerta falla por la razón que dice**: nunca `!` ni `test $? -ne 0`.
17. **Cierre de fase:** al terminar el último paso de cada fase del brief (§9 del brief), quien construye se detiene y le entrega al fundador un resumen corto: qué funciona, cómo probarlo, qué decidió (`DECISIONES.md`) y qué necesita. Sigue solo con su visto bueno, salvo que él diga que avance sin parar. `PENDIENTES.md` queda al día antes de cualquier pausa.

### One step, one unit — the counting rule

> **Un paso de §9 = una tarea de `tasks.json` = un bloque de tarea en un archivo de `epics/`.**

Este plano tiene **70 pasos** en **10 épicas** (de 5 a 9 pasos cada una; mínimo legal `ceil(70 ÷ 9)`, máximo `floor(70 ÷ 5)`). Es más que el rango típico de 10–18 de la plantilla porque el brief fija 17 funcionalidades, tres listas de verificación (seguridad, legal, web) y el trabajo fuera de la app; en vez de recortar alcance, cada paso se mantuvo en una sentada y las fases del brief se respetan como límites de épica. Las reglas de corte del brief (§9) siguen mandando: las épicas 02 a 07 (fases 1, 2, 4 y 5) son el mínimo para lanzar; la épica 10 es opcional y sus tareas tienen prioridad `p2`.

| Épica | Fase del brief | Pasos |
|---|---|---|
| `01-preparacion` — Preparación | Fase 0 (preparación) y la parte de diseño funcional de la fase 1 del brief. | 1–8 (8) |
| `02-cimientos` — Cimientos: seguridad, ingreso y bienvenida | Fase 1 del brief (cimientos). | 9–16 (8) |
| `03-recordatorios-y-avisos` — Recordatorios y avisos | Fase 2 del brief, primera mitad (F3 y notificaciones reales). | 17–24 (8) |
| `04-dia-a-dia` — El día a día | Fase 2 del brief, segunda mitad (F2, F4, F6, F8, F13 y sin conexión). | 25–33 (9) |
| `05-informes-y-escucha` — Informes y escucha | Fase 3 del brief (F7, F10, F11, F15 y catálogo de eventos en uso). | 34–42 (9) |
| `06-seguridad-y-calidad` — Seguridad y calidad | Fase 4 del brief. | 43–48 (6) |
| `07-despliegue` — Despliegue y operación | Fase 5 del brief. | 49–53 (5) |
| `08-ampliacion` — Ampliación | Fase 6 del brief (F5, F9, F12, F14). | 54–59 (6) |
| `09-fuera-de-la-app` — Fuera de la app | Fase 7 del brief (§8.1 web, §8.2 alianzas, documentos legales y planes). | 60–65 (6) |
| `10-si-sobra-tiempo` — Si sobra tiempo: familiares, organizaciones y pulido | Fase 8 del brief. Opcional: se construye solo si sobra tiempo o cuota. | 66–70 (5) |

### Step map

| # | Step | Depends on | Touches | Gate |
|---|---|---|---|---|
| 1 | Montar el esqueleto de la app y su endpoint de salud | — | `app/next.config.ts`<br>`app/src/lib/env.ts`<br>`app/src/app/api/health/route.ts`<br>`app/tests/unit/env-health.test.ts`<br>`app/tests/e2e/smoke.spec.ts` | `pnpm -C app test:e2e tests/e2e/smoke.spec.ts` |
| 2 | Conectar Supabase local, tipos generados y clientes | 1 | `app/src/lib/supabase/database.types.ts`<br>`app/src/lib/supabase/server.ts`<br>`app/src/lib/supabase/admin.ts`<br>`app/tests/db/helpers.ts`<br>`app/tests/db/connection.test.ts` | `pnpm -C app test tests/db/connection.test.ts` |
| 3 | Configurar CI, Dependabot y escaneo de secretos | 1 | `.github/workflows/ci.yml`<br>`.github/dependabot.yml`<br>`.gitleaks.toml`<br>`.githooks/pre-commit`<br>`app/tests/unit/repo-config.test.ts` | `sh .githooks/pre-commit` |
| 4 | Definir las variables de diseño y la tipografía | 1 | `app/src/app/globals.css`<br>`app/src/app/layout.tsx`<br>`app/src/app/page.tsx`<br>`app/src/lib/design/tokens.ts`<br>`app/tests/unit/design-system.test.ts` | `pnpm -C app build` |
| 5 | Crear los componentes base accesibles | 4 | `app/src/components/ui/button.tsx`<br>`app/src/components/ui/field.tsx`<br>`app/src/components/ui/choice-group.tsx`<br>`app/src/components/ui/dialog.tsx`<br>`app/tests/unit/ui-components.test.tsx` | `pnpm -C app test tests/unit/ui-components.test.tsx` |
| 6 | Abrir DECISIONES, PENDIENTES, límites y licencias | 1 | `DECISIONES.md`<br>`PENDIENTES.md`<br>`docs/limites.md`<br>`docs/licencias.md`<br>`app/tests/unit/docs-base.test.ts` | `pnpm -C app test tests/unit/docs-base.test.ts` |
| 7 | Escribir el diseño funcional de F1–F11, F14 y F16 | 6 | `docs/diseno/nucleo.md`<br>`docs/diseno/registro-y-cuidado.md`<br>`docs/diseno/informes-y-escucha.md`<br>`docs/diseno/familiares.md`<br>`app/tests/unit/docs-diseno.test.ts` | `pnpm -C app test tests/unit/docs-diseno.test.ts` |
| 8 | Completar el diseño funcional de F12, F13, F15 y F17 | 7 | `docs/diseno/persona-cuidada.md`<br>`docs/diseno/cuenta.md`<br>`docs/diseno/admin-y-organizaciones.md`<br>`docs/diseno/transversal.md`<br>`app/tests/unit/docs-diseno.test.ts` | `pnpm -C app test tests/unit/docs-diseno.test.ts` |
| 9 | Probar el aislamiento por rol y los límites de frecuencia | 2 | `app/src/server/security/rate-limit.ts`<br>`app/tests/db/rls-circles.test.ts`<br>`app/tests/db/rls-private.test.ts`<br>`app/tests/db/rate-limit.test.ts` | `pnpm -C app test tests/db/rate-limit.test.ts` |
| 10 | Construir el ingreso con enlace mágico y contraseña | 2, 5, 9 | `app/src/server/auth/login.ts`<br>`app/src/app/(auth)/entrar/page.tsx`<br>`app/src/app/(auth)/entrar/actions.ts`<br>`app/tests/unit/auth-login.test.ts` | `pnpm -C app test tests/unit/auth-login.test.ts` |
| 11 | Proteger rutas, confirmar enlaces y fijar cookies seguras | 10 | `app/src/lib/auth/route-rules.ts`<br>`app/src/proxy.ts`<br>`app/src/app/auth/confirm/route.ts`<br>`app/tests/unit/proxy-rules.test.ts`<br>`app/tests/e2e/auth.spec.ts` | `pnpm -C app test:e2e tests/e2e/auth.spec.ts` |
| 12 | Pedir los consentimientos por capas antes de guardar datos | 11 | `app/src/server/consents/consents.ts`<br>`app/src/app/(onboarding)/layout.tsx`<br>`app/src/app/(onboarding)/bienvenida/consentimientos/page.tsx`<br>`app/src/app/(app)/layout.tsx`<br>`app/tests/db/consents.test.ts` | `pnpm -C app test tests/db/consents.test.ts` |
| 13 | Crear el catálogo de eventos y su registro seudónimo | 12 | `app/src/server/events/catalog.ts`<br>`app/src/server/events/track.ts`<br>`docs/eventos.md`<br>`app/tests/unit/events-catalog.test.ts`<br>`app/tests/db/events.test.ts` | `pnpm -C app test tests/db/events.test.ts` |
| 14 | Cargar plantillas, consejos y recursos iniciales | 2 | `app/supabase/migrations/20261114001000_contenido_inicial.sql`<br>`app/src/server/reminders/rule-schema.ts`<br>`app/tests/db/content.test.ts` | `pnpm -C app test tests/db/content.test.ts` |
| 15 | Crear la persona cuidada desde una plantilla (F1) | 12, 13, 14 | `app/src/server/circles/circles.ts`<br>`app/src/app/(onboarding)/bienvenida/page.tsx`<br>`app/src/components/onboarding/care-type-picker.tsx`<br>`app/src/components/onboarding/install-guide.tsx`<br>`app/tests/db/create-circle.test.ts` | `pnpm -C app test tests/db/create-circle.test.ts` |
| 16 | Probar la bienvenida completa y el origen por organización | 15 | `app/tests/e2e/fixtures.ts`<br>`app/tests/e2e/onboarding.spec.ts`<br>`app/src/app/(app)/hoy/page.tsx`<br>`app/src/app/page.tsx`<br>`app/tests/db/org-attribution.test.ts` | `pnpm -C app test:e2e tests/e2e/onboarding.spec.ts` |
| 17 | Expandir reglas de repetición con horario de Chile | 14 | `app/src/server/reminders/recurrence.ts`<br>`app/tests/unit/recurrence.test.ts`<br>`app/tests/unit/recurrence-dst.test.ts` | `pnpm -C app test tests/unit/recurrence-dst.test.ts` |
| 18 | Cifrar campos sensibles y guardar recordatorios | 17, 9, 13 | `app/src/lib/crypto/field.ts`<br>`app/tests/unit/field-crypto.test.ts`<br>`app/src/server/reminders/reminders.ts`<br>`app/tests/db/reminders.test.ts` | `pnpm -C app test tests/db/reminders.test.ts` |
| 19 | Crear y editar recordatorios desde la app (F3) | 18, 16 | `app/src/app/(app)/recordatorios/page.tsx`<br>`app/src/app/(app)/recordatorios/editar/page.tsx`<br>`app/src/app/(app)/recordatorios/actions.ts`<br>`app/src/components/reminders/reminder-form.tsx`<br>`app/tests/e2e/reminders.spec.ts` | `pnpm -C app test:e2e tests/e2e/reminders.spec.ts` |
| 20 | Materializar las ocurrencias de las próximas 48 horas | 18 | `app/src/server/reminders/materialize.ts`<br>`app/tests/db/materialize.test.ts` | `pnpm -C app test tests/db/materialize.test.ts` |
| 21 | Enviar avisos y el "¿Lo hiciste?" a los 15 minutos | 20 | `app/src/server/push/send.ts`<br>`app/src/server/reminders/dispatch.ts`<br>`app/src/app/api/cron/dispatch/route.ts`<br>`app/scripts/trigger-cron.ts`<br>`app/tests/db/dispatch.test.ts` | `pnpm -C app test tests/db/dispatch.test.ts` |
| 22 | Publicar el manifiesto y los íconos de la PWA | 4, 21 | `app/src/app/manifest.ts`<br>`app/src/app/icons/[size]/route.tsx`<br>`app/tests/e2e/manifest.spec.ts` | `pnpm -C app test:e2e tests/e2e/manifest.spec.ts` |
| 23 | Registrar el service worker con avisos push (Serwist) | 22 | `app/src/sw.ts`<br>`app/next.config.ts`<br>`app/tsconfig.json`<br>`app/tests/e2e/pwa.spec.ts` | `pnpm -C app test:e2e tests/e2e/pwa.spec.ts` |
| 24 | Activar, probar y mostrar el estado de los avisos | 23 | `app/src/server/push/subscriptions.ts`<br>`app/src/app/api/push/route.ts`<br>`app/src/components/push/push-settings.tsx`<br>`app/src/app/(app)/avisos/page.tsx`<br>`app/tests/db/push-subscriptions.test.ts` | `pnpm -C app test tests/db/push-subscriptions.test.ts` |
| 25 | Construir "Hoy" y la marca idempotente de ítems (F2) | 24, 19 | `app/src/server/today/today.ts`<br>`app/src/app/(app)/hoy/page.tsx`<br>`app/src/components/today/occurrence-item.tsx`<br>`app/src/app/api/occurrences/mark/route.ts`<br>`app/tests/db/today.test.ts` | `pnpm -C app test tests/db/today.test.ts` |
| 26 | Sumar el consejo del día y el cambio de círculo | 25 | `app/src/server/today/tips.ts`<br>`app/src/components/today/tip-card.tsx`<br>`app/src/app/(app)/hoy/page.tsx`<br>`app/tests/unit/tips.test.ts`<br>`app/tests/e2e/today.spec.ts` | `pnpm -C app test:e2e tests/e2e/today.spec.ts` |
| 27 | Encolar marcas sin conexión y reenviarlas al volver la señal | 26 | `app/src/lib/offline/outbox.ts`<br>`app/src/components/today/offline-sync.tsx`<br>`app/src/components/today/occurrence-item.tsx`<br>`app/src/app/(app)/hoy/page.tsx`<br>`app/tests/e2e/offline-queue.spec.ts` | `pnpm -C app test:e2e tests/e2e/offline-queue.spec.ts` |
| 28 | Mostrar "Hoy" guardado cuando no hay señal | 27 | `app/src/app/~offline/page.tsx`<br>`app/src/sw.ts`<br>`app/tests/e2e/offline-reload.spec.ts` | `pnpm -C app test:e2e tests/e2e/offline-reload.spec.ts` |
| 29 | Mostrar el calendario de mes y de semana (F4) | 25 | `app/src/server/calendar/calendar.ts`<br>`app/src/app/(app)/calendario/page.tsx`<br>`app/src/components/calendar/month-grid.tsx`<br>`app/tests/unit/calendar.test.ts`<br>`app/tests/e2e/calendar.spec.ts` | `pnpm -C app test:e2e tests/e2e/calendar.spec.ts` |
| 30 | Registrar la bitácora diaria en menos de 15 segundos (F6) | 25 | `app/src/server/journal/journal.ts`<br>`app/src/app/(app)/bitacora/page.tsx`<br>`app/src/components/journal/journal-form.tsx`<br>`app/tests/db/journal.test.ts`<br>`app/tests/e2e/journal.spec.ts` | `pnpm -C app test:e2e tests/e2e/journal.spec.ts` |
| 31 | Cuidar a quien cuida: pregunta, respiro y recursos (F8) | 25 | `app/src/server/selfcare/selfcare.ts`<br>`app/src/app/(app)/para-ti/page.tsx`<br>`app/src/components/selfcare/respiro-dialog.tsx`<br>`app/tests/db/selfcare.test.ts`<br>`app/tests/e2e/selfcare.spec.ts` | `pnpm -C app test:e2e tests/e2e/selfcare.spec.ts` |
| 32 | Ver consentimientos y descargar todos mis datos (F13) | 30, 31 | `app/src/server/account/export.ts`<br>`app/src/app/api/cuenta/exportar/route.ts`<br>`app/src/app/(app)/cuenta/page.tsx`<br>`app/tests/db/account-export.test.ts` | `pnpm -C app test tests/db/account-export.test.ts` |
| 33 | Borrar la cuenta con gracia de 7 días y cerrar círculo | 32 | `app/src/server/account/lifecycle.ts`<br>`app/src/components/account/restore-account.tsx`<br>`app/src/app/(app)/layout.tsx`<br>`app/src/app/(app)/cuenta/page.tsx`<br>`app/tests/db/account-lifecycle.test.ts` | `pnpm -C app test tests/db/account-lifecycle.test.ts` |
| 34 | Calcular resúmenes, avances e hitos (F7) | 33 | `app/src/server/reports/summary.ts`<br>`app/src/server/reports/milestones.ts`<br>`app/tests/unit/reports.test.ts`<br>`app/src/app/(app)/informes/page.tsx`<br>`app/src/components/reports/compliance-chart.tsx` | `pnpm -C app test tests/unit/reports.test.ts` |
| 35 | Compartir un informe como imagen o PDF desde el navegador | 34 | `app/src/components/reports/share-report.tsx`<br>`app/src/app/(app)/informes/imprimir/page.tsx`<br>`app/tests/e2e/reports.spec.ts` | `pnpm -C app test:e2e tests/e2e/reports.spec.ts` |
| 36 | Poner el botón permanente "Contarle algo a Sole" (F10) | 33 | `app/src/server/feedback/feedback.ts`<br>`app/src/server/feedback/actions.ts`<br>`app/src/components/feedback/feedback-button.tsx`<br>`app/src/app/(app)/layout.tsx`<br>`app/tests/db/feedback.test.ts` | `pnpm -C app test tests/db/feedback.test.ts` |
| 37 | Mostrar las microencuestas de los días 3, 14, 28 y 56 | 36 | `app/src/server/surveys/surveys.ts`<br>`app/src/components/feedback/survey-card.tsx`<br>`app/src/app/(app)/hoy/page.tsx`<br>`app/tests/db/surveys.test.ts`<br>`app/tests/e2e/feedback.spec.ts` | `pnpm -C app test:e2e tests/e2e/feedback.spec.ts` |
| 38 | Medir interés con puertas falsas honestas (F11) | 33 | `app/src/server/fake-doors/doors.ts`<br>`app/src/app/(app)/pronto/page.tsx`<br>`app/src/app/(app)/pronto/[puerta]/page.tsx`<br>`app/tests/db/fake-doors.test.ts`<br>`app/tests/e2e/fake-doors.spec.ts` | `pnpm -C app test:e2e tests/e2e/fake-doors.spec.ts` |
| 39 | Proteger el panel de administración con rol y MFA | 33 | `app/src/server/admin/guard.ts`<br>`app/src/app/admin/layout.tsx`<br>`app/src/app/admin/mfa/page.tsx`<br>`app/tests/support/totp.ts`<br>`app/tests/db/admin-access.test.ts` | `pnpm -C app test tests/db/admin-access.test.ts` |
| 40 | Mostrar las métricas de las hipótesis H1–H6 (F15) | 39, 37, 38 | `app/src/server/admin/metrics.ts`<br>`app/src/app/admin/page.tsx`<br>`app/src/components/admin/metric-chart.tsx`<br>`app/tests/db/admin-metrics.test.ts` | `pnpm -C app test tests/db/admin-metrics.test.ts` |
| 41 | Gestionar organizaciones, contenido y comentarios (F15) | 40, 31 | `app/src/server/admin/content.ts`<br>`app/src/app/admin/organizaciones/page.tsx`<br>`app/src/app/admin/contenido/page.tsx`<br>`app/src/app/admin/comentarios/page.tsx`<br>`app/tests/e2e/admin.spec.ts` | `pnpm -C app test:e2e tests/e2e/admin.spec.ts` |
| 42 | Exportar datos seudónimos y vigilar los límites gratuitos | 39 | `app/src/server/admin/limits.ts`<br>`app/src/app/api/admin/export/route.ts`<br>`app/src/app/admin/limites/page.tsx`<br>`app/tests/db/admin-export.test.ts` | `pnpm -C app test tests/db/admin-export.test.ts` |
| 43 | Aplicar CSP con nonce y cabeceras de seguridad | 41 | `app/src/lib/security/headers.ts`<br>`app/src/proxy.ts`<br>`app/next.config.ts`<br>`app/tests/unit/security-headers.test.ts`<br>`app/tests/e2e/security-headers.spec.ts` | `pnpm -C app test:e2e tests/e2e/security-headers.spec.ts` |
| 44 | Capturar errores en Sentry con datos personales filtrados | 43 | `app/src/lib/observability/scrub.ts`<br>`app/src/instrumentation.ts`<br>`app/src/instrumentation-client.ts`<br>`app/next.config.ts`<br>`app/tests/unit/scrub.test.ts` | `test -z "$(find app/.next/static -name '*.map' -print -quit)"` |
| 45 | Dejar producción limpia y sin secretos en el bundle | 44 | `app/src/app/error.tsx`<br>`app/src/app/global-error.tsx`<br>`app/src/app/not-found.tsx`<br>`app/tests/unit/production-hygiene.test.tsx`<br>`app/scripts/check-bundle-secrets.ts` | `pnpm -C app exec tsx scripts/check-bundle-secrets.ts` |
| 46 | Probar accesibilidad, teclado y el día completo P1 | 45 | `app/tests/e2e/a11y.spec.ts`<br>`app/tests/e2e/keyboard.spec.ts`<br>`app/tests/e2e/p1-flows.spec.ts` | `pnpm -C app test:e2e tests/e2e/p1-flows.spec.ts` |
| 47 | Documentar la evidencia de la lista de seguridad (6.2) | 46 | `docs/seguridad/checklist-6.2.md`<br>`docs/seguridad/asvs-checklist.md`<br>`docs/seguridad/owasp-top10.md`<br>`docs/seguridad/iso27001-anexo-a.md`<br>`app/tests/unit/docs-seguridad.test.ts` | `pnpm -C app test tests/unit/docs-seguridad.test.ts` |
| 48 | Escribir el modelo de amenazas y la privacidad | 47 | `docs/seguridad/modelo-amenazas.md`<br>`docs/seguridad/plan-incidentes.md`<br>`docs/legal/registro-actividades.md`<br>`docs/legal/eipd.md`<br>`app/tests/unit/docs-seguridad.test.ts` | `pnpm -C app test tests/unit/docs-seguridad.test.ts` |
| 49 | Borrar cuentas vencidas y avisar inactividad cada día | 33, 21 | `app/src/server/email/resend.ts`<br>`app/src/server/jobs/daily.ts`<br>`app/src/app/api/cron/daily/route.ts`<br>`app/tests/db/daily-jobs.test.ts` | `pnpm -C app test tests/db/daily-jobs.test.ts` |
| 50 | Preparar Vercel y la salud con base de datos | 49, 46 | `app/vercel.json`<br>`app/src/app/robots.ts`<br>`app/src/app/sitemap.ts`<br>`app/src/app/api/health/route.ts`<br>`app/tests/unit/deploy-config.test.ts` | `pnpm -C app test tests/unit/env-health.test.ts` |
| 51 | Programar respaldos cifrados, keep-alive y escaneos | 50, 3 | `.github/workflows/backup.yml`<br>`.github/workflows/keepalive.yml`<br>`.github/workflows/codeql.yml`<br>`.github/workflows/zap.yml`<br>`app/tests/unit/workflows.test.ts` | `pnpm -C app test tests/unit/workflows.test.ts` |
| 52 | Escribir el manual del fundador y rotar la clave de cifrado | 51 | `docs/mantenimiento.md`<br>`app/scripts/rotate-field-key.ts`<br>`app/tests/db/rotate-field-key.test.ts`<br>`app/tests/unit/docs-mantenimiento.test.ts` | `pnpm -C app test tests/unit/docs-mantenimiento.test.ts` |
| 53 | Cerrar variables de entorno y la lista de lanzamiento | 52 | `docs/lanzamiento.md`<br>`app/.env.example`<br>`app/tests/unit/env-example.test.ts`<br>`PENDIENTES.md` | `grep -q "## Antes de abrir al público" docs/lanzamiento.md` |
| 54 | Agregar tareas sin fecha y pasarlas a hoy (F5) | 53 | `app/src/server/tasks/tasks.ts`<br>`app/src/app/(app)/tareas/page.tsx`<br>`app/src/components/tasks/task-item.tsx`<br>`app/src/server/today/today.ts`<br>`app/tests/db/tasks.test.ts` | `pnpm -C app test tests/db/today.test.ts` |
| 55 | Guardar contactos importantes y el de emergencia (F9) | 53 | `app/src/server/contacts/contacts.ts`<br>`app/src/app/(app)/contactos/page.tsx`<br>`app/src/components/contacts/contact-form.tsx`<br>`app/tests/db/contacts.test.ts`<br>`app/tests/e2e/contacts.spec.ts` | `pnpm -C app test:e2e tests/e2e/contacts.spec.ts` |
| 56 | Crear y revocar el vínculo de la persona cuidada (F12) | 55 | `app/src/server/cared-link/links.ts`<br>`app/src/app/(app)/persona-cuidada/page.tsx`<br>`app/src/app/api/v/[token]/listo/route.ts`<br>`app/tests/db/cared-link.test.ts` | `pnpm -C app test tests/db/cared-link.test.ts` |
| 57 | Registrar emergencias y avisar a la cuidadora (F12) | 56 | `app/src/server/cared-link/emergency.ts`<br>`app/src/app/api/v/[token]/emergencia/route.ts`<br>`app/tests/db/emergency.test.ts` | `pnpm -C app test tests/db/emergency.test.ts` |
| 58 | Construir la vista grande de la persona cuidada (F12) | 57 | `app/src/app/v/[token]/page.tsx`<br>`app/src/components/cared/emergency-button.tsx`<br>`app/tests/e2e/cared-view.spec.ts` | `pnpm -C app test:e2e tests/e2e/cared-view.spec.ts` |
| 59 | Crear el informe para el médico, Premium en piloto (F14) | 35, 53 | `app/src/server/reports/doctor-report.ts`<br>`app/src/app/(app)/informes/medico/page.tsx`<br>`app/tests/unit/doctor-report.test.ts`<br>`app/tests/e2e/doctor-report.spec.ts`<br>`docs/negocio/planes.md` | `grep -q "## Cómo leer los datos de H4" docs/negocio/planes.md` |
| 60 | Preparar la web: CTA fija, compartir, favicon y pruebas | 53 | `web/assets/compartir.js`<br>`web/assets/estilo.css`<br>`web/favicon.svg`<br>`app/tests/unit/web-site.test.ts` | `pnpm -C app test tests/unit/web-site.test.ts` |
| 61 | Publicar privacidad, términos, cookies y llms.txt | 60 | `web/privacidad.html`<br>`web/terminos.html`<br>`web/cookies.html`<br>`web/llms.txt`<br>`web/404.html` | `grep -q "## Cómo probarla" web/llms.txt` |
| 62 | Cambiar el relato de la web y explicar cómo probar Sole | 61 | `web/index.html`<br>`web/probar.html`<br>`web/organizaciones.html`<br>`web/sitemap.xml`<br>`app/tests/unit/web-site.test.ts` | `pnpm -C app test tests/unit/web-site.test.ts` |
| 63 | Proteger el formulario de la web con Turnstile vía la app | 62, 43 | `web/contacto.html`<br>`web/assets/formulario.js`<br>`web/assets/config.js`<br>`app/src/app/api/web/contact/route.ts`<br>`app/tests/unit/web-contact-route.test.ts` | `test -z "$(grep -L 'data-pie="v2"' web/*.html)"` |
| 64 | Redactar las plantillas de correo para organizaciones | 62 | `app/scripts/check-alianzas.ts`<br>`alianzas/plantillas/fundacion.md`<br>`alianzas/plantillas/municipio.md`<br>`alianzas/plantillas/centro-salud.md`<br>`alianzas/plantillas/agrupacion-cuidadoras.md` | `pnpm -C app exec tsx scripts/check-alianzas.ts plantillas` |
| 65 | Armar la lista de organizaciones y el kit de piloto | 64 | `alianzas/plantillas/asociacion-pacientes.md`<br>`alianzas/organizaciones.csv`<br>`alianzas/seguimiento.csv`<br>`alianzas/kit-piloto.md`<br>`alianzas/pauta-entrevistas.md` | `grep -q "seguimiento-entrevistas.csv" alianzas/pauta-entrevistas.md` |
| 66 | Invitar familiares al círculo por enlace (F16) | 65, 59, 58, 54 | `app/src/server/family/invitations.ts`<br>`app/src/app/(app)/circulo/page.tsx`<br>`app/src/app/invitar/[token]/page.tsx`<br>`app/src/server/fake-doors/doors.ts`<br>`app/tests/db/family-invitations.test.ts` | `pnpm -C app test tests/db/fake-doors.test.ts` |
| 67 | Dejar que el familiar verifique y tome tareas (F16) | 66 | `app/src/server/today/today.ts`<br>`app/src/components/today/occurrence-item.tsx`<br>`app/src/server/tasks/tasks.ts`<br>`app/tests/db/family-permissions.test.ts` | `pnpm -C app test tests/db/today.test.ts` |
| 68 | Mostrar la actividad del círculo y avisar a la familia (F16) | 67 | `app/src/server/family/feed.ts`<br>`app/src/app/(app)/circulo/actividad/page.tsx`<br>`app/src/server/reminders/dispatch.ts`<br>`app/src/server/cared-link/emergency.ts`<br>`app/tests/db/family-notifications.test.ts` | `pnpm -C app test tests/db/dispatch.test.ts` |
| 69 | Abrir el panel agregado para organizaciones (F17) | 68, 41 | `app/src/server/org/org-dashboard.ts`<br>`app/src/app/org/[token]/page.tsx`<br>`app/src/app/admin/organizaciones/page.tsx`<br>`app/tests/db/org-dashboard.test.ts` | `pnpm -C app test tests/db/org-dashboard.test.ts` |
| 70 | Medir rendimiento y cerrar documentos de fase 8 | 69 | `app/tests/e2e/performance.spec.ts`<br>`PENDIENTES.md`<br>`DECISIONES.md`<br>`docs/diseno/familiares.md`<br>`docs/diseno/admin-y-organizaciones.md` | `pnpm -C app test tests/unit/docs-diseno.test.ts` |

---

#### Step 1 — Montar el esqueleto de la app y su endpoint de salud

Épica `01-preparacion` · tarea `E1-T1` · prioridad `p0` · depende de: nada (después del Bootstrap)

**Do**

Bootstrap (§10) ya creó `app/` con `create-next-app`, fijó los scripts de `package.json` e instaló todo. Este paso deja la base sobre la que se apoya el resto.
- `app/next.config.ts` — reemplaza el del scaffold por uno propio: `reactStrictMode: true`, `poweredByHeader: false`, `productionBrowserSourceMaps: false`. Sin `turbopack.rules`: el build corre con `next build --webpack` (lo exige @serwist/next) y Tailwind entra por `postcss.config.mjs`.
- `app/src/lib/env.ts` — `readEnv(name)` (string o `undefined`), `requireEnv(name)` que lanza `MissingEnvError` con el nombre de la variable en el mensaje, y `appUrl()` que devuelve `APP_URL` o `http://localhost:3000`. Ninguna variable se exige al importar el módulo: cada función la pide cuando la usa (así ningún paso rompe la compuerta de uno anterior). Fuera de este archivo nadie lee `process.env`, salvo las `NEXT_PUBLIC_*` en componentes de cliente, que Next solo incrusta si se escriben literales.
- `app/src/app/api/health/route.ts` — `GET` devuelve `Response.json({ ok: true, data: { status: "ok", time } })` con `cache-control: no-store`. El chequeo de base de datos llega en paso 50 (`vercel-config`).
- `app/tests/unit/env-health.test.ts` — prueba `requireEnv` y el `GET` importado directamente; compara el cuerpo con `toMatchObject` (parcial), así el campo `db` que agrega paso 50 (`vercel-config`) no la rompe.
- `app/tests/e2e/smoke.spec.ts` — pide `/api/health` al servidor que levanta `webServer` de `playwright.config.ts` (build + start en el puerto 3100). Es la primera vez que algo **corre** la app.

Archivos que crea o modifica:
- `app/next.config.ts`
- `app/src/lib/env.ts`
- `app/src/app/api/health/route.ts`
- `app/tests/unit/env-health.test.ts`
- `app/tests/e2e/smoke.spec.ts`

**Done when**
- [ ] WHEN `pnpm -C app test tests/unit/env-health.test.ts` runs THE SYSTEM SHALL pass, asserting that `GET` from `src/app/api/health/route.ts` answers 200 with body `{ ok: true, data: { status: "ok" } }` plus a `time` field and the header `cache-control: no-store`.
- [ ] WHEN `requireEnv("SOLE_NO_EXISTE")` is called with that variable unset THE SYSTEM SHALL throw `MissingEnvError` whose message contains `SOLE_NO_EXISTE`.
- [ ] WHEN `tests/e2e/smoke.spec.ts` runs against the production build started on port 3100 THE SYSTEM SHALL answer `GET /api/health` with status 200 and `ok: true`.
- [ ] WHEN `pnpm -C app lint` and `pnpm -C app typecheck` run THE SYSTEM SHALL exit 0.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/env-health.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/smoke.spec.ts  # expect: exit 0 — build + start en :3100 y GET /api/health = 200
```

**Checkpoint**
```bash
git add -A && git commit -m "step 1: esqueleto"
git tag step-01-esqueleto
# primera etiqueta: punto de retorno de todo lo que sigue
```

---

#### Step 2 — Conectar Supabase local, tipos generados y clientes

Épica `01-preparacion` · tarea `E1-T2` · prioridad `p0` · depende de: paso 1

**Do**

Las migraciones de `app/supabase/migrations/` y `app/supabase/seed.sql` llegaron con la copia de `workspace/` y Bootstrap ya las aplicó. Aquí se generan los tipos y se crean los únicos tres caminos para hablar con la base.
- `app/src/lib/supabase/database.types.ts` — se genera con `pnpm -C app db:types` (nunca se edita a mano; Biome lo excluye).
- `app/src/lib/supabase/server.ts` — dos fábricas con `@supabase/ssr`: `createSupabaseServerClient()` para Server Components y Server Actions (cookies de `next/headers`) y `createSupabaseRouteClient(request)` para Route Handlers (lee las cookies del `Request`; si llega `Authorization: Bearer <jwt>` lo usa como sesión, que es lo que hacen las pruebas). Opciones de cookie: `httpOnly: true`, `sameSite: "lax"`, `secure` cuando `APP_URL` empieza con `https://`, `path: "/"`. Usan `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` vía `requireEnv`.
- `app/src/lib/supabase/admin.ts` — `createSupabaseAdminClient()` con `SUPABASE_SECRET_KEY`, `auth: { persistSession: false, autoRefreshToken: false }`; lanza si `typeof window !== "undefined"`. Solo lo importan `src/server/**`, rutas de cron/admin y pruebas.
- `app/tests/db/helpers.ts` — `adminClient()`, `createTestUser({ consents?: boolean })` (crea el usuario con `auth.admin.createUser({ email: "test-<uuid>@example.test", password, email_confirm: true })` y contraseña `"Aa1" + crypto.randomUUID()`, que cumple el mínimo de 10 caracteres con minúsculas, mayúsculas y dígitos de `config.toml`, inicia sesión con la clave publicable y devuelve `{ client, userId, email, password, accessToken }`), `grantRequiredConsents(client, userId)` (inserta `terms` y `sensitive` con versión `2026-11-14`) y `createCircleFor(client, displayName)` (llama a la RPC `create_circle`).
- `app/tests/db/connection.test.ts` — las aserciones de abajo.

Archivos que crea o modifica:
- `app/src/lib/supabase/database.types.ts`
- `app/src/lib/supabase/server.ts`
- `app/src/lib/supabase/admin.ts`
- `app/tests/db/helpers.ts`
- `app/tests/db/connection.test.ts`

**Done when**
- [ ] WHEN `pnpm -C app db:reset` runs THE SYSTEM SHALL apply every migration in `supabase/migrations` and `supabase/seed.sql` and exit 0.
- [ ] WHEN `pnpm -C app db:test` runs THE SYSTEM SHALL pass `supabase/tests/database.test.sql`, which asserts that every table in schema `public` has RLS enabled, that the cron jobs `sole-dispatch` and `sole-daily` exist and that `authenticated` has no UPDATE privilege on `profiles.is_admin`.
- [ ] WHEN `tests/db/connection.test.ts` runs THE SYSTEM SHALL read the organization `DEMO-LOCAL` with the admin client and SHALL receive error code `42501` and no rows when an anonymous client selects from `profiles`.
- [ ] WHEN a user is created through `createTestUser` THE SYSTEM SHALL have a `profiles` row for that user created by the trigger `on_auth_user_created`.

**Verify**
```bash
pnpm -C app db:reset  # expect: exit 0
pnpm -C app db:test  # expect: exit 0, todas las pruebas pgTAP pasan
pnpm -C app db:types  # expect: exit 0 — regenera database.types.ts
pnpm -C app typecheck  # expect: exit 0
pnpm -C app lint  # expect: exit 0
pnpm -C app test tests/db/connection.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 2: supabase-local"
git tag step-02-supabase-local
# si el paso 3 sale mal: git reset --hard step-02-supabase-local
```

---

#### Step 3 — Configurar CI, Dependabot y escaneo de secretos

Épica `01-preparacion` · tarea `E1-T3` · prioridad `p0` · depende de: paso 1

**Do**

- `.github/workflows/ci.yml` — en `push` a `main` y en `pull_request`. Jobs: `quality` (checkout, `pnpm/action-setup` con la versión de `packageManager`, `actions/setup-node` con Node 22 y caché pnpm, `pnpm -C app install --frozen-lockfile`, `pnpm -C app exec biome ci .`, `pnpm -C app typecheck`, `pnpm -C app db:start`, `pnpm -C app env:local`, `pnpm -C app db:test`, `pnpm -C app test`); `e2e` (needs `quality`; instala navegadores con `pnpm -C app exec playwright install --with-deps chromium webkit`, levanta Supabase, `pnpm -C app env:local`, `pnpm -C app test:e2e`, sube `app/playwright-report` como artefacto solo si falla); `gitleaks` (`fetch-depth: 0` para escanear todo el historial, acción oficial `gitleaks/gitleaks-action`, config `.gitleaks.toml`); `audit` (`pnpm -C app audit --prod --audit-level high`); `semgrep` (contenedor `semgrep/semgrep`, `semgrep scan --config p/typescript --config p/react --config p/secrets --error app/src`). Permisos mínimos: `permissions: contents: read`.
- `.github/dependabot.yml` — `npm` en `/app` y `github-actions` en `/`, ambos semanales.
- `.gitleaks.toml` — `[extend] useDefault = true` y una `allowlist` de rutas para `app/.env.example` y `blueprints/`.
- `.githooks/pre-commit` — script `sh`: si `command -v gitleaks` existe, ejecuta `gitleaks git --pre-commit --staged --redact --config .gitleaks.toml` y devuelve su código; si no existe, imprime "gitleaks no está instalado: el escaneo corre en CI" y sale con 0. Luego activa los hooks: `git config core.hooksPath .githooks`. El hook local es solo una comodidad: **la compuerta real de secretos es el job `gitleaks` de CI** (historial completo en cada push); este paso verifica que ese job exista y esté bien configurado.
- `app/tests/unit/repo-config.test.ts` — lee esos archivos y los dos `.gitignore` desde la raíz del repo (`path.resolve(process.cwd(), "..")`).

Archivos que crea o modifica:
- `.github/workflows/ci.yml`
- `.github/dependabot.yml`
- `.gitleaks.toml`
- `.githooks/pre-commit`
- `app/tests/unit/repo-config.test.ts`

**Done when**
- [ ] WHEN `tests/unit/repo-config.test.ts` reads `.github/workflows/ci.yml` THE SYSTEM SHALL find the jobs `quality`, `e2e`, `gitleaks`, `audit` and `semgrep`, and in `.github/dependabot.yml` the ecosystems `npm` with directory `/app` and `github-actions`.
- [ ] WHEN `git config core.hooksPath` is read THE SYSTEM SHALL print `.githooks`.
- [ ] WHEN the test reads `.githooks/pre-commit` THE SYSTEM SHALL find the `command -v gitleaks` guard, the warning branch that exits 0 and the invocation `gitleaks git --pre-commit --staged --redact`.
- [ ] WHEN the test reads the root `.gitignore` THE SYSTEM SHALL find `.env.*` followed later by `!.env.example`, and `app/.gitignore` SHALL contain the line `!.env.example`.

**Verify**
```bash
pnpm -C app test tests/unit/repo-config.test.ts  # expect: exit 0, 0 failed
test "$(git config core.hooksPath)" = .githooks  # expect: exit 0
sh .githooks/pre-commit  # expect: exit 0 — sin gitleaks avisa y sale 0; con gitleaks no hay nada staged que reportar
```

**Checkpoint**
```bash
git add -A && git commit -m "step 3: ci-y-secretos"
git tag step-03-ci-y-secretos
# si el paso 4 sale mal: git reset --hard step-03-ci-y-secretos
```

---

#### Step 4 — Definir las variables de diseño y la tipografía

Épica `01-preparacion` · tarea `E1-T4` · prioridad `p0` · depende de: paso 1

**Do**

Los valores exactos están en la tabla de tokens de `CLAUDE.md` (y en §7 del plano). No se inventa ningún color.
- `app/src/lib/design/tokens.ts` — `export const tokens = { light: {...}, dark: {...} }` con las claves `background`, `surface`, `fg`, `fgMuted`, `fgSubtle`, `primary`, `primaryFg`, `primaryHover`, `border`, `borderStrong`, `focus`, `success`, `warning`, `danger`, `info`, `successBg`, `warningBg`, `dangerBg`, `infoBg`; más `contrastRatio(a, b)` (fórmula WCAG 2.x) y la lista `contrastPairs` (texto ≥ 4.5, bordes de control y foco ≥ 3).
- `app/src/app/globals.css` — `@import "tailwindcss";`, las mismas variables CSS en `:root` (claro) y dentro de `@media (prefers-color-scheme: dark) { :root { ... } }`, `@theme inline` que mapea `--color-*` a esas variables y `--font-sans` a `var(--font-atkinson)`. Base: `html { font-size: 112.5%; }` (18 px), `body` con fondo y texto de token, `:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }`, y `@media (prefers-reduced-motion: reduce)` que reduce animaciones y transiciones a 0.01ms.
- `app/src/app/layout.tsx` — `<html lang="es-CL">`, `Atkinson_Hyperlegible` de `next/font/google` (pesos 400 y 700, `subsets: ["latin"]`, `display: "swap"`, `variable: "--font-atkinson"`), metadata (`title.template: "%s · Sole"`, descripción en español), `viewport.themeColor` claro/oscuro desde `tokens`, y el enlace "Saltar al contenido" hacia `#contenido` como primer elemento del `body`.
- `app/src/app/page.tsx` — reemplaza la página demo del scaffold (que trae colores hex sueltos) por una portada mínima con tokens: título "Sole" y una frase; paso 16 (`e2e-bienvenida`) la completa.
- `app/tests/unit/design-system.test.ts` — contraste de todos los pares, paridad con `globals.css`, ausencia de hex sueltos y revisión de `layout.tsx`.

Archivos que crea o modifica:
- `app/src/app/globals.css`
- `app/src/app/layout.tsx`
- `app/src/app/page.tsx`
- `app/src/lib/design/tokens.ts`
- `app/tests/unit/design-system.test.ts`

**Done when**
- [ ] WHEN `tests/unit/design-system.test.ts` runs THE SYSTEM SHALL find every text pair in `contrastPairs` at 4.5:1 or more and every `borderStrong` and `focus` pair at 3:1 or more against `background` and `surface`, in light and in dark.
- [ ] WHEN the same test reads `src/app/globals.css` THE SYSTEM SHALL find every token of `tokens.ts` declared with the same hex in `:root` for light and inside the `prefers-color-scheme: dark` block for dark.
- [ ] WHEN the same test scans `src/` THE SYSTEM SHALL find zero hex color literals outside `src/app/globals.css` and `src/lib/design/tokens.ts`.
- [ ] WHEN the same test reads `src/app/layout.tsx` THE SYSTEM SHALL find `lang="es-CL"`, `Atkinson_Hyperlegible` with `display: "swap"` and a link to `#contenido` with the text "Saltar al contenido".
- [ ] WHEN `pnpm -C app build` runs THE SYSTEM SHALL exit 0.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/design-system.test.ts  # expect: exit 0, 0 failed
pnpm -C app build  # expect: exit 0 (next/font descarga Atkinson en el build: requiere red, igual que pnpm install)
```

**Checkpoint**
```bash
git add -A && git commit -m "step 4: tokens-diseno"
git tag step-04-tokens-diseno
# si el paso 5 sale mal: git reset --hard step-04-tokens-diseno
```

---

#### Step 5 — Crear los componentes base accesibles

Épica `01-preparacion` · tarea `E1-T5` · prioridad `p0` · depende de: paso 4

**Do**

Sin librería de componentes: elementos nativos con estilos de token (ver §2 y la decisión registrada en `DECISIONES.md`). Clases solo con tokens (`bg-primary`, `text-fg`, …), nunca hex.
- `button.tsx` — variantes `primary`, `secondary`, `danger`, `ghost`; siempre `min-h-12 min-w-12` (48 px) y `text-lg`; prop `pending` pone `aria-busy="true"` y `disabled`.
- `field.tsx` — `<label htmlFor>` + input/textarea/select + pista + error. Con error: `aria-invalid="true"`, `aria-describedby` hacia un elemento con `role="alert"`.
- `choice-group.tsx` (cliente) — `<fieldset>` + `<legend>`; una opción nativa (`radio`, o `checkbox` con `multiple`) por ítem, en tarjetas grandes de 48 px de alto mínimo.
- `dialog.tsx` (cliente) — `<dialog>` nativo: `showModal()` si existe, si no el atributo `open`; `aria-labelledby` al título; botón "Cerrar"; devuelve el foco al disparador.
- `ui-components.test.tsx` — primera línea `// @vitest-environment jsdom`; usa `@testing-library/react`.

Archivos que crea o modifica:
- `app/src/components/ui/button.tsx`
- `app/src/components/ui/field.tsx`
- `app/src/components/ui/choice-group.tsx`
- `app/src/components/ui/dialog.tsx`
- `app/tests/unit/ui-components.test.tsx`

**Done when**
- [ ] WHEN `Field` renders with an `error` THE SYSTEM SHALL give the control `aria-invalid="true"`, link it through `aria-describedby` to an element with `role="alert"` that holds the error text, and associate the `<label>` through `htmlFor`.
- [ ] WHEN `ChoiceGroup` renders three options THE SYSTEM SHALL output one `<fieldset>` with a `<legend>` and three native radio inputs, or three checkboxes when `multiple` is set, each with an accessible name.
- [ ] WHEN `Button` renders THE SYSTEM SHALL carry the classes `min-h-12` and `min-w-12`, and with `pending` SHALL set `aria-busy="true"` and `disabled`.
- [ ] WHEN `Dialog` opens THE SYSTEM SHALL expose `aria-labelledby` pointing at its title and a button whose accessible name is "Cerrar".

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/ui-components.test.tsx  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 5: componentes-base"
git tag step-05-componentes-base
# si el paso 6 sale mal: git reset --hard step-05-componentes-base
```

---

#### Step 6 — Abrir DECISIONES, PENDIENTES, límites y licencias

Épica `01-preparacion` · tarea `E1-T6` · prioridad `p0` · depende de: paso 1

**Do**

Archivos vivos que pide el brief (§0.2). Todo en español de Chile.
- `DECISIONES.md` — tabla `| Decisión | Alternativa descartada | Por qué | Fecha |` con una fila por cada decisión A CRITERIO de §20.3 del plano (sin librería de componentes, Supabase dentro de `app/`, Resend en vez de Zoho para el correo de la app, despachador en una ruta de Next en vez de Edge Function, build con webpack por Serwist, precios de prueba del plan familiar, nombre del medicamento fuera del aviso push, formulario web vía la app, Semgrep + CodeQL, cuenta borrada a los 7 días, sin respaldo por correo de los recordatorios).
- `PENDIENTES.md` — `# Pendientes`, línea "Estado:" y secciones `## Prioridad alta`, `## Prioridad media`, `## Prioridad baja`; parte con F16 y F17 en baja ("se construyen en la fase 8 si sobra tiempo").
- `docs/limites.md` — tabla `| Servicio | Límite del plan gratuito | Qué pasa al alcanzarlo | Cómo se vigila |` con una fila para Supabase, Vercel, Resend, Sentry, Cloudflare Turnstile y GitHub Actions. Cada límite lleva `[VERIFICAR]` o la URL oficial de donde salió. Incluye: Supabase pausa tras 7 días sin actividad (mitigado por `keepalive.yml`), dos proyectos gratis por organización (el sitio ya usa uno: `sole-web`), Vercel Hobby es solo para uso no comercial, Resend 3.000 correos al mes y 100 al día según el brief.
- `docs/licencias.md` — tabla `| Recurso | Licencia | Fuente |`: Atkinson Hyperlegible (SIL Open Font License 1.1), lucide-react (ISC), Next.js (MIT), Supabase JS (MIT), Recharts (MIT), Serwist (MIT), web-push (MPL-2.0); el logo "S" es propio.
- `app/tests/unit/docs-base.test.ts` — lee desde la raíz del repo.

Archivos que crea o modifica:
- `DECISIONES.md`
- `PENDIENTES.md`
- `docs/limites.md`
- `docs/licencias.md`
- `app/tests/unit/docs-base.test.ts`

**Done when**
- [ ] WHEN `tests/unit/docs-base.test.ts` runs THE SYSTEM SHALL find in `DECISIONES.md` a table with the header `| Decisión | Alternativa descartada | Por qué | Fecha |` and at least one data row.
- [ ] WHEN it reads `PENDIENTES.md` THE SYSTEM SHALL find the headings `## Prioridad alta`, `## Prioridad media` and `## Prioridad baja`.
- [ ] WHEN it reads `docs/limites.md` THE SYSTEM SHALL find one table row for each of Supabase, Vercel, Resend, Sentry, Cloudflare Turnstile and GitHub Actions, each containing `[VERIFICAR]` or an `https://` source.
- [ ] WHEN it reads `docs/licencias.md` THE SYSTEM SHALL find Atkinson Hyperlegible with the license `SIL Open Font License 1.1`.

**Verify**
```bash
pnpm -C app test tests/unit/docs-base.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 6: documentos-base"
git tag step-06-documentos-base
# si el paso 7 sale mal: git reset --hard step-06-documentos-base
```

---

#### Step 7 — Escribir el diseño funcional de F1–F11, F14 y F16

Épica `01-preparacion` · tarea `E1-T7` · prioridad `p0` · depende de: paso 6

**Do**

Diseño funcional que exige el brief (§0.2 y fase 1), escrito desde `PROTOTIPO-Brief-Fable.md` §3 y el "Resumen funcional por F" de esta épica. Cada F es una sección `## F<n> · <nombre>` con cuatro subsecciones fijas: `### Flujo`, `### Datos`, `### Permisos`, `### Criterios de aceptación`.
- `nucleo.md` — F1, F2, F3, F4.
- `registro-y-cuidado.md` — F5, F6, F8, F9.
- `informes-y-escucha.md` — F7, F10, F11, F14.
- `familiares.md` — F16 completa aunque se construya al final: además de las cuatro subsecciones, `### Notificaciones` (por defecto fechas importantes, controles y emergencias) y `### Modelo de datos` (`circle_members.role = 'family'`, `notify_kinds`, `invitations`, `occurrence_marks.marked_by`, RPC `accept_invitation`, `claim_task`, `set_member_notify_kinds`).
- `docs-diseno.test.ts` — `const REQUIRED = { "nucleo.md": ["F1","F2","F3","F4"], "registro-y-cuidado.md": ["F5","F6","F8","F9"], "informes-y-escucha.md": ["F7","F10","F11","F14"], "familiares.md": ["F16"] }`; paso 8 (`diseno-funcional-2`) lo amplía.

Archivos que crea o modifica:
- `docs/diseno/nucleo.md`
- `docs/diseno/registro-y-cuidado.md`
- `docs/diseno/informes-y-escucha.md`
- `docs/diseno/familiares.md`
- `app/tests/unit/docs-diseno.test.ts`

**Done when**
- [ ] WHEN `tests/unit/docs-diseno.test.ts` runs THE SYSTEM SHALL find, for every F listed in its `REQUIRED` map, a heading `## F<n> ·` in the mapped file followed by the subsections `### Flujo`, `### Datos`, `### Permisos` and `### Criterios de aceptación`.
- [ ] WHEN it reads `docs/diseno/familiares.md` THE SYSTEM SHALL also find `### Notificaciones` and `### Modelo de datos`, and the words `accept_invitation`, `claim_task` and `notify_kinds`.
- [ ] WHEN it scans `docs/diseno/` THE SYSTEM SHALL find none of the words `diagnóstico`, `dosis` or `en memoria`.

**Verify**
```bash
pnpm -C app test tests/unit/docs-diseno.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 7: diseno-funcional-1"
git tag step-07-diseno-funcional-1
# si el paso 8 sale mal: git reset --hard step-07-diseno-funcional-1
```

---

#### Step 8 — Completar el diseño funcional de F12, F13, F15 y F17

Épica `01-preparacion` · tarea `E1-T8` · prioridad `p0` · depende de: paso 7

**Do**

Mismo formato que paso 7 (`diseno-funcional-1`).
- `persona-cuidada.md` — F12: enlace o código sin cuenta, solo recordatorios visibles, botón "Listo", botón de emergencia con confirmación, `tel:` al contacto de emergencia o al 131 `[VERIFICAR en fuente oficial]`, aviso urgente, registro, revocación y el texto "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue."
- `cuenta.md` — F13: consentimientos por capas, descarga JSON/CSV, borrado con 7 días de gracia (al borrarse la cuenta de la cuidadora se borran los círculos que ella creó, incluidos los datos que ven sus familiares; la pantalla de borrado lo advierte), cierre de círculo (incluido fallecimiento, con lenguaje cuidadoso y recordatorios silenciados desde el primer momento).
- `admin-y-organizaciones.md` — F15 y F17 (agregados, nunca grupos de menos de 5 personas).
- `transversal.md` — sin `## F`; secciones `## Sin conexión`, `## Rendimiento`, `## Textos`, `## Investigación` (eventos seudónimos, consentimiento separado).
- `docs-diseno.test.ts` — agrega `"persona-cuidada.md": ["F12"]`, `"cuenta.md": ["F13"]`, `"admin-y-organizaciones.md": ["F15","F17"]` a `REQUIRED` y verifica las cuatro secciones de `transversal.md`.

Archivos que crea o modifica:
- `docs/diseno/persona-cuidada.md`
- `docs/diseno/cuenta.md`
- `docs/diseno/admin-y-organizaciones.md`
- `docs/diseno/transversal.md`
- `app/tests/unit/docs-diseno.test.ts`

**Done when**
- [ ] WHEN `tests/unit/docs-diseno.test.ts` runs THE SYSTEM SHALL find each of F1 to F17 exactly once across `docs/diseno/`, each with the subsections `### Flujo`, `### Datos`, `### Permisos` and `### Criterios de aceptación`.
- [ ] WHEN it reads `docs/diseno/persona-cuidada.md` THE SYSTEM SHALL find the sentence "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue." and the marker `[VERIFICAR`.
- [ ] WHEN it reads `docs/diseno/transversal.md` THE SYSTEM SHALL find the headings `## Sin conexión`, `## Rendimiento`, `## Textos` and `## Investigación`.

**Verify**
```bash
pnpm -C app test tests/unit/docs-diseno.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 8: diseno-funcional-2"
git tag step-08-diseno-funcional-2
# si el paso 9 sale mal: git reset --hard step-08-diseno-funcional-2
```

---

#### Step 9 — Probar el aislamiento por rol y los límites de frecuencia

Épica `02-cimientos` · tarea `E2-T1` · prioridad `p0` · depende de: paso 2

**Do**

Las políticas ya existen en las migraciones; este paso las prueba con usuarias reales a través de PostgREST (claves y JWT de verdad, nada simulado).
- `app/src/server/security/rate-limit.ts` — `hashKey(scope, raw)` = HMAC-SHA256 con `IP_HASH_SECRET` (nunca se guarda una IP ni un correo en claro); `checkRateLimit(scope, raw, limit, windowSeconds)` llama a la RPC `rate_limit_hit` con el cliente admin y devuelve `{ allowed: boolean }`; `RATE_LIMITS` = `login` 5/900 s (por correo), `login_ip` 300/900 s (por IP; holgado para que las pruebas e2e, que entran muchas veces desde 127.0.0.1, no choquen), `feedback` 10/3600 s, `emergency` 3/600 s, `invitation` 10/86400 s, `web_contact` 5/3600 s, `cared_done` 30/600 s, `push_test` 5/3600 s.
- Pruebas: cuidadoras A y B con su círculo (helpers de paso 2 (`supabase-local`)); F se agrega como `family` al círculo de A con el cliente admin (`insert` directo en `circle_members`); `anon` con la clave publicable sin sesión. Cada prueba crea sus usuarias con correos aleatorios: no hay estado compartido entre archivos.

Archivos que crea o modifica:
- `app/src/server/security/rate-limit.ts`
- `app/tests/db/rls-circles.test.ts`
- `app/tests/db/rls-private.test.ts`
- `app/tests/db/rate-limit.test.ts`

**Done when**
- [ ] WHEN `tests/db/rls-circles.test.ts` runs with caregivers A and B THE SYSTEM SHALL return zero rows to B for every select on A's `circles`, `reminders`, `reminder_occurrences`, `journal_entries`, `tasks` and `contacts`, and SHALL reject B's insert of a reminder into A's circle with `42501`.
- [ ] WHEN a `family` member of A's circle selects A's reminders THE SYSTEM SHALL return them, SHALL reject that member's reminder insert and delete with `42501`, and that member's update SHALL affect zero rows.
- [ ] WHEN caregiver A updates `circle_members.role`, `reminders.circle_id`, `reminders.created_by` or `profiles.is_admin` THE SYSTEM SHALL reject each with `42501`.
- [ ] WHEN `tests/db/rls-private.test.ts` runs THE SYSTEM SHALL return zero rows when anyone other than the owner selects `selfcare_checkins` or `push_subscriptions`, zero rows when a non-admin selects `events`, and SHALL reject any update to `consents` with `42501`.
- [ ] WHEN `checkRateLimit` is called 4 times inside one window with limit 3 THE SYSTEM SHALL return `allowed: true` three times and `allowed: false` the fourth, while a different key stays allowed.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/rls-circles.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/db/rls-private.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/db/rate-limit.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 9: rls-y-limites"
git tag step-09-rls-y-limites
# si el paso 10 sale mal: git reset --hard step-09-rls-y-limites
```

---

#### Step 10 — Construir el ingreso con enlace mágico y contraseña

Épica `02-cimientos` · tarea `E2-T2` · prioridad `p0` · depende de: paso 2, paso 5, paso 9

**Do**

- `app/src/server/auth/login.ts` — lógica pura con dependencias inyectadas (`{ auth, rateLimit, appUrl }`) para poder probarla sin red: `requestMagicLink(deps, input)` y `passwordSignIn(deps, input)`. Entrada validada con zod (`email` recortado, en minúsculas, máx. 254; `captchaToken` opcional; `org` opcional `^[A-Za-z0-9-]{3,32}$`). El enlace usa `signInWithOtp({ email, options: { emailRedirectTo: appUrl + "/auth/confirm", shouldCreateUser: true, captchaToken, data: { org_code } } })`. Límites `login` (por hash de correo) y `login_ip` (por hash de IP).
- `app/src/app/(auth)/entrar/actions.ts` — `"use server"`; solo funciones async que arman las dependencias reales (cliente de servidor, `checkRateLimit`, `appUrl()`) y llaman a `login.ts`; además `signOut()`.
- `app/src/app/(auth)/entrar/page.tsx` — campo de correo y botón "Enviarme el enlace"; debajo, plegado, "Entrar con contraseña"; widget Turnstile (`@marsidev/react-turnstile`) solo si existe `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; campo oculto `org` desde `?org=`; mensajes con `role="alert"`/`aria-live`. Texto: "Te mandamos un enlace a tu correo. Ábrelo en este mismo teléfono."

Archivos que crea o modifica:
- `app/src/server/auth/login.ts`
- `app/src/app/(auth)/entrar/page.tsx`
- `app/src/app/(auth)/entrar/actions.ts`
- `app/tests/unit/auth-login.test.ts`

**Done when**
- [ ] WHEN `requestMagicLink` receives a valid email THE SYSTEM SHALL call `signInWithOtp` once with `emailRedirectTo` equal to `APP_URL + "/auth/confirm"`, `shouldCreateUser: true` and the uppercase `org_code` in `data`, and SHALL return `{ ok: true }`.
- [ ] WHEN the email is malformed THE SYSTEM SHALL return `{ ok: false, error: { code: "validation_failed" } }` without calling Supabase.
- [ ] WHEN the rate limiter refuses THE SYSTEM SHALL return `{ ok: false, error: { code: "rate_limited" } }` without calling Supabase.
- [ ] WHEN `signInWithOtp` returns an error THE SYSTEM SHALL still return `{ ok: true }`, so the answer never reveals whether an account exists.
- [ ] WHEN `passwordSignIn` gets a wrong password or an unknown email THE SYSTEM SHALL return the same `{ ok: false, error: { code: "invalid_credentials", message: "Correo o contraseña incorrectos." } }` in both cases.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/auth-login.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 10: autenticacion-login"
git tag step-10-autenticacion-login
# si el paso 11 sale mal: git reset --hard step-10-autenticacion-login
```

---

#### Step 11 — Proteger rutas, confirmar enlaces y fijar cookies seguras

Épica `02-cimientos` · tarea `E2-T3` · prioridad `p0` · depende de: paso 10

**Do**

- `app/src/lib/auth/route-rules.ts` — `isPublicPath(pathname)`: públicas `/`, `/entrar`, `/auth/*`, `/v/*`, `/invitar/*`, `/org/*`, `/~offline`, `/manifest.webmanifest`, `/sw.js`, `/swe-worker-*`, `/icons/*`, `/monitoring`, `/api/*` (cada API valida su propia sesión o secreto), `/_next/*`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`. `safeNextPath(next)` acepta solo rutas que empiezan con `/` y no con `//`; si no, `/hoy`.
- `app/src/proxy.ts` — Next 16 usa `proxy.ts` (no `middleware.ts`) y exporta `proxy`. Crea el cliente `@supabase/ssr` sobre la request/response (mismas opciones de cookie que `server.ts`), refresca la sesión con `auth.getUser()`, y si la ruta no es pública y no hay usuaria redirige a `/entrar?next=<ruta>`. `config.matcher` excluye estáticos de `_next`.
- `app/src/app/auth/confirm/route.ts` — `GET` con `token_hash` y `type`: `verifyOtp`; éxito → `safeNextPath(next)`; error → `/entrar?error=enlace`.
- `app/tests/e2e/auth.spec.ts` — crea la usuaria con contraseña usando `@supabase/supabase-js` admin dentro del spec (las variables llegan por `playwright.config.ts`).

Archivos que crea o modifica:
- `app/src/lib/auth/route-rules.ts`
- `app/src/proxy.ts`
- `app/src/app/auth/confirm/route.ts`
- `app/tests/unit/proxy-rules.test.ts`
- `app/tests/e2e/auth.spec.ts`

**Done when**
- [ ] WHEN `tests/unit/proxy-rules.test.ts` runs THE SYSTEM SHALL classify `/`, `/entrar`, `/auth/confirm`, `/v/abc`, `/org/abc`, `/~offline`, `/manifest.webmanifest`, `/icons/192` and `/api/health` as public and `/hoy`, `/cuenta` and `/admin` as protected, and `safeNextPath` SHALL turn `//evil.example` and `https://evil.example` into `/hoy`.
- [ ] WHEN an anonymous browser requests `/hoy` THE SYSTEM SHALL redirect to `/entrar?next=%2Fhoy`.
- [ ] WHEN a user signs in with email and password on `/entrar` THE SYSTEM SHALL set a session cookie whose name starts with `sb-` and that is `HttpOnly` with `SameSite=Lax`.
- [ ] WHEN `/auth/confirm` is requested with an invalid `token_hash` THE SYSTEM SHALL redirect to `/entrar?error=enlace`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/proxy-rules.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/auth.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 11: autenticacion-sesion"
git tag step-11-autenticacion-sesion
# si el paso 12 sale mal: git reset --hard step-11-autenticacion-sesion
```

---

#### Step 12 — Pedir los consentimientos por capas antes de guardar datos

Épica `02-cimientos` · tarea `E2-T4` · prioridad `p0` · depende de: paso 11

**Do**

- `app/src/server/consents/consents.ts` — `CONSENT_VERSION = "2026-11-14"`; `getConsentState(client, userId)` → `{ terms, sensitive, research }` según la última fila de cada capa; `recordConsents(client, userId, input)` con zod: `terms`, `sensitive`, `research` y dos declaraciones obligatorias `ageConfirmed` ("Tengo 18 años o más") y `authorizationDeclared` ("Cuento con la autorización de la persona que cuido o actúo en su interés; si es menor de edad, soy su madre, padre o tutor"). Sin las dos declaraciones, o sin `terms` y `sensitive`, devuelve `validation_failed` y no inserta nada. `revokeResearch(client, userId)` agrega `granted = false`.
- `app/src/app/(onboarding)/layout.tsx` — exige sesión (si no, `/entrar`); sin navegación.
- `app/src/app/(onboarding)/bienvenida/consentimientos/page.tsx` — tres capas explicadas en lenguaje simple: (1) términos y uso básico, (2) datos sensibles de rutina, ánimo y medicamentos, (3) investigación, opcional ("puedes usar Sole igual"). Ninguna casilla viene marcada. Enlaces a `https://solecuida.com/privacidad.html`, `terminos.html` y `cookies.html`. Server Action en línea que llama a `recordConsents` y redirige a `/bienvenida`.
- `app/src/app/(app)/layout.tsx` — exige sesión; sin consentimientos requeridos → `/bienvenida/consentimientos`; sin círculos → `/bienvenida`; actualiza `profiles.last_active_at` como máximo una vez por día; `metadata.robots = { index: false }`; navegación principal: Hoy, Calendario, Recordatorios, Tareas, Bitácora, Para ti, Informes, Contactos, Avisos, Cuenta y "Próximamente" (`/pronto`); botón "Salir" (acción `signOut`); `<main id="contenido">`. Las rutas que todavía no existen se construyen en pasos posteriores.

Archivos que crea o modifica:
- `app/src/server/consents/consents.ts`
- `app/src/app/(onboarding)/layout.tsx`
- `app/src/app/(onboarding)/bienvenida/consentimientos/page.tsx`
- `app/src/app/(app)/layout.tsx`
- `app/tests/db/consents.test.ts`

**Done when**
- [ ] WHEN `recordConsents` is called with `terms` and `sensitive` true and both declarations accepted THE SYSTEM SHALL insert one `consents` row per layer with version `2026-11-14`, and `getConsentState` SHALL report `{ terms: true, sensitive: true, research: false }` when research was not granted.
- [ ] WHEN `recordConsents` is called with either declaration unchecked THE SYSTEM SHALL return `{ ok: false, error: { code: "validation_failed" } }` and insert no row.
- [ ] WHEN a user without the required consents calls the RPC `create_circle` THE SYSTEM SHALL reject it with the message `consent_required`.
- [ ] WHEN research consent is revoked with `revokeResearch` THE SYSTEM SHALL append a row with `granted = false`, `getConsentState` SHALL report `research: false`, and the earlier rows SHALL remain unchanged.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/consents.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 12: consentimientos"
git tag step-12-consentimientos
# si el paso 13 sale mal: git reset --hard step-12-consentimientos
```

---

#### Step 13 — Crear el catálogo de eventos y su registro seudónimo

Épica `02-cimientos` · tarea `E2-T5` · prioridad `p0` · depende de: paso 12

**Do**

- `app/src/server/events/catalog.ts` — `EVENT_CATALOG` con exactamente los eventos de la tabla "Catálogo de eventos" de esta épica (nombre, cuándo se dispara, propiedades, hipótesis, técnico). Cada `props` es un `z.strictObject` con solo enums, números y booleanos: nunca texto libre.
- `app/src/server/events/track.ts` — `track(client, userId, name, props)`: valida con el catálogo; si la usuaria no dio consentimiento de investigación y el evento no es técnico, no guarda nada y devuelve `{ stored: false }`; si guarda, escribe `pseudonym_id`, `org_code` y `technical` leídos de su perfil, nunca el id ni el correo. Nunca lanza hacia quien la llama: un fallo devuelve `{ stored: false }`.
- `docs/eventos.md` — tabla `| Evento | Cuándo se dispara | Propiedades | Hipótesis | Técnico |` con las mismas filas.

Archivos que crea o modifica:
- `app/src/server/events/catalog.ts`
- `app/src/server/events/track.ts`
- `docs/eventos.md`
- `app/tests/unit/events-catalog.test.ts`
- `app/tests/db/events.test.ts`

**Done when**
- [ ] WHEN `tests/unit/events-catalog.test.ts` runs THE SYSTEM SHALL find every event of `EVENT_CATALOG` as a row of the table in `docs/eventos.md` and every row of that table in the catalog, each listing at least one hypothesis among H1 to H6.
- [ ] WHEN a catalog schema parses props with an undeclared key or a string outside its enum THE SYSTEM SHALL reject them.
- [ ] WHEN `track` is called for a non-technical event by a user without research consent THE SYSTEM SHALL insert nothing and return `{ stored: false }`, and for the technical event `app.error` SHALL insert one row.
- [ ] WHEN `track` stores an event THE SYSTEM SHALL write the user's `pseudonym_id` and `org_code` and no column containing the user id or email.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/events-catalog.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/db/events.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 13: eventos-base"
git tag step-13-eventos-base
# si el paso 14 sale mal: git reset --hard step-13-eventos-base
```

---

#### Step 14 — Cargar plantillas, consejos y recursos iniciales

Épica `02-cimientos` · tarea `E2-T6` · prioridad `p0` · depende de: paso 2

**Do**

Contenido redactado por el rol de Contenidos (brief §8): organización práctica, cálida, **sin consejo médico, dieta, líquidos ni dosis**. El fundador lo revisa y lo edita después desde F15.
- `app/src/server/reminders/rule-schema.ts` — `ruleSchema` (zod, unión discriminada por `freq`): `once` `{ date }`, `daily`, `weekly` `{ weekdays: 1..7 ISO, sin repetir }`, `interval` `{ everyDays: 2..365 }`, `monthly` `{ dayOfMonth: 1..31 }`, `yearly` `{ month: 1..12, day: 1..31 }`; todos con `times` (1 a 8 horas `HH:MM` distintas), `startDate` `YYYY-MM-DD` válida y `endDate` opcional ≥ `startDate`. `templateItemSchema` = `{ title, kind, importance, rule (ruleSchema sin startDate ni endDate), advanceDays: enteros 0..30, visibleToCared }`.
- La migración (archivo escrito a mano con ese nombre exacto) inserta: una fila de `care_templates` por cada valor de `care_type`, con 3 a 6 ítems válidos según `templateItemSchema`, salvo `desde_cero` con cero ítems. Ejemplo `dialisis`: "Sesión de diálisis" lun-mié-vie (`weekly`), "Preparar el bolso para la sesión" (día anterior), "Control mensual" (`monthly`, `appointment`, `advanceDays` [3,1,0]). Al menos 20 `tips` (al menos 5 de tipo `actividad`, con `activity_title`). Al menos 6 `resources` chilenos con `source_url` oficial `https://` y `verified_at` en null (por ejemplo SAMU 131, Salud Responde, Red Local de Apoyos y Cuidados, SENAMA, SENADIS); toda cifra o teléfono en la descripción lleva `[VERIFICAR]`.
- `app/tests/db/content.test.ts` — usa `Constants.public.Enums.care_type` de `database.types.ts`.

Archivos que crea o modifica:
- `app/supabase/migrations/20261114001000_contenido_inicial.sql`
- `app/src/server/reminders/rule-schema.ts`
- `app/tests/db/content.test.ts`

**Done when**
- [ ] WHEN `pnpm -C app db:reset` runs THE SYSTEM SHALL apply `supabase/migrations/20261114001000_contenido_inicial.sql` and exit 0.
- [ ] WHEN `tests/db/content.test.ts` runs THE SYSTEM SHALL find one `care_templates` row for every value of `Constants.public.Enums.care_type`, the `desde_cero` row with zero items and every other row with between 3 and 6 items that parse with `templateItemSchema`.
- [ ] WHEN the test reads `tips` THE SYSTEM SHALL find at least 20 active rows, at least 5 of kind `actividad`, and none containing the words `dosis`, `mg`, `diagnóstico` or `dieta`.
- [ ] WHEN the test reads the `resources` created by the migration (every row except the local seed row `Recurso de prueba (solo local)`) THE SYSTEM SHALL find each with an `https://` `source_url` and `verified_at` null.
- [ ] WHEN `ruleSchema` parses `{ freq: "weekly", weekdays: [8], times: ["25:00"], startDate: "2026-02-30" }` THE SYSTEM SHALL reject it with issues on `weekdays`, `times` and `startDate`.

**Verify**
```bash
pnpm -C app db:reset  # expect: exit 0
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/content.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 14: contenido-inicial"
git tag step-14-contenido-inicial
# si el paso 15 sale mal: git reset --hard step-14-contenido-inicial
```

---

#### Step 15 — Crear la persona cuidada desde una plantilla (F1)

Épica `02-cimientos` · tarea `E2-T7` · prioridad `p0` · depende de: paso 12, paso 13, paso 14

**Do**

- `app/src/server/circles/circles.ts` — `createCircleWithTemplate(client, userId, input)`: zod (`displayName` 1–60, `caredName` 1–60, `relation` 1–40, `careType`); llama a la RPC `create_circle`, lee la plantilla del tipo y crea un recordatorio por ítem (`source = 'template'`, `startDate` = hoy en `America/Santiago`, `created_by` = usuaria); guarda `display_name` y `onboarding_completed_at` en su perfil; registra `flow.completed` (`flow: "onboarding"`) con `track`. También `listMyCircles(client)` y `resolveActiveCircle(client, requestedId)` (el pedido si es miembro; si no, el primero).
- `app/src/app/(onboarding)/bienvenida/page.tsx` — exige consentimientos (si faltan → `/bienvenida/consentimientos`); un solo formulario: tu nombre, nombre o apodo de la persona, relación (atajos "mi mamá", "mi papá", "mi hijo", "mi hija", "mi pareja", u "otra"), tipo de cuidado, y vista previa de lo que la plantilla carga ("todo se puede editar"). Server Action en línea → `/hoy?bienvenida=1`.
- `care-type-picker.tsx` (cliente) — `ChoiceGroup` con los 9 tipos y una línea de descripción cada uno.
- `install-guide.tsx` — instrucciones separadas "Android con Chrome" e "iPhone con Safari" (Compartir → "Agregar a inicio"; en iPhone los avisos funcionan solo con la app instalada, iOS 16.4 o superior). No pide permiso de notificaciones.

Archivos que crea o modifica:
- `app/src/server/circles/circles.ts`
- `app/src/app/(onboarding)/bienvenida/page.tsx`
- `app/src/components/onboarding/care-type-picker.tsx`
- `app/src/components/onboarding/install-guide.tsx`
- `app/tests/db/create-circle.test.ts`

**Done when**
- [ ] WHEN `createCircleWithTemplate` runs for a consented user with care type `dialisis` THE SYSTEM SHALL create one circle, one `caregiver` membership for that user and one `reminders` row per item of the `dialisis` template with `source = 'template'` and `rule.startDate` equal to today in `America/Santiago`.
- [ ] WHEN it runs with care type `desde_cero` THE SYSTEM SHALL create the circle and zero reminders.
- [ ] WHEN the cared name is empty or longer than 60 characters THE SYSTEM SHALL return `{ ok: false, error: { code: "validation_failed" } }` and create nothing.
- [ ] WHEN the same caregiver creates a second circle THE SYSTEM SHALL succeed, and `listMyCircles` SHALL return both.
- [ ] WHEN creation succeeds for a user with research consent THE SYSTEM SHALL store one `flow.completed` event with `flow = "onboarding"`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/create-circle.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 15: bienvenida-f1"
git tag step-15-bienvenida-f1
# si el paso 16 sale mal: git reset --hard step-15-bienvenida-f1
```

---

#### Step 16 — Probar la bienvenida completa y el origen por organización

Épica `02-cimientos` · tarea `E2-T8` · prioridad `p0` · depende de: paso 15

**Do**

- `app/tests/e2e/fixtures.ts` — `test.extend` con `admin` (cliente admin), `newUser({ consents?, circle? })` (crea con contraseña vía admin), `login(page, user)` (formulario de contraseña de `/entrar`) y `expectNoAxeViolations(page)` (`AxeBuilder` con tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`; espera `violations` vacío). Las pruebas e2e importan solo con rutas relativas.
- `app/src/app/(app)/hoy/page.tsx` — versión mínima: saludo "Hola, <nombre>", nombre de la persona cuidada y, con `?bienvenida=1`, la guía de instalación. paso 25 (`hoy`) la reemplaza.
- `app/src/app/page.tsx` — completa la portada mínima de paso 4 (`tokens-diseno`): qué es Sole en tres frases, botón "Entrar" hacia `/entrar` conservando `?org=`, enlace a `https://solecuida.com`.
- `app/tests/db/org-attribution.test.ts` — crea usuarias con `user_metadata.org_code`.

Archivos que crea o modifica:
- `app/tests/e2e/fixtures.ts`
- `app/tests/e2e/onboarding.spec.ts`
- `app/src/app/(app)/hoy/page.tsx`
- `app/src/app/page.tsx`
- `app/tests/db/org-attribution.test.ts`

**Done when**
- [ ] WHEN a new user without consents signs in THE SYSTEM SHALL redirect any `(app)` route to `/bienvenida/consentimientos`, where every checkbox starts unchecked.
- [ ] WHEN the consent form is submitted without the age and authorization declarations THE SYSTEM SHALL show an error inside an element with `role="alert"` and stay on the page.
- [ ] WHEN the user completes the consents and the welcome form with care type `adulto_mayor` THE SYSTEM SHALL land on `/hoy` showing the cared person's name and the install guide with separate "Android con Chrome" and "iPhone con Safari" instructions.
- [ ] WHEN axe runs on `/`, `/entrar`, `/bienvenida/consentimientos`, `/bienvenida` and `/hoy` with the tags wcag2a, wcag2aa, wcag21a, wcag21aa and wcag22aa THE SYSTEM SHALL report 0 violations.
- [ ] WHEN a user is created with `org_code` metadata `demo-local` THE SYSTEM SHALL store `DEMO-LOCAL` in `profiles.org_code`, and an unknown code SHALL be stored as null.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/org-attribution.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/onboarding.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 16: e2e-bienvenida"
git tag step-16-e2e-bienvenida
# si el paso 17 sale mal: git reset --hard step-16-e2e-bienvenida
```

---

#### Step 17 — Expandir reglas de repetición con horario de Chile

Épica `03-recordatorios-y-avisos` · tarea `E3-T1` · prioridad `p0` · depende de: paso 14

**Do**

Módulo puro, sin base de datos y con el reloj inyectado. Usa `TZDate` de `@date-fns/tz` y funciones de `date-fns`; nunca la zona horaria del equipo.
- `expandRule(rule, tz, fromUtc, toUtc): Date[]` — instantes del evento entre `fromUtc` y `toUtc`, ordenados y sin duplicados, para cada hora de `rule.times` en la zona `tz`. `monthly` con un día que el mes no tiene → último día del mes. `yearly` del 29 de febrero → 28 de febrero en años no bisiestos. Nada después del final del día local de `endDate`.
- Cambio de hora (regla de la casa, documentada en el código): una hora local que no existe (salto hacia adelante) se corre hacia adelante lo que dura el salto; una hora que ocurre dos veces (atraso) usa la **primera**. Chile cambia la hora a medianoche, así que el caso real es 00:00–00:59 del día del adelanto y 23:00–23:59 del día del atraso.
- `localDateOf(instant, tz): string` (`YYYY-MM-DD`).
- `advanceNotices(eventInstant, tz, advanceDays): Array<{ daysBefore, fireAt }>` — aviso a las 09:00 locales `daysBefore` días antes; para 0 días, 09:00 del mismo día solo si el evento es después de las 09:00.
- `recurrence-dst.test.ts` no escribe fechas de cambio a mano: recorre 2027 completo y verifica la propiedad.

Archivos que crea o modifica:
- `app/src/server/reminders/recurrence.ts`
- `app/tests/unit/recurrence.test.ts`
- `app/tests/unit/recurrence-dst.test.ts`

**Done when**
- [ ] WHEN a `daily` rule with times `["08:00","20:00"]` is expanded over 14 local days in `America/Santiago` THE SYSTEM SHALL return 28 instants, each formatting to 08:00 or 20:00 in that zone.
- [ ] WHEN a `weekly` rule with weekdays `[1,3,5]` is expanded over two weeks THE SYSTEM SHALL return only Mondays, Wednesdays and Fridays.
- [ ] WHEN a `monthly` rule with `dayOfMonth: 31` is expanded over a year THE SYSTEM SHALL use the last day of every shorter month, and a `yearly` rule on February 29 SHALL fall on February 28 in non-leap years.
- [ ] WHEN a `daily` rule with times `["00:30","08:00","23:30"]` is expanded over all of 2027 in `America/Santiago` THE SYSTEM SHALL return exactly one instant per time per local day, strictly increasing, each at the requested local time or, only on the spring-forward day, at most 60 minutes later.
- [ ] WHEN `advanceNotices` gets an appointment at 15:00 local with `[3,1,0]` THE SYSTEM SHALL return fire times at 09:00 local 3 days before, 1 day before and the same day, and for an appointment at 08:00 SHALL omit the same-day notice.
- [ ] WHEN a rule has an `endDate` THE SYSTEM SHALL return no instant after the end of that local day.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/recurrence.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/unit/recurrence-dst.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 17: recurrencia"
git tag step-17-recurrencia
# si el paso 18 sale mal: git reset --hard step-17-recurrencia
```

---

#### Step 18 — Cifrar campos sensibles y guardar recordatorios

Épica `03-recordatorios-y-avisos` · tarea `E3-T2` · prioridad `p0` · depende de: paso 17, paso 9, paso 13

**Do**

- `app/src/lib/crypto/field.ts` — AES-256-GCM con `node:crypto`. `FIELD_ENCRYPTION_KEY` tiene la forma `<versión>:<32 bytes en base64>`; `FIELD_ENCRYPTION_KEY_PREVIOUS` (opcional) igual, para rotar. `encryptField(plain, context)` → `v<versión>.<iv base64url>.<cifrado+tag base64url>` con IV aleatorio de 12 bytes y `context` (por ejemplo `"reminders.med_name"`) como AAD. `decryptField(value, context)` elige la clave por versión; cualquier alteración lanza `FieldDecryptError`. Sin dependencias del framework (lo usa también un script).
- `app/src/server/reminders/reminders.ts` — `createReminder`, `updateReminder`, `deleteReminder` (pone `active = false`; el historial se conserva) y `listReminders(client, circleId)` que descifra. zod: `kind`, `importance`, `title` 1–120, `medName` ≤ 120 y `medInstructions` ≤ 300 solo para `medication`, `rule` con `ruleSchema`, `advanceDays` (por defecto `[3,1,0]` para `appointment`, `errand` e `important_date`; `[]` para el resto), `visibleToCared`. Los errores de Postgres `42501` se traducen a `forbidden`. Registra `reminder.created`.

Archivos que crea o modifica:
- `app/src/lib/crypto/field.ts`
- `app/tests/unit/field-crypto.test.ts`
- `app/src/server/reminders/reminders.ts`
- `app/tests/db/reminders.test.ts`

**Done when**
- [ ] WHEN `encryptField` and then `decryptField` run with the same context THE SYSTEM SHALL return the original text, the ciphertext SHALL start with `v1.`, and two encryptions of the same text SHALL differ.
- [ ] WHEN `decryptField` receives a ciphertext with one character changed or a different context THE SYSTEM SHALL throw `FieldDecryptError`.
- [ ] WHEN `FIELD_ENCRYPTION_KEY` moves to version 2 with the old key in `FIELD_ENCRYPTION_KEY_PREVIOUS` THE SYSTEM SHALL still decrypt `v1.` values and encrypt new values as `v2.`.
- [ ] WHEN a caregiver creates a medication reminder whose name is "Losartán" THE SYSTEM SHALL store `med_name_enc` starting with `v1.` and never the plain name, and `listReminders` SHALL return `medName: "Losartán"`.
- [ ] WHEN a `family` member calls `createReminder` on that circle THE SYSTEM SHALL return `{ ok: false, error: { code: "forbidden" } }`, and WHEN the caregiver deletes a reminder THE SYSTEM SHALL set `active = false` and keep its occurrences.
- [ ] WHEN an `appointment` reminder is created without `advanceDays` THE SYSTEM SHALL store `{3,1,0}`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/field-crypto.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/db/reminders.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 18: recordatorios-datos"
git tag step-18-recordatorios-datos
# si el paso 19 sale mal: git reset --hard step-18-recordatorios-datos
```

---

#### Step 19 — Crear y editar recordatorios desde la app (F3)

Épica `03-recordatorios-y-avisos` · tarea `E3-T3` · prioridad `p0` · depende de: paso 18, paso 16

**Do**

- `recordatorios/page.tsx` — lista del círculo activo (`?c=`), agrupada por tipo, con hora(s), repetición en palabras ("todos los días a las 08:00", "lunes, miércoles y viernes") y etiqueta de importancia en texto ("Importante", "Normal", "Cuando puedas"); botón "Nuevo recordatorio".
- `recordatorios/editar/page.tsx` — sin `id` crea, con `?id=` edita; `?fecha=YYYY-MM-DD` precarga la fecha de inicio (lo usa el calendario).
- `recordatorios/actions.ts` — `"use server"`: `saveReminder`, `removeReminder`; validan sesión y llaman a `reminders.ts`.
- `reminder-form.tsx` (cliente, react-hook-form + `@hookform/resolvers/zod`): tipo (7 opciones), título, importancia, nombre e indicación del medicamento (solo si es medicamento, con la nota "Sin catálogo de fármacos ni dosis: escribe lo que diga la receta"), repetición, horas (agregar/quitar), fecha de inicio y de término opcional, días de aviso previo (para controles, trámites y fechas), "Visible para <nombre>". Errores con `Field`. Mensaje si no hay horas: "Agrega al menos una hora."

Archivos que crea o modifica:
- `app/src/app/(app)/recordatorios/page.tsx`
- `app/src/app/(app)/recordatorios/editar/page.tsx`
- `app/src/app/(app)/recordatorios/actions.ts`
- `app/src/components/reminders/reminder-form.tsx`
- `app/tests/e2e/reminders.spec.ts`

**Done when**
- [ ] WHEN a caregiver creates from `/recordatorios/editar` a medication reminder titled "Medicamento de la mañana", daily at 08:00, importance important THE SYSTEM SHALL list it on `/recordatorios` with "08:00" and the label "Importante".
- [ ] WHEN `tests/e2e/reminders.spec.ts` creates a daily reminder THE SYSTEM SHALL need at most 8 field interactions before pressing "Guardar" (H2: under 60 seconds).
- [ ] WHEN the form is submitted with no time THE SYSTEM SHALL show "Agrega al menos una hora." inside an element with `role="alert"` and create nothing.
- [ ] WHEN `/recordatorios/editar?fecha=2027-03-10` is opened THE SYSTEM SHALL prefill the start date with `2027-03-10`.
- [ ] WHEN axe runs on `/recordatorios` and `/recordatorios/editar` THE SYSTEM SHALL report 0 violations.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test:e2e tests/e2e/reminders.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 19: recordatorios-ui"
git tag step-19-recordatorios-ui
# si el paso 20 sale mal: git reset --hard step-19-recordatorios-ui
```

---

#### Step 20 — Materializar las ocurrencias de las próximas 48 horas

Épica `03-recordatorios-y-avisos` · tarea `E3-T4` · prioridad `p0` · depende de: paso 18

**Do**

- `materializeOccurrences(admin, { now, horizonHours = 48, circleIds? })` — para cada recordatorio activo de un círculo abierto cuya cuidadora (creadora del círculo) no tenga `deactivated_at`: expande con `expandRule` en la zona del círculo entre `now − 6 h` y `now + horizonHours` y crea las ocurrencias `main` (`due_at = event_at`, `local_date`); para avisos previos expande hasta `now + horizonHours + max(advanceDays)` días y crea las `advance` cuyo `fireAt` cae en la ventana (`due_at = fireAt`, `event_at` = evento). Inserta con `upsert(..., { onConflict: "reminder_id,kind,event_at,advance_days", ignoreDuplicates: true })`. Devuelve `{ created }`. Usa el cliente admin: corre en el despachador y al abrir "Hoy".

Archivos que crea o modifica:
- `app/src/server/reminders/materialize.ts`
- `app/tests/db/materialize.test.ts`

**Done when**
- [ ] WHEN `materializeOccurrences` runs with a fixed `now` for a daily 08:00 reminder THE SYSTEM SHALL create the `main` occurrences that fall inside the next 48 hours, each with `local_date` computed in `America/Santiago`.
- [ ] WHEN it runs a second time with the same `now` THE SYSTEM SHALL create zero new rows.
- [ ] WHEN an appointment falls 3 days after `now` with advance days `[3,1,0]` THE SYSTEM SHALL create the 3-days-before `advance` occurrence once its fire time enters the 48-hour window, and only once.
- [ ] WHEN the circle is closed, the reminder is inactive, or the caregiver's profile has `deactivated_at` set THE SYSTEM SHALL create no occurrence for it.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/materialize.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 20: materializacion"
git tag step-20-materializacion
# si el paso 21 sale mal: git reset --hard step-20-materializacion
```

---

#### Step 21 — Enviar avisos y el "¿Lo hiciste?" a los 15 minutos

Épica `03-recordatorios-y-avisos` · tarea `E3-T5` · prioridad `p0` · depende de: paso 20

**Do**

- `app/src/server/push/send.ts` — `type PushSender = (subscription, payload) => Promise<{ statusCode: number }>`; `webPushSender()` con `web-push` y `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (TTL 3600, `urgency: "high"` para importantes); `sendToUser(admin, userId, payload, sender)`: 404/410 → borra la suscripción; otro error → `failed_count + 1`; éxito → `last_success_at`.
- `app/src/server/reminders/dispatch.ts` — `runDispatch({ admin, now, sender })`: toma el bloqueo `acquire_job_lease('dispatch', 55)` (si no, `{ skipped: true }`); materializa; **avisos**: ocurrencias `pending` con `due_at` entre `now − 6 h` y `now` y `notified_at` nulo — se reclaman con `update … set notified_at = now where id = … and notified_at is null` antes de enviar (nunca dos envíos); **seguimiento**: `main` aún `pending`, con `notified_at` y sin `followup_sent_at`, cuando pasaron `followup_minutes` de la cuidadora; **pospuestas**: `snoozed` con `snoozed_until ≤ now` vuelven a `pending` con `notified_at` nulo. Destinatarias en este paso: las cuidadoras del círculo. Payload: `{ title, body, url: "/hoy?c=<círculo>", occurrenceId, tag, actions? }`; el título es el `title` del recordatorio (para medicamentos nunca el nombre descifrado); el seguimiento usa el título "¿Lo hiciste?" y las acciones `done` ("Sí, listo") y `not_done` ("No"). Libera el bloqueo en `finally`. Devuelve conteos.
- `app/src/app/api/cron/dispatch/route.ts` — solo `POST`; compara `x-cron-secret` con `CRON_SECRET` usando `timingSafeEqual`; sin él → 401 `{ ok: false, error: { code: "unauthorized" } }`; con él → `runDispatch` con `webPushSender()` y 200 con los conteos.
- `app/scripts/trigger-cron.ts` — `tsx scripts/trigger-cron.ts dispatch|daily`: llama a `loadLocalEnv()` y hace `POST ${APP_URL}/api/cron/<trabajo>` con el secreto; imprime el estado; sale con 0 solo si la respuesta es 200. En local reemplaza a pg_cron (`pnpm -C app cron:dispatch` con `pnpm -C app dev` corriendo).

Archivos que crea o modifica:
- `app/src/server/push/send.ts`
- `app/src/server/reminders/dispatch.ts`
- `app/src/app/api/cron/dispatch/route.ts`
- `app/scripts/trigger-cron.ts`
- `app/tests/db/dispatch.test.ts`

**Done when**
- [ ] WHEN `runDispatch` runs at 08:00:30 for a pending 08:00 occurrence with a fake sender THE SYSTEM SHALL send exactly one notification to each caregiver subscription and set `notified_at`, and a second run SHALL send nothing more.
- [ ] WHEN that occurrence is still `pending` 15 minutes after `notified_at` and the caregiver has `followup_minutes = 15` THE SYSTEM SHALL send one follow-up whose payload has the title "¿Lo hiciste?" and the actions `done` ("Sí, listo") and `not_done` ("No"), and set `followup_sent_at`.
- [ ] WHEN the fake sender answers 410 for a subscription THE SYSTEM SHALL delete that `push_subscriptions` row.
- [ ] WHEN two `runDispatch` calls overlap THE SYSTEM SHALL let only one hold the `dispatch` lease and the other SHALL return `{ skipped: true }`.
- [ ] WHEN `POST /api/cron/dispatch` arrives without the correct `x-cron-secret` THE SYSTEM SHALL return 401 and send nothing.
- [ ] WHEN a payload is built for a medication reminder THE SYSTEM SHALL not contain the decrypted medication name.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/dispatch.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 21: despachador"
git tag step-21-despachador
# si el paso 22 sale mal: git reset --hard step-21-despachador
```

---

#### Step 22 — Publicar el manifiesto y los íconos de la PWA

Épica `03-recordatorios-y-avisos` · tarea `E3-T6` · prioridad `p0` · depende de: paso 4, paso 21

**Do**

- `app/src/app/manifest.ts` — `name: "Sole · el día a día del cuidado"`, `short_name: "Sole"`, `start_url: "/hoy"`, `scope: "/"`, `display: "standalone"`, `lang: "es-CL"`, colores desde `tokens.light`, íconos `/icons/192` (192x192), `/icons/512` (512x512) y `/icons/512-maskable` (512x512, `purpose: "maskable"`).
- `app/src/app/icons/[size]/route.tsx` — `ImageResponse` de `next/og`: el logo de Sole (cuadrado redondeado color `tokens.light.primary` con una "S" color `tokens.light.background`, igual al favicon de la web). Tamaños `96`, `192`, `512`, `512-maskable` (con margen de seguridad); cualquier otro → 404. `generateStaticParams` para generarlos en el build.
- `app/tests/e2e/manifest.spec.ts` — pide el manifiesto y los íconos con `request` de Playwright.

Archivos que crea o modifica:
- `app/src/app/manifest.ts`
- `app/src/app/icons/[size]/route.tsx`
- `app/tests/e2e/manifest.spec.ts`

**Done when**
- [ ] WHEN `GET /manifest.webmanifest` is requested THE SYSTEM SHALL return JSON with `short_name` "Sole", `start_url` "/hoy", `display` "standalone", `lang` "es-CL" and icons of sizes `192x192` and `512x512`, one of them with purpose `maskable`.
- [ ] WHEN `GET /icons/192` and `GET /icons/512` are requested THE SYSTEM SHALL answer 200 with `content-type: image/png`, and `GET /icons/7` SHALL answer 404.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test:e2e tests/e2e/manifest.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 22: pwa-manifiesto"
git tag step-22-pwa-manifiesto
# si el paso 23 sale mal: git reset --hard step-22-pwa-manifiesto
```

---

#### Step 23 — Registrar el service worker con avisos push (Serwist)

Épica `03-recordatorios-y-avisos` · tarea `E3-T7` · prioridad `p0` · depende de: paso 22

**Do**

- `app/next.config.ts` — envuelve la config con `withSerwist({ swSrc: "src/sw.ts", swDest: "public/sw.js", disable: process.env.NODE_ENV === "development", reloadOnOnline: false })` de `@serwist/next`.
- `app/tsconfig.json` — agrega `"webworker"` a `compilerOptions.lib` (tipos de `ServiceWorkerGlobalScope`, `PushEvent`, `NotificationEvent`); nada más cambia.
- `app/src/sw.ts` — tipado como indica el README de Serwist (`declare global { interface WorkerGlobalScope extends SerwistGlobalConfig { __SW_MANIFEST: (PrecacheEntry | string)[] | undefined } }` y `declare const self: ServiceWorkerGlobalScope`). `Serwist` con `precacheEntries: self.__SW_MANIFEST`, `defaultCache` de `@serwist/next/worker`, `skipWaiting`, `clientsClaim`, `navigationPreload`. Evento `push`: `showNotification(title, { body, icon: "/icons/192", badge: "/icons/96", tag, data: { url, occurrenceId }, actions, requireInteraction })`. Evento `notificationclick`: con acción `done` o `not_done` hace `POST /api/occurrences/mark` (`credentials: "same-origin"`, `idempotencyKey: crypto.randomUUID()`, `via: "push"`); si responde 401, o sin acción, abre o enfoca `data.url`. La página sin conexión (`fallbacks`) llega en paso 28 (`sin-conexion-lectura`).
- `app/tests/e2e/pwa.spec.ts` — solo en el proyecto `android-gama-media` (`test.skip` en WebKit).

Archivos que crea o modifica:
- `app/src/sw.ts`
- `app/next.config.ts`
- `app/tsconfig.json`
- `app/tests/e2e/pwa.spec.ts`

**Done when**
- [ ] WHEN `GET /sw.js` is requested from the production build THE SYSTEM SHALL answer 200 with a JavaScript content type.
- [ ] WHEN a page is loaded in the `android-gama-media` project THE SYSTEM SHALL register a service worker whose scope is the site root, checked with `navigator.serviceWorker.ready`.
- [ ] WHEN `pnpm -C app typecheck` runs THE SYSTEM SHALL exit 0 with `src/sw.ts` included in the program.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test:e2e tests/e2e/pwa.spec.ts  # expect: exit 0, 0 failed (el registro del SW se prueba solo en Chromium)
```

**Checkpoint**
```bash
git add -A && git commit -m "step 23: pwa-service-worker"
git tag step-23-pwa-service-worker
# si el paso 24 sale mal: git reset --hard step-23-pwa-service-worker
```

---

#### Step 24 — Activar, probar y mostrar el estado de los avisos

Épica `03-recordatorios-y-avisos` · tarea `E3-T8` · prioridad `p0` · depende de: paso 23

**Do**

- `app/src/server/push/subscriptions.ts` — `saveSubscription(client, admin, userId, sub, userAgent)` (si el `endpoint` existe para otra usuaria, el admin borra esa fila; luego inserta o actualiza la propia), `removeSubscription(client, endpoint)`, `pushStatus(client)` → `{ active: boolean, count }`.
- `app/src/app/api/push/route.ts` — `POST` con `{ action: "subscribe" | "unsubscribe" | "test", subscription? }` validado con zod; usa `createSupabaseRouteClient(request)`; sin sesión → 401 `{ ok: false, error: { code: "unauthorized" } }`; `test` (límite `push_test`) manda "Así se verá un aviso de Sole" a las suscripciones propias.
- `push-settings.tsx` (cliente) — explica para qué sirven los avisos; "Activar avisos" pide permiso **solo al tocarlo** y suscribe con `NEXT_PUBLIC_VAPID_PUBLIC_KEY`; "Probar aviso"; indicador en texto "Avisos activos ✓" / "Avisos desactivados ✗" (no solo color); nota de iPhone (instalar en inicio, iOS 16.4+) y de ahorro de batería en Android. Registra `push.permission` con el resultado.
- `app/src/app/(app)/avisos/page.tsx` — el componente, más minutos para el "¿Lo hiciste?" (5 a 120, por defecto 15) y hora sugerida para la bitácora.

Archivos que crea o modifica:
- `app/src/server/push/subscriptions.ts`
- `app/src/app/api/push/route.ts`
- `app/src/components/push/push-settings.tsx`
- `app/src/app/(app)/avisos/page.tsx`
- `app/tests/db/push-subscriptions.test.ts`

**Done when**
- [ ] WHEN an authenticated user posts `{ action: "subscribe", subscription }` to `/api/push` THE SYSTEM SHALL store one `push_subscriptions` row for that user, and posting the same endpoint again SHALL leave exactly one row.
- [ ] WHEN a second user subscribes with an endpoint already stored for the first THE SYSTEM SHALL move that row to the second user and leave none for the first.
- [ ] WHEN `/api/push` is called without a session THE SYSTEM SHALL return 401 with `{ ok: false, error: { code: "unauthorized" } }`.
- [ ] WHEN `{ action: "unsubscribe" }` is posted THE SYSTEM SHALL delete only the caller's row for that endpoint.
- [ ] WHEN `pushStatus` is read for a user with no subscription THE SYSTEM SHALL return `{ active: false, count: 0 }`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/push-subscriptions.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 24: avisos-suscripcion"
git tag step-24-avisos-suscripcion
# si el paso 25 sale mal: git reset --hard step-24-avisos-suscripcion
```

---

#### Step 25 — Construir "Hoy" y la marca idempotente de ítems (F2)

Épica `04-dia-a-dia` · tarea `E4-T1` · prioridad `p0` · depende de: paso 24, paso 19

**Do**

- `app/src/server/today/today.ts` — `getToday(client, admin, circleId, now)`: primero `materializeOccurrences` para ese círculo (así "Hoy" está completo aunque el cron no haya corrido); luego las ocurrencias `main` del día local agrupadas en `important`, `normal`, `whenever`, cada grupo por hora; `overdue: true` si ya pasó y sigue `pending`; `upcoming`: controles, trámites y fechas importantes de los próximos 7 días; `progress` del día y de la semana (`done` / total, sin porcentajes que culpen).
- `app/src/app/(app)/hoy/page.tsx` — reemplaza la versión mínima: saludo, persona cuidada, avance amable ("Vas 3 de 5 hoy"), grupos "Importante", "Normal", "Cuando puedas", lo hecho y "Próximos días". Mantiene la guía de instalación con `?bienvenida=1`.
- `occurrence-item.tsx` (cliente) — "Hecho", "No se hizo" (motivos "Lo rechazó", "No había", "Otro") y "Posponer" (30 min, 1 h, 2 h); actualización optimista; `fetch` a la ruta con `idempotencyKey = crypto.randomUUID()`.
- `app/src/app/api/occurrences/mark/route.ts` — `POST` `{ occurrenceId, status, reason?, snoozeMinutes?, idempotencyKey, via }` (zod) → RPC `mark_occurrence` con `createSupabaseRouteClient`; errores: sin sesión 401, `forbidden` 403, `not_found` 404, validación 422, `conflict` 409 (la misma `idempotencyKey` ya se usó para otra ocurrencia, o el círculo está cerrado). Registra `occurrence.marked`.

Archivos que crea o modifica:
- `app/src/server/today/today.ts`
- `app/src/app/(app)/hoy/page.tsx`
- `app/src/components/today/occurrence-item.tsx`
- `app/src/app/api/occurrences/mark/route.ts`
- `app/tests/db/today.test.ts`

**Done when**
- [ ] WHEN `getToday` runs for a circle with an important 08:00 item, a normal 13:00 item and a whenever item THE SYSTEM SHALL return them in the groups `important`, `normal` and `whenever`, each sorted by time.
- [ ] WHEN an item's time has passed and it is still `pending` THE SYSTEM SHALL flag it `overdue: true`, and items marked `done` SHALL be counted in `progress.day.done`.
- [ ] WHEN `POST /api/occurrences/mark` receives the same `idempotencyKey` twice THE SYSTEM SHALL apply the change once, write one `occurrence_marks` row and answer 200 both times.
- [ ] WHEN it receives `status: "not_done"` with `reason: "rechazo"` THE SYSTEM SHALL store `not_done_reason = 'rechazo'`, and WHEN it receives `status: "snoozed"` with `snoozeMinutes: 30` THE SYSTEM SHALL set `snoozed_until` 30 minutes ahead.
- [ ] WHEN a user who is not a member posts a mark THE SYSTEM SHALL answer 403 with code `forbidden` and change nothing.
- [ ] WHEN an `idempotencyKey` already used for another occurrence is posted, or the occurrence's circle is closed, THE SYSTEM SHALL answer 409 with code `conflict` and change nothing.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/today.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 25: hoy"
git tag step-25-hoy
# si el paso 26 sale mal: git reset --hard step-25-hoy
```

---

#### Step 26 — Sumar el consejo del día y el cambio de círculo

Épica `04-dia-a-dia` · tarea `E4-T2` · prioridad `p0` · depende de: paso 25

**Do**

- `app/src/server/today/tips.ts` — `tipOfDay(tips, localDate, careType)`: elige de forma determinista (hash de la fecha) entre los consejos activos que aplican a ese tipo de cuidado o a todos; `acceptActivity(client, userId, circleId, tip, now)` crea un recordatorio `once` para hoy a la próxima hora en punto, importancia `whenever`, `source = 'tip'`.
- `tip-card.tsx` (cliente) — tarjeta breve y cálida; si es actividad, botón "Aceptar" que llama a la Server Action que recibe por props.
- `hoy/page.tsx` — monta `TipCard` (con una Server Action en línea que llama a `acceptActivity`) y, si la usuaria tiene más de un círculo, un cambiador arriba ("Estás viendo: <nombre>") hecho con enlaces `?c=<id>` renderizados en el servidor.
- `app/tests/e2e/today.spec.ts` — marca hecho, no hecho con motivo y pospuesto; cambia de círculo; axe.

Archivos que crea o modifica:
- `app/src/server/today/tips.ts`
- `app/src/components/today/tip-card.tsx`
- `app/src/app/(app)/hoy/page.tsx`
- `app/tests/unit/tips.test.ts`
- `app/tests/e2e/today.spec.ts`

**Done when**
- [ ] WHEN `tipOfDay` is called twice with the same date THE SYSTEM SHALL return the same tip, and over 30 consecutive dates SHALL return at least 2 different tips when 2 or more are active.
- [ ] WHEN the tip is an activity and the user activates "Aceptar" THE SYSTEM SHALL show it in today's `whenever` group, backed by a one-time reminder with `source = 'tip'`.
- [ ] WHEN a caregiver with two circles opens `/hoy` THE SYSTEM SHALL show the circle switcher, and choosing the second circle SHALL show only that circle's items.
- [ ] WHEN the user activates "Hecho" on an item THE SYSTEM SHALL show it as done without a full page reload, and "No se hizo" SHALL offer the reasons "Lo rechazó", "No había" and "Otro".
- [ ] WHEN axe runs on `/hoy` THE SYSTEM SHALL report 0 violations.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/tips.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/today.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 26: hoy-consejos-circulos"
git tag step-26-hoy-consejos-circulos
# si el paso 27 sale mal: git reset --hard step-26-hoy-consejos-circulos
```

---

#### Step 27 — Encolar marcas sin conexión y reenviarlas al volver la señal

Épica `04-dia-a-dia` · tarea `E4-T3` · prioridad `p0` · depende de: paso 26

**Do**

- `app/src/lib/offline/outbox.ts` — base IndexedDB `sole` (con `idb`) y dos almacenes: `snapshot` (clave: id del círculo; valor: los datos de "Hoy" + `savedAt`) y `outbox` (clave: `idempotencyKey`). `saveSnapshot`, `readSnapshot`, `enqueueMark`, `pendingCount`, `replayOutbox(fetchFn)`: reenvía cada marca con `via: "offline_sync"`; 2xx, 403, 404 o 422 → la saca de la cola; error de red o 5xx → la deja; 401 → se detiene y deja todo.
- `occurrence-item.tsx` — si el `fetch` falla por red, encola y muestra "Guardado sin conexión · se enviará cuando vuelva la señal".
- `offline-sync.tsx` (cliente) — guarda el snapshot cada vez que "Hoy" carga con conexión; escucha `online` y reintenta al montar; muestra "Sin conexión" en una región `aria-live="polite"` y cuántas marcas esperan.
- `hoy/page.tsx` — monta `OfflineSync` con los datos del día.

Archivos que crea o modifica:
- `app/src/lib/offline/outbox.ts`
- `app/src/components/today/offline-sync.tsx`
- `app/src/components/today/occurrence-item.tsx`
- `app/src/app/(app)/hoy/page.tsx`
- `app/tests/e2e/offline-queue.spec.ts`

**Done when**
- [ ] WHEN the browser goes offline after `/hoy` loaded and the user marks an item "Hecho" THE SYSTEM SHALL show "Guardado sin conexión · se enviará cuando vuelva la señal" and keep the item shown as done.
- [ ] WHEN the browser comes back online THE SYSTEM SHALL replay the queued mark with `via = 'offline_sync'`, the occurrence SHALL be `done` in the database, and the pending counter SHALL disappear.
- [ ] WHEN the same queued mark is replayed twice THE SYSTEM SHALL keep exactly one `occurrence_marks` row for its `idempotencyKey`.
- [ ] WHEN the browser is offline THE SYSTEM SHALL announce "Sin conexión" in an `aria-live="polite"` region.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test:e2e tests/e2e/offline-queue.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 27: sin-conexion-cola"
git tag step-27-sin-conexion-cola
# si el paso 28 sale mal: git reset --hard step-27-sin-conexion-cola
```

---

#### Step 28 — Mostrar "Hoy" guardado cuando no hay señal

Épica `04-dia-a-dia` · tarea `E4-T4` · prioridad `p0` · depende de: paso 27

**Do**

- `app/src/app/~offline/page.tsx` (cliente) — lee el último snapshot de IndexedDB y muestra la lista del día en modo lectura, con la hora en que se guardó ("Guardado a las 09:12"), y los botones de marcar que encolan como en "Hoy". Sin snapshot: "Todavía no hay nada guardado en este teléfono. Abre Sole con conexión una vez."
- `app/src/sw.ts` — agrega `fallbacks: { entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }] }`.

Archivos que crea o modifica:
- `app/src/app/~offline/page.tsx`
- `app/src/sw.ts`
- `app/tests/e2e/offline-reload.spec.ts`

**Done when**
- [ ] WHEN `/hoy` was opened once online and the page is reloaded with the network offline THE SYSTEM SHALL show the saved list of the day with the text "Guardado a las" followed by the save time.
- [ ] WHEN a navigation to a page never visited happens offline THE SYSTEM SHALL serve the `/~offline` page instead of the browser's error page.
- [ ] WHEN no snapshot exists and the offline page opens THE SYSTEM SHALL show "Todavía no hay nada guardado en este teléfono. Abre Sole con conexión una vez."

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test:e2e tests/e2e/offline-reload.spec.ts  # expect: exit 0, 0 failed (solo Chromium: service worker)
```

**Checkpoint**
```bash
git add -A && git commit -m "step 28: sin-conexion-lectura"
git tag step-28-sin-conexion-lectura
# si el paso 29 sale mal: git reset --hard step-28-sin-conexion-lectura
```

---

#### Step 29 — Mostrar el calendario de mes y de semana (F4)

Épica `04-dia-a-dia` · tarea `E4-T5` · prioridad `p0` · depende de: paso 25

**Do**

- `app/src/server/calendar/calendar.ts` — `buildMonth(reminders, tz, year, month)` y `buildWeek(reminders, tz, isoDate)` con `expandRule`; semanas de lunes a domingo; cada día con sus ítems (título, hora, importancia, tipo).
- `calendario/page.tsx` — `?vista=mes|semana&fecha=YYYY-MM-DD`; anterior/siguiente; selector "Mes" / "Semana"; en cada día, enlace "Agregar" hacia `/recordatorios/editar?fecha=<día>`.
- `month-grid.tsx` — tabla con encabezados de día (`<th scope="col">`); en pantallas angostas la semana se ve como lista.

Archivos que crea o modifica:
- `app/src/server/calendar/calendar.ts`
- `app/src/app/(app)/calendario/page.tsx`
- `app/src/components/calendar/month-grid.tsx`
- `app/tests/unit/calendar.test.ts`
- `app/tests/e2e/calendar.spec.ts`

**Done when**
- [ ] WHEN `buildMonth` runs for March 2027 with a weekly Monday reminder THE SYSTEM SHALL place it on every Monday of March 2027 and on no other day, in weeks that start on Monday.
- [ ] WHEN `buildWeek` runs for a week that contains a yearly birthday THE SYSTEM SHALL include the birthday on its day.
- [ ] WHEN the user opens `/calendario?vista=semana` THE SYSTEM SHALL show 7 day columns with that week's items, and the "Mes" control SHALL switch back to the month grid.
- [ ] WHEN the user activates "Agregar" on a day THE SYSTEM SHALL open `/recordatorios/editar` with `fecha` set to that day.
- [ ] WHEN axe runs on both calendar views THE SYSTEM SHALL report 0 violations.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/calendar.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/calendar.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 29: calendario-f4"
git tag step-29-calendario-f4
# si el paso 30 sale mal: git reset --hard step-29-calendario-f4
```

---

#### Step 30 — Registrar la bitácora diaria en menos de 15 segundos (F6)

Épica `04-dia-a-dia` · tarea `E4-T6` · prioridad `p0` · depende de: paso 25

**Do**

- `app/src/server/journal/journal.ts` — `saveEntry(client, userId, circleId, input, now)`: una entrada por círculo y día local (`upsert` sobre `circle_id, entry_date`); zod con los valores exactos de la migración (`bueno|regular|dificil`; ánimos `tranquila|feliz|triste|irritable|ansiosa|desorientada|con_dolor|cansada|otro`; sueño y comida `bien|regular|poco`); nota ≤ 1000 cifrada con contexto `"journal_entries.note"`. `listEntries` descifra. Registra `journal.saved` con `duration_ms` y `has_note`.
- `journal-form.tsx` (cliente) — botones grandes, una sola pantalla: día, ánimos (multi), sueño, comida, nota opcional con la pista "Puedes dictar con el micrófono del teclado". Sin vocabulario clínico.
- `bitacora/page.tsx` — formulario de hoy arriba y los últimos 14 días abajo.

Archivos que crea o modifica:
- `app/src/server/journal/journal.ts`
- `app/src/app/(app)/bitacora/page.tsx`
- `app/src/components/journal/journal-form.tsx`
- `app/tests/db/journal.test.ts`
- `app/tests/e2e/journal.spec.ts`

**Done when**
- [ ] WHEN a caregiver saves today's entry with day `regular`, moods `tranquila` and `con_dolor`, sleep `poco`, food `bien` and a note THE SYSTEM SHALL store one `journal_entries` row whose `note_enc` starts with `v1.` and return the decrypted note on read.
- [ ] WHEN the caregiver saves again on the same local day THE SYSTEM SHALL update that same row.
- [ ] WHEN a mood outside the allowed list is sent THE SYSTEM SHALL return `{ ok: false, error: { code: "validation_failed" } }`.
- [ ] WHEN a `family` member reads the circle's entries THE SYSTEM SHALL return them, and WHEN a non-member reads THE SYSTEM SHALL return zero rows.
- [ ] WHEN `tests/e2e/journal.spec.ts` records an entry THE SYSTEM SHALL need at most 5 taps before "Guardar" (H2: under 15 seconds), and the note field SHALL show the hint "Puedes dictar con el micrófono del teclado".
- [ ] WHEN axe runs on `/bitacora` THE SYSTEM SHALL report 0 violations.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/journal.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/journal.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 30: bitacora-f6"
git tag step-30-bitacora-f6
# si el paso 31 sale mal: git reset --hard step-30-bitacora-f6
```

---

#### Step 31 — Cuidar a quien cuida: pregunta, respiro y recursos (F8)

Épica `04-dia-a-dia` · tarea `E4-T7` · prioridad `p0` · depende de: paso 25

**Do**

- `app/src/server/selfcare/selfcare.ts` — `checkIn(client, userId, score, now)` (1 a 5; `upsert` por día local); `lowStreak(client, userId, now)` → `true` si los últimos 3 días consecutivos tienen puntaje ≤ 2; `verifiedResources(client)` (solo `verified_at` no nulo). Registra `selfcare.checked_in` **sin** el puntaje.
- `para-ti/page.tsx` — "¿Cómo estás tú hoy?" (1 a 5 con palabras, no solo números), "Esto es solo para ti: no lo ve nadie más"; con racha baja, mensaje suave ("Han sido días pesados. No tienes que poder con todo.") y recursos; botón "Necesito un respiro"; directorio de recursos con su fuente y la fecha de verificación.
- `respiro-dialog.tsx` — `Dialog` con una pausa breve (respirar 1 minuto, con temporizador opcional que respeta `prefers-reduced-motion`), recursos verificados y contactos de emergencia del círculo.

Archivos que crea o modifica:
- `app/src/server/selfcare/selfcare.ts`
- `app/src/app/(app)/para-ti/page.tsx`
- `app/src/components/selfcare/respiro-dialog.tsx`
- `app/tests/db/selfcare.test.ts`
- `app/tests/e2e/selfcare.spec.ts`

**Done when**
- [ ] WHEN the caregiver answers the daily check-in with score 4 THE SYSTEM SHALL store one `selfcare_checkins` row for today, and answering again the same day SHALL update it instead of adding another.
- [ ] WHEN the last 3 consecutive days have scores of 2 or less THE SYSTEM SHALL return `lowStreak: true`, and `/para-ti` SHALL show the message "Han sido días pesados. No tienes que poder con todo." without the words `diagnóstico` or `depresión`.
- [ ] WHEN a `family` member of the same circle selects `selfcare_checkins` THE SYSTEM SHALL return zero rows.
- [ ] WHEN "Necesito un respiro" is activated THE SYSTEM SHALL open a dialog with a pause exercise and the verified resources, operable with the keyboard alone.
- [ ] WHEN `/para-ti` lists resources THE SYSTEM SHALL show only resources with `verified_at` set, each with its source link and check date.
- [ ] WHEN axe runs on `/para-ti` THE SYSTEM SHALL report 0 violations.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/selfcare.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/selfcare.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 31: para-ti-f8"
git tag step-31-para-ti-f8
# si el paso 32 sale mal: git reset --hard step-31-para-ti-f8
```

---

#### Step 32 — Ver consentimientos y descargar todos mis datos (F13)

Épica `04-dia-a-dia` · tarea `E4-T8` · prioridad `p0` · depende de: paso 30, paso 31

**Do**

- `app/src/server/account/export.ts` — `exportAll(client, userId)` → perfil, consentimientos, círculos, recordatorios (medicamentos descifrados), ocurrencias, bitácora (notas descifradas), bienestar, tareas y contactos (notas descifradas) de los círculos donde es miembro; `toCsv(rows)` con encabezado, separador `,`, comillas dobles y BOM UTF-8. Tablas CSV: `recordatorios`, `cumplimiento`, `bitacora`, `tareas`, `contactos`, `bienestar`.
- `app/src/app/api/cuenta/exportar/route.ts` — `GET ?formato=json` o `?formato=csv&tabla=<tabla>`; sin sesión 401; `content-disposition: attachment; filename="sole-<tabla|datos>-<fecha>.<ext>"`; `cache-control: no-store`.
- `cuenta/page.tsx` — consentimientos vigentes con fecha y botón para retirar el de investigación ("Puedes seguir usando Sole igual"); descargas JSON y CSV; las secciones de borrado y cierre de círculo llegan en paso 33 (`cuenta-borrado`).

Archivos que crea o modifica:
- `app/src/server/account/export.ts`
- `app/src/app/api/cuenta/exportar/route.ts`
- `app/src/app/(app)/cuenta/page.tsx`
- `app/tests/db/account-export.test.ts`

**Done when**
- [ ] WHEN an authenticated user requests `GET /api/cuenta/exportar?formato=json` THE SYSTEM SHALL answer `application/json` with `content-disposition: attachment` containing the profile, consents, circles, reminders with decrypted medication names, occurrences, journal entries with decrypted notes, self-care check-ins, tasks and contacts of that user.
- [ ] WHEN `formato=csv&tabla=bitacora` is requested THE SYSTEM SHALL answer `text/csv; charset=utf-8` with a header row and one row per journal entry.
- [ ] WHEN the export is requested without a session THE SYSTEM SHALL answer 401.
- [ ] WHEN user A exports THE SYSTEM SHALL include no row from circles where A is not a member.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/account-export.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 32: cuenta-datos"
git tag step-32-cuenta-datos
# si el paso 33 sale mal: git reset --hard step-32-cuenta-datos
```

---

#### Step 33 — Borrar la cuenta con gracia de 7 días y cerrar círculo

Épica `04-dia-a-dia` · tarea `E4-T9` · prioridad `p0` · depende de: paso 32

**Do**

- `app/src/server/account/lifecycle.ts` — `requestDeletion(client, admin, userId, accessToken)`: con el cliente admin pone `deletion_requested_at` y `deactivated_at`, y cierra todas las sesiones (`auth.admin.signOut(accessToken, "global")`); registra `account.deletion_requested`. `getAccountState(client)` → `{ status: "active" }` o `{ status: "pending_deletion", purgeAfter }` (pedido + 7 días). `restoreAccount(admin, userId)` limpia ambos campos. `closeCircle(client, circleId, reason)` → RPC `close_circle`.
- `restore-account.tsx` — "Pediste borrar tu cuenta. Se borrará definitivamente el <fecha>." con "Recuperar mi cuenta" y "Mantener el borrado".
- `(app)/layout.tsx` — si `getAccountState` dice `pending_deletion`, muestra `RestoreAccount` en vez de la app.
- `cuenta/page.tsx` — "Borrar mi cuenta" con confirmación escrita (tan fácil como crearla) y explicación de los 7 días y de que se borran también los círculos que creó, con todo lo que ven sus familiares ("Si alguien de tu familia usa estos círculos, también dejará de verlos"); "Cerrar un círculo" con motivos; si el motivo es fallecimiento, el texto es especialmente cuidadoso ("Lo sentimos mucho. Ya silenciamos todos los recordatorios.") y ofrece primero descargar la bitácora y los informes.

Archivos que crea o modifica:
- `app/src/server/account/lifecycle.ts`
- `app/src/components/account/restore-account.tsx`
- `app/src/app/(app)/layout.tsx`
- `app/src/app/(app)/cuenta/page.tsx`
- `app/tests/db/account-lifecycle.test.ts`

**Done when**
- [ ] WHEN `requestDeletion` runs THE SYSTEM SHALL set `deletion_requested_at` and `deactivated_at`, the user's refresh token SHALL stop working, and `materializeOccurrences` SHALL create nothing more for that user's circles.
- [ ] WHEN `getAccountState` runs for that user within 7 days THE SYSTEM SHALL return `status: "pending_deletion"` with `purgeAfter` 7 days after the request, and `restoreAccount` SHALL clear both fields.
- [ ] WHEN `closeCircle` runs with reason `fallecimiento` THE SYSTEM SHALL set `closed_at`, set `active = false` on every reminder of the circle and mark its `pending` and `snoozed` occurrences `skipped`.
- [ ] WHEN a `family` member calls `closeCircle` THE SYSTEM SHALL return `{ ok: false, error: { code: "forbidden" } }`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/account-lifecycle.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 33: cuenta-borrado"
git tag step-33-cuenta-borrado
# si el paso 34 sale mal: git reset --hard step-33-cuenta-borrado
```

---

#### Step 34 — Calcular resúmenes, avances e hitos (F7)

Épica `05-informes-y-escucha` · tarea `E5-T1` · prioridad `p1` · depende de: paso 33

**Do**

- `app/src/server/reports/summary.ts` — `summarize(rows, period, audience)` puro: `period` = `dia|semana|mes`; cumplimiento por tipo de recordatorio (solo ocurrencias `main`, sin contar `skipped`), actividades hechas, días de bitácora por calificación, tareas cerradas y, solo con `audience: "caregiver"`, el bienestar propio. Frases fijas, sin `Intl`: el porcentaje es `Math.round(rate * 100) + " %"` (espacio normal U+0020). Ejemplos exactos: "Esta semana se cumplió el 90 % de los medicamentos." y "Hubo 3 días difíciles." (singular: "Hubo 1 día difícil."). Lista de palabras prohibidas exportada: `diagnóstico`, `deterioro`, `empeora`, `síntoma`. `loadReportRows(client, circleId, range)` trae los datos.
- `app/src/server/reports/milestones.ts` — `milestones(rows, now)`: `medicamentos_30_dias` (30 días seguidos con todas las ocurrencias de medicamento `done`) y `un_mes_con_sole` (30 días desde la primera actividad), con su texto.
- `informes/page.tsx` — `?periodo=dia|semana|mes`; frases, hitos y el gráfico. Registra `report.viewed`.
- `compliance-chart.tsx` (cliente, Recharts) — barras simples con colores de token y, debajo, la misma información como `<table>` para lectores de pantalla.

Archivos que crea o modifica:
- `app/src/server/reports/summary.ts`
- `app/src/server/reports/milestones.ts`
- `app/tests/unit/reports.test.ts`
- `app/src/app/(app)/informes/page.tsx`
- `app/src/components/reports/compliance-chart.tsx`

**Done when**
- [ ] WHEN `summarize` receives a week with 10 medication occurrences of which 9 are `done` THE SYSTEM SHALL report `medication.rate = 0.9` and the sentence "Esta semana se cumplió el 90 % de los medicamentos.".
- [ ] WHEN the week has 3 journal entries rated `dificil` THE SYSTEM SHALL produce "Hubo 3 días difíciles." and no sentence SHALL contain `diagnóstico`, `deterioro`, `empeora` or `síntoma`.
- [ ] WHEN `summarize` runs with audience `family` THE SYSTEM SHALL omit every self-care value.
- [ ] WHEN `milestones` receives 30 consecutive days where every medication occurrence is `done` THE SYSTEM SHALL return `medicamentos_30_dias`, and for a first activity 30 days ago SHALL return `un_mes_con_sole`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/reports.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 34: informes-f7"
git tag step-34-informes-f7
# si el paso 35 sale mal: git reset --hard step-34-informes-f7
```

---

#### Step 35 — Compartir un informe como imagen o PDF desde el navegador

Épica `05-informes-y-escucha` · tarea `E5-T2` · prioridad `p1` · depende de: paso 34

**Do**

- `share-report.tsx` (cliente) — botón "Compartir"; primero un `Dialog` con "Lo que compartes sale de Sole y queda bajo tu responsabilidad." y los botones "Compartir igual" y "Cancelar"; luego `toPng` de `html-to-image` sobre la tarjeta del informe; si `navigator.canShare({ files })` → `navigator.share`; si no, descarga `sole-informe-<periodo>-<YYYY-MM-DD>.png`. Registra `report.shared` (`format: "png"` o `"pdf"`). Todo ocurre en el navegador: nada se sube a un servidor.
- `informes/imprimir/page.tsx` — versión para imprimir (`?periodo=`), con `@media print` (sin navegación, letra 12 pt, `@page { size: A4; margin: 15mm }`) y el botón "Imprimir o guardar como PDF" que llama a `window.print()`.
- `app/tests/e2e/reports.spec.ts` — siembra una semana de datos con el cliente admin.

Archivos que crea o modifica:
- `app/src/components/reports/share-report.tsx`
- `app/src/app/(app)/informes/imprimir/page.tsx`
- `app/tests/e2e/reports.spec.ts`

**Done when**
- [ ] WHEN a user with a week of data opens `/informes?periodo=semana` THE SYSTEM SHALL show the medication compliance sentence and a chart whose values also appear in an HTML table.
- [ ] WHEN the user activates "Compartir" THE SYSTEM SHALL first show "Lo que compartes sale de Sole y queda bajo tu responsabilidad." with "Compartir igual" and "Cancelar".
- [ ] WHEN "Compartir igual" is chosen in a browser without `navigator.share` THE SYSTEM SHALL download a file whose name matches `sole-informe-semana-YYYY-MM-DD.png`.
- [ ] WHEN `/informes/imprimir?periodo=mes` is opened THE SYSTEM SHALL render the button "Imprimir o guardar como PDF" and a stylesheet containing `@media print`.
- [ ] WHEN axe runs on `/informes` and `/informes/imprimir` THE SYSTEM SHALL report 0 violations.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test:e2e tests/e2e/reports.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 35: compartir-informe"
git tag step-35-compartir-informe
# si el paso 36 sale mal: git reset --hard step-35-compartir-informe
```

---

#### Step 36 — Poner el botón permanente "Contarle algo a Sole" (F10)

Épica `05-informes-y-escucha` · tarea `E5-T3` · prioridad `p1` · depende de: paso 33

**Do**

- `app/src/server/feedback/feedback.ts` — `sendFeedback(client, userId, input)`: zod (`kind` `comentario|problema`, `message` 1–2000, `screen` ≤ 80); límite `feedback` por usuaria; `insert` sin devolver filas: nunca `.insert(...).select()` (la usuaria no tiene permiso de lectura sobre `feedback`, a propósito, así que pedir la fila de vuelta fallaría con `42501`).
- `app/src/server/feedback/actions.ts` — `"use server"`: `submitFeedback(formData)` valida sesión y llama a `sendFeedback`.
- `feedback-button.tsx` (cliente) — botón fijo "Contarle algo a Sole" que no tapa contenido enfocado (WCAG 2.4.11); abre un `Dialog` con "¿Es un comentario o un problema?", texto libre y "Enviar"; confirma "Gracias. Recibimos tu mensaje." en una región `aria-live`.
- `(app)/layout.tsx` — monta el botón en todas las páginas de la app.

Archivos que crea o modifica:
- `app/src/server/feedback/feedback.ts`
- `app/src/server/feedback/actions.ts`
- `app/src/components/feedback/feedback-button.tsx`
- `app/src/app/(app)/layout.tsx`
- `app/tests/db/feedback.test.ts`

**Done when**
- [ ] WHEN a user sends "La letra se ve chica" as kind `problema` from screen `/hoy` THE SYSTEM SHALL store one `feedback` row with that text, kind and screen.
- [ ] WHEN the message is empty or longer than 2000 characters THE SYSTEM SHALL return `{ ok: false, error: { code: "validation_failed" } }`.
- [ ] WHEN a user sends an 11th message within one hour THE SYSTEM SHALL return `{ ok: false, error: { code: "rate_limited" } }`.
- [ ] WHEN a non-admin user selects from `feedback` THE SYSTEM SHALL return zero rows, including their own messages.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/feedback.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 36: comentarios-f10"
git tag step-36-comentarios-f10
# si el paso 37 sale mal: git reset --hard step-36-comentarios-f10
```

---

#### Step 37 — Mostrar las microencuestas de los días 3, 14, 28 y 56

Épica `05-informes-y-escucha` · tarea `E5-T4` · prioridad `p1` · depende de: paso 36

**Do**

- `app/src/server/surveys/surveys.ts` — `SURVEYS`: `d3` "¿Qué tan fácil te resulta usar Sole?" (1 a 5); `d14` "¿Sole te ayuda en tu día a día?" ("Sí", "Algo", "No"); `d28` "¿Cómo te sentirías si Sole dejara de existir?" ("Muy decepcionada", "Algo decepcionada", "No me importaría"); `d56` "¿Recomendarías Sole a una organización que conozcas?" ("Sí", "Tal vez", "No"). `dueSurvey(profile, answeredKeys, now)`: la encuesta de mayor día ya cumplido (días desde `profiles.created_at`) que no se haya respondido ni descartado. `answerSurvey` y `dismissSurvey` insertan en `survey_responses` y registran `survey.answered`.
- `survey-card.tsx` (cliente) — una pregunta, opciones grandes, "Ahora no".
- `hoy/page.tsx` — monta la tarjeta si hay encuesta pendiente.
- `app/tests/e2e/feedback.spec.ts` — ajusta `profiles.created_at` con el cliente admin para simular el día 3.

Archivos que crea o modifica:
- `app/src/server/surveys/surveys.ts`
- `app/src/components/feedback/survey-card.tsx`
- `app/src/app/(app)/hoy/page.tsx`
- `app/tests/db/surveys.test.ts`
- `app/tests/e2e/feedback.spec.ts`

**Done when**
- [ ] WHEN `dueSurvey` runs for a user registered 3 days ago with no answers THE SYSTEM SHALL return `d3`, and for a user registered 2 days ago SHALL return null.
- [ ] WHEN a user registered 30 days ago has answered `d3` and `d14` THE SYSTEM SHALL return `d28`, whose question is "¿Cómo te sentirías si Sole dejara de existir?" with the options "Muy decepcionada", "Algo decepcionada" and "No me importaría".
- [ ] WHEN a survey is answered or dismissed THE SYSTEM SHALL store one `survey_responses` row and not offer that survey again.
- [ ] WHEN the e2e user opens `/hoy` THE SYSTEM SHALL show the button "Contarle algo a Sole", and sending a comment SHALL show "Gracias. Recibimos tu mensaje." in an `aria-live` region.
- [ ] WHEN a user registered 3 days ago opens `/hoy` THE SYSTEM SHALL show the day-3 survey card.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/surveys.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/feedback.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 37: microencuestas"
git tag step-37-microencuestas
# si el paso 38 sale mal: git reset --hard step-37-microencuestas
```

---

#### Step 38 — Medir interés con puertas falsas honestas (F11)

Épica `05-informes-y-escucha` · tarea `E5-T5` · prioridad `p1` · depende de: paso 33

**Do**

- `app/src/server/fake-doors/doors.ts` — `export const FAMILY_ENABLED = false;` (lo cambia paso 66 (`familiares-invitaciones`)); toda función que dependa de él lo recibe como parámetro con ese valor por defecto, así las pruebas fijan ambos valores y cambiar la constante no rompe ninguna prueba. `DOORS` con slug de URL y clave: `ia`→`ia` ("Sole con IA": le hablas y ella ordena la bitácora y los recordatorios), `recetas`→`recetas`, `plan-familiar`→`plan_familiar` (3 o 4 personas; precios de prueba `$2.990`, `$4.990` y `$7.990` al mes con la leyenda "Precio de prueba: hoy no se cobra nada"), `comunidad`→`comunidad`, `fotos`→`fotos`, `invitar-familiar`→`invitar_familiar` (solo mientras `FAMILY_ENABLED` sea `false`). `visibleDoors(familyEnabled = FAMILY_ENABLED)` y `registerInterest(client, userId, doorKey, { notifyMe, choice })`.
- `pronto/page.tsx` — lista honesta de lo que viene.
- `pronto/[puerta]/page.tsx` — "Esto todavía no existe. ¿Quieres que te avisemos cuando esté?" con "Sí, avísame" y "No, gracias"; en `plan-familiar` además los tres precios para elegir. Slug desconocido → `notFound()`. Registra `fake_door.viewed` y `fake_door.interest`.

Archivos que crea o modifica:
- `app/src/server/fake-doors/doors.ts`
- `app/src/app/(app)/pronto/page.tsx`
- `app/src/app/(app)/pronto/[puerta]/page.tsx`
- `app/tests/db/fake-doors.test.ts`
- `app/tests/e2e/fake-doors.spec.ts`

**Done when**
- [ ] WHEN `/pronto/ia` is opened THE SYSTEM SHALL show "Esto todavía no existe. ¿Quieres que te avisemos cuando esté?".
- [ ] WHEN the user activates "Sí, avísame" THE SYSTEM SHALL store one `fake_door_interest` row with `door_key = 'ia'` and `notify_me = true` and confirm it on screen.
- [ ] WHEN `/pronto/plan-familiar` is opened THE SYSTEM SHALL show "$2.990", "$4.990" and "$7.990" with "Precio de prueba: hoy no se cobra nada", and choosing one SHALL store it in `choice`.
- [ ] WHEN `/pronto/no-existe` is opened THE SYSTEM SHALL answer 404.
- [ ] WHEN `visibleDoors(false)` and `visibleDoors(true)` run THE SYSTEM SHALL include `invitar-familiar` in the first result and exclude it from the second, whatever the current value of `FAMILY_ENABLED`.
- [ ] WHEN axe runs on `/pronto` and `/pronto/plan-familiar` THE SYSTEM SHALL report 0 violations.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/fake-doors.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/fake-doors.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 38: puertas-falsas-f11"
git tag step-38-puertas-falsas-f11
# si el paso 39 sale mal: git reset --hard step-38-puertas-falsas-f11
```

---

#### Step 39 — Proteger el panel de administración con rol y MFA

Épica `05-informes-y-escucha` · tarea `E5-T6` · prioridad `p0` · depende de: paso 33

**Do**

El rol de admin se asigna solo con SQL manual del fundador (ver `docs/mantenimiento.md`); ninguna vía de la app lo concede.
- `app/src/server/admin/guard.ts` — `requireAdmin(client)` → `{ ok: true, userId }` o `{ ok: false, reason: "not_admin" | "mfa_required" }` (lee `profiles.is_admin` y el `aal` de la sesión con `auth.mfa.getAuthenticatorAssuranceLevel()`); `logAdminAccess(client, action, target)` inserta en `admin_audit_log`.
- `admin/layout.tsx` — sin sesión → `/entrar`; `not_admin` → `notFound()`; `mfa_required` → `/admin/mfa`; si está OK registra el acceso. `metadata.robots = { index: false }`.
- `admin/mfa/page.tsx` — Server Actions en línea: inscribir TOTP (`auth.mfa.enroll({ factorType: "totp" })`, muestra el QR y el secreto en texto "o escribe este código"), y verificar (`challenge` + `verify`).
- `app/tests/support/totp.ts` — TOTP RFC 6238 (SHA-1, 6 dígitos, 30 s) con `node:crypto`, para pruebas.

Archivos que crea o modifica:
- `app/src/server/admin/guard.ts`
- `app/src/app/admin/layout.tsx`
- `app/src/app/admin/mfa/page.tsx`
- `app/tests/support/totp.ts`
- `app/tests/db/admin-access.test.ts`

**Done when**
- [ ] WHEN a non-admin user calls `requireAdmin` THE SYSTEM SHALL return `{ ok: false, reason: "not_admin" }`.
- [ ] WHEN an admin with an `aal1` session calls `requireAdmin` THE SYSTEM SHALL return `{ ok: false, reason: "mfa_required" }`, and an insert into `tips` with that session SHALL be rejected with `42501`.
- [ ] WHEN the admin enrolls TOTP and verifies a code generated by `tests/support/totp.ts` THE SYSTEM SHALL issue an `aal2` session with which `requireAdmin` returns `ok: true` and an insert into `tips` succeeds.
- [ ] WHEN `logAdminAccess` runs with an `aal2` admin session THE SYSTEM SHALL append one `admin_audit_log` row with that admin's id and action.
- [ ] WHEN any authenticated user updates their own `profiles.is_admin` THE SYSTEM SHALL reject it with `42501`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/admin-access.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 39: admin-acceso"
git tag step-39-admin-acceso
# si el paso 40 sale mal: git reset --hard step-39-admin-acceso
```

---

#### Step 40 — Mostrar las métricas de las hipótesis H1–H6 (F15)

Épica `05-informes-y-escucha` · tarea `E5-T7` · prioridad `p1` · depende de: paso 39, paso 37, paso 38

**Do**

- `app/src/server/admin/metrics.ts` — `loadMetricRows(client, filters)` con la sesión `aal2` del admin (RLS deja leer `events`, `profiles`, `survey_responses`, `fake_door_interest`) más conteos del cliente admin para `push_subscriptions`; `computeMetrics(rows, filters)` puro: H1 promedio de días activos por semana (días distintos con `app.opened` por seudónimo) y retención en las semanas 1, 4 y 8 por cohorte de registro; H2 mediana de `duration_ms` de `flow.completed` por flujo y tasa de abandono (`flow.abandoned` / `flow.started`); H3 distribución de `d28`; H4 interés y elección por puerta y usos `premium.used`; H5 `invitation.created`, `cared_link.created` e interés en `invitar_familiar`; H6 retención por `org_code`; además % de usuarias activas en 7 días con al menos una suscripción push. Filtros: organización y cohorte (semana de registro).
- `admin/page.tsx` — tarjetas y gráficos con filtros por organización y cohorte; cada gráfico con su tabla equivalente.
- `metric-chart.tsx` (cliente, Recharts).

Archivos que crea o modifica:
- `app/src/server/admin/metrics.ts`
- `app/src/app/admin/page.tsx`
- `app/src/components/admin/metric-chart.tsx`
- `app/tests/db/admin-metrics.test.ts`

**Done when**
- [ ] WHEN `computeMetrics` receives events for 2 users active on 5 and on 3 distinct days of one week THE SYSTEM SHALL report `h1.avgActiveDaysPerWeek = 4`.
- [ ] WHEN it receives `flow.completed` durations of 10000, 12000 and 20000 ms for flow `journal` THE SYSTEM SHALL report a median of 12000 for that flow.
- [ ] WHEN it receives `d28` answers "Muy decepcionada" twice and "Algo decepcionada" three times THE SYSTEM SHALL report a share of 0.4 for "Muy decepcionada".
- [ ] WHEN it is filtered by `org = DEMO-LOCAL` THE SYSTEM SHALL count only events whose `org_code` is `DEMO-LOCAL`.
- [ ] WHEN `loadMetricRows` runs with a non-admin session THE SYSTEM SHALL read zero events.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/admin-metrics.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 40: admin-metricas"
git tag step-40-admin-metricas
# si el paso 41 sale mal: git reset --hard step-40-admin-metricas
```

---

#### Step 41 — Gestionar organizaciones, contenido y comentarios (F15)

Épica `05-informes-y-escucha` · tarea `E5-T8` · prioridad `p1` · depende de: paso 40, paso 31

**Do**

- `app/src/server/admin/content.ts` — con la sesión `aal2`: `createOrganization` (código en mayúsculas `^[A-Z0-9-]{3,32}$`), `toggleOrganization`, CRUD de `tips`, `resources` (incluido marcar verificado con fecha) y `care_templates` (ítems validados con `templateItemSchema`), `markFeedbackRead`. Cada acción registra `logAdminAccess`.
- `admin/organizaciones/page.tsx` — lista y alta; muestra el enlace `<APP_URL>/?org=<CODIGO>` para copiar.
- `admin/contenido/page.tsx` — pestañas Consejos, Recursos, Plantillas; los recursos no verificados se marcan en texto "Sin verificar".
- `admin/comentarios/page.tsx` — comentarios del más nuevo al más antiguo, conteo de eventos `app.error` de los últimos 7 días y enlace a Sentry (`https://sentry.io/`).
- `app/tests/e2e/admin.spec.ts` — crea una usuaria, la hace admin con el cliente admin (`update profiles set is_admin = true`), inscribe TOTP en `/admin/mfa` leyendo el secreto en texto y calculando el código con `../support/totp`.

Archivos que crea o modifica:
- `app/src/server/admin/content.ts`
- `app/src/app/admin/organizaciones/page.tsx`
- `app/src/app/admin/contenido/page.tsx`
- `app/src/app/admin/comentarios/page.tsx`
- `app/tests/e2e/admin.spec.ts`

**Done when**
- [ ] WHEN an `aal2` admin creates the organization "Fundación Prueba" with code `FUND-PRUEBA` THE SYSTEM SHALL list it with the link `<APP_URL>/?org=FUND-PRUEBA`.
- [ ] WHEN the admin edits a tip's text and saves THE SYSTEM SHALL show the new text in the list.
- [ ] WHEN the admin marks a resource as verified with a check date THE SYSTEM SHALL set `verified_at`, and that resource SHALL then appear on `/para-ti`.
- [ ] WHEN the admin opens `/admin/comentarios` THE SYSTEM SHALL list feedback newest first and show the count of `app.error` events of the last 7 days with a link to Sentry.
- [ ] WHEN a user marked as admin opens `/admin` without TOTP THE SYSTEM SHALL send them to `/admin/mfa`, and only after a valid code SHALL `/admin` load.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test:e2e tests/e2e/admin.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 41: admin-gestion"
git tag step-41-admin-gestion
# si el paso 42 sale mal: git reset --hard step-41-admin-gestion
```

---

#### Step 42 — Exportar datos seudónimos y vigilar los límites gratuitos

Épica `05-informes-y-escucha` · tarea `E5-T9` · prioridad `p1` · depende de: paso 39

**Do**

- `app/src/server/admin/limits.ts` — `FREE_LIMITS` con los valores de `docs/limites.md` (cada uno con su comentario `// [VERIFICAR] fuente: …`); `usageSnapshot(admin)` → tamaño de la base en MB (RPC `admin_db_size_bytes`), usuarias activas del mes (perfiles con `last_active_at` en 30 días), suscripciones push y eventos del mes, cada uno con su límite y `warning: true` desde el 80 %.
- `app/src/app/api/admin/export/route.ts` — `GET`: exige admin `aal2` (si no, 404 para no revelar la ruta); CSV `pseudonym_id,name,props,org_code,created_at` de `events` (con `?desde=YYYY-MM-DD`); registra `logAdminAccess(..., "export")`.
- `admin/limites/page.tsx` — tabla de uso contra límite con aviso en texto desde el 80 %.

Archivos que crea o modifica:
- `app/src/server/admin/limits.ts`
- `app/src/app/api/admin/export/route.ts`
- `app/src/app/admin/limites/page.tsx`
- `app/tests/db/admin-export.test.ts`

**Done when**
- [ ] WHEN an `aal2` admin requests `GET /api/admin/export` THE SYSTEM SHALL answer CSV whose header is exactly `pseudonym_id,name,props,org_code,created_at` with no user id or email in any row.
- [ ] WHEN a non-admin or an `aal1` admin requests it THE SYSTEM SHALL answer 404.
- [ ] WHEN `usageSnapshot` runs THE SYSTEM SHALL return database size in MB, monthly active users, push subscriptions and monthly events, each next to its limit from `FREE_LIMITS`, with `warning: true` at 80 % or more.
- [ ] WHEN the export succeeds THE SYSTEM SHALL append an `admin_audit_log` row with action `export`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/admin-export.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 42: admin-export-limites"
git tag step-42-admin-export-limites
# si el paso 43 sale mal: git reset --hard step-42-admin-export-limites
```

---

#### Step 43 — Aplicar CSP con nonce y cabeceras de seguridad

Épica `06-seguridad-y-calidad` · tarea `E6-T1` · prioridad `p0` · depende de: paso 41

**Do**

- `app/src/lib/security/headers.ts` — `buildCsp(nonce, { dev })`: `default-src 'self'; script-src 'self' 'nonce-<n>' 'strict-dynamic' https://challenges.cloudflare.com` (más `'unsafe-eval'` solo si `dev`); `style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src https://challenges.cloudflare.com; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests`. `STATIC_SECURITY_HEADERS`: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: DENY`. El navegador nunca habla con Supabase (todo pasa por el servidor) y Sentry usa el túnel `/monitoring`, por eso `connect-src 'self'` basta.
- `app/src/proxy.ts` — genera un nonce por request (`crypto.randomUUID()` en base64), lo pasa en el header de request `x-nonce` y fija `content-security-policy` en la respuesta.
- `app/next.config.ts` — `headers()` aplica `STATIC_SECURITY_HEADERS` a `/:path*`.
- Ninguna ruta agrega `access-control-allow-origin`; la única API pensada para otro origen (formulario de la web) define su lista explícita en paso 63 (`web-contacto`).

Archivos que crea o modifica:
- `app/src/lib/security/headers.ts`
- `app/src/proxy.ts`
- `app/next.config.ts`
- `app/tests/unit/security-headers.test.ts`
- `app/tests/e2e/security-headers.spec.ts`

**Done when**
- [ ] WHEN `buildCsp("abc", { dev: false })` runs THE SYSTEM SHALL return a policy containing `default-src 'self'`, `script-src 'self' 'nonce-abc' 'strict-dynamic' https://challenges.cloudflare.com`, `frame-ancestors 'none'`, `object-src 'none'` and `base-uri 'self'`, and not containing `unsafe-eval`.
- [ ] WHEN the production build serves `/entrar` THE SYSTEM SHALL send `content-security-policy` with a nonce, `strict-transport-security: max-age=63072000; includeSubDomains; preload`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=()` and `x-frame-options: DENY`.
- [ ] WHEN `/entrar` is requested twice THE SYSTEM SHALL return two different nonces.
- [ ] WHEN `/`, `/entrar` and `/hoy` render in the browser THE SYSTEM SHALL log no CSP violation in the console.
- [ ] WHEN `/api/health` is requested with `Origin: https://evil.example` THE SYSTEM SHALL not send `access-control-allow-origin`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/security-headers.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/security-headers.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 43: cabeceras-csp"
git tag step-43-cabeceras-csp
# si el paso 44 sale mal: git reset --hard step-43-cabeceras-csp
```

---

#### Step 44 — Capturar errores en Sentry con datos personales filtrados

Épica `06-seguridad-y-calidad` · tarea `E6-T2` · prioridad `p0` · depende de: paso 43

**Do**

- `app/src/lib/observability/scrub.ts` — sin importar `@sentry/nextjs` en tiempo de ejecución (solo `import type`). `scrubEvent(event)`: `user` queda solo con `id` (el seudónimo si existe), sin `email` ni `ip_address`; borra `request.cookies`, `request.data` y `request.headers` salvo `user-agent`; en mensajes, excepciones y migas reemplaza correos y teléfonos (secuencias de 8 o más dígitos con espacios, `+` o guiones) por `[filtrado]`; en URLs reemplaza el valor de `token_hash`, `token`, `code`, `email` y `next` por `[filtrado]`. `scrubBreadcrumb(b)` igual. `buildSentryOptions(dsn)` → `{ enabled: Boolean(dsn), dsn, sendDefaultPii: false, tracesSampleRate: 0.1, beforeSend: scrubEvent, beforeBreadcrumb: scrubBreadcrumb }`.
- `app/src/instrumentation.ts` — `register()` inicia Sentry en `nodejs` y `edge` con `buildSentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN)`; `onRequestError` de Sentry.
- `app/src/instrumentation-client.ts` — `Sentry.init(buildSentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN))`.
- `app/next.config.ts` — envuelve con `withSentryConfig` (`silent: true`, `tunnelRoute: "/monitoring"`, mapas de código fuente subidos solo cuando existe `SENTRY_AUTH_TOKEN` y borrados después de subir; nunca se publican). Sin DSN, Sentry queda apagado.

Archivos que crea o modifica:
- `app/src/lib/observability/scrub.ts`
- `app/src/instrumentation.ts`
- `app/src/instrumentation-client.ts`
- `app/next.config.ts`
- `app/tests/unit/scrub.test.ts`

**Done when**
- [ ] WHEN `scrubEvent` receives an event with `user.email`, `user.ip_address`, `request.cookies`, `request.data`, a breadcrumb message containing `ana@example.cl` and `+56 9 1234 5678`, and a URL with `token_hash=abc` THE SYSTEM SHALL return it with no email, IP, cookies or request data, with both values in the message replaced by `[filtrado]` and the URL showing `token_hash=[filtrado]`.
- [ ] WHEN `buildSentryOptions("")` runs THE SYSTEM SHALL return `enabled: false`, and with a DSN SHALL return `enabled: true` and `sendDefaultPii: false`.
- [ ] WHEN `pnpm -C app build` runs without `SENTRY_AUTH_TOKEN` THE SYSTEM SHALL exit 0 and leave no `.map` file under `app/.next/static`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/scrub.test.ts  # expect: exit 0, 0 failed
pnpm -C app build  # expect: exit 0
test -d app/.next/static  # expect: exit 0 — el build dejó la carpeta que se revisa abajo
test -z "$(find app/.next/static -name '*.map' -print -quit)"  # expect: exit 0 — ningún mapa de código fuente público
```

**Checkpoint**
```bash
git add -A && git commit -m "step 44: sentry"
git tag step-44-sentry
# si el paso 45 sale mal: git reset --hard step-44-sentry
```

---

#### Step 45 — Dejar producción limpia y sin secretos en el bundle

Épica `06-seguridad-y-calidad` · tarea `E6-T3` · prioridad `p0` · depende de: paso 44

**Do**

- `error.tsx` y `global-error.tsx` — "Algo salió mal. Ya nos llegó el aviso." y botón "Intentar de nuevo"; nunca muestran `error.message` ni la traza (Sentry las recibe filtradas). `global-error.tsx` llama a `Sentry.captureException`.
- `not-found.tsx` — "No encontramos esta página." con enlace a `/hoy`.
- `production-hygiene.test.tsx` — primera línea `// @vitest-environment jsdom`; recorre `src/` con `node:fs` y renderiza `error.tsx`.
- `app/scripts/check-bundle-secrets.ts` — `loadLocalEnv()`; lee los valores de `SUPABASE_SECRET_KEY`, `FIELD_ENCRYPTION_KEY`, `CRON_SECRET`, `VAPID_PRIVATE_KEY` e `IP_HASH_SECRET` y busca cada uno en todos los archivos de `.next/static`; si encuentra alguno imprime el archivo (nunca el valor) y sale con 1; si no, sale con 0.

Archivos que crea o modifica:
- `app/src/app/error.tsx`
- `app/src/app/global-error.tsx`
- `app/src/app/not-found.tsx`
- `app/tests/unit/production-hygiene.test.tsx`
- `app/scripts/check-bundle-secrets.ts`

**Done when**
- [ ] WHEN `tests/unit/production-hygiene.test.tsx` scans `src/` THE SYSTEM SHALL find no `console.log`, no `dangerouslySetInnerHTML`, no `eval(`, no route folder named `debug`, `test` or `dev` under `src/app`, and no `NEXT_PUBLIC_` variable other than `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `NEXT_PUBLIC_SENTRY_DSN`.
- [ ] WHEN the same test renders `error.tsx` with an error whose message is "detalle interno" THE SYSTEM SHALL show "Algo salió mal. Ya nos llegó el aviso." and not the text "detalle interno".
- [ ] WHEN `scripts/check-bundle-secrets.ts` runs after `pnpm -C app build` THE SYSTEM SHALL find none of the values of `SUPABASE_SECRET_KEY`, `FIELD_ENCRYPTION_KEY`, `CRON_SECRET`, `VAPID_PRIVATE_KEY` and `IP_HASH_SECRET` under `.next/static` and exit 0.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/production-hygiene.test.tsx  # expect: exit 0, 0 failed
pnpm -C app build  # expect: exit 0
pnpm -C app exec tsx scripts/check-bundle-secrets.ts  # expect: exit 0 — ningún secreto en el bundle público
```

**Checkpoint**
```bash
git add -A && git commit -m "step 45: produccion-limpia"
git tag step-45-produccion-limpia
# si el paso 46 sale mal: git reset --hard step-45-produccion-limpia
```

---

#### Step 46 — Probar accesibilidad, teclado y el día completo P1

Épica `06-seguridad-y-calidad` · tarea `E6-T4` · prioridad `p0` · depende de: paso 45

**Do**

- `a11y.spec.ts` — recorre `/`, `/entrar`, `/bienvenida/consentimientos`, `/bienvenida`, `/hoy`, `/recordatorios`, `/recordatorios/editar`, `/calendario`, `/bitacora`, `/para-ti`, `/informes`, `/cuenta`, `/avisos`, `/pronto` y `/admin` (como admin `aal2`), en claro y en oscuro (`page.emulateMedia({ colorScheme: "dark" })`), con `expectNoAxeViolations`. Si una página falla, se arregla la página, nunca la prueba.
- `keyboard.spec.ts` — Tab desde el inicio de `/hoy`; formulario de recordatorio completo solo con teclado.
- `p1-flows.spec.ts` — un día completo y la prueba de 320 px.

Archivos que crea o modifica:
- `app/tests/e2e/a11y.spec.ts`
- `app/tests/e2e/keyboard.spec.ts`
- `app/tests/e2e/p1-flows.spec.ts`

**Done when**
- [ ] WHEN `tests/e2e/a11y.spec.ts` visits every page in its list in light and in dark color schemes THE SYSTEM SHALL report 0 axe violations for the tags wcag2a, wcag2aa, wcag21a, wcag21aa and wcag22aa.
- [ ] WHEN `tests/e2e/keyboard.spec.ts` presses Tab from the top of `/hoy` THE SYSTEM SHALL first focus the link "Saltar al contenido" and then reach the "Hecho" button of the first item, with a computed `outline-style` other than `none` on the focused element.
- [ ] WHEN the reminder form is completed with the keyboard alone THE SYSTEM SHALL create the reminder.
- [ ] WHEN `tests/e2e/p1-flows.spec.ts` opens `/hoy`, `/recordatorios/editar` and `/bitacora` at a 320 px wide viewport THE SYSTEM SHALL have `document.documentElement.scrollWidth` no greater than 320.
- [ ] WHEN the full P1 day runs (create a reminder, see it on `/hoy`, mark it done, write the journal, answer the check-in, open the weekly report) THE SYSTEM SHALL show the item as done on `/hoy` and counted on `/informes?periodo=semana`.

**Verify**
```bash
pnpm -C app test:e2e tests/e2e/a11y.spec.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/keyboard.spec.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/p1-flows.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 46: e2e-p1-accesibilidad"
git tag step-46-e2e-p1-accesibilidad
# si el paso 47 sale mal: git reset --hard step-46-e2e-p1-accesibilidad
```

---

#### Step 47 — Documentar la evidencia de la lista de seguridad (6.2)

Épica `06-seguridad-y-calidad` · tarea `E6-T5` · prioridad `p0` · depende de: paso 46

**Do**

- `checklist-6.2.md` — tabla `| # | Requisito | Estado | Evidencia |` con los 30 puntos de la sección 6.2 del brief. `Estado` ∈ `Cumple`, `Lista de lanzamiento`. `Evidencia` nombra entre comillas invertidas una ruta del repo que existe (prueba, migración, config, workflow) o dice "Lista de lanzamiento: <ítem>" para lo que solo se puede comprobar en producción (ZAP, advisors de Supabase, tope de gasto, respaldo restaurado). La tabla "Evidencia de la sección 6.2" de esta épica da la ruta de cada punto.
- `asvs-checklist.md` — tabla `| Requisito ASVS 5.0 | Nivel | Estado | Evidencia |`, `Estado` ∈ `Cumple`, `No aplica`, `Pendiente`; cubre al menos los capítulos de autenticación, sesión, control de acceso, validación, criptografía almacenada, manejo de errores, protección de datos y configuración.
- `owasp-top10.md` — una sección `## A01` … `## A10` (edición vigente `[VERIFICAR edición]`) con la prueba o el control que la cubre.
- `iso27001-anexo-a.md` — tabla `| Control | Aplica | Cómo se cumple | Evidencia |`.
- `docs-seguridad.test.ts` — verifica que cada ruta citada exista (`fs.existsSync` desde la raíz del repo).

Archivos que crea o modifica:
- `docs/seguridad/checklist-6.2.md`
- `docs/seguridad/asvs-checklist.md`
- `docs/seguridad/owasp-top10.md`
- `docs/seguridad/iso27001-anexo-a.md`
- `app/tests/unit/docs-seguridad.test.ts`

**Done when**
- [ ] WHEN `tests/unit/docs-seguridad.test.ts` reads `docs/seguridad/checklist-6.2.md` THE SYSTEM SHALL find each item number from 1 to 30 exactly once, each with a non-empty `Evidencia` cell that names an existing repository path or starts with "Lista de lanzamiento:".
- [ ] WHEN it reads `docs/seguridad/asvs-checklist.md` THE SYSTEM SHALL find every row's status in `Cumple`, `No aplica` or `Pendiente`, and every `Cumple` row with non-empty evidence.
- [ ] WHEN it reads `docs/seguridad/owasp-top10.md` THE SYSTEM SHALL find the headings `## A01` to `## A10`, each followed by at least one existing repository path.
- [ ] WHEN it reads `docs/seguridad/iso27001-anexo-a.md` THE SYSTEM SHALL find the header `| Control | Aplica | Cómo se cumple | Evidencia |` and at least one data row.

**Verify**
```bash
pnpm -C app test tests/unit/docs-seguridad.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 47: evidencia-seguridad"
git tag step-47-evidencia-seguridad
# si el paso 48 sale mal: git reset --hard step-47-evidencia-seguridad
```

---

#### Step 48 — Escribir el modelo de amenazas y la privacidad

Épica `06-seguridad-y-calidad` · tarea `E6-T6` · prioridad `p1` · depende de: paso 47

**Do**

- `modelo-amenazas.md` — tabla STRIDE `| Activo | Amenaza | Categoría STRIDE | Control | Evidencia |` que cubre al menos: sesiones, bitácora y medicamentos (datos sensibles), enlace de la persona cuidada, botón de emergencia, rutas de cron, panel de administración y respaldos.
- `plan-incidentes.md` — `## Detección`, `## Contención`, `## Notificación` (a las personas afectadas y a la autoridad según la Ley 21.719, plazos `[VERIFICAR]`), `## Recuperación`, `## Lecciones`; responsable: el fundador, `hola@solecuida.com`.
- `docs/legal/registro-actividades.md` — por cada tratamiento: finalidad, base de licitud, categorías de datos, destinatarios (Supabase, Vercel, Sentry, Resend, Cloudflare; Zoho solo para el correo `hola@`), transferencia internacional (país `[VERIFICAR]`), plazo de conservación (borrado a pedido con 7 días de gracia; 12 meses de inactividad con aviso previo).
- `docs/legal/eipd.md` — evaluación de impacto simplificada: `| Riesgo | Probabilidad | Impacto | Medida |`.
- `docs-seguridad.test.ts` — agrega estas comprobaciones.

Archivos que crea o modifica:
- `docs/seguridad/modelo-amenazas.md`
- `docs/seguridad/plan-incidentes.md`
- `docs/legal/registro-actividades.md`
- `docs/legal/eipd.md`
- `app/tests/unit/docs-seguridad.test.ts`

**Done when**
- [ ] WHEN `tests/unit/docs-seguridad.test.ts` reads `docs/seguridad/modelo-amenazas.md` THE SYSTEM SHALL find rows for the assets sesiones, bitácora, medicamentos, enlace de la persona cuidada, botón de emergencia, cron, panel de administración and respaldos.
- [ ] WHEN it reads `docs/seguridad/plan-incidentes.md` THE SYSTEM SHALL find the headings `## Detección`, `## Contención`, `## Notificación`, `## Recuperación` and `## Lecciones`.
- [ ] WHEN it reads `docs/legal/registro-actividades.md` THE SYSTEM SHALL find Supabase, Vercel, Sentry, Resend and Cloudflare as recipients and the words "transferencia internacional".
- [ ] WHEN it reads `docs/legal/eipd.md` THE SYSTEM SHALL find the header `| Riesgo | Probabilidad | Impacto | Medida |`.

**Verify**
```bash
pnpm -C app test tests/unit/docs-seguridad.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 48: amenazas-y-privacidad"
git tag step-48-amenazas-y-privacidad
# si el paso 49 sale mal: git reset --hard step-48-amenazas-y-privacidad
```

---

#### Step 49 — Borrar cuentas vencidas y avisar inactividad cada día

Épica `07-despliegue` · tarea `E7-T1` · prioridad `p0` · depende de: paso 33, paso 21

**Do**

- `app/src/server/email/resend.ts` — `type Mailer = (msg: { to, subject, text }) => Promise<{ sent: boolean }>`; `resendMailer()` hace `POST https://api.resend.com/emails` con `Authorization: Bearer RESEND_API_KEY` y `from: EMAIL_FROM` (`Sole <avisos@notificaciones.solecuida.com>`); sin `RESEND_API_KEY` devuelve `{ sent: false }`. Nunca Zoho.
- `app/src/server/jobs/daily.ts` — `runDaily({ admin, now, mailer })` con el bloqueo `daily`: (1) `purge_user` para perfiles con `deletion_requested_at` de hace 7 días o más; (2) aviso de inactividad a quien lleva 11 meses sin actividad y no fue avisada (correo de `auth.admin.getUserById`; asunto "Tu cuenta de Sole se borrará en 30 días"; texto con cómo evitarlo: entrar una vez; se marca `inactivity_notice_sent_at` solo si `sent: true`); (3) `purge_user` a quien lleva 12 meses inactiva **y** fue avisada hace 30 días o más; (4) `cleanup_rate_limits`. Devuelve conteos.
- `app/src/app/api/cron/daily/route.ts` — igual que el de dispatch (`POST`, `x-cron-secret`, 401 sin él) llamando a `runDaily` con `resendMailer()`.

Archivos que crea o modifica:
- `app/src/server/email/resend.ts`
- `app/src/server/jobs/daily.ts`
- `app/src/app/api/cron/daily/route.ts`
- `app/tests/db/daily-jobs.test.ts`

**Done when**
- [ ] WHEN `runDaily` runs 8 days after a deletion request THE SYSTEM SHALL remove the auth user and every row of that user in `profiles`, `circles`, `reminders`, `reminder_occurrences`, `journal_entries`, `selfcare_checkins`, `push_subscriptions` and `events`.
- [ ] WHEN it runs 6 days after the request THE SYSTEM SHALL delete nothing for that user.
- [ ] WHEN a user has been inactive for 11 months THE SYSTEM SHALL send one notice through the injected mailer with the subject "Tu cuenta de Sole se borrará en 30 días" and set `inactivity_notice_sent_at`, and a second run SHALL send no other notice.
- [ ] WHEN a user has been inactive for 12 months and was notified at least 30 days earlier THE SYSTEM SHALL purge the account, and without a prior notice SHALL not.
- [ ] WHEN `POST /api/cron/daily` arrives without the correct `x-cron-secret` THE SYSTEM SHALL return 401.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/daily-jobs.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 49: trabajos-diarios"
git tag step-49-trabajos-diarios
# si el paso 50 sale mal: git reset --hard step-49-trabajos-diarios
```

---

#### Step 50 — Preparar Vercel y la salud con base de datos

Épica `07-despliegue` · tarea `E7-T2` · prioridad `p0` · depende de: paso 49, paso 46

**Do**

- `app/vercel.json` — `{"$schema": "https://openapi.vercel.sh/vercel.json", "framework": "nextjs", "regions": ["gru1"], "installCommand": "pnpm install --frozen-lockfile", "buildCommand": "pnpm build", "ignoreCommand": "[ \"$VERCEL_GIT_COMMIT_REF\" != \"main\" ]"}`. `ignoreCommand` sale con 0 (se omite el build) en toda rama que no sea `main`: sin despliegues de vista previa.
- `app/src/app/robots.ts` — `allow: "/$"`, `disallow: "/"`, `sitemap: <APP_URL>/sitemap.xml`: solo se indexa la portada de la app.
- `app/src/app/sitemap.ts` — solo `<APP_URL>/`.
- `app/src/app/api/health/route.ts` — agrega el chequeo de base: con el cliente admin, `select id` de `organizations` con `head: true` (también mantiene vivo el proyecto gratuito). OK → `{ ok: true, data: { status: "ok", db: "ok", time } }`; falla o tarda más de 3 s → 503 `{ ok: false, error: { code: "db_unavailable" } }`.

Archivos que crea o modifica:
- `app/vercel.json`
- `app/src/app/robots.ts`
- `app/src/app/sitemap.ts`
- `app/src/app/api/health/route.ts`
- `app/tests/unit/deploy-config.test.ts`

**Done when**
- [ ] WHEN `tests/unit/deploy-config.test.ts` reads `app/vercel.json` THE SYSTEM SHALL find `regions` equal to `["gru1"]`, `buildCommand` equal to `pnpm build` and an `ignoreCommand` that compares `VERCEL_GIT_COMMIT_REF` with `main`.
- [ ] WHEN the test calls the default exports of `robots.ts` and `sitemap.ts` THE SYSTEM SHALL return a robots rule that allows only `/$` and disallows `/`, and a sitemap with only the home URL built from `APP_URL`.
- [ ] WHEN `GET /api/health` runs with the local database up THE SYSTEM SHALL return 200 with `data.db = "ok"`, and with `SUPABASE_URL` pointing to `http://127.0.0.1:9` SHALL return 503 with code `db_unavailable`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/deploy-config.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/unit/env-health.test.ts  # expect: exit 0 — la prueba del primer paso sigue pasando
```

**Checkpoint**
```bash
git add -A && git commit -m "step 50: vercel-config"
git tag step-50-vercel-config
# si el paso 51 sale mal: git reset --hard step-50-vercel-config
```

---

#### Step 51 — Programar respaldos cifrados, keep-alive y escaneos

Épica `07-despliegue` · tarea `E7-T3` · prioridad `p0` · depende de: paso 50, paso 3

**Do**

- `backup.yml` — `schedule` diario (`30 6 * * *`, UTC) y `workflow_dispatch`. Pasos: `npx --yes supabase@2.122.1 db dump --db-url "$SUPABASE_DB_URL" -f schema.sql`, lo mismo con `--data-only -f data.sql` y `--role-only -f roles.sql`; `sudo apt-get install -y age`; `tar czf` de los tres y `age -r "$AGE_PUBLIC_KEY"` hacia `backup-<fecha>.tgz.age`; borra los `.sql` y el `.tgz` sin cifrar; sube solo el `.age` con `actions/upload-artifact` y `retention-days: 7`. Secretos del repo: `SUPABASE_DB_URL` (conexión de producción) y `AGE_PUBLIC_KEY` (la clave privada la guarda el fundador fuera de línea).
- `keepalive.yml` — `schedule` diario (`0 12 * * *`) que hace `curl -fsS` a `https://app.solecuida.com/api/health` (la ruta toca la base, así Supabase no pausa el proyecto).
- `codeql.yml` — CodeQL para `javascript-typescript`, solo si el repositorio es público (`if: github.event.repository.private == false`; en privado CodeQL es de pago y Semgrep en `ci.yml` cubre el análisis estático).
- `zap.yml` — `workflow_dispatch` con `target` por defecto `https://app.solecuida.com`, acción oficial de OWASP ZAP baseline.
- Todas las acciones con etiqueta de versión mayor y permisos mínimos.

Archivos que crea o modifica:
- `.github/workflows/backup.yml`
- `.github/workflows/keepalive.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/zap.yml`
- `app/tests/unit/workflows.test.ts`

**Done when**
- [ ] WHEN `tests/unit/workflows.test.ts` reads `.github/workflows/backup.yml` THE SYSTEM SHALL find a daily `schedule`, `supabase@2.122.1 db dump` for schema, data and roles, encryption with `age -r` before the upload step, `retention-days: 7`, and no upload of a `.sql` or unencrypted `.tgz` file.
- [ ] WHEN it reads `.github/workflows/keepalive.yml` THE SYSTEM SHALL find a daily `schedule` requesting `https://app.solecuida.com/api/health`.
- [ ] WHEN it reads `.github/workflows/codeql.yml` and `.github/workflows/zap.yml` THE SYSTEM SHALL find CodeQL for `javascript-typescript` and the ZAP baseline action targeting `https://app.solecuida.com` on `workflow_dispatch`.
- [ ] WHEN it scans every file in `.github/workflows` THE SYSTEM SHALL find secrets only as `secrets.` references and every `uses:` pinned to a version tag or commit SHA.

**Verify**
```bash
pnpm -C app test tests/unit/workflows.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 51: respaldos-keepalive"
git tag step-51-respaldos-keepalive
# si el paso 52 sale mal: git reset --hard step-51-respaldos-keepalive
```

---

#### Step 52 — Escribir el manual del fundador y rotar la clave de cifrado

Épica `07-despliegue` · tarea `E7-T4` · prioridad `p0` · depende de: paso 51

**Do**

- `app/scripts/rotate-field-key.ts` — exporta `rotateAll(admin, { dryRun })` y, si se ejecuta directo, llama a `loadLocalEnv()` y procesa `--dry-run`. Recorre `reminders` (`med_name_enc`, `med_instructions_enc`), `journal_entries` (`note_enc`) y `contacts` (`notes_enc`); todo valor cuya versión no sea la actual se descifra con `FIELD_ENCRYPTION_KEY_PREVIOUS` y se vuelve a cifrar con `FIELD_ENCRYPTION_KEY` (mismo contexto). Imprime conteos por tabla.
- `docs/mantenimiento.md` — manual en español claro, con comandos copiables: `## Desplegar`, `## Respaldar y restaurar`, `## Simulacro de restauración` (descargar el artefacto, `age -d -i clave.txt`, restaurar en el Supabase local con `pnpm -C app db:reset` y `psql` sobre `roles.sql`, `schema.sql`, `data.sql`, y verificar conteos; hacerlo al menos una vez), `## Rotar claves` (FIELD_ENCRYPTION_KEY con el script, CRON_SECRET en Vercel y en Vault, VAPID, claves de Supabase, Resend), `## Revisar errores` (Sentry y `/admin/comentarios`), `## Agregar una organización`, `## Dar acceso de admin` (SQL manual: `update public.profiles set is_admin = true where id = '<uuid>';`), `## Secretos en Vault` (`select vault.create_secret('https://app.solecuida.com', 'app_base_url');` y lo mismo con `cron_secret`), `## Si Supabase pausa el proyecto`.

Archivos que crea o modifica:
- `docs/mantenimiento.md`
- `app/scripts/rotate-field-key.ts`
- `app/tests/db/rotate-field-key.test.ts`
- `app/tests/unit/docs-mantenimiento.test.ts`

**Done when**
- [ ] WHEN `rotateAll` runs after `FIELD_ENCRYPTION_KEY` moves to version 2 with the old key in `FIELD_ENCRYPTION_KEY_PREVIOUS` THE SYSTEM SHALL rewrite every `v1.` value in `reminders`, `journal_entries` and `contacts` as `v2.`, and each value SHALL decrypt to its original text.
- [ ] WHEN it runs with `dryRun: true` THE SYSTEM SHALL report the counts and change no row.
- [ ] WHEN `tests/unit/docs-mantenimiento.test.ts` reads `docs/mantenimiento.md` THE SYSTEM SHALL find the headings `## Desplegar`, `## Respaldar y restaurar`, `## Simulacro de restauración`, `## Rotar claves`, `## Revisar errores`, `## Agregar una organización`, `## Dar acceso de admin`, `## Secretos en Vault` and `## Si Supabase pausa el proyecto`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/rotate-field-key.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/unit/docs-mantenimiento.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 52: manual-mantenimiento"
git tag step-52-manual-mantenimiento
# si el paso 53 sale mal: git reset --hard step-52-manual-mantenimiento
```

---

#### Step 53 — Cerrar variables de entorno y la lista de lanzamiento

Épica `07-despliegue` · tarea `E7-T5` · prioridad `p0` · depende de: paso 52

**Do**

- `app/tests/unit/env-example.test.ts` — busca `process.env.X` y `requireEnv("X")`/`readEnv("X")` en `src/`, `scripts/`, `next.config.ts`, `vitest.config.ts` y `playwright.config.ts`.
- `app/.env.example` — agrega cualquier variable que falte según esa prueba (sin valores reales).
- `docs/lanzamiento.md` — la lista de lanzamiento de §20.1 del plano, en orden y con casillas: `## Cuentas y dominios`, `## Variables en Vercel`, `## Supabase de producción` (región São Paulo, migraciones con `supabase db push`, secretos de Vault, SMTP de Resend, captcha Turnstile, URL del sitio y redirecciones, plantilla del enlace mágico, MFA del admin, advisors sin hallazgos críticos), `## Correo` (Resend + SPF/DKIM en `notificaciones.solecuida.com`; nunca Zoho), `## Antes de abrir al público` (ZAP, Lighthouse, prueba en Android y en iPhone instalado, 131/SAMU y recursos verificados, simulacro de restauración).
- `PENDIENTES.md` — actualizado con lo que quede.

Archivos que crea o modifica:
- `docs/lanzamiento.md`
- `app/.env.example`
- `app/tests/unit/env-example.test.ts`
- `PENDIENTES.md`

**Done when**
- [ ] WHEN `tests/unit/env-example.test.ts` scans the source for environment variable reads THE SYSTEM SHALL find every variable as a key in `app/.env.example`, except `NODE_ENV`, `CI` and `NEXT_RUNTIME`.
- [ ] WHEN the same test reads `app/.env.example` THE SYSTEM SHALL find every value empty or local (`http://localhost`, `mailto:`).
- [ ] WHEN `docs/lanzamiento.md` is read THE SYSTEM SHALL contain the headings `## Cuentas y dominios`, `## Variables en Vercel`, `## Supabase de producción`, `## Correo` and `## Antes de abrir al público`.

**Verify**
```bash
pnpm -C app test tests/unit/env-example.test.ts  # expect: exit 0, 0 failed
grep -q "## Cuentas y dominios" docs/lanzamiento.md  # expect: exit 0
grep -q "## Variables en Vercel" docs/lanzamiento.md  # expect: exit 0
grep -q "## Supabase de producción" docs/lanzamiento.md  # expect: exit 0
grep -q "## Correo" docs/lanzamiento.md  # expect: exit 0
grep -q "## Antes de abrir al público" docs/lanzamiento.md  # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 53: checklist-lanzamiento"
git tag step-53-checklist-lanzamiento
# si el paso 54 sale mal: git reset --hard step-53-checklist-lanzamiento
```

---

#### Step 54 — Agregar tareas sin fecha y pasarlas a hoy (F5)

Épica `08-ampliacion` · tarea `E8-T1` · prioridad `p1` · depende de: paso 53

**Do**

- `app/src/server/tasks/tasks.ts` — `addTask`, `moveToToday` (pone `scheduled_for` = hoy en `America/Santiago`), `completeTask` (pone `done_at` y `done_by`), `removeTask`, `listTasks`; `helpLinkFor(taskId, familyEnabled = FAMILY_ENABLED)` → `/pronto/invitar-familiar` si `familyEnabled` es `false`, si no `/circulo?pedir=<taskId>` (la prueba pasa el valor explícito, así paso 66 (`familiares-invitaciones`) puede cambiar la constante sin romperla).
- `tareas/page.tsx` — "Para hoy", "Sin fecha" y "Hechas"; campo rápido "Agregar tarea".
- `task-item.tsx` (cliente) — "Pasar a hoy", "Hecha" y "Pedir ayuda con esto".
- `app/src/server/today/today.ts` — `getToday` también trae las tareas con `scheduled_for` = hoy dentro del grupo `whenever`.

Archivos que crea o modifica:
- `app/src/server/tasks/tasks.ts`
- `app/src/app/(app)/tareas/page.tsx`
- `app/src/components/tasks/task-item.tsx`
- `app/src/server/today/today.ts`
- `app/tests/db/tasks.test.ts`

**Done when**
- [ ] WHEN a caregiver adds the task "Comprar pañales" THE SYSTEM SHALL list it under "Sin fecha".
- [ ] WHEN `moveToToday` runs on it THE SYSTEM SHALL set `scheduled_for` to today in `America/Santiago`, and `getToday` SHALL include it in the `whenever` group.
- [ ] WHEN the caregiver completes it THE SYSTEM SHALL set `done_at` and `done_by`.
- [ ] WHEN a `family` member calls `addTask` THE SYSTEM SHALL return `{ ok: false, error: { code: "forbidden" } }`.
- [ ] WHEN `helpLinkFor(taskId, false)` and `helpLinkFor(taskId, true)` run THE SYSTEM SHALL return `/pronto/invitar-familiar` and `/circulo?pedir=<taskId>` respectively.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/tasks.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/db/today.test.ts  # expect: exit 0 — "Hoy" sigue cumpliendo su contrato
```

**Checkpoint**
```bash
git add -A && git commit -m "step 54: tareas-f5"
git tag step-54-tareas-f5
# si el paso 55 sale mal: git reset --hard step-54-tareas-f5
```

---

#### Step 55 — Guardar contactos importantes y el de emergencia (F9)

Épica `08-ampliacion` · tarea `E8-T2` · prioridad `p1` · depende de: paso 53

**Do**

- `app/src/server/contacts/contacts.ts` — CRUD; zod: `name` 1–80, `kind` (`familia|medico|centro_salud|farmacia|transporte|otro`), `phone` `^\+?[0-9 ()-]{6,20}$`, `notes` ≤ 300 cifradas con contexto `"contacts.notes"`, `isEmergency`. `telHref(phone)` deja solo `+` y dígitos. `emergencyContactFor(admin, circleId)` → el contacto de emergencia actualizado más recientemente, o `null`.
- `contactos/page.tsx` — lista con botón "Llamar" (`tel:`), marca "Contacto de emergencia".
- `contact-form.tsx` — sin campos de alergias, diagnósticos ni previsión (regla del brief).

Archivos que crea o modifica:
- `app/src/server/contacts/contacts.ts`
- `app/src/app/(app)/contactos/page.tsx`
- `app/src/components/contacts/contact-form.tsx`
- `app/tests/db/contacts.test.ts`
- `app/tests/e2e/contacts.spec.ts`

**Done when**
- [ ] WHEN a caregiver adds "Dra. Pérez" with kind `medico` and phone `+56 2 2345 6789` THE SYSTEM SHALL list it with a link whose `href` is `tel:+56223456789`.
- [ ] WHEN the phone contains letters THE SYSTEM SHALL return `{ ok: false, error: { code: "validation_failed" } }`.
- [ ] WHEN two contacts are marked as emergency contacts THE SYSTEM SHALL have `emergencyContactFor` return the one updated most recently.
- [ ] WHEN notes are saved THE SYSTEM SHALL store `notes_enc` starting with `v1.`, and the form SHALL contain no field labelled "alergias", "diagnóstico" or "previsión".
- [ ] WHEN axe runs on `/contactos` THE SYSTEM SHALL report 0 violations.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/contacts.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/contacts.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 55: contactos-f9"
git tag step-55-contactos-f9
# si el paso 56 sale mal: git reset --hard step-55-contactos-f9
```

---

#### Step 56 — Crear y revocar el vínculo de la persona cuidada (F12)

Épica `08-ampliacion` · tarea `E8-T3` · prioridad `p1` · depende de: paso 55

**Do**

- `app/src/server/cared-link/links.ts` — `createLink(client, userId, circleId, label)`: token = 32 bytes aleatorios en base64url (43 caracteres), guarda solo `sha256` hex, vence en 90 días; registra `cared_link.created`. `revokeLink`. `resolveLink(admin, token)` → `{ linkId, circleId, caredName }` o `null` si no existe, venció o fue revocado (actualiza `last_used_at`). `visibleToday(admin, circleId, now)` → ocurrencias `main` de hoy de recordatorios con `visible_to_cared = true`. `markDoneFromLink(admin, link, occurrenceId)` → `done`, `done_via = 'cared_link'`, `done_by` nulo; rechaza ocurrencias de otro círculo o de recordatorios no visibles.
- `persona-cuidada/page.tsx` — crear (muestra el enlace `<APP_URL>/v/<token>` una sola vez, con botón copiar), listar y revocar vínculos; explica qué verá la persona.
- `api/v/[token]/listo/route.ts` — `POST { occurrenceId }`; límite `cared_done`; token inválido u ocurrencia no visible → 404.

Archivos que crea o modifica:
- `app/src/server/cared-link/links.ts`
- `app/src/app/(app)/persona-cuidada/page.tsx`
- `app/src/app/api/v/[token]/listo/route.ts`
- `app/tests/db/cared-link.test.ts`

**Done when**
- [ ] WHEN a caregiver creates a link THE SYSTEM SHALL return a token of at least 43 base64url characters, store only its SHA-256 hex in `cared_links.token_hash`, and set `expires_at` 90 days ahead.
- [ ] WHEN `visibleToday` runs for a valid link THE SYSTEM SHALL return only today's occurrences of reminders with `visible_to_cared = true`.
- [ ] WHEN `POST /api/v/<token>/listo` marks a visible occurrence THE SYSTEM SHALL set it `done` with `done_via = 'cared_link'` and `done_by` null, and for an occurrence of a non-visible reminder SHALL answer 404 and change nothing.
- [ ] WHEN the link is revoked or expired THE SYSTEM SHALL have `resolveLink` return null and answer 404 on `/api/v/<token>/listo`.
- [ ] WHEN a `family` member calls `createLink` THE SYSTEM SHALL return `{ ok: false, error: { code: "forbidden" } }`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/cared-link.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 56: vinculo-persona-cuidada"
git tag step-56-vinculo-persona-cuidada
# si el paso 57 sale mal: git reset --hard step-56-vinculo-persona-cuidada
```

---

#### Step 57 — Registrar emergencias y avisar a la cuidadora (F12)

Épica `08-ampliacion` · tarea `E8-T4` · prioridad `p1` · depende de: paso 56

**Do**

- `app/src/server/cared-link/emergency.ts` — `triggerEmergency({ admin, link, sender })`: límite `emergency` por vínculo; inserta `emergency_events`; envía a cada suscripción de las cuidadoras un aviso con `requireInteraction: true` y título "Emergencia: <nombre> pidió ayuda"; devuelve `{ callNumber }` = teléfono del contacto de emergencia (`emergencyContactFor`) o `131` (`[VERIFICAR en fuente oficial]` antes de lanzar).
- `api/v/[token]/emergencia/route.ts` — `POST`; token inválido → 404; límite excedido → 429 `rate_limited`; si no, 200 `{ ok: true, data: { callNumber } }`.

Archivos que crea o modifica:
- `app/src/server/cared-link/emergency.ts`
- `app/src/app/api/v/[token]/emergencia/route.ts`
- `app/tests/db/emergency.test.ts`

**Done when**
- [ ] WHEN `triggerEmergency` runs for a valid link with a fake sender THE SYSTEM SHALL insert one `emergency_events` row, send a notification with `requireInteraction: true` and the title "Emergencia: <nombre> pidió ayuda" to every caregiver subscription, and return the emergency contact's phone or `131` when there is none.
- [ ] WHEN it runs a 4th time within 10 minutes for the same link THE SYSTEM SHALL return `rate_limited` and insert no further row.
- [ ] WHEN `POST /api/v/<token>/emergencia` arrives with an unknown token THE SYSTEM SHALL answer 404 and send nothing.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/emergency.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 57: emergencia-servidor"
git tag step-57-emergencia-servidor
# si el paso 58 sale mal: git reset --hard step-57-emergencia-servidor
```

---

#### Step 58 — Construir la vista grande de la persona cuidada (F12)

Épica `08-ampliacion` · tarea `E8-T5` · prioridad `p1` · depende de: paso 57

**Do**

- `v/[token]/page.tsx` — pública, `robots: noindex`; token inválido → `notFound()`. Letra muy grande (títulos de ítem de al menos 28 px), uno o dos botones por pantalla, "Listo" por ítem (llama a `/api/v/<token>/listo`), y el botón de emergencia. Siempre visible: "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue."
- `emergency-button.tsx` (cliente) — botón grande "Pedir ayuda"; primero pregunta "¿Quieres pedir ayuda ahora?" con "Sí, llamar" y "No"; solo "Sí, llamar" llama a `/api/v/<token>/emergencia` y muestra el enlace `tel:` con el número que devuelve (la llamada es el camino confiable).
- `app/tests/e2e/cared-view.spec.ts` — crea círculo, recordatorio visible y vínculo con el cliente admin.

Archivos que crea o modifica:
- `app/src/app/v/[token]/page.tsx`
- `app/src/components/cared/emergency-button.tsx`
- `app/tests/e2e/cared-view.spec.ts`

**Done when**
- [ ] WHEN `/v/<token>` opens with a valid token THE SYSTEM SHALL list today's visible items, and activating "Listo" on one SHALL show it as done.
- [ ] WHEN the emergency button is pressed THE SYSTEM SHALL first ask "¿Quieres pedir ayuda ahora?" with "Sí, llamar" and "No", and only "Sí, llamar" SHALL reveal a `tel:` link and record the alert.
- [ ] WHEN `/v/<token>` renders THE SYSTEM SHALL show "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue." and each item title with a computed font size of at least 28 px.
- [ ] WHEN `/v/<token>` opens with an unknown token THE SYSTEM SHALL answer 404.
- [ ] WHEN axe runs on `/v/<token>` THE SYSTEM SHALL report 0 violations.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test:e2e tests/e2e/cared-view.spec.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 58: vista-persona-cuidada"
git tag step-58-vista-persona-cuidada
# si el paso 59 sale mal: git reset --hard step-58-vista-persona-cuidada
```

---

#### Step 59 — Crear el informe para el médico, Premium en piloto (F14)

Épica `08-ampliacion` · tarea `E8-T6` · prioridad `p1` · depende de: paso 35, paso 53

**Do**

- `app/src/server/reports/doctor-report.ts` — `buildDoctorReport(rows, month)`: cumplimiento por recordatorio de medicamento, actividades hechas, resumen de la bitácora por calificación del día y la sección vacía "Preguntas de la familia para el control"; usa las frases y la lista de palabras prohibidas de `summary.ts`; sin datos de bienestar.
- `informes/medico/page.tsx` — `?mes=YYYY-MM`; etiqueta "Premium · gratis durante el piloto"; una página A4 (`@page { size: A4; margin: 15mm }`); botón "Imprimir o guardar como PDF"; registra `premium.used` con `feature: "informe_medico"`.
- `docs/negocio/planes.md` — del rol de Monetización: `## Planes`, `## Precios de prueba` (los de la puerta falsa: $2.990, $4.990, $7.990 al mes, solo para medir), `## Qué incluiría la versión con IA`, `## Cómo leer los datos de H4`. No implementa cobros.

Archivos que crea o modifica:
- `app/src/server/reports/doctor-report.ts`
- `app/src/app/(app)/informes/medico/page.tsx`
- `app/tests/unit/doctor-report.test.ts`
- `app/tests/e2e/doctor-report.spec.ts`
- `docs/negocio/planes.md`

**Done when**
- [ ] WHEN `buildDoctorReport` runs for a month THE SYSTEM SHALL return compliance per medication reminder, activities done, the journal summary by day rating and an empty section titled "Preguntas de la familia para el control".
- [ ] WHEN it runs THE SYSTEM SHALL include no self-care value and none of the words `diagnóstico`, `deterioro`, `empeora` or `síntoma`.
- [ ] WHEN `/informes/medico?mes=2027-03` opens THE SYSTEM SHALL show "Premium · gratis durante el piloto" and the button "Imprimir o guardar como PDF", and SHALL store one `premium.used` event with `feature = "informe_medico"` for a user with research consent.
- [ ] WHEN `docs/negocio/planes.md` is read THE SYSTEM SHALL contain the headings `## Planes`, `## Precios de prueba`, `## Qué incluiría la versión con IA` and `## Cómo leer los datos de H4`.
- [ ] WHEN axe runs on `/informes/medico` THE SYSTEM SHALL report 0 violations.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/doctor-report.test.ts  # expect: exit 0, 0 failed
pnpm -C app test:e2e tests/e2e/doctor-report.spec.ts  # expect: exit 0, 0 failed
grep -q "## Precios de prueba" docs/negocio/planes.md  # expect: exit 0
grep -q "## Cómo leer los datos de H4" docs/negocio/planes.md  # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 59: informe-medico-f14"
git tag step-59-informe-medico-f14
# si el paso 60 sale mal: git reset --hard step-59-informe-medico-f14
```

---

#### Step 60 — Preparar la web: CTA fija, compartir, favicon y pruebas

Épica `09-fuera-de-la-app` · tarea `E9-T1` · prioridad `p1` · depende de: paso 53

**Do**

La web sigue siendo estática y conserva su diseño de carta (reglas de `web/README.md`: la tía Sole está viva, `--tinta-tenue` ≥ 4.5:1, sin botón de WhatsApp).
- `web/favicon.svg` — el logo de la web (cuadrado redondeado `#9c5b34` con "S" `#faf6ef`), el mismo que hoy va en línea como data URI.
- `web/assets/compartir.js` — botón "Compartir": `navigator.share({ title, url })` o, si no existe, copia el enlace y avisa "Enlace copiado" en una región `aria-live`.
- `web/assets/estilo.css` — `.cta-principal` (botón "Probar Sole"), que en pantallas de menos de 40rem queda fija abajo sin tapar el foco; `.compartir`; pie `data-pie="v2"`. Mantiene los contrastes que exige `web/README.md`.
- `app/tests/unit/web-site.test.ts` — lee `../web/*.html` sin dependencias (expresiones regulares): título único por página; meta descripción única en toda página salvo `404.html`; un solo `<h1>` distinto del título; todo `href` y `src` interno existe en `web/` (excepto `/_vercel/insights/script.js`, que existe solo en Vercel, y `assets/retrato.jpg`, opcional por diseño); ningún enlace a `wa.me`, `api.whatsapp.com` ni `whatsapp:`; ninguna aparición de "en memoria" en `web/` ni en `app/src`; ningún `LocalBusiness`; `sitemap.xml` lista toda página salvo `404.html` y las que llevan `<meta name="robots" content="noindex">` (y toda URL del sitemap existe); toda página con `data-pie="v2"` enlaza `privacidad.html`, `terminos.html`, `cookies.html` y `/favicon.svg`.

Archivos que crea o modifica:
- `web/assets/compartir.js`
- `web/assets/estilo.css`
- `web/favicon.svg`
- `app/tests/unit/web-site.test.ts`

**Done when**
- [ ] WHEN `tests/unit/web-site.test.ts` runs THE SYSTEM SHALL find a unique `<title>` on every page of `web/`, a unique meta description on every page except `404.html`, and exactly one `<h1>` per page whose text differs from the title.
- [ ] WHEN it checks links THE SYSTEM SHALL resolve every internal `href` and `src` to a file under `web/`, except `/_vercel/insights/script.js` and `assets/retrato.jpg`.
- [ ] WHEN it scans `web/` and `app/src` THE SYSTEM SHALL find no link to `wa.me`, `api.whatsapp.com` or `whatsapp:`, no "en memoria" and no `LocalBusiness`.
- [ ] WHEN it reads `web/sitemap.xml` THE SYSTEM SHALL find every page except `404.html` and pages marked `noindex`, and every URL it lists SHALL exist under `web/`.
- [ ] WHEN a page carries `data-pie="v2"` THE SYSTEM SHALL find in it links to `privacidad.html`, `terminos.html` and `cookies.html` and `<link rel="icon" href="/favicon.svg">`.

**Verify**
```bash
pnpm -C app test tests/unit/web-site.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 60: web-base"
git tag step-60-web-base
# si el paso 61 sale mal: git reset --hard step-60-web-base
```

---

#### Step 61 — Publicar privacidad, términos, cookies y llms.txt

Épica `09-fuera-de-la-app` · tarea `E9-T2` · prioridad `p1` · depende de: paso 60

**Do**

Voz de la carta, español de Chile, sin jerga legal. Responsable: José Carrillo García (persona natural), `hola@solecuida.com`.
- `privacidad.html` — agrega la app: qué datos se recogen y para qué (sección 4 del brief), datos sensibles cifrados, consentimiento de investigación aparte, borrado con 7 días de gracia, 12 meses de inactividad con aviso, inventario de terceros con país (`[VERIFICAR]`): Supabase, Vercel, Sentry, Resend, Cloudflare, Zoho (solo correo `hola@`). Pie `data-pie="v2"`.
- `terminos.html` — servicio gratuito, sin cobros (sin política de reembolsos hasta que exista un cobro), mayores de 18, la cuidadora declara autorización o actuar en interés de la persona cuidada, Sole no reemplaza servicios de emergencia ni consejo médico, lo compartido fuera de Sole es responsabilidad de quien lo comparte.
- `cookies.html` — solo cookies esenciales (sesión de la app); por eso no hay banner; si algún día hay cookies no esenciales, se podrán rechazar con la misma facilidad.
- `llms.txt` — `# Sole`, resumen de una línea, `## Qué es`, `## Para quién`, `## Cómo probarla`, `## Privacidad`, `## Contacto`.
- `404.html` — pie `data-pie="v2"` y favicon nuevo.
- `terminos.html` y `cookies.html` nacen con `<meta name="robots" content="noindex">`; paso 62 (`web-relato`) les quita esa marca al sumarlas a `sitemap.xml`.

Archivos que crea o modifica:
- `web/privacidad.html`
- `web/terminos.html`
- `web/cookies.html`
- `web/llms.txt`
- `web/404.html`

**Done when**
- [ ] WHEN `tests/unit/web-site.test.ts` runs THE SYSTEM SHALL pass on `privacidad.html`, `terminos.html`, `cookies.html` and `404.html`, each carrying `data-pie="v2"` with links to the three legal pages and the favicon.
- [ ] WHEN `web/privacidad.html` is read THE SYSTEM SHALL name Supabase, Vercel, Sentry, Resend, Cloudflare and Zoho with what each receives and in which country.
- [ ] WHEN `web/terminos.html` is read THE SYSTEM SHALL state that the service is free, that users must be 18 or older, and that "Sole no reemplaza a un servicio de emergencia".
- [ ] WHEN `web/llms.txt` is read THE SYSTEM SHALL start with `# Sole` and contain the headings `## Qué es`, `## Para quién`, `## Cómo probarla`, `## Privacidad` and `## Contacto`.

**Verify**
```bash
pnpm -C app test tests/unit/web-site.test.ts  # expect: exit 0, 0 failed
grep -q "Sole no reemplaza a un servicio de emergencia" web/terminos.html  # expect: exit 0
grep -q "Resend" web/privacidad.html  # expect: exit 0
grep -q "## Cómo probarla" web/llms.txt  # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 61: web-legal"
git tag step-61-web-legal
# si el paso 62 sale mal: git reset --hard step-61-web-legal
```

---

#### Step 62 — Cambiar el relato de la web y explicar cómo probar Sole

Épica `09-fuera-de-la-app` · tarea `E9-T3` · prioridad `p1` · depende de: paso 61

**Do**

- `index.html` — el retrato pasa a `assets/retrato.webp` (WebP comprimido, opcional como hoy: si no existe, `onerror` lo quita). El relato cambia de "voy a validar con entrevistas" a "este es el mismo contexto; decidí construir esto y ahora lo estoy probando con personas reales". La tía Sole sigue presentándose viva. Resumen breve al inicio; una sola CTA "Probar Sole" (hacia `probar.html`) después del primer párrafo, fija en el celular; JSON-LD `Organization` y `WebSite`; el `<img>` del retrato con `width` y `height`; pie `data-pie="v2"`, favicon y botón compartir.
- `probar.html` (nueva) — qué es la app, cómo instalarla (Android con Chrome; iPhone con Safari y avisos desde iOS 16.4), qué datos se recogen y para qué, preguntas frecuentes con JSON-LD `FAQPage`; la CTA lleva a `https://app.solecuida.com/`.
- `organizaciones.html` — sección "Sumarse al piloto": qué se pide, qué reciben (panel con datos agregados e informe de cierre de cohorte), su enlace con código. Sin logos ni nombres de organizaciones sin permiso escrito.
- `sitemap.xml` — agrega `probar.html`, `terminos.html` y `cookies.html` con `lastmod` de hoy; `terminos.html` y `cookies.html` pierden el `noindex`.
- `web-site.test.ts` — agrega: `index.html` con JSON-LD `Organization` y `WebSite`; `probar.html` con `FAQPage`; todo `<img>` con `alt`, `width` y `height` y con `src` en `.webp`, `.avif` o `.svg` (brief §8.1, punto 6; la excepción de existencia pasa de `assets/retrato.jpg` a `assets/retrato.webp`); todo `.png`/`.jpg`/`.jpeg` que exista en `web/` además de `assets/portada-social.png` (imagen para redes, la piden en PNG) pesa menos de 200 KB; cada página con CTA tiene exactamente un elemento `.cta-principal`.

Archivos que crea o modifica:
- `web/index.html`
- `web/probar.html`
- `web/organizaciones.html`
- `web/sitemap.xml`
- `app/tests/unit/web-site.test.ts`

**Done when**
- [ ] WHEN `tests/unit/web-site.test.ts` runs THE SYSTEM SHALL find JSON-LD `Organization` and `WebSite` in `index.html` and `FAQPage` in `probar.html`, and no `LocalBusiness` anywhere.
- [ ] WHEN it checks images THE SYSTEM SHALL find `alt`, `width` and `height` on every `<img>` of `web/`, every `<img>` `src` ending in `.webp`, `.avif` or `.svg`, and no raster file in `web/` other than `assets/portada-social.png` larger than 200 KB.
- [ ] WHEN it checks calls to action THE SYSTEM SHALL find at most one `.cta-principal` per page and exactly one on `index.html` and `probar.html`.
- [ ] WHEN it reads `web/sitemap.xml` THE SYSTEM SHALL list `probar.html`, `terminos.html` and `cookies.html` along with the earlier pages.

**Verify**
```bash
pnpm -C app test tests/unit/web-site.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 62: web-relato"
git tag step-62-web-relato
# si el paso 63 sale mal: git reset --hard step-62-web-relato
```

---

#### Step 63 — Proteger el formulario de la web con Turnstile vía la app

Épica `09-fuera-de-la-app` · tarea `E9-T4` · prioridad `p1` · depende de: paso 62, paso 43

**Do**

El formulario deja de escribir directo en el proyecto `sole-web`: pasa por la app, que verifica Turnstile y reenvía. La política de inserción anónima de `contactos` se retira después, a mano, desde la lista de lanzamiento.
- `app/src/app/api/web/contact/route.ts` — `OPTIONS` y `POST`. CORS solo para los orígenes de `WEB_ALLOWED_ORIGINS` (por defecto `https://solecuida.com,https://www.solecuida.com`); otro origen → 403 sin `access-control-allow-origin`. `POST`: campo trampa lleno o envío en menos de 3 s → 200 `{ ok: true }` sin guardar nada; límite `web_contact` por hash de IP; si existe `TURNSTILE_SECRET_KEY`, verifica el token en `https://challenges.cloudflare.com/turnstile/v0/siteverify` (falla → 400 `captcha_failed`); sin `WEB_CONTACT_SUPABASE_URL` o `WEB_CONTACT_SUPABASE_SECRET_KEY` → 503 `unavailable`; si no, inserta en `contactos` del proyecto `sole-web` con su clave secreta, con los mismos campos que hoy envía `formulario.js`.
- `web/assets/config.js` — `contactEndpoint: "https://app.solecuida.com/api/web/contact"` y `turnstileSiteKey: ""` (el fundador la completa al lanzar); se quitan `supabaseUrl` y `supabaseKey`.
- `web/assets/formulario.js` — envía al endpoint con el token de Turnstile (render explícito cuando hay `turnstileSiteKey`); mantiene la trampa, la espera de 3 s y los mensajes actuales.
- `web/contacto.html` — script de Turnstile `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`, contenedor del widget, pie `data-pie="v2"`, favicon y botón compartir.
- `web-contact-route.test.ts` — reemplaza `fetch` global con `vi.stubGlobal` para Turnstile y para el insert; el límite usa la base local (cada caso manda una IP distinta en `x-forwarded-for`).

Archivos que crea o modifica:
- `web/contacto.html`
- `web/assets/formulario.js`
- `web/assets/config.js`
- `app/src/app/api/web/contact/route.ts`
- `app/tests/unit/web-contact-route.test.ts`

**Done when**
- [ ] WHEN `OPTIONS /api/web/contact` arrives from `https://solecuida.com` THE SYSTEM SHALL answer 204 with `access-control-allow-origin: https://solecuida.com`, and from `https://evil.example` SHALL answer 403 without that header.
- [ ] WHEN a `POST` arrives with the honeypot filled THE SYSTEM SHALL answer 200 `{ ok: true }` and call neither Turnstile nor the insert.
- [ ] WHEN `TURNSTILE_SECRET_KEY` is set and Turnstile rejects the token THE SYSTEM SHALL answer 400 with code `captcha_failed` and insert nothing.
- [ ] WHEN Turnstile accepts THE SYSTEM SHALL insert one row into `contactos` at `WEB_CONTACT_SUPABASE_URL` and answer 200.
- [ ] WHEN every page of `web/` is checked THE SYSTEM SHALL find `data-pie="v2"` in all of them.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/unit/web-contact-route.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/unit/web-site.test.ts  # expect: exit 0, 0 failed
test -f web/contacto.html  # expect: exit 0 — evita que la línea siguiente pase en vacío
test -z "$(grep -L 'data-pie="v2"' web/*.html)"  # expect: exit 0 — ninguna página sin el pie nuevo
```

**Checkpoint**
```bash
git add -A && git commit -m "step 63: web-contacto"
git tag step-63-web-contacto
# si el paso 64 sale mal: git reset --hard step-63-web-contacto
```

---

#### Step 64 — Redactar las plantillas de correo para organizaciones

Épica `09-fuera-de-la-app` · tarea `E9-T5` · prioridad `p1` · depende de: paso 62

**Do**

Los correos los envía el fundador, nunca los agentes. Voz de la carta de la web; sin cifras ni testimonios inventados; sin prometer que Sole "mejora la salud" o "reduce el estrés".
- Cada plantilla tiene `## Versión breve`, `## Versión completa` y `## Seguimiento`; cada versión con `Asunto:` y el marcador `ENLACE_CON_CODIGO` (se reemplaza por `https://app.solecuida.com/?org=<CODIGO>`).
- `app/scripts/check-alianzas.ts` — `tsx scripts/check-alianzas.ts plantillas|todo` desde `app/`, lee `../alianzas`. `plantillas`: las cuatro plantillas de este paso con sus tres secciones, `Asunto:` y `ENLACE_CON_CODIGO`, sin "mejora la salud", "reduce el estrés" ni "previene". `todo`: además `asociacion-pacientes.md`, `organizaciones.csv`, `seguimiento.csv`, `kit-piloto.md` y `pauta-entrevistas.md` (reglas en paso 65 (`alianzas-kit`)). Sale con 0 o con 1 y la lista de problemas.

Archivos que crea o modifica:
- `app/scripts/check-alianzas.ts`
- `alianzas/plantillas/fundacion.md`
- `alianzas/plantillas/municipio.md`
- `alianzas/plantillas/centro-salud.md`
- `alianzas/plantillas/agrupacion-cuidadoras.md`

**Done when**
- [ ] WHEN `pnpm -C app exec tsx scripts/check-alianzas.ts plantillas` runs THE SYSTEM SHALL exit 0 after finding `fundacion.md`, `municipio.md`, `centro-salud.md` and `agrupacion-cuidadoras.md`, each with the sections `## Versión breve`, `## Versión completa` and `## Seguimiento`, a `Asunto:` line per version and the marker `ENLACE_CON_CODIGO`.
- [ ] WHEN any template contains "mejora la salud", "reduce el estrés" or "previene" THE SYSTEM SHALL make the script exit 1 naming the file.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app exec tsx scripts/check-alianzas.ts plantillas  # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 64: alianzas-plantillas"
git tag step-64-alianzas-plantillas
# si el paso 65 sale mal: git reset --hard step-64-alianzas-plantillas
```

---

#### Step 65 — Armar la lista de organizaciones y el kit de piloto

Épica `09-fuera-de-la-app` · tarea `E9-T6` · prioridad `p1` · depende de: paso 64

**Do**

- `asociacion-pacientes.md` — misma estructura que las otras plantillas.
- `organizaciones.csv` — encabezado exacto `nombre,tipo,poblacion,comuna_o_region,web,contacto_institucional,fuente,fecha_consulta,codigo_org`; al menos 20 organizaciones chilenas relacionadas con el cuidado, investigadas en sus sitios públicos; `tipo` ∈ `fundacion|municipio|centro_salud|agrupacion|asociacion_pacientes|otro`; `fuente` `https://`; `fecha_consulta` `YYYY-MM-DD`; `contacto_institucional` es un formulario `https://` o un correo institucional (nunca de una persona ni de dominios personales como gmail, hotmail, yahoo u outlook); `codigo_org` `^[A-Z0-9-]{3,32}$`. Si un dato no se pudo comprobar, el campo dice `[VERIFICAR]`.
- `seguimiento.csv` — encabezado exacto `codigo_org,fecha_envio,version_plantilla,respuesta,fecha_respuesta,notas`, sin filas (el fundador lo llena).
- `kit-piloto.md` — `## Qué le pedimos a la organización`, `## Qué recibe a cambio` (panel F17 con datos agregados y el informe de cierre de cohorte), `## Acuerdo de piloto` (una página).
- `pauta-entrevistas.md` — pauta de seguimiento cualitativo para usuarias que acepten conversar; integra las columnas de `seguimiento-entrevistas.csv` de la raíz del repo.

Archivos que crea o modifica:
- `alianzas/plantillas/asociacion-pacientes.md`
- `alianzas/organizaciones.csv`
- `alianzas/seguimiento.csv`
- `alianzas/kit-piloto.md`
- `alianzas/pauta-entrevistas.md`

**Done when**
- [ ] WHEN `pnpm -C app exec tsx scripts/check-alianzas.ts todo` runs THE SYSTEM SHALL exit 0 after finding the five templates, the exact headers of `organizaciones.csv` and `seguimiento.csv`, at least 20 organization rows and the three headings of `kit-piloto.md`.
- [ ] WHEN any `organizaciones.csv` row has a `tipo` outside the allowed list, a `fuente` not starting with `https://`, a malformed `fecha_consulta` or a contact at gmail, hotmail, yahoo or outlook THE SYSTEM SHALL make the script exit 1 naming the row.
- [ ] WHEN `alianzas/pauta-entrevistas.md` is read THE SYSTEM SHALL mention `seguimiento-entrevistas.csv`.

**Verify**
```bash
pnpm -C app exec tsx scripts/check-alianzas.ts todo  # expect: exit 0
grep -q "seguimiento-entrevistas.csv" alianzas/pauta-entrevistas.md  # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 65: alianzas-kit"
git tag step-65-alianzas-kit
# si el paso 66 sale mal: git reset --hard step-65-alianzas-kit
```

---

#### Step 66 — Invitar familiares al círculo por enlace (F16)

Épica `10-si-sobra-tiempo` · tarea `E10-T1` · prioridad `p2` · depende de: paso 65, paso 59, paso 58, paso 54

**Do**

Solo si sobra tiempo o cuota (fase 8). El diseño completo está en `docs/diseno/familiares.md`.
- `app/src/server/family/invitations.ts` — `createInvitation(client, userId, circleId)`: límite `invitation`; token de 32 bytes base64url, guarda `sha256` hex, vence en 7 días; devuelve `<APP_URL>/invitar/<token>`; registra `invitation.created`. `acceptInvitation(client, token, displayName)` → RPC `accept_invitation` (errores → `invitation_invalid`). `revokeInvitation`. `updateNotifyKinds` → RPC `set_member_notify_kinds`.
- `circulo/page.tsx` — miembros con su rol, "Invitar a un familiar", invitaciones pendientes con "Revocar", y por familiar los avisos que recibe (por defecto fechas importantes, controles y emergencias).
- `invitar/[token]/page.tsx` — exige sesión (si no, `/entrar?next=`) y consentimientos; muestra a qué círculo se suma y qué podrá hacer; botón "Unirme".
- `doors.ts` — `FAMILY_ENABLED = true`.

Archivos que crea o modifica:
- `app/src/server/family/invitations.ts`
- `app/src/app/(app)/circulo/page.tsx`
- `app/src/app/invitar/[token]/page.tsx`
- `app/src/server/fake-doors/doors.ts`
- `app/tests/db/family-invitations.test.ts`

**Done when**
- [ ] WHEN a caregiver creates an invitation THE SYSTEM SHALL return a link `<APP_URL>/invitar/<token>` valid for 7 days and store only the token's SHA-256 hex.
- [ ] WHEN a signed-in user with the required consents accepts it THE SYSTEM SHALL add them to the circle with role `family` and notify kinds `important_date`, `appointment` and `emergency`, and mark the invitation accepted.
- [ ] WHEN the token is expired, revoked or already used THE SYSTEM SHALL refuse with `invitation_invalid`.
- [ ] WHEN the same caregiver creates an 11th invitation within 24 hours THE SYSTEM SHALL return `rate_limited`.
- [ ] WHEN `FAMILY_ENABLED` is true THE SYSTEM SHALL have `visibleDoors()` called without arguments exclude `invitar-familiar`.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/family-invitations.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/db/fake-doors.test.ts  # expect: exit 0 — la puerta falsa se oculta sola
```

**Checkpoint**
```bash
git add -A && git commit -m "step 66: familiares-invitaciones"
git tag step-66-familiares-invitaciones
# si el paso 67 sale mal: git reset --hard step-66-familiares-invitaciones
```

---

#### Step 67 — Dejar que el familiar verifique y tome tareas (F16)

Épica `10-si-sobra-tiempo` · tarea `E10-T2` · prioridad `p2` · depende de: paso 66

**Do**

- `today.ts` — cada ítem `done` trae `verifiedBy` (el `display_name` de `circle_members` de quien lo marcó, según `occurrence_marks.marked_by`) cuando no fue la propia usuaria; el familiar ve "Hoy" del círculo.
- `occurrence-item.tsx` — muestra "Verificado por <nombre>".
- `tasks.ts` — `claimTask(client, taskId)` → RPC `claim_task`; `listTasks` trae `claimedByName`; en la página de tareas se lee "Yo me encargo" / "Se encarga <nombre>".

Archivos que crea o modifica:
- `app/src/server/today/today.ts`
- `app/src/components/today/occurrence-item.tsx`
- `app/src/server/tasks/tasks.ts`
- `app/tests/db/family-permissions.test.ts`

**Done when**
- [ ] WHEN a family member marks an occurrence `done` THE SYSTEM SHALL store `done_by` as that member, and `getToday` for the caregiver SHALL return `verifiedBy` with the member's `display_name`.
- [ ] WHEN a family member tries to update a reminder, a member's role or the circle's fields THE SYSTEM SHALL change nothing.
- [ ] WHEN a family member claims a task THE SYSTEM SHALL set `claimed_by` to that member, and `listTasks` for the caregiver SHALL return `claimedByName` with the member's name.
- [ ] WHEN a family member reads the circle's report through `summarize` with audience `family` THE SYSTEM SHALL get no self-care value, and selecting `selfcare_checkins` SHALL return zero rows.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/family-permissions.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/db/today.test.ts  # expect: exit 0 — "Hoy" sigue cumpliendo su contrato
```

**Checkpoint**
```bash
git add -A && git commit -m "step 67: familiares-permisos"
git tag step-67-familiares-permisos
# si el paso 68 sale mal: git reset --hard step-67-familiares-permisos
```

---

#### Step 68 — Mostrar la actividad del círculo y avisar a la familia (F16)

Épica `10-si-sobra-tiempo` · tarea `E10-T3` · prioridad `p2` · depende de: paso 67

**Do**

- `feed.ts` — `circleFeed(client, circleId, limit = 50)`: marcas (`occurrence_marks` con nombre de quien marcó), tareas tomadas o cerradas e hitos, del más nuevo al más antiguo; nunca bienestar.
- `circulo/actividad/page.tsx` — la lista, con fecha y hora locales.
- `dispatch.ts` — destinatarias: cuidadoras + familiares cuyo `notify_kinds` incluye el `kind` del recordatorio.
- `emergency.ts` — además de las cuidadoras, avisa a familiares con `emergency` en `notify_kinds`.

Archivos que crea o modifica:
- `app/src/server/family/feed.ts`
- `app/src/app/(app)/circulo/actividad/page.tsx`
- `app/src/server/reminders/dispatch.ts`
- `app/src/server/cared-link/emergency.ts`
- `app/tests/db/family-notifications.test.ts`

**Done when**
- [ ] WHEN `circleFeed` runs THE SYSTEM SHALL list marks with the name of who made them, claimed or closed tasks and milestones, newest first, with no self-care data.
- [ ] WHEN a reminder of kind `appointment` fires THE SYSTEM SHALL notify family members whose `notify_kinds` include `appointment` and SHALL not notify a family member whose `notify_kinds` exclude it.
- [ ] WHEN an emergency is triggered from the cared link THE SYSTEM SHALL notify every caregiver and every family member with `emergency` in `notify_kinds`.
- [ ] WHEN a family member calls `set_member_notify_kinds` for another member THE SYSTEM SHALL reject it with `42501`, and the caregiver's call SHALL store the new kinds.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/family-notifications.test.ts  # expect: exit 0, 0 failed
pnpm -C app test tests/db/dispatch.test.ts  # expect: exit 0 — el despachador sigue cumpliendo su contrato
```

**Checkpoint**
```bash
git add -A && git commit -m "step 68: familiares-actividad"
git tag step-68-familiares-actividad
# si el paso 69 sale mal: git reset --hard step-68-familiares-actividad
```

---

#### Step 69 — Abrir el panel agregado para organizaciones (F17)

Épica `10-si-sobra-tiempo` · tarea `E10-T4` · prioridad `p2` · depende de: paso 68, paso 41

**Do**

- `org-dashboard.ts` — `createDashboardLink(client, orgId)` (admin `aal2`; token de 32 bytes base64url; guarda `sha256` hex en `organizations.dashboard_token_hash`; muestra el enlace una sola vez); `orgDashboard(admin, token, now)`: resuelve el hash y calcula, solo con usuarias de ese `org_code`, personas que llegaron, activas por semana, retención en las semanas 1, 4 y 8 y promedio de días activos; todo grupo con menos de 5 personas se reemplaza por "Menos de 5 personas: no se muestra".
- `org/[token]/page.tsx` — pública, `robots: noindex`, solo agregados; token desconocido → `notFound()`.
- `admin/organizaciones/page.tsx` — botón "Generar enlace del panel".

Archivos que crea o modifica:
- `app/src/server/org/org-dashboard.ts`
- `app/src/app/org/[token]/page.tsx`
- `app/src/app/admin/organizaciones/page.tsx`
- `app/tests/db/org-dashboard.test.ts`

**Done when**
- [ ] WHEN an `aal2` admin generates a dashboard link THE SYSTEM SHALL store only the SHA-256 hex of the token in `organizations.dashboard_token_hash` and return the link once.
- [ ] WHEN `orgDashboard` resolves a valid token THE SYSTEM SHALL return only aggregates for users whose `org_code` matches that organization.
- [ ] WHEN a group has fewer than 5 users THE SYSTEM SHALL return "Menos de 5 personas: no se muestra" instead of the number.
- [ ] WHEN the token is unknown THE SYSTEM SHALL return null and the page SHALL answer 404.

**Verify**
```bash
pnpm -C app lint  # expect: exit 0
pnpm -C app typecheck  # expect: exit 0
pnpm -C app test tests/db/org-dashboard.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 69: panel-organizaciones-f17"
git tag step-69-panel-organizaciones-f17
# si el paso 70 sale mal: git reset --hard step-69-panel-organizaciones-f17
```

---

#### Step 70 — Medir rendimiento y cerrar documentos de fase 8

Épica `10-si-sobra-tiempo` · tarea `E10-T5` · prioridad `p2` · depende de: paso 69

**Do**

- `performance.spec.ts` — solo en el proyecto `android-gama-media`: carga `/hoy` con una usuaria con datos, suma `(await response.request().sizes()).responseBodySize` de las respuestas de tipo script y lee el LCP con `PerformanceObserver` (`largest-contentful-paint`).
- `PENDIENTES.md` — estado final: lo que no se construyó, por prioridad, con instrucciones para retomarlo.
- `DECISIONES.md` — agrega las decisiones de la fase 8.
- `docs/diseno/familiares.md` y `docs/diseno/admin-y-organizaciones.md` — sección `## Estado` que dice qué quedó construido, para que el diseño coincida con lo construido (definición de terminado, punto 7).

Archivos que crea o modifica:
- `app/tests/e2e/performance.spec.ts`
- `PENDIENTES.md`
- `DECISIONES.md`
- `docs/diseno/familiares.md`
- `docs/diseno/admin-y-organizaciones.md`

**Done when**
- [ ] WHEN `tests/e2e/performance.spec.ts` loads `/hoy` on the `android-gama-media` project THE SYSTEM SHALL transfer less than 350 KB of compressed JavaScript and report a Largest Contentful Paint under 2500 ms against the local production build.
- [ ] WHEN `docs/diseno/familiares.md` and `docs/diseno/admin-y-organizaciones.md` are read THE SYSTEM SHALL contain the heading `## Estado`.
- [ ] WHEN `tests/unit/docs-diseno.test.ts` runs THE SYSTEM SHALL still pass.

**Verify**
```bash
pnpm -C app test:e2e tests/e2e/performance.spec.ts  # expect: exit 0, 0 failed
grep -q "## Estado" docs/diseno/familiares.md  # expect: exit 0
grep -q "## Estado" docs/diseno/admin-y-organizaciones.md  # expect: exit 0
pnpm -C app test tests/unit/docs-diseno.test.ts  # expect: exit 0, 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 70: pulido-rendimiento"
git tag step-70-pulido-rendimiento
# si el paso 71 sale mal: git reset --hard step-70-pulido-rendimiento
```

---


### 9.1 Parity and cutover

NOT APPLICABLE — greenfield build, no system is being replaced. (El sitio `web/` sigue existiendo y solo se edita; el formulario de contacto cambia de destino en el paso paso 63 (`web-contacto`), y la política anónima de `sole-web.contactos` se retira a mano desde la lista de lanzamiento cuando el nuevo camino esté probado en producción.)

---

## 10. Environment Setup

### Prerequisites

Máquina de construcción de referencia: **Windows 11** con Git Bash (viene con Git for Windows). Todos los bloques de este plano son bash: se corren en **Git Bash**, no en PowerShell ni `cmd` (en PowerShell, `$(…)`, `test`, `grep` y las comillas simples se comportan distinto). En macOS o Linux funcionan igual en bash/zsh.

| Tool | Version | Check |
|---|---|---|
| Node.js | 22.x LTS, ≥ 22.12.0 (Vitest 5 y Sentry 11 lo exigen; la máquina del fundador tiene 22.16.0) | `node -v` |
| npm | el que trae Node 22 | `npm -v` |
| pnpm | 12.18.0 (lo instala el Bootstrap con `npm install -g --prefix ~/.local`; corepack no sirve con pnpm 12) | `pnpm -v` |
| Git | ≥ 2.40 (la máquina tiene 2.46.0) | `git --version` |
| Docker Desktop | abierto y con el motor corriendo (Supabase local) | `docker info` |
| Red | para `pnpm install`, Playwright, imágenes de Supabase y la fuente de `next/font` en el build | — |

### Accounts to create first

Ninguna cuenta es necesaria para construir: todo el plano corre en local. Estas se crean antes del lanzamiento (lista de §20.1); el fundador puede crearlas antes del paso 1 para no esperar después.

| Servicio | Para qué | Dónde | Se necesita en |
|---|---|---|---|
| Supabase (proyecto de producción, región São Paulo) | base, Auth, cron | https://supabase.com/dashboard | lista de lanzamiento |
| Vercel (proyecto con raíz `app/`, dominio `app.solecuida.com`) | hosting | https://vercel.com/new | lista de lanzamiento |
| Resend (dominio `notificaciones.solecuida.com` con SPF y DKIM propios) | SMTP de Supabase Auth y avisos de inactividad | https://resend.com | lista de lanzamiento |
| Sentry (proyecto Next.js) | errores | https://sentry.io/signup/ | lista de lanzamiento |
| Cloudflare Turnstile (sitio con `app.solecuida.com` y `solecuida.com`) | anti-bots | https://dash.cloudflare.com/?to=/:account/turnstile | lista de lanzamiento |
| Google Search Console (`solecuida.com`) | indexación y sitemap | https://search.google.com/search-console | lista de lanzamiento |
| GitHub (secretos del repo) | respaldos y keep-alive | Settings → Secrets and variables → Actions | lista de lanzamiento |

### Environment variables

La validación degrada por paso: `src/lib/env.ts` no exige nada al importarse; cada función pide su variable cuando la usa (`requireEnv`). "Required by step" es el paso desde el cual el código la necesita; antes de ese paso puede faltar sin romper ninguna compuerta. En local, `pnpm -C app env:local` (Bootstrap) escribe todas las obligatorias en `app/.env.local` y `app/.env.test.local`.

| Variable | Purpose | Where to get it | Required by step | Secret? |
|---|---|---|---|---|
| `APP_URL` | URL base (enlaces mágicos, invitaciones, robots) | local `http://localhost:3000` (por defecto); prod `https://app.solecuida.com` en Vercel | paso 10 (`autenticacion-login`) (con valor por defecto local) | no |
| `SUPABASE_URL` | URL de la API de Supabase | local: `API_URL` de `supabase status`; prod: panel → Project Settings → API | paso 2 (`supabase-local`) | no |
| `SUPABASE_PUBLISHABLE_KEY` | clave pública para el cliente con sesión | local: `PUBLISHABLE_KEY` o `ANON_KEY` de `supabase status`; prod: panel → API Keys | paso 2 (`supabase-local`) | no |
| `SUPABASE_SECRET_KEY` | clave de servicio (solo servidor) | local: `SECRET_KEY` o `SERVICE_ROLE_KEY`; prod: panel → API Keys | paso 2 (`supabase-local`) | sí |
| `IP_HASH_SECRET` | HMAC de IPs y correos en límites | generado (32 bytes hex) por `env:local`; prod: `openssl rand -hex 32` | paso 9 (`rls-y-limites`) | sí |
| `FIELD_ENCRYPTION_KEY` | clave AES-256-GCM, formato `<versión>:<base64 de 32 bytes>` | generada por `env:local`; prod: `node -e "console.log('1:'+require('crypto').randomBytes(32).toString('base64'))"` | paso 18 (`recordatorios-datos`) | sí |
| `FIELD_ENCRYPTION_KEY_PREVIOUS` | clave anterior durante una rotación | la clave que se reemplaza | — opcional (solo al rotar) | sí |
| `CRON_SECRET` | secreto del header `x-cron-secret` (también en Vault como `cron_secret`) | generado por `env:local`; prod: `openssl rand -hex 32` | paso 21 (`despachador`) | sí |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | clave pública VAPID (suscripción en el navegador) | generada por `env:local`; prod: `pnpm -C app exec web-push generate-vapid-keys --json` | paso 21 (`despachador`) | no |
| `VAPID_PRIVATE_KEY` | clave privada VAPID | igual que la anterior | paso 21 (`despachador`) | sí |
| `VAPID_SUBJECT` | contacto VAPID | `mailto:hola@solecuida.com` | paso 21 (`despachador`) | no |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | widget Turnstile en `/entrar` | Cloudflare → Turnstile | — opcional (sin ella no hay widget; obligatoria al lanzar) | no |
| `TURNSTILE_SECRET_KEY` | verificación del formulario web | Cloudflare → Turnstile | — opcional (paso 63 (`web-contacto`) verifica solo si existe; obligatoria al lanzar) | sí |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN de Sentry | Sentry → Project Settings → Client Keys | — opcional (sin DSN, Sentry apagado) | no |
| `SENTRY_AUTH_TOKEN` | subir mapas de código fuente en el build de Vercel | Sentry → Settings → Auth Tokens | — opcional (solo build de producción) | sí |
| `SENTRY_ORG` · `SENTRY_PROJECT` | destino de los mapas | Sentry | — opcional | no |
| `RESEND_API_KEY` | avisos de inactividad | Resend → API Keys | — opcional (paso 49 (`trabajos-diarios`): sin ella no avisa y por lo tanto no purga por inactividad) | sí |
| `EMAIL_FROM` | remitente | `Sole <avisos@notificaciones.solecuida.com>` | — opcional (paso 49 (`trabajos-diarios`)) | no |
| `WEB_CONTACT_SUPABASE_URL` | proyecto `sole-web` del formulario | `web/assets/config.js` actual (`https://pmqcaajimehihxlxgqbx.supabase.co`) | — opcional (paso 63 (`web-contacto`) responde 503 sin ella) | no |
| `WEB_CONTACT_SUPABASE_SECRET_KEY` | clave secreta de `sole-web` | panel de `sole-web` → API Keys | — opcional (paso 63 (`web-contacto`)) | sí |
| `WEB_ALLOWED_ORIGINS` | orígenes CORS del formulario | prod `https://solecuida.com,https://www.solecuida.com` (por defecto); local `http://localhost:5500` | — opcional (paso 63 (`web-contacto`)) | no |

Fuera de la app: **GitHub Actions** — secretos `SUPABASE_DB_URL` (conexión de producción, para `backup.yml`) y `AGE_PUBLIC_KEY` (destinatario `age`; la clave privada queda fuera de línea con el fundador). **Vault de producción** — `app_base_url` y `cron_secret` (SQL en `docs/mantenimiento.md`). **Panel de Supabase de producción** — SMTP de Resend (`smtp.resend.com`, puerto 465, usuario `resend`, contraseña = clave de Resend), clave secreta de Turnstile en Auth → Captcha.

Variables que pone la plataforma y nadie configura: `NODE_ENV` (Next), `NEXT_RUNTIME` (Next, en `instrumentation.ts`), `CI` (GitHub Actions, en `playwright.config.ts`), `VERCEL_GIT_COMMIT_REF` (Vercel, en `ignoreCommand`) y `TZ=UTC` (fijada por `tests/setup/env.ts`).

`app/.env.example` se versiona con todas las claves y valores vacíos o locales. `.env`, `.env.*`, `.env.local` y `.env.test.local` están ignorados. Ningún secreto tiene valor por defecto.

**Cargadores de variables** (los frameworks cargan `.env`, las herramientas sueltas no): Next carga `app/.env.local`; Vitest y Playwright cargan `app/.env.test.local` desde su propia config (`process.loadEnvFile`) y `tests/setup/env.ts`; cada script de `app/scripts/` llama a `loadLocalEnv()` (o lee stdin, en `write-local-env.ts`); la CLI de Supabase no lee variables (todo está en `config.toml`). Detalle en §19.6.

### Files that must be committed

| File | Why it is committed | Ignore-file exception line |
|---|---|---|
| `app/.env.example` | contrato de variables | `!.env.example` después de `.env.*` en `.gitignore` de la raíz y después de `.env*` en `app/.gitignore` (ambas escritas por el Bootstrap) |
| `CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, `.claude/skills/**`, `.claude/rules/**` | configuración de agentes | — ninguna regla los ignora (`.claude/settings.local.json` sí se ignora, y así sigue) |
| `app/vitest.config.ts`, `app/playwright.config.ts`, `app/biome.json`, `app/postcss.config.mjs`, `app/tests/setup/env.ts`, `app/scripts/**` | configs que usan las compuertas | — ninguna regla los ignora |
| `app/supabase/config.toml`, `app/supabase/migrations/**`, `app/supabase/seed.sql`, `app/supabase/tests/**`, `app/supabase/templates/**` | esquema y Supabase local | — se ignoran solo `app/supabase/.temp/` y `app/supabase/.branches/` |
| `app/pnpm-lock.yaml`, `app/pnpm-workspace.yaml` | dependencias reproducibles | — ninguna regla los ignora |
| `.github/**`, `.githooks/pre-commit`, `.gitleaks.toml` | CI y escaneo de secretos | — ninguna regla los ignora |
| `.gitattributes` | fin de línea LF en todo el repo (Bootstrap línea 1) | — ninguna regla lo ignora |
| `app/src/lib/supabase/database.types.ts` | tipos generados que importa el código | — ninguna regla lo ignora |

### Bootstrap

Se corre una vez antes del paso 1, en **Git Bash**, desde la raíz del repo (o desde cualquier carpeta dentro de él: la primera línea sube a la raíz). Cada línea es segura de repetir (un constructor atascado puede volver a correr el bloque entero).

```bash
set -euo pipefail
# order matters: ignore file + exceptions → repo check → toolchain → scaffold → workspace copy →
#                config overrides → manifest edits → install → format → browsers → services → env → checks → first commit
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"   # raíz del repo; en una carpeta nueva sin git, la carpeta actual

# 1. Ignore file de la raíz con sus excepciones, ANTES de cualquier commit (solo agrega lo que falta; sale 0 igual).
#    Y .gitattributes con fin de línea LF: con core.autocrlf=true (Windows) los archivos saldrían CRLF y Biome los marcaría.
touch .gitignore .gitattributes
grep -qxF '* text=auto eol=lf' .gitattributes || printf '%s\n' '* text=auto eol=lf' >> .gitattributes
for line in 'node_modules/' '.env' '.env.*' '!.env.example' 'app/test-results/' 'app/playwright-report/' 'app/blob-report/' 'app/supabase/.temp/' 'app/supabase/.branches/' 'app/public/sw.js' 'app/public/sw.js.map' 'app/public/swe-worker-*.js' '*.tsbuildinfo' '.env.sentry-build-plugin' 'backup-*'; do
  grep -qxF -- "$line" .gitignore || printf '%s\n' "$line" >> .gitignore
done

# 2. Repositorio: ya existe en este proyecto; en un clon vacío lo crea. No-op si ya existe.
git rev-parse --git-dir >/dev/null 2>&1 || git init -b main

# 3. pnpm 12 por npm, sin permisos de administrador, en ~/.local (no por corepack: el corepack de Node 22
#    busca bin/pnpm.cjs, que pnpm 12 ya no trae, y falla con MODULE_NOT_FOUND). Windows deja el binario
#    en ~/.local y macOS/Linux en ~/.local/bin: ambos van al PATH de esta sesión.
export PATH="$HOME/.local:$HOME/.local/bin:$PATH"
[ "$(pnpm -v 2>/dev/null || true)" = "12.18.0" ] || npm install -g --prefix "$HOME/.local" pnpm@12.18.0
pnpm -v                      # expect: 12.18.0
node -v                      # expect: v22.x (≥ 22.12)
docker info >/dev/null       # expect: exit 0 — si falla, abre Docker Desktop y vuelve a correr el bloque

# 4. Scaffold de la app solo si no existe. --biome (no --eslint=false, que se ignora), --yes evita preguntas,
#    --disable-git porque el repo ya existe.
[ -f app/package.json ] || pnpm create next-app@16.4.6 app --ts --app --tailwind --biome --src-dir --use-pnpm --import-alias "@/*" --disable-git --yes

# 5. Copia de workspace/ a la raíz: nunca pisa un archivo existente (cpSync con force:false omite y sale 0
#    en cualquier sistema; cp -n sale 1 en macOS al omitir). Nunca se sobrescriben package.json,
#    pnpm-lock.yaml ni archivos que un paso ya editó.
node -e "require('node:fs').cpSync('blueprints/sole-prototipo/workspace', '.', { recursive: true, force: false })"

# 6. biome.json y postcss.config.mjs del scaffold → los del plano (el scaffold crea ambos y la copia de la línea 5
#    no los pisa). Idempotente: mismo contenido cada vez. Ningún paso edita estos dos archivos.
cp blueprints/sole-prototipo/workspace/app/biome.json app/biome.json
cp blueprints/sole-prototipo/workspace/app/postcss.config.mjs app/postcss.config.mjs

# 7. El .gitignore del scaffold trae `.env*`: se agrega la excepción después.
grep -qxF '!.env.example' app/.gitignore || printf '%s\n' '!.env.example' >> app/.gitignore

# 8. Scripts, motor y gestor en app/package.json (npm pkg set es idempotente).
npm --prefix app pkg set engines.node=">=22.12.0 <23" packageManager="pnpm@12.18.0" scripts.dev="next dev --webpack" scripts.build="next build --webpack" scripts.start="next start" scripts.lint="biome check ." scripts.format="biome check --write ." scripts.typecheck="next typegen && tsc --noEmit" scripts.test="vitest run" scripts.test:e2e="playwright test" scripts.db:start="supabase start" scripts.db:stop="supabase stop" scripts.db:reset="supabase db reset" scripts.db:test="supabase test db" scripts.db:types="supabase gen types typescript --local --schema public > src/lib/supabase/database.types.ts" scripts.env:local="supabase status -o json | tsx scripts/write-local-env.ts" scripts.cron:dispatch="tsx scripts/trigger-cron.ts dispatch" scripts.cron:daily="tsx scripts/trigger-cron.ts daily"

# 9. Dependencias con las versiones de §11 (exactas; repetir no cambia nada).
pnpm -C app approve-builds esbuild supabase   # ANTES de instalar: pnpm 12 corta `add` con ERR_PNPM_IGNORED_BUILDS si un postinstall no está aprobado (escribe allowBuilds en app/pnpm-workspace.yaml; repetir sale 0)
pnpm -C app add -E next@16.4.6 react@19.3.1 react-dom@19.3.1 @supabase/supabase-js@2.119.0 @supabase/ssr@0.12.7 zod@4.6.7 react-hook-form@7.92.0 @hookform/resolvers@7.0.6 lucide-react@1.72.0 @serwist/next@9.5.13 idb@8.0.4 web-push@3.6.7 @sentry/nextjs@11.12.0 @marsidev/react-turnstile@1.6.3 recharts@3.10.1 date-fns@4.4.0 @date-fns/tz@1.5.0 html-to-image@1.11.13
pnpm -C app add -D -E typescript@~6.0.3 @types/node@^22 @types/react@19.3.0 @types/react-dom@19.3.0 tailwindcss@4.3.5 @tailwindcss/postcss@4.3.5 @biomejs/biome@2.6.7 vitest@5.1.0 @vitejs/plugin-react@6.3.0 jsdom@31.0.1 @testing-library/react@16.3.3 @playwright/test@1.65.1 @axe-core/playwright@4.14.0 serwist@9.5.13 @types/web-push@3.6.4 supabase@2.122.1 tsx@4.23.15
pnpm -C app add -D @testing-library/dom   # par obligatorio de @testing-library/react; versión sin verificar (§11)
pnpm -C app install --frozen-lockfile     # la compuerta real de la instalación

# 10. Formato inicial: alinea scaffold y archivos del plano con app/biome.json (una vez; luego no cambia nada).
pnpm -C app format

# 11. Navegadores de Playwright (Pixel 7 = Chromium, iPhone 13 = WebKit).
pnpm -C app exec playwright install --with-deps chromium webkit

# 12. Supabase local: si ya corre, no se toca; si no, se inicia y aplica migraciones + seed.sql.
pnpm -C app exec supabase status >/dev/null 2>&1 || pnpm -C app db:start

# 13. Variables locales (.env.local y .env.test.local); conserva los secretos ya generados.
pnpm -C app env:local

# 14. Compuertas del arranque.
pnpm -C app lint             # expect: exit 0
pnpm -C app typecheck        # expect: exit 0

# 15. Commit de arranque, solo si hay algo nuevo (en un repo vacío crea el primer commit para las etiquetas).
git add -A
git diff --cached --quiet || git commit -m "chore: bootstrap del prototipo Sole"
```

Servicios locales: `pnpm -C app db:start` (arriba), `pnpm -C app db:stop` (abajo), `pnpm -C app db:reset` (base limpia con migraciones y `seed.sql`). La base de las pruebas es la misma base local, reiniciable; cada prueba crea sus propias usuarias aleatorias, así que no hay estado compartido. Correo local (enlaces mágicos): Mailpit en http://127.0.0.1:54324.

---

## 11. Dependencies

Fuente de todas las versiones: informe `stack-report.md` de `stack-researcher` de esta sesión (registro npm en vivo, `https://registry.npmjs.org/-/package/<nombre>/dist-tags` y `https://registry.npmjs.org/<nombre>/latest`; Node en `https://nodejs.org/dist/index.json`), comprobado el **2026-11-14** (UTC). Todo lo marcado VERIFIED vino de ese informe; lo que no se verificó lo dice.

### Runtime

| Package | Version | Source (registry URL or track file) | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| Node.js | 22.x LTS "Jod" (≥ 22.12.0; última 22.23.5) | https://nodejs.org/dist/index.json | 2026-11-14 | prerrequisito (§10) | runtime; `engines` `>=22.12.0 <23` |
| pnpm | 12.18.0 | https://registry.npmjs.org/-/package/pnpm/dist-tags | 2026-11-14 | §10 Bootstrap (`npm install -g --prefix`) | gestor de paquetes |
| next | 16.4.6 | https://registry.npmjs.org/-/package/next/dist-tags | 2026-11-14 | §10 Bootstrap (`create-next-app` + `pnpm -C app add -E`) | framework |
| create-next-app | 16.4.6 (mismo tren de versiones que `next`; no figura en el informe) | UNVERIFIED — verify before install | 2026-11-14 | §10 Bootstrap (`pnpm create next-app@16.4.6`) | scaffold único |
| react · react-dom | 19.3.1 · 19.3.1 | https://registry.npmjs.org/-/package/react/dist-tags | 2026-11-14 | §10 Bootstrap | UI |
| @supabase/supabase-js | 2.119.0 | https://registry.npmjs.org/-/package/@supabase/supabase-js/dist-tags | 2026-11-14 | §10 Bootstrap | cliente de la API |
| @supabase/ssr | 0.12.7 | https://registry.npmjs.org/-/package/@supabase/ssr/dist-tags | 2026-11-14 | §10 Bootstrap | sesión en cookies del servidor |
| zod | 4.6.7 | https://registry.npmjs.org/-/package/zod/dist-tags | 2026-11-14 | §10 Bootstrap | validación en todos los bordes |
| react-hook-form · @hookform/resolvers | 7.92.0 · 7.0.6 | https://registry.npmjs.org/-/package/react-hook-form/dist-tags | 2026-11-14 | §10 Bootstrap | formularios de cliente |
| lucide-react | 1.72.0 | https://registry.npmjs.org/-/package/lucide-react/dist-tags | 2026-11-14 | §10 Bootstrap | íconos (licencia ISC) |
| @serwist/next | 9.5.13 (10.x solo preview: no se usa) | https://registry.npmjs.org/-/package/@serwist/next/dist-tags | 2026-11-14 | §10 Bootstrap | service worker / PWA |
| idb | 8.0.4 | https://registry.npmjs.org/-/package/idb/dist-tags | 2026-11-14 | §10 Bootstrap | IndexedDB sin conexión |
| web-push | 3.6.7 (4.0.0 salió el 2026-11-06, demasiado nueva: no se usa) | https://registry.npmjs.org/-/package/web-push/dist-tags | 2026-11-14 | §10 Bootstrap | envío Web Push VAPID |
| @sentry/nextjs | 11.12.0 | https://registry.npmjs.org/-/package/@sentry/nextjs/dist-tags | 2026-11-14 | §10 Bootstrap | errores |
| @marsidev/react-turnstile | 1.6.3 | https://registry.npmjs.org/-/package/@marsidev/react-turnstile/dist-tags | 2026-11-14 | §10 Bootstrap | widget anti-bots |
| recharts | 3.10.1 | https://registry.npmjs.org/-/package/recharts/dist-tags | 2026-11-14 | §10 Bootstrap | gráficos de informes y admin |
| date-fns · @date-fns/tz | 4.4.0 · 1.5.0 | https://registry.npmjs.org/-/package/@date-fns/tz/dist-tags | 2026-11-14 | §10 Bootstrap | fechas en `America/Santiago` |
| html-to-image | 1.11.13 | https://registry.npmjs.org/-/package/html-to-image/dist-tags | 2026-11-14 | §10 Bootstrap | compartir informe como imagen |

### Development

| Package | Version | Source (registry URL or track file) | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| typescript | ~6.0.3 (npm `latest` es 7.0.2: no se usa) | https://registry.npmjs.org/-/package/typescript/dist-tags | 2026-11-14 | §10 Bootstrap | tipos |
| @types/node | `^22` (última 22.x al instalar; `latest` es 26.6.6) | UNVERIFIED — verify before install (el informe pide la línea 22, sin parche exacto) | 2026-11-14 | §10 Bootstrap | tipos de Node 22 |
| @types/react · @types/react-dom | 19.3.0 · 19.3.0 | https://registry.npmjs.org/-/package/@types/react/dist-tags | 2026-11-14 | §10 Bootstrap | tipos de React |
| tailwindcss · @tailwindcss/postcss | 4.3.5 · 4.3.5 | https://registry.npmjs.org/-/package/tailwindcss/dist-tags | 2026-11-14 | §10 Bootstrap | estilos (PostCSS por el build con webpack) |
| @biomejs/biome | 2.6.7 | https://registry.npmjs.org/-/package/@biomejs/biome/dist-tags | 2026-11-14 | §10 Bootstrap | lint + formato |
| vitest | 5.1.0 | https://registry.npmjs.org/-/package/vitest/dist-tags | 2026-11-14 | §10 Bootstrap | pruebas unitarias y de base |
| @vitejs/plugin-react | 6.3.0 | https://registry.npmjs.org/-/package/@vitejs/plugin-react/dist-tags | 2026-11-14 | §10 Bootstrap | JSX en Vitest |
| jsdom | 31.0.1 | https://registry.npmjs.org/-/package/jsdom/dist-tags | 2026-11-14 | §10 Bootstrap | DOM para pruebas de componentes |
| @testing-library/react | 16.3.3 | https://registry.npmjs.org/-/package/@testing-library/react/dist-tags | 2026-11-14 | §10 Bootstrap | pruebas de componentes |
| @testing-library/dom | sin fijar (par obligatorio de @testing-library/react 16) | UNVERIFIED — verify before install | 2026-11-14 | §10 Bootstrap (`pnpm -C app add -D @testing-library/dom`) | dependencia par |
| @playwright/test · @axe-core/playwright | 1.65.1 · 4.14.0 | https://registry.npmjs.org/-/package/@playwright/test/dist-tags | 2026-11-14 | §10 Bootstrap | e2e y accesibilidad |
| serwist | 9.5.13 | https://registry.npmjs.org/-/package/serwist/dist-tags | 2026-11-14 | §10 Bootstrap | tipos y runtime del service worker |
| @types/web-push | 3.6.4 | https://registry.npmjs.org/-/package/@types/web-push/dist-tags | 2026-11-14 | §10 Bootstrap | tipos |
| supabase (CLI) | 2.122.1 (dist-tag `v2.stable`; 3.x de 12 días: no se usa) | https://registry.npmjs.org/-/package/supabase/dist-tags | 2026-11-14 | §10 Bootstrap; también `backup.yml` (`npx --yes supabase@2.122.1`) | base local, migraciones, tipos, pgTAP, respaldo |
| tsx | 4.23.15 | https://registry.npmjs.org/-/package/tsx/dist-tags | 2026-11-14 | §10 Bootstrap | scripts TypeScript |

Herramientas fuera de npm (no las instala un paso; las usa CI o la lista de lanzamiento), todas **UNVERIFIED — verify before install**, comprobado 2026-11-14 que el informe no las fija: acciones de GitHub (`actions/checkout`, `actions/setup-node`, `pnpm/action-setup`, `actions/upload-artifact`, `github/codeql-action`, `gitleaks/gitleaks-action`, acción oficial de ZAP baseline) se fijan a su etiqueta mayor vigente al escribir los workflows; `gitleaks` local (opcional, el hook lo omite si falta); `age` (lo instala `apt-get` en `backup.yml`); imagen `semgrep/semgrep` en CI. Servicios alojados (Supabase, Vercel, Resend, Sentry, Turnstile, Search Console) no tienen versión.

### Deliberately not used

| Rejected | Instead | Why |
|---|---|---|
| ESLint, Prettier | Biome | una sola herramienta; el scaffold con `--biome` ya la configura |
| shadcn/ui, Radix | componentes propios sobre HTML nativo | dependencias sin versión verificada y más capas de las que el fundador puede mantener |
| Drizzle, Prisma | SQL a mano + `supabase gen types` | un segundo dueño del esquema que no entiende RLS |
| TanStack Query | Server Components + `revalidatePath` | no hay estado de servidor en el cliente que cachear |
| `server-only` | el cliente admin falla en el navegador y se revisa el bundle (`check-bundle-secrets.ts`) | no está en el informe de versiones y necesita alias en Vitest |
| Clerk, Better Auth | Supabase Auth | dos proveedores de identidad = dos sesiones y dos tablas de usuarios |
| next-pwa | Serwist | next-pwa no tiene mantenimiento para Next 16 |
| Supabase Edge Functions para el despachador | ruta de Next.js llamada por `pg_cron` + `pg_net` | mismo lenguaje, mismas pruebas, sin runtime extra (decisión registrada) |
| Vercel Cron | `pg_cron` | el plan Hobby no permite cada minuto |
| Google Analytics (GA4) | eventos propios + Vercel Web Analytics en `web/` | cookies y datos a terceros |
| Zoho SMTP para correo de la app | Resend en `notificaciones.solecuida.com` | protege la reputación de `solecuida.com` (`CORREO-Configuracion-Zoho.md` §6) |
| typescript 7, web-push 4, supabase CLI 3, @serwist/next 10 | las versiones de arriba | demasiado nuevas o sin API estable al 2026-11-14 |

---

## 12. Deployment Strategy

### Hosting

Vercel, plan Hobby (gratuito, uso no comercial: documentado en `docs/limites.md`), proyecto separado del de `web/`, **Root Directory `app`**, framework Next.js, `installCommand` `pnpm install --frozen-lockfile`, `buildCommand` `pnpm build` (= `next build --webpack`), región de funciones `gru1` (São Paulo, junto a Supabase), Node 22 (lo fija `engines`). Todo eso está en `app/vercel.json` salvo la raíz, que se elige al crear el proyecto. Supabase: un proyecto de producción en São Paulo, plan gratuito.

### Environments

| Environment | Branch | URL | Database | Third-party mode |
|---|---|---|---|---|
| Local | cualquiera | http://localhost:3000 (dev) · :3100 (e2e) | Supabase CLI en Docker | sin Turnstile, sin Sentry, sin Resend; VAPID local; correo en Mailpit |
| Preview | — | NOT APPLICABLE: `ignoreCommand` omite todo build que no sea `main` | — | — |
| Production | `main` | https://app.solecuida.com | Supabase São Paulo | claves reales en Vercel y Vault |

### CI/CD

`.github/workflows/ci.yml` en cada `push` a `main` y cada PR: `quality` (install congelado → `biome ci .` → typecheck → Supabase local → `env:local` → `db:test` → `test`), `e2e` (Playwright Chromium + WebKit con axe), `gitleaks` (historial completo), `audit` (`pnpm audit --prod --audit-level high`), `semgrep`. `codeql.yml` si el repo es público. Es el mismo conjunto de §20.1. Vercel despliega `main` solo; las migraciones se aplican antes, a mano, con `supabase db push` (lista de lanzamiento y `docs/mantenimiento.md`). `zap.yml` se dispara a mano después de cada despliegue importante.

### Release and rollback

Desplegar = merge a `main`. Revertir = "Promote" del despliegue anterior en Vercel (instantáneo) o `git revert` + push (unos 3 minutos). Migraciones: siempre compatibles hacia atrás (expandir y luego contraer), aplicadas antes del código que las usa; un rollback de código nunca exige revertir una migración. Datos: respaldo nocturno cifrado de 7 días; restauración probada (simulacro en `docs/mantenimiento.md`).

### Domain, DNS, TLS

`app.solecuida.com`: registro CNAME hacia Vercel (Vercel → Domains indica el valor exacto), TLS automático de Vercel, HSTS desde la app. `notificaciones.solecuida.com`: registros SPF y DKIM (y el MX de retorno) que indique Resend; no se tocan los registros de Zoho del dominio raíz. `solecuida.com` (web) sigue como está. Sin redirección apex ↔ www nueva (la web ya la tiene).

---

## 13. Testing Strategy

| Layer | Framework | What it covers | Where | Runs |
|---|---|---|---|---|
| Unit | Vitest | lógica pura: recurrencia y cambio de hora, cifrado, informes, métricas, filtrado de Sentry, tokens y contraste, documentos, web estática | `app/tests/unit/` | cada paso y cada push |
| Base de datos / integración | Vitest + Supabase local | RLS por rol, RPC, materialización, despachador, trabajos diarios, rutas con `Request` real | `app/tests/db/` | cada paso y cada push |
| Esquema | pgTAP (`supabase test db`) | RLS en toda tabla, cron programado, privilegios | `app/supabase/tests/` | cada push |
| E2E | Playwright (Pixel 7 + iPhone 13) + axe | flujos P1, sin conexión, PWA, cabeceras, teclado, 320 px | `app/tests/e2e/` | pasos con UI y cada push |

### Critical flows to cover E2E

1. Registro → consentimientos → círculo desde plantilla → "Hoy" (`onboarding.spec.ts`).
2. Crear un recordatorio y marcarlo desde "Hoy", también sin conexión (`reminders.spec.ts`, `today.spec.ts`, `offline-queue.spec.ts`, `offline-reload.spec.ts`).
3. Día completo P1: recordatorio, marca, bitácora, pregunta diaria, informe semanal (`p1-flows.spec.ts`).
4. Admin con MFA (`admin.spec.ts`).
5. Vista de la persona cuidada y botón de emergencia con confirmación (`cared-view.spec.ts`).
6. Accesibilidad de todas las páginas P1 en claro y oscuro (`a11y.spec.ts`).

### Test data

Supabase local (`pnpm -C app db:start`, servicio definido por `app/supabase/config.toml`; conexión en `SUPABASE_URL` de `.env.test.local`, escrito por `pnpm -C app env:local`). Cada prueba crea sus usuarias con correo aleatorio (`test-<uuid>@example.test`) mediante la API de administración y siembra lo que necesita con el cliente admin; nada depende del orden. `pnpm -C app db:reset` deja la base limpia cuando se quiere. Vitest corre los archivos en serie (`fileParallelism: false`) para no pelear por la misma base; Playwright con un worker. El reloj se inyecta (`now`) en toda la lógica con fechas.

### What is deliberately not tested

- Entrega real de Web Push en teléfonos (servicios de Google/Apple): se prueba el envío con un `sender` falso y la entrega en la lista de lanzamiento con un Android y un iPhone instalados.
- Correos reales (Resend) y SMTP de Supabase: `Mailer` falso; envío real en la lista de lanzamiento.
- Turnstile real: `fetch` simulado; real en producción.
- Lighthouse y ZAP: en producción (lista de lanzamiento).
- El sitio `web/` en navegador: se revisa su HTML estático con `web-site.test.ts`; Lighthouse en producción.

---

## 14. Security & Secrets

| Concern | Control | Implemented in |
|---|---|---|
| Secret storage | variables de entorno de Vercel; Vault de Supabase para `cron_secret` y `app_base_url`; secretos de GitHub para respaldos; nada en el repo | §10, `docs/mantenimiento.md` |
| Secret rotation | por demanda y ante cualquier sospecha: `FIELD_ENCRYPTION_KEY` con `scripts/rotate-field-key.ts`; `CRON_SECRET` en Vercel + Vault; VAPID (las suscripciones se renuevan); claves de Supabase y Resend desde sus paneles | `docs/mantenimiento.md` (paso paso 52 (`manual-mantenimiento`)) |
| Input validation | zod en cada Server Action y Route Handler + `check` en la base | `src/server/**`, migraciones |
| Output encoding / XSS | React escapa todo; sin `dangerouslySetInnerHTML` (prueba); CSP con nonce y `strict-dynamic` | `production-hygiene.test.tsx`, `src/lib/security/headers.ts` |
| SQL injection | PostgREST parametrizado; RPC en plpgsql sin SQL dinámico; `search_path = ''` | migraciones |
| AuthN / AuthZ | §8: servidor en cada petición + RLS + privilegios por columna + RPC | `src/proxy.ts`, layouts, migraciones |
| CSRF | Server Actions con verificación de origen de Next; JSON + sin CORS; `SameSite=Lax` | Next.js, `headers.ts` |
| Rate limiting / abuse | `rate_limit_hit` en Postgres (ventanas fijas, claves HMAC); límites de Supabase Auth; Turnstile; admin puede desactivar organizaciones; al exceder: 429 `rate_limited` | `src/server/security/rate-limit.ts` |
| Webhook verification | no hay webhooks de terceros; las rutas de cron exigen `x-cron-secret` con comparación de tiempo constante | `api/cron/*` |
| Dependency audit | `pnpm audit --prod --audit-level high` en CI, Dependabot semanal, lockfile versionado; antes de agregar una librería se revisa mantenimiento y licencia | `ci.yml`, `dependabot.yml` |
| Security headers | CSP `default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src https://challenges.cloudflare.com; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests` · `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` · `X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy: camera=(), microphone=(), geolocation=()` · `X-Frame-Options: DENY` | `src/lib/security/headers.ts`, `src/proxy.ts`, `next.config.ts` |
| PII handling | correo solo en `auth.users`; bitácora, medicamentos y notas de contactos cifrados con AES-256-GCM (versión de clave en el prefijo); eventos con seudónimo; borrado a pedido (7 días) y por inactividad (12 meses con aviso) con la RPC `purge_user`, que borra los eventos del seudónimo y luego la fila de `auth.users`: así una sola sentencia arrastra en cascada el perfil, los círculos que creó (también los que ven sus familiares; la pantalla de borrado lo advierte) y todo lo que cuelga de ellos, sin depender de que el código recuerde cada tabla; exportación JSON/CSV | `src/lib/crypto/field.ts`, `src/server/jobs/daily.ts`, `src/server/account/*` |
| Logging hygiene | sin `console.log` en `src/`; Sentry con `sendDefaultPii: false` y `scrubEvent` (correos, teléfonos, cookies, cuerpos, tokens en URLs); mapas de código fuente nunca públicos | `src/lib/observability/scrub.ts` |

**Hard rules**
- Ningún secreto se versiona, se imprime en un log, se manda a Sentry ni entra al bundle del cliente. Todo lo que llega al navegador es público.
- Toda autorización del servidor ocurre antes del trabajo, no después.
- No hay webhooks de terceros; si se agregan, se verifican por firma antes de leer el cuerpo.
- Las reglas `deny` de `.claude/settings.json` desalientan leer `.env.local`; no lo impiden. El aislamiento real es no tener secretos de producción en la máquina de construcción: en local todo es local.

**Régimen regulatorio:** datos sensibles de salud cotidiana (ánimo, medicamentos, rutina) de personas en Chile. Se diseña como si la **Ley 21.719** ya rigiera (además de la Ley 19.628): consentimiento por capas, explícito y revocable; minimización; derechos de acceso, portabilidad (exportación) y supresión (borrado); registro de actividades y evaluación de impacto (paso paso 48 (`amenazas-y-privacidad`)); plan de incidentes con notificación (plazos `[VERIFICAR]`); transferencia internacional declarada en la política de privacidad. Referencias de cumplimiento: OWASP ASVS 5.0 nivel 2, OWASP Top 10, ISO/IEC 27001:2022 Anexo A, ISO/IEC 27701 (paso paso 47 (`evidencia-seguridad`)). Usuarias mayores de 18; datos de menores los ingresa su madre, padre o tutor.

---

## 15. Accessibility

**Target: WCAG 2.2 Level AA.** Además, el público (45 a 65 años, cansado, Android de gama media) exige más que el mínimo: 18 px de base, objetivos de 48 px y un botón principal por pantalla.

### Baseline requirements

| Requirement | Rule |
|---|---|
| Semantic HTML | `header`/`nav`/`main`/`footer`, un `h1` por página, encabezados en orden, listas como listas, tablas con `th scope` |
| Keyboard | todo operable con teclado, orden lógico, sin trampas; "Saltar al contenido" es lo primero |
| Focus visible | `:focus-visible` con contorno de 3 px `--focus` (≥ 3:1 en ambos temas) |
| Contrast | texto ≥ 4.5:1, controles ≥ 3:1 — la tabla de §7 ya lo cumple y una prueba lo recalcula |
| Forms | `label` asociado, errores en texto con `role="alert"` y `aria-invalid`; nunca solo color |
| Images | íconos decorativos con `aria-hidden`; imágenes con significado con `alt` |
| Motion | todo respeta `prefers-reduced-motion: reduce` |
| Zoom / reflow | usable a 200 % y a 320 px sin scroll horizontal (prueba en `p1-flows.spec.ts`) |
| Live regions | marcas guardadas, sin conexión, confirmaciones en `aria-live="polite"` |

### WCAG 2.2 additions — the ones most often missed

| SC | Requirement |
|---|---|
| 2.4.11 Focus Not Obscured (Min) | el botón fijo "Contarle algo a Sole" y la CTA fija de la web no tapan el elemento enfocado (se desplazan o dejan margen) |
| 2.5.7 Dragging Movements | no hay arrastre en ninguna pantalla |
| 2.5.8 Target Size (Min) | 48 × 48 px en toda la app (el mínimo es 24) |
| 3.3.7 Redundant Entry | la bienvenida no vuelve a pedir datos; el calendario precarga la fecha al crear |
| 3.3.8 Accessible Authentication (Min) | enlace mágico sin prueba cognitiva; Turnstile sin rompecabezas; se permite pegar y usar gestores de contraseñas |

### Verification

```bash
pnpm -C app test:e2e tests/e2e/a11y.spec.ts      # expect: exit 0 — 0 violaciones axe (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) en claro y oscuro
pnpm -C app test:e2e tests/e2e/keyboard.spec.ts  # expect: exit 0
```
Antes del lanzamiento (manual): recorrido completo solo con teclado, una pasada con lector de pantalla (TalkBack en Android) por el flujo principal, y una pasada a 200 % en el ancho más angosto.

---

## 16. Observability & Cost

### Instrumentation

| Signal | Tool | What it captures | Who looks at it |
|---|---|---|---|
| Errors | Sentry (gratis) | excepciones de servidor y cliente con release, sin datos personales (`scrubEvent`) | fundador, semanal |
| Logs | logs de Vercel y de Supabase | peticiones y errores de función; consultas lentas en Supabase | fundador, al investigar |
| Metrics | eventos propios en `events` + panel `/admin` | H1–H6 y avisos activos | fundador, semanal |
| Uptime | `keepalive.yml` diario (falla visible en GitHub) | `GET /api/health` con base de datos | fundador (correo de GitHub cuando falla) |

### The metrics that matter for this project

| Metric | Target | Alert at |
|---|---|---|
| Ocurrencias avisadas a tiempo (`notified_at - due_at`) | p95 < 2 min | p95 > 5 min en un día (revisar cron y Vault) |
| Usuarias activas con push activo | ≥ 70 % | < 50 % (reforzar la guía de instalación) |
| Errores en Sentry | < 5 por día | > 20 en un día |
| Días activos por semana (H1) | ≥ 4 | < 2 en la cohorte de la semana 4 |
| Uso del plan gratuito (base, MAU, eventos) | < 80 % | ≥ 80 % (aviso en `/admin/limites`) |

### Health check

`GET /api/health`: consulta `organizations` con el cliente admin (prueba que la base responde y, de paso, mantiene vivo el proyecto gratuito); 200 `{ ok: true, data: { status: "ok", db: "ok", time } }` o 503 `db_unavailable` si falla o tarda más de 3 s. Lo consulta `keepalive.yml` a diario y Playwright para saber cuándo el servidor está listo.

### Cost model

Todos los límites de esta tabla se confirman en `docs/limites.md` con su fuente (`[VERIFICAR]` hasta entonces).

| Service | Free tier | Cost at v1 scale (≤ 200 usuarias) | Cost at 10× | Cliff to watch |
|---|---|---|---|---|
| Supabase | plan gratuito, 2 proyectos (uno ya es `sole-web`) | US$0 | US$0 si la base cabe | tamaño de base y pausa por 7 días sin actividad |
| Vercel | Hobby | US$0 | US$0 | uso no comercial; invocaciones de funciones (`dispatch` corre 1.440 veces al día) |
| Resend | según el brief, 3.000 correos/mes y 100/día | US$0 | US$0 | enlaces mágicos en un día de muchas altas |
| Sentry | plan gratuito | US$0 | US$0 | cuota mensual de errores |
| Cloudflare Turnstile | gratis | US$0 | US$0 | — |
| GitHub Actions | minutos gratis (`[VERIFICAR]` en repos privados) | US$0 | US$0 | e2e en cada push en repo privado |

**Costo mensual estimado al lanzar: US$0.** La partida más riesgosa es Vercel Hobby por la condición de uso no comercial: si el piloto pasa a cobrar, hay que pasar a Pro (y Supabase a Pro para respaldos gestionados). Nada escala de forma superlineal; el despachador por minuto es constante (1.440 invocaciones diarias) y no depende del número de usuarias.

---

## 17. Model Routing

NOT APPLICABLE — this project does not call an LLM at runtime. ("Sole con IA" existe solo como puerta falsa en F11.)

---

## 18. Skills to Use During Build

Nombres y comandos copiados de `knowledge/skills-registry.md` (verificado 2026-10-17). Ninguna es obligatoria: si no está instalada, se sigue con las reglas de este plano y se anota en una línea.

| Skill | Build steps | Why | Install |
|---|---|---|---|
| frontend-design (se activa sola) | paso 4 (`tokens-diseno`), paso 5 (`componentes-base`), paso 25 (`hoy`), paso 58 (`vista-persona-cuidada`) | interfaz cuidada sin el aspecto genérico | `/plugin marketplace add anthropics/skills` luego `/plugin install example-skills@anthropic-agent-skills` |
| ui-ux-pro-max (se activa sola) | paso 4 (`tokens-diseno`), paso 5 (`componentes-base`) | revisar el sistema visual contra la tabla de §7 (no reemplaza los hex) | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` luego `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| playwright-cli (se activa sola) | paso 16 (`e2e-bienvenida`), paso 46 (`e2e-p1-accesibilidad`) | escribir y depurar pruebas e2e | `npm install -g @playwright/cli@latest` luego `playwright-cli install --skills` |
| /claude-seo-ai:audit · /claude-seo-ai:geo | paso 62 (`web-relato`), paso 63 (`web-contacto`) | SEO y visibilidad en asistentes de IA de la web | `/plugin marketplace add Hainrixz/claude-seo-ai` luego `/plugin install claude-seo-ai@claude-seo-ai` y `/reload-plugins` |
| /humanizalo | paso 14 (`contenido-inicial`), paso 62 (`web-relato`), paso 64 (`alianzas-plantillas`) | textos en español que no suenen a máquina (el registro la marca como desactualizada: revisar antes) | `git clone https://github.com/Hainrixz/humanizalo.git ~/.claude/skills/humanizalo` |
| pdf (se activa sola) | paso 59 (`informe-medico-f14`) | revisar el PDF impreso del informe médico | `/plugin marketplace add anthropics/skills` luego `/plugin install document-skills@anthropic-agent-skills` |

Skills del propio proyecto (en `.claude/skills/`, se activan solas): `add-migration`, `add-route-handler`, `add-rls-test`, `run-step-gate` (§19.4).

---

## 19. Agent Workspace

El proyecto trae su propia configuración de agentes. En este bundle son archivos reales bajo `workspace/`, que replica la estructura del repo; el Bootstrap (§10, línea 5) los copia a la raíz con `cpSync(..., { force: false })`: un segundo intento no pisa nada (en particular nunca `app/package.json`, `app/pnpm-lock.yaml` ni archivos que un paso ya editó) y sale con 0 en Windows, macOS y Linux. Las únicas sobrescrituras deliberadas son `app/biome.json` y `app/postcss.config.mjs` (línea 6), con el mismo contenido cada vez; ningún paso los edita.

```
blueprints/sole-prototipo/workspace/
├── CLAUDE.md                         # §19.1
├── AGENTS.md                         # §19.2
├── .claude/
│   ├── settings.json                 # §19.3
│   ├── skills/{add-migration,add-route-handler,add-rls-test,run-step-gate}/SKILL.md   # §19.4
│   └── rules/{database,server,ui,tests,web,docs}.md                                 # §19.5
└── app/                              # §19.6
    ├── biome.json · postcss.config.mjs · vitest.config.ts · playwright.config.ts · .env.example
    ├── tests/setup/env.ts
    ├── scripts/write-local-env.ts · scripts/lib/load-env.ts
    └── supabase/config.toml · seed.sql · migrations/(4) · tests/database.test.sql · templates/magic-link.html
```

`.claude/commands/` no existe en este proyecto: los flujos repetibles son skills. Todos los archivos emitidos bajo `app/` pasan por `pnpm -C app format` en el Bootstrap (línea 10), de modo que coinciden con `app/biome.json` (2 espacios, comillas dobles) antes del primer `lint`.

### 19.1 `CLAUDE.md`

`CLAUDE.md` (`workspace/CLAUDE.md`):

```markdown
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
```

### 19.2 `AGENTS.md`

`AGENTS.md` (`workspace/AGENTS.md`):

```markdown
# Sole — instrucciones para agentes

PWA gratuita para personas que cuidan a otra persona en Chile. App en `app/` (Next.js + Supabase), sitio estático en `web/`.

## Comandos (desde la raíz del repo)

| Tarea | Comando |
|---|---|
| Instalar | `pnpm -C app install --frozen-lockfile` |
| Dev | `pnpm -C app dev` — http://localhost:3000 |
| Build | `pnpm -C app build` |
| Typecheck | `pnpm -C app typecheck` |
| Lint / formato | `pnpm -C app lint` · `pnpm -C app format` |
| Pruebas | `pnpm -C app test` · un archivo: `pnpm -C app test tests/unit/x.test.ts` |
| E2E | `pnpm -C app test:e2e` |
| Supabase local | `pnpm -C app db:start` · `pnpm -C app db:reset` · `pnpm -C app db:test` |
| Variables locales | `pnpm -C app env:local` |

Compuerta antes de dar algo por hecho: `pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test`.

Qué construir y en qué orden: `blueprints/sole-prototipo/tasks.json` y `blueprints/sole-prototipo/epics/`.

## No negociable

1. RLS en toda tabla de `public` y prueba de aislamiento por rol para cada tabla nueva.
2. Claves secretas solo en el servidor; nunca en `NEXT_PUBLIC_*`, logs, eventos ni Sentry.
3. Notas de bitácora, medicamentos y notas de contactos van cifrados; nunca en un aviso push.
4. Sin datos clínicos ni consejo médico.
5. La tía Sole está viva: nunca "en memoria".
6. Sin secretos ni build generado en git; no se editan migraciones aplicadas ni tipos generados.
7. Ninguna tarea se marca hecha con su compuerta fallando; los comandos de verificación no se editan.
8. Los agentes nunca envían correos.

Arquitectura completa, capas, tokens de diseño y reglas por área: `CLAUDE.md` en esta misma carpeta.
```

### 19.3 `.claude/settings.json`

Cada comando de los bloques `Verify` de §9 y de §20.1 está permitido, separado por subcomando (`test`, `grep` y `find` incluidos). Los comandos del Bootstrap que instalan o escriben archivos están permitidos con su texto exacto (las dos líneas `pnpm -C app add …` completas, `npm install -g --prefix "$HOME/.local" pnpm@12.18.0`, `pnpm -C app approve-builds esbuild supabase`, cada `printf` con su archivo de destino y los dos `cp` de la línea 6), nunca con comodines. No hay intérpretes, `curl`, `npx` ni `sh -c` comodín. Se niegan la lectura de `.env.local`/`.env.test.local`, `git push`, `supabase db push`, `supabase link` y la CLI de Vercel.

`.claude/settings.json` (`workspace/.claude/settings.json`):

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm -C app install --frozen-lockfile)",
      "Bash(pnpm -C app lint)",
      "Bash(pnpm -C app format)",
      "Bash(pnpm -C app typecheck)",
      "Bash(pnpm -C app build)",
      "Bash(pnpm -C app dev)",
      "Bash(pnpm -C app start:*)",
      "Bash(pnpm -C app test)",
      "Bash(pnpm -C app test tests/:*)",
      "Bash(pnpm -C app test:e2e)",
      "Bash(pnpm -C app test:e2e tests/e2e/:*)",
      "Bash(pnpm -C app db:start)",
      "Bash(pnpm -C app db:stop)",
      "Bash(pnpm -C app db:reset)",
      "Bash(pnpm -C app db:test)",
      "Bash(pnpm -C app db:types)",
      "Bash(pnpm -C app env:local)",
      "Bash(pnpm -C app cron:dispatch)",
      "Bash(pnpm -C app cron:daily)",
      "Bash(pnpm -C app exec supabase status:*)",
      "Bash(pnpm -C app exec biome ci .)",
      "Bash(pnpm -C app exec playwright install --with-deps chromium webkit)",
      "Bash(pnpm -C app exec tsx scripts/check-bundle-secrets.ts)",
      "Bash(pnpm -C app exec tsx scripts/check-alianzas.ts plantillas)",
      "Bash(pnpm -C app exec tsx scripts/check-alianzas.ts todo)",
      "Bash(pnpm -C app exec tsx scripts/rotate-field-key.ts --dry-run)",
      "Bash(pnpm -C app approve-builds esbuild supabase)",
      "Bash(pnpm -C app add -E next@16.4.6 react@19.3.1 react-dom@19.3.1 @supabase/supabase-js@2.119.0 @supabase/ssr@0.12.7 zod@4.6.7 react-hook-form@7.92.0 @hookform/resolvers@7.0.6 lucide-react@1.72.0 @serwist/next@9.5.13 idb@8.0.4 web-push@3.6.7 @sentry/nextjs@11.12.0 @marsidev/react-turnstile@1.6.3 recharts@3.10.1 date-fns@4.4.0 @date-fns/tz@1.5.0 html-to-image@1.11.13)",
      "Bash(pnpm -C app add -D -E typescript@~6.0.3 @types/node@^22 @types/react@19.3.0 @types/react-dom@19.3.0 tailwindcss@4.3.5 @tailwindcss/postcss@4.3.5 @biomejs/biome@2.6.7 vitest@5.1.0 @vitejs/plugin-react@6.3.0 jsdom@31.0.1 @testing-library/react@16.3.3 @playwright/test@1.65.1 @axe-core/playwright@4.14.0 serwist@9.5.13 @types/web-push@3.6.4 supabase@2.122.1 tsx@4.23.15)",
      "Bash(pnpm -C app add -D @testing-library/dom)",
      "Bash(pnpm create next-app@16.4.6 app --ts --app --tailwind --biome --src-dir --use-pnpm --import-alias \"@/*\" --disable-git --yes)",
      "Bash(npm --prefix app pkg set engines.node=\">=22.12.0 <23\" packageManager=\"pnpm@12.18.0\" scripts.dev=\"next dev --webpack\" scripts.build=\"next build --webpack\" scripts.start=\"next start\" scripts.lint=\"biome check .\" scripts.format=\"biome check --write .\" scripts.typecheck=\"next typegen && tsc --noEmit\" scripts.test=\"vitest run\" scripts.test:e2e=\"playwright test\" scripts.db:start=\"supabase start\" scripts.db:stop=\"supabase stop\" scripts.db:reset=\"supabase db reset\" scripts.db:test=\"supabase test db\" scripts.db:types=\"supabase gen types typescript --local --schema public > src/lib/supabase/database.types.ts\" scripts.env:local=\"supabase status -o json | tsx scripts/write-local-env.ts\" scripts.cron:dispatch=\"tsx scripts/trigger-cron.ts dispatch\" scripts.cron:daily=\"tsx scripts/trigger-cron.ts daily\")",
      "Bash(npm install -g --prefix \"$HOME/.local\" pnpm@12.18.0)",
      "Bash(pnpm -v)",
      "Bash(node -v)",
      "Bash(docker info:*)",
      "Bash(node -e \"require('node:fs').cpSync('blueprints/sole-prototipo/workspace', '.', { recursive: true, force: false })\")",
      "Bash(cp blueprints/sole-prototipo/workspace/app/biome.json app/biome.json)",
      "Bash(cp blueprints/sole-prototipo/workspace/app/postcss.config.mjs app/postcss.config.mjs)",
      "Bash(mkdir -p:*)",
      "Bash(test:*)",
      "Bash(grep:*)",
      "Bash(printf '%s\\n' \"$line\" >> .gitignore)",
      "Bash(printf '%s\\n' '!.env.example' >> app/.gitignore)",
      "Bash(printf '%s\\n' '* text=auto eol=lf' >> .gitattributes)",
      "Bash(touch .gitignore .gitattributes)",
      "Bash([:*)",
      "Bash(tail -n 1)",
      "Bash(find app/.next/static -name '*.map' -print -quit)",
      "Bash(sh .githooks/pre-commit)",
      "Bash(git config core.hooksPath)",
      "Bash(git config core.hooksPath .githooks)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git tag:*)",
      "Bash(git add -A)",
      "Bash(git commit:*)",
      "Bash(git ls-files:*)",
      "Bash(git check-ignore:*)",
      "Bash(git rev-list:*)",
      "Bash(git rev-parse:*)",
      "Bash(git init -b main)",
      "Bash(git reset --hard step-:*)"
    ],
    "deny": [
      "Read(./app/.env.local)",
      "Read(./app/.env.test.local)",
      "Read(./.env)",
      "Bash(git push:*)",
      "Bash(pnpm -C app exec supabase db push:*)",
      "Bash(pnpm -C app exec supabase link:*)",
      "Bash(vercel:*)"
    ]
  }
}
```

### 19.4 Project skills — `.claude/skills/<name>/SKILL.md`

| Skill | Triggers on | What it automates |
|---|---|---|
| `add-migration` | "agrega una columna / tabla / política" | migración a mano con RLS, privilegios, tipos y prueba |
| `add-route-handler` | "nuevo endpoint", "ruta de cron" | ruta con sesión, zod, errores tipados y límites |
| `add-rls-test` | "¿alguien ajeno puede leer esto?" | pruebas de aislamiento por rol con sesiones reales |
| `run-step-gate` | "sigue con la próxima tarea", "retoma" | protocolo de reanudación de `tasks.json`, compuerta, commit y etiqueta |

`.claude/skills/add-migration/SKILL.md` (`workspace/.claude/skills/add-migration/SKILL.md`):

````markdown
---
name: add-migration
description: Agrega un cambio de esquema a Supabase (tabla, columna, política RLS, función o índice). Úsala cuando haya que tocar la base de datos de Sole, crear una tabla nueva o cambiar permisos.
---

# Agregar una migración

## Cuándo usarla
- "Agrega una columna", "crea una tabla", "cambia una política", "nueva RPC".

## Pasos
1. Crea un archivo nuevo en `app/supabase/migrations/` con nombre `<AAAAMMDDHHMMSS>_<descripcion>.sql`, con una marca de tiempo mayor que la del último archivo. Nunca edites una migración ya aplicada.
2. Toda tabla nueva de `public`: `alter table … enable row level security;`, `revoke all … from anon, authenticated;`, luego `grant` mínimo y políticas que usen `private.is_member`, `private.is_caregiver` o `private.is_admin_mfa()`.
3. Columnas que la usuaria no debe tocar (`circle_id`, `created_by`, roles, marcas de admin): no las incluyas en el `grant update (…)`.
4. Funciones `security definer` siempre con `set search_path = ''` y nombres calificados (`public.tabla`).
5. `pnpm -C app db:reset` y `pnpm -C app db:types`.
6. Escribe la prueba de aislamiento con la skill `add-rls-test`.

## Verificar
```bash
pnpm -C app db:reset   # expect: exit 0
pnpm -C app db:test    # expect: exit 0 — incluye "todas las tablas de public tienen RLS"
pnpm -C app typecheck  # expect: exit 0
```

## No hacer
- No usar el editor de tablas del panel de Supabase para cambiar el esquema.
- No dejar una tabla sin RLS ni sin prueba.
````

`.claude/skills/add-route-handler/SKILL.md` (`workspace/.claude/skills/add-route-handler/SKILL.md`):

````markdown
---
name: add-route-handler
description: Crea una ruta de API de Next.js (app/src/app/api/**/route.ts) para Sole con sesión, validación zod, errores tipados y límites. Úsala al agregar un endpoint, un webhook o una ruta de cron.
---

# Agregar una ruta de API

## Cuándo usarla
- "Nuevo endpoint", "ruta para…", "API que reciba…".

## Pasos
1. La lógica va en `app/src/server/<área>/<archivo>.ts` y recibe sus dependencias (cliente, reloj, sender) para poder probarla.
2. `route.ts` solo: parsea con zod, obtiene la usuaria con `createSupabaseRouteClient(request)` (o compara `x-cron-secret` con `timingSafeEqual` en rutas de cron), llama al servidor y responde `Response.json({ ok, data | error })`.
3. Mapea errores: sin sesión 401 `unauthorized`, `42501` → 403 `forbidden`, no encontrado 404, zod 422 `validation_failed`, límite 429 `rate_limited`. Nunca devuelvas mensajes internos.
4. Si la ruta escribe o es pública, aplica `checkRateLimit` con un `scope` de `RATE_LIMITS`.
5. Si es pública, agrega su prefijo a `isPublicPath` en `app/src/lib/auth/route-rules.ts`.
6. Escribe la prueba en `app/tests/db/` llamando al handler exportado con un `Request` (sesión por `Authorization: Bearer <accessToken>`).

## Verificar
```bash
pnpm -C app typecheck                     # expect: exit 0
pnpm -C app test tests/db/<archivo>.test.ts  # expect: exit 0, 0 failed
```

## No hacer
- No agregar `access-control-allow-origin` salvo en `/api/web/contact`.
- No usar el cliente admin para lo que la usuaria puede hacer con su propia sesión.
````

`.claude/skills/add-rls-test/SKILL.md` (`workspace/.claude/skills/add-rls-test/SKILL.md`):

````markdown
---
name: add-rls-test
description: Escribe pruebas de aislamiento RLS por rol (cuidadora, familiar, persona ajena, anónimo, admin) contra el Supabase local. Úsala después de crear o cambiar una tabla, una política o una RPC.
---

# Probar aislamiento por rol

## Cuándo usarla
- Tabla o política nueva, RPC nueva, "¿alguien ajeno puede leer esto?".

## Pasos
1. Archivo `app/tests/db/<tema>.test.ts`. Usa `createTestUser`, `grantRequiredConsents` y `createCircleFor` de `app/tests/db/helpers.ts`; correos aleatorios, sin estado compartido.
2. Casos mínimos por tabla: dueña lee y escribe; otra cuidadora lee 0 filas e inserta con error `42501`; familiar lee pero no escribe (insert `42501`, update/delete 0 filas); anónimo recibe `42501`.
3. Columnas protegidas: un `update` de esa columna falla con `42501`.
4. Para admin: sesión `aal1` falla; `aal2` (TOTP con `app/tests/support/totp.ts`) funciona.

## Verificar
```bash
pnpm -C app test tests/db/<tema>.test.ts   # expect: exit 0, 0 failed
```

## No hacer
- No probar con el cliente admin lo que debe probarse con una sesión real: el admin se salta RLS.
````

`.claude/skills/run-step-gate/SKILL.md` (`workspace/.claude/skills/run-step-gate/SKILL.md`):

````markdown
---
name: run-step-gate
description: Ejecuta la compuerta de una tarea del plan de Sole (tasks.json), marca su estado y crea el commit y la etiqueta step-NN. Úsala al empezar o terminar una tarea, o al retomar después de un corte.
---

# Correr la compuerta de una tarea

## Cuándo usarla
- "Sigue con la próxima tarea", "retoma la construcción", "¿quedó lista esta tarea?".

## Pasos
1. Lee `blueprints/sole-prototipo/tasks.json` desde el disco. Si hay una tarea `in_progress`, corre su `verify` completo antes que nada.
2. Elige la primera tarea `pending` cuyas dependencias estén `done`, en el orden del arreglo. Márcala `in_progress` y guarda el archivo.
3. Abre su épica en `blueprints/sole-prototipo/epics/` y haz solo esa tarea.
4. Corre cada comando de `verify`, en orden, desde la raíz del repo. Si uno falla, arregla el código, nunca el comando.
5. Márcala `done`, guarda, y ejecuta el `Checkpoint` de la épica: `git add -A && git commit -m "<id>: <título>"` y `git tag <checkpoint>`.
6. Al cerrar una fase del brief (§9), detente y resume para el fundador: qué funciona, cómo probarlo, qué decidiste (`DECISIONES.md`) y qué necesitas. Mantén `PENDIENTES.md` al día.

## Verificar
```bash
git tag -l 'step-*'   # expect: una etiqueta por tarea terminada
```

## No hacer
- No saltarse una tarea bloqueada para "avanzar mientras tanto".
- No reordenar por prioridad: el orden del arreglo es el orden de construcción.
````

### 19.5 `.claude/rules/*.md`

| File | `paths` globs | Covers |
|---|---|---|
| `.claude/rules/database.md` | `app/supabase/**`, `app/src/lib/supabase/**` | esquema, RLS, RPC, migraciones |
| `.claude/rules/server.md` | `app/src/server/**`, `app/src/app/api/**`, `app/src/proxy.ts` | dependencias inyectadas, clientes, cron, tokens, fechas |
| `.claude/rules/ui.md` | `app/src/app/**/*.tsx`, `app/src/components/**` | tokens, accesibilidad, estados, textos |
| `.claude/rules/tests.md` | `app/tests/**`, `app/vitest.config.ts`, `app/playwright.config.ts` | capas de prueba, datos, reloj, axe |
| `.claude/rules/web.md` | `web/**` | reglas del sitio estático |
| `.claude/rules/docs.md` | `docs/**`, `alianzas/**`, `DECISIONES.md`, `PENDIENTES.md` | verificabilidad, decisiones, alianzas |

`.claude/rules/database.md` (`workspace/.claude/rules/database.md`):

```markdown
---
description: Convenciones de esquema, RLS y migraciones de Supabase
paths:
  - "app/supabase/**"
  - "app/src/lib/supabase/**"
---

# Base de datos

- El esquema vive solo en `app/supabase/migrations/*.sql`, escrito a mano con nombre `<AAAAMMDDHHMMSS>_<descripcion>.sql`. Una migración aplicada no se edita: se agrega otra.
- Toda tabla de `public` tiene RLS, `revoke all … from anon, authenticated` y `grant` mínimo explícito. `pnpm -C app db:test` lo comprueba.
- Pertenencia y roles solo con `private.is_member(circle_id)`, `private.is_caregiver(circle_id)`, `private.member_role_of(circle_id)` y `private.is_admin_mfa()`. No consultes `circle_members` dentro de una política (recursión).
- Columnas protegidas (`circle_id`, `created_by`, `role`, `is_admin`, `deletion_requested_at`, `deactivated_at`) nunca entran en un `grant update (…)` a `authenticated`.
- Escrituras de estado (marcar ocurrencias, crear círculos, aceptar invitaciones, cerrar círculos, tomar tareas) van por RPC `security definer` con `set search_path = ''`.
- `is_admin` se cambia solo con SQL manual del fundador; ninguna RPC lo toca.
- Campos `*_enc` guardan texto cifrado `v<n>.…` (la base lo valida con `check`); nunca texto plano.
- Inserciones donde la usuaria no puede leer la tabla (`feedback`, `events`): sin `.select()` después del `insert`.
- `database.types.ts` se regenera con `pnpm -C app db:types`; no se edita.
- `seed.sql` es solo local: nada de producción depende de él. El contenido real va en migraciones.
```

`.claude/rules/server.md` (`workspace/.claude/rules/server.md`):

```markdown
---
description: Convenciones de lógica de servidor, rutas de API y proxy
paths:
  - "app/src/server/**"
  - "app/src/app/api/**"
  - "app/src/proxy.ts"
---

# Servidor

- Funciones de `src/server/**` reciben sus dependencias (cliente de Supabase, cliente admin, `now`, `sender`, `mailer`) como parámetros: así se prueban sin red ni reloj real.
- Entradas validadas con zod; salida `{ ok: true, data } | { ok: false, error: { code, message } }`. Los mensajes son en español y nunca revelan detalles internos.
- `createSupabaseServerClient()` en Server Components y Actions; `createSupabaseRouteClient(request)` en Route Handlers; `createSupabaseAdminClient()` solo para cron, admin, resolución de tokens y materialización.
- Rutas de cron: solo `POST`, `x-cron-secret` comparado con `timingSafeEqual`, 401 sin él. Tareas idempotentes y con bloqueo (`acquire_job_lease`).
- Tokens (vínculo de persona cuidada, invitaciones, panel de organización): 32 bytes aleatorios en base64url; en la base solo su SHA-256 hex.
- Fechas: instantes en UTC; día local con `@date-fns/tz` en la zona del círculo (`America/Santiago` por defecto). Nunca la zona del servidor.
- Eventos con `track()`; nunca texto libre, nombre ni correo en `props`.
- `console.log` prohibido en `src/`; los errores van a Sentry (filtrados por `scrub.ts`).
```

`.claude/rules/ui.md` (`workspace/.claude/rules/ui.md`):

```markdown
---
description: Convenciones de interfaz, accesibilidad y textos de la app
paths:
  - "app/src/app/**/*.tsx"
  - "app/src/components/**"
---

# Interfaz

- Server Component por defecto; `"use client"` solo en la hoja interactiva.
- Solo clases de token (`bg-surface`, `text-fg-muted`, `border-border-strong`); cero hex o px sueltos para color.
- Controles de al menos 48 × 48 px; texto base 18 px; contraste ya resuelto por los tokens.
- Formularios con `Field` (label asociado, error con `role="alert"`, `aria-invalid`); grupos con `ChoiceGroup` (`fieldset` + `legend`).
- Estados de carga, vacío y error en toda lista y acción. Vacío con una frase cálida y la acción siguiente ("Todavía no hay recordatorios. Crea el primero.").
- Avisos de estado en regiones `aria-live="polite"`; nada se comunica solo con color.
- Nada de `dangerouslySetInnerHTML`; las notas se muestran como texto.
- Textos: español de Chile, tuteo cálido, frases cortas, sin jerga médica, sin culpa ni presión ("Vas 3 de 5 hoy", nunca "Fallaste").
- Nada fijo en pantalla puede tapar el elemento enfocado (WCAG 2.4.11).
```

`.claude/rules/tests.md` (`workspace/.claude/rules/tests.md`):

```markdown
---
description: Convenciones de pruebas unitarias, de base de datos y e2e
paths:
  - "app/tests/**"
  - "app/vitest.config.ts"
  - "app/playwright.config.ts"
---

# Pruebas

- `tests/unit/**` sin base de datos; `tests/db/**` contra el Supabase local (Docker abierto, `pnpm -C app db:start`); `tests/e2e/**` con Playwright contra el build en :3100.
- Variables: Vitest y Playwright cargan `.env.test.local` en su config; los scripts llaman a `loadLocalEnv()`. Si falta, corre `pnpm -C app env:local`.
- Cada prueba crea sus propias usuarias con correos aleatorios (`test-<uuid>@example.test`); ninguna depende de otra ni del orden.
- RLS se prueba con sesiones reales, nunca con el cliente admin.
- Reloj inyectado (`now`) en toda lógica con fechas; nada depende de la hora del equipo (`TZ=UTC` en `tests/setup/env.ts`).
- Componentes con `// @vitest-environment jsdom` en la primera línea.
- e2e: importaciones relativas (`./fixtures`); accesibilidad con `expectNoAxeViolations` (0 violaciones, tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa).
- Prohibido `.skip` y `.only` en archivos versionados.
- `vitest.config.ts` y `playwright.config.ts` vienen del plano: no se editan.
```

`.claude/rules/web.md` (`workspace/.claude/rules/web.md`):

```markdown
---
description: Reglas del sitio estático solecuida.com
paths:
  - "web/**"
---

# Sitio web

- Sitio estático sin build ni dependencias; diseño de carta editorial (Fraunces, Newsreader, Courier Prime, Caveat). La app tiene otro diseño.
- La tía Sole está viva y es cuidadora: nunca "en memoria". La Nonó (la mamá del fundador, fallecida) no se menciona en la app.
- `--tinta-tenue` mantiene al menos 4.5:1 sobre `--papel` y `--papel-hueco` en ambos temas; no se aclara.
- No se agrega botón de WhatsApp ni ficha de Google Business.
- Una sola llamada a la acción principal por página ("Probar Sole"), después del primer párrafo y fija en el celular.
- Título y meta descripción únicos por página; un solo `<h1>`; JSON-LD `Organization`, `WebSite` y `FAQPage` (nunca `LocalBusiness`).
- Nunca escribir que Sole detecta, diagnostica, predice, monitorea clínicamente, mejora la salud o reduce el estrés. Sin logos ni nombres de organizaciones sin permiso escrito.
- Analítica: solo Vercel Web Analytics (sin cookies) y Google Search Console. Nunca GA4.
- `pnpm -C app test tests/unit/web-site.test.ts` revisa estas reglas.
```

`.claude/rules/docs.md` (`workspace/.claude/rules/docs.md`):

```markdown
---
description: Reglas de documentación, decisiones, pendientes y alianzas
paths:
  - "docs/**"
  - "alianzas/**"
  - "DECISIONES.md"
  - "PENDIENTES.md"
---

# Documentos

- Español de Chile, claro, para que el fundador lo entienda y lo use solo.
- Todo dato verificable (teléfonos, leyes, programas, direcciones, límites de planes) lleva fuente oficial con URL y fecha, o el marcador `[VERIFICAR]`. Nunca se inventa.
- `DECISIONES.md`: una fila por decisión A CRITERIO (decisión, alternativa descartada, por qué, fecha).
- `PENDIENTES.md`: al día antes de detenerse, por prioridad, con instrucciones para retomar.
- `docs/diseno/` debe coincidir con lo construido.
- `alianzas/`: solo datos institucionales públicos, nunca de personas. Los correos los envía el fundador; los agentes solo preparan textos.
- `docs/eventos.md` y `src/server/events/catalog.ts` cambian juntos.
```

### 19.6 Verify-critical config and local infrastructure

| File | Path in the project | Which `Verify` commands need it | Resolution/env handling it carries | Bundle-path exclusion |
|---|---|---|---|---|
| Biome config | `app/biome.json` | todo `pnpm -C app lint` (pasos paso 1 (`esqueleto`) en adelante) | `linter.rules.preset: "recommended"` (Biome 2.6 marca `recommended: true` como obsoleto); `css.parser.tailwindDirectives: true`; excluye `**/*.svg`, tipos generados, `public/sw.js`; no lee variables | `"!**/blueprints"` en `files.includes` (además Biome corre con raíz `app/`, que no contiene `blueprints/`) |
| PostCSS | `app/postcss.config.mjs` (impuesto por Bootstrap línea 6 sobre el del scaffold) | `pnpm -C app build` y `test:e2e` | `@tailwindcss/postcss` (el build usa webpack); no lee variables | n/a — no recorre el árbol; procesa solo los CSS que importa Next |
| Vitest | `app/vitest.config.ts` | todo `pnpm -C app test …` | alias `@` → `app/src`; plugin React; carga `.env.test.local` con `process.loadEnvFile`; `fileParallelism: false` | `exclude: ["**/blueprints/**"]`; además `include` se limita a `tests/unit` y `tests/db` dentro de `app/` |
| Playwright | `app/playwright.config.ts` | todo `pnpm -C app test:e2e …` | carga `.env.test.local`; `webServer` = `pnpm build && pnpm start --port 3100`, espera `/api/health`; Pixel 7 y iPhone 13 | `testIgnore: ["**/blueprints/**"]`; `testDir` es `tests/e2e` dentro de `app/` |
| Setup de pruebas | `app/tests/setup/env.ts` | todo `pnpm -C app test …` | carga `.env.test.local` en cada worker; `TZ=UTC` | n/a — no recorre el árbol |
| Variables locales | `app/scripts/write-local-env.ts` | `pnpm -C app env:local` (Bootstrap y CI) | lee el JSON de `supabase status -o json` por stdin; genera VAPID y secretos; escribe `.env.local` y `.env.test.local` | n/a — no recorre el árbol |
| Cargador para scripts | `app/scripts/lib/load-env.ts` | `scripts/trigger-cron.ts`, `check-bundle-secrets.ts`, `rotate-field-key.ts`, `check-alianzas.ts` | `loadLocalEnv()` con `process.loadEnvFile` | n/a — no recorre el árbol |
| Supabase local | `app/supabase/config.toml` | `db:start`, `db:reset`, `db:test`, `db:types` y toda prueba de `tests/db/` | puertos 54321 (API), 54322 (base), 54323 (Studio), 54324 (correo); Postgres 17; seed; MFA TOTP; plantilla del enlace; sin storage, realtime, edge ni analytics; no lee variables | n/a — la CLI lee solo `app/supabase/` |
| Migraciones | `app/supabase/migrations/20261114000100_base.sql`, `…200_cuidado.sql`, `…300_contenido_y_escucha.sql`, `…400_cron.sql` | `db:reset` y todas las pruebas de base | SQL; nombres fijados a mano | n/a — no es un config |
| Datos locales | `app/supabase/seed.sql` | `db:reset`, `connection.test.ts`, `content.test.ts` | solo local | n/a |
| pgTAP | `app/supabase/tests/database.test.sql` | `pnpm -C app db:test` | `plan(6)` = las seis aserciones del archivo | n/a |
| Plantilla de correo | `app/supabase/templates/magic-link.html` | `db:start` (la referencia `config.toml`) | `{{ .SiteURL }}/auth/confirm?token_hash=…&type=email` | n/a |
| Contrato de variables | `app/.env.example` | `tests/unit/env-example.test.ts` (paso paso 53 (`checklist-lanzamiento`)) | sin valores reales | n/a |

**Servicios de las compuertas (cuatro partes):** (1) `app/supabase/config.toml` define el Supabase local que levanta la CLI con Docker (imágenes elegidas por la CLI fijada en §11, `supabase@2.122.1`; la CLI espera a que los servicios estén sanos antes de salir); (2) la variable que apunta a él es `SUPABASE_URL` (local `http://127.0.0.1:54321`, escrita por `env:local` desde `supabase status`) más sus claves, en §10; (3) arriba/abajo/reinicio: `pnpm -C app db:start`, `pnpm -C app db:stop`, `pnpm -C app db:reset`, en §10 y en la tabla de comandos de §19.1; (4) los tres están en `permissions.allow` de §19.3.

#### Contenido literal de los archivos emitidos

Mismos bytes que `workspace/` (el Bootstrap los copia; ningún paso los reescribe salvo `app/.env.example`, que el paso paso 53 (`checklist-lanzamiento`) completa).

`app/biome.json` (`workspace/app/biome.json`):

```json
{
  "$schema": "https://biomejs.dev/schemas/2.6.7/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": true,
    "includes": [
      "**",
      "!**/node_modules",
      "!**/.next",
      "!**/blueprints",
      "!**/*.svg",
      "!**/next-env.d.ts",
      "!**/src/lib/supabase/database.types.ts",
      "!**/public/sw.js",
      "!**/public/swe-worker-*.js",
      "!**/supabase/.temp",
      "!**/test-results",
      "!**/playwright-report"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "preset": "recommended"
    },
    "domains": {
      "next": "recommended",
      "react": "recommended"
    }
  },
  "assist": {
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  },
  "css": {
    "parser": {
      "tailwindDirectives": true
    }
  }
}
```

`app/postcss.config.mjs` (`workspace/app/postcss.config.mjs`):

```js
// Tailwind v4 vía PostCSS: el build usa `next build --webpack` (lo exige @serwist/next),
// y con webpack el cargador de Turbopack no hace nada.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

`app/vitest.config.ts` (`workspace/app/vitest.config.ts`):

```ts
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Vitest no carga .env por sí solo: este archivo lo genera `pnpm -C app env:local`.
if (existsSync(".env.test.local")) {
  process.loadEnvFile(".env.test.local");
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/db/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/blueprints/**", "tests/e2e/**"],
    setupFiles: ["tests/setup/env.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
```

`app/playwright.config.ts` (`workspace/app/playwright.config.ts`):

```ts
import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Playwright no carga .env por sí solo: este archivo lo genera `pnpm -C app env:local`.
if (existsSync(".env.test.local")) {
  process.loadEnvFile(".env.test.local");
}

export default defineConfig({
  testDir: "tests/e2e",
  testIgnore: ["**/blueprints/**"],
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    locale: "es-CL",
    timezoneId: "America/Santiago",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "android-gama-media", use: { ...devices["Pixel 7"] } },
    { name: "iphone-safari", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm start --port 3100",
    url: "http://localhost:3100/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
```

`app/tests/setup/env.ts` (`workspace/app/tests/setup/env.ts`):

```ts
import { existsSync } from "node:fs";

// Cada worker de Vitest vuelve a cargar las variables locales (no pisa las ya definidas).
if (existsSync(".env.test.local")) {
  process.loadEnvFile(".env.test.local");
}

process.env.TZ = "UTC";
```

`app/scripts/write-local-env.ts` (`workspace/app/scripts/write-local-env.ts`):

```ts
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import webpush from "web-push";

// Uso (desde app/): pnpm env:local
//   = supabase status -o json | tsx scripts/write-local-env.ts
// Escribe .env.local (next dev/start) y .env.test.local (Vitest/Playwright) con los
// valores del Supabase local. Conserva los secretos generados si el archivo ya existe,
// para que los datos cifrados en local sigan legibles.

type Status = Record<string, string | undefined>;

function readStdin(): string {
  return readFileSync(0, "utf8");
}

function parseExisting(file: string): Map<string, string> {
  const values = new Map<string, string>();
  if (!existsSync(file)) {
    return values;
  }
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (match?.[1] && match[2] !== undefined && match[2] !== "") {
      values.set(match[1], match[2]);
    }
  }
  return values;
}

function pick(status: Status, names: string[]): string {
  for (const name of names) {
    const value = status[name];
    if (value) {
      return value;
    }
  }
  throw new Error(`supabase status no entregó ninguna de: ${names.join(", ")}`);
}

function main(): void {
  const raw = readStdin();
  const start = raw.indexOf("{");
  if (start === -1) {
    throw new Error("No llegó JSON por stdin. ¿Está corriendo `pnpm db:start`?");
  }
  const status = JSON.parse(raw.slice(start)) as Status;
  const previous = parseExisting(".env.local");
  const vapid = webpush.generateVAPIDKeys();

  const keep = (name: string, fresh: () => string): string =>
    previous.get(name) ?? fresh();

  const values: Array<[string, string]> = [
    ["APP_URL", "http://localhost:3000"],
    ["SUPABASE_URL", pick(status, ["API_URL"])],
    ["SUPABASE_PUBLISHABLE_KEY", pick(status, ["PUBLISHABLE_KEY", "ANON_KEY"])],
    ["SUPABASE_SECRET_KEY", pick(status, ["SECRET_KEY", "SERVICE_ROLE_KEY"])],
    [
      "FIELD_ENCRYPTION_KEY",
      keep("FIELD_ENCRYPTION_KEY", () => `1:${randomBytes(32).toString("base64")}`),
    ],
    ["CRON_SECRET", keep("CRON_SECRET", () => randomBytes(32).toString("hex"))],
    ["IP_HASH_SECRET", keep("IP_HASH_SECRET", () => randomBytes(32).toString("hex"))],
    [
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
      keep("NEXT_PUBLIC_VAPID_PUBLIC_KEY", () => vapid.publicKey),
    ],
    ["VAPID_PRIVATE_KEY", keep("VAPID_PRIVATE_KEY", () => vapid.privateKey)],
    ["VAPID_SUBJECT", "mailto:hola@solecuida.com"],
    ["WEB_ALLOWED_ORIGINS", "http://localhost:5500"],
  ];

  const render = (appUrl: string): string =>
    `${values
      .map(([key, value]) => `${key}=${key === "APP_URL" ? appUrl : value}`)
      .join("\n")}\n`;
  // next dev usa :3000; las pruebas e2e levantan el build en :3100.
  writeFileSync(".env.local", render("http://localhost:3000"));
  writeFileSync(".env.test.local", render("http://localhost:3100"));
  process.stdout.write("Listo: .env.local y .env.test.local\n");
}

main();
```

`app/scripts/lib/load-env.ts` (`workspace/app/scripts/lib/load-env.ts`):

```ts
import { existsSync } from "node:fs";

// Los scripts con tsx no cargan .env por sí solos. Todo script de scripts/ llama a esto primero.
export function loadLocalEnv(): void {
  for (const file of [".env.local", ".env.test.local"]) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
    }
  }
}
```

`app/.env.example` (`workspace/app/.env.example`):

```bash
# Sole · variables de entorno. Este archivo SÍ se versiona; nunca lleva valores reales.
# En local, `pnpm -C app env:local` escribe .env.local y .env.test.local con valores locales.
# En producción, cada valor se carga en Vercel → Project → Settings → Environment Variables.

APP_URL=http://localhost:3000
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
FIELD_ENCRYPTION_KEY=
FIELD_ENCRYPTION_KEY_PREVIOUS=
CRON_SECRET=
IP_HASH_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:hola@solecuida.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
RESEND_API_KEY=
EMAIL_FROM=
WEB_CONTACT_SUPABASE_URL=
WEB_CONTACT_SUPABASE_SECRET_KEY=
WEB_ALLOWED_ORIGINS=
```

`app/supabase/config.toml` (`workspace/app/supabase/config.toml`):

```toml
# Configuración de Supabase para desarrollo local (Supabase CLI). Producción se configura en el panel.
# Las claves omitidas toman el valor por defecto de la CLI.
project_id = "sole"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 17

[db.seed]
enabled = true
sql_paths = ["./seed.sql"]

[realtime]
enabled = false

[studio]
enabled = true
port = 54323

[inbucket]
enabled = true
port = 54324

[storage]
enabled = false

[edge_runtime]
enabled = false

[analytics]
enabled = false

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/confirm", "http://localhost:3100/auth/confirm"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true
minimum_password_length = 10
password_requirements = "lower_upper_letters_digits"

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[auth.email.template.magic_link]
subject = "Tu enlace para entrar a Sole"
content_path = "./supabase/templates/magic-link.html"

[auth.mfa]
max_enrolled_factors = 10

[auth.mfa.totp]
enroll_enabled = true
verify_enabled = true

# Límites de Auth SOLO para local: las pruebas crean e inician sesión con cientos de usuarias
# desde 127.0.0.1. Producción usa los límites del panel de Supabase.
[auth.rate_limit]
email_sent = 2
sign_in_sign_ups = 1000
token_refresh = 1000
token_verifications = 1000
```

`app/supabase/seed.sql` (`workspace/app/supabase/seed.sql`):

```sql
-- Datos SOLO para desarrollo local (supabase db reset). Nunca se cargan en producción:
-- la CLI aplica seed.sql únicamente en la base local.
insert into public.organizations (code, name, kind)
values ('DEMO-LOCAL', 'Organización de prueba local', 'otro')
on conflict (code) do nothing;

insert into public.resources (name, description, url, source_url, verified_at, region)
values (
  'Recurso de prueba (solo local)',
  'Fila de ejemplo para probar el directorio en desarrollo. No existe en producción.',
  'https://example.org/',
  'https://example.org/',
  current_date,
  'nacional'
);
```

`app/supabase/tests/database.test.sql` (`workspace/app/supabase/tests/database.test.sql`):

```sql
-- Pruebas pgTAP del esquema. Se ejecutan con `pnpm -C app db:test` (supabase test db).
begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

select is(
  (select count(*)::int from pg_catalog.pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'todas las tablas de public tienen RLS activo'
);

select ok(
  exists (select 1 from cron.job where jobname = 'sole-dispatch'),
  'el trabajo sole-dispatch está programado'
);

select ok(
  exists (select 1 from cron.job where jobname = 'sole-daily'),
  'el trabajo sole-daily está programado'
);

select is(
  (select count(*)::int from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_admin'
     and grantee = 'authenticated' and privilege_type = 'UPDATE'),
  0,
  'authenticated no puede actualizar profiles.is_admin'
);

select ok(
  not has_function_privilege('authenticated', 'public.purge_user(uuid)', 'execute'),
  'authenticated no puede ejecutar purge_user'
);

select ok(
  not has_function_privilege('anon', 'public.rate_limit_hit(text, integer, integer)', 'execute'),
  'anon no puede ejecutar rate_limit_hit'
);

select * from finish();
rollback;
```

`app/supabase/templates/magic-link.html` (`workspace/app/supabase/templates/magic-link.html`):

```html
<h2>Entra a Sole</h2>
<p>Hola. Toca el botón para entrar a Sole. El enlace sirve una sola vez y dura una hora.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/hoy">Entrar a Sole</a></p>
<p>Si no pediste este correo, no tienes que hacer nada.</p>
<p>Sole · hola@solecuida.com</p>
```

`app/supabase/migrations/20261114000100_base.sql` (`workspace/app/supabase/migrations/20261114000100_base.sql`):

```sql
-- Sole · migración base (escrita a mano; el nombre lo fija el plano, no la CLI).
-- Perfiles, consentimientos, organizaciones, círculos de cuidado, miembros,
-- invitaciones (F16), vínculos de persona cuidada (F12), auditoría de admin,
-- eventos de investigación, límites de frecuencia y bloqueos de trabajos.
-- Regla: RLS en TODAS las tablas de public; escrituras sensibles solo por RPC.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create type public.member_role as enum ('caregiver', 'family', 'cared', 'professional');

create type public.care_type as enum (
  'adulto_mayor',
  'demencias',
  'dialisis',
  'discapacidad_fisica',
  'discapacidad_intelectual',
  'cronica_general',
  'recuperacion_cirugia',
  'ninez_necesidades_especiales',
  'desde_cero'
);

create type public.consent_layer as enum ('terms', 'sensitive', 'research');

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- ---------------------------------------------------------------- organizaciones
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{3,32}$'),
  name text not null check (char_length(name) between 2 and 200),
  kind text not null check (kind in ('fundacion', 'municipio', 'centro_salud', 'agrupacion', 'asociacion_pacientes', 'otro')),
  dashboard_token_hash text unique check (dashboard_token_hash is null or char_length(dashboard_token_hash) = 64),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- perfiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  timezone text not null default 'America/Santiago'
    check (timezone in ('America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter')),
  pseudonym_id uuid not null unique default gen_random_uuid(),
  org_code text references public.organizations (code) on update cascade on delete set null,
  is_admin boolean not null default false,
  followup_minutes smallint not null default 15 check (followup_minutes between 5 and 120),
  journal_reminder_time time,
  onboarding_completed_at timestamptz,
  last_active_at timestamptz not null default now(),
  deactivated_at timestamptz,
  deletion_requested_at timestamptz,
  inactivity_notice_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
for each row execute function private.touch_updated_at();

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_org text;
begin
  v_org := upper(nullif(trim(new.raw_user_meta_data ->> 'org_code'), ''));
  if v_org is not null and not exists (
    select 1 from public.organizations o where o.code = v_org and o.active
  ) then
    v_org := null;
  end if;
  insert into public.profiles (id, org_code) values (new.id, v_org);
  return new;
end
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------- consentimientos (solo se agregan filas)
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  layer public.consent_layer not null,
  version text not null check (version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  granted boolean not null,
  -- clock_timestamp(): dos filas de la misma transacción quedan ordenadas (now() sería igual para ambas)
  created_at timestamptz not null default clock_timestamp()
);

create index consents_user_layer_idx on public.consents (user_id, layer, created_at desc);

-- ---------------------------------------------------------------- círculos de cuidado
create table public.circles (
  id uuid primary key default gen_random_uuid(),
  cared_name text not null check (char_length(cared_name) between 1 and 60),
  relation text not null check (char_length(relation) between 1 and 40),
  care_type public.care_type not null,
  timezone text not null default 'America/Santiago'
    check (timezone in ('America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  closed_at timestamptz,
  closed_reason text check (closed_reason in ('fallecimiento', 'ya_no_cuido', 'otro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index circles_created_by_idx on public.circles (created_by);

create trigger circles_touch before update on public.circles
for each row execute function private.touch_updated_at();

create table public.circle_members (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null,
  display_name text not null check (char_length(display_name) between 1 and 60),
  notify_kinds text[] not null default '{important_date,appointment,emergency}'
    check (notify_kinds <@ array['medication', 'food', 'activity', 'appointment', 'errand', 'important_date', 'custom', 'emergency']::text[]),
  created_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create index circle_members_user_idx on public.circle_members (user_id);

-- ---------------------------------------------------------------- funciones de pertenencia (evitan recursión de RLS)
create function private.member_role_of(p_circle uuid) returns public.member_role
language sql stable security definer set search_path = '' as $$
  select m.role from public.circle_members m
  where m.circle_id = p_circle and m.user_id = (select auth.uid())
$$;

create function private.is_member(p_circle uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.circle_members m
    where m.circle_id = p_circle and m.user_id = (select auth.uid())
  )
$$;

create function private.is_caregiver(p_circle uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.circle_members m
    where m.circle_id = p_circle and m.user_id = (select auth.uid()) and m.role = 'caregiver'
  )
$$;

create function private.is_admin_mfa() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false)
    and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
$$;

create function private.has_required_consents(p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
      select c.granted from public.consents c
      where c.user_id = p_uid and c.layer = 'terms'
      order by c.created_at desc limit 1
    ), false)
    and coalesce((
      select c.granted from public.consents c
      where c.user_id = p_uid and c.layer = 'sensitive'
      order by c.created_at desc limit 1
    ), false)
$$;

revoke all on function private.member_role_of(uuid) from public;
revoke all on function private.is_member(uuid) from public;
revoke all on function private.is_caregiver(uuid) from public;
revoke all on function private.is_admin_mfa() from public;
revoke all on function private.has_required_consents(uuid) from public;
grant execute on function private.member_role_of(uuid) to authenticated, service_role;
grant execute on function private.is_member(uuid) to authenticated, service_role;
grant execute on function private.is_caregiver(uuid) to authenticated, service_role;
grant execute on function private.is_admin_mfa() to authenticated, service_role;
grant execute on function private.has_required_consents(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------- invitaciones de familiares (F16)
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index invitations_circle_idx on public.invitations (circle_id);

-- ---------------------------------------------------------------- vínculos de la persona cuidada (F12)
create table public.cared_links (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  label text check (char_length(label) <= 60),
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index cared_links_circle_idx on public.cared_links (circle_id);

-- ---------------------------------------------------------------- auditoría de accesos administrativos
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) between 1 and 80),
  target text check (char_length(target) <= 200),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- eventos de investigación (seudónimos, sin texto libre)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  pseudonym_id uuid not null,
  name text not null check (name ~ '^[a-z]+(_[a-z]+)*\.[a-z]+(_[a-z]+)*$'),
  props jsonb not null default '{}'::jsonb
    check (jsonb_typeof(props) = 'object' and pg_column_size(props) < 2048),
  org_code text,
  technical boolean not null default false,
  created_at timestamptz not null default now()
);

create index events_name_created_idx on public.events (name, created_at);
create index events_pseudonym_idx on public.events (pseudonym_id, created_at);

-- ---------------------------------------------------------------- límites de frecuencia y bloqueos (solo service_role)
create table private.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

create table private.job_leases (
  name text primary key,
  locked_until timestamptz not null default 'epoch'
);

insert into private.job_leases (name) values ('dispatch'), ('daily');

create function public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid_rate_limit' using errcode = '22023';
  end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into private.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;
  return v_hits <= p_limit;
end
$$;

create function public.cleanup_rate_limits() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  delete from private.rate_limits where window_start < now() - interval '1 day';
  get diagnostics v_count = row_count;
  return v_count;
end
$$;

create function public.acquire_job_lease(p_name text, p_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update private.job_leases
  set locked_until = now() + make_interval(secs => p_seconds)
  where name = p_name and locked_until < now();
  return found;
end
$$;

create function public.release_job_lease(p_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update private.job_leases set locked_until = 'epoch' where name = p_name;
end
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.cleanup_rate_limits() from public, anon, authenticated;
revoke all on function public.acquire_job_lease(text, integer) from public, anon, authenticated;
revoke all on function public.release_job_lease(text) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
grant execute on function public.cleanup_rate_limits() to service_role;
grant execute on function public.acquire_job_lease(text, integer) to service_role;
grant execute on function public.release_job_lease(text) to service_role;

-- ---------------------------------------------------------------- RPC: crear círculo + membresía de cuidadora (atómico)
create function public.create_circle(
  p_cared_name text,
  p_relation text,
  p_care_type public.care_type,
  p_display_name text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not private.has_required_consents(v_uid) then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  insert into public.circles (cared_name, relation, care_type, created_by)
  values (p_cared_name, p_relation, p_care_type, v_uid)
  returning id into v_id;
  insert into public.circle_members (circle_id, user_id, role, display_name, notify_kinds)
  values (v_id, v_uid, 'caregiver', p_display_name,
          '{medication,food,activity,appointment,errand,important_date,custom,emergency}');
  return v_id;
end
$$;

revoke all on function public.create_circle(text, text, public.care_type, text) from public, anon;
grant execute on function public.create_circle(text, text, public.care_type, text) to authenticated;

-- ---------------------------------------------------------------- RPC: aceptar invitación (F16)
create function public.accept_invitation(p_token_hash text, p_display_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.invitations;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not private.has_required_consents(v_uid) then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  select * into v_inv from public.invitations i
  where i.token_hash = p_token_hash
  for update;
  if not found or v_inv.revoked_at is not null or v_inv.accepted_at is not null
     or v_inv.expires_at < now() then
    raise exception 'invitation_invalid' using errcode = 'P0002';
  end if;
  insert into public.circle_members (circle_id, user_id, role, display_name)
  values (v_inv.circle_id, v_uid, 'family', p_display_name)
  on conflict (circle_id, user_id) do nothing;
  update public.invitations
  set accepted_by = v_uid, accepted_at = now()
  where id = v_inv.id;
  return v_inv.circle_id;
end
$$;

revoke all on function public.accept_invitation(text, text) from public, anon;
grant execute on function public.accept_invitation(text, text) to authenticated;

-- ---------------------------------------------------------------- RPC: preferencias de aviso de un miembro (F16)
create function public.set_member_notify_kinds(p_circle uuid, p_user uuid, p_kinds text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not (private.is_caregiver(p_circle) or (p_user = v_uid and private.is_member(p_circle))) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.circle_members
  set notify_kinds = p_kinds
  where circle_id = p_circle and user_id = p_user;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
end
$$;

revoke all on function public.set_member_notify_kinds(uuid, uuid, text[]) from public, anon;
grant execute on function public.set_member_notify_kinds(uuid, uuid, text[]) to authenticated;

-- ---------------------------------------------------------------- RLS y privilegios
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.invitations enable row level security;
alter table public.cared_links enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.events enable row level security;

revoke all on public.organizations, public.profiles, public.consents, public.circles,
  public.circle_members, public.invitations, public.cared_links, public.admin_audit_log,
  public.events from anon, authenticated;

-- organizaciones: solo admin con MFA
grant select, insert, update on public.organizations to authenticated;
create policy organizations_admin_select on public.organizations for select to authenticated
  using ((select private.is_admin_mfa()));
create policy organizations_admin_insert on public.organizations for insert to authenticated
  with check ((select private.is_admin_mfa()));
create policy organizations_admin_update on public.organizations for update to authenticated
  using ((select private.is_admin_mfa())) with check ((select private.is_admin_mfa()));

-- perfiles: cada quien el suyo; admin con MFA puede leer (métricas por cohorte); is_admin nunca se concede
grant select on public.profiles to authenticated;
grant update (display_name, timezone, followup_minutes, journal_reminder_time,
  onboarding_completed_at, last_active_at) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin_mfa()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- consentimientos: se leen y se agregan, nunca se editan ni se borran
grant select, insert on public.consents to authenticated;
create policy consents_select_own on public.consents for select to authenticated
  using (user_id = (select auth.uid()));
create policy consents_insert_own on public.consents for insert to authenticated
  with check (user_id = (select auth.uid()));

-- círculos: los ven sus miembros; solo la cuidadora edita campos de presentación
grant select on public.circles to authenticated;
grant update (cared_name, relation, care_type, timezone) on public.circles to authenticated;
create policy circles_select_member on public.circles for select to authenticated
  using (private.is_member(id));
create policy circles_update_caregiver on public.circles for update to authenticated
  using (private.is_caregiver(id)) with check (private.is_caregiver(id));

-- miembros: lectura para miembros; escrituras solo por RPC
grant select on public.circle_members to authenticated;
create policy circle_members_select on public.circle_members for select to authenticated
  using (private.is_member(circle_id));

-- invitaciones: gestiona la cuidadora
grant select, insert on public.invitations to authenticated;
grant update (revoked_at) on public.invitations to authenticated;
create policy invitations_select on public.invitations for select to authenticated
  using (private.is_caregiver(circle_id));
create policy invitations_insert on public.invitations for insert to authenticated
  with check (private.is_caregiver(circle_id) and created_by = (select auth.uid()));
create policy invitations_update on public.invitations for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));

-- vínculos de persona cuidada: gestiona la cuidadora; la resolución del token es del servidor
grant select, insert on public.cared_links to authenticated;
grant update (revoked_at) on public.cared_links to authenticated;
create policy cared_links_select on public.cared_links for select to authenticated
  using (private.is_caregiver(circle_id));
create policy cared_links_insert on public.cared_links for insert to authenticated
  with check (private.is_caregiver(circle_id) and created_by = (select auth.uid()));
create policy cared_links_update on public.cared_links for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));

-- auditoría: escribe y lee solo admin con MFA
grant select, insert on public.admin_audit_log to authenticated;
create policy admin_audit_select on public.admin_audit_log for select to authenticated
  using ((select private.is_admin_mfa()));
create policy admin_audit_insert on public.admin_audit_log for insert to authenticated
  with check ((select private.is_admin_mfa()) and admin_id = (select auth.uid()));

-- eventos: la usuaria inserta con su seudónimo; solo admin con MFA lee
grant insert on public.events to authenticated;
grant select on public.events to authenticated;
create policy events_insert_own on public.events for insert to authenticated
  with check (pseudonym_id = (select p.pseudonym_id from public.profiles p where p.id = (select auth.uid())));
create policy events_admin_select on public.events for select to authenticated
  using ((select private.is_admin_mfa()));
```

`app/supabase/migrations/20261114000200_cuidado.sql` (`workspace/app/supabase/migrations/20261114000200_cuidado.sql`):

```sql
-- Sole · migración del día a día (escrita a mano).
-- Recordatorios (F3), ocurrencias materializadas, marcas idempotentes, suscripciones push,
-- tareas (F5), bitácora (F6), bienestar de la cuidadora (F8), contactos (F9), emergencias (F12).

create type public.reminder_kind as enum (
  'medication', 'food', 'activity', 'appointment', 'errand', 'important_date', 'custom'
);
create type public.importance as enum ('important', 'normal', 'whenever');
create type public.occurrence_status as enum ('pending', 'done', 'not_done', 'snoozed', 'skipped');
create type public.occurrence_kind as enum ('main', 'advance');

-- ---------------------------------------------------------------- recordatorios
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  kind public.reminder_kind not null,
  importance public.importance not null default 'normal',
  title text not null check (char_length(title) between 1 and 120),
  med_name_enc text check (med_name_enc is null or med_name_enc ~ '^v[0-9]+\.'),
  med_instructions_enc text check (med_instructions_enc is null or med_instructions_enc ~ '^v[0-9]+\.'),
  rule jsonb not null check (jsonb_typeof(rule) = 'object' and rule ? 'freq' and rule ? 'startDate'),
  advance_days smallint[] not null default '{}'
    check (coalesce(array_length(advance_days, 1), 0) <= 5),
  visible_to_cared boolean not null default false,
  active boolean not null default true,
  source text not null default 'manual' check (source in ('manual', 'template', 'tip')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reminders_circle_active_idx on public.reminders (circle_id) where active;

create trigger reminders_touch before update on public.reminders
for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- ocurrencias (materializadas 48 h hacia adelante)
create table public.reminder_occurrences (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.reminders (id) on delete cascade,
  circle_id uuid not null references public.circles (id) on delete cascade,
  kind public.occurrence_kind not null default 'main',
  advance_days smallint not null default 0 check (advance_days between 0 and 30),
  due_at timestamptz not null,
  event_at timestamptz not null,
  local_date date not null,
  status public.occurrence_status not null default 'pending',
  not_done_reason text check (not_done_reason in ('rechazo', 'no_habia', 'otro')),
  snoozed_until timestamptz,
  done_by uuid references public.profiles (id) on delete set null,
  done_via text check (done_via in ('app', 'push', 'offline_sync', 'cared_link')),
  done_at timestamptz,
  notified_at timestamptz,
  followup_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reminder_id, kind, event_at, advance_days)
);

create index occurrences_circle_date_idx on public.reminder_occurrences (circle_id, local_date);
create index occurrences_dispatch_idx on public.reminder_occurrences (due_at)
  where status in ('pending', 'snoozed');

-- ---------------------------------------------------------------- marcas idempotentes (historial de quién marcó qué)
create table public.occurrence_marks (
  idempotency_key uuid primary key,
  occurrence_id uuid not null references public.reminder_occurrences (id) on delete cascade,
  circle_id uuid not null references public.circles (id) on delete cascade,
  marked_by uuid references public.profiles (id) on delete set null,
  status public.occurrence_status not null check (status in ('done', 'not_done', 'snoozed')),
  via text not null check (via in ('app', 'push', 'offline_sync', 'cared_link')),
  created_at timestamptz not null default now()
);

create index occurrence_marks_occurrence_idx on public.occurrence_marks (occurrence_id);

-- ---------------------------------------------------------------- suscripciones Web Push
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://'),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  user_agent text check (char_length(user_agent) <= 300),
  failed_count smallint not null default 0,
  last_success_at timestamptz,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ---------------------------------------------------------------- tareas sin fecha (F5)
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  created_by uuid references public.profiles (id) on delete set null,
  claimed_by uuid references public.profiles (id) on delete set null,
  scheduled_for date,
  done_at timestamptz,
  done_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_circle_idx on public.tasks (circle_id);

create trigger tasks_touch before update on public.tasks
for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- bitácora diaria (F6) — una entrada por círculo y día
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  entry_date date not null,
  day_rating text not null check (day_rating in ('bueno', 'regular', 'dificil')),
  moods text[] not null default '{}'
    check (moods <@ array['tranquila', 'feliz', 'triste', 'irritable', 'ansiosa', 'desorientada', 'con_dolor', 'cansada', 'otro']::text[]),
  sleep text check (sleep in ('bien', 'regular', 'poco')),
  food text check (food in ('bien', 'regular', 'poco')),
  note_enc text check (note_enc is null or note_enc ~ '^v[0-9]+\.'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (circle_id, entry_date)
);

create trigger journal_entries_touch before update on public.journal_entries
for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- bienestar de la cuidadora (F8) — privado siempre
create table public.selfcare_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  checkin_date date not null,
  score smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

-- ---------------------------------------------------------------- contactos importantes (F9) — sin datos clínicos
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  kind text not null check (kind in ('familia', 'medico', 'centro_salud', 'farmacia', 'transporte', 'otro')),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{6,20}$'),
  notes_enc text check (notes_enc is null or notes_enc ~ '^v[0-9]+\.'),
  is_emergency boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_circle_idx on public.contacts (circle_id);

create trigger contacts_touch before update on public.contacts
for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- emergencias desde la vista de la persona cuidada (F12)
create table public.emergency_events (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  link_id uuid references public.cared_links (id) on delete set null,
  recipients smallint not null default 0,
  triggered_at timestamptz not null default now()
);

create index emergency_events_circle_idx on public.emergency_events (circle_id, triggered_at desc);

-- ---------------------------------------------------------------- RPC: marcar una ocurrencia (idempotente)
create function public.mark_occurrence(
  p_occurrence uuid,
  p_status public.occurrence_status,
  p_idempotency_key uuid,
  p_reason text default null,
  p_snooze_minutes integer default null,
  p_via text default 'app'
) returns public.reminder_occurrences
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_occ public.reminder_occurrences;
  v_role public.member_role;
  v_mark_occurrence uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_status not in ('done', 'not_done', 'snoozed') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if p_via not in ('app', 'push', 'offline_sync') then
    raise exception 'invalid_via' using errcode = '22023';
  end if;
  if p_snooze_minutes is not null and (p_snooze_minutes < 5 or p_snooze_minutes > 240) then
    raise exception 'invalid_snooze' using errcode = '22023';
  end if;
  select * into v_occ from public.reminder_occurrences o where o.id = p_occurrence for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  select m.role into v_role from public.circle_members m
  where m.circle_id = v_occ.circle_id and m.user_id = v_uid;
  if v_role is null or v_role not in ('caregiver', 'family') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if exists (select 1 from public.circles c where c.id = v_occ.circle_id and c.closed_at is not null) then
    raise exception 'conflict' using errcode = 'P0001', detail = 'circle_closed';
  end if;
  insert into public.occurrence_marks (idempotency_key, occurrence_id, circle_id, marked_by, status, via)
  values (p_idempotency_key, p_occurrence, v_occ.circle_id, v_uid, p_status, p_via)
  on conflict (idempotency_key) do nothing;
  if not found then
    -- Reintento: la clave ya existe. Si era de otra ocurrencia, es un error del cliente.
    select m.occurrence_id into v_mark_occurrence from public.occurrence_marks m
    where m.idempotency_key = p_idempotency_key;
    if v_mark_occurrence <> p_occurrence then
      raise exception 'conflict' using errcode = 'P0001', detail = 'idempotency_key_reused';
    end if;
    return v_occ;
  end if;
  update public.reminder_occurrences o set
    status = p_status,
    not_done_reason = case when p_status = 'not_done' then p_reason else null end,
    snoozed_until = case when p_status = 'snoozed'
      then now() + make_interval(mins => coalesce(p_snooze_minutes, 30)) else null end,
    done_by = case when p_status = 'done' then v_uid else null end,
    done_via = case when p_status = 'done' then p_via else null end,
    done_at = case when p_status = 'done' then now() else null end
  where o.id = p_occurrence
  returning * into v_occ;
  return v_occ;
end
$$;

revoke all on function public.mark_occurrence(uuid, public.occurrence_status, uuid, text, integer, text) from public, anon;
grant execute on function public.mark_occurrence(uuid, public.occurrence_status, uuid, text, integer, text) to authenticated;

-- ---------------------------------------------------------------- RPC: cerrar un círculo (F13), p. ej. por fallecimiento
create function public.close_circle(p_circle uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not private.is_caregiver(p_circle) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_reason not in ('fallecimiento', 'ya_no_cuido', 'otro') then
    raise exception 'invalid_reason' using errcode = '22023';
  end if;
  update public.circles set closed_at = now(), closed_reason = p_reason where id = p_circle;
  update public.reminders set active = false where circle_id = p_circle;
  update public.reminder_occurrences set status = 'skipped'
  where circle_id = p_circle and status in ('pending', 'snoozed');
end
$$;

revoke all on function public.close_circle(uuid, text) from public, anon;
grant execute on function public.close_circle(uuid, text) to authenticated;

-- ---------------------------------------------------------------- RPC: "yo me encargo" de una tarea (F16)
create function public.claim_task(p_task uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_circle uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select t.circle_id into v_circle from public.tasks t where t.id = p_task;
  if v_circle is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not private.is_member(v_circle) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.tasks set claimed_by = v_uid where id = p_task;
end
$$;

revoke all on function public.claim_task(uuid) from public, anon;
grant execute on function public.claim_task(uuid) to authenticated;

-- ---------------------------------------------------------------- RPC: borrado definitivo de una usuaria (trabajo diario)
create function public.purge_user(p_uid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_pseudo uuid;
begin
  select p.pseudonym_id into v_pseudo from public.profiles p where p.id = p_uid;
  if v_pseudo is not null then
    delete from public.events where pseudonym_id = v_pseudo;
  end if;
  -- Borrar la fila de auth.users arrastra en cascada profiles y, por circles.created_by,
  -- los círculos que creó (con lo que ven sus familiares) y todo lo que cuelga de ellos.
  delete from auth.users where id = p_uid;
end
$$;

revoke all on function public.purge_user(uuid) from public, anon, authenticated;
grant execute on function public.purge_user(uuid) to service_role;

-- ---------------------------------------------------------------- RLS y privilegios
alter table public.reminders enable row level security;
alter table public.reminder_occurrences enable row level security;
alter table public.occurrence_marks enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.tasks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.selfcare_checkins enable row level security;
alter table public.contacts enable row level security;
alter table public.emergency_events enable row level security;

revoke all on public.reminders, public.reminder_occurrences, public.occurrence_marks,
  public.push_subscriptions, public.tasks, public.journal_entries, public.selfcare_checkins,
  public.contacts, public.emergency_events from anon, authenticated;

-- recordatorios: miembros leen; la cuidadora crea y edita; circle_id y created_by no se tocan
grant select, insert on public.reminders to authenticated;
grant update (kind, importance, title, med_name_enc, med_instructions_enc, rule, advance_days,
  visible_to_cared, active) on public.reminders to authenticated;
create policy reminders_select on public.reminders for select to authenticated
  using (private.is_member(circle_id));
create policy reminders_insert on public.reminders for insert to authenticated
  with check (private.is_caregiver(circle_id) and created_by = (select auth.uid()));
create policy reminders_update on public.reminders for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));

-- ocurrencias y marcas: solo lectura para miembros; se escriben por RPC o servidor
grant select on public.reminder_occurrences to authenticated;
create policy occurrences_select on public.reminder_occurrences for select to authenticated
  using (private.is_member(circle_id));
grant select on public.occurrence_marks to authenticated;
create policy occurrence_marks_select on public.occurrence_marks for select to authenticated
  using (private.is_member(circle_id));

-- suscripciones push: solo las propias
grant select, insert, update, delete on public.push_subscriptions to authenticated;
create policy push_subscriptions_own on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- tareas: miembros leen; la cuidadora crea, edita y borra; tomar una tarea es por RPC
grant select, insert, delete on public.tasks to authenticated;
grant update (title, scheduled_for, done_at, done_by) on public.tasks to authenticated;
create policy tasks_select on public.tasks for select to authenticated
  using (private.is_member(circle_id));
create policy tasks_insert on public.tasks for insert to authenticated
  with check (private.is_caregiver(circle_id) and created_by = (select auth.uid()));
create policy tasks_update on public.tasks for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));
create policy tasks_delete on public.tasks for delete to authenticated
  using (private.is_caregiver(circle_id));

-- bitácora: miembros leen; la cuidadora escribe como autora
grant select, insert on public.journal_entries to authenticated;
grant update (day_rating, moods, sleep, food, note_enc) on public.journal_entries to authenticated;
create policy journal_select on public.journal_entries for select to authenticated
  using (private.is_member(circle_id));
create policy journal_insert on public.journal_entries for insert to authenticated
  with check (private.is_caregiver(circle_id) and author_id = (select auth.uid()));
create policy journal_update on public.journal_entries for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));

-- bienestar: solo la dueña, nadie más (ni familia ni admin)
grant select, insert on public.selfcare_checkins to authenticated;
grant update (score) on public.selfcare_checkins to authenticated;
create policy selfcare_own on public.selfcare_checkins for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- contactos: miembros leen; la cuidadora escribe
grant select, insert, delete on public.contacts to authenticated;
grant update (name, kind, phone, notes_enc, is_emergency) on public.contacts to authenticated;
create policy contacts_select on public.contacts for select to authenticated
  using (private.is_member(circle_id));
create policy contacts_insert on public.contacts for insert to authenticated
  with check (private.is_caregiver(circle_id));
create policy contacts_update on public.contacts for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));
create policy contacts_delete on public.contacts for delete to authenticated
  using (private.is_caregiver(circle_id));

-- emergencias: los miembros ven el historial; se insertan desde el servidor
grant select on public.emergency_events to authenticated;
create policy emergency_events_select on public.emergency_events for select to authenticated
  using (private.is_member(circle_id));
```

`app/supabase/migrations/20261114000300_contenido_y_escucha.sql` (`workspace/app/supabase/migrations/20261114000300_contenido_y_escucha.sql`):

```sql
-- Sole · migración de contenido editable y escucha (escrita a mano).
-- Consejos y actividades (F2), directorio de recursos (F8), plantillas por tipo de cuidado (F1),
-- comentarios (F10), microencuestas (F10), interés en puertas falsas (F11), tamaño de la base (F15).
-- El contenido inicial NO va aquí: lo agrega la migración del paso `contenido-inicial`.

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('consejo', 'actividad')),
  text text not null check (char_length(text) between 5 and 200),
  activity_title text check (char_length(activity_title) <= 80),
  care_types public.care_type[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'actividad' or activity_title is not null)
);

create trigger tips_touch before update on public.tips
for each row execute function private.touch_updated_at();

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  description text not null check (char_length(description) between 5 and 400),
  phone text check (phone is null or char_length(phone) <= 30),
  url text check (url is null or url ~ '^https://'),
  source_url text not null check (source_url ~ '^https://'),
  verified_at date,
  region text not null default 'nacional' check (char_length(region) <= 60),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger resources_touch before update on public.resources
for each row execute function private.touch_updated_at();

create table public.care_templates (
  care_type public.care_type primary key,
  name text not null check (char_length(name) between 2 and 80),
  description text not null check (char_length(description) between 5 and 300),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  updated_at timestamptz not null default now()
);

create trigger care_templates_touch before update on public.care_templates
for each row execute function private.touch_updated_at();

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('comentario', 'problema')),
  message text not null check (char_length(message) between 1 and 2000),
  screen text check (char_length(screen) <= 80),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index feedback_created_idx on public.feedback (created_at desc);

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  survey_key text not null check (survey_key in ('d3', 'd14', 'd28', 'd56')),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, survey_key)
);

create table public.fake_door_interest (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  door_key text not null
    check (door_key in ('ia', 'recetas', 'plan_familiar', 'comunidad', 'fotos', 'invitar_familiar')),
  choice text check (char_length(choice) <= 40),
  notify_me boolean not null default false,
  created_at timestamptz not null default now()
);

create function public.admin_db_size_bytes() returns bigint
language sql stable security definer set search_path = '' as $$
  select pg_catalog.pg_database_size(pg_catalog.current_database())
$$;

revoke all on function public.admin_db_size_bytes() from public, anon, authenticated;
grant execute on function public.admin_db_size_bytes() to service_role;

-- ---------------------------------------------------------------- RLS y privilegios
alter table public.tips enable row level security;
alter table public.resources enable row level security;
alter table public.care_templates enable row level security;
alter table public.feedback enable row level security;
alter table public.survey_responses enable row level security;
alter table public.fake_door_interest enable row level security;

revoke all on public.tips, public.resources, public.care_templates, public.feedback,
  public.survey_responses, public.fake_door_interest from anon, authenticated;

-- contenido: lectura para usuarias con sesión; escritura solo admin con MFA
grant select, insert, update, delete on public.tips, public.resources, public.care_templates to authenticated;

create policy tips_select on public.tips for select to authenticated
  using (active or (select private.is_admin_mfa()));
create policy tips_admin_insert on public.tips for insert to authenticated
  with check ((select private.is_admin_mfa()));
create policy tips_admin_update on public.tips for update to authenticated
  using ((select private.is_admin_mfa())) with check ((select private.is_admin_mfa()));
create policy tips_admin_delete on public.tips for delete to authenticated
  using ((select private.is_admin_mfa()));

create policy resources_select on public.resources for select to authenticated
  using ((active and verified_at is not null) or (select private.is_admin_mfa()));
create policy resources_admin_insert on public.resources for insert to authenticated
  with check ((select private.is_admin_mfa()));
create policy resources_admin_update on public.resources for update to authenticated
  using ((select private.is_admin_mfa())) with check ((select private.is_admin_mfa()));
create policy resources_admin_delete on public.resources for delete to authenticated
  using ((select private.is_admin_mfa()));

create policy care_templates_select on public.care_templates for select to authenticated
  using (true);
create policy care_templates_admin_insert on public.care_templates for insert to authenticated
  with check ((select private.is_admin_mfa()));
create policy care_templates_admin_update on public.care_templates for update to authenticated
  using ((select private.is_admin_mfa())) with check ((select private.is_admin_mfa()));
create policy care_templates_admin_delete on public.care_templates for delete to authenticated
  using ((select private.is_admin_mfa()));

-- comentarios: cada quien inserta los suyos; admin con MFA lee y marca leído
grant select, insert on public.feedback to authenticated;
grant update (read_at) on public.feedback to authenticated;
create policy feedback_insert_own on public.feedback for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy feedback_admin_select on public.feedback for select to authenticated
  using ((select private.is_admin_mfa()));
create policy feedback_admin_update on public.feedback for update to authenticated
  using ((select private.is_admin_mfa())) with check ((select private.is_admin_mfa()));

-- microencuestas y puertas falsas: propias + lectura de admin con MFA
grant select, insert on public.survey_responses, public.fake_door_interest to authenticated;
create policy survey_insert_own on public.survey_responses for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy survey_select on public.survey_responses for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin_mfa()));
create policy fake_door_insert_own on public.fake_door_interest for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy fake_door_select on public.fake_door_interest for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin_mfa()));
```

`app/supabase/migrations/20261114000400_cron.sql` (`workspace/app/supabase/migrations/20261114000400_cron.sql`):

```sql
-- Sole · migración de trabajos programados (escrita a mano).
-- pg_cron dispara cada minuto (avisos) y una vez al día (borrados e inactividad).
-- pg_net hace el POST a la app con el secreto guardado en Vault.
-- Si los secretos `app_base_url` o `cron_secret` no existen en Vault, la función no hace nada:
-- así el desarrollo local queda en silencio y se usa `pnpm -C app cron:dispatch` a mano.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create function private.call_app_job(p_path text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_base text;
  v_secret text;
begin
  select s.decrypted_secret into v_base from vault.decrypted_secrets s where s.name = 'app_base_url';
  select s.decrypted_secret into v_secret from vault.decrypted_secrets s where s.name = 'cron_secret';
  if v_base is null or v_secret is null then
    return;
  end if;
  perform net.http_post(
    url := v_base || p_path,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    timeout_milliseconds := 10000
  );
end
$$;

revoke all on function private.call_app_job(text) from public, anon, authenticated;

select cron.schedule('sole-dispatch', '* * * * *', $$select private.call_app_job('/api/cron/dispatch')$$);
select cron.schedule('sole-daily', '15 7 * * *', $$select private.call_app_job('/api/cron/daily')$$);
```

#### Resolution convention matrix

**La convención, una sola vez:** imports del código con el alias `@/` → `app/src/` y sin extensión (`import { requireEnv } from "@/lib/env"`); las pruebas e2e y `app/scripts/lib` usan rutas relativas sin extensión.

| Context | Command that exercises it | Convention as it appears there | Config + literal setting that makes it work |
|---|---|---|---|
| Application source | `pnpm -C app build` | `@/lib/env` | `app/tsconfig.json` (scaffold con `--import-alias "@/*"`): `"paths": { "@/*": ["./src/*"] }`, `"moduleResolution": "bundler"` |
| Test files | `pnpm -C app test tests/unit/env-health.test.ts` | `@/app/api/health/route` | `app/vitest.config.ts`: `resolve.alias["@"] = fileURLToPath(new URL("./src", import.meta.url))` |
| Standalone scripts | `pnpm -C app exec tsx scripts/rotate-field-key.ts --dry-run` | `@/lib/crypto/field` y `./lib/load-env` | `tsx` lee `paths` de `app/tsconfig.json`; extensiones resueltas por tsx; el mismo archivo compila con `pnpm -C app typecheck` porque `moduleResolution: "bundler"` acepta imports sin extensión |
| Build / bundle | `pnpm -C app build` (`next build --webpack`) | `@/…` | webpack de Next lee `paths` de `app/tsconfig.json` |
| E2E | `pnpm -C app test:e2e tests/e2e/smoke.spec.ts` | `./fixtures`, `../support/totp` | relativas: no necesitan configuración |
| Type check | `pnpm -C app typecheck` (`next typegen && tsc --noEmit`) | `@/…` y relativas | `app/tsconfig.json` (`paths`, `moduleResolution: "bundler"`; `lib` con `webworker` desde el paso paso 23 (`pwa-service-worker`)); `next typegen` genera `next-env.d.ts` antes de `tsc`, también en un clon limpio |

Ninguna dependencia obligatoria tiene resolución especial en Vitest o tsx: no se usa `server-only` (exige la condición `react-server`); `web-push` es CommonJS y Vitest/tsx lo cargan con interop; `next/headers` solo se importa, nunca se llama, en pruebas (las rutas usan `createSupabaseRouteClient(request)`); `@sentry/nextjs` entra a `scrub.ts` solo como `import type`.

#### Cross-artifact value reconciliation

| Shared value | Single source — the file that decides it | Literal value | Every other place it appears | Compared |
|---|---|---|---|---|
| Puerto e2e | `app/playwright.config.ts` — `use.baseURL` | `http://localhost:3100` | `webServer.command` (`--port 3100`), `webServer.url` (`http://localhost:3100/api/health`), `config.toml` `additional_redirect_urls`, `APP_URL` de `.env.test.local` (`scripts/write-local-env.ts`), CLAUDE.md | yes |
| Puerto dev / APP_URL local | `app/scripts/write-local-env.ts` — `APP_URL` | `http://localhost:3000` | `config.toml` `site_url`, `.env.example`, `src/lib/env.ts` (`appUrl()` por defecto, paso paso 1 (`esqueleto`)), CLAUDE.md, §10 | yes |
| Archivo de variables de prueba (con `APP_URL=http://localhost:3100`, el puerto e2e; `.env.local` lleva :3000) | `app/scripts/write-local-env.ts` | `.env.test.local` | `vitest.config.ts`, `playwright.config.ts`, `tests/setup/env.ts`, `scripts/lib/load-env.ts`, `.gitignore` (`.env.*`), §10 | yes |
| Ruta de tipos generados | script `db:types` en §10 | `src/lib/supabase/database.types.ts` | `app/biome.json` (`!**/src/lib/supabase/database.types.ts`), paso paso 2 (`supabase-local`), CLAUDE.md, `.claude/rules/database.md` | yes |
| Service worker generado | `app/next.config.ts` — `swDest` (paso paso 23 (`pwa-service-worker`)) | `public/sw.js` | `app/biome.json` (`!**/public/sw.js`), `.gitignore` raíz (`app/public/sw.js`), `route-rules.ts` (`/sw.js` público), `pwa.spec.ts` | yes |
| Ruta del bundle | estructura de §3 | `blueprints/` (bundle en `blueprints/sole-prototipo/`) | `biome.json`, `vitest.config.ts`, `playwright.config.ts`, `.gitleaks.toml` (paso paso 3 (`ci-y-secretos`)), Bootstrap líneas 5 y 6 | yes |
| Jobs de cron | `app/supabase/migrations/20261114000400_cron.sql` | `sole-dispatch` · `sole-daily` | `app/supabase/tests/database.test.sql`, criterio de paso 2 (`supabase-local`) | yes |
| Rutas de cron | `20261114000400_cron.sql` | `/api/cron/dispatch` · `/api/cron/daily` | `src/app/api/cron/*/route.ts`, `scripts/trigger-cron.ts`, `route-rules.ts` (`/api/*`) | yes |
| Header del secreto | `20261114000400_cron.sql` | `x-cron-secret` | rutas de cron, `trigger-cron.ts`, §5, `.claude/rules/server.md` | yes |
| Nombres de secretos en Vault | `20261114000400_cron.sql` | `app_base_url` · `cron_secret` | `docs/mantenimiento.md`, §10, lista de lanzamiento | yes |
| Versión de consentimiento | `src/server/consents/consents.ts` (paso paso 12 (`consentimientos`)) | `2026-11-14` | `tests/db/helpers.ts`, `consents.test.ts`, `check` de la migración base (formato) | yes |
| Versión de pnpm | §11 | `pnpm@12.18.0` | Bootstrap (`npm install -g --prefix`, `packageManager`), `ci.yml` (lee `packageManager`), CLAUDE.md | yes |
| Versión de la CLI de Supabase | §11 | `supabase@2.122.1` | Bootstrap (`pnpm -C app add`), `backup.yml` (`npx --yes supabase@2.122.1`) | yes |
| URL de producción | §12 | `https://app.solecuida.com` | `keepalive.yml`, `zap.yml`, `docs/mantenimiento.md`, `config.js` de la web, `WEB_ALLOWED_ORIGINS` (al revés: orígenes de la web) | yes |

Contratos entre artefactos y el primer paso que los ejercita: build + manifiesto de paquetes + servidor → paso paso 1 (`esqueleto`) (levanta :3100 y pide `/api/health`); `config.toml` + migraciones + `seed.sql` + tipos → paso paso 2 (`supabase-local`) (`db:reset`, `db:test`, prueba de conexión); `next.config.ts` + `sw.ts` → paso paso 23 (`pwa-service-worker`) (pide `/sw.js` y registra el SW); migración de cron + ruta de dispatch → paso paso 21 (`despachador`) (prueba de la ruta con y sin secreto).

#### Byte-exact artifact reconciliation

NOT APPLICABLE — this blueprint authors no byte-exact expected output. No hay archivos dorados ni instantáneas. Los textos que las pruebas comparan ("Esta semana se cumplió el 90 % de los medicamentos.", "¿Lo hiciste?", "Algo salió mal. Ya nos llegó el aviso.") los produce el propio código desde plantillas fijas escritas en el mismo paso, sin `Intl`, sin mensajes del motor y sin fechas formateadas por el runtime; los únicos códigos del runtime que se comparan son SQLSTATE estables de Postgres (`42501`).

---

## 20. Acceptance Gate, Risks & Decision Log

### 20.1 Global acceptance gate

El proyecto está **terminado** cuando cada comando de abajo sale con 0 en un clon limpio (después del Bootstrap de §10, con Docker abierto), y no antes. Es el mismo conjunto que corre CI.

```bash
pnpm -C app install --frozen-lockfile                 # expect: exit 0
pnpm -C app typecheck                                 # expect: exit 0, 0 errores
pnpm -C app lint                                      # expect: exit 0, 0 errores
pnpm -C app db:reset                                  # expect: exit 0
pnpm -C app db:test                                   # expect: exit 0
pnpm -C app test                                      # expect: exit 0, 0 failed, 0 skipped
pnpm -C app test:e2e                                  # expect: exit 0, 0 failed — levanta el build en :3100 y lo usa
pnpm -C app test:e2e tests/e2e/a11y.spec.ts           # expect: exit 0 — 0 violaciones axe
pnpm -C app build                                     # expect: exit 0
pnpm -C app exec tsx scripts/check-bundle-secrets.ts  # expect: exit 0
pnpm -C app exec tsx scripts/check-alianzas.ts todo   # expect: exit 0
```

Todas son propiedades, no conteos; cada una sale con 0 cuando todo está bien.

Puertas manuales — lista de lanzamiento (se revisa una vez, antes de abrir al público; `docs/lanzamiento.md` la repite con casillas):

- [ ] Cada paso de §9 tiene su etiqueta: `git tag -l 'step-*'` lista una por paso (70, o las de las épicas construidas si la 10 se pospuso, con la razón en `PENDIENTES.md`). El repositorio existe desde antes del Bootstrap; el Bootstrap solo comprueba y, en un clon vacío, lo crea.
- [ ] Cada archivo de la tabla *Files that must be committed* está versionado y no ignorado, uno por comando: `git ls-files --error-unmatch app/.env.example`, `git ls-files --error-unmatch CLAUDE.md`, `git ls-files --error-unmatch .claude/settings.json`, `git ls-files --error-unmatch app/vitest.config.ts`, `git ls-files --error-unmatch app/supabase/config.toml`, `git ls-files --error-unmatch app/pnpm-lock.yaml`, `git ls-files --error-unmatch .github/workflows/ci.yml` (cada uno sale 0) y, por ruta, `status=0; git check-ignore -q app/.env.example || status=$?; test "$status" -eq 1` (1 = no ignorado; 128 = error de uso, y entonces falla).
- [ ] El `.gitignore` de la raíz se versionó antes que la app: `test "$(git log --diff-filter=A --format=%H -- .gitignore | tail -n 1)" = "$(git rev-list --max-parents=0 HEAD)"` sale 0 (este repo lo agregó en su primer commit; el Bootstrap solo le suma líneas antes de su commit).
- [ ] La tabla *Byte-exact artifact reconciliation* de §19.6 es NOT APPLICABLE: no hay archivos dorados que confirmar.
- [ ] El Bloque Bootstrap de §10 se volvió a correr entero sobre el árbol ya construido, **salió con 0** y no cambió nada importante: `app/package.json` sigue con todas sus dependencias y `pnpm -C app typecheck` sigue encontrando sus binarios.
- [ ] Cada fila de *Cross-artifact value reconciliation* dice `Compared: yes`, y `pnpm -C app lint` / `typecheck` corrieron desde la raíz con el bundle presente.
- [ ] §9.1 no aplica (sin migración de sistema).
- [ ] Ningún no-objetivo de §1 quedó construido.
- [ ] Cuentas creadas (§10) y DNS: `app.solecuida.com` en Vercel; SPF y DKIM de `notificaciones.solecuida.com` verificados en Resend; nada tocado en los registros de Zoho.
- [ ] Supabase de producción en São Paulo: `pnpm -C app exec supabase link` y `supabase db push` corridos por el fundador; Auth → URL Configuration con `https://app.solecuida.com` y `/auth/confirm`; plantilla del enlace mágico copiada de `app/supabase/templates/magic-link.html`; SMTP de Resend; captcha Turnstile activado; largo mínimo de contraseña 10; protección de contraseñas filtradas si el plan lo permite; Security y Performance Advisors sin hallazgos críticos.
- [ ] Vault de producción: `app_base_url` y `cron_secret` creados (SQL en `docs/mantenimiento.md`); `select * from cron.job_run_details order by start_time desc limit 5;` muestra ejecuciones exitosas.
- [ ] Cada variable de §10 está en Vercel (producción) y ausente del repo; claves VAPID de producción generadas; tope de gasto en cero o planes sin tarjeta.
- [ ] Admin: `update public.profiles set is_admin = true where id = '<uuid del fundador>';` y TOTP inscrito.
- [ ] Respaldo: secretos `SUPABASE_DB_URL` y `AGE_PUBLIC_KEY` en GitHub; `backup.yml` corrido a mano una vez; simulacro de restauración hecho y anotado en `docs/mantenimiento.md`.
- [ ] `keepalive.yml` en verde; `zap.yml` contra producción sin alertas altas.
- [ ] Prueba real de avisos: un Android con Chrome y un iPhone con la app instalada (iOS 16.4+) reciben un recordatorio, el "¿Lo hiciste?" y responden desde la notificación.
- [ ] Los flujos e2e críticos de §13 se recorren a mano contra producción; Lighthouse ≥ 90 en rendimiento, accesibilidad, buenas prácticas y SEO en el celular para la web y la portada de la app; sitemap enviado a Google Search Console.
- [ ] 131 (SAMU) y cada recurso del directorio verificados en fuente oficial, marcados como verificados en `/admin/contenido`.
- [ ] Formulario web probado en producción con Turnstile; después, la política anónima de inserción de `sole-web.contactos` se retira.
- [ ] Recorrido solo con teclado y una pasada con TalkBack por el flujo principal (§15).
- [ ] Sentry recibe un error de prueba provocado a propósito, sin datos personales.
- [ ] Un rollback se hizo una vez a propósito ("Promote" del despliegue anterior en Vercel).

**No se ignora ninguna advertencia.**

### 20.2 Risk register

| Risk | Likelihood | Impact | Early signal | Mitigation |
|---|---|---|---|---|
| Web Push no llega (iPhone sin instalar, ahorro de batería en Android, permiso negado): el ciclo diario falla en silencio | A | A | % de usuarias activas con push < 50 % en `/admin`; comentarios "no me avisó" | Guía de instalación en la bienvenida, botón "Probar aviso", indicador "Avisos activos ✓/✗" en texto, lista de pendientes en "Hoy" como respaldo, métrica en el panel. Pasos paso 15 (`bienvenida-f1`), paso 24 (`avisos-suscripcion`), paso 25 (`hoy`), paso 40 (`admin-metricas`). Responsable: fundador revisa la métrica cada semana |
| Pérdida de datos o caída en el plan gratuito (pausa del proyecto, sin respaldos gestionados, un solo fundador) | M | A | falla de `keepalive.yml` o de `backup.yml`; uso ≥ 80 % en `/admin/limites` | Keep-alive diario, respaldo cifrado nocturno con retención de 7 días, simulacro de restauración, panel de límites, manual. Pasos paso 51 (`respaldos-keepalive`), paso 52 (`manual-mantenimiento`), paso 42 (`admin-export-limites`) |
| La adopción es el verdadero cuello de botella (aún no hay entrevistas): sin usuarias no hay evidencia | A | A | pocas altas por código de organización en las primeras 2 semanas | Riesgo aceptado; mitigación fuera del código: kit de alianzas y variantes de correo que envía el fundador, enlaces con código para medir H6. Pasos paso 64 (`alianzas-plantillas`), paso 65 (`alianzas-kit`) |
| Alcance contra tiempo (17 funcionalidades en ~3 días de construcción) | A | M | épicas 02–07 sin cerrar al consumir la mitad de la cuota | Reglas de corte del brief: fases 1, 2, 4 y 5 primero; `tasks.json` reanudable; épica 10 con prioridad `p2`; `PENDIENTES.md` al día. Paso paso 53 (`checklist-lanzamiento`) y regla 17 de §9 |
| Datos sensibles y falsa sensación de seguridad (botón de emergencia, recordatorios de medicamentos) | M | A | comentarios que tratan a Sole como servicio de emergencia; incidentes de privacidad | Sin datos clínicos, cifrado de campos, texto explícito "Sole no reemplaza a un servicio de emergencia…", llamada `tel:` como camino principal, nombre del medicamento fuera del push. Pasos paso 18 (`recordatorios-datos`), paso 57 (`emergencia-servidor`), paso 58 (`vista-persona-cuidada`) |
| Abuso del registro público (cuentas basura, spam de emergencias o comentarios) | M | M | picos de altas sin actividad; filas en `emergency_events` sin uso previo | Turnstile en ingreso y web, límites por IP y por vínculo, admin desactiva organizaciones y puede borrar cuentas. Pasos paso 9 (`rls-y-limites`), paso 10 (`autenticacion-login`), paso 63 (`web-contacto`) |
| El build depende de la red para la fuente (`next/font/google`) | B | B | `pnpm -C app build` falla con error de descarga de fuente | La máquina de construcción y Vercel tienen red; si Google Fonts no responde, se reintenta. Documentado en el paso paso 4 (`tokens-diseno`) |
| Versiones sin verificar (`@types/node` 22.x, `@testing-library/dom`, `create-next-app@16.4.6`, acciones de GitHub) | B | M | la instalación o el scaffold fallan en el Bootstrap | Marcadas UNVERIFIED en §11; el Bootstrap se prueba antes de entregar el plano; si fallan, se fija la versión resuelta y se anota en `DECISIONES.md` |

### 20.3 Decision log

| # | Decision | Rejected alternative | Why | Would reverse if |
|---|---|---|---|---|
| 1 | Borrado de cuenta con 7 días de gracia: desactiva al instante, purga a los 8 días, se puede recuperar | Borrado inmediato | Protege de toques accidentales sin dejar datos indefinidamente (Gate A) | Un regulador exige supresión inmediata |
| 2 | Sin push, los recordatorios se ven solo en la app (pendientes en "Hoy" + aviso persistente); sin correo de respaldo | Correo o SMS de respaldo | Costo cero, menos datos a terceros; se mide el % con push (Gate A) | El % de usuarias con push activo queda bajo 50 % |
| 3 | Correo de la app por Resend en `notificaciones.solecuida.com` (corrige el brief §5 que decía Zoho en una versión previa) | Zoho SMTP | Protege la reputación del dominio personal (`CORREO-Configuracion-Zoho.md` §6) | Resend cambia su plan gratuito por debajo de lo necesario |
| 4 | Node 22 LTS | Node 24 (pista por defecto) | Es el instalado; Vitest 5 y Sentry 11 lo soportan (Gate A) | Una dependencia exige Node ≥ 24 |
| 5 | Un solo proyecto de producción, local con Supabase CLI, sin staging ni vistas previas | Staging + previews | Un fundador; el plan gratuito permite 2 proyectos y uno ya es `sole-web` (Gate A) | Aparece un segundo desarrollador |
| 6 | Diseño: tokens derivados de la paleta de la web, Atkinson Hyperlegible, 18 px; hover claro `#84492a` en vez de `#b8734a` | Estética de carta de la web; `#b8734a` con texto encima (3.76:1) | Legibilidad para el público y AA en todos los pares (Gate A + este plano) | Un estudio de marca entrega un sistema nuevo (los tokens permiten cambiarlo sin tocar componentes) |
| 7 | El contenido (plantillas, consejos, recursos) lo redacta el rol de Contenidos y lo revisa el fundador; recursos con fuente oficial y fecha | Contenido del fundador desde cero | Velocidad con control (Gate A) | — |
| 8 | Todas las consultas pasan por el servidor con la sesión de la usuaria; el navegador nunca habla con Supabase | Cliente de Supabase en el navegador | RLS con el JWT real, CSP `connect-src 'self'`, menos superficie | Se necesita tiempo real en el navegador (F16 con presencia) |
| 9 | Esquema solo por migraciones SQL de la CLI; sin ORM; tipos generados | Drizzle o Prisma | Un solo dueño del esquema que entiende RLS | El esquema crece a un punto donde las consultas tipadas ahorran más de lo que cuestan |
| 10 | Cifrado de campos AES-256-GCM en Node con versión de clave en el prefijo | pgcrypto en la base | La clave nunca entra a la base; rotación con script | Supabase ofrece cifrado por columna gestionado y gratuito |
| 11 | Despachador: `pg_cron` → `pg_net` → ruta de Next con secreto en Vault | Edge Function (lo que decía el brief) o Vercel Cron | Mismo lenguaje y pruebas; Vercel Hobby no permite cron por minuto | Las invocaciones por minuto chocan con límites de Vercel |
| 12 | Ocurrencias materializadas 48 h con clave única; recordatorios como regla JSON | Calcular al vuelo cada minuto; iCal RRULE | El despachador consulta una tabla indexada; la regla JSON es legible para el fundador | Hace falta interoperar con calendarios externos |
| 13 | Sin conexión: Serwist + IndexedDB con cola idempotente | Solo caché HTTP | Marcar sin señal es requisito del brief | — |
| 14 | Build y dev con `--webpack` + Tailwind por PostCSS | Turbopack | `@serwist/next` 9 es un plugin de webpack | Serwist publica soporte estable para Turbopack |
| 15 | Componentes propios sobre HTML nativo | shadcn/Radix | Menos dependencias sin verificar, accesibilidad nativa, mantenible por el fundador | Se necesitan componentes complejos (combobox, calendario interactivo) |
| 16 | Sentry con túnel `/monitoring` y filtrado propio | Sin rastreo de errores | Errores visibles sin datos personales | — |
| 17 | Eventos propios en `events` con seudónimo; catálogo en `docs/eventos.md` | Analítica de terceros | Ningún dato de usuarias a terceros (brief §5) | — |
| 18 | Emergencia: `tel:` al contacto o al 131 `[VERIFICAR]` + push + registro, con confirmación y límite | Solo push | La línea telefónica es el camino confiable (brief F12) | — |
| 19 | Vínculo de la persona cuidada con token largo hasheado, revocable, 90 días | Cuenta para la persona cuidada | Sin correo ni contraseña para alguien con dificultades (brief F12) | — |
| 20 | Formulario de la web pasa por `/api/web/contact` de la app, que verifica Turnstile e inserta en `sole-web` con su clave secreta | Turnstile solo en el navegador con inserción anónima directa | Un captcha que no se verifica en el servidor no protege nada | La web se integra a la app |
| 21 | Precios de prueba del plan familiar: $2.990, $4.990 y $7.990 al mes (CLP), solo para medir | No mostrar precios | El brief pide 2 o 3 precios de prueba; los fija el rol de Monetización y se documentan en `docs/negocio/planes.md` | Las primeras respuestas se concentran en un extremo |
| 22 | Semgrep CE en CI siempre; CodeQL solo si el repo es público | Solo CodeQL | CodeQL es de pago en repos privados | El repo se hace público (ya corre) |
| 23 | Supabase dentro de `app/supabase/` | `supabase/` en la raíz | Un solo `package.json` y una sola carpeta de trabajo para la CLI, las pruebas y los scripts | Se agrega un segundo cliente de la misma base |
| 24 | Plan con 70 pasos en 10 épicas que siguen las fases del brief | Recortar a 18 pasos | El brief no permite recortar alcance en el plan (solo al construir, con sus reglas de corte) | — |

### 20.4 What to build next

1. **F16 y F17** si quedaron pendientes (épica 10) — cuando las épicas 02–09 estén en producción y haya cuota.
2. **Respaldo de avisos por correo** — si la métrica de push activo queda bajo 50 % (no-objetivo de §1).
3. **Sole con IA** — si H4 muestra interés claro en la puerta falsa y hay financiamiento (no-objetivo de §1).
4. **Apps en tiendas** — si la retención de la semana 8 lo justifica y los avisos en iPhone no alcanzan (no-objetivo de §1).
5. **Interfaz para profesionales** — cuando una organización aliada lo pida por escrito (no-objetivo de §1).

---

*End of blueprint. Build order is §9. Stop when §20.1 is green.*
