import { expect, test } from "./fixtures";

const alert = 'p[role="alert"]';

test("permisos: se ven con su fecha y la investigación se activa y desactiva", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/cuenta");
  await expect(
    page.getByRole("heading", { level: 1, name: "Mi cuenta" }),
  ).toBeVisible();
  await expect(page.getByText(/^Aceptado el \d{1,2} de /)).toHaveCount(2);
  await expect(page.getByText(/^No aceptado\./)).toBeVisible();
  await expectNoAxeViolations(page);

  await page
    .getByRole("button", { name: "Compartir mis datos de uso", exact: true })
    .click();
  await expect(page).toHaveURL(/aviso=investigacion/);
  await expect(page.getByText(/^Aceptado el \d{1,2} de /)).toHaveCount(3);

  await page
    .getByRole("button", { name: "Dejar de compartir mis datos de uso" })
    .click();
  await expect(page.getByText(/^No aceptado\./)).toBeVisible();

  const { data } = await admin
    .from("consents")
    .select("granted")
    .eq("user_id", user.userId)
    .eq("layer", "research")
    .order("created_at", { ascending: true });
  expect(data?.map((row) => row.granted)).toEqual([true, false]);

  // Sigue usando Sole igual.
  await page.goto("/hoy");
  await expect(page).toHaveURL(/\/hoy$/);
});

test("descargar todo entrega un archivo con sus datos", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true, caredName: "Rosa" });
  await login(page, user);
  await page.goto("/cuenta");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Descargar todo" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^sole-datos-\d{4}-\d{2}-\d{2}\.json$/,
  );
  const response = await page.request.get("/api/cuenta/exportar?formato=json");
  const data = await response.json();
  expect(data.perfil.correo).toBe(user.email);
  expect(data.circulos[0].persona_cuidada).toBe("Rosa");
});

test("cerrar por fallecimiento silencia todo y responde con cuidado", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true, caredName: "Rosa" });
  await user.client.from("reminders").insert({
    circle_id: user.circleId,
    created_by: user.userId,
    kind: "custom",
    title: "Regar las plantas",
    rule: { freq: "daily", times: ["08:00"], startDate: "2026-11-01" },
  });
  await login(page, user);
  await page.goto("/cuenta");

  const form = page
    .getByRole("group", { name: "Cerrar el espacio de Rosa" })
    .locator("xpath=ancestor::form");
  // Sin motivo, avisa y no cierra.
  await form.getByRole("button", { name: "Cerrar el espacio de Rosa" }).click();
  await expect(page.locator(alert)).toHaveText("Elige un motivo para cerrar.");

  await page.getByRole("radio", { name: "Falleció" }).check();
  await page.getByRole("button", { name: "Cerrar el espacio de Rosa" }).click();
  await expect(page).toHaveURL(/aviso=cerrado-fallecimiento/);
  await expect(
    page.getByText(
      "Lo sentimos mucho. Ya silenciamos todos los recordatorios. Lo que escribiste sigue aquí, por si quieres guardarlo.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("No tienes espacios abiertos para cerrar."),
  ).toBeVisible();
  await expectNoAxeViolations(page);

  const circle = await admin
    .from("circles")
    .select("closed_reason")
    .eq("id", user.circleId ?? "")
    .single();
  expect(circle.data?.closed_reason).toBe("fallecimiento");
  const reminders = await admin
    .from("reminders")
    .select("active")
    .eq("circle_id", user.circleId ?? "");
  expect(reminders.data).toEqual([{ active: false }]);

  // «Hoy» sigue abriendo, sin pendientes ni errores.
  await page.goto("/hoy");
  await expect(page.getByText(/Hoy no hay nada pendiente/)).toBeVisible();
});

test("borrar la cuenta pide confirmación, la desactiva y se puede recuperar", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/cuenta");

  const profile = async () => {
    const { data } = await admin
      .from("profiles")
      .select("deletion_requested_at, deactivated_at")
      .eq("id", user.userId)
      .single();
    return data;
  };

  // Sin la palabra exacta no pasa nada.
  await page.getByLabel("Para confirmar, escribe BORRAR").fill("borra");
  await page.getByRole("button", { name: "Borrar mi cuenta" }).click();
  await expect(page.locator(alert)).toHaveText(
    "Escribe la palabra BORRAR para confirmar.",
  );
  expect((await profile())?.deletion_requested_at).toBeNull();

  await expect(
    page.getByText(
      "Si alguien de tu familia usa estos círculos, también dejará de verlos.",
    ),
  ).toBeVisible();
  await page.getByLabel("Para confirmar, escribe BORRAR").fill("BORRAR");
  await page.getByRole("button", { name: "Borrar mi cuenta" }).click();

  await expect(page).toHaveURL(/\/\?cuenta=borrado$/);
  await expect(page.getByRole("status")).toContainText(
    "Tu cuenta quedó desactivada y se borrará en 7 días.",
  );
  const pending = await profile();
  expect(pending?.deletion_requested_at).toBeTruthy();
  expect(pending?.deactivated_at).toBeTruthy();

  // La sesión se cerró.
  await page.goto("/hoy");
  await expect(page).toHaveURL(/\/entrar\?next=%2Fhoy$/);

  // Al volver a entrar solo ve la pantalla para recuperar.
  await login(page, user);
  await expect(
    page.getByRole("heading", { level: 1, name: "Pediste borrar tu cuenta" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Se borrará definitivamente el \d{1,2} de /),
  ).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expectNoAxeViolations(page);
  await page.goto("/cuenta");
  await expect(
    page.getByRole("heading", { level: 1, name: "Pediste borrar tu cuenta" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Recuperar mi cuenta" }).click();
  await expect(page).toHaveURL(/\/hoy$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hola");
  expect(await profile()).toEqual({
    deletion_requested_at: null,
    deactivated_at: null,
  });
});

test("crear una contraseña valida su forma", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/cuenta");
  await page.getByLabel("Contraseña nueva").fill("corta");
  await page.getByLabel("Repite la contraseña").fill("corta");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.locator(alert)).toContainText("al menos 10 caracteres");

  await page.getByLabel("Contraseña nueva").fill("Aa1-clave-nueva-larga");
  await page.getByLabel("Repite la contraseña").fill("Aa1-otra-distinta-99");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.locator(alert)).toHaveText(
    "Las dos contraseñas no son iguales.",
  );

  await page.getByLabel("Contraseña nueva").fill("Aa1-clave-nueva-larga");
  await page.getByLabel("Repite la contraseña").fill("Aa1-clave-nueva-larga");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(
    page.getByText("Listo. Ya puedes entrar con tu contraseña."),
  ).toBeVisible();
});
