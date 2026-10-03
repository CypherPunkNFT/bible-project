"""OpenBible.info data: cross-references (CC-BY) and Bible places (CC-BY 4.0) -> the site's shapes.

Displayed as-is. No analysis is added here (owner's scope rule, 2026-10-03).
"""

import ast
import json
import re
from pathlib import Path

from .books import OSIS_TO_CODE, verse_id

OSIS_REF = re.compile(r"^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$")


def osis_to_id(ref: str) -> int:
    match = OSIS_REF.match(ref)
    if not match or match.group(1) not in OSIS_TO_CODE:
        raise ValueError(f"OpenBible reference {ref!r}: expected Book.Chapter.Verse with a known book")
    return verse_id(OSIS_TO_CODE[match.group(1)], int(match.group(2)), int(match.group(3)))


def osis_range(text: str) -> tuple[int, int]:
    """'Gen.1.1' -> (id, id); 'Prov.8.22-Prov.8.30' -> (start, end)."""
    start, _, end = text.partition("-")
    first = osis_to_id(start)
    return first, (osis_to_id(end) if end else first)


def read_cross_references(path: Path) -> list[tuple[int, int, int, int, int]]:
    """Rows of (from_start, from_end, to_start, to_end, votes); negative votes dropped."""
    edges = []
    with path.open(encoding="utf-8") as handle:
        header = handle.readline()
        if not header.startswith("From Verse"):
            raise ValueError(f"{path}: expected the 'From Verse' header line, got {header[:60]!r}")
        for line_number, line in enumerate(handle, start=2):
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 3:
                raise ValueError(f"{path}:{line_number}: expected 3 tab-separated fields, got {line!r}")
            votes = int(parts[2])
            if votes < 0:
                continue
            from_start, from_end = osis_range(parts[0])
            to_start, to_end = osis_range(parts[1])
            edges.append((from_start, from_end, to_start, to_end, votes))
    return edges


def _literal(value):
    """The places file stores some fields as Python-repr or JSON strings; decode either."""
    if not isinstance(value, str):
        return value
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return ast.literal_eval(value)


def read_places(path: Path) -> list[dict]:
    """Ancient places with a best-guess location: name, type, lon, lat, confidence 0-1, verse ids."""
    places = []
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            row = json.loads(line)
            identifications = row.get("identifications") or []
            if not identifications or not identifications[0].get("resolutions"):
                continue
            best = identifications[0]
            lonlat = best["resolutions"][0].get("lonlat")
            if not lonlat:
                continue
            lon, lat = (float(value) for value in lonlat.split(","))
            extra = _literal(row.get("extra") or "{}")
            verses = []
            for ref in extra.get("osises", []):
                try:
                    verses.append(osis_to_id(ref))
                except ValueError:
                    continue  # a handful of refs use book names outside the 66-book table
            if not verses:
                continue
            types = _literal(row.get("types") or "[]")
            score = (best.get("score") or {}).get("vote_total", 0)
            places.append({
                "id": row["id"],
                "name": re.sub(r" d+$", "", row["friendly_id"]),  # "Syria 1" -> "Syria" (the id keeps them apart)
                "type": types[0] if types else "place",
                "lon": round(lon, 4),
                "lat": round(lat, 4),
                "confidence": round(min(max(score, 0), 1000) / 1000, 2),
                "verses": sorted(set(verses)),
            })
    return places
