"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  OUTBOX_EVENT,
  pendingCount,
  replayOutbox,
  saveSnapshot,
  type TodaySnapshot,
} from "@/lib/offline/outbox";

const RETRY_MS = 10_000;

/**
 * Mantiene "Hoy" usable sin señal: guarda el día en el teléfono cada vez que
 * carga con conexión, avisa cuando no hay señal y envía las marcas pendientes
 * cuando vuelve.
 */
export function OfflineSync({
  snapshot,
}: {
  snapshot: Omit<TodaySnapshot, "savedAt">;
}) {
  const router = useRouter();
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [needsLogin, setNeedsLogin] = useState(false);
  const running = useRef(false);

  // Guarda el día cada vez que llega fresco del servidor.
  useEffect(() => {
    saveSnapshot(snapshot).catch(() => undefined);
  }, [snapshot]);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (running.current) {
        return;
      }
      running.current = true;
      try {
        if ((await pendingCount()) === 0) {
          if (!cancelled) {
            setPending(0);
          }
          return;
        }
        const result = await replayOutbox();
        if (cancelled) {
          return;
        }
        setPending(result.remaining);
        setNeedsLogin(result.needsLogin);
        if (result.sent > 0 || result.dropped > 0) {
          setOffline(result.remaining > 0);
          router.refresh();
        }
      } catch {
        // IndexedDB no disponible (modo privado): Sole sigue funcionando con conexión.
      } finally {
        running.current = false;
      }
    }

    function onOutbox(event: Event) {
      const detail = (event as CustomEvent<{ offline?: boolean }>).detail;
      if (detail?.offline) {
        setOffline(true);
      }
      pendingCount()
        .then((count) => !cancelled && setPending(count))
        .catch(() => undefined);
    }
    function onOnline() {
      setOffline(false);
      void sync();
    }
    function onOffline() {
      setOffline(true);
    }

    setOffline(!navigator.onLine);
    void sync();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("focus", sync);
    window.addEventListener(OUTBOX_EVENT, onOutbox);
    // Algunos navegadores no avisan cuando vuelve la señal: se reintenta cada tanto.
    const timer = window.setInterval(sync, RETRY_MS);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("focus", sync);
      window.removeEventListener(OUTBOX_EVENT, onOutbox);
      window.clearInterval(timer);
    };
  }, [router]);

  const visible = offline || pending > 0 || needsLogin;
  return (
    <div aria-live="polite">
      {visible ? (
        <p className="rounded-card border border-warning bg-warning-bg p-4 text-warning">
          {offline ? <strong>Sin conexión. </strong> : null}
          {pending > 0
            ? `${pending} ${pending === 1 ? "marca espera" : "marcas esperan"} señal para enviarse.`
            : null}
          {offline && pending === 0
            ? "Puedes seguir marcando: se guarda en tu teléfono."
            : null}
          {needsLogin ? " Vuelve a entrar para enviarlas." : null}
        </p>
      ) : null}
    </div>
  );
}
