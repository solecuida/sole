import { beforeAll, describe, expect, it } from "vitest";
import { DOORS as EVENT_DOORS } from "@/server/events/catalog";
import {
  DOORS,
  FAMILY_ENABLED,
  findDoor,
  getInterest,
  registerInterest,
  visibleDoors,
} from "@/server/fake-doors/doors";
import { adminClient, createTestUser, type TestUser } from "./helpers";

let ana: TestUser;
let bea: TestUser;

async function rows(userId: string, doorKey: string) {
  const { data, error } = await adminClient()
    .from("fake_door_interest")
    .select("door_key, choice, notify_me")
    .eq("user_id", userId)
    .eq("door_key", doorKey);
  expect(error).toBeNull();
  return data ?? [];
}

beforeAll(async () => {
  [ana, bea] = await Promise.all([
    createTestUser({ consents: true }),
    createTestUser({ consents: true }),
  ]);
});

describe("visibleDoors", () => {
  it("incluye invitar-familiar con false y lo excluye con true", () => {
    expect(visibleDoors(false).map((door) => door.slug)).toContain(
      "invitar-familiar",
    );
    expect(visibleDoors(true).map((door) => door.slug)).not.toContain(
      "invitar-familiar",
    );
    expect(visibleDoors(true)).toHaveLength(DOORS.length - 1);
  });

  it("usa FAMILY_ENABLED por defecto", () => {
    expect(visibleDoors()).toEqual(visibleDoors(FAMILY_ENABLED));
  });

  it("sus claves son las del catálogo de eventos y las de la base", () => {
    expect(DOORS.map((door) => door.key).sort()).toEqual(
      [...EVENT_DOORS].sort(),
    );
  });

  it("findDoor no encuentra slugs desconocidos ni la puerta oculta", () => {
    expect(findDoor("no-existe")).toBeUndefined();
    expect(findDoor("plan-familiar")?.key).toBe("plan_familiar");
    expect(findDoor("invitar-familiar", true)).toBeUndefined();
  });
});

describe("registerInterest", () => {
  it("guarda «Sí, avísame» con notify_me verdadero", async () => {
    const result = await registerInterest(ana.client, ana.userId, "ia", {
      notifyMe: true,
    });
    expect(result.ok).toBe(true);
    expect(await rows(ana.userId, "ia")).toEqual([
      { door_key: "ia", choice: null, notify_me: true },
    ]);
  });

  it("guarda el precio elegido del plan familiar", async () => {
    const result = await registerInterest(
      ana.client,
      ana.userId,
      "plan_familiar",
      { notifyMe: true, choice: "4990" },
    );
    expect(result.ok).toBe(true);
    const mine = await getInterest(ana.client, ana.userId, "plan_familiar");
    expect(mine).toEqual({ notifyMe: true, choice: "4990" });
  });

  it("al responder de nuevo, la última respuesta es la que se lee", async () => {
    await registerInterest(bea.client, bea.userId, "comunidad", {
      notifyMe: true,
    });
    await registerInterest(bea.client, bea.userId, "comunidad", {
      notifyMe: false,
    });
    expect(await getInterest(bea.client, bea.userId, "comunidad")).toEqual({
      notifyMe: false,
      choice: null,
    });
  });

  it("rechaza puertas desconocidas y precios fuera del plan familiar", async () => {
    const unknown = await registerInterest(ana.client, ana.userId, "otra", {
      notifyMe: true,
    });
    expect(unknown.ok).toBe(false);
    const wrongDoor = await registerInterest(ana.client, ana.userId, "fotos", {
      notifyMe: true,
      choice: "2990",
    });
    expect(wrongDoor.ok).toBe(false);
    expect(await rows(ana.userId, "fotos")).toEqual([]);
  });

  it("no deja registrar a nombre de otra persona", async () => {
    const result = await registerInterest(bea.client, ana.userId, "recetas", {
      notifyMe: true,
    });
    expect(result.ok).toBe(false);
    expect(await rows(ana.userId, "recetas")).toEqual([]);
  });

  it("cada persona lee solo lo suyo", async () => {
    expect(await getInterest(bea.client, bea.userId, "ia")).toBeNull();
    const { data } = await bea.client
      .from("fake_door_interest")
      .select("user_id");
    expect((data ?? []).every((row) => row.user_id === bea.userId)).toBe(true);
  });

  it("nadie puede cambiar una respuesta ya guardada", async () => {
    const update = await ana.client
      .from("fake_door_interest")
      .update({ notify_me: false })
      .eq("user_id", ana.userId);
    expect(update.error?.code).toBe("42501");
  });
});
