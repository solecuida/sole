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
