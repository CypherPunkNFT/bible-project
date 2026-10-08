# python build/textures.py — builds the globe textures for apostle-directions-2 from the NASA Blue Marble files already in sources/nasa-bluemarble/.
# The source images are Web Mercator (EPSG:3857) with the bounding boxes recorded in REQUEST.txt; this reprojects them to
# plain longitude/latitude (equirectangular) so the globe shader can sample them directly.
import base64, io, json, math, sys
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
SRC = "D:/FortressOfSolitude/Jarvis/Projects/BibleProject/sources/nasa-bluemarble/"
OUT = "D:/FortressOfSolitude/Jarvis/Projects/BibleProject/Website/design/apostle-directions-2/globe/"
R = 6378137.0
lon_of = lambda x: math.degrees(x / R)
lat_of = lambda y: math.degrees(2 * math.atan(math.exp(y / R)) - math.pi / 2)
merc_y = lambda lat: R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def reproject(img, x0, y0, x1, y1, out_w, name, quality):
    """img covers Mercator box x0..x1, y0 (south)..y1 (north). Writes an equirectangular JPEG; returns its bounds."""
    a = np.asarray(img.convert("RGB"), dtype=np.float32)
    h, w, _ = a.shape
    lon0, lon1, lat0, lat1 = lon_of(x0), lon_of(x1), lat_of(y0), lat_of(y1)
    out_h = round(out_w * (lat1 - lat0) / (lon1 - lon0))
    # columns: linear in longitude in both projections
    xs = (np.arange(out_w) + 0.5) / out_w * (w - 1)
    # rows: latitude -> Mercator y -> source row
    lats = lat1 - (np.arange(out_h) + 0.5) / out_h * (lat1 - lat0)
    ys = np.array([(y1 - merc_y(l)) / (y1 - y0) * (h - 1) for l in lats])
    r0 = np.clip(np.floor(ys).astype(int), 0, h - 2); fr = (ys - r0)[:, None, None]
    c0 = np.clip(np.floor(xs).astype(int), 0, w - 2); fc = (xs - c0)[None, :, None]
    top = a[r0][:, c0] * (1 - fc) + a[r0][:, c0 + 1] * fc
    bot = a[r0 + 1][:, c0] * (1 - fc) + a[r0 + 1][:, c0 + 1] * fc
    out = np.clip(top * (1 - fr) + bot * fr, 0, 255).astype(np.uint8)
    buf = io.BytesIO(); Image.fromarray(out).save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
    # The mock-up server serves no .jpg, so the JPEG bytes travel inside JSON as base64.
    json.dump({"type": "image/jpeg", "note": "NASA Blue Marble, reprojected to longitude/latitude", "data": base64.b64encode(buf.getvalue()).decode()}, open(OUT + name, "w"))
    print(name, out_w, out_h, [round(v, 4) for v in (lon0, lat0, lon1, lat1)])
    return {"file": name, "w": out_w, "h": out_h, "lon0": lon0, "lat0": lat0, "lon1": lon1, "lat1": lat1}


meta = {"credit": "NASA Blue Marble (Next Generation), via NASA GIBS; public domain",
        "source": "sources/nasa-bluemarble/ (request URLs in REQUEST.txt)"}
# 1. The region image: one Web Mercator request, BBOX -3875416.37,1118889.97,10109307.85,8153206.26
region = Image.open(SRC + "bluemarble-region.jpg")
meta["region"] = reproject(region, -3875416.37, 1118889.97, 10109307.85, 8153206.26, 4096, "region.json", 84)

# 2. The close-zoom mosaic: 3 rows x 4 columns of tiles, each with its own BBOX (all at the same metres per pixel).
cols = [890555.93, 2282049.56, 3673543.20, 5065036.83, 6456530.47]
rows = [5780349.22, 4163881.14, 2753408.11, 1459732.27]  # north to south
tiles = [[Image.open(f"{SRC}bluemarble-tile-{r}-{c}.jpg") for c in range(4)] for r in range(3)]
W = sum(t.size[0] for t in tiles[0]); H = sum(row[0].size[1] for row in tiles)
mosaic = Image.new("RGB", (W, H))
y = 0
for row in tiles:
    x = 0
    for t in row:
        mosaic.paste(t, (x, y)); x += t.size[0]
    y += row[0].size[1]
print("mosaic", W, H)
meta["core"] = reproject(mosaic, cols[0], rows[3], cols[4], rows[0], int(sys.argv[1]) if len(sys.argv) > 1 else 6144, "core.json", 82)
json.dump(meta, open(OUT + "textures.json", "w"), indent=1)
