import hashlib
import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

SCHEMA_VERSION = 1
RELATIONS = {
    'authored_by': ({'work'}, {'historical_person', 'organization'}),
    'edition_of': ({'edition'}, {'work'}), 'asset_of': ({'asset'}, {'edition'}),
    'part_of': ({'document', 'chunk', 'span'}, {'work', 'edition', 'asset', 'document', 'chunk'}),
    'source_cross_reference': ({'scripture_reference'}, {'scripture_reference'}),
    **{r: ({'biblical_person'}, {'biblical_person'}) for r in ('parent', 'child', 'sibling', 'spouse')},
    'cites_reference': ({'chunk'}, {'scripture_reference'}),
    'mentions_entity': ({'chunk'}, {'historical_person', 'organization', 'biblical_person', 'place'}),
    'topic_match': ({'chunk'}, {'topic'}), 'broader_topic': ({'topic'}, {'topic'}),
    'recorded_reference': ({'document'}, {'scripture_reference'}),
    'provided_by': ({'asset'}, {'acquisition_source'}),
    'shares_references': ({'document'}, {'document'}),
}
SCHEMA = '''
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS snapshots(id TEXT PRIMARY KEY,corpus_build TEXT NOT NULL,path TEXT NOT NULL,manifest TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,snapshot_id TEXT NOT NULL REFERENCES snapshots(id),mode TEXT NOT NULL,state TEXT NOT NULL,metadata TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS checkpoints(run_id TEXT NOT NULL REFERENCES runs(id),phase TEXT NOT NULL,cursor TEXT NOT NULL,PRIMARY KEY(run_id,phase));
CREATE TABLE IF NOT EXISTS entities(id TEXT PRIMARY KEY,kind TEXT NOT NULL,label TEXT NOT NULL,metadata TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS entity_keys(namespace TEXT NOT NULL,key TEXT NOT NULL,entity_id TEXT NOT NULL REFERENCES entities(id),PRIMARY KEY(namespace,key,entity_id));
CREATE TABLE IF NOT EXISTS run_entities(run_id TEXT NOT NULL REFERENCES runs(id),entity_id TEXT NOT NULL REFERENCES entities(id),PRIMARY KEY(run_id,entity_id));
CREATE TABLE IF NOT EXISTS entity_versions(run_id TEXT NOT NULL REFERENCES runs(id),entity_id TEXT NOT NULL REFERENCES entities(id),label TEXT NOT NULL,metadata TEXT NOT NULL,PRIMARY KEY(run_id,entity_id));
CREATE TABLE IF NOT EXISTS observations(id TEXT PRIMARY KEY,snapshot_id TEXT NOT NULL REFERENCES snapshots(id),document_id TEXT,chunk_id TEXT,text_hash TEXT,start INTEGER,end INTEGER,literal TEXT NOT NULL,source TEXT NOT NULL,source_hash TEXT NOT NULL,locator TEXT NOT NULL,method TEXT NOT NULL,rule_version TEXT NOT NULL,metadata TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS assertions(id TEXT PRIMARY KEY,subject TEXT NOT NULL REFERENCES entities(id),relation TEXT NOT NULL,object TEXT NOT NULL REFERENCES entities(id),basis TEXT NOT NULL,qualifiers TEXT NOT NULL,attribution TEXT NOT NULL,review_state TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS assertion_evidence(assertion_id TEXT NOT NULL REFERENCES assertions(id),observation_id TEXT NOT NULL REFERENCES observations(id),PRIMARY KEY(assertion_id,observation_id));
CREATE TABLE IF NOT EXISTS run_assertions(run_id TEXT NOT NULL REFERENCES runs(id),assertion_id TEXT NOT NULL REFERENCES assertions(id),PRIMARY KEY(run_id,assertion_id));
CREATE TABLE IF NOT EXISTS run_observations(run_id TEXT NOT NULL REFERENCES runs(id),observation_id TEXT NOT NULL REFERENCES observations(id),PRIMARY KEY(run_id,observation_id));
CREATE TABLE IF NOT EXISTS candidates(id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES runs(id),reason TEXT NOT NULL,metadata TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES runs(id),reviewer_type TEXT NOT NULL,decision TEXT NOT NULL,metadata TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS derivations(id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES runs(id),method TEXT NOT NULL,parameters TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS derivation_inputs(derivation_id TEXT NOT NULL REFERENCES derivations(id),assertion_id TEXT NOT NULL REFERENCES assertions(id),PRIMARY KEY(derivation_id,assertion_id));
CREATE TABLE IF NOT EXISTS releases(id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES runs(id),validated INTEGER NOT NULL,metadata TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS release_membership(release_id TEXT NOT NULL REFERENCES releases(id),assertion_id TEXT NOT NULL REFERENCES assertions(id),PRIMARY KEY(release_id,assertion_id));
CREATE TABLE IF NOT EXISTS citation_refs(entity_id TEXT PRIMARY KEY REFERENCES entities(id),book TEXT NOT NULL,start INTEGER NOT NULL,end INTEGER NOT NULL,edition TEXT NOT NULL,numbering TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS document_map(run_id TEXT NOT NULL REFERENCES runs(id),document_id TEXT NOT NULL,work_id TEXT,edition_id TEXT,genre TEXT NOT NULL,language TEXT NOT NULL,eligible INTEGER NOT NULL,metadata TEXT NOT NULL,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS chunk_map(run_id TEXT NOT NULL REFERENCES runs(id),chunk_id TEXT NOT NULL,document_id TEXT NOT NULL,rowid INTEGER NOT NULL,PRIMARY KEY(run_id,chunk_id));
CREATE TABLE IF NOT EXISTS scan_counts(run_id TEXT NOT NULL REFERENCES runs(id),document_id TEXT NOT NULL,chunks INTEGER NOT NULL,PRIMARY KEY(run_id,document_id));
CREATE TABLE IF NOT EXISTS document_witnesses(run_id TEXT NOT NULL REFERENCES runs(id),document_id TEXT NOT NULL,path TEXT NOT NULL,sha256 TEXT NOT NULL,work_id TEXT,edition_id TEXT,status TEXT NOT NULL,PRIMARY KEY(run_id,path));
CREATE INDEX IF NOT EXISTS assertions_from ON assertions(subject,relation,object);
CREATE INDEX IF NOT EXISTS assertions_to ON assertions(object,relation,subject);
CREATE INDEX IF NOT EXISTS assertions_relation_target ON assertions(relation,object,id);
CREATE INDEX IF NOT EXISTS observations_chunk ON observations(chunk_id);
CREATE INDEX IF NOT EXISTS evidence_observation ON assertion_evidence(observation_id,assertion_id);
CREATE INDEX IF NOT EXISTS run_edges ON run_assertions(assertion_id,run_id);
CREATE INDEX IF NOT EXISTS refs_lookup ON citation_refs(book,start,end);
CREATE INDEX IF NOT EXISTS docs_work ON document_map(run_id,work_id);
CREATE INDEX IF NOT EXISTS chunks_document ON chunk_map(run_id,document_id);
CREATE INDEX IF NOT EXISTS chunks_subject ON chunk_map(run_id,('chunk:'||chunk_id));
'''


def now():
    return datetime.now(timezone.utc).isoformat()


def dumps(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def identity(namespace, *values):
    return namespace + ':' + hashlib.sha256(dumps(values).encode()).hexdigest()


def text_hash(text):
    return hashlib.sha256(text.encode()).hexdigest()


def checksum(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def readonly(path):
    db = sqlite3.connect(Path(path).resolve().as_uri() + '?mode=ro', uri=True, timeout=15)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA cache_size=-65536')
    db.execute('PRAGMA query_only=ON')
    return db


@contextmanager
def writer_lock(state, name='writer.lock'):
    root = Path(state) / 'graph-development'
    root.mkdir(parents=True, exist_ok=True)
    handle = (root / name).open('a+b')
    try:
        handle.seek(0)
        if os.name == 'nt':
            import msvcrt
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield
    finally:
        handle.close()


class Graph:
    def __init__(self, path):
        self.path = Path(path)
        self.closed = False
        self.run = None
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.path, timeout=30)
        self.db.row_factory = sqlite3.Row
        self.db.execute('PRAGMA foreign_keys=ON')
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('PRAGMA cache_size=-32768')
        self.db.executescript(SCHEMA)
        # Registry institutions are corporate authors, not historical people.
        # Repair the early additive-store mapping using explicit frozen metadata.
        self.db.execute("UPDATE entities SET kind='organization' WHERE kind='historical_person' AND json_extract(metadata,'$.entityType') IN ('institution','organization')")
        self.db.execute("INSERT OR IGNORE INTO entity_keys SELECT 'organization',k.key,k.entity_id FROM entity_keys k JOIN entities e ON e.id=k.entity_id WHERE e.kind='organization' AND k.namespace='historical_person'")
        self.db.execute("DELETE FROM entity_keys WHERE namespace='historical_person' AND entity_id IN (SELECT id FROM entities WHERE kind='organization')")
        previous = self.db.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()
        if previous and previous[0] != str(SCHEMA_VERSION):
            self.db.close()
            raise ValueError('Unsupported graph schema version')
        self.db.execute("INSERT OR IGNORE INTO meta VALUES('schema_version',?)", (str(SCHEMA_VERSION),))

    def entity(self, id, kind, label, metadata=None):
        old = self.db.execute('SELECT kind FROM entities WHERE id=?', (id,)).fetchone()
        if old and old[0] != kind:
            raise ValueError(f'Entity type collision: {id}')
        self.db.execute('INSERT OR IGNORE INTO entities VALUES(?,?,?,?)', (id, kind, label, dumps(metadata or {})))
        self.db.execute('INSERT OR IGNORE INTO entity_keys VALUES(?,?,?)', (kind, id, id))
        if self.run:
            self.db.execute('INSERT OR IGNORE INTO run_entities VALUES(?,?)',(self.run,id))
            self.db.execute('INSERT OR REPLACE INTO entity_versions VALUES(?,?,?,?)',(self.run,id,label,dumps(metadata or {})))
        return id

    def observation(self, run, snapshot, source, source_hash, locator, literal, method='source_record', rule='foundation-v1', chunk=None, document=None, start=None, end=None, chunk_hash=None, metadata=None):
        id = identity('observation', source_hash, locator, literal, method, rule, chunk, start, end, chunk_hash)
        self.db.execute('INSERT OR IGNORE INTO observations VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                        (id, snapshot, document, chunk, chunk_hash, start, end, literal, str(source), source_hash, dumps(locator), method, rule, dumps(metadata or {})))
        self.db.execute('INSERT OR IGNORE INTO run_observations VALUES(?,?)', (run, id))
        return id

    def assertion(self, run, subject, relation, object, evidence, basis='source_record', qualifiers=None, attribution='source', review='recorded'):
        if relation not in RELATIONS:
            raise ValueError('Relation is not permitted for automatic extraction')
        kinds = [self.db.execute('SELECT kind FROM entities WHERE id=?', (id,)).fetchone() for id in (subject, object)]
        if any(row is None for row in kinds) or kinds[0][0] not in RELATIONS[relation][0] or kinds[1][0] not in RELATIONS[relation][1]:
            raise ValueError(f'Invalid typed endpoints for {relation}')
        if not evidence:
            raise ValueError('Assertion requires reproducible evidence')
        for endpoint in (subject,object):
            self.db.execute('INSERT OR IGNORE INTO run_entities VALUES(?,?)',(run,endpoint))
        id = identity('assertion', subject, relation, object, qualifiers or {}, attribution, basis)
        self.db.execute('INSERT OR IGNORE INTO assertions VALUES(?,?,?,?,?,?,?,?)', (id, subject, relation, object, basis, dumps(qualifiers or {}), attribution, review))
        for observation in evidence:
            self.db.execute('INSERT OR IGNORE INTO assertion_evidence VALUES(?,?)', (id, observation))
        self.db.execute('INSERT OR IGNORE INTO run_assertions VALUES(?,?)', (run, id))
        return id

    def candidate(self, run, reason, metadata):
        id = identity('candidate', run, reason, metadata)
        self.db.execute('INSERT OR IGNORE INTO candidates VALUES(?,?,?,?)', (id, run, reason, dumps(metadata)))

    def checkpoint(self, run, phase, cursor):
        self.db.execute('INSERT OR REPLACE INTO checkpoints VALUES(?,?,?)', (run, phase, str(cursor)))
        self.db.commit()

    def cursor(self, run, phase, default='0'):
        row = self.db.execute('SELECT cursor FROM checkpoints WHERE run_id=? AND phase=?', (run, phase)).fetchone()
        return row[0] if row else default

    def close(self):
        if self.closed: return
        self.db.commit()
        self.db.close()
        self.closed = True
