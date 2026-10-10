import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path
from .core import dumps, identity, now, readonly
from .citations import CitationParser
from ..settings import write_json

BODY_KINDS = ('library_text','library_review','reference')
GENRES = ('sermons','commentaries','theology','standards','apologetics','historical-devotional')


def author_labels(value):
    """Screen complete catalogue author labels, never surname prose mentions."""
    def clean(text):
        return ' '.join(re.findall(r'[^\W\d_]+',unicodedata.normalize('NFKC',text).casefold()))
    result=set()
    if not isinstance(value,str): return result
    for name in value.split(';'):
        result.add(clean(name))
        fields=[f.strip() for f in name.split(',')]
        if len(fields)>1 and fields[1] and not re.search(r'\d',fields[1]):
            result.add(clean(fields[1]+' '+fields[0]))
    return result


def field_value(value, fields):
    for field in fields:
        value = value[int(field)] if isinstance(value,list) else value[field]
    return value


class Inputs:
    def __init__(self, manifest):
        self.manifest = manifest
        self.corpus = readonly(manifest['corpusPath'])
        self.inputs = readonly(manifest['inputsPath'])
        self.books = json.loads(self.corpus.execute("SELECT value FROM meta WHERE key='catalog'").fetchone()[0])['books']
        self.bounds = {(r[0].lower(),r[1]):r[2] for r in self.corpus.execute("SELECT book,chapter,MAX(verse_end) FROM verses WHERE edition='kjv' GROUP BY book,chapter")}
        self.parser = CitationParser(self.books,self.bounds)
        self.authors, self.topics, self.sources, self.blocked = {}, {}, {}, set()
        self.artifacts = {}
        for row in self.inputs.execute('SELECT * FROM artifacts'):
            value = json.loads(row['metadata']); self.artifacts[row['path']] = (row['sha256'],value)
            for author in value.get('authors',[]): self.authors[author['id']] = (author,row['path'],row['sha256'])
            for source in value.get('sources',[]): self.sources[source['id']] = (source,row['path'],row['sha256'])
            for topic in value.get('subjects',[]): self.topics[topic['id']] = (topic,row['path'],row['sha256'])
            for move in value.get('approvedMoves',[]): self.blocked.add(move['sha256'])

    @lru_cache(maxsize=4096)
    def source_hash(self,path):
        row = self.corpus.execute('SELECT sha256 FROM files WHERE path=?',(path,)).fetchone()
        return row[0] if row else ''

    @lru_cache(maxsize=4096)
    def record(self,id):
        row = self.inputs.execute('SELECT * FROM records WHERE id=?',(id,)).fetchone()
        return dict(row) if row else None

    def overlay(self,path,sha):
        row = self.inputs.execute('SELECT metadata FROM overlays WHERE path=? AND sha256=?',(path,sha)).fetchone()
        return json.loads(row[0]) if row else {}

    def close(self):
        if hasattr(self,'candidate_db'): self.candidate_db.close()
        self.inputs.close(); self.corpus.close()


def progress(config,run,phase,**counts):
    from .runner import check_cancel
    if phase!='needs_attention': check_cancel(config)
    write_json(config['state_dir']/'graph-development/run-progress.json',dict(runId=run,phase=phase,pid=__import__('os').getpid(),updatedAt=now(),**counts))


def record_observation(graph,run,inputs,row,fields):
    value = field_value(json.loads(row['metadata']),fields)
    return graph.observation(run,inputs.manifest['id'],row['path'],row['sha256'],
        {'store':'inputs','table':'records','id':row['id'],'fields':fields},dumps(value))


def reference(graph,inputs,book,chapter,verse,end_chapter=None,end_verse=None,edition='unknown',numbering='unspecified'):
    book = book.lower(); end_chapter = end_chapter or chapter; end_verse = end_verse or verse
    if not inputs.parser.valid(book,chapter,verse,end_chapter,end_verse):
        raise ValueError('Reference outside known canonical bounds')
    id = identity('reference',book,chapter,verse,end_chapter,end_verse,edition,numbering)
    graph.entity(id,'scripture_reference',f'{book} {chapter}:{verse}-{end_chapter}:{end_verse}',{'edition':edition,'numbering':numbering})
    graph.db.execute('INSERT OR IGNORE INTO citation_refs VALUES(?,?,?,?,?,?)',(id,book,chapter*1000+verse,end_chapter*1000+end_verse,edition,numbering))
    return id


def genre(value,title):
    tag = ' '.join([value.get('genre',''),*value.get('collections',[])])+ ' '+title.lower()
    if re.search(r'sermon|message|homil',tag): return 'sermons'
    if re.search(r'commentary|commentaries|exposition|expository|exposit',tag): return 'commentaries'
    if re.search(r'confession|catechism|standards|creed',tag): return 'standards'
    if re.search(r'apologetic|controvers|defence|defense',tag): return 'apologetics'
    if re.search(r'systematic|theology|doctrine|divinity|covenant|justification',tag): return 'theology'
    return 'historical-devotional'


def import_foundation(graph,run,inputs,config):
    snapshot = inputs.manifest['id']
    permitted=set(); denied=set()
    for value,_,_ in inputs.authors.values():
        labels=set().union(*(author_labels(v) for v in [value.get('name',''),*value.get('aliases',[])] if isinstance(v,str)))
        canonical=author_labels(value.get('name',''))
        labels={name for name in labels if len(name.split())>=2 or name in canonical}
        if value.get('eligibility')=='eligible': permitted|=labels
        elif value.get('eligibility') in ('excluded','ineligible'): denied|=labels
    if graph.cursor(run,'bibliography') != 'complete':
        for id,(value,path,sha) in inputs.authors.items():
            graph.entity(id,'organization' if value.get('entityType') in ('institution','organization') else 'historical_person',value.get('name',id),value)
        for id,(value,path,sha) in inputs.sources.items(): graph.entity(id,'acquisition_source',value.get('name') or value.get('label') or id,value)
        for id,(value,path,sha) in inputs.topics.items(): graph.entity('topic:'+id,'topic',value['label'],value)
        # Two passes ensure every typed endpoint exists before relationships.
        for row in inputs.inputs.execute('SELECT * FROM records WHERE kind IN (\'work\',\'edition\',\'asset\')'):
            value=json.loads(row['metadata']); graph.entity(row['id'],row['kind'],value.get('title') or value.get('label') or row['id'],value)
        for number,row in enumerate(inputs.inputs.execute('SELECT * FROM records'),1):
            value=json.loads(row['metadata']); id=row['id']
            if row['kind']=='work':
                for index,creator in enumerate(value.get('creators',[])):
                    author=creator.get('authorId')
                    if author in inputs.authors and creator.get('role')=='author':
                        obs=record_observation(graph,run,inputs,row,['creators',str(index),'authorId'])
                        graph.assertion(run,id,'authored_by',author,[obs],qualifiers={'role':creator['role']})
                    else: graph.candidate(run,'unresolved author or non-author contributor',{'workId':id,'creator':creator})
            for field,relation in [('workId','edition_of'),('editionId','asset_of'),('sourceId','provided_by')]:
                target=value.get(field)
                if not target: continue
                if (row['kind'],field) not in (('edition','workId'),('asset','editionId'),('asset','sourceId')): continue
                if graph.db.execute('SELECT 1 FROM entities WHERE id=?',(target,)).fetchone():
                    graph.assertion(run,id,relation,target,[record_observation(graph,run,inputs,row,[field])])
                else: graph.candidate(run,'unresolved catalogue endpoint',{'recordId':id,'field':field,'target':target})
            if number%1000==0:
                graph.db.commit(); progress(config,run,'bibliography',records=number)
        graph.checkpoint(run,'bibliography','complete')
    if graph.cursor(run,'documents') != 'complete':
        for number,row in enumerate(inputs.corpus.execute('SELECT id,title,kind,source,language,metadata FROM documents'),1):
            if row['kind'] not in BODY_KINDS: continue
            meta=json.loads(row['metadata']); sha=meta.get('original_sha256') or inputs.source_hash(row['source'])
            if sha in inputs.blocked: continue
            hint=meta.get('acquisition',{}) | inputs.overlay(row['source'],sha)
            asset=hint.get('assetId') or meta.get('asset',{}).get('id')
            edition=hint.get('editionId') or meta.get('edition',{}).get('id')
            edition_record=inputs.record(edition) if edition else None
            work=(json.loads(edition_record['metadata']).get('workId') if edition_record else None) or hint.get('workId') or meta.get('work',{}).get('id')
            work_record=inputs.record(work) if work else None
            if not work_record:
                if work: graph.candidate(run,'unregistered source work identity',{'documentId':row['id'],'identifier':work})
                work=None
            if not edition_record: edition=None
            work_value=json.loads(work_record['metadata']) if work_record else {}
            excluded=work_value.get('role')=='context-only' or any(inputs.authors.get(c.get('authorId'),({},None,None))[0].get('eligibility') in ('excluded','ineligible') for c in work_value.get('creators',[]))
            labels=author_labels(hint.get('author'))
            path=row['source'].replace('\\','/').casefold()
            unscreened_tcp='/source-tcp-bulk/' in path or '/bulk/tcp/' in path
            unresolved_tcp=unscreened_tcp and not (labels&permitted or any(inputs.authors.get(c.get('authorId'),({},None,None))[0].get('eligibility')=='eligible' for c in work_value.get('creators',[])))
            excluded=excluded or bool(labels&denied) or unresolved_tcp
            structured=row['kind']=='reference' and '/theographic/' in path and isinstance(meta.get('fields'),dict)
            excluded=excluded or structured
            if unresolved_tcp: graph.candidate(run,'TCP author eligibility unresolved; body extraction deferred',{'documentId':row['id'],'authorLabel':hint.get('author'),'sourceHash':sha,'scope':'collection/author screen, no per-work decision or evidenceOnly hold'})
            if structured: graph.candidate(run,'structured reference record excluded from ordinary body extraction',{'documentId':row['id'],'collection':'Theographic','sourceHash':sha})
            eligible=not excluded
            summary={'kind':row['kind'],'title':hint.get('title') or row['title'],'source':row['source'],'sourceHash':sha,
                     'authorLabel':hint.get('author'),'credit':hint.get('credit'),'reviewClass':hint.get('reviewClass'),
                     'contributor':hint.get('contributor'),'licence':hint.get('licence') or meta.get('licence'),
                     'sourceUrl':hint.get('url'),'sourceId':hint.get('sourceId'),'audience':hint.get('audience'),
                     'scope':'private local','exclusionReason':'unresolved TCP author screen' if unresolved_tcp else 'structured reference metadata' if structured else 'existing author/context-only exclusion' if excluded else None}
            graph.entity('document:'+row['id'],'document',summary['title'],summary)
            graph.db.execute('INSERT OR REPLACE INTO document_map VALUES(?,?,?,?,?,?,?,?)',
                (run,row['id'],work,edition,genre(work_value,row['title']),row['language'],int(eligible),dumps(summary)))
            if work or edition:
                field='editionId' if edition else 'workId'; target=edition or work
                over=inputs.inputs.execute('SELECT metadata FROM overlays WHERE path=? AND sha256=?',(row['source'],sha)).fetchone()
                if over and json.loads(over[0]).get(field)==target:
                    artifact=next(a for a in inputs.manifest['artifacts'] if Path(a['path']).name=='acquisition-manifest.json')
                    obs=graph.observation(run,snapshot,artifact['path'],artifact['sha256'],{'store':'inputs','table':'overlays','path':row['source'],'fields':[field]},dumps(target))
                    graph.assertion(run,'document:'+row['id'],'part_of',target,[obs])
                elif (meta.get('edition',{}).get('id') if edition else meta.get('work',{}).get('id'))==target:
                    fields=['edition' if edition else 'work','id']
                    obs=graph.observation(run,snapshot,row['source'],sha,{'store':'corpus','table':'documents','id':row['id'],'fields':['metadata',*fields]},dumps(target))
                    graph.assertion(run,'document:'+row['id'],'part_of',target,[obs])
            if number%1000==0:
                graph.db.commit(); progress(config,run,'document_crosswalk',documentsConsidered=number)
        for row in inputs.corpus.execute("SELECT path,sha256,status,document_id,metadata FROM library_files WHERE status IN ('indexed','duplicate')"):
            if row['sha256'] in inputs.blocked or not row['document_id']: continue
            hint=json.loads(row['metadata']).get('acquisition',{}) | inputs.overlay(row['path'],row['sha256'])
            work=hint.get('workId'); edition=hint.get('editionId')
            if not work or not inputs.record(work): work=None
            if not edition or not inputs.record(edition): edition=None
            graph.db.execute('INSERT OR REPLACE INTO document_witnesses VALUES(?,?,?,?,?,?,?)',(run,row['document_id'],row['path'],row['sha256'],work,edition,row['status']))
        graph.checkpoint(run,'documents','complete')
    if graph.cursor(run,'biblical_entities') != 'complete':
        for row in inputs.corpus.execute("SELECT id,title,kind,source,metadata FROM documents WHERE kind IN ('person','place')"):
            graph.entity(row['id'],'biblical_person' if row['kind']=='person' else 'place',row['title'],json.loads(row['metadata']))
        graph.checkpoint(run,'biblical_entities','complete')
    saved=graph.cursor(run,'relationships')
    if saved=='complete': return
    cursor=int(saved)
    for number,row in enumerate(inputs.corpus.execute('SELECT * FROM edges WHERE id>? ORDER BY id',(cursor,)),1):
        metadata=json.loads(row['metadata']); subject,object=row['subject'],row['object']
        try:
            if row['relation']=='cross_reference':
                def parse(value,end=None):
                    _,edition,book,c,v=value.split(':')
                    end_parts=(end or value).split(':')
                    if end_parts[2]!=book: raise ValueError('Cross-book target range needs explicit alignment')
                    return reference(graph,inputs,book,int(c),int(v),int(end_parts[3]),int(end_parts[4]),edition=edition,numbering='project-kjv')
                subject,object=parse(subject),parse(object,metadata.get('end'))
                relation='source_cross_reference'
            else: relation=row['relation']
            locator={'store':'corpus','table':'edges','subject':row['subject'],'relation':row['relation'],'object':row['object'],'metadata':metadata}
            literal=dumps({k:row[k] for k in ('subject','relation','object')} | {'metadata':metadata})
            obs=graph.observation(run,snapshot,row['source'],inputs.source_hash(row['source']),locator,literal)
            graph.assertion(run,subject,relation,object,[obs],qualifiers=metadata,attribution='OpenBible.info' if relation=='source_cross_reference' else 'STEP Bible source relationship')
        except ValueError as error: graph.candidate(run,'unresolved imported relationship',{'record':dict(row),'error':str(error)})
        if number%1000==0:
            graph.checkpoint(run,'relationships',row['id']); progress(config,run,'source_relationships',processed=cursor+number)
    graph.checkpoint(run,'relationships','complete')


def select_pilot(graph,run,limit_per_genre=20,inputs=None):
    # Unique known works or independent source-byte witnesses; never title dedup.
    choices={g:{} for g in GENRES}
    for row in graph.db.execute('SELECT * FROM document_map WHERE run_id=? AND eligible=1 AND language=\'en\'',(run,)):
        metadata=json.loads(row['metadata']); key=row['work_id'] or metadata.get('sourceHash') or row['document_id']
        score=identity('sample','graph-pilot-v1',row['document_id'])
        old=choices[row['genre']].get(key)
        if old is None or score<old[0]: choices[row['genre']][key]=(score,row['document_id'])
    selected=[]; used=set(); counts={}; profiles=[]
    for group in GENRES:
        values=[]; buckets={}
        pool=sorted(choices[group].items(),key=lambda pair:pair[1])[:max(100,limit_per_genre*5)]
        for key,(score,doc) in pool:
            row=graph.db.execute('SELECT * FROM document_map WHERE run_id=? AND document_id=?',(run,doc)).fetchone(); meta=json.loads(row['metadata'])
            work=graph.db.execute('SELECT metadata FROM entities WHERE id=?',(row['work_id'],)).fetchone() if row['work_id'] else None
            creators=json.loads(work[0]).get('creators',[]) if work else []
            author=next((c['authorId'] for c in creators if c.get('role')=='author' and c.get('authorId')),None) or meta.get('authorLabel') or 'unresolved'
            count=inputs.corpus.execute('SELECT count(*) FROM chunks WHERE document_id=?',(doc,)).fetchone()[0] if inputs else 0
            first=inputs.corpus.execute('SELECT text FROM chunks WHERE document_id=? ORDER BY rowid LIMIT 1',(doc,)).fetchone() if inputs else None
            text=first[0] if first else ''
            quality='historical typography' if 'ſ' in text else 'replacement characters' if '\ufffd' in text else 'no detected first-window anomaly'
            length='short' if count<50 else 'medium' if count<500 else 'long'
            profile=dict(documentId=doc,identity=key,knownWork=bool(row['work_id']),genre=group,authorIdentity=author,
                         lengthBucket=length,chunks=count,editionId=row['edition_id'],textQuality=quality)
            buckets.setdefault((str(author),length,str(row['edition_id']),quality),[]).append((key,doc,profile))
        ordered=sorted(buckets.values(),key=lambda b:identity('stratum','graph-pilot-v1',b[0][2]))
        candidates=[]
        for position in range(max((len(b) for b in ordered),default=0)):
            candidates.extend(bucket[position] for bucket in ordered if len(bucket)>position)
        for key,doc,profile in candidates:
            if key not in used:
                values.append(doc); used.add(key); profiles.append(profile)
            if len(values)==limit_per_genre: break
        selected+=values; counts[group]=len(values)
    return {'documentIds':selected,'genreCounts':counts,'targetPerGenre':limit_per_genre,'seed':'graph-pilot-v1','profiles':profiles,
            'stratification':'author identity/label, chunk-count length bucket, known edition, first-window typography quality; round-robin among lowest-hash bounded candidate strata; genres are metadata/title heuristics',
            'selectionUnit':'known work; otherwise independent recorded source-byte witness (not a claimed work identity)'}


def import_recorded_references(graph,run,inputs,config):
    phase='recorded-references'
    saved=graph.cursor(run,phase)
    if saved=='complete': return
    books={b['num']:b['code'].lower() for b in inputs.books}
    for number,row in enumerate(inputs.corpus.execute('SELECT rowid,* FROM references_to WHERE rowid>? ORDER BY rowid',(int(saved),)),1):
        if any(sha in row['document_id'] for sha in inputs.blocked): continue
        raw={k:row[k] for k in ('document_id','edition','start','end','source')}
        try:
            book,start=divmod(row['start'],1000000); end_book,end=divmod(row['end'],1000000)
            if book!=end_book or book not in books: raise ValueError('unresolved/cross-book recorded reference')
            chapter,verse=divmod(start,1000); ec,ev=divmod(end,1000)
            target=reference(graph,inputs,books[book],chapter,verse,ec,ev,edition=row['edition'],numbering='project-register')
            doc=inputs.corpus.execute('SELECT title,kind,metadata FROM documents WHERE id=?',(row['document_id'],)).fetchone()
            if not doc: raise ValueError('recorded reference document missing')
            graph.entity('document:'+row['document_id'],'document',doc['title'],{'kind':doc['kind'],'scope':'structured reference assignment; not an eligible source body by default'})
            obs=graph.observation(run,inputs.manifest['id'],row['source'],inputs.source_hash(row['source']),
                                  dict(store='corpus',table='references_to',**raw),dumps(raw))
            graph.assertion(run,'document:'+row['document_id'],'recorded_reference',target,[obs],
                            qualifiers={'assignment':'existing structured reference register, not a body observation'},attribution='existing source metadata/reference register')
        except ValueError as error:
            graph.candidate(run,'unresolved recorded reference',{'record':raw,'reason':str(error)})
        if number%1000==0:
            graph.checkpoint(run,phase,row['rowid']); progress(config,run,phase,records=row['rowid'])
    graph.checkpoint(run,phase,'complete')


def import_topic_hierarchy(graph,run,inputs):
    if graph.cursor(run,'topic-hierarchy')=='complete': return
    for id,(value,path,sha) in inputs.topics.items():
        parent=value.get('parent')
        if not parent: continue
        if parent not in inputs.topics:
            graph.candidate(run,'vocabulary parent is a category or unregistered topic',{'topic':id,'parent':parent}); continue
        seen={id}; current=parent; cyclic=False
        while current in inputs.topics:
            if current in seen: cyclic=True; break
            seen.add(current); current=inputs.topics[current][0].get('parent')
        if cyclic:
            graph.candidate(run,'topic hierarchy cycle',{'topic':id,'parent':parent}); continue
        subjects=inputs.artifacts[path][1]['subjects']; index=next(i for i,t in enumerate(subjects) if t['id']==id)
        obs=graph.observation(run,inputs.manifest['id'],path,sha,{'store':'inputs','table':'artifacts','path':path,'fields':['subjects',str(index),'parent']},dumps(parent))
        graph.assertion(run,'topic:'+id,'broader_topic','topic:'+parent,[obs],attribution='curated existing vocabulary, not inferred from co-occurrence')
    graph.checkpoint(run,'topic-hierarchy','complete')
