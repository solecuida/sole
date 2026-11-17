-- Sole · migración base (escrita a mano; el nombre lo fija el plano, no la CLI).
-- Perfiles, consentimientos, organizaciones, círculos de cuidado, miembros,
-- invitaciones (F16), vínculos de persona cuidada (F12), auditoría de admin,
-- eventos de investigación, límites de frecuencia y bloqueos de trabajos.
-- Regla: RLS en TODAS las tablas de public; escrituras sensibles solo por RPC.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create type public.member_role as enum ('caregiver', 'family', 'cared', 'professional');

create type public.care_type as enum (
  'adulto_mayor',
  'demencias',
  'dialisis',
  'discapacidad_fisica',
  'discapacidad_intelectual',
  'cronica_general',
  'recuperacion_cirugia',
  'ninez_necesidades_especiales',
  'desde_cero'
);

create type public.consent_layer as enum ('terms', 'sensitive', 'research');

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- ---------------------------------------------------------------- organizaciones
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{3,32}$'),
  name text not null check (char_length(name) between 2 and 200),
  kind text not null check (kind in ('fundacion', 'municipio', 'centro_salud', 'agrupacion', 'asociacion_pacientes', 'otro')),
  dashboard_token_hash text unique check (dashboard_token_hash is null or char_length(dashboard_token_hash) = 64),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- perfiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  timezone text not null default 'America/Santiago'
    check (timezone in ('America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter')),
  pseudonym_id uuid not null unique default gen_random_uuid(),
  org_code text references public.organizations (code) on update cascade on delete set null,
  is_admin boolean not null default false,
  followup_minutes smallint not null default 15 check (followup_minutes between 5 and 120),
  journal_reminder_time time,
  onboarding_completed_at timestamptz,
  last_active_at timestamptz not null default now(),
  deactivated_at timestamptz,
  deletion_requested_at timestamptz,
  inactivity_notice_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
for each row execute function private.touch_updated_at();

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_org text;
begin
  v_org := upper(nullif(trim(new.raw_user_meta_data ->> 'org_code'), ''));
  if v_org is not null and not exists (
    select 1 from public.organizations o where o.code = v_org and o.active
  ) then
    v_org := null;
  end if;
  insert into public.profiles (id, org_code) values (new.id, v_org);
  return new;
end
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------- consentimientos (solo se agregan filas)
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  layer public.consent_layer not null,
  version text not null check (version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  granted boolean not null,
  -- clock_timestamp(): dos filas de la misma transacción quedan ordenadas (now() sería igual para ambas)
  created_at timestamptz not null default clock_timestamp()
);

create index consents_user_layer_idx on public.consents (user_id, layer, created_at desc);

-- ---------------------------------------------------------------- círculos de cuidado
create table public.circles (
  id uuid primary key default gen_random_uuid(),
  cared_name text not null check (char_length(cared_name) between 1 and 60),
  relation text not null check (char_length(relation) between 1 and 40),
  care_type public.care_type not null,
  timezone text not null default 'America/Santiago'
    check (timezone in ('America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  closed_at timestamptz,
  closed_reason text check (closed_reason in ('fallecimiento', 'ya_no_cuido', 'otro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index circles_created_by_idx on public.circles (created_by);

create trigger circles_touch before update on public.circles
for each row execute function private.touch_updated_at();

create table public.circle_members (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null,
  display_name text not null check (char_length(display_name) between 1 and 60),
  notify_kinds text[] not null default '{important_date,appointment,emergency}'
    check (notify_kinds <@ array['medication', 'food', 'activity', 'appointment', 'errand', 'important_date', 'custom', 'emergency']::text[]),
  created_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create index circle_members_user_idx on public.circle_members (user_id);

-- ---------------------------------------------------------------- funciones de pertenencia (evitan recursión de RLS)
create function private.member_role_of(p_circle uuid) returns public.member_role
language sql stable security definer set search_path = '' as $$
  select m.role from public.circle_members m
  where m.circle_id = p_circle and m.user_id = (select auth.uid())
$$;

create function private.is_member(p_circle uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.circle_members m
    where m.circle_id = p_circle and m.user_id = (select auth.uid())
  )
$$;

create function private.is_caregiver(p_circle uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.circle_members m
    where m.circle_id = p_circle and m.user_id = (select auth.uid()) and m.role = 'caregiver'
  )
$$;

create function private.is_admin_mfa() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false)
    and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
$$;

create function private.has_required_consents(p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
      select c.granted from public.consents c
      where c.user_id = p_uid and c.layer = 'terms'
      order by c.created_at desc limit 1
    ), false)
    and coalesce((
      select c.granted from public.consents c
      where c.user_id = p_uid and c.layer = 'sensitive'
      order by c.created_at desc limit 1
    ), false)
$$;

revoke all on function private.member_role_of(uuid) from public;
revoke all on function private.is_member(uuid) from public;
revoke all on function private.is_caregiver(uuid) from public;
revoke all on function private.is_admin_mfa() from public;
revoke all on function private.has_required_consents(uuid) from public;
grant execute on function private.member_role_of(uuid) to authenticated, service_role;
grant execute on function private.is_member(uuid) to authenticated, service_role;
grant execute on function private.is_caregiver(uuid) to authenticated, service_role;
grant execute on function private.is_admin_mfa() to authenticated, service_role;
grant execute on function private.has_required_consents(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------- invitaciones de familiares (F16)
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index invitations_circle_idx on public.invitations (circle_id);

-- ---------------------------------------------------------------- vínculos de la persona cuidada (F12)
create table public.cared_links (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  label text check (char_length(label) <= 60),
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index cared_links_circle_idx on public.cared_links (circle_id);

-- ---------------------------------------------------------------- auditoría de accesos administrativos
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) between 1 and 80),
  target text check (char_length(target) <= 200),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- eventos de investigación (seudónimos, sin texto libre)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  pseudonym_id uuid not null,
  name text not null check (name ~ '^[a-z]+(_[a-z]+)*\.[a-z]+(_[a-z]+)*$'),
  props jsonb not null default '{}'::jsonb
    check (jsonb_typeof(props) = 'object' and pg_column_size(props) < 2048),
  org_code text,
  technical boolean not null default false,
  created_at timestamptz not null default now()
);

create index events_name_created_idx on public.events (name, created_at);
create index events_pseudonym_idx on public.events (pseudonym_id, created_at);

-- ---------------------------------------------------------------- límites de frecuencia y bloqueos (solo service_role)
create table private.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

create table private.job_leases (
  name text primary key,
  locked_until timestamptz not null default 'epoch'
);

insert into private.job_leases (name) values ('dispatch'), ('daily');

create function public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid_rate_limit' using errcode = '22023';
  end if;
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into private.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;
  return v_hits <= p_limit;
end
$$;

create function public.cleanup_rate_limits() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  delete from private.rate_limits where window_start < now() - interval '1 day';
  get diagnostics v_count = row_count;
  return v_count;
end
$$;

create function public.acquire_job_lease(p_name text, p_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update private.job_leases
  set locked_until = now() + make_interval(secs => p_seconds)
  where name = p_name and locked_until < now();
  return found;
end
$$;

create function public.release_job_lease(p_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update private.job_leases set locked_until = 'epoch' where name = p_name;
end
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.cleanup_rate_limits() from public, anon, authenticated;
revoke all on function public.acquire_job_lease(text, integer) from public, anon, authenticated;
revoke all on function public.release_job_lease(text) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
grant execute on function public.cleanup_rate_limits() to service_role;
grant execute on function public.acquire_job_lease(text, integer) to service_role;
grant execute on function public.release_job_lease(text) to service_role;

-- ---------------------------------------------------------------- RPC: crear círculo + membresía de cuidadora (atómico)
create function public.create_circle(
  p_cared_name text,
  p_relation text,
  p_care_type public.care_type,
  p_display_name text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not private.has_required_consents(v_uid) then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  insert into public.circles (cared_name, relation, care_type, created_by)
  values (p_cared_name, p_relation, p_care_type, v_uid)
  returning id into v_id;
  insert into public.circle_members (circle_id, user_id, role, display_name, notify_kinds)
  values (v_id, v_uid, 'caregiver', p_display_name,
          '{medication,food,activity,appointment,errand,important_date,custom,emergency}');
  return v_id;
end
$$;

revoke all on function public.create_circle(text, text, public.care_type, text) from public, anon;
grant execute on function public.create_circle(text, text, public.care_type, text) to authenticated;

-- ---------------------------------------------------------------- RPC: aceptar invitación (F16)
create function public.accept_invitation(p_token_hash text, p_display_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.invitations;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not private.has_required_consents(v_uid) then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  select * into v_inv from public.invitations i
  where i.token_hash = p_token_hash
  for update;
  if not found or v_inv.revoked_at is not null or v_inv.accepted_at is not null
     or v_inv.expires_at < now() then
    raise exception 'invitation_invalid' using errcode = 'P0002';
  end if;
  insert into public.circle_members (circle_id, user_id, role, display_name)
  values (v_inv.circle_id, v_uid, 'family', p_display_name)
  on conflict (circle_id, user_id) do nothing;
  update public.invitations
  set accepted_by = v_uid, accepted_at = now()
  where id = v_inv.id;
  return v_inv.circle_id;
end
$$;

revoke all on function public.accept_invitation(text, text) from public, anon;
grant execute on function public.accept_invitation(text, text) to authenticated;

-- ---------------------------------------------------------------- RPC: preferencias de aviso de un miembro (F16)
create function public.set_member_notify_kinds(p_circle uuid, p_user uuid, p_kinds text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not (private.is_caregiver(p_circle) or (p_user = v_uid and private.is_member(p_circle))) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.circle_members
  set notify_kinds = p_kinds
  where circle_id = p_circle and user_id = p_user;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
end
$$;

revoke all on function public.set_member_notify_kinds(uuid, uuid, text[]) from public, anon;
grant execute on function public.set_member_notify_kinds(uuid, uuid, text[]) to authenticated;

-- ---------------------------------------------------------------- RLS y privilegios
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.invitations enable row level security;
alter table public.cared_links enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.events enable row level security;

revoke all on public.organizations, public.profiles, public.consents, public.circles,
  public.circle_members, public.invitations, public.cared_links, public.admin_audit_log,
  public.events from anon, authenticated;

-- organizaciones: solo admin con MFA
grant select, insert, update on public.organizations to authenticated;
create policy organizations_admin_select on public.organizations for select to authenticated
  using ((select private.is_admin_mfa()));
create policy organizations_admin_insert on public.organizations for insert to authenticated
  with check ((select private.is_admin_mfa()));
create policy organizations_admin_update on public.organizations for update to authenticated
  using ((select private.is_admin_mfa())) with check ((select private.is_admin_mfa()));

-- perfiles: cada quien el suyo; admin con MFA puede leer (métricas por cohorte); is_admin nunca se concede
grant select on public.profiles to authenticated;
grant update (display_name, timezone, followup_minutes, journal_reminder_time,
  onboarding_completed_at, last_active_at) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin_mfa()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- consentimientos: se leen y se agregan, nunca se editan ni se borran
grant select, insert on public.consents to authenticated;
create policy consents_select_own on public.consents for select to authenticated
  using (user_id = (select auth.uid()));
create policy consents_insert_own on public.consents for insert to authenticated
  with check (user_id = (select auth.uid()));

-- círculos: los ven sus miembros; solo la cuidadora edita campos de presentación
grant select on public.circles to authenticated;
grant update (cared_name, relation, care_type, timezone) on public.circles to authenticated;
create policy circles_select_member on public.circles for select to authenticated
  using (private.is_member(id));
create policy circles_update_caregiver on public.circles for update to authenticated
  using (private.is_caregiver(id)) with check (private.is_caregiver(id));

-- miembros: lectura para miembros; escrituras solo por RPC
grant select on public.circle_members to authenticated;
create policy circle_members_select on public.circle_members for select to authenticated
  using (private.is_member(circle_id));

-- invitaciones: gestiona la cuidadora
grant select, insert on public.invitations to authenticated;
grant update (revoked_at) on public.invitations to authenticated;
create policy invitations_select on public.invitations for select to authenticated
  using (private.is_caregiver(circle_id));
create policy invitations_insert on public.invitations for insert to authenticated
  with check (private.is_caregiver(circle_id) and created_by = (select auth.uid()));
create policy invitations_update on public.invitations for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));

-- vínculos de persona cuidada: gestiona la cuidadora; la resolución del token es del servidor
grant select, insert on public.cared_links to authenticated;
grant update (revoked_at) on public.cared_links to authenticated;
create policy cared_links_select on public.cared_links for select to authenticated
  using (private.is_caregiver(circle_id));
create policy cared_links_insert on public.cared_links for insert to authenticated
  with check (private.is_caregiver(circle_id) and created_by = (select auth.uid()));
create policy cared_links_update on public.cared_links for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));

-- auditoría: escribe y lee solo admin con MFA
grant select, insert on public.admin_audit_log to authenticated;
create policy admin_audit_select on public.admin_audit_log for select to authenticated
  using ((select private.is_admin_mfa()));
create policy admin_audit_insert on public.admin_audit_log for insert to authenticated
  with check ((select private.is_admin_mfa()) and admin_id = (select auth.uid()));

-- eventos: la usuaria inserta con su seudónimo; solo admin con MFA lee
grant insert on public.events to authenticated;
grant select on public.events to authenticated;
create policy events_insert_own on public.events for insert to authenticated
  with check (pseudonym_id = (select p.pseudonym_id from public.profiles p where p.id = (select auth.uid())));
create policy events_admin_select on public.events for select to authenticated
  using ((select private.is_admin_mfa()));
