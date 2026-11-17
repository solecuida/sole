import { expect, test } from "./fixtures";

const alert = 'p[role="alert"]';

test("sin consentimientos, la app lleva a los permisos y nada viene marcado", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser();
  await login(page, user);
  await expect(page).toHaveURL(/\/bienvenida\/consentimientos$/);

  // Las demás pantallas de la app se suman a esta lista cuando se construyan.
  for (const route of ["/hoy", "/hoy?bienvenida=1"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/bienvenida\/consentimientos$/);
  }

  const boxes = page.getByRole("checkbox");
  await expect(boxes).toHaveCount(5);
  for (const box of await boxes.all()) {
    await expect(box).not.toBeChecked();
  }
});

test("sin las declaraciones de edad y autorización, avisa y no avanza", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser();
  await login(page, user);
  await page.getByLabel(/Acepto los términos de uso/).check();
  await page.getByLabel(/Autorizo a Sole a guardar/).check();
  await page.getByRole("button", { name: "Guardar y seguir" }).click();

  await expect(page.locator(alert)).toContainText(
    "necesitamos que marques las dos declaraciones",
  );
  await expect(page).toHaveURL(/\/bienvenida\/consentimientos\?error=faltan$/);

  const { data } = await admin
    .from("consents")
    .select("id")
    .eq("user_id", user.userId);
  expect(data).toEqual([]);
});

test("bienvenida completa: permisos, persona cuidada y llegada a Hoy sin problemas de accesibilidad", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sole");
  await expectNoAxeViolations(page);

  await page.goto("/entrar");
  await expectNoAxeViolations(page);

  const user = await newUser();
  await login(page, user);

  // Permisos
  await expect(page).toHaveURL(/\/bienvenida\/consentimientos$/);
  await expectNoAxeViolations(page);
  await page.getByLabel(/Acepto los términos de uso/).check();
  await page.getByLabel("Tengo 18 años o más.").check();
  await page.getByLabel(/Autorizo a Sole a guardar/).check();
  await page.getByLabel(/Cuento con la autorización/).check();
  await page.getByRole("button", { name: "Guardar y seguir" }).click();

  // Persona cuidada
  await expect(page).toHaveURL(/\/bienvenida$/);
  await expectNoAxeViolations(page);
  await page.getByLabel("¿Cómo te llamas?").fill("Marta");
  await page.getByLabel("¿Cómo se llama la persona que cuidas?").fill("Rosa");
  await page.getByRole("radio", { name: "Mi mamá" }).check();
  await page.getByRole("radio", { name: /^Adulto mayor/ }).check();
  await expect(page.getByText("Lo que vamos a dejar listo")).toBeVisible();
  await expect(page.getByText("Medicamentos de la mañana")).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Guardar y ver mi día" }).click();

  // Hoy
  await expect(page).toHaveURL(/\/hoy\?c=[0-9a-f-]{36}&bienvenida=1$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Hola, Marta",
  );
  await expect(page.getByText("Hoy acompañas a Rosa.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Android con Chrome" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "iPhone con Safari" }),
  ).toBeVisible();
  await expectNoAxeViolations(page);

  // Lo guardado: investigación sin aceptar, círculo con su plantilla.
  const consents = await admin
    .from("consents")
    .select("layer, granted")
    .eq("user_id", user.userId);
  expect(
    consents.data?.map((row) => `${row.layer}:${row.granted}`).sort(),
  ).toEqual(["research:false", "sensitive:true", "terms:true"]);

  const circles = await admin
    .from("circles")
    .select("id, cared_name, care_type")
    .eq("created_by", user.userId);
  expect(circles.data).toHaveLength(1);
  expect(circles.data?.[0]).toMatchObject({
    cared_name: "Rosa",
    care_type: "adulto_mayor",
  });
  const reminders = await admin
    .from("reminders")
    .select("source")
    .eq("circle_id", circles.data?.[0].id);
  expect(reminders.data?.length).toBeGreaterThanOrEqual(3);
  expect(reminders.data?.every((row) => row.source === "template")).toBe(true);
});

test("el formulario de bienvenida avisa si falta algo", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ consents: true });
  await login(page, user);
  await expect(page).toHaveURL(/\/bienvenida$/);
  await page.getByRole("button", { name: "Guardar y ver mi día" }).click();
  await expect(page.locator(alert)).toContainText("Nos falta algo");
  await expect(page).toHaveURL(/\/bienvenida\?error=datos$/);
});

test("la portada conserva el código de organización al entrar", async ({
  page,
}) => {
  await page.goto("/?org=DEMO-LOCAL");
  await page.getByRole("link", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/entrar\?org=DEMO-LOCAL$/);
  await expect(page.locator('input[name="org"]').first()).toHaveValue(
    "DEMO-LOCAL",
  );
});

test("con círculo creado, el menú y salir funcionan", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await expect(page).toHaveURL(/\/hoy$/);
  await expect(page.getByText("Hoy acompañas a Rosa.")).toBeVisible();

  await page.getByRole("button", { name: "Menú" }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Menú principal" })
      .getByRole("link", { name: "Recordatorios" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/hoy");
  await expect(page).toHaveURL(/\/entrar\?next=%2Fhoy$/);
});
