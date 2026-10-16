"""Read-only size diagnostics for the currently claimed document batch."""
import json
from pathlib import Path
from .relationship_miner import root,Inputs
from .concept_index import read
from .build import readonly,dump
from .inputs import packed

def main():
    folder=root();run=read(folder/'relationship-progress.json')['run_id'];db=readonly(folder/'relationships.sqlite3');inputs=Inputs();rows=[]
    try:
        jobs=db.execute("SELECT r.scope FROM run_jobs r JOIN jobs j ON j.id=r.job_id WHERE r.run_id=? AND j.state='running' AND r.scope LIKE 'document:%'",(run,)).fetchall()
        for job in jobs:
            doc=job['scope'].split(':',1)[1];raw=db.execute('SELECT descriptor_json FROM scope WHERE run_id=? AND document_id=?',(run,doc)).fetchone();descriptor=json.loads(raw[0])
            counts=dict(inputs.db.execute("SELECT count(*) windows,sum(state!='candidate-unreviewed' AND kind!='document-representation') eligible_windows FROM windows WHERE run_id=? AND document_id=?",(inputs.run,doc)).fetchone())
            window=inputs.db.execute('SELECT version_id,segment_ordinal FROM windows WHERE run_id=? AND document_id=? LIMIT 1',(inputs.run,doc)).fetchone()
            source=None
            if window:
                span=inputs.sections.execute('SELECT path FROM section_segments WHERE version_id=? AND ordinal=?',(window['version_id'],window['segment_ordinal'])).fetchone()
                if span:source={'path':span['path'],'bytes':Path(span['path']).stat().st_size}
            rows.append({'document_id':doc,'title':descriptor.get('title'),**counts,'source':source})
        value={'run_id':run,'claimed_documents':len(rows),'windows':sum(r['windows'] for r in rows),'eligible_windows':sum(r['eligible_windows'] or 0 for r in rows),'largest_documents':sorted(rows,key=lambda r:r['eligible_windows'] or 0,reverse=True)[:12],'scope':'Claimed batch, not identification of the currently executing callback'}
        if rows:
            biggest=value['largest_documents'][0];doc=biggest['document_id']
            window=inputs.db.execute('SELECT version_id,segment_ordinal FROM windows WHERE run_id=? AND document_id=? LIMIT 1',(inputs.run,doc)).fetchone()
            span=inputs.sections.execute('SELECT * FROM section_segments WHERE version_id=? AND ordinal=?',(window['version_id'],window['segment_ordinal'])).fetchone()
            detail={'document_id':doc,'section_versions':inputs.db.execute('SELECT count(DISTINCT version_id) FROM windows WHERE run_id=? AND document_id=?',(inputs.run,doc)).fetchone()[0],'coordinate':span['coordinate'],'block_ordinal':span['block_ordinal']}
            if span['coordinate']=='extraction-cache-block':
                with Path(span['path']).open('rb') as source:
                    for ordinal,line in enumerate(source):
                        if ordinal==span['block_ordinal']:detail['first_block_characters']=len(json.loads(line)['text']);break
            value['largest_source_structure']=detail
        dump(folder/'active-batch.json',value);print(packed(value))
    finally:inputs.close();db.close()

if __name__=='__main__':main()
