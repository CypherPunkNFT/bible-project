"""Offline catalogue/provenance reconciliation; writes only owned metadata outputs."""
import hashlib
import html
import json
import mimetypes
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlsplit

OUT = Path(__file__).resolve().parent
SITE = OUT.parents[4]
ROOT = SITE.parent
RAW = ROOT / 'sources/library'
CATALOG = SITE / 'content/library/catalog'
SNAPSHOT = ROOT / 'KnowledgeBase/campaign-stocktake'
DAY = datetime.now(timezone.utc).date().isoformat()
CONTEXT = ('title', 'author', 'authors', 'authorId', 'authorGroup', 'source', 'sourceId', 'sourceResourceId',
           'workId', 'editionId', 'assetId', 'language', 'audience', 'audiences', 'licence', 'rightsCategory',
           'useScope', 'policyUrl', 'sourcePage', 'landingPage', 'contributor', 'credit', 'textKind', 'kind',
           'dateLabel', 'dateMeaning', 'dateAttributes', 'sourceMetadata', 'originalWorkId', 'translator',
           'translatorCreditEvidence', 'translatorIdentityBasis', 'translationQuality', 'countAsBook',
           'quality', 'reviewClass', 'limitations', 'editor', 'publisher', 'retrievedAt', 'eligibility',
           'configuration', 'subjects', 'recommendationStatus', 'attributionBasis')
GENERIC = re.compile(r'^(?:original|download|document|metadata|index)(?:\.[a-z0-9]+)?$', re.I)
SOURCE_ALIASES = {'tcp':'source-eebo-tcp', 'Text Creation Partnership official public distribution':'source-eebo-tcp', 'ia':'source-internet-archive', 'ccel':'source-ccel',
    'gutenberg':'source-gutenberg', 'chapel':'source-chapel-library', 'piper':'source-desiring-god',
    'desiringgod':'source-desiring-god', 'source-begg':'source-truth-for-life', 'monergism':'source-monergism',
    'source-monergism-library':'source-monergism', 'source-ccel-expansion':'source-ccel',
    'founders':'source-founders', 'foundersjournal':'source-founders', 'aomin':'source-alpha-omega',
    'source-alpha-omega-ministries':'source-alpha-omega'}
COLLECTION_CREDITS = {'source-desiring-god':'Desiring God', 'source-truth-for-life':'Truth For Life',
    'source-monergism':'Monergism', 'source-ccel':'Christian Classics Ethereal Library',
    'source-eebo-tcp':'Text Creation Partnership', 'source-internet-archive':'Internet Archive',
    'source-gutenberg':'Project Gutenberg', 'source-chapel-library':'Chapel Library / Mount Zion Bible Church',
    'source-founders':'Founders Ministries', 'source-alpha-omega':'Alpha and Omega Ministries'}


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.reconcile.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def objects(value, inherited=None, resource_url=None):
    if isinstance(value, dict):
        combined = (inherited or {}) | value
        if value.get('assets') is not None:
            resource_url = value.get('url') or resource_url
        if resource_url:
            combined.setdefault('sourcePage', resource_url)
        yield combined
        context = {key: combined[key] for key in CONTEXT if key in combined}
        for key, item in value.items():
            if key not in ('headers', 'media', 'sourceMetadata', 'sourceTopics', 'scripture'):
                yield from objects(item, context, resource_url)
    elif isinstance(value, list):
        for item in value:
            yield from objects(item, inherited, resource_url)


def path_of(row):
    value = row.get('relativePath') or row.get('path') or row.get('sourceRelativePath')
    if not isinstance(value, str) or not value:
        return None
    path = Path(value)
    if not path.is_absolute():
        path = (ROOT / 'sources' if value.replace('\\', '/').startswith('library/') else SITE) / path
    path = path.resolve()
    return str(path) if path.is_relative_to(RAW.resolve()) else None


def text(value):
    if isinstance(value, str):
        return html.unescape(value).strip()
    if isinstance(value, list):
        return '; '.join(text(x) for x in value if isinstance(x, str) and text(x))
    return ''


def name_key(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower()
    value = re.sub(r'\b\d{4}(?:\s*-\s*\d{0,4})?\b', '', value)
    value = re.sub(r'\b(?:rev|dr)\.?\s+', '', value)
    if ',' in value:
        parts = value.split(',')
        if len(parts) >= 2 and parts[1].strip():
            value = parts[1].strip() + ' ' + parts[0].strip()
    return re.sub(r'[^a-z0-9]+', ' ', value).strip()


def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()[:24]


def useful_title(value):
    return isinstance(value, str) and bool(value.strip()) and not GENERIC.fullmatch(value.strip())


def item_identity(row):
    """Use an actual resource identity, never a provider-level source ID."""
    url = text(row.get('url'))
    archive = re.search(r'archive\.org/(?:download|details|stream)/([^/?#]+)', url)
    if archive:
        return 'ia:' + archive[1]
    source_item = text(row.get('sourceResourceId')) or text(row.get('sourceId'))
    if source_item and not source_item.startswith('source-') and source_item != row.get('source'):
        return 'item:' + source_item
    landing = text(row.get('sourcePage')) or text(row.get('landingPage'))
    if landing and not re.search(r'/(?:authors?/[^/]+(?:/messages|/articles)?|index|ebooks|books|publications)/?$', urlsplit(landing).path):
        return landing
    return url


def genre(row):
    source = row['source']
    kind = text(row.get('textKind')).lower()
    url = text(row.get('sourcePage')) or text(row.get('url'))
    if '/articles/' in url or row.get('kind') == 'articles':
        return 'article'
    if 'derivative' in row.get('classification', ''):
        return 'derivative'
    if source in ('piper', 'source-begg', 'source-truth-for-life', 'rogers', 'source-love-worth-finding', 'source-spurgeon-gems') or 'sermon' in kind or 'transcript' in kind or '/messages/' in url:
        return 'sermon'
    if source in ('aomin', 'kruger') or 'article' in kind or '/articles/' in url:
        return 'article'
    if source == 'source-helloao':
        return 'commentary'
    if 'review' in kind or text(row.get('title')).lower() == 'review':
        return 'article'
    return 'book-or-treatise'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    baseline = {r['path']:r for line in (SNAPSHOT / 'private-catalog.jsonl').open(encoding='utf-8') if (r := json.loads(line)).get('bodyCandidate')}
    current = {p:dict(r) for p,r in baseline.items() if Path(p).is_file()}
    evidence = defaultdict(set)
    seen_scores = defaultdict(dict)
    conflicts, input_errors, excluded, unresolved = [], [], [], []
    referenced = {Path(p) for r in current.values() for p in r.get('manifests', [])}
    reports = SITE / 'content/library/reports'
    primary = set(reports.rglob('*acquisition*manifest*.json'))
    primary |= set(reports.rglob('*record-manifest.json'))
    primary |= {p for p in referenced if p.name.endswith('-results.json') or p.name == 'acquisition-results.json'}
    primary |= set((reports / 'modern-texts').glob('*-results.json'))
    primary |= set((reports / 'ready-text-completion').glob('*-results.json'))
    primary = {p for p in primary if not p.is_relative_to(OUT.parent)}
    known_hashes = {p:r.get('sha256') for p,r in current.items()}
    for file in sorted(primary, key=lambda p: ('results' in p.name, str(p))):
        try:
            data = read(file)
        except (OSError, ValueError) as exc:
            input_errors.append(dict(path=str(file), error=str(exc)))
            continue
        for row in objects(data):
            key = path_of(row)
            checksum = row.get('sha256')
            if not key or not re.fullmatch('[a-f0-9]{64}', str(checksum or '')):
                continue
            p = Path(key)
            if p.name.endswith('provenance.json') or p.suffix.lower() in ('.zip', '.png', '.jpg', '.webp', '.css') or p.name == 'metadata.json' or not p.is_file():
                continue
            if row.get('disposition') == 'excluded-author':
                excluded.append(dict(path=key, source=file.as_posix()))
                continue
            if key not in current:
                current[key] = dict(path=key, bytes=p.stat().st_size, source=row.get('source') or p.relative_to(RAW).parts[0], sha256=checksum, intakeStatus='not_in_snapshot', bodyCandidate=True)
                known_hashes[key] = checksum
            if known_hashes.get(key) and checksum != known_hashes[key]:
                conflicts.append(dict(path=key, field='sha256', heldRecorded=known_hashes[key], otherRecorded=checksum, evidence=str(file)))
                continue
            record = current[key]
            priority = 30 if 'results' in file.name else 20
            for field in CONTEXT + ('url', 'finalUrl', 'mimeType', 'retrievedAt', 'assetId', 'editionId', 'workId'):
                value = row.get(field)
                if value is None or value == '' or value == []:
                    continue
                if field == 'title' and not useful_title(value):
                    continue
                if priority >= seen_scores[key].get(field, 0):
                    record[field] = value
                    seen_scores[key][field] = priority
            evidence[key].add(str(file))
    # Sidecars are source metadata, not additional books. Read only recorded metadata.
    for key, record in current.items():
        p = Path(key)
        candidates = [p.parent / 'provenance.json']
        relative = p.relative_to(RAW)
        if relative.parts[0] == 'bulk' and len(relative.parts) >= 3:
            candidates.append(ROOT / 'sources/bulk-catalogues/provenance' / relative.parts[1] / (p.name + '.json'))
        for sidecar in candidates:
          if sidecar.exists() and p.name != 'provenance.json':
            try:
                side = read(sidecar)
            except (OSError, ValueError):
                continue
            if side.get('sha256') == record.get('sha256'):
                evidence[key].add(str(sidecar))
                for field in CONTEXT + ('url', 'finalUrl', 'mimeType', 'retrievedAt'):
                    if not record.get(field) and side.get(field):
                        record[field] = side[field]
    author_registry = read(SITE / 'content/library/authors.json')['authors']
    for file in (SITE / 'content/library/registry-extensions').glob('*.json'):
        extension = read(file)
        if extension.get('kind') == 'author-registry':
            author_registry.extend(extension['authors'])
    authors = {a['id']:a for a in author_registry}
    name_index = {}
    for a in author_registry:
        for alias in [a['name']] + a.get('aliases', []):
            name_index[name_key(alias)] = a['id']
    # Common fuller names are identities already represented by the registry.
    for alias, aid in [('John Charles Ryle','author-j-c-ryle'), ('Ryle, John Charles','author-j-c-ryle'),
                       ('Charles Haddon Spurgeon','author-charles-spurgeon'), ('Benjamin Breckinridge Warfield','author-b-b-warfield')]:
        name_index[name_key(alias)] = aid
    records, catalog_paths = {}, {}
    assets_by_path = {}
    owned_records = []
    for file in CATALOG.rglob('*.json'):
        value = read(file)
        records[value['id']] = value
        catalog_paths[value['id']] = str(file)
        if value.get('kind') == 'asset':
            path = path_of(value)
            if path:
                assets_by_path[path] = value
        if '-reconciled-' in value['id'] or (value.get('kind') == 'asset' and str(value.get('editionId', '')).startswith('edition-reconciled-')):
            owned_records.append(str(file.resolve()))
    registered_sources = {s['id'] for s in read(SITE / 'content/library/sources.json')['sources']}
    required_registries = defaultdict(set)
    created = Counter()
    classification = Counter()
    changes = Counter()
    existing_record_reuse = Counter()
    overlays, all_rows = [], []
    hash_paths = defaultdict(list)
    for key, row in sorted(current.items()):
        original = baseline.get(key, {})
        existing_asset = assets_by_path.get(key)
        edition = records.get((existing_asset or {}).get('editionId') or row.get('editionId'), {})
        work = records.get(edition.get('workId') or row.get('workId'), {})
        creator_names = [authors[c['authorId']]['name'] for c in work.get('creators',[]) if c['authorId'] in authors and c['role'] in ('author','preacher','institution')]
        if not row.get('author') and creator_names:
            row['author'] = '; '.join(creator_names)
        if work and work.get('id') in catalog_paths:
            evidence[key].add(catalog_paths[work['id']])
        if existing_asset:
            row.update(assetId=existing_asset['id'], editionId=edition.get('id'), workId=work.get('id'))
            if useful_title(work.get('title')):
                row['title'] = work['title']
            creator_names = [authors[c['authorId']]['name'] for c in work.get('creators',[]) if c['authorId'] in authors and c['role'] in ('author','preacher','institution')]
            if not row.get('author') and creator_names:
                row['author'] = '; '.join(creator_names)
            if edition.get('languages') and not row.get('language'):
                row['language'] = edition['languages'][0]
            if work.get('audiences') and not row.get('audience'):
                row['audience'] = '; '.join(work['audiences'])
            rights = existing_asset.get('rights', {})
            if rights:
                row.setdefault('rightsCategory', rights.get('category'))
                row.setdefault('policyUrl', rights.get('licenseUrl'))
                if not row.get('licence') and rights.get('evidence'):
                    row['licence'] = 'Recorded category: ' + rights['category'] + '; ' + '; '.join(rights.get('conditions', []))
                if rights.get('attribution') and not row.get('credit'):
                    row['credit'] = rights['attribution']
            evidence[key].add(catalog_paths[existing_asset['id']])
            existing_record_reuse['assets'] += 1
        if row.get('authors'):
            row['author'] = text(row['authors'])
        elif isinstance(row.get('author'), list):
            row['author'] = text(row['author'])
        if not row.get('author') and creator_names:
            row['author'] = '; '.join(creator_names)
        if not row.get('author') and row.get('authorId') in authors:
            row['author'] = authors[row['authorId']]['name']
        if not row.get('author') and row.get('authorGroup') in ('piper','rogers'):
            # These held collections were acquired from the named preacher index.
            row['author'] = {'piper':'John Piper','rogers':'Adrian Rogers'}[row['authorGroup']]
            row['attributionBasis'] = 'Named preacher collection in original acquisition ledger'
        if not row.get('author') and row.get('source') == 'source-spurgeon-gems':
            row['author'] = 'Charles Haddon Spurgeon'
            row['attributionBasis'] = 'Held Spurgeon Gems sermon collection; source registry complete-set identity'
        if not row.get('author') and row.get('source') == 'source-billy-graham':
            row['author'] = 'Billy Graham'
            row['attributionBasis'] = 'Existing named-author Billy Graham collection acquisition'
        if not useful_title(row.get('title')):
            resource_url = text(row.get('sourcePage')) or text(row.get('url'))
            resource_title = unquote(Path(urlsplit(resource_url).path).stem).replace('-', ' ').replace('_',' ').strip()
            if resource_title and not GENERIC.fullmatch(resource_title):
                row['title'] = resource_title
                row['titleBasis'] = 'Source resource URL label; not an independently collated title page'
        category, scope, policy = row.get('rightsCategory'), row.get('useScope'), row.get('policyUrl')
        if isinstance(row.get('licence'), dict):
            rights_metadata = row['licence']
            row['licence'] = 'Recorded category: ' + rights_metadata.get('category', 'unspecified') + '; ' + '; '.join(rights_metadata.get('conditions', []))
        if not row.get('licence') and (category or policy):
            row['licence'] = 'Copyright and edition notices retained; recorded acquisition category: ' + str(category or 'unspecified')
            if scope:
                row['licence'] += '; recorded use scope: ' + scope
            if policy:
                row['licence'] += '; policy evidence: ' + policy
        if not row.get('licence') and row.get('format') == 'json' and row.get('source') == 'source-helloao':
            # Preserve a source-metadata gap instead of inventing an API licence.
            row['licence'] = None
        row['source'] = str(row.get('source') or Path(key).relative_to(RAW).parts[0])
        source_id = SOURCE_ALIASES.get(row['source'], row['source'])
        if source_id == 'source-desiring-god' and not row.get('language') and row.get('authorGroup') == 'piper':
            row['language'] = 'en'
            row['languageBasis'] = 'Original English John Piper index acquisition'
        if not row.get('format'):
            row['format'] = Path(key).suffix.lstrip('.') or 'text'
        if row.get('sourceResourceId'):
            row['sourceId'] = str(row['sourceResourceId'])
        if not row.get('contributor') and source_id in COLLECTION_CREDITS:
            row['contributor'] = COLLECTION_CREDITS[source_id]
        if not row.get('credit') and row.get('contributor'):
            row['credit'] = text(row.get('author')) + '; ' + text(row['contributor'])
        row['genre'] = genre(row)
        row['classification'] = 'sermon-or-message' if row['genre']=='sermon' else 'article' if row['genre']=='article' else 'book-or-treatise'
        if row.get('countAsBook') is False or row['genre'] in ('sermon','article','derivative'):
            row['countAsBook'] = False
        missing = [f for f in ('title','author','url','licence','sha256') if not row.get(f) or (f=='title' and not useful_title(row[f]))]
        if missing:
            unresolved.append(dict(path=key, source=row['source'], missing=missing))
        row['metadataEvidence'] = sorted(evidence[key] | set(row.get('manifests', [])))
        row['publicHostingAllowed'] = False
        row['privateLocalIndexAuthorized'] = True
        row['useScope'] = scope or 'private-local-user-authorized'
        row['screeningBasis'] = 'Existing screened author/collection acquisition; bibliographic reconciliation does not grant public publication or new theological recommendation'
        if row.get('recommendationStatus'):
            row['screeningBasis'] += '; ' + str(row['recommendationStatus'])
        author_id = row.get('authorId') if row.get('authorId') in authors else None
        primary_author = text(row.get('author')).split(';')[0]
        if not author_id:
            author_id = name_index.get(name_key(primary_author))
        if author_id and authors[author_id]['eligibility'] in ('excluded', 'context-only'):
            row['classification'] = 'context-only'
            row['countAsBook'] = False
            row['cataloguePromotion'] = 'Not promoted as core teaching: existing registry marks author context-only or excluded'
            author_id = None
        if not existing_asset and useful_title(row.get('title')) and row.get('sha256') and str(row.get('url','')).startswith('https://') and author_id and source_id in registered_sources:
            item_key = item_identity(row)
            work_id = row.get('workId') if row.get('workId') in records else 'work-reconciled-' + digest(source_id + '\n' + str(item_key))
            edition_id = 'edition-reconciled-' + digest(source_id + '\n' + str(item_key) + '\n' + row['sha256'])
            asset_id = Path(key).parent.name
            def write_catalog(value):
                aid = value['id']
                if aid in records:
                    return
                folder = {'work':'works','edition':'editions','asset':'assets'}[value['kind']]
                target = CATALOG / folder / (aid + '.json')
                if target.exists():
                    raise RuntimeError('Unexpected catalogue ID collision: ' + aid)
                save(target, value)
                records[aid] = value
                owned_records.append(str(target.resolve()))
                created[value['kind']] += 1
            def base(kind, aid):
                return {'$schema':'../../schema.json', 'schemaVersion':1, 'kind':kind, 'id':aid,
                        'editorialState':'draft', 'notes':['Private-local bibliographic reconciliation; source-specific work identity; no public publication or full-text theological review.'], 'reviews':[]}
            evidence_url = row.get('sourcePage') if str(row.get('sourcePage','')).startswith('https://') else row['url']
            evidence_row = dict(url=evidence_url, locator='Recorded acquisition/source metadata', note='Exact path and recorded original hash; evidence paths in campaign reconciliation manifest.', checkedOn=DAY)
            value = base('work', work_id)
            value.update(title=row['title'], alternateTitles=[], creators=[dict(authorId=author_id, role='preacher' if row['genre']=='sermon' else 'author')],
                genre=row['genre'] if row['genre'] in ('sermon','article','commentary') else 'treatise', role='core-teaching',
                collections=['sermons'] if row['genre']=='sermon' else ['scripture'] if row['genre']=='commentary' else [],
                subjects=[], occasions=[], audiences=[], depth='unknown', era='unknown', dates=[], passages=[], related=[],
                externalIds={source_id:[str(item_key)]}, evidence=[evidence_row])
            write_catalog(value)
            language = text(row.get('language')).split(';')[0] or 'und'
            value = base('edition', edition_id)
            value.update(workId=work_id, label=row['title'] + ' — held source edition ' + row['sha256'][:12], languages=[language],
                         contributors=[], publisher=None, dates=[], abridgment='unknown', modernization='unknown', evidence=[evidence_row])
            write_catalog(value)
            licence = text(row.get('licence'))
            rights_category = category if category in ('public-domain','open-license','permission-granted','restricted-license','link-only','unknown','restricted') else 'open-license' if 'CC0' in licence else 'public-domain' if 'public-domain' in licence.lower() or 'public domain' in licence.lower() else 'restricted-license' if licence else 'unknown'
            review = dict(date=DAY, reviewer='Codex', kind='ai-assisted', scope='Recorded bibliographic/provenance reconciliation; private local authorization retained separately from public use.')
            license_url = policy if isinstance(policy,str) and policy.startswith('https://') else 'https://creativecommons.org/publicdomain/zero/1.0/' if 'CC0' in licence else None
            rights = dict(category=rights_category, jurisdiction='United States' if rights_category=='public-domain' else None, licenseId='CC0-1.0' if 'CC0' in licence else 'Recorded publisher-use policy' if license_url else None, licenseUrl=license_url,
                attribution=text(row.get('credit')) or text(row.get('author')) or None,
                conditions=[licence] if licence else [], conditionsMet=False,
                actions=dict(download='allowed', host='unknown', redistribute='unknown', adapt='unknown', transcribe='unknown', embed='allowed', indexMetadata='allowed', indexFullText='allowed'),
                evidence=[evidence_row], unresolved=[] if licence else ['Exact edition licence metadata not yet recovered; this is not an indexing hold.'], review=review)
            value = base('asset', asset_id)
            value.update(editionId=edition_id, sourceId=source_id, canonicalUrl=row['url'], finalUrl=row.get('finalUrl') if str(row.get('finalUrl','')).startswith('https://') else row['url'],
                format='text' if row['format']=='txt' else row['format'] if row['format'] in ('html','pdf','epub') else 'other', mediaKind='text', acquisitionStatus='downloaded', storage='raw',
                relativePath=Path(key).relative_to(ROOT / 'sources').as_posix(), sha256=row['sha256'], byteCount=row['bytes'], mimeType=row.get('mimeType') or mimetypes.guess_type(key)[0],
                retrievedAt=str(row['retrievedAt']).replace('+00:00','Z') if row.get('retrievedAt') else None, rights=rights, fullTextIndexed=row.get('intakeStatus') in ('indexed','duplicate'),
                processing=dict(parentAssetId=None, method='none', tool=None, toolVersion=None, parameters=None, date=None, note='Original unchanged; existing selected derivatives remain in their original acquisition/repair ledgers.'),
                quality=dict(state='unreviewed', reviewedBy=None, reviewedOn=None, note='Bibliographic metadata joined; body not proofread or collated by this task.'))
            row.update(workId=work_id, editionId=edition_id)
            canonical_folder = RAW / source_id / asset_id
            can_catalog_asset = (Path(key).parent == canonical_folder and re.fullmatch(r'asset-[a-z0-9]+(?:-[a-z0-9]+)*', asset_id)
                and row.get('retrievedAt') and rights_category not in ('unknown','link-only','restricted')
                and (rights_category not in ('open-license','restricted-license') or license_url))
            if can_catalog_asset:
                write_catalog(value)
                row['assetId'] = asset_id
            else:
                row['cataloguePromotion'] = 'Work/edition catalogued; original path remains represented by the importer manifest because canonical asset layout or acquisition evidence is incomplete.'
        elif not existing_asset:
            if not author_id and primary_author:
                required_registries['authors'].add(primary_author)
            if source_id not in registered_sources:
                required_registries['sources'].add(source_id)
            row['cataloguePromotion'] = row.get('cataloguePromotion') or 'Importer manifest carries bibliographic metadata; canonical registry or complete identity not available within this task ownership.'
        improved = [field for field in ('title','author','licence','url','format','language','audience','contributor','credit','workId','editionId','assetId') if row.get(field) != original.get(field) and row.get(field)]
        for field in improved:
            changes[field] += 1
        row['reconciledFields'] = improved
        row['reconciledAt'] = datetime.now(timezone.utc).isoformat()
        classification[row['classification']] += 1
        hash_paths[row['sha256']].append(key)
        all_rows.append(row)
        if improved or key not in baseline:
            # Only include interpreter-supported metadata; leave extraction selection in existing ledgers.
            output = {field:row[field] for field in CONTEXT + ('path','sha256','bytes','url','finalUrl','format','mimeType','assetId','editionId','workId','metadataEvidence','classification','reconciledFields','reconciledAt','privateLocalIndexAuthorized','publicHostingAllowed','screeningBasis') if field in row and row[field] is not None}
            if text(row.get('author')):
                output['author'] = text(row['author'])
            else:
                output.pop('author', None)
            output['path'] = key
            overlays.append(output)
    save(OUT / 'acquisition-manifest.json', {'mission':'CAMPAIGN-CATALOGUE-RECONCILIATION', 'createdAt':datetime.now(timezone.utc).isoformat(),
        'scope':'Private local metadata reconciliation; originals and extraction selections unchanged', 'files':overlays})
    save(OUT / 'unresolved.json', {'missingMetadata':unresolved, 'recordedHashConflicts':conflicts, 'inputErrors':input_errors,
        'canonicalRegistryAdditionsNeeded':{k:sorted(v) for k,v in required_registries.items()}, 'excludedManifestRows':excluded})
    with (OUT / 'private-catalog.jsonl').open('w', encoding='utf-8') as stream:
        for row in all_rows:
            stream.write(json.dumps(row, ensure_ascii=False) + '\n')
    duplicates = [dict(sha256=h, paths=paths, provenanceRetained=True) for h,paths in hash_paths.items() if len(paths)>1]
    save(OUT / 'duplicate-representations.json', {'items':duplicates, 'basis':'Recorded original-byte hashes; no title-only merging or rehashing'})
    owned_records = sorted(set(owned_records))
    generated_counts = Counter(read(Path(p))['kind'] for p in owned_records)
    save(OUT / 'generated-records.state', {'paths':owned_records, 'counts':dict(generated_counts)})
    summary = dict(updatedAt=datetime.now(timezone.utc).isoformat(), state='metadata_reconciled', bodyFilesConsidered=len(current),
        snapshotBodyFiles=len(baseline), filesImproved=len(overlays), improvedFields=dict(changes), classification=dict(classification),
        schemaRecordsCreated=dict(generated_counts), newlyCreatedThisRun=dict(created), existingCatalogAssetsReused=existing_record_reuse['assets'], duplicateHashGroups=len(duplicates),
        unresolvedMetadataFiles=len(unresolved), unresolvedMetadataFields=dict(Counter(f for row in unresolved for f in row['missing'])),
        recordedHashConflicts=len(conflicts), inputErrors=len(input_errors), newAuthorIdentitiesNeeded=len(required_registries['authors']),
        newSourceIdentitiesNeeded=len(required_registries['sources']), intakeStarted=False, embeddingStarted=False)
    save(OUT / 'summary.json', summary)
    lines = ['# Catalogue and provenance reconciliation', '',
        f"**{len(current):,} held body candidates considered; {len(overlays):,} files improved.** {sum(generated_counts.values()):,} new schema records: {dict(generated_counts)}. {existing_record_reuse['assets']:,} existing asset identities reused.", '',
        'Field improvements: ' + ', '.join(f'{k} {v:,}' for k,v in changes.items()) + '.', '',
        'Classifications: ' + ', '.join(f'{k} {v:,}' for k,v in classification.items()) + '. Recorded duplicate-byte groups: ' + str(len(duplicates)) + '; each path retains provenance and edition identity.', '',
        f"Unresolved required metadata: **{len(unresolved):,} files**; field counts {summary['unresolvedMetadataFields']}. Recorded hash conflicts: **{len(conflicts)}**; input errors: **{len(input_errors)}**. Canonical registry additions needed: **{summary['newAuthorIdentitiesNeeded']} author names**, **{summary['newSourceIdentitiesNeeded']} source IDs**; root registries remain outside this task ownership.", '',
        'Importer-compatible output: `acquisition-manifest.json`. Full private catalogue: `private-catalog.jsonl`. Unresolved details: `unresolved.json`. New records use `*-reconciled-*` identities under `content/library/catalog/{works,editions,assets}/`; no title-only work merging. Source metadata and acquisition/repair ledgers remain authoritative.', '',
        'Originals, other mission manifests, SOURCES.md, intake code, live databases, embedding processes and schedulers were not modified. No evidenceOnly holds or public publication were created. No refresh, intake or embedding was started.']
    (OUT / 'REPORT.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps(summary))


if __name__ == '__main__':
    main()
