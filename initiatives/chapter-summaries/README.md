# Chapter summaries and local Qwen trials

This is the documentation entry point for the Bible Project's chapter-summary work. The implementation lives inside the existing Bible website, not in a separate repository.

**Project root:** `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website`

**Documentation:** `Website\initiatives\chapter-summaries\`

**Generated work and databases:** `Website\.local\chapter-summary-studio\`

**Latest state (verified 2026-10-13, 22:10):**
- **All 1,189 chapters are drafted.** Claude agents ran 8 in parallel, with summaries under 200 words (mean 161).
- 1,041 of the 1,141 full-run chapters had no material issue on their first blind review. The other 100 were revised from the findings, and each revision passed a fresh blind re-review. Two needed a second revision. [Results](RESULTS.md#full-run-the-whole-bible-2026-10-13-current).
- Every draft is in the separate Claude database. The studio on http://localhost:8947 runs on it (`--data-dir .local/chapter-summary-studio/claude`), so the owner can read and approve there.
- How it was done, and how to repeat it: [HANDOFF](HANDOFF.md#how-the-full-run-was-done-to-repeat-or-extend-it).
- Nothing is approved or published. The main site does not show these drafts.

## Start here

| Document | Contents |
| --- | --- |
| [HANDOFF](HANDOFF.md) | Current state, user decisions, unresolved problems, and next-session instructions |
| [ARCHITECTURE](ARCHITECTURE.md) | Components, output schema, source handling, runtime settings, API, and limits |
| [RUNBOOK](RUNBOOK.md) | Open the UI, run offline checks, preserve data, inspect trials, and troubleshoot |
| [RESULTS](RESULTS.md) | Claude pilot (current), the Qwen evidence-first rounds, the earlier studio campaign, quality findings |
| [REVIEW-RUBRIC](REVIEW-RUBRIC.md) | The categories, severity rule and criteria every pilot draft was judged by |
| [FILES](FILES.md) | Source files, databases, pilot and trial artifacts, archive locations, temporary-helper cautions |
| [Pilot report](../../.local/chapter-summary-studio/claude-pilot/REPORT.md) | Every pilot draft side by side with its review verdict and quoted issues |
| [SOURCES](SOURCES.md) | Scripture provenance and the interpretation-method references used in design |

## Purpose and agreed presentation

Provide a faithful introduction beneath a selected Bible chapter, followed by an invitation to read it. The intended corpus is the 66-book, 1,189-chapter Bible using local BSB text. The workbench also offers KJV and WEB source selection; these trials used BSB only.

The agreed reader structure is a title, optional sourced context, readable summary paragraph, expandable outline with verse ranges, and a concrete observation invitation plus a Read chapter link. The structure was agreed after a Romans 1 example. Do not redesign it merely because generation quality failed.

The Python studio includes 66 abbreviated book squares above the chapter squares, source text, editable draft fields, local save/approval/export controls, progress, and an ETA during active studio jobs.

## What is available now

- [Pilot report, browser version](../../.local/chapter-summary-studio/claude-pilot/report.html): every Claude and Qwen draft with its critique, revised chapters showing both versions. Rebuild with `tools/build_pilot_html.py`.
- [Pilot report](../../.local/chapter-summary-studio/claude-pilot/REPORT.md) (2026-10-13): 24 Claude drafts (three runs) and 16 Qwen same-packet drafts, with blind-review verdicts and quoted issues. Open it as a local file; nothing in it is approved.
- [Python studio](http://localhost:8947) (start it first; see RUNBOOK): five manually corrected but **unapproved** examples: Romans 1, Genesis 4–5, Psalm 117, Jonah 4.
- [Static interface preview](../../design/chapter-summary-studio/index.html): illustrative interface; opening it performs no inference.
- [Qwen rounds 1–3 report](../../.local/chapter-summary-studio/evidence-first-trials/report.html): all 24 attempted chapter trials and Codex's editorial critiques.
- [Main Bible preview](http://localhost:8931/study/structure#chapters): existing website. The experimental outputs have not been integrated into or published through the main site.
- Preserved earlier work: 584 original paragraph drafts, eight earlier structured drafts, initial v3 pilots, and later trial artifacts.

Earlier, Qwen's evidence-first round 3 produced six drafts. One had no material issue in Codex's inspection, five needed revision and two chapters were blocked by coverage. The 2026-10-13 pilot fixed coverage in code and compared writers on identical inputs. It is still an experimental pipeline, not an autonomous summarizer. [Detailed results](RESULTS.md).

## Quick offline check

From the project root in Windows Command Prompt:

```bat
D:\Python\python.exe -m unittest discover -s scripts/tests -p test_chapter_summary*.py
```

The latest run passed 57 tests (2026-10-13). These exercise code contracts, not theological or factual correctness. See [RUNBOOK](RUNBOOK.md) before launching the server or another model trial.

## Preservation and scope

The root repository contains substantial unrelated unpublished work. Preserve it. `.local/` and `data/` are ignored by Git, so a Git checkout alone does not restore the generated records or Scripture corpus. Documentation and code are saved locally; no commit, remote backup, or deployment is claimed by this handoff.

Additional analysis pipelines remain a future discussion. Existing catalog/engine prototype files are not integrated into the running studio and should not be treated as approved deliverables. The coverage fix and the controlled comparison were done on 2026-10-13 (Claude pilot). No fourth Qwen evidence round has been run.
