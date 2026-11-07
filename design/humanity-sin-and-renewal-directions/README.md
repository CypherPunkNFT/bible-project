# Humanity, sin and renewal: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job 9a6ff9e952724842b5a58c0b0a2b756f · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/humanity-sin-and-renewal-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/god-and-christian-faith/humanity-sin-and-renewal/content.md) · Design: [design.md](../../content/studies/god-and-christian-faith/humanity-sin-and-renewal/design.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

A Scripture & Theology study in God & Christian Faith. Its one new move: **one line and one body.** Six passages sit on a line whose height is named, and the same body is shown twice, once as Paul lists it in Romans 3 and once handed over as Romans 6:13 asks. The page teaches one habit: of any person, ask what the passage honours, what it will not excuse, and where it points them.

## How it is built

[build-data.py](build-data.py) reads the study's content.md, the site's Berean text, the held Boyce, Calvin and Henry files and the site's copies of five confessions and catechisms, checks them, and writes [data.js](data.js). Change the words in content.md and run `python design/humanity-sin-and-renewal-directions/build-data.py` from `Website/`. The body, the Romans 5 rows, the Genesis 3 figure, the image thread and the sources are lists in [study_lists.py](study_lists.py). Add `--check` to run the same checks and fail if data.js is not exactly what its inputs build now; data.js records the fingerprint of every file it was built from, including both scripts. The page is [index.html](index.html), [js/hs-core.js](js/hs-core.js), [js/hs-hero.js](js/hs-hero.js), [js/hs-line.js](js/hs-line.js), [js/hs-figures.js](js/hs-figures.js), [js/hs.js](js/hs.js), [js/art.js](js/art.js) and [css/hs.css](css/hs.css), with the frame borrowed from the Authors and Manuscripts mock-ups. Nothing under `src/` was touched.

Only one direction was built, not the three or four the standard asks of a brand-new study: this is an existing draft, as with the earlier mock-ups. The draft had no design file; [design.md](../../content/studies/god-and-christian-faith/humanity-sin-and-renewal/design.md) was written with the page.

The script is the sixth near-copy of the same build script. It was not made shared because this job may not change the earlier folders.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used, by a closed list of keys for each section, so an unknown key or tag fails; every block quotation is word for word the Berean at its reference; every Scripture reference exists, with no gap and no backward range; every quoted phrase is in one reference its paragraph cites, or in one paragraph of the held text of its named source (three words at least), or on a short named list; a restricted source may quote only Scripture; no curly double quote in prose, so no quotation can slip past these checks; every phrase in the body, Romans 5, Genesis 3 and image lists is in its verse as whole words; a row marked "same word" really has that word in both verses; the page's stated facts are tested (how much more twice and all the more once in Romans 5:15–20, the order of Genesis 3:14, 3:16 and 3:17, and others); source links are https or site pages; only one line of the page's code may insert markup, and only the fixed drawings and the site's icons go through it; all page counts are computed. Twenty-five deliberately wrong inputs were tried through a throwaway harness that never writes data.js, and all were refused. **This proves the words and references are there. It does not prove the reading is right, or that a pairing is the best one: those are this study's choices, and the page says so.**
- **Not checked by script:** seven Baptist Faith and Message phrases from Article 3 are not in any file held here. They were compared on 2026-10-30 through a web tool that returns extracts and each one matched, so someone should still compare them by eye before release. The phrases from Articles 4 and 15 are in the site's foundation file and are checked.
- **By browser against the always-on preview:** at 320, 390, 768 and 1440 wide in both themes, with all six passages opened: nothing past the right edge, no console errors or failed files. Also opening and closing a sheet by keyboard with focus returned, the Back button, click outside, shared addresses, a sheet in a shared address, bad address values, a missing data file, a missing frame file, phone-sized touch with main targets at least 44 tall, the dust moving, stopping on pause and off-screen, repainting on a theme change, and still under reduced motion. Twenty-seven such checks passed. Screenshots were looked at for 1440 and 390. **200% zoom and a real screen reader were not tested, and colour contrast was not measured.**

## The three plan reviews

Security, reliability and principal-engineer reviews were run on the plan, before any code. Decided here:

- **Romans 3 no longer says "the same all".** The verdict falls on all, and the gift reaches "all who believe" (Romans 3:22).
- **Romans 5 does not assert the representative view in the site's voice.** The hook and the "honours" line were rewritten, because the confession does not say it and the page says Baptists differ.
- **The line got a named height.** A falling and climbing line could be read as a chart of human worth, so its height is what a passage is mostly about, the page says height is not worth, the last stretch is dashed, and it does not end higher than it began.
- **The small image drawings show no amount.** Dots thinning out would have taught that the image can be measured, or lost by degrees. Every stage has the same outline and one named mark.
- **The hero's outline stays through the loosening,** for the same reason.
- **The labelled three-row strip was dropped,** because the two sibling studies use the same shape. The three questions now sit in the margin of the open passage.
- **Two unread claims were cut.** "Critics among Baptists answered" and "Some writers hold" named no one read for this page.
- **Engineering.** Shared files keep their line endings and are re-read before being replaced. The sheet is the only thing that adds a Back step. The canvas stops off-screen, in a hidden tab, on pause and under reduced motion.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 3, 4 and 15 quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | How sin reaches us and what the image is are reported without choosing |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means and does not |
| 7 Claims marked | ✓ | "This study reads", named sources and flagged notes are labelled where they come |
| 8 Precision | ✓ | Selections say so, and "same word" means in the Berean's English |
| 9 Hard questions | ◐ | Inherited guilt, infants, Genesis 3:16, "worthless" and "all men" are faced. The 2012 statement was seen only as an extract, and no critic of it or advocate of the rule view was read, and the page says so |
| 10 Complete or says so | ✓ | The selection note names what is left out |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "Humanity, sin and renewal mock-up" |
| 12 Own shape | ✓ | One named line, one body with a switch, two-sided Romans 5, the image thread |
| 13 Three depths | ◐ | Six points, then a passage, then the verse. No separate page per passage |
| 14 Parallel parts, card anatomy | ✓ | The same three questions and passes for each passage |
| 15 Dense, compact | ◐ | The whole passage is set first, so long passages make long pages |
| 16 Joined up | ◐ | View in the address, one sheet, named back links. Several related studies have no pages yet |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Words carry every meaning; each figure's caption says what its shape does not mean |
| 19 Art | ◐ | The dust figure, the body and the small drawings are a first pass for the owner's eye |
| 20 Colour | ✓ | The site's gold, and one dark band fixed in both themes |
| 21 Approved, not ruled out | ✓ | Type and fine rules, not boxes |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | Text, then labelled readings, then You |
| T3 Scripture on Scripture | ✓ | Paul's sources in the body figure; the image thread |
| T4 Way of reading | ✓ | The three questions, on every passage and in the close |
| T5 Scripture's form | ✓ | Romans 5 and Romans 3 are set in the shape Paul gives them |
| T6 Voice and ending | ✓ | |
