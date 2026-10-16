"""Verify shared XML assets and reconstruct entry links with the original adapters."""
import hashlib
import json
from pathlib import Path
from knowledge.reference_library import xml_root,xml_prose,lexical_text,local_name
from .build import readonly
from .jobs import StaleInput
from .inputs import packed

VERSION='la03-xml-entry-bridge-v1'


def paths(root):
    result={}
    def walk(node,path):
        result[node]=path;counts={}
        for child in node:
            if not isinstance(child.tag,str):continue
            name=local_name(child.tag);counts[name]=counts.get(name,0)+1
            walk(child,path+'/'+name+'['+str(counts[name])+']')
    walk(root,'/'+local_name(root.tag)+'[1]')
    return result


def entries(path):
    root=xml_root(path);p=paths(root.getroot());name=Path(path).name
    if name in ('hitchcock-bible-names.xml','smith-bibledict.xml'):
        for i,node in enumerate(root.xpath('//*[local-name()="term"]')):
            definition=node.getnext()
            if definition is None or local_name(definition.tag)!='def':raise ValueError('Unpaired source dictionary term')
            yield node.get('id',str(i)),[p[node],p[definition]],xml_prose(node)+'\n'+xml_prose(definition)
    else:
        tag='w' if name=='AugIndex.xml' else 'POS' if name.endswith('PartsOfSpeech.xml') else 'entry'
        query='//*[local-name()="div" and @type="entry"]' if name=='StrongHebrewG.xml' else '//*[local-name()="'+tag+'"]'
        if name not in ('StrongHebrewG.xml','strongsgreek.xml','BrownDriverBriggs.xml','HebrewStrong.xml','LexicalIndex.xml','AugIndex.xml','BDBPartsOfSpeech.xml','PartsOfSpeech.xml'):
            return
        for i,node in enumerate(root.xpath(query)):
            key=node.get('id',node.get('strongs',node.get('n',node.get('aug',str(i)))))
            yield key+':'+str(i),[p[node]],lexical_text(node)


def stripped_digest(value):return hashlib.sha256(''.join(value.split()).encode()).hexdigest()


def bridge(db,project,asset,targets,sha,job):
    path=Path(asset);before=path.stat()
    with path.open('rb') as stream:raw_hash=hashlib.file_digest(stream,'sha256').hexdigest()
    if raw_hash!=sha:raise StaleInput('XML asset changed before entry reconstruction')
    prefix='reference-library:'+path.relative_to(Path(project)/'sources').as_posix()+':'
    wanted={r['document_id']:r for r in targets};found=set();linked=0
    corpus=readonly(Path(project)/'KnowledgeBase/knowledge.sqlite3')
    try:
        for key,locators,body in entries(path):
            doc=prefix+key
            if doc not in wanted:continue
            if doc in found:raise ValueError('Ambiguous XML entry identity')
            found.add(doc)
            texts=[r[0] for r in corpus.execute('SELECT text FROM chunks INDEXED BY chunks_doc WHERE document_id=? ORDER BY rowid',(doc,))]
            expected=stripped_digest(body);actual=stripped_digest(''.join(texts))
            state='verified-source-entry' if texts and expected==actual else 'source-entry-body-mismatch'
            linked+=state=='verified-source-entry'
            db.execute('INSERT OR REPLACE INTO xml_entry_links VALUES(?,?,?,?,?,?,?,?)',
                (job,doc,str(path),sha,key,packed(locators),state,packed({'adapter':VERSION,
                 'source_prose_sha256_without_whitespace':expected,'corpus_prose_sha256_without_whitespace':actual,
                 'basis':'Original importer entry key plus equal non-whitespace codepoint sequence; no page/cache-offset inference'})))
        for doc in wanted.keys()-found:
            db.execute('INSERT OR REPLACE INTO xml_entry_links VALUES(?,?,?,?,?,?,?,?)',
                (job,doc,str(path),sha,None,'[]','entry-key-unresolved',packed({'adapter':VERSION})))
    finally:corpus.close()
    after=path.stat()
    if (before.st_size,before.st_mtime_ns)!=(after.st_size,after.st_mtime_ns):raise StaleInput('XML changed during entry reconstruction')
    db.execute('INSERT OR REPLACE INTO xml_assets VALUES(?,?,?,?,?,?)',(job,str(path),sha,len(targets),linked,VERSION))
    return len(targets)
