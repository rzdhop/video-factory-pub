# Kit: reusable animated parts (`src/kit/`)

Pure SVG React components for science, technical and absurd-fact motion-design episodes. No hook reads the frame:
the scene owns the timing and passes it down.

- `k` (0..1) = reveal progress. `k <= 0` draws nothing; entrances overshoot (never a linear fade).
- `t` (seconds) = idle motion. Always pass the scene `t` so nothing is ever frozen.
- `tk` = tokens (`const tk = kit(preset)`), optional: without it the tokens of the base preset are used.
- Coordinates are frame pixels (1080 x 1920). Box-like parts take `(x, y)` = top-left; round parts
  (Atom, Planet, Cell, Stamp) take the centre; text parts (CountUp, Formula) take the baseline.
- Catalogue: `npx remotion still src/index.ts KitSheet out/kit1.png --frame=120 --props='{"page":1}'` (page 2 for Flow + Nature).
  `python3 tools/looks.py preview <id>` renders the same sheet in a look.

Import everything from `"../../kit"` (from a scene file in `src/layers/scenes/`).

## Explain (`src/kit/Explain.tsx`)
- **Tag** `x y text k t color size anchor filled`: small pill with a pulsing dot; a status, a source, a date.
- **GlossaryChip** `x y term meaning k t color`: a jargon word and its 3-word meaning, the first time the word is said.
- **Callout** `x y lx ly text k t color size`: label at `(lx, ly)` tied by a drawn leader line to the point `(x, y)`; name a part of a drawing.
- **AnalogyPanel** `x y w h title k t morph to children`: side panel holding an everyday comparison; `morph` 0..1 shrinks it toward `to` (the real thing). Children origin = content top-left (content is `w - 32` by `h - 78`).
- **MiniMap** `x y w layers current k t rowH color`: vertical stack of named layers with one lit; "you are here" in a corner.
- **StepDots** `x y n current k t showCount color`: step n of N (`current` is 1-based).
- **Stamp** `x y text k t color size rot`: rotated verdict slammed with a squash (FALSE, VERIFIED). Run `k` over about 0.4 s.

## Data (`src/kit/Data.tsx`)
- **CountUp** `x y from to k t unit decimals size color label anchor`: number counting with the separators of the episode's language; the one figure of the chapter.
- **AxisPlot** `x y w h fn|points xRange yRange k t xLabel yLabel color dot dotAt valueLabel ticks fill`: axes and a curve drawn along `k`, dot on the tip (or at `dotAt` 0..1) with a value label.
- **BarRow** `x y w rows[{label,value,color?,display?}] max k t rowH unit decimals`: compare 2 to 5 quantities; height = `rows * rowH`.
- **Formula** `x y tokens k t size highlight color anchor`: inline maths from `F.text`, `F.sub`, `F.sup`, `F.frac`; `highlight` = index of the term being explained.
- **Scale** `x y w a b k t rowH showRatio`: two lengths at the same scale with the ratio ("x 3.7"); height = `2 * rowH`.
- **Timeline** `x y w events[{date,label}] k t current color`: dated ticks revealed along the line; `"\n"` in a label for a second line; 5 events max at full width.

## Flow (`src/kit/Flow.tsx`, paths in `src/kit/path.ts`)
- **Arrow** `from to bend k t color width head flow label`: straight (`bend` 0) or curved arrow, head rides the tip; `flow` = marching dashes.
- **Packet** `path k t color r trail`: glowing dot with a trail at position `k` of a `PathFn` (`linePath`, `curvePath`, `polyPath`); loop with `k = (t * 0.5) % 1`.
- **Block** `x y w h label sub color k t active`: labelled slab (layer, server, step) with light and shadow side; `active` = pulsing accent frame.
- **Win** `x y w h title k t id children`: generic app window, children clipped to the content area (origin = its top-left, `w` by `h - 52`).
- **CodeLines** `x y w lines k t highlight size numbers illustratif`: code typed along `k` with a caret; `illustratif` adds the tag for code that is not real.
- **ByteRow** `x y bytes k t perRow size highlight color`: hex bytes printed one by one; `highlight = [first, last]` frames a range.

## Nature (`src/kit/Nature.tsx`)
- **Atom** `x y r electrons k t color nucleusColor speed`: nucleus and electrons on tilted orbits.
- **Wave** `x y w amp freq speed k t standing axis color width`: travelling or standing sine (`freq` = cycles across `w`, `speed` = cycles per second).
- **Planet** `x y r color k t ring ringColor light bands id`: sphere with terminator shading and drifting bands; `light` = angle the light comes from.
- **Cell** `x y r k t color nucleusColor organelles`: cell with a wobbling membrane, nucleus and organelles.
- **Particles** `x y w h n k t color colors seed speed size`: deterministic drifting dots; back plane of any scene.

## Tokens (`src/kit/tokens.ts`)
`kit(preset)` returns the values of the base preset, changed by the look of the episode (`docs/LOOKS.md`):
- `font`: `display` (Anton), `ui` (Inter 600), `mono` (JetBrains Mono 500).
- `color`: `ink`, `panel`, `panelLight`, `panelDark` (mid-tones derived from `preset.bg.top`), `text`, `textDim`, `line`, `grid`, `accent`, `accentAlt`, `cyan`, `green`, `violet`, `pink`, `steel`.
- `stroke`: `thin` 3, `base` 5, `bold` 8. `radius`: `sm` 8, `md` 14, `lg` 22. `size`: `small` 22, `label` 26, `body` 30, `title` 40, `big` 96. `depth`: 8.
- `lang`: the language of the episode, for `fmtNum`.
- Helpers: `shade(hex, amt)`, `alpha(hex, a)`, `textW(text, size, font)`.

Motion helpers (`src/kit/anim.ts`): `pop`, `seg(k, a, b)`, `stagger(k, i, n, span)`, `pulse(t, hz)`, `at(t, when, d)`, `ramp(t, when, d)`, `fmtNum(n, decimals, lang)`, plus the re-exports of `src/motion.ts`.

## Example scene

```tsx
import React from "react";
import type { Preset } from "../../types";
import { kit, at, ramp, curvePath, Block, Packet, GlossaryChip, Particles } from "../../kit";
type Box = { x: number; y: number; w: number; h: number; cx: number; cy: number };
export const StackScene: React.FC<{ preset: Preset; t: number; p: number; box: Box; b: (word: string) => number }> = ({ preset, t, box, b }) => {
  const tk = kit(preset);
  const path = curvePath([box.cx, box.y + 150], [box.cx, box.y + 560], 0.35);
  return (
    <g>
      <Particles x={box.x} y={box.y} w={box.w} h={box.h} t={t} tk={tk} />
      <Block x={box.cx - 260} y={box.y + 90} w={520} h={110} label="Application" k={at(t, 0.1)} t={t} tk={tk} />
      <Block x={box.cx - 260} y={box.y + 520} w={520} h={110} label="Kernel" sub="privileged mode" active={t > b("kernel")} k={at(t, b("kernel"))} t={t} tk={tk} />
      {t > b("call") && <Packet path={path} k={ramp(t, b("call"), 1.2)} t={t} tk={tk} />}
      <GlossaryChip x={box.x + 20} y={box.y + 300} term="Syscall" meaning="ask the kernel" k={at(t, b("call"), 0.6)} t={t} tk={tk} />
    </g>
  );
};
```
`b("word")` is the time of the first block of the chapter containing that word of the narration. The example places
its parts from `box`; a real scene also scales its offsets with `box.h` so it survives another layout.

## Rules learned the hard way
- **Size for a phone.** A row of five boxes across the host layout leaves labels of 18 to 25 px, too small to read. Write the one thing to read large (the number alone in the box, its name small above), show a close view of three boxes when the whole row is not the point, and give an episode its own tokens with larger small texts when it needs them.
- **Shared placements live in the shared file.** A position used by two scenes of an episode is a constant of `<EpNNN>_shared.tsx`, never two mirrored constants.
- **Blur is slow.** A scene full of blur glows can multiply the render time by three or more: glows are stacked translucent circles, and blur filters stay at two per scene at most.
- **A part drawn twice moves to the kit.**

## Limits
- Text widths are estimated (`textW`), not measured: leave a margin around long labels; Formula uses the mono font so its layout is exact.
- No automatic wrapping; labels stay on one line (Timeline accepts `"\n"`).
- `Win` and `Planet` use a clipPath id derived from their position and size: pass `id` when two instances share the same spot.
- No blur filters in the kit parts: glows are stacked translucent circles.
