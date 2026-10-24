"""Build the Question Bank: the site's official list of production-ready Bible questions.

Reads the quiz corpus's common-format files (Research/BibleQuizCorpus/normalized/, built by the corpus's own
tools; never written to here) and keeps only questions that are ready to show as they are: typed text rather
than machine-read scans, with an answer, from a bank listed in BANKS below. Duplicates across banks are kept
once. Every question keeps the credit its source asks for.

Writes four files:
  content/questions/question-bank.json   the official record, committed: every question with its full
                                         licence and credit, plus what was left out and why
  content/questions/question-table.csv   the same questions as one table, for checking in a spreadsheet
  data/questions/bank.json               the copy the Questions page loads (generated, not committed)
  .local/question-explorer/questions.json  the local data hub's question explorer (/data_questions/, never
                                         released; scripts/question_explorer.py)

    python scripts/build-question-bank.py
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from bible.books import BOOKS  # noqa: E402
from question_audit import apply_audit  # noqa: E402
from question_children_wording import add_children_wording  # noqa: E402
from question_choices import add_choices  # noqa: E402
from question_difficulty import add_difficulty  # noqa: E402
from question_explorer import write_explorer  # noqa: E402
from question_link_verse import apply_link_verses  # noqa: E402
from question_grounding import apply_grounding, write_table  # noqa: E402
from question_mining import mined_records  # noqa: E402
from question_model_tags import add_model_tags  # noqa: E402
from question_repeats import mark_repeats  # noqa: E402
from question_writing import written_records  # noqa: E402
from question_tags import CANON, OLD_TESTAMENT, TOPICS, books_of, link_of, testament_of, topic_of  # noqa: E402

WEBSITE = Path(__file__).resolve().parent.parent
CORPUS = WEBSITE.parent / "Research" / "BibleQuizCorpus" / "normalized"
OFFICIAL = WEBSITE / "content" / "questions" / "question-bank.json"
SITE = WEBSITE / "data" / "questions" / "bank.json"
TABLE = WEBSITE / "content" / "questions" / "question-table.csv"
EXPLORER = WEBSITE / ".local" / "question-explorer" / "questions.json"

SCHEMA = "bibleproject.question-bank/v2"

# The kinds of question, in the order the page lists them.
KINDS = {
    "trivia": "Bible quiz",
    "lesson": "Sunday school lesson",
    "catechism": "Catechism",
}

# Every bank that goes into the bank: (title, kind, tradition). A bank in the corpus that is neither here nor in
# LEFT_OUT stops the build, so a new download is never taken in or dropped without someone deciding.
BANKS: dict[str, tuple[str, str, str | None]] = {
    "scripture-buzzer": ("Scripture Buzzer question set", "trivia", None),
    "final-bible-quiz-200": ("Bible Quiz (Brian Chanda)", "trivia", None),
    "database-seed": ("Bible Trivia Game", "trivia", None),
    "added-very-hard": ("Bible Trivia Game, very hard", "trivia", None),
    "religion-and-mythology-bible-subset": ("Open Trivia Database (el-cms), religion", "trivia", None),
    "bible-trivia-alpaca": ("Bible trivia (Hugging Face, liaaron1)", "trivia", None),
    "kids-bible-trivia-300": ("300 Bible Trivia Questions for Kids", "trivia", None),
    "opentdb-bible-subset": ("Open Trivia Database", "trivia", None),
    "religion-faith-bible-subset": ("OpenTriviaQA, religion and faith", "trivia", None),
    "pg29067": ("Hurlbut's Bible Lessons for Boys and Girls (1903)", "lesson", "Methodist"),
    "know-the-truth-60": ("Know the Truth: 60 Questions on Christian Beliefs", "catechism", "Baptist"),
    "1695_baptist_catechism": ("1695 Baptist Catechism", "catechism", "Baptist"),
    "keachs_catechism": ("Keach's Catechism", "catechism", "Baptist"),
    "puritan_catechism": ("Spurgeon's Puritan Catechism", "catechism", "Baptist"),
    "westminster_shorter_with_proofs": ("Westminster Shorter Catechism", "catechism", "Reformed"),
    "westminster_larger_with_proofs": ("Westminster Larger Catechism", "catechism", "Reformed"),
    "westminster_shorter_catechism": ("Westminster Shorter Catechism", "catechism", "Reformed"),
    "westminster_larger_catechism": ("Westminster Larger Catechism", "catechism", "Reformed"),
    "heidelberg_catechism": ("Heidelberg Catechism", "catechism", "Reformed"),
    "catechism_for_young_children": ("A Catechism for Young Children", "catechism", "Reformed"),
    "pg13274": ("John Mason's Little Catechism (1692)", "catechism", "Puritan"),
    "pg36081": ("Luther's Small Catechism Explained (Sverdrup, 1900)", "catechism", "Lutheran"),
    # Made usable by scripts/question_mining.py (content/questions/mined.json), each record saying how.
    "mined-bibleqa": ("Bible quiz, reworded (facts from BibleQA)", "trivia", None),
    "mined-bibledata": ("Bible people and places (from BibleData)", "trivia", None),
    "mined-pg9912": ("Stump's Explanation of Luther's Small Catechism (1910)", "catechism", "Lutheran"),
    "mined-pg53465": ("Mezger's Lessons in the Small Catechism (1923)", "catechism", "Lutheran"),
    # Written for the site one BSB section at a time and passed by every review (scripts/question_writing.py).
    "written-bsb": ("Written for the site from the BSB", "trivia", None),
}

# Outside the site's close-to-Baptist scope (owner 2026-10-22): kept in the corpus to mine for content later, never
# shown as the site's own questions.
OUT_OF_SCOPE = "Outside the site's doctrinal scope (owner 2026-10-22); kept in the corpus to mine for content later."

LEFT_OUT: dict[str, str] = {
    "uncategorized-bible-subset": "Pub-quiz trivia that is often not about the Bible and sometimes wrong "
    "(a 1930s laxative advert, 'rats are not in the Bible'); not fit to show.",
    "pg9912": "The book prints its questions without answers.",
    "pg53465": "The book prints its questions without answers.",
    "pg34520": f"Bible Readings for the Home Circle (1914), Seventh-day Adventist. {OUT_OF_SCOPE}",
    "baltimore_no_1": f"Baltimore Catechism No. 1, Roman Catholic. {OUT_OF_SCOPE}",
    "baltimore_no_2": f"Baltimore Catechism No. 2, Roman Catholic. {OUT_OF_SCOPE}",
    "pg14553": f"Baltimore Catechism No. 3 (1885), Roman Catholic. {OUT_OF_SCOPE}",
    "pg14554": f"Kinkead's Explanation of the Baltimore Catechism (1891), Roman Catholic. {OUT_OF_SCOPE}",
}
LEFT_OUT_SOURCES: dict[str, str] = {
    "internet-archive-sunday-school-question-books": "Read off old page scans by machine; every question needs "
    "proofreading against its page image first, and only 3% carry an answer.",
}

# In the books and catechisms, a question that leans on the one before it ("What were their names?", "What does
# this mean?") makes sense only in sequence. This is a best guess from the wording, used to mark them, never to
# drop them. Trivia questions are written to stand alone.
LEANS_ON_CONTEXT = re.compile(r"\b(this|these|those|they|them|their|he|him|she|her|it)\b", re.IGNORECASE)



def load_corpus() -> list[dict]:
    batch2 = json.loads((CORPUS / "all-questions.json").read_text(encoding="utf-8"))["questions"]
    batch3 = json.loads((CORPUS / "all-questions-batch3.json").read_text(encoding="utf-8"))["questions"]
    return batch2 + batch3 + mined_records() + written_records()


def reason_left_out(record: dict) -> str | None:
    if record["source_id"] in LEFT_OUT_SOURCES:
        return LEFT_OUT_SOURCES[record["source_id"]]
    if record["bank_id"] in LEFT_OUT:
        return LEFT_OUT[record["bank_id"]]
    if record["bank_id"] not in BANKS:
        raise SystemExit(f"bank {record['bank_id']!r} ({record['source_id']}) is in the corpus but in neither BANKS "
                         "nor LEFT_OUT: decide whether it belongs before building")
    if not record.get("publishable"):
        return "Not publishable under its licence."
    if not (record.get("answer") or "").strip():
        return "No answer printed."
    if "�" in record["question"] + record["answer"]:
        return "Broken characters in the transcription."
    return None


def dedupe_key(record: dict) -> str:
    return re.sub(r"[^a-z0-9]+", " ", f"{record['question']} | {record['answer']}".lower()).strip()


def better(a: dict, b: dict) -> bool:
    """Whether a should be kept over its duplicate b: choices first, then a scripture reference, then the original
    over a copy (244 Hugging Face trivia records copy ministry-to-children.com, which then keeps the credit)."""
    def rank(q: dict) -> tuple[bool, bool, bool]:
        return bool(q.get("options")), bool(q.get("reference")), q["source_id"] == q.get("attribution_source_id")
    return rank(a) > rank(b)


def to_entry(record: dict) -> dict:
    title, kind, tradition = BANKS[record["bank_id"]]
    lesson = record.get("lesson")
    question, answer = record["question"].strip(), record["answer"].strip()
    books = books_of(question, answer, record.get("reference"))
    topic = topic_of(question, answer, lesson, kind, books)
    return {
        "id": record["id"],
        "source_id": record["source_id"],
        "attribution_source_id": record.get("attribution_source_id"),
        "question": question,
        "answer": answer,
        "options": record.get("options"),
        "reference": record.get("reference"),
        "kind": kind,
        "tradition": tradition,
        "collection": title,
        "lesson": lesson,
        "books": books,
        "testament": testament_of(kind, books, topic),
        "topic": topic,
        "link": link_of(record.get("reference")),
        # A mined question was reworded to stand alone (question_mining.py).
        "standalone": record["id"].startswith("mined:") or kind == "trivia" or not LEANS_ON_CONTEXT.search(record["question"]),
        "question_origin": record["question_origin"],
        "licence": record["licence"],
        "licence_class": record["licence_class"],
        "attribution": record.get("attribution"),
        "source_url": record.get("source_url"),
        "also_in": [],
        "options_by": record.get("options_by"),
    }


def select(records: list[dict]) -> tuple[list[dict], list[dict]]:
    kept: dict[str, dict] = {}
    left_out: Counter = Counter()
    duplicates = 0
    for record in records:
        reason = reason_left_out(record)
        if reason:
            bank = "(every book)" if record["source_id"] in LEFT_OUT_SOURCES else record["bank_id"]
            left_out[(record["source_id"], bank, reason)] += 1
            continue
        key = dedupe_key(record)
        entry = to_entry(record)
        if key not in kept:
            kept[key] = entry
            continue
        duplicates += 1
        old = kept[key]
        winner, loser = (entry, old) if better(record, old) else (old, entry)
        winner["also_in"] = sorted({*old["also_in"], *entry["also_in"], loser["collection"]} - {winner["collection"]})
        kept[key] = winner
    order = list(KINDS)
    questions = sorted(kept.values(), key=lambda q: (order.index(q["kind"]), q["tradition"] or "", q["collection"]))
    excluded = [{"source_id": s, "bank_id": b, "count": n, "reason": r} for (s, b, r), n in sorted(left_out.items())]
    excluded.append({"source_id": "(several)", "bank_id": "(several)", "count": duplicates,
                     "reason": "The same question and answer in more than one bank; kept once, the others named in also_in."})
    return questions, excluded


def hide_doubted_written(questions: list[dict]) -> int:
    """A question written for the site (question_writing.py) that grounding finds is not answered by Scripture, or
    whose answer it doubts, is hidden: it was written from a verse, so either means something went wrong."""
    hidden = 0
    for q in questions:
        g = q["grounding"]
        if q["id"].startswith("written:") and not q["hidden"] and g and (g["basis"] != "scripture" or g["doubt"]):
            q["hidden"] = f"Written for the site, but grounding found {g['doubt'] or g['note']}"
            hidden += 1
    return hidden


def collections_of(questions: list[dict]) -> list[dict]:
    seen: dict[str, dict] = {}
    for q in questions:
        c = seen.setdefault(q["collection"], {"title": q["collection"], "kind": q["kind"], "tradition": q["tradition"],
                                              "credit": q["attribution"], "source_url": q["source_url"], "count": 0})
        c["count"] += 1
    return list(seen.values())


def site_copy(questions: list[dict]) -> dict:
    """The page's copy: the questions without the licence wording, which the collection list carries once, and
    without repeats and questions the audit hid, which the site never shows (scripts/question_repeats.py,
    scripts/question_audit.py)."""
    keep = ("question", "answer", "options", "reference", "kind", "tradition", "collection", "lesson", "books",
            "testament", "topic", "link", "standalone", "passages", "people", "places", "subjects", "answer_choice", "options_by", "lead_in", "level", "children", "child")
    shown = [q for q in questions if not q["repeat_of"] and not q["hidden"]]
    return {"schema": SCHEMA, "kinds": KINDS, "topics": topics_meta(), "books": books_meta(),
            "collections": collections_of(shown), "questions": [{k: q[k] for k in keep} for q in shown]}


def topics_meta() -> list[dict]:
    return [{"id": topic, "title": spec["title"], "group": spec["group"]} for topic, spec in TOPICS.items()]


def books_meta() -> list[dict]:
    names = {code: (name, section, osis) for code, name, section, osis in BOOKS}
    return [{"code": code, "name": names[code][0], "short": names[code][2], "section": names[code][1],
             "testament": "OT" if code in OLD_TESTAMENT else "NT"} for code in CANON]


def write(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")


def main() -> None:
    questions, excluded = select(load_corpus())
    repeats = mark_repeats(questions)
    model_tagged = add_model_tags(questions)
    model_choices = add_choices(questions)
    audited = apply_audit(questions)
    grounded = apply_grounding(questions)
    grounded["written, hidden by grounding"] = hide_doubted_written(questions)
    rated = add_difficulty(questions)  # after the audit: a rating is for the wording shown
    relinked = apply_link_verses(questions)  # after the audit, which sets the link from the reference
    child_worded = add_children_wording(questions)
    counts = Counter(q["kind"] for q in questions)
    official = {
        "schema": SCHEMA,
        "about": "The site's official, production-ready Bible questions. Built by scripts/build-question-bank.py from "
                 "Research/BibleQuizCorpus/normalized/; answers are as the sources printed them and are not yet fact-checked.",
        "counts": {"questions": len(questions), "by_kind": {KINDS[k]: counts[k] for k in KINDS},
                   "with_choices": sum(1 for q in questions if q["options"]),
                   "with_reference": sum(1 for q in questions if q["reference"]),
                   "standalone": sum(1 for q in questions if q["standalone"]),
                   "with_book": sum(1 for q in questions if q["books"]),
                   "with_topic": sum(1 for q in questions if q["topic"]),
                   "repeats_not_shown": repeats,
                   "model_tagged": model_tagged,
                   "choices_added": model_choices,
                   "with_passage": sum(1 for q in questions if q["passages"]),
                   "rated": rated,
                   "links_moved_to_answer_verse": relinked,
                   "children_wording": child_worded,
                   "audit": audited,
                   "hidden_by_audit": sum(1 for q in questions if q["hidden"]),
                   "grounding": grounded,
                   "shown": sum(1 for q in questions if not q["repeat_of"] and not q["hidden"]),
                   # both should be 0: a question promoted from a repeat group, or reworded since, needs its turn
                   "shown_not_audited": sum(1 for q in questions if not q["repeat_of"] and not q["hidden"]
                                            and not q["audit"]),
                   "shown_not_grounded": sum(1 for q in questions if not q["repeat_of"] and not q["hidden"]
                                             and not q["grounding"])},
        "kinds": KINDS,
        "tagging": "books, testament and topic are set by fixed word lists and the references (scripts/question_tags.py), "
                   "not checked by hand; a question may sit under a near topic. passages, people, places and subjects are set by "
                   "Claude Haiku (scripts/question_model_tags.py); every passage exists in the BSB, and its check says whether "
                   "the answer's words are in it (\"matched\") or not (\"exists\").",
        "topics": topics_meta(),
        "collections": collections_of(questions),
        "left_out": excluded,
        "questions": questions,
    }
    write(OFFICIAL, official)
    write(SITE, site_copy(questions))
    write_table(questions, TABLE)
    write_explorer(questions, EXPLORER)
    print(json.dumps(official["counts"], indent=1))
    for row in excluded:
        print(f"  left out {row['count']:>6}  {row['bank_id']}: {row['reason'][:70]}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
