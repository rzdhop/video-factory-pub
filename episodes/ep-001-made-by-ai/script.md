# ep-001-made-by-ai — Can an AI make this video by itself?

Format: humour-express · Language: en · Preset: dark-2d · Look: video-factory · Character: host · Target: 35-40 s (ceiling 42) · 85-115 words
Voice: ElevenLabs, voice "River", model eleven_multilingual_v2 (`voice_elevenlabs.mp3`, 32.8 s raw, text = `voice_prompt.txt`; recorded in plan.json `tts`). The espeak reference is kept only for the alignment (`voice_ref_espeak.wav`). Final length after tightening and pauses: 28.3 s of speech, 29.3 s with the tail.

The presentation video of the open-source project video-factory, made with the engine it presents.
Tone: light and dry, no vulgarity, no insult (a project presentation). The travelling example is THIS video.
Narration fixed by the orchestrator after the independent fact check (`factcheck.md`) and critique (`critique.md`): 100 words.

<!-- Hooks (3 variants, docs/RETENTION.md rule 1). The picked one is the first, as given in the brief.
  1. PICKED  "Can an AI make this video by itself?"           (8 words; image: an empty film set, a director's chair marked AI with nobody in it)
  2.         "Who directed this video if nobody did?"         (7 words; same image; weaker: it sounds like a riddle)
  3.         "Why is nobody sitting in the director's chair?" (8 words; it describes the image instead of colliding with it)
  Frame 0: an empty film set in poster style: a director's chair with AI on its backrest and nobody in it, a
  clapperboard, the whole hook sentence written. The voice then says "almost". -->

## Narration (blocks separated by "|", accented word between *asterisks*)

### Hook — HUD: THE · QUESTION
Can an AI | make this video | by *itself*? | *Almost*. | It had to ask | a person | *three* times.

### Line — HUD: THE · LINE
It pitched three *ideas*; | a person *picked* one. | It wrote the script, | and a second *agent* | checked every *fact*. | It asked again | before paying | for the *voice*. | It drew every scene | in *code*. | It can't *hear*, | so it picks sounds | by their *score*.

### Human — HUD: THE · HUMAN
Then it renders, | and *stops*. | Last question: | may I *post* it?

### Question — HUD: YOUR · TURN
The engine | and its *rulebook* | are open *source*: | your AI | can make *yours*. | Would *you* give an AI | the director's *chair*? | The code's on *GitHub*, | link in the bio.

## Fact check

Every claim is about THIS repo and THIS video. "Proof" is the file of the repo that shows it, or a fact confirmed
by the orchestrator (the main session, which talks to the user). The independent check of the first draft is in
`factcheck.md`; this table is rewritten for the final narration and its wrong citations are fixed.

| # | Claim in the narration | Verdict | Proof |
|---|---|---|---|
| 1 | "Can an AI make this video by itself? Almost." | true | `CLAUDE.md` l.5: "Three things always wait for the user: the pick of a brief, the cost of a voice (said before it is spent), and the yes before anything is scheduled or published." |
| 2 | "It had to ask a person three times." | true: the three asks of the method, counted on screen (1 the idea, 2 the voice, 3 the post) | `CLAUDE.md` l.5 (the three things that wait for the user); `README.md` l.83: "Claude answers with three briefs, you pick one, and it stops again only before spending voice credits and before scheduling." |
| 3 | "It pitched three ideas; a person picked one." (ask 1) | true | Confirmed by the orchestrator: three briefs were shown and the user picked this one. `CLAUDE.md` l.37: "3 briefs built on the references ... The user picks." |
| 4 | "It wrote the script" | true | `episodes/ep-001-made-by-ai/script.md`, `plan.json`, written by an agent; `CLAUDE.md` Phases, 2. Script |
| 5 | "and a second agent checked every fact" | true | `episodes/ep-001-made-by-ai/factcheck.md` (that check, by an agent that did not write the script); `.claude/agents/fact-checker.md` ("independently of the writer"); `CLAUDE.md` l.68: "Checks that judge work (facts, script, stills) go to an agent that did not produce it" |
| 6 | "It asked again before paying for the voice." (ask 2) | true | Confirmed by the orchestrator: the user is asked for the voice and its cost before generation. `CLAUDE.md` l.5 ("the cost of a voice (said before it is spent)"); `skill/video-factory/SKILL.md` "Spend credits only after the user's go". The take used is the generated one: `voice_elevenlabs.mp3` (ElevenLabs, "River", eleven_multilingual_v2), see plan.json `tts` |
| 7 | "It drew every scene in code." | true | `src/layers/scenes/Ep001_shared.tsx`, `Ep001_hook.tsx`, `Ep001_line.tsx`, `Ep001_human.tsx`, `Ep001_question.tsx` (SVG drawn by React components, no image or video file); `README.md` l.3 ("entirely in code (Remotion, React, Python, ffmpeg)") |
| 8 | "It can't hear" | true | `CLAUDE.md` l.57: "Nobody in a session can hear, so sounds are chosen and mixes accepted on measurements."; `docs/SOUND.md` l.3: "Nobody in a session can hear." |
| 9 | "so it picks sounds by their score." | true, with a simplification to disclose (below) | `tools/sound_lib.py` docstring ("chosen by measurement instead of by ear"; verdicts `strong` > `plausible` > `weak` > `no match`; "A sound below `strong` is refused"); `sounds/library.json` (`match.z`, `match.verdict` of every sound); the sounds added for this video are listed in `NOTES.md` with their score |
| 10 | "Then it renders" | true | `tools/render.sh`, `tools/master.sh` |
| 11 | "and stops. Last question: may I post it?" (ask 3) | true | Confirmed by the orchestrator: nothing is posted without the user's yes. `CLAUDE.md` l.47: "Nothing is scheduled or published without that yes."; `docs/PUBLISH.md` l.3 ("only on the user's yes"); `skill/video-factory/SKILL.md` l.20 |
| 12 | "The engine and its rulebook are open source" | true for the repo's own code and method; see the Remotion note below | `LICENSE` l.1 "MIT License"; public repo https://github.com/rzdhop/video-factory-pub (confirmed by the orchestrator). "rulebook" = `CLAUDE.md`, `docs/`, `formats/`, `skill/video-factory/`, `.claude/agents/` |
| 13 | "your AI can make yours." | true, with a simplification to disclose (below) | `README.md` "Using it with Claude" l.77-83 and "Make it yours"; the demo "needs no account and no credit" (`README.md` "Try the demo") |
| 14 | "Would you give an AI the director's chair?" | a question, not a claim | |
| 15 | "The code's on GitHub" | true | https://github.com/rzdhop/video-factory-pub, public, MIT (confirmed by the orchestrator). To do before the post: replace `https://github.com/rzdhop/video-factory-pub` in `README.md` l.15 |
| 16 | "link in the bio." | true only if the link is in the bio of the account when the video goes out | `docs/RETENTION.md` §4: the end line names ONE place, "a link in the bio", "only a place that exists when the video goes out" |

**Words drawn on screen**

| Item | Verdict | Proof |
|---|---|---|
| Opening title "CAN AN AI / MAKE THIS VIDEO / BY ITSELF?" | equals the spoken hook | `plan.json` `opening.title` |
| `AI` on the backrest of the empty director's chair | a gag (the chair reserved for the AI), no claim | fictional |
| Ask counter: three marks, filled at "picked one" (1), "for the voice" (2), "may I post it" (3) | true | claims 2, 3, 6, 11 |
| Station signs IDEAS, SCRIPT, FACT CHECK, VOICE, CODE, SCORE | true | claims 3 to 9 |
| `YES` (the button) | true | claim 11 |
| `MIT` (the tag) | true for the repo's code | `LICENSE` l.1 |
| `video-factory` (next to the logo) | true | `README.md` l.1, `package.json` name |

**Notes to disclose**

- **Remotion has its own licence.** The repo's code is MIT, but the renderer it depends on, Remotion
  (`package.json` l.22 and l.25), is not MIT: `node_modules/remotion/LICENSE.md` grants free use to individuals,
  non-profits and for-profit organizations "with up to 3 employees"; larger companies need a company licence.
  Say it in the post description and in `README.md`: "Rendering uses Remotion, which has its own licence."
- "your AI can make yours": the method is written for Claude with agents (`README.md` l.3 and l.77-83); a real
  voice and scheduling need the user's own accounts on outside services (`README.md` l.81); the demo needs none.
- "picks sounds by their score": the score comes from earshot, a listening model that compares a sound with a text
  description (`tools/sound_lib.py`); which effect goes on which word is the writer's choice, and the user still
  judges taste by ear (`docs/SOUND.md`).
- "an AI" / "it" covers several agents of one model run by a main session. No on-screen word suggests a single
  unattended program.
- "second agent" means "another agent than the writer".

Not claimed anywhere: a number of users, virality, results, or that no human is involved.
No person, account or brand of a user is named in the narration or on screen. Claude is not named in the narration.
Fictional gags: the empty director's chair marked AI, the conveyor and its stations, the paper hand, the YES button.

## Follow call
`"follow_call": false` in plan.json (the switch read by `tools/lint_plan.py`, also set in the demo episode; it is
not described in `docs/`): this is a project presentation, so there is no spoken "follow" at one third. The end
line sends to ONE place: the GitHub repo, "link in the bio".
