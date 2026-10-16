"""Finish one LA03 generation: wait, build consumers, independently verify, receipt."""
import argparse
import json
import time
from pathlib import Path
from .build import PROJECT,readonly,dump,now
from .inputs import packed
from .jobs import process_identity
from .product_consumers import run as consumers
from .verify_products import verify


def wait(project,run):
    root=project/'KnowledgeBase/library-analytics/pipeline';last=None
    while True:
        db=readonly(root/'products.sqlite3')
        try:
            record=db.execute('SELECT state FROM product_runs WHERE id=?',(run,)).fetchone()
            owner=dict(db.execute('SELECT * FROM coordinator').fetchone() or {})
            metric=db.execute('SELECT metrics_json FROM product_metrics WHERE run_id=?',(run,)).fetchone() if db.execute("SELECT 1 FROM sqlite_master WHERE name='product_metrics'").fetchone() else None
        finally:db.close()
        if not record:raise ValueError('Unknown parent generation '+run)
        state=record['state']
        p=root/'product-progress.json';progress=json.loads(metric[0]) if metric else json.loads(p.read_text(encoding='utf-8-sig')) if p.is_file() else {}
        marker=(state,progress.get('phase'),progress.get('documents',0)//2000)
        if marker!=last:
            print(packed({'phase':'waiting-for-products','parent_run':run,'parent_state':state,'progress':progress}),flush=True);last=marker
        if state=='complete':
            shared=readonly(root/'pipeline.sqlite3')
            try:lease=shared.execute('SELECT pid,process_token FROM coordinator').fetchone()
            finally:shared.close()
            if not lease:return
            if process_identity(lease['pid'])!=lease['process_token']:return
        elif state!='running':raise RuntimeError('Parent generation requires attention: '+state)
        elif not owner or process_identity(owner['pid']) not in (owner['process_token'],'unknown'):
            raise RuntimeError('Parent worker stopped; resume its checkpointed run before delivery')
        time.sleep(30)


def result_document(project,result):
    out=project/'KnowledgeBase/library-analytics';p=json.loads((out/'latest-products.json').read_text(encoding='utf-8-sig'));s=json.loads(Path(p['summary']).read_text(encoding='utf-8-sig'))
    cp=json.loads((out/'latest-product-consumers.json').read_text(encoding='utf-8-sig'));cs=json.loads(Path(cp['summary']).read_text(encoding='utf-8-sig'))
    db=readonly(Path(p['database']));run=p['run_id']
    try:
        counts=dict(db.execute('''SELECT count(*) documents,sum(status='completed') analysed,sum(work_verified) work_bound_documents,
            sum(edition_verified) edition_bound_documents,count(DISTINCT CASE WHEN work_verified THEN work_id END) known_works,
            count(DISTINCT CASE WHEN edition_verified THEN edition_id END) known_editions,
            sum(citation_coverage LIKE '%deferred%') partial_citation_documents,sum(status='completed' AND quality_flags_json!='[]') quality_flagged_documents,
            count(DISTINCT CASE WHEN status='completed' THEN source_family END) source_channels
            FROM document_dimensions WHERE run_id=?''',(run,)).fetchone())
        unresolved=[dict(r) for r in db.execute('''SELECT i.entity_type,count(DISTINCT i.id) identities,count(DISTINCT c.document_id) documents
            FROM contributor_identities i JOIN document_contributors c ON c.run_id=i.run_id AND c.contributor_id=i.id
            WHERE i.run_id=? AND i.entity_type IN ('unresolved-label','unresolved-id') GROUP BY i.entity_type''',(run,))]
        bound=db.execute('SELECT count(DISTINCT document_id) FROM reader_links WHERE run_id=? AND route IS NOT NULL',(run,)).fetchone()[0]
        raw_vocab=result['totals']['vocabulary_rows'] if 'vocabulary_rows' in result['totals'] else db.execute("SELECT sum(json_extract(f.metadata_json,'$.unique_tracked_terms')) FROM document_features f JOIN run_jobs r ON r.job_id=f.job_id WHERE r.run_id=?",(run,)).fetchone()[0]
        tokens=s['text_features']['tokens'];rows=s['table_rows']
    finally:db.close()
    cdb=readonly(Path(cp['database']))
    try:xml_routes=cdb.execute('SELECT count(DISTINCT document_id) FROM xml_reader_links WHERE run_id=? AND route IS NOT NULL',(cp['run_id'],)).fetchone()[0]
    finally:cdb.close()
    verified_xml=sum(r['documents'] for r in s['xml_links'] if r['state']=='verified-source-entry')
    lines=['# LA-03 analytical products: verified results','',f"Completed and independently verified {result['checked_at']}. Generation `{run}` consumes the validated LA-02 text bundle. No source metadata, corpus bodies, vectors, graph or UI were changed.",'',
        '| Measure | Result |','| --- | ---: |',f"| Corpus records accounted for | {counts['documents']:,} |",f"| Analysed / documented archive exclusions | {counts['analysed']:,} / {counts['documents']-counts['analysed']:,} |",
        f"| Library documents with full lexical processing | {s['text_features']['documents']:,} |",f"| Normalized tokens counted | {tokens:,} |",f"| Stored document/term count rows | {raw_vocab:,} |",
        f"| Literal address records reconciled | {result['totals']['matrix_sum']:,} |",f"| Scripture matrix rows | {rows['scripture_matrix']:,} |",f"| Contributor profiles | {rows['contributor_profiles']:,} |",
        f"| Recorded source channels | {counts['source_channels']:,} |",f"| Distinct validated existing work / edition IDs | {counts['known_works']:,} / {counts['known_editions']:,} |",
        f"| Verified shared-XML entry links | {verified_xml:,} |",f"| XML entries with containing Teachers reader routes | {xml_routes:,} |",f"| Documents with containing on-site reader routes | {bound:,} |",
        f"| Normalized token-sequence duplicate groups | {rows['normalized_text_groups']:,} |",f"| Bounded lexical reuse candidates | {rows['reuse_candidates']:,} |",
        f"| Vocabulary-capped library documents | {s['text_features']['vocabulary_capped_documents']:,} |",f"| Known KJV phrase windows filtered from reuse | {s['text_features']['bible_windows_filtered']:,} |",
        f"| Partial citation-language coverage documents | {counts['partial_citation_documents']:,} |",f"| Quality-flagged corpus documents | {counts['quality_flagged_documents']:,} |",'','## Delivered data','',
        f"- Product database: `{p['database']}`.",f"- Product exports and checksummed manifest: `{p['release']}`.",f"- Consumer database: `{cp['database']}`.",f"- Consumer exports and checksummed manifest: `{cp['release']}`.",
        f"- Final verification: `{p['release']}\\verification-with-consumers.json`.",'- Latest pointers: `latest-products.json`, `latest-product-consumers.json`, `latest-analytical-release.json` under `KnowledgeBase/library-analytics/`.','',
        '| Consumer table | Rows |','| --- | ---: |',*[f"| `{table}` | {n:,} |" for table,n in cs['table_rows'].items()],'','## Address roles','',
        '| Role | Matches | Documents containing role |','| --- | ---: | ---: |',*[f"| `{r['role']}` | {r['matches']:,} | {r['documents']:,} |" for r in s['citation_roles']],'','## Verification and remaining limits','',
        f"All {result['release_files']['files']} parent release files and {result['consumer']['files']['files']} consumer release files passed SHA256/byte/row-count checks. All selected jobs have success checkpoints. Raw reference records, per-document role totals and matrix totals reconcile. {len(result['reference_witnesses'])} sampled role witnesses and {len(result['reuse_witnesses'])} sampled reuse pairs resolve to their analysed source text. Source metadata and XML hashes remain unchanged.",'',
        f"Unresolved contributor groups: `{packed(unresolved)}`. These remain raw labels or unknown IDs, not invented people. Canonical bindings retain their evidence basis; checking an existing work/edition ID is not independent authorship verification.",'',
        f"Verified source-entry provenance now covers {verified_xml:,} shared XML targets through entry identity plus matching source body; the original LA-02 gap history remains intact. {verified_xml-xml_routes:,} of these targets have no verified containing Teachers reader route. Entry-reader delivery remains pending and must use its existing metadata/UI owner. The prior LA-01 holdings gaps (9,652 held originals without a verified corpus-text link, ten unverified CSEL links, 621 unmapped language assertions) remain separate pending work. The 12,089 accepted canonical identity fields and six contributor resolutions remain unapplied; LA-04 owns those changes.",'',
        'Prose roles are deterministic candidates, not proof of exposition, agreement or quotation authorship. Chapter profiles expand declared ranges and are not additive occurrence counts. Document fractions use explicit denominators to reduce collection-size bias. Group vocabulary uses complete tracked counts and compatible recorded language/genre strata; frequencies do not classify doctrine. Reuse overlap is a bounded content-anchored signature metric, not unbiased Jaccard; KJV filtering is partial and no text is merged or deleted. Reader routes identify containing books, not aligned reader pages.','',
        'See [product contracts and operation](PRODUCTS.md) and [analytical SQL](product-queries.sql). Public consumer application remains LA-04; this release is private.','']
    path=project/'Website/knowledge/library_analytics/PRODUCTS-RESULT.md';path.write_text('\n'.join(lines),encoding='utf-8')
    return str(path)


def main(project=PROJECT,wait_for=None):
    project=Path(project)
    if wait_for:wait(project,wait_for)
    if consumers(project):raise RuntimeError('Consumer validation failed')
    result=verify(project)
    if not result['ok']:raise RuntimeError('Independent product verification failed')
    out=project/'KnowledgeBase/library-analytics';pointer=json.loads((out/'latest-products.json').read_text(encoding='utf-8-sig'));cp=json.loads((out/'latest-product-consumers.json').read_text(encoding='utf-8-sig'))
    report=result_document(project,result)
    receipt={'state':'complete','verified_at':now(),'parent':pointer,'consumers':cp,'report':report,'verification':str(Path(pointer['release'])/'verification-with-consumers.json')}
    dump(out/'latest-analytical-release.json',receipt);mark_documentation(project)
    print(packed(receipt),flush=True);return 0


def refresh(project=PROJECT):
    """Recheck a delivered pair after verifier/report changes without rebuilding it."""
    project=Path(project);result=verify(project)
    if not result['ok']:raise RuntimeError('Independent product verification failed')
    report=result_document(project,result);out=project/'KnowledgeBase/library-analytics'
    receipt={'state':'complete','verified_at':now(),'parent':json.loads((out/'latest-products.json').read_text(encoding='utf-8-sig')),
        'consumers':json.loads((out/'latest-product-consumers.json').read_text(encoding='utf-8-sig')),'report':report,
        'verification':str(Path(json.loads((out/'latest-products.json').read_text(encoding='utf-8-sig'))['release'])/'verification-with-consumers.json')}
    dump(out/'latest-analytical-release.json',receipt);mark_documentation(project)
    print(packed(receipt),flush=True);return 0


def mark_documentation(project):
    """Promote documentation only after a verified final receipt exists."""
    root=Path(project)/'Website';package=root/'knowledge/library_analytics'
    edits={
        package/'README.md':('**LA-03 implemented; full execution in progress:**','**LA-03 complete and independently verified:** [Measured results](PRODUCTS-RESULT.md).'),
        package/'IMPLEMENTATION-PLAN.md':('LA-03 implemented with full execution underway','LA-03 complete and independently verified'),
        root/'initiatives/library-knowledge/README.md':('**LA-03 implemented; full processing underway:**','**LA-03 complete and independently verified:** [Measured results](../../knowledge/library_analytics/PRODUCTS-RESULT.md).'),
    }
    for path,(before,after) in edits.items():
        if path.is_file():
            original=path.read_text(encoding='utf-8');updated=original.replace(before,after)
            if updated!=original:path.write_text(updated,encoding='utf-8')


def report_only(project=PROJECT):
    """Render the current report from its verified receipt without replaying data checks."""
    project=Path(project);out=project/'KnowledgeBase/library-analytics'
    receipt=json.loads((out/'latest-analytical-release.json').read_text(encoding='utf-8-sig'))
    p=json.loads((out/'latest-products.json').read_text(encoding='utf-8-sig'));cp=json.loads((out/'latest-product-consumers.json').read_text(encoding='utf-8-sig'))
    result=json.loads(Path(receipt['verification']).read_text(encoding='utf-8-sig'))
    if (receipt['state']!='complete' or receipt['parent']!=p or receipt['consumers']!=cp or not result['ok']
            or result['run_id']!=p['run_id'] or result['consumer']['run_id']!=cp['run_id']
            or 'vocabulary_rows' not in result['totals']):
        raise RuntimeError('A matching fully verified receipt is required; run delivery or refresh first')
    receipt['report']=result_document(project,result);dump(out/'latest-analytical-release.json',receipt)
    mark_documentation(project);print(packed({'state':'complete','report':receipt['report'],'verified_at':receipt['verified_at']}),flush=True);return 0


def finish_existing(project,run):
    """Reverify an in-flight delivery with current code; never start a second owner."""
    project=Path(project);out=project/'KnowledgeBase/library-analytics'
    print(packed({'phase':'waiting-for-existing-delivery','parent_run':run}),flush=True)
    while True:
        receipt=out/'latest-analytical-release.json'
        if receipt.is_file():
            value=json.loads(receipt.read_text(encoding='utf-8-sig'))
            if value.get('state')=='complete' and value.get('parent',{}).get('run_id')==run:
                pointer=json.loads((out/'latest-products.json').read_text(encoding='utf-8-sig'))
                if pointer['run_id']!=run:raise RuntimeError('Latest product generation changed before final verification')
                return refresh(project)
        db=readonly(out/'pipeline/products.sqlite3')
        try:
            row=db.execute('SELECT state FROM product_runs WHERE id=?',(run,)).fetchone()
            owner=dict(db.execute('SELECT * FROM coordinator').fetchone() or {})
        finally:db.close()
        if not row or row['state'] not in ('running','complete'):
            raise RuntimeError('Existing delivery needs attention: '+str(dict(row) if row else None))
        if row['state']=='running' and (not owner or process_identity(owner['pid']) not in (owner['process_token'],'unknown')):
            raise RuntimeError('Parent worker stopped before delivery; resume its checkpoints')
        cp=out/'pipeline/consumers.sqlite3'
        if cp.is_file():
            cdb=readonly(cp)
            try:
                if cdb.execute("SELECT 1 FROM sqlite_master WHERE name='consumer_runs'").fetchone():
                    failed=cdb.execute("SELECT j.scope,j.state,j.error FROM consumer_runs c JOIN run_jobs r ON r.run_id=c.id JOIN jobs j ON j.id=r.job_id WHERE c.parent_run=? AND j.state IN ('failed','stale') LIMIT 1",(run,)).fetchone()
                    if failed:raise RuntimeError('Existing consumer delivery failed: '+packed(dict(failed)))
            finally:cdb.close()
        time.sleep(30)


def inspect(project=PROJECT):
    db=readonly(Path(project)/'KnowledgeBase/library-analytics/pipeline/products.sqlite3')
    try:
        run=db.execute('SELECT id FROM product_runs ORDER BY created_at DESC LIMIT 1').fetchone()[0]
        count=db.execute('SELECT count(DISTINCT contributor_id) FROM document_contributors WHERE run_id=?',(run,)).fetchone()[0]
        contributor=db.execute('SELECT contributor_id FROM document_contributors WHERE run_id=? LIMIT 1',(run,)).fetchone()[0]
        plan=[dict(r) for r in db.execute('''EXPLAIN QUERY PLAN SELECT coalesce(sum(x.matches),0) FROM document_role_counts x JOIN run_jobs r ON r.job_id=x.job_id
            JOIN (SELECT DISTINCT document_id FROM document_contributors WHERE run_id=? AND contributor_id=?) c ON c.document_id=x.document_id
            WHERE r.run_id=? AND x.role IN ('prose_candidate','boundary_prose_candidate')''',(run,contributor,run))]
        sources=[dict(r) for r in db.execute('''SELECT source_family,kind,count(*) documents,sum(characters) characters FROM document_dimensions
            WHERE run_id=? GROUP BY source_family,kind ORDER BY characters DESC LIMIT 10''',(run,))]
        stratum=[dict(r) for r in db.execute('''EXPLAIN QUERY PLAN SELECT d.language,d.genre,v.term,sum(v.count),count(*)
            FROM vocabulary_counts v JOIN run_jobs r ON r.job_id=v.job_id JOIN document_features f ON f.job_id=v.job_id
            JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=v.document_id
            WHERE r.run_id=? AND f.vocabulary_complete=1 GROUP BY d.language,d.genre,v.term''',(run,))]
        termrows=db.execute("SELECT sum(json_extract(f.metadata_json,'$.unique_tracked_terms')) FROM document_features f JOIN run_jobs r ON r.job_id=f.job_id WHERE r.run_id=?",(run,)).fetchone()[0]
        lexical_plan=[dict(r) for r in db.execute('''EXPLAIN QUERY PLAN SELECT d.language,d.genre,count(*) docs FROM document_features f
            JOIN run_jobs r ON r.job_id=f.job_id JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=f.document_id
            WHERE r.run_id=? AND f.vocabulary_complete=1 GROUP BY d.language,d.genre''',(run,))]
        ordered_plan=[dict(r) for r in db.execute('''EXPLAIN QUERY PLAN SELECT d.*,f.job_id,f.tracked_tokens,f.vocabulary_complete FROM document_features f JOIN run_jobs r ON r.job_id=f.job_id
            JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=f.document_id WHERE r.run_id=? ORDER BY d.language,d.genre,d.document_id''',(run,))]
        word_plan=[dict(r) for r in db.execute('EXPLAIN QUERY PLAN SELECT term,count FROM vocabulary_counts WHERE job_id=? AND count>=3',('example',))]
        baseline_plan=[dict(r) for r in db.execute('EXPLAIN QUERY PLAN SELECT term,documents FROM stratum_vocabulary WHERE run_id=? AND language=? AND genre=?',(run,'en','sermon'))]
        timer=time.monotonic()
        first=dict(db.execute('''SELECT d.document_id,d.language,d.genre,f.job_id,f.tracked_tokens,f.vocabulary_complete FROM document_features f JOIN run_jobs r ON r.job_id=f.job_id
            JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=f.document_id WHERE r.run_id=? ORDER BY d.language,d.genre,d.document_id LIMIT 1''',(run,)).fetchone())
        first['selection_seconds']=round(time.monotonic()-timer,3)
        first['baseline_rows']=db.execute('SELECT count(*) FROM stratum_vocabulary WHERE run_id=? AND language=? AND genre=?',(run,first['language'],first['genre'])).fetchone()[0]
        timer=time.monotonic()
        full_first=db.execute('''SELECT d.*,f.job_id,f.tracked_tokens,f.vocabulary_complete FROM document_features f JOIN run_jobs r ON r.job_id=f.job_id
            JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=f.document_id WHERE r.run_id=? ORDER BY d.language,d.genre,d.document_id LIMIT 1''',(run,)).fetchone()
        first['full_selection_seconds']=round(time.monotonic()-timer,3);first['descriptor_characters']=len(full_first['descriptor_json'])
        timer=time.monotonic();first['top_terms']=db.execute('SELECT term,count FROM vocabulary_counts WHERE job_id=? ORDER BY count DESC,term LIMIT 3',(first['job_id'],)).fetchall()
        first['top_terms']=[list(x) for x in first['top_terms']];first['top_term_seconds']=round(time.monotonic()-timer,3)
        print(json.dumps({'run_id':run,'linked_contributors':count,'profile_query_plan':plan,'stratum_query_plan':stratum,
            'lexical_profile_strata_plan':lexical_plan,'lexical_profile_ordered_plan':ordered_plan,'profile_word_plan':word_plan,
            'profile_baseline_plan':baseline_plan,'first_profile_input':first,'vocabulary_rows_by_checkpointed_features':termrows,'largest_text_channels':sources},ensure_ascii=True),flush=True)
    finally:db.close()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--project',type=Path,default=PROJECT);parser.add_argument('--wait-for');parser.add_argument('--inspect',action='store_true');parser.add_argument('--refresh',action='store_true');parser.add_argument('--finish-existing');parser.add_argument('--report-only',action='store_true')
    args=parser.parse_args()
    if args.report_only:raise SystemExit(report_only(args.project))
    elif args.finish_existing:raise SystemExit(finish_existing(args.project,args.finish_existing))
    elif args.inspect:inspect(args.project)
    elif args.refresh:raise SystemExit(refresh(args.project))
    else:raise SystemExit(main(args.project,args.wait_for))
