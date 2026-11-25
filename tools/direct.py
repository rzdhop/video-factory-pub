#!/usr/bin/env python3
"""Actor direction: give the character one acting state per narration block instead of one face per chapter.

Explicit direction lives in plan.json (written with the script, it is part of the comedy):
  "direction": [
    {"chapter": "hook", "word": "sky", "emotion": "smug", "shot": "close"},
    {"chapter": "twist", "word": "lost", "emotion": "panic", "shot": "peek"},
    {"chapter": "question", "word": "And you", "emotion": "curious", "gesture": "point", "shot": "close"}
  ]
  emotion: idle | happy | wink | curious | confused | amazed | panic | deadpan | smug
  shot:    bust (default, bottom-left) | close (big face, scene dimmed: reaction shot) | peek (hides, eyes only)
  gesture: wave | point | shrug | balance (two palms weighing up and down) | none
  An emotion or a shot stays until the next entry changes it; a gesture lasts for its block only.

Blocks without an explicit entry get a guess from the text (question, swear word, big number, negation...;
the word lists are those of the episode's language, tools/lang.py),
so even an undirected episode never keeps the same face for a whole chapter.
Writes episode.json "acting": [{"t", "emotion", "shot", "gesture", "t_end"}]. Run after every retiming.
Usage: direct.py <episode_dir>
"""
import json, pathlib, re, sys

ep_dir = pathlib.Path(sys.argv[1])
ep_path = ep_dir / "episode.json"
ep = json.loads(ep_path.read_text())
plan = json.loads((ep_dir / "plan.json").read_text())
words = ep["words"]

EMOTIONS = {"idle", "happy", "wink", "curious", "confused", "amazed", "panic", "deadpan", "smug"}
SHOTS = {"bust", "close", "peek"}
GESTURES = {"wave", "point", "shrug", "balance", "none"}

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import lang as langs  # noqa: E402
_L = langs.spec(langs.of_episode(ep))
GREET, PANIC, GROSS, BIG, NEG = (_L[k] for k in ("act_greet", "act_panic", "act_gross", "act_big", "act_neg"))


def find(chapter, word):
    w = word.lower()
    return next((i for i, x in enumerate(words) if x["chapter"] == chapter and w in x["text"].lower()), None)


explicit = {}
for d in plan.get("direction", []):
    i = find(d["chapter"], d["word"])
    if i is None:
        print(f"WARN  direction: no block '{d['word']}' in chapter '{d['chapter']}'")
        continue
    for key, allowed in (("emotion", EMOTIONS), ("shot", SHOTS), ("gesture", GESTURES)):
        if key in d and d[key] not in allowed:
            sys.exit(f"direction: unknown {key} '{d[key]}' (allowed: {sorted(allowed)})")
    explicit[i] = d

# punchlines the sound design already marks as hits get a reaction close-up
punch = set()
for e in plan.get("sfx_events", []):
    if e.get("gain", 0) >= 0.4:
        i = find(e["chapter"], e["word"])
        if i is not None:
            punch.add(i)

last_chapter = ep["chapters"][-1]["key"]
acting, emotion, shot = [], "idle", "bust"
alt = 0
for i, w in enumerate(words):
    text = w["text"]
    new_chapter = i == 0 or words[i - 1]["chapter"] != w["chapter"]
    sentence_start = i == 0 or bool(re.search(r"[.?!:]$", words[i - 1]["text"]))
    sentence_end = bool(re.search(r"[.?!]$", text))
    gesture = "none"
    e, s = emotion, shot
    if new_chapter:
        s = "bust"
    if s in ("close", "peek") and sentence_start and i - 1 not in explicit:
        s = "bust"  # a reaction shot lasts one beat, then we go back to the scene
    if i == 0 and not GREET.search(text):
        s, e = "close", "smug"  # cold open: the face fills the frame on the shock line
    if GREET.search(text):
        e, gesture, s = "happy", "wave", "bust"
    elif i > 0 and GREET.search(words[i - 1]["text"]):
        e, gesture = "happy", "wave"
    elif "?" in text:
        e = "curious"
        gesture = "shrug" if sentence_end else "none"
    elif PANIC.search(text):
        e = "panic"
    elif GROSS.search(text):
        e = "deadpan"
    elif BIG.search(text):
        e = "amazed"
    elif NEG.search(text):
        e = "confused"
    elif sentence_end and w.get("accent"):
        e = "smug"
    elif sentence_start:
        alt += 1
        e = "curious" if alt % 2 else "idle"
    if i in punch:
        s = "close"
    if i == len(words) - 1 and w["chapter"] == last_chapter:
        s, e = "close", "wink"
    d = explicit.get(i)
    if d:
        e, s, gesture = d.get("emotion", e), d.get("shot", s), d.get("gesture", gesture)
    nxt = words[i + 1]["t_start"] if i + 1 < len(words) else w["t_end"] + 0.6
    state = {"t": round(max(0.0, w["t_start"] - 0.06), 3), "emotion": e, "shot": s, "gesture": gesture, "t_end": round(nxt, 3)}
    prev = acting[-1] if acting else None
    if prev and (prev["emotion"], prev["shot"]) == (e, s) and gesture == "none" and prev["gesture"] == "none":
        prev["t_end"] = state["t_end"]  # nothing changes: extend the previous state
    else:
        acting.append(state)
    emotion, shot = e, s

ep["acting"] = acting
ep_path.write_text(json.dumps(ep, ensure_ascii=False, indent=1))
longest = max(a["t_end"] - a["t"] for a in acting)
closes = sum(1 for a in acting if a["shot"] == "close")
print(f"acting: {len(acting)} states for {len(words)} blocks ({len(explicit)} directed by hand), "
      f"{closes} close-ups, longest hold {longest:.1f}s")
