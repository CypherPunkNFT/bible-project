"""Guard 2 of the hymns pipeline (plan section 8): check run 1's answers against what each item offered and against the
site's own KJV. No model.

- A pick must be a code that line was offered (a candidate letter, or a verse of the given psalm). Anything else is
  dropped and counted.
- A proposal (a verse Haiku names beyond the candidates) must be a real verse, and its quoted KJV words must really be
  in it: at least 60% of the quote's words, in order, in the verse named. If they are not, the same chapter and then the whole KJV are
  searched for the quote; found in exactly one verse, the reference is corrected and flagged "moved"; otherwise it is
  rejected as "quote not found". This is the measured hallucination rate.
- Only high-confidence picks and proposals go on to run 2; the rest are kept for the record.

Reads Research/Hymns/pipeline/{hymns,llm-items}.json and a run's answers (BatchRunner's OUT/<item>.json).
Writes Research/Hymns/pipeline/run1-checked.json (or --write elsewhere for a pilot).

    python scripts/hymns/check-proposals.py --answers ../Research/Hymns/llm-answers/run1
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from hymns_common import (
    CANON,
    HYMNS_FILE,
    PIPELINE,
    STOP,
    bible,
    chapter_verses,
    read_json,
    ref_label,
    stems,
    verse_text,
    write_json,
)

sys.stdout.reconfigure(encoding="utf-8")
COVER = 0.8         # share of the quote's words, in order, that must be in a verse found by searching
COVER_NAMED = 0.6   # the same, in the verse the model named (it often recalls a word or two differently)
ROMAN = {"i": "1", "ii": "2", "iii": "3", "first": "1", "second": "2", "third": "3"}
BOOK_NAMES = {name.lower(): code for code, name, *_ in CANON}
BOOK_NAMES.update({"psalm": "PSA", "song of solomon": "SNG", "canticles": "SNG", "song": "SNG", "revelations": "REV",
                   "the revelation": "REV", "acts of the apostles": "ACT", "ecclesiastes": "ECC", "qoheleth": "ECC"})
REF = re.compile(r"^\s*((?:[123]|i{1,3}|first|second|third)?\s*[A-Za-z][A-Za-z .]*?)\s+(\d+)\s*[:.]\s*(\d+)(?:\s*[-–]\s*(\d+))?\s*$", re.IGNORECASE)


def parse_ref(text: str) -> tuple[str, int, int, int] | None:
    found = REF.match(text or "")
    if not found:
        return None
    words = found.group(1).lower().replace(".", " ").split()
    if words and words[0] in ROMAN:
        words[0] = ROMAN[words[0]]
    code = BOOK_NAMES.get(" ".join(words))
    if not code:
        return None
    first = int(found.group(3))
    return code, int(found.group(2)), first, int(found.group(4) or first)


def coverage(quote: list[str], verse: list[str]) -> float:
    """The share of the quote's words that appear in the verse in the same order (longest common subsequence)."""
    if not quote:
        return 0.0
    previous = [0] * (len(verse) + 1)
    for q in quote:
        row = [0]
        for j, v in enumerate(verse):
            row.append(previous[j] + 1 if q == v else max(previous[j + 1], row[j]))
        previous = row
    return previous[-1] / len(quote)


class Kjv:
    """Every verse's stems, and for a whole-Bible search an index by rare word."""

    def __init__(self) -> None:
        self.stems: dict[tuple[str, int, int], list[str]] = {}
        self.by_word: dict[str, set[tuple[str, int, int]]] = {}
        for code, *_ in CANON:
            for key, text in bible("kjv")[code].items():
                chapter, verse = (int(x) for x in key.split(":"))
                words = stems(text)
                self.stems[(code, chapter, verse)] = words
                for w in set(words):
                    if w not in STOP:
                        self.by_word.setdefault(w, set()).add((code, chapter, verse))

    def passage(self, code: str, chapter: int, first: int, last: int) -> list[str]:
        return [w for n in range(first, last + 1) for w in self.stems.get((code, chapter, n), [])]

    def find(self, quote: list[str], chapter: tuple[str, int] | None) -> list[tuple[str, int, int]]:
        """Verses holding the quote (coverage ≥ COVER): within one chapter if given, else the whole KJV."""
        content = [w for w in quote if w not in STOP and w in self.by_word]
        if chapter:
            pool = {k for k in self.stems if k[:2] == chapter}
        elif content:
            rarest = sorted(content, key=lambda w: len(self.by_word[w]))[:2]
            pool = set.intersection(*(self.by_word[w] for w in rarest)) if len(rarest) == 2 else self.by_word[rarest[0]]
        else:
            return []
        return sorted(k for k in pool if coverage(quote, self.stems[k]) >= COVER)


def check_proposal(kjv: Kjv, entry: dict) -> dict:
    """{status: ok | moved | no such verse | quote not found | unreadable, code, chapter, first, last}."""
    ref = parse_ref(entry["propose"])
    quote = stems(entry.get("propose_words") or "")
    if not ref:
        return {"status": "unreadable", "note": f"reference {entry['propose']!r} could not be read"}
    if len(quote) < 3:
        return {"status": "quote not found", "note": "no quotation, or under three words"}
    code, chapter, first, last = ref
    exists = verse_text("kjv", code, chapter, first) is not None and verse_text("kjv", code, chapter, last) is not None
    if exists and coverage(quote, kjv.passage(code, chapter, first, last)) >= COVER_NAMED:
        return {"status": "ok", "code": code, "chapter": chapter, "first": first, "last": last}
    for scope in ((code, chapter), None):
        if scope and not chapter_verses("kjv", *scope):
            continue
        found = kjv.find(quote, scope)
        if len(found) == 1:
            c, ch, v = found[0]
            return {"status": "moved", "code": c, "chapter": ch, "first": v, "last": v,
                    "note": f"named {entry['propose']}; the quoted words are in {ref_label(c, ch, v)}"}
        if len(found) > 1:
            return {"status": "quote not found", "note": f"the quoted words are in {len(found)} verses; cannot tell which"}
    return {"status": "no such verse" if not exists else "quote not found",
            "note": f"{entry['propose']} {'does not exist' if not exists else 'does not hold the quoted words'}, and they are nowhere else in the KJV"}


def check_hymn(kjv: Kjv, hymn: dict, offered: dict, answer: dict) -> dict:
    echoes, record, tally = [], [], Counter()
    for entry in answer.get("lines") or []:
        where = offered["lines"].get(str(entry["line"]))
        if not where:
            tally["line out of range"] += 1
            continue
        base = {"lineNumber": entry["line"], "stanza": where["stanza"], "line": where["line"]}
        pick = (entry.get("pick") or "none").strip()
        if pick != "none":
            verse = where["candidates"].get(pick)
            source = "matched"
            if verse is None and offered["psalm"] and re.fullmatch(r"P\d+", pick) and int(pick[1:]) in offered["psalm"]["verses"]:
                verse, source = {"code": "PSA", "chapter": offered["psalm"]["chapter"], "verse": int(pick[1:])}, "psalm"
            if verse is None:
                tally["pick not offered"] += 1
                record.append({**base, "rejected": f"picked {pick!r}, which was not offered"})
            else:
                e = {**base, "source": source, "code": verse["code"], "chapter": verse["chapter"], "first": verse["verse"],
                     "last": verse["verse"], "confidence": entry["pick_confidence"]}
                tally[f"pick {entry['pick_confidence']}"] += 1
                (echoes if e["confidence"] == "high" else record).append(e)
        if (entry.get("propose") or "").strip():
            result = check_proposal(kjv, entry)
            tally[f"proposal {entry.get('propose_confidence')}: {result['status']}"] += 1
            e = {**base, "source": "proposed", "named": entry["propose"], "quote": entry.get("propose_words"),
                 "kind": entry.get("propose_kind"), "confidence": entry.get("propose_confidence"), **result}
            dup = any(x["code"] == e.get("code") and x["chapter"] == e.get("chapter") and x["first"] == e.get("first")
                      and x["lineNumber"] == e["lineNumber"] for x in echoes)
            if result["status"] in ("ok", "moved") and e["confidence"] == "high" and not dup:
                echoes.append(e)
            else:
                record.append(e)
    main = (answer.get("main_passage") or "none").strip()
    main_verse = offered["strongest"].get(main) if main != "none" else None
    if main != "none" and main_verse is None:
        tally["main passage not offered"] += 1
    return {"id": hymn["id"], "echoes": echoes, "record": record, "tally": dict(tally),
            "heading": {"fits": answer.get("heading_fits"), "line": answer.get("heading_line") or 0},
            "mainPassage": main_verse}


def answer_of(path: Path) -> dict | None:
    raw = read_json(path)
    out = raw.get("structured_output") if isinstance(raw, dict) else None
    if out is None and isinstance(raw, dict) and isinstance(raw.get("result"), str):
        try:
            out = json.loads(raw["result"])
        except json.JSONDecodeError:
            return None
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--answers", type=Path, required=True, help="BatchRunner OUT folder of run 1")
    parser.add_argument("--write", type=Path, default=PIPELINE / "run1-checked.json")
    args = parser.parse_args()
    hymns = {h["id"]: h for h in read_json(HYMNS_FILE)["hymns"]}
    index = read_json(PIPELINE / "llm-items.json")
    kjv = Kjv()
    results, missing, total = [], [], Counter()
    for name, offered in index.items():
        path = args.answers / f"{name}.json"
        if not path.exists():
            continue
        answer = answer_of(path)
        if answer is None:
            missing.append(name)
            continue
        checked = check_hymn(kjv, hymns[offered["id"]], offered, answer)
        checked["item"] = name
        results.append(checked)
        total.update(checked["tally"])
    write_json(args.write, {"schema": "bibleproject.hymn-run1-checked/v1", "hymns": results})
    print(f"{len(results)} hymns checked; {len(missing)} answers unreadable {missing[:5]}")
    for key, n in sorted(total.items()):
        print(f"  {key}: {n}")
    print(f"  going on to run 2: {sum(len(r['echoes']) for r in results)} echoes")


if __name__ == "__main__":
    main()
