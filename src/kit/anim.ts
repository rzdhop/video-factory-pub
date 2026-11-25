import { clamp01, easeOut, easeInOut, lerp, rnd, springTo, impulse, wobble } from "../motion";

export { clamp01, easeOut, easeInOut, lerp, rnd, springTo, impulse, wobble };

/** Overshoot entrance: 0 -> 1 with a small bounce. Use it for every "appears" instead of a linear fade. */
export const pop = (k: number) => {
  const x = clamp01(k);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - Math.pow(2, -10 * x) * Math.cos(x * 12);
};
/** Local 0..1 progress of the window [a, b] inside a global progress k. */
export const seg = (k: number, a: number, b: number) => clamp01((k - a) / (b - a));
/** Local progress of item i out of n, each taking `span` of the global progress, starts spread evenly. */
export const stagger = (k: number, i: number, n: number, span = 0.5) =>
  clamp01((k - (n > 1 ? (i / (n - 1)) * (1 - span) : 0)) / span);
/** 0..1 sine pulse for idle motion. */
export const pulse = (t: number, hz = 1, seed = 0) => 0.5 + 0.5 * Math.sin(t * hz * Math.PI * 2 + seed);
/** Scene helpers: springy pop / smooth ramp starting at time `when` (seconds). */
export const at = (t: number, when: number, d = 0.35) => pop((t - when) / d);
export const ramp = (t: number, when: number, d: number) => easeOut((t - when) / d);

/** Number in the language of the episode. French: non-breaking space every 3 digits, decimal comma.
 *  English: comma every 3 digits, decimal point. Scenes call it with `tk.lang` (or `preset.lang`). */
export const fmtNum = (n: number, decimals = 0, lang: "fr" | "en" = "fr") => {
  const [i, d] = Math.abs(n).toFixed(decimals).split(".");
  const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, lang === "en" ? "," : " ");
  const neg = n < 0 && Number(Math.abs(n).toFixed(decimals)) !== 0;
  return (neg ? "-" : "") + g + (d ? (lang === "en" ? "." : ",") + d : "");
};
/** French number formatting (kept for the scenes of the French episodes). New scenes use fmtNum. */
export const fmtFr = (n: number, decimals = 0) => fmtNum(n, decimals, "fr");
/** Word of the series badge and of "part n" labels drawn by a scene. */
export const partWord = (lang: "fr" | "en" = "fr") => (lang === "en" ? "PART" : "PARTIE");
