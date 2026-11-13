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

The tools hub (`/tools`, [../tools/README.md](../tools/README.md)) uses this drawing kit (`parts.tsx`, `draw.ts`,
`game-art.css`) and the hub styles in `games.css`, so a change here shows on both hubs.

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

`quiz` ([quiz/QuizGame.tsx](quiz/QuizGame.tsx)) is the homepage's twelve-question quiz rebuilt as a game for this page
(the redesign sequence, step 17; report: [docs/visual-audits/quiz-redesign.md](../../../docs/visual-audits/quiz-redesign.md)).
It reads the questions, verdicts and drawings from `src/pages/quiz-data.ts` and `src/pages/QuizScenes.tsx` and keeps
their rules and scoring, but has its own state ([quiz/state.ts](quiz/state.ts)), rules on top
([quiz/game.ts](quiz/game.ts): the streak by answer order, the trail marks, the rank titles, the share text), storage
([quiz/storage.ts](quiz/storage.ts): the round for the tab under `bp-quiz-round`, the best under `bp-quiz-best`), screens
([quiz/Board.tsx](quiz/Board.tsx) with Play all twelve and the tiles as the scorecard, [quiz/Card.tsx](quiz/Card.tsx)
growing from its tile with the kit's flip card, answer cards, trail, streak flame and feedback band,
[quiz/Result.tsx](quiz/Result.tsx) with the kit's result panel and share) and look ([quiz/quiz.css](quiz/quiz.css), hub
colour Revelation crimson, right gold, missed red-brown). Keys A to D and 1 to 4 answer. Nothing under
`src/pages/home/` is touched: the homepage quiz looks exactly as it did.

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
- **Map:** the atlas's own map file and MapLibre, drawn blank (`quest-style.ts`); no new service or cost. The game lifts
  the dark theme's land, deepens its sea and draws a coastline in its own style (`QUEST_EARTH`), never in the atlas's
  `EARTH`; Beginner's water names are the game's own labels (`water-names.ts`), since the tiles' lake labels never
  appear at the era views. The pin and the true site are HTML markers (`QuestMap.tsx`); the reveal line draws itself
  out over half a second from the pin; the summary passes every result as `summary` and the map goes still.
- **Redesign (2026-11-11):** [docs/visual-audits/map-quest-redesign.md](../../../docs/visual-audits/map-quest-redesign.md);
  uses the kit's trail, band, count-up, result panel, rank line, streak flame, share button and confetti.
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
  After launch, retire an answer with `retired: true`; never delete it, because frozen puzzles still need its entry.
  Put a rebuilt schedule live within 14 days of its build date, or rebuild it again before release.
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
- **Look (redesigned 2026-11-11 from [its visual audit](../../../docs/visual-audits/timeline.md); report:
  [timeline-redesign.md](../../../docs/visual-audits/timeline-redesign.md)):** a lobby with a fanned stack for the Daily,
  three card stacks for the levels and era chips on a line (`Screens.tsx`); a board with a rail down the left, "Creation"
  to "The early church", cards of one height with a faint motif from the label's words (`motif.ts`, `MotifIcon.tsx`) and
  a dashed outline where a dragged card will land (`SortList.tsx`); after a Check a right card turns over to its date
  (one after another), a wrong one shakes, and joined neighbours get a "together" bridge; the tries are four small card
  backs from the kit's `FlipCard`. The ending is the kit's `ResultPanel` with the grid as `ProgressTrail` rows,
  `ShareButton`, `StreakFlame` and `Confetti` first, then the true order as rows that open (`Result.tsx`, `Reveal.tsx`).
  The card itself is one button through its turn (the kit's `FlipCard` is two faces round a div), so that turn lives in
  `timeline.css` with the kit's keyframes.
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
- **Look (redesigned 2026-11-11 from its visual audit, [docs/visual-audits/verse-completion-redesign.md](../../../docs/visual-audits/verse-completion-redesign.md)):**
  the hidden words are gaps as wide as the words and the words land in them (word by word in Hard and First letters,
  all at once on the result, staggered by `landDelayMs` in [verse-completion/view.ts](verse-completion/view.ts)); the
  three endings are the kit's `AnswerCard`; the verdict, the stars and Next ride in the kit's `FeedbackBand`; the
  round header is a `ProgressTrail`; the ending is a `ResultPanel` with `ScoreCountUp`, `RankLine`, `StreakFlame` and
  `Confetti`; Leave round and Clear my progress use `ConfirmDialog`. The game's look is `verse-completion.css`
  (colour: the Gospels' lavender).
- **Known gaps:** the verses and the matching rules are English (BSB) in every language; the help says so.
- **Checks:** the `*.test.ts(x)` files in `verse-completion/` run in `npm test`, including `data.test.ts`, which rebuilds
  the pool from `curation.json` and fails if `pool.json` differs, and `view.test.ts` for the trail, the title share,
  the landing delays, the hinted "shown" mark and the word-key guard.

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

## What came first? (was Who's older?)

`what-came-first` ([what-came-first/WhatCameFirstGame.tsx](what-came-first/WhatCameFirstGame.tsx); design:
[docs/features/what-came-first/design.md](../../../docs/features/what-came-first/design.md), built on Who's older?'s
[design](../../../docs/features/whos-older/design.md)) shows two things from the Bible and the player taps the one that
came first. Nine pills, all visible: People (who lived first), Events, Rulers, Buildings, Journeys (two stops of one
traveller's journey), Deaths, Books (the Bible's order), Bible firsts (one question, three or four answers) and Mixed,
which a new player opens on. `?c=<key>` chooses the pill; the old address `/games/whos-older` forwards to
`/games/what-came-first?c=lived` (a route in `src/App.tsx`, because the hub sends unknown game addresses home). Streak and
Relaxed as before. Bests per pill and mode and the run in progress are kept under `bp-what-came-first`; Who's older?'s
`bp-whos-older` is read once (its bests and saved run become Who lived first's) and never written or deleted.

- **The one rule** ([what-came-first/order.ts](what-came-first/order.ts), shared with the build script): a pair is asked
  only when a fact with its verse states the order, the two windows share no year, or both are positions in one
  sequence (one journey, the 66 books); blocked pairs never. Who lived first runs it with Who's older?'s rules and gives
  the same answer for every pair (a test proves it).
- **Data:** `src/data/what-came-first/` — the generated `*.json` files are written by
  `node --experimental-strip-types scripts/build-what-came-first.ts` from the hand-kept `*.source.json` files, the
  Timeline game's events and the site's ruler pages; Who lived first reads `src/data/whos-older/whos-older.json`
  unchanged. The build refuses to write if any check fails and rewrites
  [docs/features/what-came-first/review-sheet.md](../../../docs/features/what-came-first/review-sheet.md).
- **Who's older?'s model stays where it is:** `whos-older/pairing.ts`, `explain.ts`, the shrunk `game.ts` (types,
  `buildPool`, `random`), their tests, `src/data/whos-older/` and `scripts/build-whos-older.ts`. Other games and builds
  import them (the Timeline game, the Two truths and Twenty questions builds); do not move them.
- **Checks:** the `*.test.ts(x)` files in `what-came-first/` and `whos-older/` run in `npm test`: dealing in every
  category, Mixed's limits, Bible Firsts ending complete, the storage carry-over with the old key set, the forward, and
  the data and build checks.

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

## Bible crossword

`crossword` ([crossword/CrosswordGame.tsx](crossword/CrosswordGame.tsx); design:
[docs/features/bible-crossword/design.md](../../../docs/features/bible-crossword/design.md)) makes a crossword from a
passage (one book) or a theme (Whole Bible, the seven story themes, People, Places, Words from verses), at Easy, Medium
or Hard and Small (about 7 words), Medium (12) or Large (18). Type on a computer's keys or the on-screen A–Z keys;
Check and Reveal work on a letter, the word or the whole puzzle (Reveal puzzle asks twice). When solved, every answer
is listed with a link to its verse or person. The choices, the puzzle in play (its layout, not just a seed), up to six
unfinished puzzles put aside and the number solved are kept in the browser under `bp-crossword`. New puzzle and Change
puzzle put a started, unsolved puzzle aside rather than throwing it away; the start screen lists them under "Carry on",
and a gold dot marks a theme card or book tile with one waiting. Each theme card has its own line drawing
([crossword/ThemeIcons.tsx](crossword/ThemeIcons.tsx)); "Or one book" opens a window of all 66 books
([crossword/BookPicker.tsx](crossword/BookPicker.tsx)), the ones with too few clues greyed out (owner, 2026-11-12).

- **The generator is shared:** the grid comes from [src/lib/puzzles](../../lib/puzzles/README.md), which also makes
  word searches. The Tools page's printable puzzle maker must import it, never write its own.
- **Data:** `src/data/crossword/clues.json` is generated by `node --experimental-strip-types scripts/build-crossword.ts`
  from the people list and files, the map-quest places with every place's verses, Bible Wordle's words, the question
  bank (Bible quiz and Sunday-school questions only; no catechism or other traditions) and the BSB. It leaves out any
  clue that gives its answer away (a word starting with the answer), quiz questions that need their options, place
  verses that are lists of names, and keeps the most-mentioned person for a shared name; it prints a count per rule.
  Run it by hand after the site's data changes; `--check` (run by the data test) fails when the file is stale. A new
  build changes the file's stamp, which drops a puzzle in play.
- **Themes, levels and sizes** are in [crossword/themes.ts](crossword/themes.ts) (no imports; the build reads it too).
  A choice is offered only when its pool holds four times the size's target.
- **Known gaps:** clues and answers are English in every language (the start screen says so on a translated site;
  ruled in `content/translation/unregistered-reviewed.json`); one-word answers only; "Words from verses" holds only
  Bible Wordle's five-letter words; People at Easy offers Small only. The phone app has no games yet.
- **Checks:** the `*.test.ts(x)` files in `crossword/` and `src/lib/puzzles/` run in `npm test`: every rule on the
  shipped clues, every verse blank against the BSB, `--check`, a sound grid for every offered theme × level × size
  (every run of letters is exactly one word), the same seed giving the same grid, storage, and the page itself.

## Bible twenty questions

`twenty-questions` ([twenty-questions/TwentyQuestionsGame.tsx](twenty-questions/TwentyQuestionsGame.tsx); design:
[docs/features/twenty-questions/design.md](../../../docs/features/twenty-questions/design.md)) has two modes. **I think,
you guess:** the player thinks of a Bible person and the site asks yes / no / don't know questions, at most 20 turns
(guesses count), then 5 more if the player wants. **You ask the questions:** the site holds a secret person (Easy: the
146 well-known people; Hard: all 298) and the player asks from a fixed, searchable list of 92 questions in seven
sections, with optional hints (people still possible, and a bar showing how evenly each question splits them).

- **How it guesses** ([twenty-questions/engine.ts](twenty-questions/engine.ts), shared with the build scripts): it
  counts how many answers contradict each person, keeps everyone within one miss of the best (so one wrong answer is
  forgiven), and asks the question whose worse answer leaves the fewest people, everyday questions before detail ones,
  with a seeded choice among near-equal questions. "Don't know", unsure values and slip-marked values (ones players
  often get wrong) never count against anyone. It guesses when one person leads after three answers, or on the last
  turn.
- **After a game:** a win lists the player's answers with any that differed from the notes, each with its verse. A
  loss asks who it was (the game's people first, then all the site's people, or "someone not on this list"), then
  shows each answer that differed with "Oh, I see" or "I still think your note is wrong". The second softens that one
  value on this device. One anonymous report (ids and answer letters only) goes to
  `POST /api/twenty-questions/report` when the player leaves the result screen; reverse mode sends nothing.
- **Server:** [server/twenty-questions.ts](../../../server/twenty-questions.ts) (route file
  [functions/api/twenty-questions/report.ts](../../../functions/api/twenty-questions/report.ts)) checks the origin,
  the size (4 KB), every id against the generated allow-list
  [server/twenty-questions-ids.ts](../../../server/twenty-questions-ids.ts), and an hourly cap of 120 reports under a
  hashed key, then writes one row with no address. Its tables come from
  [migrations/0006_twenty_questions_reports.sql](../../../migrations/0006_twenty_questions_reports.sql), **applied to
  the live database at release**; until then the endpoint answers 503 and the game drops reports silently.
- **Data:** `src/data/twenty-questions/` — `twenty-questions.json` (the people, the questions and one letter per
  question per person) and `twenty-questions-evidence.json` (the verse id behind each value, loaded only on result
  screens) are generated by `python scripts/twenty-questions/tq_build.py` from the hand-kept files in
  [scripts/twenty-questions/](../../../scripts/twenty-questions/) (see its README). Then
  `node --experimental-strip-types scripts/twenty-questions/check.ts` runs the design's checks and the play simulation
  and rewrites [docs/features/twenty-questions/review-sheet.md](../../../docs/features/twenty-questions/review-sheet.md).
- **Saved on the device** under `bp-twenty-questions`: the game in progress (by ids, dropped when the game file
  changes), the last 30 reverse-mode secrets, softened values (by game-file version, person and question) and totals.
- **Known gaps:** the story, place and book values were written by hand in three passes, standing in for the two-pass
  model tagging of design §5.3, which waits for the owner's yes on its cost. Many values are therefore "unsure", and
  the simulation finds a truthful player's well-known person about 85 % of the time against the design's 99 %. The
  data test holds today's figures as a floor. The questions, people and notes are English in every language; the game's own buttons and sentences are written as whole templates so the site's translation collector registers them. The privacy policy needs a
  sentence about the anonymous game report before release.
- **Checks:** the `*.test.ts(x)` files in `twenty-questions/` run in `npm test`: the engine on small hand-made files,
  the shipped file (real people, well-formed values, the early-Genesis rule, question form, Jesus's hand values, the
  allow-list in step, the simulation floor), storage and the report, the endpoint against a stand-in database, and
  whole games of both modes on the page.

## Hot seat

`hot-seat` ([hot-seat/HotSeatGame.tsx](hot-seat/HotSeatGame.tsx); design:
[docs/features/hot-seat/design.md](../../../docs/features/hot-seat/design.md)) is a rapid-fire Bible quiz for one phone in
one room, shaped like The Chase's 60-second Cash Builder. A player sits in the hot seat; someone else holds the phone,
reads each question aloud, sees the answer, and taps Right, Wrong or Pass (arrow keys right, left and down on a
computer, Backspace for Undo, Esc to pause). After 30, 45, 60 (default) or 90 seconds the buzzer sounds and the
question on screen may still be finished. A recap lists every question with its answer and a reader link (new tab);
marks can be changed until Save turn. 1 to 12 players (a name can be a team), 1 to 5 rounds, the order turned by one
each round, players added, removed or moved to another age group between turns, standings after each turn and a final
table with a column per round, best single turn and longest run of right answers. The setup and final standings sit in
the site's layout; the hand-over, count-down, turn, recap and standings between turns are a fixed layer
(`hot-seat.css`).

- **Questions:** the question bank, loaded with `loadQuestionBank` (a small hook copied from Jeopardy's, so Try again
  works). `pool.ts` keeps Bible quiz and Sunday-school questions that pass the live quiz's `isPlayable`, have no lead-in,
  do not need their choices (Jeopardy's open-answer rule, copied) and fit 140 characters with an answer of at most 40.
  Each is frozen once per loaded bank with the live quiz's `toQuizQuestion`. Four age groups, chosen per player:
  Little ones (children's questions, easy, two choices read out by default), Kids (children's, easy and medium), Teens
  and adults (all levels, two easy questions first), Bible experts (medium and hard). On the 2026-11-10 bank: 3,080,
  4,428, 10,580 and 7,174 questions. `deal.ts` draws one at a time: never twice in a session, avoiding the phone's last
  2,000 (its oldest let back when fewer than 200 remain), the same first four words twice in a turn and, where it can,
  the same topic twice running.
- **Saved on the phone** (local storage, because phones unload background tabs while the phone goes round):
  `bp-hot-seat` (settings, last roster, best turn per group, length and answer style), `bp-hot-seat-game` (the session,
  written after every mark and every five seconds of a turn, offered back for 12 hours; a reloaded turn comes back
  paused with the question hidden) and `bp-hot-seat-seen` (question ids). A browser that will not save still plays and
  says so.
- **Reused, never edited:** the live quiz's `pick.ts` and `names.ts`, charades' `sound.ts` and `sensors.ts` (beeps,
  buzz, wake lock), `useRowWindow` for "All questions tonight", and `site-format.ts` for counts, places and lists.
- **Known gaps:** the game's words are written for the translation collector but show in English until a translation
  run reaches them; in other languages the "needs choices" filter is an English pattern, and question ids differ by
  language, so a question may repeat after a language change. Not yet tried by hand on a real phone (design section
  11's one-minute pace check and screenshots).
- **Checks:** the `*.test.ts(x)` files in `hot-seat/` run in `npm test`: every eligibility rule and the pool sizes on the
  real bank (at least 1,000 per group and 300 per testament), 60 turns of 20 draws per group with no repeat, the warm-up,
  two choices and the seen list, the session reducer and leaderboard, storage (damaged, old, tampered and blocked), and
  whole games on the page with fake timers (pause, buzzer, idle close, recap fix, reload and Carry on, Try again).

## Kit

`kit/` ([kit/index.ts](kit/index.ts)) is the behaviour several games share, built first for the redesign sequence
([docs/visual-audits/REDESIGN-BRIEF.md](../../../docs/visual-audits/REDESIGN-BRIEF.md) section 5) and named from the
pieces the sixteen visual audits ask for again and again
([docs/visual-audits/README.md](../../../docs/visual-audits/README.md), "What several games share"; the plain-words list
with each game's expected pieces is [docs/visual-audits/KIT.md](../../../docs/visual-audits/KIT.md)). It carries
**behaviour, not look**: hooks, small components and keyframes. The kit imports no game and touches neither
`games.css` nor `GamesPage.tsx`; a game imports from `./kit` (or `../kit`), which brings in `kit.css` once.

**How a game sets its look.** The game sets CSS variables on its own root and the kit's pieces move, tint and settle
in them, so two games never look alike: `--kit-color` (its hub book colour, e.g. `var(--gospels)`), `--kit-right` and
`--kit-wrong` (defaults: one green, `var(--red-letter)`; the audits found two games marking right answers in lavender,
so the kit's default is the one rule), `--kit-part` (partly right, default `var(--epistles)`), `--kit-surface`,
`--kit-radius`, `--kit-ease` (default the hub's `cubic-bezier(.16, 1, .3, 1)`), and per piece `--kit-card-height`,
`--kit-pip`, `--kit-score-size`, `--kit-timer-height`, `--kit-ring`, `--kit-flip-stagger` (how much later each flip
card in a row turns, by its `index`; default 0 ms; Wordle's tiles set 250 ms, and reduced motion zeroes it). Every class is prefixed `kit-`; a game adds its
own class through `className` and styles it in its own stylesheet. **Every state change happens at once** and the
animation only decorates it; `src/index.css` cuts animations to 0.01 ms under reduced motion and nothing in the kit
waits for one to end. No piece draws a focus outline: focus is the same lift and edge as hover. Words: the kit's own
labels are plain literals (Next is the game's; the kit has Share, Copied, Copy this, New best, Winner, You're up,
More options, Cancel); names, answers and counts come in as slots or as `plural()` labels, so the English check passes.

| Piece | What it does | Asked for by |
|---|---|---|
| `AnswerCard` ([kit/AnswerCard.tsx](kit/AnswerCard.tsx)) | A button card that deals in with a stagger (`index`), lifts on hover and keyboard focus, presses on tap, and settles `selected`, `right` (tint, tick), `wrong` (tint, dashed edge, shake) or `faded`; fixed `min-height` so a mark never jumps the row; `interactive={false}` for a question or scene card. | quiz, two-truths, emoji-stories, odd-one-out, verse-completion, what-came-first, jeopardy, hot-seat, charades, twenty-questions (10) |
| `FlipCard` ([kit/FlipCard.tsx](kit/FlipCard.tsx)) | Turns a card over in place on the `x` or `y` axis; two faces, so the back's tint (`tone`) appears exactly at the half-turn; the back's words are mounted only once `flipped`, so a face-down answer cannot be read. | wordle (the early-colour fault), timeline, two-truths, jeopardy, memory-match, quiz (6) |
| `FeedbackBand` ([kit/FeedbackBand.tsx](kit/FeedbackBand.tsx)) | Slides up when `open` with the `verdict` (a live region kept in the page), the `action` (Next, Save turn, Play again) inside it and the reading folded under; sticky to the bottom of a phone screen (`pinned="narrow"`, `"always"`, `"never"`); moves focus to the action on opening. | two-truths, odd-one-out, emoji-stories, verse-completion, what-came-first, map-quest, timeline, quiz, hot-seat, memory-match (10) |
| `useScrollTopOn(key, scroller?)` ([kit/scroll.ts](kit/scroll.ts)) | Scrolls to the top when the screen key changes, never on first mount. | odd-one-out, memory-match, emoji-stories, jeopardy, two-truths, crossword, map-quest (7) |
| `ProgressTrail` + `trailMarks`, `trailText`, `newestIndex` ([kit/ProgressTrail.tsx](kit/ProgressTrail.tsx), [kit/trail.ts](kit/trail.ts)) | One square or dot per round, `right`/`wrong`/`part`/`current`/`empty`, the newest popping; an optional `tones` list colours each filled pip itself (Memory match's pair colours); `trailText` writes the same marks as the share grid (a game passes its own squares, e.g. Wordle's contrast ones); each mark carries its index as `--kit-i`, so a game can stagger a wave over them (Twenty questions fills them gold one after another on a win). | quiz, two-truths, emoji-stories, odd-one-out, verse-completion, twenty-questions, map-quest, hot-seat, memory-match, crossword (10) |
| `ScoreCountUp` + `useCountUp`, `countAt` ([kit/ScoreCountUp.tsx](kit/ScoreCountUp.tsx), [kit/count-up.ts](kit/count-up.ts)) | The score counting up from zero, time-based so it lands exactly; the real value is in the page from the first render, the digits are decoration; at once under reduced motion. | every game's end screen (16) |
| `ResultPanel`, `RankLine` + `rankFor`, `NewBestRibbon` ([kit/ResultPanel.tsx](kit/ResultPanel.tsx), [kit/rank.ts](kit/rank.ts)) | The end screen's shell (head, trail, actions, reading) so a phone ending fits one screen; the rank line in the hub's gold italic from the game's own title table; a ribbon that pops for a new best. | every game (16) |
| `StreakFlame` + `useGrew` ([kit/StreakFlame.tsx](kit/StreakFlame.tsx), [kit/grew.ts](kit/grew.ts)) | A flame that lights from two in a row (`litFrom`) and pulses only when the streak grows. | quiz, wordle, verse-completion, live-quiz, what-came-first, timeline, map-quest, odd-one-out (8) |
| `ShareButton` + `shareText` ([kit/ShareButton.tsx](kit/ShareButton.tsx), [kit/share.ts](kit/share.ts)) | Share with a preview of the game's own text; the share sheet, else the clipboard (Copied), else a box to copy from (Copy this); the status clears after a moment and when the text changes. Same `ShareOutcome` as Wordle's `share.ts`. | wordle, timeline, two-truths, emoji-stories, map-quest, quiz, odd-one-out and every game with a share line |
| `TimerBar` + `timerTone`, `timeShare` ([kit/TimerBar.tsx](kit/TimerBar.tsx), [kit/timer.ts](kit/timer.ts)) | A thick bar or ring that drains from the game's own clock, amber then red and pulsing for the last `warnAt` seconds, the number beside it, a `stamp` (Time!) that lands over the top when time is up; `quiet` for a long count. | live-quiz, jeopardy, charades, hot-seat, crossword (5) |
| `TeamChips`, `WinnerLine`, `HandOver`, `Podium` + `placeTeams`, `podiumSteps`, `scoreShares`, `teamTone` ([kit/TeamChips.tsx](kit/TeamChips.tsx), [kit/Podium.tsx](kit/Podium.tsx), [kit/teams.ts](kit/teams.ts)) | A colour chip per team (the seven book colours in turn) with a bar that grows against the leader and the team whose turn it is lifted; the winner's name under a Winner label; the hand-over card (You're up, the name very large); a podium rising third, second, first, a shared place on one step; a row's optional `tone` colours its step (Jeopardy's team colours) and `countMs` counts each step's score up from zero. Places follow Hot seat's competition rule. | live-quiz, jeopardy, charades, hot-seat, two-truths, memory-match, emoji-stories (7) |
| `HopWave`, `Confetti` + `confettiPieces` ([kit/Celebration.tsx](kit/Celebration.tsx), [kit/confetti.ts](kit/confetti.ts)) | A hop wave across a row's children (any other attribute, a role or a label, lands on the row itself, so the wrapper can be the row), and one short gold-and-cream burst from the centre of its parent, once, taken down after; no pieces at all under reduced motion. | wordle, timeline, quiz, live-quiz, jeopardy, crossword, map-quest, what-came-first, twenty-questions, memory-match, odd-one-out (11) |
| `MoreOptions` ([kit/MoreOptions.tsx](kit/MoreOptions.tsx)) | One disclosure row that folds the long tail of settings so Play sits on the first phone screen. | thirteen of the sixteen start screens; odd-one-out uses it for the "Why" fold under the reason |
| `ConfirmDialog` ([kit/ConfirmDialog.tsx](kit/ConfirmDialog.tsx)) | A site-styled confirm on a native `<dialog>` (Wordle's panel pattern), focus back to the opener. | verse-completion, hot-seat, crossword, odd-one-out (4) |
| `prefersReducedMotion`, `motionMs`, `hasWindow`, `KIT_EASE` ([kit/env.ts](kit/env.ts)) | The one place the kit reads the window and the motion preference. | all |

Not in the kit: drag and drop (only Timeline sort drags, and no other audit asked for it), and Verse completion's
word-by-word fill and Jeopardy's tile that grows into the clue, which are not flips and belong to those games.

- **Extending it:** a game step may add a prop or a piece, keeping every existing prop working, and runs the kit's tests
  and those of every game that imports it. Keep this table true.
- **Checks:** `npx vitest run src/pages/games/kit` ([kit/pure.test.ts](kit/pure.test.ts): every pure function;
  [kit/cards.test.tsx](kit/cards.test.tsx) and [kit/result.test.tsx](kit/result.test.tsx): every component on the page,
  including the band's focus, the count-up's frames, the burst under reduced motion and the dialog's focus return);
  `npx eslint src/pages/games/kit`; the English check.
