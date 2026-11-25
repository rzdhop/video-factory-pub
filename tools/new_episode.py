#!/usr/bin/env python3
"""Scaffold episodes/<id>/ (plan.json + script.md) from a format of the registry (formats/*.json).

Usage: new_episode.py <id> [preset] [--format <id>] [--character <name|none>] [--title "..."]
                      [--lang fr|en] [--series <slug> --part N [--total M]]
- preset and character default to the format's values; `music` comes from the format.
- The chapter skeleton follows the format (hook ... question); scene names are placeholders to build.
  A format without its own skeleton here gets a generic one: hook, 3 parts, payoff, question.
- --series: adds the `series` block, creates series/<slug>/bible.md from series/_BIBLE_TEMPLATE.md
  (never overwritten) and appends the episode to series/<slug>/episodes.json.
- --look: with --series it becomes the look of the saga (series/<slug>/look.json) when the saga has none;
  a saga that already has a look keeps it (a warning says so). Without --series it goes into plan.json.
- --lang: language of the video (docs/LANGUAGE.md). Without it: the language of the saga, else of the brand,
  else French. With --series it becomes the language of the saga (series/<slug>/lang.json) when the saga has
  none; a part in another language than its saga is refused. It is always written in plan.json.
- An existing episode folder is never overwritten (exit 1).
"""
import argparse, json, pathlib, re, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formats  # noqa: E402
import lang as langs  # noqa: E402

ROOT = formats.ROOT

# (key, script title, HUD label, reminder of what the section must contain)
HOOK = ("hook", "Hook", "LE · HOOK", "Shock line in the first 2 seconds, then the promise of the video. (A greeting, if any, can be moved after it with retime.intro_after.)")


def steps(n, key, title, label, reminder):
    return [(f"{key}{i}", f"{title} {i}", f"{label} {i}", reminder.format(i=i, n=n)) for i in range(1, n + 1)]


def skeleton(fmt_id, n_steps=3):
    if fmt_id == "humour-host":
        return [HOOK,
                ("situation", "Situation", "LA · SITUATION", "The absurd plan of the host, stated as if it were reasonable."),
                *steps(n_steps, "mecanisme", "Mécanisme", "MÉCANISME ·",
                       "Mechanism {i}/{n}: one true scientific fact, one number, one punchline."),
                ("chute", "Chute", "LA · CHUTE", "The twist: why the plan fails (or works too well). Biggest joke of the video."),
                ("cta", "Fin", "ET · TOI ?", "Running gag callback, then a question to the viewer (comments bait).")]
    if fmt_id in ("tech-serieux", "science-motion"):
        return [("hook", "Hook", "LE · HOOK", "A concrete, surprising question or fact in the first 2 seconds. No greeting."),
                ("contexte", "Contexte", "LE · CONTEXTE", "What the viewer must know before the explanation: the problem, the stakes."),
                *steps(n_steps, "etape", "Étape", "ÉTAPE ·",
                       "Step {i}/{n}: one idea, built on screen; every value shown is sourced."),
                ("recap", "Récap", "EN · RÉSUMÉ", "The whole mechanism again in one or two sentences."),
                ("limites", "Limites", "LES · LIMITES", "What this explanation simplifies, where it stops being true."),
                ("question", "Question", "ET · TOI ?", "Open question to the viewer.")]
    if fmt_id == "humour-express":
        return [("hook", "Hook", "LE · HOOK", "The hook sentence (max 9 words) over the absurd image; no greeting; promise complete by 3 s."),
                ("preuve", "Preuve", "LA · PREUVE", "Yes it is true (number, source shown), and it is worse than that."),
                ("twist", "Twist", "LE · TWIST", "The consequence nobody expects: biggest punchline, music stop."),
                ("question", "Question", "ET · TOI ?", "Binary question tied to the stakes; ends on the object of frame 0 (loop).")]
    if fmt_id == "wtf-motion":
        return [("hook", "Hook", "LE · HOOK", "The absurd true fact, stated deadpan in the first 2 seconds."),
                *steps(3, "fait", "Fait", "FAIT ·", "Fact {i}/{n}: true, sourced, and more absurd than the previous one."),
                ("twist", "Twist", "LE · TWIST", "The detail that makes everything even worse (or explains it)."),
                ("question", "Question", "ET · TOI ?", "Open question to the viewer.")]
    if fmt_id == "montage":
        return [("hook", "Hook", "LE · HOOK", "Strongest picture + strongest line in the first 2 seconds."),
                *steps(3, "partie", "Partie", "PARTIE ·", "Part {i}/{n}: what the pictures show, said in voice-over; list the media in plan.json."),
                ("question", "Question", "ET · TOI ?", "Conclusion and open question to the viewer.")]
    # any other format (a new sheet + json in formats/): neutral skeleton, to rename while writing the script
    return [("hook", "Hook", "LE · HOOK", "The strongest line or picture in the first 2 seconds, then the promise of the video."),
            *steps(n_steps, "partie", "Partie", "PARTIE ·",
                   "Part {i}/{n}: one idea (see the structure of the format sheet); rename the key and the label."),
            ("payoff", "Payoff", "LE · PAYOFF", "What the video promised in the hook, delivered: the answer, the twist or the result."),
            ("question", "Question", "ET · TOI ?", "Open question to the viewer.")]


MEDIA_EXAMPLE = {"src": "assets/<file>.jpg", "kind": "image", "word": "<word of the chapter where this item starts>",
                 "fit": "cover", "motion": "push", "credit": "<author / source / licence>"}


def main():
    ap = argparse.ArgumentParser(description="Scaffold a new episode from a format.")
    ap.add_argument("id", help="episode id, e.g. ep-101-my-topic")
    ap.add_argument("preset", nargs="?", default=None, help="preset (default: the format's preset)")
    ap.add_argument("--format", dest="fmt", default=formats.DEFAULT, help=f"format id (default {formats.DEFAULT})")
    ap.add_argument("--character", default=None, help="character name or 'none' (default: the format's)")
    ap.add_argument("--series", default=None, help="series slug")
    ap.add_argument("--part", type=int, default=None, help="part number in the series (>= 1)")
    ap.add_argument("--total", type=int, default=None, help="number of parts of the series")
    ap.add_argument("--title", default="", help="episode title")
    ap.add_argument("--lang", default=None, choices=sorted(langs.LANGS), help="language of the video (default: saga, brand, else fr)")
    ap.add_argument("--look", default=None, help="look id from looks/ (with --series it becomes the look of the whole series)")
    a = ap.parse_args()

    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", a.id):
        sys.exit(f"invalid episode id '{a.id}' (letters, digits, '-', '_', '.')")
    try:
        fmt = formats.load(a.fmt)
    except ValueError as exc:
        sys.exit(str(exc))
    problems = formats.validate(fmt)
    if problems:
        sys.exit(f"format '{a.fmt}' is invalid: " + "; ".join(problems))

    if fmt["production"] == "ai":
        print(f"format '{a.fmt}' is produced with an outside AI generation service, not with Remotion code: "
              "nothing to scaffold here (see its format sheet).")
        return 0

    if a.series is not None:
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", a.series):
            sys.exit(f"invalid series slug '{a.series}' (lowercase letters, digits, '-')")
        if a.part is None or a.part < 1:
            sys.exit("--series needs --part N (N >= 1)")
        if a.total is not None and a.total < a.part:
            sys.exit(f"--total {a.total} is smaller than --part {a.part}")
    elif a.part is not None or a.total is not None:
        sys.exit("--part / --total need --series <slug>")

    ep_dir = ROOT / "episodes" / a.id
    if ep_dir.exists():
        print(f"episodes/{a.id} already exists: nothing written", file=sys.stderr)
        return 1

    # language: asked > saga > brand > French; a saga speaks one language
    probe = {"series": {"slug": a.series}} if a.series else {}
    lang = a.lang or langs.resolve(probe)[0]
    saga_lang = None
    if a.series:
        # a saga started before the language rule has no lang.json: its parts are French
        started = (ROOT / "series" / a.series / "episodes.json").exists()
        saga_lang = langs.series_lang(a.series) or (langs.DEFAULT if started else None)
        if saga_lang and not a.lang:
            lang = saga_lang
    if saga_lang and lang != saga_lang:
        sys.exit(f"the saga '{a.series}' is in '{saga_lang}' : a part cannot be in '{lang}'. "
                 "Start another saga for the other language.")
    L = langs.spec(lang)

    preset = a.preset or fmt["preset"]
    if not (ROOT / "presets" / f"{preset}.json").is_file():
        sys.exit(f"unknown preset '{preset}' (no presets/{preset}.json)")
    character = a.character or fmt["default_character"]

    # chapter skeleton, shortened when the format allows fewer chapters than the full skeleton
    n_steps = 3
    chapters_def = skeleton(a.fmt, n_steps)
    while len(chapters_def) > fmt["chapters"]["max"] and n_steps > 1:
        n_steps -= 1
        chapters_def = skeleton(a.fmt, n_steps)

    m = re.match(r"ep-?(\d+[a-z]?)", a.id)
    prefix = f"ep{m.group(1)}" if m else re.split(r"[-_.]", a.id)[0]
    montage = fmt["production"] == "montage"
    chapters = []
    if lang == "en":  # same keys (identifiers), English section titles and HUD labels
        def tr(text, table):
            head, _, num = text.rpartition(" ")
            return f"{table[head]} {num}" if num.isdigit() and head in table else table.get(text, text)
        chapters_def = [(k, tr(t, langs.TITLES_EN), tr(lb, langs.LABELS_EN), r) for k, t, lb, r in chapters_def]
    for key, _title, label, _reminder in chapters_def:
        chap = {"key": key, "label": label, "scene": "media" if montage else f"{prefix}-{key}", "hud": {}}
        if montage:
            chap["media"] = []
        chapters.append(chap)

    # layout 2 = safe-zone layout (docs/ENGINE_CONTRACT.md); episodes made before it have no `layout` and keep theirs
    plan = {"id": a.id, "title": a.title, "format": a.fmt, "lang": lang, "layout": 2, "preset": preset, "character": character,
            "fps": 30,
            "voice": {"engine": "espeak-ng", "voice": L["espeak"], "rate": 135, "pitch": 40,
                      "gap_sentence_ms": 220, "gap_chapter_ms": 650}}
    if a.series is not None:
        plan["series"] = {"slug": a.series, "part": a.part}
        if a.total is not None:
            plan["series"]["total"] = a.total
    if a.look:
        if a.look.startswith("_") or not (ROOT / "looks" / f"{a.look}.json").is_file():
            sys.exit(f"unknown look '{a.look}' (no looks/{a.look}.json). List them with `python3 tools/looks.py`; "
                     "to create one, copy looks/_TEMPLATE.json (docs/LOOKS.md). Without --look the episode uses its base preset.")
        if a.series is None:
            plan["look"] = a.look  # one-off episode: the look lives in its plan
    plan["chapters"] = chapters
    if montage:
        plan["_media_example"] = MEDIA_EXAMPLE  # copy into chapters[].media and fill; ignored by the engine
    plan["music"] = {"bpm": fmt["music"]["bpm"], "level_db": fmt["music"]["level_db"]}
    plan["sound_kit"] = fmt.get("sound_kit", "default")  # effects from the sound library (sounds/kits/<id>.json)
    plan["sfx_events"] = []
    if character != "none":
        plan["direction"] = []

    dur, words = fmt["duration_s"], fmt["words"]
    lines = [f"# {a.id}" + (f" — {a.title}" if a.title else ""), "",
             f"Format: {a.fmt} · Language: {lang} · Preset: {preset} · Character: {character} · "
             f"Target: {dur['target']} s ({dur['min']}-{dur['max']}) · {words['min']}-{words['max']} words"]
    if a.series is not None:
        lines.append(f"Series: {a.series} · part {a.part}" + (f"/{a.total}" if a.total else "") +
                     f" · bible: series/{a.series}/bible.md")
    lines += ["", L["narration_heading"], "",
              "<!-- One paragraph per section, on ONE line: blocks of 1-4 words separated by |, at most one *accent* per block.",
              "     Replace each TODO line; tools/lint_plan.py refuses a script that still contains one. -->", ""]
    for _key, title, label, reminder in chapters_def:
        lines += [f"### {title} — HUD: {label}", f"<!-- TODO: {reminder} -->", ""]
    lines += [L["fact_heading"], "- "]

    ep_dir.mkdir(parents=True)
    (ep_dir / "plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (ep_dir / "script.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    if montage:
        (ep_dir / "assets").mkdir()
    print(f"episodes/{a.id}: format {a.fmt}, language {lang}, preset {preset}, character {character}, {len(chapters)} chapters")

    if a.series is not None:
        s_dir = ROOT / "series" / a.series
        # the language of the first part is the language of the saga, stored once like the look
        if not (s_dir / "lang.json").exists():
            s_dir.mkdir(parents=True, exist_ok=True)
            (s_dir / "lang.json").write_text(json.dumps({"lang": lang}) + "\n")
            print(f"series/{a.series}/lang.json created: the whole saga is in '{lang}'")
        # the look given with --series is the look of the saga: stored once, shared by every part
        if a.look and not (s_dir / "look.json").exists():
            s_dir.mkdir(parents=True, exist_ok=True)
            (s_dir / "look.json").write_text(json.dumps({"from": a.look}, indent=2) + "\n")
            print(f"series/{a.series}/look.json created: look '{a.look}' for the whole saga")
        elif a.look:
            try:
                kept = json.loads((s_dir / "look.json").read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                kept = None
            if kept != {"from": a.look}:
                name = (kept.get("from") or kept.get("id")) if isinstance(kept, dict) else None
                print(f"WARN  --look {a.look} ignored: the saga '{a.series}' keeps its existing look"
                      + (f" '{name}'" if name else "") + f" (series/{a.series}/look.json). Edit that file to change "
                      "the look of the whole saga, or set `look` in this episode's plan.json for this part only.")
        s_dir.mkdir(parents=True, exist_ok=True)
        bible, template = s_dir / "bible.md", ROOT / "series" / "_BIBLE_TEMPLATE.md"
        if bible.exists():
            print(f"series/{a.series}/bible.md kept as it is")
        elif template.is_file():
            bible.write_text(template.read_text(encoding="utf-8"), encoding="utf-8")
            print(f"series/{a.series}/bible.md created from series/_BIBLE_TEMPLATE.md: fill it")
        else:
            print(f"note: series/_BIBLE_TEMPLATE.md not found, series/{a.series}/bible.md not created")
        index = s_dir / "episodes.json"
        try:
            listing = json.loads(index.read_text(encoding="utf-8")) if index.exists() else []
        except json.JSONDecodeError:
            sys.exit(f"series/{a.series}/episodes.json is not valid JSON: episode created, series list not updated")
        if not isinstance(listing, list):
            sys.exit(f"series/{a.series}/episodes.json is not a list: episode created, series list not updated")
        if any(isinstance(e, dict) and e.get("part") == a.part for e in listing):
            print(f"WARN  series/{a.series}/episodes.json already has a part {a.part}")
        listing.append({"id": a.id, "part": a.part, "title": a.title})
        listing.sort(key=lambda e: e.get("part", 0) if isinstance(e, dict) else 0)
        index.write_text(json.dumps(listing, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"series/{a.series}/episodes.json: {len(listing)} episode(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
