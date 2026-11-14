import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  contrastPairs,
  contrastRatio,
  cssVariableName,
  type ThemeName,
  type TokenName,
  tokens,
} from "@/lib/design/tokens";

const srcDir = path.resolve(process.cwd(), "src");
const globalsPath = path.join(srcDir, "app", "globals.css");
const tokensPath = path.join(srcDir, "lib", "design", "tokens.ts");
const themes: ThemeName[] = ["light", "dark"];

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

/** Extrae `--nombre: #hex` de un bloque de CSS. */
function declaredHex(block: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of block.matchAll(/(--[a-z-]+):\s*(#[0-9a-f]{6})\b/gi)) {
    found.set(match[1], match[2].toLowerCase());
  }
  return found;
}

describe("contraste (WCAG 2.x)", () => {
  it("contrastRatio da 21 entre negro y blanco y 1 entre iguales", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#9c5b34", "#9c5b34")).toBeCloseTo(1, 5);
  });

  it("cubre texto, estados, bordes de control y foco", () => {
    const covered = new Set(contrastPairs.map((pair) => pair.fg));
    for (const token of [
      "fg",
      "fgMuted",
      "fgSubtle",
      "primary",
      "primaryFg",
      "success",
      "warning",
      "danger",
      "info",
      "borderStrong",
      "focus",
    ] satisfies TokenName[]) {
      expect(covered.has(token), token).toBe(true);
    }
  });

  for (const theme of themes) {
    for (const pair of contrastPairs) {
      it(`${theme}: ${pair.fg} sobre ${pair.bg} ≥ ${pair.min}`, () => {
        const ratio = contrastRatio(
          tokens[theme][pair.fg],
          tokens[theme][pair.bg],
        );
        expect(ratio).toBeGreaterThanOrEqual(pair.min);
      });
    }
  }

  it("los bordes de control y el foco se miden contra fondo y superficie", () => {
    for (const fg of ["borderStrong", "focus"] satisfies TokenName[]) {
      const backgrounds = contrastPairs
        .filter((pair) => pair.fg === fg)
        .map((pair) => pair.bg)
        .sort();
      expect(backgrounds).toEqual(["background", "surface"]);
    }
  });
});

describe("paridad entre tokens.ts y globals.css", () => {
  const css = readFileSync(globalsPath, "utf8");
  const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");
  const themeStart = css.indexOf("@theme");

  it("globals.css tiene bloque claro en :root y bloque oscuro", () => {
    expect(css.indexOf(":root")).toBeGreaterThanOrEqual(0);
    expect(darkStart).toBeGreaterThan(css.indexOf(":root"));
    expect(themeStart).toBeGreaterThan(darkStart);
  });

  const blocks: Record<ThemeName, Map<string, string>> = {
    light: declaredHex(css.slice(0, darkStart)),
    dark: declaredHex(css.slice(darkStart, themeStart)),
  };

  for (const theme of themes) {
    it(`${theme}: cada token está declarado con el mismo hex`, () => {
      for (const [name, hex] of Object.entries(tokens[theme])) {
        const variable = cssVariableName(name as TokenName);
        expect(blocks[theme].get(variable), `${theme} ${variable}`).toBe(hex);
      }
      expect(blocks[theme].size).toBe(Object.keys(tokens[theme]).length);
    });
  }

  it("mapea los colores a Tailwind y fija la base de 18 px, el foco y el movimiento reducido", () => {
    expect(css).toContain('@import "tailwindcss";');
    expect(css).toMatch(/@theme inline/);
    expect(css).toContain("--color-primary: var(--primary);");
    expect(css).toContain("var(--font-atkinson)");
    expect(css).toMatch(/html\s*{\s*font-size: 112\.5%;/);
    expect(css).toMatch(
      /:focus-visible\s*{\s*outline: 3px solid var\(--focus\);\s*outline-offset: 2px;/,
    );
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("transition-duration: 0.01ms");
  });
});

describe("sin colores sueltos", () => {
  it("ningún archivo de src/ tiene hex fuera de globals.css y tokens.ts", () => {
    const offenders = listFiles(srcDir)
      .filter((file) => /\.(ts|tsx|css)$/.test(file))
      .filter((file) => file !== globalsPath && file !== tokensPath)
      .filter((file) => !file.endsWith("database.types.ts"))
      .filter((file) =>
        /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i.test(
          readFileSync(file, "utf8"),
        ),
      )
      .map((file) => path.relative(srcDir, file));
    expect(offenders).toEqual([]);
  });
});

describe("layout raíz", () => {
  const layout = readFileSync(path.join(srcDir, "app", "layout.tsx"), "utf8");

  it("declara el idioma, la tipografía y el salto al contenido", () => {
    expect(layout).toContain('lang="es-CL"');
    expect(layout).toContain("Atkinson_Hyperlegible");
    expect(layout).toContain('display: "swap"');
    expect(layout).toContain('href="#contenido"');
    expect(layout).toContain("Saltar al contenido");
  });
});
