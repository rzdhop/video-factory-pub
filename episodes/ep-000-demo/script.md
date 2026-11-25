# ep-000-demo — Why is the sky blue?

Format: humour-express · Language: en · Preset: dark-2d · Character: host · about 15 s

This is the DEMO episode of the engine: a tiny example that shows every step of the chain and serves as the
fixture of `tools/selftest.sh`. It is much shorter than its format asks (the linter warns about it, on purpose).

**Voice: the espeak-ng placeholder.** `voice.wav` is the robotic reference voice that `tools/build_episode.py`
writes for timing. A real episode replaces it with a real voice take (see `tools/voice.py` and the voice chain in
`CLAUDE.md`); here it is kept so the demo costs nothing and needs no account.

## Narration (blocks separated by "|", accented word between *asterisks*)

### Hook — HUD: THE · HOOK
Why is the | sky *blue*? | Sunlight holds | every *color*.

### Proof — HUD: THE · PROOF
Air *scatters* | blue light | far more | than *red*.

### Twist — HUD: THE · TWIST
So blue comes | from *everywhere*. | At sunset, | the blue | gets *lost*.

### Question — HUD: AND · YOU?
So what color | is the sky | on *Mars*?

## Fact check
- Sunlight is a mix of all the visible colours: a prism or a rainbow splits it (Newton, 1672).
- The molecules of the air scatter short wavelengths much more than long ones (Rayleigh scattering, intensity
  proportional to 1/wavelength^4): blue light around 450 nm is scattered roughly 4 to 6 times more than red light
  around 650-700 nm. This scattered blue reaches the eye from every direction of the sky, which is why the sky
  looks blue (NASA Space Place, "Why is the sky blue?"; any optics textbook, "Rayleigh scattering").
- At sunset the light crosses a much longer path of air: most of the blue is scattered out of the direct beam, so
  what arrives straight from the sun is orange and red.
- Simplification, said here and not in the video: violet is scattered even more than blue, but the sun emits less
  of it, the upper air absorbs part of it and our eyes are less sensitive to it, so we see blue.
- The last line is a question, not a claim: nothing is stated about Mars.

## How this demo was built (the real chain, no paid service)
```
python3 tools/new_episode.py ep-000-demo --format humour-express --lang en --title "Why is the sky blue?"
# write script.md and plan.json (opening, direction, sfx_events), style.md, the scenes src/layers/scenes/Ep000_*.tsx
python3 tools/gen_scenes.py
python3 tools/lint_plan.py episodes/ep-000-demo
python3 tools/build_episode.py episodes/ep-000-demo        # espeak reference voice + timings
python3 tools/validate_episode.py episodes/ep-000-demo/episode.json
python3 tools/retime.py episodes/ep-000-demo               # (a real voice is aligned first: align_audio.py)
python3 tools/voice_envelope.py episodes/ep-000-demo       # mouth of the host
python3 tools/direct.py episodes/ep-000-demo               # acting of the host
python3 tools/build_sfx.py episodes/ep-000-demo            # music bed + effects
bash tools/check.sh ep-000-demo
python3 tools/stills.py ep-000-demo
bash tools/render.sh ep-000-demo draft
```
