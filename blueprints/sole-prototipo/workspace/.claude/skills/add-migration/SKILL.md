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
