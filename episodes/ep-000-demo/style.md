# ep-000-demo — art direction

1. One world: a slice of sky above a curved strip of ground, seen from the side, on the dark set of the preset.
2. The object we follow: the light of the sun. White light = text colour; blue light = `cyan`; red light = `accentAlt`.
3. The sun (accent colour) sits top-right in the hook and comes back in the last chapter: the end loops on frame 0.
4. Light direction: from the sun, top-right, toward the observer standing at the centre of the ground.
5. Camera: slow push toward the place where something happens to the light; a punch on the accent word.
6. On screen all episode: nothing but the scene, the host bottom-left and the captions.
7. Signature transition: the default rotation of the engine (whip, zoom, flash).
8. Shared parts live in `src/layers/scenes/Ep000_shared.tsx` (Sun, Sky, Ground, Molecule, Beam); every colour,
   stroke and radius comes from `kit(preset)`, so the demo follows any look.

Chapters:
- hook: sun, blue sky, ground, one white beam; on "color" the beam fans out into five colours.
- preuve: air molecules; a blue ray hits one and leaves in every direction, a red ray goes straight through.
- twist: blue rays reach the observer from the whole sky; the sun sets, the blue fades, a red ray arrives.
- question: the sun again, a small blue Earth, Mars and a question mark.
