"""Located private argument queries; source reconstruction remains mandatory."""
import argparse,json
from .inputs import ROOT,read,ro,ALIGNMENT_RUN,SECTION_RUN,Inputs
from ..section_contract import resolve_segment,text_hash

def located(db,row,inputs):
    r=dict(row);span=dict(db.execute('SELECT * FROM source_spans WHERE statement_id=?',(r['id'],)).fetchone())
    segment={'coordinate':span['coordinate'],'path':span['path'],'asset_sha256':span['asset_sha256'],'block_ordinal':span['block_ordinal'],'locator':span['locator'],'start':span['section_start'],'end':span['section_end'],'block_text_sha256':span['block_text_sha256'],'span_sha256':span['section_span_sha256']}
    body=resolve_segment(segment,inputs.prepared);a,b=r['start']-segment['start'],r['end']-segment['start'];t=body[a:b]
    if not 0<=a<=b<=len(body) or text_hash(t)!=r['text_sha256'] or t!=r['text']:raise ValueError('Stored statement does not reconstruct')
    r['source_span']=span;r['context']=body[max(0,a-400):min(len(body),b+400)]
    section=inputs.sections.execute('SELECT s.* FROM sections s JOIN run_sections m ON m.version_id=s.version_id WHERE s.version_id=? AND m.run_id=?',(r['version_id'],SECTION_RUN)).fetchone()
    if section is None:raise ValueError('Statement section is not a member of the pinned source run')
    r['section']=dict(section)
    r['qualifications']=[dict(q) for q in db.execute('SELECT * FROM qualifications WHERE statement_id=?',(r['id'],))]
    for q in r['qualifications']:
        if body[q['start']-segment['start']:q['end']-segment['start']]!=q['literal'] or text_hash(q['literal'])!=q['text_sha256']:raise ValueError('Qualification does not reconstruct')
    r['links']=[dict(q) for q in db.execute('SELECT * FROM argument_links WHERE source_id=?',(r['id'],))]
    d=read_descriptor(db,r['run_id'],r['document_id']);r['source_metadata']=d
    r['contributors']=[dict(q) for q in db.execute('SELECT * FROM contributors WHERE run_id=? AND document_id=?',(r['run_id'],r['document_id']))]
    r['chunk_pieces']=[dict(q) for q in inputs.alignment.execute('SELECT * FROM section_chunks WHERE run_id=? AND version_id=? AND segment_ordinal=? AND source_start<? AND source_end>? LIMIT 20',(ALIGNMENT_RUN,r['version_id'],r['segment_ordinal'],r['end'],r['start']))]
    r['destinations']=[dict(q) for q in inputs.alignment.execute('SELECT * FROM section_destinations WHERE run_id=? AND version_id=?',(ALIGNMENT_RUN,r['version_id']))]
    r['presentation_limit']='20 overlapping chunk pieces; SQL supports complete retrieval; existing routes are containing-book only'
    return r

def read_descriptor(db,rid,doc):return json.loads(db.execute('SELECT descriptor_json FROM scope WHERE run_id=? AND document_id=?',(rid,doc)).fetchone()[0])

def query(text=None,kind=None,author=None,work=None,speaker=None,limit=5,rid=None):
    if not 1<=limit<=20:raise ValueError('Query limit must be 1..20')
    rid=rid or read(ROOT/'population.json')['run_id'];db=ro(ROOT/'arguments.sqlite3');inputs=Inputs();inputs.check(verify_sources=False)
    saved=db.execute('SELECT contract_json FROM argument_runs WHERE id=?',(rid,)).fetchone()
    if saved:inputs.check_contract(json.loads(saved[0]))
    conditions=['s.run_id=?'];params=[rid]
    if text:
        # Literal word query; user text cannot inject FTS syntax.
        import re
        words=re.findall(r'\w+',text)
        if not words:raise ValueError('Query requires words')
        conditions.append('statement_search MATCH ?');params.append(' AND '.join('"'+w+'"' for w in words))
    if kind:conditions.append('s.kind=?');params.append(kind)
    if speaker:conditions.append('s.speaker_label=?');params.append(speaker)
    if work:conditions.append('s.work_id=?');params.append(work)
    if author:conditions.append("json_extract(d.descriptor_json,'$.author_label') LIKE ?");params.append('%'+author+'%')
    # FTS5 BM25 uses every historical row in the virtual table. A stable
    # whole-clause length/ID ordering avoids mixing old-generation frequencies
    # into a pinned query; no relevance/ranking capability is claimed here.
    sql='SELECT s.* FROM '+('statement_search JOIN statements s ON s.id=statement_search.id' if text else 'statements s')+' JOIN scope d ON d.run_id=s.run_id AND d.document_id=s.document_id WHERE '+' AND '.join(conditions)+' ORDER BY '+('length(s.text),s.id' if text else 's.id')+' LIMIT ?'
    plans=[dict(r) for r in db.execute('EXPLAIN QUERY PLAN '+sql,params+[limit])]
    rows=[located(db,r,inputs) for r in db.execute(sql,params+[limit])];inputs.close();db.close()
    return {'run_id':rid,'query':text,'constraints':{'kind':kind,'source_author':author,'work':work,'actual_speaker_label':speaker},'results':rows,'query_plan':plans,'ordering':'Matching whole clauses by length then immutable ID; no historical-frequency/BM25 mixing or evaluated relevance ranking','attribution_warning':'Source author constraint is not a speaker or endorsement claim. All extracted statements remain candidates.'}

def main():
    p=argparse.ArgumentParser();p.add_argument('--query');p.add_argument('--kind');p.add_argument('--author');p.add_argument('--speaker');p.add_argument('--work');p.add_argument('--run-id');p.add_argument('--limit',type=int,default=5);a=p.parse_args()
    print(json.dumps(query(a.query,a.kind,a.author,a.work,a.speaker,a.limit,a.run_id),ensure_ascii=False,indent=2))
if __name__=='__main__':main()
