# Setup guide for the video-factory skill

Do this once per machine or per fresh session. The skill (`SKILL.md`) is the method; the engine is a separate repo that you clone and then fill with your own settings.

Replace `<REPO_URL>` below with the address of the video-factory engine repo (the public repo this skill is published with, or your fork of it).

## 1. What you need

| Need | For | Required |
|---|---|---|
| Claude with the Skill feature and agents (Claude Code, or Claude in an agent workspace) | Running the method | yes |
| Node 20 or later, npm | Remotion engine | yes |
| Python 3.10 or later, with numpy | The tools in `tools/` | yes |
| ffmpeg and ffprobe | Audio chain, master, stills | yes |
| Chrome or Chromium | Remotion renders | yes |
| espeak-ng | Reference timing voice | yes |
| `librosa`, `soundfile` (pip) | `tighten_voice.py`, `align_audio.py` | yes, for a real voice |
| `uv` | Installs the listening tool used by the sound check | for the sound check |
| A text-to-speech account (the repo was built with ElevenLabs) | The narration | yes, for a deliverable |
| A scheduling and analytics account (the repo was built with Metricool) | Publishing and numbers | optional |
| A cloud drive | Hosting the master so the scheduler can fetch it | optional |

A video can be produced with none of the optional rows: you then post the file yourself and feed `tools/stats.py` by hand.

## 2. Install the engine

```bash
git clone <REPO_URL> ~/video-factory
cd ~/video-factory
npm install
pip install numpy librosa soundfile        # add --break-system-packages where your system asks for it
sudo apt-get install -y espeak-ng ffmpeg   # macOS: brew install espeak-ng ffmpeg
bash tools/setup_sound.sh                  # listening tool and its models, about 1 GB
```

Then check two machine settings in `remotion.config.ts`:
- `Config.setBrowserExecutable(...)`: the path of your Chrome or Chromium.
- `Config.setConcurrency(...)`: never more than your number of cores.

Verify the install:

```bash
python3 tools/formats.py        # lists the formats
python3 tools/looks.py          # lists the looks
bash tools/selftest.sh          # engine self-test
```

## 3. Install the skill

Copy the `video-factory` folder (with `SKILL.md`, `SETUP.md` and `references/`) into your skills folder, or add it as a skill in your Claude app where your plan allows it. In Claude Code:

```bash
mkdir -p ~/.claude/skills && cp -r video-factory ~/.claude/skills/
```

The repo also carries its own working method (`CLAUDE.md`) and agent briefs (`.claude/agents/`): Claude reads them when it works inside the repo.

## 4. Fill in your settings

Everything personal lives in your copy of the repo, never in the skill. Fill these before the first episode:

| File | What to write |
|---|---|
| `brands/brands.json` | One entry per brand: label, status (`active` or `pending`), your Instagram and TikTok handles, the brand id of your scheduling tool, your time zone, `weekly_target` (videos per week, or `null`), and the connector account names if you use several accounts |
| `voices/catalog.json` | Your voices: provider, voice id, model, what each is for, and its status (heard or not) |
| `characters/voices.json` | Which voice each host character uses |
| `characters/` | Your host characters (`characters/README.md` explains how to add one). Draw a real person only with their agreement |
| `docs/CONNECTORS.md` | Which connector and which account is used for voice, scheduling and file hosting. If one app has several accounts connected, name the one this project uses and the ones it must never touch |
| `docs/PUBLISH.md` | Where your masters are stored (folder id or path) and the calendar table of your posts |
| `ideas/backlog.md` | Your subjects, per character |
| `brands/shelves.json` | The shelves (label, colour, hashtag) your episodes are sorted on, if you use them |

Keep secrets out of the repo: no API key, token or password goes in any of these files. Connectors hold the credentials; the repo only holds names and ids.

If you fork the public repo and want to keep your settings private, make your fork private or keep these files out of git.

## 5. Connect the services (optional)

Claude reaches outside services through connectors (MCP). Any route works as long as `docs/CONNECTORS.md` says which one you use:
- **Voice**: a text-to-speech connector. The skill reads the credits left and announces the cost before every generation.
- **Scheduling and numbers**: a Metricool connector covers Instagram Reels and TikTok. Connect each network inside Metricool yourself first; a brand's id and handles are then checked against `brands/brands.json` before every scheduling.
- **File hosting**: a drive connector, so the master can be shared by link with the scheduler.
- A connector hub that holds several accounts per app works too: every call must then name its account.

Some download hosts may be blocked by your workspace's network settings (for example the file host of your voice provider or of a sound library). When a download is refused, allow that host in your settings; the skill reports the host and does not route around it.

## 6. First run

Ask for a video in your own words, for example: "Make me a 40-second video on why wombats produce cube-shaped droppings." Claude then:
1. picks or asks the format, and researches references;
2. shows you 3 briefs, each with its hook sentence and first image: you pick one;
3. writes and checks the script, then tells you the voice cost before spending anything;
4. builds the scenes, renders, and sends you the video with the sound measurements;
5. proposes a slot and a caption, and schedules only on your yes.

Your stops are: the brief, the script (skipped in express mode), the voice cost, the finished video, and the yes before publishing.

## 7. Optional: a daily numbers run

If your Claude plan has scheduled tasks, a daily task can read the numbers of each active brand, link new posts to their episode, record one snapshot per video with `tools/stats.py`, rebuild `stats/catalog.json` and push `stats/`. Write its prompt with your own account names and brand ids, and state in it that it must never schedule, publish, edit or delete a post.

## 8. Long 16:9 explainers (optional)

The long format uses HyperFrames instead of Remotion:

```bash
npm i -D hyperframes@0.9.64 gsap@3.15.1
npx hyperframes doctor
npx hyperframes init <dir> --skip-skills
```

Copy `gsap.min.js` into the project's `assets/` rather than loading it from a CDN. Check each tool's current licence before commercial use.

## 9. Costs and limits to know

- Voice: about one credit per character of narration on most plans; free plans usually exclude commercial use. Check your provider's terms.
- Scheduling tools limit brands and posts per month on free plans, and may return fewer statistics for a personal TikTok account than for a business one.
- Render time depends on your cores and on blur and glow in the scenes: a 60-second short takes about 10 minutes on 2 cores, more for heavy scenes.
- Sounds taken from public libraries keep their licence: attribution sounds owe a credit line in the caption (`python3 tools/sound_lib.py credits episodes/<id>`).
- Declaring synthetic voice or generated content on a post follows each platform's rules and is your decision.
