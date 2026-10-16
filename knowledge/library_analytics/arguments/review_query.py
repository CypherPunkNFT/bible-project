"""Bounded located metadata queries over the completed private review projection.

No passage content, qualification literal or generation model is used.
"""
import argparse
import json
import sqlite3
import unicodedata
from pathlib import Path
from .inputs import ROOT,read

def contains(value,needle):
    def normal(s):return ''.join(c for c in unicodedata.normalize('NFKD',str(s or '')) if not unicodedata.combining(c)).lower()
    return normal(needle).strip() in normal(value)

def query(table='statements',author=None,source=None,collection=None,tradition=None,kind=None,role=None,document=None,limit=50,offset=0,database=None):
    if table not in ('sources','statements','qualifications','links'):raise ValueError('Unknown table')
    if not 1<=limit<=1000 or offset<0:raise ValueError('Limit 1..1000; nonnegative offset required')
    if role and table!='statements':raise ValueError('Speaker role is available only for statement categories')
    receipt=read(ROOT/'review/completed-projection.json') if database is None else None
    if receipt and receipt.get('state')!='complete':raise ValueError('Complete projection required')
    path=Path(database or receipt['database'])
    db=sqlite3.connect(path.as_uri()+'?mode=ro',uri=True);db.row_factory=sqlite3.Row
    db.create_function('metadata_contains',2,contains,deterministic=True)
    conditions=[];parameters=[]
    for field,value in [('author',author),('source',source)]:
        if value:conditions.append(f"metadata_contains(json_extract(d.metadata,'$.{field}'),?)");parameters.append(value)
    for field,value in [('collections',collection),('traditions',tradition)]:
        if value:conditions.append(f"EXISTS(SELECT 1 FROM json_each(d.metadata,'$.{field}') WHERE value=?)");parameters.append(value)
    if document:conditions.append('d.id=?');parameters.append(document)
    if table=='sources':
        sql='SELECT d.* FROM review_documents d'
        order=' ORDER BY d.statements DESC,d.id'
    else:
        sql='SELECT d.id,d.metadata,f.dimensions,f.n,f.example FROM review_facets f JOIN review_documents d ON d.id=f.document_id'
        conditions.append('f.category=?');parameters.append(table)
        for field,value in [('kind',kind),('role',role)]:
            if value:conditions.append(f"json_extract(f.dimensions,'$.{field}')=?");parameters.append(value)
        order=' ORDER BY f.n DESC,d.id,f.dimensions'
    sql+=(' WHERE '+' AND '.join(conditions)) if conditions else ''
    try:
        # Returned count is deliberately the page size, never a claimed full filtered count.
        rows=[]
        for row in db.execute(sql+order+' LIMIT ? OFFSET ?',parameters+[limit,offset]):
            r=dict(row);r['metadata']=json.loads(r['metadata'])
            for key in ['dimensions','example']:
                if key in r:r[key]=json.loads(r[key])
            rows.append(r)
        return {'generation':receipt['generation'] if receipt else 'test-fixture','table':table,'limit':limit,'offset':offset,'returnedGroups':len(rows),'rows':rows,'unit':'source/category groups; n is complete underlying candidate count','contentIncluded':False}
    finally:db.close()

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--table',choices=['sources','statements','qualifications','links'],default='statements')
    for name in ['author','source','collection','tradition','kind','role','document']:p.add_argument('--'+name)
    p.add_argument('--witness-id',help='Exact statement, qualification or argument-link ID; located metadata only')
    p.add_argument('--limit',type=int,default=50);p.add_argument('--offset',type=int,default=0)
    a=p.parse_args();values=vars(a);witness=values.pop('witness_id')
    if witness:
        if any(values[k] for k in ['author','source','collection','tradition','kind','role','document']):p.error('--witness-id is a separate exact-ID lookup')
        result=point(witness)
    else:result=query(**values)
    print(json.dumps(result,ensure_ascii=False,indent=2))

def point(witness,database=None):
    from .review_catalog import RUN,RELEASE,MANIFEST_HASH
    from .inputs import ro,sha
    if database is None:
        delivered=read(ROOT/'delivered-release.json')
        if (delivered['run_id'],delivered['release_id'])!=(RUN,RELEASE) or sha(ROOT/'releases'/RELEASE/'release_manifest.json')!=MANIFEST_HASH:raise ValueError('Pinned release mismatch')
    db=ro(database or ROOT/'arguments.sqlite3')
    def statement(ident):
        r=db.execute('SELECT s.id,s.document_id,s.version_id,s.segment_ordinal,s.start,s.end,s.kind,s.speaker_label,s.speaker_role,s.attribution_basis,s.endorsement,s.negation,s.state,s.uncertainty_json,s.work_id,s.edition_id,p.coordinate,p.block_ordinal,p.locator,p.section_start,p.section_end,p.asset_sha256 FROM statements s LEFT JOIN source_spans p ON p.statement_id=s.id WHERE s.id=? AND s.run_id=?',(ident,RUN)).fetchone()
        if not r:return None
        value=dict(r);value['uncertainty']=json.loads(value.pop('uncertainty_json'));return value
    try:
        value=statement(witness)
        if value:return {'sourceRun':RUN,'type':'statement','witness':value,'contentIncluded':False}
        q=db.execute('SELECT q.id,q.statement_id,q.kind,q.start,q.end,q.state FROM qualifications q JOIN statements s ON s.id=q.statement_id WHERE q.id=? AND s.run_id=?',(witness,RUN)).fetchone()
        if q:return {'sourceRun':RUN,'type':'qualification','witness':dict(q),'parent':statement(q['statement_id']),'contentIncluded':False}
        link=db.execute('SELECT id,source_id,target_id,kind,basis,state FROM argument_links WHERE id=? AND run_id=?',(witness,RUN)).fetchone()
        if link:return {'sourceRun':RUN,'type':'argument-link','witness':dict(link),'source':statement(link['source_id']),'target':statement(link['target_id']),'contentIncluded':False}
        raise ValueError('No witness with that exact ID in the pinned release')
    finally:db.close()
if __name__=='__main__':main()
