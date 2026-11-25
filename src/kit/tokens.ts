import type { Preset } from "../types";
import dark2d from "../../presets/dark-2d.json";

/** Shared design tokens of the kit. Every part reads its colours, fonts, strokes and radii here,
 *  so a scene assembled from kit parts looks like one system. Derived from the preset. */

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
};
const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");

/** Lighten (amt > 0, toward white) or darken (amt < 0, toward black) a hex colour. amt in -1..1. */
export const shade = (hex: string, amt: number) => {
  if (!hex.startsWith("#")) return hex;
  const [r, g, b] = hexToRgb(hex);
  const to = amt >= 0 ? 255 : 0, a = Math.abs(amt);
  return toHex(r + (to - r) * a, g + (to - g) * a, b + (to - b) * a);
};
/** Hex colour with an alpha, as rgba(). */
export const alpha = (hex: string, a: number) => {
  if (!hex.startsWith("#")) return hex;
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

/** Average glyph width of each installed display font, relative to Anton (measured on upper-case French text). */
const DISPLAY_WIDTH: Record<string, number> = { Anton: 1, "Bebas Neue": 0.95, "DM Serif Display": 1.32, "Archivo Black": 1.62 };

const baseTokens = (p: Preset) => ({
  /** language of the episode: number format of CountUp and friends (fmtNum) */
  lang: (p.lang ?? "fr") as "fr" | "en",
  /** `wide`: width of the display font relative to Anton, so parts size their boxes right with any look */
  font: { display: p.fontKinetic, ui: p.fontHud, mono: p.fontMono, wide: DISPLAY_WIDTH[p.fontKinetic] ?? 1.2 },
  color: {
    /** outline / text on light fills */
    ink: "#16121F",
    /** panels: mid-tones that stay readable on a phone at low brightness */
    panel: shade(p.bg.top, 0.08),
    panelLight: shade(p.bg.top, 0.22),
    panelDark: shade(p.bg.top, -0.3),
    text: p.textPrimary,
    textDim: p.textHud,
    line: p.lineColor,
    grid: "rgba(255,255,255,0.16)",
    accent: p.accent,
    accentAlt: p.accentAlt,
    cyan: "#7CE0FF",
    green: "#5BD66A",
    violet: shade(p.bg.light, 0.28),
    pink: p.bg.light2,
    steel: "#9AA3B8",
  },
  /** stroke widths */
  stroke: { thin: 3, base: 5, bold: 8 },
  /** corner radii */
  radius: { sm: 8, md: 14, lg: 22 },
  /** font sizes (px in a 1080 wide frame) */
  size: { small: 22, label: 26, body: 30, title: 40, big: 96 },
  /** depth of the shadow side under slabs */
  depth: 8,
});
export type KitTokens = ReturnType<typeof baseTokens>;
/** Tokens of a preset; a look can restyle the kit through `preset.kit` (colours, strokes, radii, depth). */
export const makeTokens = (p: Preset): KitTokens => {
  const b = baseTokens(p), s = p.kit ?? {};
  return { ...b, color: { ...b.color, ...s.color }, stroke: { ...b.stroke, ...s.stroke }, radius: { ...b.radius, ...s.radius }, depth: s.depth ?? b.depth };
};

const cache = new Map<string, KitTokens>();
/** Tokens for a preset (memoised by preset name and language). Call once per scene: `const tk = kit(preset)`. */
export const kit = (p: Preset): KitTokens => {
  const key = `${p.name}|${p.lang ?? "fr"}`;
  let v = cache.get(key);
  if (!v) { v = makeTokens(p); cache.set(key, v); }
  return v;
};
/** Tokens used when a part gets no `tk` prop. */
export const DEFAULT_TOKENS: KitTokens = makeTokens(dark2d as Preset);

/** Rough text width without measuring the DOM (enough to size chips and boxes). */
export const textW = (s: string, size: number, font: "display" | "ui" | "mono" = "ui", wide = 1) => {
  if (font === "mono") return s.length * size * 0.6;
  let w = 0;
  for (const c of s) {
    if (c === " " || c === " ") w += font === "ui" ? 0.28 : 0.2;
    else if ("iljI.,:;'!|".includes(c)) w += font === "ui" ? 0.3 : 0.25;
    else if ("mwMW".includes(c)) w += font === "ui" ? 0.88 : 0.66;
    else if (c >= "0" && c <= "9") w += font === "ui" ? 0.64 : 0.47;
    else if (c === c.toUpperCase() && c !== c.toLowerCase()) w += font === "ui" ? 0.7 : 0.48;
    else w += font === "ui" ? 0.58 : 0.43;
  }
  return w * size * (font === "display" ? wide : 1);
};
