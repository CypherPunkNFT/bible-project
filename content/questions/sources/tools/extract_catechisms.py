"""Extract question-and-answer banks from the catechism sources into extracted/.

Reads only from raw/ and writes only to extracted/. Raw files are never modified.

Every extractor returns the same container shape so normalize.py needs one code path:

    {"source_id": str, "extracted_utc": str, "banks": [
        {"bank_id": str, "title": str, "question_count": int, "notes": str,
         "questions": [{"number": int|None, "question": str, "answer": str,
                        "options": list|None, "reference": str|None, ...extras}]}]}

Run: python tools/extract_catechisms.py
"""

import json
import re
import sys
import time
from pathlib import Path

CORPUS_ROOT = Path(__file__).resolve().parent.parent
RAW = CORPUS_ROOT / "raw"
EXTRACTED = CORPUS_ROOT / "extracted"


def write_source(container):
    """Write one source's extraction, refusing any path inside raw/."""
    EXTRACTED.mkdir(parents=True, exist_ok=True)
    out_path = EXTRACTED / f"{container['source_id']}.json"
    if RAW in out_path.parents:
        raise RuntimeError(f"refusing to write inside raw/: {out_path}")
    out_path.write_text(
        json.dumps(container, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    total = sum(bank["question_count"] for bank in container["banks"])
    banks = ", ".join(f"{b['bank_id']}={b['question_count']}" for b in container["banks"])
    print(f"  wrote {out_path.name}: {total} questions ({banks})", flush=True)
    return total


def collapse(text):
    """Collapse runs of whitespace, normalising the odd characters PDFs emit."""
    text = text.replace(" ", " ").replace("﻿", "")
    return re.sub(r"\s+", " ", text).strip()


# All 28 hyphen joins this document needs were read by eye against the PDF text. Every
# one is a syllable break ("righteous-\nness") except these, which are real compounds
# that must keep their hyphen. Each record also keeps its pre-join text for auditing.
COMPOUND_EXCEPTIONS = {"allpowerful": "all-powerful"}


def dehyphenate(text):
    """Join words split across a line break by a soft hyphen."""
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    for joined, correct in COMPOUND_EXCEPTIONS.items():
        text = re.sub(rf"\b{joined}\b", correct, text, flags=re.IGNORECASE)
    return text


# ---------------------------------------------------------------- Baptist PDF


def extract_know_the_truth():
    """60 Q&A from the 'Know the Truth' Baptist catechism PDF (pdftotext -layout)."""
    source_id = "baptist-know-the-truth-catechism"
    text = (RAW / source_id / "catechism-bfm-2000.layout.txt").read_text(
        encoding="utf-8", errors="replace"
    )
    # A form feed, not a newline, precedes the first question on each page, which would
    # hide 21 of the 60 headings from a line-anchored match. Treat it as a line break.
    text = text.replace("\f", "\n")
    # Page numbers sit alone on a line in a wide run of spaces; drop them so they
    # cannot land inside an answer.
    text = re.sub(r"(?m)^[ \t]{20,}\d{1,3}[ \t]*$", "", text)

    starts = [(int(m.group(1)), m.start()) for m in re.finditer(r"(?m)^Question (\d+):", text)]
    if not starts:
        raise RuntimeError("found no 'Question N:' headings in the PDF text")

    questions = []
    unparsed = []
    for index, (number, start) in enumerate(starts):
        end = starts[index + 1][1] if index + 1 < len(starts) else len(text)
        block = dehyphenate(text[start:end])

        question_match = re.search(r"(?s)^Question \d+:(.*?)(?=\nAnswer:)", block)
        answer_match = re.search(r"(?s)\nAnswer:(.*?)(?=\nScripture:|\Z)", block)
        scripture_match = re.search(r"(?s)\nScripture:(.*)", block)
        if not question_match or not answer_match:
            unparsed.append(number)
            continue

        scripture_text = collapse(scripture_match.group(1)) if scripture_match else ""
        # "<quote> -- <reference> (See also: <refs>)"
        see_also = ""
        see_match = re.search(r"\(See also:?\s*(.*?)\)\s*$", scripture_text)
        if see_match:
            see_also = see_match.group(1).strip()
            scripture_text = scripture_text[: see_match.start()].strip()
        reference = ""
        quote = scripture_text
        dash_split = re.split(r"\s--\s", scripture_text)
        if len(dash_split) >= 2:
            quote = " -- ".join(dash_split[:-1]).strip()
            reference = dash_split[-1].strip()

        references = [r for r in [reference] + [s.strip() for s in see_also.split(",")] if r]
        questions.append(
            {
                "number": number,
                "question": collapse(question_match.group(1)),
                "answer": collapse(answer_match.group(1)),
                "options": None,
                "reference": "; ".join(references) or None,
                "scripture_quote": quote.strip('" ') or None,
                "scripture_reference": reference or None,
                "see_also": see_also or None,
                "answer_before_dehyphenation": collapse(
                    re.search(r"(?s)\nAnswer:(.*?)(?=\nScripture:|\Z)", text[start:end]).group(1)
                ),
            }
        )

    if unparsed:
        print(f"  WARNING: no answer parsed for questions {unparsed}", flush=True)
    if len(questions) != 60:
        print(
            f"  WARNING: expected 60 questions, parsed {len(questions)} "
            f"(numbers {questions[0]['number']}..{questions[-1]['number']})",
            flush=True,
        )

    return {
        "source_id": source_id,
        "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "banks": [
            {
                "bank_id": "know-the-truth-60",
                "title": "Know the Truth: 60 Questions and Answers on Christian Beliefs",
                "question_count": len(questions),
                "notes": (
                    "Parsed from pdftotext -layout output. Scripture quotations in this "
                    "document are mostly Holman Christian Standard Bible, used by permission "
                    "for this document only; a few are KJV or NKJV. The quote text is kept in "
                    "scripture_quote and should not be republished without checking the "
                    "translation's own terms. Soft hyphens at line breaks were joined; each "
                    "answer keeps answer_before_dehyphenation for audit."
                ),
                "questions": questions,
            }
        ],
    }


# ------------------------------------------------------------- Creeds.json set

CREEDS_WANTED = [
    ("westminster_shorter_catechism", "Westminster Shorter Catechism (1647)", 107),
    ("westminster_larger_catechism", "Westminster Larger Catechism (1647)", 196),
    ("heidelberg_catechism", "Heidelberg Catechism (1563)", 129),
    ("keachs_catechism", "Keach's Catechism / Baptist Catechism", 118),
    ("1695_baptist_catechism", "The Baptist Catechism (1695 edition)", 114),
    ("puritan_catechism", "A Puritan Catechism (Spurgeon, 1855)", None),
    ("catechism_for_young_children", "Catechism for Young Children (1840)", None),
]


def flatten_proofs(proofs):
    """Turn Creeds.json's [{Id, References:[...]}] into one display string."""
    if not proofs:
        return None
    references = []
    for proof in proofs:
        for reference in proof.get("References") or []:
            if reference not in references:
                references.append(reference)
    return "; ".join(references) or None


def extract_creeds_json():
    """The Reformed catechisms as published by NonlinearFruit/Creeds.json."""
    source_id = "creeds-json-reformed-catechisms"
    banks = []
    for filename, title, expected in CREEDS_WANTED:
        path = RAW / source_id / "creeds" / f"{filename}.json"
        document = json.loads(path.read_text(encoding="utf-8"))
        metadata = document["Metadata"]
        questions = []
        recovered = []
        for entry in document["Data"]:
            answer = collapse(entry.get("Answer") or "")
            marked_up = entry.get("AnswerWithProofs") or ""
            if not answer and marked_up:
                # A few upstream records leave Answer empty but still carry the full
                # answer with [n] proof markers; recover it by dropping the markers.
                answer = collapse(re.sub(r"\[\d+(?:,\s*\d+)*\]", "", marked_up))
                recovered.append(entry.get("Number"))
            questions.append(
                {
                    "number": entry.get("Number"),
                    "question": collapse(entry.get("Question") or ""),
                    "answer": answer,
                    "options": None,
                    "reference": flatten_proofs(entry.get("Proofs")),
                    "answer_with_proof_markers": entry.get("AnswerWithProofs"),
                    "proofs": entry.get("Proofs"),
                }
            )
        if recovered:
            print(
                f"  {filename}: recovered {len(recovered)} empty answers from "
                f"AnswerWithProofs (questions {recovered})",
                flush=True,
            )
        if expected is not None and len(questions) != expected:
            print(
                f"  WARNING: {filename} expected {expected} questions, got {len(questions)}",
                flush=True,
            )
        with_proofs = sum(1 for q in questions if q["reference"])
        banks.append(
            {
                "bank_id": filename,
                "title": title,
                "question_count": len(questions),
                "notes": (
                    f"Year {metadata.get('Year')}; authors {metadata.get('Authors')}; "
                    f"source attribution '{metadata.get('SourceAttribution')}'; "
                    f"upstream source {metadata.get('SourceUrl')}. "
                    f"{with_proofs} of {len(questions)} answers carry proof-text references."
                ),
                "upstream_metadata": metadata,
                "questions": questions,
            }
        )

    return {
        "source_id": source_id,
        "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "banks": banks,
    }


# -------------------------------------------------- Westminster w/ proof texts


def extract_westminster_proof_texts():
    """Westminster Shorter and Larger with the Assembly's clause-level proof texts."""
    source_id = "westminster-proof-texts"
    banks = []
    for filename, bank_id, title, expected in [
        ("wsc.json", "westminster_shorter_with_proofs", "Westminster Shorter Catechism (1647), with the Assembly's proof texts", 107),
        ("wlc.json", "westminster_larger_with_proofs", "Westminster Larger Catechism (1648), with the Assembly's proof texts", 196),
    ]:
        document = json.loads((RAW / source_id / "out" / filename).read_text(encoding="utf-8"))
        questions = []
        for entry in document["questions"]:
            primary, secondary = [], []
            for clause in entry.get("clauses") or []:
                for proof in clause.get("proofs") or []:
                    if proof.get("display") and proof["display"] not in primary:
                        primary.append(proof["display"])
                for proof in clause.get("secondaryProofs") or []:
                    if proof.get("display") and proof["display"] not in secondary:
                        secondary.append(proof["display"])
            questions.append(
                {
                    "number": entry.get("number"),
                    "question": collapse(entry.get("question") or ""),
                    "answer": collapse(entry.get("answer") or ""),
                    "options": None,
                    "reference": "; ".join(primary) or None,
                    "secondary_proof_references": "; ".join(secondary) or None,
                    "division_id": entry.get("divisionId"),
                    "clauses": entry.get("clauses"),
                }
            )
        if len(questions) != expected:
            print(f"  WARNING: {filename} expected {expected}, got {len(questions)}", flush=True)
        with_proofs = sum(1 for q in questions if q["reference"])
        banks.append(
            {
                "bank_id": bank_id,
                "title": title,
                "question_count": len(questions),
                "notes": (
                    f"{with_proofs} of {len(questions)} answers carry primary proof texts. "
                    "Proofs are held per answer clause upstream; this extraction flattens them "
                    "per question and keeps the clause structure in 'clauses'. The upstream "
                    "catechism metadata is in "
                    f"{(document.get('catechism') or {})}"
                ),
                "questions": questions,
            }
        )

    return {
        "source_id": source_id,
        "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "banks": banks,
    }


# -------------------------------------------------- Baltimore (Gutenberg text)


def extract_baltimore():
    """Baltimore Catechism No. 1 and No. 2 from the Project Gutenberg plain texts."""
    source_id = "gutenberg-baltimore-catechism"
    banks = []
    for ebook_id, bank_id, title in [
        (14551, "baltimore_no_1", "A Catechism of Christian Doctrine, No. 1 (Baltimore Catechism No. 1, 1885)"),
        (14552, "baltimore_no_2", "A Catechism of Christian Doctrine, No. 2 (Baltimore Catechism No. 2, 1885)"),
    ]:
        text = (RAW / source_id / f"pg{ebook_id}.txt").read_text(encoding="utf-8")
        # Keep only the Gutenberg body, so the licence header/footer cannot be parsed.
        body_start = text.find("*** START")
        body_end = text.find("*** END")
        if body_start < 0 or body_end < 0:
            raise RuntimeError(f"pg{ebook_id}.txt: missing Gutenberg START/END markers")
        body = text[text.index("\n", body_start) : body_end]

        lesson = None
        lessons = {}
        for match in re.finditer(r"(?m)^(LESSON [A-Z0-9\- ]+)\s*$", body):
            lessons[match.start()] = collapse(match.group(1))

        starts = [
            (int(m.group(1)), m.start(), m.end())
            for m in re.finditer(r"(?m)^(\d{1,4})\. Q\. ", body)
        ]
        if not starts:
            raise RuntimeError(f"pg{ebook_id}.txt: found no 'N. Q.' question markers")

        questions = []
        unparsed = []
        for index, (number, start, question_body_start) in enumerate(starts):
            end = starts[index + 1][1] if index + 1 < len(starts) else len(body)
            block = body[question_body_start:end]
            # The heading of the next lesson can sit inside this slice; cut it off.
            lesson_in_block = re.search(r"(?m)^LESSON [A-Z0-9\- ]+\s*$", block)
            if lesson_in_block:
                block = block[: lesson_in_block.start()]
            for position, name in lessons.items():
                if position < start:
                    lesson = name

            answer_match = re.search(r"(?sm)^A\. (.*)", block)
            if not answer_match:
                unparsed.append(number)
                continue
            question_text = block[: answer_match.start()]
            questions.append(
                {
                    "number": number,
                    "question": collapse(question_text),
                    "answer": collapse(answer_match.group(1)),
                    "options": None,
                    "reference": None,
                    "lesson": lesson,
                }
            )

        if unparsed:
            print(f"  WARNING: pg{ebook_id}: no answer parsed for {unparsed}", flush=True)
        banks.append(
            {
                "bank_id": bank_id,
                "title": title,
                "question_count": len(questions),
                "notes": (
                    f"Project Gutenberg ebook {ebook_id}, parsed from the plain-text edition "
                    "between its START and END markers so no Gutenberg licence boilerplate is "
                    "included. No. 1 is an abridgement of No. 2, so its numbering has "
                    "deliberate gaps (the transcriber's note says so). This catechism carries "
                    "no proof-text references. Questions are grouped by the lesson heading "
                    "they fall under, kept in 'lesson'."
                ),
                "questions": questions,
            }
        )

    return {
        "source_id": source_id,
        "extracted_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "banks": banks,
    }


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    grand_total = 0
    for extractor in (
        extract_know_the_truth,
        extract_creeds_json,
        extract_westminster_proof_texts,
        extract_baltimore,
    ):
        print(f"{extractor.__name__}:", flush=True)
        grand_total += write_source(extractor())
    print(f"\ncatechism questions extracted: {grand_total}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
