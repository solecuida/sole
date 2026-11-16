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

/** Un recordatorio de hoy a las 00:00 (siempre ya pasó, así aparece en "Hoy"). */
async function addItem(user: E2EUser, title: string, importance: string) {
  const date = chileToday();
  const { error } = await user.client.from("reminders").insert({
    circle_id: user.circleId,
    created_by: user.userId,
    kind: "custom",
    importance,
    title,
    rule: { freq: "once", date, times: ["00:00"], startDate: date },
  });
  if (error) {
    throw new Error(`recordatorio: ${error.message}`);
  }
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

/** Estilo de contorno calculado del elemento que tiene el foco. */
function focusedOutline(page: Page): Promise<string> {
  return page.evaluate(() => {
    const active = document.activeElement;
    return active ? getComputedStyle(active).outlineStyle : "sin foco";
  });
}

function isFocused(locator: Locator): Promise<boolean> {
  return locator.evaluate((el) => el === document.activeElement, undefined, {
    timeout: 2000,
  });
}

function isWebKit(page: Page): boolean {
  return page.context().browser()?.browserType().name() === "webkit";
}

/** Avanza con Tab hasta que el foco llega al elemento (sin tocar nada con el mouse). */
async function tabTo(page: Page, target: Locator, max = 20) {
  for (let step = 0; step <= max; step += 1) {
    if (await isFocused(target)) {
      return;
    }
    await page.keyboard.press("Tab");
  }
  throw new Error(`El foco no llegó al elemento en ${max} Tab.`);
}

test("Tab desde el inicio de /hoy enfoca primero «Saltar al contenido» y llega al «Hecho» del primer ítem", async ({
  page,
  newUser,
  login,
}) => {
  test.setTimeout(120_000);
  const user = await newUser({ circle: true });
  await addItem(user, "Primer remedio", "important");
  await addItem(user, "Segundo almuerzo", "normal");
  await login(page, user);
  await open(
    page,
    "/hoy",
    page.getByRole("heading", { level: 1, name: /^Hola/ }),
  );
  await expect(page.getByText("Vas 0 de 2 hoy.")).toBeVisible();

  // Primer Tab: el enlace para saltar al contenido.
  // Safari, de fábrica, no detiene Tab en los enlaces (es una preferencia del
  // navegador, no de la página): ahí se comprueba solo el camino a los botones.
  if (!isWebKit(page)) {
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Saltar al contenido" }),
    ).toBeFocused();
    expect(await focusedOutline(page)).not.toBe("none");
  }

  // Luego, el resto de la cabecera y, por fin, el «Hecho» del primer ítem.
  const reached: string[] = [];
  let label: string | null = null;
  for (let step = 0; step < 30 && !label?.startsWith("Hecho: "); step += 1) {
    await page.keyboard.press("Tab");
    label = await page.evaluate(
      () =>
        document.activeElement?.getAttribute("aria-label") ??
        document.activeElement?.textContent?.trim() ??
        "",
    );
    reached.push(label);
  }
  expect(reached.at(-1), `foco recorrido: ${reached.join(" > ")}`).toBe(
    "Hecho: Primer remedio",
  );
  await expect(
    page.getByRole("button", { name: "Hecho: Primer remedio" }),
  ).toBeFocused();
  expect(await focusedOutline(page)).not.toBe("none");

  // Con Enter se marca, sin soltar el teclado.
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("listitem").filter({ hasText: "Primer remedio" }),
  ).toContainText("Hecho ✓");
});

test("el formulario de recordatorio se completa solo con el teclado y crea el recordatorio", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  test.setTimeout(120_000);
  const user = await newUser({ circle: true });
  await login(page, user);
  await open(
    page,
    "/recordatorios/editar",
    page.getByRole("heading", { level: 1, name: "Nuevo recordatorio" }),
  );

  // Título
  const title = page.getByLabel("Título");
  await tabTo(page, title);
  await page.keyboard.type("Pastilla con teclado");

  // El tipo por defecto es «Medicamento»: aparece su nombre.
  const medName = page.getByLabel("Nombre del medicamento");
  await tabTo(page, medName);
  await page.keyboard.type("Losartan");

  // Importancia: se entra al grupo con Tab y se cambia con las flechas.
  const normal = page.getByRole("radio", { name: "Normal", exact: true });
  await tabTo(page, normal);
  await page.keyboard.press("ArrowUp");
  await expect(
    page.getByRole("radio", { name: "Importante", exact: true }),
  ).toBeChecked();

  // Hora: por defecto «Todos los días». El campo de hora se escribe por segmentos.
  const time = page.getByLabel("Hora", { exact: true });
  await tabTo(page, time);
  // El WebKit de las pruebas muestra la hora como un campo de texto simple.
  await page.keyboard.type(isWebKit(page) ? "08:00" : "0800");
  if ((await time.inputValue()) === "") {
    // Un navegador con reloj de 12 horas pide además AM/PM.
    await page.keyboard.type("a");
  }
  await expect.poll(() => time.inputValue()).toBe("08:00");

  // Guardar, con Enter sobre el botón.
  const save = page.getByRole("button", { name: "Guardar", exact: true });
  await tabTo(page, save);
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/recordatorios\?c=/);
  const item = page
    .getByRole("listitem")
    .filter({ hasText: "Pastilla con teclado" });
  await expect(item).toContainText("Todos los días a las 08:00");
  await expect(item).toContainText("Importante");

  await expect
    .poll(async () => {
      const { data } = await admin
        .from("reminders")
        .select("title, kind, importance, active")
        .eq("circle_id", user.circleId ?? "");
      return data;
    })
    .toEqual([
      {
        title: "Pastilla con teclado",
        kind: "medication",
        importance: "important",
        active: true,
      },
    ]);
});
