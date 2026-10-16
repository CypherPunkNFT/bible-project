# Cities through their layers — local implementation

14 October 2026. User authorization: “Implement the design and put it up on local,” including inspiration from Preachers, Scholars, theological studies and Atlas. This supersedes the earlier design-only boundary for this study. No publication or public deployment was performed.

[Working local page](http://127.0.0.1:8931/study/cities-through-their-layers)

## Implemented experience

The opening leads directly into the section and evidence desk, initially showing Lachish Level III. Original SVG earth blocks and city-specific architectural symbols represent twelve selected contexts in four cities. Numbered native buttons provide the keyboard and touch equivalent of selecting a block. Block spacing is not a depth or time scale. Jerusalem's separate locations and Jericho's overlapping urban-growth summary retain their explicit qualifications.

The record keeps the excavated feature, dating argument, historical association and sources visible. A paired comparison holds another horizon alongside it. The finds tray preserves each find's evidence, inference and source; single-find contexts avoid redundant controls. Daily life and complete-chapter Scripture links remain alongside the record.

The expanded excavation record holds the city introduction, excavation context, horizon reconstruction, investigation observation, process sequence, reasoning, uncertainty, implication, source and access limitation. It uses measured-height expansion and reduced-motion handling; both its opening and closing controls retain orientation. Escape closes the record before the comparison. URL parameters preserve city, horizon, find, overlay, comparison and record state across reload and Bible-reader navigation.

The subsequent reading sequence preserves the four-step formation experiment, four dating methods, burned-room interpretation exercise, scholarship trail, source directory and onward route. The six published Jericho cereal measurements now have a dedicated, always-discoverable section after the dating methods. Their original data are unchanged: BP, laboratory error and calendar dating are explicitly distinguished.

## Reference inspection and specific adaptations

| Reference | Source and rendered experience inspected | Applied principle |
| --- | --- | --- |
| Preachers & authors | `landing/ArcBand.tsx`; current local arc, screenshots | Each mark has a defined meaning; subdued context remains while selection is prominent. The section's numbered blocks are contexts, never invented quantitative observations. |
| Scholars | `landing/IdeaLineage.tsx`; current local lineage | Selection connects an overview with a particular argument and source. The excavation record retains observation, inference and limits together. No influence graph was invented. |
| Atlas | `AtlasPage.tsx`, `places/AtlasCollection.tsx`; actual `/study/atlas/map` route | Overview and selected evidence remain close; selection lives in URL state; phone detail follows the visual. No unsupported geographical coordinates or borders were added. |
| Jesus & the Gospels | `ChartsPage.tsx`; current Gospel studies landing and selected portrait study | Parallel contexts retain their own labels, sequence and reading links. Lachish's two destruction horizons are compared without merging their events. |
| Letters | Current routed `LettersPage.tsx` → `LettersBrowse`; rendered collection | Subject-specific typography, substantial illustration and varied reading modes rather than a uniform card grid. |
| Miracles | `MiraclesPage.tsx`; rendered category and event-count chart | Explicit units and selection scope. The radiocarbon plot defines each measurement and uncertainty whisker rather than deriving a visual confidence score. |

Earlier design-stage Witnesses and Worldviews inspections remain recorded in `review/`. New application screenshots and browser checks are in `.local/cities-desk-review/` at the repository root. Reference pages themselves were not modified.

## Content preservation

The research files `evidence.ts`, `cities-research.ts` and the structured dossier remain unchanged. The page reads them directly. All four city introductions and excavation notes, twelve horizon records, existing finds and passages, four close investigations, six laboratory values and nine research access records remain accounted for. `CitiesEvidenceLab.tsx` exposes the existing GrainPlot for use in the main reading sequence and changes the formation chapter number to match its new position.

New implementation files are `CitiesDesk.tsx`, `CitiesSectionArt.tsx` and `cities-desk.css` alongside the existing page. The compatibility entry and application route remain unchanged. Standard site header, transition system, fonts, Bible reader and theme tokens are reused.

## Validation and boundaries

Full application TypeScript check passed. The editorial source-policy check passed, retaining Josephus material in Scholars. The existing Vite build workflow refreshed `dist/` without clearing unrelated outputs; the established port 8931 preview serves the result. The build emitted existing third-party module-directive and large-chunk warnings, with no build failure.

Microsoft Edge browser checks covered all twelve horizons, four investigations, comparison, reconstruction overlay, reload, Bible reader and Back, Escape, keyboard operation, normal/reduced motion, close-control focus return and all six measurement buttons. Width checks at 320, 390, 768, 1024 and 1440 passed in both themes. No runtime errors occurred in the exercised paths. Screenshots of the opening, evidence desk, mobile layout, comparison and radiocarbon presentation were visually inspected. The dark-theme masonry contrast was strengthened after that inspection.

Existing evidence gaps remain explicit in the reading trail: Jerusalem's supplementary models, Romano's full object catalogue, Kenyon's complete final reports and a modern recalibration of the Jericho samples were not independently reviewed. This implementation adds no new historical measurements or factual research claims. No screen-reader session or complete external-source availability audit was performed.

The separate forty-study queue and other academic study statuses remain unchanged.
