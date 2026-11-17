# OWASP Top 10: control o prueba por cada riesgo

Una sección por riesgo, con el control que lo cubre y la prueba que lo demuestra. Los nombres siguen la lista de 2021; **edición vigente `[VERIFICAR edición]`** en https://owasp.org/www-project-top-ten/ (si la edición vigente cambió nombres o el orden, se renumera y se revisa cada sección).

Cada sección dice qué está comprobado y qué queda pendiente. Lo que solo se comprueba con el sistema desplegado va como "Lista de lanzamiento".

## A01 Control de acceso roto

- **Control.** RLS en todas las tablas de `public`; privilegios por columna; rol de administrador solo por SQL manual y con segundo factor; autorización dentro de cada acción y ruta, además del proxy.
- **Prueba.** `app/supabase/tests/database.test.sql` (cero tablas sin RLS; `is_admin` no se puede actualizar), `app/tests/db/rls-circles.test.ts` (una cuidadora ajena y un familiar no ven ni tocan lo de otro círculo), `app/tests/db/rls-private.test.ts`, `app/tests/db/admin-access.test.ts` (el panel no lee datos de cuidado), `app/tests/e2e/auth.spec.ts`.
- **Enlace de la persona cuidada (2026-11-16).** Acceso sin cuenta, acotado al círculo del enlace y a lo marcado como visible: `app/src/server/cared-link/links.ts`, `app/tests/db/cared-link.test.ts`, `app/tests/e2e/cared-view.spec.ts`.

## A02 Fallas criptográficas

- **Control.** Cifrado de campos sensibles con AES-256-GCM y la clave solo en el servidor; HSTS; secretos comparados en tiempo constante; contraseñas en Supabase Auth.
- **Prueba.** `app/tests/unit/field-crypto.test.ts` (ida y vuelta, alteración detectada, otro contexto rechazado, rotación de clave), `app/src/lib/crypto/field.ts`, `app/src/server/security/cron-auth.ts`, `app/src/lib/security/headers.ts`, `app/scripts/check-bundle-secrets.ts`.
- **Pendiente.** Las notas de contactos tienen su columna cifrada en `app/supabase/migrations/20261114000200_cuidado.sql`, pero la pantalla de contactos todavía no las escribe: hay que comprobar el cifrado cuando se construya. Que Supabase cifre las contraseñas con bcrypt es dato del proveedor `[VERIFICAR]`.

## A03 Inyección

- **Control.** Validación con zod en el borde; restricciones `check` en la base; RPC con parámetros y sin SQL dinámico; sin `dangerouslySetInnerHTML` ni `eval(`; celdas de exportación neutralizadas contra fórmulas de planilla.
- **Prueba.** `app/tests/unit/production-hygiene.test.tsx`, `app/src/server/reminders/rule-schema.ts`, `app/supabase/migrations/20261114000200_cuidado.sql`, `app/tests/db/account-export.test.ts`, `app/tests/db/events.test.ts` (rechaza texto libre y claves extra).
- **Pendiente.** Lista de lanzamiento: ZAP baseline contra producción.

## A04 Diseño inseguro

- **Control.** Modelo de amenazas, evaluación de impacto y minimización: la investigación usa seudónimo y exige consentimiento; el panel no puede leer datos de cuidado; el navegador nunca habla con Supabase.
- **Prueba.** `docs/seguridad/modelo-amenazas.md`, `docs/legal/eipd.md`, `app/tests/db/events.test.ts`, `app/tests/db/admin-access.test.ts`, `app/tests/db/consents.test.ts`.
- **Revisado el 2026-11-16** al construir el enlace de la persona cuidada y el botón de emergencia: `docs/seguridad/modelo-amenazas.md`.

## A05 Configuración de seguridad incorrecta

- **Control.** CSP con nonce y cabeceras de seguridad; sin CORS abierto; almacenamiento y funciones de borde apagados; `max_rows` acotado; producción sin rutas de depuración y sin mapas de código públicos.
- **Prueba.** `app/src/lib/security/headers.ts`, `app/tests/unit/security-headers.test.ts`, `app/tests/e2e/security-headers.spec.ts`, `app/supabase/config.toml`, `app/tests/unit/production-hygiene.test.tsx`, `app/next.config.ts`.
- **Pendiente.** Lista de lanzamiento: confirmar que la configuración del panel de Supabase de producción (captcha, contraseñas filtradas, `max_rows`) coincide con `app/supabase/config.toml`; Advisors de Supabase sin hallazgos críticos.

## A06 Componentes vulnerables y desactualizados

- **Control.** Escaneo de dependencias en CI, Dependabot semanal, lockfile versionado, versiones fijas.
- **Prueba.** `.github/workflows/ci.yml` (job `audit`), `.github/dependabot.yml`, `app/pnpm-lock.yaml`.
- **Pendiente.** El escaneo falla solo con severidad alta o crítica (`--audit-level high`); una vulnerabilidad media queda a la vista de Dependabot, no bloquea la integración.

## A07 Fallas de identificación y autenticación

- **Control.** Ingreso por enlace mágico o contraseña con Supabase Auth; límites por correo y por IP; respuestas que no revelan si hay cuenta; cookies `HttpOnly` y `SameSite=Lax`; rotación del token de refresco; segundo factor TOTP para el panel; Turnstile.
- **Prueba.** `app/src/server/auth/login.ts`, `app/tests/db/rate-limit.test.ts`, `app/tests/e2e/auth.spec.ts`, `app/supabase/config.toml`, `app/tests/db/admin-access.test.ts`, `app/src/proxy.ts`.
- **Pendiente.** Lista de lanzamiento: activar Turnstile en Supabase Auth y la protección de contraseñas filtradas. La IP del límite sale de `x-forwarded-for` (`app/src/app/(auth)/entrar/actions.ts`): se confía en que Vercel la fije `[VERIFICAR]`; el límite por correo no depende de ella.

## A08 Fallas de integridad de software y datos

- **Control.** Lockfile con instalación congelada en CI; las acciones de GitHub con versión explícita; cifrado autenticado (GCM) que detecta datos alterados; rutas de cron con secreto.
- **Prueba.** `.github/workflows/ci.yml` (`pnpm install --frozen-lockfile`), `app/tests/unit/field-crypto.test.ts`, `app/src/server/security/cron-auth.ts`.
- **Pendiente.** Las acciones de GitHub están fijadas por versión de etiqueta, no por hash de commit. Los subrecursos del sitio no llevan integridad (`integrity`), porque la app no carga scripts de terceros salvo Turnstile.

## A09 Fallas de registro y monitoreo

- **Control.** Auditoría de accesos administrativos; errores a Sentry con datos personales filtrados; evento técnico `app.error`; límites del plan vigilados en el panel.
- **Prueba.** `app/src/server/admin/guard.ts`, `app/tests/db/admin-access.test.ts`, `app/src/lib/observability/scrub.ts`, `app/tests/unit/scrub.test.ts`, `app/tests/db/events.test.ts`.
- **Pendiente.** Lista de lanzamiento: alertas de Sentry hacia el fundador y revisión periódica de logs de Supabase y Vercel.

## A10 Falsificación de peticiones del lado del servidor (SSRF)

- **Control.** El servidor solo hace peticiones salientes a Supabase, a los servicios de avisos de los navegadores (Web Push) y, desde la base, a la propia app con el secreto de cron guardado en Vault.
- **Prueba.** `app/src/server/push/subscriptions.ts` (el destino de aviso debe ser `https`), `app/supabase/migrations/20261114000400_cron.sql` (la dirección de la app sale de Vault, no de una entrada de usuaria).
- **Corregido el 2026-11-16.** El destino de un aviso lo entrega el navegador; desde esta fecha solo se aceptan los servicios de avisos conocidos (Chrome y Android, Firefox, Edge y Safari) y cualquier otra dirección se rechaza: `app/src/server/push/subscriptions.ts` (`isPushServiceUrl`), `app/tests/db/push-subscriptions.test.ts`. La lista de servicios se revisa si un navegador cambia el suyo `[VERIFICAR lista de servicios]`.
