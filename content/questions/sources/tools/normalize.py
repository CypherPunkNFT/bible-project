"""Normalise every extracted bank into one common record shape, under normalized/.

Reads extracted/*.json for the twelve batch-2 sources, writes normalized/*.json. Raw
files are never touched and extracted files are never modified. Batch 3 has its own
normaliser (normalize_batch3.py) and is deliberately not read here.

Each normalised record carries the five fields the brief asks for - question, answer,
options, reference, source id - plus the licence verdict for that source and the credit
that verdict requires, so a record can never be separated from the terms it arrived
under or from who it belongs to.

Run: python tools/normalize.py
"""

import json
import os
import re
import sys
import time
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from source_metadata import BATCH_2  # noqa: E402

CORPUS_ROOT = Path(__file__).resolve().parent.parent
EXTRACTED = CORPUS_ROOT / "extracted"
NORMALIZED = CORPUS_ROOT / "normalized"

# The owner's publishing decision of 2026-10-17, recorded verbatim in the outputs it
# governs. It changes what "publishable" means for this project; it does not publish
# anything, and nothing in this corpus is wired into the website.
PUBLISHING_RULE = {
    "headline": "Publishing rule: non-commercial project, owner decision 2026-10-17.",
    "decided": "2026-10-17",
    "decided_by": "owner",
    "basis": (
        "The Bible Project is a non-commercial product that is distributed freely. "
        "Publishability is judged on that footing."
    ),
    "non_commercial_licences": (
        "CC BY-NC, CC BY-NC-SA and bespoke 'free distribution, no selling' grants COUNT AS "
        "PUBLISHABLE for this project. The required credit is recorded with the source."
    ),
    "open_licences": (
        "CC BY, CC BY-SA, MIT, CC0, the Unlicense and public domain are publishable. "
        "Attribution and share-alike obligations are recorded with the source."
    ),
    "scripture_quotations": (
        "A few short Scripture quotations from a copyrighted translation, inside a work "
        "that is otherwise freely distributable, do not block publishing."
    ),
    "no_licence": (
        "Owner correction of the same date: content shared publicly online with NO licence "
        "at all is treated as reproducible for this non-commercial project. The original "
        "source is credited on every record."
    ),
    "research_only_test": (
        "Research-only is kept ONLY where a source explicitly forbids reuse or "
        "redistribution."
    ),
}

# The source whose CC BY-SA 4.0 governs the questions the Hugging Face set copied from it.
OVERLAP_DONOR = "ministry-to-children-kids-bible-trivia"
OVERLAP_BORROWER = "liaaron1-bible-trivia-alpaca"
# Measured, and asserted below so a re-extraction cannot move it unnoticed.
EXPECTED_OVERLAP = 244

# The licence verdict per source. 'publishable' means: may this text go on the public
# website, under the owner's rule above. 'publishable_reason' says why, in the words of
# that rule, so the verdict can be audited without reading this file.
LICENCE = {
    "baptist-know-the-truth-catechism": {
        "licence": "Bespoke grant: free copying and distribution, no selling. Not an open licence.",
        "licence_class": "permission-granted-non-commercial",
        "publishable": True,
        "attribution_required": True,
        "question_origin": "human-written",
        "publishable_reason": (
            "Free distribution granted, no selling; publishable for this non-commercial "
            "project under the owner's rule of 2026-10-17. The owner has also ruled that "
            "the short Scripture quotations from copyrighted translations inside this "
            "otherwise freely-distributable document do not block publishing."
        ),
        "note": (
            "The document itself says 'You may make copies and distribute freely. You may "
            "distribute the electronic document freely. You may not sell it,' and points "
            "other uses at Pastor Derek Gentle. That is a real grant of reuse, and under "
            "the owner's rule of 2026-10-17 a non-commercial grant is enough for this "
            "non-commercial project: PUBLISHABLE, never sold, always credited. The second "
            "question was the Scripture quotations, which are mostly Holman Christian "
            "Standard Bible with others from NKJV, NASB, NIV and The Message, each 'used by "
            "permission' for this document alone; the KJV ones are public domain. The owner "
            "has ruled those short quotations acceptable, so they are no longer a bar. The "
            "underlying fact is recorded rather than erased: if a stricter reading is ever "
            "wanted, the 60 questions and answers are the unambiguously reusable part and "
            "the quoted verses can be swapped for a public-domain translation."
        ),
    },
    "creeds-json-reformed-catechisms": {
        "licence": "Unlicense (public-domain dedication) on the repository; the catechism texts are public domain by age",
        "licence_class": "open",
        "publishable": True,
        "attribution_required": False,
        "question_origin": "human-written",
        "publishable_reason": (
            "The Unlicense is a public-domain dedication, and the underlying catechisms "
            "are public domain by age. Publishable; no obligation attached."
        ),
        "note": (
            "The repository excludes eight texts from its Unlicense because they are still "
            "in copyright. None of the seven catechisms taken here is on that list, so all "
            "seven are covered by the Unlicense, and the underlying documents (1563 to 1855) "
            "are public domain on their own account. Crediting the repository is courteous, "
            "not required."
        ),
    },
    "westminster-proof-texts": {
        "licence": "No licence on the repository; the 1647 and 1648 texts are public domain by age",
        "licence_class": "no-licence-stated",
        "publishable": True,
        "attribution_required": True,
        "question_origin": "human-written",
        "publishable_reason": (
            "no licence stated; owner rule 2026-10-17: unlicensed public content treated "
            "as publishable for non-commercial use"
        ),
        "note": (
            "The catechism text and the Assembly's proof-text citations are public domain. "
            "What has no licence is this repository's own work: the parsing, the clause "
            "splitting and the corrections. Under the owner's rule of 2026-10-17 that "
            "unlicensed layer is treated as reproducible for this non-commercial project, "
            "so the structured JSON is publishable with the repository credited. The "
            "alternative remains available if a stricter copy is ever wanted: the same two "
            "catechisms are in the Unlicense source, at the cost of the Shorter Catechism "
            "carrying no proof texts at all there."
        ),
    },
    "gutenberg-baltimore-catechism": {
        "licence": "Public domain in the United States (published 1885); supplied by Project Gutenberg",
        "licence_class": "public-domain",
        "publishable": True,
        "attribution_required": False,
        "question_origin": "human-written",
        "publishable_reason": (
            "Published 1885, so public domain in the United States. Publishable; no "
            "obligation attached."
        ),
        "note": (
            "The 1885 text is out of copyright. Project Gutenberg asks that its trademark "
            "not be used when its boilerplate is stripped, which is exactly what this "
            "extraction does, so credit the catechism rather than Project Gutenberg. "
            "Non-US readers should check their own term of copyright, as the ebook header "
            "itself warns."
        ),
    },
    "ministry-to-children-kids-bible-trivia": {
        "licence": "CC BY-SA 4.0, granted by the site's own Terms of Service",
        "licence_class": "copyleft-attribution",
        "publishable": True,
        "attribution_required": True,
        "question_origin": "human-written",
        "publishable_reason": (
            "CC BY-SA 4.0, granted by the site's own Terms of Service. Publishable with "
            "credit to Ministry-To-Children.com and share-alike on anything built from it."
        ),
        "note": (
            "An earlier brief assumed this source was copyrighted and research-only; "
            "checking found the opposite, and it is now marked publishable. The site's "
            "terms say content 'is available under the Creative Commons "
            "Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) license', the page "
            "footer repeats 'Free to share and adapt with credit (CC BY-SA 4.0)', there is "
            "no login or paywall, and there is no robots.txt to honour. The price of that "
            "licence is real and travels with every record: credit Ministry-To-Children.com "
            "(Tony Kummer), and license whatever these are mixed into under the same or a "
            "compatible share-alike licence."
        ),
    },
    "liaaron1-bible-trivia-alpaca": {
        "licence": "Stated Apache-2.0 on the dataset card, but contradicted by the content's origin",
        "licence_class": "no-licence-stated",
        "publishable": True,
        "attribution_required": True,
        "publishable_reason": (
            "the stated Apache-2.0 is unreliable and is not relied on, leaving no "
            "dependable licence; owner rule 2026-10-17: unlicensed public content treated "
            "as publishable for non-commercial use"
        ),
        "question_origin": "human-written",
        "note": (
            "244 of this dataset's records reproduce questions from "
            "ministry-to-children.com verbatim, 83% of that page's 293 distinct questions, "
            "so the set is substantially a copy of that page relabelled Apache-2.0. An "
            "uploader cannot relicense someone else's work, so the stated licence is not "
            "relied on here. Those 244 records are keyed to the donor instead and carry "
            "its CC BY-SA 4.0, with credit and share-alike; they are marked "
            "licence_class copyleft-attribution individually. The remaining records have "
            "no dependable licence and no recorded upstream, and are publishable under the "
            "owner's rule of 2026-10-17 for unlicensed public content, with the Hugging "
            "Face dataset credited. The provenance gap is real and is recorded, not closed."
        ),
    },
    "ayandangubane-bible-quiz": {
        "licence": "None stated: no LICENSE file and no licence field on GitHub",
        "licence_class": "no-licence-stated",
        "publishable": True,
        "attribution_required": True,
        "question_origin": "template-generated",
        "publishable_reason": (
            "no licence stated; owner rule 2026-10-17: unlicensed public content treated "
            "as publishable for non-commercial use"
        ),
        "note": (
            "No licence is stated, so this is publishable under the owner's rule of "
            "2026-10-17 for unlicensed public content, with AyandaNgubane/Bible-Quiz "
            "credited on every record. The README calls these "
            "'1,005 original multiple-choice questions, hand-organized', and the repo's own "
            "gen/ directory shows what that means: 29 Python scripts expand hand-written "
            "fact tables into questions from sentence templates, with distractors drawn at "
            "random from a pool under a fixed seed. The facts and the templates are human "
            "work; the individual questions were not written one at a time."
        ),
    },
    "uberspot-opentriviaqa": {
        "licence": "CC BY-SA 4.0, stated in README.md and in the LICENSE file, and detected as CC-BY-SA-4.0 by GitHub",
        "licence_class": "copyleft-attribution",
        "publishable": True,
        "attribution_required": True,
        "question_origin": "human-written",
        "publishable_reason": (
            "CC BY-SA 4.0 stated in the README and the LICENSE file. Publishable with "
            "credit to uberspot/OpenTriviaQA and share-alike on anything built from it."
        ),
        "note": (
            "Clean licence on the compilation. The honest caveat is upstream: the README "
            "says the questions 'were gathered' years ago from sources it does not name, so "
            "the maintainer's CC BY-SA 4.0 covers this collection without proving the "
            "original questions were his to license. Fine for a quiz; worth knowing before "
            "building anything load-bearing on it."
        ),
    },
    "el-cms-open-trivia-database": {
        "licence": "No licence. The README says only: 'Facts are fact, we can't license that. If you use this work, please cite this repository and add a link to it in your work.'",
        "licence_class": "no-licence-stated",
        "publishable": True,
        "attribution_required": True,
        "question_origin": "human-written",
        "publishable_reason": (
            "no licence stated; owner rule 2026-10-17: unlicensed public content treated "
            "as publishable for non-commercial use"
        ),
        "note": (
            "A request to cite is not a licence grant, and the README's premise is wrong: "
            "facts are not copyrightable but the wording of a question is. So there is no "
            "licence here, and under the owner's rule of 2026-10-17 unlicensed public "
            "content is publishable for this non-commercial project. The repository's own "
            "request - cite it and link to it - is exactly what the per-record credit "
            "does. Some records carry a 'source' URL, kept in the reference field."
        ),
    },
    "brianchanda-bible-quiz": {
        "licence": "MIT, with a LICENSE file in the repository (Copyright (c) 2025 Eric Sakala)",
        "licence_class": "open",
        "publishable": True,
        "attribution_required": True,
        "publishable_reason": (
            "MIT licensed. Publishable, on condition the copyright and permission notice travels with it: Copyright (c) 2025 Eric Sakala."
        ),
        "question_origin": "human-written",
        "note": (
            "Found by searching GitHub rather than named in the brief. A real MIT licence "
            "file naming its copyright holder, so reuse is granted on condition the notice "
            "travels with it. MIT is a software licence being used over data, which is "
            "slightly unusual but unambiguous about what it permits."
        ),
    },
    "danielkorsah-bible-trivia-game": {
        "licence": "MIT, with a LICENSE file in the repository (Copyright (c) 2026 Daniel Korsah)",
        "licence_class": "open",
        "publishable": True,
        "attribution_required": True,
        "publishable_reason": (
            "MIT licensed. Publishable, on condition the copyright and permission notice travels with it: Copyright (c) 2026 Daniel Korsah."
        ),
        "question_origin": "human-written",
        "note": (
            "Found by searching GitHub rather than named in the brief. MIT licensed, with "
            "difficulty labels from easy through very_hard. The questions are noticeably "
            "harder and more specific than the other trivia sets."
        ),
    },
    "opentdb-api": {
        "licence": "CC BY-SA 4.0, stated by opentdb.com for the Open Trivia Database",
        "licence_class": "copyleft-attribution",
        "publishable": True,
        "attribution_required": True,
        "publishable_reason": (
            "CC BY-SA 4.0 stated by opentdb.com. Publishable with credit to the Open Trivia Database and share-alike on anything built from it."
        ),
        "question_origin": "human-written",
        "note": (
            "Community-submitted and moderator-verified questions, pulled through the public "
            "API. Yield was tiny: the database has no religion category, so Mythology and "
            "General Knowledge were taken in full and only 3 questions survived as actually "
            "being about the Bible."
        ),
    },
}


_NON_ALNUM = re.compile(r"[^0-9a-z]+")


def question_key(text):
    """A comparison key for one question: Unicode-folded, alphanumerics only.

    Unicode-aware on purpose. The two sources that have to be compared write the same
    sentences with different apostrophes - U+2019 on the website, ASCII in the Hugging
    Face copy - and an ASCII-only punctuation strip misses 54 of the 56 pairs that
    differ by punctuation alone.
    """
    folded = unicodedata.normalize("NFKD", text or "").casefold()
    return _NON_ALNUM.sub("", folded)


def donor_question_keys():
    """Comparison keys for every question on the CC BY-SA 4.0 donor site."""
    path = EXTRACTED / f"{OVERLAP_DONOR}.json"
    if not path.is_file():
        raise RuntimeError(
            f"cannot key the borrowed questions: {path} is missing. Without it the 244 "
            f"records {OVERLAP_BORROWER} copied from {OVERLAP_DONOR} would silently lose "
            f"their CC BY-SA 4.0 credit and share-alike obligation."
        )
    document = json.loads(path.read_text(encoding="utf-8"))
    return {
        question_key(question.get("question"))
        for bank in document["banks"]
        for question in bank["questions"]
        if question_key(question.get("question"))
    }


def borrowed_verdict(donor_keys, record):
    """The donor's terms, for a borrower record that reproduces a donor question."""
    if question_key(record["question"]) not in donor_keys:
        return None
    donor = LICENCE[OVERLAP_DONOR]
    return {
        "licence": donor["licence"],
        "licence_class": donor["licence_class"],
        "publishable_reason": (
            "reproduced verbatim from ministry-to-children.com, so governed by that "
            "site's CC BY-SA 4.0 rather than by the uploader's stated licence: "
            "publishable with credit and share-alike"
        ),
        "attribution": BATCH_2[OVERLAP_DONOR]["attribution_note"],
        "attribution_source_id": OVERLAP_DONOR,
        "source_url": BATCH_2[OVERLAP_DONOR]["source_url"],
    }


def normalise_source(path, donor_keys):
    """Flatten one extracted source into common-shape records."""
    document = json.loads(path.read_text(encoding="utf-8"))
    source_id = document["source_id"]
    if source_id not in LICENCE:
        raise RuntimeError(f"no licence verdict recorded for source {source_id!r}")
    verdict = LICENCE[source_id]
    meta = BATCH_2[source_id]

    records = []
    for bank in document["banks"]:
        for question in bank["questions"]:
            number = question.get("number")
            records.append(
                {
                    "id": f"{source_id}:{bank['bank_id']}:{number}",
                    "source_id": source_id,
                    "bank_id": bank["bank_id"],
                    "number": number,
                    "question": question.get("question"),
                    "answer": question.get("answer"),
                    "options": question.get("options"),
                    "reference": question.get("reference"),
                    "licence": verdict["licence"],
                    "licence_class": verdict["licence_class"],
                    "publishable": verdict["publishable"],
                    "publishable_reason": verdict["publishable_reason"],
                    "attribution": meta["attribution_note"],
                    "attribution_source_id": source_id,
                    "source_url": meta["source_url"],
                    "attribution_required": verdict["attribution_required"],
                    "question_origin": verdict["question_origin"],
                }
            )

    blank = [r["id"] for r in records if not r["question"] or not r["answer"]]
    if blank:
        print(f"  WARNING: {len(blank)} records missing a question or answer: {blank[:3]}", flush=True)
    return source_id, records


def write_json(path, document):
    """Write one JSON file, via a temp file so a crash cannot leave a half-written one."""
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(
        json.dumps(document, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    os.replace(temp, path)


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    NORMALIZED.mkdir(parents=True, exist_ok=True)
    generated = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    donor_keys = donor_question_keys()
    borrowed = 0

    everything = []
    # Driven by the licence table, not by a glob of extracted/: batch 3 lives in the same
    # folder, has its own normaliser and its own record shape, and must not be read here.
    for source_id in sorted(LICENCE):
        path = EXTRACTED / f"{source_id}.json"
        if not path.is_file():
            raise RuntimeError(f"no extraction for source {source_id!r} at {path}")
        source_id, records = normalise_source(path, donor_keys)
        if source_id == OVERLAP_BORROWER:
            for record in records:
                donor_verdict = borrowed_verdict(donor_keys, record)
                if donor_verdict:
                    record.update(donor_verdict)
                    borrowed += 1
        write_json(
            NORMALIZED / f"{source_id}.json",
            {
                "source_id": source_id,
                "generated": generated,
                "schema": "see normalized/SCHEMA.md",
                "question_count": len(records),
                "publishing_rule": PUBLISHING_RULE,
                "licence_note": LICENCE[source_id]["note"],
                "questions": records,
            },
        )
        everything.extend(records)
        flag = "publishable" if LICENCE[source_id]["publishable"] else "RESEARCH ONLY"
        print(f"  {source_id}: {len(records):>5} questions  [{flag}]", flush=True)

    if borrowed != EXPECTED_OVERLAP:
        raise RuntimeError(
            f"expected {EXPECTED_OVERLAP} {OVERLAP_BORROWER} records to reproduce "
            f"{OVERLAP_DONOR} questions, found {borrowed}. Either an extraction changed "
            f"or the comparison did; check before trusting the CC BY-SA 4.0 keying."
        )
    print(f"\n  {borrowed} borrowed records keyed to {OVERLAP_DONOR} (CC BY-SA 4.0)")

    publishable = [r for r in everything if r["publishable"]]
    needs_credit = [r for r in everything if r["attribution_required"]]
    share_alike = [r for r in everything if r["licence_class"] == "copyleft-attribution"]
    write_json(
        NORMALIZED / "all-questions.json",
        {
            "generated": generated,
            "schema": "see normalized/SCHEMA.md",
            "question_count": len(everything),
            "publishable_count": len(publishable),
            "research_only_count": len(everything) - len(publishable),
            "attribution_required_count": len(needs_credit),
            "share_alike_count": len(share_alike),
            "sources": sorted({r["source_id"] for r in everything}),
            "publishing_rule": PUBLISHING_RULE,
            "warning": (
                "Every record here is publishable under the owner's rule of 2026-10-17, "
                "and nothing is held back on licence grounds - so filtering on "
                f"publishable=true is now a no-op, not a safeguard. The licences are still "
                f"mixed and the obligation has moved from EXCLUDING to CREDITING: "
                f"{len(needs_credit)} of {len(everything)} records require attribution, "
                f"and {len(share_alike)} carry CC BY-SA share-alike, which anything built "
                "from them inherits. Each record names its own obligation in "
                "attribution_required, attribution, source_url and licence_class. Note "
                "also that publishable describes the LICENCE, not the quality of the text."
            ),
            "questions": everything,
        },
    )
    print(
        f"\n  all-questions.json: {len(everything)} questions, "
        f"{len(publishable)} publishable, {len(everything) - len(publishable)} research-only, "
        f"{len(needs_credit)} needing credit, {len(share_alike)} share-alike",
        flush=True,
    )


if __name__ == "__main__":
    sys.exit(main())
