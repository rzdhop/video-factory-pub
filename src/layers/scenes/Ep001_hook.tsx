import React from "react";
import { kit, at, clamp01, easeOut, impulse, pop, springTo } from "../../kit";
import type { SceneCameraMap, SceneFC } from "./types";
import { AskCounter, Belt, Clapper, DirectorChair, Floor, geo, Hand, VideoFrame, Word } from "./Ep001_shared";

/* ep-001 hook. Frame 0: the empty set, complete: the director's chair kept for "AI" with nobody in it (the accent),
 * the empty frame of this video on the belt, the clapperboard open. On "Almost" the clapper snaps. On "had to ask"
 * a question mark comes out of the frame; on "a person" a hand comes in from the right; on "three" the ask counter
 * arrives with its three empty marks. */
const Hook: SceneFC = ({ preset, t, box, b }) => {
  const tk = kit(preset), g = geo(box), u = g.u;
  const tSnap = b("Almost"), tAsk = b("had to ask"), tPerson = b("a person"), tThree = b("three");
  // clapper: open and breathing, then shut in 0.1 s with a small rebound
  const shut = clamp01((t - tSnap) / 0.1);
  const open = t < tSnap ? 0.86 + Math.sin(t * 2.2) * 0.07 : (1 - shut * shut) * 0.86 + impulse(t - tSnap - 0.1, 5, 11) * 0.1 * (t > tSnap + 0.1 ? 1 : 0);
  const hit = t > tSnap + 0.1 ? impulse(t - tSnap - 0.1, 4, 9) : 0;
  // the question the frame asks
  const askK = at(t, tAsk, 0.3);
  const frameTop = g.belt - g.frameH;
  const fw = g.frameH * (240 / 396);
  const qx = g.frame + fw / 2 + 80 * u, qy = frameTop + 80 * u;
  // the person: a hand coming in from the right edge toward the question
  const handK = easeOut((t - tPerson) / 0.4) + (t > tPerson ? springTo(t - tPerson, 2.4, 7) * 0.04 - 0.04 : 0);
  const hx = qx + 30 * u + (1 - handK) * 640 * u, hy = qy + 110 * u - (1 - handK) * 60 * u;
  return (
    <g>
      <Floor box={box} tk={tk} />
      <Belt box={box} from={g.beltStart} run={t * 10 * u} tk={tk} />
      <DirectorChair x={g.chair} floor={g.floor} h={g.chairH} accent hop={hit * 0.5} t={t} tk={tk} />
      <VideoFrame x={g.frame} y={g.belt} h={g.frameH} squash={askK > 0 ? impulse(t - tAsk, 3.5, 8) : 0} tk={tk} />
      <Clapper x={g.clapper} floor={g.floor - hit * 14 * u} s={g.clapperS} open={open} tilt={-6 - hit * 4} tk={tk} />
      {askK > 0 && (
        <g transform={`translate(${qx} ${qy}) scale(${askK * 1.25}) rotate(${Math.sin(t * 2.4) * 3})`}>
          <path d={`M ${-50 * u} ${-56 * u} h ${100 * u} a ${18 * u} ${18 * u} 0 0 1 ${18 * u} ${18 * u} v ${62 * u} a ${18 * u} ${18 * u} 0 0 1 ${-18 * u} ${18 * u} h ${-34 * u} l ${-16 * u} ${22 * u} l ${-16 * u} ${-22 * u} h ${-34 * u} a ${18 * u} ${18 * u} 0 0 1 ${-18 * u} ${-18 * u} v ${-62 * u} a ${18 * u} ${18 * u} 0 0 1 ${18 * u} ${-18 * u} z`} fill={tk.color.text} />
          <Word x={0} y={20 * u} text="?" size={84 * u} fill={tk.color.ink} tk={tk} />
        </g>
      )}
      {t > tPerson && <Hand x={hx} y={hy} rot={38 + Math.sin(t * 2) * 1.5} u={u} tk={tk} />}
      <AskCounter box={box} fills={[999, 999, 999]} t={t} k={clamp01((t - tThree) / 0.55)} tk={tk} />
    </g>
  );
};

export const EP001_HOOK_SCENES: Record<string, SceneFC> = {
  "ep001-hook": Hook,
};

/** Focus between the chair and the frame; punch on the clap of "Almost". */
export const EP001_HOOK_CAMERA: SceneCameraMap = {
  "ep001-hook": { focus: [0.34, 0.45], beats: ["Almost"] },
};
