import React from "react";
import { kit, at, Planet, Stamp, Tag } from "../../kit";
import type { SceneCameraMap, SceneFC } from "./types";
import { geo, Sun } from "./Ep000_shared";

/* ep-000-demo question. The same sun as frame 0 (the end loops on the opening), a small blue Earth, and Mars
 * coming to the front on "Mars" with a question mark stamped on it. */
const Question: SceneFC = ({ preset, t, box, b }) => {
  const tk = kit(preset), g = geo(box);
  const tMars = b("Mars");
  const k = at(t, tMars, 0.45);
  return (
    <g>
      <Sun at={g.sun} t={t} tk={tk} />
      <Planet x={box.x + box.w * 0.22} y={box.y + box.h * 0.2} r={70} color={tk.color.cyan} t={t} id="ep000-earth" tk={tk} />
      <Tag x={box.x + box.w * 0.22} y={box.y + box.h * 0.36} anchor="middle" text="Earth: blue" k={1} t={t} color={tk.color.cyan} size={g.label} tk={tk} />
      <Planet x={box.cx + box.w * 0.08} y={box.y + box.h * 0.42} r={150} color={tk.color.accentAlt} k={Math.max(0.35, k)} t={t} id="ep000-mars" tk={tk} />
      <Stamp x={box.cx + box.w * 0.08} y={box.y + box.h * 0.42} text="?" k={k} t={t} color={tk.color.accent} size={120} rot={8} tk={tk} />
    </g>
  );
};

export const EP000_QUESTION_SCENES: Record<string, SceneFC> = {
  "ep000-question": Question,
};

/** Focus on Mars; punch on "Mars". */
export const EP000_QUESTION_CAMERA: SceneCameraMap = {
  "ep000-question": { focus: [0.58, 0.42], beats: ["Mars"] },
};
