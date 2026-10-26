# Bible Guide tests — a catalogue of real tests, a proper test header, and a children's tests page

**Status (2026-10-23): plan; the owner's answers are under "Decided" at the end. Waiting on: the question-writing run
now under way, before the level rating; and the search for open children's question sources.** Built so far: the questions
page's banner asks only How hard (Gentle, Steady, Deep) and how many, the lengths following the level (Gentle 10/20/30,
Steady 15/30/45, Deep 25/50/75). Nothing else is built.

Asked for by the owner on 2026-10-23:
- "Test yourself" needs a much better top. A Hebrews test should say it is the Hebrews book test, with a title, two
  sentences about the test, and marks for how hard and how many questions.
- Are the tests catalogued?
- The main tests go by Gentle, Steady and Deep. **Children's tests are different**: a "Children's tests" button at the
  top of the questions page, beside browsing the questions, opening a children's test page with a curriculum of our
  own, starting from the children's material we already have.

## Update 2026-10-24
- **The rating is done.** Another chat rated every shown question on 2026-10-23 (commit 19c0b8ac3,
  [README](../checks/README.md#how-hard-each-question-is)): `level` easy / medium / hard for teens
  and adults, and `children` true when a Sunday-school child of about 6 to 11 could answer it. 11,030 rated: 2,516 easy,
  5,233 medium, 3,281 hard; 2,727 suit children ($16.92 at list price). Step A1 below is therefore done.
- **Children's page mock-up built:** /children_mockup on the preview, four directions (A the path, B the cabinet,
  C this Sunday, D two shelves), one lesson panel, from Hurlbut's 88 lessons and A Catechism for Young Children.
  Owner's pick (2026-10-24): a mix, version E: the parts on top, the chosen lesson large below them, the path underneath.
- **The young children's catechism now on the site is the Presbyterian one** (sacraments, who takes the Lord's Supper).
  Swap it for the Baptist *Catechism for Little Children* (1864, downloaded) once that is extracted.

## Where things stand (counted 2026-10-23 from the site's question bank)

- **10,994 questions can go in a test** (they read well on their own). 11,043 are shown on the questions page.
- **There is no list of tests.** A test today is a filter plus a random draw, made up when the page opens. Its top
  says "Test yourself · One question at a time, and every answer opens the verse it comes from", whatever the test is.
- **What can be tested today:**
  - 59 themed tests on four shelves (Lives, Stories, Teaching, Know your Bible), defined in
    [themes.ts](../../../src/pages/questions/test/themes.ts). Smallest: Noah and the flood, 47 questions.
    Median 182, largest 1,033. 54 of the 59 have 75 or more.
  - 66 book tests. Smallest: 2 John (10), 3 John (11), Philemon and Jude (17). Hebrews has 189. 42 books have 75 or more.
  - Chapter tests: 1,182 chapters have a question, but only 437 have 10 or more, 27 have 25 or more and 3 have 50.
  - Anything else chosen on the questions page (a topic, a search, a Testament) also opens a test.
- **No question says how hard it is.** The banner's "How hard" changes nothing in the draw yet.
- **Children's material already in the bank** (about 1,000 questions once repeats are set aside):
  - *Hurlbut's Bible Lessons for Boys and Girls* (1903): 902 questions in **88 lessons that walk through the Bible in
    order** ("The Beautiful Garden", "The Earliest People", "Abram", "Abram and Lot"…). This is a ready-made
    backbone for a curriculum.
  - *300 Bible Trivia Questions for Kids*: 289 questions, no lessons.
  - *A Catechism for Young Children*: 143 questions and answers.

## Part A — the main tests (teens and adults)

### A1. Rate every question once (a batch job)
**Done 2026-10-23 (owner's ask, in the question-writing chat):** all 11,030 shown questions carry `level` = `easy` /
`medium` / `hard` (read here as Gentle / Steady / Deep) and `children` = true/false, set by Claude Opus at low effort
from the question, answer and choices, 40 to a call, $16.92 list: 2,516 easy, 5,233 medium, 3,281 hard; 2,727 suit
children. Kept in [difficulty.json](../checks/difficulty.json), tied to the wording rated, applied by the build; see
"How hard each question is" in `Website/content/questions/README.md`. The plan below is kept as it was written.

Each question gets one mark, read by an AI from the question, its answer and its verse: **1 Gentle** (well-known
stories and names), **2 Steady** (some detail), **3 Deep** (small details, lesser-known books).

Run through BatchRunner ([README](../../../../../../Tools/BatchRunner/README.md)): the cheapest model that rates well (Haiku
first), about 50 questions per call, about 220 calls. Try 3 calls first, read the ratings, then quote the full run as a
share of the Max plan before starting it. The mark is saved beside the question in the bank (`level`) and kept when the
bank is rebuilt, like the audit and the tags are.

### A2. Predetermined tests, by level (owner, 2026-10-23: "predetermined tests, not random fresh every time")
Every test is a fixed list of questions, the same each time it is taken, so scores can be compared and each test can be
checked once. For each subject (a book, a theme, a chapter) and each level, the questions are packed into numbered tests
of the offered lengths, without repeating a question between tests of the same subject and level where the pool
allows. Gentle tests hold level-1 questions; Steady, levels 1 and 2; Deep, mostly level 3 with some level 2.

### A3. The list of tests (the catalogue)
One file, `content/questions/tests.json`, built by a script from the rated bank. One entry per test:
- **id**, **kind** (book, theme, or the whole Bible / Old Testament / New Testament), and the questions it draws on;
- **title** and **kind label**: "Hebrews" with "Book test"; "Moses" with "Lives · Leaders and judges";
- **two sentences** about the test, written once by an AI (a batch job of about 13 calls for about 130 tests), then
  read and fixed where needed;
- **how many questions it has at each level**, so the page knows which lengths it can offer.

A length is offered only when the test has **at least twice as many questions as the length**, so taking it again is
not the same test. Otherwise that box is greyed with "Not enough questions yet".

**Chapter tests go through the same process as every other test** (owner, 2026-10-23): rated, packed by level, with a
title and two sentences; a chapter too small for a length has that length greyed. Anything else chosen on the questions
page (a search, a topic) stays as "a test of your own" with a plain top.

### A4. The new top of the test page
```
← Back to the questions
BOOK TEST
Hebrews
Two sentences about this test, written for it: what it covers and what you will be asked.
[ ▮▮▯ Steady ]  [ 30 questions · about 10 min ]
```
The generic line ("One question at a time, and every answer opens the verse it comes from") goes.

## Part B — children's tests

### B1. A "Children's tests" button
At the top of the questions page, beside browsing the questions, a button that opens the children's test page.

### B2. The children's test page
Its own page, its own look (warmer, simpler, bigger type), with tests a parent or teacher can pick by **lesson**, not
by shelf. The children's lengths stay 10, 20 and 30 questions.

### B3. A curriculum of our own
0. **Search first** (owner, 2026-10-23): find free and openly licensed children's Bible question sources online, list
   them for the owner (source, kind, licence, size), and download only what he approves.
1. **Start from Hurlbut's 88 lessons** as the order: Creation to the early church. Each lesson becomes a children's
   test, with a title, two sentences for the parent, and its questions.
2. **Check the wording**: every children's question must read in the BSB's words, not the 1903 King James wording
   (the site's rule: fix a question to what the BSB says; hide only as a last resort).
3. **Fold in the kids' trivia and the young children's catechism** where they fit a lesson; the catechism can also be
   its own track ("What we believe"), question by question.
4. **Find the gaps**: lessons with too few questions, and stories Hurlbut leaves out. Write new children's questions
   for them the way the 6,670 site questions were written from the BSB, with every review: a separate batch job and cost.

### B4. Children's question sources found online (searched 2026-10-23; nothing downloaded)
Counts marked ~ are estimates from partly visible scan text. Pre-1929 books are public domain in the US and use King
James wording, which gets reworded to the BSB. "Share-alike" (CC BY-SA 4.0) means crediting the source and keeping the
same licence on what we adapt from it; the bank already carries one such source (the kids' trivia set, from
Ministry-to-Children).

| # | Source | What it is | Ages | Questions | Licence | Form | Doctrine | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | Manly, *The Child's Question Book on the Four Gospels* (Southern Baptist Sunday School Board, 1864) | Q&A through the Gospels; only Part I survives | young | ~515 | public domain | scan, poor OCR | Southern Baptist | good |
| 2 | *The Child's Scripture Question-Book* (American Sunday-School Union, 1870s) | short Q&A, whole Bible | younger classes | ~1,000–1,300 | public domain | scan, fair OCR | evangelical | good |
| 3 | Ministry-to-Children lessons (Tony Kummer) | review questions with answers at the end of each lesson | 3–12 | unknown (hundreds of lessons) | CC BY-SA 4.0 | clean web pages | evangelical | good; share-alike |
| 4 | *A Catechism for Little Children* (Baptist State Convention of North Carolina, 1864) | catechism, 18 lessons | young | 201 | public domain | clean text | Baptist | good |
| 5 | Boyce, *A Brief Catechism of Bible Doctrine* (1885) | catechism | 10–12 and up | 162 | public domain | clean text | Southern Baptist | good |
| 6 | Broadus, *A Catechism of Bible Teaching* (1892) | catechism, basic and advanced | older children | 244 | public domain | clean text | Southern Baptist | good |
| 7 | unfoldingWord, *Open Bible Stories* questions (2025) | Q&A on 50 Bible stories | all | ~500 | CC BY-SA 4.0 | structured data | evangelical | good; share-alike |
| 8 | *The Child's Bible Question Book* (Massachusetts Sabbath School Society, ~1880) | 52 lessons, Q&A | youngest | ~1,000+ | public domain | scan, fair OCR | Congregational | good |
| 9 | *The Child's Bible Question Book* (Methodist Episcopal Church South, 1881) | Q&A, Creation to Kings | children | ~800+ | public domain | scan, fair OCR | Methodist | maybe |
| 10 | Watts's Catechisms (1730 edition only) | four short catechisms | under 7 to 12 | ~300 | public domain | scan | Congregational | good; avoid the 1788 Priestley edition |
| 11 | unfoldingWord translation questions (whole Bible) | Q&A on every chapter | mixed, has adult material | large | CC BY-SA 4.0 | structured data | evangelical | maybe |
| 12 | yesudas *bible-quiz-app* (GitHub, 2026) | multiple choice, already tagged kids / teens / adults and by difficulty | tagged | ≥376 in Genesis | MIT | structured data | not stated; maybe AI-written | maybe |
| 13–18 | Cotton's *Milk for Babes*; Jessey's *Catechisme for Babes*; *The Mother's Scripture Question Book*; *The Peep of Day*; Watts's *Short View of the Whole Scripture History*; Matthew Henry's *Scripture Catechism* | small or old-worded catechisms and question books | various | 60–several hundred each | public domain / CC0 | mixed | various | maybe |
| — | *A Catechism for Boys and Girls* (1798); Huntington, *Three Stepping-Stones* (Episcopal) | | | | | | | skip |

## Order of work
1. Search for open children's Bible question sources; list them for the owner. (Under way.)
2. When the question-writing run now under way has finished: pilot the level rating (3 calls), show the owner 30
   rated questions, quote the full run. **Needs the owner's yes.**
3. Full rating run; save the marks.
4. Build `tests.json` with the predetermined tests for every book, theme and chapter at each level; write the
   two-sentence descriptions (pilot first); build the new top; grey out lengths without enough questions. Show the
   owner Hebrews, Moses and one chapter.
5. Children: the curriculum outline from Hurlbut's 88 lessons plus whichever new sources the owner approves; show it to
   him before building the page.
6. Build the children's page and the button; then plan new children's questions for the gaps.

## Decided (owner, 2026-10-23)
1. **Predetermined tests**, not a fresh random draw each time.
2. **No level-rating run yet**: another question run is still going.
3. **Chapter tests go through the same process** as every other test, levels included.
4. **Children's curriculum: search online for free and open children's Bible question sources first**, and see what we
   get.
