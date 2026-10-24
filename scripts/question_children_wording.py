"""Children's wording for the questions the children's page asks (owner, 2026-10-24, of "Which king of Judah
demolished the bronze snake called Nehushtan that Moses had made?": "these are not for children").

The children's page asks Hurlbut's Bible Lessons for Boys and Girls (1903) and A Catechism for Young Children. The
check against the BSB (question_audit.py) reworded about half of Hurlbut's questions in the BSB's own grown-up words.
Claude Opus now writes each one again for a child of about 6 to 11: from the 1903 wording, the checked wording, the
reason it was changed and the BSB verses, so it stays as right as the checked one. Kept in
content/questions/children/children-wording.json by question id with a fingerprint of the checked wording; the build adds it to
the question as `child`, and the children's page asks that.

    python scripts/question_children_wording.py prepare           # BatchRunner items for questions not yet worded
    python scripts/question_children_wording.py apply <out-dir>   # record the wordings
    python scripts/question_children_wording.py check-prepare     # a second Opus call checks each wording by the BSB
    python scripts/question_children_wording.py check-apply <out-dir>
    (then python scripts/build-question-bank.py)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

from question_audit import load_audit
from question_choices import shuffled
from question_link_verse import candidate_verses
from question_model_tags import bible_book

WEBSITE = Path(__file__).resolve().parent.parent
BANK = WEBSITE / "content" / "questions" / "bank" / "question-bank.json"
WORDING = WEBSITE / "content" / "questions" / "children" / "children-wording.json"
WORK = WEBSITE / ".local" / "question-children-wording"

COLLECTIONS = ("Hurlbut's Bible Lessons for Boys and Girls (1903)", "A Catechism for Young Children")
QUESTIONS_PER_CALL = 15
VERSES_SHOWN = 8
AROUND = 3  # verses either side of each one, for the check
CHECK_VERSES = 30
MODEL = "claude-opus-5-5"

TASK = """You reword Bible quiz questions for children of about 6 to 11, asked by a parent or Sunday school teacher
sitting with the child, after reading the passage together.

Each question comes with its 1903 wording (from a children's Bible course or catechism), the wording after it was
checked against the Berean Standard Bible (BSB), the reason for any change, and the BSB verses. The checked wording
is correct but often in grown-up words. Write it again for a child:
- Short, plain words a 7-year-old knows. No verse numbers, no "According to", no rare words ("demolished",
  "iniquity", "covenant" only if the lesson is about it) and no hard names unless the person is who the story is
  about. Keep the names of the story's main people.
- It must stay right by the BSB verses given, as right as the checked wording: keep whatever the check fixed (if the
  1903 question had two right answers, do not bring that back). Never add a fact the verses do not give.
- The answer short, a few words. Three wrong choices a child can tell apart, plainly wrong by the verses, the same
  kind of thing as the answer and about as long. None may also be right.
- Nothing frightening or grown-up made the point of the question; a hard story told gently, as a children's Bible
  would.
- If the question is already right for a child, you may keep it as it is.
"q" is the question's number as written (q1, q2, ...). Answer every question."""

CHECK_TASK = """You check Bible quiz questions written for children of about 6 to 11 against the Berean Standard Bible
(BSB) verses given with each: the verses it was written from and the ones around them. For each question decide:
- "keep": the answer is right by the verses, no wrong choice is also right, nothing is added that the verses do not
  give, and the words suit a child.
- "fix": anything of that is not so. Then give the whole question again, fixed, in a child's words, and say what
  was wrong in "why".
Judge by the verses given, not by what children's Bibles usually say. A plain fact of the same story that the
verses around show (who the child in the story is, where it happens) is fine; never make a question vaguer, or drop
a name, only because a verse given does not repeat it. "q" is the question's number as written."""

CHECK_SCHEMA = {"type": "object", "properties": {"checks": {"type": "array", "items": {
    "type": "object", "properties": {
        "q": {"type": "string"}, "verdict": {"type": "string", "enum": ["keep", "fix"]}, "why": {"type": "string"},
        "question": {"type": "string"}, "answer": {"type": "string"},
        "wrong": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 3}},
    "required": ["q", "verdict", "why", "question", "answer", "wrong"], "additionalProperties": False}}},
    "required": ["checks"], "additionalProperties": False}
CHECK_WORK = WEBSITE / ".local" / "question-children-check"

SCHEMA = {"type": "object", "properties": {"questions": {"type": "array", "items": {
    "type": "object", "properties": {
        "q": {"type": "string"}, "question": {"type": "string"}, "answer": {"type": "string"},
        "wrong": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 3}},
    "required": ["q", "question", "answer", "wrong"], "additionalProperties": False}}},
    "required": ["questions"], "additionalProperties": False}


def load_wording() -> dict:
    if WORDING.exists():
        return json.loads(WORDING.read_text(encoding="utf-8"))
    return {"about": "The children's page's wording of each question, written by Claude Opus from the 1903 and checked "
                     "wordings and the BSB; written by scripts/question_children_wording.py.", "questions": {}}


def fingerprint(q: dict) -> str:
    text = json.dumps([q["question"], q["answer"], q.get("answer_choice"), q["options"]], ensure_ascii=False)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


# --- used by build-question-bank.py --------------------------------------------------------------------------------

def add_children_wording(questions: list[dict]) -> int:
    """Give each question its children's wording as `child` (None when it has none); return how many have one."""
    worded = load_wording()["questions"]
    for q in questions:
        record = worded.get(q["id"])
        q["child"] = None
        if record and record["of"] == fingerprint(q):
            q["child"] = {"question": record["question"], "answer": record["answer"],
                          "options": shuffled(q["id"], [record["answer"], *record["wrong"]])}
    return sum(1 for q in questions if q["child"])


# --- prepare and apply -----------------------------------------------------------------------------------------------

def label_of(q: str) -> str:
    """"q3" for a reply that numbers the question "q3", "3" or "Q3"."""
    digits = re.search(r"\d+", q)
    return f"q{digits.group()}" if digits else q


def item_lines(n: int, q: dict, audit: dict) -> list[str]:
    record = audit.get(q["id"]) or {}
    before = record.get("before")
    lines = [f"q{n}", f"  Lesson: {q.get('lesson') or q['collection']}"]
    if before and (before["question"] != q["question"] or before["right"] != (q.get("answer_choice") or q["answer"])):
        lines += [f"  1903 question: {before['question']}", f"  1903 answer: {before['right']}"]
        if record.get("why"):
            lines.append(f"  Why it was changed: {record['why']}")
    lines += [f"  Checked question: {q['question']}", f"  Checked answer: {q.get('answer_choice') or q['answer']}",
              f"  Checked choices: {' | '.join(q['options'] or [])}"]
    verses = list(candidate_verses(q).items())[:VERSES_SHOWN]
    if verses:
        lines.append("  BSB verses:")
        lines += [f"    {label} {bible_book(book)[(chapter, verse)]}" for label, (book, chapter, verse) in verses]
    return lines + [""]


def prepare() -> None:
    worded, audit = load_wording()["questions"], load_audit()["questions"]
    questions = [q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]
                 if q["collection"] in COLLECTIONS and not q.get("repeat_of") and not q.get("hidden")
                 and not (worded.get(q["id"]) and worded[q["id"]]["of"] == fingerprint(q))]
    items = WORK / "items"
    items.mkdir(parents=True, exist_ok=True)
    for old in items.glob("*.txt"):
        old.unlink()
    index = {}
    for start in range(0, len(questions), QUESTIONS_PER_CALL):
        chunk = questions[start:start + QUESTIONS_PER_CALL]
        name = f"questions-{start // QUESTIONS_PER_CALL + 1:03d}"
        lines = [line for n, q in enumerate(chunk, 1) for line in item_lines(n, q, audit)]
        (items / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
        index[name] = [[q["id"], fingerprint(q)] for q in chunk]
    (WORK / "items-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")
    (WORK / "task.txt").write_text(TASK, encoding="utf-8", newline="\n")
    (WORK / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    print(f"children's questions to word: {len(questions)}; wrote {len(index)} BatchRunner items to {items}")


def apply(out_dir: Path) -> None:
    index = json.loads((WORK / "items-index.json").read_text(encoding="utf-8"))
    data = load_wording()
    added, missing = 0, []
    for name, entries in index.items():
        answer_file = out_dir / f"{name}.json"
        if not answer_file.exists():
            missing.append(name)
            continue
        reply = json.loads(answer_file.read_text(encoding="utf-8"))
        by_number = {label_of(r["q"]): r for r in (reply.get("structured_output") or {}).get("questions") or []}
        for n, (qid, of) in enumerate(entries, 1):
            r = by_number.get(f"q{n}")
            wrong = [w.strip() for w in (r or {}).get("wrong", [])]
            if r is None or len(set(wrong)) != 3 or r["answer"].strip() in wrong:
                missing.append(f"{name}:q{n}")
                continue
            data["questions"][qid] = {"question": r["question"].strip(), "answer": r["answer"].strip(), "wrong": wrong,
                                      "of": of, "by": MODEL}
            added += 1
    data["questions"] = dict(sorted(data["questions"].items()))
    WORDING.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"recorded {added} children's wordings; not recorded: {len(missing)} {missing[:10]}")


def verses_around(q: dict) -> list[tuple[str, str]]:
    """The question's verses with AROUND verses either side, in Bible order, at most CHECK_VERSES."""
    keys: dict[tuple[str, int, int], None] = {}
    for book, chapter, verse in list(candidate_verses(q).values())[:VERSES_SHOWN]:
        verses = bible_book(book)
        for near in range(verse - AROUND, verse + AROUND + 1):
            if (chapter, near) in verses:
                keys[(book, chapter, near)] = None
    return [(f"{book} {chapter}:{verse}", bible_book(book)[(chapter, verse)]) for book, chapter, verse in list(keys)[:CHECK_VERSES]]


def check_prepare() -> None:
    worded = load_wording()["questions"]
    questions = [q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]
                 if (record := worded.get(q["id"])) and record["of"] == fingerprint(q) and not record.get("checked")]
    items = CHECK_WORK / "items"
    items.mkdir(parents=True, exist_ok=True)
    for old in items.glob("*.txt"):
        old.unlink()
    index = {}
    for start in range(0, len(questions), QUESTIONS_PER_CALL):
        chunk = questions[start:start + QUESTIONS_PER_CALL]
        name = f"questions-{start // QUESTIONS_PER_CALL + 1:03d}"
        lines = []
        for n, q in enumerate(chunk, 1):
            record = worded[q["id"]]
            lines += [f"q{n}", f"  Question: {record['question']}", f"  Answer: {record['answer']}",
                      f"  Wrong choices: {' | '.join(record['wrong'])}", "  BSB verses:"]
            lines += [f"    {label} {text}" for label, text in verses_around(q)]
            lines.append("")
        (items / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
        index[name] = [q["id"] for q in chunk]
    (CHECK_WORK / "items-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")
    (CHECK_WORK / "task.txt").write_text(CHECK_TASK, encoding="utf-8", newline="\n")
    (CHECK_WORK / "schema.json").write_text(json.dumps(CHECK_SCHEMA), encoding="utf-8", newline="\n")
    print(f"children's wordings to check: {len(questions)}; wrote {len(index)} BatchRunner items to {items}")


def check_apply(out_dir: Path) -> None:
    index = json.loads((CHECK_WORK / "items-index.json").read_text(encoding="utf-8"))
    data = load_wording()
    counts, missing = {"keep": 0, "fix": 0}, []
    for name, ids in index.items():
        answer_file = out_dir / f"{name}.json"
        if not answer_file.exists():
            missing.append(name)
            continue
        reply = json.loads(answer_file.read_text(encoding="utf-8"))
        by_number = {label_of(c["q"]): c for c in (reply.get("structured_output") or {}).get("checks") or []}
        for n, qid in enumerate(ids, 1):
            c, record = by_number.get(f"q{n}"), data["questions"].get(qid)
            wrong = [w.strip() for w in (c or {}).get("wrong", [])]
            if c is None or record is None or (c["verdict"] == "fix" and (len(set(wrong)) != 3 or c["answer"].strip() in wrong)):
                missing.append(f"{name}:q{n}")
                continue
            if c["verdict"] == "fix":
                record.update(question=c["question"].strip(), answer=c["answer"].strip(), wrong=wrong, fixed=c["why"])
            record["checked"] = MODEL
            counts[c["verdict"]] += 1
    WORDING.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"checked {counts}; not recorded: {len(missing)} {missing[:10]}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("prepare")
    apply_parser = sub.add_parser("apply")
    apply_parser.add_argument("out_dir", type=Path)
    sub.add_parser("check-prepare")
    check_parser = sub.add_parser("check-apply")
    check_parser.add_argument("out_dir", type=Path)
    args = parser.parse_args()
    if args.command == "prepare":
        prepare()
    elif args.command == "apply":
        apply(args.out_dir.resolve())
    elif args.command == "check-prepare":
        check_prepare()
    else:
        check_apply(args.out_dir.resolve())


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
