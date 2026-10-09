# Country-panel component mock-ups

Preview: http://127.0.0.1:8931/apologetics/worldviews/islam?country=PAK&atlasDesign=a#muslim-world . The A/B/C/D toggle changes the panel beside the real globe in the existing Islam page. Country, tab, map and cached country data survive switching. These are transplantable components, awaiting the owner's selection.

| Option | Country header | People Groups |
|---|---|---|
| A | Original region/name/64×48 flag card and thin-line demographic grid, with search attached above | Three-column ledger with clear engagement badges |
| B | Flag/name beside search, with a horizontal metric ribbon | Two-column individual group cards with population, language and religion |
| C | Framed passport: identity on the left, stacked demographic facts on the right | Engagement sections with population bars and section counts |
| D | Country banner above search and a compact demographic ledger | Expandable group directory with details inside each entry |

C's Gospel Presence cards are preserved, per the owner's preference. This preference applies to that section only; it does not accept the whole C option. A keeps the original country-card typography and geometry. No option has a region dropdown. Search says “Search all 53 countries”.

People Groups uses four filter buttons: all, unengaged and unreached, engaged yet unreached, and no longer unreached. Each shows its count. Orange, blue and green distinguish those three categories with icons and full labels. All layouts use the same complete, source-validated lazy country snapshot, search and filters; no new dataset or duplicated fetch layer.

Scrollbars are a pill-shaped thumb only, without a visible track, outside the scroll viewport on its right. PillScroll supplies native wheel/touch scrolling, a draggable thumb and keyboard controls. Filtering, expansion and resizing update the thumb. Search results use the same external-pill component.

Transplantable files: `src/components/apologetics/CountryPanelPrototype.tsx`, `CountryPanelHeader.tsx`, `country-panel-prototype.css`, `CountryPeopleGroups.tsx`, `country-people-groups.css`, and `PillScroll.tsx`. The prototype takes country/design/tab props and callbacks. `MuslimWorldExplorer.tsx` loads it only for `atlasDesign=a|b|c|d`. Adopting a selected option means fixing the design and removing the toggle.

Old `/mockups/muslim-world-panels/?d=a` bookmarks redirect to the existing atlas. Earlier standalone assets are superseded. Existing data, flag provenance and icon licensing apply. Regression coverage: `e2e/atlas-panel-prototype.spec.ts`; visual review includes all four Gospel Presence and People Groups views. No deployment or owner acceptance is recorded.
