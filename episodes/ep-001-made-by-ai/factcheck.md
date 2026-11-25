# ep-001-made-by-ai — independent fact check

Checked by an agent that did not write the script, against the repo in this folder (read on 2026-11-25) and the
facts about this video given by the orchestrator. A claim is "true" only if the repo does or prescribes it.
Narration: 105 words, 37 blocks (NOTES.md says 106 and 35; inside the 85-115 of the format).

Counts: 12 true · 5 imprecise · 0 false · 1 unverifiable from here. 1 ERROR, 5 WARN.

## Spoken claims

| # | Claim | Verdict | Proof | Smallest rewording |
|---|---|---|---|---|
| 1 | "Can an AI make this video by itself? Almost." | true | `CLAUDE.md` l.5: "Three things always wait for the user: the pick of a brief, the cost of a voice (said before it is spent), and the yes before anything is scheduled or published." | none |
| 2 | "A person picked the idea" | true | Orchestrator: three briefs shown, the user picked this one. `CLAUDE.md` l.37 "The user picks."; `NOTES.md` "The brief (picked by the user)" | none |
| 3 | "and says yes before it's posted" | true (as a rule; the yes has not been given yet) | `CLAUDE.md` l.47 "Nothing is scheduled or published without that yes."; `docs/PUBLISH.md` l.3 "only on the user's yes"; `skill/video-factory/SKILL.md` l.20 | none |
| 4 | "The AI did the rest." | **imprecise, ERROR** | For this video the person also chose the logo and the format (orchestrator), gave the brand colours (`NOTES.md`, "Brand: ..."; logo source file), must give the go for the voice cost (`CLAUDE.md` l.5, third gate; `NOTES.md` "Voice (after the user's go and the cost line)") and must hear the voice before it is used (`CLAUDE.md` l.32; `NOTES.md` "a real voice has to be chosen and heard by the user first"). The method also has the user validate the script (`CLAUDE.md` l.38) and judge the master by ear and eye (l.41, `docs/SOUND.md` "What the check cannot say": taste). "The rest" is literally false. | `The AI did | the *work*.` (same blocks, same length) or `The AI did | *most* of the rest.` |
| 5 | "For this video, it pitched three briefs" | true | Orchestrator: three briefs were shown. `CLAUDE.md` l.37; `formats/humour-express.md` Gates 1 | none |
| 6 | "wrote the script" | true | Written by an agent; `script.md`, `plan.json`; `CLAUDE.md` l.38 | none |
| 7 | "and a second agent checked every fact" | true (this file is that check; it stays true only if the ERROR above is fixed before the voice) | `.claude/agents/fact-checker.md`: "independently of the writer", "You did not write this script: assume it contains errors"; `CLAUDE.md` l.68 | none |
| 8 | "A synthetic voice reads it." | true on condition | Orchestrator: the final voice is a generated ElevenLabs voice. Today `voices/catalog.json` is still `REPLACE_ME` / `placeholder` and `voice.wav` is the espeak reference (`plan.json` `voice.engine: espeak-ng`), also synthetic. Confirm at the render that the take is the generated one. | none |
| 9 | "The scenes are drawn in code." | true on condition | `README.md` l.3 "entirely in code (Remotion, React, Python, ffmpeg)"; `style.md` l.8. No `Ep001_*.tsx` exists yet in `src/layers/scenes/` (only `Ep000_*`): true once they are built, and only if no image or video asset is added (`Media.tsx` exists for montages). | none |
| 10 | "Since it can't hear" | true | `CLAUDE.md` l.57 "Nobody in a session can hear, so sounds are chosen and mixes accepted on measurements."; `tools/sound_check.py` docstring "Nobody in the session can hear the result" | none |
| 11 | "sound effects are picked by measurement." | imprecise (WARN, simplification) | True for which file plays a role: `tools/sound_lib.py` docstring "chosen by measurement instead of by ear", verdicts `strong > plausible > weak > no match`, "A sound below `strong` is refused"; all 10 entries of `sounds/library.json` have `match.verdict: strong`; `sounds/kits/default.json`. Three limits: (a) the score comes from earshot, a listening model that compares the sound with a text description, so a model does "hear" for it; (b) which effect goes on which word (`plan.json` `sfx_events`: thud on "Almost", ding on "fact"...) was chosen by the writer, not measured; (c) the kit sounds were scored when the library was built, not for this video; the three new sounds of `NOTES.md` (clapper, stamp, machine-stop) are not in the library yet. | `sound effects | are *scored*, not heard.` or keep the line and add the three sounds with a `strong` score before the voice |
| 12 | "Then it renders" | true | `tools/render.sh` (Remotion render, draft and final), `tools/master.sh`; `CLAUDE.md` l.41 | none |
| 13 | "and stops. It waits for that yes." | true | Same as claim 3; `skill/video-factory/SKILL.md` l.20 "The scheduling call is made only after the user's yes" | none |
| 14 | "After a day and a week, the numbers shape the next one." | imprecise (WARN) | The rule exists: `docs/PUBLISH.md` step 7 "Numbers at about 24 h and 7 days after the slot"; `docs/RETENTION.md` §6 ("writes one dated line in the format's Lessons learned, and changes these rules when the numbers contradict them"); `tools/stats.py` docstring. But it has never happened in this repo: `stats/videos.json` is `[]`, the "Lessons learned" of `formats/humour-express.md` is empty, the only brand of `brands/brands.json` is `pending` with no scheduler id. Said in the present, after "For this video", it reads as a record. | `the *numbers* | will shape the *next* one.` |
| 15 | "It's open source" | true | `LICENSE`; public repo (orchestrator) | none |
| 16 | "MIT licensed" | true for the repo's own code; to disclose (WARN) | `LICENSE` l.1 "MIT License", "Copyright (c) 2026 video-factory contributors"; `package.json` l.13 `"license": "SEE LICENSE IN LICENSE"`. The engine cannot render without Remotion (`package.json` l.22, l.25), which is not MIT: `node_modules/remotion/LICENSE.md`, free for individuals, non-profits and for-profit organizations "with up to 3 employees", "a company license is required for for-profit organizations of a certain size". Nothing in `README.md`, `docs/` or `CLAUDE.md` says so. | Spoken line unchanged. Add one line to `README.md` and to the post description: "Rendering uses Remotion, which has its own licence (company licence above 3 employees)." |
| 17 | "The code's on GitHub" | unverifiable from here (WARN) | The orchestrator states the repo is public. This folder has no `.git` and `README.md` l.15 still says `git clone https://github.com/rzdhop/video-factory-pub`. Open the public URL logged out before the post, and replace `https://github.com/rzdhop/video-factory-pub`. | none |
| 18 | "link in the description." | imprecise (WARN) | A brand of this method is one Instagram + one TikTok account (`CLAUDE.md` l.54); a URL in a caption there is not clickable. `docs/RETENTION.md` §4 l.66 names the allowed places: "... or a link in the bio. One place". True as said only where the description carries a working link (YouTube, the repo page). | On Instagram / TikTok: `link in the *bio*.` (and put it there); elsewhere keep |

## Values and words on screen

| Item | Verdict | Proof / note |
|---|---|---|
| Opening title "CAN AN AI / MAKE THIS VIDEO / BY ITSELF?" | true | equals the spoken hook (`plan.json` `opening.title`) |
| HUD: THE · QUESTION, THE · LINE, THE · HUMAN, YOUR · TURN | no claim | chapter labels |
| BRIEF, SCRIPT, FACT CHECK, VOICE, SCENES, SOUND, RENDER | true | each is a step the repo has (claims 5 to 12) |
| YES | true | claim 3 |
| 24 H, 7 DAYS | true as rounded values | the repo says "about 24 h and 7 days" (`docs/PUBLISH.md` step 7); planned, not done (claim 14) |
| MIT | true | `LICENSE` |
| video-factory | true | `README.md` l.1, `package.json` name |
| Hook scene: the paper hand does two things only (picks one card, thumb up) | imprecise, same ERROR as claim 4 | the picture repeats "the person did only two things". Once claim 4 is reworded it reads as "the two decisions that are said", which is acceptable |
| Human scene: "nobody to press it", then the hand presses YES | true | consistent with claim 3 |
| Line scene: "a level meter with a needle instead of an ear" | true | consistent with claims 10 and 11 |

## Overclaims of what the AI did alone
1. "The AI did the rest" (claim 4): the person also chose the logo and the format, gave the colours, approves the voice cost and listens to the voice. Must change.
2. "an AI" / "it" covers several agents of one model run by a main session, on paid outside services (voice: ElevenLabs; scheduling: Metricool, `CLAUDE.md` l.18) and on an engine and method written beforehand with a person. Not false; do not add any on-screen word that suggests a single unattended program.
3. "picked by measurement" (claim 11): the placement of the effects is a writer's choice and the user still judges taste by ear (`docs/SOUND.md`, "What the check cannot say").

## What a sceptical developer would call misleading
- "MIT licensed" with no mention that the renderer (Remotion) needs a company licence above 3 employees (claim 16).
- "Open source" covers the code only: a real voice and the scheduling need paid third-party accounts. `README.md` says the demo "needs no account and no credit", which is the honest counterpart; keep it visible in the description.
- "the numbers shape the next one" with an empty `stats/videos.json` (claim 14).
- A GitHub link announced while `README.md` still holds `https://github.com/rzdhop/video-factory-pub` (claim 17).

## Simplifications to disclose (acceptable in speech)
- "a day and a week" = "about 24 h and 7 days".
- "second agent": the checker is one of several agents (writer, fact-checker, script-critic); "second" means "another than the writer".
- "measurement" = a score given by a listening model (earshot) plus level and timing measurements (`tools/sound_check.py`).

## Popular myths repeated
None.

## Fictional gags (not facts)
The empty director's chair, the conveyor and its stations, the paper hand, the YES button and barrier. "Would you give an AI the director's chair?" is a question.

## Errors in the script's own fact-check table
- Row 4 marks "The AI did the rest" as "imprecise, kept as a spoken shortcut": not acceptable for the central claim of a video about honesty of the method; see ERROR.
- Row 10 cites `docs/SOUND.md` l.3 for a sentence that is in `CLAUDE.md` l.57; `docs/SOUND.md` l.3 reads "Nobody in a session can hear. Sounds written by hand and never measured go wrong without anyone noticing".
- Row 15 says "true" without the Remotion licence note.
- Row 16: the allowed end place in `docs/RETENTION.md` §4 is "a link in the bio", not "in the description".

## ERROR (must fix before the voice)
1. Claim 4, "The AI did the rest": replace with `The AI did | the *work*.` or `The AI did | *most* of the rest.`

## WARN (should fix)
1. Claim 18: "link in the description" becomes "link in the *bio*" on Instagram / TikTok, and the link must really be there.
2. Claim 17: confirm the public GitHub URL (logged out) and replace `https://github.com/rzdhop/video-factory-pub` in `README.md` before publication.
3. Claim 16: state the Remotion licence in `README.md` and in the post description.
4. Claim 14: "will shape the next one" (nothing has been measured yet).
5. Claim 11: add the planned sounds with a `strong` score before the voice, or say "scored, not heard"; conditions of claims 8 and 9 to confirm at the render (generated voice, scenes in code only).
