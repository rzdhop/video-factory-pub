#!/usr/bin/env python3
"""Language of an episode: French or English, one language per video. Full rule: docs/LANGUAGE.md.

Resolution (first match wins):
  1. plan.json  "lang": "fr" | "en"                     this episode
  2. series/<slug>/lang.json  {"lang": "en"}            a saga speaks ONE language, stored once
  3. brands/brands.json  "<brand>": {"lang": "en"}      default language of the account the episode is posted on
  4. "fr"                                               every episode made before this rule has no `lang`: French

Everything that depends on the language reads it here, so no tool or scene carries its own French assumption:
the espeak reference voice, the counted-word rule, greeting / swear / acting word lists, the scaffold texts
(script headings, HUD labels), the number format and the series badge.

Usage: lang.py                    list the languages and each episode's language
       lang.py <episode_dir>      print the language of that episode and why
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT = "fr"

LANGS = {
    "fr": {
        "name": "French",
        "espeak": "fr",              # espeak-ng voice of the reference timing (tools/build_episode.py)
        "locale": "fr-FR",
        "speech": "fr",              # language code for the speech generation, when the tool takes one
        "badge": "PARTIE",           # series badge of the HUD, same word as src/kit/anim.ts
        "narration_heading": "## Narration (blocs séparés par « | », mot accentué entre *astérisques*)",
        "fact_heading": "## Vérification des faits",
        "words_per_second": 3.2,     # measured on a tightened voice take (179 words in 55 s)
        # short words that carry no sense do not count in the 4-word limit of a caption block
        "uncounted": set(),
        "greeting": re.compile(
            r"^\W*(hello|hey|salut|bonjour|bonsoir|coucou|yo|wesh|bienvenue)\b|\b(moi )?c'est \*?[A-Z]", re.I),
        "swears": re.compile(
            r"\b(merd\w*|putain\w*|cons?|conn(?:ard|asse)s?|conneries?|encul\w*|salop\w*|bordel|chier|chiant\w*|"
            r"chiottes|couilles?|bites?|putes?|branl\w*|foutre|niqu\w*|pétasses?|trouducs?)\b", re.I),
        # guesses of tools/direct.py for blocks without an explicit direction
        "act_greet": re.compile(r"^(hello|salut|bonjour|yo|coucou)\b", re.I),
        "act_panic": re.compile(
            r"démasqu|grill|batte|panique|apocalypse|explos|évacu|sauv|cour[st]\b|fui[st]?\b|partout|au secours", re.I),
        "act_gross": re.compile(r"\b(cons?|chie[rs]?|chiottes|merde|putain|slip|pisse|étrons?|trou)\b", re.I),
        "act_big": re.compile(r"\d|milliards?|millions?|mille\b|cents?\b|univers|lumière|soleil|planètes?|monde", re.I),
        "act_neg": re.compile(r"\b(pas|aucun|aucune|personne|jamais|rien)\b", re.I),
        # most frequent function words: used only to notice a script written in the other language
        "stopwords": {"le", "la", "les", "des", "une", "est", "pas", "que", "dans", "pour", "sur", "avec", "ce",
                      "qui", "et", "du", "en", "il", "elle", "tu", "ton", "ta", "ça", "c'est", "mais", "ou"},
    },
    "en": {
        "name": "English",
        "espeak": "en-us",
        "locale": "en-US",
        "speech": "en",
        "badge": "PART",
        "narration_heading": "## Narration (blocks separated by \"|\", accented word between *asterisks*)",
        "fact_heading": "## Fact check",
        "words_per_second": 3.2,     # NOT measured yet for English: French value kept until the first English take
        "uncounted": {"the", "and"},
        "greeting": re.compile(
            r"^\W*(hello|hey|hi|yo|sup|welcome|what's up|good (?:morning|evening))\b|\b(it's|this is|i'm|i am) \*?[A-Z]", re.I),
        "swears": re.compile(
            r"\b(shit\w*|bullshit|fuck\w*|motherfuck\w*|ass(?:es|hole|holes)?|dumbass\w*|bitch\w*|bastards?|dicks?|"
            r"dickheads?|cocks?|pussy|pussies|cunts?|pricks?|wankers?|twats?|bollocks|crap\w*|piss\w*|damn\w*|"
            r"goddamn\w*|sluts?|whores?|douche\w*|jackass\w*)\b", re.I),
        "act_greet": re.compile(r"^(hello|hey|hi|yo|sup)\b", re.I),
        "act_panic": re.compile(
            r"busted|caught|panic|apocalypse|explo[ds]|evacuat|run\b|running|runs\b|escap|everywhere|help\b|"
            r"scream|oh no|too late", re.I),
        "act_gross": re.compile(r"\b(shit\w*|fuck\w*|ass(?:hole)?|crap|piss\w*|poop\w*|turds?|toilets?|fart\w*|butt)\b", re.I),
        "act_big": re.compile(r"\d|billions?|millions?|thousands?|hundreds?\b|universe|light|sun\b|planets?|world", re.I),
        "act_neg": re.compile(r"\b(not|no|never|nobody|nothing|none|n't)\b|n't\b", re.I),
        "stopwords": {"the", "is", "and", "of", "that", "you", "your", "it", "it's", "in", "to", "for", "with", "this",
                      "was", "are", "but", "not", "on", "they", "what", "why", "does", "did", "a", "an"},
    },
}

# script section titles and HUD labels of the chapter skeletons (tools/new_episode.py), French -> English.
# Chapter KEYS are identifiers (scene names derive from them): they are the same in every language.
TITLES_EN = {"Hook": "Hook", "Situation": "Setup", "Mécanisme": "Mechanism", "Chute": "Punchline", "Fin": "Ending",
             "Contexte": "Context", "Étape": "Step", "Récap": "Recap", "Limites": "Limits", "Question": "Question",
             "Preuve": "Proof", "Twist": "Twist", "Fait": "Fact", "Partie": "Part", "Payoff": "Payoff"}
LABELS_EN = {"LE · HOOK": "THE · HOOK", "LA · SITUATION": "THE · SETUP", "MÉCANISME ·": "MECHANISM ·",
             "LA · CHUTE": "THE · PUNCHLINE", "ET · TOI ?": "AND · YOU?", "LE · CONTEXTE": "THE · CONTEXT",
             "ÉTAPE ·": "STEP ·", "EN · RÉSUMÉ": "IN · SHORT", "LES · LIMITES": "THE · LIMITS",
             "LA · PREUVE": "THE · PROOF", "LE · TWIST": "THE · TWIST", "FAIT ·": "FACT ·", "PARTIE ·": "PART ·",
             "LE · PAYOFF": "THE · PAYOFF"}


def check(lang):
    """The language id, or exit with the list of known ones."""
    if lang not in LANGS:
        raise SystemExit(f"unknown language '{lang}' (known: {', '.join(LANGS)})")
    return lang


def spec(lang):
    return LANGS[check(lang)]


def _read(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def series_lang(slug):
    """Language stored for a saga, or None."""
    j = _read(ROOT / "series" / slug / "lang.json") if slug else None
    return j.get("lang") if isinstance(j, dict) else None


def _brand_lang(plan, slug):
    brands = _read(ROOT / "brands" / "brands.json") or {}
    bid = plan.get("brand")
    if not bid and slug:
        j = _read(ROOT / "series" / slug / "brand.json")
        bid = j.get("brand") if isinstance(j, dict) else None
    if not bid:
        bid = next((k for k, b in brands.items() if b.get("default")), None)
    lang = (brands.get(bid) or {}).get("lang")
    return (lang, bid) if lang else (None, bid)


def resolve(plan):
    """(language id, reason) for a plan.json."""
    if plan.get("lang"):
        return check(plan["lang"]), "plan.json lang (this episode)"
    series = plan.get("series")
    slug = series.get("slug") if isinstance(series, dict) else series
    s = series_lang(slug)
    if s:
        return check(s), f"series/{slug}/lang.json (whole saga)"
    b, bid = _brand_lang(plan, slug)
    if b:
        return check(b), f"brand '{bid}' default language"
    return DEFAULT, "default (no `lang` anywhere: French)"


def of_episode(ep):
    """Language of an episode.json (written by tools/build_episode.py); older files have none: French."""
    lang = ep.get("lang") or (ep.get("voice") or {}).get("lang") or DEFAULT
    return lang if lang in LANGS else DEFAULT


def counted_words(text, lang=DEFAULT):
    """Words that count in the 4-word limit of a caption block: words of 1-2 letters never count (articles,
    "a", "of", "to"); English also skips "the" and "and", which French covers with "le", "la", "et"."""
    skip = LANGS.get(lang, LANGS[DEFAULT])["uncounted"]
    out = 0
    for x in text.split():
        w = x.strip(".,:;?!\"'«»*").lower()
        if len(w) > 2 and w not in skip:
            out += 1
    return out


def looks_like(text):
    """(language id or None, {lang: hits}): which language the function words of a text belong to."""
    tokens = re.findall(r"[a-zàâäçéèêëîïôöùûü']+", text.lower())
    hits = {k: sum(1 for t in tokens if t in v["stopwords"]) for k, v in LANGS.items()}
    best = max(hits, key=hits.get)
    others = max(v for k, v in hits.items() if k != best)
    return (best if hits[best] >= 5 and hits[best] >= 2 * max(1, others) else None), hits


def main():
    if len(sys.argv) == 1:
        for k, v in LANGS.items():
            print(f"{k}  {v['name']:8} espeak {v['espeak']:6} numbers {v['locale']}  badge {v['badge']}")
        print()
        eps = ROOT / "episodes"
        if not eps.is_dir() or not any(eps.glob("*/plan.json")):
            print("no episode yet: python3 tools/new_episode.py <id> --format <format> --lang fr|en")
        for d in sorted(eps.iterdir()) if eps.is_dir() else []:
            plan = _read(d / "plan.json")
            if isinstance(plan, dict):
                lang, why = resolve(plan)
                print(f"{d.name:32} {lang}  {why}")
        return
    plan = _read(pathlib.Path(sys.argv[1]) / "plan.json")
    if not isinstance(plan, dict):
        sys.exit(f"{sys.argv[1]}: no readable plan.json")
    lang, why = resolve(plan)
    print(f"lang: {lang} ({LANGS[lang]['name']})\nwhy:  {why}")


if __name__ == "__main__":
    main()
