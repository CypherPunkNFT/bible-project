"""An independent check of the model-written answer choices (question_choices.py): is any wrong choice also right?

The checker is a separate call with its own instructions, written to doubt (owner, 2026-10-22: "make the context one
that is different and wary of wrong so that it's a valid checker"). It is told the choices are known to hold mistakes,
is not told which choice is meant to be right, and judges each of the four on its own against the question and the
answer the source printed. A set fails when the checker finds a correct choice besides the intended one, or finds that
the intended one does not say what the source's answer says.

Results go into each record in content/questions/choices.json as "check"; nothing here changes the choices. Only a
108-set pilot ran (5 failed): question_audit.py (owner-approved 2026-10-22) now checks every shown question against the
BSB and makes the fixes, so the full run and a redo were dropped, and audited ids are skipped.

    python scripts/question_choice_check.py prepare           # write BatchRunner items for unchecked model-made sets
    python scripts/question_choice_check.py apply <out-dir>   # record the verdicts
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

from question_choices import load_choices, save_choices

WEBSITE = Path(__file__).resolve().parent.parent
BANK = WEBSITE / "content" / "questions" / "question-bank.json"
WORK = WEBSITE / ".local" / "question-choice-check"

QUESTIONS_PER_CALL = 50
# Audited line by line against the BSB by scripts/question_audit.py, whose fixes are tied to the current options: a
# check (or a redo) here would make them stale and put the old versions back (other chat's request, 2026-10-22).
AUDITED_ELSEWHERE = ("liaaron1-bible-trivia-alpaca:",)
AUDIT = WEBSITE / "content" / "questions" / "audit.json"  # since 2026-10-22 the audit covers every collection
LETTERS = "ABCD"

TASK = """You are a strict fact-checker for a Bible quiz. The answer choices below were written quickly by someone else
and are known to contain mistakes. Your job is to find them; do not assume any choice is right or wrong because of
where it sits or how it is worded.

Each question comes with the answer its source printed (a Bible quiz book, a Sunday school lesson, or a historic
Protestant catechism) and four choices, A to D. Judge every choice on its own: could a well-informed reader fairly
defend it as a correct answer to this question? Be especially wary of:
- the same person, place or thing under another name: Melita and Malta; Simon, Peter and Cephas; Saul and Paul; the
  Sea of Galilee, Lake of Gennesaret and Sea of Tiberias; Horeb and Sinai; old spellings and modern ones;
- another translation's wording, or another Gospel's account of the same event;
- numbers that can be counted another way, and a choice that is part of the right answer or contains it;
- for a catechism question, a choice that says the same teaching as the source's answer in other words.
If an earlier question is given, the question follows on from it.

Answer for every question:
- "q": its number as written (q1, q2, ...);
- "correct": the letters of every choice that is a correct answer, by the Bible's account or, for a catechism, by the
  source's answer (usually one letter; more when you find a second right choice);
- "source_choice": the letter of the choice that says what the source's printed answer says, or "" if none does;
- "note": when "correct" has more than one letter or "source_choice" is "", say why in one short sentence; else "".
If the input holds no questions, return an empty list."""

SCHEMA = {"type": "object", "properties": {"checks": {"type": "array", "items": {
    "type": "object", "properties": {
        "q": {"type": "string"},
        "correct": {"type": "array", "items": {"type": "string"}},
        "source_choice": {"type": "string"},
        "note": {"type": "string"}},
    "required": ["q", "correct", "source_choice", "note"], "additionalProperties": False}}},
    "required": ["checks"], "additionalProperties": False}


def to_check(records: dict) -> list[str]:
    """Model-made sets of four that have not been checked yet."""
    audited = json.loads(AUDIT.read_text(encoding="utf-8"))["questions"] if AUDIT.exists() else {}
    return [qid for qid, r in records.items() if r["by"].startswith("claude-haiku") and len(r["options"]) == 4
            and "check" not in r and not qid.startswith(AUDITED_ELSEWHERE) and qid not in audited]


def prepare() -> None:
    records = load_choices()["questions"]
    by_id = {q["id"]: q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]}
    ids = [qid for qid in to_check(records) if qid in by_id]
    items = WORK / "items"
    items.mkdir(parents=True, exist_ok=True)
    for old in items.glob("*.txt"):
        old.unlink()
    index = {}
    for start in range(0, len(ids), QUESTIONS_PER_CALL):
        chunk = ids[start:start + QUESTIONS_PER_CALL]
        name = f"checks-{start // QUESTIONS_PER_CALL + 1:03d}"
        lines = []
        for n, qid in enumerate(chunk, 1):
            q, record = by_id[qid], records[qid]
            lines.append(f"q{n} ({q['kind']})")
            if record.get("lead_in"):
                lines.append(f"  Earlier question: {record['lead_in']['question']} Answer: {record['lead_in']['answer']}")
            lines += [f"  Question: {q['question']}", f"  Source's answer: {q['answer']}"]
            lines += [f"  {letter}. {option}" for letter, option in zip(LETTERS, record["options"])]
            lines.append("")
        (items / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
        index[name] = chunk
    (WORK / "items-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")
    (WORK / "task.txt").write_text(TASK, encoding="utf-8", newline="\n")
    (WORK / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    print(f"unchecked model-made sets: {len(ids)}; wrote {len(index)} BatchRunner items")


def verdict(record: dict, reply: dict) -> dict:
    right = LETTERS[record["options"].index(record["answer_choice"])]
    letters = [c.strip().upper()[:1] for c in reply["correct"] if c.strip()]
    also_right = [record["options"][LETTERS.index(c)] for c in letters if c in LETTERS and c != right]
    source = reply["source_choice"].strip().upper()[:1]
    return {"also_right": also_right, "faithful": source == right, "note": reply["note"].strip(),
            "ok": not also_right and source == right}


def apply(out_dir: Path) -> None:
    index = json.loads((WORK / "items-index.json").read_text(encoding="utf-8"))
    data = load_choices()
    outcome, missing = Counter(), []
    for name, ids in index.items():
        answer_file = out_dir / f"{name}.json"
        if not answer_file.exists():
            missing.append(name)
            continue
        reply = json.loads(answer_file.read_text(encoding="utf-8"))
        by_number = {c["q"]: c for c in (reply.get("structured_output") or {}).get("checks") or []}
        for n, qid in enumerate(ids, 1):
            record = data["questions"].get(qid)
            if f"q{n}" not in by_number or record is None:
                missing.append(f"{name}:q{n}")
                continue
            record["check"] = verdict(record, by_number[f"q{n}"])
            check = record["check"]
            outcome["passed" if check["ok"] else "a wrong choice is also right" if check["also_right"]
                    else "right choice not faithful to the source"] += 1
    save_choices(data)
    print(f"checked: {dict(outcome)}; missing: {len(missing)} {missing[:10]}")


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
