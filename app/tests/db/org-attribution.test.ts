import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { adminClient } from "./helpers";

// El origen por organización (H6) lo guarda el trigger on_auth_user_created a
// partir de `user_metadata.org_code`, que llega desde /entrar?org=CODIGO.

async function orgCodeOf(metadata: Record<string, unknown> | undefined) {
  const admin = adminClient();
  const created = await admin.auth.admin.createUser({
    email: `test-${randomUUID()}@example.test`,
    password: `Aa1${randomUUID()}`,
    email_confirm: true,
    user_metadata: metadata,
  });
  expect(created.error).toBeNull();
  const { data } = await admin
    .from("profiles")
    .select("org_code")
    .eq("id", created.data.user?.id ?? "")
    .single();
  return data?.org_code;
}

describe("origen por organización", () => {
  it("guarda el código en mayúsculas cuando la organización existe", async () => {
    expect(await orgCodeOf({ org_code: "demo-local" })).toBe("DEMO-LOCAL");
    expect(await orgCodeOf({ org_code: "  DEMO-LOCAL " })).toBe("DEMO-LOCAL");
  });

  it("guarda null cuando el código no existe, viene vacío o no viene", async () => {
    expect(await orgCodeOf({ org_code: "NO-EXISTE-123" })).toBeNull();
    expect(await orgCodeOf({ org_code: "" })).toBeNull();
    expect(await orgCodeOf(undefined)).toBeNull();
  });

  it("guarda null cuando la organización está desactivada", async () => {
    const admin = adminClient();
    const code = `OFF-${randomUUID().slice(0, 8).toUpperCase()}`;
    const inserted = await admin.from("organizations").insert({
      code,
      name: "Organización desactivada",
      kind: "otro",
      active: false,
    });
    expect(inserted.error).toBeNull();
    expect(await orgCodeOf({ org_code: code })).toBeNull();
  });
});
