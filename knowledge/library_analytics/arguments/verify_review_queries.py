"""Reproduce metadata category queries over the complete projection under lease."""
import json
from pathlib import Path
from .inputs import ROOT,PROJECT,write_json,read
from .review_query import query,point
from ..jobs import JobStore

def main():
    lease=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    try:
        lease.acquire();checks=[]
        for params in [dict(table='statements',author='Calvin',kind='quotation'),dict(table='qualifications',tradition='reformed'),dict(table='links',kind='reply-to-candidate')]:
            result=query(**params,limit=5)
            if not result['rows']:raise ValueError('Expected populated metadata query '+str(params))
            for row in result['rows']:
                if row['n']<=0 or point(row['example']['id'])['contentIncluded']:raise ValueError('Bad count or metadata witness')
            checks.append({'constraints':params,'returnedGroups':len(result['rows']),'results':[{'documentId':r['id'],'author':r['metadata']['author'],'source':r['metadata']['source'],'dimensions':r['dimensions'],'candidateRecords':r['n'],'witnessId':r['example']['id']} for r in result['rows']]})
            lease.heartbeat()
        receipt={'state':'passed','generation':read(ROOT/'review/completed-projection.json')['generation'],'reviewerType':'deterministic software verification; no content quality judgment','completeProjectionQueried':True,'queries':checks}
        write_json(ROOT/'review/category-query-verification.json',receipt)
        print(json.dumps(receipt,ensure_ascii=False,indent=2))
    finally:lease.close()

if __name__=='__main__':main()
