"""How hard each question the site shows is: one level for teens and adults (easy, medium or hard), and whether it
suits children.

Claude Opus reads every shown question, 40 to a call through BatchRunner, with its answer and choices but no Bible
text: how well known a fact is does not depend on the verse's wording, and leaving the text out keeps each call
small. Every rating is kept in content/questions/difficulty.json by question id, so a rebuild never asks again about
a question already rated; a question reworded since is rated again.

    python scripts/question_difficulty.py prepare           # write BatchRunner items for shown questions not yet rated
    python scripts/question_difficulty.py apply <out-dir>   # read BatchRunner's answers and record them
    (then python scripts/build-question-bank.py)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

WEBSITE = Path(__file__).resolve().parent.parent
BANK = WEBSITE / "content" / "questions" / "question-bank.json"
RATINGS = WEBSITE / "content" / "questions" / "difficulty.json"
WORK = WEBSITE / ".local" / "question-difficulty"

QUESTIONS_PER_CALL = 40
ANSWER_CHARS = 400
LEVELS = ("easy", "medium", "hard")
MODEL = "claude-opus-5-5"

TASK = """You rate how hard Bible quiz questions are, for a Bible study website.

For every question in the input give:
- "level", for teens and adults:
  - "easy": most people who have been to church a while would know it (who built the ark, where Jesus was born,
    how many disciples Jesus chose).
  - "medium": someone who reads the Bible regularly would know it, but a casual churchgoer might not (who replaced
    Judas, what Gideon's fleece was for, which prophet was taken up in a whirlwind).
  - "hard": it takes close knowledge of that passage (a name in a genealogy, an exact number, a minor detail, a
    phrase from a less read book).
  When the question has choices, judge it with them: a question whose wrong choices are plainly wrong is easier.
- "children": true when a child of about 6 to 11 who goes to Sunday school could answer it and it suits that age:
  a well known story, plain words, nothing graphic or sexual at its centre. false otherwise.
"q" is the question's number as written (q1, q2, ...). Rate every question in the input."""

SCHEMA = {"type": "object", "properties": {"ratings": {"type": "array", "items": {
    "type": "object", "properties": {
        "q": {"type": "string"},
        "level": {"type": "string", "enum": list(LEVELS)},
        "children": {"type": "boolean"}},
    "required": ["q", "level", "children"], "additionalProperties": False}}},
    "required": ["ratings"], "additionalProperties": False}


def load_ratings() -> dict:
    if RATINGS.exists():
        return json.loads(RATINGS.read_text(encoding="utf-8"))
    return {"about": "How hard each shown question is, set by Claude Opus: a level for teens and adults and whether "
                     "it suits children; written by scripts/question_difficulty.py.", "questions": {}}


def fingerprint(q: dict) -> str:
    """Changes when the question, its answer or its choices change, so a reworded question is rated again."""
    text = json.dumps([q["question"], q["answer"], q["options"]], ensure_ascii=False)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def current(q: dict, rated: dict) -> dict | None:
    rating = rated.get(q["id"])
    return rating if rating and rating["of"] == fingerprint(q) else None


# --- used by build-question-bank.py --------------------------------------------------------------------------------

def add_difficulty(questions: list[dict]) -> int:
    """Give every question its "level" and "children" (None when not yet rated); return how many are rated."""
    rated = load_ratings()["questions"]
    for q in questions:
        rating = current(q, rated) or {}
        q["level"] = rating.get("level")
        q["children"] = rating.get("children")
    return sum(1 for q in questions if q["level"])


# --- prepare ---------------------------------------------------------------------------------------------------------

def question_lines(n: int, q: dict) -> list[str]:
    lines = [f"q{n}", f"  Question: {q['question']}", f"  Answer: {q['answer'][:ANSWER_CHARS]}"]
    if q["options"]:
        lines.append(f"  Choices: {' | '.join(q['options'])}")
    if q.get("reference"):
        lines.append(f"  Reference: {q['reference']}")
    return lines + [""]


def prepare() -> None:
    rated = load_ratings()["questions"]
    questions = [q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]
                 if not q.get("repeat_of") and not q.get("hidden") and not current(q, rated)]
    items = WORK / "items"
    items.mkdir(parents=True, exist_ok=True)
    for old in items.glob("*.txt"):
        old.unlink()
    index = {}
    for start in range(0, len(questions), QUESTIONS_PER_CALL):
        chunk = questions[start:start + QUESTIONS_PER_CALL]
        name = f"questions-{start // QUESTIONS_PER_CALL + 1:03d}"
        lines = [line for n, q in enumerate(chunk, 1) for line in question_lines(n, q)]
        (items / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
        index[name] = [[q["id"], fingerprint(q)] for q in chunk]
    (WORK / "items-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")
    (WORK / "task.txt").write_text(TASK, encoding="utf-8", newline="\n")
    (WORK / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    print(f"questions shown and not yet rated: {len(questions)}; wrote {len(index)} BatchRunner items to {items}")


# --- apply -----------------------------------------------------------------------------------------------------------

def apply(out_dir: Path) -> None:
    index = json.loads((WORK / "items-index.json").read_text(encoding="utf-8"))
    data = load_ratings()
    added, missing = 0, []
    for name, entries in index.items():
        answer_file = out_dir / f"{name}.json"
        if not answer_file.exists():
            missing.append(name)
            continue
        reply = json.loads(answer_file.read_text(encoding="utf-8"))
        by_number = {r["q"]: r for r in (reply.get("structured_output") or {}).get("ratings") or []}
        for n, (qid, of) in enumerate(entries, 1):
            rating = by_number.get(f"q{n}")
            if rating is None or rating["level"] not in LEVELS:
                missing.append(f"{name}:q{n}")
                continue
            data["questions"][qid] = {"level": rating["level"], "children": bool(rating["children"]), "of": of,
                                      "by": MODEL}
            added += 1
    data["questions"] = dict(sorted(data["questions"].items()))
    RATINGS.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"recorded ratings for {added} questions; still unrated: {len(missing)} {missing[:10]}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("prepare")
    apply_parser = sub.add_parser("apply")
    apply_parser.add_argument("out_dir", type=Path)
    args = parser.parse_args()
    if args.command == "prepare":
        prepare()
    else:
        apply(args.out_dir.resolve())


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
