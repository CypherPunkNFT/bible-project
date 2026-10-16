# KR-110 populated concept index and reserved retrieval results

14 October 2026. Generation `kr110-54f0bfca9b30da6cc49b2347` completes the declared CPU lexical/reference population. The retrieval acceptance gate **failed**: this is a private located candidate index, not an accepted answer/attribution capability. No KR-120 or later work is started or authorized by this receipt. [Operator commands and contracts](CONCEPTS.md), [working SQL](concept-queries.sql).

## Population and dependencies

The index pins KR-101 `kr101-31239794030518bcb2299a31`, KR-102 `kr102-1b03f58bf6e6749f9170bf38`, corpus build `2026-10-13T23:47:33.488164+00:00`, and reader generation `d9f84a4cd33e439ac3e5d10e3c00b3ac7c25d302853a598ef35272e99cb03264`. Original files and upstream stores are read-only inputs. Existing vectors, completion owners, graph/public writers, credits, editions and Catholic cautions are preserved.

| Populated data | Count |
| --- | ---: |
| Supported documents/XML entries | 100,889 |
| Source section records | 1,161,753 |
| Located windows / FTS rows | 7,920,214 |
| Concept occurrences | 12,456,231 |
| Literal reference occurrences | 9,531,563 |
| Rejected reference candidates | 394,658 |
| Succeeded capture/document jobs | 100,890 |
| Failed jobs | 0 |
| Contributor membership rows | 44,592 |
| Dependency rows | 1,486,104 |
| Versioned rules | 134 |
| Development/reserved question evidence rows | 1,199 |

The supported population comprises 61,708 XML entries and 39,181 cache documents. Indexing covered 12,253,225,179 codepoints across overlapping representations; this is not a count of unique text or books. The full descriptor table also retains 113,557 adapter deferrals and three archive exclusions (214,449 rows total). There are 11,225 verified distinct work IDs; 38,202 source-byte deduplication groups are not additional verified works.

Window states: 3,248,544 native/recorded; 3,776,400 unreviewed candidates; 895,270 document fallbacks. Default queries exclude the latter two. 87,054 supported documents have a native structural search pool; 13,835 do not. The concept query's 160-codepoint floor leaves 2,693,883 windows in 52,498 documents before its 35 alphabetic word-form and apparatus filters. Those further filters are applied per query candidate, not a whole-population census. Short passages and scripts without whitespace segmentation may be omitted. Index completeness is not default-query coverage of every document.

## Frozen evaluation and actual reviewer

The original 120 intents remain split into 72 development and 48 reserved questions, eight reserved questions per family. Evidence rubrics and lexical baseline were frozen before tuning. Query v2 was fixed before reserved evaluation; the 14 available v1 development baseline results were reproduced exactly. All 72 v2 development questions completed. No reserved-question tuning was performed.

Reviewer: **model-assisted Codex implementation agent; no human or independent reviewer**. The same agent inspected full pooled located contexts in stable shuffled order with retrieval mode and rank hidden, and recorded explicit window IDs, context judgments and failure reasons. This reduces rank visibility but is not independent blind review. Questions are held out; topics and documents are not disjoint. Deterministic source reconstruction is a separate check. There is no exhaustive gold-span set and no recall estimate.

| Reserved metric | Frozen baseline | Concept v2 |
| --- | ---: | ---: |
| Useful completion in top five | 23/48 (47.92%) | 25/48 (52.08%) |
| Precision at five, all 240 slots | 38.75% | 34.17% |
| Mean reciprocal completion rank | 0.36007 | 0.35729 |
| Relevant / adequate-context results | 93 / 93 | 82 / 82 |
| Returned results | 240 | 239 |
| Known work groups summed by question | 45 | 48 |
| Results with unresolved work identity | 193 | 189 |
| Results with contradictory author metadata | 0 | 0 |
| Median query seconds | 2.3205 | 3.7427 |
| P95 query seconds | 10.0756 | 17.4422 |
| Total reserved query seconds | 167.4573 | 239.6811 |

Gain: two additional completed questions (+4.17 percentage points), with **4.58 percentage points lower precision**, slightly worse reciprocal rank and longer queries. Timings include search and source reconstruction; author comparisons sum their constrained calls and timings exclude engine initialization. Development query totals were 195.23 / 327.87 seconds.

Three questions improve from failed to useful completion: Brooks/Goodwin on temptation, spiritual dryness, and Keach's catechetical context. One regresses: the 1677/1689 Baptist confession witnesses. This is a net gain of two, not uniform improvement across the benchmark.

| Reserved family (8 each) | Baseline useful | Concept useful |
| --- | ---: | ---: |
| Passage exposition | 8 | 8 |
| Author comparison | 3 | 4 |
| Practical sermons | 4 | 5 |
| History | 4 | 4 |
| Multilingual | 4 | 4 |
| Quotations/parallels | 0 | 0 |

Thirteen questions are explicitly capability-deferred and remain in the denominator: eight quotation/parallels, four multilingual and one history question. Of the other 35 questions, ten fail concept completion. Paired author comparisons require both selected authors. Local bilingual results may satisfy both evidence groups within one window only when it physically contains both passages; quoted Latin propositions and English renderings do not establish global translation alignment, translator identity or a verified direct quotation from the historical person being discussed.

The frozen gate requires at least 85% useful questions and at least 95% location **and attribution** precision. Source/hash checks pass, but speaker/endorsement precision is not established, and useful completion is only 52.08%. `latest-concepts.json` therefore selects candidate capability only; this run must not promote `latest-retrieval.json`.

Failure classes include one-sided author comparisons, ambiguous Barnes/Collins identity, anthology contributors and editorial notes masquerading as book-author prose, quoted opponents, topic-sense confusion, headings/reference lists without exposition, navigation/apparatus noise, genre mismatch, repeated editions, missing paired quotation endpoints, and absent Greek/Latin source passages. Composite author metadata remains a risk even when no metadata contradiction is detected. Author constraints prove source metadata membership, not authorship of every sentence. Complete per-question judgments and failure classes are exported.

## Actual located queries

Run the commands in the operator contract with the selected generation. `query-examples.json` contains seven executed queries and passing author/work/language constraint assertions, including a nonexistent author returning zero results. Coordinates below are half-open Unicode codepoints within the identified source segment; these are not reader page URLs.

| Query / constraint | Actual result | Window / source coordinates |
| --- | --- | --- |
| justification faith; author John Owen; language en | *The Doctrine of Justification by Faith*, “3. The Role of Faith in Justification” | 1310653; [9000,10800) |
| justification faith; author John Gill; language en | *The Blessings of Grace*, “OF JUSTIFICATION” | 3128658; [25200,27000) |
| Romans 4 Abraham faith | Piper, *The Mighty and Merciful Message of Romans 1–8* | 3427592; [10445,11052) |
| faith; verified work `work-reconciled-fe02cd9f36229ead84339c10` | *109 Sermons by J.C. Ryle*, “Where Are Your Sins?” | 3501075; [76583,78383) |

Owen's section version is `section-version-593def72671124658acd6fbe2e0e03147e667161274712391a18778701904846`; Gill's is `section-version-5290a5674f645829f8461e92bb16abc10bee478e2f2373735fa057e3c25b839a`. Full identities, contexts and other examples are in the receipt. The assurance query's first Rutherford result describes opponents' claims: it must not be presented as his endorsed teaching. The Latin constrained example is lexical evidence only. KR-102 containing-book/unresolved navigation remains explicit.

## Verification, operation and limitations

Calibration processed 291 documents, 116,090 windows, 56,350 concepts and 222,115 references, with 203 source checks. The optimized matcher preserved exact fact hashes against the previous matcher. Population verification reconstructed 2,818 source witnesses with zero failures, found zero concept/reference bounds violations, and matched all 7,920,214 FTS rows. SQLite quick_check passed. Forty-two focused tests passed.

Facts, token inserts and checkpoints commit atomically in batches of at most 16 under the existing global analytics lease and a local JobStore lease. The actual interrupted selected generation resumed to completion; a 256-document committed sample retained identical facts, attempts and checkpoints. A completed-run idempotence test preserved all 100,890 jobs/checkpoints, 100,889 document result hashes and population receipt hash/mtime. Source/code/rule/parent dependencies are checked before reuse; changed inputs reject stale reconstruction and select a new generation for full rebuilding. **Cross-generation selective refresh and backup restoration are not claimed or tested.**

Observed selected-generation attempts total at least 8,105.51 seconds (~2 h 15 min), including interruptions and validation; committed document processing totals 4,146.48 seconds. Sampled peak RSS was 1,683,898,368 bytes. Database size at the runtime receipt was 26,237,800,448 bytes, including retained earlier/calibration generations. These are measured scope-specific figures, not total project compute or a continuously measured memory peak.

Unresolved supported-document counts: work identity 88,675; edition identity 97,007; missing author label 69,664 (some have explicit contributor roles); conflicting author metadata 38; non-English/early-English topic-rule deferrals 1,312. Semantic processing is disabled for all 100,889 supported documents: selected vector/model/build identity is null and semantic coverage is zero. No new encoder or vector writer was started. Upstream four missing corpus documents, one source-path conflict, 2,367 representation-only cache documents, 113,557 adapter deferrals and three archive exclusions remain inherited limitations.

## Runtime and reproducible outputs

All paths below are under `KnowledgeBase/library-knowledge/connected-research/concepts/`:

- `concepts.sqlite3`: populated windows, concepts, references, contributors, dependencies, rules, jobs/checkpoints and question evidence.
- `releases/kr110-54f0bfca9b30da6cc49b2347/`: deterministic gzip JSONL tables, checksummed manifest, frozen results/judgments, operator commands, code and verification receipts.
- `evaluations/kr110-54f0bfca9b30da6cc49b2347/quality.json`: aggregate and per-question evidence; `review-notes/` retains reviewer-authored inputs.
- `population-verification.json`, `resume-verification.json`, `idempotence-verification.json`, `coverage.json`, `runtime.json`, `query-examples.json`, `tests.log`: detailed receipts.
- `release-verification.json`: separate exported-file checksum, size and decompressed row-count verification.

Final independent export verification passed for **54 files totaling 1,455,898,947 bytes**, including row counts for all 11 gzip tables. Repeating `concept_release --export` returned `unchanged: true` after verifying the immutable file hashes; `release-idempotence.log` records the result. The selected pointer exposes candidate capability only, this generation has no accepted-retrieval pointer, and its local writer lease is released.

Exports require the pinned source and section dependencies to reconstruct FTS and text; they are not a dependency-closed backup. No Git commit, remote backup, scheduled refresh or deployment is claimed. Preserve the full KR-090/KR-110–170 and LK backlog; the next roadmap stage is KR-120 only after new authorization. Retrieval gate remediation remains an explicit unresolved KR-110 acceptance item.
