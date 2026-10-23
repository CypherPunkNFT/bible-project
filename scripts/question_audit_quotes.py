"""Compare every phrase in quotation marks in audited questions with the BSB text of the question's reference.

The audit model is told to quote only the BSB, but its replies are not trusted on that: this lists every quotation of
three words or more that the passage (give or take two verses) does not hold word for word, so each can be put right
by hand. Read-only; it changes nothing.

    python scripts/question_audit_quotes.py [--all]   # --all: also kept questions, not only fixed ones
"""
from __future__ import annotations

import argparse
import json
import re
import sys

from question_audit import BANK, bible_book, load_audit, parse_spans, span_keys, tag_spans

QUOTE = re.compile(r"\"([^\"]+)\"|“([^”]+)”|‘([^’]+)’(?![a-z])|(?<![A-Za-z])'([^']+)'(?![A-Za-z])")


def plain(text: str) -> str:
    text = text.lower().replace("’", "'").replace("‘", "'")
    text = re.sub(r"(?<![a-z])'|'(?![a-z])", " ", text)  # a quotation mark, not an apostrophe
    return " ".join(re.sub(r"[^a-z0-9' ]+", " ", text).split())


def passage_text(reference: str, passages: list[dict]) -> str | None:
    """The BSB text of the reference, or of the question's tagged passages when the reference is in a form the
    parser does not read (the creeds' "Matt.6.10")."""
    spans = parse_spans(reference) or tag_spans(passages)
    if not spans:
        return None
    parts = []
    for span in spans:
        keys = span_keys(span, 2)
        if not keys:
            return None
        verses = bible_book(span["book"])
        parts.extend(verses[k] for k in keys)
    return plain(" ".join(parts))


def quotations(text: str) -> list[str]:
    found = []
    for match in QUOTE.finditer(text or ""):
        quote = next(g for g in match.groups() if g)
        found.extend(part for part in re.split(r"\.\.\.|…", quote) if len(plain(part).split()) >= 3)
    return found


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()
    passages = {q["id"]: q.get("passages") for q in json.loads(BANK.read_text(encoding="utf-8"))["questions"]}
    problems = 0
    for qid, record in load_audit()["questions"].items():
        if record["verdict"] == "hide" or (record["verdict"] == "keep" and not args.all):
            continue
        shown = record["after"] or record["before"]
        texts = [shown["question"], shown["answer"], shown["right"]]  # wrong choices are meant not to match
        quotes = [q for t in texts for q in quotations(t)]
        if not quotes:
            continue
        bible = passage_text(shown["reference"], passages.get(qid))
        for quote in quotes:
            if bible is None or plain(quote) not in bible:
                problems += 1
                where = shown["reference"] or "no reference"
                print(f"{qid}\n  quote: {quote}\n  ref:   {where}{'' if bible else ' (not readable)'}\n"
                      f"  q:     {shown['question']}")
    print(f"\n{problems} quotations not found word for word in their passage", file=sys.stderr)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
