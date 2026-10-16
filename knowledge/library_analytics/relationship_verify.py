"""Independent structural and paired-source witness checks, not relevance judgments."""
import argparse
from .relationship_query import Relationships
from .relationship_miner import root
from .build import dump
from .inputs import packed

def verify(calibration=False,joint_calibration=False):
    engine=Relationships(calibration,joint_calibration);db=engine.db;run=engine.run
    try:
        db.execute('PRAGMA cache_size=-8388608')
        def progress(phase):print(packed({'phase':phase,'run_id':run,'read_only_cache_mib':8192}),flush=True)
        db.execute('ATTACH DATABASE ? AS parent',(engine.inputs.pointer['database'],))
        db.execute('PRAGMA parent.cache_size=-262144')
        progress('document-accounting')
        missing_documents=db.execute("SELECT count(*) FROM scope s LEFT JOIN document_results d ON d.run_id=s.run_id AND d.document_id=s.document_id WHERE s.run_id=? AND s.disposition='supported' AND d.document_id IS NULL",(run,)).fetchone()[0]
        bad_document_counts=0 if joint_calibration else db.execute('''SELECT count(*) FROM document_results d WHERE d.run_id=? AND d.native_windows+d.deferred_windows!=(SELECT count(*) FROM parent.windows w WHERE w.run_id=? AND w.document_id=d.document_id)''',(run,engine.inputs.run)).fetchone()[0]
        progress('posting-bounds')
        bad=0 if joint_calibration else db.execute('''SELECT count(*) FROM postings p LEFT JOIN parent.windows w ON w.id=p.window_id
            WHERE p.run_id=? AND (w.id IS NULL OR w.run_id!=? OR p.start<w.start OR p.end>w.end OR p.start>=p.end
            OR w.kind='document-representation' OR w.state='candidate-unreviewed')''',(run,engine.inputs.run)).fetchone()[0]
        progress('base-pair-links')
        badpairs=0 if joint_calibration else db.execute('''SELECT count(*) FROM pair_evidence e LEFT JOIN postings a ON a.run_id=e.run_id AND a.channel=e.channel AND a.feature=e.feature AND a.window_id=e.left_window
            LEFT JOIN postings b ON b.run_id=e.run_id AND b.channel=e.channel AND b.feature=e.feature AND b.window_id=e.right_window
            WHERE e.run_id=? AND (a.window_id IS NULL OR b.window_id IS NULL OR a.independence_group=b.independence_group
            OR a.start!=e.left_start OR a.end!=e.left_end OR b.start!=e.right_start OR b.end!=e.right_end
            OR a.witness_hash!=e.left_hash OR b.witness_hash!=e.right_hash)''',(run,)).fetchone()[0]
        sample=[] if joint_calibration else db.execute('''SELECT left_window,right_window FROM pair_evidence WHERE rowid IN
            (SELECT min(rowid) FROM pair_evidence WHERE run_id=? GROUP BY channel,left_window%32)''',(run,)).fetchall()
        badjoint=badjointposts=0;joint_window_coverage=None
        if engine.joint:
            progress('joint-window-accounting')
            import json
            contract=json.loads(db.execute('SELECT contract_json FROM joint_runs WHERE id=?',(engine.joint,)).fetchone()[0])
            chosen=contract['development_calibration_windows'] if joint_calibration else []
            clause=' AND window_id IN ('+','.join('?' for _ in chosen)+')' if joint_calibration else ''
            expected=db.execute("SELECT count(DISTINCT window_id) FROM postings INDEXED BY postings_reference_scan WHERE run_id=? AND channel='reference'"+clause,(run,*chosen)).fetchone()[0]
            actual=db.execute('SELECT coalesce(sum(windows),0) FROM joint_batches WHERE run_id=?',(engine.joint,)).fetchone()[0]
            joint_window_coverage={'expected_reference_bearing_windows':expected,'processed_windows':actual,'ok':expected==actual}
            progress('joint-posting-links')
            badjointposts=db.execute('''SELECT count(*) FROM joint_postings j,json_each(j.feature) x
                LEFT JOIN postings p ON p.run_id=? AND p.channel='reference' AND p.feature=x.value AND p.window_id=j.window_id
                WHERE j.run_id=? AND (p.window_id IS NULL OR p.independence_group!=j.independence_group OR json_array_length(j.feature)!=2)''',(run,engine.joint)).fetchone()[0]
            progress('joint-pair-links')
            badjoint=db.execute('''SELECT count(*) FROM joint_pairs e LEFT JOIN joint_postings a ON a.run_id=e.run_id AND a.feature=e.feature AND a.window_id=e.left_window
                LEFT JOIN joint_postings b ON b.run_id=e.run_id AND b.feature=e.feature AND b.window_id=e.right_window
                WHERE e.run_id=? AND (a.window_id IS NULL OR b.window_id IS NULL OR a.independence_group=b.independence_group)''',(engine.joint,)).fetchone()[0]
            sample+=db.execute('SELECT left_window,right_window FROM joint_pairs WHERE rowid IN (SELECT min(rowid) FROM joint_pairs WHERE run_id=? GROUP BY left_window%32)',(engine.joint,)).fetchall()
        progress('source-witnesses');checks=[]
        for r in sample:
            pair=engine.pair(r['left_window'],r['right_window'])
            checks.append({'left_window':r['left_window'],'right_window':r['right_window'],'wording':pair['wording_features'],'references':pair['shared_reference_ranges'],'ok':True})
        coverage=[dict(r) for r in db.execute('SELECT language,count(*) documents,sum(CASE WHEN work_id IS NULL THEN 1 ELSE 0 END) unresolved_work FROM scope WHERE run_id=? AND disposition=\'supported\' GROUP BY language',(run,))]
        value={'run_id':run,'joint_run_id':engine.joint,'ok':not bad and not badpairs and not badjoint and not badjointposts and not missing_documents and not bad_document_counts and (joint_window_coverage is None or joint_window_coverage['ok']),'missing_supported_documents':missing_documents,'inconsistent_document_window_counts':bad_document_counts,'joint_window_coverage':joint_window_coverage,'invalid_postings':bad,'invalid_pairs':badpairs,'invalid_joint_postings':badjointposts,'invalid_joint_pairs':badjoint,'paired_source_checks':checks,'paired_sources_passed':len(checks),'coverage':coverage,
            'reviewer_type':'deterministic source reconstruction/hash/bounds checks; not semantic or human review'}
        dump(root()/('calibration-verification.json' if calibration else 'joint-calibration-verification.json' if joint_calibration else 'population-verification.json'),value)
        print(packed({k:v for k,v in value.items() if k not in ('paired_source_checks','coverage')}))
        if not value['ok']:raise ValueError('Relationship verification failed')
    finally:engine.close()

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--calibration',action='store_true');p.add_argument('--joint-calibration',action='store_true');a=p.parse_args();verify(a.calibration,a.joint_calibration)
