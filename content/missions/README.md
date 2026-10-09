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

The renderer and assets load when the section approaches the viewport. The globe uses an orthographic WebGL sphere with NASA Blue Marble imagery and aligned Natural Earth country polygons. Without WebGL or an available texture it retains an interactive geographic map; if boundaries fail, all country profiles remain accessible through the selector. Auto rotation starts only when reduced motion is not requested, pauses on interaction and respects viewport/tab visibility. The animation loop stops completely while paused, offscreen or in a hidden tab. Resize observers, animation frames, events and GPU resources are disposed on navigation.

Native country/region selectors provide keyboard and screen-reader access. The globe accepts arrow keys, +/−, Space (pause/start) and Home. Wheel gestures zoom between 60% and full fit, then scroll the page at either limit; the sphere cannot be enlarged past the canvas edges. Touch allows vertical page scrolling and horizontal globe dragging. There are no visible control buttons or drag instructions. The square stage fills the map column and separates the sphere from the introduction.

`atlas.json` merges Natural Earth 1:110m land into worldwide coastlines and includes country outlines only for the 61 countries/territories with at least 20% Muslim identification in the same Pew 2020 snapshot. Eight minority-Muslim places have outlines but no majority-country profile or coloured fill. The 53 majority profiles remain the selection scope. Small places absent from 1:110m use 1:50m geometry; Mayotte is extracted from France's actual island polygons. Coordinates are rounded to two decimal degrees, centroids are cached, and the texture is a 2048×1024 WebP. Boundaries and source naming do not resolve disputed status.

Rebuild display assets with `node scripts/build-muslim-world-map.mjs` and `node scripts/build-muslim-world-texture.mjs`. The map builder reads the archived Pew dataset, validates every code/geometry, and does not publish the full country table. The texture builder uses installed Edge via Playwright; its bytes may vary by encoder version. Preserve attribution and record new checksums after regeneration.

## Local performance measurement — 2026-10-09

Edge, 1440×900, no motion reduction, local compressed Vite preview; equal four-second samples after assets settle. These are local resource/main-thread measurements, not field Core Web Vitals or measurements on a low-end phone. The renderer's shared D3 dependency and page shell are outside the resource subtotal below.

| Measurement | Before | After |
|---|---:|---:|
| Renderer + geometry + texture, transferred | 934,153 bytes | 199,536 bytes |
| Geometry, uncompressed | 756,420 bytes | 123,178 bytes |
| Texture | 696,838 bytes | 153,856 bytes |
| Main-thread tasks during ~4 seconds of rotation | 1,604.7 ms | 310.8 ms |
| Globe draws during rotation sample | 80 | 80 |
| Animation callbacks during ~4 seconds paused | 241 | 0 |

The 53 demographic/IMB profiles occupy 79,408 bytes in the readable source JSON and remain bundled facts; the original 5.7 MB IMB input is not shipped. Estimated RGBA texture storage including mipmaps falls from 42.7 MiB to 10.7 MiB; this excludes canvas framebuffers and is a calculation, not a GPU-memory measurement. Reproduce browser measurements with `node scripts/tests/muslim-world-performance.mjs` (`BASE` selects the local preview; `LABEL` names the output in `.local/`). Five country-data checks and twelve responsive browser checks cover profile coverage, threshold/coastline geometry, picking, wheel/keyboard gestures, full-fit layout and fallbacks.

Sources and asset provenance: [public/assets/muslim-world/README.md](../../public/assets/muslim-world/README.md). No deployment is implied by a successful local build.
