# Plan de respuesta a incidentes

Qué hacer cuando algo sale mal con los datos o la seguridad de Sole: una filtración, una cuenta vulnerada, un secreto expuesto, un servicio caído con datos en riesgo. Está escrito para que el fundador lo siga solo, de a un paso, incluso con prisa.

**Responsable:** el fundador, `hola@solecuida.com`. Es la única persona que decide, ejecuta y comunica. Ese mismo correo es el canal para que cualquier persona reporte un problema.

**Qué es un incidente.** Cualquier hecho que pueda haber expuesto, alterado o hecho perder datos de personas, o que haya dado a alguien un acceso que no le correspondía. Una duda cuenta: se investiga como incidente hasta descartarla.

**Reglas que valen todo el tiempo.**

- Se protege primero a las personas, después al servicio.
- Nada de lo que se anote en el registro del incidente lleva datos de las usuarias (ni nombres, ni correos, ni notas): se usan identificadores internos.
- Ningún correo a personas afectadas, organizaciones o autoridades lo envía un agente automático: los textos se preparan y los envía el fundador.
- Sole no da consejo médico: en ningún mensaje a personas afectadas se aconseja sobre salud o medicación.

**Plazos legales.** Los plazos y la forma de avisar a la autoridad y a las personas afectadas dependen de la Ley 21.719, y sus fechas de entrada en vigencia y reglamentos `[VERIFICAR]` en https://www.bcn.cl/leychile. Hasta confirmarlos, se trabaja con el supuesto más exigente: avisar lo antes posible, sin esperar a tener todo el detalle.

## Detección

Cómo se entera el fundador de que hay un problema:

- Un reporte al correo `hola@solecuida.com` de una usuaria, un familiar o una organización.
- Alertas de Sentry y de los proveedores (Supabase, Vercel, Cloudflare). Lista de lanzamiento: dejar activas las alertas y que lleguen al correo del fundador.
- Una alerta de gitleaks en CI o en el commit (`.github/workflows/ci.yml`, `.githooks/pre-commit`) por un secreto expuesto.
- Un aviso de Dependabot o del escaneo de dependencias por una vulnerabilidad grave (`.github/dependabot.yml`).
- Filas inesperadas en el registro de auditoría de administración (`admin_audit_log`, escrito por `app/src/server/admin/guard.ts`).
- Un salto raro de errores o de uso en el panel de límites (`/admin/limites`).

Al detectar: anotar la hora, quién o qué lo avisó y qué se sospecha. Abrir un registro del incidente (fecha, resumen, estado). No borrar nada todavía: primero se conserva la evidencia.

## Contención

Objetivo: parar el daño, sin destruir evidencia. En este orden:

1. **Un secreto expuesto** (clave de servicio de Supabase, `FIELD_ENCRYPTION_KEY`, `CRON_SECRET`, `VAPID_PRIVATE_KEY`, `IP_HASH_SECRET`, claves de Resend, Sentry o Turnstile): rotarlo de inmediato en el proveedor y en Vercel, y volver a desplegar. Para la clave de cifrado de campos se usa la rotación con `FIELD_ENCRYPTION_KEY_PREVIOUS` que soporta `app/src/lib/crypto/field.ts` (probada en `app/tests/unit/field-crypto.test.ts`). Quitar el secreto del historial de Git no basta: se da por conocido y se rota.
2. **Una cuenta vulnerada:** cerrar sus sesiones y pedirle que cambie el acceso. Si es la cuenta del fundador, retirar el rol de administrador con SQL y rehacer el segundo factor.
3. **Un acceso indebido a datos por una falla de RLS o de código:** cerrar la ruta o la función afectada, o desplegar la versión anterior desde Vercel. Las pruebas de aislamiento (`app/tests/db/rls-circles.test.ts`) se corren de nuevo antes de reabrir.
4. **Abuso o ataque contra una ruta:** bajar los límites de frecuencia (`app/src/server/security/rate-limit.ts`) o activar el modo de desafío del proveedor de despliegue `[VERIFICAR]`.
5. **Rutas de cron comprometidas:** rotar `CRON_SECRET` en Vercel y en el Vault de Supabase (hay que cambiar los dos, o los avisos dejan de salir).
6. **Servicio caído:** revisar `/api/health` y el panel del proveedor; no se restaura desde un respaldo hasta saber si el problema es de datos.

## Notificación

1. **Decidir qué pasó.** Qué datos estuvieron expuestos o alterados (por ejemplo: bitácora y medicamentos cifrados, correos, eventos seudónimos), de cuántas personas y durante cuánto tiempo. Los campos sensibles están cifrados con una clave que vive fuera de la base: si se filtró solo la base, y no la clave, esos campos no son legibles. Esto se comprueba, no se asume.
2. **Avisar a las personas afectadas.** Mensaje claro, en español de Chile, sin jerga: qué pasó, qué datos, qué se hizo, qué puede hacer la persona y cómo escribir a `hola@solecuida.com`. Sin culpar, sin alarmar, sin consejo médico. El texto lo prepara el fundador y se envía desde el correo `hola@solecuida.com`.
3. **Avisar a la autoridad** de protección de datos personales cuando la Ley 21.719 lo exija: quién, dentro de qué plazo y por qué canal son `[VERIFICAR]`. Se anota la hora en que se tomó conocimiento, porque desde ahí suelen correr los plazos.
4. **Avisar a las organizaciones asociadas** solo si el incidente afecta a sus participantes, y con datos agregados o seudónimos, nunca con datos de personas.
5. **Avisar a los proveedores** cuyo servicio esté involucrado (Supabase, Vercel, Sentry, Resend, Cloudflare) si corresponde por su política `[VERIFICAR]`.
6. Guardar copia de cada aviso y de la hora en que salió.

## Recuperación

- Confirmar que la causa quedó corregida con una prueba que antes fallaba (si no existía, se escribe una).
- Volver a correr la compuerta completa (`pnpm -C app typecheck && pnpm -C app lint && pnpm -C app test`) y, si hubo una falla de datos, las pruebas de `app/tests/db/`.
- Restaurar datos solo si se perdieron o alteraron, desde el respaldo cifrado. Lista de lanzamiento: el respaldo nocturno y su simulacro de restauración todavía no existen (punto 28 de `docs/seguridad/checklist-6.2.md`); hasta entonces no hay respaldo propio y la recuperación depende de lo que ofrezca el plan de Supabase `[VERIFICAR]`.
- Los borrados pedidos por las usuarias antes del incidente siguen su curso: no se reponen datos de quien ya pidió borrarse (`app/src/server/account/lifecycle.ts`).
- Reabrir lo que se cerró en la contención, de a una pieza, mirando los errores.
- Rotar, por prudencia, todo secreto que haya pasado por el lugar comprometido.

## Lecciones

Dentro de la semana siguiente al cierre, el fundador escribe en el registro del incidente:

- Línea de tiempo: cuándo empezó, cuándo se detectó, cuándo se contuvo y cuándo se cerró.
- Causa raíz, dicha sin buscar culpables.
- Qué funcionó y qué no del plan.
- Qué cambio concreto evita que se repita: una prueba, un control, una alerta. Se agrega a `PENDIENTES.md` y, si es una decisión a criterio, a `DECISIONES.md`.
- Si cambió el riesgo: actualizar `docs/seguridad/modelo-amenazas.md` y `docs/legal/eipd.md`.
- Un simulacro de este plan al menos una vez antes del lanzamiento y luego una vez al año: pendiente (Lista de lanzamiento).
