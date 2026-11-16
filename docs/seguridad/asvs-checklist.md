# OWASP ASVS 5.0, nivel 2: lista de requisitos

Objetivo del brief (sección 6.1): cumplimiento verificable del nivel 2, no certificación formal.

**Aviso sobre la numeración.** Los requisitos están agrupados por capítulo y descritos con palabras propias. La numeración exacta de ASVS 5.0 (por ejemplo `V6.2.1`) no se confirmó contra el texto oficial: `[VERIFICAR numeración de ASVS 5.0]` en https://owasp.org/www-project-application-security-verification-standard/. Hasta entonces, cada fila se identifica por capítulo y descripción. La columna `Nivel` indica el nivel mínimo en que el requisito aplica según el criterio del proyecto, también `[VERIFICAR]`.

**Estados.** `Cumple` exige una ruta del repositorio como evidencia. `Pendiente` incluye lo que se comprueba solo en producción y lo que todavía no se construye. `No aplica` se justifica en la evidencia.

La lista de 30 puntos del brief, con su evidencia, está en `docs/seguridad/checklist-6.2.md`; esta tabla la cruza con los capítulos de ASVS.

| Requisito ASVS 5.0 | Nivel | Estado | Evidencia |
|---|---|---|---|
| Autenticación: contraseñas con largo mínimo y requisitos de composición | L1 | Cumple | `app/supabase/config.toml` (`minimum_password_length = 10`, `password_requirements`) |
| Autenticación: comprobar contraseñas filtradas | L2 | Pendiente | Lista de lanzamiento: activar la protección de Supabase Auth si el plan la ofrece `[VERIFICAR]` |
| Autenticación: la app nunca guarda ni registra contraseñas | L1 | Cumple | `app/src/server/auth/login.ts` (la contraseña solo se pasa a Supabase Auth, con límite de largo) |
| Autenticación: respuesta que no revela si un correo tiene cuenta | L1 | Cumple | `app/src/server/auth/login.ts` (el enlace mágico responde igual pase lo que pase; el error de contraseña es idéntico para clave mala y correo desconocido), `app/tests/e2e/auth.spec.ts` |
| Autenticación: defensa contra intentos repetidos y automatizados | L1 | Pendiente | Límites por correo y por IP en `app/src/server/security/rate-limit.ts` y `app/tests/db/rate-limit.test.ts`. Pendiente: activar Turnstile en Supabase Auth en producción y conectar los límites de invitación y emergencia. |
| Autenticación: segundo factor para cuentas privilegiadas | L2 | Cumple | `app/src/server/admin/guard.ts`, `app/tests/db/admin-access.test.ts` (TOTP; sin `aal2` la base rechaza) |
| Autenticación: ruta de recuperación sin enlaces reutilizables | L2 | Pendiente | El ingreso es por enlace mágico de Supabase Auth; su vencimiento y uso único en producción se comprueban en el lanzamiento `[VERIFICAR]` |
| Sesión: cookies `HttpOnly`, `SameSite=Lax` y `Secure` | L1 | Cumple | `app/src/proxy.ts`, `app/src/lib/supabase/server.ts`, `app/tests/e2e/auth.spec.ts` (`Secure` según `APP_URL` con `https`) |
| Sesión: vencimiento y rotación del token de refresco | L1 | Cumple | `app/supabase/config.toml` (`jwt_expiry = 3600`, `enable_refresh_token_rotation = true`) |
| Sesión: se cierra en todos los dispositivos al borrar la cuenta | L2 | Cumple | `app/src/server/account/lifecycle.ts` (`signOut` global), `app/tests/db/account-lifecycle.test.ts` |
| Sesión: el destino después de entrar no permite redirigir a otro sitio | L1 | Cumple | `app/src/lib/auth/route-rules.ts` (`safeNextPath`), `app/tests/unit/proxy-rules.test.ts` |
| Control de acceso: autorización en el servidor en cada ruta y acción | L1 | Cumple | `app/src/proxy.ts`, `app/src/app/api/cuenta/exportar/route.ts`, `app/src/server/security/cron-auth.ts`; regla de `CLAUDE.md` de autorizar dentro de cada acción y ruta |
| Control de acceso: aislamiento por fila entre círculos y roles | L1 | Cumple | `app/tests/db/rls-circles.test.ts`, `app/tests/db/rls-private.test.ts`, `app/supabase/tests/database.test.sql` |
| Control de acceso: sin cambio de campos protegidos (rol, dueño, admin) | L1 | Cumple | `app/supabase/migrations/20261114000100_base.sql` (privilegios por columna), `app/tests/db/rls-circles.test.ts` |
| Control de acceso: rol de administrador no concedible desde la app | L2 | Cumple | `app/supabase/tests/database.test.sql`, `app/tests/db/admin-access.test.ts` |
| Control de acceso: el panel de administración no lee datos de cuidado | L2 | Cumple | `app/tests/db/admin-access.test.ts` (un admin con `aal2` no ve círculos, bitácoras ni bienestar ajenos) |
| Control de acceso: tokens de enlace largos, revocables y con vencimiento | L2 | Pendiente | Lista de lanzamiento: el enlace de la persona cuidada es de una fase posterior; solo existe la tabla `cared_links` en `app/supabase/migrations/20261114000100_base.sql` |
| Validación: toda entrada validada con esquema en el servidor | L1 | Cumple | `app/src/server/auth/login.ts`, `app/src/server/reminders/rule-schema.ts`, `app/src/app/api/cuenta/exportar/route.ts` (zod) |
| Validación: restricciones en la base (largo, valores permitidos) | L1 | Cumple | `app/supabase/migrations/20261114000200_cuidado.sql` (restricciones `check`) |
| Validación: consultas parametrizadas, sin SQL armado con texto | L1 | Cumple | `app/supabase/migrations/20261114000200_cuidado.sql` (RPC sin SQL dinámico) |
| Validación: salida escapada, sin HTML de usuarias | L1 | Cumple | `app/tests/unit/production-hygiene.test.tsx` (sin `dangerouslySetInnerHTML`) |
| Validación: celdas de exportación que una planilla leería como fórmula | L2 | Cumple | `app/src/server/account/export.ts`, `app/tests/db/account-export.test.ts` ("neutraliza celdas"), `app/src/app/api/admin/export/route.ts` |
| Validación: destinos de peticiones salientes acotados | L2 | Cumple | El destino de un aviso solo puede ser un servicio de avisos de un navegador (Chrome y Android, Firefox, Edge, Safari); cualquier otra dirección se rechaza. `app/src/server/push/subscriptions.ts` (`isPushServiceUrl`), `app/tests/db/push-subscriptions.test.ts` |
| Criptografía almacenada: campos sensibles cifrados con AES-256-GCM | L2 | Cumple | `app/src/lib/crypto/field.ts`, `app/tests/unit/field-crypto.test.ts` |
| Criptografía almacenada: rotación de claves | L2 | Cumple | `app/tests/unit/field-crypto.test.ts` (clave v2 con la anterior en `PREVIOUS`: descifra v1 y cifra como v2) |
| Criptografía almacenada: claves solo en el servidor, nunca en el navegador | L1 | Cumple | `app/scripts/check-bundle-secrets.ts`, `app/tests/unit/production-hygiene.test.tsx` |
| Criptografía almacenada: comparación de secretos en tiempo constante | L2 | Cumple | `app/src/server/security/cron-auth.ts` (`timingSafeEqual` sobre hash) |
| Criptografía almacenada: identificadores de límites sin datos en claro | L2 | Cumple | `app/src/server/security/rate-limit.ts` (`hashKey`, HMAC con `IP_HASH_SECRET`), `app/tests/db/rate-limit.test.ts` |
| Manejo de errores: sin detalles internos para la usuaria | L1 | Cumple | `app/src/app/error.tsx`, `app/src/server/http.ts` |
| Manejo de errores: datos personales filtrados antes de Sentry | L2 | Cumple | `app/src/lib/observability/scrub.ts`, `app/tests/unit/scrub.test.ts` |
| Manejo de errores: sin `console.log` con datos en producción | L1 | Cumple | `app/tests/unit/production-hygiene.test.tsx` |
| Registro: auditoría de accesos administrativos | L2 | Cumple | `app/src/server/admin/guard.ts`, `app/tests/db/admin-access.test.ts` |
| Registro: monitoreo de la base y alertas | L2 | Pendiente | Lista de lanzamiento: Security y Performance Advisors de Supabase y revisión de logs |
| Protección de datos: minimización y seudónimos en la investigación | L2 | Cumple | `app/src/server/events/track.ts`, `app/src/server/events/catalog.ts`, `app/tests/db/events.test.ts` |
| Protección de datos: consentimiento de investigación revocable | L2 | Cumple | `app/src/server/consents/consents.ts`, `app/tests/db/consents.test.ts` |
| Protección de datos: acceso y portabilidad de los propios datos | L2 | Cumple | `app/src/server/account/export.ts`, `app/tests/db/account-export.test.ts` |
| Protección de datos: borrado a pedido | L2 | Pendiente | La solicitud y los 7 días de gracia están en `app/src/server/account/lifecycle.ts` y `app/tests/db/account-lifecycle.test.ts`, y la función `purge_user` en la migración. Pendiente: el trabajo diario que la ejecuta (`/api/cron/daily`) todavía no existe; llega en el paso 49 del plano. |
| Protección de datos: sin datos sensibles en avisos push | L2 | Cumple | `app/tests/db/dispatch.test.ts` (el aviso de un medicamento no lleva su nombre ni su indicación), `app/src/server/push/send.ts` |
| Comunicaciones: HTTPS, HSTS y cabeceras de seguridad | L1 | Cumple | `app/src/lib/security/headers.ts`, `app/tests/e2e/security-headers.spec.ts` |
| Comunicaciones: CSP sin `unsafe-inline` ni `unsafe-eval` en scripts | L2 | Cumple | `app/src/lib/security/headers.ts`, `app/tests/unit/security-headers.test.ts` (`unsafe-eval` solo en desarrollo) |
| Comunicaciones: sin CORS abierto | L1 | Cumple | `app/tests/e2e/security-headers.spec.ts` |
| Configuración: sin secretos en el repositorio | L1 | Cumple | `.gitleaks.toml`, `.github/workflows/ci.yml`, `.gitignore` |
| Configuración: dependencias escaneadas y fijadas | L1 | Cumple | `.github/workflows/ci.yml` (jobs `audit` y `semgrep`), `.github/dependabot.yml`, `app/pnpm-lock.yaml` |
| Configuración: producción sin rutas de depuración | L1 | Cumple | `app/tests/unit/production-hygiene.test.tsx` |
| Configuración: sin subida de archivos | L1 | Cumple | `app/supabase/config.toml` (`[storage] enabled = false`) |
| Configuración: pruebas dinámicas contra lo desplegado (ZAP) | L2 | Pendiente | Lista de lanzamiento: ZAP baseline; su flujo llega en la épica 07 |
| Configuración: respaldos cifrados y restauración probada | L2 | Pendiente | Lista de lanzamiento: respaldo nocturno cifrado y simulacro; su flujo llega en la épica 07 |
| Lógica de negocio: límites de frecuencia en operaciones sensibles | L2 | Pendiente | `app/src/server/security/rate-limit.ts`; faltan conectar `invitation`, `emergency` y `cared_done` |
| Archivos y recursos: carga de archivos | L1 | No aplica | No hay subida de archivos en esta versión (`app/supabase/config.toml`, `[storage] enabled = false`) |
| API y servicios web: rutas de cron autenticadas con secreto | L2 | Cumple | `app/src/server/security/cron-auth.ts`, `app/src/app/api/cron/dispatch/route.ts` |
