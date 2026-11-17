import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Las pruebas corren con cwd = app/; el sitio estático vive en ../web.
const root = path.resolve(process.cwd(), "..");
const webDir = path.join(root, "web");
const srcDir = path.join(root, "app", "src");

const pages = readdirSync(webDir)
  .filter((name) => name.endsWith(".html"))
  .sort();
const html = new Map(
  pages.map((name) => [name, readFileSync(path.join(webDir, name), "utf8")]),
);

/** Todos los archivos de un árbol (sin node_modules ni .next). */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const textExtensions = /\.(html|css|js|svg|txt|xml|ts|tsx|json|md)$/;

const titleOf = (page: string) =>
  /<title>([\s\S]*?)<\/title>/i.exec(html.get(page) ?? "")?.[1]?.trim();
const descriptionOf = (page: string) =>
  /<meta\s+name="description"\s+content="([^"]*)"/i.exec(
    html.get(page) ?? "",
  )?.[1];

/** Quita etiquetas y entidades simples para comparar textos. */
const plain = (value: string) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

// Existen solo en Vercel o son opcionales por diseño.
const excepciones = new Set([
  "_vercel/insights/script.js",
  "assets/retrato.jpg",
]);

describe("web: títulos, descripciones y h1", () => {
  it("hay páginas que revisar", () => {
    expect(pages).toContain("index.html");
  });

  it("cada página tiene un título único", () => {
    const titles = pages.map((page) => titleOf(page));
    for (const [i, title] of titles.entries()) {
      expect(title, `${pages[i]} sin <title>`).toBeTruthy();
    }
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("cada página salvo 404.html tiene una descripción única", () => {
    const withDescription = pages.filter((page) => page !== "404.html");
    const descriptions = withDescription.map((page) => descriptionOf(page));
    for (const [i, description] of descriptions.entries()) {
      expect(description, `${withDescription[i]} sin descripción`).toBeTruthy();
    }
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("cada página tiene un solo h1, distinto del título", () => {
    for (const page of pages) {
      const h1s = [
        ...(html.get(page) ?? "").matchAll(/<h1[\s>][\s\S]*?<\/h1>/gi),
      ];
      expect(h1s.length, `${page}: debe tener un solo <h1>`).toBe(1);
      const h1 = plain(h1s[0]?.[0] ?? "");
      expect(h1, `${page}: h1 vacío`).not.toBe("");
      expect(h1, `${page}: h1 igual al título`).not.toBe(
        plain(titleOf(page) ?? ""),
      );
    }
  });
});

describe("web: enlaces internos", () => {
  it("todo href y src interno existe en web/", () => {
    const missing: string[] = [];
    for (const page of pages) {
      const content = html.get(page) ?? "";
      for (const match of content.matchAll(/\b(?:href|src)="([^"]*)"/gi)) {
        const raw = match[1] ?? "";
        if (!raw || raw.startsWith("#") || raw.startsWith("data:")) continue;
        if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//")) continue;
        const clean = raw.split("#")[0]?.split("?")[0] ?? "";
        const relative = clean.replace(/^\//, "") || "index.html";
        if (excepciones.has(relative)) continue;
        if (!existsSync(path.join(webDir, relative))) {
          missing.push(`${page} -> ${raw}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("web: lo que nunca debe aparecer", () => {
  const files = [...walk(webDir), ...walk(srcDir)].filter((file) =>
    textExtensions.test(file),
  );

  it("no enlaza a WhatsApp", () => {
    const found = files.filter((file) =>
      /wa\.me|api\.whatsapp\.com|whatsapp:/i.test(readFileSync(file, "utf8")),
    );
    expect(found).toEqual([]);
  });

  it("no dice «en memoria» (la tía Sole está viva)", () => {
    const found = files.filter((file) =>
      /en memoria/i.test(readFileSync(file, "utf8")),
    );
    expect(found).toEqual([]);
  });

  it("no declara LocalBusiness", () => {
    const found = files.filter((file) =>
      /LocalBusiness/.test(readFileSync(file, "utf8")),
    );
    expect(found).toEqual([]);
  });
});

describe("web: sitemap.xml", () => {
  const sitemap = readFileSync(path.join(webDir, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1] ?? "",
  );
  const fileOf = (url: string) =>
    new URL(url).pathname.replace(/^\//, "") || "index.html";
  const noindex = (page: string) =>
    /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html.get(page) ?? "");

  it("lista toda página salvo 404.html y las noindex", () => {
    const listed = new Set(urls.map(fileOf));
    const expected = pages.filter(
      (page) => page !== "404.html" && !noindex(page),
    );
    const missing = expected.filter((page) => !listed.has(page));
    expect(missing).toEqual([]);
  });

  it("toda URL del sitemap existe en web/", () => {
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(existsSync(path.join(webDir, fileOf(url))), url).toBe(true);
    }
  });
});

describe("web: pie v2", () => {
  // Solo las páginas que ya traen data-pie="v2" (las demás cambian en los
  // pasos 61 a 63, cuando se les agrega el pie nuevo).
  const withPie = pages.filter((page) =>
    /data-pie="v2"/.test(html.get(page) ?? ""),
  );

  it("las páginas con pie v2 enlazan los textos legales y el favicon", () => {
    for (const page of withPie) {
      const content = html.get(page) ?? "";
      for (const target of [
        "privacidad.html",
        "terminos.html",
        "cookies.html",
      ]) {
        expect(
          new RegExp(`href="/?${target.replace(".", ".")}"`).test(content),
          `${page} sin enlace a ${target}`,
        ).toBe(true);
      }
      expect(
        /<link\s+rel="icon"\s+href="\/favicon\.svg"/.test(content),
        `${page} sin favicon.svg`,
      ).toBe(true);
    }
  });

  it("web/favicon.svg existe y es un SVG", () => {
    const file = path.join(webDir, "favicon.svg");
    expect(statSync(file).size).toBeGreaterThan(0);
    expect(readFileSync(file, "utf8")).toContain("<svg");
  });
});
