# Scripture memory helper

`/scripture-memory`, on the tools hub as **Scripture memory helper** (Study and reference). Pick a verse; each day it
is said aloud, a few more of its words fade, until it is known by heart. Built for sequence 41, step 10 (orchestrator
job 861, 2026-11-09); the idea is in `BibleProject/PROPOSED-IDEAS.md`, the design and what its three reviews changed in
[docs/features/scripture-memory/design.md](../../../docs/features/scripture-memory/design.md).

It is a tool, not a game: the Games page's **Verse completion** (`src/pages/games/verse-completion/`) tests a verse by
typing, with review boxes. This page links to it, and borrows its word splitter (`words.ts`) and calendar days
(`boxes.ts`, `calendarDay`). References are read by the citation generator's parser
(`src/pages/citation-generator/parse.ts`).

## How it works

- **Choosing**: one passage in one chapter, with verses, at most 8 verses and 150 words, typed ("jn 3:16",
  "Prov 3:5-6") or one of twelve starter verses ([starters.ts](starters.ts)). A verse is added only once its Berean
  text has loaded; a verse the Berean does not have refuses the passage, and a file that fails to load offers
  **Try again**.
- **Fading** ([fade.ts](fade.ts)): six steps hide 0, 20, 40, 60, 80 and 100% of the words, then **Known by heart**.
  Steps 1–4 hide at least one more word each, never the last word left. The order is a fixed hash of each word's
  position per passage, the first word last, so yesterday's gaps stay hidden today.
- **A step a day** ([progress.ts](progress.ts)): "I said it today" moves on once per local calendar day. Missed days
  cost nothing. Step back, Start over and Remove are always there.
- **Peeking** ([FadedVerse.tsx](FadedVerse.tsx)): a gap is a button; pressed, it shows its word and stays a button.
  The verse is one keyboard stop; arrow keys, Home and End move between its gaps. The verse is `lang="en" dir="ltr"`.
- **Keeping** ([storage.ts](storage.ts)): `localStorage["bp-scripture-memory"]` only, `{ v: 1, verses: [...] }`.
  Everything read is rebuilt field by field; days later than today are pulled back to today; a list written by a newer
  version is shown but never written over; a failed save is said on the page. Other open tabs follow through the
  `storage` event. **Export** downloads `bible-guide-memory-verses-YYYY-MM-DD.json` (ids, steps and two days per verse,
  no text, no name). **Import** reads a file of at most 1 MB in the browser and merges it: the further-along copy wins,
  at most 500 verses.
- **Privacy**: no account, no tracking, nothing in the address. The only requests are for the Berean book files the
  reader uses too.

| File | What is in it |
|---|---|
| [ScriptureMemoryPage.tsx](ScriptureMemoryPage.tsx) | The page: hero, the four shelves, every change to the list. |
| [Practise.tsx](Practise.tsx), [FadedVerse.tsx](FadedVerse.tsx) | The open verse, its actions, and the faded text. |
| [VerseList.tsx](VerseList.tsx) | My verses: counts and the windowed rows (`useRowWindow`, about 50 rows above and below the screen). |
| [KeepPanel.tsx](KeepPanel.tsx), [files.ts](files.ts) | Export, import, clear, the privacy text; reading a file and the import result sentences. |
| [steps.ts](steps.ts) | Each step's name and what it asks. |
| [verse.ts](verse.ts) | Choosing and checking a passage, loading its Berean text. |
| [art.tsx](art.tsx), [memory-art.ts](memory-art.ts) | Its picture on the tools hub, in the gospels colour. |
| [scripture-memory.css](scripture-memory.css) | Its styles (`sm-` classes). |

## Translation

All its words are JSX text, attributes, `label:` entries, whole template sentences ("Step {n} of {n}") or `plural()`
pairs, the forms `content/translation/extract.py --pages` collects (checked with `page_rules.strings_in` on every
file, and `english_build_check.py` names nothing here). The verse stays the English Berean in every language.

## Checks

`npm test` runs [fade.test.ts](fade.test.ts), [progress.test.ts](progress.test.ts), [storage.test.ts](storage.test.ts)
(damaged, hostile and future data, blocked or full storage, export shape, import refusals and merge),
[verse.test.ts](verse.test.ts) (references, refusals, every starter verse loaded from the real Berean files) and
[ScriptureMemoryPage.test.tsx](ScriptureMemoryPage.test.tsx) (adding, refusals, a step a day with fake dates, peeking
without losing focus, the list, export and import, Try again, remove and clear, the registry entry).
