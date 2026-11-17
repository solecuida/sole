import { describe, expect, it } from "vitest";
import { recordConsents } from "@/server/consents/consents";
import type { EventName, EventProps } from "@/server/events/catalog";
import { track } from "@/server/events/track";
import { adminClient, createTestUser, type TestUser } from "./helpers";

async function userWithResearch(research: boolean): Promise<TestUser> {
  const user = await createTestUser();
  const result = await recordConsents(user.client, user.userId, {
    terms: true,
    sensitive: true,
    research,
    ageConfirmed: true,
    authorizationDeclared: true,
  });
  expect(result.ok).toBe(true);
  return user;
}

async function pseudonymOf(userId: string) {
  const { data } = await adminClient()
    .from("profiles")
    .select("pseudonym_id, org_code")
    .eq("id", userId)
    .single();
  if (!data) {
    throw new Error("perfil no encontrado");
  }
  return data;
}

async function eventsOf(pseudonymId: string) {
  const { data } = await adminClient()
    .from("events")
    .select("*")
    .eq("pseudonym_id", pseudonymId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

describe("track y el consentimiento de investigación", () => {
  it("sin consentimiento no guarda un evento no técnico", async () => {
    const user = await userWithResearch(false);
    const result = await track(user.client, user.userId, "app.opened", {
      screen: "hoy",
    });
    expect(result).toEqual({ stored: false });
    const { pseudonym_id } = await pseudonymOf(user.userId);
    expect(await eventsOf(pseudonym_id)).toEqual([]);
  });

  it("sin consentimiento sí guarda el evento técnico app.error", async () => {
    const user = await userWithResearch(false);
    const result = await track(user.client, user.userId, "app.error", {
      code: "internal",
      screen: "hoy",
    });
    expect(result).toEqual({ stored: true });
    const { pseudonym_id } = await pseudonymOf(user.userId);
    const events = await eventsOf(pseudonym_id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      name: "app.error",
      technical: true,
      props: { code: "internal", screen: "hoy" },
    });
  });

  it("con consentimiento guarda el evento no técnico", async () => {
    const user = await userWithResearch(true);
    const result = await track(user.client, user.userId, "flow.completed", {
      flow: "journal",
      duration_ms: 8200,
    });
    expect(result).toEqual({ stored: true });
    const { pseudonym_id } = await pseudonymOf(user.userId);
    const events = await eventsOf(pseudonym_id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      name: "flow.completed",
      technical: false,
      props: { flow: "journal", duration_ms: 8200 },
    });
  });
});

describe("track guarda seudónimo y origen, nunca identidad", () => {
  it("escribe pseudonym_id y org_code del perfil y ninguna columna con el id o el correo", async () => {
    const user = await userWithResearch(true);
    const admin = adminClient();
    await admin
      .from("profiles")
      .update({ org_code: "DEMO-LOCAL" })
      .eq("id", user.userId);
    const profile = await pseudonymOf(user.userId);
    expect(profile.org_code).toBe("DEMO-LOCAL");
    expect(profile.pseudonym_id).not.toBe(user.userId);

    await track(user.client, user.userId, "app.opened", { screen: "hoy" });

    const events = await eventsOf(profile.pseudonym_id);
    expect(events).toHaveLength(1);
    const event = events[0];
    expect(event.pseudonym_id).toBe(profile.pseudonym_id);
    expect(event.org_code).toBe("DEMO-LOCAL");
    expect(Object.keys(event).sort()).toEqual([
      "created_at",
      "id",
      "name",
      "org_code",
      "props",
      "pseudonym_id",
      "technical",
    ]);
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain(user.userId);
    expect(serialized).not.toContain(user.email);
  });
});

describe("track nunca guarda algo fuera del catálogo ni lanza", () => {
  it("rechaza propiedades con texto libre o claves extra", async () => {
    const user = await userWithResearch(true);
    const { pseudonym_id } = await pseudonymOf(user.userId);

    const extraKey = await track(user.client, user.userId, "app.opened", {
      screen: "hoy",
      nota: "se llama Rosa",
    } as unknown as EventProps<"app.opened">);
    const freeText = await track(user.client, user.userId, "app.opened", {
      screen: "mi mamá Rosa",
    } as unknown as EventProps<"app.opened">);
    const unknownName = await track(
      user.client,
      user.userId,
      "no.existe" as EventName,
      {} as never,
    );

    expect(extraKey).toEqual({ stored: false });
    expect(freeText).toEqual({ stored: false });
    expect(unknownName).toEqual({ stored: false });
    expect(await eventsOf(pseudonym_id)).toEqual([]);
  });

  it("si la usuaria no existe devuelve stored:false sin lanzar", async () => {
    const user = await userWithResearch(true);
    const result = await track(
      user.client,
      "00000000-0000-4000-8000-000000000000",
      "app.error",
      { code: "internal", screen: "hoy" },
    );
    expect(result).toEqual({ stored: false });
  });
});
