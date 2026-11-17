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
