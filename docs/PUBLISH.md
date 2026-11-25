# Publishing

This file is a template: the procedures are fixed, the tables are the user's. Everything is published through a scheduler (built with Metricool), from a Claude session, and only on the user's yes. `docs/CONNECTORS.md` says which account to name for each call and how a master over 5 MB is sent to the drive.

## Accounts
- The brands (scheduler brand id, Instagram and TikTok handles, state, time zone, weekly target) live in `brands/brands.json`; `python3 tools/brands.py` lists them and `python3 tools/brands.py of <episode_id>` gives the brand of an episode. A fresh repo holds one example brand, `my-brand`, with empty values and the status `pending`: nothing can be scheduled until the user has filled it (`scheduler_brand_id`, `instagram`, `tiktok`, `timezone`, `connectors`) and set it to `active`.
- Scheduler plan: a free plan is limited (with Metricool at the time of writing: 1 brand, 20 posts a month, 30 days of analytics). A second brand needs a paid plan. Check the plan before promising a rhythm, and count the posts already used in the month.
- **Brand check before every scheduling**: call `getBrandSettings` and compare the brand id and both handles with the registry, and check that the brand's status is `active`. A network can be linked to the wrong account inside the scheduler, and with several brands a wrong id posts on the wrong account. Any difference, or a placeholder: stop and tell the user.

## Where the videos live
One folder of the user's drive, written here once it exists:

| Folder | Drive id |
|---|---|
| *(example row, replace it)* `video-factory/masters` | `<folder id>` |

One file per episode, named `<episode_id>.master.mp4` (plus `<episode_id>.cover.jpg` when a cover is used). Check that the connected drive is the right one before uploading.

## Steps (only when the user asks to publish)
Who does what: the main session decides and holds the user's yes; an agent may do the upload, the scheduling call and the bookkeeping, on a written order that carries the exact brand id, connector account, slot, caption and drive file ids. The agent reports the post id; the main session verifies by reading (`getScheduledPosts`).
1. Upload `out/<episode_id>.master.mp4` to the masters folder.
2. Share that one file with "anyone with the link" (reader), so the scheduler can fetch it. Share the file, never the folder. Metricool accepts such a link (`https://drive.google.com/file/d/<id>/view?usp=sharing`) even when the drive is not linked in its account: it copies the file to its own storage at scheduling time, so the share can be removed once the post is out.
3. `createScheduledPost` on the episode's brand for Instagram (type `REEL`) and TikTok, one post for both networks at the same slot, with the drive link as media, the caption from the hook and the closing question, 3 to 5 hashtags, all in the language of the video (`python3 tools/lang.py episodes/<id>`). Add the sound credits when owed (`docs/SOUND.md`).
   The slot: ask the user, or propose one from the study of `CLAUDE.md` ("Express mode": `getBestTimeToPostByNetwork`, the brand's own best hours, no other post within 20 h). It is at least 3 h ahead, so plan the day backwards from the brand's best hour: a master that must go out at 18:00 is ready by 15:00. A late master takes the next slot that fits; a shorter delay only on the user's explicit order.
4. Tell the user what was scheduled and for when; `getScheduledPosts` shows the calendar.
5. **Bookkeeping, in the same turn as the scheduling**: write the slot in the calendar table below, run `python3 tools/catalog.py build` and `python3 tools/studio_export.py`, commit and push `stats/`, and update the dashboard if the user has one (see "Dashboard"). The scheduling is not done until the books know the episode; say it in the same line as the confirmation. The same update is due after every `catalog.py link` and every new snapshot of numbers.
6. As soon as the post is out: `python3 tools/catalog.py link <id> --instagram URL --tiktok URL`, then `catalog.py build`.
7. **Numbers at about 24 h and 7 days after the slot**: read them with `getAnalyticsDataByMetrics` and record them with `python3 tools/stats.py add <id> --platform <instagram|tiktok> --views N --avg S --full PCT --drop S --likes N --comments N --shares N --saves N --length S --hours H`.

## Metric codes (Metricool)
| Network | Code | What it is |
|---|---|---|
| Instagram Reels | `IGRE23` | views |
| Instagram Reels | `IGRE24` | average watch time |
| Instagram Reels | `IGRE28` | share of viewers past 3 s |
| Instagram Reels | `IGRE30` | skip rate in the first 3 s |
| Instagram Reels | `IGRE02` | publication time (UTC) |
| TikTok videos | `TKPO07` | views |
| TikTok videos | `TKPO15` | average time watched |
| TikTok videos | `TKPO13` | full video watched rate |
| TikTok videos | `TKPO02` | publication time (UTC) |

What to know when reading them:
- Instagram gives everything per Reel: views, reach, average watch time, share past 3 s, skip rate.
- **A personal TikTok account returns only views, likes, comments, shares and length.** Watch time, full-watch rate and the second where viewers leave are returned for business accounts only. For a personal account, ask the user for a screenshot of the video's Analytics screen about 24 h after the slot; ask for it yourself, without waiting to be reminded.
- The second where most viewers leave is not returned by the scheduler on either network: it comes from the app's own analytics screen.
- The scheduler refreshes analytics about once a night; after a first connection the posts can take 12 to 15 h to show.
- Publication times in analytics are UTC, the planner is in the brand's time zone: convert before comparing.
- `getScheduledPosts` also returns posts already out, with `providers[].status = "PUBLISHED"` and `publicUrl`: count only the others as scheduled.
- A post scheduled inside the Instagram or TikTok app is not visible from the scheduler: write it in the calendar table by hand when the user says so.
- With two languages on one account, compare on rates (share past 3 s, average watch time, full views), not on raw views.

## Covers and sorting (`docs/SHELVES.md`)
- `python3 tools/cover.py <id>` writes `out/<id>.cover.jpg` (opening frame + shelf band) and its 3:4 grid crop. Upload the cover to the masters folder as `<id>.cover.jpg`, share that file by link, and pass it as `videoThumbnailUrl` in the post. Instagram takes it. TikTok ignores it on a personal account: the user sets the cover in the TikTok app (the video's menu › cover), from the same file.
- Covers of posts already out cannot be changed through the scheduler: the user changes them in each app (Instagram: the Reel's menu › Edit › Cover; TikTok: the video's menu › cover).
- The caption of a saga part starts with the shelf tag; `python3 tools/shelf.py <id>` prints it.
- Pinned on each profile: the first part of the running saga. TikTok: one playlist per saga when the account has the feature. Instagram: one highlight per shelf is possible.

## Calendar (update at each scheduling)
| Episode | Instagram | TikTok |
|---|---|---|
| *(example row, replace it)* `<episode_id>` | scheduled, `<date and hour in the brand's time zone>`, post `<post id>`, master and cover shared by link | same post, same time |

Once a post is out, replace "scheduled" by "published" and keep its link in the catalog (`catalog.py link`), not here.

## Adding a brand
1. The user creates the brand in the scheduler (on a plan that allows it) and connects its Instagram and TikTok accounts there; they must be logged in to each of them once, and nobody else can do this step.
2. `getBrandSettings` now returns the new brand: copy its id (`scheduler_brand_id`), both handles and its time zone into `brands/brands.json`, status `active`. Write its connector accounts in its `connectors` block and in `docs/CONNECTORS.md`.
3. Give it its content rules in the registry (`content`), its `weekly_target`, its `lang` when it has a default language, and for a saga a `series/<slug>/brand.json` `{"brand": "<id>"}`.
4. Give it its shelves (`brands/shelves.json`), and usually its own look, host and voice.
5. A hub connection usually holds one scheduler brand: a second brand needs its own connection, and every query of a dashboard or a scheduled task must name it.

## Dashboard (optional)
The repo keeps the long-term record; a dashboard only shows it. Three files are written for one:
- `stats/catalog.json`: which episode, character, format, saga, brand and language is behind each post. Built by `python3 tools/catalog.py build`.
- `stats/videos.json`: the snapshots of numbers recorded by `tools/stats.py add`, for the curve of each video.
- `stats/studio.json`: the formats, looks, backlog and sagas, written by `python3 tools/studio_export.py`, for a "new video" assistant that turns choices (character, format, look, subject, language) into a full prompt. A finished saga (`series.total` reached) is exported as done and is no longer offered as a subject.

A dashboard page (a private artifact, a spreadsheet, any page that reads JSON) can combine these files with live calls to the scheduler for what is scheduled and for the numbers of every published video, per brand and network. Rules when the user has one:
- Upload the three files again after a new link, a new episode, new snapshots, or a change of formats, looks or backlog. A post the catalog does not know shows as unlinked and its curve stops.
- The dashboard keeps no history of its own and has the limits of the scheduler (nightly refresh, days of analytics of the plan, no TikTok watch time on a personal account).
- Match a published post of the planner with its analytics row by post id (last path segment of the public link, query string removed), and draw it once.
- Its link stays private to the user and is never written in the repo.

## AI label
The voice of a video made here is synthetic. The schedulers expose a flag for it (`isAiGenerated` / `isAigc` in the post data of Metricool). Whether to declare it is the user's decision: ask once, write the answer in the brand's `notes`, and apply it to every post of the brand.
