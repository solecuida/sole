import { expect, test } from "./fixtures";

const MONTH = "2027-03";

test("el informe para el médico muestra la etiqueta Premium, el botón de imprimir y registra el uso", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({
    circle: true,
    research: true,
    caredName: "Rosa",
  });
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
        date: `${MONTH}-01`,
        times: ["08:00"],
        startDate: `${MONTH}-01`,
      },
    })
    .select("id")
    .single();
  expect(reminder.error).toBeNull();

  const occurrences = Array.from({ length: 10 }, (_, index) => {
    const date = `${MONTH}-${String(index + 1).padStart(2, "0")}`;
    const at = `${date}T12:00:00Z`;
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
    [1, 2, 3].map((day) => ({
      circle_id: circleId,
      author_id: user.userId,
      entry_date: `${MONTH}-0${day}`,
      day_rating: "dificil",
      moods: [],
    })),
  );
  expect(journal.error).toBeNull();

  const checkin = await user.client.from("selfcare_checkins").insert({
    user_id: user.userId,
    checkin_date: `${MONTH}-02`,
    score: 4,
  });
  expect(checkin.error).toBeNull();

  await login(page, user);
  const url = `/informes/medico?mes=${MONTH}`;
  await expect(async () => {
    await page.goto(url).catch(() => undefined);
    await expect(page).toHaveURL(/informes\/medico/);
  }).toPass({ timeout: 20_000 });

  await expect(
    page.getByRole("heading", { level: 1, name: "Informe para el médico" }),
  ).toBeVisible();
  const report = page.locator("#informe-medico");
  await expect(
    page
      .getByText("Premium · gratis durante el piloto", { exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    report.getByText("Premium · gratis durante el piloto", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Imprimir o guardar como PDF" }),
  ).toBeVisible();
  await expect(report.getByText("Pastilla de la mañana")).toBeVisible();
  await expect(report.getByText("90 %")).toBeVisible();
  await expect(report.getByText("Días difíciles: 3")).toBeVisible();
  await expect(
    report.getByRole("heading", {
      name: "Preguntas de la familia para el control",
    }),
  ).toBeVisible();

  // Una hoja A4 y nada de bienestar propio.
  expect(
    await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("style")).filter(
          (style) =>
            style.textContent?.includes("@media print") &&
            style.textContent?.includes("size: A4"),
        ).length,
    ),
  ).toBe(1);
  await expect(page.getByText("Respondiste cómo estabas")).toHaveCount(0);
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
        .eq("name", "premium.used");
      return data?.map((row) => row.props);
    })
    .toEqual([{ feature: "informe_medico" }]);
});

test("sin consentimiento de investigación no se guarda el evento premium.used", async ({
  page,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await expect(async () => {
    await page.goto(`/informes/medico?mes=${MONTH}`).catch(() => undefined);
    await expect(page).toHaveURL(/informes\/medico/);
  }).toPass({ timeout: 20_000 });
  await expect(
    page.getByText("No hay registros en marzo de 2027."),
  ).toBeVisible();

  const profile = await admin
    .from("profiles")
    .select("pseudonym_id")
    .eq("id", user.userId)
    .single();
  const { data } = await admin
    .from("events")
    .select("props")
    .eq("pseudonym_id", profile.data?.pseudonym_id ?? "")
    .eq("name", "premium.used");
  expect(data ?? []).toHaveLength(0);
});
