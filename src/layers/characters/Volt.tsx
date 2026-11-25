import React from "react";
import type { Emotion } from "../../types";

/** "volt": the minimal mascot. A round dark head with big round eyes and a hoodie, bottom-left, cut by the frame.
 *  It has no rig (no face blending, no gestures, no shots): it only reads the emotion. Use it as the smallest
 *  example of a character; `Host.tsx` is the full template. */
type Props = { height: number; t: number; chapterT: number; emotion: Emotion; speaking: boolean; accentHit: number; accent: string };

export const Volt: React.FC<Props> = ({ height, t, chapterT, emotion, speaking, accentHit, accent }) => {
  const hoodie = "#3B6CF6";
  const skin = "#14141A";
  const cx = 235;
  const cy = height - 330;
  const r = 150;

  // idle breathing + panic shake
  const breathe = Math.sin(t * 2.2) * 6;
  const shake = emotion === "panic" ? Math.sin(t * 40) * 6 : 0;
  // hop when a chapter starts (a small jump with a squash on landing)
  const hopK = Math.min(1, chapterT / 0.5);
  const hop = Math.sin(hopK * Math.PI) * 42;
  const squash = 1 - Math.sin(Math.min(1, Math.max(0, (chapterT - 0.45) / 0.2)) * Math.PI) * 0.08;
  const bob = cy + breathe - hop;

  // eyes
  const eyeR = (emotion === "panic" || emotion === "amazed" ? 46 : 38) + accentHit * 8;
  const pupilR = emotion === "panic" ? 10 : 16;
  const look = emotion === "curious" ? 10 : emotion === "confused" ? -8 : 0;
  const blink = (t % 3.7) < 0.12 ? 0.12 : 1; // quick blink every ~3.7 s
  const leftEyeScaleY = emotion === "wink" ? 0.12 : blink;
  const browTilt = emotion === "confused" ? -12 : emotion === "curious" ? 10 : 0;

  // mouth: open while speaking (oscillates), otherwise a small line / smile
  const open = speaking ? 14 + Math.abs(Math.sin(t * 18)) * 26 : emotion === "panic" ? 38 : 0;
  const smile = emotion === "happy" || emotion === "wink" ? 1 : 0;

  // arm: points up when curious or amazed
  const pointing = emotion === "curious" || emotion === "amazed";

  return (
    <g transform={`translate(${shake} 0) translate(${cx} ${height}) scale(1 ${squash}) translate(${-cx} ${-height})`}>
      {/* hoodie body */}
      <path
        d={`M ${cx - 250} ${height + 40} C ${cx - 230} ${bob + 120}, ${cx - 120} ${bob + 110}, ${cx} ${bob + 120}
            C ${cx + 120} ${bob + 110}, ${cx + 230} ${bob + 120}, ${cx + 250} ${height + 40} Z`}
        fill={hoodie}
      />
      {/* hood collar */}
      <ellipse cx={cx} cy={bob + 135} rx={150} ry={46} fill="#2F57C9" />
      {/* arm */}
      {pointing ? (
        <g>
          <path d={`M ${cx + 160} ${bob + 240} Q ${cx + 320} ${bob + 120} ${cx + 330} ${bob - 40}`} stroke={hoodie} strokeWidth={54} fill="none" strokeLinecap="round" />
          <circle cx={cx + 330} cy={bob - 48} r={30} fill={skin} />
        </g>
      ) : (
        <path d={`M ${cx + 170} ${bob + 250} Q ${cx + 300} ${bob + 300} ${cx + 330} ${bob + 420}`} stroke={hoodie} strokeWidth={54} fill="none" strokeLinecap="round" />
      )}
      {/* head */}
      <circle cx={cx} cy={bob} r={r} fill={skin} />
      {/* eyes */}
      <g transform={`translate(${cx - 62} ${bob - 20}) scale(1 ${leftEyeScaleY})`}>
        <circle r={eyeR} fill="#fff" />
        <circle cx={look} cy={6} r={pupilR} fill={skin} />
      </g>
      <g transform={`translate(${cx + 62} ${bob - 20}) scale(1 ${blink})`}>
        <circle r={eyeR} fill="#fff" />
        <circle cx={look} cy={6} r={pupilR} fill={skin} />
      </g>
      {/* brows */}
      {browTilt !== 0 && (
        <g stroke="#fff" strokeWidth={8} strokeLinecap="round">
          <line x1={cx - 100} y1={bob - 78 + browTilt} x2={cx - 30} y2={bob - 78} />
          <line x1={cx + 30} y1={bob - 78} x2={cx + 100} y2={bob - 78 - browTilt} />
        </g>
      )}
      {/* mouth */}
      {open > 0 ? (
        <ellipse cx={cx} cy={bob + 72} rx={22 + open * 0.35} ry={open / 2} fill="#fff" />
      ) : smile ? (
        <path d={`M ${cx - 34} ${bob + 62} Q ${cx} ${bob + 98} ${cx + 34} ${bob + 62}`} stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" />
      ) : (
        <line x1={cx - 22} y1={bob + 72} x2={cx + 22} y2={bob + 72} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
      )}
      {/* accent spark on the hoodie */}
      <path d={`M ${cx - 10} ${bob + 170} l 26 -40 l -8 30 l 24 0 l -40 52 l 10 -34 z`} fill={accent} />
    </g>
  );
};
