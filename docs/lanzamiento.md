# Lista de lanzamiento de Sole

Esta lista es para ti, fundador. Sigue el orden: cada casilla es una sola acción, dice dónde se hace y cómo saber que quedó bien. No necesitas programar. Marca cada casilla tú, a mano, cuando la termines; aquí todas están sin marcar.

**Qué es `[VERIFICAR]`.** Marca un nombre de menú, un límite o un precio de un proveedor (Supabase, Vercel, Resend, Sentry, Cloudflare, GitHub) que no se pudo confirmar desde el repositorio. Los paneles cambian de nombre: si no encuentras el menú con ese nombre exacto, busca uno parecido y sigue. Los límites y precios se confirman en la página oficial que enlaza `docs/limites.md`.

**Regla de oro.** Ninguna clave ni contraseña se escribe en el repositorio, en este documento ni en una conversación (tampoco con Claude). Solo se pegan en estos lugares:

- Vercel → Project → Settings → Environment Variables (las variables de la app).
- GitHub → repositorio → Settings → Secrets and variables → Actions (los secretos de los flujos automáticos).
- El Vault de Supabase (los dos secretos de los avisos programados).

**Programas que se nombran.**

- **Git Bash en la carpeta del proyecto**: abre Git Bash y escribe `cd /d/proyectos/sole` (ajusta la ruta si tu carpeta está en otro lugar). Todos los comandos de este documento se pegan ahí, desde la raíz del proyecto. Una vez por cada Git Bash nueva, pega esto para que `pnpm` funcione. Si salió bien, no aparece nada:

```bash
export PATH="$HOME/.local:$HOME/.local/bin:$PATH"
```

- **SQL Editor del panel de Supabase**: el editor donde se pegan consultas SQL, dentro de tu proyecto de producción. `[VERIFICAR]` el nombre exacto del menú.
- **Vercel**, **GitHub** y los demás paneles: se abren en el navegador, con tu cuenta.

**Qué hacen los agentes y qué haces tú.** Los agentes no despliegan: `supabase link`, `supabase db push` y todo lo de Vercel los haces tú, uno a uno, como dice abajo. Los procedimientos largos (desplegar, respaldar, rotar claves) están en `docs/mantenimiento.md`; aquí solo se remite a su sección.

## Cuentas y dominios

Se crean antes de todo lo demás. Para cada servicio: entra al sitio, crea la cuenta con tu correo y elige el plan gratuito. Guarda tus contraseñas en tu gestor de contraseñas, no en un archivo del proyecto.

- [ ] Planes gratuitos, sin tarjeta. Mientras creas cada cuenta de abajo, elige el plan gratuito y no ingreses una tarjeta. Si un proveedor te la exige, deja el tope de gasto en cero y las alertas de uso activadas. Cómo saber que quedó bien: en el panel de facturación (o «Billing», `[VERIFICAR]` el nombre) de cada proveedor dice plan gratuito o muestra el tope en cero. Las cifras de cada plan están en `docs/limites.md`; las que dicen `[VERIFICAR]` se confirman en la página oficial enlazada en su fila.
- [ ] Supabase: entra a https://supabase.com/dashboard, crea una organización si no la tienes y un proyecto nuevo llamado `sole`. En la región elige São Paulo (`South America (São Paulo)`, `[VERIFICAR]` el nombre). Escribe la contraseña de la base de datos que te pide el panel y guárdala en tu gestor de contraseñas: la vas a necesitar abajo. Cómo saber que quedó bien: el proyecto aparece en tu lista de proyectos y termina de crearse sin mensajes de error. El plan gratuito permite dos proyectos y el otro ya es `sole-web` (el formulario del sitio).
- [ ] Vercel: entra a https://vercel.com, crea la cuenta e inicia sesión con tu cuenta de GitHub, para que pueda ver el repositorio. Cómo saber que quedó bien: ves el panel de Vercel (Overview) sin proyectos todavía. Recuerda: el plan Hobby es solo para uso personal y no comercial; si el piloto pasa a cobrar, hay que pasar a Pro (ver `docs/limites.md`).
- [ ] Resend: entra a https://resend.com y crea la cuenta. Cómo saber que quedó bien: ves el panel de Resend.
- [ ] Sentry: entra a https://sentry.io/signup/ y crea la cuenta. Crea un proyecto de tipo Next.js llamado `sole` (`[VERIFICAR]` el nombre de la plataforma). Cómo saber que quedó bien: el proyecto aparece en tu lista y Sentry te muestra la dirección (DSN) del proyecto.
- [ ] Cloudflare Turnstile: entra a https://dash.cloudflare.com, crea la cuenta y abre Turnstile (menú lateral, `[VERIFICAR]` el nombre). Crea un sitio con los dominios `app.solecuida.com` y `solecuida.com`. Cómo saber que quedó bien: el sitio aparece en la lista de Turnstile con una «site key» (clave del sitio) y una «secret key» (clave secreta).
- [ ] Google Search Console: entra a https://search.google.com/search-console y agrega `solecuida.com`. Cómo saber que quedó bien: la propiedad aparece verificada. Sigue las instrucciones de verificación que te dé Google (normalmente un registro DNS).
- [ ] Dominio `app.solecuida.com` en Vercel: se hace en `## Variables en Vercel`, después de conectar el repositorio. Aquí solo confirma dónde administras el DNS de `solecuida.com` (el proveedor donde compraste el dominio). No cambies ningún registro de Zoho (correo de `solecuida.com`): `[VERIFICAR]` en tu panel de DNS cuáles son, antes de tocar nada.

Secretos de GitHub Actions. Se crean en GitHub → repositorio → Settings → Secrets and variables → Actions → New repository secret `[VERIFICAR]` que los menús sigan así. Cada uno es una casilla:

- [ ] `GITLEAKS_LICENSE` (ya puesto): confirma que aparece en la lista de secretos del repositorio. Es la licencia gratuita de gitleaks-action que pide la organización `solecuida` (https://gitleaks.io). Sin ella, el job `gitleaks` de CI falla. Cómo saber que quedó bien: el nombre está en la lista (el valor no se muestra) y la última ejecución de CI en la pestaña Actions está en verde.
- [ ] `AGE_PUBLIC_KEY`: la clave pública con la que se cifra el respaldo nocturno. Se crea en `## Antes de abrir al público`, paso del primer respaldo, porque primero hay que crear el par de claves con `age`. La clave privada (`clave.txt`) la guardas tú, fuera de línea, en dos lugares, y nunca se sube. Cómo saber que quedó bien: el nombre `AGE_PUBLIC_KEY` aparece en la lista de secretos.
- [ ] `SUPABASE_DB_URL`: la dirección de conexión de la base de producción, para el respaldo. Se crea en `## Antes de abrir al público`, en el mismo paso. Cómo saber que quedó bien: el nombre `SUPABASE_DB_URL` aparece en la lista de secretos.

## Variables en Vercel

Aquí se conecta el repositorio y se pegan las variables. Los nombres son exactamente los de `app/.env.example`. Todas se pegan en Vercel → Project → Settings → Environment Variables, en el ambiente de Producción (Production), nunca en el repositorio ni en un chat. Después de pegar o cambiar una variable hay que volver a desplegar.

### Conectar el repositorio

- [ ] En Vercel, pulsa «Add New…» → «Project» `[VERIFICAR]` y elige el repositorio de Sole de tu cuenta de GitHub («Import»). Cómo saber que quedó bien: Vercel muestra la pantalla de configuración del proyecto con el repositorio elegido.
- [ ] En esa pantalla, en «Root Directory» (directorio raíz, `[VERIFICAR]`), elige la carpeta `app`. Deja el «Framework Preset» en Next.js. Cómo saber que quedó bien: Vercel detecta Next.js solo. No uses «Deploy» todavía: si te deja, abre antes «Environment Variables» y sigue con las casillas de abajo; si ya se creó el proyecto, sigue igual en Settings. Un primer despliegue sin variables va a fallar y no pasa nada: se repite al final.
- [ ] Confirma la rama de producción: en Vercel → Project → Settings → Git `[VERIFICAR]`, la rama de producción es `main`. El archivo `app/vercel.json` ya hace que solo `main` se publique y fija la región `gru1` (São Paulo). Cómo saber que quedó bien: «Production Branch» dice `main`.

### Variables que te entregan los paneles

Para cada una: ábrela en Vercel → Project → Settings → Environment Variables → «Add New» (`[VERIFICAR]`), escribe el nombre exacto, pega el valor, marca solo el ambiente Production y guarda. Cómo saber que quedó bien: el nombre aparece en la lista (el valor queda oculto).

- [ ] `APP_URL`: escribe a mano `https://app.solecuida.com`. No es un secreto.
- [ ] `SUPABASE_URL`: del panel de Supabase del proyecto `sole`, Project Settings → API, «Project URL» `[VERIFICAR]`. Termina en `.supabase.co`.
- [ ] `SUPABASE_PUBLISHABLE_KEY`: del mismo panel, API Keys, la clave «publishable» (pública) `[VERIFICAR]` el nombre.
- [ ] `SUPABASE_SECRET_KEY`: del mismo panel, API Keys, la clave «secret» (secreta) `[VERIFICAR]` el nombre. Es solo para el servidor: nunca se comparte.
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: de Cloudflare → Turnstile → tu sitio, la «site key» (clave del sitio). Es pública.
- [ ] `TURNSTILE_SECRET_KEY`: de Cloudflare → Turnstile → tu sitio, la «secret key» (clave secreta). Es la misma que se pega después en el panel de Supabase (`## Supabase de producción`).
- [ ] `NEXT_PUBLIC_SENTRY_DSN`: de Sentry → Project Settings → Client Keys (DSN) `[VERIFICAR]`. Es pública.
- [ ] `SENTRY_AUTH_TOKEN`: de Sentry → Settings → Auth Tokens `[VERIFICAR]`. Crea un token nuevo y cópialo al tiro: Sentry lo muestra una sola vez. Sirve para subir los mapas de código en el build.
- [ ] `SENTRY_ORG`: el nombre corto (slug) de tu organización en Sentry; aparece en la dirección de Sentry cuando estás dentro de la organización.
- [ ] `SENTRY_PROJECT`: el nombre corto (slug) del proyecto de Sentry; aparece en la dirección del proyecto.
- [ ] `RESEND_API_KEY`: de Resend → API Keys `[VERIFICAR]`. Crea una clave con permiso de envío y cópiala al tiro. Se crea en `## Correo`; si todavía no la tienes, pega esta variable cuando llegues ahí.
- [ ] `EMAIL_FROM`: escribe a mano `Sole <avisos@notificaciones.solecuida.com>`. No es un secreto.
- [ ] `VAPID_SUBJECT`: escribe a mano `mailto:hola@solecuida.com`. No es un secreto.

### Variables que generas tú

Estas las inventa tu computador, con un comando que muestra el valor en pantalla. Cópialo directo a Vercel y no lo guardes en ningún archivo del proyecto. En local, `pnpm -C app env:local` las genera igual (con `randomBytes` de Node); los comandos de abajo son equivalentes.

- [ ] `CRON_SECRET`: el secreto de los avisos programados. Pega en Git Bash:

```bash
openssl rand -hex 32
```

  Debería mostrar una línea de 64 letras y números. Pégala en Vercel como `CRON_SECRET`. Guárdala también en tu gestor de contraseñas: la vas a necesitar de nuevo para el Vault de Supabase.

- [ ] `IP_HASH_SECRET`: el secreto que anonimiza las IP y los correos en los límites de frecuencia. Pega en Git Bash:

```bash
openssl rand -hex 32
```

  Debería mostrar otra línea de 64 letras y números, distinta a la anterior. Pégala en Vercel como `IP_HASH_SECRET`.

- [ ] `FIELD_ENCRYPTION_KEY`: la clave que cifra medicamentos, bitácora y notas de contactos. Tiene la forma `<versión>:<32 bytes en base64>`; la primera vez la versión es `1`. Pega en Git Bash:

```bash
echo "1:$(openssl rand -base64 32)"
```

  Debería mostrar `1:` seguido de 44 caracteres que terminan en `=`. Pégalo completo, con el `1:`, en Vercel como `FIELD_ENCRYPTION_KEY`. Guárdalo también en tu gestor de contraseñas: **si pierdes esta clave, los datos cifrados no se pueden recuperar**. (Equivalente con Node: `node -e "console.log('1:'+require('crypto').randomBytes(32).toString('base64'))"`.) `FIELD_ENCRYPTION_KEY_PREVIOUS` se deja sin crear: solo se usa al rotar la clave, y eso se explica en `docs/mantenimiento.md`, sección `## Rotar claves`.

- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`: el par de claves de los avisos al teléfono. Pega en Git Bash, en la carpeta del proyecto:

```bash
pnpm -C app exec web-push generate-vapid-keys
```

  Debería mostrar una clave pública (Public Key) y una privada (Private Key). Pega la pública en Vercel como `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y la privada como `VAPID_PRIVATE_KEY`. Si se cambian después, las personas que ya activaron avisos tendrán que activarlos otra vez.

### Variables de la web (solo cuando exista el formulario)

Estas tres son del formulario de contacto de la web (`solecuida.com`) y solo se usan cuando esa parte está construida (paso 63). Si todavía no está, pégalas igual: no hacen daño.

- [ ] `WEB_CONTACT_SUPABASE_URL`: del panel del proyecto `sole-web` de Supabase, Project Settings → API `[VERIFICAR]`.
- [ ] `WEB_CONTACT_SUPABASE_SECRET_KEY`: del mismo panel, API Keys, la clave secreta de `sole-web`. Es secreta y nunca llega al navegador.
- [ ] `WEB_ALLOWED_ORIGINS`: escribe a mano `https://solecuida.com,https://www.solecuida.com` (sin espacios). No es un secreto.

### Revisar que está todo

- [ ] Vercel → Project → Settings → Environment Variables: cuenta 20 nombres de producción (todos los de `app/.env.example` salvo `FIELD_ENCRYPTION_KEY_PREVIOUS`). Cómo saber que quedó bien: los 20 aparecen con valor oculto y ninguno sin ambiente Production.
- [ ] Conecta el dominio: en Vercel → Project → Settings → Domains `[VERIFICAR]`, agrega `app.solecuida.com`. Vercel te dirá qué registro DNS crear (normalmente un `CNAME`; `[VERIFICAR]` el valor exacto que muestra). Créalo en el lugar donde administras el DNS de `solecuida.com`. Cómo saber que quedó bien: el dominio aparece como válido («Valid Configuration» o similar, `[VERIFICAR]`) en Vercel; puede tardar un rato.

## Supabase de producción

Aquí se prepara el proyecto `sole` de Supabase. Todo se hace en https://supabase.com/dashboard, dentro del proyecto de producción, salvo donde diga Git Bash.

### Migraciones (lo haces tú, uno a uno)

Los agentes tienen prohibido ejecutar `supabase link` y `supabase db push`. El detalle largo está en `docs/mantenimiento.md`, sección `## Desplegar`.

- [ ] Busca el identificador de tu proyecto: panel de Supabase → Project Settings → General → «Reference ID» `[VERIFICAR]` el nombre. Cómo saber que quedó bien: es un texto corto de letras minúsculas. Anótalo.
- [ ] Enlaza tu carpeta con el proyecto de producción. Pega en Git Bash, cambiando `REF-DEL-PROYECTO` por el identificador:

```bash
pnpm -C app exec supabase link --project-ref REF-DEL-PROYECTO
```

  Te pide la contraseña de la base de datos de producción: pégala ahí, en la terminal. Cómo saber que quedó bien: termina sin mensajes de error.

- [ ] Mira qué migraciones se van a aplicar, sin cambiar nada. Pega en Git Bash:

```bash
pnpm -C app exec supabase db push --dry-run
```

  Cómo saber que quedó bien: lista los archivos de migración de `app/supabase/migrations` y no cambia nada.

- [ ] Aplica las migraciones. Pega en Git Bash:

```bash
pnpm -C app exec supabase db push
```

  Pregunta si confirmas: responde `Y`. Cómo saber que quedó bien: termina diciendo que la base está al día. Las tablas aparecen en el panel de Supabase → Table Editor `[VERIFICAR]`.

- [ ] Comprueba que la base de producción quedó limpia: sin cuentas ni datos de ejemplo (el `seed.sql` es solo para local y `db push` no lo aplica). En el SQL Editor del panel, pega:

```sql
select (select count(*) from auth.users) as cuentas, (select count(*) from public.profiles) as perfiles;
```

  Cómo saber que quedó bien: las dos cifras son 0 (antes de crear tu propia cuenta). Los recursos de Chile y el contenido inicial sí vienen en las migraciones; eso es lo esperado.

### Vault y avisos programados

El detalle está en `docs/mantenimiento.md`, sección `## Secretos en Vault`. Sin estos dos secretos, la base no avisa a la app y los recordatorios no salen.

- [ ] En el SQL Editor del panel de Supabase, crea la dirección de la app. Pega:

```sql
select vault.create_secret('https://app.solecuida.com', 'app_base_url');
```

  Cómo saber que quedó bien: muestra una fila con un código largo.

- [ ] En el mismo editor, crea el secreto de los avisos. Cambia `VALOR-DE-CRON_SECRET` por exactamente el mismo valor que pegaste en Vercel como `CRON_SECRET` (déjalo entre comillas simples; el nombre va en minúscula, `cron_secret`):

```sql
select vault.create_secret('VALOR-DE-CRON_SECRET', 'cron_secret');
```

  Cómo saber que quedó bien: muestra otra fila con un código largo.

- [ ] Comprueba que están, sin mostrar sus valores:

```sql
select name from vault.secrets where name in ('app_base_url', 'cron_secret');
```

  Cómo saber que quedó bien: lista las dos filas, `app_base_url` y `cron_secret`.

### Auth (ingreso)

Todo en el panel de Supabase → Authentication `[VERIFICAR]` los nombres de las pestañas. Lo que la app espera está en `app/supabase/config.toml`; el panel de producción debe coincidir con él.

- [ ] URL Configuration `[VERIFICAR]`: en «Site URL» escribe `https://app.solecuida.com`. En «Redirect URLs» agrega `https://app.solecuida.com/auth/confirm`. Cómo saber que quedó bien: las dos direcciones aparecen guardadas.
- [ ] Plantilla del enlace mágico (Email Templates → «Magic Link», `[VERIFICAR]`): en el asunto escribe `Tu enlace para entrar a Sole` y en el cuerpo pega el contenido del archivo `app/supabase/templates/magic-link.html` (ábrelo con el Bloc de notas, selecciona todo, copia y pega). Cómo saber que quedó bien: la vista previa muestra «Entra a Sole» y un botón «Entrar a Sole».
- [ ] Largo mínimo de contraseña: en la configuración de contraseñas o de proveedor Email `[VERIFICAR]`, pon 10 como largo mínimo y exige minúsculas, mayúsculas y números. Cómo saber que quedó bien: el panel muestra 10.
- [ ] Protección contra contraseñas filtradas: actívala si tu plan lo permite `[VERIFICAR]`. Cómo saber que quedó bien: el interruptor aparece activo, o el panel dice que el plan gratuito no lo ofrece (en ese caso anótalo en `PENDIENTES.md`).
- [ ] Captcha (Authentication → Attack Protection o similar, `[VERIFICAR]`): activa el captcha, elige Cloudflare Turnstile y pega la clave secreta de Turnstile (la misma de `TURNSTILE_SECRET_KEY`). Cómo saber que quedó bien: el captcha figura activo. Se prueba al final, en `## Antes de abrir al público`.
- [ ] Segundo paso (MFA) con app de códigos: debe estar habilitado el factor TOTP en Authentication → Multi-Factor (`[VERIFICAR]`). Cómo saber que quedó bien: TOTP aparece habilitado para inscribir y verificar. Sin esto, el panel `/admin` no te deja entrar.
- [ ] «Max rows» de la API: en Project Settings → API (`[VERIFICAR]`), confirma que coincide con `max_rows = 1000` de `app/supabase/config.toml`. Cómo saber que quedó bien: el panel dice 1000.
- [ ] Límites de correo de Auth: en Authentication → Rate Limits `[VERIFICAR]`, no los dejes en cero ni en infinito. Los valores de `config.toml` son solo para pruebas locales y no se copian a producción.

### Primer despliegue

- [ ] En Vercel → Project → Deployments, pulsa «Redeploy» en el último despliegue (o «Deploy» si no hay ninguno) `[VERIFICAR]`. Cómo saber que quedó bien: el despliegue termina en estado «Ready» (listo).
- [ ] Abre `https://app.solecuida.com/api/health` en el navegador. Cómo saber que quedó bien: aparece un texto con `"status":"ok"`. Si dice `db_unavailable`, revisa `SUPABASE_URL` y `SUPABASE_SECRET_KEY` en Vercel y que las migraciones se aplicaron.
- [ ] Comprueba que los avisos programados corren. Espera dos minutos y pega en el SQL Editor:

```sql
select status, start_time from cron.job_run_details order by start_time desc limit 5;
```

  Cómo saber que quedó bien: hay ejecuciones recientes con estado `succeeded`.

- [ ] Comprueba que los avisos llegan a la app. En el mismo editor, pega:

```sql
select status_code, created from net._http_response order by created desc limit 3;
```

  Cómo saber que quedó bien: filas recientes con `status_code` 200. Si ves 401, `CRON_SECRET` de Vercel y `cron_secret` del Vault no coinciden (se arregla con `## Secretos en Vault` de `docs/mantenimiento.md`, paso «Cambiar un secreto»).

### Tu acceso de administración

El detalle está en `docs/mantenimiento.md`, sección `## Dar acceso de admin`. Ninguna pantalla concede este permiso: se asigna a mano, una vez.

- [ ] Crea tu cuenta normal: entra a `https://app.solecuida.com`, pide tu enlace con tu correo y complétalo como cualquier persona. Cómo saber que quedó bien: llegas a la pantalla «Hoy» o a la bienvenida.
- [ ] Dátela como administradora. En el SQL Editor, cambia `TU-CORREO` por el correo con el que te registraste (déjalo entre comillas simples) y pega:

```sql
update public.profiles set is_admin = true where id = (select id from auth.users where email = 'TU-CORREO');
```

  Cómo saber que quedó bien: dice que se actualizó 1 fila. Si dice 0, el correo está mal escrito o la cuenta no existe.

- [ ] Configura el segundo paso: abre `https://app.solecuida.com/admin`. Te lleva a `/admin/mfa`. Escanea el código QR con tu app de códigos (Google Authenticator, Aegis, 1Password u otra), escribe el código de 6 dígitos y confirma. No recargues la página antes de terminar: si lo haces, se crea una inscripción nueva y la que escaneaste deja de servir (borra esa entrada de tu app y escanea la nueva). Cómo saber que quedó bien: entras al panel `/admin`. Si el QR no se deja escanear, usa la clave en texto de la misma pantalla (pendiente conocido: `PENDIENTES.md`).
- [ ] Cierra sesión y entra de nuevo a `/admin`. Cómo saber que quedó bien: te pide el código de la app y, al escribirlo, entras.

## Correo

El correo de la app sale por Resend desde `notificaciones.solecuida.com`. Nunca por Zoho: el correo personal de `solecuida.com` no se mezcla con los correos de la app.

- [ ] En Resend → Domains `[VERIFICAR]`, agrega el dominio `notificaciones.solecuida.com`. Elige la región más cercana (`[VERIFICAR]` las que ofrece). Cómo saber que quedó bien: Resend muestra una lista de registros DNS (SPF y DKIM) que debes crear.
- [ ] Crea esos registros DNS en el lugar donde administras `solecuida.com`, copiándolos tal cual los muestra Resend (tipo, nombre y valor). Crea solo los del subdominio `notificaciones`; no toques los registros de Zoho. Cómo saber que quedó bien: los registros se guardan en tu DNS sin reemplazar ninguno existente.
- [ ] Vuelve a Resend y pulsa «Verify» (verificar, `[VERIFICAR]`). Cómo saber que quedó bien: el dominio aparece como verificado, con SPF y DKIM en verde. Puede tardar un rato en propagarse.
- [ ] Crea la clave de API en Resend → API Keys, con permiso de envío, y pégala en Vercel como `RESEND_API_KEY` (si no lo hiciste antes). Cómo saber que quedó bien: el nombre aparece en Vercel → Environment Variables.
- [ ] Configura el SMTP de Supabase Auth, para que los enlaces de ingreso salgan por Resend. En el panel de Supabase → Authentication → SMTP Settings (o «Emails», `[VERIFICAR]`), activa el SMTP propio y llena: servidor `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = la clave de API de Resend. Remitente: `avisos@notificaciones.solecuida.com`, nombre `Sole`. Cómo saber que quedó bien: el panel guarda sin error.
- [ ] Prueba el correo: pide un enlace de ingreso desde `https://app.solecuida.com/entrar` con un correo tuyo distinto al de la cuenta de administración. Cómo saber que quedó bien: llega un correo «Tu enlace para entrar a Sole» desde `notificaciones.solecuida.com`, y no cae en spam; el enlace te lleva a la app. Si cae en spam, revisa SPF y DKIM en Resend.
- [ ] Alertas de uso de Resend: confirma el límite diario del plan gratuito (`docs/limites.md`: 100 correos al día y 3.000 al mes, `[VERIFICAR]` en https://resend.com/pricing). Un día con muchas altas puede toparse con el límite diario. Cómo saber que quedó bien: sabes cuál es y dónde mirarlo (panel de Resend).

## Antes de abrir al público

Mientras alguna casilla de esta sección siga abierta, el piloto no se abre a personas fuera de tu círculo (`docs/legal/eipd.md`, conclusión).

### Respaldo y restauración

El detalle completo está en `docs/mantenimiento.md`, secciones `## Respaldar y restaurar` y `## Simulacro de restauración`.

- [ ] Instala `age` y crea tu par de claves, siguiendo `## Respaldar y restaurar`, «Dejar el respaldo configurado», pasos 1 a 3. Guarda `clave.txt` (la clave privada) fuera de línea y en dos lugares, por ejemplo un pendrive y tu gestor de contraseñas. Cómo saber que quedó bien: `age --version` muestra un número y tienes `clave.txt` guardado en dos lugares. Nunca la subas al repositorio.
- [ ] En GitHub → Settings → Secrets and variables → Actions → New repository secret, crea `AGE_PUBLIC_KEY` y pega la clave pública (la línea que empieza con `age1`). Cómo saber que quedó bien: el nombre está en la lista de secretos.
- [ ] Crea el secreto `SUPABASE_DB_URL` en el mismo lugar. Su valor es la dirección de conexión de la base de producción: se copia del panel de Supabase, botón «Connect» (`[VERIFICAR]`), y se reemplaza `[YOUR-PASSWORD]` por la contraseña de la base. Cómo saber que quedó bien: el nombre está en la lista de secretos.
- [ ] Corre el primer respaldo a mano: GitHub → pestaña Actions → flujo `backup` → «Run workflow». Cómo saber que quedó bien: la ejecución termina en verde y, al entrar a ella, en Artifacts aparece `respaldo-cifrado` con un archivo `.age`. Nunca debe haber un archivo `.sql` sin cifrar.
- [ ] Haz el simulacro de restauración, siguiendo `## Simulacro de restauración` de `docs/mantenimiento.md`, pasos 1 a 7. Se restaura en tu Supabase local (Docker abierto), nunca sobre producción. Cómo saber que quedó bien: los tres conteos del paso 6 son parecidos a los de producción. Anota la fecha del simulacro en `PENDIENTES.md`.
- [ ] Confirma que el respaldo diario seguirá corriendo: el flujo `backup` queda activo en Actions y aparece con ejecuciones diarias. Qué respalda el plan gratuito de Supabase por su cuenta es `[VERIFICAR]` en https://supabase.com/pricing.
- [ ] Confirma el keep-alive: GitHub → Actions → flujo `keepalive` → «Run workflow». Cómo saber que quedó bien: termina en verde. Evita que Supabase pause el proyecto por inactividad. Si llegara a pausarse, sigue `## Si Supabase pausa el proyecto` de `docs/mantenimiento.md`.

### Seguridad

- [ ] Escaneo ZAP: GitHub → Actions → flujo `zap` → «Run workflow», con la dirección `https://app.solecuida.com`. Cómo saber que quedó bien: termina y en Artifacts queda el informe; abre el informe y comprueba que no hay alertas altas (High). Si las hay, anótalas en `PENDIENTES.md` y no abras al público.
- [ ] Advisors de Supabase: en el panel → Advisors (`[VERIFICAR]` el menú; suele estar en el menú lateral), corre «Security Advisor» y «Performance Advisor». Cómo saber que quedó bien: ninguno muestra hallazgos críticos; los hallazgos menores se anotan en `PENDIENTES.md`. Revisa también los logs del proyecto (Logs, `[VERIFICAR]`). Se repite antes de cada publicación.
- [ ] Confirma que `x-forwarded-for` lo escribe Vercel. El límite de intentos de ingreso usa esa cabecera (`app/src/app/(auth)/entrar/actions.ts`). Busca en la documentación de Vercel «x-forwarded-for» (https://vercel.com/docs, `[VERIFICAR]` la página exacta) y confirma que Vercel la reemplaza en vez de aceptar la que manda quien visita. Cómo saber que quedó bien: la documentación lo dice y lo anotas en `docs/seguridad/owasp-top10.md` (la línea que dice «se confía en que Vercel la fije»). El límite por correo funciona igual aunque esto falle.
- [ ] Captcha de Turnstile: abre `https://app.solecuida.com/entrar` en una ventana privada. Cómo saber que quedó bien: aparece el captcha; pide el enlace con tu correo y llega el correo. Luego, comprueba que Supabase rechaza el ingreso sin captcha (debería, si quedó activado en `## Supabase de producción`).
- [ ] Error de prueba en Sentry: provoca un error a propósito (pídele a Claude que lo haga, porque requiere tocar código) y ábrelo en Sentry → Issues. Cómo saber que quedó bien: aparece el error sin tu correo ni otros datos personales. Activa las alertas de Sentry hacia tu correo (Sentry → Alerts, `[VERIFICAR]`).
- [ ] Alertas de los proveedores hacia tu correo: confirma en Supabase, Vercel y Cloudflare que las notificaciones por correo están activas (`docs/seguridad/plan-incidentes.md`, `[VERIFICAR]` los menús). Cómo saber que quedó bien: recibes un correo de prueba o ves el interruptor activo en cada panel.
- [ ] Plan de incidentes: haz un simulacro de `docs/seguridad/plan-incidentes.md` al menos una vez antes de abrir (por ejemplo, leerlo entero y recorrer qué harías si se filtrara una clave), y repítelo una vez al año. Cómo saber que quedó bien: anotaste la fecha en `PENDIENTES.md`.
- [ ] Acuerdo de confidencialidad: si vas a dar acceso a datos a otra persona, firma antes un acuerdo (`docs/seguridad/iso27001-anexo-a.md`, 6.6). Cómo saber que quedó bien: no hay nadie con acceso sin acuerdo.
- [ ] Tope de gasto en cero o planes sin tarjeta, de nuevo: revisa en los paneles de Supabase, Vercel, Resend, Sentry, Cloudflare y GitHub (Settings → Billing and plans, `[VERIFICAR]`) que ninguno tiene tarjeta, o que el tope de gasto está en cero con alerta. Confirma cada cifra `[VERIFICAR]` de `docs/limites.md` en la página oficial de su fila. Cómo saber que quedó bien: cada panel muestra plan gratuito o tope en cero.

### Contenido y textos

- [ ] Verifica los recursos de Chile: entra a `https://app.solecuida.com/admin/contenido`, pestaña «Recursos». Para cada uno, abre el enlace a su fuente oficial, confirma el teléfono y el enlace, y pulsa «Marcar como verificado hoy». Mientras no lo marques, no se muestra a nadie. Cómo saber que quedó bien: los 7 recursos aparecen como verificados.
- [ ] Confirma el 131 (SAMU) en una fuente oficial del Ministerio de Salud de Chile (`[VERIFICAR]` la página exacta; búscalo en https://www.minsal.cl o en la página de la red de urgencia, y no en un sitio no oficial). Cómo saber que quedó bien: una fuente oficial lo dice, y dejaste anotada la dirección de esa fuente y la fecha en `PENDIENTES.md`. El número también debe estar así en la app (`/admin/contenido`).
- [ ] Revisa el contenido inicial: las plantillas por tipo de cuidado, los 23 consejos y actividades, y los 7 recursos, que están en `app/supabase/migrations/20261114001000_contenido_inicial.sql`. Léelos y anota lo que cambiarías. Cómo saber que quedó bien: los leíste completos.
- [ ] Lee los textos de «Mi cuenta», sobre todo el de cerrar el cuidado de una persona por fallecimiento y el de borrar la cuenta (`app/src/components/account/` y `app/src/app/(app)/cuenta/page.tsx`). Cómo saber que quedó bien: los leíste en la app, con tu cuenta.
- [ ] Lee los textos de los permisos de la bienvenida (`app/src/app/(onboarding)/bienvenida/consentimientos/page.tsx`, versión `2026-11-14`) y las páginas `solecuida.com/terminos.html` y `cookies.html`. Antes del lanzamiento conviene que alguien con formación legal los lea. Cómo saber que quedó bien: los leíste y, si tienes quien los revise, lo hizo.
- [ ] Lee los documentos de seguridad y privacidad (`docs/seguridad/` y `docs/legal/`). Todo lo marcado `[VERIFICAR]` (plazos y bases de la Ley 21.719, país donde cada proveedor guarda los datos, edición vigente del OWASP Top 10, numeración de ASVS 5.0) lo confirma alguien con formación legal. Cómo saber que quedó bien: cada `[VERIFICAR]` quedó confirmado o anotado en `PENDIENTES.md`.
- [ ] Garantías de los proveedores: revisa en `docs/legal/registro-actividades.md` el país donde cada proveedor guarda los datos y las garantías para enviarlos fuera de Chile, y confirma cada `[VERIFICAR]` (`docs/legal/eipd.md`, conclusión). Cómo saber que quedó bien: no queda ningún `[VERIFICAR]` abierto en esa columna, o lo que queda está anotado en `PENDIENTES.md`.

### Pruebas con teléfonos de verdad

Las pruebas automáticas usan un emisor falso: no prueban que el aviso llegue a un teléfono. Se prueba con `https://app.solecuida.com`, ya desplegada.

- [ ] Android con Chrome: abre la app, entra, ve a «Avisos» y activa los avisos (acepta el permiso del navegador). Crea un recordatorio para dentro de unos minutos. Cómo saber que quedó bien: llega la notificación a la hora, y también el «¿Lo hiciste?», y puedes responder desde la notificación. Prueba también con el teléfono bloqueado y con ahorro de batería activado.
- [ ] iPhone (iOS 16.4 o más): abre la app en Safari, pulsa Compartir → «Agregar a inicio» (`[VERIFICAR]` los nombres en iOS), abre Sole desde el ícono nuevo (no desde Safari), entra y activa los avisos en «Avisos». Crea un recordatorio para dentro de unos minutos. Cómo saber que quedó bien: llega la notificación, llega el «¿Lo hiciste?» y puedes responder desde la notificación. Sin instalar la app en el inicio, el iPhone no recibe avisos.
- [ ] Botón «Probar aviso» de «Avisos»: úsalo en ambos teléfonos. Cómo saber que quedó bien: el aviso de prueba llega y el indicador de «Avisos activos» muestra el estado en texto.

### Recorridos finales

- [ ] Recorre a mano, en producción y con una cuenta de prueba tuya, los flujos principales: crear cuenta, bienvenida con consentimientos, crear un recordatorio, marcarlo hecho, escribir en la bitácora, exportar tus datos y borrar la cuenta de prueba. Cómo saber que quedó bien: cada paso funciona sin error. Borra la cuenta de prueba al final.
- [ ] Recorrido solo con teclado (Tab, Enter, Esc) y una pasada con TalkBack (lector de pantalla de Android) por el flujo principal. Cómo saber que quedó bien: puedes completar el flujo sin el mouse y TalkBack lee los botones con sentido.
- [ ] Lighthouse: en Chrome, abre `https://app.solecuida.com` y `https://solecuida.com`, F12 → pestaña Lighthouse, modo móvil, y córrelo. Cómo saber que quedó bien: rendimiento, accesibilidad, buenas prácticas y SEO dan 90 o más, en las dos.
- [ ] Sitemap: en Google Search Console, envía el sitemap de `solecuida.com` (Sitemaps en el menú, `[VERIFICAR]`). Cómo saber que quedó bien: el estado dice «Correcto» (`[VERIFICAR]`). Solo la portada de la app `/` es indexable.
- [ ] Prueba un rollback a propósito: en Vercel → Deployments, busca un despliegue anterior que funcionaba y usa «Promote» (o «Rollback», `[VERIFICAR]`); comprueba `https://app.solecuida.com/api/health` y vuelve a promover el último. Cómo saber que quedó bien: sabes hacerlo y la app respondió bien en ambos estados.
- [ ] Formulario de la web (solo si ya está construido): pruébalo en producción, con Turnstile. Después, retira la política anónima de inserción de `sole-web.contactos`. Cómo saber que quedó bien: el mensaje llega al proyecto `sole-web` y, tras retirar la política, un envío directo sin pasar por la app es rechazado. Si el formulario todavía no está construido, deja esta casilla para después.
- [ ] Confirma las dos cosas que no se construyeron y siguen pendientes (`docs/seguridad/checklist-6.2.md`, puntos 9 y 12): el enlace de la persona cuidada y los límites `invitation` y `emergency` se conectan en sus fases propias. Cómo saber que quedó bien: ve a `PENDIENTES.md` y a ese checklist, y comprueba que ya no dicen «Lista de lanzamiento»; si todavía lo dicen y esas funciones ya están en producción, no abras al público.

### Todo en orden

- [ ] Revisa una última vez que ningún secreto está en el repositorio: GitHub → pestaña Actions → la última ejecución de CI debe tener el job `gitleaks` en verde. Cómo saber que quedó bien: marca verde.
- [ ] Abre al público. Cómo saber que quedó bien: solo tú decides cuándo. Después, revisa cada semana Sentry, `/admin/comentarios`, el panel `/admin/limites` y que `backup` y `keepalive` salgan en verde (`docs/mantenimiento.md`, `## Revisar errores`).
