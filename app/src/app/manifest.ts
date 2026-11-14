import type { MetadataRoute } from "next";
import { tokens } from "@/lib/design/tokens";

// Manifiesto de la PWA: lo que el teléfono usa al "Agregar a inicio".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sole · el día a día del cuidado",
    short_name: "Sole",
    description:
      "Recordatorios, bitácora y un espacio para ti cuando cuidas a otra persona.",
    start_url: "/hoy",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es-CL",
    background_color: tokens.light.background,
    theme_color: tokens.light.background,
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
