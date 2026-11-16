import type { SupabaseClient } from "@supabase/supabase-js";
import { type E2EUser, expect, test } from "./fixtures";

const DAY = 86_400_000;

const BUTTON = "Contarle algo a Sole";
const THANKS = "Gracias. Recibimos tu mensaje.";

async function registeredDaysAgo(
  admin: SupabaseClient,
  user: E2EUser,
  days: number,
) {
  const { error } = await admin
    .from("profiles")
    .update({ created_at: new Date(Date.now() - days * DAY).toISOString() })
    .eq("id", user.userId);
  if (error) {
    throw new Error(`created_at: ${error.message}`);
  }
}

test.describe("Contarle algo a Sole", () => {
  test("se envía un comentario desde Hoy y queda guardado", async ({
    page,
    admin,
    newUser,
    login,
    expectNoAxeViolations,
  }) => {
    const user = await newUser({ circle: true });
    await login(page, user);
    await page.goto("/hoy");

    await page.getByRole("button", { name: BUTTON, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: BUTTON });
    await expect(dialog).toBeVisible();
    await expectNoAxeViolations(page);

    await dialog.getByLabel("Un comentario").check();
    await dialog.getByLabel("Cuéntanos").fill("Me gusta cómo se ve Hoy");
    await dialog.getByRole("button", { name: "Enviar", exact: true }).click();

    await expect(page.getByText(THANKS)).toBeVisible();
    await expect(dialog).toBeHidden();

    await expect
      .poll(async () => {
        const { data } = await admin
          .from("feedback")
          .select("kind, message, screen")
          .eq("user_id", user.userId);
        return data;
      })
      .toEqual([
        {
          kind: "comentario",
          message: "Me gusta cómo se ve Hoy",
          screen: "/hoy",
        },
      ]);
  });

  test("avisa si falta elegir el tipo o escribir el mensaje", async ({
    page,
    admin,
    newUser,
    login,
  }) => {
    const user = await newUser({ circle: true });
    await login(page, user);
    await page.goto("/hoy");

    await page.getByRole("button", { name: BUTTON, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: BUTTON });
    await dialog.getByRole("button", { name: "Enviar", exact: true }).click();

    await expect(
      dialog
        .locator('p[role="alert"]')
        .filter({ hasText: "Elige si es un comentario o un problema." }),
    ).toBeVisible();
    await expect(
      dialog
        .locator('p[role="alert"]')
        .filter({ hasText: "Escribe tu mensaje." }),
    ).toBeVisible();

    const { data } = await admin
      .from("feedback")
      .select("id")
      .eq("user_id", user.userId);
    expect(data).toEqual([]);
  });

  test("el botón también está en otras pantallas de la app", async ({
    page,
    newUser,
    login,
  }) => {
    const user = await newUser({ circle: true });
    await login(page, user);
    await page.goto("/bitacora");
    await expect(
      page.getByRole("button", { name: BUTTON, exact: true }),
    ).toBeVisible();
  });
});

test.describe("Microencuestas", () => {
  test("el día 3 aparece la tarjeta y al responder no vuelve", async ({
    page,
    admin,
    newUser,
    login,
    expectNoAxeViolations,
  }) => {
    const user = await newUser({ circle: true });
    await registeredDaysAgo(admin, user, 3);
    await login(page, user);
    await page.goto("/hoy");

    const question = page.getByText("¿Qué tan fácil te resulta usar Sole?");
    await expect(question).toBeVisible();
    await expectNoAxeViolations(page);

    await page.getByRole("button", { name: "4 · Fácil", exact: true }).click();
    await expect(page.getByText("Gracias por contarnos.")).toBeVisible();

    await expect
      .poll(async () => {
        const { data } = await admin
          .from("survey_responses")
          .select("survey_key, answers, dismissed")
          .eq("user_id", user.userId);
        return data;
      })
      .toEqual([
        { survey_key: "d3", answers: { answer: "4" }, dismissed: false },
      ]);

    await page.reload();
    await expect(page.getByRole("heading", { name: /^Hola/ })).toBeVisible();
    await expect(question).toHaveCount(0);
  });

  test("«Ahora no» cierra la tarjeta y queda guardado", async ({
    page,
    admin,
    newUser,
    login,
  }) => {
    const user = await newUser({ circle: true });
    await registeredDaysAgo(admin, user, 3);
    await login(page, user);
    await page.goto("/hoy");

    await page.getByRole("button", { name: "Ahora no", exact: true }).click();
    await expect(
      page.getByText("¿Qué tan fácil te resulta usar Sole?"),
    ).toHaveCount(0);

    await expect
      .poll(async () => {
        const { data } = await admin
          .from("survey_responses")
          .select("survey_key, dismissed")
          .eq("user_id", user.userId);
        return data;
      })
      .toEqual([{ survey_key: "d3", dismissed: true }]);
  });

  test("el día 2 no hay encuesta", async ({ page, admin, newUser, login }) => {
    const user = await newUser({ circle: true });
    await registeredDaysAgo(admin, user, 2);
    await login(page, user);
    await page.goto("/hoy");
    await expect(
      page.getByRole("button", { name: BUTTON, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Una pregunta rápida")).toHaveCount(0);
  });

  test("el día 28 pregunta cómo se sentiría si Sole dejara de existir", async ({
    page,
    admin,
    newUser,
    login,
  }) => {
    const user = await newUser({ circle: true });
    await registeredDaysAgo(admin, user, 30);
    const seeded = await admin.from("survey_responses").insert([
      { user_id: user.userId, survey_key: "d3", answers: { answer: "5" } },
      { user_id: user.userId, survey_key: "d14", answers: { answer: "si" } },
    ]);
    expect(seeded.error).toBeNull();
    await login(page, user);
    await page.goto("/hoy");

    await expect(
      page.getByText("¿Cómo te sentirías si Sole dejara de existir?"),
    ).toBeVisible();
    for (const label of [
      "Muy decepcionada",
      "Algo decepcionada",
      "No me importaría",
    ]) {
      await expect(
        page.getByRole("button", { name: label, exact: true }),
      ).toBeVisible();
    }
  });
});
