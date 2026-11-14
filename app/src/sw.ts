import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

// Service worker de Sole. Hace tres cosas:
//  1. Guarda en el teléfono los archivos estáticos del build (para abrir rápido).
//  2. Muestra los avisos push que manda el despachador.
//  3. Responde a los botones del "¿Lo hiciste?" sin abrir la app.
//
// A propósito NO guarda páginas ni respuestas de la API: tienen datos del
// cuidado, y no deben quedar en una caché del navegador que otra persona
// podría ver en un teléfono compartido.

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Las páginas siempre se piden a la red y nunca se guardan (tienen datos del
  // cuidado). Esta ruta existe solo para poder responder algo cuando no hay señal.
  runtimeCaching: [
    {
      matcher: ({ request }) => request.destination === "document",
      handler: new NetworkOnly(),
    },
  ],
  // Sin señal, cualquier página se reemplaza por /~offline, que muestra el
  // último "Hoy" guardado en el teléfono.
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();

/** Lo que envía el servidor (src/server/push/send.ts → PushPayload). */
interface PushMessage {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  occurrenceId?: string;
  actions?: { action: string; title: string }[];
}

interface NoticeData {
  url: string;
  occurrenceId?: string;
}

self.addEventListener("push", (event) => {
  let message: PushMessage = {};
  try {
    message = (event.data?.json() ?? {}) as PushMessage;
  } catch {
    // Un aviso ilegible igual se muestra, con el texto por defecto.
  }
  const actions = message.actions ?? [];
  const data: NoticeData = {
    url: message.url ?? "/hoy",
    occurrenceId: message.occurrenceId,
  };
  const options: NotificationOptions & {
    actions?: { action: string; title: string }[];
  } = {
    body: message.body ?? "",
    icon: "/icons/192",
    badge: "/icons/96",
    tag: message.tag,
    data,
    actions,
    // El "¿Lo hiciste?" se queda en pantalla hasta que la persona responda.
    requireInteraction: actions.length > 0,
  };
  event.waitUntil(
    self.registration.showNotification(message.title ?? "Sole", options),
  );
});

/** Abre la app en la pantalla del aviso, o la trae al frente si ya está abierta. */
async function openApp(url: string): Promise<void> {
  const target = new URL(url, self.location.origin);
  // Un aviso nunca puede llevar fuera de Sole.
  const safe = target.origin === self.location.origin ? target.href : "/hoy";
  const windows = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of windows) {
    if ("focus" in client) {
      await client.focus();
      if ("navigate" in client) {
        await client.navigate(safe).catch(() => undefined);
      }
      return;
    }
  }
  await self.clients.openWindow(safe);
}

/** Marca la ocurrencia desde el aviso. `false` si hay que abrir la app (sin sesión o sin red). */
async function markFromNotice(
  occurrenceId: string,
  status: "done" | "not_done",
): Promise<boolean> {
  try {
    const response = await fetch("/api/occurrences/mark", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        occurrenceId,
        status,
        idempotencyKey: crypto.randomUUID(),
        via: "push",
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

self.addEventListener("notificationclick", (event) => {
  const data = (event.notification.data ?? { url: "/hoy" }) as NoticeData;
  const action = event.action;
  event.notification.close();
  event.waitUntil(
    (async () => {
      if (
        (action === "done" || action === "not_done") &&
        data.occurrenceId &&
        (await markFromNotice(data.occurrenceId, action))
      ) {
        return;
      }
      await openApp(data.url);
    })(),
  );
});
