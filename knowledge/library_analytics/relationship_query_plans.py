"""Read-only plans for the exact neighbor SQL literals in the query processor."""
import argparse
import ast
from pathlib import Path
from .relationship_miner import root
from .concept_index import read,filehash
from .build import readonly,dump
from .inputs import packed

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--calibration',action='store_true');args=parser.parse_args()
    folder=root();summary=read(folder/('calibration.json' if args.calibration else 'population.json'));run=summary['run_id']
    source=Path(__file__).with_name('relationship_query.py');db=readonly(folder/'relationships.sqlite3');plans=[]
    try:
        row=db.execute('SELECT left_window FROM pair_evidence WHERE run_id=? LIMIT 1',(run,)).fetchone();wid=row[0] if row else 0
        for node in ast.walk(ast.parse(source.read_text('utf-8'))):
            if not isinstance(node,ast.Constant) or not isinstance(node.value,str) or 'LIMIT 200' not in node.value:continue
            sql=node.value;channel='cocitation' if 'joint_pairs' in sql else 'wording'
            if channel=='cocitation' and args.calibration:
                plans.append({'channel':channel,'state':'deferred-until-joint-population'});continue
            joint=read(folder/'joint-population.json')['run_id'] if channel=='cocitation' else None
            params=(run,wid,run,wid,joint,wid,joint,wid) if channel=='cocitation' else (run,wid,'wording',run,wid,'wording',1)
            plans.append({'channel':channel,'sql':sql,'parameters':params,'plan':[dict(r) for r in db.execute('EXPLAIN QUERY PLAN '+sql,params)]})
        value={'run_id':run,'query_code_sha256':filehash(source),'plans':plans}
        target=folder/('calibration-query-plans.json' if args.calibration else 'query-plans.json')
        if target.exists():
            old=read(target)
            if old['query_code_sha256']!=value['query_code_sha256']:dump(target.with_name(target.stem+'-'+old['query_code_sha256'][:12]+'.json'),old)
        dump(target,value);print(packed(value))
    finally:db.close()

if __name__=='__main__':main()
