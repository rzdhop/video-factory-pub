import React from "react";
import { DEFAULT_TOKENS, shade, type KitTokens } from "./tokens";
import { clamp01, easeOut, pop, pulse, rnd, seg, stagger } from "./anim";

/* Nature family: science subjects (physics, space, biology) and an always-alive background. */

/** Nucleus with electrons on tilted orbits. (x, y) = centre, r = orbit radius. */
export const Atom: React.FC<{ x: number; y: number; r: number; electrons?: number; k?: number; t?: number; color?: string; nucleusColor?: string; speed?: number; tk?: KitTokens }> = ({ x, y, r, electrons = 3, k = 1, t = 0, color, nucleusColor, speed = 1, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.cyan, nc = nucleusColor ?? tk.color.accentAlt;
  const orbits = Math.max(1, Math.min(3, electrons));
  const ry = r * 0.36, nr = r * 0.11;
  const kn = pop(seg(k, 0, 0.45));
  const balls: [number, number][] = [[0, 0], [1, 0.1], [-0.9, 0.35], [0.4, 0.95], [-0.45, -0.9], [0.75, -0.75], [-0.2, 0.3]];
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: orbits }).map((_, i) => {
        const ko = easeOut(seg(k, 0.2 + i * 0.12, 0.75 + i * 0.12));
        return ko > 0 ? <ellipse key={i} rx={r} ry={ry} transform={`rotate(${-30 + (i * 180) / orbits})`} fill="none" stroke={tk.color.line} strokeOpacity={0.6} strokeWidth={tk.stroke.thin} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ko} /> : null;
      })}
      <g transform={`scale(${kn})`}>
        <circle r={nr * 2.9 + 3 * pulse(t, 0.9)} fill={nc} opacity={0.2} />
        {balls.map(([bx, by], i) => {
          const jx = Math.sin(t * 7 + i * 2.1) * nr * 0.08, jy = Math.cos(t * 6 + i * 1.3) * nr * 0.08;
          const col = i % 2 ? tk.color.steel : nc;
          return (
            <g key={i}>
              <circle cx={bx * nr + jx} cy={by * nr + jy} r={nr} fill={col} stroke={shade(col, -0.45)} strokeWidth={2} />
              <circle cx={bx * nr + jx - nr * 0.3} cy={by * nr + jy - nr * 0.3} r={nr * 0.3} fill="#fff" opacity={0.45} />
            </g>
          );
        })}
      </g>
      {Array.from({ length: electrons }).map((_, i) => {
        const ke = pop(stagger(seg(k, 0.5, 1), i, electrons, 0.6));
        if (ke <= 0) return null;
        const a = t * speed * (2.2 + 0.35 * (i % 3)) + i * 2.3;
        const ex = Math.cos(a) * r, ey = Math.sin(a) * ry;
        return (
          <g key={i} transform={`rotate(${-30 + ((i % orbits) * 180) / orbits})`}>
            <circle cx={ex} cy={ey} r={r * 0.11 * ke} fill={c} opacity={0.28} />
            <circle cx={ex} cy={ey} r={r * 0.055 * ke} fill={c} stroke="#fff" strokeWidth={2} />
          </g>
        );
      })}
    </g>
  );
};

/** Travelling or standing sine wave drawn along k. (x, y) = left end on the rest line, w = length.
 *  freq = number of cycles across w, speed = cycles per second. */
export const Wave: React.FC<{ x: number; y: number; w: number; amp?: number; freq?: number; speed?: number; k?: number; t?: number; standing?: boolean; axis?: boolean; color?: string; width?: number; tk?: KitTokens }> = ({ x, y, w, amp = 40, freq = 3, speed = 1, k = 1, t = 0, standing = false, axis = true, color, width, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.cyan, sw = width ?? tk.stroke.base + 1;
  const kk = easeOut(k), TAU = Math.PI * 2;
  const f = (u: number) => (standing ? Math.sin(TAU * freq * u) * Math.cos(TAU * speed * t) : Math.sin(TAU * (freq * u - speed * t))) * amp;
  const N = Math.max(8, Math.round(90 * kk));
  let d = "", env1 = "", env2 = "";
  for (let i = 0; i <= N; i++) {
    const u = (kk * i) / N, px = (x + u * w).toFixed(1);
    d += `${i ? "L" : "M"}${px} ${(y - f(u)).toFixed(1)} `;
    if (standing) {
      const e = Math.sin(TAU * freq * u) * amp;
      env1 += `${i ? "L" : "M"}${px} ${(y - e).toFixed(1)} `;
      env2 += `${i ? "L" : "M"}${px} ${(y + e).toFixed(1)} `;
    }
  }
  const nodes = standing ? Array.from({ length: Math.floor(freq * 2) + 1 }).map((_, i) => i / (freq * 2)).filter((u) => u <= kk + 1e-6) : [];
  return (
    <g>
      {axis && <line x1={x} y1={y} x2={x + w * kk} y2={y} stroke={tk.color.grid} strokeWidth={2} strokeDasharray="6 8" />}
      {standing && <path d={env1 + env2} fill="none" stroke={c} strokeWidth={2} strokeDasharray="5 7" opacity={0.45} />}
      <path d={d} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      {nodes.map((u, i) => <circle key={i} cx={x + u * w} cy={y} r={7} fill={tk.color.accent} stroke={tk.color.ink} strokeWidth={2} />)}
      {!standing && <circle cx={x + kk * w} cy={y - f(kk)} r={sw * 1.5} fill={tk.color.text} stroke={c} strokeWidth={tk.stroke.thin} />}
    </g>
  );
};

/** Sphere with terminator shading, drifting bands and an optional ring. (x, y) = centre.
 *  `light` = direction the light comes from, in degrees (0 = right, -90 = top). Unique `id` if two planets overlap. */
export const Planet: React.FC<{ x: number; y: number; r: number; color?: string; k?: number; t?: number; ring?: boolean; ringColor?: string; light?: number; bands?: number; id?: string; tk?: KitTokens }> = ({ x, y, r, color, k = 1, t = 0, ring = false, ringColor, light = -140, bands = 4, id, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? "#3E8EDE", rc = ringColor ?? tk.color.accent;
  const cid = id ?? `kit-planet-${Math.round(x)}-${Math.round(y)}-${Math.round(r)}`;
  const la = (light * Math.PI) / 180, ox = Math.cos(la) * r * 0.42, oy = Math.sin(la) * r * 0.42;
  const e = pop(k);
  const rx = r * 1.85, ry = r * 0.42, kr = pop(seg(k, 0.4, 1));
  const half = (sweep: 0 | 1) => `M ${-rx} 0 A ${rx} ${ry} 0 0 ${sweep} ${rx} 0`;
  return (
    <g transform={`translate(${x} ${y + Math.sin(t * 0.9) * 4}) scale(${e})`}>
      <defs><clipPath id={cid}><circle r={r} /></clipPath></defs>
      {ring && kr > 0 && <path d={half(1)} transform={`rotate(-16) scale(${kr})`} fill="none" stroke={shade(rc, -0.3)} strokeWidth={r * 0.16} />}
      <circle r={r} fill={shade(c, -0.5)} />
      <g clipPath={`url(#${cid})`}>
        <circle cx={ox} cy={oy} r={r * 1.12} fill={c} />
        {Array.from({ length: bands }).map((_, i) => {
          const by = -r + ((i + 0.5) / bands) * 2 * r + (rnd(i, 7) - 0.5) * r * 0.2;
          const bw = r * (0.7 + rnd(i, 8) * 0.9), span = 2 * r + bw;
          const bx = ((rnd(i, 9) * span + t * r * (0.1 + 0.08 * rnd(i, 10))) % span) - r - bw;
          return <rect key={i} x={bx} y={by - r * 0.07} width={bw} height={r * 0.14} rx={r * 0.07} fill={i % 2 ? "#fff" : "#000"} opacity={i % 2 ? 0.2 : 0.16} />;
        })}
        <ellipse cx={ox * 1.25} cy={oy * 1.25} rx={r * 0.3} ry={r * 0.2} transform={`rotate(${light + 90} ${ox * 1.25} ${oy * 1.25})`} fill="#fff" opacity={0.22} />
      </g>
      <circle r={r} fill="none" stroke={shade(c, 0.3)} strokeWidth={2} opacity={0.5} />
      {ring && kr > 0 && (
        <g transform={`rotate(-16) scale(${kr})`}>
          <path d={half(0)} fill="none" stroke={rc} strokeWidth={r * 0.16} />
          <path d={half(0)} fill="none" stroke={shade(rc, 0.5)} strokeWidth={r * 0.03} transform="scale(1.04)" />
        </g>
      )}
    </g>
  );
};

/** Simple cell: wobbling membrane, cytoplasm, nucleus, drifting organelles. (x, y) = centre. */
export const Cell: React.FC<{ x: number; y: number; r: number; k?: number; t?: number; color?: string; nucleusColor?: string; organelles?: number; tk?: KitTokens }> = ({ x, y, r, k = 1, t = 0, color, nucleusColor, organelles = 6, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.green, nc = nucleusColor ?? tk.color.violet;
  const blob = (rad: number, seed: number) => {
    const N = 14, pts: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rr = rad * (1 + 0.05 * Math.sin(t * 1.7 + i * 1.9 + seed) + 0.035 * Math.sin(t * 2.9 + i * 0.7 + seed * 2));
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let d = "";
    for (let i = 0; i < N; i++) {
      const p = pts[i], q = pts[(i + 1) % N], m = mid(p, q);
      if (i === 0) { const m0 = mid(pts[N - 1], p); d += `M ${m0[0].toFixed(1)} ${m0[1].toFixed(1)} `; }
      d += `Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)} `;
    }
    return d + "Z";
  };
  const e = pop(k);
  const nx = -r * 0.16 + Math.sin(t * 0.8) * r * 0.03, ny = r * 0.04 + Math.cos(t * 0.7) * r * 0.03, nr = r * 0.34;
  const cols = [tk.color.accent, tk.color.pink, tk.color.cyan];
  return (
    <g transform={`translate(${x} ${y}) scale(${e}) rotate(${Math.sin(t * 0.4) * 4})`}>
      <path d={blob(r, 0)} fill={shade(c, -0.42)} stroke={c} strokeWidth={tk.stroke.bold} strokeLinejoin="round" />
      <path d={blob(r * 0.84, 3)} fill={shade(c, -0.22)} opacity={0.75} />
      {Array.from({ length: organelles }).map((_, i) => {
        const a = (i / organelles) * Math.PI * 2 + 0.9 + Math.sin(t * 0.5 + i) * 0.12;
        const d = r * (0.6 + 0.1 * rnd(i, 11));
        const ko = pop(stagger(seg(k, 0.4, 1), i, organelles, 0.5));
        const col = cols[i % cols.length];
        return <ellipse key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} rx={r * 0.11 * ko} ry={r * 0.06 * ko} transform={`rotate(${(a * 180) / Math.PI + 90 + Math.sin(t + i) * 12} ${Math.cos(a) * d} ${Math.sin(a) * d})`} fill={col} stroke={shade(col, -0.45)} strokeWidth={2} />;
      })}
      <g transform={`translate(${nx} ${ny}) scale(${pop(seg(k, 0.25, 0.8))})`}>
        <circle r={nr} fill={nc} stroke={shade(nc, -0.45)} strokeWidth={tk.stroke.thin} />
        <path d={`M ${-nr * 0.7} ${-nr * 0.2} A ${nr * 0.75} ${nr * 0.75} 0 0 1 ${nr * 0.1} ${-nr * 0.72}`} fill="none" stroke="#fff" strokeWidth={tk.stroke.thin} strokeLinecap="round" opacity={0.5} />
        <circle cx={nr * 0.2} cy={nr * 0.2} r={nr * 0.3} fill={shade(nc, -0.4)} />
      </g>
    </g>
  );
};

/** Deterministic drifting dots in a box: an always-alive background. (x, y) = top-left. Same seed = same dots. */
export const Particles: React.FC<{ x: number; y: number; w: number; h: number; n?: number; k?: number; t?: number; color?: string; colors?: string[]; seed?: number; speed?: number; size?: number; tk?: KitTokens }> = ({ x, y, w, h, n = 28, k = 1, t = 0, color, colors, seed = 0, speed = 16, size = 5, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const mod = (a: number, m: number) => ((a % m) + m) % m;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const e = pop(stagger(k, i, n, 0.4));
        if (e <= 0) return null;
        const vx = (rnd(i, seed + 1) - 0.5) * 2 * speed, vy = (rnd(i, seed + 2) - 0.5) * 2 * speed * 0.7 - speed * 0.25;
        const px = mod(rnd(i, seed + 3) * w + vx * t + Math.sin(t * 0.8 + i) * 8, w);
        const py = mod(rnd(i, seed + 4) * h + vy * t + Math.cos(t * 0.6 + i * 1.7) * 6, h);
        const edge = clamp01(Math.min(px, w - px, py, h - py) / 24);
        const tw = 0.5 + 0.5 * pulse(t, 0.3 + rnd(i, seed + 5) * 0.5, i);
        const col = colors ? colors[i % colors.length] : color ?? tk.color.text;
        return <circle key={i} cx={x + px} cy={y + py} r={size * (0.4 + rnd(i, seed + 6) * 0.9) * e} fill={col} opacity={tw * edge} />;
      })}
    </g>
  );
};
