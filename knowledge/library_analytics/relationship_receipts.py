"""Measured runtime and supported/deferred coverage without upstream writes."""
from collections import defaultdict
import json
from .relationship_miner import root
from .concept_index import read
from .build import readonly,dump
from .inputs import packed

def main():
    folder=root();summary=read(folder/'population.json');run=summary['run_id'];db=readonly(folder/'relationships.sqlite3')
    try:
        db.execute('PRAGMA cache_size=-4194304');db.execute('PRAGMA mmap_size=68719476736');db.execute('PRAGMA temp_store=MEMORY')
        print(packed({'phase':'coverage','read_only_cache_mib':4096,'mmap_bytes':db.execute('PRAGMA mmap_size').fetchone()[0]}),flush=True)
        coverage={'run_id':run,'scope':summary['scope'],
            'documents':[dict(r) for r in db.execute('''SELECT s.language,count(*) documents,sum(r.native_windows>0) native_pool_documents,
                sum(r.fingerprints>0) wording_index_documents,sum(r.references_count>0) reference_index_documents,
                sum(s.work_id IS NULL) unresolved_work_documents,sum(s.edition_id IS NULL) unresolved_edition_documents,
                sum(s.work_id IS NULL AND r.native_windows>0) unresolved_work_native_pool_documents,
                sum(s.edition_id IS NULL AND r.native_windows>0) unresolved_edition_native_pool_documents
                FROM scope s JOIN document_results r ON r.run_id=s.run_id AND r.document_id=s.document_id WHERE s.run_id=? GROUP BY s.language''',(run,))],
            'feature_dispositions':[dict(r) for r in db.execute('SELECT channel,disposition,count(*) features,sum(postings) postings FROM feature_stats WHERE run_id=? GROUP BY channel,disposition',(run,))],
            'semantic':summary['contract']['config']['semantic'],'limitations':summary['contract']['config']}
        coverage['native_pool_identities']=dict(db.execute('''SELECT count(*) documents,count(DISTINCT s.work_id) known_work_ids,
            count(DISTINCT s.edition_id) known_edition_ids,count(DISTINCT s.independence_group) retained_independence_groups
            FROM scope s JOIN document_results d ON d.run_id=s.run_id AND d.document_id=s.document_id
            WHERE s.run_id=? AND d.native_windows>0''',(run,)).fetchone())
        joint=read(folder/'joint-population.json');coverage['joint_stage']={'run_id':joint['run_id'],'counts':joint['counts'],'config':joint['contract']['config']}
        print(packed({'phase':'base-group-omissions'}),flush=True)
        coverage['bounded_group_omissions']=[dict(r) for r in db.execute('''SELECT channel,sum(max(n-?,0)) omitted_posting_representatives FROM
            (SELECT p.channel,p.feature,p.independence_group,count(*) n FROM feature_stats s CROSS JOIN postings p INDEXED BY sqlite_autoindex_postings_1
             ON s.run_id=p.run_id AND s.channel=p.channel AND s.feature=p.feature
             WHERE s.run_id=? AND s.disposition='bounded-candidate-feature' GROUP BY p.channel,p.feature,p.independence_group)
            GROUP BY channel''',(summary['contract']['config']['max_windows_per_group'],run))]
        print(packed({'phase':'joint-group-omissions'}),flush=True)
        coverage['joint_stage']['omitted_posting_representatives']=db.execute('''SELECT coalesce(sum(max(n-?,0)),0) FROM
            (SELECT p.feature,p.independence_group,count(*) n FROM joint_features s CROSS JOIN joint_postings p INDEXED BY sqlite_autoindex_joint_postings_1
             ON s.run_id=p.run_id AND s.feature=p.feature WHERE s.run_id=? AND s.disposition='bounded-joint-candidate'
             GROUP BY p.feature,p.independence_group)''',(joint['contract']['config']['max_windows_per_group'],joint['run_id'])).fetchone()[0]
        coverage['omission_count_unit']='Posting representatives within otherwise eligible features, not distinct windows or all potential missing pairs; potential suppressed pair unions are not enumerated.'
        dump(folder/'coverage.json',coverage)
        attempts={};observations=defaultdict(list)
        for line in (folder/'population.log').read_text('utf-8').splitlines():
            try:r=json.loads(line)
            except ValueError:continue
            if r.get('run_id')!=run or 'pid' not in r:continue
            key=(r['pid'],r['process_token']);attempts[key]=max(attempts.get(key,0),r['seconds_this_attempt'])
            if r.get('phase') in ('documents','interrupted'):observations[key].append(r)
        samples=[];sampled_file_peaks={}
        if (folder/'resource-samples.jsonl').exists():
            for line in (folder/'resource-samples.jsonl').read_text('utf-8').splitlines():
                r=json.loads(line)
                if r.get('run_id')==run:
                    samples.extend(r.get('owners',[]))
                    for name,size in r.get('bytes',{}).items():sampled_file_peaks[name]=max(sampled_file_peaks.get(name,0),size)
        resources={}
        for sample in samples:
            key=(sample['pid'],sample['process_token'])
            value=resources.setdefault(key,{'pid':key[0],'process_token':key[1],'sampled_cpu_seconds':0,'sampled_peak_rss_bytes':0,'sampled_read_bytes':None,'sampled_write_bytes':None})
            cpu=sample.get('cpu',{});value['sampled_cpu_seconds']=max(value['sampled_cpu_seconds'],cpu.get('user',0)+cpu.get('system',0))
            value['sampled_peak_rss_bytes']=max(value['sampled_peak_rss_bytes'],sample.get('rss',0))
            for field in ('read_bytes','write_bytes'):
                if field in sample.get('io',{}):value['sampled_'+field]=max(value['sampled_'+field] or 0,sample['io'][field])
        value={'run_id':run,'observed_attempt_seconds_lower_bound':sum(attempts.values()),
            'attempts':[{'pid':k[0],'process_token':k[1],'observed_seconds':v} for k,v in attempts.items()],
            'document_processing_seconds':db.execute('SELECT sum(seconds) FROM document_results WHERE run_id=?',(run,)).fetchone()[0],
            'slowest_document_callbacks':[dict(r) for r in db.execute("SELECT d.document_id,json_extract(s.descriptor_json,'$.title') title,d.native_windows,d.fingerprints,d.references_count,d.seconds FROM document_results d JOIN scope s ON s.run_id=d.run_id AND s.document_id=d.document_id WHERE d.run_id=? ORDER BY d.seconds DESC,d.document_id LIMIT 10",(run,))],
            'pair_processing_seconds':db.execute('SELECT sum(seconds) FROM bucket_results WHERE run_id=?',(run,)).fetchone()[0],
            'joint_stage_seconds_final_attempt':joint['seconds_this_attempt'],
            'peak_sampled_rss_bytes':max((s.get('rss',0) for s in samples),default=None),
            'sampled_process_resources':list(resources.values()),
            'sampled_cpu_seconds_lower_bound':sum(r['sampled_cpu_seconds'] for r in resources.values()),
            'sampled_read_bytes_lower_bound':sum(r['sampled_read_bytes'] or 0 for r in resources.values()),
            'sampled_write_bytes_lower_bound':sum(r['sampled_write_bytes'] or 0 for r in resources.values()),
            'database_bytes':(folder/'relationships.sqlite3').stat().st_size,
            'sampled_peak_file_bytes':sampled_file_peaks,
            'joint_wal_caution':'The immutable parent read cursor spans atomic joint posting batches and delays WAL recycling; sampled WAL peak is temporary disk demand, not final table size. No production checkpoint/kill was forced.',
            'limits':'Attempt/process samples can omit validation tails and whole attempts; CPU/IO values are lower bounds, not continuous instrumentation. IO counters are process IO, not proof of physical disk traffic. Peak memory is sampled; database includes preserved calibration; excludes oracle/evaluation/export costs'}
        # Final attempt completion contains a more accurate terminal elapsed value.
        if attempts:
            last=list(attempts)[-1];value['observed_attempt_seconds_lower_bound']+=max(0,summary['seconds_this_attempt']-attempts[last])
            value['attempts'][-1]['observed_seconds']=max(summary['seconds_this_attempt'],attempts[last])
        for attempt in value['attempts']:
            key=(attempt['pid'],attempt['process_token']);seen=observations[key]
            if len(seen)>1:
                first,last=seen[0],seen[-1];elapsed=last['seconds_this_attempt']-first['seconds_this_attempt']
                attempt['observed_document_phase']={'seconds':elapsed,'documents':last['processed_documents']-first['processed_documents'],'native_windows':last['native_windows']-first['native_windows'],'comparison_caution':'Different source strata and cache warm-up; not a controlled performance benchmark'}
        dump(folder/'runtime.json',value);print(packed({'coverage':coverage,'runtime':value}))
    finally:db.close()

if __name__=='__main__':main()
