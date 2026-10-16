# Handoff: chapter-summary work

**Class:** LIVING · **State last verified:** 2026-10-13, 22:10 America/New_York.
- The Claude database was opened read-only and counted: 1,189 records, all `status=draft`, every chapter of the 66 books present, `integrity_check` ok.
- The curated database is unchanged at 5 records.
- The studio on port 8947 serves all 1,189 (`/api/state`).
- 60 tests pass.

Read this file and [README](README.md) before acting. [status.json](status.json) is the machine-readable snapshot.

## Current state

- **The whole Bible is drafted (2026-10-13, 19:30–22:10).** All 1,189 chapters have a Claude draft.
  - 1,141 come from the full run and 48 from the sample.
  - On first blind review, 1,041 of the 1,141 had no material issue.
  - The 100 flagged chapters were revised from their findings and re-reviewed by fresh reviewers. All 100 now pass. Two of them needed a second revision.
  - Details: [RESULTS](RESULTS.md#full-run-the-whole-bible-2026-10-13-current).
- **Claude database:** `.local/chapter-summary-studio/claude/summaries-v3.sqlite3`. Each record carries:
  - its blind-review verdict;
  - its provenance (run id, prompt version, raw-submission fingerprint);
  - its sentence-to-verse support map.
- **Studio:** running on that database at http://localhost:8947 (`--data-dir .local/chapter-summary-studio/claude`). Generate is refused there automatically.
- **Nothing is approved or published.**
  - Next step for the owner: read and approve in the studio.
  - Integrating approved summaries into the main site (8931) has not been started and needs the owner's go.
- **Curated database untouched:** `summaries-v3.sqlite3`, with the five corrected examples, plus the 584 and 8 older drafts. Zero approved anywhere.
- **Production method (owner, 2026-10-13):** Claude agents, 8 in parallel, under 200 words (under 70 for chapters of 1–5 verses). Writer prompt v3, length gate v2.
- **Ollama:** running and idle (started by accident earlier). Not needed for the Claude method.

## How the full run was done (to repeat or extend it)

Per batch of up to 48 chapters (all commands in [RUNBOOK](RUNBOOK.md) "Claude pilot"):
1. Prepare the batch: `prepare --run-id full-NN --writer-prompt v3 --length-gate v2 --chapters ...`.
2. Planners: 6 agents × 8 chapters, in parallel.
3. Writers: 8 lane agents × 6 chapters, in parallel. Each reads only its chapters' `write-prompt.txt` and gets a short genre note:
   - law: keep exceptions and reasons;
   - narrative: keep who caused what;
   - prophecy and visions: identify only as the text explains;
   - Gospels: no details from other Gospels;
   - letters: keep the argument's order, conditions and who is addressed.
4. Build the review packets with `build_blind_review.py`, only once every chapter is drafted, because it refuses to overwrite. Then run reviewers, 6 × 8 in parallel, using [REVIEW-RUBRIC](REVIEW-RUBRIC.md).
5. Revise:
   - Run `score_blind_review.py`.
   - For the flagged chapters, run `prepare --run-id full-NN-rev --from-run full-NN --revise --chapters ...`, then revision lanes, then a fresh blind re-review.
   - A revision that fails its re-review goes to `full-NN-rev2`.
   - A chapter rejected twice by the length gate goes to a fresh `full-NN-retry` (`--from-run`, without `--revise`).
6. Import with `chapter_summary_import_pilot.py --run-id ...`, in this order: rev2, retry, rev, main. The importer never overwrites, so the best version wins.
7. Record the batch in `claude-pilot/full-run-progress.json`.

About 23 agents per batch; ~2 h 40 min for all 24 batches with batches overlapping.

## Remaining limits (not blockers)

1. The reviewers are Claude, the same family as the writer, and no human has read these drafts. The owner spot-checks and approves in the studio.
2. The studio's old Generate button is still the single-pass Qwen path. It refuses to run on the Claude database, but should not be used for this corpus.

## Decisions to preserve (unchanged)

1. The owner wants a local Python UI (studio on 8947). The main Bible preview stays on 8931 (8941 is only its redirect). No new preview endpoints.
2. Agreed reader structure: title, optional cited context, summary paragraph, expandable verse outline, observation invitation, Read chapter link. Do not change it without agreement. The pilot kept it exactly, and the audit fields are stripped before the reader draft is saved.
3. Other pipeline types are a separate discussion. Do not activate `chapter_pipeline_catalog.py` or `chapter_pipeline_engine.py`.
4. Self-review is not approval. Neither is a reviewer agent's verdict.

## How to resume

- Read [RUNBOOK](RUNBOOK.md) "Claude pilot" for every command. New runs need a **new run id**; the tools refuse to overwrite.
- Do not edit `dev-1`, `dev-2` or `fresh-1`. Each has a `manifest.json` and a `code-snapshot/` of the exact code it used. `fresh-1` also has `code-snapshot-at-amendment/` and an `amendments` entry for the length gate it gained before any writer ran.
- Writer prompts are versioned in `WRITER_PROMPTS` in [chapter_summary_claude_pilot.py](../../scripts/chapter_summary_claude_pilot.py). Add v3 as a new key; never edit v1 or v2.
- Pre-change copies of the two edited scripts (they are untracked in git): `.local/chapter-summary-studio/archive/20261013T-code-before-coverage-fix/`. The harness copy matches the round-3 manifest's SHA-256.
- Keep one GPU inference batch at a time. The comparison script fails closed only if the studio is listening and busy.

## Known gaps (still true)

- Studio resume does not enforce source, model or prompt hashes across saved records. Archive or isolate before changing a run configuration.
- `Studio.save()` does not clear stale automatic-review metadata after manual edits.
- The trial CLI and the comparison script share no process lock with the studio UI.
- Pilot writer agents are bound only by instructions. One `dev-1` writer ran its own Python one-off to trim its draft between attempts; it touched only its own work file and is noted in the report. Raw submissions are hashed, so the artifacts show what was submitted.

## Open items / gotchas

- `ollama list` (and other `ollama` commands) start the Ollama server if it is down.
- Ollama logs a downloaded update waiting to install. Do not install it as part of this work.
- The repository is shared with other chats. The chapter-summary scripts and these docs are untracked in git. Nothing was committed or pushed.
