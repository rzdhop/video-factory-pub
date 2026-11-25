import React from "react";
import { AbsoluteFill } from "remotion";
import { HOSTS } from "./layers/Character";
import type { Emotion, GestureKind } from "./types";
import { getPreset } from "./presets";

/** Title and subtitle of the model sheet of each rigged host (src/layers/Character.tsx `HOSTS`).
 *  A host without an entry here still gets a sheet, titled with its id. */
const SHEETS: Record<string, { title: string; sub: string }> = {
  host: { title: "HOST", sub: "TEMPLATE CHARACTER · VOICE-DRIVEN MOUTH · 9 EMOTIONS · 4 GESTURES" },
};

/** Model sheet of a host: hero portrait, every emotion of the rig, every gesture.
 *  `npx remotion still src/index.ts CharacterSheet out/sheet.png --props='{"character":"host"}'` */
export const CharacterSheet: React.FC<{ preset?: string; character?: string }> = ({ preset = "dark-2d", character = "host" }) => {
  const p = getPreset(preset);
  const id = HOSTS[character] ? character : "host";
  const Drawing = HOSTS[id].C;
  const { title, sub } = SHEETS[id] ?? { title: id.toUpperCase(), sub: "" };
  const faces: { e: Emotion; label: string; speaking: boolean }[] = [
    { e: "idle", label: "Idle", speaking: false },
    { e: "idle", label: "Speaking", speaking: true },
    { e: "curious", label: "Curious", speaking: false },
    { e: "amazed", label: "Amazed", speaking: false },
    { e: "confused", label: "Confused", speaking: false },
    { e: "panic", label: "Panic", speaking: false },
    { e: "happy", label: "Happy", speaking: false },
    { e: "wink", label: "Wink", speaking: false },
    { e: "smug", label: "Smug", speaking: false },
    { e: "deadpan", label: "Deadpan", speaking: false },
  ];
  const gestures: GestureKind[] = ["wave", "point", "shrug", "balance"];
  const cols = 5, cellW = 240, cellH = 220, pitch = 280, x0 = 700, y0 = 190;
  const label: React.CSSProperties = { textAlign: "center", marginTop: 4, fontSize: 22, fontWeight: 600, letterSpacing: "0.12em", color: p.textHud };
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${p.bg.top}, ${p.bg.bottom})`, fontFamily: p.fontHud, color: p.textPrimary }}>
      <div style={{ position: "absolute", left: 60, top: 40, fontFamily: p.fontKinetic, fontSize: 64, letterSpacing: "0.01em" }}>
        {title} <span style={{ color: p.accent }}>· MODEL SHEET</span>
      </div>
      <div style={{ position: "absolute", left: 62, top: 134, fontSize: 22, color: p.textHud, letterSpacing: "0.18em", fontWeight: 600 }}>
        {sub}
      </div>
      {/* hero: wide view with shoulders */}
      <svg width={620} height={880} viewBox="0 0 620 880" style={{ position: "absolute", left: 40, top: 200 }}>
        <Drawing cx={310} cy={300} height={880} t={0.5} emotion="happy" speaking={false} accentHit={0} accent={p.accent} squash={1} />
      </svg>
      {/* emotions: a window around the head */}
      {faces.map((f, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        return (
          <div key={f.label} style={{ position: "absolute", left: x0 + col * cellW, top: y0 + row * pitch, width: cellW }}>
            <svg width={cellW} height={cellH} viewBox="40 60 540 500" style={{ display: "block" }}>
              <Drawing cx={310} cy={300} height={900} t={0.4 + i * 0.31} emotion={f.e} speaking={f.speaking} accentHit={f.e === "amazed" ? 0.6 : 0} accent={p.accent} squash={1} />
            </svg>
            <div style={label}>{f.label.toUpperCase()}</div>
          </div>
        );
      })}
      {/* gestures: a wider window, hands included */}
      {gestures.map((g, i) => (
        <div key={g} style={{ position: "absolute", left: x0 + i * cellW * 1.25, top: y0 + 2 * pitch, width: cellW * 1.25 }}>
          <svg width={cellW * 1.25} height={cellH} viewBox="-70 -10 760 560" style={{ display: "block" }}>
            <Drawing cx={310} cy={250} height={900} t={0.6 + i * 0.41} emotion={g === "shrug" ? "confused" : "happy"} speaking={false} accentHit={0} accent={p.accent} squash={1} gesture={{ kind: g, k: 1 }} />
          </svg>
          <div style={label}>{g.toUpperCase()}</div>
        </div>
      ))}
      <div style={{ position: "absolute", right: 60, top: 64, fontSize: 20, color: p.textHud, letterSpacing: "0.1em" }}>
        character {id} · preset {preset}
      </div>
    </AbsoluteFill>
  );
};
