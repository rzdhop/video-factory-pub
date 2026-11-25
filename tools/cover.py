#!/usr/bin/env python3
"""Cover of an episode: the opening frame (hook title on a complete, bright picture) plus its shelf band.

Usage: cover.py <episode_id> [--frame N] [--out out/<id>.cover.jpg] [--no-band]
       cover.py <name> --image frame.jpg --shelf <shelf id> --part 4 --total 4       (an episode that is not in the repo)
The shelf band (docs/SHELVES.md, tools/shelf.py) says which saga and which part, or which kind of episode, in one
colour per shelf: it sits under the hook, inside the 4:5 and 3:4 centre crops of the profile grids. It is drawn by
headless Chrome (VF_CHROME, else a common install path; tools/_chrome.py) with the fonts of node_modules/@fontsource. The frame without the band is
kept as `<name>.raw.jpg`.
Needs an `opening` block in episode.json (plan.json `opening`, docs/ENGINE_CONTRACT.md): without it the first
frames say nothing about the video and the tool refuses.
Syncs the episode to public/ like tools/stills.py (`stills.py <id> --sync-only`), renders ONE still with
`npx remotion still` (default frame: the first one where the scale settle of the title is over, 0.2 s in), then
writes next to it `<name>.grid.jpg`: the central 3:4 crop (1080x1440 of 1080x1920) that a profile grid shows.
Prints both paths. Nothing else may render at the same time (2 cores).
"""
import argparse, html, json, math, pathlib, subprocess, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import shelf as shelves
import _chrome

ROOT = pathlib.Path(__file__).resolve().parent.parent
SETTLE_S = 0.2  # OPENING_SETTLE_S of src/layers/OpeningCard.tsx


BAND_TOP, BAND_H = 1500, 130  # px in the 1080x1920 frame: under a 3-line hook, above the 4:5 crop's lower edge (1635)


def band(raw, out, sh):
    """Draw the shelf band of `sh` (tools/shelf.py resolve) over the frame `raw` and write `out`."""
    fonts = ROOT / "node_modules" / "@fontsource"
    anton = fonts / "anton" / "files" / "anton-latin-400-normal.woff2"
    mono = fonts / "jetbrains-mono" / "files" / "jetbrains-mono-latin-700-normal.woff2"
    for f in (anton, mono):
        if not f.is_file():
            sys.exit(f"font not found: {f} (npm install)")
    big, e = sh["big"], html.escape
    big_px = 92 if len(big) <= 1 else 82 if len(big) <= 3 else 56
    label_px = 68 if len(sh["label"]) <= 14 else 54
    sub_px = 25 if len(sh["sub"]) <= 30 else 22
    flag = '<span class="flag">EN</span>' if sh.get("lang") == "en" else ""
    page = f"""<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:A;src:url('{anton.as_uri()}')}} @font-face{{font-family:M;src:url('{mono.as_uri()}')}}
html,body{{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}}
body{{background:url('{raw.as_uri()}') 0 0/1080px 1920px no-repeat}}
.band{{position:absolute;left:56px;right:56px;top:{BAND_TOP}px;height:{BAND_H}px;display:flex;border-radius:10px;
 overflow:hidden;background:{sh['color']};box-shadow:0 0 0 5px {sh['color']},0 14px 40px rgba(0,0,0,.7)}}
.big{{flex:0 0 250px;background:#05080A;color:{sh['color']};font:{big_px}px/{BAND_H}px A;text-align:center;letter-spacing:1px}}
.txt{{flex:1;padding:0 26px;display:flex;flex-direction:column;justify-content:center;color:#05080A;min-width:0}}
.label{{font:{label_px}px/1 A;letter-spacing:1px;white-space:nowrap}}
.sub{{font:{sub_px}px/1 M;margin-top:9px;white-space:nowrap;letter-spacing:.5px}}
.flag{{font:30px/1 M;background:#05080A;color:{sh['color']};padding:6px 10px;border-radius:6px;margin-left:16px;vertical-align:middle;position:relative;top:-10px}}
</style><div class="band"><div class="big">{e(big)}</div><div class="txt"><div class="label">{e(sh['label'])}{flag}</div>
<div class="sub">{e(sh['sub'])}</div></div></div>"""
    page_file = out.with_suffix(".band.html")
    page_file.write_text(page, encoding="utf-8")
    png = out.with_suffix(".band.png")
    chrome = _chrome.find()
    if not chrome:
        sys.exit("no Chrome / Chromium found to draw the shelf band: set VF_CHROME to its path, or pass --no-band")
    res = subprocess.run([chrome, "--headless=new", "--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1",
                          "--allow-file-access-from-files", "--virtual-time-budget=4000", "--window-size=1080,1920",
                          f"--screenshot={png}", page_file.as_uri()], capture_output=True, text=True)
    if res.returncode != 0 or not png.is_file():
        sys.exit(f"the shelf band could not be drawn:\n{res.stderr.strip()[-600:]}")
    res = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(png), "-frames:v", "1", "-q:v", "2", str(out)],
                         capture_output=True, text=True)
    page_file.unlink(); png.unlink()
    if res.returncode != 0 or not out.is_file():
        sys.exit(f"ffmpeg could not write {out}:\n{res.stderr.strip()}")


def grid_crop(out):
    grid = out.with_name(out.stem + ".grid" + out.suffix)
    res = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-vf", "crop=iw:iw*4/3", "-frames:v", "1",
                          "-q:v", "2", str(grid)], capture_output=True, text=True)
    if res.returncode != 0 or not grid.is_file():
        sys.exit(f"cover written to {out}, but ffmpeg could not make the grid crop:\n{res.stderr.strip()}")
    return grid


def main():
    ap = argparse.ArgumentParser(description="Render the opening frame of an episode as its cover with its shelf band, plus the 3:4 grid crop.")
    ap.add_argument("--no-band", action="store_true", help="opening frame only, no shelf band")
    ap.add_argument("--image", default=None, help="use this 1080x1920 frame instead of rendering (episode not in the repo)")
    ap.add_argument("--shelf", default=None, help="with --image: shelf id of brands/shelves.json")
    ap.add_argument("--part", type=int, default=None, help="with --image and a saga shelf: part number")
    ap.add_argument("--total", type=int, default=None, help="with --image and a saga shelf: number of parts")
    ap.add_argument("--lang", default="fr", help="with --image: language of the video")
    ap.add_argument("episode_id")
    ap.add_argument("--frame", type=int, default=None, help="frame to render (default: title settled, 0.2 s in)")
    ap.add_argument("--out", default=None, help="output file (default out/<id>.cover.jpg)")
    a = ap.parse_args()

    eid = a.episode_id.strip("/").split("/")[-1]
    if a.image:
        if not a.shelf:
            sys.exit("--image needs --shelf")
        reg = shelves.registry()
        if a.shelf not in reg:
            sys.exit(f"unknown shelf '{a.shelf}' (brands/shelves.json has: {', '.join(reg) or 'no shelf yet'})")
        plan = {"lang": a.lang, "shelf": a.shelf}
        if reg[a.shelf].get("series"):
            if not a.part:
                sys.exit("a saga shelf needs --part (and --total)")
            plan = {"lang": a.lang, "series": {"slug": reg[a.shelf]["series"], "part": a.part, "total": a.total}}
        out = pathlib.Path(a.out) if a.out else ROOT / "out" / f"{eid}.cover.jpg"
        out.parent.mkdir(parents=True, exist_ok=True)
        band(pathlib.Path(a.image).resolve(), out.resolve(), shelves.resolve(eid, plan))
        print(f"cover: {out}  (from {a.image})")
        print(f"grid crop 3:4: {grid_crop(out)}")
        return 0
    src, pub = ROOT / "episodes" / eid / "episode.json", ROOT / "public" / "episodes" / eid / "episode.json"
    if src.is_file():
        res = subprocess.run([sys.executable, str(ROOT / "tools" / "stills.py"), eid, "--sync-only"], cwd=ROOT)
        if res.returncode != 0:
            sys.exit(f"could not sync episodes/{eid} to public/")
    elif pub.is_file():
        print(f"note: episodes/{eid}/episode.json not found, using public/episodes/{eid} as it is")
    else:
        sys.exit(f"episodes/{eid}/episode.json not found (run tools/build_episode.py first)")
    ep = json.loads(pub.read_text(encoding="utf-8"))

    opening = ep.get("opening")
    if not isinstance(opening, dict) or not str(opening.get("title") or "").strip():
        sys.exit(f"{eid} has no `opening`: its first frame does not say what the video is about, so there is no "
                 "cover to make. Add \"opening\": {\"title\": \"... | ... *WORD*\"} to plan.json "
                 "(docs/ENGINE_CONTRACT.md), rebuild episode.json, then run this again.")
    fps = ep.get("fps", 30)
    last = max(0, int(ep["duration"] * fps) - 1)
    frame = a.frame if a.frame is not None else math.ceil(SETTLE_S * fps)
    if not 0 <= frame <= last:
        sys.exit(f"--frame {frame} is outside the episode (0 to {last})")

    out = pathlib.Path(a.out) if a.out else ROOT / "out" / f"{eid}.cover.jpg"
    if not out.is_absolute():
        out = pathlib.Path.cwd() / out
    out.parent.mkdir(parents=True, exist_ok=True)
    props = json.dumps({"episodeId": eid})
    cmd = ["npx", "remotion", "still", "src/index.ts", "Episode", str(out), f"--frame={frame}",
           "--jpeg-quality=92", f"--props={props}"]
    if out.suffix.lower() == ".png":
        cmd.remove("--jpeg-quality=92")
    res = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if res.returncode != 0 or not out.is_file():
        tail = "\n".join((res.stdout + "\n" + res.stderr).strip().splitlines()[-12:])
        sys.exit(f"the still failed:\n{tail}")

    if not a.no_band:
        raw = out.with_name(out.stem + ".raw" + out.suffix)
        out.replace(raw)
        band(raw, out, shelves.resolve(eid))
    grid = grid_crop(out)
    print(f"cover: {out}  (frame {frame}, '{opening['title']}')")
    print(f"grid crop 3:4: {grid}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
