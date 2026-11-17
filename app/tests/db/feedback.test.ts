import { beforeAll, describe, expect, it } from "vitest";
import { feedbackAllowed, sendFeedback } from "@/server/feedback/feedback";
import { adminClient, createTestUser, type TestUser } from "./helpers";

let user: TestUser;

beforeAll(async () => {
  user = await createTestUser({ consents: true });
});

async function rowsOf(userId: string) {
  const { data, error } = await adminClient()
    .from("feedback")
    .select("kind, message, screen")
    .eq("user_id", userId);
  expect(error).toBeNull();
  return data ?? [];
}

describe("sendFeedback", () => {
  it("guarda el mensaje con su tipo y su pantalla", async () => {
    const result = await sendFeedback(user.client, user.userId, {
      kind: "problema",
      message: "La letra se ve chica",
      screen: "/hoy",
    });
    expect(result.ok).toBe(true);
    expect(await rowsOf(user.userId)).toEqual([
      { kind: "problema", message: "La letra se ve chica", screen: "/hoy" },
    ]);
  });

  it("rechaza un mensaje vacío, muy largo o con un tipo inválido", async () => {
    const other = await createTestUser({ consents: true });
    for (const input of [
      { kind: "comentario", message: "" },
      { kind: "comentario", message: "   " },
      { kind: "comentario", message: "a".repeat(2001) },
      { kind: "otro", message: "hola" },
      { kind: "comentario", message: "hola", screen: "x".repeat(81) },
    ]) {
      const result = await sendFeedback(other.client, other.userId, input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("validation_failed");
      }
    }
    expect(await rowsOf(other.userId)).toHaveLength(0);
  });

  it("acepta justo 2000 caracteres", async () => {
    const other = await createTestUser({ consents: true });
    const result = await sendFeedback(other.client, other.userId, {
      kind: "comentario",
      message: "a".repeat(2000),
    });
    expect(result.ok).toBe(true);
  });

  it("el mensaje 11 en una hora devuelve rate_limited", async () => {
    const other = await createTestUser({ consents: true });
    for (let i = 1; i <= 10; i++) {
      const sent = await sendFeedback(other.client, other.userId, {
        kind: "comentario",
        message: `Mensaje ${i}`,
      });
      expect(sent.ok).toBe(true);
    }
    const eleventh = await sendFeedback(other.client, other.userId, {
      kind: "comentario",
      message: "Mensaje 11",
    });
    expect(eleventh.ok).toBe(false);
    if (!eleventh.ok) {
      expect(eleventh.error.code).toBe("rate_limited");
    }
    expect(await rowsOf(other.userId)).toHaveLength(10);
  });

  it("una usuaria no lee ningún comentario, ni los suyos", async () => {
    const { data, error } = await user.client.from("feedback").select("*");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe("feedbackAllowed", () => {
  it("permite comentarios a quien no tiene círculos cerrados por fallecimiento", async () => {
    expect(await feedbackAllowed(user.client)).toBe(true);
  });
});
