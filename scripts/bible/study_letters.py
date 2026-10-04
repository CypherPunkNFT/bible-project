"""New Testament letter structure: each letter's outline from the Berean Standard Bible's own section headings
(public domain, already parsed into data/text/bsb), with author and recipients from the letter's opening verses.
"""

import json
from pathlib import Path

from .books import verse_id
from .study_refs import Verses, parse_refs

# code: (from, to, the verses that say so) — taken from each letter's own opening; "" = the letter does not say.
OPENINGS = {
    "ROM": ("Paul", "the saints in Rome", "Romans 1:1, 7"),
    "1CO": ("Paul and Sosthenes", "the church of God at Corinth", "1 Corinthians 1:1-2"),
    "2CO": ("Paul and Timothy", "the church at Corinth and the saints in Achaia", "2 Corinthians 1:1"),
    "GAL": ("Paul and the brothers with him", "the churches of Galatia", "Galatians 1:1-2"),
    "EPH": ("Paul", "the saints at Ephesus", "Ephesians 1:1"),
    "PHP": ("Paul and Timothy", "the saints at Philippi, with the overseers and deacons", "Philippians 1:1"),
    "COL": ("Paul and Timothy", "the saints at Colossae", "Colossians 1:1-2"),
    "1TH": ("Paul, Silvanus and Timothy", "the church of the Thessalonians", "1 Thessalonians 1:1"),
    "2TH": ("Paul, Silvanus and Timothy", "the church of the Thessalonians", "2 Thessalonians 1:1"),
    "1TI": ("Paul", "Timothy", "1 Timothy 1:1-2"),
    "2TI": ("Paul", "Timothy", "2 Timothy 1:1-2"),
    "TIT": ("Paul", "Titus", "Titus 1:1, 4"),
    "PHM": ("Paul and Timothy", "Philemon, Apphia, Archippus and the church in his house", "Philemon 1:1-2"),
    "HEB": ("", "", ""),
    "JAS": ("James", "the twelve tribes scattered abroad", "James 1:1"),
    "1PE": ("Peter", "the scattered in Pontus, Galatia, Cappadocia, Asia and Bithynia", "1 Peter 1:1"),
    "2PE": ("Simon Peter", "those who share a faith as precious as ours", "2 Peter 1:1"),
    "1JN": ("", "", ""),
    "2JN": ("the elder", "the elect lady and her children", "2 John 1:1"),
    "3JN": ("the elder", "Gaius", "3 John 1:1"),
    "JUD": ("Jude", "those who are called, loved and kept", "Jude 1:1"),
}


def build_letters(data_root: Path, verses: Verses) -> list[dict]:
    letters = []
    for code, (author, recipients, opening) in OPENINGS.items():
        folder = data_root / "text" / "bsb" / code  # one file per chapter, named by its (numeric) label
        files = sorted(folder.glob("*.json"), key=lambda p: int(p.stem)) if folder.is_dir() else []
        if not files:
            raise ValueError(f"letters: {folder} has no chapter files; build the Bible data first")
        book = {"chapters": [json.loads(p.read_text(encoding="utf-8")) for p in files]}
        sections: list[dict] = []
        total = 0
        for chapter in book["chapters"]:
            for verse in chapter["v"]:
                if not verse["n"].isdigit():
                    continue
                vid = verse_id(code, int(chapter["c"]), int(verse["n"]))
                total += 1
                titles = [text for kind, text in verse.get("h", []) if kind in ("s", "s1")]
                if titles:
                    if sections and sections[-1]["start"] == vid:
                        sections[-1]["title"] += " " + titles[-1]  # two headings on one verse (Heb 11:30)
                    else:
                        sections.append({"title": titles[0] if len(titles) == 1 else " ".join(titles), "start": vid, "end": vid})
                if sections:
                    sections[-1]["end"] = vid
                    sections[-1]["verses"] = sections[-1].get("verses", 0) + 1
        if not sections or sections[0]["start"] != verse_id(code, 1, 1):
            raise ValueError(f"letters: {code}: the BSB outline does not start at 1:1")
        letters.append({
            "code": code,
            "author": author,
            "recipients": recipients,
            "opening": parse_refs(opening, verses) if opening else [],
            "verses": total,
            "sections": sections,
        })
    return letters
