"""The site's own Bible questions, written one BSB section at a time (owner, 2026-10-23: "we're gonna have to start
creating our own questions and our own answers", through several independent reviews, with parallel writers that
never write the same questions).

The scaffold is the BSB's own section headings ("The Creation", "Cain and Abel"): 3,017 sections, each running from
its heading to the next. One writing call owns one section, and every question it writes must cite verses inside that
section, so two calls never write from the same verses. Each call is also told what the site already asks about its
section. A section whose heading line names related passages ("(Mark 1:1-8; Luke 3:1-18)") is linked to those
sections both ways. A section waits until every earlier section it is linked to has been written (so Matthew is
written before Mark, Mark before Luke: waves 1 to 5), and its writer is also shown what was written for them. What
still repeats is caught by question_repeats.py over the whole bank.

Each written question then passes, or is rejected (never patched here):
  gate     rules checked by this script (see `gate`): the answer's words in the cited verses, quotations word for word,
           four distinct choices, no King James wording, it stands alone, the right choice does not give itself away;
  open     a different model takes the quiz blind with the section's text (question_writing_review.py);
  closed   the same with no text at all: is the question clear alone, and is any other choice right anywhere in the Bible;
  check    a fresh Sonnet call runs the site's BSB audit (question_audit.TASK) on it. A "fix" goes through every stage
           once more as round 2; a second fault rejects it.
`publish` puts the passed questions into content/questions/written.json (read by build-question-bank.py as the bank
"written-bsb"), with an audit.json record and a model-tags.json record, so the build treats them like any other
checked question. A run never touches content/ until it is published.

    python scripts/question_writing.py map [--words-per-question 60]
    python scripts/question_writing.py prepare write RUN [--books GEN,MRK] [--sections GEN-1-1,...] [--wave 1] [--limit N]
    python scripts/question_writing.py apply write RUN --by claude-sonnet-5-5
    python scripts/question_writing.py prepare open|closed|check RUN   then   apply open|closed|check RUN --by MODEL
    python scripts/question_writing.py report RUN
    python scripts/question_writing.py publish RUN
Each prepare writes WORK/RUN/<stage>-<n>/ (items, task.txt, schema.json) for BatchRunner; its answers go to out/ there.
"""

from __future__ import annotations

import argparse
import bisect
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from bible.books import BOOKS  # noqa: E402
from question_audit import WEBSITE, label, parse_spans, save_json  # noqa: E402
from question_writing_gate import context_lines, gate, verse_lines  # noqa: E402

BSB = WEBSITE / "data" / "text" / "bsb"
BANK = WEBSITE / "content" / "questions" / "question-bank.json"
GROUNDING = WEBSITE / "content" / "questions" / "grounding.json"
MAP = WEBSITE / "content" / "questions" / "writing-map.json"
WRITTEN = WEBSITE / "content" / "questions" / "written.json"
WORK = WEBSITE / ".local" / "question-writing"

ORDER = {code: n for n, (code, *_rest) in enumerate(BOOKS)}
NAME = {code: name for code, name, _section, _osis in BOOKS}
BROAD = 6  # a related span covering more sections than this is a pointer to a whole part of the Bible, not a parallel
MAX_PER_SECTION = 8

TASK = """You write Bible quiz questions for a Baptist church's website, from one section of the Berean Standard
Bible (BSB). The input gives the section's title and its BSB text with verse numbers, a few verses before and after
it for context only, the questions the site already asks about it, and how many new questions to write at most.

Each question:
- asks one thing the section's own verses state plainly, so that someone who has just read the section can answer
  it, and whose answer stays the same by any careful reading of the whole Bible;
- stands alone: it names the person, place or event it is about ("When God called Abram out of Haran, ..."), never
  "he", "she", "this passage", "these verses" or "the section". Naming the book and chapter is fine when that is the
  clearest way ("In Leviticus 11, ...");
- is not already asked on the site, in any wording, and does not ask the same thing as another of your questions;
- does not contain its answer, or a word that gives the answer away;
- uses modern wording. Anything in quotation marks is the BSB's words exactly as given. Never King James wording
  (thee, thou, ye, hath, unto, begat);
- is about the verses given, not a Psalm's title line (the text here leaves it out), a footnote, or what only another
  book says.
Spread the questions over the section: different verses and different kinds (who, what, where, how many, what
someone said or did, why, what happened next). Put first what a church member would find worth knowing: the main
events, people, promises, commands and teaching, before small details. Write fewer rather than weak ones: a short
section may give one or two, a list of names perhaps none.

Fields of each question:
- "question".
- "answer": the right answer as one of four choices, at most 12 words, with names and numbers written as the BSB
  text writes them.
- "wrong": exactly three wrong choices, each clearly wrong by this section and by the rest of the Bible, yet
  believable to someone who half-remembers: another person, place, number or thing from the same story or the same
  part of the Bible, in the same form and about the same length as the answer. Never "all of the above", a joke, a
  synonym of the answer, or anything also true elsewhere in the Bible (if the question asks who built an altar to the
  LORD at Bethel, Isaac and Jacob, who built altars too, are not fair wrong choices unless the question rules them out).
- "verses": the verse or verses of this section that hold the answer, as "chapter:verse" ("12:7") or a range in one
  chapter ("12:7-9").
- "people", "places": the people and places the question is about, as the BSB names them. "subjects": one to three
  plain topics ("the flood", "covenant").
"note": one sentence on anything you chose not to ask and why, or ""."""

SCHEMA = {"type": "object", "properties": {
    "questions": {"type": "array", "items": {"type": "object", "properties": {
        "question": {"type": "string"}, "answer": {"type": "string"},
        "wrong": {"type": "array", "items": {"type": "string"}},
        "verses": {"type": "array", "items": {"type": "string"}},
        "people": {"type": "array", "items": {"type": "string"}},
        "places": {"type": "array", "items": {"type": "string"}},
        "subjects": {"type": "array", "items": {"type": "string"}}},
        "required": ["question", "answer", "wrong", "verses", "people", "places", "subjects"],
        "additionalProperties": False}},
    "note": {"type": "string"}},
    "required": ["questions", "note"], "additionalProperties": False}


# --- the sections ------------------------------------------------------------------------------------------------

def chapters(book: str) -> list[dict]:
    files = sorted((BSB / book).glob("*.json"), key=lambda p: int(p.stem))
    return [chapter for f in files for chapter in json.loads(f.read_text(encoding="utf-8")).values()]


def headings_of(verse: dict) -> tuple[str | None, list[str]]:
    """A verse's section title (several on one verse joined) and the related-passage lines that follow a section
    heading. A bracketed "section heading" ("(Joshua–Malachi)", HEB 11:30) is a related line."""
    titles, related, after_title = [], [], False
    for kind, text in verse.get("h", []):
        bracketed = text.startswith("(") and text.endswith(")")
        if kind == "s" and not bracketed:
            titles.append(text)
            after_title = True
        elif (kind == "r" and after_title) or (kind == "s" and bracketed):
            related.append(text.strip("()"))
    return (" / ".join(titles) or None), related


def read_sections() -> list[dict]:
    """Every BSB section in Bible order: id ("GEN-1-1"), book, start and end (chapter, verse), title, words, and the
    raw related-passage lines."""
    sections: list[dict] = []
    for code, *_rest in BOOKS:
        for chapter in chapters(code):
            c = int(chapter["c"])
            for verse in chapter["v"]:
                v = int(verse["n"])
                title, related = headings_of(verse)
                if title:
                    sections.append({"id": f"{code}-{c}-{v}", "book": code, "start": (c, v), "end": (c, v),
                                     "title": title, "words": 0, "related_lines": related})
                elif related and sections:
                    sections[-1]["related_lines"] += related
                current = sections[-1]
                if current["book"] == code:
                    current["end"] = (c, v)
                    current["words"] += sum(len(x.split()) for x in verse["r"] if isinstance(x, str))
    return sections


class Locator:
    """Which section a verse is in."""

    def __init__(self, sections: list[dict]) -> None:
        self.sections = sections
        self.starts = [(ORDER[s["book"]], *s["start"]) for s in sections]

    def at(self, book: str, chapter: int, verse: int) -> dict | None:
        i = bisect.bisect_right(self.starts, (ORDER[book], chapter, verse)) - 1
        if i < 0:
            return None
        s = self.sections[i]
        return s if s["book"] == book and s["start"] <= (chapter, verse) <= s["end"] else None

    def overlapping(self, span: dict) -> list[dict]:
        start = (span["start"][0], span["start"][1] or 1)
        end = (span["end"][0], span["end"][1] or 999)
        return [s for s in self.sections if s["book"] == span["book"] and s["start"] <= end and s["end"] >= start]


def link_related(sections: list[dict], locator: Locator) -> None:
    """Each section's related sections, both ways, and its wave."""
    related: dict[str, set[str]] = {s["id"]: set() for s in sections}
    for s in sections:
        for line in s["related_lines"]:
            for span in parse_spans(line.replace("—", "–")) or []:
                hits = locator.overlapping(span)
                for other in hits if len(hits) <= BROAD else []:
                    if other["id"] != s["id"]:
                        related[s["id"]].add(other["id"])
                        related[other["id"]].add(s["id"])
    place = {s["id"]: n for n, s in enumerate(sections)}
    wave: dict[str, int] = {}
    for s in sections:  # in Bible order, so every earlier related section already has its wave
        s["related"] = sorted(related[s["id"]], key=place.get)
        s["wave"] = wave[s["id"]] = 1 + max((wave[r] for r in s["related"] if place[r] < place[s["id"]]), default=0)


def shown_by_section(locator: Locator) -> dict[str, list[dict]]:
    """The site's shown questions whose answer verses (grounding.json) lie in each section, as shown."""
    grounding = json.loads(GROUNDING.read_text(encoding="utf-8"))["questions"]
    found: dict[str, list[dict]] = {}
    for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]:
        record = grounding.get(q["id"])
        if q.get("repeat_of") or q.get("hidden") or not record or record["basis"] != "scripture":
            continue
        ids = set()
        for verse in record["verses"]:
            for key in verse["keys"]:
                book, _, place = key.partition(" ")
                c, v = map(int, place.split(":"))
                s = locator.at(book, c, v)
                if s:
                    ids.add(s["id"])
        for sid in ids:
            found.setdefault(sid, []).append({"question": q["question"], "answer": q.get("answer_choice") or q["answer"]})
    return found


def target(words: int, asked: int, words_per_question: int) -> int:
    return max(0, min(MAX_PER_SECTION, max(2, round(words / words_per_question))) - asked)


def build_map(words_per_question: int) -> tuple[list[dict], Locator, dict[str, list[dict]]]:
    sections = read_sections()
    locator = Locator(sections)
    link_related(sections, locator)
    shown = shown_by_section(locator)
    for s in sections:
        s["asked"] = len(shown.get(s["id"], []))
        s["target"] = target(s["words"], s["asked"], words_per_question)
    return sections, locator, shown


def write_map(words_per_question: int) -> None:
    sections, _locator, _shown = build_map(words_per_question)
    keep = ("id", "book", "start", "end", "title", "words", "related", "wave", "asked", "target")
    save_json(MAP, {"about": "The BSB's sections, the scaffold for writing the site's own questions "
                             "(scripts/question_writing.py). `asked`: shown questions grounded in it when this was "
                             "written; `target`: new questions to write.",
                    "words_per_question": words_per_question,
                    "counts": {"sections": len(sections), "wave 1": sum(s["wave"] == 1 for s in sections),
                               "with no question": sum(s["asked"] == 0 for s in sections),
                               "to write": sum(s["target"] for s in sections)},
                    "sections": [{k: s[k] for k in keep} for s in sections]})
    print(f"{len(sections)} sections, {sum(s['target'] for s in sections)} questions to write -> {MAP}")


# --- the written questions so far ----------------------------------------------------------------------------------

def load_candidates(run: str) -> dict:
    path = WORK / run / "candidates.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"questions": {}}


def save_candidates(run: str, data: dict) -> None:
    save_json(WORK / run / "candidates.json", data)


def load_written() -> dict:
    if WRITTEN.exists():
        return json.loads(WRITTEN.read_text(encoding="utf-8"))
    return {"about": "The site's own questions, written one BSB section at a time and passed by every review "
                     "(scripts/question_writing.py); read by build-question-bank.py as the bank written-bsb.",
            "questions": {}, "rejected": {}}


def written_records() -> list[dict]:
    """For build-question-bank.py: every published written question as a corpus record."""
    return list(load_written()["questions"].values())


def every_written() -> list[tuple[str, dict]]:
    """(id, text) of every question written in any run or published, rejected included: ids are never reused."""
    found = [(qid, c["text"]) for f in WORK.glob("*/candidates.json")
             for qid, c in json.loads(f.read_text(encoding="utf-8"))["questions"].items()]
    data = load_written()
    found += [(qid, {"question": r["question"], "answer": r["answer"]}) for qid, r in data["questions"].items()]
    found += [(qid, r) for qid, r in data["rejected"].items()]
    return found


def next_number(section_id: str, taken: list[str]) -> int:
    prefix = f"written:{section_id}:"
    return 1 + max((int(qid[len(prefix):]) for qid in taken if qid.startswith(prefix)), default=0)


def live_by_section() -> dict[str, list[dict]]:
    """Written questions not rejected, by section: what writers of linked sections are told was already written."""
    found: dict[str, list[dict]] = {}
    for f in WORK.glob("*/candidates.json"):
        for c in json.loads(f.read_text(encoding="utf-8"))["questions"].values():
            if c["status"] != "rejected":
                found.setdefault(c["section"], []).append({"question": c["text"]["question"],
                                                           "answer": c["text"]["answer"]})
    return found


# --- the writing call ----------------------------------------------------------------------------------------------

def section_label(section: dict) -> str:
    return label({"book": section["book"], "start": section["start"], "end": section["end"]})


def asked_lines(asked: list[dict]) -> list[str]:
    return [f"- {a['question']} ({a['answer']})" for a in asked] or ["- none"]


def item_text(section: dict, asked: list[dict], related: list[tuple[dict, list[dict]]], count: int) -> str:
    before, after = context_lines(section)
    lines = [f"Section: {section['title']} ({section_label(section)})", f"Write at most {count} new questions.", "",
             "Already asked on the site about this section (do not ask these again, in any wording):",
             *asked_lines(asked)]
    for other, other_asked in related:
        heading = (f"Already asked about a related passage, {other['title']} ({section_label(other)}); "
                   "do not ask the same things:")
        lines += ["", heading, *asked_lines(other_asked)]
    if before:
        lines += ["", "Just before the section (context only, do not ask about it):", *before]
    lines += ["", "BSB text of the section:", *verse_lines(section["book"], section["start"], section["end"])]
    if after:
        lines += ["", "Just after the section (context only, do not ask about it):", *after]
    return "\n".join(lines) + "\n"


def stage_folder(run: str, stage: str, new: bool) -> Path:
    existing = sorted((WORK / run).glob(f"{stage}-*"), key=lambda p: int(p.name.rsplit("-", 1)[1]))
    if not new:
        if not existing:
            raise SystemExit(f"no {stage} stage prepared in {WORK / run}")
        return existing[-1]
    folder = WORK / run / f"{stage}-{len(existing) + 1}"
    (folder / "items").mkdir(parents=True)
    return folder


def write_stage_files(folder: Path, task: str, schema: dict, index: dict) -> None:
    save_json(folder / "index.json", index)
    (folder / "task.txt").write_text(task, encoding="utf-8", newline="\n")
    (folder / "schema.json").write_text(json.dumps(schema), encoding="utf-8", newline="\n")


def prepare_write(run: str, books: list[str], section_ids: list[str], wave: int | None, limit: int,
                  words_per_question: int) -> None:
    sections, _locator, shown = build_map(words_per_question)
    by_id = {s["id"]: s for s in sections}
    done = {c["section"] for f in WORK.glob("*/candidates.json")
            for c in json.loads(f.read_text(encoding="utf-8"))["questions"].values()}
    place = {s["id"]: n for n, s in enumerate(sections)}

    def ready(s: dict) -> bool:  # every earlier related section with something to write is written
        return all(r in done or not by_id[r]["target"] for r in s["related"] if place[r] < place[s["id"]])

    chosen = [s for s in sections if s["target"] and s["id"] not in done
              and (not books or s["book"] in books) and (not section_ids or s["id"] in section_ids)
              and (wave is None or s["wave"] == wave)]
    waiting = [s["id"] for s in chosen if not ready(s)]
    if waiting:
        print(f"{len(waiting)} sections wait for a related earlier section to be written first: {waiting[:5]}")
        chosen = [s for s in chosen if ready(s)]
    if section_ids and len(chosen) + len(waiting) != len(section_ids):
        missing = sorted(set(section_ids) - {s["id"] for s in chosen})
        raise SystemExit(f"sections not found, already written, or with nothing to write: {missing}")
    chosen = chosen[:limit] if limit else chosen
    if not chosen:
        raise SystemExit("no section left to write for that choice")
    live = live_by_section()
    folder = stage_folder(run, "write", new=True)
    index = {}
    for s in chosen:
        related = [(by_id[r], shown.get(r, []) + live.get(r, [])) for r in s["related"]]
        name = s["id"]
        (folder / "items" / f"{name}.txt").write_text(item_text(s, shown.get(s["id"], []), related, s["target"]),
                                                      encoding="utf-8", newline="\n")
        index[name] = {"section": s, "asked": [a["question"] for a in shown.get(s["id"], [])]}
    write_stage_files(folder, TASK, SCHEMA, {"index": index})
    print(f"wrote {len(index)} sections ({sum(s['target'] for s in chosen)} questions at most) to {folder / 'items'}")


def apply_write(run: str, by: str) -> None:
    folder = stage_folder(run, "write", new=False)
    index = json.loads((folder / "index.json").read_text(encoding="utf-8"))["index"]
    data = load_candidates(run)
    taken = [qid for qid, _text in every_written()]
    counts, missing = Counter(), []
    for name, info in index.items():
        answer_file = folder / "out" / f"{name}.json"
        reply = json.loads(answer_file.read_text(encoding="utf-8")).get("structured_output") if answer_file.exists() else None
        if not reply:
            missing.append(name)
            continue
        section = {**info["section"], "start": tuple(info["section"]["start"]), "end": tuple(info["section"]["end"])}
        asked = list(info["asked"])
        if any(c["section"] == section["id"] for c in data["questions"].values()):
            counts["section already applied"] += 1
            continue
        for text in reply["questions"][:section["target"]]:
            qid = f"written:{section['id']}:{next_number(section['id'], taken)}"
            taken.append(qid)
            extra = text["wrong"][3:]  # a writer that gives a fourth wrong choice: the first three are used
            text = {**text, "wrong": text["wrong"][:3], **({"extra_wrong": extra} if extra else {})}
            why = gate({k: v for k, v in text.items() if k != "extra_wrong"}, section, asked)
            asked.append(text["question"])
            data["questions"][qid] = {"section": section["id"], "section_info": info["section"], "round": 1,
                                      "status": "rejected" if why else "review", "text": text, "by": by,
                                      "history": [{"stage": "gate", "round": 1, "passed": not why, "why": why or ""}]}
            counts[f"gate: {why}" if why else "passed the gate"] += 1
        data.setdefault("notes", {})[section["id"]] = reply["note"]
    save_candidates(run, data)
    print(f"{dict(counts)}; missing {len(missing)} {missing[:5]}")


# --- command line --------------------------------------------------------------------------------------------------

def main() -> None:
    import question_writing_review as review

    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    m = sub.add_parser("map")
    m.add_argument("--words-per-question", type=int, default=60)
    p = sub.add_parser("prepare")
    p.add_argument("stage", choices=["write", *review.STAGES])
    p.add_argument("run")
    p.add_argument("--books", default="")
    p.add_argument("--sections", default="")
    p.add_argument("--wave", type=int)
    p.add_argument("--limit", type=int, default=0)
    p.add_argument("--words-per-question", type=int, default=60)
    a = sub.add_parser("apply")
    a.add_argument("stage", choices=["write", *review.STAGES])
    a.add_argument("run")
    a.add_argument("--by", required=True, help="the model that answered, e.g. claude-sonnet-5-5")
    sub.add_parser("report").add_argument("run")
    sub.add_parser("publish").add_argument("run")
    args = parser.parse_args()
    if args.command == "map":
        write_map(args.words_per_question)
    elif args.command == "prepare" and args.stage == "write":
        prepare_write(args.run, [b for b in args.books.split(",") if b], [s for s in args.sections.split(",") if s],
                      args.wave, args.limit, args.words_per_question)
    elif args.command == "prepare":
        review.prepare(args.stage, args.run)
    elif args.command == "apply" and args.stage == "write":
        apply_write(args.run, args.by)
    elif args.command == "apply":
        review.apply(args.stage, args.run, args.by)
    elif args.command == "report":
        review.report(args.run)
    else:
        review.publish(args.run)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
