"""Answer choices for the Question Bank's written-answer questions, so every question the site shows can be asked as
multiple choice (owner, 2026-10-22).

Which questions: shown (not a repeat) and without choices of their own. Each gets four choices:
  - a true-or-false answer gets "True" and "False", by rule;
  - every other question gets three wrong choices from Claude Haiku, 40 questions to a call through BatchRunner. The
    right choice is the answer as printed when it is LONG_ANSWER_WORDS words or fewer; a longer answer (mostly
    catechism) is shown as Haiku's short, faithful version, and the full printed answer still follows it on the page.
Every set is checked here before it is kept: three distinct wrong choices, none the same as the right one, and no "all
of the above". Choices are kept in content/questions/checks/choices.json by question id, never mixed into the sources.

Two-part questions (owner: "I like two-part questions"). A question the builder marks as leaning on the one before it
("What were their names?") is sent with up to EARLIER questions before it in its book. Haiku says whether it truly
needs the earlier one: if so it keeps `lead_in` (the question just before, with its printed answer), which the page
shows first; if not, it is marked as standing alone after all.

A right choice that is plainly the longest gives itself away. After the first run it was the longest in 66% of the
catechism questions (25% would be chance), so `rebalance` sends those again with their right choice fixed, asking only
for wrong choices of the same length.

    python scripts/question_choices.py prepare           # write BatchRunner items for questions still without choices
    python scripts/question_choices.py rebalance         # write items re-asking wrong choices where the right is longest
    python scripts/question_choices.py apply <out-dir>   # check and record BatchRunner's choices
    (then python scripts/build-question-bank.py)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
import sys
from pathlib import Path

WEBSITE = Path(__file__).resolve().parent.parent
BANK = WEBSITE / "content" / "questions" / "bank" / "question-bank.json"
TAGS = WEBSITE / "content" / "questions" / "checks" / "model-tags.json"
CHOICES = WEBSITE / "content" / "questions" / "checks" / "choices.json"
WORK = WEBSITE / ".local" / "question-choices"
KEEP_RIGHT = WORK / "keep-right.json"  # the right choice of each question being rebalanced

QUESTIONS_PER_CALL = 40
EARLIER = 2
LONG_ANSWER_WORDS = 12
SHORT_ANSWER_MAX_WORDS = 20
SHORT_ANSWER_ACCEPT_WORDS = 25  # asked for 20; a few words over still reads as a choice
TRUE_FALSE = re.compile(r"^\s*(true|false)\b", re.IGNORECASE)
FILLER = re.compile(r"\b(all|none|both) of the (above|these)\b", re.IGNORECASE)

TASK = f"""You write answer choices for Bible quiz and catechism questions, so each can be asked as multiple choice.

For every question in the input:
- "right": the right answer as a choice. When the answer given has {LONG_ANSWER_WORDS} words or fewer, copy it exactly.
  When it is longer, write a short version of it ({SHORT_ANSWER_MAX_WORDS} words at most) that keeps its meaning and its
  key words, so that someone who knows the full answer recognises it at once.
- "wrong": three wrong choices. Each must be clearly wrong by the Bible's account (or, for a catechism question, by the
  historic Protestant teaching the catechism gives), yet believable to someone who half-remembers: other people, places
  or numbers from the same story or the same part of the Bible; for a teaching question, a near-miss in the same words
  and form. Match the right choice's form and length, so length gives nothing away. Never "all of the above", "none of
  the above", a joke, or a choice that is also right.
- When the input gives a "Right choice", copy it exactly as "right", and give each wrong choice about as many words as
  it (within two words either way), so the right one is not the longest.
- "needs_earlier": when the input lists earlier questions, true if the question cannot be understood without the one
  just before it ("What were their names?", "Which is the Seventh?", "Who led them astray?"), false if it reads
  clearly on its own. The choices must fit the earlier question too. Without earlier questions, always false.
"q" is the question's number as written (q1, q2, ...). If the input holds no questions, return an empty list."""

SCHEMA = {"type": "object", "properties": {"choices": {"type": "array", "items": {
    "type": "object", "properties": {
        "q": {"type": "string"},
        "right": {"type": "string"},
        "wrong": {"type": "array", "items": {"type": "string"}},
        "needs_earlier": {"type": "boolean"}},
    "required": ["q", "right", "wrong", "needs_earlier"], "additionalProperties": False}}},
    "required": ["choices"], "additionalProperties": False}


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def word_count(text: str) -> int:
    return len(re.findall(r"\w+", text))


def load_choices() -> dict:
    if CHOICES.exists():
        return json.loads(CHOICES.read_text(encoding="utf-8"))
    return {"about": "Answer choices for the Question Bank's written-answer questions; written by "
                     "scripts/question_choices.py.", "questions": {}}


def save_choices(data: dict) -> None:
    data["questions"] = dict(sorted(data["questions"].items()))
    CHOICES.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")


def shuffled(qid: str, options: list[str]) -> list[str]:
    """The same order on every rebuild, different from question to question."""
    order = list(options)
    random.Random(hashlib.sha256(qid.encode()).hexdigest()).shuffle(order)
    return order


# --- used by build-question-bank.py --------------------------------------------------------------------------------

def add_choices(questions: list[dict]) -> int:
    """Give every question its `answer_choice` (the option that is right, or null without options) and `options_by`;
    fill in the recorded choices for written-answer questions. Return how many got choices here."""
    recorded = load_choices()["questions"]
    added = 0
    for q in questions:
        if q["options"]:
            q["answer_choice"], q["options_by"] = q["answer"], q.get("options_by") or "source"
        elif q["id"] in recorded:
            record = recorded[q["id"]]
            q["options"], q["answer_choice"], q["options_by"] = record["options"], record["answer_choice"], record["by"]
            if record.get("stands_alone"):
                q["standalone"] = True
            added += 1
        else:
            q["answer_choice"], q["options_by"] = None, None
        q["lead_in"] = recorded.get(q["id"], {}).get("lead_in")
    return added


# --- prepare ---------------------------------------------------------------------------------------------------------

def wanted(q: dict) -> bool:
    return not q.get("repeat_of") and not q.get("hidden") and not q["options"]


def earlier_of(q: dict, by_id: dict) -> list[dict]:
    """Up to EARLIER questions just before this one in its book (ids end in their place: "...:pg29067:9"), oldest
    first; none for a question that stands alone."""
    if q["standalone"]:
        return []
    stem, _, place = q["id"].rpartition(":")
    found = [by_id.get(f"{stem}:{int(place) - back}") for back in range(EARLIER, 0, -1)] if place.isdigit() else []
    return [e for e in found if e]


def true_false_choices(q: dict) -> dict:
    right = TRUE_FALSE.match(q["answer"]).group(1).capitalize()
    return {"options": ["True", "False"], "answer_choice": right, "by": "true/false"}


def prepare() -> None:
    data = load_choices()
    tags = json.loads(TAGS.read_text(encoding="utf-8"))["questions"] if TAGS.exists() else {}
    todo = [q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]
            if wanted(q) and q["id"] not in data["questions"]]
    model = []
    for q in todo:
        if TRUE_FALSE.match(q["answer"]):
            data["questions"][q["id"]] = true_false_choices(q)
        else:
            model.append(q)
    save_choices(data)
    KEEP_RIGHT.unlink(missing_ok=True)
    write_items(model, tags, {})


def gives_itself_away(record: dict) -> bool:
    right = record["answer_choice"]
    return len(right) > 1.15 * max(len(o) for o in record["options"] if o != right)


def rebalance() -> None:
    by_id = {q["id"]: q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]}
    recorded = load_choices()["questions"]
    todo = [by_id[qid] for qid, r in recorded.items()
            if r["by"] == "claude-haiku" and qid in by_id and by_id[qid]["kind"] == "catechism" and gives_itself_away(r)]
    tags = json.loads(TAGS.read_text(encoding="utf-8"))["questions"] if TAGS.exists() else {}
    keep = {q["id"]: recorded[q["id"]]["answer_choice"] for q in todo}
    KEEP_RIGHT.write_text(json.dumps(keep, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
    write_items(todo, tags, keep)
    print(f"catechism questions whose right choice is longest by more than 15%: {len(todo)}")


def write_items(model: list[dict], tags: dict, keep: dict) -> None:
    by_id = {q["id"]: q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]}
    items = WORK / "items"
    items.mkdir(parents=True, exist_ok=True)
    for old in items.glob("*.txt"):
        old.unlink()
    index = {}
    for start in range(0, len(model), QUESTIONS_PER_CALL):
        chunk = model[start:start + QUESTIONS_PER_CALL]
        name = f"questions-{start // QUESTIONS_PER_CALL + 1:03d}"
        lines = []
        for n, q in enumerate(chunk, 1):
            lines.append(f"q{n} ({q['kind']})")
            earlier = earlier_of(q, by_id)
            if earlier and q.get("lesson"):
                lines.append(f"  Lesson: {q['lesson']}")
            for e in earlier:
                lines.append(f"  Earlier question: {e['question']} Answer: {e['answer']}")
            lines += [f"  Question: {q['question']}", f"  Answer: {q['answer']}"]
            if q["id"] in keep:
                lines.append(f"  Right choice: {keep[q['id']]}")
            passages = tags.get(q["id"], {}).get("passages", [])
            if passages:
                lines.append("  Passage: " + "; ".join(f"{p['book']} {p['chapter']}" for p in passages))
            lines.append("")
        (items / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
        index[name] = [q["id"] for q in chunk]
    (WORK / "items-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")
    (WORK / "task.txt").write_text(TASK, encoding="utf-8", newline="\n")
    (WORK / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    print(f"wrote {len(model)} questions in {len(index)} BatchRunner items")


# --- apply -----------------------------------------------------------------------------------------------------------

def checked(q: dict, reply: dict, kept_right: str | None, by_id: dict) -> tuple[dict | None, str]:
    """The four choices (with the lead-in of a two-part question), or None and why they were refused."""
    long_answer = word_count(q["answer"]) > LONG_ANSWER_WORDS
    right = kept_right or (reply["right"].strip() if long_answer else q["answer"].strip())
    wrong = [w.strip() for w in reply["wrong"]]
    if not right or (long_answer and word_count(right) > SHORT_ANSWER_ACCEPT_WORDS):
        return None, "short version missing or too long"
    if len(wrong) != 3 or not all(wrong):
        return None, "not three wrong choices"
    seen = {norm(right), norm(q["answer"])}
    for w in wrong:
        if norm(w) in seen or FILLER.search(w):
            return None, "a wrong choice repeats the right one, another choice, or is filler"
        seen.add(norm(w))
    record = {"options": shuffled(q["id"], [right, *wrong]), "answer_choice": right, "by": "claude-haiku"}
    earlier = earlier_of(q, by_id)
    if earlier and reply.get("needs_earlier"):
        record["lead_in"] = {"question": earlier[-1]["question"], "answer": earlier[-1]["answer"]}
    elif not q["standalone"]:
        record["stands_alone"] = True
    return record, ""


def apply(out_dir: Path) -> None:
    index = json.loads((WORK / "items-index.json").read_text(encoding="utf-8"))
    by_id = {q["id"]: q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]}
    data = load_choices()
    keep = json.loads(KEEP_RIGHT.read_text(encoding="utf-8")) if KEEP_RIGHT.exists() else {}
    added, missing, refused = 0, [], {}
    for name, ids in index.items():
        answer_file = out_dir / f"{name}.json"
        if not answer_file.exists():
            missing.append(name)
            continue
        reply = json.loads(answer_file.read_text(encoding="utf-8"))
        by_number = {c["q"]: c for c in (reply.get("structured_output") or {}).get("choices") or []}
        for n, qid in enumerate(ids, 1):
            if f"q{n}" not in by_number or qid not in by_id:
                missing.append(f"{name}:q{n}")
                continue
            record, why = checked(by_id[qid], by_number[f"q{n}"], keep.get(qid), by_id)
            if record is None:
                refused[why] = refused.get(why, 0) + 1
                continue
            data["questions"][qid] = record
            added += 1
    save_choices(data)
    print(f"recorded choices for {added} questions; refused {refused}; missing: {len(missing)} {missing[:10]}")
    print("refused or missing questions are sent again by the next prepare")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("prepare")
    sub.add_parser("rebalance")
    apply_parser = sub.add_parser("apply")
    apply_parser.add_argument("out_dir", type=Path)
    args = parser.parse_args()
    if args.command == "prepare":
        prepare()
    elif args.command == "rebalance":
        rebalance()
    else:
        apply(args.out_dir.resolve())


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
