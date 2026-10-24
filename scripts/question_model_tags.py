"""Richer tags for the Question Bank, set by a model and checked against the Bible text: the passage a question comes
from (book, chapter, verse), the people and places in it, and a few plain topics.

These sit beside the fixed word-list tags in question_tags.py, which stay as they are. Claude Haiku reads every question
the site shows, 50 to a call through BatchRunner, and names what it sees; then every passage it names is checked here
against the BSB text (data/plain/bsb/<BOOK>.json), with no model involved:
  - a book, chapter or verse that does not exist is dropped;
  - a passage that exists is "matched" when a telling word of the answer (of the question instead, less its book names,
    when the answer is only a book: "Which epistle warns of scoffers?" "2 Peter") is in its text, give or take two verses (a whole chapter for a chapter-only passage), allowing an old spelling
    ("Phebe" for "Phoebe"), and "exists" when it is not.
Every tag is kept in content/questions/model-tags.json by question id, so a rebuild never asks again about a question
already tagged.

    python scripts/question_model_tags.py prepare           # write BatchRunner items for shown questions not yet tagged
    python scripts/question_model_tags.py apply <out-dir>   # read BatchRunner's answers, check every passage, record them
    (then python scripts/build-question-bank.py)

--records <file.json> tags the questions in another file of the same shape instead of the shown questions (the
children's sources not yet on the site, Research/BibleQuizCorpus/normalized/children-batch4.json); its work goes to
.local/question-model-tags/<file name>/.
"""

from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
from functools import cache
from pathlib import Path

from bible.books import BOOKS
from question_tags import CANON

WEBSITE = Path(__file__).resolve().parent.parent
BANK = WEBSITE / "content" / "questions" / "question-bank.json"
TAGS = WEBSITE / "content" / "questions" / "model-tags.json"
BSB = WEBSITE / "data" / "plain" / "bsb"
WORK = WEBSITE / ".local" / "question-model-tags"

QUESTIONS_PER_CALL = 50
ANSWER_CHARS = 400
LESSON_CHARS = 200
NEARBY_VERSES = 2
SPELLING = 0.85  # difflib ratio at which a word of five letters or more counts as the same word ("bezaleel"/"bezalel")

_NAMES = {code: name for code, name, _section, _osis in BOOKS}
TASK = """You tag Bible quiz questions so a reader can find them by passage, person, place and topic.

For every question in the input give:
- "passages": where in the Bible the answer is found, as book code, chapter and verse. Use the book codes below. Give
  "verse" 0 when you know the chapter but not the verse, and "verse_end" 0 unless the answer spans a range of verses.
  If the question gives a reference, start from it. Give no passage when the question is not about one place in the
  Bible (the order of the books, who wrote a book, a doctrine taught across Scripture) or when you are not sure: a
  wrong passage is worse than none. At most three passages.
- "people": the Bible people the question or its answer is about, by their usual English names ("Moses", "Mary
  Magdalene"). God and Jesus count only when the question is about them, not when they are merely mentioned.
- "places": the places named or meant ("Egypt", "the Red Sea", "Bethlehem").
- "topics": one to three short lowercase topics a reader might look for ("the flood", "passover", "prayer",
  "kings of israel", "miracles of jesus", "books of the bible").
Use an empty list for anything that does not apply. "q" is the question's number as written (q1, q2, ...). If the
input holds no questions, return an empty list.

Book codes: """ + ", ".join(f"{code} {_NAMES[code]}" for code in CANON) + "."

SCHEMA = {"type": "object", "properties": {"tags": {"type": "array", "items": {
    "type": "object", "properties": {
        "q": {"type": "string"},
        "passages": {"type": "array", "items": {"type": "object", "properties": {
            "book": {"type": "string"}, "chapter": {"type": "integer"}, "verse": {"type": "integer"},
            "verse_end": {"type": "integer"}},
            "required": ["book", "chapter", "verse", "verse_end"], "additionalProperties": False}},
        "people": {"type": "array", "items": {"type": "string"}},
        "places": {"type": "array", "items": {"type": "string"}},
        "topics": {"type": "array", "items": {"type": "string"}}},
    "required": ["q", "passages", "people", "places", "topics"], "additionalProperties": False}}},
    "required": ["tags"], "additionalProperties": False}

# Words too common to show that a verse is the one a question means.
_COMMON = set("""the and that this with from they them their there what which when where who whom whose why how
were was are been being have has had into unto upon over under about after before then than shall will would could
should said says say came come went goes going made make give gave given take took also only very much many more most
some such other these those your yours thou thee thy thine yourself himself herself itself ourselves themselves him
her his hers its our ours not nor but for all any each every true false yes none lord god book books chapter verse
epistle letter""".split())
_BOOK_WORDS = {w for name in _NAMES.values() for w in re.findall(r"[a-z]+", name.lower())}


def load_tags() -> dict:
    if TAGS.exists():
        return json.loads(TAGS.read_text(encoding="utf-8"))
    return {"about": "Model-set tags for the Question Bank, passages checked against the BSB text; written by "
                     "scripts/question_model_tags.py.", "questions": {}}


def save_tags(data: dict) -> None:
    data["questions"] = dict(sorted(data["questions"].items()))
    TAGS.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")


# --- used by build-question-bank.py --------------------------------------------------------------------------------

def add_model_tags(questions: list[dict]) -> int:
    """Give every question its passages, people, places and subjects (empty when not yet tagged); return how many had
    tags. "subjects" is the model's plain topics, apart from the fixed "topic" id."""
    tagged = load_tags()["questions"]
    for q in questions:
        tags = tagged.get(q["id"], {})
        q["passages"] = tags.get("passages", [])
        q["people"] = tags.get("people", [])
        q["places"] = tags.get("places", [])
        q["subjects"] = tags.get("topics", [])
    return sum(1 for q in questions if q["id"] in tagged)


# --- prepare ---------------------------------------------------------------------------------------------------------

def work_of(records: Path | None) -> Path:
    return WORK / records.stem if records else WORK


def prepare(records: Path | None) -> None:
    tagged = load_tags()["questions"]
    questions = [q for q in json.loads((records or BANK).read_text(encoding="utf-8"))["questions"]
                 if not q.get("repeat_of") and not q.get("hidden") and q["id"] not in tagged]
    work = work_of(records)
    items = work / "items"
    items.mkdir(parents=True, exist_ok=True)
    for old in items.glob("*.txt"):
        old.unlink()
    index = {}
    for start in range(0, len(questions), QUESTIONS_PER_CALL):
        chunk = questions[start:start + QUESTIONS_PER_CALL]
        name = f"questions-{start // QUESTIONS_PER_CALL + 1:03d}"
        lines = []
        for n, q in enumerate(chunk, 1):
            lines += [f"q{n}", f"  Question: {q['question']}", f"  Answer: {q['answer'][:ANSWER_CHARS]}"]
            if q.get("reference"):
                lines.append(f"  Reference given: {q['reference']}")
            if q.get("lesson"):
                lines.append(f"  From the lesson: {q['lesson'][:LESSON_CHARS]}")
            lines.append("")
        (items / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
        index[name] = [q["id"] for q in chunk]
    (work / "items-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")
    (work / "task.txt").write_text(TASK, encoding="utf-8", newline="\n")
    (work / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    print(f"questions not yet tagged: {len(questions)}; wrote {len(index)} BatchRunner items to {items}")


# --- apply: check every passage against the BSB text ----------------------------------------------------------------

@cache
def bible_book(code: str) -> dict[tuple[int, int], str]:
    raw = json.loads((BSB / f"{code}.json").read_text(encoding="utf-8"))
    return {tuple(map(int, key.split(":"))): text for key, text in raw.items()}


def telling_words(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-z]+", text.lower()) if len(w) >= 4 and w not in _COMMON}


def in_text(word: str, text_words: set[str]) -> bool:
    # "Pharaoh's" is in the text as "pharaoh"; "plagues" as "plague": compare without a trailing s as well.
    if word in text_words or word.rstrip("s") in text_words:
        return True
    return len(word) >= 5 and bool(difflib.get_close_matches(word, text_words, n=1, cutoff=SPELLING))


def check_passage(passage: dict, question: dict) -> dict | None:
    """The passage with its "check" ("matched" or "exists"), or None when its book, chapter or verse does not exist."""
    book, chapter = passage["book"].upper(), passage["chapter"]
    verse = passage["verse"]
    verse_end = passage["verse_end"] if verse and passage["verse_end"] != verse else 0
    if book not in CANON:
        return None
    verses = bible_book(book)
    in_chapter = sorted(v for c, v in verses if c == chapter)
    if not in_chapter or (verse and verse not in in_chapter) or (verse_end and (verse_end not in in_chapter or verse_end < verse)):
        return None
    if verse:
        low, high = verse - NEARBY_VERSES, (verse_end or verse) + NEARBY_VERSES
        text = " ".join(verses[(chapter, v)] for v in in_chapter if low <= v <= high)
    else:
        text = " ".join(verses[(chapter, v)] for v in in_chapter)
    text_words = set(re.findall(r"[a-z]+", text.lower()))
    # Book names stay in the answer's words, because Peter, John and Samuel are people too.
    wanted = telling_words(question["answer"])
    if wanted <= _BOOK_WORDS:
        wanted = telling_words(question["question"]) - _BOOK_WORDS
    matched = any(in_text(w, text_words) for w in wanted)
    return {"book": book, "chapter": chapter, "verse": verse or None, "verse_end": verse_end or None,
            "check": "matched" if matched else "exists"}


def clean_names(names: list[str]) -> list[str]:
    return list(dict.fromkeys(n.strip() for n in names if n.strip()))


def topics_of(topics: list[str]) -> list[str]:
    """Up to three topics, leaving out a bare book name: the passage already says which book."""
    book_names = {name.lower() for name in _NAMES.values()}
    return [t for t in clean_names([t.lower() for t in topics]) if t not in book_names][:3]


def apply(out_dir: Path, records: Path | None) -> None:
    index = json.loads((work_of(records) / "items-index.json").read_text(encoding="utf-8"))
    by_id = {q["id"]: q for q in json.loads((records or BANK).read_text(encoding="utf-8"))["questions"]}
    data = load_tags()
    added, missing, checks = 0, [], {"matched": 0, "exists": 0, "dropped": 0}
    for name, ids in index.items():
        answer_file = out_dir / f"{name}.json"
        if not answer_file.exists():
            missing.append(name)
            continue
        reply = json.loads(answer_file.read_text(encoding="utf-8"))
        by_number = {t["q"]: t for t in (reply.get("structured_output") or {}).get("tags") or []}
        for n, qid in enumerate(ids, 1):
            tags = by_number.get(f"q{n}")
            if tags is None or qid not in by_id:
                missing.append(f"{name}:q{n}")
                continue
            passages = []
            for passage in tags["passages"][:3]:
                checked = check_passage(passage, by_id[qid])
                checks[checked["check"] if checked else "dropped"] += 1
                if checked:
                    passages.append(checked)
            data["questions"][qid] = {"passages": passages, "people": clean_names(tags["people"]),
                                      "places": clean_names(tags["places"]),
                                      "topics": topics_of(tags["topics"]), "by": "claude-haiku"}
            added += 1
    save_tags(data)
    print(f"recorded tags for {added} questions; passages {checks}; still untagged: {len(missing)} {missing[:10]}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    prepare_parser = sub.add_parser("prepare")
    apply_parser = sub.add_parser("apply")
    apply_parser.add_argument("out_dir", type=Path)
    for command_parser in (prepare_parser, apply_parser):
        command_parser.add_argument("--records", type=Path, help="tag the questions in this file, not the shown ones")
    args = parser.parse_args()
    records = args.records.resolve() if args.records else None
    if args.command == "prepare":
        prepare(records)
    else:
        apply(args.out_dir.resolve(), records)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
