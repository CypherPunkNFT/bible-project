"""Independent source-witness verification for a selected LA-02 generation.

Checks locations and hashes, not whether every lexical match is a meaningful
Biblical citation. Works read-only alongside the producer; output is a receipt.
"""
import argparse
import hashlib
import json
import re
from collections import OrderedDict
from pathlib import Path
from xml.etree import ElementTree
from .build import DEFAULT_OUT,readonly,dump,now


def resolve_local_path(root,path):
    parts = [re.fullmatch(r'([^\[]+)\[(\d+)\]',p) for p in path.strip('/').split('/')]
    if not parts or any(p is None for p in parts): raise ValueError('Unsupported original XML locator')
    local = lambda node:node.tag.rsplit('}',1)[-1]
    if local(root)!=parts[0][1] or parts[0][2]!='1': raise ValueError('XML root locator mismatch')
    node = root
    for part in parts[1:]:
        children = [child for child in node if isinstance(child.tag,str) and local(child)==part[1]]
        node = children[int(part[2])-1]
    return node


def verify(root,run,samples=200):
    db = readonly(root/'pipeline.sqlite3')
    file_cache = OrderedDict()
    def text(span):
        if span['coordinate']=='corpus-chunk':
            corpus = readonly(Path(span['path']))
            try:
                row = corpus.execute('SELECT text FROM chunks WHERE id=?',(span['chunk_id'],)).fetchone()
                if not row: raise ValueError('Source chunk missing')
                return row[0]
            finally: corpus.close()
        key = (span['path'],span['block_ordinal'])
        if key in file_cache:
            value = file_cache.pop(key);file_cache[key]=value
            return value
        with Path(span['path']).open(encoding='utf-8-sig') as f:
            for ordinal,line in enumerate(f):
                if ordinal==span['block_ordinal']:
                    value = json.loads(line)['text'];break
            else: raise ValueError('Source cache block missing')
        file_cache[key]=value
        # One large block is permitted; never retain a sample's entire library.
        while len(file_cache)>1 and sum(len(t) for t in file_cache.values())>8*1024*1024:
            file_cache.popitem(last=False)
        return value
    errors = []
    checked = segments = 0
    # Select documents before reading witnesses: sorting millions of evidence
    # rows just to obtain a small sample causes needless disk competition.
    # Round-robin strata preserve source/language/adapter variation; this is
    # deliberately not a random precision estimate.
    strata = {}
    for row in db.execute('''SELECT c.job_id,c.document_id,c.language,s.descriptor_json
        FROM reference_coverage c JOIN run_jobs r ON r.job_id=c.job_id
        JOIN text_scope s ON s.run_id=r.run_id AND s.document_id=c.document_id
        WHERE r.run_id=? AND c.accepted>0 ORDER BY c.document_id''',(run,)):
        d = json.loads(row['descriptor_json'])
        key = (row['language'], d['source_family'], d['body_adapter'])
        bucket = strata.setdefault(key, [])
        if len(bucket)<samples: bucket.append(dict(row))
    selected = []
    for offset in range(samples):
        for key in sorted(strata):
            if offset<len(strata[key]): selected.append(strata[key][offset])
            if len(selected)>=samples: break
        if len(selected)>=samples: break
    sample_dimensions = {}
    sample_kinds = {}
    for document in selected:
        # At most three reads per selected job, retaining chapter/index kinds.
        rows = []
        for kind in ('verse','chapter','printed_index_entry'):
            row = db.execute('SELECT id,reference_kind,evidence_json FROM literal_references WHERE job_id=? AND document_id=? AND reference_kind=? LIMIT 1',
                             (document['job_id'],document['document_id'],kind)).fetchone()
            if row: rows.append(row)
        if not rows:
            row = db.execute('SELECT id,reference_kind,evidence_json FROM literal_references WHERE job_id=? AND document_id=? LIMIT 1',
                             (document['job_id'],document['document_id'])).fetchone()
            if row: rows.append(row)
        d = json.loads(document['descriptor_json'])
        key = '|'.join((document['language'],d['source_family'],d['body_adapter']))
        sample_dimensions[key] = sample_dimensions.get(key,0)+len(rows)
        for row in rows:
            checked += 1
            sample_kinds[row['reference_kind']] = sample_kinds.get(row['reference_kind'],0)+1
            try:
                for span in json.loads(row['evidence_json'])['segments']:
                    value = text(span)
                    if hashlib.sha256(value.encode('utf-8')).hexdigest()!=span['text_sha256']: raise ValueError('Source text hash changed')
                    if not 0<=span['start']<span['end']<=len(value): raise ValueError('Span outside source text')
                    if value[span['start']:span['end']]!=span['literal']: raise ValueError('Literal/offset mismatch')
                    segments += 1
            except Exception as exc: errors.append({'reference_id':row['id'],'error':str(exc)})
    xml_checked = 0
    for row in db.execute("SELECT s.document_id,s.evidence_json FROM document_sections s JOIN run_jobs r ON r.job_id=s.job_id WHERE r.run_id=? AND s.kind LIKE 'xml-%' ORDER BY s.rowid LIMIT 20",(run,)):
        try:
            value = json.loads(row['evidence_json'])
            raw = Path(value['source_path']).read_bytes()
            if hashlib.sha256(raw).hexdigest()!=value['source_sha256']: raise ValueError('Original XML hash changed')
            node = resolve_local_path(ElementTree.fromstring(raw),value['locator'])
            ident = node.get('{http://www.w3.org/XML/1998/namespace}id') or node.get('id')
            if value.get('xml_id') and ident!=value['xml_id']: raise ValueError('Original XML ID mismatch')
            xml_checked += 1
        except Exception as exc: errors.append({'document_id':row['document_id'],'error':str(exc)})
    state = db.execute('SELECT state FROM text_runs WHERE id=?',(run,)).fetchone()[0]
    db.close()
    result = {'run_id':run,'checked_at':now(),'run_state_at_check':state,'reference_samples':checked,
              'source_segments_verified':segments,'original_xml_locators_verified':xml_checked,'errors':errors,
              'sampled_documents':len(selected),'sample_strata':sample_dimensions,'reference_kinds':sample_kinds,
              'ok':not errors and checked>0,'limits':'Source/language/adapter-stratified coordinate/hash sample, not corpus-wide precision or completed processing.'}
    folder=root/'text-validations';folder.mkdir(exist_ok=True)
    dump(folder/(run+'-witnesses.json'),result)
    return result


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=DEFAULT_OUT/'pipeline')
    parser.add_argument('--run',required=True)
    parser.add_argument('--samples',type=int,default=200)
    args=parser.parse_args()
    if not args.root.resolve().is_relative_to(DEFAULT_OUT.resolve()): parser.error('Unexpected runtime directory')
    result=verify(args.root,args.run,args.samples)
    print(json.dumps(result,ensure_ascii=True))
    raise SystemExit(0 if result['ok'] else 2)
