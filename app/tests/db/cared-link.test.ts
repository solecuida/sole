import { beforeAll, describe, expect, it } from "vitest";
import { POST } from "@/app/api/v/[token]/listo/route";
import { encryptField } from "@/lib/crypto/field";
import {
  createLink,
  hashToken,
  LINK_DAYS,
  listLinks,
  MAX_ACTIVE_LINKS,
  markDoneFromLink,
  resolveLink,
  revokeLink,
  visibleToday,
} from "@/server/cared-link/links";
import { localDateOf } from "@/server/reminders/recurrence";
import {
  adminClient,
  createCircleFor,
  createTestUser,
  type TestUser,
} from "./helpers";

const admin = adminClient();
const NOW = new Date();
const DAY = 86_400_000;
const TZ = "America/Santiago";
const TODAY = localDateOf(NOW, TZ);
const YESTERDAY = localDateOf(new Date(NOW.getTime() - DAY), TZ);

interface Seed {
  user: TestUser;
  circleId: string;
  visibleId: string;
  hiddenId: string;
  yesterdayId: string;
}

/** Un círculo con un ítem visible de hoy, uno no visible y uno visible de ayer. */
async function seed(): Promise<Seed> {
  const user = await createTestUser({ consents: true });
  const circleId = await createCircleFor(user.client, "Marta");

  const reminder = async (title: string, visible: boolean) => {
    const { data, error } = await user.client
      .from("reminders")
      .insert({
        circle_id: circleId,
        created_by: user.userId,
        kind: "medication",
        title,
        med_name_enc: encryptField("Losartán secreto", "reminders.med_name"),
        visible_to_cared: visible,
        // Empieza lejos: así la preparación automática no agrega ítems de hoy.
        rule: { freq: "daily", times: ["08:00"], startDate: "2099-01-01" },
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    return data?.id ?? "";
  };
  const occurrence = async (reminderId: string, localDate: string) => {
    const at = `${localDate}T12:00:00Z`;
    const { data, error } = await admin
      .from("reminder_occurrences")
      .insert({
        reminder_id: reminderId,
        circle_id: circleId,
        due_at: at,
        event_at: at,
        local_date: localDate,
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    return data?.id ?? "";
  };

  const visible = await reminder("Tomar agua", true);
  const hidden = await reminder("Remedio de la noche", false);
  return {
    user,
    circleId,
    visibleId: await occurrence(visible, TODAY),
    hiddenId: await occurrence(hidden, TODAY),
    yesterdayId: await occurrence(visible, YESTERDAY),
  };
}

async function newLink(seedData: Seed, label = "Tablet") {
  const created = await createLink(
    seedData.user.client,
    seedData.user.userId,
    seedData.circleId,
    label,
    NOW,
  );
  if (!created.ok) {
    throw new Error(`createLink: ${created.error.code}`);
  }
  return created.data;
}

async function statusOf(occurrenceId: string) {
  const { data } = await admin
    .from("reminder_occurrences")
    .select("status, done_via, done_by, done_at")
    .eq("id", occurrenceId)
    .single();
  return data;
}

function callListo(token: string, body: unknown): Promise<Response> {
  return POST(
    new Request(`http://localhost:3000/api/v/${token}/listo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ token }) },
  );
}

let base: Seed;

beforeAll(async () => {
  base = await seed();
});

describe("createLink", () => {
  it("devuelve un enlace de 43 caracteres, guarda solo su huella y vence a los 90 días", async () => {
    const link = await newLink(base, "  Tablet de la mamá  ");
    expect(link.token).toMatch(/^[A-Za-z0-9_-]{43,}$/);
    expect(new Date(link.expiresAt).getTime()).toBe(
      NOW.getTime() + LINK_DAYS * DAY,
    );

    const { data: row } = await admin
      .from("cared_links")
      .select("*")
      .eq("id", link.linkId)
      .single();
    expect(row?.token_hash).toBe(hashToken(link.token));
    expect(row?.token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row?.label).toBe("Tablet de la mamá");
    expect(new Date(row?.expires_at ?? 0).getTime()).toBe(
      NOW.getTime() + LINK_DAYS * DAY,
    );
    // El enlace en claro no queda en ninguna columna.
    expect(JSON.stringify(row)).not.toContain(link.token);
  });

  it("dos enlaces nunca son iguales", async () => {
    const other = await seed();
    const first = await newLink(other);
    const second = await newLink(other);
    expect(first.token).not.toBe(second.token);
  });

  it("un familiar recibe forbidden, y alguien de otro círculo también", async () => {
    const family = await createTestUser({ consents: true });
    const member = await admin.from("circle_members").insert({
      circle_id: base.circleId,
      user_id: family.userId,
      role: "family",
      display_name: "Pedro",
    });
    expect(member.error).toBeNull();
    const stranger = await createTestUser({ consents: true });

    for (const user of [family, stranger]) {
      const result = await createLink(
        user.client,
        user.userId,
        base.circleId,
        "x",
        NOW,
      );
      expect(result).toMatchObject({
        ok: false,
        error: { code: "forbidden" },
      });
    }
    // Y un familiar tampoco puede leer ni revocar los vínculos.
    const link = await newLink(base);
    expect(await listLinks(family.client, base.circleId, NOW)).toEqual([]);
    expect(await revokeLink(family.client, link.linkId, NOW)).toMatchObject({
      ok: false,
      error: { code: "not_found" },
    });
    expect(await resolveLink(admin, link.token, NOW)).not.toBeNull();
  });

  it("no deja pasar del tope de vínculos vigentes", async () => {
    const other = await seed();
    for (let i = 0; i < MAX_ACTIVE_LINKS; i += 1) {
      await newLink(other, `Vínculo ${i}`);
    }
    const extra = await createLink(
      other.user.client,
      other.user.userId,
      other.circleId,
      "uno más",
      NOW,
    );
    expect(extra).toMatchObject({ ok: false, error: { code: "conflict" } });
  });
});

describe("resolveLink", () => {
  it("devuelve el círculo del enlace y anota el uso", async () => {
    const link = await newLink(base);
    const resolved = await resolveLink(admin, link.token, NOW);
    expect(resolved).toEqual({
      linkId: link.linkId,
      circleId: base.circleId,
      caredName: "Persona de prueba",
      timezone: TZ,
    });
    const { data } = await admin
      .from("cared_links")
      .select("last_used_at")
      .eq("id", link.linkId)
      .single();
    expect(new Date(data?.last_used_at ?? 0).getTime()).toBe(NOW.getTime());
  });

  it("devuelve null para un enlace inventado, mal formado o que es la huella", async () => {
    const link = await newLink(base);
    const invented = "A".repeat(43);
    for (const token of [
      invented,
      "",
      "corto",
      `${link.token}x`,
      link.token.slice(0, 42),
      hashToken(link.token),
      "../../etc/passwd",
    ]) {
      expect(await resolveLink(admin, token, NOW)).toBeNull();
    }
  });

  it("revocado, vencido o con el círculo cerrado deja de servir", async () => {
    const other = await seed();
    const revoked = await newLink(other);
    const expired = await newLink(other);
    const closing = await seed();
    const closed = await newLink(closing);

    expect((await revokeLink(other.user.client, revoked.linkId, NOW)).ok).toBe(
      true,
    );
    expect(await resolveLink(admin, revoked.token, NOW)).toBeNull();

    // El mismo enlace, visto 90 días después (y un instante antes sí sirve).
    const almost = new Date(NOW.getTime() + LINK_DAYS * DAY - 1000);
    const after = new Date(NOW.getTime() + LINK_DAYS * DAY);
    expect(await resolveLink(admin, expired.token, almost)).not.toBeNull();
    expect(await resolveLink(admin, expired.token, after)).toBeNull();

    await admin
      .from("circles")
      .update({ closed_at: NOW.toISOString() })
      .eq("id", closing.circleId);
    expect(await resolveLink(admin, closed.token, NOW)).toBeNull();

    const states = await listLinks(other.user.client, other.circleId, after);
    expect(states.map((link) => link.state).sort()).toEqual([
      "expired",
      "revoked",
    ]);
    // La lista nunca trae la huella.
    expect(JSON.stringify(states)).not.toContain(hashToken(revoked.token));
  });
});

describe("visibleToday", () => {
  it("trae solo los ítems de hoy de recordatorios visibles, sin datos del medicamento", async () => {
    const items = await visibleToday(admin, base.circleId, NOW);
    expect(items.map((item) => item.id)).toEqual([base.visibleId]);
    expect(Object.keys(items[0]).sort()).toEqual([
      "done",
      "id",
      "time",
      "title",
    ]);
    expect(items[0]).toMatchObject({ title: "Tomar agua", done: false });
    expect(items[0].time).toMatch(/^\d{2}:\d{2}$/);
    expect(JSON.stringify(items)).not.toContain("Losartán");
  });
});

describe("markDoneFromLink y POST /api/v/<token>/listo", () => {
  it("marca un ítem visible como hecho por el vínculo, sin persona", async () => {
    const mine = await seed();
    const link = await newLink(mine);
    const response = await callListo(link.token, {
      occurrenceId: mine.visibleId,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      data: { occurrenceId: mine.visibleId, status: "done" },
    });
    const row = await statusOf(mine.visibleId);
    expect(row).toMatchObject({
      status: "done",
      done_via: "cared_link",
      done_by: null,
    });
    expect(row?.done_at).not.toBeNull();
    // La vista lo muestra hecho, y repetir no cambia nada.
    const items = await visibleToday(admin, mine.circleId, NOW);
    expect(items[0].done).toBe(true);
    expect(
      (await callListo(link.token, { occurrenceId: mine.visibleId })).status,
    ).toBe(200);
    expect((await statusOf(mine.visibleId))?.done_at).toBe(row?.done_at);
  });

  it("responde 404 y no cambia nada con un ítem no visible, de ayer, de otro círculo o inexistente", async () => {
    const mine = await seed();
    const theirs = await seed();
    const link = await newLink(mine);
    for (const occurrenceId of [
      mine.hiddenId,
      mine.yesterdayId,
      theirs.visibleId,
      "00000000-0000-4000-8000-000000000000",
      "no-es-un-id",
    ]) {
      const response = await callListo(link.token, { occurrenceId });
      expect(response.status, occurrenceId).toBe(404);
    }
    expect((await callListo(link.token, {})).status).toBe(404);
    for (const id of [mine.hiddenId, mine.yesterdayId, theirs.visibleId]) {
      expect(await statusOf(id)).toMatchObject({
        status: "pending",
        done_via: null,
      });
    }
  });

  it("no pisa quién lo hizo si la cuidadora ya lo había marcado", async () => {
    const mine = await seed();
    const link = await newLink(mine);
    await admin
      .from("reminder_occurrences")
      .update({
        status: "done",
        done_via: "app",
        done_by: mine.user.userId,
        done_at: "2026-01-01T00:00:00Z",
      })
      .eq("id", mine.visibleId);
    const resolved = await resolveLink(admin, link.token, NOW);
    if (!resolved) {
      throw new Error("el vínculo debía servir");
    }
    const result = await markDoneFromLink(admin, resolved, mine.visibleId, NOW);
    expect(result.ok).toBe(true);
    expect(await statusOf(mine.visibleId)).toMatchObject({
      done_via: "app",
      done_by: mine.user.userId,
    });
  });

  it("con el enlace revocado, vencido o inventado responde 404 y no marca", async () => {
    const mine = await seed();
    const revoked = await newLink(mine);
    await revokeLink(mine.user.client, revoked.linkId, NOW);
    const expired = await newLink(mine);
    await admin
      .from("cared_links")
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq("id", expired.linkId);

    for (const token of [revoked.token, expired.token, "B".repeat(43)]) {
      const response = await callListo(token, {
        occurrenceId: mine.visibleId,
      });
      expect(response.status).toBe(404);
      expect((await response.json()).error.code).toBe("not_found");
    }
    expect((await statusOf(mine.visibleId))?.status).toBe("pending");
  });

  it("después de 30 marcas en 10 minutos responde 429", async () => {
    const mine = await seed();
    const link = await newLink(mine);
    let last = 0;
    for (let i = 0; i < 31; i += 1) {
      last = (await callListo(link.token, { occurrenceId: mine.visibleId }))
        .status;
    }
    expect(last).toBe(429);
  });
});
