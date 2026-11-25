import React from "react";
import { kit, at, ramp, easeInOut, lerp, Tag, type Pt } from "../../kit";
import type { SceneCameraMap, SceneFC } from "./types";
import { Beam, geo, Ground, Sky, Sun } from "./Ep000_shared";

/* ep-000-demo twist. On "everywhere" blue rays reach the observer from all over the sky. On "sunset" the sun
 * goes down to the horizon: its light now crosses much more air, the blue rays fade ("lost") and what arrives
 * straight from the sun is red. */
const Twist: SceneFC = ({ preset, t, box, b }) => {
  const tk = kit(preset), g = geo(box);
  const tAll = b("everywhere"), tSet = b("sunset"), tLost = b("lost");
  const down = easeInOut((t - tSet) / 0.9);
  const lost = ramp(t, tLost, 0.5);
  const sun: Pt = [lerp(g.sun[0], box.x + box.w * 0.9, down), lerp(g.sun[1], g.horizon - 70, down)];
  const eye: Pt = [g.eye[0], g.eye[1] - 10];
  return (
    <g>
      <Sky box={box} tint={tk.color.cyan} k={1 - lost} tk={tk} />
      <Sky box={box} tint={tk.color.accentAlt} k={lost} tk={tk} />
      {Array.from({ length: 7 }).map((_, i) => {
        const from: Pt = [box.x + box.w * (0.08 + i * 0.14), box.y + box.h * (0.12 + 0.16 * Math.abs(Math.sin(i * 1.9)))];
        return <Beam key={i} a={from} b={eye} k={ramp(t, tAll + i * 0.04, 0.4) * (1 - lost)} t={t + i * 0.13} color={tk.color.cyan} w={tk.stroke.base} tk={tk} />;
      })}
      <Beam a={sun} b={eye} k={ramp(t, tSet + 0.6, 0.5)} t={t} color={tk.color.accentAlt} tk={tk} />
      <Sun at={sun} t={t} color={down > 0.5 ? tk.color.accentAlt : tk.color.accent} tk={tk} />
      <Ground box={box} tk={tk} />
      <Tag x={box.x + box.w * 0.04} y={box.y + box.h * 0.06} text="blue: from every direction" k={at(t, tAll) * (1 - down)} t={t} color={tk.color.cyan} size={g.label} tk={tk} />
      <Tag x={box.x + box.w * 0.04} y={box.y + box.h * 0.06} text="sunset: more air to cross" k={at(t, tSet + 0.5)} t={t} color={tk.color.accentAlt} size={g.label} tk={tk} />
    </g>
  );
};

export const EP000_TWIST_SCENES: Record<string, SceneFC> = {
  "ep000-twist": Twist,
};

/** Focus on the observer; punch on "everywhere" and on "lost". */
export const EP000_TWIST_CAMERA: SceneCameraMap = {
  "ep000-twist": { focus: [0.5, 0.55], beats: ["everywhere", "lost"] },
};
