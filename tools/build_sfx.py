#!/usr/bin/env python3
"""Synthesize the music + sound-design track from episode.json timings (no samples, no downloads, no credits).

What it writes (stereo, 44.1 kHz) to <episode_dir>/sfx.wav:
- MUSIC: a real beat (kick, clap, hats, saturated bass, plucked arpeggio, pad) in A minor.
  Every chapter restarts on a downbeat, so each cut of the video lands exactly on beat 1.
  Chapters alternate arrangements (intro / full / half / outro) so the energy keeps moving.
- STOPS: the music drops out for a breath right before each big punchline (sfx_events with gain >= 0.4
  and every retime pause), then comes back: the joke lands on silence.
- DUCKING: the music follows the real voice and steps back while it speaks.
- SFX: riser + whoosh + impact on chapter changes, a soft tok on accented words, gag sounds on demand.

plan.json (all optional):
  "music": {"bpm": 100, "level_db": -15, "sections": {"<chapter key>": "intro|full|half|outro|none"}}
  "sfx_events": [{"chapter", "word", "kind", "gain"?, "offset"?}]
  "sound_kit": "default"   -> the effects come from the sound library (sounds/library.json) through the kit
                              sounds/kits/<id>.json, which names one library sound per role (riser, whoosh,
                              cut_hit, accent, plop, flush, thud, pop, ding, boom). `kind` is then a role of
                              the kit or any library id. Each library sound is set to the loudness of the
                              synthesized sound it replaces, so `gain` keeps its meaning.
                              Without "sound_kit" (older episodes) the effects are the synthesized
                              ones below and `kind` is plop|flush|thud|pop|ding|boom: old episodes rebuild as before.
Also sets episode.json "sfx" and "music" (bpm, used by the picture to pulse on the beat), and writes
<episode_dir>/sfx_cues.json: every effect placed (time, role, sound, gain), read by tools/sound_check.py.
Usage: build_sfx.py <episode_dir>      Re-run after every retiming.
"""
import json, pathlib, sys
import numpy as np
from _audio import load, save

ep_dir = pathlib.Path(sys.argv[1])
ep_path = ep_dir / "episode.json"
ep = json.loads(ep_path.read_text())
plan_path = ep_dir / "plan.json"
plan = json.loads(plan_path.read_text()) if plan_path.exists() else {}
mcfg = plan.get("music") or {}
SR = 44100
BPM = float(mcfg.get("bpm", 100))
BEAT = 60.0 / BPM
STEP = BEAT / 4  # sixteenth note
dur = ep["duration"] + 0.5
N = int(SR * dur)
rng = np.random.default_rng(7)
music = np.zeros((N, 2))
fx = np.zeros((N, 2))


# ---------- helpers ----------
def place(bus, sig, t, gain=1.0, pan=0.0):
    """Add a mono or stereo signal at time t. pan in [-1, 1] (constant power)."""
    i0 = int(round(t * SR))
    if i0 >= N or i0 + len(sig) <= 0:
        return
    if i0 < 0:
        sig, i0 = sig[-i0:], 0
    i1 = min(N, i0 + len(sig))
    seg = sig[: i1 - i0] * gain
    if seg.ndim == 1:
        a = (pan + 1) * np.pi / 4
        bus[i0:i1, 0] += seg * np.cos(a)
        bus[i0:i1, 1] += seg * np.sin(a)
    else:
        bus[i0:i1] += seg


def band(x, lo, hi):
    """Zero-phase band-pass in the frequency domain with soft edges."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    resp = 1 / (1 + (lo / np.maximum(f, 1e-6)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * resp, len(x))


def env(L, a=0.002, r=0.08):
    x = np.ones(L)
    na, nr = max(1, int(a * SR)), max(1, min(L, int(r * SR)))
    x[:na] = np.linspace(0, 1, na)
    x[-nr:] *= np.linspace(1, 0, nr) ** 2
    return x


def norm(x, peak=1.0):
    return x / (np.abs(x).max() + 1e-9) * peak


def reverb(x, seconds=1.1, wet=0.25):
    """Cheap stereo room: convolution with two decaying noise tails."""
    L = int(seconds * SR)
    t = np.arange(L) / SR
    out = np.zeros((len(x) + L - 1, 2))
    dry = x if x.ndim == 2 else np.stack([x, x], axis=1)
    for ch in (0, 1):
        ir = band(rng.standard_normal(L) * np.exp(-t * 5.5), 250, 6000)
        ir /= np.sqrt((ir ** 2).sum())
        n = len(dry) + L - 1
        out[:, ch] = np.fft.irfft(np.fft.rfft(dry[:, ch], n) * np.fft.rfft(ir, n), n) * wet
    out[: len(dry)] += dry
    return out


# ---------- instruments ----------
def kick():
    L = int(0.32 * SR); t = np.arange(L) / SR
    f = 48 + 120 * np.exp(-t * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)
    click = band(rng.standard_normal(L), 1500, 6000) * np.exp(-t * 400) * 0.5
    return np.tanh((body + click) * 2.2) * env(L, 0.001, 0.06)


def clap():
    L = int(0.26 * SR); t = np.arange(L) / SR
    e = np.exp(-t * 26)
    for d in (0.0, 0.011, 0.022):  # three tiny bursts: the "hands" of a clap
        e += np.exp(-np.maximum(t - d, 0) * 260) * (t >= d)
    return norm(band(rng.standard_normal(L), 900, 5200) * e, 0.9) * env(L, 0.001, 0.05)


def hat(open_=False):
    L = int((0.22 if open_ else 0.06) * SR); t = np.arange(L) / SR
    return norm(band(rng.standard_normal(L), 7000, 15000) * np.exp(-t * (16 if open_ else 80)), 0.8)


def bass(freq, length):
    L = int(length * SR); t = np.arange(L) / SR
    sig = sum(np.sin(2 * np.pi * freq * k * t) / k for k in range(1, 7))
    sig = np.tanh(sig * 1.6)  # saturation adds the harmonics a phone speaker can play
    return band(sig, 60, 900) * env(L, 0.006, min(0.12, length * 0.5)) * (0.75 + 0.25 * np.exp(-t * 6))


def pluck(freq, length=0.5, bright=1.0):
    L = int(length * SR); t = np.arange(L) / SR
    sig = np.zeros(L)
    for k in range(1, 6):
        sig += np.sin(2 * np.pi * freq * k * t + 0.3 * k) * np.exp(-t * (5 + 4 * k / bright)) / k ** 1.3
    sig += 0.5 * np.sin(2 * np.pi * freq * 1.004 * t) * np.exp(-t * 6)  # detune for width
    return sig * env(L, 0.002, 0.06)


def pad_chord(freqs, length):
    L = int(length * SR); t = np.arange(L) / SR
    out = np.zeros((L, 2))
    for f in freqs:
        for ch, det in ((0, 0.997), (1, 1.003)):
            out[:, ch] += np.sin(2 * np.pi * f * det * t + rng.uniform(0, 6.28)) + 0.3 * np.sin(2 * np.pi * 2 * f * det * t)
    fade = max(1, min(L // 2, int(0.6 * SR)))
    e = np.ones(L); e[:fade] = np.linspace(0, 1, fade); e[-fade:] *= np.linspace(1, 0, fade)
    return out * e[:, None] / len(freqs)


KICK, CLAP, HAT, OHAT = kick(), clap(), hat(), hat(True)
A = 110.0
semi = lambda n: A * 2 ** (n / 12)
# A minor loop: Am - F - C - G. (bass root, chord tones for the arpeggio, in semitones from A2)
BARS = [(0, (12, 15, 19, 24)), (-4, (8, 12, 15, 20)), (3, (15, 19, 22, 27)), (-2, (10, 14, 17, 22))]
PATTERNS = {
    #        kick steps      clap     hats (step, open?)                          bass (step, steps long)   pluck steps
    "full": ((0, 6, 8), (4, 12), [(s, s == 14) for s in range(0, 16, 2)], ((0, 5), (6, 2), (8, 6)), (0, 3, 6, 8, 11, 14)),
    "half": ((0,), (8,), [(s, False) for s in range(0, 16, 4)], ((0, 14),), (0, 6, 12)),
    "intro": ((), (), [(s, False) for s in range(2, 16, 4)], (), (0, 3, 6, 8, 11, 14)),
    "outro": ((), (), [], (), (0, 8)),
}


def section(t0, t1, kind, first_bar=0):
    """One chapter of music, starting on a downbeat at t0."""
    if kind == "none":
        return
    kicks, claps, hats, basses, plucks = PATTERNS[kind]
    bar_len = 16 * STEP
    n_bars = int(np.ceil((t1 - t0) / bar_len))
    for bi in range(n_bars):
        root, chord = BARS[(first_bar + bi) % 4]
        tb = t0 + bi * bar_len
        soft = 0.6 if kind == "intro" and bi == 0 else 1.0
        if kind in ("outro", "half", "intro"):
            place(music, pad_chord([semi(c) for c in chord[:3]], min(bar_len + 0.5, max(0.2, t1 - tb))), tb, gain=0.16)
        for s in kicks:
            if tb + s * STEP < t1 - 0.05:
                place(music, KICK, tb + s * STEP, gain=0.95)
        if bi % 2 == 1 and kind == "full" and tb + 14 * STEP < t1 - 0.05:
            place(music, KICK, tb + 14 * STEP, gain=0.7)  # pickup kick every other bar
        for s in claps:
            if tb + s * STEP < t1 - 0.05:
                place(music, CLAP, tb + s * STEP, gain=0.5, pan=0.08)
        for s, op in hats:
            swing = STEP * 0.12 if s % 4 == 2 else 0.0
            if tb + s * STEP < t1 - 0.05:
                place(music, OHAT if op else HAT, tb + s * STEP + swing, gain=(0.16 if s % 4 == 0 else 0.10) * soft, pan=0.25)
        for s, ln in basses:
            ts = tb + s * STEP
            if ts < t1 - 0.1:
                place(music, bass(semi(root), min(ln * STEP, t1 - ts)), ts, gain=0.55)
        for j, s in enumerate(plucks):
            ts = tb + s * STEP
            if ts < t1 - 0.1:
                note = chord[(j + bi) % len(chord)]
                place(music, pluck(semi(note), 0.55, bright=0.7 if kind == "intro" else 1.0), ts,
                      gain=0.22 * soft, pan=0.55 if j % 2 else -0.55)


# ---------- sound effects ----------
def whoosh():
    L = int(0.5 * SR); t = np.arange(L) / SR
    noise = rng.standard_normal(L)
    sig = np.zeros(L)
    for (lo, hi), peak in (((250, 900), 0.22), ((900, 3200), 0.30), ((3200, 9000), 0.38)):
        sig += band(noise, lo, hi) * np.exp(-((t - peak) / 0.09) ** 2)  # low band first, bright band last = a sweep
    return norm(sig, 0.8)


def riser(length=0.9):
    L = int(length * SR); t = np.arange(L) / SR
    k = t / t[-1]
    sig = band(rng.standard_normal(L), 1200, 9000) * k ** 2.5
    sig += 0.25 * np.sin(2 * np.pi * np.cumsum(300 + 1500 * k ** 2) / SR) * k ** 2
    return norm(sig, 0.7) * env(L, 0.01, 0.02)


def impact():
    L = int(0.7 * SR); t = np.arange(L) / SR
    f = 55 + 90 * np.exp(-t * 14)
    boom = np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 3) * np.exp(-t * 5)
    crack = band(rng.standard_normal(L), 1000, 7000) * np.exp(-t * 45) * 0.6
    return reverb(norm(boom + crack, 0.9) * env(L, 0.001, 0.3), 0.9, 0.2)


def tok():
    L = int(0.05 * SR); t = np.arange(L) / SR
    return norm(np.sin(2 * np.pi * 1400 * t) * np.exp(-t * 120) + band(rng.standard_normal(L), 2000, 6000) * np.exp(-t * 300) * 0.4, 0.8)


def plop():
    L = int(0.25 * SR); t = np.arange(L) / SR
    return np.sin(2 * np.pi * np.cumsum(900 * np.exp(-t * 9) + 250) / SR) * env(L, 0.002, 0.15)


def flush():
    L = int(1.6 * SR); t = np.arange(L) / SR
    sig = norm(band(rng.standard_normal(L), 150, 1800)) + 0.3 * np.sin(2 * np.pi * (120 + 60 * np.sin(2 * np.pi * 7 * t)) * t)
    return sig * np.sin(np.pi * np.clip(t / 1.5, 0, 1)) ** 0.7 * env(L, 0.02, 0.3)


def thud():
    L = int(0.4 * SR); t = np.arange(L) / SR
    f = 150 * np.exp(-t * 7) + 60
    return np.tanh((np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * rng.standard_normal(L) * np.exp(-t * 40)) * 2) * env(L, 0.001, 0.25)


def pop_():
    L = int(0.12 * SR); t = np.arange(L) / SR
    return np.sin(2 * np.pi * np.cumsum(400 + 1400 * t / t[-1]) / SR) * env(L, 0.001, 0.08)


def ding():
    L = int(0.9 * SR); t = np.arange(L) / SR
    sig = sum(g * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, g, d in ((1760, 0.6, 5), (2640, 0.3, 7), (3520, 0.15, 9)))
    return sig * env(L, 0.001, 0.2)


KINDS = {"plop": plop, "flush": flush, "thud": thud, "pop": pop_, "ding": ding, "boom": impact}

# ---------- sound library (plan.json "sound_kit") ----------
ROOT = pathlib.Path(__file__).resolve().parent.parent
LEGACY = dict(KINDS, riser=riser, whoosh=whoosh, cut_hit=impact, accent=tok)  # what each role replaces
kit_id = plan.get("sound_kit")
library, kit_roles = {}, {}
if kit_id:
    kit_path = ROOT / "sounds" / "kits" / f"{kit_id}.json"
    if not kit_path.exists():
        sys.exit(f"sound kit '{kit_id}' not found ({kit_path})")
    kit_roles = json.loads(kit_path.read_text())["roles"]
    library = json.loads((ROOT / "sounds" / "library.json").read_text())["sounds"]
cues = []  # every effect placed, for tools/sound_check.py and the credits


def loud_db(x):
    """Loudest 50 ms of a signal, in dBFS (same measure as tools/sound_lib.py)."""
    m = x if x.ndim == 1 else x.mean(axis=1)
    win = max(1, int(0.05 * SR))
    return 20 * np.log10(np.sqrt(np.convolve(m ** 2, np.ones(win) / win, mode="same")).max() + 1e-9)


_legacy_loud = {}


def legacy_loud(role):
    if role not in _legacy_loud:
        ref = LEGACY.get(role)
        _legacy_loud[role] = float(loud_db(ref())) if ref else float(np.median([loud_db(f()) for f in KINDS.values()]))
    return _legacy_loud[role]


def effect(role):
    """(signal, onset s, peak s, length s, library id or None) for a kit role, a library id or a legacy kind."""
    if kit_id:
        spec = kit_roles.get(role) or ({"sound": role} if role in library else None)
        if spec is None:
            sys.exit(f"sfx '{role}': neither a role of kit '{kit_id}' nor a sound of sounds/library.json")
        meta = library[spec["sound"]]
        y, _ = load(ROOT / "sounds" / meta["file"], sr=SR)
        y = y.astype(np.float64) * 10 ** ((legacy_loud(role) - meta["loud_db"] + spec.get("gain_db", 0.0)) / 20)
        return y, meta["onset_s"], meta["peak_s"], meta["dur_s"], spec["sound"]
    if role not in LEGACY:
        sys.exit(f"sfx kind '{role}' needs \"sound_kit\" in plan.json (legacy kinds: {', '.join(KINDS)})")
    y = LEGACY[role]()
    return y, 0.0, 0.0, len(y) / SR, None


def play(role, t, gain, anchor="onset", pan=0.0, legacy_lead=0.0):
    """Place one effect so that its onset, its peak or its end falls on t. A legacy (synthesized) effect keeps
    its historical position: it starts legacy_lead seconds before t."""
    y, onset, peak, length, sound = effect(role)
    pan = pan() if callable(pan) else pan  # drawn after the effect: keeps the random sequence of old episodes
    if sound is None:
        start = t - legacy_lead
    else:
        start = t - {"onset": onset, "peak": peak, "end": length}[anchor]
    place(fx, y, start, gain=gain, pan=pan)
    cues.append({"t": round(float(t), 3), "role": role, "sound": sound, "anchor": anchor, "gain": round(float(gain), 3)})

# ---------- arrangement ----------
chapters, words = ep["chapters"], ep["words"]
override = mcfg.get("sections") or {}
bar = 0
for i, c in enumerate(chapters):
    default = "intro" if i == 0 else "outro" if i == len(chapters) - 1 else ("full" if i % 2 == 1 else "half")
    kind = override.get(c["key"], default)
    end = c["t_end"] if i + 1 < len(chapters) else dur
    section(c["t_start"], end, kind, bar)
    bar += int(np.ceil((end - c["t_start"]) / (16 * STEP)))
    if i > 0:
        t0 = c["t_start"]
        play("riser", t0, 0.22, anchor="end", legacy_lead=0.9)
        play("whoosh", t0, 0.30, anchor="peak", legacy_lead=0.30)
        play("cut_hit", t0, 0.42)

# accents: one soft tok on the accented word (plain blocks stay silent)
for w in words:
    if w.get("accent"):
        play("accent", w["t_start"] + 0.02, 0.10, pan=lambda: rng.uniform(-0.3, 0.3))

# gag sounds + the list of punchlines that deserve a music stop
stops = []
MIN_STOP_GAP = 2.5  # seconds: closer than that, the music stutters instead of breathing
for e in plan.get("sfx_events", []):
    hit = next((w for w in words if w["chapter"] == e["chapter"] and e["word"].lower() in w["text"].lower()), None)
    if hit:
        g = e.get("gain", 0.25)
        play(e["kind"], hit["t_start"] + e.get("offset", 0.0), g * 1.1)
        cues[-1]["event"] = True
        if g >= 0.4:
            stops.append((hit["t_start"], 1))
for p in (plan.get("retime") or {}).get("pauses", []):
    hit = next((w for w in words if w["chapter"] == p["chapter"] and p["word"].lower() in w["text"].lower()), None)
    if hit:
        stops.append((hit["t_start"], 0))  # priority 0: the silence was written into the voice, the music must follow it
kept = []
for s, _prio in sorted(stops, key=lambda x: (x[1], x[0])):
    if all(abs(s - k) >= MIN_STOP_GAP for k in kept):
        kept.append(s)
dropped = len(stops) - len(kept)
stops = sorted(kept)
if dropped:
    print(f"note: {dropped} music stop(s) merged (closer than {MIN_STOP_GAP}s to another one)")

# ---------- mix ----------
tt = np.arange(N) / SR
gain = np.ones(N)
# chapter cuts: a short gap of silence right before the downbeat makes the drop hit harder
for c in chapters[1:]:
    gain *= 1 - np.clip(1 - np.abs(tt - (c["t_start"] - 0.07)) / 0.07, 0, 1)
# punchline stops: music out 0.32 s before the word, back in right after it starts
for s in stops:
    gain *= 1 - np.clip((tt - (s - 0.36)) / 0.04, 0, 1) * np.clip(((s + 0.10) - tt) / 0.05, 0, 1)

# ducking under the real voice, and level relative to the voice
voice_file = ep_dir / ep["voice"]["file"]
level_db = float(mcfg.get("level_db", -15))
if voice_file.exists():
    v, _ = load(voice_file, sr=SR)
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    hop = 1024
    frames = np.sqrt(np.convolve(v ** 2, np.ones(hop) / hop, mode="same"))
    k = int(0.18 * SR)
    smooth = np.convolve(frames, np.ones(k) / k, mode="same")
    speaking = smooth > smooth.max() * 0.08
    duck = 1 - 0.42 * np.clip(smooth / (np.percentile(smooth[speaking], 60) + 1e-9), 0, 1)
    gain *= duck
    voice_rms = float(np.sqrt(np.mean(v[speaking] ** 2)))
else:
    voice_rms = 0.1
music_rms = float(np.sqrt(np.mean(music ** 2)) + 1e-9)
music *= voice_rms * 10 ** (level_db / 20) / music_rms
music *= gain[:, None]
fx *= voice_rms / 0.1  # effects were tuned against a voice at ~ -20 dBFS RMS
out = music + fx
# fade the tail, soft-clip the peaks
tail = int(0.8 * SR)
out[-tail:] *= np.linspace(1, 0, tail)[:, None]
out = np.tanh(out * 1.2) / 1.2
save(ep_dir / "sfx.wav", out, SR)
(ep_dir / "sfx_cues.json").write_text(json.dumps(
    {"sound_kit": kit_id, "fps": ep.get("fps", 30), "stops": [round(s, 3) for s in sorted(stops)],
     "cues": sorted(cues, key=lambda c: c["t"])}, ensure_ascii=False, indent=1) + "\n")
ep["sfx"] = "sfx.wav"
ep["music"] = {"bpm": BPM, "stops": [round(s, 3) for s in sorted(stops)]}
ep_path.write_text(json.dumps(ep, ensure_ascii=False, indent=1))
final_rms = float(np.sqrt(np.mean(music ** 2)) + 1e-9)
print(f"sfx.wav: {dur:.1f}s, {BPM:.0f} bpm, {len(chapters)} sections, {len(stops)} music stops, "
      f"music {20 * np.log10(final_rms):.1f} dBFS vs voice {20 * np.log10(voice_rms):.1f} dBFS")
