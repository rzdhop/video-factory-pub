#!/usr/bin/env bash
# Loudness-normalize the rendered MP4 to -14 LUFS (two-pass loudnorm), copy video stream, write a cover thumbnail.
set -euo pipefail
in="$1"; out="${2:-${in%.mp4}.master.mp4}"
stats=$(ffmpeg -hide_banner -nostats -i "$in" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get(){ echo "$stats" | python3 -c "import sys,json;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$in" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" -ar 44100 -c:a aac -b:a 192k "$out"
ffmpeg -v error -y -ss 1.5 -i "$out" -frames:v 1 "${out%.mp4}.cover.jpg"
echo "mastered: $out"
