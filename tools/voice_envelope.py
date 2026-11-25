#!/usr/bin/env python3
"""Measure the real voice, one value per video frame, so the character's mouth and body follow it.

Writes into episode.json:
  "mouth": {"open": [0..1 per frame], "wide": [0..1 per frame]}
    open = loudness of the voice (jaw opening), wide = brightness of the sound
           (1 = spread lips "i / é / s", 0 = rounded lips "o / ou")
Run after every step that changes voice.wav (align_audio.py, retime.py).
Usage: voice_envelope.py <episode_dir>
"""
import json, pathlib, sys
import numpy as np
from _audio import load

ep_dir = pathlib.Path(sys.argv[1])
ep_path = ep_dir / "episode.json"
ep = json.loads(ep_path.read_text())
fps = ep["fps"]
SR = 16000
y, _ = load(ep_dir / ep["voice"]["file"], sr=SR)
n_frames = int(np.ceil(ep["duration"] * fps))
hop = SR / fps
win = int(hop * 1.5)
window = np.hanning(win)
freqs = np.fft.rfftfreq(win, 1 / SR)
rms = np.zeros(n_frames)
cent = np.zeros(n_frames)
for f in range(n_frames):
    a = int(f * hop)
    seg = y[a:a + win]
    if len(seg) < win:
        seg = np.pad(seg, (0, win - len(seg)))
    rms[f] = np.sqrt(np.mean(seg ** 2) + 1e-12)
    mag = np.abs(np.fft.rfft(seg * window))
    cent[f] = float((mag * freqs).sum() / (mag.sum() + 1e-9))

# loudness -> jaw: dB scale between the noise floor and the loud syllables, then a fast-attack / slow-release smoother
db = 20 * np.log10(rms + 1e-9)
voiced = db[db > db.max() - 45]
lo, hi = np.percentile(voiced, 12), np.percentile(voiced, 92)
raw = np.clip((db - lo) / (hi - lo + 1e-9), 0, 1)
open_ = np.zeros(n_frames)
v = 0.0
for f in range(n_frames):
    k = 0.75 if raw[f] > v else 0.45  # opens fast, closes a bit slower
    v += (raw[f] - v) * k
    open_[f] = v
open_[open_ < 0.06] = 0.0

# brightness -> lip shape, only meaningful while the mouth is open
c = np.clip((cent - 700) / (2600 - 700), 0, 1)
wide = np.convolve(c, np.ones(3) / 3, mode="same") * (open_ > 0)

ep["mouth"] = {"open": [round(float(x), 2) for x in open_], "wide": [round(float(x), 2) for x in wide]}
ep_path.write_text(json.dumps(ep, ensure_ascii=False, indent=1))
talk = float((open_ > 0).mean())
print(f"mouth: {n_frames} frames, speaking {talk * 100:.0f} % of the time")
