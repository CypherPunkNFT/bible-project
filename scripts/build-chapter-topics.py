#!/usr/bin/env python3
"""The reader's "Topics in this chapter", one file per book: data/topics/chapters/<book>.json =
{"chapters": {chapter: [[topic id, passages cited], ...]}, "names": {topic id: title}}, names only for the topics a chapter
shows (its first SHOWN; the rest are counted in "+N more").

Built from data/topics/books/ and data/topics/index.json (scripts/build-topics.py runs this at its end). The names let a
chapter page skip the 119 KB whole-Bible index it fetched only to look up a dozen titles (2026-10-21). Topics missing from
the index are left out, as the reader always did.

  py -3.12 scripts/build-chapter-topics.py
"""
import json
import sys
from pathlib import Path

TOPICS = Path(__file__).resolve().parents[1] / "data" / "topics"
SHOWN = 12  # src/components/reader/ChapterTopics.tsx SHOWN


def build(topics: Path = TOPICS) -> int:
    index = json.loads((topics / "index.json").read_text(encoding="utf-8"))["topics"]
    out = topics / "chapters"
    out.mkdir(exist_ok=True)
    books = sorted((topics / "books").glob("*.json"))
    if not books:
        raise SystemExit(f"chapter topics: no per-book files in {topics / 'books'}; run scripts/build-topics.py first")
    for stale in out.glob("*.json"):
        if not (topics / "books" / stale.name).exists():
            stale.unlink()
    for book in books:
        source = json.loads(book.read_text(encoding="utf-8"))
        chapters = {chapter: [[tid, n] for tid, n in found if tid in index] for chapter, found in source.items()}
        chapters = {chapter: found for chapter, found in chapters.items() if found}
        names = {tid: index[tid]["title"] for found in chapters.values() for tid, _ in found[:SHOWN]}
        body = json.dumps({"chapters": chapters, "names": names}, ensure_ascii=False, separators=(",", ":"))
        (out / book.name).write_bytes(body.encode("utf-8"))
    return len(books)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(f"chapter topics: {build()} books -> {TOPICS / 'chapters'}")
