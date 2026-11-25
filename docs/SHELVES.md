# Shelves: how a visitor of the profile sorts the videos

Someone who lands on the profile must see at once which videos go together, in which order, and be able to follow
one saga or one kind of episode only. Every episode therefore sits on ONE shelf, and the shelf shows in three places.

## The registry: `brands/shelves.json`
One entry per saga and per kind of standalone episode: `kind` (`saga` or `solo`), `brand`, `label` (the big words of
the band, per language), `sub` (solo shelves: the small line), `tag` (the words of the caption tag), `color` (one
colour per shelf, never reused on the same brand), `hashtag` (the shelf's own, always the same), `series` (saga: its
slug) or `default_for.character` (the shelf an episode of that host takes when nothing else is said).
`python3 tools/shelf.py` lists them; `python3 tools/shelf.py <episode_id>` says where an episode sits and why
(plan.json `series`, else plan.json `"shelf"`, else the host's default shelf).

A fresh repo holds one example shelf. When a brand has no shelf of its own yet, the AI proposes the first ones at
the first brief: one per saga, and one per kind of standalone episode the user plans (for example one for serious
explainers, one for absurd facts).

## Where the shelf shows
1. **The cover**: `python3 tools/cover.py <id>` draws the band under the hook, inside the crop of the profile grids:
   the big figure (`3/4` for a saga part, `0` for an episode 0, `SOLO` for a standalone episode), the shelf label, a
   small line (`SAGA · PART 3 OF 4`), a language flag when the brand posts in two languages. Same place, same size
   on every cover: the grid then reads as coloured rows.
2. **The caption**: only a SAGA part carries the shelf tag in brackets (`[<Saga> 3/4]`) at the start, with the saga's
   hashtag first. A STANDALONE episode's caption is the description only: no bracket tag, no shelf hashtag. The cover
   band (point 1) stays on every episode, saga or standalone: the visual sorting is kept, only the tag is dropped.
3. **The profile**: part 1 of the running saga (and its episode 0) pinned; one TikTok playlist per saga when the
   account has the feature; one Instagram highlight per shelf is possible. These are set by the user in the apps.

## A new saga or a new kind of episode
Its shelf is chosen at the brief (bible gate for a saga): label of 14 characters at most, a colour no other shelf of
the brand uses and that is not the accent of the look, a hashtag nobody else owns (search it first). Add it to the
registry before the first cover. An episode never changes shelf after publication.

## Setting the covers
See "Covers and sorting" in `docs/PUBLISH.md`: the scheduler sets the Instagram cover of a scheduled post
(`videoThumbnailUrl`); the TikTok cover of a personal account and every cover of a post already out are set by the
user in the apps.
