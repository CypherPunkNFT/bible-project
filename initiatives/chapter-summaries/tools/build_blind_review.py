"""Build blind review packets: each chapter's source text plus every available draft, labelled A/B/C in a
seeded random order. The label key is written separately; reviewers must not open it. No model calls.

  python initiatives/chapter-summaries/tools/build_blind_review.py --run-id dev-1 [--include-round3]

Draft sets per chapter (whichever exist):
  claude      claude-pilot/<run>/<CH>/draft.json            Claude writer, Claude-chosen sections
  qwen-same   claude-pilot/<run>/<CH>/qwen-writer/draft.json Qwen writer on the SAME packet (writer-only comparison)
  qwen-r3     evidence-first-trials/round-3/<CH>/draft.json  preserved Qwen baseline (round 2 for GEN-5 if r3 blocked)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
from pathlib import Path

SITE = Path(__file__).resolve().parents[3]
STUDIO = SITE / ".local" / "chapter-summary-studio"
SEED = 20261013


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def render(draft: dict) -> str:
    refs = "; ".join(f"ch {r['chapter']}:{r['verse_start']}-{r['verse_end']}" for r in draft["context_references"])
    lines = [f"Title: {draft['title']}",
             f"Context: {draft['context'] or '(none)'}" + (f"  [cites {refs}]" if refs else ""),
             f"Summary: {draft['summary']}", "Outline:"]
    lines += [f"  {o['verse_start']}-{o['verse_end']} {o['heading']}: {o['text']}" for o in draft["outline"]]
    lines.append(f"Invitation: {draft['invitation']}")
    return "\n".join(lines)


def drafts_for(run: Path, chapter: str, include_round3: bool) -> dict:
    found = {"claude": run / chapter / "draft.json", "qwen-same": run / chapter / "qwen-writer" / "draft.json"}
    if include_round3:
        for round_name in ("round-3", "round-2"):
            path = STUDIO / "evidence-first-trials" / round_name / chapter / "draft.json"
            if path.exists():
                found[f"qwen-{round_name}"] = path
                break
    return {name: path for name, path in found.items() if path.exists()}


def build(run_id: str, include_round3: bool) -> None:
    run = STUDIO / "claude-pilot" / run_id
    out = run / "blind-review"
    out.mkdir(exist_ok=False)
    key = {"seed": SEED, "chapters": {}}
    for index, chapter_dir in enumerate(sorted(p for p in run.iterdir() if (p / "sources.json").exists())):
        sources = load(chapter_dir / "sources.json")
        target = str(sources["target_chapter"])
        available = drafts_for(run, chapter_dir.name, include_round3)
        if not available:  # blocked chapter: no draft to review
            continue
        names = list(available)
        random.Random(SEED + index).shuffle(names)
        labels = {chr(65 + i): name for i, name in enumerate(names)}
        parts = [f"CHAPTER {chapter_dir.name} — BSB TARGET TEXT (the factual authority):\n" + sources["passages"][target]["text"]]
        for n, passage in sources["passages"].items():
            if n != target:
                parts.append(f"SUPPLIED CONTEXT, chapter {n} (a context note may cite only these verses):\n" + passage["text"])
        for label, name in labels.items():
            parts.append(f"DRAFT {label}\n" + render(load(available[name])))
        (out / f"{chapter_dir.name}.txt").write_text("\n\n".join(parts) + "\n", encoding="utf-8")
        key["chapters"][chapter_dir.name] = {label: {"set": name, "path": str(available[name].relative_to(SITE)),
            "sha256": hashlib.sha256(available[name].read_bytes()).hexdigest()} for label, name in labels.items()}
    (out / "KEY-do-not-open-during-review.json").write_text(json.dumps(key, indent=2), encoding="utf-8")
    print(f"Wrote {len(key['chapters'])} packets to {out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--include-round3", action="store_true")
    args = parser.parse_args()
    build(args.run_id, args.include_round3)
