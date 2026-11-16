import type { SupabaseClient } from "@supabase/supabase-js";
import type { Period } from "@/lib/reports/view";
import type { Database } from "@/lib/supabase/database.types";
import { addDays } from "@/server/calendar/calendar";
import { localDateOf } from "@/server/reminders/recurrence";
import { type Milestone, milestones } from "@/server/reports/milestones";
import {
  loadReportRows,
  periodRange,
  type Summary,
  summarize,
} from "@/server/reports/summary";

type Client = SupabaseClient<Database>;

export interface ReportView {
  today: string;
  range: { from: string; to: string };
  /** Lo que se puede mostrar y compartir: nunca incluye bienestar propio. */
  shared: Summary;
  /** Bienestar propio; solo si quien mira es la cuidadora. Nunca se comparte. */
  mine: NonNullable<Summary["selfcare"]> | null;
  milestones: Milestone[];
}

/**
 * Arma el informe de un período para quien mira. Reúne las lecturas de las
 * páginas de informes (pantalla e impresión) en un solo lugar.
 */
export async function loadReport(
  client: Client,
  userId: string,
  circle: { id: string; timezone: string },
  period: Period,
  now: Date,
): Promise<ReportView> {
  const timezone = circle.timezone;
  const today = localDateOf(now, timezone);
  const range = periodRange(period, today);

  const member = await client
    .from("circle_members")
    .select("role")
    .eq("circle_id", circle.id)
    .eq("user_id", userId)
    .maybeSingle();
  const isCaregiver = member.data?.role === "caregiver";

  const [rows, recent] = await Promise.all([
    loadReportRows(
      client,
      circle.id,
      { ...range, timezone },
      isCaregiver ? userId : undefined,
    ),
    // Los hitos miran siempre los últimos 30 días, sea cual sea el período.
    loadReportRows(client, circle.id, {
      from: addDays(today, -29),
      to: today,
      timezone,
    }),
  ]);

  return {
    today,
    range,
    shared: summarize(rows, period, "family"),
    mine: isCaregiver ? summarize(rows, period, "caregiver").selfcare : null,
    milestones: milestones(recent, now),
  };
}
