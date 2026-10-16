"""Independent release hashes, denominators and bounded source-witness checks."""
import argparse
import hashlib
import json
from pathlib import Path
from .build import PROJECT,readonly,dump,now
from .inputs import packed
from .product_inputs import BlockReader
from .product_consumers import file_sha
from .text_features import WORDS,token,phrase_hash
from .product_dependencies import text_inputs
from .citation_roles import classify
from .jobs import background_priority


def files(folder):
    manifest=json.loads((folder/'release_manifest.json').read_text(encoding='utf-8-sig'));summary=json.loads((folder/'summary.json').read_text(encoding='utf-8-sig'));errors=[];total=0
    listed=[e['name'] for e in manifest['files']];expected={t+'.jsonl' for t in summary['table_rows']}|{'summary.json'}
    if set(listed)!=expected or len(listed)!=len(set(listed)):errors.append('manifest-file-set')
    if manifest['run_id']!=summary['run_id']:errors.append('manifest-generation')
    for entry in manifest['files']:
        p=folder/entry['name']
        if not p.resolve().is_relative_to(folder.resolve()):raise ValueError('Manifest path escaped release')
        h=hashlib.sha256();lines=0;size=0
        with p.open('rb') as f:
            for raw in iter(lambda:f.read(4*1024*1024),b''):
                h.update(raw);lines+=raw.count(b'\n');size+=len(raw)
        if size!=entry['bytes'] or h.hexdigest()!=entry['sha256'] or ('rows' in entry and (lines!=entry['rows'] or lines!=summary['table_rows'].get(p.stem))):errors.append(entry['name'])
        total+=size
    return {'files':len(manifest['files']),'bytes':total,'errors':errors}


def reference_witnesses(db,text,run,project):
    chosen={};checks=[]
    for r in db.execute('''SELECT x.*,r.scope FROM document_role_counts x JOIN run_jobs r ON r.job_id=x.job_id
        JOIN document_dimensions d ON d.run_id=r.run_id AND d.document_id=x.document_id WHERE r.run_id=?
        ORDER BY CASE WHEN d.kind IN ('library_text','library_review') THEN 0 ELSE 1 END,x.document_id''',(run,)):
        group=chosen.setdefault(r['role'],[])
        if len(group)<2:group.append(dict(r))
    for role,docs in sorted(chosen.items()):
        for d in docs:
            proof=db.execute('SELECT * FROM reference_roles WHERE job_id=? AND role=? LIMIT 1',(d['job_id'],role)).fetchone()
            source=text.execute('SELECT * FROM literal_references WHERE job_id=? AND id=?',(proof['text_job_id'],proof['reference_id'])).fetchone()
            descriptor=json.loads(db.execute('SELECT descriptor_json FROM document_dimensions WHERE run_id=? AND document_id=?',(run,d['document_id'])).fetchone()[0])
            reader=BlockReader(descriptor,project/'KnowledgeBase/knowledge.sqlite3')
            for _ in reader.stream():pass
            spans=json.loads(source['evidence_json'])['segments'];context=[]
            for s in spans:
                block=reader.get(s);context.append(block['text'][max(0,s['start']-80):s['end']+80])
            if classify(descriptor['kind'],source['reference_kind'],spans,reader,d['document_id'])!=(proof['role'],proof['rule']):raise ValueError('Stored role no longer matches its rule: '+proof['reference_id'])
            reader.unchanged()
            checks.append({'role':role,'document_id':d['document_id'],'reference_id':proof['reference_id'],'text_job_id':proof['text_job_id'],
                'literal':source['literal'],'source_context':context,'spans_verified':len(spans),'state':'verified'})
    return checks


def reuse_witnesses(db,run,project):
    checks=[]
    for candidate in db.execute('SELECT * FROM reuse_candidates WHERE run_id=? ORDER BY shared_informative_signatures DESC,document_a,document_b LIMIT 12',(run,)):
        witnesses=[]
        for doc in (candidate['document_a'],candidate['document_b']):
            d=json.loads(db.execute('SELECT descriptor_json FROM document_dimensions WHERE run_id=? AND document_id=?',(run,doc)).fetchone()[0])
            r=db.execute('''SELECT s.* FROM reuse_signatures s JOIN run_jobs j ON j.job_id=s.job_id
                WHERE j.run_id=? AND s.document_id=? AND s.hash=?''',(run,doc,candidate['evidence_hash'])).fetchone()
            e=json.loads(r['evidence_json']);reader=BlockReader(d,project/'KnowledgeBase/knowledge.sqlite3');parts=[]
            for b in reader.stream():
                ordinal=b['ordinal']
                if e['first_block']<=ordinal<=e['last_block']:
                    parts.append(b['text'][e['start'] if ordinal==e['first_block'] else 0:e['end'] if ordinal==e['last_block'] else len(b['text'])])
            recovered=' '.join(token(m.group()) for m in WORDS.finditer(' '.join(parts)));reader.unchanged()
            if recovered!=r['phrase'] or phrase_hash(recovered.split())!=candidate['evidence_hash']:raise ValueError('Reuse witness does not resolve: '+doc)
            witnesses.append({'document_id':doc,'phrase':recovered,'first_block':e['first_block'],'last_block':e['last_block']})
        checks.append({'candidate_kind':candidate['candidate_kind'],'shared_signatures':candidate['shared_informative_signatures'],
            'evidence_hash':candidate['evidence_hash'],'witnesses':witnesses,'state':'verified'})
    return checks


def canonical_bindings(db,run,project):
    root=project/'Website/content/library/catalog';errors=[];works={};editions={};pairs=0
    for row in db.execute('SELECT DISTINCT work_id FROM document_dimensions WHERE run_id=? AND work_verified=1',(run,)):
        ident=row[0];p=root/'works'/(ident+'.json');value=json.loads(p.read_text(encoding='utf-8-sig')) if p.is_file() else {}
        works[ident]=value
        if value.get('id')!=ident:errors.append('work-record-id:'+str(ident))
    for row in db.execute('SELECT DISTINCT edition_id,work_id FROM document_dimensions WHERE run_id=? AND edition_verified=1',(run,)):
        ident,work=row;pairs+=1
        if ident not in editions:
            p=root/'editions'/(ident+'.json');editions[ident]=json.loads(p.read_text(encoding='utf-8-sig')) if p.is_file() else {}
        value=editions[ident]
        if value.get('id')!=ident or value.get('workId')!=work:errors.append('edition-record-binding:'+str(ident))
    return {'work_records':len(works),'edition_records':len(editions),'edition_work_pairs':pairs,'errors':errors}


def verify(project=PROJECT,with_consumers=True):
    background_priority();project=Path(project);out=project/'KnowledgeBase/library-analytics';pointer=json.loads((out/'latest-products.json').read_text(encoding='utf-8-sig'));run=pointer['run_id']
    db=readonly(Path(pointer['database']));errors=[]
    try:
        record=db.execute('SELECT * FROM product_runs WHERE id=?',(run,)).fetchone();summary=json.loads(record['summary_json'])
        if record['state']!='complete' or not summary['validation']['ok']:errors.append('parent-not-complete')
        if summary!=json.loads(Path(pointer['summary']).read_text(encoding='utf-8-sig')) or summary['run_id']!=run:errors.append('parent-persisted-summary')
        proof=files(Path(pointer['release']));errors+=proof['errors']
        totals={}
        totals['reference_roles']=db.execute('SELECT count(*) FROM reference_roles x JOIN run_jobs r ON r.job_id=x.job_id WHERE r.run_id=?',(run,)).fetchone()[0]
        totals['document_role_sum']=db.execute('SELECT sum(x.matches) FROM document_role_counts x JOIN run_jobs r ON r.job_id=x.job_id WHERE r.run_id=?',(run,)).fetchone()[0]
        totals['matrix_sum']=db.execute('SELECT sum(matches) FROM scripture_matrix WHERE run_id=?',(run,)).fetchone()[0]
        expected=summary['validation']['expected_matches']
        if any(value!=expected for value in totals.values()):errors.append('reference-denominators')
        eligible=db.execute("SELECT count(*) FROM document_dimensions WHERE run_id=? AND status='completed' AND kind IN ('library_text','library_review')",(run,)).fetchone()[0]
        totals['lexical_documents']=db.execute('SELECT count(*) FROM document_features f JOIN run_jobs r ON r.job_id=f.job_id WHERE r.run_id=?',(run,)).fetchone()[0]
        if totals['lexical_documents']!=eligible:errors.append('lexical-population')
        lexical=db.execute('''SELECT count(*) rows,coalesce(sum(v.count),0) tracked_tokens
            FROM run_jobs r CROSS JOIN vocabulary_counts v INDEXED BY vocabulary_order
            WHERE r.run_id=? AND v.job_id=r.job_id''',(run,)).fetchone()
        expected_lexical=db.execute('''SELECT coalesce(sum(json_extract(f.metadata_json,'$.unique_tracked_terms')),0) rows,
            coalesce(sum(f.tracked_tokens),0) tracked_tokens FROM run_jobs r JOIN document_features f ON f.job_id=r.job_id
            WHERE r.run_id=?''',(run,)).fetchone()
        totals['vocabulary_rows']=lexical['rows'];totals['tracked_lexical_tokens']=lexical['tracked_tokens']
        if tuple(lexical)!=tuple(expected_lexical):errors.append('full-lexical-counts')
        totals['selected_jobs']=db.execute('SELECT count(*) FROM run_jobs WHERE run_id=?',(run,)).fetchone()[0]
        badjobs=db.execute("SELECT count(*) FROM run_jobs r JOIN jobs j ON j.id=r.job_id LEFT JOIN checkpoints c ON c.job_id=j.id WHERE r.run_id=? AND (j.state!='succeeded' OR c.job_id IS NULL)",(run,)).fetchone()[0]
        if badjobs:errors.append('job-checkpoints')
        totals['orphan_matrix_rows']=db.execute('''SELECT count(*) FROM scripture_matrix m LEFT JOIN document_dimensions d
            ON d.run_id=m.run_id AND d.document_id=m.document_id WHERE m.run_id=? AND d.document_id IS NULL''',(run,)).fetchone()[0]
        if totals['orphan_matrix_rows']:errors.append('matrix-document-join')
        changes=[]
        for path,v in json.loads(record['deps_json']).items():
            if not Path(path).is_file() or file_sha(path)!=v['sha256']:changes.append(path)
        if changes:errors.append('changed-source-metadata-or-XML')
        bindings=canonical_bindings(db,run,project)
        if bindings['errors']:errors.append('canonical-ID-bindings')
        text=readonly(Path(summary['text_bundle']['database']))
        try:
            input_proofs=text_inputs(text,summary['text_bundle']['run_ids'],fresh_hashes=True)
            if input_proofs['errors']:errors.append('changed-LA02-source-inputs')
            references=reference_witnesses(db,text,run,project)
        finally:text.close()
        reused=reuse_witnesses(db,run,project)
        consumer=None
        if with_consumers:
            cp=json.loads((out/'latest-product-consumers.json').read_text(encoding='utf-8-sig'));cs=json.loads(Path(cp['summary']).read_text(encoding='utf-8-sig'))
            if cp['parent_run']!=run or cs['state']!='complete' or not cs['validation']['ok']:errors.append('consumer-generation-contract')
            cdb=readonly(Path(cp['database']))
            try:
                cr=cdb.execute('SELECT state,summary_json FROM consumer_runs WHERE id=?',(cp['run_id'],)).fetchone()
                if not cr or cr['state']!='complete' or json.loads(cr['summary_json'])!=cs:errors.append('consumer-persisted-summary')
                for table,count in cs['table_rows'].items():
                    if cdb.execute('SELECT count(*) FROM '+table+' WHERE run_id=?',(cp['run_id'],)).fetchone()[0]!=count:errors.append('consumer-table-count:'+table)
            finally:cdb.close()
            consumer={'run_id':cp['run_id'],'files':files(Path(cp['release']))}
            errors+=consumer['files']['errors']
        result={'run_id':run,'checked_at':now(),'ok':not errors,'errors':errors,'release_files':proof,'totals':totals,
            'changed_source_inputs':changes,'canonical_bindings':bindings,'LA02_input_proofs':input_proofs,'reference_witnesses':references,'reuse_witnesses':reused,'consumer':consumer,
            'limits':['Witness checks establish locations, not semantic role-classification precision.','Bounded reuse samples are not all-pair proof or a deletion decision.']}
        path=Path(pointer['release'])/('verification-with-consumers.json' if with_consumers else 'verification.json');dump(path,result)
        print(packed({k:v for k,v in result.items() if k not in ('reference_witnesses','reuse_witnesses')}),flush=True)
        return result
    finally:db.close()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--project',type=Path,default=PROJECT);parser.add_argument('--parent-only',action='store_true')
    args=parser.parse_args();raise SystemExit(0 if verify(args.project,not args.parent_only)['ok'] else 2)
