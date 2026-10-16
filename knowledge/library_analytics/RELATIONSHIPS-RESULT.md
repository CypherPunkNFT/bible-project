# KR-120 CPU relationship results

Completed private candidate delivery for the pinned supported snapshot. This is located lexical/reference analysis, independent of the ongoing expansion from the previously embedded 8M to the newer 11M corpus. It does not establish current whole-library coverage, quotation attribution, historical influence or semantic neighbors. No intake, encoder, scheduler, graph or public writer was started.

Base generation: `kr120-66a741ba22a7025744d3b98d`. Joint generation: `kr120-joint-cd46d0e4e3023ae1fcf41938`. Release: `kr120-release-79570e88c09eb13201a515ae`.

[Operator and reproducible commands](RELATIONSHIPS.md) · [Working SQL](relationship-queries.sql) · [Backlog](../../initiatives/library-knowledge/TODO.md)

## Population and populated tables

| Measure | Count |
| --- | ---: |
| Supported documents/XML entries | 100,889 |
| Eligible native/recorded windows | 3,248,544 |
| Candidate/fallback windows deferred | 4,671,670 |
| Windows shorter than fingerprint length | 468,539 |
| Wording postings | 19,414,258 |
| Canonical reference postings | 4,360,894 |
| Base feature keys | 17,478,355 |
| Base paired evidence rows | 5,266,994 |
| Frequent base features deferred | 21,430 |
| Joint batches | 1,192 |
| Joint windows | 1,220,007 |
| Joint truncated windows | 35,236 |
| Joint postings | 9,160,913 |
| Joint buckets | 256 |
| Joint features | 5,445,034 |
| Joint pairs | 11,437,451 |
| Joint frequent deferred | 9,131 |
| Distinct wording candidate pairs | 1,556,380 |
| Distinct cocitation candidate pairs | 8,795,488 |

Evidence rows can repeat a pair through different features; wording and co-citation pair populations can overlap. Documents include XML entries and are not a count of independent books. The parent has 7,920,214 windows overall. Inherited scope retains 113,557 immutable-source adapter deferrals and three archive exclusions.

## Measured quality

Reviewer: **model-assisted Codex implementation agent; no human or independent reviewer**. Both complete source contexts were inspected for every sampled pair. The deterministic stratified sample is not an unbiased population precision estimate. No rules were tuned on reserved pairs.

| Channel | Useful / reviewed | Useful sample precision |
| --- | ---: | ---: |
| wording | 3/24 | 12.50% |
| cocitation | 11/24 | 45.83% |

| Frozen known-pair set | Split | Recovered / known | Recall | Base-only recovery / added |
| --- | --- | ---: | ---: | --- |
| Raw overlap | development | 4/16 | 25.00% | Not a ranking-baseline comparison |
| Raw overlap | reserved | 7/16 | 43.75% | Not a ranking-baseline comparison |
| Substantive overlap | development | 16/16 | 100.00% | Not a ranking-baseline comparison |
| Substantive overlap | reserved | 16/16 | 100.00% | Not a ranking-baseline comparison |
| Co-citation | development | 7/16 | 43.75% | 2 / +5 |
| Co-citation | reserved | 9/16 | 56.25% | 2 / +7 |

The raw overlap oracle has only six seed windows and includes repeated website/copyright material; it is not 32 useful independent examples. The supplementary substantive and co-citation oracles were independently discovered and frozen before scoring. Each has 16 development and 16 reserved pairs; shared seeds, works and passages mean these are not independent statistical trials or document-disjoint splits. Recall applies only to these discovered sets, not exhaustive corpus recall. KR-110 question evaluation remains separate and its retrieval gate remains failed.

Failures and reviewed classifications:

- **wording:** explicit-attributed-quotation: 1; substantive-reuse-candidate-language-label-error: 2; publisher-boilerplate: 4; shared-biblical-text: 5; synthetic-editorial-marker: 3; same-work-excerpt: 3; same-work-edition-or-modernization: 3; same-work-translation-bibliography: 1; unattributed-anthology-repetition: 1; bibliographic-apparatus: 1.
- **cocitation:** shared-substantive-subject: 11; prooftext-apparatus-and-range-ambiguity: 2; prooftext-apparatus-and-citation-error: 1; prooftext-apparatus: 2; canonical-reference-mismatch: 3; table-of-contents-apparatus: 1; same-work-excerpt: 3; same-work-translation: 1.

Co-citation review by origin:

- requires-joint-signatures: 11/24 useful.

The review exposed systematic limitations: generated duplicate-page/gap markers can become wording anchors; unresolved work IDs allow reprints/translations through; detached prooftext notes lack paired interpretation; and inherited reference parsing can turn a following numbered book into an extra verse. Literal span/hash verification does not validate canonical book/verse interpretation. These findings block population quotation attribution and verified canonical-reference claims. Two useful Welsh wording samples are adjacent windows of the same source relationship. Retain these failures for a future separately evaluated correction; do not retune this frozen reserved set.

## Actual located queries

From Website, use the existing venv Python with `-m knowledge.library_analytics.relationship_query --window ID --other ID` to reconstruct a pair, or `--window ID --channel wording` / `--channel cocitation` for neighbors. `--author`, `--work` and `--language` filter recorded neighbor metadata; author membership does not attribute each sentence. Neighbors examine at most 200 ranked pairs. `query-examples.json` retains complete contexts, source spans, hashes, identity cautions and actual constrained query responses.

- **wording**, windows `5721008` → `6150813`: Ten sermons preached on various important subjects. By George Whitefield, A.B. ; Carefully corrected and revised according to the best London edition.; Ten sermons on the following subjects → Seeing Beauty and Saying Beautifully. reviewed-useful. Piper names Whitefield and introduces this passage with 'He said'; the located Whitefield sermon contains the matching argument about election and humility. Useful paired quotation witness; this supports the named quotation here, not general historical influence.
- **wording**, windows `2362280` → `2596047`: Taith neu siwrnai y pererin, tan rith neu Gyffelybiaeth Breuddwyd : yn yr hwn y dangofir, I. Y Modd y mae Pechadur yn Chychwyn ...; Pilgrim's progress. Welsh. 1688 → Cyfarwydd-deb pr Anghyfarwydd, sef, llyer yn cynnwys, 1. Agoriad byrr ar Weddi 'r Arglwydd. 2. Ymddidanion rhwng y Carwr a'r Cymro. 3. Ymddidanion rhwng Crist a'r Publican, rhwng Crist a'r Pharisaed, a rhwng Crist a'r Credadyn ammheus, sef Canwyll Crist. 4. Amryw Reolau Duwiol: : y cwbli gyfarwyddo pol 1, pa fodd i chwilio 'r ferythyrrau er lefadiw Heneidiau: a pha fodd i ddyfod at Grist i gael iechydwriaeth dragwyddol : a pha fodd i weddio yn fol ewyllys Duw, i gael gras a thrugaredd oddiwrtho ef, a pha fodd i fyw'n santaidd yn y Byd presennol.. reviewed-useful. Both windows contain the same extended Welsh numbered devotional rules, including prayer before sleep; this is more than a shared biblical phrase. The right window is incorrectly labelled English. The left is appended material in a Bunyan volume; compiler/translator authorship and independent-work identity remain unresolved.
- **cocitation**, windows `2174339` → `6714663`: The Doctrine of the Atonement → An exposition of Ecclesiastes, or, The preacher. reviewed-useful. Both prose contexts connect Isaiah 55:11 and 2 Corinthians 2:16 to God's word accomplishing life/death effects. This is a useful subject connection despite different broader arguments; it does not establish agreement or influence.
- **cocitation**, windows `2274011` → `4182510`: El sacrificio aceptable → Pecados secretos. reviewed-useful. Bunyan's Spanish instructions and the explicitly named Brooks excerpt both use Jeremiah 23:24 and Proverbs 15:3 for God's presence/knowledge of hidden sin. Both provide explanatory prose, making a useful subject link without implying agreement in all details.

The actual language constraints and impossible-author negative control passed. Reader destinations retain existing containing-book/unresolved states; no unsupported section deep links were invented.

## Integrity, dependencies and recovery

Population verification passed: 96 sampled paired source reconstructions; zero invalid postings/pairs and zero missing supported documents or inconsistent window counts. Joint reference-window coverage: `{'expected_reference_bearing_windows': 1220007, 'processed_windows': 1220007, 'ok': True}`. Location checks are not relevance judgments.

Thirty-six focused relationship/section/job tests and five existing concept compatibility tests passed. These cover normalization and bounds, changed-input rejection, changed-population feature invalidation, atomic rollback/resume, competing owners and unchanged default JobStore behavior. Full SQL plans use indexed left/right endpoint lookup; sampled ranked results match the preserved pre-optimization SQL, including high-degree endpoints.

Actual same-generation base interruption/resume preserved 256 nonempty documents and their postings/checkpoints. Actual joint interruption after two committed batches preserved 1,250 posting-bearing windows and 20,552 postings. Completed base and joint reruns passed idempotence without changing facts/checkpoints or summaries. Production processes were not forcibly crashed; crash/transaction cases are fixtures. Source/code/config/parent/query-helper/environment dependencies bind generations, with reverse dependency lookup and atomic jobs. Changed inputs require a new generation; cross-generation selective refresh and backup restoration are **not proved**.

Completed-run idempotence signatures cover job/checkpoint membership, document results, bucket results, joint batches/buckets and summary bytes/timestamps; they do not rehash every full-population posting. Actual interrupted-run proofs additionally hash the selected committed posting subsets. Repeated export validates the immutable files and returns unchanged; independent export verification decompresses all table rows, rather than claiming a second full regeneration.

## Unresolved coverage and bounded behavior

- unresolved work documents: **88,675**.
- unresolved edition documents: **97,007**.
- unresolved work native pool documents: **79,499**.
- unresolved edition native pool documents: **86,974**.
- Native-pool identities: `{'documents': 87054, 'known_work_ids': 7536, 'known_edition_ids': 80, 'retained_independence_groups': 25337}`.
- reference posting representatives omitted by the two-per-group bound: **12,160**.
- wording posting representatives omitted by the two-per-group bound: **3,355**.
- Joint posting representatives omitted by the group bound: **16,155**. These are feature-posting counts, not distinct omitted windows or missing pair unions.
- Different original bytes do not prove independent works. Repeated editions, common Bible wording, boilerplate, apparatus, overlapping reference ranges, numbering ambiguity and language-label errors require review.
- Wording uses 16-token shingles with 64-shingle winnowing; a shared normalized 79-token run wholly inside both windows guarantees an anchor. Shorter reuse, paraphrase, translation and matches crossing window boundaries can be missed. Features over 32 postings are retained but excluded from pair generation.
- Joint signatures use the first 12 distinct ranges ordered by retained witness start, at most 32 postings/signature and two windows/group. Reference association does not establish agreement.
- This processor selected no vector/model/build: semantic coverage is zero **for this processor**, not for the library. Existing embeddings remain intact.
- Originals, source/edition identities, contributor credits, Catholic cautions, historical releases and evaluation splits remain preserved. No human or independent review, public-use approval or full-current-corpus acceptance is claimed.

## Runtime and output paths

| Measurement | Value |
| --- | ---: |
| Observed base attempt elapsed lower bound | 8868.3 s |
| Document callback time sum | 3333.8 s |
| Base pair callback time sum | 202.4 s |
| Joint final attempt elapsed | 1548.7 s |
| Sampled peak process RSS | 19,711,963,136 bytes |
| Final SQLite bytes, including calibration | 35,719,516,160 |
| Independently verified release bytes | 5,037,716,310 |

Sampled peak file sizes: `{'relationships.sqlite3': 35407040512, 'relationships.sqlite3-shm': 187990016, 'relationships.sqlite3-wal': 96809992552}`. The immutable parent read cursor spans atomic joint posting batches and delays WAL recycling; sampled WAL peak is temporary disk demand, not final table size. No production checkpoint/kill was forced.

Runtime observations are lower bounds and sampled peaks, not continuous instrumentation. Process IO counters are not physical disk traffic. Callback sums are not total wall time; oracle discovery, review, verification and export costs are excluded. Operational profiles used different source strata and are not controlled performance comparisons.

Private database: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\KnowledgeBase\library-knowledge\connected-research\relationships\relationships.sqlite3`.

Immutable release: `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\KnowledgeBase\library-knowledge\connected-research\relationships\releases\kr120-release-79570e88c09eb13201a515ae`. All 114 manifest files passed independent hash/size checks, and all 16 gzip table exports passed decompressed row-count checks. A repeated export must return unchanged; see `export-repeat.log`.

Runtime receipts: `population.json`, `joint-population.json`, `coverage.json`, `runtime.json`, `quality.json`, `query-examples.json`, `population-verification.json`, `resume-verification.json`, `joint-resume-verification.json`, `idempotence-verification.json`, `query-equivalence.json`, `release-verification.json`; logs and profile/resource history remain beside them. `latest-relationships.json` selects candidate capability only. Exports are reproducible private artifacts, not a dependency-closed or off-device backup.

This completes the authorized KR-120 CPU handoff. KR-130 is the next roadmap stage and requires a new task authorization; all KR-090 and KR-110–170 tasks and the LK product/operation backlog remain in the existing ledger.

## Reproducible exported tables

| File | Rows | Compressed bytes |
| --- | ---: | ---: |
| `scope.jsonl.gz` | 214,449 | 69,728,139 |
| `dependencies.jsonl.gz` | 1,486,104 | 80,261,611 |
| `document_results.jsonl.gz` | 100,889 | 3,813,880 |
| `postings.jsonl.gz` | 23,775,152 | 3,178,232,263 |
| `feature_stats.jsonl.gz` | 17,478,355 | 733,414,276 |
| `pair_evidence.jsonl.gz` | 5,266,994 | 472,525,472 |
| `bucket_results.jsonl.gz` | 256 | 6,705 |
| `jobs.jsonl.gz` | 101,146 | 9,269,701 |
| `checkpoints.jsonl.gz` | 101,146 | 5,177,712 |
| `joint_postings.jsonl.gz` | 9,160,913 | 290,377,940 |
| `joint_features.jsonl.gz` | 5,445,034 | 54,591,043 |
| `joint_pairs.jsonl.gz` | 11,437,451 | 133,945,854 |
| `joint_batches.jsonl.gz` | 1,192 | 12,716 |
| `joint_buckets.jsonl.gz` | 256 | 3,865 |
| `joint_jobs.jsonl.gz` | 1,448 | 100,037 |
| `joint_checkpoints.jsonl.gz` | 1,448 | 78,448 |
