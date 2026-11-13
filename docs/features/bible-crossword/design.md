# Bible crossword — design

**Status:** design, review and build in one job (orchestrator job 846, 2026-11-09). Built on the local preview only; never deployed.
**Spec (binding):** [PROPOSED-IDEAS.md](../../../../PROPOSED-IDEAS.md), "Bible crossword (Games)": *"Playable crossword generated from passages or themes, on the Games page. Same generator as the puzzle maker."* The owner's brief for job 846 adds: clues drawn from the site's own data (people, places, verses, quiz questions), several sizes and difficulties, check and reveal buttons, no runtime AI cost, progress kept in the browser only, and **one shared generator module at `src/lib/puzzles`** that the printable puzzle maker on the Tools page will reuse (it must not build a second one).
**Shared rules:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) — no model while people play, reuse site data, BSB for Scripture, register on the /games hub, touch only this feature's files, never deploy.
**Slug:** `crossword`. **Route:** `/games/crossword`.

---

## 1. What the player does

1. **Pick a passage or theme.** Themes: *Whole Bible*, the seven story themes the question bank already uses (*Creation & the patriarchs*, *Moses & the Exodus*, *Judges & kings*, *Psalms & wisdom*, *Prophets & exile*, *Jesus & the Gospels*, *The early church & letters*), and three kinds (*People*, *Places*, *Words from verses*). Passage: any one book of the Bible from a list (only books with enough clues for the chosen size and level are offered).
2. **Pick a level** — Easy, Medium, Hard — and **a size** — Small (about 7 words, up to 9 × 9), Medium (about 12 words, up to 13 × 13), Large (about 18 words, up to 17 × 17).
3. **Solve.** Type into the grid (each square is a real text box, so a phone's keyboard opens). The current clue is shown above the grid; the Across and Down lists sit beside it (below it on a phone).
4. **Check** a letter, the word or the whole puzzle (wrong letters get a slash and the words "wrong letter" for screen readers), or **Reveal** a letter, the word or the whole puzzle (revealed squares get a corner mark). *Clear* empties the grid. *New puzzle* makes another one with the same choices.
5. **Solved:** a short banner (how many letters were revealed, how many checks were used) and the list of answers, each with where its clue came from: a link to the verse in the reader, or to the person's page.

## 2. Where the clues come from (built once, ahead of time)

`scripts/build-crossword.ts` (Node, `node --experimental-strip-types`) reads only files already on disk and writes `src/data/crossword/clues.json`. No model, no network, deterministic output; `--check` fails if the file is stale (the data test runs it).

| Kind | Source | Answer | Clue | Level (tier) |
|---|---|---|---|---|
| person | `data/study/people.json` (`n`, `b`, `c`) + `data/study/people/<id>.json` (`k`: mentions per book) | one-word name, 3–15 letters | the short description `b` | mentions ≥ 80 → 1, ≥ 20 → 2, ≥ 4 → 3; fewer left out |
| place | `src/data/map-quest/places.json` (curated, tiered) + `data/places.json` (verses → books) | one-word name | the BSB text of its key verse with the name blanked: `"…the LORD said to Joshua, 'See, I have delivered ____ into your hand'…" (Joshua 6:2)` | map-quest `tier` |
| verse | `src/data/wordle/answers.json` (455 curated Bible words, each with its verse) | the word | the BSB verse with the word blanked, same form | Wordle `t` |
| quiz | `data/questions/bank.json`, `kind` trivia or lesson only (catechism answers belong to traditions and are left out), `standalone` | one-word answer, 3–15 letters, not yes/no/true/false | the question | `level` easy/medium/hard → 1/2/3 |

**Rules every clue passes** (build fails otherwise, and the data test re-checks the shipped file): the answer is 3–15 letters A–Z after removing accents; the clue does not contain the answer as a word (case-insensitive) nor, for answers of 5+ letters, as part of a word; clues are at most 160 characters (verse excerpts are cut to a window of about 18 words around the blank, with ellipses); verse excerpts match the BSB text on disk exactly apart from the blank. A blank is `____` (four underscores) whatever the answer's length; the grid already shows the length.

**Books on each entry:** person → every book where they are mentioned at least twice (or their single book); place → the books of its verses; verse word → its verse's book; quiz → its `books`. Quiz entries also keep the bank's `topic`.

**Themes** are book ranges plus, for quiz entries, the bank topic of the same id: Creation & the patriarchs = Genesis (topic `beginnings`); Moses & the Exodus = Exodus–Deuteronomy (`exodus`); Judges & kings = Joshua–Esther (`kingdom`); Psalms & wisdom = Job–Song of Songs (`wisdom`); Prophets & exile = Isaiah–Malachi (`prophets`); Jesus & the Gospels = Matthew–John (`jesus`); The early church & letters = Acts–Revelation (`church`). Kind themes take every entry of that kind; Whole Bible takes every entry.

**Levels** filter by tier: Easy = tier 1; Medium = tiers 1–2; Hard = all tiers. A choice is offered only when its pool holds at least four times the size's word target (so the generator has room and two puzzles in a row differ).

**File shape** (`stamp` = SHA-256 of the rest, first 16 hex characters, so saved progress made from another build is dropped):

```json
{ "stamp": "…", "books": [["GEN", "Genesis"], …66],
  "themes": [{ "id": "beginnings", "title": "Creation & the patriarchs", "books": [1, 1] }, …],
  "entries": [{ "a": "MOSES", "w": "Moses", "c": "Brother of Aaron…", "k": "person", "t": 1, "b": [2, 3, 4, 5], "r": 2002010, "p": "moses-exo-2-10", "q": null }] }
```
`a` grid letters, `w` the answer as written, `c` clue, `k` kind, `t` tier, `b` book numbers, `r` verse id (BBCCCVVV) or null, `p` person id or null, `q` bank topic or null.

## 3. The shared generator: `src/lib/puzzles/`

One module for both puzzles, with no React and no site data, so the Tools page's printable puzzle maker imports the same functions.

- `random.ts` — `seededRandom(seed: number)` (mulberry32) and `seedFromText(text)`, `shuffled(items, random)`.
- `letters.ts` — `gridLetters("Mary Magdalene") → "MARYMAGDALENE"` (accents removed, A–Z only), `isGridWord`.
- `crossword.ts` — `generateCrossword(words, { maxSize, target, random, attempts })`. Freeform American-style layout: place the first word across the centre, then repeatedly the candidate with the most valid crossings (ties: nearest the centre, then the random order). A placement is valid when it stays inside `maxSize`, every shared square has the same letter and belongs to a word in the other direction, the squares just before and after it are empty, and every new square has no letters beside it across its direction. Several attempts with different orders; the best (most words, then most crossings) wins. The result is cropped to its used rectangle and numbered in reading order. Returns `null` when fewer than 3 words fit. Output: `{ width, height, cells: (string | null)[], words: [{ index, answer, row, col, direction, number }] }` where `index` points back into the input list. Also `wordCells(word)` and `cellNumbers(puzzle)`.
- `word-search.ts` — `generateWordSearch(words, { size, directions, random })` with direction sets `forward` (right, down), `diagonal` (+ the two forward diagonals), `all` (+ backwards). Words may share matching letters. Unused squares are filled with random A–Z. Returns `{ size, grid, placed: [{ word, row, col, dRow, dCol }], skipped }`. Not used by the game; built and tested here so the puzzle maker reuses it.
- `index.ts` exports them; `README.md` documents the API for the Tools page.

Same seed + same word list ⇒ same puzzle, so the game saves only its choices and seed, never the grid.

## 4. The game: `src/pages/games/crossword/`

| File | Job |
|---|---|
| `CrosswordGame.tsx` | page: loads `clues.json` (dynamic import, only on this page), start / play / can't-load |
| `game.ts` | pools (theme/book × level), availability, `buildPuzzle(data, spec)` (seeded: pool shuffled, up to `target × 8` candidates, deduplicated by answer letters, handed to `generateCrossword`), check/reveal/solved as pure functions, links |
| `storage.ts` | `bp-crossword` in local storage: last choices, the puzzle in play (`stamp`, spec, layout, typed letters, revealed and wrong squares, checks used), up to six unfinished puzzles put aside (`shelf`, added 2026-11-12), solved count; missing/full/corrupt storage never stops the game |
| `Board.tsx` | the grid of inputs, keyboard and pointer handling |
| `Clues.tsx` | current-clue bar, Across and Down lists |
| `Screens.tsx` | start screen, solved panel, can't-load |
| `crossword.css` | site tokens only, both themes, mobile first |

**Keyboard:** letters fill and move on; Backspace clears, or steps back when empty; arrows move (an arrow across the current direction switches direction first); Space or a second tap on the selected square switches direction; Tab / Shift+Tab and Enter go to the next / previous clue. Typing ignores the site's correction form (inputs outside the board).
**Accessibility:** each square's label is "1 Across, letter 3 of 5" (plus "wrong letter" / "revealed" when marked); wrong and revealed marks are shapes as well as colours; a polite live region announces "Solved".
**Language:** the game's buttons, labels and help are plain English in the page code, collected by `content/translation/extract.py --pages` like every page and swapped by the page translator. Clues and answers are English in every language (the answers are letters in the grid and must match their clues), as in Bible Wordle; a translated site shows a line saying so. `clues.json` is therefore not added to `GAME_DATA`; if the build check's "data the site reads untranslated" net lists it, it is ruled out with this reason in `unregistered-reviewed.json`.

## 5. Registry and picture

`registry.ts`: a new live entry `crossword`, shelf `daily` (Daily puzzles: "quick puzzles to come back to"), audiences solo and family. `art/scenes-puzzles.tsx`: `CrosswordScene`, a crossword grid on a lectern with a pencil, the pencil's tip moving (`ga-tip`), tone `gospels` (not used by its shelf neighbours: wordle epistles, timeline history, map-quest poetry, odd-one-out prophets).

## 6. Checks (`npm test`)

- `src/lib/puzzles/*.test.ts`: every placed word reads correctly from the grid; no two letters touch unless they belong to crossing words; numbering matches reading order; same seed ⇒ same output; 500 random generations over the real clue file for every size never break those rules; word search: every placed word is found along its direction, the grid is all A–Z.
- `crossword/data.test.ts`: every entry obeys §2's rules on the shipped file; every theme × level × size offered has its pool; `build-crossword.ts --check` passes.
- `crossword/game.test.ts`: pools, availability, deterministic `buildPuzzle`, check/reveal/solved.
- `crossword/storage.test.ts`: round trip, stale stamp dropped, corrupt storage ignored.
- `crossword/CrosswordGame.test.tsx`: start → play, typing advances, check marks a wrong letter, reveal word fills it, solving shows the banner.

## 7. Known gaps (said in the README)

- Clues and answers are English in every language.
- Multi-word names (John the Baptist) and phrases are left out in version 1.
- The phone app has no games yet; the crossword, like every other game, is on the website only.

---

## 8. Review (2026-11-09, before any code; three passes: correctness, reliability, platform fit)

The review checked this design against the real data and code. Where it disagrees with the sections above, **this section wins**.

| Found | Changed |
|---|---|
| A place's key verse often does not hold its name (Penuel/"Peniel") or is a list of names ("in ____, Moladah, and Beth-pelet") — 8 of 15 samples unsolvable. | The build chooses each place's verse itself from `data/places.json`: the name exactly once as a whole word (a hyphenated name counts as one word), at most two commas' worth of list, the shortest such verse; no such verse, no clue. |
| The sources break the clue rules in places (Gad "descended from Gad"); "build fails" would never build. | The build **drops** a failing entry and prints a count per rule; it fails only when the written file would break a rule or a theme's pool is too small. |
| Short names slip past a whole-word check (Levi/"Levites", Aram/"Arameans"). | For every length, a clue is refused when any word in it **starts with** the answer (accents and curly quotes removed, reference included). |
| 74 one-word names belong to several people; NOAH could get "Daughter of Zelophehad". | One person entry per answer: the most-mentioned record. |
| ~80 quiz questions only make sense with their options ("Which of these…", "…NOT…"). | Questions with "which of these", "of the following", "not", "all of the above", "none of" are left out. Questions tagged with a tradition other than Baptist are left out too. |
| The placement rule let a new word swallow an existing same-direction word (ELI inside BELIEF). | A shared square may not belong to a word in the same direction, and every word after the first must cross one. The test is now: every unbroken run of two or more letters, across or down, is exactly one placed word, and the grid is connected. |
| Saving only seed and stamp puts saved letters in the wrong squares if the generator changes. | The game saves the **layout itself** (each word's entry number, row, column, direction) with the data stamp; a stale stamp drops it. |
| "Too few words" undefined; no time limit. | A puzzle needs at least 75 % of its size's target. `generateCrossword` takes a fixed number of attempts (12) and a time budget (120 ms); the game tries up to six seeds, then says it could not make one at that size. A test bounds the time. |
| Several planned strings would trip the translation build check (hand-written plurals, pieced sentences, bare one-word labels). | Counts use `plural()` from `src/lib/site-format.ts`, numbers `formatNumber`; square labels are one whole template; "Across" / "Down" stand between tags; theme titles live in the page code, not in `clues.json`. The check named in §4 is `unregistered.py`'s "files" check. |
| One `<input>` per square breaks on Android keyboards (key code 229, no Backspace on empty, swipe typing whole words) and zooms/scrolls on iOS. | Squares are buttons (one tab stop, arrow keys move); letters come from the physical keyboard **or an on-screen A–Z keyboard** like Bible Wordle's, always shown below the clue bar. No text boxes. |
| Large (17 × 17) squares would be ~21 px on a 360 px phone. | Squares never go below 1.75 rem; a wider grid scrolls sideways in its frame and the selected square is kept in view. |
| One clue can give away another answer in the same grid. | `game.ts` skips a candidate whose clue starts-with-matches an answer already chosen, or whose answer is in a chosen clue. |
| People are tagged with every book that mentions them twice, so Abraham lands in the Gospels theme. | A person's books are those with at least a quarter of their busiest book's mentions (and at least two). |
| The puzzle maker will want more than the game. | `generateCrossword` returns `unplaced`, allows different width and height, and is generic over the caller's word objects (so a maker can keep "John the Baptist" (4,3,7) on its own side). `generateWordSearch` refills when a short block-list word shows up in any direction. |
| Missing from §5. | `GAME_ART.crossword` in `art/index.ts`. |

**Known after review:** "Words from verses" holds only five-letter words (they come from Bible Wordle's list), so those grids are all five-letter words; People at Easy offers Small only.
