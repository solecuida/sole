-- Datos SOLO para desarrollo local (supabase db reset). Nunca se cargan en producción:
-- la CLI aplica seed.sql únicamente en la base local.
insert into public.organizations (code, name, kind)
values ('DEMO-LOCAL', 'Organización de prueba local', 'otro')
on conflict (code) do nothing;

insert into public.resources (name, description, url, source_url, verified_at, region)
values (
  'Recurso de prueba (solo local)',
  'Fila de ejemplo para probar el directorio en desarrollo. No existe en producción.',
  'https://example.org/',
  'https://example.org/',
  current_date,
  'nacional'
);
