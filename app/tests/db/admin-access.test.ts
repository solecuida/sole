import { describe, expect, it } from "vitest";
import { logAdminAccess, requireAdmin } from "@/server/admin/guard";
import { totp } from "../support/totp";
import { adminClient, createTestUser, type TestUser } from "./helpers";

const admin = adminClient();

/** Usuaria con `is_admin = true`, puesto como lo haría el fundador: por SQL con la clave de servicio. */
async function createAdminUser(): Promise<TestUser> {
  const user = await createTestUser({ consents: true });
  const { error } = await admin
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", user.userId);
  expect(error).toBeNull();
  return user;
}

/** Inscribe un segundo factor y lo verifica: la sesión del cliente pasa a aal2. */
async function completeMfa(user: TestUser): Promise<void> {
  const enrolled = await user.client.auth.mfa.enroll({ factorType: "totp" });
  expect(enrolled.error).toBeNull();
  const factorId = enrolled.data?.id ?? "";
  const secret = enrolled.data?.totp.secret ?? "";
  const verified = await user.client.auth.mfa.challengeAndVerify({
    factorId,
    code: totp(secret),
  });
  expect(verified.error).toBeNull();
}

const TIP = {
  kind: "consejo",
  text: "Consejo de prueba del panel (se borra al terminar).",
};

describe("totp (RFC 6238)", () => {
  it("coincide con los vectores de prueba del estándar para SHA-1", () => {
    // Secreto "12345678901234567890" en base32; el RFC da 8 dígitos, aquí los últimos 6.
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(totp(secret, 59_000)).toBe("287082");
    expect(totp(secret, 1_111_111_109_000)).toBe("081804");
    expect(totp(secret, 1_234_567_890_000)).toBe("005924");
    expect(totp(secret, 20_000_000_000_000)).toBe("353130");
  });
});

describe("requireAdmin", () => {
  it("una usuaria común no es admin, tampoco con segundo factor", async () => {
    const user = await createTestUser({ consents: true });
    expect(await requireAdmin(user.client)).toEqual({
      ok: false,
      reason: "not_admin",
    });
    await completeMfa(user);
    expect(await requireAdmin(user.client)).toEqual({
      ok: false,
      reason: "not_admin",
    });
    const { error } = await user.client.from("tips").insert(TIP);
    expect(error?.code).toBe("42501");
  });

  it("admin sin segundo factor: mfa_required, y la base rechaza escribir contenido", async () => {
    const user = await createAdminUser();
    expect(await requireAdmin(user.client)).toEqual({
      ok: false,
      reason: "mfa_required",
    });
    const insert = await user.client.from("tips").insert(TIP);
    expect(insert.error?.code).toBe("42501");
    // Tampoco puede leer lo reservado al panel.
    const events = await user.client.from("events").select("id").limit(1);
    expect(events.data).toEqual([]);
    const feedback = await user.client.from("feedback").select("id").limit(1);
    expect(feedback.data ?? []).toEqual([]);
  });

  it("admin con segundo factor verificado: sesión aal2, requireAdmin ok y puede escribir contenido", async () => {
    const user = await createAdminUser();
    await completeMfa(user);

    const level = await user.client.auth.mfa.getAuthenticatorAssuranceLevel();
    expect(level.data?.currentLevel).toBe("aal2");
    expect(await requireAdmin(user.client)).toEqual({
      ok: true,
      userId: user.userId,
    });

    const inserted = await user.client
      .from("tips")
      .insert(TIP)
      .select("id")
      .single();
    expect(inserted.error).toBeNull();
    // Se borra para no alterar el contenido que revisan otras pruebas.
    const removed = await user.client
      .from("tips")
      .delete()
      .eq("id", inserted.data?.id ?? "");
    expect(removed.error).toBeNull();
  });

  it("un código equivocado no sube la sesión a aal2", async () => {
    const user = await createAdminUser();
    const enrolled = await user.client.auth.mfa.enroll({ factorType: "totp" });
    const right = totp(enrolled.data?.totp.secret ?? "");
    const wrong = right === "000000" ? "111111" : "000000";
    const verified = await user.client.auth.mfa.challengeAndVerify({
      factorId: enrolled.data?.id ?? "",
      code: wrong,
    });
    expect(verified.error).not.toBeNull();
    expect(await requireAdmin(user.client)).toEqual({
      ok: false,
      reason: "mfa_required",
    });
  });

  it("sin sesión responde not_admin", async () => {
    const { anonClient } = await import("./helpers");
    expect(await requireAdmin(anonClient())).toEqual({
      ok: false,
      reason: "not_admin",
    });
  });
});

describe("el panel no puede leer datos de cuidado", () => {
  it("un admin con aal2 no ve círculos, bitácoras ni bienestar ajenos", async () => {
    const caregiver = await createTestUser({ consents: true });
    const { createCircleFor } = await import("./helpers");
    const circleId = await createCircleFor(caregiver.client, "Marta");
    await caregiver.client.from("journal_entries").insert({
      circle_id: circleId,
      author_id: caregiver.userId,
      entry_date: "2026-11-14",
      day_rating: "bueno",
    });
    await caregiver.client.from("selfcare_checkins").insert({
      user_id: caregiver.userId,
      checkin_date: "2026-11-14",
      score: 3,
    });

    const boss = await createAdminUser();
    await completeMfa(boss);
    for (const table of [
      "circles",
      "reminders",
      "journal_entries",
      "selfcare_checkins",
      "contacts",
      "tasks",
    ] as const) {
      const { data, error } = await boss.client.from(table).select("*");
      expect(error, table).toBeNull();
      expect(data, table).toEqual([]);
    }
  });
});

describe("logAdminAccess", () => {
  it("con sesión aal2 agrega una fila con el id del admin y la acción", async () => {
    const user = await createAdminUser();
    await completeMfa(user);
    expect(await logAdminAccess(user.client, "ver", "/admin")).toBe(true);
    const { data } = await admin
      .from("admin_audit_log")
      .select("admin_id, action, target")
      .eq("admin_id", user.userId);
    expect(data).toEqual([
      { admin_id: user.userId, action: "ver", target: "/admin" },
    ]);
  });

  it("sin aal2, o sin ser admin, no puede escribir en la auditoría", async () => {
    const noMfa = await createAdminUser();
    expect(await logAdminAccess(noMfa.client, "ver", "/admin")).toBe(false);
    const common = await createTestUser({ consents: true });
    expect(await logAdminAccess(common.client, "ver", "/admin")).toBe(false);
    const { data } = await admin
      .from("admin_audit_log")
      .select("id")
      .in("admin_id", [noMfa.userId, common.userId]);
    expect(data).toEqual([]);
  });

  it("nadie puede registrar un acceso a nombre de otro admin", async () => {
    const a = await createAdminUser();
    const b = await createAdminUser();
    await completeMfa(a);
    const { error } = await a.client.from("admin_audit_log").insert({
      admin_id: b.userId,
      action: "ver",
      target: "/admin",
    });
    expect(error?.code).toBe("42501");
  });
});

describe("nadie se hace admin solo", () => {
  it("ninguna usuaria puede cambiar su propio is_admin (42501), ni siendo ya admin con aal2", async () => {
    const common = await createTestUser({ consents: true });
    const boss = await createAdminUser();
    await completeMfa(boss);
    for (const user of [common, boss]) {
      const { error } = await user.client
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", user.userId);
      expect(error?.code).toBe("42501");
    }
    const other = await boss.client
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", common.userId);
    expect(other.error?.code).toBe("42501");
    const check = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", common.userId)
      .single();
    expect(check.data?.is_admin).toBe(false);
  });
});
