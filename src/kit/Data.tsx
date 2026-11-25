import React from "react";
import { DEFAULT_TOKENS, textW, shade, alpha, type KitTokens } from "./tokens";
import { clamp01, easeInOut, easeOut, fmtNum, lerp, pop, pulse, seg, stagger } from "./anim";

/* Data family: numbers, curves, bars, formulas, comparisons and dates. */

/** Number counting from `from` to `to` (separators of the episode's language, `tk.lang`) with a unit and an optional label. (x, y) = baseline. */
export const CountUp: React.FC<{ x: number; y: number; from?: number; to: number; k?: number; t?: number; unit?: string; decimals?: number; size?: number; color?: string; label?: string; anchor?: "start" | "middle" | "end"; tk?: KitTokens }> = ({ x, y, from = 0, to, k = 1, t = 0, unit, decimals = 0, size, color, label, anchor = "middle", tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const fs = size ?? tk.size.big;
  const txt = fmtNum(lerp(from, to, easeOut(k)), decimals, tk.lang);
  // width reserved from the final value so the number does not slide while counting
  const nw = Math.max(textW(fmtNum(to, decimals, tk.lang), fs, "display", tk.font.wide), textW(fmtNum(from, decimals, tk.lang), fs, "display", tk.font.wide));
  const uw = unit ? textW(unit, fs * 0.42, "display", tk.font.wide) + fs * 0.16 : 0;
  const w = nw + uw;
  const x0 = anchor === "start" ? x : anchor === "middle" ? x - w / 2 : x - w;
  const sc = (0.5 + 0.5 * pop(k * 3)) * (1 + 0.07 * Math.sin(Math.PI * seg(k, 0.82, 1)));
  const lw = w * (0.5 + 0.12 * pulse(t, 0.6));
  return (
    <g transform={`translate(${x0 + w / 2} ${y - fs * 0.35}) scale(${sc}) translate(${-(x0 + w / 2)} ${-(y - fs * 0.35)})`}>
      <text x={x0 + nw} y={y} textAnchor="end" fontFamily={tk.font.display} fontSize={fs} fill={color ?? tk.color.text} stroke={tk.color.ink} strokeWidth={fs * 0.06} paintOrder="stroke" strokeLinejoin="round">{txt}</text>
      {unit && <text x={x0 + nw + fs * 0.16} y={y} fontFamily={tk.font.display} fontSize={fs * 0.42} fill={tk.color.accent} stroke={tk.color.ink} strokeWidth={fs * 0.04} paintOrder="stroke" strokeLinejoin="round">{unit}</text>}
      <rect x={x0 + w / 2 - lw / 2} y={y + fs * 0.16} width={lw} height={tk.stroke.base} rx={tk.stroke.base / 2} fill={tk.color.accent} />
      {label && <text x={x0 + w / 2} y={y + fs * 0.16 + tk.size.label * 1.5} textAnchor="middle" fontFamily={tk.font.ui} fontWeight={600} fontSize={tk.size.label} fill={tk.color.textDim}>{label}</text>}
    </g>
  );
};

/** Axes and a curve drawn along k. (x, y) = top-left of the plot area, w x h its size.
 *  Give either `fn` (data x -> data y) or `points` (data coordinates). The dot rides the tip of the curve,
 *  or sits at `dotAt` (0..1 along the curve) when given. */
export const AxisPlot: React.FC<{
  x: number; y: number; w: number; h: number; fn?: (x: number) => number; points?: [number, number][];
  xRange: [number, number]; yRange: [number, number]; k?: number; t?: number; xLabel?: string; yLabel?: string;
  color?: string; dot?: boolean; dotAt?: number; valueLabel?: (x: number, y: number) => string; ticks?: number; fill?: boolean; tk?: KitTokens;
}> = ({ x, y, w, h, fn, points, xRange, yRange, k = 1, t = 0, xLabel, yLabel, color, dot = true, dotAt, valueLabel, ticks = 4, fill = true, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.cyan;
  const sx = (v: number) => x + ((v - xRange[0]) / (xRange[1] - xRange[0])) * w;
  const sy = (v: number) => y + h - clamp01((v - yRange[0]) / (yRange[1] - yRange[0])) * h;
  /** data point at curve progress u */
  const at = (u: number): [number, number] => {
    if (fn) { const vx = lerp(xRange[0], xRange[1], u); return [vx, fn(vx)]; }
    const pts = points ?? [[xRange[0], yRange[0]]];
    const f = clamp01(u) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f));
    if (pts.length < 2) return pts[0];
    return [lerp(pts[i][0], pts[i + 1][0], f - i), lerp(pts[i][1], pts[i + 1][1], f - i)];
  };
  const ka = easeOut(seg(k, 0, 0.3)), kc = easeInOut(seg(k, 0.2, 1));
  const N = 72, n = Math.max(1, Math.round(N * kc));
  let d = "";
  for (let i = 0; i <= n; i++) { const [vx, vy] = at((kc * i) / n); d += `${i ? "L" : "M"}${sx(vx).toFixed(1)} ${sy(vy).toFixed(1)} `; }
  const [dx, dy] = at(dotAt ?? kc);
  const px = sx(dx), py = sy(dy);
  const lab = valueLabel ? valueLabel(dx, dy) : null;
  const lw = lab ? textW(lab, tk.size.small, "mono") + 24 : 0;
  const lx = Math.min(x + w - lw, Math.max(x, px - lw / 2)), ly = py - 58 < y - 10 ? py + 22 : py - 58;
  return (
    <g>
      {Array.from({ length: ticks }).map((_, i) => {
        const gy = y + (h * i) / ticks;
        return <line key={i} x1={x} y1={gy} x2={x + w * ka} y2={gy} stroke={tk.color.grid} strokeWidth={2} strokeDasharray="6 8" />;
      })}
      <line x1={x} y1={y + h} x2={x} y2={y + h - (h + 14) * ka} stroke={tk.color.line} strokeWidth={tk.stroke.base} strokeLinecap="round" />
      <line x1={x} y1={y + h} x2={x + (w + 14) * ka} y2={y + h} stroke={tk.color.line} strokeWidth={tk.stroke.base} strokeLinecap="round" />
      {yLabel && <text x={x + 16} y={y - 2} fontFamily={tk.font.ui} fontWeight={600} fontSize={tk.size.small} fill={tk.color.textDim} opacity={ka}>{yLabel}</text>}
      {xLabel && <text x={x + w} y={y + h + tk.size.small * 1.5} textAnchor="end" fontFamily={tk.font.ui} fontWeight={600} fontSize={tk.size.small} fill={tk.color.textDim} opacity={ka}>{xLabel}</text>}
      {kc > 0 && fill && <path d={`${d} L ${sx(at(kc)[0]).toFixed(1)} ${y + h} L ${sx(at(0)[0]).toFixed(1)} ${y + h} Z`} fill={alpha(c, 0.16)} />}
      {kc > 0 && <path d={d} fill="none" stroke={c} strokeWidth={tk.stroke.base + 1} strokeLinecap="round" strokeLinejoin="round" />}
      {dot && kc > 0 && (
        <g>
          <circle cx={px} cy={py} r={18 + 6 * pulse(t, 1.4)} fill={c} opacity={0.22} />
          <circle cx={px} cy={py} r={10} fill={tk.color.text} stroke={c} strokeWidth={tk.stroke.base} />
          {lab && (
            <g>
              <rect x={lx} y={ly} width={lw} height={36} rx={tk.radius.sm} fill={tk.color.panelDark} stroke={c} strokeWidth={tk.stroke.thin} />
              <text x={lx + lw / 2} y={ly + 26} textAnchor="middle" fontFamily={tk.font.mono} fontWeight={500} fontSize={tk.size.small} fill={tk.color.text}>{lab}</text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};

export type BarDatum = { label: string; value: number; color?: string; display?: string };

/** Horizontal bars that grow with a bounce, label above each bar, value on the right. (x, y) = top-left. */
export const BarRow: React.FC<{ x: number; y: number; w: number; rows: BarDatum[]; max?: number; k?: number; t?: number; rowH?: number; unit?: string; decimals?: number; tk?: KitTokens }> = ({ x, y, w, rows, max, k = 1, t = 0, rowH = 78, unit = "", decimals = 0, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const m = max ?? Math.max(...rows.map((r) => r.value), 1e-9);
  const palette = [tk.color.cyan, tk.color.accent, tk.color.green, tk.color.pink, tk.color.violet];
  const bh = 24;
  return (
    <g>
      {rows.map((r, i) => {
        const s = stagger(k, i, rows.length, 0.55), e = pop(s);
        if (s <= 0) return null;
        const c = r.color ?? palette[i % palette.length];
        const yy = y + i * rowH, bw = Math.max(bh, w * (r.value / m) * e);
        const sheen = ((t * 0.45 + i * 0.21) % 1) * (bw + 60) - 60;
        const sx0 = Math.max(0, sheen), sx1 = Math.min(bw, sheen + 60);
        return (
          <g key={i}>
            <text x={x} y={yy + tk.size.label} fontFamily={tk.font.ui} fontWeight={600} fontSize={tk.size.label} fill={tk.color.text} opacity={clamp01(s * 4)}>{r.label}</text>
            <text x={x + w} y={yy + tk.size.label} textAnchor="end" fontFamily={tk.font.mono} fontWeight={500} fontSize={tk.size.label} fill={c} opacity={clamp01(s * 4)}>{r.display ?? fmtNum(r.value * easeOut(s), decimals, tk.lang) + unit}</text>
            <rect x={x} y={yy + tk.size.label + 12} width={w} height={bh} rx={bh / 2} fill={tk.color.panelDark} stroke={tk.color.panelLight} strokeWidth={2} />
            <rect x={x} y={yy + tk.size.label + 12} width={bw} height={bh} rx={bh / 2} fill={c} />
            <rect x={x + 8} y={yy + tk.size.label + 16} width={Math.max(0, bw - 16)} height={6} rx={3} fill="#fff" opacity={0.3} />
            {sx1 > sx0 + bh && <rect x={x + sx0} y={yy + tk.size.label + 12} width={sx1 - sx0} height={bh} rx={bh / 2} fill="#fff" opacity={0.2} />}
          </g>
        );
      })}
    </g>
  );
};

export type FormulaToken = { kind: "text" | "sub" | "sup" | "frac"; a: string; b?: string; color?: string };
/** Token builders for Formula: F.text("E = "), F.sub("v", "0"), F.sup("c", "2"), F.frac("1", "2"). */
export const F = {
  text: (a: string, color?: string): FormulaToken => ({ kind: "text", a, color }),
  sub: (a: string, b: string, color?: string): FormulaToken => ({ kind: "sub", a, b, color }),
  sup: (a: string, b: string, color?: string): FormulaToken => ({ kind: "sup", a, b, color }),
  frac: (a: string, b: string, color?: string): FormulaToken => ({ kind: "frac", a, b, color }),
};

/** Inline maths from simple tokens, in the mono font so the layout is exact. (x, y) = baseline.
 *  Tokens pop in one by one along k; `highlight` (token index) lights one term and dims the others. */
export const Formula: React.FC<{ x: number; y: number; tokens: FormulaToken[]; k?: number; t?: number; size?: number; highlight?: number; color?: string; anchor?: "start" | "middle"; tk?: KitTokens }> = ({ x, y, tokens, k = 1, t = 0, size = 56, highlight, color, anchor = "start", tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const cw = size * 0.6, small = 0.6, fr = 0.72;
  const widths = tokens.map((tok) =>
    tok.kind === "text" ? tok.a.length * cw
      : tok.kind === "frac" ? Math.max(tok.a.length, (tok.b ?? "").length) * cw * fr + size * 0.5
        : tok.a.length * cw + (tok.b ?? "").length * cw * small + size * 0.06);
  const total = widths.reduce((s, v) => s + v, 0);
  let cx = anchor === "middle" ? x - total / 2 : x;
  const font = { fontFamily: tk.font.mono, fontWeight: 500 } as const;
  return (
    <g>
      {tokens.map((tok, i) => {
        const w = widths[i], x0 = cx;
        cx += w;
        const e = pop(stagger(k, i, tokens.length, 0.45));
        if (e <= 0) return null;
        const on = highlight === i, dim = highlight !== undefined && highlight >= 0 && !on;
        const c = on ? tk.color.accent : tok.color ?? color ?? tk.color.text;
        const sc = e * (on ? 1.08 + 0.03 * pulse(t, 1.5) : 1);
        const mx = x0 + w / 2, my = y - size * 0.32;
        const blank = tok.kind === "text" && tok.a.trim() === "";
        return (
          <g key={i} transform={`translate(${mx} ${my}) scale(${sc}) translate(${-mx} ${-my})`} opacity={dim ? 0.62 : 1}>
            {on && !blank && <rect x={x0 - 6} y={y - size * (tok.kind === "frac" ? 1.25 : 1.02)} width={w + 12} height={size * (tok.kind === "frac" ? 1.95 : 1.42)} rx={tk.radius.sm} fill={alpha(tk.color.accent, 0.16)} stroke={tk.color.accent} strokeWidth={2} />}
            {tok.kind === "text" && <text x={x0} y={y} {...font} fontSize={size} fill={c} style={{ whiteSpace: "pre" }}>{tok.a}</text>}
            {(tok.kind === "sub" || tok.kind === "sup") && (
              <g>
                <text x={x0} y={y} {...font} fontSize={size} fill={c}>{tok.a}</text>
                <text x={x0 + tok.a.length * cw + size * 0.04} y={tok.kind === "sub" ? y + size * 0.22 : y - size * 0.46} {...font} fontSize={size * small} fill={c}>{tok.b}</text>
              </g>
            )}
            {tok.kind === "frac" && (
              <g>
                <text x={mx} y={y - size * 0.56} textAnchor="middle" {...font} fontSize={size * fr} fill={c}>{tok.a}</text>
                <rect x={x0 + size * 0.1} y={y - size * 0.4} width={w - size * 0.2} height={tk.stroke.thin} rx={1.5} fill={c} />
                <text x={mx} y={y + size * 0.38} textAnchor="middle" {...font} fontSize={size * fr} fill={c}>{tok.b}</text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

export type ScaleItem = { label: string; value: number; display?: string; color?: string };

/** Two lengths drawn to the same scale, with ruler ticks and the ratio between them. (x, y) = top-left.
 *  Height used: 2 * rowH. */
export const Scale: React.FC<{ x: number; y: number; w: number; a: ScaleItem; b: ScaleItem; k?: number; t?: number; rowH?: number; showRatio?: boolean; tk?: KitTokens }> = ({ x, y, w, a, b, k = 1, t = 0, rowH = 92, showRatio = true, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const m = Math.max(a.value, b.value, 1e-9);
  const big = Math.max(a.value, b.value), small = Math.max(1e-9, Math.min(a.value, b.value));
  const ratio = big / small;
  const rtxt = "x " + fmtNum(ratio, ratio >= 10 ? 0 : 1, tk.lang);
  const bh = 30;
  const kr = pop(seg(k, 0.7, 1));
  const smallRow = a.value <= b.value ? 0 : 1;
  const rw = textW(rtxt, 30, "display", tk.font.wide) + 28;
  return (
    <g>
      {[a, b].map((it, i) => {
        const s = seg(k, i * 0.25, 0.6 + i * 0.25), e = pop(s);
        if (s <= 0) return null;
        const c = it.color ?? (i === 0 ? tk.color.cyan : tk.color.accent);
        const yy = y + i * rowH, by = yy + tk.size.label + 12;
        const bw = Math.max(8, w * (it.value / m) * e);
        const nt = Math.floor(bw / (w / 10));
        return (
          <g key={i}>
            <text x={x} y={yy + tk.size.label} fontFamily={tk.font.ui} fontWeight={600} fontSize={tk.size.label} fill={tk.color.text} opacity={clamp01(s * 4)}>{it.label}</text>
            <text x={x + w} y={yy + tk.size.label} textAnchor="end" fontFamily={tk.font.mono} fontWeight={500} fontSize={tk.size.label} fill={c} opacity={clamp01(s * 4)}>{it.display ?? fmtNum(it.value, 0, tk.lang)}</text>
            <rect x={x} y={by + 5} width={bw} height={bh} rx={tk.radius.sm} fill={shade(c, -0.45)} />
            <rect x={x} y={by} width={bw} height={bh} rx={tk.radius.sm} fill={c} />
            <rect x={x + 4} y={by + 4} width={Math.max(0, bw - 8)} height={7} rx={3.5} fill="#fff" opacity={0.3} />
            {Array.from({ length: nt }).map((_, j) => <line key={j} x1={x + ((j + 1) * w) / 10} y1={by + bh * 0.45} x2={x + ((j + 1) * w) / 10} y2={by + bh} stroke={tk.color.ink} strokeWidth={2} opacity={j + 1 < nt || bw > ((j + 1) * w) / 10 + 4 ? 0.45 : 0} />)}
            <line x1={x + bw} y1={by - 6} x2={x + bw} y2={by + bh + 10} stroke={tk.color.text} strokeWidth={tk.stroke.thin} strokeLinecap="round" />
          </g>
        );
      })}
      {showRatio && kr > 0 && (
        <g transform={`translate(${x + w - rw / 2} ${y + smallRow * rowH + tk.size.label + 12 + bh / 2 + 9}) rotate(${-4 + Math.sin(t * 1.4) * 1.5}) scale(${kr})`}>
          <rect x={-rw / 2} y={-20} width={rw} height={40} rx={tk.radius.sm} fill={tk.color.accentAlt} stroke={tk.color.ink} strokeWidth={tk.stroke.thin} />
          <text x={0} y={11} textAnchor="middle" fontFamily={tk.font.display} fontSize={30} fill={tk.color.text}>{rtxt}</text>
        </g>
      )}
    </g>
  );
};

export type TimelineEvent = { date: string; label: string };

/** Dated ticks revealed along k on a horizontal line. (x, y) = left end of the line. Dates sit above,
 *  labels below (use "\n" for a second line). `current` lights one event. */
export const Timeline: React.FC<{ x: number; y: number; w: number; events: TimelineEvent[]; k?: number; t?: number; current?: number; color?: string; tk?: KitTokens }> = ({ x, y, w, events, k = 1, t = 0, current, color, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.accent;
  const kl = easeInOut(seg(k, 0, 0.85));
  const n = events.length;
  return (
    <g>
      <line x1={x} y1={y} x2={x + w} y2={y} stroke={tk.color.grid} strokeWidth={tk.stroke.base} strokeLinecap="round" />
      <line x1={x} y1={y} x2={x + w * kl} y2={y} stroke={tk.color.line} strokeWidth={tk.stroke.base} strokeLinecap="round" />
      <circle cx={x + w * kl} cy={y} r={7 + 3 * pulse(t, 1.3)} fill={tk.color.text} />
      {events.map((ev, i) => {
        const u = (i + 0.5) / n, ex = x + w * u;
        const e = pop((kl - u) / 0.14);
        if (e <= 0) return null;
        const on = current === i;
        const lines = ev.label.split("\n");
        return (
          <g key={i} transform={`translate(${ex} ${y})`}>
            {on && <circle r={20 + 8 * pulse(t, 1.2)} fill={c} opacity={0.25} />}
            <g transform={`scale(${e})`}>
              <line x1={0} y1={-26} x2={0} y2={0} stroke={c} strokeWidth={tk.stroke.thin} />
              <circle r={on ? 14 : 11} fill={on ? c : tk.color.panelDark} stroke={c} strokeWidth={tk.stroke.base} />
              <text x={0} y={-38} textAnchor="middle" fontFamily={tk.font.display} fontSize={tk.size.title} fill={on ? c : tk.color.text}>{ev.date}</text>
              {lines.map((ln, j) => <text key={j} x={0} y={44 + j * tk.size.small * 1.25} textAnchor="middle" fontFamily={tk.font.ui} fontWeight={600} fontSize={tk.size.small} fill={tk.color.textDim}>{ln}</text>)}
            </g>
          </g>
        );
      })}
    </g>
  );
};
