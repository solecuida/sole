export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(
    { ok: true, data: { status: "ok", time: new Date().toISOString() } },
    { headers: { "cache-control": "no-store" } },
  );
}
