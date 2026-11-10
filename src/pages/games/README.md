# Games

The games hub at `/games` (linked from the main menu as **Games**). Every game is one entry in
[registry.ts](registry.ts); the hub ([GamesPage.tsx](GamesPage.tsx)) draws its cards from that list and gives each
live game its own address, so adding a game never touches the page layout, the router in `src/App.tsx` or the menu.

## How a game registers itself

1. **Make the game's page** in its own folder here, e.g. `src/pages/games/wordle/WordleGame.tsx`, with a default
   export (a React component, no props). It is drawn inside the site's normal header and footer.
2. **Find its entry in [registry.ts](registry.ts)** (the fourteen approved games are already there as
   `status: "coming-soon"`), or add a new one, and make it live:

   ```ts
   {
     slug: "wordle", status: "live", load: () => import("./wordle/WordleGame"),
     title: "Bible Wordle",
     description: "A daily word puzzle with a Bible word, and a score to share.",
     audiences: ["solo", "family"],
     shelf: "daily", art: GAME_ART.wordle,
   },
   ```

That is all. The game is now playable at `/games/<slug>`, its card says **Play** and links there, and the hub's
counts (games, ready to play, coming soon, for groups) update by themselves. Every entry already has its `shelf` and
`art` line; when making a game live, change only the `status` and add `load`, and leave that line as it is.

## The fields

| Field | What it is |
|---|---|
| `slug` | The address under `/games`: lower case, words joined by hyphens. Unique. |
| `status` | `"coming-soon"`: a quiet card with no link; its address returns to the hub. `"live"`: a card that links to the game. |
| `load` | Live games only (TypeScript refuses a live game without it): imports the game's page file, so it loads only when opened. |
| `title` | The card's heading. |
| `description` | One line, at most 140 characters, shown on the card. |
| `audiences` | Who it is for, one or more of `"solo"`, `"family"`, `"youth-group"`, `"church-night"` (shown as Solo, Family, Youth group, Church night). |
| `shelf` | Which of the hub's four shelves it sits on: `"daily"` (Daily puzzles), `"family"` (Family and party), `"groups"` (Youth group and church night) or `"solo"` (Solo). Titles and one-line descriptions: `SHELVES` in [registry.ts](registry.ts). |
| `art` | Its picture: `GAME_ART.<name>` from [art/index.ts](art/index.ts) (see below). |

The hub shows the shelves in that order, and on each shelf the live games first, then the rest, each group in the
order of the list. A shelf with no games is left out.

`shelf` and `art` are optional in the type, so a half-finished edit can never break the build: without a shelf a game
goes on its first audience's shelf, and without art it shows a bare arched window. The tests, though, require both on
every entry, so a game is not finished until it has them.

## A game's picture

Every game has its own drawing, and all of them share one style made for this site
([design](../../../docs/features/games-hub/design.md)): a 240 × 160 SVG line engraving standing in front of the same
arched window, drawn in the game's book colour. No photos, stock images or copied art: the drawings are hand-built SVG,
so they cost nothing to host, stay sharp at any size and follow the light and dark themes. They live in [art/](art/):

| File | What is in it |
|---|---|
| [draw.ts](art/draw.ts) | The `GameArt` type and the sums: `hatch` (engraved shading), `shadow` (the lines under something on the ground), `spark`, `at` (a moving part's turn). |
| [parts.tsx](art/parts.tsx) | The shared drawn parts: `P` (a stroke), `T` (letters), the arched `Backdrop`, and `GameArtImage`, which the hub uses. |
| `scenes-*.tsx` | The drawings, one file per shelf. |
| [index.ts](art/index.ts) | `GAME_ART`: each game's drawing, its colour and its description for screen readers. |
| [game-art.css](art/game-art.css) | The stroke and fill classes and the slow living details. |
| [HeroArt.tsx](art/HeroArt.tsx) | The hub's hero drawing, the games table. |

To draw a new game's picture:

1. **Draw the scene** as a component in the scenes file for its shelf. Draw inside 240 × 160, with the ground at
   y = 150 and the main subject in front of the arch (x 50–190). Use the classes, never colours: `ga-l` for main lines
   (the game's colour), `ga-i` for ink details, `ga-f` for fine lines, `ga-h` for hatching (add `ga-sm-hide` to hatching
   so phones drop it), and `ga-t` (tint), `ga-s` (solid) or `ga-p` (paper, to cover what is behind) for fills.
   Combine them, e.g. `c="ga-p ga-l"`. Make it detailed rather than thin, with shading and one or two tinted planes.
2. **Give it one living detail** that loops slowly: put a class from [game-art.css](art/game-art.css) on that part
   (`ga-bob`, `ga-turn`, `ga-flip`, `ga-drop` with `ga-ring`, `ga-pulse`, `ga-pop`, `ga-lift`, `ga-twinkle`, `ga-sweep`,
   `ga-tip`, …), with `style={at(i)}` to stagger several parts, or `at(0, "150px 66px")` to turn about a point. Move
   only position, size, turn or opacity. Never use an SVG `id` (pattern, clip or gradient): the page holds sixteen
   drawings, and ids clash.
3. **Add it to `GAME_ART`** in [index.ts](art/index.ts) with its colour (`tone`: one of `history`, `poetry`,
   `prophets`, `gospels`, `acts`, `epistles`, `revelation`; pick one its shelf neighbours do not use) and a short `alt`
   saying what the picture shows, not the game's title.
4. **Point the entry at it** in [registry.ts](registry.ts): `shelf: "…", art: GAME_ART.<name>,`.

## Checks

[games.test.tsx](games.test.tsx) (part of `npm test`) checks every entry: unique, address-safe slugs, a one-line
description, at least one audience, its own picture (with a colour and a description) and a shelf; that the hub shows
one card per game with links only on live ones, on the right shelves in the right order; and that every picture is
named for screen readers. Its counts come from the registry, so making a game live needs no test change.

## The live game today

`quiz` ([quiz/QuizGame.tsx](quiz/QuizGame.tsx)) is the homepage's twelve-question quiz (`src/pages/home/HomeQuiz.tsx`),
unchanged, on its own page with a link back to the hub. The homepage itself is untouched.

## Map quest

`map-quest` ([map-quest/MapQuestGame.tsx](map-quest/MapQuestGame.tsx); design:
[docs/features/map-quest/design.md](../../../docs/features/map-quest/design.md)) names a Bible place and the player drops a
pin on a blank map; the closer the pin, the more points. Practice by level and era, a Daily Five shared by everyone on a
date (saved in the browser under `bp-map-quest`), and a Disputed sites mode. All screens live on the one page;
`?play=daily|practice|disputed` reopens a mode.

- **Data:** `src/data/map-quest/` — `places.json`, `disputed.json` and `daily.json` are generated by
  `py -3.12 scripts/build-map-quest.py` (which calls `scripts/build-map-quest-daily.ts`) from OpenBible's places and the
  hand-kept `curation.json`. Run it by hand after changing curation; it never changes a past or current daily puzzle.
- **Daily epoch:** puzzle #1 is `2026-11-07` (the build date). To start the numbering on the real launch day instead,
  delete `daily.json` and run the script with `--epoch YYYY-MM-DD` before the first release; after launch, never.
- **Map:** the atlas's own map file and MapLibre, drawn blank (`quest-style.ts`); no new service or cost.
- **Known gaps:** place names, era names and the disputed-site notes are English in every language (the translation
  collector does not read `src/data/map-quest/`); the disputed-site notes are drafts awaiting the owner's review.
- **Checks:** the `*.test.ts(x)` files beside the code run in `npm test`; `npm run test:data` adds the Python filter tests.

## Bible Wordle

`wordle` ([wordle/WordleGame.tsx](wordle/WordleGame.tsx); design:
[docs/features/bible-wordle/design.md](../../../docs/features/bible-wordle/design.md)) is classic Wordle with a Bible word:
six tries at one five-letter word, the same for everyone on a local calendar date. When the game ends the result card
shows the BSB verse the word comes from (the word marked), a link to read it in context and, for a person, a link to
their page. The share text is the emoji grid only. The record is kept in the browser under `bp-wordle`. Hard mode,
high-contrast colours and an optional category hint after three guesses are in the page.

- **Data:** `src/data/wordle/` — `answers.json`, `daily.json` and `guesses.json` are generated by
  `node --experimental-strip-types scripts/build-wordle.ts` from the hand-kept `curation.json` (answers with category,
  difficulty tier and, for names, the verse; the block list; American-only spellings; date pins), the four Bibles, the
  cross-references, the people files and the ENABLE word list in the raw sources folder (`../sources/enable/`). Run it by hand after changing the
  curation; it never changes a puzzle up to 14 days ahead. The game page never loads `curation.json`.
- **Daily epoch:** puzzle #1 is `2026-11-07` (the build date). To start the numbering on the real launch day instead,
  delete `daily.json` and run the script with `--epoch YYYY-MM-DD` before the first release; after launch, never. Past
  the end of the file (about three years) the browser carries on with the same rules (`daily-rules.ts`, shared with
  the build script).
- **Known gaps:** the words themselves are English in every language (the help panel says so on a translated site).
  People without a readable address in `src/data/people-slugs.json` link to `/people/<record id>`.
- **Checks:** the `*.test.ts(x)` files in `wordle/` run in `npm test`, including every answer's verse against the BSB,
  every schedule rule, the frozen first days and puzzle numbers across daylight-saving changes in three time zones.

## Timeline sort

`timeline` ([timeline/TimelineGame.tsx](timeline/TimelineGame.tsx); design:
[docs/features/timeline-sort/design.md](../../../docs/features/timeline-sort/design.md)) deals four to seven Bible events
in a jumbled column; the player drags them into order, earliest at the top, and presses Check. A set is only dealt when
its order is certain: every event has a window of years wide enough for every dating system the site uses, and verses
fix the order of close events; pairs whose order is disputed (Ezra and Nehemiah, Daniel's den and Cyrus's decree, Ruth
and any judge) are never dealt together. **Daily**: six events, the same for everyone on a local date, four tries with
right-place ticks and "belong together" links, a spoiler-free share. **Practice**: Easy (4), Medium (5) or Hard (7), one
try, scored by pairs in order with stars, optionally one era. The reveal shows the true order with each date range, the
BSB verse and the reason each card follows the one before. Saved in the browser under `bp-timeline`;
`?play=daily|practice` reopens a mode.

- **Data:** `src/data/timeline/` — `timeline.json` and `daily.json` are generated by
  `node --experimental-strip-types scripts/build-timeline.ts` from the hand-kept `events.source.json`,
  `facts.source.json` and `contested.source.json`, the Who's older? birth windows, the people-pages' reign dates and the
  BSB text. It fails on any contradiction (a loop, a window narrower than its anchor, a fact that settles a contested
  pair) and writes the owner's [review sheet](../../../docs/features/timeline-sort/review-sheet.md). Run it by hand
  after changing a source file; it never changes a Daily puzzle up to 14 days ahead (`--freeze-days`). Put a new build
  live within 14 days or build again. An event removed after launch is marked `"retired": true`, never deleted.
- **Daily epoch:** puzzle #1 is the build date. To start the numbering on the real launch day instead, delete
  `daily.json` and run the script with `--epoch YYYY-MM-DD` before the first release; after launch, never. Past the end
  of the file (about three years) the browser carries on with the same rules (`daily-rules.ts`, shared with the build).
- **Controls:** drag by the grip (any pointer), long-press a card on a phone or drag it with a mouse, tap a card then
  where it goes (or its ▲ ▼ buttons), or Enter/Space, the arrow keys and Escape. Every route ends in `move()`
  (`sortable.ts`). The long-press drag must be tried by hand on iOS Safari and Android Chrome; if either cancels it,
  remove the long-press and keep the grip and tap routes.
- **Known gaps:** labels, dating lines and reasons are English in every language (the help panel says so).
- **Checks:** the `*.test.ts(x)` files in `timeline/` run in `npm test`, including an independent check of 2,000 dealt
  rounds, every Daily rule over the whole schedule plus a year of fallback days, and puzzle numbers across
  daylight-saving changes in three time zones.

## Verse completion

`verse-completion` ([verse-completion/VerseCompletionGame.tsx](verse-completion/VerseCompletionGame.tsx); design:
[docs/features/verse-completion/design.md](../../../docs/features/verse-completion/design.md)) shows a passage's
reference and opening words; the player finishes it. **Pick**: the right ending from three (Easy, Medium) or word by
word from three words each (Hard). **Type**: whole words, matched forgivingly (case, punctuation, contractions,
British spellings and small typos that are not themselves BSB words are forgiven), or one first letter per word. A
round is ten passages with 0–3 stars each. **My verses**: passages the player adds climb five review boxes (back after
1, 3, 7, 14 and 30 days); only a due answer at the Hard split moves a box, picking stops at box 2, first letters at 4,
and only whole words mark a verse Memorised. Saved in the browser under `bp-verse-completion`.

- **Data:** `src/data/verse-completion/` — `curation.json` is hand-kept (ids, verse range, tier 1 Famous / 2 Well
  known / 3 Deeper, optional split overrides, a note; never wording). `pool.json` and `vocabulary.json` are generated by
  `node --experimental-strip-types scripts/build-verse-completion.ts`, which checks every passage against the BSB on
  disk (a whole sentence, 8–45 words, no digits or contractions), works out the split points and the wrong endings, and
  checks the balance (a third Old Testament, no book above 12%, tiers within 20% of 150/250/200). Add `--review
  <path outside src>` for the curator's sheet of every Pick prompt with its wording; `--check` fails if the files are
  stale. `scripts/verse-completion-candidates.ts <path>` ranks fresh candidates by cross-reference votes.
- **Adding or retiring a passage:** add a row to `curation.json` and rebuild. Once live, never delete a row: mark it
  `"retired": true`, so saved progress never points at nothing. Any change of wording, rules or pool changes the pool's
  stamp, which drops a saved round in progress (passage progress is kept).
- **Known gaps:** the verses and the matching rules are English (BSB) in every language; the help says so.
- **Checks:** the `*.test.ts(x)` files in `verse-completion/` run in `npm test`, including `data.test.ts`, which rebuilds
  the pool from `curation.json` and fails if `pool.json` differs.

## Bible Jeopardy

`jeopardy` ([jeopardy/JeopardyGame.tsx](jeopardy/JeopardyGame.tsx); design:
[docs/features/bible-jeopardy/design.md](../../../docs/features/bible-jeopardy/design.md)) is a church-night game on
one projected screen. The host names 2–6 teams, deals a board of 3–6 categories × 5 tiles (100–500) from the question
bank ("Surprise me", or chosen from the test page's themes and the books of the Bible), previews and swaps it, then
plays: the clue fills the screen, the host marks each team ✓ or ✗ (or keys 1–6, Shift + 1–6), steals, a Daily Double
and a Final with written bets, undo, and a printable host sheet. Nothing is generated and nothing runs on a server.

- **Code:** `categories.ts` (themes and books, the pool, "Surprise me"), `generate.ts` (the difficulty ladder, filling
  scarcest column first, Daily Double, Final, swaps), `rules.ts` (the one reducer where points change, with undo),
  `keys.ts` (the key table), `storage.ts` (saved game, settings, seen list), `link.ts` (the board link), the screens
  beside them. Shared code from the live quiz (`pick.ts`, `names.ts`) and the test page (`themes.ts`) is imported,
  never edited.
- **Saved in the browser:** `bp-jeopardy` (the game in progress, with undo history; a newer save from another tab
  stops this one until "Use this tab"), `bp-jeopardy-settings`, `bp-jeopardy-seen` (the last 1,500 clues the room saw).
- **Board link:** `?board=1.<language>.<settings>.<columns>` (link.ts). A question no longer in the bank is redrawn
  for the same category at that row's level; a link from another site language is redrawn with the same categories.
- **Checks:** the `*.test.ts(x)` files in `jeopardy/` run in `npm test`. `categories.test.ts` also builds 200 boards
  from the real bank and skips itself when `data/questions/bank.json` is absent. `bank.test.fixture.ts` is the small
  test bank (its name keeps it out of the translation collector and out of Vitest's file list).

## Who's older?

`whos-older` ([whos-older/WhosOlderGame.tsx](whos-older/WhosOlderGame.tsx); design:
[docs/features/whos-older/design.md](../../../docs/features/whos-older/design.md)) shows two Bible people and the player
taps the one who lived first. Streak (endless; the first miss ends it) and Relaxed (three hearts; Easy, Medium, Hard or
Mixed). After every answer the reveal shows both birth windows on a small timeline, the reason in one sentence (with the
deciding verse in the BSB when a verse decides it) and links to both people's pages. Best scores and the run in
progress are kept in the browser under `bp-whos-older`; a reload brings back the same pair.

- **The one rule** ([whos-older/pairing.ts](whos-older/pairing.ts), shared with the build script): a pair is asked only
  when a hand-kept or family-link fact states the order, or the two birth windows share no year. Windows are wide
  enough for every dating system the site uses, so the gap shown is always the smallest any system allows.
- **Data:** `src/data/whos-older/` — `whos-older.json` is generated by
  `node --experimental-strip-types scripts/build-whos-older.ts` from the three hand-kept `*.source.json` files
  (people and their windows, order facts, blocked pairs), `data/study/people.json`, the family files, the
  people-pages' reign dates and the BSB. The build refuses to write if any check fails (a fact against the windows, a
  window narrower than a ruler's reign allows, a loop in the facts, too few pairs) and rewrites
  [docs/features/whos-older/review-sheet.md](../../../docs/features/whos-older/review-sheet.md), a readable list of every
  person, fact and warning for checking by eye. Run it by hand after changing a source file; the data test fails if
  the generated file no longer matches its sources.
- **Known gaps:** the game's words and the people's labels are English in every language. The windows are hand-set
  from the Bible's numbers and the site's reign tables; the review sheet lists the ten places where Theographic's
  single birth year falls outside a window, each with a note on why.
- **Checks:** the `*.test.ts(x)` files in `whos-older/` run in `npm test`, including the design's worked examples, an
  independent re-check of the pairing rule over 2,000 random pairs of the real file, and the left card being right
  40–60% of the time.

## Family charades

`charades` ([charades/CharadesGame.tsx](charades/CharadesGame.tsx); design:
[docs/features/family-charades/design.md](../../../docs/features/family-charades/design.md)) is a Heads Up!-style game
for one phone in one room. *Guess it* (the default): the guesser holds the phone to their forehead, everyone else acts
the scene, and the guesser tips the phone down for Got it or up to Pass. *Act it*: classic charades, the actor reads the
phone and taps Got it. Decks by age (Little ones, Kids, Teens and adults), Everything at Easy/Medium/Hard or one of
seven themes (offered only with at least 12 scenes), rounds of 30–120 seconds, optional teams, and a recap with every
scene's passage and a "Read the story" link. The round is a fixed layer over the page (`charades.css`); the setup and
recap sit in the site's layout. Settings, best score per round length and the last 200 scenes seen are kept under
`bp-charades` in local storage; a team game in progress under `bp-charades-game` in session storage.

- **Data:** `src/data/charades/scenes.json`, 129 hand-kept scenes (design Appendix A). No build script: add or change a
  row by hand and run `npm test`; `scenes.test.ts` checks every reference against `data/plain/bsb/` and that each
  scene's check word occurs as whole words in its passage, and prints the deck sizes.
- **Controls:** tilt (`tilt.ts`, pure: `cos β · cos γ` says whether the screen faces up or down, whichever way round
  the phone is held), big Got it / Pass buttons, and → or Space / ← / Esc on a computer, all live at once. Everything
  that needs the Start tap (sound, wake lock, fullscreen on Android, the iPhone motion prompt) is started in the tap
  before anything is awaited (`sensors.ts`). With no tilt readings within a second, or motion access refused, the round
  plays on buttons and says why; the next visit starts on *Buttons only*.
- **Testing on a phone:** browsers send no orientation events on plain HTTP, so the local preview opened on a phone over
  the network plays on buttons only. Use HTTPS (a tunnel or the deployed preview) to try tilt.
- **Known gaps:** the game's words and the scenes are English in every language. The tilt thresholds and the card's
  self-turning (for a phone whose rotation lock is on) are tested on recorded-style numbers, not yet on a real iPhone
  and Android phone (design §11's manual checks).
- **Checks:** the `*.test.ts(x)` files in `charades/` run in `npm test`: the scene rules against the BSB, the deck table,
  1,000 dealt rounds per offered deck, the tilt detector on synthetic sequences, the round clock and team totals,
  storage, and the page itself (a buttons round, a tilt round from dispatched orientation events, the iPhone prompt
  granted and refused, no readings, and the Start tap's call order).

## Memory card match

`memory-match` ([memory-match/MemoryMatchGame.tsx](memory-match/MemoryMatchGame.tsx); design:
[docs/features/memory-match/design.md](../../../docs/features/memory-match/design.md)) deals face-down text cards: half
name a person ("Daniel"), half a story ("the lions' den"). Turn two at a time and pair each person with their story.
Seven themed decks plus Mixed, Easy/Medium/Hard (12, 18 or 24 cards), stars from moves, and pass and play for two to four
people on one phone. The board in progress is kept in session storage; records, recently seen pairs and settings under
`bp-memory-match-*` in local storage.

- **Data:** `src/data/memory-match/pairs.json` and the review sheet are generated by
  `py -3.12 scripts/build-memory-match.py` from the hand-kept `scripts/memory-match/characters.json` and `pairs.json`.
  The build fails on a check word missing from the BSB passage, a misquotation, a story naming its own character, an
  unknown person id or link, and the rest of the design's card rules. It ships verse ids only; the end screen looks the
  words up through `src/lib/verses.ts`.
- **Fair boards:** `deal.ts` never lets two people on one board both claim a story card (links, same first name, one
  story per person, and no shared story words on Easy).
- **Checks:** the `*.test.ts(x)` files in `memory-match/` run in `npm test` (including 1,000 drawn boards for every deck and
  difficulty); `npm run test:data` runs the builder's tests and `--check`; `npx playwright test -c e2e/memory-match.config.ts`
  checks the phone layout against a build.

## Emoji stories

`emoji-stories` ([emoji-stories/EmojiStoriesGame.tsx](emoji-stories/EmojiStoriesGame.tsx); design:
[docs/features/emoji-stories/design.md](../../../docs/features/emoji-stories/design.md)) shows a row of three to six
emoji that tells one Bible story; the player names the story, by choosing one of four titles or by typing and picking a
story from the game's own list (judged by story id, never by spelling). Three hints (where it is, what each picture
means, who is in it); a Daily shared by everyone on a date (three typed guesses or two with choices, a spoiler-free share
line), Practice rounds of ten by difficulty and testament, and Show a room, where the emoji arrive one at a time on a
big screen. `?play=daily|practice|room` opens a mode. Saved in the browser under `bp-emoji-stories` (and a Practice
round in progress under `bp-emoji-stories-round` in session storage; a room round is never stored). The Daily opens on
Typing every day; switching it to Choices is kept for that day only, and Practice keeps its own choice.

- **Data:** `src/data/emoji-stories/stories.json` is hand-kept: each puzzle's emoji with the BSB passage word it stands
  for, its passage, key verse, people, aliases and "never offer side by side" list. `emoji.json`, `daily.json` and
  [the review sheet](../../../docs/features/emoji-stories/review-sheet.md) are written from it by
  `node --experimental-strip-types scripts/build-emoji-stories.ts`, which needs Unicode's `emoji-test-15.1.txt` in
  `<sources>/unicode/` (checksum pinned). Run it after editing `stories.json`; it never changes a day already kept.
- **Daily epoch:** puzzle #1 is `2026-11-09` (the build date). To number from the real launch day, delete `daily.json`
  and run the script with `--epoch YYYY-MM-DD` before the first release; after launch, never.
- **Emoji the device cannot draw** show an empty tile with their Unicode name under it (a canvas test,
  `emoji-support.ts`: no colour and the width of the "no such character" box).
- **Known gaps:** titles, hints and clue words are English in every language (the translation collector does not read
  `src/data/emoji-stories/` yet); a translated site opens on Choices.
- **Checks:** the `*.test.ts(x)` files in `emoji-stories/` run in `npm test`: every puzzle against the BSB text and the
  Unicode list, the closeness and title rules, `--check` of the generated files, 1,000 dealt rounds per filter, the
  Daily rules over the whole schedule, puzzle numbers across daylight saving, answer matching, and the page itself.
