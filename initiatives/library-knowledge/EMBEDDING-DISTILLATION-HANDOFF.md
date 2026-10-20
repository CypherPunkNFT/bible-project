# Embedding recovery and corpus distillation chat handoff

Saved 18 October 2026, America/New_York. This is Part B of the two-chat consolidation. Read with [Part A implementation handoff](DATA-ANALYSIS-HANDOFF.md), the [organizing README](README.md), single [TODO](TODO.md) and operating [HANDOFF](HANDOFF.md). The ready-to-paste combined instruction is [PROMPT-MERGED-NEW-CHAT.txt](PROMPT-MERGED-NEW-CHAT.txt); the separate [Part B prompt](PROMPT-MERGE-PART-B.txt) is retained for traceability.

## 1 Owner objective and current scope

The owner wants to distill a large, uneven-quality library into useful source-grounded information and better website candidates. Embedding completion is an enabling tool, not proof of good text, correct interpretation, independent corroboration or website value. The owner is frustrated by repeated expensive preparation, stale status, unsupported ETAs, shallow extraction and recurring console popups.

The latest distillation request authorized deep brainstorming, a master document and expansion of that document before pipeline implementation. This chat performed planning, small read-only baseline capture and critical reviews. It did not execute the proposed semantic pilot, correct source text, change live candidates, approve content, integrate a website feature or publish anything. Earlier embedding/recovery changes were separately authorized and remain running under their existing owner.

The owner also required a slower holdings-first review, beginning with **A. A. Hodge, Outlines of Theology**: held original, work/edition identity, complete usable extraction/OCR and actual reader behavior must be assessed separately. The existing `supper` candidate connects that readiness task to a useful outcome.

**KR-130 remains retired and deleted.** [KR130-RETIRED.md](KR130-RETIRED.md) overrides obsolete extraction/argument-roadmap instructions. Candidate-local attributed notes are part of the proposed design; a recreated population-wide argument extractor is not authorized.

## 2 Latest observed embedding and completion state

Read-only capture at **18 October 2026, 11:18:38 PM EDT** is preserved in [distillation/handoff-2026-10-18.json](distillation/handoff-2026-10-18.json). Its UTC timestamp is `2026-10-19T03:18:38.731921+00:00`. Files were read individually and live processes inspected; this is not an atomic corpus backup or a guarantee of future readiness.

| Observation | Recorded state and interpretation |
| --- | --- |
| Original completed embedding snapshot | Build `2026-10-13T23:47:33.488164+00:00`; 11,579,535 chunks and matching vectors; zero missing, stale or duplicate vectors; SQLite integrity `ok`; embedding identity matches |
| Parity receipt date | `verification.json` at `2026-10-19T00:19:21.172334+00:00`, or 18 October 8:19 PM EDT. It is a dated receipt, not a fresh audit of every later operation |
| Remaining source gate in that receipt | `enrichment_ready:false`; 13 new source files, 2 changed source inputs, 29 new library files, 1 changed ledger. Units overlap and must not be summed as missing books |
| Live embedding-progress checkpoint | `optimizing`; indexed/total both 11,579,535, remaining 0; timestamp 18 October 10:38:22 PM EDT |
| Live completion owner | `native-20261019T023504-75348`, heartbeat current at capture; status says `embedding` while its child optimizes the vector index |
| Verified core process identities at capture | Native owner 75348 with venv launcher 82020; native embed/index worker 58340 with launcher 8896. These are dated identities, never reusable kill/start targets |
| Encoder health | `bible-project-encoder`, PID 43516, model unloaded, error null. Idle unloaded is consistent with indexing not requesting new embeddings |
| Native supervisor | Enabled, `mode:verification_only`, `state:busy`; reason: vector optimization is protected from automatic interruption; `console_window:false` |
| Retry ledger | 3 attempts out of 3 in the current recovery epoch. This is the recorded launch/recovery budget, not proof of three identical failures. No fourth recovery attempt is available under this budget; do not silently reset it |
| Downstream authorization | Verification/reconciliation request activated; graph and mining flags remain false |

On resume, re-read `KnowledgeBase/embedding-progress.json`, `intake-completion.json`, `verification.json`, `native-supervisor/{control,status,recovery,alert}.json`, actual process identities and the relevant logs. Require fresh matching terminal receipts and retained index/source dependencies before claiming final source reconciliation or stable full-corpus semantic readiness. Do not kill or restart a protected optimizer/build/verification process because its numerical checkpoint is old. Do not interpret the parent's generic phase label as proof it is computing new vectors.

## 3 Embedding and recovery work delivered by this chat

The original 8,458,873-chunk pass finished on October 12. Later acquisition expanded the corpus. The overnight October 14 interruption left 8,550,120 saved rows and stale running checkpoints. Its immediate termination cause was not identified; there was no proof that Bitdefender killed the native Python processes. Do not turn the established PowerShell blocking into that diagnosis.

The subsequent October 14 CUDA failure exposed a concrete encoder defect: its idle cleanup could throw at `torch.cuda.empty_cache()` before closing its GPU lock. The worker then waited for a lock held by the broken encoder process. `knowledge/encoder.py` now releases the lock in cleanup even on an exception, records the poisoned encoder state and reports unhealthy status instead of claiming a usable unloaded service. NVIDIA subprocess launches are windowless.

`knowledge/vectors.py` also repeated an expensive full-corpus sort of text on startup. Its `missing_rows` path now fetches only unfinished passage text through the existing unique passage-ID index. Saved IDs are still inventoried, but the full-text ordering/temp-file cost is removed. Processing order is now passage ID, not kind/edition priority. Model inputs, model identity and dimensionality were not deliberately changed. Real saved writes were confirmed after the repair in `KnowledgeBase/embedding-repair-verified.json`. Historical minute measurements were around 10.67/sec and later run averages varied; they are not a current ETA.

Model configuration at capture: `Qwen/Qwen3-Embedding-4B`, revision `5cf2132abc99cad020ac570b19d031efec650f2b`, 2,560 dimensions, 4,096 max tokens, GPU batch 16, write batch 64. The encoder rejects over-token chunks rather than silently truncating. Do not mix these vectors with browser-model vectors or rebuild the corpus merely to reconsider batching.

| Component | Role |
| --- | --- |
| `knowledge/native_supervisor.py` | Single-instance native supervisor, process identity, heartbeat/progress gates, protected operations, bounded attempts/backoff, local alerts and authorized verification handoff |
| `knowledge/encoder_recovery.py` | Private-instance encoder inspection and repair; refuses foreign/uncertain ownership; stops owned corpus workers before replacing failed encoder, then one resume owner |
| `knowledge/arm_native_recovery.py` | Windowless task registration/validation and explicit budget arming; not an automatic repair to run from a handoff |
| `knowledge/finish_intake.py` | Native completion owner; resume, gated source refresh, embeddings/indexing, exact verification and late-acquisition reconciliation; verification-only suppresses downstream final handoffs |
| `knowledge/embedding_scope.py` | Embedding-only snapshot/preservation guard and pending-verification terminal state |
| `knowledge/queue_final_verification.py` | Records a scoped request; no graph/mining authorization |
| `knowledge/measure_embedding_minute.py` | One 60-second checkpoint-delta measurement, not a recurring monitor |

Tests passed when this recovery version was enabled: **35 focused tests**, including a real disposable child-process/HTTP fixture that simulated a failed encoder and verified one replacement. Earlier live missing-worker recovery also saved 64 new vectors with old fragment metadata preserved. Neither proves every possible GPU/reboot/failure case. Backup/restore and universal cross-generation refresh remain separate unproved capabilities.

## 4 Watchdog and popup preferences

The owner explicitly stopped all recurring monitors after repeated console popups, then separately re-enabled the embedding watchdog on October 15. Preserve the latest directions, not the intermediate all-paused state.

- `BibleProject-Native-Completion-Supervisor`: dedicated venv **pythonw.exe**, every minute and at user logon, same working site, normal priority, IgnoreNew plus exclusive lock; logs/status to files. Live scheduled execution and `console_window:false` were verified. No PowerShell or visible console wrapper.
- The supervisor's fresh three-attempt epoch and prior ledger are archived under `KnowledgeBase/native-supervisor/`; current attempts are now 3/3, as above. Record the actual reason/history before any future request to alter that budget.
- Build/verify/index work, duplicate owners/workers, changed/reused process identity, uninspectable ownership and pause markers block destructive recovery. Encoder timeout recovery requires repeated observations. The automatic repair never owns unrelated encoders or the data-refinement pipeline.
- The legacy Bible watchdog and campaign-report monitor were left disabled/stopped. Do not restore the old watcher chain or re-enable miscellaneous tasks.
- The owner's separate exception is **FortressHealWatchdog hourly and with no popup at all**. On this handoff's read-only scheduler check, its action was `HyperVault/KnowledgeBase/.venv/Scripts/pythonw.exe` running `Jarvis/Tools/heal_watchdog.py`, interval `PT1H`, Hidden true; saved registration result was code 0. This service watchdog is separate from Bible embedding recovery. Do not change it as part of the merge.
- These interactive-user scheduled tasks depend on the owner's signed-in Windows session; they are not proved logged-out recovery. Do not promise an airtight system or invent reboot/logoff guarantees.

Background policy: use `C:\Windows\System32\cmd.exe` with `login:false` for shell tools and direct Python/Node for scripts. Never introduce PowerShell or encoded PowerShell wrappers, blanket antivirus exclusions or visible terminals. Logs and local failure records provide diagnostics without recurring popups.

## 5 Distillation planning delivered

Main documents:

- [CORPUS-DISTILLATION-MASTER-PLAN.md](CORPUS-DISTILLATION-MASTER-PLAN.md): quality dimensions, known failures, OCR/embedding anomaly experiments, duplicate/source-family independence, hybrid evidence retrieval, candidate dossiers, compatible queue extensions, phases, compute limits, refresh/rollback and editorial boundaries.
- [distillation/PILOT-PROTOCOL.md](distillation/PILOT-PROTOCOL.md): concrete cases, source sampling, held-out tasks, blinded pooled judgments, resource/review caps, decision rules and selective repair rehearsal.
- [distillation/baseline-2026-10-18.json](distillation/baseline-2026-10-18.json): 21-candidate saved projection and curation export, selected input hashes, original HTML HTTP check and planning-time completion observations. It is not a fresh database census or consistent source backup.
- `distillation/planning_baseline.py` and `check_plan.py`: small capture/reference validators. Capture refuses overwriting its dated baseline. They are planning support, not semantic processors.
- `TODO.md` DIST-00–07: planning baseline complete; later implementation/audit phases still unchecked. Do not create another competing task list.

Three parallel read-only reviews and a second critical pass improved the plan before implementation. Corrections include: judge displaced/filtered results as well as winners; compare against the unchanged existing hybrid; separate answerable-task usefulness from negative-task abstention; avoid impossible fixed gains near a baseline ceiling; retain actual files behind a pinned vector version; distinguish document records from independent books; and make new dependency-to-proposal reconciliation explicit rather than claiming it already exists.

Proposed first rehearsal: **12 documents and 12 queries**, only after the appropriate immutable-source gate. Proposed wider design: 240 document records in separate probability/risk/protected groups and 120 new reader tasks split development/held-out. These are planned sample sizes and budgets, not completed runs or quality evidence. Source audit and manual review capacity determine feasible scope before held-out exposure.

The six shadow dossiers are `ephesians-guide`, `supper`, `justification`, `quotation`, `editor-voice`, `caritas`. Start source readiness with Hodge/`supper`. `father-gloss` is a protected short Hebrew/Aramaic control, not an extra promoted dossier. The all-21 desk audit should preserve good ideas with damaged sources as repair work rather than discarding them as poor editorial ideas.

## 6 Principles that must survive the merge

1. Embeddings nominate similar or unusual material. They cannot certify truth, OCR fidelity, agreement, influence or author endorsement. Source-grounded checks remain independent.
2. Keep extraction, identity, location/context, speaker role, relevance, independence, source suitability, allowed use and review maturity as separate dimensions. No universal truth score or cosine-as-confidence label.
3. Keep raw sources and previous transcriptions immutable. Apply reviewed corrections as derived versions; preserve exact spans/hashes and source witnesses. Never modernize legitimate spelling or silently replace edition variants.
4. Rare topics, short lexical entries, historical spelling, Greek/Hebrew/Latin and mixed scripts can be legitimate outliers. Preserve protected controls; no automatic deletion from vector oddities.
5. Reprints, translations, common Scripture and quotation chains are not independent support. Count verified works/source families, with unknown identity/independence explicit.
6. Preserve quoted opponents, editor/translator roles, contrary evidence and qualifications. A source-supported historical statement is still that source's statement, not automatically an established fact.
7. Reuse existing evidence/curation stores, leases and revision machinery. Current candidate evidence uses older KR/LK generations and has not been enriched by the completed full vector store.
8. The curation ledger detects its compiled catalogue/proposal fingerprint; it does not continuously rehash new external source/quality sidecars. A tested generation/dependency adapter must bring those dependencies into proposal digests before automatic stale handling can be claimed.
9. Source changes, quality policies, work grouping and new search populations can change rankings even when a cited passage is unchanged. Preserve dependency versions, prior decisions and visible proposal differences. General selective refresh is not proved.
10. Roughly 118.57 GB of raw float32 values and about 67 trillion passage pairs make full-matrix/all-pairs work inappropriate. Use bounded retrieval, fingerprints and measured selective model analysis. Do not start another full re-embedding pass.
11. Small known KR/LK tests retain their failed gates and reviewer limits. They are diagnostic regressions, not fresh hidden evaluation. No large output count substitutes for useful reading evidence.
12. Keep Josephus in Scholars and preserve credits, Catholic-material cautions, private/public-use distinctions and actual reader-location limits. No public content or deployment follows from this handoff.

## 7 Reconcile with Part A and choose the next task

Part A supplies the current local Data desk, selected analysis populations, candidate/owner ledger and its own final 11:05 PM EDT database/API snapshot. Do not reset later decisions to either snapshot. The authoritative curation store remains its SQLite database and active WAL; its JSON exports are not a proven disaster-restoration backup.

Resolve the following before any new processor or UI changes:

- Is the existing source/completion owner still optimizing/building/verifying, and are fresh terminal receipts consistent with actual source/index versions?
- Which candidate sources map to the chosen stable corpus and which are older unmapped generations?
- Which Hodge original/edition/extraction/reader checks remain incomplete?
- What source-quality findings and concrete question would improve the first six dossiers, without recreating KR-130 or flooding the queue?
- What is already delivered code, proposed design, failed acceptance and genuinely unverified capability?

For the merge request, re-read both halves, consolidate factual status and record one bounded next task in the existing TODO/HANDOFF. Continue only already-authorized read-only source readiness and plan expansion. The handoff itself does not authorize running the full pilot, changing scheduler budgets, modifying live candidates, bulk mining, source repairs, public integration or deployment. Report any newly discovered processing failure separately; do not silently fix or restart a protected owner under the guise of documentation.

## 8 Operating locations and validation

Project root: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject`. Organizing home: `Website/initiatives/library-knowledge/`. Only local preview: `http://127.0.0.1:8931`; candidates: `/data_analysis/candidates/`. From Website, Python is `..\KnowledgeBase\.venv\Scripts\python.exe`.

Read applicable AGENTS files and the full existing [future-additions protocol](FUTURE-ADDITIONS-PROTOCOL.md) and [evidence contract](EVIDENCE-CONTRACT.md). Preserve dirty/unpublished work, original/dist release differences, running jobs, source identities, old releases and owner history. Do not replace dist/ with another checkout, reuse old PIDs or start an additional preview endpoint.

Planning validation checked all local links in the two new documents, the 21 unique candidate IDs, six dossier IDs, dated receipt counts and unchanged candidate/curation export hashes at that check. It did not prove source quality or the future pilot's gates. Use scoped whitespace checks with CRLF support; no website rebuild/test suite is needed for these documentation-only additions. Current runtime and candidate state must be read again in the new chat.
