// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ErrorPage from "@/app/error";

afterEach(cleanup);

const SRC = join(process.cwd(), "src");
const ALLOWED_PUBLIC = [
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function walkDirs(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? [full, ...walkDirs(full)] : [];
  });
}

const files = walk(SRC).filter((file) => /\.(ts|tsx|css)$/.test(file));

function offenders(pattern: RegExp): string[] {
  const found: string[] = [];
  for (const file of files) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, index) => {
        if (pattern.test(line)) {
          found.push(`${relative(SRC, file)}:${index + 1}`);
        }
      });
  }
  return found;
}

describe("higiene de producción", () => {
  it("no hay console.log", () => {
    expect(offenders(/console\.log\b/)).toEqual([]);
  });

  it("no hay dangerouslySetInnerHTML", () => {
    expect(offenders(/dangerouslySetInnerHTML/)).toEqual([]);
  });

  it("no hay eval(", () => {
    expect(offenders(/\beval\s*\(/)).toEqual([]);
  });

  it("no hay rutas debug, test ni dev", () => {
    const bad = walkDirs(join(SRC, "app")).filter((dir) =>
      ["debug", "test", "dev"].includes(dir.split(/[\\/]/).pop() ?? ""),
    );
    expect(bad.map((dir) => relative(SRC, dir))).toEqual([]);
  });

  it("solo existen las variables NEXT_PUBLIC_ permitidas", () => {
    const bad: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) {
        if (!ALLOWED_PUBLIC.includes(match[0])) {
          const line = text.slice(0, match.index).split("\n").length;
          bad.push(`${relative(SRC, file)}:${line} ${match[0]}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("error.tsx", () => {
  it("no muestra el detalle interno del error", () => {
    render(<ErrorPage error={new Error("detalle interno")} reset={() => {}} />);
    expect(
      screen.getByText("Algo salió mal. Ya nos llegó el aviso."),
    ).toBeTruthy();
    expect(screen.queryByText(/detalle interno/)).toBeNull();
    expect(
      screen.getByRole("button", { name: "Intentar de nuevo" }),
    ).toBeTruthy();
  });
});
