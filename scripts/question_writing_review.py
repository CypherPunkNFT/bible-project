"""The reviews a written question must pass after the script's gate (question_writing.py), and publishing.

  open    Claude Haiku takes the quiz blind, with the section's BSB text: it must pick the writer's answer, call no other
          choice right by the section or anywhere in the Bible, and find the answer in the section's text.
  closed  Claude Haiku sees only the questions, as a quiz-taker does: each must be clear on its own, no other choice
          may be right anywhere in the Bible, and a confident pick must be the writer's answer.
  check   a fresh Claude Sonnet call runs the site's own BSB audit (question_audit.TASK and its reply checks). "keep"
          passes. A "fix" in round 1 becomes round 2: the fixed wording goes through the gate, open, closed and check
          again. A fault in round 2, or "hide", rejects it.
open and closed may run at the same time; a question reaches check only when both passed.
"""

from __future__ import annotations

import datetime
import json
from collections import Counter
from pathlib import Path

from question_audit import AUDIT, SCHEMA as AUDIT_SCHEMA, TASK as AUDIT_TASK, checked, item_text, label, load_audit, \
    parse_spans, save_json
from question_choices import shuffled
from question_model_tags import check_passage, load_tags, save_tags
from question_writing import NAME, WRITTEN, load_candidates, load_written, save_candidates, stage_folder, write_stage_files
from question_writing_gate import cited_keys, gate, verse_lines

STAGES = ["open", "closed", "check"]
LETTERS = "ABCD"
COLLECTION = "Written for the site from the BSB"
SOURCE = "bible-site-written"
ROUNDS = 2

OPEN_TASK = """You take a Bible quiz to test it before a church website shows it. The input gives one section of the
Berean Standard Bible (BSB) and quiz questions on it, each with four lettered choices. No answers are given.

For each question:
- "q": its label as given (q1, q2, ...).
- "pick": the letter of the choice the section shows to be right.
- "also_right": the letters of any other choice that is also right, or could fairly be argued for, by this section or
  by anything else in the Bible: another name for the same person or place, a broader or narrower form of the answer,
  a detail also true in the story, something true of another person elsewhere in Scripture. Empty if none.
- "answerable": true only if the section's text alone settles the answer.
- "note": one line saying why, when also_right is not empty or answerable is false; otherwise "".
Judge each question on its own. Be strict: a question with any doubt is better caught now."""

CLOSED_TASK = """You check Bible quiz questions before a church website shows them. You see each one only as a
quiz-taker will: no Bible passage and no question before it, just the question and four lettered choices.

For each question:
- "q": its label as given (q1, q2, ...).
- "clear": true if someone who knows the Bible can tell exactly what is asked from the question alone: it names whom
  or what it is about, and it has one right answer. False if it leans on something it does not say ("What did he
  name the place?"), or could mean more than one thing.
- "pick": the letter you would choose from what the Bible says, only if you are sure; otherwise "".
- "also_right": the letters of any choice, other than your pick, that could also be right somewhere in the Bible or
  that a careful reader could fairly argue for. Empty if none.
- "note": one line saying why, when clear is false or also_right is not empty; otherwise ""."""


def answers_schema(fields: dict, required: list[str]) -> dict:
    return {"type": "object", "properties": {"answers": {"type": "array", "items": {
        "type": "object", "properties": {"q": {"type": "string"}, **fields},
        "required": ["q", *required], "additionalProperties": False}}},
        "required": ["answers"], "additionalProperties": False}


LETTER_LIST = {"type": "array", "items": {"type": "string", "enum": list(LETTERS)}}
OPEN_SCHEMA = answers_schema({"pick": {"type": "string", "enum": list(LETTERS)}, "also_right": LETTER_LIST,
                              "answerable": {"type": "boolean"}, "note": {"type": "string"}},
                             ["pick", "also_right", "answerable", "note"])
CLOSED_SCHEMA = answers_schema({"clear": {"type": "boolean"}, "pick": {"type": "string", "enum": ["", *LETTERS]},
                                "also_right": LETTER_LIST, "note": {"type": "string"}},
                               ["clear", "pick", "also_right", "note"])


def section_of(candidate: dict) -> dict:
    s = candidate["section_info"]
    return {**s, "start": tuple(s["start"]), "end": tuple(s["end"])}


def options_of(qid: str, text: dict) -> list[str]:
    return shuffled(qid, [text["answer"].strip(), *(w.strip() for w in text["wrong"])])


def reference_of(candidate: dict) -> str:
    """The cited verses as a reference the rest of the site reads ("Genesis 12:7; Genesis 12:9")."""
    section = section_of(candidate)
    keys = cited_keys(candidate["text"]["verses"], section) or []
    spans: list[dict] = []
    for c, v in keys:
        if spans and spans[-1]["end"] == (c, v - 1):
            spans[-1]["end"] = (c, v)
        else:
            spans.append({"book": section["book"], "start": (c, v), "end": (c, v)})
    return "; ".join(label(s) for s in spans)


def waiting(candidate: dict, stage: str) -> bool:
    if candidate["status"] != ("check" if stage == "check" else "review"):
        return False
    return stage == "check" or not any(h["stage"] == stage and h["round"] == candidate["round"]
                                       for h in candidate["history"])


# --- prepare -------------------------------------------------------------------------------------------------------

def quiz_lines(group: list[tuple[str, dict]]) -> tuple[list[str], dict]:
    lines, labels = [], {}
    for n, (qid, candidate) in enumerate(group, 1):
        options = options_of(qid, candidate["text"])
        labels[f"q{n}"] = {"id": qid, "right": LETTERS[options.index(candidate["text"]["answer"].strip())]}
        lines += [f"q{n}. {candidate['text']['question']}",
                  *(f"   {letter}. {option}" for letter, option in zip(LETTERS, options)), ""]
    return lines, labels


def prepare(stage: str, run: str) -> None:
    data = load_candidates(run)
    chosen = [(qid, c) for qid, c in data["questions"].items() if waiting(c, stage)]
    if not chosen:
        raise SystemExit(f"no question in {run} is waiting for {stage}")
    folder = stage_folder(run, stage, new=True)
    index = {}
    if stage == "check":
        for qid, c in chosen:
            name = qid.replace(":", "-")
            sent = {"question": c["text"]["question"], "answer": c["text"]["answer"], "right": c["text"]["answer"],
                    "options": options_of(qid, c["text"]), "reference": reference_of(c)}
            section = section_of(c)
            q = {"kind": "trivia", "collection": COLLECTION,
                 "passages": [{"book": section["book"], "chapter": section["start"][0], "verse": section["start"][1],
                               "verse_end": section["end"][1] if section["start"][0] == section["end"][0] else None}]}
            (folder / "items" / f"{name}.txt").write_text(item_text(q, sent, None), encoding="utf-8", newline="\n")
            index[name] = {"id": qid, "sent": sent}
        write_stage_files(folder, AUDIT_TASK, AUDIT_SCHEMA, {"stage": stage, "index": index})
    else:
        by_section: dict[str, list[tuple[str, dict]]] = {}
        for qid, c in chosen:
            by_section.setdefault(c["section"], []).append((qid, c))
        for sid, group in by_section.items():
            lines, labels = quiz_lines(group)
            if stage == "open":
                s = section_of(group[0][1])
                lines = [f"Section: {s['title']} ({NAME[s['book']]})", "", "BSB text:",
                         *verse_lines(s["book"], s["start"], s["end"]), "", "Questions:", "", *lines]
            name = f"{sid}-r{group[0][1]['round']}"
            (folder / "items" / f"{name}.txt").write_text("\n".join(lines), encoding="utf-8", newline="\n")
            index[name] = labels
        task, schema = (OPEN_TASK, OPEN_SCHEMA) if stage == "open" else (CLOSED_TASK, CLOSED_SCHEMA)
        write_stage_files(folder, task, schema, {"stage": stage, "index": index})
    print(f"wrote {len(index)} {stage} items ({len(chosen)} questions) to {folder / 'items'}")


# --- apply ---------------------------------------------------------------------------------------------------------

def quiz_verdict(stage: str, answer: dict, right: str) -> str | None:
    """Why a blind answer fails the question, or None if it passes."""
    others = set(answer["also_right"]) - {right}
    if stage == "open":
        if answer["pick"] != right:
            return f"picked {answer['pick']}, not the writer's {right}: {answer['note']}".rstrip(": ")
        if others:
            return f"also right: {', '.join(sorted(others))}: {answer['note']}".rstrip(": ")
        if not answer["answerable"]:
            return f"the section does not settle it: {answer['note']}".rstrip(": ")
        return None
    if not answer["clear"]:
        return f"not clear on its own: {answer['note']}".rstrip(": ")
    if answer["pick"] and answer["pick"] != right:
        return f"picked {answer['pick']} without the text, not the writer's {right}: {answer['note']}".rstrip(": ")
    if others:
        return f"also right somewhere in the Bible: {', '.join(sorted(others))}: {answer['note']}".rstrip(": ")
    return None


def record(candidate: dict, stage: str, why: str | None, by: str) -> None:
    candidate["history"].append({"stage": stage, "round": candidate["round"], "passed": not why, "why": why or "",
                                 "by": by})
    if why:
        candidate["status"] = "rejected"
    elif all(any(h["stage"] == s and h["round"] == candidate["round"] and h["passed"] for h in candidate["history"])
             for s in ("open", "closed")):
        candidate["status"] = "check"


def apply_quiz(stage: str, folder: Path, data: dict, by: str) -> Counter:
    counts = Counter()
    for name, labels in json.loads((folder / "index.json").read_text(encoding="utf-8"))["index"].items():
        answer_file = folder / "out" / f"{name}.json"
        reply = json.loads(answer_file.read_text(encoding="utf-8")).get("structured_output") if answer_file.exists() else None
        answers = {a["q"]: a for a in (reply or {}).get("answers", [])}
        for label_, info in labels.items():
            candidate = data["questions"][info["id"]]
            if candidate["status"] != "review" or label_ not in answers or not waiting(candidate, stage):
                counts["no answer" if label_ not in answers else "not waiting"] += 1
                continue
            why = quiz_verdict(stage, answers[label_], info["right"])
            record(candidate, stage, why, by)
            counts["passed" if not why else "rejected"] += 1
    return counts


def apply_check(folder: Path, data: dict, by: str) -> Counter:
    counts = Counter()
    for name, info in json.loads((folder / "index.json").read_text(encoding="utf-8"))["index"].items():
        answer_file = folder / "out" / f"{name}.json"
        reply = json.loads(answer_file.read_text(encoding="utf-8")).get("structured_output") if answer_file.exists() else None
        candidate = data["questions"][info["id"]]
        if not reply or candidate["status"] != "check":
            counts["no answer" if not reply else "not waiting"] += 1
            continue
        result, refused = checked(reply, info["sent"], None)
        entry = {"stage": "check", "round": candidate["round"], "by": by, "verdict": result and result["verdict"],
                 "problems": (result or {}).get("problems", []), "why": reply["why"].strip()}
        candidate["history"].append(entry)
        if result is None or result["verdict"] == "hide" or (result["verdict"] == "fix" and candidate["round"] >= ROUNDS):
            entry["passed"], candidate["status"] = False, "rejected"
            entry["why"] = refused or entry["why"]
            counts[f"rejected ({refused or result['verdict']})"] += 1
        elif result["verdict"] == "keep":
            entry["passed"], candidate["status"] = True, "passed"
            counts["passed"] += 1
        else:
            entry["passed"] = False
            counts["fixed: back for round 2" if second_round(candidate, result["after"]) else "fix failed the gate"] += 1
    return counts


def second_round(candidate: dict, after: dict) -> bool:
    """Give a fixed question its second round, or reject it if the fix breaks the gate."""
    section = section_of(candidate)
    spans = parse_spans(after["reference"]) or []
    verses = [f"{s['start'][0]}:{s['start'][1]}" + (f"-{s['end'][1]}" if s["end"] != s["start"] else "")
              for s in spans if s["start"][1] and s["end"][0] == s["start"][0]]
    text = {**candidate["text"], "question": after["question"], "answer": after["answer"],
            "wrong": [o for o in after["options"] if o != after["right"]], "verses": verses}
    if after["right"] != after["answer"]:
        why = "the fix's right choice differs from its answer"
    elif not spans or len(verses) != len(spans) or any(s["book"] != section["book"] for s in spans):
        why = "the fix cites verses outside the section"
    else:
        why = gate(text, section, [])
    candidate["round"] += 1
    candidate["history"].append({"stage": "gate", "round": candidate["round"], "passed": not why, "why": why or ""})
    candidate["text"], candidate["status"] = text, "rejected" if why else "review"
    return not why


def apply(stage: str, run: str, by: str) -> None:
    folder = stage_folder(run, stage, new=False)
    data = load_candidates(run)
    counts = apply_check(folder, data, by) if stage == "check" else apply_quiz(stage, folder, data, by)
    save_candidates(run, data)
    print(f"{stage}: {dict(counts)}")


# --- report and publish --------------------------------------------------------------------------------------------

def report(run: str) -> None:
    data = load_candidates(run)
    status = Counter(c["status"] for c in data["questions"].values())
    failed = Counter(f"{h['stage']}: {h['why'].split(':')[0][:60]}" for c in data["questions"].values()
                     for h in c["history"] if not h["passed"])
    print(f"{len(data['questions'])} written in {len({c['section'] for c in data['questions'].values()})} sections")
    print("status:", dict(status))
    for why, n in failed.most_common():
        print(f"  {n:>4}  {why}")


def publish(run: str) -> None:
    data = load_candidates(run)
    written, audit, tags = load_written(), load_audit(), load_tags()
    today = datetime.date.today().isoformat()
    counts = Counter()
    for qid, c in data["questions"].items():
        if c["status"] == "rejected" and qid not in written["rejected"]:
            last = next(h for h in reversed(c["history"]) if not h["passed"])
            written["rejected"][qid] = {"section": c["section"], "question": c["text"]["question"],
                                        "answer": c["text"]["answer"], "stage": last["stage"], "why": last["why"]}
            counts["rejected"] += 1
        if c["status"] != "passed" or qid in written["questions"]:
            continue
        text, reference = c["text"], reference_of(c)
        options = options_of(qid, text)
        checks = [h["by"] for h in c["history"] if h.get("by")]
        written["questions"][qid] = {
            "id": qid, "source_id": SOURCE, "attribution_source_id": SOURCE, "bank_id": "written-bsb",
            "question": text["question"].strip(), "answer": text["answer"].strip(), "options": options,
            "options_by": c["by"], "reference": reference, "lesson": None, "standalone": True,
            "question_origin": f"written for the site by {c['by']} from the BSB section \"{c['section_info']['title']}\"",
            "licence": "Written for this site; the Bible text is the Berean Standard Bible (public domain)",
            "licence_class": "public-domain", "publishable": True,
            "attribution": f"Written for this site from the Berean Standard Bible, reviewed by {', '.join(dict.fromkeys(checks))}.",
            "source_url": None, "section": c["section"], "review": c["history"]}
        audit["questions"][qid] = {
            "collection": COLLECTION, "verdict": "keep", "problems": [], "why": "No fault found.",
            "by": next(h["by"] for h in reversed(c["history"]) if h["stage"] == "check"), "audited": today,
            "before": {"question": text["question"].strip(), "answer": text["answer"].strip(),
                       "right": text["answer"].strip(), "options": options, "reference": reference},
            "after": None}
        passages = [check_passage({"book": s["book"], "chapter": s["start"][0], "verse": s["start"][1],
                                   "verse_end": s["end"][1]}, {"question": text["question"], "answer": text["answer"]})
                    for s in parse_spans(reference) or []]
        tags["questions"][qid] = {"passages": [p for p in passages if p], "people": text["people"],
                                  "places": text["places"], "topics": text["subjects"][:3], "by": c["by"]}
        counts["published"] += 1
    save_json(WRITTEN, written)
    save_json(AUDIT, audit)
    save_tags(tags)
    print(f"{dict(counts)} -> {WRITTEN}")
