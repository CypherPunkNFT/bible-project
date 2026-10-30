# Faith under pressure: the wall

**Class:** LIVING · **Built:** 2026-10-30 · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/faith-under-pressure-load-bearing/ · Earlier version, untouched: [faith-under-pressure-directions](../faith-under-pressure-directions/README.md) · Study text: [content.md](../../content/studies/christian-life/faith-under-pressure/content.md)

## The idea

The study teaches one question above the others: **what ground does this stand on?** So the page is one cut through the ground, with air and what presses at the top, a wall in the middle, a ground line, and older Scripture beneath it.

**Every stone is one verse, as long as the verse is.** All 76 verses are laid in reading order, so each pier's shape is computed from the Bible text and not drawn by eye. The study's central claim is "do not make every hardship tell the same story", so the six piers do not take the same load:

| Reading | What the wall shows | From the text |
|---|---|---|
| Trials | Arrows of different weights | "trials of many kinds" (James 1:2) |
| Temptation | A pull starting inside the wall; a door at its foot | "his own evil desires" (James 1:14); "an escape" (1 Corinthians 10:13) |
| Anxiety | A load thrown up and off, lighter arrows left in place, something prowling around the foot | "Cast all your anxiety on Him" (1 Peter 5:7); "prowls around" (1 Peter 5:8) |
| Persecution | Words thrown from one side, heat at the foot, a basket on a rope | "insulted" (1 Peter 4:14); "the fiery trial" (4:12); "in a basket" (Acts 9:25) |
| Grief | No arrows at all. One stone missing, nothing put in its place, a small light in the gap | "those who sleep in death" (1 Thessalonians 4:13) |
| Contentment | A dashed course and two unequal arrows; a prop of other people's help leaning on the wall | "having plenty and having need" (Philippians 4:12); "share in my affliction" (4:14) |

The motto, "A small light. Two hands. Held, not explained.", is the two curved runs of stone around one flame at the top and bottom of the page. Each pier carries the same small flame.

## Section by section

- **Heading:** laid out like the Hope to come landing, at the owner's request (2026-10-30), filling the first screen. In the sky, the trail, gold page words, a two-line title and the opening verse in gold sit beside a full line drawing: the whole dry-stone wall in the rain, arrows of different weights, a bare thorn, a prop, and an arch of two curved runs of stone around the small light. Its footings go below one full-width ground line into layers of earth, which hold the lead and the motto. A gold band closes the screen. Unlike Hope's, the band and the drawing do not move, because this page's brief rules out decorative motion.
- **Six piers:** the way into the readings, standing on one shared ground line. Choosing one is the page's only motion: its load lands and the wall takes it. Nothing moves at rest, and reduced motion removes it.
- **A reading:** opens under the wall. Its pier is drawn large, with verse numbers on the stones, each linked to its verse. The pressure, the call, the ground and what is not promised sit at the heights where the drawing shows them. Under the ground, dashed stones stand for what the passage does not promise. In the text, cautions and sources stand in the margin level with the sentence they qualify.
- **Name the pressure, find the ground:** all 76 verses as one wall, with the marked phrases cut into their stones in the three colours. Choosing a kind leaves only those stones standing and the rest as outlines. "The six calls" sets each reading's one word as large as the width allows.
- **Older words, underneath:** each letter's verse above a ground line and the older passage it quotes or retells below it. Nine of the thirteen lie under 1 Corinthians 10, which is true of the data and visible at once.
- **Close:** the wall at dusk in both themes, with the same small light.

## What stayed

All wording, Scripture, notes and caveats come from [data.js](../faith-under-pressure-directions/data.js), read in place and not edited. Fixed sentences from the old page's code are carried over word for word. These capabilities remain: full readings with whole, step-by-step and Scripture-only modes; the verse sheet for every passage; filters and counts; the list of older passages; the source list; every choice in the address. Old `reading`, `sheet`, `lens`, `view`, `only` and `older` values still work here.

## Labels added

Only these are new, and all are interface or explanation:

- **How to read this drawing:** "every stone is one verse, as long as the verse is. A pier's height counts verses; it does not measure how hard a thing is. Gold stones state a ground, and open readings show the other marks. The arrows, the door, the gap and the prop are this site's picture of what each passage says, and the words beside them are the passages' own. The stones under the ground are older Scripture its letters quote or retell."
- **Under each large drawing:** "Stones run in reading order: [passages]. Choose a stone to open its verse. Dashed stones under the ground: what this passage does not promise."
- **Gold band:** six of the study's marked calls, one to a reading, in the verses' own words with the first letter capitalised: "he should ask God", "flee from idolatry", "present your requests to God", "respond with gentleness and respect", "encourage one another", "learned to be content". The page reports an error if one stops matching the marks.
- **"The footings"** replaces the old switch label "The threads". The old chart's legend ("bar", "ring", "disc") is gone with the chart; the same three meanings are in the filters.
- **Drawn on the piers:** the ten phrases in the table above, all the passages' own words, checked by script. "share in my affliction", "in a basket" and "an escape" are set across lines.
- **On a stone:** where a verse has two separate phrases of one kind, they are joined with " … ".
- **Scripture only** now shows the reading's whole passages with the study's marks, not only its set-apart quotations, which are all inside those passages.
- **Step by step** now records the step in the address (`step`).

## Honest limits of the drawing

- It draws no storm clearing, no summit and no pier growing. The anxiety pier keeps lighter arrows after the cast, because the study gives no date on which the feeling will stop.
- God is not pictured: the cast load simply leaves the frame, and the heading's "two hands" are two runs of stone, not a figure.
- The heading's rain does not stop and its sky does not clear, because the study gives no such promise.
- Grief's pier is the smallest because the passage has six verses, and the page says height is not a measure of hardship.
- Grief's gap and the arrows are this site's picture and are labelled as such. The sorting of phrases into three kinds is this site's reading, as the page already says.
- The study takes no side on the timing of the meeting in the air or on whether a believer can finally fall away beyond what its text says, and nothing drawn here touches either.

## How it is built

[index.html](index.html) loads the old folder's data.js and the site frame. [js/stones.js](js/stones.js) lays the stones and holds the loads. [js/dusk.js](js/dusk.js) draws the heading. [js/core.js](js/core.js) has helpers and the address, [js/page.js](js/page.js) the page, [js/reading.js](js/reading.js) one reading, [js/wall.js](js/wall.js) the verse wall and footings, [js/sheet.js](js/sheet.js) the passage sheet. CSS is in [css/](css/). The study kit, other studies and the visual inventory were not used.

## What was checked, 2026-10-30

- **By script:** all 161 strings from data.js appear verbatim, each reading's blocks in data order; all 76 verses match their stones and every marked phrase is on its stone; all 140 passage entries open in the sheet with every verse; all drawing labels occur in the Scripture held. Of the old page's 224 lines of text, 219 remain; the other five are the old chart's labels ("bar", "ring", "disc", "The threads") and a state label with its arrow removed.
- **In a browser:** 320, 390, 768 and 1440 wide, in both themes, in eight page states: no sideways scrolling, nothing past the edge, no console errors or failed files, no focus outline. Keyboard: piers, wall arrow keys, sheet, Escape, focus return. Reduced motion, shared addresses, bad address values and Back.
- **Not tested:** a real screen reader, 200% zoom, a real phone or touch device, and measured colour contrast. The phrase "in His own time and in His own way" (Article 10 of the Baptist Faith and Message) still needs comparing by eye against that article, as the old README says.
