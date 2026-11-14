import { describe, expect, it } from "vitest";
import {
  getSessionProfile,
  hasAnyCircle,
  touchLastActive,
} from "@/server/auth/session";
import {
  CONSENT_VERSION,
  getConsentState,
  grantResearch,
  hasRequiredConsents,
  recordConsents,
  revokeResearch,
} from "@/server/consents/consents";
import { adminClient, createCircleFor, createTestUser } from "./helpers";

const ACCEPTED = {
  terms: true,
  sensitive: true,
  research: false,
  ageConfirmed: true,
  authorizationDeclared: true,
};

async function rowsOf(userId: string) {
  const { data } = await adminClient()
    .from("consents")
    .select("id, layer, version, granted, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

describe("recordConsents", () => {
  it("guarda una fila por capa con la versión vigente", async () => {
    const user = await createTestUser();
    expect(await getConsentState(user.client, user.userId)).toEqual({
      terms: false,
      sensitive: false,
      research: false,
    });

    const result = await recordConsents(user.client, user.userId, ACCEPTED);
    expect(result.ok).toBe(true);

    const rows = await rowsOf(user.userId);
    expect(
      rows.map((row) => [row.layer, row.version, row.granted]).sort(),
    ).toEqual([
      ["research", CONSENT_VERSION, false],
      ["sensitive", CONSENT_VERSION, true],
      ["terms", CONSENT_VERSION, true],
    ]);
    expect(CONSENT_VERSION).toBe("2026-11-14");

    const state = await getConsentState(user.client, user.userId);
    expect(state).toEqual({ terms: true, sensitive: true, research: false });
    expect(hasRequiredConsents(state)).toBe(true);
  });

  it("registra la investigación cuando se acepta", async () => {
    const user = await createTestUser();
    await recordConsents(user.client, user.userId, {
      ...ACCEPTED,
      research: true,
    });
    expect(await getConsentState(user.client, user.userId)).toEqual({
      terms: true,
      sensitive: true,
      research: true,
    });
  });

  for (const missing of [
    "ageConfirmed",
    "authorizationDeclared",
    "terms",
    "sensitive",
  ] as const) {
    it(`sin ${missing} responde validation_failed y no guarda nada`, async () => {
      const user = await createTestUser();
      const result = await recordConsents(user.client, user.userId, {
        ...ACCEPTED,
        [missing]: false,
      });
      expect(result).toMatchObject({
        ok: false,
        error: { code: "validation_failed" },
      });
      expect(await rowsOf(user.userId)).toEqual([]);
    });
  }

  it("no deja guardar consentimientos a nombre de otra persona", async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    const result = await recordConsents(user.client, other.userId, ACCEPTED);
    expect(result).toMatchObject({ ok: false, error: { code: "internal" } });
    expect(await rowsOf(other.userId)).toEqual([]);
  });
});

describe("create_circle exige los consentimientos", () => {
  it("sin consentimientos, la RPC responde consent_required", async () => {
    const user = await createTestUser();
    const { data, error } = await user.client.rpc("create_circle", {
      p_cared_name: "Persona de prueba",
      p_relation: "mi mamá",
      p_care_type: "adulto_mayor",
      p_display_name: "Prueba",
    });
    expect(data).toBeNull();
    expect(error?.message).toBe("consent_required");
    expect(await hasAnyCircle(user.client)).toBe(false);
  });

  it("con consentimientos, sí crea el círculo", async () => {
    const user = await createTestUser();
    await recordConsents(user.client, user.userId, ACCEPTED);
    await createCircleFor(user.client, "Prueba");
    expect(await hasAnyCircle(user.client)).toBe(true);
  });
});

describe("revokeResearch", () => {
  it("agrega una fila granted=false y deja intactas las anteriores", async () => {
    const user = await createTestUser();
    await recordConsents(user.client, user.userId, {
      ...ACCEPTED,
      research: true,
    });
    const before = await rowsOf(user.userId);

    const result = await revokeResearch(user.client, user.userId);
    expect(result.ok).toBe(true);

    const after = await rowsOf(user.userId);
    expect(after).toHaveLength(before.length + 1);
    expect(after.slice(0, before.length)).toEqual(before);
    expect(after.at(-1)).toMatchObject({ layer: "research", granted: false });

    const state = await getConsentState(user.client, user.userId);
    expect(state).toEqual({ terms: true, sensitive: true, research: false });
    expect(hasRequiredConsents(state)).toBe(true);
  });

  it("se puede volver a aceptar después", async () => {
    const user = await createTestUser();
    await recordConsents(user.client, user.userId, ACCEPTED);
    await revokeResearch(user.client, user.userId);
    await grantResearch(user.client, user.userId);
    expect((await getConsentState(user.client, user.userId)).research).toBe(
      true,
    );
  });
});

describe("actividad de la sesión", () => {
  it("touchLastActive anota como máximo una vez por día", async () => {
    const user = await createTestUser();
    const profile = await getSessionProfile(user.client, user.userId);
    expect(profile).not.toBeNull();
    const today = new Date(profile?.lastActiveAt ?? "");

    expect(
      await touchLastActive(
        user.client,
        user.userId,
        profile?.lastActiveAt ?? "",
        today,
      ),
    ).toBe(false);

    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    expect(
      await touchLastActive(
        user.client,
        user.userId,
        profile?.lastActiveAt ?? "",
        tomorrow,
      ),
    ).toBe(true);
    const updated = await getSessionProfile(user.client, user.userId);
    expect(new Date(updated?.lastActiveAt ?? "").toISOString()).toBe(
      tomorrow.toISOString(),
    );
  });
});
