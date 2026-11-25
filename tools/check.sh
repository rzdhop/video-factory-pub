#!/usr/bin/env bash
# Everything the orchestrator checks before a render, in one command.
# Usage: tools/check.sh <episode_id>
# Runs tools/gen_scenes.py first (the scene registry src/layers/scenes/index.ts is generated again), then
# tools/formats.py, tools/lint_plan.py, tools/validate_episode.py (when episode.json exists),
# tools/sound_check.py (when sfx.wav exists: effects on their cues, music under the voice, library, credits),
# `npx tsc --noEmit` (error count + first 10 lines) and tools/selftest.sh (tool round trip + episode.json shape).
# Every step runs; exit 1 when one of them failed.
set -uo pipefail
cd "$(dirname "$0")/.."
[ $# -eq 1 ] || { echo "usage: tools/check.sh <episode_id>" >&2; exit 2; }
id="${1%/}"; id="${id##*/}"
dir="episodes/$id"
[ -d "$dir" ] || { echo "$dir not found" >&2; exit 2; }
failed=()

step() { # step <name> <command...>
  local name="$1"; shift
  echo "== $name"
  if "$@"; then echo "-- $name: ok"; else echo "-- $name: FAILED"; failed+=("$name"); fi
  echo
}

step gen_scenes python3 tools/gen_scenes.py
step formats python3 tools/formats.py
step lint_plan python3 tools/lint_plan.py "$dir"
if [ -f "$dir/episode.json" ]; then
  step validate_episode python3 tools/validate_episode.py "$dir/episode.json"
else
  echo "== validate_episode"; echo "-- skipped: $dir/episode.json not built yet"; echo
fi

if [ -f "$dir/sfx.wav" ]; then
  step sound_check python3 tools/sound_check.py "$dir"
else
  echo "== sound_check"; echo "-- skipped: $dir/sfx.wav not built yet"; echo
fi

echo "== tsc"
tsc_out=$(npx tsc --noEmit 2>&1); tsc_rc=$?
n=$(printf '%s\n' "$tsc_out" | grep -c 'error TS' || true)
if [ $tsc_rc -eq 0 ]; then
  echo "-- tsc: ok (0 errors)"
else
  echo "$n TypeScript error(s):"
  printf '%s\n' "$tsc_out" | head -n 10
  echo "-- tsc: FAILED"
  failed+=(tsc)
fi
echo

step selftest bash tools/selftest.sh "$id"

if [ ${#failed[@]} -eq 0 ]; then echo "check $id: all good"; exit 0; fi
echo "check $id: FAILED -> ${failed[*]}"
exit 1
