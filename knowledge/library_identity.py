"""Canonical, original-hash-bound identity fills shared by reader and intake owners."""
import json
import re
from pathlib import Path

IDENTITY_FILE='content/library/identity-corrections.json'
CONTRIBUTOR_FILE='content/teachers/contributor-identities.json'


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def load_identities(site,canonical=None):
    site=Path(site);path=site/IDENTITY_FILE
    if not path.is_file():return {}
    value=read(path)
    if value.get('schemaVersion')!=1:raise ValueError('Unsupported identity correction schema')
    result={}
    def record(kind,ident):
        if not isinstance(ident,str) or not re.fullmatch(r'[A-Za-z0-9_-]+',ident):raise ValueError('Invalid canonical ID')
        r=canonical.get(ident) if canonical is not None else read(site/f'content/library/catalog/{kind}s/{ident}.json')
        if not r or r.get('id')!=ident or r.get('kind')!=kind:raise ValueError('Unregistered canonical identity: '+ident)
        return r
    for row in value['records']:
        sha=row['sha256'];fields=row['fields']
        if not re.fullmatch('[0-9a-f]{64}',sha) or sha in result:raise ValueError('Invalid/duplicate identity hash')
        if set(fields)-{'workId','editionId'} or not fields.get('workId'):raise ValueError('Identity fill cannot change other metadata')
        work=record('work',fields['workId'])
        if fields.get('editionId') and record('edition',fields['editionId']).get('workId')!=work['id']:
            raise ValueError('Broken edition/work binding')
        result[sha]=row
    return result


def fill_identity(value,corrections,sha=None):
    row=corrections.get(sha or value.get('sha256'))
    if not row:return value
    out=dict(value)
    for field,new in row['fields'].items():
        if out.get(field) not in (None,'',new):raise ValueError('Identity fill conflicts with '+field)
        out[field]=new
    return out


def apply_hints(hints,records,corrections,provenance,conflicts=None):
    """Intake still checks actual original bytes before constructing corpus metadata."""
    for path,hint in hints.items():
        asset=hint.get('catalog',{});sha=asset.get('sha256') or hint.get('sha256') or hint.get('sourceSha256')
        if sha not in corrections:continue
        edition=records.get(asset.get('editionId'),{})
        existing=dict(hint)
        if edition.get('kind')=='edition':existing['editionId']=asset['editionId']
        if edition.get('workId'):existing['workId']=edition['workId']
        try:filled=fill_identity(existing,corrections,sha)
        except ValueError as error:
            if conflicts is None:raise
            # A later source reconciliation can already supply a more specific
            # canonical identity. Fill-only proposals never overwrite it or hold text.
            conflict={'path':path,'sha256':sha,'reason':str(error),
                'sourceIdentities':{k:existing.get(k) for k in ('workId','editionId')},
                'proposedFill':dict(corrections[sha]['fields']),
                'disposition':'existing source identity retained; backfill deferred; text intake allowed'}
            conflicts.append(conflict);hint['identityFillConflict']=conflict
            continue
        hint.update({k:filled[k] for k in corrections[sha]['fields']})
        hint.setdefault('manifests',set()).add(str(provenance))


def load_contributors(site):
    path=Path(site)/CONTRIBUTOR_FILE
    if not path.exists():return {}
    value=read(path)
    if value.get('schemaVersion')!=1:raise ValueError('Unsupported contributor correction schema')
    result={}
    for row in value['records']:
        ident=row['id'];authority=Path(site)/row['authority']
        if not authority.resolve().is_relative_to((Path(site)/'content/library').resolve()):raise ValueError('Authority outside library')
        matches=[r for r in read(authority).get('authors',[]) if r.get('id')==ident]
        if len(matches)!=1 or matches[0]!=row['sourceRecord']:raise ValueError('Contributor authority changed: '+ident)
        if ident in result:raise ValueError('Duplicate contributor identity')
        result[ident]=matches[0]
    return result
