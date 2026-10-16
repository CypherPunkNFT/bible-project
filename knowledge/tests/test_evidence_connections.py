"""Reference/location boundaries and freshness, on disposable fixtures."""
import sqlite3
import xml.etree.ElementTree as ET

import pytest

from knowledge.evidence_collections import connections as c
from knowledge.evidence_collections.capture import capture
from knowledge.evidence_collections.assemble import dependency, sealed
from knowledge.evidence_collections.contract import sha256_file
from knowledge.settings import write_json
from knowledge.tests.test_evidence_collections import sample


def test_gap_prefix_does_not_join_or_quote_missing_text():
    e=ET.fromstring('<p xmlns="http://www.tei-c.org/ns/1.0">Known <hi>good</hi> words<gap reason="illegible"/> missing continuation</p>')
    assert c.before_gap(e)=='Known good words'


def test_whitespace_matching_retains_literal_offsets():
    text='Before. Alpha\r\n  beta\t gamma. After.'
    hit=c.locate('Alpha beta gamma.',[dict(id='c',text=text,locator='part 1')])[0]
    assert text[hit['start']:hit['end']]=='Alpha\r\n  beta\t gamma.'
    assert c.locate('Alpha beta gamma.',[dict(id='c',text='Alpha beta altered.',locator='part 1')])==[]


def test_ambiguous_locations_are_not_silently_selected():
    chunks=[dict(id=str(i),text='Same wording.',locator='part '+str(i)) for i in range(2)]
    assert len(c.locate('Same wording.',chunks))==2
    with pytest.raises(ValueError,match='Repeated'):c.locate('Repeat',[dict(id='x',text='Repeat Repeat',locator='x')])


@pytest.mark.parametrize('heading,chapter', [('Vers. 34. Words.',5),('An incidental reference to 2.',1),('Vers. 4. Words 3. More.',1)])
def test_bad_reference_labels_fail(heading,chapter):
    with pytest.raises(ValueError):c.heading_verses(heading,chapter)


def test_split_verse_labels_and_unpunctuated_second_label():
    assert c.heading_verses('Vers. -15. Text 16. More.',2)==[15,16]
    assert c.heading_verses('Vers. 3. Text 4 Whereby more.',3)==[3,4]


def test_commentary_parser_allows_spacing_and_excludes_generic_citations():
    root=ET.fromstring('<ThML><div3 title="Ephesians 5: 3-7" id="a"/><p>Ephesians 2:8</p><div3 title="Galatians 2:8"/></ThML>')
    rows=list(c.source_sections('calvin-commentary',root))
    assert len(rows)==1 and rows[0]['verses']==[3,4,5,6,7]


def test_sermons_remain_chapter_only_without_inferred_verse_ranges():
    root=ET.fromstring('<TEI xmlns="http://www.tei-c.org/ns/1.0"><div type="sermon"><head>The first Sermon upon the sixth Chapter.</head><p>Mentions verse 2.</p></div></TEI>')
    row=list(c.source_sections('calvin-sermons',root))[0]
    assert row['chapter']==6 and row['verses']==[] and row['granularity']=='chapter-only'


def test_literal_heading_error_is_not_silently_corrected():
    assert c.heading_verses('Vers. 5, To the praise of the glory of His Grace.',1)==[5]


def test_immutable_write_preserves_bytes_and_refuses_changed_artifacts(tmp_path):
    path=tmp_path/'object.json';c.immutable_write(path,dict(a=1));stamp=path.stat().st_mtime_ns
    c.immutable_write(path,dict(a=1));assert path.stat().st_mtime_ns==stamp
    with pytest.raises(ValueError,match='new private folder'):c.immutable_write(path,dict(a=2))


def test_main_bible_change_invalidates_connection_package(sample,tmp_path):
    cfg,spec,_=sample;cfg['state_dir']=tmp_path/'KnowledgeBase'
    folder=cfg['state_dir']/'library-knowledge/test';folder.mkdir(parents=True)
    collection=capture(cfg,spec)
    with sqlite3.connect(cfg['db']) as db:
        db.execute('CREATE TABLE verses(id TEXT,edition TEXT,book TEXT,chapter INT,verse_start INT,verse_end INT,text TEXT)')
        db.execute("INSERT INTO verses VALUES('verse:kjv:EPH:1:1','kjv','EPH',1,1,1,'Fixture text')")
    db=c.connect(cfg['db'],readonly=True);original=c.bible_rows(db,1);db.close()
    package=sealed(dict(id=collection['id'],collection=collection,chapter=1,publication='private',
                        bibleMainText=dict(fingerprint=c.fingerprint(original)),dependencies=[dependency(cfg,'corpus-evidence',id='chosen')]))
    path=folder/'objects/test.json';write_json(path,package)
    write_json(folder/'manifest.json',sealed(dict(collections=[dict(id=collection['id'],path='objects/test.json',sha256=sha256_file(path),integrity=package['integrity'])])))
    assert c.check(cfg,folder)['valid']
    with sqlite3.connect(cfg['db']) as db:db.execute("UPDATE verses SET text='Changed'")
    result=c.check(cfg,folder)
    assert not result['valid'] and result['chapters'][0]['changedDependencies'][0]['kind']=='main-Bible-text'
