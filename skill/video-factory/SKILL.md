---
name: "video-factory"
description: "Produce a short vertical video (TikTok, Reels, Shorts) or a long 16:9 voice-off explainer with the open video-factory engine: humour with a host, serious tech, science motion design, absurd true facts, montage, series. Covers the whole line: brief, script, fact check, voice, coded scenes, sound, render, scheduling and audience numbers. Use for a new episode, a change to an existing one, a new format, a new character, or a publishing and stats session. Needs the video-factory repo (see SETUP.md)."
---

# video-factory: videos by format, from the brief to the numbers

Use this skill when the user asks for a short video (explainer, humour, science or tech motion design, absurd true fact, montage, a series, a new episode, a change to an existing one, a new format) or for a long 16:9 explainer. It drives the video-factory repo: a Remotion engine, Python tools, format sheets and agent briefs. The skill holds the method; the repo holds the code, the formats, the looks, the characters, the voices and the user's own settings.

**First use**: follow `SETUP.md` (in this skill's folder) once. It installs the repo, names the connectors and fills the user's settings. Nothing personal is written in this skill: brand handles, account ids, voice ids, time zone and weekly target all live in the user's copy of the repo (`brands/brands.json`, `voices/catalog.json`, `characters/voices.json`, `docs/CONNECTORS.md`).

**Talking to the user**: answer in the user's language, in plain words. No tool names or file paths unless they ask. The language of a video is a separate choice (section "Language").

Every animated scene follows the section "Motion design" below and its full reference `references/motion-toolkit.md`: read that file before drawing the first scene of an episode.

## Working method: the main session decides, agents execute

- **The main session is the orchestrator.** It decides, writes the briefs for agents, reads their reports, arbitrates review findings, talks to the user and holds the gates: the pick of the brief, the yes before anything is scheduled, the voice credit cost announced in one line.
- **Execution goes to agents**: research and references, script and plan, scenes, the tool chains (reference timing, voice, transcript, alignment, post-alignment chain, sound check), stills, the full render, master, cover, uploads, the scheduling call, the bookkeeping, commits and pushes. An agent acts on a written order and reports the result (credits used, file, post id, commit hash); the orchestrator verifies by reading.
- **The scheduling call** is made only after the user's yes, on an order that carries the exact brand id, connector account, slot, caption and media file ids. It is never retried blindly: on an unclear result, read the planner first.
- **Several videos in one session**: one production agent per video, end to end, started after the briefs are validated and resumed for each later round so it keeps its context. Independent checks (`fact-checker`, `script-critic`, `qa-stills`) are started by the orchestrator, never by the agent that produced the work.
- **One writer per file.** Scene builders write their own chapter file; shared files have one owner.
- **One render at a time.** Every command that renders or regenerates the scene registry goes through `flock /tmp/vf-render.lock ...`; before a full render `pgrep -fa "remotion render"` must show exactly one. A killed render can leave its browser and ffmpeg alive: kill them before starting clean. Concurrency never exceeds the number of cores. A background job started by the main session can die when its reply ends, so long jobs belong to an agent.
- Role briefs are in `.claude/agents/` of the repo. If a role is not offered as an agent type, start a general agent with that file as its brief.
- `CLAUDE.md` in the repo is the working method in full; where it and this skill differ, the repo wins.

## Retention first (every format, every new episode)

`docs/RETENTION.md` comes before any format sheet. Never promise a viral video: say what the rules do (remove the known reasons a stranger swipes away) and measure.

- **The first second states the subject, funny or startling.** Frame 0 shows the image of the topic at full brightness with the WHOLE hook sentence written (`opening` in plan.json, `docs/ENGINE_CONTRACT.md`). The hook is at most 9 words, is itself the joke or the shock, and is a question in plain spoken language that the video then answers. The image collides with it. Test: sound off, one second, a stranger. What is it about, why is it odd or funny, would the image alone stop someone?
- Frame 0 is an object everyone knows, never a diagram.
- Nothing before the hook: no greeting, no name. The promise is complete by 3 s, the first punchline or proof by 8 s.
- As short as the idea allows. The format's maximum length is a hard limit.
- End on a binary question; the last image is the first image (loop). The cover is the opening frame: `python3 tools/cover.py <id>`.
- Each brief shown to the user IS its first second: hook sentence, frame-0 image, then one line of plot. Write 3 hooks per brief and keep the best.
- Every published video is measured (`tools/stats.py`, section 5). Change the rules when the numbers contradict them.
- `tools/lint_plan.py` refuses a new episode that breaks the mechanical part of these rules.

## Language: one language per video

Full rule: `docs/LANGUAGE.md`. The engine ships French and English; another language needs its word lists, reference voice and number format added first.

- **Chosen at the brief.** One video, one language, never a double version. If the user does not say, the default applies (the saga's language, else the brand's, else the repo default) and is stated with the briefs. The briefs of a video are written in the video's language, with one line in the user's language under each hook when the two differ.
- **Set once**: `python3 tools/new_episode.py <id> --format <fmt> --lang <code>` writes `"lang"` in plan.json; `python3 tools/lang.py episodes/<id>` says which language and why. A saga speaks one language: the version of a saga in another language is another saga.
- **Everything follows it**: script, captions, hook card, HUD labels and every word drawn in a scene, the reference timing voice, the word lists of the lint and of the acting, numbers (`fmtNum(value, decimals, tk.lang)`, never a literal locale), the series badge, the caption and hashtags, the `lang` column of the catalog. A scene drawn for one language is not reused as it is in another.
- **Writing**: a script is written in its language from the start, never translated from another script.
- **Voices**: a host keeps the same voice in every language unless the user decides otherwise. A voice the user has not heard in a language is sent to them before the render (`tools/voice.py` warns).

## Formats and looks: pick before writing

Formats live in the repo, one sheet each: `formats/<id>.md` (rules) and `formats/<id>.json` (settings). `python3 tools/formats.py` lists them. Read the sheet of the chosen format BEFORE writing anything; where a sheet and this skill differ, the sheet wins for its format.

- `humour-express`: a single funny fact, 30-40 s, 4 chapters, host avatar, hook card.
- `humour-host`: the longer version with a real plot (45-75 s), host avatar.
- `tech-serieux`: computing and systems deep-dive, pure motion design, no host by default.
- `science-motion`: serious natural-science explainer in motion design.
- `wtf-motion`: true but absurd fact, deadpan voice, the drawings carry the gags.
- `montage`: the user's footage and images plus licensed stock, cut by the `media` scene.
- `ai-full`: everything generated by an outside image and video generator; no Remotion code.
- `long-explainer`: 16:9, 3-20 min, voice-off only (section "Long 16:9 explainer").
- Series (`formats/modifiers/series.md`): multi-part stories on top of any format, with a bible in `series/<slug>/`.

Rules around them:
- If the request does not say which format, ask in one line. When the brief is unclear, propose 3 briefs and let the user pick before writing the script.
- Every format accepts a host: an existing character or one created in the session. `"character": "none"` gives the hostless layout.
- **The look is separate from the format**: colours, set, lights, fonts and the style of the kit parts come from `looks/<id>.json` (`docs/LOOKS.md`). A saga has ONE look (`series/<slug>/look.json`); a one-off episode names its look in plan.json. For a new saga or a new style, propose a look with the briefs and show `python3 tools/looks.py preview <id>` before any scene is built.
- A style is a way of BUILDING the drawing. Changing only a palette, or laying a filter over the whole frame, gives the same picture again: do not propose either as a new style.
- New format: copy `formats/_TEMPLATE.md` and a `.json`, fill both, run `tools/formats.py`. After each episode, add dated notes to the sheet's "Lessons learned".

## Phases (→ waits for the user, ∥ in parallel)

0. **Discovery**: pick the format. ∥ `reference-scout` writes `episodes/<id>/references.md` (references, unused angles, visual direction, risks). Check by reading which connectors and skills are really available. Take principles from references, never a design.
1. **Brief** → 3 briefs built on the references. The facts of each hook are checked before the brief is shown. The user picks.
2. **Script**: scaffold, write `script.md` and `plan.json`. ∥ `fact-checker` and `script-critic` on the draft; apply; lint. → The user validates the text, the plan and the list of close-ups and pauses (and the asset list for a montage).
3. **Production**: the art direction is fixed FIRST, by one author: `episodes/<id>/style.md` (the one world of the episode, the object we follow and its accent colour, light, camera idea, what stays on screen, the signature transition, one line per chapter) and `src/layers/scenes/<EpNNN>_shared.tsx` (the recurring subject and props drawn once). Then ∥ one `scene-builder` per chapter, or `asset-scout` for a montage, while the timing runs and, after the user's go, the voice chain. `python3 tools/gen_scenes.py` registers the scenes.
4. **Check**: `bash tools/check.sh <id>`; ∥ `qa-stills`; fix; a 15 s draft render when the engine or a scene changed.
5. **Render and master**: final render, master, contact sheet, sound check on the master. → The user judges by ear and eye, with the sound numbers in front of them.
6. **Close**: cover, scheduling on the user's yes, numbers at about 24 h and 7 days, lessons added to the format sheet, commit and push.

### Express mode
When the user gives a theme and wants it fast: phase 0 as usual, then ONE message with the 3 briefs. Their pick is the only stop before the finished video: it is also the go for the script and for the voice credits (say the cost in one line when the voice starts). The script, the plan and the close-ups are sent for information while production goes on; a correction is applied before the next step. The three checks still run and their errors are fixed. At the end the user receives the video, the caption and a proposed slot, with one question: schedule for that slot or not. **Nothing is scheduled or published without that yes.**

### Slot, rhythm and subjects
- **The slot is studied, not guessed**: the scheduling tool's best-time data for each network of the brand, the hours of the brand's own best videos (`python3 tools/stats.py`), no other post of the brand within 20 h, the earliest slot that fits, at least 3 h ahead. Say in one line why this slot. To hit a peak hour with the 3 h margin, plan the day backwards from it.
- **Rhythm**: each brand has a `weekly_target` in `brands/brands.json` (`null` means not set: ask once). At session start, count what is published and scheduled for the current week against the target and say it in one line. When the week is not covered, propose subjects and offer express mode.
- **Subjects**: `ideas/backlog.md`, per character. An idea marked `to check` is verified before it is shown as a brief. Keep 5 ideas or more per active character.
- **Follow lines**: 3 s at most, a new angle each time, placed after a payoff; the lines already used are kept in `ideas/follow_lines.md`. The end line sends the viewer to ONE place.
- **Shelves** (`docs/SHELVES.md`): every episode sits on a shelf; its cover carries the shelf band and its caption the shelf tag when the brand uses them.

## What makes a frame feel alive

A video where the framing never changes, the face holds for a whole chapter and the drawings are flat reads as an animated dashboard. The engine fixes this when the script and plan.json feed it:
- **Image 0 is the subject and the shock**: the scene with the whole hook sentence, not a face. Close-ups start after the opening.
- **The host acts every line.** One acting state per narration block (emotion, shot, gesture). The longest hold of a single face stays under about 3 s.
- **The mouth follows the real voice** (per-frame loudness and brightness of the audio).
- **The set has depth and light**: drifting lights, a spotlight on the scene, a floor line, dust on three planes, drop shadows, rim light on the host.
- **The camera is hand-held**: drift, push-in, punch on accents, creep-in then hit on punchlines, rotating cuts (whip, zoom, flash).
- **There is a real beat**, restarted on beat 1 at every chapter cut, dropping out for a breath before each big punchline.
- **Captions appear word by word** with a heavy outline.

## Motion design (short version; full text in `references/motion-toolkit.md`)

These rules apply to every new scene, Remotion or HyperFrames. A look or a saga the user already validated keeps its own treatment; the bans apply to new looks and to the long format unless the user asks otherwise.

- **Numbers before adjectives**: before the first scene of a new look or a long episode, write `SPEC.md` (goal, output, time, look in hex and px, objects, motion by role, shots, BANNED, QA). A look is a medium (printed manual, risograph, blueprint, clay), not a palette.
- **Ease by role**: arrival `expo.out` / `power4.out`; camera and colour floods `power2.inOut`; exit and zoom-through `power3.in`, 40-50 % shorter than the arrival; linear only for rotation and progress. Never the same `power2.out` 0.5 s on everything.
- **Banned by default** (the generated look): a dark void with small floating things, glow or neon or particles as decoration, purple or blue gradients, glass cards, cream paper with serif and mono caps labels, everything centred, everything fading and sliding up, titles drifting after they land, HUD readouts and corner brackets as decoration, three cards in a row, bullet slides, the narrator's sentence written on screen word for word.
- **Objects read as what they are** (a server is a rack unit with bays and LEDs), have a mount or a contact shadow, and the hero fills at least 40 % of the frame.
- **Explainers**: one concrete example travels through the whole video; one diagram grows one part per spoken phrase; each reveal lands on the word the voice says.

### Rhythm
- **Beat grid first.** Pick the BPM with the music (100-120 for explainers). Every hit, cut and reveal sits on `b(n) = n × 60 / BPM`, computed from the index, never accumulated.
- **Something changes every 1-2 beats; the camera does something every 2-4 beats**: punch-in (0.2 s, `power4.out`, scale ×1.15), whip to the next subject (0.3 s, `power3.inOut`, blur peaking mid-move), slow counter-push over 4 beats while a card lands, push toward the subject one beat before a payoff.
- **Contrast speeds**: moves of 0.1-0.35 s against holds of 1-2 beats. Typing at 40-50 characters a second; a counter rolling one value per eighth note, last value held.
- **Punchlines**: the music drops out one beat before; on the beat, the hit (a stamp `scale 1.45 → 1`, `back.out(2)`, 0.18 s), a deterministic shake of 4-5 frames and a sound.
- **Transitions with a cause**: zoom through an object on screen, dip cut (darken 40 % for 3 frames), whip. Never a crossfade between two worlds.
- **Titles**: letter by letter on sixteenth notes, the accent word on its own beat. Once landed, dead still.
- **Sound on every visible action**, on the same grid.
- **Two wrappers for the camera**: one carries framing and zooms, the other the shakes, so two tweens never fight over one property.
- **Cost**: dense motion with blur renders many times slower than calm scenes. Measure a 20 s sample before promising a render time, and keep blur to the moves that need it.

## 0. Workspace

Check the repo is present with `tools/`, `src/`, `formats/`; if not, follow `SETUP.md`. Never redo work from memory when the repo is available. The reusable drawing parts live in the kit (`src/kit/`, listed in `docs/KIT.md`, previewed with the `KitSheet` composition); a part drawn twice in episodes moves to the kit. New scenes take colours, stroke widths and radii from `kit(preset)` / `preset`, never as literals, so they follow the look. Code and comments are in English.

## 0b. Character (same or new)

- Same host: `plan.json` names it in `"character"`. `python3 tools/voice.py <episode_dir>` says which voice speaks and why.
- New character: follow `characters/README.md`. Copy an existing character component and keep ALL its props and its numeric faces table, otherwise the new character loses the blended faces, the voice-driven mouth and the hands. Register it, render the model sheet (`CharacterSheet` composition) and **show it to the user before any episode render**; iterate on their feedback. From photos, derive face proportions, hair silhouette, brows, eye shape, nose, lips, facial hair, jewellery and clothing colours. Draw a real person only with that person's agreement.
- Every new character gets its own intro: a 1-2 line offbeat opener in the character's voice. Propose 3 with the model sheet; the user picks. Pick a distinct voice per character, store the chosen intro audio and write the voice in `characters/voices.json` and `voices/catalog.json`.
- Never change the voice of a host or of a running saga without asking.

## 1. Script (the user's gate)

**How the narration talks** (serious and tech formats, any saga): the way a person tells it in a conversation. Complete explanatory sentences with the "why", never clipped fragments or slogans. No teaser questions, no "this changes everything", no lists of three for rhythm. One everyday image per new term, said in passing. In a saga: call earlier parts back by name, end on an opening to the next part, then a concrete question the viewer can check for themselves. Caption blocks only cut the sentence for the screen; they never shorten it.

**Real terms in every tech video**: the narration and the screen use the real name of the mechanism, API, file, setting, standard or identifier, never a vague stand-in when a real name exists. Each term is introduced once with one everyday image, written on screen exactly as sourced, and spelled for the voice only in the voice prompt. Limits: nothing that turns the video into a how-to for causing harm, long identifiers said once at most, and the length rule below. Full rule: `formats/tech-serieux.md`, "Writing style".

`python3 tools/new_episode.py ep-NNN-slug --format <id> [--lang <code>] [--character <name|none>] [--series <slug> --part N --total M] [--look <id>]` scaffolds the folder with the format's chapter skeleton. Then write `episodes/<id>/script.md`:
- The first 2 s create a gap (a shock number, a myth to break, an absurd image, a question the viewer cannot answer); a pattern interrupt every 6-10 s (chapter cut, new scene, a reaction close-up); an open loop planted in the hook and paid before about 40 s; an ending question that invites comments. Prefer a counter-intuitive angle over a textbook summary.
- One `### <Title> — HUD: <label>` section per chapter, in the order of the format sheet's "Structure".
- Narration as blocks separated by ` | ` (1-4 words, articles do not count), ONE accented word per block between `*asterisks*` (the noun or verb carrying the sense).
- A fact-check section: every claim and every value drawn on screen checked and sourced with links; popular myths corrected explicitly; fictional gags listed. A fact that depends on something the user can observe (what a system shows, a product screen) is checked on the real thing BEFORE the voice.
- **Length**: target 45-60 s of speech for a short (130-180 words); narration heavy with spelled technical terms runs slower, about 2.5 words a second, so write 230-250 words for 80 s.
- `plan.json`: `chapters[]` with `key`, `label`, `scene`, optional `transition` (whip-left | whip-right | whip-up | zoom | flash; they rotate by default) and optional `hud.counter`. **Give a chapter a counter only when the number is the story**; a decorative counter wastes the best area of the screen. Fields: `docs/ENGINE_CONTRACT.md`.
- **When the existing scenes do not fit the topic, draw every scene from scratch for the episode**: `style.md` and the shared file first, then one file per chapter exporting its scenes and camera (focus point and the beat words that punch the camera). Time each gag on its word. No emoji or special glyphs in SVG text (draw icons). Never edit the scene registry by hand; an unregistered scene renders blank.

### Scene drawing rules
- **Bright enough for a phone at low brightness.** Mid-tone fills; check a still at 35 % scale: every object must still read.
- **Draw relative to the scene box**, never at fixed pixel offsets; the captions cover its bottom quarter, so nothing to read goes there. Layout numbers: `docs/ENGINE_CONTRACT.md`. Older episodes keep the layout they were made with.
- **Fill the frame**: give the empty areas something that lives (a prop, a ticker, a reaction object).
- **Something is on screen at chapter time 0** and something moves at all times (flicker, sway, breathing). An empty scene waiting for its first word is a dead second.
- **Depth**: three planes (back wall, subject, foreground prop), a shadow side and a light side, the foreground overlapping the subject.
- **Animation principles**: anticipation before a move, overshoot on arrival, follow-through on loose parts, squash on impact. Never a plain linear fade for an entrance.
- One idea per shot, one new element per word; each gag gets one simple visual that pops on its word.
- All text inside the safe zone (12 % top, 22 % bottom, 8 % sides).

### Cold open, pauses, direction, music (plan.json)
```json
"retime": {"pauses": [{"chapter": "reveal", "word": "Caught", "add": 0.35}]},
"direction": [
  {"chapter": "hook", "word": "inside", "emotion": "smug", "shot": "close"},
  {"chapter": "reveal", "word": "Caught", "emotion": "panic", "shot": "peek"},
  {"chapter": "end", "word": "And you", "emotion": "curious", "shot": "close", "gesture": "point"}
],
"music": {"bpm": 100, "level_db": -15, "sections": {"reveal": "half"}}
```
- `retime.pauses`: 0.3-0.4 s of silence before a punchline (the voice tightening removes natural pauses; this puts the comic ones back).
- `direction`: emotion idle | happy | wink | curious | confused | amazed | panic | deadpan | smug; shot `bust` (default), `close` (reaction close-up, the scene dims), `peek`; gesture wave | point | shrug | balance. Vary the emotion across close-ups, or they read as the same shot. Direct at least the hook, every punchline and the ending by hand.
- `sfx_events` (`{chapter, word, kind, gain?, offset?}`) with `gain >= 0.4` are big punchlines: the music stops, the camera hits and the host gets a close-up. Keep them to one every 8-12 s, otherwise nothing is a punchline. A close-up dims the scene: never let one land on a drawing that must be read (add an explicit `bust`).
- `music.sections`: intro | full | half | outro | none per chapter.

## 2. Reference timing

`python3 tools/lint_plan.py episodes/<id>` checks script and plan against the format at zero cost. `python3 tools/build_episode.py episodes/<id>` builds the reference voice (espeak) and `episode.json`. `python3 tools/validate_episode.py episodes/<id>/episode.json`: fix ERRORs in the script. `bash tools/check.sh <id>` runs every check at once. The espeak voice is a placeholder, never a deliverable.

## 3. Human voice

The repo was built with ElevenLabs; use whatever route the session has to it (`docs/CONNECTORS.md`). Spend credits only after the user's go.
0. `python3 tools/voice.py episodes/<id>` prints the voice, the reason and the language. A host keeps their own voice whatever the format; a hostless episode takes the narrator of its format; a saga can fix one voice; `plan.json` `tts` overrides for one episode. Voices live in `voices/catalog.json` with a status: a voice the user has not heard is generated once, they listen, then its status is updated.
1. Build the plain narration (blocks joined, asterisks removed, one paragraph per chapter). Voice tags and pronunciation spellings go only in the voice prompt, never in script.md.
2. Read the credits left, estimate the cost and say it in one line. Generate once; never call twice to retry. A temporary download link is fetched at once.
3. Tighten and polish: `python3 tools/tighten_voice.py` (pauses ≤ 0.26 s, tempo ×1.08, pitch kept), then `bash tools/polish_voice.sh`. Never write the final voice at 16 kHz: analyse at 16 kHz, output at the source rate.
4. Align: `python3 tools/align_audio.py episodes/<id> <voice>` (DTW against the reference, no speech recognition). When it drifts (spelled acronyms), align on the word times of a transcript instead: `python3 tools/align_words.py`. Before a new alignment of an episode already retimed, delete its `*_pre_retime` backups.
5. **Post-alignment chain, always in this order, all four after any timing change**: `tools/retime.py` (pauses), `tools/voice_envelope.py` (mouth), `tools/direct.py` (acting; read its summary), `tools/build_sfx.py` (music and effects), then `tools/sound_check.py`.
- A sentence can be removed from a recorded take without new credits: cut the raw file between the word times of the transcript, shift the word times, keep the untouched take beside it, then remove the blocks and drawings of that sentence and re-run the chain.

## 3b. Sound: library, kit, check

Full text: `docs/SOUND.md`. Nobody in a session can hear, so a sound is chosen and a mix is accepted on measurements.
- **Library**: `sounds/library.json` and `sounds/files/`, each sound with its source, licence, author, the description it was scored against and the verdict. Builds read these committed files only.
- **Kit**: `plan.json` `"sound_kit"` maps roles (riser, whoosh, cut_hit, accent, plop, thud, pop, ding, boom...) to library sounds.
- **A gag or an object that needs its own sound**: add it BEFORE the voice with a plain English description: `python3 tools/sound_lib.py find <id> "<description>"` (a real recording, scored) or `pick` / `bank` (synthesized). Then name it in `sfx_events`. A sound that does not score `strong` is not used: an effect nobody recognises is worse than none.
- **Licences**: only public-domain and attribution sounds are searched. An attribution sound owes a credit: `python3 tools/sound_lib.py credits episodes/<id>` prints the lines to add to the caption before scheduling.
- **A host that refuses a download** is reported to the user by name; never route around it.
- **Check**: `python3 tools/sound_check.py episodes/<id>` measures every effect against the voice, the music under the voice and the credits. After the master add `--master out/<id>.master.mp4` (-14 LUFS ± 1.5, true peak under -1 dBTP). Fix ERRORs; act on WARNs or say why not.
- With the video, give the user the result in two plain lines (effects on time or not, music level under the voice, master loudness) and ask them to judge by ear only what a measurement cannot: taste.

## 4. Render and check

- Copy the episode into `public/episodes/` as `tools/render.sh` expects, then stills first: `python3 tools/stills.py <id>` picks the review frames and tiles them into one sheet. LOOK at it, and have `qa-stills` look independently. Always check: frame 3 (is image 0 a shock?), each close-up, the first 2 seconds after every cut, each gesture. Look for words touching, hands cut by the frame, a scene too dark, an empty scene at a chapter start, the edge of the set in a corner, text over the character, clipped labels.
- When the engine or a scene changed: `bash tools/render.sh <id> draft --frames=0-449` (15 s at half size).
- Full render: `bash tools/render.sh <id> final`, then `bash tools/master.sh out/<id>.mp4` and `bash tools/contact_sheet.sh`. Verify the size, the loudness and the voice sample rate.
- A render bundles the code at its start: edits made during a render are not in it.
- Send the video and the sheet to the user with one line (length, voice, what changed). In the same step commit and push the episode, and store the master where the publishing step expects it.
- The user's corrections map to: pacing → tighten tempo and `retime.pauses`; music level → `music.level_db` then `build_sfx.py`; acting → `direction`; visuals → the episode's scene file.

## 5. Publish and measure

Procedure and calendar: `docs/PUBLISH.md`. The repo was built with Metricool for scheduling and analytics and a cloud drive for the masters; the tool names below are Metricool's.
- **At session start**, when the scheduling connector is there: compare its brand settings with `python3 tools/brands.py`. Read the numbers of every active brand over the last 30 days and record a snapshot for each video that has none near 24 h or near 7 days: `python3 tools/stats.py add <episode_id> --platform instagram|tiktok --views N --hours H [--avg S ...]`. Read `stats/videos.json` first so the same snapshot is not written twice. Give the scoreboard in three lines before starting the work asked for. An empty answer means the network has not synced: say it and go on.
- Useful Metricool fields. Instagram Reels: `IGRE02` date, `IGRE03` text, `IGRE06` link, `IGRE23` views, `IGRE11` reach, `IGRE24` average watch time, `IGRE28` share past 3 s, `IGRE30` share leaving before 3 s, `IGRE10` likes, `IGRE07` comments, `IGRE21` shares, `IGRE12` saves. TikTok videos: `TKPO02` date, `TKPO03` link, `TKPO05` text, `TKPO06` length, `TKPO07` views, `TKPO08` likes, `TKPO09` comments, `TKPO10` shares, `TKPO13` full-watch rate, `TKPO15` average time watched (the last two come back empty for a personal account: ask the user for a screenshot of the video's analytics).
- **When the user validates a video**: propose the slot and the caption (hook sentence, closing question, 3-5 hashtags, the part number for a saga, in the language of the video) and ask one question. On their yes: make the master reachable by the scheduler (share that one file, never the folder), schedule on the episode's brand for each network, then read the planner to confirm.
- **Brand safety**: an episode is published on ONE brand (`python3 tools/brands.py of <episode_id>`). Before scheduling, the id and the handles of the resolved brand must match the scheduler's brand settings and its status must be `active`; otherwise stop and tell the user. When several accounts sit behind one connector, every call names its account.
- **In the same turn as the scheduling**: write the slot in the calendar table of `docs/PUBLISH.md`, run `python3 tools/catalog.py build` and `python3 tools/studio_export.py`, commit and push. Once the post is out, record its links (`python3 tools/catalog.py link <episode_id> --instagram URL --tiktok URL`). If the user keeps a dashboard fed by `stats/catalog.json`, `stats/videos.json` and `stats/studio.json`, refresh its copies after each of these steps.
- If the scheduler refuses the media link, say so and ask where to host the file; do not look for another way to post.
- Declaring synthetic voice or generated content on a post is the user's decision: ask once and record the answer in the brand's notes.
- Once an episode has its 7-day numbers and no change is pending, `python3 tools/prune_audio.py <id> --apply` removes its intermediate audio.

## Long 16:9 explainer (HyperFrames)

For a video of several minutes in 16:9, voice-off only. Same retention, writing, voice and sound rules as the shorts where they apply; what differs:
- **Engine**: HyperFrames (HTML, CSS and a paused GSAP timeline, seeked frame by frame in headless Chrome, encoded by FFmpeg). Setup and pinned versions: `SETUP.md`. Read the skill files that ship inside its npm package once per session. Do not run its usage beacon.
- **Contract**: one sub-composition per beat of the script; the timeline registered after the tweens; hidden-at-start states in CSS; `fromTo`, never `from`; no CSS `transform` on an element the timeline transforms.
- **Script**: about 2.2-2.5 spoken words a second, about 19 words per scene. 15 min is about 2,000-2,200 words: say the voice cost before generating.
- **Gates**: script → voice credits → a rendered style test of the hook (20-25 s, with the beat) → full render.
- **Checks**: the engine's `check`, then snapshots of every chapter start, every cut and every punchline, looked at as contact sheets (compare positions inside one tile, not across tiles).

## Known pitfalls

- After `retime.py`, the mouth, the acting and the music are stale until the three following tools are re-run. Processing done on the voice after a retime is lost on a re-run: do it before.
- `retime.py` cuts at block boundaries: a cut point must sit on a block that ends a sentence.
- Chapter cuts: the outgoing scene leaves in about 0.12 s and the incoming one lands on a spring; a cut longer than about 0.3 s feels heavy.
- Captions: never scale a word with a transform beyond a few percent (it collides with its neighbour); the accent word grows through its font size.
- Camera: keep the base zoom at 1.04 or more; springs swing below their rest value and would show the edge of the set.
- Props entering from above must fade in or stay below the HUD band.
- A render can fail silently when concurrency exceeds the cores: read the log `tools/render.sh` keeps in `out/`.
- Blur filters are expensive: keep them to a few elements per scene and tell the user once when a long render starts.
- An automatic close-up on a drawing that must be read, and an empty scene in the 2 s after a cut, pass every type check: only the stills review sees them.
- A transcript can merge or split tokens differently from the script ("file name" / "filename"): patch the word list before aligning on it.
- The series badge sits in the zone the apps cover: say the part number in the cover and the caption too.
- `pip install librosa` can hang in a cloud session: give it a timeout and say so if it does.
- At the end of every session that produced or changed an episode, a format sheet or code: commit and push (the main branch, or a branch when the change is not validated yet) and tell the user in one line what was pushed. Never commit `node_modules`, `out` or `public/episodes`.
