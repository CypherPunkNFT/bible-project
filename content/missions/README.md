# Muslim-world country explorer

The Islam collection includes an outline globe whose interactions were adapted from `design/apostle-directions-2/js/globe.js`. Select a highlighted country or use the searchable selector. Selection is shareable as `?country=PAK#muslim-world`; other query parameters, including the comparison question, are preserved. This section is specific to the Islam collection.

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

The renderer and geometry load when the section approaches the viewport. A direct `#muslim-world` refresh starts loading immediately. The initial selected country is centered without an introductory fly animation, and an initial geographic frame is drawn before reporting the globe ready. One Canvas 2D surface projects worldwide coastlines and country lines orthographically. There are no raster images, WebGL contexts, shaders or Earth imagery textures. If boundaries fail, all country profiles remain accessible through the selector.

Phones (viewport at or below 760 px), coarse-pointer devices and reduced-motion preferences start with rotation paused. Other devices start automatic rotation, capped at 30 fps. Interaction pauses rotation and respects viewport/tab visibility. Wheel/drag gestures and country transitions follow display frames. Zoom uses short time-based easing, or changes immediately when reduced motion is requested. Idle, offscreen and hidden-tab globes stop scheduling animation frames. Resize observers, animation frames and events are disposed on navigation.

Native country/region selectors provide keyboard and screen-reader access. Arrow keys turn the globe, +/− zoom, Space pauses/starts rotation and Home resets. Wheel gestures zoom from full-globe fit to 8× within a fixed circular window. The circle nearly touches the top and bottom of the square stage; its edge remains fixed as geography enlarges within it. Geographic lines are clipped to the visible spherical cap as well as that circle. Wheel gestures never scroll the page while over the globe, including at either zoom limit. Wheel scrolling outside the globe works normally. Touch permits vertical page scrolling and horizontal globe dragging. A vertical globe/map icon pair sits in the upper-right empty corner of the map area. There are no zoom/rotation buttons, drag instructions, map captions or horizontal rules above/below the map. Attribution remains in the methods/source material.

The optional flat view is a true SVG map with an Equal Earth projection. Its paths are generated once when the view opens; zoom and panning update a single SVG group transform, without a continuous animation loop. It shows the same worldwide coastlines, qualifying country borders and gold selected-country marker as the globe. The country selection and comparison query remain intact when switching. map=flat preserves the flat view in shared links and on refresh. Globe and flat renderers load separately on demand, share an in-memory atlas cache, and dispose their events/geometry on switching. The first successful geometry load is reused on subsequent switches. Country selection on a zoomed flat map recenters the chosen place. Wheel zoom stays contained at both 1–8× limits, Home restores the whole map, and vertical touch scrolling remains native.

`atlas.json` merges Natural Earth 1:110m land into worldwide coastlines and includes country outlines only for the 61 countries/territories with at least 20% Muslim identification in the same Pew 2020 snapshot. Eight minority-Muslim places have outlines but no majority-country profile. The 53 majority profiles remain the selection scope. Small places absent from 1:110m use 1:50m geometry; Mayotte is extracted from France's actual island polygons. Coordinates are rounded to two decimal degrees and centroids are cached. This is a regional overview rather than street-level mapping. Boundaries and source naming do not resolve disputed status.

Rebuild display geometry with `node scripts/build-muslim-world-map.mjs`. The builder reads the archived Pew dataset, validates every code/geometry, and does not publish the full country table. Preserve attribution and record new checksums after regeneration. NASA imagery remains archived as a historical source but its display derivative and builder are retired from the current site.

## Local performance measurement — 2026-10-09

Edge, 1440×900, no motion reduction, local compressed Vite preview; equal four-second samples after assets settle. These are local resource/main-thread measurements, not field Core Web Vitals or physical-phone measurements. The shared D3 dependency (~31 KB compressed) and page shell are outside the resource subtotal. The outline globe eliminates Earth imagery transfer and its calculated ~10.7 MiB RGBA texture/mipmap allocation. Canvas backing storage and browser compositing memory still exist; no claim of zero graphics memory is made.

| Measurement | Previous textured globe | Outline globe |
|---|---:|---:|
| Renderer + geometry + imagery, transferred | 199,679 bytes | 44,139 bytes |
| Geometry, uncompressed | 123,178 bytes | 123,178 bytes |
| Imagery transfer | 153,856 bytes | 0 bytes |
| Main-thread tasks during ~4 seconds of rotation | 474.9 ms | 520.9 ms |
| Globe draws during rotation sample | 118 | 121 |
| Globe draws / animation callbacks while paused | 0 / 0 | 0 / 0 |

Map-specific transfer falls about 78%. Automatic rotation is not cheaper on the CPU in this sample: projecting the added global coastlines takes work. Phones start idle to avoid that continuous cost; country selection, zoom and dragging still redraw. The 53 demographic/IMB profiles occupy 79,408 bytes in readable source JSON and remain bundled facts; the original 5.7 MB IMB input is not shipped. Reproduce desktop measurements with `node scripts/tests/muslim-world-performance.mjs` (`BASE` selects the local preview; `LABEL` names the output in `.local/`). Five country-data checks and eighteen responsive browser checks cover profile coverage, threshold/coastline geometry, picking, deep zoom and fixed-circle clipping, wheel containment at both limits, keyboard gestures, absence of WebGL/imagery and selector fallback.

Phone emulation on desktop Edge (390×844, DPR 3, touch, no motion reduction): the default still globe produced zero draws during each three-second idle sample. Main-thread tasks were 2.3 ms at normal CPU speed and 6.9 ms at 4× CPU slowdown. Zoom frame intervals had medians of 16.7 ms and 18.7 ms respectively. CPU throttling retains the desktop GPU and does not establish performance on a physical phone.

Sources and asset provenance: [public/assets/muslim-world/README.md](../../public/assets/muslim-world/README.md). No deployment is implied by a successful local build.
