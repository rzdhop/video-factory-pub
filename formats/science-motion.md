# Serious science in motion design (`science-motion`)

Config: `formats/science-motion.json`. Shared pipeline and engine rules: the video-factory skill and `CLAUDE.md`. `docs/RETENTION.md` comes first for every new episode: frame 0 states the subject, funny and with impact (`opening`), nothing before the hook, shortest length that tells the idea.

## Identity
One natural phenomenon (physics, space, biology, chemistry, maths, earth) explained seriously and beautifully: the thing is built on screen step by step, with real orders of magnitude. No host by default, no insults, a sense of wonder.

## When to use
The user asks for a serious or clean science video, a motion-design explainer, or a "why/how does X" on nature. For computing internals use `tech-serieux`; for a true-but-absurd fact played for laughs use `wtf-motion`.

## Discovery (references, skills, connectors)
Run phase 0 of `CLAUDE.md` (reference-scout agent), then add for this format:
- References: 3-5 current science motion-design pieces on the same or a neighbouring phenomenon (study palette, how scale is shown, how a formula is introduced, pacing of reveals); one primary source figure (paper, agency, textbook) to redraw faithfully.
- Skills/connectors, when the session has them: a computation tool for every computed number and unit conversion; a data-visualisation skill when a chart is the scene; a design tool for a style frame if the user wants to choose a look first.

## Tone and writing
- Clear, calm, precise; wonder comes from true scale and consequence, never from exaggeration. At most one light touch of wit per episode.
- Hook: a true counter-intuitive fact, a question the viewer cannot answer, or a scale comparison, in the first 2 s. No "did you know".
- One idea per sentence, every term defined in a few words the first time, units always said.
- No vulgarity. No "scientists say": name the source or the experiment.

## Structure
5-7 chapters, 50-70 s, ceiling 100 s.
1. Hook: the paradox or the question, shown, not only said.
2. Scale: where and how big (a size, time or energy comparison the viewer can feel).
3-5. Mechanism, one step per chapter, in causal order; each ends on "so what happens next?".
6. Recap: the whole chain drawn once, start to end.
7. Opening: a limit of what is known, or what it changes for the viewer, then an open question.
If it does not fit, propose a series (`formats/modifiers/series.md`).

## Visual grammar
- Hostless layout; the scene is one continuous "world" per episode: the camera moves inside it instead of cutting to unrelated drawings.
- Build, never show finished: curves draw themselves (AxisPlot), numbers count up (CountUp), formulas appear term by term (Formula) and each term is tied to the drawing by a Callout.
- Always a scale reference on screen (Scale) when a size, time or energy is named.
- One accent colour for "the thing followed" through the whole episode; cool colours for context.
- Kit parts first (`docs/KIT.md`: Atom, Wave, Planet, Cell, Particles, AxisPlot, Formula, Scale, Timeline, GlossaryChip, Callout); episode-specific drawings only for the subject itself.
- Idle life at all times: slow drift, orbit, breathing; no dead frame at chapter start.

## Characters
Default none. Any registered character can host (the template `host`, or one created with `characters/README.md`: model sheet shown to the user before any render, own intro, own voice). With a host the engine uses the host layout (acting, close-ups, cold open); with `"character": "none"` the scene takes the whole frame. A host here acts as a curious guide: `curious`, `amazed`, `happy`.

## Sound and voice
Music 92 bpm at −18 dB, mostly `half` sections; `ding` on definitions, `pop` on reveals, gains under 0.4 except 2-3 real reveals (one every 15-20 s). Voice: the narrator of the format json, with `[curious]` on the hook and the final question, `[calm]` elsewhere; write numbers and units in the voice prompt as they are spoken.

## Fact-check
Strict: every number, unit, date and name on screen or in the narration has a primary or institutional source (paper, agency, university, reference textbook) with a link; computed values are recomputed (a computation tool or code) and the calculation is kept in script.md. Simplifications and open scientific debates are listed.

## Gates
1. Brief: 3 briefs with the references found in phase 0, the user picks.
2. Script, fact-check and chapter plan.
3. Go for the voice, before any voice credit (cost said first).
4. Final video.

## Agents
Phase 0: reference-scout. After the brief: fact-checker and script-critic in parallel on the draft. After the script gate: one scene-builder per chapter (each writes only its own scene file) while the voice is generated and aligned. Before the full render: qa-stills on the sheet from `tools/stills.py`. The fact-checker recomputes every figure.

## Checks before delivery
A scale reference is visible wherever a quantity is named; the accent colour follows one object only; every formula term was introduced before the full formula; no chart without axes and units; values on screen equal the fact-check table.

## Lessons learned
Add dated notes here after each episode.
