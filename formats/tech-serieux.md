# Serious tech (`tech-serieux`)

Config: `formats/tech-serieux.json`. Shared pipeline and engine rules: the video-factory skill and `CLAUDE.md`. `docs/RETENTION.md` comes first for every new episode: frame 0 states the subject, funny and with impact (`opening`), nothing before the hook, shortest length that tells the idea.

## Identity
A computing or systems topic explained all the way through in motion design: no host by default, no intro, no insults. The pull is the clarity and the "aha".

## When to use
The user asks for a serious, technical or in-depth video on software, hardware, security or systems. For natural sciences use `science-motion`.

## Discovery (references, skills, connectors)
Run phase 0 of `CLAUDE.md` (reference-scout agent), then add for this format:
- References: the primary documentation first (spec, vendor manuals, source code, author docs), then how the best technical explainers draw the same mechanism (diagram conventions, colour coding of layers, how they show memory, packets, privilege levels).
- Skills/connectors, when the session has them: a computation tool for any computed value; a design tool when the user wants a diagram style explored before coding.

## Tone and writing
- **How the narration talks**: write it the way a person tells it in a book or a conversation: complete explanatory sentences with a subject, a verb and the "why" ("To translate it, the processor walks four tables, a kind of phone book the system keeps up to date."), not clipped fragments or slogans. No machine-sounding tics: no rhetorical teaser questions ("The most surprising part?"), no "this changes everything", no lists of three for rhythm ("Read, write, execute."), no "But X does not stop there". One everyday image per new term, said in passing ("a kind of phone book"). The caption blocks (` | `) only cut the sentence for the screen; they never shorten it.
- **The hook** is a plain spoken question about something the viewer owns, and it sells a real, concrete thing with a bit of dream, all within the first 3 s. A hook made of jargon fails the stranger test ("DNS, SNI, handshake: and the name still leaks"); the same idea through what the viewer owns passes ("Who can see which sites you open?").
- **The answer starts being paid before 15 s**, with a first clear illustration. After that the episode stays technical and explains each concept with clear, precise illustrations and animations. There is no "one idea per image" limit: in a short, dynamic video, animations and illustrations carry the understanding; use them freely.
- **Real terms**: the narration and the screen use the REAL technical terms: the real name of the mechanism, API, file, setting, standard or identifier, never a vague stand-in ("a special layer", "an invisible trick") when a real name exists. Each term is introduced once with one everyday image said in passing, written on screen exactly as sourced, and spelled for the voice only in the voice prompt. This rule goes into every production brief. Limits that stay: nothing that turns the video into a how-to for causing harm (no creation command, no tool to build an attack), long identifiers said once at most and kept on screen, and the length rule below.
- **Something the viewer can check.** The best episodes end on a check the viewer can run on their own machine (a setting to look at, a harmless command), next to one concrete object everyone knows at frame 0.
- **Tone**: clear, confident, a bit of dry wit at most. No insults or vulgarity unless the user asks.
- **Length**: 60-90 s, ceiling 120 s. Word count for an 80 s target: about 280 plain words; 230 to 250 when many real terms are spelled out for the voice (identifiers and paths slow the take to about 2.5 words a second). Measure the rate on the first take of each voice and correct these numbers.
- **In a series**: call earlier parts back by name, keep one angle for every part (for a security series: what an attacker can and cannot do), and end on an opening to the next part, then a concrete question the viewer can check at home.
- **Other languages** (`docs/LANGUAGE.md`): the rules hold unchanged, written directly in the language; acronyms are written in the voice prompt the way that language reads them, and the take is checked.

## Structure
- **Structure** (5-8 chapters): Hook (a true counter-intuitive fact or question, sourced) → Context (the minimum vocabulary, every term defined before it is used) → one mechanism step per chapter, in execution order → Full recap (the whole path drawn once, start to end) → Limits, pitfalls or how to observe it (tooling, debugging) → open technical question, then the end line (follow + where to go next, `docs/RETENTION.md` §4). The follow call of the first third sits between two mechanism chapters, after a payoff.
- **Every concept gets four things**:
  1. a one-sentence definition in the narration;
  2. an everyday analogy, drawn on screen as a small side panel that then morphs into the real thing (a sorting room that becomes a routing table, a library index that becomes a file system);
  3. the real artefact on screen: register, opcode bytes, struct field, symbol, number, value;
  4. its place on a persistent mini-map of the system (a small layer/stack diagram in a corner of the scene, current layer lit) so the viewer always knows where they are.

## Visual grammar
- **Engine**: plan.json `"character": "none"`. The scene then takes the frame (layout numbers in `docs/ENGINE_CONTRACT.md`), the captions sit over the bottom of the scene on a dark band, and close-ups are disabled: keep the lowest part of each scene free of anything that must be read. `direction` is ignored; `direct.py` can still run. No intro, so leave `retime.intro_after` unset and only use `pauses`.
- **Grammar**:
  - a glossary chip pops the first time a term is used (term + 3-word meaning);
  - one new element per sentence, built in front of the viewer (typed code, bytes printing, arrows drawing), never shown already finished;
  - numbers count up;
  - simplified listings or outputs carry a small "illustrative" tag (`illustratif` prop of `CodeLines`);
  - stamps are used sparingly, as labels (BUSY, EXIT), not as jokes.
- Build scenes from the kit (`docs/KIT.md`: GlossaryChip, MiniMap, AnalogyPanel, CodeLines, ByteRow, Block, Arrow, Packet, Win, CountUp) so episodes look like siblings.
- **Frame 0 is an object, not a diagram**: one thing everyone knows (a boot screen, a login box, a file icon), already altered by the subject. A rail with three labelled boxes fails.
- **Size for a phone**: a row of five boxes across the frame leaves labels of 18 to 25 px. Write the one thing to read large, show a close view of three boxes when the whole row is not the point, and give the episode larger small texts when needed (`docs/KIT.md`, "Rules learned the hard way").
- **With a host**: a close-up dims and hides a scene that must be read, and a `close` holds until the next direction entry. Set `shot: "bust"` explicitly on every block whose scene carries the information (a grid, a setting card, a stamp), and keep big effects (gain ≥ 0.4) off those beats: a big effect triggers a close-up. Two caption lines climb onto anything drawn below half of the box: keep keys and lower elements above that line.
- **Render cost**: blur glows are slow (a 68 s episode took about 28 min on 2 cores because of them): a few blurred elements per scene at most.

## Characters
Default none. Any registered character can host (the template `host`, or one created with `characters/README.md`: model sheet shown to the user before any render, own intro, own voice). With a host the engine uses the host layout (acting, close-ups, cold open); with `"character": "none"` the scene takes the whole frame. A host here stays sober: `curious`, `amazed`, `idle`; no insults.

## Sound and voice
- **Sound**: `music.level_db` −18, more `half` sections; `sfx_events` mostly `ding` on definitions and `pop` on artefacts, gains under 0.4 except 2-3 real reveals (one every 15-20 s).
- **Voice**: tag `[curious]` on the hook question and the final one, no `[sarcastic]`. In the voice prompt, spell acronyms, opcodes and paths as they should be heard ("T L S", "R C X", "backslash, backslash, dot") while script.md keeps the written form for the captions.
- **Alignment when the prompt spells things out**: the reference timing (espeak) reads the written form, so the automatic alignment of `align_audio.py` can drift badly (a last block landing 20 s early). Fix: transcribe the raw take with the speech-to-text of the voice service, then run `tools/align_words.py` with `--sub written=spoken` pairs, right after `align_audio.py` and before `retime.py`. Read the pairs from the transcript, not from the voice prompt: a transcript writes numbers and compounds its own way ("0x109" as one word, "file name" as one or two). When the same written form appears elsewhere with another token count, split the tokens in `words.json` before `align_words.py` instead of using `--sub`. The transcript costs credits (about a third of the voice): count it in the cost line.
- **Short blocks**: after `tighten_voice.py`, blocks of 1-2 short words fall under 0.35 s and fail `validate_episode.py`. Write blocks of 3 words or more around short ones from the start.
- **Cutting a take costs no credit**: a sentence is removed by cutting the raw wav between the word times of the transcript and shifting `words.json` by the same amount. Keep the untouched take beside it (`voice_full_take.wav`, `words_full_take.json`, a `voice_cut.md` note), then remove the blocks, beats and drawings of that sentence and re-run the chain.

## Fact-check
- **Stricter than elsewhere**: every value or symbol on screen is sourced (spec, vendor manual, source code, author docs), not only the narration. List what is simplified.
- **What a real machine shows is checked on a real machine**, before the voice, whenever a spoken sentence states what the system displays or does. The user runs a read-only check on their own machine and sends the output; documentation and memory are not enough (a trick documented years ago may no longer work, and is then told in the past tense).
- **Outputs are checked in the audience's language**: a localised system answers a command with localised words. Any command output shown to an audience is checked in the form that audience sees.
- A dated external statement (an update "not enabled by default", an enforcement date "to be announced") is read again on the day of scheduling.

## Gates
1. Brief: 3 briefs with the references found in phase 0, the user picks.
2. Script, fact-check and chapter plan. Scenes are built while the user reads.
3. Go for the voice, before any voice credit (cost said first, transcript included).
4. Final video.

## Agents
Phase 0: reference-scout. After the brief: fact-checker and script-critic in parallel on the draft. After the script gate: one scene-builder per chapter (each writes only its own scene file) while the voice is generated and aligned. Before the full render: qa-stills on the sheet from `tools/stills.py`. The fact-checker also receives the list of every value drawn on screen.
- Scene builders do not wait for the real voice: they render one still against the reference timing.
- qa-stills sees what type checks cannot (overlaps, captions over a drawing): the sheet is always rendered before the full render. It looks at the first 2 seconds after every cut, above all the cut that follows the hook (empty slots waiting for their content), and at automatic close-ups that land on a drawing that must be read.
- Several episodes can be produced in parallel, one production agent each; the main session keeps the gates, the credits and the renders.

## Checks before delivery
Every term has its glossary chip before its first use; the mini-map shows the right layer on each still; simplified listings carry the "illustrative" tag; nothing to read under the caption band at the bottom of the scene; numbers on screen match the fact-check table; no close-up on a beat whose drawing must be read; every label readable at phone size.

## Lessons learned
Add dated notes here after each episode: what the user corrected, the measured word rate of the voice, the numbers at 24 h and 7 days. What earlier episodes taught is in the rules above; the three things that mattered most were the real terms, one concrete object at frame 0, and a check the viewer can run themselves.
