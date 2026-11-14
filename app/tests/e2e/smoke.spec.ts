import { expect, test } from "@playwright/test";

test("la app construida responde su salud", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.data.status).toBe("ok");
});
