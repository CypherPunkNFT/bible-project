# The shape of Scripture: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job d26818550bb7429e8cd36e3096f54c08 · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/the-shape-of-scripture-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/explore-the-bible/the-shape-of-scripture/content.md) · Design: [design.md](../../content/studies/explore-the-bible/the-shape-of-scripture/design.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

A Scripture & Theology study in the Explore the Bible collection. Its one new move: **the page changes its shape with the writing.** Six passages are set large in the shapes of their own kinds of writing, and the page teaches one habit: name a passage's form, its hearers and one earlier word it names, and then ask what it says that nothing else says. Then one kind of writing across the books, a staircase of later parts looking back at earlier ones, and three passages to try.

## How it is built

[build-data.py](build-data.py) reads the study's content.md, the site's Berean text, the held Maclaren, Calvin, Henry and Jamieson-Fausset-Brown files and the site's copy of the Second London Confession, checks them, and writes [data.js](data.js). Change the words in content.md and run `python design/the-shape-of-scripture-directions/build-data.py` from `Website/`. The passages set in their forms, the kinds of writing and their places, the staircase, the three try-it passages and the sources are lists in [study_lists.py](study_lists.py). Add `--check` to run the same checks and fail if data.js is not exactly what its inputs build now; data.js records the fingerprint of every file it was built from, including both scripts. The page is [index.html](index.html), [js/ss-core.js](js/ss-core.js), [js/ss-forms.js](js/ss-forms.js), [js/ss-figures.js](js/ss-figures.js), [js/ss.js](js/ss.js), [js/art.js](js/art.js) and [css/ss.css](css/ss.css), with the frame borrowed from the Authors and Manuscripts mock-ups. Nothing under `src/` was touched.

Only one direction was built, not the three or four the standard asks of a brand-new study: the brief says an existing draft that only needs a page is built from the draft, and the earlier mock-ups did the same. This draft had no design file; [design.md](../../content/studies/explore-the-bible/the-shape-of-scripture/design.md) was written with the page.

The script is the fifth near-copy of the same build script. It was not made shared because this job may not change the earlier folders.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used; every block quotation is word for word the Berean at its reference; every Scripture reference exists, with no gap and no backward range; every quoted phrase is in one reference its paragraph cites, or in one paragraph of the held text of its named source (three words at least), or on a short named list; no curly double quote in prose, so no quotation can slip past these checks; each passage set in its form rejoins to the whole Berean text of its reference and its marks are in it; each place in section 02 holds its telling word as a whole word and is not in a book where that kind is at home; the staircase has exactly 21 steps, one per pair, running from a later part to an earlier one; a step that names has its name in the later verse, and one that retells or shares has the same words in both; each try-it answer is among its options; the page's stated facts are tested (no quotation formula in Revelation, "How long" four times in Psalm 13:1–2, "But" at Psalm 13:5, Paul's "As it is written" with Job 5:13); only one line of the page's code may insert markup, and only the fixed drawings and the site's icons go through it; all page counts are computed. Twenty-six deliberately wrong inputs were tried, through a test harness that swaps in throwaway content and lists and never writes data.js, and all were refused. One of them, a place in a book where its kind is at home, was refused by the whole-word check first, so the at-home rule itself was not separately exercised. **This proves the words and references are there. It does not prove the reading is right, or that a writer meant a link, and it does not judge which verses deserve a place: those are this study's choices, and the page says so.**
- **Not checked by script:** one Baptist Faith and Message phrase from Article 1, "All Scripture is a testimony to Christ". That wording is not held; it was consulted on 2026-10-30 through a web tool, so someone should compare it by eye before release.
- **By browser against the always-on preview:** at 320, 390, 768 and 1440 wide in both themes, with all six divisions and their readings open: nothing past the right edge, no console errors or failed files. Also opening and closing a sheet by keyboard with focus returned, the Back button, click outside, shared addresses, bad address values, a missing data file, a missing frame file, touch on a phone-sized screen with main targets at least 44 tall, and reduced motion. Screenshots were looked at for 1440 and 390. **200% zoom and a real screen reader were not tested, and colour contrast was not measured.**

## The three plan reviews

Security, reliability and principal-engineer reviews were run on the plan. Decided here:

- **"Two tablets" was dropped.** Scripture does not say how the words sat. It is now one stone, and the caption says the layout is this page's.
- **No Article 13 for Joshua 1:8.** That article does not speak to this verse. The care note stands as the site's reading.
- **Isaiah 1:18 gained a care note,** so the order on the page cannot be read as earning cleansing.
- **The word "echoes" gave way to "shares words",** because a script can find shared words and cannot find an echo. Section 03's title became "Every later part. Looks back."
- **Section 02 became one kind at a time with the list as the real content.** The rail is a picture above it and appears only from 900 wide, hidden from screen readers and from the keyboard, since the list holds the same places. The owner has rejected narrow strips as the main thing.
- **Wellum was dropped** from the note on the law, because he was not read for this page. The 1689 confession is called "one historic Baptist confession" and the page says no other source on this question was read.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 1 and 4 quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | The law for Christians is reported without choosing |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means and does not |
| 7 Claims marked | ◐ | Outside sources and flagged paragraphs are labelled, and this site's readings say so; ordinary paragraphs rely on the page's own statements |
| 8 Precision | ✓ | Sections 02 and 03 say they are a selection, and word for word means in English |
| 9 Hard questions | ◐ | Song and truth, Job's friends, the two proverbs, Joshua's prosperity and the law are faced. No Baptist who rejects the three-part law was read, and the page says so |
| 10 Complete or says so | ✓ | The selection note names what is left out |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "The shape of Scripture mock-up" |
| 12 Own shape | ✓ | Passages set in their forms, one kind across the books, the staircase |
| 13 Three depths | ◐ | Six forms, then a reading, then the verse. No separate page per reading |
| 14 Parallel parts, card anatomy | ✓ | The same four questions for each division |
| 15 Dense, compact | ◐ | Long readings stay in one column and open on request |
| 16 Joined up | ◐ | View in the address, one sheet, named back links. Several related studies have no pages yet |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | A word and a small shape carry the kind of link; position carries later and earlier |
| 19 Art | ◐ | The drawings are a first pass for the owner's eye |
| 20 Colour | ✓ | The site's section colours. Law shares History's orange, as the site's bands do, and words carry the difference |
| 21 Approved, not ruled out | ✓ | Type and fine rules, not boxes |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | Forms first, then questions, then Look closely and Your response; this site's readings labelled |
| T3 Scripture on Scripture | ✓ | Section 03 |
| T4 Way of reading | ✓ | The habit, on every division and in the close |
| T5 Scripture's form | ✓ | It is the study's subject |
| T6 Voice and ending | ✓ | |
