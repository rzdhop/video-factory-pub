# Motion toolkit (reference of the video-factory skill)

Read before drawing the first scene of an episode. The video-factory SKILL.md owns the pipeline, the voice and the gates, and its section "Motion design" holds the short version of this file plus the rhythm rules; this file holds the detail. Where they differ, SKILL.md wins.

Sources (check each project's current licence and version before relying on it): LottieFiles `motion-design-skill` (MIT), HyperFrames 0.9.64 by HeyGen (Apache-2.0; its skills ship inside the npm package under `dist/skills/`), GSAP 3.15.1, React Bits, Aceternity UI, vfx-js (`@vfx-js/core` 1.6.0).

## 1. Pick the engine

| Need | Engine |
|---|---|
| Vertical short in video-factory | Remotion, as the video-factory skill says (frame-driven: `useCurrentFrame`, `interpolate`, `spring`) |
| 16:9 explainer, tutorial, course video, anything long (1-20 min) | HyperFrames: HTML + CSS + a paused GSAP timeline, rendered frame by frame in headless Chrome, encoded by FFmpeg |
| A single animated vector asset reused across projects | Lottie (JSON), played by the engine's Lottie adapter |
| Shader look on an element (glitch, pixelate, bloom) | vfx-js only after checking it can be driven by an explicit time (section 5); else a hand-written shader with a `u_time` uniform fed from the timeline |
| An animated page people visit | GSAP or Motion live in the browser; the determinism rules below do not apply |

HyperFrames setup in a fresh session: `npm i -D hyperframes@<pinned> gsap@<pinned>`, `npx hyperframes doctor`, `npx hyperframes init <dir> --skip-skills`. Vendor `gsap.min.js` into `assets/` rather than loading it from a CDN. Read its skill files in `node_modules/hyperframes/dist/skills/hyperframes/` (SKILL.md, references/motion.md, look.md, spec.md, story.md, review.md, types/<kind>.md) before the first scene. Do not run its usage beacon (`hyperframes events`). Static frames are reused, so calm scenes render fast: measure a 20 s sample on your machine before promising a render time.

## 2. Determinism (every rendered video)

A render asks for each frame by time; anything that depends on the wall clock breaks it.

- One paused timeline per scene, registered once it is built (`window.__timelines["<id>"] = tl` in HyperFrames; in Remotion, compute from `frame` or call `tl.seek(frame / fps)` on a paused GSAP timeline).
- Never `Date.now()`, unseeded `Math.random()`, `setTimeout`, `requestAnimationFrame`, `repeat: -1`, network fetches, hover, scroll or IntersectionObserver. Random = a seeded generator.
- `fromTo`, never `from`, inside a scene (a re-seek must land on the same state). Hidden-at-start states go in CSS, not in a `tl.set(..., 0)`.
- Animate transforms, opacity, filter, clip-path; never `left/top/width/height`, never `display/visibility` on a timed clip.
- Typing effects: tween a counter and write `textContent` in `onUpdate` from that counter only.

## 3. Timing numbers (LottieFiles + HyperFrames measurements)

- **One personality per film.** Premium 350-600 ms, `cubic-bezier(0.4,0,0.2,1)`, no overshoot. Corporate 200-400 ms, `(0.2,0,0,1)`, 0-3 %. Playful 150-300 ms, back-out, 10-20 %. Energetic 100-250 ms, expo-out, 15-30 %. A signature ease on about 80 % of moves, three durations (quick, standard, slow).
- **Ease by role.** Arrival: `expo.out` / `power4.out`, long tail. Camera move or colour flood: `power2.inOut`. Exit or zoom-through: `power3.in`. Loop: sine. Linear only for rotation, progress bars, constant speed that is the point. The same `power2.out` 0.5 s on everything is the generated look.
- **Exits** take 40-50 % less time than entrances; an exit is one motion, never slide-stop-leave.
- **Overlap**: the next element starts when the previous is 30-50 % done. Stagger: letters 1 frame, words 60-120 ms, list items 40-80 ms; a whole stagger under 500 ms.
- **Fast moves** 0.3-0.6 s with motion blur peaking at the fastest frame (6-12 px on text, 15-20 px full frame, along the move only).
- **Springs** by damping ratio: 1.0 no bounce, 0.7-0.85 premium, 0.4-0.6 playful, under 0.3 cartoon. Position and scale may bounce; opacity and colour never. GSAP nearest: `back.out(1.4)`, `elastic.out(1, 0.5)`.
- **Distance**: no move crosses more than a third of the screen without a keyframe change; scale duration with distance (100 px ×1.0, 300 px ×1.5, full screen ×1.8-2.0).
- **Elements**: with 3 or more on screen, at most a third move at once. One hero move per shot; secondary moves travel 50-70 % as far, start 100-200 ms later.
- **Reading**: a line holds 0.5 s + 0.3 s per word; the last line at least 2 s; text at least 28 px at 1080 p (2.6 % of the short side).
- **Rhythm**: something new every 2-4 s; hold 0.3-0.75 s before a payoff; with music, cut on the beat (frames per beat = fps × 60 / BPM, computed from the beat index, never accumulated).

## 4. The anti-"AI look" rules (HyperFrames spec, story and motion references)

Left alone every brief lands on the same defaults. Turn every adjective into a number before the first scene: write a `SPEC.md` with GOAL, OUTPUT, TIME, LOOK (hex, faces, sizes, the medium and its numbers), OBJECTS, MOTION (eases by role, durations in frames), SHOTS (one line per shot), BANNED, QA.

**Banned by default** (allowed only when the brand or the user's reference uses it, and only as they use it):
- a black or navy void with small things floating in the middle;
- glow, bloom, neon, lens flares, orbs, decorative particles;
- purple or blue gradients, mesh gradients, glass cards;
- cream paper + serif display + italic accent + mono caps labels + pill chips (the other generated look);
- everything centred; everything fading in at once; every element fading and sliding up;
- text moving while it is read; titles drifting, breathing or scaling after they land;
- corner labels, frame borders, corner brackets, HUD readouts as decoration;
- three cards in a row, KPI grids, a title over a dimmed screenshot, bullet slides, icons in circles;
- the logo docked in a corner; a narrator sentence repeated word for word on screen.

**What replaces them**
- **A look is a medium, not a palette**: risograph, printed manual, blueprint, clay, a terminal as a physical object. Write its parts and what each may carry (ink A for words and structure, ink B for one focus per frame), and make motion come from the medium (ink prints, paper is cut and lifted, a stamp hits).
- **Objects read as what they are**: a server is a rack unit with bays, vents and LEDs, not a rounded rectangle. Things touch the ground or have a mount and a contact shadow.
- **Hero size**: the subject fills at least 40 % of the frame's height or width.
- **Titles land then stay dead still**; vary the entrance through the film (per-word blur 6 px → 0 in 0.13 s, 0.067 s apart; grey-to-ink per word; whole-line blur 8 → 0; slot-machine word roll).
- **Transitions with a cause**, 3-5 kinds per film: zoom through an object, an object becomes the world, morph, whip (0.13-0.3 s), colour flood (0.4 s), iris from a click, dip cut (darken 40 % for 3 frames), blur swap. Hard cuts belong inside a scene; worlds never crossfade into each other.
- **Explainers**: one concrete example travels from the first to the last shot; one diagram that grows one part per spoken phrase; reveal each part when the voice names it, in the back half of the scene; labels sit on the part they name. About 19 spoken words per scene.
- **Video encoding facts**: full-screen gradients on dark grounds band in H.264 (use solid + local light); an accent at 5 % opacity vanishes, use 15-25 % for atmosphere.
- **Review as a harsh motion director**: snapshot the first frame of each scene, every cut (-0.2/+0.2 s) and the phone width; write notes as `t=4.2s · where · problem → change`, rank P0/P1/P2, fix P0 first. Never score out of 10. After a render, add every default you see to the film's BANNED line.

## 5. Component libraries (use their ideas, port the motion)

All of these are built for live web pages: they run on real time, hover, scroll or `requestAnimationFrame`. For a rendered video, read the component's source, keep the drawing and the idea, and drive every value from the timeline time.

- **GSAP 3.15** (free for commercial use, all plugins included since the Webflow acquisition: SplitText, MorphSVG, DrawSVG, MotionPath…; check gsap.com/standard-license before quoting it). npm `gsap`; CDN `https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js`. Register plugins with `gsap.registerPlugin(...)`. SplitText for per-word and per-letter entrances, DrawSVG or `stroke-dashoffset` for ink lines, MorphSVG for shape morphs, MotionPath for arcs. React: `@gsap/react` `useGSAP()`.
- **React Bits** (DavidHDev/react-bits, 215+ components; licence MIT + Commons Clause: free to use in videos and products, not to resell the components themselves). Text animations (Split Text, rotating words, typewriters), backgrounds (Topography, Strands, Gradient ASCII…), Background Studio exports a looping MP4/WebM of a background (usable directly as a video layer). Install one: `npx shadcn@latest add @react-bits/<Name>-TS-TW` or `npx jsrepo@latest add https://reactbits.dev/r/<Name>-TS-TW`. Check each component's imports (GSAP, motion, ogl, three) before porting.
- **Aceternity UI** (ui.aceternity.com; 118+ free components, React + Tailwind + Motion; pro blocks paid). Useful for frames: Background Beams, Background Lines, dotted and grid backgrounds, Spotlight, Tracing Beam, Text Generate Effect, Encrypted Text, Layout Text Flip, Text Flipping Board, 3D Marquee, Globe. Several are glow and gradient effects that section 4 bans: use them only when the look calls for it. Motion-based: replace `animate` props by values computed from the frame.
- **vfx-js** (fand/vfx-js, MIT; `npm i @vfx-js/core`, `@vfx-js/effects`, `@vfx-js/react`): WebGL effects on `<img>`, `<video>`, text — `new VFX().add(el, { shader: "glitch" })`, `PixelateEffect`, `BloomEffect`, custom shaders. Its README does not say it can be driven by an explicit time: before using it in a render, check its source for a time setter; otherwise write the shader with a `u_time` uniform set from the timeline, or use the engine's media treatments. Headless capture here is software WebGL (llvmpipe): keep shader passes few.
- **LottieFiles motion-design-skill** (MIT): `npx skills add LottieFiles/motion-design-skill` adds the full principle set (director, patterns, quality checklist) for agents; the numbers in section 3 come from it.

## 6. Rhythm

The rhythm rules (beat grid, a change every 1-2 beats, a camera event every 2-4 beats, speed contrast, punchline = drop-out + hit + shake + sound, titles letter by letter on sixteenth notes, two camera wrappers, render cost) are in SKILL.md, section "Motion design", "Rhythm".

## 7. Checklist per scene

1. What the viewer must understand in this scene, in one line; the object that shows it.
2. The one hero move and its ease by role; secondaries 50-70 %, 100-200 ms later.
3. Every reveal on the word the voice says; nothing on screen in the first quarter then frozen.
4. Entrance different from the previous scene's; transition caused by something on screen.
5. Nothing banned in section 4; accent on one focus only.
6. `check` (or the project's lint) clean; snapshot frame 0, mid, cut; phone width readable.

## 8. Where this is used

- video-factory shorts: the numbers of section 3 and the bans of section 4 apply to every new Remotion scene.
- video-factory long 16:9 explainers: HyperFrames, 1920 × 1080, one language per video.
- Any other coded film or animated page: the same numbers apply; only the determinism rules of section 2 are specific to rendered video.
