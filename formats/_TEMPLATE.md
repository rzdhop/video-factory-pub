# <Format name> (`<id>`)

Copy this file to `formats/<id>.md`, copy a `formats/*.json` to `formats/<id>.json`, fill both, run `python3 tools/formats.py`.
`docs/RETENTION.md` applies to every format before this sheet (first second, length, ending, cover, measurement): do not restate it, only say what this format adds. Keep every `## ` heading below, in this order: tools and agents look them up by name. Write rules, not history; put dated lessons in the last section.

## Identity
One paragraph: what the viewer gets, what makes this format recognisable in 2 seconds, what it never does.

## When to use
The words in the user's request that select this format, and the neighbouring format it must not be confused with.

## Discovery (references, skills, connectors)
What phase 0 looks for in this format: reference creators and designs to study, skills and connectors worth loading.

## Tone and writing
Voice of the narration, joke policy, vulgarity level, hook rules, forbidden things.
<!-- Language: the sheet holds for every language of the engine (`docs/LANGUAGE.md`). Add a line per language only
     where the rule differs (lexicon, pronunciation, sign-off). -->

## Structure
Chapters in order, with their job and length. Ending rule.

## Visual grammar
What is on screen, how it moves, the recurring elements that make two episodes of this format look like siblings.

## Characters
Default host (or none), how an existing or new character is used in this format.

## Sound and voice
Music level and mood, effects budget, voice tags, pronunciation rules.

## Fact-check
What must be sourced and how strictly.

## Gates
What the user validates, in order. Everything between two gates runs without waiting.

## Agents
Which roles of `.claude/agents/` run, and what runs in parallel.

## Checks before delivery
The format-specific points to look at on the stills and the final file.

## Lessons learned
Dated notes from real episodes (what the user corrected and why, what the numbers showed). When a note holds for
every episode, move it up into the rules and keep only the reason.
