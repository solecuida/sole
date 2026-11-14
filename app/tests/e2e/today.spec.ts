import type { SupabaseClient } from "@supabase/supabase-js";
import { type E2EUser, expect, test } from "./fixtures";

const TZ = "America/Santiago";

/** Fecha y hora locales de Chile ahora mismo. */
function localNow() {
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
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** Una hora de hoy que ya pasó hace muy poco (o 00:00 recién pasada la medianoche). */
function recentTime(): { date: string; time: string } {
  const { date, minutes } = localNow();
  const at = Math.max(minutes - 2, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return { date, time: `${pad(Math.floor(at / 60))}:${pad(at % 60)}` };
}

async function addItem(
  user: E2EUser,
  circleId: string | null,
  title: string,
  importance = "normal",
) {
  const { date, time } = recentTime();
  const { error } = await user.client.from("reminders").insert({
    circle_id: circleId,
    created_by: user.userId,
    kind: "custom",
    importance,
    title,
    rule: { freq: "once", date, times: [time], startDate: date },
  });
  if (error) {
    throw new Error(`recordatorio: ${error.message}`);
  }
}

async function statusOf(admin: SupabaseClient, circleId: string | null) {
  const { data } = await admin
    .from("reminder_occurrences")
    .select("status, not_done_reason, snoozed_until, reminder:reminders(title)")
    .eq("circle_id", circleId ?? "");
  return Object.fromEntries(
    (data ?? []).map((row) => [
      (row.reminder as unknown as { title: string }).title,
      row,
    ]),
  );
}

test("marcar hecho, no se hizo con motivo y posponer, sin recargar la página", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  const user = await newUser({ circle: true });
  await addItem(user, user.circleId, "Remedio de la mañana", "important");
  await addItem(user, user.circleId, "Almuerzo");
  await addItem(user, user.circleId, "Caminata", "whenever");
  await login(page, user);

  await expect(page.getByText("Vas 0 de 3 hoy.")).toBeVisible();
  for (const heading of ["Importante", "Normal", "Cuando puedas"]) {
    await expect(
      page.getByRole("heading", { level: 2, name: heading }),
    ).toBeVisible();
  }
  await expectNoAxeViolations(page);

  // Marca que se pierde si la página se recarga entera.
  await page.evaluate(() => {
    (window as unknown as { __sinRecarga: boolean }).__sinRecarga = true;
  });

  // Hecho
  const medicine = page
    .getByRole("listitem")
    .filter({ hasText: "Remedio de la mañana" });
  await medicine.getByRole("button", { name: /^Hecho/ }).click();
  await expect(medicine.getByText("Hecho ✓")).toBeVisible();
  await expect(page.getByText("Vas 1 de 3 hoy.")).toBeVisible();

  // No se hizo, con motivo
  const lunch = page.getByRole("listitem").filter({ hasText: "Almuerzo" });
  await lunch.getByRole("button", { name: /^No se hizo/ }).click();
  for (const reason of ["Lo rechazó", "No había", "Otro"]) {
    await expect(lunch.getByRole("button", { name: reason })).toBeVisible();
  }
  await expectNoAxeViolations(page);
  await lunch.getByRole("button", { name: "Lo rechazó" }).click();
  await expect(lunch.getByText("No se hizo · Lo rechazó")).toBeVisible();

  // Posponer
  const walk = page.getByRole("listitem").filter({ hasText: "Caminata" });
  await walk.getByRole("button", { name: /^Posponer/ }).click();
  await walk.getByRole("button", { name: "30 minutos" }).click();
  await expect(walk.getByText(/^Pospuesto/)).toBeVisible();

  expect(
    await page.evaluate(
      () => (window as unknown as { __sinRecarga?: boolean }).__sinRecarga,
    ),
  ).toBe(true);
  await expectNoAxeViolations(page);

  await expect
    .poll(async () => {
      const rows = await statusOf(admin, user.circleId);
      return [
        rows["Remedio de la mañana"]?.status,
        rows.Almuerzo?.status,
        rows.Almuerzo?.not_done_reason,
        rows.Caminata?.status,
      ];
    })
    .toEqual(["done", "not_done", "rechazo", "snoozed"]);

  // Se puede corregir una marca.
  await medicine
    .getByRole("button", { name: "Cambiar Remedio de la mañana" })
    .click();
  await medicine.getByRole("button", { name: /^No se hizo/ }).click();
  await medicine.getByRole("button", { name: "No había" }).click();
  await expect(medicine.getByText("No se hizo · No había")).toBeVisible();
});

test("con dos círculos, el cambiador muestra solo lo de cada persona", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true, caredName: "Rosa" });
  const second = await user.client.rpc("create_circle", {
    p_cared_name: "Tía Sole",
    p_relation: "mi tía",
    p_care_type: "desde_cero",
    p_display_name: "Marta",
  });
  const secondId = second.data as string;
  await addItem(user, user.circleId, "Cosa de la Rosa");
  await addItem(user, secondId, "Cosa de la tía Sole");
  await login(page, user);

  await expect(page.getByText("Estás viendo: Rosa")).toBeVisible();
  await expect(page.getByText("Cosa de la Rosa")).toBeVisible();
  await expect(page.getByText("Cosa de la tía Sole")).toHaveCount(0);

  await page.getByRole("link", { name: "Ver a Tía Sole" }).click();
  await expect(page).toHaveURL(new RegExp(`/hoy\\?c=${secondId}$`));
  await expect(page.getByText("Estás viendo: Tía Sole")).toBeVisible();
  await expect(page.getByText("Cosa de la tía Sole")).toBeVisible();
  await expect(page.getByText("Cosa de la Rosa")).toHaveCount(0);
});

test("con un solo círculo no aparece el cambiador y un día vacío invita a agregar", async ({
  page,
  newUser,
  login,
}) => {
  const user = await newUser({ circle: true });
  await login(page, user);
  await expect(page.getByText(/^Estás viendo:/)).toHaveCount(0);
  await expect(page.getByText(/Hoy no hay nada pendiente/)).toBeVisible();
  await page.getByRole("link", { name: "agrega un recordatorio" }).click();
  await expect(page).toHaveURL(/\/recordatorios\/editar\?c=/);
});

test("aceptar la actividad del día la deja en «Cuando puedas»", async ({
  page,
  newUser,
  login,
  admin,
  expectNoAxeViolations,
}) => {
  // El consejo del día depende de la fecha. Para que hoy sea una actividad, se
  // desactivan los demás consejos mientras dura la prueba y se restauran al final.
  const { data: others } = await admin
    .from("tips")
    .select("id, activity_title")
    .eq("active", true);
  const ids = (others ?? [])
    .filter((row) => row.activity_title !== "Caminata de 10 minutos")
    .map((row) => row.id);
  await admin.from("tips").update({ active: false }).in("id", ids);
  try {
    const user = await newUser({ circle: true });
    await login(page, user);
    await expect(
      page.getByText("¿Una caminata de 10 minutos hoy?"),
    ).toBeVisible();
    await expectNoAxeViolations(page);
    await page
      .getByRole("button", { name: "Aceptar: Caminata de 10 minutos" })
      .click();
    await expect(page.getByText("Listo, quedó en tu día.")).toBeVisible();

    const group = page.getByRole("region", { name: "Cuando puedas" });
    await expect(group.getByText("Caminata de 10 minutos")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Aceptar: Caminata de 10 minutos" }),
    ).toHaveCount(0);

    const { data } = await admin
      .from("reminders")
      .select("title, source, importance, rule")
      .eq("circle_id", user.circleId ?? "");
    expect(data).toHaveLength(1);
    expect(data?.[0]).toMatchObject({
      title: "Caminata de 10 minutos",
      source: "tip",
      importance: "whenever",
    });
    expect(data?.[0]?.rule).toMatchObject({ freq: "once" });
  } finally {
    await admin.from("tips").update({ active: true }).in("id", ids);
  }
});
