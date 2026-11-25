import React from "react";
import type { Preset } from "../types";
import { Host, HOST_GEOMETRY, type HostProps } from "./characters/Host";
import { Volt } from "./characters/Volt";
import type { ActingState } from "../acting";
import type { Emotion, Shot } from "../types";
import { styleOf } from "../styles";
import { softDrop } from "./Background";
import { impulse, lerp, wobble } from "../motion";

type Props = {
  preset: Preset;
  name: string;
  chapterKey: string;
  chapterT: number;
  speaking: boolean;
  accentHit: number;
  t: number;
  width: number;
  height: number;
  /** acting state of the frame (emotion / shot / gesture); without it the host stays idle in bust framing */
  acting?: ActingState;
  /** real voice this frame, from episode.mouth */
  mouth?: { open: number; wide: number } | null;
};

/** A rigged host: its drawing and where its eye line and chin sit below the head centre (px of the drawing). */
export type HostRig = { C: React.FC<HostProps>; eyeDy: number; chinDy: number };
/** Every rigged host by character id (`character` in plan.json). A new character = one file in
 *  src/layers/characters/ (copy Host.tsx) + one line here + one line in src/CharacterSheet.tsx. */
export const HOSTS: Record<string, HostRig> = {
  host: { C: Host, ...HOST_GEOMETRY },
};
/** Rig of a character id; an unknown id falls back to the template host, so a typo never gives an empty frame. */
export const hostRig = (name?: string): HostRig => HOSTS[name ?? "host"] ?? HOSTS.host;

/** Where the host stands for each shot: head centre (x, y in px) and scale. */
type Framing = { x: number; y: number; s: number; rot: number };
/** Bust framing. Legacy layout (no `host` block in the preset): head centre 330 px above the bottom, scale 1.
 *  Layout 2 (`host`): the platform UI covers the bottom 22 % of a short, so the host is lifted and a little smaller.
 *  With the camera push of the film (zoom 1.04 to 1.1 around 45 % of the height) the eyes land around 70-71 % of
 *  the height and the chin just above 80 %: only the body runs into the covered band. */
export const bustFraming = (preset: Preset, h: number, name?: string): Framing => {
  const host = preset.host;
  if (!host) return { x: 300, y: h - 330, s: 1, rot: 0 };
  return { x: host.x, y: h * host.eyeY - hostRig(name).eyeDy * host.scale, s: host.scale, rot: 0 };
};
/** Close-ups rotate through four framings so two reaction shots never look the same:
 *  centred, pushed left with a tilt, pushed right with the opposite tilt, extreme. */
const CLOSE_LEGACY: ((w: number, h: number) => Framing)[] = [
  (w, h) => ({ x: w / 2, y: h * 0.4, s: 1.72, rot: 0 }),
  (w, h) => ({ x: w * 0.43, y: h * 0.42, s: 1.95, rot: -5 }),
  (w, h) => ({ x: w * 0.57, y: h * 0.4, s: 1.62, rot: 4 }),
  (w, h) => ({ x: w / 2, y: h * 0.46, s: 2.3, rot: 0 }),
];
/** Layout 2: each close-up is given by its scale and by where the chin lands (fraction of the height): the face
 *  fills roughly 20-60 % of the frame and the captions go under the chin. */
const CLOSE_SAFE: { x: number; chin: number; s: number; rot: number }[] = [
  { x: 0.5, chin: 0.6, s: 2.15, rot: 0 },
  { x: 0.44, chin: 0.6, s: 2.25, rot: -5 },
  { x: 0.56, chin: 0.595, s: 2.0, rot: 4 },
  { x: 0.5, chin: 0.61, s: 2.5, rot: 0 },
];
const framing = (shot: Shot, seq: number, w: number, h: number, preset: Preset, name?: string): Framing => {
  const safe = !!preset.host;
  if (shot === "close") {
    const i = Math.floor(seq / 2) % 4; // seq goes up by 2 per close-up (in, out)
    if (!safe) return CLOSE_LEGACY[i](w, h);
    const v = CLOSE_SAFE[i];
    return { x: w * v.x, y: h * v.chin - hostRig(name).chinDy * v.s, s: v.s, rot: v.rot };
  }
  const bust = bustFraming(preset, h, name);
  if (shot === "peek") return safe ? { ...bust, y: bust.y + h * 0.075 } : { x: 300, y: h - 40, s: 1, rot: 0 };
  return bust;
};

/** The host layer. A rigged host (HOSTS) is framed per shot (bust / close-up / peek) and acted by `acting`
 *  (tools/direct.py); "volt" is the minimal mascot without a rig. A drawing style (src/styles) may bring its own
 *  drawing of a host (`hosts.<id>`), used when the look sets `styleHost: true`. */
export const Character: React.FC<Props> = ({ preset, name, chapterT, speaking, accentHit, t, width, height, acting, mouth = null }) => {
  const directed = acting?.directed ?? false;
  const emotion: Emotion = directed ? acting!.emotion : "idle";
  if (name === "volt") {
    return (
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <Volt height={height} t={t} chapterT={chapterT} emotion={emotion} speaking={speaking} accentHit={accentHit} accent={preset.accent} />
      </svg>
    );
  }
  if (!HOSTS[name]) return null;
  const styled = preset.styleHost === true ? styleOf(preset)?.hosts?.[name] : undefined;
  const Drawing = styled ?? HOSTS[name].C;
  // shot: springy move between framings (bust / close-up / peek)
  const seq = acting?.shotSeq ?? 0;
  const from = framing(acting?.prevShot ?? "bust", Math.max(0, seq - 1), width, height, preset, name);
  const to = framing(acting?.shot ?? "bust", seq, width, height, preset, name);
  const k = acting?.shotK ?? 1;
  const px = lerp(from.x, to.x, k), py = lerp(from.y, to.y, k), ps = lerp(from.s, to.s, k), prot = lerp(from.rot, to.rot, k);
  // life: breathing, a hop at chapter starts, a small "take" (squash and stretch) whenever the face changes
  const breathe = Math.sin(t * 2.2) * 5 + wobble(t, 4) * 3;
  const hopK = Math.min(1, chapterT / 0.5);
  const hop = directed ? 0 : Math.sin(hopK * Math.PI) * 36;
  const take = directed ? impulse(acting!.emoAge, 3.5, 9) : 0;
  const landing = Math.sin(Math.min(1, Math.max(0, (chapterT - 0.45) / 0.2)) * Math.PI) * 0.06;
  const squash = 1 - (directed ? 0 : landing) + take * 0.035;
  const sway = wobble(t * 0.6, 11) * 5; // weight shifting from one foot to the other
  // the drawing runs its body down to `height`: when the host is drawn smaller than 1, that line moves down
  // so the torso still reaches the bottom of the frame
  const bodyBottom = Math.max(height, py + (height - py) / ps);
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, filter: styled ? undefined : softDrop(preset, 18, 28, 0.55) }}>
      <g transform={`translate(${px} ${py}) rotate(${prot}) scale(${ps}) translate(${-px} ${-py})`}>
        <Drawing
          cx={px + sway}
          cy={py + breathe - hop - take * 10}
          height={bodyBottom}
          t={t}
          emotion={emotion}
          prevEmotion={directed ? acting!.prevEmotion : undefined}
          emoK={directed ? acting!.emoK : 1}
          speaking={speaking}
          mouth={mouth}
          accentHit={accentHit}
          accent={preset.accent}
          squash={squash}
          gesture={directed ? { kind: acting!.gesture, k: acting!.gestureK } : undefined}
          look={preset.character}
        />
      </g>
    </svg>
  );
};
