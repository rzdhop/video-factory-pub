import React from "react";
import { clamp01, impulse, pop, textW, type Pt } from "../../kit";
import type { Box, Tk } from "./types";

/* ep-001-made-by-ai "Can an AI make this video by itself?" (episodes/ep-001-made-by-ai/style.md).
 * Shared parts, drawn ONCE; the chapter files import this file and never edit it.
 * World: a small film set that is also a factory floor, printed like a two-colour poster: flat paper shapes
 * (tk.color.text) on the ink ground, paper tints for what is not the subject, ONE accent per shot.
 *  - geo: the one layout (floor, belt, where the chair, the frame and the clapper stand), fractions of the scene box.
 *  - Floor, Belt: the ground line and the conveyor. DirectorChair, Clapper: the set of frame 0 and of the last frame.
 *  - VideoFrame: THIS video, the vertical frame we follow; Logo: the same frame complete, in the brand colours.
 *  - AskCounter: the three asks. Hand: the person. Sign, Check, YesButton, Barrier, MitTag, Book: props of the line. */

export const geo = (box: Box) => {
  const u = box.h / 768;
  const floor = box.y + box.h * 0.74;
  return {
    /** drawing unit: 1 at the 768 px box of layout 2 */
    u,
    /** the ground everything stands on */
    floor,
    /** top surface of the conveyor */
    belt: floor - 34 * u,
    /** x of the director's chair, of the frame on the belt, of the clapperboard, and where the belt starts */
    chair: box.x + box.w * 0.2,
    frame: box.x + box.w * 0.54,
    clapper: box.x + box.w * 0.85,
    beltStart: box.x + box.w * 0.39,
    chairH: box.h * 0.64,
    frameH: box.h * 0.56,
    /** scale of the clapperboard */
    clapperS: 1.22 * u,
    /** first mark of the ask counter */
    counter: [box.x + box.w * 0.57, box.y + box.h * 0.055] as Pt,
    /** centre line of the station signs */
    sign: box.y + box.h * 0.185,
    /** size of every word drawn in a scene */
    label: 50 * u,
  };
};

/** A word of the scene: Space Grotesk bold, one size for the whole episode unless a part needs another. */
export const Word: React.FC<{ x: number; y: number; text: string; size: number; fill: string; anchor?: "start" | "middle" | "end"; tk: Tk; spacing?: number }> = ({ x, y, text, size, fill, anchor = "middle", tk, spacing = 0 }) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={tk.font.ui} fontWeight={700} fontSize={size} fill={fill} letterSpacing={spacing}>{text}</text>
);

/** The ground: one paper line across the frame (flat poster: no slab, no gradient under it). */
export const Floor: React.FC<{ box: Box; tk: Tk }> = ({ box, tk }) => {
  const g = geo(box);
  return (
    <g>
      <rect x={box.x - 240} y={g.floor - tk.stroke.base / 2} width={box.w + 480} height={tk.stroke.base} fill={tk.color.text} />
    </g>
  );
};

/** The conveyor: a paper band from `from` to past the right edge, rollers under it, ticks that move with `run` (px). */
export const Belt: React.FC<{ box: Box; from?: number; run: number; tk: Tk }> = ({ box, from, run, tk }) => {
  const g = geo(box), u = g.u;
  const x0 = from ?? box.x - 240, x1 = box.x + box.w + 240;
  const th = 16 * u, step = 92 * u;
  const off = ((run % step) + step) % step;
  const first = Math.ceil((x0 + 20 * u - (x0 - off)) / step);
  const ticks: number[] = [];
  for (let i = first; x0 - off + i * step < x1; i++) ticks.push(x0 - off + i * step);
  const rollers: number[] = [];
  for (let x = x0 + 30 * u; x < x1; x += 150 * u) rollers.push(x);
  return (
    <g>
      {rollers.map((x, i) => (
        <g key={i} transform={`translate(${x} ${g.belt + th + 9 * u})`}>
          <circle r={9 * u} fill={tk.color.steel} />
          <rect x={-2 * u} y={-9 * u} width={4 * u} height={18 * u} fill={tk.color.ink} transform={`rotate(${(run / (9 * u)) * 57.3})`} />
        </g>
      ))}
      <rect x={x0} y={g.belt} width={x1 - x0} height={th} rx={th / 2} fill={tk.color.text} />
      {ticks.map((x, i) => <rect key={i} x={x} y={g.belt + 4 * u} width={26 * u} height={th - 8 * u} rx={3 * u} fill={tk.color.ink} />)}
    </g>
  );
};

/** The director's chair, seen from the front, with nobody in it: crossed legs, canvas seat, canvas backrest that
 *  reads AI. `accent` puts the accent on the backrest (the focus of frame 0 and of the last frame); `hop` 0..1 lifts it. */
export const DirectorChair: React.FC<{ x: number; floor: number; h: number; accent?: boolean; hop?: number; t: number; tk: Tk }> = ({ x, floor, h, accent = false, hop = 0, t, tk }) => {
  const w = h * 0.6, leg = h * 0.035, seatY = -h * 0.54, backTop = -h, backH = h * 0.21;
  const sway = Math.sin(t * 1.3) * 0.7;
  return (
    <g transform={`translate(${x} ${floor - hop * h * 0.06})`}>
      {/* rear cross, darker: the far pair of legs */}
      <g stroke={tk.color.steel} strokeWidth={leg} strokeLinecap="round">
        <line x1={-w * 0.36} y1={-leg / 2} x2={w * 0.36} y2={seatY + h * 0.05} />
        <line x1={w * 0.36} y1={-leg / 2} x2={-w * 0.36} y2={seatY + h * 0.05} />
      </g>
      {/* front cross and the two posts that carry the armrests and the backrest */}
      <g stroke={tk.color.text} strokeWidth={leg * 1.25} strokeLinecap="round">
        <line x1={-w / 2} y1={-leg / 2} x2={w / 2} y2={seatY + h * 0.04} />
        <line x1={w / 2} y1={-leg / 2} x2={-w / 2} y2={seatY + h * 0.04} />
        <line x1={-w / 2} y1={seatY} x2={-w / 2} y2={backTop + backH * 0.2} />
        <line x1={w / 2} y1={seatY} x2={w / 2} y2={backTop + backH * 0.2} />
      </g>
      <circle cy={seatY * 0.5 + h * 0.01} r={leg * 0.7} fill={tk.color.ink} />
      {/* canvas seat, sagging a little because nobody sits on it */}
      <path d={`M ${-w / 2 - leg} ${seatY - h * 0.03} L ${w / 2 + leg} ${seatY - h * 0.03} L ${w / 2 + leg} ${seatY + h * 0.03} Q 0 ${seatY + h * 0.075} ${-w / 2 - leg} ${seatY + h * 0.03} Z`} fill={tk.color.text} />
      {/* armrests */}
      <rect x={-w / 2 - h * 0.075} y={-h * 0.76} width={h * 0.15} height={h * 0.045} rx={h * 0.02} fill={tk.color.text} />
      <rect x={w / 2 - h * 0.075} y={-h * 0.76} width={h * 0.15} height={h * 0.045} rx={h * 0.02} fill={tk.color.text} />
      {/* backrest: the canvas band with the name of whoever the chair is kept for */}
      <g transform={`rotate(${sway} 0 ${backTop + backH / 2})`}>
        <rect x={-w / 2 - leg * 0.6} y={backTop} width={w + leg * 1.2} height={backH} rx={tk.radius.sm} fill={accent ? tk.color.accent : tk.color.text} />
        <text x={0} y={backTop + backH * 0.79} textAnchor="middle" fontFamily={tk.font.ui} fontWeight={700} fontSize={backH * 0.84} fill={tk.color.ink} letterSpacing={backH * 0.06}>AI</text>
      </g>
    </g>
  );
};

/** Striped bar of the clapperboard and of the barrier: paper with ink diagonals, drawn from (0, 0) to (w, h). */
const Stripes: React.FC<{ w: number; h: number; tk: Tk }> = ({ w, h, tk }) => {
  const n = Math.max(3, Math.round(w / (h * 1.9)));
  const step = w / n, slant = h * 0.7;
  return (
    <g>
      <rect width={w} height={h} rx={h * 0.18} fill={tk.color.text} />
      {Array.from({ length: n }).map((_, i) => {
        const x = i * step + step * 0.2;
        return <path key={i} d={`M ${x + slant} ${h * 0.12} L ${x + slant + step * 0.42} ${h * 0.12} L ${x + step * 0.42} ${h * 0.88} L ${x} ${h * 0.88} Z`} fill={tk.color.ink} />;
      })}
    </g>
  );
};

/** The clapperboard, standing on the floor. `open` 0..1 lifts the arm; `s` scales it (1 = 170 px wide). */
export const Clapper: React.FC<{ x: number; floor: number; s: number; open: number; tilt?: number; tk: Tk }> = ({ x, floor, s, open, tilt = -6, tk }) => {
  const w = 170 * s, h = 112 * s, bar = 28 * s;
  return (
    <g transform={`translate(${x} ${floor}) rotate(${tilt})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={tk.radius.sm} fill={tk.color.text} />
      {[0.34, 0.58, 0.8].map((k, i) => <rect key={i} x={-w / 2 + 16 * s} y={-h + h * k} width={(w - 32 * s) * (i === 2 ? 0.55 : 1)} height={7 * s} rx={3 * s} fill={tk.color.ink} />)}
      <g transform={`translate(${-w / 2} ${-h - bar - 5 * s})`}><Stripes w={w} h={bar} tk={tk} /></g>
      <g transform={`translate(${-w / 2} ${-h - bar - 5 * s}) rotate(${-open * 30} ${bar * 0.3} ${bar * 0.5}) translate(0 ${-bar - 5 * s})`}><Stripes w={w} h={bar} tk={tk} /></g>
      <circle cx={-w / 2 + bar * 0.3} cy={-h - bar * 1.5 - 7 * s} r={5 * s} fill={tk.color.steel} />
    </g>
  );
};

/** THIS video: a vertical rounded frame, the one of the logo. (x, y) = bottom centre, `h` = outer height.
 *  `play` 0..1 draws the play triangle, `bars` the three caption bars. `accent` says which part carries the accent:
 *  the part just added while it travels, or "logo" for the brand colours (triangle and middle bar). */
export const VideoFrame: React.FC<{ x: number; y: number; h: number; play?: number; bars?: [number, number, number]; accent?: "none" | "play" | "bars" | "frame" | "logo"; tilt?: number; squash?: number; tk: Tk }> = ({ x, y, h, play = 0, bars = [0, 0, 0], accent = "none", tilt = 0, squash = 0, tk }) => {
  // geometry of the logo source (512 x 512): frame 212 x 368 at (150, 72), stroke 28; outer bottom at y = 454
  const s = h / 396;
  const paper = tk.color.text, ac = tk.color.accent;
  const playK = pop(play);
  const bar = (i: number, bx: number, by: number, bw: number) => {
    const k = clamp01(bars[i]);
    if (k <= 0) return null;
    const c = accent === "bars" || (accent === "logo" && i === 1) ? ac : paper;
    return <rect key={i} x={bx} y={by} width={Math.max(26, bw * pop(k))} height={26} rx={13} fill={c} />;
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s * (1 + squash * 0.06)} ${s * (1 - squash * 0.08)}) translate(-256 -454)`}>
      <rect x={150} y={72} width={212} height={368} rx={40} fill={tk.color.ink} stroke={accent === "frame" ? ac : paper} strokeWidth={28} />
      {play > 0 && (
        <g transform={`translate(262 222) scale(${playK}) translate(-262 -222)`}>
          <path d="M222 166v112l96-56z" fill={accent === "play" || accent === "logo" ? ac : paper} />
        </g>
      )}
      {bar(0, 198, 318, 64)}
      {bar(1, 274, 318, 40)}
      {bar(2, 198, 360, 92)}
    </g>
  );
};

/** The project logo: the complete frame in the brand colours (paper frame, accent triangle, one accent bar). */
export const Logo: React.FC<{ x: number; y: number; h: number; squash?: number; tk: Tk }> = ({ x, y, h, squash = 0, tk }) => (
  <VideoFrame x={x} y={y} h={h} play={1} bars={[1, 1, 1]} accent="logo" squash={squash} tk={tk} />
);

/** The three asks, counted: a word and three marks. `fills[i]` = time (clock of `t`) when ask i is made; a mark
 *  pops in the accent when it fills and settles to paper after `hold` s. `k` 0..1 brings the counter in. */
export const AskCounter: React.FC<{ box: Box; fills: [number, number, number]; t: number; k?: number; hold?: number; tk: Tk }> = ({ box, fills, t, k = 1, hold = 1.3, tk }) => {
  if (k <= 0) return null;
  const g = geo(box), u = g.u;
  const [x, y] = g.counter;
  const r = 24 * u, gap = 62 * u, size = 40 * u;
  const lw = textW("ASKS", size, "ui") + 14 * u;
  return (
    <g>
      <g transform={`translate(${x} ${y}) scale(${pop(clamp01(k * 1.6))})`}>
        <Word x={0} y={size * 0.36} text="ASKS" size={size} fill={tk.color.text} anchor="start" tk={tk} spacing={1} />
      </g>
      {fills.map((when, i) => {
        const cx = x + lw + r + i * gap + 12 * u;
        const inK = pop(clamp01((k - 0.2 - i * 0.2) / 0.4));
        if (inK <= 0) return null;
        const age = t - when;
        const full = age >= 0;
        const hit = full ? 1 + impulse(age, 3.2, 7) * 0.45 : 1 + Math.sin(t * 3 + i) * 0.03;
        return (
          <g key={i} transform={`translate(${cx} ${y}) scale(${inK * hit})`}>
            <circle r={r} fill={full ? (age < hold ? tk.color.accent : tk.color.text) : tk.color.ink} stroke={full ? "none" : tk.color.text} strokeWidth={tk.stroke.thin} />
            {full && <path d={`M ${-r * 0.42} ${r * 0.02} L ${-r * 0.1} ${r * 0.36} L ${r * 0.46} ${-r * 0.34}`} fill="none" stroke={tk.color.ink} strokeWidth={tk.stroke.thin * 1.2} strokeLinecap="round" strokeLinejoin="round" />}
          </g>
        );
      })}
    </g>
  );
};

/** The person: one paper hand on a sleeve that comes from outside the frame. (x, y) = the tip of the index finger;
 *  `rot` turns the whole arm around that tip (0 = the arm comes from straight above, 60 = from the right, a little
 *  above the horizontal). The scenes bring it in from the right edge so the sleeve never crosses the HUD band. */
export const Hand: React.FC<{ x: number; y: number; rot?: number; u: number; tk: Tk }> = ({ x, y, rot = 0, u, tk }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${u}) translate(29 0)`}>
    <rect x={-46} y={-1000} width={92} height={830} fill={tk.color.steel} />
    <rect x={-56} y={-196} width={112} height={34} rx={10} fill={tk.color.pink} />
    <rect x={-44} y={-170} width={88} height={96} rx={26} fill={tk.color.text} />
    <rect x={-44} y={-92} width={30} height={92} rx={15} fill={tk.color.text} />
    <rect x={-10} y={-92} width={54} height={40} rx={18} fill={tk.color.text} />
    <rect x={36} y={-150} width={26} height={58} rx={13} fill={tk.color.text} transform="rotate(-24 49 -121)" />
    <path d="M -8 -74 L 44 -74 M 12 -58 L 44 -58" stroke={tk.color.ink} strokeWidth={4} strokeLinecap="round" />
  </g>
);

/** A station sign over the belt: a paper plate with one word, on a post that goes down to `foot`.
 *  `on` = the station at work (paper); otherwise a paper tint. `k` 0..1 brings it in. */
export const Sign: React.FC<{ x: number; y: number; foot: number; text: string; on?: boolean; k?: number; u: number; tk: Tk }> = ({ x, y, foot, text, on = true, k = 1, u, tk }) => {
  if (k <= 0) return null;
  const size = 50 * u, w = textW(text, size, "ui") + 64 * u, h = 90 * u;
  const c = on ? tk.color.text : tk.color.steel;
  return (
    <g>
      <rect x={x - 5 * u} y={y} width={10 * u} height={foot - y} fill={tk.color.steel} />
      <g transform={`translate(${x} ${y}) scale(${pop(k)})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={tk.radius.md} fill={c} />
        <Word x={0} y={size * 0.35} text={text} size={size} fill={tk.color.ink} tk={tk} spacing={1} />
      </g>
    </g>
  );
};

/** A round check badge: what the second agent leaves on the frame. `k` 0..1 = the stamp landing. */
export const Check: React.FC<{ x: number; y: number; r: number; k: number; accent?: boolean; tk: Tk }> = ({ x, y, r, k, accent = false, tk }) => {
  if (k <= 0) return null;
  const land = 1 + (1 - clamp01(k * 3)) * 1.2 + impulse(Math.max(0, k - 0.33) * 0.6, 4, 9) * 0.18;
  return (
    <g transform={`translate(${x} ${y}) rotate(-10) scale(${land})`}>
      <circle r={r} fill={accent ? tk.color.accent : tk.color.text} stroke={tk.color.ink} strokeWidth={tk.stroke.thin} />
      <path d={`M ${-r * 0.45} ${r * 0.02} L ${-r * 0.12} ${r * 0.38} L ${r * 0.5} ${-r * 0.36}`} fill="none" stroke={tk.color.ink} strokeWidth={r * 0.2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** The YES button: a console standing on the floor with one big push button. `k` 0..1 pops it out of the floor,
 *  `press` 0..1 pushes the button in, `accent` puts the accent on the button. */
export const YesButton: React.FC<{ x: number; floor: number; k: number; press?: number; accent?: boolean; u: number; tk: Tk }> = ({ x, floor, k, press = 0, accent = true, u, tk }) => {
  if (k <= 0) return null;
  const w = 280 * u, h = 196 * u, bw = 172 * u, bh = 70 * u * (1 - 0.6 * clamp01(press));
  return (
    <g transform={`translate(${x} ${floor}) scale(1 ${pop(k)})`}>
      <rect x={-bw / 2} y={-h - bh + 8 * u} width={bw} height={bh + 14 * u} rx={bw * 0.2} fill={accent ? tk.color.accent : tk.color.steel} />
      <rect x={-w / 2 - 10 * u} y={-h} width={w + 20 * u} height={24 * u} rx={8 * u} fill={tk.color.steel} />
      <path d={`M ${-w / 2} ${-h + 20 * u} L ${w / 2} ${-h + 20 * u} L ${w / 2 + 14 * u} 0 L ${-w / 2 - 14 * u} 0 Z`} fill={tk.color.text} />
      <Word x={0} y={-h * 0.5 + 52 * u} text="YES" size={104 * u} fill={tk.color.ink} tk={tk} spacing={3} />
    </g>
  );
};

/** The barrier across the belt: a post and a striped arm reaching left. `lift` 0..1 raises the arm. */
export const Barrier: React.FC<{ x: number; floor: number; lift: number; shake?: number; u: number; tk: Tk }> = ({ x, floor, lift, shake = 0, u, tk }) => {
  const ph = 300 * u, len = 200 * u, bar = 36 * u;
  return (
    <g transform={`translate(${x} ${floor})`}>
      <rect x={-17 * u} y={-ph} width={34 * u} height={ph} rx={8 * u} fill={tk.color.text} />
      <rect x={-34 * u} y={-16 * u} width={68 * u} height={16 * u} rx={5 * u} fill={tk.color.steel} />
      <g transform={`translate(0 ${-ph + 26 * u}) rotate(${lift * 58 + shake * 3})`}>
        <g transform={`translate(${-len} ${-bar / 2})`}><Stripes w={len} h={bar} tk={tk} /></g>
        <circle r={15 * u} fill={tk.color.steel} />
      </g>
    </g>
  );
};

/** The licence tag: a paper label hanging from a string at (x, y). `swing` in degrees, `k` 0..1 drops it in. */
export const MitTag: React.FC<{ x: number; y: number; k: number; swing?: number; accent?: boolean; u: number; tk: Tk }> = ({ x, y, k, swing = 0, accent = false, u, tk }) => {
  if (k <= 0) return null;
  const w = 190 * u, h = 96 * u, drop = (1 - pop(k)) * -90 * u;
  return (
    <g transform={`translate(${x} ${y + drop}) rotate(${swing})`}>
      <rect x={-2.5 * u} y={0} width={5 * u} height={36 * u} fill={tk.color.steel} />
      <g transform={`translate(${w / 2 - 22 * u} ${34 * u - h / 2 + 8 * u}) `}>
        <path d={`M ${-w / 2 + 24 * u} 0 L ${w / 2} 0 L ${w / 2} ${h} L ${-w / 2 + 24 * u} ${h} L ${-w / 2} ${h / 2} Z`} fill={accent ? tk.color.accent : tk.color.text} strokeLinejoin="round" stroke={accent ? tk.color.accent : tk.color.text} strokeWidth={10 * u} />
        <circle cx={-w / 2 + 22 * u} cy={h / 2} r={8 * u} fill={tk.color.ink} />
        <Word x={14 * u} y={h / 2 + 22 * u} text="MIT" size={62 * u} fill={tk.color.ink} tk={tk} spacing={2} />
      </g>
    </g>
  );
};

/** The rulebook: a closed paper book standing on the belt. (x, y) = bottom centre; `k` 0..1 pops it in. */
export const Book: React.FC<{ x: number; y: number; k: number; accent?: boolean; color?: string; u: number; tk: Tk }> = ({ x, y, k, accent = false, color, u, tk }) => {
  if (k <= 0) return null;
  const w = 128 * u, h = 168 * u;
  return (
    <g transform={`translate(${x} ${y}) rotate(-5) scale(${pop(k)})`}>
      <rect x={-w / 2 + 10 * u} y={-h + 8 * u} width={w} height={h} rx={8 * u} fill={tk.color.steel} />
      <rect x={-w / 2} y={-h} width={w} height={h} rx={8 * u} fill={accent ? tk.color.accent : color ?? tk.color.text} stroke={tk.color.ink} strokeWidth={tk.stroke.thin} />
      <rect x={-w / 2 + 16 * u} y={-h} width={7 * u} height={h} fill={tk.color.ink} />
      {[0.24, 0.38, 0.52].map((p, i) => <rect key={i} x={-w / 2 + 38 * u} y={-h + h * p} width={(w - 56 * u) * (i === 2 ? 0.6 : 1)} height={9 * u} rx={4 * u} fill={tk.color.ink} />)}
    </g>
  );
};
