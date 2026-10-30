# Faith under pressure: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job 8a0127309051400bac63556932eddcd5 · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/faith-under-pressure-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/faith-under-pressure/content.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

A Scripture & Theology study. Its one new move: **name the pressure, find the ground**. Six pressures in the letters, every verse of their passages laid out one mark to a phrase: what names the pressure, what gives the call, what states the ground. Each reading also says what its passage does not promise.

## Rebuilt look, 2026-10-30

The owner found the first build visually bare, and asked for more life and an interactive mode switch with no change to the content. It was rebuilt from the [visual inventory](../study-visual-inventory/) using the shared [study kit](../study-kit/kit.js):

- **Its own look** ([css/fp-look.css](css/fp-look.css)), after the owner found the first rebuild identical to Faith in daily life: evening, layers and hard rules, because its subject is what a person stands on.
- **Six stacked layers** on a dusk band, each with a large drawing. None shows a storm clearing or a summit reached, because the study promises neither.
- **Verse section:** a switch between every verse and the six one-word calls, plus filters by kind of mark with their counts. The verse is held in a band above the full-width field.
- **Older words section:** a switch between joined threads (retellings dashed) and the list. On wide screens the letters sit on top and the older passages literally underneath.
- **Each reading:** full width, with the six readings as tabs along its top, and a switch between the whole reading, step by step, and Scripture only.
- **Every choice is in the address,** so a shared link opens the same view.

Only interface labels were added. A script compared the page's wording with the earlier version: nothing was lost, and data.js and build-data.py were not touched. The earlier look is kept as pictures in [the inventory's shots](../study-visual-inventory/shots/) (`pressure-*`). The "words and fine rules" note under rule 21 no longer holds: this page now has cards and panels, because the owner asked for them, kept to where the rated studies use them. No swaying or glow beyond one focal point.

## How it is built

[build-data.py](build-data.py) reads the study's content.md, the site's Berean text and the held Calvin and Maclaren files, checks them, and writes [data.js](data.js). Change the words in content.md and run `python design/faith-under-pressure-directions/build-data.py` from `Website/`. The marks, the one-word calls and the older-Scripture pairs are lists at the top of that script. Add `--check` to run the same checks and fail if data.js is not exactly what its inputs build now; data.js records the fingerprint of every file it was built from. The page is [index.html](index.html), [js/fp.js](js/fp.js), [js/art.js](js/art.js) and [css/fp.css](css/fp.css), with the frame borrowed from the Authors and Manuscripts mock-ups. Nothing under `src/` was touched.

Only one direction was built, not the three or four the standard asks of a brand-new study: the brief says an existing draft that only needs a page is built from the draft, and this draft already had a design.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used; every block quotation is word for word the Berean at its reference; every Scripture reference exists, with no gap in a range, and no chapter and verse goes unrecognised; every quoted phrase is in one reference that paragraph cites, or in one paragraph of the held text of its named source (three words at least), or on a short named list; each mark occurs exactly once in its verse and lands in a walked passage; every reading has all three kinds of mark; each quoted pair shares wording, except the loose ones marked in the script; every quotation mark in a walked passage is a shown pair or a named exception; all page counts are computed. Fifteen deliberately bad inputs were tried on throwaway copies and all were refused, and `--check` failed on a missing data.js and on a changed input. **This proves the words and references are there. It does not prove the reading is right, and it does not judge which phrases deserve a mark: those are this study's own choices, and the page says so.**
- **Not checked by script:** one phrase from the Baptist Faith and Message, "in His own time and in His own way" (Article 10). That article's wording is not held; it was consulted on 2026-10-30 through a web tool that returned extracts, so someone should compare it by eye before release. The Criswell and Piper accounts are in this site's words, with no quotation, because their rights are restricted; only a reader can check them.
- **By browser against the always-on preview:** at 320, 390, 768 and 1440 wide in both themes: nothing past the right edge, every reading opens below its own card and is in the address, no console errors or failed files. Also the verse field by keyboard, opening and closing a verse with focus returned, shared addresses, bad address values, a missing data file, touch, and reduced motion. Screenshots were looked at for 1440 and 390. **200% zoom and a real screen reader were not tested, and colour contrast was not measured.**

## The three plan reviews

Security, reliability and principal-engineer reviews were run on the plan. None found anything critical. Every major finding was checked against the finished files on 2026-10-30. All were met, with three exceptions decided here:

- **Quotations across verses:** the review asked that a quotation sit inside one verse. Romans 5:3–4 is rightly quoted as one sentence across two verses, so a quotation must sit inside one cited reference instead. It may not run across two references.
- **Tab stops in the verse field:** the review asked for one per row. The page has one for the whole field, with the arrow keys moving between verses and up and down moving between readings, which means fewer stops to pass.
- **Shortest quotation:** the review asked for a minimum length on all quotations. It applies only to quotations from named sources. A one-word phrase from a verse the same paragraph cites ("anxiety") is plainly tied to that verse.

Two things came late. The reliability review's fixes went in after the page was built, not before, and the audit found a few still undone: source quotations held to one paragraph, the shortest-quotation rule, and one sentence of page text. All are now done.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 1, 5, 10 and 13 of the confession are named where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | The timing of the meeting in the air is reported without choosing |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed |
| 7 Claims marked | ◐ | Outside sources and flagged paragraphs are labelled; ordinary paragraphs rely on the key at the top rather than a label each |
| 8 Precision | ✓ | The marks figure says it is hand-picked, a way of noticing and not a count of the letters |
| 9 Hard questions | ◐ | Whether a believer can finally fall away: **the Wesleyan and Arminian reading has no named source read**, and the page says so. On the end times, Criswell and Piper were read in part; other Baptist views were not, and the page says so |
| 10 Complete or says so | ✓ | The selection note names what is left out: the Psalms of lament, Job, Lamentations, illness, depression, abuse, long unanswered prayer |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "Faith under pressure mock-up" |
| 12 Own shape | ✓ | The verse field: one cell to a verse, three kinds of mark |
| 13 Three depths | ◐ | Six cards, then a reading, then the verse. No separate page per reading; it opens in place |
| 14 Parallel parts, card anatomy | ✓ | |
| 15 Dense, compact | ◐ | The temptation and persecution readings are long, because hard questions sit in them |
| 16 Joined up | ◐ | View in the address, one sheet, named back link. No people or places link out, and the planned study The hope to come has no page to link to |
| 17 Closing | ✓ | |
| 18 Graphics | ✓ | |
| 19 Art | ◐ | All registers are there; the drawings are a first pass for the owner's eye |
| 20 Colour | ✓ | Epistles gold |
| 21 Approved, not ruled out | ◐ | Cards and panels since the rebuild, at the owner's request; box-inside-box removed, and whether it now has too many boxes is the owner's eye. No approved section was copied whole |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | Four-part strip; applications named as applications |
| T3 Scripture on Scripture | ✓ | Section 03; every quotation in the walked passages, by script, plus 1 Corinthians 10's retelling of the wilderness years |
| T4 Way of reading | ✓ | Section 02 and the four questions |
| T5 Scripture's form | ◐ | The phrases are the text's own, but sorting them into three kinds is this site's way of showing them, and says so |
| T6 Voice and ending | ✓ | |
