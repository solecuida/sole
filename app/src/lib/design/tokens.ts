// Mismos valores que src/app/globals.css (una prueba lo exige).
// Un estudio de marca puede cambiar estos dos archivos sin tocar componentes.

export interface ThemeTokens {
  background: string;
  surface: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  primary: string;
  primaryFg: string;
  primaryHover: string;
  border: string;
  borderStrong: string;
  focus: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  successBg: string;
  warningBg: string;
  dangerBg: string;
  infoBg: string;
}

export type ThemeName = "light" | "dark";
export type TokenName = keyof ThemeTokens;

export const tokens: Record<ThemeName, ThemeTokens> = {
  light: {
    background: "#faf6ef",
    surface: "#f4ede1",
    fg: "#241f1a",
    fgMuted: "#5f5548",
    fgSubtle: "#726556",
    primary: "#9c5b34",
    primaryFg: "#ffffff",
    primaryHover: "#84492a",
    border: "#e3d9c9",
    borderStrong: "#726556",
    focus: "#9c5b34",
    success: "#2f6b3a",
    warning: "#7a5200",
    danger: "#a3312b",
    info: "#2b5a86",
    successBg: "#e6f1e7",
    warningBg: "#f8ecd2",
    dangerBg: "#f8e3e0",
    infoBg: "#e2ecf5",
  },
  dark: {
    background: "#16120e",
    surface: "#1e1913",
    fg: "#f0e8dc",
    fgMuted: "#b6a894",
    fgSubtle: "#9c8e7c",
    primary: "#dc9264",
    primaryFg: "#16120e",
    primaryHover: "#eaad84",
    border: "#322a20",
    borderStrong: "#9c8e7c",
    focus: "#dc9264",
    success: "#86c793",
    warning: "#e5b764",
    danger: "#f2958a",
    info: "#93bde8",
    successBg: "#1b2a1d",
    warningBg: "#2c2414",
    dangerBg: "#2f1b18",
    infoBg: "#18232f",
  },
};

/** Nombre de la variable CSS de un token: `fgMuted` → `--fg-muted`. */
export function cssVariableName(token: TokenName): string {
  return `--${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) {
    throw new Error(`Color inválido: ${hex}`);
  }
  const [r, g, b] = match
    .slice(1)
    .map((pair) => channelToLinear(Number.parseInt(pair, 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste WCAG 2.x entre dos colores hex (de 1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface ContrastPair {
  fg: TokenName;
  bg: TokenName;
  /** 4.5 para texto; 3 para bordes de control y anillo de foco. */
  min: 4.5 | 3;
}

const onPage: TokenName[] = ["background", "surface"];

export const contrastPairs: ContrastPair[] = [
  ...(["fg", "fgMuted", "fgSubtle", "primary"] as const).flatMap((fg) =>
    onPage.map((bg) => ({ fg, bg, min: 4.5 as const })),
  ),
  { fg: "primaryFg", bg: "primary", min: 4.5 },
  { fg: "primaryFg", bg: "primaryHover", min: 4.5 },
  ...(["success", "warning", "danger", "info"] as const).flatMap((fg) =>
    [...onPage, `${fg}Bg` as TokenName].map((bg) => ({
      fg,
      bg,
      min: 4.5 as const,
    })),
  ),
  ...(["borderStrong", "focus"] as const).flatMap((fg) =>
    onPage.map((bg) => ({ fg, bg, min: 3 as const })),
  ),
];
