# Muslim-world country explorer

The Islam collection includes a globe with continuous faded terrain colours whose interactions were adapted from `design/apostle-directions-2/js/globe.js`. Select a highlighted country or use the searchable selector. Selection is shareable as `?country=PAK#muslim-world`; other query parameters, including the comparison question, are preserved. This section is specific to the Islam collection.

`muslim-world.json` is a derived, bundled snapshot, not a runtime call to an external API. It covers all 53 countries and territories above 50% Muslim identification in Pew Research Center's 2020 estimates. Religious identification is not the state religion or an assertion about every resident. The panel shows 2020 population and religious shares separately from IMB's 2026-10-09 snapshot. Do not multiply a 2020 percentage by IMB's current population estimate.

## Data and definitions

- Pew: [Religious Composition by Country, 2010–2020](https://www.pewresearch.org/religion/feature/religious-composition-by-country-2010-2020/), published 2025. Data is extracted from the interactive's public embedded dataset. Display shares to one decimal place and populations as approximate compact estimates. A displayed 0.0% is a rounded value, not necessarily an absence of adherents.
- IMB: [People Group Points](https://www.arcgis.com/home/item.html?id=4480316ef90c467ba30517809180c536), maintained by `imbGIS`, from the public `pgOrgPointsStaging` feature service. The dated `CaptureDate` is saved as `snapshotDate`. Sum active records by `ISOAlpha3` and their **published** `EngagementProgress` category: 0 = unengaged and unreached, 1 = engaged yet unreached, 2 = no longer unreached. Do not substitute a fresh classification based on GSEC or infer engagement solely from recent church-planting activity. The service's actual categories are preserved, even where documentation or cached country profiles differ.
- Counts include **all** people groups recorded in that country, not only Muslim groups. A group reported in multiple countries contributes to each country's own count; do not add country counts and call the sum unique global peoples. The summary retains three largest-group examples for compatibility; the People Groups tab lists every active recorded group in the selected country, ordered by population, with search and engagement filters. Language names describe those groups, not a list of official national languages.
- IMB's [definitions](https://peoplegroups.org/definitions/): unreached is below 2% evangelical Christians; no longer unreached is at least 2%. Engagement describes a sustained effort to establish self-sustaining evangelical churches. These are IMB classifications of groups, not an assessment of the faith of every individual or a country-wide completion score.
- Attribution and transformation are stated on the page. The ArcGIS item's license field links [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/); preserve that link and attribution. No IMB endorsement is implied. Missing or unclassified facts must fail the build rather than become zero.

## Rebuild

From Website, run `py -3.12 scripts/build-muslim-world.py --refresh`. The script caches public responses in `.local/missions-sources`, checks unique IDs, consistent capture dates, known country mappings and progress categories, then rebuilds the derived JSON. `--cache-dir .local` can reuse the original research snapshot files. Snapshot input hashes are saved in the JSON. The original immutable `sources/` collection is not modified.

Inspect source schema and changed country scope before publishing an update. New countries above the threshold require an explicit code mapping in the builder. Tests: `node --test scripts/tests/muslim-world.test.mjs`; browser coverage: `e2e/muslim-world.spec.ts` with `e2e/muslim-world.config.ts`.

## Rendering

The renderer and geometry load when the section approaches the viewport. A direct `#muslim-world` refresh starts loading immediately. The initial selected country is centered without an introductory fly animation, and an initial geographic frame is drawn before reporting the globe ready. One Canvas 2D surface projects worldwide land, continuous terrain washes, coastlines and country lines orthographically. There are no raster images, WebGL contexts, shaders or Earth imagery textures. If boundaries fail, all country profiles remain accessible through the selector.

Phones (viewport at or below 760 px), coarse-pointer devices and reduced-motion preferences start with rotation paused. Other devices start automatic rotation, capped at 30 fps. Interaction pauses rotation and respects viewport/tab visibility. Wheel/drag gestures and country transitions follow display frames. Zoom uses short time-based easing, or changes immediately when reduced motion is requested. Idle, offscreen and hidden-tab globes stop scheduling animation frames. Resize observers, animation frames and events are disposed on navigation.

Native country/region selectors provide keyboard and screen-reader access. Arrow keys turn the globe, +/− zoom, Space pauses/starts rotation and Home resets. Both views occupy a 4:3 rectangle. The globe initially opens at 1.35×; Home or zooming fully out shows the complete round Earth at 1×. Zoom reaches 8×, and enlarged geography fills the rectangle, including its corners. A physical hemispheric horizon and rectangular clipping limit geographic geometry without drawing an artificial perimeter. Wheel gestures never scroll the page while over the globe, including at either zoom limit. Wheel scrolling outside the globe works normally. Touch permits vertical page scrolling and horizontal globe dragging. A vertical globe/map icon pair sits in the upper-right empty corner of the map area. There are no zoom/rotation buttons, drag instructions, map captions or horizontal rules above/below the map. Attribution remains in the methods/source material.

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

## Country panel and complete people-group tables — 2026-10-09

The country summary uses thin grid lines and a local 4:3 flag instead of an ISO-code badge. Gospel Presence is the default tab; engagement titles are 15 px, counts 34–36 px, and population totals 12 px. People Groups is a contained, scrollable table of every active IMB group in the country, including non-Muslim groups. Its exact population, language, religion and published EngagementProgress classification come from the same archived input used for the overview. Search covers names, languages and religions; the status filter keeps the three published categories. Native table headers stay visible while scrolling. Keyboard arrow/Home/End keys move between tabs. `panel=groups` preserves the table tab, together with country, map and comparison query parameters.

`scripts/build-muslim-world.py` writes one compact JSON file per country to `public/assets/muslim-world/people-groups/`; `content/missions/people-group-manifest.json` records each derivative's size/hash/count and original IMB input hash. No full-world input or all-country table is imported into the app. Table data is fetched only when its tab opens, cached after a successful load, and aborted on leaving the selected country or tab. Snapshot, country, source hash, row count and unique IDs are checked before display; a failed request leaves the profile and IMB source link available.

The 53 flag assets are unmodified SVGs from MIT-licensed lipis/flag-icons at revision `086f7e97d657358203916dbe84f61c2bccaa81eb`, with the upstream license alongside them. Only the selected flag is requested. Mayotte uses France's tricolour; source conventions do not determine territorial status. `content/missions/flag-manifest.json` records immutable archive paths, URLs, sizes and SHA-256 values. Rebuild from the archive with `py -3.12 scripts/build-muslim-world-flags.py`; `--refresh` archives a newly pinned revision without modifying existing originals.

## Solid Earth colours — 2026-10-09

Both projections use the same simple Earth palette: blue oceans, tan base land, and green, yellow and brown country fills with pale borders. The fills are illustrative and do not encode climate, religious share or gospel engagement. Qualifying countries receive deterministic colours by country code. Countries below the existing 20% boundary threshold remain merged into the worldwide base land. The selected country keeps its yellow border and marker. Hover lightly brightens the existing fill.

The globe draws solid fills on its existing Canvas 2D surface; the flat map adds two SVG paths for ocean and worldwide base land. No imagery, textures or geographic downloads were added. The same cached atlas, fixed-circle clipping, wheel containment and idle/offscreen rendering rules remain in use.

The map aperture has no perimeter stroke, illuminated rim or glow. Clipping limits the view without drawing an extra geographic-looking boundary.

## Continuous dark terrain and rectangular map viewport — 2026-10-09

The owner replaced the categorical country palette with mature, faded deep-blue oceans, deep-green land and soft brown geographic washes. Colours flow across country boundaries; thin muted teal coastlines/borders restore the earlier outline treatment. Only the selected/hovered country receives a very slight highlight. Ten broad geographic washes are clipped to worldwide land in both renderers. They are illustrative styling, not scientific land-cover data. No raster imagery, texture, country-colour assignment or extra geographic download is used.

Both map views use a 4:3 rectangular viewport. The globe begins at 1.35x, retaining its prior apparent width while filling the rectangular space; Home/fully zooming out restores the complete round Earth at 1x. Zoomed geography reaches all four corners. The physical horizon remains spherical; rectangular clipping draws no illuminated rim or artificial coastline. Real boundary strokes use line geometry. The flat view uses a 960×720 SVG, a projected Earth ocean shape and the same continuous land washes; transform, marker, hit-testing and pan bounds account for both dimensions. Phones still start idle, and wheel zoom remains contained at both limits.

## Original outlines and Earth-only colours - 2026-10-09

The owner clarified that the unwanted edge was a drawn circle line. The globe has no perimeter stroke, circular crop, framing glow or coloured background outside the Earth. The 4:3 rectangular viewport remains; ocean colour is painted only inside the physical sphere, and the surrounding canvas is transparent. The flat SVG likewise paints only its projected Earth shape rather than a rectangular ocean background.

Coastline/country outlines, hover styling and the selected-country marker use the original pre-colour renderer treatment from 29a22a1c. Continuous geographic terrain washes remain, with HSL lightness reduced by 20% and saturation increased by 20% relative to the preceding muted palette. Colours cross borders and do not classify countries or represent scientific land-cover data. Full zoom-out shows the natural Earth silhouette without an added circle line; zoomed geography can fill the rectangular area. This supersedes the earlier colour/framing notes above. No texture, imagery, dataset or country-panel change was added.

## Darker terrain, physical globe outline and threshold audit - 2026-10-09

The owner requested darker ocean and land, and explicitly restored the globe outline. Ocean, base land and all continuous terrain washes have a further 20% reduction in HSL lightness, retaining saturation and the existing thin country outlines. The original one-pixel muted teal perimeter is restored around the physical Earth, scaling with the globe. It is not a fixed circular aperture or crop; no rectangular frame, glow or coloured background outside Earth was added. Zoomed geography still fills the rectangular viewport.

An exact-name comparison against the immutable Pew source and its SHA-256 confirms all 61 countries/territories at or above 20% Muslim identification in 2020 have atlas geometry; none are missing. The 53 majority profiles remain selectable with their existing IMB data. The eight additional outlined places do not yet have profiles: Benin, Cameroon, Cyprus, Ethiopia, Ivory Coast, Montenegro, North Macedonia and Tanzania. Outline coverage and selectable profile coverage are distinct. These are historical 2020 estimates, not a claim about current religious shares. No demographic or IMB data was changed.

## Eight theme-native panel options and corrected faith bars - 2026-10-09

The owner requested a full People Groups redesign, the site's own colours, four additional mock-ups, and a picker outside the mocked region. A-H now use shared theme tokens: history/terracotta, epistles/gold and poetry/teal on page/surface/surface-2 backgrounds with the site's line, ink and muted text. No bright custom orange/blue/green palette remains in the people-group views. The review picker is a separate sibling above #muslim-world, outside the country panel and atlas, with no overlay. All eight options preserve the real globe, selected country, tab, filters, cached geography and lazy country data.

The owner then specified Panel A: enlarged 80x60 flag left of the country name, region underneath, and population centred in the right column. Muslim and Christian identification each have their own labelled percentage and proportional bar; Egypt shows 95.2% and 4.8% respectively. The previous Muslim bar with a Christian-only caption is removed. All panel flags are larger. C's previously preferred Gospel Presence cards remain. Scroll thumbs remain pill-only, external on the right without a track. No demographics, IMB source records or globe styling changed.

## Adopted country panel: B header, C presence, B people groups - 2026-10-09

The owner selected B's top section, with Christian identification to the right of Muslim and the labels shortened to Muslim/Christian; C's Gospel Presence cards; and B's editorial People Groups rows. This combination is now the default on the actual Islam page without atlasDesign or a design picker. The larger flag, country search, theme-native colours, external pill-only scroll thumb, source links and complete lazy country tables remain.

Each Gospel Presence card is a keyboard-accessible button that opens People Groups filtered to its engagement category and focuses the People Groups tab. panel=groups and engagement=unengaged|engagedUnreached|noLongerUnreached preserve this view in shared links and refreshes; All groups removes the filter. Selecting countries retains the current tab/filter. The header shows Population, Muslim and Christian as three adjacent facts; Egypt is 109.3M, 95.2%, 4.8%. No demographic, IMB or globe-rendering change was made. The eight earlier options remain available only through explicit review links; they are not controls on the default page.

## Map search and country identification bars - 2026-10-09

The owner moved country search out of the right panel and into the upper-left of the map. The shared searchable selector works with pointer and keyboard in globe and flat views; the right-hand population statistic now occupies the old finder position beside the larger flag and country name. Muslim and Christian remain side by side, each with its own labelled, proportional identification bar. Egypt is 109.3M, Muslim 95.2%, Christian 4.8%; the Christian bar fills 4.8% of its own track. Pew 2020 estimates appear underneath these top statistics. IMB/Pew links remain at the bottom of the country panel. C engagement cards, B people-group rows, filters and source-validated lazy country records remain. Earlier explicit review options retain their own search placements.

App/node TypeScript, scoped ESLint and all 27 desktop/tablet/phone regressions pass. Visual checks cover Egypt, Pakistan, Iran and Bangladesh in both themes at 1440/768/390/320 px without document or group-region overflow or browser errors. The map search was also checked with mouse and keyboard in both projections at desktop and 320px phone widths. No source data or map renderer changes.
