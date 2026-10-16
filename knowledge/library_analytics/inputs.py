"""Bounded read-only adapters and file dependencies for refinement jobs."""
import hashlib
import json
import re
from collections import OrderedDict
from pathlib import Path
from .build import readonly, sha
from .jobs import StaleInput


def packed(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def digest(value):
    return hashlib.sha256(packed(value).encode('utf-8')).hexdigest()


class Inputs:
    def __init__(self, project, warehouse):
        self.project = Path(project)
        self.site = self.project / 'Website'
        self.warehouse = readonly(Path(warehouse))
        self.corpus = readonly(self.project / 'KnowledgeBase/knowledge.sqlite3')
        self.registry = readonly(self.project / 'KnowledgeBase/Research Foundation/registry.sqlite3')
        self.initial_versions = self.versions()
        self.cache = OrderedDict()
        self.dependencies = {}
        self.author_rows = {}
        self.author_files = {}
        for path in [self.site / 'content/library/authors.json', *sorted((self.site / 'content/library/registry-extensions').glob('*.json'))]:
            data, fingerprint = self.file(path)
            self.author_files[str(path)] = fingerprint
            if data:
                for row in data.get('authors', []):
                    self.author_rows.setdefault(row['id'], []).append({'record':row, 'path':str(path), 'sha256':fingerprint})
        self.moves_path = self.project / 'KnowledgeBase/campaign-coordination/archive-moves.json'
        self.moves, self.moves_sha = self.file(self.moves_path)
        self.moves = (self.moves or {}).get('approvedMoves', [])
        self.selected_readers = {}
        self.text_links = None
        self.intake_links = None

    def prefetch_readers(self):
        ids = {r[0] for r in self.warehouse.execute("SELECT target_id FROM identity_backfill_candidates WHERE target_layer='reader'")}
        ids.update(r[0] for r in self.warehouse.execute("SELECT example_evidence_record FROM identity_backfill_candidates WHERE target_layer='corpus'"))
        ids.update(r[0] for r in self.warehouse.execute('SELECT reader_id FROM reader_crosswalk WHERE readable_declared=1 AND corpus_text_matches=0'))
        for path in sorted((self.site / 'public/content/teacher-library/records').glob('*.json')):
            data, fingerprint = self.file(path)
            for ident in ids.intersection(data):
                self.selected_readers[ident] = (data[ident], {'path':str(path), 'sha256':fingerprint})

    def current_text_links(self):
        if self.text_links is None:
            self.text_links = {k:{} for k in ('original_sha','work_id','edition_id','asset_id')}
            last = ''
            while True:
                rows = self.corpus.execute("SELECT id,metadata FROM documents WHERE kind='library_text' AND id>? ORDER BY id LIMIT 500", (last,)).fetchall()
                if not rows: break
                last = rows[-1]['id']
                for row in rows:
                    metadata = json.loads(row['metadata'])
                    record = {'document_id':row['id'], 'kind':'library_text', 'original_sha':sha(metadata.get('original_sha256')),
                              'work_id':(metadata.get('work') or {}).get('id'), 'edition_id':(metadata.get('edition') or {}).get('id'),
                              'asset_id':(metadata.get('asset') or {}).get('id'), 'metadata_sha':digest(metadata)}
                    for field, index in self.text_links.items():
                        if record[field]: index.setdefault(record[field], []).append(record)
        return self.text_links

    def current_intake_links(self):
        if self.intake_links is None:
            self.intake_links = {}
            cursor = self.corpus.execute('SELECT path,sha256,status,document_id FROM library_files')
            while True:
                rows = cursor.fetchmany(500)
                if not rows: break
                for row in rows:
                    self.intake_links.setdefault(row['sha256'], []).append(dict(row))
            cursor.close()
        return self.intake_links

    def versions(self):
        return {'corpus':self.corpus.execute('PRAGMA data_version').fetchone()[0],
                'registry':self.registry.execute('PRAGMA data_version').fetchone()[0],
                'warehouse':self.warehouse.execute('PRAGMA data_version').fetchone()[0]}

    def file(self, path):
        path = Path(path)
        key = str(path)
        if key in self.cache:
            data, fingerprint = self.cache.pop(key)
            self.cache[key] = (data, fingerprint)
            return data, fingerprint
        if not path.exists():
            data, fingerprint = None, 'missing'
            self.dependencies[key] = {'sha256':'missing', 'size':None, 'mtime_ns':None}
        else:
            before = path.stat()
            raw = path.read_bytes()
            after = path.stat()
            if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
                raise StaleInput('File changed while reading: ' + key)
            data = json.loads(raw.decode('utf-8-sig'))
            fingerprint = hashlib.sha256(raw).hexdigest()
            previous = self.dependencies.get(key)
            if previous and previous['sha256'] != fingerprint:
                raise StaleInput('Dependency changed during run: ' + key)
            self.dependencies[key] = {'sha256':fingerprint, 'size':after.st_size, 'mtime_ns':after.st_mtime_ns}
        self.cache[key] = (data, fingerprint)
        while len(self.cache) > 128:
            self.cache.popitem(last=False)
        return data, fingerprint

    def canonical(self, kind, ident):
        if not ident:
            return None, 'missing'
        if not re.fullmatch(r'[a-zA-Z0-9_-]+', ident):
            return None, 'invalid-id'
        return self.file(self.site / 'content/library/catalog' / (kind + 's') / (ident + '.json'))

    def reader(self, ident):
        if ident in self.selected_readers:
            return self.selected_readers[ident]
        shard = hashlib.sha256(ident.encode('utf-8')).hexdigest()[:2]
        path = self.site / 'public/content/teacher-library/records' / (shard + '.json')
        data, fingerprint = self.file(path)
        return (data or {}).get(ident), {'path':str(path), 'sha256':fingerprint}

    def current(self, layer, ident):
        if layer == 'reader':
            record, location = self.reader(ident)
            if not record:
                return None
            return {'original_sha':sha(record.get('sha256')), 'work_id':record.get('workId'),
                    'edition_id':record.get('editionId'), 'asset_id':record.get('assetId'),
                    'record':record, 'fingerprint':digest(record), 'location':location}
        row = self.corpus.execute('SELECT metadata,source,language,title FROM documents WHERE id=?', (ident,)).fetchone()
        if not row:
            return None
        record = json.loads(row['metadata'])
        return {'original_sha':sha(record.get('original_sha256')), 'work_id':(record.get('work') or {}).get('id'),
                'edition_id':(record.get('edition') or {}).get('id'), 'asset_id':(record.get('asset') or {}).get('id'),
                'record':record, 'fingerprint':digest(dict(row)),
                'location':{'database':str(self.project / 'KnowledgeBase/knowledge.sqlite3'), 'table':'documents', 'id':ident}}

    def live_metadata(self, observations):
        """Projected records only; no text bodies or long input transactions."""
        result = {}
        for layer, conn, table, keycol, columns in [
            ('corpus', self.corpus, 'documents', 'id', 'id,metadata,language,title'),
            ('resource', self.registry, 'resources', 'id', 'id,record,sha256'),
            ('intake-file', self.corpus, 'library_files', 'path', 'path,metadata,sha256')]:
            ids = [r['native_id'] for r in observations if r['layer'] == layer]
            for offset in range(0, len(ids), 400):
                selected = ids[offset:offset + 400]
                rows = conn.execute(f'SELECT {columns} FROM {table} WHERE {keycol} IN ({",".join("?" for _ in selected)})', selected).fetchall()
                for row in rows:
                    raw = dict(row)
                    metadata = json.loads(raw.get('record') or raw['metadata'])
                    original = sha(raw.get('sha256')) if layer != 'corpus' else sha(metadata.get('original_sha256'))
                    result[layer + ':' + raw[keycol]] = {'metadata':metadata, 'original_sha':original, 'fingerprint':digest(raw),
                        'direct':{'title':raw.get('title'), 'language':raw.get('language')}}
        for r in observations:
            if r['layer'] == 'reader':
                current = self.current('reader', r['native_id'])
                if current:
                    result[r['key']] = {'metadata':current['record'], 'original_sha':current['original_sha'],
                        'fingerprint':current['fingerprint'], 'direct':{}}
        return result

    def assertions(self, observation, live):
        values = {}
        dependencies = {}
        def add(field, value, origin):
            if isinstance(value, list):
                value = '; '.join(str(v) for v in value if isinstance(v, str))
            if isinstance(value, str) and value.strip():
                values.setdefault(field, []).append((value.strip(), origin))
        if live:
            dependencies['live'] = live['fingerprint']
            # Never recover a different original's metadata onto the snapshot record.
            if observation['original_sha'] and live['original_sha'] != observation['original_sha']:
                return {}, dependencies, ['source-original-hash-changed']
            m = live['metadata']
            candidates = [live['direct'], m]
            candidates += [m.get(k) or {} for k in ('metadata', 'acquisition', 'work', 'edition')]
            for index, node in enumerate(candidates):
                for name, aliases in {'title':['title'], 'author_label':['author', 'authors', 'contributor'],
                                      'language':['language', 'languages'], 'genre':['genre', 'textKind'],
                                      'source_raw':['source']}.items():
                    for alias in aliases:
                        add(name, node.get(alias), 'current-source:' + str(index) + '.' + alias)
        # Only an exact registered edition can supply edition language.
        edition, eh = self.canonical('edition', observation['edition_id'])
        if observation['edition_id']:
            dependencies['edition:' + observation['edition_id']] = eh
        if edition and edition.get('id') == observation['edition_id']:
            add('language', edition.get('languages'), 'canonical-edition:' + edition['id'])
        work, wh = self.canonical('work', observation['work_id'])
        if observation['work_id']:
            dependencies['work:' + observation['work_id']] = wh
        if work and work.get('id') == observation['work_id']:
            add('title', work.get('title'), 'canonical-work:' + work['id'])
            add('genre', work.get('genre'), 'canonical-work:' + work['id'])
            names = []
            for creator in work.get('creators', []):
                if creator.get('role') in ('author', 'preacher', 'institution'):
                    entries = self.author_rows.get(creator.get('authorId'), [])
                    if len(entries) == 1:
                        names.append(entries[0]['record']['name'])
                        dependencies['author:' + creator['authorId']] = entries[0]['sha256']
            if names:
                add('author_label', names, 'canonical-work-creators:' + work['id'])
        return values, dependencies, []

    def changed_files(self):
        changed = []
        for name, dep in self.dependencies.items():
            path = Path(name)
            if dep['sha256'] == 'missing':
                if path.exists(): changed.append(name)
            elif not path.exists() or (path.stat().st_size, path.stat().st_mtime_ns) != (dep['size'], dep['mtime_ns']):
                changed.append(name)
        return changed

    def close(self):
        for conn in (self.warehouse, self.corpus, self.registry):
            conn.close()
