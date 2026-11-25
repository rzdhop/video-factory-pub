# Express humour (`humour-express`)

Config: `formats/humour-express.json`. Shared pipeline and engine rules: the video-factory skill and `CLAUDE.md`. `docs/RETENTION.md` comes first for every new episode: frame 0 states the subject, funny and with impact (`opening`), nothing before the hook, shortest length that tells the idea.

## Identity
The short cut of `humour-host`: one true absurd fact, one escalation, one twist, in 30-40 s. It exists because viewers of longer humour videos leave in the first two seconds and almost nobody finishes 66-90 s: here the hook is readable at frame 0 and the video is short enough to be finished and replayed.

## When to use
Default for a quick funny short, a test, or a topic that holds in one fact. If the story needs a plot with several mechanisms, use `humour-host`.

## Discovery (references, skills, connectors)
Run phase 0 of `CLAUDE.md` (reference-scout), then add for this format:
- References: openings whose first two seconds work without sound and without knowing the channel.
- Topic test before anything else: can the fact be ONE image and ONE sentence of at most 9 words? If not, it is not an express topic.

## Tone and writing
All the tone rules of `formats/humour-host.md` apply (funny plot, one joke per sentence, vulgarity policy and hard limits, no screams): read that sheet's "Tone and writing" first. What changes:
- **No greeting at the start.** The first spoken words are the hook sentence. The host's signature moves to the very end as a 1-second sign-off after the question, or is dropped; never before the hook.
- **The hook sentence is the title**: at most 9 words, understood by a stranger with the sound off, containing the object and the absurd claim. It is written whole on screen at frame 0 (`opening.title`), and it is also the cover.
- One fact only. Every sentence either raises the stakes of that fact or is the twist. No second topic, no context paragraph.
- 85-115 words. Cut every block that can go without losing the joke.
- **A technical subject in this format is told calm.** The busy version (many jokes, many props) loses the viewer: nobody knows where to look or what it is about. For a technical subject: one plain stage (one dividing line), at most 2-3 elements on screen at a time, each with a big plain label naming the concept, one new element per idea, no decor props; calm text with one idea per sentence and no insults; 2 close-ups at most; softer music (−19 dB, 90 bpm), 1-2 light sound effects.

## Structure
3-4 chapters, 30-40 s, ceiling 42 s.
1. Hook (0-4 s): the hook sentence over the absurd image; the promise is complete by 3 s.
2. Proof and escalation (4-18 s): yes it is true (number, source shown), and it is worse than that.
3. Twist (18-30 s): the consequence nobody expects, biggest punchline, music stop.
4. Question (30-36 s): binary question to the viewer, tied to the stakes of the fact; then the optional sign-off.
The last image should cut cleanly back to the first (loop): end on the same object as frame 0.

## Visual grammar
- `"layout": 2` and an `opening` block in plan.json (see `docs/ENGINE_CONTRACT.md`): at frame 0 the scene shows the absurd image at full brightness with the whole hook sentence as a giant caption; no close-up, no word-by-word, no fade-in during the opening.
- One object carries the whole episode and stays on screen, transformed chapter after chapter (kit parts + one shared drawing in `EpNNN_shared.tsx`).
- A cut or a strong visual change every 3-5 s; 2-3 reaction close-ups at most (twist, question), each with a different emotion.
- Cover = the opening frame (`python3 tools/cover.py <id>`); check its 3:4 centre crop.

## Characters
Default: the `default_character` of the format json. Any registered character can host (or none: `"character": "none"`); a new character follows `characters/README.md` and is shown to the user before any render.

## Sound and voice
Music 100-108 bpm at −15 dB, one stop before the twist; 3-4 big effects in total. Voice tags as in `humour-host`. No intro audio is prepended (no greeting): leave `retime.intro_after` unset.

## Fact-check
As `humour-host`, and the one fact carries everything: two independent sources, one primary or institutional, checked BEFORE the brief is shown.

## Gates
1. Brief: 3 topics, each with its hook sentence and its frame-0 image; the user picks.
2. Script and plan (one screen of text).
3. Go for the voice (cost said first).
4. Final video with its cover.

## Agents
Phase 0: reference-scout (it also pre-checks the candidate facts). After the brief: fact-checker and script-critic in parallel. Scenes: the orchestrator writes `style.md` and the shared drawing, then one scene-builder per chapter; qa-stills before the render, with frame 0 judged first.

## Checks before delivery
Frame 0: is the topic understood in one second with the sound off? Is the whole hook sentence readable, inside the 3:4 centre crop, clear of the HUD and the host? Promise complete by 3 s; duration ≤ 42 s; the last frame matches the first; cover exported.

## Lessons learned
Add dated notes here after each episode: views, average watch time, % watched to the end, the second where most viewers leave, and what the user corrected.
