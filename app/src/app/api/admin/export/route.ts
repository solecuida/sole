import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { logAdminAccess, requireAdmin } from "@/server/admin/guard";

export const dynamic = "force-dynamic";

const PAGE = 1000;
/** Tope por descarga. Con más filas, se pide por tramos usando `?desde=`. */
const MAX_ROWS = 100_000;
const HEADER = "pseudonym_id,name,props,org_code,created_at";

/** A quien no es administrador con segundo factor se le responde como si la ruta no existiera. */
function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "cache-control": "no-store" },
  });
}

function cell(value: string | null): string {
  if (value === null || value === "") {
    return "";
  }
  // Una celda que empieza con = + - @ podría ejecutarse como fórmula en una planilla.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

// Exportación de investigación: eventos con seudónimo, sin id de usuaria, correo
// ni texto libre. Se lee con la sesión del administrador: RLS decide.
export async function GET(request: Request): Promise<Response> {
  const supabase = createSupabaseRouteClient(request);
  const check = await requireAdmin(supabase);
  if (!check.ok) {
    return notFound();
  }
  const since = new URL(request.url).searchParams.get("desde");
  if (since !== null && !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    return new Response("Usa ?desde=AAAA-MM-DD", {
      status: 422,
      headers: { "cache-control": "no-store" },
    });
  }

  const lines = [HEADER];
  for (let offset = 0; offset < MAX_ROWS; offset += PAGE) {
    let query = supabase
      .from("events")
      .select("pseudonym_id, name, props, org_code, created_at")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (since) {
      query = query.gte("created_at", `${since}T00:00:00Z`);
    }
    const { data, error } = await query;
    if (error) {
      return new Response("No se pudo exportar", {
        status: 500,
        headers: { "cache-control": "no-store" },
      });
    }
    for (const row of data ?? []) {
      lines.push(
        [
          cell(row.pseudonym_id),
          cell(row.name),
          cell(JSON.stringify(row.props)),
          cell(row.org_code),
          cell(new Date(row.created_at).toISOString()),
        ].join(","),
      );
    }
    if ((data?.length ?? 0) < PAGE) {
      break;
    }
  }

  await logAdminAccess(
    supabase,
    "export",
    since ? `eventos desde ${since}` : "eventos",
  );

  const date = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="sole-eventos-${date}.csv"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
