# ep-001-made-by-ai — independent stills check (before the full render)

Source: the sheet `vf-public-proof/ep-001-stills-voice.jpg`, plus 75 stills at 0.5 scale and 9 at full size
(frame 0, 3, every chapter cut and its first 2 s, every reveal, the close-up, the last frame), the cover and its
3:4 crop, and a strip at 35 % size and 55 % brightness. Times are from `episode.json` (30 fps, 878 frames).

## Frame 0 and cover: pass

Sound off, 1 second, a stranger:
1. What is it about? Yes. The whole hook sentence is on screen from frame 0, bright, 3 lines.
2. Why weird or funny? Yes, mildly: an empty director's chair marked AI. The empty rounded frame next to it says
   nothing to a stranger yet (it only becomes "this video" later); the chair carries the image alone.
3. Would the image stop someone? Yes, on the clean poster and the accent backrest. It is not a strong gag.
4. Readable in the 3:4 crop? Yes, every word, and the band fits under it.

## P0 — fix before the render (all three in `src/layers/scenes/Ep001_line.tsx`)

- t=8.5-10.3 s · line, FACT CHECK · the stamp arm comes down through the HUD: it covers the chapter label
  "THE · LINE" and the progress bar for almost 2 s (f258, f270, f280, f290, f300), against style.md rule 8
  → anchor the arm at the top of the scene box (below the HUD) or bring it in from the right edge; park the stamp
  clear of the FACT CHECK sign (it rests on the sign's corner at 9.6-10.0 s).
- t=15.8-16.04 s · line, SCORE · the word STRONG and the needle in the accent zone are settled only at about
  15.8 s and the whip cut starts at 16.03 s: the payoff of "by their score" is readable for about 0.25 s
  → wake the needle on `b("picks sounds")` and write STRONG at the start of the "by their score" block (15.41 s),
  or add a 0.35 s pause after "score" in `plan.json` `retime.pauses`.
- t=11.1-12.3 s · line, VOICE (ask 2) · the hand that pays never really enters: only a fingertip, cut by the right
  edge (f350, f360), nothing at "before paying" (f335). Without sound the second ask is "a waveform and a tick":
  no person is seen → move the hand's rest point about 80-100 u to the left (`vx + 190 * u` → about `vx + 100 * u`)
  and start it at `tPay - 0.15`, so a whole hand is on screen when mark 2 fills.

## P1

- whole episode · `AskCounter` (`Ep001_shared.tsx`) · the third mark sits at 97-98 % of the width (f140, f228,
  f440, f596), outside the 8 % side margin and almost at the edge when the camera punches; in the hook the hand's
  sleeve touches it (f140) → move the counter about 6 % of the box to the left.
- t=13.4-16.0 s · line, CODE · the left angle bracket is cut by the left edge of the frame (f404, f464, f475) and
  hugs it the rest of the time → smaller brackets or the frame 4 % further right from "code" on.
- t=18.4-20.2 s · human, YES · the plinth of the button touches or passes the right edge (f555, f565, f586, f596)
  → `buttonX` from 0.83 to about 0.77 of the box.
- t=19.8-20.1 s · human, press · the button is already flat while the fingertip is still about 70 px above it and
  off to the left (f596, f600) → lower `handHover` or raise `handDown`, and centre the finger on the button.
- t=17.55-18.4 s · close-up on "stops" · two faults in the only close-up: (a) the host's eyelids are rectangles
  with square corners that stick out of the round eyes (also visible in bust at 15.5-16.0 s, "deadpan")
  → clip the lids to the eye circle in `src/layers/characters/Host.tsx`; (b) the caption "AND STOPS." lies on the
  neck and collar, the accent word on the red shirt → lift the caption in close-up or frame the head higher.
  The close-up also hides the belt stopping at the barrier; acceptable (nothing to read), but the dead stop of
  style.md rule 5 is never seen.
- whole episode · single accent · the host's shirt is a big red-orange gradient, the largest warm surface of every
  frame, next to the one vermilion thing of the scene; his head has a radial shading. Both break "one accent, flat"
  → a flat paper-tint or ink-tint shirt for this look (or flat vermilion only if the host is meant to be the
  accent, which style.md does not say), and flat fills on the head.
- question chapter · single accent · two or three accents at once: the logo's triangle and dot stay vermilion
  while the book (21.0 s), the MIT tag (21.7 s), the second frame (23.3 s) and the backrest (25.4 s) take the
  accent in turn → keep the logo's accent (it is the logo) and draw book, tag and second frame in paper with an
  accent outline only at their entrance, or accept two accents here and say so in style.md.
- captions (engine, `src/layers/Captions.tsx`) · the enlarged accent word eats the space: outlines touch in
  "THREE IDEAS;" (6.0 s), "FOR THE VOICE." (12.0 s), "BY THEIR SCORE." (15.8 s), "AND ITS RULEBOOK" (21.3 s),
  "AND STOPS." (18.0 s) → add the scale's extra width to the gap before an accent word.
- cover · the band is yellow with "SOLO / EXAMPLE EN · ONE EPISODE · STANDS ALONE": a second colour on a one-accent
  look, and the word EXAMPLE on the project's presentation video → give the episode a real shelf in
  `brands/shelves.json` (paper or vermilion band), or `--no-band`. The cover frame (frame 6) also carries the
  karaoke underline under "AN", which reads as an odd emphasis → pick a frame or an option without the underline.

## P2

- t=0 s · frame 0 · the title starts 15 px under the floor line and the chair's feet, while the lower third of the
  frame is empty → lower the title by about 40 px (`opening`), keep the size.
- t=2.4 s (f72) · a grey veil flashes over the whole frame on "Almost" (ground goes from #16141F to about
  #2B2A35) → switch the beat flash off for this look.
- t=2.4 s and 25.4 s · the punch on "Almost" and on "chair" pushes the chair's left arm out of the frame (f72,
  f763), the very object the beat is about → focus x 0.42 → about 0.34 in both camera maps, or a smaller punch.
- transitions and close-up · motion blur on the two whips and the zoom (f148, f481, f606), blur and dimming of the
  scene behind the close-up, a soft edge on the caption shadow: all against "no blur" of the look. Engine side.
- t=6.5-7.3 s · line, IDEAS · the picked card (accent) vanishes under the hand and the hand leaves upward empty
  (f210); "puts it in the frame" is not seen → carry the accent card to the frame.
- t=14.6-15.4 s · line, SCORE · nothing changes during "so it picks sounds" (0.85 s) → solved by the P0 fix.
- t=23.3-24.4 s · question, "yours" · the second frame covers the clapperboard and sits on the logo and the MIT
  tag: four objects stacked in the right third (f700, f715) → a smaller frame, or hide the clapper meanwhile.
- t=26.3 s to the end · question · the name `video-factory` almost touches the corner of the backrest and sits
  20 px over the MIT tag (f791, f877) → raise it by about 14 u and centre it on the logo.
- t=28.2-29.27 s · tail · about 1 s with no caption and nothing new → trim the tail to about 0.5 s.
- hands of the host · the left hand is cut by the left edge in every shrug (f96, f316, f763, f775). Engine side.
- t=15.8 s · the sign's pole runs behind the word STRONG. Cosmetic.

## Reveals against the voice: all on time except the two P0

IDEAS cards 5.3-5.5 s ("pitched" 5.14); hand 6.3 s and mark 1 at 6.5 s ("a person picked one" 6.26); SCRIPT bars
7.6 s (7.49); stamp arm 8.6 s ("agent" 8.46), check badge 9.33 s ("checked every fact" 9.23); question mark 10.5 s
(10.48); voice bars and mark 2 at 11.67 s (11.60); play triangle 12.5 s (12.48); brackets 13.5 s (13.40); meter
14.0 s (13.94); RENDER bar full at 17.5 s, close-up 17.55-18.4 s; YES button 18.5 s (18.40); mark 3 at 19.6-19.7 s
("may I" 19.46), press 19.8 s; book 21.07 s (20.94); MIT tag 21.8 s (21.69); second frame 23.3 s (23.25); backrest
25.4 s (25.37); name 26.4 s (26.30).

## The three asks without sound

Ask 1 reads (three cards, a hand takes one, the first mark fills in the accent). Ask 3 reads (YES button, a
question mark, a hand, the barrier lifts, the third mark). Ask 2 does not (P0). The counter itself reads at 35 %
size and low brightness.

## Good, do not touch

- Frame 0: complete and bright from the first frame, the accent only on the backrest and on ITSELF?.
- Every cut shows a complete scene 0.15 s after it (f152, f486, f610): no empty stage anywhere.
- All drawn words are readable at 35 % size and 55 % brightness: AI, ASKS, IDEAS, SCRIPT, FACT CHECK, VOICE, CODE,
  SCORE, STRONG, RENDER, YES, MIT, video-factory.
- The fact-check stamp with its big accent badge (f280), the voice bars, the YES button with its question mark.
- The accent handover inside the line chapter: one thing at a time, the previous one goes back to paper.
- The loop: the last frame is the set of frame 0, same places, the accent back on the backrest.
- Captions sit at 52-58 % of the height, inside the safe zone, never over a drawing.

render: no-go until the three P0 are fixed (about ten lines in one file); frame 0 itself passes.
