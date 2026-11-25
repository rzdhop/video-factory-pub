# Sound: library, kits and the check

Nobody in a session can hear. Sounds written by hand and never measured go wrong without anyone noticing: a
synthesized "flush" scored `no match` for "a toilet flushing" (it sounded like bubbles under water) while a real
recording scored `strong`. The rule: **a sound is chosen and a mix is accepted on numbers**, the same way for every
format.

## The three parts
| Part | Where | What it does |
|---|---|---|
| Library | `sounds/library.json` + `sounds/files/*.wav` (committed) | Every sound an episode may play, with its source, licence, author, the description it was scored against and the verdict. Builds read these files only: no network, no model, same result everywhere. |
| Kit | `sounds/kits/<id>.json` | One library sound per role: `riser`, `whoosh`, `cut_hit` (chapter cuts), `accent` (accented words), and the gag roles `plop flush thud pop ding boom`. `plan.json` `"sound_kit": "<id>"` picks it; `tools/new_episode.py` writes `default` (or the format's `sound_kit`). |
| Check | `tools/sound_check.py <episode_dir> [--master out/<id>.master.mp4]`, also a step of `tools/check.sh` | Effects on their cues, levels against the voice, library files unchanged, credits owed, master loudness. Writes `sound_report.json`. |

A plan without `sound_kit` falls back to effects synthesized by `tools/build_sfx.py`; new episodes always have a kit.

## Setup (once per machine or session, about 1 min 15)
`bash tools/setup_sound.sh` installs earshot (pinned version) and its two models (1.1 GB).
`tools/sound_check.py` installs it by itself when it is missing; `tools/build_sfx.py` never needs it.

## Adding a sound (`tools/sound_lib.py`)
Always describe the sound in plain English, the way one would caption it ("a toilet flushing", "a heavy thud impact").
1. Synthesized, from the earshot bank (transitions, whooshes, hits, pops, clicks, keys, glitches, notifications):
   `python3 tools/sound_lib.py pick <id> "<description>" --kind <kind>` ranks the bank sounds of that kind and keeps
   the best (`earshot sfx list` shows ids and kinds). `bank <id> <bank_id> --desc ...` takes one by name (`--dur` to shorten).
2. A real recording (anything the bank does not have: flush, glass, animals, crowd, objects):
   `python3 tools/sound_lib.py find <id> "<description>" --query "<search words>" [--max-dur 3]` searches Openverse,
   downloads the candidates, ranks them and keeps the best one, trimmed and normalised.
3. A file of the user's own: `python3 tools/sound_lib.py import <id> <file> --desc ...`.
A sound that does not reach `strong` is refused (`--accept plausible` to override, and say why in the commit).
Try two or three descriptions before overriding: short clicks score badly on vague words ("a tick" works, "a soft click" does not).
Then use it: `"kind": "<id>"` in `sfx_events` (any library id works when the plan has a `sound_kit`), or give it a role in a kit.
Add the sound BEFORE the voice is generated, so the gag is written for a sound that exists.

Licences: `find` keeps `cc0`, `pdm` (public domain) and `by` by default. `by` owes a credit:
`python3 tools/sound_lib.py credits <episode_dir>` prints the lines to add to the caption, and `sound_check.py`
warns while they are owed. `nc` (no commercial use) and `nd` (no derivative) are not searched: a monetised video
that mixes the sound breaks both. The user can decide otherwise per sound (`--license`).

Network: the search API (`api.openverse.org`) only returns links. The files live on the sources' own hosts, and a
sandboxed session may refuse some of them (403) until the user allows the host in the session's network settings;
some hosts throttle (the tool waits, retries and caches). When a host refuses, the tool says so and stops: report
the host's name to the user, never route around it.

## How much sound
- Big effects (gain 0.4 or more): one every 8 to 12 s in a humour format, one every 15 to 20 s in a serious one
  (`big_sfx_every_s` in the format json). More than that and nothing reads as a punchline: 21 sound events and 14
  music stops in 66 s is a wall of noise.
- One music stop per punchline; stops closer than 2.5 s are merged by `tools/build_sfx.py`.
- Keep big effects off the beats where the scene carries the information: with a host, a big effect also triggers a
  close-up that hides the scene.

## Levels
Each library sound is set to the loudness (loudest 50 ms) of the synthesized sound its role replaces, so `gain`
in `sfx_events` and the 0.4 threshold of a big punchline keep one meaning. A kit role can add `gain_db`.
`sound_check.py` compares every plan effect and cut hit with the loud syllables of the voice; the accepted range is
-8 to +10 dB (mixes judged good by ear sat between -2 and +7 dB). Music and effects must sit at least 10 dB under
the voice while it speaks. The master is at -14 LUFS (`tools/master.sh`).

## What the check cannot say
Taste. earshot is reliable on loudness, timing and "is this the right kind of sound"; it does not judge whether a
sound is funny or whether the music is good. The user still judges those by ear on the master; report the check's
numbers in plain words with the video.
