"""Step 3 of the hymns pipeline: one plain-text item per hymn for the first model run (BatchRunner), plus the run's fixed
task and answer schema.

Each item holds everything the call needs, because a bare call cannot open files: the hymn's numbered lines; under
each line the script's candidate verses (section 3 of the plan) in full KJV text; the printed heading verse's text;
the 10 strongest verses for a hymn printed without a heading; the WHOLE psalm for a Watts psalm paraphrase.

Reads Research/Hymns/pipeline/hymns.json and candidates.json. Writes Research/Hymns/llm-items/<n>.txt (one per hymn,
numbered so file names stay short), llm-items.json (number → hymn id, and every code each item offers), and copies
the task and schema to Research/Hymns/llm-task.md and llm-schema.json.

    python scripts/hymns/make-items.py
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from hymns_common import (
    CANDIDATES_FILE,
    CORPUS,
    HYMNS_FILE,
    ITEMS,
    PIPELINE,
    chapter_verses,
    read_json,
    ref_label,
    verse_text,
    write_json,
)

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
LETTERS = "abc"


def heading_text(hymn: dict) -> list[str]:
    """The printed heading, with the KJV text of each verse it names (a whole psalm is named, not written out here)."""
    h = hymn.get("heading")
    if not h or not h["ranges"]:
        return ["HEADING VERSE: none printed"]
    out = [f"HEADING VERSE (printed above the hymn by its author): {h['label']}"]
    for r in h["ranges"]:
        if r["first"] is None:
            out.append(f"  (the whole of {ref_label(r['code'], r['chapter'])})")
            continue
        for n in range(r["first"], (r["last"] or r["first"]) + 1):
            text = verse_text("kjv", r["code"], r["chapter"], n)
            if text:
                out.append(f"  {ref_label(r['code'], r['chapter'], n)}: {text}")
    return out


def psalm_of(hymn: dict) -> int | None:
    if hymn["group"] != "psalms":
        return None
    for r in (hymn.get("heading") or {}).get("ranges") or []:
        if r["code"] == "PSA":
            return r["chapter"]
    return None


def item_for(hymn: dict, matched: dict) -> tuple[str, dict]:
    """The item text, and the codes it offers (for the answer check)."""
    lines = [f"HYMN: {hymn['firstLine']}", f"BY: {hymn['author']}, {hymn['collection']} ({hymn['year']}), {hymn['partLabel']}, no. {hymn['number']}"]
    if hymn["subject"] and hymn["subject"] != hymn["firstLine"]:
        lines.append(f"SUBJECT PRINTED WITH IT: {hymn['subject']}")
    lines += heading_text(hymn)
    offered: dict = {"lines": {}, "psalm": None, "strongest": {}}

    psalm = psalm_of(hymn)
    if psalm:
        verses = chapter_verses("kjv", "PSA", psalm)
        offered["psalm"] = {"chapter": psalm, "verses": verses}
        lines += ["", f"THE WHOLE PSALM THIS HYMN PARAPHRASES: Psalm {psalm} (KJV). Codes P1, P2, ... are its verses."]
        lines += [f"  P{n}: {verse_text('kjv', 'PSA', psalm, n)}" for n in verses]

    if not (hymn.get("heading") or {}).get("ranges"):
        lines += ["", "STRONGEST VERSES (the verses this hymn's lines share most wording with overall). Codes S1-S10."]
        for k, v in enumerate(matched["strongest"], 1):
            offered["strongest"][f"S{k}"] = {"code": v["code"], "chapter": v["chapter"], "verse": v["verse"]}
            lines.append(f"  S{k}: {v['ref']}: {verse_text('kjv', v['code'], v['chapter'], v['verse'])}")

    lines += ["", "LINES (numbered through the whole hymn; stanzas are separated by a blank line):"]
    number, stanza_of = 0, None
    for entry in matched["lines"]:
        if stanza_of is not None and entry["stanza"] != stanza_of:
            lines.append("")
        stanza_of = entry["stanza"]
        number += 1
        lines.append(f"L{number}: {entry['text']}")
        codes = {}
        for letter, c in zip(LETTERS, entry["candidates"]):
            codes[letter] = {"code": c["code"], "chapter": c["chapter"], "verse": c["verse"]}
            lines.append(f"    {letter}. {c['ref']}: {verse_text('kjv', c['code'], c['chapter'], c['verse'])}")
        offered["lines"][str(number)] = {"stanza": entry["stanza"], "line": entry["line"], "candidates": codes}
    return "\n".join(lines) + "\n", offered


def main() -> None:
    hymns = {h["id"]: h for h in read_json(HYMNS_FILE)["hymns"]}
    matched = read_json(CANDIDATES_FILE)["hymns"]
    if ITEMS.exists():
        shutil.rmtree(ITEMS)
    ITEMS.mkdir(parents=True)
    index, sizes = {}, []
    for n, m in enumerate(matched, 1):
        hymn = hymns[m["id"]]
        text, offered = item_for(hymn, m)
        name = f"h{n:04d}"
        with (ITEMS / f"{name}.txt").open("w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
        index[name] = {"id": hymn["id"], **offered}
        sizes.append(len(text.encode("utf-8")))
    write_json(PIPELINE / "llm-items.json", index)
    for name in ("llm-task.md", "llm-schema.json"):
        shutil.copyfile(HERE / name, CORPUS / name)
    sizes.sort()
    print(f"{len(index)} items in {ITEMS}; bytes: smallest {sizes[0]:,}, median {sizes[len(sizes) // 2]:,}, "
          f"largest {sizes[-1]:,}, total {sum(sizes):,} (about {sum(sizes) // 4:,} tokens at 4 bytes a token)")


if __name__ == "__main__":
    main()
