#!/usr/bin/env python3
"""The sound library: every effect an episode can play, chosen by measurement instead of by ear.

A sound enters `sounds/library.json` once, with its file committed under `sounds/files/`, so every later build
replays the same bytes without network and without models. Two sources:
- the earshot bank (252 synthesized sounds, MIT): `pick` ranks the bank sounds of one kind against a text
  description and keeps the best one that passes the click / tail / clipping audit; `bank` takes one by id;
- real recordings found through the Openverse API (Freesound, Wikimedia Commons): `find` searches, downloads the
  candidates, ranks them against the description and keeps the best one. The licence, the author and the
  attribution sentence are stored with the sound.

Commands (run from the repo root; `bash tools/setup_sound.sh` installs earshot first):
  sound_lib.py list
  sound_lib.py pick  <id> "<description>" --kind <bank kind> [--top 12] [--accept plausible]
  sound_lib.py bank  <id> <bank_id> [--desc "<description>"] [--dur S] [--pitch P] [--seed N]
  sound_lib.py find  <id> "<description>" [--query "<search words>"] [--license cc0,pdm,by] [--max-dur 4]
                     [--n 8] [--accept plausible] [--trim-start S] [--source wikimedia_audio]
  sound_lib.py import <id> <file> [--desc "<description>"] [--license ...] [--attribution ...] [--max-dur S]
  sound_lib.py verify                      every file present and unchanged (sha256)
  sound_lib.py credits <episode_dir>       attribution lines owed by the sounds this episode plays

Verdicts come from earshot (`strong` > `plausible` > `weak` > `no match`). A sound below `strong` is refused
unless --accept says otherwise: a sound nobody can recognise is worse than no sound.
"""
import argparse, hashlib, json, os, pathlib, shutil, subprocess, sys, tempfile, time, urllib.parse, urllib.request
import numpy as np
from _audio import load, save

ROOT = pathlib.Path(__file__).resolve().parent.parent
LIB_DIR = ROOT / "sounds"
LIB_PATH = LIB_DIR / "library.json"
FILES = LIB_DIR / "files"
SR = 44100
PEAK = 10 ** (-1 / 20)  # every library file peaks at -1 dBFS; build_sfx.py sets the level in the mix
API = "https://api.openverse.org/v1/audio/"
CACHE = pathlib.Path.home() / ".cache/video-factory/sounds"
UA = os.environ.get("VF_USER_AGENT", "video-factory/1.0 (sound library)")
VERDICTS = ["no match", "weak", "plausible", "strong"]
# Licences that allow reuse inside a published, possibly monetised video. `nc` (no commercial use) and
# `nd` (no derivative work) are left out on purpose; `by` needs the attribution line in the caption.
DEFAULT_LICENSES = "cc0,pdm,by"


def die(msg):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def read_lib():
    if LIB_PATH.exists():
        return json.loads(LIB_PATH.read_text())
    return {"version": 1, "sounds": {}}


def write_lib(lib):
    lib["sounds"] = dict(sorted(lib["sounds"].items()))
    LIB_PATH.parent.mkdir(parents=True, exist_ok=True)
    LIB_PATH.write_text(json.dumps(lib, ensure_ascii=False, indent=1) + "\n")


def earshot(*args, timeout=900):
    """Run one earshot command with --json and return the parsed result."""
    exe = shutil.which("earshot") or str(pathlib.Path.home() / ".local/bin/earshot")
    if not pathlib.Path(exe).exists():
        die("earshot is not installed: run `bash tools/setup_sound.sh`")
    env = dict(os.environ, EARSHOT_THREADS=os.environ.get("EARSHOT_THREADS", "2"))
    p = subprocess.run([exe, *args, "--json"], capture_output=True, text=True, timeout=timeout, env=env)
    if p.returncode != 0:
        die(f"earshot {' '.join(args[:2])} failed: {p.stderr.strip()[-400:]}")
    return json.loads(p.stdout[p.stdout.index("{"):])


def earshot_version():
    out = subprocess.run(["uv", "tool", "list"], capture_output=True, text=True).stdout
    return next((line.split()[1] for line in out.splitlines() if line.startswith("earshot ")), "unknown")


def measure(y):
    """Numbers build_sfx.py needs to place and level a sound: all computed here, no model involved."""
    a = np.abs(y)
    peak_i = int(a.argmax())
    onset_i = int(np.argmax(a >= a[peak_i] * 10 ** (-30 / 20)))  # first sample within 30 dB of the peak
    win = max(1, int(0.05 * SR))
    rms = np.sqrt(np.convolve(y ** 2, np.ones(win) / win, mode="same"))
    return {
        "dur_s": round(len(y) / SR, 4),
        "onset_s": round(onset_i / SR, 4),
        "peak_s": round(peak_i / SR, 4),
        "loud_db": round(float(20 * np.log10(rms.max() + 1e-9)), 2),  # loudest 50 ms, in dBFS
    }


def trim(y, max_dur=None, start=None):
    """Cut the silence before the sound, then keep at most max_dur seconds with a short fade-out."""
    a = np.abs(y)
    thr = a.max() * 10 ** (-40 / 20)
    idx = np.nonzero(a >= thr)[0]
    if len(idx) == 0:
        die("the candidate is silent")
    i0 = max(0, idx[0] - int(0.005 * SR)) if start is None else int(start * SR)
    y = y[i0: idx[-1] + int(0.05 * SR)]
    if max_dur and len(y) > int(max_dur * SR):
        y = y[: int(max_dur * SR)].copy()
        fade = int(min(0.25, max_dur * 0.2) * SR)
        y[-fade:] *= np.linspace(1, 0, fade) ** 2
    y = y.copy()
    edge = min(len(y) // 2, int(0.003 * SR))  # 3 ms ramps: a cut never clicks
    y[:edge] *= np.linspace(0, 1, edge)
    y[-edge:] *= np.linspace(1, 0, edge)
    return y


def store(lib, sid, src_path, entry, max_dur=None, start=None):
    y, _ = load(src_path, sr=SR)
    y = trim(y, max_dur, start)
    y = y / (np.abs(y).max() + 1e-9) * PEAK
    FILES.mkdir(parents=True, exist_ok=True)
    out = FILES / f"{sid}.wav"
    save(out, y, SR)
    entry.update(measure(y))
    entry["file"] = f"files/{sid}.wav"
    entry["sha256"] = hashlib.sha256(out.read_bytes()).hexdigest()
    entry["added"] = time.strftime("%Y-%m-%d")
    lib["sounds"][sid] = entry
    write_lib(lib)
    m = entry.get("match") or {}
    print(f"stored {sid}: {entry['dur_s']} s, peak at {entry['peak_s']} s, {entry['source']}"
          + (f", '{m['query']}' -> {m['verdict']} (z {m['z']:+.1f})" if m else "")
          + (f", licence {entry['license']}" if entry.get("license") else ""))


def good_enough(verdict, accept):
    return VERDICTS.index(verdict) >= VERDICTS.index(accept)


def match_of(query, res):
    return {"query": query, "z": round(res["z"], 2), "verdict": res["verdict"],
            "sounds_most_like": res.get("sounds_most_like")}


# ---------- earshot bank ----------
def render_bank(bank_id, out, dur=None, pitch=None, seed=None):
    args = ["sfx", "render", bank_id, "-o", str(out)]
    for flag, val in (("--dur", dur), ("--pitch", pitch), ("--seed", seed)):
        if val is not None:
            args += [flag, str(val)]
    return earshot(*args)["meta"]


def bank_entry(bank_id, meta, version):
    return {"source": "earshot-bank", "bank_id": bank_id, "seed": meta.get("seed"), "edits": meta.get("edits") or {},
            "earshot": version, "audit": "clean" if meta["checks"]["ok"] else "warnings",
            "license": "synthesized by the earshot bank (MIT)", "attribution": None}


def cmd_bank(a):
    lib = read_lib()
    with tempfile.TemporaryDirectory() as tmp:
        wav = pathlib.Path(tmp) / "take.wav"
        meta = render_bank(a.bank_id, wav, a.dur, a.pitch, a.seed)
        if not meta["checks"]["ok"]:
            die(f"{a.bank_id} fails the audit: {meta['checks']['summary']}")
        entry = bank_entry(a.bank_id, meta, earshot_version())
        if a.desc:
            entry["match"] = match_of(a.desc, earshot("rank", a.desc, str(wav))["results"][0])
        store(lib, a.id, wav, entry)


def cmd_pick(a):
    lib = read_lib()
    bank = earshot("sfx", "list", "--kind", a.kind)["sounds"]
    if not bank:
        die(f"no bank sound of kind '{a.kind}' (see `earshot sfx list`)")
    with tempfile.TemporaryDirectory() as tmp:
        metas = {}
        for s in bank[: a.top]:
            wav = pathlib.Path(tmp) / (s["id"].replace("/", "__") + ".wav")
            meta = render_bank(s["id"], wav)
            if meta["checks"]["ok"]:
                metas[wav.name] = (s["id"], meta, wav)
        ranked = earshot("rank", a.description, *[str(v[2]) for v in metas.values()])["results"]
        for r in ranked[:5]:
            print(f"  {r['verdict']:9s} z {r['z']:+5.1f}  {metas[r['name']][0]}")
        best = ranked[0]
        if not good_enough(best["verdict"], a.accept):
            die(f"best bank sound for '{a.description}' is only '{best['verdict']}' "
                f"({metas[best['name']][0]}): try `find` for a real recording, or another --kind")
        bank_id, meta, wav = metas[best["name"]]
        entry = bank_entry(bank_id, meta, earshot_version())
        entry["match"] = match_of(a.description, best)
        store(lib, a.id, wav, entry)


# ---------- Openverse ----------
def http_get(url, dest=None, tries=3):
    """GET with the project's User-Agent. Returns bytes (or writes dest). 429 waits and retries; 403 is final."""
    for attempt in range(tries):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            if dest:
                pathlib.Path(dest).write_bytes(data)
            return data
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt + 1 < tries:
                time.sleep(8 * (attempt + 1))
                continue
            raise
    return None


def cmd_find(a):
    lib = read_lib()
    params = {"q": a.query or a.description, "license": a.license, "page_size": 20, "mature": "false"}
    if a.source:
        params["source"] = a.source  # freesound | wikimedia_audio | jamendo
    q = urllib.parse.urlencode(params)
    results = json.loads(http_get(f"{API}?{q}"))["results"]
    short = [r for r in results if r.get("duration") and r["duration"] <= a.max_source_dur * 1000][: a.n]
    if not short:
        die(f"Openverse returned nothing usable for '{a.query or a.description}' with licences {a.license}")
    with tempfile.TemporaryDirectory() as tmp:
        got, blocked = {}, set()
        for i, r in enumerate(short):
            host = urllib.parse.urlparse(r["url"]).netloc
            if host in blocked:
                continue
            dest = pathlib.Path(tmp) / f"c{i}.{r.get('filetype') or 'ogg'}"
            cached = CACHE / f"{r['id']}.{r.get('filetype') or 'ogg'}"  # a source that throttles is asked once
            try:
                if not cached.exists():
                    CACHE.mkdir(parents=True, exist_ok=True)
                    http_get(r["url"], cached)
                    time.sleep(1.5)
                shutil.copy(cached, dest)
                got[dest.name] = (r, dest)
            except urllib.error.HTTPError as e:
                if e.code == 403:
                    blocked.add(host)  # refused by the session's network policy: report, do not route around
                print(f"  skipped {r['title'][:40]!r}: HTTP {e.code} from {host}")
        if blocked:
            print(f"note: {', '.join(sorted(blocked))} refused the download (403). To use these recordings, the "
                  f"host must be allowed in claude.ai Settings > Capabilities; nothing else was tried.")
        if not got:
            die("no candidate could be downloaded")
        ranked = earshot("rank", a.description, *[str(v[1]) for v in got.values()])["results"]
        for r in ranked[:5]:
            src = got[r["name"]][0]
            print(f"  {r['verdict']:9s} z {r['z']:+5.1f}  {src['license']:5s} {src['title'][:50]}")
        best = ranked[0]
        if not good_enough(best["verdict"], a.accept):
            die(f"best recording for '{a.description}' is only '{best['verdict']}': change --query or --accept")
        src, path = got[best["name"]]
        entry = {"source": "openverse", "provider": src.get("source"), "openverse_id": src["id"],
                 "title": src["title"], "creator": src.get("creator"), "landing_url": src.get("foreign_landing_url"),
                 "source_url": src["url"], "license": f"{src['license']} {src.get('license_version') or ''}".strip(),
                 "license_url": src.get("license_url"),
                 "attribution": None if src["license"] in ("cc0", "pdm") else src.get("attribution"),
                 "match": match_of(a.description, best)}
        store(lib, a.id, path, entry, max_dur=a.max_dur, start=a.trim_start)


def cmd_import(a):
    """A file that is already ours (a sound written for the project, a recording of your own)."""
    lib = read_lib()
    entry = {"source": a.source, "origin": a.origin, "license": a.license, "attribution": a.attribution}
    if a.desc:
        entry["match"] = match_of(a.desc, earshot("rank", a.desc, a.path)["results"][0])
        if not good_enough(entry["match"]["verdict"], a.accept):
            die(f"'{a.desc}' -> {entry['match']['verdict']} for {a.path}: refused (see --accept)")
    store(lib, a.id, a.path, entry, max_dur=a.max_dur)


# ---------- housekeeping ----------
def cmd_list(_a):
    lib = read_lib()
    for sid, s in lib["sounds"].items():
        m = s.get("match") or {}
        origin = s.get("bank_id") or f"{s.get('provider')}: {s.get('title', '')[:30]}"
        print(f"{sid:18s} {s['dur_s']:5.2f} s  {m.get('verdict', '-'):9s} {s['source']:12s} {origin}"
              + ("   [credit owed]" if s.get("attribution") else ""))
    print(f"{len(lib['sounds'])} sounds")


def cmd_verify(_a):
    bad = 0
    for sid, s in read_lib()["sounds"].items():
        f = LIB_DIR / s["file"]
        if not f.exists() or hashlib.sha256(f.read_bytes()).hexdigest() != s["sha256"]:
            print(f"ERROR {sid}: {s['file']} is missing or was changed")
            bad += 1
    print("library: ok" if not bad else f"library: {bad} problem(s)")
    sys.exit(1 if bad else 0)


def cmd_credits(a):
    cues_path = pathlib.Path(a.episode_dir) / "sfx_cues.json"
    if not cues_path.exists():
        die(f"{cues_path} not found: run tools/build_sfx.py first")
    used = {c["sound"] for c in json.loads(cues_path.read_text())["cues"] if c.get("sound")}
    lib = read_lib()["sounds"]
    lines = sorted({lib[s]["attribution"] for s in used if s in lib and lib[s].get("attribution")})
    if not lines:
        print("no credit owed: every sound is synthesized or in the public domain")
    else:
        print("Add to the caption:")
        for line in lines:
            print("  Son : " + line)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list").set_defaults(fn=cmd_list)
    sub.add_parser("verify").set_defaults(fn=cmd_verify)
    c = sub.add_parser("credits"); c.add_argument("episode_dir"); c.set_defaults(fn=cmd_credits)
    b = sub.add_parser("bank"); b.add_argument("id"); b.add_argument("bank_id"); b.add_argument("--desc")
    b.add_argument("--dur", type=float); b.add_argument("--pitch"); b.add_argument("--seed", type=int)
    b.set_defaults(fn=cmd_bank)
    k = sub.add_parser("pick"); k.add_argument("id"); k.add_argument("description")
    k.add_argument("--kind", required=True); k.add_argument("--top", type=int, default=12)
    k.add_argument("--accept", choices=VERDICTS, default="strong"); k.set_defaults(fn=cmd_pick)
    f = sub.add_parser("find"); f.add_argument("id"); f.add_argument("description"); f.add_argument("--query")
    f.add_argument("--license", default=DEFAULT_LICENSES); f.add_argument("--max-dur", type=float, default=4.0)
    f.add_argument("--max-source-dur", type=float, default=30.0); f.add_argument("--n", type=int, default=8)
    f.add_argument("--accept", choices=VERDICTS, default="strong"); f.add_argument("--trim-start", type=float)
    f.add_argument("--source", help="restrict to one Openverse source: freesound, wikimedia_audio, jamendo")
    f.set_defaults(fn=cmd_find)
    i = sub.add_parser("import"); i.add_argument("id"); i.add_argument("path"); i.add_argument("--desc")
    i.add_argument("--source", default="own"); i.add_argument("--origin", default=None)
    i.add_argument("--license", default="own work"); i.add_argument("--attribution", default=None)
    i.add_argument("--max-dur", type=float); i.add_argument("--accept", choices=VERDICTS, default="strong")
    i.set_defaults(fn=cmd_import)
    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
