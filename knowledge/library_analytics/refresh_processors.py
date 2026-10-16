"""Isolated adapters calling the existing four CPU processors, unmodified.

Artifacts retain native source IDs/coordinates. Integer window IDs are stable
content keys in this private projection, rather than historical auto-rowids.
"""
from collections import Counter, OrderedDict, defaultdict
from itertools import groupby
import json
from pathlib import Path
import sqlite3
from types import SimpleNamespace
from unittest.mock import patch
from .refresh_environment import bootstrap
bootstrap()
from . import section_catalog as sc, section_contract as sx
from . import section_alignment as sa, alignment_contract as ax
from . import concept_index as ci, concept_contract as cx
from . import relationship_miner as rm, relationship_contract as rx
from . import relationship_cocitations as joint
from .concept_matcher_fast import FastMatcher
from .references import ReferenceScanner
from ..enrichment.citations import CitationParser
from .normalize import language
from .inputs import packed,digest
from .jobs import StaleInput
from .refresh_contract import stable_id,independence

RUN='kr110-'+'0'*24
TABLES={
 'sections':('sections','section_segments','research_documents'),
 'alignment':('section_index','corpus_documents','corpus_chunks','section_chunks','section_reader_spans','section_destinations','section_alignment_status','alignment_maps','alignment_documents'),
 'concepts':('windows','concept_occurrences','reference_occurrences','document_results'),
 'relationships':('postings','document_results')}

def memory(schema):
    db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row;db.executescript(schema)
    if db.execute("SELECT 1 FROM sqlite_master WHERE name='reference_occurrences'").fetchone():
        db.execute('CREATE INDEX IF NOT EXISTS reference_window ON reference_occurrences(window_id)')
    return db

def native_schema(stage):return {'sections':sx.SCHEMA,'alignment':ax.SCHEMA,'concepts':cx.SCHEMA,'relationships':rx.SCHEMA}[stage]

def insert_rows(db,table,rows,run=RUN):
    cols=[r[1] for r in db.execute('PRAGMA table_info('+table+')')]
    for r in rows:
        row=dict(r)
        if 'run_id' in cols:row['run_id']=run
        if 'seconds' in cols:row['seconds']=0.
        db.execute('INSERT OR IGNORE INTO '+table+'('+','.join(row)+') VALUES('+','.join('?' for _ in row)+')',list(row.values()))

def hydrate(db,stage,value,run=RUN):
    for table,rows in value.items():insert_rows(db,table,rows,run)
    if stage=='sections':
        db.executemany('INSERT OR IGNORE INTO run_sections VALUES(?,?)',[(run,r['version_id']) for r in value['sections']])

def tables(db,stage,doc=None):
    result={}
    for table in TABLES[stage]:
        if doc and table=='sections':sql='SELECT * FROM sections WHERE document_id=?';args=[doc]
        elif doc and table=='section_segments':sql='SELECT g.* FROM sections s JOIN section_segments g USING(version_id) WHERE s.document_id=?';args=[doc]
        elif doc and table=='research_documents':sql='SELECT * FROM research_documents WHERE document_id=?';args=[doc]
        else:sql='SELECT * FROM '+table;args=[]
        rows=[]
        for r in db.execute(sql,args):
            row=dict(r);row.pop('run_id',None);row.pop('seconds',None)
            if table=='alignment_documents':
                receipt=json.loads(row['receipt_json']);receipt.pop('seconds',None);row['receipt_json']=packed(receipt)
            rows.append(row)
        result[table]=sorted(rows,key=packed)
    return result

def document_row(d):
    original=d.get('original_sha256') or d.get('xml_link',{}).get('asset_sha256')
    work=d.get('work_id') if d.get('work_verified') else None
    basis='verified-work' if work else 'source-byte-group; work independence unresolved' if original else 'document; independence unresolved'
    return {'run_id':RUN,'document_id':d['document_id'],'disposition':'supported','language':language(d.get('language'))[0],
            'author_label':d.get('author_label'),'work_id':work,'edition_id':d.get('edition_id') if d.get('edition_verified') else None,
            'independence_group':independence(d),'independence_basis':basis,'descriptor_json':packed(d),'fingerprint':digest(d)}

def stable_concepts(value):
    ids={}
    for w in value['windows']:
        old=w['id'];w['id']=stable_id(['window',w['document_id'],w['version_id'],w['segment_ordinal'],w['start'],w['end'],w['text_sha256']]);ids[old]=w['id']
    if len(set(ids.values()))!=len(ids):raise ValueError('Stable window ID collision')
    for table in ('concept_occurrences','reference_occurrences'):
        multiplicity=Counter()
        for r in value[table]:
            r['window_id']=ids[r['window_id']];r.pop('id',None)
            # Native processors can emit identical located occurrences. Keep
            # the multiset; duplicate evidence is not silently deduplicated or
            # mistaken for a cryptographic collision.
            key=packed(r);ordinal=multiplicity[key];multiplicity[key]+=1
            r['id']=stable_id([table,r,ordinal])
        if len({r['id'] for r in value[table]})!=len(value[table]):raise ValueError('Occurrence ID collision')
    for rows in value.values():rows.sort(key=packed)
    return value

class FrozenAlignment(sa.Snapshot):
    def __init__(self,sections,item,corpus_build):
        self.sections=sections;self.section_run=RUN;self.item=item;self.xml_cache=OrderedDict();self.corpus_build=corpus_build
    def current_document(self,descriptor):
        c=self.item['corpus'];return c['record'],c['chunks'],c['binding']
    def reader_blocks(self,db,run,record):
        r=next(r for r in self.item['readers'] if r['record']['id']==record['id'])
        return r['blocks']

class Processors:
    def __init__(self,config,items=()):
        self.config=config;self.prepared={};self.xml_prepared={}
        self.assets=defaultdict(list)
        for item in items:
            d=item['descriptor']
            if d.get('xml_link'):self.assets[d['xml_link']['asset_path']].append(d)
        self.matcher=FastMatcher(config['rules']['rules'])
        p=config['parser'];self.scanner=ReferenceScanner(CitationParser(p['books'],{(b,c):v for b,c,v in p['bounds']}))

    def compute(self,stage,item,parents):
        db=memory(native_schema(stage));d=item['descriptor'];doc=d['document_id']
        try:
            if stage=='sections':
                if d.get('xml_link'):
                    path=d['xml_link']['asset_path'];key=(path,digest(self.assets.get(path,[d])))
                    if key not in self.xml_prepared:
                        # Existing asset processor executes once for all selected
                        # entries, not once per dictionary entry.
                        sc.xml_asset(db,RUN,path,self.assets.get(path,[d]))
                        self.xml_prepared={key:{x['document_id']:tables(db,'sections',x['document_id']) for x in self.assets.get(path,[d])}}
                    return self.xml_prepared[key][doc]
                sc.document(db,RUN,d)
            elif stage=='alignment':
                sources=memory(sx.SCHEMA)
                try:
                    hydrate(sources,'sections',parents['sections'])
                    for r in item['readers']:
                        rec=r['record'];insert_rows(db,'reader_records',[{'reader_id':rec['id'],'original_sha256':rec['sha256'],
                            'record_sha256':digest(rec),'record_json':packed(rec),'path':r['path'],'file_sha256':r['file_sha256']}])
                    sa.align_document(FrozenAlignment(sources,item,self.config['corpus_build']),db,RUN,d)
                finally:sources.close()
            elif stage=='concepts':
                sources=memory(sx.SCHEMA)
                try:
                    hydrate(sources,'sections',parents['sections'])
                    inputs=SimpleNamespace(sections=sources,srun=RUN,matcher=self.matcher,scanner=self.scanner,prepared=self.prepared)
                    db.execute('CREATE VIRTUAL TABLE '+ci.fts_name(RUN)+" USING fts5(heading,body,content='',tokenize='unicode61 remove_diacritics 2')")
                    with patch.object(ci,'WINDOW',self.config['window_codepoints']):
                        ci.process_document(inputs,db,RUN,document_row(d))
                finally:sources.close()
                return stable_concepts(tables(db,stage))
            else:
                sources=memory(sx.SCHEMA);concepts=memory(cx.SCHEMA)
                try:
                    hydrate(sources,'sections',parents['sections']);hydrate(concepts,'concepts',parents['concepts'])
                    inputs=SimpleNamespace(db=concepts,run=RUN,sections=sources,prepared=self.prepared)
                    with patch.object(rm,'CONFIG',self.config['relationships']):
                        rm.process_document(inputs,db,RUN,document_row(d))
                finally:sources.close();concepts.close()
            return tables(db,stage)
        finally:db.close()

def population_native(db,items,objects,config):
    """Materialize reusable facts and rebuild population-dependent products.

    Rebuild FTS frequencies/BM25 and all bounded feature/joint buckets. Raw
    document processing is selective; these global operations are deliberate.
    """
    db.executescript(sx.SCHEMA+ax.SCHEMA+cx.SCHEMA)
    # KR-110 and KR-120 share a document_results name, so relationships have
    # their own store rather than overwrite the concept receipts.
    relations=memory(rx.SCHEMA+joint.SCHEMA)
    db.execute('CREATE VIRTUAL TABLE IF NOT EXISTS '+ci.fts_name(RUN)+" USING fts5(heading,body,content='',tokenize='unicode61 remove_diacritics 2')")
    prepared={}
    try:
        # Shared dictionary assets must stay adjacent during reconstruction;
        # input membership order is otherwise arbitrary. Facts keep their
        # stable IDs, so changing this traversal does not relabel evidence.
        grouped=sorted(zip(items,objects),key=lambda pair:(pair[0]['descriptor'].get('xml_link',{}).get('asset_path') or pair[0]['descriptor'].get('cache_path',''),pair[0]['descriptor']['document_id']))
        for item,stages in grouped:
            d=item['descriptor'];row=document_row(d)
            insert_rows(db,'documents',[row]);db.executemany('INSERT OR IGNORE INTO contributors VALUES(?,?,?,?)',[(RUN,d['document_id'],ident,role) for ident,role in d.get('memberships',[])])
            for stage in ('sections','alignment','concepts'):hydrate(db,stage,stages[stage])
            # Ignore concept document_results when hydrating relationships.
            hydrate(relations,'relationships',stages['relationships'])
            located=[]
            for w in stages['concepts']['windows']:
                span=db.execute('SELECT * FROM section_segments WHERE version_id=? AND ordinal=?',(w['version_id'],w['segment_ordinal'])).fetchone()
                located.append((w,span))
            segment_bodies={}
            for w,span in sorted(located,key=lambda pair:(pair[1]['path'],pair[1]['coordinate'],pair[0]['start'],pair[0]['id'])):
                segment_key=(w['version_id'],w['segment_ordinal'])
                if segment_key not in segment_bodies:segment_bodies[segment_key]=sx.resolve_segment(span,prepared)
                body=segment_bodies[segment_key];a=w['start']-span['start'];b=w['end']-span['start'];text=body[a:b]
                if sx.text_hash(text)!=w['text_sha256']:raise StaleInput('Reused window reconstruction failed')
                heading=db.execute('SELECT heading FROM sections WHERE version_id=?',(w['version_id'],)).fetchone()[0]
                db.execute('INSERT INTO '+ci.fts_name(RUN)+'(rowid,heading,body) VALUES(?,?,?)',(w['id'],heading,text))
        for rule in config['rules']['rules']:db.execute('INSERT INTO rules VALUES(?,?,?,?)',(RUN,rule['id'],rule['topic'],packed(rule)))
        # Do not let INSERT OR IGNORE turn an unexpected surrogate-key
        # collision or missing hydration row into apparently passing reuse.
        for table,stage in [('windows','concepts'),('concept_occurrences','concepts'),('reference_occurrences','concepts'),
                            ('sections','sections'),('section_segments','sections'),('section_index','alignment'),
                            ('section_chunks','alignment'),('section_reader_spans','alignment')]:
            expected=sum(len(stages[stage][table]) for stages in objects)
            if db.execute('SELECT count(*) FROM '+table).fetchone()[0]!=expected:raise StaleInput('Hydration accounting mismatch '+table)
        if db.execute('SELECT count(*) FROM '+ci.fts_name(RUN)).fetchone()[0]!=db.execute('SELECT count(*) FROM windows').fetchone()[0]:raise StaleInput('FTS accounting mismatch')
        with patch.object(rm,'CONFIG',config['relationships']):
            for bucket in range(256):rm.build_bucket(relations,RUN,bucket)
        rows=relations.execute("SELECT * FROM postings INDEXED BY postings_reference_scan WHERE run_id=? AND channel='reference' ORDER BY window_id,feature",(RUN,))
        batch=[];n=0
        for wid,refs in groupby(rows,key=lambda r:r['window_id']):
            batch.append((wid,[dict(r) for r in refs]))
            if len(batch)==256:
                with patch.object(joint,'CONFIG',config['joint']):joint.write_batch(relations,RUN,n,batch)
                n+=1;batch=[]
        with patch.object(joint,'CONFIG',config['joint']):
            if batch:joint.write_batch(relations,RUN,n,batch)
            for bucket in range(256):joint.write_bucket(relations,RUN,bucket)
        products={}
        for t in ('feature_stats','pair_evidence','joint_features','joint_pairs'):
            ddl=relations.execute('SELECT sql FROM sqlite_master WHERE name=?',(t,)).fetchone()[0]
            db.execute(ddl)
            products[t]=[]
            for r in relations.execute('SELECT * FROM '+t):
                v=dict(r);db.execute('INSERT INTO '+t+' VALUES('+','.join('?' for _ in v)+')',list(v.values()))
                v.pop('run_id',None);products[t].append(v)
            products[t].sort(key=packed)
        db.execute('CREATE INDEX pairs_right ON pair_evidence(run_id,right_window)')
        db.execute('CREATE INDEX joint_pairs_right ON joint_pairs(run_id,right_window)')
        # Independent FTS5 vocabulary frequency export measures the entire
        # target population, including changes to frequencies of old terms.
        db.execute('CREATE VIRTUAL TABLE IF NOT EXISTS refresh_vocab USING fts5vocab('+ci.fts_name(RUN)+',row)')
        products['frequencies']=[dict(r) for r in db.execute('SELECT * FROM refresh_vocab ORDER BY term')]
        products['review_dependencies']=[{'fingerprint':digest(config['reviews']),'review_state':config['reviews']}]
        return products
    finally:relations.close()
