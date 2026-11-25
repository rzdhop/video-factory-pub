#!/usr/bin/env python3
"""Brands: the accounts an episode is published on. One brand = one scheduler brand = one Instagram + one TikTok.

  brands.py                       table of the brands and their state
  brands.py of <episode_id>       which brand an episode belongs to, and why
  brands.py check <brand_id>      exit 1 unless the brand can be posted to (active, scheduler id and both handles)

The registry is brands/brands.json (it ships with one placeholder brand, `my-brand`: fill it). An episode's brand
is, in this order: `brand` in its plan.json, `brand` in series/<slug>/brand.json when the episode is part of a
saga, else the brand marked `"default": true`.
Before any scheduling, the scheduler brand id and both handles of the resolved brand are compared with what the
scheduling tool itself reports; a post never goes to a brand whose status is not "active".
A value that is null, empty or "REPLACE_ME" counts as missing.
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REG = ROOT / "brands" / "brands.json"
PLACEHOLDER = "REPLACE_ME"


def registry():
    try:
        data = json.loads(REG.read_text(encoding="utf-8"))
    except FileNotFoundError:
        sys.exit("brands/brands.json not found: create it with one brand marked \"default\": true (docs/PUBLISH.md)")
    except json.JSONDecodeError as exc:
        sys.exit(f"brands/brands.json does not parse: {exc}")
    if not isinstance(data, dict) or not data:
        sys.exit("brands/brands.json has no brand yet: add one and mark it \"default\": true")
    return data


BRANDS = registry()


def filled(value):
    return bool(value) and value != PLACEHOLDER


def default_brand():
    ids = [k for k, b in BRANDS.items() if b.get("default")]
    if len(ids) != 1:
        sys.exit(f"brands.json must mark exactly one brand as default (found {len(ids)})")
    return ids[0]


def brand_of(ep_id):
    """(brand id, reason) for an episode of the repo."""
    plan_path = ROOT / "episodes" / ep_id / "plan.json"
    if not plan_path.is_file():
        sys.exit(f"{ep_id}: no plan.json (episodes/{ep_id}/plan.json not found)")
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    if plan.get("brand"):
        return plan["brand"], "plan.json"
    series = plan.get("series")
    slug = series.get("slug") if isinstance(series, dict) else series
    if slug:
        f = ROOT / "series" / slug / "brand.json"
        if f.is_file():
            return json.loads(f.read_text(encoding="utf-8"))["brand"], f"series/{slug}/brand.json"
    return default_brand(), "default brand"


def problems(brand_id):
    b = BRANDS.get(brand_id)
    if b is None:
        return [f"unknown brand (known: {', '.join(BRANDS)})"]
    out = [] if b.get("status") == "active" else [f"status is {b.get('status')!r}, not 'active'"]
    out += [f"{k} is not set" for k in ("scheduler_brand_id", "instagram", "tiktok") if not filled(b.get(k))]
    return out


def main():
    a = sys.argv[1:]
    if a[:1] == ["of"] and len(a) == 2:
        brand_id, why = brand_of(a[1])
        bad = problems(brand_id)
        b = BRANDS.get(brand_id, {})
        print(f"{a[1]}: brand {brand_id} ({why})" + (f" · NOT postable yet: {'; '.join(bad)}" if bad else
              f" · scheduler {b['scheduler_brand_id']}, Instagram {b['instagram']}, TikTok {b['tiktok']}"))
        return
    if a[:1] == ["check"] and len(a) == 2:
        bad = problems(a[1])
        print(f"{a[1]}: " + ("ok" if not bad else "; ".join(bad)))
        sys.exit(1 if bad else 0)
    if a:
        sys.exit(__doc__)
    default_brand()
    show = lambda v: str(v) if filled(v) else "-"
    print(f"{'id':14} {'status':8} {'scheduler':10} {'instagram':14} {'tiktok':14} series")
    for k, b in BRANDS.items():
        print(f"{k:14} {b.get('status', '?'):8} {show(b.get('scheduler_brand_id')):10} {show(b.get('instagram')):14} "
              f"{show(b.get('tiktok')):14} {', '.join(b.get('series', [])) or '-'}{'  (default)' if b.get('default') else ''}")
    todo = [k for k in BRANDS if problems(k)]
    if todo:
        print(f"\nnot postable yet: {', '.join(todo)} (fill brands/brands.json, then set \"status\": \"active\")")


if __name__ == "__main__":
    main()
