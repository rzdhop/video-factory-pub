<p align="center"><img src="docs/brand/banner.png" alt="video-factory: an open engine and rulebook for AI-made short videos" width="100%"></p>

# video-factory

<img src="docs/media/presentation.gif" alt="The presentation video, made with this engine" width="240" align="right">

An engine that renders vertical explainer videos (9:16) from a script, entirely in code (Remotion, React, Python, ffmpeg), and a working method for making them with Claude: phases, gates, checks and agents.
It ships almost empty of content: one template host, one demo episode, and the project's own presentation video with its look. The videos made with it are yours.

**The presentation video** on the right was made with this repo, from the brief to the render: [watch it with sound](docs/media/presentation.mp4) (29 s). Its sources are in `episodes/ep-001-made-by-ai/` (script, fact check, critique, stills review, plan) and `src/layers/scenes/Ep001_*.tsx`; its look is `looks/video-factory.json`. A person picked the idea, agreed to the voice cost and said yes before it was posted; the rest was done by the AI and its agents. Voice: ElevenLabs, voice "River". Sound: "Slate Board.wav" by 190175, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).

<br clear="right">

## Requirements
- Node 22 and npm
- Python 3.10 or later
- `ffmpeg` and `espeak-ng` on the path
- Chrome or Chromium (used by Remotion to render)
- About 1.1 GB of disk for the sound-check models

## Install
```bash
git clone https://github.com/rzdhop/video-factory-pub.git video-factory && cd video-factory
npm install
pip install numpy librosa soundfile
# Debian / Ubuntu: sudo apt-get install espeak-ng ffmpeg
bash tools/setup_sound.sh          # sound-check tool and its models, about 1 min
export VF_CHROME=/path/to/chrome   # optional: browser used for the render
export VF_CONCURRENCY=2            # optional: frames rendered in parallel
```
`VF_CHROME` and `VF_CONCURRENCY` are read by `remotion.config.ts`. Without them it takes the first Chrome or Chromium it finds at a usual path (else the browser Remotion downloads itself) and the number of cores, at most 2.

## Try the demo
`episodes/ep-000-demo` is a tiny English episode with a placeholder voice made by espeak. It needs no account and no credit.
```bash
bash tools/check.sh ep-000-demo            # scenes, plan, timing, sound
python3 tools/stills.py ep-000-demo        # review sheet of stills in out/
bash tools/render.sh ep-000-demo draft     # short draft video in out/
```
`bash tools/selftest.sh` rebuilds and checks the same episode after an engine change.

## Make it yours
The settings files are placeholders. Fill them when the step needs them; `CLAUDE.md` tells Claude to notice what is empty and to propose creating it.

| File | What to put there | Needed for |
|---|---|---|
| `looks/<id>.json` (from `looks/_TEMPLATE.json`) | colours, set, lights, fonts, kit style | a look of your own (`docs/LOOKS.md`, `docs/STYLES.md`) |
| `src/layers/characters/<Name>.tsx` (from `Host.tsx`) | your host character | a hosted video (`characters/README.md`) |
| `voices/catalog.json`, `characters/voices.json` | your voices (`voice_id`) and which character speaks with which | a real voice instead of the placeholder |
| `brands/brands.json` | your scheduler brand id, handles, time zone, language, weekly target, connector accounts; then status `active` | scheduling and measuring (`docs/PUBLISH.md`) |
| `brands/shelves.json` | the shelves of your profile (label, colour, hashtag) | covers and captions (`docs/SHELVES.md`) |
| `docs/CONNECTORS.md` | which connector account serves which service | any call to an outside service |
| `ideas/backlog.md`, `ideas/follow_lines.md` | your subjects and the follow lines already used | planning the week |
| `series/<slug>/` (from `series/_BIBLE_TEMPLATE.md`) | the bible of a saga | multi-part work |

## How it works
`script.md` + `plan.json` → `tools/build_episode.py` (reference timing with espeak, `episode.json`) → the real voice → `tighten_voice.py` → `polish_voice.sh` → `align_audio.py` (and `align_words.py` when a transcript exists) → `retime.py` → `voice_envelope.py` → `direct.py` → `build_sfx.py` → `tools/render.sh` → `tools/master.sh` (−14 LUFS) → `tools/contact_sheet.sh` and `tools/sound_check.py`.
Re-run the steps from `retime.py` on after any change to the timing. `tools/check.sh <id>` runs the checks; `tools/lint_plan.py` runs before any voice credit is spent.

Adding a scene: export `<NAME>_SCENES` and `<NAME>_CAMERA` from a file of `src/layers/scenes/`, run `python3 tools/gen_scenes.py` (it writes the registry; nothing is registered by hand), name the scene in `plan.json` `chapters[].scene`.
plan.json fields: `docs/ENGINE_CONTRACT.md`. Optional blocks: `opening` (hook card at frame 0), `retime` (comic pauses, intro moved after the hook), `direction` (emotion, shot and gesture of the host per word), `music` (bpm, level, sections per chapter), `chapters[].transition`, `sound_kit`, `series`, `look`, `lang`.

## Repo map
| Folder | Holds |
|---|---|
| `src/` | the engine: `Episode.tsx` (compositor), `layers/` (set, scene, character, HUD, captions, opening card), `kit/` (reusable animated parts), `motion.ts`, `acting.ts` |
| `src/layers/characters/` | the template host `Host.tsx`; your characters go here |
| `src/layers/scenes/` | one file per chapter of an episode (`Ep000_*.tsx` are the demo) |
| `tools/` | the pipeline and the checks (Python and bash) |
| `presets/` | the engine's base presets (default colours and layout numbers) |
| `looks/` | looks laid over a preset; ships with `_TEMPLATE.json` only |
| `formats/` | one sheet (`.md`) and one settings file (`.json`) per format, plus `modifiers/series.md` |
| `episodes/` | one folder per episode: `script.md`, `plan.json`, `episode.json`, audio |
| `series/` | the bible, look, voice and language of each saga |
| `characters/` | how to create a host, and which voice each one has |
| `voices/` | the voice catalogue |
| `brands/` | the accounts an episode is published on, and the shelves |
| `sounds/` | the sound library and its kits |
| `ideas/` | subject backlog and follow lines |
| `stats/` | numbers of the published videos and the catalogue (written by the tools) |
| `docs/` | engine contract, kit, looks and styles, language, retention, sound, publishing, connectors |
| `.claude/agents/` | the briefs of the agents |
| `skill/video-factory/` | the skill that carries the method into a Claude session |

## Using it with Claude
- `CLAUDE.md` is read by Claude Code at the start of a session in this repo: it holds the method (phases, gates, express mode, parallel work).
- `skill/video-factory/` is the same method as a skill, for sessions that load skills: install it from that folder.
- `.claude/agents/` holds six briefs: `reference-scout`, `fact-checker`, `script-critic`, `scene-builder`, `asset-scout`, `qa-stills`. The main session starts them; when the session does not offer an agent type, it starts a general agent with the file's text.
- Outside services are optional and reached through the connectors of your session: a voice service (built with ElevenLabs), a scheduler with analytics (built with Metricool), a cloud drive for the masters. `docs/CONNECTORS.md` is the table to fill.

Ask for a video in one sentence. Claude answers with three briefs, you pick one, and it stops again only before spending voice credits and before scheduling.

## Costs and limits
- Voice: a real voice costs credits of your voice service, counted per character; a transcript used for alignment costs credits too. The demo and every reference timing use espeak and cost nothing.
- Scheduling: free plans of schedulers are limited (number of brands, posts per month, days of analytics). Check your plan before promising a rhythm.
- Render time: about 8 min for 60 to 80 s at 1080×1920 on 2 cores; blur and glow filters can multiply it by four or more.
- Sounds: the library records the licence of every sound. Sounds under an attribution licence owe a credit line in the caption (`python3 tools/sound_lib.py credits episodes/<id>`). Sounds whose licence forbids commercial use or derivatives are not searched by default.
- Assets of a montage: you are responsible for the rights of every file you add.
- AI labels: the platforms ask creators to label synthetic content. A video made here has a synthetic voice; whether and how to declare it on each post is your decision.
- Nothing guarantees views. `docs/RETENTION.md` removes known reasons a stranger swipes away, and `tools/stats.py` measures whether it works for you.

## Licence
MIT for the code and the method of this repo, see `LICENSE`. The fonts and the sounds keep their own licences. The renderer, Remotion, is a dependency with its own licence: free for individuals and small teams, a company licence above that. Read `node_modules/remotion/LICENSE.md` or remotion.dev before commercial use.

The logo and banner are in `docs/brand/` and are covered by the same MIT licence.
