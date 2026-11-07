# Prayer in the letters: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job a8796a3926b94c2cb6065857ee70426c · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/prayer-in-the-letters-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/prayer-in-the-letters/content.md) · Design: [design.md](../../content/studies/christian-life/prayer-in-the-letters/design.md)

A Scripture & Theology study in Living the Christian Life, section 2. Its one new move: **each prayer read from the bottom up**, as a thread rising from thanks through a request and each "so that" to where it arrives. Six reported prayers stand side by side that way. Then each of nine passages is kept whole and only broken into lines that step in at each "so that". Around them: three requests about circumstances and where each goes, six older lines beside lines in these passages, three more prayers to follow unaided, and six hard questions.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) for reading the texts, takes the study's content.md, [study_lists.py](study_lists.py), the site's Berean text and the held Calvin, Barnes, Jamieson-Fausset-Brown, Boyce, Wesley and creed files, checks them, and writes [data.js](data.js). Change the words in content.md and run the script. `--check` runs the same checks and fails if data.js is out of date; its fingerprint covers only this study's own inputs, so another job editing a shared frame file cannot make this page read as stale.

Only one direction was built, not the three or four the standard asks of a brand-new study: this is an existing draft, as with the earlier mock-ups. The script is a further near-copy of the same build script, because this job may not change the earlier folders. Frame and sheet styles are borrowed, read-only, from the Authors and Manuscripts mock-ups.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used, by a closed list of keys for each section; every block quotation is word for word the Berean at its reference; every reference resolves with no gap; each quoted phrase is in the reference that belongs to it, or one paragraph of its named source, or the named confession list; the lines of each passage join back to exactly its Berean text; each labelled phrase occurs exactly once in its verse, so the wrong one cannot be labelled; each station in a column lies inside a phrase of the same kind, in verse order, and each column finishes on where it arrives; each of the six columns says "so that"; the nine passages, six columns, six reported prayers, three to try, three circumstances, six older lines and six questions are counted; source links are https or a site page; page files are the expected ones, with one `innerHTML` for the fixed drawings and no inline script or handler.
- **Not checked by script:** whether a label is right, whether a reading is right, or whether a pairing is right. The commentary files are checked whole, not comment by comment, so a quotation from another comment in the same file would pass. Five Baptist Faith and Message phrases, from Articles 2, 4, 5 and 17, are not in any file the build reads; the build lists them each run. They were compared on 2026-10-30 through a web tool that returns extracts, and someone should compare them by eye before release.
- **Refused on purpose:** 16 wrong inputs were each tried on a temporary copy and refused: a phrase not in its verse, a phrase occurring more than once in its verse, a station outside its labelled phrase, a column arriving nowhere, a false claim of shared words, an http link, a `javascript:` link, `innerHTML` outside the one place allowed, an inline script, a misquoted verse, a misquoted source, a changed block quotation, a reference that does not exist, readings out of order, an unknown key and an unknown heading. The tests are not kept in this folder.
- **By browser against the always-on preview:** all automated checks passing on the last run. At 320, 390, 620, 768, 1100 and 1440 wide, with 390 and 1440 in both themes: nothing past the right edge, no console errors or failed files, every button at least 44 pixels tall. Also: a passage and a question opened on the sheet, the way back from one to the other, closing by button, Escape, outside click and two quick clicks, Back, focus returned, opening straight from a link, a wrong address ignored; the six readings, arrow keys with one tab stop, Enter, and focus moving to the reading's heading; the verse line keeping its height; columns reading from the bottom up; reduced motion and pause; a phone-sized touch screen with the columns scrolling sideways; a clear message when data.js is missing.
- **Not tested:** 200% zoom, a screen reader, measured colour contrast, a real phone.

## The three plan reviews

Security and correctness, reliability, and principal-engineer reviews were run on the plan, before any code. Decided here:

- **Broken into lines, not marked up.** The first plan drew five kinds of mark with a filter, close to what Faith under pressure already does. Stepped lines are this study's own, need no state, and leave every word in its order.
- **"Stands on" became a written note.** "What gives confidence" and "For whom" are written beside each passage, because marking one verse as what a prayer rests on claimed too much.
- **Drawings dropped from section 03.** A road, a door and a quiet life are three small written climbs.
- **Say what the top row is.** The columns do not all arrive at the same place, and where a passage stops is where this study cut it. The page says both, and no longer claims the prayers end "not on the readers".
- **Stricter checks.** A repeated phrase in a verse is refused, and a source can be told in the site's words with no quotation, for the 2012 statement.
- **Engineering.** All six readings are built once and only shown or hidden. Choosing a reading from deep in the text brings its top into view at once. The verse line keeps its height, so nothing jumps. The column strip has a focus outline and shows the next column peeking. Touch screens hide the pointing line.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 2, 4, 5 and 17 quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | On 1 Timothy 2:4, Boyce, the 2012 statement, Calvin and Wesley are shown and the page does not choose |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means |
| 7 Claims marked | ✓ | "This study reads", named sources and flagged notes are labelled where they come |
| 8 Precision | ✓ | The selection note says what is left out and what the checks cannot prove |
| 9 Hard questions | ◐ | Six faced. On Ephesians 1:17 no writer holding a second view was looked for, and the page says so |
| 10 Complete or says so | ✓ | The selection note names what is left out |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "Prayer in the letters mock-up" |
| 12 Own shape | ✓ | The rising columns and the stepped lines |
| 13 Three depths | ◐ | The column, the whole passage, the verse. No separate page per passage |
| 14 Parallel parts, card anatomy | ✓ | One column form, one leaf form, one reading form |
| 15 Dense, compact | ✓ | One reading shows at a time, and second passages stay closed unless the reading is about them |
| 16 Joined up | ◐ | View in the address, one sheet, a link back to the field. Related studies are partly mock-ups only, and the page says which have no page yet |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Words carry every meaning. The columns are text in a list, read in order by a screen reader |
| 19 Art | ◐ | The leaf and thread are a first pass for the owner's eye, captioned as illustrative |
| 20 Colour | ✓ | The letters' gold and ink only; each kind of line differs by its word and shape |
| 21 Approved, not ruled out | ✓ | Type, fine rules and one tinted leaf |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | Colossians 4:2 opens the page, and Ephesians 3:14–21 closes it |
| T2 Says, means, respond apart | ✓ | Text, then labelled readings, then Reflect · your response |
| T3 Scripture on Scripture | ✓ | The six columns read one another, and the older lines say how close each is |
| T4 Way of reading | ✓ | Don't stop at the request: taught on the columns, tried in section 05, stated in the close |
| T5 Scripture's form | ✓ | Every passage whole and in order; reported prayers and instructions to pray are told apart |
| T6 Voice and ending | ✓ | |
