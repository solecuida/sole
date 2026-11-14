import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

/** Cuenta cada toque o campo llenado antes de guardar (hipótesis H2). */
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
    async check(locator: Locator) {
      count += 1;
      await locator.check();
    },
  };
}

test("registrar el día toma pocos toques, queda cifrado y se ve en la lista", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true, caredName: "Rosa" });
  await login(page, user);

  await page.goto("/bitacora");
  await expect(
    page.getByRole("heading", { level: 1, name: "Bitácora" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Aún no escribes en la bitácora. Hoy puede ser el primer día.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Puedes dictar con el micrófono del teclado"),
  ).toBeVisible();
  await expectNoAxeViolations(page);

  const group = (name: string) => page.getByRole("group", { name });
  const actions = interactionCounter();
  await actions.check(
    group("¿Cómo fue el día?").getByRole("radio", { name: "Regular" }),
  );
  await actions.check(
    group("¿Cómo estuvo Rosa?").getByRole("checkbox", {
      name: "Tranquila",
      exact: true,
    }),
  );
  await actions.check(
    group("Sueño").getByRole("radio", { name: "Poco", exact: true }),
  );
  await actions.check(
    group("Comida").getByRole("radio", { name: "Bien", exact: true }),
  );
  await actions.fill(
    page.getByLabel("Una nota (opcional)"),
    "Almorzó con ganas.",
  );
  expect(actions.count).toBeLessThanOrEqual(5);

  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Guardado.", { exact: true })).toBeVisible();

  const list = page.getByRole("region", { name: "Últimos días" });
  const item = list.getByRole("listitem");
  await expect(item).toHaveCount(1);
  await expect(item).toContainText("Día: Regular");
  await expect(item).toContainText("Ánimo: tranquila");
  await expect(item).toContainText("Sueño: Poco");
  await expect(item).toContainText("Comida: Bien");
  await expect(item).toContainText("Almorzó con ganas.");
  await expectNoAxeViolations(page);

  const { data } = await admin
    .from("journal_entries")
    .select("day_rating, moods, sleep, food, note_enc")
    .eq("circle_id", user.circleId ?? "");
  expect(data).toHaveLength(1);
  expect(data?.[0]).toMatchObject({
    day_rating: "regular",
    moods: ["tranquila"],
    sleep: "poco",
    food: "bien",
  });
  expect(data?.[0].note_enc).toMatch(/^v1\./);

  // Al volver, el formulario de hoy llega precargado y guardar no duplica.
  await page.reload();
  await expect(
    group("¿Cómo fue el día?").getByRole("radio", { name: "Regular" }),
  ).toBeChecked();
  await expect(page.getByLabel("Una nota (opcional)")).toHaveValue(
    "Almorzó con ganas.",
  );
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Guardado.", { exact: true })).toBeVisible();
  await expect(item).toHaveCount(1);
});

test("sin elegir cómo fue el día, avisa y no guarda", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/bitacora");

  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator('p[role="alert"]')).toHaveText(
    "Elige cómo fue el día.",
  );
  const { data } = await admin
    .from("journal_entries")
    .select("id")
    .eq("circle_id", user.circleId ?? "");
  expect(data).toEqual([]);
});
