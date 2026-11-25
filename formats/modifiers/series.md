# Series (modifier, works with every format)

A series is several episodes of ONE format that tell one story or cover one subject in parts. It is not a format: the format sheet still rules the tone and the look; this file adds what keeps the parts consistent.

## Start
`python3 tools/new_episode.py <id> --format <fmt> --series <slug> --part 1 --total N` creates the episode and `series/<slug>/bible.md` from `series/_BIBLE_TEMPLATE.md`. Fill the bible BEFORE writing part 1 and show it to the user with the brief: it is a gate. The whole arc (one line per part) is validated once; each part then goes through its format's normal gates.

## Rules
- Each part works alone: a viewer who lands on part 3 understands it. Recap in one sentence (max 4 s) placed AFTER the hook, never before.
- Each part pays one promise and opens the next one. The format's ending rule "close the story, no part 2 tease" is replaced by: pay this part's promise, then one cliffhanger line, then the question.
- The last part pays the series promise set in part 1 and calls back its first image.
- Earlier parts are called back by name ("in episode zero, the map was drawn", "the vault of part two"), and every part keeps the angle of the series.
- One language per saga: `series/<slug>/lang.json`, stored by the first part (`docs/LANGUAGE.md`).
- One voice per saga: `series/<slug>/voice.json` (`{"voice": "<id of voices/catalog.json>"}`), fixed at the bible gate; a hosted saga keeps the host's own voice.
- One look per saga: `series/<slug>/look.json` (`docs/LOOKS.md`), chosen with the user at the bible gate from a preview; two sagas of the same format can look completely different, the parts of one saga never do.
- Same host, voice, look, HUD label convention, recurring witness or mascot, music tempo and caption style in every part: they are fixed in the bible, not re-decided.
- Drawing helpers of part 1 (the stage, the recurring subject) are exported and reused by the later parts, not redrawn.
- Running gags and facts already told are logged in the bible after each part (section "State"), so no part repeats or contradicts another.
- Cover: the shelf band of the saga with `n/N` in big figures (`tools/cover.py`, `docs/SHELVES.md`); the saga gets its shelf (label, colour, hashtag) in `brands/shelves.json` at the bible gate. The caption starts with `[<Saga> n/N]`. The HUD badge comes from `plan.json` `series`.
- The end line sends to the next part by name when it is already out, else to the saga on the profile (`docs/RETENTION.md` §4).
- Produce parts one at a time unless the user asks for a batch; when batching, scripts for all parts are written and validated first, then scenes are built in parallel (one scene-builder per chapter, several episodes at once).
- A saga whose `total` is reached is finished: it is no longer offered as a subject.
