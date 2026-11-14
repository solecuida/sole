import { TZDate } from "@date-fns/tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import type { Database } from "@/lib/supabase/database.types";
import {
  type PushPayload,
  type PushSender,
  sendToUser,
} from "@/server/push/send";
import { materializeOccurrences } from "@/server/reminders/materialize";

type Admin = SupabaseClient<Database>;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
/** Lo que venció hace más de esto ya no se avisa: llegaría demasiado tarde para servir. */
const LOOKBACK_HOURS = 6;
const LEASE_SECONDS = 55;
const BATCH = 500;

export interface DispatchResult {
  skipped?: true;
  /** Ocurrencias avisadas a su hora (o como aviso previo). */
  notified: number;
  /** "¿Lo hiciste?" enviados. */
  followups: number;
  /** Pospuestas que volvieron a pendiente. */
  woken: number;
}

interface DueOccurrence {
  id: string;
  circle_id: string;
  kind: Database["public"]["Enums"]["occurrence_kind"];
  advance_days: number;
  event_at: string;
  notified_at: string | null;
  reminder: {
    title: string;
    importance: Database["public"]["Enums"]["importance"];
    active: boolean;
  } | null;
  circle: { timezone: string; closed_at: string | null } | null;
}

const OCCURRENCE_COLUMNS =
  "id, circle_id, kind, advance_days, event_at, notified_at, reminder:reminders!inner(title, importance, active), circle:circles!inner(timezone, closed_at)";

function isLive(occurrence: DueOccurrence): boolean {
  return (
    occurrence.reminder?.active === true &&
    occurrence.circle?.closed_at === null
  );
}

/**
 * Texto del aviso. El título es el que escribió la cuidadora; el nombre y la
 * indicación de un medicamento nunca salen de la base hacia un aviso.
 */
export function buildNotice(occurrence: DueOccurrence): PushPayload {
  const title = occurrence.reminder?.title ?? "Recordatorio";
  const time = format(
    new TZDate(
      new Date(occurrence.event_at),
      occurrence.circle?.timezone ?? "America/Santiago",
    ),
    "HH:mm",
  );
  let body = `Es ahora, a las ${time}. Toca para marcarlo.`;
  if (occurrence.kind === "advance") {
    const when =
      occurrence.advance_days === 0
        ? "Es hoy"
        : occurrence.advance_days === 1
          ? "Es mañana"
          : `Es en ${occurrence.advance_days} días`;
    body = `${when}, a las ${time}.`;
  }
  return {
    title,
    body,
    url: `/hoy?c=${occurrence.circle_id}`,
    tag: `occ-${occurrence.id}`,
    occurrenceId: occurrence.id,
    urgent: occurrence.reminder?.importance === "important",
  };
}

/** El "¿Lo hiciste?" con sus dos respuestas. */
export function buildFollowup(occurrence: DueOccurrence): PushPayload {
  return {
    title: "¿Lo hiciste?",
    body: occurrence.reminder?.title ?? "Recordatorio",
    url: `/hoy?c=${occurrence.circle_id}`,
    tag: `occ-${occurrence.id}`,
    occurrenceId: occurrence.id,
    actions: [
      { action: "done", title: "Sí, listo" },
      { action: "not_done", title: "No" },
    ],
    urgent: occurrence.reminder?.importance === "important",
  };
}

/** Cuidadoras de cada círculo, con sus minutos de espera para el "¿Lo hiciste?". */
async function caregiversByCircle(admin: Admin, circleIds: string[]) {
  const byCircle = new Map<string, { userId: string; followup: number }[]>();
  if (circleIds.length === 0) {
    return byCircle;
  }
  const { data } = await admin
    .from("circle_members")
    .select("circle_id, user_id, profile:profiles!inner(followup_minutes)")
    .eq("role", "caregiver")
    .in("circle_id", circleIds);
  for (const member of data ?? []) {
    byCircle.set(member.circle_id, [
      ...(byCircle.get(member.circle_id) ?? []),
      { userId: member.user_id, followup: member.profile.followup_minutes },
    ]);
  }
  return byCircle;
}

/**
 * Un turno del despachador (corre cada minuto): prepara ocurrencias, despierta
 * las pospuestas, avisa lo que toca y pregunta "¿Lo hiciste?" por lo que sigue
 * pendiente. Cada ocurrencia se RECLAMA en la base antes de enviar, así nunca
 * salen dos avisos por lo mismo aunque dos turnos se crucen.
 */
export async function runDispatch({
  admin,
  now,
  sender,
}: {
  admin: Admin;
  now: Date;
  sender: PushSender;
}): Promise<DispatchResult> {
  const lease = await admin.rpc("acquire_job_lease", {
    p_name: "dispatch",
    p_seconds: LEASE_SECONDS,
  });
  if (lease.data !== true) {
    return { skipped: true, notified: 0, followups: 0, woken: 0 };
  }

  try {
    await materializeOccurrences(admin, { now });
    const nowIso = now.toISOString();
    const since = new Date(now.getTime() - LOOKBACK_HOURS * HOUR).toISOString();

    // 1. Pospuestas cuyo plazo venció: vuelven a pendiente y se avisan de nuevo.
    const woke = await admin
      .from("reminder_occurrences")
      .update({
        status: "pending",
        snoozed_until: null,
        notified_at: null,
        followup_sent_at: null,
      })
      .eq("status", "snoozed")
      .lte("snoozed_until", nowIso)
      .select("id");
    const woken = woke.data?.length ?? 0;

    // 2. Avisos: pendientes cuya hora llegó y que nadie ha avisado.
    const due = await admin
      .from("reminder_occurrences")
      .select(OCCURRENCE_COLUMNS)
      .eq("status", "pending")
      .is("notified_at", null)
      .gte("due_at", since)
      .lte("due_at", nowIso)
      .order("due_at", { ascending: true })
      .limit(BATCH);
    const toNotify = ((due.data ?? []) as DueOccurrence[]).filter(isLive);

    // 3. Seguimiento: avisadas, todavía pendientes, sin "¿Lo hiciste?" enviado.
    const waiting = await admin
      .from("reminder_occurrences")
      .select(OCCURRENCE_COLUMNS)
      .eq("status", "pending")
      .eq("kind", "main")
      .not("notified_at", "is", null)
      .is("followup_sent_at", null)
      .gte("notified_at", since)
      .lte("notified_at", new Date(now.getTime() - 5 * MINUTE).toISOString())
      .limit(BATCH);
    const toFollowUp = ((waiting.data ?? []) as DueOccurrence[]).filter(isLive);

    const caregivers = await caregiversByCircle(admin, [
      ...new Set([...toNotify, ...toFollowUp].map((item) => item.circle_id)),
    ]);

    let notified = 0;
    for (const occurrence of toNotify) {
      const claimed = await admin
        .from("reminder_occurrences")
        .update({ notified_at: nowIso })
        .eq("id", occurrence.id)
        .is("notified_at", null)
        .eq("status", "pending")
        .select("id");
      if (!claimed.data?.length) {
        continue;
      }
      notified += 1;
      const payload = buildNotice(occurrence);
      for (const caregiver of caregivers.get(occurrence.circle_id) ?? []) {
        await sendToUser(admin, caregiver.userId, payload, sender, now);
      }
    }

    let followups = 0;
    for (const occurrence of toFollowUp) {
      const recipients = caregivers.get(occurrence.circle_id) ?? [];
      if (recipients.length === 0 || !occurrence.notified_at) {
        continue;
      }
      const waitMinutes = Math.min(...recipients.map((item) => item.followup));
      const elapsed =
        now.getTime() - new Date(occurrence.notified_at).getTime();
      if (elapsed < waitMinutes * MINUTE) {
        continue;
      }
      const claimed = await admin
        .from("reminder_occurrences")
        .update({ followup_sent_at: nowIso })
        .eq("id", occurrence.id)
        .is("followup_sent_at", null)
        .eq("status", "pending")
        .select("id");
      if (!claimed.data?.length) {
        continue;
      }
      followups += 1;
      const payload = buildFollowup(occurrence);
      for (const caregiver of recipients) {
        await sendToUser(admin, caregiver.userId, payload, sender, now);
      }
    }

    return { notified, followups, woken };
  } finally {
    await admin.rpc("release_job_lease", { p_name: "dispatch" });
  }
}
