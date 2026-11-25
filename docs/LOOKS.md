# Looks: colours, set and style per episode or per series

A **format** says how an episode is written and structured. A **look** says what it looks like. They are independent:
two series of the same format can have two looks, and one look can serve several formats.

No look ships with the repo: `looks/` holds only `_TEMPLATE.json`. An episode without a look renders with the base
preset (`presets/`), which is the engine default and nobody's identity. The first look is built with the user.

A look is one JSON file, `looks/<id>.json`: a partial preset laid over a base preset (`extends`, default `dark-2d`).
Only what differs is written. No code change, no registration: `tools/looks.py` resolves it and embeds it in episode.json.

| Key | Changes |
|---|---|
| `bg.top`, `bg.bottom` | wall gradient (keep dark or mid-tone: light backgrounds are not supported yet) |
| `bg.light`, `bg.light2` | the two drifting coloured lights, floor glow, close-up rays |
| `bg.grid`, `bg.gridColor`, `bg.dust`, `bg.grain`, `bg.floor`, `bg.spot`, `bg.vignette` | set dressing: grid, dust count, film grain, floor line on/off, spotlight and vignette strength |
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

## A look is not a style
A look recolours and re-dresses the same drawing. When the user wants a picture that is BUILT differently (another
kind of set, of captions, of host, of subject drawing), a palette is not enough: read `docs/STYLES.md`.
