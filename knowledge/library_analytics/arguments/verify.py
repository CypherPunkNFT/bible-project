"""Population accounting and independent located source reconstruction."""
import argparse,json,time
from collections import Counter
from pathlib import Path
from .inputs import ROOT,ro,read,write_json,Inputs,sha
from .query import located
from ..jobs import JobStore,StaleInput
from ..build import PROJECT
from .validation_telemetry import ValidationProgress

def verify(calibration=False):
    started=time.monotonic();summary=read(ROOT/('calibration.json' if calibration else 'population.json'));rid=summary['run_id']
    shared=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3');db=None;inputs=None;telemetry=None
    try:
        shared.acquire();telemetry=ValidationProgress(rid,shared);telemetry.begin('input_dependencies')
        db=ro(ROOT/'arguments.sqlite3');db.set_progress_handler(telemetry.sql_callback,1000000);inputs=Inputs();inputs.check()
        inputs.check_contract(summary['contract'])
        telemetry.finish('passed')
        queries=[
          ('processed_documents','SELECT count(*) FROM document_results WHERE run_id=?'),
          ('supported_documents',"SELECT count(*) FROM scope WHERE run_id=? AND disposition='supported'"),
          ('failed_or_unfinished_jobs',"SELECT count(*) FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? AND j.state!='succeeded'"),
          ('invalid_statement_bounds','SELECT count(*) FROM statements s JOIN source_spans p ON p.statement_id=s.id WHERE s.run_id=? AND NOT(p.section_start<=s.start AND s.start<s.end AND s.end<=p.section_end AND length(s.text)=s.end-s.start)'),
          ('invalid_qualification_bounds','SELECT count(*) FROM statements s JOIN qualifications q ON q.statement_id=s.id WHERE s.run_id=? AND NOT(s.start<=q.start AND q.start<q.end AND q.end<=s.end AND length(q.literal)=q.end-q.start)'),
          ('dangling_link_endpoints','SELECT count(*) FROM argument_links l LEFT JOIN statements a ON a.id=l.source_id LEFT JOIN statements b ON b.id=l.target_id WHERE l.run_id=? AND (a.id IS NULL OR b.id IS NULL OR a.run_id!=l.run_id OR b.run_id!=l.run_id)'),
          ('fts_rows','SELECT count(*) FROM statement_search WHERE run_id=?'),
          ('statements','SELECT count(*) FROM statements WHERE run_id=?'),
        ]
        checks={}
        for name,sql in queries:
            telemetry.begin(name);checks[name]=db.execute(sql,(rid,)).fetchone()[0];telemetry.finish(checks[name])
        shared.heartbeat()
        telemetry.begin('rhetorical_kind_counts')
        kinds=[dict(r) for r in db.execute('SELECT kind,count(*) n FROM statements WHERE run_id=? GROUP BY kind',(rid,))]
        telemetry.finish(len(kinds));telemetry.begin('source_witness_reconstruction')
        witnesses=[];seen=set();strata=Counter();errors=[]
        prefix_done=0;prefix_total=len(kinds)*len(range(0,256,16 if calibration else 8))
        for kind in kinds:
            for n in range(0,256,16 if calibration else 8):
                prefix=('quote-' if kind['kind']=='quotation' else 'arg-')+f'{n:02x}'
                row=db.execute('SELECT * FROM statements INDEXED BY statements_kind WHERE run_id=? AND kind=? AND id>=? ORDER BY id LIMIT 1',(rid,kind['kind'],prefix)).fetchone()
                prefix_done+=1;telemetry.witnesses(prefix_done,prefix_total,len(witnesses),len(errors))
                if row is None or row['id'] in seen:continue
                seen.add(row['id'])
                try:
                    witness=located(db,row,inputs);strata[witness['source_span']['coordinate']+':'+kind['kind']]+=1
                    witnesses.append({'statement_id':row['id'],'kind':row['kind'],'coordinate':witness['source_span']['coordinate'],'source_path':witness['source_span']['path'],'start':row['start'],'end':row['end'],'text_sha256':row['text_sha256'],'qualified_witnesses':len(witness['qualifications']),'destination_states':[d['state'] for d in witness['destinations']]})
                except Exception as exc:errors.append({'statement_id':row['id'],'error':str(exc)})
            shared.heartbeat()
        telemetry.finish({'passed':len(witnesses),'failed':len(errors),'prefix_lookups':prefix_done})
        telemetry.begin('sqlite_quick_check')
        checks['sqlite_quick_check']=db.execute('PRAGMA quick_check').fetchone()[0]
        telemetry.finish(checks['sqlite_quick_check']);telemetry.begin('document_sum_statement_count')
        checks['document_sum_statement_count']=db.execute('SELECT coalesce(sum(statements),0) FROM document_results WHERE run_id=?',(rid,)).fetchone()[0]
        telemetry.finish(checks['document_sum_statement_count'])
        ok=(checks['processed_documents']==checks['supported_documents'] and checks['statements']==checks['fts_rows']==checks['document_sum_statement_count'] and checks['sqlite_quick_check']=='ok' and not errors and all(checks[k]==0 for k in ['failed_or_unfinished_jobs','invalid_statement_bounds','invalid_qualification_bounds','dangling_link_endpoints']))
        result={'run_id':rid,'ok':ok,'checks':checks,'kinds':kinds,'witnesses':{'passed':len(witnesses),'failed':len(errors),'strata':dict(strata),'receipts':witnesses,'errors':errors},'parent_proofs':inputs.proofs,'seconds':time.monotonic()-started,'reviewer':'deterministic independent source reconstruction; content judgments recorded separately','sampling':'Indexed cryptographic-ID prefix seeks across every populated rhetorical kind; no claimed population semantic precision'}
        write_json(ROOT/('calibration-verification.json' if calibration else 'population-verification.json'),result);print(json.dumps({k:result[k] for k in ['run_id','ok','checks','seconds']},indent=2))
        if not ok:raise RuntimeError('KR-130 verification failed')
        telemetry.terminal('complete')
        return result
    except BaseException as exc:
        if telemetry is not None:telemetry.terminal('failed',exc)
        raise
    finally:
        if db:db.close()
        if inputs:inputs.close()
        shared.close()

def main():
    p=argparse.ArgumentParser();p.add_argument('--calibration',action='store_true');a=p.parse_args();verify(a.calibration)
if __name__=='__main__':main()
