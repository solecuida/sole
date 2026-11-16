import type { ConsoleMessage, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const NONCE = /'nonce-([A-Za-z0-9+/=]+)'/;

/** Junta lo que el navegador reclame por la política de contenido. */
function watchCsp(page: Page): string[] {
  const violations: string[] = [];
  page.on("console", (message: ConsoleMessage) => {
    if (
      /content security policy|content-security-policy/i.test(message.text())
    ) {
      violations.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (/content security policy/i.test(error.message)) {
      violations.push(error.message);
    }
  });
  return violations;
}

test("/entrar sale con la política de contenido y las cabeceras fijas", async ({
  request,
}) => {
  const response = await request.get("/entrar");
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers["content-security-policy"]).toMatch(NONCE);
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("'strict-dynamic'");
  expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
  expect(headers["strict-transport-security"]).toBe(
    "max-age=63072000; includeSubDomains; preload",
  );
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toBe(
    "camera=(), microphone=(), geolocation=()",
  );
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("cada petición recibe un nonce distinto, y es el que llevan los scripts", async ({
  request,
}) => {
  const first = await request.get("/entrar");
  const second = await request.get("/entrar");
  const nonceA = NONCE.exec(first.headers()["content-security-policy"])?.[1];
  const nonceB = NONCE.exec(second.headers()["content-security-policy"])?.[1];
  expect(nonceA).toBeTruthy();
  expect(nonceB).toBeTruthy();
  expect(nonceA).not.toBe(nonceB);
  // Los scripts de la página llevan el nonce de SU respuesta.
  expect(await first.text()).toContain(`nonce="${nonceA}"`);
});

test("/, /entrar y /hoy funcionan sin que el navegador bloquee nada", async ({
  page,
  newUser,
  login,
}) => {
  const violations = watchCsp(page);

  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await page.goto("/entrar");
  await expect(page.getByLabel("Tu correo").first()).toBeVisible();

  const user = await newUser({ circle: true });
  await login(page, user);
  await expect(async () => {
    await page.goto("/hoy").catch(() => undefined);
    await expect(page).toHaveURL(/\/hoy$/, { timeout: 3000 });
  }).toPass({ timeout: 20_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Si los scripts corren, el menú responde al toque.
  await page.getByRole("button", { name: "Menú" }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Menú principal" })
      .getByRole("link", { name: "Cuenta" }),
  ).toBeVisible();

  expect(violations).toEqual([]);
});

test("ninguna ruta se abre a otros orígenes", async ({ request }) => {
  const response = await request.get("/api/health", {
    headers: { origin: "https://evil.example" },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["access-control-allow-origin"]).toBeUndefined();
});
