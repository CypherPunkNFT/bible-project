# Globe asset provenance

- `atlas.json`: display derivative of `world-atlas@2.0.2` / Natural Earth, [public domain](https://www.naturalearthdata.com/about/terms-of-use/). Worldwide land is merged from 1:110m geometry. Country polygons are retained only at or above 20% Muslim identification in Pew's 2020 estimates; small places absent from 1:110m use 1:50m. Coordinates are rounded to two decimal degrees; Mayotte is extracted from France's island geometry. Build: `node scripts/build-muslim-world-map.mjs`. This is a geographic illustration, not a declaration about disputed boundaries. Country profile selection covers the 53 Muslim-majority places.
- The globe renderer uses solid blue oceans, green/yellow/brown country fills, projected coastlines and country lines in one Canvas 2D surface. The optional flat renderer generates SVG paths in an Equal Earth projection from the same cached atlas; it downloads no extra geographic dataset. There is no Earth image download, WebGL context or imagery texture. Selected countries have a gold outline and location marker. The fixed circular window supports 1–8× zoom.
- Historical NASA Blue Marble imagery is retired from served assets. The immutable original remains at `sources/missions/muslim-world/2026-10-09/nasa-earth.jpg`; retrieval and SHA-256 remain in `content/missions/source-manifest.json`. The former `earth.webp` derivative and its builder remain in Git history.

No credentials, external API calls or person-level location records are served with these assets.

- `flags/<country-code>.svg`: unmodified 4:3 country flags from [lipis/flag-icons](https://github.com/lipis/flag-icons), MIT, pinned revision `086f7e97d657358203916dbe84f61c2bccaa81eb`. The license is in `flags/LICENSE`; all 53 source URLs, sizes and hashes are in `content/missions/flag-manifest.json`. Only the selected country flag loads. Mayotte uses France's flag; flags do not decide disputed status. Rebuild: `py -3.12 scripts/build-muslim-world-flags.py`.
- `people-groups/<country-code>.json`: complete active IMB group records for each of the 53 profiles, from the same archived dated input as the country aggregates, under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Names, language, religion, population and published engagement category are retained; rows are ordered by population. Only the selected country file loads when People Groups opens. Source and derivative hashes/counts are in `content/missions/people-group-manifest.json`. Build: `py -3.12 scripts/build-muslim-world.py --cache-dir .local`.

## Solid Earth colours — 2026-10-09

Both projections use the same simple Earth palette: blue oceans, tan base land, and green, yellow and brown country fills with pale borders. The fills are illustrative and do not encode climate, religious share or gospel engagement. Qualifying countries receive deterministic colours by country code. Countries below the existing 20% boundary threshold remain merged into the worldwide base land. The selected country keeps its yellow border and marker. Hover lightly brightens the existing fill.

The globe draws solid fills on its existing Canvas 2D surface; the flat map adds two SVG paths for ocean and worldwide base land. No imagery, textures or geographic downloads were added. The same cached atlas, fixed-circle clipping, wheel containment and idle/offscreen rendering rules remain in use.

The map aperture has no perimeter stroke, illuminated rim or glow. Clipping limits the view without drawing an extra geographic-looking boundary.
