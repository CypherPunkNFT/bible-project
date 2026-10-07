#!/usr/bin/env python3
"""Build the Bible topics (data/topics/): R. A. Torrey's New Topical Textbook (1897) and Orville J. Nave's Topical Bible
(1896/1903), with M. G. Easton's Bible Dictionary (1897) articles, all public domain, in a two-level taxonomy
(content/topics/taxonomy.json: family -> group -> Torrey topics; content/topics/naves-placement.json: Nave entry -> group),
with key verses and related studies worked out on this PC.

  D:/Python/python.exe scripts/build-topics.py      # needs sentence-transformers (related studies); run after build-data.py

Output: data/topics/index.json (taxonomy, each topic's title, counts and bundle number, Nave's "See ..." aliases) and
data/topics/t/<bundle>.json (topics by id: Torrey's points "points", Nave's "nave", Easton's "dictionary", key verses,
related studies). Only the books' facts and wording are used; CCEL's markup is not republished (Website/SOURCES.md).
"""
import html
import json
import re
import sys
import zlib
from pathlib import Path

import numpy as np

WEBSITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WEBSITE / "scripts"))
from bible.books import BOOK_NUMBER, OSIS_TO_CODE, verse_id  # noqa: E402
import easton  # noqa: E402
import naves  # noqa: E402
import topic_extras  # noqa: E402
from bible.books import BOOKS  # noqa: E402

TORREY = WEBSITE.parent / "sources" / "ccel" / "ttt.xml"
TAXONOMY = WEBSITE / "content" / "topics" / "taxonomy.json"
NAVE_PLACEMENT = WEBSITE / "content" / "topics" / "naves-placement.json"  # Nave entry id -> group id, reviewed by hand
STUDIES = WEBSITE / "content" / "apologetics" / "studies"
OUT = WEBSITE / "data" / "topics"
MODEL = "ibm-granite/granite-embedding-small-english-r2"  # the meaning-search model (MEANING_SEARCH.md)
# Headings garbled in CCEL's edition, checked against the entries' own points (2026-10-06): "B" opens with "Created by God"
# (Gen 1:24, the beasts); a second "Early Rising" covers "The world in general", "The dry land" (the earth).
TITLE_FIXES = {"b": ("beasts", "Beasts"), "early-rising-2": ("earth", "The Earth")}
# Topic-to-study scores cluster between 0.75 and 0.89 (median 0.81). At 0.845 the clear pairs stay (Afflictions -> suffering 0.845,
# Resurrection of Christ -> resurrection 0.887, Faith -> grace 0.864) and the noise goes (Iron 0.78, Asp 0.75). Checked 2026-10-06.
RELATED_MIN = 0.845


def clean(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


def topic_title(raw: str) -> str:
    title = clean(raw)
    match = re.match(r"^(.*?),\s*(The|the)$", title)
    return f"The {match.group(1)}" if match else title


# Headings the general rules below would garble, written out by hand (reviewed 2026-10-06).
TITLE_OVERRIDES = {
    "The Holy Spirit, the Comforter": "The Holy Spirit, the Comforter",
    "The Holy Spirit, the Teacher": "The Holy Spirit, the Teacher",
    "Holy Spirit, the Personality Of": "The Personality of the Holy Spirit",
    "Herbs, & C": "Herbs and Plants",
    "Paschal Lamb, Typical Nature Of": "The Paschal Lamb as a Type of Christ",
    "Saints, Compared To": "What Saints Are Compared To",
    "Wicked, The, Are Compared To": "What the Wicked Are Compared To",
    "Theocracy, The, or Immediate Government By God": "The Theocracy, or Immediate Government by God",
    "Jesus, the Christ": "Jesus the Christ",
}
PREPOSITIONS = ("Under", "Toward", "Towards", "Of", "To", "For", "Against", "In", "With", "On", "Over", "By", "From")


def natural_title(title: str) -> str:
    """Torrey's back-to-front index headings in plain English; the page address keeps the original (topic_id).

    "Holy Spirit, The, is God" -> "The Holy Spirit is God"; "Asher, the Tribe Of" -> "The Tribe of Asher";
    "Affliction, Consolation Under" -> "Consolation under Affliction"; "Anointing, Sacred" -> "Sacred Anointing";
    "Asp, or Adder" is kept as it is.
    """
    if title in TITLE_OVERRIDES:
        return TITLE_OVERRIDES[title]
    if title.startswith("Christ, the "):  # "Christ, the King" -> "Christ the King"
        return "Christ the " + title[len("Christ, the "):]
    parts = [part.strip() for part in title.split(",")]
    if len(parts) == 3 and parts[1] in ("The", "the"):
        return f"The {parts[0]} {parts[2]}"
    if len(parts) != 2 or not parts[1] or parts[1].lower().startswith(("or ", "and ")):
        return title
    head, tail = parts
    if tail in ("The", "the"):
        return f"The {head}"
    words = tail.split()
    if words[-1] in ("The", "the") and len(words) > 1 and words[-2].capitalize() in PREPOSITIONS:  # "Duty Toward The" + "Afflicted"
        return " ".join(words[:-2] + [words[-2].lower(), "the", head])
    if words[-1].capitalize() in PREPOSITIONS:  # "the Tribe Of" + "Asher", "Consolation Under" + "Affliction"
        rest = " ".join(words[:-1] + [words[-1].lower(), head])
        return rest[0].upper() + rest[1:]
    if words[0].lower() == "the":  # "Jordan, the River" -> "The River Jordan"
        return "The " + " ".join(words[1:] + [head])
    if len(words) <= 2:  # "Arms, Military" -> "Military Arms"
        return f"{tail} {head}"
    return title


def topic_id(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", re.sub(r"^the ", "", title.lower())).strip("-")


def span(parsed: str) -> list[int] | None:
    """CCEL's "|John|10|7|0|0" (book, chapter, verse, end chapter, end verse; 0 = none) -> [start id, end id]."""
    parts = (parsed.strip("|").split("|") + ["0"] * 5)[:5]  # ranges come without the trailing "|"
    book, chapter, verse, end_chapter, end_verse = parts
    code = OSIS_TO_CODE.get(book)
    if not code or chapter == "0":
        return None
    start = verse_id(code, int(chapter), int(verse) or 1)
    if end_chapter == "0" and end_verse == "0":
        return [start, start]
    return [start, verse_id(code, int(end_chapter) if end_chapter != "0" else int(chapter), int(end_verse) or 1)]


def paragraph_entry(paragraph: str) -> dict:
    """One Torrey line: its words before the dash, its verse spans, and any "See <topic>" cross-references."""
    refs = [s for s in (span(p) for p in re.findall(r'parsed="([^"]+)"', paragraph)) if s]
    words = clean(re.split(r"<scripRef", paragraph, maxsplit=1)[0])
    label = re.split(r"\s*[—�]\s*", words)[0].strip().rstrip(" .:;,-")
    see = re.findall(r"See\s+[“\"�]?([A-Za-z][^.;”\"�<]*)", clean(paragraph))
    return {"text": label, "refs": refs, "see": [s.strip() for s in see]}


def parse_torrey() -> list[dict]:
    text = TORREY.read_text(encoding="utf-8", errors="replace")
    entries = re.findall(r'<term id="[^"]+">(.*?)</term>\s*<def[^>]*>(.*?)</def>', text, re.S)
    topics, seen = [], {}
    for raw, body in entries:
        title = topic_title(raw)
        tid = topic_id(title)
        seen[tid] = seen.get(tid, 0) + 1
        if seen[tid] > 1:
            tid = f"{tid}-{seen[tid]}"
        points = []
        for level, paragraph in re.findall(r'<p class="index([12])"[^>]*>(.*?)</p>', body, re.S):
            entry = paragraph_entry(paragraph)
            if level == "2" and points:  # a sub-entry ("Moses") under the point above it ("Exemplified")
                points[-1].setdefault("items", []).append({k: entry[k] for k in ("text", "refs")})
                points[-1]["see"] += entry["see"]
            elif entry["text"] or entry["refs"]:
                points.append(entry)
        tid, title = TITLE_FIXES.get(tid, (tid, title))
        title = natural_title(title)
        topics.append({"id": tid, "title": title, "points": points})
    if len(topics) < 600:
        raise SystemExit(f"topics: only {len(topics)} topics parsed from {TORREY}; expected 623")
    return topics


def resolve_see(topics: list[dict]) -> None:
    """"See Prayer" -> the Prayer topic's id, when it exists."""
    by_title = {t["title"].lower(): t["id"] for t in topics} | {re.sub(r"^the ", "", t["title"].lower()): t["id"] for t in topics}
    for topic in topics:
        for point in topic["points"]:
            point["see"] = [by_title[s.lower()] for s in point["see"] if s.lower() in by_title and by_title[s.lower()] != topic["id"]]


def all_points(topic: dict) -> list[dict]:
    """Torrey's points, then Nave's."""
    return topic["points"] + topic.get("nave", [])


def plain(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return " ".join(plain(value[k]) for k in ("title", "text") if k in value)
    if isinstance(value, list):
        return "\n".join(plain(v) for v in value)
    return ""


def related_studies(topics: list[dict], model) -> None:
    """Each topic's closest published studies by meaning (same model as meaning search), above RELATED_MIN."""
    studies = []
    for path in sorted(STUDIES.glob("*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        if record.get("publication") == "published":
            content = record["content"]
            studies.append((record["id"], "\n".join(plain(content[k]) for k in ("title", "summary", "answer", "reasoning", "conclusion"))))
    study_vectors = model.encode([text for _, text in studies], normalize_embeddings=True)
    topic_texts = [t["title"] + ". " + "; ".join(p["text"] for p in all_points(t)[:20]) for t in topics]
    topic_vectors = model.encode(topic_texts, normalize_embeddings=True, batch_size=64)
    scores = topic_vectors @ study_vectors.T
    for topic, row in zip(topics, scores):
        order = np.argsort(-row)[:2]
        topic["relatedStudies"] = [studies[j][0] for j in order if row[j] >= RELATED_MIN]


BIBLE_WEB = WEBSITE / "data" / "plain" / "web"
CODE_BY_NUMBER = {number: code for code, number in BOOK_NUMBER.items()}


_CHAPTER_ENDS: dict[str, dict[int, int]] = {}


def chapter_end(code: str, chapter: int) -> int | None:
    """The last verse of a chapter in the World English Bible text (data/plain/web), or None when unknown."""
    if code not in _CHAPTER_ENDS:
        path = BIBLE_WEB / f"{code}.json"
        ends: dict[int, int] = {}
        for key in (json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}):
            ch, _, v = key.partition(":")
            if ch.isdigit() and v.isdigit():
                ends[int(ch)] = max(ends.get(int(ch), 0), int(v))
        _CHAPTER_ENDS[code] = ends
    return _CHAPTER_ENDS[code].get(chapter)


def verse_parts(verse: int) -> tuple[str, int, int]:
    return CODE_BY_NUMBER[verse // 1_000_000], verse // 1000 % 1000, verse % 1000


def key_verses(topics: list[dict], model) -> None:
    """Up to four verses per topic quoted in full (World English Bible). For each early point, the meaning model picks, among
    Torrey's verses for it, the one that best fits "<topic>: <point>" (so "The Love of God: is a part of his character" gets
    1 John 4:8, "God is love", not simply the first reference listed)."""
    books: dict[str, dict] = {}

    def text_of(verse: int) -> str | None:
        code, chapter, number = verse_parts(verse)
        if code not in books:
            path = BIBLE_WEB / f"{code}.json"
            books[code] = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
        return books[code].get(f"{chapter}:{number}")

    for topic in topics:
        points_all = all_points(topic)
        candidates = []  # (point index, span, text)
        for index, point in enumerate(points_all[:8]):
            refs = point["refs"] or [r for item in point.get("items", []) for r in item["refs"]]
            for ref in refs[:10]:
                if text := text_of(ref[0]):
                    candidates.append((index, ref, text))
        if not candidates:
            topic["keyVerses"] = []
            continue
        points = sorted({c[0] for c in candidates})[:4]
        queries = model.encode([f"{topic['title']}: {points_all[i]['text']}" for i in points], normalize_embeddings=True)
        verses = model.encode([c[2] for c in candidates], normalize_embeddings=True, batch_size=64)
        chosen = []
        used: set[int] = set()
        for query, point_index in zip(queries, points):
            mine = [k for k, c in enumerate(candidates) if c[0] == point_index and c[1][0] not in used]  # one verse appears once
            if not mine:
                continue
            best = max(mine, key=lambda k: float(verses[k] @ query))
            used.add(candidates[best][1][0])
            _, ref, text = candidates[best]
            chosen.append({"span": ref, "text": text + (" …" if ref[1] != ref[0] else ""), "point": points_all[point_index]["text"]})
        topic["keyVerses"] = chosen


def chapter_index(topics: list[dict]) -> dict[str, dict[str, list]]:
    """Per book: chapter -> [[topic id, passages cited], ...], most cited first (the reader's "Topics in this chapter")."""
    counts: dict[str, dict[int, dict[str, int]]] = {}
    for topic in topics:
        for point in all_points(topic):
            for ref in point["refs"] + [r for item in point.get("items", []) for r in item["refs"]]:
                code, chapter, _ = verse_parts(ref[0])
                chapters = counts.setdefault(code, {}).setdefault(chapter, {})
                chapters[topic["id"]] = chapters.get(topic["id"], 0) + 1
    return {code: {str(ch): sorted(([t, n] for t, n in found.items()), key=lambda x: -x[1]) for ch, found in chapters.items()} for code, chapters in counts.items()}


def merge_naves(topics: list[dict]) -> dict[str, str]:
    """Add Nave's Topical Bible: an entry named like a Torrey topic adds its points to that topic ("nave"); an entry that only
    says "See ..." becomes an alias of the topic it names; every other entry becomes a topic of its own. Returns the aliases."""
    entries = naves.parse(OSIS_TO_CODE, verse_id)
    by_id = {t["id"]: t for t in topics}
    see_only = {e["id"] for e in entries if e["id"] not in by_id and all(not p["refs"] and not p.get("items") for p in e["points"]) and any(p["see"] for p in e["points"])}
    for entry in entries:
        if entry["id"] in by_id:
            by_id[entry["id"]]["nave"] = entry["points"]
        elif entry["id"] not in see_only:
            # Headings with brackets ("Diadem. (R. V., Mitre)") keep Nave's wording; the comma rules would scramble them.
            title = entry["title"] if "(" in entry["title"] else natural_title(entry["title"])
            topic = {"id": entry["id"], "title": title, "points": [], "nave": entry["points"], "heading": entry["title"]}
            topics.append(topic)
            by_id[topic["id"]] = topic
    # Headings as Nave and Torrey wrote them and in reading order, so "See TEMPLE, DEDICATION OF" finds its topic.
    lookup: dict[str, str] = {}
    for topic in topics:
        for name in (topic["title"], topic.get("heading", ""), topic["id"].replace("-", " ")):
            key = re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()
            if key:
                lookup.setdefault(key, topic["id"])
                lookup.setdefault(re.sub(r"^the ", "", key), topic["id"])

    def find(name: str) -> str | None:
        key = re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()
        return lookup.get(key) or lookup.get(re.sub(r"^the ", "", key)) or lookup.get(key.split(" ")[0] if " " in key and key.split(" ")[0] in lookup else "")

    aliases = {}
    for entry in entries:
        if entry["id"] in see_only:
            target = next((t for p in entry["points"] for s in p["see"] if (t := find(s))), None)
            if target:
                aliases[entry["id"]] = target
    for topic in topics:
        for point in topic.get("nave", []):
            ids = [find(s) for s in point["see"]]
            point["see"] = list(dict.fromkeys(i for i in ids if i and i != topic["id"]))
    return aliases


def safe_span(parsed: str) -> list[int] | None:
    """A reference CCEL parsed impossibly (Easton has "Exodus 1491:1") is left as plain text instead of stopping the build."""
    try:
        return span(parsed)
    except ValueError:
        return None


def attach_dictionary(topics: list[dict], articles: dict) -> int:
    """Easton's Bible Dictionary article for every topic whose heading Easton also has. Easton's back-to-front headwords
    ("pilate, pontius") also answer to "pontius pilate" and "pilate"; a headword that already exists keeps its own article."""
    lookup = dict(articles)
    for key, article in articles.items():
        if ", " in key:
            head, tail = key.split(", ", 1)
            lookup.setdefault(f"{tail} {head}", article)
            lookup.setdefault(head, article)
    found = 0
    for topic in topics:
        if topic.get("dictionary"):
            found += 1
            continue
        for name in (topic.get("heading", ""), topic["title"], re.sub(r"^The ", "", topic["title"])):
            article = lookup.get(name.lower())
            if article:
                topic["dictionary"] = article
                found += 1
                break
    return found


SHARDS = 256  # topics are bundled (Cloudflare Pages allows 20,000 files a release; one file per topic would pass it)


def build() -> None:
    topics = parse_torrey()
    resolve_see(topics)
    taxonomy = json.loads(TAXONOMY.read_text(encoding="utf-8"))
    placed = {tid: (c["id"], s["id"]) for c in taxonomy["categories"] for s in c["subcategories"] for tid in s["topics"]}
    missing = [t["id"] for t in topics if t["id"] not in placed]
    unknown = sorted(set(placed) - {t["id"] for t in topics})
    if missing or unknown:
        raise SystemExit(f"topics: taxonomy mismatch: {len(missing)} topics not placed {missing[:5]}, {len(unknown)} unknown ids {unknown[:5]}")
    torrey_ids = {t["id"] for t in topics}
    naves.CHAPTER_END = chapter_end
    aliases = merge_naves(topics)
    placement = json.loads(NAVE_PLACEMENT.read_text(encoding="utf-8"))
    groups = {s["id"]: (c["id"], s) for c in taxonomy["categories"] for s in c["subcategories"]}
    unplaced = [t["id"] for t in topics if t["id"] not in torrey_ids and placement.get(t["id"]) not in groups]  # generated topics are checked below
    if unplaced:
        raise SystemExit(f"topics: {len(unplaced)} Nave topics have no group in {NAVE_PLACEMENT.name}: {unplaced[:8]}")
    # Nave's largest entries split at their sub-headings; the books of the Bible and other Easton-only topics.
    articles = easton.parse(safe_span)
    generated = topic_extras.split_entries(topics, None)
    titles = {t["title"].lower() for t in topics} | {t["title"].lower() for t in generated}
    generated += topic_extras.easton_topics(articles, BOOKS, titles)
    existing = {t["id"] for t in topics}
    clash = [t["id"] for t in generated if t["id"] in existing]
    if clash:
        raise SystemExit(f"topics: generated topic ids clash with existing topics: {clash[:8]}")
    topics.extend(generated)
    for topic in topics:
        if topic["id"] not in torrey_ids:
            group_id = topic.pop("placeAt", None) or placement.get(topic["id"])
            if group_id not in groups:
                raise SystemExit(f"topics: {topic['id']} goes to unknown group {group_id!r}")
            category, group = groups[group_id]
            group["topics"].append(topic["id"])
            placed[topic["id"]] = (category, group["id"])
    dictionary = attach_dictionary(topics, articles)
    readings = topic_extras.select_readings(next(e for e in naves.parse(OSIS_TO_CODE, verse_id) if e["id"] == "readings-select"))
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(MODEL)
    related_studies(topics, model)
    key_verses(topics, model)
    # The previous layout had one file per topic; remove those generated files before writing the bundles.
    OUT.mkdir(parents=True, exist_ok=True)
    for stale in OUT.glob("*.json"):
        stale.unlink()
    shards: dict[int, dict] = {}
    summary = {}
    for topic in topics:
        category, subcategory = placed[topic["id"]]
        topic.update(category=category, subcategory=subcategory)
        topic.pop("heading", None)
        shard = zlib.crc32(topic["id"].encode("utf-8")) % SHARDS
        shards.setdefault(shard, {})[topic["id"]] = topic
        points = all_points(topic)
        refs = sum(len(p["refs"]) + sum(len(i["refs"]) for i in p.get("items", [])) for p in points)
        source = ("t" if topic["points"] else "") + ("n" if topic.get("nave") else "")
        summary[topic["id"]] = {"title": topic["title"], "points": len(points), "refs": refs, "f": shard, "s": source + ("e" if topic.get("dictionary") else "")}
    (OUT / "t").mkdir(exist_ok=True)
    for stale in (OUT / "t").glob("*.json"):
        stale.unlink()
    for shard, records in shards.items():
        (OUT / "t" / f"{shard}.json").write_text(json.dumps(records, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "books").mkdir(exist_ok=True)
    for code, chapters in chapter_index(topics).items():
        (OUT / "books" / f"{code}.json").write_text(json.dumps(chapters, separators=(",", ":")), encoding="utf-8")
    for family in taxonomy["categories"]:  # a group can be empty (an era without prophets); it is left out
        family["subcategories"] = [group for group in family["subcategories"] if group["topics"]]
    index = {"source": taxonomy["source"], "categories": taxonomy["categories"], "topics": summary, "aliases": aliases, "readings": readings}
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    refs = sum(t["refs"] for t in summary.values())
    related = sum(1 for t in topics if t["relatedStudies"])
    merged = sum(1 for t in topics if t["points"] and t.get("nave"))
    print(f"topics: {len(topics)} topics ({len(torrey_ids)} Torrey, {merged} with Nave's points too, {len(topics) - len(torrey_ids)} from Nave), "
          f"{len(aliases)} aliases, {dictionary} dictionary articles, {refs} references, {related} with related studies, {len(shards)} files -> {OUT}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    build()
