# Globe asset provenance

- `countries-50m.json`: `world-atlas@2.0.2`, copied unchanged from `node_modules/world-atlas/countries-50m.json`. Country boundaries from Natural Earth, public domain: https://www.naturalearthdata.com/about/terms-of-use/ . This is a geographic illustration, not a declaration about disputed boundaries.
- `earth.jpg`: NASA Blue Marble Next Generation, public-domain Earth imagery via NASA GIBS. Retrieved 2026-10-09 as an equirectangular 4096×2048 image. Source request: https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=BlueMarble_NextGeneration&STYLES=&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=4096&HEIGHT=2048&FORMAT=image/jpeg . The renderer applies a theme tint and orthographic projection; the image bytes are unchanged.
- The sphere shader and interaction approach adapt the owner's `design/apostle-directions-2/js/globe.js` mock. A global texture provides geographic detail for Africa, South Asia and Southeast Asia as well as the Middle East.

No credentials, external API calls or person-level location records are served with these assets.
