import React from "react";
import type { Preset } from "../types";
import { clamp01, easeOut, impulse } from "./../motion";
import { bustFraming } from "./Character";
import { kit } from "../kit";

/** Optional set around the host (episode.host_set), drawn in two passes around the character:
 *  - "back": things behind the host (toilet tank after the reveal)
 *  - "front": things in front of the host (desk, meter, then toilet bowl + paper roll after the reveal)
 *  The set only exists in the bust framing: it fades out during close-ups (closeK) and peeks.
 *  revealAge: seconds since the reveal word (negative before it); the desk is thrown out, the toilet pops in. */
type Props = { preset: Preset; layer: "back" | "front"; width: number; height: number; t: number; closeK: number; peekK: number; desk: boolean; deskLabel?: string; revealAge: number; meter?: { level: number; n: number; label?: string } | null; character?: string };

const CERAMIC = "#F2F2F5";
const CERAMIC_SHADE = "#C2C4D0";
// The set is drawn around a host whose head centre is at (CX, H - HEAD_UP) at scale 1 (the legacy bust framing).
// Layout 2 (preset `host`): `follow` moves and scales it with the real bust framing (Character.bustFraming), so
// desk and toilet stay glued to the host; the legacy layout adds no transform at all.
const CX = 300, HEAD_UP = 330;
const follow = (preset: Preset, H: number, character?: string): string => {
  if (!preset.host) return "";
  const b = bustFraming(preset, H, character);
  return `translate(${b.x} ${b.y}) scale(${b.s}) translate(${-CX} ${-(H - HEAD_UP)}) `;
};
/** Layout 2: props next to the host (the meter) stay inside the safe area of a short: left of the buttons column
 *  (right 14 % of the width) and above the bottom 22 %. The limits are a little tighter than that because the
 *  camera of the film zooms up to 1.1 around the middle of the frame and pushes the corners outwards. */
const SAFE_RIGHT = 0.84, SAFE_BOTTOM = 0.755;

/** Meter: a dial in the empty bottom-right corner; the needle climbs one notch per chapter.
 *  The segment colours are the dial's own scale (green to red), like the lamps of a real gauge. */
const SEG = ["#5BD66A", "#9BD45A", "#D4D44A", "#F2C14E", "#F29A3E", "#EA6A34", "#E23B2E"];
const Meter: React.FC<{ preset: Preset; W: number; H: number; t: number; level: number; n: number; label?: string }> = ({ preset, W, H, t, level, n, label = "METER" }) => {
  const tk = kit(preset);
  const cx = 815, cy = H - 215, r = 175;
  const k = Math.max(0, Math.min(1, level / Math.max(1, n - 1)));
  const ang = Math.PI * (1 + k) + Math.sin(t * 23) * 0.025 * (0.4 + k);
  const seg = (i: number) => {
    const a0 = Math.PI * (1 + i / SEG.length) + 0.02, a1 = Math.PI * (1 + (i + 1) / SEG.length) - 0.02;
    const ri = r - 46;
    return `M ${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r} L ${cx + Math.cos(a1) * ri} ${cy + Math.sin(a1) * ri} A ${ri} ${ri} 0 0 0 ${cx + Math.cos(a0) * ri} ${cy + Math.sin(a0) * ri} Z`;
  };
  const lit = Math.floor(k * (SEG.length - 0.001));
  const ps = preset.host ? preset.host.propScale ?? preset.host.scale * 0.9 : 1;
  const park = preset.host ? `translate(${W * SAFE_RIGHT - 240 * ps} ${H * SAFE_BOTTOM - 112 * ps}) scale(${ps}) translate(${-cx} ${-cy}) ` : "";
  return (
    // layout 2: the panel (456 x 330 around cx, cy - 67) is scaled and parked in the bottom-right corner of the safe area
    <g transform={`${park}rotate(-4 ${cx} ${cy})`}>
      <rect x={cx - 228} y={cy - 232} width={456} height={330} rx={34} fill="#000" opacity={0.35} transform="translate(10 14)" />
      <rect x={cx - 228} y={cy - 232} width={456} height={330} rx={34} fill={tk.color.panel} stroke={tk.color.panelLight} strokeWidth={6} />
      <rect x={cx - 228} y={cy - 232} width={456} height={60} rx={30} fill="#fff" opacity={0.06} />
      {[[-200, -204], [200, -204], [-200, 70], [200, 70]].map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={cy + dy} r={8} fill={tk.color.steel} />)}
      {SEG.map((c, i) => <path key={i} d={seg(i)} fill={c} opacity={i <= lit ? 1 : 0.28} />)}
      {/* glow of the lit end */}
      <circle cx={cx + Math.cos(ang) * (r - 23)} cy={cy + Math.sin(ang) * (r - 23)} r={34} fill={SEG[lit]} opacity={0.45} style={{ filter: "blur(10px)" }} />
      {/* needle */}
      <line x1={cx} y1={cy} x2={cx + Math.cos(ang) * (r - 18)} y2={cy + Math.sin(ang) * (r - 18)} stroke="#fff" strokeWidth={10} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={22} fill="#fff" /><circle cx={cx} cy={cy} r={10} fill={SEG[SEG.length - 1]} />
      <text x={cx} y={cy + 72} textAnchor="middle" fontFamily={preset.fontKinetic} fontSize={44} fill="#fff" letterSpacing={4}>{label}</text>
    </g>
  );
};

export const HostSet: React.FC<Props> = ({ preset, layer, width, height, t, closeK, peekK, desk, deskLabel = "NEWS", revealAge, meter = null, character }) => {
  const vis = clamp01(1 - closeK) * clamp01(1 - peekK);
  if (vis <= 0.01) return null;
  const H = height;
  const revealed = revealAge >= 0;
  // toilet pops in with overshoot; desk leaves in 0.35 s (down-left with a spin)
  const toiletK = revealed ? 1 - impulse(revealAge, 3.2, 7) * 0.25 - Math.max(0, 1 - revealAge / 0.18) * 0.75 : 0;
  const deskOut = revealed ? easeOut(revealAge / 0.35) : 0;
  const glue = follow(preset, H, character);
  // layout 2 lifts the host: the desk front and the foot of the bowl run down to the bottom of the frame
  const safe = !!preset.host;
  const deskL = safe ? -400 : -40, deskB = safe ? H + 700 : H + 20, deskBR = safe ? 716 : 700, deskThrow = safe ? 900 : 700;

  if (layer === "back") {
    if (!revealed) return null;
    return (
      <svg width={1080} height={H} style={{ position: "absolute", inset: 0, opacity: vis }}>
        <g transform={`${glue}translate(${CX} ${H - 150}) scale(${toiletK}) translate(${-CX} ${-(H - 150)})`}>
          {/* tank behind the host's back */}
          <rect x={CX - 280} y={H - 360} width={560} height={230} rx={26} fill={CERAMIC} stroke={CERAMIC_SHADE} strokeWidth={8} />
          <rect x={CX - 300} y={H - 386} width={600} height={44} rx={18} fill="#FFFFFF" stroke={CERAMIC_SHADE} strokeWidth={8} />
          <rect x={CX + 190} y={H - 320} width={60} height={22} rx={8} fill="#B9BCC9" />
          <rect x={CX - 260} y={H - 340} width={70} height={190} rx={20} fill="#fff" opacity={0.5} />
        </g>
      </svg>
    );
  }

  return (
    <svg width={1080} height={H} style={{ position: "absolute", inset: 0, opacity: vis }}>
      {meter && <Meter preset={preset} W={width} H={H} t={t} level={meter.level} n={meter.n} label={meter.label} />}
      {/* desk (in front of the host's chest), thrown out at the reveal */}
      {desk && deskOut < 1 && (
        // the desk runs far to the left and down: the host is lifted, the desk front fills the frame under him
        <g transform={`${glue}translate(${-deskOut * deskThrow} ${deskOut * 260}) rotate(${-deskOut * 18} ${CX} ${H - 80})`}>
          <path d={`M ${deskL} ${H - 150} L 680 ${H - 150} L ${deskBR} ${deskB} L ${deskL} ${deskB} Z`} fill="#241E44" />
          <path d={`M ${deskL} ${H - 170} L 690 ${H - 170} L 700 ${H - 140} L ${deskL} ${H - 140} Z`} fill="#3E3570" />
          <rect x={deskL} y={H - 172} width={700 - deskL} height={6} fill={preset.accent} opacity={0.8} />
          {/* front logo plate */}
          <rect x={CX - 130} y={H - 142} width={260} height={74} rx={12} fill="#E23B2E" />
          <text x={CX} y={H - 88} textAnchor="middle" fontFamily={preset.fontKinetic} fontSize={50} fill="#fff">{deskLabel}</text>
          {/* papers + mug */}
          <g transform={`rotate(-4 ${CX + 260} ${H - 176})`}>
            <rect x={CX + 190} y={H - 186} width={150} height={16} rx={3} fill="#FBF7EC" />
            <rect x={CX + 196} y={H - 194} width={150} height={10} rx={3} fill="#E9E2D0" />
          </g>
          <rect x={CX - 260} y={H - 226} width={56} height={62} rx={10} fill="#F2C14E" />
          <path d={`M ${CX - 204} ${H - 212} q 24 4 0 30`} stroke="#F2C14E" strokeWidth={8} fill="none" />
          {[0, 1].map((i) => { const k = (t * 0.7 + i * 0.5) % 1; return <path key={i} d={`M ${CX - 236 + i * 10} ${H - 232 - k * 60} q 10 -14 0 -28`} stroke="#fff" strokeWidth={5} fill="none" opacity={(1 - k) * 0.4} />; })}
        </g>
      )}
      {revealed && (
        <g transform={`${glue}translate(${CX} ${H - 150}) scale(${toiletK}) translate(${-CX} ${-(H - 150)})`}>
          {/* foot of the bowl: the host is lifted, so the bowl stands on its foot down to the bottom of the frame */}
          {safe && <path d={`M ${CX - 170} ${H + 20} L ${CX + 170} ${H + 20} L ${CX + 210} ${H + 700} L ${CX - 210} ${H + 700} Z`} fill={CERAMIC} stroke={CERAMIC_SHADE} strokeWidth={8} />}
          {safe && <path d={`M ${CX - 120} ${H + 70} L ${CX - 150} ${H + 700}`} stroke="#fff" strokeWidth={14} opacity={0.6} strokeLinecap="round" />}
          {/* bowl in front of the host */}
          <path d={`M ${CX - 300} ${H - 120} Q ${CX - 290} ${H + 60} ${CX} ${H + 80} Q ${CX + 290} ${H + 60} ${CX + 300} ${H - 120} Z`} fill={CERAMIC} stroke={CERAMIC_SHADE} strokeWidth={8} />
          <ellipse cx={CX} cy={H - 124} rx={318} ry={46} fill="#FFFFFF" stroke={CERAMIC_SHADE} strokeWidth={8} />
          <ellipse cx={CX} cy={H - 124} rx={250} ry={26} fill="none" stroke="#E6E7EE" strokeWidth={10} />
          <path d={`M ${CX - 220} ${H - 90} Q ${CX - 200} ${H + 20} ${CX - 120} ${H + 40}`} stroke="#fff" strokeWidth={14} fill="none" opacity={0.7} strokeLinecap="round" />
          {/* trousers down on the bowl rim */}
          <path d={`M ${CX - 230} ${H - 110} Q ${CX} ${H - 70} ${CX + 230} ${H - 110} L ${CX + 210} ${H - 60} Q ${CX} ${H - 30} ${CX - 210} ${H - 60} Z`} fill="#3A3F5C" />
        </g>
      )}
      {revealed && (
        <g transform={`${glue}translate(${700} ${H - 330}) scale(${toiletK})`}>
          {/* paper roll on its wall holder */}
          <rect x={-70} y={-12} width={140} height={14} rx={7} fill="#B9BCC9" />
          <rect x={-60} y={0} width={120} height={110} rx={14} fill="#FAFAFC" />
          <ellipse cx={60} cy={55} rx={14} ry={55} fill="#E2E4EE" />
          <ellipse cx={60} cy={55} rx={6} ry={20} fill="#B39A7A" />
          <path d={`M -60 100 L -54 ${190 + Math.sin(t * 3) * 6} L 20 ${186 + Math.sin(t * 3 + 1) * 6} L 20 100 Z`} fill="#FAFAFC" />
        </g>
      )}
    </svg>
  );
};
