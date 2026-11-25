#!/usr/bin/env python3
"""Format registry: formats/<id>.json (schema in docs/ENGINE_CONTRACT.md).

Shared by the other tools:
  load(id)       -> dict of one format (ValueError when it does not exist)
  all()          -> list of every format, sorted by id
  validate(fmt)  -> list of error strings (empty = valid)

CLI: python3 tools/formats.py   prints a table of the formats, exits 1 if one is invalid.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FORMATS_DIR = ROOT / "formats"
TEMPLATE = FORMATS_DIR / "_TEMPLATE.md"
DEFAULT = "humour-host"

STATUS = ("validated", "new")
PRODUCTION = ("code", "montage", "ai")
VULGARITY = ("none", "light", "max")
ENDING = ("question", "free")

NUM = (int, float)
# key -> expected type (dict sub-schemas are checked below)
SCHEMA = {
    "id": str, "name": str, "status": str, "summary": str, "production": str,
    "default_character": str, "preset": str, "duration_s": dict, "words": dict, "chapters": dict,
    "tone": dict, "music": dict, "big_sfx_every_s": list, "voice": dict, "ending": str,
    "gates": list, "agents": list, "sheet": str,
}
SUB = {
    "duration_s": {"min": NUM, "target": NUM, "max": NUM},
    "words": {"min": NUM, "max": NUM},
    "chapters": {"min": int, "max": int},
    "tone": {"register": str, "vulgarity": str, "insults": bool},
    "music": {"bpm": NUM, "level_db": NUM},
    "voice": {"provider": str, "voice": str, "voice_id": str, "model": str, "tags": list},
}


def _is(value, typ):
    """isinstance that does not accept booleans as numbers."""
    if typ is bool:
        return isinstance(value, bool)
    return isinstance(value, typ) and not isinstance(value, bool)


def ids():
    return sorted(p.stem for p in FORMATS_DIR.glob("*.json") if not p.name.startswith("_"))


def load(fid):
    path = FORMATS_DIR / f"{fid}.json"
    if not path.is_file() or str(fid).startswith("_"):
        raise ValueError(f"unknown format '{fid}' (available: {', '.join(ids())})")
    return json.loads(path.read_text(encoding="utf-8"))


def all():  # noqa: A001 - name required by the other tools
    return [load(i) for i in ids()]


def template_headings():
    """`## ` headings every format sheet must contain, or [] when the template is not there."""
    if not TEMPLATE.is_file():
        return []
    return re.findall(r"^## +(.+?)\s*$", TEMPLATE.read_text(encoding="utf-8"), flags=re.M)


def validate(fmt):
    errors = []
    if not isinstance(fmt, dict):
        return ["format is not a JSON object"]
    for key, typ in SCHEMA.items():
        if key not in fmt:
            errors.append(f"missing key '{key}'")
        elif not _is(fmt[key], typ):
            errors.append(f"'{key}' must be {typ.__name__}")
    for key, sub in SUB.items():
        block = fmt.get(key)
        if not isinstance(block, dict):
            continue
        for k, typ in sub.items():
            if k not in block:
                errors.append(f"missing key '{key}.{k}'")
            elif not _is(block[k], typ):
                name = "number" if typ is NUM else typ.__name__
                errors.append(f"'{key}.{k}' must be {name}")

    def enum(value, allowed, label):
        if isinstance(value, str) and value not in allowed:
            errors.append(f"'{label}' is '{value}' (allowed: {', '.join(allowed)})")

    enum(fmt.get("status"), STATUS, "status")
    enum(fmt.get("production"), PRODUCTION, "production")
    enum(fmt.get("ending"), ENDING, "ending")
    if isinstance(fmt.get("tone"), dict):
        enum(fmt["tone"].get("vulgarity"), VULGARITY, "tone.vulgarity")

    def ordered(block, keys, label):
        vals = [block.get(k) for k in keys] if isinstance(block, dict) else None
        if vals and builtins_all(_is(v, NUM) for v in vals) and vals != sorted(vals):
            errors.append(f"'{label}': expected {' <= '.join(keys)}, got {vals}")

    ordered(fmt.get("duration_s"), ("min", "target", "max"), "duration_s")
    ordered(fmt.get("words"), ("min", "max"), "words")
    ordered(fmt.get("chapters"), ("min", "max"), "chapters")

    big = fmt.get("big_sfx_every_s")
    if isinstance(big, list):
        if len(big) != 2 or not builtins_all(_is(v, NUM) for v in big):
            errors.append("'big_sfx_every_s' must be [min, max] (two numbers)")
        elif big[0] > big[1]:
            errors.append(f"'big_sfx_every_s': min > max ({big})")
    for key in ("gates", "agents"):
        if isinstance(fmt.get(key), list) and not builtins_all(isinstance(x, str) for x in fmt[key]):
            errors.append(f"'{key}' must be a list of strings")
    if isinstance(fmt.get("voice"), dict) and isinstance(fmt["voice"].get("tags"), list):
        if not builtins_all(isinstance(x, str) for x in fmt["voice"]["tags"]):
            errors.append("'voice.tags' must be a list of strings")
    if isinstance(fmt.get("preset"), str) and not (ROOT / "presets" / f"{fmt['preset']}.json").is_file():
        errors.append(f"preset '{fmt['preset']}' has no presets/{fmt['preset']}.json")

    # the sheet must follow formats/_TEMPLATE.md; skipped silently while the template or the sheet is not written
    sheet = fmt.get("sheet")
    if isinstance(sheet, str):
        sheet_path = ROOT / sheet
        wanted = template_headings()
        if wanted and sheet_path.is_file():
            have = set(re.findall(r"^## +(.+?)\s*$", sheet_path.read_text(encoding="utf-8"), flags=re.M))
            for h in wanted:
                if h not in have:
                    errors.append(f"sheet {sheet}: missing heading '## {h}'")
    return errors


import builtins  # noqa: E402 - `all` is shadowed above on purpose

builtins_all = builtins.all


def main():
    rows, bad = [], 0
    for fid in ids():
        try:
            fmt = load(fid)
        except (ValueError, json.JSONDecodeError) as exc:
            print(f"ERROR {fid}: {exc}")
            bad += 1
            continue
        errors = validate(fmt)
        if fmt.get("id") != fid:
            errors.append(f"'id' is '{fmt.get('id')}' but the file is {fid}.json")
        dur = fmt.get("duration_s") if isinstance(fmt.get("duration_s"), dict) else {}
        rows.append((fid, str(fmt.get("name", "")), str(fmt.get("status", "")), str(fmt.get("production", "")),
                     str(fmt.get("default_character", "")),
                     f"{dur.get('target', '?')} s ({dur.get('min', '?')}-{dur.get('max', '?')})",
                     "ok" if not errors else f"{len(errors)} error(s)"))
        for e in errors:
            print(f"ERROR {fid}: {e}")
        bad += bool(errors)
    head = ("id", "name", "status", "production", "character", "target duration", "check")
    widths = [max(len(r[i]) for r in rows + [head]) for i in range(len(head))]
    line = lambda r: "  ".join(c.ljust(w) for c, w in zip(r, widths)).rstrip()
    print(line(head))
    print("  ".join("-" * w for w in widths))
    for r in rows:
        print(line(r))
    if not rows:
        print("no format found in formats/")
    return 1 if bad or not rows else 0


if __name__ == "__main__":
    sys.exit(main())
