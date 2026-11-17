import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Cifrado de campos sensibles (notas de la bitácora, nombre e indicación de
// medicamentos, notas de contactos) con AES-256-GCM. La clave vive solo en el
// servidor y nunca entra a la base: ahí queda `v<versión>.<iv>.<cifrado+tag>`.
//
// Sin dependencias del framework: también lo usa scripts/rotate-field-key.ts.
// Por eso lee process.env directamente en vez de pasar por src/lib/env.ts.
//
//   FIELD_ENCRYPTION_KEY           <versión>:<32 bytes en base64>   (la vigente)
//   FIELD_ENCRYPTION_KEY_PREVIOUS  igual, opcional                  (solo al rotar)

const IV_BYTES = 12;
const TAG_BYTES = 16;

/** El texto no se pudo descifrar: alterado, de otro campo o sin su clave. */
export class FieldDecryptError extends Error {
  constructor() {
    // Sin detalles: el mensaje no debe revelar por qué falló.
    super("No se pudo descifrar el campo");
    this.name = "FieldDecryptError";
  }
}

/** Falta la clave de cifrado o está mal formada. El mensaje nunca incluye la clave. */
export class FieldKeyError extends Error {
  constructor(name: string) {
    super(`${name} falta o no tiene la forma <versión>:<32 bytes en base64>`);
    this.name = "FieldKeyError";
  }
}

interface Key {
  version: number;
  bytes: Buffer;
}

function parseKey(name: string, required: boolean): Key | null {
  const raw = process.env[name];
  if (!raw) {
    if (required) {
      throw new FieldKeyError(name);
    }
    return null;
  }
  const match = /^([1-9][0-9]{0,5}):([A-Za-z0-9+/]{43}=)$/.exec(raw);
  const bytes = match ? Buffer.from(match[2], "base64") : null;
  if (!match || bytes?.length !== 32) {
    throw new FieldKeyError(name);
  }
  return { version: Number(match[1]), bytes };
}

function currentKey(): Key {
  return parseKey("FIELD_ENCRYPTION_KEY", true) as Key;
}

function keyForVersion(version: number): Key | null {
  return (
    [currentKey(), parseKey("FIELD_ENCRYPTION_KEY_PREVIOUS", false)].find(
      (key) => key?.version === version,
    ) ?? null
  );
}

/** Versión de la clave vigente (la que usan los valores nuevos). */
export function currentKeyVersion(): number {
  return currentKey().version;
}

/** Versión de la clave con que se cifró un valor, o null si no tiene el formato. */
export function versionOf(value: string): number | null {
  const match = /^v([0-9]+)\./.exec(value);
  return match ? Number(match[1]) : null;
}

/**
 * Cifra un texto. `context` nombra el campo ("reminders.med_name") y queda atado
 * al resultado: un valor copiado a otro campo no se puede descifrar.
 */
export function encryptField(plain: string, context: string): string {
  const key = currentKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key.bytes, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return `v${key.version}.${iv.toString("base64url")}.${encrypted.toString("base64url")}`;
}

/** Descifra un valor de `encryptField`. Cualquier alteración lanza `FieldDecryptError`. */
export function decryptField(value: string, context: string): string {
  const match = /^v([1-9][0-9]*)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(
    value,
  );
  if (!match) {
    throw new FieldDecryptError();
  }
  const key = keyForVersion(Number(match[1]));
  const iv = Buffer.from(match[2], "base64url");
  const payload = Buffer.from(match[3], "base64url");
  if (
    !key ||
    iv.length !== IV_BYTES ||
    payload.length < TAG_BYTES ||
    // Solo se acepta la forma exacta que produce encryptField: un carácter
    // cambiado que decodifique a los mismos bytes también se rechaza.
    iv.toString("base64url") !== match[2] ||
    payload.toString("base64url") !== match[3]
  ) {
    throw new FieldDecryptError();
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", key.bytes, iv, {
      authTagLength: TAG_BYTES,
    });
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(payload.subarray(payload.length - TAG_BYTES));
    return Buffer.concat([
      decipher.update(payload.subarray(0, payload.length - TAG_BYTES)),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new FieldDecryptError();
  }
}
