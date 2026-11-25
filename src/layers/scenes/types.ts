import type React from "react";
import type { Preset } from "../../types";
import type { KitTokens } from "../../kit";

/** The scene box of the layout, in px of the frame: every scene draws inside it. */
export type Box = { x: number; y: number; w: number; h: number; cx: number; cy: number };
/** Kit tokens of the preset: `const tk = kit(preset)`. */
export type Tk = KitTokens;
/** A scene component. `t` = seconds since the chapter start, `p` = 0..1 progress of the chapter,
 *  `b(word)` = time (same clock as `t`) of the first caption block of the chapter containing `word`, 999 if none. */
export type SceneFC = React.FC<{ preset: Preset; t: number; p: number; box: Box; b: (word: string) => number }>;
/** Camera of a scene: focus point (fractions of the scene box) and the words it punches on. */
export type SceneCameraMap = Record<string, { focus: [number, number]; beats: string[] }>;
