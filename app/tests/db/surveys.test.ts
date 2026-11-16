import { describe, expect, it } from "vitest";
import {
  answerSurvey,
  dismissSurvey,
  dueSurvey,
  loadDueSurvey,
  SURVEYS,
} from "@/server/surveys/surveys";
import { adminClient, createTestUser } from "./helpers";

const DAY = 86_400_000;
const NOW = new Date("2026-11-15T12:00:00.000Z");

function registered(daysAgo: number) {
  return { createdAt: new Date(NOW.getTime() - daysAgo * DAY).toISOString() };
}

describe("dueSurvey", () => {
  it("el día 3 toca d3; el día 2 no toca nada", () => {
    expect(dueSurvey(registered(3), [], NOW)?.key).toBe("d3");
    expect(dueSurvey(registered(2), [], NOW)).toBeNull();
  });

  it("a los 30 días con d3 y d14 respondidas toca d28", () => {
    const survey = dueSurvey(registered(30), ["d3", "d14"], NOW);
    expect(survey?.key).toBe("d28");
    expect(survey?.question).toBe(
      "¿Cómo te sentirías si Sole dejara de existir?",
    );
    expect(survey?.options.map((option) => option.label)).toEqual([
      "Muy decepcionada",
      "Algo decepcionada",
      "No me importaría",
    ]);
  });

  it("ofrece la de mayor día cumplido y nada cuando ya están todas", () => {
    expect(dueSurvey(registered(60), [], NOW)?.key).toBe("d56");
    expect(dueSurvey(registered(60), ["d56"], NOW)?.key).toBe("d28");
    expect(
      dueSurvey(registered(60), ["d3", "d14", "d28", "d56"], NOW),
    ).toBeNull();
  });

  it("las preguntas de d3, d14 y d56 son las del plan", () => {
    expect(SURVEYS.d3.question).toBe("¿Qué tan fácil te resulta usar Sole?");
    expect(SURVEYS.d3.options).toHaveLength(5);
    expect(SURVEYS.d14.question).toBe("¿Sole te ayuda en tu día a día?");
    expect(SURVEYS.d56.question).toBe(
      "¿Recomendarías Sole a una organización que conozcas?",
    );
  });
});

describe("answerSurvey y dismissSurvey", () => {
  async function userRegistered(daysAgo: number) {
    const user = await createTestUser({ consents: true });
    const { error } = await adminClient()
      .from("profiles")
      .update({
        created_at: new Date(NOW.getTime() - daysAgo * DAY).toISOString(),
      })
      .eq("id", user.userId);
    expect(error).toBeNull();
    return user;
  }

  async function rows(userId: string) {
    const { data } = await adminClient()
      .from("survey_responses")
      .select("survey_key, answers, dismissed")
      .eq("user_id", userId);
    return data ?? [];
  }

  it("responder guarda una fila y la encuesta no se ofrece de nuevo", async () => {
    const user = await userRegistered(3);
    expect((await loadDueSurvey(user.client, user.userId, NOW))?.key).toBe(
      "d3",
    );

    const result = await answerSurvey(user.client, user.userId, "d3", "4");
    expect(result.ok).toBe(true);
    expect(await rows(user.userId)).toEqual([
      { survey_key: "d3", answers: { answer: "4" }, dismissed: false },
    ]);
    expect(await loadDueSurvey(user.client, user.userId, NOW)).toBeNull();
  });

  it("cerrar guarda una fila con dismissed y no vuelve a ofrecerse", async () => {
    const user = await userRegistered(3);
    const result = await dismissSurvey(user.client, user.userId, "d3");
    expect(result.ok).toBe(true);
    expect(await rows(user.userId)).toEqual([
      { survey_key: "d3", answers: {}, dismissed: true },
    ]);
    expect(await loadDueSurvey(user.client, user.userId, NOW)).toBeNull();
  });

  it("responder dos veces no duplica la fila", async () => {
    const user = await userRegistered(3);
    await answerSurvey(user.client, user.userId, "d3", "5");
    const again = await answerSurvey(user.client, user.userId, "d3", "1");
    expect(again.ok).toBe(true);
    expect(await rows(user.userId)).toHaveLength(1);
  });

  it("rechaza una encuesta o una respuesta que no existen", async () => {
    const user = await userRegistered(3);
    for (const [key, value] of [
      ["d99", "1"],
      ["d3", "9"],
      ["d28", "si"],
    ] as const) {
      const result = await answerSurvey(user.client, user.userId, key, value);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("validation_failed");
      }
    }
    expect(await rows(user.userId)).toHaveLength(0);
  });
});
