#!/usr/bin/env python3
"""Which voice speaks an episode. A voice belongs to a CHARACTER first, then to a saga, then to a format.

Resolution (first match wins):
  1. plan.json  "tts": "<catalog id>"  or  {"voice_id": "...", ...}      one-off choice for this episode
  2. series/<slug>/voice.json  {"voice": "<catalog id>"}                  one voice for the whole saga
  3. characters/voices.json  {"<character>": "<catalog id>"}              a host always keeps his own voice
  4. formats/<id>.json "voice"                                            the narrator of a hostless format
Language (docs/LANGUAGE.md): by default the same voice speaks every language. Any of the
references above may be split per language, {"fr": "<catalog id>", "en": "<catalog id>"}, and a format may
carry a "voice_en" block, if a voice turns out not to work in a language. A catalog voice has one status per
language: "status" for French, "status_en" for English.
Dialogue: plan.json "voices": {"A": "<catalog id>", "B": "<catalog id>"} lists extra speakers; each line of the
narration prompt is then generated with its speaker's voice (one generation per speaker, concatenated in order).
The catalog is voices/catalog.json (id, the provider's voice_id, what it is for, whether the owner has heard and
approved it). It ships with placeholder entries (voice_id "REPLACE_ME"): this tool says so, and the pipeline still
runs end to end with the espeak reference voice until a real voice is set.

Usage: voice.py                    list the catalog and each format's voice
       voice.py <episode_dir>      print the voice of that episode and why
"""
import json, pathlib, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import lang as langs  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent


PLACEHOLDER = "REPLACE_ME"


def catalog():
    path = ROOT / "voices" / "catalog.json"
    if not path.is_file():
        raise SystemExit("voices/catalog.json not found: create it with at least one voice "
                         '({"<id>": {"voice_id": "...", "name": "...", "use": "...", "status": "..."}})')
    return json.loads(path.read_text(encoding="utf-8"))


def is_placeholder(voice):
    return not voice.get("voice_id") or voice.get("voice_id") == PLACEHOLDER


def from_catalog(ref, cat, lang="fr"):
    if isinstance(ref, dict) and set(ref) & set(langs.LANGS):
        ref = ref.get(lang) or ref.get(langs.DEFAULT) or next(iter(ref.values()))  # split per language
    if isinstance(ref, dict):
        return ref
    if ref not in cat:
        raise SystemExit(f"unknown voice '{ref}' (not in voices/catalog.json; known: {', '.join(cat) or 'none yet'})")
    return {"catalog": ref, **cat[ref]}


def resolve(plan):
    """(voice dict, reason, tags) for a plan."""
    cat = catalog()
    fmt_path = ROOT / "formats" / f"{plan.get('format', 'humour-host')}.json"
    fmt = json.loads(fmt_path.read_text()) if fmt_path.is_file() else {}
    tags = fmt.get("voice", {}).get("tags", [])
    lang = langs.resolve(plan)[0]
    if plan.get("tts"):
        return from_catalog(plan["tts"], cat, lang), "plan.json tts (this episode only)", tags
    slug = (plan.get("series") or {}).get("slug")
    sv = ROOT / "series" / slug / "voice.json" if slug else None
    if sv and sv.is_file():
        return from_catalog(json.loads(sv.read_text())["voice"], cat, lang), f"series/{slug}/voice.json (whole saga)", tags
    chars_path = ROOT / "characters" / "voices.json"
    chars = json.loads(chars_path.read_text(encoding="utf-8")) if chars_path.is_file() else {}
    who = plan.get("character", "none")
    if who in chars:
        return from_catalog(chars[who], cat, lang), f"character '{who}' keeps its own voice", tags
    if lang != langs.DEFAULT and fmt.get(f"voice_{lang}"):
        return fmt[f"voice_{lang}"], f"narrator of format '{fmt.get('id')}' for '{lang}'", tags
    if fmt.get("voice"):
        v = fmt["voice"]
        # the format block is a copy of a catalog entry: read the status per language from the catalog
        return ({**cat[v["catalog"]], **v} if v.get("catalog") in cat else v), f"narrator of format '{fmt.get('id')}'", tags
    raise SystemExit(f"no voice found: give character '{who}' a voice in characters/voices.json, or a `voice` block "
                     f"to formats/{plan.get('format', 'humour-host')}.json")


def main():
    cat = catalog()
    if len(sys.argv) == 1:
        if not cat:
            print("no voice yet: add one to voices/catalog.json")
        for k, v in cat.items():
            print(f"{k:12} {v.get('voice_id', '?')}  {v.get('name', k)}\n{'':12} {v.get('use', '')} [{v.get('status', 'no status')}]")
        print()
        for p in sorted((ROOT / "formats").glob("*.json")):
            j = json.loads(p.read_text(encoding="utf-8"))
            voice = j.get("voice") or {}
            print(f"{j['id']:15} default character {j.get('default_character', 'none'):5} narrator {voice.get('catalog') or voice.get('voice') or '-'}")
        if any(is_placeholder(v) for v in cat.values()):
            print("\nplaceholder voices (voice_id REPLACE_ME): " + ", ".join(k for k, v in cat.items() if is_placeholder(v))
                  + ". Set a real voice_id of your speech provider before generating a voice.")
        return
    plan_path = pathlib.Path(sys.argv[1]) / "plan.json"
    if not plan_path.is_file():
        sys.exit(f"{plan_path} not found (usage: voice.py <episode_dir>)")
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    v, why, tags = resolve(plan)
    lang, lang_why = langs.resolve(plan)
    L = langs.spec(lang)
    print(f"voice: {v.get('name', v.get('voice'))}  voice_id {v.get('voice_id', PLACEHOLDER)}  model {v.get('model', '-')}")
    print(f"why:   {why}\ntags:  {' '.join(tags) or '(none)'}")
    print(f"lang:  {lang} ({L['name']}; {lang_why}): write the narration prompt in {L['name']} and pass language "
          f"'{L['speech']}' when the speech tool takes one")
    status = v.get("status", "") if lang == langs.DEFAULT else v.get(f"status_{lang}", "")
    if is_placeholder(v):
        print("note:  PLACEHOLDER voice (voice_id REPLACE_ME): no real voice is set yet. The episode still builds and "
              "renders with the espeak reference voice; to generate a real one, set `voice_id` (and provider / model) "
              f"of '{v.get('catalog', 'this voice')}' in voices/catalog.json.")
    elif lang == langs.DEFAULT and status.startswith("chosen"):
        print("note:  this voice has not been heard yet: generate once, listen, then set its status in voices/catalog.json")
    elif lang != langs.DEFAULT and not status.startswith("validated"):
        print(f"note:  this voice has not been heard in {L['name']} yet ({status or 'no status_' + lang}): listen to the "
              f"take before the render, then set `status_{lang}` in voices/catalog.json (or split the voice per language)")
    for name, ref in (plan.get("voices") or {}).items():
        x = from_catalog(ref, cat, lang)
        print(f"speaker {name}: {x.get('name')}  voice_id {x.get('voice_id', PLACEHOLDER)}" + ("  (PLACEHOLDER)" if is_placeholder(x) else ""))


if __name__ == "__main__":
    main()
