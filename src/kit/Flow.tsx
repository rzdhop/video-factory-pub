import React from "react";
import { DEFAULT_TOKENS, textW, shade, alpha, type KitTokens } from "./tokens";
import { clamp01, easeOut, pop, pulse, seg } from "./anim";
import { curvePath, linePath, samplePath, tangentDeg, type PathFn, type Pt } from "./path";

/* Flow family: things that move between boxes (technical explainers: layers, packets, code, bytes). */

/** Arrow revealed along k, straight (bend 0) or curved. The head rides the tip. `flow` makes the dashes march. */
export const Arrow: React.FC<{ from: Pt; to: Pt; bend?: number; k?: number; t?: number; color?: string; width?: number; head?: number; flow?: boolean; label?: string; tk?: KitTokens }> = ({ from, to, bend = 0, k = 1, t = 0, color, width, head = 22, flow = false, label, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.line, sw = width ?? tk.stroke.base;
  const fn: PathFn = bend ? curvePath(from, to, bend) : linePath(from, to);
  const ke = easeOut(k);
  const [hx, hy] = fn(ke), ang = tangentDeg(fn, ke);
  const hs = pop(seg(k, 0, 0.35)) * (1 + 0.07 * Math.sin(t * 4));
  const [mx, my] = fn(0.5), ma = (tangentDeg(fn, 0.5) * Math.PI) / 180;
  // label sits on the upper side of the line, whatever the direction of travel
  const off = 28, side = Math.cos(ma) >= 0 ? 1 : -1;
  const lx = mx + Math.sin(ma) * off * side, ly = my - Math.cos(ma) * off * side;
  const kl = pop(seg(k, 0.5, 1));
  return (
    <g>
      <path d={samplePath(fn, 0, ke)} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={flow ? "16 12" : undefined} strokeDashoffset={flow ? -t * 44 : undefined} />
      <path d={`M ${sw} 0 L ${-head} ${-head * 0.55} L ${-head * 0.7} 0 L ${-head} ${head * 0.55} Z`} transform={`translate(${hx} ${hy}) rotate(${ang}) scale(${hs})`} fill={c} stroke={c} strokeWidth={2} strokeLinejoin="round" />
      {label && kl > 0 && (
        <text x={lx} y={ly + tk.size.small * 0.35} textAnchor="middle" fontFamily={tk.font.ui} fontWeight={600} fontSize={tk.size.small} fill={tk.color.text} stroke={tk.color.ink} strokeWidth={5} paintOrder="stroke" strokeLinejoin="round" transform={`translate(${lx} ${ly}) scale(${kl}) translate(${-lx} ${-ly})`}>{label}</text>
      )}
    </g>
  );
};

/** Glowing dot with a short trail at position k (0..1) of a path. For a loop: k = (t * speed) % 1. */
export const Packet: React.FC<{ path: PathFn; k: number; t?: number; color?: string; r?: number; trail?: number; tk?: KitTokens }> = ({ path, k, t = 0, color, r = 11, trail = 0.14, tk = DEFAULT_TOKENS }) => {
  const c = color ?? tk.color.cyan;
  const u = clamp01(k), n = 7;
  const [x, y] = path(u);
  const g = 0.8 + 0.3 * pulse(t, 2.2);
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const j = n - i, uu = u - (trail * j) / n;
        if (uu < 0) return null;
        const [tx, ty] = path(uu);
        return <circle key={i} cx={tx} cy={ty} r={r * (1 - j / (n + 1)) * 0.85} fill={c} opacity={0.6 * (1 - j / (n + 1))} />;
      })}
      <circle cx={x} cy={y} r={r * 2.6 * g} fill={c} opacity={0.14} />
      <circle cx={x} cy={y} r={r * 1.7 * g} fill={c} opacity={0.28} />
      <circle cx={x} cy={y} r={r} fill={c} />
      <circle cx={x - r * 0.2} cy={y - r * 0.2} r={r * 0.45} fill="#fff" opacity={0.9} />
    </g>
  );
};

/** Labelled rounded slab (a layer, a server, a step) with a light side and a shadow side. (x, y) = top-left. */
export const Block: React.FC<{ x: number; y: number; w: number; h: number; label: string; sub?: string; color?: string; k?: number; t?: number; active?: boolean; tk?: KitTokens }> = ({ x, y, w, h, label, sub, color, k = 1, t = 0, active = false, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.panelLight;
  const e = pop(k);
  const fs = Math.min(tk.size.title, h * (sub ? 0.38 : 0.46), ((w - 28) / Math.max(1, textW(label.toUpperCase(), 100, "display", tk.font.wide))) * 100);
  const ss = Math.min(tk.size.small, h * 0.28, ((w - 24) / Math.max(1, textW(sub ?? "", 100))) * 100);
  const cy = y + h / 2 + Math.sin(t * 1.2 + x * 0.013) * 2.5 + (1 - e) * 26;
  const r = Math.min(tk.radius.md, h / 3);
  const light = shade(c, 0.9) === "#ffffff" ? tk.color.ink : tk.color.text;
  return (
    <g transform={`translate(${x + w / 2} ${cy}) scale(${0.3 + 0.7 * e} ${e})`}>
      {active && <rect x={-w / 2 - 8} y={-h / 2 - 8} width={w + 16} height={h + 16 + tk.depth} rx={r + 8} fill="none" stroke={tk.color.accent} strokeWidth={tk.stroke.thin} opacity={0.35 + 0.6 * pulse(t, 1.1)} />}
      <rect x={-w / 2} y={-h / 2 + tk.depth} width={w} height={h} rx={r} fill={shade(c, -0.5)} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={c} stroke={active ? tk.color.accent : shade(c, 0.22)} strokeWidth={tk.stroke.thin} />
      <rect x={-w / 2 + 7} y={-h / 2 + 7} width={w - 14} height={Math.max(4, h * 0.3)} rx={Math.max(2, r - 5)} fill="#fff" opacity={0.13} />
      <text x={0} y={sub ? -h * 0.02 : fs * 0.37} textAnchor="middle" fontFamily={tk.font.display} fontSize={fs} fill={light} letterSpacing={1}>{label.toUpperCase()}</text>
      {sub && <text x={0} y={h * 0.34} textAnchor="middle" fontFamily={tk.font.ui} fontWeight={600} fontSize={ss} fill={light} opacity={0.82}>{sub}</text>}
    </g>
  );
};

/** Generic app window (no brand): title bar, three neutral dots, content slot. (x, y) = top-left.
 *  Children are drawn with (0, 0) at the top-left of the content area (w by h - 52) and clipped to it.
 *  Give a unique `id` when two windows share the same position. */
export const Win: React.FC<{ x: number; y: number; w: number; h: number; title?: string; k?: number; t?: number; id?: string; children?: React.ReactNode; tk?: KitTokens }> = ({ x, y, w, h, title = "", k = 1, t = 0, id, children, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const e = pop(k), bar = 52, r = tk.radius.md;
  const cid = id ?? `kit-win-${Math.round(x)}-${Math.round(y)}-${Math.round(w)}`;
  return (
    <g transform={`translate(${x + w / 2} ${y + h / 2 + (1 - e) * 50}) scale(${0.8 + 0.2 * e}) translate(${-w / 2} ${-h / 2})`} opacity={clamp01(k * 6)}>
      <defs><clipPath id={cid}><rect x={0} y={bar} width={w} height={h - bar} rx={4} /></clipPath></defs>
      <rect x={0} y={tk.depth} width={w} height={h} rx={r} fill="#000" opacity={0.35} />
      <rect x={0} y={0} width={w} height={h} rx={r} fill={tk.color.panelDark} stroke={tk.color.panelLight} strokeWidth={tk.stroke.thin} />
      <path d={`M 0 ${bar} V ${r} Q 0 0 ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${bar} Z`} fill={tk.color.panelLight} />
      {[0, 1, 2].map((i) => <circle key={i} cx={28 + i * 26} cy={bar / 2} r={8} fill={shade(tk.color.panelLight, 0.35 - i * 0.08)} />)}
      <text x={w / 2} y={bar / 2 + 8} textAnchor="middle" fontFamily={tk.font.mono} fontWeight={500} fontSize={tk.size.small} fill={tk.color.text} opacity={0.9}>{title}</text>
      <circle cx={w - 28} cy={bar / 2} r={6} fill={tk.color.green} opacity={0.35 + 0.65 * pulse(t, 0.8)} />
      <g clipPath={`url(#${cid})`}><g transform={`translate(0 ${bar})`}>{children}</g></g>
    </g>
  );
};

/** Monospace lines typed along k with a blinking caret. (x, y) = top-left, w = width used by the highlight band.
 *  Lines starting with "//" or "#" are drawn as comments. `illustratif` adds the "code shown as an illustration" tag. */
export const CodeLines: React.FC<{ x: number; y: number; w: number; lines: string[]; k?: number; t?: number; highlight?: number; size?: number; numbers?: boolean; illustratif?: boolean | string; tk?: KitTokens }> = ({ x, y, w, lines, k = 1, t = 0, highlight, size, numbers = true, illustratif = false, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const fs = size ?? tk.size.small, lh = fs * 1.55, cw = fs * 0.6;
  const total = lines.reduce((s, l) => s + l.length + 1, 0);
  let left = Math.floor(clamp01(k) * total);
  const gut = numbers ? cw * 3 : 0;
  const tag = typeof illustratif === "string" ? illustratif : "ILLUSTRATIF";
  const tw = textW(tag, fs * 0.72) + 22;
  let caret: [number, number] = [x + gut, y];
  return (
    <g>
      {lines.map((ln, i) => {
        if (left <= 0 && i > 0) return null;
        const shown = ln.slice(0, Math.max(0, left));
        const done = left > ln.length;
        caret = [x + gut + shown.length * cw, y + i * lh];
        left -= ln.length + 1;
        const comment = /^\s*(\/\/|#)/.test(ln);
        const on = highlight === i;
        return (
          <g key={i}>
            {on && <rect x={x - 6} y={y + i * lh + 2} width={(w + 12) * (done ? 1 : 0.02 + 0.98 * (shown.length / Math.max(1, ln.length)))} height={lh - 2} rx={tk.radius.sm} fill={alpha(tk.color.accent, 0.2 + 0.08 * pulse(t, 1))} />}
            {on && <rect x={x - 6} y={y + i * lh + 2} width={5} height={lh - 2} rx={2.5} fill={tk.color.accent} />}
            {numbers && <text x={x + cw * 2} y={y + i * lh + fs * 1.1} textAnchor="end" fontFamily={tk.font.mono} fontWeight={500} fontSize={fs} fill={tk.color.textDim} opacity={0.6}>{i + 1}</text>}
            <text x={x + gut} y={y + i * lh + fs * 1.1} fontFamily={tk.font.mono} fontWeight={500} fontSize={fs} fill={comment ? tk.color.green : on ? tk.color.accent : tk.color.text} style={{ whiteSpace: "pre" }}>{shown}</text>
          </g>
        );
      })}
      {(t * 2) % 1 < 0.55 && <rect x={caret[0] + 2} y={caret[1] + fs * 0.22} width={cw * 0.55} height={fs * 1.05} fill={tk.color.cyan} />}
      {illustratif && (
        <g transform={`translate(${x + w - tw / 2} ${y + lines.length * lh + fs * 0.9}) scale(${pop(seg(k, 0, 0.3))})`}>
          <rect x={-tw / 2} y={-fs * 0.7} width={tw} height={fs * 1.4} rx={fs * 0.7} fill="none" stroke={tk.color.textDim} strokeWidth={2} />
          <text x={0} y={fs * 0.26} textAnchor="middle" fontFamily={tk.font.ui} fontWeight={600} fontSize={fs * 0.72} fill={tk.color.textDim} letterSpacing={1}>{tag}</text>
        </g>
      )}
    </g>
  );
};

/** Hex bytes printed one by one along k. (x, y) = top-left. Numbers are shown as two hex digits.
 *  `highlight` = [first, last] index of a range to frame; after the reveal a scan light keeps running. */
export const ByteRow: React.FC<{ x: number; y: number; bytes: (number | string)[]; k?: number; t?: number; perRow?: number; size?: number; highlight?: [number, number]; color?: string; tk?: KitTokens }> = ({ x, y, bytes, k = 1, t = 0, perRow = 8, size, highlight, color, tk = DEFAULT_TOKENS }) => {
  if (k <= 0) return null;
  const c = color ?? tk.color.cyan, fs = size ?? tk.size.label;
  const cw = fs * 1.75, ch = fs * 1.7, gap = 6, n = bytes.length;
  const pos = clamp01(k) * n;
  const scan = Math.floor(t * 4) % n;
  return (
    <g>
      {bytes.map((b, i) => {
        const local = pos - i;
        if (local <= 0) return null;
        const e = pop(local / 1.5);
        const fresh = k < 1 ? clamp01(1 - (local - 0.2) / 1.5) : 0;
        const hl = highlight && i >= highlight[0] && i <= highlight[1];
        const lit = k >= 1 && i === scan;
        const cx = x + (i % perRow) * (cw + gap) + cw / 2, cy = y + Math.floor(i / perRow) * (ch + gap) + ch / 2;
        const txt = typeof b === "number" ? b.toString(16).toUpperCase().padStart(2, "0") : b;
        const fill = fresh > 0.5 ? c : hl ? alpha(tk.color.accent, 0.28 + 0.12 * pulse(t, 1.2)) : lit ? tk.color.panelLight : tk.color.panel;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${e})`}>
            <rect x={-cw / 2} y={-ch / 2} width={cw} height={ch} rx={tk.radius.sm} fill={fill} stroke={hl ? tk.color.accent : lit ? c : tk.color.panelLight} strokeWidth={tk.stroke.thin} />
            <text x={0} y={fs * 0.36} textAnchor="middle" fontFamily={tk.font.mono} fontWeight={500} fontSize={fs} fill={fresh > 0.5 ? tk.color.ink : hl ? tk.color.accent : tk.color.text}>{txt}</text>
          </g>
        );
      })}
    </g>
  );
};
