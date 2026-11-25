#!/usr/bin/env python3
"""Quality gate for an episode.json: timing, accents, chapter lengths. Exit 1 on errors, warnings printed.
Duration bounds come from the episode's format (formats/<id>.json) when episode.json has `format`, else 40-95 s."""
import json, sys, pathlib
ep = json.loads(pathlib.Path(sys.argv[1]).read_text())
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import lang as langs
LANG = langs.of_episode(ep)
dur_min, dur_max, dur_src = 40, 95, ""
if ep.get("format"):
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
    import formats
    try:
        _d = formats.load(ep["format"])["duration_s"]
        dur_min, dur_max, dur_src = _d["min"], _d["max"], f" (format {ep['format']})"
    except (ValueError, KeyError, TypeError) as exc:
        print("WARN ", f"format '{ep['format']}' not usable ({exc}): default duration bounds 40-95s")
errors, warns = [], []
words, chapters = ep["words"], ep["chapters"]
for i, w in enumerate(words):
    nxt = words[i + 1]["t_start"] if i + 1 < len(words) else w["t_end"]
    shown = nxt - w["t_start"]
    n = langs.counted_words(w["text"], LANG)  # articles do not count (rule per language: tools/lang.py)
    if n > 4: errors.append(f"block {i} '{w['text']}': {n} words (max 4)")
    if shown < 0.35: errors.append(f"block {i} '{w['text']}': shown {shown:.2f}s (< 0.35s)")
    elif shown < 0.6: warns.append(f"block {i} '{w['text']}': shown {shown:.2f}s (< 0.6s)")
    if w.get("accent") and len(w["accent"].split()) > 2: warns.append(f"block {i}: accent spans {len(w['accent'].split())} words")
for c in chapters:
    d = c["t_end"] - c["t_start"]
    if d > 16: warns.append(f"chapter {c['key']}: {d:.1f}s (> 16s)")
    if d < 4: warns.append(f"chapter {c['key']}: {d:.1f}s (< 4s)")
if not (dur_min <= ep["duration"] <= dur_max): warns.append(f"duration {ep['duration']}s outside {dur_min}–{dur_max}s{dur_src}")
accents = sum(1 for w in words if w.get("accent"))
if accents / len(words) > 0.6: warns.append(f"{accents}/{len(words)} blocks accented: too many")
for w in warns: print("WARN ", w)
for e in errors: print("ERROR", e)
print(f"{len(words)} blocks, {len(chapters)} chapters, {ep['duration']}s, {accents} accents, language {LANG}")
sys.exit(1 if errors else 0)
