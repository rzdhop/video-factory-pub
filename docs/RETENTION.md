# Retention rules (every format, every new episode)

Why: on short-video platforms most strangers decide in the first one or two seconds, before any joke, and few
finish a video of more than a minute. Nothing guarantees a viral video; these rules remove the known reasons a
stranger swipes away, and `tools/stats.py` measures whether they work so the rules follow the numbers, not opinions.
These rules come BEFORE the format sheet: a format decides the tone, never whether the first second is clear.

## 1. The first second states the subject, funny and with impact
- **Frame 0 = the subject + the gag.** The absurd image of the topic is on screen at full brightness and the WHOLE hook
  sentence is written (plan.json `opening`). Not a face, not a title card, not a logo, not a fade-in.
- **Frame 0 is an object, not a diagram.** One concrete thing everyone knows (a boot screen, a banana, a login box),
  already altered by the subject. An abstract opening (a rail with three labels, a schema) fails the stranger test.
- **The hook sentence is the point, not a label.** At most 9 words; it names the object, makes the absurd or startling
  claim, and is already funny or startling on its own. "Bananas" is a label. "Why are bananas
  slightly radioactive?" is a hook. Write 3 hooks per brief and keep the one a stranger would repeat to a friend.
- **The hook is a question, in plain spoken language**, in the language of the video (`docs/LANGUAGE.md`). A question
  the video then answers or explains, said the way a person talks, never a written-sounding statement or a punchline
  built for the screen (two clipped sentences with a twist sound like machine copy). The image can still contradict
  the question. Read it aloud: if nobody would say it like that, rewrite it.
- **The hook names what the viewer owns or knows.** A hook made of jargon fails; the same idea told through the
  viewer's own PC, password, phone or kitchen passes. A question the video answers is not enough alone: what makes
  people stay is the promise, a real and concrete thing with a bit of dream.
- **Four tests on frame 0** (qa-stills and script-critic apply them first): sound off, 1 second, a stranger who never
  saw the channel: (1) what is it about? (2) why is it weird or funny? (3) would the image alone make someone stop?
  (4) is every word readable in the 3:4 centre crop (it is also the cover)? One "no" = rewrite the opening.
- **Image and sentence say two different things that collide** (the sentence states, the image exaggerates or
  contradicts). An image that only illustrates the sentence is half a hook.
- **Nothing before the hook.** No greeting, no name, no "today we talk about". The signature comes after the promise
  is complete, or at the very end, or not at all.
- **The spoken first words are the hook sentence** (or its natural spoken form), finished by 3 s.

## 2. The first 3 to 15 seconds pay and re-hook
- By 3 s the promise is complete: the viewer knows what they will get if they stay.
- Between 3 and 8 s: the first real punchline or proof ("yes, it is true, and it is worse"), with a visible change.
- The answer starts being paid before 15 s, with a first clear illustration. After that the episode can go deep.
- An open loop is planted in the hook and paid in the last quarter, never earlier.
- The first 2 seconds after every cut show something complete, above all the cut that follows the hook: an empty
  stage waiting for its elements is where viewers leave.

## 3. Nothing lasts
- A cut or a strong visual change every 3-5 s; no shot, face or scene idea held longer.
- One fact or one story per video. Every sentence raises the stakes or is the twist; cut the rest.
- Length: as short as the idea allows. Default 30-45 s. Above 60 s only when a plot or an explanation needs it; the
  format's `duration_s.max` is a hard limit. The user may decide that a format stays long; then the first 15 s carry
  even more weight.

## 4. The follow call and the end
- **One follow call at one third of the video** (between 28 % and 40 % of the words), spoken, one sentence of 3 s at
  most, placed right after a payoff, never before the first proof and never in the middle of an explanation. It says
  why to follow. On screen the captions carry it and the scene keeps moving: no card, no stop.
- **The same promise again at the end**, in the last line.
- **The promise is always the true one, only its wording changes.** It is what the brand really posts, written in
  the brand's `content` in `brands/brands.json`. The scope of the promise never narrows to the episode: "one video a
  day on <the subject of this episode>" is false unless the brand really does that.
- **Each video words it differently.** Be inventive on the angle, not on the facts: what the viewer becomes by
  following, what the channel refuses to do, or a real earlier video cited by what it showed (read the titles and
  hooks in `stats/catalog.json` and `episodes/*/script.md` first; never cite a video that is not out, never announce a
  subject that is not produced). Never the same sentence twice; the ones already used are in
  `ideas/follow_lines.md`. Two episodes of the same week do not send to the same earlier video under two different
  names. Written like the rest of the narration: spoken, no slogan.
- **A rhythm in the sentence is a promise**: "one video a day" follows `weekly_target` of the brand in
  `brands/brands.json` (7 = one a day). If the target changes, the sentence changes ("three a week"). No target set:
  no rhythm in the sentence.
- **End order**: pay the promise → (series: the cliffhanger line) → the binary question tied to the stakes
  (comments) → the end line: the follow promise and ONE place to go, in a single sentence. The place is the next
  part of the saga, the saga from its start, another episode of the same shelf, or a link in the bio. One place
  only, and only a place that exists when the video goes out and holds what the video says it holds.
- A closing question is seen only by those who reach the end: when the average watch time is a third of the length,
  expect few comments from it, and plant the stakes of the question early.
- No goodbye and no recap. The last image still matches the first (same object) so the loop restarts cleanly.
- Series: the recap of the previous part comes AFTER this part's hook.
- `tools/lint_plan.py` warns when a new episode has no follow call near the first third or in its last lines.

## 5. Cover, title, post: the viewer who opens the profile must be able to sort
- Cover = the opening frame (subject + hook sentence, readable as a thumbnail) **plus the shelf band**
  (`tools/cover.py`, `docs/SHELVES.md`): the name of the saga and `n/N` in big figures for a part, the name of the
  shelf for a standalone episode, one colour per shelf. On the profile grid a stranger must see in one look which
  videos go together and in which order. A dark, nearly empty frame or a face with one word is not a cover.
- The cover is uploaded as the post's own cover on both networks; the frame the app picks by itself is never kept.
- Post caption: for a SAGA part, FIRST the shelf tag in brackets (`[<Saga> 2/4]`), then the hook sentence.
  For a STANDALONE episode, no shelf tag and no shelf hashtag: the caption is the description only. Either way: clean
  wording (no insult in title, cover text or caption), the closing question, and 3-5 topical hashtags (the saga's
  hashtag first for a saga part). The cover band stays on every episode.

## 6. Measure every video
After publishing: `python3 tools/stats.py add <id> ...` at about 24 h and 7 days (views, average watch time, % watched
to the end, second where most viewers leave, likes, shares, saves). `python3 tools/stats.py` prints the scoreboard.
- Read first the share of viewers who pass 3 s: reach tends to follow it. A working aim is 60 %.
- Then the average watch time as a share of the length, then saves and shares (they say the video was worth keeping).
- Small samples are hints, not verdicts.
At the close of each episode the orchestrator reads the scoreboard, writes one dated line in the format's "Lessons
learned", and changes these rules when the numbers contradict them. One variable is changed at a time between two
episodes when possible, so a difference can be attributed.
