import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type E2EUser, expect, test } from "./fixtures";

const TZ = "America/Santiago";
const FRASE =
  "Sole no reemplaza a un servicio de emergencia y no puede garantizar que un aviso llegue.";

/** Una hora de hoy que ya pasó hace muy poco (o 00:00 recién pasada la medianoche). */
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
  const at = Math.max(Number(get("hour")) * 60 + Number(get("minute")) - 2, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${pad(Math.floor(at / 60))}:${pad(at % 60)}`,
  };
}

async function addReminder(
  admin: SupabaseClient,
  user: E2EUser,
  title: string,
  visibleToCared: boolean,
) {
  const { date, time } = recentTime();
  const { error } = await admin.from("reminders").insert({
    circle_id: user.circleId,
    created_by: user.userId,
    kind: "custom",
    importance: "normal",
    title,
    visible_to_cared: visibleToCared,
    rule: { freq: "once", date, times: [time], startDate: date },
  });
  if (error) {
    throw new Error(`recordatorio: ${error.message}`);
  }
}

/** Crea un vínculo vigente y devuelve el token (lo único que el navegador conoce). */
async function addLink(admin: SupabaseClient, user: E2EUser) {
  const token = randomBytes(32).toString("base64url");
  const { error } = await admin.from("cared_links").insert({
    circle_id: user.circleId,
    token_hash: createHash("sha256").update(token).digest("hex"),
    created_by: user.userId,
    expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  });
  if (error) {
    throw new Error(`vínculo: ${error.message}`);
  }
  return token;
}

async function emergencyCount(admin: SupabaseClient, circleId: string | null) {
  const { count } = await admin
    .from("emergency_events")
    .select("id", { count: "exact", head: true })
    .eq("circle_id", circleId ?? "");
  return count ?? 0;
}

test("muestra solo lo visible, marca Listo sin recargar y cumple lo básico de accesibilidad", async ({
  page,
  newUser,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true, caredName: "Rosa" });
  await addReminder(admin, user, "Tomar agua con Rosa", true);
  await addReminder(admin, user, "Anotación solo para la familia", false);
  const token = await addLink(admin, user);

  await page.goto(`/v/${token}`);
  await expect(
    page.getByRole("heading", { level: 1, name: "Hola, Rosa" }),
  ).toBeVisible();
  await expect(page.getByText("Tomar agua con Rosa")).toBeVisible();
  await expect(page.getByText("Anotación solo para la familia")).toHaveCount(0);

  // Frase fija, siempre visible.
  await expect(page.getByText(FRASE)).toBeVisible();

  // Letra grande: el título del ítem mide al menos 28 px calculados.
  const fontSize = await page
    .getByText("Tomar agua con Rosa")
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
  expect(fontSize).toBeGreaterThanOrEqual(28);

  // No se indexa.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );

  await expectNoAxeViolations(page);

  // Marca que se pierde si la página se recarga entera.
  await page.evaluate(() => {
    (window as unknown as { __sinRecarga: boolean }).__sinRecarga = true;
  });
  await page
    .getByRole("button", { name: "Listo: Tomar agua con Rosa" })
    .click();
  await expect(page.getByText("Listo ✓")).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as unknown as { __sinRecarga?: boolean }).__sinRecarga,
    ),
  ).toBe(true);

  await expect
    .poll(async () => {
      const { data } = await admin
        .from("reminder_occurrences")
        .select("status, done_via")
        .eq("circle_id", user.circleId ?? "");
      return data?.map((row) => `${row.status}:${row.done_via}`) ?? [];
    })
    .toContain("done:cared_link");

  await expectNoAxeViolations(page);
});

test("pedir ayuda: 'No' no registra nada y 'Sí, llamar' avisa y muestra el enlace para llamar", async ({
  page,
  newUser,
  admin,
}) => {
  const user = await newUser({ circle: true });
  const token = await addLink(admin, user);

  await page.goto(`/v/${token}`);
  await expect(
    page.getByText("Hoy no hay nada anotado para ti."),
  ).toBeVisible();
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);

  // Primero pregunta; "No" no llama a nada.
  await page.getByRole("button", { name: "Pedir ayuda" }).click();
  await expect(
    page.getByRole("heading", { name: "¿Quieres pedir ayuda ahora?" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pedir ayuda" })).toBeVisible();
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  expect(await emergencyCount(admin, user.circleId)).toBe(0);

  // "Sí, llamar" registra el aviso y muestra el enlace tel:.
  await page.getByRole("button", { name: "Pedir ayuda" }).click();
  await page.getByRole("button", { name: "Sí, llamar" }).click();
  const call = page.locator('a[href^="tel:"]');
  await expect(call).toBeVisible();
  await expect(call).toHaveAttribute("href", /^tel:[\d+]+$/);
  await expect(call).toContainText("Llamar al");
  await expect.poll(() => emergencyCount(admin, user.circleId)).toBe(1);
});

test("un token desconocido responde 404", async ({ page }) => {
  const unknown = randomBytes(32).toString("base64url");
  expect(unknown).toHaveLength(43);
  const response = await page.goto(`/v/${unknown}`);
  expect(response?.status()).toBe(404);
});
