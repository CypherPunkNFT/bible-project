"""Link every topic to the library books that treat it, by meaning (the local search index's own embeddings).

Run from Website with the knowledge environment, after the topics build and a completed embedding pass:
    ..\\KnowledgeBase\\.venv\\Scripts\\python.exe scripts/link-topic-library.py [--limit N] [--only id,id]

Reads data/topics/index.json and its bundles, embeds one short query per topic (title, group, Easton's opening,
Torrey/Nave headings) on the local encoder, searches the library passages in the LanceDB index and keeps the closest
few distinct books. Writes data/topics/library/<bundle>.json: {topic id: [{title, author, url, distance}]}.
Only book metadata and public source links are written; library text never leaves the private index.
"""
import argparse
import json
import re
import sqlite3
import sys
import time
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SITE))
from knowledge import settings  # noqa: E402
from knowledge.encoder import request_vectors  # noqa: E402
from knowledge.vectors import table  # noqa: E402

TOPICS = SITE / "data/topics"
OUT = TOPICS / "library"
KEEP = 6               # books shown per topic
CANDIDATES = 300       # nearest passages examined per topic (all kinds; library ones kept)
MAX_DISTANCE = 0.72    # cosine distance; beyond this a match is too loose to show
SPREAD = 0.10          # keep books within this distance of the topic's best match
# Reference works, indexes and apparatus match every topic by vocabulary, not by treatment.
SKIP_TITLE = re.compile(r"dictionar|encyclop|concordance|lexicon|cyclop|gazetteer|\bbible\b(?!.*(commentary|exposition|notes))|reading plan|hymn|index", re.I)
SKIP_FILE_TITLE = re.compile(r"^(original|index|text)\.\w+$|\.(pdf|html?|txt|epub)$", re.I)  # no real title recorded
SKIP_LOCATOR = re.compile(r"index|endnote|footnote|contents|\btoc\b|copyright|bibliograph|letter-[a-z]\b|glossary|title-?page", re.I)
LINK_KEYS = ("sourcePage", "canonicalUrl", "url", "finalUrl")


def topic_query(topic, summary, groups):
    """A short statement of what the topic is about, in words rather than verse references."""
    parts = [topic["title"] + "."]
    group = groups.get(topic["id"])
    if group:
        parts.append(f"{group}.")
    for paragraph in (topic.get("dictionary") or [])[:1]:
        text = "".join(piece if isinstance(piece, str) else piece[2] for piece in paragraph)
        parts.append(text[:600])
    heads = [point["text"] for point in (topic.get("points") or []) + (topic.get("nave") or []) if point.get("text")]
    if heads:
        parts.append("; ".join(heads[:16]))
    return " ".join(parts)[:1500]


def display_name(author):
    """Catalogues store "Bavinck, Herman"; pages read "Herman Bavinck". Qualifiers such as "(of Haddington)" stay last."""
    match = re.fullmatch(r"([^,()]+),\s*([^,()]+?)\s*(\(.*\))?", author.strip())
    return f"{match[2]} {match[1]}{' ' + match[3] if match[3] else ''}" if match else author.strip()


def work_of(db, document_id, cache):
    """Title, author and public link for a library document, or None when it is not a book to recommend."""
    if document_id in cache:
        return cache[document_id]
    row = db.execute("SELECT title, metadata FROM documents WHERE id=?", (document_id,)).fetchone()
    result = None
    if row and row[0] and not SKIP_TITLE.search(row[0]) and not SKIP_FILE_TITLE.search(row[0].strip()):
        meta = json.loads(row[1] or "{}")
        layers = [meta.get(key) or {} for key in ("acquisition", "edition", "work", "asset", "catalog")]
        author = next((layer.get("author") for layer in layers if isinstance(layer.get("author"), str) and layer.get("author")), "")
        url = next((layer[key] for layer in layers for key in LINK_KEYS if isinstance(layer.get(key), str) and layer[key].startswith("http")), "")
        title = re.sub(r"\s*[-–]\s*Modernized$|\s*\((of \d+|vol\.?[^)]*)\)\s*$", "", row[0].strip(" “”\"")).strip()
        if not author and "spurgeongems.org" in url:
            author = "Charles Haddon Spurgeon"
        result = {"title": title, "author": display_name(author), "url": url}
    cache[document_id] = result
    return result


def nearest_books(vectors, db, vector, works):
    # Filtering after the search is ~25x faster than LanceDB's prefilter; library passages are most of the index.
    hits = [hit for hit in vectors.search(vector).metric("cosine").select(["id", "kind"]).limit(CANDIDATES).to_list() if hit["kind"] == "library_text"]
    books, seen = [], set()
    best = None
    for hit in hits:
        distance = hit["_distance"]
        if distance > MAX_DISTANCE or (best is not None and distance > best + SPREAD):
            break
        chunk = db.execute("SELECT document_id, locator FROM chunks WHERE id=?", (hit["id"],)).fetchone()
        if not chunk or SKIP_LOCATOR.search(chunk[1] or ""):
            continue
        work = work_of(db, chunk[0], works)
        if not work:
            continue
        key = (work["title"].lower(), work["author"].lower())
        if key in seen:
            continue
        seen.add(key)
        best = distance if best is None else best
        books.append(work | {"distance": round(distance, 3)})
        if len(books) >= KEEP:
            break
    return books


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="only the first N topics (trial runs)")
    parser.add_argument("--only", default="", help="comma-separated topic ids (trial runs; prints instead of writing)")
    args = parser.parse_args()
    config = settings.load()
    db = sqlite3.connect(f"file:{config['state_dir'] / 'knowledge.sqlite3'}?mode=ro", uri=True)
    vectors = table(config)
    if vectors is None:
        raise SystemExit("No vector index found in the knowledge state directory; run the knowledge intake first.")
    index = json.loads((TOPICS / "index.json").read_text(encoding="utf-8"))
    groups = {topic: group["title"] for family in index["categories"] for group in family["subcategories"] for topic in group["topics"]}
    ids = [name for name in args.only.split(",") if name] or list(index["topics"])
    if args.limit:
        ids = ids[:args.limit]
    bundles = {}
    for name in ids:
        bundles.setdefault(index["topics"][name]["f"], []).append(name)
    started, works, result, done = time.time(), {}, {}, 0
    for bundle, names in sorted(bundles.items()):
        topics = json.loads((TOPICS / "t" / f"{bundle}.json").read_text(encoding="utf-8"))
        queries = [topic_query(topics[name], index["topics"][name], groups) for name in names]
        embedded = request_vectors(config, queries, "query")
        result[bundle] = {name: books for name, vector in zip(names, embedded) if (books := nearest_books(vectors, db, vector, works))}
        done += len(names)
        print(f"bundle {bundle}: {done}/{len(ids)} topics, {time.time() - started:.0f}s", flush=True)
    if args.only:
        for bundle in result.values():
            for name, books in bundle.items():
                print(f"\n{name}")
                for book in books:
                    print(f"  {book['distance']:.3f}  {book['title']} | {book['author']} | {book['url']}")
        return
    OUT.mkdir(exist_ok=True)
    for bundle, value in result.items():
        (OUT / f"{bundle}.json").write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    linked = sum(len(value) for value in result.values())
    print(f"{linked}/{len(ids)} topics linked to library books; {OUT.relative_to(SITE)}/ written in {time.time() - started:.0f}s")


if __name__ == "__main__":
    main()
