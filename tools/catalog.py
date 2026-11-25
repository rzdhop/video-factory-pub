#!/usr/bin/env python3
"""Catalog: which episode is behind each published post, so numbers can be read per character, format, saga, brand.

  catalog.py                                         table of the episodes and their posts
  catalog.py link <episode_id> [--instagram URL] [--tiktok URL]     record the public link(s) of an episode
  catalog.py build                                   write stats/catalog.json (the file the dashboard reads)

stats/posts.json holds the links (hand-fed by `link`, right after a post is out). `build` joins them with what the repo
knows of each episode (title, character, format, saga and part, brand, length, kind of opening, hook sentence) and writes
one row per episode in stats/catalog.json. The dashboard matches a scheduled post to a row by the id found in its URL
(Instagram: the code after /reel/; TikTok: the digits after /video/). Run `build` after every `link` and every new
episode, then upload stats/catalog.json and stats/videos.json to the dashboard (docs/PUBLISH.md, "Dashboard").
"""
import argparse, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
POSTS = ROOT / "stats" / "posts.json"
OUT = ROOT / "stats" / "catalog.json"
sys.path.insert(0, str(ROOT / "tools"))
from brands import brand_of  # noqa: E402
import lang as langs  # noqa: E402

PATTERNS = {"instagram": r"/(?:reel|p)/([A-Za-z0-9_-]+)", "tiktok": r"/video/(\d+)"}


def post_id(network, url):
    m = re.search(PATTERNS[network], url or "")
    if not m:
        sys.exit(f"{network}: no post id found in {url!r}")
    return m.group(1)


def load_posts():
    return json.loads(POSTS.read_text()) if POSTS.is_file() else {}


def episode_row(ep_dir, posts):
    plan = json.loads((ep_dir / "plan.json").read_text())
    ep = json.loads((ep_dir / "episode.json").read_text()) if (ep_dir / "episode.json").is_file() else {}
    series = plan.get("series") or {}
    opening = plan.get("opening") or {}
    links = posts.get(ep_dir.name, {})
    return {
        "episode": ep_dir.name,
        "title": plan.get("title") or ep.get("title") or ep_dir.name,
        "character": plan.get("character") or "none",
        "format": plan.get("format", "humour-host"),
        "lang": langs.resolve(plan)[0],
        "series": series.get("slug", "") if isinstance(series, dict) else str(series),
        "part": series.get("part") if isinstance(series, dict) else None,
        "brand": brand_of(ep_dir.name)[0],
        "length_s": round(ep.get("duration", 0), 1) or None,
        "opening": "hook card" if opening else ("close-up" if plan.get("retime", {}).get("intro_after") else "plain"),
        "hook": re.sub(r"[*|]", "", opening.get("title", "")).replace("  ", " ").strip(),
        "instagram_url": links.get("instagram", ""),
        "instagram_id": post_id("instagram", links["instagram"]) if links.get("instagram") else "",
        "tiktok_url": links.get("tiktok", ""),
        "tiktok_id": post_id("tiktok", links["tiktok"]) if links.get("tiktok") else "",
    }


def rows():
    posts = load_posts()
    unknown = [e for e in posts if not (ROOT / "episodes" / e / "plan.json").is_file()]
    if unknown:
        sys.exit(f"stats/posts.json names episodes that are not in the repo: {', '.join(unknown)}")
    eps = ROOT / "episodes"
    return [episode_row(d, posts) for d in sorted(eps.iterdir()) if (d / "plan.json").is_file()] if eps.is_dir() else []


def main():
    a = sys.argv[1:]
    if a[:1] == ["link"]:
        ap = argparse.ArgumentParser(prog="catalog.py link")
        ap.add_argument("episode"); ap.add_argument("--instagram"); ap.add_argument("--tiktok")
        v = ap.parse_args(a[1:])
        if not (ROOT / "episodes" / v.episode / "plan.json").is_file():
            sys.exit(f"{v.episode}: not an episode of the repo")
        posts = load_posts()
        for network in ("instagram", "tiktok"):
            url = getattr(v, network)
            if url:
                url = url.split("?")[0]
                post_id(network, url)
                posts.setdefault(v.episode, {})[network] = url
        POSTS.parent.mkdir(exist_ok=True)
        POSTS.write_text(json.dumps(posts, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
        print(f"{v.episode}: {posts.get(v.episode, {})}")
        return
    if a[:1] == ["build"]:
        data = rows()
        OUT.parent.mkdir(exist_ok=True)
        OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
        linked = sum(1 for r in data if r["instagram_id"] or r["tiktok_id"])
        print(f"{OUT.relative_to(ROOT)}: {len(data)} episodes, {linked} with at least one post linked")
        return
    if a:
        sys.exit(__doc__)
    print(f"{'episode':28} {'lang':4} {'character':9} {'format':15} {'brand':13} {'instagram':12} {'tiktok'}")
    data = rows()
    if not data:
        print("no episode yet: python3 tools/new_episode.py <id> --format <format>")
    for r in data:
        print(f"{r['episode'][:28]:28} {r['lang']:4} {r['character']:9} {r['format']:15} {r['brand']:13} {r['instagram_id'] or '-':12} {r['tiktok_id'] or '-'}")


if __name__ == "__main__":
    main()
