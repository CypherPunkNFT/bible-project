# Globe asset provenance

- `atlas.json`: display derivative of `world-atlas@2.0.2` / Natural Earth, [public domain](https://www.naturalearthdata.com/about/terms-of-use/). Worldwide land is merged from 1:110m geometry. Country polygons are retained only at or above 20% Muslim identification in Pew's 2020 estimates; small places absent from 1:110m use 1:50m. Coordinates are rounded to two decimal degrees; Mayotte is extracted from France's island geometry. Build: `node scripts/build-muslim-world-map.mjs`. This is a geographic illustration, not a declaration about disputed boundaries. Country profile selection covers the 53 Muslim-majority places.
- The current renderer uses projected coastlines and country lines in one Canvas 2D surface. There is no Earth image download, WebGL context or imagery texture. Selected countries have a gold outline and location marker. The fixed circular window supports 1–8× zoom.
- Historical NASA Blue Marble imagery is retired from served assets. The immutable original remains at `sources/missions/muslim-world/2026-10-09/nasa-earth.jpg`; retrieval and SHA-256 remain in `content/missions/source-manifest.json`. The former `earth.webp` derivative and its builder remain in Git history.

No credentials, external API calls or person-level location records are served with these assets.
