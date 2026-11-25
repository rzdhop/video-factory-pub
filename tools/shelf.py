#!/usr/bin/env python3
"""Shelf of an episode: what a visitor of the profile sorts by (docs/SHELVES.md).

Usage: shelf.py <episode_id>            prints the shelf, the caption tag and the hashtag
       shelf.py                         lists the shelves of brands/shelves.json
Resolution: plan.json `series.slug` (the shelf whose `series` is that slug), else plan.json `shelf`, else the shelf
whose `default_for.character` is the episode's character. No shelf found is an error: every episode sits on one.
Standard library only.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REG = ROOT / "brands" / "shelves.json"
WORDS = {"fr": {"saga": "SAGA", "part": "PARTIE", "of": "SUR", "first": "À VOIR EN PREMIER"},
         "en": {"saga": "SERIES", "part": "PART", "of": "OF", "first": "WATCH THIS FIRST"}}


def registry():
    """Shelves of brands/shelves.json; an absent or empty file is an empty registry."""
    if not REG.is_file():
        return {}
    try:
        data = json.loads(REG.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"brands/shelves.json does not parse: {exc}")
    return data if isinstance(data, dict) else {}


def resolve(eid, plan=None):
    """Return a dict: id, kind, color, label, sub, big (the big figure of the band), tag, hashtag, lang."""
    eid = eid.strip("/").split("/")[-1]
    if plan is None:
        plan_path = ROOT / "episodes" / eid / "plan.json"
        if not plan_path.is_file():
            raise SystemExit(f"{eid}: episodes/{eid}/plan.json not found")
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
    lang = plan.get("lang") or "fr"
    lang = lang if lang in WORDS else "fr"
    reg, series = registry(), plan.get("series") if isinstance(plan.get("series"), dict) else None
    sid = None
    if series:
        sid = next((k for k, v in reg.items() if v.get("series") == series.get("slug")), None)
        if sid is None:
            raise SystemExit(f"{eid}: the saga '{series.get('slug')}' has no shelf in brands/shelves.json (docs/SHELVES.md)")
    elif plan.get("shelf"):
        sid = plan["shelf"]
        if sid not in reg:
            raise SystemExit(f"{eid}: unknown shelf '{sid}' (brands/shelves.json)")
    else:
        sid = next((k for k, v in reg.items()
                    if (v.get("default_for") or {}).get("character") == plan.get("character")), None)
        if sid is None:
            raise SystemExit(f"{eid}: no shelf: set \"shelf\" in plan.json or add one to brands/shelves.json (docs/SHELVES.md)")
    sh, w = reg[sid], WORDS[lang]
    pick = lambda d: (d or {}).get(lang) or (d or {}).get("fr") or (d or {}).get("en") or ""
    out = {"id": sid, "kind": sh["kind"], "color": sh["color"], "label": pick(sh["label"]), "lang": lang,
           "hashtag": sh.get("hashtag", "")}
    if series:
        part, total, badge = series.get("part"), series.get("total"), str(series.get("badge") or "").strip()
        m = re.search(r"\d+", badge)
        if badge and m:  # an out-of-order part such as "ÉPISODE 0": its own figure, never the slot it borrows
            out.update(big=m.group(0), sub=f"{w['saga']} · {badge.upper()} · {w['first']}" if m.group(0) == "0" else f"{w['saga']} · {badge.upper()}",
                       tag=f"{pick(sh['tag'])} · {badge.capitalize()}")
        else:
            n = f"{part}/{total}" if total else str(part)
            out.update(big=n, sub=f"{w['saga']} · {w['part']} {part}" + (f" {w['of']} {total}" if total else ""),
                       tag=f"{pick(sh['tag'])} {n}")
    else:
        out.update(big="SOLO", sub=pick(sh.get("sub")), tag=pick(sh["tag"]))
    return out


def main():
    if len(sys.argv) < 2:
        reg = registry()
        if not reg:
            print("no shelf yet: add one to brands/shelves.json (id, kind, label, tag, color, hashtag; docs/SHELVES.md)")
        for k, v in reg.items():
            label = v.get("label") or {}
            print(f"{k:16} {v.get('kind', '?'):5} {v.get('color', '?')}  {(label.get('fr') or label.get('en') or ''):16} {v.get('hashtag','')}")
        return 0
    s = resolve(sys.argv[1])
    print(f"shelf:   {s['id']} ({s['kind']}, {s['color']})")
    print(f"cover:   [{s['big']}] {s['label']} · {s['sub']}")
    print(f"caption: [{s['tag']}] ... {s['hashtag']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
