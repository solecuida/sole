import { expect, test } from "./fixtures";

const ASK = "Esto todavía no existe. ¿Quieres que te avisemos cuando esté?";
const THANKS = "Gracias. Tu respuesta nos ayuda a decidir qué construir.";

test("la lista de Próximamente es honesta y accesible", async ({
  page,
  newUser,
  login,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/pronto");
  await expect(
    page.getByRole("heading", { name: "Próximamente", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sole con IA", level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Invitar a un familiar", level: 2 }),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

test("«Sí, avísame» guarda una fila y lo confirma", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/pronto/ia");
  await expect(page.getByText(ASK)).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: "Sí, avísame" }).click();
  await expect(page.getByText(THANKS)).toBeVisible();

  await expect
    .poll(async () => {
      const { data } = await admin
        .from("fake_door_interest")
        .select("door_key, notify_me, choice")
        .eq("user_id", user.userId);
      return data;
    })
    .toEqual([{ door_key: "ia", notify_me: true, choice: null }]);
});

test("«No por ahora» también se registra", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/pronto/comunidad");
  await page.getByRole("button", { name: "No por ahora" }).click();
  await expect(page.getByText(THANKS)).toBeVisible();
  await expect
    .poll(async () => {
      const { data } = await admin
        .from("fake_door_interest")
        .select("door_key, notify_me")
        .eq("user_id", user.userId);
      return data;
    })
    .toEqual([{ door_key: "comunidad", notify_me: false }]);
});

test("el plan familiar muestra tres precios y guarda el elegido", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/pronto/plan-familiar");
  await expect(page.getByText(ASK)).toBeVisible();
  await expect(page.getByLabel("$2.990 al mes")).toBeVisible();
  await expect(page.getByLabel("$4.990 al mes")).toBeVisible();
  await expect(page.getByLabel("$7.990 al mes")).toBeVisible();
  await expect(
    page.getByText("Precio de prueba: hoy no se cobra nada"),
  ).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByLabel("$4.990 al mes").check();
  await page.getByRole("button", { name: "Sí, avísame" }).click();
  await expect(page.getByText(THANKS)).toBeVisible();

  await expect
    .poll(async () => {
      const { data } = await admin
        .from("fake_door_interest")
        .select("door_key, notify_me, choice")
        .eq("user_id", user.userId);
      return data;
    })
    .toEqual([{ door_key: "plan_familiar", notify_me: true, choice: "4990" }]);
});

test("una puerta que no existe responde 404", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  const response = await page.goto("/pronto/no-existe");
  expect(response?.status()).toBe(404);
});
