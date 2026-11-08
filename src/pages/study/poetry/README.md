# Hebrew poetry and biblical narrative (Academic study 13)

**Address:** /study/hebrew-poetry-and-biblical-narrative · **Folder:** this one · **Data build:**
[build-poetry-study.py](../../../../scripts/build-poetry-study.py) · **Research record:**
[13-hebrew-poetry-and-biblical-narrative.json](../../../../content/academic-research/13-hebrew-poetry-and-biblical-narrative.json) ·
**Design note:** [design.md](../../../../content/academic-research/13-hebrew-poetry-and-biblical-narrative/design.md) ·
**Brief:** [ACADEMIC_PAGE_RUN.md](../../../../../Pages/Topics/StudyPlan/ACADEMIC_PAGE_RUN.md), row 13 and its "Study 13" rule.

Status: built and checked on 2026-11-07 (sequence 28, step 8); not committed, not deployed, no hub card (the run's last
step wires cards and status).

**Direction (from the design note):** shapes in the text. Each part takes two or three verses and draws its device as a
shape in the lines themselves, with the Hebrew beside the Berean, so the pattern is visible before the explanation.

## Findings while building

- The record's verse list (42 verses) already carries `bsb`, `bsbLines` and, for the Old Testament, `hebrew`. Its
  examples cite more verses than the list holds (Psalm 29:2, Genesis 1:4, Genesis 37:33 …); the build takes those from
  `data/text/bsb` and `data/text/wlc` the same way the record's own script (add_poetry_text.py) did.
- The Hebrew is one string per verse; it has no line breaks of its own. Pairing it line beside line with the Berean needs a
  division, so the build divides it at the Masoretic accents (see "How the Hebrew is divided").
- Probing the held Leningrad text (2026-11-07) confirmed the record's acrostic facts from the letters themselves: Psalm 145
  has no verse beginning with nun; Psalm 25 has no qoph verse and no waw verse, and ends with an extra pe verse; Psalm 34
  (after its title verse) has no waw verse and ends with an extra pe verse; Psalm 119 is 176 verses, eight per letter in
  order; Lamentations 1 runs ayin then pe, Lamentations 2, 3 and 4 run pe then ayin; Lamentations 3 is 66 verses, three per
  letter; Lamentations 5 has 22 verses in no alphabetic order; Proverbs 31:10–31 runs the alphabet in order. Genesis 1
  says "good" in the Berean in verses 4, 10, 12, 18, 21, 25 and 31, and the Hebrew טוב stands in the same seven.
- Psalm 25:2 begins with alef, not beth; the beth is its second word. The record does not mention this; the page's
  computed column shows it as found in the second word.
- Judges: searching the whole Berean book, "did evil in the sight of the LORD" stands in exactly the seven verses the
  record names, and "no king in Israel" in exactly 17:6, 18:1, 19:1 and 21:25. In 19:1 the Hebrew has the words in a
  different order (ומלך אין בישראל, "and a king there was none in Israel"); the page says so.
- The flood's day-counts (Genesis 7:4 to 8:12) stand between verses 18 and 50 of the story's 79 (Genesis 6:9 to 9:19).
  The page shows this under the fifth chiasm test, without a verdict.
- The record's check note on the Berean's wording at Genesis 37:32 and 38:25 (marked corrected, with "the build should
  still confirm this"): confirmed. The build refuses unless the Berean says "examine" at both verses and the Hebrew has
  the same verb with נא at both.
- The held Leningrad text keeps marks the page does not show inside the lines: the paragraph signs (a lone פ or ס, some
  in mid-verse, as in Proverbs 10:1) and the inverted nun of Psalm 107. The page's Hebrew is the held verse without
  them; the tests compare against the held text with only those marks taken out.
- The site's build turns physical sides in CSS into logical ones (`text-align: right` becomes "end"). Inside a
  right-to-left Hebrew line "end" is the left, so the first build set the Hebrew flush left. The Hebrew's rules now name
  the start, which in Hebrew is the right; checked in the browser.
- Psalms 111 and 112 run the alphabet by half-lines: split at the atnach (and, in verses 9 and 10, also at the revia before
  it), all 22 letters come in order after the opening "Hallelujah". Psalms 9–10 and 37 are irregular at the verse level
  (Psalm 37's tav verse opens with "and"), so the page lists them with the record's note and does not draw a computed
  column for them.

## How the Hebrew is divided

The site's Hebrew (the Leningrad Codex, `data/text/wlc`) is one line per verse. The Masoretes marked every verse with
accents that show its pauses; the strongest inside a verse is the atnach (֑). The build divides a verse into lines only at
a word carrying a pausing (disjunctive) accent, and only into as many lines as the Berean prints for that verse:
- two Berean lines and one atnach: the verse is divided at the atnach;
- otherwise a table in the build names the last word of each line, and the build refuses the division unless that word
  carries a pausing accent and the lines join back into the verse exactly.
The division is the build's reading of the accents, not a line break in any manuscript; the page says so beside the pairs.

## What is built

Nine parts, in the design note's order. Each Hebrew line is `dir="rtl" lang="he"` in `var(--font-hebrew)`, set beside its
Berean line; a psalm title that the Hebrew counts inside verse 1 is set apart above the pair, marked "Title · in the
Hebrew, part of verse 1", and a verse numbered differently in the Hebrew says so in its caption.

- **Opening:** the study trail, LINE · FOLD · LETTER · SCENE · SILENCE in gold, the title with its turn, the scroll
  drawing and its motto, a figures bar whose four counts are the build's, the outcomes, the question, the chapters, and
  the site's stance beside the craft.
- **01 Parallel lines:** the record's four kinds as a list; the chosen kind's verses line beside line; five readers
  from Kimhi to Berlin on one line; metre; where poetry ends and prose begins.
- **02 Folds and frames:** Genesis 9:6 drawn as six Hebrew words with arcs joining the matching words; Isaiah 6:10 with
  the Hebrew and English words lit; the flood's counts drawn rising to "God remembered Noah" and falling, with the whole
  story beneath and the five tests beside it (pressing a test marks what it checks; none gives a verdict); Psalm 8 and
  Psalm 103 as frames; the refrain of Psalms 42–43 with the words that change lit, and Psalm 107's refrain.
- **03 The alphabet poems:** the eleven poems as a list; the chosen one as a column of the twenty-two letters, each slot
  holding the first Hebrew word of its line (read by the build), a gap drawn as a gap; Lamentations 1, 2 and 4 side by
  side so the order of ayin and pe shows; Lamentations 5's first letters in their real order; Nahum 1 at the edge.
- **04 Words that return:** "please recognise" lit in Genesis 37 and 38 with a thread between; "it was good" on the 31
  verses of Genesis 1; the Judges refrains on its 21 chapters. Every lit word was found by the build in the held text.
- **05 The storyteller:** the seven tools as story frames, the one for what is left unsaid drawn empty; each tool's
  verses whole verse beside whole verse (they are prose); 2 Samuel 11 as frames with one empty; art and history.
- **06 Into Greek:** Mark's sandwiches, Luke's preface and Mary's song, Paul's patterns (Berean only: the site holds no
  Greek here, and the page says so under each verse).
- **07 Claims and limits:** five claims, each with a question the reader answers; words to keep apart; how far the page
  reaches; who noticed what; the reading trail; the studies nearby; the closing question.
- **The sheet:** any reference opens its verses, Hebrew beside Berean, with a link to the Berean reader; a source opens
  what the record says was read of it.

The view lives in the address: `kind`, `test`, `poem` (1–11, default Psalm 145), `word`, `tool` (default "what is left
unsaid") and `open` (`ref:Psalm 19:1` or `source:<id>`). Unknown values fall back. The design note named them `device`
and `example`; the page uses one name per part instead, so each part keeps its own choice.

## How the data is built

[build-poetry-study.py](../../../../scripts/build-poetry-study.py) reads the research record, the site's Berean
([data/text/bsb](../../../../data/text/bsb/)) and the site's Leningrad Hebrew ([data/text/wlc](../../../../data/text/wlc/)),
and writes [poetry-data.json](poetry-data.json) (94,382 bytes): 175 verses under 115 references, 24 verses divided line
beside line, 11 alphabet columns. It refuses to write if the record's Hebrew or Berean for a listed verse is not exactly
the held text, if a Hebrew verse number is wrong, if a quotation is not word for word the Berean, if a reference does not
exist, if a line division would end where the Hebrew does not pause or would not join back into the verse, if a psalm
title does not match the Berean's superscription, if any computed fact the page states (the alphabet columns, the seven
verdicts, the Judges refrains, the flood counts, the lit words) no longer holds, or if a link leaves the site or names an
address the site does not route. `--check` fails if the data on disk is stale.

### Refusals proved (wrong inputs tried in memory, 2026-11-07)

Nothing on disk was changed; the record and the held texts were altered only inside the test run. All nine were refused:

1. The record's Hebrew for Psalm 19:1 with one letter changed: "the Hebrew differs from the Leningrad text".
2. The record's Berean for Psalm 19:1 with "glory" changed to "majesty": "the Berean wording differs from the held Berean".
3. The record's Berean lines for Psalm 19:1 run together into one: "the Berean lines differ from the held Berean".
4. The record giving Psalm 19:1 as Hebrew verse 1: "the record gives Hebrew verse 1, the Leningrad text's is 2".
5. A quotation "The heavens declare the majesty of God" (Psalm 19:1 · BSB): "is not word for word the Berean".
6. The held Hebrew of Psalm 145:14 no longer beginning with samekh: "verse 14 begins with mem, expected samekh".
7. The held Berean of Genesis 1:12 no longer saying "good": "the Berean at Genesis 1:12 does not have 'good'".
8. The held Hebrew of Genesis 9:6 losing one accent: refused, because the record's Hebrew no longer matches it.
9. Both texts of Genesis 9:6 losing that accent: "a line would end on [its third word], which carries no pausing accent".

## What the checks prove, and what they do not

They prove that every verse shown is the site's own Berean and Leningrad text, that each divided verse joins back into
the whole verse in both languages, and that each count and lit word on the page was found in those texts. They do not
prove that a division is the best reading of the accents (it is the build's, and the page says so), that the scholars'
views are summarised fairly (every outside source is "located, not read" in the record), or anything about manuscripts
beyond the Leningrad Codex.

## Which page this could be confused with, and why it is not

- **How Hebrew works:** that page keeps the language: letters, roots, verb forms. This page uses Hebrew only to show the
  shape of lines, the alphabet order and word order in two chiasms, and links there for the grammar.
- **How the Old Testament books were written:** that page owns sources and authorship. Here the flood mirror and the
  repeated scenes are reported as readings of form, and the authorship question is handed over in a sentence.
- **The glossed-page studies** (readers in the margins around a passage): here nobody surrounds the text; the marks are
  the text's own shape, drawn in the lines.

## Choices this page made that the owner may want to change

- No pictures: the record's three candidates (the Aleppo Codex, the Leningrad Codex, the Psalms scroll) all have an empty
  licence, and their three check notes about the licences are still open.
- Eight studies the record names as nearby have no page yet (The text of the Bible, The Bible and the ancient Near East,
  Why translations differ, The kinds of writing in the Bible, Scripture, Reading the Bible, The book of Psalms, The
  wisdom books); they are named with "not yet on the site" and no link.
- Alphabet-column slots open the Berean reader at their verse rather than the sheet, which keeps the data under 100 KB.
- On phones (under 640 px) the two fold drawings (Genesis 9:6 and the flood) are left out rather than shrunk; Genesis
  9:6 opens beside its Hebrew from the reference in the text, and the flood's counts stay as the list under the drawing.
- The build script is 737 lines, over the workspace's 500-line guide; it is one checked pipeline and was left whole.

## Checks run (2026-11-07, last pass after the final edits)

Re-run unchanged at 18:34 on 2026-11-07, after a completion checker could not see this folder: build, `--check`, 15 of
15 tests, eslint and the nine in-memory refusals all passed again. The live preview served the page (HTTP 200, its own
stylesheet from dist), with 45 paired rows and 63 Hebrew spans marked `dir="rtl" lang="he"`. In each of the first four
rows of Psalm 19 the Hebrew stood on the same line as its Berean line, to its right.

- `python scripts/build-poetry-study.py`: wrote the data; `--check`: "up to date".
- `npx vitest run src/pages/study/poetry`: 15 of 15 passed. Data tests: the data's hash matches the record; every verse
  equals the Berean in `data/plain/bsb` and, in the Old Testament, the Hebrew in `data/plain/wlc`; every divided verse
  joins back in both languages (Psalm 145:13's two lines with no Hebrew included); every label the page uses is
  supplied; each alphabet column runs the 22 letters in its poem's order, with Psalm 145's one gap at nun; Genesis 1's
  seven verdicts and the Judges refrain verses; hostile address values (`__proto__`, `<script>`, `ref:Psalm 999:1`, `0`,
  `12`, `1e9`, …) fall back; links stay inside the site. Render tests: all nine parts draw with no failed part; the
  Hebrew is `dir="rtl" lang="he"` beside a Berean line; Psalm 145 is drawn by default with one gap, another poem from the
  address; a reference opens Hebrew and Berean in the sheet and Escape closes it; a check note opens, closes the verse
  sheet first, and Escape closes it; a hostile address opens nothing.
- `npx eslint --max-warnings 0 src/pages/study/poetry`: clean. `tsc -p tsconfig.app.json`: no errors in this folder.
- Preview rebuilt with `node scripts/build-portable.mjs --preserve-output`;
  http://127.0.0.1:8931/study/hebrew-poetry-and-biblical-narrative serves the page from dist.
- Browser (Playwright on the preview, light and dark, 1440, 390 and 320 wide): no console errors, no failed part,
  nothing of this page past the right edge. A verse reference opens its sheet (the Hebrew in it, focus on Close) and
  Escape closes it with focus back on the reference; a highlighted passage opens its check note and Escape closes it; a
  focused, pressed kind button shows no outline and writes `kind=` to the address; Lamentations shows three columns; a
  chiasm test marks the drawing; under reduced motion the orbit's animation is `none`. Screenshots were looked at and led
  to five fixes: the Hebrew sat flush left (the logical-sides finding above), Hebrew lines sat far from their Berean lines
  on wide screens (now held to a reading width), New Testament lines ran together with no space, two works by Robert
  Alter both showed as "Robert Alter" in the reading trail, and the flood drawing's last two labels overlapped.
- **Not this page's fault, not fixed:** at 320 wide the site header's menu button sits about 29 px past the right edge;
  it is the shared header, which this job may not touch.
- **Not tested:** a screen reader; Safari and Firefox; touch devices; print.

## For the owner

- Five of the record's 28 check notes are still open (14 confirmed, 9 corrected). Two concern wording: Kugel's exact
  formula and its page, and Auerbach's "fraught with background" in Trask's 1953 translation. Three are the pictures'
  licences. They show on the page as open notes; none was edited here.
- The record's "how far this page reaches" still says nothing was counted by script from the Hebrew; the build has now
  counted it. The page keeps the record's sentence and adds a line saying what the build counted. A word for the record.
