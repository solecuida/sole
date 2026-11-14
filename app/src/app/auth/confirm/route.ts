import { NextResponse } from "next/server";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth/route-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Destino del enlace del correo: /auth/confirm?token_hash=…&type=email&next=/hoy.
// Se verifica con verifyOtp (token_hash), que funciona aunque el correo se abra
// en un navegador distinto al que pidió el enlace.
const querySchema = z.object({
  token_hash: z.string().min(1).max(512),
  type: z.enum(["email", "magiclink", "signup", "recovery", "invite"]),
});

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const failure = NextResponse.redirect(new URL("/entrar?error=enlace", url));

  const parsed = querySchema.safeParse({
    token_hash: url.searchParams.get("token_hash"),
    type: url.searchParams.get("type"),
  });
  if (!parsed.success) {
    return failure;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp(parsed.data);
  if (error) {
    return failure;
  }

  return NextResponse.redirect(
    new URL(safeNextPath(url.searchParams.get("next")), url),
  );
}
