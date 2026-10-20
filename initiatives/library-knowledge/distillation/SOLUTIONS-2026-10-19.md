# Applied solutions and current completion owner

19 October 2026. This supersedes the earlier blanket browser hold and the proposed-only navigation design. The owner explicitly requested concrete solutions and execution of the next few steps. This delivery fixes private reading/review use and the existing completion path; it does not execute the semantic pilot, candidate decisions or public website publication.

## Use the delivered tools

Open [Data](http://127.0.0.1:8931/data/) and choose **See the strongest candidates for the website →**. The existing Candidates route, six-item batch, search, source evidence and Henry/Boyce links were verified in Brave with unchanged browser protections. Direct automated tab creation had failed; that did not establish a product-wide browser block. No replacement app namespace or alternative preview was retained.

The reader now has labelled Reading page / Go controls above and below the text. A one-based page query can be shared:

| Witness | Direct reading position | Checked behavior |
| --- | --- | --- |
| Henry, supper | [Page 1 of 3](http://127.0.0.1:8931/teachers/works/held-3c6ae92f1578f913c09839d2c8604310) | Existing candidate opens readable text with source credit. |
| Boyce, justification | [Page 25 of 25](http://127.0.0.1:8931/teachers/works/held-7824047daefbe859f7f5f167719ca85f?page=25) | Selected passage is present; no 24-click traversal needed. |
| Hodge, supper | [Page 32 of 34](http://127.0.0.1:8931/teachers/works/held-86058bf61ffc35119a87b6667e4f835d?page=32) | Chapter 43 passage appears directly; no 31-click traversal needed. |
| Fergusson, Ephesians | [Page 25 of 36](http://127.0.0.1:8931/teachers/works/held-140823cc0ca835eda48a3dc99d4025ef?page=25) | Existing public fallback and retained quote still work. |

Previous/Next, Go and browser Back agree. Other query parameters are preserved; page 1 removes the page parameter. Invalid or unavailable page numbers show an explicit message and page 1. Embedded readers keep parent URL/state separate. Late responses cannot overwrite a newly selected work. Phone-width controls were checked at 390 pixels with no horizontal overflow. These are text reading positions, not print-page citations or a new semantic evidence adapter.

Candidates and source slash redirects now retain their query strings. Existing source/candidate IDs, proposal fingerprints, authors, editions, private-use notices and public permission gates are unchanged. The saved candidate links themselves remain containing-work links; the new direct page examples above do not silently revise them.

## Database replacement cause and fix

The completion routine used sqlite3.Connection as a context manager while checking the current build. That context manager ends a transaction but leaves the connection open. The local variable retained the read handle while the same owner launched a late-source refresh in a child. On Windows, that handle prevents renaming the current database. A disposable real SQLite fixture reproduced error 32 before close and a successful rename after close.

[finish_intake.py](../../../knowledge/finish_intake.py) now explicitly closes that read connection before any refresh. [ingest.py](../../../knowledge/ingest.py) retains the existing build lease and adds bounded sharing-violation retries, a unique rollback copy and an identity-bearing publication receipt. It does not overwrite the older previous database before the validated staging file is published. A failed stage publication restores the original; if rollback is also blocked, it retains stage/backup identities and refuses another build over the unresolved recovery state.

Lock-owner diagnostics run in a windowless child with a five-second timeout. An unavailable or stuck Windows Restart Manager cannot hold rollback indefinitely. This is bounded publication/rollback verification, not a claim that general corpus/vector/curation disaster restoration is proved.

## Verification and actual resumption

- 41 existing native-completion, supervisor, encoder-cleanup/recovery and vector-reconciliation regressions pass.
- 12 new publication/connection tests pass; one optional native lock-owner check is explicitly skipped in restricted execution.
- 17 reader component cases pass; application TypeScript checking and the frontend build pass.
- Four private-route/access/deep-link tests pass. All 21 current candidate states/revisions/fingerprints and catalogue bytes remain unchanged: 21 pending, zero other states, sequence 41; no sync/export pending.
- The frontend was rebuilt in the current working dist using the existing portable esbuild approach, emptyOutDir:false and copyPublicDir:false. Prebuild source/catalogue refresh hooks were skipped. The original preview alone was reloaded after exact process/listener identity checks. No release checkout replaced dist and no website deployment ran.

The apparent missing runtime packages were a restricted execution context omitting the owner's Python user-site. Native-user import checks pass with the existing Torch 2.6.0+cu124, Sentence Transformers 5.2.2, NumPy 2.2.6, LanceDB 0.20.0, Lance 0.23.2 and PyArrow 23.0.1. **No packages were installed or changed.** The resident encoder was preserved.

One existing native completion owner was launched at 17:01:32 UTC with refresh enabled and BIBLE_VERIFY_ONLY=1. Its current run is native-20261019T170133-86792; PID values are dated observations, never future control targets. Source preflight passed; a new build started at 17:05:40 UTC and its fresh staging file exceeded 2.18 GB by 17:06:29 UTC. Archive validation produced a fresh receipt at 17:02:22 UTC. The new owner has a matching creation/cwd/module identity, and the supervisor observes it with console_window:false. Supervisor control and retry-ledger bytes remain unchanged at 3/3. No second encoder, scheduler change, budget reset, graph or mining stage was started.

**Final current-source publication and parity are not yet complete.** The last successful snapshot verification still describes the October13 corpus with 11,579,535 matching chunks/vectors and enrichment_ready:false. The new owner must finish rebuilding, reuse valid saved vectors, reconcile changed/missing IDs and produce fresh final receipts. Do not treat old progress counters or this launch receipt as new index readiness. Do not start a competing owner while this run is active.

## Evidence and next boundary

[Before state](solutions-2026-10-19/before.json), [current owner receipt](solutions-2026-10-19/recovery-owner.json), [route/UI verification](../../../.local/data-desk-checks/route-compatibility/verification.json) and [working backlog](../TODO.md) retain the measured scope and limits. Browser proof is saved at .local/data-desk-checks/solutions-20261019/candidates.jpg, boyce-page-25.jpg and reader-mobile.jpg.

Source review can proceed privately by verified passage. Whole-book transcription quality, exact print exemplars, source independence/contrary evidence and public-use clearance remain scoped review tasks, with original texts and notices preserved. The compatible generation/dependency adapter and same-scope lexical/current-hybrid comparison still precede semantic candidate enrichment. No current candidate was approved, revised or integrated by this delivery.
