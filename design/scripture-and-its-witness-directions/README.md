# What the Bible says about itself: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, as step 20 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)), job 4c72f8bb35474f678d758e90803f2b64 · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/scripture-and-its-witness-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/god-and-christian-faith/scripture-and-its-witness/content.md) · Design: [design.md](../../content/studies/god-and-christian-faith/scripture-and-its-witness/design.md) · Limits and sources: [passage-notes.md](../../content/studies/god-and-christian-faith/scripture-and-its-witness/passage-notes.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

Study 27, a Scripture & Theology study in God & Christian Faith. Its one habit: **when a verse is quoted, read the verses around it and ask what it is being used to do.** The shape comes from the text. In Matthew 4:1–11, four verses say a scripture "is written" (4:4, 4:6, 4:7, 4:10; the third is "It is also written"). Three are spoken by Jesus and one by the devil. The words are the same; the use is not. So the page opens on those four quotations, each traced back to the verses it was taken from. Then it walks the six claims the Bible makes about itself.

The page is made of:
- [index.html](index.html);
- [js/sw.js](js/sw.js), the page;
- [js/figures.js](js/figures.js), the figures;
- [js/art.js](js/art.js), the fixed drawings;
- [css/sw.css](css/sw.css).

The frame is borrowed from the Authors and Manuscripts mock-ups, as The good news does. Nothing under `src/` was touched. The page's design record is [design.md](../../content/studies/god-and-christian-faith/scripture-and-its-witness/design.md).

## How it is built

[build-data.py](build-data.py) reads the study's content.md and places every non-blank line on the page, or fails. With [study_checks.py](study_checks.py) (the checks behind the drawn figures and the outside quotations), [study_lists.py](study_lists.py) (this page's own lists) and [scripture_text.py](scripture_text.py) (an unchanged copy of The good news mock-up's Berean reader), it checks the text against the site's Berean and the held copies of three outside sources, and writes [data.js](data.js). Run it from the Website folder:

- `python design/scripture-and-its-witness-directions/build-data.py` writes data.js, through a temporary file, so a failed write cannot leave half a file.
- `--check` runs every check and fails if data.js is not exactly what its inputs build now. data.js records a fingerprint of each input, including both scripts.
- `--selftest` feeds wrong inputs in memory and proves each is refused for the right reason ([build_selftest.py](build_selftest.py)). It writes nothing.

Before the code was written, the plan was reviewed once in three lenses: security and correctness, failure modes, and edge cases and fidelity to the study. Its findings were adopted:
- Count every verse of Matthew 4:1–11 that holds "written" (4:4, 4:6, 4:7, 4:10), and show each verse's own words. Matthew 4:7 says "It is also written", so the page does not claim four identical phrases.
- Check held quotations letter for letter, allowing only a capital at the start. Any difference in punctuation or capitals must be named in `KNOWN_DIFFERENCES`, so a new difference fails.
- Cut each held passage of the Baptist Faith and Message at the next article heading, so a phrase cannot pass on text from another article.
- Pin the short quotations ("noble-minded", "repentance and forgiveness of sins") to their verses.
- Every italic in the study must be on the list of study titles or of book titles, so a link cannot be silently lost.
- Split the main-readings line on "Quoted" first.
- Mark the shared words in Psalm 91 neutrally. The study says the devil quotes the psalm "accurately". The page does not mark what he leaves out.
- Show the two readings of 2 Peter 1:19 without choosing. The page names no scholar for either reading.
- Never caption Luke 24:45 as the Spirit's act. The page shows only the verse's words.
- Stack the three tests on phones rather than dropping them.
- Turn off sticky placement on phones.
- Return focus to the heading when a sheet opened from the address is closed.

## Changes to content.md

Only the four notes asking for an apologetics link were changed. Each one is now a link to the site's published answer: [What should we do with apparent Bible contradictions?](/apologetics/study/contradictions), [Does the resurrection really matter?](/apologetics/study/resurrection), [Who decided which books belong in the Bible?](/apologetics/study/canon) and [Has the Bible been changed beyond recognition?](/apologetics/study/manuscripts). Each title was copied from that answer's own file in [content/apologetics/studies/](../../content/apologetics/studies/). No other word of the study was changed. The other nine "[check: …]" notes are about facts, not links, so they stay. The page shows each one as a small gold mark.

## The page

- **Heading.** The standard heading:
  - the trail;
  - *Breathed out · True · Enough · Clear · About Christ · Opened by the Spirit* in gold capitals;
  - *What the Bible says* in ink, with *about itself* in gold italic;
  - the lead, then 2 Timothy 3:16–17 in full.
  - The drawing sits in a faint circle with a dotted orbit: a clay lamp resting by an open scroll in the dark. Its flame breathes, and its light falls on the lines of the scroll nearest to it. The motto reads *A lamp. A dark place. / Read by its own light.* No figure is drawn.
  - Four computed figures follow, then links to every part.
- **00 It is written. Four times, two speakers.** The frame, then the three tests side by side, and the selection note.
  - Each test has its drawing, the devil's offer in his words, and a choice for each "It is written" spoken in it. The devil's choice has a dashed border.
  - Choosing one shows the Matthew verse and the verses it was taken from, read with the verses around them. The words the two share are underlined. Under them is what the quotation is used to do, in the study's own sentence.
- **01–06.** Each part has a wide head: numeral, concept in gold, title and turn, hook, and main and quoted readings. The reading runs on the left, with one figure in the margin, held in place on wide screens. The six figures:
  - four uses, one goal;
  - two readings of 2 Peter 1:19 (neither chosen) and of 1:20 (the study's preference drawn solid);
  - forty days and forty years, with Deuteronomy's 34 chapters;
  - clear, and hard in places;
  - Cleopas's facts, with a switch that sets them under Luke 24:46;
  - "opened" three times in Luke 24.
- **Questions.** Three question words on one line, joined by a rule. The chosen one opens below.
- **Close.** The way, the close, the invitation and the question, with Luke 24:13–35 in full beside them. Then the sources and a back link.

## Why it does not look like its neighbours

The page it could most easily be confused with is **Christ in the Old Testament** (in the Jesus Christ category). That page also reads Luke 24:44 and draws lines between the Testaments. It is not the same page:
- Its lines run from Old Testament pictures to Christ, and mark where each picture stops.
- This page never draws a line between Testaments. Its figure is one afternoon in Matthew 4, with two speakers using the same formula. The comparison is between uses of one formula, not between promise and fulfilment.

Two other pages come close:
- **Learning to discern** widens Acts 17:11 from the verse to its paragraph to the account. This page does not use Acts 17 for a figure. Its "verses around it" view only serves the four quotations in Matthew 4.
- **Angels, demons and spiritual powers** (the same category) draws "what Scripture leaves unsaid" as an edge line. This page's limit sub-heads ("What the verse does not say" and the like) are left as ordinary sub-heads, so it does not echo that page.

Within God & Christian Faith:
- The good news has a ledger and one dotted road.
- The Holy Spirit has a floodlight with beams.
- This page has three tests side by side and a margin figure per part.
- Its colour, teal, is used by none of them.

## What the checks prove, and what they do not

**By script on every build** (`build-data.py`, then `--check`, both pass):
- Every non-blank line of content.md is placed on the page.
- Every block quotation is word for word the Berean at its reference.
- Every reference exists, with no gap in a range.
- A quotation followed by its own reference is in that exact verse. Any other quotation is in a verse its paragraph cites, in its part's main or quoted readings, or in the passage printed just above it.
- Quotations of three words or fewer must be pinned to a verse or named as the study's own terms.
- Links go only to this site. Every italic title is on a named list. Every linked study's mock-up exists, or its route is in the site's [App.tsx](../../src/App.tsx).

The figures are checked too:
- **Matthew 4.** The four "It is written" verses must be exactly the verses of Matthew 4:1–11 that hold "written". Each speaker is pinned by the words in the verse that names them. Each quoted source lies inside the verses printed round it. Each underlined phrase is in both the Matthew verse and its source. Each "use" sentence is the study's own.
- **The other figures.** The four uses and the goal are in 2 Timothy 3:16–17, and every gloss and reading is a sentence of content.md. The page may not choose a reading of 2 Peter 1:19. The forty phrases, the clarity pair, Cleopas's six facts and the words of Luke 24:46 are each in their verse. The three "opened" verses must be exactly the verses of Luke 24 that hold "opened". Deuteronomy's chapter count is read from the Berean (34).

**Outside quotations checked against held copies:**
- Seven phrases from the Baptist Faith and Message 2000 (articles I and II C) were found letter for letter. A capital is allowed only at the start. Each phrase is searched only within its own article, in the copy at [baptist-know-the-truth-catechism.json](../../content/questions/sources/normalized/baptist-know-the-truth-catechism.json).
- Three Westminster Confession phrases (1647, chapter 1, sections 3 and 7) and one Second London Confession phrase (1677, chapter 1, section 1) were checked against the site's creeds collection in [data/creeds/doc/](../../data/creeds/doc/). Three of them match in words but not in punctuation or capitals. The build accepts these only because each difference is named in `KNOWN_DIFFERENCES`; any new difference fails:
  - **Westminster 1.7:** the held text has a semicolon after "unto all" where the study has a colon, and commas round "for salvation".
  - **Westminster 1.3:** the held text capitalises "Canon".
  - **Second London 1.1:** the held text has no comma after "Faith" in "Knowledge, Faith and Obedience".

**Refused on purpose** (`--selftest`, all 24 cases right):
- Twenty wrong inputs, tried in memory without writing data.js, were each refused for the right reason:
  - a changed word in a block quotation;
  - a block quotation under the wrong reference;
  - a changed word in a quoted phrase;
  - a quote cited to the wrong verse;
  - a reference that does not exist;
  - an outside link;
  - an outside link written with a double slash;
  - a sub-head the page cannot place;
  - a bracketed note the page cannot place;
  - an altered confession phrase;
  - a new punctuation change in a confession phrase;
  - a short quotation on no list;
  - a study title on no list;
  - a fifth "It is written";
  - shared words the source does not hold;
  - a "use" sentence the study does not say;
  - a reading of 2 Peter 1:19 chosen;
  - a fourth "opened";
  - a Cleopas fact not in its verse;
  - a concept moved to the wrong part.
- Four tricky citations are read right, among them "Acts 27:15 and 27:17" and "Luke 24:13–35 with 24:44–49".

**Not checked by script:**
- Four quotations from the Catechism of the Catholic Church, Calvin's sentence on 2 Timothy 3:16, and Warfield's "breathed out by God". None of these is held on this PC. The study marks each to check, and the page shows that mark.
- The three books named in the circular-argument answer. They are named, not quoted.

**By browser against the always-on preview** (2026-11-07, Playwright):
- **Widths and themes.** The page was opened at 1440, 390 and 320 wide, in light and dark. Nothing is past the right edge: the page's scroll width equals the window at every width. The only elements past the edge are inside the shared site header, and The good news mock-up shows the same. There were no console errors or warnings.
- **The sheet.** A verse link opens its verses in a sheet and puts the reference in the address. Escape closes it, clears the address and returns focus to the link. Opened from the address (`?ref=PSA.119.105`), it shows the verse; Escape then returns focus to the page title. `?ref=__proto__` is ignored.
- **Choices and keyboard.** Choosing the devil's quotation shows Psalm 91:9–13 and the study's sentence on its use. A choice given keyboard focus and pressed with Enter works, and no outline ring is drawn on it. Moving through the whole page with Tab alone was not walked. The Luke 24:46 switch groups all six facts. Each question opens its own answer, with the canon question's two notes still to check.
- **One fault found and fixed.** The question panel at first printed "[object HTMLElement]" in place of its answer, so the answers were missing. It now spreads its blocks, and all three answers render.
- **Looked at by eye:** the screenshots at every width and in both themes.

**Not tested:**
- the reduced-motion version in a browser (the CSS stops the flame, the light and the dust);
- 200% zoom;
- a screen reader;
- a real phone;
- colour contrast, which was not measured.

## What needs the owner's word

1. **The nine notes still to check.** They come from the study and are shown on the page as gold marks:
   - Calvin's wording;
   - a scholar for each reading of 2 Peter 1:19;
   - the Greek verb in Acts 27;
   - the Second London text;
   - the two Catechism paragraphs;
   - Westminster 1.7 in the 1677 text;
   - the Westminster canon wording;
   - the Orthodox books.
2. **Three confession quotations differ in punctuation from the held copies.** They are listed under the checks above. An editor should decide whether to follow the held texts.
3. **Psalm 91 in Matthew 4:6.** The devil's quotation leaves out the psalm's "to guard you in all your ways". The study calls his quoting "accurate", and the page does not mark the omission. It is visible in the printed psalm, beside it.
4. **The Cleopas grouping.** It sets his facts under Luke 24:46 and is labelled as the page's own arrangement. Say if it should go.
