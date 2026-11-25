# Fully generated video (`ai-full`)

Config: `formats/ai-full.json`. Shared pipeline and engine rules: the video-factory skill and `CLAUDE.md`. `docs/RETENTION.md` comes first for every new episode: frame 0 states the subject, funny and with impact, nothing before the hook, shortest length that tells the idea.

## Identity
Pictures, clips and voices are all generated: no scene is coded. It is produced with a generative video connector (image generation, image-to-video, voice) that the user brings, and with that connector's own skill or instructions; this sheet only says how such a production plugs into the factory. The repo ships no such connector.

## When to use
The user asks for a fully AI video, an AI story, characters that are generated rather than drawn in code. For every other format the rule "100 % code, no AI pictures" holds.

## Discovery (references, skills, connectors)
Run phase 0 of `CLAUDE.md` (reference-scout agent), then add for this format:
- Check that a generative video connector is connected and healthy. If none is, say so and propose a code format instead.
- Load the skill or the instructions of that connector and follow its steps: it is the source of truth for the production.
- Say the estimated cost once before producing anything.
- References: 3 to 5 current AI shorts in the targeted universe (what holds a character consistent, shot length, what breaks the illusion).

## Tone and writing
Decided by the story's brief and universe. The hook rule of the factory still applies: the first 2 s are the strongest image.

## Structure
Shots, not chapters: a shot list per episode. Series are the normal case here; continuity lives in a story folder (brief, universe, cast, places), and `formats/modifiers/series.md` adds only the numbering and recap conventions.

## Visual grammar
Set by the story's universe and cast sheets. Never a still used as a clip, never a slowed clip.

## Characters
Generated cast with locked pictures and voices in the story folder. A code character (a host of `src/layers/characters/`) is not used inside AI shots. A generated character never imitates a real person without that person's agreement.

## Sound and voice
Voices are generated with the clips and brought back to the locked voice of each character. The voice service of the factory is used only for an added narrator.

## Fact-check
Fiction by default. If the story states real facts, they are checked like in any other format.

## Gates
Concept, universe, cast sheets, finished cast, script, whole episode. The cost is said before the first paid call.

## Agents
Phase 0: reference-scout. script-critic on the script before its gate. Production calls to the connector stay in the main session (cost control).

## Checks before delivery
Every take is checked when it arrives (consistency of the character, no frozen or slowed clip). Then the factory's last step if wanted: captions and a −14 LUFS master, by placing the assembled file as a single `media` item of a `montage` episode.

## Lessons learned
Add dated notes here after each episode.
