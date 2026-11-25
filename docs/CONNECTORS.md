# Connectors: which account serves which service

This file is a template. The table below is the user's: fill it in the first session that uses an outside service, and read the accounts again at the start of every session (ids and aliases can change).

The factory needs at most three outside services:

| Service | Used for | Built and tested with |
|---|---|---|
| Voice | the narration, and the transcript used to align it | ElevenLabs |
| Scheduling and analytics | posting to Instagram and TikTok, reading the numbers | Metricool |
| File hosting | storing the masters and covers, giving the scheduler a link to fetch | a cloud drive (Google Drive) |

Instagram and TikTok are not connected directly and do not need to be: everything is posted and measured through the scheduler. Another voice service, scheduler or drive works as long as it offers the same steps; adapt the tool names below.

A session reaches these services through the connectors it has: one direct connector per service, or a connector hub that holds several apps and several accounts per app (Composio is one example of such a hub). With both present, pick one as the source of truth and write it here; the other is a fallback, never a second source.

## Accounts (fill this table)
| Service | Connector or hub toolkit | Account id or alias | Used for |
|---|---|---|---|
| *(example row, replace it)* scheduler | `<toolkit name>` | `<account id of the brand my-brand>` | scheduling and numbers of the brand `my-brand` |
| | | | |

One row per account. When an app has several accounts (two drives, one scheduler connection per brand), write every one of them and say which ones the factory must never use. The scheduler connection and the drive of a brand are also written on the brand in `brands/brands.json` (`connectors.scheduler`, `connectors.storage`; `null` = not connected), so a tool or an agent can find them from the episode.

## Rules
- **Always name the account.** With several accounts behind one app, the default account is not a safe choice: a call without the account reads or posts on whichever one the hub considers default. Pass the account id (or its alias) in every call.
- **Scheduler: the account of the episode's brand** (`python3 tools/brands.py of <episode_id>`, then `connectors.scheduler` of that brand in `brands/brands.json`). The check of `docs/PUBLISH.md` stays: the id and both handles of the brand must match what the scheduler returns before scheduling.
- **Drive: one drive for the factory.** Check the owner of the masters folder before the first upload of a session. Files of the factory never go to a work or shared drive that happens to be connected, and nothing from those comes here.
- **Credits before a voice.** Read the subscription of the voice service first and tell the user when the credits left do not cover the narration plus the transcript.
- **Live data comes from a live call.** The account summary a hub returns with a connection (user info, credits, quotas) can be a cached snapshot, hours or days old. Credits, scheduled posts, drive files: run the tool itself with the account named and use only that answer.
- **Never add or remove a connection unasked.** Adding one creates a login link the user has to open.
- An agent makes a voice, a transcript, an upload or a scheduling call only on the main session's written order (account, voice and cost; brand id, slot, caption, file ids), never on its own initiative (`CLAUDE.md`, "Parallel work rules").

## Calling a hub with several accounts (example: Composio)
1. Search the tools for the use case (the hub's tool search): it returns the tool slugs, their schemas and a session id to pass on.
2. List the accounts of a toolkit (the hub's connection manager, action `list`): id, alias, owner. This is the list to copy into the table above.
3. Execute (the hub's execute tool) with the slug, the arguments and **always the account**.
4. An API call no tool covers goes through the hub's proxy call. It uses the toolkit's DEFAULT account: confirm with the list which account that is before using it.

Other hubs and direct connectors follow the same order: find the tool, read the accounts, call with the account named.

## Uploading a master (more than 5 MB) to the drive
A simple upload tool often stops at a few megabytes (5 MB for the Google Drive upload tool of the example hub), and an upload from a URL needs a public link the session does not have. A master is 30 to 60 MB. What works, with the bytes going straight from the session to the drive, is a resumable upload:
1. Open the upload session with an authenticated call (the hub's proxy call, toolkit of the drive): `POST`
   `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,parents,webViewLink`,
   body `{"name": "<id>.master.mp4", "parents": ["<masters folder id>"], "mimeType": "video/mp4"}`, headers
   `X-Upload-Content-Type: video/mp4` and `X-Upload-Content-Length: <bytes>`. The `location` header of the answer is the upload session.
2. `bash tools/drive_put.sh out/<id>.master.mp4 '<location>'` sends the file and prints the drive id and link.

The proxy call uses the default drive account: confirm that it is the factory's drive, otherwise the file lands in another one. To let the scheduler fetch the file, share that ONE file by link (reader); never the folder.

## Voice service: files and links
- A text-to-speech call usually returns a temporary file link (valid about one hour with ElevenLabs through a hub): download the take at once, and pass the same link to the transcription call before it expires.
- A large transcript may not be returned inline but saved on the hub's side: export it from there and download it.
- A transcription is not free: count it in the credit line said to the user (about a third of the cost of the voice it transcribes).

## Scheduled tasks
A scheduled task carries its own list of connectors, fixed when it is created. After a change of connectors, a task created earlier does not have the new ones: create it again and disable the old one (keep it for its history). Each brand is read in its own `timezone` (`brands/brands.json`).
