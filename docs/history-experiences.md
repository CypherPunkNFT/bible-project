# History experiences

Local academic expansion, 14 October 2026: “Cities through their layers” now includes deposit-formation and dating investigations, sourced measurement plotting and an expanded reading trail. See `cities-expansion-research.md` and `content/academic-research/08-cities-through-layers.json`. This revision is local only; the deployment record below describes the earlier version.

The History & archaeology catalogue links to `/study/world-of-jesus-and-apostles` and `/study/cities-through-their-layers`.

The journey contains seven situations: Capernaum, Magdala, Jerusalem, Caesarea, a Mediterranean crossing, a Corinthian gathering and an Ephesian street. Selection is reflected in the `scene` query parameter. Everyday life, government and regional differences are separate reading choices, with three evidence points and relevant Bible chapters for each scene.

The archaeological explorer contains three selected horizons each for Jericho, Lachish, Jerusalem and Corinth. The `city` and `layer` parameters preserve a selected context. These are composite teaching sections, never measured profiles. Jerusalem explicitly combines distinct excavation areas. The restoration overlay is hypothetical; it is not an archaeological reconstruction of a named structure.

Research records and claim-specific source links live in `src/pages/study/history/evidence.ts`. Primary excavation projects, museum records, inscription editions and the published Jericho radiocarbon study anchor the material. Wood and Bienkowski are linked as competing interpretations; the 1995 radiocarbon result is not presented as supporting a 1400 BCE destruction or as a fresh recalibration. Literary passages are identified as literary evidence rather than proof that an illustrated building is the narrated location. No material dependent on Josephus has been added to these pages.

`CitiesLayersPage.tsx` is a compatibility entry point for `CitiesThroughLayersPage.tsx`. The `archaeological-journeys.css` stylesheet is scoped to `.ha-study` and separated from concurrent history styling. Diagrams are original schematic drawings and include visible reconstruction labels; no external photographs are reproduced.

Verification uses `.local/check-history.mjs` against the established preview at port 8931. It exercises all scenes, reading choices, evidence points, city horizons, restoration and question feedback, reload state, catalogue links, and 320/390/1440 px layouts in both themes. `.local/history-tsconfig.json` permits a focused typecheck independent of concurrent work on other studies.

Published as Cloudflare Pages deployment `4d46c0c1-e83d-473b-a337-6c049185a28e` on 2026-10-14 UTC (2026-10-13 Eastern). The focused release preserves the preceding production worker and routes, and excludes unrelated working-tree studies. The complete interaction and responsive-layout check also passed on `https://bibleproject.io`, recorded in `.local/history-production-browser-report.json`. The editorial source check, focused TypeScript check and release build passed. The full working-tree TypeScript check remains affected by the unrelated `replaceAll` library-target error in `src/pages/study/hub/StudyBranch.tsx`.
