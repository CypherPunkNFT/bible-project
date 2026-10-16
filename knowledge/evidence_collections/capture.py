"""Bounded source-backed capture, without opening LanceDB or importing an encoder."""
import json
from pathlib import Path

from ..research_foundation.contract import fingerprint, permissions
from ..store import connect, digest
from .contract import implementation_hashes, seal, sha256_file, validate


def capture(config, spec):
    if not 1 <= len(spec['items']) <= 50: raise ValueError('Select 1–50 explicit source spans')
    db = connect(config['db'], readonly=True)
    try:
        db.execute('BEGIN')
        build = db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        if build != spec['corpusBuild']: raise ValueError('Selected corpus build changed')
        evidence = []; catalogues = []
        for choice in spec['items']:
            row = db.execute('SELECT c.*,d.source,d.licence,d.metadata FROM chunks c JOIN documents d ON d.id=c.document_id WHERE c.id=?', (choice['chunkId'],)).fetchone()
            if row is None: raise ValueError('Selected chunk is absent')
            if digest(row['text']) != choice['expectedChunkSha256']: raise ValueError('Selected chunk changed')
            start,end = choice['start'],choice['end']
            if type(start) is not int or type(end) is not int or not 0 <= start < end <= len(row['text']): raise ValueError('Span outside source chunk')
            meta = json.loads(row['metadata']); acquisition = meta.get('acquisition',{})
            original = meta.get('original_sha256')
            if not original or sha256_file(row['source']) != original: raise ValueError('Original source bytes changed or unrecorded')
            work,edition,asset = (meta.get(k) or {} for k in ('work','edition','asset'))
            for kind,record in (('work',work),('edition',edition),('asset',asset)):
                if record.get('id'):
                    registered = db.execute('SELECT kind FROM library_records WHERE id=?',(record['id'],)).fetchone()
                    if not registered or registered[0] != kind: raise ValueError('Unregistered canonical identity')
            identity = dict(workId=work.get('id'),editionId=edition.get('id'),assetId=asset.get('id'),
                            sourceCollection=asset.get('sourceId'),sourceItem=acquisition.get('sourceId'))
            catalogues.append(identity)
            creators = work.get('creators',[])
            author = next((x.get('authorId') for x in creators if x.get('role')=='author'),None)
            attribution = dict(authorLabel=acquisition.get('author') or 'Unresolved author',authorId=author,
                speakerLabel=choice['speakerLabel'],speakerId=author if choice['role']=='author-statement' else None,
                role=choice['role'],evidence=choice['attributionEvidence'],translator=acquisition.get('translator'),editor=acquisition.get('editor'))
            neighbors = []
            for comparison,order in (('<','DESC'),('>','ASC')):
                neighbor = db.execute(f'SELECT id,text,locator FROM chunks WHERE document_id=? AND rowid{comparison}? ORDER BY rowid {order} LIMIT 1',(row['document_id'],row['rowid'])).fetchone()
                if neighbor: neighbors.append(dict(neighbor)|{'sha256':digest(neighbor['text'])})
            key = fingerprint([row['id'],start,end])
            c = dict(id='citation:'+key,claimId='claim:'+fingerprint([key,choice['claim']]),sourceId=asset.get('id') or row['document_id'],
                editionId=edition.get('id'),locator=row['locator'],quote=row['text'][start:end],
                sourceUrl=acquisition.get('url') or acquisition.get('canonicalUrl'),sourceRole='Held edition; bounded private evidence',
                claimKind='theological-interpretation',claim=choice['claim'],alternatives=[],
                review=dict(kind='ai-assisted',state='reviewed-limited',scope=choice['reviewScope'],literalMatch=True,contentFingerprint=None),
                limits=choice['limits'],dates=dict(objectOrWork=None,discovery=None,editionPublication=None,retrieval=None,review=spec['reviewDate']),
                permissions=permissions(),private=dict(title=row['title'],sourcePath=row['source'],sourceSha256=original,
                    extractedSha256=meta.get('text_sha256'),licence=row['licence'],credit=acquisition.get('credit'),
                    fullText=row['text'],neighbors=neighbors),publication='draft')
            item = dict(id='evidence:'+key,basis=choice['basis'],citation=c,
                anchor=dict(documentId=row['document_id'],chunkId=row['id'],chunkSha256=digest(row['text']),metadataSha256=digest(row['metadata']),
                    start=start,end=end,offsetUnit='unicode-code-points',locatorKind='corpus-transcription-segment'),
                identity=identity,attribution=attribution,reader=dict(status='unverified',route=None),
                permissions={k:{'decision':'unknown','evidence':[]} for k in ('translation','editorial')},reviewFingerprint='')
            evidence.append(item)
        result = {k:spec[k] for k in ('id','title','question','language','audience','scope','topicIds')}
        result.update(schemaVersion=1,inputs=dict(corpusBuild=build,catalogueFingerprint=fingerprint(catalogues),
            method='explicit-chunk-selection-v1',vectorModel=None,graphRun=None,implementationHashes=implementation_hashes()),
            evidence=evidence,coverage=dict(selectedDocuments=len({x['anchor']['documentId'] for x in evidence}),
                knownWorks=len({x['identity']['workId'] for x in evidence if x['identity']['workId']}),
                unresolvedWorkDocuments=len({x['anchor']['documentId'] for x in evidence if not x['identity']['workId']}),
                limits=['Explicitly selected examples; not an exhaustive topic search.','Current partial corpus; later acquisitions are outside this capture.']),publication='draft')
        return validate(seal(result))
    finally: db.close()


def verify(config, collection):
    validate(collection)
    stale=[]; db=connect(config['db'],readonly=True)
    try:
        db.execute('BEGIN')
        build=db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        if build!=collection['inputs']['corpusBuild']: stale.append('corpus build changed; explicit revalidation required')
        if collection['inputs']['implementationHashes']!=implementation_hashes(): stale.append('implementation/schema changed')
        for item in collection['evidence']:
            a=item['anchor'];c=item['citation']
            row=db.execute('SELECT c.text,c.document_id,c.locator,d.source,d.metadata FROM chunks c JOIN documents d ON d.id=c.document_id WHERE c.id=?',(a['chunkId'],)).fetchone()
            if row is None:
                stale.append(item['id']+': chunk absent');continue
            if row['document_id']!=a['documentId'] or row['locator']!=c['locator'] or digest(row['text'])!=a['chunkSha256'] or row['text'][a['start']:a['end']]!=c['quote']:
                stale.append(item['id']+': source span changed')
            if digest(row['metadata'])!=a['metadataSha256']: stale.append(item['id']+': metadata changed')
            metadata=json.loads(row['metadata'])
            for kind in ('work','edition','asset'):
                if item['identity'][kind+'Id']!=(metadata.get(kind) or {}).get('id'):
                    stale.append(item['id']+': canonical '+kind+' identity differs')
            if row['source']!=c['private']['sourcePath']: stale.append(item['id']+': source path changed')
            path=Path(row['source'])
            if not path.is_file() or sha256_file(path)!=c['private']['sourceSha256']: stale.append(item['id']+': original bytes absent/changed')
            for neighbor in c['private']['neighbors']:
                other=db.execute('SELECT document_id,text,locator FROM chunks WHERE id=?',(neighbor['id'],)).fetchone()
                if not other or other['document_id']!=a['documentId'] or digest(other['text'])!=neighbor['sha256'] or other['locator']!=neighbor['locator']:
                    stale.append(item['id']+': context changed')
        return {'valid':not stale,'staleReasons':stale,'evidenceItems':len(collection['evidence']),
                'corpusModified':False,'vectorsModified':False,'publicExported':False}
    finally:db.close()
