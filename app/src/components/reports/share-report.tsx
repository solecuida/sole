"use client";

import { toBlob } from "html-to-image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Period } from "@/lib/reports/view";

export interface ShareReportProps {
  /** `image` comparte la tarjeta como imagen; `print` abre la impresión (PDF). */
  mode?: "image" | "print";
  period: Period;
  /** Día local `YYYY-MM-DD`, para el nombre del archivo. */
  date: string;
  /** `id` de la tarjeta del informe que se convierte en imagen. */
  targetId?: string;
  /** Server Action que anota que se compartió (solo el formato, nada más). */
  onShared: (format: "png" | "pdf") => Promise<void>;
}

const NOTICE = "Lo que compartes sale de Sole y queda bajo tu responsabilidad.";

/**
 * Compartir un informe, todo en el navegador: la imagen se genera aquí y nada se
 * sube a un servidor. Con el botón de compartir del teléfono si existe; si no,
 * se descarga el archivo.
 */
export function ShareReport({
  mode = "image",
  period,
  date,
  targetId = "informe",
  onShared,
}: ShareReportProps) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  if (mode === "print") {
    return (
      <Button
        onClick={() => {
          void onShared("pdf");
          window.print();
        }}
      >
        Imprimir o guardar como PDF
      </Button>
    );
  }

  const fileName = `sole-informe-${period}-${date}.png`;

  async function share() {
    setAsking(false);
    setBusy(true);
    setError(null);
    setStatus("Preparando la imagen…");
    try {
      const node = document.getElementById(targetId);
      if (!node) {
        throw new Error("sin tarjeta");
      }
      const blob = await toBlob(node, {
        pixelRatio: 2,
        backgroundColor: getComputedStyle(document.body).backgroundColor,
      });
      if (!blob) {
        throw new Error("sin imagen");
      }
      const file = new File([blob], fileName, { type: "image/png" });
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title: "Informe de Sole" });
        } catch (reason) {
          if (reason instanceof DOMException && reason.name === "AbortError") {
            // Cerró la hoja de compartir: no es un error ni se anota.
            setStatus("");
            return;
          }
          throw reason;
        }
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
      await onShared("png");
      setStatus("Listo: tu informe quedó como imagen.");
    } catch {
      setStatus("");
      setError("No pudimos preparar la imagen. Prueba de nuevo en un momento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="secondary"
        pending={busy}
        onClick={() => setAsking(true)}
      >
        Compartir
      </Button>
      <p role="status" aria-live="polite" className="text-fg-muted">
        {status}
      </p>
      {error ? (
        <p role="alert" className="text-danger">
          {error}
        </p>
      ) : null}
      <Dialog
        open={asking}
        onClose={() => setAsking(false)}
        title="Antes de compartir"
      >
        <p>{NOTICE}</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void share()}>Compartir igual</Button>
          <Button variant="secondary" onClick={() => setAsking(false)}>
            Cancelar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
