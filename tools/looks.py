#!/usr/bin/env python3
"""Looks: the colours, lights, fonts and kit style of an episode or of a whole series.

A look is a partial preset in looks/<id>.json, laid over a base preset (`extends`, default dark-2d).
The engine ships with NO look: an episode without one is drawn with its base preset (presets/<id>.json).
To create one, copy looks/_TEMPLATE.json to looks/<id>.json, set "id" to the file name and edit the values
(docs/LOOKS.md). Files whose name starts with "_" are templates: the tools ignore them, and keys starting
with "_" inside a look are comments.
Resolution, least to most specific (each layer starts from the previous one):
  format   formats/<id>.json            "look": "<id>"
  series   series/<slug>/look.json       a look object; "from": "<id>" starts from a shared look
  episode  plan.json                     "look": "<id>"  or  {"from": "<id>", ...overrides}
An id replaces what came before; an object is merged over its "from" look, or over the previous layer.
The resolved look is embedded in episode.json (`look`), so the engine needs no registration.

Usage:
  looks.py                         list and validate looks/
  looks.py apply <episode_dir>     resolve the look and write it into episode.json (no timing change)
  looks.py show <episode_dir>      print the resolved look
  looks.py preview <id> [out_dir]  render the kit sheet (2 pages) with that look ("base" = the base preset)
"""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOOKS = ROOT / "looks"
HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
RGBA = re.compile(r"^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:\d*\.)?\d+\s*)?\)$")
STRICT_HEX = ("accent", "accentAlt", "bg.top", "bg.bottom", "bg.light", "bg.light2")  # and kit.color.* except grid
RGBA_OK = ("textHud", "lineColor", "bg.gridColor", "kit.color.grid")
FONTS = {"Anton", "Inter", "JetBrains Mono", "Bebas Neue", "Archivo Black", "DM Serif Display", "Space Grotesk"}
TOP_KEYS = {"id", "extends", "from", "description", "bg", "accent", "accentAlt", "textPrimary", "textHud", "lineColor",
            "fontKinetic", "fontHud", "fontMono", "caption", "hud", "camera", "kit", "sceneBox", "host", "hostless", "layouts", "style", "styleHost", "character"}


def merge(base, over):
    """Deep merge of dicts: values of `over` win."""
    out = dict(base)
    for k, v in over.items():
        out[k] = merge(out[k], v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
    return out


HOWTO = "copy looks/_TEMPLATE.json to looks/<id>.json, set its \"id\", edit the colours (docs/LOOKS.md)"


def look_files():
    """Look files of looks/, templates (names starting with "_") left out."""
    return sorted(p for p in LOOKS.glob("*.json") if not p.name.startswith("_")) if LOOKS.is_dir() else []


def strip_comments(node):
    """A look without its comment keys (keys starting with "_"), at every depth."""
    if isinstance(node, dict):
        return {k: strip_comments(v) for k, v in node.items() if not k.startswith("_")}
    return node


def load(look_id):
    p = LOOKS / f"{look_id}.json"
    if str(look_id).startswith("_") or not p.is_file():
        known = ", ".join(f.stem for f in look_files()) or "none yet"
        raise SystemExit(f"unknown look '{look_id}' (no looks/{look_id}.json; known looks: {known}). To create one: {HOWTO}")
    try:
        return strip_comments(json.loads(p.read_text(encoding="utf-8")))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"looks/{look_id}.json does not parse: {exc}")


def luminance(hex_colour):
    r, g, b = (int(hex_colour[i:i + 2], 16) / 255 for i in (1, 3, 5))
    lin = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def validate(look):
    """Return a list of problems of a look object (empty when fine)."""
    errs = []
    for k in look:
        if k not in TOP_KEYS:
            errs.append(f"unknown key '{k}'")
    if look.get("extends") and not (ROOT / "presets" / f"{look['extends']}.json").is_file():
        errs.append(f"extends '{look['extends']}': no such preset")
    for k in ("fontKinetic", "fontHud", "fontMono"):
        if k in look and look[k] not in FONTS:
            errs.append(f"{k} '{look[k]}' is not installed (available: {', '.join(sorted(FONTS))}; add an @fontsource import in src/Root.tsx first)")
    def walk(node, path):
        for k, v in node.items():
            if isinstance(v, dict):
                walk(v, f"{path}{k}.")
            elif isinstance(v, str) and v.startswith("#") and not HEX.match(v):
                errs.append(f"{path}{k}: '{v}' is not a #RRGGBB colour")
    walk(look, "")
    # colours the engine computes with (gradients, lights, glows, kit tints): #RRGGBB only
    def at(path):
        node = look
        for part in path.split("."):
            node = node.get(part) if isinstance(node, dict) else None
        return node
    kit_colours = at("kit.color")
    if kit_colours is not None and not isinstance(kit_colours, dict):
        errs.append("kit.color must be an object {name: colour}")
        kit_colours = {}
    strict = [p for p in STRICT_HEX if at(p) is not None]
    strict += [f"kit.color.{k}" for k in (kit_colours or {}) if f"kit.color.{k}" not in RGBA_OK]
    for path in strict:
        v = at(path)
        if not (isinstance(v, str) and HEX.match(v)):
            msg = f"{path}: {v!r} is not a #RRGGBB colour"
            if not any(e.startswith(f"{path}:") for e in errs):
                errs.append(msg)
    for path in RGBA_OK:
        v = at(path)
        if v is not None and not (isinstance(v, str) and (HEX.match(v) or RGBA.match(v))):
            if not any(e.startswith(f"{path}:") for e in errs):
                errs.append(f"{path}: {v!r} is neither a #RRGGBB colour nor an rgba() string")
    bg = look.get("bg", {})
    # the engine draws white captions, white highlights and a black vignette: backgrounds must stay dark or mid-tone
    for k in ("top", "bottom"):
        if HEX.match(str(bg.get(k, ""))) and luminance(bg[k]) > 0.22:
            errs.append(f"bg.{k} {bg[k]} is too light: light backgrounds are not supported yet (white captions and highlights)")
    return errs


def resolve(plan, verbose=False):
    """Resolved look object of a plan (or None): format < series < episode."""
    layers = []
    fmt_path = ROOT / "formats" / f"{plan.get('format', 'humour-host')}.json"
    if fmt_path.is_file():
        layers.append(("format", json.loads(fmt_path.read_text()).get("look")))
    slug = (plan.get("series") or {}).get("slug")
    if slug and (ROOT / "series" / slug / "look.json").is_file():
        layers.append(("series", json.loads((ROOT / "series" / slug / "look.json").read_text())))
    layers.append(("episode", plan.get("look")))
    cur, names = None, []
    for origin, layer in layers:
        if not layer:
            continue
        if isinstance(layer, str):
            cur, label = load(layer), layer
        else:
            layer = dict(layer)
            src = layer.pop("from", None)
            base = load(src) if src else (cur or {})
            cur, label = merge(base, layer), layer.get("id") or (f"{src}+{origin}" if src else origin)
        names.append(label)
        if verbose:
            print(f"  {origin}: {label}")
    if cur is None:
        return None
    cur = {k: v for k, v in cur.items() if k != "from"}
    cur["id"] = "+".join(names)
    return cur


def main():
    a = sys.argv[1:]
    if not a:
        bad = 0
        files = look_files()
        if not files:
            print(f"no look yet: episodes use their base preset (presets/). To create one: {HOWTO}")
        for p in files:
            look = load(p.stem); errs = validate(look)
            if look.get("id") != p.stem: errs.append(f"id '{look.get('id')}' differs from the file name")
            bad += bool(errs)
            print(f"{p.stem:16} {'ok' if not errs else 'INVALID':8} {look.get('description', '')[:80]}")
            for e in errs: print(f"    {e}")
        sys.exit(1 if bad else 0)
    cmd = a[0]
    if cmd in ("apply", "show") and len(a) == 2:
        ep_dir = pathlib.Path(a[1])
        if not (ep_dir / "plan.json").is_file():
            sys.exit(f"{ep_dir}/plan.json not found (usage: looks.py {cmd} <episode_dir>)")
        plan = json.loads((ep_dir / "plan.json").read_text())
        look = resolve(plan, verbose=True)
        errs = validate(look) if look else []
        for e in errs: print("ERROR", e)
        if errs: sys.exit(1)
        if cmd == "show":
            print(json.dumps(look, ensure_ascii=False, indent=2) if look else
                  f"no look: this episode is drawn with its base preset '{plan.get('preset', 'dark-2d')}'. To create a look: {HOWTO}")
            return
        ep_path = ep_dir / "episode.json"
        if not ep_path.is_file():
            sys.exit(f"{ep_path} not found: run tools/build_episode.py {ep_dir} first")
        ep = json.loads(ep_path.read_text())
        if look: ep["look"] = look
        else: ep.pop("look", None)
        ep_path.write_text(json.dumps(ep, ensure_ascii=False, indent=1))
        print(f"{ep_path}: look = {look['id'] if look else 'none (base preset)'}")
    elif cmd == "preview" and len(a) == 1:
        sys.exit(f"usage: looks.py preview <id> [out_dir]   (known looks: {', '.join(f.stem for f in look_files()) or 'none yet'}; "
                 f"\"base\" previews the base preset). To create a look: {HOWTO}")
    elif cmd == "preview" and len(a) >= 2:
        # "base": the kit sheet with the base preset alone, so there is something to look at before the first look
        look = None if a[1] == "base" else load(a[1]); errs = validate(look) if look else []
        if errs: sys.exit("\n".join(errs))
        out = pathlib.Path(a[2] if len(a) > 2 else ROOT / "out" / "looks"); out.mkdir(parents=True, exist_ok=True)
        for page in (1, 2):
            f = out / f"{a[1]}_{page}.png"
            res = subprocess.run(["npx", "remotion", "still", "src/index.ts", "KitSheet", str(f), "--frame=120",
                                  "--props=" + json.dumps({"page": page, "look": look})], cwd=ROOT, capture_output=True, text=True)
            if res.returncode != 0:
                sys.exit("the still failed (npm install done? VF_CHROME set to a Chrome / Chromium?):\n"
                         + "\n".join((res.stdout + res.stderr).strip().splitlines()[-8:]))
            print(f)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
