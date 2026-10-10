"""Build a private Phase 1 registry from current records; never write original sources or the main KB."""
import hashlib
import json
import os
import re
import sqlite3
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from .contract import content_fingerprint, permissions, section_view, validate_citation

SITE = Path(__file__).resolve().parents[2]
PROJECT = SITE.parent
WORKSPACE = PROJECT.parents[2]
KB = PROJECT / 'KnowledgeBase'
HISTORY = KB / 'Biblical Historical Sources'
SOURCES = PROJECT / 'sources'
GRAHAM = WORKSPACE / 'billy-graham-transcripts'
OUTPUT = KB / 'Research Foundation'
BODY = {'.txt', '.md', '.html', '.htm', '.xml', '.json', '.epub', '.pdf', '.vpl', '.usfm', '.sfm'}
AUX = {'.py', '.pyc', '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.zip', '.sqlite3', '.csv'}

def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def key(path):
    return os.path.abspath(path).casefold()

def url_key(url):
    if not isinstance(url, str):
        return None
    p = urlsplit(url)
    return urlunsplit((p.scheme.lower(), p.netloc.lower(), p.path, p.query, '')) if p.scheme in ('http', 'https') else None

def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')

def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
    temp.replace(path)

def objects(value, inherited=None):
    if isinstance(value, dict):
        row = (inherited or {}) | value
        yield row
        fields = ('title', 'author', 'source', 'language', 'licence', 'license', 'credit', 'textKind', 'useScope')
        parent = {k: row[k] for k in fields if k in row}
        for k, child in value.items():
            if k not in ('sourceMetadata', 'content', 'headers'):
                yield from objects(child, parent)
    elif isinstance(value, list):
        for child in value:
            yield from objects(child, inherited)

class Builder:
    def __init__(self):
        OUTPUT.mkdir(parents=True, exist_ok=True)
        self.started = datetime.now(timezone.utc).isoformat()
        self.ids = sqlite3.connect(OUTPUT / 'identities.sqlite3')
        self.ids.execute('CREATE TABLE IF NOT EXISTS identities(origin_key TEXT PRIMARY KEY,id TEXT UNIQUE NOT NULL)')
        self.allocations = dict(self.ids.execute('SELECT origin_key,id FROM identities'))
        self.entities = {}
        self.files = {}
        self.groups = {}
        self.edges = []
        self.issues = []
        self.inputs = {}
        self.catalog_assets = {}
        self.catalog_by_path = defaultdict(list)
        self.catalog_by_hash = defaultdict(list)
        self.citations = []
        self.allowed_roots = tuple(root.resolve() for root in (SOURCES, HISTORY, KB / 'Biblical Archaeology', KB / 'False Religions', KB / 'reference-texts', GRAHAM, SITE / '.local/library'))
        self.routes = self.read(SITE / 'content/research/destinations.json')

    def allocate(self, origin, prefix='resource'):
        if origin not in self.allocations:
            ident = prefix + ':' + str(uuid.uuid4())
            self.ids.execute('INSERT INTO identities VALUES(?,?)', (origin, ident))
            self.allocations[origin] = ident
        return self.allocations[origin]

    def read(self, path):
        path = Path(path)
        for attempt in range(3):
            before = path.stat()
            raw = path.read_bytes()
            after = path.stat()
            if (before.st_mtime_ns, before.st_size) != (after.st_mtime_ns, after.st_size):
                continue
            value = json.loads(raw.decode('utf-8-sig'))
            self.inputs[str(path)] = {'path': str(path), 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw), 'mtimeNs': after.st_mtime_ns}
            return value
        raise RuntimeError('Input changed repeatedly while reading: ' + str(path))

    def group(self, ident, label, routing, source_role, origin=None):
        self.groups.setdefault(ident, {'id': ident, 'label': label, 'destinations': routing,
                                      'sourceRole': source_role, 'origin': str(origin) if origin else None,
                                      'publication': 'not-selected-by-phase-1'})
        return ident

    def entity(self, namespace, original, kind, title, data, origin):
        ident = namespace + ':' + original
        if ident in self.entities and self.entities[ident]['data'] != data:
            self.issues.append({'type': 'duplicate-external-id', 'id': ident, 'origin': str(origin)})
            return ident
        self.entities[ident] = {'id': ident, 'namespace': namespace, 'originalId': original, 'kind': kind,
                                'title': title, 'origin': str(origin), 'data': data}
        return ident

    def edge(self, source, target, relation, basis, status='explicit-reference'):
        self.edges.append({'from': source, 'to': target, 'relation': relation, 'basis': basis, 'status': status})

    def file(self, path, group, metadata=None):
        existing = self.files.get(key(path))
        path = Path(existing['path']) if existing else Path(path).resolve()
        if not existing and not any(path.is_relative_to(root) for root in self.allowed_roots):
            self.issues.append({'type': 'out-of-scope-path', 'path': str(path)})
            return None
        k = key(path)
        row = self.files.setdefault(k, {'id': self.allocate('file:' + k), 'path': str(path), 'group': group,
                                        'groups': [], 'metadata': {}, 'recordedHashes': [], 'observations': []})
        if group not in row['groups']:
            row['groups'].append(group)
        meta = metadata or {}
        recorded = meta.get('sha256') or meta.get('sourceSha256')
        if isinstance(recorded, str) and re.fullmatch('[0-9a-f]{64}', recorded) and recorded not in row['recordedHashes']:
            row['recordedHashes'].append(recorded)
        for name in ('title', 'author', 'source', 'sourceId', 'url', 'source_url', 'sourcePage', 'licence', 'license',
                     'language', 'credit', 'textKind', 'limitations', 'scope', 'useScope', 'originalPath',
                     'originalSha256', 'assetId', 'workId', 'editionId', 'publicHostingAllowed',
                     'publicFullTextIndexAllowed', 'intakeStatus', 'bodyCandidate', 'format', 'sourceRole',
                     'original_date', 'sermon_date', 'completeness', 'upstreamIds', 'publishedStatus'):
            if meta.get(name) is not None:
                row['metadata'][name] = meta[name]
        if meta.get('_origin'):
            row['observations'].append(str(meta['_origin']))
        return row['id']

    def catalog(self):
        root = SITE / 'content/library'
        for path in [root / 'authors.json', *sorted((root / 'registry-extensions').glob('*.json'))]:
            for author in self.read(path).get('authors', []):
                self.entity('library:author', author['id'], 'contributor', author['name'], author, path)
        for path in sorted((root / 'catalog').rglob('*.json')):
            record = self.read(path)
            kind, original = record['kind'], record['id']
            ident = self.entity('library:' + kind, original, kind, record.get('title') or record.get('label') or original, record, path)
            for field, namespace in (('editionId', 'library:edition'), ('workId', 'library:work')):
                if record.get(field):
                    self.edge(ident, namespace + ':' + record[field], field, 'Existing library catalog field')
            for creator in record.get('creators', []) + record.get('contributors', []):
                if creator.get('authorId'):
                    self.edge(ident, 'library:author:' + creator['authorId'], creator.get('role', 'contributor'), 'Existing catalog attribution')
            if kind == 'asset':
                self.catalog_assets[original] = record
                if record.get('sha256'):
                    self.catalog_by_hash[record['sha256']].append(ident)
                if record.get('relativePath'):
                    raw = Path(record['relativePath'])
                    p = raw if raw.is_absolute() else SOURCES / raw
                    self.catalog_by_path[key(p)].append(ident)
                    group = self.group('library:' + p.relative_to(SOURCES / 'library').parts[0] if p.is_relative_to(SOURCES / 'library') else 'library:other',
                                       record.get('sourceId') or 'Library source', self.routes['library'], 'Catalogued work or edition')
                    self.file(p, group, {'assetId': original, 'editionId': record.get('editionId'), 'url': record.get('canonicalUrl'),
                                        'sha256': record.get('sha256'), '_origin': path})
        print('CATALOG', len(self.entities), flush=True)

    def library(self):
        # Reuse the prior reconciliation's observations, then read current ledgers and current file existence.
        previous = KB / 'campaign-stocktake/private-catalog.jsonl'
        if previous.exists():
            self.inputs[str(previous)] = {'path': str(previous), 'sha256': digest(previous), 'bytes': previous.stat().st_size, 'scope': 'Older metadata observations; current files scanned below'}
            with previous.open(encoding='utf8') as stream:
                for line in stream:
                    row = json.loads(line)
                    p = Path(row['path'])
                    if not p.is_relative_to(SOURCES / 'library'):
                        continue
                    group = self.library_group(p)
                    self.file(p, group, row | {'_origin': previous})
        manifests = sorted((SITE / 'content/library/reports').rglob('*manifest*.json'))
        overlay = SITE / 'content/library/reports/campaign-reconciliation/catalogue/acquisition-manifest.json'
        manifests.sort(key=lambda p: (p == overlay, str(p)))
        for n, manifest in enumerate(manifests, 1):
            value = self.read(manifest)
            for row in objects(value):
                raw = row.get('relativePath') or row.get('path') or row.get('sourceRelativePath')
                if not isinstance(raw, str) or not raw:
                    continue
                p = Path(raw)
                if not p.is_absolute():
                    p = (SOURCES if raw.replace('\\', '/').startswith('library/') else SITE) / p
                p = p.resolve()
                if not p.is_relative_to(SOURCES / 'library'):
                    continue
                self.file(p, self.library_group(p), row | {'_origin': manifest})
            if n % 25 == 0:
                print('LEDGERS', n, len(self.files), flush=True)
        # Snapshot actual file membership, including acquisitions absent from the older stocktake.
        for directory, dirs, names in os.walk(SOURCES / 'library'):
            dirs[:] = [d for d in dirs if d not in ('.git', '__pycache__')]
            for name in names:
                p = Path(directory) / name
                if p.suffix.lower() not in ('.part', '.tmp'):
                    self.file(p, self.library_group(p))
        print('LIBRARY FILE OBSERVATIONS', len(self.files), flush=True)

    def library_group(self, path):
        label = path.relative_to(SOURCES / 'library').parts[0]
        routing = self.routes['sermons'] if any(x in label.lower() for x in ('graham', 'spurgeon', 'piper', 'begg', 'rogers', 'sermon')) else self.routes['library']
        return self.group('library:' + label, label, routing, 'Existing library edition or acquisition; per-work teaching role remains in catalog', SOURCES / 'library' / label)

    def historical(self):
        for category, routing in self.routes['historical'].items():
            self.group('history:' + slug(category), category, routing, 'Historical source or explicitly labelled editorial aid', HISTORY / category)
        with sqlite3.connect((HISTORY / 'historical-search.sqlite3').as_uri() + '?mode=ro', uri=True) as db:
            for (raw,) in db.execute('SELECT metadata FROM documents ORDER BY id'):
                meta = json.loads(raw)
                group = 'history:' + slug(meta['category'])
                row_id = self.file(meta['path'], group, {'title': meta['title'], 'sha256': meta['sha256'], 'url': meta.get('source_url'),
                    'language': meta['language'], 'licence': meta.get('licence'), 'scope': meta.get('scope'), 'textKind': meta['text_kind'],
                    'originalPath': meta['original_path'], 'originalSha256': meta.get('original_sha256'), '_origin': HISTORY / 'historical-search.sqlite3'})
                if row_id:
                    self.files[key(meta['path'])]['readabilityEvidence'] = 'Current local historical index contains extracted passages; metadata hash retained'
        for row in self.read(HISTORY / 'acquisition-manifest.json')['records']:
            if row['status'] not in ('acquired', 'reused'):
                self.issues.append({'type': 'acquisition-attempt', 'title': row['title'], 'status': row['status'], 'url': row.get('source_url')})
                continue
            p = Path(row['existing_absolute_path']) if row['status'] == 'reused' else HISTORY / row['relative_path']
            self.file(p, 'history:' + slug(row['category']), row | {'_origin': HISTORY / 'acquisition-manifest.json'})
        # Record storage totals separately; unpacked members and archives are not extra works.
        inventory = self.read(HISTORY / 'file-inventory.json')
        counts = Counter()
        for item in inventory:
            parts = Path(item['path']).parts
            if parts and parts[0] in self.routes['historical']:
                counts['history:' + slug(parts[0])] += 1
        for ident, count in counts.items():
            self.groups[ident]['recordedStoredFiles'] = count
            self.groups[ident]['storedCountBasis'] = 'Prior file-inventory snapshot, including archives and unpacked members; separate from current selected resource records'
        for category in self.routes['historical']:
            for folder, dirs, names in os.walk(HISTORY / category):
                dirs[:] = [d for d in dirs if d not in ('.git', '__pycache__')]
                for name in names:
                    p = Path(folder) / name
                    if p.suffix.lower() not in ('.part', '.tmp'):
                        self.file(p, 'history:' + slug(category))
        print('HISTORICAL FILE OBSERVATIONS', len(self.files), flush=True)

    def religions(self):
        root = KB / 'False Religions'
        source_by_hash = defaultdict(list)
        for path in sorted((root / '_Collection').rglob('manifest.json')):
            for row in self.read(path):
                if row.get('sha256'):
                    source_by_hash[row['sha256']].append(row)
        listed = {r['file'].replace('\\', '/'): r for r in self.read(root / 'file-manifest.json')}
        for directory in sorted(root.iterdir()):
            if not directory.is_dir() or directory.name.startswith('_'):
                continue
            group = self.group('religion:' + slug(directory.name), directory.name, self.routes['religions'], 'Primary record or commentary of another religious tradition; not a site teaching authority', directory)
            for p in sorted(directory.rglob('*')):
                if not p.is_file():
                    continue
                row = listed.get(p.relative_to(root).as_posix(), {})
                original = source_by_hash.get(row.get('sha256'), [])
                metadata = {'title': p.stem, 'sha256': row.get('sha256'), '_origin': root / 'file-manifest.json'}
                if len({r.get('source_url') or r.get('url') for r in original}) == 1 and original:
                    metadata['url'] = original[0].get('source_url') or original[0].get('url')
                ident = self.file(p, group, metadata)
                if original:
                    self.files[key(p)]['sourceManifestMatches'] = [{'file': x.get('file'), 'url': x.get('source_url') or x.get('url'), 'basis': 'same recorded file SHA-256, not an edition-equivalence assertion'} for x in original]
                if ident and p.suffix.lower() in ('.txt', '.xml', '.json'):
                    self.files[key(p)]['readabilityEvidence'] = 'Structured/text file present; complete linguistic or translation review not asserted'
        self.read(root / 'organization-report.json')

    def graham(self):
        group = self.group('sermons:billy-graham', 'Billy Graham reviewed transcript collection', self.routes['sermons'], 'Preaching and exposition', GRAHAM / 'transcripts')
        for row in self.read(GRAHAM / 'manifest.json'):
            # The held collection's source URL identifies the published sermon entry; do not match a YouTube search URL.
            entry = self.allocate('graham-entry:' + row['source_url'], 'sermon-entry')
            self.entities[entry] = {'id': entry, 'namespace': 'graham-entry', 'originalId': row['source_url'], 'kind': 'sermon-entry', 'title': row['title'], 'origin': str(GRAHAM / 'manifest.json'), 'data': row}
            self.edge(entry, 'library:author:author-billy-graham', 'preacher', 'Named Billy Graham transcript collection')
            for file in row['files']:
                ident = self.file(GRAHAM / file['path'], group, {'title': row['title'], 'author': 'Billy Graham', 'url': row['source_url'],
                    'sha256': file['sha256'], 'sermon_date': row.get('sermon_date'), 'completeness': row.get('completeness'),
                    'textKind': row.get('content_type'), '_origin': GRAHAM / 'manifest.json'})
                self.edge(entry, ident, 'has-representation', 'Explicit transcript manifest file member')
        excluded = self.read(GRAHAM / 'excluded-not-full/manifest.json')
        self.issues.append({'type': 'excluded-sermon-material', 'entries': len(excluded), 'origin': str(GRAHAM / 'excluded-not-full/manifest.json'), 'reason': 'Excluded from full-sermon collection; not counted as complete transcripts'})

    def other_sources(self):
        bible_names = {'ebible', 'crosswire', 'openscriptures'}
        presentation_names = {'census', 'natural-earth', 'nasa-bluemarble', 'openbible-geo'}
        for directory in sorted(SOURCES.iterdir()):
            if not directory.is_dir() or directory.name == 'library':
                continue
            kind = 'bible' if directory.name in bible_names else 'presentation' if directory.name in presentation_names else 'reference'
            group = self.group('source-root:' + slug(directory.name), directory.name, self.routes[kind], 'Source-root collection; individual source roles require edition-level review', directory)
            for folder, dirs, names in os.walk(directory):
                dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', '__pycache__')]
                for name in names:
                    p = Path(folder) / name
                    if p.suffix.lower() not in ('.part', '.tmp'):
                        self.file(p, group)
        root = KB / 'reference-texts'
        group = self.group('reference:kb-texts', 'Knowledge-base reference texts', self.routes['reference'], 'Existing local reference-text holdings', root)
        for folder, dirs, names in os.walk(root):
            dirs[:] = [d for d in dirs if d not in ('.git', '__pycache__')]
            for name in names:
                self.file(Path(folder) / name, group)

    def existing_sections(self):
        scholars_path = SITE / 'content/teachers/scholars.json'
        scholars = self.read(scholars_path)
        for row in scholars['scholars']:
            self.entity('scholars', row['id'], 'contributor', row['name'], row, scholars_path)
        for row in scholars['finds']:
            ident = self.entity('scholars-find', row['id'], 'featured-discovery', row['name'], row, scholars_path)
            for person in row['by']:
                self.edge(ident, 'scholars:' + person, 'documented-contributor', 'Current featured-discovery by field')
        for path in sorted((SITE / 'content/apologetics').glob('*/*.json')):
            row = self.read(path)
            if not row.get('kind') or not row.get('id'):
                continue
            ident = self.entity('apologetics:' + row['kind'], row['id'], 'source-record' if row['kind'] == 'source' else 'existing-page', row['content'].get('title') or row['id'], row, path)
            for obj in objects(row.get('content')):
                if obj.get('kind') == 'source' and obj.get('source'):
                    self.edge(ident, 'apologetics:source:' + obj['source'], 'cites', str(obj.get('locator') or 'Existing citation'), 'existing-editorial-citation')
        path = KB / 'Biblical History and Historians/historians-catalog.json'
        for row in self.read(path)['entries']:
            ident = self.entity('historians', row['id'], 'bibliography-entry', row['author_or_creator'], row, path)
            # Exact unique names are candidate identity links, not automatic contributor merges.
            matches = [s for s in scholars['scholars'] if s['name'].casefold() == row['author_or_creator'].casefold()]
            if len(matches) == 1:
                self.edge(ident, 'scholars:' + matches[0]['id'], 'identity-candidate', 'Exact unique supplied name; original IDs retained', 'needs-identity-review')
        path = KB / 'Biblical Archaeology/discovery-catalog.json'
        archaeology = self.read(path)['entries']
        for row in archaeology:
            self.entity('archaeology', row['id'], 'evidence-catalog-entry', row['discovery_or_collection'], row, path)
        self.archaeology = {r['id']: r for r in archaeology}

    def existing_research(self):
        root = PROJECT / 'Research/Apologetics/Islam/2026-10-09'
        corpus_path = root / 'r24-analysis-corpus.json'
        graph_path = root / 'r24-claim-source-map.json'
        corpus, graph = self.read(corpus_path), self.read(graph_path)
        group = self.group('research:islam-r24', 'Islam research dossier', self.routes['religions'],
                           'Existing claim research; original claim types and review limits retained', root)
        self.groups[group]['recordUnits'] = {'claims': len(corpus['claims']), 'sourceEndpoints': len(graph['sources']),
                                            'citationEdges': len(graph['edges']), 'independentWitnesses': None}
        for row in corpus['claims']:
            self.entity('islam-research:claim', row['id'], 'imported-claim', row['proposition'], row, corpus_path)
        for row in graph['sources']:
            self.entity('islam-research:source', row['id'], 'source-endpoint', row['endpoint_url'], row, graph_path)
        for row in graph['edges']:
            self.edge('islam-research:claim:' + row['claim_id'], 'islam-research:source:' + row['source_id'],
                      'cites-endpoint', json.dumps(row['original_citation'], ensure_ascii=False), 'existing-research; not independent-witness identity')
        overrides_path = SITE / 'content/research/reconciled-links.json'
        for row in self.read(overrides_path)['links']:
            if row['from'] not in self.entities or row['to'] not in self.entities:
                raise ValueError('Reconciled link target missing: ' + str(row))
            self.edges = [e for e in self.edges if not (e['from'] == row['from'] and e['to'] == row['to'] and e['relation'] == 'identity-candidate')]
            self.edge(row['from'], row['to'], row['relation'], row['basis'], 'ai-assisted record reconciliation; 2026-10-09')

    def evidence(self):
        path = HISTORY / 'evidence-index.json'
        index = self.read(path)
        rows = index['entries']
        self.issues.append({'type': 'stale-evidence-index-header', 'origin': str(path),
                            'disposition': 'Read per-entry current review state; obsolete header counters are not propagated',
                            'legacyCounters': {k: v for k, v in index.items() if k.endswith('_pending')}})
        for row in rows:
            ident = self.entity('evidence', row['id'], 'claim-record', row['subject'], row, path)
            if row['id'].startswith('BA-'):
                self.edge(ident, 'archaeology:' + row['id'], 'assesses', 'Preserved BA identifier in the evidence index')
            raw_path = row.get('source_path')
            if not raw_path:
                raw_path = next((x for x in row.get('local_source_files', []) if Path(x).is_file()), None)
            if not raw_path:
                self.issues.append({'type': 'citation-source-unavailable', 'id': ident, 'sourceUrl': row.get('source_url')})
            p = Path(raw_path) if raw_path else None
            source_id = self.file(p, 'history:10-evidence-source-checks', {'url': row.get('source_url'), '_origin': path}) if p else self.entity('evidence-source', row['id'], 'source-record', row['subject'], {'url': row.get('source_url'), 'availability': 'no-selected-held-source'}, path)
            extracted_path = Path(row.get('source_extracted_path') or raw_path) if raw_path else None
            quote = row.get('exact_quote')
            norm = re.sub(r'\s+', ' ', extracted_path.read_text('utf8', errors='replace')).strip() if extracted_path and extracted_path.is_file() and extracted_path.suffix.lower() in ('.txt', '.html', '.htm') else ''
            literal = bool(quote) and quote in norm
            status = row.get('source_review') or row.get('quotation_alignment_status') or ''
            reviewed = status.startswith('reviewed:') or status.startswith('Selected passage reviewed')
            source_hash = digest(p) if p and p.is_file() else None
            source_changed = bool(row.get('source_sha256')) and row['source_sha256'] != source_hash
            reviewed = reviewed and not source_changed
            limits = [row.get('interpretation_limit') or 'Source-to-claim alignment remains subject to the source review']
            if row.get('unresolved') or self.archaeology.get(row['id'], {}).get('audit_unresolved'):
                limits.append('Earlier audit retains a primary-source or attribution question; quotation matching does not close it')
            citation = {'id': 'citation:' + row['id'], 'claimId': ident, 'sourceId': source_id, 'editionId': None,
                'locator': row.get('source_locator') or row.get('source_locator_in_edition'), 'quote': quote,
                'sourceUrl': row.get('source_url'), 'sourceRole': 'Published ancient-text edition' if row['id'].startswith('HT-') or 'oracc.' in (row.get('source_url') or '') else 'Source cited by archaeological review; institutional summary or scholarly interpretation may be involved',
                'claimKind': 'historical-observation' if row.get('claim_kind') == 'direct' else 'scholarly-interpretation',
                'claim': row['claim'],
                'alternatives': [{'interpretation': a['interpretation'], 'sourceUrl': a.get('source_url'),
                                  'accessScope': a.get('access_scope'), 'reviewState': 'imported; separate alignment review retained in claim record'} for a in row.get('competing_interpretations', [])],
                'review': {'kind': 'ai-assisted', 'state': 'reviewed-limited' if reviewed and literal else 'pending',
                           'scope': status, 'literalMatch': literal, 'contentFingerprint': None}, 'limits': limits,
                'dates': {'objectOrWork': row.get('source_date') if row['id'].startswith('HT-') else self.archaeology.get(row['id'], {}).get('date_or_period'),
                          'discovery': None, 'editionPublication': row.get('source_date') if row['id'].startswith('BA-') else None,
                          'retrieval': None, 'review': '2026-10-09'},
                'permissions': permissions(), 'private': {'sourcePath': str(p) if p else None, 'extractedPath': str(extracted_path) if extracted_path else None,
                    'sourceSha256': source_hash, 'extractedSha256': digest(extracted_path) if extracted_path and extracted_path.is_file() else None, 'quotedSourceSha256': row.get('source_sha256'),
                    'priorReviewSourceChanged': source_changed, 'dateStatus': row.get('source_date_status'),
                    'normalizedOffset': norm.find(quote) if literal else None}, 'publication': 'draft'}
            if reviewed and literal:
                citation['review']['contentFingerprint'] = content_fingerprint(citation)
            validate_citation(citation)
            self.citations.append(citation)
            self.edge(ident, source_id, 'cites-held-source', citation['locator'] or 'Locator pending', citation['review']['state'])
            if quote and not literal:
                self.issues.append({'type': 'literal-quotation-check', 'id': ident, 'path': str(extracted_path)})
            if source_changed:
                self.issues.append({'type': 'changed-reviewed-source', 'id': ident, 'path': str(p)})
        print('CITATIONS', len(self.citations), flush=True)

    def reconcile(self):
        canonical_names = defaultdict(list)
        for entity in self.entities.values():
            if entity['kind'] == 'contributor':
                canonical_names[entity['title'].casefold()].append(entity['id'])
        for name, ids in canonical_names.items():
            if len(ids) > 1:
                self.issues.append({'type': 'contributor-identity-candidate', 'name': name, 'ids': ids, 'status': 'not-merged'})
        urls = defaultdict(set)
        for entity in self.entities.values():
            record = entity['data']
            value = record.get('canonicalUrl') if entity['kind'] == 'asset' else record.get('content', {}).get('url') if entity['namespace'] == 'apologetics:source' else None
            if url_key(value):
                urls[url_key(value)].add(entity['id'])
        for value, ids in urls.items():
            if len(ids) > 1:
                ordered = sorted(ids)
                for other in ordered[1:]:
                    self.edge(ordered[0], other, 'same-source-url', value, 'url-reference-only; not same work or edition')
        for n, (path_key, row) in enumerate(self.files.items(), 1):
            p = Path(row['path'])
            try:
                stat = p.stat()
                row['availability'] = 'held' if stat.st_size else 'empty-file'
                row['bytes'] = stat.st_size
                row['observedMtimeNs'] = stat.st_mtime_ns
            except FileNotFoundError:
                row['availability'] = 'missing-recorded-path'
                row['bytes'] = None
            row['format'] = p.suffix.lower()
            row['bodyCandidate'] = p.suffix.lower() in BODY and not p.name.lower().endswith(('manifest.json', 'metadata.json', 'provenance.json'))
            row['sha256'] = row['recordedHashes'][0] if len(row['recordedHashes']) == 1 else None
            row['hashEvidence'] = 'recorded source hash; not bulk rehashed in Phase 1' if row['sha256'] else 'conflicting recorded hashes' if row['recordedHashes'] else 'hash not recorded'
            if len(row['recordedHashes']) > 1:
                self.issues.append({'type': 'recorded-hash-conflict', 'id': row['id'], 'path': row['path'], 'hashes': row['recordedHashes']})
            row['canonicalAssets'] = self.catalog_by_path.get(path_key, [])
            row['sameRecordedBytesAsAssets'] = self.catalog_by_hash.get(row['sha256'], []) if row['sha256'] else []
            for asset in row['canonicalAssets']:
                self.edge(row['id'], asset, 'catalog-path-reference', 'Exact existing asset relativePath; no ID changed')
            for asset in row['sameRecordedBytesAsAssets']:
                if asset not in row['canonicalAssets']:
                    self.edge(row['id'], asset, 'same-recorded-bytes', 'Matching recorded SHA-256; retain both paths, sources and edition IDs', 'representation-match; not edition merge')
            for field, namespace in (('workId', 'library:work'), ('editionId', 'library:edition'), ('assetId', 'library:asset')):
                target = row['metadata'].get(field)
                if target:
                    ident = namespace + ':' + target
                    if ident in self.entities:
                        self.edge(row['id'], ident, field, 'Recorded acquisition/catalogue identity')
                    else:
                        self.issues.append({'type': 'unresolved-legacy-id', 'id': row['id'], 'field': field, 'value': target})
            row['identityStatus'] = 'canonical-asset-reference' if row['canonicalAssets'] else 'recorded-byte-match' if row['sameRecordedBytesAsAssets'] else 'stable-held-resource; work-edition-unresolved'
            row['upstreamIds'] = self.upstream(row)
            if n % 50000 == 0:
                print('RECONCILED', n, flush=True)
        # Verify target existence; preserve unresolved old catalog references as explicit issues.
        all_ids = set(self.entities) | {r['id'] for r in self.files.values()}
        valid = []
        seen = set()
        for edge in self.edges:
            if edge['from'] not in all_ids or edge['to'] not in all_ids:
                self.issues.append({'type': 'unresolved-existing-reference', 'edge': edge})
                continue
            signature = (edge['from'], edge['to'], edge['relation'], edge['basis'])
            if signature not in seen:
                seen.add(signature)
                valid.append(edge)
        self.edges = valid

    def upstream(self, row):
        url = row['metadata'].get('url') or row['metadata'].get('source_url') or row['metadata'].get('sourcePage')
        values = []
        if not isinstance(url, str):
            return values
        parsed = urlsplit(url)
        if 'oracc.' in parsed.netloc:
            match = re.search(r'^/(.+)/([PQ]\d{6})(?:/|$)', parsed.path)
            if match:
                values.append({'namespace': 'oracc', 'project': match.group(1), 'id': match.group(2), 'scope': 'upstream document reference; translations and editions remain distinct'})
        if parsed.netloc == 'papyri.info':
            values.append({'namespace': 'papyri.info', 'id': parsed.path.strip('/'), 'scope': 'document reference, not unique edition identity'})
        if 'gutenberg.org' in parsed.netloc:
            match = re.search(r'/(?:ebooks|files)/(\d+)', parsed.path)
            if match:
                values.append({'namespace': 'gutenberg', 'id': match.group(1)})
        return values

    def save(self):
        self.ids.commit()
        self.ids.close()
        groups = defaultdict(Counter)
        by_hash = defaultdict(list)
        for row in self.files.values():
            c = groups[row['group']]
            c['resourceRecords'] += 1
            c[row['availability']] += 1
            c['bodyCandidates'] += int(row['bodyCandidate'])
            c['bytes'] += row['bytes'] or 0
            c['withRecordedHash'] += bool(row['sha256'])
            c['canonicalAssetReferences'] += bool(row['canonicalAssets'])
            c['workEditionUnresolved'] += row['identityStatus'].startswith('stable-held-resource')
            c['withReadabilityEvidence'] += bool(row.get('readabilityEvidence')) and row['availability'] == 'held'
            if row['sha256']:
                by_hash[row['sha256']].append(row)
        for ident, row in self.groups.items():
            row['counts'] = dict(groups[ident])
            row['readiness'] = {'inventory': 'mapped', 'bibliographicIdentity': 'record-specific; unresolved entries queued',
                                'readability': 'see per-resource evidence; extension alone is only a candidate',
                                'claimReview': 'see evidence/claim records; not inherited by every member of a corpus',
                                'publicSelection': 'not selected by Phase 1'}
        temp = OUTPUT / 'registry.building.sqlite3'
        if temp.exists():
            raise RuntimeError('Inspect unfinished registry build before replacement: ' + str(temp))
        db = sqlite3.connect(temp)
        db.executescript('''CREATE TABLE entities(id TEXT PRIMARY KEY,kind TEXT,namespace TEXT,original_id TEXT,title TEXT,record TEXT);
        CREATE TABLE resources(id TEXT PRIMARY KEY,path TEXT UNIQUE,group_id TEXT,sha256 TEXT,availability TEXT,record TEXT);
        CREATE INDEX resources_hash ON resources(sha256); CREATE INDEX resources_group ON resources(group_id);
        CREATE TABLE relations(source_id TEXT,target_id TEXT,relation TEXT,record TEXT);
        CREATE INDEX relations_source ON relations(source_id); CREATE INDEX relations_target ON relations(target_id);
        CREATE TABLE citations(id TEXT PRIMARY KEY,claim_id TEXT,source_id TEXT,record TEXT);
        CREATE TABLE collections(id TEXT PRIMARY KEY,record TEXT);''')
        db.executemany('INSERT INTO entities VALUES(?,?,?,?,?,?)', ((r['id'], r['kind'], r['namespace'], r['originalId'], r['title'], json.dumps(r, ensure_ascii=False)) for r in self.entities.values()))
        db.executemany('INSERT INTO resources VALUES(?,?,?,?,?,?)', ((r['id'], r['path'], r['group'], r['sha256'], r['availability'], json.dumps(r, ensure_ascii=False)) for r in self.files.values()))
        db.executemany('INSERT INTO relations VALUES(?,?,?,?)', ((r['from'], r['to'], r['relation'], json.dumps(r, ensure_ascii=False)) for r in self.edges))
        db.executemany('INSERT INTO citations VALUES(?,?,?,?)', ((r['id'], r['claimId'], r['sourceId'], json.dumps(r, ensure_ascii=False)) for r in self.citations))
        db.executemany('INSERT INTO collections VALUES(?,?)', ((r['id'], json.dumps(r, ensure_ascii=False)) for r in self.groups.values()))
        db.commit()
        check = db.execute('PRAGMA integrity_check').fetchone()[0]
        if check != 'ok':
            raise RuntimeError(check)
        db.close()
        temp.replace(OUTPUT / 'registry.sqlite3')
        duplicates = [{'sha256': checksum, 'resources': [r['id'] for r in rows], 'paths': [r['path'] for r in rows],
                       'catalogAssetIds': sorted({a for r in rows for a in r['canonicalAssets']}),
                       'disposition': 'Shared recorded byte content; source paths and canonical identities preserved, not merged'} for checksum, rows in by_hash.items() if len(rows) > 1]
        summary = {'startedAt': self.started, 'completedAt': datetime.now(timezone.utc).isoformat(),
            'scope': 'Phase 1 source and identity reconciliation; private metadata preparation, no publication or main index refresh',
            'entities': dict(Counter(r['kind'] for r in self.entities.values())), 'sourceGroups': len(self.groups),
            'resourceRecords': len(self.files), 'availability': dict(Counter(r['availability'] for r in self.files.values())),
            'identityStatus': dict(Counter(r['identityStatus'] for r in self.files.values())),
            'relations': len(self.edges), 'citations': len(self.citations),
            'citationStates': dict(Counter(c['review']['state'] for c in self.citations)), 'duplicateRecordedByteGroups': len(duplicates),
            'issues': dict(Counter(r['type'] for r in self.issues)), 'inputRecords': len(self.inputs), 'sqliteIntegrity': check,
            'originalsModified': False, 'mainDatabaseModified': False, 'publicSelectionModified': False,
            'canonicalIdsRenamed': 0, 'storedFileCountIsBookCount': False}
        write(OUTPUT / 'summary.json', summary)
        write(OUTPUT / 'collection-map.json', list(self.groups.values()))
        write(OUTPUT / 'duplicate-audit.json', duplicates)
        write(OUTPUT / 'unresolved.json', self.issues)
        write(OUTPUT / 'input-snapshots.json', list(self.inputs.values()))
        write(OUTPUT / 'citations.json', self.citations)
        identity_queue = Counter()
        with (OUTPUT / 'identity-queue.jsonl').open('w', encoding='utf8') as stream:
            for row in self.files.values():
                missing = []
                meta = row['metadata']
                if row['identityStatus'].startswith('stable-held-resource'):
                    missing.append('work-and-edition-identity')
                if not any(meta.get(k) for k in ('url', 'source_url', 'sourcePage')):
                    missing.append('provenance-url')
                if not meta.get('language'):
                    missing.append('language')
                if not any(meta.get(k) for k in ('licence', 'license')):
                    missing.append('licence-metadata')
                if missing:
                    identity_queue.update(missing)
                    stream.write(json.dumps({'id': row['id'], 'group': row['group'], 'path': row['path'], 'missing': missing,
                                             'availability': row['availability'], 'nextAction': 'Review edition/provenance; metadata gap does not assert missing download'}, ensure_ascii=False) + '\n')
        summary['metadataGapCounts'] = dict(identity_queue)
        write(OUTPUT / 'summary.json', summary)
        with (OUTPUT / 'identity-crosswalk.jsonl').open('w', encoding='utf8') as stream:
            for row in self.edges:
                stream.write(json.dumps(row, ensure_ascii=False) + '\n')
        examples = []
        for ident in ('citation:BA-012', 'citation:BA-098', 'citation:HT-001'):
            citation = next((c for c in self.citations if c['id'] == ident), None)
            if citation:
                examples.append({'citation': citation, 'views': [section_view(citation, section) for section in ('scholars', 'apologetics', 'studies')]})
        write(OUTPUT / 'private-roundtrip-examples.json', examples)
        print(json.dumps(summary, indent=2), flush=True)

    def run(self):
        self.catalog()
        self.library()
        self.historical()
        self.religions()
        self.graham()
        self.other_sources()
        self.existing_sections()
        self.existing_research()
        self.evidence()
        self.reconcile()
        self.save()

if __name__ == '__main__':
    Builder().run()
