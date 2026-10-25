"""Step 0 of the answer pictures (content/questions/pictures/README.md): the plain list of every shown question and
the right answer a picture would show. No model, no cost.

Reads the official bank (content/questions/bank/question-bank.json; never written to here) and keeps the questions the
site shows (not hidden and not a repeat of another, as build-question-bank.py's site_copy does). The right answer is
the choice marked right (`answer_choice`, a short form of a long printed answer) or else the printed answer. Each row keeps the bank's own `id`, so a picture stays with its question when the
bank is rebuilt.

Writes two files into content/questions/pictures/:
  answers.json   every shown question: id, question, answer, children, level, kind, reference, people, places
  answers.csv    the same as one table, for a spreadsheet

    python scripts/question_pictures_list.py
"""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

SITE = Path(__file__).resolve().parent.parent
BANK = SITE / "content/questions/bank/question-bank.json"
OUT = SITE / "content/questions/pictures"
COLUMNS = ["id", "question", "answer", "children", "level", "kind", "reference", "people", "places"]


def row_of(question: dict) -> dict:
    return {
        "id": question["id"],
        "question": question["question"],
        "answer": question.get("answer_choice") or question["answer"],
        "children": question.get("children") is True,
        "level": question.get("level"),
        "kind": question["kind"],
        "reference": question.get("reference"),
        "people": question.get("people") or [],
        "places": question.get("places") or [],
    }


def main() -> None:
    bank = json.loads(BANK.read_text(encoding="utf-8"))
    rows = [row_of(q) for q in bank["questions"] if not q.get("hidden") and not q.get("repeat_of")]
    ids = [r["id"] for r in rows]
    if len(set(ids)) != len(ids):
        raise SystemExit(f"question ids are not unique in {BANK}: {len(ids)} rows, {len(set(ids))} distinct ids")
    OUT.mkdir(exist_ok=True)
    (OUT / "answers.json").write_text(json.dumps({"from": "content/questions/bank/question-bank.json", "count": len(rows), "questions": rows},
                                                 ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    with (OUT / "answers.csv").open("w", encoding="utf-8-sig", newline="") as table:
        writer = csv.DictWriter(table, fieldnames=COLUMNS)
        writer.writeheader()
        for r in rows:
            writer.writerow({**r, "people": "; ".join(r["people"]), "places": "; ".join(r["places"])})
    children = sum(r["children"] for r in rows)
    distinct = len({r["answer"].strip().lower() for r in rows})
    print(f"{len(rows)} shown questions ({children} for children), {distinct} distinct answers -> {OUT.relative_to(SITE)}/answers.json, answers.csv")


if __name__ == "__main__":
    main()
