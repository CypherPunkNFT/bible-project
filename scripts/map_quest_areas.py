"""Map quest's rivers, seas, valleys and regions (docs/features/map-quest/design.md §16).

OpenBible places that are a shape rather than a point: a pin is scored by its distance to the shape (0 inside a
region or sea, or on a river's line). The shapes come from OpenBible's own geometry files (CC BY 4.0; river paths
from OpenStreetMap), already in the download. build-map-quest.py calls `area_places` and writes the shapes it
returns to src/data/map-quest/shapes.json.
"""

import json
import math
import re
from collections.abc import Callable
from itertools import pairwise
from pathlib import Path

REGION_TYPES = {"region"}
WATER_TYPES = {"river", "body of water", "wadi", "spring", "pool"}
LANDFORM_TYPES = {"valley", "mountain", "mountain range", "natural area", "hill"}
SHAPE_KINDS = {"path", "rough_path", "polygon", "rough_boundary", "isobands"}
# The confidence band used for a region (§16): the outline at least half the reference atlases agree on.
CORE_CONFIDENCE = 50
DECIMALS = 3  # about 100 m: finer than any pin can be placed at the game's zoom
# A name a town already has gets the kind added, so the game never asks two places by the same name.
CLASH_WORD = {"region": "region", "water": "river", "landform": "valley"}


class ShapeError(ValueError):
    pass


def kind_of(types: set[str]) -> str | None:
    if types & REGION_TYPES:
        return "region"
    if types & WATER_TYPES:
        return "water"
    if types & LANDFORM_TYPES:
        return "landform"
    return None


def _feature_geometry(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    geometry = data.get("geometry") if data.get("type") == "Feature" else None
    if not geometry:
        raise ShapeError(f"{path.name}: expected a GeoJSON Feature with a geometry, got type {data.get('type')!r}")
    return geometry


def _core_band(path: Path) -> list:
    """The 50% outline of an isobands file: polygons run from min_confidence (widest) to max_confidence (core)."""
    data = json.loads(path.read_text(encoding="utf-8"))
    polygons = data["geometry"]["coordinates"]
    low = data["properties"].get("min_confidence", 10)
    high = data["properties"].get("max_confidence", 90)
    steps = max(1, len(polygons) - 1)
    for index, polygon in enumerate(polygons):
        if low + (high - low) * index / steps >= CORE_CONFIDENCE:
            return polygon
    return polygons[-1]


def _round_line(points: list) -> list[list[float]]:
    out: list[list[float]] = []
    for lon, lat, *_ in points:
        point = [round(float(lon), DECIMALS), round(float(lat), DECIMALS)]
        if not out or out[-1] != point:
            out.append(point)
    return out


def _round_ring(ring: list) -> list[list[float]]:
    out = _round_line(ring)
    if out and out[0] != out[-1]:
        out.append(out[0])
    return out


def load_shape(geometry: dict, folder: Path) -> dict:
    """The shape the game scores against: a Polygon (region, sea) or a LineString (river, valley), rounded."""
    kind = geometry["geometry"]
    if kind == "isobands":
        rings = _core_band(folder / geometry["isobands_geojson_file"])
        shape = {"type": "Polygon", "coordinates": rings}
    else:
        name = geometry.get("simplified_geojson_file") or geometry.get("geojson_file")
        if not name:
            raise ShapeError(f"geometry {geometry['id']} ({kind}) has no geojson file")
        shape = _feature_geometry(folder / name)
    if shape["type"] == "Polygon":
        rings = [ring for ring in (_round_ring(ring) for ring in shape["coordinates"]) if len(ring) >= 4]
        if not rings:
            raise ShapeError(f"geometry {geometry['id']}: polygon has no ring of 3+ points after rounding")
        return {"type": "Polygon", "coordinates": rings}
    if shape["type"] == "LineString":
        line = _round_line(shape["coordinates"])
        if len(line) < 2:
            raise ShapeError(f"geometry {geometry['id']}: line has fewer than 2 points after rounding")
        return {"type": "LineString", "coordinates": line}
    raise ShapeError(f"geometry {geometry['id']}: expected Polygon or LineString, got {shape['type']}")


def inside_ring(lon: float, lat: float, ring: list) -> bool:
    """Ray casting: is the point inside this closed ring?"""
    inside = False
    for (x1, y1), (x2, y2) in pairwise(ring):
        if (y1 > lat) != (y2 > lat) and lon < x1 + (lat - y1) * (x2 - x1) / (y2 - y1):
            inside = not inside
    return inside


def inside_polygon(lon: float, lat: float, rings: list) -> bool:
    return inside_ring(lon, lat, rings[0]) and not any(inside_ring(lon, lat, hole) for hole in rings[1:])


def _edge_gap(lon: float, lat: float, ring: list) -> float:
    """Roughly how far (degrees, latitude-corrected) the point is from the ring's nearest vertex or edge."""
    scale = math.cos(math.radians(lat))
    best = math.inf
    for (x1, y1), (x2, y2) in pairwise(ring):
        ax, ay, bx, by = (x1 - lon) * scale, y1 - lat, (x2 - lon) * scale, y2 - lat
        dx, dy = bx - ax, by - ay
        t = max(0.0, min(1.0, -(ax * dx + ay * dy) / (dx * dx + dy * dy))) if dx or dy else 0.0
        best = min(best, math.hypot(ax + t * dx, ay + t * dy))
    return best


def anchor_point(shape: dict, hint: tuple[float, float] | None) -> tuple[float, float]:
    """A point on the shape for hint circles, the daily schedule and the map's opening checks: OpenBible's own point
    when it lies inside the region, else the inside point farthest from the edge on a 24x24 grid; for a line, the
    vertex nearest OpenBible's point (the Nile's middle vertex would be in Sudan), else the middle vertex."""
    if shape["type"] == "LineString":
        line = shape["coordinates"]
        if hint:
            scale = math.cos(math.radians(hint[1]))
            return tuple(min(line, key=lambda p: math.hypot((p[0] - hint[0]) * scale, p[1] - hint[1])))
        return tuple(line[len(line) // 2])
    rings = shape["coordinates"]
    if hint and inside_polygon(hint[0], hint[1], rings):
        return hint
    lons = [p[0] for p in rings[0]]
    lats = [p[1] for p in rings[0]]
    best, best_gap = None, -1.0
    for i in range(1, 24):
        for j in range(1, 24):
            lon = min(lons) + (max(lons) - min(lons)) * i / 24
            lat = min(lats) + (max(lats) - min(lats)) * j / 24
            if inside_polygon(lon, lat, rings):
                gap = _edge_gap(lon, lat, rings[0])
                if gap > best_gap:
                    best, best_gap = (round(lon, DECIMALS), round(lat, DECIMALS)), gap
    if best is None:
        raise ShapeError("no grid point falls inside the polygon; it may be degenerate")
    return best


def area_places(rows: list[dict], geometry_file: Path, folder: Path, *, is_point: Callable[[set[str]], bool],
                located: Callable[[dict], bool], verse_ids: Callable[[dict], list[int]], excluded: set[str]) -> list[dict]:
    """Every shape place that passes the same location and verse bars as the towns, one per name (the most mentioned).
    Records: id, name, kind, verses, shape, hint (OpenBible's point). Names are not yet checked against the towns."""
    geometries = {g["id"]: g for g in (json.loads(line) for line in geometry_file.read_text(encoding="utf-8").splitlines() if line.strip())}
    found = []
    for row in rows:
        types = set(row.get("types") or [])
        kind = kind_of(types)
        if is_point(types) or kind is None or row["id"] in excluded:
            continue
        verses = verse_ids(row)
        if not verses or not located(row):
            continue
        resolution = (((row.get("identifications") or [{}])[0]).get("resolutions") or [{}])[0]
        geometry = geometries.get(resolution.get("precise_geometry_id") or resolution.get("geometry_id") or "")
        if not geometry or geometry["geometry"] not in SHAPE_KINDS:
            continue  # only a point or a rough circle: nothing to score a shape against
        lonlat = resolution.get("lonlat")
        hint = tuple(round(float(v), DECIMALS) for v in lonlat.split(",")) if lonlat else None
        found.append({"id": row["id"], "name": re.sub(r" \d+$", "", row["friendly_id"]), "kind": kind, "verses": verses,
                      "shape": load_shape(geometry, folder), "hint": hint})
    by_name: dict[str, dict] = {}
    for place in sorted(found, key=lambda p: (-len(p["verses"]), p["id"])):
        by_name.setdefault(place["name"], place)
    return sorted(by_name.values(), key=lambda p: p["id"])
