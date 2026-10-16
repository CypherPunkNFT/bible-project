# File and archive map

All paths below are relative to `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website`, unless explicitly marked as workspace temporary paths.

## Canonical code and documentation

| Path | Role |
| --- | --- |
| [scripts/chapter_summary_studio.py](../../scripts/chapter_summary_studio.py) | Live Python studio, inline UI, schema, source loading, generation, review, storage, API |
| [scripts/chapter_summary_evidence_trial.py](../../scripts/chapter_summary_evidence_trial.py) | Isolated Qwen harness; since 2026-10-13 its planner returns section starts (`validate_plan`) and it takes `--run-id` |
| [scripts/chapter_summary_claude_pilot.py](../../scripts/chapter_summary_claude_pilot.py) | Claude pilot bookkeeping: prepare / plan / write / status; versioned writer prompts; length gate. No model calls |
| [scripts/chapter_summary_writer_comparison.py](../../scripts/chapter_summary_writer_comparison.py) | Qwen writer on a pilot run's packets (launches local inference) |
| [scripts/chapter_summary_import_pilot.py](../../scripts/chapter_summary_import_pilot.py) | Import validated pilot drafts into the separate Claude studio database as drafts (never the curated folder, never overwrites) |
| [scripts/tests/test_chapter_summary_studio.py](../../scripts/tests/test_chapter_summary_studio.py) | Studio offline tests |
| [scripts/tests/test_chapter_summary_evidence_trial.py](../../scripts/tests/test_chapter_summary_evidence_trial.py) | Evidence/trace boundary and regression tests |
| [scripts/tests/test_chapter_summary_coverage.py](../../scripts/tests/test_chapter_summary_coverage.py) | Section derivation: synthetic edge cases, all 1,189 BSB chapters, real round-3 plans |
| [scripts/tests/test_chapter_summary_claude_pilot.py](../../scripts/tests/test_chapter_summary_claude_pilot.py) | Pilot rules: raw kept, two attempts, never overwritten, plan reuse, length gate |
| [REVIEW-RUBRIC.md](REVIEW-RUBRIC.md) | Issue categories, severity, eight criteria, verdict wording used for every pilot draft |
| [tools/build_blind_review.py](tools/build_blind_review.py), [tools/score_blind_review.py](tools/score_blind_review.py), [tools/build_pilot_report.py](tools/build_pilot_report.py) | Blind packets + key, unblinded totals, readable report (no model calls) |
| [design/chapter-summary-studio/index.html](../../design/chapter-summary-studio/index.html) | Static illustrative interface |
| [initiatives/chapter-summaries/README.md](README.md) | Documentation entry point |
| [initiatives/chapter-summaries/HANDOFF.md](HANDOFF.md) | Cross-session handoff |
| [status.json](status.json) | Timestamped service/database/results snapshot |
| [tools/build_trial_report.py](tools/build_trial_report.py) | Regenerate aggregate HTML/JSON report without inference |
| [tools/verify_trial_artifacts.py](tools/verify_trial_artifacts.py) | Check complete trials, source consistency, and artifact integrity |

`scripts/chapter_pipeline_catalog.py` and `scripts/chapter_pipeline_engine.py` are unused prototypes for other analyses. Their presence does not mean that additional pipelines were agreed, integrated, tested, or run. Their internal descriptions may describe an intended integration that does not exist in the active summary server.

## Scripture inputs

- `data/stats.json`: book/chapter inventory.
- `data/text/bsb/{BOOK}/*.json`: source used in the summary experiments.
- `data/text/kjv/` and `data/text/web/`: other studio-supported local translations.

These are ignored local data. Preserve them separately when transferring the project.

## Studio data directory

Root: [`.local/chapter-summary-studio`](../../.local/chapter-summary-studio/).

| Item | Contents / status at handoff |
| --- | --- |
| `summaries.sqlite3` | Original v1 work; 584 records preserved |
| `summaries-v2.sqlite3` | Earlier unapproved structure; eight records preserved |
| `summaries-v3.sqlite3` | Active studio; five corrected, unapproved draft examples and earlier test failures |
| `latest-archive.json` | Pointer/count for the original 584-draft archive; not a unified inventory of all later archives |
| `pilot-examples-before-editorial-corrections.json` | Original versions of the five manually corrected studio examples |
| `pilot-review-report.json` | Earlier v3 pilot evaluation |
| `pilot-round2-results.json`, `pilot-round3-results.json` | Earlier studio campaign; not the evidence-first folders |
| `reviewer-checks-v3.json` | Initial reviewer calibration |
| `scoped-review-checks-v3.json` | Scoped fast-review calibration |
| `reasoning-review-checks-v3.json` | Reasoning-review calibration |
| `psalm119-token-benchmark.json` | Old short-summary token/timing measurement |
| `structured-v2-trials.json` | Historical v2 trial data |
| `server.stdout.log`, `server.stderr.log` | Existing local server logs; not a live-state guarantee |
| `*.png` | Earlier desktop/mobile interface captures |

If an approved export is later made, its default location is `approved-chapter-summaries-v3.json`. No approved export is claimed by the present handoff.

## Archives

All are under `.local/chapter-summary-studio/archive/`:

| Folder | Inventory |
| --- | --- |
| `20261013T031621Z-paragraph-v1/` | Original 584 drafts: SQLite backup, `outputs.json`, `manifest.json` |
| `20261013T035545Z-structured-v2-unapproved/` | Eight earlier structured drafts: SQLite backup, outputs, manifest |
| `20261013T040016Z-v3-preflight/` | Partial archive attempt: `outputs.json` only |
| `20261013T040030Z-v3-preflight/` | Completed v3 preflight archive: SQLite backup, outputs, manifest |
| `20261013T-code-before-coverage-fix/` | Studio and harness source as they were before the coverage change (both untracked in git), with README |

Archived SQLite files are named `summaries.sqlite3` within their archive folder even when preserving later formats. Identify format by the manifest and payload, not that filename alone. The partial 04:00:16 archive was followed by the complete 04:00:30 archive after a Windows SQLite-handle issue; preserve both and use the complete one for recovery.

## Claude pilot (2026-10-13)

Root: [`.local/chapter-summary-studio/claude-pilot`](../../.local/chapter-summary-studio/claude-pilot/). Ignored by git like the rest of `.local/`.

```text
claude-pilot/
  REPORT.md                        every draft, verdict and quoted issue (build_pilot_report.py)
  AGENT-PROMPTS.md                 exact planner / writer / reviewer instructions and observed deviations
  dev-1/  dev-2/  fresh-1/         one folder per run
    manifest.json                  chapters, writer prompt version + text, gate, plans_reused_from, code hashes
    code-snapshot/                 the code used (fresh-1 also: code-snapshot-at-amendment/, manifest "amendments")
    qwen-writer-results.json       dev-1, fresh-1: per-chapter Qwen status and seconds
    qwen-writer-run.log
    blind-review/
      <CHAPTER>.txt                what reviewers saw (source + drafts labelled A/B/C)
      KEY-do-not-open-during-review.json   label → draft set, path, SHA-256
      reviews/<CHAPTER>.json       reviewer issues, scores, verdicts
      results.json                 unblinded totals (score_blind_review.py)
    <BOOK>-<n>/
      sources.json                 frozen Scripture snapshot (dev runs byte-identical to round 3)
      plan-prompt.txt              planner input (not in dev-2: plans reused)
      plan-N.json, plan-errors.json   raw planner submissions with SHA-256
      evidence.json                validated packet: derived sections, every verse hydrated
      write-prompt.txt             writer input
      write-N.json, write-errors.json raw writer submissions with SHA-256
      draft.json                   reader-format draft (six agreed fields)
      sentence-support.json        per-sentence and per-outline-entry verse citations
      work/                        the agent's own working files
      qwen-writer/                 dev-1, fresh-1: Qwen raw responses, errors, draft, support, result.json
```

Pre-change copies of the two edited scripts: `archive/20261013T-code-before-coverage-fix/` (the harness copy's SHA-256 equals round-3's `script_sha256`).

## Claude studio database (2026-10-13)

`.local/chapter-summary-studio/claude/` contains:
- `summaries-v3.sqlite3`: all 1,189 chapters as drafts, every one `status=draft` with prompt version `claude-pilot-v3`.
- `imports.jsonl`: the import log, one line per imported run.
- `server.log`: the studio's output.

Open it with `scripts/chapter_summary_studio.py --data-dir .local/chapter-summary-studio/claude`.

Sample runs under `claude-pilot/`:
- `sample-1`: 48 chapters.
- `sample-1-rev`: 10 revisions, 8 accepted.
- `sample-1-rev2`: Acts 20 and Jeremiah 15, revised again with the word limit stated.
- `sample-1/lanes.json`: the writer lane assignment.

Full-run folders under `claude-pilot/` (53 in total):
- `full-run-batches.json`: the 24 batches, each with its chapters, 6 planner groups and 8 writer lanes.
- `full-run-progress.json`: per batch, the chapter range, first-pass clean count, revised count, import time and notes; also overall totals.
- `full-01` … `full-24`: one per batch, with the same per-chapter layout as the pilot runs plus `blind-review/`.
- `full-NN-rev`: the revisions for each batch that had flags.
- `full-02-rev2` (Exodus 13) and `full-20-rev2` (Luke 12): second revisions.
- `full-13-retry` (Psalm 127) and `full-18-retry` (Daniel 11): fresh writes after two length-gate rejections.

## Evidence-first trials

Root: [`.local/chapter-summary-studio/evidence-first-trials`](../../.local/chapter-summary-studio/evidence-first-trials/).

```text
evidence-first-trials/
  report.html                      all outputs with expandable chapter details
  report.json                      aggregate results and editorial reviews
  verification.json                source consistency, metrics, hashes, limitations
  report-desktop.png
  report-mobile.png
  round-1/                         first evidence approach
  round-2/                         revised source-reference approach
  round-3/                         full sections + traced reasoning writer
    manifest.json                  prompts, model, batch, source snapshot of harness
    results.json                   one result per attempted chapter
    completion.json                timestamp, count, total processing seconds
    editorial-review.json          Codex critique; not human approval
    ROM-1/                         similar folders for all eight chapters
      sources.json                 complete supplied Scripture snapshots
      extract-1.json               raw model response and metrics
      extract-2.json               present only if retried
      extract-errors.json          present on extraction rejection
      evidence.json                present only after evidence validation
      write-1.json                 present if writing was attempted
      write-2.json                 present only if retried
      write-errors.json            present on writer rejection
      draft.json                   present only after successful validation
      sentence-support.json        round-3 audit map, when writing succeeded
      model-review.json            advisory review, if successful
```

Never equate missing `draft.json` with lost work: an explicitly failed extraction correctly has no draft. Raw responses and errors document the failure. The verification manifest currently covers 152 JSON artifacts inside the three round directories; aggregate reports and documentation are separate.

## Workspace temporary helpers

Historical helpers live outside Website under `D:\FortressOfSolitude\.tmp\`. They are not canonical entry points. Before running one, inspect its source and side effects.

- `resume_chapter_summaries.py` restarts the studio and starts a whole-Bible batch. Do not use for status checks.
- `benchmark_psalm119.py` has pause/resume behavior and may resume generation on exit.
- `verify_grounded_summary_v3.py` archives/moves the current v3 database and runs a pilot.
- `summary_pilot_round3.py` overwrites studio pilot records/results.
- `correct_summary_pilot_examples.py` was a one-time correction script; rerunning can overwrite the original snapshot and repeat edits.
- `check_scoped_summary_review.py` and `check_reasoning_summary_review.py` originally expected defective records that were later corrected. They are not valid unchanged regression fixtures today.
- `restart_summary_studio_idle.py` verifies and restarts the studio, but still changes service state; inspect first.
- Old report-builder and verifier helpers have durable replacements in this documentation folder's `tools/` directory.

## Transfer checklist

Preserve code/tests/docs, the full `.local/chapter-summary-studio/` directory, required `data/` files, and static preview. Keep archive hierarchy and filenames. Ollama model files are managed by the local Ollama installation, not contained in this project directory; the configured tag alone is not a copy of model weights. No portable model bundle or off-machine backup was created by this documentation task.
