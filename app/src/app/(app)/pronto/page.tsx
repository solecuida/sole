import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { visibleDoors } from "@/server/fake-doors/doors";

export const metadata: Metadata = { title: "Próximamente" };

export default async function SoonPage() {
  const supabase = await createSupabaseServerClient();
  if (!(await getSessionUserId(supabase))) {
    redirect("/entrar");
  }
  const doors = visibleDoors();

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Próximamente</h1>
      <p className="text-fg-muted">
        Son ideas que todavía no existen. Cuéntanos cuáles te servirían y así
        decidimos qué construir primero.
      </p>
      <ul className="flex flex-col gap-3">
        {doors.map((door) => (
          <li
            key={door.slug}
            className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
          >
            <h2 className="text-lg font-bold">{door.title}</h2>
            <p>{door.description}</p>
            <Link
              href={`/pronto/${door.slug}`}
              className="inline-flex min-h-12 items-center font-bold text-primary underline"
              aria-label={`Contarnos qué piensas de ${door.title}`}
            >
              Contarnos qué piensas
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
