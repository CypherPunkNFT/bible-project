"""The credit a reader sees for each bank of the Question Bank, on the Questions page's Sources list.

The corpus's own `attribution` notes (content/questions/sources/tools/source_metadata.py) were written for us: what a
licence requires of us, or that a source has no licence at all. Until 27 November 2026 the page printed them word for
word ("Required by CC BY-SA 4.0: credit …", "MIT requires the notice to be included", "Credit … if permission is ever
obtained"); the source permissions register of that day found it
(content/library/reports/source-permissions-20261127/REPORT.md, bucket 2). Those notes stay in the official record;
the page shows only what is below.

Every bank in BANKS (build-question-bank.py) needs an entry here, so a new bank cannot reach the page with a note for
us in place of a credit. Each entry is the credit sentence, the licence it is shared under (named with its version and
linked) and, for the two MIT-licensed banks, the licence notice itself, which MIT requires to travel with the
questions. A bank whose source is in the public domain and needs no credit has `credit` None.

Kinds of entry:
  - CC BY-SA 4.0: who made it and where, that Bible Guide adapted it and how, and that the adapted questions are
    shared under the same licence (the licence's attribution, change and share-alike terms);
  - unfoldingWord: the wording its own LICENSE.md asks of a derivative work, with its copyright line and without its
    trademark sign;
  - MIT: the copyright holder named in the LICENSE file and the full notice (MIT_NOTICE);
  - no licence (owner's rule of 2026-10-17 for unlicensed public content): a plain credit to the source, and nothing
    about permission, which is the owner's business, not the reader's.
"""

from __future__ import annotations

from pathlib import Path

RAW = Path(__file__).resolve().parent.parent / "content" / "questions" / "sources" / "raw"

CC_BY_SA_4 = ("CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/")
CC_BY_4 = ("CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/")
UNLICENSE = ("The Unlicense", "https://unlicense.org/")
MIT = ("MIT License", "https://opensource.org/license/mit")

ADAPTED = ("Adapted for Bible Guide (wording edited, answer choices and Bible references added); the adapted questions "
           "are shared under the same licence.")
CREEDS_JSON = "Transcription from Creeds.json by NonlinearFruit, placed in the public domain under the Unlicense."

# The MIT licence text as both repositories' LICENSE files print it (content/questions/sources/raw/<repo>/LICENSE),
# after the copyright line. Kept here because raw/ is not in git; check_notices() compares it with them where held.
MIT_PERMISSION = """Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE."""


def mit_notice(holder: str) -> str:
    return f"MIT License\n\nCopyright (c) {holder}\n\n{MIT_PERMISSION}"


SAKALA = mit_notice("2025 Eric Sakala")
KORSAH = mit_notice("2026 Daniel Korsah")
MIT_FILES = {"brianchanda-bible-quiz": SAKALA, "danielkorsah-bible-trivia-game": KORSAH}


def entry(credit: str | None, licence: tuple[str, str] | None = None, notice: str | None = None) -> dict:
    return {"credit": credit, "licence": licence[0] if licence else None, "licence_url": licence[1] if licence else None,
            "notice": notice}


MTC_TRIVIA = entry("Questions from “300 Bible Trivia Questions for Kids” by Tony Kummer, Ministry-To-Children.com. "
                   + ADAPTED, CC_BY_SA_4)
KORSAH_CREDIT = entry("Questions from the Bible Trivia Game by Daniel Korsah (DanielKorsah03/Bible-Trivia-Game on GitHub), "
                      "copyright 2026 Daniel Korsah, used under the MIT License.", MIT, KORSAH)

PUBLIC_CREDITS: dict[str, dict] = {
    "scripture-buzzer": entry("Questions from the Scripture Buzzer quiz by AyandaNgubane (AyandaNgubane/Bible-Quiz on GitHub)."),
    "final-bible-quiz-200": entry("Questions from the Bible Quiz app (BRIANCHANDA/Bible-Quiz on GitHub), copyright 2025 "
                                  "Eric Sakala, used under the MIT License.", MIT, SAKALA),
    "database-seed": KORSAH_CREDIT,
    "added-very-hard": KORSAH_CREDIT,
    "religion-and-mythology-bible-subset": entry("Questions from Open-trivia-database by el-cms (el-cms/Open-trivia-database "
                                                 "on GitHub)."),
    "bible-trivia-alpaca": entry("Questions from the bibile_trivia_alpaca dataset by liaaron1 on Hugging Face."),
    "kids-bible-trivia-300": MTC_TRIVIA,
    "opentdb-bible-subset": entry("Questions from the Open Trivia Database (opentdb.com). " + ADAPTED, CC_BY_SA_4),
    "religion-faith-bible-subset": entry("Questions from OpenTriviaQA by uberspot (uberspot/OpenTriviaQA on GitHub). "
                                         + ADAPTED, CC_BY_SA_4),
    "pg29067": entry("Jesse Lyman Hurlbut, Hurlbut's Bible Lessons for Boys and Girls (1903). Public domain."),
    "know-the-truth-60": entry("Know the Truth: 60 Questions and Answers on Christian Beliefs, Edition 2.1, used at First "
                               "Baptist Church, Tallassee, Alabama; based on the 2000 Baptist Faith and Message."),
    "1695_baptist_catechism": entry(CREEDS_JSON, UNLICENSE),
    "keachs_catechism": entry(CREEDS_JSON, UNLICENSE),
    "puritan_catechism": entry(CREEDS_JSON, UNLICENSE),
    "westminster_shorter_with_proofs": entry("The Westminster Shorter Catechism (1647) with the Assembly's proof texts, "
                                             "from Sundar1205/westminster-catechism on GitHub."),
    "westminster_larger_with_proofs": entry("The Westminster Larger Catechism (1648) with the Assembly's proof texts, from "
                                            "Sundar1205/westminster-catechism on GitHub."),
    "westminster_shorter_catechism": entry(CREEDS_JSON, UNLICENSE),
    "westminster_larger_catechism": entry(CREEDS_JSON, UNLICENSE),
    "heidelberg_catechism": entry(CREEDS_JSON, UNLICENSE),
    "catechism_for_young_children": entry(CREEDS_JSON, UNLICENSE),
    "pg13274": entry("John Mason, A Little Catechism, with Little Verses and Little Sayings for Little Children (1692). "
                     "Public domain."),
    "pg36081": entry("Harald Ulrik Sverdrup and Hans Andreas Urseth, Luther's Small Catechism Explained in Questions and "
                     "Answers (1900). Public domain."),
    "mined-bibleqa": entry("Facts from BibleQA (helen-jiahe-zhao/BibleQA on GitHub); wording by Claude Haiku."),
    "mined-bibledata": entry("BibleData: Structured Datasets from the Holy Bible, by Brady Stephenson, licensed under CC BY "
                             "4.0; questions worded and choices written by Claude Haiku.", CC_BY_4),
    "mined-pg9912": entry("Joseph Stump, An Explanation of Luther's Small Catechism (1910). Answers drawn from its lesson "
                          "text by Claude Haiku."),
    "mined-pg53465": entry("George Mezger, Lessons in the Small Catechism of Dr. Martin Luther (Concordia, 1923). Answers "
                           "drawn from its lesson text by Claude Haiku."),
    "written-bsb": None,  # the credit build-question-bank.py's written_records give, kept as it is (it names the reviewers)
    "children-assu": entry(None),
    "children-boston": entry(None),
    "children-manly": entry(None),
    "children-little": entry(None),
    "children-boyce": entry(None),
    "children-mtc": entry("Questions from Tony Kummer's Sunday school lessons on Ministry-To-Children.com, reworded for "
                          "children and the Berean Standard Bible by Bible Guide; the adapted questions are shared under "
                          "the same licence.", CC_BY_SA_4),
    "children-uw": entry("Questions adapted from the Open Bible Stories Translation Questions, copyright © 2023 by "
                         "unfoldingWord. The original work by unfoldingWord is available from https://openbiblestories.org. "
                         "Bible Guide reworded them for children and the Berean Standard Bible; the adapted questions are "
                         "shared under the same licence.", CC_BY_SA_4),
}


def public_credit(bank_id: str, attribution: str | None) -> dict:
    """The reader's credit for one bank. `attribution` is the record's own note, used only for the written questions,
    whose note is already a credit for readers."""
    if bank_id not in PUBLIC_CREDITS:
        raise SystemExit(f"bank {bank_id!r} has no public credit in scripts/question_credits.py: write the credit a "
                         "reader should see before building")
    found = PUBLIC_CREDITS[bank_id]
    return found if found is not None else entry(attribution)


def check_banks(banks: set[str]) -> None:
    if set(PUBLIC_CREDITS) != banks:
        raise SystemExit(f"scripts/question_credits.py and BANKS disagree: missing {sorted(banks - set(PUBLIC_CREDITS))}, "
                         f"extra {sorted(set(PUBLIC_CREDITS) - banks)}")


def check_notices() -> None:
    """Where the downloaded repositories are held, their LICENSE files must say what is shown (line ends and trailing
    spaces aside)."""
    for folder, notice in MIT_FILES.items():
        path = RAW / folder / "LICENSE"
        if not path.exists():
            continue
        held = "\n".join(line.rstrip() for line in path.read_text(encoding="utf-8").strip().splitlines())
        if held != notice:
            raise SystemExit(f"{path} no longer matches the MIT notice in scripts/question_credits.py")


def merged(credits: list[dict]) -> dict:
    """One collection's credit when its questions come from more than one bank (the Westminster catechisms come from
    both Creeds.json and Sundar1205's edition): each distinct credit and notice once, in order, and the licences listed."""
    def distinct(key: str) -> list[str]:
        return list(dict.fromkeys(c[key] for c in credits if c[key]))
    licences = list(dict.fromkeys((c["licence"], c["licence_url"]) for c in credits if c["licence"]))
    return {"credit": " ".join(distinct("credit")) or None,
            "licences": [{"name": name, "url": url} for name, url in licences],
            "notice": "\n\n".join(distinct("notice")) or None}
