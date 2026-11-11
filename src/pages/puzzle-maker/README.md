# Puzzle maker

`/puzzle-maker`, on the tools hub as **Puzzle maker** (Sharing and churches). Printable Bible word searches and
crosswords from any passage or theme, with an answer key on a second page. Built for sequence 41, step 12
(2026-11-09); the idea is in `BibleProject/PROPOSED-IDEAS.md`, the design and its three reviews in
[docs/features/puzzle-maker/design.md](../../../docs/features/puzzle-maker/design.md).

## How it works

- **One generator.** The grids come from the site's shared puzzle module, [src/lib/puzzles](../../lib/puzzles/README.md),
  the one the crossword game at `/games/crossword` uses: `generateWordSearch`, `generateCrossword`, and
  `wordSearchCells` (added for this tool's answer key). This folder holds no generator of its own; do not add one.
- **From a passage** ([passage.ts](passage.ts)): the reference is read by the citation generator's parser
  (`src/pages/citation-generator/parse.ts`), the verses come from the site's plain Berean files
  (`data/plain/bsb/<BOOK>.json`), at most 250. The words are the passage's own, the ones it uses most first, leaving
  out common English words and a short list of words unsuited to a children's sheet (the verses themselves are never
  changed). A word search hides the top words for its size, never one inside another (HERD inside SHEPHERD). A
  crossword clue is a verse the word is in, with every use of it blanked and its reference after it; no clue may give
  away its own or another candidate's answer (the game's `clueProblem`), the reference included.
- **From a theme** ([make.ts](make.ts)): the crossword game's eleven themes and its clue file
  (`src/data/crossword/clues.json`, built ahead of time from the site's people, places, verse words and quiz
  questions). A theme crossword is chosen and checked the game's way (`candidates`, `toPuzzle`, `fitSpec` from
  `src/pages/games/crossword/game.ts`); when a theme has too few clues for the chosen size or level, the page says
  which it used.
- **The same address makes the same sheet.** The choices and a seed live only in the address
  (`?kind=search&from=passage&ref=Psalm+23&size=medium&level=easy&seed=…&title=…`), and the crossword's tries are
  counted, not timed, so every machine lays out the same grid. This holds within one release: a new clue file or a
  change to the word rules can change a sheet. Every value read from a link is checked against its list.
- **No server, no AI, nothing stored.** Everything is made in the browser; nothing typed is saved or sent.
- **Printing** uses the life-event cards' print sheet (`src/pages/life-events/print-sheet.ts`, `PrintPortal.tsx`): the
  sheet and its answer key stay drawn in the print portal while there is a sheet, and Print opens the browser's
  dialog. Letter or A4.

| File | What is in it |
|---|---|
| [PuzzleMakerPage.tsx](PuzzleMakerPage.tsx) | The page: form, status, preview, print. |
| [useSheet.ts](useSheet.ts) | Reading the passage or the clue file and making the sheet, newest request only. |
| [passage.ts](passage.ts) | A passage's verses, its ranked words and their verse clues (pure). |
| [make.ts](make.ts) | Words and settings to a sheet, with the shared generator (pure). |
| [settings.ts](settings.ts) | The choices, the address and its checks (pure). |
| [PuzzleSheet.tsx](PuzzleSheet.tsx) | One sheet, puzzle or answer key, on screen and on paper. |
| [art.tsx](art.tsx) | Its picture on the tools hub, in the history colour. |
| [puzzle-maker.css](puzzle-maker.css) | Its styles (`pm-` classes) and print rules. |

## Translation

The page's words are plain text in the page code, so the translation collector (`content/translation/extract.py
--pages`) picks them up. The size labels (they hold numbers), the clue headings Across and Down and "Crossword: answer
key" are registered in `content/translation/page-register.json`. The puzzle's words, clues and title stay English
(`translate="no"`): they are the English Berean Standard Bible's words in an English grid.

## Lists

The longest list on a sheet is a large crossword's clues (about 18), so no list here needs drawing a window at a time.

## Checks

`npm test` runs [passage.test.ts](passage.test.ts) and [make.test.ts](make.test.ts) (on the real Bible and clue
files: Psalm 23's words, merged possessives, sensitive words left out, clues that give nothing away, the same sheet
from the same seed, theme sizes and fallbacks), [PuzzleMakerPage.test.tsx](PuzzleMakerPage.test.tsx) (arriving,
the address, typed passages, bad references, theme crosswords and answers, the title, printing with the answer key,
the registry entry) and [PuzzleMakerPage.offline.test.tsx](PuzzleMakerPage.offline.test.tsx) (a passage that cannot be
loaded, and Try again), with [test-kit.tsx](test-kit.tsx). The shared module's own test covers `wordSearchCells`.
