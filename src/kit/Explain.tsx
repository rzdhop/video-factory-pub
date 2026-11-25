import React from "react";
import { DEFAULT_TOKENS, textW, shade, type KitTokens } from "./tokens";
import { clamp01, easeInOut, easeOut, lerp, pop, pulse, seg, stagger } from "./anim";

/* Explain family: parts that name, point at, or situate what is on screen.
 * Conventions for the whole kit: `k` = reveal progress 0..1, `t` = seconds for idle motion, `tk` = tokens. */

type Anchor = "start" | "middle" | "end";

/** Small pill label with a pulsing dot. (x, y) = anchor point, vertically centred. */
export const Tag: React.FC<{ x: number; y: number; text: string; k?: number; t?: number; color?: string; size?: number; anchor?: Anchor; filled?: boolean; tk?: KitTokens }> = ({ x, y, text, k = 1, t = 0, color, size, anchor = "start", filled = false, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.accent, fs = size ?? tk.size.small;
  const h = fs * 1.8, dot = fs * 0.24;
  // a look whose HUD font is monospaced (terminal-root) needs the mono width, or the text runs out of the pill
  const w = textW(text, fs, /mono/i.test(tk.font.ui) ? "mono" : "ui") + fs * 1.5 + dot * 2 + fs * 0.2;
  const ax = anchor === "start" ? 0 : anchor === "middle" ? -w / 2 : -w;
  return (
    <g transform={`translate(${x + ax + w / 2} ${y}) scale(${pop(k)})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={filled ? c : tk.color.panelDark} stroke={c} strokeWidth={tk.stroke.thin} />
      <circle cx={-w / 2 + fs * 0.65 + dot} cy={0} r={dot * (0.8 + 0.35 * pulse(t, 1.2))} fill={filled ? tk.color.ink : c} />
      <text x={-w / 2 + fs * 0.95 + dot * 2} y={fs * 0.35} fontFamily={tk.font.ui} fontWeight={600} fontSize={fs} fill={filled ? tk.color.ink : tk.color.text}>{text}</text>
    </g>
  );
};

/** A term and its three-word meaning. (x, y) = top-left. The term slams in first, the meaning pops under it. */
export const GlossaryChip: React.FC<{ x: number; y: number; term: string; meaning: string; k?: number; t?: number; color?: string; tk?: KitTokens }> = ({ x, y, term, meaning, k = 1, t = 0, color, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.accent;
  const ts = 46, ms = tk.size.label;
  const tw = textW(term.toUpperCase(), ts, "display", tk.font.wide) + 44, th = 74;
  const mw = textW(meaning, ms, /mono/i.test(tk.font.ui) ? "mono" : "ui") + 44, mh = 54;
  const a = pop(seg(k, 0, 0.55)), m = pop(seg(k, 0.4, 1));
  const tilt = -2 + Math.sin(t * 1.1) * 0.7;
  return (
    <g>
      {m > 0 && (
        <g transform={`translate(${x + 22 + mw / 2} ${y + th - 8 + mh / 2}) scale(${m})`}>
          <rect x={-mw / 2} y={-mh / 2} width={mw} height={mh} rx={tk.radius.md} fill={tk.color.panel} stroke={tk.color.panelLight} strokeWidth={tk.stroke.thin} />
          <text x={0} y={ms * 0.5} textAnchor="middle" fontFamily={tk.font.ui} fontWeight={600} fontSize={ms} fill={tk.color.text}>{meaning}</text>
        </g>
      )}
      <g transform={`translate(${x + tw / 2} ${y + th / 2}) rotate(${tilt}) scale(${a})`}>
        <rect x={-tw / 2} y={-th / 2 + tk.depth} width={tw} height={th} rx={tk.radius.md} fill={shade(c, -0.45)} />
        <rect x={-tw / 2} y={-th / 2} width={tw} height={th} rx={tk.radius.md} fill={c} />
        <rect x={-tw / 2 + 6} y={-th / 2 + 6} width={tw - 12} height={th * 0.36} rx={tk.radius.sm} fill="#fff" opacity={0.22} />
        <text x={0} y={ts * 0.37} textAnchor="middle" fontFamily={tk.font.display} fontSize={ts} fill={tk.color.ink} letterSpacing={1}>{term.toUpperCase()}</text>
      </g>
    </g>
  );
};

/** Label tied to a point by a drawn leader line. (x, y) = the point shown, (lx, ly) = where the label attaches;
 *  the label grows away from the point. */
export const Callout: React.FC<{ x: number; y: number; lx: number; ly: number; text: string; k?: number; t?: number; color?: string; size?: number; tk?: KitTokens }> = ({ x, y, lx, ly, text, k = 1, t = 0, color, size, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.accent, fs = size ?? tk.size.label;
  const dir = lx >= x ? 1 : -1;
  const ex = x + dir * Math.min(Math.abs(ly - y), Math.abs(lx - x) * 0.6);
  const kd = pop(seg(k, 0, 0.3)), kl = easeOut(seg(k, 0.15, 0.7)), kb = pop(seg(k, 0.55, 1));
  const w = textW(text, fs) + fs * 1.3, h = fs * 1.9;
  const ring = (t * 0.8) % 1;
  return (
    <g>
      {kl > 0 && <path d={`M ${x} ${y} L ${ex} ${ly} L ${lx} ${ly}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - kl} fill="none" stroke={c} strokeWidth={tk.stroke.thin} strokeLinejoin="round" />}
      <circle cx={x} cy={y} r={10 + ring * 20} fill="none" stroke={c} strokeWidth={tk.stroke.thin} opacity={(1 - ring) * 0.8 * kd} />
      <circle cx={x} cy={y} r={9 * kd} fill={c} stroke={tk.color.ink} strokeWidth={tk.stroke.thin} />
      {kb > 0 && (
        <g transform={`translate(${lx} ${ly}) scale(${kb})`}>
          <rect x={dir > 0 ? 0 : -w} y={-h / 2} width={w} height={h} rx={tk.radius.sm} fill={tk.color.panelDark} stroke={c} strokeWidth={tk.stroke.thin} />
          <text x={dir > 0 ? w / 2 : -w / 2} y={fs * 0.35} textAnchor="middle" fontFamily={tk.font.ui} fontWeight={600} fontSize={fs} fill={tk.color.text}>{text}</text>
        </g>
      )}
    </g>
  );
};

/** Side panel holding an analogy. (x, y) = top-left; children are drawn in the content area with (0, 0) at its
 *  top-left (content size = w - 32 by h - 78). `morph` 0..1 shrinks the panel toward `to` (the real thing). */
export const AnalogyPanel: React.FC<{ x: number; y: number; w: number; h: number; title: string; k?: number; t?: number; morph?: number; to?: [number, number]; color?: string; children?: React.ReactNode; tk?: KitTokens }> = ({ x, y, w, h, title, k = 1, t = 0, morph = 0, to, color, children, tk = DEFAULT_TOKENS }) => {
  if (k <= 0 || morph >= 1) return null;
  const c = color ?? tk.color.cyan;
  const e = pop(k), m = easeInOut(morph);
  const cx0 = x + w / 2, cy0 = y + h / 2 + Math.sin(t * 1.3) * 3;
  const cx = lerp(cx0, to ? to[0] : cx0, m) + (1 - e) * 90, cy = lerp(cy0, to ? to[1] : cy0, m);
  const sc = lerp(0.86 + 0.14 * e, 0.12, m);
  const head = 62;
  const tfs = Math.min(tk.size.label, ((w - 70) / Math.max(1, textW(title.toUpperCase(), 100) + title.length)) * 100);
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${(1 - e) * 5 - m * 8}) scale(${sc})`} opacity={clamp01(k * 5) * (1 - seg(m, 0.8, 1))}>
      <g transform={`translate(${-w / 2} ${-h / 2})`}>
        <rect x={0} y={tk.depth} width={w} height={h} rx={tk.radius.lg} fill="#000" opacity={0.35} />
        <rect x={0} y={0} width={w} height={h} rx={tk.radius.lg} fill={tk.color.panel} stroke={c} strokeWidth={tk.stroke.thin} />
        <path d={`M 0 ${head} V ${tk.radius.lg} Q 0 0 ${tk.radius.lg} 0 H ${w - tk.radius.lg} Q ${w} 0 ${w} ${tk.radius.lg} V ${head} Z`} fill={tk.color.panelLight} />
        <circle cx={30} cy={head / 2} r={7 + 2 * pulse(t, 0.9)} fill={c} />
        <text x={50} y={head / 2 + tfs * 0.36} fontFamily={tk.font.ui} fontWeight={600} fontSize={tfs} fill={tk.color.text} letterSpacing={1}>{title.toUpperCase()}</text>
        <g transform={`translate(16 ${head + 8})`}>{children}</g>
      </g>
    </g>
  );
};

/** Vertical stack of named layers with one lit, to sit in a corner as a "you are here". (x, y) = top-left. */
export const MiniMap: React.FC<{ x: number; y: number; w?: number; layers: string[]; current: number; k?: number; t?: number; rowH?: number; color?: string; tk?: KitTokens }> = ({ x, y, w = 220, layers, current, k = 1, t = 0, rowH = 46, color, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.accent;
  return (
    <g>
      {layers.map((name, i) => {
        const e = pop(stagger(k, i, layers.length, 0.5));
        if (e <= 0) return null;
        const on = i === current;
        const fs = Math.min(tk.size.small, ((w - 28) / Math.max(1, textW(name, 100))) * 100);
        const yy = y + i * rowH, bh = rowH - 8;
        return (
          <g key={i} transform={`translate(${x + w / 2} ${yy + bh / 2}) scale(${e} ${0.4 + 0.6 * e})`}>
            {on && <rect x={-w / 2 - 5} y={-bh / 2 - 5} width={w + 10} height={bh + 10} rx={tk.radius.sm + 4} fill="none" stroke={c} strokeWidth={tk.stroke.thin} opacity={0.25 + 0.5 * pulse(t, 1)} />}
            <rect x={-w / 2} y={-bh / 2} width={w} height={bh} rx={tk.radius.sm} fill={on ? c : tk.color.panel} stroke={on ? c : tk.color.panelLight} strokeWidth={tk.stroke.thin} />
            <text x={0} y={fs * 0.36} textAnchor="middle" fontFamily={tk.font.ui} fontWeight={600} fontSize={fs} fill={on ? tk.color.ink : tk.color.textDim}>{name}</text>
            {on && <path d="M 0 -9 L 14 0 L 0 9 Z" transform={`translate(${-w / 2 - 26 + Math.sin(t * 5) * 4} 0)`} fill={c} />}
          </g>
        );
      })}
    </g>
  );
};

/** Step n of N. (x, y) = left end, vertically centred. `current` is 1-based. */
export const StepDots: React.FC<{ x: number; y: number; n: number; current: number; k?: number; t?: number; showCount?: boolean; color?: string; tk?: KitTokens }> = ({ x, y, n, current, k = 1, t = 0, showCount = true, color, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.accent;
  const r = 10, gap = 16, wide = 46 + 6 * pulse(t, 1.1);
  let cx = x;
  const items = Array.from({ length: n }).map((_, i) => {
    const on = i === current - 1, w = on ? wide : r * 2;
    const el = (
      <g key={i} transform={`translate(${cx + w / 2} ${y}) scale(${pop(stagger(k, i, n, 0.5))})`}>
        <rect x={-w / 2} y={-r} width={w} height={r * 2} rx={r} fill={on ? c : i < current - 1 ? tk.color.text : "none"} stroke={on ? c : tk.color.text} strokeWidth={tk.stroke.thin} opacity={on ? 1 : i < current - 1 ? 0.9 : 0.6} />
      </g>
    );
    cx += w + gap;
    return el;
  });
  return (
    <g>
      {items}
      {showCount && <text x={cx + 8} y={y + 9} fontFamily={tk.font.mono} fontWeight={500} fontSize={tk.size.label} fill={tk.color.textDim} opacity={clamp01(k * 3)}>{current}/{n}</text>}
    </g>
  );
};

/** Rotated label slammed onto the picture, with a squash on impact. (x, y) = centre. */
export const Stamp: React.FC<{ x: number; y: number; text: string; k?: number; t?: number; color?: string; size?: number; rot?: number; tk?: KitTokens }> = ({ x, y, text, k = 1, t = 0, color, size = 68, rot = -8, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.accentAlt;
  const a = seg(k, 0, 0.35), b = seg(k, 0.35, 1);
  const fall = 1 + (1 - a * a) * 1.7;
  const sq = b > 0 ? Math.exp(-b * 6) * Math.cos(b * 15) * 0.2 : 0;
  const w = textW(text.toUpperCase(), size, "display", tk.font.wide) + size * 0.9, h = size * 1.4;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + Math.sin(t * 0.9) * 0.5}) scale(${fall * (1 + sq)} ${fall * (1 - sq)})`} opacity={clamp01(k * 8)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={tk.radius.md} fill={shade(c, -0.72)} stroke={c} strokeWidth={tk.stroke.bold} />
      <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={tk.radius.sm} fill="none" stroke={c} strokeWidth={2} opacity={0.7} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={tk.font.display} fontSize={size} fill={shade(c, 0.25)} letterSpacing={2}>{text.toUpperCase()}</text>
    </g>
  );
};
