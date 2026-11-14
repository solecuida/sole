-- Sole · migración de contenido editable y escucha (escrita a mano).
-- Consejos y actividades (F2), directorio de recursos (F8), plantillas por tipo de cuidado (F1),
-- comentarios (F10), microencuestas (F10), interés en puertas falsas (F11), tamaño de la base (F15).
-- El contenido inicial NO va aquí: lo agrega la migración del paso `contenido-inicial`.

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('consejo', 'actividad')),
  text text not null check (char_length(text) between 5 and 200),
  activity_title text check (char_length(activity_title) <= 80),
  care_types public.care_type[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind <> 'actividad' or activity_title is not null)
);

create trigger tips_touch before update on public.tips
for each row execute function private.touch_updated_at();

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  description text not null check (char_length(description) between 5 and 400),
  phone text check (phone is null or char_length(phone) <= 30),
  url text check (url is null or url ~ '^https://'),
  source_url text not null check (source_url ~ '^https://'),
  verified_at date,
  region text not null default 'nacional' check (char_length(region) <= 60),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger resources_touch before update on public.resources
for each row execute function private.touch_updated_at();

create table public.care_templates (
  care_type public.care_type primary key,
  name text not null check (char_length(name) between 2 and 80),
  description text not null check (char_length(description) between 5 and 300),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  updated_at timestamptz not null default now()
);

create trigger care_templates_touch before update on public.care_templates
for each row execute function private.touch_updated_at();

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('comentario', 'problema')),
  message text not null check (char_length(message) between 1 and 2000),
  screen text check (char_length(screen) <= 80),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index feedback_created_idx on public.feedback (created_at desc);

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  survey_key text not null check (survey_key in ('d3', 'd14', 'd28', 'd56')),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, survey_key)
);

create table public.fake_door_interest (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  door_key text not null
    check (door_key in ('ia', 'recetas', 'plan_familiar', 'comunidad', 'fotos', 'invitar_familiar')),
  choice text check (char_length(choice) <= 40),
  notify_me boolean not null default false,
  created_at timestamptz not null default now()
);

create function public.admin_db_size_bytes() returns bigint
language sql stable security definer set search_path = '' as $$
  select pg_catalog.pg_database_size(pg_catalog.current_database())
$$;

revoke all on function public.admin_db_size_bytes() from public, anon, authenticated;
grant execute on function public.admin_db_size_bytes() to service_role;

-- ---------------------------------------------------------------- RLS y privilegios
alter table public.tips enable row level security;
alter table public.resources enable row level security;
alter table public.care_templates enable row level security;
alter table public.feedback enable row level security;
alter table public.survey_responses enable row level security;
alter table public.fake_door_interest enable row level security;

revoke all on public.tips, public.resources, public.care_templates, public.feedback,
  public.survey_responses, public.fake_door_interest from anon, authenticated;

-- contenido: lectura para usuarias con sesión; escritura solo admin con MFA
grant select, insert, update, delete on public.tips, public.resources, public.care_templates to authenticated;

create policy tips_select on public.tips for select to authenticated
  using (active or (select private.is_admin_mfa()));
create policy tips_admin_insert on public.tips for insert to authenticated
  with check ((select private.is_admin_mfa()));
create policy tips_admin_update on public.tips for update to authenticated
  using ((select private.is_admin_mfa())) with check ((select private.is_admin_mfa()));
create policy tips_admin_delete on public.tips for delete to authenticated
  using ((select private.is_admin_mfa()));

create policy resources_select on public.resources for select to authenticated
  using ((active and verified_at is not null) or (select private.is_admin_mfa()));
create policy resources_admin_insert on public.resources for insert to authenticated
  with check ((select private.is_admin_mfa()));
create policy resources_admin_update on public.resources for update to authenticated
  using ((select private.is_admin_mfa())) with check ((select private.is_admin_mfa()));
create policy resources_admin_delete on public.resources for delete to authenticated
  using ((select private.is_admin_mfa()));

create policy care_templates_select on public.care_templates for select to authenticated
  using (true);
create policy care_templates_admin_insert on public.care_templates for insert to authenticated
  with check ((select private.is_admin_mfa()));
create policy care_templates_admin_update on public.care_templates for update to authenticated
  using ((select private.is_admin_mfa())) with check ((select private.is_admin_mfa()));
create policy care_templates_admin_delete on public.care_templates for delete to authenticated
  using ((select private.is_admin_mfa()));

-- comentarios: cada quien inserta los suyos; admin con MFA lee y marca leído
grant select, insert on public.feedback to authenticated;
grant update (read_at) on public.feedback to authenticated;
create policy feedback_insert_own on public.feedback for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy feedback_admin_select on public.feedback for select to authenticated
  using ((select private.is_admin_mfa()));
create policy feedback_admin_update on public.feedback for update to authenticated
  using ((select private.is_admin_mfa())) with check ((select private.is_admin_mfa()));

-- microencuestas y puertas falsas: propias + lectura de admin con MFA
grant select, insert on public.survey_responses, public.fake_door_interest to authenticated;
create policy survey_insert_own on public.survey_responses for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy survey_select on public.survey_responses for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin_mfa()));
create policy fake_door_insert_own on public.fake_door_interest for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy fake_door_select on public.fake_door_interest for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin_mfa()));
