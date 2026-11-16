import type { SupabaseClient } from "@supabase/supabase-js";
import { type E2EUser, expect, test } from "./fixtures";

const TZ = "America/Santiago";

/** Día local de Chile, `back` días antes de hoy. */
function localDay(back = 0): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day") - back))
    .toISOString()
    .slice(0, 10);
}

/** Una semana de datos: 10 medicamentos (9 hechos), 3 días difíciles y un ánimo propio. */
async function seedWeek(user: E2EUser, admin: SupabaseClient) {
  const circleId = user.circleId ?? "";
  const reminder = await user.client
    .from("reminders")
    .insert({
      circle_id: circleId,
      created_by: user.userId,
      kind: "medication",
      importance: "important",
      title: "Pastilla de la mañana",
      rule: {
        freq: "once",
        date: localDay(6),
        times: ["08:00"],
        startDate: localDay(6),
      },
    })
    .select("id")
    .single();
  expect(reminder.error).toBeNull();

  const occurrences = Array.from({ length: 10 }, (_, index) => {
    const date = localDay((index % 5) + 1);
    const at = `${date}T${String(12 + Math.floor(index / 5)).padStart(2, "0")}:00:00Z`;
    return {
      reminder_id: reminder.data?.id ?? "",
      circle_id: circleId,
      due_at: at,
      event_at: at,
      local_date: date,
      status: index < 9 ? "done" : "not_done",
      done_at: index < 9 ? at : null,
      done_via: index < 9 ? "app" : null,
    };
  });
  const inserted = await admin.from("reminder_occurrences").insert(occurrences);
  expect(inserted.error).toBeNull();

  const journal = await user.client.from("journal_entries").insert(
    [1, 2, 3].map((back) => ({
      circle_id: circleId,
      author_id: user.userId,
      entry_date: localDay(back),
      day_rating: "dificil",
      moods: [],
    })),
  );
  expect(journal.error).toBeNull();

  const checkin = await user.client.from("selfcare_checkins").insert({
    user_id: user.userId,
    checkin_date: localDay(1),
    score: 4,
  });
  expect(checkin.error).toBeNull();
}

test("el informe semanal muestra la frase, el gráfico con su tabla y el bienestar solo aparte", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true, caredName: "Rosa" });
  await seedWeek(user, admin);
  await login(page, user);

  await page.goto("/informes?periodo=semana");
  await expect(
    page.getByRole("heading", { level: 1, name: "Informes" }),
  ).toBeVisible();
  const card = page.locator("#informe");
  await expect(
    card.getByText("Esta semana se cumplió el 90 % de los medicamentos."),
  ).toBeVisible();
  await expect(card.getByText("Hubo 3 días difíciles.")).toBeVisible();

  // Los mismos valores del gráfico, en una tabla.
  const table = card.locator("table");
  await expect(table).toHaveCount(1);
  await expect(table.locator("tbody tr").first()).toContainText("Medicamentos");
  await expect(table.locator("tbody tr").first()).toContainText("90 %");

  // El bienestar propio está aparte y nunca dentro de lo que se comparte.
  await expect(page.getByText("Solo para ti")).toBeVisible();
  await expect(card.getByText("Respondiste")).toHaveCount(0);
  await expectNoAxeViolations(page);

  // Cambiar de período funciona.
  await page
    .getByRole("navigation", { name: "Período del informe" })
    .getByRole("link", { name: "Día" })
    .click();
  await expect(page).toHaveURL(/periodo=dia/);
  await expect(
    card.getByRole("heading", { name: "Resumen de hoy" }),
  ).toBeVisible();
});

test("sin datos, el informe invita a seguir usando Sole", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await page.goto("/informes");
  await expect(
    page.getByText("Cuando tengas una semana de uso, aquí verás tu resumen."),
  ).toBeVisible();
});

test("compartir avisa primero y, sin navigator.share, descarga la imagen", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true, research: true });
  await seedWeek(user, admin);
  await login(page, user);
  await page.goto("/informes?periodo=semana");

  const share = page.getByRole("button", { name: "Compartir", exact: true });
  await share.click();
  const dialog = page.getByRole("dialog", { name: "Antes de compartir" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText(
      "Lo que compartes sale de Sole y queda bajo tu responsabilidad.",
    ),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Compartir igual" }),
  ).toBeVisible();

  // Cancelar no comparte nada.
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialog).toBeHidden();

  // Este navegador de prueba no tiene navigator.share: se descarga el archivo.
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { value: undefined });
  });
  await share.click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    dialog.getByRole("button", { name: "Compartir igual" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^sole-informe-semana-\d{4}-\d{2}-\d{2}\.png$/,
  );
  await expect(page.locator('p[role="alert"]')).toHaveCount(0);
  await expectNoAxeViolations(page);

  const profile = await admin
    .from("profiles")
    .select("pseudonym_id")
    .eq("id", user.userId)
    .single();
  await expect
    .poll(async () => {
      const { data } = await admin
        .from("events")
        .select("props")
        .eq("pseudonym_id", profile.data?.pseudonym_id ?? "")
        .eq("name", "report.shared");
      return data?.map((row) => row.props);
    })
    .toEqual([{ format: "png" }]);
});

test("la versión para imprimir trae su botón, su estilo de impresión y nada personal", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  await seedWeek(user, admin);
  await login(page, user);

  await page.goto("/informes/imprimir?periodo=mes");
  await expect(
    page.getByRole("button", { name: "Imprimir o guardar como PDF" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("style")).filter((style) =>
          style.textContent?.includes("@media print"),
        ).length,
    ),
  ).toBe(1);
  await expect(
    page.locator("#informe-imprimir").getByText("Este mes se cumplió el", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByText("Respondiste cómo estabas")).toHaveCount(0);
  await expectNoAxeViolations(page);
});
