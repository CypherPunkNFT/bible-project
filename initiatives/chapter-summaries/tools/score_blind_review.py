"""Unblind a finished review: join reviews/<CH>.json with the label key, total verdicts, issue counts and
criterion scores per draft set, and write blind-review/results.json. No model calls.

  python initiatives/chapter-summaries/tools/score_blind_review.py --run-id dev-1
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

SITE = Path(__file__).resolve().parents[3]
CRITERIA = ("fidelity", "qualifiers", "support", "citations", "movements", "genre", "readability", "invitation")


def score(run_id: str) -> None:
    folder = SITE / ".local" / "chapter-summary-studio" / "claude-pilot" / run_id / "blind-review"
    key = json.loads((folder / "KEY-do-not-open-during-review.json").read_text(encoding="utf-8"))["chapters"]
    rows, totals = [], defaultdict(lambda: {"drafts": 0, "no_material": 0, "material": 0, "minor": 0,
                                            "scores": defaultdict(int), "words": []})
    for chapter, labels in sorted(key.items()):
        if not labels:  # chapter without any draft (e.g. blocked); nothing was reviewed
            continue
        review = json.loads((folder / "reviews" / f"{chapter}.json").read_text(encoding="utf-8"))
        for label, meta in labels.items():
            verdict = review["drafts"][label]
            material = sum(i["severity"] == "material" for i in verdict["issues"])
            row = {"chapter": chapter, "label": label, "set": meta["set"], "verdict": verdict["verdict"],
                   "material": material, "minor": len(verdict["issues"]) - material,
                   "score": sum(verdict["scores"][c] for c in CRITERIA), "summary_words": verdict.get("summary_words"),
                   "material_issues": [f"{i['field']}: {i['quote']} — {i['explanation']}" for i in verdict["issues"]
                                       if i["severity"] == "material"]}
            rows.append(row)
            total = totals[meta["set"]]
            total["drafts"] += 1
            total["no_material"] += verdict["verdict"] == "no material issue found"
            total["material"] += material
            total["minor"] += row["minor"]
            total["words"].append(verdict.get("summary_words") or 0)
            for c in CRITERIA:
                total["scores"][c] += verdict["scores"][c]
    summary = {name: {"drafts": t["drafts"], "no_material_issue_found": t["no_material"],
                      "material_issues": t["material"], "minor_issues": t["minor"],
                      "mean_score_of_16": round(sum(t["scores"].values()) / t["drafts"], 2),
                      "mean_by_criterion": {c: round(t["scores"][c] / t["drafts"], 2) for c in CRITERIA},
                      "mean_summary_words": round(sum(t["words"]) / t["drafts"])} for name, t in totals.items()}
    (folder / "results.json").write_text(json.dumps({"by_set": summary, "rows": rows}, indent=2, ensure_ascii=False),
                                         encoding="utf-8")
    print("| Draft set | Drafts | No material issue found | Material issues | Minor issues | Mean score /16 | Mean summary words |")
    print("|---|---:|---:|---:|---:|---:|---:|")
    for name, s in sorted(summary.items()):
        print(f"| {name} | {s['drafts']} | {s['no_material_issue_found']} | {s['material_issues']} | {s['minor_issues']} "
              f"| {s['mean_score_of_16']} | {s['mean_summary_words']} |")
    print()
    for row in rows:
        print(f"{row['chapter']:8} {row['set']:13} {row['verdict']:24} material {row['material']} minor {row['minor']} "
              f"score {row['score']}/16 words {row['summary_words']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--run-id", required=True)
    score(parser.parse_args().run_id)
