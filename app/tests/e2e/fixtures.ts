import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Ayudas comunes de las pruebas e2e. Las variables llegan por playwright.config.ts
// (.env.test.local, escrito por `pnpm -C app env:local`).

const CONSENT_VERSION = "2026-11-14";

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name}: corre \`pnpm -C app env:local\`.`);
  }
  return value;
}

export interface E2EUser {
  userId: string;
  email: string;
  password: string;
  /** Presente si se pidió `circle`. */
  circleId: string | null;
  /** Cliente con la sesión de la usuaria (pasa por RLS). */
  client: SupabaseClient;
}

export interface NewUserOptions {
  /** Deja aceptados los consentimientos obligatorios. */
  consents?: boolean;
  /** Además crea un círculo (implica `consents`). */
  circle?: boolean;
  /** Acepta también la investigación. */
  research?: boolean;
  displayName?: string;
  caredName?: string;
}

interface Fixtures {
  admin: SupabaseClient;
  newUser: (options?: NewUserOptions) => Promise<E2EUser>;
  login: (
    page: Page,
    user: Pick<E2EUser, "email" | "password">,
  ) => Promise<void>;
  expectNoAxeViolations: (page: Page) => Promise<void>;
}

function createAdmin(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createUser(
  admin: SupabaseClient,
  options: NewUserOptions = {},
): Promise<E2EUser> {
  const email = `test-${randomUUID()}@example.test`;
  const password = `Aa1${randomUUID()}`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(`No se pudo crear la usuaria: ${created.error?.message}`);
  }
  const userId = created.data.user.id;

  const client = createClient(
    env("SUPABASE_URL"),
    env("SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error) {
    throw new Error(`No se pudo iniciar sesión: ${signedIn.error.message}`);
  }

  let circleId: string | null = null;
  if (options.consents || options.circle) {
    const layers = [
      "terms",
      "sensitive",
      ...(options.research ? ["research"] : []),
    ];
    const consents = await client.from("consents").insert(
      layers.map((layer) => ({
        user_id: userId,
        layer,
        version: CONSENT_VERSION,
        granted: true,
      })),
    );
    if (consents.error) {
      throw new Error(`Consentimientos: ${consents.error.message}`);
    }
  }
  if (options.circle) {
    const displayName = options.displayName ?? "Marta";
    const circle = await client.rpc("create_circle", {
      p_cared_name: options.caredName ?? "Rosa",
      p_relation: "mi mamá",
      p_care_type: "desde_cero",
      p_display_name: displayName,
    });
    if (circle.error || !circle.data) {
      throw new Error(`Círculo: ${circle.error?.message}`);
    }
    circleId = circle.data as string;
    await client
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", userId);
  }

  return { userId, email, password, circleId, client };
}

export const test = base.extend<Fixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright exige desestructurar el primer argumento
  admin: async ({}, use) => {
    await use(createAdmin());
  },

  newUser: async ({ admin }, use) => {
    await use((options) => createUser(admin, options));
  },

  // biome-ignore lint/correctness/noEmptyPattern: Playwright exige desestructurar el primer argumento
  login: async ({}, use) => {
    await use(async (page, user) => {
      await page.goto("/entrar");
      await page.getByText("Entrar con contraseña").click();
      const form = page.locator("details");
      await form.getByLabel("Tu correo").fill(user.email);
      await form.getByLabel("Tu contraseña").fill(user.password);
      await form.getByRole("button", { name: "Entrar" }).click();
      await page.waitForURL((url) => url.pathname !== "/entrar");
    });
  },

  // biome-ignore lint/correctness/noEmptyPattern: Playwright exige desestructurar el primer argumento
  expectNoAxeViolations: async ({}, use) => {
    await use(async (page) => {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const summary = results.violations.map(
        (violation) =>
          `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(" | ")}`,
      );
      expect(summary, `axe en ${page.url()}`).toEqual([]);
    });
  },
});

export { expect };
