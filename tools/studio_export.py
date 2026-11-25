#!/usr/bin/env python3
"""Export the choices of a "new video" assistant (a dashboard, a form, a chat) to stats/studio.json.

One flat row per choice (character, format, style, idea, series), with a small JPEG preview embedded as a
data URL where one exists in docs/img/studio/ (`char-<id>.jpg`, `look-<id>.jpg`, `style-<id>.jpg`).

Rows come from the repo so the assistant never drifts from it:
  characters  characters/voices.json + voices/catalog.json, plus "none" (no host)
  formats     formats/*.json
  styles      the base presets (presets/*.json) and the looks (looks/*.json, templates starting with "_" left out)
  ideas       ideas/backlog.md (rows that are not `used`)
  series      series/<slug>/ (episodes.json gives the next part)
A repo with no look, no idea and no series yet gives a file with the characters, the formats and the base presets.

Usage:
  studio_export.py            write stats/studio.json and print a summary
Run it after a change of characters, formats, looks or backlog.
"""
import base64, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "docs" / "img" / "studio"


def read_json(path, default):
    """Content of a JSON file, or `default` when it is absent or does not parse."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def thumb(name):
    """Return the data URL of docs/img/studio/<name>.jpg, or an empty string when there is none."""
    p = IMG / f"{name}.jpg"
    return "data:image/jpeg;base64," + base64.b64encode(p.read_bytes()).decode() if p.is_file() else ""


def row(kind, id_, name, info, **more):
    base = {"key": f"{kind}:{id_}", "kind": kind, "id": id_, "name": name, "info": info, "status": "", "thumb": "",
            "character": "", "voice": "", "target_s": None, "max_s": None, "production": "", "hook": "", "repo": "", "formats": ""}
    base.update(more)
    return base


def backlog():
    """Yield (character, idea, hook, status) for every table row of ideas/backlog.md (nothing when it is absent)."""
    path = ROOT / "ideas" / "backlog.md"
    if not path.is_file():
        return
    who = ""
    for line in path.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^## (\S+)", line)
        if m:
            who = m.group(1)
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if who and len(cells) == 3 and cells[0] not in ("Idea", "") and not set(cells[0]) <= set("-"):
            yield who, cells[0], cells[1], cells[2]


def main():
    rows = []
    voices = read_json(ROOT / "voices" / "catalog.json", {})
    hosts = read_json(ROOT / "characters" / "voices.json", {})
    formats = [read_json(p, None) for p in sorted((ROOT / "formats").glob("*.json"))]
    formats = [f for f in formats if isinstance(f, dict) and f.get("id")]

    def formats_of(cid):
        return ",".join(f["id"] for f in formats if f.get("default_character", "none") == cid)

    for cid in hosts:
        voice = voices.get(hosts[cid], {}) if isinstance(hosts[cid], str) else {}
        rows.append(row("character", cid, cid, voice.get("use", ""), voice=voice.get("name", ""),
                        thumb=thumb(f"char-{cid}"), formats=formats_of(cid)))
    rows.append(row("character", "none", "No host", "Pure motion design, a narrator in voice-over (the format's voice).",
                    formats=formats_of("none")))
    for f in formats:
        duration = f.get("duration_s") or {}
        rows.append(row("format", f["id"], f.get("name", f["id"]), f.get("summary", ""), status=f.get("status", ""),
                        character=f.get("default_character", "none"), production=f.get("production", "code"),
                        target_s=duration.get("target"), max_s=duration.get("max"),
                        voice=(f.get("voice") or {}).get("voice", "")))
    for p in sorted((ROOT / "presets").glob("*.json")):
        rows.append(row("style", p.stem, p.stem, "Base preset of the engine.", status="ready",
                        thumb=thumb(f"look-{p.stem}"), repo=f"presets/{p.name}"))
    for p in sorted((ROOT / "looks").glob("*.json")):
        if p.name.startswith("_"):
            continue  # templates
        look = read_json(p, {})
        rows.append(row("style", p.stem, p.stem, look.get("description", ""), status="ready",
                        thumb=thumb(f"look-{p.stem}"), repo=f"looks/{p.name}"))
    for who, idea, hook, status in backlog():
        if status.startswith("used") or hook.startswith("see "):
            continue
        rows.append(row("idea", re.sub(r"[^a-z0-9]+", "-", idea.lower())[:40].strip("-"), hook, idea,
                        character=who, hook=hook, status=status))
    series_dir = ROOT / "series"
    for d in sorted(series_dir.iterdir()) if series_dir.is_dir() else []:
        eps = d / "episodes.json"
        if not d.is_dir() or not eps.is_file():
            continue
        parts = [e.get("part", 0) for e in json.loads(eps.read_text())]
        voice = json.loads((d / "voice.json").read_text()).get("voice", "") if (d / "voice.json").is_file() else ""
        host = next((c for c, v in hosts.items() if v == voice), "")
        look = json.loads((d / "look.json").read_text()).get("from", "") if (d / "look.json").is_file() else ""
        lang = json.loads((d / "lang.json").read_text()).get("lang", "fr") if (d / "lang.json").is_file() else "fr"
        # Total number of parts, as written in the plan of the saga's latest episode (series.total).
        total = None
        for e in json.loads(eps.read_text()):
            plan = ROOT / "episodes" / e.get("id", "") / "plan.json"
            if plan.is_file():
                total = (json.loads(plan.read_text()).get("series") or {}).get("total") or total
        done = bool(parts) and total is not None and max(parts) >= total
        info = (f"Finished ({max(parts)}/{total})" if done
                else f"Part {max(parts) + 1} to make" if parts else "Part 1 to make")
        # `production` = "done" tells the dashboard's assistant not to offer a finished saga as a subject;
        # `lang` is the saga's one language (a saga never changes language, docs/LANGUAGE.md).
        rows.append(row("series", d.name, d.name, info, character=host, status=look,
                        target_s=max(parts) + 1 if parts else 1, production="done" if done else "", lang=lang))
    out = ROOT / "stats" / "studio.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=1) + "\n")
    kinds = {}
    for r in rows:
        kinds[r["kind"]] = kinds.get(r["kind"], 0) + 1
    print(out, f"{out.stat().st_size // 1024} KB", kinds)


if __name__ == "__main__":
    main()
