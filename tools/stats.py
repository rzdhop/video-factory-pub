#!/usr/bin/env python3
"""Audience numbers of the published videos: the feedback loop of docs/RETENTION.md.

  stats.py                                   scoreboard (all snapshots, newest per video kept for the table)
  stats.py add <episode_id|label> --platform tiktok --views N --avg S --full PCT --drop S
               [--length S] [--hours H] [--likes N] [--comments N] [--shares N] [--saves N] [--note "..."]
Data lives in stats/videos.json (one entry per snapshot). `avg` = average watch time in seconds, `full` = % who
watched the whole video, `drop` = second where most viewers stopped, `hours` = hours since publication.
The table also shows what the episode did at its start (opening card, greeting first) so numbers can be compared.
"""
import argparse, datetime, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = ROOT / "stats" / "videos.json"


def episode_facts(ep_id):
    """Format, length and kind of opening of an episode of the repo (empty when the id is only a label)."""
    d = ROOT / "episodes" / ep_id
    facts = {}
    if (d / "plan.json").is_file():
        plan = json.loads((d / "plan.json").read_text())
        facts["format"] = plan.get("format", "humour-host")
        facts["opening"] = "hook card" if plan.get("opening") else ("close-up" if plan.get("retime", {}).get("intro_after") else "plain")
    if (d / "episode.json").is_file():
        facts["length"] = round(json.loads((d / "episode.json").read_text()).get("duration", 0), 1)
    return facts


def main():
    a = sys.argv[1:]
    rows = json.loads(DB.read_text() or "[]") if DB.is_file() else []
    if a and a[0] == "add":
        ap = argparse.ArgumentParser(prog="stats.py add")
        ap.add_argument("video"); ap.add_argument("--platform", default="tiktok")
        for k in ("views", "likes", "comments", "shares", "saves"): ap.add_argument(f"--{k}", type=int)
        for k in ("avg", "full", "drop", "length", "hours"): ap.add_argument(f"--{k}", type=float)
        ap.add_argument("--note", default="")
        v = vars(ap.parse_args(a[1:]))
        if v["views"] is None:
            sys.exit("--views is required (--avg too whenever the platform gives it)")
        row = {k: x for k, x in v.items() if x not in (None, "")}
        row.update({k: x for k, x in episode_facts(v["video"]).items() if k not in row})
        row["recorded"] = datetime.date.today().isoformat()
        rows.append(row); DB.parent.mkdir(exist_ok=True)
        DB.write_text(json.dumps(rows, ensure_ascii=False, indent=1) + "\n")
        print(f"recorded {v['video']} ({len(rows)} snapshots in {DB.relative_to(ROOT)})")
        return
    if not rows:
        print("no numbers yet. After a video is published: stats.py add <episode_id> --views N --avg S --full PCT --drop S")
        return
    latest = {}
    for r in rows:  # keep the snapshot with the most hours (or the last one) per video and platform
        key = (r["video"], r.get("platform"))
        if key not in latest or r.get("hours", 0) >= latest[key].get("hours", 0): latest[key] = r
    print(f"{'video':28} {'format':15} {'opening':9} {'len':>5} {'views':>6} {'avg s':>6} {'avg %':>6} {'full %':>7} {'drop s':>6} {'h':>4}")
    # a snapshot without average watch time (a network that does not report it) sorts last and shows "?"
    for r in sorted(latest.values(), key=lambda r: -(r["avg"] / r["length"] if r.get("length") and r.get("avg") else 0)):
        pct = f"{100 * r['avg'] / r['length']:.0f}" if r.get("length") and r.get("avg") else "?"
        print(f"{r['video'][:28]:28} {r.get('format', '?'):15} {r.get('opening', '?'):9} {r.get('length', '?'):>5} {r['views']:>6} "
              f"{r.get('avg', '?'):>6} {pct:>6} {r.get('full', '?'):>7} {r.get('drop', '?'):>6} {r.get('hours', '?'):>4}")
    print("\nSmall samples: read differences as hints. A video under ~300 views says little.")


if __name__ == "__main__":
    main()
