# Covenants and promises: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job 28883cadc56c48ffb8bd810de30700dd · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/covenants-and-promises-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/god-and-christian-faith/covenants-and-promises/content.md) · Design: [design.md](../../content/studies/god-and-christian-faith/covenants-and-promises/design.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

A Scripture & Theology study. Its one new move: **ask every promise the same five questions**: who speaks, to whom, what is promised, what is asked, what sign. Five covenants set side by side in a table, then the whole Bible drawn as one line with an arc from each covenant to later verses that come back to it. How the covenants fit together, where the Baptist confession is silent, is shown as several Baptist maps without choosing.

## How it is built

[build-data.py](build-data.py) reads the study's content.md, the site's Berean text, the held Calvin and Maclaren files and the site's copies of the two old confessions, checks them, and writes [data.js](data.js). Change the words in content.md and run `python design/covenants-and-promises-directions/build-data.py` from `Website/`. The later-Scripture lines, the named exceptions, the facts the page states and the sources are lists in [study_lists.py](study_lists.py). Add `--check` to run the same checks and fail if data.js is not exactly what its inputs build now; data.js records the fingerprint of every file it was built from. The page is [index.html](index.html), [js/cp.js](js/cp.js), [js/art.js](js/art.js) and [css/cp.css](css/cp.css), with the frame borrowed from the Authors and Manuscripts mock-ups. Nothing under `src/` was touched.

Only one direction was built, not the three or four the standard asks of a brand-new study: the brief says an existing draft that only needs a page is built from the draft, and the two earlier mock-ups did the same. This draft had no design file; [design.md](../../content/studies/god-and-christian-faith/covenants-and-promises/design.md) was written with the page.

The script is the third near-copy of the same build script, after the two earlier study mock-ups. It was not made shared because this job may not change those folders.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used; every block quotation is word for word the Berean at its reference; every Scripture reference exists, with no gap in a range, and no chapter and verse goes unrecognised; every quoted phrase is in one reference its paragraph cites, or in one paragraph of the held text of its named source (three words at least), or on a short named list; a paragraph told in this site's words from a restricted source may quote Scripture only; each later-Scripture line comes after its origin; a line called a quotation has quotation marks in the Berean and shares a run of three words with its origin, inside the marks, with a word in the run that is not a small common word; a line called "names it" or "remembers it" contains the word given for it; every quotation mark in the walked letters is a drawn line or a named exception on the page; the page's stated facts are tested (no "covenant" in Genesis 12:1–7, no "sign" in 2 Samuel 7, no "wrong" in Hebrews 1:5 or 1 Chronicles 17:13, no verse after Genesis 9 with both Noah and covenant); all page counts are computed. Sixteen deliberately bad inputs were tried on throwaway copies and all were refused. **This proves the words and references are there. It does not prove the reading is right, and it does not judge which verses deserve a line: those are this study's choices, and the page says so.**
- **Not checked by script:** three phrases from the Baptist Faith and Message: "All Scripture is a testimony to Christ", "all of the redeemed of all the ages" and "symbolic act of obedience". Those articles' wording is not held in full; they were consulted on 2026-10-30 through a web tool that returned extracts, so someone should compare them by eye before release. The Scheiderer, Semrad, Criswell and Wellum accounts are in this site's words, with no quotation, because their rights are restricted; only a reader can check them.
- **By browser against the always-on preview:** at 320, 390, 768 and 1440 wide in both themes: nothing past the right edge, every reading opens below its own card and is in the address, no console errors or failed files. Also the line list by keyboard, opening and closing a sheet with focus returned, an arc by pointer, shared addresses, bad address values, a missing data file, touch on a phone-sized screen, and reduced motion. Screenshots were looked at for 1440 and 390. **200% zoom and a real screen reader were not tested, and colour contrast was not measured.** The section colours on the chart come from the site; thin dashed lines in the palest colours are the likeliest place for a contrast problem.

## The three plan reviews

Security, reliability and principal-engineer reviews were run on the plan. None found anything critical. Decided here:

- **Loose quotation:** Hebrews 10:17 quotes Jeremiah 31:34 in a different order and shares no run of three words. It stays a quotation, is the one named loose case, and the page says so.
- **Exceptions:** ten marked verses in the walked letters are not drawn, because they do not start from these five passages. The page names each with its reason. One of them, Romans 11:19, is not Scripture at all but an objector Paul imagines.
- **Readings and passages:** readings open in place and passages open in the right-hand sheet, the same as the two earlier study mock-ups.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 1, 4, 6 and 7 of the confession are named or quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | The maps are reported without choosing, and Romans 11:26 is left open |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed. The count of the word says it is not a count of the idea |
| 7 Claims marked | ◐ | Outside sources and flagged paragraphs are labelled, and the Genesis 15 reading is called this site's; ordinary paragraphs rely on the key at the top rather than a label each |
| 8 Precision | ✓ | The lines figure says it is a selection |
| 9 Hard questions | ◐ | Other Baptist accounts, such as New Covenant Theology, were not read, and the page says so. Criswell was read in part; Wellum only through a tool returning a summary |
| 10 Complete or says so | ✓ | The selection note names what is left out: Phinehas and the priests, Moab, whether Adam's story is a covenant |
| 11 Sources registered | ◐ | See [SOURCES.md](../../SOURCES.md), section "Covenants and promises mock-up". Scheiderer, Semrad, Criswell and Wellum keep their rights and were read and told in this site's words, which sits uneasily with this rule's "not read at all" for sources that forbid republishing. For the owner to rule on |
| 12 Own shape | ✓ | The five-question table and the whole-Bible arcs |
| 13 Three depths | ◐ | Six cards, then a reading, then the verse. No separate page per reading; it opens in place |
| 14 Parallel parts, card anatomy | ✓ | |
| 15 Dense, compact | ◐ | The Abraham, David and letters readings are long, because the hard questions sit in them |
| 16 Joined up | ◐ | View in the address, one sheet, named back link. No people or places link out; the related studies have no pages yet |
| 17 Closing | ✓ | |
| 18 Graphics | ✓ | Colour is where a later verse sits, the dash is how it comes back, so colour is not alone |
| 19 Art | ◐ | All registers are there; the drawings are a first pass for the owner's eye |
| 20 Colour | ✓ | The site's gold, because the study spans the whole Bible; section colours only on the chart |
| 21 Approved, not ruled out | ✓ | Words and fine rules, not boxes; no approved section was copied whole |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | Five-question strip; Look closely and Your response apart; this site's readings labelled |
| T3 Scripture on Scripture | ✓ | Section 03, with every quotation mark in the walked letters a line or a named exception |
| T4 Way of reading | ✓ | The five questions, in section 02 and the close |
| T5 Scripture's form | ✓ | Each covenant read in its own narrative, oath, psalm, prophecy or letter |
| T6 Voice and ending | ✓ | |
