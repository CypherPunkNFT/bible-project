# Reading Daniel and Revelation: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, as step 13 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/reading-daniel-and-revelation-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/explore-the-bible/reading-daniel-and-revelation/content.md) · Limits: [passage-notes.md](../../content/studies/explore-the-bible/reading-daniel-and-revelation/passage-notes.md) · Design: [design.md](../../content/studies/explore-the-bible/reading-daniel-and-revelation/design.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

Study 49, a Scripture & Theology study under Explore the Bible. Its one new move: **read a vision from the throne
outward.** The page is built on two things the text itself notices. Daniel was told to seal his book and John was told
not to (Daniel 12:4; Revelation 22:10). And the two books put the throne and the beasts in opposite order: in Daniel 7
the beasts rise first and then the thrones are set; in Revelation the throne is seen in chapter 4 and the beast does
not rise from the sea until chapter 13. So the page opens on the two orders side by side, draws both books chapter by
chapter with every verse that names a throne or a beast, and lays the study's seven parts down a scroll with seven
seals, each seal broken as its part is read.

One direction was built, as for The good news, because the text already existed.

## What is built

- **The heading** (the standard one): study trail (Study / Explore the Bible), the concepts in gold capitals, the title
  *Reading Daniel* with *and Revelation* in gold italic, the lead, and beside it, in a faint circle and dotted orbit,
  Daniel 7 as one picture: the churning sea below, with only the backs, wings and horns of the four beasts above the
  waves, and above them the throne of fire with its wheels and its river of fire (7:9–10). The motto is "As I continued
  to watch, / thrones were set in place." (Daniel 7:9, checked in that verse). Nothing is drawn on the throne: no face
  or figure of God, of Christ or of the Father; the seat holds only light. A bar of five computed counts, each saying
  what it means: 12 · 22 chapters; 200 verses in Aramaic; 37 verses in Revelation that name a throne, the first at
  1:4, before any beast; 31 verses in Revelation that say "seven"; 226 references on the page.
  An earlier draft of the drawing was a door open in heaven (Revelation 4:1). It was changed because The hope to
  come's drawing is already a heavenly scene, and Daniel 7 is the passage this study turns on.
- **Sealed, then open.** The opening paragraph, then Daniel 12:4 and Revelation 22:10 side by side, the first in the
  Prophets' blue with a whole seal, the second in Revelation's rose with the seal broken. The Daniel quotation is the
  first sentence of its verse only, and the page says so ("first sentence of the verse"). Then the three questions the
  study asks the reader to carry, which come back as small tags in the parts that teach them.
- **The two books, chapter by chapter.** Daniel's 12 chapters and Revelation's 22, one column per chapter, sized by
  verses, with a dot for every verse whose Berean text has the word "throne" (above the line) or "beast" (below).
  The study's own marks sit on it: the beasts from the sea and the thrones set (Daniel 7:3, 7:9), the book sealed
  (12:4), the seven churches (Revelation 1:11), the door open (4:1), the beast from the sea (13:1), the book left open
  (22:10). Choosing a chapter lists its verses with either word, each opening the verse.
- **01–07 down a scroll of seven seals.** At 1240 pixels wide and above, a rod at the left holds seven seals (on
  narrower screens it is left out); a seal breaks when its
  part has been reached, and each seal is a link to its part. Each part has its number in a seal, its title, its
  hook, its main readings, then the text, with "What the text shows", "What it means" and "Where the reading stops"
  told apart by label and rule, and the places where readers differ marked in gold. Consider and Reflect close each
  part. Each part has one figure from its own material:
  - 01: what Revelation calls itself in its first four verses (an unveiling, a prophecy, a letter), and Daniel's two
    halves with the Aramaic run drawn to scale (2:4–7:28, 200 verses, from the Berean's note at 2:4).
  - 02: the book's own key (each self-explained picture with a small drawing), heard then seen (the Lion and the
    Lamb; the 144,000 and the multitude), and two pictures left unexplained, drawn with dashed leaders.
  - 03: eight echoes, Revelation on one side and the older passage on the other, each with both verses' words; a solid
    line where the Berean's own heading or footnote names the older passage, a dashed one where the two were read side
    by side.
  - 04: three and a half three ways (a time, times and half a time; 42 months; 1,260 days) drawn to the same length,
    and Daniel's seventy weeks as seventy marks read two ways (Calvin, joined; Criswell, with a gap), not chosen.
  - 05: Nebuchadnezzar's statue in its five parts and the stone, with what Daniel 2 says each means, the two lists of
    four kingdoms (only the names the study gives), and what the beast "was given" in Revelation 13:2–7.
  - 06: one picture, four ways: the beast of 13:1–8 at the centre, the four readings round it with their holders, and
    the four things all of them share.
  - 07: Patmos and the seven churches as points (no coastline), joined in the order of the letters, each with its
    promise to the one who overcomes.
- **Close.** The way of reading, the reader's question, "Read the passage again before you answer.", the two seals
  again (both open now), the sources, and a back link to Explore the Bible.
- **Every reference** opens its verses in a sheet from the right, in the Berean, and puts the reference in the
  address; Escape closes it.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) (a copy of The good news mock-up's
reader) and [study_lists.py](study_lists.py) (this page's own lists), reads the study's content.md, checks it, and
writes [data.js](data.js). Run it from the Website folder:
`python design/reading-daniel-and-revelation-directions/build-data.py`. Add `--check` to run every check and fail if
data.js is stale; add `--selftest` to feed wrong inputs in memory and prove each is refused. The page is
[index.html](index.html), [js/rdr.js](js/rdr.js) (page and sheet), [js/figs.js](js/figs.js) (the part figures),
[js/art.js](js/art.js) (the drawings) and [css/rdr.css](css/rdr.css), with the site frame borrowed from the Authors
and Manuscripts mock-ups as The good news does. Nothing under `src/` was touched.

The build reads the Berean twice: the plain text the other studies use (`data/plain/bsb`) for verses, and the noted
text (`data/text/bsb`) for the Berean's own footnotes and section headings, which this study quotes.

## What the checks prove, and what they do not

*Findings written as the work went.*

- **Build, 2026-11-07:** `python design/reading-daniel-and-revelation-directions/build-data.py` → "all checks pass;
  wrote data.js (165,746 bytes)"; then `--check` → "all checks pass; data.js is current", exit 0.
- **By script on every build:**
  - every non-blank line of content.md is placed on the page (an unplaced line stops the build);
  - every block quotation is word for word the Berean at its reference. One is a part: Daniel 12:4 is quoted to the
    end of its first sentence. The build allows only whole sentences from the start of the verse, and marks the
    quotation as a part so the page says so;
  - every reference exists, with no gap in a range; a whole chapter named without a verse ("Daniel 7", "Revelation 13",
    "2 Thessalonians 2") opens the whole chapter;
  - a short reference such as "(7:15 · BSB)" takes its book from a table, never a guess. Two short references stand
    for two books in the same part ("1:1" is Revelation 1:1 and Daniel 1:1 in part 01; "6:10" is Daniel 6:10 and
    Revelation 6:10 in part 07); for those the table names a word that must stand just before each;
  - a quotation followed by its own reference is in that exact verse; any other is in a verse its paragraph cites,
    its part's main readings or the passage printed above it; a quotation under three words must have its own
    reference or be pinned to a verse;
  - the four quotations of the Berean's own footnotes (the Aramaic note at Daniel 2:4, "Seventy sevens" at 9:24, "some
    manuscripts" at Revelation 13:18, "Or suddenly or quickly" at 1:1) are each in the note at that verse;
  - all 16 quotations from outside Scripture are found, as words, in the held copy of their source on this PC:
    Irenaeus, Calvin (two volumes), Warfield, Barnes, the Second London Baptist Confession, Criswell's sermon (one word
    and one title), and the two Baptist Faith and Message phrases;
  - "Revelation never once says 'as it is written'" is tested: the phrase is in no verse of Revelation;
  - stated facts: the Berean's headings pair Revelation 13 with Daniel 7; in Daniel 7 a beast comes before the thrones
    of 7:9; in Revelation a throne (first at 1:4) comes before 4:1 and every beast after it; 13:1 has the beast rising
    out of the sea; 42 months of 30 days is 1,260 days; each of the seven promises (2:7, 11, 17, 26; 3:5, 12, 21) speaks
    of the one who overcomes; each city is named in Revelation 1:11 and in its own letter's first verse;
  - every phrase a figure draws is in its verse, and every reading, holder and kingdom name a figure shows is in that
    part's own text, so a figure cannot say more than the study does;
  - links go only to this site; a named study links only to a mock-up that exists on this PC.
- **Refused on purpose** (`--selftest`, 2026-11-07: "15 of 15 wrong inputs refused as expected; nothing written"),
  each tried in memory without writing data.js: a changed word in a block quotation; a block quotation under the wrong
  reference; a changed word in a quoted phrase; a quotation cited to the wrong verse; a reference that does not exist
  (Mark 13:82); a short reference with no book in the table; a link that leaves the site; a line the page cannot place;
  a changed word in an outside quotation; a drawn phrase not in its verse; a city given another church's letter; a
  reading holder the text does not name; an outside quotation given to the wrong held source; a footnote looked for at
  the wrong verse; and a phrase said to be absent from a book that has it.
- **What the checks do not prove:**
  - a word check proves the words are in the verse, not that the reading of them is right;
  - the chart counts the words "throne" and "beast" in the Berean. That is a count of words, not of visions: Daniel 4's
    beasts are animals of the field, and Revelation 6:8's "wild beasts of the earth" are animals too. The first beast
    of the visions in Revelation is the one from the Abyss at 11:7; the page says this beside the chart;
  - the two Baptist Faith and Message phrases are checked against the site's own record of the confession in
    [DOCTRINAL-FOUNDATION.md](../../../DOCTRINAL-FOUNDATION.md), not against the confession's published text, which is
    not held on this PC. passage-notes.md already asks for "personally and visibly" to be checked against Article X
    before publishing;
  - Warfield is checked against an OCR text; its page images were not seen;
  - the positions of the seven cities and Patmos are the modern sites, rounded to two decimals, from general knowledge,
    not from a gazetteer on this PC. They are drawn as points only, with no coastline, and the map says so.
- **By browser against the always-on preview, 2026-11-07:** 1440, 390 and 320 wide, light and dark. The page itself
  never runs past the right edge (the document is exactly as wide as the window at all three widths). At 390 and 320
  a few icons in the shared site header sit past the edge; The good news mock-up has the same, so it is the shared
  frame, not this page. No console errors or warnings. 7 parts and 256 verse links counted on the page. A verse link
  (Daniel 2:33) opens the sheet and puts `?ref=DAN.2.33` in the address; Escape closes it and returns focus to the
  link. Opening the page at `?ref=DAN.7.9` opens that verse's sheet. Enter on a chart column lists its verses; Space on
  a city of the map shows its letter. The screenshots were looked at, and these were fixed from them: the throne
  redrawn; the Daniel 7 labels on the chart stacked so they no longer overlap; link underlines no longer stretched
  across justified gaps; the map widened; the gap in Criswell's seventy weeks widened so it reads as a gap; the close
  heading no longer indented; the sea of the heading drawing clipped to its frame; Revelation's chart drawn in two rows
  on phones.
- **Not tested:** 200% zoom, a screen reader, a real phone, the reduced-motion version (it is written: nothing on the page
  animates, and a seal changes at once instead of fading), and keyboard order beyond the controls named above. Colour contrast was not measured.

## Why it does not look like its neighbours

- **The page it could be confused with is The hope to come** ([the-hope-to-come-horizon](../the-hope-to-come-horizon/)
  and [the-hope-to-come-directions](../the-hope-to-come-directions/)). Both are about the last things, both set
  Baptist readings side by side, and this study points to it. They differ in what the page is built on. The hope to
  come is built on a horizon and on cards, and its drawing is a heavenly scene. This page is built on two books read
  side by side: its opening is a sealed book beside an open one, its chart is both books chapter by chapter, and its
  drawing is the sea and the thrones of Daniel 7. The readings of Revelation are shown once, round one picture (part
  06), not as a map of the future.
- **[The good news](../the-good-news-directions/)** also has something at the left at wide widths: a sticky rail that
  carries the current part's number, drawing, title and readings beside the text, down one dotted thread. Here the
  left column holds only seven seals on a rod, the same seven all the way down, each breaking as its part is reached.
  The parts are not on a thread, and each has its figure beside it instead of a drawing in a rail.
- **[Angels, demons and spiritual powers](../angels-demons-and-spiritual-powers-directions/)** draws one dashed line
  that every part crosses, in full-width bands. This page has no bands and no dividing line; its marks are seals and
  the two books' colours.

## Links in the study

No change was made to content.md: it had no "[check: …]" link notes. The links it names are made by the build: Study
30, The hope to come, links to its mock-up; Study 12 was merged into Who do you say that I am, so it links to that
mock-up; The Christian and the state has no mock-up yet, so it is named in italics; "(part 06)" links to part 06 on
this page; the trail goes to Explore the Bible.

## For the owner

- **The heading drawing** is Daniel 7: the beasts are shown only as backs, wings and horns above the sea, and the
  throne is empty light with fire, wheels and a river. If you would rather the beasts were not drawn at all, the sea
  alone can stay.
- **Two Baptist confession phrases** ("truth, without any mixture of error" and "personally and visibly") are checked
  only against the site's own record of the Baptist Faith and Message. The study's passage notes already ask for
  "personally and visibly" to be checked against Article X before publishing.
- **Questions the study's passage notes still leave to you:** its length (about 4,200 words, above the 2,000–2,600 the
  brief gives); a named holder for the "same people" reading of Revelation 7, and if wanted a Baptist holder for the
  mostly-past and the whole-age readings; whether to quote the 1689 confession's line on the papacy or only name it;
  and the date of Irenaeus's *Against Heresies*. The page shows the text as it stands and decides none of these.
