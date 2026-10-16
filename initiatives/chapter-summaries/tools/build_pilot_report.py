"""Write claude-pilot/REPORT.md: every pilot run's drafts (unlabelled in review, labelled here), review verdicts,
material issues and lengths, from the saved artifacts only. No model calls; rewrites only REPORT.md.

  python initiatives/chapter-summaries/tools/build_pilot_report.py dev-1 dev-2 fresh-1
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parents[3]
PILOT = SITE / ".local" / "chapter-summary-studio" / "claude-pilot"
SET_NAMES = {"claude": "Claude writer", "qwen-same": "Qwen writer, same packet",
             "qwen-round-3": "Qwen round 3 (preserved)", "qwen-round-2": "Qwen round 2 (preserved)"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def draft_block(draft: dict) -> list[str]:
    refs = ", ".join(f"{r['chapter']}:{r['verse_start']}-{r['verse_end']}" for r in draft["context_references"])
    lines = [f"**{draft['title']}**", ""]
    if draft["context"]:
        lines += [f"*Context ({refs}):* {draft['context']}", ""]
    lines += [draft["summary"], ""]
    lines += [f"- {o['verse_start']}–{o['verse_end']} **{o['heading']}** — {o['text']}" for o in draft["outline"]]
    lines += ["", f"*Invitation:* {draft['invitation']}", ""]
    return lines


def run_section(run_id: str) -> list[str]:
    folder = PILOT / run_id
    manifest = load(folder / "manifest.json")
    review_dir = folder / "blind-review"
    key = load(review_dir / "KEY-do-not-open-during-review.json")["chapters"] if review_dir.exists() else {}
    lines = [f"## Run `{run_id}`", "",
             f"Writer prompt {manifest.get('writer_prompt', 'v1')}; length gate "
             f"{'on' if manifest.get('summary_length_gate') else 'off'}; plans reused from "
             f"{manifest.get('plans_reused_from') or 'none (planned in this run)'}. Nothing here is approved.", ""]
    for label_map_chapter in sorted(p.name for p in folder.iterdir() if (p / "sources.json").exists()):
        chapter_dir = folder / label_map_chapter
        lines += [f"### {label_map_chapter}", ""]
        if not (chapter_dir / "draft.json").exists():
            errors = chapter_dir / "write-errors.json"
            lines += [f"No validated draft in this run. Last rejection: {load(errors)[-1]['error'] if errors.exists() else 'none'}", ""]
            continue
        packet = load(chapter_dir / "evidence.json")
        lines += ["Sections in this run's packet (shared by the Claude and same-packet Qwen writers; preserved "
                  "round-2/3 drafts used their own): " +
                  ", ".join(f"{s['verse_start']}–{s['verse_end']}" for s in packet["sections"]), ""]
        labels = key.get(label_map_chapter, {"A": {"set": "claude"}})
        review_path = review_dir / "reviews" / f"{label_map_chapter}.json"
        review = load(review_path)["drafts"] if review_path.exists() else {}
        for label, meta in sorted(labels.items(), key=lambda item: item[1]["set"]):
            path = SITE / meta["path"] if "path" in meta else chapter_dir / "draft.json"
            draft = load(path)
            verdict = review.get(label, {})
            attempts = len(list((path.parent).glob("write-[0-9].json")))
            lines += [f"#### {SET_NAMES.get(meta['set'], meta['set'])} — "
                      f"{verdict.get('verdict', 'not reviewed')}, {len(draft['summary'].split())} words"
                      + (f", {attempts} write attempt(s)" if attempts else ""), ""]
            lines += draft_block(draft)
            for issue in verdict.get("issues", []):
                if issue["severity"] == "material":
                    lines.append(f"- ⚠ Material ({issue['category']}, v. {issue['verses']}): “{issue['quote']}” — {issue['explanation']}")
            minor = [i for i in verdict.get("issues", []) if i["severity"] != "material"]
            if minor:
                lines.append(f"- {len(minor)} minor: " + "; ".join(f"“{i['quote'][:60]}” ({i['category']})" for i in minor))
            lines.append("")
    return lines


def main(run_ids: list[str]) -> None:
    lines = ["# Chapter-summary pilot report", "",
             "Generated from saved artifacts by `initiatives/chapter-summaries/tools/build_pilot_report.py`. "
             "Reviews were blind (drafts labelled A/B/C) and written by Claude reviewer agents, not people. "
             "“No material issue found” records one inspection, not approval. Rubric: "
             "`initiatives/chapter-summaries/REVIEW-RUBRIC.md`.", ""]
    for run_id in run_ids:
        lines += run_section(run_id)
    (PILOT / "REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {PILOT / 'REPORT.md'}")


if __name__ == "__main__":
    main(sys.argv[1:] or ["dev-1", "dev-2", "fresh-1"])
