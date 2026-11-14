# Epic 09: Fuera de la app

> La web cuenta el nuevo relato, explica cómo probar Sole, tiene sus páginas legales, `llms.txt` y el formulario protegido; las alianzas tienen plantillas, lista de organizaciones y kit de piloto.

| | |
|---|---|
| **Epic id** | `09-fuera-de-la-app` |
| **Tasks** | `E9-T1` … `E9-T6` (pasos 60–65 de `blueprint.md` §9) |
| **Fase del brief** | Fase 7 del brief (§8.1 web, §8.2 alianzas, documentos legales y planes). |
| **Depends on** | 07-despliegue |
| **Unlocks** | 10-si-sobra-tiempo |
| **Parallel with** | 08-ampliacion |

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
web/assets/compartir.js                                      # NUEVO en E9-T1
web/assets/estilo.css                                        # NUEVO en E9-T1
web/favicon.svg                                              # NUEVO en E9-T1
app/tests/unit/web-site.test.ts                              # NUEVO en E9-T1
web/privacidad.html                                          # NUEVO en E9-T2
web/terminos.html                                            # NUEVO en E9-T2
web/cookies.html                                             # NUEVO en E9-T2
web/llms.txt                                                 # NUEVO en E9-T2
web/404.html                                                 # NUEVO en E9-T2
web/index.html                                               # NUEVO en E9-T3
web/probar.html                                              # NUEVO en E9-T3
web/organizaciones.html                                      # NUEVO en E9-T3
web/sitemap.xml                                              # NUEVO en E9-T3
web/contacto.html                                            # NUEVO en E9-T4
web/assets/formulario.js                                     # NUEVO en E9-T4
web/assets/config.js                                         # NUEVO en E9-T4
app/src/app/api/web/contact/route.ts                         # NUEVO en E9-T4
app/tests/unit/web-contact-route.test.ts                     # NUEVO en E9-T4
app/scripts/check-alianzas.ts                                # NUEVO en E9-T5
alianzas/plantillas/fundacion.md                             # NUEVO en E9-T5
alianzas/plantillas/municipio.md                             # NUEVO en E9-T5
alianzas/plantillas/centro-salud.md                          # NUEVO en E9-T5
alianzas/plantillas/agrupacion-cuidadoras.md                 # NUEVO en E9-T5
alianzas/plantillas/asociacion-pacientes.md                  # NUEVO en E9-T6
alianzas/organizaciones.csv                                  # NUEVO en E9-T6
alianzas/seguimiento.csv                                     # NUEVO en E9-T6
alianzas/kit-piloto.md                                       # NUEVO en E9-T6
alianzas/pauta-entrevistas.md                                # NUEVO en E9-T6
```

Everything outside this subtree is out of scope (leer otros archivos está bien; modificarlos no). If a task seems to require editing a file not listed here, stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entidad | Qué toca esta épica | Notas |
|---|---|---|
| `contactos` del proyecto `sole-web` | inserción desde `/api/web/contact` con su clave secreta | otro proyecto de Supabase; no es parte de las migraciones de la app |

## Contracts

**Consumed** — already exists, do not rebuild:

| De | Interfaz | Garantía |
|---|---|---|
| `02-cimientos` | `checkRateLimit`, `hashKey` | ver épica 02 |
| `06-seguridad-y-calidad` | sin CORS por defecto | la ruta de contacto es la única excepción |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Exporta | Firma | La usan |
|---|---|---|
| `app/src/app/api/web/contact/route.ts` | `OPTIONS`, `POST` | `web/assets/formulario.js` |
| `app/tests/unit/web-site.test.ts` | reglas del sitio | CI |
| `app/scripts/check-alianzas.ts` | `plantillas` / `todo` | — |

## Conventions that bite in this area

- Reglas de `web/README.md`: la tía Sole está viva, `--tinta-tenue` ≥ 4.5:1, sin botón de WhatsApp, sin "en memoria".
- Los correos a organizaciones los envía el fundador; aquí solo se redactan.
- Nada de logos o nombres de organizaciones como respaldo sin permiso escrito.
- No barrel files; imports con `@/` → `app/src/` (las e2e y `scripts/lib`, relativas).
- Resultados tipados `{ ok: true, data } | { ok: false, error: { code, message } }`; textos para personas en español de Chile.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/database.md`, `server.md`, `ui.md`, `tests.md`, `web.md`, `docs.md`. Both sit in the project root — the builder copied them there from the bundle's `workspace/` before task one.

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do not re-rank by priority or by what looks quick.

### `E9-T1` — Preparar la web: CTA fija, compartir, favicon y pruebas

**Depends on:** `E7-T5` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 60

La web sigue siendo estática y conserva su diseño de carta (reglas de `web/README.md`: la tía Sole está viva, `--tinta-tenue` ≥ 4.5:1, sin botón de WhatsApp).
- `web/favicon.svg` — el logo de la web (cuadrado redondeado `#9c5b34` con "S" `#faf6ef`), el mismo que hoy va en línea como data URI.
- `web/assets/compartir.js` — botón "Compartir": `navigator.share({ title, url })` o, si no existe, copia el enlace y avisa "Enlace copiado" en una región `aria-live`.
- `web/assets/estilo.css` — `.cta-principal` (botón "Probar Sole"), que en pantallas de menos de 40rem queda fija abajo sin tapar el foco; `.compartir`; pie `data-pie="v2"`. Mantiene los contrastes que exige `web/README.md`.
- `app/tests/unit/web-site.test.ts` — lee `../web/*.html` sin dependencias (expresiones regulares): título único por página; meta descripción única en toda página salvo `404.html`; un solo `<h1>` distinto del título; todo `href` y `src` interno existe en `web/` (excepto `/_vercel/insights/script.js`, que existe solo en Vercel, y `assets/retrato.jpg`, opcional por diseño); ningún enlace a `wa.me`, `api.whatsapp.com` ni `whatsapp:`; ninguna aparición de "en memoria" en `web/` ni en `app/src`; ningún `LocalBusiness`; `sitemap.xml` lista toda página salvo `404.html` y las que llevan `<meta name="robots" content="noindex">` (y toda URL del sitemap existe); toda página con `data-pie="v2"` enlaza `privacidad.html`, `terminos.html`, `cookies.html` y `/favicon.svg`.

**Files**
- `web/assets/compartir.js` — new
- `web/assets/estilo.css` — new
- `web/favicon.svg` — new
- `app/tests/unit/web-site.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/web-site.test.ts` runs **THE SYSTEM SHALL** find a unique `<title>` on every page of `web/`, a unique meta description on every page except `404.html`, and exactly one `<h1>` per page whose text differs from the title.
2. **WHEN** it checks links **THE SYSTEM SHALL** resolve every internal `href` and `src` to a file under `web/`, except `/_vercel/insights/script.js` and `assets/retrato.jpg`.
3. **WHEN** it scans `web/` and `app/src` **THE SYSTEM SHALL** find no link to `wa.me`, `api.whatsapp.com` or `whatsapp:`, no "en memoria" and no `LocalBusiness`.
4. **WHEN** it reads `web/sitemap.xml` **THE SYSTEM SHALL** find every page except `404.html` and pages marked `noindex`, and every URL it lists SHALL exist under `web/`.
5. **WHEN** a page carries `data-pie="v2"` **THE SYSTEM SHALL** find in it links to `privacidad.html`, `terminos.html` and `cookies.html` and `<link rel="icon" href="/favicon.svg">`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test tests/unit/web-site.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E9-T1: Preparar la web: CTA fija, compartir, favicon y pruebas"
git tag step-60-web-base
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E9-T2` — Publicar privacidad, términos, cookies y llms.txt

**Depends on:** `E9-T1` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 61

Voz de la carta, español de Chile, sin jerga legal. Responsable: José Carrillo García (persona natural), `hola@solecuida.com`.
- `privacidad.html` — agrega la app: qué datos se recogen y para qué (sección 4 del brief), datos sensibles cifrados, consentimiento de investigación aparte, borrado con 7 días de gracia, 12 meses de inactividad con aviso, inventario de terceros con país (`[VERIFICAR]`): Supabase, Vercel, Sentry, Resend, Cloudflare, Zoho (solo correo `hola@`). Pie `data-pie="v2"`.
- `terminos.html` — servicio gratuito, sin cobros (sin política de reembolsos hasta que exista un cobro), mayores de 18, la cuidadora declara autorización o actuar en interés de la persona cuidada, Sole no reemplaza servicios de emergencia ni consejo médico, lo compartido fuera de Sole es responsabilidad de quien lo comparte.
- `cookies.html` — solo cookies esenciales (sesión de la app); por eso no hay banner; si algún día hay cookies no esenciales, se podrán rechazar con la misma facilidad.
- `llms.txt` — `# Sole`, resumen de una línea, `## Qué es`, `## Para quién`, `## Cómo probarla`, `## Privacidad`, `## Contacto`.
- `404.html` — pie `data-pie="v2"` y favicon nuevo.
- `terminos.html` y `cookies.html` nacen con `<meta name="robots" content="noindex">`; paso 62 (`web-relato`) les quita esa marca al sumarlas a `sitemap.xml`.

**Files**
- `web/privacidad.html` — new
- `web/terminos.html` — new
- `web/cookies.html` — new
- `web/llms.txt` — new
- `web/404.html` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/web-site.test.ts` runs **THE SYSTEM SHALL** pass on `privacidad.html`, `terminos.html`, `cookies.html` and `404.html`, each carrying `data-pie="v2"` with links to the three legal pages and the favicon.
2. **WHEN** `web/privacidad.html` is read **THE SYSTEM SHALL** name Supabase, Vercel, Sentry, Resend, Cloudflare and Zoho with what each receives and in which country.
3. **WHEN** `web/terminos.html` is read **THE SYSTEM SHALL** state that the service is free, that users must be 18 or older, and that "Sole no reemplaza a un servicio de emergencia".
4. **WHEN** `web/llms.txt` is read **THE SYSTEM SHALL** start with `# Sole` and contain the headings `## Qué es`, `## Para quién`, `## Cómo probarla`, `## Privacidad` and `## Contacto`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test tests/unit/web-site.test.ts
grep -q "Sole no reemplaza a un servicio de emergencia" web/terminos.html
grep -q "Resend" web/privacidad.html
grep -q "## Cómo probarla" web/llms.txt
```

**Checkpoint**

```bash
git add -A && git commit -m "E9-T2: Publicar privacidad, términos, cookies y llms.txt"
git tag step-61-web-legal
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E9-T3` — Cambiar el relato de la web y explicar cómo probar Sole

**Depends on:** `E9-T2` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 62

- `index.html` — el retrato pasa a `assets/retrato.webp` (WebP comprimido, opcional como hoy: si no existe, `onerror` lo quita). El relato cambia de "voy a validar con entrevistas" a "este es el mismo contexto; decidí construir esto y ahora lo estoy probando con personas reales". La tía Sole sigue presentándose viva. Resumen breve al inicio; una sola CTA "Probar Sole" (hacia `probar.html`) después del primer párrafo, fija en el celular; JSON-LD `Organization` y `WebSite`; el `<img>` del retrato con `width` y `height`; pie `data-pie="v2"`, favicon y botón compartir.
- `probar.html` (nueva) — qué es la app, cómo instalarla (Android con Chrome; iPhone con Safari y avisos desde iOS 16.4), qué datos se recogen y para qué, preguntas frecuentes con JSON-LD `FAQPage`; la CTA lleva a `https://app.solecuida.com/`.
- `organizaciones.html` — sección "Sumarse al piloto": qué se pide, qué reciben (panel con datos agregados e informe de cierre de cohorte), su enlace con código. Sin logos ni nombres de organizaciones sin permiso escrito.
- `sitemap.xml` — agrega `probar.html`, `terminos.html` y `cookies.html` con `lastmod` de hoy; `terminos.html` y `cookies.html` pierden el `noindex`.
- `web-site.test.ts` — agrega: `index.html` con JSON-LD `Organization` y `WebSite`; `probar.html` con `FAQPage`; todo `<img>` con `alt`, `width` y `height` y con `src` en `.webp`, `.avif` o `.svg` (brief §8.1, punto 6; la excepción de existencia pasa de `assets/retrato.jpg` a `assets/retrato.webp`); todo `.png`/`.jpg`/`.jpeg` que exista en `web/` además de `assets/portada-social.png` (imagen para redes, la piden en PNG) pesa menos de 200 KB; cada página con CTA tiene exactamente un elemento `.cta-principal`.

**Files**
- `web/index.html` — new
- `web/probar.html` — new
- `web/organizaciones.html` — new
- `web/sitemap.xml` — new
- `app/tests/unit/web-site.test.ts` — edit

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `tests/unit/web-site.test.ts` runs **THE SYSTEM SHALL** find JSON-LD `Organization` and `WebSite` in `index.html` and `FAQPage` in `probar.html`, and no `LocalBusiness` anywhere.
2. **WHEN** it checks images **THE SYSTEM SHALL** find `alt`, `width` and `height` on every `<img>` of `web/`, every `<img>` `src` ending in `.webp`, `.avif` or `.svg`, and no raster file in `web/` other than `assets/portada-social.png` larger than 200 KB.
3. **WHEN** it checks calls to action **THE SYSTEM SHALL** find at most one `.cta-principal` per page and exactly one on `index.html` and `probar.html`.
4. **WHEN** it reads `web/sitemap.xml` **THE SYSTEM SHALL** list `probar.html`, `terminos.html` and `cookies.html` along with the earlier pages.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app test tests/unit/web-site.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E9-T3: Cambiar el relato de la web y explicar cómo probar Sole"
git tag step-62-web-relato
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E9-T4` — Proteger el formulario de la web con Turnstile vía la app

**Depends on:** `E9-T3`, `E6-T1` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 63

El formulario deja de escribir directo en el proyecto `sole-web`: pasa por la app, que verifica Turnstile y reenvía. La política de inserción anónima de `contactos` se retira después, a mano, desde la lista de lanzamiento.
- `app/src/app/api/web/contact/route.ts` — `OPTIONS` y `POST`. CORS solo para los orígenes de `WEB_ALLOWED_ORIGINS` (por defecto `https://solecuida.com,https://www.solecuida.com`); otro origen → 403 sin `access-control-allow-origin`. `POST`: campo trampa lleno o envío en menos de 3 s → 200 `{ ok: true }` sin guardar nada; límite `web_contact` por hash de IP; si existe `TURNSTILE_SECRET_KEY`, verifica el token en `https://challenges.cloudflare.com/turnstile/v0/siteverify` (falla → 400 `captcha_failed`); sin `WEB_CONTACT_SUPABASE_URL` o `WEB_CONTACT_SUPABASE_SECRET_KEY` → 503 `unavailable`; si no, inserta en `contactos` del proyecto `sole-web` con su clave secreta, con los mismos campos que hoy envía `formulario.js`.
- `web/assets/config.js` — `contactEndpoint: "https://app.solecuida.com/api/web/contact"` y `turnstileSiteKey: ""` (el fundador la completa al lanzar); se quitan `supabaseUrl` y `supabaseKey`.
- `web/assets/formulario.js` — envía al endpoint con el token de Turnstile (render explícito cuando hay `turnstileSiteKey`); mantiene la trampa, la espera de 3 s y los mensajes actuales.
- `web/contacto.html` — script de Turnstile `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`, contenedor del widget, pie `data-pie="v2"`, favicon y botón compartir.
- `web-contact-route.test.ts` — reemplaza `fetch` global con `vi.stubGlobal` para Turnstile y para el insert; el límite usa la base local (cada caso manda una IP distinta en `x-forwarded-for`).

**Files**
- `web/contacto.html` — new
- `web/assets/formulario.js` — new
- `web/assets/config.js` — new
- `app/src/app/api/web/contact/route.ts` — new
- `app/tests/unit/web-contact-route.test.ts` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `OPTIONS /api/web/contact` arrives from `https://solecuida.com` **THE SYSTEM SHALL** answer 204 with `access-control-allow-origin: https://solecuida.com`, and from `https://evil.example` SHALL answer 403 without that header.
2. **WHEN** a `POST` arrives with the honeypot filled **THE SYSTEM SHALL** answer 200 `{ ok: true }` and call neither Turnstile nor the insert.
3. **WHEN** `TURNSTILE_SECRET_KEY` is set and Turnstile rejects the token **THE SYSTEM SHALL** answer 400 with code `captcha_failed` and insert nothing.
4. **WHEN** Turnstile accepts **THE SYSTEM SHALL** insert one row into `contactos` at `WEB_CONTACT_SUPABASE_URL` and answer 200.
5. **WHEN** every page of `web/` is checked **THE SYSTEM SHALL** find `data-pie="v2"` in all of them.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app test tests/unit/web-contact-route.test.ts
pnpm -C app test tests/unit/web-site.test.ts
test -f web/contacto.html
test -z "$(grep -L 'data-pie="v2"' web/*.html)"
```

**Checkpoint**

```bash
git add -A && git commit -m "E9-T4: Proteger el formulario de la web con Turnstile vía la app"
git tag step-63-web-contacto
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E9-T5` — Redactar las plantillas de correo para organizaciones

**Depends on:** `E9-T3` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 64

Los correos los envía el fundador, nunca los agentes. Voz de la carta de la web; sin cifras ni testimonios inventados; sin prometer que Sole "mejora la salud" o "reduce el estrés".
- Cada plantilla tiene `## Versión breve`, `## Versión completa` y `## Seguimiento`; cada versión con `Asunto:` y el marcador `ENLACE_CON_CODIGO` (se reemplaza por `https://app.solecuida.com/?org=<CODIGO>`).
- `app/scripts/check-alianzas.ts` — `tsx scripts/check-alianzas.ts plantillas|todo` desde `app/`, lee `../alianzas`. `plantillas`: las cuatro plantillas de este paso con sus tres secciones, `Asunto:` y `ENLACE_CON_CODIGO`, sin "mejora la salud", "reduce el estrés" ni "previene". `todo`: además `asociacion-pacientes.md`, `organizaciones.csv`, `seguimiento.csv`, `kit-piloto.md` y `pauta-entrevistas.md` (reglas en paso 65 (`alianzas-kit`)). Sale con 0 o con 1 y la lista de problemas.

**Files**
- `app/scripts/check-alianzas.ts` — new
- `alianzas/plantillas/fundacion.md` — new
- `alianzas/plantillas/municipio.md` — new
- `alianzas/plantillas/centro-salud.md` — new
- `alianzas/plantillas/agrupacion-cuidadoras.md` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `pnpm -C app exec tsx scripts/check-alianzas.ts plantillas` runs **THE SYSTEM SHALL** exit 0 after finding `fundacion.md`, `municipio.md`, `centro-salud.md` and `agrupacion-cuidadoras.md`, each with the sections `## Versión breve`, `## Versión completa` and `## Seguimiento`, a `Asunto:` line per version and the marker `ENLACE_CON_CODIGO`.
2. **WHEN** any template contains "mejora la salud", "reduce el estrés" or "previene" **THE SYSTEM SHALL** make the script exit 1 naming the file.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app lint
pnpm -C app typecheck
pnpm -C app exec tsx scripts/check-alianzas.ts plantillas
```

**Checkpoint**

```bash
git add -A && git commit -m "E9-T5: Redactar las plantillas de correo para organizaciones"
git tag step-64-alianzas-plantillas
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

### `E9-T6` — Armar la lista de organizaciones y el kit de piloto

**Depends on:** `E9-T5` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 65

- `asociacion-pacientes.md` — misma estructura que las otras plantillas.
- `organizaciones.csv` — encabezado exacto `nombre,tipo,poblacion,comuna_o_region,web,contacto_institucional,fuente,fecha_consulta,codigo_org`; al menos 20 organizaciones chilenas relacionadas con el cuidado, investigadas en sus sitios públicos; `tipo` ∈ `fundacion|municipio|centro_salud|agrupacion|asociacion_pacientes|otro`; `fuente` `https://`; `fecha_consulta` `YYYY-MM-DD`; `contacto_institucional` es un formulario `https://` o un correo institucional (nunca de una persona ni de dominios personales como gmail, hotmail, yahoo u outlook); `codigo_org` `^[A-Z0-9-]{3,32}$`. Si un dato no se pudo comprobar, el campo dice `[VERIFICAR]`.
- `seguimiento.csv` — encabezado exacto `codigo_org,fecha_envio,version_plantilla,respuesta,fecha_respuesta,notas`, sin filas (el fundador lo llena).
- `kit-piloto.md` — `## Qué le pedimos a la organización`, `## Qué recibe a cambio` (panel F17 con datos agregados y el informe de cierre de cohorte), `## Acuerdo de piloto` (una página).
- `pauta-entrevistas.md` — pauta de seguimiento cualitativo para usuarias que acepten conversar; integra las columnas de `seguimiento-entrevistas.csv` de la raíz del repo.

**Files**
- `alianzas/plantillas/asociacion-pacientes.md` — new
- `alianzas/organizaciones.csv` — new
- `alianzas/seguimiento.csv` — new
- `alianzas/kit-piloto.md` — new
- `alianzas/pauta-entrevistas.md` — new

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `pnpm -C app exec tsx scripts/check-alianzas.ts todo` runs **THE SYSTEM SHALL** exit 0 after finding the five templates, the exact headers of `organizaciones.csv` and `seguimiento.csv`, at least 20 organization rows and the three headings of `kit-piloto.md`.
2. **WHEN** any `organizaciones.csv` row has a `tipo` outside the allowed list, a `fuente` not starting with `https://`, a malformed `fecha_consulta` or a contact at gmail, hotmail, yahoo or outlook **THE SYSTEM SHALL** make the script exit 1 naming the row.
3. **WHEN** `alianzas/pauta-entrevistas.md` is read **THE SYSTEM SHALL** mention `seguimiento-entrevistas.csv`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
pnpm -C app exec tsx scripts/check-alianzas.ts todo
grep -q "seguimiento-entrevistas.csv" alianzas/pauta-entrevistas.md
```

**Checkpoint**

```bash
git add -A && git commit -m "E9-T6: Armar la lista de organizaciones y el kit de piloto"
git tag step-65-alianzas-kit
```

Run both after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts.

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `tests/unit/web-site.test.ts` and `tests/unit/web-contact-route.test.ts` run **THE SYSTEM SHALL** exit 0.
2. **WHEN** `pnpm -C app exec tsx scripts/check-alianzas.ts todo` runs **THE SYSTEM SHALL** exit 0.

```bash
pnpm -C app test tests/unit/web-site.test.ts
pnpm -C app test tests/unit/web-contact-route.test.ts
pnpm -C app exec tsx scripts/check-alianzas.ts todo
```

Run from the project root. Both criteria are decided by these commands.

## Pitfalls

- **El sitio no tiene build**: cada página se edita a mano; los cambios de pie y favicon se hacen página por página en el paso que la toca.
- **Lighthouse ≥ 90 y Search Console** se comprueban en producción: van a la lista de lanzamiento.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — `git tag -l 'step-*'` lists `step-60-web-base`, `step-61-web-legal`, `step-62-web-relato`, `step-63-web-contacto`, `step-64-alianzas-plantillas`, `step-65-alianzas-kit`.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `app/.env.example` updated if this epic added a variable.
- [ ] One commit per task, each prefixed with its task id, each followed by its checkpoint tag.
- [ ] Si esta épica cierra una fase del brief: resumen corto al fundador (qué funciona, cómo probarlo, qué se decidió en `DECISIONES.md`, qué necesita) y `PENDIENTES.md` al día.
