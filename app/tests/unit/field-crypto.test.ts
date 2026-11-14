import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  currentKeyVersion,
  decryptField,
  encryptField,
  FieldDecryptError,
  FieldKeyError,
  versionOf,
} from "@/lib/crypto/field";

const CONTEXT = "reminders.med_name";
const key = (version: number) =>
  `${version}:${randomBytes(32).toString("base64")}`;

let savedCurrent: string | undefined;
let savedPrevious: string | undefined;

beforeEach(() => {
  savedCurrent = process.env.FIELD_ENCRYPTION_KEY;
  savedPrevious = process.env.FIELD_ENCRYPTION_KEY_PREVIOUS;
  process.env.FIELD_ENCRYPTION_KEY = key(1);
  delete process.env.FIELD_ENCRYPTION_KEY_PREVIOUS;
});

afterEach(() => {
  for (const [name, value] of [
    ["FIELD_ENCRYPTION_KEY", savedCurrent],
    ["FIELD_ENCRYPTION_KEY_PREVIOUS", savedPrevious],
  ] as const) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

describe("encryptField / decryptField", () => {
  it("ida y vuelta devuelve el texto original, con tildes y emojis", () => {
    for (const plain of [
      "Losartán",
      "1 pastilla con comida 🌙",
      "",
      "ñ".repeat(500),
    ]) {
      const encrypted = encryptField(plain, CONTEXT);
      expect(encrypted.startsWith("v1.")).toBe(true);
      expect(decryptField(encrypted, CONTEXT)).toBe(plain);
    }
  });

  it("el resultado cumple el formato que exige la base y no contiene el texto", () => {
    const encrypted = encryptField("Losartán", CONTEXT);
    expect(encrypted).toMatch(/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/);
    expect(encrypted).not.toContain("Losart");
    expect(versionOf(encrypted)).toBe(1);
    expect(versionOf("texto plano")).toBeNull();
  });

  it("dos cifrados del mismo texto son distintos", () => {
    expect(encryptField("Losartán", CONTEXT)).not.toBe(
      encryptField("Losartán", CONTEXT),
    );
  });

  it("un carácter cambiado lanza FieldDecryptError, en cualquier posición", () => {
    const encrypted = encryptField("Losartán", CONTEXT);
    for (let i = 3; i < encrypted.length; i += 1) {
      if (encrypted[i] === ".") {
        continue;
      }
      const tampered =
        encrypted.slice(0, i) +
        (encrypted[i] === "A" ? "B" : "A") +
        encrypted.slice(i + 1);
      expect(() => decryptField(tampered, CONTEXT), `posición ${i}`).toThrow(
        FieldDecryptError,
      );
    }
  });

  it("otro contexto lanza FieldDecryptError", () => {
    const encrypted = encryptField("Losartán", CONTEXT);
    expect(() => decryptField(encrypted, "journal_entries.note")).toThrow(
      FieldDecryptError,
    );
  });

  it("un valor mal formado o de una versión desconocida lanza FieldDecryptError", () => {
    for (const value of ["", "Losartán", "v1.abc", "v1..", "v9.AAAA.BBBB"]) {
      expect(() => decryptField(value, CONTEXT), value).toThrow(
        FieldDecryptError,
      );
    }
  });

  it("el error no revela el texto ni la clave", () => {
    const encrypted = encryptField("Losartán", CONTEXT);
    try {
      decryptField(encrypted, "otro.campo");
      expect.unreachable();
    } catch (error) {
      expect((error as Error).message).toBe("No se pudo descifrar el campo");
    }
  });
});

describe("rotación de la clave", () => {
  it("con la clave en versión 2 y la anterior en PREVIOUS, descifra v1 y cifra como v2", () => {
    const oldKey = process.env.FIELD_ENCRYPTION_KEY as string;
    const old = encryptField("Losartán", CONTEXT);
    expect(old.startsWith("v1.")).toBe(true);

    process.env.FIELD_ENCRYPTION_KEY = key(2);
    process.env.FIELD_ENCRYPTION_KEY_PREVIOUS = oldKey;

    expect(currentKeyVersion()).toBe(2);
    expect(decryptField(old, CONTEXT)).toBe("Losartán");
    const fresh = encryptField("Losartán", CONTEXT);
    expect(fresh.startsWith("v2.")).toBe(true);
    expect(decryptField(fresh, CONTEXT)).toBe("Losartán");
  });

  it("sin la clave anterior, un valor v1 ya no se puede descifrar", () => {
    const old = encryptField("Losartán", CONTEXT);
    process.env.FIELD_ENCRYPTION_KEY = key(2);
    expect(() => decryptField(old, CONTEXT)).toThrow(FieldDecryptError);
  });
});

describe("clave mal configurada", () => {
  it("sin clave, o con una clave mal formada, lanza FieldKeyError sin mostrarla", () => {
    for (const bad of [
      undefined,
      "",
      "sin-version",
      "1:corta",
      `0:${randomBytes(32).toString("base64")}`,
    ]) {
      if (bad === undefined) {
        delete process.env.FIELD_ENCRYPTION_KEY;
      } else {
        process.env.FIELD_ENCRYPTION_KEY = bad;
      }
      expect(() => encryptField("x", CONTEXT), String(bad)).toThrow(
        FieldKeyError,
      );
      try {
        encryptField("x", CONTEXT);
      } catch (error) {
        if (bad) {
          expect((error as Error).message).not.toContain(bad);
        }
      }
    }
  });
});
