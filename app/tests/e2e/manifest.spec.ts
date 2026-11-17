import { expect, test } from "@playwright/test";

test("el manifiesto describe una app instalable", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: "Sole · el día a día del cuidado",
    short_name: "Sole",
    start_url: "/hoy",
    scope: "/",
    display: "standalone",
    lang: "es-CL",
  });
  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");
  expect(
    manifest.icons.some(
      (icon: { purpose?: string; sizes: string }) =>
        icon.purpose === "maskable" && icon.sizes === "512x512",
    ),
  ).toBe(true);
  for (const color of [manifest.background_color, manifest.theme_color]) {
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  }
});

test("los íconos del manifiesto existen y son PNG", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  const sources: string[] = manifest.icons.map(
    (icon: { src: string }) => icon.src,
  );
  for (const src of [...sources, "/icons/96"]) {
    const response = await request.get(src);
    expect(response.status(), src).toBe(200);
    expect(response.headers()["content-type"], src).toBe("image/png");
    const body = await response.body();
    // Firma de un archivo PNG.
    expect(body.subarray(1, 4).toString("latin1"), src).toBe("PNG");
  }
});

test("un tamaño que no existe responde 404", async ({ request }) => {
  for (const src of ["/icons/7", "/icons/1024", "/icons/abc"]) {
    expect((await request.get(src)).status(), src).toBe(404);
  }
});

test("la página enlaza el manifiesto y su ícono", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute(
    "href",
    /\/icons\/192/,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    /\/icons\/192/,
  );
});
