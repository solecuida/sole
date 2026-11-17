import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  currentKeyVersion,
  decryptField,
  encryptField,
  versionOf,
} from "../src/lib/crypto/field";
import type { Database } from "../src/lib/supabase/database.types";
import { loadLocalEnv } from "./lib/load-env";

// Vuelve a cifrar los campos protegidos con la clave vigente.
//
// Cuándo: después de cambiar FIELD_ENCRYPTION_KEY por una versión nueva y dejar
// la anterior en FIELD_ENCRYPTION_KEY_PREVIOUS (docs/mantenimiento.md, "Rotar claves").
//
//   pnpm -C app exec tsx scripts/rotate-field-key.ts --dry-run   (solo cuenta)
//   pnpm -C app exec tsx scripts/rotate-field-key.ts             (aplica)
//
// Es seguro repetirlo: lo que ya está con la clave vigente no se toca, así que
// si se corta a la mitad basta con correrlo otra vez. Un valor que no se puede
// descifrar se deja tal cual y se cuenta como fallo: nunca se pierde un dato.
// Nunca imprime el contenido de un campo ni una clave; solo conteos.

type Admin = SupabaseClient<Database>;

const PAGE = 500;

const TARGETS = [
  {
    table: "reminders",
    columns: [
      { name: "med_name_enc", context: "reminders.med_name" },
      { name: "med_instructions_enc", context: "reminders.med_instructions" },
    ],
  },
  {
    table: "journal_entries",
    columns: [{ name: "note_enc", context: "journal_entries.note" }],
  },
  {
    table: "contacts",
    columns: [{ name: "notes_enc", context: "contacts.notes" }],
  },
] as const;

export type RotatedTable = (typeof TARGETS)[number]["table"];

export interface TableCount {
  /** Filas revisadas. */
  scanned: number;
  /** Valores que estaban con una clave anterior y se volvieron a cifrar (o se volverían, en simulacro). */
  rotated: number;
  /** Valores que ya estaban con la clave vigente. */
  current: number;
  /** Valores que no se pudieron descifrar o guardar; quedaron como estaban. */
  failed: number;
}

export type RotateResult = Record<RotatedTable, TableCount>;

export interface RotateOptions {
  /** Solo cuenta; no cambia ninguna fila. */
  dryRun: boolean;
  /** Limita el trabajo a un círculo. Lo usan las pruebas; en producción no se pasa. */
  circleId?: string;
}

type Row = { id: string } & Record<string, string | null>;

async function rotateTable(
  admin: Admin,
  target: (typeof TARGETS)[number],
  options: RotateOptions,
): Promise<TableCount> {
  const count: TableCount = { scanned: 0, rotated: 0, current: 0, failed: 0 };
  const version = currentKeyVersion();
  const select = ["id", ...target.columns.map((column) => column.name)].join(
    ", ",
  );
  let lastId: string | null = null;

  for (;;) {
    // Se avanza por id: las filas ya revisadas no vuelven a aparecer aunque cambien.
    let query = admin
      .from(target.table)
      .select(select)
      .order("id", { ascending: true })
      .limit(PAGE);
    if (options.circleId) {
      query = query.eq("circle_id", options.circleId);
    }
    if (lastId) {
      query = query.gt("id", lastId);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`No se pudo leer ${target.table}`);
    }
    const rows = (data ?? []) as unknown as Row[];
    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      count.scanned += 1;
      for (const column of target.columns) {
        const stored = row[column.name];
        if (stored === null || stored === undefined) {
          continue;
        }
        if (versionOf(stored) === version) {
          count.current += 1;
          continue;
        }
        let renewed: string;
        try {
          renewed = encryptField(
            decryptField(stored, column.context),
            column.context,
          );
        } catch {
          count.failed += 1;
          continue;
        }
        if (options.dryRun) {
          count.rotated += 1;
          continue;
        }
        // Solo se escribe si el valor sigue siendo el que se leyó: si alguien
        // lo editó en este instante, su versión nueva ya usa la clave vigente.
        const updated = await admin
          .from(target.table)
          .update({ [column.name]: renewed } as never)
          .eq("id", row.id)
          // El nombre de la columna sale de la lista fija de arriba.
          .eq(column.name as "id", stored)
          .select("id");
        if (updated.error) {
          count.failed += 1;
        } else if ((updated.data?.length ?? 0) === 1) {
          count.rotated += 1;
        }
      }
    }
    lastId = rows[rows.length - 1].id;
    if (rows.length < PAGE) {
      break;
    }
  }
  return count;
}

/** Vuelve a cifrar, con la clave vigente, todo valor guardado con una clave anterior. */
export async function rotateAll(
  admin: Admin,
  options: RotateOptions,
): Promise<RotateResult> {
  const result = {} as RotateResult;
  for (const target of TARGETS) {
    result[target.table] = await rotateTable(admin, target, options);
  }
  return result;
}

async function main(): Promise<number> {
  loadLocalEnv();
  const dryRun = process.argv.includes("--dry-run");
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    console.error("Faltan SUPABASE_URL o SUPABASE_SECRET_KEY.");
    return 2;
  }
  const admin = createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let result: RotateResult;
  try {
    console.log(
      `Clave vigente: versión ${currentKeyVersion()}. ${dryRun ? "Simulacro: no se cambia nada." : "Aplicando cambios."}`,
    );
    result = await rotateAll(admin, { dryRun });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Error inesperado");
    return 1;
  }
  let failed = 0;
  for (const [table, count] of Object.entries(result)) {
    failed += count.failed;
    console.log(
      `${table}: ${count.scanned} filas revisadas · ${count.rotated} ${dryRun ? "por volver a cifrar" : "vueltas a cifrar"} · ${count.current} ya vigentes · ${count.failed} con fallo`,
    );
  }
  if (failed > 0) {
    console.error(
      "Hay valores que no se pudieron descifrar. Revisa que FIELD_ENCRYPTION_KEY_PREVIOUS sea la clave anterior. No se perdió nada: quedaron como estaban.",
    );
    return 1;
  }
  return 0;
}

// Solo corre al ejecutarlo directo; al importarlo desde una prueba, no.
if (/rotate-field-key\.ts$/.test(process.argv[1] ?? "")) {
  main().then((code) => {
    process.exitCode = code;
  });
}
