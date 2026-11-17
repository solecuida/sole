import { expect, test } from "./fixtures";

// Marzo de 2027 empieza lunes 1; el 10 es miércoles. Fechas fijas: no dependen
// del día en que se corre la prueba.
const MARCH = "/calendario?vista=mes&fecha=2027-03-10";
const WEEK = "/calendario?vista=semana&fecha=2027-03-10";

type NewUser = Parameters<Parameters<typeof test>[2]>[0]["newUser"];
type Seeded = Awaited<ReturnType<NewUser>>;

async function seed(user: Seeded) {
  const rows = [
    {
      kind: "appointment" as const,
      title: "Control de presión",
      rule: {
        freq: "weekly",
        weekdays: [1],
        times: ["09:00"],
        startDate: "2027-01-01",
      },
    },
    {
      kind: "important_date" as const,
      title: "Cumpleaños de Ana",
      importance: "important" as const,
      rule: {
        freq: "yearly",
        month: 3,
        day: 10,
        times: ["10:00"],
        startDate: "2020-03-10",
      },
    },
  ];
  for (const row of rows) {
    const { error } = await user.client.from("reminders").insert({
      circle_id: user.circleId ?? "",
      created_by: user.userId,
      ...row,
    });
    if (error) {
      throw new Error(`recordatorio: ${error.message}`);
    }
  }
}

test("la vista de semana muestra siete días con sus ítems y Mes vuelve a la grilla", async ({
  page,
  newUser,
  login,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  await seed(user);
  await login(page, user);

  await page.goto(WEEK);
  await expect(
    page.getByRole("heading", { level: 1, name: "Calendario" }),
  ).toBeVisible();
  await expect(
    page.getByText("Del 8 de marzo al 14 de marzo de 2027"),
  ).toBeVisible();

  const week = page.getByRole("region", {
    name: "Los siete días de la semana",
  });
  await expect(week.locator(":scope > ul > li")).toHaveCount(7);
  await expect(
    week.getByRole("heading", { name: "Lunes 8 de marzo" }),
  ).toBeVisible();
  await expect(
    week.getByRole("heading", { name: "Domingo 14 de marzo" }),
  ).toBeVisible();
  await expect(week.getByText("Control de presión")).toHaveCount(1);
  await expect(week.getByText("Cumpleaños de Ana")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Semana", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Mes", exact: true }).click();
  await expect(page).toHaveURL(/vista=mes/);
  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(table.getByRole("columnheader")).toHaveCount(7);
  await expect(
    page.getByRole("link", { name: "Mes", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("la vista de mes pone lo semanal en cada lunes y navega entre meses", async ({
  page,
  newUser,
  login,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  await seed(user);
  await login(page, user);

  await page.goto(MARCH);
  await expect(page.getByText("marzo de 2027").first()).toBeVisible();
  const table = page.getByRole("table");
  await expect(table.getByRole("row")).toHaveCount(6); // encabezado + 5 semanas
  await expect(table.getByText("Hay algo importante")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Lunes 29 de marzo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Martes 30 de marzo" }),
  ).toHaveCount(0);
  await expectNoAxeViolations(page);

  await page.getByRole("link", { name: "Siguiente", exact: true }).click();
  await expect(page.getByText("abril de 2027").first()).toBeVisible();
  await page.getByRole("link", { name: "Anterior", exact: true }).click();
  await expect(page.getByText("marzo de 2027").first()).toBeVisible();
  await page
    .getByRole("navigation", { name: "Moverse en el calendario" })
    .getByRole("link", { name: "Hoy", exact: true })
    .click();
  await expect(page).toHaveURL(/vista=mes/);
});

test("Agregar en un día abre el formulario con esa fecha", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);

  await page.goto(MARCH);
  await page
    .getByRole("table")
    .getByRole("link", { name: "Agregar el 10 de marzo", exact: true })
    .click();
  await expect(page).toHaveURL(/\/recordatorios\/editar\?.*fecha=2027-03-10/);

  await page.goto(WEEK);
  await page
    .getByRole("link", { name: "Agregar el 12 de marzo", exact: true })
    .click();
  await expect(page).toHaveURL(/\/recordatorios\/editar\?.*fecha=2027-03-12/);
});

test("a 320 px de ancho no hay scroll horizontal", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true });
  await seed(user);
  await login(page, user);
  await page.setViewportSize({ width: 320, height: 700 });

  for (const url of [MARCH, WEEK]) {
    await page.goto(url);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  }
});
