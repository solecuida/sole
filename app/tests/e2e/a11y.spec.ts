import type { Locator, Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { totp } from "../support/totp";
import { type E2EUser, expect, test } from "./fixtures";

// Recorre las pantallas del plan en claro y en oscuro con axe (0 violaciones).
// Una prueba por estado de usuaria, porque las páginas de bienvenida y /admin
// solo se ven con la usuaria en el estado correcto.

const SCHEMES = ["light", "dark"] as const;

const TZ = "America/Santiago";

/** Fecha local de Chile, `back` días antes de hoy. */
function chileDate(back = 0): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day") - back))
    .toISOString()
    .slice(0, 10);
}

/**
 * Abre una página y espera a que su título esté a la vista. Recién entrada, la
 * app puede seguir redirigiendo y en WebKit eso interrumpe el `goto`: se
 * reintenta hasta que la página responda.
 */
async function open(page: Page, path: string, ready: Locator) {
  await expect(async () => {
    await page.goto(path).catch(() => undefined);
    await expect(ready).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 30_000 });
}

function h1(page: Page, name: string | RegExp, exact = false): Locator {
  return page.getByRole("heading", { level: 1, name, exact });
}

/** Revisa la página abierta en claro y en oscuro. */
async function auditSchemes(
  page: Page,
  check: (page: Page) => Promise<void>,
  ready: Locator,
) {
  for (const scheme of SCHEMES) {
    await page.emulateMedia({ colorScheme: scheme });
    await expect(ready).toBeVisible();
    await check(page);
  }
  await page.emulateMedia({ colorScheme: "light" });
}

/** Una semana mínima de uso: un medicamento hecho y un día anotado. */
async function seedUse(user: E2EUser, admin: SupabaseClient) {
  await insertDone(user, admin);
  const journal = await user.client.from("journal_entries").insert({
    circle_id: user.circleId,
    author_id: user.userId,
    entry_date: chileDate(1),
    day_rating: "regular",
    moods: [],
  });
  expect(journal.error).toBeNull();
}

async function insertDone(user: E2EUser, admin: SupabaseClient) {
  const date = chileDate(1);
  const reminder = await user.client
    .from("reminders")
    .insert({
      circle_id: user.circleId,
      created_by: user.userId,
      kind: "medication",
      importance: "important",
      title: "Pastilla de la mañana",
      rule: { freq: "once", date, times: ["08:00"], startDate: date },
    })
    .select("id")
    .single();
  expect(reminder.error).toBeNull();
  const at = `${date}T12:00:00Z`;
  const inserted = await admin.from("reminder_occurrences").insert({
    reminder_id: reminder.data?.id ?? "",
    circle_id: user.circleId,
    due_at: at,
    event_at: at,
    local_date: date,
    status: "done",
    done_at: at,
    done_via: "app",
  });
  expect(inserted.error).toBeNull();
}

test("la portada y /entrar no tienen violaciones de accesibilidad, en claro y en oscuro", async ({
  page,
  expectNoAxeViolations,
}) => {
  test.setTimeout(120_000);

  await open(page, "/", h1(page, "Sole", true));
  await auditSchemes(page, expectNoAxeViolations, h1(page, "Sole", true));

  await open(page, "/entrar", h1(page, "Entrar a Sole"));
  await auditSchemes(page, expectNoAxeViolations, h1(page, "Entrar a Sole"));
});

test("sin consentimientos, /bienvenida/consentimientos cumple en claro y en oscuro", async ({
  page,
  newUser,
  login,
  expectNoAxeViolations,
}) => {
  test.setTimeout(120_000);
  const user = await newUser();
  await login(page, user);

  const title = h1(page, "Antes de empezar, tus permisos");
  await open(page, "/bienvenida/consentimientos", title);
  await auditSchemes(page, expectNoAxeViolations, title);
});

test("con consentimientos y sin círculo, /bienvenida cumple en claro y en oscuro", async ({
  page,
  newUser,
  login,
  expectNoAxeViolations,
}) => {
  test.setTimeout(120_000);
  const user = await newUser({ consents: true });
  await login(page, user);

  const title = h1(page, "Cuéntanos a quién cuidas");
  await open(page, "/bienvenida", title);
  await auditSchemes(page, expectNoAxeViolations, title);
});

test("con círculo, todas las pantallas de la app cumplen en claro y en oscuro", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  test.setTimeout(300_000);
  const user = await newUser({ circle: true, caredName: "Rosa" });
  await seedUse(user, admin);
  // Algo pendiente hoy, para que /hoy dibuje un ítem con sus botones.
  const today = chileDate(0);
  const pending = await user.client.from("reminders").insert({
    circle_id: user.circleId,
    created_by: user.userId,
    kind: "custom",
    importance: "normal",
    title: "Almuerzo",
    rule: { freq: "once", date: today, times: ["00:00"], startDate: today },
  });
  expect(pending.error).toBeNull();
  await login(page, user);

  const screens: { path: string; title: string | RegExp }[] = [
    { path: "/hoy", title: /^Hola/ },
    { path: "/recordatorios", title: "Recordatorios" },
    { path: "/recordatorios/editar", title: "Nuevo recordatorio" },
    { path: "/calendario", title: "Calendario" },
    { path: "/bitacora", title: "Bitácora" },
    { path: "/para-ti", title: "Para ti" },
    { path: "/informes", title: "Informes" },
    { path: "/cuenta", title: "Mi cuenta" },
    { path: "/avisos", title: "Avisos" },
    { path: "/pronto", title: "Próximamente" },
  ];
  for (const screen of screens) {
    const title = h1(page, screen.title);
    await open(page, screen.path, title);
    await auditSchemes(page, expectNoAxeViolations, title);
  }
});

test("/admin, con segundo factor, cumple en claro y en oscuro", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  test.setTimeout(180_000);
  const adminUser = await newUser({ consents: true });
  const { error } = await admin
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", adminUser.userId);
  expect(error).toBeNull();
  await login(page, adminUser);

  // Sin segundo factor, /admin lleva a /admin/mfa. Al entrar, la app todavía
  // puede estar redirigiendo y eso interrumpe la carga en WebKit: se reintenta.
  await expect(async () => {
    await page.goto("/admin").catch(() => undefined);
    await expect(page).toHaveURL(/\/admin\/mfa$/, { timeout: 3000 });
  }).toPass({ timeout: 20_000 });

  await page
    .getByRole("button", { name: "Configurar el segundo paso" })
    .click();
  const secretBox = page.locator("code");
  await expect(secretBox).toBeVisible();
  const secret = ((await secretBox.textContent()) ?? "").trim();
  await page.getByLabel("Código de 6 dígitos").fill(totp(secret));
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  const title = h1(page, "Métricas del piloto");
  await expect(title).toBeVisible();
  await auditSchemes(page, expectNoAxeViolations, title);
});
