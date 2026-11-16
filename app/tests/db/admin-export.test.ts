import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/admin/export/route";
import {
  FREE_LIMITS,
  usageRow,
  usageSnapshot,
  WARNING_RATIO,
} from "@/server/admin/limits";
import { grantResearch } from "@/server/consents/consents";
import { track } from "@/server/events/track";
import { totp } from "../support/totp";
import { adminClient, createTestUser, type TestUser } from "./helpers";

const admin = adminClient();
const URL_BASE = "http://localhost:3000/api/admin/export";

async function createAdminUser(mfa: boolean): Promise<TestUser> {
  const user = await createTestUser({ consents: true });
  await admin.from("profiles").update({ is_admin: true }).eq("id", user.userId);
  if (!mfa) {
    return user;
  }
  const enrolled = await user.client.auth.mfa.enroll({ factorType: "totp" });
  const verified = await user.client.auth.mfa.challengeAndVerify({
    factorId: enrolled.data?.id ?? "",
    code: totp(enrolled.data?.totp.secret ?? ""),
  });
  expect(verified.error).toBeNull();
  // El token con aal2 es el de la sesión ya verificada.
  const session = await user.client.auth.getSession();
  return { ...user, accessToken: session.data.session?.access_token ?? "" };
}

function request(user: TestUser | null, query = ""): Promise<Response> {
  return GET(
    new Request(`${URL_BASE}${query}`, {
      headers: user ? { authorization: `Bearer ${user.accessToken}` } : {},
    }),
  );
}

async function auditOf(userId: string) {
  const { data } = await admin
    .from("admin_audit_log")
    .select("action, target")
    .eq("admin_id", userId);
  return data ?? [];
}

describe("GET /api/admin/export", () => {
  it("un admin con segundo factor recibe el CSV seudónimo y queda en la auditoría", async () => {
    // Una usuaria con consentimiento de investigación genera un evento reconocible.
    const subject = await createTestUser({ consents: true });
    await grantResearch(subject.client, subject.userId);
    await track(subject.client, subject.userId, "flow.completed", {
      flow: "journal",
      duration_ms: 12_345,
    });
    const profile = await admin
      .from("profiles")
      .select("pseudonym_id")
      .eq("id", subject.userId)
      .single();
    const pseudonym = profile.data?.pseudonym_id ?? "";

    const boss = await createAdminUser(true);
    const today = new Date().toISOString().slice(0, 10);
    const response = await request(boss, `?desde=${today}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/csv; charset=utf-8",
    );
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="sole-eventos-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect(response.headers.get("cache-control")).toBe("no-store");

    const text = (await response.text()).replace(/^﻿/, "");
    const lines = text.trimEnd().split("\r\n");
    expect(lines[0]).toBe("pseudonym_id,name,props,org_code,created_at");

    const mine = lines.filter((line) => line.startsWith(pseudonym));
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatch(
      new RegExp(
        `^${pseudonym},flow\\.completed,"\\{""flow"":""journal"",""duration_ms"":12345\\}",,\\d{4}-\\d{2}-\\d{2}T`,
      ),
    );

    // Ninguna fila lleva el id ni el correo de una usuaria.
    expect(text).not.toContain(subject.userId);
    expect(text).not.toContain(subject.email);
    expect(text).not.toContain(boss.userId);
    expect(text).not.toContain("@example.test");
    for (const line of lines.slice(1)) {
      expect(line).toMatch(/^[0-9a-f-]{36},[a-z_]+\.[a-z_]+,/);
    }

    expect(await auditOf(boss.userId)).toEqual([
      { action: "export", target: `eventos desde ${today}` },
    ]);
  });

  it("sin sesión, sin ser admin o sin segundo factor responde 404 y no deja rastro", async () => {
    const common = await createTestUser({ consents: true });
    const noMfa = await createAdminUser(false);
    for (const user of [null, common, noMfa]) {
      const response = await request(user);
      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).not.toMatch(/csv/);
      expect(await response.text()).not.toContain("pseudonym_id");
    }
    expect(await auditOf(noMfa.userId)).toEqual([]);
    expect(await auditOf(common.userId)).toEqual([]);
  });

  it("una fecha mal escrita responde 422", async () => {
    const boss = await createAdminUser(true);
    expect((await request(boss, "?desde=ayer")).status).toBe(422);
  });
});

describe("límites gratuitos", () => {
  it("usageRow avisa desde el 80 %", () => {
    const limit = FREE_LIMITS.databaseMb.limit;
    expect(WARNING_RATIO).toBe(0.8);
    expect(usageRow("databaseMb", limit * 0.79).warning).toBe(false);
    expect(usageRow("databaseMb", limit * 0.8).warning).toBe(true);
    expect(usageRow("databaseMb", limit * 1.2)).toMatchObject({
      warning: true,
      ratio: 1.2,
      limit,
      unit: "MB",
    });
  });

  it("cada límite dice de dónde sale, y los del proveedor siguen marcados para verificar", () => {
    for (const limit of Object.values(FREE_LIMITS)) {
      expect(limit.limit).toBeGreaterThan(0);
      expect(limit.source.length).toBeGreaterThan(0);
      if (limit.provider) {
        expect(limit.source).toContain("[VERIFICAR]");
      }
    }
  });

  it("usageSnapshot mide la base, las usuarias activas, las suscripciones y los eventos", async () => {
    await createTestUser();
    const rows = await usageSnapshot(admin, new Date());
    expect(rows.map((row) => row.key)).toEqual([
      "databaseMb",
      "monthlyActiveUsers",
      "pushSubscriptions",
      "monthlyEvents",
    ]);
    for (const row of rows) {
      expect(row.limit).toBe(FREE_LIMITS[row.key].limit);
      expect(row.used).toBeGreaterThanOrEqual(0);
      expect(row.ratio).toBeCloseTo(row.used / row.limit, 10);
      expect(row.warning).toBe(row.ratio >= 0.8);
    }
    const byKey = Object.fromEntries(rows.map((row) => [row.key, row]));
    // La base local pesa algo y acaba de crearse una usuaria activa.
    expect(byKey.databaseMb.used).toBeGreaterThan(1);
    expect(byKey.databaseMb.unit).toBe("MB");
    expect(byKey.monthlyActiveUsers.used).toBeGreaterThanOrEqual(1);
  });

  it("solo cuenta usuarias activas en los últimos 30 días", async () => {
    const before = await usageSnapshot(admin, new Date());
    const old = await createTestUser();
    await admin
      .from("profiles")
      .update({ last_active_at: "2025-01-01T00:00:00Z" })
      .eq("id", old.userId);
    const after = await usageSnapshot(admin, new Date());
    expect(after[1].used).toBe(before[1].used);
  });

  it("una usuaria común no puede pedir el tamaño de la base", async () => {
    const user = await createTestUser();
    const { error } = await user.client.rpc("admin_db_size_bytes");
    expect(error?.code).toBe("42501");
  });
});
