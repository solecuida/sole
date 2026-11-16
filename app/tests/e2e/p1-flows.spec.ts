import type { Locator, Page } from "@playwright/test";
import { type E2EUser, expect, test } from "./fixtures";

const TZ = "America/Santiago";

/** Fecha local de Chile ahora mismo. */
function chileToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Abre una página y espera su título. Recién entrada, la app puede seguir
 * redirigiendo y en WebKit eso interrumpe el `goto`: se reintenta.
 */
async function open(page: Page, path: string, ready: Locator) {
  await expect(async () => {
    await page.goto(path).catch(() => undefined);
    await expect(ready).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 30_000 });
}

function h1(page: Page, name: string | RegExp): Locator {
  return page.getByRole("heading", { level: 1, name });
}

async function addPendingItem(user: E2EUser, title: string) {
  const date = chileToday();
  const { error } = await user.client.from("reminders").insert({
    circle_id: user.circleId,
    created_by: user.userId,
    kind: "custom",
    importance: "normal",
    title,
    rule: { freq: "once", date, times: ["00:00"], startDate: date },
  });
  if (error) {
    throw new Error(`recordatorio: ${error.message}`);
  }
}

test("un día completo: crear un recordatorio, marcarlo, escribir la bitácora, responder cómo estás y ver el informe", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  test.setTimeout(240_000);
  const user = await newUser({ circle: true, caredName: "Rosa" });
  await login(page, user);

  // 1. Crear un recordatorio diario a las 00:00 (hoy ya pasó, así sale en «Hoy»).
  await open(page, "/recordatorios/editar", h1(page, "Nuevo recordatorio"));
  await page.getByLabel("Título").fill("Medicamento del día");
  await page.getByLabel("Hora", { exact: true }).fill("00:00");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page).toHaveURL(/\/recordatorios\?c=/);
  await expect(
    page.getByRole("listitem").filter({ hasText: "Medicamento del día" }),
  ).toContainText("Todos los días a las 00:00");

  // 2. Verlo en «Hoy» y marcarlo como hecho.
  await page.goto("/hoy");
  await expect(h1(page, /^Hola/)).toBeVisible();
  await expect(page.getByText("Vas 0 de 1 hoy.")).toBeVisible();
  const item = page
    .getByRole("listitem")
    .filter({ hasText: "Medicamento del día" });
  await item.getByRole("button", { name: /^Hecho/ }).click();
  await expect(item.getByText("Hecho ✓")).toBeVisible();
  await expect(page.getByText("Vas 1 de 1 hoy.")).toBeVisible();
  // Se espera a que la marca llegue a la base antes de salir de la página.
  await expect
    .poll(async () => {
      const { data } = await admin
        .from("reminder_occurrences")
        .select("status")
        .eq("circle_id", user.circleId ?? "");
      // Un recordatorio diario ya tiene preparados también los días que vienen.
      return data?.filter((row) => row.status === "done").length;
    })
    .toBe(1);

  // 3. Escribir la bitácora.
  await page.goto("/bitacora");
  await expect(h1(page, "Bitácora")).toBeVisible();
  await page
    .getByRole("group", { name: "¿Cómo fue el día?" })
    .getByRole("radio", { name: "Regular" })
    .check();
  await page.getByLabel("Una nota (opcional)").fill("Un día tranquilo.");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Guardado.", { exact: true })).toBeVisible();

  // 4. Responder cómo está la cuidadora.
  await page.goto("/para-ti");
  await expect(h1(page, "Para ti")).toBeVisible();
  await page.getByLabel("4 · Bien", { exact: true }).check();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.waitForURL(/guardado=1/);
  await expect(page.getByText("Guardado. Gracias por contarlo.")).toBeVisible();

  // 5. Abrir el informe de la semana: el medicamento hecho cuenta.
  await page.goto("/informes?periodo=semana");
  await expect(h1(page, "Informes")).toBeVisible();
  const card = page.locator("#informe");
  await expect(
    card.getByText("Esta semana se cumplió el 100 % de los medicamentos."),
  ).toBeVisible();
  await expect(card.getByText("Hubo 1 día regular.")).toBeVisible();
  const firstRow = card.locator("table tbody tr").first();
  await expect(firstRow).toContainText("Medicamentos");
  await expect(firstRow).toContainText("100 %");

  // 6. Y «Hoy» sigue mostrando el ítem como hecho.
  await page.goto("/hoy");
  await expect(h1(page, /^Hola/)).toBeVisible();
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: "Medicamento del día" })
      .getByText("Hecho ✓"),
  ).toBeVisible();
  await expect(page.getByText("Vas 1 de 1 hoy.")).toBeVisible();
});

test("a 320 px de ancho, /hoy, /recordatorios/editar y /bitacora no se desbordan hacia los lados", async ({
  page,
  newUser,
  login,
}) => {
  test.setTimeout(120_000);
  const user = await newUser({ circle: true, caredName: "Rosa" });
  await addPendingItem(user, "Un recordatorio con un título bastante largo");
  await login(page, user);
  await page.setViewportSize({ width: 320, height: 640 });

  const screens: { path: string; title: string | RegExp }[] = [
    { path: "/hoy", title: /^Hola/ },
    { path: "/recordatorios/editar", title: "Nuevo recordatorio" },
    { path: "/bitacora", title: "Bitácora" },
  ];
  for (const screen of screens) {
    await open(page, screen.path, h1(page, screen.title));
    const widths = await page.evaluate(() => {
      const main = document.getElementById("contenido");
      return {
        document: document.documentElement.scrollWidth,
        // El contenido se desplaza dentro de <main>: también no debe salirse de él.
        main: main ? main.scrollWidth - main.clientWidth : 0,
      };
    });
    expect(
      widths.document,
      `scrollWidth del documento en ${screen.path}`,
    ).toBeLessThanOrEqual(320);
    expect(widths.main, `desborde horizontal de <main> en ${screen.path}`).toBe(
      0,
    );
  }
});
