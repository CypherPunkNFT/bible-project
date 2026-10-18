"""The last check of the hymns pipeline (plan section 8, "What is shown"): run 1's checked echoes plus run 2's verdicts
become the echoes a page may show. No model.

An echo is kept only if run 1 gave it with high confidence, guard 2 passed (for a proposal), and run 2 said yes, clear.
The verifier is scored on the pairs it could not know were planted: decoys (known wrong) and controls (Amazing
Grace's hand-chosen echoes). It is trusted only if it says no to at least 95% of the decoys.

Also lists, for the owner: printed heading verses run 1 judged not to fit, and headings that name a verse that does
not exist; and writes a spot-check sheet of 20 random hymns (fixed seed) with every echo kept and turned down.

Reads Research/Hymns/pipeline/{hymns.json, run1-checked.json, verify-items.json} and run 2's answers.
Writes Research/Hymns/pipeline/checked.json and spot-check.md (or elsewhere for a pilot).

    python scripts/hymns/check-answers.py --verify-answers ../Research/Hymns/llm-answers/run2
"""

from __future__ import annotations

import argparse
import importlib.util
import random
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from hymns_common import (
    CHECKED_FILE,
    HYMNS_FILE,
    PIPELINE,
    read_json,
    ref_label,
    write_json,
)

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
DECOY_NO_NEEDED = 0.95
SPOT_CHECK = 20


def answer_of(path: Path) -> dict | None:
    spec = importlib.util.spec_from_file_location("check_proposals", HERE / "check-proposals.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module.answer_of(path)


def key(e: dict) -> tuple:
    return (e["stanza"], e["line"], e["code"], e["chapter"], e["first"])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--checked", type=Path, default=PIPELINE / "run1-checked.json")
    parser.add_argument("--verify-index", type=Path, default=PIPELINE / "verify-items.json")
    parser.add_argument("--verify-answers", type=Path, required=True)
    parser.add_argument("--heading-answers", type=Path, help="the second check of the headings run 1 turned down (make-heading-items.py)")
    parser.add_argument("--write", type=Path, default=CHECKED_FILE)
    parser.add_argument("--sheet", type=Path, default=PIPELINE / "spot-check.md")
    args = parser.parse_args()
    hymns = {h["id"]: h for h in read_json(HYMNS_FILE)["hymns"]}
    run1 = {h["id"]: h for h in read_json(args.checked)["hymns"]}
    index = read_json(args.verify_index)

    verdicts: dict[str, dict[tuple, dict]] = {}
    score, missing = Counter(), []
    for item, entry in index.items():
        path = args.verify_answers / f"{item}.json"
        answer = answer_of(path) if path.exists() else None
        if answer is None:
            missing.append(item)
            continue
        by_pair = {str(p["pair"]): p for p in answer.get("pairs") or []}
        for n, pair in entry["pairs"].items():
            verdict = by_pair.get(n)
            if verdict is None:
                score["unanswered"] += 1
                continue
            yes_clear = verdict["echo"] == "yes" and verdict["strength"] == "clear"
            score[f"{pair['kind']} {'yes, clear' if yes_clear else verdict['echo'] + ', ' + verdict['strength']}"] += 1
            if pair["kind"] == "decoy":
                score["decoys"] += 1
                score["decoys said yes"] += verdict["echo"] == "yes"
            elif pair["kind"] == "control":
                score["controls"] += 1
                score["controls said yes, clear"] += yes_clear
            verdicts.setdefault(entry["id"], {})[key(pair)] = verdict

    # A printed heading is dropped only when both runs say it does not fit; the second check's verdicts by hymn id.
    second: dict[str, dict] = {}
    if args.heading_answers:
        for item, hymn_id in read_json(PIPELINE / "heading-items.json").items():
            path = args.heading_answers / f"{item}.json"
            verdict = answer_of(path) if path.exists() else None
            if verdict:
                second[hymn_id] = verdict
    results, heading_rejected = [], []
    for hymn_id, checked in run1.items():
        hymn = hymns[hymn_id]
        mine = verdicts.get(hymn_id, {})
        kept, turned_down = [], list(checked["record"])
        for e in checked["echoes"]:
            v = mine.get(key(e))
            if v and v["echo"] == "yes" and v["strength"] == "clear":
                kept.append({**e, "verified": v["strength"]})
            else:
                turned_down.append({**e, "verified": f"{v['echo']}, {v['strength']}" if v else "not verified"})
        heading = hymn.get("heading")
        verdict = dict(checked["heading"])
        if heading and heading["ranges"] and verdict["fits"] == "no":
            again = second.get(hymn_id)
            if again and again["fits"] == "yes":
                verdict = {"fits": "yes", "line": 0, "note": f"run 1 said no; the second check said yes, {again['strength']}"}
            else:
                why = f"both checks: does not fit the hymn (second check {again['strength']})" if again else "run 1: does not fit the hymn (no second check)"
                heading_rejected.append({"id": hymn_id, "firstLine": hymn["firstLine"], "printed": heading["printed"], "why": why})
        results.append({"id": hymn_id, "echoes": kept, "turnedDown": turned_down, "heading": verdict,
                        "mainPassage": checked["mainPassage"]})
    for hymn in hymns.values():
        heading = hymn.get("heading")
        if heading and heading["problems"]:
            heading_rejected.append({"id": hymn["id"], "firstLine": hymn["firstLine"], "printed": heading["printed"], "why": "; ".join(heading["problems"])})

    decoy_no = 1 - score["decoys said yes"] / score["decoys"] if score["decoys"] else None
    trusted = decoy_no is not None and decoy_no >= DECOY_NO_NEEDED
    write_json(args.write, {"schema": "bibleproject.hymn-checked/v1", "verifierTrusted": trusted, "score": dict(score),
                            "headingRejected": heading_rejected, "hymns": results})
    write_sheet(args.sheet, hymns, results)
    print(f"{len(results)} hymns; {sum(len(r['echoes']) for r in results)} echoes kept, "
          f"{sum(len(r['turnedDown']) for r in results)} turned down; {len(missing)} run-2 answers missing")
    print(f"verifier: said no to {decoy_no:.0%} of {score['decoys']} decoys" if decoy_no is not None else "verifier: no decoys scored",
          f"(needs {DECOY_NO_NEEDED:.0%}: {'TRUSTED' if trusted else 'NOT TRUSTED'}); "
          f"yes, clear to {score['controls said yes, clear']} of {score['controls']} extra controls")
    for k, n in sorted(score.items()):
        print(f"  {k}: {n}")
    print(f"headings listed for the owner: {len(heading_rejected)}")


def label(e: dict) -> str:
    return ref_label(e["code"], e["chapter"], e["first"], e["last"]) if e.get("code") else e.get("named", "?")


def write_sheet(path: Path, hymns: dict, results: list[dict]) -> None:
    """20 random hymns, every line with what was kept and what was turned down, for checking by eye."""
    pool = [r for r in results if r["echoes"] or r["turnedDown"]]
    picks = random.Random(20261017).sample(pool, min(SPOT_CHECK, len(pool)))
    out = ["# Hymn echoes: spot check of 20 random hymns", "", "Kept = shown on the page. Turned down = not shown, with why.", ""]
    for r in picks:
        hymn = hymns[r["id"]]
        out += [f"## {hymn['firstLine']} ({hymn['author']}, {hymn['partLabel']}, no. {hymn['number']})", ""]
        for s, stanza in enumerate(hymn["stanzas"]):
            for l, text in enumerate(stanza):
                kept = [f"**{label(e)}** ({e['source']})" for e in r["echoes"] if e["stanza"] == s and e["line"] == l]
                down = [f"{label(e)} ({e.get('source', '?')}: {e.get('verified') or e.get('status') or e.get('rejected') or e.get('confidence')})"
                        for e in r["turnedDown"] if e.get("stanza") == s and e.get("line") == l]
                note = (" · kept " + ", ".join(kept) if kept else "") + (" · turned down " + ", ".join(down) if down else "")
                out.append(f"- {text}{note}")
            out.append("")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(out))


if __name__ == "__main__":
    main()
