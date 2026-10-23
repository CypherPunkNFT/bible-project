"""Audit of shown questions against the Bible text (owner, 2026-10-22), after "What is the root of all evil?" was
found asking for words 1 Timothy 6:10 does not say, with "Desire for riches" and "Pursuit of wealth" as wrong choices.

Each question goes to one model call through BatchRunner with the BSB text of every passage it cites (and the passages
model-tags.json found for it), and comes back as keep, fix or hide, with what was wrong:
  misquote            the question or answer misquotes, distorts or overstates the Bible
  other_translation   a faithful quotation in another translation's words (mostly KJV), reworded to the BSB
  wrong_answer        the answer is wrong for the passage
  choice_also_right   a wrong choice is also right, or so close it could fairly be picked
  reference           no reference, or one that does not hold the answer
  other               anything else (a reference in brackets inside the answer, a typo, tradition asked as Scripture)
A reference in brackets at the end of a printed answer ("Creation (Gen 1 - 2)") is moved into the reference here
before the call, by rule, so the model sees its text and the choice no longer gives itself away.

Every reply is checked here before it is kept, and every decision is kept in content/questions/audit.json by question
id with the question as it was (`before`) and as it is shown now (`after`), so nothing is asked twice and nothing is
lost. build-question-bank.py applies it: a fix replaces the wording and choices, a hide sets `hidden` (the question
stays in the official bank, the page never shows it). A hidden question that was the one shown for a group of repeats
hands that place to the best of the rest.

    python scripts/question_audit.py prepare RUN --collection "Bible trivia (Hugging Face, liaaron1)" [--collection ...]
                                                [--ids a,b] [--sample N per collection] [--redo]
    python scripts/question_audit.py apply RUN OUT --by claude-sonnet-5-5 [--audit-file F]
    python scripts/question_audit.py report [--audit-file F]
    (then python scripts/build-question-bank.py)
RUN is a folder name under .local/question-audit/; OUT is BatchRunner's results folder for it. A pilot is applied with
--audit-file into its run folder, so only the full run reaches content/questions/audit.json.
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import random
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from bible.books import BOOKS  # noqa: E402
from bible.study_refs import RefError, normalise_book  # noqa: E402
from question_choices import FILLER, norm, shuffled, word_count  # noqa: E402
from question_model_tags import bible_book, check_passage  # noqa: E402
from question_tags import books_of, link_of, testament_of, topic_of  # noqa: E402

WEBSITE = Path(__file__).resolve().parent.parent
BANK = WEBSITE / "content" / "questions" / "question-bank.json"
AUDIT = WEBSITE / "content" / "questions" / "audit.json"
GROUNDING = WEBSITE / "content" / "questions" / "grounding.json"
WORK = WEBSITE / ".local" / "question-audit"

NEARBY = 2  # verses either side of a cited verse
PASSAGE_CHARS = 6000  # one passage's text at most (a whole chapter, "Ps 1:1-150:6")
ITEM_CHARS = 12000  # all of an item's Bible text at most
SHORT_ANSWER = 12  # an answer this short is its own right choice (as in question_choices.py)
RIGHT_MAX_WORDS = 25
ANSWER_MAX_WORDS = 80
GROWTH = 1.15  # how far past the limit, or the text's own length, a changed answer or right choice may grow
KINDS = ["misquote", "other_translation", "wrong_answer", "choice_also_right", "reference", "other"]
NAME = {code: name for code, name, _section, _osis in BOOKS}
BRACKET_REF = re.compile(r"\s*\(([^()]*\d[^()]*)\)\s*$")
STRONGS = re.compile(r"\s*/\s*Strong[’']?s\s+[GH]\d+", re.IGNORECASE)

TASK = """You check one multiple-choice question from a Baptist church's Bible website. The site's Bible is the Berean
Standard Bible (BSB); the input gives the BSB text of the passages the question cites. Judge by that text first, and
by what the rest of the Bible plainly says. For a catechism or lesson question, the right answer is the teaching the
catechism or lesson gives; judge its wrong choices by that teaching, and its Bible quotations by the BSB.

Look for these faults:
- "misquote": the question or answer misquotes, distorts or overstates what the Bible says. Words in quotation marks
  as the Bible's, or a well-known saying presented as Scripture, must say what the BSB says, no more and no less.
  Example: "the root of all evil" overstates 1 Timothy 6:10, which says "the root of all kinds of evil".
- "other_translation": wording taken from another translation, most often the KJV ("thee", "thou", "ye", "hath",
  "endureth", "Holy Ghost"), anywhere in the question, answer or choices, in quotation marks or not. The site uses
  the BSB for everything: reword it to the BSB text given (a quotation word for word as the BSB has it), and give the
  wrong choices the same modern wording so the right one does not stand out.
- "wrong_answer": the right answer is wrong, or only partly right, for what the Bible says.
- "choice_also_right": a wrong choice is also right, or so close in meaning that someone who knows the passage could
  fairly pick it: a synonym, a broader or narrower form of the answer, another name for the same person or place, or
  a detail also true in the story.
- "reference": the question has no reference, or its reference does not hold the answer.
- "other": anything else that makes it unfit: the answer gives itself away, a misspelling, two stories mixed up, or a
  question about church tradition or legend presented as the Bible.

Then decide:
- "keep": no fault. Return the question, answer, right choice, wrong choices and reference exactly as given.
- "fix": it can be made right. Change only what is needed: reword the question or answer to match the BSB, correct
  the answer, replace each wrong choice that is also right (keep the good ones word for word), correct or add the
  reference. A new wrong choice must be clearly wrong by the passage yet believable to someone who half-remembers:
  another person, place, number or thing from the same story or the same part of the Bible, in the same form and of
  about the same length as the right choice. Never "all of the above", a joke, or anything also true.
  Accuracy matters most, and a faulty question is worth saving: rather than drop it, reword it to ask what the
  Bible does say on the same subject, keeping the answer where it still fits. "What is the root of all evil?" becomes
  "What is the root of all kinds of evil?". "Who was crucified upside down?" (church tradition) can become "In John
  21:18-19, whose death did Jesus foretell?". A count the Bible does not give ("How many requests are in the Lord's
  Prayer?") can become a question the passage answers ("In the Lord's Prayer, what comes after 'Give us this day our
  daily bread'?").
- "hide": only as a last resort, when no fair question on that subject can be asked from the Bible text.
A question that is correct but could be worded better is "keep". Wording that is not a quotation need not copy the
BSB, but must not say more than it does.

Fields:
- "answer": the full right answer. "right": the right answer as a choice: the same as "answer" when that is 12 words or
  fewer, otherwise a short version of at most 20 words. Neither holds a Bible reference.
- "wrong": exactly three wrong choices. "reference": like "1 Tim 6:10" or "Gen 6-8; Heb 11:7", or "" if none fits
  (a question about the order of the books, for example). Give a reference only where you are sure it holds the answer.
- "problems": each fault found, with its kind and a one-line detail; empty for keep.
- "why": one plain sentence a church member could read, saying what was wrong and what changed; for keep, "No fault
  found."
The question must not contain its own answer."""

SCHEMA = {"type": "object", "properties": {
    "verdict": {"type": "string", "enum": ["keep", "fix", "hide"]},
    "problems": {"type": "array", "items": {"type": "object", "properties": {
        "kind": {"type": "string", "enum": KINDS}, "detail": {"type": "string"}},
        "required": ["kind", "detail"], "additionalProperties": False}},
    "question": {"type": "string"}, "answer": {"type": "string"}, "right": {"type": "string"},
    "wrong": {"type": "array", "items": {"type": "string"}},
    "reference": {"type": "string"}, "why": {"type": "string"}},
    "required": ["verdict", "problems", "question", "answer", "right", "wrong", "reference", "why"],
    "additionalProperties": False}


# --- references: every piece, with ranges ----------------------------------------------------------------------------

_POINT = r"(?:(?P<{p}book>(?:[1-3]\s*)?[A-Za-z][A-Za-z ]*?)\.?\s+)?(?P<{p}c>\d+)(?::(?P<{p}v>\d+))?"
_PIECE = re.compile(rf"^{_POINT.format(p='a')}(?:\s*[-–]\s*{_POINT.format(p='b')})?$")
DOTTED = re.compile(r"\b([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)")
DOTTED_CHAPTER = re.compile(r"\b([1-3]?[A-Za-z]+)\.(\d+)\b(?!\.)")
ASIDE = re.compile(r"\((?:NKJV|KJV|ESV|NIV|NASB)\)|\(\s*see(?: also)?\b|\)|\band\b", re.IGNORECASE)


def parse_spans(reference: str | None) -> list[dict] | None:
    """Each piece of a reference as {book, start: (chapter, verse|None), end: (chapter, verse|None)}, a piece without a
    book (or chapter) carrying the one before it ("Gen 17:17; 21:5", "Gen 27:1-3,23"). A range across two books
    ("Hos 1:1 - Mal 4:6") becomes its two ends. None if any piece cannot be read."""
    spans: list[dict] = []
    book = chapter = None
    reference = DOTTED.sub(r"\1 \2:\3", reference or "")  # the creeds' "Matt.6.10"
    reference = DOTTED_CHAPTER.sub(r"\1 \2", reference)  # "Ps.110"
    reference = ASIDE.sub(";", reference)  # "1st John 3:4 (See also Romans 14:23)", "(NKJV)", "and"
    for piece in re.split(r"[;,]", reference):
        piece = STRONGS.sub("", piece).strip().rstrip(".")
        if not piece:
            continue
        match = _PIECE.match(piece)
        if not match:
            return None
        try:
            if match["abook"]:
                book = normalise_book(match["abook"])
            first = (int(match["ac"]), int(match["av"]) if match["av"] else None)
            if not match["abook"] and not match["av"] and chapter is not None and spans and spans[-1]["start"][1]:
                first = (chapter, first[0])  # "Gen 27:1-3,23": 23 is a verse of chapter 27
            if book is None:
                return None
            chapter = first[0]
            if match["bc"] is None:
                spans.append({"book": book, "start": first, "end": first})
                continue
            if match["bbook"] and normalise_book(match["bbook"]) != book:
                end_book = normalise_book(match["bbook"])
                end = (int(match["bc"]), int(match["bv"]) if match["bv"] else None)
                spans += [{"book": book, "start": first, "end": first}, {"book": end_book, "start": end, "end": end}]
                book, chapter = end_book, end[0]
                continue
            if match["bv"]:
                end = (int(match["bc"]), int(match["bv"]))
            elif first[1] is not None:
                end = (first[0], int(match["bc"]))  # "5:3-12"
            else:
                end = (int(match["bc"]), None)  # "Gen 6 - 8"
            spans.append({"book": book, "start": first, "end": end})
            chapter = end[0]
        except RefError:
            return None
    return spans


def span_keys(span: dict, nearby: int = 0) -> list[tuple[int, int]] | None:
    """The BSB verse keys a span covers (with `nearby` verses either side of a verse span), or None if either end
    does not exist."""
    if span["book"] not in NAME:
        return None
    try:
        verses = bible_book(span["book"])
    except FileNotFoundError:
        return None
    keys = sorted(verses)
    chapters = {c for c, _v in keys}
    (c1, v1), (c2, v2) = span["start"], span["end"]
    if c1 not in chapters or c2 not in chapters or (v1 and (c1, v1) not in verses) or (v2 and (c2, v2) not in verses):
        return None
    low = (c1, v1 or 0)
    high = (c2, v2 or 10_000)
    if high < low:
        return None
    inside = [k for k in keys if low <= k <= high]
    if v1 and nearby:
        first, last = keys.index(inside[0]), keys.index(inside[-1])
        inside = keys[max(0, first - nearby):last + nearby + 1]
        inside = [k for k in inside if k[0] in (c1, c2)]
    return inside


def reference_ok(reference: str) -> bool:
    spans = parse_spans(reference)
    return bool(spans) and all(span_keys(s) for s in spans)


def label(span: dict) -> str:
    (c1, v1), (c2, v2) = span["start"], span["end"]
    name = NAME[span["book"]]
    if (c1, v1) == (c2, v2):
        return f"{name} {c1}:{v1}" if v1 else f"{name} {c1}"
    if c1 == c2 and v1 and v2:
        return f"{name} {c1}:{v1}-{v2}"
    return f"{name} {c1}{f':{v1}' if v1 else ''}-{c2}{f':{v2}' if v2 else ''}"


def bible_text(spans: list[dict]) -> str:
    blocks, seen, total = [], set(), 0
    for span in spans:
        keys = [k for k in (span_keys(span, NEARBY) or []) if (span["book"], k) not in seen]
        if not keys:
            continue
        verses = bible_book(span["book"])
        lines, size = [], 0
        for key in keys:
            line = f"{key[0]}:{key[1]} {verses[key]}"
            if size + len(line) > PASSAGE_CHARS or total + size + len(line) > ITEM_CHARS:
                lines.append("(the passage continues)")
                break
            lines.append(line)
            size += len(line) + 1
            seen.add((span["book"], key))
        total += size
        blocks.append(f"[{label(span)}]\n" + "\n".join(lines))
    return "\n\n".join(blocks)


def tag_spans(passages: list[dict]) -> list[dict]:
    spans = []
    for p in passages or []:
        start = (p["chapter"], p.get("verse"))
        end = (p["chapter"], p.get("verse_end") or p.get("verse"))
        spans.append({"book": p["book"], "start": start, "end": end})
    return spans


# --- prepare ---------------------------------------------------------------------------------------------------------

def load_audit(path: Path | None = None) -> dict:
    path = path or AUDIT
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {"about": "Audit of shown questions against the BSB text; written by scripts/question_audit.py, applied by "
                     "build-question-bank.py. `before` is the question as it was, `after` as shown since.",
            "questions": {}}


def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    os.replace(temporary, path)


def as_sent(q: dict) -> dict:
    """The question as it is, and its record "before"."""
    return {"question": q["question"], "answer": q["answer"], "right": q.get("answer_choice") or q["answer"],
            "options": list(q.get("options") or []), "reference": q.get("reference") or ""}


def cleaned(before: dict) -> tuple[dict, str | None]:
    """Move a reference in brackets at the end of the answer into the reference, by rule."""
    match = BRACKET_REF.search(before["answer"])
    if not match:
        return before, None
    found = STRONGS.sub("", match.group(1)).strip()
    sent = dict(before)
    sent["answer"] = before["answer"][:match.start()].strip()
    sent["right"] = BRACKET_REF.sub("", before["right"]).strip() or sent["answer"]
    sent["options"] = [sent["right"] if o == before["right"] else o for o in before["options"]]
    if not before["reference"] and reference_ok(found):
        sent["reference"] = found
    note = f'The printed answer ended "({match.group(1)})"; it was taken out of the answer'
    return sent, note + (" and made the reference." if sent["reference"] != before["reference"] else ".")


def item_text(q: dict, sent: dict, note: str | None, doubt: str = "") -> str:
    lines = [f"Kind: {q['kind']} ({q['collection']})"]
    if doubt:  # from question_grounding.py, about the wording the site shows now, which may already be a fix
        lines += [f"As the site shows it now, after an earlier fix: {q['question']} Answer: {q['answer']}",
                  f"A second reader doubts that answer: {doubt} Check this against the BSB text; fix the question "
                  "only if the doubt is right, and say why either way.", ""]
    if q.get("lead_in"):
        lines.append(f"Shown first: {q['lead_in']['question']} Answer: {q['lead_in']['answer']}")
    lines += [f"Question: {sent['question']}", f"Answer: {sent['answer']}"]
    if sent["right"] != sent["answer"]:
        lines.append(f"Right choice: {sent['right']}")
    wrong = [o for o in sent["options"] if o != sent["right"]]
    lines.append("Wrong choices: " + " | ".join(wrong))
    lines.append(f"Reference: {sent['reference'] or 'none'}")
    if note:
        lines.append(f"Note: {note}")
    spans = (parse_spans(sent["reference"]) or []) + tag_spans(q.get("passages"))
    text = bible_text(spans)
    lines += ["", "BSB text:", text or "No Bible text found for this question."]
    return "\n".join(lines) + "\n"


def prepare(run: str, collections: list[str], ids: list[str], sample: int, seed: int, redo: bool,
            doubts: bool = False) -> None:
    audit = load_audit()["questions"]
    questions = [q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]
                 if not q.get("repeat_of") and not q.get("hidden")]
    doubt_of = {}
    if doubts:  # the grounding pass doubted a Bible quiz or lesson answer: audit it again with that doubt
        doubt_of = {qid: r["doubt"] for qid, r in json.loads(GROUNDING.read_text(encoding="utf-8"))["questions"].items()
                    if r["doubt"]}
        questions = [q for q in questions if q["id"] in doubt_of and q["kind"] in ("trivia", "lesson")]
        redo = True
    if ids:
        questions = [q for q in questions if q["id"] in ids]
    if collections:
        questions = [q for q in questions if q["collection"] in collections]
    if not redo:
        questions = [q for q in questions if q["id"] not in audit]
    if sample:  # `sample` questions from each collection, or all of a smaller one
        by_collection: dict[str, list[dict]] = {}
        for q in questions:
            by_collection.setdefault(q["collection"], []).append(q)
        questions = [q for group in by_collection.values()
                     for q in random.Random(seed).sample(group, min(sample, len(group)))]
    if not questions:
        raise SystemExit(f"no shown questions left to audit (collections {collections}, ids {ids})")
    folder = WORK / run
    items = folder / "items"
    if items.exists() and any(items.iterdir()):
        raise SystemExit(f"{items} already holds items: use a new RUN name, so a run in progress is never changed")
    items.mkdir(parents=True, exist_ok=True)
    index, sent_by_name = {}, {}
    for q in questions:
        before = audit[q["id"]]["before"] if q["id"] in audit else as_sent(q)
        sent, note = cleaned(before)
        name = "q-" + re.sub(r"[^A-Za-z0-9]+", "-", q["id"])[-60:]
        (items / f"{name}.txt").write_text(item_text(q, sent, note, doubt_of.get(q["id"], "")), encoding="utf-8",
                                           newline="\n")
        index[name] = q["id"]
        sent_by_name[name] = {"before": before, "sent": sent, "note": note, "collection": q["collection"]}
    save_json(folder / "index.json", {"index": index, "sent": sent_by_name})
    (folder / "task.txt").write_text(TASK, encoding="utf-8", newline="\n")
    (folder / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    print(f"wrote {len(index)} items to {items}")


# --- apply -----------------------------------------------------------------------------------------------------------

def contains(haystack: str, needle: str) -> bool:
    return len(needle) > 3 and f" {needle} " in f" {haystack} "


def checked(reply: dict, sent: dict, note: str | None) -> tuple[dict | None, str]:
    """The record's verdict, problems and `after`, or None and why the reply was refused."""
    verdict, problems = reply["verdict"], list(reply.get("problems") or [])
    if note:
        problems.insert(0, {"kind": "other", "detail": note})
    if verdict == "hide":
        if not reply["why"].strip():
            return None, "hide without a reason"
        return {"verdict": "hide", "problems": problems, "after": None}, ""
    if verdict == "keep":
        reply = {**reply, "question": sent["question"], "answer": sent["answer"], "right": sent["right"],
                 "wrong": [o for o in sent["options"] if o != sent["right"]], "reference": sent["reference"]}
    question, answer, reference = reply["question"].strip(), reply["answer"].strip(), reply["reference"].strip()
    right = answer if word_count(answer) <= SHORT_ANSWER else reply["right"].strip()
    wrong = [w.strip() for w in reply["wrong"]]
    if not question or not answer or not right:
        return None, "empty question, answer or right choice"
    # a changed text may grow a little past the limit or its own length: a long catechism answer re-quoted in the BSB
    if (right != sent["right"] and word_count(right) > GROWTH * max(RIGHT_MAX_WORDS, word_count(sent["right"]))) or (
            answer != sent["answer"] and word_count(answer) > GROWTH * max(ANSWER_MAX_WORDS, word_count(sent["answer"]))):
        return None, "answer or right choice too long"
    if BRACKET_REF.search(answer):
        return None, "reference left in the answer"
    if len(wrong) != 3 or not all(wrong):
        return None, "not three wrong choices"
    seen = {norm(right), norm(answer)}
    for w in wrong:
        if norm(w) in seen or FILLER.search(w):
            return None, "a wrong choice repeats the right one, another choice, or is filler"
        seen.add(norm(w))
    if contains(norm(question), norm(right)) and not contains(norm(sent["question"]), norm(sent["right"])):
        return None, "the new question holds its own answer"
    if reference and reference != sent["reference"] and not reference_ok(reference):
        return None, "a reference that does not exist in the BSB"
    after = {"question": question, "answer": answer, "right": right, "reference": reference,
             "options": [right, *wrong]}
    unchanged = (question, answer, right, reference) == (sent["question"], sent["answer"], sent["right"],
                                                         sent["reference"]) and set(wrong) == set(
        o for o in sent["options"] if o != sent["right"])
    if unchanged and not note:
        return {"verdict": "keep", "problems": [], "after": None}, ""
    if not problems:
        return None, "a change without a fault named"
    return {"verdict": "fix", "problems": problems, "after": after}, ""


def apply(run: str, out_dir: Path, by: str, audit_file: Path) -> None:
    folder = WORK / run
    run_index = json.loads((folder / "index.json").read_text(encoding="utf-8"))
    data = load_audit(audit_file)
    today = datetime.date.today().isoformat()
    kept, refused, missing = Counter(), Counter(), []
    for name, qid in run_index["index"].items():
        answer_file = out_dir / f"{name}.json"
        reply = json.loads(answer_file.read_text(encoding="utf-8")).get("structured_output") if answer_file.exists() else None
        if not reply:
            missing.append(name)
            continue
        info = run_index["sent"][name]
        result, why = checked(reply, info["sent"], info["note"])
        if result is None:
            refused[why] += 1
            continue
        if result["after"]:
            result["after"]["options"] = shuffled(qid, result["after"]["options"])
        why = reply["why"].strip()
        if result["verdict"] == "keep":
            why = "No fault found."
        elif reply["verdict"] == "keep":
            why = info["note"]  # only the reference was moved out of the answer, by rule
        data["questions"][qid] = {"collection": info["collection"], "verdict": result["verdict"],
                                  "problems": result["problems"], "why": why,
                                  "by": by, "audited": today, "before": info["before"], "after": result["after"]}
        kept[result["verdict"]] += 1
    data["questions"] = dict(sorted(data["questions"].items()))
    save_json(audit_file, data)
    print(f"recorded {dict(kept)}; refused {dict(refused)}; missing {len(missing)} {missing[:5]}")
    print("refused or missing questions are sent again by the next prepare (new RUN name)")


def report(audit_file: Path) -> None:
    records = load_audit(audit_file)["questions"]
    print(f"{len(records)} audited: {dict(Counter(r['verdict'] for r in records.values()))}")
    print("faults:", dict(Counter(p["kind"] for r in records.values() for p in r["problems"])))
    for qid, r in records.items():
        if r["verdict"] == "keep":
            continue
        print(f"\n[{r['verdict']}] {qid}\n  was: {r['before']['question']} -> {r['before']['right']} "
              f"| wrong: {[o for o in r['before']['options'] if o != r['before']['right']]} | {r['before']['reference']}")
        if r["after"]:
            a = r["after"]
            print(f"  now: {a['question']} -> {a['right']} | wrong: {[o for o in a['options'] if o != a['right']]} "
                  f"| {a['reference']}")
        print(f"  why: {r['why']}")


# --- used by build-question-bank.py ----------------------------------------------------------------------------------

def apply_audit(questions: list[dict]) -> dict:
    """Apply audit.json to the built questions: a fix replaces the wording, choices and reference, a hide sets
    `hidden`. A record whose `before` no longer matches the question (its source changed) is skipped and counted."""
    records = load_audit()["questions"]
    counts = Counter()
    for q in questions:
        q["hidden"], q["audit"] = None, None
        record = records.get(q["id"])
        if not record:
            continue
        before = as_sent(q)
        if {**before, "options": sorted(before["options"])} != {**record["before"],
                                                                "options": sorted(record["before"]["options"])}:
            counts["stale"] += 1
            print(f"  audit record is stale (the question changed since): {q['id']}")
            continue
        q["audit"] = {"verdict": record["verdict"], "kinds": sorted({p["kind"] for p in record["problems"]}),
                      "why": record["why"], "by": record["by"]}
        counts[record["verdict"]] += 1
        if record["verdict"] == "hide":
            q["hidden"] = record["why"]
        elif record["verdict"] == "fix":
            fixed(q, record)
    counts["promoted"] = promote_from_hidden(questions)
    return dict(counts)


def fixed(q: dict, record: dict) -> None:
    after = record["after"]
    old_wrong = set(record["before"]["options"]) - {record["before"]["right"]}
    q["question"], q["answer"], q["answer_choice"] = after["question"], after["answer"], after["right"]
    if set(after["options"]) - {after["right"]} != old_wrong:
        q["options_by"] = f"{q.get('options_by')}, audited by {record['by']}"
    q["options"] = after["options"]
    q["reference"] = after["reference"] or None
    q["books"] = books_of(q["question"], q["answer"], q["reference"])
    q["topic"] = topic_of(q["question"], q["answer"], q.get("lesson"), q["kind"], q["books"])
    q["testament"] = testament_of(q["kind"], q["books"], q["topic"])
    q["link"] = link_of(q["reference"])
    passages = [{"book": s["book"], "chapter": s["start"][0], "verse": s["start"][1],
                 "verse_end": s["end"][1] if s["end"][0] == s["start"][0] else None}
                for s in parse_spans(q["reference"]) or []]
    kept: list[dict] = []
    for p in passages + list(q.get("passages") or []):
        p = check_passage(p, q)
        if p and not any(inside(p, k) for k in kept):
            kept.append(p)
    q["passages"] = kept


def inside(p: dict, other: dict) -> bool:
    """Whether passage p is already covered by `other` (the same chapter, a verse within its verses)."""
    if (p["book"], p["chapter"]) != (other["book"], other["chapter"]):
        return False
    if not other["verse"]:
        return True
    return bool(p["verse"]) and other["verse"] <= p["verse"] <= (other["verse_end"] or other["verse"]) and (
        (p["verse_end"] or p["verse"]) <= (other["verse_end"] or other["verse"]))


def promote_from_hidden(questions: list[dict]) -> int:
    """A hidden question that was shown for a group of repeats hands its place to the best of the rest, ranked as
    question_repeats.py ranks them (and a bank question before a mined one)."""
    order = {q["id"]: n for n, q in enumerate(questions)}

    def rank(q: dict) -> tuple:
        return (not q["id"].startswith("mined:"), q.get("options_by") == "source", q.get("tradition") == "Baptist",
                bool(q.get("reference")), q["source_id"] == q.get("attribution_source_id"), -order[q["id"]])

    members: dict[str, list[dict]] = {}
    for q in questions:
        if q.get("repeat_of"):
            members.setdefault(q["repeat_of"], []).append(q)
    promoted = 0
    for q in questions:
        if not q["hidden"] or q.get("repeat_of"):
            continue
        group = [m for m in members.get(q["id"], []) if not m["hidden"]]
        if not group:
            continue
        keep = max(group, key=rank)
        for m in members[q["id"]]:
            m["repeat_of"] = None if m is keep else keep["id"]
        promoted += 1
    return promoted


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("prepare")
    p.add_argument("run")
    p.add_argument("--collection", action="append", default=[], help="repeat for several")
    p.add_argument("--ids", default="")
    p.add_argument("--sample", type=int, default=0)
    p.add_argument("--seed", type=int, default=22)
    p.add_argument("--redo", action="store_true", help="also questions already in audit.json")
    p.add_argument("--doubts", action="store_true", help="Bible quiz and lesson answers the grounding pass doubted")
    a = sub.add_parser("apply")
    a.add_argument("run")
    a.add_argument("out_dir", type=Path)
    a.add_argument("--by", required=True, help="the model that answered, e.g. claude-sonnet-5-5")
    a.add_argument("--audit-file", type=Path, default=AUDIT)
    r = sub.add_parser("report")
    r.add_argument("--audit-file", type=Path, default=AUDIT)
    args = parser.parse_args()
    if args.command == "prepare":
        ids = [i for i in args.ids.split(",") if i]
        prepare(args.run, args.collection, ids, args.sample, args.seed, args.redo, args.doubts)
    elif args.command == "apply":
        apply(args.run, args.out_dir.resolve(), args.by, args.audit_file.resolve())
    else:
        report(args.audit_file.resolve())


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
