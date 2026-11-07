# The hope to come: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job b360ecc5a09547ed969e683837e5f3cc · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/the-hope-to-come-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/god-and-christian-faith/the-hope-to-come/content.md) · Design: [design.md](../../content/studies/god-and-christian-faith/the-hope-to-come/design.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

A Scripture & Theology study. Its one new move: **three questions for any passage about the end**: what is promised, what does it ask of you now, what does it leave open. Then a table of promises tied to calls, a table from the Bible's first pages to its last, and four orders of events lined up on Christ's return, shown without choosing.

## How it is built

[build-data.py](build-data.py) reads the study's content.md, the site's Berean text, the held Calvin and Boyce files and the site's copy of the Abstract of Principles, checks them, and writes [data.js](data.js). Change the words in content.md and run `python design/the-hope-to-come-directions/build-data.py` from `Website/`. The promise rows, first-to-last rows, order-of-events strips, the facts the page states and the sources are lists in [study_lists.py](study_lists.py). Add `--check` to run the same checks and fail if data.js is not exactly what its inputs build now; data.js records the fingerprint of every file it was built from, including both scripts. The page is [index.html](index.html), [js/hp.js](js/hp.js), [js/art.js](js/art.js) and [css/hp.css](css/hp.css), with the frame borrowed from the Authors and Manuscripts mock-ups. Nothing under `src/` was touched.

Only one direction was built, not the three or four the standard asks of a brand-new study: the brief says an existing draft that only needs a page is built from the draft, and the earlier mock-ups did the same. This draft had no design file; [design.md](../../content/studies/god-and-christian-faith/the-hope-to-come/design.md) was written with the page.

The script is the fourth near-copy of the same build script. It was not made shared because this job may not change the earlier folders.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used; every block quotation is word for word the Berean at its reference; every Scripture reference exists, with no gap in a range; every quoted phrase is in one reference its paragraph cites, or in one paragraph of the held text of its named source (three words at least), or on a short named list; a paragraph told in this site's words from a restricted source may quote Scripture only; no curly double quote in prose, so no quotation can slip past these checks; each promise row's two phrases are in their verses and its joining word is in the call; each first-to-last row's phrases are in their verses, in Bible order, and a row called "shares" has its word in both end verses; each map has one return and one reign; the maps in content.md and the strips line up; the page's stated facts are tested (no "therefore" in Revelation 20:11–15 or Matthew 25:31–46, "no temple" in Revelation 21:22, "spiritual body" in 1 Corinthians 15:44, the ancient serpent in Revelation 12:9 and 20:2, the last Adam in 1 Corinthians 15:45, and no verse outside Revelation 20 with both a thousand years and a reign); all page counts are computed. Twenty-six deliberately wrong inputs were tried, through a test harness that swaps in throwaway content and lists and never writes data.js, and all were refused. An unchanged input built. **This proves the words and references are there. It does not prove the reading is right, and it does not judge which verses deserve a row: those are this study's choices, and the page says so.**
- **Not checked by script:** four phrases from the Baptist Faith and Message: "will return personally and visibly in glory to the earth", "Christ will judge all men in righteousness", "The unrighteous will be consigned to Hell, the place of everlasting punishment" and "in His own time and in His own way". Those articles' wording is not held in full; they were consulted on 2026-10-30 through a web tool that returned extracts, so someone should compare them by eye before release. The Criswell, Piper, Akin, Waldron and Pinnock accounts are in this site's words, with no quotation, because their rights are restricted; only a reader can check them.
- **By browser against the always-on preview:** at 320, 390, 768 and 1440 wide in both themes: nothing past the right edge, every reading opens below its own card and is in the address, no console errors or failed files. Also opening and closing a reading and a sheet by keyboard with focus returned, the Back button, click outside, the return in one column across all four maps with the thousand years on the expected side, shared addresses, bad address values, a missing data file, a missing frame file, touch on a phone-sized screen with main targets at least 44 tall, and reduced motion. Screenshots were looked at for 1440 and 390. **200% zoom and a real screen reader were not tested, and colour contrast was not measured.**

## The three plan reviews

Security, reliability and principal-engineer reviews were run on the plan. Decided here:

- **Section 02's first title, "Every promise", was dropped:** the rows are hand-picked, so it overclaimed. The page states the selection and names passages without the pattern.
- **Section 03's first title, "What comes back", was dropped:** Revelation answers the first pages, and it does not simply restore them. Links are kinds "same English word" or "this study's matching", in English only.
- **A reviewer's claim that Boyce never places the thousand years before the coming was checked against the held text and found wrong** (boyce_theology.xml, line 21186), so the Boyce paragraph stands.
- **The strips are ordered lists labelled order, not scale,** and each says how it reads the thousand years.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 4 and 10 quoted where they bear. Hell stated plainly. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | The order of events is reported without choosing |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means and does not |
| 7 Claims marked | ◐ | Outside sources and flagged paragraphs are labelled, and this site's readings say so; ordinary paragraphs rely on the key at the top |
| 8 Precision | ✓ | The rows say they are a selection |
| 9 Hard questions | ◐ | Hell, the delay, deeds and grace are faced. No advocate of the golden-age view was read, and the page says so |
| 10 Complete or says so | ✓ | The selection note names what is left out |
| 11 Sources registered | ◐ | See [SOURCES.md](../../SOURCES.md), section "The hope to come mock-up". Criswell, Piper, Akin, Waldron and Pinnock keep their rights and were read and told in this site's words, which sits uneasily with this rule's "not read at all". For the owner to rule on |
| 12 Own shape | ✓ | Promise-to-call table, first-to-last rows, strips lined up on the return |
| 13 Three depths | ◐ | Six cards, then a reading, then the verse. No separate page per reading |
| 14 Parallel parts, card anatomy | ✓ | |
| 15 Dense, compact | ◐ | The judgment reading is long, because the hard questions sit in it |
| 16 Joined up | ◐ | View in the address, one sheet, named back links. The related studies have no pages yet |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Line style and words carry the kind of link; position carries before or after |
| 19 Art | ◐ | All registers are there; the drawings are a first pass for the owner's eye |
| 20 Colour | ✓ | The site's gold, because the study runs from Genesis to Revelation |
| 21 Approved, not ruled out | ✓ | Words and fine rules, not boxes |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | Three-question strip; Look closely and Your response apart; this site's readings labelled |
| T3 Scripture on Scripture | ✓ | Sections 02 and 03 |
| T4 Way of reading | ✓ | The three questions, on every reading and in the close |
| T5 Scripture's form | ✓ | Letter and vision read as what they are; Revelation's pictures not turned into a timetable |
| T6 Voice and ending | ✓ | |
