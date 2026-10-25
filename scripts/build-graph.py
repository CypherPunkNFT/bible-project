"""Join the site's existing links into one connections graph (Plans/KNOWLEDGE-GRAPH.md, stage 1).

Reads only the site's own generated data: people and their family ties, places, topics, and the OpenBible
cross-references. Every one of them names verses by the same number (book * 1,000,000 + chapter * 1,000 + verse),
so people, places and topics are joined through the verses they share; no names are matched, no model is used.

Writes data/graph/:
  index.json      every person, place and topic with its name, for search and for finding its bundle
  n/<0-127>.json  each entity's neighbourhood: family, the people, places and topics sharing its verses (with up to
                  three shared verses as evidence), and the chapters its verses are cross-referenced with
  report.json     how many links of each kind were joined and every endpoint that did not resolve

The output is deterministic: a re-run on the same data writes the same bytes.

Usage:  python scripts/build-graph.py            build
        python scripts/build-graph.py --show p:jesus-isa-7-14   print one entity's neighbourhood from the built files
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = DATA / "graph"
BUNDLES = 128
TOP = 30
EVIDENCE = 3
FAMILY = {"pa": "parent", "ch": "child", "sp": "spouse", "si": "sibling"}


def bundle_of(key: str) -> int:
    """FNV-1a over the key's UTF-8 bytes; the page computes the same (src/pages/mockup/connections/graph-data.ts)."""
    h = 0x811C9DC5
    for byte in key.encode("utf-8"):
        h = ((h ^ byte) * 0x01000193) & 0xFFFFFFFF
    return h % BUNDLES


def read_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    path.write_bytes((text + "\n").encode("utf-8"))


class Verses:
    """Which verse numbers exist, from stats.json (each chapter's verse count)."""

    def __init__(self) -> None:
        stats = read_json(DATA / "stats.json")
        codes = {b["code"]: b["num"] for b in read_json(DATA / "catalog.json")["books"]}
        self.counts: dict[int, list[int]] = {}
        self.code_of: dict[int, str] = {}
        for book in stats["books"]:
            num = codes[book["code"]]
            self.counts[num] = [chapter[0] for chapter in book["chapters"]]
            self.code_of[num] = book["code"]

    def valid(self, verse: int) -> bool:
        chapters = self.counts.get(verse // 1_000_000)
        chapter, number = verse // 1000 % 1000, verse % 1000
        return bool(chapters) and 1 <= chapter <= len(chapters) and 1 <= number <= chapters[chapter - 1]

    def expand(self, start: int, end: int) -> list[int]:
        """Every verse from start to end inclusive, across chapter breaks within one book."""
        if not end or end == start:
            return [start] if self.valid(start) else []
        if start // 1_000_000 != end // 1_000_000 or end < start:
            return [start] if self.valid(start) else []
        chapters = self.counts[start // 1_000_000]
        out, chapter, number = [], start // 1000 % 1000, start % 1000
        while (start // 1_000_000) * 1_000_000 + chapter * 1000 + number <= end and chapter <= len(chapters):
            if number > chapters[chapter - 1]:
                chapter, number = chapter + 1, 1
                continue
            out.append((start // 1_000_000) * 1_000_000 + chapter * 1000 + number)
            number += 1
        return out


class Graph:
    def __init__(self) -> None:
        self.verses = Verses()
        self.names: dict[str, dict] = {}            # key -> index entry
        self.sets: dict[str, list[int]] = {}        # key -> sorted verse list
        self.family: dict[str, list[list[str]]] = {}
        self.see: dict[str, list[str]] = {}
        self.report: dict = {"edges": {}, "unresolved": {}}

    def drop(self, kind: str, item) -> None:
        self.report["unresolved"].setdefault(kind, []).append(item)

    def keep_verses(self, key: str, verses, kind: str) -> list[int]:
        good = sorted({v for v in verses if self.verses.valid(v)})
        for bad in sorted({v for v in verses if not self.verses.valid(v)}):
            self.drop(f"{kind} verse", [key, bad])
        return good


def load_people(g: Graph) -> None:
    people = read_json(DATA / "study" / "people.json")
    ids = {p["id"] for p in people}
    mentions = 0
    for p in people:
        key = f"p:{p['id']}"
        person = read_json(DATA / "study" / "people" / f"{p['id']}.json")
        g.names[key] = {"n": p["n"], "d": p.get("b", ""), "e": person.get("e", "")}
        g.sets[key] = g.keep_verses(key, person.get("refs", []), "person")
        mentions += len(g.sets[key])
        family = []
        for field, relation in FAMILY.items():
            for other in person.get(field, []):
                if other in ids:
                    family.append([relation, f"p:{other}"])
                else:
                    g.drop("family", [p["id"], relation, other])
        g.family[key] = family
    g.report["edges"]["person-verse"] = mentions
    g.report["edges"]["family endpoints"] = sum(len(f) for f in g.family.values())


def load_places(g: Graph) -> None:
    mentions = 0
    for place in read_json(DATA / "places.json"):
        key = f"l:{place['id']}"
        g.names[key] = {"n": place["name"], "d": place.get("type", "")}
        g.sets[key] = g.keep_verses(key, place.get("verses", []), "place")
        mentions += len(g.sets[key])
    g.report["edges"]["place-verse"] = mentions


def topic_refs(node, out: list, see: set) -> None:
    """Every [start, end] pair and "see also" topic anywhere in a topic's Torrey points, Nave entries and nested items."""
    if isinstance(node, dict):
        for ref in node.get("refs", []):
            if isinstance(ref, list) and len(ref) == 2:
                out.append(ref)
        see.update(s for s in node.get("see", []) if isinstance(s, str))
        for child in node.get("points", []) + node.get("nave", []) + node.get("items", []):
            topic_refs(child, out, see)


def load_topics(g: Graph) -> None:
    index = read_json(DATA / "topics" / "index.json")
    bundles: dict[int, dict] = {}
    parts: dict[str, list[str]] = {}
    links = 0
    for topic_id, meta in sorted(index["topics"].items()):
        key = f"t:{topic_id}"
        bundle = bundles.setdefault(meta["f"], read_json(DATA / "topics" / "t" / f"{meta['f']}.json"))
        topic = bundle.get(topic_id)
        if topic is None:
            g.drop("topic body", topic_id)
            continue
        g.names[key] = {"n": meta["title"]}
        refs: list = []
        see: set = set()
        topic_refs(topic, refs, see)
        links += len(refs)
        verses = [v for start, end in refs for v in g.verses.expand(start, end)]
        g.sets[key] = g.keep_verses(key, verses, "topic")
        g.see[key] = sorted(see)
        parts[key] = [f"t:{p}" for p in topic.get("parts", []) if isinstance(p, str)]
    for key, targets in g.see.items():
        resolved = [f"t:{index['aliases'].get(s, s)}" for s in targets]
        g.see[key] = sorted({t for t in resolved if t in g.names and t != key})
    # A topic made of parts ("Love": love of God, love of money…) stands for the verses of all its parts.
    for key, members in parts.items():
        known = [m for m in members if m in g.sets]
        for missing in sorted(set(members) - set(known)):
            g.drop("topic part", [key[2:], missing[2:]])
        if known:
            g.sets[key] = sorted(set(g.sets[key]).union(*(g.sets[m] for m in known)))
    g.report["edges"]["topic-reference"] = links
    g.report["edges"]["topic-verse (after expanding ranges and parts)"] = sum(len(g.sets[k]) for k in g.names if k[0] == "t")
    g.report["edges"]["topic-see-also"] = sum(len(v) for v in g.see.values())


def load_cross_references(g: Graph) -> dict[int, list[tuple[int, int]]]:
    """verse -> [(other verse, votes)], both directions, only verses that exist and votes above zero."""
    links: dict[int, list[tuple[int, int]]] = defaultdict(list)
    rows = 0
    with (DATA / "connections" / "edges.tsv").open(encoding="utf-8") as handle:
        next(handle)
        for line in handle:
            start, _, to_start, _, _, weight = line.rstrip("\n").split("\t")
            a, b, votes = int(start), int(to_start), int(weight)
            if not (g.verses.valid(a) and g.verses.valid(b)):
                g.drop("cross-reference", [a, b])
                continue
            if votes <= 0:
                continue
            links[a].append((b, votes))
            links[b].append((a, votes))
            rows += 1
    g.report["edges"]["cross-reference"] = rows
    return links


def shared(g: Graph, key: str, by_verse: dict[int, list[str]]) -> dict[str, list]:
    """Every entity sharing a verse with `key`: [overlap, evidence verses]."""
    found: dict[str, list] = {}
    for verse in g.sets[key]:
        for other in by_verse[verse]:
            if other == key:
                continue
            row = found.setdefault(other, [0, []])
            row[0] += 1
            if len(row[1]) < EVIDENCE:
                row[1].append(verse)
    return found


def ranked(g: Graph, key: str, found: dict[str, list], kind: str) -> tuple[list, int]:
    """The strongest TOP of one kind: shared verses, discounted by the other's own size, so a place named twice does
    not outrank Jerusalem (people and places: the fourth root) and a topic covering whole chapters does not win by size
    alone (topics, whose verse lists run to thousands: the square root)."""
    rows = [(other, n, ev) for other, (n, ev) in found.items() if other[0] == kind]
    power = 0.5 if kind == "t" else 0.25
    score = lambda r: r[1] / math.pow(max(1, len(g.sets[r[0]])), power)
    rows.sort(key=lambda r: (-score(r), -r[1], g.names[r[0]]["n"], r[0]))
    return [[other[2:], g.names[other]["n"], n, ev] for other, n, ev in rows[:TOP]], len(rows)


def cross_chapters(g: Graph, key: str, xref: dict[int, list[tuple[int, int]]], other_testament: bool = False) -> tuple[list, int]:
    """Chapters outside the entity's own verses that its verses are cross-referenced with, strongest first. With
    `other_testament`, only chapters in the Testament where the entity is named less (the Old Testament for Jesus)."""
    own = set(g.sets[key])
    new_testament = sum(1 for v in own if 40 <= v // 1_000_000 <= 66) * 2 > len(own)
    chapters: dict[int, list] = {}
    for verse in g.sets[key]:
        for other, votes in xref.get(verse, []):
            if other in own:
                continue
            if other_testament and (40 <= other // 1_000_000 <= 66) == new_testament:
                continue
            row = chapters.setdefault(other // 1000, [0, 0, []])
            row[0] += votes
            row[1] += 1
            row[2].append([verse, other, votes])
    rows = sorted(chapters.items(), key=lambda kv: (-kv[1][0], kv[0]))
    out = []
    for chapter, (votes, count, pairs) in rows[:TOP]:
        pairs.sort(key=lambda p: (-p[2], p[0], p[1]))
        out.append([chapter, votes, count, pairs[:EVIDENCE]])
    return out, len(rows)


def books_of(g: Graph, key: str) -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    for verse in g.sets[key]:
        counts[g.verses.code_of[verse // 1_000_000]] += 1
    return dict(counts)


def neighbourhood(g: Graph, key: str, by_verse, xref) -> dict:
    found = shared(g, key, by_verse)
    family = [[rel, other[2:], g.names[other]["n"]] for rel, other in g.family.get(key, [])]
    kin = {other for _, other in g.family.get(key, [])}
    people, people_total = ranked(g, key, {k: v for k, v in found.items() if k not in kin}, "p")
    places, places_total = ranked(g, key, found, "l")
    topics, topics_total = ranked(g, key, found, "t")
    chapters, chapters_total = cross_chapters(g, key, xref)
    across, across_total = cross_chapters(g, key, xref, other_testament=True)
    entry = {"k": key[0], "id": key[2:], **g.names[key], "v": len(g.sets[key]), "b": books_of(g, key),
             "fam": family, "p": people, "pN": people_total, "l": places, "lN": places_total,
             "t": topics, "tN": topics_total, "x": chapters, "xN": chapters_total, "xo": across, "xoN": across_total}
    if key in g.see:
        entry["see"] = [[t[2:], g.names[t]["n"]] for t in g.see[key]]
    return entry


def build() -> None:
    g = Graph()
    load_people(g)
    load_places(g)
    load_topics(g)
    xref = load_cross_references(g)
    by_verse: dict[int, list[str]] = defaultdict(list)
    for key in sorted(g.sets):
        for verse in g.sets[key]:
            by_verse[verse].append(key)
    bundles: dict[int, dict] = defaultdict(dict)
    derived = 0
    for key in sorted(g.names):
        entry = neighbourhood(g, key, by_verse, xref)
        derived += entry["pN"] + entry["lN"] + entry["tN"]
        bundles[bundle_of(key)][key] = entry
    for number in range(BUNDLES):
        write_json(OUT / "n" / f"{number}.json", bundles.get(number, {}))
    index = {key: [entry["n"], len(g.sets[key]), entry.get("d", "")] for key, entry in sorted(g.names.items())}
    write_json(OUT / "index.json", {"bundles": BUNDLES, "entities": index})
    g.report["edges"]["shared-verse pairs (each counted from both ends)"] = derived
    g.report["entities"] = {kind: sum(1 for k in g.names if k[0] == kind) for kind in "plt"}
    g.report["unresolved"] = {kind: {"count": len(items), "items": items[:200]} for kind, items in sorted(g.report["unresolved"].items())}
    write_json(OUT / "report.json", g.report)
    print(json.dumps({"entities": g.report["entities"], "edges": g.report["edges"],
                      "unresolved": {k: v["count"] for k, v in g.report["unresolved"].items()}}, indent=2))


def show(key: str) -> None:
    entry = read_json(OUT / "n" / f"{bundle_of(key)}.json").get(key)
    if entry is None:
        sys.exit(f"show: no entity {key!r} in {OUT}; expected a key like p:jesus-isa-7-14, l:a2ba4ca or t:grace")
    print(f"{entry['n']} ({key}): {entry['v']} verses")
    for rel, _, name in entry["fam"]:
        print(f"  family  {rel:8} {name}")
    for label, field in (("people", "p"), ("places", "l"), ("topics", "t")):
        print(f"  {label}: {entry[field + 'N']} in all; strongest: " + ", ".join(f"{r[1]} ({r[2]})" for r in entry[field][:10]))
    print(f"  cross-referenced chapters: {entry['xN']} in all; strongest: " + ", ".join(f"{c[0]} ({c[1]} votes)" for c in entry["x"][:8]))
    print(f"  in the other Testament: {entry['xoN']} in all; strongest: " + ", ".join(f"{c[0]} ({c[1]} votes)" for c in entry["xo"][:8]))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--show", metavar="KEY", help="print one entity's neighbourhood, e.g. p:jesus-isa-7-14")
    args = parser.parse_args()
    show(args.show) if args.show else build()
