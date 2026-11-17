# Manual de mantenimiento de Sole

Este manual es para ti, fundador. Cada sección explica en una frase para qué sirve y después da pasos cortos y numerados. No necesitas programar: copias un comando, lo pegas en el programa que se indica y comparas con lo que debería aparecer.

## Antes de empezar

Los programas que se nombran en este manual son cuatro:

- **Git Bash en la carpeta del proyecto**: abre Git Bash y escribe `cd /d/proyectos/sole` (ajusta la ruta si tu carpeta está en otro lugar). Todos los comandos con `pnpm` se pegan aquí, siempre desde la raíz del proyecto.
- **SQL Editor del panel de Supabase**: en el panel de Supabase, dentro de tu proyecto de producción, el editor donde se pegan consultas SQL. `[VERIFICAR]` el nombre exacto del menú en el panel; está en el menú lateral y se llama parecido a «SQL Editor».
- **Pantalla de Vercel**: el panel de Vercel, dentro del proyecto de Sole.
- **Pantalla de GitHub**: la página del repositorio de Sole en github.com.

Una vez por cada Git Bash nueva, pega esto para que `pnpm` funcione:

```bash
export PATH="$HOME/.local:$HOME/.local/bin:$PATH"
```

Si salió bien, no aparece nada: solo vuelve a quedar el cursor listo.

**Regla de oro:** las claves y contraseñas nunca se escriben en este manual, ni en el repositorio, ni en una conversación. Solo se pegan en estos tres lugares:

- Vercel → Project → Settings → Environment Variables (las variables de la app).
- GitHub → Settings → Secrets and variables → Actions (los secretos de los respaldos). `[VERIFICAR]` que los nombres de los menús sigan así.
- El Vault de Supabase (los secretos que usan los avisos programados; ver `## Secretos en Vault`).

Los nombres de todas las variables están en `app/.env.example`, sin valores.

## Desplegar

Sirve para publicar una versión nueva de la app y de la base de datos de producción.

Cómo funciona: Vercel publica solo cuando se une un cambio a la rama `main` de GitHub (así lo dice `app/vercel.json`). Los cambios a la base de datos (migraciones) se aplican aparte, con un comando.

1. Comprueba que el último cambio en `main` tiene la marca verde en GitHub (pestaña Actions). Si está roja, no sigas: pide ayuda.
2. Si el cambio trae migraciones nuevas (archivos nuevos en `app/supabase/migrations`), enlaza tu carpeta con el proyecto de producción. Se hace una sola vez. Pega esto en Git Bash en la carpeta del proyecto (cambia `REF-DEL-PROYECTO` por el identificador de tu proyecto de producción, que aparece en el panel de Supabase en Project Settings → General `[VERIFICAR]`):

```bash
pnpm -C app exec supabase link --project-ref REF-DEL-PROYECTO
```

   Te pedirá la contraseña de la base de datos de producción: pégala ahí, en la terminal. Si salió bien, termina sin mensajes de error.

3. Mira qué migraciones faltan, sin aplicar nada. Pega en Git Bash en la carpeta del proyecto:

```bash
pnpm -C app exec supabase db push --dry-run
```

   Debería listar los archivos de migración que se van a aplicar, y no cambiar nada.

4. Aplica las migraciones. Pega en Git Bash en la carpeta del proyecto:

```bash
pnpm -C app exec supabase db push
```

   Pregunta si confirmas: responde `Y`. Si salió bien, termina diciendo que la base está al día.

5. En la pantalla de Vercel, abre la pestaña Deployments. El despliegue de `main` debería terminar en estado «Ready» (listo). `[VERIFICAR]` el nombre exacto de la pestaña y del estado.
6. Abre `https://app.solecuida.com/api/health` en el navegador. Debería mostrar un texto con `"status":"ok"`.
7. Si algo salió mal: en la pantalla de Vercel, en Deployments, busca el despliegue anterior que funcionaba y usa la opción de volver a él (Promote o Rollback `[VERIFICAR]`).

## Respaldar y restaurar

Sirve para tener copias de seguridad de la base de datos de producción y saber cómo recuperarla.

Cómo funciona: un flujo de GitHub (`.github/workflows/backup.yml`) corre todos los días a las 06:30 UTC. Descarga la base, la cifra con tu clave pública (`age`) y guarda solo el archivo cifrado, con extensión `.age`, durante 7 días. Nunca se sube nada sin cifrar. La clave privada la guardas tú, fuera de línea.

### Dejar el respaldo configurado (una sola vez)

1. Instala `age` en tu computador. En PowerShell (no en Git Bash), pega este comando. `[VERIFICAR]` que el nombre del paquete siga siendo ese:

```powershell
winget install FiloSottile.age
```

   Cierra y vuelve a abrir Git Bash. Después, en Git Bash, comprueba que quedó instalado:

```bash
age --version
```

   Debería mostrar un número de versión.

2. Crea tu par de claves. Pega en Git Bash, en una carpeta fuera del proyecto (por ejemplo `cd ~/Documents`):

```bash
age-keygen -o clave.txt
```

   Mostrará una línea que empieza con `Public key: age1...`. Esa es la clave pública. El archivo `clave.txt` es la clave privada.

3. Guarda `clave.txt` fuera de línea y en dos lugares (por ejemplo un pendrive y un gestor de contraseñas). Si la pierdes, los respaldos no se pueden abrir. Nunca la subas al repositorio.
4. En la pantalla de GitHub: Settings → Secrets and variables → Actions → New repository secret. Crea el secreto `AGE_PUBLIC_KEY` y pega la clave pública (la línea `age1...`).
5. Crea el secreto `SUPABASE_DB_URL` en el mismo lugar. Su valor es la dirección de conexión de la base de producción: se copia del panel de Supabase, botón Connect (Conectar) del proyecto `[VERIFICAR]`, y se reemplaza `[YOUR-PASSWORD]` por la contraseña de la base.
6. Prueba el respaldo sin esperar al día siguiente: en GitHub, pestaña Actions, elige el flujo del respaldo (`backup.yml`), pulsa «Run workflow». Al terminar debería quedar en verde y, al entrar a esa ejecución, mostrar un archivo `.age` en la sección Artifacts.

### Descargar un respaldo

1. En GitHub, pestaña Actions, abre la última ejecución verde del flujo del respaldo.
2. Al final de la página, en Artifacts, descarga el archivo. GitHub lo baja como un `.zip`: descomprímelo y dentro está el archivo `backup-<fecha>.tgz.age`.

Para abrirlo y comprobar que sirve, sigue `## Simulacro de restauración`.

## Simulacro de restauración

Sirve para comprobar que los respaldos de verdad se pueden abrir y restaurar, antes de necesitarlos de emergencia. Hazlo al menos una vez, y repítelo de vez en cuando.

Se restaura en el Supabase local de tu computador, nunca sobre producción. Necesitas Docker Desktop abierto.

1. Deja el archivo descargado (`backup-<fecha>.tgz.age`) y tu `clave.txt` en una carpeta de pruebas, por ejemplo `~/simulacro`. En Git Bash:

```bash
mkdir -p ~/simulacro
```

   No muestra nada si salió bien. Copia ahí los dos archivos con el explorador de Windows.

2. Descifra el respaldo. Pega en Git Bash, dentro de esa carpeta (`cd ~/simulacro`), cambiando `<fecha>` por la del archivo:

```bash
age -d -i clave.txt -o respaldo.tgz backup-<fecha>.tgz.age
```

   Debería crear `respaldo.tgz` sin mensajes de error. Si dice que la clave no sirve, es la clave equivocada.

3. Abre el paquete:

```bash
tar xzf respaldo.tgz
```

   Debería dejar tres archivos: `roles.sql`, `schema.sql` y `data.sql`. Compruébalo con:

```bash
ls
```

4. Vuelve a la carpeta del proyecto y arranca la base local vacía. Pega en Git Bash en la carpeta del proyecto, un comando después del otro:

```bash
pnpm -C app db:start
```

```bash
pnpm -C app db:reset
```

   El segundo deja la base local limpia y con las migraciones aplicadas. Debería terminar sin errores.

5. Restaura los tres archivos en orden: primero `roles.sql`, luego `schema.sql`, luego `data.sql`. Pega en Git Bash en la carpeta del proyecto, cambiando la ruta si tu carpeta de pruebas es otra. Cada comando usa el contenedor de la base local (se llama `supabase_db_sole`):

```bash
docker exec -i supabase_db_sole psql -U postgres -d postgres < ~/simulacro/roles.sql
```

```bash
docker exec -i supabase_db_sole psql -U postgres -d postgres < ~/simulacro/schema.sql
```

```bash
docker exec -i supabase_db_sole psql -U postgres -d postgres < ~/simulacro/data.sql
```

   Es normal que aparezcan avisos de objetos que «ya existen» (la base local ya tenía la estructura). No debería detenerse con un error grave que diga `FATAL`. Si aparecen muchos errores de tipo `ERROR`, anótalos: el simulacro sirvió para descubrir un problema, y es mejor encontrarlo ahora. `[VERIFICAR]` en el primer simulacro real si hace falta ajustar este paso.

6. Verifica los conteos. Pega en Git Bash:

```bash
docker exec -i supabase_db_sole psql -U postgres -d postgres -c "select (select count(*) from public.profiles) as perfiles, (select count(*) from public.reminders) as recordatorios, (select count(*) from public.journal_entries) as bitacora;"
```

   Debería mostrar una tabla con tres números. Compáralos con los de producción: en el SQL Editor del panel de Supabase, pega esta consulta y mira que sean parecidos (pueden diferir por lo ocurrido desde el respaldo):

```sql
select (select count(*) from public.profiles) as perfiles, (select count(*) from public.reminders) as recordatorios, (select count(*) from public.journal_entries) as bitacora;
```

7. Cuando termines, borra los archivos descifrados de la carpeta de pruebas, porque contienen datos reales:

```bash
rm -rf ~/simulacro/roles.sql ~/simulacro/schema.sql ~/simulacro/data.sql ~/simulacro/respaldo.tgz
```

   Anota la fecha del simulacro en `PENDIENTES.md`.

## Rotar claves

Sirve para cambiar una clave por otra nueva, por una sospecha de filtración o por orden periódico. Cada clave tiene su propio procedimiento. Después de cambiar variables en Vercel, siempre hay que volver a desplegar para que la app tome los valores nuevos.

Para generar valores nuevos al azar se usa Git Bash. Los valores se muestran en pantalla: cópialos directo a Vercel, no los guardes en ningún archivo del proyecto.

### FIELD_ENCRYPTION_KEY (clave que cifra medicamentos, bitácora y notas de contactos)

La clave tiene la forma `<versión>:<32 bytes en base64>`. Al rotar, la versión sube (de `1:` a `2:`), la clave vieja pasa a `FIELD_ENCRYPTION_KEY_PREVIOUS` y un script reescribe todos los datos cifrados con la nueva. Si algo se corta a la mitad, se puede volver a correr sin riesgo.

1. Genera la clave nueva. Pega en Git Bash (cambia el `2` por la versión que sigue a la actual):

```bash
echo "2:$(openssl rand -base64 32)"
```

   Debería mostrar algo como `2:` seguido de un texto largo. Cópialo.

2. En la pantalla de Vercel → Project → Settings → Environment Variables:
   - Copia el valor actual de `FIELD_ENCRYPTION_KEY` y pégalo en `FIELD_ENCRYPTION_KEY_PREVIOUS` (créala si no existe).
   - Pon el valor nuevo (el del paso 1) en `FIELD_ENCRYPTION_KEY`.
3. Vuelve a desplegar para que la app lea las dos claves (Deployments → los tres puntos del último despliegue → Redeploy `[VERIFICAR]`).
4. Para correr el script desde tu computador necesitas las mismas dos variables, apuntando a producción, en un archivo local que no se sube al repositorio. Pide ayuda a Claude para este paso la primera vez: nunca pegues las claves en una conversación.
5. Primero el simulacro, que no cambia nada. Pega en Git Bash en la carpeta del proyecto:

```bash
pnpm -C app exec tsx scripts/rotate-field-key.ts --dry-run
```

   Debería imprimir cuántos valores hay por tabla (recordatorios, bitácora, contactos) y avisar que no cambió nada.

6. Aplica el cambio de verdad. Pega en Git Bash en la carpeta del proyecto:

```bash
pnpm -C app exec tsx scripts/rotate-field-key.ts
```

   Debería imprimir los mismos conteos, ahora como valores reescritos. Si se corta o falla, vuelve a correrlo: retoma donde quedó y no pierde datos.

7. Vuelve a correr el simulacro del paso 5. Debería decir que no queda nada por reescribir.
8. Cuando todo esté reescrito, y solo entonces, borra `FIELD_ENCRYPTION_KEY_PREVIOUS` en Vercel y vuelve a desplegar. Guarda la clave vieja en tu gestor de contraseñas unas semanas, por si hay que abrir un respaldo antiguo: los respaldos anteriores a la rotación están cifrados con la clave vieja.

### CRON_SECRET (secreto de los avisos programados)

Está en dos lugares y hay que cambiar **los dos** a la vez; si no, los avisos dejan de salir.

1. Genera el valor nuevo. Pega en Git Bash:

```bash
openssl rand -hex 32
```

   Debería mostrar una línea de 64 letras y números. Cópiala.

2. En Vercel → Project → Settings → Environment Variables, cambia `CRON_SECRET` por ese valor. Vuelve a desplegar.
3. En el SQL Editor del panel de Supabase, cambia el del Vault siguiendo `## Secretos en Vault`, paso «Cambiar un secreto».
4. Comprueba que los avisos siguen saliendo: en el SQL Editor, espera dos minutos y pega:

```sql
select status_code, created from net._http_response order by created desc limit 3;
```

   Deberías ver filas recientes con `status_code` 200. Si ves 401, el secreto de Vercel y el del Vault no coinciden.

### VAPID (claves de las notificaciones push)

Atención: si se cambian, las personas que ya activaron avisos en su teléfono tendrán que volver a activarlos. Rótala solo si hay sospecha de filtración.

1. Genera el par nuevo. Pega en Git Bash en la carpeta del proyecto:

```bash
pnpm -C app exec web-push generate-vapid-keys
```

   Debería mostrar una clave pública y una privada.

2. En Vercel → Project → Settings → Environment Variables, cambia `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (la pública) y `VAPID_PRIVATE_KEY` (la privada). Vuelve a desplegar.

### Claves de Supabase

1. En el panel de Supabase, en la configuración de claves de API del proyecto, genera una clave secreta nueva `[VERIFICAR]` el nombre exacto del menú (aparece como API Keys o similar en Project Settings).
2. En Vercel → Project → Settings → Environment Variables, cambia `SUPABASE_SECRET_KEY` por la nueva (y `SUPABASE_PUBLISHABLE_KEY` si también la rotaste). Vuelve a desplegar.
3. Si guardaste la contraseña de la base en el secreto `SUPABASE_DB_URL` de GitHub, y la cambiaste, actualiza ese secreto en GitHub → Settings → Secrets and variables → Actions.
4. Recién ahí revoca la clave vieja en el panel de Supabase.

### Resend (correo)

1. En el panel de Resend, crea una clave de API nueva `[VERIFICAR]` el nombre exacto del menú.
2. En Vercel → Project → Settings → Environment Variables, cambia `RESEND_API_KEY`. Vuelve a desplegar.
3. Revoca la clave vieja en el panel de Resend.

Para Sentry (`SENTRY_AUTH_TOKEN`) y Turnstile (`TURNSTILE_SECRET_KEY`) el procedimiento es el mismo: crear la nueva en el panel del proveedor, cambiarla en Vercel, volver a desplegar y revocar la vieja.

## Revisar errores

Sirve para enterarte de que algo falla antes de que te escriba alguien.

1. Entra a Sentry (el panel del proyecto de Sole, con tu cuenta). `[VERIFICAR]` la dirección exacta de tu organización. Mira la lista de problemas («Issues»): los nuevos y los que más se repiten. Un mensaje que se repite muchas veces es más urgente que uno suelto.
2. Entra a `https://app.solecuida.com/admin/comentarios`. Debería pedirte tu usuario y el segundo paso (ver `## Dar acceso de admin`), y después mostrar los comentarios que dejaron las personas.
3. Lee los comentarios nuevos. Los que cuentan un error o una confusión, anótalos en `PENDIENTES.md`.
4. Una vez por semana, abre la pestaña Actions de GitHub y comprueba que el respaldo diario y el keep-alive (`keepalive.yml`, que mantiene despierta la base) salen en verde. Si uno está rojo, mira `## Si Supabase pausa el proyecto`.

## Agregar una organización

Sirve para dar de alta una organización aliada (por ejemplo, una agrupación de familiares) para el piloto.

1. Entra a `https://app.solecuida.com/admin/organizaciones` con tu cuenta de admin.
2. En el formulario de alta, escribe el **Nombre** (mínimo 2 letras), elige el **Tipo** y escribe un **Código** corto de 3 a 32 letras, números o guiones, por ejemplo `agrupacion-sur`.
3. Pulsa el botón para guardar. Debería volver a la lista y mostrar la organización nueva, sin mensaje de error. Si dice que el código ya existe, elige otro.
4. Para dejar de usar una organización sin borrarla, usa el botón de la lista que cambia su estado (activa o inactiva).

No envíes ningún correo a la organización desde este paso: los correos los escribes y envías tú.

## Dar acceso de admin

Sirve para que tu cuenta pueda entrar al panel de administración (`/admin`). Se hace una sola vez por persona, en dos pasos: primero el permiso, después el segundo paso de seguridad.

### Paso 1: darte el permiso

1. Crea tu cuenta normal en la app (`https://app.solecuida.com`) con tu correo, como cualquier persona.
2. Abre el SQL Editor del panel de Supabase de producción.
3. Pega esta consulta, cambiando `TU-CORREO` por el correo con el que te registraste (déjalo entre comillas simples):

```sql
update public.profiles set is_admin = true where id = (select id from auth.users where email = 'TU-CORREO');
```

   Debería mostrar «Success» y que se actualizó 1 fila (`1 row`). Si dice 0 filas, el correo está mal escrito o la cuenta no existe todavía.

4. Si prefieres hacerlo con el identificador de la cuenta en vez del correo, esta es la otra forma (cambia `<uuid>` por el identificador, que se ve en el panel de Supabase en Authentication → Users `[VERIFICAR]`):

```sql
update public.profiles set is_admin = true where id = '<uuid>';
```

Para quitar el permiso, la misma consulta con `false` en vez de `true`.

### Paso 2: configurar el segundo paso con una app de códigos

El panel de administración exige un segundo paso: un código de 6 dígitos de una app autenticadora (la de tu teléfono, por ejemplo Google Authenticator u otra similar).

1. Entra a la app con tu cuenta y abre `https://app.solecuida.com/admin`. Te llevará a la pantalla del segundo paso (`/admin/mfa`).
2. La pantalla muestra un código QR. Ábrelo con tu app autenticadora: «agregar cuenta» → «escanear código QR».
3. La app empezará a mostrar un código de 6 dígitos que cambia cada medio minuto. Escríbelo en la pantalla y confirma.
4. **La clave se escribe una sola vez y sin recargar la página.** Si recargas la página antes de terminar, se crea una inscripción nueva y la app autenticadora que ya escaneaste deja de servir: borra esa entrada de tu app y escanea el QR nuevo.
5. Si salió bien, entras al panel. Desde ahora, cada vez que entres a `/admin` te pedirá el código del momento. Si el código dice que «no calza o ya venció», espera al código siguiente y prueba otra vez.

Si pierdes el teléfono con la app autenticadora, pide ayuda a Claude: hay que borrar la inscripción desde el panel de Supabase y repetir el paso 2.

## Secretos en Vault

Sirve para guardar los dos secretos que necesita la base de datos para avisar a la app: la dirección de la app y el secreto de los trabajos programados. Cada minuto la base llama a `/api/cron/dispatch` (avisos) y cada día a las 07:15 UTC a `/api/cron/daily` (borrados e inactividad); si falta alguno de los dos secretos, no hace nada y no avisa.

Se guardan en el Vault de Supabase, nunca en el repositorio. Se escriben con SQL en el SQL Editor del panel de Supabase de producción.

### Crearlos (una sola vez)

1. En el SQL Editor del panel de Supabase, pega esto para la dirección de la app:

```sql
select vault.create_secret('https://app.solecuida.com', 'app_base_url');
```

   Debería mostrar una fila con un identificador (un código largo).

2. Pega esto para el secreto de los avisos, cambiando `VALOR-DE-CRON_SECRET` por exactamente el mismo valor que tiene `CRON_SECRET` en Vercel (Project → Settings → Environment Variables). El nombre del secreto va en minúscula, `cron_secret`:

```sql
select vault.create_secret('VALOR-DE-CRON_SECRET', 'cron_secret');
```

   Debería mostrar otra fila con un identificador. No guardes ese valor en ningún archivo.

3. Comprueba que están, sin mostrar sus valores:

```sql
select name from vault.secrets where name in ('app_base_url', 'cron_secret');
```

   Debería listar las dos filas: `app_base_url` y `cron_secret`.

### Cambiar un secreto

Si el secreto ya existe, `create_secret` con el mismo nombre falla. Para cambiarlo, se actualiza. Cambia `NUEVO-VALOR` por el valor nuevo:

```sql
select vault.update_secret((select id from vault.secrets where name = 'cron_secret'), 'NUEVO-VALOR');
```

Debería mostrar una fila sin errores. Para la dirección de la app, lo mismo con `'app_base_url'`.

## Si Supabase pausa el proyecto

Sirve para reaccionar si el proyecto gratuito de Supabase se pausa por inactividad `[VERIFICAR]` el plazo y las condiciones actuales en https://supabase.com/pricing. Mientras está pausado, la app no puede leer ni guardar datos.

Para evitarlo, el flujo `.github/workflows/keepalive.yml` pide cada día `https://app.solecuida.com/api/health`, y esa ruta consulta la base, así que cuenta como actividad.

Señales de que se pausó: `https://app.solecuida.com/api/health` no responde `"status":"ok"`, o llegan comentarios de que la app no carga, o el panel de Supabase muestra el proyecto como pausado.

1. Entra al panel de Supabase y abre el proyecto de producción. Si dice que está pausado, usa el botón para restaurarlo (Restore project o similar `[VERIFICAR]`). Puede tardar varios minutos.
2. Cuando termine, abre `https://app.solecuida.com/api/health`. Debería volver a mostrar `"status":"ok"`.
3. Revisa que el keep-alive esté funcionando: en GitHub, pestaña Actions, el flujo de keep-alive debería tener ejecuciones verdes de los últimos días. Si está rojo, corrige primero eso. GitHub también puede desactivar los flujos programados de un repositorio sin actividad `[VERIFICAR]`: si aparece desactivado, vuelve a activarlo desde la pestaña Actions.
4. Revisa que los avisos sigan saliendo: en el SQL Editor, pega la consulta del paso 4 de `CRON_SECRET` en `## Rotar claves` y comprueba que haya filas nuevas con `status_code` 200.
5. Si el proyecto no se puede restaurar (por ejemplo, pasó el plazo), restaura desde el último respaldo en un proyecto nuevo de Supabase, siguiendo `## Simulacro de restauración` pero apuntando al proyecto nuevo, y cambia las variables de Vercel y los secretos de GitHub por los del proyecto nuevo. Pide ayuda a Claude para este caso.
