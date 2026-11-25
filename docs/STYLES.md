# Styles: how to build a look and a drawing style

No style ships with the repo. This file is the method for building one, and the reasons behind each step.

## Look or style
- A **look** is data: colours, set, lights, fonts and kit style in `looks/<id>.json` (`docs/LOOKS.md`). It needs no
  code. It changes the mood; the picture is built the same way.
- A **style** is a way of BUILDING the drawing. It has its own set, its own captions, its own label (HUD), an
  animated host drawn in it, and drawing rules for any new subject. It is code: components that replace the default
  builders, switched on by one key of a look (`"style": "<id>"`). The look still carries the colours.

Three things learned while building styles, to keep in mind before starting:
1. **Changing only a palette gives the same picture again.** If the user says "it always looks the same", a new
   look will not answer it. What makes a picture recognisable is how the subject is constructed (filled shapes or
   lines, thick or thin, flat or lit), how the text arrives, what the set is made of.
2. **A filter over the whole frame gives the same picture, damaged.** Grain, blur, a colour grade or a "sketch"
   effect laid over the finished frame hides the construction without changing it, costs render time, and hurts
   the captions first. A style is built from the parts up, never applied on top.
3. **A style is a set of rules somebody else can follow.** If a scene builder cannot draw a new subject in it from
   a written page, it is one nice frame, not a style.

## The steps
### 1. Collect and name
From the references of phase 0 (or the user's own pictures), write the idea of the style in ONE line that says how
things are built, not how they feel ("everything is light on black: a subject is a wireframe between glowing
nodes" is a construction; "futuristic and clean" is not). Take principles, never a design: no logo, character or
layout of someone else is reproduced.

### 2. One-frame study
Build ONE still frame, as a throwaway composition: one real subject of the kind the user's videos show, one line
of caption with its accent word, the label, the set. No animation yet. Render it at full size and at 35 % scale.
Show it to the user next to a frame of the current look. Stop here if the answer is no: a study costs an hour, a
style costs days.

### 3. Write the rules before the code
A page (`docs/styles/<id>.md` once the user has a style of their own) with:
- the idea in one line;
- what the style rebuilds, part by part (table below);
- the drawing rules for a new subject: how a solid thing is drawn, how a soft or living thing is drawn, what the
  accent colour is reserved for (one thing per shot: if two things carry it, nothing does), what the alarm colour
  is reserved for, how a relation between two things is drawn, how emphasis is shown, how things enter and leave,
  how text sits in a scene and its smallest size (26 px at 1080 wide), where depth comes from;
- the checks to run on a still at 35 % scale.

| Part | Default builder | A style provides |
|---|---|---|
| Set | `src/layers/Background.tsx` | its own set component, with the same reactions (beat, close-up) |
| Captions | `src/layers/Captions.tsx` | its own way for a word to arrive and for the accent word to stand out |
| Opening title | `src/layers/OpeningCard.tsx` | a branch with the same placement and sizing rules |
| Label (HUD) | `src/layers/Hud.tsx` | its own label, progress and badge; counters kept |
| Host | `src/layers/characters/<Name>.tsx` | the same character redrawn in the style: same props, same `FACES` table, same geometry, so acting, voice mouth, gestures and close-up framings work unchanged |
| Subjects | kit parts (`src/kit/`) | a small set of kit parts of its own (its line, its node, its label, its emphasis) and the palette derived from `kit(preset)` |

The builders of a style live in `src/styles/<id>/`, its kit parts in `src/kit/`; the engine picks them when the
resolved look has `"style": "<id>"`. Everything a style does not rebuild keeps its default drawing: list those
parts in the style's page so nobody is surprised by a default desk in a rebuilt world.

### 4. Pilot on one short episode
A pilot of 10 to 15 s, without a voice: two or three scenes, the captions, the label, the host if the style has
one, one cut, one close-up. Render stills first (`python3 tools/stills.py <id>`), then the short video. Measure the
render time per frame: a style with glow or blur can cost several times the default, and an 80 s episode at 1.8 s
a frame is more than an hour on 2 cores. Put the filter on ONE group that holds the whole drawing, never on each
element, and never a CSS `blur()` in a scene.

### 5. Show stills to the user before any production
At least 3 stills: frame 0 with the hook title, a scene in full explanation, the host (or a close-up). The user
may accept the set and refuse the host, or the reverse: a style is adopted part by part. A host redrawn in a style
is the most personal part; keeping the host in the normal drawing inside a rebuilt set is a valid outcome, and so
is a style without close-ups. Record each decision in the style's page.

### 6. First real episode, then measure
The first published episode in a new style is a test of ONE video: it gives a hint, not a verdict. Before it goes
out, write down what it is compared with (the last episodes of the same host, format and hour), which numbers are
read (share of viewers past 3 s, average watch time as a share of the length, saves and shares), what else differs
besides the style (day, length, subject), and the decision rule: inside the usual range = the style is usable like
any look; clearly under on both = one more episode before dropping it; clearly over = make it the default of the
next ones. Change one variable at a time when possible.

### 7. One look per saga
A saga keeps the look and the style of its first part (`series/<slug>/look.json`). A new style starts on a
standalone episode or on a new saga, never in the middle of one.

## Rules that hold in every style
- The layout rules of the engine do not change: draw relative to `box`, nothing to read in its bottom quarter, the
  hero of a scene fills at least 40 % of the box, frame 0 is a complete picture (the opening shows the scene 0.6 s
  "late" so that entrances are over).
- Colours come from the look through `kit(preset)`, widths from `tk.stroke`. No literal in a scene.
- Captions never sit on a bright edge; the label clears the top 12 %.
- Every subject reads as its object without its label.
- A style may break a default motion rule on purpose (for example a dark ground with glow). Say so in its page; the
  rule stays for every other look.
- A style has no sound of its own until one is chosen and measured (`docs/SOUND.md`): it uses the default kit.

## Worked example (method only, nothing of it ships)
A glowing-sketch style was built this way. The one-line idea: everything on screen is light on black; a solid
thing is a wireframe of straight edges between glowing nodes, a soft or living thing is a line of dots, and exactly
one thing per shot is solid amber, the thing the shot is about. From that line came the rules: a curve is a
polyline of 6 to 10 segments; nothing is ever filled, except in the background colour to hide what is behind; a
relation is a line with a node at each end, and a link that does NOT happen is drawn dark, dotted, ending on a
cross; emphasis is rings leaving the thing, never a shake or a stamp; a line is drawn on and a light is switched
on with a flicker, nothing slides or bounces; depth comes from brightness and line weight, not from shadows.
The set became orbit rings and a dotted ground instead of a wall with lights; a caption word switched on instead
of popping; the label became mono capitals in a thin box.
What the steps caught: the one-frame study was liked, so the pilot was built; on the pilot's stills the user kept
the set, the captions and the subjects, and asked for the host in the normal drawing with no close-up; the render
cost was measured at about 1.8 s a frame before any episode was promised; the first episode was published as a
declared test with its comparison set and decision rule written down first.
