import React from "react";
import { clamp01 } from "../motion";
import { shade, type KitTokens } from "./tokens";
import type { Pt } from "./path";

/* Light-drawn parts: light drawn on a dark set. A scene made of these parts draws this way: a subject is a Wire (straight edges between nodes),
 * a soft or living thing is a Led (dotted light), the one object the video is about is a Tube (solid amber neon),
 * a relation is a NodeLine, an emphasis is Rings. Nothing is filled, nothing slides or bounces in:
 * a line is drawn on (stroke), a light is switched on (flickerOn). */

/** Colours of the style, all read from the look through the kit tokens (no literal in scenes). */
export const glowPalette = (tk: KitTokens) => ({
  bg: tk.color.ink,
  /** bright edges of a wireframe, label text */
  edge: tk.color.line,
  /** inner mesh, secondary lines */
  mesh: tk.color.steel,
  /** set dressing: orbit rings, far lines */
  dim: tk.color.grid,
  /** pins and unlit keys */
  pin: tk.color.panelLight,
  /** hologram light of the host */
  holo: tk.color.cyan,
  /** THE accent: the object or the word the shot is about */
  amber: tk.color.accent,
  amberHi: shade(tk.color.accent, 0.6),
  /** danger, attacker, refusal: used on one thing per shot at most */
  alarm: tk.color.accentAlt,
  /** hair of the host */
  hair: shade(tk.color.accent, 0.5),
  node: tk.color.text,
});
export type GlowPalette = ReturnType<typeof glowPalette>;

export const GLOW = "url(#gs-glow)";
export const GLOW_SOFT = "url(#gs-glow-soft)";
/** The two glow filters of the style. Put one <GlowDefs /> in every <svg> that uses GLOW / GLOW_SOFT, and apply the
 *  filter to a whole group (one or two per layer), never to single elements: a blur costs render time per use.
 *  The region is in user space on purpose: with a bounding-box region a perfectly horizontal line is not drawn. */
export const GlowDefs: React.FC<{ w?: number; h?: number }> = ({ w = 1080, h = 1920 }) => (
  <defs>
    <filter id="gs-glow" filterUnits="userSpaceOnUse" x={-w * 0.3} y={-h * 0.3} width={w * 1.6} height={h * 1.6}>
      <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b1" />
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b2" />
      <feMerge><feMergeNode in="b1" /><feMergeNode in="b1" /><feMergeNode in="b2" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="gs-glow-soft" filterUnits="userSpaceOnUse" x={-w * 0.3} y={-h * 0.3} width={w * 1.6} height={h * 1.6}>
      <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b1" />
      <feMerge><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
);

/** A light switching on: off, a flash, a dip, a flash, steady. `age` = seconds since the switch. */
export const flickerOn = (age: number, d = 0.2) => (age <= 0 ? 0 : age >= d ? 1 : [1, 0.2, 0.85, 0.4, 1][Math.min(4, Math.floor((age / d) * 5))]);
/** Steady light never sits perfectly still: a slow 6 % shimmer. */
export const shimmer = (t: number, seed = 0) => 0.94 + 0.06 * Math.sin(t * 5.3 + seed * 1.7) * Math.sin(t * 1.9 + seed);

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
/** Edges of a closed outline through the points `idx` (in order). */
export const loopEdges = (idx: number[]): [number, number][] => idx.map((a, i) => [a, idx[(i + 1) % idx.length]]);
/** Points of an arc cut into straight segments (the style has no curves in a subject: a curve is a polyline). */
export const arcPts = (cx: number, cy: number, r: number, a0: number, a1: number, n: number, ry = r): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * ry] as Pt; });

type WireProps = {
  pts: Pt[];
  /** bright edges (pairs of point indexes), drawn in this order */
  edges: [number, number][];
  /** thin inner edges */
  mesh?: [number, number][];
  /** 0..1 draw-on: edges are drawn one after the other, each node lights when its first edge arrives */
  k?: number;
  t?: number;
  color?: string;
  meshColor?: string;
  nodeColor?: string;
  w?: number;
  nodeR?: number;
  /** indexes of points that get no node (a node on every vertex of a dense outline is noise) */
  bare?: number[];
  opacity?: number;
  tk: KitTokens;
};
/** Wireframe: straight bright edges between glowing vertex nodes, plus an optional thin mesh inside.
 *  This is how every solid subject is drawn in the style (a PC, a key, a chip, a lock, a person who is not the host). */
export const Wire: React.FC<WireProps> = ({ pts, edges, mesh = [], k = 1, t = 0, color, meshColor, nodeColor, w, nodeR = 6, bare = [], opacity = 1, tk }) => {
  const g = glowPalette(tk);
  const all = [...edges, ...mesh];
  const n = all.length || 1;
  const span = 0.7;
  const local = (i: number) => clamp01((k * (1 + span) - (span * i) / n) / 1);
  const firstEdge = pts.map((_, pi) => { const i = all.findIndex(([a, b]) => a === pi || b === pi); return i < 0 ? 0 : i; });
  return (
    <g opacity={opacity * shimmer(t, pts.length)}>
      {mesh.map(([a, b], j) => {
        const len = dist(pts[a], pts[b]), l = local(edges.length + j);
        return <line key={`m${j}`} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke={meshColor ?? g.mesh} strokeWidth={tk.stroke.thin} opacity={0.6} strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - l)} />;
      })}
      {edges.map(([a, b], i) => {
        const len = dist(pts[a], pts[b]), l = local(i);
        return <line key={`e${i}`} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke={color ?? g.edge} strokeWidth={w ?? tk.stroke.base} strokeLinecap="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - l)} />;
      })}
      {pts.map((p, i) => (bare.includes(i) ? null : <circle key={`n${i}`} cx={p[0]} cy={p[1]} r={nodeR} fill={nodeColor ?? g.node} opacity={flickerOn(local(firstEdge[i]) * 0.5, 0.2)} />))}
    </g>
  );
};

/** Dotted light line (a row of LEDs): soft, organic or living things, and everything on the hologram host.
 *  `on` 0..1 is its brightness (use flickerOn to switch it on), `chase` moves the dots along the line (px). */
export const Led: React.FC<{ d: string; color: string; w?: number; gap?: number; on?: number; chase?: number }> = ({ d, color, w = 8, gap = 16, on = 1, chase = 0 }) => (
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={`0 ${gap}`} strokeDashoffset={-chase} opacity={on} />
);

/** Solid neon tube: reserved for THE object or the keys the shot is about (one family of tubes per shot). */
export const Tube: React.FC<{ d: string; color: string; w?: number; on?: number; core?: string }> = ({ d, color, w = 12, on = 1, core }) => (
  <g opacity={on} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={color} strokeWidth={w} />
    <path d={d} stroke={core ?? shade(color, 0.6)} strokeWidth={w * 0.34} />
  </g>
);

/** A relation: a thin line between two nodes, drawn on with `k`; `packet` 0..1 sends a bright node along it. */
export const NodeLine: React.FC<{ a: Pt; b: Pt; color: string; k?: number; w?: number; r?: number; packet?: number; nodeColor?: string; dash?: string }> = ({ a, b, color, k = 1, w = 3, r = 7, packet, nodeColor = "#fff", dash }) => {
  const len = dist(a, b), kk = clamp01(k);
  const at = (q: number): Pt => [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q];
  const end = at(kk);
  return (
    <g>
      {dash ? <line x1={a[0]} y1={a[1]} x2={end[0]} y2={end[1]} stroke={color} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" />
        : <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={w} strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - kk)} />}
      {kk > 0.01 && <circle cx={a[0]} cy={a[1]} r={r} fill={nodeColor} />}
      {kk > 0.98 && <circle cx={b[0]} cy={b[1]} r={r} fill={nodeColor} opacity={flickerOn((kk - 0.98) * 10)} />}
      {packet !== undefined && packet > 0 && packet < 1 && <circle cx={at(packet)[0]} cy={at(packet)[1]} r={r * 1.3} fill={nodeColor} />}
    </g>
  );
};

/** Emphasis: thin rings leaving a centre, one after the other (a field, a signal, "look here"). */
export const Rings: React.FC<{ cx: number; cy: number; r0: number; span: number; t: number; color: string; n?: number; speed?: number; on?: number; ry?: number }> = ({ cx, cy, r0, span, t, color, n = 3, speed = 0.45, on = 1, ry = 1 }) => (
  <g fill="none" stroke={color} opacity={on}>
    {Array.from({ length: n }).map((_, i) => {
      const ph = (t * speed + i / n) % 1;
      const r = r0 + ph * span;
      return <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * ry} strokeWidth={2.5 - ph * 1.5} opacity={0.65 * (1 - ph)} />;
    })}
  </g>
);

/** Boxed mono label with two corner squares (the label grammar of the style: HUD label, glossary chip, tag). */
export const GlowLabel: React.FC<{ x: number; y: number; text: string; size?: number; color?: string; box?: string; on?: number; track?: number; align?: "middle" | "start"; tk: KitTokens }> = ({ x, y, text, size = 30, color, box, on = 1, track = 0.2, align = "middle", tk }) => {
  const g = glowPalette(tk);
  const w = text.length * size * (0.6 + track) + size * 1.4, h = size * 2;
  const x0 = align === "middle" ? x - w / 2 : x;
  return (
    <g opacity={on}>
      <rect x={x0} y={y - h / 2} width={w} height={h} fill={g.bg} fillOpacity={0.72} stroke={box ?? g.mesh} strokeWidth={2} />
      <rect x={x0 - 5} y={y - h / 2 - 5} width={10} height={10} fill={g.edge} />
      <rect x={x0 + w - 5} y={y + h / 2 - 5} width={10} height={10} fill={g.edge} />
      <text x={x0 + w / 2 + (size * track) / 2} y={y + size * 0.35} textAnchor="middle" fontFamily={tk.font.mono} fontSize={size} letterSpacing={size * track} fill={color ?? g.edge}>{text}</text>
    </g>
  );
};
