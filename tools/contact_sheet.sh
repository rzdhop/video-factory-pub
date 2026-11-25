#!/usr/bin/env bash
# 16-frame contact sheet of a video, for visual review.
set -euo pipefail
in="$1"; out="${2:-${in%.mp4}.sheet.jpg}"
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
ffmpeg -v error -y -i "$in" -vf "fps=16/$d,scale=180:-1,tile=8x2" -frames:v 1 "$out"
echo "$out"
