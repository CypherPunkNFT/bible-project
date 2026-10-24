"""The question explorer's data: every question, shown or not, with what the check changed and the verses read.

Written by build-question-bank.py after the table, to `.local/question-explorer/questions.json`, which the local
data hub serves at /data_questions/ (scripts/data-questions-vite.ts). Never in `data/`: that folder is released with
the site, and this file holds the audit's working notes. Rows are arrays in the order of `columns`, to keep the file
small; the page turns them back into objects.
"""

from __future__ import annotations

import datetime
import json
import os
from pathlib import Path

from bible.books import BOOKS
from question_audit import load_audit
from question_grounding import CATEGORIES, load_grounding
from question_model_tags import bible_book
from question_tags import parse_reference

VERSES_PER_QUESTION = 8  # BSB text sent for at most this many verses; the rest are counted as "more"

# The type-of-wrong groups the page filters by, in its order, each with its plain label.
WRONG_GROUPS = {
    "question": "The question was wrong",
    "answer": "The answer was wrong",
    "choice": "A wrong choice was actually right",
    "reworded": "Answer reworded",
    "reference": "Reference",
    "other": "Other change",
}
QUESTION_FAULTS = {"misquote", "other_translation", "other"}

COLUMNS = ["id", "status", "collection", "kind", "tradition", "question", "answer", "right", "options", "reference",
           "refBooks", "leadIn", "basis", "category", "strength", "outside", "verses", "verseKeys", "moreVerses", "note", "doubt",
           "groundedBy", "verdict", "faults", "why", "auditedBy", "recheck", "optionsBy", "repeatOf", "hidden", "sourceUrl",
           "problems", "before", "wrong", "level", "children"]


def wrong_groups(record: dict) -> list[str]:
    """The groups an audit record's faults fall into. `after` is missing when the audit hid the question, and then
    nothing was reworded. Every record with a fault lands in at least one group ("other" catches the rest)."""
    kinds = {p["kind"] for p in record.get("problems", [])}
    before = record["before"]
    after = record.get("after") or before
    groups = []
    if after["question"] != before["question"] and kinds & QUESTION_FAULTS:
        groups.append("question")
    if "wrong_answer" in kinds:
        groups.append("answer")
    if "choice_also_right" in kinds:
        groups.append("choice")
    if after["answer"] != before["answer"] and "wrong_answer" not in kinds:
        groups.append("reworded")
    if "reference" in kinds:
        groups.append("reference")
    if kinds and not groups:
        groups.append("other")
    return groups


def verse_text(key: str) -> str | None:
    """The BSB text of a verse key such as "1KI 14:21", or None if the BSB has no such verse."""
    code, _, place = key.partition(" ")
    chapter, _, verse = place.partition(":")
    try:
        return bible_book(code).get((int(chapter), int(verse)))
    except (FileNotFoundError, ValueError):
        return None


def status_of(q: dict) -> str:
    return "hidden" if q.get("hidden") else "repeat" if q.get("repeat_of") else "shown"


def explorer_row(q: dict, audit: dict | None, grounding_record: dict | None, verses: dict[str, str]) -> list:
    """One question as a row. `audit` and `grounding_record` are the saved records, passed only when the build
    applied them (q["audit"] / q["grounding"] set), so nothing read for older wording reaches the page."""
    g = q.get("grounding") or {}
    a = q.get("audit") or {}
    keys = [k for v in (grounding_record or {}).get("verses", []) for k in v["keys"]]
    keys = list(dict.fromkeys(keys))
    sent = []
    for key in keys[:VERSES_PER_QUESTION]:
        text = verse_text(key)
        if text is not None:
            verses[key] = text
            sent.append(key)
    before = None
    if audit:
        b = audit["before"]
        before = {"question": b["question"], "answer": b["answer"], "right": b["right"], "options": b["options"],
                  "reference": b["reference"]}
    row = {
        "id": q["id"], "status": status_of(q), "collection": q["collection"], "kind": q["kind"],
        "tradition": q.get("tradition"), "question": q["question"], "answer": q["answer"],
        "right": q.get("answer_choice"), "options": q.get("options"), "reference": q.get("reference"),
        "refBooks": list(dict.fromkeys(book for book, _c, _v in parse_reference(q.get("reference")))),
        "leadIn": q.get("lead_in"), "basis": g.get("basis"), "category": g.get("category"), "strength": g.get("strength"),
        "outside": g.get("outside"), "verses": g.get("verses", []), "verseKeys": sent,
        "moreVerses": max(0, len(keys) - VERSES_PER_QUESTION), "note": g.get("note"), "doubt": g.get("doubt"),
        "groundedBy": g.get("by"), "verdict": a.get("verdict"), "faults": a.get("kinds", []), "why": a.get("why"),
        "auditedBy": a.get("by"), "recheck": ((audit or {}).get("rechecked") or {}).get("verdict"), "optionsBy": q.get("options_by"), "repeatOf": q.get("repeat_of"),
        "hidden": q.get("hidden"), "sourceUrl": q.get("source_url"),
        "problems": [[p["kind"], p["detail"]] for p in audit["problems"]] if audit else [],
        "before": before, "wrong": wrong_groups(audit) if audit else [], "level": q.get("level"),
        "children": q.get("children"),
    }
    return [row[c] for c in COLUMNS]


def write_explorer(questions: list[dict], path: Path) -> int:
    """Write the explorer's file atomically (the preview may be reading it); return the number of rows."""
    audits = load_audit()["questions"]
    groundings = load_grounding()["questions"]
    verses: dict[str, str] = {}
    rows = [explorer_row(q, audits.get(q["id"]) if q.get("audit") else None,
                         groundings.get(q["id"]) if q.get("grounding") else None, verses) for q in questions]
    data = {"schema": "bibleproject.question-explorer/v1",
            "built": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            "wrongGroups": WRONG_GROUPS, "categories": CATEGORIES, "books": {code: name for code, name, _section, _osis in BOOKS},
            "columns": COLUMNS, "rows": rows, "verses": verses}
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")
    os.replace(temporary, path)
    return len(rows)
