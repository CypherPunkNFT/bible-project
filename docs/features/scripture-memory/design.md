# Scripture memory helper: design

Sequence 41, step 10 (orchestrator job 861, 2026-11-09). The idea: *pick a verse; its words fade out day by day until
it is known by heart. Progress is saved only in the browser, with export and import; no account, no tracking.*
(BibleProject/PROPOSED-IDEAS.md, "Tools, sequence 41", batch 3.)

It is a tool, not a game. The Games page already has **Verse completion** (`src/pages/games/verse-completion/`), a
quiz with five review boxes and typed answers. This tool does the other half of memorising: daily reading aloud with
fewer words on the page each day. The page links to the game for anyone who wants a typed test.

## 1. Where it lives

| What | Where |
|---|---|
| Address | `/scripture-memory` (route in `src/App.tsx`, title in `src/lib/page-head.ts`) |
| Code | `src/pages/scripture-memory/`, every file its own, `sm-` CSS classes |
| Tools hub | one entry in `src/pages/tools/registry.ts`: slug `scripture-memory`, live, category `study`, a tone no other study tool uses, picture in the tool's own folder |
| Storage | `localStorage["bp-scripture-memory"]`, nothing else |

## 2. Choosing a verse

- A reference box read by the citation generator's parser (`src/pages/citation-generator/parse.ts`, imported, not
  copied) against the Berean's books, so "jn 3:16", "Ps 23:1-3" and "1 Cor 13:4–7" all work and its error sentences are
  reused.
- Accepted: **one passage inside one chapter, with verses, at most 8 verses**. A whole chapter, a list, or a range
  across chapters gets one plain sentence saying what is accepted. Verses the Berean lacks (Matthew 17:21) are
  refused after loading: "The Berean Standard Bible has no text for …".
- Twelve starter verses as one-tap buttons (John 3:16, Psalm 23:1, Proverbs 3:5–6, Philippians 4:13, Romans 8:28,
  Joshua 1:9, Isaiah 40:31, Jeremiah 29:11, Matthew 11:28, Romans 3:23, Ephesians 2:8–9, 2 Timothy 3:16), stored as
  verse ids.
- Adding a verse already in the list just opens it.
- At most 500 verses are kept; adding past that is refused with a sentence.

## 3. The fading

- Words are the verse split on spaces; punctuation stays attached to its word, so a hidden word hides its comma too
  but the gap keeps the word's length (`min-width` in `ch`).
- Six stages, one per day: hidden share **0, 20, 40, 60, 80, 100 %** (stage 0 to 5), then **Known by heart**.
- Which words go is a fixed order per passage: a seeded shuffle (mulberry32) of word positions, seeded from the
  passage's ids, so a word hidden on day 2 stays hidden on day 3 and every device shows the same gaps. The first word
  is hidden last, so the start of the verse is a cue until the final day.
- A hidden word is a button: tap or Enter shows it (stays shown until the stage changes or "Hide again"). Its name for
  screen readers is "Hidden word 4 of 25, press to show". "Show every word" shows them all for a moment's check.
- The reference is never hidden.

## 4. Day by day

Per verse: `{ from, to, stage 0–6, added, last, known }`, days as local calendar day numbers (`calendarDay` from the
game's `boxes.ts`, imported, so a daylight-saving change never moves a day).

| Action | Effect |
|---|---|
| **I said it today** | If not yet done today: stage + 1 (max 6), `last` = today; at 6, `known` = today. Done today already: nothing changes, the page says "Done for today. Come back tomorrow for the next step." |
| **Step back** | stage − 1 (min 0). Allowed any time, does not touch `last`. |
| **Start over** | stage 0, `known` 0. |
| **Remove** | drops the verse (asks first). |

No automatic penalty for missed days: the verse waits where it was. A known verse can still be practised (all words
hidden) to keep it fresh; that only updates `last`.

## 5. Storage, export, import

- `browserStore()` probes `localStorage`; when it is blocked the page still works for the visit and says progress
  will not be kept.
- The record is rebuilt field by field on every read (bad entries dropped with a console warning, never thrown), so
  hand-edited or damaged data cannot break the page. Every change re-reads the stored record first and applies the
  change to it (two tabs do not overwrite each other's verses).
- **Export** downloads `bible-guide-memory-verses-YYYY-MM-DD.json`:
  `{ "kind": "bible-guide-scripture-memory", "v": 1, "exported": "<ISO date>", "verses": [ … ] }`. It holds verse ids
  and progress only, no verse text, no name.
- **Import** reads a chosen file in the browser (`FileReader` / `file.text()`), max 1 MB, must parse as JSON with that
  `kind`; entries go through the same rebuild. It **merges**: a verse not in the list is added; a verse in both keeps
  the one further along (higher stage, then later `last`). The page then says "Added 3 verses, updated 1, 4 already
  up to date." A file that is not an export is refused with a sentence; nothing is changed.
- **Clear all** (asks first) removes the key.

## 6. Page

Tools-hub design (the games' hero and numbered shelves, `games.css`), like the converter and tithe calculator:

1. **Choose a verse**: reference box, Add, starter buttons.
2. **Practise** (when a verse is open): reference, stage meter ("Day 3 of 6"), the faded text (`lang="en"`, Berean),
   the four actions, a status line (`role="status"`), "Read in context" link to the reader.
3. **My verses**: counts (verses, known, ready today), filter (All / Ready today / Known by heart), rows windowed with
   `useRowWindow` (about 50 rows drawn above and below the screen, the rest drawn as the reader scrolls). A row opens
   that verse in Practise. Verse text loads only for the open verse.
4. **Keep your progress**: Export, Import, Clear all, and the privacy text.

Selected verse is not put in the address. Nothing is sent anywhere except the request for the Berean book file the
reader uses too.

## 7. Translation

All fixed words are JSX text, attributes, or whole template sentences, the forms `content/translation/extract.py
--pages` collects; checked with its `strings_in` and `english_build_check.py`. Counts use whole sentences per case
(no pieced plurals). The verse text stays the English Berean in every language.

## 8. Tests

- `fade.test.ts`: the share per stage, cumulative gaps, first word last, same order every time.
- `progress.test.ts`: one step per day, nothing twice a day, step back, start over, known.
- `storage.test.ts`: rebuild from damaged data, blocked storage, export shape, import merge rules and refusals.
- `ScriptureMemoryPage.test.tsx`: add by typing and by starter button, refusals, faded text, I said it today
  (once per day; next day with fake time), peek a word, list and opening a row, export download, import merge,
  nothing sent but Berean files, the registry entry live with a route.

## 9. What the three reviews changed (before any code)

Reviewed 2026-11-09 by three agents: security and correctness, reliability, and platform and edge cases. No finding
was left open; where this section and the sections above disagree, this section is what was built.

- **Words** are split with the Verse completion game's `words()` (`src/pages/games/verse-completion/words.ts`), not on
  spaces: dashes ("salvation—whom") and lone quotes are handled and the Bible's own text is kept exactly.
- **How many words hide**: stages 1–4 hide `min(n − 1, max(stage, round(share × n)))` words, stage 5 hides all, so
  "Jesus wept." still fades one word at a time. The order is a seeded hash of each word's position (not a shuffle), so
  a later change in the text's word count moves only the words added or removed. The first word goes last.
- **Hidden words** stay buttons when shown (`aria-pressed`, the word as its name), so focus never drops. The verse is
  one keyboard stop: arrow keys move between its gaps (left and right in reading order, as the verse is English).
  Their screen-reader name is "Hidden word, show". At least 3ch wide and 24px tall. The verse block is
  `lang="en" dir="ltr"`, so a right-to-left site language still sets the English verse correctly.
- **Size**: one passage in one chapter, at most 8 verses **and** at most 150 words. A verse the Berean does not have
  (John 3:99, Matthew 17:21) refuses the whole passage with "The Berean Standard Bible has no verse …"; a file that
  failed to load is a different message with **Try again**, never read as a missing verse. A verse is added only once
  its text has loaded. Repeated text from a ranged verse label is shown once.
- **Day rule**: one step when `today > last`; `today` is worked out at each press, so a page left open past midnight
  is right. Stored days later than today (clock moved back, an import from a device ahead) are clamped to today on
  reading. Practising at 23:59 and again at 00:01 is two calendar days and two steps; the page says "one step per
  calendar day". After a same-day **Step back**, the next step forward is tomorrow, and the page says so.
  The meter says **Step 3 of 6**, not "Day", since days without practice do not count. `known` is not stored: stage 6
  is known.
- **Storage**: every save reports success; a failed save shows in the status line with a nudge to Export. The record
  carries `v`; a record or file from a newer version is shown but never written over, with a sentence. Other open tabs
  follow along through the `storage` event, and an action on a verse another tab removed does nothing.
- **Import**: `file.size` checked (1 MB) before reading; only safe whole numbers; the same book and chapter, `to ≥
  from`, at most 8 verses, a book and chapter the Berean has; entries kept in an array and every unknown field dropped
  (no keys copied from the file into objects); duplicates collapse to the further-along copy; the 500-verse cap is
  applied after the merge and one write saves it all. The result is one whole sentence per count
  ("Added 3 verses.", "1 verse was further along in the file and was updated.", "2 verses were already up to date.",
  "4 entries could not be read and were skipped.", "5 verses were not added: the list is full."). The text beside
  Import says a verse keeps whichever copy is further along, so an older file can bring back progress after Start over.
- **Export** holds the export date (local date only) and each verse's ids, step and the days it was added and last
  practised; the privacy text says practice dates are in the file. File name from the local date. The object URL is
  revoked afterwards. Everything the visitor typed or a file carried is shown only as React text.
- **List**: no filter (YAGNI), the counts only. Rows still windowed with `useRowWindow` as the brief asks; opening a row
  scrolls to and focuses the Practise heading.
- **Missing pieces** added: README, `art.tsx` and `memory-art.ts` in the tool's folder, and a test that loads every
  starter verse from the real Berean files.
