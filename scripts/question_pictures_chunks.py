"""Step 1 of the answer pictures (content/questions/pictures/README.md): splits the list of shown questions into the
chunks a picture-idea job takes, one model session per chunk (content/questions/pictures/ideas/TASK.md).

Reads content/questions/pictures/answers.json (scripts/question_pictures_list.py). Children's questions come first
(owner, 2026-10-25), each group in Bible order by its reference so one story's questions sit together and share
picture names. Each entry keeps only what the task needs: id, question, answer, reference.

Writes content/questions/pictures/ideas/in/chunk-NNN.json and in/index.json (which chunk holds which questions).
Refuses to run when ideas/out/ already holds results, since renumbering would mismatch them.

    python scripts/question_pictures_chunks.py [--size 250]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

SITE = Path(__file__).resolve().parent.parent
PICTURES = SITE / "content/questions/pictures"
BANK = SITE / "content/questions/bank/question-bank.json"
SITE_BANK = SITE / "data/questions/bank.json"  # holds the 66 books in Bible order


def bible_order(books: list[str], reference: str | None, order: dict[str, int]) -> tuple[int, int, int]:
    """A sort key: the question's first book in Bible order, then the chapter and verse its reference names (references
    are written many ways, 'Ps 119:105', 'Psalm 119', 'GEN 1:1', so only the numbers after the book are read)."""
    numbers = re.search(r"[A-Za-z]\.?\s*(\d+)(?::(\d+))?", reference or "")
    chapter, verse = (int(numbers.group(1)), int(numbers.group(2) or 0)) if numbers else (0, 0)
    return (min((order.get(b, 999) for b in books), default=999), chapter, verse)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--size", type=int, default=250)
    size = parser.parse_args().size
    out_dir, in_dir = PICTURES / "ideas/out", PICTURES / "ideas/in"
    if out_dir.exists() and any(out_dir.glob("chunk-*.json")):
        raise SystemExit(f"{out_dir} already holds results; renumbering the chunks would mismatch them")
    rows = json.loads((PICTURES / "answers.json").read_text(encoding="utf-8"))["questions"]
    order = {b["code"]: i for i, b in enumerate(json.loads(SITE_BANK.read_text(encoding="utf-8"))["books"])}
    books = {q["id"]: q.get("books") or [] for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]}
    rows.sort(key=lambda r: (not r["children"], bible_order(books[r["id"]], r["reference"], order)))
    in_dir.mkdir(parents=True, exist_ok=True)
    index = []
    for start in range(0, len(rows), size):
        part = rows[start:start + size]
        number = f"{start // size + 1:03d}"
        entries = [{"id": r["id"], "q": r["question"], "a": r["answer"], "ref": r["reference"]} for r in part]
        (in_dir / f"chunk-{number}.json").write_text(json.dumps(entries, ensure_ascii=False, indent=0) + "\n", encoding="utf-8", newline="\n")
        index.append({"chunk": number, "count": len(part), "children": sum(r["children"] for r in part)})
    (in_dir / "index.json").write_text(json.dumps(index, indent=1) + "\n", encoding="utf-8", newline="\n")
    children_chunks = sum(1 for c in index if c["children"])
    print(f"{len(rows)} questions in {len(index)} chunks of {size}; the first {children_chunks} hold the {sum(c['children'] for c in index)} children's questions")


if __name__ == "__main__":
    main()
