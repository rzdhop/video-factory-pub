# Engine contract (plan.json / episode.json fields)

All fields are optional; an episode without them renders with the defaults.

## plan.json
- `"format": "<id>"`: one of `formats/*.json` (the default is `DEFAULT` of `tools/formats.py`). `tools/build_episode.py` copies it to episode.json.
- `"lang": "fr" | "en"`: language of the video (`docs/LANGUAGE.md`), written by `tools/new_episode.py`. `tools/build_episode.py`
  resolves it (plan, saga, brand, else the default of `tools/lang.py`), uses the matching espeak voice for the reference timing and writes
  `lang` (and `voice.lang`) in episode.json. The engine puts it on the preset (`preset.lang`, `tk.lang`): HUD counters
  and kit numbers use `fmtNum` (`2 500` / `2,500`), the series badge reads `PARTIE` / `PART`.
- `"layout": 2`: layout version, copied to episode.json. `tools/new_episode.py` writes it in every new plan.
  Without it the episode uses the legacy layout 1. See "Layout versions and safe zones" below.
- `"character": "none"`: hostless layout: no Character, no HostSet, no close-ups (acting `closeK` forced to 0).
  The scene takes the frame (scene box 0.205 to 0.74 of the height, under the HUD) and the captions sit over its
  lower part (bottom edge at 0.73) on a soft dark band (`caption.band`), above the bottom 22 % that the platform
  UI covers. There is no voice oscilloscope: nothing is drawn under the scene.
  A hostless episode always uses layout 2, then the `hostless` block of that layout.
  Any other value is a registered character (`host`, the template, or one created with `characters/README.md`); every format accepts a host.
- `"series": {"slug": "<series>", "part": 2, "total": 5, "title": "<series title>"}`: copied to episode.json.
  The HUD shows a `PART 2/5` badge (`PART 2` when `total` is missing). The series bible lives in `series/<slug>/`.
- `chapters[].media: [...]` with `chapters[].scene = "media"`: montage scene built from files:
  `{"src": "assets/<file>", "kind": "image"|"video", "word"?: "<word of the chapter where this item starts>",
    "fit"?: "cover"|"contain", "motion"?: "push"|"pull"|"pan-left"|"pan-right"|"none",
    "start"?: <seconds into the source video>, "credit"?: "<author / source / licence>"}`
  Items play in order; an item without `word` starts when the previous one ends (equal split of the remaining time).
  `src` is relative to `episodes/<id>/` (so the file is copied to `public/episodes/<id>/` with the rest).
  Video items are muted. `credit` is a small tag in the top-left corner of the frame while the item is on screen.
  The frame is as wide as the scene box; in the hostless layout it runs past the box down to
  `hostless.sceneBox.mediaBottom` (0.79) and is capped at 4:5 (about 4:4.75 with the default values). `fit: "contain"` never shows black bars:
  a blurred, enlarged copy of the same picture (image or video) fills the frame behind it.
  `chapters[].media` is copied to episode.json by `tools/build_episode.py`.
- `"look": "<id>"` or `{"from": "<id>", ...overrides}`: colours, set, fonts and kit style, see `docs/LOOKS.md`. Resolved (format < series < episode) and embedded in episode.json as `look` by `tools/build_episode.py` or `tools/looks.py apply`.
- `"retime": {"intro_after": "<word>", "intro_blocks": 2, "pauses": [{"chapter", "word", "add": 0.3}]}`: `tools/retime.py` moves a signature intro after the hook line and adds comic pauses, at no voice cost.
- `"direction": [{"chapter", "word", "emotion"?, "shot"?, "gesture"?}]`: acting of the host from that word on.
  emotion `idle|happy|wink|curious|confused|amazed|panic|deadpan|smug` · shot `bust|close|peek` · gesture `wave|point|shrug|balance`.
  A `close` holds until the next direction entry. Blocks without direction are guessed by `tools/direct.py`.
- `"music": {"bpm": 100, "level_db": -15, "sections": {"<chapter>": "intro|full|half|outro|none"}}`.
- `chapters[].transition`: `whip-left | whip-right | whip-up | zoom | flash` (default: rotates).
- `"sound_kit": "<id>"` and `sfx_events`: `docs/SOUND.md`.
- `"tts"`, `"voices"`: voice override for one episode and extra speakers of a dialogue (`tools/voice.py`).
- `"brand"`, `"shelf"`: `tools/brands.py`, `tools/shelf.py`.

## Hook-first opening (`opening`)
Most viewers decide in the first second, and frame 0 is also the cover of the video. Without `opening`, frame 0 of
an episode is a poor picture: `src/layers/Scene.tsx` fades every scene in from its local time 0 (opacity 0 at
frame 0, for 0.08 s), the HUD label drops in over 0.25 s, the captions come one word at a time (the first word is
still transparent at frame 0), and when `acting` opens on a close-up the scene is dimmed to 22 % and blurred behind
the face. `opening` fixes the first seconds:

`"opening": {"title": "THE EARTH IS | A SPINNING *TOP*", "until": "<word>", "host": "bust"}` (plan.json, copied as it
is to episode.json by `tools/build_episode.py`; types: `Opening` in `src/types.ts`).
- `title` (required): the hook sentence as it is read at a glance: what is said in the first seconds, or a tighter
  written version of it. 1 to 3 lines separated by ` | `, at most about 5 words per line, exactly one accent word
  between asterisks. Every line is sized on its own to fill the width inside the 8 % side margins, so a short line
  is set bigger: up to about 12 characters a line gets the largest type (185 to 250 px by number of lines), at 18
  characters it is about 115 px. No line is set more than 1.6 times bigger than the smallest one.
- `until` (optional): a word of the first chapter. The opening lasts from frame 0 to the END of the first block of
  that chapter containing it. Default: the end of the first sentence (first block whose text ends with `.`, `!`
  or `?`). Never more than 4 s: beyond, it ends with the last block that finishes before the cap.
- `place` (optional): `"caption"` (default, the title stands on the caption line) or `"below"` (the title hangs
  from the bottom quarter of the scene box down to the bottom safe line, so the whole scene stays visible at frame 0;
  made for `host: "hidden"`, where that band is empty).
- `host` (optional): `"bust"` (default: the host is there, in bust framing) or `"hidden"` (the host and its set
  wait under the frame and slide in when the title leaves). Ignored without a host.

What the engine does while the opening lasts (`src/Episode.tsx`, `src/layers/OpeningCard.tsx`):
1. No close-up, no peek: every `acting` state that starts before the end of the opening is played as a bust shot
   (emotions and gestures are kept), so the scene is whole and bright.
2. The whole title is on screen at frame 0, without fade and without word-by-word: only a scale settle (1.06 to 1
   in 0.2 s). Font `fontKinetic`, heavy outline, accent word in the accent colour, a soft dark pad behind it.
   It sits where the captions sit and grows away from them: bottom edge just above the caption line (`caption.y`
   with `anchor: "bottom"`; one caption line under `caption.y` in the legacy layout; top edge at `caption.y` and
   growing down when the preset has `caption.position: "top"`). It never goes above the HUD of the first chapter,
   never below 78 % of the height, and stays inside the central 3:4 crop of the frame (12.5 % to 87.5 % of the
   height: what a profile grid shows of a cover); the type shrinks when the room is short.
3. The word-by-word captions are off for the blocks of the opening. A small accent bar under the title runs from
   word to word with the voice (the word being said also gets a small kick). A title word that is spoken as such
   takes the time of that spoken word; the words of a rewritten title are spread between their neighbours.
4. The title pops out in 0.12 s around the end of the opening; the captions resume with the next block.
5. Frame 0 is a complete picture: the scene and the HUD of the first chapter are drawn as if the chapter had started
   0.6 s earlier (entrance fade and slide already over); the word beats of the scene keep their real times.

A greeting or a signature of the host comes after the hook sentence, never before it. `tools/lint_plan.py` checks
the block (lines, words per line, accent, `until`, greeting first) and warns when a `layout: 2` plan has no opening.
Works in layout 2 (host and hostless) and in the legacy layout.

Cover: `python3 tools/cover.py <id> [--frame N] [--out out/<id>.cover.jpg]` renders the opening frame at full
resolution (default: frame 6 at 30 fps, the first one after the settle) and writes `<id>.cover.grid.jpg` next to it,
the 1080x1440 centre crop a profile grid shows. It refuses when the episode has no `opening`.
(`tools/master.sh` still writes its own `.cover.jpg` from the frame at 1.5 s of the master: use the one of
`tools/cover.py` for an episode with an opening.)

## Layout versions and safe zones
The platform UI of a 9:16 short covers about the top 12 %, the bottom 22 % and, below mid-height, the right 14 %
(buttons column). Layout 2 keeps what must be read or seen out of those bands. Layout 1 is the first layout of the
engine, kept for episodes drawn with fixed pixel offsets; new episodes use layout 2.

The layout is data: the top level of `presets/<name>.json` holds the legacy values, and `layouts.2` is a partial
preset laid over it. `src/Episode.tsx` (`resolveLayout`) resolves it once: preset < `layouts.<n>` < its `hostless`
block when `character` is `"none"` < the keys the look sets itself (`textHud`, `hud`, `sceneBox`, `caption`, `host`).
A look may also set `layouts.2.*` or `hostless.*`. Values of `dark-2d`, as fractions of the height:

| Key | Layout 1 (legacy) | Layout 2, host | Layout 2, hostless | What it places |
|---|---|---|---|---|
| `hud.y` | 0.075 | 0.142 | 0.142 | top of the label row; the progress bar is `hud.barAbove` px above (34 / 30 px: 0.126 in layout 2), the counter (78 / 68 px) ends near 0.20 in layout 2 |
| `hud.badge` | above the bar | `"inline"` | `"inline"` | series badge: first item of the label row in layout 2 |
| `textHud` | 0.72 white | 0.9 white | 0.9 white | HUD label (30 px) |
| `sceneBox.top` / `.bottom` | 0.17 / 0.63 (883 px) | 0.20 / 0.60 (**768 px**) | 0.205 / 0.74 (1027 px) | the box given to the scenes, 920 px wide |
| `caption.anchor`, `caption.y` | top edge at 0.635 | bottom edge at 0.58 | bottom edge at 0.73 | caption block; with `anchor: "bottom"` a second line grows upward |
| `caption.band` | none | none | 0.6 | soft dark band behind the captions |
| `host` (`x`, `eyeY`, `scale`, `propScale`) | none: head centre 330 px above the bottom, scale 1 | 260 px, 0.685, 0.8, 0.72 | no host | bust framing: with the camera push the eyes sit near 0.705 and the chin near 0.80; the body runs below |
| `caption.closeY`, `caption.closeBand` | none | 0.74, 0.5 | unused | close-ups: the face fills about 20-60 % of the height, the captions slide under the chin on a light band, the chest detail of the host fades out (`pendant` prop of the character) |

Rules for scenes built for layout 2 (host): the box is 920 x 768 px (y 384 to 1152 at 1920). Place everything from
`box` (`box.y`, `box.h`), never from fixed pixel offsets: a scene drawn with fixed offsets for one box height is cut
under another. The captions sit over the bottom of the box: one line covers its last 170 px, two lines its last
220 px, and the last 120 px fade out anyway, so nothing that must be seen goes in the bottom quarter of the box.
Two caption lines climb onto anything drawn below half of the box: keep what must be read above that line.
Host-set props in layout 2: the props are parked left of 0.84 of the width and above 0.755 of the height at
`host.propScale`; the desk follows the host's framing (`src/layers/HostSet.tsx`).

Close-ups rotate through four framings (centre, left tilt, right tilt, extreme) with a turning burst of rays behind
the face. A sound event with gain 0.4 or more triggers a close-up when nothing directs the block: set `shot: "bust"`
on every word whose scene must be read.

## formats/<id>.json
`id, name, status (validated|new), summary, production (code|montage|ai), default_character, preset,
duration_s {min,target,max}, words {min,max}, chapters {min,max}, tone {register, vulgarity (none|light|max), insults},
music {bpm, level_db}, big_sfx_every_s [min,max], voice {provider, voice, voice_id, model, tags[]},
ending (question|free), gates[], agents[], sheet`.
The writing and visual rules of a format are in `formats/<id>.md`, which follows `formats/_TEMPLATE.md`.

## Timing limits the checks enforce
- A caption block counts at most 4 words (`tools/lang.py` says which words count).
- A block shorter than 0.35 s after `tighten_voice.py` fails `tools/validate_episode.py`: write blocks of 3 words or more around very short ones from the start; otherwise merge them in script.md and re-run `build_episode` → `align_audio` → `align_words` → the chain.
- `tools/build_sfx.py` keeps one music stop per punchline: stops closer than 2.5 s are merged (retime pauses win).
