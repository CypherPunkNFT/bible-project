"""The children's sources (content/questions/children/children-batch4.json, 7,326 questions from seven children's
books and lessons) made ready for the site: the BSB's facts and words, a child's words, four choices.

They were written for children, but most come from books of 1864 to 1907 in King James wording, and many lean on
the question before them ("What did they say?"). The BSB check alone would have put them in the BSB's grown-up words,
as it did Hurlbut's (owner, 2026-10-24: "these are not for children"), so one call does both: Claude Opus rewrites
each question to agree with the BSB verses, in a child's words, standing on its own, with three wrong choices; a
second Opus call checks each against the BSB verses of its reference and those around them. A question no fair Bible
question can be made from is dropped with the reason, never deleted. Kept in
content/questions/children/children-batch4-wording.json by question id, with a fingerprint of the source's wording.

    python scripts/question_children_sources.py prepare             # BatchRunner items for questions not yet written
    python scripts/question_children_sources.py apply <out-dir>     # record the rewrites
    python scripts/question_children_sources.py check-prepare       # a second Opus call checks each by the BSB
    python scripts/question_children_sources.py check-apply <out-dir>
    python scripts/question_children_sources.py rebalance-prepare   # where the right choice is plainly the longest
    python scripts/question_children_sources.py rebalance-apply <out-dir>   # then check-prepare and check-apply again
    python scripts/question_children_sources.py publish             # audit and tag records, so the build takes them in
    (then python scripts/build-question-bank.py, and the repeat check, grounding and difficulty for the new ones)
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

from question_audit import AUDIT, load_audit, parse_spans, save_json
from question_children_wording import label_of, verses_around
from question_choices import FILLER, norm, shuffled, word_count
from question_link_verse import candidate_verses
from question_model_tags import bible_book, check_passage, load_tags, save_tags
from question_writing_gate import KING_JAMES

WEBSITE = Path(__file__).resolve().parent.parent
SOURCES = WEBSITE / "content" / "questions" / "children" / "children-batch4.json"
WORDING = WEBSITE / "content" / "questions" / "children" / "children-batch4-wording.json"
WORK = WEBSITE / ".local" / "question-children-sources"
CHECK_WORK = WEBSITE / ".local" / "question-children-sources-check"

QUESTIONS_PER_CALL = 15
VERSES_SHOWN = 8
BEFORE = 2  # questions of the same lesson shown before the first of a call, for what it leans on
MODEL = "claude-opus-5-5"

TASK = """You make old children's Bible questions ready for a children's Bible website, for children of about 6 to 11,
asked by a parent or Sunday school teacher after reading the passage together. The site uses the Berean Standard
Bible (BSB).

Each question comes from a children's question book, catechism or Sunday school lesson, many from 1864 to 1907 in
King James wording, with its printed answer and the BSB verses it is about. For each one:
- Agree with the BSB verses given: the facts, any words quoted, and names as the BSB spells them. No King James
  wording (thee, thou, hath, unto, -eth, "Holy Ghost"). Never add a fact the verses do not give.
- In a child's words: short, plain words a 7-year-old knows. Keep the names of the story's main people.
- Standing on its own: the child may get this question alone, so name who or what it is about ("What did the king's
  soldiers say to Elijah?", never "What did they say?"). The questions asked just before it are shown for this.
- The answer short, a few words. Three wrong choices a child can tell apart, plainly wrong by the verses, the same
  kind of thing as the answer and about as long. None may also be right; no "all of the above".
- A yes-or-no question becomes one with four choices ("What did the wind and waves do when Jesus spoke?").
- A catechism question keeps the catechism's teaching, said simply, and only what Scripture teaches.
- Bloodshed or anything grown-up is never the point of the question; a hard story is told gently, as a children's
  Bible would. The Bible's teaching on sin, judgment and hell is kept, said plainly and gently, never dropped for
  being serious.
- "reference": the BSB verse or verses that hold the answer ("Mark 4:39" or "Mark 4:39-41"), from those given when
  they hold it. When they do not, but another passage of the Bible does (Matthew 12:12 for doing good on the
  Sabbath), give that passage.
- Change only what these rules need: a question already right for a child stays as it is.
- Set "use" to false only when no fair Bible question can be made from it (it asks about the child's own life, is a
  teacher's direction or a discussion prompt, or rests on something no passage of the Bible says), and say why in
  "why". Otherwise "why" says in a few words what you changed, or "kept".
"q" is the question's number as written (q1, q2, ...). Answer every question."""

SCHEMA = {"type": "object", "properties": {"questions": {"type": "array", "items": {
    "type": "object", "properties": {
        "q": {"type": "string"}, "use": {"type": "boolean"}, "why": {"type": "string"},
        "question": {"type": "string"}, "answer": {"type": "string"},
        "wrong": {"type": "array", "items": {"type": "string"}, "maxItems": 3}, "reference": {"type": "string"}},
    "required": ["q", "use", "why", "question", "answer", "wrong", "reference"], "additionalProperties": False}}},
    "required": ["questions"], "additionalProperties": False}

CHECK_TASK = """You check Bible quiz questions written for children of about 6 to 11 against the Berean Standard Bible
(BSB) verses given with each: the verses of its reference and the ones around them. For each question decide:
- "keep": the answer is right by the verses, no wrong choice is also right, nothing is added that the verses do not
  give, the question names whom or what it is about, the words suit a child, and there is no King James wording.
- "fix": anything of that is not so. Then give the whole question again, fixed, in a child's words, with its
  reference, and say what was wrong in "why".
A catechism question may teach what the verses teach together without one verse saying it outright. A plain fact of
the same story that the verses around show is fine; never make a question vaguer, or drop a name, only because a
verse given does not repeat it. "q" is the question's number as written."""

CHECK_SCHEMA = {"type": "object", "properties": {"checks": {"type": "array", "items": {
    "type": "object", "properties": {
        "q": {"type": "string"}, "verdict": {"type": "string", "enum": ["keep", "fix"]}, "why": {"type": "string"},
        "question": {"type": "string"}, "answer": {"type": "string"},
        "wrong": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 3},
        "reference": {"type": "string"}},
    "required": ["q", "verdict", "why", "question", "answer", "wrong", "reference"], "additionalProperties": False}}},
    "required": ["checks"], "additionalProperties": False}


def load_sources() -> list[dict]:
    return json.loads(SOURCES.read_text(encoding="utf-8"))["questions"]


def load_wording() -> dict:
    if WORDING.exists():
        return json.loads(WORDING.read_text(encoding="utf-8"))
    return {"about": "The children's sources rewritten for the site by Claude Opus: the BSB's facts and words, a child's "
                     "words, standing alone, four choices, then checked by a second Opus call against the BSB; written "
                     "by scripts/question_children_sources.py.", "questions": {}}


def save_wording(data: dict) -> None:
    data["questions"] = dict(sorted(data["questions"].items()))
    WORDING.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")


def fingerprint(q: dict) -> str:
    text = json.dumps([q["question"], q["answer"]], ensure_ascii=False)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def reply_fault(r: dict) -> str | None:
    """Why a rewrite cannot be kept as it is, or None."""
    wrong = [w.strip() for w in r["wrong"]]
    if not r["question"].strip() or not r["answer"].strip():
        return "no question or answer"
    if len(wrong) != 3 or len({norm(w) for w in wrong}) != 3 or norm(r["answer"]) in {norm(w) for w in wrong}:
        return "not three distinct wrong choices"
    if any(FILLER.search(text) for text in [r["answer"], *wrong]):
        return "an all-of-the-above choice"
    if KING_JAMES.search(" ".join([r["question"], r["answer"], *wrong])):
        return "King James wording"
    if not parse_spans(r["reference"]):
        return f"a reference that cannot be read: {r['reference']!r}"
    return None


def write_items(work: Path, task: str, schema: dict, chunks: dict[str, list[str]], index: dict) -> None:
    items = work / "items"
    items.mkdir(parents=True, exist_ok=True)
    for old in items.glob("*.txt"):
        old.unlink()
    for name, lines in chunks.items():
        (items / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
    (work / "items-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")
    (work / "task.txt").write_text(task, encoding="utf-8", newline="\n")
    (work / "schema.json").write_text(json.dumps(schema), encoding="utf-8", newline="\n")
    print(f"wrote {len(index)} BatchRunner items to {items}")


# --- prepare and apply -----------------------------------------------------------------------------------------------

def item_lines(n: int, q: dict) -> list[str]:
    lines = [f"q{n}", f"  Source: {q['collection']}, {q.get('lesson') or ''}".rstrip(", "),
             f"  Question: {q['question']}", f"  Printed answer: {q['answer']}"]
    if q.get("reference"):
        lines.append(f"  Printed reference: {q['reference']}")
    verses = list(candidate_verses(q).items())[:VERSES_SHOWN]
    if verses:
        lines.append("  BSB verses:")
        lines += [f"    {label} {bible_book(book)[(chapter, verse)]}" for label, (book, chapter, verse) in verses]
    return lines + [""]


def prepare(limit: int | None) -> None:
    worded = load_wording()["questions"]
    sources = load_sources()
    position = {q["id"]: i for i, q in enumerate(sources)}
    todo = [q for q in sources if not (worded.get(q["id"]) and worded[q["id"]]["of"] == fingerprint(q))][:limit]
    chunks, index = {}, {}
    for start in range(0, len(todo), QUESTIONS_PER_CALL):
        chunk = todo[start:start + QUESTIONS_PER_CALL]
        name = f"questions-{start // QUESTIONS_PER_CALL + 1:04d}"
        first = position[chunk[0]["id"]]
        before = [p for p in sources[max(0, first - BEFORE):first]
                  if p["collection"] == chunk[0]["collection"] and p.get("lesson") == chunk[0].get("lesson")]
        lines = ["Asked just before, in the same lesson (for context only):"] if before else []
        lines += [f"  {p['question']} {p['answer']}" for p in before] + ([""] if before else [])
        lines += [line for n, q in enumerate(chunk, 1) for line in item_lines(n, q)]
        chunks[name] = lines
        index[name] = [[q["id"], fingerprint(q)] for q in chunk]
    print(f"children's source questions to write: {len(todo)}")
    write_items(WORK, TASK, SCHEMA, chunks, index)


def apply(out_dir: Path) -> None:
    index = json.loads((WORK / "items-index.json").read_text(encoding="utf-8"))
    data = load_wording()
    counts, missing = {"use": 0, "dropped": 0}, []
    for name, entries in index.items():
        answer_file = out_dir / f"{name}.json"
        if not answer_file.exists():
            missing.append(name)
            continue
        reply = json.loads(answer_file.read_text(encoding="utf-8"))
        by_number = {label_of(r["q"]): r for r in (reply.get("structured_output") or {}).get("questions") or []}
        for n, (qid, of) in enumerate(entries, 1):
            r = by_number.get(f"q{n}")
            if r is None:
                missing.append(f"{name}:q{n}")
                continue
            if not r["use"]:
                data["questions"][qid] = {"dropped": r["why"].strip(), "of": of, "by": MODEL}
                counts["dropped"] += 1
                continue
            fault = reply_fault(r)
            if fault:
                missing.append(f"{name}:q{n} ({fault})")
                continue
            data["questions"][qid] = {"question": r["question"].strip(), "answer": r["answer"].strip(),
                                      "wrong": [w.strip() for w in r["wrong"]], "reference": r["reference"].strip(),
                                      "why": r["why"].strip(), "of": of, "by": MODEL}
            counts["use"] += 1
    save_wording(data)
    print(f"recorded {counts}; not recorded: {len(missing)} {missing[:10]}")


# --- the check -------------------------------------------------------------------------------------------------------

def check_prepare(limit: int | None) -> None:
    worded = load_wording()["questions"]
    todo = [q for q in load_sources()
            if (record := worded.get(q["id"])) and record["of"] == fingerprint(q)
            and not record.get("dropped") and not record.get("checked")][:limit]
    chunks, index = {}, {}
    for start in range(0, len(todo), QUESTIONS_PER_CALL):
        chunk = todo[start:start + QUESTIONS_PER_CALL]
        name = f"questions-{start // QUESTIONS_PER_CALL + 1:04d}"
        chunks[name] = [line for n, q in enumerate(chunk, 1) for line in check_lines(n, q, worded[q["id"]])]
        index[name] = [q["id"] for q in chunk]
    print(f"children's source questions to check: {len(todo)}")
    write_items(CHECK_WORK, CHECK_TASK, CHECK_SCHEMA, chunks, index)


def check_lines(n: int, q: dict, record: dict) -> list[str]:
    """A question as it now reads, with the BSB verses of its reference and those around them."""
    lines = [f"q{n}", f"  Question: {record['question']}", f"  Answer: {record['answer']}",
             f"  Wrong choices: {' | '.join(record['wrong'])}", f"  Reference: {record['reference']}", "  BSB verses:"]
    lines += [f"    {label} {text}" for label, text in verses_around({**q, "reference": record["reference"]})]
    return lines + [""]


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
            if c is None or record is None:
                missing.append(f"{name}:q{n}")
                continue
            if c["verdict"] == "fix":
                fault = reply_fault(c)
                if fault:
                    missing.append(f"{name}:q{n} ({fault})")
                    continue
                record.update(question=c["question"].strip(), answer=c["answer"].strip(),
                              wrong=[w.strip() for w in c["wrong"]], reference=c["reference"].strip(), fixed=c["why"])
            record["checked"] = MODEL
            counts[c["verdict"]] += 1
    save_wording(data)
    print(f"checked {counts}; not recorded: {len(missing)} {missing[:10]}")


# --- the right choice must not be plainly the longest ----------------------------------------------------------------

REBALANCE_WORK = WEBSITE / ".local" / "question-children-sources-rebalance"
REBALANCE_TASK = """You fix answer choices of Bible quiz questions for children of about 6 to 11. In each question
below the right answer is longer than every wrong choice, so a child could guess it by its length alone.

For each question give the right answer and three wrong choices that are all about as long as one another (within
two words), so length gives nothing away:
- You may say the right answer in fewer words, if it stays right by the BSB verses given and suits a child.
- Write longer wrong choices where needed: the same kind of thing as the answer, plainly wrong by the verses, a
  child can tell them apart, none also right, no "all of the above".
- Keep the question as it is. Use plain words a 7-year-old knows, no King James wording.
"q" is the question's number as written (q1, q2, ...). Answer every question."""
REBALANCE_SCHEMA = {"type": "object", "properties": {"questions": {"type": "array", "items": {
    "type": "object", "properties": {
        "q": {"type": "string"}, "answer": {"type": "string"},
        "wrong": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 3}},
    "required": ["q", "answer", "wrong"], "additionalProperties": False}}},
    "required": ["questions"], "additionalProperties": False}


def plainly_longest(answer: str, wrong: list[str]) -> bool:
    """The site's two tests: two words longer than every wrong choice, or 15% longer in letters."""
    return (word_count(answer) >= max(word_count(w) for w in wrong) + 2
            or len(answer) > 1.15 * max(len(w) for w in wrong))


def rebalance_prepare() -> None:
    worded = load_wording()["questions"]
    todo = [q for q in load_sources() if (record := worded.get(q["id"])) and ready(q, record)
            and not record.get("dropped") and plainly_longest(record["answer"], record["wrong"])]
    chunks, index = {}, {}
    for start in range(0, len(todo), QUESTIONS_PER_CALL):
        chunk = todo[start:start + QUESTIONS_PER_CALL]
        name = f"questions-{start // QUESTIONS_PER_CALL + 1:04d}"
        chunks[name] = [line for n, q in enumerate(chunk, 1) for line in check_lines(n, q, worded[q["id"]])]
        index[name] = [q["id"] for q in chunk]
    print(f"children's source questions whose right choice is plainly the longest: {len(todo)}")
    write_items(REBALANCE_WORK, REBALANCE_TASK, REBALANCE_SCHEMA, chunks, index)


def rebalance_apply(out_dir: Path) -> None:
    """Take new choices that pass the rules and are balanced; each such question is checked again by the BSB."""
    index = json.loads((REBALANCE_WORK / "items-index.json").read_text(encoding="utf-8"))
    data = load_wording()
    counts, missing = Counter(), []
    for name, ids in index.items():
        answer_file = out_dir / f"{name}.json"
        if not answer_file.exists():
            missing.append(name)
            continue
        reply = json.loads(answer_file.read_text(encoding="utf-8"))
        by_number = {label_of(r["q"]): r for r in (reply.get("structured_output") or {}).get("questions") or []}
        for n, qid in enumerate(ids, 1):
            r, record = by_number.get(f"q{n}"), data["questions"].get(qid)
            if r is None or record is None:
                missing.append(f"{name}:q{n}")
                continue
            new = {**record, "answer": r["answer"].strip(), "wrong": [w.strip() for w in r["wrong"]]}
            fault = reply_fault(new) or ("still plainly the longest" if plainly_longest(new["answer"], new["wrong"]) else None)
            if fault:
                counts[fault] += 1
                continue
            record.update(answer=new["answer"], wrong=new["wrong"], rebalanced=MODEL)
            record.pop("checked")  # the new choices go through the BSB check again
            counts["rebalanced"] += 1
    save_wording(data)
    print(f"{dict(counts)}; not recorded: {len(missing)} {missing[:10]}")


# --- into the bank ---------------------------------------------------------------------------------------------------

def bank_id(q: dict) -> str:
    return f"children-{q['bank_id']}"


def ready(q: dict, record: dict | None) -> bool:
    """Checked, or dropped, for the source's present wording."""
    return bool(record) and record["of"] == fingerprint(q) and bool(record.get("checked") or record.get("dropped"))


def as_record(q: dict, record: dict) -> dict:
    """A corpus record for build-question-bank.py: the rewrite, or the source's wording when it was dropped."""
    base = {key: q[key] for key in ("id", "source_id", "collection", "lesson", "licence", "licence_class",
                                    "publishable", "attribution", "source_url")}
    base.update(bank_id=bank_id(q), attribution_source_id=q["source_id"])
    if record.get("dropped"):
        return {**base, "question": q["question"], "answer": q["answer"], "options": None, "options_by": None,
                "reference": q.get("reference"), "question_origin": q["question_origin"]}
    origin = f"{q['question_origin']}; reworded for the BSB and for children by {record['by']}"
    if q["licence_class"] != "public-domain":
        origin += ", shared under the same licence"
    return {**base, "question": record["question"], "answer": record["answer"],
            "options": shuffled(q["id"], [record["answer"], *record["wrong"]]), "options_by": record["by"],
            "reference": record["reference"], "question_origin": origin}


def children_records() -> list[dict]:
    """For build-question-bank.py: every children's source question checked or dropped, as a corpus record."""
    worded = load_wording()["questions"]
    return [as_record(q, worded[q["id"]]) for q in load_sources() if ready(q, worded.get(q["id"]))]


def publish() -> None:
    """Give each checked question an audit.json record (the check is its BSB check: "keep", the wording already
    fixed) and a model-tags.json record (the source's Haiku tags, passages from the new reference); a dropped one
    gets a "hide" with its reason."""
    worded, audit, tags = load_wording()["questions"], load_audit(), load_tags()
    today = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    counts = Counter()
    for q in load_sources():
        record = worded.get(q["id"])
        if not ready(q, record):
            counts["not ready"] += 1
            continue
        r = as_record(q, record)
        before = {"question": r["question"], "answer": r["answer"], "right": r["answer"],
                  "options": list(r["options"] or []), "reference": r["reference"] or ""}
        verdict = "hide" if record.get("dropped") else "keep"
        why = record.get("dropped") or (f"Fixed by the check: {record['fixed']}" if record.get("fixed") else "No fault found.")
        audit["questions"][q["id"]] = {"collection": q["collection"], "verdict": verdict, "problems": [], "why": why,
                                       "by": record.get("checked") or record["by"], "audited": today,
                                       "before": before, "after": None}
        passages = [check_passage({"book": s["book"], "chapter": s["start"][0], "verse": s["start"][1],
                                   "verse_end": s["end"][1]}, r) for s in parse_spans(r["reference"]) or []]
        tags["questions"][q["id"]] = {"passages": [p for p in passages if p], "people": q["people"],
                                      "places": q["places"], "topics": q["subjects"][:3], "by": "claude-haiku"}
        counts[verdict] += 1
    save_json(AUDIT, audit)
    save_tags(tags)
    print(f"published {dict(counts)}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    for command in ("prepare", "check-prepare"):
        sub.add_parser(command).add_argument("--limit", type=int, help="only the first N questions (a pilot)")
    for command in ("apply", "check-apply", "rebalance-apply"):
        sub.add_parser(command).add_argument("out_dir", type=Path)
    sub.add_parser("rebalance-prepare")
    sub.add_parser("publish")
    args = parser.parse_args()
    if args.command == "prepare":
        prepare(args.limit)
    elif args.command == "apply":
        apply(args.out_dir.resolve())
    elif args.command == "check-prepare":
        check_prepare(args.limit)
    elif args.command == "check-apply":
        check_apply(args.out_dir.resolve())
    elif args.command == "rebalance-prepare":
        rebalance_prepare()
    elif args.command == "rebalance-apply":
        rebalance_apply(args.out_dir.resolve())
    else:
        publish()


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
