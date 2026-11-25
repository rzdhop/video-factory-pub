# Language: one language per video

The engine ships with two languages, French (`fr`) and English (`en`). The user chooses the language of each video,
and the choice holds everywhere. One video = one language (no double version of the same episode). Talking to the
user stays in the user's own language whatever the video's language.

## Where the language is set
`python3 tools/lang.py <episode_dir>` says which language an episode is in and why. First match wins:
1. `plan.json` `"lang": "fr" | "en"`, written by `tools/new_episode.py --lang en` in every new plan.
2. `series/<slug>/lang.json` `{"lang": "en"}`: a saga speaks ONE language, stored by its first part.
   `new_episode.py` and `lint_plan.py` refuse a part in another language; the version of a saga in another language
   is another saga, with its own slug and bible.
3. `brands/brands.json` `"lang"` on a brand: the default language of an account.
4. The default of `tools/lang.py` (`DEFAULT`, French as shipped).

## When it is chosen
At the brief. The three briefs are written in the language of the video (the hook IS the brief). When that is not
the user's own language, add one line under each hook in the user's language, so they judge the idea and not their
reading of the slang. If the request does not say the language, the default applies (saga, brand, else the engine
default); say it in the brief message in a few words.

## What follows the language
| Step | French | English | Where |
|---|---|---|---|
| Script, captions, hook card, HUD labels, text drawn in scenes | French | English | `script.md`, `plan.json`, scene files |
| Script headings | `## Vérification des faits` | `## Fact check` | `new_episode.py`, `lint_plan.py` (both accepted) |
| Reference timing voice | espeak `fr` | espeak `en-us` | `build_episode.py` (from `lang`, so the alignment of the real take does not drift) |
| Real voice | the voice of `tools/voice.py` | same voice, `status_en` in the catalog | `tools/voice.py`, `voices/catalog.json` |
| Greeting and swear lists, speech rate | French lists | English lists | `tools/lang.py`, used by `lint_plan.py` |
| Counted words of a block (max 4) | words of 3 letters or more | same, minus "the" and "and" | `tools/lang.py` |
| Acting guesses of undirected blocks | French word lists | English word lists | `tools/direct.py` |
| Numbers | `2 500` and `3,5` | `2,500` and `3.5` | `fmtNum(n, decimals, tk.lang)`, HUD counters |
| Series badge | `PARTIE 2/5` | `PART 2/5` | `src/layers/Hud.tsx` |
| Caption, hashtags, credits line | French | English | `docs/PUBLISH.md` |
| Catalog | `lang: fr` | `lang: en` | `tools/catalog.py` (column `lang` of `stats/catalog.json`) |
| Ideas | hook drafted in French | hook drafted in English | `ideas/backlog.md` |

`lint_plan.py` also reads the narration: when its function words belong to the other language than the one
declared, it is an ERROR (the reference voice, the word lists and the number format would all be wrong).

## Scenes
- Every word a scene draws is in the language of the episode. A scene written for an episode in one language is not
  reused as it is in another (its labels are in the wrong language): redraw or pass the text as a prop.
- Numbers: `fmtNum(value, decimals, tk.lang)` from `src/kit/anim.ts` (the kit parts that print numbers already do
  it). Never `toLocaleString` with a literal locale in a scene.
- `b("word")` beats point to words of the narration, so they are in the language of the script.
- Units and conventions follow the audience: an English video says miles, pounds or Fahrenheit only when the
  source does; otherwise keep the metric value (the facts stay the sourced ones, not a conversion from memory).
- What a screen shows differs per language of the system: a command output or a menu shown to a French audience is
  checked in its French form, not translated from the English documentation.

## Voice
- One voice can speak both languages. `tools/voice.py <episode_dir>` prints the language and warns while the voice
  has not been validated in that language: the first take of a voice in a new language is sent to the user before
  the render, then its status for that language (`status_en`) is set to validated in `voices/catalog.json`.
- If a voice does not work in one language (accent the user dislikes, mispronounced names), split that one
  reference per language instead of changing the rule: `characters/voices.json` `"<character>": {"fr": "<id>", "en": "<id>"}`,
  `series/<slug>/voice.json`, `plan.json` `tts`, or a `voice_en` block in a format json. Never without asking.
- The narration prompt is written in the language of the video; pass the language code (`fr` / `en`) to the
  speech tool when it takes one. Acronyms are written in the voice prompt the way that language reads them, and the
  take is checked.
- A stored intro or signature of a host is in one language: an episode in another language does not reuse it; the
  signature is generated with the narration (same take, same voice).
- The speech rate used to estimate a length (`words_per_second` in `tools/lang.py`, 3.2 by default) depends on the
  voice and the language. Measure it on the first real take of a voice in a language (words / seconds after
  `tighten_voice.py`) and set it.

## Writing in a second language
The rules of `docs/RETENTION.md` and of the format sheet apply unchanged; only the language changes.
- Write the language first, never a translation of a script in another one: a translated joke keeps the rhythm of
  the original and dies. Same facts, same plot idea, new sentences. Spoken register, contractions, short words.
- The hook is still a spoken question of at most 9 words that the video answers ("Why are bananas slightly
  radioactive?"). The ending is still a binary question.
- Humour formats: same policy in every language (one joke per sentence, vulgarity at the level of the format, on
  the punch), with the swearing of that language: see `formats/humour-host.md`. The hard limit is the same in every
  language: no insult about sexual orientation, skin colour or origin.
- Serious and tech formats: the "how the narration talks" rule holds (complete sentences with the why, one
  everyday image per new term, no teaser questions, no slogan rhythm). Keep the standard technical terms of the
  language; do not translate screenshots or commands that differ per language of the system.
- Fact-check sources can be in any language; the claim is checked in the language it will be said in (a name,
  a unit or a quote can differ between two language versions of a source).
- `script-critic` reads a script as a native listener would: it flags the syntax of another language under the
  words, false friends and idioms that do not exist.

## Publishing and measuring
- Caption, closing question and hashtags in the language of the video; sound credits lines stay as printed.
- Brand: `python3 tools/brands.py of <episode_id>` as always. When a language has its own account, give that brand
  `"lang"` and set `brand` on the saga or the episode. Before scheduling the FIRST video in a new language, ask the
  user once which account it goes to.
- The best-time study counts the brand's own videos of the same language first when there are enough of them
  (the audience of another language may not be awake at the same hours); say which data the slot comes from.
- `stats/catalog.json` carries `lang` for each episode, so the scoreboard can be read per language.
- Compare videos of two languages on rates (share past 3 s, average watch time, full views), not on raw views,
  while both languages share one account.

## Adding a language
One entry in `LANGS` of `tools/lang.py` (espeak voice, number format, headings, word lists), the `Lang` type in
`src/types.ts`, the branches of `fmtNum` / `partWord` in `src/kit/anim.ts`, the skeleton tables of
`tools/new_episode.py`, a status key per voice in the catalog, and the swear and greeting lists of the humour sheets.
