#!/usr/bin/env python3
"""Build episode.json + voice.wav from script.md and plan.json.

Voice engine: espeak-ng (placeholder). Each sentence is synthesized separately so the
block timings are exact at sentence level; inside a sentence, block boundaries are
distributed proportionally to character count. A neural TTS with word timestamps
(any provider that returns them) can replace this by writing the same `words[]`.
"""
import json, re, subprocess, sys, wave, struct, pathlib

ep_dir = pathlib.Path(sys.argv[1])
plan = json.loads((ep_dir / "plan.json").read_text())
script = (ep_dir / "script.md").read_text()
v = plan["voice"]
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import lang as langs
LANG = langs.resolve(plan)[0]
# the espeak reference must speak the language of the script, or the DTW alignment of the human take drifts
if plan.get("lang") and v.get("voice") in {x["espeak"] for x in langs.LANGS.values()}:
    v["voice"] = langs.spec(LANG)["espeak"]
SR = 22050

# --- parse script: "### <Title> — HUD: ..." then one paragraph of blocks separated by |
sections = re.split(r"^### ", script, flags=re.M)[1:]
chapters_text = []
for sec in sections:
    head, _, body = sec.partition("\n")
    para = next((l.strip() for l in body.splitlines() if l.strip() and not l.startswith("#")), "")
    chapters_text.append(para)
assert len(chapters_text) == len(plan["chapters"]), (len(chapters_text), len(plan["chapters"]))

def synth(text, out):
    clean = text.replace("*", "")
    subprocess.run(["espeak-ng", "-v", v["voice"], "-s", str(v["rate"]), "-p", str(v["pitch"]),
                    "-w", str(out), clean], check=True, capture_output=True)
    with wave.open(str(out)) as w:
        frames = w.readframes(w.getnframes()); sr = w.getframerate()
    # trim leading/trailing silence (< 2% amplitude)
    samples = struct.unpack("<%dh" % (len(frames) // 2), frames)
    thr = 600
    i0 = next((i for i, s in enumerate(samples) if abs(s) > thr), 0)
    i1 = next((i for i in range(len(samples) - 1, 0, -1) if abs(samples[i]) > thr), len(samples))
    return samples[i0:i1 + 1], sr

def silence(ms, sr): return [0] * int(sr * ms / 1000)

audio = []; sr = SR; t = 0.0
words = []; chapters = []
for ci, (chap, para) in enumerate(zip(plan["chapters"], chapters_text)):
    t_start = t
    blocks = [b.strip() for b in para.split("|") if b.strip()]
    # group blocks into sentences (ending with . ? ! :)
    sentences, cur = [], []
    for b in blocks:
        cur.append(b)
        if re.search(r"[.?!]$", b):
            sentences.append(cur); cur = []
    if cur: sentences.append(cur)
    for si, sent in enumerate(sentences):
        samples, sr = synth(" ".join(sent), ep_dir / "_tmp.wav")
        dur = len(samples) / sr
        total_chars = sum(len(b.replace("*", "")) for b in sent)
        tb = t
        for b in sent:
            share = len(b.replace("*", "")) / total_chars
            d = dur * share
            m = re.search(r"\*([^*]+)\*", b)
            words.append({"text": b.replace("*", ""), "t_start": round(tb, 3), "t_end": round(tb + d, 3),
                          "accent": m.group(1) if m else None, "chapter": chap["key"]})
            tb += d
        audio += samples; t += dur
        gap = v["gap_sentence_ms"]
        audio += silence(gap, sr); t += gap / 1000
    gap = v["gap_chapter_ms"]
    audio += silence(gap, sr); t += gap / 1000
    chapters.append({**chap, "t_start": round(t_start, 3), "t_end": round(t, 3)})

with wave.open(str(ep_dir / "voice.wav"), "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes(struct.pack("<%dh" % len(audio), *[max(-32768, min(32767, s)) for s in audio]))
(ep_dir / "_tmp.wav").unlink(missing_ok=True)

episode = {k: plan[k] for k in ("id", "title", "preset", "character", "fps")}
if "host_set" in plan: episode["host_set"] = plan["host_set"]
# format registry fields (docs/ENGINE_CONTRACT.md): optional, copied as they are; chapters[].media travels with the chapter
for k in ("format", "series"):
    if k in plan: episode[k] = plan[k]
# layout version (docs/ENGINE_CONTRACT.md): 2 = safe-zone layout; a plan without it keeps the legacy layout
if "layout" in plan: episode["layout"] = plan["layout"]
# hook-first opening (docs/ENGINE_CONTRACT.md): the hook sentence as a giant caption from frame 0, copied as it is
if isinstance(plan.get("opening"), dict): episode["opening"] = plan["opening"]
# look of the episode / series / format, resolved once and embedded (tools/looks.py)
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import looks as _looks
_look = _looks.resolve(plan)
if _look: episode["look"] = _look
# language of the video (docs/LANGUAGE.md): the engine formats numbers and the series badge with it
episode["lang"] = LANG
episode["voice"] = {"file": "voice.wav", "lang": LANG, "engine": v["engine"]}
episode["duration"] = round(t + 1.0, 3)
episode["chapters"] = chapters
episode["words"] = words
(ep_dir / "episode.json").write_text(json.dumps(episode, ensure_ascii=False, indent=1))
print(f"duration {t:.1f}s, {len(words)} blocks, {len(chapters)} chapters, language {LANG}")
