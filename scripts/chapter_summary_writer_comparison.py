"""Writer-only comparison: run the local Qwen writer, with the exact round-3 writer settings, on the SAME
evidence packets a pilot run already validated (e.g. claude-pilot/dev-1). Only the writer differs.
Launches local inference immediately; never touches the studio database.

  python scripts/chapter_summary_writer_comparison.py --run-id dev-1

Output per chapter: claude-pilot/<run>/<CHAPTER>/qwen-writer/ (write-N.json raw responses, write-errors.json,
draft.json, sentence-support.json, result.json). Refuses a chapter whose qwen-writer folder already exists.
"""
from __future__ import annotations

import argparse
import json
import socket
import time

import chapter_summary_claude_pilot as pilot
import chapter_summary_evidence_trial as trial
import chapter_summary_studio as studio


def studio_idle() -> None:
    """Fail closed if the studio is listening and busy; the CLI has no shared lock with it."""
    with socket.socket() as probe:
        probe.settimeout(1)
        if probe.connect_ex(("127.0.0.1", 8947)) != 0:
            return
    import urllib.request
    with urllib.request.urlopen("http://127.0.0.1:8947/api/state", timeout=5) as response:
        if json.load(response)["job"]["running"]:
            raise RuntimeError("Pause the studio batch before this comparison.")


def run(run_id: str) -> None:
    studio_idle()
    base = pilot.run_folder(run_id)
    manifest = pilot.load(base / "manifest.json")
    version = manifest.get("writer_prompt", "v1")
    system = pilot.WRITER_PROMPTS[version]  # identical instructions to the run's other writer
    gate = manifest.get("summary_length_gate", False)  # identical acceptance checks too

    def check(draft, packet, scripture, supplied):
        result = trial.validate_traced_writer(draft, packet, scripture, supplied)
        if gate:
            pilot.check_summary_length(result["draft"], scripture, gate)
        return result
    summary = []
    for chapter_dir in sorted(p for p in base.iterdir() if (p / "evidence.json").exists()):
        out = chapter_dir / "qwen-writer"
        out.mkdir(exist_ok=False)
        code, number = chapter_dir.name.rsplit("-", 1)
        scripture, supplied = pilot.snapshot(chapter_dir)
        packet = pilot.load(chapter_dir / "evidence.json")
        started = time.monotonic()
        item = {"key": f"{code}:{number}", "model": studio.DEFAULT_MODEL, "writer_prompt": version,
                "summary_length_gate": gate, "status": "failed"}
        try:
            generated, errors = trial.stage(out, "write", system,
                f"TARGET {code} {number} BSB. Evidence packet:\n" + json.dumps(packet, ensure_ascii=False),
                trial.WRITER_SCHEMA, lambda d: check(d, packet, scripture, supplied),
                6000 + 250 * len(packet["sections"]), think=True)
            pilot.save(out / "sentence-support.json", generated["support"])
            pilot.save(out / "draft.json", generated["draft"])
            item.update(status="draft", corrections=errors)
        except Exception as exc:  # recorded per chapter; the batch continues like the trial harness
            item["error"] = str(exc)
        item["seconds"] = round(time.monotonic() - started, 2)
        pilot.save(out / "result.json", item)
        summary.append(item)
        print(json.dumps(item), flush=True)
    pilot.save(base / "qwen-writer-results.json", {"completed_at": studio.now(), "results": summary,
        "writer_prompt": version, "settings": "round-3 writer: temperature 0, num_ctx 32768, think on, budget 6000+250/section, 2 attempts"})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--run-id", required=True)
    run(parser.parse_args().run_id)
