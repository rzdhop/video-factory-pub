# ep-001-made-by-ai — independent script critique

Read: `docs/RETENTION.md`, `formats/humour-express.md`, `skill/video-factory/SKILL.md`, `script.md`, `plan.json`,
`style.md`, `NOTES.md`, `CLAUDE.md` (the three gates), `README.md`. Nothing was edited except this file.
Language: `lang: en (English)`, from plan.json. Judged as a native listener.

## Lint
```
ERROR chapter hook: scene 'ep001-hook' is not registered (no *_SCENES export of src/layers/scenes has it): it would render blank
ERROR chapter line: scene 'ep001-line' is not registered (...)
ERROR chapter human: scene 'ep001-human' is not registered (...)
ERROR chapter question: scene 'ep001-question' is not registered (...)
lint ep-001-made-by-ai: 4 error(s), 0 warning(s) · 4 chapters, 35 blocks, 106 words (about 33 s), 3 big sfx, format humour-express
```
The 4 errors are the scenes not built yet (expected at this round, see NOTES.md). No script error from the lint.

## Opening (RETENTION rule 1): passes, keep the hook
- 8 words, a spoken question, nothing before it, host hidden at frame 0, title whole on screen.
- Sound off, one second, a stranger: (1) subject clear, the sentence says it; (2) odd: the video questions itself
  and the director's chair is empty; (3) the image alone is calm, an empty chair on a flat set is the weak point;
  (4) three short lines, should hold in the 3:4 crop (to check on the still).
- Image and sentence: the image answers "yes, nobody is here", the voice says "almost". A mild collision, enough.
- Spoken hook ends at about 2.9 s at 2.8 words a second: inside the 3 s rule with no margin.

## Scores
| Point | /10 | Why |
|---|---|---|
| Hook | 8 | Passes every mechanical rule; the frame-0 image is quiet |
| Promise by 3 s | 7 | The question is complete at about 2.9 s; what the viewer gets is implied, not said |
| Proof by 8 s | 4 | 0 to 9.3 s is only claims. The first thing shown as proof ("three briefs") lands near 10.5 s |
| Rhythm | 6 | Cuts near 9.5, 23.5 and 32 s. The `line` chapter is about 13.6 s in one scene, saved only by one station per phrase |
| Clarity for a stranger | 3 | The project is never named or described, and nothing says why to open the repo |
| Ending | 6 | Binary question and image loop are right; the two lines around it pay nothing |
| Format consistency | 6 | Word count fine; one-fact rule and calm-technical settings not followed (see WARNs) |

Other points asked of a critic: gap in the first 2 s yes (shown and said). Open loop: planted at 0 s, paid at 3.3 s
("Almost"), then closed completely by 9 s; the rule asks for the last quarter. Chapter ends: `hook` ends on a mild
pull, `line` ends on its one joke, `human` ends flat ("shape the next one"). Humour: two dry lines in twelve
sentences ("Almost", "Since it can't hear"); no insult, none repeated. Weakest three lines: "The AI did the rest",
"the numbers shape the next one", "It's open source, MIT licensed".

## Does a stranger understand WHAT it is and WHY open the repo? No.
After 40 s the viewer knows "an AI made this video and a person approved it". They do not know that the thing being
presented is a video engine plus the rules an AI follows, that it has a name, or that they can use it for their own
videos. "The code's on GitHub" is the code of what? This matters more than every other remark here.

## ERRORs (must fix)

### E1. "It's open source" says the AI is open source
Block: `It's open source, | MIT *licensed*.`
For three chapters "it" is the AI ("it pitched", "it renders", "It waits"). The next "It" is heard as the AI too.
The AI is not open source; the engine and the method are. The sentence is also the only place the project could be
described, and it describes nothing. Replacement (13 words for 5, paid for by E3's cut; MIT stays on screen as
the drawn tag):
```
The engine | and its *rulebook* | are open *source*: | your AI | can make *yours*.
```
"your AI can make yours" is a new claim: the fact-checker must confirm it against README "Using it with Claude"
(the method is written for Claude and needs a voice service for a real voice).

### E2. The hook chapter gives away the twist, and the count is wrong
Block: `A person picked | the *idea*, | and says *yes* | before it's posted. | The AI did | the *rest*.`
- At 6 s the viewer is told about the final yes. At 25 s the twist is "it stops and waits for that yes": already known.
  The loop is closed 30 s before the end, so nothing holds the viewer through the list.
- `CLAUDE.md` l.5 names THREE things that wait for the user (brief, voice cost, yes before publishing). The script
  shows two and then says "the AI did the rest", which the script's own fact check marks imprecise.
- "picked ... and says" mixes tenses; a native ear trips on it.
Replacement (8 words for 16): it plants a counted loop, paid at about 8 s, 17 s and 27 s:
```
*Almost*. | It had to ask | a person | *three* times.
```

### E3. One sentence is a second topic, vague, and reads as translated
Block: `After a day | and a week, | the *numbers* | shape the *next* one.`
Which numbers, the next what? "shape" is the abstract verb of machine copy; "after a day and a week" is not how
anyone says it. It comes after the twist and weakens it, it is not yet true of this video (fact check 14), and the
format allows one fact only. Cut it whole (12 words, about 4.3 s). Replacement for the `human` chapter, which now
pays the third ask:
```
Then it renders, | and *stops*. | Last question: | may I *post* it?
```

### E4. Too long for the ceiling as written
106 words at 2.8 words a second is 37.9 s of speech; add the three pauses of plan.json (1.0 s) and three chapter
gaps (about 2 s): about 41 s against a hard ceiling of 42 s, before any slow word ("MIT", "GitHub", "measurement").
The lint's "about 33 s" is optimistic and the espeak reference is 46.4 s. The full replacement below is 100 words
with one pause less work to do: about 38.5 s.

## WARNs (should fix)

### W1. The `line` chapter: a list of three and three passives in a row
Block: `it pitched three *briefs*, | wrote the script, | and a second *agent* | checked every *fact*. | A synthetic *voice* reads it. | The scenes | are drawn in *code*. | Since it can't *hear*, | sound effects | are picked by *measurement*.`
- "pitched, wrote, and checked" is the three-beat list; "reads it / are drawn / are picked" hides who acts.
- You pitch ideas, you write briefs; "briefs" is also shop talk for a stranger, and "idea" is the word the hook uses.
- "picked by measurement" is vague and stiff. It is the best joke of the script and deserves plain words.
- "For this video," can go: the hook already said "this video".
Replacement (43 words for 38; it carries asks one and two):
```
It pitched three *ideas*; | a person *picked* one. | It wrote the script, | and a second *agent* | checked every *fact*. | It asked again | before paying | for the *voice*. | It drew every scene | in *code*. | It can't *hear*, | so it picks sounds | by their *score*.
```
"It asked again before paying for the voice" is true of the method (`CLAUDE.md` l.5) and TO CONFIRM for this video
once the voice is made. If the chapter must be shorter, cut "and a second agent checked every fact" last, not first:
it is what a developer finds credible.

### W2. "link in the description"
Block: `The code's on *GitHub*, | link in the description.`
On TikTok and Instagram a link in the caption cannot be tapped; `docs/RETENTION.md` §4 says "a link in the bio".
On the GitHub README the viewer is already in the repo. Replacement, same length, if the video goes to a feed:
```
The code's on *GitHub*, | link in the bio.
```
Keep "description" only if the first place it is posted has tappable descriptions. Either way the last frame should
show the project name next to the logo (already in the list of drawn words), so the name is read even where no
link works.

### W3. The close-up on "Almost" hides the set 3 s in
plan.json `direction`: `{"chapter": "hook", "word": "Almost", "emotion": "wink", "shot": "close"}`.
The host is hidden at frame 0 and arrives directly as a close-up that dims the set, on a template character no
stranger knows. RETENTION §2: the seconds after the hook must show something complete. Let the clapper snap carry
"Almost". Replacement:
```json
{"chapter": "hook", "word": "Almost", "emotion": "wink", "shot": "bust"}
```
That leaves one close-up, on "stops" (deadpan), which is the right one. For it to work, the YES button of
`style.md` must appear on "Last question", not on "stops": a close-up dims the drawing that has to be read.

### W4. "fact" is set as a big punchline
plan.json `sfx_events`: `{"chapter": "line", "word": "fact", "kind": "ding", "gain": 0.42}`.
At 0.4 and above the music stops and the camera hits; "checked every fact" is not a punchline and the format wants
one stop, before the twist. Replacement: `"gain": 0.3`.

### W5. Calm-technical settings of the format sheet are claimed in style.md but not applied in plan.json
`style.md` line 10 invokes the calm technical staging. The sheet then asks for softer music (−19 dB, 90 bpm) and
1-2 light effects; plan.json has `"bpm": 100, "level_db": -17` and 8 `sfx_events`. Frame 0 also lists a "spotlight
stand", which is a decor prop the same rule forbids. Either apply the numbers (`"bpm": 90, "level_db": -19`, keep
the effects on Almost, stops and post) or say in NOTES.md why this episode is not the calm variant.

### W6. Frame 0 would stop more thumbs with one word on the chair
The empty chair only illustrates "nobody". Write `AI` on the chair's backrest in the accent: a director's chair
reserved for an AI, and empty. The image then says something the sentence does not. One word to add to the list
of drawn words in the fact check.

### W7. Words a stranger meets without help
"agent" (fine for developers, opaque for creators: the station label FACT CHECK on screen covers it), "renders"
(fine with the RENDER label). No change asked if the labels are drawn as planned.

## The five changes with the most effect, as one paste
100 words (17 + 43 + 11 + 29), about 38.5 s.
```
### Hook — HUD: THE · QUESTION
Can an AI | make this video | by *itself*? | *Almost*. | It had to ask | a person | *three* times.

### Line — HUD: THE · LINE
It pitched three *ideas*; | a person *picked* one. | It wrote the script, | and a second *agent* | checked every *fact*. | It asked again | before paying | for the *voice*. | It drew every scene | in *code*. | It can't *hear*, | so it picks sounds | by their *score*.

### Human — HUD: THE · HUMAN
Then it renders, | and *stops*. | Last question: | may I *post* it?

### Question — HUD: YOUR · TURN
The engine | and its *rulebook* | are open *source*: | your AI | can make *yours*. | Would *you* give an AI | the director's *chair*? | The code's on *GitHub*, | link in the bio.
```
What follows from it, for whoever applies it (not done here):
- plan.json word anchors that no longer exist: `sfx_events` "briefs" (now "ideas"), "measurement" (now "score"),
  "that yes" (now "post"); `direction` hook "idea", "says yes", "rest"; line "this video", "briefs", "voice" stays,
  "scenes" (now "scene"), "measurement"; human "waits", "that yes", "day", "next"; question "open" stays.
  `retime.pauses` (Almost, stops, Would you) still match.
- style.md: the hand that picks a card moves from `hook` to `line` ("picked"); the 24 H and 7 DAYS counters go;
  the YES button appears on "Last question" and is pressed after "post"; drawn words lose 24 H and 7 DAYS.
- Fact check: claims 2, 3, 4, 13, 14 change or go; new claims "three times" (CLAUDE.md l.5), "asked before
  paying for the voice", "your AI can make yours".
- `voice_prompt.txt` is rebuilt from the new text.

If only a light touch is wanted, the minimum is E1 and E3: cut the numbers sentence and spend its words on what
the project is.

## Three alternative hooks (information only: the picked hook is the user's and it passes)
1. "Who made this video if nobody directed it?" (8 words). Frame 0: the same set, the clapperboard slate reads
   DIRECTOR: with a blank after it.
2. "Can an AI make a video without you?" (8 words). Frame 0: the director's chair with YOU on the backrest,
   pushed out of the set, half out of frame.
3. "What happens if an AI directs the video?" (8 words). Frame 0: the empty chair with a megaphone lying on the
   seat, its cable plugged into a wall socket.
None beats the picked hook: "this video" is what makes a stranger look twice.
