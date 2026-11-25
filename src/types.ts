export type Lang = "fr" | "en";
export type Counter = { kind: string; start: number; end: number; unit?: string };
/** One item of a montage chapter (scene "media"): a file under episodes/<id>/, see docs/ENGINE_CONTRACT.md. */
export type MediaItem = {
  src: string; kind?: "image" | "video";
  /** word of the chapter where this item starts; without it the item starts when the previous one ends */
  word?: string;
  fit?: "cover" | "contain"; motion?: "push" | "pull" | "pan-left" | "pan-right" | "none";
  /** seconds into the source video */
  start?: number; credit?: string;
};
export type Opening = { title: string; until?: string; host?: "bust" | "hidden"; place?: "caption" | "below"; /** px (at 1920 high) added to the top of a `place: "below"` title */ dy?: number };
export type Series = {
  slug: string;
  part: number;
  total?: number;
  title?: string;
  /** replaces the "PARTIE n/total" badge text, e.g. "HORS-SÉRIE" for a special episode between two parts */
  badge?: string;
};
export type Chapter = { key: string; label: string; scene: string; hud: { counter?: Counter; stats?: string[] }; transition?: TransitionKind; media?: MediaItem[]; t_start: number; t_end: number };
export type WordBlock = { text: string; t_start: number; t_end: number; accent: string | null; chapter: string };
export type Emotion = "panic" | "confused" | "curious" | "amazed" | "idle" | "happy" | "wink" | "deadpan" | "smug";
export type Shot = "bust" | "close" | "peek";
export type GestureKind = "wave" | "point" | "shrug" | "balance" | "none";
export type TransitionKind = "whip-left" | "whip-right" | "whip-up" | "zoom" | "flash";
/** One acting state of the host (written by tools/direct.py): holds from t to t_end. */
export type Acting = { t: number; t_end: number; emotion: Emotion; shot: Shot; gesture: GestureKind };
export type Episode = {
  /** `character: "none"` = hostless layout (no host, the scene takes the frame, captions over its lower part) */
  id: string; title: string; preset: string; character: string; fps: number;
  /** layout version: missing or 1 = legacy layout (episodes made before the safe zones), 2 = safe-zone layout */
  layout?: 1 | 2;
  /** id of formats/<id>.json (informative for the engine) */
  format?: string;
  /** hook-first opening (docs/ENGINE_CONTRACT.md): the hook sentence stands on screen from frame 0 as a giant
   *  caption (`title`: lines separated by ` | `, one *accent* word) up to the end of the block containing `until`
   *  (default: end of the first sentence, at most 4 s); no close-up meanwhile; `host` "hidden" slides the host in
   *  when it ends (default "bust") */
  opening?: Opening;
  /** language of the video (docs/LANGUAGE.md, written by tools/build_episode.py); missing = "fr".
   *  Drives the number format of the HUD counters and kit parts and the word of the series badge. */
  lang?: Lang;
  /** part of a series: the HUD shows a PARTIE n/total badge (PART n/total in English) */
  series?: Series;
  voice: { file: string; lang: string; engine?: string };
  duration: number; chapters: Chapter[]; words: WordBlock[];
  sfx?: string;
  /** resolved look (tools/looks.py): colours, lights, fonts and kit style of this episode or of its series */
  look?: Look;
  /** per-frame voice measurements (tools/voice_envelope.py) */
  mouth?: { open: number[]; wide: number[] };
  acting?: Acting[];
  /** written by tools/build_sfx.py: tempo of the music bed and the punchline stops */
  music?: { bpm: number; stops: number[] };
  /** optional set around the host: a desk in front (`label` = text of its front plate), a dial that climbs one
   *  notch per chapter (`label` = its caption), and a reveal on a word (desk thrown out, toilet pops in) */
  host_set?: { desk?: boolean | { label?: string }; meter?: boolean | { label?: string }; reveal?: { chapter: string; word: string } };
};
/** Optional style of the kit parts, set by a look (see src/kit/tokens.ts for the defaults). */
export type KitStyle = {
  color?: Partial<Record<"ink" | "panel" | "panelLight" | "panelDark" | "grid" | "cyan" | "green" | "violet" | "pink" | "steel", string>>;
  stroke?: Partial<Record<"thin" | "base" | "bold", number>>;
  radius?: Partial<Record<"sm" | "md" | "lg", number>>;
  depth?: number;
};
/** Optional parts of the set, set by a look: floor line on/off, spotlight strength 0..1, vignette strength, grid.
 *  `lights` = strength of the two drifting coloured lights (default 1, 0 = none); `burst` = strength of the rays
 *  behind a close-up (default 1, 0 = none); `shadow` = strength of the soft drop shadows under the scene and the
 *  host (default 1, 0 = none). */
export type BgStyle = { grid?: boolean; gridColor?: string; floor?: boolean; spot?: number; vignette?: number; light?: string; light2?: string; dust?: number; lights?: number; burst?: number; shadow?: number };
type BasePreset = typeof import("../presets/dark-2d.json");
/** Caption extras (all optional, set by a layout or a look):
 *  `anchor` "bottom" = `y` is the BOTTOM edge of the caption block, a second line grows upward (default: top edge);
 *  `band` 0..1 = strength of the soft dark band drawn behind the captions (0 or missing: none);
 *  `closeY` / `closeBand` = where the captions go during a close-up of the host and how strong the band gets there;
 *  `bloom` = strength of the accent bloom behind the caption on an accented word (default 1, 0 = none);
 *  `glow` = strength of the glow of the accent word, captions and opening title (default 1, 0 = none);
 *  `softShadow` = strength of the blurred shadow under the outline of captions and title (default 1, 0 = hard outline only);
 *  `titlePad` = strength of the soft dark pad behind the opening title (default 1, 0 = none);
 *  `titleBar` = the accent bar that runs under the word being said in the opening title (default 1, 0 = none). */
export type CaptionStyle = BasePreset["caption"] & { anchor?: string; band?: number; closeY?: number; closeBand?: number; bloom?: number; glow?: number; softShadow?: number; titlePad?: number; titleBar?: number };
/** HUD extras: `barAbove` px between the progress bar and the label row (default 34); `badge` "inline" puts the
 *  series badge in the label row (default: above the progress bar); `square` = square dot. */
export type HudStyle = BasePreset["hud"] & { barAbove?: number; badge?: string; square?: boolean };
/** Scene box extras: `mediaBottom` = how far down (fraction of the height) a montage frame may run past the box. */
export type SceneBox = BasePreset["sceneBox"] & { mediaBottom?: number };
/** Safe-zone bust framing of the host: head x in px, eye line as a fraction of the height, scale of the drawing,
 *  scale of the props next to the host. Without this block the host keeps the legacy framing (layout 1). */
export type HostFraming = { x: number; eyeY: number; scale: number; propScale?: number };
/** Layout of episodes without a host, laid over `sceneBox` / `caption`. */
export type HostlessLayout = { sceneBox?: Partial<SceneBox>; caption?: Partial<CaptionStyle> };
/** One layout version (preset `layouts.<n>`): a partial preset laid over the base one, see docs/ENGINE_CONTRACT.md. */
export type LayoutOverride = {
  textHud?: string; hud?: Partial<HudStyle>; sceneBox?: Partial<SceneBox>; caption?: Partial<CaptionStyle>;
  host?: HostFraming; hostless?: HostlessLayout;
};
/** Camera extras: `hitFlash` = strength of the white flash on a punchline hit (default 1, 0 = none). */
export type CameraStyle = BasePreset["camera"] & { hitFlash?: number };
export type Preset = Omit<BasePreset, "bg" | "caption" | "hud" | "sceneBox" | "layouts" | "camera"> & {
  camera: CameraStyle;
  bg: BasePreset["bg"] & BgStyle; caption: CaptionStyle; hud: HudStyle; sceneBox: SceneBox;
  host?: HostFraming; hostless?: HostlessLayout; layouts?: Record<string, LayoutOverride>; kit?: KitStyle;
  /** set by a look: `top` = colour of the host's top instead of the accent, `flat` 0..1 = how much of the host's
   *  shading goes (1 = flat fills). A character reads them through its `look` prop; missing = its own drawing. */
  character?: { top?: string; flat?: number };
  /** drawing style set by a look: an id registered in src/styles/index.ts, which switches the builders of the
   *  set, captions, label, opening title and host. Missing or unknown = the default drawn style. */
  style?: string;
  /** with a `style`: true = the host is drawn by that style (its `hosts.<character>`). Default false: normal drawing. */
  styleHost?: boolean;
  /** language of the episode, set by resolveLayout so scenes and kit parts read it from the preset they already get */
  lang?: Lang;
};
/** Partial preset laid over a base preset (looks/<id>.json, embedded in episode.json by tools/looks.py). */
export type Look = { id: string; extends?: string; description?: string } & { [K in keyof Preset]?: unknown };
export type EpisodeProps = { episodeId: string; episode: Episode | null; presetOverride?: string | null };
