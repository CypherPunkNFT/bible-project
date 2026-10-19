"""The land outline for the 'Where are they now?' map: Natural Earth 1:50m land (public domain, via the world-atlas
package in Website/node_modules), cut to the American east coast, Europe and the Near East; one SVG path per ring, because
rings clamped at the frame would cancel each other's fill if joined into one path."""
import json
import math
from pathlib import Path

# West to Chicago so every holding city sits on the map (owner 2026-10-18: the map opens showing all of them).
# A margin of land past the outermost cities (owner 2026-10-18), so Sinai, Jerusalem or Yerevan can be centred.
LON0, LON1, LAT0, LAT1 = -95.0, 58.0, 21.0, 64.0
WIDTH = 1805.0
COS = math.cos(math.radians((LAT0 + LAT1) / 2))
SCALE = WIDTH / ((LON1 - LON0) * COS)
HEIGHT = (LAT1 - LAT0) * SCALE


def project(lon: float, lat: float) -> tuple[float, float]:
    lon = min(max(lon, LON0 - 1), LON1 + 1)
    lat = min(max(lat, LAT0 - 1), LAT1 + 1)
    return (lon - LON0) * COS * SCALE, (LAT1 - lat) * SCALE


def decode_arcs(topo: dict) -> list[list[tuple[float, float]]]:
    (sx, sy), (tx, ty) = topo["transform"]["scale"], topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        points = []
        for dx, dy in arc:
            x += dx
            y += dy
            points.append((x * sx + tx, y * sy + ty))
        arcs.append(points)
    return arcs


def ring_points(ring: list[int], arcs: list) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for index in ring:
        arc = arcs[index] if index >= 0 else list(reversed(arcs[~index]))
        points.extend(arc if not points else arc[1:])
    return points


def ring_path(points: list[tuple[float, float]]) -> str:
    if not any(LON0 - 1 <= lon <= LON1 + 1 and LAT0 - 1 <= lat <= LAT1 + 1 for lon, lat in points):
        return ""
    kept: list[tuple[float, float]] = []
    for lon, lat in points:
        x, y = project(lon, lat)
        if not kept or abs(x - kept[-1][0]) + abs(y - kept[-1][1]) > 1.6:
            kept.append((x, y))
    if len(kept) < 4:
        return ""
    return "M" + "L".join(f"{x:.0f} {y:.0f}" for x, y in kept) + "Z"


def land_paths(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        topo = json.load(handle)
    arcs = decode_arcs(topo)
    parts = []
    for geometry in topo["objects"]["land"]["geometries"]:
        polygons = geometry["arcs"] if geometry["type"] == "MultiPolygon" else [geometry["arcs"]]
        for polygon in polygons:
            for ring in polygon:
                parts.append(ring_path(ring_points(ring, arcs)))
    return {"w": WIDTH, "h": round(HEIGHT), "lon0": LON0, "lat1": LAT1, "lat0": LAT0, "lon1": LON1, "cos": COS, "k": SCALE,
            "d": [p for p in parts if p]}
