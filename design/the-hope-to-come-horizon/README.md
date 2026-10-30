# The hope to come: the horizon

A second, wholly different page for The hope to come. The first version stays untouched beside it in
[the-hope-to-come-directions/](../the-hope-to-come-directions/README.md). This page reads that folder's
[data.js](../the-hope-to-come-directions/data.js) and never edits it, so the study's wording has one home.

Mock-up only: not deployed. Preview: <http://127.0.0.1:8931/mockups/the-hope-to-come-horizon/>

## The idea

It comes from one line in the study, "hope that is seen is no hope at all" (Romans 8:24), and from its one habit, the three
questions. A horizon is the edge of what you can see, so the page is one land seen from one place:

- **Sky: what is promised. Far haze: what it leaves open. Ground under your feet: what it asks now.** Those three answers
  are the three bands of one landscape, with the six readings standing along it and each hook on the ground, because the
  study starts from a funeral, a doubter and a tired church.

## Each section's form, and why

- **01 Six readings ([land.js](js/land.js)).** The reader can **Look up, Look out or Look down**: the horizon moves, that
  band fills the view, and the same question can be read across all six readings. A reading opens below ground, under a
  gold line from its column, with lone notes in the margin and runs of notes across the page in reading order. Reading 02
  sets Paul's four pairs either side of a line, raised above and sown below.
- **02 The promise, then the therefore ([lines.js](js/lines.js)).** Each promise hangs above a gold horizon, its joining
  word sits on the line, and its call stands below. The two passages the study says carry no call are drawn too: their
  line stops at the horizon. The reader can weigh only the rows that say therefore, because the study says a reader may
  weigh the others less.
- **03 What was lost, what Revelation answers ([lines.js](js/lines.js)).** One land told twice, high to low: the face at
  the top, death at the bottom, first pages on the left, last pages on the right. Each thing's line is drawn as that thing
  (river, serpent, thorns that stop). On a wide screen the prophets sit where their books come in the Bible. The reader can
  weigh only the rows that share a word.
- **04 One hope, several maps ([pinch.js](js/pinch.js)).** Four strands drawn in to one gold point, the return. Whether
  the thick mark, the thousand years, falls above or below that point is the whole disagreement, and the shape shows it
  before a word is read. The strands are drawn from where the words landed, so they stay true at any width.
- **Close ([close.js](js/close.js)).** The same horizon: the habit in the sky, the motto on the ridge, the question on the
  ground. Sources are grouped by how each was reached.

## Honest drawing

- Same weight and colour for all four strands, in the study's own order, so no map is favoured.
- Solid or dotted carries the kind of link in section 03. The line's shape claims nothing, and the page says the height is
  only layout.
- The bands mean the three questions, not places. Nothing says where any promise happens, and no face or figure of God or
  of Christ is drawn.

## Wording added for this form

Everything else is the data, or the first mock-up's own labels.

- Controls: "Look up", "Look out", "Look down", "Swipe along the horizon for all six.", "Weigh only the 10 that say therefore", "Weigh only the 6 that share a word", "Show all 17 again", "Show all 11 again".
- Section 02 key: "Above the line:", "On the line:", "Below the line:", around the first mock-up's three column labels.
- Section 03: "The same land told twice, high to low, with each thing at its own height. The height is only how this page lays them out. On a wide screen the prophets sit where their books come in the Bible."; "The first pages", "The last pages", "Isaiah", "Ezekiel", "Zechariah".
- Section 04, narrow screens: "The same four maps as below, in the same order, left to right. Each small mark is a step; the thick mark is the thousand years; all four meet at the return."
- Reading 02: "Raised", "Sown", "the four pairs, as Paul sets them".
- Sources: "Scripture", "Read directly, in part", "Reached through a tool or a reprint".
- Screen-reader labels on the strip and on each map's two lists.

**Changed:** section 02's lead said "The joining word in the middle column is in the verse." There is no middle column now, so it says "on the line". The reading links point down (↓), not across (→). **Shown in full:** the closing passage, Revelation 22:20, whose text the first page only linked to; it comes from the data.

## What was checked

By script against the live preview: all 385 strings in the data are on the page; the first page's 423 text blocks were compared, and the 84 not found as one run were read by eye (different spacing, or the changes above); all 136 passages are linked and every verse shows in its sheet. Keyboard, Escape, Back, click outside, shared addresses, bad address values, reduced motion and touch all passed, with no sideways scrolling, console errors or failed files at 320, 390, 768 and 1440 wide, in both themes.

**Not tested:** 200% zoom, a real screen reader, a real phone, browsers other than Chromium, and measured colour contrast. The first mock-up's note still stands: four Baptist Faith and Message phrases were not checked by script. See its [README](../the-hope-to-come-directions/README.md).
