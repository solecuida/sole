"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export interface PushSettingsProps {
  /** Clave pública VAPID del servidor. Sin ella no se puede suscribir. */
  vapidPublicKey: string | null;
  /** Teléfonos y navegadores con avisos activos en esta cuenta. */
  initialCount: number;
}

type DeviceState = "checking" | "unsupported" | "active" | "inactive";

function toUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = base64url.padEnd(
    base64url.length + ((4 - (base64url.length % 4)) % 4),
    "=",
  );
  const raw = atob(padded.replaceAll("-", "+").replaceAll("_", "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

/** El service worker listo, o null si en 4 segundos no aparece (por ejemplo, en modo desarrollo). */
async function readyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
  ]);
}

async function post(
  body: unknown,
): Promise<{ ok: boolean; message?: string; count?: number }> {
  try {
    const response = await fetch("/api/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    return json.ok
      ? { ok: true, count: json.data?.count }
      : { ok: false, message: json.error?.message };
  } catch {
    return { ok: false, message: "No hay conexión. Prueba de nuevo." };
  }
}

export function PushSettings({
  vapidPublicKey,
  initialCount,
}: PushSettingsProps) {
  const [device, setDevice] = useState<DeviceState>("checking");
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!supported) {
        setDevice("unsupported");
        return;
      }
      const registration = await readyRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (!cancelled) {
        setDevice(subscription ? "active" : "inactive");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function activate() {
    setBusy(true);
    setMessage(null);
    try {
      // El permiso se pide solo aquí, cuando la persona toca el botón.
      const permission = await Notification.requestPermission();
      await post({ action: "permission", result: permission });
      if (permission !== "granted") {
        setMessage(
          "No diste permiso para los avisos. Puedes cambiarlo en los ajustes de tu navegador y volver a intentarlo.",
        );
        return;
      }
      const registration = await readyRegistration();
      if (!registration || !vapidPublicKey) {
        setMessage(
          "No pudimos preparar los avisos en este navegador. Si estás en iPhone, primero agrega Sole a tu pantalla de inicio.",
        );
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toUint8Array(vapidPublicKey),
      });
      const result = await post({
        action: "subscribe",
        subscription: subscription.toJSON(),
      });
      if (!result.ok) {
        setMessage(result.message ?? "No pudimos activar los avisos.");
        return;
      }
      setCount(result.count ?? count);
      setDevice("active");
      setMessage("Listo. Te avisaremos en este teléfono.");
    } catch {
      setMessage("No pudimos activar los avisos. Prueba de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await readyRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const result = await post({
          action: "unsubscribe",
          subscription: { endpoint: subscription.endpoint },
        });
        await subscription.unsubscribe();
        setCount(result.count ?? Math.max(count - 1, 0));
      }
      setDevice("inactive");
      setMessage("Listo. Ya no te llegarán avisos a este teléfono.");
    } catch {
      setMessage("No pudimos desactivar los avisos. Prueba de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    const result = await post({ action: "test" });
    setMessage(
      result.ok
        ? "Enviamos un aviso de prueba. Debería llegar en unos segundos."
        : (result.message ?? "No pudimos enviar la prueba."),
    );
    setBusy(false);
  }

  return (
    <section
      aria-labelledby="avisos-titulo"
      className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4"
    >
      <h2 id="avisos-titulo" className="text-xl font-bold">
        Avisos en este teléfono
      </h2>
      <p>
        Con los avisos, Sole te recuerda cada cosa a su hora aunque tengas la
        aplicación cerrada, y te pregunta si se hizo.
      </p>

      <p className="text-lg font-bold" role="status">
        {device === "checking" ? "Revisando…" : null}
        {device === "active" ? "Avisos activos ✓" : null}
        {device === "inactive" ? "Avisos desactivados ✗" : null}
        {device === "unsupported"
          ? "Avisos desactivados ✗ · este navegador no los permite"
          : null}
      </p>
      {count > 0 ? (
        <p className="text-base text-fg-muted">
          Tu cuenta tiene avisos activos en {count}{" "}
          {count === 1 ? "teléfono o navegador" : "teléfonos o navegadores"}.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {device === "inactive" ? (
          <Button pending={busy} onClick={activate}>
            Activar avisos
          </Button>
        ) : null}
        {device === "active" ? (
          <>
            <Button variant="secondary" pending={busy} onClick={test}>
              Probar aviso
            </Button>
            <Button variant="ghost" pending={busy} onClick={deactivate}>
              Desactivar avisos en este teléfono
            </Button>
          </>
        ) : null}
      </div>

      <p aria-live="polite" className="min-h-6">
        {message}
      </p>

      <ul className="list-disc pl-6 text-base text-fg-muted">
        <li>
          En iPhone, los avisos funcionan solo si agregaste Sole a tu pantalla
          de inicio, y con iOS 16.4 o superior.
        </li>
        <li>
          En Android, si los avisos llegan tarde, revisa que el ahorro de
          batería no esté limitando a Chrome.
        </li>
        <li>
          Aunque no actives los avisos, lo pendiente siempre aparece en «Hoy».
        </li>
      </ul>
    </section>
  );
}
