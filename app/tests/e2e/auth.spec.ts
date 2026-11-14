import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Las variables llegan por playwright.config.ts (.env.test.local).
function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Faltan variables locales: corre `pnpm -C app env:local`.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createPasswordUser() {
  const email = `test-${randomUUID()}@example.test`;
  const password = `Aa1${randomUUID()}`;
  const { error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    throw new Error(`No se pudo crear la usuaria de prueba: ${error.message}`);
  }
  return { email, password };
}

test("sin sesión, /hoy redirige a /entrar con el destino", async ({
  request,
}) => {
  const response = await request.get("/hoy", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toMatch(/\/entrar\?next=%2Fhoy$/);
});

test("sin sesión, el navegador termina en la pantalla de ingreso", async ({
  page,
}) => {
  await page.goto("/hoy");
  await expect(page).toHaveURL(/\/entrar\?next=%2Fhoy$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Entrar a Sole" }),
  ).toBeVisible();
});

test("entrar con correo y contraseña deja una cookie de sesión HttpOnly y SameSite=Lax", async ({
  page,
  context,
}) => {
  const user = await createPasswordUser();
  await page.goto("/entrar");

  // Se lee lo que el servidor envía (Set-Cookie): WebKit en Windows no informa
  // bien el atributo SameSite de las cookies ya guardadas.
  const setCookies: string[] = [];
  page.on("response", async (response) => {
    const values = await response
      .headerValues("set-cookie")
      .catch(() => [] as string[]);
    setCookies.push(...values.flatMap((value) => value.split("\n")));
  });

  await page.getByText("Entrar con contraseña").click();
  const form = page.locator("details");
  await form.getByLabel("Tu correo").fill(user.email);
  await form.getByLabel("Tu contraseña").fill(user.password);
  await form.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => url.pathname !== "/entrar");

  const sent = setCookies.filter((value) => value.startsWith("sb-"));
  expect(sent.length).toBeGreaterThan(0);
  for (const value of sent) {
    expect(value).toMatch(/; *HttpOnly/i);
    expect(value).toMatch(/; *SameSite=Lax/i);
    expect(value).toMatch(/; *Path=\//i);
  }

  const stored = (await context.cookies()).filter((cookie) =>
    cookie.name.startsWith("sb-"),
  );
  expect(stored.length).toBeGreaterThan(0);
  for (const cookie of stored) {
    expect(cookie.httpOnly, cookie.name).toBe(true);
  }
});

test("una contraseña equivocada muestra el mismo error genérico", async ({
  page,
  context,
}) => {
  const user = await createPasswordUser();
  await page.goto("/entrar");
  await page.getByText("Entrar con contraseña").click();
  const form = page.locator("details");
  await form.getByLabel("Tu correo").fill(user.email);
  await form.getByLabel("Tu contraseña").fill("Aa1-esta-no-es");
  await form.getByRole("button", { name: "Entrar" }).click();

  await expect(page.locator('p[role="alert"]')).toHaveText(
    "Correo o contraseña incorrectos.",
  );
  const session = (await context.cookies()).filter((cookie) =>
    cookie.name.startsWith("sb-"),
  );
  expect(session).toEqual([]);
});

test("un enlace inválido vuelve a /entrar con el aviso", async ({
  page,
  request,
}) => {
  const response = await request.get(
    "/auth/confirm?token_hash=no-existe&type=email",
    { maxRedirects: 0 },
  );
  expect(response.status()).toBe(307);
  expect(response.headers().location).toMatch(/\/entrar\?error=enlace$/);

  await page.goto("/auth/confirm?token_hash=no-existe&type=email");
  await expect(page).toHaveURL(/\/entrar\?error=enlace$/);
  await expect(page.locator('p[role="alert"]')).toHaveText(
    "El enlace venció o ya se usó. Pide uno nuevo.",
  );
});
