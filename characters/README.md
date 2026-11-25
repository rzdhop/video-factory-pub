# Characters

A host is a drawn character that speaks the narration: it has a face that changes with the emotion, a mouth that
follows the real voice, hands, and a voice of its own. Every format accepts a host; `"character": "none"` in
plan.json gives the hostless layout.

What ships:
- `host`: `src/layers/characters/Host.tsx`, the TEMPLATE. A neutral figure with the full rig. It is there to be
  copied, and to let the demo episode and a first test render. It is nobody's identity: a brand's videos get their
  own character.
- `volt`: a minimal round-head mascot without a rig (`src/layers/characters/Volt.tsx`), usable as a small witness.

## When there is no character of the user's own
The AI notices it (only `Host.tsx` in `src/layers/characters/`) when a hosted format is asked for, says so, and
proposes: create a host now (the steps below, about one session), use the hostless layout for this video, or use
the template host for a test that will not be published. It asks who the host is before drawing anything.

**A real person is drawn only with that person's agreement.** The user's own face from the user's own photos is
fine. Anybody else (a friend, a colleague, a public figure) needs their yes first, and a character that imitates a
real person without it is refused. A drawn likeness is personal: the character file of a real person is the
person's to keep or to remove from a public repo.

## Creating a host
1. **Collect the features.** From photos the user provides, or from a description, list what makes the person or
   the character recognisable at 100 px: the silhouette first (hair shape, head shape), then two or three strong
   features (glasses, moustache, earrings, a hat), the outfit and one detail on the chest (a logo of the user's own, a
   patch). Exaggerate those, drop the rest. Skin and clothes are the character's own colours: they do not follow
   the look.
2. **Copy** `src/layers/characters/Host.tsx` to `<Name>.tsx`. Keep ALL the props, because the engine drives them:
   `cx`, `cy` (head centre), `height` (bottom of the body), `t`, `emotion`, `speaking`, `accentHit`, `accent`,
   `squash`, `wave`, `prevEmotion` and `emoK` (faces blend instead of snapping), `mouth` (`open`, `wide`: the real
   voice of the frame), `gesture` (`kind`, `k`). Keep the `FACES` table as it is: one numeric face per emotion
   (`idle`, `happy`, `wink`, `curious`, `confused`, `amazed`, `panic`, `deadpan`, `smug`), with the same fields.
   Tune its numbers for the character if needed, never its shape. Keep the four gestures (`wave`, `point`,
   `shrug`, `balance`).
3. **Redraw the shapes only**: head, hair, features, body, hands. Export the geometry of the drawing (where the
   eye line and the chin sit below the head centre, like `HOST_GEOMETRY`): the bust and close-up framings are
   computed from those two numbers. A chest detail that the captions would cover in a close-up takes an opacity
   prop and fades out.
4. **Register** it: one line in `HOSTS` of `src/layers/Character.tsx`, one line in `SHEETS` of
   `src/CharacterSheet.tsx`.
5. **Render the model sheet**: `npx remotion still src/index.ts CharacterSheet out/sheet.png --props='{"character":"<id>"}'`
   (hero portrait, every emotion, every gesture).
6. **Show the sheet to the user BEFORE any episode render**, and iterate on their words (face shape, hair, eyes,
   outfit). Check on the sheet: the character is recognised without its name; two emotions never look the same;
   the mouth reads at phone size; nothing of the face is hidden by the hair in `panic` or `amazed`.
7. **Give it a voice.** Add the voice to `voices/catalog.json` (`voice_id`, provider, model, a status), generate
   one short take, send it to the user, and set the status to validated once they have heard it. Then write
   `"<id>": "<voice key>"` in `characters/voices.json`. A host keeps this voice in every format; it is never
   changed without asking. `python3 tools/voice.py <episode_dir>` says which voice an episode gets and why.
8. **Give it its own intro or sign-off line**, chosen by the user from two or three proposals. It comes after the
   hook, or as the last second, never before the hook (`docs/RETENTION.md`). It can be generated once and stored
   in `characters/` to be reused, in one language only (`docs/LANGUAGE.md`); otherwise it is generated with the
   narration.
9. Set `"character": "<id>"` in the plan, or as `default_character` of a format, and give the character its default
   shelf in `brands/shelves.json` (`default_for.character`).
10. Keep the sheet (`characters/<id>_model_sheet.png`) and add a short entry below.

A secondary character that never speaks (a rival, a witness, a mascot) does not need the rig: it is drawn inside
the scenes, or in the episode's shared file, with a few moods.

A drawing style (`docs/STYLES.md`) may redraw a host in its own way; it keeps the same props, `FACES` table and
geometry, so the acting works unchanged.

## Characters of this repo
| Id | File | Who | Voice | Intro or sign-off |
|---|---|---|---|---|
| `host` | `src/layers/characters/Host.tsx` | the template, neutral | `host-voice` (placeholder) | none |
| *(example row, replace it)* `<id>` | `src/layers/characters/<Name>.tsx` | `<who, and whose agreement>` | `<key of voices/catalog.json>` | `<line>` |
