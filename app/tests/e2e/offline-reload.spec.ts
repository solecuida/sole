import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const TZ = "America/Santiago";

/** Una hora de hoy (en Chile) que ya pasó hace muy poco. */
function recentTime(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  const minutes = Math.max(
    Number(get("hour")) * 60 + Number(get("minute")) - 2,
    0,
  );
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`,
  };
}

/** Espera a que el service worker esté activo y controlando la página. */
async function waitForWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        );
      });
    }
  });
}

// El WebKit de Playwright no ejecuta service workers como Safari en un iPhone
// real; estas pruebas corren solo en el proyecto Android.
// biome-ignore lint/correctness/noEmptyPattern: Playwright exige desestructurar el primer argumento
test.beforeEach(({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "android-gama-media",
    "solo en android-gama-media",
  );
});

test("al recargar «Hoy» sin señal se ve el día guardado y se puede marcar", async ({
  page,
  context,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true, caredName: "Rosa" });
  const { date, time } = recentTime();
  await user.client.from("reminders").insert({
    circle_id: user.circleId,
    created_by: user.userId,
    kind: "custom",
    importance: "important",
    title: "Regar las plantas",
    rule: { freq: "once", date, times: [time], startDate: date },
  });
  await login(page, user);
  await expect(page.getByText("Regar las plantas")).toBeVisible();
  await waitForWorker(page);
  // El día ya quedó guardado en el teléfono.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const open = indexedDB.open("sole");
            open.onsuccess = () => {
              const count = open.result
                .transaction("snapshot")
                .objectStore("snapshot")
                .count();
              count.onsuccess = () => resolve(count.result);
            };
            open.onerror = () => resolve(0);
          }),
      ),
    )
    .toBe(1);

  await context.setOffline(true);
  await page.reload();

  await expect(
    page.getByRole("heading", { level: 1, name: "Sin conexión" }),
  ).toBeVisible();
  await expect(page.getByText(/Guardado a las \d{2}:\d{2}/)).toBeVisible();
  await expect(page.getByText("Rosa")).toBeVisible();
  const item = page
    .getByRole("listitem")
    .filter({ hasText: "Regar las plantas" });
  await expect(item).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Importante" }),
  ).toBeVisible();

  // También sin señal se puede marcar: queda en la cola.
  await item.getByRole("button", { name: /^Hecho/ }).click();
  await expect(item.getByText("Hecho ✓")).toBeVisible();
  await expect(
    item.getByText("Guardado sin conexión · se enviará cuando vuelva la señal"),
  ).toBeVisible();

  // Al volver la señal y abrir «Hoy», la marca se envía.
  await context.setOffline(false);
  await page.getByRole("link", { name: "Volver a intentar" }).click();
  await expect(page).toHaveURL(/\/hoy/);
  await expect
    .poll(
      async () => {
        const { data } = await admin
          .from("reminder_occurrences")
          .select("status")
          .eq("circle_id", user.circleId ?? "")
          .single();
        return data?.status;
      },
      { timeout: 30_000 },
    )
    .toBe("done");
});

test("sin señal, una página nunca visitada muestra la página sin conexión", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await waitForWorker(page);
  await context.setOffline(true);
  await page.goto("/calendario");
  await expect(
    page.getByRole("heading", { level: 1, name: "Sin conexión" }),
  ).toBeVisible();
});

test("sin nada guardado, lo explica", async ({ page, context }) => {
  await page.goto("/");
  await waitForWorker(page);
  await context.setOffline(true);
  await page.goto("/hoy");
  await expect(
    page.getByText(
      "Todavía no hay nada guardado en este teléfono. Abre Sole con conexión una vez.",
    ),
  ).toBeVisible();
});

test("la página sin conexión no tiene problemas de accesibilidad", async ({
  page,
  expectNoAxeViolations,
}) => {
  await page.goto("/~offline");
  await expect(
    page.getByText(/Todavía no hay nada guardado en este teléfono/),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});
