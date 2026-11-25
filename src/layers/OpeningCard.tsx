import React, { useEffect, useState } from "react";
import { styleOf } from "../styles";
import { continueRender, delayRender } from "remotion";
import type { Episode, Preset, WordBlock } from "../types";
import { clamp01, easeOut, impulse } from "../motion";
import { accentGlow, outline, vowels } from "./Captions";

/** Hook-first opening (episode.json `opening`, docs/ENGINE_CONTRACT.md): the whole hook sentence is on screen and
 *  readable at frame 0 as a giant caption, the scene is complete and bright behind it, and the word-by-word
 *  captions only start when it leaves. Frame 0 is also what the platform shows as the cover of the video. */

/** The opening never lasts longer than this (seconds). */
export const OPENING_MAX_S = 4;
/** The title lands with a small scale settle over this time, then stands still (tools/cover.py picks that frame). */
export const OPENING_SETTLE_S = 0.2;
/** The title pops out around the end of the opening: starts this long before it, gone this long after it. */
const EXIT_BEFORE = 0.05, EXIT_AFTER = 0.07;
/** While an opening is set, the first chapter is shown as if it had started this long ago, so nothing of the
 *  picture is still fading or sliding in at frame 0 (scene entrance, HUD label). */
export const OPENING_LEAD_S = 0.6;

export type OpeningSpan = {
  /** index in `words` of the last block of the opening; the captions resume with the next one */
  endIndex: number;
  /** end of the opening in seconds (the end of that block) */
  end: number;
};

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/** How long the opening lasts: up to the end of the block of the first chapter that contains `until`, or, without
 *  it, up to the end of the first sentence (first block ending with . ! or ?). Never past OPENING_MAX_S: the
 *  opening is then cut back to the last block that ends before the cap. null when the episode has no opening. */
export const openingSpan = (episode: Pick<Episode, "opening" | "words" | "chapters">): OpeningSpan | null => {
  const o = episode.opening;
  const first = episode.chapters[0];
  if (!o || typeof o.title !== "string" || !o.title.trim() || !first) return null;
  const idx = episode.words.map((w, i) => (w.chapter === first.key ? i : -1)).filter((i) => i >= 0);
  if (idx.length === 0) return null;
  const until = (o.until ?? "").toLowerCase().trim();
  let end = until ? idx.find((i) => episode.words[i].text.toLowerCase().includes(until)) : undefined;
  if (end === undefined) end = idx.find((i) => /[.!?]["»]?$/.test(episode.words[i].text.trim()));
  if (end === undefined) end = idx[idx.length - 1];
  const t0 = episode.words[idx[0]].t_start;
  while (end > idx[0] && episode.words[end].t_end - t0 > OPENING_MAX_S) end--;
  return { endIndex: end, end: Math.min(episode.words[end].t_end, t0 + OPENING_MAX_S) };
};

type TitleWord = { text: string; accent: boolean; line: number };

/** `LA TERRE EST | UNE *TOUPIE*` -> words with their line and the accent mark. */
export const parseTitle = (title: string): TitleWord[] => {
  const out: TitleWord[] = [];
  title.split("|").map((l) => l.trim()).filter(Boolean).slice(0, 3).forEach((line, li) => {
    let inAccent = false;
    for (const raw of line.split(/\s+/)) {
      const opens = raw.startsWith("*"), closes = raw.replace(/[.,:;!?»"]+$/, "").endsWith("*");
      const text = raw.replace(/\*/g, "");
      if (text) out.push({ text, accent: inAccent || opens, line: li });
      inAccent = (inAccent || opens) && !closes;
    }
  });
  return out;
};

/** When each title word is said. A title word that is also a spoken word of the opening (same order) takes the
 *  time of that word (the speaking time of a block is shared by syllable count, as in the captions); the words
 *  of a tighter written title that are not spoken as such are spread between their neighbours. */
export const titleTimes = (title: TitleWord[], words: WordBlock[], span: OpeningSpan): number[] => {
  const spoken: { w: string; t: number }[] = [];
  for (const block of words.slice(0, span.endIndex + 1)) {
    const parts = block.text.split(/\s+/).filter(Boolean);
    const weights = parts.map(vowels);
    const total = weights.reduce((a, b) => a + b, 0);
    const dur = Math.max(0.12, block.t_end - block.t_start);
    let acc = 0;
    parts.forEach((p, i) => { spoken.push({ w: norm(p), t: block.t_start + (acc / total) * dur }); acc += weights[i]; });
  }
  const anchors: (number | null)[] = [];
  let from = 0;
  for (const tw of title) {
    const n = norm(tw.text);
    const hit = n ? spoken.findIndex((s, i) => i >= from && s.w === n) : -1;
    anchors.push(hit >= 0 ? spoken[hit].t : null);
    if (hit >= 0) from = hit + 1;
  }
  const t0 = spoken.length ? spoken[0].t : 0;
  if (anchors.length && anchors[0] === null) anchors[0] = t0;
  const out: number[] = [];
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    if (a !== null) { out.push(a); continue; }
    let j = i;
    while (j < anchors.length && anchors[j] === null) j++;
    const before = out[i - 1], after = j < anchors.length ? (anchors[j] as number) : span.end;
    for (let k = i; k < j; k++) out.push(before + ((after - before) * (k - i + 1)) / (j - i + 1));
    i = j - 1;
  }
  return out;
};

/** Rough width of an uppercase word in em, used until the real font has been measured. */
const estimate = (text: string) => text.length * 0.5;
const GAP_EM = 0.24, TRACK_EM = 0.01;

type Props = {
  preset: Preset; title: string; words: WordBlock[]; span: OpeningSpan; t: number; width: number; height: number;
  /** lowest px of the HUD: the title never goes above it */
  hudBottom: number;
  /** "below": the title sits under the scene box (from its bottom quarter, which captions cover anyway, down to the
   *  bottom safe line), so the whole scene stays visible at frame 0. Default "caption": where the captions sit. */
  place?: "caption" | "below";
  /** px (at 1920 high) added to the top of a "below" title */
  dy?: number;
};

/** The giant caption of the opening. Whole and readable at frame 0 (no fade, no word-by-word): only a scale settle.
 *  Every line is sized on its own to fill the width inside the 8 % side margins (short lines are shouted bigger).
 *  It sits where the captions sit and grows away from them, between the HUD and the bottom safe zone, and always
 *  inside the central 3:4 crop of the frame (12.5 % to 87.5 % of the height) that a profile grid shows.
 *  A small accent bar runs under the word being said, so the title stays in sync with the voice. */
export const OpeningCard: React.FC<Props> = ({ preset, title, words, span, t, width, height, hudBottom, place = "caption", dy = 0 }) => {
  const parsed = parseTitle(title);
  const font = preset.fontKinetic;
  // a drawing style (src/styles) may restyle the title: weight, shadows, accent colour, no lean
  const ts = styleOf(preset)?.title;
  const weight = ts?.weight ?? 400;
  const flat = ts?.flat === true;
  const key = parsed.map((w) => w.text).join(" ");
  // real widths of the words in this font (em): measured once the font is loaded, the frame waits for it
  const [handle] = useState(() => delayRender("opening title: measuring the font"));
  const [measured, setMeasured] = useState<{ key: string; em: number[] } | null>(null);
  useEffect(() => {
    let alive = true;
    const done = (em: number[] | null) => { if (alive && em) setMeasured({ key: `${font}|${key}`, em }); continueRender(handle); };
    const measure = () => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return null;
      ctx.font = `${weight} 200px "${font}"`;
      return parsed.map((w) => ctx.measureText(w.text.toUpperCase()).width / 200);
    };
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (!fonts) { done(null); return; }
    fonts.load(`${weight} 200px "${font}"`, key.toUpperCase()).then(() => done(measure()), () => done(null));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [font, key, handle]);
  if (parsed.length === 0) return null;
  const ems = measured && measured.key === `${font}|${key}` ? measured.em : parsed.map((w) => estimate(w.text));

  // where it sits: the caption anchor of the layout, clamped to the safe area and to the 3:4 grid crop
  const cap = preset.caption;
  const cropTop = height * 0.125, cropBottom = height * 0.875;
  const top = Math.max(cropTop, hudBottom) + 14;
  const floor = Math.min(cropBottom, height * 0.78) - 14;
  const growsDown = cap.anchor !== "bottom" && cap.position === "top";
  // captions anchored by their top edge (legacy): the title ends where one shouted caption line would end
  const oneLine = cap.size * 1.34 * (cap.lineHeight + 0.06);
  // (bottom-anchored captions: a little higher than them, the heavier outline must clear the host's hair)
  const anchor = cap.anchor === "bottom" ? height * (cap.y - 0.01) : growsDown ? height * cap.y : height * cap.y + oneLine;
  const below = place === "below" && preset.sceneBox;
  const boxQuarter = below ? height * (preset.sceneBox.top + 0.75 * (preset.sceneBox.bottom - preset.sceneBox.top)) : 0;
  const y0 = below ? Math.max(top, boxQuarter) + dy * (height / 1920) : growsDown ? Math.max(top, anchor) : top;
  const y1 = below ? floor : growsDown ? floor : Math.max(top + 200, Math.min(floor, anchor));
  const fromTop = growsDown || !!below; // the block hangs from y0 instead of standing on y1

  // sizes: each line fills the width (8 % side margins, minus the outline and the lean), capped so that one short
  // line does not dwarf the others, then everything shrinks together if the block is taller than its room
  const nLines = parsed[parsed.length - 1].line + 1;
  const OUT = 9;
  const availW = width * 0.84 - 2 * OUT - 16;
  const lineEm = Array.from({ length: nLines }, (_, li) => {
    const ws = parsed.map((w, i) => ({ w, i })).filter((x) => x.w.line === li);
    return ws.reduce((a, x) => a + ems[x.i] + x.w.text.length * TRACK_EM, 0) + Math.max(0, ws.length - 1) * GAP_EM;
  });
  const maxSize = (nLines === 1 ? 250 : nLines === 2 ? 215 : 185) * (height / 1920);
  let sizes = lineEm.map((em) => Math.min(maxSize, availW / Math.max(0.5, em)));
  const smallest = Math.min(...sizes);
  sizes = sizes.map((s) => Math.min(s, smallest * 1.6));
  const LH = 1.08;
  const total = sizes.reduce((a, s) => a + s * LH, 0);
  const room = y1 - y0;
  if (total > room) sizes = sizes.map((s) => (s * room) / total);
  const blockH = Math.min(total, room);

  // motion: settle in, pop out
  const settle = 1 + 0.06 * (1 - easeOut(t / OPENING_SETTLE_S));
  const out = clamp01((t - (span.end - EXIT_BEFORE)) / (EXIT_BEFORE + EXIT_AFTER));
  if (out >= 1) return null;
  const q = out * out;
  const starts = titleTimes(parsed, words, span);
  const current = starts.reduce((best, s, i) => (t >= s - 0.03 ? i : best), 0);
  const bandTop = fromTop ? y0 : y1 - blockH;
  return (
    <>
      {/* soft dark pad behind the title: it stays readable over any scene */}
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: bandTop - 90, height: blockH + 180,
          background: "radial-gradient(ellipse 62% 50% at 50% 50%, rgba(8,8,14,0.62) 0%, rgba(8,8,14,0.5) 55%, rgba(8,8,14,0) 100%)",
          opacity: (1 - out) * (preset.caption.titlePad ?? 1), pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute", left: 0, right: 0, ...(fromTop ? { top: y0 } : { bottom: height - y1 }),
          display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none",
          fontFamily: font, textTransform: "uppercase", color: preset.textPrimary, letterSpacing: `${TRACK_EM}em`,
          fontWeight: weight,
          textShadow: ts?.shadow ? ts.shadow(preset, false) : outline(OUT, "#0B0B10", preset.caption.softShadow ?? 1),
          transform: flat ? `scale(${1 - 0.04 * q})` : `translateY(${-q * 70}px) rotate(-1.2deg) scale(${settle * (1 - 0.35 * q)})`,
          transformOrigin: fromTop ? "50% 0%" : "50% 100%",
          opacity: 1 - q,
        }}
      >
        {Array.from({ length: nLines }).map((_, li) => (
          <div key={li} style={{ display: "flex", flexWrap: "nowrap", justifyContent: "center", gap: `0 ${GAP_EM}em`, fontSize: sizes[li], lineHeight: LH, whiteSpace: "nowrap" }}>
            {parsed.map((w, i) => {
              if (w.line !== li) return null;
              const active = i === current && t < span.end;
              // the word being said gets a small kick and the accent bar; the others stand still at full brightness
              const kick = i > 0 ? impulse(t - (starts[i] - 0.03), 3.5, 12) : 0;
              return (
                <span
                  key={i}
                  style={{
                    position: "relative", display: "inline-block",
                    color: w.accent ? (ts?.accentColor ? ts.accentColor(preset) : preset.accent) : undefined,
                    textShadow: w.accent ? (ts?.shadow ? ts.shadow(preset, true) : `${outline(OUT, "#0B0B10", preset.caption.softShadow ?? 1)}${accentGlow(preset, 40)}`) : undefined,
                    transform: `scale(${1 + Math.max(0, kick) * 0.05})`,
                  }}
                >
                  {w.text}
                  {active && !flat && (preset.caption.titleBar ?? 1) > 0 && (
                    <span
                      style={{
                        position: "absolute", left: "4%", right: "4%", bottom: "0.02em", height: Math.max(6, sizes[li] * 0.05),
                        borderRadius: 4, background: w.accent ? preset.textPrimary : preset.accent, opacity: preset.caption.titleBar ?? 1,
                        boxShadow: "0 0 0 4px #0B0B10",
                      }}
                    />
                  )}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
};
