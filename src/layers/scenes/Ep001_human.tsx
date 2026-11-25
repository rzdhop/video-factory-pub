import React from "react";
import { kit, at, clamp01, easeOut, impulse, springTo } from "../../kit";
import type { SceneCameraMap, SceneFC } from "./types";
import { AskCounter, Barrier, Belt, Floor, geo, Hand, Sign, VideoFrame, YesButton } from "./Ep001_shared";

/* ep-001 human. The finished frame rides to the end of the line under the RENDER sign, its progress bar fills, and
 * on "stops" the belt stops dead in front of a barrier. On "Last question" the YES button comes out of the floor
 * (the accent), with nobody to press it. On "may I" the third ask is counted and the hand comes in; it presses
 * the button a moment later and the barrier lifts. */
const Human: SceneFC = ({ preset, t, box, b }) => {
  const tk = kit(preset), g = geo(box), u = g.u;
  const tStop = b("stops"), tLast = b("Last question"), tPost = b("may I");
  const speed = box.w * 0.02;
  // the frame travels with the belt, then stops with a forward jolt
  const run = speed * Math.min(t, tStop);
  const stopX = box.x + box.w * 0.18;
  const jolt = t > tStop ? impulse(t - tStop, 3.4, 7) : 0;
  const pressAt = tPost + 0.25;
  const press = t < pressAt ? 0 : Math.min(1, (t - pressAt) / 0.07) * (1 - 0.45 * clamp01((t - pressAt - 0.25) / 0.2));
  const lift = t > pressAt + 0.05 ? springTo(t - pressAt - 0.05, 2.2, 6) : 0;
  const go = t > pressAt + 0.22 ? Math.pow(t - pressAt - 0.22, 2) * box.w * 0.9 : 0;
  const fx = stopX - speed * Math.max(0, tStop - t) + go;
  const renderK = clamp01(t / Math.max(0.3, tStop - 0.1));
  const barrierX = box.x + box.w * 0.54, buttonX = box.x + box.w * 0.77;
  const signX = box.x + box.w * 0.5, signY = g.sign, barW = 220 * u, barY = signY + 64 * u;
  // the sign leaves in 0.15 s when the barrier lifts (the arm swings through its place)
  const signK = 1 - clamp01((t - pressAt) / 0.15);
  const btnK = clamp01((t - tLast) / 0.38);
  const handK = easeOut((t - tPost - 0.05) / 0.32);
  // top of the push button (same numbers as YesButton): the fingertip rests on it while it goes down
  const buttonTop = (p: number) => g.floor - 196 * u - 70 * u * (1 - 0.6 * p) + 8 * u;
  const handHover = g.floor - 300 * u;
  const reach = clamp01((t - pressAt + 0.12) / 0.12);
  const tipY = t < pressAt ? handHover + reach * reach * (buttonTop(0) - handHover) : buttonTop(press) + 2 * u;
  return (
    <g>
      <Floor box={box} tk={tk} />
      <Belt box={box} run={run + go} tk={tk} />
      {signK > 0 && (
        <g transform={`translate(${signX} ${signY}) scale(${signK}) translate(${-signX} ${-signY})`}>
          <Sign x={signX} y={signY} foot={signY + 45 * u} text="RENDER" u={u} tk={tk} />
          {/* progress bar of the render: linear on purpose, it is a progress */}
          <rect x={signX - barW / 2} y={barY} width={barW} height={24 * u} rx={12 * u} fill={tk.color.steel} />
          <rect x={signX - barW / 2} y={barY} width={Math.max(24 * u, barW * renderK)} height={24 * u} rx={12 * u} fill={t < tLast ? tk.color.accent : tk.color.text} />
        </g>
      )}
      <VideoFrame x={fx} y={g.belt} h={g.frameH} play={1} bars={[1, 1, 1]} tilt={jolt * 7} squash={jolt * 0.6} tk={tk} />
      <Barrier x={barrierX} floor={g.floor} lift={lift} shake={jolt} u={u} tk={tk} />
      <YesButton x={buttonX} floor={g.floor} k={btnK} press={press} accent u={u} tk={tk} />
      {t > tPost + 0.05 && <Hand x={buttonX + (1 - handK) * 520 * u} y={tipY - (1 - handK) * 120 * u} rot={50} u={u} tk={tk} />}
      <AskCounter box={box} fills={[-99, -99, tPost + 0.1]} t={t} tk={tk} />
      {/* the question mark over the button while nobody answers */}
      {btnK > 0 && t < tPost + 0.05 && (
        <g transform={`translate(${buttonX - 10 * u} ${g.floor - 318 * u}) scale(${at(t, tLast + 0.15, 0.3)}) rotate(${Math.sin(t * 2.6) * 5})`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={tk.font.ui} fontWeight={700} fontSize={130 * u} fill={tk.color.text}>?</text>
        </g>
      )}
    </g>
  );
};

export const EP001_HUMAN_SCENES: Record<string, SceneFC> = {
  "ep001-human": Human,
};

/** Focus between the stopped frame and the button; punch on "stops" and on the third ask. */
export const EP001_HUMAN_CAMERA: SceneCameraMap = {
  "ep001-human": { focus: [0.55, 0.5], beats: ["stops", "may I"] },
};
