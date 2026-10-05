# Bible Project local knowledge library

A separate local search system for the Bible Project corpus. Open **http://127.0.0.1:8935** after starting it. The website and reader continue at :8931; this does not deploy or change public search.

## Start, update and stop

From `Website`, in PowerShell:

```powershell
# Start the local UI and its encoder; resume unfinished vectors in the background.
powershell -ExecutionPolicy Bypass -File knowledge/start.ps1

# After changing sources/content: rebuild the verified full-text snapshot, then resume vectors.
powershell -ExecutionPolicy Bypass -File knowledge/start.ps1 -Refresh

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
- JSON documents throughout `content/`, including publication/review status, and project/design/reference documentation.
- All **344,799 original OpenBible cross-reference rows**, including their votes and source attribution. These remain recorded references, not new theological assertions.

`coverage.json` reports actual counts. `/api/inventory` pages through the file/checksum manifest. All raw source files are accounted for: original/duplicate representations, archives, images and source metadata are distinguished from indexed text. The incomplete Korean download is not promoted into the 37-edition catalogue. Linked external books are not full texts unless their content exists locally. Images are inventoried, not OCR'd; archives are not separately embedded. Credentials, application dependencies, build output and private runtime databases are excluded. Original files remain unchanged.

This is a snapshot of local content: use `-Refresh` after edits or downloads. The raw originals and generated Bible reader data remain the canonical inputs; the knowledge database can be rebuilt.

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

The first semantic pass is a substantial GPU job. No arbitrary source/sample limit is used. The encoder retries smaller batches after CUDA out-of-memory errors and unloads when idle. The launcher creates hidden background processes, not terminal windows.

## Runtime

This PC uses `D:/Python/python.exe` (Python 3.13), PyTorch 2.6.0+cu124, sentence-transformers 5.2.2, LanceDB 0.20.0, PyArrow 23.0.1, NumPy 2.2.6, Beautiful Soup and pytest. The dedicated environment was created with `--system-site-packages` to reuse already installed software without changing Fortress's environment. Data/config/processes remain separate. Node plus the website's installed esbuild are used to export its own authored TypeScript data; downloaded source files are never executed. Browser verification uses the website's existing Playwright package and installed Edge.

To reconstruct the environment on this PC:

```powershell
& D:/Python/python.exe -m venv --system-site-packages ../KnowledgeBase/.venv
powershell -ExecutionPolicy Bypass -File knowledge/start.ps1 -Refresh
```

On another machine, install a compatible CUDA PyTorch build and the packages above in a separate environment, cache the pinned model, and adjust paths/ports/GPU lock before starting. This implementation currently expects an NVIDIA GPU for semantic encoding; FTS and reference retrieval work without loading the model.

Technical references: [SQLite FTS5](https://www.sqlite.org/fts5.html), [Qwen embedding model card](https://huggingface.co/Qwen/Qwen3-Embedding-4B), [LanceDB Python API](https://lancedb.github.io/lancedb/python/python/).
