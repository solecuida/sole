import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isPublicPath } from "@/lib/auth/route-rules";
import { appUrl, requireEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

// Corre antes de cada petición: refresca la sesión (el JWT dura 1 hora) y manda
// a /entrar a quien pide una ruta protegida sin sesión. No reemplaza la
// autorización de cada página, acción y ruta: es la primera barrera, no la única.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_PUBLISHABLE_KEY"),
    {
      cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure: appUrl().startsWith("https://"),
        path: "/",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: "lax",
            });
          }
        },
      },
    },
  );

  // getUser() valida el JWT contra Supabase; getSession() no lo hace.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  if (!user && !isPublicPath(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/entrar";
    login.search = "";
    login.searchParams.set("next", `${pathname}${search}`);
    const redirectResponse = NextResponse.redirect(login);
    // Conserva las cookies que el refresco haya limpiado o renovado.
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    // Todo salvo los estáticos del build y los archivos de imagen o fuente.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
