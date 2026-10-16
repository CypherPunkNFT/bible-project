"""Read-only inputs for LA-03 analytical products."""
import json
import hashlib
from collections import defaultdict,OrderedDict
from pathlib import Path
from .build import PROJECT,DEFAULT_OUT,readonly
from .inputs import packed,digest
from .normalize import language,source
from .jobs import StaleInput
from .text_pipeline import blocks,MAX_BLOCK
from .product_dependencies import text_inputs
from .citation_roles import line_bounds


class ProductInputs:
    def __init__(self,project=PROJECT):
        self.project=Path(project);self.out=self.project/'KnowledgeBase/library-analytics'
        self.pointer=json.loads((self.out/'latest-text-bundle.json').read_text(encoding='utf-8-sig'))
        self.bundle=json.loads(Path(self.pointer['summary']).read_text(encoding='utf-8-sig'))
        if self.bundle['state']!='complete':raise ValueError('Validated text bundle required')
        self.text=readonly(Path(self.pointer['database']))
        self.corpus_watch=readonly(self.project/'KnowledgeBase/knowledge.sqlite3')
        self.corpus_version=self.corpus_watch.execute('PRAGMA data_version').fetchone()[0]
        self.corpus_build=self.corpus_watch.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        if self.corpus_build not in self.bundle['captured_corpus_builds']:raise StaleInput('Corpus build no longer matches LA02')
        self.warehouse=readonly(Path(json.loads((self.out/'latest.json').read_text(encoding='utf-8-sig'))['database']))
        self.refinement=json.loads((self.out/'latest-refinement.json').read_text(encoding='utf-8-sig'))['run_id']
        self.normalized={r['key']:dict(r) for r in self.text.execute('''SELECT n.key,n.language,n.genre,n.author_label,n.source_family
            FROM normalized_metadata n JOIN run_jobs r ON r.job_id=n.job_id WHERE r.run_id=? AND n.layer='corpus' ''',(self.refinement,))}
        self.dependencies={};self.readers=defaultdict(list);self.contributors={};self.canon_cache={}
        root=self.project/'Website/public/content/teacher-library'
        catalogue=self.file(root/'catalogue.json')
        for c in catalogue['contributors']:
            self.contributors[c['id']]={**c,'identity_basis':'existing-reader-catalogue'}
        for path in [self.project/'Website/content/library/authors.json',*sorted((self.project/'Website/content/library/registry-extensions').glob('*.json'))]:
            if not path.is_file():continue
            for c in self.file(path).get('authors',[]):
                self.contributors.setdefault(c['id'],{**c,'identity_basis':'existing-source-registry'})
        for r in self.text.execute('SELECT t.result_json FROM contributor_resolutions t JOIN run_jobs r ON r.job_id=t.job_id WHERE r.run_id=?',(self.refinement,)):
            c=json.loads(r[0])
            if c['state']=='resolved-in-source-registry':
                raw=c['evidence'][0]['record']
                self.contributors.setdefault(c['contributor_id'],{'id':c['contributor_id'],'name':c['name'],'roles':[],
                    'entityType':c.get('entity_type'),'dates':raw.get('dates',[]),'cohort':raw.get('cohort'),
                    'identity_basis':'LA01-source-registry; canonical-application-pending'})
        for path in sorted((root/'records').glob('*.json')):
            for rid,r in self.file(path).items():
                if r.get('sha256'):self.readers[r['sha256']].append(r)

    def file(self,path):
        path=Path(path);before=path.stat();raw=path.read_bytes();after=path.stat()
        if (before.st_size,before.st_mtime_ns)!=(after.st_size,after.st_mtime_ns):raise StaleInput('Metadata changed while capturing')
        self.dependencies[str(path)]={'sha256':hashlib.sha256(raw).hexdigest(),'size':after.st_size,'mtime_ns':after.st_mtime_ns}
        return json.loads(raw.decode('utf-8-sig'))

    def canonical(self,kind,ident):
        if not ident:return None
        if not all(c.isalnum() or c in '_-' for c in ident):return None
        key=(kind,ident)
        if key not in self.canon_cache:
            path=self.project/'Website/content/library/catalog'/(kind+'s')/(ident+'.json')
            self.canon_cache[key]=self.file(path) if path.is_file() else None
        return self.canon_cache[key]

    def documents(self):
        for run in self.pointer['run_ids']:
            for row in self.text.execute('''SELECT s.descriptor_json,r.job_id,q.status,q.characters,q.blocks,q.metrics_json,c.accepted,c.rejected,c.coverage
                FROM text_scope s JOIN run_jobs r ON r.run_id=s.run_id AND r.scope='text:'||s.document_id
                JOIN document_quality q ON q.job_id=r.job_id AND q.document_id=s.document_id
                JOIN reference_coverage c ON c.job_id=r.job_id AND c.document_id=s.document_id WHERE s.run_id=? ORDER BY s.document_id''',(run,)):
                d=json.loads(row['descriptor_json']);doc=d['document_id']
                obs=self.warehouse.execute('SELECT * FROM observations WHERE layer=? AND native_id=?',('corpus',doc)).fetchone()
                n=None
                if obs and obs['metadata_sha']==d['metadata_sha256']:
                    n=self.normalized.get('corpus:'+doc)
                matches=self.readers.get(d['original_sha256'],[])
                sf=source((n['source_family'] if n else d['source_family']) or (matches[0].get('source') if matches else ''))
                if sf=='unknown' and doc.startswith('reference-library:'):
                    sf='reference-library:'+doc.split(':',2)[1].split('/')[0]
                label=(n['author_label'] if n else '') or (obs['author_label'] if obs else '')
                genre=(n['genre'] if n else '') or (obs['genre'] if obs else '') or 'unknown'
                lang=language(n['language'] if n else d['language'])[0]
                work=d['work_id'];edition=d['edition_id'];binding='captured-assertion' if work else 'unresolved'
                if not work:
                    ids={r.get('workId') for r in matches if r.get('workId')}
                    if len(ids)==1:work=next(iter(ids));binding='same-recorded-original-hash-reader-assertion'
                if not edition:
                    ids={r.get('editionId') for r in matches if r.get('editionId')}
                    if len(ids)==1:edition=next(iter(ids))
                canonical=self.canonical('work',work)
                ed=self.canonical('edition',edition)
                valid_work=bool(canonical and canonical.get('id')==work)
                valid_ed=bool(ed and ed.get('id')==edition and ed.get('workId')==work)
                if canonical and genre in ('unknown','text','book'):genre=canonical.get('genre') or genre
                memberships=[];seen=set()
                for value in (canonical or {}).get('creators',[])+(ed or {}).get('contributors',[]):
                    ident=value.get('authorId') or value.get('id') if isinstance(value,dict) else value
                    if ident:
                        role=value.get('role','contributor') if isinstance(value,dict) else 'contributor'
                        if (ident,role) not in seen:memberships.append((ident,role));seen.add((ident,role))
                for reader in matches:
                    for ident in reader.get('contributors',[]):
                        if not any(pair[0]==ident for pair in seen):
                            seen.add((ident,'reader-membership'));memberships.append((ident,'reader-membership'))
                if not memberships and label:
                    ident='label-'+digest({'label':label})[:24]
                    self.contributors.setdefault(ident,{'id':ident,'name':label,'roles':[],
                        'entityType':'unresolved-label','identity_basis':'literal-author-label; not resolved person'})
                    memberships=[(ident,'unresolved-author-label')]
                for ident,_ in memberships:
                    self.contributors.setdefault(ident,{'id':ident,'name':'','entityType':'unresolved-id','identity_basis':'membership-id-absent-from-registry'})
                yield {**d,'text_run_id':run,'text_job_id':row['job_id'],'status':row['status'],'characters':row['characters'],
                    'text_blocks':row['blocks'],'quality':json.loads(row['metrics_json']),'references':row['accepted'],
                    'rejections':row['rejected'],'citation_coverage':row['coverage'],'language':lang,'genre':genre,
                    'source_family':sf,'author_label':label,'work_id':work,'edition_id':edition,
                    'work_verified':valid_work,'edition_verified':valid_ed,'identity_basis':binding,
                    'dates':(canonical or {}).get('dates',[])+(ed or {}).get('dates',[]),'era':(canonical or {}).get('era'),
                    'memberships':memberships,'readers':matches}

    def validate_dependencies(self):
        changed=[]
        for name,v in self.dependencies.items():
            p=Path(name)
            if not p.exists() or (p.stat().st_size,p.stat().st_mtime_ns)!=(v['size'],v['mtime_ns']):changed.append(name)
        if self.corpus_watch.execute('PRAGMA data_version').fetchone()[0]!=self.corpus_version:changed.append('live-corpus-changed-during-analysis')
        changed+=text_inputs(self.text,self.pointer['run_ids'])['errors']
        return changed

    def close(self):
        self.text.close();self.warehouse.close();self.corpus_watch.close()


class BlockReader:
    """Seekable cache index and bounded decoded-block LRU; corpus fetches stay brief."""
    def __init__(self,descriptor,corpus):
        self.d=descriptor;self.corpus=Path(corpus);self.cache=OrderedDict();self.bytes=0;self.offsets=[];self.meta={}
        self.stat=Path(descriptor['cache_path']).stat() if descriptor['cache_path'] else None
    def remember(self,b):
        b['_sha']=hashlib.sha256(b['text'].encode()).hexdigest()
        ordinal=b['ordinal'];self.meta[ordinal]={k:v for k,v in b.items() if k!='text'}
        if ordinal in self.cache:self.bytes-=self.cost(self.cache.pop(ordinal))
        self.cache[ordinal]=b;self.bytes+=self.cost(b)
        self.trim()
    @staticmethod
    def cost(b):return len(b['text'])*2+4*len(b.get('_line_offsets',()))
    def trim(self):
        while len(self.cache)>1 and self.bytes>32*1024*1024:
            _,old=self.cache.popitem(last=False);self.bytes-=self.cost(old)
    def line_bounds(self,b,start,end):
        before=self.cost(b);bounds=line_bounds(b,start,end);self.bytes+=self.cost(b)-before;self.trim();return bounds
    def stream(self):
        if self.d['cache_path']:
            with Path(self.d['cache_path']).open('rb') as f:
                ordinal=0
                while True:
                    offset=f.tell();raw=f.readline(MAX_BLOCK+1)
                    if not raw:break
                    if len(raw)>MAX_BLOCK:raise ValueError('Oversized source block')
                    self.offsets.append(offset);v=json.loads(raw.decode('utf-8-sig'))
                    b={**v,'ordinal':ordinal,'coordinate':'extraction-cache-block','path':self.d['cache_path']}
                    self.remember(b);yield b;ordinal+=1
        else:
            for b in blocks(self.d,self.corpus):self.remember(b);yield b
    def get(self,span):
        ordinal=span['block_ordinal']
        if ordinal in self.cache:
            b=self.cache.pop(ordinal);self.cache[ordinal]=b
        elif self.d['cache_path']:
            with Path(self.d['cache_path']).open('rb') as f:
                f.seek(self.offsets[ordinal]);v=json.loads(f.readline(MAX_BLOCK+1).decode('utf-8-sig'))
            b={**self.meta[ordinal],**v};self.remember(b)
        else:
            db=readonly(self.corpus)
            try:r=db.execute('SELECT text FROM chunks WHERE id=?',(span['chunk_id'],)).fetchone()
            finally:db.close()
            if not r:raise StaleInput('Source chunk disappeared')
            b={**self.meta[ordinal],'text':r[0]};self.remember(b)
        actual=b['_sha']
        if actual!=span['text_sha256'] or b['text'][span['start']:span['end']]!=span['literal']:
            raise StaleInput('Reference witness no longer resolves')
        return b
    def unchanged(self):
        if self.stat:
            current=Path(self.d['cache_path']).stat()
            if (current.st_size,current.st_mtime_ns)!=(self.stat.st_size,self.stat.st_mtime_ns):raise StaleInput('Cache changed during processing')


def probe():
    p=json.loads((DEFAULT_OUT/'latest-text-bundle.json').read_text(encoding='utf-8-sig'))
    b=readonly(Path(p['database']))
    w=readonly(Path(json.loads((DEFAULT_OUT/'latest.json').read_text(encoding='utf-8-sig'))['database']))
    c=readonly(PROJECT/'KnowledgeBase/knowledge.sqlite3')
    try:
        for name,db,tables in [('warehouse',w,['contributors','observations','reader_contributors']),('analytics',b,['normalized_metadata','contributor_resolutions','text_scope','literal_references'])]:
            for table in tables:
                print(json.dumps({'database':name,'table':table,'columns':[r['name'] for r in db.execute('PRAGMA table_info('+table+')')]}))
        print(json.dumps({'contributors':[dict(r) for r in w.execute('SELECT * FROM contributors LIMIT 2')]}))
        for kind in ('library_text','reference','library_catalog','study'):
            rows=c.execute('SELECT id,title,source,metadata FROM documents WHERE kind=? LIMIT 2',(kind,)).fetchall()
            for row in rows:
                m=json.loads(row['metadata'])
                print(json.dumps({'sample_kind':kind,'id':row['id'],'title':row['title'],'source':row['source'],'metadata':m},ensure_ascii=True)[:4000])
        run=json.loads((DEFAULT_OUT/'latest-refinement.json').read_text(encoding='utf-8-sig'))['run_id']
        print(json.dumps({'resolution':dict(b.execute('SELECT t.* FROM contributor_resolutions t JOIN run_jobs r ON r.job_id=t.job_id WHERE r.run_id=? LIMIT 1',(run,)).fetchone())}))
        paths=[dict(r) for r in b.execute('''SELECT s.descriptor_json FROM text_scope s JOIN run_jobs r ON r.run_id=s.run_id AND r.scope='text:'||s.document_id
            JOIN text_processing_gaps g ON g.job_id=r.job_id AND g.document_id=s.document_id
            WHERE s.run_id=? AND g.stage='original-xml-structure' LIMIT 2''',(p['run_ids'][1],))]
        print(json.dumps({'xml_gaps':paths}))
        shard=next((PROJECT/'Website/public/content/teacher-library/records').glob('*.json'))
        print(json.dumps({'reader_sample':next(iter(json.loads(shard.read_text(encoding='utf-8')).values()))},ensure_ascii=True)[:3500])
        print(json.dumps({'verse_columns':[r['name'] for r in c.execute('PRAGMA table_info(verses)')]}))
    finally:
        for db in (b,w,c):db.close()


if __name__=='__main__':probe()
