"""Isolated pilot for chapter summaries written by an outside writer (e.g. Claude in Claude Code).
Makes NO model calls and never touches the studio database. It prepares exact prompts from local BSB,
then validates each raw submission with the same checks as the Qwen evidence trial (round 4 contract):

  python scripts/chapter_summary_claude_pilot.py prepare --run-id dev-1 --chapters ROM:1,GEN:4
  python scripts/chapter_summary_claude_pilot.py prepare --run-id dev-2 --from-run dev-1 --writer-prompt v2
  python scripts/chapter_summary_claude_pilot.py plan   --run-id dev-1 --chapter ROM:1 --file plan.json
  python scripts/chapter_summary_claude_pilot.py write  --run-id dev-1 --chapter ROM:1 --file write.json
  python scripts/chapter_summary_claude_pilot.py status --run-id dev-1

Every submission is stored verbatim with its SHA-256 before validation (plan-N.json / write-N.json).
At most two attempts per stage, as in the trial harness. A validated draft is never overwritten.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

import chapter_summary_evidence_trial as trial
import chapter_summary_studio as studio

ROOT = studio.OUTPUT / "claude-pilot"
MAX_ATTEMPTS = 2
# v1 is the unchanged Qwen round-3 writer prompt. Later versions append to it; never edit an earlier one.
WRITER_PROMPTS = {"v1": trial.WRITE}
# v2 (2026-10-13): dev-1 blind review found no material errors in Claude's drafts but summaries averaging
# 164 words (6 of 8 over 140; two first attempts over the 240 limit), read as verse-by-verse lists, and
# dropped two defining conditions in Genesis 4 (vv. 7, 15).
WRITER_PROMPTS["v2"] = trial.WRITE + """
LENGTH AND SHAPE: the summary is an overview a reader takes in at a glance, not a verse-by-verse
paraphrase; the outline carries the detail. Aim for 80-140 words. Use up to about 170 only when the
chapter is longer than 30 verses AND has several distinct movements; under 60 for chapters of 1-5
verses. Usually 4-7 summary sentences. Group related details instead of listing every item, but never
drop a qualifier to save words: shorten by leaving out lesser details, not by loosening what you keep.
Keep any condition that defines a promise, warning or threat (for example "if anyone slays Cain").
Vary how you refer to a recurring speaker so the prose reads naturally.
"""
# v3 (2026-10-13): owner set the summary ceiling at 200 words. fresh-1 review: Exodus 21 dropped a law's
# uncomfortable exception (v. 21); v2's "vary how you refer to a recurring speaker" produced
# "the psalmist ... the speaker" in Psalm 88, which reads as two people. v3 = v1 + this addendum.
WRITER_PROMPTS["v3"] = trial.WRITE + """
LENGTH AND SHAPE: the summary is an overview a reader takes in at a glance, not a verse-by-verse
paraphrase; the outline carries the detail. Most chapters need 80-140 words; long chapters with
several distinct movements may use up to 200, never more; chapters of 1-5 verses need under 60.
Usually 4-7 summary sentences. Group related details instead of listing every item, but never
drop a qualifier to save words: shorten by leaving out lesser details, not by loosening what you keep.
Keep any condition that defines a promise, warning or threat (for example "if anyone slays Cain").
For laws, keep each case's condition, its exceptions and any reason the text gives, even when the
reason is uncomfortable (for example "since the servant is his property"). Do not soften or omit
difficult content to make the chapter easier to read.
Refer to one speaker or person consistently by one name or a plain pronoun; do not alternate labels
such as "the psalmist" and "the speaker" for the same person.
"""


# Gate versions are frozen in each run's manifest ("summary_length_gate"); never change an existing one.
# "v1" (fresh-1): 70 / 150 / 180. dev-2 showed guidance alone left 5 of 8 summaries over target, while a
# rejection reliably got a shorter rewrite. "v2" (owner, 2026-10-13): under 200 words is fine.
LENGTH_GATES = {"v1": (70, 150, 180), "v2": (70, 200, 200)}


def summary_word_limit(verse_count: int, gate: str = "v1") -> int:
    tiny, normal, long = LENGTH_GATES[gate]
    return tiny if verse_count <= 5 else normal if verse_count <= 30 else long


def check_summary_length(draft: dict, scripture, gate: str | bool = "v1") -> None:
    gate = "v1" if gate is True else gate  # fresh-1's manifest records the v1 gate as `true`
    words, verses = len(draft["summary"].split()), len(studio.verse_numbers(scripture))
    limit = summary_word_limit(verses, gate)
    if words > limit:
        raise ValueError(f"Summary has {words} words; the limit for a {verses}-verse chapter is {limit}. "
                         "Shorten by leaving out lesser details; keep every qualifier and condition you keep.")


def save(path: Path, data) -> None:
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def run_folder(run_id: str) -> Path:
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{2,40}", run_id):
        raise ValueError(f"Run id must be 3-41 lowercase letters, digits or hyphens; received {run_id!r}.")
    return ROOT / run_id


def chapter_folder(run_id: str, key: str) -> Path:
    code, _, number = key.partition(":")
    studio.chapter_key(code, int(number))
    folder = run_folder(run_id) / f"{code}-{int(number)}"
    if not folder.is_dir():
        raise ValueError(f"{key} is not part of run {run_id}; prepare it first.")
    return folder


def snapshot(folder: Path):
    """Scripture exactly as frozen at prepare time (not the live data folder)."""
    data = load(folder / "sources.json")
    supplied = {int(n): passage for n, passage in data["passages"].items()}
    return supplied[data["target_chapter"]], supplied


def plan_prompt(code: str, chapter: int, scripture, supplied) -> str:
    prompt = f"TARGET {code} {chapter} BSB:\n" + scripture["text"]
    for n, passage in supplied.items():
        if n != chapter:
            prompt += f"\nCONTEXT chapter {n}:\n" + passage["text"]
    return ("=== SYSTEM INSTRUCTIONS ===\n" + trial.EXTRACT_STARTS +
            "\n=== REQUIRED JSON SCHEMA ===\n" + json.dumps(trial.PLAN_SCHEMA) +
            "\n\n=== USER MESSAGE ===\n" + prompt + "\n")


def write_prompt(code: str, chapter: int, packet, version: str = "v1") -> str:
    return ("=== SYSTEM INSTRUCTIONS ===\n" + WRITER_PROMPTS[version] +
            "\n=== REQUIRED JSON SCHEMA ===\n" + json.dumps(trial.WRITER_SCHEMA) +
            f"\n\n=== USER MESSAGE ===\nTARGET {code} {chapter} BSB. Evidence packet:\n" +
            json.dumps(packet, ensure_ascii=False) + "\n")


def claude_review(run: Path, chapter: str) -> dict | None:
    """The blind reviewer's verdict on the Claude draft of one chapter in a reviewed run, else None."""
    key_path = run / "blind-review" / "KEY-do-not-open-during-review.json"
    review_path = run / "blind-review" / "reviews" / f"{chapter}.json"
    if not key_path.exists() or not review_path.exists():
        return None
    labels = load(key_path)["chapters"].get(chapter, {})
    label = next((name for name, meta in labels.items() if meta["set"] == "claude"), None)
    return load(review_path)["drafts"].get(label) if label else None


def revision_request(earlier: dict, review: dict, word_limit: int | None = None) -> str:
    # sample-1-rev: 2 of 10 revisions were blocked only because fixing minor findings pushed the summary past
    # the gate twice; the request now states the limit and where extra detail belongs.
    findings = [{k: issue[k] for k in ("severity", "field", "quote", "verses", "explanation")} for issue in review["issues"]]
    limit = (f"The summary must stay UNDER {word_limit} words: put added detail in the outline, and drop lesser "
             "summary details rather than any qualifier. " if word_limit else "")
    return ("\nREVISION REQUEST: an earlier draft of this chapter is below, followed by the problems an independent "
            "check against this same packet found. Write a complete new draft from the evidence packet. Fix every "
            "material problem; fix minor ones where the packet supports the fix; keep everything else accurate. "
            + limit + "Re-check any sentence you keep from the earlier draft against the packet before reusing it.\n"
            "EARLIER DRAFT:\n" + json.dumps(earlier, ensure_ascii=False) +
            "\nREVIEW FINDINGS:\n" + json.dumps(findings, ensure_ascii=False) + "\n")


def prepare(run_id: str, chapters: list[str], writer_prompt: str = "v1", from_run: str | None = None,
            length_gate: str | bool = False, revise: bool = False) -> None:
    if length_gate and length_gate not in LENGTH_GATES:
        raise ValueError(f"Unknown length gate {length_gate!r}; choose from {sorted(LENGTH_GATES)}.")
    if writer_prompt not in WRITER_PROMPTS:
        raise ValueError(f"Unknown writer prompt {writer_prompt!r}; choose from {sorted(WRITER_PROMPTS)}.")
    if revise and not from_run:
        raise ValueError("A revision run needs --from-run (the reviewed run whose drafts it revises).")
    source_run = run_folder(from_run) if from_run else None
    if source_run and not chapters:
        chapters = load(source_run / "manifest.json")["chapters"]
    if revise:
        for key in chapters:
            if not claude_review(source_run, key.replace(":", "-")):
                raise ValueError(f"{key} has no blind review in {from_run}; review it before revising.")
    folder = run_folder(run_id)
    folder.mkdir(parents=True, exist_ok=False)
    code_files = (Path(__file__), Path(trial.__file__), Path(studio.__file__))
    save(folder / "manifest.json", {
        "created_at": studio.now(), "chapters": chapters, "translation": "bsb",
        "planner_contract": "section_starts (ends derived in Python); trial.EXTRACT_STARTS",
        "writer_contract": "WRITER_PROMPTS[writer_prompt] + WRITER_SCHEMA (summary_sentences with evidence_verses)",
        "writer_prompt": writer_prompt, "writer_prompt_text": WRITER_PROMPTS[writer_prompt],
        "plans_reused_from": from_run, "revision_of": from_run if revise else None,
        "max_attempts_per_stage": MAX_ATTEMPTS,
        "summary_length_gate": length_gate,
        "code_sha256": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in code_files},
        "publication_status": "pilot only; no studio database writes; nothing approved"})
    snapshot_dir = folder / "code-snapshot"
    snapshot_dir.mkdir()
    for path in code_files:
        (snapshot_dir / path.name).write_bytes(path.read_bytes())
    for key in chapters:
        code, _, number = key.partition(":")
        chapter = int(number)
        studio.chapter_key(code, chapter)
        target = folder / f"{code}-{chapter}"
        target.mkdir()
        if source_run:  # same frozen Scripture and validated packet: only the writer prompt changes
            old = source_run / target.name
            (target / "sources.json").write_bytes((old / "sources.json").read_bytes())
            (target / "evidence.json").write_bytes((old / "evidence.json").read_bytes())
            prompt = write_prompt(code, chapter, load(old / "evidence.json"), writer_prompt)
            if revise:
                verses = len(studio.verse_numbers(snapshot(old)[0]))
                gate = "v1" if length_gate is True else length_gate
                limit = summary_word_limit(verses, gate) if gate else None
                prompt += revision_request(load(old / "draft.json"), claude_review(source_run, target.name), limit)
            (target / "write-prompt.txt").write_text(prompt, encoding="utf-8")
            continue
        scripture = studio.source(code, chapter)
        supplied = {chapter: scripture, **studio.context_sources(code, chapter)}
        save(target / "sources.json", {"target_chapter": chapter, "passages": supplied})
        (target / "plan-prompt.txt").write_text(plan_prompt(code, chapter, scripture, supplied), encoding="utf-8")
    print(f"Prepared {len(chapters)} chapters in {folder}")


def submit(run_id: str, key: str, stage: str, file: Path, note: str) -> int:
    folder = chapter_folder(run_id, key)
    done_marker = folder / ("evidence.json" if stage == "plan" else "draft.json")
    if done_marker.exists():
        raise ValueError(f"{key} already has {done_marker.name}; validated results are never replaced.")
    if stage == "write" and not (folder / "evidence.json").exists():
        raise ValueError(f"{key} has no validated plan yet.")
    attempt = len(list(folder.glob(f"{stage}-[0-9].json"))) + 1
    if attempt > MAX_ATTEMPTS:
        raise ValueError(f"{key} {stage} is blocked after {MAX_ATTEMPTS} attempts; see {stage}-errors.json.")
    raw = file.read_bytes().decode("utf-8-sig")
    save(folder / f"{stage}-{attempt}.json", {"submitted_at": studio.now(), "note": note,
         "sha256": hashlib.sha256(raw.encode("utf-8")).hexdigest(), "raw": raw})
    scripture, supplied = snapshot(folder)
    code, chapter = key.split(":")[0], int(key.split(":")[1])
    try:
        submitted = json.loads(raw)
        if stage == "plan":
            packet = trial.validate_plan(submitted, scripture, supplied)
            save(folder / "evidence.json", packet)
            version = load(run_folder(run_id) / "manifest.json").get("writer_prompt", "v1")
            (folder / "write-prompt.txt").write_text(write_prompt(code, chapter, packet, version), encoding="utf-8")
        else:
            result = trial.validate_traced_writer(submitted, load(folder / "evidence.json"), scripture, supplied)
            gate = load(run_folder(run_id) / "manifest.json").get("summary_length_gate")
            if gate:
                check_summary_length(result["draft"], scripture, gate)
            save(folder / "sentence-support.json", result["support"])
            save(folder / "draft.json", result["draft"])
    except (ValueError, KeyError, TypeError) as exc:
        errors_path = folder / f"{stage}-errors.json"
        errors = load(errors_path) if errors_path.exists() else []
        save(errors_path, errors + [{"attempt": attempt, "error": str(exc)}])
        print(f"REJECTED {key} {stage} attempt {attempt}: {exc}")
        return 1
    print(f"ACCEPTED {key} {stage} attempt {attempt}")
    return 0


def status(run_id: str) -> None:
    for folder in sorted(p for p in run_folder(run_id).iterdir() if (p / "sources.json").exists()):
        state = ("draft" if (folder / "draft.json").exists() else "planned" if (folder / "evidence.json").exists()
                 else "prepared")
        attempts = {s: len(list(folder.glob(f"{s}-[0-9].json"))) for s in ("plan", "write")}
        print(f"{folder.name:10} {state:9} plan attempts {attempts['plan']} write attempts {attempts['write']}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = parser.add_subparsers(dest="command", required=True)
    p = commands.add_parser("prepare")
    p.add_argument("--run-id", required=True)
    p.add_argument("--chapters", default="", help="comma-separated BOOK:chapter keys")
    p.add_argument("--writer-prompt", default="v1", help="writer prompt version (WRITER_PROMPTS)")
    p.add_argument("--from-run", help="reuse another run's frozen sources and validated plans")
    p.add_argument("--length-gate", nargs="?", const="v1", default=False,
                   help="reject summaries above the gate's word limit (LENGTH_GATES; bare flag = v1)")
    p.add_argument("--revise", action="store_true",
                   help="with --from-run and --chapters: add each earlier draft and its blind review to the prompt")
    for name in ("plan", "write"):
        p = commands.add_parser(name)
        p.add_argument("--run-id", required=True)
        p.add_argument("--chapter", required=True)
        p.add_argument("--file", type=Path, required=True)
        p.add_argument("--note", default="", help="who/what produced the submission")
    p = commands.add_parser("status")
    p.add_argument("--run-id", required=True)
    args = parser.parse_args()
    try:
        if args.command == "prepare":
            chapters = [c.strip() for c in args.chapters.split(",") if c.strip()]
            if not chapters and not args.from_run:
                raise ValueError("Give --chapters or --from-run.")
            prepare(args.run_id, chapters, args.writer_prompt, args.from_run, args.length_gate, args.revise)
        elif args.command == "status":
            status(args.run_id)
        else:
            return submit(args.run_id, args.chapter, args.command, args.file, args.note)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
