import React from "react";
import type { Emotion, GestureKind } from "../../types";
import { shade } from "../../kit/tokens";
export type { Emotion } from "../../types";

/** "host": the TEMPLATE character. A plain mannequin-like presenter (round head, short neutral hair, plain tee in
 *  the accent colour of the preset) with the full rig the engine drives: a numeric face per emotion (so two
 *  emotions blend), a mouth that follows the real voice, saccades and blinks, a head that nods on loud syllables,
 *  and four hand gestures.
 *
 *  To create your own character: copy this file to `src/layers/characters/<Name>.tsx`, keep the props and the
 *  FACES table, redraw the shapes (and export your own geometry), then register it in `src/layers/Character.tsx`
 *  (`HOSTS`) and in `src/CharacterSheet.tsx` (`SHEETS`), and give it a voice in `characters/voices.json`.
 *  Check the result with the model sheet: `npx remotion still src/index.ts CharacterSheet out/sheet.png`. */

export type HostProps = {
  cx: number; // head centre x
  cy: number; // head centre y (already includes breathing / hop)
  /** y of the bottom of the body (the torso runs down to it) */
  height: number;
  t: number;
  emotion: Emotion;
  speaking: boolean;
  accentHit: number;
  accent: string;
  squash: number;
  wave?: number; // 0..1 hand raised, waving
  /** emotion we are coming from, and the 0..1 blend toward `emotion` (faces morph instead of snapping) */
  prevEmotion?: Emotion;
  emoK?: number;
  /** real voice, this frame: open = jaw (0..1), wide = lip spread (0 = "o", 1 = "i"). Without it the mouth falls back to a sine. */
  mouth?: { open: number; wide: number } | null;
  /** hands: kind + presence 0..1 */
  gesture?: { kind: GestureKind; k: number };
};

/** Where the eye line and the chin sit below the head centre, in the drawing's own px. The framings of
 *  src/layers/Character.tsx (bust, close-ups) are computed from these two numbers. */
export const HOST_GEOMETRY = { eyeDy: -12, chinDy: 178 };

/** Numeric description of a face, so two emotions can be blended. */
type Face = { turn: number; tilt: number; wide: number; lid: number; look: number; browLift: number; browTilt: number; browR: number; smile: number; rest: number; wink: number };
const FACES: Record<Emotion, Face> = {
  idle: { turn: 5, tilt: 1.2, wide: 0, lid: 0, look: 5, browLift: 0, browTilt: 0, browR: 0, smile: 3, rest: 0, wink: 0 },
  happy: { turn: 5, tilt: 2, wide: 0.1, lid: 0, look: 0, browLift: -5, browTilt: 0, browR: 0, smile: 16, rest: 0, wink: 0 },
  wink: { turn: 7, tilt: -3, wide: 0, lid: 0, look: 0, browLift: -3, browTilt: 0, browR: -7, smile: 15, rest: 0, wink: 1 },
  curious: { turn: 12, tilt: 3, wide: 0.25, lid: 0, look: 9, browLift: -6, browTilt: 0, browR: -10, smile: 2, rest: 0, wink: 0 },
  confused: { turn: -9, tilt: 4, wide: 0, lid: 0.15, look: -7, browLift: 0, browTilt: 9, browR: 0, smile: -7, rest: 0, wink: 0 },
  amazed: { turn: 3, tilt: 1, wide: 1, lid: 0, look: 0, browLift: -13, browTilt: 0, browR: 0, smile: 0, rest: 11, wink: 0 },
  panic: { turn: 3, tilt: 1, wide: 1.15, lid: 0, look: 0, browLift: -11, browTilt: -7, browR: 0, smile: -9, rest: 26, wink: 0 },
  deadpan: { turn: 2, tilt: 0.5, wide: 0, lid: 0.6, look: 0, browLift: 7, browTilt: 0, browR: 0, smile: -5, rest: 0, wink: 0 },
  smug: { turn: 9, tilt: -3, wide: 0, lid: 0.38, look: 7, browLift: 2, browTilt: 0, browR: -15, smile: 12, rest: 0, wink: 0 },
};
const blendFace = (a: Face, b: Face, k: number): Face => {
  const out = {} as Face;
  (Object.keys(a) as (keyof Face)[]).forEach((key) => { out[key] = a[key] + (b[key] - a[key]) * k; });
  return out;
};

// the mannequin's own palette: neutral greys, so the only colour on the figure is the tee (accent of the preset)
const BODY = "#C8CBD6";
const BODY_LIGHT = "#E6E8F0";
const BODY_DARK = "#8F93A6";
const HAIR = "#3B3F52";
const INK = "#1D1F2B";
const EYE_WHITE = "#FFFFFF";
const MOUTH_IN = "#2A1E2A";
const TONGUE = "#D9707C";

/** deterministic pseudo-random */
const rnd = (i: number, salt = 0) => { const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return s - Math.floor(s); };

/** Mitten hand around its palm centre: a round palm, a thumb, and one raised finger when pointing. */
const Hand: React.FC<{ x: number; y: number; rot?: number; pointing?: boolean; mirror?: boolean }> = ({ x, y, rot = 0, pointing = false, mirror = false }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${mirror ? -1 : 1} 1)`}>
    {pointing ? (
      <g>
        <rect x={-14} y={-96} width={28} height={84} rx={14} fill={BODY} />
        <rect x={-38} y={-34} width={76} height={70} rx={30} fill={BODY} />
      </g>
    ) : (
      <rect x={-40} y={-70} width={80} height={108} rx={38} fill={BODY} />
    )}
    <rect x={-58} y={-22} width={26} height={50} rx={13} fill={BODY} transform="rotate(-28)" />
    <ellipse cx={2} cy={8} rx={22} ry={18} fill={BODY_LIGHT} opacity={0.5} />
  </g>
);

export const Host: React.FC<HostProps> = ({ cx, cy: cyIn, height, t, emotion, speaking, accentHit, accent, squash, wave = 0, prevEmotion, emoK = 1, mouth = null, gesture }) => {
  const rx = 150, ry = HOST_GEOMETRY.chinDy; // head
  const tee = shade(accent, -0.18), teeDark = shade(accent, -0.5), teeLight = shade(accent, 0.25);
  const e = blendFace(FACES[prevEmotion ?? emotion], FACES[emotion], emoK);
  // voice: jaw opening and lip shape come from the real audio when it is provided
  const jaw = mouth ? mouth.open : speaking ? 0.25 + Math.abs(Math.sin(t * 18)) * 0.75 : 0;
  const lips = mouth ? mouth.wide : 0.6;
  // the head nods a little on every loud syllable and dips on accents
  const cy = cyIn + jaw * 5 + accentHit * 7;
  // eyes jump to a new point every ~1.3 s (saccades), like a real gaze
  const seg = Math.floor(t / 1.3);
  const sacK = Math.min(1, (t - seg * 1.3) / 0.07);
  const sac = (rnd(seg - 1, 9) + (rnd(seg, 9) - rnd(seg - 1, 9)) * sacK) * 16 - 8;
  const turn = Math.sin(t * 0.7) * e.turn + sac * 0.35; // px shift of the features (parallax)
  const tilt = Math.sin(t * 0.5) * e.tilt + e.tilt * 0.6 - jaw * 0.8; // deg

  // eyes: round, they grow with `wide`, the lid closes them from the top
  const eyeR = 30 + e.wide * 9 + accentHit * 4;
  const lidK = Math.min(0.85, e.lid);
  // irregular blinks, plus one blink whenever the face changes
  const bSeg = Math.floor(t / 2.7);
  const bAt = bSeg * 2.7 + rnd(bSeg, 3) * 2.0;
  const blink = (t >= bAt && t < bAt + 0.11) || (emoK > 0.05 && emoK < 0.75) ? 0.1 : 1;
  const leftScale = Math.min(blink, 1 - e.wink * 0.9);
  const look = turn * 0.6 + e.look + sac;
  const browLift = e.browLift - accentHit * 5;
  const eyeY = cy + HOST_GEOMETRY.eyeDy;

  // mouth
  const open = Math.max(jaw * 30, e.rest * (1 - jaw));
  const smile = e.smile;
  const mw = open > 2 ? 50 * (0.74 + 0.34 * lips) : 50; // half width: narrow on "o", spread on "i"
  const my = cy + 92 - smile * 0.15;
  // hands
  const gKind = gesture?.kind ?? "none";
  const gK = gesture?.k ?? 0;
  const waveK = Math.max(wave, gKind === "wave" ? gK : 0);
  const shrugK = gKind === "shrug" ? gK : 0;
  const sh = shrugK * 30; // shoulders go up on a shrug
  const ARM = 50;

  const Eye = ({ x, scaleY }: { x: number; scaleY: number }) => (
    <g transform={`translate(${x + turn} ${eyeY}) scale(1 ${scaleY})`}>
      <circle r={eyeR} fill={EYE_WHITE} />
      <circle cx={look * 0.55} cy={2} r={13 - e.wide * 2} fill={INK} />
      <circle cx={look * 0.55 + 5} cy={-3} r={4} fill={EYE_WHITE} />
      {/* upper lid: a cap of the head colour that comes down over the eye */}
      {lidK > 0.02 && <path d={`M ${-eyeR - 2} ${-eyeR - 2} H ${eyeR + 2} V ${-eyeR + eyeR * 2 * lidK} Q 0 ${-eyeR + eyeR * 2 * lidK + 10} ${-eyeR - 2} ${-eyeR + eyeR * 2 * lidK} Z`} fill={BODY} />}
      <circle r={eyeR} fill="none" stroke={BODY_DARK} strokeWidth={4} />
    </g>
  );

  return (
    <g transform={`translate(${cx} ${height}) scale(1 ${squash}) translate(${-cx} ${-height}) rotate(${tilt} ${cx} ${cy})`}>
      <defs>
        <radialGradient id="host-head" cx="40%" cy="32%" r="78%">
          <stop offset="0%" stopColor={BODY_LIGHT} />
          <stop offset="62%" stopColor={BODY} />
          <stop offset="100%" stopColor={BODY_DARK} />
        </radialGradient>
        <linearGradient id="host-tee" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tee} />
          <stop offset="100%" stopColor={teeDark} />
        </linearGradient>
      </defs>

      {/* torso: a plain tee, shoulders rise on a shrug */}
      <path
        d={`M ${cx - 285} ${height + 40} C ${cx - 262} ${cy + 268 - sh}, ${cx - 150} ${cy + 228 - sh}, ${cx} ${cy + 236}
            C ${cx + 150} ${cy + 228 - sh}, ${cx + 262} ${cy + 268 - sh}, ${cx + 285} ${height + 40} Z`}
        fill="url(#host-tee)"
      />
      {/* rim light on the shoulder (comes from the scene side) */}
      <path d={`M ${cx} ${cy + 236} C ${cx + 150} ${cy + 228 - sh}, ${cx + 262} ${cy + 268 - sh}, ${cx + 285} ${height + 40}`} stroke={teeLight} strokeWidth={6} fill="none" opacity={0.55} strokeLinecap="round" strokeDasharray="0 110 190 9000" />
      {/* neck, then the round collar of the tee over it */}
      <rect x={cx - 46} y={cy + ry - 40} width={92} height={110} rx={30} fill={BODY_DARK} />
      <path d={`M ${cx - 84} ${cy + 232} Q ${cx} ${cy + 296} ${cx + 84} ${cy + 232}`} stroke={teeDark} strokeWidth={16} fill="none" strokeLinecap="round" />

      {/* ears */}
      <ellipse cx={cx - rx + 4 + turn * 0.2} cy={cy + 14} rx={20} ry={32} fill={BODY_DARK} />
      <ellipse cx={cx + rx - 4 + turn * 0.2} cy={cy + 14} rx={20} ry={32} fill={BODY_DARK} />
      {/* head: a soft egg, the chin drops a little with the jaw */}
      <path
        d={`M ${cx} ${cy - ry} C ${cx + rx * 1.1} ${cy - ry} ${cx + rx * 1.08} ${cy + ry * 0.2} ${cx + rx * 0.82} ${cy + ry * 0.62}
            C ${cx + rx * 0.6} ${cy + ry * 0.95} ${cx + rx * 0.3} ${cy + ry + open * 0.2} ${cx} ${cy + ry + open * 0.2}
            C ${cx - rx * 0.3} ${cy + ry + open * 0.2} ${cx - rx * 0.6} ${cy + ry * 0.95} ${cx - rx * 0.82} ${cy + ry * 0.62}
            C ${cx - rx * 1.08} ${cy + ry * 0.2} ${cx - rx * 1.1} ${cy - ry} ${cx} ${cy - ry} Z`}
        fill="url(#host-head)"
      />
      {/* short neutral hair: one flat cap above the forehead */}
      <path
        d={`M ${cx - rx * 0.99} ${cy - ry * 0.34} C ${cx - rx * 1.12} ${cy - ry * 1.08} ${cx + rx * 1.12} ${cy - ry * 1.08} ${cx + rx * 0.99} ${cy - ry * 0.34}
            Q ${cx + rx * 0.72 + turn * 0.3} ${cy - ry * 0.62} ${cx + turn * 0.4} ${cy - ry * 0.6} Q ${cx - rx * 0.72 + turn * 0.3} ${cy - ry * 0.62} ${cx - rx * 0.99} ${cy - ry * 0.34} Z`}
        fill={HAIR}
      />

      {/* brows: two straight bars */}
      <g stroke={HAIR} strokeWidth={13} strokeLinecap="round">
        <line x1={cx - 102 + turn} y1={eyeY - 52 + browLift + e.browTilt} x2={cx - 34 + turn} y2={eyeY - 54 + browLift - e.browTilt * 0.4} />
        <line x1={cx + 34 + turn} y1={eyeY - 54 + browLift + e.browR - e.browTilt * 0.4} x2={cx + 102 + turn} y2={eyeY - 52 + browLift + e.browR * 0.6 - e.browTilt} />
      </g>
      {/* eyes */}
      <Eye x={cx - 68} scaleY={leftScale} />
      <Eye x={cx + 68} scaleY={blink} />
      {/* nose: one short stroke */}
      <path d={`M ${cx + turn * 1.2} ${cy + 18} q 12 22 -6 30`} stroke={BODY_DARK} strokeWidth={8} fill="none" strokeLinecap="round" />

      {/* mouth: shape follows the voice (jaw = loudness, width = brightness of the sound) */}
      {open > 2 ? (
        <g>
          <path d={`M ${cx - mw + turn} ${my} q ${mw} ${-8 - smile * 0.3} ${mw * 2} 0 q ${-mw} ${open * 1.5} ${-mw * 2} 0 z`} fill={MOUTH_IN} />
          {open > 14 && <ellipse cx={cx + turn} cy={my + open * 0.52} rx={mw * 0.44} ry={open * 0.17} fill={TONGUE} />}
          {open > 6 && <path d={`M ${cx - mw * 0.76 + turn} ${my + 1} q ${mw * 0.76} ${-5} ${mw * 1.52} 0 q ${-mw * 0.76} ${Math.min(9, open * 0.32)} ${-mw * 1.52} 0 z`} fill={EYE_WHITE} opacity={0.92} />}
        </g>
      ) : (
        <path d={`M ${cx - 50 + turn} ${my} q 50 ${6 + smile * 1.5} 100 0`} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
      )}

      {/* waving hand */}
      {waveK > 0.01 && (
        <g opacity={Math.min(1, waveK * 2)}>
          <path d={`M ${cx + 215} ${cy + 340} Q ${cx + 290} ${cy + 260 - waveK * 120} ${cx + 250} ${cy + 250 - waveK * 250}`} stroke={BODY_DARK} strokeWidth={ARM} fill="none" strokeLinecap="round" />
          <Hand x={cx + 250} y={cy + 230 - waveK * 260} rot={Math.sin(t * 9) * 18 * waveK} />
        </g>
      )}
      {/* pointing at the scene */}
      {gKind === "point" && gK > 0.01 && (
        <g opacity={Math.min(1, gK * 2)}>
          <path d={`M ${cx + 215} ${cy + 340} Q ${cx + 300} ${cy + 250} ${cx + 262} ${cy + 80 + (1 - gK) * 280}`} stroke={BODY_DARK} strokeWidth={ARM} fill="none" strokeLinecap="round" />
          <Hand x={cx + 258} y={cy + 40 + (1 - gK) * 300 + Math.sin(t * 10) * 5} rot={22} pointing />
        </g>
      )}
      {/* shrug: both palms up, shoulders raised */}
      {shrugK > 0.01 && [-1, 1].map((sgn) => (
        <g key={sgn} opacity={Math.min(1, shrugK * 2)}>
          <path d={`M ${cx + sgn * 215} ${cy + 340} Q ${cx + sgn * 320} ${cy + 330} ${cx + sgn * 300} ${cy + 250 + (1 - shrugK) * 240}`} stroke={BODY_DARK} strokeWidth={ARM} fill="none" strokeLinecap="round" />
          <Hand x={cx + sgn * 300} y={cy + 215 + (1 - shrugK) * 260} rot={sgn * 62} mirror={sgn > 0} />
        </g>
      ))}
      {/* balance: two palms weighing up and down in turn */}
      {gKind === "balance" && gK > 0.01 && [-1, 1].map((sgn) => {
        const yy = cy + 150 + sgn * Math.sin(t * 8) * 44 + (1 - gK) * 300;
        return (
          <g key={sgn} opacity={Math.min(1, gK * 2)}>
            <path d={`M ${cx + sgn * 215} ${cy + 350} Q ${cx + sgn * 300} ${cy + 330} ${cx + sgn * 240} ${yy + 40}`} stroke={BODY_DARK} strokeWidth={ARM} fill="none" strokeLinecap="round" />
            <Hand x={cx + sgn * 240} y={yy} rot={sgn * 10} mirror={sgn > 0} />
          </g>
        );
      })}
    </g>
  );
};
