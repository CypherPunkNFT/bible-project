"""Bounded private retrieval; immutable corpus reads and pinned existing vectors."""
import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import time

import numpy as np

from ..encoder import request_vectors
from ..references import parse_reference
from ..research_foundation.contract import fingerprint
from ..retrieval import STOP
from ..settings import load, write_json
from ..store import connect, search_text
from ..vectors import table, validate_identity
from .contract import sha256_file
from .crosswalk import read, verify as verify_crosswalk


def lexical_expression(query):
    terms = list(dict.fromkeys(t for t in re.findall(r'[^\W_]+', search_text(query), re.UNICODE) if t.lower() not in STOP))
    return ' OR '.join('"' + t.replace('"', '""') + '"' for t in terms[:32])


def reference_candidates(chunks, references, catalog, query):
    parsed = parse_reference(query, catalog)
    if not parsed: return []
    book, chapter, first, last_chapter, last = parsed
    start, end = chapter*1000+first, last_chapter*1000+last
    direct = [dict(id=r['id'], referenceKind='verse-annotation-association' if ':note:' in r['locator'] else 'exact-verse-overlap') for r in chunks
              if r['kind']=='bible' and r['edition']=='kjv' and r['book']==book['code']
              and r['chapter']*1000+r['verse_end']>=start and r['chapter']*1000+r['verse_start']<=end]
    doc_ids = sorted({r['document_id'] for r in references if r['edition']=='kjv'
                      and r['start']<=book['num']*1000000+end and r['end']>=book['num']*1000000+start})
    # A document-level recorded link is not a located quotation or exposition.
    for doc in doc_ids:
        row = next((r for r in chunks if r['document_id']==doc), None)
        if row and not any(x['id']==row['id'] for x in direct):
            direct.append(dict(id=row['id'], referenceKind='document-association-only'))
    return direct


def rank(channels, rows, groups, limit=5, per_work=2):
    scores = defaultdict(float); methods = defaultdict(dict)
    for method, candidates in channels.items():
        seen = set()
        for position, candidate in enumerate(candidates, 1):
            key = candidate['id']
            if key in seen or key not in rows: continue
            seen.add(key); scores[key] += 1/(60+position)
            methods[key][method] = dict(rank=position, **{k:v for k,v in candidate.items() if k!='id'})
    ordered = sorted(scores, key=lambda k:(-scores[k], k))
    selected = []; works = defaultdict(int); texts = set()
    for key in ordered:
        row = rows[key]; group = groups.get(row['document_id'], row['document_id'])
        body = fingerprint(' '.join(row['text'].split()))
        if body in texts or works[group]>=per_work: continue
        texts.add(body); works[group]+=1
        selected.append(dict(chunkId=key, documentId=row['document_id'], title=row['title'],
                             text=row['text'], locator=row['locator'], textSha256=hashlib.sha256(row['text'].encode()).hexdigest(),
                             workBucket=group, score=scores[key], channels=methods[key]))
        if len(selected)==limit: break
    return selected


def prepare(config, crosswalk_path, output):
    output=Path(output); output.mkdir(parents=True, exist_ok=True)
    crosswalk=read(crosswalk_path)
    check=verify_crosswalk(config,crosswalk)
    if not check['valid']: raise ValueError('Stale crosswalk: '+str(check['reasons']))
    questions=read(output/'questions.frozen.json')
    doc_ids=['library:text:'+n['sha256'] for n in crosswalk['nodes']]+questions['scope']['extraDocumentIds']
    if len(set(doc_ids))!=len(doc_ids) or len(doc_ids)>20: raise ValueError('Select at most 20 distinct documents')
    db=connect(config['db'],readonly=True)
    try:
        db.execute('BEGIN')
        build=db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        marks=','.join('?' for _ in doc_ids)
        chunks=[dict(r) for r in db.execute(f'SELECT * FROM chunks WHERE document_id IN ({marks}) ORDER BY rowid LIMIT 5001',doc_ids)]
        if not chunks or len(chunks)>5000: raise ValueError('Scope must contain 1–5000 chunks')
        if {r['document_id'] for r in chunks}!=set(doc_ids): raise ValueError('A selected document has no chunks')
        references=[dict(r) for r in db.execute(f'SELECT * FROM references_to WHERE document_id IN ({marks})',doc_ids)]
        catalog=json.loads(db.execute("SELECT value FROM meta WHERE key='catalog'").fetchone()[0])
    finally: db.close()
    groups={}
    node_docs={n['key']:'library:text:'+n['sha256'] for n in crosswalk['nodes']}
    for group in crosswalk['duplicates']['workGroups']:
        for node in group['members']: groups[node_docs[node]]=group['key']
    validate_identity(config)
    vectors=table(config)
    if vectors is None: raise ValueError('Existing vector table absent')
    version=vectors.version; vectors.checkout(version)
    ids=[r['id'] for r in chunks]
    if not all(re.fullmatch('[a-f0-9]{64}',i) for i in ids): raise ValueError('Unexpected chunk ID')
    expression='id IN ('+','.join("'"+i+"'" for i in ids)+')'
    selected=vectors.search().where(expression).select(['id','vector']).limit(len(ids)+1).to_list()
    if len({r['id'] for r in selected})!=len(selected): raise ValueError('Duplicate selected vector IDs')
    selected.sort(key=lambda r:r['id'])
    matrix=np.asarray([r['vector'] for r in selected],dtype=np.float32)
    if not selected or matrix.shape!=(len(selected),config['embedding']['dimensions']) or not np.isfinite(matrix).all():
        raise ValueError('Invalid selected vector matrix')
    if not np.allclose(np.linalg.norm(matrix,axis=1),1,atol=.02): raise ValueError('Unnormalized source vectors')
    matrix/=np.linalg.norm(matrix,axis=1,keepdims=True)
    np.savez_compressed(output/'selected-vectors.npz',ids=np.asarray([r['id'] for r in selected]),vectors=matrix)
    snapshot=dict(schemaVersion=1,corpusBuild=build,documents=doc_ids,chunks=chunks,references=references,catalog=catalog,workGroups=groups,
                  crosswalkIntegrity=crosswalk['integrity'],crosswalkPath=str(Path(crosswalk_path).resolve()),crosswalkSha256=sha256_file(crosswalk_path),
                  vectorVersion=version,vectorModel={k:config['embedding'][k] for k in ('model','revision','dimensions','max_tokens')},
                  counts=dict(documents=len(doc_ids),chunks=len(chunks),vectors=len(selected),missingVectors=len(ids)-len(selected),recordedReferences=len(references)),
                  missingVectorIds=sorted(set(ids)-{r['id'] for r in selected}))
    write_json(output/'snapshot.json',snapshot)
    write_json(output/'snapshot-manifest.json',dict(snapshotSha256=sha256_file(output/'snapshot.json'),vectorsSha256=sha256_file(output/'selected-vectors.npz'),questionsSha256=sha256_file(output/'questions.frozen.json')))
    print(json.dumps(snapshot['counts']),flush=True)


def load_snapshot(folder):
    folder=Path(folder); manifest=read(folder/'snapshot-manifest.json')
    for file,key in [('snapshot.json','snapshotSha256'),('selected-vectors.npz','vectorsSha256'),('questions.frozen.json','questionsSha256')]:
        if sha256_file(folder/file)!=manifest[key]: raise ValueError('Changed snapshot dependency: '+file)
    return read(folder/'snapshot.json'),manifest


def encode_queries(config, folder):
    folder=Path(folder); snapshot,manifest=load_snapshot(folder)
    validate_identity(config)
    if snapshot['vectorModel']!={k:config['embedding'][k] for k in snapshot['vectorModel']}:
        raise ValueError('Query model differs from selected vectors')
    questions=read(folder/'questions.frozen.json')
    items=questions['development']+questions['heldOut']; rows=[]
    # Reuse the loaded service in small serialized requests; no new encoder or vector writes.
    for offset in range(0,len(items),4):
        batch=items[offset:offset+4]
        vectors=request_vectors(config,[q['query'] for q in batch],'query')
        rows.extend(dict(id=q['id'],query=q['query'],vector=v) for q,v in zip(batch,vectors))
        print(f'Query vectors {len(rows)}/{len(items)}',flush=True)
    write_json(folder/'query-vectors.json',dict(model=snapshot['vectorModel'],questionsSha256=manifest['questionsSha256'],queries=rows))


class Retriever:
    def __init__(self, config, folder):
        self.config=config; self.folder=Path(folder)
        self.snapshot,self.manifest=load_snapshot(folder)
        self.rows={r['id']:r for r in self.snapshot['chunks']}
        saved=np.load(self.folder/'selected-vectors.npz',allow_pickle=False)
        self.vector_ids=saved['ids'].tolist(); self.matrix=saved['vectors']; saved.close()
        self.queries=read(self.folder/'query-vectors.json')
        if self.queries['model']!=self.snapshot['vectorModel'] or self.queries['questionsSha256']!=self.manifest['questionsSha256']:
            raise ValueError('Query vector inputs differ')
        self.context={}; by_doc=defaultdict(list)
        for row in self.snapshot['chunks']: by_doc[row['document_id']].append(row)
        for rows in by_doc.values():
            for i,row in enumerate(rows): self.context[row['id']]=[r for r in rows[max(0,i-1):i+2] if r['id']!=row['id']]
        # Reuse existing extracted/search-normalized corpus fields, without a
        # second persistent library index or costly global term-frequency scans.
        self.fts=sqlite3.connect(':memory:')
        self.fts.execute("CREATE VIRTUAL TABLE selected_fts USING fts5(id UNINDEXED,title,search_text,tokenize='unicode61 remove_diacritics 2')")
        self.fts.executemany('INSERT INTO selected_fts VALUES(?,?,?)',
                            [(r['id'],r['title'],r.get('search_text',search_text(r['text']))) for r in self.snapshot['chunks']])

    def close(self):
        self.fts.close()

    def search(self, query, mode='hybrid'):
        if mode not in ('lexical','hybrid') or not isinstance(query,str) or not 1<=len(query.strip())<=500:
            raise ValueError('Invalid query or retrieval mode')
        start=time.monotonic(); db=connect(self.config['db'],readonly=True)
        try:
            db.execute('BEGIN')
            current=db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
            if current!=self.snapshot['corpusBuild']: raise ValueError('Corpus build changed since bounded snapshot')
        finally: db.close()
        match=lexical_expression(query)
        lexical=[dict(id=r[0],bm25=r[1]) for r in self.fts.execute(
            'SELECT id,bm25(selected_fts,0,3,1) AS score FROM selected_fts WHERE selected_fts MATCH ? ORDER BY score,id LIMIT 40',
            (match,))] if match else []
        channels={'lexical':lexical}
        if mode=='hybrid':
            encoded=next((r for r in self.queries['queries'] if r['query']==query),None)
            if not encoded: raise ValueError('Query not in frozen encoded set; explicitly prepare it before retrieval')
            vector=np.asarray(encoded['vector'],dtype=np.float32)
            if vector.shape!=(self.matrix.shape[1],) or not np.isfinite(vector).all() or not np.isclose(np.linalg.norm(vector),1,atol=.02):
                raise ValueError('Invalid query embedding')
            similarity=self.matrix@(vector/np.linalg.norm(vector))
            indices=sorted(range(len(similarity)),key=lambda i:(-float(similarity[i]),self.vector_ids[i]))[:40]
            channels['semantic']=[dict(id=self.vector_ids[i],cosine=float(similarity[i])) for i in indices]
            channels['reference']=reference_candidates(self.snapshot['chunks'],self.snapshot['references'],self.snapshot['catalog'],query)[:40]
        results=rank(channels,self.rows,self.snapshot['workGroups'])
        for row in results:
            row['context']=[dict(chunkId=r['id'],documentId=r['document_id'],locator=r['locator'],text=r['text']) for r in self.context[row['chunkId']]]
            row['reviewStatus']='candidate-not-reviewed'; row['publication']='private'
        return dict(query=query,mode=mode,results=results,channelCounts={k:len(v) for k,v in channels.items()},seconds=round(time.monotonic()-start,4))


def run(config, folder, split):
    folder=Path(folder); engine=Retriever(config,folder); questions=read(folder/'questions.frozen.json')
    rows=[]
    for question in questions[split]:
        lexical=engine.search(question['query'],'lexical');hybrid=engine.search(question['query'],'hybrid')
        rows.append(dict(id=question['id'],query=question['query'],rubric=question.get('rubric'),lexical=lexical,hybrid=hybrid))
        print(question['id']+' complete',flush=True)
    result=dict(schemaVersion=1,split=split,questionsSha256=engine.manifest['questionsSha256'],snapshotManifest=engine.manifest,
                queryVectorsSha256=sha256_file(folder/'query-vectors.json'),implementationSha256=sha256_file(__file__),
                corpusBuild=engine.snapshot['corpusBuild'],vectorVersion=engine.snapshot['vectorVersion'],results=rows,publication='private')
    result['lexicalScope']='Temporary in-memory FTS5 over existing selected corpus search_text; bounded BM25 statistics.'
    write_json(folder/(split+'-results.json'),result)
    engine.close()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=('prepare','encode','development','heldOut'))
    parser.add_argument('--folder',type=Path,required=True);parser.add_argument('--crosswalk',type=Path)
    args=parser.parse_args();config=load()
    if not args.folder.resolve().is_relative_to((config['state_dir']/'library-knowledge').resolve()):
        parser.error('Outputs must stay under private KnowledgeBase/library-knowledge')
    if args.action=='prepare':
        if not args.crosswalk:parser.error('--crosswalk required')
        prepare(config,args.crosswalk,args.folder)
    elif args.action=='encode':encode_queries(config,args.folder)
    else:run(config,args.folder,args.action)


if __name__=='__main__':main()
