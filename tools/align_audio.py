#!/usr/bin/env python3
"""Align a human voice recording to the script's blocks by DTW against an espeak reference.

Usage: align_audio.py <episode_dir> <human_voice.(wav|mp3|m4a)>
Reads episode.json (espeak timings), builds MFCC sequences of both audios, runs DTW,
maps every block boundary onto the human recording, rewrites episode.json + voice.wav.
Works because both audios say the same words in the same order; no ASR needed.
"""
import json, sys, pathlib, subprocess
import numpy as np, librosa, soundfile as sf

ep_dir = pathlib.Path(sys.argv[1]); human_in = pathlib.Path(sys.argv[2])
ep = json.loads((ep_dir / "episode.json").read_text())
SR, HOP = 16000, 160  # 10 ms frames

def load(path):
    y, _ = librosa.load(str(path), sr=SR, mono=True)
    return y

ref = load(ep_dir / (ep["voice"].get("ref_file") or "voice.wav"))
hum = load(human_in)

def feats(y):
    m = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=20, hop_length=HOP, n_fft=400)
    m = (m - m.mean(1, keepdims=True)) / (m.std(1, keepdims=True) + 1e-6)
    return m

D, wp = librosa.sequence.dtw(X=feats(ref), Y=feats(hum), metric="euclidean", subseq=False)
wp = wp[::-1]  # (ref_frame, hum_frame) increasing
ref_f, hum_f = wp[:, 0], wp[:, 1]

def map_t(t_ref):
    f = t_ref * SR / HOP
    i = np.searchsorted(ref_f, f)
    i = min(max(i, 0), len(hum_f) - 1)
    return float(hum_f[i] * HOP / SR)

for w in ep["words"]:
    w["t_start"], w["t_end"] = round(map_t(w["t_start"]), 3), round(map_t(w["t_end"]), 3)
for c in ep["chapters"]:
    c["t_start"], c["t_end"] = round(map_t(c["t_start"]), 3), round(map_t(c["t_end"]), 3)
# chapter boundaries: just before the chapter's first spoken block (inside the pause), contiguous
for c in ep["chapters"]:
    first = next((w for w in ep["words"] if w["chapter"] == c["key"]), None)
    if first:
        c["t_start"] = round(max(0.0, first["t_start"] - 0.22), 3)
ep["chapters"][0]["t_start"] = 0.0
for a, b in zip(ep["chapters"], ep["chapters"][1:]):
    a["t_end"] = b["t_start"]
ep["chapters"][-1]["t_end"] = round(len(hum) / SR + 0.4, 3)
ep["duration"] = round(len(hum) / SR + 1.0, 3)
ep["voice"] = {"file": "voice.wav", "lang": ep["voice"]["lang"], "engine": "human", "ref_file": "voice_ref_espeak.wav"}
# a new alignment is never "retimed": tools/retime.py refreshes its backups from an unmarked episode.json
for k in ("retimed", "retime_applied"):
    ep.pop(k, None)
# keep the espeak reference for future re-alignments, write the human voice as voice.wav
src = ep_dir / "voice.wav"
if not (ep_dir / "voice_ref_espeak.wav").exists():
    src.rename(ep_dir / "voice_ref_espeak.wav")
y_full, sr_full = librosa.load(str(human_in), sr=None, mono=True)
sf.write(str(ep_dir / "voice.wav"), y_full, sr_full)
(ep_dir / "episode.json").write_text(json.dumps(ep, ensure_ascii=False, indent=1))
print(f"aligned: {len(ep['words'])} blocks onto {len(hum)/SR:.1f}s of speech (ref {len(ref)/SR:.1f}s)")
