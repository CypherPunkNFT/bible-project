# Corpus distillation pilot protocol

18 October 2026. Expanded planning specification for the [master plan](../CORPUS-DISTILLATION-MASTER-PLAN.md). No retrieval experiment, source repair, live candidate edit or owner decision is executed by this document. [Baseline observations](baseline-2026-10-18.json) establish the starting proposals and saved receipts.

## Purpose and first useful deliverables

Show that better source selection, context, attribution and quality checks make a small set of existing candidates materially more useful. The first outputs are a source-quality audit, a reproducible retrieval comparison, six before/after dossiers and clear reasons for holding unsuitable material. A failed experiment is a useful result when it identifies which method or source dependency failed; it is not permission to expand until numbers look better.

Begin with a 12-document and 12-query feasibility rehearsal using existing immutable evidence. Measure source access, reviewer minutes, query cost and context reconstruction before committing to the larger pilot. If the proposed full audit is unaffordable, reduce its scope and predeclare the revised sample/evaluation limits before exposing held-out labels. Do not quietly drop difficult languages or known failures to improve scores.

Begin the source-readiness rehearsal with A. A. Hodge's *Outlines of Theology*, preserving the owner's 16 October holdings-first order. Resolve held original, extraction completeness, edition/author identity and actual reader behavior as distinct questions. Use the existing `supper` proposal rather than creating another Hodge candidate.

## Readiness checklist

1. Current corpus completion owner supplies a coherent snapshot or an explicitly bounded unchanged scope. A live build remains protected. The saved parity receipt alone is insufficient while late-source reconciliation is underway.
2. Record corpus/model/Lance/index, analytical generation, code, quality-policy and identity-mapping versions. Retain and demonstrate access to the source, vector-fragment and index dependencies behind pinned versions. No vacuum/cleanup of required files during the experiment.
3. Verify candidate IDs and current proposal fingerprints from a consistent curation export. Do not call `sync`, `prepare`, `decide`, `nominate` or `discover` on the live API for a planning exercise.
4. Declare source-reader mappings, supported languages, reviewer competence, sampling frame, model-call/resource ceilings, review budget and cancellation behavior.
5. Keep KR-130 retired. Use existing literal evidence and scoped candidate explanations, not a recreated argument extraction pipeline.

## Six candidate cases

The IDs below exist in the captured 21-item catalogue. Their titles express proposals, not newly verified findings. Their source evidence and existing limits remain unchanged.

| Candidate ID | Proposed question for enrichment | Principal risk to test | Useful before and after comparison |
| --- | --- | --- | --- |
| `ephesians-guide` | Which held texts genuinely explain each of the six chapters, and where can the reader inspect them? | Structural links versus substantive exposition; unresolved locations and gaps; repeated editions | Chapter coverage by located independent works, repaired/narrowed links, retained conflicts and actual reader destinations |
| `supper` | What do Hodge's actual questions and source passages support about the Lord's Supper? | Incomplete source readiness; the identity of A. A. Hodge versus another Hodge; question lists versus exposition | Verified held text and edition, explicit question/prose roles, surrounding treatment and correct reading destination |
| `justification` | What do the identified Gill and Boyce passages actually say about faith and justification? | Quoted opponent, ambiguity of faith's role, wrong author/work or missing qualification | Side-by-side exact passages, voices/qualifications and source-specific differences without fabricated agreement |
| `quotation` | Can the proposed Piper and Whitefield quotation trail be located and its attribution bounded? | Shared quotation mistaken for independent support or proof of borrowing direction | Named speaker/source witness, edition/quotation trail, unresolved steps and a narrower explanation where required |
| `editor-voice` | Where does the retained witness switch between an original author and an editor? | Editorial preface or note presented as author prose | Explicit local speaker boundaries and source evidence for the attribution |
| `caritas` | What can one identified commentary witness support about caritas, charity and love? | Translation variation, script/language handling and overgeneralizing one witness | Exact language and context, limited lexical explanation and clearly scoped comparison |

Keep `father-gloss`, the existing Hebrew/Aramaic dictionary proposal, as a protected short-text/script control in the wider 21-item audit and sampling design. It tests whether cleaning rules suppress legitimate specialist entries. It is not a seventh promoted dossier in this first batch.

The wider 21-candidate desk audit records source availability, primary blockers and intended visitor benefit. It does not label every candidate good or bad from metadata alone. If one of the six lacks accessible evidence, retain that as a failure or predeclare a substitution with its reason; do not silently replace it after seeing poor results.

## Candidate audit form

For each item, record the original proposal fingerprint, exact reader task, intended destination and competing existing-site treatment. For each proposed source, record work/edition/asset, speaker roles, exact span/hash, neighboring context, extraction version, source-use conditions and reading resolution. Mark each finding with an evidence pointer, scope, assessor type and uncertainty.

Use separate dispositions: usable for the stated task; useful but text repair required; identity/attribution unresolved; apparatus/reference use only; another representation preferred; unrelated to this task; contrary/qualifying evidence; stale mapping; and insufficient evidence. These are proposed annotations, not new live curation states. The existing queue's approved/integrated distinction remains intact.

Record why the dossier improved: a better witness; more complete context; corrected attribution; a distinct source; a meaningful disagreement; a repaired reference; a more useful reading target; or a necessary narrowing of the claim. “Higher cosine score” is not a dossier improvement.

## Document and source sample

Propose 240 distinct document records with explicit representation/work/asset links. A document record may be a lexicon entry or derived page; it is not necessarily a book. Keep primary bibliographic works, editions and representation counts separate.

| Group | Proposed size | Selection | Permitted inference |
| --- | ---: | --- | --- |
| Probability sample | 120 | Random selection within a frozen, modest set of source/format strata; language, period and size coverage recorded | Weighted document-record estimates only where inclusion probabilities are known; work-cluster estimates require their own sampling design |
| Suspected defects | 80 | Existing flags, known OCR cases, synthetic markers, duplicate groups, attribution conflicts and unusual neighborhoods | Precision and repair usefulness in an enriched triage set; not corpus prevalence |
| Protected difficult evidence | 40 | Short entries, early spelling, Greek/Hebrew/Latin, mixed-language text, unusual genres and rare topics | False-suppression checks for named strata, not a claim of all-language coverage |

Establish disjoint membership by record and note shared work/asset clusters across groups. If risk/protected cases are also randomly selected, preserve their probability-sample membership and assign replacements in the supplemental groups before review; do not distort the random sample by removing inconvenient overlap. Account for cluster dependence in uncertainty estimates. Unknown identities stay explicit, including when independence cannot be assessed.

For each document, review at least three distributed regions, including a body region and any flagged seam/region, or all available text when fewer than three distinct regions exist. For long works, record the limited inspected coverage. Seek source images or native XML for suspected errors. The rehearsal determines whether a proposed 60-page OCR ground-truth subset has enough accessible, representative material; freeze its final composition before comparing repair methods.

Source-grounded OCR checks distinguish missing content, bad character recognition, reading order, column mixing, clipping, repeated page/header, apparatus, legitimate historical orthography and substantive edition variation. Transcribe reference regions against the source; preserve the transcription/normalization policy. Measure CER/WER only where that reference exists. A fluent model reconstruction or majority reading of other editions is not ground truth.

## Reader tasks and leakage control

Propose 120 new tasks: 60 development and 60 held-out. Each split has 50 answerable tasks and 10 negative/insufficient-evidence tasks. Draft them from a frozen task taxonomy and source coverage, not from the winning outputs of the new retriever.

The answerable tasks span passage exposition, named-author/work lookup, historical versus modern vocabulary, quoted opponents and qualifications, quotation/edition relationships, practical reading and language tools. Some tasks seek differences or contrary evidence. A positive answer must have source-checked evidence in the declared scope, not merely an annotator's belief that the wider library probably contains it.

Negative cases include a deliberately wrong author attribution, unsupported quotation direction, insufficient evidence for a historical assertion, a mismatch between exact reference and discussion, and a question outside the declared scoped evidence. Distinguish “known invalid premise,” “no located support in this scope” and “capability deferred.” Do not treat corpus absence as proof that no source anywhere addresses the question.

Score abstention on an explicit evidence-sufficiency/dossier decision. Merely returning five retrieval candidates is not an assertion or fabricated answer. At the retrieval-only stage, measure whether relevant evidence is absent or a false lead is presented as support; assess unsupported claims only when an explanation actually makes one.

Split by confirmed work/source family wherever possible. Reprints and translations of one work must not leak between development and held-out evidence unnoticed. Ambiguous family identities are either grouped conservatively or reported as unresolved leakage risk. Keep old reserved KR/LK failures as a separate diagnostic suite. Their labels are already known and cannot serve as fresh held-out proof.

## Retrieval conditions and pooled judgments

Run lexical-only, current concept/reference lookup, semantic-only, unchanged current hybrid, and hybrid with proposed quality/diversity controls. Optional reranking is a sixth condition only after the first comparisons and its separate budget pass. Apply the same frozen eligible population and task constraints; a historical small-scope hybrid run cannot be compared directly with a new full-corpus run and attributed solely to a method change.

Capture the final five for each method, their context and discovery basis. Pool and deduplicate identical source spans across methods; also include a predeclared sample of displaced/filtered results and channel disagreements to measure lost useful evidence. Hide method labels and original rank during judging. Preserve enough source identity to assess speaker, context and independence. Record unjudged/uncertain explicitly; missing labels are not irrelevance.

Six methods × 60 queries × five results can yield 1,800 result occurrences before source deduplication. Set a maximum of 1,200 unique source-window judgments and 60 reviewer hours for each split, inclusive of context and the displacement pool. Set aside at least 20% of that capacity for displaced/filtered controls. If all mandatory final results plus the declared controls do not fit, stop: reduce conditions or scope using development results before the held-out run, or report a partial evaluation with no overall acceptance claim. Do not trim the held-out pool after inspecting which method would lose.

A second assessor reviews a blinded subset of at least 20% of judgments and every critical attribution/location dispute; record whether that assessor is a model or a suitably competent person. A second model is not independent human validation. If human/specialist capacity is unavailable, label the result exploratory and restrict promotion accordingly. Preserve raw labels, disagreements and adjudication reasons.

## Measures and decision rules

Measure exact source/reader location, graded relevance, context sufficiency, speaker correctness, work-family diversity, apparatus/duplicate rate and appropriate abstention. Report conventional relevance precision at five separately from useful independent evidence per five slots. Whether alternate editions count as useful distinct results depends on the task, declared before evaluation. Report question success only on answerable tasks and negative-task behavior separately.

Freeze the final numerical comparison rule after development and before generating held-out method outputs. Proposed starting policy:

- At least 43/50 answerable held-out tasks have useful source-grounded evidence in the top five. This is a bounded candidate-enrichment target, not a change to the historical KR-110 gate or accepted-release pointer.
- Compare against both lexical and unchanged hybrid baselines. The enhanced method must not materially regress in usefulness, precision, critical attribution errors or useful-evidence retention. Where a baseline has enough misses, target at least a 20% reduction in missed answerable tasks. Where development establishes a near-ceiling baseline, use a predeclared tolerance plus an operational benefit such as at least 20% lower median dossier-review time; do not demand a mathematically impossible fixed gain.
- For the six proposed promotion dossiers, every quoted span is reproducible and all critical speaker/endorsement and locator problems are resolved or explicitly block the relevant claim. A readable wrong attribution fails.
- Report outcomes for all ten negative tasks: correct abstention, unsupported claims, wrong attributions and capability deferrals. No known critical unsupported assertion enters a promoted dossier.
- For high-priority repair flags, initially target at least 85% confirmed actionable findings on the reviewed triage set, with raw counts and intervals. Compare against probability-sampled unflagged controls to expose misses; do not claim a whole-corpus detector recall from risk cases alone.
- Report useful material suppressed by each rule, including the protected difficult cases. Investigate every false suppression in those reviewed cases before enabling a rule in their scope.

Report paired wins/losses, per-task and per-stratum outcomes, uncertainty and assessor types. Small numbers of near-ceiling tasks cannot demonstrate a general statistical guarantee. An improved median or an aggregate score must not hide a rare-language or attribution regression. A method can be retained only for the subset where it is supported.

## Resource rehearsal and stopping

The first 12-query run has a proposed 15-minute wall-time ceiling, 16 GB additional RAM and 10 GB scratch. These are alarms for investigation, not predictions. Cap each retrieval channel at 50 retained leads per query before deduplication, five final results and the declared displacement sample. Record query p50/p95, source-fetch time, model loading/inference, index/read overhead, output bytes and peak memory/disk. Test with a warm and cold index when practical.

No automatic model call for each corpus passage. For the six dossiers, propose no more than 40 model-assisted interpretation/reranking calls or 200,000 input tokens, whichever comes first, only after GPU ownership and the source-generation gate are satisfied. Keep model labels separate from source-verified facts; preserve prompts/model version and costs. No external model/service upload is implied by this local plan.

Pilot review capacity and query cost must be measured before larger scans. Proposed maximum 12 new shadow discoveries; the six existing dossiers are not duplicated into live drafts. Use the existing owners and JobStore coordination. Do not add a service, port, recurrent watcher, full-matrix load or corpus-wide pair comparison.

## Selective repair and refresh rehearsal

After retrieval benefit is established, select at most 20 documents or 200 source pages for a separate repair rehearsal. Keep original bytes and prior extracted text. Record proposed source-verified diffs, affected section/span/chunk identities and model input changes. Obtain the existing source owner's application path; do not patch live corpus rows from a candidate script.

Rebuild only the necessary representations/mappings and embeddings where their actual inputs or identities changed. Retain model/revision/dimensions and old release dependencies. Include an unchanged control document and a changed title/locator case; current IDs can depend on metadata as well as text. Check source hashes, vector ID parity, stale removal, duplicate prevention, reader bindings and affected dossier digests. A new retrieval population can invalidate rankings beyond the directly edited source.

The candidate adapter must materialize new external dependencies into the compiled proposal fingerprint before existing stale detection can help. Test changed text, quality rule, attribution, work grouping and generation mapping; confirm old owner decisions survive in history and never transfer silently. Curation JSON exports alone do not prove a consistent backup or restoration. Prove a dependency-closed backup and isolated restore before promoting schema/store changes.

## Expected experiment artifacts

| Artifact | Contents |
| --- | --- |
| Stable input manifest | Retained sources, vectors/index version, analytics generations, code/rules, identities and candidate fingerprints |
| Sampling manifest | Eligible frame, chosen records/clusters, probabilities, protected/risk membership and explicit exclusions |
| Task manifest | Development/held-out separation, answerability class, expected constraints and leakage checks |
| Judgment records | Pooled source windows/context, raw labels, assessor type, uncertainty, disagreements and adjudication |
| Comparison report | Matched retrieval/quality ablations, false suppression, attribution, useful work coverage and resource cost |
| Six candidate dossiers | Original proposal reference, strengthened evidence/limitations, blockers and exact before/after differences |
| Repair proposal | Source witnesses/diffs, affected dependencies, expected re-embedding and rollback evidence |

These are logical deliverables, not a requirement to create one report per input file. Use existing stores/contracts and one concise experiment report with machine-readable records. Keep private source bodies out of `public/` and `dist/`. The local Candidates queue receives revisions only through a deliberately implemented, tested adapter and the existing owner review workflow.

## What has actually started

The planning baseline script read saved JSON receipts/projections, hashed selected implementation and result documents, and fetched only the Candidates HTML. It wrote only this planning folder. It did not query or change the corpus/curation databases, call candidate mutation endpoints, run an encoder, rebuild indexes or start mining. The master plan was then critically reviewed for sampling, source retention, existing hybrid baselines, evaluation ceilings and the current limits of automatic invalidation. Those corrections are incorporated here before implementation.
