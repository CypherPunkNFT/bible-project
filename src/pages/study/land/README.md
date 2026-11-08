# The land of the Bible: the built page

Address: /study/the-land-of-the-bible · Study 40 · Built 2026-11-07 by the Academic page run (step 1 of sequence 28).

Research record: [40-the-land-of-the-bible.json](../../../../content/academic-research/40-the-land-of-the-bible.json) ·
design note: [design.md](../../../../content/academic-research/40-the-land-of-the-bible/design.md) ·
build script: [build-land-study.py](../../../../scripts/build-land-study.py).

## Findings as the work went (written as found)

- The research record has 61 check notes: 34 confirmed, 12 corrected, 2 link, 13 open. Twelve of the open ones are
  on the sources' web addresses (all twelve sources have an empty `url`), so no source on the page carries a link;
  each shows its note instead. One open note sits in the Via Maris claim's limit.
- The design note says "the page is not to be built until each [outside source] has been read". The run's brief and
  the owner (2026-11-07: "build these pages as soon as we can, and then I'll edit it") say build now. Built now; every
  source is shown as "located, not read", as the record says.
- The record names 117 verses across its sections (48 in its top-level list, 69 more inside sections; its own note
  says the build should add those). All 117 exist in the site's Berean; the build takes each verse's text from there.
- The record's gloss "watered 'by foot'" (Deuteronomy 11:10) is not the Berean's wording, which says "irrigated on
  foot". The page quotes the Berean; the record's words are left as written for the owner to decide.
- The record's link titles "The peoples around Israel (35)", "Archaeology and the Bible (06)" and "The Bible and the
  ancient Near East (32)" do not match the study list's titles for those numbers (35 is "Mesha and the world of Moab",
  6 "From discovery to history", 32 "Egypt beside Israel"). They are shown without a link. "Israel from the exodus to
  Solomon (38)" and "The patriarchs in their world (39)" are not built yet, and there is no covenants page yet: no link.
  Linked: the Old maps collection, Home and household (27), The farming year (29).
- The transect's `otherLines` says "The page draws two more slices, through Galilee and through Beersheba". The record
  holds no heights for those lines, so they are not drawn; the page says so under that sentence.
- The rainfall figures carry no years averaged (check note c24 asks for them before publishing); the page labels them
  long-term averages with the years not yet printed.

## The build script and its refusals

`python scripts/build-land-study.py` writes [land-data.json](land-data.json); `--check` rebuilds in memory and fails if
the file differs by a byte (it never writes); `--selftest` tries wrong inputs in memory. Run on 2026-11-07:

- build: wrote 30,249 bytes: 117 verses, 17 quotations, 3 links, 10 fixed points, 4 rings. `--check`: up to date.
- `--selftest`: 14 of 14 wrong inputs refused, and the real record still builds:
  1. a quotation one word off the Berean (Luke 10:30 "going up") — refused;
  2. a quotation with one changed capital (Deuteronomy 11:11 "Heaven") — refused;
  3. a verse that does not exist (Jonah 1:99) — refused;
  4. a chapter that does not exist (Joshua 99:1) — refused;
  5. a book the catalogue does not know ("Hezekiah 1:1") — refused;
  6. a record phrase that is not the Berean ("irrigated by foot") — refused;
  7. a link that leaves the site (https://example.com/…) — refused;
  8. a link to a route the site does not have — refused;
  9. a protocol-relative link (//example.com/x) — refused;
  10. Sodom drawn as a fixed point — refused; 11. Ai (et-Tell) drawn as a fixed point — refused;
  12. transect points out of west-to-east order — refused;
  13. a test with two supported answers — refused;
  14. a rainfall figure the record does not hold (Jerusalem 600) — refused.
- The design note's headline for section 01, "Seventy kilometres. Five lands.", does not fit the record's own slice, which
  runs 105 km from the shore near Jaffa to the plateau near Mount Nebo (about 90 km to the Jordan). The page says "A hundred
  kilometres. Five lands." The owner may prefer other words.

## Folder checks (2026-11-07)

- `npx vitest run src/pages/study/land`: 1 file, 17 tests passed. They check: the data was built from this record
  (record hash only; changes to the Berean, places or coast data are caught by the build's `--check`, not by this test);
  every verse the record names anywhere has Berean text; every quotation stands word for word in its verse and every
  "up"/"down" line says so; the figures follow from the record's numbers; the slice states its stretch and the climb is
  drawn at true scale; no proposed site is a point and each disputed site has two rings; links stay inside the site and
  no source gets a link while its address is empty; unknown address values (including `__proto__`) fall back; route.ts
  is exactly the brief's line; no raw HTML in the folder; and a render test: heading and all eight sections draw, no
  `{{check:` marker leaks into the text, a verse reference opens the sheet and Escape closes it, a check note opens,
  closes the record sheet as it opens, and closes on Escape; the chosen point follows the address and the list.
- `npx eslint --max-warnings 0 src/pages/study/land`: clean (after moving the sheet's context to open-context.ts).
- `npx tsc -p tsconfig.app.json --noEmit`: no errors.

## What is built

One page in eight sections after the standard opening (trail, gold concept line "Coast · Hills · Rift · Rain", the title
with "of the Bible" in gold italic, the lead from the record's premise, a line drawing of a slice of ridge and rift with a
cloud drifting in from the sea in a faint circle and dotted orbit, motto "Sea, hills, rift. / Waiting on the rain.",
then a figures bar whose four numbers the build works out from the record):

1. **The slice**: the record's eight points from the shore near Jaffa to the plateau near Mount Nebo, joined by straight
   lines (no ground is drawn between them), height stretched about 19 times and saying so; the list of points is the
   control, the drawing repeats it for a pointer; three bands beneath (rain, roads, water) at each point, placed by this
   page from the record's own descriptions and labelled so; `layer` picks the band explained under the drawing; the
   eight regions as cards that open their records.
2. **Up and down**: the Jerusalem–Jericho road drawn at true scale and at ten times, then twelve Berean lines that say
   "went up" or "going down", checked word for word by the build; the pilgrims' going up, Jewish practice first.
3. **Rain**: a year bar with the record's three rains, the record's rainfall figures as bars, Deuteronomy 11:10–11 beside
   a drawing of the Nile against a rain cloud, winds, dew, drought, the storm god and prayer for rain.
4. **Water**: spring, well, cistern and Hezekiah's tunnel as four cards with their own miniature.
5. **Roads and battles**: four roads, three kinds of trade, six battle places with the Valley of Elah opened in place.
6. **Places and proposals**: a small map (Natural Earth coast; fixed sites from the site's places data; lakes, Jordan line
   and band names drawn by this page); Ai and Sodom as two rings each, placed by the record's words, never as points.
7. **Claims**: four claims, each in three parts with a question the reader answers before the page says which answer the
   evidence supports.
8. **Where it stops**: words to keep apart, reach, neighbours (linked only where a route exists), the site's stance,
   the record's fifteen open questions, the reading trail with "located, not read" on every source and a "Why no link
   yet" button that opens each source's open check note, the closing question and the way back to Academic studies.

The address holds `at` (the chosen point), `layer` (rain, roads or water), `battle` and `open` (the sheet: a record such
as `region:coast`, or a verse such as `verse:Luke 10:30`). Unknown values fall back. Every research string is shown
through the shared `<Checked>`, so each settled check mark is a highlighted passage that opens its note on the right;
opening the page's own sheet closes a note and opening a note closes the sheet.

## Which page this could be confused with, and why it is not

- **The farming year** (/study/the-farming-year) shares the rain: it is a wheel of the year and its work. This page has no
  ring in its body; it gives the rain one flat bar and says only when it falls, then hands the work to that study.
- **The Old maps collection** and the Atlas show the land as maps. This page leads with a cross-section, and its one map
  is small, schematic, and draws proposals as rings.
- **Egypt beside Israel** compares two lands with instruments; here Egypt appears once, as the Nile against the rain.

## What the checks do not prove

The build proves that every reference exists, every quotation is the Berean's words at its reference, every printed
figure follows from the record's numbers, and no proposed site is a point. It does not prove that any height, rainfall
figure or reading of the ground is right: every outside source is still "located, not read", and those figures rest on
the record's check notes. The record-hash test does not notice a change to the Berean, the places data or the coast
file; the build's `--check` does.

## Browser checks (preview at http://127.0.0.1:8931, served from dist/, 2026-11-07)

- 1440, 768, 390 and 320 wide, light and dark: the page itself never passes the right edge (no element of `.ls-root`
  is wider than the window). At 320 the document is 349 px wide because of the **site header's** menu button; the same
  349 px shows on /study/the-farming-year, so it is the shared header, not this page.
- No console errors or warnings at any width.
- By keyboard at 390: Enter on the verse reference "Luke 2:4" opened the sheet with its Berean text, put focus on the
  close button and put `open=verse:Luke 2:4` in the address; Escape closed it and focus came back to the reference.
  Enter on a highlighted passage in section 03 opened its check note on the right (focus on its close button); Escape
  closed it and focus came back to the passage.
- Screenshots looked at (1440 dark: opening, slice, climb, rain, places; 390 light: opening, slice, sheet, note; 320
  dark: rain, places). Fixed after looking: the shared button reset was outranking the page's own button styles (cards
  lost their single border); "sea level" sat on the "0 m" label; the map's land closed along the wrong edge; band and
  site names overlapped points on the map; the stretched climb was too tall (now five times, and said so).

## Not tested

- Reduced motion was not switched on in a browser; the CSS stops the orbit, the cloud and the sparkles and the sheet's
  slide under `prefers-reduced-motion: reduce`, read but not seen.
- No screen reader was run. The slice has a written description and the list beside it; the map, year bar and header
  drawing carry labels; the other drawings are marked decorative.
- Safari and Firefox were not opened; the preview's browser is Chromium (Brave).
- The page was checked against the record as it stands; the outside sources were not read, so no figure was checked
  against them by this job.

## For the owner

- The design note said not to build until the outside sources were read; the run's brief said build now. Built now,
  every source shown as "located, not read", none linked (their addresses are empty and their notes say so).
- Which neighbour pages to link once they exist (38, 39, a covenants page), and what the record means by its three
  mismatched titles (35, 06, 32).
- Whether to measure and draw the Galilee and Beersheba slices, which the record promises but has no heights for.
- The years averaged for the rainfall figures.
- The headline for section 01 ("A hundred kilometres" in place of the design's "Seventy kilometres").
- The record's "watered 'by foot'" against the Berean's "irrigated on foot".

## Re-run of every check (2026-11-07, 17:31, after the last preview build)

- `python scripts/build-land-study.py`: wrote 31,022 bytes (117 verses, 17 quotations, 3 links, 10 fixed points, 4 rings), exit 0.
- `python scripts/build-land-study.py --check`: up to date, exit 0. `--selftest`: 14 of 14 wrong inputs refused, exit 0.
- `npx vitest run src/pages/study/land`: 1 file, 17 tests passed.
- `npx eslint --max-warnings 0 src/pages/study/land`: exit 0, no warnings.
- Preview served from dist/: GET /study/the-land-of-the-bible returned 200; in the browser the title is "The land of the
  Bible · Bible Guide", the h1 "The land of the Bible", all nine sections drew (landing, slice, climb, rain, water, roads,
  places, claims, stops), none failed, and the console had no messages.
