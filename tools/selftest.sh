#!/usr/bin/env bash
# Fast self-test of the tool chain (no render, no credit, a few seconds). Called at the end of tools/check.sh.
# Usage: tools/selftest.sh [episode_id]
#   (a) round trip on a /tmp copy of the demo episode episodes/ep-000-demo: retime.py run twice keeps an injected
#       `look`, `series`, `format`, a `media` list on one chapter and an unknown key, gives the same timings
#       and the same voice both times, and refreshes its backups when a new alignment arrives;
#       voice_envelope.py, direct.py and build_sfx.py keep every key they do not own.
#       Skipped with a message when numpy / ffmpeg / the fixture episode is missing.
#   (b) shape of episodes/<episode_id>/episode.json (when an id is given and the file exists): required keys,
#       chapters contiguous and inside the duration, words inside their chapter (start inside, end at most
#       0.25 s after the cut), `mouth.open` as long as the
#       frame count, audio files present.
# Exit 1 when a test fails; skipped tests do not fail.
set -uo pipefail
cd "$(dirname "$0")/.."
[ $# -le 1 ] || { echo "usage: tools/selftest.sh [episode_id]" >&2; exit 2; }
id="${1:-}"; id="${id%/}"; id="${id##*/}"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/vf-selftest.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
python3 - "$tmp" "$id" <<'PY'
import json, pathlib, shutil, subprocess, sys, wave

ROOT = pathlib.Path.cwd()
TOOLS = ROOT / "tools"
tmp, target = pathlib.Path(sys.argv[1]), sys.argv[2]
FIXTURE = "ep-000-demo"
failures, checks = [], 0


def check(ok, label):
    global checks
    checks += 1
    if not ok:
        failures.append(label)
        print(f"  FAIL  {label}")
    return ok


def run(tool, ep_dir):
    res = subprocess.run([sys.executable, str(TOOLS / tool), str(ep_dir)], capture_output=True, text=True, cwd=TOOLS)
    if res.returncode != 0:
        tail = (res.stdout + res.stderr).strip().splitlines()[-4:]
        check(False, f"{tool} exits {res.returncode}: " + " / ".join(tail))
    return res.returncode == 0


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


# ---------- (a) round trip ----------
INJECT = {"look": {"id": "selftest-look", "accent": "#123456"}, "series": {"slug": "selftest", "part": 2, "total": 3},
          "format": "wtf-motion", "x_selftest": {"keep": ["me", 1]}}
MEDIA = [{"src": "assets/selftest.jpg", "kind": "image", "credit": "selftest"}]


def kept(ep, label):
    for k, v in INJECT.items():
        check(ep.get(k) == v, f"{label}: top-level `{k}` kept")
    check(ep["chapters"][1].get("media") == MEDIA, f"{label}: chapters[1].media kept")
    check(ep["chapters"][1].get("x_note") == "selftest", f"{label}: unknown chapter field kept")


def timing(ep):
    return ([(w["text"], w["t_start"], w["t_end"]) for w in ep["words"]],
            [(c["key"], c["t_start"], c["t_end"]) for c in ep["chapters"]], ep["duration"])


def round_trip():
    src = ROOT / "episodes" / FIXTURE
    need = ["plan.json", "episode.json", "episode_pre_retime.json", "voice.wav", "voice_pre_retime.wav"]
    lacking = [n for n in need if not (src / n).is_file()]
    if lacking:
        return print(f"(a) round trip: SKIPPED, episodes/{FIXTURE} lacks {', '.join(lacking)}")
    try:
        import numpy  # noqa: F401
    except ImportError:
        return print("(a) round trip: SKIPPED, numpy is not installed")
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        return print("(a) round trip: SKIPPED, ffmpeg / ffprobe not found")
    d = tmp / FIXTURE
    d.mkdir()
    for n in need:
        shutil.copy(src / n, d / n)
    ep_path = d / "episode.json"
    before = read(ep_path)

    def inject():
        ep = read(ep_path)
        ep.update(json.loads(json.dumps(INJECT)))
        ep["chapters"][1]["media"] = MEDIA
        ep["chapters"][1]["x_note"] = "selftest"
        ep_path.write_text(json.dumps(ep, ensure_ascii=False, indent=1), encoding="utf-8")

    # 1. keys added after the backup was made survive retime.py, twice
    inject()
    if not run("retime.py", d):
        return
    one, wav_one = read(ep_path), (d / "voice.wav").read_bytes()
    kept(one, "retime #1")
    check(one.get("retimed") is True and isinstance(one.get("retime_applied"), dict), "retime #1: output marked `retimed`")
    check(timing(one) == timing(before), "retime #1: same timings as the episode.json of the repo")
    check(not {"mouth", "acting", "music", "sfx"} & set(one), "retime #1: keys of the old timeline dropped")
    if not run("retime.py", d):
        return
    two = read(ep_path)
    kept(two, "retime #2")
    check(two == one, "retime #2: episode.json identical to run #1")
    check((d / "voice.wav").read_bytes() == wav_one, "retime #2: voice.wav identical to run #1")

    # 2. the rest of the chain keeps what it does not own
    owned = {"voice_envelope.py": {"mouth"}, "direct.py": {"acting"}, "build_sfx.py": {"sfx", "music"}}
    for tool, keys in owned.items():
        prev = read(ep_path)
        if not run(tool, d):
            continue
        now = read(ep_path)
        kept(now, tool)
        check(all(now.get(k) == v for k, v in prev.items() if k not in keys), f"{tool}: every other key untouched")
        check(all(k in now for k in keys), f"{tool}: writes {', '.join(sorted(keys))}")
    final = read(ep_path)
    for k in ("mouth", "acting", "music"):
        if k in before:
            check(final.get(k) == before[k], f"chain: `{k}` identical to the episode.json of the repo")

    # 3. a new alignment (unmarked episode.json, other voice) refreshes the backups instead of being replaced
    fresh = read(d / "episode_pre_retime.json")
    for item in fresh["words"] + fresh["chapters"]:
        item["t_start"], item["t_end"] = round(item["t_start"] * 0.96, 3), round(item["t_end"] * 0.96, 3)
    fresh["duration"] = round(fresh["duration"] * 0.96, 3)
    fresh["x_take"] = 2
    with wave.open(str(d / "voice_pre_retime.wav")) as w:
        params, frames = w.getparams(), w.readframes(w.getnframes())
    cut = int(len(frames) * 0.98) // (params.sampwidth * params.nchannels) * (params.sampwidth * params.nchannels)
    with wave.open(str(d / "voice.wav"), "wb") as w:
        w.setparams(params)
        w.writeframes(frames[:cut])
    new_take = (d / "voice.wav").read_bytes()
    ep_path.write_text(json.dumps(fresh, ensure_ascii=False, indent=1), encoding="utf-8")
    if not run("retime.py", d):
        return
    check(read(d / "episode_pre_retime.json") == fresh, "new alignment: episode_pre_retime.json refreshed")
    check((d / "voice_pre_retime.wav").read_bytes() == new_take, "new alignment: voice_pre_retime.wav refreshed")
    three = read(ep_path)
    check(three.get("x_take") == 2 and three.get("retimed") is True, "new alignment: retimed from the new take")
    check(timing(three) != timing(one), "new alignment: timings come from the new take")
    if run("retime.py", d):
        check(read(ep_path) == three, "new alignment: second run identical")
        check(read(d / "episode_pre_retime.json") == fresh, "new alignment: backup kept by the second run")
    print(f"(a) round trip on a copy of {FIXTURE}: done")


round_trip()


# ---------- (b) shape of one episode.json ----------
def shape(eid):
    ep_dir = ROOT / "episodes" / eid
    path = ep_dir / "episode.json"
    if not path.is_file():
        return print(f"(b) shape: SKIPPED, episodes/{eid}/episode.json not built yet")
    try:
        ep = read(path)
    except ValueError as exc:
        return check(False, f"shape: episode.json does not parse ({exc})")
    need = {"id": str, "title": str, "preset": str, "character": str, "fps": (int, float), "voice": dict,
            "duration": (int, float), "chapters": list, "words": list}
    ok = True
    for k, typ in need.items():
        ok &= check(isinstance(ep.get(k), typ) and not isinstance(ep.get(k), bool), f"shape: `{k}` present, right type")
    if not ok:
        return
    fps, dur, chapters, words = ep["fps"], ep["duration"], ep["chapters"], ep["words"]
    check(fps > 0 and dur > 0, "shape: fps and duration > 0")
    check(bool(chapters) and bool(words), "shape: at least one chapter and one block")
    if not chapters or not words:
        return
    eps = 0.0015
    bad = [c.get("key") for c in chapters if not (isinstance(c.get("key"), str) and isinstance(c.get("scene"), str)
           and isinstance(c.get("t_start"), (int, float)) and isinstance(c.get("t_end"), (int, float)))]
    if not check(not bad, f"shape: every chapter has key, scene, t_start, t_end ({bad})"):
        return
    keys = [c["key"] for c in chapters]
    check(len(set(keys)) == len(keys), "shape: chapter keys unique")
    check(abs(chapters[0]["t_start"]) <= eps, f"shape: first chapter starts at 0 (got {chapters[0]['t_start']})")
    gaps = [f"{a['key']}->{b['key']}" for a, b in zip(chapters, chapters[1:]) if abs(a["t_end"] - b["t_start"]) > eps]
    check(not gaps, f"shape: chapters contiguous ({', '.join(gaps)})")
    empty = [c["key"] for c in chapters if c["t_end"] <= c["t_start"]]
    check(not empty, f"shape: every chapter has a length ({', '.join(empty)})")
    check(chapters[-1]["t_end"] <= dur + eps, f"shape: last chapter ends inside the duration ({chapters[-1]['t_end']} > {dur})")
    by_key = {c["key"]: c for c in chapters}
    # a block must START in its chapter; its measured end may run a little into the next one, because the
    # tools put the cut 0.22 s before the first block of the next chapter (align_audio.py, retime.py)
    TAIL = 0.25
    out = []
    for i, w in enumerate(words):
        c = by_key.get(w.get("chapter"))
        if not (c and isinstance(w.get("text"), str) and isinstance(w.get("t_start"), (int, float))
                and isinstance(w.get("t_end"), (int, float))):
            out.append(f"block {i}: bad fields or unknown chapter")
        elif not (c["t_start"] - eps <= w["t_start"] < c["t_end"] and w["t_start"] <= w["t_end"] <= c["t_end"] + TAIL):
            out.append(f"block {i} '{w['text']}' {w['t_start']}-{w['t_end']} outside chapter {c['key']} "
                       f"{c['t_start']}-{c['t_end']}")
    check(not out, "shape: words inside their chapter (" + "; ".join(out[:4]) + (f"; +{len(out) - 4}" if len(out) > 4 else "") + ")")
    order = [i for i in range(1, len(words)) if isinstance(words[i].get("t_start"), (int, float))
             and isinstance(words[i - 1].get("t_start"), (int, float)) and words[i]["t_start"] < words[i - 1]["t_start"]]
    check(not order, f"shape: words in time order (first break at block {order[0] if order else ''})")
    mouth = ep.get("mouth")
    if mouth is not None:
        n = -(-int(round(dur * fps * 1000)) // 1000)  # ceil(duration * fps), as Root.tsx and voice_envelope.py
        for k in ("open", "wide"):
            if k == "open" or k in mouth:
                got = len(mouth.get(k) or [])
                check(got == n, f"shape: mouth.{k} has {got} values for {n} frames (run voice_envelope.py)")
    for a in ep.get("acting") or []:
        if not (0 <= a.get("t", -1) <= a.get("t_end", -1)):
            check(False, f"shape: acting state {a} has bad times")
            break
    voice = ep["voice"]
    files = [("voice.file", voice.get("file"))]
    if ep.get("sfx") is not None:
        files.append(("sfx", ep["sfx"]))
    for label, name in files:
        check(isinstance(name, str) and (ep_dir / name).is_file(), f"shape: {label} '{name}' exists in episodes/{eid}")
    for c in chapters:
        for item in c.get("media") or []:
            src = item.get("src") if isinstance(item, dict) else None
            check(isinstance(src, str) and (ep_dir / src).is_file(), f"shape: media '{src}' of chapter {c['key']} exists")
    print(f"(b) shape of episodes/{eid}/episode.json: done")


if target:
    shape(target)
else:
    print("(b) shape: SKIPPED, no episode id given")

print(f"selftest: {checks} check(s), {len(failures)} failure(s)")
sys.exit(1 if failures else 0)
PY
