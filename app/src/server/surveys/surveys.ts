import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  SURVEY_DEFINITIONS,
  SURVEY_KEYS,
  type SurveyDefinition,
  type SurveyKey,
} from "@/lib/feedback/surveys";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";
import { track } from "@/server/events/track";

type Client = SupabaseClient<Database>;

const DAY = 86_400_000;

export const SURVEYS = SURVEY_DEFINITIONS;

export type SurveyErrorCode = "validation_failed" | "forbidden" | "internal";

const MESSAGES = {
  validation: "Elige una de las respuestas.",
  forbidden: "Tu sesión terminó. Vuelve a entrar para seguir.",
  internal: "No pudimos guardar tu respuesta. Prueba de nuevo.",
} as const;

/**
 * La encuesta de mayor día ya cumplido (días desde el registro) que no se haya
 * respondido ni cerrado. `answeredKeys` incluye las respondidas y las cerradas.
 */
export function dueSurvey(
  profile: { createdAt: string },
  answeredKeys: readonly string[],
  now: Date,
): SurveyDefinition | null {
  const days = Math.floor(
    (now.getTime() - new Date(profile.createdAt).getTime()) / DAY,
  );
  let due: SurveyDefinition | null = null;
  for (const key of SURVEY_KEYS) {
    const survey = SURVEYS[key];
    if (survey.day <= days && !answeredKeys.includes(key)) {
      if (!due || survey.day > due.day) {
        due = survey;
      }
    }
  }
  return due;
}

/** Lee el registro y las respuestas de la usuaria y dice qué encuesta toca (o null). */
export async function loadDueSurvey(
  client: Client,
  userId: string,
  now: Date,
): Promise<SurveyDefinition | null> {
  const [profile, responses] = await Promise.all([
    client.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
    client.from("survey_responses").select("survey_key").eq("user_id", userId),
  ]);
  if (!profile.data || responses.error) {
    return null;
  }
  return dueSurvey(
    { createdAt: profile.data.created_at },
    responses.data.map((row) => row.survey_key),
    now,
  );
}

const keySchema = z.enum(SURVEY_KEYS);

async function store(
  client: Client,
  userId: string,
  key: SurveyKey,
  answers: { answer: string } | Record<string, never>,
  dismissed: boolean,
): Promise<Result<undefined, SurveyErrorCode>> {
  const { error } = await client.from("survey_responses").insert({
    user_id: userId,
    survey_key: key,
    answers,
    dismissed,
  });
  if (error) {
    if (error.code === "23505") {
      // Ya estaba guardada: no se vuelve a ofrecer ni se cuenta dos veces.
      return ok();
    }
    return error.code === "42501"
      ? fail("forbidden", MESSAGES.forbidden)
      : fail("internal", MESSAGES.internal);
  }
  await track(client, userId, "survey.answered", { survey: key, dismissed });
  return ok();
}

/** Guarda la respuesta. `answer` debe ser una de las opciones de esa encuesta. */
export async function answerSurvey(
  client: Client,
  userId: string,
  survey: unknown,
  answer: unknown,
): Promise<Result<undefined, SurveyErrorCode>> {
  const key = keySchema.safeParse(survey);
  if (!key.success || typeof answer !== "string") {
    return fail("validation_failed", MESSAGES.validation);
  }
  if (!SURVEYS[key.data].options.some((option) => option.value === answer)) {
    return fail("validation_failed", MESSAGES.validation);
  }
  return store(client, userId, key.data, { answer }, false);
}

/** «Ahora no»: se cierra sin responder y no vuelve a aparecer. */
export async function dismissSurvey(
  client: Client,
  userId: string,
  survey: unknown,
): Promise<Result<undefined, SurveyErrorCode>> {
  const key = keySchema.safeParse(survey);
  if (!key.success) {
    return fail("validation_failed", MESSAGES.validation);
  }
  return store(client, userId, key.data, {}, true);
}
