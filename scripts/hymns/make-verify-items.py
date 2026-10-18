"""Run 2's items (plan section 8): every echo that passed guard 2, as a line and the real KJV verse text, judged blind.

One item per hymn with anything to verify. Each pair is the stanza, the line and the verse's text written in by this
script (never run 1's quotation). The call is not told where any pair came from. Mixed in, looking the same:
- decoys: 1–2 pairs per item that are known to be wrong (a verse sharing only one common word with the line), so the
  verifier's false-yes rate is measured;
- controls: Amazing Grace's 11 hand-chosen echoes, so its yes rate on known-good pairs is measured.
Pairs are shuffled with a fixed seed per hymn, so a rerun writes the same items.

Reads Research/Hymns/pipeline/{hymns.json, run1-checked.json} and design/hymn-directions/shared/data.js (the controls).
Writes Research/Hymns/verify-items/<item>.txt and pipeline/verify-items.json, and copies verify-task.md and
verify-schema.json beside them.

    python scripts/hymns/make-verify-items.py [--checked FILE] [--out DIR]
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import random
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from hymns_common import (
    CORPUS,
    HYMNS_FILE,
    PIPELINE,
    STOP,
    WEBSITE,
    read_json,
    ref_label,
    stems,
    verse_text,
    write_json,
)

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
AMAZING_GRACE = "ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound"
COMMON_DF = 400  # a decoy shares one word found in at least this many verses, and nothing rarer


def load_check_module():
    spec = importlib.util.spec_from_file_location("check_proposals", HERE / "check-proposals.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


def controls() -> list[dict]:
    """Amazing Grace's hand-chosen echoes from the approved mock-up's data."""
    text = (WEBSITE / "design/hymn-directions/shared/data.js").read_text(encoding="utf-8")
    data = json.loads(text[text.index("{"):text.rindex("}") + 1])
    return [{"stanza": e["stanza"], "line": e["line"], "code": e["code"], "chapter": e["chapter"],
             "first": e["verses"][0]["n"], "last": e["verses"][-1]["n"]} for e in data["echoes"]]


def passage_text(code: str, chapter: int, first: int, last: int) -> str:
    return " ".join(f"[{n}] {verse_text('kjv', code, chapter, n)}" if last != first else verse_text("kjv", code, chapter, n) or ""
                    for n in range(first, last + 1))


def decoys(kjv, hymn: dict, taken: set[tuple[int, int]], rng: random.Random, count: int) -> list[dict]:
    """Pairs known to be wrong: a line with no echo, and a verse sharing exactly one common word with it."""
    lines = [(s, l, t) for s, st in enumerate(hymn["stanzas"]) for l, t in enumerate(st) if (s, l) not in taken]
    rng.shuffle(lines)
    out = []
    for s, l, text in lines:
        words = {w for w in stems(text) if w not in STOP and len(kjv.by_word.get(w, ())) >= COMMON_DF}
        if not words:
            continue
        word = rng.choice(sorted(words))
        line_words = {w for w in stems(text) if w not in STOP}
        pool = sorted(k for k in kjv.by_word[word] if not (line_words - {word}) & set(kjv.stems[k]))
        if pool:
            code, chapter, verse = rng.choice(pool)
            out.append({"stanza": s, "line": l, "code": code, "chapter": chapter, "first": verse, "last": verse})
        if len(out) >= count:
            break
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--checked", type=Path, default=PIPELINE / "run1-checked.json")
    parser.add_argument("--out", type=Path, default=CORPUS / "verify-items")
    parser.add_argument("--index", type=Path, default=PIPELINE / "verify-items.json")
    args = parser.parse_args()
    hymns = {h["id"]: h for h in read_json(HYMNS_FILE)["hymns"]}
    kjv = load_check_module().Kjv()
    if args.out.exists():
        shutil.rmtree(args.out)
    args.out.mkdir(parents=True)
    index, counts = {}, {"echo": 0, "decoy": 0, "control": 0}
    for checked in read_json(args.checked)["hymns"]:
        hymn = hymns[checked["id"]]
        if hymn.get("duplicateOf"):
            continue  # a second spelling of a hymn already held: its page is the kept one's
        pairs = [{"kind": "echo", **{k: e[k] for k in ("stanza", "line", "code", "chapter", "first", "last", "source")}} for e in checked["echoes"]]
        if hymn["id"] == AMAZING_GRACE:
            have = {(p["stanza"], p["line"], p["code"], p["chapter"], p["first"]) for p in pairs}
            pairs += [{"kind": "control", **c} for c in controls() if (c["stanza"], c["line"], c["code"], c["chapter"], c["first"]) not in have]
        if not pairs:
            continue
        rng = random.Random(hymn["id"])
        taken = {(p["stanza"], p["line"]) for p in pairs}
        pairs += [{"kind": "decoy", **d} for d in decoys(kjv, hymn, taken, rng, 1 if len(pairs) < 6 else 2)]
        rng.shuffle(pairs)
        text = [f"HYMN: {hymn['firstLine']}, by {hymn['author']} ({hymn['year']})", ""]
        for n, p in enumerate(pairs, 1):
            text += [f"PAIR {n}", "STANZA:", *[f"  {t}" for t in hymn["stanzas"][p["stanza"]]],
                     f"LINE: {hymn['stanzas'][p['stanza']][p['line']]}",
                     f"VERSE: {ref_label(p['code'], p['chapter'], p['first'], p['last'])} (King James Version): "
                     f"{passage_text(p['code'], p['chapter'], p['first'], p['last'])}", ""]
            counts[p["kind"]] += 1
        with (args.out / f"{checked['item']}.txt").open("w", encoding="utf-8", newline="\n") as handle:
            handle.write("\n".join(text))
        index[checked["item"]] = {"id": hymn["id"], "pairs": {str(n): p for n, p in enumerate(pairs, 1)}}
    write_json(args.index, index)
    for name in ("verify-task.md", "verify-schema.json"):
        shutil.copyfile(HERE / name, CORPUS / name)
    print(f"{len(index)} items in {args.out}: {counts['echo']} echoes, {counts['decoy']} decoys, {counts['control']} controls")


if __name__ == "__main__":
    main()
