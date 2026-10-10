"""SQLite is the authoritative corpus, provenance, references and coverage manifest."""
import hashlib
import json
import re
import sqlite3
import unicodedata
from pathlib import Path

SCHEMA = """
PRAGMA journal_mode=DELETE;
PRAGMA foreign_keys=ON;
CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE documents(id TEXT PRIMARY KEY, title TEXT NOT NULL, kind TEXT NOT NULL,
 source TEXT NOT NULL, licence TEXT NOT NULL, language TEXT NOT NULL, edition TEXT NOT NULL,
 metadata TEXT NOT NULL);
CREATE TABLE chunks(rowid INTEGER PRIMARY KEY, id TEXT UNIQUE NOT NULL,
 document_id TEXT NOT NULL REFERENCES documents(id), title TEXT NOT NULL, text TEXT NOT NULL,
 search_text TEXT NOT NULL, kind TEXT NOT NULL, language TEXT NOT NULL, edition TEXT NOT NULL,
 book TEXT NOT NULL, chapter INTEGER NOT NULL, verse_start INTEGER NOT NULL, verse_end INTEGER NOT NULL,
 link TEXT NOT NULL, locator TEXT NOT NULL, embed_text TEXT NOT NULL);
CREATE INDEX chunks_doc ON chunks(document_id);
CREATE INDEX chunks_filter ON chunks(kind,edition,book,chapter);
CREATE VIRTUAL TABLE chunks_fts USING fts5(title,search_text,content=chunks,content_rowid=rowid,
 tokenize='unicode61 remove_diacritics 2');
CREATE TABLE verses(id TEXT PRIMARY KEY, edition TEXT NOT NULL, book TEXT NOT NULL,
 chapter INTEGER NOT NULL, label TEXT NOT NULL, verse_start INTEGER NOT NULL,
 verse_end INTEGER NOT NULL, text TEXT NOT NULL, metadata TEXT NOT NULL);
CREATE INDEX verse_lookup ON verses(edition,book,chapter,verse_start,verse_end);
CREATE TABLE edges(id INTEGER PRIMARY KEY, subject TEXT NOT NULL, relation TEXT NOT NULL,
 object TEXT NOT NULL, source TEXT NOT NULL, metadata TEXT NOT NULL);
CREATE INDEX edges_from ON edges(subject,relation);
CREATE INDEX edges_to ON edges(object,relation);
CREATE TABLE references_to(document_id TEXT NOT NULL REFERENCES documents(id), edition TEXT NOT NULL,
 start INTEGER NOT NULL, end INTEGER NOT NULL, source TEXT NOT NULL);
CREATE INDEX references_lookup ON references_to(edition,start,end);
CREATE TABLE files(path TEXT PRIMARY KEY, sha256 TEXT NOT NULL, bytes INTEGER NOT NULL,
 status TEXT NOT NULL, detail TEXT NOT NULL);
"""


def connect(path, readonly=False):
    if readonly:
        db = sqlite3.connect(Path(path).resolve().as_uri() + "?mode=ro", uri=True, timeout=30)
    else:
        db = sqlite3.connect(path, timeout=30)
    db.row_factory = sqlite3.Row
    return db


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def search_text(text):
    """Retain original text separately; segment CJK characters for unicode61's word index."""
    text = unicodedata.normalize("NFKC", text)
    return re.sub(r"([\u3400-\u9fff\u3040-\u30ff])", r" \1 ", text)


def split_text(text, limit=1500):
    """Bound every chunk, preserving all content including long non-space-separated text."""
    text = text.strip()
    start = 0
    while start < len(text):
        end = min(start + limit, len(text))
        if end < len(text):
            split = max(text.rfind("\n", start + limit // 2, end), text.rfind(" ", start + limit // 2, end))
            if split > start:
                end = split
        yield text[start:end].strip()
        start = end
        while start < len(text) and text[start].isspace():
            start += 1


def chunk_parts(text, locator, limit):
    for part, body in enumerate(split_text(text, limit)):
        location = f"{locator} · part {part + 1}" if len(text) > limit else locator
        yield body, search_text(body), location


class Writer:
    def __init__(self, db, config):
        self.db, self.config = db, config
        self.seen_files = set()
        try:
            self.prepared_documents = set(json.loads((config['state_dir'] / 'cpu-preparation/source-hashes.json').read_text('utf-8')))
        except (OSError, ValueError, TypeError):
            self.prepared_documents = set()
        markers = config['state_dir'] / 'cpu-preparation/document-markers'
        if markers.exists():
            self.prepared_documents.update('library:text:' + path.stem for path in markers.glob('*.json'))

    def file(self, path, status="indexed", detail=""):
        path = Path(path).resolve()
        if path in self.seen_files:
            return
        self.seen_files.add(path)
        with path.open("rb") as stream:
            checksum = hashlib.file_digest(stream, "sha256").hexdigest()
        self.db.execute("INSERT INTO files VALUES(?,?,?,?,?)", (
            str(path), checksum, path.stat().st_size, status, detail))

    def document(self, id, title, kind, source, licence, language="en", edition="", metadata=None):
        self.db.execute("INSERT INTO documents VALUES(?,?,?,?,?,?,?,?)", (
            id, title, kind, str(source), licence, language, edition,
            json.dumps(metadata or {}, ensure_ascii=False)))

    def chunk(self, doc, title, text, kind, language="en", edition="", book="", chapter=0,
              verse_start=0, verse_end=0, link="", locator=""):
        if not text.strip():
            return
        # Title + source-locator are part of identity; changed text never reuses a stale vector.
        from .chunk_cache import prepared_parts
        parts = prepared_parts(self.config, text, locator) if doc in self.prepared_documents else chunk_parts(text, locator, self.config['chunk_chars'])
        for body, searchable, location in parts:
            embedding = f"{title}\n{body}"
            id = digest(json.dumps([doc, location, embedding], ensure_ascii=False))
            self.db.execute("INSERT INTO chunks(id,document_id,title,text,search_text,kind,language,edition,book,chapter,verse_start,verse_end,link,locator,embed_text) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (
                id, doc, title, body, searchable, kind, language, edition, book, chapter,
                verse_start, verse_end, link, location, embedding))

    def edge(self, subject, relation, object, source, metadata=None):
        self.db.execute("INSERT INTO edges(subject,relation,object,source,metadata) VALUES(?,?,?,?,?)", (
            subject, relation, object, str(source), json.dumps(metadata or {}, ensure_ascii=False)))

    def reference(self, doc, start, end=None, edition="kjv", source=""):
        self.db.execute("INSERT INTO references_to VALUES(?,?,?,?,?)", (doc, edition, start, end or start, str(source)))
