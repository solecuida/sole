"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  closeCircle,
  requestDeletion,
  restoreAccount,
} from "@/server/account/lifecycle";
import { getSessionUserId } from "@/server/auth/session";

/** Palabra que hay que escribir para confirmar el borrado. */
const CONFIRM_WORD = "BORRAR";

/** Cierra un círculo. Desde este instante no llega ningún aviso más de él. */
export async function closeCircleAction(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!(await getSessionUserId(supabase))) {
    redirect("/entrar");
  }
  const result = await closeCircle(
    supabase,
    String(formData.get("circleId") ?? ""),
    formData.get("reason"),
  );
  revalidatePath("/cuenta");
  revalidatePath("/hoy");
  if (!result.ok) {
    redirect(
      `/cuenta?aviso=${result.error.code === "validation_failed" ? "motivo" : "error"}`,
    );
  }
  redirect(
    `/cuenta?aviso=${result.data.reason === "fallecimiento" ? "cerrado-fallecimiento" : "cerrado"}`,
  );
}

/** Pide el borrado de la cuenta: se desactiva ahora y se elimina a los 7 días. */
export async function deleteAccountAction(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const typed = formData.get("confirm");
  if (
    typeof typed !== "string" ||
    typed.trim().toUpperCase() !== CONFIRM_WORD
  ) {
    redirect("/cuenta?aviso=confirmar#borrar");
  }
  // El token se lee antes de marcar el perfil: con él se cierran todas las sesiones.
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    redirect("/entrar");
  }
  const result = await requestDeletion(
    supabase,
    createSupabaseAdminClient(),
    userId,
    accessToken,
    new Date(),
  );
  if (!result.ok) {
    redirect("/cuenta?aviso=error#borrar");
  }
  // Las cookies de esta sesión ya no sirven: se limpian y se vuelve a la portada.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/?cuenta=borrado");
}

/** Deshace el pedido de borrado de la usuaria con sesión. */
export async function restoreAccountAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  // El cliente admin actúa solo sobre el id de la sesión recién comprobada.
  await restoreAccount(createSupabaseAdminClient(), userId);
  revalidatePath("/", "layout");
  redirect("/hoy");
}
