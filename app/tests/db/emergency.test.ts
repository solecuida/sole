import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/v/[token]/emergencia/route";
import {
  FALLBACK_EMERGENCY_NUMBER,
  triggerEmergency,
} from "@/server/cared-link/emergency";
import { createLink, resolveLink } from "@/server/cared-link/links";
import type { PushPayload } from "@/server/push/send";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

const admin = adminClient();
const NOW = new Date();

function fakeSender() {
  const sent: { endpoint: string; payload: PushPayload }[] = [];
  return {
    sent,
    sender: async (target: { endpoint: string }, payload: PushPayload) => {
      sent.push({ endpoint: target.endpoint, payload });
      return { statusCode: 201 };
    },
  };
}

async function subscribe(userId: string): Promise<string> {
  const endpoint = `https://fcm.googleapis.com/fcm/send/${randomUUID()}`;
  const { error } = await admin.from("push_subscriptions").insert({
    user_id: userId,
    endpoint,
    p256dh: "clave-publica",
    auth: "secreto",
  });
  expect(error).toBeNull();
  return endpoint;
}

async function setup(): Promise<{
  user: TestUser;
  circleId: string;
  token: string;
  endpoints: string[];
}> {
  const user = await createTestUser({ consents: true });
  const circleId = await createCircleFor(user.client, "Marta");
  // Dos teléfonos de la cuidadora.
  const endpoints = [
    await subscribe(user.userId),
    await subscribe(user.userId),
  ];
  const created = await createLink(user.client, user.userId, circleId, "", NOW);
  if (!created.ok) {
    throw new Error("no se pudo crear el vínculo");
  }
  return { user, circleId, token: created.data.token, endpoints };
}

async function linkOf(token: string) {
  const link = await resolveLink(admin, token, NOW);
  if (!link) {
    throw new Error("el vínculo debía servir");
  }
  return link;
}

async function eventsOf(circleId: string) {
  const { data } = await admin
    .from("emergency_events")
    .select("link_id, recipients")
    .eq("circle_id", circleId);
  return data ?? [];
}

describe("triggerEmergency", () => {
  it("deja constancia, avisa a cada teléfono de quien cuida y devuelve el 131 si no hay contacto", async () => {
    const { user, circleId, token, endpoints } = await setup();
    // Un familiar con avisos y una cuidadora de OTRO círculo: no deben recibir nada.
    const family = await createTestUser({ consents: true });
    await admin.from("circle_members").insert({
      circle_id: circleId,
      user_id: family.userId,
      role: "family",
      display_name: "Pedro",
    });
    const familyEndpoint = await subscribe(family.userId);
    const stranger = await setup();

    const link = await linkOf(token);
    const mail = fakeSender();
    const result = await triggerEmergency({
      admin,
      link,
      sender: mail.sender,
      now: NOW,
    });
    expect(result).toEqual({
      ok: true,
      data: { callNumber: FALLBACK_EMERGENCY_NUMBER },
    });
    expect(FALLBACK_EMERGENCY_NUMBER).toBe("131");

    expect(mail.sent.map((entry) => entry.endpoint).sort()).toEqual(
      [...endpoints].sort(),
    );
    expect(mail.sent.map((entry) => entry.endpoint)).not.toContain(
      familyEndpoint,
    );
    for (const entry of mail.sent) {
      expect(entry.payload).toMatchObject({
        title: "Emergencia: Persona de prueba pidió ayuda",
        requireInteraction: true,
        urgent: true,
      });
    }
    expect(await eventsOf(circleId)).toEqual([
      { link_id: link.linkId, recipients: 2 },
    ]);
    expect(await eventsOf(stranger.circleId)).toEqual([]);
    expect(user.userId).not.toBe(stranger.user.userId);
  });

  it("devuelve el teléfono del contacto de emergencia cuando existe", async () => {
    const { user, circleId, token } = await setup();
    const contact = await user.client.from("contacts").insert({
      circle_id: circleId,
      name: "Hija",
      kind: "familia",
      phone: "+56 9 1234 5678",
      is_emergency: true,
    });
    expect(contact.error).toBeNull();
    const result = await triggerEmergency({
      admin,
      link: await linkOf(token),
      sender: fakeSender().sender,
      now: NOW,
    });
    expect(result).toEqual({
      ok: true,
      data: { callNumber: "+56 9 1234 5678" },
    });
  });

  it("la cuarta vez en 10 minutos responde rate_limited y no deja otra fila ni avisa", async () => {
    const { circleId, token } = await setup();
    const link = await linkOf(token);
    const mail = fakeSender();
    for (let i = 0; i < 3; i += 1) {
      const result = await triggerEmergency({
        admin,
        link,
        sender: mail.sender,
        now: NOW,
      });
      expect(result.ok).toBe(true);
    }
    const sentBefore = mail.sent.length;
    const fourth = await triggerEmergency({
      admin,
      link,
      sender: mail.sender,
      now: NOW,
    });
    expect(fourth).toMatchObject({
      ok: false,
      error: { code: "rate_limited" },
    });
    expect(await eventsOf(circleId)).toHaveLength(3);
    expect(mail.sent).toHaveLength(sentBefore);
  });

  it("si ningún aviso sale, igual responde con el número: la llamada no depende del aviso", async () => {
    const { circleId, token } = await setup();
    const result = await triggerEmergency({
      admin,
      link: await linkOf(token),
      sender: async () => ({ statusCode: 500 }),
      now: NOW,
    });
    expect(result).toEqual({ ok: true, data: { callNumber: "131" } });
    expect(await eventsOf(circleId)).toEqual([
      expect.objectContaining({ recipients: 0 }),
    ]);
  });
});

describe("POST /api/v/<token>/emergencia", () => {
  it("con un enlace desconocido responde 404 y no registra nada", async () => {
    const { circleId } = await setup();
    const token = "C".repeat(43);
    const response = await POST(
      new Request(`http://localhost:3000/api/v/${token}/emergencia`, {
        method: "POST",
      }),
      { params: Promise.resolve({ token }) },
    );
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("not_found");
    expect(await eventsOf(circleId)).toEqual([]);
  });
});
