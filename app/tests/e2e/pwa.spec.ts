import { expect, test } from "@playwright/test";

test("el build sirve /sw.js como JavaScript", async ({ request }) => {
  const response = await request.get("/sw.js");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/javascript/);
  const source = await response.text();
  // El worker trae los manejadores de avisos.
  expect(source).toContain("notificationclick");
  expect(source).toContain("/api/occurrences/mark");
});

test("al cargar una página se registra el service worker en la raíz del sitio", async ({
  page,
  baseURL,
}, testInfo) => {
  // El WebKit de Playwright no registra service workers como lo hace Safari en
  // un iPhone real; esta comprobación corre solo en el proyecto Android.
  test.skip(
    testInfo.project.name !== "android-gama-media",
    "solo en android-gama-media",
  );
  await page.goto("/");
  const registration = await page.evaluate(async () => {
    const ready = await navigator.serviceWorker.ready;
    return { scope: ready.scope, active: ready.active?.scriptURL ?? null };
  });
  expect(registration.scope).toBe(`${baseURL}/`);
  expect(registration.active).toBe(`${baseURL}/sw.js`);
});

test("el worker no guarda páginas ni respuestas de la API", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "android-gama-media",
    "solo en android-gama-media",
  );
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto("/entrar");
  await page.request.get("/api/health");
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        urls.push(new URL(request.url).pathname);
      }
    }
    return urls;
  });
  expect(cached.filter((path) => !path.startsWith("/_next/"))).toEqual([]);
});
