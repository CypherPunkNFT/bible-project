# Data analysis and candidate curation: chat handoff

**Merge completed:** This Part A is paired with [Part B embedding and distillation](EMBEDDING-DISTILLATION-HANDOFF.md). Use [the complete new-chat prompt](PROMPT-MERGED-NEW-CHAT.txt); the original [Part A](PROMPT-MERGE-PART-A.txt) and [Part B](PROMPT-MERGE-PART-B.txt) prompts remain for traceability. Part B supplies dated live completion/watchdog observations and qualifies the remaining source-generation/dependency adapter work. Preserve this implementation history and re-read current state rather than applying either snapshot as a reset.

Saved 18 October 2026, America/New_York. This is the implementation half of a two-chat handoff. The [initiative README](README.md) is the organizing entry, [TODO](TODO.md) is the only execution backlog, and [HANDOFF](HANDOFF.md) retains the operating protocol and dated history. This document records current delivered behavior and its limits; it does not start another stage. Combine [prompt Part A](PROMPT-MERGE-PART-A.txt) with the other chat's prompt before continuing.

## Owner direction and authority

The owner rejected the earlier emphasis on processing counts and small test summaries as evidence of useful website content. They want source-backed material, clear visitor benefit, concise executive presentation, visible examples and an ongoing way to select useful findings. They also required a slower source-quality reset: authors first, then distinct works/editions, usable text and reader verification, followed by transparent prioritization and sourced work summaries. A large index, a matching source hash or complete vector coverage does not certify good text or interpretation.

KR-130 argument extraction was explicitly rejected and deleted. [KR130-RETIRED.md](KR130-RETIRED.md) overrides every older instruction to resume, remediate or consume it. Preserve its original sources and the retained KR-110/120/140 data. Do not recreate it from an old roadmap.

The other chat has already added a [corpus distillation master plan](CORPUS-DISTILLATION-MASTER-PLAN.md), [expanded pilot protocol](distillation/PILOT-PROTOCOL.md) and [planning baseline](distillation/baseline-2026-10-18.json). Its DIST-00–07 tasks are in the same TODO. Those are planning/pilot inputs, not changes implemented by this chat. Its prompt and source-owner receipts must supply current corpus/vector reconciliation status. This chat did not recheck vector parity, repair sources or run that pilot.

## Where to read and browse

Project root: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject`. Paths below are relative to that root unless prefixed Website/.

| Purpose | Location |
| --- | --- |
| Organizing README, single TODO, protocol/history | `Website/initiatives/library-knowledge/` |
| Detailed Data desk operation, API, tests and limits | [Website/analysis-desk/README.md](../../analysis-desk/README.md) |
| Data hub | http://127.0.0.1:8931/data/ |
| Existing Data intake | http://127.0.0.1:8931/data_intake/ |
| Analysis overview | http://127.0.0.1:8931/data_analysis/ |
| Concepts and questions | http://127.0.0.1:8931/data_analysis/kr110/ |
| Passage connections | http://127.0.0.1:8931/data_analysis/kr120/ |
| History and language aids | http://127.0.0.1:8931/data_analysis/kr140/ |
| Candidate review/mining queue | http://127.0.0.1:8931/data_analysis/candidates/ |

These Data analysis pages are local/private. Nothing from this work was deployed. They are standalone HTML/CSS/JS served by the original preview middleware, outside public/ and dist/. Preserve the existing Bible `/data/catalog.json` namespace and the original intake implementation.

## Delivered data access and actual measured quality

The first desk exposed saved tests without adequate access to the populations. That shortfall was corrected. The desks now distinguish stored output, possible uses, historical quality evidence and limitations. Full-population browsing is read-only, with 20-row keyset pages; stored identity order is not relevance ranking. Evidence panels expose retained text, context, locators, source hashes, credits and cautions. Recorded author metadata does not establish who speaks in a sentence.

| Track | Retained population and useful access | Historical quality evidence and limits |
| --- | --- | --- |
| KR-110 | 100,889 supported documents/XML entries; 7,920,214 windows; 12,456,231 concept occurrences; 9,531,563 reference occurrences. Search by words/concept, recorded author, title, exact work ID and language; optionally restrict to native/recorded sections. | 48 reserved questions: useful evidence 25 versus 23 baseline; 3 improved, 1 regressed; precision at five 34.17% versus 38.75%; 13 capability deferrals. Model-assisted implementation-agent review, no independent human review. Retrieval acceptance failed. Semantic coverage zero. |
| KR-120 | 1,556,380 distinct wording-pair candidates; 8,795,488 joint shared-reference pair candidates. Separate wording, joint-reference and base-reference streams; source-window finder, indexed neighbors in both directions and both passages in pair detail. Streams overlap. | Known reference recovery 9/16 versus 2/16 baseline. Stratified content review: 3/24 wording pairs and 11/24 reference pairs useful. Same implementation-agent reviewer; these are not population precision estimates or proof of influence. Semantic neighbors absent from these retained streams. |
| KR-140 | 633,490 language records: 615,512 ORACC glosses, 17,977 lexicon records, 1 explicit translation group. Historical browser: 128 claim annotations, 128 source bindings, 19 title mentions; 648 date fields, including 448 unknown. | Reserved historical source-location positives 33/33 versus 7/33 baseline; lexicon positives 39/39 versus 21/39. Deterministic source-annotation oracle, then 9 convenience content cases reviewed by the implementation agent: 8 useful, 1 limited. Location success is not historical truth or translation accuracy. 47,747 numeric/placeholding guidewords lack standalone meanings. |

The small saved review projections remain available: KR-110 55 records (48 questions plus 7 constrained queries), KR-120 48 pairs, KR-140 926 rows (275 historical annotations, 648 dates, 3 language examples). Those counts are not the retained populations. No new quality evaluation was performed by the desk or curation work. Exposed reserved questions must not become a fresh tuning set.

KR-140 text search has no retained FTS index: it scans bounded portions and reports continuation, even if the current portion has zero matches. Never treat such a partial result as a corpus-wide absence. KR-110/120 use existing indexes. Native/recorded KR-110 windows number 3,248,544; the other windows include 3,776,400 unreviewed heading candidates and 895,270 fallbacks. None of this is a whole-library text-quality certificate.

Pinned runs: KR-110 `kr110-54f0bfca9b30da6cc49b2347`; KR-120 `kr120-66a741ba22a7025744d3b98d`, joint `kr120-joint-cd46d0e4e3023ae1fcf41938`, release `kr120-release-79570e88c09eb13201a515ae`; KR-140 `kr140-3092a59f7c3f691bb7cdf4f9`. Foundations: KR-101 `kr101-31239794030518bcb2299a31`, KR-102 `kr102-1b03f58bf6e6749f9170bf38`, bound corpus `2026-10-13T23:47:33.488164+00:00`. These are historical selected generations, not proof of parity with the newest corpus or vectors.

Result/operator records: [CONCEPTS-RESULT.md](../../knowledge/library_analytics/CONCEPTS-RESULT.md), [CONCEPTS.md](../../knowledge/library_analytics/CONCEPTS.md), [RELATIONSHIPS-RESULT.md](../../knowledge/library_analytics/RELATIONSHIPS-RESULT.md), [RELATIONSHIPS.md](../../knowledge/library_analytics/RELATIONSHIPS.md), [history/language operator README](../../knowledge/library_analytics/history_language/README.md). KR-140's detailed result and coordinator reconciliation are under `KnowledgeBase/library-knowledge/connected-research/history-language/`.

## Candidate selection and the mining/review loop

The seed contains 21 editorial candidates across six uses; seven have an editorial Start here recommendation. Screening covered 43 saved positive KR cases and the existing six LK-202 Ephesians packages. Twenty-one positive cases feed 20 candidates, and the complete Ephesians guide is the additional candidate. All 22 unselected positives have explicit hold reasons. Millions of raw matches were not screened for publication.

Each prepared candidate has an attributed draft finding, visitor benefit, proposed placement, source witnesses/context/credits, limitations and next checks. Examples include the full Ephesians source guide, Waldron/Bavinck on Ephesians 4, Hodge/Henry on the Lord's Supper, Miller/Spurgeon on grief, Gill/Boyce on justification, Piper's named Whitefield quotation, and Godolphin/Pink on judging motives. These are proposals, without owner approval or measured website benefit. Merneptah was held because the site already has richer treatment; translation meaning and inherited Tel Dan claim wording retain their review limits.

The Ephesians guide exposes all 235 retained connections across six chapters: 180 located samples, 54 structural candidates and 1 quarantined numbering conflict at 1:6. Of 155 verse IDs, 154 have on-site located samples; 40 Fergusson transcription gaps remain. Calvin witnesses include private material. Location work is not doctrinal/editorial/publication approval. The LK-202 packages use their own historical generation, not the KR corpus generation.

The continuing workflow is:

1. Browse six prepared items in **To review**, inspect their evidence and record a note/placement.
2. **Approve for integration**, **Needs work** or **Pass** persists the decision, moves the item out of that active batch and fills from the remaining prepared pool. History and sources stay available.
3. Approval creates a work order and exact source marks. It does not implement website content or clear outstanding source/public-use checks.
4. After actual site work, separately record **Integrated** with a site path and completion evidence. No automatic integrator or publisher exists.
5. Nominate exact records from the KR desks, or run **Mine the next source batch** using a narrow KR-110/KR-140 query and an intended website use. A request adds at most four unreviewed drafts and saves its bounded query cursor. KR-120 pairs/history annotations can be nominated from their panels.
6. Prepare each discovery with a title, source-backed finding, reader benefit and placement. Only then does it enter To review. Raw matches do not silently become polished candidates or approvals. Editing a proposal returns it to review.

Saved-review and full-population source panels show mapped states and candidate links; unmapped records offer Add to discovery. Marks identify the exact run/record/window/pair/language fact/LK connection, with text hashes where available. A book association means it contains a selected passage, not approval of that book. Frozen reports/evaluations remain unchanged; the live source-review Markdown is a linked curation overlay.

## Current durable state and ownership

Read-only check at **2026-10-19 03:05:08 UTC / 18 October 23:05 EDT** returned all seven page routes and both state/marks APIs with HTTP 200. Live ledger: **21 pending, 0 approved, 0 integrated, 0 discovered, 0 needs_work, 0 rejected, 0 stale**; sequence 41, no pending sync/export. There are **273 source-reference mappings**, not 273 independent findings. Re-read state on resume: future owner decisions override this dated snapshot.

Snapshot receipt: `Website/.local/data-desk-checks/curation-queue/handoff-snapshot-20261018.json`; reproducible read-only capture: `.local/capture_data_merge_handoff.py`. No decision or discovery was written during this handoff.

| Owner/component | Paths |
| --- | --- |
| Local presentation | `Website/analysis-desk/{hub,index,view,candidates}.html`, `desk.*`, `population.js`, `candidates.*`, `queue.js`, `review.js` |
| Fixed local routes | `Website/scripts/data-analysis-vite.ts`, registered in `Website/vite.config.ts` |
| Read-only population helper | `Website/scripts/analysis-population.py` |
| Saved review and seed builders | `Website/scripts/build-analysis-desk.py`, `build-website-candidates.py`; editorial input `Website/analysis-desk/candidates.editorial.json` |
| Rebuildable private projections | `Website/.local/data-analysis/`, including `website-candidates.json` |
| Curation writer | `Website/knowledge/library_analytics/candidate_review.py` |
| Authoritative owner decisions | `KnowledgeBase/library-knowledge/connected-research/curation/curation.sqlite3` and active SQLite WAL |
| Curation exports | Same curation root: `source-marks.json`, `SOURCE-REVIEW.md`, `integration-queue.json`, `curation-state.json`, immutable `releases/`, `latest-curation.json` |
| Shared lease/jobs | `KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3`, plus the curation store's JobStore lease |
| Retained analysis stores | `KnowledgeBase/library-knowledge/connected-research/{concepts,relationships,history-language}/` |

Keep one writer per store. The existing shared analytics lease and dedicated curation lease reject a live/inaccessible owner. Curation records immutable proposal revisions, exact source references, append-only events, request identities/responses and discovery cursors. Decision/history/cursor/checkpoint commit in one FULL-synchronous WAL transaction. Request-ID replay is idempotent; reused IDs with different payloads and stale revision/fingerprint writes are rejected. Unchanged sync preserves decisions; changed evidence/editorial inputs require renewed review and retain old approvals in history. Read-time marks flag changed inputs even before sync. This is curation proposal invalidation, not proof of general cross-generation analytical refresh.

Exports have content-addressed versions and checksums; the latest pointer changes last. The database remains authoritative. Export failure after commit is reported as committed and repairable by sync. A closed or timed-out request may have committed: refresh state before retrying. Versioned JSON exports are not a consistent dependency-closed database backup. Production process-kill recovery, cross-generation analytical migration and backup restoration are not proved by these curation tests.

## Operation and verification

Use `C:\Windows\System32\cmd.exe` with `login:false`, direct Python/Node, and cwd `...\BibleProject\Website`. No PowerShell wrappers or antivirus exceptions. No new endpoint: use only the original 8931 preview. Do not copy a different build over dist/, reset source, stop running owners or reuse an old PID. Middleware edits require a restart of the exact verified preview process; static/projection files do not require a site deployment.

`GET /data_analysis/api/review` reads state; `?view=marks` reads source mappings; `?view=history&id=...` reads events. `POST /data_analysis/api/review` accepts only sync/decide/prepare/nominate/discover, through loopback/host plus exact Origin/JSON guards. Other analysis routes are GET/HEAD only. No arbitrary root/path overrides are accepted by HTTP. Source and integration exports: `/data_analysis/api/source-review.md`, `/data_analysis/api/integration-queue.json`. Other bounded query APIs and guards are described in the operational README.

Existing commands, when needed for a concrete change (not automatic startup steps):

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 scripts\build-analysis-desk.py
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 scripts\build-website-candidates.py
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m unittest knowledge.tests.test_candidate_review -v
```

The builders project saved results; they do not rerun analytics or quality evaluation. Keep the seed projection separate from live decisions; never delete approved items from the seed or reset the live ledger to 21 pending. The curation CLI accepts a single JSON request on stdin: `python -m knowledge.library_analytics.candidate_review < request.json`. Exact revision/fingerprint and a unique requestId are required for owner decisions. CLI root/shared overrides are for disposable tests only. Never generate sample approvals in the live store.

Previously passed verification, retained on disk:

- Ten focused curation tests: initial mappings/no approvals, decision replay/CAS, unchanged sync and export checksums, changed-input invalidation, rollback/replay, live-lease refusal, integration receipt requirements, nomination/preparation, actual Hodge Sabbath discovery with cursor, and committed-decision survival through export failure. This handoff changed documentation only and did not rerun these tests.
- Real-backend isolated browser tests: approve/refill/persistence, pass/needs-work, separate integration receipt, source marking, cross-tab updates, desk nomination, four real-source discoveries/preparation, and 1024/390/320px light/dark layouts; no JavaScript errors. Fixtures never entered the live store.
- Actual API guards/idempotent sync, original intake and Bible data routes; live population smoke checks for all three desks. Receipts/screenshots: `Website/.local/data-desk-checks/curation-queue/{checks,source-sync,http-checks,live-smoke}.json` and adjacent PNGs. Scripts: `.local/check-curation-queue.mjs`, `check-curation-source-sync.mjs`, `check_curation_http.py`, `smoke-curation-live.mjs`.
- Source/manifest verification and byte/mtime-idempotent seed output: `.local/data-desk-checks/website-candidates/`. Thirty-three source bodies and 34 input fingerprints were checked. Its older static-page browser test expected 21 simultaneously displayed cards; use the newer queue suite for six-item active batches.
- Actual located query exports, bounded scan continuation, read-only SQLite enforcement and responsive population browsing: `.local/data-desk-checks/population-review/`, including `query-verification.json` and `located-query-exports.json`. Saved projection counts/source hashes/idempotence: `.local/check_analysis_projection.py`.

## Remaining work and how the chats should merge

The sole backlog is TODO. Current outstanding items are owner review of the 21 proposals; text/author/work/edition/reader readiness; preparation of additional source discoveries; actual integration and reader-task measurement for selected material; and the other chat's scoped DIST work. No site-wide benefit, general translation, accurate automatic attribution, specialist historical review or exhaustive candidate mining has been established. General semantic work must name the selected vectors/model/build and coverage rather than treating the current desk as semantic.

The bounded 16 October readiness audit is in `Website/.local/library/readiness-review-20261016/`: 6,198 held library PDFs versus 4,737 in the old audit, leaving 1,461 outside that audit. Hodge's 548-page Outlines PDF has an existing text layer, extracted blocks and separate TXT/EPUB witnesses; “PDF page” is a source locator, not proof of missing OCR. Eleven zero-text pages were not visually certified as blank or missing. This was not a complete library audit. The other chat may have newer source-owner evidence; reconcile it before using these dated figures as current.

Originals remain under `sources/library/` and the other existing source collections; extracted text under `KnowledgeBase/extracted-library/`; corpus `KnowledgeBase/knowledge.sqlite3`; vectors `KnowledgeBase/vectors/passages.lance`; work/edition/asset catalogues under `Website/content/library/catalog/`; local reader under `Website/.local/local-library/`. The curated 82-author file is not a complete holdings inventory. No verified all-library author → work → edition → original → usable text → reader crosswalk was delivered by this chat.

In the new chat, read both prompt halves, root/Website/applicable AGENTS, the initiative README, this snapshot, TODO/HANDOFF, the operational README and the other chat's handoff/plan/receipts. Inspect the current working tree and live owner/state receipts before writes. Reconcile overlapping changes and ownership; do not overwrite the other chat's files or infer that dated owners/PIDs are still live. Preserve current decisions and immutable historical quality evidence. Record one combined current status and select the next task from the merged user instruction and relevant prerequisites. Do not automatically launch a DIST pilot, a KR stage, intake/embedding, an encoder, graph/public writer, scheduler or deployment from this handoff. The full KR-090/KR-110–170 and LK backlog remains retained, with KR-130 retirement overriding old dependencies. Off-device protection/restore and any claimed cross-generation proof require inspection of actual receipts, including those supplied by the other chat.
