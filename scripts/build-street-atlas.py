#!/usr/bin/env python3
"""Build the street-level atlas map file (AtlasTiles/site/bible-atlas.pmtiles) for /study/places/mockup2.

The map is OpenStreetMap data from the Protomaps world build, cut down to:
  * the biblical world only (BIBLICAL_BOUNDS), zoomed out (zoom 0-8: countries, coastlines, rivers, cities), and
  * street level (zoom 9-15) only within 50 km of a Bible place (data/places.json),
merged into one PMTiles file, then stripped to the ancient look the page draws (no roads, buildings or icons).
Steps, in order (each is safe to re-run):

  py -3.12 scripts/build-street-atlas.py regions          # data/places.json -> build/region_50km.geojson
  pmtiles extract <build-url> build/world-biblical-z0-8.pmtiles --bbox=-12,8,73,49 --maxzoom=8
  pmtiles extract <build-url> build/places-50km-z9-15.pmtiles --region=build/region_50km.geojson --minzoom=9 --maxzoom=15
  py -3.12 scripts/build-street-atlas.py merge            # both -> build/bible-atlas-full.pmtiles
  py -3.12 scripts/build-street-atlas.py strip            # full -> site/bible-atlas.pmtiles (what the site reads)

Needs: pip install shapely pmtiles. The pmtiles CLI is github.com/protomaps/go-pmtiles; build URLs are
listed at https://build-metadata.protomaps.dev/builds.json. Full instructions: AtlasTiles/README.md.
"""
import argparse
import json
import math
import sys
from pathlib import Path

ATLAS_DIR = Path(__file__).resolve().parents[2] / "AtlasTiles"  # junction to F: (bulk data)
PLACES = Path(__file__).resolve().parents[1] / "data" / "places.json"
RADIUS_KM = 50
# West, south, east, north in degrees: Spain to beyond the Indus, Sudan/Yemen to the Black Sea. The page stops
# panning and zooming out at the same box (BOUNDS in src/components/atlas/street-style.ts; keep them equal).
BIBLICAL_BOUNDS = (-12, 8, 73, 49)
WORLD = ATLAS_DIR / "build" / "world-biblical-z0-8.pmtiles"
DETAIL = ATLAS_DIR / "build" / f"places-{RADIUS_KM}km-z9-15.pmtiles"
REGION = ATLAS_DIR / "build" / f"region_{RADIUS_KM}km.geojson"
MERGED = ATLAS_DIR / "build" / "bible-atlas-full.pmtiles"  # every layer, kept so the look can change without downloading
OUTPUT = ATLAS_DIR / "site" / "bible-atlas.pmtiles"
# Vector layers the ancient look draws (ANCIENT_LAYERS in src/components/atlas/street-style.ts uses only these).
# Dropped: roads, buildings, pois (34%, 20% and 5% of street-level data, measured 2026-10-06).
KEPT_LAYERS = {"earth", "landcover", "landuse", "water", "boundaries", "places"}


def build_regions() -> None:
    """One square of RADIUS_KM around every place, merged into patches."""
    from shapely.geometry import box, mapping
    from shapely.ops import unary_union

    places = json.loads(PLACES.read_text(encoding="utf-8"))
    if not places:
        raise SystemExit(f"regions: {PLACES} is empty; run scripts/build-data.py first")
    squares = []
    for place in places:
        dlat = RADIUS_KM / 111.0
        dlon = RADIUS_KM / (111.0 * math.cos(math.radians(place["lat"])))
        squares.append(box(place["lon"] - dlon, place["lat"] - dlat, place["lon"] + dlon, place["lat"] + dlat))
    area = unary_union(squares)
    REGION.parent.mkdir(parents=True, exist_ok=True)
    REGION.write_text(json.dumps({"type": "Feature", "properties": {}, "geometry": mapping(area)}), encoding="utf-8")
    patches = len(area.geoms) if hasattr(area, "geoms") else 1
    print(f"regions: {len(places)} places -> {patches} patches -> {REGION}")


def copy_tiles(source_path: Path, writer, zooms: range, transform=None) -> int:
    """Copy every tile in the given zoom range, in tile-id order (the writer needs ascending ids), optionally changed."""
    from pmtiles.reader import MmapSource, all_tiles
    from pmtiles.tile import zxy_to_tileid

    count, last = 0, -1
    with source_path.open("rb") as handle:
        for (z, x, y), data in all_tiles(MmapSource(handle)):
            if z not in zooms:
                raise SystemExit(f"merge: {source_path.name} has a zoom-{z} tile; expected zooms {zooms.start}-{zooms.stop - 1}")
            tile_id = zxy_to_tileid(z, x, y)
            if tile_id <= last:
                raise SystemExit(f"merge: {source_path.name} tiles out of order at {z}/{x}/{y}")
            writer.write_tile(tile_id, transform(data) if transform else data)
            last, count = tile_id, count + 1
    return count


def merge() -> None:
    """Biblical-world zoom 0-8 then place detail zoom 9-15 into one file (every zoom-9 id is above every zoom-8 id)."""
    from pmtiles.reader import MmapSource, Reader
    from pmtiles.writer import Writer

    for path in (WORLD, DETAIL):
        if not path.exists():
            raise SystemExit(f"merge: missing {path}; run the pmtiles extract steps first (see the docstring)")
    with WORLD.open("rb") as handle:
        reader = Reader(MmapSource(handle))
        header, metadata = reader.header(), reader.metadata()
    partial = MERGED.with_suffix(".pmtiles.partial")
    partial.parent.mkdir(parents=True, exist_ok=True)
    with partial.open("wb") as out:
        writer = Writer(out)
        world = copy_tiles(WORLD, writer, range(0, 9))
        detail = copy_tiles(DETAIL, writer, range(9, 16))
        west, south, east, north = BIBLICAL_BOUNDS
        header.update(max_zoom=15, center_zoom=5, center_lon_e7=int(35.2e7), center_lat_e7=int(31.7e7),
                      min_lon_e7=int(west * 1e7), min_lat_e7=int(south * 1e7), max_lon_e7=int(east * 1e7), max_lat_e7=int(north * 1e7))
        metadata["description"] = f"Protomaps basemap: biblical world z0-8 + z9-15 within {RADIUS_KM} km of Bible places"
        writer.finalize(header, metadata)
    partial.replace(MERGED)  # never leave a half-written file in place
    print(f"merge: {world} world + {detail} detail tiles -> {MERGED} ({MERGED.stat().st_size / 1e9:.2f} GB)")


def read_varint(buffer: bytes, index: int) -> tuple[int, int]:
    """Protobuf varint at index -> (value, index after it)."""
    value, shift = 0, 0
    while True:
        byte = buffer[index]
        index += 1
        value |= (byte & 0x7F) << shift
        if not byte & 0x80:
            return value, index
        shift += 7


def keep_layers(tile_gz: bytes) -> bytes:
    """Drop whole vector layers from a gzipped Mapbox Vector Tile, byte for byte otherwise.

    A tile is a list of layers (protobuf field 3), each starting with its name (field 1); anything else is kept."""
    import gzip

    tile, index, kept = gzip.decompress(tile_gz), 0, bytearray()
    while index < len(tile):
        start = index
        key, index = read_varint(tile, index)
        if key & 7 != 2:
            raise SystemExit(f"strip: unexpected protobuf wire type {key & 7} at byte {start}; expected length-delimited layers")
        length, index = read_varint(tile, index)
        body, index = tile[index:index + length], index + length
        name_key, at = read_varint(body, 0)
        name_length, at = read_varint(body, at)
        if key >> 3 != 3 or name_key != (1 << 3 | 2) or body[at:at + name_length].decode() in KEPT_LAYERS:
            kept += tile[start:index]
    return gzip.compress(bytes(kept), compresslevel=9, mtime=0)


def strip() -> None:
    """Full merged file -> the site's file with only KEPT_LAYERS, same tiles and zooms."""
    from pmtiles.reader import MmapSource, Reader
    from pmtiles.writer import Writer

    if not MERGED.exists():
        raise SystemExit(f"strip: missing {MERGED}; run the merge step first")
    with MERGED.open("rb") as handle:
        reader = Reader(MmapSource(handle))
        header, metadata = reader.header(), reader.metadata()
    metadata["vector_layers"] = [layer for layer in metadata.get("vector_layers", []) if layer.get("id") in KEPT_LAYERS]
    metadata["description"] += f"; layers kept: {', '.join(sorted(KEPT_LAYERS))}"
    partial = OUTPUT.with_suffix(".pmtiles.partial")
    partial.parent.mkdir(parents=True, exist_ok=True)
    with partial.open("wb") as out:
        writer = Writer(out)
        count = copy_tiles(MERGED, writer, range(0, 16), keep_layers)
        writer.finalize(header, metadata)
    partial.replace(OUTPUT)  # never leave a half-written map where the site reads it
    print(f"strip: {count} tiles -> {OUTPUT} ({OUTPUT.stat().st_size / 1e9:.2f} GB)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("step", choices=["regions", "merge", "strip"])
    step = parser.parse_args().step
    {"regions": build_regions, "merge": merge, "strip": strip}[step]()


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
