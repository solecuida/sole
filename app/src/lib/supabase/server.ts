import {
  type CookieOptions,
  createServerClient,
  parseCookieHeader,
} from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { appUrl, requireEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

// Las cookies de sesión nunca las lee el navegador: solo el servidor habla con Supabase.
function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl().startsWith("https://"),
    path: "/",
  };
}

/** Para Server Components y Server Actions: la sesión viaja en las cookies de la petición. */
export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database>
> {
  const cookieStore = await cookies();
  const options = sessionCookieOptions();
  return createServerClient<Database>(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_PUBLISHABLE_KEY"),
    {
      cookieOptions: options,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const {
              name,
              value,
              options: cookieOptions,
            } of cookiesToSet) {
              cookieStore.set(name, value, { ...cookieOptions, ...options });
            }
          } catch {
            // En un Server Component las cookies son de solo lectura:
            // el proxy ya refresca la sesión en cada petición.
          }
        },
      },
    },
  );
}

/**
 * Para Route Handlers: lee las cookies del Request. Si llega
 * `Authorization: Bearer <jwt>`, ese token es la sesión (así llaman las pruebas).
 */
export function createSupabaseRouteClient(
  request: Request,
): SupabaseClient<Database> {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_PUBLISHABLE_KEY");

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) {
    return createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${bearer}` } },
    });
  }

  const requestCookies = parseCookieHeader(
    request.headers.get("cookie") ?? "",
  ).map(({ name, value }) => ({ name, value: value ?? "" }));

  return createServerClient<Database>(url, key, {
    cookieOptions: sessionCookieOptions(),
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll() {
        // Un Route Handler no refresca la sesión: eso lo hace el proxy.
      },
    },
  });
}
