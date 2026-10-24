#!/usr/bin/env python3
"""Batch 4: the children's question sources (MANIFEST.md, "Batch 4"), pulled out into questions and answers and tagged
with Bible books, topic, passages, people, places and subjects, the same tags the site's questions carry.

  unfoldingWord Open Bible Stories   clean TSV, read here directly
  the five scanned books             Claude Sonnet writes out each question and its printed answer from the scan text,
                                     a section at a time, fixing only what the scanner misread
  Ministry-to-Children lessons       Claude Sonnet keeps the quiz questions with a bracketed answer from each lesson's
                                     lines, dropping discussion prompts and teacher directions

Model calls go through BatchRunner (Jarvis/Tools/BatchRunner); its work folders are under work/children-batch4/.
The tags come from Website/scripts/question_tags.py (books, topic: word lists) and question_model_tags.py (Claude
Haiku; every passage checked against the BSB), run on this file with --records.

    python tools/children_batch4.py prepare     # write BatchRunner items: work/children-batch4/{books,lessons}
    (BatchRunner on each folder)
    python tools/children_batch4.py build       # read the answers, write ../children/children-batch4.json
    (python Website/scripts/question_model_tags.py prepare --records content/questions/children/children-batch4.json; BatchRunner;
     ... apply <out> --records content/questions/children/children-batch4.json)
    python tools/children_batch4.py build       # again, to carry the model tags into the file
"""

from __future__ import annotations

import argparse
import csv
import datetime
import html
import json
import re
import sys
from pathlib import Path

CORPUS = Path(__file__).resolve().parent.parent
RAW = CORPUS / "raw"
WORK = CORPUS / "work" / "children-batch4"
OUT = CORPUS.parent / "children" / "children-batch4.json"
WEBSITE = CORPUS.parents[2]
sys.path.insert(0, str(WEBSITE / "scripts"))

from question_tags import books_of, testament_of, topic_of  # noqa: E402

SECTION_CHARS = 9000  # scan text per call; a section cut by size overlaps the next by OVERLAP_CHARS
OVERLAP_CHARS = 700
LESSONS_PER_CALL = 4
PUBLIC_DOMAIN = "Public domain in the United States: published before 1929."
SHARE_ALIKE = "CC BY-SA 4.0"
IA = RAW / "internet-archive-sunday-school-question-books"

# key: (title, kind, age, scan text, source_url)
BOOKS = {
    "assu": ("The Child's Scripture Question-Book (American Sunday-School Union, 1907)", "lesson", "younger classes",
             IA / "childsscriptureq00amer" / "childsscriptureq00amer_djvu.txt",
             "https://archive.org/details/childsscriptureq00amer"),
    "boston": ("The Child's Bible Question Book (Massachusetts Sabbath School Society, Boston, 1880)", "lesson",
               "the infant class", IA / "childsbiblequest00bost" / "childsbiblequest00bost_djvu.txt",
               "https://archive.org/details/childsbiblequest00bost"),
    "manly": ("Manly, The Child's Question Book on the Four Gospels (Southern Baptist Sunday School Board, 1864)",
              "lesson", "primary classes", IA / "childsquestionbo11manl" / "childsquestionbo11manl_djvu.txt",
              "https://archive.org/details/childsquestionbo11manl"),
    "little": ("A Catechism for Little Children (Baptist State Convention of North Carolina, 1864)", "catechism",
               "little children", IA / "catechismforlitt01bapt" / "catechismforlitt01bapt_djvu.txt",
               "https://archive.org/details/catechismforlitt01bapt"),
    "boyce": ("Boyce, A Brief Catechism of Bible Doctrine (1885)", "catechism", "ten to twelve and up",
              RAW / "baptist-childrens-catechisms" / "Boyce-Catechism_of_Bible_Doctrine1885.pdf.txt",
              "https://repository.sbts.edu/handle/10392/5301"),
}
MTC = RAW / "ministry-to-children-lessons" / "pages"
MTC_TITLE = "Ministry-to-Children Sunday school lessons"
MTC_CREDIT = ("Required by CC BY-SA 4.0: credit Ministry-To-Children.com (Tony Kummer) and license any adaptation under "
              "the same or a compatible licence.")
UW = RAW / "unfoldingword-obs-tq" / "tq_OBS.tsv"
UW_TITLE = "unfoldingWord Open Bible Stories questions"
UW_CREDIT = "Required by CC BY-SA 4.0: credit unfoldingWord (Open Bible Stories translation questions)."

BOOK_TASK = """You read one section of a machine-read scan of an old children's Bible question book or catechism.

Write out every question in the section with the answer printed for it:
- Fix only what the scanner got wrong: misread letters ("tlie" for "the", "U8" for "us"), words broken across lines,
  "!" or "f" or "1" read for a question mark, stray marks and page furniture (page numbers, running headers). Keep the
  book's own words, spelling and old wording otherwise; do not modernise or reword.
- "answer": the answer as printed. A question printed without an answer gets "". Never answer one yourself.
- "lesson": the lesson, section or heading the question sits under, as printed ("Lesson XII", "The Bible"), or "".
- "reference": a Bible reference printed with the question or its lesson ("Luke 1:5-38"), or "".
- "number": the question's printed number, or 0.
Leave out the title page, preface, notes to teachers, hymns and prayers. The section may begin or end in the middle of
a question: leave out a question or answer that is cut off. If the section holds no questions, return an empty list."""

LESSON_TASK = """You read lines from children's Bible lessons (Ministry-to-Children.com). Each lesson gives its title and
the lines that hold a question mark. Keep the review questions a child could be quizzed on about the Bible story: a
question with its answer given in brackets after it, such as "Who visited the believers in Antioch? (Barnabas)".

For each one give:
- "question": the question alone. Drop words before it that are not part of it ("Let's read Acts 11:19."), but keep
  what the question needs to make sense ("In verse 26, what were the disciples first called?" stays whole).
- "answer": the bracketed answer, without the brackets.
- "reference": a Bible reference the line or the lesson's passage gives for it, or "".
- "lesson": the lesson's number as given ("L1", "L2").
Leave out: discussion and opinion questions (answers such as "Allow responses", "Answers will vary", or asking what
the child thinks, feels or would do), questions about the child's own life, teacher directions, skits and games, and
questions whose bracket holds stage directions rather than an answer. If a lesson has none, give nothing for it."""

PAIR = {"type": "object", "properties": {"number": {"type": "integer"}, "lesson": {"type": "string"},
                                         "question": {"type": "string"}, "answer": {"type": "string"},
                                         "reference": {"type": "string"}},
        "required": ["number", "lesson", "question", "answer", "reference"], "additionalProperties": False}
SCHEMA = {"type": "object", "properties": {"pairs": {"type": "array", "items": PAIR}}, "required": ["pairs"],
          "additionalProperties": False}


# --- prepare ---------------------------------------------------------------------------------------------------------

def sections_of(text: str) -> list[str]:
    """The scan text in sections of about SECTION_CHARS, cut at a lesson heading where one is near, else by size with
    an overlap (build drops the repeats the overlap makes)."""
    starts = [m.start() for m in re.finditer(r"(?im)^\s*(lesson|section|chapter|part)\b", text)]
    sections, begin = [], 0
    while begin < len(text):
        end = begin + SECTION_CHARS
        if end >= len(text):
            sections.append(text[begin:])
            break
        cuts = [s for s in starts if begin + SECTION_CHARS // 2 < s <= end]
        if cuts:
            sections.append(text[begin:cuts[-1]])
            begin = cuts[-1]
        else:
            sections.append(text[begin:end])
            begin = end - OVERLAP_CHARS
    return sections


def clean_scan(text: str) -> str:
    return "\n".join(re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines() if line.strip())


def lesson_text(page: Path) -> tuple[str, list[str], list[str]]:
    """A lesson page's title, its categories, and the lines of its article that hold a question mark (or name the
    lesson's Bible passage)."""
    raw = page.read_text(encoding="utf-8")
    title = html.unescape(re.sub(r"<[^>]+>", "", (re.findall(r"<h1[^>]*>(.*?)</h1>", raw, re.S) or [""])[0])).strip()
    classes = (re.findall(r'<article[^>]*class="([^"]+)"', raw) or [""])[0]
    categories = [c[len("category-"):] for c in classes.split() if c.startswith("category-")]
    match = re.search(r'<div class="entry-content"[^>]*>(.*?)(?:<footer|$)', raw, re.S)
    body = re.sub(r"<script.*?</script>|<style.*?</style>", "", match.group(1) if match else "", flags=re.S)
    body = re.sub(r"</(p|li|h\d|div|tr)>|<br\s*/?>", "\n", body)
    lines = [re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", line))).strip() for line in body.splitlines()]
    wanted = [line for line in lines if ("?" in line and re.search(r"\?\s*[\(\[]", line))
              or re.match(r"(?i)(bible|scripture) (passage|story|text|reference)s?\b", line)]
    return title, categories, wanted


def write_items(folder: Path, items: dict[str, str], task: str, index: dict) -> None:
    (folder / "items").mkdir(parents=True, exist_ok=True)
    for old in (folder / "items").glob("*.txt"):
        old.unlink()
    for name, text in items.items():
        (folder / "items" / f"{name}.txt").write_text(text, encoding="utf-8", newline="\n")
    (folder / "task.txt").write_text(task, encoding="utf-8", newline="\n")
    (folder / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    (folder / "index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")


def prepare() -> None:
    items, index = {}, {}
    for key, (_title, _kind, _age, path, _url) in BOOKS.items():
        for n, section in enumerate(sections_of(clean_scan(path.read_text(encoding="utf-8", errors="replace"))), 1):
            name = f"{key}-{n:03d}"
            items[name] = section
            index[name] = {"book": key, "section": n}
    write_items(WORK / "books", items, BOOK_TASK, index)
    print(f"scanned books: {len(items)} sections")
    lessons = []
    for page in sorted(MTC.glob("*.html")):
        title, categories, lines = lesson_text(page)
        if any(re.search(r"\?\s*[\(\[]", line) for line in lines):
            lessons.append((page.stem, title, categories, lines))
    items, index = {}, {}
    for start in range(0, len(lessons), LESSONS_PER_CALL):
        name = f"lessons-{start // LESSONS_PER_CALL + 1:03d}"
        chunk = lessons[start:start + LESSONS_PER_CALL]
        items[name] = "\n\n".join(f"L{n}: {title}\n" + "\n".join(lines) for n, (_s, title, _c, lines) in enumerate(chunk, 1))
        index[name] = [{"page": stem, "title": title, "categories": categories} for stem, title, categories, _l in chunk]
    write_items(WORK / "lessons", items, LESSON_TASK, index)
    print(f"Ministry-to-Children: {len(lessons)} lessons with bracketed answers, in {len(items)} items")


# --- build -----------------------------------------------------------------------------------------------------------

def replies(folder: Path) -> tuple[dict, dict[str, list[dict]], list[str]]:
    index = json.loads((folder / "index.json").read_text(encoding="utf-8"))
    found, missing = {}, []
    for name in index:
        path = folder / "out" / f"{name}.json"
        if not path.exists():
            missing.append(name)
            continue
        found[name] = (json.loads(path.read_text(encoding="utf-8")).get("structured_output") or {}).get("pairs") or []
    return index, found, missing


def mtc_age(categories: list[str]) -> str:
    if any("preschool" in c for c in categories):
        return "preschool"
    if any("older-elementary" in c or "older-kids" in c for c in categories):
        return "older elementary"
    return "3 to 12"


def key_of(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def record(source: str, n: int, title: str, kind: str, age: str, pair: dict, licence: tuple[str, str, str | None],
           url: str) -> dict:
    question, answer = pair["question"].strip(), pair["answer"].strip()
    reference = pair.get("reference", "").strip() or None
    lesson = pair.get("lesson", "").strip() or None
    books = books_of(question, answer, reference)
    topic = topic_of(question, answer, lesson, kind, books)
    licence_text, licence_class, credit = licence
    return {"id": f"children-batch4:{source}:{n}", "source_id": "children-batch4", "bank_id": source,
            "collection": title, "kind": kind, "age": age, "number": pair.get("number") or n, "lesson": lesson,
            "question": question, "answer": answer, "options": None, "reference": reference,
            "books": books, "testament": testament_of(kind, books, topic), "topic": topic,
            "licence": licence_text, "licence_class": licence_class, "publishable": True,
            "attribution": credit, "attribution_required": credit is not None, "source_url": url,
            "question_origin": "human-written"}


def book_records() -> tuple[list[dict], list[str]]:
    index, found, missing = replies(WORK / "books")
    records, seen = [], set()
    for key, (title, kind, age, _path, url) in BOOKS.items():
        n = 0
        for name in sorted(k for k, v in index.items() if v["book"] == key):
            for pair in found.get(name, []):
                dedupe = (key, key_of(pair["question"])[:80], key_of(pair["answer"])[:40])
                if not pair["question"].strip() or dedupe in seen:  # the overlap between two size-cut sections
                    continue
                seen.add(dedupe)
                n += 1
                records.append(record(key, n, title, kind, age, pair, (PUBLIC_DOMAIN, "public-domain", None), url))
    return records, missing


def lesson_records() -> tuple[list[dict], list[str]]:
    index, found, missing = replies(WORK / "lessons")
    records, n = [], 0
    for name, lessons in index.items():
        for pair in found.get(name, []):
            number = int(re.sub(r"\D", "", pair["lesson"]) or 0)
            if not 1 <= number <= len(lessons) or not pair["answer"].strip():
                continue
            lesson = lessons[number - 1]
            n += 1
            url = f"https://ministry-to-children.com/{lesson['page']}/"
            records.append(record("mtc", n, MTC_TITLE, "lesson", mtc_age(lesson["categories"]),
                                  {**pair, "lesson": lesson["title"]}, (SHARE_ALIKE, "copyleft-attribution", MTC_CREDIT),
                                  url))
    return records, missing


def uw_records() -> list[dict]:
    records = []
    with UW.open(encoding="utf-8", newline="") as f:
        for n, row in enumerate(csv.DictReader(f, delimiter="\t"), 1):
            story = row["Reference"].split(":")[0]
            pair = {"question": row["Question"], "answer": row["Response"], "lesson": f"Open Bible Story {story}",
                    "reference": "", "number": n}
            records.append(record("uw", n, UW_TITLE, "lesson", "not stated", pair,
                                  (SHARE_ALIKE, "copyleft-attribution", UW_CREDIT),
                                  "https://git.door43.org/unfoldingWord/en_tq"))
    return records


def add_model_tags(records: list[dict]) -> int:
    tags_file = WEBSITE / "content" / "questions" / "checks" / "model-tags.json"
    tagged = json.loads(tags_file.read_text(encoding="utf-8"))["questions"] if tags_file.exists() else {}
    for r in records:
        tags = tagged.get(r["id"], {})
        r["passages"], r["people"], r["places"] = tags.get("passages", []), tags.get("people", []), tags.get("places", [])
        r["subjects"] = tags.get("topics", [])
    return sum(1 for r in records if r["id"] in tagged)


def build() -> None:
    books, books_missing = book_records()
    lessons, lessons_missing = lesson_records()
    records = books + lessons + uw_records()
    tagged = add_model_tags(records)
    counts = {}
    for r in records:
        counts.setdefault(r["collection"], {"questions": 0, "with_answer": 0, "with_book": 0, "model_tagged": 0})
        c = counts[r["collection"]]
        c["questions"] += 1
        c["with_answer"] += bool(r["answer"])
        c["with_book"] += bool(r["books"])
        c["model_tagged"] += bool(r["passages"] or r["people"] or r["places"] or r["subjects"])
    data = {"source_id": "children-batch4", "generated": datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
            "about": "Batch 4, the children's question sources, pulled out and tagged by tools/children_batch4.py. "
                     "Not on the site: the old books are in King James wording, to be reworded to the BSB first.",
            "counts": counts, "model_tagged": tagged, "not_yet_read": books_missing + lessons_missing,
            "questions": records}
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"counts": counts, "model_tagged": tagged, "not_yet_read": len(data["not_yet_read"])}, indent=1))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("command", choices=["prepare", "build"])
    args = parser.parse_args()
    prepare() if args.command == "prepare" else build()


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
