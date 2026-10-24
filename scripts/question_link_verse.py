"""Which verse a question's "Read the verse" opens (owner, 2026-10-24: "How can you glorify God?" opened 1 Corinthians
10:31, which says to do all for God's glory but not how; the answer, loving him and doing what he commands, is
1 John 5:3).

The site opens a question's first reference. When the answer's words are not in or near that verse (its tagged
passage is not "matched", scripts/question_model_tags.py), Claude Opus is shown every verse the question cites or was
grounded in (scripts/question_grounding.py), each with its BSB text, and picks the one that shows the answer, or none.
The choice is kept in content/questions/link-verse.json by question id, with a fingerprint of the question, answer
and reference, so a reworded question is asked again; the build opens the chosen verse instead of the first one.

    python scripts/question_link_verse.py prepare           # BatchRunner items for links not yet checked
    python scripts/question_link_verse.py apply <out-dir>   # record the choices
    (then python scripts/build-question-bank.py)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

from question_audit import parse_spans
from question_model_tags import bible_book

WEBSITE = Path(__file__).resolve().parent.parent
BANK = WEBSITE / "content" / "questions" / "question-bank.json"
CHOICES = WEBSITE / "content" / "questions" / "link-verse.json"
WORK = WEBSITE / ".local" / "question-link-verse"

QUESTIONS_PER_CALL = 20
VERSES_PER_SPAN = 6
VERSES_PER_QUESTION = 30
MODEL = "claude-opus-5-5"

TASK = """You choose which Bible verse a quiz question's "Read the verse" link opens.

Each question comes with its answer and the verses it cites, each with its text from the Berean Standard Bible. Pick
the one verse a reader should open to see that the answer is right: the verse that states the answer, or teaches it
most directly. A verse that is only about the question's subject, and does not show the answer, is not enough. When
two verses both show it, pick the one that shows more of the answer.

Give "verse" as the verse's label exactly as written in the input ("1JN 5:3"), or "none" when no listed verse shows
the answer. Give "why" in one short plain sentence. "q" is the question's number as written (q1, q2, ...)."""

SCHEMA = {"type": "object", "properties": {"choices": {"type": "array", "items": {
    "type": "object", "properties": {"q": {"type": "string"}, "verse": {"type": "string"}, "why": {"type": "string"}},
    "required": ["q", "verse", "why"], "additionalProperties": False}}},
    "required": ["choices"], "additionalProperties": False}


def load_choices() -> dict:
    if CHOICES.exists():
        return json.loads(CHOICES.read_text(encoding="utf-8"))
    return {"about": "The verse each question's Read the verse link opens, where the first reference does not hold the "
                     "answer; chosen by Claude Opus, written by scripts/question_link_verse.py.", "questions": {}}


def fingerprint(q: dict) -> str:
    text = json.dumps([q["question"], q["answer"], q["reference"]], ensure_ascii=False)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def link_matched(q: dict) -> bool:
    """Whether the answer's words are in or near the verse the link opens."""
    link = q["link"]
    return any(p["book"] == link["book"] and p["chapter"] == link["chapter"] and p["verse"] == link["verse"]
               and p["check"] == "matched" for p in q.get("passages") or [])


def candidate_verses(q: dict) -> dict[str, tuple[str, int, int]]:
    """Every verse the question cites, was grounded in or was tagged with, in that order, by label ("1JN 5:3")."""
    references = [q["reference"] or "", *(q.get("grounding") or {}).get("verses", [])]
    spans = [s for ref in references for s in parse_spans(ref) or []]
    spans += [{"book": p["book"], "start": (p["chapter"], p["verse"]), "end": (p["chapter"], p["verse_end"] or p["verse"])}
              for p in q.get("passages") or [] if p["verse"]]
    found: dict[str, tuple[str, int, int]] = {}
    for span in spans:
        verses = bible_book(span["book"])
        (chapter, first), (end_chapter, last) = span["start"], span["end"]
        if first is None:  # a whole chapter: no one verse to open
            continue
        if chapter != end_chapter or last is None:
            last = first
        for verse in range(first, last + 1)[:VERSES_PER_SPAN]:
            if (chapter, verse) in verses:
                found.setdefault(f"{span['book']} {chapter}:{verse}", (span["book"], chapter, verse))
    return dict(list(found.items())[:VERSES_PER_QUESTION])


def current(q: dict, chosen: dict) -> bool:
    record = chosen.get(q["id"])
    return bool(record) and record["of"] == fingerprint(q)


# --- used by build-question-bank.py --------------------------------------------------------------------------------

def apply_link_verses(questions: list[dict]) -> int:
    """Open the chosen verse instead of the first reference; return how many links changed."""
    chosen = load_choices()["questions"]
    changed = 0
    for q in questions:
        record = chosen.get(q["id"])
        if not (record and record["verse"] and record["of"] == fingerprint(q)):
            continue
        link = {"book": record["verse"]["book"], "chapter": record["verse"]["chapter"], "verse": record["verse"]["verse"]}
        changed += link != q["link"]
        q["link"] = link
    return changed


# --- prepare and apply -----------------------------------------------------------------------------------------------

def prepare() -> None:
    chosen = load_choices()["questions"]
    questions = [q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]
                 if not q.get("repeat_of") and not q.get("hidden") and q["link"] and not link_matched(q)
                 and not current(q, chosen) and candidate_verses(q)]  # no verse at all: the link opens a chapter
    items = WORK / "items"
    items.mkdir(parents=True, exist_ok=True)
    for old in items.glob("*.txt"):
        old.unlink()
    index = {}
    for start in range(0, len(questions), QUESTIONS_PER_CALL):
        chunk = questions[start:start + QUESTIONS_PER_CALL]
        name = f"questions-{start // QUESTIONS_PER_CALL + 1:03d}"
        lines, entries = [], []
        for n, q in enumerate(chunk, 1):
            verses = candidate_verses(q)
            lines += [f"q{n}", f"  Question: {q['question']}", f"  Answer: {q.get('answer_choice') or q['answer']}", "  Verses:"]
            lines += [f"    {label} {bible_book(book)[(chapter, verse)]}" for label, (book, chapter, verse) in verses.items()]
            lines.append("")
            entries.append([q["id"], fingerprint(q), list(verses)])
        (items / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
        index[name] = entries
    (WORK / "items-index.json").write_text(json.dumps(index, indent=1), encoding="utf-8", newline="\n")
    (WORK / "task.txt").write_text(TASK, encoding="utf-8", newline="\n")
    (WORK / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    print(f"links to check: {len(questions)}; wrote {len(index)} BatchRunner items to {items}")


def apply(out_dir: Path) -> None:
    index = json.loads((WORK / "items-index.json").read_text(encoding="utf-8"))
    data = load_choices()
    counts, missing = {"verse": 0, "none": 0}, []
    for name, entries in index.items():
        answer_file = out_dir / f"{name}.json"
        if not answer_file.exists():
            missing.append(name)
            continue
        reply = json.loads(answer_file.read_text(encoding="utf-8"))
        by_number = {c["q"]: c for c in (reply.get("structured_output") or {}).get("choices") or []}
        for n, (qid, of, labels) in enumerate(entries, 1):
            choice = by_number.get(f"q{n}")
            label = (choice or {}).get("verse", "").strip()
            if choice is None or (label != "none" and label not in labels):
                missing.append(f"{name}:q{n}")
                continue
            verse = None
            if label != "none":
                book, place = label.split(" ")
                chapter, number = place.split(":")
                verse = {"book": book, "chapter": int(chapter), "verse": int(number)}
            data["questions"][qid] = {"verse": verse, "why": choice["why"], "of": of, "by": MODEL}
            counts["verse" if verse else "none"] += 1
    data["questions"] = dict(sorted(data["questions"].items()))
    CHOICES.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"recorded {counts}; not recorded (no reply, or a verse not offered): {len(missing)} {missing[:10]}")


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
