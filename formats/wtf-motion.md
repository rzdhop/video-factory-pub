# Absurd true facts in motion design (`wtf-motion`)

Config: `formats/wtf-motion.json`. Shared pipeline and engine rules: the video-factory skill and `CLAUDE.md`. `docs/RETENTION.md` comes first for every new episode: frame 0 states the subject, funny and with impact (`opening`), nothing before the hook, shortest length that tells the idea.

## Identity
A true fact so absurd it sounds fake (history, law, animals, science, bureaucracy), told deadpan while the drawings do the comedy. No host by default: the narrator is a voice, the gags are visual.

## When to use
The user asks for a WTF, absurd, "unlikely but true" or funny motion-design video. If the jokes rely on a host and his fictional life, it is `humour-host`.

## Discovery (references, skills, connectors)
Run phase 0 of `CLAUDE.md` (reference-scout agent), then add for this format:
- References: 3-5 current deadpan-animation explainers (study the gap between a serious voice and a stupid drawing, the timing of the visual punchline after the sentence, simple character rigs); the original source of the fact (archive, law text, paper, newspaper of the time).
- Connectors: the voice service. A design tool when a recurring mascot or icon set is designed for a series.

## Tone and writing
- The narrator never laughs: serious documentary voice on a ridiculous subject. The contrast is the joke.
- The fact is 100 % true and sourced; the comedy comes from literal visualisation, absurd comparisons and escalation ("and it gets worse").
- Rule of three per episode: two facts that escalate, a third that breaks the scale.
- Vulgarity light by default (one dry swear word on the twist at most); go to the `humour-host` lexicon only if the user asks. Same hard limits as everywhere: nothing about orientation, skin colour or origin, no real living person as a target, no brand.
- Hook: the most unbelievable true sentence, first, with no setup.

## Structure
5-7 chapters, 40-50 s, ceiling 70 s.
1. Hook: the unbelievable sentence + its image.
2. "Yes, really": date, place, source, shown as a document.
3-5. Escalation: each chapter one notch more absurd, each ends on "and that is not the worst part".
6. Twist or consequence that still exists today.
7. Binary question to the viewer.

## Visual grammar
- Hostless layout. Flat, bold, slightly stupid drawings: thick outlines, big eyes on objects when it helps, exaggerated squash and stretch, hard cuts on the punchline.
- The visual punchline lands 4-8 frames AFTER the spoken one, then holds; the music stop covers the gap.
- Fake-serious devices: official stamps, archive documents, charts with absurd axes (AxisPlot, Stamp, Timeline, CountUp from `docs/KIT.md`).
- A recurring small witness (an object or animal of the episode) reacts in a corner: it replaces the host's reaction shots.
- Proof on screen: the source document is redrawn with its date when the fact is stated.

## Characters
Default none. Any registered character can host (the template `host`, or one created with `characters/README.md`: model sheet shown to the user before any render, own intro, own voice). With a host the engine uses the host layout (acting, close-ups, cold open); with `"character": "none"` the scene takes the whole frame. A session-made mascot can become the recurring witness of a series.

## Sound and voice
Music 108 bpm at −14 dB; stops before each visual punchline; big effects one every 8-12 s. Voice: the narrator of the format json, with `[deadpan]` as the base, `[sarcastic]` on the escalation lines, `[curious]` on the final question.

## Fact-check
The stranger the fact, the stricter the proof: two independent sources, one of them primary or institutional; debunked legends are thrown out at the brief stage. Every embellishment in the drawings (not in the narration) is listed as a visual gag.

## Gates
1. Brief: 3 briefs with the references found in phase 0, the user picks.
2. Script, fact-check and chapter plan.
3. Go for the voice, before any voice credit (cost said first).
4. Final video.

## Agents
Phase 0: reference-scout. After the brief: fact-checker and script-critic in parallel on the draft. After the script gate: one scene-builder per chapter (each writes only its own scene file) while the voice is generated and aligned. Before the full render: qa-stills on the sheet from `tools/stills.py`.

## Checks before delivery
Each punchline has its own visual and a hold; the witness reacts at least once per chapter; the source document appears on screen; the narration contains no joke that the drawing already makes.

## Lessons learned
Add dated notes here after each episode.
