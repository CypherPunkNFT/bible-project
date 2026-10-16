"""Create the owned result/handoff from actual completed receipts."""
from collections import Counter
import json
from pathlib import Path
from .build import readonly
from .refresh import ROOT,ownership,read_batch,object_row,retriever,affected
from .refresh_contract import decode,verify_export,hash_file,atomic_json
from .inputs import packed,digest

def main():
    receipt=json.loads((ROOT/'suite-result.json').read_text('utf-8'));run=receipt['selective']['run_id'];folder=Path(receipt['release'])
    with ownership() as (_,store):
        manifest=verify_export(folder);native=readonly(folder/'query.sqlite3');db=store.db
        try:
            tables=('documents','contributors','sections','section_segments','windows','concept_occurrences','reference_occurrences','rules',
                'alignment_documents','section_index','corpus_documents','corpus_chunks','alignment_maps','section_chunks','section_reader_spans',
                'section_destinations','section_alignment_status','feature_stats','pair_evidence','joint_features','joint_pairs','refresh_vocab')
            counts={t:native.execute('SELECT count(*) FROM '+t).fetchone()[0] for t in tables}
            documents=[];posting_rows=0;native_windows=deferred_windows=short_windows=0
            for row in db.execute("SELECT o.* FROM membership m JOIN objects o ON o.id=m.object_id WHERE m.run_id=? AND m.stage='relationships'",(run,)):
                value=decode(row);posting_rows+=len(value['postings'])
                for d in value['document_results']:
                    native_windows+=d['native_windows'];deferred_windows+=d['deferred_windows'];short_windows+=d['short_windows']
            counts['relationship_postings_in_content_objects']=posting_rows
            coverage={'adapter_counts':Counter(),'languages':Counter(),'known_work_documents':0,'known_edition_documents':0,
                      'native_relationship_windows':native_windows,'deferred_relationship_windows':deferred_windows,'short_relationship_windows':short_windows}
            batch,_=read_batch(receipt['selective']['batch'])
            for item in batch['items']:
                d=item['descriptor'];coverage['adapter_counts'][item['adapter']]+=1;coverage['languages'][d.get('language') or 'unknown']+=1
                coverage['known_work_documents']+=bool(d.get('work_id') and d.get('work_verified'))
                coverage['known_edition_documents']+=bool(d.get('edition_id') and d.get('edition_verified'))
            products=decode(object_row(db,receipt['selective']['population_object']))
            baseline_products=decode(object_row(db,receipt['baseline']['population_object']))
            metrics={}
            for split in ('development','reserved'):
                for mode in ('baseline','concept'):
                    selected=[q for q in products['queries'] if q['question']['split']==split and q['mode']==mode]
                    previous=[q for q in baseline_products['queries'] if q['question']['split']==split and q['mode']==mode]
                    prev={q['question']['id']:q for q in previous}
                    metrics[split+'-'+mode]={'questions':len(selected),'nonempty_candidates':sum(bool(q['result']['results']) for q in selected),
                        'previous_nonempty_candidates':sum(bool(q['result']['results']) for q in previous),
                        'changed_ranked_result_ids':sum([r['id'] for r in q['result']['results']]!=[r['id'] for r in prev[q['question']['id']]['result']['results']] for q in selected),
                        'clean_rebuild_equivalence':receipt['equivalence']['ok'],'usefulness_judgments':None}
            r=retriever(native,batch);examples=[]
            for query,author,lang in [('prayer',None,'en'),('assurance',None,'en'),('justification faith','John Owen','en'),('faith','__missing_author__','en')]:
                result=r.search(query,author=author,language=lang);examples.append(result)
            pairs=[]
            for p in native.execute('SELECT * FROM pair_evidence WHERE channel=\'wording\' ORDER BY left_window,right_window LIMIT 3'):
                entry={'pair':dict(p),'endpoints':[]}
                for wid in (p['left_window'],p['right_window']):
                    row=dict(native.execute('SELECT w.*,d.descriptor_json FROM windows w JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.id=?',(wid,)).fetchone())
                    entry['endpoints'].append({'window_id':wid,**r.witness(row,500)})
                pairs.append(entry)
            atomic_json(ROOT/'query-examples.json',{'queries':examples,'wording_pairs':pairs,'reviewer_type':'deterministic source reconstruction only; candidate usefulness unjudged'})
            first=batch['items'][0]['sources'][0]['path'];reverse=affected(db,'source',first);atomic_json(ROOT/'reverse-example.json',{'source':first,'descendants':reverse})
            summaries={k:receipt[k] for k in ('calibration','baseline','selective','clean')}
            resource=[json.loads(line) for line in Path(receipt['resource_samples']).read_text('utf-8').splitlines()]
            runtime={'suite_seconds':receipt['seconds'],'sampled_peak_rss':max(x['rss'] for x in resource),'samples':len(resource),
                'peak_file_bytes':{k:max(x['files'].get(k,0) for x in resource) for k in {k for x in resource for k in x['files']}},
                'selective_complete_attempt_seconds':receipt['selective']['seconds_this_attempt'],
                'selective_paused_attempt_seconds_including_lease_wait':receipt['resume']['paused_attempt_seconds_including_lease_wait'],
                'clean_attempt_seconds':receipt['clean']['seconds_this_attempt'],
                'document_callback_seconds_saved':receipt['equivalence']['document_seconds_saved'],
                'document_callback_saving_fraction':receipt['equivalence']['document_saving_fraction'],
                'global_product_seconds_selective':receipt['selective']['population_seconds'],'global_product_seconds_clean':receipt['clean']['population_seconds']}
            data={'run_id':run,'counts':counts,'coverage':coverage,'query_diagnostics':metrics,'runtime':runtime,'summary':summaries,
                'release':str(folder),'manifest_sha256':hash_file(folder/'manifest.json'),'manifest_files':len(manifest['files']),
                'export_bytes':sum(p['bytes'] for p in manifest['files']),'global_latest_promotion':False,'backup_restoration':False}
            atomic_json(ROOT/'RESULT.json',data)
            row_lines='\n'.join('| '+k+' | '+format(v,',')+' |' for k,v in counts.items())
            action_lines='\n'.join('| '+a['stage']+' | '+a['action']+' | '+str(a['documents'])+' | '+format(a['seconds'],'.2f')+' |' for a in receipt['selective']['actions'])
            parent_lines='\n'.join('- '+k+': `'+p['run_id']+'`; immutable manifest SHA256 `'+p['manifest_sha256']+'`.' for k,p in batch['config']['parents'].items())
            result=f'''# CPU selective refresh result — 14 October 2026

Completed the declared held-data refresh population and a clean rebuild of identical target inputs. Candidate release `{run}` is selected **only under this owned refresh root**. Existing KR-101/102/110/120 releases, source snapshots and production selections were not changed. This is foundational CPU refresh proof, not all KR-170 or backup restoration.

## Inputs and coverage

{parent_lines}

Corpus build: `{batch['config']['corpus_build']}`. Full compressed capture identities and input paths are in `capture.json`, `suite-inputs.json`, and the release contract. The baseline contains {receipt['baseline']['documents']:,} held documents/XML entries; target contains {receipt['selective']['documents']:,}. Delta: 100 added held inputs, 50 removed memberships, {receipt['selective']['deltas'].get('unchanged',0):,} unchanged. These removals did not delete originals. All declared target inputs completed; zero failed/unfinished jobs. Target source strata and language/identity counts are in `RESULT.json`.

The selection includes historical calibration strata plus deterministic cache/XML samples. **{batch['scope']['outside_declared_population']:,} of the historical 100,889 supported documents are outside this executed cohort.** This is not a full 100,889-document refresh or current-library acceptance. Inherited 113,557 immutable-adapter deferrals and three archive exclusions remain with their existing owners. Semantic processing is disabled; no vectors were selected or modified.

## Implemented behavior

`refresh.py` supplies executable capture, plan, selective/clean run, status, dependency trace, arbitrary author/work/language-constrained located queries, relationship neighbors, export, selection and rollback. Isolated adapters invoke existing `section_catalog.document/xml_asset`, `section_alignment.align_document`, `concept_index.process_document`, `relationship_miner.process_document/build_bucket`, and joint-reference processors. No shared processor code or contracts were altered.

Facts are canonical content objects with explicit computation bindings, generation membership and reverse dependencies. Matching narrow fingerprints and verified content hashes permit reuse. Original source hashes and reused windows are reconstructed; facts/checkpoints commit atomically through existing JobStore/global and local leases. Removed memberships have tombstones. Source moves retain byte equality but regenerate path-bound coordinates/versions. Consumed author/work/edition/credit metadata updates invalidate section identities; unused metadata can reuse extraction. Reader changes invalidate alignment without lexical re-extraction. Rule/parser/config changes invalidate consuming facts; review changes invalidate population/review provenance without granting transferred interpretation approval.

All target FTS frequencies/BM25 ranks and bounded base/joint relationship candidates are rebuilt. New sources can change old scores and old neighbor pairs, including frequent-feature deferrals. Stable private integer window/reference IDs replace auto-rowids in this projection; source section IDs, spans and hashes are retained. Do not use these integer IDs against historical concept/relationship stores. Equivalence is to the fresh target rebuild through these adapters, not a claim that historical auto-rowid tie choices are identical.

## Selective actions and populated tables

| Stage | Action | Documents | Callback seconds |
| --- | --- | ---: | ---: |
{action_lines}

| Populated native table / fact array | Rows |
| --- | ---: |
{row_lines}

Document posting arrays are stored in verified content objects and exported in `objects.jsonl`; global features/pairs and located query tables are directly queryable in `query.sqlite3`. Window candidate/fallback, short-text and unresolved navigation statuses remain explicit. Actual source spans, contexts, credits, warnings and constrained examples are in `query-examples.json`.

## Proof and measured quality

All {receipt['equivalence']['memberships_compared']:,} target document/stage object memberships equal the clean rebuild. Frequencies, base feature statistics/pairs, joint features/pairs and all 120 original question intents in both modes are equal. The 72 development / 48 reserved split remains unchanged. `held-equivalence.json` records the equality and savings; `RESULT.json` reports nonempty/changed ranked candidate diagnostics separately by split and mode. These diagnostics are not useful-answer judgments.

Reviewer type: **deterministic clean rebuild and source reconstruction; no human or model relevance judgments**. No retrieval/usefulness quality gain is claimed. KR-110's failed retrieval acceptance and KR-120's boilerplate/reprint/reference-mapping/attribution failures remain unresolved. Candidate-only capabilities and Catholic/edition/attribution cautions are preserved.

Eighteen focused tests cover real native processing for added/unchanged/text-changed/metadata-only/moved/removed inputs, rule/parser/relationship/joint/review changes, reader changes, population effects on old scores/pairs, transitive dependencies, process death, competing ownership, stale/corrupt inputs, failed evaluation/export, CAS selection, rollback, duplicate-occurrence multiplicity and last-good retention. Thirty existing concept/relationship compatibility tests and 31 existing section/alignment pytest tests pass (79 total). Initial held calibration exposed missing `typing_extensions`; its failed generation/job remains recorded. A second calibration exposed exact duplicate native occurrences; the adapter now preserves their multiplicity with deterministic ordinals rather than losing records or reporting a hash collision. Both failed generations remain in the store/logs. Pinned `typing_extensions 4.15.0` and test-only `Pygments 2.19.2` were installed solely under `refresh/python-dependencies/`. The shared environment was not changed. Runtime fingerprints include the actual parser dependency version and source hash; `dependency-install.json` records the fetched wheel hashes. Initial unavailable-test logs remain; `compatibility-tests-final.log` records the successful rerun.

Held same-generation resume preserved {receipt['resume']['committed_memberships']} committed memberships and {receipt['resume']['committed_checkpoints']} checkpoints/attempts exactly. A completed repeated run preserved facts/jobs/checkpoints and summary bytes. Candidate rollback returned to the preceding private baseline, then selected the verified target again. All release-file hashes/sizes passed; repeated export verifies immutable files. Destructive failure cases used disposable private fixtures. No production original was changed to manufacture a test case.

## Runtime, savings and limitations

Measured callback savings: {receipt['equivalence']['document_seconds_saved']:.2f} seconds ({receipt['equivalence']['document_saving_fraction']:.2%}) versus clean target reprocessing. This includes actual object verification/decode costs. Global population work is deliberately not skipped: selective {receipt['selective']['population_seconds']:.2f}s; clean {receipt['clean']['population_seconds']:.2f}s. Selected completed attempt: {receipt['selective']['seconds_this_attempt']:.2f}s, plus the paused attempt {receipt['resume']['paused_attempt_seconds_including_lease_wait']:.2f}s including lease wait; clean attempt {receipt['clean']['seconds_this_attempt']:.2f}s. Full suite {receipt['seconds']:.2f}s includes calibration, baseline, verification/export and lease waits. Sampled peak RSS: {runtime['sampled_peak_rss']:,} bytes; file peaks are in `RESULT.json`. These are sampled measurements, not continuous physical IO or RAM limits.

Shared XML assets are parsed in groups; a new entry can cause its selected asset group to be parsed even when only the new document's object is committed. Validation and FTS/global pair rebuilding impose a floor on total refresh cost. The implementation materializes population products; scaling this proof to all historical inputs needs measured memory/disk bounds and the same clean-equivalence gate. Fresh acquisitions still need immutable adapters and a compatible owner-provided source/corpus selection. No scheduler, automatic intake, off-device backup, restoration or public delivery is installed.

## Outputs and operator entry points

Private database: `{ROOT/'refresh.sqlite3'}`. Immutable candidate: `{folder}` ({len(manifest['files'])} manifest files; {sum(p['bytes'] for p in manifest['files']):,} exported bytes). `candidate.json` is the only selected pointer changed by this work. `suite-result.json`, `held-resume.json`, `held-equivalence.json`, `held-idempotence.json`, `held-rollback.json`, resource samples and logs retain the actual execution evidence. `OPERATOR.md` has commands; `HANDOFF.md` has exact shared-ledger reconciliation text. Local files are not proof of Git commit or remote backup.
'''
            (ROOT/'RESULT.md').write_text(result,encoding='utf-8')
            reconciliation=f'''# Refresh workstream handoff — 14 October 2026

Authorized scope completed for the declared 2,300-input held cohort: CPU selective refresh for KR-101/102/110/120 through isolated existing-processor adapters. See [RESULT.md](RESULT.md), machine receipt [RESULT.json](RESULT.json), [operator commands](OPERATOR.md), and [suite result](suite-result.json). Stop at this handoff; no later workstream is launched.

Owned new code: `Website/knowledge/library_analytics/refresh.py`, `refresh_contract.py`, `refresh_processors.py`, `refresh_capture.py`, `refresh_environment.py`, `refresh_inspect.py`, `refresh_status.py`, `refresh_control.py`, `refresh_run_suite.py`, `refresh_report.py`, `refresh_pytest.py`, `test_refresh.py`. Shared `jobs.py`, existing processor code, shared contracts and shared TODO/HANDOFF/NEW-CHAT-CONTEXT were not edited. All private writes are under `connected-research/refresh/`, plus the expressly required existing global JobStore lease records. Pinned parser/test dependencies are private to `refresh/python-dependencies/`; shared packages and other running processes are untouched. No global latest pointer was promoted.

Exact changes for the coordinator to reconcile (do not replace the single backlog):

1. **TODO.md, KR-170 / LK-501 continuing-operation entries:** add a bounded foundational refresh receipt link to `KnowledgeBase/library-knowledge/connected-research/refresh/RESULT.md`. Record executable delta classification, narrow fingerprints, reverse dependencies, cross-generation object reuse, tombstones, population revalidation and atomic private candidate selection/rollback as implemented and proved for {receipt['selective']['documents']:,} held target inputs ({receipt['selective']['deltas'].get('unchanged',0):,} unchanged, 100 added, 50 removed memberships). Keep KR-170 open: whole supported-population scale, remaining processors/compiler/public products, off-device backup/restoration and automatic restart are not completed. Keep KR-110/120 usefulness/attribution/semantic remediation open.
2. **HANDOFF.md current execution state:** add candidate `{run}`, its private release path `{folder}`, immutable input capture paths from `suite-inputs.json`, exact historical release IDs/hashes from `RESULT.md`, and {receipt['equivalence']['memberships_compared']:,} passing selective/clean memberships plus global products/240 query runs. Record 18 focused + 30 existing concept/relationship + 31 section/alignment tests (79 passing). Retain both initial failed calibration receipts (missing dependency and duplicate-occurrence adapter bug), the multiplicity correction and private dependency installation provenance. Record actual resume/idempotence/private rollback receipts, {receipt['equivalence']['document_saving_fraction']:.2%} callback saving, and the 98,589 historical supported documents outside this executed target cohort. Do not present sampled refresh proof as full-library/current-source readiness.
3. **NEW-CHAT-CONTEXT.md continuing operation:** replace the blanket statement that no cross-generation reuse/refresh exists with the bounded implemented capability and this receipt. Retain the entire roadmap, failed KR-110 acceptance, KR-120 candidate limits and separate running owners. Preserve earlier immutable releases and production selections; this new candidate is selected only in `refresh/candidate.json`.

Resume/reproduce: `python -X utf8 -u -m knowledge.library_analytics.refresh_run_suite` from Website (cmd.exe, login:false); identical frozen inputs resume existing generations. The suite waits for the existing global lease and never bypasses another owner. Runtime identity/log paths are `suite-launch.json`, `suite-population.log` and resource JSONL. Raw source/code changes reject same-generation reuse and require a new immutable capture/config generation. A code change does not authorize changing historical releases.

No intake, embedding, encoder, graph/public writer, scheduler or deployment was started. Originals, vectors, source credits, Catholic cautions and evaluation splits remain intact. Another workstream may acquire the global lease after this task releases it; its liveness is not evidence that this task is still running. Files are saved locally; no commit, remote backup or restoration is claimed.
'''
            (ROOT/'HANDOFF.md').write_text(reconciliation,encoding='utf-8')
            print(packed({'result':str(ROOT/'RESULT.md'),'handoff':str(ROOT/'HANDOFF.md'),'counts':counts,'runtime':runtime}),flush=True)
        finally:native.close()

if __name__=='__main__':main()
