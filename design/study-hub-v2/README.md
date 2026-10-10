# Expanded Study hub: direction 2

Owner-requested revision, 2026-10-09. [Open the local preview](http://127.0.0.1:8931/mockups/study-hub-v2/).

**Successor:** [Direction 3: three connected landings](../study-hub-v3/README.md) now implements the revised composition for local review. This earlier option is preserved.

## Owner review and revised direction

The later 2026-10-09 review supersedes this mockup's proposed section order. Remove the parent “Explore the collection” accordion; organise both study branches with illustrated subject doors instead. Move Writers of Scripture and Scholars directly below the main entrance cards as section 01. Rebuild Time & place as section 02 and a window into the actual Atlas, with its quality and existing destinations. The Atlas header item is planned to move into Study's navigation when the replacement entrance is implemented. Use this mockup's source shelf and Resources' “Choose a door” as references for the branch selection pattern.

The living architecture and content crosswalk are maintained in the project documentation at `Pages/Study/PLAN.md`, with next steps in `Pages/Study/HANDOFF.md`. This update records feedback only: the preview below is preserved as the earlier visual reference and has not been rebuilt or formally accepted.

## What this retained mockup contains

The owner wanted the parent hub to represent the whole collection rather than feature the recently produced Hezekiah study. The two original entrances remain, followed by:

1. A subject overview with five expandable topics in each branch.
2. Paired Writers of Scripture and Scholars features, aligned beneath their respective branches. These are the second section below the main entrances.
3. A map with four narrative periods and selectable places.
4. Five source types with introductions and available destinations.
5. Six starting questions linking to existing studies and Apologetics.

## Working interactions

- Each subject opens an introduction and links. One subject per branch can stay open.
- Four writer selectors redraw their associated books and link to the existing person page. The Writers entrance opens an inline first-look directory of six writers; it does not open a modal or imply the full future collection has been built.
- Scholars can be explored across five fields using a small illustrative selection from the existing catalogue. Lines group nodes by field and do not claim personal relationships.
- Narrative period buttons update the map, places, introduction and study destinations. Map places are keyboard operable. The period selector is not a dated or proportionally scaled chronology; points marked as regions are explained in their descriptions.
- Source selectors update the introduction and links. The drawings are schematic material types, not reproductions of artifacts or manuscript pages.
- Search includes the new local writers entrance alongside the existing destination index. Theme switching, clearing search, no-results and Escape work.

## Existing and future destinations

The existing `/study` collection is still the Scripture & Theology entrance. Academic Studies still opens the Phase 2 case collection. The dedicated academic landing, writers collection, and expanded Scholar profiles remain later work. No production route, collection, source file or person page was modified.

The original mockup is retained at `../study-hub-v1/`. This revision reuses its base styles and search/frame setup, plus the shared site header/footer and fonts. The shared gallery files contain another chat's uncommitted changes; `gallery-entry.json` preserves the proposed card to reconcile when those edits are finished.

## Sources and verification

Person identities and links come from `data/study/people.json`, `src/data/people-slugs.json` and the existing person routes. Writer/book associations are labelled as traditional attribution in the inline directory. Scholar names and fields were checked against `src/data/teachers/scholars.json`. Existing research destinations come from `content/research/phase-2.json`.

The coastline is the existing Natural Earth geometry in `src/data/atlas-map.json`, using its Mercator projection parameters. Natural Earth is public domain; see `SOURCES.md`. The map uses approximate city/region points, without ancient political borders or inferred travel routes.

Checked in Edge at 320, 390, 768, 1024 and 1440 pixels in both themes. Verified all subject controls, writer selectors and directory, scholarly field selectors, four map states with keyboard-operated places, all source selectors, search and theme switching. All 28 destination URLs loaded actual content. No horizontal overflow, missing icons, page errors or failed asset responses. Section screenshots were reviewed; the map clipping discovered during review was fixed before final capture.

Local checks: `node .local/check-study-hub-v2.mjs`. Images and results: `design/review/study-hub-v2/` (ignored). This remains an unaccepted local design option; no deployment was performed.
