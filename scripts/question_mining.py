"""New questions for the Question Bank from sources it could not take as they were (owner, 2026-10-22: "change the
answers and change the questions slightly so that we can use them", without asking anything twice).

Three sources, each made usable by Claude Haiku through BatchRunner, with every result checked here:
  bibleqa   BibleQA's quiz questions carry no licence. Only those not already asked on the site (best embedding match
            to a shown question below ALREADY_ASKED) are sent; Haiku writes a new question in its own words for the
            same Bible fact, so none of BibleQA's wording is kept.
  bibledata BibleData's fact rows (CC BY 4.0, credited) read like a table ("Who was the father of Segub?"). Name
            meanings and modern place names are left out by rule, and so is a row about a person or place no
            question on the site names (from model-tags.json); Haiku keeps only what a church quiz would ask and
            words it as a quiz question.
  books     Two Lutheran catechism books (public domain) print their questions without answers. Haiku answers each
            from the book's own lesson text, rewording a question that leans on the one before it so it stands alone.
Every kept question also gets three wrong choices, a passage, people, places and topics in the same call. A passage
must exist in the BSB; for a Bible fact its text must hold the answer's words (question_model_tags.check_passage), or
the question is dropped.

Results go to content/questions/mined.json as corpus records, which build-question-bank.py takes in like any bank.
Anything already asked is caught afterwards by question_repeats.py, which judges every new close pair and hides the
mined question of a repeat, never the one already shown.

    python scripts/question_mining.py prepare           # write BatchRunner items for what is not yet mined
    python scripts/question_mining.py apply <out-dir>   # check and record BatchRunner's questions
    python scripts/question_mining.py balance            # where the right choice is clearly the longest, write items
                                                         # asking for wrong choices of its length (then apply-balance)
    python scripts/question_mining.py apply-balance <out-dir>
    (then build-question-bank.py, then question_repeats.py prepare / apply, then build again)
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
from pathlib import Path

from question_choices import norm, shuffled
from question_model_tags import check_passage, load_tags, save_tags

WEBSITE = Path(__file__).resolve().parent.parent
CORPUS = WEBSITE.parent / "Research" / "BibleQuizCorpus"
BANK = WEBSITE / "content" / "questions" / "question-bank.json"
MINED = WEBSITE / "content" / "questions" / "mined.json"
WORK = WEBSITE / ".local" / "question-mining"

ALREADY_ASKED = 0.85  # embedding score at which a source question is taken as already on the site
FACTS_PER_CALL = 60
LESSON_CHARS_PER_CALL = 24000
SKIP_BIBLEDATA = re.compile(r"^What does the name |^What is .+ today\?$")
NOT_NAMES = {"The", "King", "God", "Lord", "Jesus", "Christ", "Holy", "Spirit", "Mount", "Sea", "River", "Land", "City"}

# The two books' credits; their titles on the site are in build-question-bank.py's BANKS.
BOOKS = {
    "pg9912": "Joseph Stump, An Explanation of Luther's Small Catechism (1910)",
    "pg53465": "George Mezger, Lessons in the Small Catechism of Dr. Martin Luther (Concordia, 1923)",
}
BIBLEDATA_CREDIT = ("BibleData: Structured Datasets from the Holy Bible, by Brady Stephenson, CC BY 4.0; questions "
                    "worded and choices written by Claude Haiku.")

TASK = """You turn source material into Bible quiz questions for a Baptist church's website: clear, fair, each one
asking for a single fact or teaching, standing alone without any question before it.

The input says which kind of material it holds:
- "REWORD": quiz questions with their answers. Write a NEW question in your own words that asks for the same fact. Do
  not reuse the original wording. Keep the answer's fact.
- "FACTS": rows from a table of Bible facts. Set "keep" false unless an adult who reads the Bible, or a Sunday school
  class, could fairly be asked it: the person or place belongs to a story people know, not only to a list of names.
  For a kept row, word a natural quiz question and give the answer as the row gives it.
- "LESSONS": a Lutheran catechism lesson's text, then its numbered questions. Answer each from the lesson's own text,
  in its words where you can, shortened to 25 words at most. If a question leans on an earlier one ("What does it
  command?", "Why should we fear Him?"), reword it to stand alone ("What does the First Commandment command?"). Set
  "keep" false if the lesson text does not answer it, or if it only makes sense in class ("Recite the commandment").

For every question give:
- "q": its label as written (q1, q2, ...); "keep": true or false (for REWORD, false only if the fact is wrong).
- "question", "answer": the quiz question and its right answer (at most 25 words).
- "wrong": three wrong choices, clearly wrong yet believable to someone who half-remembers (other people, places or
  numbers from the same story; for teaching, a near-miss in the same form), about as long as the answer. Never "all of
  the above" or a joke.
- "book", "chapter", "verse": where in the Bible the answer is found (book codes like GEN, 1SA, MAT, JHN, 1CO, REV;
  "verse" 0 for a whole chapter); for a teaching with no one place, book "" and chapter 0.
- "people", "places": names in the question or answer; "topics": one to three short lowercase topics.
For a question with keep false, the other fields may be empty. If the input holds nothing, return an empty list."""

SCHEMA = {"type": "object", "properties": {"questions": {"type": "array", "items": {
    "type": "object", "properties": {
        "q": {"type": "string"}, "keep": {"type": "boolean"},
        "question": {"type": "string"}, "answer": {"type": "string"},
        "wrong": {"type": "array", "items": {"type": "string"}},
        "book": {"type": "string"}, "chapter": {"type": "integer"}, "verse": {"type": "integer"},
        "people": {"type": "array", "items": {"type": "string"}},
        "places": {"type": "array", "items": {"type": "string"}},
        "topics": {"type": "array", "items": {"type": "string"}}},
    "required": ["q", "keep", "question", "answer", "wrong", "book", "chapter", "verse", "people", "places", "topics"],
    "additionalProperties": False}}},
    "required": ["questions"], "additionalProperties": False}

BALANCE_TASK = """You write wrong answer choices for quiz questions whose right answer is given.

For every question, write three wrong choices that are clearly wrong yet believable to someone who half-remembers the
teaching: a near-miss in the same form and tone, never silly, never also true. Each must be about as long as the right
answer (within three words either way) so that length gives nothing away. "q" is the label as written (q1, q2, ...).
If the input holds nothing, return an empty list."""

BALANCE_SCHEMA = {"type": "object", "properties": {"questions": {"type": "array", "items": {
    "type": "object", "properties": {"q": {"type": "string"}, "wrong": {"type": "array", "items": {"type": "string"}}},
    "required": ["q", "wrong"], "additionalProperties": False}}}, "required": ["questions"], "additionalProperties": False}
LONGEST_BY = 1.15  # a right choice this much longer than every wrong one gives itself away


def load_mined() -> dict:
    if MINED.exists():
        return json.loads(MINED.read_text(encoding="utf-8"))
    return {"about": "Questions made usable by scripts/question_mining.py; read by build-question-bank.py like a "
                     "corpus bank.", "questions": {}, "dropped": {}}


def save_mined(data: dict) -> None:
    data["questions"] = dict(sorted(data["questions"].items()))
    data["dropped"] = dict(sorted(data["dropped"].items()))
    MINED.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")


def mined_records() -> list[dict]:
    """For build-question-bank.py: every kept mined question as a corpus record."""
    return list(load_mined()["questions"].values())


# --- the sources -----------------------------------------------------------------------------------------------------

def read_csv(name: str) -> list[dict]:
    with open(CORPUS / "output" / f"{name}.csv", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def not_yet_asked(rows: list[dict]) -> list[dict]:
    """Rows whose question and answer are not already on the site (local embeddings, $0)."""
    import question_repeats as qr

    shown = [q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"] if not q.get("repeat_of")]
    best = (qr.vectors_for(rows) @ qr.vectors_for(shown).T).max(axis=1)
    return [row for row, score in zip(rows, best) if score < ALREADY_ASKED]


def known_names() -> set[str]:
    """Capitalised words in the people and places tagged on the bank's own questions: the stories people know."""
    tagged = load_tags()["questions"]
    return {word for qid, tags in tagged.items() if not qid.startswith("mined:")
            for name in tags["people"] + tags["places"] for word in re.findall(r"[A-Z][a-z]{2,}", name)} - NOT_NAMES


def about_known(question: str, known: set[str]) -> bool:
    # "Who was the father of Segub (1KI 16:34)?" is about Segub: every capitalised word after the first, less brackets.
    return any(word in known for word in re.findall(r"[A-Z][a-z]+", re.sub(r"\(.*?\)", "", question))[1:])


def fact_sources() -> dict[str, list[dict]]:
    bibleqa = [{"id": f"mined:bibleqa:{r['index']}", "question": r["question"], "answer": r["answer"],
                "reference": r["reference"]} for r in read_csv("helen-jiahe-zhao-bibleqa")]
    known = known_names()
    bibledata = [{"id": f"mined:bibledata:{r['index']}", "question": r["question"], "answer": r["answer"],
                  "reference": r["reference"]} for r in read_csv("bradystephenson-bible-data")
                 if not SKIP_BIBLEDATA.search(r["question"]) and about_known(r["question"], known)]
    return {"bibleqa": not_yet_asked(bibleqa), "bibledata": not_yet_asked(bibledata)}


def squash(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def lessons_of(bank: str) -> list[tuple[str, list[dict]]]:
    """(lesson text, its questions) for a book whose questions follow each lesson under a QUESTIONS heading."""
    text = squash((CORPUS / "raw" / "gutenberg-sunday-school-question-books" / f"{bank}.txt").read_text(encoding="utf-8"))
    corpus = json.loads((CORPUS / "normalized" / "all-questions-batch3.json").read_text(encoding="utf-8"))["questions"]
    markers = [m.start() for m in re.finditer(r"QUESTIONS[.\-]", text)]
    lessons: dict[int, list[dict]] = {}
    cursor = 0
    for record in (r for r in corpus if r["bank_id"] == bank):
        at = text.find(squash(record["question"]), cursor)
        if at < 0:
            continue  # not found in order: left out rather than given the wrong lesson
        cursor = at
        lesson = max((n for n, m in enumerate(markers) if m < at), default=None)
        if lesson is not None:
            lessons.setdefault(lesson, []).append({"id": f"mined:{record['id']}", "question": record["question"]})
    found = []
    for n, questions in sorted(lessons.items()):
        start = markers[n - 1] if n else max(0, markers[n] - LESSON_CHARS_PER_CALL // 2)
        found.append((text[start:markers[n]], questions))
    return found


# --- prepare ---------------------------------------------------------------------------------------------------------

def prepare() -> None:
    data = load_mined()
    done = set(data["questions"]) | set(data["dropped"])
    items = WORK / "items"
    items.mkdir(parents=True, exist_ok=True)
    for old in items.glob("*.txt"):
        old.unlink()
    index: dict[str, list[str]] = {}
    for source, rows in fact_sources().items():
        rows = [r for r in rows if r["id"] not in done]
        mode = "REWORD" if source == "bibleqa" else "FACTS"
        for start in range(0, len(rows), FACTS_PER_CALL):
            chunk = rows[start:start + FACTS_PER_CALL]
            lines = [mode, ""]
            for n, r in enumerate(chunk, 1):
                lines += [f"q{n}", f"  Question: {r['question']}", f"  Answer: {r['answer']}",
                          f"  Reference: {r['reference'] or 'none given'}", ""]
            write_item(items, index, f"{source}-{start // FACTS_PER_CALL + 1:03d}", lines, [r["id"] for r in chunk])
    for bank in BOOKS:
        batch: list[tuple[str, list[dict]]] = []
        for lesson in lessons_of(bank) + [("", [])]:
            size = sum(len(text) for text, _ in batch)
            if batch and (not lesson[1] or size + len(lesson[0]) > LESSON_CHARS_PER_CALL):
                write_lessons(items, index, f"{bank}-{sum(bank in k for k in index) + 1:03d}", batch)
                batch = []
            if lesson[1]:
                batch.append((lesson[0], [q for q in lesson[1] if q["id"] not in done]))
    (WORK / "items-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")
    (WORK / "task.txt").write_text(TASK, encoding="utf-8", newline="\n")
    (WORK / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    counts = {}
    for name, ids in index.items():
        source = name.split("-", 1)[1].rsplit("-", 1)[0]
        counts[source] = counts.get(source, 0) + len(ids)
    print(f"to mine: {counts}; {len(index)} BatchRunner items in {items}")


def write_lessons(items: Path, index: dict, name: str, batch: list[tuple[str, list[dict]]]) -> None:
    lines, ids, n = ["LESSONS", ""], [], 0
    for number, (text, questions) in enumerate(batch, 1):
        if not questions:
            continue
        lines += [f"LESSON {number} TEXT:", text, "", f"LESSON {number} QUESTIONS:"]
        for q in questions:
            n += 1
            lines.append(f"q{n}: {q['question']}")
            ids.append(q["id"])
        lines.append("")
    if ids:
        write_item(items, index, name, lines, ids)


# Every prepare stamps its item names, so answers from an older prepare's items can never be read against new ones.
RUN = time.strftime("%m%d%H%M")


def write_item(items: Path, index: dict, name: str, lines: list[str], ids: list[str]) -> None:
    name = f"r{RUN}-{name}"
    (items / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
    index[name] = ids


# --- apply -----------------------------------------------------------------------------------------------------------

def record_of(qid: str, reply: dict, passage: dict | None) -> dict:
    source = qid.split(":")[1]
    if source == "bibleqa":
        origin = "model-reworded from a source question"
        licence, licence_class = ("New wording by Claude Haiku; the facts come from BibleQA (helen-jiahe-zhao, no "
                                  "licence stated), whose wording is not used."), "model-written"
        attribution, url = "Facts from BibleQA (helen-jiahe-zhao/BibleQA on GitHub); wording by Claude Haiku.", "https://github.com/helen-jiahe-zhao/BibleQA"
        bank_id, tradition_source = "mined-bibleqa", "helen-jiahe-zhao-bibleqa"
    elif source == "bibledata":
        origin = "model-worded from a fact table"
        licence, licence_class = "CC BY 4.0", "open"
        attribution, url = BIBLEDATA_CREDIT, "https://github.com/BradyStephenson/bible-data"
        bank_id, tradition_source = "mined-bibledata", "bradystephenson-bible-data"
    else:
        book = qid.split(":")[2]
        origin = "human-written, reworded to stand alone; answer drawn from the book by Claude Haiku"
        licence, licence_class = "Public domain in the United States (published before 1929)", "public-domain"
        attribution, url = f"{BOOKS[book]}. Answers drawn from its lesson text by Claude Haiku.", None
        bank_id, tradition_source = f"mined-{book}", "gutenberg-sunday-school-question-books"
    reference = None
    if passage:
        reference = f"{passage['book']} {passage['chapter']}" + (f":{passage['verse']}" if passage["verse"] else "")
    answer = reply["answer"].strip()
    return {"id": qid, "source_id": tradition_source, "attribution_source_id": tradition_source, "bank_id": bank_id,
            "question": reply["question"].strip(), "answer": answer,
            "options": shuffled(qid, [answer, *[w.strip() for w in reply["wrong"]]]), "options_by": "claude-haiku",
            "reference": reference, "lesson": None, "standalone": True, "question_origin": origin,
            "licence": licence, "licence_class": licence_class, "publishable": True, "attribution": attribution,
            "source_url": url}


def checked(qid: str, reply: dict) -> tuple[dict | None, dict | None, str]:
    if not reply["keep"]:
        return None, None, "not kept by Haiku"
    answer, wrong = reply["answer"].strip(), [w.strip() for w in reply["wrong"]]
    if not reply["question"].strip() or not answer or len(answer.split()) > 30:
        return None, None, "question or answer missing or too long"
    if len(wrong) != 3 or len({norm(w) for w in wrong} | {norm(answer)}) != 4 or not all(wrong):
        return None, None, "wrong choices not three distinct"
    passage = None
    if reply["book"] and reply["chapter"]:
        passage = check_passage({"book": reply["book"], "chapter": reply["chapter"], "verse": reply["verse"],
                                 "verse_end": 0}, {"question": reply["question"], "answer": answer})
    is_fact = qid.split(":")[1] in ("bibleqa", "bibledata")
    if is_fact and len(norm(answer).split()) <= 3 and f" {norm(answer)} " in f" {norm(reply['question'])} ":
        return None, None, "the question names its own answer"
    if is_fact and (passage is None or passage["check"] != "matched"):
        return None, None, "Bible fact without a passage holding the answer"
    return record_of(qid, reply, passage), passage, ""


def apply(out_dir: Path) -> None:
    index = json.loads((WORK / "items-index.json").read_text(encoding="utf-8"))
    data, tags = load_mined(), load_tags()
    kept, dropped, missing = 0, {}, []
    for name, ids in index.items():
        answer_file = out_dir / f"{name}.json"
        if not answer_file.exists():
            missing.append(name)
            continue
        replies = {r["q"]: r for r in (json.loads(answer_file.read_text(encoding="utf-8")).get("structured_output") or {}).get("questions") or []}
        for n, qid in enumerate(ids, 1):
            if f"q{n}" not in replies:
                missing.append(f"{name}:q{n}")
                continue
            reply = replies[f"q{n}"]
            record, passage, why = checked(qid, reply)
            if record is None:
                data["dropped"][qid] = why
                dropped[why] = dropped.get(why, 0) + 1
                continue
            data["dropped"].pop(qid, None)
            data["questions"][qid] = record
            tags["questions"][qid] = {"passages": [passage] if passage else [], "people": reply["people"],
                                      "places": reply["places"], "topics": [t.lower() for t in reply["topics"]][:3],
                                      "by": "claude-haiku"}
            kept += 1
    save_mined(data)
    save_tags(tags)
    print(f"kept {kept}; dropped {dropped}; missing (sent again by the next prepare): {len(missing)} {missing[:8]}")


# --- balance: wrong choices as long as the right one ------------------------------------------------------------------

def gives_itself_away(record: dict) -> bool:
    answer = record["answer"]
    return len(answer) > LONGEST_BY * max(len(o) for o in record["options"] if o != answer)


def balance() -> None:
    records = [r for r in load_mined()["questions"].values() if gives_itself_away(r)]
    work = WORK / "balance"
    items = work / "items"
    items.mkdir(parents=True, exist_ok=True)
    for old in items.glob("*.txt"):
        old.unlink()
    index = {}
    for start in range(0, len(records), FACTS_PER_CALL):
        chunk = records[start:start + FACTS_PER_CALL]
        lines = []
        for n, r in enumerate(chunk, 1):
            lines += [f"q{n}", f"  Question: {r['question']}", f"  Right answer: {r['answer']}", ""]
        name = f"r{RUN}-balance-{start // FACTS_PER_CALL + 1:03d}"
        (items / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
        index[name] = [r["id"] for r in chunk]
    (work / "items-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")
    (work / "task.txt").write_text(BALANCE_TASK, encoding="utf-8", newline="\n")
    (work / "schema.json").write_text(json.dumps(BALANCE_SCHEMA), encoding="utf-8", newline="\n")
    print(f"questions whose right choice is clearly the longest: {len(records)}; {len(index)} BatchRunner items in {items}")


def apply_balance(out_dir: Path) -> None:
    index = json.loads((WORK / "balance" / "items-index.json").read_text(encoding="utf-8"))
    data = load_mined()
    replaced, kept_old, missing = 0, 0, 0
    for name, ids in index.items():
        answer_file = out_dir / f"{name}.json"
        replies = {}
        if answer_file.exists():
            reply = json.loads(answer_file.read_text(encoding="utf-8")).get("structured_output") or {}
            replies = {r["q"]: r for r in reply.get("questions") or []}
        for n, qid in enumerate(ids, 1):
            record = data["questions"][qid]
            wrong = [w.strip() for w in replies.get(f"q{n}", {}).get("wrong", [])]
            if f"q{n}" not in replies:
                missing += 1
            elif len(wrong) == 3 and all(wrong) and len({norm(w) for w in wrong} | {norm(record["answer"])}) == 4:
                record["options"] = shuffled(qid, [record["answer"], *wrong])
                replaced += 1
            else:
                kept_old += 1  # the new set failed the checks: the old choices stay
    save_mined(data)
    print(f"new wrong choices for {replaced}; kept the old for {kept_old}; no answer for {missing}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("prepare")
    sub.add_parser("balance")
    balance_parser = sub.add_parser("apply-balance")
    balance_parser.add_argument("out_dir", type=Path)
    apply_parser = sub.add_parser("apply")
    apply_parser.add_argument("out_dir", type=Path)
    args = parser.parse_args()
    if args.command == "prepare":
        prepare()
    elif args.command == "balance":
        balance()
    elif args.command == "apply-balance":
        apply_balance(args.out_dir.resolve())
    else:
        apply(args.out_dir.resolve())


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
