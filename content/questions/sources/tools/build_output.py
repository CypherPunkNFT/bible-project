"""Write one finished question list per text & data source: output/<source_id>.csv.

Columns: index, question, answer, reference. Plain reshaping, no model calls and no judgement:
- sources the jobs already put into the common format (../normalized/<source_id>.json) are copied from it;
- BibleQA (raw/helen-jiahe-zhao-bibleqa/data/bible_qa/1001.csv) and the Open Biblical Dataset
  (raw/serialhex-open-biblical-dataset/master.jsonl), which the jobs left out, are read directly;
- a source with no questions in it gets no file, and output/_status.json says why.
Scan sources (most of their bytes are PDFs) use the questions the download job pulled from the scans' OCR text,
marked as such: expect OCR errors.
The raw files are never altered. Run: py -3.12 tools/build_output.py
"""
from __future__ import annotations

import csv
import json
import re
import sys
from collections.abc import Iterator
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

CORPUS = Path(__file__).resolve().parent.parent
RAW = CORPUS / "raw"
NORMALIZED = CORPUS / "normalized"
OUT = CORPUS / "output"
COLUMNS = ["index", "question", "answer", "reference"]
Row = tuple[str, str, str]  # question, answer, reference


def is_scan(source: Path) -> bool:
    """True when most of the source's bytes are PDFs (the same rule the data intake page uses)."""
    sizes = [(p.suffix.lower(), p.stat().st_size) for p in source.rglob("*") if p.is_file()]
    total = sum(s for _, s in sizes)
    return total > 0 and 2 * sum(s for ext, s in sizes if ext in (".pdf", ".djvu")) >= total


def from_normalized(path: Path) -> Iterator[Row]:
    data = json.loads(path.read_text(encoding="utf-8"))
    records = data if isinstance(data, list) else next(v for v in data.values() if isinstance(v, list))
    for r in records:
        yield r.get("question") or "", r.get("answer") or "", r.get("reference") or ""


BIBLEQA_LINE = re.compile(r"^\d+\.\s*(.*)$")
BIBLEQA_REFERENCE = re.compile(r"^(.*?)\s*\(([^()]*\d[^()]*)\)\s*$")


def from_bibleqa(path: Path) -> Iterator[Row]:
    """1001.csv: CR line endings, tab between '12. question' and '12. answer (Ref 1:2)'."""
    text = path.read_text(encoding="utf-8-sig")
    for line in list(csv.reader(text.splitlines(), delimiter="\t"))[1:]:
        if len(line) < 2:
            continue
        question = BIBLEQA_LINE.sub(r"\1", line[0].strip())
        answer = BIBLEQA_LINE.sub(r"\1", line[1].strip())
        found = BIBLEQA_REFERENCE.match(answer)
        yield (question, found.group(1), found.group(2)) if found else (question, answer, "")


def from_open_biblical(path: Path) -> Iterator[Row]:
    """master.jsonl: each record is a conversation; the 'human' turn asks, the 'gpt' turn answers."""
    with path.open(encoding="utf-8") as lines:
        for line in lines:
            if not line.strip():
                continue
            record = json.loads(line)
            turns = record.get("conversations") or []
            question = next((t["value"] for t in turns if t.get("from") == "human"), "")
            answer = next((t["value"] for t in turns if t.get("from") == "gpt"), "")
            if question:
                yield question.strip(), answer.strip(), record.get("pericope_ref") or ""


RELATIONS = ("father", "mother", "husband", "wife", "son", "daughter", "brother", "sister")
TRAILING_REFERENCE = re.compile(r"\s*\([^()]*\d[^()]*\)\s*$")


def from_bible_data(folder: Path) -> Iterator[Row]:
    """BibleData holds facts, not questions: questions are built from them by fixed rules, each with its verse.
    Family links (row 'Adam father Cain' → 'Who was the father of Cain?' → Adam), ages at death, name meanings."""
    def rows(name: str) -> list[dict]:
        with (folder / name).open(encoding="utf-8-sig", newline="") as handle:
            return list(csv.DictReader(handle))

    people = {p["person_id"]: p for p in rows("BibleData-Person.csv")}

    def called(pid: str, distinguish: bool) -> str:
        person = people.get(pid, {})
        name = person.get("person_name") or pid.rsplit("_", 1)[0]
        attribute = TRAILING_REFERENCE.sub("", person.get("unique_attribute") or "")
        return f"{name} ({attribute})" if distinguish and person.get("name_instance", "1") != "1" and attribute else name

    links: dict[tuple[str, str], list[tuple[str, str]]] = {}
    for r in rows("BibleData-PersonRelationship.csv"):
        if r["relationship_type"] in RELATIONS:
            links.setdefault((r["relationship_type"], r["person_id_2"]), []).append((r["person_id_1"], r["reference_id"]))
    for (relation, of), found in links.items():
        answers = list(dict.fromkeys(called(pid, False) for pid, _ in found))
        references = "; ".join(list(dict.fromkeys(ref for _, ref in found if ref))[:3])
        # The label that tells same-named people apart must not give the answer away ("Ahio (son of Elpaal)").
        subject = called(of, True)
        # Then the verse tells them apart instead.
        if any(answer in subject[len(called(of, False)):] for answer in answers):
            subject = f"{called(of, False)} ({references.split(';')[0]})" if references else called(of, False)
        question = f"Who was the {relation} of {subject}?" if len(answers) == 1 else f"Who were the {relation}s of {subject}?"
        yield question, ", ".join(answers), references
    for e in rows("BibleData-Event.csv"):
        if e["event_type"] == "Death" and e["person_age_at_event"].strip():
            yield f"How old was {called(e['person_id'], True)} when he died?" if people.get(e["person_id"], {}).get("sex") == "male" \
                else f"How old was {called(e['person_id'], True)} when she died?", e["person_age_at_event"].strip(), e["event_reference_id"]
    # Places, as the source gives them, odd ones included ("heaven" → "the universe"): owner, 2026-10-17.
    for place in rows("BibleData-Place.csv"):
        modern = place["modern_equivalent"].strip()
        if modern:
            yield f"What is {place['place_name'].strip()} today?", modern, ""
    for n in rows("HitchcocksBibleNamesDictionary.csv"):
        if n["Name"].strip() and n["Meaning"].strip():
            yield f"What does the name {n['Name'].strip()} mean?", n["Meaning"].strip(), ""


SCAN_NOTE = "Taken by the download job from the scans' OCR text: expect OCR errors and mismatched answers."

# Sources whose output is built by rule from facts, not questions the source itself wrote.
BUILT_BY_RULE = {"bradystephenson-bible-data": "Questions built by fixed rules from this source's facts (family links, ages at death, places, name meanings); the source itself contains no questions."}

READ_DIRECTLY = {
    "bradystephenson-bible-data": lambda: from_bible_data(RAW / "bradystephenson-bible-data"),
    "helen-jiahe-zhao-bibleqa": lambda: from_bibleqa(RAW / "helen-jiahe-zhao-bibleqa/data/bible_qa/1001.csv"),
    "serialhex-open-biblical-dataset": lambda: from_open_biblical(RAW / "serialhex-open-biblical-dataset/master.jsonl"),
}


def main() -> None:
    OUT.mkdir(exist_ok=True)
    status: dict[str, dict] = {}
    for source in sorted(p for p in RAW.iterdir() if p.is_dir()):
        sid = source.name
        normalized = NORMALIZED / f"{sid}.json"
        scan = is_scan(source)
        if scan and not normalized.exists():
            status[sid] = {"rows": 0, "unit": "questions", "note": "PDF scan source with no questions taken from it."}
            continue
        if sid in READ_DIRECTLY:
            rows = list(READ_DIRECTLY[sid]())
        elif normalized.exists():
            rows = list(from_normalized(normalized))
        else:
            status[sid] = {"rows": 0, "unit": "questions", "note": "No questions in this source."}
            continue
        target = OUT / f"{sid}.csv"
        with target.open("w", encoding="utf-8-sig", newline="") as handle:  # BOM so Excel reads UTF-8
            writer = csv.writer(handle)
            writer.writerow(COLUMNS)
            for index, (question, answer, reference) in enumerate(rows, 1):
                writer.writerow([index, question, answer, reference])
        note = BUILT_BY_RULE.get(sid) or (SCAN_NOTE if scan else "")
        status[sid] = {"rows": len(rows), "unit": "questions", "file": target.name, **({"note": note} if note else {})}
        print(f"{sid}: {len(rows)} questions")
    (OUT / "_status.json").write_text(json.dumps(status, indent=1, ensure_ascii=False), encoding="utf-8")
    for sid, s in status.items():
        if not s["rows"]:
            print(f"{sid}: {s['note']}")


if __name__ == "__main__":
    main()
