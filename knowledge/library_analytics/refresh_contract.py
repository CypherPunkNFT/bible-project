"""Private refresh v1: content objects, dependency closure and candidate selection."""
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import zlib
from .inputs import digest, packed
from .jobs import StaleInput

VERSION='cpu-selective-refresh-v1'
STAGES=('sections','alignment','concepts','relationships')
SCHEMA='''
CREATE TABLE IF NOT EXISTS refresh_runs(id TEXT PRIMARY KEY,parent TEXT,input_hash TEXT,mode TEXT,state TEXT,contract_json TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS refresh_scope(run_id TEXT,document_id TEXT,delta TEXT,descriptor_json TEXT,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS objects(id TEXT PRIMARY KEY,stage TEXT,fingerprint TEXT,payload BLOB,rows INTEGER,bytes INTEGER);
CREATE TABLE IF NOT EXISTS computations(stage TEXT,fingerprint TEXT,object_id TEXT,PRIMARY KEY(stage,fingerprint));
CREATE TABLE IF NOT EXISTS membership(run_id TEXT,document_id TEXT,stage TEXT,object_id TEXT,fingerprint TEXT,action TEXT,seconds REAL,PRIMARY KEY(run_id,document_id,stage));
CREATE TABLE IF NOT EXISTS reverse_dependencies(run_id TEXT,document_id TEXT,stage TEXT,kind TEXT,key TEXT,fingerprint TEXT,PRIMARY KEY(run_id,document_id,stage,kind,key));
CREATE INDEX IF NOT EXISTS refresh_reverse ON reverse_dependencies(kind,key,run_id,stage,document_id);
CREATE TABLE IF NOT EXISTS tombstones(run_id TEXT,document_id TEXT,parent TEXT,reason TEXT,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS population_products(run_id TEXT PRIMARY KEY,fingerprint TEXT,object_id TEXT,seconds REAL);
'''

def stable_id(value):return int(digest(value)[:15],16)+1

def encode(value):
    raw=packed(value).encode('utf-8')
    return hashlib.sha256(raw).hexdigest(),zlib.compress(raw,6),len(raw)

def decode(row):
    raw=zlib.decompress(row['payload'])
    if hashlib.sha256(raw).hexdigest()!=row['id']:raise StaleInput('Corrupt content object '+row['id'])
    return json.loads(raw)

def delta(old,new):
    if old is None:return 'added'
    if new is None:return 'removed'
    if old['sources']!=new['sources']:
        old_hashes=sorted(p['sha256'] for p in old['sources']);new_hashes=sorted(p['sha256'] for p in new['sources'])
        return 'moved' if old_hashes==new_hashes else 'text-changed'
    if old['descriptor']!=new['descriptor']:return 'metadata-only'
    return 'unchanged'

def section_metadata(d):
    # Exactly fields consumed by document/xml_asset/SectionWriter, without LA
    # job timestamps or metadata_sha256 (which includes unrelated fields).
    keys=('document_id','title','genre','memberships','author_label','readers','source_family','language',
          'work_id','work_verified','edition_id','edition_verified','cache_path','cache_expected_sha256',
          'source_path','original_sha256')
    value={k:d.get(k) for k in keys}
    if d.get('xml_link'):
        value['xml_link']={k:d['xml_link'].get(k) for k in ('asset_path','asset_sha256','entry_key','evidence_json','locators_json')}
    else:value['body_stream_sha256']=d.get('quality',{}).get('body_stream_sha256')
    return value

def fingerprints(item,config,parents):
    d=item['descriptor'];code=config['code']
    source=sorted((x['path'],x['sha256']) for x in item['sources'])
    computations={
      'sections':digest({'version':VERSION,'code':code['sections'],'source':source,'fields':section_metadata(d)}),
      'alignment':digest({'version':VERSION,'code':code['alignment'],'sections':parents.get('sections'),
                          'corpus':item['corpus'],'corpus_build':config['corpus_build'],'readers':item['readers'],'reader_code':config['reader_code']}),
      'concepts':digest({'version':VERSION,'code':code['concepts'],'sections':parents.get('sections'),
                         'language':d.get('language'),'rules':config['rules'],'parser':config['parser'],'window':config['window_codepoints']}),
      'relationships':digest({'version':VERSION,'code':code['relationships'],'concepts':parents.get('concepts'),
                              'group':independence(d),'config':config['relationships']})}
    return {stage:digest({'computation':fp,'runtime':config['runtime']}) for stage,fp in computations.items()}

def independence(d):
    return (d.get('work_id') if d.get('work_verified') else None) or d.get('original_sha256') or d.get('xml_link',{}).get('asset_sha256') or d['document_id']

def atomic_json(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_name(path.name+'.'+str(os.getpid())+'.tmp')
    with temp.open('w',encoding='utf-8',newline='\n') as f:
        json.dump(value,f,ensure_ascii=False,sort_keys=True,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
    os.replace(temp,path)

def hash_file(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()

def verify_export(folder):
    folder=Path(folder);manifest=json.loads((folder/'manifest.json').read_text('utf-8'))
    for p in manifest['files']:
        path=folder/p['path']
        if Path(p['path']).is_absolute() or '..' in Path(p['path']).parts:raise StaleInput('Unsafe manifest path')
        if path.stat().st_size!=p['bytes'] or hash_file(path)!=p['sha256']:raise StaleInput('Export mismatch '+str(path))
    if not manifest['evaluation']['ok']:raise ValueError('Evaluation failed; retain last good')
    return manifest

def select_candidate(root,release,expected=None):
    """Caller must hold global/local leases. One atomic pointer is the authority.

    Previous selection is recorded in the new pointer, avoiding a split update
    of current and last-good pointers. Rollback uses the same verified CAS path.
    """
    root=Path(root).resolve();release=Path(release).resolve()
    if not release.is_relative_to(root/'releases'):raise ValueError('Candidate outside owned refresh root')
    manifest=verify_export(release)
    validate_candidate_inputs(manifest)
    pointer=root/'candidate.json';old=json.loads(pointer.read_text('utf-8')) if pointer.exists() else None
    if expected is not None and digest(old)!=expected:raise StaleInput('Candidate selection changed')
    value={'run_id':manifest['run_id'],'release':str(release),'manifest_sha256':hash_file(release/'manifest.json'),'previous':old}
    if old and old['run_id']==value['run_id'] and old['manifest_sha256']==value['manifest_sha256']:return old
    atomic_json(pointer,value);return value

def rollback_candidate(root):
    root=Path(root);old=json.loads((root/'candidate.json').read_text('utf-8'))
    previous=old.get('previous')
    if not previous:raise ValueError('No preceding candidate')
    folder=Path(previous['release']).resolve()
    if not folder.is_relative_to(root.resolve()/'releases'):raise ValueError('Previous candidate outside owned root')
    validate_candidate_inputs(verify_export(folder))
    if hash_file(Path(previous['release'])/'manifest.json')!=previous['manifest_sha256']:raise StaleInput('Previous candidate changed')
    atomic_json(root/'candidate.json',previous);return previous

def validate_candidate_inputs(manifest):
    capture=manifest.get('input_capture')
    if capture:
        if hash_file(capture['path'])!=capture['sha256']:raise StaleInput('Candidate input capture changed')
        from .refresh import read_batch,validate_batch
        batch,identity=read_batch(capture['path'])
        if identity!=manifest['batch_sha256']:raise StaleInput('Candidate input identity mismatch')
        validate_batch(batch)
