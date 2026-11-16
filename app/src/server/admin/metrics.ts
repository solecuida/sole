import type { SupabaseClient } from "@supabase/supabase-js";
import {
  localDay,
  type MetricFilters,
  weekIndexOf,
  weekIndexOfDay,
} from "@/lib/admin/weeks";
import { fail, ok, type Result } from "@/lib/result";
import type { Database, Json } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

// Métricas de las hipótesis H1 a H6 (F15). Se leen con la sesión del
// administrador con segundo factor: RLS le deja ver eventos seudónimos, perfiles,
// encuestas e intereses, y nada de lo que la gente escribe sobre el cuidado.
// Salen solo conteos, porcentajes y medianas.

export const FLOWS = ["onboarding", "reminder_create", "journal"] as const;
export const DOOR_KEYS = [
  "ia",
  "recetas",
  "plan_familiar",
  "comunidad",
  "fotos",
  "invitar_familiar",
] as const;
export const PRICES = ["2990", "4990", "7990"] as const;
export const D28_OPTIONS = [
  "muy_decepcionada",
  "algo_decepcionada",
  "no_importaria",
] as const;
export const RETENTION_WEEKS = [1, 4, 8] as const;

const EVENT_NAMES = [
  "app.opened",
  "flow.started",
  "flow.completed",
  "flow.abandoned",
  "app.error",
  "fake_door.viewed",
  "premium.used",
  "push.permission",
  "invitation.created",
  "cared_link.created",
];

const PAGE = 1000;
const MAX_PAGES = 100;
const DAY_MS = 86_400_000;

export interface ProfileRow {
  id: string;
  pseudonym_id: string;
  org_code: string | null;
  created_at: string;
}
export interface EventRow {
  pseudonym_id: string;
  name: string;
  props: Json;
  org_code: string | null;
  created_at: string;
}
export interface SurveyRow {
  user_id: string;
  survey_key: string;
  answers: Json;
  dismissed: boolean;
}
export interface DoorRow {
  user_id: string;
  door_key: string;
  choice: string | null;
  notify_me: boolean;
}
export interface MetricRows {
  profiles: ProfileRow[];
  events: EventRow[];
  surveys: SurveyRow[];
  doors: DoorRow[];
  /** true si había más filas de las que se leen (el panel lo avisa). */
  truncated: boolean;
}

// ---------------------------------------------------------------- lectura

async function readAll<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<{ rows: T[]; failed: boolean; truncated: boolean }> {
  const rows: T[] = [];
  for (let n = 0; n < MAX_PAGES; n++) {
    const { data, error } = await page(n * PAGE, n * PAGE + PAGE - 1);
    if (error || !data) {
      return { rows, failed: true, truncated: false };
    }
    rows.push(...data);
    if (data.length < PAGE) {
      return { rows, failed: false, truncated: false };
    }
  }
  return { rows, failed: false, truncated: true };
}

/**
 * Trae las filas con la sesión del administrador. Con otra sesión, RLS
 * devuelve cero eventos (y, de perfiles y respuestas, solo las propias).
 * Los perfiles se leen todos (id, seudónimo, organización y fecha de registro)
 * para armar las cohortes y las listas de filtros.
 */
export async function loadMetricRows(
  client: Client,
  filters: MetricFilters,
): Promise<Result<MetricRows, "internal">> {
  const [profiles, events, surveys, doors] = await Promise.all([
    readAll<ProfileRow>((from, to) =>
      client
        .from("profiles")
        .select("id, pseudonym_id, org_code, created_at")
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    ),
    readAll<EventRow>((from, to) => {
      const query = client
        .from("events")
        .select("pseudonym_id, name, props, org_code, created_at")
        .in("name", EVENT_NAMES)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });
      return (filters.org ? query.eq("org_code", filters.org) : query).range(
        from,
        to,
      );
    }),
    readAll<SurveyRow>((from, to) =>
      client
        .from("survey_responses")
        .select("user_id, survey_key, answers, dismissed")
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    ),
    readAll<DoorRow>((from, to) =>
      client
        .from("fake_door_interest")
        .select("user_id, door_key, choice, notify_me")
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    ),
  ]);
  if (profiles.failed || events.failed || surveys.failed || doors.failed) {
    return fail("internal", "No pudimos leer las métricas. Intenta de nuevo.");
  }
  return ok({
    profiles: profiles.rows,
    events: events.rows,
    surveys: surveys.rows,
    doors: doors.rows,
    truncated:
      profiles.truncated ||
      events.truncated ||
      surveys.truncated ||
      doors.truncated,
  });
}

// ---------------------------------------------------------------- cálculo (puro)

export interface RetentionPoint {
  week: number;
  /** Usuarias de cohortes que ya cumplieron esa semana. */
  eligible: number;
  retained: number;
  rate: number | null;
}
export interface FlowMetric {
  flow: string;
  started: number;
  completed: number;
  abandoned: number;
  medianMs: number | null;
  abandonRate: number | null;
}
export interface DoorMetric {
  door: string;
  viewed: number;
  interested: number;
  choices: Record<string, number>;
}
export interface OrgMetric {
  org: string | null;
  signups: number;
  active7: number;
  retention: RetentionPoint[];
}
export interface CohortMetric {
  cohort: number;
  size: number;
  retention: RetentionPoint[];
}
export interface Metrics {
  users: number;
  h1: {
    avgActiveDaysPerWeek: number | null;
    activeUsers: number;
    retention: RetentionPoint[];
    byCohort: CohortMetric[];
  };
  h2: { flows: FlowMetric[]; errorsByScreen: Record<string, number> };
  h3: {
    answered: number;
    counts: Record<string, number>;
    shares: Record<string, number>;
  };
  h4: { doors: DoorMetric[]; premiumUsed: number };
  h5: {
    invitations: number;
    caredLinks: number;
    invitationUsers: number;
    caredLinkUsers: number;
    inviteDoorInterest: number;
  };
  h6: OrgMetric[];
  push: { active7: number; withPush: number; rate: number | null };
}

export interface FilterOptions {
  orgs: string[];
  cohorts: number[];
}

function prop(props: Json, key: string): Json | undefined {
  return props && typeof props === "object" && !Array.isArray(props)
    ? props[key]
    : undefined;
}

function str(props: Json, key: string): string | null {
  const value = prop(props, key);
  return typeof value === "string" ? value : null;
}

function num(props: Json, key: string): number | null {
  const value = prop(props, key);
  return typeof value === "number" ? value : null;
}

export function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

function rate(part: number, whole: number): number | null {
  return whole === 0 ? null : part / whole;
}

function addTo<K, V>(map: Map<K, Set<V>>, key: K, value: V): void {
  const set = map.get(key);
  if (set) {
    set.add(value);
  } else {
    map.set(key, new Set([value]));
  }
}

/** Opciones de los filtros: todas las organizaciones y semanas de registro con gente. */
export function filterOptions(rows: MetricRows): FilterOptions {
  const orgs = new Set<string>();
  const cohorts = new Set<number>();
  for (const profile of rows.profiles) {
    if (profile.org_code) {
      orgs.add(profile.org_code);
    }
    cohorts.add(weekIndexOf(profile.created_at));
  }
  return {
    orgs: [...orgs].sort(),
    cohorts: [...cohorts].sort((a, b) => b - a),
  };
}

/** Acepta el valor guardado ("muy_decepcionada") o su texto ("Muy decepcionada"). */
function normalizeD28(answer: string | null): string | null {
  if (!answer) {
    return null;
  }
  const slug = answer
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/^no_me_/, "no_");
  return D28_OPTIONS.find((option) => option === slug) ?? null;
}

/** Retención: de quienes se registraron la semana N, cuántas abrieron la app N semanas después. */
function retentionOf(
  profiles: ProfileRow[],
  openedWeeks: Map<string, Set<number>>,
  now: Date,
): RetentionPoint[] {
  const currentWeek = weekIndexOfDay(localDay(now.toISOString()));
  return RETENTION_WEEKS.map((week) => {
    let eligible = 0;
    let retained = 0;
    for (const profile of profiles) {
      const joined = weekIndexOf(profile.created_at);
      if (joined + week > currentWeek) {
        continue; // esa semana todavía no llega
      }
      eligible += 1;
      if (openedWeeks.get(profile.pseudonym_id)?.has(joined + week)) {
        retained += 1;
      }
    }
    return { week, eligible, retained, rate: rate(retained, eligible) };
  });
}

/**
 * Calcula todas las métricas a partir de las filas. Pura: `now` entra por
 * parámetro. Filtros: organización (por el código del evento y del perfil) y
 * cohorte (semana de registro; deja solo a quienes se registraron esa semana).
 */
export function computeMetrics(
  rows: MetricRows,
  filters: MetricFilters,
  now: Date,
): Metrics {
  const profiles = rows.profiles.filter(
    (p) =>
      (!filters.org || p.org_code === filters.org) &&
      (filters.cohort === null || weekIndexOf(p.created_at) === filters.cohort),
  );
  const pseudonyms = new Set(profiles.map((p) => p.pseudonym_id));
  const userIds = new Set(profiles.map((p) => p.id));
  const events = rows.events.filter(
    (e) =>
      (!filters.org || e.org_code === filters.org) &&
      (filters.cohort === null || pseudonyms.has(e.pseudonym_id)),
  );
  const named = (name: string) => events.filter((e) => e.name === name);
  const distinct = (list: EventRow[]) =>
    new Set(list.map((e) => e.pseudonym_id)).size;

  // H1: días distintos con app.opened por semana y seudónimo.
  const daysByUserWeek = new Map<string, Set<string>>();
  const openedWeeks = new Map<string, Set<number>>();
  const active7 = new Set<string>();
  const sevenDaysAgo = now.getTime() - 7 * DAY_MS;
  for (const event of named("app.opened")) {
    const day = localDay(event.created_at);
    const week = weekIndexOfDay(day);
    addTo(daysByUserWeek, `${event.pseudonym_id}|${week}`, day);
    addTo(openedWeeks, event.pseudonym_id, week);
    const at = Date.parse(event.created_at);
    if (at > sevenDaysAgo && at <= now.getTime()) {
      active7.add(event.pseudonym_id);
    }
  }
  let totalDays = 0;
  for (const days of daysByUserWeek.values()) {
    totalDays += days.size;
  }
  const cohortWeeks = [
    ...new Set(profiles.map((p) => weekIndexOf(p.created_at))),
  ].sort((a, b) => b - a);

  // H2
  const flows: FlowMetric[] = FLOWS.map((flow) => {
    const ofFlow = (name: string) =>
      named(name).filter((e) => str(e.props, "flow") === flow);
    const completed = ofFlow("flow.completed");
    const started = ofFlow("flow.started").length;
    const abandoned = ofFlow("flow.abandoned").length;
    return {
      flow,
      started,
      completed: completed.length,
      abandoned,
      medianMs: median(
        completed
          .map((e) => num(e.props, "duration_ms"))
          .filter((d): d is number => d !== null),
      ),
      abandonRate: rate(abandoned, started),
    };
  });
  const errorsByScreen: Record<string, number> = {};
  for (const event of named("app.error")) {
    const screen = str(event.props, "screen") ?? "otra";
    errorsByScreen[screen] = (errorsByScreen[screen] ?? 0) + 1;
  }

  // H3: respuestas a d28 (las descartadas no cuentan).
  const counts: Record<string, number> = Object.fromEntries(
    D28_OPTIONS.map((option) => [option, 0]),
  );
  let answered = 0;
  for (const survey of rows.surveys) {
    if (
      survey.survey_key !== "d28" ||
      survey.dismissed ||
      !userIds.has(survey.user_id)
    ) {
      continue;
    }
    const answer = normalizeD28(str(survey.answers, "answer"));
    if (answer) {
      counts[answer] = (counts[answer] ?? 0) + 1;
      answered += 1;
    }
  }
  const shares: Record<string, number> = {};
  for (const option of D28_OPTIONS) {
    shares[option] = answered === 0 ? 0 : (counts[option] ?? 0) / answered;
  }

  // H4 y H5
  const doorRows = rows.doors.filter((d) => userIds.has(d.user_id));
  const doorViews = named("fake_door.viewed");
  const doors: DoorMetric[] = DOOR_KEYS.map((door) => {
    const mine = doorRows.filter((d) => d.door_key === door);
    const choices: Record<string, number> = {};
    for (const price of PRICES) {
      choices[price] = mine.filter((d) => d.choice === price).length;
    }
    return {
      door,
      viewed: doorViews.filter((e) => str(e.props, "door") === door).length,
      interested: mine.filter((d) => d.notify_me).length,
      choices,
    };
  });

  // Avisos: "activó los avisos" se mide con el permiso concedido (la tabla de
  // suscripciones es solo de cada usuaria y el panel no la puede leer).
  const granted = new Set(
    named("push.permission")
      .filter((e) => str(e.props, "result") === "granted")
      .map((e) => e.pseudonym_id),
  );
  const withPush = [...active7].filter((p) => granted.has(p)).length;

  // H6: por organización (sin filtro de organización salen todas).
  const orgKeys = [...new Set(profiles.map((p) => p.org_code))].sort((a, b) =>
    (a ?? "").localeCompare(b ?? ""),
  );
  const h6: OrgMetric[] = orgKeys.map((org) => {
    const mine = profiles.filter((p) => p.org_code === org);
    return {
      org,
      signups: mine.length,
      active7: mine.filter((p) => active7.has(p.pseudonym_id)).length,
      retention: retentionOf(mine, openedWeeks, now),
    };
  });

  return {
    users: profiles.length,
    h1: {
      avgActiveDaysPerWeek: rate(totalDays, daysByUserWeek.size),
      activeUsers: distinct(named("app.opened")),
      retention: retentionOf(profiles, openedWeeks, now),
      byCohort: cohortWeeks.map((cohort) => {
        const mine = profiles.filter(
          (p) => weekIndexOf(p.created_at) === cohort,
        );
        return {
          cohort,
          size: mine.length,
          retention: retentionOf(mine, openedWeeks, now),
        };
      }),
    },
    h2: { flows, errorsByScreen },
    h3: { answered, counts, shares },
    h4: { doors, premiumUsed: named("premium.used").length },
    h5: {
      invitations: named("invitation.created").length,
      caredLinks: named("cared_link.created").length,
      invitationUsers: distinct(named("invitation.created")),
      caredLinkUsers: distinct(named("cared_link.created")),
      inviteDoorInterest:
        doors.find((d) => d.door === "invitar_familiar")?.interested ?? 0,
    },
    h6,
    push: {
      active7: active7.size,
      withPush,
      rate: rate(withPush, active7.size),
    },
  };
}
