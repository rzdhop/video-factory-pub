#!/usr/bin/env bash
# Install earshot (the listening tool behind tools/sound_lib.py and tools/sound_check.py) and its two models.
# About 1 minute for the install and 20 s for the models (1.1 GB) on the session machine. Safe to re-run.
# The version is pinned: the scores stored in sounds/library.json were measured with it.
set -euo pipefail
EARSHOT_REF="4ac3d2ac2b151e1c23376f9ce7f3047a17050013"   # earshot 0.4.1
export PATH="$HOME/.local/bin:$PATH"
command -v uv >/dev/null || { echo "uv is missing: https://docs.astral.sh/uv/getting-started/installation/" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg is missing" >&2; exit 1; }
if ! command -v earshot >/dev/null; then
  uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot@${EARSHOT_REF}"
fi
if [ "${1:-}" != "--no-models" ]; then
  earshot doctor --fetch | grep -E "looks healthy|problems" || true
fi
echo "sound tools ready: $(command -v earshot)"
