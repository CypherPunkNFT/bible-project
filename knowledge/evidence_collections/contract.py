"""Extend the shared research citation contract; no publication or vector writes."""
import hashlib
import json
from pathlib import Path

from jsonschema import Draft202012Validator

from ..research_foundation.contract import content_fingerprint, fingerprint, validate_citation

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1]


def schema():
    result = json.loads((HERE / 'collection.schema.json').read_text('utf-8'))
    citation = json.loads((SITE / 'content/research/citation.schema.json').read_text('utf-8'))
    def local_refs(value):
        if isinstance(value, dict):
            return {k: '#/$defs/citation/' + v[2:] if k == '$ref' and v.startswith('#/') else local_refs(v) for k,v in value.items()}
        if isinstance(value, list): return [local_refs(v) for v in value]
        return value
    result['$defs']['citation'] = local_refs(citation)
    return result


def item_fingerprint(item):
    return fingerprint({k:v for k,v in item.items() if k != 'reviewFingerprint'})


def seal(collection):
    for item in collection['evidence']:
        item['citation']['review']['contentFingerprint'] = content_fingerprint(item['citation'])
        item['reviewFingerprint'] = item_fingerprint(item)
    collection['integrity'] = fingerprint({k:v for k,v in collection.items() if k != 'integrity'})
    return collection


def validate(collection):
    Draft202012Validator(schema()).validate(collection)
    ids = set()
    for item in collection['evidence']:
        if item['id'] in ids: raise ValueError('Duplicate evidence item')
        ids.add(item['id'])
        c = validate_citation(item['citation']); a = item['anchor']
        if c['publication'] != 'draft': raise ValueError('Collection v1 is private draft only')
        if not a['start'] < a['end']: raise ValueError('Invalid span')
        body=c['private']['fullText']
        if hashlib.sha256(body.encode('utf-8')).hexdigest()!=a['chunkSha256'] or body[a['start']:a['end']]!=c['quote']:
            raise ValueError('Stored quotation/context differs from its anchor')
        for neighbor in c['private']['neighbors']:
            if hashlib.sha256(neighbor['text'].encode('utf-8')).hexdigest()!=neighbor['sha256']:
                raise ValueError('Stored adjacent context differs from its hash')
        if c['editionId'] != item['identity']['editionId']: raise ValueError('Edition identity mismatch')
        if item['attribution']['role'] == 'reported-opposing-position' and item['basis'] != 'reported-position':
            raise ValueError('An opposing position must not become author endorsement')
        if item['reader']['status'] == 'unverified' and item['reader']['route'] is not None:
            raise ValueError('Unverified reader route')
        route = item['reader']['route']
        if route and (not route.startswith('/') or route.startswith('//') or '\\' in route):
            raise ValueError('Reader route must be on-site')
        if item['reader']['status'] == 'verified-on-site' and not route: raise ValueError('Missing reader route')
        if c['review']['contentFingerprint'] != content_fingerprint(c) or item['reviewFingerprint'] != item_fingerprint(item):
            raise ValueError('Evidence changed since review')
    if collection['integrity'] != fingerprint({k:v for k,v in collection.items() if k != 'integrity'}):
        raise ValueError('Collection changed since capture')
    documents = {x['anchor']['documentId'] for x in collection['evidence']}
    works = {x['identity']['workId'] for x in collection['evidence'] if x['identity']['workId']}
    unresolved = {x['anchor']['documentId'] for x in collection['evidence'] if not x['identity']['workId']}
    if [collection['coverage'][k] for k in ('selectedDocuments','knownWorks','unresolvedWorkDocuments')] != [len(documents),len(works),len(unresolved)]:
        raise ValueError('Coverage counts do not match evidence')
    return collection


def public_projection(collection):
    """No v1 collection is a public release; future adapters must review uses."""
    validate(collection)
    return None


def sha256_file(path):
    with Path(path).open('rb') as stream: return hashlib.file_digest(stream, 'sha256').hexdigest()


def implementation_hashes():
    paths = [HERE/'contract.py', HERE/'capture.py', HERE/'collection.schema.json',
             SITE/'knowledge/research_foundation/contract.py', SITE/'content/research/citation.schema.json']
    return {str(p.relative_to(SITE)).replace('\\','/'): sha256_file(p) for p in paths}
