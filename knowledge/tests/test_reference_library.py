import json
import sqlite3
import struct
import zlib

import pytest
from lxml import etree

from knowledge.reference_library import import_topics, lexical_text, sword_entries, xml_prose
from knowledge.source_audit import source_drift
from knowledge.store import SCHEMA, Writer


def sword_fixture(base, entry=b'<entryFree><p>See <ref>Aleph</ref>.</p></entryFree>'):
    raw = struct.pack('<III', 1, 12, len(entry)) + entry
    compressed = zlib.compress(raw)
    key = b'A\r\n' + struct.pack('<II', 0, 0)
    for extension, data in {
        '.idx': struct.pack('<II', 0, len(key)), '.dat': key,
        '.zdx': struct.pack('<II', 0, len(compressed)), '.zdt': compressed,
    }.items():
        base.with_suffix(extension).write_bytes(data)


def test_sword_dictionary_preserves_inline_article_and_rejects_invalid_pointer(tmp_path):
    base = tmp_path / 'isbe'
    sword_fixture(base)
    number, key, article = next(sword_entries(base))
    assert (number, key) == (0, 'A')
    assert xml_prose(etree.fromstring(article)) == 'See Aleph.'
    base.with_suffix('.idx').write_bytes(struct.pack('<II', 10000, 10))
    with pytest.raises(ValueError, match='bounds'):
        list(sword_entries(base))


def test_lexicon_attributes_are_searchable_and_external_entities_are_not():
    parser = etree.XMLParser(resolve_entities=False, no_network=True)
    node = etree.fromstring(b'<!DOCTYPE entry [<!ENTITY secret SYSTEM "file:///secret">]><entry><greek unicode="Alpha" translit="A"/><def>first letter</def>&secret;</entry>', parser)
    text = lexical_text(node)
    assert 'unicode=Alpha' in text and 'translit=A' in text and 'first letter' in text
    assert 'file:///secret' not in text


def config(tmp_path):
    cfg = {'site_dir': tmp_path / 'Website', 'sources_dir': tmp_path / 'sources', 'chunk_chars': 1500}
    cfg['sources_dir'].mkdir()
    (cfg['site_dir'] / 'data/topics/t').mkdir(parents=True)
    return cfg


def test_topics_follow_index_preserve_references_and_ignore_old_files(tmp_path):
    cfg = config(tmp_path)
    folder = cfg['site_dir'] / 'data/topics'
    (folder / 'index.json').write_text(json.dumps({'source': 'Torrey', 'categories': [], 'topics': {'faith': {'f': 2}}}))
    (folder / 't/2.json').write_text(json.dumps({'faith': {'id': 'faith', 'title': 'Faith', 'refs': [[1001001, 1001002]]}}))
    (folder / 'faith.json').write_text('{"stale":true}')
    db = sqlite3.connect(':memory:'); db.executescript(SCHEMA)
    report = import_topics(Writer(db, cfg), {'books': [{'num': 1, 'name': 'Genesis'}]})
    assert report['topics'] == 1
    assert db.execute('SELECT start,end FROM references_to').fetchall() == [(1001001, 1001002)]
    assert 'Genesis 1:1' in db.execute("SELECT text FROM chunks WHERE document_id='topic:faith'").fetchone()[0]
    assert db.execute('SELECT count(*) FROM files').fetchone()[0] == 2


def test_source_audit_catches_changed_bytes_and_files_outside_library(tmp_path):
    cfg = config(tmp_path)
    source = cfg['sources_dir'] / 'new-reference.txt'; source.write_text('one')
    missing = cfg['sources_dir'] / 'missing.txt'; missing.write_text('held')
    db = sqlite3.connect(':memory:'); db.executescript(SCHEMA)
    writer = Writer(db, cfg); writer.file(source); writer.file(missing)
    source.write_text('two'); missing.unlink()
    new = cfg['sources_dir'] / 'new.xml'; new.write_text('<new/>')
    report = source_drift(cfg, db)
    assert report['changed'] == [str(source)]
    assert report['new'] == [str(new)]
    assert report['missing'] == [str(missing)]
