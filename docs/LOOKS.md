# Looks: colours, set and style per episode or per series

A **format** says how an episode is written and structured. A **look** says what it looks like. They are independent:
two series of the same format can have two looks, and one look can serve several formats.

One look ships with the repo, as a worked example: `looks/video-factory.json`, the project's own flat poster look, used by the presentation episode `ep-001-made-by-ai`. It is the project's brand: build your own from `looks/_TEMPLATE.json`. An episode without a look renders with the base
preset (`presets/`), which is the engine default and nobody's identity. The first look is built with the user.

A look is one JSON file, `looks/<id>.json`: a partial preset laid over a base preset (`extends`, default `dark-2d`).
Only what differs is written. No code change, no registration: `tools/looks.py` resolves it and embeds it in episode.json.

| Key | Changes |
|---|---|
| `bg.top`, `bg.bottom` | wall gradient (keep dark or mid-tone: light backgrounds are not supported yet) |
| `bg.light`, `bg.light2` | the two drifting coloured lights, floor glow, close-up rays |
| `bg.grid`, `bg.gridColor`, `bg.dust`, `bg.grain`, `bg.floor`, `bg.spot`, `bg.vignette` | set dressing: grid, dust count, film grain, floor line on/off, spotlight and vignette strength |
| `bg.lights`, `bg.burst`, `bg.shadow` | strengths, default 1, 0 = off: the two drifting lights; the rays behind the face in a close-up; the soft drop shadows under the scene and the host (0 also removes the filter, which renders faster) |
| `caption.bloom`, `caption.glow`, `caption.softShadow`, `caption.titlePad` | strengths, default 1, 0 = off: the accent colour blooming behind the caption on an accented word; the glow around the accent word (captions and opening title); the blurred shadow under the outline of captions and title (0 keeps the hard outline only); the soft dark pad behind the opening title |
| `caption.titleBar`, `camera.hitFlash` | strengths, default 1, 0 = off: the accent bar that runs under the word being said in the opening title (a cover frame without it); the white flash over the whole frame on a punchline hit |
| `character.top`, `character.flat` | the host: `top` = colour of its top instead of the accent of the look (so the accent stays on the subject of the scene); `flat` 0..1 = how much of its shading goes (1 = flat fills on head, top and hands). A character reads them through its `look` prop (`src/layers/characters/Host.tsx`); a character that ignores the prop keeps its own drawing |
| `accent`, `accentAlt`, `textPrimary`, `textHud`, `lineColor` | accent word of the captions, HUD, lines |
| `fontKinetic`, `fontHud`, `fontMono` | caption/title font, HUD font, code font. Installed: Anton, Bebas Neue, Archivo Black, DM Serif Display, Inter, Space Grotesk, JetBrains Mono. Another font = one `@fontsource` import in `src/Root.tsx` + its name in `FONTS` (tools/looks.py) and `DISPLAY_WIDTH` (src/kit/tokens.ts) |
| `caption.*`, `hud.*`, `camera.zoom` | caption size and position, HUD sizes, camera push |
| `kit.color.*`, `kit.stroke.*`, `kit.radius.*`, `kit.depth` | style of every kit part: secondary colours, line weight, roundness, thickness of the slabs |
| `style` | names a drawing style whose own components build the set, captions and label (`docs/STYLES.md`) |

## When there is no look yet
The AI notices it (`python3 tools/looks.py` lists nothing) and proposes, it does not pick alone:
1. From the references of phase 0 (`episodes/<id>/references.md`, "Visual direction"), write 2 or 3 look directions
   in one line each: the mood in three words, wall colours, the two lights, the accent, the title font, thin or
   thick strokes, sharp or round corners. Make them really different (not three blues).
2. The user picks one, or describes another. Copy `looks/_TEMPLATE.json` to `looks/<id>.json` and fill only what
   differs from the base preset.
3. `python3 tools/looks.py` validates it; `python3 tools/looks.py preview <id>` renders the kit sheet in that look.
   Show the picture to the user and adjust on their words.
4. For a saga, store it once (`--series`, below). For a single episode, name it in the plan.

Checks on the preview before showing it: the accent word reads on the wall at 35 % scale; the accent and
`accentAlt` are not confused with a shelf colour (`docs/SHELVES.md`); mid-tone panels separate from the wall;
small labels are readable; the two lights do not wash the captions.

## Who decides the look (least to most specific)
1. the format: `"look": "<id>"` in `formats/<id>.json` (optional default);
2. the series: `series/<slug>/look.json`, a look object; `{"from": "<id>"}` starts from a shared look and overrides only what the saga changes. Every part of the saga gets it automatically;
3. the episode: `"look": "<id>"` or `{"from": "<id>", ...}` in plan.json, for a one-off or a special part.

One look per saga: two sagas of the same format can look completely different, the parts of one saga never do.

## Commands
- `python3 tools/looks.py`: list and validate.
- `python3 tools/looks.py preview <id>`: the kit sheet in that look (show it to the user before a new saga starts).
- `python3 tools/new_episode.py <id> --format <fmt> --look <id>`: one-off episode; with `--series`, the look is stored once for the saga.
- `python3 tools/looks.py apply episodes/<id>`: re-resolve after changing a look, without touching the timing. `build_episode.py` does it too.

## What follows the look, what does not
Follows: the set, lights, captions, HUD, every kit part, and any scene written with tokens (`const tk = kit(preset)`).
Does not follow: a scene whose colours are written as literals in the drawing, and the characters' own colours (skin, clothes).
Rule for new scenes: no colour, stroke width or radius written as a literal; take them from `tk` or `preset`. Episode-specific colours of a subject (a planet, an animal) are fine.

## A flat look (no light, no glow)
The base set is lit: drifting lights, spotlight, dust, soft shadows, a glow on the accent word. A look that wants a
flat, printed picture switches each of them off by data, without a style:
```json
"bg": {"top": "#16141F", "bottom": "#16141F", "lights": 0, "burst": 0, "shadow": 0, "dust": 0, "grain": 0, "spot": 0, "vignette": 0, "floor": false},
"caption": {"bloom": 0, "glow": 0, "softShadow": 0, "titlePad": 0, "titleBar": 0},
"camera": {"hitFlash": 0},
"character": {"top": "#3A3745", "flat": 1}
```
Every one of these keys is a strength: a value between 0 and 1 softens instead of removing. Without them an
episode renders exactly as before. With `titlePad: 0` and `softShadow: 0` the title and the captions rely on their
hard outline alone: check them on the stills over the brightest scene.

## A look is not a style
A look recolours and re-dresses the same drawing. When the user wants a picture that is BUILT differently (another
kind of set, of captions, of host, of subject drawing), a palette is not enough: read `docs/STYLES.md`.
