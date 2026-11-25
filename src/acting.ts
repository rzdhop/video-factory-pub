import type { Acting, Episode, Emotion, GestureKind, Shot } from "./types";
import { clamp01, easeOut, springTo } from "./motion";

export type ActingState = {
  emotion: Emotion;
  prevEmotion: Emotion;
  /** 0..1 blend from prevEmotion to emotion */
  emoK: number;
  /** seconds since the emotion changed (for the little "take" squash) */
  emoAge: number;
  shot: Shot;
  prevShot: Shot;
  /** springy 0..1 blend from prevShot to shot (can overshoot a little) */
  shotK: number;
  /** how many shot changes happened before this one: picks a different framing for each close-up */
  shotSeq: number;
  /** 0..1: how much the frame is a close-up right now (dims the scene, hides the HUD) */
  closeK: number;
  gesture: GestureKind;
  /** 0..1 presence of the gesture (hands in / out) */
  gestureK: number;
  /** false for old episodes without direction: the caller falls back to the per-chapter face */
  directed: boolean;
};

const IDLE: ActingState = { emotion: "idle", prevEmotion: "idle", emoK: 1, emoAge: 9, shot: "bust", prevShot: "bust", shotK: 1, shotSeq: 0, closeK: 0, gesture: "none", gestureK: 0, directed: false };

/** Acting state of the host at time t, read from episode.acting (tools/direct.py). */
export const actingAt = (episode: Episode, t: number): ActingState => {
  const list: Acting[] | undefined = episode.acting;
  if (!list || list.length === 0) return IDLE;
  let i = 0;
  while (i + 1 < list.length && list[i + 1].t <= t) i++;
  const cur = list[i];
  const prev = i > 0 ? list[i - 1] : cur;
  const emoAge = t - cur.t;
  // last shot change at or before the current state
  let j = i;
  while (j > 0 && list[j - 1].shot === cur.shot) j--;
  const prevShot = j > 0 ? list[j - 1].shot : cur.shot;
  let shotSeq = 0;
  for (let n = 1; n <= j; n++) if (list[n].shot !== list[n - 1].shot) shotSeq++;
  const shotK = j > 0 ? springTo(t - list[j].t, 2.6, 11) : 1;
  const closeNow = cur.shot === "close" ? 1 : 0;
  const closeBefore = prevShot === "close" ? 1 : 0;
  const closeK = clamp01(closeBefore + (closeNow - closeBefore) * easeOut((t - list[j].t) / 0.18));
  // gesture: hands come in at the start of a run of identical gestures and leave at its end
  let g0 = i;
  while (g0 > 0 && list[g0 - 1].gesture === cur.gesture) g0--;
  let g1 = i;
  while (g1 + 1 < list.length && list[g1 + 1].gesture === cur.gesture) g1++;
  const gestureK = cur.gesture === "none" ? 0 : easeOut((t - list[g0].t) / 0.2) * (1 - easeOut((t - (list[g1].t_end - 0.1)) / 0.22));
  return {
    emotion: cur.emotion,
    prevEmotion: prev.emotion,
    emoK: easeOut(emoAge / 0.14),
    emoAge,
    shot: cur.shot,
    prevShot,
    shotK,
    shotSeq,
    closeK,
    gesture: cur.gesture,
    gestureK,
    directed: true,
  };
};
