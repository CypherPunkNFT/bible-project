"""Where each shown question's answer comes from: a verse of Scripture, or something outside the Bible (owner,
2026-10-23: "either there's a verse or there isn't").

Every shown question goes to Claude in one minimal BatchRunner call with the BSB text of three kinds of passage:
its own reference, the passages it was tagged with (model-tags.json), and the verses closest in meaning to the
question and its answer, found by the local embedding model ($0). The model never names a verse it has not read:
- "scripture": the verses, among those shown, that hold the answer; "stated" if one says it outright, "taught" if
  the verses teach it or it follows plainly from them (most catechism answers);
- "outside": what kind of knowledge answers it instead (history, the Bible as a book, ...), with a one-line note.
If the verse that holds the answer was not among those shown, the model names it as "missing", and the question is
sent again with that passage, so every verse recorded was read. A model that thinks the printed answer is wrong
says so in "doubt"; nothing is rewritten here, it is listed for the audit.

Every decision is kept in content/questions/grounding.json by question id, with what was shown and why, so it can be
checked again later. The build attaches it to each question and writes the table question-table.csv.

    python scripts/question_grounding.py index            # embed every BSB verse once (local, $0, ~35 min)
    python scripts/question_grounding.py prepare RUN      # items for shown questions not yet grounded
    python scripts/question_grounding.py apply RUN OUT --by MODEL
    python scripts/question_grounding.py report
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bible.books import BOOKS  # noqa: E402
from question_audit import BANK, NAME, bible_book, label, parse_spans, save_json, span_keys, tag_spans  # noqa: E402
from question_repeats import embed  # noqa: E402
from question_tags import books_of, link_of, testament_of  # noqa: E402

WEBSITE = Path(__file__).resolve().parent.parent
GROUNDING = WEBSITE / "content" / "questions" / "grounding.json"
WORK = WEBSITE / ".local" / "question-grounding"
VERSES = WORK / "bsb-verses.npz"
SEARCHED = 8  # verses found by meaning, each shown with the verse either side
OUTSIDE = ["history", "language and manuscripts", "the Bible as a book", "church teaching", "geography or nature",
           "other"]

TASK = """You decide where the answer to one Bible quiz or catechism question comes from. The question, its answer
and passages of the Berean Standard Bible (BSB) are below. Some passages are the question's own reference, some were
tagged earlier, and some were found by a search for verses close in meaning; any of them may be beside the point.

Decide:
- "scripture" if a verse among those shown holds the answer. List those verses in "verses" ("Luke 5:8",
  "Gen 6:13-14"), only verses whose text is shown below, the fewest that hold it. "strength" is "stated" when a verse
  says it outright, "taught" when the verses teach it or it follows plainly from them (a catechism answer drawn from
  its proof texts, the number of plagues counted from the account). Look first at the question's own reference: if
  its verses hold the answer, list them, and add others only where they hold a part it does not.
- "outside" if no verse holds the answer, because it comes from history, the study of the Bible's languages and
  manuscripts, facts about the Bible as a book (its order, its divisions, who is held to have written it, copies
  sold), church teaching that goes beyond what the verses say, geography or nature, or something else. Put the kind
  in "outside" and leave "verses" empty. A question whose answer is that Scripture records no such thing ("Which book
  did Jesus write?") is "outside", kind "the Bible as a book", and the note says Scripture records none.
- If you are sure a verse that is NOT shown holds the answer, give it in "missing" (like "John 21:25") and decide
  from what is shown for the rest; the question will be sent again with that passage. Otherwise "missing" is "".

"note": one plain sentence of at most 40 words a church member could read: what the verse says that answers it, or where the answer
comes from instead. "doubt": "" unless the printed answer looks wrong by the verses shown; then one sentence why.
Do not judge the wording or the choices; only where the answer comes from."""

SCHEMA = {"type": "object", "properties": {
    "basis": {"type": "string", "enum": ["scripture", "outside"]},
    "verses": {"type": "array", "items": {"type": "string"}},
    "strength": {"type": "string", "enum": ["stated", "taught", ""]},
    "outside": {"type": "string", "enum": [*OUTSIDE, ""]},
    "missing": {"type": "string"}, "note": {"type": "string"}, "doubt": {"type": "string"}},
    "required": ["basis", "verses", "strength", "outside", "missing", "note", "doubt"], "additionalProperties": False}


# --- the verse index -------------------------------------------------------------------------------------------------

def all_verses() -> list[tuple[str, tuple[int, int], str]]:
    """Every BSB verse in canonical order (BOOKS also lists the Apocrypha, which the BSB does not have)."""
    verses = []
    for code, *_rest in BOOKS:
        try:
            verses += [(code, key, text) for key, text in sorted(bible_book(code).items())]
        except FileNotFoundError:
            continue
    return verses


def build_index() -> None:
    import numpy as np

    verses = all_verses()
    keys = [f"{code} {c}:{v}" for code, (c, v), _text in verses]
    rows = list(np.load(VERSES)["vectors"]) if VERSES.exists() else []  # saved in canonical order: resume there
    for _code, _key, text in verses[len(rows):]:
        vector = np.asarray(embed(text), dtype=np.float32)
        rows.append((vector / np.linalg.norm(vector)).astype(np.float16))
        if len(rows) % 2000 == 0:  # resumable: a stop loses at most 2,000 verses
            WORK.mkdir(parents=True, exist_ok=True)
            np.savez(VERSES, keys=np.array(keys[:len(rows)]), vectors=np.stack(rows))
            print(f"{len(rows)} of {len(keys)} verses", flush=True)
    WORK.mkdir(parents=True, exist_ok=True)
    np.savez(VERSES, keys=np.array(keys), vectors=np.stack(rows))
    print(f"index holds {len(rows)} verses")


def load_index():
    import numpy as np

    data = np.load(VERSES)
    keys = [(k.split()[0], tuple(map(int, k.split()[1].split(":")))) for k in data["keys"]]
    if len(keys) < 31000:
        raise SystemExit(f"the verse index holds {len(keys)} verses, expected about 31,100: run `index` first")
    return keys, data["vectors"].astype(np.float32)


def searched(q: dict, keys: list, vectors, covered: set) -> list[dict]:
    """The SEARCHED verses closest in meaning to the question and answer, not already shown, as one-verse spans."""
    import numpy as np

    query = np.asarray(embed(f"Question: {q['question']}\nAnswer: {q['answer']}", kind="query"), dtype=np.float32)
    scores = vectors @ (query / np.linalg.norm(query))
    spans = []
    for i in np.argsort(-scores):
        book, key = keys[i]
        if (book, key) in covered:
            continue
        spans.append({"book": book, "start": key, "end": key})
        covered.add((book, key))
        if len(spans) == SEARCHED:
            break
    return spans


# --- prepare ---------------------------------------------------------------------------------------------------------

def load_grounding() -> dict:
    if not GROUNDING.exists():
        return {"about": __doc__.split("\n\n")[0], "questions": {}}
    return json.loads(GROUNDING.read_text(encoding="utf-8"))


def as_grounded(q: dict) -> dict:
    return {"question": q["question"], "answer": q["answer"], "right": q.get("answer_choice") or q["answer"]}


def shown_text(groups: list[tuple[str, list[dict]]]) -> tuple[str, list[str]]:
    """The BSB text of each group of spans (each verse once, a verse span with one verse either side), and the
    verse keys shown, as "BOOK c:v"."""
    blocks, seen = [], set()
    for why, spans in groups:
        for span in spans:
            keys = [k for k in (span_keys(span, 1) or []) if (span["book"], k) not in seen][:60]
            if not keys:
                continue
            verses = bible_book(span["book"])
            seen.update((span["book"], k) for k in keys)
            lines = [f"{NAME[span['book']]} {c}:{v} {verses[(c, v)]}" for c, v in keys]
            blocks.append(f"[{label(span)}, {why}]\n" + "\n".join(lines))
    return "\n\n".join(blocks), sorted(f"{b} {c}:{v}" for b, (c, v) in seen)


def item_for(q: dict, keys: list, vectors, extra: str = "") -> tuple[str, dict]:
    groups = [("the question's reference", parse_spans(q.get("reference")) or []),
              ("tagged earlier", tag_spans(q.get("passages")))]
    if extra:
        groups.insert(0, ("named as missing last time", parse_spans(extra) or []))
    covered = {(s["book"], k) for _why, spans in groups for s in spans for k in (span_keys(s, 1) or [])}
    groups.append(("found by meaning", searched(q, keys, vectors, covered)))
    text, shown = shown_text(groups)
    lines = [f"Kind: {q['kind']} ({q['collection']})"]
    if q.get("lead_in"):
        lines.append(f"Shown first: {q['lead_in']['question']} Answer: {q['lead_in']['answer']}")
    lines += [f"Question: {q['question']}", f"Answer: {q['answer']}", f"Reference: {q.get('reference') or 'none'}",
              "", "BSB passages:", text]
    trace = {"shown": shown, "groups": [[why, [label(s) for s in spans]] for why, spans in groups if spans]}
    return "\n".join(lines) + "\n", trace


def prepare(run: str, ids: list[str], redo: bool) -> None:
    grounding = load_grounding()["questions"]
    questions = [q for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]
                 if not q.get("repeat_of") and not q.get("hidden")]
    if ids:
        questions = [q for q in questions if q["id"] in ids]
    # a question is sent again when it is new, changed since, or named a missing verse last time
    pending = [q for q in questions if redo or q["id"] not in grounding
               or grounding[q["id"]]["before"] != as_grounded(q) or grounding[q["id"]].get("pending")]
    if not pending:
        raise SystemExit("every shown question is grounded")
    folder = WORK / run
    items = folder / "items"
    if items.exists() and any(items.iterdir()):
        raise SystemExit(f"{items} already holds items: use a new RUN name")
    items.mkdir(parents=True, exist_ok=True)
    keys, vectors = load_index()
    index = {}
    for n, q in enumerate(pending, 1):
        record = grounding.get(q["id"])
        extra = record["pending"] if record and record.get("pending") and record["before"] == as_grounded(q) else ""
        text, trace = item_for(q, keys, vectors, extra)
        name = "q-" + hashlib.sha1(q["id"].encode()).hexdigest()[:16]
        (items / f"{name}.txt").write_text(text, encoding="utf-8", newline="\n")
        index[name] = {"id": q["id"], "before": as_grounded(q), "round": 2 if extra else 1, **trace}
        if n % 500 == 0:
            print(f"{n} of {len(pending)}", flush=True)
    save_json(folder / "index.json", index)
    (folder / "task.txt").write_text(TASK, encoding="utf-8", newline="\n")
    (folder / "schema.json").write_text(json.dumps(SCHEMA), encoding="utf-8", newline="\n")
    print(f"wrote {len(index)} items to {items}")


# --- apply -----------------------------------------------------------------------------------------------------------

def verse_keys(reference: str) -> list[str] | None:
    spans = parse_spans(reference)
    if not spans:
        return None
    keys = []
    for span in spans:
        found = span_keys(span)
        if not found:
            return None
        keys += [f"{span['book']} {c}:{v}" for c, v in found]
    return keys


def checked(reply: dict, shown: set[str], final_round: bool) -> tuple[dict | None, str]:
    note = reply["note"].strip()
    if not note or len(note.split()) > 60:
        return None, "a note empty or over 60 words"
    missing = reply["missing"].strip()
    if missing and (final_round or verse_keys(missing) is None):
        missing = ""  # a second miss, or a verse that does not exist: decide from what was read
    verses = []
    for ref in reply["verses"]:
        keys = verse_keys(ref)
        if not keys or not set(keys) <= shown:
            return None, "a verse that was not shown"
        verses.append({"ref": ref.strip(), "keys": keys})
    if reply["basis"] == "scripture":
        if not verses and not missing:
            return None, "scripture with no verse"
        if not reply["strength"] or reply["outside"]:
            return None, "scripture without a strength, or with an outside kind"
    elif verses or not reply["outside"] or reply["strength"]:
        return None, "outside with verses, a strength, or no kind"
    return {"basis": reply["basis"], "strength": reply["strength"], "outside": reply["outside"], "verses": verses,
            "note": note, "doubt": reply["doubt"].strip(), "pending": missing}, ""


def apply(run: str, out_dir: Path, by: str) -> None:
    index = json.loads((WORK / run / "index.json").read_text(encoding="utf-8"))
    data = load_grounding()
    kept, refused, missing = Counter(), Counter(), 0
    for name, info in index.items():
        answer_file = out_dir / f"{name}.json"
        reply = json.loads(answer_file.read_text(encoding="utf-8")).get("structured_output") if answer_file.exists() else None
        if not reply:
            missing += 1
            continue
        result, why = checked(reply, set(info["shown"]), info["round"] == 2)
        if result is None:
            refused[why] += 1
            continue
        data["questions"][info["id"]] = {**result, "by": by, "grounded": datetime.date.today().isoformat(),
                                         "round": info["round"], "before": info["before"], "shown": info["groups"]}
        kept["missing verse, sent again next" if result["pending"] else f"{result['basis']}"] += 1
    data["questions"] = dict(sorted(data["questions"].items()))
    save_json(GROUNDING, data)
    print(f"recorded {dict(kept)}; refused {dict(refused)}; no reply {missing}")
    print("refused, unanswered and missing-verse questions go out again with the next prepare (new RUN name)")


def report() -> None:
    records = load_grounding()["questions"]
    print(f"{len(records)} grounded:", dict(Counter(r["basis"] for r in records.values())))
    print("scripture:", dict(Counter(r["strength"] for r in records.values() if r["basis"] == "scripture")))
    print("outside:", dict(Counter(r["outside"] for r in records.values() if r["basis"] == "outside")))
    print("pending a missing verse:", sum(1 for r in records.values() if r.get("pending")))
    doubts = {qid: r for qid, r in records.items() if r["doubt"]}
    print(f"{len(doubts)} with a doubt about the printed answer:")
    for qid, r in doubts.items():
        print(f"  {qid}: {r['doubt']}")


# --- used by build-question-bank.py ----------------------------------------------------------------------------------

def apply_grounding(questions: list[dict]) -> dict:
    """Attach grounding.json to the built questions (after the audit). A question with no reference gets the verses
    read as its reference. A record whose `before` no longer matches the question is stale and skipped."""
    records = load_grounding()["questions"]
    counts = Counter()
    for q in questions:
        q["grounding"] = None
        record = records.get(q["id"])
        if not record or record.get("pending"):
            continue
        if record["before"] != as_grounded(q):
            counts["stale"] += 1
            continue
        refs = [v["ref"] for v in record["verses"]]
        q["grounding"] = {"basis": record["basis"], "strength": record["strength"] or None,
                          "outside": record["outside"] or None, "verses": refs, "note": record["note"],
                          "doubt": record["doubt"] or None, "by": record["by"]}
        counts[record["basis"]] += 1
        held = {k for v in record["verses"] for k in v["keys"]}
        if refs and not q["reference"]:
            q["reference"] = "; ".join(refs)
            q["link"] = link_of(q["reference"])
            q["books"] = books_of(q["question"], q["answer"], q["reference"])
            q["testament"] = testament_of(q["kind"], q["books"], q["topic"])
            counts["reference added"] += 1
        elif held and not held & set(verse_keys(q["reference"]) or []):
            counts["reference holds none of the verses read"] += 1
    return dict(counts)


TABLE_COLUMNS = ["id", "status", "collection", "kind", "tradition", "question", "answer", "right_choice",
                 "wrong_choices", "reference", "basis", "strength", "outside_kind", "verses", "basis_note", "doubt",
                 "grounded_by", "audit_verdict", "audit_faults", "audit_why", "audited_by", "options_by", "repeat_of",
                 "hidden_reason", "source_url"]


def write_table(questions: list[dict], path: Path) -> None:
    """One row per question, shown or not, for checking and analysis in a spreadsheet."""
    import csv

    with path.open("w", encoding="utf-8-sig", newline="") as handle:  # the BOM lets Excel read it as UTF-8
        writer = csv.writer(handle)
        writer.writerow(TABLE_COLUMNS)
        for q in questions:
            g, a = q.get("grounding") or {}, q.get("audit") or {}
            status = "hidden" if q.get("hidden") else "repeat" if q.get("repeat_of") else "shown"
            wrong = [o for o in q.get("options") or [] if o != q.get("answer_choice")]
            writer.writerow([q["id"], status, q["collection"], q["kind"], q.get("tradition") or "", q["question"],
                             q["answer"], q.get("answer_choice") or "", " | ".join(wrong), q.get("reference") or "",
                             g.get("basis", ""), g.get("strength") or "", g.get("outside") or "",
                             "; ".join(g.get("verses", [])), g.get("note", ""), g.get("doubt") or "", g.get("by", ""),
                             a.get("verdict", ""), ", ".join(a.get("kinds", [])), a.get("why", ""), a.get("by", ""),
                             q.get("options_by") or "", q.get("repeat_of") or "", q.get("hidden") or "",
                             q.get("source_url") or ""])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("index")
    p = sub.add_parser("prepare")
    p.add_argument("run")
    p.add_argument("--ids", default="")
    p.add_argument("--redo", action="store_true")
    a = sub.add_parser("apply")
    a.add_argument("run")
    a.add_argument("out_dir", type=Path)
    a.add_argument("--by", required=True)
    sub.add_parser("report")
    args = parser.parse_args()
    if args.command == "index":
        build_index()
    elif args.command == "prepare":
        prepare(args.run, [i for i in args.ids.split(",") if i], args.redo)
    elif args.command == "apply":
        apply(args.run, args.out_dir.resolve(), args.by)
    else:
        report()


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
