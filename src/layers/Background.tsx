import React from "react";
import { AbsoluteFill } from "remotion";
import type { Preset } from "../types";
import { rnd, wobble } from "../motion";

export type BackgroundProps = {
  preset: Preset; t: number; width: number; height: number;
  /** 1 on each beat of the music, decays to 0 (lights breathe with the track) */
  beat?: number;
  /** 0..1 close-up amount: the room darkens and the key light tightens on the host */
  focus?: number;
  /** changes with every close-up: picks the colour and the spin of the burst drawn behind the face */
  burst?: number;
  /** camera offset in px, used for depth parallax */
  camX?: number; camY?: number;
};

/** Soft drop shadow under a layer; a look scales it with `bg.shadow` (default 1, 0 = no shadow and no filter). */
export const softDrop = (preset: Preset, dy: number, blur: number, a: number): string | undefined => {
  const s = preset.bg.shadow ?? 1;
  if (s <= 0) return undefined;
  return `drop-shadow(0 ${dy}px ${blur}px rgba(0,0,0,${s === 1 ? a : +(a * s).toFixed(3)}))`;
};

/** Full-frame background built as a small set in depth:
 *  gradient wall -> two drifting coloured lights -> stage spotlight on the scene -> floor line with a glow
 *  -> dust motes on three depth planes (each moves against the camera by a different amount) -> grain -> vignette. */
export const Background: React.FC<BackgroundProps> = ({ preset, t, width, height, beat = 0, focus = 0, burst = 0, camX = 0, camY = 0 }) => {
  const bg = preset.bg;
  const spot = bg.spot ?? 1, vignette = bg.vignette ?? 0.42, floor = bg.floor ?? true;
  const light = bg.light ?? "#6B4DFF";
  const light2 = bg.light2 ?? preset.accent;
  const sceneMid = ((preset.sceneBox.top + preset.sceneBox.bottom) / 2) * 100;
  const floorY = height * (preset.sceneBox.bottom - 0.015);
  const seed = Math.floor(t * 10) % 1000;
  const nDust = bg.dust ?? 34;
  const pulse = 1 + beat * 0.18;
  // a look can turn the drifting lights and the close-up rays down or off (1 = the default set)
  const lights = bg.lights ?? 1, rays = bg.burst ?? 1;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${bg.top} 0%, ${bg.bottom} 100%)` }} />
      {/* two coloured lights drifting slowly: the wall is never flat */}
      {lights > 0 && (<>
      <div
        style={{
          position: "absolute", inset: -200,
          background: `radial-gradient(circle at ${30 + wobble(t * 0.25, 1) * 14}% ${28 + wobble(t * 0.2, 2) * 8}%, ${light} 0%, rgba(0,0,0,0) 38%)`,
          opacity: 0.34 * pulse * (1 - focus * 0.5) * lights,
          transform: `translate(${-camX * 1.5}px, ${-camY * 1.5}px)`,
        }}
      />
      <div
        style={{
          position: "absolute", inset: -200,
          background: `radial-gradient(circle at ${74 + wobble(t * 0.22, 3) * 12}% ${52 + wobble(t * 0.18, 4) * 10}%, ${light2} 0%, rgba(0,0,0,0) 32%)`,
          opacity: 0.16 * pulse * (1 - focus * 0.5) * lights,
          transform: `translate(${-camX * 2}px, ${-camY * 2}px)`,
        }}
      />
      </>)}
      {/* stage spotlight on the scene area (lifts the drawings off the wall) */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 62% 30% at 50% ${sceneMid}%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 100%)`,
          opacity: (0.9 + beat * 0.25) * (1 - focus) * spot,
        }}
      />
      {bg.grid && (
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="grid" width="90" height="90" patternUnits="userSpaceOnUse">
              <path d="M 90 0 L 0 0 0 90" fill="none" stroke={bg.gridColor ?? "rgba(255,255,255,0.14)"} strokeWidth="2" />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid)" />
        </svg>
      )}
      {floor && (<>
      {/* floor: a horizon line with a soft glow and a darker ground below, so objects stand on something */}
      <div style={{ position: "absolute", left: 0, right: 0, top: floorY, bottom: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 45%)", opacity: 1 - focus }} />
      <div style={{ position: "absolute", left: "8%", right: "8%", top: floorY - 1, height: 2, background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${light2} 50%, rgba(255,255,255,0) 100%)`, opacity: (0.35 + beat * 0.3) * (1 - focus), filter: "blur(1px)" }} />
      <div style={{ position: "absolute", left: "20%", right: "20%", top: floorY - 30, height: 60, background: `radial-gradient(ellipse at 50% 50%, ${light2} 0%, rgba(0,0,0,0) 70%)`, opacity: (0.12 + beat * 0.08) * (1 - focus) }} />
      </>)}
      {/* dust motes on three depth planes */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: nDust }).map((_, i) => {
          const depth = i % 3; // 0 far, 2 near
          const speed = 9 + depth * 10 + rnd(i, 1) * 8;
          const x = (rnd(i, 2) * width + wobble(t * 0.5, i) * 24 - camX * (1 + depth * 1.6) + width) % width;
          const y = height - ((rnd(i, 3) * height + t * speed) % (height + 40)) - camY * (1 + depth * 1.6);
          const r = 1.6 + depth * 1.9 + rnd(i, 4) * 1.5;
          const tw = 0.5 + 0.5 * Math.sin(t * (1 + rnd(i, 5) * 2) + i);
          return <circle key={i} cx={x} cy={y} r={r} fill={i % 5 === 0 ? light2 : "#fff"} opacity={(0.1 + depth * 0.07) * tw} style={depth === 2 ? { filter: "blur(2px)" } : undefined} />;
        })}
      </svg>
      {bg.grain > 0 && (
        <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: bg.grain, mixBlendMode: "overlay" }}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={width} height={height} filter="url(#grain)" />
        </svg>
      )}
      {/* close-up: rays burst out from behind the face, slowly turning; colour and direction change with each close-up */}
      {focus > 0.02 && rays > 0 && (
        <div
          style={{
            position: "absolute", inset: -400,
            background: `repeating-conic-gradient(from ${t * (burst % 4 < 2 ? 14 : -14) + burst * 37}deg at 50% 42%, ${Math.floor(burst / 2) % 2 ? light2 : preset.accent} 0deg 5deg, rgba(0,0,0,0) 5deg 15deg)`,
            opacity: focus * 0.13 * rays,
            maskImage: "radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 12%, #000 55%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 42%, rgba(0,0,0,0) 12%, #000 55%)",
          }}
        />
      )}
      {/* vignette, tighter during a close-up */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) ${45 - focus * 12}%, rgba(0,0,0,${vignette + focus * 0.25}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
