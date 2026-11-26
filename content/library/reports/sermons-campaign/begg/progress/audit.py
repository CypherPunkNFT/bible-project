"""Audit a random sample of the new Begg placements against the held page, independently of the parser.

For each sampled work in passage-overlays/begg.json: read the held page's visible scripture line (the text a reader sees,
not the scripture_ref meta the parser used), turn each placed verse id (BBCCCVVV) back into "Book C:V" with its own book
list, and compare. Simple one-range lines are checked automatically; anything else is printed for a reading check.
Usage (from Website/): python -X utf8 content/library/reports/sermons-campaign/begg/progress/audit.py 60 > out.json
"""
import html
import json
import random
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[5]
HELD = SITE.parent / "sources" / "library" / "source-truth-for-life"
BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings",
         "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalm", "Proverbs", "Ecclesiastes",
         "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah",
         "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts",
         "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians",
         "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John",
         "2 John", "3 John", "Jude", "Revelation"]


def verse(number):
    return BOOKS[number // 1000000 - 1], number // 1000 % 1000, number % 1000


def visible_line(text):
    lead = re.search(r"class=scripture-reference-lead>(.*?)\(ID:", text, re.DOTALL)
    body = re.sub(r"<svg.*?</svg>|<\?xml[^>]*>", "", lead.group(1), flags=re.DOTALL) if lead else ""
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", body)).split())


def expected(start, end):
    (b1, c1, v1), (b2, c2, v2) = verse(start), verse(end)
    if b1 != b2:
        return f"{b1} {c1}:{v1} – {b2} {c2}:{v2}"
    if c1 != c2:
        return f"{b1} {c1}:{v1}–{c2}:{v2}"
    return f"{b1} {c1}:{v1}" + (f"–{v2}" if v2 != v1 else "")


def main():
    size = int(sys.argv[1]) if len(sys.argv) > 1 else 60
    overlay = json.loads((SITE / "content/library/passage-overlays/begg.json").read_text(encoding="utf-8"))
    placed = sorted(w for w, e in overlay["works"].items() if w.startswith("work-sermons-begg-") and e.get("passages"))
    random.seed(20261126)
    rows = []
    for work_id in random.sample(placed, min(size, len(placed))):
        passages = overlay["works"][work_id]["passages"]
        asset = re.search(r"held asset (asset-sermons-begg-\d+)", passages[0]["locator"]).group(1)
        line = visible_line((HELD / asset / "original.html").read_text(encoding="utf-8"))
        mine = "; ".join(expected(p["start"], p["end"]) for p in passages)
        simple = re.fullmatch(r"(?:[1-3] )?[A-Z][a-z]+(?: of [A-Z][a-z]+)? \d+:\d+(?:[–-]\d+)?", line.replace("Psalms", "Psalm"))
        verdict = ("match" if line.replace("Psalms", "Psalm").replace("-", "–") == mine else "MISMATCH") if simple else "read by hand"
        rows.append(dict(workId=work_id, asset=asset, pageShows=line, placedAs=mine, verdict=verdict))
    print(json.dumps(dict(sampled=len(rows), placedNew=len(placed), rows=rows), indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
