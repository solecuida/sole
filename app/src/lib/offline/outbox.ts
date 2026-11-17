import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import { type MarkRequest, sendMark } from "@/lib/today/mark";

// Lo que Sole guarda en el teléfono para funcionar sin señal (IndexedDB "sole"):
//   snapshot  el último "Hoy" de cada círculo, para poder consultarlo
//   outbox    las marcas hechas sin conexión, que se envían al volver la señal
//
// Solo corre en el navegador. No guarda el nombre ni la indicación de los
// medicamentos: solo el título que escribió la cuidadora.

export type SnapshotStatus =
  | "pending"
  | "done"
  | "not_done"
  | "snoozed"
  | "skipped";

export interface SnapshotItem {
  id: string;
  title: string;
  time: string;
  status: SnapshotStatus;
  overdue: boolean;
  notDoneReason: string | null;
  snoozedUntil: string | null;
}

export interface TodaySnapshot {
  circleId: string;
  caredName: string;
  localDate: string;
  groups: Record<"important" | "normal" | "whenever", SnapshotItem[]>;
  /** Cuándo se guardó (ISO). */
  savedAt: string;
}

interface SoleDB extends DBSchema {
  snapshot: { key: string; value: TodaySnapshot };
  outbox: { key: string; value: MarkRequest & { queuedAt: string } };
}

/** Aviso interno: la cola o el estado de conexión cambiaron. */
export const OUTBOX_EVENT = "sole:outbox";

let dbPromise: Promise<IDBPDatabase<SoleDB>> | null = null;

function db(): Promise<IDBPDatabase<SoleDB>> {
  dbPromise ??= openDB<SoleDB>("sole", 1, {
    upgrade(database) {
      database.createObjectStore("snapshot", { keyPath: "circleId" });
      database.createObjectStore("outbox", { keyPath: "idempotencyKey" });
    },
  });
  return dbPromise;
}

function announce(detail: { offline?: boolean } = {}): void {
  window.dispatchEvent(new CustomEvent(OUTBOX_EVENT, { detail }));
}

export async function saveSnapshot(
  snapshot: Omit<TodaySnapshot, "savedAt">,
  now: Date = new Date(),
): Promise<void> {
  await (await db()).put("snapshot", {
    ...snapshot,
    savedAt: now.toISOString(),
  });
}

/** El "Hoy" guardado de un círculo o, sin id, el más reciente. */
export async function readSnapshot(
  circleId?: string | null,
): Promise<TodaySnapshot | null> {
  const database = await db();
  if (circleId) {
    return (await database.get("snapshot", circleId)) ?? null;
  }
  const all = await database.getAll("snapshot");
  return all.sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0] ?? null;
}

/** Aplica una marca a lo guardado, para que sin conexión se vea igual que en "Hoy". */
async function applyToSnapshots(mark: MarkRequest): Promise<void> {
  const database = await db();
  for (const snapshot of await database.getAll("snapshot")) {
    let changed = false;
    for (const items of Object.values(snapshot.groups)) {
      for (const item of items) {
        if (item.id === mark.occurrenceId) {
          item.status = mark.status;
          item.overdue = false;
          item.notDoneReason = mark.reason ?? null;
          changed = true;
        }
      }
    }
    if (changed) {
      await database.put("snapshot", snapshot);
    }
  }
}

/** Guarda una marca para enviarla después. Conserva su clave de idempotencia. */
export async function enqueueMark(mark: MarkRequest): Promise<void> {
  await (await db()).put("outbox", {
    ...mark,
    queuedAt: new Date().toISOString(),
  });
  await applyToSnapshots(mark);
  announce({ offline: true });
}

export async function pendingCount(): Promise<number> {
  return (await db()).count("outbox");
}

export interface ReplayResult {
  sent: number;
  /** Descartadas porque el servidor las rechazó para siempre (sin permiso, ya no existe…). */
  dropped: number;
  remaining: number;
  /** Se detuvo porque la sesión venció: hay que volver a entrar. */
  needsLogin: boolean;
}

/**
 * Reenvía las marcas guardadas, de la más antigua a la más nueva, con
 * `via: "offline_sync"`. Como cada una lleva su clave de idempotencia,
 * reenviar dos veces no duplica nada.
 */
export async function replayOutbox(
  fetchFn: typeof fetch = fetch,
): Promise<ReplayResult> {
  const database = await db();
  const queued = (await database.getAll("outbox")).sort((a, b) =>
    a.queuedAt.localeCompare(b.queuedAt),
  );
  const result: ReplayResult = {
    sent: 0,
    dropped: 0,
    remaining: 0,
    needsLogin: false,
  };
  for (const { queuedAt: _queuedAt, ...mark } of queued) {
    const outcome = await sendMark({ ...mark, via: "offline_sync" }, fetchFn);
    if (outcome.kind === "saved") {
      await database.delete("outbox", mark.idempotencyKey);
      result.sent += 1;
    } else if (outcome.kind === "error" && outcome.status === 401) {
      result.needsLogin = true;
      break;
    } else if (
      outcome.kind === "error" &&
      [403, 404, 409, 422].includes(outcome.status)
    ) {
      await database.delete("outbox", mark.idempotencyKey);
      result.dropped += 1;
    } else {
      // Sin red o error del servidor: se deja para el próximo intento.
      break;
    }
  }
  result.remaining = await database.count("outbox");
  announce({ offline: result.remaining > 0 && result.sent === 0 });
  return result;
}
