import React from "react";
import { kit, at, clamp01, easeInOut, easeOut, impulse, lerp, pop, springTo } from "../../kit";
import type { SceneCameraMap, SceneFC } from "./types";
import { AskCounter, Belt, Check, Floor, geo, Hand, Sign, VideoFrame, Word } from "./Ep001_shared";

/* ep-001 line. The frame of this video rides the belt past six stations, one per phrase; the frame stays where it
 * is on screen and the stations come to it. Each station adds one part, in the accent while it is the news:
 *  IDEAS      "pitched" three cards; "picked one" the hand takes one and puts it in the frame (ask 1)
 *  SCRIPT     "script" the three caption bars
 *  FACT CHECK "agent" a second arm comes down with a stamp; "fact" it stamps a check on the frame
 *  VOICE      "asked again" a question mark; "paying" the hand comes back; "for the voice" the voice bars (ask 2)
 *  CODE       "drew" the play triangle; "code" the angle brackets
 *  SCORE      "hear" a meter with a sleeping needle; "score" the needle goes to STRONG */
const STATIONS = ["IDEAS", "SCRIPT", "FACT CHECK", "VOICE", "CODE", "SCORE"];

const Line: SceneFC = ({ preset, t, box, b }) => {
  const tk = kit(preset), g = geo(box), u = g.u;
  const paper = tk.color.text, ac = tk.color.accent;
  const tPitch = b("pitched"), tPick = b("picked one"), tScript = b("script"), tAgent = b("agent"), tFact = b("fact");
  const tAsk = b("asked again"), tPay = b("paying"), tVoice = b("for the voice"), tDrew = b("drew"), tCode = b("code");
  const tHear = b("hear"), tPicks = b("picks sounds"), tScore = b("score");
  // the belt carries the frame from one station to the next: each move starts 0.4 s before the word and takes 0.55 s
  const arrive = [-99, tScript, tAgent, tAsk, tDrew, tHear];
  let pos = 0;
  for (let i = 1; i < arrive.length; i++) pos += easeInOut((t - (arrive[i] - 0.4)) / 0.55);
  const station = Math.round(pos);
  const moving = Math.abs(pos - station);
  const D = box.w * 1.08;
  const fx = box.x + box.w * 0.27, fy = g.belt, fh = g.frameH, fw = fh * (240 / 396);
  const sx = (i: number) => fx + box.w * 0.45 + (i - pos) * D;
  const frameTop = fy - fh, mid = fy - fh * 0.5;

  // ---- IDEAS: three cards; the hand picks the middle one and carries it into the frame
  const cardW = 122 * u, cardH = 168 * u, cardY = mid + 20 * u;
  const pickK = clamp01((t - tPick) / 0.22);                 // the hand reaches the card
  const carryK = easeInOut((t - tPick - 0.3) / 0.3);     // card and hand travel to the frame
  const dropK = clamp01((t - tPick - 0.62) / 0.14);          // the card goes into the frame
  const gone = dropK >= 1;
  const leaveK = clamp01((t - tPick - 0.7) / 0.2);          // the hand leaves, faster than it came
  const picked = t > tPick + 0.16;
  const cardS = (1 + pickK * 0.1) * (1 - carryK * 0.3) * (1 - dropK);
  const cx1 = lerp(sx(0), fx, carryK), cy1 = lerp(cardY, mid - 10 * u, carryK) - Math.sin(carryK * Math.PI) * 70 * u;
  // the finger holds the right edge of the card, so the card is seen beside the hand all the way; the arm comes
  // in level, under the sign
  const gripX = cx1 + (cardW / 2) * cardS - 12 * u, gripY = cy1 - 16 * u;
  const handX = lerp(sx(0) + 620 * u, gripX, carryK > 0 ? 1 : easeOut(pickK)) + leaveK * leaveK * 900 * u;
  const handY = lerp(cardY - 40 * u, gripY, carryK > 0 ? 1 : easeOut(pickK)) - leaveK * leaveK * 160 * u;
  const fill1 = tPick + 0.16;

  // ---- parts of the frame
  const barsK: [number, number, number] = [0, 1, 2].map((i) => clamp01((t - tScript - i * 0.12) / 0.3)) as [number, number, number];
  const playK = clamp01((t - tDrew) / 0.4);
  const accent = t >= tDrew && t < tHear - 0.4 ? "play" : t >= tScript && t < tAgent - 0.4 ? "bars" : "none";
  const squash = (gone ? impulse(t - tPick - 0.76, 3.5, 8) : 0) + (t > tFact + 0.12 ? impulse(t - tFact - 0.12, 4, 9) * 0.8 : 0);

  // ---- FACT CHECK: the second agent is an arm from above with a stamp; it hits on "fact"
  // The arm hangs from a mount at the top of the scene box (under the HUD, never through it) and parks left of the sign.
  const badge: [number, number] = [fx + fw * 0.42, frameTop + fh * 0.2];
  const armBase: [number, number] = [badge[0] + 70 * u, box.y + 22 * u];
  // it folds away in 0.18 s once the check is stamped (faster than it came)
  const armOut = clamp01((t - tFact - 0.6) / 0.18);
  const armIn = at(t, tAgent, 0.35);
  const rest: [number, number] = [badge[0] + 60 * u, box.y + 22 * u + armIn * (1 - armOut) * 70 * u];
  const strike = t < tFact ? 0 : t < tFact + 0.12 ? Math.pow((t - tFact) / 0.12, 3) : 1 - easeOut((t - tFact - 0.2) / 0.3);
  const head: [number, number] = [lerp(rest[0], badge[0], strike), lerp(rest[1], badge[1] - 30 * u, strike)];
  const checkK = clamp01((t - tFact - 0.1) / 0.5);
  const checkHot = t < tAsk - 0.4;

  // ---- VOICE: a question, then the hand says yes and the voice bars play
  const askK = at(t, tAsk, 0.3) * (1 - clamp01((t - tVoice) / 0.12));
  const voiceK = clamp01((t - tVoice) / 0.3);
  const payK = easeOut((t - tPay + 0.15) / 0.3), tapK = t > tVoice ? impulse(t - tVoice, 3, 7) : 0;
  const hand2Out = clamp01((t - tVoice - 0.5) / 0.22);
  const vx = sx(3) - 100 * u, vy = mid + 20 * u;

  // ---- SCORE: a meter whose needle sleeps until "score"
  const mx = sx(5) + 10 * u, my = mid + 150 * u, mr = 150 * u;
  // asleep, then it hunts while "so it picks sounds" is said, then it lands in the accent zone on "score"
  const hunt = t < tPicks ? 0 : easeOut((t - tPicks) / 0.5) * (46 + Math.sin((t - tPicks) * 11) * 16);
  const needle = t < tScore ? -70 + Math.sin(t * 2.6) * 4 + hunt : -70 + lerp(46, 118, springTo(t - tScore, 3.6, 11));
  const strongK = at(t, tScore, 0.22);

  return (
    <g>
      <Floor box={box} tk={tk} />
      <Belt box={box} run={pos * D + t * 6 * u} tk={tk} />
      {STATIONS.map((label, i) => (Math.abs(i - pos) < 1.2 ? <Sign key={i} x={sx(i)} y={g.sign} foot={g.belt} text={label} on={i === station} u={u} tk={tk} /> : null))}

      {/* IDEAS */}
      {pos < 1.1 && [-1, 0, 1].map((i) => {
        const k = at(t, tPitch + (i + 1) * 0.09, 0.3);
        const mine = i === 0;
        if (k <= 0 || mine) return null;
        const x = sx(0) + i * 150 * u, y = cardY + (picked ? 26 * u : 0);
        const sc = k * (picked ? 0.86 : 1);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${i * 9}) scale(${sc})`}>
            <rect x={-cardW / 2} y={-cardH / 2} width={cardW} height={cardH} rx={tk.radius.md} fill={picked ? tk.color.steel : paper} />
            <rect x={-cardW * 0.3} y={-cardH * 0.26} width={cardW * 0.6} height={9 * u} rx={4 * u} fill={tk.color.ink} />
            <rect x={-cardW * 0.3} y={-cardH * 0.06} width={cardW * 0.6} height={9 * u} rx={4 * u} fill={tk.color.ink} />
            <rect x={-cardW * 0.3} y={cardH * 0.14} width={cardW * 0.36} height={9 * u} rx={4 * u} fill={tk.color.ink} />
          </g>
        );
      })}

      {/* the frame we follow: it bobs while the belt moves and takes each hit */}
      <VideoFrame x={fx} y={fy - Math.abs(Math.sin(t * 22)) * moving * 10 * u} h={fh} play={playK} bars={barsK} accent={accent} tilt={moving * -3} squash={squash} tk={tk} />
      <Check x={badge[0]} y={badge[1]} r={48 * u} k={checkK} accent={checkHot} tk={tk} />

      {/* FACT CHECK: the second arm */}
      {t > tAgent && armOut < 1 && pos > 1.5 && (
        <g transform={`translate(${armBase[0]} ${armBase[1]}) scale(${armIn * (1 - armOut)}) translate(${-armBase[0]} ${-armBase[1]})`}>
          <rect x={armBase[0] - 55 * u} y={armBase[1] - 8 * u} width={110 * u} height={22 * u} rx={8 * u} fill={paper} />
          <line x1={armBase[0]} y1={armBase[1] + 10 * u} x2={head[0]} y2={head[1] - 40 * u} stroke={tk.color.steel} strokeWidth={22 * u} strokeLinecap="round" />
          <circle cx={head[0]} cy={head[1] - 40 * u} r={20 * u} fill={paper} />
          <rect x={head[0] - 15 * u} y={head[1] - 40 * u} width={30 * u} height={36 * u} fill={paper} />
          <rect x={head[0] - 46 * u} y={head[1] - 8 * u} width={92 * u} height={30 * u} rx={8 * u} fill={paper} />
        </g>
      )}

      {/* VOICE */}
      {askK > 0 && (
        <g transform={`translate(${vx} ${vy}) scale(${askK}) rotate(${Math.sin(t * 2.4) * 4})`}>
          <Word x={0} y={96 * u} text="?" size={280 * u} fill={paper} tk={tk} />
        </g>
      )}
      {voiceK > 0 && pos > 2.5 && pos < 4.2 && [0, 1, 2, 3, 4].map((i) => {
        const hgt = (64 + 150 * Math.abs(Math.sin(t * 5.2 + i * 1.3))) * u * pop(clamp01(voiceK * 1.4 - i * 0.08));
        return <rect key={i} x={vx + (i - 2) * 52 * u - 19 * u} y={vy - hgt / 2} width={38 * u} height={hgt} rx={19 * u} fill={t < tDrew - 0.4 ? ac : paper} />;
      })}
      {t > tPay - 0.15 && hand2Out < 1 && pos > 2.5 && (
        <Hand x={vx + 152 * u + (1 - payK) * 620 * u - tapK * 30 * u + hand2Out * hand2Out * 900 * u} y={vy + 30 * u - (1 - payK) * 80 * u - hand2Out * hand2Out * 160 * u} rot={58} u={u} tk={tk} />
      )}

      {/* CODE: brackets around the frame */}
      {t > tCode && pos > 3.5 && pos < 5.3 && ["<", ">"].map((c, i) => {
        const k = at(t, tCode + i * 0.08, 0.28);
        return <text key={c} x={fx + (i ? 1 : -1) * (fw / 2 + 46 * u * k)} y={mid + 46 * u} textAnchor="middle" fontFamily={tk.font.mono} fontWeight={500} fontSize={132 * u * k} fill={paper}>{c}</text>;
      })}

      {/* SCORE */}
      {pos > 4.3 && (
        <g transform={`translate(${mx} ${my})`}>
          <path d={`M ${-mr} 0 A ${mr} ${mr} 0 0 1 ${mr} 0`} fill="none" stroke={paper} strokeWidth={34 * u} />
          <path d={`M ${mr * Math.cos((-50 * Math.PI) / 180)} ${mr * Math.sin((-50 * Math.PI) / 180)} A ${mr} ${mr} 0 0 1 ${mr} 0`} fill="none" stroke={t > tScore ? ac : tk.color.steel} strokeWidth={34 * u} />
          <g transform={`rotate(${needle})`}>
            <rect x={-9 * u} y={-mr + 6 * u} width={18 * u} height={mr - 6 * u} rx={9 * u} fill={paper} />
          </g>
          <circle r={26 * u} fill={paper} />
          {strongK > 0 && (
            <g transform={`translate(0 ${-mr - 40 * u}) scale(${strongK})`}>
              <rect x={-124 * u} y={-g.label * 0.86} width={248 * u} height={g.label * 1.08} fill={tk.color.ink} />
              <Word x={0} y={0} text="STRONG" size={g.label} fill={paper} tk={tk} spacing={2} />
            </g>
          )}
        </g>
      )}

      {/* the picked idea: in the accent, carried over the frame and dropped into it */}
      {pos < 1.1 && !gone && at(t, tPitch + 0.09, 0.3) > 0 && (
        <g transform={`translate(${cx1} ${cy1}) rotate(${carryK * 6}) scale(${at(t, tPitch + 0.09, 0.3) * cardS})`}>
          <rect x={-cardW / 2} y={-cardH / 2} width={cardW} height={cardH} rx={tk.radius.md} fill={picked ? ac : paper} />
          <rect x={-cardW * 0.3} y={-cardH * 0.26} width={cardW * 0.6} height={9 * u} rx={4 * u} fill={tk.color.ink} />
          <rect x={-cardW * 0.3} y={-cardH * 0.06} width={cardW * 0.6} height={9 * u} rx={4 * u} fill={tk.color.ink} />
          <rect x={-cardW * 0.3} y={cardH * 0.14} width={cardW * 0.36} height={9 * u} rx={4 * u} fill={tk.color.ink} />
        </g>
      )}
      {/* the person, first time: picks one idea */}
      {t > tPick && leaveK < 1 && pos < 1 && <Hand x={handX} y={handY} rot={90} u={u} tk={tk} />}

      <AskCounter box={box} fills={[fill1, tVoice, 999]} t={t} tk={tk} />
    </g>
  );
};

export const EP001_LINE_SCENES: Record<string, SceneFC> = {
  "ep001-line": Line,
};

/** Focus on the frame and the station next to it; punch on the two asks and on the score. */
export const EP001_LINE_CAMERA: SceneCameraMap = {
  "ep001-line": { focus: [0.5, 0.45], beats: ["picked one", "for the voice", "score"] },
};
