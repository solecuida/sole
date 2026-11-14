import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import type { ReactNode } from "react";
import { tokens } from "@/lib/design/tokens";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-atkinson",
});

export const metadata: Metadata = {
  title: {
    default: "Sole · Acompaña el día a día del cuidado",
    template: "%s · Sole",
  },
  description:
    "Sole te ayuda a ordenar el día cuando cuidas a otra persona: recordatorios, bitácora y un espacio para ti. Gratis, en español de Chile.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: tokens.light.background,
    },
    { media: "(prefers-color-scheme: dark)", color: tokens.dark.background },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL" className={atkinson.variable}>
      <body className="min-h-dvh antialiased">
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
