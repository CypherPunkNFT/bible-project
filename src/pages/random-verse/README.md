# Random Bible verse

`/random-verse`, on the tools hub as **Random Bible verse** (Sharing and churches). One tap for a verse of the Berean
Standard Bible, from the whole Bible, one Testament or one book, on any subject or one of seventeen themes, with Copy
and Share, and its reference opening the reader at that verse. Built for sequence 41, step 5 (2026-11-09); the idea is
in `BibleProject/PROPOSED-IDEAS.md`.

## How it works

- **No server, no AI, nothing stored.** The verse and the choices live only in the address
  (`?v=JHN.3.16&from=nt&theme=hope`), so a verse can be bookmarked or sent as a link; Back brings back the verse before
  (a tap adds to the history; arriving or changing a choice replaces it). Each verse downloads only the small file that
  holds its chapter (`data/text/bsb/<BOOK>/<n>.json`, a few chapters to a file), once per visit.
- **Every verse equally likely.** With no theme, [pick.ts](pick.ts) draws a number below the count of verses in the
  books chosen and walks the chapters to it, using [verse-counts.ts](verse-counts.ts) (the BSB's verses per chapter).
  The draw names the chapter and the nth verse in it; [load.ts](load.ts) reads the chapter to learn its number, since
  fifteen chapters skip numbers the BSB leaves out (Matthew 17:21). A draw never repeats the verse on screen when the
  pool has another.
- **Themes** ([themes.ts](themes.ts)) are short hand-chosen lists of well-known single verses (love, faith, hope, peace,
  joy, strength, comfort, courage, forgiveness, grace, wisdom, prayer, thankfulness, salvation, trust, God's
  faithfulness, who Jesus is). A theme's pool is its verses in the books chosen; a theme with none there is greyed out,
  and if the choice leaves an empty pool the page says so instead of drawing.
- **The address is checked**, since anyone can write a link: a verse must name a BSB book and chapter (`JHN.3.16`), a
  book or Testament the page offers, a theme it has. Anything else is ignored and a fresh verse drawn. A verse the BSB
  does not have (`MAT.17.21`) is named and left for the reader to replace.
- **Copy** gives `<words> — John 3:16 (BSB)`, as the other verse tools write it. **Share** opens the phone's share sheet
  with that and a link to the verse (`https://bibleguide.io/random-verse?v=JHN.3.16`); without one it copies both.
  Where copying is refused, the text is shown in a box to copy by hand.

| File | What is in it |
|---|---|
| [RandomVersePage.tsx](RandomVersePage.tsx) | The page: the address, drawing, the pool line, Another verse, notes. |
| [Filters.tsx](Filters.tsx) | From (whole Bible, a Testament, a book) and the theme chips. |
| [VerseCard.tsx](VerseCard.tsx) | The verse, its reference linked to the reader, Copy and Share, loading and failure. |
| [pick.ts](pick.ts) | Reading the address, the pool, the draw (pure). |
| [load.ts](load.ts) | Reading a verse, and settling which verse a chapter draw landed on. |
| [share.ts](share.ts) | The copied text and the link. |
| [themes.ts](themes.ts) | The themes and their verses. |
| [verse-counts.ts](verse-counts.ts) | Made by `node scripts/make-random-verse-counts.mjs` (run from Website/) from `data/plain/bsb`; do not edit. |
| [art.tsx](art.tsx) | Its picture on the tools hub (a jar of rolled verses, one slip lifting out), in the poetry colour. |
| [random-verse.css](random-verse.css) | Its styles (`rv-` classes). |

## Translation

The page's words, the theme names (under `title`) and the drawing's description are plain text in the page code, so the
translation collector (`content/translation/extract.py --pages`) picks them up; the one-word status "Copied" is
registered in `content/translation/page-register.json`. The verse stays English (`translate="no"`): it is the BSB.

## Checks

`npm test` runs [pick.test.ts](pick.test.ts) (the counts match the BSB files; the address checks; the draw walks the
chapters; a theme keeps to the books chosen; Matthew 17's missing verse; every theme verse is in the BSB and starts a
sentence), [RandomVersePage.test.tsx](RandomVersePage.test.tsx) (arrival, a shared verse, Another verse never repeats,
From and theme, an empty pool, Copy, Share with and without a share sheet, broken links, the registry entry) and
[RandomVersePage.offline.test.tsx](RandomVersePage.offline.test.tsx) (a verse that cannot load, Try again), with
[test-kit.tsx](test-kit.tsx).
