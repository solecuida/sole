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
