# Bible Project local knowledge library

**Enrichment strategy:** [LLM-authored term libraries and deterministic Python/FTS5 passes](ENRICHMENT-STRATEGY.md) is the preferred first method for the [analytical roadmap](ANALYSIS.md). Intelligence is prepared and validated in reusable rules; the bulk runner makes no model calls. The strategy is documented; term packs and the runner remain planned.

**Knowledge checkpoint (2026-10-06):** Embedding and held-library intake are complete: 1,710,344 / 1,710,344 vectors, 32,312 documents, 1,027,939 verse records. Completion passed at 9:14 AM Eastern; a fresh read-only verification also passed with zero missing/stale/duplicate vectors, zero FK errors and no new/missing library files or changed ledgers. Two scan-only files remain explicitly deferred. Lexical and hybrid API smoke checks succeeded. Enrichment has not started.

**Next: careful graph construction.** [GRAPH-PLAN.md](GRAPH-PLAN.md) fixes the identity/evidence contracts, separate analytical store, allowed relations, 120-document pilot, 24-rule pack, review gates, scale-up and rollback. Build G0/G1 first; no graph extraction runs or new servers have been started.

A separate local search system for the Bible Project corpus. Open **http://127.0.0.1:8935** after starting it. The website and reader continue at :8931; this does not deploy or change public search.

## Start, update and stop

From `Website`, in PowerShell:

```powershell
# Start the local UI and its encoder; resume unfinished vectors in the background.
powershell -ExecutionPolicy Bypass -File knowledge/start.ps1

# After changing sources/content: rebuild the verified full-text snapshot, then resume vectors.
powershell -ExecutionPolicy Bypass -File knowledge/start.ps1 -Refresh

# One-time full incorporation: refresh, finish vectors, verify, and catch late acquisitions.
# Runs until the held-text snapshot is current, then exits without starting enrichment.
powershell -ExecutionPolicy Bypass -File knowledge/finish-intake.ps1

# Resume an interrupted completion job against the published snapshot.
powershell -ExecutionPolicy Bypass -File knowledge/finish-intake.ps1 -Resume

# Stop only this instance's services. The database and vectors remain on disk.
powershell -ExecutionPolicy Bypass -File knowledge/start.ps1 -Stop
```

The launcher uses the dedicated environment at `../KnowledgeBase/.venv`. There is no scheduled task, automatic download, remote embedding API or public listener. Services bind to 127.0.0.1. To start without the bulk embedding job, add `-NoIndex`. Searches by meaning may load the encoder on demand.

## What was reviewed and reused

The existing Fortress system lives in `HyperVault/KnowledgeBase`: its README, HANDOFF, ARCHITECTURE, RETRIEVAL, source configuration, full-text builder, embedding client and local embedding daemon were reviewed. It combines FTS5, LanceDB semantic retrieval, provenance and graph relationships. This instance adopts that architecture without joining its corpus or reusing its stores.

| Concern | This Bible instance |
|---|---|
| Durable state | `BibleProject/KnowledgeBase/` |
| Full text, original verse records, source metadata, relationships | `knowledge.sqlite3`, SQLite + FTS5 |
| Semantic vectors | `vectors/passages.lance`, LanceDB |
| Query UI/API | 127.0.0.1:8935 |
| Dedicated encoder | 127.0.0.1:8936 |
| Existing Fortress search/encoder | Not queried, modified or restarted |
| Shared resources | Installed Python packages, cached model weights, GPU coordination lock only |

No access to the shared FTS database, graph database, Neo4j service or `D:/KnowledgeBase-Vector` is needed. Configuration rejects a state directory outside the dedicated `BibleProject/KnowledgeBase` location. The GPU lock coordinates hardware availability with Fortress; it stores no corpus data. While a bulk run owns the GPU, the other embedding service must wait until this encoder unloads. Idle unloading happens after five minutes.

## Coverage and provenance

The build imports every edition in `data/catalog.json`, validating every book's chapter labels and each edition's verse-record total. The initial corpus contains **37 editions and 1,027,939 verse records**, including available Apocrypha. Joined verse labels, verse 0, non-KJV numbering, headings, notes, Strong's annotations and source credits are retained. Scripture passages and edition notes have separate collection labels.

It also imports:

- All generated people (including family relationships), places, Gospel harmony, names of God, letters, miracles and prophets.
- Full local Torrey, Nave, Easton and Robertson reference texts, plus STEP Bible's full proper-name/reference source.
- Authored apologetics guides, library/source records, Gospel portraits, chart insights and study collection material from an explicit allowlist of repository modules.
- Authored JSON documents throughout `content/`, including publication/review status, and project/design/reference documentation. Library catalogs and acquisition reports have their own structured adapter.
- Held library bodies from `sources/library`: PDF text layers, EPUB sections and notes, HTML, text, XML and structured text documents. Acquisition ledgers supplement catalog records, including books and sermons not yet promoted into the catalog. Existing approved OCR and font repairs are reused; this importer performs no OCR, download or model-based transcription.
- All **344,799 original OpenBible cross-reference rows**, including their votes and source attribution. These remain recorded references, not new theological assertions.

`coverage.json` reports actual counts. `/api/inventory` pages through the file/checksum manifest. All raw source files are accounted for: original/duplicate representations, archives, images and source metadata are distinguished from indexed text. The incomplete Korean download is not promoted into the 37-edition catalogue. Linked external books are not full texts unless their content exists locally. Images are inventoried, not OCR'd; archives are not separately embedded. Credentials, application dependencies, build output and private runtime databases are excluded. Original files remain unchanged.

This is a snapshot of local content: use `-Refresh` after edits or downloads. The raw originals and generated Bible reader data remain the canonical inputs; the knowledge database can be rebuilt.

### Expanded library intake

`library.py` reconciles catalog records, acquisition manifests and repair ledgers before importing the raw collection. Original and selected derivative checksums are checked. A repaired derivative can be shared across acquisition IDs only when original checksums match. Identical originals or extracted bodies reuse one searchable document while `library_files` retains each source's identity, edition and provenance. EPUBs retain section locators; PDF pages and page-marked repairs retain PDF page numbers. Text without reliable pagination is labeled as a transcription rather than assigned invented pages.

`library_records` retains catalog metadata; `library_reports` retains acquisition/quality ledgers. Catalog descriptions, library bodies and review-held editions have separate collection labels. Publisher AI disclosures and existing editorial qualifications remain attached to their editions. No source's public hosting or indexing permission is promoted by this private-local intake. Public-site integration remains separate.

Extraction caches live under `KnowledgeBase/extracted-library/` and are keyed by input/derivative hashes and extractor version. A failed build preserves the previous published database; rerunning reuses extraction caches. `library-intake-progress.json` reports staging progress. Original or derivative checksum failures block publication. `library-intake.json` records duplicates, metadata-only assets, empty text, unsupported files and low-text PDF pages for review. Blank pages and illustrations are not assumed to contain missing prose; existing extraction audits remain authoritative for their review status. Acquisitions completed after a snapshot require a later refresh.

The enrichment readiness check must establish SQLite integrity, complete FTS5 construction, the intended acquisition snapshot, resolution or explicit classification of intake gaps, matching embedding model identity and zero missing/stale/duplicate vectors. A running job or a count of downloaded files does not satisfy that gate.

`finish-intake.ps1` is a one-time completion worker. It waits for this instance's embedding process, verifies parity, checks new/missing originals and changed catalog/acquisition ledgers, and refreshes late arrivals while reusing saved vectors. It exits with a recorded `needs_attention` state on errors or unresolved text gaps. Explicitly deferred scan-only sources retain searchable metadata and their existing review decisions; they are not counted as full-text documents. `intake-completion.json` records the outcome, while `verification.json` records the post-embedding audit. The worker does not download, transcribe or start enrichment, and does not install a recurring task.

## Retrieval behavior

- **Exact text:** FTS5 with Unicode tokenization; quoted phrases preserve word order, unquoted significant words are combined with AND. CJK characters are segmented in a search-only field. This is not a morphology/lemma engine.
- **Meaning:** locally cached `Qwen/Qwen3-Embedding-4B`, revision `5cf2132abc99cad020ac570b19d031efec650f2b`, 2,560 normalized dimensions, cosine distance. Queries use the model's query instruction; documents do not. Inputs exceeding 4,096 tokens are rejected rather than silently shortened.
- **Words + meaning:** reciprocal-rank fusion (`1/(60 + rank)`). Filters constrain both methods. Similarity indicates retrieval relevance, not factual certainty or doctrinal authority.
- **Verse lookup:** full book names or USFM codes, e.g. `John 3:16`, `JHN 3:16-18`. Returns exact edition-specific records and source context. KJV-based cross-references are not silently mapped onto editions with different numbering.
- **Connections:** stored person relationships, document-to-verse citations and OpenBible references. No automatically invented relationship or generated answer layer.

All results expose source/credit and original context. The UI labels partial semantic coverage while embedding is underway; FTS searches the entire snapshot immediately. Semantic quality varies with language and genre and needs human assessment. Historic commentary and editorial documents are labeled separately from Scripture.

## Maintenance and verification

```powershell
$biblePython = '../KnowledgeBase/.venv/Scripts/python.exe'
& $biblePython -m knowledge status
& $biblePython -m knowledge verify
& $biblePython -m knowledge search 'hope when suffering' --mode hybrid --edition kjv
& $biblePython -m knowledge search 'John 3:16' --mode lexical
& $biblePython -m pytest knowledge/tests -q
node knowledge/tests/browser.mjs
```

Builds stage a new database, validate SQLite/FTS/FK integrity and edition counts, then publish it; one previous snapshot is retained. Building and bulk embedding share a single-writer lock. Chunk IDs include source identity, location and text. Refreshing reuses unchanged vectors and removes stale ones only from this Bible table. Interrupted embedding resumes from actual stored IDs, not a progress counter. `verify` compares the complete active chunk-ID set with stored vector IDs and checks duplicates; `complete: true` requires parity.

The model identity is recorded and checked during indexing and queries. Do not change model/revision/dimensions over existing vectors. Completion includes creation of a cosine ANN index; exact full-vector search works while it is building. Logs/progress are under `../KnowledgeBase`; `embedding-error.log` contains indexing failures. `stalled`, `interrupted`, or `needs_refresh` means run the launcher again (or `-Refresh` when source data changed). `-Refresh` stops only this instance's active indexer/server before swapping files; retained vectors survive the restart.

The first semantic pass is a substantial GPU job. No arbitrary source/sample limit is used. The encoder retries smaller batches after CUDA out-of-memory errors and unloads when idle. Progress writes use unique temporary files and retry atomic replacement through temporary Windows sharing violations; persistent failures retain the previous valid report. The launcher creates hidden background processes, not terminal windows.

GPU batches remain 16 passages; vector writes group up to 64 to reduce file/index overhead on the larger corpus. Oversized multilingual requests are split within the encoder's byte limit without dropping text or changing model identity. Book chunking uses offsets instead of repeatedly copying the entire remaining book, while preserving prior chunk boundaries and reusable vector IDs.

Hardware contention produces `waiting_for_gpu`: the worker retries every 30 seconds and updates its heartbeat without unloading other applications or switching models. Full-text search remains available. Invalid input, model mismatches and other failures still stop the pass for investigation. The completion worker waits for the active embedding process; it cannot mark a waiting pass complete.

### Automatic recovery watchdog

Owner-authorized on 2026-10-05 after a CUDA execution failure stopped the expanded pass. Install with `powershell -NoProfile -ExecutionPolicy Bypass -File knowledge/install-watchdog.ps1`. Windows task `BibleProject-Knowledge-Watchdog` runs immediately, every 30 minutes, and at this user's logon. It uses the logged-in user's permissions, runs hidden, catches missed checks after sleep, and does not require this chat to stay open. The PC must be awake and the user logged in; this is not a logged-out service.

Each check writes `KnowledgeBase/watchdog.json` and appends `watchdog.log`. Stopped or stale embedding workers are resumed through `finish-intake.ps1 -Resume`; a failed/stalled pass gets a fresh Bible encoder CUDA context and reuses saved vectors. Previous errors and progress are archived under `watchdog-history/` before logs are replaced. Healthy workers, fresh GPU-wait heartbeats, active builds and ANN optimization are left alone. A missing completion monitor is reattached without restarting an active encoder. Verified completion stops recovery actions. The watchdog neither unloads other models nor starts enrichment.

Recovery uses a separate hidden Windows process and confirms its live PID and startup report. Each monitor gets `intake-recovery-<pid>.log` and `intake-recovery-<pid>-error.log` (paths recorded in `watchdog.json`); unique logs avoid Windows locks retained by surviving services. Both missing-monitor recovery and stopped-worker recovery were exercised through the actual scheduled task on 2026-10-05, with saved vector counts retained. The six recovery-policy tests bring the knowledge suite to 36 passing tests.

Create `KnowledgeBase/watchdog.pause` before intentionally stopping the pipeline; remove it to permit recovery. Remove the scheduled task with `knowledge/install-watchdog.ps1 -Remove`. Persistent failures are retried at the next 30-minute check and remain visible in the append-only log; a watchdog failure records `watchdog_error` and returns a nonzero Task Scheduler result. This records status locally; it does not send chat/email notifications. A worker that stops just after a check may wait up to 30 minutes for recovery. Long builds/ANN optimization are deliberately not killed based on embedding heartbeat age.

### Coverage audit — 2026-10-05

The original snapshot was built at `2026-10-05T05:04:57Z` and passed parity verification with 198,656 passages/vectors. The expanded snapshot published at `2026-10-05T15:50:59Z` contains **1,225,567 passages, 26,786 documents and 1,027,939 original verse records** across the same 37 editions. It accounts for 19,860 library files, including 9,958 text-bearing files; two scan-only sources retain existing transcription deferrals. SQLite/FTS5 integrity and a browser check of library search, source context and mobile layout passed. Embeddings are incomplete: 198,527 current vectors were reused, and the worker is waiting for GPU memory occupied by other local models. Consult live reports for subsequent progress and late-acquisition refreshes.

Remaining work:

- Complete and verify the expanded library build and its semantic pass. The asset-aware importer is implemented; `-Refresh` now includes held library bodies and existing repairs. A running build is not evidence that these bodies have reached the published snapshot or vector index.
- Keep linked, acquired, text-extracted and searchable counts distinct. At audit time the catalog had 3,702 downloaded and 130 link-only assets; per-asset full-text flags were 54 allowed, three conditional and 3,775 unknown. These are the catalog's recorded flags, not a new rights determination.
- Add source-change detection and an intentional refresh workflow for the growing library. Refresh and startup are currently manual; no watcher or logon task is installed.
- Evaluate retrieval against representative known-answer queries across editions, languages and reference works. Existing functional tests establish operation, not a measured relevance benchmark.

The separate store, original Bible full-text coverage, recorded cross-references and local search interface are already implemented. Public-site integration and generated theological answers are separate features, not part of this local baseline.

## Runtime

This PC uses `D:/Python/python.exe` (Python 3.13), PyTorch 2.6.0+cu124, sentence-transformers 5.2.2, LanceDB 0.20.0, PyArrow 23.0.1, NumPy 2.2.6, Beautiful Soup and pytest. The dedicated environment was created with `--system-site-packages` to reuse already installed software without changing Fortress's environment. Data/config/processes remain separate. Node plus the website's installed esbuild are used to export its own authored TypeScript data; downloaded source files are never executed. Browser verification uses the website's existing Playwright package and installed Edge.

To reconstruct the environment on this PC:

```powershell
& D:/Python/python.exe -m venv --system-site-packages ../KnowledgeBase/.venv
powershell -ExecutionPolicy Bypass -File knowledge/start.ps1 -Refresh
```

On another machine, install a compatible CUDA PyTorch build and the packages above in a separate environment, cache the pinned model, and adjust paths/ports/GPU lock before starting. This implementation currently expects an NVIDIA GPU for semantic encoding; FTS and reference retrieval work without loading the model.

Technical references: [SQLite FTS5](https://www.sqlite.org/fts5.html), [Qwen embedding model card](https://huggingface.co/Qwen/Qwen3-Embedding-4B), [LanceDB Python API](https://lancedb.github.io/lancedb/python/python/).
