#!/usr/bin/env python3
"""Generate src/layers/scenes/index.ts: the one registry of the episode scenes (no hand-edited list).

Scans src/layers/scenes/*.tsx for exported `<NAME>_SCENES` and `<NAME>_CAMERA` constants:
per-episode files (Ep123.tsx -> EP123_SCENES / EP123_CAMERA) and per-chapter files
(Ep000_hook.tsx -> EP000_HOOK_SCENES / EP000_HOOK_CAMERA). Files without such an export
(Media.tsx, shared parts such as Ep000_shared.tsx) are left alone.
The index exports the merged `EP_SCENES` and `EP_CAMERA` read by src/layers/Scene.tsx and the
`SCENE_NAMES` list read by tools/lint_plan.py.

Usage: gen_scenes.py [--check]
  (no flag)  write the index when its content changed
  --check    write nothing; exit 1 when the index is missing or out of date
Exit 1 as well when a scene name is defined twice (the later file would silently win).
A scene without a camera entry is only a WARN: Scene.tsx falls back to a neutral camera.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCENES_DIR = ROOT / "src" / "layers" / "scenes"
INDEX = SCENES_DIR / "index.ts"
SKIP = {"Media.tsx"}
EXPORT = re.compile(r"^export\s+const\s+(\w+_(SCENES|CAMERA))\b[^=\n]*=\s*\{", re.M)
KEY = re.compile(r"""(?:"([^"]+)"|'([^']+)'|(?<![\w.$])([A-Za-z_$][\w$]*))\s*:""")
ENTRY = re.compile(r"""(?:"([^"]+)"|'([^']+)'|(?<![\w.$-])([A-Za-z_$][\w$]*))\s*:\s*([A-Za-z_$][\w$]*)\s*(?=,|$)""", re.M)
SHORTHAND = re.compile(r"(?:^|[{,])\s*([A-Za-z_$][\w$]*)\s*(?=,|$)", re.M)
DECL = re.compile(r"^(?:export\s+)?(?:const|let|var|function|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)", re.M)
BEAT = re.compile(r"""(?<![\w.$])b\(\s*(?:"([^"\\\n]+)"|'([^'\\\n]+)')\s*\)""")


def strip_comments(src):
    return re.sub(r"/\*.*?\*/|(?<![:\\])//[^\n]*", "", src, flags=re.S)


def literal(src, start):
    """Text between the `{` that ends at `start` and its matching `}` (top level of the object only)."""
    depth, i = 1, start
    while i < len(src) and depth:
        depth += {"{": 1, "}": -1}.get(src[i], 0)
        i += 1
    body = strip_comments(src[start:i - 1])
    # keep the first level only, so the keys of a nested object (focus, beats) are not taken for scenes
    out, depth = [], 0
    for ch in body:
        if ch in "{[(":
            depth += 1
        elif ch in "}])":
            depth -= 1
        elif depth == 0:
            out.append(ch)
    return body, "".join(out)


def required_beats(body):
    """b("word") literals a scene component cannot do without: a literal used as a fallback or as a test
    (inside Math.min / Math.max, or compared: `b("x") < 999`) is optional and left out."""
    optional_spans = []
    for m in re.finditer(r"Math\.(?:min|max)\(", body):
        depth, i = 1, m.end()
        while i < len(body) and depth:
            depth += {"(": 1, ")": -1}.get(body[i], 0)
            i += 1
        optional_spans.append((m.end(), i))
    required, optional = set(), set()
    for m in BEAT.finditer(body):
        word = m.group(1) or m.group(2)
        tested = re.match(r"\s*(?:[<>]|[!=]==?)", body[m.end():])
        if tested or any(a <= m.start() < b for a, b in optional_spans):
            optional.add(word)
        else:
            required.add(word)
    return sorted(required - optional)


def scan():
    """[{file, stem, scenes_const, camera_const, scenes: {name: component or None}, cameras: [names],
         beats: {name: [required b("...") literals of the scene component]}}] for every scenes file."""
    found = []
    for path in sorted(SCENES_DIR.glob("*.tsx")):
        if path.name in SKIP:
            continue
        src = path.read_text(encoding="utf-8")
        item = {"file": path, "stem": path.stem, "scenes_const": [], "camera_const": [], "scenes": {}, "cameras": [],
                "beats": {}}
        for m in EXPORT.finditer(src):
            body, flat = literal(src, m.end())
            if m.group(2) == "CAMERA":
                item["camera_const"].append(m.group(1))
                item["cameras"] += [k.group(1) or k.group(2) or k.group(3) for k in KEY.finditer(flat)]
                continue
            item["scenes_const"].append(m.group(1))
            for k in KEY.finditer(flat):
                item["scenes"].setdefault(k.group(1) or k.group(2) or k.group(3), None)
            for k in ENTRY.finditer(body):  # "name": Component
                name = k.group(1) or k.group(2) or k.group(3)
                if name in item["scenes"]:
                    item["scenes"][name] = k.group(4)
            for k in SHORTHAND.finditer(flat):  # { foo, bar }: the key is the component
                item["scenes"].setdefault(k.group(1), k.group(1))
        if not item["scenes_const"] and not item["camera_const"]:
            continue
        # b("word") literals of each scene component: from its top-level declaration to the next one.
        # Only for a component registered under ONE scene name, so the literal belongs to that scene for sure.
        decls = [(m.start(), m.group(1)) for m in DECL.finditer(src)]
        users = {}
        for name, comp in item["scenes"].items():
            if comp:
                users.setdefault(comp, []).append(name)
        for n, (pos, ident) in enumerate(decls):
            if len(users.get(ident, [])) != 1:
                continue
            end = decls[n + 1][0] if n + 1 < len(decls) else len(src)
            body = strip_comments(src[pos:end])
            item["beats"][users[ident][0]] = required_beats(body)
        found.append(item)
    return found


def problems(found):
    """(errors, warnings) of a scan."""
    errors, warns, seen = [], [], {}
    for item in found:
        name = item["file"].name
        if item["camera_const"] and not item["scenes_const"]:
            warns.append(f"{name}: exports {item['camera_const'][0]} but no *_SCENES")
        if item["scenes_const"] and not item["camera_const"]:
            warns.append(f"{name}: exports {item['scenes_const'][0]} but no *_CAMERA (neutral camera for its scenes)")
        for scene in item["scenes"]:
            if scene in seen:
                errors.append(f"scene '{scene}' is defined in {seen[scene]} and in {name}")
            seen[scene] = name
            if item["camera_const"] and scene not in item["cameras"]:
                warns.append(f"{name}: scene '{scene}' has no camera entry (neutral camera)")
        for cam in item["cameras"]:
            if cam not in item["scenes"]:
                warns.append(f"{name}: camera entry '{cam}' names no scene of this file")
    return errors, warns


def render(found):
    """Text of index.ts for a scan."""
    lines = ["// GENERATED by tools/gen_scenes.py from the *_SCENES / *_CAMERA exports of this folder.",
             "// Do not edit: run `python3 tools/gen_scenes.py` after adding, renaming or removing a scene file.",
             'import type React from "react";']
    for item in found:
        names = item["scenes_const"] + item["camera_const"]
        lines.append(f'import {{ {", ".join(names)} }} from "./{item["stem"]}";')
    scenes = [f"...{c}" for item in found for c in item["scenes_const"]]
    cameras = [f"...{c}" for item in found for c in item["camera_const"]]
    names = sorted({s for item in found for s in item["scenes"]})

    def obj(parts):
        return "{\n" + "".join(f"  {p},\n" for p in parts) + "}" if parts else "{}"

    lines += ["",
              "/** Camera of a scene: focus point (fractions of the scene box) and the words it punches on. */",
              "export type SceneCamera = { focus: [number, number]; beats: string[] };",
              "",
              "/** Every episode scene by name (plan.json chapters[].scene). */",
              f"export const EP_SCENES = {obj(scenes)} as Record<string, React.FC<any>>;",
              "",
              "export const EP_CAMERA: Record<string, SceneCamera> = " + obj(cameras) + ";",
              "",
              "/** Scene names, read by tools/lint_plan.py. */",
              "export const SCENE_NAMES: string[] = [" + ("\n" + "".join(f'  "{n}",\n' for n in names) if names else "") + "];",
              ""]
    return "\n".join(lines)


def index_names(text):
    """Scene names listed in an index.ts text."""
    m = re.search(r"SCENE_NAMES[^=]*=\s*\[(.*?)\]", text, flags=re.S)
    return set(re.findall(r'"([^"]+)"', m.group(1))) if m else set()


def stale_reasons(found=None):
    """Why src/layers/scenes/index.ts must be generated again (empty list when it is up to date)."""
    found = scan() if found is None else found
    if not INDEX.is_file():
        return ["src/layers/scenes/index.ts does not exist"]
    text = INDEX.read_text(encoding="utf-8")
    if text == render(found):
        return []
    reasons = []
    imported = set(re.findall(r'from "\./([^"]+)"', text))
    for item in found:
        if item["stem"] not in imported:
            reasons.append(f"{item['file'].name} is absent from the index")
        elif item["file"].stat().st_mtime > INDEX.stat().st_mtime:
            reasons.append(f"{item['file'].name} changed after the index was generated")
    for stem in sorted(imported - {item["stem"] for item in found}):
        reasons.append(f"the index imports ./{stem}, which exports no scene any more")
    return reasons or ["the index differs from what the scene files export"]


def main():
    args = sys.argv[1:]
    if [a for a in args if a != "--check"]:
        sys.exit(__doc__)
    found = scan()
    errors, warns = problems(found)
    for w in warns:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    n_scenes = len({s for item in found for s in item["scenes"]})
    rel = INDEX.relative_to(ROOT)
    if "--check" in args:
        reasons = stale_reasons(found)
        for r in reasons:
            print("ERROR", r, "(run tools/gen_scenes.py)")
        print(f"gen_scenes --check: {rel} " + ("is out of date" if reasons else f"is up to date ({n_scenes} scenes)"))
        return 1 if errors or reasons else 0
    if errors:
        print(f"gen_scenes: {rel} NOT written ({len(errors)} error(s))")
        return 1
    text = render(found)
    if INDEX.is_file() and INDEX.read_text(encoding="utf-8") == text:
        print(f"gen_scenes: {rel} already up to date ({n_scenes} scenes from {len(found)} file(s))")
    else:
        INDEX.write_text(text, encoding="utf-8")
        print(f"gen_scenes: wrote {rel} ({n_scenes} scenes from {len(found)} file(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
