/** Tipos de contacto (mismos valores que el `check` de `contacts.kind`). */
export const CONTACT_KINDS = [
  "familia",
  "medico",
  "centro_salud",
  "farmacia",
  "transporte",
  "otro",
] as const;

export type ContactKind = (typeof CONTACT_KINDS)[number];

export const CONTACT_KIND_LABELS: Record<ContactKind, string> = {
  familia: "Familia",
  medico: "Médico o médica",
  centro_salud: "Centro de salud",
  farmacia: "Farmacia",
  transporte: "Transporte",
  otro: "Otro",
};

/** Mismo patrón que el `check` de `contacts.phone`. */
export const PHONE_PATTERN = /^\+?[0-9 ()-]{6,20}$/;

export const NOTES_MAX = 300;
