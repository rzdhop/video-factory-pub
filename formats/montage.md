# Montage (`montage`)

Config: `formats/montage.json`. Shared pipeline and engine rules: the video-factory skill and `CLAUDE.md`. `docs/RETENTION.md` comes first for every new episode: frame 0 states the subject, funny and with impact (`opening`), nothing before the hook, shortest length that tells the idea.

## Identity
An edit in the style of video editors: real footage and images (what the user gives, plus licensed stock and public libraries) cut to a voice-over, with captions, motion-design inserts, sound design. The engine cuts files with the `media` scene; kit parts add titles, arrows and numbers on top.

## When to use
The user gives rushes, screen captures or photos, or asks for a "montage", a documentary-style or stock-footage video. This is the only code format where non-code pictures are the base.

## Discovery (references, skills, connectors)
Run phase 0 of `CLAUDE.md` (reference-scout agent), then add for this format:
- References: 3-5 edits in the targeted style (cut rhythm in cuts per 10 s, zooms, text style, B-roll density, sound design).
- Asset sources, checked at the time of use: free stock video/photo libraries (Pexels, Pixabay, Unsplash, Mixkit, Coverr), public-domain and open archives (Wikimedia Commons, NASA, Internet Archive, national libraries), music and effects libraries (YouTube Audio Library, Pixabay Music, Freesound CC0). Paid libraries only with the user's own subscription and files.
- Connectors: the cloud drive when the user's rushes live there; the voice service; a generative connector when a missing shot is generated instead of sourced (say so in the credits).

## Tone and writing
Free register, decided at the brief (documentary, punchy, funny). The voice-over is written to the pictures: no sentence without a picture that shows it. Hook in the first 2 s with the strongest shot available, not a title card.

## Structure
4-9 chapters, 40-60 s (ceiling 120 s). Hook shot → context → development in 2-5 beats → payoff → question or series cliffhanger. A shot holds 1-3 s; change picture on a spoken word (`media[].word`), never between two.

## Visual grammar
- Every chapter is a `"scene": "media"` with its ordered `media` list (see `docs/ENGINE_CONTRACT.md`): `cover` fit by default, a slow `push`/`pull`/`pan` on every still image, never a static frame.
- Files live in `episodes/<id>/assets/`; vertical 9:16 crops are chosen per item so the subject stays in the safe zone.
- Word-by-word captions and the HUD stay as in the other formats: they are what makes a montage look like the channel.
- Motion-design inserts (kit parts) at most one per chapter, for a number, a map, a name.

## Characters
Default none. Any registered character can host (the template `host`, or one created with `characters/README.md`: model sheet shown to the user before any render, own intro, own voice). With a host the engine uses the host layout (acting, close-ups, cold open); with `"character": "none"` the scene takes the whole frame. A host over footage sits in the bust framing; keep the important part of the picture out of the bottom-left.

## Sound and voice
Music at −16 dB; whoosh on cuts is already in the engine; add `sfx_events` on the 3-5 strongest cuts only. Original sound of the footage is muted by the engine. Voice: the narrator of the format json; tags by register.

## Fact-check
Narration as in the other formats. Plus provenance: every file has a line in `episodes/<id>/assets/CREDITS.md` (source link, author, licence, date checked) and a `credit` in its media item when the licence asks for attribution. No file whose licence is unclear. No photo or footage of a real person taken from the web: only what the user provides and has the right to use.

## Gates
1. Brief with references.
2. Script + asset list (each shot: file or source link, licence) shown together.
3. Go for the voice (cost said first).
4. Final video.

## Agents
Phase 0: reference-scout. After the brief: asset-scout (finds and documents the files) in parallel with fact-checker and script-critic. Then the orchestrator writes the `media` lists; qa-stills checks one still per item.

## Checks before delivery
One still per media item: subject inside the safe zone, no black bars, no watermark, credit readable where required, caption readable over bright footage; CREDITS.md complete; no shot longer than 4 s without motion.

## Lessons learned
- A sandboxed session can refuse downloads from some stock sites while others go through. When a site is refused, do not work around it: list the links and ask the user to attach the files or add them to the repo.

Add dated notes here after each episode.
