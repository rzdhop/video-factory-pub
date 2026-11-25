#!/usr/bin/env python3
"""Automatic review frames of an episode: a few stills at the moments worth looking at, tiled in one sheet.

Usage: stills.py <episode_id> [--out out/stills/<id>] [--scale 0.35] [--dry] [--sync-only]
Frames picked from episodes/<id>/episode.json, in this order of priority:
  1. one SETTLED frame per chapter, at about 85 % of its length (everything of the scene is on screen).
     With a host, a moment in a close-up or a peek (scene dimmed and blurred) is avoided: the frame moves
     earlier in the chapter to the nearest moment in bust framing (later when there is none earlier);
  2. frame 3 (the very first picture);
  3. 0.8 s after every chapter start (the cut has landed, the first elements are in);
  4. then, sharing what is left: the middle of every close-up / peek, 0.15 s after every music stop
     (punchline), every gesture, the middle of every media item of a "media" chapter.
Frames closer than 6 frames are merged; at most 20 are kept.
Only what the render reads is synced to public/episodes/<id> (newer/changed files only): episode.json, the
voice file and the sfx file it names, the files of `chapters[].media[].src` and any other file under assets/
that episode.json names. Intermediate WAVs, backups and scripts stay out of public/.
The stills are rendered ONE AT A TIME with `npx remotion still`, then tiled into <out>/sheet.jpg (4 columns).
--dry prints the frame list only; --sync-only syncs the episode to public/ and stops (used by render.sh).
"""
import argparse, json, pathlib, re, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MAX_FRAMES, MIN_GAP, COLUMNS = 20, 6, 4
SETTLED_AT, CUT_DELAY, SHOT_MARGIN, END_MARGIN = 0.85, 0.8, 0.3, 0.5  # share of a chapter, then seconds
FONTS = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
         "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
         "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
         "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/Library/Fonts/Arial.ttf"]


def render_files(src, ep):
    """(files of episodes/<id> the render reads, names it asks for that do not exist)."""
    wanted = ["episode.json"]
    voice = ep.get("voice")
    if isinstance(voice, dict) and isinstance(voice.get("file"), str):
        wanted.append(voice["file"])
    if isinstance(ep.get("sfx"), str):
        wanted.append(ep["sfx"])
    for c in ep.get("chapters") or []:
        for item in (c.get("media") or []) if isinstance(c, dict) else []:
            if isinstance(item, dict) and isinstance(item.get("src"), str):
                wanted.append(item["src"])

    def walk(node):  # any other value naming a file under assets/
        if isinstance(node, dict):
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)
        elif isinstance(node, str) and node.startswith("assets/"):
            wanted.append(node)
    walk(ep)
    root = src.resolve()
    files, missing = [], []
    for name in dict.fromkeys(wanted):
        f = (root / name).resolve()
        if root not in f.parents:
            missing.append(f"{name} (outside the episode folder)")
        elif f.is_file():
            files.append(f)
        else:
            missing.append(name)
    return files, missing


def sync(eid):
    """Copy what the render reads from episodes/<id> to public/episodes/<id>: only files that are missing,
    newer or of another size. Returns (copied, destination, missing names)."""
    src, dst = ROOT / "episodes" / eid, ROOT / "public" / "episodes" / eid
    ep = json.loads((src / "episode.json").read_text(encoding="utf-8"))
    files, missing = render_files(src, ep)
    copied = 0
    for f in files:
        target = dst / f.relative_to(src.resolve())
        s = f.stat()
        if target.is_file():
            t = target.stat()
            if t.st_size == s.st_size and t.st_mtime >= s.st_mtime:
                continue
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, target)
        copied += 1
    return copied, dst, missing


def report_sync(eid):
    copied, dst, missing = sync(eid)
    print(f"synced {copied} file(s) to {dst.relative_to(ROOT)}")
    for name in missing:
        print(f"WARN  episode.json names '{name}', not found in episodes/{eid}: the render will miss it")


def media_times(chapter, words):
    """(start, end) of every media item: an item with `word` starts on that block, the others share
    the time left before the next anchored item (or the end of the chapter) equally."""
    items = chapter.get("media") or []
    t0, t1 = chapter["t_start"], chapter["t_end"]
    starts = []
    for i, item in enumerate(items):
        hit = None
        if isinstance(item, dict) and item.get("word"):
            w = str(item["word"]).lower()
            hit = next((x["t_start"] for x in words if x["chapter"] == chapter["key"] and w in x["text"].lower()), None)
        starts.append(t0 if i == 0 and hit is None else hit)
    i = 0
    while i < len(starts):
        if starts[i] is None:
            j = i
            while j < len(starts) and starts[j] is None:
                j += 1
            a, b = starts[i - 1], (starts[j] if j < len(starts) else t1)
            for n, k in enumerate(range(i, j), start=1):
                starts[k] = a + (b - a) * n / (j - i + 1)
            i = j
        else:
            i += 1
    ends = starts[1:] + [t1]
    return list(zip(starts, ends))


def settled_time(chapter, acting, duration):
    """A moment near 85 % of the chapter where the scene is fully built and not behind a close-up.
    `acting` is [] for a hostless episode. Returns (time, True when a close-up could not be avoided)."""
    t0, t1 = chapter["t_start"], min(chapter["t_end"], duration)
    hi = max(t0, t1 - END_MARGIN)  # the scene fades out at the very end of its chapter
    target = min(hi, t0 + SETTLED_AT * (t1 - t0))
    # stretches of the chapter in bust framing, away from the moves into and out of a close-up
    busy = sorted((a["t"] - SHOT_MARGIN, a["t_end"] + SHOT_MARGIN) for a in acting
                  if a.get("shot") in ("close", "peek") and a["t_end"] > t0 and a["t"] < t1)
    free, cursor = [], t0
    for a, b in busy:
        if a > cursor:
            free.append((cursor, min(a, hi)))
        cursor = max(cursor, b)
    if cursor < hi:
        free.append((cursor, hi))
    free = [(a, b) for a, b in free if b >= a]
    if not free:
        return target, bool(busy)
    for a, b in free:
        if a <= target <= b:
            return target, False
    earlier = [b for a, b in free if b < target]
    if earlier:
        return max(earlier), False  # the nearest bust moment before the target
    return min(a for a, b in free if a > target), False


def pick(ep):
    """Ordered candidates -> [(frame, [reasons])] after merging near frames and capping."""
    fps = ep.get("fps", 30)
    last = max(0, int(ep["duration"] * fps) - 1)
    fr = lambda t: min(last, max(0, int(round(t * fps))))
    hostless = ep.get("character") == "none"
    acting = [] if hostless else (ep.get("acting") or [])
    first = []
    for c in ep["chapters"]:
        t, in_close = settled_time(c, acting, ep["duration"])
        first.append((fr(t), f"settled {c['key']}" + (" (close-up)" if in_close else "")))
    first.append((min(3, last), "open"))
    for c in ep["chapters"][1:]:
        first.append((fr(c["t_start"] + CUT_DELAY), f"cut {c['key']}"))
    media, closes, stops, gestures = [], [], [], []
    for c in ep["chapters"]:
        if c.get("scene") == "media":
            for n, (a, b) in enumerate(media_times(c, ep["words"])):
                media.append((fr((a + b) / 2), f"media {c['key']}#{n + 1}"))
    if acting:
        for a in acting:
            mid = fr((a["t"] + a["t_end"]) / 2)
            if a.get("shot") in ("close", "peek"):
                closes.append((mid, f"{a['shot']} {a.get('emotion', '')}".strip()))
            if a.get("gesture") and a["gesture"] != "none":
                gestures.append((mid, f"gesture {a['gesture']}"))
    for s in (ep.get("music") or {}).get("stops") or []:
        stops.append((fr(s + 0.15), "music stop"))

    kept = []  # [frame, [reasons]]

    def add(frame, reason, limit):
        near = next((k for k in kept if abs(k[0] - frame) < MIN_GAP), None)
        if near:
            if reason not in near[1]:
                near[1].append(reason)
            return
        if len(kept) < limit:
            kept.append([frame, [reason]])

    for frame, reason in first:
        add(frame, reason, MAX_FRAMES)
    # the other kinds share what is left: each kind in turn gives its frame farthest from the frames
    # already kept, so the sheet covers the whole episode instead of its first seconds
    queues = [sorted(set(g)) for g in (closes, stops, gestures, media) if g]
    while any(queues):
        for q in queues:
            if not q:
                continue
            for frame, reason in [x for x in q if any(abs(k[0] - x[0]) < MIN_GAP for k in kept)]:
                add(frame, reason, MAX_FRAMES)  # merges its reason into the neighbour
                q.remove((frame, reason))
            if q and len(kept) < MAX_FRAMES:
                best = max(q, key=lambda x: min(abs(k[0] - x[0]) for k in kept))
                add(best[0], best[1], MAX_FRAMES)
                q.remove(best)
        if len(kept) >= MAX_FRAMES:
            # only merges are still possible
            for q in queues:
                for frame, reason in list(q):
                    if any(abs(k[0] - frame) < MIN_GAP for k in kept):
                        add(frame, reason, MAX_FRAMES)
                    q.remove((frame, reason))
    seen = {(f, r) for g in (media, closes, stops, gestures) for f, r in g}
    dropped = sum(1 for f, r in seen if not any(abs(k[0] - f) < MIN_GAP for k in kept))
    return sorted((f, r) for f, r in kept), dropped


def find_font():
    for f in FONTS:
        if pathlib.Path(f).is_file():
            return f
    try:
        out = subprocess.run(["fc-match", "-f", "%{file}", "sans:bold"], capture_output=True, text=True, timeout=10).stdout.strip()
        return out if out and pathlib.Path(out).is_file() else None
    except (OSError, subprocess.SubprocessError):
        return None


def tile(files, labels, sheet, font):
    """One ffmpeg call: label every still, concatenate them as frames, tile them 4 per row."""
    rows = -(-len(files) // COLUMNS)
    cmd = ["ffmpeg", "-v", "error", "-y"]
    for f in files:
        cmd += ["-i", str(f)]
    parts = []
    for i, label in enumerate(labels):
        chain = f"[{i}:v]setsar=1"
        if font:
            safe = re.sub(r"[^\w .#+/-]", " ", label)
            chain += (f",drawtext=fontfile='{font}':text='{safe}':x=8:y=8:fontsize=h/30:fontcolor=white:"
                      "box=1:boxcolor=black@0.7:boxborderw=6")
        parts.append(chain + f"[v{i}]")
    parts.append("".join(f"[v{i}]" for i in range(len(files))) + f"concat=n={len(files)}:v=1:a=0,tile={COLUMNS}x{rows}:padding=4:margin=4[out]")
    cmd += ["-filter_complex", ";".join(parts), "-map", "[out]", "-frames:v", "1", "-q:v", "3", str(sheet)]
    return subprocess.run(cmd, capture_output=True, text=True)


def main():
    ap = argparse.ArgumentParser(description="Render review stills of an episode and tile them in a sheet.")
    ap.add_argument("episode_id")
    ap.add_argument("--out", default=None, help="output folder (default out/stills/<id>)")
    ap.add_argument("--scale", type=float, default=0.35, help="render scale of the stills (default 0.35)")
    ap.add_argument("--dry", action="store_true", help="print the frame list, render nothing")
    ap.add_argument("--sync-only", action="store_true", help="sync episodes/<id> to public/episodes/<id> and stop")
    a = ap.parse_args()

    eid = a.episode_id.strip("/").split("/")[-1]
    ep_path = ROOT / "episodes" / eid / "episode.json"
    if not ep_path.is_file():
        sys.exit(f"episodes/{eid}/episode.json not found (run tools/build_episode.py first)")
    if a.sync_only:
        report_sync(eid)
        return 0

    ep = json.loads(ep_path.read_text(encoding="utf-8"))
    fps = ep.get("fps", 30)
    frames, dropped = pick(ep)
    out = pathlib.Path(a.out) if a.out else ROOT / "out" / "stills" / eid
    if not out.is_absolute():
        out = pathlib.Path.cwd() / out
    print(f"{eid}: {len(frames)} stills" + (f" ({dropped} candidate(s) left out by the cap of {MAX_FRAMES})" if dropped else ""))
    for f, reasons in frames:
        print(f"  f{f:04d}  {f / fps:6.2f}s  {' + '.join(reasons)}")
    if a.dry:
        return 0

    report_sync(eid)
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("f[0-9]*.jpg"):  # stills of a previous run would not match the new list
        old.unlink()
    props = json.dumps({"episodeId": eid})
    files, labels, failed = [], [], []
    for n, (f, reasons) in enumerate(frames, start=1):
        target = out / f"f{f:04d}.jpg"
        cmd = ["npx", "remotion", "still", "src/index.ts", "Episode", str(target),
               f"--frame={f}", f"--scale={a.scale}", f"--props={props}"]
        res = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
        if res.returncode != 0 or not target.is_file():
            failed.append(f)
            tail = "\n".join((res.stdout + "\n" + res.stderr).strip().splitlines()[-12:])
            print(f"  [{n}/{len(frames)}] f{f:04d} FAILED\n{tail}", flush=True)
            continue
        print(f"  [{n}/{len(frames)}] f{f:04d} ok", flush=True)
        files.append(target)
        labels.append(f"f{f} {' + '.join(reasons)}")
    if not files:
        sys.exit("no still rendered")

    sheet = out / "sheet.jpg"
    font = find_font()
    res = tile(files, labels, sheet, font)
    if res.returncode != 0 and font:
        print("note: drawtext failed, sheet tiled without labels")
        res = tile(files, labels, sheet, None)
    if res.returncode != 0 or not sheet.is_file():
        sys.exit(f"ffmpeg could not build the sheet:\n{res.stderr.strip()}")
    print(f"sheet: {sheet}")
    for i, label in enumerate(labels):
        print(f"  {i // COLUMNS + 1}.{i % COLUMNS + 1}  {label}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
