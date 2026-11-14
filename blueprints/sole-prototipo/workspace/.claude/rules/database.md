---
description: Convenciones de esquema, RLS y migraciones de Supabase
paths:
  - "app/supabase/**"
  - "app/src/lib/supabase/**"
---

# Base de datos

- El esquema vive solo en `app/supabase/migrations/*.sql`, escrito a mano con nombre `<AAAAMMDDHHMMSS>_<descripcion>.sql`. Una migración aplicada no se edita: se agrega otra.
- Toda tabla de `public` tiene RLS, `revoke all … from anon, authenticated` y `grant` mínimo explícito. `pnpm -C app db:test` lo comprueba.
- Pertenencia y roles solo con `private.is_member(circle_id)`, `private.is_caregiver(circle_id)`, `private.member_role_of(circle_id)` y `private.is_admin_mfa()`. No consultes `circle_members` dentro de una política (recursión).
- Columnas protegidas (`circle_id`, `created_by`, `role`, `is_admin`, `deletion_requested_at`, `deactivated_at`) nunca entran en un `grant update (…)` a `authenticated`.
- Escrituras de estado (marcar ocurrencias, crear círculos, aceptar invitaciones, cerrar círculos, tomar tareas) van por RPC `security definer` con `set search_path = ''`.
- `is_admin` se cambia solo con SQL manual del fundador; ninguna RPC lo toca.
- Campos `*_enc` guardan texto cifrado `v<n>.…` (la base lo valida con `check`); nunca texto plano.
- Inserciones donde la usuaria no puede leer la tabla (`feedback`, `events`): sin `.select()` después del `insert`.
- `database.types.ts` se regenera con `pnpm -C app db:types`; no se edita.
- `seed.sql` es solo local: nada de producción depende de él. El contenido real va en migraciones.
