#!/usr/bin/env python3
"""Align the blocks of an episode on the word timings of a transcription of the RAW voice take (your speech provider's
speech-to-text, `words.json`), instead of the espeak DTW of align_audio.py. Use it when the DTW drifts, which happens
when the voice prompt spells acronyms ("V T L zéro" for VTL0) and the reference does not.

Usage:
  align_words.py <episode_dir> <words.json> <raw_voice.wav> [--max-pause 0.26] [--tempo 1.12] [--thresh-db -40]
                 [--sub "VTL0=V T L zéro" ...]

The raw take is the file given to tighten_voice.py (before tightening). The cut map of tighten_voice.py is recomputed
with the same parameters, so raw word times map onto the tightened voice (pauses cut, then /tempo).
`--sub` lists the spoken forms used in the voice prompt (written=spoken), so block words can be matched to the
transcript tokens. Blocks are matched in order, by token count; a mismatch of the token text is reported, not fatal.

Run it right after align_audio.py (it rewrites the block and chapter times of episode.json; voice.wav stays the
tightened human voice), before retime.py. If retime.py already ran, restore episode_pre_retime.json and
voice_pre_retime.wav first (this tool refuses an episode marked as retimed).
"""
import argparse, json, pathlib, re, sys, unicodedata
import numpy as np, librosa

ap = argparse.ArgumentParser()
ap.add_argument("ep_dir"); ap.add_argument("words"); ap.add_argument("raw")
ap.add_argument("--max-pause", type=float, default=0.26)
ap.add_argument("--tempo", type=float, default=1.08)
ap.add_argument("--thresh-db", type=float, default=-40)
ap.add_argument("--sub", action="append", default=[])
a = ap.parse_args()

ep_dir = pathlib.Path(a.ep_dir)
ep = json.loads((ep_dir / "episode.json").read_text())
if ep.get("retimed") or ep.get("retime_applied"):
    sys.exit("episode.json is retimed: restore episode_pre_retime.json and voice_pre_retime.wav first")

# ---- cut map of tighten_voice.py (same algorithm): raw sample -> tightened sample (before tempo)
y, sr = librosa.load(a.raw, sr=None, mono=True)
hop = 256
rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=hop)[0]
silent = librosa.amplitude_to_db(rms + 1e-9, ref=1.0) < a.thresh_db
runs, i = [], 0
while i < len(silent):
    if silent[i]:
        j = i
        while j < len(silent) and silent[j]: j += 1
        runs.append((i * hop, j * hop)); i = j
    else:
        i += 1
cuts = []  # (raw start of removed span, raw end of removed span)
max_len = int(a.max_pause * sr)
xf = int(0.012 * sr)
for s, e in runs:
    if s == 0 or e >= len(y) - hop:
        lim = int(0.15 * sr)
        if e - s > lim:
            cuts.append((s + lim, e) if s == 0 else (s + lim, e))
        continue
    if e - s > max_len:
        cuts.append((s + max_len // 2, e - max_len // 2))


def raw_to_out(t: float) -> float:
    """Seconds in the raw take -> seconds in the tightened, tempo-changed voice."""
    x = t * sr
    removed = 0
    for s, e in cuts:
        if x >= e: removed += e - s
        elif x > s: removed += x - s
    return (x - removed) / sr / a.tempo


# ---- tokens
def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", s)


subs = [tuple(x.split("=", 1)) for x in a.sub]
def tokens(text: str) -> list[str]:
    for w, s in subs:
        text = text.replace(w, s)
    text = re.sub(r"\[[^\]]*\]", " ", text)
    return [t for t in text.split() if norm(t)]


tw = [w for w in json.loads(pathlib.Path(a.words).read_text())["words"]
      if w.get("type", "word") == "word" and not w["text"].startswith("[") and norm(w["text"])]
k, bad = 0, 0
for w in ep["words"]:
    tok = tokens(w["text"])
    seg = tw[k:k + len(tok)]
    if len(seg) < len(tok):
        sys.exit(f"transcript ran out at block '{w['text']}'")
    if [norm(t) for t in tok] != [norm(s["text"]) for s in seg]:
        bad += 1
        print(f"WARN  block '{w['text']}' ~ transcript '{' '.join(s['text'] for s in seg)}'")
    w["t_start"], w["t_end"] = round(raw_to_out(seg[0]["start"]), 3), round(raw_to_out(seg[-1]["end"]), 3)
    k += len(tok)
if k != len(tw):
    print(f"WARN  {len(tw) - k} transcript word(s) left after the last block")

# ---- chapters, as align_audio.py does
dur = librosa.get_duration(path=str(ep_dir / "voice.wav"))
for c in ep["chapters"]:
    first = next(w for w in ep["words"] if w["chapter"] == c["key"])
    c["t_start"] = round(max(0.0, first["t_start"] - 0.22), 3)
ep["chapters"][0]["t_start"] = 0.0
for c0, c1 in zip(ep["chapters"], ep["chapters"][1:]):
    c0["t_end"] = c1["t_start"]
ep["chapters"][-1]["t_end"] = round(dur + 0.4, 3)
ep["duration"] = round(dur + 1.0, 3)
(ep_dir / "episode.json").write_text(json.dumps(ep, ensure_ascii=False, indent=1))
print(f"aligned {len(ep['words'])} blocks on the transcript ({bad} text mismatch(es)); voice {dur:.1f}s; "
      f"last block ends at {ep['words'][-1]['t_end']:.2f}s")
