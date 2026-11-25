import React from "react";
import type { Preset, WordBlock } from "../types";
import { clamp01, springTo } from "../motion";

export type CaptionsProps = {
  preset: Preset; block: WordBlock | null; blockIndex?: number; t: number; width: number; height: number;
  /** 0..1: how much the frame is a close-up of the host: the captions slide to `caption.closeY` (under the chin) */
  closeK?: number;
};

/** Where the caption block is anchored, as a fraction of the height: `caption.y`, or `caption.closeY` during a
 *  close-up. It is the top edge of the block, or its bottom edge with `caption.anchor: "bottom"`. */
export const captionY = (preset: Preset, closeK = 0): number => {
  const cap = preset.caption;
  return cap.y + ((cap.closeY ?? cap.y) - cap.y) * Math.min(1, Math.max(0, closeK));
};

/** Soft dark band behind the caption area (preset `caption.band`, 0..1): the captions stay readable when they sit
 *  over a scene or over footage. It is always there, words or not, so it never blinks between two blocks. */
export const CaptionBand: React.FC<{ y: number; strength: number; height: number; bottom?: boolean }> = ({ y, strength, height, bottom = false }) => {
  if (strength <= 0.01) return null;
  const a = (k: number) => `rgba(8,8,14,${(Math.min(1, strength) * k).toFixed(3)})`;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: height * (y - (bottom ? 0.165 : 0.075)),
        height: height * 0.27,
        background: `linear-gradient(180deg, ${a(0)} 0%, ${a(0.55)} 16%, ${a(1)} 32%, ${a(1)} 62%, ${a(0.5)} 82%, ${a(0)} 100%)`,
        pointerEvents: "none",
      }}
    />
  );
};

/** A heavy outline made of stacked shadows: readable on any scene, and it renders the same in every Chrome. */
export const outline = (px: number, color: string) => {
  const parts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    parts.push(`${(Math.cos(a) * px).toFixed(1)}px ${(Math.sin(a) * px).toFixed(1)}px 0 ${color}`);
  }
  parts.push(`0 ${px + 4}px 0 ${color}`, `0 ${px + 10}px 26px rgba(0,0,0,0.6)`);
  return parts.join(", ");
};

export const vowels = (w: string) => Math.max(1, (w.toLowerCase().match(/[aeiouyàâäéèêëîïôöùûü]+/g) ?? []).length);

/** Kinetic captions, word by word: each word pops in when it is spoken (time shared inside the block by
 *  syllable count), the word being said is slightly bigger, the accented word takes the accent colour and a tilt. */
export const Captions: React.FC<CaptionsProps> = ({ preset, block, blockIndex = 0, t, width, height, closeK = 0 }) => {
  const cap = preset.caption;
  const y = captionY(preset, closeK);
  const bottom = cap.anchor === "bottom";
  // one band: its usual strength, or the close-up strength while the host fills the frame
  const strength = (cap.band ?? 0) + ((cap.closeBand ?? cap.band ?? 0) - (cap.band ?? 0)) * closeK;
  const band = <CaptionBand y={y} strength={strength} height={height} bottom={bottom} />;
  if (!block) return band;
  const words = block.text.split(/\s+/);
  const accentWords = new Set((block.accent ?? "").toLowerCase().split(/\s+/).filter(Boolean));
  const norm = (w: string) => w.toLowerCase().replace(/[.,:;!?«»"]/g, "");

  // when each word starts: the block's speaking time is shared by syllable count
  const weights = words.map(vowels);
  const total = weights.reduce((a, b) => a + b, 0);
  const dur = Math.max(0.12, block.t_end - block.t_start);
  let acc = 0;
  const starts = weights.map((w) => { const s = block.t_start + (acc / total) * dur; acc += w; return s; });
  const current = starts.reduce((best, s, i) => (t >= s - 0.03 ? i : best), 0);

  // short lines are shouted bigger, long ones shrink to stay on two lines
  const chars = block.text.length;
  const size = cap.size * (chars <= 10 ? 1.34 : chars <= 16 ? 1.16 : chars > 24 ? 0.9 : 1);
  // the whole line leans a little, alternating side from one block to the next
  const lean = (blockIndex % 2 ? 1 : -1) * 1.6;
  return (
    <>
    {band}
    <div style={{ position: "absolute", left: 0, right: 0, ...(bottom ? { bottom: height * (1 - y) } : { top: height * y }), display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: width * cap.maxWidth,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          // real gaps between words: a scaled word can never touch its neighbour
          gap: "0 0.3em",
          fontFamily: preset.fontKinetic,
          fontSize: size,
          lineHeight: cap.lineHeight + 0.06,
          textTransform: "uppercase",
          color: preset.textPrimary,
          letterSpacing: "0.01em",
          transform: `rotate(${lean}deg)`,
          textShadow: outline(7, "#0B0B10"),
        }}
      >
        {words.map((w, i) => {
          const age = t - (starts[i] - 0.03);
          const isAccent = accentWords.has(norm(w));
          const k = springTo(age, 3.4, 13); // 0 -> 1 with a small overshoot
          const visible = age > 0;
          const active = i === current && t < block.t_end + 0.15;
          // the accent grows through its font size (the layout makes room); transforms stay small so words never collide
          const scale = (visible ? 0.6 + 0.4 * k : 0.6) * (active ? 1.035 : 1);
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display: "inline-block",
                  opacity: visible ? clamp01(age / 0.05) : 0,
                  color: isAccent ? preset.accent : undefined,
                  fontSize: isAccent ? "1.14em" : undefined,
                  transform: `translateY(${visible ? (1 - Math.min(1, k)) * 26 : 26}px) scale(${scale}) rotate(${isAccent ? -lean * 1.5 : 0}deg)`,
                  textShadow: isAccent ? `${outline(7, "#0B0B10")}, 0 0 34px ${preset.accent}AA` : undefined,
                }}
              >
                {w}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
    </>
  );
};
