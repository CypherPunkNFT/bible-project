"""Located paired witnesses and bounded relationship lookup for a named release."""
import argparse
import difflib
import json
import sys
import sqlite3
import unicodedata
from importlib.metadata import version
from pathlib import Path
from .build import readonly
from .inputs import packed
from .jobs import StaleInput
from .concept_index import read,filehash
from .concept_query import normalized_author_labels,attribution_conflicts
from .section_contract import resolve_segment,text_hash
from .relationship_contract import tokens
from .relationship_miner import Inputs,root

def query_identity():
    base=Path(__file__).parent.parent
    files=['library_analytics/'+name for name in ('relationship_query.py','relationship_contract.py','concept_query.py','concept_index.py','section_contract.py','xml_bridge.py','build.py','inputs.py')]+['enrichment/foundation.py']
    return {'files':{name:filehash(base/name) for name in files},'python':sys.version,'sqlite':sqlite3.sqlite_version,'unicode':unicodedata.unidata_version,'lxml':version('lxml'),'beautifulsoup4':version('beautifulsoup4')}

class Relationships:
    def __init__(self,calibration=False,joint_calibration=False):
        self.summary=read(root()/('calibration.json' if calibration else 'population.json'))
        if self.summary['state']!='population-complete':raise ValueError('Complete population required')
        self.run=self.summary['run_id'];self.query_identity=query_identity();self.db=readonly(Path(self.summary['database']))
        self.db.execute('PRAGMA cache_size=-262144');self.db.execute('PRAGMA mmap_size=4294967296');self.db.execute('PRAGMA temp_store=MEMORY')
        self.inputs=Inputs();self.inputs.check()
        if self.inputs.contract!= {k:v for k,v in self.summary['contract'].items() if k!='calibration'}:raise StaleInput('Selected relationship dependencies changed')
        self.alignment=readonly(Path(self.inputs.parents[1]['database']))
        self.joint=None
        if not calibration:
            joint=read(root()/('joint-calibration.json' if joint_calibration else 'joint-population.json'))
            if joint['state']!='complete' or joint['parent_run']!=self.run:raise StaleInput('Compatible completed joint-reference run required')
            if joint['contract']['parent_summary_sha256']!=filehash(root()/'population.json'):raise StaleInput('Joint-reference parent summary changed')
            if joint['contract']['code_sha256']!=filehash(Path(__file__).with_name('relationship_cocitations.py')):raise StaleInput('Joint-reference code changed')
            self.joint=joint['run_id']
            selected=root()/'latest-relationships.json'
            if selected.exists():
                pointer=read(selected)
                if pointer['run_id']==self.run and pointer['joint_run_id']==self.joint and pointer.get('query_identity')!=self.query_identity:raise StaleInput('Selected query/helper/environment identity changed; new evaluation/release required')
    def close(self):self.db.close();self.inputs.close();self.alignment.close()
    def witness(self,wid,context=350):
        r=self.inputs.db.execute('SELECT w.*,d.descriptor_json,d.language,d.work_id,d.edition_id,d.independence_group,d.independence_basis,d.author_label FROM windows w JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.run_id=? AND w.id=?',(self.inputs.run,wid)).fetchone()
        if not r:raise ValueError('Unknown window in selected parent')
        r=dict(r);d=json.loads(r.pop('descriptor_json'));span=dict(self.inputs.sections.execute('SELECT * FROM section_segments WHERE version_id=? AND ordinal=?',(r['version_id'],r['segment_ordinal'])).fetchone())
        body=resolve_segment(span,{})
        a,b=r['start']-span['start'],r['end']-span['start'];text=body[a:b]
        if not 0<=a<b<=len(body) or text_hash(text)!=r['text_sha256']:raise StaleInput('Window changed')
        section=self.inputs.sections.execute('SELECT heading,metadata_json FROM sections WHERE version_id=?',(r['version_id'],)).fetchone()
        r.update(text=text,context=body[max(0,a-context):min(len(body),b+context)],context_start=span['start']+max(0,a-context),
            section_heading=section['heading'],section_metadata=json.loads(section['metadata_json']),source_span=span,
            provenance=d,attribution_conflicts=attribution_conflicts(d),
            destinations=[dict(x) for x in self.alignment.execute('SELECT * FROM section_destinations WHERE run_id=? AND version_id=?',(self.inputs.parents[1]['run_id'],r['version_id']))])
        return r
    def pair(self,left,right):
        left,right=sorted([left,right]);rows=[dict(r) for r in self.db.execute('SELECT * FROM pair_evidence WHERE run_id=? AND left_window=? AND right_window=? ORDER BY channel,feature',(self.run,left,right))]
        if self.joint:
            existing={(r['channel'],r['feature']) for r in rows}
            for joint in self.db.execute('SELECT feature FROM joint_pairs WHERE run_id=? AND left_window=? AND right_window=?',(self.joint,left,right)):
                for feature in json.loads(joint[0]):
                    if ('reference',feature) in existing:continue
                    existing.add(('reference',feature))
                    a=self.db.execute("SELECT * FROM postings WHERE run_id=? AND channel='reference' AND feature=? AND window_id=?",(self.run,feature,left)).fetchone()
                    b=self.db.execute("SELECT * FROM postings WHERE run_id=? AND channel='reference' AND feature=? AND window_id=?",(self.run,feature,right)).fetchone()
                    if not a or not b:raise StaleInput('Missing joint-reference endpoint')
                    rows.append({'run_id':self.run,'joint_run_id':self.joint,'left_window':left,'right_window':right,'channel':'reference','feature':feature,
                        'left_start':a['start'],'left_end':a['end'],'right_start':b['start'],'right_end':b['end'],'left_hash':a['witness_hash'],'right_hash':b['witness_hash']})
        if not rows:raise ValueError('No candidate pair')
        a,b=self.witness(left),self.witness(right)
        for r in rows:
            parts=[]
            for side,w in [('left',a),('right',b)]:
                start,end=r[side+'_start']-w['start'],r[side+'_end']-w['start'];literal=w['text'][start:end]
                if not 0<=start<end<=len(w['text']) or text_hash(literal)!=r[side+'_hash']:raise StaleInput('Pair witness changed')
                r[side+'_literal']=literal;parts.append(literal)
            if r['channel']=='wording' and [x[0] for x in tokens(parts[0])]!=[x[0] for x in tokens(parts[1])]:raise StaleInput('Normalized wording mismatch')
        wording=sum(r['channel']=='wording' for r in rows);refs=sum(r['channel']=='reference' for r in rows)
        aligned=[]
        if wording:
            at,bt=tokens(a['text']),tokens(b['text'])
            for match in difflib.SequenceMatcher(None,[t[0] for t in at],[t[0] for t in bt],autojunk=False).get_matching_blocks():
                if match.size<8:continue
                sa,ea=at[match.a][1],at[match.a+match.size-1][2];sb,eb=bt[match.b][1],bt[match.b+match.size-1][2]
                aligned.append({'tokens':match.size,'left_start':a['start']+sa,'left_end':a['start']+ea,'right_start':b['start']+sb,'right_end':b['start']+eb,
                    'left_literal':a['text'][sa:ea],'right_literal':b['text'][sb:eb],
                    'left_sha256':text_hash(a['text'][sa:ea]),'right_sha256':text_hash(b['text'][sb:eb]),
                    'precision':'literal' if a['text'][sa:ea]==b['text'][sb:eb] else 'normalized-token-equality'})
        return {'run_id':self.run,'joint_run_id':self.joint,'query_identity':self.query_identity,'left':a,'right':b,'evidence':rows,'wording_features':wording,'shared_reference_ranges':refs,
            'aligned_islands':aligned,'alignment_method':'bounded normalized-token SequenceMatcher on paired windows; unmatched gaps remain gaps; computed on query, not a bulk full-passage alignment claim',
            'relation_types':(['located-wording-overlap-candidate'] if wording else [])+(['section-co-citation-candidate'] if refs>=2 else ['single-shared-citation'] if refs else []),
            'independence':'different verified works' if a['work_id'] and b['work_id'] and a['work_id']!=b['work_id'] else 'different retained source groups; work independence unresolved',
            'attribution':'No quoted-author, influence, endorsement, chronological direction or translation-alignment claim',
            'review_state':'unreviewed-candidate'}
    def neighbors(self,wid,channel='wording',limit=5,author=None,work=None,language=None):
        if channel not in ('wording','cocitation'):raise ValueError('Invalid channel')
        raw='reference' if channel=='cocitation' else channel;minimum=2 if channel=='cocitation' else 1
        if channel=='cocitation' and self.joint:
            rows=self.db.execute('''WITH links AS (
                SELECT left_window,right_window,feature FROM pair_evidence WHERE run_id=? AND channel='reference' AND left_window=?
                UNION SELECT left_window,right_window,feature FROM pair_evidence INDEXED BY pairs_right WHERE run_id=? AND channel='reference' AND right_window=?
                UNION SELECT j.left_window,j.right_window,x.value feature FROM joint_pairs j,json_each(j.feature) x
                WHERE j.run_id=? AND j.left_window=?
                UNION SELECT j.left_window,j.right_window,x.value feature FROM joint_pairs j INDEXED BY joint_pairs_right,json_each(j.feature) x
                WHERE j.run_id=? AND j.right_window=?)
                SELECT left_window,right_window,count(*) n FROM links GROUP BY left_window,right_window HAVING count(*)>=2
                ORDER BY n DESC,left_window,right_window LIMIT 200''',(self.run,wid,self.run,wid,self.joint,wid,self.joint,wid)).fetchall()
        else:
            rows=self.db.execute('''WITH links AS (
                SELECT left_window,right_window,feature FROM pair_evidence WHERE run_id=? AND left_window=? AND channel=?
                UNION ALL SELECT left_window,right_window,feature FROM pair_evidence INDEXED BY pairs_right WHERE run_id=? AND right_window=? AND channel=?)
                SELECT left_window,right_window,count(*) n FROM links GROUP BY left_window,right_window HAVING count(*)>=?
                ORDER BY n DESC,left_window,right_window LIMIT 200''',(self.run,wid,raw,self.run,wid,raw,minimum)).fetchall()
        found=[]
        for row in rows:
            other=row['right_window'] if row['left_window']==wid else row['left_window']
            meta=self.inputs.db.execute('SELECT d.* FROM windows w JOIN documents d ON d.run_id=w.run_id AND d.document_id=w.document_id WHERE w.id=?',(other,)).fetchone()
            if language and meta['language']!=language:continue
            if work and meta['work_id']!=work:continue
            if author:
                d=json.loads(meta['descriptor_json'])
                if attribution_conflicts(d) or not (normalized_author_labels(author)&normalized_author_labels(meta['author_label']) or [author,'author'] in d.get('memberships',[])):continue
            found.append(self.pair(row['left_window'],row['right_window']))
            if len(found)>=limit:break
        return {'window_id':wid,'channel':channel,'query_identity':self.query_identity,'results':found,'candidate_pair_scan_limit':200,'constraints':{'author':author,'work':work,'language':language},'semantic':self.summary['contract']['config']['semantic']}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--window',type=int,required=True);p.add_argument('--other',type=int);p.add_argument('--channel',choices=['wording','cocitation'],default='wording');p.add_argument('--limit',type=int,default=5);p.add_argument('--author');p.add_argument('--work');p.add_argument('--language');p.add_argument('--calibration',action='store_true');a=p.parse_args()
    engine=Relationships(a.calibration)
    try:print(packed(engine.pair(a.window,a.other) if a.other else engine.neighbors(a.window,a.channel,a.limit,a.author,a.work,a.language)))
    finally:engine.close()

if __name__=='__main__':main()
