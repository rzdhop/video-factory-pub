#!/usr/bin/env python3
"""Tighten a narration: shorten pauses longer than --max-pause to that length, then speed up by --tempo
(pitch preserved, ffmpeg atempo). Keeps the source sample rate. Usage:
  tighten_voice.py in.mp3 out.wav [--max-pause 0.26] [--tempo 1.08] [--thresh-db -40]
"""
import argparse, subprocess, pathlib, numpy as np, soundfile as sf, librosa

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("dst")
ap.add_argument("--max-pause", type=float, default=0.26)
ap.add_argument("--tempo", type=float, default=1.08)
ap.add_argument("--thresh-db", type=float, default=-40)
a = ap.parse_args()

y, sr = librosa.load(a.src, sr=None, mono=True)
hop = 256
rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=hop)[0]
db = librosa.amplitude_to_db(rms + 1e-9, ref=1.0)
silent = db < a.thresh_db
# runs of silence
runs, i = [], 0
while i < len(silent):
    if silent[i]:
        j = i
        while j < len(silent) and silent[j]: j += 1
        runs.append((i * hop, j * hop)); i = j
    else:
        i += 1
keep = []
pos = 0
max_len = int(a.max_pause * sr)
xf = int(0.012 * sr)
removed = 0.0
for s, e in runs:
    if s == 0 or e >= len(y) - hop:  # leading/trailing silence: trim to 0.15 s
        lim = int(0.15 * sr)
        if e - s > lim:
            keep.append(y[pos:s + (lim if s == 0 else 0)]) if s == 0 else keep.append(y[pos:s + lim])
            removed += (e - s - lim) / sr; pos = e
        continue
    if e - s > max_len:
        mid = s + max_len // 2
        seg = y[pos:mid]
        nxt_start = e - max_len // 2
        # crossfade the cut
        if len(seg) > xf:
            seg = seg.copy(); seg[-xf:] *= np.linspace(1, 0, xf)
        keep.append(seg)
        head = y[nxt_start:nxt_start + xf].copy() * np.linspace(0, 1, xf)
        keep.append(head)
        pos = nxt_start + xf
        removed += (e - s - max_len) / sr
keep.append(y[pos:])
out = np.concatenate(keep)
tmp = pathlib.Path(a.dst).with_suffix(".tight.wav")
sf.write(str(tmp), out, sr)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af", f"atempo={a.tempo}", "-ar", str(sr), a.dst], check=True)
tmp.unlink()
print(f"pauses removed: {removed:.1f}s, tempo x{a.tempo}: {len(y)/sr:.1f}s -> {len(out)/sr/a.tempo:.1f}s @ {sr} Hz")
