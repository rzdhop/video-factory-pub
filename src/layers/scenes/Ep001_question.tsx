import React from "react";
import { kit, at, clamp01, impulse, pop } from "../../kit";
import type { SceneCameraMap, SceneFC } from "./types";
import { Belt, Book, Clapper, DirectorChair, Floor, geo, Logo, MitTag, VideoFrame, Word } from "./Ep001_shared";

/* ep-001 question. Back on the set of frame 0, same places: the chair, the clapperboard, and where the empty frame
 * stood, the finished one: the project logo. "engine" the logo answers; "rulebook" a book lands next to it;
 * "open source" the MIT tag drops on the logo; "yours" a second, empty frame pops out for the viewer;
 * "chair" the extras are gone and the accent is back on the empty chair; "GitHub" the project name is written.
 * The last image is the first one: the chair kept for AI, the clapperboard, the belt. */
const Question: SceneFC = ({ preset, t, box, b }) => {
  const tk = kit(preset), g = geo(box), u = g.u;
  const tEngine = b("engine"), tBook = b("rulebook"), tOpen = b("open"), tYourAi = b("your AI"), tYours = b("yours");
  const tWould = b("Would you"), tChair = b("chair"), tGit = b("GitHub");
  const logoH = g.frameH;
  const logoTop = g.belt - logoH;
  // the rulebook lands on the seat of the director's chair; the viewer's own frame pops in front of the clapper
  const seatY = g.floor - g.chairH * 0.57, yoursX = g.clapper + box.w * 0.02;
  // the clapperboard steps aside while the viewer's frame stands in its place, and comes back on "Would you"
  const clapK = 1 - clamp01((t - tYours + 0.12) / 0.14) + clamp01((t - tWould) / 0.25);
  // extras leave faster than they came
  const bookK = clamp01((t - tBook) / 0.35) * (1 - clamp01((t - tYourAi + 0.1) / 0.16));
  const yoursK = clamp01((t - tYours) / 0.35) * (1 - clamp01((t - tWould + 0.05) / 0.16));
  const tagK = clamp01((t - tOpen) / 0.4);
  const chairHot = t >= tChair;
  const nameK = clamp01((t - tGit) / 0.3);
  const name = "video-factory";
  return (
    <g>
      <Floor box={box} tk={tk} />
      <Belt box={box} from={g.beltStart} run={t * 10 * u} tk={tk} />
      <DirectorChair x={g.chair} floor={g.floor} h={g.chairH} accent={chairHot} hop={chairHot ? impulse(t - tChair, 3.2, 7) : 0} t={t} tk={tk} />
      <Book x={g.chair} y={seatY} k={bookK} color={tk.color.pink} u={u * 0.7} tk={tk} />
      <Logo x={g.frame} y={g.belt} h={logoH} squash={t > tEngine ? impulse(t - tEngine, 3.4, 8) : 0} tk={tk} />
      <MitTag x={g.frame + logoH * 0.27} y={logoTop + logoH * 0.05} k={tagK} swing={Math.sin(t * 2.1) * 5 + (t > tOpen ? impulse(t - tOpen - 0.2, 2.2, 5) * 16 : 0)} u={u} tk={tk} />
      {clapK > 0 && <Clapper x={g.clapper} floor={g.floor} s={g.clapperS * pop(clapK)} open={0.86 + Math.sin(t * 2.2) * 0.07} tk={tk} />}
      {yoursK > 0 && <VideoFrame x={yoursX} y={g.floor} h={g.frameH * 0.66 * pop(yoursK)} tilt={-4 + Math.sin(t * 3) * 1.5} tk={tk} />}
      {nameK > 0 && (
        <g transform={`translate(${g.frame} ${logoTop - 36 * u}) scale(${at(t, tGit, 0.3)})`}>
          <Word x={0} y={0} text={name} size={52 * u} fill={tk.color.text} tk={tk} />
        </g>
      )}
    </g>
  );
};

export const EP001_QUESTION_SCENES: Record<string, SceneFC> = {
  "ep001-question": Question,
};

/** Same framing as the hook, so the loop cuts clean; punch on "chair". */
export const EP001_QUESTION_CAMERA: SceneCameraMap = {
  "ep001-question": { focus: [0.34, 0.45], beats: ["chair"] },
};
