-- Sole · migración del día a día (escrita a mano).
-- Recordatorios (F3), ocurrencias materializadas, marcas idempotentes, suscripciones push,
-- tareas (F5), bitácora (F6), bienestar de la cuidadora (F8), contactos (F9), emergencias (F12).

create type public.reminder_kind as enum (
  'medication', 'food', 'activity', 'appointment', 'errand', 'important_date', 'custom'
);
create type public.importance as enum ('important', 'normal', 'whenever');
create type public.occurrence_status as enum ('pending', 'done', 'not_done', 'snoozed', 'skipped');
create type public.occurrence_kind as enum ('main', 'advance');

-- ---------------------------------------------------------------- recordatorios
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  kind public.reminder_kind not null,
  importance public.importance not null default 'normal',
  title text not null check (char_length(title) between 1 and 120),
  med_name_enc text check (med_name_enc is null or med_name_enc ~ '^v[0-9]+\.'),
  med_instructions_enc text check (med_instructions_enc is null or med_instructions_enc ~ '^v[0-9]+\.'),
  rule jsonb not null check (jsonb_typeof(rule) = 'object' and rule ? 'freq' and rule ? 'startDate'),
  advance_days smallint[] not null default '{}'
    check (coalesce(array_length(advance_days, 1), 0) <= 5),
  visible_to_cared boolean not null default false,
  active boolean not null default true,
  source text not null default 'manual' check (source in ('manual', 'template', 'tip')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reminders_circle_active_idx on public.reminders (circle_id) where active;

create trigger reminders_touch before update on public.reminders
for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- ocurrencias (materializadas 48 h hacia adelante)
create table public.reminder_occurrences (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.reminders (id) on delete cascade,
  circle_id uuid not null references public.circles (id) on delete cascade,
  kind public.occurrence_kind not null default 'main',
  advance_days smallint not null default 0 check (advance_days between 0 and 30),
  due_at timestamptz not null,
  event_at timestamptz not null,
  local_date date not null,
  status public.occurrence_status not null default 'pending',
  not_done_reason text check (not_done_reason in ('rechazo', 'no_habia', 'otro')),
  snoozed_until timestamptz,
  done_by uuid references public.profiles (id) on delete set null,
  done_via text check (done_via in ('app', 'push', 'offline_sync', 'cared_link')),
  done_at timestamptz,
  notified_at timestamptz,
  followup_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reminder_id, kind, event_at, advance_days)
);

create index occurrences_circle_date_idx on public.reminder_occurrences (circle_id, local_date);
create index occurrences_dispatch_idx on public.reminder_occurrences (due_at)
  where status in ('pending', 'snoozed');

-- ---------------------------------------------------------------- marcas idempotentes (historial de quién marcó qué)
create table public.occurrence_marks (
  idempotency_key uuid primary key,
  occurrence_id uuid not null references public.reminder_occurrences (id) on delete cascade,
  circle_id uuid not null references public.circles (id) on delete cascade,
  marked_by uuid references public.profiles (id) on delete set null,
  status public.occurrence_status not null check (status in ('done', 'not_done', 'snoozed')),
  via text not null check (via in ('app', 'push', 'offline_sync', 'cared_link')),
  created_at timestamptz not null default now()
);

create index occurrence_marks_occurrence_idx on public.occurrence_marks (occurrence_id);

-- ---------------------------------------------------------------- suscripciones Web Push
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://'),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  user_agent text check (char_length(user_agent) <= 300),
  failed_count smallint not null default 0,
  last_success_at timestamptz,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ---------------------------------------------------------------- tareas sin fecha (F5)
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  created_by uuid references public.profiles (id) on delete set null,
  claimed_by uuid references public.profiles (id) on delete set null,
  scheduled_for date,
  done_at timestamptz,
  done_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_circle_idx on public.tasks (circle_id);

create trigger tasks_touch before update on public.tasks
for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- bitácora diaria (F6) — una entrada por círculo y día
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  entry_date date not null,
  day_rating text not null check (day_rating in ('bueno', 'regular', 'dificil')),
  moods text[] not null default '{}'
    check (moods <@ array['tranquila', 'feliz', 'triste', 'irritable', 'ansiosa', 'desorientada', 'con_dolor', 'cansada', 'otro']::text[]),
  sleep text check (sleep in ('bien', 'regular', 'poco')),
  food text check (food in ('bien', 'regular', 'poco')),
  note_enc text check (note_enc is null or note_enc ~ '^v[0-9]+\.'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (circle_id, entry_date)
);

create trigger journal_entries_touch before update on public.journal_entries
for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- bienestar de la cuidadora (F8) — privado siempre
create table public.selfcare_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  checkin_date date not null,
  score smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

-- ---------------------------------------------------------------- contactos importantes (F9) — sin datos clínicos
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  kind text not null check (kind in ('familia', 'medico', 'centro_salud', 'farmacia', 'transporte', 'otro')),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{6,20}$'),
  notes_enc text check (notes_enc is null or notes_enc ~ '^v[0-9]+\.'),
  is_emergency boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contacts_circle_idx on public.contacts (circle_id);

create trigger contacts_touch before update on public.contacts
for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------- emergencias desde la vista de la persona cuidada (F12)
create table public.emergency_events (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  link_id uuid references public.cared_links (id) on delete set null,
  recipients smallint not null default 0,
  triggered_at timestamptz not null default now()
);

create index emergency_events_circle_idx on public.emergency_events (circle_id, triggered_at desc);

-- ---------------------------------------------------------------- RPC: marcar una ocurrencia (idempotente)
create function public.mark_occurrence(
  p_occurrence uuid,
  p_status public.occurrence_status,
  p_idempotency_key uuid,
  p_reason text default null,
  p_snooze_minutes integer default null,
  p_via text default 'app'
) returns public.reminder_occurrences
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_occ public.reminder_occurrences;
  v_role public.member_role;
  v_mark_occurrence uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_status not in ('done', 'not_done', 'snoozed') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if p_via not in ('app', 'push', 'offline_sync') then
    raise exception 'invalid_via' using errcode = '22023';
  end if;
  if p_snooze_minutes is not null and (p_snooze_minutes < 5 or p_snooze_minutes > 240) then
    raise exception 'invalid_snooze' using errcode = '22023';
  end if;
  select * into v_occ from public.reminder_occurrences o where o.id = p_occurrence for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  select m.role into v_role from public.circle_members m
  where m.circle_id = v_occ.circle_id and m.user_id = v_uid;
  if v_role is null or v_role not in ('caregiver', 'family') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if exists (select 1 from public.circles c where c.id = v_occ.circle_id and c.closed_at is not null) then
    raise exception 'conflict' using errcode = 'P0001', detail = 'circle_closed';
  end if;
  insert into public.occurrence_marks (idempotency_key, occurrence_id, circle_id, marked_by, status, via)
  values (p_idempotency_key, p_occurrence, v_occ.circle_id, v_uid, p_status, p_via)
  on conflict (idempotency_key) do nothing;
  if not found then
    -- Reintento: la clave ya existe. Si era de otra ocurrencia, es un error del cliente.
    select m.occurrence_id into v_mark_occurrence from public.occurrence_marks m
    where m.idempotency_key = p_idempotency_key;
    if v_mark_occurrence <> p_occurrence then
      raise exception 'conflict' using errcode = 'P0001', detail = 'idempotency_key_reused';
    end if;
    return v_occ;
  end if;
  update public.reminder_occurrences o set
    status = p_status,
    not_done_reason = case when p_status = 'not_done' then p_reason else null end,
    snoozed_until = case when p_status = 'snoozed'
      then now() + make_interval(mins => coalesce(p_snooze_minutes, 30)) else null end,
    done_by = case when p_status = 'done' then v_uid else null end,
    done_via = case when p_status = 'done' then p_via else null end,
    done_at = case when p_status = 'done' then now() else null end
  where o.id = p_occurrence
  returning * into v_occ;
  return v_occ;
end
$$;

revoke all on function public.mark_occurrence(uuid, public.occurrence_status, uuid, text, integer, text) from public, anon;
grant execute on function public.mark_occurrence(uuid, public.occurrence_status, uuid, text, integer, text) to authenticated;

-- ---------------------------------------------------------------- RPC: cerrar un círculo (F13), p. ej. por fallecimiento
create function public.close_circle(p_circle uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not private.is_caregiver(p_circle) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_reason not in ('fallecimiento', 'ya_no_cuido', 'otro') then
    raise exception 'invalid_reason' using errcode = '22023';
  end if;
  update public.circles set closed_at = now(), closed_reason = p_reason where id = p_circle;
  update public.reminders set active = false where circle_id = p_circle;
  update public.reminder_occurrences set status = 'skipped'
  where circle_id = p_circle and status in ('pending', 'snoozed');
end
$$;

revoke all on function public.close_circle(uuid, text) from public, anon;
grant execute on function public.close_circle(uuid, text) to authenticated;

-- ---------------------------------------------------------------- RPC: "yo me encargo" de una tarea (F16)
create function public.claim_task(p_task uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_circle uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select t.circle_id into v_circle from public.tasks t where t.id = p_task;
  if v_circle is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not private.is_member(v_circle) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.tasks set claimed_by = v_uid where id = p_task;
end
$$;

revoke all on function public.claim_task(uuid) from public, anon;
grant execute on function public.claim_task(uuid) to authenticated;

-- ---------------------------------------------------------------- RPC: borrado definitivo de una usuaria (trabajo diario)
create function public.purge_user(p_uid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_pseudo uuid;
begin
  select p.pseudonym_id into v_pseudo from public.profiles p where p.id = p_uid;
  if v_pseudo is not null then
    delete from public.events where pseudonym_id = v_pseudo;
  end if;
  -- Borrar la fila de auth.users arrastra en cascada profiles y, por circles.created_by,
  -- los círculos que creó (con lo que ven sus familiares) y todo lo que cuelga de ellos.
  delete from auth.users where id = p_uid;
end
$$;

revoke all on function public.purge_user(uuid) from public, anon, authenticated;
grant execute on function public.purge_user(uuid) to service_role;

-- ---------------------------------------------------------------- RLS y privilegios
alter table public.reminders enable row level security;
alter table public.reminder_occurrences enable row level security;
alter table public.occurrence_marks enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.tasks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.selfcare_checkins enable row level security;
alter table public.contacts enable row level security;
alter table public.emergency_events enable row level security;

revoke all on public.reminders, public.reminder_occurrences, public.occurrence_marks,
  public.push_subscriptions, public.tasks, public.journal_entries, public.selfcare_checkins,
  public.contacts, public.emergency_events from anon, authenticated;

-- recordatorios: miembros leen; la cuidadora crea y edita; circle_id y created_by no se tocan
grant select, insert on public.reminders to authenticated;
grant update (kind, importance, title, med_name_enc, med_instructions_enc, rule, advance_days,
  visible_to_cared, active) on public.reminders to authenticated;
create policy reminders_select on public.reminders for select to authenticated
  using (private.is_member(circle_id));
create policy reminders_insert on public.reminders for insert to authenticated
  with check (private.is_caregiver(circle_id) and created_by = (select auth.uid()));
create policy reminders_update on public.reminders for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));

-- ocurrencias y marcas: solo lectura para miembros; se escriben por RPC o servidor
grant select on public.reminder_occurrences to authenticated;
create policy occurrences_select on public.reminder_occurrences for select to authenticated
  using (private.is_member(circle_id));
grant select on public.occurrence_marks to authenticated;
create policy occurrence_marks_select on public.occurrence_marks for select to authenticated
  using (private.is_member(circle_id));

-- suscripciones push: solo las propias
grant select, insert, update, delete on public.push_subscriptions to authenticated;
create policy push_subscriptions_own on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- tareas: miembros leen; la cuidadora crea, edita y borra; tomar una tarea es por RPC
grant select, insert, delete on public.tasks to authenticated;
grant update (title, scheduled_for, done_at, done_by) on public.tasks to authenticated;
create policy tasks_select on public.tasks for select to authenticated
  using (private.is_member(circle_id));
create policy tasks_insert on public.tasks for insert to authenticated
  with check (private.is_caregiver(circle_id) and created_by = (select auth.uid()));
create policy tasks_update on public.tasks for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));
create policy tasks_delete on public.tasks for delete to authenticated
  using (private.is_caregiver(circle_id));

-- bitácora: miembros leen; la cuidadora escribe como autora
grant select, insert on public.journal_entries to authenticated;
grant update (day_rating, moods, sleep, food, note_enc) on public.journal_entries to authenticated;
create policy journal_select on public.journal_entries for select to authenticated
  using (private.is_member(circle_id));
create policy journal_insert on public.journal_entries for insert to authenticated
  with check (private.is_caregiver(circle_id) and author_id = (select auth.uid()));
create policy journal_update on public.journal_entries for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));

-- bienestar: solo la dueña, nadie más (ni familia ni admin)
grant select, insert on public.selfcare_checkins to authenticated;
grant update (score) on public.selfcare_checkins to authenticated;
create policy selfcare_own on public.selfcare_checkins for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- contactos: miembros leen; la cuidadora escribe
grant select, insert, delete on public.contacts to authenticated;
grant update (name, kind, phone, notes_enc, is_emergency) on public.contacts to authenticated;
create policy contacts_select on public.contacts for select to authenticated
  using (private.is_member(circle_id));
create policy contacts_insert on public.contacts for insert to authenticated
  with check (private.is_caregiver(circle_id));
create policy contacts_update on public.contacts for update to authenticated
  using (private.is_caregiver(circle_id)) with check (private.is_caregiver(circle_id));
create policy contacts_delete on public.contacts for delete to authenticated
  using (private.is_caregiver(circle_id));

-- emergencias: los miembros ven el historial; se insertan desde el servidor
grant select on public.emergency_events to authenticated;
create policy emergency_events_select on public.emergency_events for select to authenticated
  using (private.is_member(circle_id));
