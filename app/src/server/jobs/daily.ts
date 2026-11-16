import type { SupabaseClient } from "@supabase/supabase-js";
import { appUrl } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import { DELETION_GRACE_DAYS } from "@/server/account/lifecycle";
import type { Mailer } from "@/server/email/resend";

type Admin = SupabaseClient<Database>;

const DAY = 86_400_000;
/** 11 meses sin entrar: se avisa por correo. */
export const INACTIVITY_NOTICE_DAYS = 335;
/** 12 meses sin entrar: la cuenta se borra, si fue avisada. */
export const INACTIVITY_PURGE_DAYS = 365;
/** Días que deben pasar entre el aviso y el borrado. */
export const NOTICE_LEAD_DAYS = 30;
export const INACTIVITY_SUBJECT = "Tu cuenta de Sole se borrará en 30 días";

/** Tope por categoría en cada turno; lo que falte se hace al día siguiente. */
const BATCH = 500;
/** El trabajo corre una vez al día: el bloqueo cubre de sobra un turno largo. */
const LEASE_SECONDS = 600;

export interface DailyResult {
  /** `true` si otro turno ya estaba corriendo y este no hizo nada. */
  skipped?: boolean;
  /** Cuentas borradas porque su dueña lo pidió hace 7 días o más. */
  deleted: number;
  /** Avisos de inactividad enviados. */
  notified: number;
  /** Cuentas borradas por 12 meses de inactividad, ya avisadas. */
  purgedInactive: number;
  /** Contadores de límite de frecuencia vencidos que se limpiaron. */
  rateLimitsCleaned: number;
  /** Pasos que fallaron (se reintentan en el turno siguiente). */
  errors: number;
}

function inactivityText(): string {
  return [
    "Hola:",
    "",
    "Hace casi un año que no entras a Sole. Para no guardar tus datos sin necesidad, en 30 días borraremos tu cuenta y todo lo que registraste en ella.",
    "",
    "Si quieres conservarla, basta con entrar una vez antes de esa fecha:",
    `${appUrl()}/entrar`,
    "",
    "Si ya no la usas, no tienes que hacer nada.",
    "",
    "Sole",
  ].join("\n");
}

/** Borra de verdad las cuentas cuyo borrado se pidió hace 7 días o más. */
async function purgeRequested(
  admin: Admin,
  now: Date,
  result: DailyResult,
): Promise<void> {
  const cutoff = now.getTime() - DELETION_GRACE_DAYS * DAY;
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .not("deletion_requested_at", "is", null)
    .lte("deletion_requested_at", new Date(cutoff).toISOString())
    .order("deletion_requested_at", { ascending: true })
    .limit(BATCH);
  if (error) {
    result.errors += 1;
    return;
  }
  for (const row of data ?? []) {
    // Se vuelve a mirar justo antes: si la persona recuperó su cuenta en este
    // instante, no se borra.
    const { data: fresh } = await admin
      .from("profiles")
      .select("deletion_requested_at")
      .eq("id", row.id)
      .maybeSingle();
    if (
      !fresh?.deletion_requested_at ||
      new Date(fresh.deletion_requested_at).getTime() > cutoff
    ) {
      continue;
    }
    const purged = await admin.rpc("purge_user", { p_uid: row.id });
    if (purged.error) {
      result.errors += 1;
    } else {
      result.deleted += 1;
    }
  }
}

/** Borra a quien lleva 12 meses sin entrar Y fue avisada hace 30 días o más. */
async function purgeInactive(
  admin: Admin,
  now: Date,
  result: DailyResult,
): Promise<void> {
  const activeCutoff = now.getTime() - INACTIVITY_PURGE_DAYS * DAY;
  const noticeCutoff = now.getTime() - NOTICE_LEAD_DAYS * DAY;
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .lte("last_active_at", new Date(activeCutoff).toISOString())
    .not("inactivity_notice_sent_at", "is", null)
    .lte("inactivity_notice_sent_at", new Date(noticeCutoff).toISOString())
    .eq("is_admin", false)
    .order("last_active_at", { ascending: true })
    .limit(BATCH);
  if (error) {
    result.errors += 1;
    return;
  }
  for (const row of data ?? []) {
    // Lectura fresca: si entró hace un momento, su actividad ya no es antigua.
    const { data: fresh } = await admin
      .from("profiles")
      .select("last_active_at, inactivity_notice_sent_at, is_admin")
      .eq("id", row.id)
      .maybeSingle();
    if (!fresh?.inactivity_notice_sent_at || fresh.is_admin) {
      continue;
    }
    const lastActive = new Date(fresh.last_active_at).getTime();
    const noticed = new Date(fresh.inactivity_notice_sent_at).getTime();
    const stillInactive = lastActive <= activeCutoff;
    // El aviso vale solo si es posterior a la última actividad.
    const noticeStands = noticed > lastActive && noticed <= noticeCutoff;
    if (!stillInactive || !noticeStands) {
      continue;
    }
    const purged = await admin.rpc("purge_user", { p_uid: row.id });
    if (purged.error) {
      result.errors += 1;
    } else {
      result.purgedInactive += 1;
    }
  }
}

/**
 * Avisa a quien lleva 11 meses sin entrar. El aviso vale solo si es posterior a
 * la última actividad: quien fue avisada, volvió y dejó de entrar otra vez,
 * recibe un aviso nuevo antes de cualquier borrado.
 */
async function notifyInactive(
  admin: Admin,
  now: Date,
  mailer: Mailer,
  result: DailyResult,
): Promise<void> {
  const cutoff = now.getTime() - INACTIVITY_NOTICE_DAYS * DAY;
  const { data, error } = await admin
    .from("profiles")
    .select("id, last_active_at, inactivity_notice_sent_at")
    .lte("last_active_at", new Date(cutoff).toISOString())
    .is("deletion_requested_at", null)
    .eq("is_admin", false)
    .order("last_active_at", { ascending: true })
    .limit(BATCH);
  if (error) {
    result.errors += 1;
    return;
  }
  for (const row of data ?? []) {
    const alreadyNotified =
      row.inactivity_notice_sent_at !== null &&
      new Date(row.inactivity_notice_sent_at).getTime() >
        new Date(row.last_active_at).getTime();
    if (alreadyNotified) {
      continue;
    }
    const user = await admin.auth.admin.getUserById(row.id);
    const email = user.data.user?.email;
    if (!email) {
      result.errors += 1;
      continue;
    }
    const { sent } = await mailer({
      to: email,
      subject: INACTIVITY_SUBJECT,
      text: inactivityText(),
    });
    if (!sent) {
      // Sin aviso entregado no corre el plazo: se intenta de nuevo mañana.
      result.errors += 1;
      continue;
    }
    const marked = await admin
      .from("profiles")
      .update({ inactivity_notice_sent_at: now.toISOString() })
      .eq("id", row.id);
    if (marked.error) {
      result.errors += 1;
    } else {
      result.notified += 1;
    }
  }
}

/**
 * Trabajo diario. Lo llama `/api/cron/daily` con el cliente de servicio.
 *
 * Borra datos de forma definitiva, así que cada paso es conservador: ante un
 * error o una duda, no borra y lo deja para el turno siguiente. Nunca registra
 * correos ni nombres; devuelve solo conteos.
 */
export async function runDaily({
  admin,
  now,
  mailer,
}: {
  admin: Admin;
  now: Date;
  mailer: Mailer;
}): Promise<DailyResult> {
  const result: DailyResult = {
    deleted: 0,
    notified: 0,
    purgedInactive: 0,
    rateLimitsCleaned: 0,
    errors: 0,
  };
  const lease = await admin.rpc("acquire_job_lease", {
    p_name: "daily",
    p_seconds: LEASE_SECONDS,
  });
  if (lease.data !== true) {
    return { ...result, skipped: true };
  }
  try {
    await purgeRequested(admin, now, result);
    // El borrado por inactividad va ANTES del aviso: así nadie es avisada y
    // borrada en el mismo turno.
    await purgeInactive(admin, now, result);
    await notifyInactive(admin, now, mailer, result);
    const cleaned = await admin.rpc("cleanup_rate_limits");
    if (cleaned.error) {
      result.errors += 1;
    } else {
      result.rateLimitsCleaned = cleaned.data ?? 0;
    }
    return result;
  } finally {
    await admin.rpc("release_job_lease", { p_name: "daily" });
  }
}
