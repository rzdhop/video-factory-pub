import React from "react";
import type { MediaItem, Preset, WordBlock } from "../types";
// episode scenes: generated registry (tools/gen_scenes.py), never edited by hand
import { EP_SCENES, EP_CAMERA, type SceneCamera } from "./scenes";
import { Media } from "./scenes/Media";
import type { Box } from "./scenes/types";

/** Camera of a scene that has no entry in a *_CAMERA export: centred, no punch. */
const NEUTRAL_CAMERA: SceneCamera = { focus: [0.5, 0.5], beats: [] };

type Props = { preset: Preset; scene: string; t: number; p: number; width: number; height: number; words?: WordBlock[]; chapterStart?: number; media?: MediaItem[]; episodeId?: string; chapterDur?: number };

const clamp01 = (k: number) => Math.min(1, Math.max(0, k));
const ease = (k: number) => 1 - Math.pow(1 - clamp01(k), 3);

/** Scene layer: picks the drawing named by the chapter (plan.json `chapters[].scene`) in the generated registry
 *  and gives it the preset's scene box, `t` (seconds since the chapter start), `p` (0..1 progress of the chapter)
 *  and `b(word)` (time of the first caption block of the chapter that contains the word, 999 when absent).
 *  A scene file exports `<NAME>_SCENES` (name -> component) and `<NAME>_CAMERA` (name -> focus point and the words
 *  the camera punches on); `python3 tools/gen_scenes.py` registers it. The built-in scene "media" plays the files
 *  of a montage chapter. An unknown scene name draws nothing (tools/lint_plan.py refuses it). */
export const Scene: React.FC<Props> = ({ preset, scene, t, p, width, height, words = [], chapterStart = 0, media, episodeId = "", chapterDur }) => {
  const y = height * preset.sceneBox.top;
  const h = height * (preset.sceneBox.bottom - preset.sceneBox.top);
  const box: Box = { x: 80, y, w: width - 160, h, cx: width / 2, cy: y + h / 2 };
  const enter = ease(t / 0.45);
  const driftX = Math.sin(t * 0.35) * 8;
  const driftY = Math.cos(t * 0.28) * 6;
  // montage scene: files of the episode (images / videos) instead of a drawing
  if (scene === "media") {
    return <Media preset={preset} items={media ?? []} episodeId={episodeId} t={t} duration={chapterDur ?? (p > 0 ? t / p : 0)} box={box} words={words} chapterStart={chapterStart} />;
  }
  const Ep = EP_SCENES[scene];
  if (!Ep) return null;
  {
    // beat lookup: time of the first block of this chapter containing the word (relative to chapter start)
    const b = (word: string) => {
      const w = word.toLowerCase();
      const hit = words.find((x) => x.text.toLowerCase().includes(w));
      return hit ? hit.t_start - chapterStart : 999;
    };
    const cam = EP_CAMERA[scene] ?? NEUTRAL_CAMERA;
    const fx = cam.focus[0] * width, fy = box.y + cam.focus[1] * h;
    let punch = 0;
    for (const word of cam.beats) {
      const dt = t - b(word);
      if (dt >= 0 && dt < 1) punch += Math.exp(-dt * 7);
    }
    punch = Math.min(1.2, punch);
    const zoom = 1 + 0.07 * ease(p) + 0.045 * punch;
    const shakeX = Math.sin(t * 70) * 7 * punch;
    const shakeY = Math.cos(t * 63) * 5 * punch;
    return (
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: Math.min(1, t / 0.08), filter: "drop-shadow(0 16px 22px rgba(0,0,0,0.45))" }}>
        <defs>
          <linearGradient id="scene-fade" x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
            <stop offset={(box.y + h - 120) / height} stopColor="#fff" stopOpacity={1} />
            <stop offset={(box.y + h) / height} stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="scene-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
            <rect x={0} y={0} width={width} height={height} fill="url(#scene-fade)" />
          </mask>
        </defs>
        <g mask="url(#scene-mask)">
          <g transform={`translate(${driftX * 0.5 + shakeX} ${(1 - enter) * 40 + driftY * 0.5 + shakeY}) translate(${fx} ${fy}) scale(${zoom}) translate(${-fx} ${-fy})`}>
            <Ep preset={preset} t={t} p={p} box={box} b={b} />
          </g>
        </g>
      </svg>
    );
  }
};
