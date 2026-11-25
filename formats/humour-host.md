# Humour with a host (`humour-host`)

Config: `formats/humour-host.json`. Shared pipeline and engine rules: the video-factory skill and `CLAUDE.md`. `docs/RETENTION.md` comes first for every new episode: frame 0 states the subject, funny and with impact (`opening`), nothing before the hook, shortest length that tells the idea.

## Identity
A small absurd story told to camera by a host avatar, with heavy swearing and science that stays true. Image 0 is the absurd image of the topic with the whole hook sentence, never a close-up of the host.

## When to use
When the user asks for a funny, viral or satirical short with a host. If the request names no format, ask in one line (this one is the suggestion on a light topic). Not `wtf-motion`: here the host and his fictional life carry the jokes; there the facts and the drawings do.

## Discovery (references, skills, connectors)
Run phase 0 of `CLAUDE.md` (reference-scout agent), then add for this format:
- References: how current short-form comedians and satirical news formats in the language of the video open, cut and land a punchline (rhythm, reaction shots, on-screen text); set and prop ideas for the host set.
- Connectors: the voice service. The scheduler only when publishing.

## Tone and writing
- **A funny plot, not a list of facts.** Build the episode as a small absurd story with a running gag set up in the hook and paid off in the last chapter (callback). Shape of a plot: "Yesterday my flatmate did X. I evacuated the building. I called the space agency. They hung up on me. So I investigated." → chapters = suspect, clue, reconstruction → "Verdict: my flatmate is innocent. I called back to apologise. They hung up again." The science stays true; only the character's life is fiction (list the fictional gags in the fact-check section).
- **One joke per sentence.** An insult alone is not a joke: it lands when it closes a concrete absurd image ("The cloud resigned. The coward."). Concrete absurd images beat abstract ones: "a lift for turds, last stop the sewers", "no quantum coffee", "six litres, a duck and one unidentified hair". Short punchline right after the fact, deadpan.
- **Vulgarity: at the level of the format from the first draft.** The level is `tone.vulgarity` in the format json (`max` here; the user lowers it there once if they want a milder show). Do not start mild and wait to be pushed, do not ask permission at each script: the FIRST text shown already carries the swearing, on most punchlines (about one every 4 to 6 s), placed on the punch. Targets: the fictional camps, objects, animals, long-dead historical figures as a joke, and the viewer in the final question. Never a real living person, never a brand.
  - **Invent and vary.** The best insults are built from the episode's topic ("you leaky-ass faucet"). The same insult at most twice in one episode, and the two far apart: said five times, each one lands weaker. Vary the form instead. Escalate through the episode and keep the heaviest for the last punchline.
  - **Hard limit, in every language: no insult about sexual orientation, skin colour or origin.** A word that can be read as such a slur is left out, even where it is common as a generic insult.
  - Say once per session, in one line, that heavy swearing in the audio and in the on-screen captions can reduce reach on the platforms, then do what the user asks.
- **No screams.** A scream in the voice with a punch-in on the avatar does not work: the surprise must come from the writing, from the reaction close-up and from the music stop. The scream mode exists in the engine (blocks like "Aaaaah"); use it only if the user asks.
- **Onomatopoeia** (plop, glug, whoosh, pfft) only in the captions, never as extra graphics.
- **Deadpan on the vulgar punchline.** The ending is a personal stance, then "And you?" with a binary choice.
- **French lexicon to draw from**: connard, gros con, trou du cul, enfoiré, enflure, ordure, raclure, pourriture, fumier, salopard, sous-merde, sac à merde, tas de merde, tête de nœud, tête de cul, abruti fini, crevard, branleur, feignasse, lâche, ta gueule, ferme ta gueule, va chier, va te faire foutre, casse-toi, putain de merde, bordel de merde, fait chier, plus the toilet words (chiottes, pisse, merde, étron, serrer les fesses). Onomatopoeia: plouf, glouglou, vlouuush, pffft.
- **English lexicon to draw from**: asshole, dumbass, jackass, dickhead, shithead, dipshit, piece of shit, sack of shit, son of a bitch, bastard, motherfucker, prick, wanker, moron, coward, loser, shut the fuck up, fuck off, go fuck yourself, get lost, holy shit, for fuck's sake, what the fuck, bullshit, plus the toilet words (crapper, piss, shit, turd, clench your ass).
- Each language is written directly, never translated (`docs/LANGUAGE.md`): a translated joke keeps the rhythm of the original and dies.

## Structure
Hook (the hook sentence over the absurd image, `opening` in plan.json; the host's signature only after the promise is complete, or at the very end: "shock word, then greeting at 2-5 s" loses most viewers in the first two seconds) → Situation (the host lives the phenomenon) → 3-4 chapters, one mechanism each, 6-12 s, micro-cliffhanger → Punchline (callback of the running gag) → question. 5-7 chapters, 45-60 s of speech, 75 s ceiling. The promise is paid well before the end: an episode of 89 s over 9 chapters that pays at 65 s is too long.
- **Ending: no "part 2" tease.** Close the story, then open to the viewer: a personal stance, "And you?", and a binary choice that invites comments ("Me, I only press one button. To be safe. And you? One button, or both?").
In a series (`formats/modifiers/series.md`) the series rules replace this ending rule.

## Visual grammar
Host bottom-left in bust framing, scene box above, HUD top, word-by-word captions in the display font. One simple visual per gag that pops on its word. Reaction close-ups on the shock line, the 3-5 best punchlines and the final question, with a different emotion each time: the same emotion on every close-up reads as one shot. Optional host set (`host_set`: desk, reveal). Scene drawing rules of the skill apply.

## Characters
Default: the `default_character` of the format json. Any registered character can host (the template `host`, or one created with `characters/README.md`: model sheet shown to the user before any render, own intro, own voice). With a host the engine uses the host layout (acting, close-ups, cold open); with `"character": "none"` the scene takes the whole frame.

## Sound and voice
Music 100 bpm at −15 dB, drops out before each big punchline; big effects (gain ≥ 0.4) one every 8-12 s. More than that (21 sound events and 14 music stops in 66 s) and nothing reads as a punchline.
- **Voice tags (inline tags, for a voice model that reads them; `voice.model` and `voice.tags` in the format json):** `[sarcastic]` at the start for the deadpan, `[dramatically]` for fake suspense, `[curious]` on the final "And you?". Tags go only in the voice prompt, never in script.md.

## Fact-check
Every claim checked with a web search and sourced with links in the fact-check section of script.md. Popular myths corrected explicitly. The fictional gags of the host's life are listed as fiction.

## Gates
1. Brief: 3 briefs with the references found in phase 0, the user picks.
2. Script, fact-check and chapter plan. Show the full text; the user tweaks the tone, often in several rounds of one line each.
3. Go for the voice, before any voice credit (cost said first).
4. Final video.

## Agents
Phase 0: reference-scout. After the brief: fact-checker and script-critic in parallel on the draft. After the script gate: one scene-builder per chapter (each writes only its own scene file) while the voice is generated and aligned. Before the full render: qa-stills on the sheet from `tools/stills.py`.

## Checks before delivery
Frame 0 is the subject with the whole hook, not a face; no two close-ups with the same emotion in a row; longest hold of one face under about 3 s; the bottom-right third is not empty; no insult repeated more than twice; nothing unreadable behind a close-up.

## Lessons learned
Add dated notes here after each episode. What earlier episodes of this format taught is already in the rules above: the loss is in the first 2 seconds, before any joke (the first frame and first words decide); completion is near zero at 66-90 s; views come in the first hours and then stop; a profile cover that is a dark frame or a face with one word sorts nothing.
