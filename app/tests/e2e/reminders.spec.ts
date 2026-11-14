import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const alert = 'p[role="alert"]';

/** Cuenta cada vez que la persona toca o llena un campo (hipótesis H2). */
function interactionCounter() {
  let count = 0;
  return {
    get count() {
      return count;
    },
    async fill(locator: Locator, value: string) {
      count += 1;
      await locator.fill(value);
    },
    async select(locator: Locator, value: string) {
      count += 1;
      await locator.selectOption(value);
    },
    async check(locator: Locator) {
      count += 1;
      await locator.check();
    },
  };
}

async function remindersOf(
  admin: Parameters<Parameters<typeof test>[2]>[0]["admin"],
  circleId: string | null,
) {
  const { data } = await admin
    .from("reminders")
    .select("title, kind, importance, rule, med_name_enc, active, advance_days")
    .eq("circle_id", circleId ?? "");
  return data ?? [];
}

async function openNew(page: Page) {
  await page.goto("/recordatorios");
  await page.getByRole("link", { name: "Nuevo recordatorio" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Nuevo recordatorio" }),
  ).toBeVisible();
}

test("crear un medicamento diario toma pocas interacciones y aparece en la lista", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);

  await page.goto("/recordatorios");
  await expect(
    page.getByText("Todavía no hay recordatorios. Crea el primero."),
  ).toBeVisible();
  await expectNoAxeViolations(page);

  await openNew(page);
  await expectNoAxeViolations(page);

  const actions = interactionCounter();
  await actions.select(page.getByLabel("¿Qué es?"), "medication");
  await actions.fill(page.getByLabel("Título"), "Medicamento de la mañana");
  await actions.fill(page.getByLabel("Nombre del medicamento"), "Losartán");
  await actions.check(page.getByRole("radio", { name: "Importante" }));
  await actions.fill(page.getByLabel("Hora", { exact: true }), "08:00");
  expect(actions.count).toBeLessThanOrEqual(8);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();

  await expect(page).toHaveURL(/\/recordatorios\?c=/);
  const item = page.getByRole("listitem").filter({
    hasText: "Medicamento de la mañana",
  });
  await expect(item).toContainText("Todos los días a las 08:00");
  await expect(item).toContainText("Importante");
  await expect(item).toContainText("Losartán");
  await expect(
    page.getByRole("heading", { level: 2, name: "Medicamentos" }),
  ).toBeVisible();
  await expectNoAxeViolations(page);

  const stored = await remindersOf(admin, user.circleId);
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({
    title: "Medicamento de la mañana",
    kind: "medication",
    importance: "important",
    active: true,
  });
  expect(stored[0].rule).toMatchObject({ freq: "daily", times: ["08:00"] });
  expect(stored[0].med_name_enc).toMatch(/^v1\./);
});

test("sin hora, avisa «Agrega al menos una hora.» y no crea nada", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await openNew(page);
  await page.getByLabel("Título").fill("Sin hora");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();

  await expect(page.locator(alert)).toHaveText("Agrega al menos una hora.");
  await expect(page).toHaveURL(/\/recordatorios\/editar/);
  expect(await remindersOf(admin, user.circleId)).toEqual([]);
});

test("sin título, avisa junto al campo", async ({ page, newUser, login }) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await openNew(page);
  await page.getByLabel("Hora", { exact: true }).fill("08:00");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator(alert)).toHaveText("Escribe un título.");
  await expect(page.getByLabel("Título")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});

test("?fecha= precarga la fecha de inicio", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/recordatorios/editar?fecha=2027-03-10");
  await expect(page.getByLabel("Desde qué día")).toHaveValue("2027-03-10");
});

test("un control semanal guarda sus días y sus avisos previos", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await openNew(page);
  await page.getByLabel("¿Qué es?").selectOption("appointment");
  await page.getByLabel("Título").fill("Sesión de terapia");
  await page.getByLabel("¿Cada cuánto?").selectOption("weekly");
  await page.getByRole("checkbox", { name: "Martes" }).check();
  await page.getByRole("checkbox", { name: "Jueves" }).check();
  await page.getByLabel("Hora", { exact: true }).fill("11:00");
  await page.getByRole("checkbox", { name: "3 días antes" }).uncheck();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();

  await expect(page).toHaveURL(/\/recordatorios\?c=/);
  await expect(
    page.getByRole("listitem").filter({ hasText: "Sesión de terapia" }),
  ).toContainText("Martes y jueves a las 11:00");

  const stored = await remindersOf(admin, user.circleId);
  expect(stored[0].rule).toMatchObject({ freq: "weekly", weekdays: [2, 4] });
  expect(stored[0].advance_days).toEqual([1, 0]);
});

test("editar cambia el recordatorio y quitarlo lo saca de la lista", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true });
  await user.client.from("reminders").insert({
    circle_id: user.circleId,
    created_by: user.userId,
    kind: "activity",
    title: "Caminata",
    rule: { freq: "daily", times: ["17:00"], startDate: "2026-11-14" },
  });
  await login(page, user);
  await page.goto("/recordatorios");
  await page.getByRole("link", { name: "Editar Caminata" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Editar recordatorio" }),
  ).toBeVisible();
  await expect(page.getByLabel("Título")).toHaveValue("Caminata");
  await expect(page.getByLabel("Hora", { exact: true })).toHaveValue("17:00");

  await page.getByLabel("Título").fill("Caminata corta");
  await page.getByRole("button", { name: "Agregar otra hora" }).click();
  await page.getByLabel("Hora 2", { exact: true }).fill("10:30");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();

  await expect(page).toHaveURL(/\/recordatorios\?c=/);
  await expect(
    page.getByRole("listitem").filter({ hasText: "Caminata corta" }),
  ).toContainText("Todos los días a las 10:30 y 17:00");

  await page.getByRole("link", { name: "Editar Caminata corta" }).click();
  await page.getByRole("button", { name: "Quitar este recordatorio" }).click();
  await expect(page).toHaveURL(/\/recordatorios\?c=/);
  await expect(
    page.getByText("Todavía no hay recordatorios. Crea el primero."),
  ).toBeVisible();

  const stored = await remindersOf(admin, user.circleId);
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({ title: "Caminata corta", active: false });
});
