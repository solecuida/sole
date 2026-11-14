-- Pruebas pgTAP del esquema. Se ejecutan con `pnpm -C app db:test` (supabase test db).
begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

select is(
  (select count(*)::int from pg_catalog.pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'todas las tablas de public tienen RLS activo'
);

select ok(
  exists (select 1 from cron.job where jobname = 'sole-dispatch'),
  'el trabajo sole-dispatch está programado'
);

select ok(
  exists (select 1 from cron.job where jobname = 'sole-daily'),
  'el trabajo sole-daily está programado'
);

select is(
  (select count(*)::int from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_admin'
     and grantee = 'authenticated' and privilege_type = 'UPDATE'),
  0,
  'authenticated no puede actualizar profiles.is_admin'
);

select ok(
  not has_function_privilege('authenticated', 'public.purge_user(uuid)', 'execute'),
  'authenticated no puede ejecutar purge_user'
);

select ok(
  not has_function_privilege('anon', 'public.rate_limit_hit(text, integer, integer)', 'execute'),
  'anon no puede ejecutar rate_limit_hit'
);

select * from finish();
rollback;
