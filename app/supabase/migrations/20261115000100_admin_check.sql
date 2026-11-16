-- Sole · comprobación de administrador para la app (escrita a mano).
--
-- La app necesita saber si quien tiene la sesión es administrador CON segundo
-- factor, para decidir qué mostrar (404, pedir el código, o el panel). En vez de
-- deducirlo en TypeScript leyendo la sesión, se le pregunta a la misma función
-- que usan las políticas RLS (`private.is_admin_mfa()`): así la pantalla y los
-- datos siempre opinan lo mismo, llegue la sesión por cookie o por token.
--
-- No concede nada: solo devuelve verdadero o falso sobre quien llama.

create function public.is_admin_with_mfa() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin_mfa()
$$;

revoke all on function public.is_admin_with_mfa() from public, anon;
grant execute on function public.is_admin_with_mfa() to authenticated;
