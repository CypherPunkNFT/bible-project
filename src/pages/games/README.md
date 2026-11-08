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
