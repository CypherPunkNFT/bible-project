# The hope to come: the horizon

A second, wholly different page for The hope to come. The first version stays untouched beside it in
[the-hope-to-come-directions/](../the-hope-to-come-directions/README.md). This page reads that folder's
[data.js](../the-hope-to-come-directions/data.js) and never edits it, so the study's wording has one home.

Mock-up only: not deployed. Preview: <http://127.0.0.1:8931/mockups/the-hope-to-come-horizon/>

## The idea

It comes from one line in the study, "hope that is seen is no hope at all" (Romans 8:24), and from its one habit, the three
questions. A horizon is the edge of what you can see, so the page is one land seen from one place:

- **Sky: what is promised. Far haze: what it leaves open. Ground under your feet: what it asks now.**

## The rule for every section

The owner rejected the first build of this page as muddled and crushed: six narrow columns, ten-across strips and four
paragraphs side by side, all in small type. The closing section was the part that worked, so its language now sets the rule:
**one big thing per band, large type, and nothing small set beside something else.** Long text runs in a single column.

## Each section's form, and why

- **Heading.** Sky with the very large title and, to its right, a line drawing in the hand of the Faith in daily life page: the sun of righteousness rising on a renewed earth (Malachi 4:2). The owner rejected a smaller first drawing (tomb, throne, tree, city on one line) as too small an idea. **The owner chose the city at sunrise ([dawn.js](js/dawn.js)), 2026-10-30.** All four versions stay at [drawings.html](drawings.html), with over the whole world, healing what is wrong, and the river from the sun in [dawn-options.js](js/dawn-options.js). `?drawing=2`, `3` or `4` shows one of the others in place. Unlike that page it does not move, because this page's brief rules out decorative motion. The owner asked for a smaller title close to the trail with the opening verse under it, so the verse now sits there. The first screen ends the land at the foot of the window: hills with the lead in small type and the motto over them, then a filled gold marquee of the verses' own phrases (the owner asked for it, so it is the one thing on this page that moves; it pauses under the pointer and stops for reduced motion), and section 01 starts straight under it. The same
  three bands as the close, so the page opens and ends on one land.
- **01 Six readings ([land.js](js/land.js), [scenes.js](js/scenes.js)).** Opens in rising light with a new heading the owner asked for in place of "Six readings. Three questions each." The study's paragraph about the order of events moved down to the notes under the figures. One reading at a time and large, chosen from a
  rail of six stops. Each stands on the same far hills with its own drawn view: the graves of the people they buried, grain
  rising from what was sown, the throne and open books with the dead standing great and small, a bare tree with its first
  buds, the city with open gates and the river, and a road running to the horizon. The stage keeps one height, so the page
  does not jump. A reading opens below in one column. Then one question can be asked of all six as a plain list, and the
  band turns to the part of the land it asks about. The five figures and the two notes follow, large and in one column.
- **02 The promise, then the therefore ([lines.js](js/lines.js)).** Its own drawing, not the land. Each row runs promise, joining word, call, on one thread, and all the joining words look alike. The ten that say therefore stand together and the other seven below them. The owner turned down a version with one shared "Therefore" hub because it collapsed the sentences into a switchboard, so each row keeps its own word. Each side shows its whole verse from the data, with the row's phrase bright and the joining word in gold where it falls. Where promise and call share a verse it is cut after whichever comes first, so nothing shows twice (Titus 2:12-13 shows verse 12 on the call side for the same reason). Under each word a note counts how far apart the two sides stand, from the verse numbers. The two passages the study says carry no call stop at an open ring. On a phone it becomes one rail.
- **03 What was lost, what Revelation answers ([lines.js](js/lines.js)).** Two facing pages across a dusk that turns to
  dawn. The first pages stand on the left, the last on the right, and the prophets between, under a solid or dotted line.
  The rows keep the study's order, which ends at the face, set largest. The reader can weigh only the rows that share a word.
- **04 One hope, several maps ([pinch.js](js/pinch.js)).** One chart with all four maps lined up on the return. The thick
  bar, the thousand years, sits straight after the return on two maps and straight before it on the other two, which is the
  whole disagreement. Who holds each map opens under it, one at a time. Then one founder's view, and where Baptists do not
  differ as a large statement.
- **Close ([close.js](js/close.js)).** Unchanged by the rebuild: the habit in the sky, the motto on the ridge, the question
  on the ground. Sources are grouped by how each was reached.

## Honest drawing

- Same weight and colour for all four maps, in the study's own order, so no map is favoured.
- Solid or dotted carries the kind of link in section 03, exactly as the section's lead says.
- The bands mean the three questions, not places. Nothing says where any promise happens.
- No face or figure of God or of Christ is drawn: the throne has no figure on it. The city has no temple, as John says.
  The drawings are pictures of what each reading talks about, not claims about what the last day will look like.

## Wording added for this form

Everything else is the data, or the first mock-up's own labels.

- Controls: "Look up", "Look out", "Look down", "Weigh only the 6 that share a word", "Show all 11 again".
- Section 01: "Ask one question of all six."; the short rail names, which are the part of each reading's title before the colon.
- Section 01 heading and its paragraph: "A bright and shining hope.", "The promise of an eternal King." and the sentences under them, which are this page's own.
- Reading 05's four comparison views under `?new-view=a` are drawn from Revelation 21 and 22 but are this page's own pictures.
- Section 02: under each joining word, "same verse", "next verse", "two verses on", "the verse before" or "next chapter".
- Section 03: "The first pages", "The last pages".
- The marquee's phrases are the verses' own words, capitalised; a check at load reports any that are not in the study's verses.
- Section 04: "Before", "The return", "After", "Who holds this map, and why".
- Reading 02: "Raised", "Sown", "the four pairs, as Paul sets them".
- Sources: "Scripture", "Read directly, in part", "Reached through a tool or a reprint".
- Screen-reader labels on the rail, the question band and each map's list.
- The four drawing names on [drawings.html](drawings.html), a comparison page for the owner, not part of the study.

**Changed:** section 02's lead said "The joining word in the middle column is in the verse." It now says "in the middle", which holds on a phone too. The reading links point down (↓), not across (→). **Shown in full:** the closing passage, Revelation 22:20, whose text the first page only linked to; it comes from the data.

## What was checked

By script against the live preview: all 385 strings in the data are on the page; the first page's 423 text blocks were compared, and the 84 not found as one run are the arrows, the changed sentence above, and rows now laid out in a different order; all 136 passages are linked and every verse shows in its sheet. Keyboard, Escape, Back, click outside, shared addresses, bad address values, reduced motion and touch all passed, with no sideways scrolling, console errors or failed files at 320, 390, 768 and 1440 wide, in both themes. Screenshots were looked at by eye at 1440 in both themes and at 390 in dark.

**Not tested:** 200% zoom, a real screen reader, a real phone, browsers other than Chromium, and measured colour contrast. The first mock-up's note still stands: four Baptist Faith and Message phrases were not checked by script. See its [README](../the-hope-to-come-directions/README.md).
