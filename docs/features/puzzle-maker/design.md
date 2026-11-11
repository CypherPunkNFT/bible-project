# Puzzle maker (Tools): design

**Spec (binding):** [PROPOSED-IDEAS.md](../../../../PROPOSED-IDEAS.md), sequence 41 batch 3: *"puzzle maker (word search
and crossword, shared generator in src/lib/puzzles)"*. Job 863's brief: printable word searches and crosswords from a
passage or theme, on the Tools page, using the ONE shared generator at `src/lib/puzzles` (built by the crossword game,
job 846), extended there if needed, never a second generator. Sequence rules: no runtime AI cost, nothing tracked or
stored outside the browser, Berean Standard Bible quotations, new English text in the translation pipeline, tests, long
lists drawn a window at a time. Build on the preview only.

## 1. What the visitor does

A Sunday-school teacher, parent or pastor at `/puzzle-maker`:

1. **Picks the puzzle:** Word search or Crossword.
2. **Picks where the words come from:**
   - **A passage**: any reference the citation generator reads ("Psalm 23", "John 3:1-21", "Ruth 1", "Gen 1:1–2:3"),
     up to 250 verses. The words are the passage's own key words (§2.1); crossword clues are its verses with the word
     blanked.
   - **A theme**: the crossword game's eleven themes (Whole Bible, seven story themes, People, Places, Words from
     verses), drawn from the game's clue file `src/data/crossword/clues.json` (people, places, verse words, quiz
     questions; all built ahead of time from the site's data, no model).
3. **Picks a size** (Small, Medium, Large) and a **difficulty** (Easy, Medium, Hard):
   - Word search size: Small 10 × 10, about 8 words; Medium 13 × 13, about 12; Large 15 × 15, about 18. Difficulty is
     the directions: Easy across and down only; Medium adds the two downward diagonals; Hard every direction,
     backwards too (the generator's `forward` / `diagonal` / `all`).
   - Crossword size: the game's sizes (up to 9 × 9 / 13 × 13 / 17 × 17; about 7 / 12 / 18 words).
     Difficulty: **Easy** prints a word bank (the answers in A–Z order) under the clues; **Medium** no word bank;
     **Hard** no word bank and, for a passage, no verse references after the clues.
   - For a theme, the difficulty also chooses how well known the words are (the game's tiers: Easy tier 1, Medium
     1–2, Hard all), and the choices fall back to the nearest one with clues enough (the game's `fitSpec`).
4. **Optionally edits the title** (defaults to the passage as typed, e.g. "Psalm 23", or the theme's name; at most
   60 characters).
5. Sees the **sheet on screen** as it will print, with **Show answers** to check it, **New puzzle** for another layout
   with the same choices, and **Print**, with a tick box *Add the answer key on a second page* (on by default) and the
   paper size (Letter or A4, default by the browser's region, as the reading planner does).

The printed sheet: the title, the puzzle's kind ("Word search" / "Crossword"), a *Name ____ Date ____* line, the grid,
then the word list (word search) or the Across and Down clues (crossword), and a small footer: *Bible Guide ·
bibleguide.io · Scripture quotations from the Berean Standard Bible*. The answer key is the same grid with the answers
shown (word search: the answer letters dark, the filler letters faint; crossword: the letters filled in).

**The settings live in the address** (`?kind=search&from=passage&ref=Psalm+23&size=medium&level=easy&seed=…&title=…`),
like the word counter's search, so a sheet can be made again, bookmarked or sent to a co-teacher. Nothing is saved in
the browser and nothing is sent anywhere but the requests for the site's own files. Arriving with no settings shows a
Psalm 23 word search, medium, easy, with a fresh seed written into the address (replace, not a new history entry).

## 2. Where the words come from

### 2.1 Passage words (`src/pages/puzzle-maker/passage.ts`, pure)

- **Text:** `loadPlain("bsb", code)` (`data/plain/bsb/<BOOK>.json`, "chapter:verse" → text), the files the reader,
  search and word counter already read. The reference is read with the citation generator's `parseReference`
  (imported, not copied), checked against the BSB in the catalogue. A whole one-chapter book ("Jude") works; a
  passage of more than 250 verses is refused with a message ("Choose a shorter passage, up to 250 verses; this one
  has N."), so a whole book of Psalms never becomes one puzzle.
- **Words:** split each verse into words (letters and apostrophes); drop a possessive `’s`/`'s`; skip words with
  fewer than 3 or more than `maxLength` letters after `gridLetters`; skip ~200 common English words (a stop list in
  the file: function words, pronouns, forms of be/have/do/say/come/go/make, numbers spelt out, "LORD"'s companions
  such as "shall" and "unto"). Words joined by a hyphen are split.
- **One entry per grid word:** "Shepherd" and "shepherd" are one entry. It keeps the form seen most (ties: the first),
  the verses it appears in (in order) and its count. A word written only with a capital outside the start of a
  sentence (and not after a quotation mark) counts as a name.
- **Ranking:** names first, then by count, then longer words, then first appearance. Deterministic: the same passage
  always gives the same list.
- **Word search:** the top `target` words (so the passage's key words are the ones hidden); the seed changes only the
  layout. Words the generator could not fit (`skipped`) are left out of the printed list and the page says how many.
- **Crossword clue:** the first verse the word is in, every occurrence of it (whole word, any case, with `’s`) replaced
  by `____`, cut to a window of about 18 words around the first blank with "…", followed by "(Psalm 23:1)" unless
  Hard. A clue that still gives the answer away (the game's `clueProblem`: a word in it starting with the answer, or
  most of it, e.g. "shepherds" for SHEPHERD) moves on to the word's next verse; a word with no clean verse is left out
  of the crossword. Candidates: the top `target × 4` words, shuffled by the seed, to `generateCrossword` with
  `minWords` = 3 (a short passage may make a small crossword; under 3 words the page says the passage is too short and
  suggests a longer one or the word search).
- **Clue length:** at most 160 characters, as the game's clues.

### 2.2 Theme words

- `clues.json` loaded with a dynamic `import()` (the chunk the crossword game already uses), only when a theme is
  chosen.
- **Crossword:** the game's own `fitSpec`, `makeLayout` and `toPuzzle` from `src/pages/games/crossword/game.ts`
  (imported read-only), so a theme crossword here is made exactly as the game makes one.
- **Word search:** the game's `poolOf(entries, {theme}, level, size)` with the word-search size's longest side as
  the length limit; distinct answers, shuffled by the seed, the first `target` handed to `generateWordSearch`. The
  printed list shows each word as written (`w`, e.g. "Bethlehem").

## 3. The shared generator: `src/lib/puzzles` (reused, one small addition)

The maker calls only `generateWordSearch`, `generateCrossword` (through the game's `makeLayout` for themes and
directly for passages), `wordCells`, `cellNumbers`, `gridLetters`, `seededRandom`, `shuffled`. One addition, for the
answer key: `wordSearchCells(sheet, word)` in `word-search.ts`, the squares a placed word covers, in the module's
`index.ts`, README and tests (the crossword already has `wordCells`). No second generator, no copy of either.

## 4. Files

| File | What |
|---|---|
| `src/pages/puzzle-maker/PuzzleMakerPage.tsx` | The page: form, status, preview, print. Settings read from and written to the address. |
| `src/pages/puzzle-maker/settings.ts` | Reading and writing the address (`readSettings`, `settingsParams`), the sizes and levels. Pure. |
| `src/pages/puzzle-maker/passage.ts` | Passage → ranked words with verse clues (§2.1). Pure. |
| `src/pages/puzzle-maker/make.ts` | Settings + words → a `Sheet` (word search or crossword, both normalised for drawing). Pure. |
| `src/pages/puzzle-maker/PuzzleSheet.tsx` | Draws a sheet (puzzle or answer key), on screen and in the print portal. |
| `src/pages/puzzle-maker/art.tsx` | Its picture on the tools hub, in the games' drawing kit. |
| `src/pages/puzzle-maker/puzzle-maker.css` | Its styles (`pm-` classes) and the print rules for its sheet. |
| `src/pages/puzzle-maker/README.md` | How it works, files, translation, checks. |
| tests | `passage.test.ts`, `make.test.ts` (real BSB files), `PuzzleMakerPage.test.tsx` (page, address, print, registry). |

Shared lines touched: one route in `src/App.tsx`; one entry (and import) in `src/pages/tools/registry.ts`; any one-word
labels in `content/translation/page-register.json`; the module addition in §3; this tool's line in PROPOSED-IDEAS.md.
Printing reuses `src/pages/life-events/print-sheet.ts` and `PrintPortal.tsx` (the reading planner does too).

## 5. Printing

`PrintPortal` draws the sheet (and, when ticked, the answer key after a page break) into its own container on
`<body>`; `usePrintSheet(paper, "0.5in")` writes the @page rule and opens the browser's print dialog. Grid squares are
sized in print from the grid's width so a 15 × 15 search or 17 × 17 crossword fits the page width (max 0.42in a
square, min 0.3in). Crossword: letter squares with borders and small numbers, empty squares blank (a freeform grid).
Word search: letters in a bordered table, upper case, monospaced spacing. Clues break across columns (two on Letter/A4)
and may run onto the next page; the answer key always starts on a new page. In-app browsers without a working print
dialog (`canPrint`) see a note instead of the button.

## 6. Accessibility and translation

- The grid is a `<table>` with a caption ("Word search, 13 by 13 letters"); crossword squares carry their number in
  text; the answer key on screen marks answer squares with a class and, for screen readers, the list of answers with
  their start square and direction.
- All page text (headings, labels, buttons, notes, errors) is plain text in the page code, collected by
  `content/translation/extract.py --pages`; one-word labels the collector passes by are registered in
  `content/translation/page-register.json`. The puzzle's own words, clues and the Bible text are English
  (`translate="no"`): they are the English BSB's words in an English grid. `python content/translation/english_build_check.py`
  must report nothing new.

## 7. Registry and picture

`src/pages/tools/registry.ts`: `{ slug: "puzzle-maker", status: "live", path: "/puzzle-maker", title: "Puzzle maker",
description: "Printable Bible word searches and crosswords from any passage or theme, with an answer key.", audiences:
["parents", "families", "churches"], category: <a category whose tones leave one free>, art: PUZZLE_MAKER_ART }`. The
picture lives in the tool's folder (as the converter's and word counter's do): a sheet of paper with a letter grid, a
pencil, and a few crossword squares, with one slow living detail.

## 8. Lists

The longest list is a Large crossword's 18 clues, so nothing needs a windowed list (the rule applies to long lists).

## 9. Checks (`npm test`)

- Passage: Psalm 23 from the real BSB gives SHEPHERD, PASTURES, WATERS, among its words, no stop words, every word
  3+ letters; same passage → same list; a 251-verse passage is refused; a clue never contains its answer and passes
  `clueProblem`; a word in no clean verse is dropped from crossword candidates.
- Make: the same settings and seed → the same sheet; every placed word-search word reads correctly from its
  `wordSearchCells`; every crossword word reads from its cells; theme crosswords use the game's layout; Easy crossword
  has a word bank, Hard passage clues have no references.
- Page: arriving shows a word search and writes a seed; switching to crossword, to a theme, and New puzzle change the
  address; Show answers; Print calls `window.print` with the answer key in the portal; a bad reference shows the
  parser's message; the registry entry is live at `/puzzle-maker` (the tools test checks the route).
- Module: `wordSearchCells` in `src/lib/puzzles/puzzles.test.ts`.

## 10. Review (2026-11-09, before any code; three passes: security and correctness, reliability, platform fit)

Every MAJOR and CRITICAL point was folded into the build; where this section and §1–§9 disagree, this section wins.

| Found | Changed |
|---|---|
| **"Same address, same sheet" was false for crosswords:** `generateCrossword` stops after 120 ms, so a slow phone tries fewer layouts than a laptop. The game's `makeLayout` passes no options. | The maker lays out every crossword itself with `timeBudgetMs: Infinity` and a fixed `attempts`, so the tries alone decide (passage and theme). Theme crosswords use the game's `candidates()` and `toPuzzle()` (read-only imports) inside the maker's own six-seed loop; the game file is not changed. Promise worded as "within one release": a new clue file or word rule may change a sheet. |
| **Clues gave answers away:** the reference "(Ruth 1:4)" names RUTH; two words from one verse give each other away (WATERS in the PASTURES clue). | `clueProblem` runs on the finished clue, reference included. Candidates are chosen as the game chooses them: no clue may hold another candidate's answer (word starting with it) and a new answer may not be in an earlier clue; each word tries its verses in order until one is clean, else it is left out. |
| **Theme word search could not use `poolOf`:** it filters by the crossword's 9/13/17 and its `isOffered`/`fitSpec` use crossword targets. | Word-search pools are the maker's own: `inSource` (the game's), tier ≤ the level's, 3 ≤ length ≤ the grid's side, distinct grid words. When the level's tier gives fewer than the size's words, the next tiers top it up and the page says "some less familiar words were added". |
| **Theme crossword fallbacks were silent.** | `fitSpec` picks the nearest offered size and level; the page shows a note naming what was used, and never writes it back to the address. A choice with no offer at all says so. |
| **Sensitive passage words** (prostitute, nakedness, …) would become answers; a children's sheet. | A short `SENSITIVE` list in `passage.ts` is never an answer; the verse text is never changed. Short block-list words inside a real word (SHITTIM, PASSOVER, TITUS) are harmless and left; the filler redraw only touches filler. |
| **Duplicates and nested words:** "God" and "God’s" are one grid word; SON inside PERSON shows twice in the key. | Words are merged by `gridLetters`; a word-search word inside another chosen word is dropped. Curly apostrophes count only between letters; a hyphenated name (Beth-shemesh) stays one word. |
| **Ranking "names first"** would put LORD, Spirit and Law on top (the BSB capitalises them). | Ranking is by count in the passage, then length, then first appearance; no names rule. |
| **No loading, failure or retry states; races.** | Three states: reading ("Reading the passage…"/"Loading the clues…"), failed (named, with Try again; a theme whose clue file still fails after a retry suggests reloading the page), ready. Every load carries a request number; a stale one is dropped. Generation is deferred one tick with a "Making your puzzle…" status; Print and Show answers wait for a sheet. |
| **Address loops and keystrokes.** | The reference and title are typed into drafts and applied with a Make button (reference) or on blur/Enter (title). The fresh seed is written once with `replace` when `seed` is absent; the sheet is keyed on a settings string without the title. Every parameter is checked against its list, `seed` must be an integer 0–2³¹−1, `ref` is cut to 120 characters, `title` to 60 characters with control and direction-override characters removed. `title=` is written only when it differs from the default. |
| **Passage limits:** `parseReference` checks chapters, not verses ("John 3:99"); "Ps 1-150" parses. | Verses are counted from the book file (de-duplicated across the passages, only keys that exist) before anything else: none → "There are no such verses in…"; over 250 → "Choose a shorter passage". The held book code (`equivalent`) is used to load. Ranges across two books are a parse error from the parser, shown as it is. |
| **Print:** a sheet mounted only while printing can come out blank on phones; the answer key needs its own page; 17 × 17 on A4. | The sheet and answer key stay mounted in the portal whenever a sheet exists; Print only arms the marker. The key has `break-before: page`. Grids are `width: 100%` with `table-layout: fixed` and a maximum width per size; clues avoid breaking inside one. |
| **Registration points.** | Also a `ROUTE_TITLES` line in `src/lib/page-head.ts`; a row for `wordSearchCells` in the puzzles README; a `test-kit.tsx` and a `PuzzleMakerPage.offline.test.tsx` (book and clue file failing, Try again). |
| **Translation:** pieces, plurals and numbers. | Whole sentences as one template; counts through `plural()` and `formatNumber()`; the word bank sorted with `compareCode`; option labels (Small, Easy, …) registered in `page-register.json` if the collector passes them by; the site name in its own element. Attribution as the life-event cards say it: "Scripture quotations are from the Berean Standard Bible (public domain)." Only the grid, words and clues are `translate="no"`. |
| **Category and colour.** | `sharing` (churches and classes), in a tone that category does not use yet, checked by the tools test at the time of adding. |
| Wording | Medium word search "adds diagonals" (the generator's `diagonal` set includes up-right). |

Not taken: a `v=` version parameter (YAGNI; the README states the within-a-release promise); a "play it online" link and on-screen clue links to the reader are added only where cheap (the on-screen answer list links each passage clue's verse).
