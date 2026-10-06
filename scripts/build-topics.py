#!/usr/bin/env python3
"""Build the Bible topics (data/topics/): R. A. Torrey's New Topical Textbook (1897, public domain) in a two-level
taxonomy (content/topics/taxonomy.json: category -> subcategory -> topics), with related studies worked out on this PC.

  D:/Python/python.exe scripts/build-topics.py      # needs sentence-transformers (related studies); run after build-data.py

Output: data/topics/index.json (taxonomy + each topic's title and counts) and data/topics/<id>.json (Torrey's points with
verse spans, "see also" topics, related studies). Only the book's facts (topics, points, references) are used; CCEL's
markup is not republished (Website/SOURCES.md).
"""
import html
import json
import re
import sys
from pathlib import Path

import numpy as np

WEBSITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WEBSITE / "scripts"))
from bible.books import OSIS_TO_CODE, verse_id  # noqa: E402

TORREY = WEBSITE.parent / "sources" / "ccel" / "ttt.xml"
TAXONOMY = WEBSITE / "content" / "topics" / "taxonomy.json"
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
    if words[-1] in ("The", "the") and len(words) > 1 and words[-2] in PREPOSITIONS:  # "Duty Toward The" + "Afflicted"
        return " ".join(words[:-2] + [words[-2].lower(), "the", head])
    if words[-1] in PREPOSITIONS:  # "the Tribe Of" + "Asher", "Consolation Under" + "Affliction"
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


def plain(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return " ".join(plain(value[k]) for k in ("title", "text") if k in value)
    if isinstance(value, list):
        return "\n".join(plain(v) for v in value)
    return ""


def related_studies(topics: list[dict]) -> None:
    """Each topic's closest published studies by meaning (same model as meaning search), above RELATED_MIN."""
    from sentence_transformers import SentenceTransformer

    studies = []
    for path in sorted(STUDIES.glob("*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        if record.get("publication") == "published":
            content = record["content"]
            studies.append((record["id"], "\n".join(plain(content[k]) for k in ("title", "summary", "answer", "reasoning", "conclusion"))))
    model = SentenceTransformer(MODEL)
    study_vectors = model.encode([text for _, text in studies], normalize_embeddings=True)
    topic_texts = [t["title"] + ". " + "; ".join(p["text"] for p in t["points"][:20]) for t in topics]
    topic_vectors = model.encode(topic_texts, normalize_embeddings=True, batch_size=64)
    scores = topic_vectors @ study_vectors.T
    for topic, row in zip(topics, scores):
        order = np.argsort(-row)[:2]
        topic["relatedStudies"] = [studies[j][0] for j in order if row[j] >= RELATED_MIN]


def build() -> None:
    topics = parse_torrey()
    resolve_see(topics)
    taxonomy = json.loads(TAXONOMY.read_text(encoding="utf-8"))
    placed = {tid: (c["id"], s["id"]) for c in taxonomy["categories"] for s in c["subcategories"] for tid in s["topics"]}
    missing = [t["id"] for t in topics if t["id"] not in placed]
    unknown = sorted(set(placed) - {t["id"] for t in topics})
    if missing or unknown:
        raise SystemExit(f"topics: taxonomy mismatch: {len(missing)} topics not placed {missing[:5]}, {len(unknown)} unknown ids {unknown[:5]}")
    related_studies(topics)
    OUT.mkdir(parents=True, exist_ok=True)
    summary = {}
    for topic in topics:
        category, subcategory = placed[topic["id"]]
        topic.update(category=category, subcategory=subcategory)
        (OUT / f"{topic['id']}.json").write_text(json.dumps(topic, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        refs = sum(len(p["refs"]) + sum(len(i["refs"]) for i in p.get("items", [])) for p in topic["points"])
        summary[topic["id"]] = {"title": topic["title"], "points": len(topic["points"]), "refs": refs}
    index = {"source": taxonomy["source"], "categories": taxonomy["categories"], "topics": summary}
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    refs = sum(t["refs"] for t in summary.values())
    related = sum(1 for t in topics if t["relatedStudies"])
    print(f"topics: {len(topics)} topics, {refs} references, {related} with related studies -> {OUT}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    build()
