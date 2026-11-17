import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import {
  CSV_COLUMNS,
  CSV_TABLES,
  exportAll,
  toCsv,
} from "@/server/account/export";
import { getSessionUserId } from "@/server/auth/session";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

const querySchema = z.discriminatedUnion("formato", [
  z.object({ formato: z.literal("json") }),
  z.object({ formato: z.literal("csv"), tabla: z.enum(CSV_TABLES) }),
]);

// Descarga de "todos mis datos": un JSON completo o un CSV por tema.
export async function GET(request: Request): Promise<Response> {
  const supabase = createSupabaseRouteClient(request);
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    return apiError("unauthorized");
  }
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    formato: url.searchParams.get("formato") ?? undefined,
    tabla: url.searchParams.get("tabla") ?? undefined,
  });
  if (!parsed.success) {
    return apiError(
      "validation_failed",
      "Elige qué descargar: todo (JSON) o una de las tablas (CSV).",
    );
  }

  const now = new Date();
  const data = await exportAll(supabase, userId, now);
  const date = now.toISOString().slice(0, 10);
  const headers = (type: string, name: string) => ({
    "content-type": type,
    "content-disposition": `attachment; filename="${name}"`,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });

  if (parsed.data.formato === "json") {
    return new Response(JSON.stringify(data, null, 2), {
      headers: headers(
        "application/json; charset=utf-8",
        `sole-datos-${date}.json`,
      ),
    });
  }
  const table = parsed.data.tabla;
  return new Response(toCsv(data[table], CSV_COLUMNS[table]), {
    headers: headers("text/csv; charset=utf-8", `sole-${table}-${date}.csv`),
  });
}
