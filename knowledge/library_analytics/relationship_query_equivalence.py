"""Compare indexed endpoint SQL with the preserved pre-optimization queries."""
import argparse
import ast
from pathlib import Path
from .relationship_miner import root
from .concept_index import read,filehash
from .build import readonly,dump
from .inputs import packed,digest
from .jobs import background_priority

def queries(path):
    return {'cocitation' if 'joint_pairs' in n.value else 'wording':n.value for n in ast.walk(ast.parse(path.read_text('utf-8'))) if isinstance(n,ast.Constant) and isinstance(n.value,str) and 'LIMIT 200' in n.value}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--calibration',action='store_true');parser.add_argument('--joint-calibration',action='store_true');args=parser.parse_args();background_priority()
    folder=root();run=read(folder/('calibration.json' if args.calibration else 'population.json'))['run_id']
    joint=None if args.calibration else read(folder/('joint-calibration.json' if args.joint_calibration else 'joint-population.json'))['run_id']
    before=folder/'query-before-index-fix.py';after=Path(__file__).with_name('relationship_query.py');old,new=queries(before),queries(after)
    db=readonly(folder/'relationships.sqlite3');checks=[]
    try:
        for channel in ('wording','cocitation'):
            if channel=='cocitation' and not joint:continue
            if channel=='wording':
                pairs=db.execute("SELECT left_window,right_window FROM pair_evidence WHERE rowid IN (SELECT min(rowid) FROM pair_evidence WHERE run_id=? AND channel='wording' GROUP BY left_window%2)",(run,)).fetchall()
            else:
                pairs=db.execute('SELECT left_window,right_window FROM joint_pairs WHERE rowid IN (SELECT min(rowid) FROM joint_pairs WHERE run_id=? GROUP BY left_window%2)',(joint,)).fetchall()
            table='pair_evidence' if channel=='wording' else 'joint_pairs';rid=run if channel=='wording' else joint
            condition=" AND channel='wording'" if channel=='wording' else ''
            high=db.execute('SELECT wid FROM (SELECT left_window wid FROM '+table+' WHERE run_id=?'+condition+' UNION ALL SELECT right_window wid FROM '+table+' WHERE run_id=?'+condition+') GROUP BY wid ORDER BY count(*) DESC,wid LIMIT 2',(rid,rid)).fetchall()
            windows=sorted({r[k] for r in pairs for k in ('left_window','right_window')}|{r[0] for r in high})
            if not windows:raise ValueError('Need actual candidates for '+channel)
            for wid in windows:
                previous=(run,wid,wid,joint,wid,wid) if channel=='cocitation' else (run,wid,wid,'wording',1)
                current=(run,wid,run,wid,joint,wid,joint,wid) if channel=='cocitation' else (run,wid,'wording',run,wid,'wording',1)
                a=[dict(r) for r in db.execute(old[channel],previous)];b=[dict(r) for r in db.execute(new[channel],current)]
                checks.append({'channel':channel,'window_id':wid,'rows':len(a),'before_sha256':digest(a),'after_sha256':digest(b),'ok':a==b})
        value={'run_id':run,'joint_run_id':joint,'before_code_sha256':filehash(before),'after_code_sha256':filehash(after),'checks':checks,'ok':bool(checks) and all(c['ok'] for c in checks),'scope':'Actual ranked neighbor rows including both endpoint directions; sampled query equivalence, not relevance evaluation'}
        name='calibration-query-equivalence.json' if args.calibration else 'joint-calibration-query-equivalence.json' if args.joint_calibration else 'query-equivalence.json'
        dump(folder/name,value);print(packed(value))
        if not value['ok']:raise ValueError('Indexed endpoint queries changed results')
    finally:db.close()

if __name__=='__main__':main()
