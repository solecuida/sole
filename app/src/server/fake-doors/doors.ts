import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";
import { DOORS as DOOR_KEYS } from "@/server/events/catalog";

type Client = SupabaseClient<Database>;

/**
 * Mientras sea `false`, la puerta "Invitar a un familiar" se muestra.
 * Lo cambia el paso 66 (`familiares-invitaciones`), cuando esa función exista.
 */
export const FAMILY_ENABLED = false;

export type DoorKey = (typeof DOOR_KEYS)[number];

export interface DoorDefinition {
  /** Parte de la URL: `/pronto/<slug>`. */
  slug: string;
  /** Valor de `fake_door_interest.door_key`. */
  key: DoorKey;
  title: string;
  description: string;
  /** La puerta solo existe mientras `FAMILY_ENABLED` sea `false`. */
  hiddenWhenFamilyEnabled?: true;
}

export const DOORS: readonly DoorDefinition[] = [
  {
    slug: "ia",
    key: "ia",
    title: "Sole con IA",
    description:
      "Le hablas a Sole y ella ordena la bitácora y los recordatorios.",
  },
  {
    slug: "recetas",
    key: "recetas",
    title: "Recetas y recomendaciones",
    description:
      "Ideas de comidas y cosas para hacer según tu rutina de cuidado.",
  },
  {
    slug: "plan-familiar",
    key: "plan_familiar",
    title: "Plan familiar",
    description: "Para 3 o 4 personas, con un inicio común.",
  },
  {
    slug: "comunidad",
    key: "comunidad",
    title: "Comunidad",
    description:
      "Conocer a otras personas que cuidan en una situación como la tuya.",
  },
  {
    slug: "fotos",
    key: "fotos",
    title: "Fotos e historial visual",
    description:
      "Guardar fotos como comprobante o como historial de la persona que cuidas.",
  },
  {
    slug: "invitar-familiar",
    key: "invitar_familiar",
    title: "Invitar a un familiar",
    description: "Sumar a alguien de tu familia para cuidar juntos.",
    hiddenWhenFamilyEnabled: true,
  },
];

/** Precios de prueba del plan familiar, en pesos al mes. */
export const PLAN_PRICES = ["2990", "4990", "7990"] as const;
export type PlanPrice = (typeof PLAN_PRICES)[number];

export const PRICE_LABELS: Record<PlanPrice, string> = {
  "2990": "$2.990",
  "4990": "$4.990",
  "7990": "$7.990",
};

/** Puertas que se muestran. Con `familyEnabled` activo, "Invitar a un familiar" desaparece. */
export function visibleDoors(
  familyEnabled: boolean = FAMILY_ENABLED,
): DoorDefinition[] {
  return DOORS.filter(
    (door) => !(familyEnabled && door.hiddenWhenFamilyEnabled),
  );
}

/** Busca una puerta visible por su slug de URL. */
export function findDoor(
  slug: string,
  familyEnabled: boolean = FAMILY_ENABLED,
): DoorDefinition | undefined {
  return visibleDoors(familyEnabled).find((door) => door.slug === slug);
}

export type InterestErrorCode = "validation_failed" | "internal";

export interface InterestInput {
  notifyMe: boolean;
  choice?: PlanPrice | null;
}

export interface Interest {
  notifyMe: boolean;
  choice: PlanPrice | null;
}

const doorKeySchema = z.enum(DOOR_KEYS);
const inputSchema = z.object({
  notifyMe: z.boolean(),
  choice: z.enum(PLAN_PRICES).nullish(),
});

const VALIDATION = "Revisa tu respuesta y vuelve a intentarlo.";
const INTERNAL =
  "No pudimos guardar tu respuesta. Prueba de nuevo en un momento.";

function toChoice(value: string | null): PlanPrice | null {
  return PLAN_PRICES.find((price) => price === value) ?? null;
}

/**
 * Guarda la respuesta de la usuaria a una puerta. Solo el plan familiar admite precio,
 * y elegir un precio cuenta como pedir el aviso.
 *
 * `authenticated` solo puede leer e insertar en `fake_door_interest` (sin update, sin
 * clave única): cada respuesta nueva es una fila nueva y `getInterest` lee la más
 * reciente, así que para quien la lee hay una sola respuesta por puerta.
 */
export async function registerInterest(
  client: Client,
  userId: string,
  doorKey: string,
  input: InterestInput,
): Promise<Result<Interest, InterestErrorCode>> {
  const key = doorKeySchema.safeParse(doorKey);
  const parsed = inputSchema.safeParse(input);
  if (!key.success || !parsed.success) {
    return fail("validation_failed", VALIDATION);
  }
  const choice = parsed.data.choice ?? null;
  if (choice && key.data !== "plan_familiar") {
    return fail("validation_failed", VALIDATION);
  }
  const notifyMe = parsed.data.notifyMe || choice !== null;

  // Sin .select(): el insert no necesita devolver la fila.
  const { error } = await client.from("fake_door_interest").insert({
    user_id: userId,
    door_key: key.data,
    notify_me: notifyMe,
    choice,
  });
  if (error) {
    return fail("internal", INTERNAL);
  }
  return ok({ notifyMe, choice });
}

/** Última respuesta propia a una puerta, o `null` si todavía no respondió. */
export async function getInterest(
  client: Client,
  userId: string,
  doorKey: DoorKey,
): Promise<Interest | null> {
  const { data } = await client
    .from("fake_door_interest")
    .select("notify_me, choice")
    .eq("user_id", userId)
    .eq("door_key", doorKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data
    ? { notifyMe: data.notify_me, choice: toChoice(data.choice) }
    : null;
}
