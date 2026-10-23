"""Check shown questions again against the verses that hold their answers (owner, 2026-10-23: "I do not want any
questions to be wrong").

The audit (question_audit.py) judged each question by the passages it cited. The grounding pass
(question_grounding.py) later found the verses that actually hold each answer, and for about a third of the questions
the audit had not seen all of them, so their wrong choices and quotations were never checked against those verses.
This sends each such question again, as the site shows it now, with those verses first.

Which questions: shown, audited, grounded in Scripture (the record applied by the build), and with an answer verse
missing from the saved audit prompts for the wording the audit record starts from (.local/question-audit/<run>/items/;
the sample runs count: their records were carried into audit.json). A verse counts as seen only if every such prompt held it,
or the newest recheck prompt did. A question whose prompt cannot be found is sent too.

What is kept, in content/questions/audit.json:
  keep  the record stays as it was (an earlier fix stays applied), with `rechecked` added;
  fix   `after` becomes the new wording, `before` stays the source's wording (so the build still matches it), the new
        faults are added to the earlier ones, and `why` gives both reasons;
  hide  the question is hidden, `before` kept.
A record that changed between prepare and apply is skipped and counted. Replies are checked as the audit's are.

    python scripts/question_recheck.py prepare RUN
    python scripts/question_recheck.py apply RUN OUT --by claude-sonnet-5-5 [--audit-file F]
    (then build-question-bank.py, then question_grounding.py prepare for the reworded questions)
"""

from __future__ import annotations

import argparse
import datetime
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from bible.books import BOOKS  # noqa: E402
from question_audit import (  # noqa: E402
    AUDIT, BANK, SCHEMA, TASK, WORK, as_sent, bible_text, checked, load_audit, parse_spans, save_json, tag_spans)
from question_choices import shuffled  # noqa: E402
from question_grounding import load_grounding  # noqa: E402

CODE = {name: code for code, name, _section, _osis in BOOKS}
HEADER = re.compile(r"^\[(.+?) \d")
VERSE_LINE = re.compile(r"^(\d+):(\d+) ")
INTRO = ("This question was checked once before, against passages that did not include every verse that holds its "
         "answer. Check it again now against those verses, listed below and given first in the BSB text: the answer, "
         "each wrong choice (is any also right by these verses?), every quotation (the BSB's words), and the "
         "reference. If it is right as it stands, keep it.")


def prompt_verses(text: str) -> set[str]:
    """The verse keys ("GEN 37:28") whose text a saved audit prompt held (only after its "BSB text:" line)."""
    verses, book = set(), None
    for line in text.partition("\nBSB text:\n")[2].splitlines():
        header = HEADER.match(line)
        if header:
            book = CODE.get(header.group(1))
            continue
        verse = VERSE_LINE.match(line)
        if verse and book:
            verses.add(f"{book} {verse.group(1)}:{verse.group(2)}")
    return verses


def audited_verses(audit: dict) -> dict[str, set[str]]:
    """For each audited question, the verses its audit prompts all held: every saved prompt sent for its record's
    `before` wording (a run whose reply was refused leaves the record on an earlier prompt, so a verse counts only if
    every prompt had it), unless a recheck prompt applied since, which then speaks for itself."""
    seen: dict[str, set[str]] = {}
    rechecked: dict[str, set[str]] = {}
    for index_file in sorted(WORK.glob("*/index.json"), key=lambda p: p.stat().st_mtime):
        run = json.loads(index_file.read_text(encoding="utf-8"))
        for name, qid in run.get("index", {}).items():
            item = index_file.parent / "items" / f"{name}.txt"
            if qid not in audit or not item.exists() or run["sent"].get(name, {}).get("before") != audit[qid]["before"]:
                continue
            verses = prompt_verses(item.read_text(encoding="utf-8"))
            if run.get("recheck"):
                if audit[qid].get("rechecked"):
                    rechecked[qid] = verses
            else:
                seen[qid] = seen[qid] & verses if qid in seen else verses
    return {**seen, **rechecked}


def answer_spans(keys: list[str]) -> list[dict]:
    """Verse keys as spans, neighbouring verses of one chapter joined."""
    spans: list[dict] = []
    for key in keys:
        book, _, place = key.partition(" ")
        chapter, verse = map(int, place.split(":"))
        last = spans[-1] if spans else None
        if last and last["book"] == book and last["end"][0] == chapter and last["end"][1] + 1 == verse:
            last["end"] = (chapter, verse)
        else:
            spans.append({"book": book, "start": (chapter, verse), "end": (chapter, verse)})
    return spans


def item_text(q: dict, sent: dict, refs: list[str], keys: list[str]) -> str:
    lines = [f"Kind: {q['kind']} ({q['collection']})", INTRO, "Verses that hold the answer: " + "; ".join(refs), ""]
    if q.get("lead_in"):
        lines.append(f"Shown first: {q['lead_in']['question']} Answer: {q['lead_in']['answer']}")
    lines += [f"Question: {sent['question']}", f"Answer: {sent['answer']}"]
    if sent["right"] != sent["answer"]:
        lines.append(f"Right choice: {sent['right']}")
    lines.append("Wrong choices: " + " | ".join(o for o in sent["options"] if o != sent["right"]))
    lines.append(f"Reference: {sent['reference'] or 'none'}")
    spans = answer_spans(keys) + (parse_spans(sent["reference"]) or []) + tag_spans(q.get("passages"))
    lines += ["", "BSB text:", bible_text(spans) or "No Bible text found for this question."]
    return "\n".join(lines) + "\n"


def prepare(run: str) -> None:
    audit = load_audit()["questions"]
    grounding = load_grounding()["questions"]
    seen = audited_verses(audit)
    counts, chosen = Counter(), []
    for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]:
        if q.get("repeat_of") or q.get("hidden"):
            continue
        g = q.get("grounding")  # set by the build only when the record matches the wording shown
        if q["id"] not in audit or not g or g["basis"] != "scripture" or not q.get("options"):
            counts["not eligible"] += 1
            continue
        keys = list(dict.fromkeys(k for v in grounding[q["id"]]["verses"] for k in v["keys"]))
        if not keys:
            counts["not eligible"] += 1
            continue
        if set(keys) <= seen.get(q["id"], set()):
            counts["audit saw every answer verse"] += 1
            continue
        counts["no saved prompt" if q["id"] not in seen else "answer verse missing"] += 1
        chosen.append((q, g["verses"], keys))
    folder = WORK / run
    items = folder / "items"
    if items.exists() and any(items.iterdir()):
        raise SystemExit(f"{items} already holds items: use a new RUN name, so a run in progress is never changed")
    items.mkdir(parents=True, exist_ok=True)
    index, sent_by_name = {}, {}
    for q, refs, keys in chosen:
        sent = as_sent(q)
        name = "q-" + re.sub(r"[^A-Za-z0-9]+", "-", q["id"])[-60:]
        (items / f"{name}.txt").write_text(item_text(q, sent, refs, keys), encoding="utf-8", newline="\n")
        index[name] = q["id"]
        sent_by_name[name] = {"before": audit[q["id"]]["before"], "sent": sent, "previous": audit[q["id"]],
                              "collection": q["collection"]}
    save_json(folder / "index.json", {"recheck": True, "index": index, "sent": sent_by_name})
    (folder / "task.txt").write_text(TASK, encoding="utf-8", newline="\n")
    (folder / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    print(dict(counts))
    print(f"wrote {len(index)} items to {items}")


def rechecked_record(previous: dict, result: dict, reply_why: str, by: str, today: str) -> dict:
    stamp = {"by": by, "date": today, "verdict": result["verdict"], "earlier_by": previous["by"]}
    if result["verdict"] == "keep":
        return {**previous, "rechecked": stamp}
    earlier = previous["why"] if previous["verdict"] == "fix" else ""
    why = f"{earlier} Rechecked against the verses that hold the answer: {reply_why}".strip()
    return {**previous, "verdict": result["verdict"], "problems": previous["problems"] + result["problems"],
            "why": why, "by": by, "audited": today, "after": result["after"], "rechecked": stamp}


def apply(run: str, out_dir: Path, by: str, audit_file: Path) -> None:
    folder = WORK / run
    run_index = json.loads((folder / "index.json").read_text(encoding="utf-8"))
    if not run_index.get("recheck"):
        raise SystemExit(f"{folder} is not a recheck run: apply it with question_audit.py")
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
        if data["questions"].get(qid) != info["previous"]:
            refused["the record changed since prepare"] += 1
            continue
        result, why = checked(reply, info["sent"], None)
        if result is None:
            refused[why] += 1
            continue
        if result["after"]:
            result["after"]["options"] = shuffled(qid, result["after"]["options"])
        data["questions"][qid] = rechecked_record(info["previous"], result, reply["why"].strip(), by, today)
        kept[result["verdict"]] += 1
    save_json(audit_file, data)
    print(f"recorded {dict(kept)}; refused {dict(refused)}; missing {len(missing)} {missing[:5]}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("prepare").add_argument("run")
    a = sub.add_parser("apply")
    a.add_argument("run")
    a.add_argument("out_dir", type=Path)
    a.add_argument("--by", required=True, help="the model that answered, e.g. claude-sonnet-5-5")
    a.add_argument("--audit-file", type=Path, default=AUDIT)
    args = parser.parse_args()
    if args.command == "prepare":
        prepare(args.run)
    else:
        apply(args.run, args.out_dir.resolve(), args.by, args.audit_file.resolve())


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
