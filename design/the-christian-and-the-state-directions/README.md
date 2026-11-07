# The Christian and the state: the page mock-up and its record

Study 64 · One direction, built 2026-11-07 for the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) ·
Open at http://127.0.0.1:8931/mockups/the-christian-and-the-state-directions/ on this PC · Design note:
[design.md](../../content/studies/christian-life/the-christian-and-the-state/design.md) · Text:
[content.md](../../content/studies/christian-life/the-christian-and-the-state/content.md) (not changed by this job).

## What is built

One page that teaches one habit: **before you read a passage about rulers, sort what it gives the ruler and what it
keeps for God alone, then ask whether the two are at peace or in collision.** The shape is Jesus' answer in
Mark 12:17, two columns at once, and the study's own frame: the second column is larger, because Caesar is inside it.

- **Heading.** The standard one: trail, the concepts in gold capitals, *The Christian* in ink with *and the state* in
  gold italic, the lead, Mark 12:17, and the drawing: a Roman coin with an emperor's laurelled head, small inside the
  large faint circle and dotted orbit, with the motto "A coin for Caesar. / A life for God." and the note
  "Illustrative form · not a particular coin". The head is the emperor's; nothing on the page draws God, Christ or the
  Father. Four counts, each with what it means.
- **00 Whose is it?** The frame and the selection, then the page's signature figure: God's large circle with the
  ruler's coin inside it, and the words of the verses floating in their places, joined by fine lines: what the ruler
  is owed on the left, what is God's alone on the right, and two dashed lines across the coin's edge (Israel handing a
  king "to fight our battles", and the council commanding silence about Jesus). Point at a word to read its verse;
  click or press Enter to keep it. Each reading links to its verse and to the part that reads it.
- **01–06.** One anatomy for every part: number, title, hook, main readings; "The two columns" (a small drawing of
  the two columns and one line saying how they stand in that passage); one figure from its own verses; the text with
  its notes labelled by kind; Consider and Reflect side by side.
  - 01: Samuel's six "He will take", six lines drawn in to an empty seat, then "to fight our battles" beside
    "The LORD will fight for you".
  - 02: the three "must not" lines on a drawn scroll, Solomon's record under them as large figures, and "lest his
    heart go astray" beside "his wives turned his heart away".
  - 03: six verbs owed (give, submit, pay, honor, prayers, seek), each with whom it is owed to.
  - 04: three collisions, each command against its answer (the council, Nebuchadnezzar, Darius).
  - 05: a line of dates placed by year, from Helwys (1612) to the confession's article XVII (2000), each tradition
    marked by shape and name as well as colour, each with the study's own "to check" note.
  - 06: Isaiah 2:2–4 in its own four steps, then the just-war tradition and pacifism with what both agree between
    them, equal in size, choosing neither.
- **Questions readers bring.** All three, side by side, each with its answer; stacked on a phone.
- **Close: Two columns.** The way of reading set out in its own sentences as steps, the close, the invitation, the
  question, "Read the passage again", Acts 4:1–22 in full, a plowshare drawn in a furrow, the sources, a back link.
- **Every reference** opens its verses in a sheet that slides in from the right (Escape closes it; the address keeps
  `?ref=` so a sheet can be shared).

Colour: Gospels & Acts violet. No other study in Living the Christian Life uses it, and the page turns on Mark 12:17
and returns to Acts 4. Gold is kept for the concepts, the care notes and the two dashed crossings.

## How it is built

| File | What it does |
|---|---|
| [build-data.py](build-data.py) | Reads content.md, checks it, writes [data.js](data.js). `--check` fails if data.js is stale; `--selftest` runs the wrong inputs. |
| [figures.py](figures.py) | Checks and builds the seven figures; counts what the page states. |
| [study_lists.py](study_lists.py) | This page's own lists: the figures' rows, the state lines, study links, outside quotations. |
| [held.py](held.py) | Reads the Baptist Faith and Message 2000 and the 1677 Second London Confession held on this PC, one article or chapter at a time. |
| [scripture_text.py](scripture_text.py) | An unchanged copy of the model build's Berean reader. |
| [build_selftest.py](build_selftest.py) | 29 wrong inputs, tried in memory. |
| [index.html](index.html), [css/cs.css](css/cs.css), [js/cs.js](js/cs.js), [js/figures.js](js/figures.js), [js/art.js](js/art.js) | The page. All text goes in as text nodes; only the fixed drawings in art.js and the shared icons use markup strings. |

The shared site frame, the theme script and the hero layout are loaded from the Authors, Manuscripts and "Who do you
say that I am" mock-ups, as the other study pages do. Run from `Website/`:

```
python -B design/the-christian-and-the-state-directions/build-data.py
python -B design/the-christian-and-the-state-directions/build-data.py --check
python -B design/the-christian-and-the-state-directions/build-data.py --selftest
```

## What the checks prove

The build refuses, and leaves data.js as it was, if:
- a block quotation is not word for word the Berean at its reference;
- a quoted phrase is not in the verse cited for it (every verse, when several are cited), or, with no reference of its
  own, not in its paragraph's verses, its part's main readings or the passage printed just above it;
- a reference, a chapter or a run of chapters ("1 Kings 10–11") does not exist in the Berean;
- a link leaves the site: anything but a path beginning with one slash, with no second slash, no backslash, and no
  space or control character anywhere (a browser drops tabs, so "/<tab>/example.com" would become "//example.com");
- a line of content.md is not placed on the page, or a heading or italic is one the page does not know;
- a quotation from the Baptist Faith and Message 2000 or the 1677 confession is not in its own article or chapter of
  the copy held on this PC;
- a quotation from a source not held on this PC reaches the page without its "not yet compared" mark;
- any list entry is unused, or any figure's words are not in their verse.

The figures' counts are counted, not typed: "take" in 1 Samuel 8:11–17 (6, which is also the study's "six times"),
"must not" in Deuteronomy 17:16–17 (3), Solomon's numbers read from the verses' own digits or number words, Isaiah's
four steps in the passage's own order, every date and name in the timeline found in part 05's own text, and every line
of the two views on war found word for word in part 06.

**The wrong inputs, each refused for its own reason (29 of 29, 2026-11-07):** a changed word in a block quotation; a
block quotation under the wrong reference; a changed word in a quoted phrase; a quotation cited to the wrong verse; a
verse that does not exist (Acts 23:88); a chapter range that does not exist (1 Kings 10–23); a link to
https://example.com; a protocol-relative link; a link with a tab; a link with a backslash; a stray line; an unknown
heading; an unknown italic; a changed word in a confession quotation; a not-held quotation written so the mark would
miss it; a confession quotation searched in the wrong article; a wrong correction of the 1677 confession; an unused
own-term entry; a part with no state line; one "He will take" row left out; a take row whose words are not in its
verse; Solomon's horses shown wrong; Solomon's wives shown wrong; Isaiah's steps out of order; a date the study does
not give; a check note the study does not have; Jeremiah 29:7 placed inside the ruler's coin; a view's words not in
the study; a verb that is not in its own verse.

## What the checks do not prove

- That a reading is right. A verse-existence check proves the reference exists; a word check proves the words are in
  the verse. Neither proves the study reads the verse well.
- The page's own short lines (the six state lines, the figure questions and their one-sentence readings, the date
  summaries) are not checked by script. They are this page's words and are shown as such.
- Quotations from the Westminster Confession, the Augsburg Confession, the Schleitheim Confession, Dignitatis Humanae
  and the confession's preamble are not compared with anything: no copy is held on this PC. Each is marked on the page.
- The build depends on two held files (paths in [study_lists.py](study_lists.py), `HELD`). If either moves, the build
  and `--check` stop with the path they could not read. data.js records a fingerprint of both, so a changed source
  makes `--check` fail.

## Browser checks (2026-11-07, Playwright on the always-on preview)

- 1440, 390 and 320 wide, light and dark: the page's own content never passes the right edge (checked by script on
  every element outside the site header); no console errors; no alert. The shared site header's menu items run past
  320 and are clipped by the shared frame, as on every other mock-up.
- A verse link opens its sheet (Mark 12:17 at 320 dark), the address gains `?ref=MRK.12.17`; Escape closes it, the
  address loses it, and focus returns to the link.
- `?ref=DAN.6.10` opens Daniel 6:10 on load; `?ref=constructor` opens nothing and raises no error.
- The 00 figure answers keyboard Enter and a click, showing the item's column, verse and part.
- Under 900 and 700 wide the timeline becomes a vertical list, the 00 figure becomes three lists, the six lines of
  part 01 are left out, and the scroll, record, collisions and war views stack. Nothing is shrunk.
- Screenshots looked at: heading, 00, every part, the questions and the close at 1440 light; 00 at 1440 dark; heading,
  00, part 01 and part 05 at 390 dark; heading, parts 02 and 04 and the close at 320 light; the sheet at 320 dark.

## Not tested

A real phone, a screen reader, browser zoom, colour contrast by measurement, and the reduced-motion version in a
browser (the CSS stops the coin's glint, the sparkles, the sprouts and the sheet's slide under
`prefers-reduced-motion`, but no browser was set to it).

## Which page this could be confused with, and why it is not

- **Rulers and their choices** ([rulers-and-their-choices-directions](../rulers-and-their-choices-directions/)) reads
  the kings, opens with Deuteronomy 17:18–20 and draws a crown and a scroll. This page reads Deuteronomy 17 for one
  part only, draws a coin, and is built round two columns, not a verdict line.
- **The good news** ([the-good-news-directions](../the-good-news-directions/)) also uses violet and a two-sided form
  (a ledger of rows). Here the two sides are never rows: one column is drawn inside the other.
- **Encounters with Jesus** and **Faith in daily life** both have a coin among their drawings (a card icon; a hand
  passing coins). Neither uses the coin as the page's whole idea, and neither draws an emperor's head.
- **Grief and dying** shares this page's build code (the same content.md dialect), not its look: different colour,
  no map of voices, no question picker.

## For the editor (the study's text was not changed)

1. **The 1677 Second London Baptist Confession, chapter 24**, in the copy held on this PC reads "wage war upon just and
   necessary occasions"; the study has "occasion". The page marks it. The study also calls it "(1677/1689)"; only the
   1677 text is held.
2. **The confession's preamble** is not in the held copy of the Baptist Faith and Message, so "our accountability to
   each other under the Word of God" is marked as not yet compared.
3. **Article XVI** in the held copy says "The true remedy for the war spirit is the gospel"; the study paraphrases this
   as "the spirit of war", outside quotation marks, which is fair, but the editor may want the exact words.
4. **Five quotations from sources not held on this PC** (Westminster 23.3, Augsburg 16, Schleitheim 6, Dignitatis
   Humanae 2, the preamble) are marked on the page.
5. **The 31 open notes in the text** ("[check: …]" and the crisis lines "[check before publishing]") are shown on the
   page as gold marks. The "Academic study of the Reformation" note stays a note: no such study was found to link to.
6. **The ten studies the text names in italics** each link to their mock-up on this PC; all ten had an index.html at
   the last build (the build prints a warning for any that does not).
7. **Verses this page adds beside the study**, each marked "added by this page" where it stands: Exodus 14:14
   (part 01), 1 Kings 10:14, 10:26 and 11:3 (part 02), Daniel 3:5, 6:7 and 6:9 (part 04).

## Log

- 2026-11-07: plan reviewed in three passes (correctness and security, failure modes, edge cases): 0 critical, 7 major,
  8 minor, all folded in before code. Build first run: all checks pass; self-test 29 of 29.
- 2026-11-07: browser pass 1 found the 00 figure's left-hand lines crossing, the reading line printing "[object]",
  the part 04 figure question taking the wrong type, and an apostrophe lost from two timeline notes. All fixed and
  rechecked.
