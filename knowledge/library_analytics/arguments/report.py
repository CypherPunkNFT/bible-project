"""Render task-specific delivery and exact coordinator reconciliation text."""
import json,time
from pathlib import Path
from collections import Counter
from .inputs import ROOT,read,ro,sha,write_json

def generate_report():
    pop=read(ROOT/'population.json');rid=pop['run_id'];verify=read(ROOT/'population-verification.json');quality=read(ROOT/'evaluation/reserved-metrics.json');splits=read(ROOT/'evaluation/split-audit.json');proof=read(ROOT/'population-resume-proof.json');db=ro(ROOT/'arguments.sqlite3')
    stats={
      'statement_kinds':[dict(r) for r in db.execute('SELECT kind,count(*) rows FROM statements WHERE run_id=? GROUP BY kind',(rid,))],
      'speaker_roles':[dict(r) for r in db.execute('SELECT speaker_role,count(*) rows FROM statements WHERE run_id=? GROUP BY speaker_role',(rid,))],
      'endorsements':[dict(r) for r in db.execute('SELECT endorsement,count(*) rows FROM statements WHERE run_id=? GROUP BY endorsement',(rid,))],
      'link_kinds':[dict(r) for r in db.execute('SELECT kind,count(*) rows FROM argument_links WHERE run_id=? GROUP BY kind',(rid,))],
      'contributor_roles':[dict(r) for r in db.execute('SELECT role,count(*) rows FROM contributors WHERE run_id=? GROUP BY role',(rid,))],
      'qualifications':db.execute('SELECT count(*) FROM statements s JOIN qualifications q ON q.statement_id=s.id WHERE s.run_id=?',(rid,)).fetchone()[0],
      'named_report_or_quotation_candidates':db.execute("SELECT count(*) FROM statements WHERE run_id=? AND speaker_label IS NOT NULL AND speaker_role IN ('reported-speaker','quoted-speaker')",(rid,)).fetchone()[0],
      'verified_nonnull_work_ids_with_candidates':db.execute('SELECT count(DISTINCT work_id) FROM statements WHERE run_id=? AND work_id IS NOT NULL',(rid,)).fetchone()[0],
      'verified_nonnull_edition_ids_with_candidates':db.execute('SELECT count(DISTINCT edition_id) FROM statements WHERE run_id=? AND edition_id IS NOT NULL',(rid,)).fetchone()[0],
      'database_bytes':(ROOT/'arguments.sqlite3').stat().st_size,
      'unreconstructable_native_representations':db.execute('SELECT count(*) FROM reconstruction_deferrals WHERE run_id=?',(rid,)).fetchone()[0],
    }
    deferrals=Counter()
    for r in db.execute('SELECT deferrals_json FROM document_results WHERE run_id=?',(rid,)):deferrals.update(json.loads(r[0]))
    stats['deferrals']=dict(deferrals);db.close();write_json(ROOT/'coverage-details.json',stats)
    table=['| Metric | Frozen baseline | KR-130 |','| --- | ---: | ---: |']
    for name in ['rhetorical_type','attribution','protected_non_author','negation','qualification_scope','complete_located_unit']:
        base=quality['summary']['baseline'][name];new=quality['summary']['processor'][name]
        table.append(f"| {name.replace('_',' ')} | {base['correct']}/{base['cases']} | {new['correct']}/{new['cases']} |")
    examples=read(ROOT/'examples.json');example_lines=[]
    for q in examples['queries']:
        if q['results']:
            s=q['results'][0];example_lines.append(f"- Query `{q['query']}`, constraints `{json.dumps(q['constraints'])}`: `{s['id']}` in **{s['source_metadata'].get('title')}**, `{s['source_span']['coordinate']}` block {s['source_span']['block_ordinal']} [{s['start']},{s['end']}); kind `{s['kind']}`, speaker role `{s['speaker_role']}`, endorsement `{s['endorsement']}`. Full located witnesses, original credit/cautions and reader states are in `examples.json`.")
        else:example_lines.append(f"- Query `{q['query']}` with `{json.dumps(q['constraints'])}` returned no candidate; recorded rather than fabricated.")
    counts=pop['counts'];scope='\n'.join(f"| {x['disposition']} | {x['documents']:,} | {x['reason']} |" for x in pop['scope'])
    kinds='\n'.join(f"| {x['kind']} | {x['rows']:,} |" for x in stats['statement_kinds'])
    result=f'''# KR-130 result: populated private surface argument candidates

14 October 2026. Run `{rid}`. The declared source population is processed and located queries work. **Full attribution and qualification acceptance failed.** This delivery remains private candidate capability; no global latest pointer, public integration, KR-150, refresh or backup integration was started.

The processor pins `kr101-31239794030518bcb2299a31` and `kr102-1b03f58bf6e6749f9170bf38`, binding the historical sections to corpus build `2026-10-13T23:47:33.488164+00:00` and captured reader generation `d9f84a4cd33e439ac3e5d10e3c00b3ac7c25d302853a598ef35272e99cb03264`. Immutable parent identities and SHA256 proofs are in `WORKSTREAM.json`, population contract and dependencies. No concurrent refresh/backup/KR-140 output or KR-110/120 candidate is an input. Embeddings and generation models are not required.

## Actual tables and supported scope

| Output | Count |
| --- | ---: |
| Processed supported documents/XML entries | {counts['processed_documents']:,} / 98,733 |
| Located sections considered | {counts['sections']:,} |
| Source segments considered | {counts['segments']:,} |
| Candidate statements, including quotation subspans | {counts['statements']:,} |
| Qualification witnesses | {counts['qualifications']:,} |
| Structural argument links | {counts['links']:,} |
| Explicit native-render reconstruction deferrals | {stats['unreconstructable_native_representations']:,} |
| Named report/quotation speaker-label candidates | {stats['named_report_or_quotation_candidates']:,} |
| Verified work IDs represented by candidates | {stats['verified_nonnull_work_ids_with_candidates']:,} |
| Verified edition IDs represented by candidates | {stats['verified_nonnull_edition_ids_with_candidates']:,} |

| Statement type | Rows |
| --- | ---: |
{kinds}

| Scope disposition | Documents/entries | Reason |
| --- | ---: | --- |
{scope}

English is the captured `en` label, not a detected language. Other language labels, missing immutable adapters and original archive exclusions remain explicit. Every parent descriptor is accounted for. Later acquisitions are outside this historical run. Document/page representation fallback is explicitly coarse; native sections are preferred for full-clause containment. Unreviewed headings are excluded. Same-location overlap is deduplicated within a representation, while separate source representations retain their actual coordinates. Counts are overlapping sections/entries/candidates, not independent books or doctrinal agreements.

`coverage-details.json` records unmarked, short/oversized and duplicate clauses, coarse fallback, empty cases, speaker/endorsement states, link types and contributor roles. Unsupported implicit argument inference, missing premises, exact quotation-source identities, cross-sentence/source-block quotations, OCR repair, logical negation scope and multilingual rules are not represented as accepted claims. The inherited metadata includes mixed authors/editors/translators and licence/credit/Catholic cautions, retained verbatim in scope/query responses. Reader membership is not converted into author attribution.

`reconstruction_deferrals` records historical native HTML/XML renderings that cannot reproduce their pinned block hashes even though their original bytes match. No approximate text or invented offsets are accepted; a document's exact captured-cache representation remains eligible where available. This is a declared representation deferral, not an acquisition/import hold. Genuine changed bytes still reject the job. Earlier attempts and their failed/stale jobs are retained, including the initial missing `typing_extensions` dependency and native-render mismatch. The dependency was repaired only inside owned outputs and each changed processor/environment condition produced an explicit new generation with no earlier-fact reuse.

## Frozen quality measurement

The separate KR-130 split contains {splits['cases']} fresh difficult cases: 51 development, 70 reserved, across {splits['documents']['development']} development and {splits['documents']['reserved']} reserved documents. Source documents and recorded original hashes are disjoint; only a small subset has verified work IDs. There are no overlapping verified work IDs, but unknown identity does not prove independence. The original KR/LK evaluation splits are untouched. Initial native-source cases and an additional coarse-location stratum were both frozen before development tuning. The coarse stratum was necessary because many modern texts have only representation roots. Original frozen files remain unchanged.

Reviewer: **model-assisted implementation-agent source/context review**, using the GPT-6 session model; exact backend revision and session cost are unavailable. Prompt/rubric version is `kr130-content-rubric-v1`. There were zero external generation/API calls and zero external API cost. No human or independent content review is claimed. Source judgments are separate from extraction outputs, and extractor semantics were frozen before reserved cases were opened. A later pre-population storage fix retained qualifications on quotation subspans; it did not change frozen classification rules or tune against reserved results.

{chr(10).join(table)}

Negation improves by 21/70; qualification witness retention improves by 24/33. Rhetorical reading improves by 2/70. Attribution-role/candidate correctness worsens by 3/70; the 95% attribution and scope gate fails. This metric uses the frozen source-author-label convention for ordinary author narration; it is not independently validated canonical speaker-identity precision. All 42 reviewed non-author cases retain unresolved/not-endorsed treatment, but abstention does not resolve their true speaker. Qualification scoring requires source limiting words, not merely a matching cue; historical spelling and broken clauses are counted as failures. These purposive difficult cases do not estimate random-population precision.

Failure classes include pronoun speakers requiring earlier context; Scripture treated as anonymous narration; quoted adversary first-person speech; contents/publisher/editor voice; ambiguous composite authors/translators; archaic spelling, Welsh mislabeled English, OCR/page/paragraph fractures; and qualifications outside the sentence/cue grammar. `reserved-metrics.json` records every decision, located source case, prediction and failed metric. No accepted theological interpretation, influence or endorsement is exported.

## Actual located queries

{chr(10).join(example_lines)}

Queries reconstruct source text and qualifier witnesses against exact hashes, return neighboring source context, source metadata, contributor roles, bounded KR-102 overlapping chunk pieces and real containing-book/unresolved destinations. The existing reader does not select pages/sections by URL. Detailed chunk pieces are capped at 20 and explicitly labelled. Author restrictions constrain the source document, not the actual speaker. `queries.sql` and the package README contain reproducible commands.

## Recovery, resources and reproducibility

The existing global analytics lease serialized KR-130 after other live owners; no lease was bypassed. One below-normal-priority native Python worker uses existing JobStore, FULL-synchronous WAL and atomic groups of at most 16 documents. Real calibration and population checkpoint/resume preserved committed facts and attempts; the population proof covers {proof['actual_interrupted_committed_documents']} already committed documents. A completed rerun returned unchanged. A separate real child process-death fixture rolled back uncommitted facts and recovered the abandoned job exactly once. Focused tests include actual production nested-span/qualification/quotation writes, live-owner refusal and changed-source rejection.

Population verification is `{verify['ok']}`: {verify['witnesses']['passed']} independently reconstructed located witnesses, {verify['witnesses']['failed']} failed; source/qualification bounds, complete job/document accounting, FTS/table equality, link endpoint closure and SQLite integrity were checked. Source bytes are SHA256-checked on reconstruction; the complete pinned file stat index also guards skipped jobs. Changed rule/config/code or parent/source identities reject same-generation reuse. Cross-generation selective reuse, refresh integration, automatic restart and backup/restore are unproved.

Committed document processing total: {counts['processor_seconds']:,.2f} seconds. Final population attempt: {pop['seconds_this_attempt']:,.2f} seconds. Independent population verification: {verify['seconds']:,.2f} seconds. These durations are separate; lease wait, source checks and export time are not silently counted as document CPU time. Database main-file size at reporting: {stats['database_bytes']:,} bytes; temporary WAL/runtime costs and release/export verification are recorded separately in receipts.

Output root: `{ROOT}`. Database: `arguments.sqlite3`. Reproducible versioned exports: `releases/`, with gzip JSONL row counts, compressed and logical uncompressed SHA256 checks, exact code snapshots, quality, dependencies and recovery receipts. `delivered-release.json` is an owned task receipt, not a global/latest selector. The independent export receipt is `release-verification.json`. This result and `HANDOFF.md` remain task-specific; shared coordination files were not edited.
'''
    (ROOT/'RESULT.md').write_text(result,'utf-8')
    reconciliation=f'''KR-130 delivered populated CPU surface argument candidates for run {rid}; {counts['processed_documents']:,}/98,733 supported English-labelled documents/XML entries processed, {counts['statements']:,} statements/quotation subspans, {counts['qualifications']:,} qualification witnesses and {counts['links']:,} structural candidate links. Pinned KR-101/102 only; no KR-110/120, vector or concurrent refresh/backup/KR-140 dependency. Reserved implementation-model review: attribution 25/70 versus 28/70 baseline (failed); negation 56/70 versus 35/70; qualification retention 24/33 versus 0/33; non-author endorsement protection 42/42. Candidate capability only, no human/independent review or global/public promotion. Actual checkpoint/resume and completed rerun verified; {verify['witnesses']['passed']} source witnesses passed. Cross-generation refresh/reuse and backup restoration remain unproved. Owned code: knowledge/library_analytics/arguments/; private outputs: connected-research/arguments/. Read task-specific RESULT.md, delivered-release.json and release-verification.json for exact counts, files, runtime, failures and commands. Stop after KR-130 handoff; KR-150/public integration remain unauthorized.'''
    handoff=f'''# KR-130 task-specific handoff

The requested private processor/population delivery is complete; attribution/scope acceptance is failed, so extracted content remains candidate-only. [Result](RESULT.md), `population.json`, `population-verification.json`, `delivered-release.json`, `release-verification.json`, `evaluation/` and `examples.json` contain the receipts. No shared coordination file was edited.

## Exact coordinator reconciliation

In shared TODO.md, replace only the KR-130 status/delivery cell with the following text, retaining the existing dependency and remaining-roadmap rows:

> {reconciliation}

In shared HANDOFF.md and NEW-CHAT-CONTEXT.md, add the same verified delivery paragraph above and extend their introductory summary with “KR-130 private CPU candidate population delivered; attribution/scope acceptance failed.” Retain any concurrently delivered KR-140, refresh or backup state rather than replacing it. Keep KR-110/120 limitations, original identities/evaluation splits, future protocol and all other owners intact. Do not imply current whole-library refresh, accepted attribution, semantic processing, backup or public readiness from KR-130. Link to `knowledge/library_analytics/arguments/README.md` and this private result through the established coordinator documentation. This is a reconciliation instruction, not another backlog or authorization to begin a stage.

## Owned changes and operation

All new modules, SQL and operator documentation are under `Website/knowledge/library_analytics/arguments/`; all runtime/evaluation/database/release/result/handoff files are under `{ROOT}`. The processor reuses shared JobStore without editing it, shared schemas or KR-101/102/110/120. The scope/dependency/readers/roles/cautions are recorded against immutable historical input releases. Corpus, originals, vectors, graph, public site, intake/encoder/scheduler/deployment and other workstream code/outputs were not written by this work.

From Website in cmd.exe with login disabled, the completed-generation check is:

```bat
..\\KnowledgeBase\\.venv\\Scripts\\python.exe -X utf8 -m knowledge.library_analytics.arguments --run --resume
..\\KnowledgeBase\\.venv\\Scripts\\python.exe -X utf8 -m knowledge.library_analytics.arguments.query --query faith --kind objection --author Owen
```

The first command requires the existing global lease and returns unchanged for the exact saved dependencies. An interrupted same-generation run uses `lease_runner --run --resume`. Remove an owned `cancel.request` before resume. Do not start a second writer or bypass a live/inaccessible owner. A changed dependency/config/rule requires a new private generation and matching calibration; no cross-generation reuse is claimed. No latest pointer was promoted, so rollback is selecting a historical explicit release while retaining all existing inputs and outputs.

The task stops at this handoff. Coordinator reconciliation of the exact text above is the remaining documentation integration; attribution acceptance remediation belongs to the existing KR-130 item and requires its own subsequent scope. No KR-150 or public integration was started.
'''
    (ROOT/'HANDOFF.md').write_text(handoff,'utf-8');print('Wrote task-specific RESULT.md and HANDOFF.md')
def main():
    from ..jobs import JobStore
    from ..build import PROJECT
    lease=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    try:lease.acquire();generate_report()
    finally:lease.close()
if __name__=='__main__':main()
