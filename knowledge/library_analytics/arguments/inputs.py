"""Explicit immutable parent selection; no refresh/latest dependency."""
import hashlib,json,sqlite3,sys,importlib.metadata
from pathlib import Path
from ..build import PROJECT
from ..jobs import StaleInput,process_identity
from ..section_contract import resolve_segment

SECTION_RUN='kr101-31239794030518bcb2299a31'
ALIGNMENT_RUN='kr102-1b03f58bf6e6749f9170bf38'
BASE=Path(PROJECT)/'KnowledgeBase/library-knowledge/connected-research'
ROOT=BASE/'arguments'

def sha(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()
def read(path):return json.loads(Path(path).read_text('utf-8'))
def ro(path):
    db=sqlite3.connect('file:'+Path(path).as_posix()+'?mode=ro',uri=True);db.row_factory=sqlite3.Row
    db.execute('PRAGMA cache_size=-131072');db.execute('PRAGMA mmap_size=2147483648');return db
def write_json(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix(path.suffix+'.tmp');temp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n','utf-8');temp.replace(path)
def runtime_dependencies():
    import typing_extensions
    expected=ROOT/'dependencies/typing_extensions.py'
    if Path(typing_extensions.__file__).resolve()!=expected.resolve():raise StaleInput('Expected owned pinned typing_extensions dependency')
    return {'python':sys.version,'sqlite':sqlite3.sqlite_version,'lxml':importlib.metadata.version('lxml'),'beautifulsoup4':importlib.metadata.version('beautifulsoup4'),'typing_extensions':importlib.metadata.version('typing_extensions'),'typing_extensions_sha256':sha(expected)}

class Inputs:
    def __init__(self):
        self.proofs=[]
        for folder,rid in [(BASE/'releases',SECTION_RUN),(BASE/'alignment/releases',ALIGNMENT_RUN)]:
            p=folder/rid/'summary.json';manifest=folder/rid/'release_manifest.json';m=read(manifest)
            proof=next(x for x in m['files'] if x.get('path',x.get('name'))=='summary.json')
            if sha(p)!=proof['sha256'] or read(p)['run_id']!=rid or read(p)['state']!='complete':raise StaleInput('Parent identity/summary mismatch')
            self.proofs.extend([{'path':str(p),'sha256':sha(p)},{'path':str(manifest),'sha256':sha(manifest)}])
        alignment=read(BASE/'alignment/releases'/ALIGNMENT_RUN/'summary.json')
        if alignment['contract']['section_run']!=SECTION_RUN:raise StaleInput('Incompatible parents')
        package=Path(__file__).parents[1]
        self.code_proofs=[{'path':str(p),'sha256':sha(p)} for p in [*(package/n for n in ['jobs.py','build.py','inputs.py','section_contract.py','xml_bridge.py']),package.parent/'reference_library.py']]
        self.runtime=runtime_dependencies()
        self.sections=ro(BASE/'sections.sqlite3');self.alignment=ro(BASE/'alignment/alignment.sqlite3');self.prepared={}
    def check(self,verify_sources=True):
        for p in self.proofs+getattr(self,'code_proofs',[]):
            if sha(p['path'])!=p['sha256']:raise StaleInput('Changed immutable parent '+p['path'])
        if verify_sources:
            # Existing pinned source dependency index, independent of latest pointers.
            # Every source is SHA256-checked again when reconstructed; this full
            # stat guard also rejects changed inputs belonging to skipped jobs.
            for r in self.sections.execute('SELECT path,size,mtime_ns FROM research_inputs WHERE run_id=?',(SECTION_RUN,)):
                p=Path(r['path'])
                try:s=p.stat()
                except OSError as e:raise StaleInput('Pinned source unavailable: '+str(p)) from e
                if (s.st_size,s.st_mtime_ns)!=(r['size'],r['mtime_ns']):raise StaleInput('Pinned input changed: '+str(p))
    def check_contract(self,contract):
        if contract.get('runtime_dependencies') and contract['runtime_dependencies']!=runtime_dependencies():raise StaleInput('Runtime/parser dependencies differ from this generation')
        for p in contract.get('shared_code_proofs',[]):
            if sha(p['path'])!=p['sha256']:raise StaleInput('Shared adapter code differs from this generation: '+p['path'])
        for name,h in contract.get('code',{}).items():
            if sha(Path(__file__).with_name(name))!=h:raise StaleInput('Processor code differs from this generation: '+name)
    def descriptors(self):
        return self.sections.execute('SELECT * FROM research_scope WHERE run_id=? ORDER BY document_id',(SECTION_RUN,))
    def segments(self,doc):
        # Indexed document lookup, selected membership tested by primary key.
        return self.sections.execute('SELECT s.*,g.ordinal,g.coordinate,g.path,g.asset_sha256,g.block_ordinal,g.locator,g.start,g.end,g.block_text_sha256,g.span_sha256 FROM sections s INDEXED BY sections_document JOIN run_sections r ON r.version_id=s.version_id AND r.run_id=? JOIN section_segments g ON g.version_id=s.version_id WHERE s.document_id=? ORDER BY g.path,g.block_ordinal,g.start,g.end,s.version_id',(SECTION_RUN,doc)).fetchall()
    def close(self):self.sections.close();self.alignment.close()

def lease_status():
    db=ro(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3')
    rows=[{**dict(r),'live_identity':process_identity(r['pid'])} for r in db.execute('SELECT * FROM coordinator')];db.close();return rows

if __name__=='__main__':
    print(json.dumps({'global_lease':lease_status()},indent=2))
    i=Inputs();print(json.dumps({'proofs':i.proofs},indent=2))
    counts={};examples=[]
    for row in i.descriptors():
        d=json.loads(row['descriptor_json']);key=(row['disposition'],d.get('language'),row['adapter']);counts[str(key)]=counts.get(str(key),0)+1
        if row['disposition']=='supported' and any(n in (d.get('author_label') or '').lower() for n in ['aquinas','gill,','owen,']):
            if len(examples)<12:examples.append({'id':row['document_id'],'title':d.get('title'),'author':d.get('author_label'),'language':d.get('language'),'adapter':row['adapter']})
    print(json.dumps({'counts':counts,'examples':examples},indent=2));i.close()
