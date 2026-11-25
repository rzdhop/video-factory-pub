#!/usr/bin/env python3
"""Check the sound of an episode by measurement, before the full render (and again on the master).

Nobody in the session can hear the result, so this tool answers the questions an ear would:
- is every effect that the plan asked for really audible where it should be, on its word or its cut?
- does the music stay under the voice, and is anything clipping?
- are the sounds the ones of the library (unchanged files), and which credits does the caption owe?
- on the master: is the loudness on target (-14 LUFS, true peak under -1 dBTP)?

Two layers:
1. measurements made here (numpy only) from voice.wav, sfx.wav and sfx_cues.json (written by build_sfx.py);
2. earshot's listening transcript of the mix (`earshot timeline --cues`): it finds the sound events by itself and
   reports how far each one falls from its cue. Installed on demand by tools/setup_sound.sh; skip with --no-models.

Usage: sound_check.py <episode_dir> [--master out/<id>.master.mp4] [--no-models] [--no-install]
Writes <episode_dir>/sound_report.json. Exit 1 when an ERROR was found; WARN lines are for the orchestrator to
read and report in plain words.
"""
import argparse, hashlib, json, os, pathlib, shutil, subprocess, sys, tempfile
import numpy as np
from _audio import load, save

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 44100
FRAME_MS = 1000 / 30
BED_MAX_DB = -10.0      # music + effects under the voice while it speaks: above, the voice is fought
BED_ERR_DB = -6.0
BED_MIN_DB = -34.0      # below, the music is not there for a phone speaker
# Effects are compared with the loud syllables of the voice (95th percentile of its 50 ms level). In the mixes
# validated by ear so far, every plan effect and cut hit sits between -2 and +7 dB
# of that level: outside the range below, an effect is quieter or louder than anything approved by ear.
FX_QUIET_DB = -8.0
FX_LOUD_DB = 10.0
TARGET_LUFS, LUFS_TOL, TP_MAX = -14.0, 1.5, -1.0

p = argparse.ArgumentParser()
p.add_argument("episode_dir")
p.add_argument("--master")
p.add_argument("--no-models", action="store_true")
p.add_argument("--no-install", action="store_true")
a = p.parse_args()
ep_dir = pathlib.Path(a.episode_dir)
report = {"episode": ep_dir.name, "errors": [], "warnings": [], "info": []}


def err(m): report["errors"].append(m); print("ERROR", m)
def warn(m): report["warnings"].append(m); print("WARN ", m)
def info(m): report["info"].append(m); print("ok   ", m)


def finish():
    (ep_dir / "sound_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n")
    print(f"sound check {ep_dir.name}: {len(report['errors'])} error(s), {len(report['warnings'])} warning(s)")
    sys.exit(1 if report["errors"] else 0)


def rms_db(x):
    return float(20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-9)) if len(x) else -120.0


def window_loud(x, t0, t1):
    """Loudest 50 ms between t0 and t1, in dBFS."""
    seg = x[max(0, int(t0 * SR)): max(0, int(t1 * SR))]
    win = int(0.05 * SR)
    if len(seg) < win:
        return rms_db(seg)
    c = np.cumsum(np.concatenate([[0.0], seg ** 2]))
    return float(10 * np.log10((c[win:] - c[:-win]).max() / win + 1e-12))


# ---------- inputs ----------
ep = json.loads((ep_dir / "episode.json").read_text())
cues_path = ep_dir / "sfx_cues.json"
if not (ep_dir / "sfx.wav").exists():
    err("sfx.wav is missing: run tools/build_sfx.py (after retime, voice_envelope and direct)")
    finish()
if not cues_path.exists():
    warn("sfx_cues.json is missing (sound built by an older version): re-run tools/build_sfx.py to check the effects")
    finish()
cue_doc = json.loads(cues_path.read_text())
cues = cue_doc["cues"]
voice, _ = load(ep_dir / ep["voice"]["file"], sr=SR)
bed, _ = load(ep_dir / "sfx.wav", sr=SR)
n = max(len(voice), len(bed))
voice, bed = np.pad(voice, (0, n - len(voice))), np.pad(bed, (0, n - len(bed)))
if abs(len(voice) / SR - ep["duration"]) > 1.0 and abs(n / SR - ep["duration"]) > 1.0:
    warn(f"audio is {n / SR:.1f} s long but episode.json says {ep['duration']:.1f} s: re-run the post-alignment chain")

# ---------- library ----------
lib_path = ROOT / "sounds" / "library.json"
lib = json.loads(lib_path.read_text())["sounds"] if lib_path.exists() else {}
used = sorted({c["sound"] for c in cues if c.get("sound")})
if not cue_doc.get("sound_kit"):
    info("no sound_kit in plan.json: synthesized effects of the old engine (not scored)")
for sid in used:
    s = lib.get(sid)
    f = ROOT / "sounds" / s["file"] if s else None
    if not s or not f.exists() or hashlib.sha256(f.read_bytes()).hexdigest() != s["sha256"]:
        err(f"sound '{sid}' is missing from the library or its file changed: `python3 tools/sound_lib.py verify`")
    elif (s.get("match") or {}).get("verdict") not in (None, "strong"):
        warn(f"sound '{sid}' only scored '{s['match']['verdict']}' for '{s['match']['query']}'")
credits = sorted({lib[s]["attribution"] for s in used if s in lib and lib[s].get("attribution")})
report["credits"] = credits
if credits:
    warn(f"{len(credits)} credit line(s) owed in the caption: `python3 tools/sound_lib.py credits {ep_dir}`")
elif used:
    info(f"{len(used)} library sound(s), all synthesized or public domain: no credit owed")

# ---------- music and effects against the voice ----------
win = int(0.05 * SR)
env = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode="same"))
speaking = env > env.max() * 0.08
voice_db, bed_db = rms_db(voice[speaking]), rms_db(bed[speaking])
voice_p95 = float(20 * np.log10(np.percentile(env[speaking], 95) + 1e-9))
margin = bed_db - voice_db
report["bed_under_voice_db"] = round(margin, 1)
line = f"music and effects sit {-margin:.1f} dB under the voice while it speaks"
if margin > BED_ERR_DB:  # a WARN, not an ERROR: a mix can be published like this, it is a matter of taste
    warn(line + f" (wanted {-BED_MAX_DB:.0f} or more): the voice is fought, lower music.level_db by 6 "
                f"or shorten the long effects under speech")
elif margin > BED_MAX_DB:
    warn(line + f" (wanted {-BED_MAX_DB:.0f} or more): lower music.level_db by 3")
elif margin < BED_MIN_DB:
    warn(line + ": the music will not be heard on a phone, raise music.level_db by 3")
else:
    info(line)

mix = voice + bed
over = int((np.abs(mix) > 1.0).sum())
report["mix_peak_dbfs"] = round(float(20 * np.log10(np.abs(mix).max() + 1e-9)), 1)
if over > SR * 0.002:
    warn(f"the voice + sound mix clips on {over} samples before mastering (peak {report['mix_peak_dbfs']} dBFS)")

# every effect asked by the plan (sfx_events) and every cut hit: is it there, and at a sane level?
checked, masked, loud = [], [], []
for c in cues:
    if not (c.get("event") or c["role"] == "cut_hit"):
        continue
    meta = lib.get(c.get("sound") or "", {})
    # look as far as the sound's own loudest moment (a flush swells for 0.4 s after its onset)
    reach = max(0.25, meta.get("peak_s", 0) - meta.get("onset_s", 0) + 0.1) if c.get("anchor") == "onset" else 0.25
    fx_db = window_loud(bed, c["t"] - 0.03, c["t"] + reach)
    before_db = window_loud(bed, c["t"] - 0.6, c["t"] - 0.1)
    item = {"t": c["t"], "role": c["role"], "sound": c.get("sound"), "fx_db": round(fx_db, 1),
            "over_bed_db": round(fx_db - before_db, 1), "vs_voice_db": round(fx_db - voice_p95, 1)}
    checked.append(item)
    if item["vs_voice_db"] < FX_QUIET_DB:
        masked.append(item)
    elif item["vs_voice_db"] > FX_LOUD_DB:
        loud.append(item)
report["effects"] = checked
for it in masked:
    warn(f"{it['role']} at {it['t']:.2f} s is {-it['vs_voice_db']:.0f} dB under the loud syllables of the voice: "
         f"quieter than any effect validated so far, raise its gain")
for it in loud:
    warn(f"{it['role']} at {it['t']:.2f} s is {it['vs_voice_db']:.0f} dB over the loud syllables of the voice: "
         f"louder than any effect validated so far, lower its gain")
if checked and not masked and not loud:
    lo, hi = min(i["vs_voice_db"] for i in checked), max(i["vs_voice_db"] for i in checked)
    info(f"{len(checked)} effects (plan events and cut hits) sit {lo:+.0f} to {hi:+.0f} dB from the loud syllables "
         f"of the voice, inside the validated range ({FX_QUIET_DB:+.0f} to {FX_LOUD_DB:+.0f})")


# ---------- earshot: listen to the mix, and to the master ----------
def earshot_exe():
    exe = shutil.which("earshot") or str(pathlib.Path.home() / ".local/bin/earshot")
    if pathlib.Path(exe).exists():
        return exe
    if a.no_install:
        return None
    print("installing earshot (about 1 min)...")
    r = subprocess.run(["bash", str(ROOT / "tools" / "setup_sound.sh")], capture_output=True, text=True)
    return exe if r.returncode == 0 and pathlib.Path(exe).exists() else None


def timeline(path, cue_file=None):
    env_ = dict(os.environ, EARSHOT_THREADS=os.environ.get("EARSHOT_THREADS", "2"))
    cmd = [exe, "timeline", str(path), "--detail", "low", "--json"] + (["--cues", str(cue_file)] if cue_file else [])
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=1500, env=env_)
    if r.returncode != 0:
        warn(f"earshot could not read {pathlib.Path(path).name}: {r.stderr.strip()[-200:]}")
        return None
    return json.loads(r.stdout[r.stdout.index("{"):])


exe = None if a.no_models else earshot_exe()
if a.no_models:
    info("listening pass skipped (--no-models)")
elif exe is None:
    warn("earshot is not installed (bash tools/setup_sound.sh): the listening pass did not run")
else:
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        save(tmp / "mix.wav", np.clip(mix, -1, 1), SR)
        fps = cue_doc.get("fps", 30)
        events = [{"f": int(round(it["t"] * fps)), "kind": "hit", "id": f"{it['role']}@{it['t']:.2f}"} for it in checked]
        (tmp / "cues.json").write_text(json.dumps({"fps": fps, "events": events}))
        tl = timeline(tmp / "mix.wav", tmp / "cues.json" if events else None)
    if tl:
        sync = ((tl.get("sync") or {}).get("cues") or {})
        stats = sync.get("stats") or {}
        # "peak" and "swell" mean the cue was answered by a level peak or a swell: fine. A cue is off when
        # nothing answers it or when the answer is more than 100 ms (3 frames) away.
        late = [i for i in sync.get("items", []) if i.get("status") not in ("OK", "peak", "swell")
                and (i.get("offset_ms") is None or abs(i["offset_ms"]) > 100)]
        report["sync"] = {"stats": stats, "not_ok": late}
        if stats:
            line = (f"earshot heard {stats.get('hit_within_1_frame', 0) * 100:.0f} % of the {stats.get('n')} effects "
                    f"within one frame of their cue (median offset {stats.get('median_abs_offset_ms')} ms)")
            (info if stats.get("hit_within_100ms", 0) >= 0.9 else warn)(line)
        for i in late[:8]:
            warn(f"{i['id']}: {i.get('status')} (offset {i.get('offset_ms')} ms)")
        stops = cue_doc.get("stops", [])
        for s in (tl.get("loudness") or {}).get("silences", []):
            wanted = any(abs(s["start"] - st) < 0.6 for st in stops) or s["end"] > n / SR - 2.5
            if s["dur"] > 0.6 and not wanted:
                warn(f"{s['dur']:.1f} s of {s['kind']} at {s['start']:.1f} s that no punchline asked for")
        report["mix_loudness"] = {k: (tl.get("loudness") or {}).get(k) for k in ("integrated_lufs", "true_peak_dbtp", "lra_lu")}
    if a.master:
        if not pathlib.Path(a.master).exists():
            err(f"master {a.master} not found")
        else:
            m = (timeline(a.master) or {}).get("loudness") or {}
            report["master_loudness"] = {k: m.get(k) for k in ("integrated_lufs", "true_peak_dbtp", "lra_lu")}
            lufs, tp = m.get("integrated_lufs"), m.get("true_peak_dbtp")
            if lufs is None:
                err("the master has no measurable audio")
            elif abs(lufs - TARGET_LUFS) > LUFS_TOL:
                err(f"master at {lufs} LUFS, target {TARGET_LUFS} +/- {LUFS_TOL}: run tools/master.sh again")
            elif tp is not None and tp > TP_MAX:
                warn(f"master true peak {tp} dBTP, wanted {TP_MAX} or lower")
            else:
                info(f"master at {lufs} LUFS, true peak {tp} dBTP")
            if (m.get("clipping") or {}).get("samples"):
                warn(f"master clips on {m['clipping']['samples']} samples")
finish()
