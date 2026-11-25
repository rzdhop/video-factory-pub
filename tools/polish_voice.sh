#!/usr/bin/env bash
# Broadcast chain for the narration: rumble cut, presence, compression, de-essing, limiter.
# Timing is untouched, so it can run before or after alignment. Keeps the source sample rate.
# Usage: polish_voice.sh in.(wav|mp3) out.wav
set -euo pipefail
in="$1"; out="$2"
sr=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=nw=1:nk=1 "$in")
tmp="${out%.wav}.polish_tmp.wav"
ffmpeg -v error -y -i "$in" -af "\
highpass=f=85,\
equalizer=f=220:t=q:w=1.2:g=-2,\
equalizer=f=3400:t=q:w=1.0:g=3,\
equalizer=f=9000:t=h:w=4000:g=2,\
acompressor=threshold=-21dB:ratio=3.5:attack=6:release=120:makeup=5dB,\
deesser=i=0.35,\
alimiter=limit=0.89:level=false" -ar "$sr" -ac 1 "$tmp"
mv "$tmp" "$out"
echo "polished: $out @ ${sr} Hz"
