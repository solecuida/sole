-- Sole · migración de trabajos programados (escrita a mano).
-- pg_cron dispara cada minuto (avisos) y una vez al día (borrados e inactividad).
-- pg_net hace el POST a la app con el secreto guardado en Vault.
-- Si los secretos `app_base_url` o `cron_secret` no existen en Vault, la función no hace nada:
-- así el desarrollo local queda en silencio y se usa `pnpm -C app cron:dispatch` a mano.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create function private.call_app_job(p_path text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_base text;
  v_secret text;
begin
  select s.decrypted_secret into v_base from vault.decrypted_secrets s where s.name = 'app_base_url';
  select s.decrypted_secret into v_secret from vault.decrypted_secrets s where s.name = 'cron_secret';
  if v_base is null or v_secret is null then
    return;
  end if;
  perform net.http_post(
    url := v_base || p_path,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    timeout_milliseconds := 10000
  );
end
$$;

revoke all on function private.call_app_job(text) from public, anon, authenticated;

select cron.schedule('sole-dispatch', '* * * * *', $$select private.call_app_job('/api/cron/dispatch')$$);
select cron.schedule('sole-daily', '15 7 * * *', $$select private.call_app_job('/api/cron/daily')$$);
