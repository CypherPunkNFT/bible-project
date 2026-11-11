# How the Old Testament books were written: the page

Address: **/study/how-the-old-testament-books-were-written** (local preview: http://127.0.0.1:8931/study/how-the-old-testament-books-were-written).
Academic study 41, built 2026-11-07 by the Academic page run ([ACADEMIC_PAGE_RUN.md](../../../../../Pages/Topics/StudyPlan/ACADEMIC_PAGE_RUN.md), row 41).

**Direction, in one sentence:** each book argued in full is drawn as one ruler of its chapters, with gold diamonds above
the line where the book speaks of its own writing and open circles below where a later hand or a theory presses, so the
reader always sees the book's own witness first and the arguments second, on the same line.

Its words: [the research record](../../../../content/academic-research/41-how-the-old-testament-books-were-written.json)
(text settled, check marks settled). Its design: [design.md](../../../../content/academic-research/41-how-the-old-testament-books-were-written/design.md).

## Findings as the work went

(Written as the work went; see the sections below for the final state.)

- The record's `openQuestions` list looked broken at first (" in the Pentateuch lead.", "."), but it is not: 20 of its
  21 items are now a check marker with no words, which the shared check-notes piece draws as a small dot that opens
  the note. Most of those notes say the to-do is settled or "can be removed". The page shows the list folded away at
  the end ("The editor's open questions"), each dot opening its note. **For the owner:** once you have read the notes,
  the settled items can be cleared from the record.
- Most sources in the record carry no `url`, so they are listed without a link, as the run's rule asks.
- The build script was planned, then reviewed in three passes (security, reliability, edge cases) before it was
  written. The review's major points were taken: the check notes' own fields are left out of the checks (they quote
  superseded wording on purpose); a quotation must match as whole words, and one with an ellipsis part by part in
  order; `--check` ignores Windows line endings; chapter-only references ("Deuteronomy 34", "Isaiah 40–55") are
  checked against the chapters the Berean has; a range longer than 40 verses is shown in part with the rest left to
  the Bible reader, instead of failing the build.
- The data file holds no verse's words (the site's rule, `src/lib/verses.ts`): the build reads and checks the Berean
  text in memory and writes each reference's bounds only (book, chapter and verse to chapter and verse, and how many
  verses past the sheet's first 40 a long range runs). The page shows the words in the reader's own Bible, captioned
  with that Bible's name.
- The record's table has five parts, not three: Torah, Former Prophets, Latter Prophets, The Twelve and Writings.
  Two of its five claims carry no self-test (the claim that JEDP is a finding, and the Cyrus claim); the page shows
  a test only where the record has one.
- Many references in the record are bare ("(7:2; 8:1)", "(1:1 · BSB)") and take their book from the field they sit in.
  The script and model.ts state the same rule (a table row means its own book; Isaiah's and Daniel's sections mean
  that book; Ben Sira's and 1 Maccabees' records mean neither, so "(2:59–60)" is not linked to Daniel). A test checks
  that the page's finder and the script's finder find exactly the same references.
- First build: 127 references, all found in the Berean; 9 inline quotations marked as the Berean, all word for word.

## What is built

| File | What it does |
|---|---|
| [route.ts](route.ts) | Registers the address; picked up by [study-page-routes.ts](../study-page-routes.ts), so App.tsx was not touched. |
| [OtBooksPage.tsx](OtBooksPage.tsx) | The shell: the check notes' provider, the address (`book`, `mark`, `open`, `row`, `order`), one sheet at a time, focus back to what opened it. |
| [model.ts](model.ts) | The record and the generated data; the three rulers' marks; what the sheet can open; the table's two orders; the reference finder (same grammar as the script). |
| [Ruler.tsx](Ruler.tsx) | The signature drawing: one ruler of chapters per book, marks above and below the line, and the same marks as a list. |
| [Landing.tsx](Landing.tsx) | Trail, gold concept line, title and turn, drawing (scroll, stylus, clay tablet) with its motto, four figures with captions, outcomes, the site's stance. |
| [Pentateuch.tsx](Pentateuch.tsx), [Documentary.tsx](Documentary.tsx), [Isaiah.tsx](Isaiah.tsx), [Daniel.tsx](Daniel.tsx), [Darius.tsx](Darius.tsx), [BookTable.tsx](BookTable.tsx), [Claims.tsx](Claims.tsx), [Closing.tsx](Closing.tsx) | Sections 01 to 08, in the design note's order and with its headlines. |
| [Sheet.tsx](Sheet.tsx) | The record sheet (the shared sliding shell): a verse in the reader's Bible, a record in its three parts, a test for sources, a dated view. |
| [parts.tsx](parts.tsx), [context.ts](context.ts) | Section boundary, two-beat headline, the three layers' tags, research text through `<Checked>` with its references as buttons, three parts, quoted verse, the site's word, views. |
| [ot-books.css](ot-books.css) | Every class under `ob-` (checked unused elsewhere). Light and dark from the site's tokens; reduced motion; phones. |
| [ot-books-data.json](ot-books-data.json) | Written by [build-ot-books-study.py](../../../../scripts/build-ot-books-study.py); never edited by hand. |
| [ot-books.test.tsx](ot-books.test.tsx) | Data checks and render checks. |

The page's shape is the design note's first direction, "three bands, one book at a time": the five books, Isaiah and
Daniel each get one ruler of their chapters (187, 66 and 12, counted from the Berean itself). Above the line, gold
diamonds where the book speaks of its own writing (seven Moses verses; Isaiah's heading and four lines on foretelling;
Daniel's four "I, Daniel" verses). Below it, open circles where a later hand is seen or argued (the eight later-hand
records; Daniel 3's instrument names; Daniel 11's detail). Dashed cuts across the line where a theory proposes a
division (three of the four source tests, at the verse each one argues from; Isaiah 40 and 56; Daniel 7). Daniel's
Aramaic run (2:4 to 7:28) is a dotted bracket under its ruler. Each mark opens its record; the shapes differ and each
carries words, so colour never carries the meaning alone. Every block below the rulers is tagged with its layer: I the
book speaks, II later readers remember, III a modern reconstruction, always in that order.

## How the checks were run, and what they prove

- `python scripts/build-ot-books-study.py`: passes, writes the data. `--check`: passes (the data on disk is what the
  record and the Berean produce now). `--selftest`: twelve wrong inputs made in memory, each refused with its reason:
  an Isaiah line changed by one word; a quotation that is only part of a word ("yrus His anointed"); a verse that does
  not exist (Genesis 51:1); a chapter that does not exist (Daniel 13); a range that runs backwards; a listed phrase not
  in its verse; an inline Berean quotation changed ("written by the men of Hezekiah"); a study link that leaves the
  site (https://example.com); a study link to an address the site does not have; a source address that is not https;
  a test with two supported answers; a check marker with no note. The true record passes.
- `npx vitest run src/pages/study/ot-books`: 18 tests. The data is not stale (the record's hash); the page's reference
  finder and the script's find exactly the same 127 references; names that are not references stay words ("John J.
  Collins", "Bava Batra 14b–15a", "Sirach 48:22–25"); every reference is held as bounds only, the Berean has both its ends, and it has a Berean reader address;
  study links stay inside the site; every ruler mark sits inside its ruler and opens a record; a mark is anchored only
  where the record itself points; junk in the address falls back; 39 books in 36 rows in both orders, the Hebrew order
  grouped by part. Render: the heading and all eight sections draw; a verse reference opens the sheet in the reader's
  Bible and Escape closes it; a long range shows its first 40 verses numbered by chapter and counts the rest; a ruler mark opens its record; a highlighted passage opens its check note and closes the
  record sheet (one sheet at a time), and Escape closes it; a row opens from the address.
- `npx eslint --max-warnings 0 src/pages/study/ot-books`: passes. `tsc -p tsconfig.app.json`: no errors in this folder.
- The preview was rebuilt with `node scripts/build-portable.mjs --preserve-output` (never by hand) and the page opened
  from it at http://127.0.0.1:8931/study/how-the-old-testament-books-were-written in a headless Chromium (Playwright),
  light and dark, at 1440, 390 and 320 pixels wide: every section drew, with no console errors. At 1440 and 320, in both
  themes: Exodus 17:14 opened the sheet in the Berean's words and Escape closed it; a highlighted passage opened its
  check note and Escape closed it; a mark on Daniel's ruler opened its record and wrote it into the address
  (`?book=daniel&mark=…&open=…`). Nothing in the page is wider than the screen at any of the three widths.
- What the browser run found and fixed: a row whose text carries a check mark (the Talmud's line on the five books, and
  rows of the theory's history) was split across the row's grid, because the text was several pieces side by side; each
  is now one piece. The ruler's last chapter (Deuteronomy 34) drew its marks half outside the drawing; the drawing now
  keeps a small margin at both ends.
- At 320 pixels the whole document is 349 wide. The cause is a 34-pixel button in the site's shared header, outside
  this page: the home page, How the canon took shape and Egypt beside Israel measure the same 349. It is left for
  whoever owns the header.

- All of the above was run again at 17:22 on 2026-11-07, with the same results. The address on port 8931 returned the
  same bytes as `dist/index.html`, and the newest `OtBooksPage` files in `dist/assets/` carry this page's latest fixes.

**What they do not prove.** That a reference exists and a quotation is word for word does not prove that any reading
is right, or that a scholar holds the view the page gives him: the record itself says none of the scholarly books was
read for this draft. The checks do not compare Hebrew or Aramaic. A bare reference that sits in a field without a stated
book ("(2:59–60)" in 1 Maccabees, "(26:1–11)" after a chapter-only "20") is left as words and is not linked. Nothing runs
`--check` automatically before a release; the vitest hash test catches a changed record, not a hand-edited data file.

## Not tested

- Screen readers were not tried; the marks are buttons with words, and the ruler's list carries the same marks.
- Safari and Firefox were not opened; the browser checks above used the preview in Chromium only.
- A real phone was not used; the narrow widths were a desktop browser made narrow.
- All verse addresses use the Berean's English numbering (Daniel 4 and 6 differ by a verse in the Hebrew).

## The page it could be confused with

[Egypt beside Israel](../egypt/) also sets marks against a line. It is two rulers of years with threads between them;
this page is one ruler per book, of chapters, with points above and below and no threads. [How the canon took
shape](../canon/) is about which books belong; this page is about how each was written and links there for the list.
How the New Testament books were written (a sister page built at the same time) covers the New Testament.

## Links left for the run's last step

Only three neighbouring studies are linked by name, because only their addresses exist today: How the canon took
shape, The Dead Sea Scrolls, How Hebrew works. The record also hands over to Between the Testaments, The return from
exile, Israel from the exodus to Solomon, How the New Testament books were written, Hebrew poetry and biblical
narrative, The Bible and the ancient Near East, Baptist history and theology's Scripture, Daniel and Revelation, Isaiah
and Christ in the Old Testament. When those exist, add them to `NEIGHBOURS` in the build script and rebuild.
