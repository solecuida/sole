import { expect, test } from "./fixtures";

const TZ = "America/Santiago";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Fecha local de Chile, `back` días antes de hoy. */
function chileDate(back: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() - back * DAY_MS));
}

test("responde cómo está, puede cambiarla y la ve marcada", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/para-ti");

  await expect(
    page.getByRole("heading", { level: 1, name: "Para ti" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "¿Cómo estás tú hoy?" }),
  ).toBeVisible();
  await expect(
    page.getByText("Esto es solo para ti: no lo ve nadie más", { exact: true }),
  ).toBeVisible();
  for (const label of [
    "1 · Muy mal",
    "2 · Mal",
    "3 · Más o menos",
    "4 · Bien",
    "5 · Muy bien",
  ]) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  }

  await page.getByLabel("4 · Bien", { exact: true }).check();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.waitForURL(/guardado=1/);
  await expect(page.getByText("Guardado. Gracias por contarlo.")).toBeVisible();
  await expect(page.getByLabel("4 · Bien", { exact: true })).toBeChecked();

  await page.getByLabel("2 · Mal", { exact: true }).check();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.waitForURL(/guardado=1/);
  await expect(page.getByLabel("2 · Mal", { exact: true })).toBeChecked();

  // La dirección ya decía guardado=1: se espera a que el cambio llegue a la base.
  await expect
    .poll(async () => {
      const { data } = await admin
        .from("selfcare_checkins")
        .select("checkin_date, score")
        .eq("user_id", user.userId);
      return data;
    })
    .toEqual([{ checkin_date: chileDate(0), score: 2 }]);
  await expect(page.getByLabel("2 · Mal", { exact: true })).toBeChecked();

  // Sin racha de tres días, no hay mensaje de días pesados.
  await expect(page.getByText("Han sido días pesados")).toHaveCount(0);
});

test("guardar sin elegir una opción muestra un aviso", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/para-ti");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.waitForURL(/error=1/);
  await expect(page.locator('p[role="alert"]')).toContainText(
    "Elige una de las opciones",
  );
});

test("con tres días bajos seguidos aparece el mensaje suave", async ({
  page,
  newUser,
  login,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  const { error } = await user.client.from("selfcare_checkins").insert(
    [0, 1, 2].map((back) => ({
      user_id: user.userId,
      checkin_date: chileDate(back),
      score: back === 1 ? 2 : 1,
    })),
  );
  expect(error).toBeNull();
  await login(page, user);
  await page.goto("/para-ti");

  await expect(
    page.getByText("Han sido días pesados. No tienes que poder con todo."),
  ).toBeVisible();
  const text = await page.locator("main").textContent();
  expect(text ?? "").not.toMatch(/diagnóstico/i);
  expect(text ?? "").not.toMatch(/depresión/i);
  await expectNoAxeViolations(page);
});

test("el respiro se abre con el teclado y muestra la pausa y los recursos", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  const contact = await admin.from("contacts").insert({
    circle_id: user.circleId,
    name: "Ana de emergencia",
    kind: "familia",
    phone: "+56 9 1111 2222",
    is_emergency: true,
  });
  expect(contact.error).toBeNull();
  await login(page, user);
  await page.goto("/para-ti");

  const trigger = page.getByRole("button", { name: "Necesito un respiro" });
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Un respiro" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Respira un minuto" }),
  ).toBeVisible();
  await expect(dialog.getByText(/Inhala despacio/)).toBeVisible();
  await expect(
    dialog.getByText("Recurso de prueba (solo local)", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: /Ana de emergencia/ }),
  ).toHaveAttribute("href", "tel:+56911112222");
  await expect(
    dialog.getByRole("button", { name: "Empezar un minuto" }),
  ).toBeVisible();
  await expectNoAxeViolations(page);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  // También se cierra con el botón "Cerrar".
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(dialog).toBeHidden();
});

test("el temporizador opcional arranca y muestra los segundos", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/para-ti");
  await page.getByRole("button", { name: "Necesito un respiro" }).click();
  const dialog = page.getByRole("dialog", { name: "Un respiro" });
  await dialog.getByRole("button", { name: "Empezar un minuto" }).click();
  await expect(dialog.getByText(/^Quedan \d+ segundos$/)).toBeVisible();
});

test("el directorio muestra solo recursos verificados, con fuente y fecha", async ({
  page,
  newUser,
  login,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/para-ti");

  const directory = page.locator("section", {
    has: page.getByRole("heading", { name: "Apoyos en Chile" }),
  });
  await expect(directory).toBeVisible();
  const item = directory
    .getByRole("listitem")
    .filter({ hasText: "Recurso de prueba (solo local)" });
  await expect(item).toBeVisible();
  await expect(
    item.getByRole("link", { name: "Fuente oficial" }),
  ).toHaveAttribute("href", /^https:\/\//);
  await expect(
    item.getByText(/Verificado el \d{1,2} de \w+ de \d{4}/),
  ).toBeVisible();
  await expect(page.getByText("Salud Responde")).toHaveCount(0);
  await expectNoAxeViolations(page);
});
