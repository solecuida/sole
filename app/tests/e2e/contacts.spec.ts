import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/** WebKit interrumpe el primer `goto` tras el ingreso: se reintenta hasta llegar. */
async function openContacts(page: Page) {
  await expect(async () => {
    await page.goto("/contactos").catch(() => undefined);
    await expect(page).toHaveURL(/\/contactos/);
  }).toPass({ timeout: 20_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "Contactos" }),
  ).toBeVisible();
}

test("agregar un contacto lo lista con su enlace tel:, cifra la nota y no pide datos clínicos", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true, caredName: "Rosa" });
  await login(page, user);
  await openContacts(page);

  await expect(page.getByText("Todavía no hay contactos.")).toBeVisible();
  await expectNoAxeViolations(page);

  // Sin campos clínicos: ni etiquetas ni texto de ayuda con esas palabras.
  const form = page.getByRole("region", { name: "Agregar contacto" });
  await expect(form).toBeVisible();
  for (const forbidden of [/alergias/i, /diagnóstico/i, /previsión/i]) {
    await expect(form.getByLabel(forbidden)).toHaveCount(0);
    await expect(form.getByText(forbidden)).toHaveCount(0);
  }

  await form.getByLabel("Nombre", { exact: true }).fill("Dra. Pérez");
  await form.getByLabel("¿Quién es?").selectOption("medico");
  await form.getByLabel("Teléfono", { exact: true }).fill("+56 2 2345 6789");
  await form
    .getByLabel("Nota (opcional)")
    .fill("Atiende los martes por la tarde.");
  await form.getByRole("button", { name: "Guardar", exact: true }).click();

  await expect(page.getByText("Listo, guardamos el contacto.")).toBeVisible();
  const list = page.getByRole("region", { name: "Tu lista" });
  const item = list.getByRole("listitem");
  await expect(item).toHaveCount(1);
  await expect(item).toContainText("Dra. Pérez");
  await expect(item).toContainText("Médico o médica");
  await expect(item).toContainText("Atiende los martes por la tarde.");
  await expect(
    item.getByRole("link", { name: "Llamar a Dra. Pérez" }),
  ).toHaveAttribute("href", "tel:+56223456789");
  await expectNoAxeViolations(page);

  const { data } = await admin
    .from("contacts")
    .select("name, kind, phone, notes_enc, is_emergency")
    .eq("circle_id", user.circleId ?? "");
  expect(data).toHaveLength(1);
  expect(data?.[0]).toMatchObject({
    name: "Dra. Pérez",
    kind: "medico",
    phone: "+56 2 2345 6789",
    is_emergency: false,
  });
  expect(data?.[0]?.notes_enc?.startsWith("v1.")).toBe(true);
  expect(JSON.stringify(data)).not.toContain("martes");
});

test("un teléfono con letras no se guarda y avisa", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await openContacts(page);

  const form = page.getByRole("region", { name: "Agregar contacto" });
  await form.getByLabel("Nombre", { exact: true }).fill("Alguien");
  await form.getByLabel("Teléfono", { exact: true }).fill("llamar mañana");
  await form.getByRole("button", { name: "Guardar", exact: true }).click();

  await expect(page).toHaveURL(/error=datos/);
  await expect(page.locator('p[role="alert"]')).toContainText(
    "Revisa el contacto",
  );
  const { data } = await admin
    .from("contacts")
    .select("id")
    .eq("circle_id", user.circleId ?? "");
  expect(data).toHaveLength(0);
});

test("marca el contacto de emergencia y permite editarlo y quitarlo", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await openContacts(page);

  const form = page.getByRole("region", { name: "Agregar contacto" });
  await form.getByLabel("Nombre", { exact: true }).fill("Hija Camila");
  await form.getByLabel("Teléfono", { exact: true }).fill("+56 9 8765 4321");
  await form.getByLabel("Contacto de emergencia").check();
  await form.getByRole("button", { name: "Guardar", exact: true }).click();

  const list = page.getByRole("region", { name: "Tu lista" });
  await expect(list.getByRole("listitem")).toContainText(
    "Contacto de emergencia",
  );

  await list.getByRole("link", { name: "Editar Hija Camila" }).click();
  const editForm = page.getByRole("region", { name: "Editar contacto" });
  await expect(editForm.getByLabel("Nombre", { exact: true })).toHaveValue(
    "Hija Camila",
  );
  await editForm
    .getByLabel("Teléfono", { exact: true })
    .fill("+56 9 1111 2222");
  await editForm.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(
    list.getByRole("link", { name: "Llamar a Hija Camila" }),
  ).toHaveAttribute("href", "tel:+56911112222");

  await list.getByRole("button", { name: "Quitar Hija Camila" }).click();
  await expect(page.getByText("Quitamos el contacto.")).toBeVisible();
  await expect(page.getByText("Todavía no hay contactos.")).toBeVisible();
  await expect
    .poll(async () => {
      const { data } = await admin
        .from("contacts")
        .select("id")
        .eq("circle_id", user.circleId ?? "");
      return data?.length;
    })
    .toBe(0);
});

test("una familiar ve los contactos y puede llamar, pero no cambiarlos", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  const caregiver = await newUser({ circle: true, caredName: "Rosa" });
  const family = await newUser({ consents: true });
  await admin.from("circle_members").insert({
    circle_id: caregiver.circleId,
    user_id: family.userId,
    role: "family",
    display_name: "Pedro",
  });
  await caregiver.client.from("contacts").insert({
    circle_id: caregiver.circleId,
    name: "Farmacia Central",
    kind: "farmacia",
    phone: "223456789",
  });

  await login(page, family);
  await openContacts(page);

  const item = page.getByRole("listitem").filter({
    hasText: "Farmacia Central",
  });
  await expect(
    item.getByRole("link", { name: "Llamar a Farmacia Central" }),
  ).toHaveAttribute("href", "tel:223456789");
  await expect(
    page.getByRole("button", { name: "Guardar", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Editar/ })).toHaveCount(0);
  await expect(
    page.getByText("Solo quien administra el círculo puede agregar"),
  ).toBeVisible();
});
