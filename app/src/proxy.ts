import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isPublicPath } from "@/lib/auth/route-rules";
import { appUrl, requireEnv } from "@/lib/env";
import { buildCsp, createNonce } from "@/lib/security/headers";
import type { Database } from "@/lib/supabase/database.types";

// Corre antes de cada petición: refresca la sesión (el JWT dura 1 hora) y manda
// a /entrar a quien pide una ruta protegida sin sesión. No reemplaza la
// autorización de cada página, acción y ruta: es la primera barrera, no la única.
//
// También fija la política de contenido (CSP) con un nonce nuevo por petición.
export async function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildCsp(nonce, {
    dev: process.env.NODE_ENV !== "production",
    insecureOrigin: !appUrl().startsWith("https://"),
  });
  // Next lee la política desde la petición y pone el nonce en sus scripts.
  const forward = () => {
    const headers = new Headers(request.headers);
    headers.set("x-nonce", nonce);
    headers.set("content-security-policy", csp);
    return NextResponse.next({ request: { headers } });
  };
  let response = forward();

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
          response = forward();
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
    redirectResponse.headers.set("content-security-policy", csp);
    return redirectResponse;
  }

  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Todo salvo los estáticos del build y los archivos de imagen o fuente.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
