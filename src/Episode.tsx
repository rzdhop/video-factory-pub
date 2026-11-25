import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { EpisodeProps, Preset, TransitionKind } from "./types";
import { resolvePreset } from "./presets";
import { Background } from "./layers/Background";
import { Scene } from "./layers/Scene";
import { Character } from "./layers/Character";
import { Hud } from "./layers/Hud";
import { Captions, captionY } from "./layers/Captions";
import { OpeningCard, openingSpan, OPENING_LEAD_S } from "./layers/OpeningCard";
import { HostSet } from "./layers/HostSet";
import { styleOf } from "./styles";
import { actingAt } from "./acting";
import { clamp01, easeOut, impulse, lerp, springTo, wobble } from "./motion";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const over = <T,>(base: T, top: unknown): T => {
  if (!isObj(base) || !isObj(top)) return (top === undefined ? base : top) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(top)) out[k] = isObj(v) && isObj(out[k]) ? over(out[k], v) : v;
  return out as T;
};
/** Preset of an episode with its layout version applied.
 *  An episode without `layout` (or with 1) keeps the legacy layout: the preset as it is, nothing moves.
 *  `layout: 2` lays `layouts["2"]` of the preset over it (safe zones). An episode without a host has no legacy
 *  to protect: it always takes layout 2, then its `hostless` block. Keys that the look sets itself always win. */
export const resolveLayout = (episode: Pick<NonNullable<EpisodeProps["episode"]>, "preset" | "character" | "layout" | "look" | "lang">): Preset => {
  // the language travels on the preset: every scene and kit part already receives it (French presets stay untouched)
  const plain = resolvePreset(episode);
  const base: Preset = episode.lang && episode.lang !== "fr" ? { ...plain, lang: episode.lang } : plain;
  const hostless = episode.character === "none";
  const version = hostless ? 2 : episode.layout ?? 1;
  const layout = base.layouts?.[String(version)];
  if (!layout) return base;
  const { hostless: layoutHostless, ...shared } = layout;
  let out = over(base, shared);
  if (hostless) out = over(out, over(layoutHostless ?? {}, base.hostless ?? {}));
  // the look was already merged into `base`: lay its own layout keys again so they win over the layout block
  const look = (episode.look ?? {}) as Record<string, unknown>;
  const own: Record<string, unknown> = {};
  for (const k of ["textHud", "hud", "sceneBox", "caption", "host"]) if (look[k] !== undefined) own[k] = look[k];
  return over(out, own);
};

/** Chapter cuts rotate through these so two cuts in a row never look the same. plan.json can force one per chapter. */
const TRANSITIONS: TransitionKind[] = ["whip-left", "zoom", "whip-up", "flash", "whip-right"];

/** Compositor: reads the episode JSON, derives the active chapter / block / acting state, stacks the layers,
 *  and plays the camera: hand-held drift, push-in, punch on accents, pulse on the beat, hold-then-hit on punchlines,
 *  whip / zoom / flash cuts between chapters, reaction close-ups of the host. */
export const Episode: React.FC<EpisodeProps> = ({ episode, episodeId }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  if (!episode) return <AbsoluteFill style={{ background: "#000" }} />;
  // layout, resolved once: base preset (legacy values) < `layouts.<n>` of the preset < its `hostless` block when
  // there is no host < what the look says itself (docs/ENGINE_CONTRACT.md)
  const hostless = episode.character === "none";
  const preset: Preset = resolveLayout(episode);
  const t = frame / fps;
  // drawing style of the look (src/styles): its own builders for the set, the captions and the label
  const style = styleOf(preset);
  const SetLayer = style?.Set ?? Background;
  const CaptionLayer = style?.Captions ?? Captions;
  const HudLayer = style?.Hud ?? Hud;
  const flashLook = style?.flash?.(preset) ?? { color: "#fff", strength: 1 };

  const idx = episode.chapters.findIndex((c) => t >= c.t_start && t < c.t_end);
  const chapterIndex = idx === -1 ? episode.chapters.length - 1 : idx;
  const chapter = episode.chapters[chapterIndex];
  const nextChapter = episode.chapters[chapterIndex + 1];
  const chapterT = t - chapter.t_start;
  const chapterDur = chapter.t_end - chapter.t_start;
  const chapterP = clamp01(chapterT / chapterDur);

  const blockIndex = episode.words.findIndex((w, i) => {
    const next = episode.words[i + 1];
    return t >= w.t_start && (next ? t < next.t_start : t < w.t_end + 0.6);
  });
  const block = blockIndex >= 0 ? episode.words[blockIndex] : null;
  const speaking = block !== null && t < block.t_end;
  const blockAge = block ? t - block.t_start : 9;
  const accentHit = block?.accent ? clamp01(1 - blockAge / 0.35) : 0;

  // host: acting state + the real voice of this frame
  // (no host: any `acting` in the file is ignored, so there is never a close-up, a peek or a burst)
  // hook-first opening (episode.opening): the hook sentence is a giant caption from frame 0 until `open.end`.
  // Meanwhile the host stays in bust framing whatever `acting` says (every state that starts before the end of the
  // opening is played as a bust shot), so the scene is whole and bright from the first frame.
  const open = openingSpan(episode);
  // a style may refuse close-ups of the host (`noCloseUps`): every state is then played as a bust shot
  const noClose = style?.noCloseUps === true;
  const acted = episode.acting && (open || noClose) ? { ...episode, acting: episode.acting.map((a) => (noClose || (open && a.t < open.end) ? { ...a, shot: "bust" as const } : a)) } : episode;
  const acting = actingAt(hostless ? { ...episode, acting: undefined } : acted, t);
  const mouth = episode.mouth ? { open: episode.mouth.open[frame] ?? 0, wide: episode.mouth.wide[frame] ?? 0.5 } : null;
  const closeK = acting.closeK;

  // music: the bed restarts on a downbeat at every chapter, so the beat phase is local to the chapter
  const beatLen = episode.music ? 60 / episode.music.bpm : 0;
  const beat = beatLen ? Math.exp(-((chapterT / beatLen) % 1) * 5) : 0;
  // punchlines: the camera creeps in while the music is out, then hits on the word
  let hold = 0, hit = 0;
  for (const s of episode.music?.stops ?? []) {
    const dt = t - s;
    if (dt > -0.36 && dt < 0) hold = Math.max(hold, 1 + dt / 0.36);
    if (dt >= 0 && dt < 0.8) { const v = impulse(dt, 5, 8); if (Math.abs(v) > Math.abs(hit)) hit = v; }
  }

  // camera: slow push-in per chapter + hand-held drift + punches
  const punch = block?.accent ? impulse(blockAge, 4.5, 10) : 0;
  // 1.04 base: bounces and the hand-held tilt never show the edge of the set
  const zoom = 1.04 + (preset.camera.zoom + 0.03) * easeOut(chapterP) + punch * 0.014 + beat * 0.004 + hold * 0.03 + hit * 0.028;
  const camX = wobble(t, 0) * 7 + Math.sin(t * 47) * 5 * Math.abs(hit);
  const camY = wobble(t, 5) * 5 + Math.cos(t * 41) * 4 * Math.abs(hit);
  const camRot = wobble(t * 0.7, 9) * 0.22;

  // chapter cut: the outgoing scene leaves during the last 0.12 s, the incoming one lands on a spring
  const kindIn: TransitionKind = chapter.transition ?? TRANSITIONS[chapterIndex % TRANSITIONS.length];
  const kindOut: TransitionKind | null = nextChapter ? nextChapter.transition ?? TRANSITIONS[(chapterIndex + 1) % TRANSITIONS.length] : null;
  let sx = 0, sy = 0, sScale = 1, sBlur = 0, flash = 0;
  if (chapterIndex > 0 && chapterT < 0.7) {
    const k = springTo(chapterT, 2.2, 11);
    const fast = clamp01(1 - chapterT / 0.16);
    if (kindIn === "whip-left") { sx = (1 - k) * width * 0.55; sBlur = fast * 16; }
    if (kindIn === "whip-right") { sx = -(1 - k) * width * 0.55; sBlur = fast * 16; }
    if (kindIn === "whip-up") { sy = (1 - k) * height * 0.28; sBlur = fast * 14; }
    if (kindIn === "zoom") { sScale = 1 + (1 - k) * 0.4; sBlur = fast * 12; }
    if (kindIn === "flash") { sScale = 1 + (1 - k) * 0.08; flash = clamp01(1 - chapterT / 0.2) * 0.45; }
  }
  const left = chapterDur - chapterT;
  if (kindOut && left < 0.12) {
    const q = Math.pow(1 - left / 0.12, 2);
    if (kindOut === "whip-left") { sx = -q * width * 0.55; sBlur = q * 16; }
    if (kindOut === "whip-right") { sx = q * width * 0.55; sBlur = q * 16; }
    if (kindOut === "whip-up") { sy = -q * height * 0.28; sBlur = q * 14; }
    if (kindOut === "zoom") { sScale = 1 - q * 0.25; sBlur = q * 12; }
  }
  // cold open: the very first frames land with a punch instead of fading in
  const opening = t < 0.6 ? impulse(t, 3.5, 7) : 0;

  // opening: nothing of the first picture may still be fading or sliding in at frame 0. The scene (Scene.tsx fades
  // and slides every chapter in from its local time 0) and the HUD label (drops in over 0.25 s) are shown as if the
  // first chapter had started OPENING_LEAD_S earlier; the word beats of the scene keep their real times because the
  // chapter start given to the scene moves by the same amount.
  const lead = open && chapterIndex === 0 ? OPENING_LEAD_S : 0;
  // opening with `host: "hidden"`: the host (and its set) waits under the frame and slides in when the title leaves
  const hostHidden = open !== null && !hostless && episode.opening?.host === "hidden" && t < open.end + 1.5;
  const hostSlide = hostHidden ? (1 - springTo(t - (open.end - 0.05), 1.6, 9)) * height * 0.62 : null;
  // lowest pixel of the HUD in the first chapter: the opening title never climbs over it
  const hud0 = episode.chapters[0].hud;
  const hudBottom = height * preset.hud.y + preset.hud.labelSize * 1.2 + 6 + (hud0.counter && preset.hud.counterSize > 0 ? preset.hud.counterSize * 1.1 + 6 : 0) + (hud0.stats ? 62 : 0);

  // optional set around the host (desk, meter, reveal on a word): bust framing only
  const hs = hostless ? undefined : episode.host_set;
  let revealAge = -99;
  if (hs?.reveal) {
    const w = hs.reveal.word.toLowerCase();
    const hitW = episode.words.find((x) => x.chapter === hs.reveal!.chapter && x.text.toLowerCase().includes(w));
    if (hitW) revealAge = t - hitW.t_start;
  }
  const peekK = acting.shot === "peek" ? clamp01(acting.shotK) : acting.prevShot === "peek" ? clamp01(1 - acting.shotK) : 0;
  const meter = hs?.meter ? { level: Math.max(0, chapterIndex - 1 + Math.min(1.15, springTo(chapterT, 1.4, 5))), n: episode.chapters.length, label: typeof hs.meter === "object" ? hs.meter.label : undefined } : null;
  const setProps = hs ? { preset, width, height, t, closeK, peekK, desk: !!hs.desk, deskLabel: typeof hs.desk === "object" ? hs.desk.label : undefined, revealAge, meter, character: episode.character } : null;

  const sfx = episode.sfx;
  const host = hostless ? null : (
        <Character
          preset={preset}
          name={episode.character}
          chapterKey={chapter.key}
          chapterT={chapterT}
          speaking={speaking}
          accentHit={accentHit}
          t={t}
          width={width}
          height={height}
          acting={acting}
          mouth={mouth}
        />
  );
  return (
    <AbsoluteFill style={{ background: preset.bg.bottom, fontFamily: preset.fontHud }}>
      <Audio src={staticFile(`episodes/${episodeId}/${episode.voice.file}`)} />
      {sfx && <Audio src={staticFile(`episodes/${episodeId}/${sfx}`)} volume={episode.music ? 1 : 0.7} />}
      <AbsoluteFill
        style={{
          transform: `translate(${camX}px, ${camY}px) rotate(${camRot}deg) scale(${Math.max(1.012, zoom + opening * 0.05)})`,
          transformOrigin: "50% 45%",
        }}
      >
        <AbsoluteFill style={{ transform: `translate(${sx * 0.12}px, ${sy * 0.12}px)` }}>
          <SetLayer preset={preset} t={t} width={width} height={height} beat={beat} focus={closeK} burst={acting.shotSeq} camX={camX} camY={camY} />
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            transform: `translate(${sx}px, ${sy}px) scale(${sScale * lerp(1, 1.08, closeK)})`,
            transformOrigin: "50% 40%",
            opacity: lerp(1, 0.22, closeK),
            filter: sBlur + closeK > 0.05 ? `blur(${sBlur + closeK * 10}px)` : undefined,
          }}
        >
          <Scene preset={preset} scene={chapter.scene} t={chapterT + lead} p={chapterP} width={width} height={height} words={episode.words.filter((w) => w.chapter === chapter.key)} chapterStart={chapter.t_start - lead} media={chapter.media} episodeId={episodeId} chapterDur={chapterDur + lead} />
        </AbsoluteFill>
        {hostSlide !== null ? (
          <AbsoluteFill style={{ transform: `translateY(${hostSlide}px)` }}>
            {setProps && <HostSet layer="back" {...setProps} />}
            {host}
            {setProps && <HostSet layer="front" {...setProps} />}
          </AbsoluteFill>
        ) : (
          <>
            {setProps && <HostSet layer="back" {...setProps} />}
            {host}
            {setProps && <HostSet layer="front" {...setProps} />}
          </>
        )}
      </AbsoluteFill>
      {/* accent flash: the accent colour blooms behind the caption */}
      {accentHit > 0 && (preset.caption.bloom ?? 1) > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% ${captionY(preset, closeK) * 100 + (preset.caption.anchor === "bottom" ? -3 : 3)}%, ${preset.accent} 0%, rgba(0,0,0,0) 55%)`,
            opacity: accentHit * 0.22 * (preset.caption.bloom ?? 1),
          }}
        />
      )}
      <HudLayer preset={preset} chapter={lead ? { ...chapter, t_start: chapter.t_start - lead } : chapter} chapters={episode.chapters} duration={episode.duration} p={chapterP} t={t} width={width} height={height} hide={closeK} series={episode.series} lang={episode.lang} />
      {/* opening: the title replaces the word-by-word captions, which resume with the block after it;
          it is drawn over the caption band */}
      <CaptionLayer preset={preset} block={open && blockIndex <= open.endIndex && blockIndex >= 0 ? null : block} blockIndex={blockIndex} t={t} width={width} height={height} closeK={closeK} />
      {open && episode.opening && t < open.end + 0.1 && <OpeningCard preset={preset} title={episode.opening.title} words={episode.words} span={open} t={t} width={width} height={height} hudBottom={hudBottom} place={episode.opening.place} dy={episode.opening.dy} />}
      {flash > 0 && <AbsoluteFill style={{ background: flashLook.color, opacity: flash * flashLook.strength }} />}
      {/* punchline hit: a one-frame-ish white kiss, much lighter than a chapter flash */}
      {hit > 0.6 && (preset.camera.hitFlash ?? 1) > 0 && <AbsoluteFill style={{ background: "#fff", opacity: Math.min(0.14, (hit - 0.6) * 0.35) * (preset.camera.hitFlash ?? 1) }} />}
    </AbsoluteFill>
  );
};
