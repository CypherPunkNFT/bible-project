"""A second, blind check of the printed heading verses run 1 judged not to fit (plan section 8: nothing changes on one
model's word). One item per such hymn: the hymn's opening stanzas and the printed verse's KJV text, asking only whether the
hymn is plainly written on it. check-answers.py drops a heading only when both runs say no.

Reads Research/Hymns/pipeline/{hymns.json, run1-checked.json}. Writes Research/Hymns/heading-items/<item>.txt and
pipeline/heading-items.json, and copies heading-task.md and heading-schema.json beside them.

    python scripts/hymns/make-heading-items.py
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from hymns_common import CORPUS, HYMNS_FILE, PIPELINE, read_json, ref_label, verse_text, write_json  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
OUT = CORPUS / "heading-items"


def main() -> None:
    hymns = {h["id"]: h for h in read_json(HYMNS_FILE)["hymns"]}
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    index = {}
    for checked in read_json(PIPELINE / "run1-checked.json")["hymns"]:
        hymn = hymns[checked["id"]]
        heading = hymn.get("heading")
        if checked["heading"]["fits"] != "no" or not heading or not heading["ranges"] or hymn.get("duplicateOf"):
            continue
        text = [f"HYMN: {hymn['firstLine']}, by {hymn['author']} ({hymn['year']})", "", "ITS FIRST STANZAS:"]
        for stanza in hymn["stanzas"][:3]:
            text += [f"  {line}" for line in stanza] + [""]
        text.append(f"THE VERSE PRINTED ABOVE IT: {heading['label']} (King James Version)")
        for r in heading["ranges"]:
            if r["first"] is None:
                text.append(f"  (the whole of {ref_label(r['code'], r['chapter'])}; its first verses:)")
                verses = range(1, 6)
            else:
                verses = range(r["first"], (r["last"] or r["first"]) + 1)
            for n in verses:
                v = verse_text("kjv", r["code"], r["chapter"], n)
                if v:
                    text.append(f"  {ref_label(r['code'], r['chapter'], n)}: {v}")
        with (OUT / f"{checked['item']}.txt").open("w", encoding="utf-8", newline="\n") as handle:
            handle.write("\n".join(text) + "\n")
        index[checked["item"]] = hymn["id"]
    write_json(PIPELINE / "heading-items.json", index)
    for name in ("heading-task.md", "heading-schema.json"):
        shutil.copyfile(HERE / name, CORPUS / name)
    print(f"{len(index)} heading items in {OUT}")


if __name__ == "__main__":
    main()
