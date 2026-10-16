"""Bounded exact-ID query check, independent of the full projection completion."""
import json
from .inputs import ROOT,read,ro,write_json
from .review_query import point

def main():
    status=read(ROOT/'review/progress.json');db=ro(ROOT/'review'/status['generation']/'review.sqlite3')
    result=[]
    try:
        for category in ['statements','qualifications','links']:
            row=db.execute('SELECT example FROM review_facets WHERE category=? LIMIT 1',(category,)).fetchone()
            if row is None:raise ValueError('No committed witness for '+category)
            ident=json.loads(row[0])['id'];value=point(ident)
            if value['contentIncluded'] or any('text'==k or 'literal'==k for k in value.get('witness',{})):raise ValueError('Content leaked into metadata query')
            result.append({'category':category,'witnessId':ident,'result':value})
        receipt={'state':'passed','generation':status['generation'],'method':'Three indexed exact-ID lookups from atomically committed projection rows; not a semantic quality sample','queries':result}
        write_json(ROOT/'review/point-query-verification.json',receipt)
        print(json.dumps(receipt,ensure_ascii=False,indent=2))
    finally:db.close()
if __name__=='__main__':main()
