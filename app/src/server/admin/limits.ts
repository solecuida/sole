import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Admin = SupabaseClient<Database>;

const DAY = 86_400_000;
/** Desde este porcentaje se avisa. */
export const WARNING_RATIO = 0.8;

export interface FreeLimit {
  /** Qué se mide, en palabras. */
  label: string;
  limit: number;
  unit: string;
  /** De dónde sale el número. */
  source: string;
  /** `true` si es un tope del proveedor; `false` si es una referencia propia. */
  provider: boolean;
}

/**
 * Límites con los que se compara el uso. Los mismos de `docs/limites.md`.
 * Los del proveedor están sin confirmar en su fuente oficial: hay que
 * revisarlos antes del lanzamiento (PENDIENTES.md).
 */
export const FREE_LIMITS = {
  databaseMb: {
    label: "Tamaño de la base de datos",
    // [VERIFICAR] fuente: https://supabase.com/pricing (plan gratuito)
    limit: 500,
    unit: "MB",
    source: "Plan gratuito de Supabase [VERIFICAR]",
    provider: true,
  },
  monthlyActiveUsers: {
    label: "Usuarias activas en los últimos 30 días",
    // [VERIFICAR] fuente: https://supabase.com/pricing (plan gratuito)
    limit: 50_000,
    unit: "usuarias",
    source: "Plan gratuito de Supabase [VERIFICAR]",
    provider: true,
  },
  pushSubscriptions: {
    label: "Teléfonos y navegadores con avisos activos",
    // Referencia propia: cada turno del despachador recorre estas filas.
    limit: 5_000,
    unit: "suscripciones",
    source: "Referencia propia, no es un tope del proveedor",
    provider: false,
  },
  monthlyEvents: {
    label: "Eventos de investigación en los últimos 30 días",
    // Referencia propia: los eventos son lo que más hace crecer la base.
    limit: 500_000,
    unit: "eventos",
    source: "Referencia propia, no es un tope del proveedor",
    provider: false,
  },
} as const satisfies Record<string, FreeLimit>;

export type LimitKey = keyof typeof FREE_LIMITS;

export interface UsageRow extends FreeLimit {
  key: LimitKey;
  used: number;
  /** Uso como fracción del límite (0.42 = 42 %). */
  ratio: number;
  /** Llegó al 80 % o más. */
  warning: boolean;
}

/** Fila de uso a partir de un valor medido. Función pura. */
export function usageRow(key: LimitKey, used: number): UsageRow {
  const limit = FREE_LIMITS[key];
  const ratio = used / limit.limit;
  return { key, ...limit, used, ratio, warning: ratio >= WARNING_RATIO };
}

async function countRows(
  query: PromiseLike<{ count: number | null }>,
): Promise<number> {
  return (await query).count ?? 0;
}

/**
 * Uso actual frente a los límites. Usa el cliente de servicio porque necesita
 * el tamaño de la base y contar suscripciones de todas las cuentas; solo cuenta
 * filas, nunca lee su contenido. Quien llama ya comprobó que es el administrador.
 */
export async function usageSnapshot(
  admin: Admin,
  now: Date,
): Promise<UsageRow[]> {
  const since = new Date(now.getTime() - 30 * DAY).toISOString();
  const [size, active, subscriptions, events] = await Promise.all([
    admin.rpc("admin_db_size_bytes"),
    countRows(
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_active_at", since),
    ),
    countRows(
      admin
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true }),
    ),
    countRows(
      admin
        .from("events")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since),
    ),
  ]);
  const megabytes =
    Math.round((Number(size.data ?? 0) / (1024 * 1024)) * 10) / 10;
  return [
    usageRow("databaseMb", megabytes),
    usageRow("monthlyActiveUsers", active),
    usageRow("pushSubscriptions", subscriptions),
    usageRow("monthlyEvents", events),
  ];
}
