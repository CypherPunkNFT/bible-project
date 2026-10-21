"""Copy the draft chapter summaries into this mock-up (local only; the output is git-ignored).

The drafts are unapproved, so they must never reach the public repository or the live site.
Run from Website/:  python design/library-chapters/export-summaries.py
"""
import json
import sqlite3
import sys
from pathlib import Path

WEBSITE = Path(__file__).resolve().parents[2]
DATABASE = WEBSITE / ".local/chapter-summary-studio/claude/summaries-v3.sqlite3"
OUTPUT = Path(__file__).resolve().parent / "summaries.local.json"


def main() -> int:
    if not DATABASE.is_file():
        print(f"summary database not found: expected {DATABASE}", file=sys.stderr)
        return 1
    connection = sqlite3.connect(f"file:{DATABASE.as_posix()}?mode=ro", uri=True)
    summaries = {}
    for key, payload in connection.execute("select key, payload from summaries"):
        record = json.loads(payload)
        summaries[key] = {
            "title": record.get("title", ""),
            "summary": record.get("summary", ""),
            "invitation": record.get("invitation", ""),
            "outline": [[part["verse_start"], part["verse_end"], part["heading"], part["text"]] for part in record.get("outline", [])],
        }
    OUTPUT.write_text(json.dumps(summaries, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {len(summaries)} chapter summaries to {OUTPUT} ({OUTPUT.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
