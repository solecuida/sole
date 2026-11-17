import { describe, expect, it } from "vitest";
import {
  adminClient,
  anonClient,
  createCircleFor,
  createTestUser,
} from "./helpers";

describe("conexión con Supabase local", () => {
  it("el cliente admin lee la organización DEMO-LOCAL", async () => {
    const { data, error } = await adminClient()
      .from("organizations")
      .select("code, name")
      .eq("code", "DEMO-LOCAL")
      .single();
    expect(error).toBeNull();
    expect(data?.code).toBe("DEMO-LOCAL");
  });

  it("un cliente anónimo no puede leer profiles (42501, sin filas)", async () => {
    const { data, error } = await anonClient().from("profiles").select("id");
    expect(error?.code).toBe("42501");
    expect(data).toBeNull();
  });

  it("createTestUser deja un perfil creado por el trigger on_auth_user_created", async () => {
    const user = await createTestUser();
    const { data, error } = await adminClient()
      .from("profiles")
      .select("id, is_admin, timezone")
      .eq("id", user.userId)
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBe(user.userId);
    expect(data?.is_admin).toBe(false);
    expect(data?.timezone).toBe("America/Santiago");
  });

  it("una usuaria con consentimientos crea su círculo y queda como cuidadora", async () => {
    const user = await createTestUser({ consents: true });
    const circleId = await createCircleFor(user.client, "Prueba");
    const { data, error } = await user.client
      .from("circle_members")
      .select("role")
      .eq("circle_id", circleId)
      .eq("user_id", user.userId)
      .single();
    expect(error).toBeNull();
    expect(data?.role).toBe("caregiver");
  });
});
