import { randomUUID } from "node:crypto";
import { totp } from "../support/totp";
import { expect, test } from "./fixtures";

const alert = 'p[role="alert"]';

test("una usuaria común recibe 404 en /admin", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ consents: true });
  await login(page, user);
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
  const organizations = await page.goto("/admin/organizaciones");
  expect(organizations?.status()).toBe(404);
});

test("el panel: segundo paso, organizaciones, contenido y comentarios", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  test.setTimeout(180_000);
  const tag = randomUUID().slice(0, 8);
  const orgCode = `T${tag.toUpperCase()}`;
  const orgName = `Fundación Prueba ${tag}`;
  const tipText = `Un rato de música suave cada tarde ${tag}`;
  const tipEdited = `Un rato de música suave, editado ${tag}`;
  const resourceName = `Recurso de prueba ${tag}`;
  const comment = `Comentario de prueba ${tag}: la letra se ve chica`;

  const adminUser = await newUser({ consents: true });
  const { error: roleError } = await admin
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", adminUser.userId);
  expect(roleError).toBeNull();
  const writer = await newUser({ consents: true });
  const inserted = await writer.client.from("feedback").insert({
    user_id: writer.userId,
    kind: "comentario",
    message: comment,
    screen: "/hoy",
  });
  expect(inserted.error).toBeNull();
  const created = await admin
    .from("resources")
    .insert({
      name: resourceName,
      description: "Recurso creado por la prueba del panel.",
      source_url: "https://example.test/fuente",
    })
    .select("id")
    .single();
  expect(created.error).toBeNull();
  const resourceId = created.data?.id ?? "";

  try {
    // (b) sin segundo factor: a /admin/mfa
    await login(page, adminUser);
    // Al entrar, la app todavía puede estar llevando a la bienvenida y esa
    // redirección interrumpe la carga en WebKit: se reintenta hasta llegar.
    await expect(async () => {
      await page.goto("/admin").catch(() => undefined);
      await expect(page).toHaveURL(/\/admin\/mfa$/, { timeout: 3000 });
    }).toPass({ timeout: 20_000 });
    await expectNoAxeViolations(page);

    // (c) configurar el segundo paso y entrar
    await page
      .getByRole("button", { name: "Configurar el segundo paso" })
      .click();
    const secretBox = page.locator("code");
    await expect(secretBox).toBeVisible();
    const secret = ((await secretBox.textContent()) ?? "").trim();
    await page.getByLabel("Código de 6 dígitos").fill(totp(secret));
    await page.getByRole("button", { name: "Entrar al panel" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expectNoAxeViolations(page);

    // (d) organizaciones
    await page.goto("/admin/organizaciones");
    await expect(
      page.getByRole("heading", { level: 1, name: "Organizaciones" }),
    ).toBeVisible();
    await page.getByLabel("Nombre").fill(orgName);
    await page
      .getByLabel("Código", { exact: false })
      .fill(orgCode.toLowerCase());
    await page.getByRole("button", { name: "Crear organización" }).click();
    const orgItem = page.locator(`li[data-org="${orgCode}"]`);
    await expect(orgItem).toBeVisible();
    await expect(orgItem).toContainText(orgName);
    await expect(orgItem.locator("code").last()).toHaveText(
      new RegExp(`/\\?org=${orgCode}$`),
    );
    await expectNoAxeViolations(page);
    await orgItem.getByRole("button", { name: /^Desactivar/ }).click();
    await expect
      .poll(async () => {
        const { data } = await admin
          .from("organizations")
          .select("active")
          .eq("code", orgCode)
          .single();
        return data?.active;
      })
      .toBe(false);

    // consejos: crear y editar
    await page.goto("/admin/contenido?tab=consejos");
    await expect(page.locator(alert)).toHaveCount(0);
    const createTip = page
      .locator("details")
      .filter({ hasText: "Crear un consejo o una actividad" });
    await createTip.locator("summary").click();
    await createTip.getByLabel(/^Texto/).fill(tipText);
    await createTip.getByRole("button", { name: "Crear consejo" }).click();
    const tipItem = page.locator("li[data-tip]").filter({ hasText: tipText });
    await expect(tipItem).toBeVisible();
    await expectNoAxeViolations(page);
    await tipItem.locator("summary").click();
    await tipItem.getByLabel(/^Texto/).fill(tipEdited);
    await tipItem.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(
      page.locator("li[data-tip]").filter({ hasText: tipEdited }),
    ).toBeVisible();

    // plantillas y recursos: las pestañas cargan sin errores de accesibilidad
    await page.goto("/admin/contenido?tab=plantillas");
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
    await expectNoAxeViolations(page);

    // (e) recurso: marcar como verificado
    await page.goto("/admin/contenido?tab=recursos");
    const resourceItem = page.locator(`li[data-resource="${resourceId}"]`);
    await expect(resourceItem).toContainText("Sin verificar");
    await expect(
      resourceItem.getByRole("link", { name: /fuente oficial/ }),
    ).toHaveAttribute("href", "https://example.test/fuente");
    await expectNoAxeViolations(page);
    await resourceItem
      .getByRole("button", { name: /Marcar como verificado hoy/ })
      .click();
    await expect
      .poll(async () => {
        const { data } = await admin
          .from("resources")
          .select("verified_at")
          .eq("id", resourceId)
          .single();
        return data?.verified_at ?? null;
      })
      .toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await expect(
      page.locator(`li[data-resource="${resourceId}"]`),
    ).toContainText("Verificado el");

    // (f) comentarios
    await page.goto("/admin/comentarios");
    await expect(
      page.getByRole("heading", { level: 1, name: "Comentarios" }),
    ).toBeVisible();
    await expect(page.getByText(/Errores de los últimos 7 días/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Abrir Sentry/ }),
    ).toHaveAttribute("href", "https://sentry.io/");
    const item = page.locator("li[data-feedback]").filter({ hasText: comment });
    await expect(item).toBeVisible();
    await expect(item).toContainText("Sin leer");
    await expect(item).not.toContainText(writer.email);
    await expectNoAxeViolations(page);
    await item.getByRole("button", { name: "Marcar como leído" }).click();
    await expect
      .poll(async () => {
        const { data } = await admin
          .from("feedback")
          .select("read_at")
          .eq("user_id", writer.userId)
          .single();
        return data?.read_at ?? null;
      })
      .not.toBeNull();
    await expect(
      page.locator("li[data-feedback]").filter({ hasText: comment }),
    ).toContainText("Leído");
  } finally {
    await admin.from("resources").delete().eq("id", resourceId);
    await admin.from("tips").delete().ilike("text", `%${tag}`);
    await admin.from("organizations").delete().eq("code", orgCode);
    await admin.from("feedback").delete().eq("user_id", writer.userId);
  }
});
