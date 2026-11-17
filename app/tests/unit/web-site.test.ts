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
  "assets/retrato.webp",
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
  // Revisa las páginas que traen data-pie="v2"; abajo se exige que sean todas.
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

  it("todas las páginas llevan el pie v2", () => {
    const sin = pages.filter(
      (page) => !/data-pie="v2"/.test(html.get(page) ?? ""),
    );
    expect(
      sin,
      `Estas páginas no tienen data-pie="v2" (pie nuevo con textos legales): ${sin.join(", ")}`,
    ).toEqual([]);
  });
});

describe("web: datos estructurados", () => {
  const jsonLd = (page: string) =>
    [
      ...(html.get(page) ?? "").matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      ),
    ].map((match) => match[1] ?? "");

  it("index.html declara Organization y WebSite en JSON-LD válido", () => {
    const blocks = jsonLd("index.html");
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) expect(() => JSON.parse(block)).not.toThrow();
    const all = blocks.join(" ");
    expect(all).toMatch(/"@type":\s*"Organization"/);
    expect(all).toMatch(/"@type":\s*"WebSite"/);
  });

  it("probar.html declara FAQPage en JSON-LD válido", () => {
    const blocks = jsonLd("probar.html");
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) expect(() => JSON.parse(block)).not.toThrow();
    expect(blocks.join(" ")).toMatch(/"@type":\s*"FAQPage"/);
  });
});

describe("web: imágenes", () => {
  it("todo <img> tiene alt, width, height y un src .webp, .avif o .svg", () => {
    const problemas: string[] = [];
    for (const page of pages) {
      for (const match of (html.get(page) ?? "").matchAll(/<img\b[^>]*>/gi)) {
        const tag = match[0];
        for (const attr of ["alt", "width", "height"]) {
          if (!new RegExp(`\\s${attr}="`, "i").test(tag)) {
            problemas.push(`${page}: <img> sin ${attr}`);
          }
        }
        const src = /\ssrc="([^"]*)"/i.exec(tag)?.[1] ?? "";
        if (!/\.(webp|avif|svg)$/i.test(src.split("?")[0] ?? "")) {
          problemas.push(`${page}: src "${src}" no es .webp, .avif ni .svg`);
        }
      }
    }
    expect(problemas).toEqual([]);
  });

  it("ninguna imagen raster de web/ pesa 200 KB o más (salvo la portada social)", () => {
    const pesadas = walk(webDir)
      .filter((file) => /\.(png|jpe?g)$/i.test(file))
      .filter(
        (file) =>
          path.relative(webDir, file).replaceAll("\\", "/") !==
          "assets/portada-social.png",
      )
      .filter((file) => statSync(file).size >= 200 * 1024)
      .map((file) => path.relative(webDir, file));
    expect(pesadas).toEqual([]);
  });
});

describe("web: llamada a la acción", () => {
  const ctas = (page: string) =>
    [
      ...(html.get(page) ?? "").matchAll(
        /class="(?:[^"]* )?cta-principal(?: [^"]*)?"/g,
      ),
    ].length;

  it("ninguna página tiene más de un .cta-principal", () => {
    for (const page of pages) {
      expect(
        ctas(page),
        `${page}: más de un .cta-principal`,
      ).toBeLessThanOrEqual(1);
    }
  });

  it("index.html y probar.html tienen exactamente uno", () => {
    expect(ctas("index.html")).toBe(1);
    expect(ctas("probar.html")).toBe(1);
  });

  it("la CTA de probar.html lleva a la app", () => {
    expect(html.get("probar.html")).toMatch(
      /<a class="cta-principal" href="https:\/\/app\.solecuida\.com\/">/,
    );
  });
});

describe("web: sitemap con las páginas nuevas", () => {
  const sitemap = readFileSync(path.join(webDir, "sitemap.xml"), "utf8");

  it("lista probar, términos y cookies", () => {
    for (const page of ["probar.html", "terminos.html", "cookies.html"]) {
      expect(sitemap, page).toContain(`/${page}</loc>`);
    }
  });

  it("términos y cookies ya no son noindex", () => {
    for (const page of ["terminos.html", "cookies.html"]) {
      expect(html.get(page) ?? "", page).not.toMatch(/noindex/i);
    }
  });
});
