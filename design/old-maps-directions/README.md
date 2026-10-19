# Old maps: design directions (2026-10-17)

Mock-ups for a new **Old maps** page in the Atlas (`/study/atlas/old-maps`), built from the historical-maps research
corpus, plus excerpts showing how it would sit inside the Atlas and Study. The owner chose to integrate the historical
Holy Land maps with the Atlas and to give them a card in Study; these are the options to choose from. Static
HTML/CSS/JS, not React. Nothing here is wired into the site.

Preview (local only): http://127.0.0.1:8931/mockups/old-maps-directions/ — the small pill at the foot of the screen
switches views, or use `?d=a`, `?d=b`, `?d=c`, `?d=atlas`, `?d=pages`. Light and dark both work (the site's own theme switch).

| View | Address | Idea |
|---|---|---|
| A · Through time | [?d=a](http://127.0.0.1:8931/mockups/old-maps-directions/?d=a) | One lane per biblical subject across 680–1928, a dot per dated map; hover shows the map on a line below, a ringed dot opens it. Then the mapmakers as lifelines, and the libraries with what each licence asks. |
| B · The map chest | [?d=b](http://127.0.0.1:8931/mockups/old-maps-directions/?d=b) | A chest of seven drawers, one per age (before print, XVI–XX, undated). A rail of Roman numerals opens a drawer; its maps lie in a quiet grid with the giant numeral behind, and drawers slide sideways. |
| C · How the land was drawn | [?d=c](http://127.0.0.1:8931/mockups/old-maps-directions/?d=c) | One question: how did the shape of the land change? Eight Holy Land maps (1150–1880) on a year track, each beside the same land as the Atlas draws it; where the sheet faces east or west, today's map turns to match. Then a subject × half-century heat grid; a square lays out its maps. |
| In the Atlas | [?d=atlas](http://127.0.0.1:8931/mockups/old-maps-directions/?d=atlas) | Four excerpts: the Atlas home with a ninth card (a third row, one wide card); strips under Paul's and Moses' journeys and Jerusalem's city card; an "Old maps of this place" row in Jerusalem's map panel; the Study card beside Museum-Grade Archaeology. |
| In the pages: 2 and 3 | [?d=pages](http://127.0.0.1:8931/mockups/old-maps-directions/?d=pages) | Added 2026-10-19 at the owner's request, after he approved parts 1 and 4 of "In the Atlas" for building (both are now built). 2: a quiet row of old maps at the very foot of Paul's and Moses' journeys and Jerusalem's city card, shown under pictures of those pages as they are today (`assets/real/`, captured from the local site). 3: in the map's place panel, a small bar pinned to the panel's foot ("Old maps of Jerusalem · 238") that unfolds upward into four maps and folds away again; folded by default, because it is "not vital, just fun". **Owner, 2026-10-19:** 3 approved and built (`src/components/atlas/OldMapsFold.tsx`, 53 places); 2 declined, "too much content for little gain". |

Every direction opens a map in the **slide-in viewer**: it slides in from the right under the site header and slides
away on close (Esc or ×). Scroll or pinch to zoom, drag to pan, double-click to fit. Below the map: title, mapmaker,
year (with the library's confidence when it is not exact), holding library, subjects, the library's own description
where it has one, the full title, credit and licence, and a link to the source record.

## Approved sections used

From [design/README.md](../README.md):
- **Cabinet intro** (big plain type, four small figures beside it): B's landing.
- **Through time (lanes)**, made interactive as asked: hovering a dot shows that map on a line below the lanes. A.
- **Crystals by kind (filter)**: the subject chips with colour, icon and count, in A and B.
- **The cabinet / cinema chapters**: B's drawers, with the giant numeral behind and the sideways slide.
- **The journey map as a side panel**: the viewer, in every view; closing slides away, never flashes out.
- **Where is he named? (the clickable grid)**: C's heat grid, where a square opens its maps.
- **Lifelines** (Authors): A's mapmakers section.
- House style throughout: the Atlas topline, the tile row (now nine tiles, Old maps current), numbered sections with
  a short plain lead, figures in one quiet bar, serif titles with one italic accent word.

Avoided per the owner's dislikes: no endless scroll (each view is two or three compact sections), no glow, no boxes
around every item (maps are pictures with a hairline caption), no neon or game look, no focus ring on any control.
The one new drawing (the Old maps card: sheet, sea, compass rose, ship, Jordan and lakes, walled city, cartouche,
scale bar) loops slowly: the rose turns back and forth and the ship rides the swell; reduced motion stops both.

## The data (all numbers on the pages are computed by build-data.py)

[build-data.py](build-data.py) reads `Research/HistoricalMaps/normalized/catalogue.json` and the per-source records,
and writes [data.js](data.js) and the images in [assets/](assets/). Run it from `Website/`:
`python design/old-maps-directions/build-data.py` (Pillow; about a minute; re-runs reuse finished images).

- Catalogue: 2,317 records; 2,006 held maps (with a scan, not withheld, `record_kind` map).
- 1,889 usable sheets after dropping off-topic titles (railways, Kamchatka, Minneapolis…) and atlas covers, title
  pages, text pages, index sheets and statistical diagrams.
- **1,093 maps on a biblical subject by their own title**, 862 of them dated, 680–1928; 343 named mapmakers; 10
  holding libraries. These are the figures the pages show.
- Shown in the mock-ups: **211 maps** as previews (every Paul, Jesus and Exodus map that decodes, then a spread
  across subject × century, best-attributed first; one copy per title), **12 at full size** for the viewer (the eight
  in direction C plus Arculf's Jerusalem 680, Visscher's travels of the apostles 1642, the patriarchs and Exodus map
  1700 and Adrichem's Jerusalem 1730). The other 199 open in the viewer as a small preview with a note that the built
  page opens the library's full scan.
- Assets: 9.9 MB (previews ≈340 px, full ≈1600 px). Each JPEG is wrapped in an `.svg` file because the local
  preview's mock-up server only sends html, css, js, svg, png, woff2 and json; adding `".jpg": "image/jpeg"` to
  `MOCKUP_TYPES` in `vite.config.ts` would let plain JPEGs be used (about 25% smaller). That file was not touched.
- Today's land in C and the place panel: the Natural Earth 50 m coast already in
  `design/apostle-directions/data/land-50m.json`, and places and verse counts from `data/places.json` (OpenBible.info).

### Data problems found

1. **The corpus subject tags overcount.** They are keyword hits over titles, descriptions and publisher lines, often
   as substrings. Among held maps, by tag versus by the map's own title:

   | Subject | Corpus tag | Title says |
   |---|---:|---:|
   | Holy Land | 1,009 | 587 |
   | Jerusalem | 829 | 238 |
   | Eden, Flood, nations | 392 | 17 |
   | Assyria, Babylon, Persia | 310 | 134 |
   | Egypt | 228 | 92 |
   | Asia Minor & seven churches | 179 | 102 |
   | Tribes | 108 | 75 |
   | Exodus | 69 | 51 |
   | Paul | 32 | 27 |
   | Temple | 20 | 17 |
   | Jesus | 31 | 64 (the title rule also counts "in the time of Christ", "Nazareth", "Galilee") |

   Causes: `jerusalem-plan` fires on "sion" inside words (division, extension) and on any map naming Jerusalem in
   its description or as an inset; `paradise-eden` fires on "ark" inside Mark, Denmark, Park; `asia-minor-churches`
   on "Philadelphia" as a publisher's city; `pauls-journeys` on St Paul (Minnesota), railways and harbours. The
   mock-ups re-tag every map from its title with word rules (in build-data.py) and say so on the page.
2. **Off-topic maps in the corpus**: Klondike tobacco covers, Chicago railways, Kamchatka harbours, Paris
   arrondissements, Minneapolis; excluded by title.
3. **Modern items**: undated CC-licensed Commons files are mostly modern teaching diagrams ("Biblica Open Bible Map",
   "Exodus map") or photographs of museum exhibits (86 "Jerusalem-Terra-Sancta-Museum" photos by one photographer);
   left out. On Commons the "author" of a CC file is usually the photographer, so it is credited but not counted as
   a mapmaker.
4. **Some dates are wrong**: e.g. Stanford's "The Euphrates Valley" is dated 1514 (the firm worked in the 1800s–1900s);
   the year is shown as the library gives it.
5. **Many Internet Archive JPEG 2000 files allow only one level of reduced decoding** (39 failed on the first build);
   the build now steps down until a decode succeeds. All 211 selected maps decoded in the final build.
6. **Duplicates**: the same map is often held several times (four scans of Ortelius's *Peregrinationis Divi Pauli*);
   the selection keeps one per title.
7. One mapmaker can appear spelt two ways (Münster / Munster); A's lifelines group them.

## Licences and credits

Every image shown carries its credit and licence, in the viewer and under C's maps (rule of 2026-10-17, see
`Research/HistoricalMaps/MANIFEST.md`):
- David Rumsey items (CC BY-NC-SA 3.0): "David Rumsey Map Collection, David Rumsey Map Center, Stanford Libraries",
  share-alike, non-commercial. 91 of the 211 shown.
- Library of Congress and New York Public Library (public domain): the institution named as courtesy. 25 and 10.
- Wikimedia Commons: public domain or CC0 files name the holding library where the record gives one (National
  Library of Israel, British Library, Bibliothèque nationale de France…), else Wikimedia Commons; CC BY / BY-SA files
  credit the named author. Records with a `provenance_caution` (Commons public domain versus Rumsey's own licence) are
  left out, as is anything withheld or without a held file.

## Real versus mock

- **Real**: every map, title, year, mapmaker, library, licence, credit, description and count; the coastline and place
  points; the eight Atlas card drawings and wording (copied from `PlacesArtwork.tsx`, `AtlasCollection.tsx`,
  `history-collections.ts`); the Study card wording for the three existing cards (`collections.ts`).
- **Written for the mock-ups**: the page wording; the notes on C's eight maps (only what the record, the holding
  library's description, or the sheet itself shows; the "which way is up" is read off each sheet); the Old maps
  drawing and tile icon; the subject icons; the simplified Study card drawings.
- **Mock only**: links go to the site's addresses but nothing is wired; "See all" links point at view A; the journey,
  city and map areas in the Atlas view are placeholders around the new strips; 199 of 211 maps are small previews.

## Files

[index.html](index.html) · [page.js](page.js) (switch and mounting) · [common.js](common.js) (look-ups, frame, chips,
thumbnails, today's land) · [viewer.js](viewer.js) · [art.js](art.js) · [dir-a.js](dir-a.js) · [dir-b.js](dir-b.js) ·
[dir-c.js](dir-c.js) · [atlas-view.js](atlas-view.js) · [om-base.css](om-base.css) · [om-views.css](om-views.css) ·
[om-atlas.css](om-atlas.css) · [build-data.py](build-data.py) · [data.js](data.js) (generated) · `assets/` (generated) ·
`shot-a.png`, `shot-b.png`, `shot-c.png`, `shot-atlas.png` (1440 px, light, top of each view).

Checked with Playwright at 1440 and 400 px, light and dark, every view: no console errors, no failed requests, no
horizontal page scroll; viewer opens, zooms and closes (slides away); C's turn and B's drawers and filters work.
