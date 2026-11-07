# Genesis 1–11: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-06, step 5 of the page-design sequence ("Bible Guide: study page designs, six at a time") · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/creation-to-babel-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/explore-the-bible/creation-to-babel/content.md) · Design: [design.md](../../content/studies/explore-the-bible/creation-to-babel/design.md) · Limits: [passage-notes.md](../../content/studies/explore-the-bible/creation-to-babel/passage-notes.md) · Brief: [DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

An Explore the Bible study of eight questions readers bring to Genesis 1–11 (the days, Adam, Cain's wife, the long
lives, the Nephilim, the flood, the "curse of Ham", the nations and Babel). Its one move: **read the verse before the
view.** Every question is laid out in the same three tiers, which are the study's own three questions: what the text
says (a solid rule and a filled mark), the readings Christians give (side by side, equal width, open rings, none lit),
and where the text stops (a dotted edge). The page is laid on the chapters of Genesis themselves: a band of the eleven
chapters, each as wide as its verses, ending in the one verse of Genesis 12:1, with each question an arc over the
verses it reads. Questions open one at a time, kept in the address (`?q=01` to `?q=08`).

## How it is built

[build-data.py](build-data.py) takes the study's content.md and [study_lists.py](study_lists.py), checks them against
the site's Berean text, and writes [data.js](data.js). Its helpers: [scripture_text.py](scripture_text.py) (a byte-for-byte
copy of the Good news mock-up's reader), [study_refs.py](study_refs.py) (references, including the bare ones),
[study_graphics.py](study_graphics.py) (the data for the four drawn figures, each checked in its verse) and
[study_selftest.py](study_selftest.py) (the wrong inputs below). Run from the Website folder:
`python design/creation-to-babel-directions/build-data.py`. Add `--check` to run every check and fail if data.js is
stale; `--selftest` to prove the refusals. The page is [index.html](index.html), [css/gb.css](css/gb.css),
[js/gb-core.js](js/gb-core.js) (helpers and the verse sheet), [js/gb-graphics.js](js/gb-graphics.js) (the chapter band
and the four figures), [js/gb.js](js/gb.js) (the page) and [js/art.js](js/art.js) (the drawings), with the site frame
borrowed from the earlier study mock-ups. Nothing under `src/` was touched, and content.md was not edited: it held no
link notes to resolve.

One direction was built, as with the earlier study mock-ups, because the text already existed.

## Findings as the work went

- The study folder holds content.md and passage-notes.md but **no working.md**. The text itself is complete (eight
  questions, an opening and a close), so the design went ahead from those two files.
- Genesis is in the site's History section, so the study's colour is History orange (`--history`).
- Genesis 1–11 holds 299 verses in the site's Berean text (31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32).
- The plan went through three review passes before any code (security and correctness, reliability, platform and
  edge cases). The one critical catch: the model build reads a quotation's own reference only when it names a book, and
  this study writes nearly all of them bare ("(6:8 · BSB)"), so the model's check would have silently fallen back to a
  looser one. This build resolves bare references and refuses a bracket it cannot read.
- **Exodus 20:11 is printed as a block quotation but is only the first half of the verse** (the verse goes on:
  "Therefore the LORD blessed the Sabbath day and set it apart as holy."). The study's wording was left as written.
  The build accepts a block quotation that is one unbroken run of its verse's words, and the page marks it "part of the
  verse". For the editor: either quote the whole verse or keep it marked.
- All 78 bare references ("(5:5 · BSB)", "(3:38)", "(90:12 · BSB)") resolved to the right book: Genesis by default,
  Luke, Psalm, Numbers and Hebrews where the sentence names them first. Checked by listing every one.
- The eleven quotations from Augustine, Justin Martyr and Calvin are word for word in the held texts on this PC, so the
  build checks them by script. The five phrases of the Baptist Faith and Message 2000 are not held here, so they are
  compared by eye only.

## What the checks prove, and what they do not

- **By script on every build** (`--check` repeats it and compares data.js byte for byte): every non-blank line of
  content.md is placed on the page, and each question holds its three tiers in order; every block quotation is word
  for word the Berean at its reference (or, for Exodus 20:11 only, one unbroken run of its words, marked "part of the
  verse"); every reference exists, with no gap in a range, and every bare one is read to the right book; a quotation
  followed by its own reference is in that exact verse, and any other is in a verse its paragraph cites; quotations of
  the Berean's footnotes are in the footnotes at that verse; links go only to this site; the study holds exactly 8
  questions and 23 listed readings.
- **The drawn figures, by script:** the days (each day's words in its verse; the refrain "And there was evening, and
  there was morning" closes six days and is missing from Genesis 2:1–3); the long lives (every age is stated in its
  verse, a bar ends with a death mark only where the verse says he died, and the Berean's note on the Greek ages is at
  Genesis 11:13); the flood (each date's words give that day and month, the 150 days are in 7:24, the ark's cubits in
  6:15); the languages (Genesis 10 closes "according to their languages" in exactly the three verses shown); and the
  name and the thread (each phrase is in its verse). Stated facts are tested too: for example that the curse names Canaan in
  each of Genesis 9:25–27, and that Matthew 1:8 skips the three kings 1 Chronicles 3:11–12 names (tested both ways).
- **Refused on purpose:** fourteen wrong inputs, tried in memory, were all refused and data.js was left untouched
  (`--selftest`): a changed word in a block quotation; a block quotation under the wrong reference; a changed word in a
  quoted phrase; a quotation under the wrong bare reference; a reference that does not exist; a link that leaves the
  site; a line the page cannot place; a section heading the page does not know; a footnote quoted at the wrong verse;
  an outside quotation not in its held text; an age the verse does not state; languages claimed for the wrong verse; a
  flood date the verse does not give; and a reading added to a question.
- **Outside quotations:** the eleven from Augustine (The City of God), Justin Martyr (Second Apology) and Calvin
  (Commentaries on Genesis) are matched word for word by script against the held texts named in passage-notes.md. The
  five phrases of the Baptist Faith and Message 2000 are not held on this PC: compared by eye only. The modern writers
  are named for the positions they are widely known to hold; none is quoted, and their books were not opened.
- **By browser against the always-on preview:** 1440, 390 and 320 wide; light and dark. At 1440: the opening, the
  chapter band (the arcs no longer spike on one-verse readings and the numbers do not collide), the question list, and
  questions 01, 02, 04, 06, 07 and 08 open one at a time, no console errors. At 390 and 320 the page does not scroll
  sideways (the only things wider than the screen are inside the site's own top menu, which scrolls within itself), and
  the opening drawing, the chapter band's drawing, the flood spiral and the closing drawing are hidden below 640 wide,
  leaving their lists and buttons. A verse link opens the verse in a sheet and adds `ref=` to the address beside
  `q=`; Escape closes it, removes `ref=`, keeps `q=`, and returns focus to the link.
- **Not tested:** 200% zoom, a screen reader, a real phone, keyboard use of the chapter band (its eight questions are
  also buttons beneath it). Colour contrast was not measured.

## Could be confused with

**The shape of Scripture**, in the same category, also shows one thing at a time. It sets passages in their literary
form and chooses among six kinds from a list. This page's chooser is the chapters of Genesis themselves, and every
question has the same fixed body (the text, the readings, where it stops), not a form per passage. The model study,
The good news (a two-column ledger and a road), was not reused.

## Links in the study

content.md held no "[check: …]" link notes, so it was not edited. Two studies the text names have a mock-up on this
PC and link to it: *Humanity, sin and renewal* and *Angels, demons and spiritual powers* (the second was being built
by a sister run at the same time; its folder held a page when this was written). *In the beginning*, the Topics card,
is named in italics because it is not a page yet. Every verse opens in the page's own sheet.
