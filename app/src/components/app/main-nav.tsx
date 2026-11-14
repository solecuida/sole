"use client";

import {
  BookOpen,
  CalendarDays,
  Heart,
  type LucideIcon,
  Menu,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

interface NavItem {
  href: string;
  label: string;
}

const ALL: NavItem[] = [
  { href: "/hoy", label: "Hoy" },
  { href: "/calendario", label: "Calendario" },
  { href: "/recordatorios", label: "Recordatorios" },
  { href: "/tareas", label: "Tareas" },
  { href: "/bitacora", label: "Bitácora" },
  { href: "/para-ti", label: "Para ti" },
  { href: "/informes", label: "Informes" },
  { href: "/contactos", label: "Contactos" },
  { href: "/avisos", label: "Avisos" },
  { href: "/cuenta", label: "Cuenta" },
  { href: "/pronto", label: "Próximamente" },
];

const QUICK: (NavItem & { icon: LucideIcon })[] = [
  { href: "/hoy", label: "Hoy", icon: Sun },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/bitacora", label: "Bitácora", icon: BookOpen },
  { href: "/para-ti", label: "Para ti", icon: Heart },
];

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Barra superior con el menú completo. `signOut` llega listo desde el layout. */
export function TopBar({ signOut }: { signOut: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Al cambiar de pantalla, el menú se cierra solo.
  // biome-ignore lint/correctness/useExhaustiveDependencies: debe correr en cada cambio de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="max-h-[75dvh] shrink-0 overflow-y-auto border-b border-border bg-surface">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-2">
        <Link
          href="/hoy"
          className="inline-flex min-h-12 items-center text-xl font-bold no-underline"
        >
          Sole
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="menu-principal"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-12 min-w-12 items-center gap-2 rounded-control border-2 border-border-strong bg-background px-4 text-lg font-bold"
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          Menú
        </button>
      </div>
      <nav
        id="menu-principal"
        aria-label="Menú principal"
        hidden={!open}
        className="mx-auto max-w-content px-4 pb-4"
      >
        <ul className="grid grid-cols-2 gap-2">
          {ALL.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={
                  isCurrent(pathname, item.href) ? "page" : undefined
                }
                className="flex min-h-12 items-center rounded-control border border-border bg-background px-4 text-lg text-fg no-underline aria-[current=page]:border-2 aria-[current=page]:border-primary aria-[current=page]:font-bold"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3">{signOut}</div>
      </nav>
    </header>
  );
}

/**
 * Zona central que se desplaza. La barra de arriba y los accesos de abajo quedan
 * siempre a la vista SIN flotar sobre el contenido: así nada tapa un botón ni el
 * elemento enfocado (WCAG 2.4.11 y 2.5.8). Al cambiar de pantalla vuelve arriba.
 */
export function MainArea({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <main key={pathname} id="contenido" className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 py-6">
        {children}
      </div>
    </main>
  );
}

/** Accesos de todos los días, al alcance del pulgar. */
export function QuickNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Accesos rápidos"
      className="shrink-0 border-t border-border bg-surface"
    >
      <ul className="mx-auto grid max-w-content grid-cols-4">
        {QUICK.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isCurrent(pathname, href) ? "page" : undefined}
              className="flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-sm text-fg-muted no-underline aria-[current=page]:font-bold aria-[current=page]:text-primary"
            >
              <Icon aria-hidden="true" className="size-6" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
