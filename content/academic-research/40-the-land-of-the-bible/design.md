# The land of the Bible: design record

The page, planned: `src/pages/study/land/LandPage.tsx` [not yet built]. Its evidence and limits: [the research record](../40-the-land-of-the-bible.json). Its verses, heights and figures: a data build still to be written, `scripts/build-land-study.py` [planned].

## What this page is for

A reader meets "they went up to Jerusalem", "the valley of Elah", "the early and latter rain", and reads past them, because no one has shown them the ground. They leave able to name the five bands from the sea to the plateau, explain the climb to Jerusalem from heights, say when the rains fall and why Deuteronomy sets them against the Nile, trace the two long roads, and tell a place the ground fixes from a place a scholar proposes. The question it carries: *Where on the ground is this, and how sure is the place?*

## The material's own shape

The land is laid out in bands that run north and south: coast, low hills, ridge, rift, plateau. Scripture moves across those bands more than along them. It goes up from the plain, down to Jericho, across the Jordan. So the shape is a cross-section, a slice cut west to east, with the bands visible as rises and falls. That one drawing answers the subject's first question at once (rule A5). A reader sees why Jerusalem is "up" before reading a word.

## Directions, and one honest gap

The study standard asks for three or four directions built as mock-ups, then a stop for the owner to choose. That stop is not possible inside a remote job, because the owner cannot answer mid-job. So three directions were weighed in writing, none is built yet, and the choice is the owner's.

1. **The slice (recommended).** A west-to-east cross-section through Jerusalem as the main view, with two smaller slices through Galilee and Beersheba beside it. Below the long slice run three thin bands that share its horizontal scale: rainfall, roads and water. A reader points at a place on the slice, and the bands below show what falls there, what passes there and what it drinks. The comparison is visible at once, and it does not need disputed sites to be pinned.
2. **A layered map as the main view.** It is the obvious atlas shape. Rejected as the lead: the Old maps collection already shows the land as maps, and a modern map invites every place to be drawn as a dot, including Ai and Sodom, which the evidence cannot bear. It survives as section 06, a small map of the land's bands, with proposed sites drawn as rings.
3. **A journey.** One traveller's road, Dan to Beersheba or Jericho to Jerusalem, told stage by stage. Lively. Rejected as a frame: it would make the page a narrative and push the climate and the regions to the side. Its best part survives as section 02, the climb from Jericho to Jerusalem.

Against the site's neighbours: Home is a cutaway house, Farming a wheel of the year, Egypt three instruments, the church's reading a glossed page. No study on the site draws a cross-section of ground. The Farming year's wheel stays round; this page has no ring in its body except the faint orbit of the header drawing.

## Headline voice

Concept line: Coast · Hills · Rift · Rain. Title: The land of the Bible, with the turn in gold italic on "of the Bible". Motto: "Sea, hills, rift. / Waiting on the rain."

| Section | Headline | What it does | Depth |
|---|---|---|---|
| Opening | | Trail, title, drawing of a slice of ridge and rift over a cloud from the sea, four true figures, outcomes | Way in |
| 01 The slice | Seventy kilometres. *Five lands.* | The long transect with its eight points; three bands beneath; two smaller slices beside; each region opens a record sheet | Collection, then item |
| 02 Up and down | Up to Jerusalem. *Down to Jericho.* | The climb drawn to scale, the verses that say "up" and "down" from every direction, the pilgrim feasts in Jewish terms, the Songs of Ascents with the open question of their name | Scale change: one road |
| 03 Rain | Rain from the sky. *Not from the river.* | A year bar of the rainy season with the early, winter and latter rains; the rainfall gradient as shaded bands on the slice; Deuteronomy 11 beside a drawing of the Nile; drought records | Comparison |
| 04 Water | Where the water is. *Where the town is.* | Spring, well and cistern as three card miniatures; Hezekiah's tunnel in a sentence with its link | Item |
| 05 Roads and battles | Few ways in. *The same valleys, again.* | The two long roads and the climbing roads on the slice; six battle places, each a three-part record; Elah opened first | Consequence |
| 06 Places and proposals | A place on the ground. *A place on paper.* | The small map of bands, fixed sites as points, proposed sites as rings with holders; Ai and Sodom both ways, linked out | Discernment |
| 07 Claims | Four things often said. *One test each.* | Four popular claims with three-part records and tests | Discernment |
| 08 Where it stops | A selection, stated. *The ground has moved.* | Words to keep apart, reach, neighbours, reading trail, credits, closing question, way back | Trail |

The figures bar, to be confirmed by the build: the drop from Jerusalem to the Dead Sea ("about 1,200 metres in under 40 kilometres"), the rainfall between Galilee and Beersheba ("four times as much in the north"), the regions read ("eight bands and basins"), and the battle places ("six valleys and passes"). Each figure appears only after it has been checked against a named source.

## Behaviour

The view lives in the address: `slice` (Jerusalem, Galilee or Beersheba), `at` (the chosen point), `layer` (rain, roads or water), `open` (the record sheet). An unknown value falls back to the default. The slice is one described image. The list of points beside it is the interface, at a 44-pixel target, and the drawing repeats it for a pointer, out of the tab order. Motion is the header's slow orbit and a cloud drifting in from the sea, which loops. Both stop for reduced motion. Height is stretched many times over, and the stretch is printed beside every slice.

## Where the evidence cannot go

- **No pinned disputed sites.** A proposed identification is a ring with its holder's name, never a dot. Ai and Sodom show both rings.
- **No precise ancient coastline or vegetation.** The slice is today's ground, labelled as such, with a note on what has changed.
- **No weather explanations of miracles.** The ground explains routes and places, and the page says where it stops explaining.
- **Averages are labelled averages**, with their years and source, and the rain bar says that single years swing widely.
- **Explanations from geography are this study's inferences**, kept apart from what the text says in every record.

## Doctrine

Academic study: the land is reported from text and ground, and no doctrine is taught in the site's voice. The stance in section 08 holds Scripture as "truth, without any mixture of error" (Baptist Faith and Message 2000, article I), and says that an uncertain site is uncertainty in our knowledge, not in the text. Where scholars who hold to inerrancy differ (Ai, Sodom), the page shows both and does not choose. What the land means in God's promises is linked to the theology study *The covenants (God's binding promises)*. Jewish pilgrimage and prayer for rain are described first in Jewish terms, from Jewish sources, before any Christian reading.

## What is to be checked

No Berean text was supplied, so the research file quotes no verse. The build must fill every verse phrase from the site's held Berean, prove each verse exists, check that every height and rainfall figure on the page matches the research file and carries a source, check that no proposed site is drawn as a point, and check the page at 320, 390, 768 and 1440 wide in both themes, by keyboard and with reduced motion. None of this proves a reading of the ground is right. Every outside source is still marked "located, not read", and the page is not to be built until each has been read and its note rewritten.
