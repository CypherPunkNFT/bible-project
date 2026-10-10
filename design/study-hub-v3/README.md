# Study: three connected landing pages

**Created:** 2026-10-10 · **Status:** Local design option for S3; awaiting owner review. No production migration or design acceptance.

- [Study hub](http://127.0.0.1:8931/mockups/study-hub-v3/)
- [Scripture & Theology](http://127.0.0.1:8931/mockups/study-hub-v3/theology/)
- [Academic Studies](http://127.0.0.1:8931/mockups/study-hub-v3/academic/)

The controlling documents are [the Study architecture plan](../../../Pages/Study/PLAN.md) and [the completed content/route inventory](../../../Pages/Study/CONTENT-ROUTE-INVENTORY.md). This direction replaces the parent-level subject accordion from direction 2 with structured branch landings.

## The connected experience

The parent keeps the two major entrance cards. Section 01 is **Meet the writers / Follow their work**, immediately below them. Section 02 is a larger **Time & place** Atlas window with a selectable map, ancient cities and Paul's first-journey schematic. The short closing invitation offers two ways into the branches without repeating the full subject catalogue.

Each branch has five illustrated subject choices. A choice opens an inline collection: a subject introduction, a featured starting point, an ordered group of readings and useful shared connections. The layout borrows the source shelf's illustrated objects and Learning materials' selection behaviour. Entries identify whether they open a guide, collection, tool, question, source or preview.

Academic Studies includes the two historical/textual case previews alongside existing Letters, Versions, People and Atlas guides. “Know what you're reading” is a supporting orientation below the selected collection. It is not used in place of subject organisation. Church history identifies incomplete outlines and future studies without fake start links.

The Writers CTA enters the theological People subject and its six-person directory preview. These open existing person pages. The complete Writers of Scripture collection and in-place Scholars profile redesign remain later implementation work. Current Scholars filters and interactions are not modified.

## Interaction contract

- The three mockups link to one another. The simulated header makes Study active and removes Atlas; the real site's header remains unchanged.
- All ten subject choices work. `?area=<id>` survives refresh and browser back/forward. Invalid selections produce a fallback notice. Native links retain open-in-new-tab behaviour; arrow/Home/End keys move between subject links and Enter selects.
- The subject hint reserves space for all its messages. Hover and focus do not shift the collection below it.
- Parent search covers subject entrances, useful readings, writers, scholars and Atlas. Search, suggestions, clear, Escape and no-results work.
- The retained writers artwork changes its book associations and person link. Scholar field controls highlight the relevant illustrative group.
- Atlas mode and place selection use `?atlas=<mode>&place=<id>` in this mockup. Map points work with click, Enter and Space. The outgoing link opens the actual selected Atlas place or city. Paul offers both implemented Story and Letters lenses.
- Theme follows `bp-theme`; reduced motion skips the route drawing and transitions. Phone subject choices form a horizontally scrollable row; the overall page stays within the viewport.

Shared destination pages still use their production navigation; use browser Back to return to the selected mockup. The full origin-aware return-link changes belong to S4. The notebook key and all existing content IDs remain untouched.

## Implementation and provenance

`index.html`, `theology/index.html` and `academic/index.html` use the established shared frame and fonts. `connected.css`, `page.js` and `collections.js` implement the new composition, navigation and subject crosswalk. `artwork.js` contains original schematic subject drawings. `people.js` retains the direction 2 writer/scholar illustrations, with the writer CTA now entering the theological branch.

The Atlas copies the site's Natural Earth coastline and Mercator parameters from `src/data/atlas-map.json`, five existing place identities/coordinates from `data/places.json`, and the tested first-journey coordinates from `src/pages/places/layer-stack-data.ts`. It draws schematic connections between recorded stops, not reconstructed ancient roads. Natural Earth is public domain; existing geography provenance remains in `SOURCES.md`. No map tiles, remote service or new package is needed for this mockup.

Regenerate the three shells, retained people artwork and map data with `python design/study-hub-v3/generate.py` from Website. It reads the retained direction 2 markup and existing Atlas data; it does not modify production code. Hand-authored subject data, styles and interactions are separate files.

The shared `design/catalog.json` and `design/README.md` already contain another chat's edits. They were preserved. `gallery-entry.json` carries this direction's proposed gallery card for reconciliation; all three pages are directly accessible now.

## Verification and review

Verification results and visual observations are recorded in [REVIEW.md](REVIEW.md). Browser automation: `node .local/check-study-v3.mjs`; captures/results: `design/review/study-hub-v3/` (ignored working artifacts). No build or generated production CONTENT refresh is needed for isolated static review pages. No owner decision was recorded by the agent, and no release was performed.

Next: review the connected composition, subject labels and Atlas treatment. Then incorporate feedback and implement the settled branch foundations under S4. The original Study page and all existing collection routes remain available throughout this review.
