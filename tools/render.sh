#!/usr/bin/env bash
# Render an episode with Remotion.
# Usage: tools/render.sh <episode_id> [draft|final] [--frames=A-B]
#   draft: half size, crf 30, jpeg quality 60 -> out/<id>.draft.mp4 (optional --frames=A-B: a frame range only)
#   final: full size h264 crf 20              -> out/<id>.mp4
# The full Remotion log goes to out/<id>.<mode>.log (errors are never hidden). The script fails when Remotion
# fails or when the output file is missing, and prints the duration and size of the file otherwise.
# Concurrency comes from remotion.config.ts. RENDER_DRY=1 prints the command and stops: nothing is synced
# to public/, nothing is rendered.
set -euo pipefail
cd "$(dirname "$0")/.."

usage() { sed -n '2,5p' "$0" | sed 's/^# \{0,1\}//' >&2; exit 2; }
[ $# -ge 1 ] || usage
id="${1%/}"; id="${id##*/}"
mode="${2:-final}"
frames="${3:-}"
[ $# -le 3 ] || usage
case "$mode" in draft|final) ;; *) echo "unknown mode '$mode' (draft or final)" >&2; usage ;; esac
if [ -n "$frames" ]; then
  [ "$mode" = draft ] || { echo "--frames is only for draft renders" >&2; exit 2; }
  [[ "$frames" =~ ^--frames=[0-9]+-[0-9]+$ ]] || { echo "bad frame range '$frames' (expected --frames=A-B)" >&2; exit 2; }
fi
[ -f "episodes/$id/episode.json" ] || { echo "episodes/$id/episode.json not found" >&2; exit 2; }

if [ "$mode" = draft ]; then
  out="out/$id.draft.mp4"
  args=(--codec=h264 --scale=0.5 --crf=30 --jpeg-quality=60)
  [ -z "$frames" ] || args+=("$frames")
else
  out="out/$id.mp4"
  args=(--codec=h264 --crf=20)
fi
log="out/$id.$mode.log"
cmd=(npx remotion render src/index.ts Episode "$out" "${args[@]}" "--props={\"episodeId\":\"$id\"}")
echo "render ($mode): ${cmd[*]}"
if [ "${RENDER_DRY:-0}" = 1 ]; then echo "RENDER_DRY=1: not syncing, not rendering"; exit 0; fi

python3 tools/stills.py "$id" --sync-only
mkdir -p out

rm -f "$out"
start=$(date +%s)
set +e
"${cmd[@]}" >"$log" 2>&1
rc=$?
set -e
if [ $rc -ne 0 ]; then
  echo "RENDER FAILED (exit $rc), last lines of $log:" >&2
  tail -n 25 "$log" >&2
  exit $rc
fi
if [ ! -s "$out" ]; then
  echo "RENDER FAILED: Remotion exited 0 but $out is missing or empty, last lines of $log:" >&2
  tail -n 25 "$log" >&2
  exit 1
fi
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out") || { echo "ffprobe cannot read $out" >&2; exit 1; }
[ -n "$dur" ] || { echo "ffprobe found no duration in $out" >&2; exit 1; }
size=$(du -h "$out" | cut -f1)
printf 'rendered: %s  %.1f s  %s  (took %d s, log %s)\n' "$out" "$dur" "$size" "$(( $(date +%s) - start ))" "$log"
