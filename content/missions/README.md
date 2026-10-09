# Muslim-world country explorer

The Islam collection includes a textured rotating globe adapted from `design/apostle-directions-2/js/globe.js`. Select a highlighted country or use the searchable selector. Selection is shareable as `?country=PAK#muslim-world`; other query parameters, including the comparison question, are preserved. This section is specific to the Islam collection.

`muslim-world.json` is a derived, bundled snapshot, not a runtime call to an external API. It covers all 53 countries and territories above 50% Muslim identification in Pew Research Center's 2020 estimates. Religious identification is not the state religion or an assertion about every resident. The panel shows 2020 population and religious shares separately from IMB's 2026-10-09 snapshot. Do not multiply a 2020 percentage by IMB's current population estimate.

## Data and definitions

- Pew: [Religious Composition by Country, 2010–2020](https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/), published 2025. Data is extracted from the interactive's public embedded dataset. Display shares to one decimal place and populations as approximate compact estimates. A displayed 0.0% is a rounded value, not necessarily an absence of adherents.
- IMB: [People Group Points](https://www.arcgis.com/home/item.html?id=4480316ef90c467ba30517809180c536), maintained by `imbGIS`, from the public `pgOrgPointsStaging` feature service. The dated `CaptureDate` is saved as `snapshotDate`. Sum active records by `ISOAlpha3` and their **published** `EngagementProgress` category: 0 = unengaged and unreached, 1 = engaged yet unreached, 2 = no longer unreached. Do not substitute a fresh classification based on GSEC or infer engagement solely from recent church-planting activity. The service's actual categories are preserved, even where documentation or cached country profiles differ.
- Counts include **all** people groups recorded in that country, not only Muslim groups. A group reported in multiple countries contributes to each country's own count; do not add country counts and call the sum unique global peoples. The three largest recorded groups are examples, not a comprehensive population portrait. Language names describe those groups, not a list of official national languages.
- IMB's [definitions](https://peoplegroups.org/definitions/): unreached is below 2% evangelical Christians; no longer unreached is at least 2%. Engagement describes a sustained effort to establish self-sustaining evangelical churches. These are IMB classifications of groups, not an assessment of the faith of every individual or a country-wide completion score.
- Attribution and transformation are stated on the page. The ArcGIS item's license field links [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/); preserve that link and attribution. No IMB endorsement is implied. Missing or unclassified facts must fail the build rather than become zero.

## Rebuild

From Website, run `py -3.12 scripts/build-muslim-world.py --refresh`. The script caches public responses in `.local/missions-sources`, checks unique IDs, consistent capture dates, known country mappings and progress categories, then rebuilds the derived JSON. `--cache-dir .local` can reuse the original research snapshot files. Snapshot input hashes are saved in the JSON. The original immutable `sources/` collection is not modified.

Inspect source schema and changed country scope before publishing an update. New countries above the threshold require an explicit code mapping in the builder. Tests: `node --test scripts/tests/muslim-world.test.mjs`; browser coverage: `e2e/muslim-world.spec.ts` with `e2e/muslim-world.config.ts`.

## Rendering

The renderer and assets load when the section approaches the viewport. The globe uses an orthographic WebGL sphere with NASA Blue Marble imagery and aligned Natural Earth country polygons. Without WebGL or an available texture it retains an interactive geographic map; if boundaries fail, all country profiles remain accessible through the selector. Auto rotation starts only when reduced motion is not requested, pauses on interaction and respects viewport/tab visibility. Explicit play remains available. Resize observers, animation frames, events and GPU resources are disposed on navigation.

Native country/region selectors provide keyboard and screen-reader access. The globe also accepts arrow keys, +/− and Home; mobile controls offer zoom and reset. Boundaries and source naming do not resolve disputed status. Mayotte is extracted from France's actual Natural Earth island polygons; a geographic point remains the picking fallback for very small islands.

Sources and asset provenance: [public/assets/muslim-world/README.md](../../public/assets/muslim-world/README.md). No deployment is implied by a successful local build.
