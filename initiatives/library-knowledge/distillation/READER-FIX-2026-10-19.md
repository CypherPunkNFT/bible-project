# Henry/Boyce private reader repair and review route

19 October 2026. The owner's request to do the next few steps extended the prior read-only boundary for the concrete two-copy reader proposal. This delivery changes private reading eligibility; it does not revise or approve a candidate.

The existing reader now includes the exact Henry and Boyce copies, using their recorded source contributor IDs independently of the 52 featured profiles. Original/extraction fingerprints and each source's catalogue metadata are pinned in [the scoped manifest](../../../scripts/local-reader-scope.json). Unknown work/edition IDs remain null. Source names, credits, licence notices and public permission-required states are preserved.

## How to inspect the evidence

For Henry, browser Find can locate “We call this ordinance”; on Boyce page 25, find “What is Justification?”. These phrases identify retained text, without validating its claims.

Open [Candidates](http://127.0.0.1:8931/data_analysis/candidates/), find the named proposal and follow its existing held-text link. The reader opens at page 1; its page numbers describe the local text pagination, not print pages. There is currently no verified exact-page URL or page-jump control.

| Proposal / witness | Existing reader | Selected evidence | Current navigation |
| --- | --- | --- | --- |
| supper / Henry | [The Lord's Supper](http://127.0.0.1:8931/teachers/works/held-3c6ae92f1578f913c09839d2c8604310) | Window 2134297; section 6, index_split_004.html; source offsets 5561–5867 | Page 1 of 3; the selected passage and fuller context are present. |
| justification / Boyce | [Abstract of Systematic Theology](http://127.0.0.1:8931/teachers/works/held-7824047daefbe859f7f5f167719ca85f) | Window 4014056; section 8, abstract_split_006.html; source offsets 12564–13632 | Page 25 of 25; 24 Next actions from the opening page. |
| supper / Hodge control | [Outlines of Theology, held EPUB](http://127.0.0.1:8931/teachers/works/held-86058bf61ffc35119a87b6667e4f835d) | Window 4473820, Chapter 43; separate from the Goold-edited PDF | Page 32 of 34; existing span still present. |
| Ephesians / Fergusson control | [TCP A41197](http://127.0.0.1:8931/teachers/works/held-140823cc0ca835eda48a3dc99d4025ef) | Retained Ephesians 4 opening quote | Existing public fallback, page 25 of 36; exact served bundle still matches. |

Source offsets retain the historical source contract; they are not browser offsets. The [prior dependency inventory](source-dependencies-2026-10-19.json) and [source report](SOURCE-DEPENDENCIES-2026-10-19.md) preserve original evidence and the proposed twelve-record rehearsal. Their pre-repair 404 observations remain dated history.

## What was verified

- Fourteen disposable tests pass: scoped inclusion, original/cache/metadata drift, path/identity guards, preserved shelves, lock contention, changed-index rejection, late publication conflict, exact backup/rollback, idempotence, complete page text, and extraction-bound manifest reuse. No test opened the live corpus or curation store for writing.
- The live API serves all 3 Henry and 25 Boyce pages successfully. Concatenated text equals each retained extraction exactly: 125,994 and 1,171,880 characters. Selected candidate spans and expanded contexts are present, with matching hashes. This validates delivery of retained text, not whole-book source fidelity or theological judgment.
- Only two documents and their two held bindings were added: 18,525 to 18,527. Every old document/binding/profile/contributor entry is unchanged. The profile snapshot timestamp is preserved so the existing joined catalogue remains usable; two live profile shelf queries return 200. No full reader/catalogue build or corpus scan was run.
- Foreign Host, Origin, cross-site and POST requests return 403. Existing public metadata still says permission-required with zero public pages. The middleware, public records, dist build and preview process were unchanged.
- The curation ledger/API remains 21 pending, 273 mappings, sequence 41; all 21 fingerprints/revisions/statuses and the candidate catalogue are unchanged. No proposal dependency adapter or automatic source-quality revalidation is claimed.

**Browser follow-up, 19 October 14:35 UTC:** The direct Henry and Boyce reader routes work in Brave on the same original preview. Henry's selected passage, name, credit and personal-use notice are visible at page 1/3. Boyce's selected passage, name, credit and private-use notice are visible after 24 Next actions at page 25/25; Next is disabled there and no alerts appear. [Browser receipt](reader-fix-2026-10-19/browser-followup.json). Brave still blocks the Candidates route itself with ERR_BLOCKED_BY_CLIENT, so Candidates-to-reader click-through remains open. The exact blocking rule is unidentified. No browser protection, host or port was changed.

## Publication and rollback of the private index

The existing helper now holds one exclusive index-write.lock for ordinary builds and scoped updates. An uncertain lock is never automatically reclaimed. The scoped command requires the inspected current index SHA-256 and compares it again before atomic replacement; it retains an exact hash-named prior index. This protects cooperating helper writers and detects observed changes from other writers, not an uncoordinated writer racing after the final comparison. Both publication and rollback were tested in disposable fixtures. General corpus/SQLite/WAL backup restoration remains unproved.

The original profile/intake snapshot builtAt is unchanged. privateReaderScope records the scope-manifest digest and exact copy IDs. Scoped reader requests recheck original, extraction and per-record attribution/use hashes, including when prepared pages exist. Prepared manifests are bound to original/cache hashes; a reviewed extraction change cannot silently reuse older pages. Future ordinary reader builds merge this same scope, but none was launched here.

Current applied index SHA-256: `95cf06bba70ecdf41ccd97d8d67b4d69d1162bdd532ad1c6439affdcedf25d17`. Exact prior backup: `.local/local-library/index-backups/481c257dd5c608171e48fbc5d6d0070c880cca2210c229c949a7a70403f99a32.json`. Before/after observations, HTTP checks and remaining limits are in [the receipt folder](reader-fix-2026-10-19/closeout.json).

From Website, in cmd.exe with login disabled, a deliberate rollback through the existing helper is:

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 scripts\local_library.py --restore-index 481c257dd5c608171e48fbc5d6d0070c880cca2210c229c949a7a70403f99a32 --expected-index-sha256 95cf06bba70ecdf41ccd97d8d67b4d69d1162bdd532ad1c6439affdcedf25d17
```

This is a reviewable recovery command, **not executed here**. If the current index changed, stop and reconcile it; do not replace the expected hash merely to force rollback. A future ordinary full build includes the configured copies again, so reverting the scoped feature also requires a deliberate manifest/code change. Do not run a full build to roll back these two additions.

## Bounded navigation design — proposed, not implemented

The existing LibraryWorkPage already uses router search parameters for catalogue filtering, but resets every work to page index 0. It supplies Previous/Next below the reading body. The first useful change would be a labelled “Reading page” number control with a Go button beside that existing navigation, plus a shareable one-based page parameter. A page number is a reading position, not a source-validity badge.

Keep ordinary containing-work links valid and opening at page 1. Resolve a requested page only after the exact record and total page count load; accept whole positive numbers within that record, with an explicit helpful message for an unavailable page. Do not silently jump to a different copy or treat public zero-page records as readable. Previous/Next, Go and browser Back/Forward must agree; reset to the requested/default page on work changes and cancel late page fetches. Embedded readers must keep their state local so they do not overwrite a parent page's query string or scroll position. Retain keyboard labels, loading/error feedback, source notices and the local/public retrieval boundary.

A later source-to-position adapter must be separate from that manual control. It should retain original hash, extraction hash (or public record and content-addressed page-bundle digest), reader pagination version, selected source locator/start/end and exact span hash. Resolve the full selected text/context against the actual prepared pages, retaining page ranges for split evidence and refusing ambiguous/missing matches. Reader page numbers must remain distinct from print-page labels, native XML selectors and historical codepoint offsets. Never fall back to a similar passage after a dependency mismatch. A stored page number alone is insufficient evidence: a new extraction, copy choice or pagination rule can move it.

Before new resolved source links affect live proposals, test their dependencies through the compatible generation/fingerprint adapter already required by DIST-04; then use the existing proposal revision machinery under its separate authorization. Do not rewrite the current 21 proposal fingerprints merely to attach convenient page numbers. This plan does not implement that adapter or lift any identity/use gate.

A bounded verification set would cover Henry page 1/3, Boyce 25/25, Hodge 32/34 and Fergusson's public fallback 25/36, plus absent/invalid/oversized page requests, Back/Forward, changed work, embedded use and unavailable public text. Require a real browser check on the original preview and preserved candidate states. No full corpus query, model call, bulk rebuild, new preview or public release is needed for the manual navigation feature; its implementation remains a later scoped task.

## Current runtime and next boundary

Fresh receipts supersede the old optimizing observation. Embedding reports complete at 04:36 UTC; verification at 06:47 UTC reports exact 11,579,535 chunk/vector parity, but enrichment_ready:false and late-source drift. Completion entered needs_attention at 08:41 UTC after build failure; the current log ends with Windows error 32 replacing knowledge.sqlite3. The supervisor reports exhausted in verification_only, no completion/embedding owner observed, 3/3 attempts and console_window:false. The locking process was not identified. No process, scheduler or retry budget was changed. These receipts do not establish final current-source/index readiness.

The next bounded work remains in [TODO](../TODO.md): close the reader interaction check and plan exact-page navigation without changing proposals or source-use decisions. Full semantic rehearsal/pilot, source repair, live candidate revisions/approvals, integration and publication remain separate gates. KR-110/120/140 evaluations and KR-130 retirement remain intact.

**Read-only failure diagnosis follow-up:** The failed operation is knowledge/ingest.py:98, the current-database → previous-database rename before validated staging publication. The saved October13 database remains current. Bounded Restart Manager enumeration timed out; the preview launcher's inspected open files did not include either database, while other relevant process inspections were access-denied. The locking owner remains unproved; this does not establish encoder, Brave or antivirus responsibility. [Diagnostic receipt](reader-fix-2026-10-19/limits-followup.json). Recovery should coordinate readers and use guarded/recoverable publication, followed by the existing completion routine and fresh verification; it should preserve valid saved vectors. No such recovery was executed.
