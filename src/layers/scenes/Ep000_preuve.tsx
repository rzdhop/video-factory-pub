import React from "react";
import { kit, at, ramp, clamp01, Tag, type Pt } from "../../kit";
import type { SceneCameraMap, SceneFC } from "./types";
import { Beam, Molecule, Sky } from "./Ep000_shared";

/* ep-000-demo proof. Air molecules float in the box. On "blue" a blue ray comes in from the left, hits a
 * molecule and leaves in every direction; on "red" a red ray crosses the same air in a straight line. */
const Proof: SceneFC = ({ preset, t, box, b }) => {
  const tk = kit(preset);
  const tBlue = b("blue"), tRed = b("red");
  const yBlue = box.y + box.h * 0.26, yRed = box.y + box.h * 0.5;
  const hit: Pt = [box.x + box.w * 0.55, yBlue];
  const inK = ramp(t, tBlue, 0.3), outK = ramp(t, tBlue + 0.25, 0.45);
  const spots: Pt[] = [hit, [box.x + box.w * 0.3, yRed - 70], [box.x + box.w * 0.74, yRed + 60], [box.x + box.w * 0.42, yRed + 50], [box.x + box.w * 0.82, yBlue + 40], [box.x + box.w * 0.2, yBlue - 30]];
  return (
    <g>
      <Sky box={box} tint={tk.color.steel} k={0.6} tk={tk} />
      <Beam a={[box.x + 20, yBlue]} b={hit} k={inK} t={t} color={tk.color.cyan} tk={tk} />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.4;
        return <Beam key={i} a={hit} b={[hit[0] + Math.cos(a) * 150, hit[1] + Math.sin(a) * 150]} k={outK} t={t + i * 0.07} color={tk.color.cyan} w={tk.stroke.base} tk={tk} />;
      })}
      <Beam a={[box.x + 20, yRed]} b={[box.x + box.w - 20, yRed]} k={ramp(t, tRed, 0.5)} t={t} color={tk.color.accentAlt} tk={tk} />
      {spots.map((s, i) => <Molecule key={i} at={s} t={t} seed={i} hot={i === 0 ? clamp01(outK) : 0} tk={tk} />)}
      <Tag x={box.x + box.w * 0.04} y={box.y + box.h * 0.06} text="air molecules" k={1} t={t} color={tk.color.steel} size={30} tk={tk} />
      <Tag x={box.x + box.w * 0.96} y={box.y + box.h * 0.06} anchor="end" text="blue: scattered" k={at(t, tBlue + 0.2)} t={t} color={tk.color.cyan} size={30} tk={tk} />
      <Tag x={box.x + box.w * 0.96} y={yRed - 64} anchor="end" text="red: goes through" k={at(t, tRed + 0.2)} t={t} color={tk.color.accentAlt} size={30} tk={tk} />
    </g>
  );
};

export const EP000_PREUVE_SCENES: Record<string, SceneFC> = {
  "ep000-preuve": Proof,
};

/** Focus on the molecule that scatters the blue ray; punch on "blue". */
export const EP000_PREUVE_CAMERA: SceneCameraMap = {
  "ep000-preuve": { focus: [0.55, 0.3], beats: ["blue"] },
};
