import type React from "react";
import type { Preset } from "../types";
import type { BackgroundProps } from "../layers/Background";
import type { CaptionsProps } from "../layers/Captions";
import type { HudProps } from "../layers/Hud";
import type { HostProps } from "../layers/characters/Host";

/** Drawing styles: the extension point for a look that needs more than colours and fonts.
 *
 *  A look (looks/<id>.json) restyles the default layers through the preset. When that is not enough (another way
 *  of drawing the set, the captions, the label, the opening title or the host), write a style:
 *    1. create `src/styles/<name>/` with the layers you replace; each one takes the same props as the default
 *       layer it replaces (Background, Captions, Hud) and reads its colours from the preset or from `kit(preset)`;
 *    2. register it below under an id: `STYLES["my-style"] = { Set: MySet, Captions: MyCaptions }`;
 *    3. name it in the look: `"style": "my-style"`.
 *  Every field is optional: a layer the style does not give keeps the default drawing. The engine ships with no
 *  style; an unknown id falls back to the default layers. */
export type StyleDef = {
  /** replaces src/layers/Background.tsx */
  Set?: React.FC<BackgroundProps>;
  /** replaces src/layers/Captions.tsx */
  Captions?: React.FC<CaptionsProps>;
  /** replaces src/layers/Hud.tsx */
  Hud?: React.FC<HudProps>;
  /** own drawing of a host, by character id; used only when the look also sets `styleHost: true` */
  hosts?: Record<string, React.FC<HostProps>>;
  /** true: the host is never shown in close-up, every acting state is played as a bust shot */
  noCloseUps?: boolean;
  /** colour and strength (0..1) of the flash of a "flash" chapter cut (default: white, 1) */
  flash?: (preset: Preset) => { color: string; strength: number };
  /** opening title (src/layers/OpeningCard.tsx): font weight, text shadow of the plain and of the accent words,
   *  colour of the accent word, and `flat: true` for a title without the lean and the pop-out */
  title?: {
    weight?: number;
    shadow?: (preset: Preset, accent: boolean) => string;
    accentColor?: (preset: Preset) => string;
    flat?: boolean;
  };
};

export const STYLES: Record<string, StyleDef> = {
  // "my-style": { Set: MySet, Captions: MyCaptions, Hud: MyHud },
};

/** Style named by the preset (`style`, set by a look), or undefined for the default drawing. */
export const styleOf = (preset: Pick<Preset, "style">): StyleDef | undefined => (preset.style ? STYLES[preset.style] : undefined);
