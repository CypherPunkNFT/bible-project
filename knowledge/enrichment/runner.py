import json
import os
import sqlite3
import time
import unicodedata
from collections import Counter, defaultdict
from contextlib import closing
from pathlib import Path
from .core import Graph, dumps, identity, now, readonly, text_hash, writer_lock
from .foundation import Inputs, import_foundation, progress, reference, select_pilot
from .citations import boundary_citations, section
from .rules import compile_rules, fts_phrase, load_pack, matches, phrase_spans
from ..settings import write_json


class Cancelled(RuntimeError):
    pass


def check_cancel(config):
    if (config['state_dir']/'graph-development/cancel.request').exists():
        raise Cancelled('Graph cancellation requested; committed checkpoints retained')


class Extractor:
    def __init__(self, graph, run, inputs):
        self.graph,self.run,self.inputs=graph,run,inputs
        self.documents={r['document_id']:dict(r) for r in graph.db.execute('SELECT * FROM document_map WHERE run_id=? AND eligible=1',(run,))}
        self.seen_chunks=set()

    def chunk(self,row):
        id='chunk:'+row['id']
        if row['id'] not in self.seen_chunks:
            self.graph.entity(id,'chunk',row['locator'],{'corpusChunkId':row['id'],'corpusDocumentId':row['document_id']})
            source=json.loads(self.documents[row['document_id']]['metadata'])
            obs=self.graph.observation(self.run,self.inputs.manifest['id'],source['source'],source['sourceHash'],
                {'store':'corpus','table':'chunks','id':row['id'],'fields':['document_id']},dumps(row['document_id']))
            self.graph.assertion(self.run,id,'part_of','document:'+row['document_id'],[obs])
            self.graph.db.execute('INSERT OR IGNORE INTO chunk_map VALUES(?,?,?,?)',(self.run,row['id'],row['document_id'],row['rowid']))
            self.seen_chunks.add(row['id'])
            if len(self.seen_chunks)>4096: self.seen_chunks.clear()
        return id

    def span(self,row,start,end,method,rule,metadata=None,segments=None,literal=None):
        source=json.loads(self.documents[row['document_id']]['metadata'])
        locator={'store':'corpus','table':'chunks','id':row['id'],'sourceLocator':row['locator']}
        if segments: locator['segments']=segments
        return self.graph.observation(self.run,self.inputs.manifest['id'],source['source'],source['sourceHash'],locator,
             literal if literal is not None else row['text'][start:end],method,rule,row['id'],row['document_id'],start,end,text_hash(row['text']),metadata)

    def citation(self,row,hit,neighbors=None):
        segments=hit.get('segments')
        start,end=hit['start'],hit['end']
        if segments:
            segments=[segment | {'textHash':text_hash(neighbors[segment['chunkId']]['text']), 'literal':neighbors[segment['chunkId']]['text'][segment['start']:segment['end']]} for segment in segments]
            start,end=segments[0]['start'],segments[0]['end']
        obs=self.span(row,start,end,'literal_match',self.inputs.parser.version,hit,segments,hit['literal'])
        target=reference(self.graph,self.inputs,hit['book'],hit['chapter'],hit['verse'],hit['endChapter'],hit['endVerse'])
        self.graph.assertion(self.run,self.chunk(row),'cites_reference',target,[obs],basis='literal_match',
            qualifiers={k:hit[k] for k in ('edition','numbering','rangeValidation')},attribution='source occurrence; speaker/endorsement unresolved',review='syntax_validated')

    def topic(self,row,rule,start,end,segments=None,literal=None):
        obs=self.span(row,start,end,'rule_candidate',rule['id'],{'topic':rule['topic'],'interpretation':'located term/context candidate; no endorsement'},segments,literal)
        self.graph.assertion(self.run,self.chunk(row),'topic_match','topic:'+rule['topic'],[obs],basis='rule_candidate',qualifiers={'rule':rule['id'],'language':'en'},review='unreviewed_candidate',attribution='versioned English term rule')


def citations(graph,run,inputs,config,selected=None):
    extractor=Extractor(graph,run,inputs)
    allowed=set(selected) if selected is not None else set(extractor.documents)
    saved=graph.cursor(run,'citations')
    if saved=='complete': return
    cursor=int(saved); previous=None; processed=0; started=time.monotonic()
    scope=''
    params=[]
    if selected is not None:
        scope=' AND document_id IN ('+','.join('?' for _ in selected)+')'; params=list(selected)
    if cursor:
        prior=inputs.corpus.execute('SELECT rowid,id,document_id,title,text,locator,language FROM chunks WHERE rowid=?',(cursor,)).fetchone()
        if prior and prior['document_id'] in allowed: previous=dict(prior)
    pack=load_pack()
    if selected is None:
        from .lifecycle import read
        policy=read(config['state_dir']/'graph-development/quality-policy.json',{})
        pack=pack|{'rules':[r for r in pack['rules'] if r['id'] in policy.get('passingTopicRules',[])]}
    while True:
        rows=inputs.corpus.execute('SELECT rowid,id,document_id,title,text,locator,language FROM chunks WHERE rowid>?'+scope+' ORDER BY rowid LIMIT 1000',[cursor,*params]).fetchall()
        if not rows: break
        check_cancel(config)
        batch_counts=Counter()
        for raw in rows:
            row=dict(raw); cursor=row['rowid']
            if row['document_id'] not in allowed or row['document_id'] not in extractor.documents:
                previous=None; continue
            found,rejected=inputs.parser.extract(row['text'])
            batch_counts[row['document_id']]+=1
            for hit in found: extractor.citation(row,hit)
            for hit in rejected: graph.candidate(run,'unresolved citation syntax/range',{'chunkId':row['id'],**hit})
            if previous and previous['rowid']+1==row['rowid']:
                for hit in boundary_citations(inputs.parser,previous,row):
                    extractor.citation(previous,hit,{previous['id']:previous,row['id']:row})
                if row['language']=='en' and previous['language']=='en' and row['document_id']==previous['document_id'] and section(row['locator'])==section(previous['locator']):
                    left,right=previous['text'][-160:],row['text'][:160]; joined=left+' '+right; boundary=len(left)
                    normalized=unicodedata.normalize('NFKC',joined).casefold()
                    for rule in pack['rules']:
                        if not any(p.casefold() in normalized for p in [rule['phrase'],*rule.get('aliases',[])]): continue
                        for start,end in matches(joined,rule):
                            if start<boundary and end>boundary+1:
                                segments=[{'chunkId':previous['id'],'start':len(previous['text'])-len(left)+start,'end':len(previous['text']),'textHash':text_hash(previous['text']),'literal':left[start:]},
                                          {'chunkId':row['id'],'start':0,'end':end-boundary-1,'textHash':text_hash(row['text']),'literal':right[:end-boundary-1]}]
                                extractor.topic(previous,rule,segments[0]['start'],segments[0]['end'],segments,joined[start:end])
            previous=row; processed+=1
        for doc,count in batch_counts.items():
            graph.db.execute('INSERT INTO scan_counts VALUES(?,?,?) ON CONFLICT(run_id,document_id) DO UPDATE SET chunks=chunks+excluded.chunks',(run,doc,count))
        graph.checkpoint(run,'citations',cursor)
        if selected is None and processed>=10000 and not (config['state_dir']/'graph-development'/('scale-'+run.split(':')[-1]+'.json')).exists():
            write_json(config['state_dir']/'graph-development'/('scale-'+run.split(':')[-1]+'.json'),dict(runId=run,chunksThisSession=processed,
                seconds=round(time.monotonic()-started,2),chunksPerSecond=round(processed/max(.01,time.monotonic()-started),2),graphBytes=graph.path.stat().st_size,
                sourceResolution='chunk IDs, document membership and original code-point witnesses recorded; 100% evidence validation before release',
                hitQuality='pilot policy retained; no corpus-wide precision claim',updatedAt=now()))
        progress(config,run,'body_citations',corpusRowid=cursor,eligibleChunksThisSession=processed)
    graph.checkpoint(run,'citations','complete')


def candidate_rows(inputs,query,cursor,selected=None):
    params=[query,cursor]
    scope=''
    db=getattr(inputs,'candidate_db',inputs.corpus)
    if selected and not hasattr(inputs,'candidate_db'):
        scope=' AND c.document_id IN ('+','.join('?' for _ in selected)+')'; params+=list(selected)
    return db.execute('SELECT c.rowid,c.id,c.document_id,c.title,c.text,c.locator,c.language FROM chunks_fts JOIN chunks c ON c.rowid=chunks_fts.rowid WHERE chunks_fts MATCH ? AND chunks_fts.rowid>?'+scope+' ORDER BY chunks_fts.rowid LIMIT 256',params).fetchall()


def pilot_candidates(inputs,config,selected):
    path=config['state_dir']/'graph-development'/('pilot-fts-'+identity('selection',inputs.manifest['id'],sorted(selected)).split(':')[-1]+'.sqlite3')
    db=sqlite3.connect(path)
    try:
        db.executescript('CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE IF NOT EXISTS chunks(rowid INTEGER PRIMARY KEY,id TEXT,document_id TEXT,title TEXT,text TEXT,locator TEXT,language TEXT,search_text TEXT); CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(title,search_text,content=chunks,content_rowid=rowid);')
        if not db.execute("SELECT 1 FROM meta WHERE key='complete'").fetchone():
            db.execute('DELETE FROM chunks')
            scope=','.join('?' for _ in selected)
            rows=inputs.corpus.execute('SELECT rowid,id,document_id,title,text,locator,language,search_text FROM chunks WHERE document_id IN ('+scope+')',selected)
            for number,row in enumerate(rows,1):
                db.execute('INSERT INTO chunks VALUES(?,?,?,?,?,?,?,?)',tuple(row))
                if number%1000==0: check_cancel(config); db.commit()
            db.execute("INSERT INTO chunks_fts(chunks_fts) VALUES('rebuild')")
            db.execute("INSERT INTO meta VALUES('complete','1')"); db.commit()
    finally: db.close()
    inputs.candidate_db=readonly(path)


def term_pass(graph,run,inputs,config,selected=None):
    extractor=Extractor(graph,run,inputs)
    started=time.monotonic(); scale_chunks=set(); scale_hits=0
    from .lifecycle import read
    policy=read(config['state_dir']/'graph-development/quality-policy.json',{}) if selected is None else {}
    for rule,query in compile_rules(load_pack()):
        if selected is None and rule['id'] not in policy.get('passingTopicRules',[]):
            graph.candidate(run,'topic rule deferred by pilot quality gate',{'rule':rule['id']}); continue
        if rule['topic'] not in inputs.topics: raise ValueError('Term pack uses an unregistered topic sense')
        phase='topic:'+rule['id']; saved=graph.cursor(run,phase)
        if saved=='complete': continue
        cursor=int(saved)
        while True:
            rows=candidate_rows(inputs,query,cursor,selected)
            if not rows: break
            check_cancel(config)
            for raw in rows:
                row=dict(raw); cursor=row['rowid']
                if row['document_id'] in extractor.documents and row['language']=='en':
                    for start,end in matches(row['text'],rule):
                        extractor.topic(row,rule,start,end); scale_hits+=1
                    if selected is None and len(scale_chunks)<10000:
                        scale_chunks.add(row['id'])
                        if len(scale_chunks)==10000:
                            graph.db.commit()
                            elapsed=time.monotonic()-started
                            write_json(config['state_dir']/'graph-development/scale-checkpoint.json',dict(runId=run,scope='first 10000 unique eligible English FTS candidate chunks; not a sequential all-body citation scan',
                                chunks=10000,seconds=round(elapsed,2),chunksPerSecond=round(10000/max(elapsed,.001),2),literalMatches=scale_hits,
                                graphBytes=graph.path.stat().st_size if hasattr(graph,'path') else (config['state_dir']/'enrichment.sqlite3').stat().st_size,
                                sourceResolution='all candidate chunks belong to frozen eligible document crosswalk; exact literal spans recorded directly from original text',
                                fullRunCost='Candidate count depends on remaining rules; no all-body cost extrapolation from selective FTS rate',checkedAt=now()))
            graph.checkpoint(run,phase,cursor); progress(config,run,phase,corpusRowid=cursor)
        graph.checkpoint(run,phase,'complete')


def entity_pass(graph,run,inputs,config,selected=None):
    extractor=Extractor(graph,run,inputs); aliases=defaultdict(set)
    for id,(author,path,sha) in inputs.authors.items():
        for alias in [author.get('name',''),*author.get('aliases',[])]:
            if isinstance(alias,str) and len(alias.split())>=2 and len(alias)<=100: aliases[alias].add(id)
    for row in inputs.corpus.execute("SELECT id,title FROM documents WHERE kind IN ('person','place')"):
        alias=row['title']
        if len(alias.split())>=2 or alias in ('Melchizedek','Nebuchadnezzar','Methuselah','Zerubbabel'):
            aliases[alias].add(row['id'])
    for alias,targets in sorted(aliases.items()):
        phase='entity:'+identity('alias',alias); saved=graph.cursor(run,phase)
        if saved=='complete': continue
        cursor=int(saved)
        while True:
            rows=candidate_rows(inputs,fts_phrase(alias),cursor,selected)
            if not rows: break
            check_cancel(config)
            for raw in rows:
                row=dict(raw); cursor=row['rowid']
                if row['document_id'] not in extractor.documents or row['language']!='en': continue
                for start,end in phrase_spans(row['text'],alias):
                    if len(targets)!=1:
                        graph.candidate(run,'ambiguous entity alias',{'chunkId':row['id'],'start':start,'end':end,'alias':alias,'targets':sorted(targets)})
                    else:
                        target=next(iter(targets))
                        obs=extractor.span(row,start,end,'literal_match','entity-aliases-v1',{'alias':alias,'identityBasis':'unique frozen registry full name or distinctive source entity name'})
                        graph.assertion(run,extractor.chunk(row),'mentions_entity',target,[obs],basis='literal_match',attribution='source mention; speaker/endorsement unresolved',review='unique_alias')
            graph.checkpoint(run,phase,cursor)
        graph.checkpoint(run,phase,'complete'); progress(config,run,'entity_aliases',lastAlias=alias)


def execute(config,manifest,mode='pilot'):
    policy={}
    if mode=='full':
        from .lifecycle import production_gate,read
        gate=production_gate(config)
        if not gate['ready'] or gate['corpusBuild']!=manifest['corpusBuild']:
            raise RuntimeError('Full graph requires independently verified final corpus: '+dumps(gate))
        policy=read(config['state_dir']/'graph-development/quality-policy.json',{})
        if not policy.get('reviewComplete'): raise RuntimeError('Full extraction requires completed pilot review')
    pack=load_pack(); run=identity('run',manifest['id'],manifest['inputsSha256'],mode,pack,'engine-v3-author-screen',__import__('knowledge.enrichment.citations',fromlist=['CitationParser']).CitationParser.version,*([policy] if mode=='full' else []))
    graph_path=config['state_dir']/('graph-development/pilot.sqlite3' if mode=='pilot' else 'enrichment.sqlite3')
    with writer_lock(config['state_dir']):
        graph=Graph(graph_path); inputs=Inputs(manifest)
        try:
            marker=config['state_dir']/'graph-development/cancel.request'
            graph.db.set_progress_handler(lambda:int(marker.exists()),100000)
            inputs.corpus.set_progress_handler(lambda:int(marker.exists()),100000)
            graph.db.execute('INSERT OR IGNORE INTO snapshots VALUES(?,?,?,?)',(manifest['id'],manifest['corpusBuild'],manifest['corpusPath'],dumps(manifest)))
            graph.db.execute('INSERT OR IGNORE INTO runs VALUES(?,?,?,?,?)',(run,manifest['id'],mode,'running',dumps({'startedAt':now(),'versions':{'engine':'v3-author-screen','parser':inputs.parser.version},'rulePack':pack['version'],'rulePackDefinition':pack})))
            existing=json.loads(graph.db.execute('SELECT metadata FROM runs WHERE id=?',(run,)).fetchone()[0])
            if 'rulePackDefinition' not in existing:
                existing['rulePackDefinition']=pack; graph.db.execute('UPDATE runs SET metadata=? WHERE id=?',(dumps(existing),run))
            graph.db.execute('UPDATE runs SET state=\'running\' WHERE id=?',(run,)); graph.db.commit()
            graph.run=run
            # Reuse only unchanged structured foundation evidence. New literal
            # extraction/rule memberships never inherit stale body matches.
            if graph.cursor(run,'bibliography')!='complete':
                previous=graph.db.execute("SELECT id FROM runs WHERE snapshot_id=? AND id<>? ORDER BY rowid DESC LIMIT 1",(manifest['id'],run)).fetchone()
                if previous and graph.cursor(previous[0],'relationships')=='complete' and graph.cursor(previous[0],'recorded-references')=='complete':
                    old=previous[0]
                    graph.db.execute("INSERT OR IGNORE INTO run_entities SELECT ?,v.entity_id FROM run_entities v JOIN entities e ON e.id=v.entity_id WHERE v.run_id=? AND e.kind NOT IN ('chunk','scripture_reference')",(run,old))
                    graph.db.execute('INSERT OR IGNORE INTO entity_versions SELECT ?,v.entity_id,v.label,v.metadata FROM entity_versions v JOIN run_entities e ON e.entity_id=v.entity_id AND e.run_id=? WHERE v.run_id=?',(run,run,old))
                    graph.db.execute("INSERT OR IGNORE INTO run_assertions SELECT ?,r.assertion_id FROM run_assertions r JOIN assertions a ON a.id=r.assertion_id WHERE r.run_id=? AND a.basis='source_record' AND a.subject NOT LIKE 'chunk:%'",(run,old))
                    graph.db.execute('''INSERT OR IGNORE INTO run_observations SELECT ?,e.observation_id FROM run_assertions r JOIN assertion_evidence e ON e.assertion_id=r.assertion_id
                                       JOIN run_observations o ON o.observation_id=e.observation_id AND o.run_id=? WHERE r.run_id=?''',(run,old,run))
                    graph.db.execute('INSERT OR IGNORE INTO run_entities SELECT ?,subject FROM assertions a JOIN run_assertions r ON r.assertion_id=a.id WHERE r.run_id=? UNION SELECT ?,object FROM assertions a JOIN run_assertions r ON r.assertion_id=a.id WHERE r.run_id=?',(run,run,run,run))
                    # Replay isolated biblical identities, including those without
                    # edges, rather than inheriting incomplete old memberships.
                    for phase in ('bibliography','relationships','recorded-references','topic-hierarchy'):
                        if graph.cursor(old,phase)=='complete': graph.checkpoint(run,phase,'complete')
                    for row in graph.db.execute("SELECT reason,metadata FROM candidates WHERE run_id=? AND reason IN ('unresolved author or non-author contributor','unresolved catalogue endpoint','unresolved imported relationship','unresolved recorded reference','vocabulary parent is a category or unregistered topic','topic hierarchy cycle')",(old,)).fetchall():
                        graph.candidate(run,row['reason'],json.loads(row['metadata']))
                    graph.db.commit(); progress(config,run,'reused_unchanged_foundation',previousRun=old)
            import_foundation(graph,run,inputs,config)
            from .foundation import import_recorded_references, import_topic_hierarchy
            import_recorded_references(graph,run,inputs,config); import_topic_hierarchy(graph,run,inputs)
            sample=select_pilot(graph,run,inputs=inputs) if mode=='pilot' else None
            if sample: write_json(config['state_dir']/'graph-development/pilot-selection.json',sample|{'runId':run,'snapshotId':manifest['id']})
            selected=sample['documentIds'] if sample else None
            if mode=='pilot':
                from .quality import freeze_windows
                freeze_windows(inputs,config,sample,run)
                pilot_candidates(inputs,config,selected)
            if mode=='pilot' or policy.get('citationsPassed'):
                citations(graph,run,inputs,config,selected)
            else: graph.candidate(run,'body citation extraction deferred by pilot quality gate',{'scope':'all eligible body chunks'})
            term_pass(graph,run,inputs,config,selected)
            if mode=='pilot' or policy.get('entitiesPassed'):
                entity_pass(graph,run,inputs,config,selected)
            else: graph.candidate(run,'body entity extraction deferred by pilot quality gate',{'scope':'English aliases'})
            from .analysis import derive_shared_references
            derive_shared_references(graph,run,config)
            graph.db.execute('UPDATE runs SET state=\'extracted\' WHERE id=?',(run,)); graph.db.commit()
            progress(config,run,'extracted',mode=mode,snapshot=manifest['id'])
            write_json(config['state_dir']/'graph-development/latest-run.json',dict(runId=run,snapshotId=manifest['id'],mode=mode,graphPath=str(graph_path),manifest=manifest))
            write_json(config['state_dir']/('graph-development/latest-pilot.json' if mode=='pilot' else 'graph-development/latest-full.json'),dict(runId=run,snapshotId=manifest['id'],mode=mode,graphPath=str(graph_path),manifest=manifest))
            return {'runId':run,'graphPath':str(graph_path),'mode':mode,'state':'extracted'}
        except BaseException as error:
            graph.db.set_progress_handler(None,0); inputs.corpus.set_progress_handler(None,0)
            graph.db.rollback()
            graph.db.execute('UPDATE runs SET state=? WHERE id=?',('cancelled' if isinstance(error,Cancelled) or marker.exists() else 'needs_attention',run)); graph.db.commit()
            progress(config,run,'needs_attention',error=str(error),resumable=True)
            raise
        finally:
            inputs.close(); graph.close()
