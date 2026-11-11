# Puzzles: the shared crossword and word-search generator

One module makes every grid puzzle on the site: the crossword game at `/games/crossword`
([../../pages/games/crossword/](../../pages/games/crossword/)) and the printable puzzle maker on the Tools page at `/puzzle-maker`
([../../pages/puzzle-maker/](../../pages/puzzle-maker/), word search and crossword). **Do not write a second generator: import this one.** Design and review:
[docs/features/bible-crossword/design.md](../../../docs/features/bible-crossword/design.md) §3 and §8.

Nothing here knows about clues, the Bible or React. The generators take answers as grid letters and give back where
each one went **by its place in the list handed in**, so the caller keeps its own clue, enumeration ("John the
Baptist", (4,3,7)) or link beside each answer. Everything is seeded: the same list, options and seed always give the
same puzzle, so a puzzle can be made again from its settings.

| File | What it gives |
|---|---|
| [random.ts](random.ts) | `seededRandom(seed)` (a random number function), `seedFromText(text)`, `shuffled(items, random)` |
| [letters.ts](letters.ts) | `gridLetters("Mary Magdalene")` → `MARYMAGDALENE` (accents removed, A–Z only), `isGridWord` |
| [crossword.ts](crossword.ts) | `generateCrossword(answers, options)`, `wordCells(puzzle, word)`, `cellNumbers(puzzle)` |
| [word-search.ts](word-search.ts) | `generateWordSearch(words, options)`, `wordSearchCells(sheet, word)` (a placed word's squares, for an answer key), `BLOCKED`, `blockedSquares` |
| [index.ts](index.ts) | all of the above |

## Crossword

```ts
import { generateCrossword, gridLetters, seededRandom } from "@/lib/puzzles";
const answers = entries.map((entry) => gridLetters(entry.word));     // remove duplicates first
const puzzle = generateCrossword(answers, { maxWidth: 13, target: 12, random: seededRandom(42) });
// puzzle: { width, height, cells: (letter | null)[], words: [{ index, answer, row, col, direction, number }], unplaced }
```

- Freeform layout: words cross at shared letters and nowhere else. Every run of two or more letters across or down is
  exactly one placed word, and the grid is connected (the tests check both on thousands of grids).
- `maxWidth` / `maxHeight` bound the **finished** grid, which is cropped to the squares used, so it can be smaller.
- `target` stops it adding words; `minWords` (default 3) is the fewest it accepts, else it returns `null`.
- `attempts` (default 12) and `timeBudgetMs` (default 120) bound the work: give 30 to 150 candidates, not thousands.
- `words` come back in clue order (number, then Across before Down). `cells` is row by row; `wordCells` gives a word's
  squares and `cellNumbers` the number printed in each square.

## Word search

```ts
const sheet = generateWordSearch(answers, { width: 12, directions: "diagonal", random: seededRandom(7) });
// sheet: { width, height, grid: letters[], placed: [{ index, word, row, col, dRow, dCol }], skipped }
```

- `directions`: `"forward"` (right, down; for young children), `"diagonal"` (adds the two downward diagonals) or
  `"all"` (adds every backward direction).
- Words that cannot fit are listed in `skipped`, never cut. The filler letters are redrawn wherever they would spell a
  word on `BLOCKED` in any direction (the sheet may go to a children's class); a placed word itself is never changed.
