import React from "react";
import { alpha, pulse, type Pt } from "../../kit";
import type { Box, Tk } from "./types";

/* ep-000-demo "Why is the sky blue?" (episodes/ep-000-demo/style.md). Shared parts, drawn ONCE; the chapter files
 * import this file and never edit it.
 * Colour rule: the sun and its white light = text colour and accent; blue light = cyan; red light = accentAlt.
 *  - geo: the one layout (horizon, sun, observer), every value a fraction of the scene box.
 *  - Sun, Sky, Ground: the world of the episode. Molecule: one air molecule. Beam: one ray of light. */

export const geo = (box: Box) => ({
  horizon: box.y + box.h * 0.6,
  sun: [box.x + box.w * 0.8, box.y + box.h * 0.14] as Pt,
  eye: [box.cx, box.y + box.h * 0.6 - 30] as Pt,
  label: 30,
});
/** The five colours white light is split into, long waves first. */
export const spectrum = (tk: Tk) => [tk.color.accentAlt, tk.color.accent, tk.color.green, tk.color.cyan, tk.color.violet];

export const Sun: React.FC<{ at: Pt; r?: number; t: number; color?: string; tk: Tk }> = ({ at, r = 56, t, color, tk }) => {
  const c = color ?? tk.color.accent;
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <circle r={r * 1.9} fill={alpha(c, 0.14 + 0.05 * pulse(t, 0.5))} />
      <g transform={`rotate(${t * 12})`}>
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={i} x1={0} y1={-r * 1.25} x2={0} y2={-r * 1.6} stroke={c} strokeWidth={tk.stroke.bold} strokeLinecap="round" transform={`rotate(${i * 36})`} />
        ))}
      </g>
      <circle r={r} fill={c} stroke={tk.color.ink} strokeWidth={tk.stroke.base} />
    </g>
  );
};

/** The air above the ground: a soft tint (the colour the sky takes) that is stronger near the horizon. */
export const Sky: React.FC<{ box: Box; tint: string; k?: number; tk: Tk }> = ({ box, tint, k = 1, tk }) => {
  const g = geo(box);
  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={g.horizon - box.y} rx={tk.radius.lg} fill={alpha(tint, 0.2 * k)} stroke={alpha(tint, 0.55 * k)} strokeWidth={tk.stroke.thin} />
      <rect x={box.x} y={g.horizon - 150} width={box.w} height={150} fill={alpha(tint, 0.16 * k)} />
    </g>
  );
};

/** The ground (a slice of the planet) and the little observer standing on it. */
export const Ground: React.FC<{ box: Box; tk: Tk }> = ({ box, tk }) => {
  const g = geo(box);
  const [ex, ey] = g.eye;
  return (
    <g>
      <path d={`M ${box.x} ${g.horizon + 14} Q ${box.cx} ${g.horizon - 30} ${box.x + box.w} ${g.horizon + 14} L ${box.x + box.w} ${g.horizon + 58} L ${box.x} ${g.horizon + 58} Z`} fill={tk.color.panelLight} stroke={tk.color.line} strokeWidth={tk.stroke.base} strokeLinejoin="round" />
      <line x1={ex} y1={ey + 6} x2={ex} y2={ey + 40} stroke={tk.color.text} strokeWidth={tk.stroke.bold} strokeLinecap="round" />
      <circle cx={ex} cy={ey - 10} r={16} fill={tk.color.text} stroke={tk.color.ink} strokeWidth={tk.stroke.thin} />
    </g>
  );
};

/** One air molecule: two atoms side by side. `hot` 0..1 lights it up when light hits it. */
export const Molecule: React.FC<{ at: Pt; t: number; seed?: number; hot?: number; tk: Tk }> = ({ at, t, seed = 0, hot = 0, tk }) => (
  <g transform={`translate(${at[0] + Math.sin(t * 1.3 + seed) * 6} ${at[1] + Math.cos(t * 1.1 + seed * 2) * 6}) rotate(${seed * 50 + t * 20})`}>
    {hot > 0.02 && <circle r={44} fill={alpha(tk.color.cyan, 0.3 * hot)} />}
    <circle cx={-12} r={16} fill={tk.color.steel} stroke={tk.color.ink} strokeWidth={tk.stroke.thin} />
    <circle cx={12} r={16} fill={tk.color.steel} stroke={tk.color.ink} strokeWidth={tk.stroke.thin} />
  </g>
);

/** A ray of light from a to b, drawn on with k (0..1), with moving dashes so it reads as travelling light. */
export const Beam: React.FC<{ a: Pt; b: Pt; k?: number; t: number; color: string; w?: number; tk: Tk }> = ({ a, b, k = 1, t, color, w, tk }) => {
  if (k <= 0.01) return null;
  const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
  const width = w ?? tk.stroke.bold;
  return (
    <g strokeLinecap="round">
      <line x1={a[0]} y1={a[1]} x2={x} y2={y} stroke={alpha(color, 0.35)} strokeWidth={width * 2.4} />
      <line x1={a[0]} y1={a[1]} x2={x} y2={y} stroke={color} strokeWidth={width} strokeDasharray="26 12" strokeDashoffset={-t * 90} />
    </g>
  );
};
