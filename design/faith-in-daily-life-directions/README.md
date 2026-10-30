# Faith in daily life: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job 8e060d9c739c48f58f9f2bbb2330deff · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/faith-in-daily-life-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/faith-in-daily-life/content.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

A Scripture & Theology study. Its one new move: **ask the sentence why**, six everyday places in the letters, each instruction's own stated reason sorted toward the Lord or toward another person.

## Rebuilt look, 2026-10-30

The owner found the first build visually bare, and asked for more life and an interactive mode switch with no change to the content. It was rebuilt from the [visual inventory](../study-visual-inventory/) using the shared [study kit](../study-kit/kit.js):

- **Its own look** ([css/fd-look.css](css/fd-look.css)), after the owner found the first rebuild identical to Faith under pressure: daylight and soft filled rooms, because its subject is ordinary places.
- **Six rooms,** two across, each with a large drawing, in place of a top line and a small sketch.
- **Reasons section:** a switch between the marks and every sentence, plus filters by direction with their counts, and a side panel for the verse.
- **Older words section:** a switch between joined threads and the list.
- **Each reading:** a list of the six readings beside a raised card, and a switch between the whole reading, step by step, and Scripture only.
- **Every choice is in the address,** so a shared link opens the same view.

Only interface labels were added. A script compared the page's wording with the earlier version: nothing was lost, and data.js and build-data.py were not touched. The earlier look is kept as pictures in [the inventory's shots](../study-visual-inventory/shots/) (`daily-life-*`). The "words and fine rules" note under rule 21 no longer holds: this page now has cards and panels, because the owner asked for them, kept to where the rated studies use them. No swaying or glow beyond one focal point.

## How it is built

[build-data.py](build-data.py) reads the study's content.md and the site's Berean text, checks them, and writes [data.js](data.js). Change the words in content.md and run `python design/faith-in-daily-life-directions/build-data.py` from `Website/`. The reasons and the older-Scripture pairs are lists at the top of that script. The page is [index.html](index.html), [js/fd.js](js/fd.js), [js/art.js](js/art.js) and [css/fd.css](css/fd.css), with the frame borrowed from the Authors and Manuscripts mock-ups. Nothing under `src/` was touched.

Only one direction was built, not the three or four the standard asks of a brand-new study: the brief says an existing draft that only needs a page is built from the draft, and this draft already had a design.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every block quotation is word for word the Berean at its reference; every Scripture reference exists, cross-chapter ranges included; every quoted phrase in the prose is in that paragraph's verses, or in the held text of Calvin or Gill, or on a short named list; each reason phrase is in its verse; each older-Scripture pair shares wording (one is exempt, Paul's short list of commandments in Romans 13:9, marked in the script); every quotation mark in a walked passage is a shown pair or a named exception; all page counts are computed. Four deliberately bad inputs were tried and all were caught. **This proves the words and references are there. It does not prove the reading is right.**
- **Not checked by script:** the six short phrases from the Baptist Faith and Message and the 1995 resolution. Those texts are not held; they were consulted on 2026-10-30 through a web tool that returned extracts, so someone should compare them by eye before release.
- **By browser against the always-on preview:** at 320, 390, 768 and 1440 wide in both themes: nothing past the right edge, every reading opens below its own card and is in the address, the sheet opens and closes with focus returned, no console errors or failed files. Also shared addresses, bad address values, keyboard paths, the Back button, and reduced motion. Screenshots were looked at for 1440, 390 and 320. **200% zoom and a real screen reader were not tested, and colour contrast was not measured.**

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Marriage now follows Article 18 (the draft had left it open). A reviewer's reading, not the owner's; the owner should read that section |
| 2 History without choosing | ✓ | The one open historical question is reported without choosing |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed |
| 7 Claims marked | ◐ | Outside sources and flagged paragraphs are labelled; ordinary paragraphs rely on the key at the top rather than a label each |
| 8 Precision | ✓ | The reasons figure says it is hand-picked |
| 9 Hard questions | ◐ | The site's reading has two named sources read directly (Calvin, Gill). **The other reading has no named source yet**, and the page says so |
| 10 Complete or says so | ✓ | The selection note names what is left out, including Titus 2 and 1 Peter 2:18–3:7 |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "Faith in daily life mock-up" |
| 12 Own shape | ✓ | The letters' stated reasons |
| 13 Three depths | ◐ | Six cards, then a reading, then the verse. No separate page per reading; it opens in place |
| 14 Parallel parts, card anatomy | ✓ | |
| 15 Dense, compact | ◐ | The marriage reading is long, because the hard question sits in it |
| 16 Joined up | ◐ | View in the address, one sheet, named back link. No people or places link out, and four related studies have no page to link to |
| 17 Closing | ✓ | |
| 18 Graphics | ✓ | |
| 19 Art | ◐ | All four registers are there; the drawings are a first pass for the owner's eye |
| 20 Colour | ✓ | Epistles gold; Acts is not coloured differently in the reasons figure |
| 21 Approved, not ruled out | ◐ | Cards and panels since the rebuild, at the owner's request; box-inside-box removed, and whether it now has too many boxes is the owner's eye. No approved section was copied whole |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | Three-part strip; applications named as applications |
| T3 Scripture on Scripture | ✓ | Section 03; every quotation in the walked passages, by script |
| T4 Way of reading | ✓ | Section 02 |
| T5 Scripture's form | ◐ | The reasons are the text's own, but the two-sided figure is this site's way of showing them, and says so |
| T6 Voice and ending | ✓ | |
