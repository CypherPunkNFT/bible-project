"""KR-101: representation-specific sections and Unicode codepoint source spans.

No bodies are copied into the research DB. A section's stable identity names a
document, content-addressed representation and native key; its version names
the boundary rule and exact spans. Native layout does not establish attribution,
argument, exposition, or an exact reader destination.
"""
import hashlib
import json
import re
from pathlib import Path
from .inputs import digest, packed
from .jobs import StaleInput
from .structure import HEADINGS

VERSION = 'kr101-sections-v3'
SCHEMA = '''
CREATE TABLE IF NOT EXISTS research_runs(id TEXT PRIMARY KEY,state TEXT,created_at TEXT,
 contract_json TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS research_scope(run_id TEXT,document_id TEXT,adapter TEXT,
 disposition TEXT,reason TEXT,descriptor_json TEXT,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS research_documents(run_id TEXT,document_id TEXT,state TEXT,
 adapter TEXT,sections INTEGER,segments INTEGER,gaps_json TEXT,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS sections(version_id TEXT PRIMARY KEY,id TEXT,document_id TEXT,
 representation_sha256 TEXT,parent_version_id TEXT,kind TEXT,native_key TEXT,heading TEXT,
 boundary_method TEXT,state TEXT,work_id TEXT,edition_id TEXT,metadata_json TEXT);
CREATE TABLE IF NOT EXISTS section_segments(version_id TEXT,ordinal INTEGER,coordinate TEXT,
 path TEXT,asset_sha256 TEXT,block_ordinal INTEGER,locator TEXT,start INTEGER,end INTEGER,
 block_text_sha256 TEXT,span_sha256 TEXT,PRIMARY KEY(version_id,ordinal),
 CHECK(start>=0 AND end>=start));
CREATE TABLE IF NOT EXISTS run_sections(run_id TEXT,version_id TEXT,
 PRIMARY KEY(run_id,version_id));
CREATE TABLE IF NOT EXISTS research_inputs(run_id TEXT,path TEXT,sha256 TEXT,size INTEGER,
 mtime_ns INTEGER,PRIMARY KEY(run_id,path));
CREATE INDEX IF NOT EXISTS sections_document ON sections(document_id);
CREATE INDEX IF NOT EXISTS sections_identity ON sections(id);
CREATE INDEX IF NOT EXISTS sections_parent ON sections(parent_version_id);
CREATE INDEX IF NOT EXISTS segments_path ON section_segments(path);
'''


def text_hash(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def checked_bytes(path, expected=None):
    path = Path(path); before = path.stat(); raw = path.read_bytes(); after = path.stat()
    sha = hashlib.sha256(raw).hexdigest()
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise StaleInput('Input changed while reading: '+str(path))
    if expected and sha != expected:
        raise StaleInput('Input hash differs from named snapshot: '+str(path))
    return raw, (str(path), sha, after.st_size, after.st_mtime_ns)


def cache_blocks(raw):
    result = []
    for ordinal, line in enumerate(raw.splitlines()):
        value = json.loads(line.decode('utf-8-sig'))
        if not isinstance(value.get('text'), str): raise ValueError('Cache block has no text')
        result.append({**value, 'ordinal':ordinal})
    return result


def xml_render(raw):
    """Same whitespace/gap transform as library-text-2, with native node bounds.

    Structural positions are accumulated during traversal, never found by
    searching heading strings (repeated headings and nested markup are safe).
    """
    from lxml import etree
    root = etree.fromstring(raw, etree.XMLParser(resolve_entities=False,
        no_network=True, recover=True, huge_tree=True))
    if root is None: raise ValueError('XML has no root')
    def name(node):
        return etree.QName(node).localname if isinstance(node.tag,str) else ''
    for node in root.iter():
        n = name(node).lower()
        if n == 'gap': node.text = ' [Editorial gap: '+(node.get('reason') or 'unspecified')+'] '
        elif n in ('pb','page'): node.text = '\n[Source page '+(node.get('n') or node.get('number') or 'unlabeled')+']\n'
        elif n in ('p','div','div1','div2','head','title','l','br','lb','para'): node.tail = '\n'+(node.tail or '')
        elif n == 'word': node.tail = ' '+(node.tail or '')
        elif n == 'line': node.tail = '\n'+(node.tail or '')
    pieces=[]; found=[]; position=0
    def append(text):
        nonlocal position
        if text: pieces.append(text); position += len(text)
    def walk(node, key, parent, in_body):
        n=name(node); local=n.lower(); start=position
        in_body = in_body or local in ('text','body','thml.body','osistext')
        selected = in_body and (re.fullmatch(r'div\d*',local) or local in
            ('book','chapter','sermon','section','entry','verse'))
        current = key if selected else parent
        append(node.text if isinstance(node.tag,str) or isinstance(node,etree._Entity) else None)
        counts={}
        for child in node:
            c=name(child)
            counts[c]=counts.get(c,0)+1
            walk(child,key+'/'+c+'['+str(counts[c])+']',current,in_body)
            append(child.tail)
        end=position
        if selected:
            headings = [c for c in node if name(c).lower() in ('head','title')]
            heading = ' '.join(''.join(headings[0].itertext()).split())[:1000] if headings else (node.get('n') or node.get('type') or local)
            kind = (node.get('type') or local).lower()
            found.append({'key':key,'parent':parent,'start':start,'end':end,
                'heading':heading,'kind':'commentary-entry' if local=='verse' else 'xml-'+kind,
                'native_id':node.get('{http://www.w3.org/XML/1998/namespace}id') or node.get('id')})
    walk(root,'/'+name(root)+'[1]',None,False)
    rendered=''.join(pieces)
    left=len(rendered)-len(rendered.lstrip()); text=rendered.strip()
    for item in found:
        item['start']=max(0,min(len(text),item['start']-left))
        item['end']=max(item['start'],min(len(text),item['end']-left))
    return text, sorted(found,key=lambda x:(x['start'], -x['end'], x['key']))


def html_render(raw):
    from bs4 import BeautifulSoup
    soup=BeautifulSoup(raw,'html.parser')
    for node in soup(['script','style','nav','noscript']): node.decompose()
    body=soup.body or soup
    strings=list(body._all_strings(strip=True))
    offsets={}; pieces=[]; position=0
    for string in strings:
        value=str(string)
        # strip=True returns new strings; use source DOM traversal below for
        # identity, not value lookup, because headings can repeat.
        pieces.append(value)
    text='\n'.join(pieces)
    headings=[]; position=0
    from bs4.element import NavigableString
    for string in body.descendants:
        if not isinstance(string,NavigableString) or string.__class__ not in body.MAIN_CONTENT_STRING_TYPES: continue
        value=str(string).strip()
        if not value: continue
        parent=string.parent
        while parent is not None and parent is not body:
            if parent.name and re.fullmatch('h[1-6]',parent.name):
                if id(parent) not in offsets:
                    offsets[id(parent)]=position
                    headings.append({'key':parent.get('id') or 'heading-'+str(len(headings)),
                        'heading':parent.get_text(' ',strip=True)[:1000],
                        'start':position,'level':int(parent.name[1])})
                break
            parent=parent.parent
        position += len(value)+1
    if position and position-1 != len(text): raise ValueError('HTML string coordinate reconstruction differs')
    stack=[]
    for i,h in enumerate(headings):
        h['key']='html:'+str(i)+':'+h['key']
        while stack and stack[-1]['level']>=h['level']:stack.pop()
        h['parent']=stack[-1]['key'] if stack else None
        h['end']=next((other['start'] for other in headings[i+1:] if other['level']<=h['level']),len(text))
        h['kind']='html-heading-section';stack.append(h)
    return text,headings


class SectionWriter:
    def __init__(self,db,run,descriptor,representation,blocks,coordinate,path,asset_hash):
        self.db=db; self.run=run; self.d=descriptor; self.representation=representation
        self.blocks=blocks; self.coordinate=coordinate; self.path=path; self.asset_hash=asset_hash
        self.bounds=[]; self.total=0; self.versions={};self.count=0;self.segments=0
        for b in blocks:
            end=self.total+len(b['text']);self.bounds.append((self.total,end,b,text_hash(b['text'])));self.total=end

    def add(self,key,kind,heading,start,end,parent=None,method=VERSION,state='native-structure',metadata=None):
        if not 0<=start<=end<=self.total:raise ValueError('Section outside source representation')
        spans=[]
        for a,b,block,sha in self.bounds:
            if b<=start or a>=end: continue
            s=max(0,start-a);e=min(b-a,end-a)
            spans.append((self.coordinate,self.path,self.asset_hash,block['ordinal'],block.get('locator',''),s,e,sha,text_hash(block['text'][s:e])))
        if not spans:return None
        ident='section-'+digest({'document':self.d['document_id'],'representation':self.representation,'key':key})
        parent_version=self.versions.get(parent)
        meta={'coordinate_unit':'unicode-codepoint','range':'half-open','attribution':'source contributor metadata; no speaker/endorsement inference',**(metadata or {})}
        version='section-version-'+digest({'id':ident,'method':method,'spans':spans,'kind':kind,'state':state,'heading':heading,
            'metadata':meta,'work':self.d.get('work_id'),'edition':self.d.get('edition_id'),'parent':parent_version})
        if parent and not parent_version:raise ValueError('Missing section parent: '+parent)
        if parent:
            pstart,pend=self.versions[parent+':bounds']
            if not pstart<=start<=end<=pend:raise ValueError('Child exceeds parent source bounds')
        self.db.execute('INSERT OR IGNORE INTO sections VALUES('+','.join('?'*13)+')',
            (version,ident,self.d['document_id'],self.representation,parent_version,kind,key,heading,method,state,
             self.d.get('work_id') if self.d.get('work_verified') else None,
             self.d.get('edition_id') if self.d.get('edition_verified') else None,packed(meta)))
        self.db.executemany('INSERT OR IGNORE INTO section_segments VALUES('+','.join('?'*11)+')',[(version,i,*span) for i,span in enumerate(spans)])
        self.db.execute('INSERT OR IGNORE INTO run_sections VALUES(?,?)',(self.run,version))
        self.versions[key]=version;self.versions[key+':bounds']=(start,end)
        self.count+=1;self.segments+=len(spans)
        return version

    def native(self,items,parent='document'):
        # Native paths order parents before children even when their spans tie.
        for item in sorted(items,key=lambda x:(x['key'].count('/'),x['start'],x['key'])):
            self.add(item['key'],item['kind'],item['heading'],item['start'],item['end'],
                item.get('parent') if item.get('parent') in self.versions else parent,
                metadata={'native_id':item.get('native_id')})

    def candidates(self,parent='document',start=0,end=None,key_prefix='plain'):
        end=self.total if end is None else end
        hits=[]
        for a,b,block,sha in self.bounds:
            if b<=start or a>=end:continue
            for match in HEADINGS.finditer(block['text']):
                pos=a+match.start()
                if start<=pos<end:hits.append((pos,match.group().strip()))
        for i,(pos,label) in enumerate(hits):
            self.add(key_prefix+':heading:'+str(pos),'heading-candidate',label,pos,
                hits[i+1][0] if i+1<len(hits) else end,parent,
                method='literal-heading-boundary-v1',state='candidate-unreviewed')
        return len(hits)


def resolve_segment(segment, prepared=None):
    """Return exact witness text or fail on changed bytes/coordinates."""
    row=dict(segment)
    key=(row['path'],row['asset_sha256'],row['coordinate'])
    if prepared is not None and key in prepared:
        payload=prepared[key]
    else:
        raw,_=checked_bytes(row['path'],row['asset_sha256'])
        if row['coordinate']=='extraction-cache-block':payload=cache_blocks(raw)
        elif row['coordinate']=='original-xml-rendered':payload=xml_render(raw)[0]
        elif row['coordinate']=='original-html-rendered':payload=html_render(raw)[0]
        elif row['coordinate']=='original-xml-entry':
            from .xml_bridge import entries
            payload={key:body for key,locators,body in entries(Path(row['path']))}
        else:raise ValueError('Unsupported coordinate: '+row['coordinate'])
        if prepared is not None:
            # One representation retained at a time, not a full-library body
            # cache. A multi-page witness reads and hashes its file once.
            prepared.clear();prepared[key]=payload
    coordinate=row['coordinate']
    if coordinate=='extraction-cache-block':text=payload[row['block_ordinal']]['text']
    elif coordinate in ('original-xml-rendered','original-html-rendered'):text=payload
    elif coordinate=='original-xml-entry':text=payload[row['locator']]
    else:raise ValueError('Unsupported coordinate: '+coordinate)
    if text_hash(text)!=row['block_text_sha256']:raise StaleInput('Block text changed')
    if not 0<=row['start']<=row['end']<=len(text):raise ValueError('Span outside reconstructed text')
    witness=text[row['start']:row['end']]
    if text_hash(witness)!=row['span_sha256']:raise StaleInput('Span text changed')
    return witness
