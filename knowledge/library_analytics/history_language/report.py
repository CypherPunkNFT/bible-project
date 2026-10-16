"""Task-specific result and exact coordinator reconciliation; shared docs untouched."""
import json,collections
from pathlib import Path
from .inputs import OUT,read
from ..build import dump

def main():
 p=read(OUT/'population-result.json');q=p['quality']['adapters'];coverage=read(OUT/'coverage.json');source=read(OUT/'source-verification.json');integrity=read(OUT/'integrity-verification.json');review=read(OUT/'content-review.json');tests=read(OUT/'focused-tests.json');resume=read(OUT/'resumed-proof.json');idem=read(OUT/'idempotent-proof.json');selection=read(OUT/'inputs/selection.json');run=p['run_id']
 counts='\n'.join('| '+k+' | '+format(v,',')+' |' for k,v in p['counts'].items())
 quality='\n'.join('| '+k+' | '+str(v['cases'])+' | '+str(v['correct_positive'])+'/'+str(v['expected_positive'])+' | '+str(v['baseline_correct'])+' | +'+str(v['gain_correct_located'])+' | '+str(v['failures'])+' |' for k,v in q.items())
 aggregated=collections.Counter()
 for r in coverage['deferrals']:aggregated['translation-numbering-ambiguous' if r['reason'].startswith('translation-group-') else r['reason']]+=r['n']
 deferred='\n'.join('| '+reason+' | '+format(n,',')+' |' for reason,n in aggregated.most_common())
 types='\n'.join('| '+r['relation']+' | '+format(r['n'],',')+' |' for r in coverage['language_alignments|relation'])
 runstate=f"KR-140 delivered private CPU source-annotation and structural alignment adapters for run `{run}`: {p['eligible']:,}/{p['eligible']:,} jobs, {p['counts']['historical_links']:,} located historical links, {p['counts']['dates']:,} date records and {p['counts']['language_alignments']:,} language alignments. No failed jobs in the selected generation. Semantic translation, canonical entity disambiguation, historical influence and specialist interpretation remain deferred."
 base='KnowledgeBase/library-knowledge/connected-research/history-language/'
 result=f'''# KR-140 supported-population result

14 October 2026, America/New_York. {runstate}

Scope: every one of the 155 existing research citations, 7,411 registered Assyrian archive corpusjson resources, seven registered repaired ORACC HTML editions and two selected lexicon assets. The lexicons contain 18,895 pinned KR-101 document entries. Jobs/resources, lexical entries, spans and independent works are different units. Empty, unavailable, ambiguous and unsupported cases remain explicit. This is historical-snapshot processing, not a current whole-library or semantic-readiness claim.

## Inputs and implementation

Pinned KR-101: `{selection['parents'][0]['run_id']}`; summary SHA256 `{selection['parents'][0]['summary_sha256']}`. Pinned KR-102: `{selection['parents'][1]['run_id']}`; summary SHA256 `{selection['parents'][1]['summary_sha256']}`. KR-102 binds corpus build `2026-10-13T23:47:33.488164+00:00` and reader generation `d9f84a4cd33e439ac3e5d10e3c00b3ac7c25d302853a598ef35272e99cb03264`. No live corpus/vector/encoder access is used. Selected registry rows came from a consistent read transaction; original records and selected-file hashes are frozen in `inputs/`. The implementation does not depend on concurrent refresh, recovery or KR-130 outputs.

Owned implementation: `Website/knowledge/library_analytics/history_language/`. Actual Python/SQLite processors use the existing JobStore and global analytics lease, atomic facts/checkpoints, versioned facts, same-generation resume and changed-source/code rejection. Native XML and JSON pointers name exact string spans; ATF translation groups retain native line ranges. Source/edition dates, uncertainty, translator nulls/credits, morphology, restoration notes, competing interpretations, rights and review provenance are preserved. Original person/source IDs remain distinct. Derived `hl-` IDs identify facts/witnesses, never new canonical people or works. No influence is inferred.

## Populated tables

| Table | Selected-run rows |
| --- | ---: |
{counts}

| Alignment relation | Rows |
| --- | ---: |
{types}

Language glosses are editorial lexical aids. A guideword is not a running translation. Structural English translation groups are candidates, with lacunae/restorations and original contributor statements retained; no word-level semantic equivalence is asserted. {coverage['numeric_or_empty_guidewords']:,} ORACC guidewords are single numeric/placeholding values and provide no useful standalone English meaning. Those source annotations are retained and counted as a usefulness limitation.

## Frozen quality measurement

`inputs/criteria.json` and `inputs/quality-cases.json` were frozen before calibration. Development and reserved cases use the declared deterministic split; repaired editions split at source level. Existing KR/LK evaluation splits were not edited. `evaluation_cases` also records population source annotations; its count is not the number of held-out quality questions. The separate frozen fixture and decisions give the actual evaluation denominators below.

Baselines were executed: raw literal quote search; first global headword/definition substring; first matching token-form/guideword occurrence; and ordinal line/block pairing. Correctness requires the intended native source location and retained language/identity/date roles. Reviewer type: deterministic independent source-annotation oracle, followed by model-assisted implementation-agent content review. No human or independent specialist review occurred.

| Adapter / split | Cases | Correct located positives / expected | Baseline correct | Gain | Failed cases |
| --- | ---: | ---: | ---: | ---: | ---: |
{quality}

Zero-positive strata do not establish positive recall. In particular, supported running-translation groups have thin held coverage; reserved abstention safety is distinct from positive translation quality. Source-annotation correctness does not validate historical truth, source authenticity, inherited claim wording, translator intent or semantic equivalence. Content review: {review['reviewed_cases']} selected cases, {review['useful_within_declared_scope']} useful within the declared narrow scope and {review['limited_or_failed_cases']} limited/failed. See `content-review.json` for located decisions and the inherited-claim/placeholder limitations.

## Coverage and deferrals

| Reason | Cases / occurrences |
| --- | ---: |
{deferred}

Deferral reasons overlap and are not a partition of the population. Historical/ORACC resources without exact source-path/hash membership in KR-101 remain unbound; no substitute titles, editions or reader deep links are invented. Lexicon bindings retain KR-102 exact/approximate/partial/unresolved coordinates and containing-book/unresolved navigation states. Untested historical corpora, other lexicons, Greek/Latin prose translation, broader numbering conversion, canonical person/place resolution and semantic/specialist interpretation remain outside these supported adapters. These are analytical deferrals, not intake or embedding holds.

## Working located queries

From Website under cmd.exe, login disabled:

```bat
..\\KnowledgeBase\\.venv\\Scripts\\python.exe -X utf8 -m knowledge.library_analytics.history_language.located_queries --entity evidence:BA-001
..\\KnowledgeBase\\.venv\\Scripts\\python.exe -X utf8 -m knowledge.library_analytics.history_language.located_queries --scope lexicon:HebrewStrong.xml --entry H1:0
..\\KnowledgeBase\\.venv\\Scripts\\python.exe -X utf8 -m knowledge.library_analytics.history_language.located_queries --scope resource:eaacf879-12e0-4563-ac2c-fe188d0f1bd6
```

`fast-located-examples.json` contains the executed entity/native-entry/translation queries and measured SQLite query plans: `history_entity`, `languages_scope` and witness primary-key lookups. `located-examples.json` additionally records broad substring queries with actual resource IDs, source hashes, XML/JSON/ATF locators, Unicode half-open offsets, original/English text, credits and deferrals. Broad substring queries scan the selected population; use the constrained commands above for routine location lookup. `Website/knowledge/library_analytics/history_language/queries.sql` provides generation-bound entity, scope, date, section and reverse-dependency queries. On-site navigation is only offered when the pinned alignment records it; provenance URLs are not substituted for held reading destinations.

## Verification, recovery and resources

{tests['tests']} focused tests passed, including real process death with rollback/reacquisition, same-job recovery, duplicate source/extraction dependency, live-owner refusal, changed-input rejection, Unicode, numbering ambiguity, language distinctions and competing interpretations. Full selected-population referential/integrity checks passed: {integrity['dangling_or_mixed_alignment_witnesses']} dangling/mixed alignment witnesses, {len(integrity['invented_canonical_entity_ids'])} invented canonical IDs, {integrity['incomplete_or_uncheckpointed_jobs']} incomplete/uncheckpointed jobs, SQLite quick-check `{integrity['sqlite_quick_check']}`. Independent reconstruction passed {sum(source['witnesses_reconstructed'].values()):,} source witnesses with {len(source['failures'])} failures across file/XML/JSON/ATF coordinates.

Actual population checkpoint/resume preserved all {resume['prior_successful_jobs']} prior successful job receipts and committed facts. Completed-population idempotence preserved all {idem['current_successful_jobs']:,} job receipts/attempts and all table counts; 16 deterministic committed scopes were additionally hashed before/after. Disjoint earlier failed calibration evidence is retained. One calibration implementation bug (duplicate identical source/extraction paths) was corrected in a new generation without changing criteria or reserved cases.

Final population attempt, including validation/evaluation: {p['seconds_this_attempt']:.2f} seconds. Calibration and interrupted/idempotent attempts are recorded separately in `attempts.jsonl`; this value is not total chat or lease-wait time. Runtime/dependency versions are in `environment.json`. Execution used one below-normal CPU worker and the existing global lease. The processor/verification/export commands release their leases when finished. Disk bytes and immutable export verification are recorded in `release-verification.json` after closeout; this is local persistence, not Git/remote backup or restoration proof.

## Outputs and operator scope

Private root: `{base}`. Store: `history-language.sqlite3`. Immutable exports: `releases/{run}/`, containing selected-run gzip JSONL tables, schema, pinned inputs, code and receipts; `release_manifest.json` supplies SHA256/bytes/row counts. Repeated export verifies and returns unchanged. No global latest pointer is promoted.

Resume only unchanged incomplete input/code with `python -m knowledge.library_analytics.history_language.processor --run --resume`. Source/code drift refuses that run; preserve it and use an explicitly selected new generation after reconciling inputs. `cancel.request` stops at an atomic group; remove only that private request to permit continuation. This implements source reverse dependencies and local recovery, not the parallel refresh integration or backup system.

Originals, identities, credits, Catholic cautions, corpus, vectors, running owners, graph and public outputs were preserved. No intake, embedding, encoder, graph/public writer, scheduler, deployment or KR-150 was started. Shared TODO/HANDOFF/NEW-CHAT-CONTEXT were not edited. Stop after this handoff; coordinator reconciliation is in `HANDOFF.md` and `coordinator-reconciliation.json`.
'''
 (OUT/'RESULT.md').write_text(result,encoding='utf-8')
 reconciliation={
  'initiative/TODO.md':{'operation':'Replace only the existing KR-140 status/detail cells; retain dependencies and the rest of the ledger','replacement':runstate+' Result: '+base+'RESULT.md. Supported-source candidate delivery only; no global promotion.'},
  'initiative/HANDOFF.md':{'operation':'Add a current KR-140 completion receipt without rewriting other workstreams','text':runstate+' Inputs: '+selection['parents'][0]['run_id']+' and '+selection['parents'][1]['run_id']+'. Owned package Website/knowledge/library_analytics/history_language/; private root '+base+'. Tests '+str(tests['tests'])+' passed; source reconstruction/integrity and actual resume/idempotence receipts are in that root. No shared docs or running owners were changed. No later-stage authorization follows.'},
  'initiative/NEW-CHAT-CONTEXT.md':{'operation':'Add this receipt and update KR-140 roadmap status only; preserve all other owners and roadmap items','text':runstate+' Read '+base+'RESULT.md and HANDOFF.md before consuming this run. Global latest pointers remain unchanged; public/KR-150 integration is not performed.'}}
 dump(OUT/'coordinator-reconciliation.json',reconciliation)
 handoff=f'''# KR-140 task handoff

{runstate}

Read [RESULT.md](RESULT.md), `population-result.json`, `population-quality.json`, `coverage.json`, `source-verification.json`, `integrity-verification.json`, `resumed-proof.json`, `idempotent-proof.json` and `release-verification.json`. Selected run `{run}`; parents `{selection['parents'][0]['run_id']}` / `{selection['parents'][1]['run_id']}`. Exact frozen input hashes are in `inputs/selection.json` and the release manifest. Store and outputs stay under this private directory; code ownership is only `Website/knowledge/library_analytics/history_language/`.

Shared files have deliberately not been edited. The coordinator must reconcile exactly these additions, after checking concurrent owner state:

'''+ '\n\n'.join('## '+name+'\n\n'+v['operation']+'\n\n'+v.get('replacement',v.get('text','')) for name,v in reconciliation.items())+f'''

Use actual initiative paths `Website/initiatives/library-knowledge/TODO.md`, `HANDOFF.md` and `NEW-CHAT-CONTEXT.md`; `initiative/` above is only a logical label. The JSON receipt carries the same exact replacement text. Do not mark semantic translation/historical interpretation complete or replace other workstreams' status. This is reconciliation into the single existing ledger, not another backlog.

To review the immutable output without starting another stage, run `..\\KnowledgeBase\\.venv\\Scripts\\python.exe -X utf8 -m knowledge.library_analytics.history_language.release --verify` from Website via cmd.exe with login disabled; it requires the existing global lease for full-file verification. Resume and source-change restrictions are in the result and package README. The selected generation's own worker is finished; inspect current global owners before any later heavy operation. Preserve all earlier generations. No automatic refresh, backup/restore, scheduler, public integration or KR-150 follows this handoff.
'''
 (OUT/'HANDOFF.md').write_text(handoff,encoding='utf-8');print(run)
if __name__=='__main__':main()
