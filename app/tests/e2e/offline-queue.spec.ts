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

test("sin conexión, la marca se guarda en el teléfono y se envía al volver la señal", async ({
  page,
  context,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true });
  const { date, time } = recentTime();
  await user.client.from("reminders").insert({
    circle_id: user.circleId,
    created_by: user.userId,
    kind: "custom",
    title: "Regar las plantas",
    rule: { freq: "once", date, times: [time], startDate: date },
  });
  await login(page, user);
  const item = page
    .getByRole("listitem")
    .filter({ hasText: "Regar las plantas" });
  await expect(item).toBeVisible();

  const occurrence = async () => {
    const { data } = await admin
      .from("reminder_occurrences")
      .select("id, status, done_via")
      .eq("circle_id", user.circleId ?? "")
      .single();
    return data;
  };
  const marks = async () => {
    const { data } = await admin
      .from("occurrence_marks")
      .select("idempotency_key, via, status")
      .eq("circle_id", user.circleId ?? "");
    return data ?? [];
  };

  // Se corta la red y se marca.
  await context.setOffline(true);
  await item.getByRole("button", { name: /^Hecho/ }).click();

  await expect(
    item.getByText("Guardado sin conexión · se enviará cuando vuelva la señal"),
  ).toBeVisible();
  await expect(item.getByText("Hecho ✓")).toBeVisible();

  const live = page.locator('[aria-live="polite"]').filter({
    hasText: /^Sin conexión\./,
  });
  await expect(live).toBeVisible();
  await expect(live).toContainText("1 marca espera señal para enviarse.");

  // En la base todavía no pasó nada.
  expect((await occurrence())?.status).toBe("pending");
  expect(await marks()).toEqual([]);

  // Vuelve la señal: la marca se envía sola.
  await context.setOffline(false);
  await expect
    .poll(async () => (await occurrence())?.status, { timeout: 30_000 })
    .toBe("done");
  expect((await occurrence())?.done_via).toBe("offline_sync");
  const sent = await marks();
  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ via: "offline_sync", status: "done" });

  await expect(page.getByText(/espera señal para enviarse/)).toHaveCount(0, {
    timeout: 30_000,
  });
  await expect(item.getByText("Hecho ✓")).toBeVisible();

  // Reenviar la misma marca (misma clave) no la duplica.
  const row = await occurrence();
  const replay = await page.request.post("/api/occurrences/mark", {
    data: {
      occurrenceId: row?.id,
      status: "done",
      idempotencyKey: sent[0].idempotency_key,
      via: "offline_sync",
    },
  });
  expect(replay.status()).toBe(200);
  expect(await marks()).toHaveLength(1);
});

test("varias marcas sin conexión se envían todas, en orden", async ({
  page,
  context,
  newUser,
  login,
  admin,
}) => {
  const user = await newUser({ circle: true });
  const { date, time } = recentTime();
  await user.client.from("reminders").insert(
    ["Primero", "Segundo"].map((title) => ({
      circle_id: user.circleId,
      created_by: user.userId,
      kind: "custom",
      title,
      rule: { freq: "once", date, times: [time], startDate: date },
    })),
  );
  await login(page, user);
  await expect(page.getByText("Vas 0 de 2 hoy.")).toBeVisible();

  await context.setOffline(true);
  const first = page.getByRole("listitem").filter({ hasText: "Primero" });
  const second = page.getByRole("listitem").filter({ hasText: "Segundo" });
  await first.getByRole("button", { name: /^Hecho/ }).click();
  await expect(first.getByText("Hecho ✓")).toBeVisible();
  await second.getByRole("button", { name: /^No se hizo/ }).click();
  await second.getByRole("button", { name: "No había" }).click();
  await expect(second.getByText("No se hizo · No había")).toBeVisible();
  await expect(
    page.getByText("2 marcas esperan señal para enviarse."),
  ).toBeVisible();

  await context.setOffline(false);
  await expect
    .poll(
      async () => {
        const { data } = await admin
          .from("reminder_occurrences")
          .select("status, not_done_reason, reminder:reminders(title)")
          .eq("circle_id", user.circleId ?? "");
        return (data ?? [])
          .map(
            (row) =>
              `${(row.reminder as unknown as { title: string }).title}:${row.status}:${row.not_done_reason}`,
          )
          .sort();
      },
      { timeout: 30_000 },
    )
    .toEqual(["Primero:done:null", "Segundo:not_done:no_habia"]);
  await expect(page.getByText("Vas 1 de 2 hoy.")).toBeVisible({
    timeout: 30_000,
  });
});
