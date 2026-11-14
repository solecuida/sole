import { ImageResponse } from "next/og";
import { tokens } from "@/lib/design/tokens";

// Íconos PNG de la app, dibujados desde los tokens: el logo de Sole es un
// cuadrado redondeado color primario con una "S" color fondo.
// Se generan en el build; cualquier otro tamaño responde 404.

const ICONS = {
  "96": { pixels: 96, maskable: false },
  "192": { pixels: 192, maskable: false },
  "512": { pixels: 512, maskable: false },
  // Maskable: el sistema recorta el ícono (círculo, gota…), así que el fondo
  // llega hasta el borde y la letra queda dentro de la zona segura.
  "512-maskable": { pixels: 512, maskable: true },
} as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((size) => ({ size }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
): Promise<Response> {
  const { size } = await params;
  const icon = ICONS[size as keyof typeof ICONS];
  if (!icon) {
    return new Response("No encontrado", { status: 404 });
  }
  const { pixels, maskable } = icon;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: tokens.light.primary,
        color: tokens.light.background,
        borderRadius: maskable ? 0 : pixels * 0.22,
        fontSize: pixels * (maskable ? 0.46 : 0.62),
        fontWeight: 700,
      }}
    >
      S
    </div>,
    { width: pixels, height: pixels },
  );
}
