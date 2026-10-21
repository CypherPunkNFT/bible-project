"""Write the chapter summaries for the library page: data/summaries/<BOOK>.json, one file per book.

Source: the chapter-summary studio's Claude database (.local/chapter-summary-studio/claude/summaries-v3.sqlite3),
opened read-only. Only the four fields the page shows are copied (title, summary, invitation, outline); the
records' provenance, reviewer notes and local paths never leave this PC. Every file carries the AI notice, so
the text is labelled wherever it ends up.

The summaries are AI-written and still being checked; the owner chose to publish them with that warning
(2026-10-20). `bun run data` replaces data/ wholesale, so run this again after a data rebuild.

Run from Website/:  py -3.12 scripts/build-chapter-summaries.py
"""
import json
import shutil
import sqlite3
import sys
from pathlib import Path

WEBSITE = Path(__file__).resolve().parents[1]
DATABASE = WEBSITE / ".local/chapter-summary-studio/claude/summaries-v3.sqlite3"
STATS = WEBSITE / "data/stats.json"
OUTPUT = WEBSITE / "data/summaries"
STAGING = WEBSITE / "data/summaries.new"
NOTICE = "AI-written summaries, still being checked. They may contain mistakes; the chapter itself is the authority."


def clean_text(value: object, field: str, key: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key}: field '{field}' should be non-empty text, got {value!r}")
    return value.strip()


def clean_record(key: str, record: dict, verses: int) -> dict:
    outline = []
    for part in record.get("outline") or []:
        start, end = part.get("verse_start"), part.get("verse_end")
        if not (isinstance(start, int) and isinstance(end, int) and 1 <= start <= end <= verses):
            raise ValueError(f"{key}: outline verses {start}-{end} fall outside the chapter's 1-{verses}")
        outline.append([start, end, clean_text(part.get("heading"), "outline heading", key), clean_text(part.get("text"), "outline text", key)])
    cleaned = {
        "title": clean_text(record.get("title"), "title", key),
        "summary": clean_text(record.get("summary"), "summary", key),
        "outline": outline,
    }
    if isinstance(record.get("invitation"), str) and record["invitation"].strip():
        cleaned["invitation"] = record["invitation"].strip()
    return cleaned


def main() -> int:
    if not DATABASE.is_file():
        print(f"summary database not found: expected {DATABASE}", file=sys.stderr)
        return 1
    if not STATS.is_file():
        print(f"chapter counts not found: expected {STATS} (run `bun run data` first)", file=sys.stderr)
        return 1
    stats = json.loads(STATS.read_text(encoding="utf-8"))
    canon = {book["code"]: [chapter[0] for chapter in book["chapters"]] for book in stats["books"] if book["section"] != "apocrypha"}

    connection = sqlite3.connect(f"file:{DATABASE.as_posix()}?mode=ro", uri=True)
    rows = dict(connection.execute("select key, payload from summaries"))
    connection.close()

    books: dict[str, dict] = {}
    missing = []
    for code, verse_counts in canon.items():
        chapters = {}
        for number, verses in enumerate(verse_counts, start=1):
            key = f"{code}:{number}"
            if key not in rows:
                missing.append(key)
                continue
            chapters[str(number)] = clean_record(key, json.loads(rows[key]), verses)
        books[code] = {"notice": NOTICE, "chapters": chapters}
    extra = sorted(set(rows) - {f"{code}:{n}" for code, counts in canon.items() for n in range(1, len(counts) + 1)})
    if extra:
        print(f"ignored {len(extra)} records that are not KJV chapters: {', '.join(extra[:10])}", file=sys.stderr)

    if STAGING.exists():
        shutil.rmtree(STAGING)
    STAGING.mkdir(parents=True)
    for code, content in books.items():
        (STAGING / f"{code}.json").write_text(json.dumps(content, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    STAGING.rename(OUTPUT)

    written = sum(len(content["chapters"]) for content in books.values())
    size = sum(path.stat().st_size for path in OUTPUT.iterdir()) // 1024
    print(f"wrote {written} chapter summaries in {len(books)} files to {OUTPUT} ({size} KB)")
    if missing:
        print(f"no summary for {len(missing)} chapters: {', '.join(missing[:20])}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
