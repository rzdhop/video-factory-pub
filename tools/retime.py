#!/usr/bin/env python3
"""Re-cut the aligned voice without regenerating it (zero TTS credit). Run AFTER align_audio.py.

Reads plan.json "retime":
  {
    "intro_after": "<word>",     # cold open: move the greeting right after the block containing this word
    "intro_blocks": 2,           # how many leading blocks form the greeting (default 2: "Hello," + "it's <name>.")
    "pauses": [                  # comic pauses: silence inserted right before a block
      {"chapter": "<chapter key>", "word": "<word>", "add": 0.35}
    ],
    "tail": 1.0                  # seconds of picture kept after the voice ends (default 1.0)
  }
Rewrites voice.wav + episode.json (words, chapters, duration) and marks the result:
  "retimed": true, "retime_applied": {"intro_after", "intro_blocks", "pauses", "source"}

Note for the skill (how re-runs work):
- The pre-retime state lives in episode_pre_retime.json + voice_pre_retime.wav.
- episode.json NOT marked `retimed` = fresh from build_episode.py / align_audio.py (a new voice take):
  both backups are REFRESHED from the current episode.json + voice.wav, then the retime is applied.
  A new take is never replaced by an old backup.
- episode.json marked `retimed` = a re-run after a change of plan.json: timings and audio restart from the
  backups, and every non-timing key is taken from the CURRENT episode.json (look, format, series, host_set,
  id, title, preset, character, fps, any unknown key; per chapter: label, scene, hud, transition, media, ...).
  Nothing added to episode.json after the first retime is lost. Safe to run any number of times.
- An unmarked episode.json written by an older version of this tool is recognised (its blocks have the same
  durations as the backup's) and treated as marked.
- `mouth`, `acting`, `music` and `sfx` describe the old timeline: they are dropped. Always re-run
  voice_envelope.py, direct.py and build_sfx.py after this tool.
- The chapters (keys) or the blocks (texts) changed since the backup: the tool stops; run build_episode.py
  and align_audio.py again (a retime cannot follow a script change).
Usage: retime.py <episode_dir>
"""
import json, pathlib, shutil, sys
import numpy as np
from _audio import load, save, source_rate

# top-level keys of episode.json this tool computes (words, chapters, duration), takes from the backup with
# the audio (voice) or drops because the rest of the chain recomputes them on the new timeline
# (voice_envelope.py: mouth · direct.py: acting · build_sfx.py: music, sfx)
RECOMPUTED = {"words", "chapters", "duration"}
FROM_BACKUP = {"voice"}
STALE = {"mouth", "acting", "music", "sfx"}
MARKS = {"retimed", "retime_applied"}
CHAPTER_TIMING = {"t_start", "t_end"}


def derived_from(cur, bak):
    """True when the blocks of `cur` are the blocks of `bak` moved in time (same texts, same durations):
    what an older retime.py, which did not mark its output, wrote from this backup."""
    def sig(ep):
        return sorted((w["chapter"], w["text"], round(w["t_end"] - w["t_start"], 3)) for w in ep["words"])
    a, b = sig(cur), sig(bak)
    return len(a) == len(b) and all(x[:2] == y[:2] and abs(x[2] - y[2]) <= 0.0021 for x, y in zip(a, b))


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    ep_dir = pathlib.Path(sys.argv[1])
    plan = json.loads((ep_dir / "plan.json").read_text())
    cfg = plan.get("retime") or {}
    ep_path, voice_path = ep_dir / "episode.json", ep_dir / "voice.wav"
    ep_bak, voice_bak = ep_dir / "episode_pre_retime.json", ep_dir / "voice_pre_retime.wav"
    cur = json.loads(ep_path.read_text())

    # ---- 0. which state is episode.json in?
    have_bak = ep_bak.exists() and voice_bak.exists()
    if cur.get("retimed"):
        if not have_bak:
            sys.exit("retime: episode.json is marked `retimed` but episode_pre_retime.json / voice_pre_retime.wav "
                     "are missing: run build_episode.py and align_audio.py again")
        state = "re-run from the backups"
    elif have_bak and derived_from(cur, json.loads(ep_bak.read_text())):
        state = "re-run from the backups (episode.json written by an older retime.py)"
    else:
        shutil.copy(ep_path, ep_bak)
        shutil.copy(voice_path, voice_bak)
        state = "new alignment: backups " + ("refreshed" if have_bak else "created")
    ep = json.loads(ep_bak.read_text())
    if [c["key"] for c in ep["chapters"]] != [c["key"] for c in cur["chapters"]]:
        sys.exit("retime: the chapters of episode.json differ from episode_pre_retime.json: "
                 "run build_episode.py and align_audio.py again")
    if sorted((w["chapter"], w["text"]) for w in ep["words"]) != sorted((w["chapter"], w["text"]) for w in cur["words"]):
        sys.exit("retime: the blocks of episode.json differ from episode_pre_retime.json (script changed): "
                 "run build_episode.py and align_audio.py again")

    sr = source_rate(voice_bak)
    y, _ = load(voice_bak, sr=sr)
    words = ep["words"]
    total = len(y) / sr

    # ---- 1. describe the new timeline as an ordered list of pieces: source ranges and silences
    # every block owns the audio from its start to the next block's start (its trailing pause travels with it)
    starts = [w["t_start"] for w in words] + [total]
    starts[0] = 0.0
    order = list(range(len(words)))
    n_intro = int(cfg.get("intro_blocks", 2))
    if cfg.get("intro_after"):
        key = cfg["intro_after"].lower()
        anchor = next((i for i, w in enumerate(words) if i >= n_intro and key in w["text"].lower()), None)
        if anchor is None:
            sys.exit(f"retime: no block after the intro contains '{cfg['intro_after']}'")
        order = list(range(n_intro, anchor + 1)) + list(range(n_intro)) + list(range(anchor + 1, len(words)))

    pause_before, applied_pauses = {}, []
    for p in cfg.get("pauses", []):
        hit = next((i for i, w in enumerate(words)
                    if w["chapter"] == p["chapter"] and p["word"].lower() in w["text"].lower()), None)
        if hit is None:
            print(f"WARN  pause: no block '{p['word']}' in chapter '{p['chapter']}'")
        else:
            pause_before[hit] = float(p.get("add", 0.3))
            applied_pauses.append({"chapter": p["chapter"], "word": p["word"], "add": pause_before[hit]})

    # ---- 2. render the audio and remember where each block landed
    fade = int(0.008 * sr)
    out, cursor, new_start = [], 0.0, {}

    def piece(a, b):
        seg = y[int(a * sr):int(b * sr)].copy()
        if len(seg) > 2 * fade:  # short fades hide the cut
            seg[:fade] *= np.linspace(0, 1, fade)
            seg[-fade:] *= np.linspace(1, 0, fade)
        return seg

    for pos, i in enumerate(order):
        if i in pause_before:
            out.append(np.zeros(int(pause_before[i] * sr), dtype=np.float32))
            cursor += pause_before[i]
        a, b = starts[i], starts[i + 1]
        moved = pos + 1 < len(order) and order[pos + 1] != i + 1
        if moved:
            # a block that gets a new neighbour keeps at most 0.2 s of its trailing pause
            b = min(b, max(words[i]["t_end"] + 0.2, a + 0.05))
        seg = piece(a, b)
        out.append(seg)
        new_start[i] = cursor
        cursor += len(seg) / sr

    voice = np.concatenate(out)
    # A voice processed AFTER an earlier retime (polish, EQ, a manual fix) is not in the backup: this re-run
    # rebuilds voice.wav from the backup and would lose it. Keep the current file aside so nothing is destroyed.
    if not state.startswith("new alignment") and voice_path.is_file():
        try:
            old_voice, old_sr = load(voice_path, sr)
            same = old_sr == sr and len(old_voice) == len(voice) and np.allclose(old_voice, voice, atol=2e-4)
        except Exception:
            same = False
        if not same:
            keep = ep_dir / "voice_before_rerun.wav"
            shutil.copy(voice_path, keep)
            print(f"retime: the current voice.wav differs from the re-cut one (processed after the last retime, "
                  f"or the plan changed): kept as {keep.name}. Re-apply any processing to the new voice.wav.")
    save(voice_path, voice, sr)

    # ---- 3. timings: from the backup, moved
    for i, w in enumerate(words):
        d = w["t_end"] - w["t_start"]
        w["t_start"] = round(new_start[i], 3)
        w["t_end"] = round(new_start[i] + d, 3)
    words.sort(key=lambda w: w["t_start"])
    timing = []
    for c in ep["chapters"]:
        first = next((w for w in words if w["chapter"] == c["key"]), None)
        timing.append({"t_start": round(max(0.0, first["t_start"] - 0.22), 3) if first else c["t_start"]})
    timing[0]["t_start"] = 0.0
    for a, b in zip(timing, timing[1:]):
        a["t_end"] = b["t_start"]
    dur = len(voice) / sr
    tail = float(cfg.get("tail", 1.0))  # seconds of picture after the voice file ends (plan.json retime.tail)
    timing[-1]["t_end"] = round(dur + min(0.4, tail), 3)

    # ---- 4. everything else: from the CURRENT episode.json (keys keep their place in the file)
    chapters = []
    for c_cur, c_bak, t in zip(cur["chapters"], ep["chapters"], timing):
        chap = {k: v for k, v in c_cur.items() if k not in CHAPTER_TIMING}
        for k, v in c_bak.items():  # a field only the backup has (never the case in practice) is kept too
            if k not in CHAPTER_TIMING:
                chap.setdefault(k, v)
        chap.update(t)
        chapters.append(chap)
    computed = {"words": words, "chapters": chapters, "duration": round(dur + tail, 3)}
    result = {}
    for k, v in cur.items():
        if k in STALE or k in MARKS:
            continue
        if k in RECOMPUTED:
            result[k] = computed[k]
        elif k in FROM_BACKUP:
            result[k] = ep.get(k, v)
        else:
            result[k] = v
    for k in ("duration", "chapters", "words"):
        result.setdefault(k, computed[k])
    result["retimed"] = True
    result["retime_applied"] = {"intro_after": cfg.get("intro_after") or None, "intro_blocks": n_intro,
                                "pauses": applied_pauses, "source": ep_bak.name}
    ep_path.write_text(json.dumps(result, ensure_ascii=False, indent=1))
    dropped = sorted(k for k in cur if k in STALE)
    print(f"retime ({state}): {total:.2f}s -> {dur:.2f}s, intro moved: {bool(cfg.get('intro_after'))}, "
          f"pauses: {len(pause_before)}")
    print("first blocks:", " | ".join(f"{w['t_start']:.2f} {w['text']}" for w in words[:6]))
    print("next: voice_envelope.py, direct.py, build_sfx.py" +
          (f" (dropped from episode.json, on the old timeline: {', '.join(dropped)})" if dropped else ""))


if __name__ == "__main__":
    main()
