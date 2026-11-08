# How the New Testament books were written (Academic study 42)

**Address:** /study/how-the-new-testament-books-were-written · **Built:** 2026-11-07, step 3 of the Academic page run
([ACADEMIC_PAGE_RUN.md](../../../../../Pages/Topics/StudyPlan/ACADEMIC_PAGE_RUN.md)) · **Research record:**
[42-how-the-new-testament-books-were-written.json](../../../../content/academic-research/42-how-the-new-testament-books-were-written.json) ·
**Design note:** [design.md](../../../../content/academic-research/42-how-the-new-testament-books-were-written/design.md) ·
**Data build:** [build-nt-books-study.py](../../../../scripts/build-nt-books-study.py)

**Direction, in one sentence:** a printed synopsis (Mark, Matthew and Luke set side by side in running text, the same
words underlined and the shared aside tied across the columns by one line with no arrow), then four maps of the
Synoptic question drawn at the same size so none looks like the page's answer. This is the design note's recommended
direction, built as written. The owner had not chosen between its three, so the choice is still the owner's.

The rest of the page follows the subject in order: the early witnesses as one vertical thread of named people, with
lost works drawn hollow; the quest for the historical Jesus as seven stages on one track; Paul's letters in three
groups with his signature and his scribe marked; five common claims tested, each in three parts; and all twenty-seven
books in one table, each date drawn as a range (two bars where evangelical and critical scholars differ), never as a
point.

*Findings are written here as the work goes.*

## The data build

`python scripts/build-nt-books-study.py` writes [nt-books-data.json](nt-books-data.json); `--check` confirms it is current;
`--prove-refusals` makes wrong inputs in memory and shows each is refused.

What it does:
- Takes the text of every verse the page shows from the site's Berean (`data/text/bsb`): the record's own list of 45
  verses, every reference written in the record's prose (69 of them, from "Mark 2:10" to "Acts 16:10–17; 20:5–15;
  21:1–18; 27:1–28:16"), the reference table's bracketed references read against the row's book ("Romans … (16:22)"),
  and the six synopsis passages. 235 verses in all. The record itself quotes no verse (its `versesNote` says so); the
  page quotes only what the build supplies.
- Checks every quotation the record sets beside a reference against the Berean at that reference (7 such quotations).
- Marks the shared wording of each synopsis case word by word: a word sits in a run of four words that every other
  column also has (strong), that some other column has (faint), or neither. The tie (the narrator's aside "said to the
  paralytic"; the Baptist's "brood of vipers, who warned you to flee from the coming wrath?"; "THE KING OF THE JEWS") is
  checked word for word in each verse it ties. This compares the Berean's English, and the page says so.
- Reads each reference-table date as ranges by a stated rule, never as points: "50s–60s" is 50–69; "80–90" is 80–90;
  "early 60s" 60–64; "mid-60s" 63–67; "about 57" a soft bar 55–59; "before 70" a soft bar 60–70; "early second
  century" 100–130; Philemon "with Colossians" takes Colossians' bar. Where the date has " / ", the first range is the
  one most often argued by evangelical scholars and the second the common critical one (the record's own rule, in
  `dates.note`). Words the rule cannot read ("later" for James, "earlier if from Ephesus" for Philippians) are shown
  in words and not drawn.
- Links four of the record's fourteen related studies, because only those have an address the site already has
  (checked against App.tsx): How the letters came to be, How the canon took shape, The manuscripts of the Bible, How
  New Testament Greek works. The other ten are shown by name without a link.

### It refuses (run 2026-11-07, `--prove-refusals`)

Every one of nine wrong inputs was refused, and nothing was written:
1. a quotation that is not the Berean's ("I have finished the race" set beside Acts 28:31);
2. a reference the Berean does not have (Mark 16:21);
3. a passage that runs backwards (Matthew 3:10–7);
4. a synopsis passage that no longer holds its tie (Mark 15:27 in place of 15:26);
5. the reference table out of canonical order (Romans and 1 Corinthians swapped);
6. a date that cannot be read as a range ("sometime");
7. a verse whose book code does not match its label (LUX for Luke 1:1);
8. a source id the record does not list;
9. a link that leaves the site (https://example.com/canon).

## Findings while building the page

- **The synopsis line first crossed the words.** Columns of different lengths put the tied verses at different
  heights, so the line joining them ran diagonally through the text. Each column is now four rows (its heading, the
  verses before the tie, the tied verse, the verses after), so the tied verses of every column start on the same line,
  as a printed synopsis sets them. The line runs in the space under that line of text, from the rightmost tied word
  of one column to the first tied word of the next. Where the columns are stacked (720 px wide and below, and the
  four-notice case below 960 px) no line is drawn: the underlines carry the tie on their own.
- Paul's lead sentence names his signature and his scribe in one sentence with semicolons; the page reads it clause by
  clause, so "his own hand" marks 1 Corinthians, Galatians, Colossians and 2 Thessalonians and "names its scribe"
  marks Romans. A test pins this.
- The build's first full site rebuild, and one later rebuild, stopped because another job was writing the site's
  reading index at the same moment (its write lock was held). The retries, a minute later, finished; nothing of the
  other job's was touched.

## Checks (run 2026-11-07, after the last change)

| Check | Result |
|---|---|
| `python scripts/build-nt-books-study.py` then `--check` | data current, exit 0 (prints the one known Acts 1:1 note) |
| `--prove-refusals` | all nine wrong inputs refused, nothing written |
| `npx vitest run src/pages/study/nt-books` | 15 tests passed |
| `npx eslint --max-warnings 0 src/pages/study/nt-books` | no warnings, exit 0 |
| `node scripts/build-portable.mjs --preserve-output` | exit 0; the page is served from the built site at http://127.0.0.1:8931/study/how-the-new-testament-books-were-written |
| Browser, 1440 / 390 / 320 wide, light and dark (six runs) | no console errors or warnings; nothing of this page past the right edge; the first synopsis reference opens its verses in the sheet, focus moves into it, Escape closes it and focus returns to that reference; a highlighted passage opens its check note and Escape closes it |

What the tests cover: the data was built from the record as it stands now (its hash); every reference written in
the record resolves and has Berean text; every synopsis column holds its tie; all twenty-seven books appear once, in
order, with every bar inside the axis and taken from the row's own date words; links stay inside the site and use
the record's titles; every map arrow joins two of its own nodes; an address asking for something unknown falls back
to the default view; the page draws every section with no failed section and no raw check marker; a case chosen in
the address is shown; a map appears only once chosen; a reference opens and Escape closes its sheet; a check note
opens and closes this page's own sheet first.

**What the checks do not prove:** that any reading, date or attribution is right; that the English underlines
reflect the Greek (the page says so beside the synopsis); that a screen reader announces the page well (only roles
and labels were checked, not with a real reader); keyboard-only travel through the whole page; any browser but
headless Brave (Chromium); print. Screenshots were looked at for the synopsis (the aside and the notice cases; the sermon case was not re-shot after the last layout change), witnesses, letters, quest
track and table at 1440 (dark); the synopsis and table at 390 (dark); and the opening at 390 (dark) and 320 (light).
Not every section was looked at in every width and theme.

**Found outside this page:** at 320 px the site's shared top bar is 29 px wider than the screen (its menu button
sits past the edge). The study hub at /study does the same, so it is not this page's; shared components are outside
this step's boundary.

## Pages it could be confused with, and why it is not them

- **How the canon took shape** sets three early lists of books side by side in columns. Those columns are lists, each
  cell a judgement on a book. Here the columns are running text read line by line, tied word to word; the comparison
  is inside sentences, not between lists.
- **How the Old Testament books were written (study 41)** draws each book as one ruler of its chapters with marks
  above and below. Nothing here is a ruler: the shapes are text columns, equal maps, a vertical thread of people, a
  track of stages and range bars.
- **The gospel harmony** (on /study/gospels) lines up all four Gospels to tell one story in order. This page sets out
  only three short cases, to show the shape of the Synoptic question, and does not harmonise.
- **New Testament history (study 43)** draws reigns as bars on lanes of rulers. The bars here are books' dates, one row
  per book, with no rulers.

## For the owner

- **Ten of the fourteen related studies are shown by name only.** The record lists fourteen studies to go to next; only
  four have an address the site already has, so only those four are links. The other ten get a link once their pages
  exist and are registered.
- **One sentence promises figures the page does not give.** The record's note on the material all three Gospels share
  ends "the exact figures depend on whether one counts verses, words or episodes, and are given by the build from a
  stated counting rule". No build gives them: the record names no published count it has read, and its own check note
  (c1) says a figure may be printed only from the Carson and Moo pages actually read, with the counting rule stated.
  So the page prints no figure, and the three rings are not sized (the page says the areas mean nothing). The text is
  settled, so it is shown as written. Either trim the sentence to end at "or episodes", or add the read figure and
  rule to the record.
- **The direction is the design note's recommended one,** chosen without the owner, as the note says. It can be
  overturned on sight.

- **One quotation in the record is not the Berean's wording.** Acts' evidence says Acts "begins by recalling “the first
  account” to Theophilus (Acts 1:1)". The Berean reads "In my first book, O Theophilus". The page shows the record's
  words as written (the text is settled and not this step's to change); the build lists it as a known mismatch and
  will fail once the record is corrected, so the exception cannot outlive the fix. Suggested wording: "recalling “my
  first book” to Theophilus".
