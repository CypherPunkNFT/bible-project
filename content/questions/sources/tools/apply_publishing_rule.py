#!/usr/bin/env python3
"""Apply the owner's publishing rule of 2026-10-17 to the batch-1 sources.

Batches 2 and 3 carry the rule themselves, from their own builders. Batch 1 was left as
raw downloads with no extraction, so no builder owns its three entries - both
build_manifest.py and build_manifest_batch3.py copy them through untouched. This script
is the one place their verdict is written, and it is the last step of the run:

    python tools/normalize.py
    python tools/normalize_batch3.py
    python tools/build_manifest.py
    python tools/build_manifest_batch3.py
    python tools/apply_publishing_rule.py

It is idempotent: running it twice leaves the same file. It only ever adds or replaces
the four verdict keys on three named sources, and it refuses to run if the manifest has
drifted from what it expects.

Run: python tools/apply_publishing_rule.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

CORPUS_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_JSON = CORPUS_ROOT / "manifest.json"

VERDICT_KEYS = ("publishable", "publishable_reason", "usability", "usability_note")

# Batch 1's three sources, under the owner's rule of 2026-10-17. The prose that was
# already true is kept; only the verdict changes, and only where the rule changes it.
BATCH_1_VERDICTS = {
    "helen-jiahe-zhao-bibleqa": {
        "publishable": True,
        "publishable_reason": (
            "no licence stated; owner rule 2026-10-17: unlicensed public content treated "
            "as publishable for non-commercial use"
        ),
        "usability": "usable",
        "usability_note": (
            "CHANGED BY THE RULE: this was the corpus's flagship research-only source, "
            "held back because it has no LICENSE file, no README and no licence field on "
            "GitHub. Under the owner's rule of 2026-10-17 unlicensed public content is "
            "publishable for this non-commercial project, so it is now usable, with "
            "helen-jiahe-zhao/BibleQA credited on every use. The best-matched source for "
            "the stated goal and the only batch-1 source holding real quiz questions: 886 "
            "of them, in data/bible_qa/1001.csv. One caveat is recorded rather than "
            "erased: that file is a numbered '1001 Bible questions' list whose numbering "
            "runs past 955 for 886 retained questions, so it appears to be transcribed "
            "from a third-party quiz compilation that is not named anywhere and whose own "
            "rights are unknown. The rule covers the uploader's unlicensed layer; it "
            "cannot speak for a compilation nobody has identified."
        ),
    },
    "serialhex-open-biblical-dataset": {
        "publishable": True,
        "publishable_reason": (
            "CC0 1.0 on the dataset's own curation, over public-domain passages. "
            "Publishable; no obligation attached."
        ),
        "usability": "usable",
        "usability_note": (
            "CC0 curation over public-domain passages, so there is no licence barrier to "
            "use and the owner's rule changes nothing here. The barrier is fitness: these "
            "are not quiz questions. One caveat the dataset card raises and this entry "
            "keeps: its generated text was produced by third-party model APIs, and the "
            "card tells the user to check those providers' usage policies before "
            "redistributing at scale."
        ),
    },
    "bradystephenson-bible-data": {
        "publishable": True,
        "publishable_reason": (
            "CC BY 4.0, with the full licence text in the repository. Publishable with "
            "credit to the repository."
        ),
        "usability": "usable",
        "usability_note": (
            "Publishable with attribution, and the owner's rule changes nothing here. "
            "Note the repo also ships Nave's Topical Dictionary and Hitchcock's Bible "
            "Names Dictionary, which this project already holds from its own sources - "
            "prefer the existing copies rather than introducing a second provenance."
        ),
    },
}


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    document = json.loads(MANIFEST_JSON.read_text(encoding="utf-8"))

    recorded = document.get("batches", {}).get("batch_1", {}).get("source_ids")
    if sorted(recorded or []) != sorted(BATCH_1_VERDICTS):
        raise RuntimeError(
            f"manifest batch_1 is {recorded}, expected {sorted(BATCH_1_VERDICTS)}. "
            "Run build_manifest.py and build_manifest_batch3.py first, and check that "
            "neither has relabelled a later batch's source as batch 1."
        )
    if not document.get("publishing_rule"):
        raise RuntimeError(
            "manifest.json carries no publishing_rule block; build_manifest.py should "
            "have written one. Run it before this script."
        )

    changed = []
    for source_id, verdict in BATCH_1_VERDICTS.items():
        entry = document["sources"][source_id]
        if any(entry.get(key) != verdict[key] for key in VERDICT_KEYS):
            changed.append(source_id)
        entry.update(verdict)

    temp = MANIFEST_JSON.with_suffix(".json.tmp")
    temp.write_text(
        json.dumps(document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    os.replace(temp, MANIFEST_JSON)

    for source_id in BATCH_1_VERDICTS:
        mark = "updated" if source_id in changed else "already current"
        print(f"  {source_id:<34} publishable=True  [{mark}]", flush=True)
    print(f"\n  batch 1: {len(changed)} of {len(BATCH_1_VERDICTS)} entries changed", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
