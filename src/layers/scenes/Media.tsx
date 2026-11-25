import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import type { MediaItem, Preset, WordBlock } from "../../types";
import { clamp01, lerp, springTo } from "../../motion";

type Box = { x: number; y: number; w: number; h: number; cx: number; cy: number };
type Props = {
  preset: Preset;
  items: MediaItem[];
  episodeId: string;
  /** seconds since the chapter started */
  t: number;
  /** length of the chapter in seconds */
  duration: number;
  box: Box;
  /** word blocks of this chapter (absolute times) */
  words: WordBlock[];
  chapterStart: number;
};

const VIDEO_EXT = /\.(mp4|mov|webm|mkv|m4v)$/i;
const isVideo = (it: MediaItem) => (it.kind ? it.kind === "video" : VIDEO_EXT.test(it.src));
/** length of the cut between two items */
const CUT = 0.12;

/** Start time of every item (seconds from the chapter start), plus the end of the last one.
 *  An item with `word` starts on the first block of the chapter containing that word; the others share equally
 *  the time between the anchored items around them. The first item always starts with the chapter. */
export const mediaStarts = (items: MediaItem[], words: WordBlock[], chapterStart: number, duration: number): number[] => {
  const n = items.length;
  const anchor: (number | null)[] = items.map((it, i) => {
    if (i === 0) return 0;
    if (!it.word) return null;
    const w = it.word.toLowerCase();
    const hit = words.find((x) => x.text.toLowerCase().includes(w));
    return hit ? Math.min(duration, Math.max(0, hit.t_start - chapterStart)) : null;
  });
  const starts: number[] = new Array(n + 1).fill(0);
  starts[n] = duration;
  let i = 0;
  while (i < n) {
    // run [i, j): item i is anchored, the following ones are not
    let j = i + 1;
    while (j < n && anchor[j] === null) j++;
    const from = Math.max(anchor[i] ?? 0, i > 0 ? starts[i - 1] : 0);
    const to = Math.max(from, j < n ? (anchor[j] as number) : duration);
    for (let k = i; k < j; k++) starts[k] = from + ((to - from) * (k - i)) / (j - i);
    i = j;
  }
  return starts;
};

/** The backdrop of a `contain` item is drawn this many times smaller, blurred once, then scaled back up. */
const BACKDROP_DOWN = 8;

/** Montage scene: plays the chapter's files (images, muted videos) one after the other in a rounded frame as wide
 *  as the scene box and as tall as it can be (4:5 when the layout allows it: `sceneBox.mediaBottom`).
 *  Each item moves slowly (Ken Burns); a new item lands on a spring with a short white flash.
 *  A `contain` item never shows black bars: a blurred, enlarged copy of the same picture fills the frame behind it. */
export const Media: React.FC<Props> = ({ preset, items, episodeId, t, duration, box, words, chapterStart }) => {
  const { fps, height: frameH } = useVideoConfig();
  if (items.length === 0) return null;
  const starts = mediaStarts(items, words, chapterStart, duration);
  let idx = 0;
  for (let i = 0; i < items.length; i++) if (t >= starts[i]) idx = i;
  const item = items[idx];
  const age = t - starts[idx];
  const len = Math.max(0.5, starts[idx + 1] - starts[idx]);
  const k = clamp01(age / len);

  // Ken Burns: slow and linear over the whole item, so it never seems to stop
  const motion = item.motion ?? (isVideo(item) ? "none" : idx % 2 ? "pull" : "push");
  const contain = item.fit === "contain";
  const travel = contain ? 0.05 : 0.1;
  let scale = 1, tx = 0;
  if (motion === "push") scale = lerp(1, 1 + travel, k);
  if (motion === "pull") scale = lerp(1 + travel, 1, k);
  if (motion === "pan-left") { scale = 1 + travel; tx = lerp(travel / 2, -travel / 2, k) * box.w; }
  if (motion === "pan-right") { scale = 1 + travel; tx = lerp(-travel / 2, travel / 2, k) * box.w; }

  // cut between two items: the new one is there at once, slightly too big, and settles on a spring under a flash
  const cut = idx > 0;
  const land = cut ? 1 - springTo(age, 3.2, 12) : 0;
  const flash = cut ? Math.pow(clamp01(1 - age / CUT), 2) * 0.7 : 0;
  // (the outgoing item tightens a little during its last frames so the cut has an anticipation)
  const left = starts[idx + 1] - t;
  const out = idx < items.length - 1 && left < CUT ? Math.pow(1 - left / CUT, 2) : 0;
  const frameScale = 1 + land * 0.05 - out * 0.03;

  const src = staticFile(`episodes/${episodeId}/${item.src}`);
  const fill: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: contain ? "contain" : "cover",
    transform: `translateX(${tx.toFixed(2)}px) scale(${scale.toFixed(4)})`,
  };
  const radius = 40;
  // the camera of the film zooms up to ~1.1 on the scene: the frame starts a little below the top of the box,
  // so it never slides under the HUD counter
  const padTop = 30, padBottom = 8;
  const top = box.y + padTop;
  // height: the box, or more (down to `mediaBottom`, never taller than 4:5) when the layout leaves room under it
  const room = preset.sceneBox.mediaBottom ? frameH * preset.sceneBox.mediaBottom - top : 0;
  const h = Math.max(box.h - padTop - padBottom, Math.min(box.w * 1.25, room));
  const creditK = clamp01((age - 0.1) / 0.2);
  const video = isVideo(item);
  const from = Math.round((chapterStart + starts[idx]) * fps);
  const trim = Math.round((item.start ?? 0) * fps);
  // backdrop of a `contain` item: the same picture, covering the frame, small and blurred (one cheap blur)
  const bw = Math.ceil(box.w / BACKDROP_DOWN), bh = Math.ceil(h / BACKDROP_DOWN);
  const backFill: React.CSSProperties = { position: "absolute", left: "-12%", top: "-12%", width: "124%", height: "124%", objectFit: "cover", filter: "blur(5px) brightness(0.55) saturate(1.15)" };
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top,
        width: box.w,
        height: h,
        transform: `scale(${frameScale.toFixed(4)})`,
        borderRadius: radius,
        overflow: "hidden",
        background: "#0B0B10",
        boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
      }}
    >
      {contain && (
        <div style={{ position: "absolute", left: 0, top: 0, width: bw, height: bh, overflow: "hidden", transform: `scale(${(box.w / bw).toFixed(4)}, ${(h / bh).toFixed(4)})`, transformOrigin: "0 0" }}>
          {video ? (
            <Sequence key={`b${idx}`} from={from} layout="none">
              <OffthreadVideo src={src} muted trimBefore={trim} style={backFill} />
            </Sequence>
          ) : (
            <Img key={`b${idx}`} src={src} style={backFill} />
          )}
        </div>
      )}
      {video ? (
        // the Sequence makes the video start with its item, not with the film
        <Sequence key={idx} from={from} layout="none">
          <OffthreadVideo src={src} muted trimBefore={trim} style={fill} />
        </Sequence>
      ) : (
        <Img key={idx} src={src} style={fill} />
      )}
      {/* inner edge: a thin light border and a soft shade at the top, where the credit sits */}
      <div style={{ position: "absolute", inset: 0, borderRadius: radius, boxShadow: `inset 0 0 0 3px rgba(255,255,255,0.16), inset 0 70px 60px -50px rgba(0,0,0,0.5)` }} />
      {item.credit && (
        // credit: a small tag in the top-left corner, clear of the captions and of the platform buttons
        <div
          style={{
            position: "absolute",
            left: 22,
            top: 20,
            maxWidth: box.w - 44,
            padding: "4px 11px",
            borderRadius: 8,
            background: "rgba(11,11,16,0.62)",
            color: "rgba(255,255,255,0.86)",
            fontFamily: preset.fontHud,
            fontSize: 19,
            fontWeight: 400,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            opacity: creditK,
          }}
        >
          {item.credit}
        </div>
      )}
      {flash > 0 && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash }} />}
    </div>
  );
};
