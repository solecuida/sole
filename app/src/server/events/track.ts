import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getConsentState } from "@/server/consents/consents";
import {
  EVENT_CATALOG,
  type EventName,
  type EventProps,
  isEventName,
} from "@/server/events/catalog";

type Client = SupabaseClient<Database>;

/**
 * Registra un evento de investigación con el seudónimo de la usuaria.
 *
 *  - Valida nombre y propiedades contra el catálogo: nada fuera de él se guarda.
 *  - Sin consentimiento de investigación, solo se guardan los eventos técnicos.
 *  - Escribe `pseudonym_id` y `org_code` de su perfil; nunca su id ni su correo.
 *  - Nunca lanza: medir no puede romper lo que la persona está haciendo.
 */
export async function track<N extends EventName>(
  client: Client,
  userId: string,
  name: N,
  props: EventProps<N>,
): Promise<{ stored: boolean }> {
  try {
    if (!isEventName(name)) {
      return { stored: false };
    }
    const definition = EVENT_CATALOG[name];
    const parsed = definition.props.safeParse(props);
    if (!parsed.success) {
      return { stored: false };
    }

    if (!definition.technical) {
      const consent = await getConsentState(client, userId);
      if (!consent.research) {
        return { stored: false };
      }
    }

    const { data: profile } = await client
      .from("profiles")
      .select("pseudonym_id, org_code")
      .eq("id", userId)
      .maybeSingle();
    if (!profile) {
      return { stored: false };
    }

    // Sin .select(): la usuaria no puede leer la tabla de eventos.
    const { error } = await client.from("events").insert({
      pseudonym_id: profile.pseudonym_id,
      org_code: profile.org_code,
      name,
      props: parsed.data,
      technical: definition.technical,
    });
    return { stored: !error };
  } catch {
    return { stored: false };
  }
}
