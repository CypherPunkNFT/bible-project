# Operating and recovery guide

The current full run is paused. Reading the UI, reports, or source files requires no inference. Commands below assume Windows Command Prompt and the existing `D:\Python\python.exe` installation. For agent tool calls on this workstation, use `cmd.exe` with login disabled if PowerShell launch is denied; do not disable antivirus protection.

## Working directory and offline checks

```bat
cd /d D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website
D:\Python\python.exe -m unittest discover -s scripts/tests -p test_chapter_summary*.py
```

Expected: **57 passing tests** (verified 2026-10-13). Beyond schema/range validation, storage/API behavior, evidence boundaries and trace fields, they now cover:
- deterministic section derivation, over every one of the 1,189 BSB chapters and on synthetic omitted, empty and combined verses;
- the lumped-final-section guard, using Qwen's real round-3 Genesis 5 and Psalm 119 plans;
- the pilot's raw-submission, attempt-cap, never-overwrite, plan-reuse and length-gate rules.

One explicit test still demonstrates that a matching quotation can accompany a false claim: semantic accuracy requires separate review.

The core scripts require modern Python (syntax/features used are compatible with Python 3.10+) and standard-library modules. Do not install new dependencies or models just to read existing outputs.

## Open the existing work

- Studio: `http://localhost:8947`.
- Read-only job/data state: `http://127.0.0.1:8947/api/state`.
- Main Bible preview: `http://localhost:8931/study/structure#chapters`.
- Comparison report: open `.local\chapter-summary-studio\evidence-first-trials\report.html` as a local file.
- Static studio preview: open `design\chapter-summary-studio\index.html` as a local file.

The latest trial drafts appear in the comparison report, not in the live studio. The live studio's five examples were manually corrected in an earlier campaign and remain drafts.

Book squares select among all 66 books. Chapter squares select the displayed draft/source. A gold lower border marks a draft; a green lower border marks approval. A green selected tile is a selection indicator and must not be confused with approval. Expand the chapter outline and select verse links to inspect source support. Unsaved editor changes block chapter/book navigation and trigger a leave-page warning.

## Start the studio only if it is not already listening

First check the existing URL/port. If no studio is running:

```bat
D:\Python\python.exe -u -X utf8 scripts\chapter_summary_studio.py
```

This starts on loopback port 8947 and remains idle until Generate is selected. It does not automatically resume a saved batch or download a model. The generation action can cause Ollama to load the selected installed model. Do not launch a duplicate server or create another main-site preview.

For a static preview regeneration only:

```bat
D:\Python\python.exe -X utf8 scripts\chapter_summary_studio.py --preview
```

This overwrites the illustrative static HTML using the current source template. It starts no server and performs no model calls. Opening the existing preview needs no regeneration.

## Pause, inspect, and restart safely

Use the UI Pause control for a running studio batch. It waits until the current chapter finishes; one chapter can include multiple model attempts. Wait for `/api/state` to show `job.running=false` before restarting the server or archiving its database.

Do not terminate arbitrary Python or Ollama processes. If a server must be stopped, identify the process actually listening on 8947 and verify its command line points to `scripts/chapter_summary_studio.py`. Prefer graceful shutdown after the job is idle. Saved chapter records survive; the in-memory job/ETA does not.

Studio resume means starting a scope again; it skips saved chapter keys and retries missing ones. It does **not** overwrite a saved draft. Translation/format/prompt-version checks prevent some incompatible mixes, but model and actual source/prompt hashes are not enforced as resume invariants. Use an isolated experiment or verified archive before changing generation settings. Do not resume the full Bible as part of routine service recovery.

## Review, approval, and export

Inspect the whole target chapter, each outline range, and every cited context passage. Check speaker, subject/object, conditions, chronology, pronouns, comparisons, and literary genre. Preserve difficult content without importing conclusions from other texts. Check the ending as well as the opening.

Save draft preserves edits without approval. Approve changes the record's status and review timestamp. Export creates a local `approved-chapter-summaries-v3.json` containing approved records only. With zero approved records, export refuses. No automatic production deployment follows an export.

The current `save()` path does not generally invalidate old automatic-review metadata after edits. Treat that metadata as historical unless explicitly refreshed or invalidated. Automated review is not the approval decision.

## Claude pilot (isolated; no model calls by the tool itself)

All commands run from the Website folder. Output goes to `.local\chapter-summary-studio\claude-pilot\<run-id>\`. The tool refuses an existing run id and never overwrites a validated plan or draft.

```bat
rem 1. Freeze sources and write the planning prompt for each chapter
D:\Python\python.exe -X utf8 scripts\chapter_summary_claude_pilot.py prepare --run-id next-1 --writer-prompt v2 --length-gate --chapters EXO:21,MRK:9
rem    or reuse another run's frozen sources + validated plans, changing only the writer prompt:
D:\Python\python.exe -X utf8 scripts\chapter_summary_claude_pilot.py prepare --run-id next-2 --from-run next-1 --writer-prompt v2 --length-gate

rem 2. A planner submits section starts; the tool derives ranges, hydrates every verse, writes write-prompt.txt
D:\Python\python.exe -X utf8 scripts\chapter_summary_claude_pilot.py plan  --run-id next-1 --chapter EXO:21 --file <plan.json> --note "who wrote it"

rem 3. A writer submits the traced draft; the tool validates it and saves draft.json + sentence-support.json
D:\Python\python.exe -X utf8 scripts\chapter_summary_claude_pilot.py write --run-id next-1 --chapter EXO:21 --file <write.json> --note "who wrote it"

D:\Python\python.exe -X utf8 scripts\chapter_summary_claude_pilot.py status --run-id next-1
```

Each submission is stored verbatim with its SHA-256 (`plan-N.json`, `write-N.json`) before validation, with at most two attempts per stage. In this session the planner and writers were Claude Code subagents. Each writer read only its own `write-prompt.txt` and ran only the submit command; the planner saw the full context chapters, the writer only the packet, mirroring the Qwen harness. The exact agent instructions used are in [claude-pilot/AGENT-PROMPTS.md](../../.local/chapter-summary-studio/claude-pilot/AGENT-PROMPTS.md).

**Production settings (owner, 2026-10-13):** writer prompt `v3`, length gate `v2` (under 200 summary words; under 70 for chapters of 1–5 verses), Claude agents run 8 in parallel.
- Planners take 8 chapters each.
- Writers work in lanes of about 6 chapters each, 8 lanes at a time. Each lane agent reads only its chapters' `write-prompt.txt` files.
- Then a blind review, then a revision run for the flagged chapters, then a re-review.

```bat
rem revision run: same frozen packets, plus each earlier draft and its blind-review findings in the prompt
D:\Python\python.exe -X utf8 scripts\chapter_summary_claude_pilot.py prepare --run-id sample-1-rev --from-run sample-1 --writer-prompt v3 --length-gate v2 --revise --chapters PSA:51,NEH:5

rem import validated drafts (status=draft, with provenance + review verdict) into the SEPARATE Claude database
rem import the revision run first, then the original run: chapters already present are never overwritten
D:\Python\python.exe -X utf8 scripts\chapter_summary_import_pilot.py --run-id sample-1-rev
D:\Python\python.exe -X utf8 scripts\chapter_summary_import_pilot.py --run-id sample-1

rem browse, edit and approve them in the studio (same port 8947; the curated examples stay in the default folder)
D:\Python\python.exe -u -X utf8 scripts\chapter_summary_studio.py --data-dir .local\chapter-summary-studio\claude
```

The import refuses the curated studio folder, checks that the live BSB text still matches the frozen snapshot, re-validates the reader fields, and appends to `claude\imports.jsonl`. Do not press Generate in the studio while it has `--data-dir` set to the Claude folder: Generate is the old single-pass Qwen path.

**Writer-only Qwen comparison on the same packets** (launches local GPU inference immediately; refuses a chapter whose `qwen-writer\` folder exists; uses the run's own writer prompt and length gate):

```bat
D:\Python\python.exe -u -X utf8 scripts\chapter_summary_writer_comparison.py --run-id next-1
```

It takes about 100 seconds per chapter on the RTX 4090 (Psalm 119: 216 s). Running any `ollama` command starts the Ollama server if it is down.

**Blind review and report** (no model calls):

```bat
D:\Python\python.exe -X utf8 initiatives\chapter-summaries\tools\build_blind_review.py --run-id next-1 [--include-round3]
rem   reviewers read only REVIEW-RUBRIC.md and blind-review\<CHAPTER>.txt, and write blind-review\reviews\<CHAPTER>.json
D:\Python\python.exe -X utf8 initiatives\chapter-summaries\tools\score_blind_review.py --run-id next-1
D:\Python\python.exe -X utf8 initiatives\chapter-summaries\tools\build_pilot_report.py dev-1 dev-2 fresh-1 next-1
```

Reviewers must never open `blind-review\KEY-do-not-open-during-review.json`. Record any severity adjudication in [RESULTS](RESULTS.md); never edit a reviewer's file.

## Evidence trial harness (Qwen, end to end)

```bat
D:\Python\python.exe -u -X utf8 scripts\chapter_summary_evidence_trial.py --run-id round-4-starts
```

**This launches inference immediately. It is not a preview command.** Since 2026-10-13 the harness takes `--run-id` (a new folder under `evidence-first-trials\`) instead of `--round`. Its planner returns section starts (`EVIDENCE_MODE = 'section_starts'`, `PLAN_SCHEMA`, `EXTRACT_STARTS`), and the writer's output budget scales with the number of sections. `round-1` to `round-3` already exist and are refused. Do not delete or rename them. Their manifests hold the exact harness source each used. No `round-4` has been run.

The harness checks that the studio is reachable and idle before starting. Keep it idle throughout; there is no shared cross-process lock. The CLI performs eight chapters sequentially and has no UI pause control. If interrupted in its own terminal, already saved stage files remain; the current harness has no partial-round resume feature. An interrupted Ollama request may take time to release resources, so inspect runtime state before launching competing work.

The current source implements the final round's method. Historical source snapshots and prompts are in each round's `manifest.json`. Running `--round 1` with today's file does not reproduce the original round-1 method.

## Verify and rebuild existing reports without inference

```bat
D:\Python\python.exe -X utf8 initiatives\chapter-summaries\tools\verify_trial_artifacts.py
D:\Python\python.exe -X utf8 initiatives\chapter-summaries\tools\build_trial_report.py
```

The verifier checks complete results/reviews for all three rounds, consistent source snapshots, draft existence/status, and the existing artifact hashes, then regenerates verification metrics. Unexpected changes fail rather than silently certifying different artifacts. The report builder rewrites only aggregate `report.json` and `report.html`; it reads the studio state and therefore expects the studio to be reachable. Neither utility calls Ollama or edits a summary database. Both resolve paths relative to their location in this project.

The report was checked in headless Edge at desktop and mobile widths: three round sections, 24 chapter details, and no mobile page overflow. Screenshots are stored next to the report. The old UI/browser-check helpers in workspace `.tmp` are historical conveniences, not required entry points.

## Backups and recovery

`.local/` and `data/` are excluded from Git. Preserve both when moving this work to another machine. Also preserve the Python scripts, their tests, these docs, and the static preview. The trial folders already include exact source snapshots for their eight chapters; they do not replace the full 1,189-chapter corpus.

Before archiving a current database:

1. Confirm both the studio job and any independent trial are idle.
2. Make a timestamped destination under the intended archive directory without replacing existing folders.
3. Use SQLite's backup API for a consistent snapshot. Export the records as JSON if a browsable copy is needed.
4. Explicitly close both SQLite connections before any Windows rename. A transaction context manager alone does not close a connection.
5. Record row counts, file hashes, timestamp, translation, schema, model, and prompt provenance in a manifest; verify the backup before moving/replacing a working file.
6. Keep failures and the prior raw outputs as well as successful drafts.

No restore was performed for this handoff. Prefer opening an archived database read-only or restoring to an isolated test directory. Replacing `summaries-v3.sqlite3` would replace the five curated examples; first preserve the current database and verify the intended source archive and format.

## Troubleshooting

| Symptom | Meaning / next check |
| --- | --- |
| Connection refused at 8947 | Inspect whether the studio is running; start the documented idle server if needed |
| Bind/address-in-use error | A process already owns the port; identify it instead of launching on a new port |
| Ollama request fails | Check 11434 and installed model availability; earlier saved drafts remain |
| Empty `/api/ps` model list | No model is resident at that moment; it does not mean no model is installed |
| Existing round directory error | Overwrite protection; preserve results and use a new experimental run identity |
| Coverage rejection | Model omitted verses or assigned invalid ranges; do not publish a partial chapter |
| Valid citations but inaccurate prose | Known semantic failure; syntax checks and self-review cannot authorize acceptance |
| Context/range validation error after editing | Check source availability and endpoints against the actual supplied passages |
| “Selection already has drafts” | Studio skips saved keys by design; review existing work or use an isolated trial |
| PowerShell launch denied | Use native Command Prompt under current permissions; do not disable protection |

Do not run `D:\FortressOfSolitude\.tmp\resume_chapter_summaries.py` or the old Psalm 119 benchmarking helper merely to inspect status: they can restart/resume generation. Other old helpers archive databases or overwrite pilot records. [FILES](FILES.md) lists these hazards.
