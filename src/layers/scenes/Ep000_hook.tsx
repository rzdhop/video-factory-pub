import React from "react";
import { kit, at, ramp, Tag, type Pt } from "../../kit";
import type { SceneCameraMap, SceneFC } from "./types";
import { Beam, geo, Ground, Sky, spectrum, Sun } from "./Ep000_shared";

/* ep-000-demo hook. Frame 0: the sun, the blue sky, the ground and one white beam, all complete (the opening title
 * sits over the lower part). On "color" the white beam fans out into its five colours. */
const Hook: SceneFC = ({ preset, t, box, b }) => {
  const tk = kit(preset), g = geo(box);
  const tColor = b("color");
  const mid: Pt = [box.x + box.w * 0.52, box.y + box.h * 0.36];
  const fan = ramp(t, tColor, 0.5);
  const colours = spectrum(tk);
  return (
    <g>
      <Sky box={box} tint={tk.color.cyan} tk={tk} />
      <Ground box={box} tk={tk} />
      <Beam a={g.sun} b={mid} t={t} color={tk.color.text} tk={tk} />
      {colours.map((c, i) => (
        <Beam key={i} a={mid} b={[box.x + box.w * (0.2 + i * 0.12), g.horizon - 6]} k={fan} t={t + i * 0.1} color={c} tk={tk} />
      ))}
      {fan < 0.02 && <Beam a={mid} b={[box.x + box.w * 0.34, g.horizon - 6]} t={t} color={tk.color.text} tk={tk} />}
      <Sun at={g.sun} t={t} tk={tk} />
      <Tag x={box.x + box.w * 0.04} y={box.y + box.h * 0.1} text="sunlight" k={1} t={t} color={tk.color.accent} size={g.label} tk={tk} />
      <Tag x={box.x + box.w * 0.04} y={box.y + box.h * 0.2} text="= every color" k={at(t, tColor)} t={t} color={tk.color.text} size={g.label} tk={tk} />
    </g>
  );
};

export const EP000_HOOK_SCENES: Record<string, SceneFC> = {
  "ep000-hook": Hook,
};

/** Slow push toward the point where the beam splits; punch on "color". */
export const EP000_HOOK_CAMERA: SceneCameraMap = {
  "ep000-hook": { focus: [0.52, 0.36], beats: ["color"] },
};
