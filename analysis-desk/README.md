# Local Data desk

## Reading-review companion · 20 October 2026

Owner correction: the reading room now defaults to dark mode across the overview, six-chapter guide and all proposal views. The accessible header toggle stores an explicit light/dark choice in `bibleproject-reading-theme`. Dark surfaces cover source cards, Bible disclosures, notes, search and navigation. This is served directly from the existing assets; refresh the page to apply.

`/data_analysis/reading/` presents all 21 page outlines; `/data_analysis/reading/ephesians/` is the complete six-chapter guide. `?proposal=<existing-id>` opens an individual outline. Data and Candidates link to both. These are local editorial drafts and perform no curation writes. The existing approval/history pipeline is unchanged.

Authored content is `analysis-desk/reading-content.json`; `node scripts/prepare-reading-review.mjs` validates exact candidate IDs, all 155 verses, related IDs and selected source destinations, then writes only `.local/data-analysis/reading-review.json`. It merges the pinned 19 October audit/context/reader receipts and the captured local KJV chapters; its input hashes are included. It is a presentation builder, not the missing general dependency adapter, and does not automatically revalidate new source generations. Re-run it after an intentional draft change. Do not export the private projection to `public/` or `dist/`.

Assets are served directly by the existing local middleware with the same loopback/origin/method restrictions. No app build is required for content/CSS/JS changes; refresh the browser. Middleware changes require the identity-checked existing 8931 preview to reload. Preserve its original windowless launcher and other owners. Checks: `node --test scripts/tests/data-analysis-routes.test.mjs`, `node --check analysis-desk/reading.js`; browser receipt and screenshot are in `initiatives/library-knowledge/distillation/reading-review-2026-10-20/`. The original direct-tab automation navigation can be blocked by the client; the observed Data → guide navigation works without changing protections.


Organizing home: [initiative README](../initiatives/library-knowledge/README.md), [single TODO](../initiatives/library-knowledge/TODO.md), [HANDOFF protocol/history](../initiatives/library-knowledge/HANDOFF.md). For the current two-chat merge, use [Data analysis implementation handoff](../initiatives/library-knowledge/DATA-ANALYSIS-HANDOFF.md) and [prompt Part A](../initiatives/library-knowledge/PROMPT-MERGE-PART-A.txt) alongside the other chat's prompt. This file is the operational guide, not a second task ledger. Latest read-only snapshot: 21 pending, zero approvals/integrations, 273 source mappings; re-read live state on resume and preserve later decisions.

## Planned corpus distillation and candidate enrichment

The owner's 18 October planning request is captured in the [master plan](../initiatives/library-knowledge/CORPUS-DISTILLATION-MASTER-PLAN.md), [expanded pilot protocol](../initiatives/library-knowledge/distillation/PILOT-PROTOCOL.md) and single [initiative backlog](../initiatives/library-knowledge/TODO.md). The plan starts with source quality and six stronger dossiers drawn from the existing 21 candidates, then tests semantic enrichment against current lexical and hybrid retrieval. It preserves this desk's curation ledger and requires an explicit adapter for the new corpus generations and quality dependencies. Planning baseline capture did not change the live queue, analytical stores, public site or pipeline. KR-130 remains retired.

Open `http://127.0.0.1:8931/data/`: Data intake and Data analysis. Analysis has KR-110, KR-120 and KR-140 desks. KR-130 remains deleted. Local only; no deployment or source-processing stage is implied.

The overview separates **stored output**, **what it can help you inspect**, **small quality tests**, and **known shortfalls**. The old sample-only browsing was incomplete. Large output counts are not claims of useful or verified interpretation. Recommendations are editorial conclusions based on the retained implementation-agent reviews, with no independent human review.

## Opening the owner queue

Open `http://127.0.0.1:8931/data/` and choose **See the strongest candidates for the website →**. This visible browser path successfully opens the original `/data_analysis/candidates/` app with all 21 pending items, six prepared items per batch, source disclosures and working Henry/Boyce reader links. No browser protection, application namespace, host or port change is needed.

Direct automated tab creation reports `ERR_BLOCKED_BY_CLIENT` for both the original route and an experimental neutral route. That is an unresolved direct-automation path failure; the visible links work under the unchanged browser settings. Do not describe the working app as blocked or infer a generic analytics filter. The unnecessary namespace experiment was reverted.

Trailing-slash redirects now preserve query strings, including candidate and source deep links. `node --test scripts/tests/data-analysis-routes.test.mjs` checks fixed private routes, query preservation, local access controls and unknown/path rejection in disposable fixtures. No live curation writes are used by this check. Live UI/GET evidence is under `.local/data-desk-checks/route-compatibility/`.

## Browse the retained populations

`scripts/analysis-population.py` reads JSON on stdin and returns JSON. `scripts/data-analysis-vite.ts` exposes it at `/data_analysis/api/population` through the existing loopback/same-origin GET/HEAD guard. It uses the existing Python executable, no shell, no new server or analytical worker. Queries open the existing SQLite stores with `mode=ro` and `query_only=ON`; they cannot write facts, checkpoints or releases. Source processors and their query-identity files were not modified.

| Desk | Actual data access |
| --- | --- |
| KR-110 | All 7,920,214 indexed windows; exact-word AND search over the selected FTS5 table; concept rule, author-label substring, work-title substring, exact work ID and language filters; optional native/recorded sections only; source text, surrounding segment context, coordinates, credits/cautions, all stored concept/reference occurrences for a selected window |
| KR-120 | Paged distinct endpoint pairs from wording evidence, joint shared-reference combinations, and base reference evidence; indexed connections from either endpoint; native/recorded source-window text search; both source passages and matching witness evidence. Base reference leads may share only one reference; channels overlap and are not additive. |
| KR-140 | All 633,490 language records with original/English witnesses, numbering, locators and credits; collection/language/source filters and text scan; all 128 claim annotations, 128 source bindings, 19 title mentions and 648 date fields in the separate historical browser |

Pages contain 20 records and use keyset cursors, not growing OFFSETs or a million-row browser download. Order is stored identity, **not relevance**. KR-110 author filters concern recorded metadata, not sentence-level speaker or endorsement. Whole supported documents include reference entries; they are not all distinct books. Window boundaries and source quality remain those of the historical analysis.

Language records have no existing full-text index. Text search reads bounded portions for roughly seven seconds and returns a continuation when unfinished, including when that portion has no matches. The UI explicitly says the search continues; use Next page, or narrow the collection/source. A partial search is never labelled exhaustive. No new indexing job is hidden behind the UI. Ordinary indexed reads measured approximately 0.1–0.7 seconds in the final query check; cold storage and larger source reconstruction can be slower. These are browsing timings, not quality improvements.

At most one read request runs through the local plugin at once. SQLite progress budgets and a 20-second child timeout bound work; a simultaneous request receives a retryable 429. Parameters are allowlisted, SQL values parameterized, and private paths stripped. No arbitrary database/path parameter exists. Private bodies remain outside public/ and dist/.

The browser pins historical generations `kr110-54f0bfca9b30da6cc49b2347`, `kr120-66a741ba22a7025744d3b98d`, joint `kr120-joint-cd46d0e4e3023ae1fcf41938`, and `kr140-3092a59f7c3f691bb7cdf4f9`. It refuses silently changed selected population summaries. It does not refresh these to current holdings. KR-110/120 selected source windows are reconstructed and their hashes checked when opened. KR-140 checks saved witness text hashes; this is not a fresh whole-original audit. Stored reviews do not transfer to other population records.

Exports download the selected full record or the current population page, explicitly labelled. The saved-review browser also retains its filtered CSV and evidence JSON exports. Original bulk exports and result reports stay in their established private release locations.

## Saved quality evidence

The separate quality section retains all 48 reserved KR-110 questions with both frozen output modes, seven constrained query examples, all 48 reviewed KR-120 pairs and three saved KR-140 language queries. Before/after figures are those historical tests, not counts of output. KR-110 failed its retrieval gate. KR-120 remains candidate-only. KR-140 source-location success does not establish historical truth or translation accuracy; the nine-case content review is a convenience sample.

`scripts/build-analysis-desk.py` remains the byte-idempotent generator for these saved projections and historical annotations, under `.local/data-analysis/`. Regenerate from Website in cmd.exe, login disabled:

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 scripts\build-analysis-desk.py
```

This projection rebuild does not run mining, retrieval evaluation or models. It does not export the full databases as reviewed data. To update service code, restart only the original preview by verified process identity; never replace dist/ with another checkout or start another preview endpoint.

## Verification

- `.local/check-population-desk.mjs`: real browser paging beyond saved examples, source evidence/exports, full-store filters, all three relationship streams, source finder, retained quality failures/modes, historical categories, 1440/1024/390/320px layouts in both themes and JavaScript errors.
- `.local/verify_population_queries.py`: actual located Hodge/title, concept, language, ORACC/lexicon and neighbor queries; unfinished-search continuation; write rejection on all three read-only stores; unchanged database size/mtime; loopback/origin/method/parameter guards; original intake and Bible data routes.
- `.local/check_analysis_projection.py`: retained saved counts/reviews, excerpt hashes, private-path stripping and repeat generation equivalence.
- JavaScript syntax checks and scoped TypeScript middleware check.

Receipts, reproducible selected-record exports and screenshots are under `.local/data-desk-checks/population-review/`. Earlier executive-review receipts describe the prior presentation and remain historical. This work makes the retained data inspectable; it does not repair OCR, attribution, boilerplate, semantic coverage or failed analytical acceptance.


## Website inclusion shortlist · 18 October 2026

`/data_analysis/candidates/` is the owner's editorial decision page, linked from the Data hub, Analysis overview and all three analysis desks. It is local, private and separate from the analytical release/quality gates. The page contains actual saved evidence and draft source-attributed content, not generated public answers or a new population run.

There are 21 candidates across Bible reading, practical reading, author comparisons, quotation trails, people/history and language aids; seven are editorial first priorities. The finite screening pool is all 43 saved positive KR-110/120/140 cases, plus the existing LK-202 book packages. Twenty-one positive cases feed 20 candidates (Hebrew/Aramaic lexicon cases are grouped), and one additional candidate presents the complete Ephesians package. All 22 unselected positives have explicit reasons. Millions of unreviewed records were not screened or declared unworthy; the shortlist does not claim exhaustive discovery. The page's recommendation is to verify held text and source identities, finish one complete Ephesians guide, measure its actual reading benefit, then reuse what passes. No following implementation stage was started.

`analysis-desk/candidates.editorial.json` contains the editorial judgments, draft findings, proposed placement, benefit, limits and required next work. `scripts/build-website-candidates.py` binds them to the exact retained review records, selected window IDs, source excerpts and full context. It also reads the hash-pinned six Ephesians objects, including all 235 retained connections with their distinct 180 located / 54 structural / 1 conflict states. It refuses changed KR generation IDs. All read inputs and the builder are fingerprinted; atomic output under `.local/data-analysis/website-candidates.json` is byte- and mtime-idempotent on unchanged inputs. No analytical store is opened for writing, no jobs or models run, and no public exporter is invoked.

Rebuild after a deliberate editorial change, from Website in cmd.exe with login disabled:

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 scripts\build-website-candidates.py
```

The original 8931 preview plugin serves only the explicit HTML/CSS/JS and private JSON routes under the existing local access guard. New candidate content is not placed in public/ or dist/. Saved source hashes validate the retained excerpts, not every current original. Reading routes retain their historical containing-work semantics; the page identifies current destination/edition checks as remaining work. Draft summaries are implementation-agent editorial work with no independent human or publication review. The original reserved evaluation labels, failed gates and source cautions remain unchanged.

`.local/check-website-candidates.mjs` checks the actual page, all six chapter lists, the quarantined conflict, first priorities, source evidence, exports, empty-search recovery, deep links, complete hold dispositions, responsive layouts and JavaScript errors. `.local/check_website_candidate_data.py` checks all candidate requirements, selected source/excerpt hashes, 34 input fingerprints, unchanged repeat output, private-path stripping, evidence links and local access guards. Receipts, exported evidence and desktop/phone screenshots live under `.local/data-desk-checks/website-candidates/`.


## Durable owner review and continuing discovery

The latest owner instruction turns `/data_analysis/candidates/` into an operational queue. Earlier static-shortlist instructions describe its seed input, not its current interaction.

The default To review view shows six prepared candidates. Approve for integration, Needs work and Pass persist server-side and remove the item from that active batch. The next prepared item enters immediately. Other views retain approved work, recorded integrations, discovery drafts, needs-work/stale items and passed items. Nothing is deleted from analysis. Candidate and source links remain reversible and inspectable. Your decision note and proposed website placement travel with the item.

Approval selects this exact proposal for integration. It does not claim its outstanding edition, content, reader or public-use checks have passed. An approved item becomes an integration work order; after actual implementation the owner can record its site path and changed-file/verification evidence. This is an owner-recorded completion, not an automatic independent site audit or deployment. No integration worker or publisher is installed by this queue.

### Sources and more material

Both saved-review and full-population evidence panels show their mapped curation state and candidate link. Unmapped records have Add to discovery. Mappings bind to the selected generation and record/window/pair/language/connection identity, with source text hashes where available. A document-level association means it contains a selected passage, never approval of the whole book. The original source reports and frozen evaluations are not rewritten; `/data_analysis/api/source-review.md` exposes their linked live owner annotations.

Mine the next source batch executes a bounded CPU query over the existing selected KR-110 or KR-140 index. It requires a narrow query and intended website use, remembers its cursor, and skips already mapped primary records. A request adds at most four drafts, not four automatically approved website claims. The recipe fingerprints the selected run, query implementation and search/purpose. Repeated requests continue; request replay is idempotent. Pair discovery uses a selected KR-120 pair in its existing desk; historical source annotations use their existing record panels. No all-pairs comparison, encoder, scheduler or bulk population job is started.

A discovery has inspectable source evidence and no fabricated editorial explanation. Its title, source-backed finding, reader benefit and website placement must be supplied through Prepare for review. Preparing creates a new proposal revision in To review, without approving it. Editing an existing proposal also returns it to review. Already prepared items refill automatically; when that pool is exhausted, another discovery batch must be prepared. This distinction prevents low-quality raw matches from silently filling the approval queue.

### Persistence, ownership and recovery

`knowledge/library_analytics/candidate_review.py` owns `KnowledgeBase/library-knowledge/connected-research/curation/curation.sqlite3`. It uses the existing shared analytics JobStore lease and its own store lease; a live or inaccessible owner is not taken over. The new store contains immutable proposal versions, exact source references, append-only events, current item state, idempotent request responses and discovery cursors. Requests carry expected revision and proposal fingerprint; stale tabs receive 409. A successful decision/history/cursor and its checkpoint commit atomically with FULL-synchronous WAL. Failed transactions can replay without partial decisions. The database is authoritative; JSON/Markdown projections are rebuildable.

Catalogue synchronization preserves owner decisions for unchanged proposals. Changed source, editorial text, credits or saved review inputs change the fingerprint; prior approvals stay in history and the changed proposal needs review. Removed seed proposals become stale. The marks API displays affected approvals as stale even before synchronization. This proves this curation layer's changed-proposal handling, not general cross-generation analytical selective refresh.

Exports are `source-marks.json`, `SOURCE-REVIEW.md`, `integration-queue.json` and `curation-state.json`. Content-addressed immutable copies and a checksum manifest go under `releases/`; `latest-curation.json` switches only after files are complete. These files preserve review/export versions; they are not a dependency-closed database backup. Off-device backup and restoration remain unverified. Preserve the SQLite database and its live WAL through a supported consistent backup when that separate work is authorized.

### API and operation

`GET /data_analysis/api/review` returns current state; `?view=marks` returns source marks; `?view=history&id=...` returns an item's events. Writes use only `POST /data_analysis/api/review`, with the existing loopback/host guard plus an exact same-origin Origin and JSON body. Actions are sync, decide, prepare, nominate and discover. Paths/root overrides are never accepted through this API. `/data_analysis/api/integration-queue.json` and `/data_analysis/api/source-review.md` expose fixed private export paths. Other analysis/static routes remain GET/HEAD only. Open source tabs update through a browser storage notification and a fresh read; there is no background service.

The CLI is the same Python module, receiving one JSON request on stdin, launched directly from cmd.exe with login disabled:

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m knowledge.library_analytics.candidate_review < request.json
```

An owner decision requires the exact current revision/fingerprint and a unique requestId; do not manufacture approvals from an AI judgment or populate sample approvals in the live store. CLI `--root` and `--shared` overrides exist for disposable test stores; they are not web parameters. There is no resume daemon. On a closed/failed request, reopen the page and read the committed state; retry only if the action did not commit. All long-term state is on disk.

### Verification

`knowledge/tests/test_candidate_review.py` covers initial source mappings, duplicate-request idempotence, stale-tab rejection, changed-input invalidation, read-time stale marks, unchanged synchronization, a failed transaction/replay, committed-decision survival through an export failure, live-owner contention, required integration evidence, source nomination/preparation, actual indexed discovery with saved cursors and immutable release checksums. Failure injection verifies transaction rollback; it is not a production process-interruption or disaster-restoration drill.

`.local/check-curation-queue.mjs` exercises the real backend and browser controls in isolated stores, including automatic batch refill, approval persistence, source markers, pass/needs-work lists, integration receipt, real-source mining, preparation and 1024/390/320px layouts in both themes. `.local/check-curation-source-sync.mjs` checks cross-tab source updates and nomination from a saved analysis record. `.local/check_curation_http.py` checks the actual local API, idempotent sync, access restrictions, fixed exports and preserved intake/Bible data routes. No owner approval or integration fixture is written to the live store. Receipts/screenshots: `.local/data-desk-checks/curation-queue/`.


## Scoped private reader dependencies · 19 October 2026

The Henry/Boyce source links now resolve through the existing local reader helper, independently of featured profile shelves. Only the two exact originals in `scripts/local-reader-scope.json` are included; existing names, source contributor IDs, null work/edition IDs, private-use notices and public permission-required metadata remain. See [reader usage, verification and rollback](../initiatives/library-knowledge/distillation/READER-FIX-2026-10-19.md). Henry's selected span is on local page 1/3; Boyce's on 25/25. These are containing-work links; page-jump behavior has not been added.

`local_library.py --apply-reader-scope --expected-index-sha256 <inspected-current-hash>` performs a bounded additive update without opening the corpus or rebuilding profile shelves. Both this operation and ordinary `--build-index` use the same exclusive `index-write.lock`; uncertain locks require identity inspection, never automatic removal. Exact previous index bytes are retained under `.local/local-library/index-backups/`. Scoped source/cache/per-record metadata hashes are rechecked on reads; prepared manifests bind original/cache dependencies. The original profile snapshot timestamp remains unchanged for this addition. Future ordinary builds merge the configured scope. Do not start a full build merely to apply these copies.

Fourteen disposable tests in `scripts/tests/test_local_library.py` pass; all 28 live HTTP pages equal retained extraction text and current proposal fingerprints remain unchanged. The original reader delivery did not include Candidates browser proof; the later visible Data-hub navigation check now verifies the original Candidates route and both reader links under unchanged browser settings. Reader delivery does not revalidate candidate source-quality dependencies: the general generation/dependency adapter, whole-book fidelity, public-use gates and final source reconciliation remain separate.
