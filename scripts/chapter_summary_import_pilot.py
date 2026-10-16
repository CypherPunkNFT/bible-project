"""Import validated pilot drafts into a SEPARATE studio database, as drafts. No model calls.

  python scripts/chapter_summary_import_pilot.py --run-id sample-1
  python scripts/chapter_summary_studio.py --data-dir .local/chapter-summary-studio/claude   # browse/edit/approve

Default target: .local/chapter-summary-studio/claude/summaries-v3.sqlite3. Refuses the curated studio folder
(the five corrected examples). Never overwrites a chapter already in the target; every record stays
status=draft until the owner approves it in the studio. Each import is appended to imports.jsonl.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import chapter_summary_claude_pilot as pilot
import chapter_summary_studio as studio

DEFAULT_TARGET = studio.OUTPUT / "claude"
WRITER_MODEL = "claude-opus-5-5 (Claude Code subagent)"


def review_for(run: Path, chapter: str) -> dict | None:
    verdict = pilot.claude_review(run, chapter)
    return verdict and {"reviewer": "Claude reviewer agent, blind; not approval", "verdict": verdict["verdict"],
                        "issues": verdict["issues"], "scores": verdict["scores"]}


def record_for(run_id: str, chapter_dir: Path) -> dict:
    code, number = chapter_dir.name.rsplit("-", 1)
    chapter = int(number)
    scripture, supplied = pilot.snapshot(chapter_dir)
    live = studio.source(code, chapter)
    if live["hash"] != scripture["hash"]:
        raise ValueError("local BSB text changed since the pilot froze it; regenerate instead of importing")
    draft = studio.validate(pilot.load(chapter_dir / "draft.json"), scripture, supplied)
    manifest = pilot.load(chapter_dir.parent / "manifest.json")
    attempts = sorted(chapter_dir.glob("write-[0-9].json"))
    return {**draft, "code": code, "chapter": chapter, "translation": "bsb", "model": WRITER_MODEL,
            "source_sha256": scripture["hash"],
            "context_source_sha256": {str(n): s["hash"] for n, s in supplied.items() if n != chapter},
            "prompt_version": f"claude-pilot-{manifest.get('writer_prompt', 'v1')}",
            "format_version": studio.FORMAT_VERSION, "method_sources": studio.METHOD_SOURCES,
            "generated_at": pilot.load(attempts[-1])["submitted_at"] if attempts else None,
            "status": "draft", "reviewed_at": None, "attempts": len(attempts),
            "automated_review": {"passed": None, "note": "no model self-review gate; see pilot_review", "human_review_required": True},
            "pilot_review": review_for(chapter_dir.parent, chapter_dir.name),
            "pilot": {"run_id": run_id, "chapter_folder": str(chapter_dir.relative_to(studio.SITE)
                                                              if chapter_dir.is_relative_to(studio.SITE) else chapter_dir),
                      "draft_sha256": hashlib.sha256((chapter_dir / "draft.json").read_bytes()).hexdigest(),
                      "sentence_support": pilot.load(chapter_dir / "sentence-support.json"),
                      "length_gate": manifest.get("summary_length_gate")},
            "imported_at": studio.now()}


def run_import(run_id: str, target: Path) -> dict:
    target = target.resolve()
    if target == studio.OUTPUT.resolve():
        raise ValueError(f"{target} holds the curated studio examples; import into a separate folder.")
    store = studio.Store(target)
    existing = store.all()
    result = {"run_id": run_id, "target": str(target), "imported": [], "skipped": {}}
    for chapter_dir in sorted(p for p in pilot.run_folder(run_id).iterdir() if (p / "draft.json").exists()):
        code, number = chapter_dir.name.rsplit("-", 1)
        key = studio.chapter_key(code, int(number))
        if key in existing:
            result["skipped"][key] = "already in target; never overwritten"
            continue
        try:
            store.put(key, record_for(run_id, chapter_dir))
            result["imported"].append(key)
        except ValueError as exc:
            result["skipped"][key] = str(exc)
    with (target / "imports.jsonl").open("a", encoding="utf-8") as log:
        log.write(json.dumps({**result, "at": studio.now()}, ensure_ascii=False) + "\n")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_TARGET)
    args = parser.parse_args()
    try:
        outcome = run_import(args.run_id, args.data_dir)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(2)
    print(f"Imported {len(outcome['imported'])} into {outcome['target']}; skipped {len(outcome['skipped'])}")
    for key, why in outcome["skipped"].items():
        print(f"  skipped {key}: {why}")
