import hashlib
import json
import sqlite3
from pathlib import Path
import pytest
from .alignment_contract import Compact, TextMap, bounds, SCHEMA, compact
from .section_contract import SCHEMA as SECTION_SCHEMA, SectionWriter, text_hash
from .section_alignment import Snapshot, align_document, verify_witnesses, precision, query, output
from .jobs import JobStore, StaleInput
from ..store import SCHEMA as CORPUS_SCHEMA, Writer


@pytest.mark.parametrize('text', ['  α β\nγ  ', '🙏a\t\tb  ', '', ' \n ', 'a', 'é e\u0301'])
def test_compact_offsets_roundtrip_unicode(text):
    mapping=Compact(text)
    for index,char in enumerate(mapping.text):
        start=mapping.original(index);end=mapping.original(index+1,end=True)
        assert compact(text[start:end])==char
        assert mapping.normalized(start)==index
        assert mapping.normalized(end)==index+1


def test_literal_ordered_repeated_chunks_keep_distinct_positions():
    source='  same αβ  \nsame αβ\n'
    target=[{'text':'same αβ','id':'first'},{'text':'same αβ','id':'second'}]
    mapping=TextMap(source,''.join(b['text'] for b in target),parts=[b['text'] for b in target])
    pieces=list(mapping.pieces(0,len(source),bounds(target)))
    assert [(p['source_start'],p['target']['id']) for p in pieces]==[(2,'first'),(12,'second')]
    assert all(p['state']=='exact' for p in pieces)


def test_normalized_alignment_never_claims_literal_equality():
    source='α\n\nβ  γ🙏'; target=[{'text':'α β '},{'text':'γ🙏'}]
    mapping=TextMap(source,''.join(b['text'] for b in target))
    rows=list(mapping.pieces(3,len(source),bounds(target)))
    assert rows and all(p['state']=='approximate' for p in rows)
    assert sum(p['meaningful_characters'] for p in rows)==3
    for p in rows:
        assert compact(source[p['source_start']:p['source_end']])==compact(p['target']['text'][p['target_start']:p['target_end']])


def test_changed_prose_is_partial_instead_of_stretched_over_missing_text():
    source='Alpha opening thought. Deleted substantial paragraph. Omega final thought.'
    target=[{'text':'Alpha opening thought. Omega final thought.'}]
    mapping=TextMap(source,target[0]['text'])
    rows=list(mapping.pieces(0,len(source),bounds(target)))
    assert rows and sum(p['meaningful_characters'] for p in rows)<len(compact(source))
    assert precision(rows,sum(p['meaningful_characters'] for p in rows),len(compact(source)))=='partial'
    assert all(p['state']=='approximate' for p in rows)


def test_non_whitespace_diff_is_bounded_and_case_sensitive():
    source='Original passage word '*100
    mapping=TextMap(source,'CHANGED passage word '*100,token_limit=20)
    assert not mapping.runs
    assert mapping.reason=='non-whitespace-change-exceeds-token-diff-bound'
    assert not TextMap('α','Α').runs


def fixture_project(tmp_path, reader=True):
    project=tmp_path/'project';site=project/'Website';kb=project/'KnowledgeBase'
    source=project/'sources/source.txt';cache=kb/'cache.jsonl'
    source.parent.mkdir(parents=True);kb.mkdir()
    blocks=[{'text':'Repeat αβ. The first section has preserved source words and a long sentence.','locator':'Source page 1','ordinal':0},
            {'text':'\nRepeat αβ. The second section continues across a page and ends here.','locator':'Source page 2','ordinal':1}]
    text=''.join(b['text'] for b in blocks);source.write_text(text,encoding='utf-8')
    original=hashlib.sha256(source.read_bytes()).hexdigest()
    cache.write_text(''.join(json.dumps(b,ensure_ascii=False)+'\n' for b in blocks),encoding='utf-8')
    doc='library:text:'+original
    descriptor={'document_id':doc,'source_path':str(source),'original_sha256':original,'cache_path':str(cache),
        'cache_expected_sha256':hashlib.sha256(cache.read_bytes()).hexdigest(),'title':'Test αβ','characters':len(text),
        'source_family':'fixture','work_id':'work-test','work_verified':True,'edition_id':'edition-test','edition_verified':True,'readers':[]}
    section_root=kb/'library-knowledge/connected-research';section_root.mkdir(parents=True)
    section_db=section_root/'sections.sqlite3';sdb=sqlite3.connect(section_db)
    sdb.executescript(SECTION_SCHEMA)
    sdb.execute('INSERT INTO research_runs VALUES(?,?,?,?,?)',('kr101-fixture','complete','now','{}','{}'))
    sdb.execute('INSERT INTO research_scope VALUES(?,?,?,?,?,?)',('kr101-fixture',doc,'cache','supported','fixture',json.dumps(descriptor)))
    writer=SectionWriter(sdb,'kr101-fixture',descriptor,descriptor['cache_expected_sha256'],blocks,
                         'extraction-cache-block',str(cache),descriptor['cache_expected_sha256'])
    root=writer.add('document','document-representation','Book',0,len(text))
    cross=writer.add('cross','chapter','Across two pages',10,len(text)-5,'document')
    candidate=writer.add('candidate','heading-candidate','Repeat αβ',0,15,'document',state='candidate-unreviewed')
    sdb.commit();sdb.close()
    summary=section_root/'summary.json';summary.write_text(json.dumps({'state':'complete'}))
    (section_root/'latest-sections.json').write_text(json.dumps({'run_id':'kr101-fixture','database':str(section_db),'summary':str(summary)}))
    cdb=sqlite3.connect(kb/'knowledge.sqlite3');cdb.executescript(CORPUS_SCHEMA)
    cdb.execute('INSERT INTO meta VALUES(?,?)',('built_at','fixture-new-corpus'))
    corpus_writer=Writer(cdb,{'state_dir':kb,'chunk_chars':30})
    corpus_writer.file(source)
    corpus_writer.document(doc,'Changed title αβ','library_text',source,'Fixture',metadata={'original_sha256':original})
    for b in blocks:corpus_writer.chunk(doc,'Changed title αβ',b['text'],'library_text',locator=b['locator'])
    cdb.commit();cdb.close()
    readers=site/'public/content/teacher-library';(readers/'records').mkdir(parents=True)
    rid='held-fixture';record={'id':rid,'sha256':original,'title':'Test αβ','pages':2,'availability':'on-site-text' if reader else 'permission-required',
        'workId':'work-test','editionId':'edition-test','credit':'Keep credit','reviewWarning':'Keep warning'}
    # An equal-looking work from different source bytes must never receive a link.
    other={**record,'id':'other-edition','sha256':'b'*64,'editionId':'edition-other'}
    (readers/'records/00.json').write_text(json.dumps({rid:record,other['id']:other}))
    pages=readers/'text'/rid;pages.mkdir(parents=True)
    for index,body in enumerate((text[:60],text[60:])):
        (pages/(str(index)+'.json')).write_text(json.dumps({'blocks':[{'text':body,'locator':'Reading page '+str(index+1)}]},ensure_ascii=False),encoding='utf-8')
    for relative in ('src/pages/teachers/shared/acquired.ts','src/pages/teachers/LibraryWorkPage.tsx'):
        path=site/relative;path.parent.mkdir(parents=True,exist_ok=True);path.write_text('Fixture containing-book reader')
    return project,descriptor,{'root':root,'cross':cross,'candidate':candidate,'reader':rid,'text':text}


def aligned_fixture(tmp_path, reader=True):
    project,descriptor,ids=fixture_project(tmp_path,reader)
    snapshot=Snapshot(project)
    store=JobStore(project/'KnowledgeBase/alignment-test.sqlite3');store.acquire();store.db.executescript(SCHEMA)
    for r in snapshot.reader_records:store.db.execute('INSERT INTO reader_records VALUES(?,?,?,?,?,?,?)',('run',*r))
    store.db.commit()
    job='job';store.register('run',job,'alignment','doc',job,'test')
    result=store.execute(job,lambda db:align_document(snapshot,db,'run',descriptor))
    return project,descriptor,ids,snapshot,store,result


def test_real_source_chunks_pages_new_title_and_candidate_state(tmp_path):
    project,d,ids,snapshot,store,result=aligned_fixture(tmp_path)
    try:
        assert result=='completed'
        status=dict(store.db.execute('SELECT * FROM section_alignment_status WHERE version_id=?',(ids['cross'],)).fetchone())
        assert status['chunk_state']=='exact' and status['reader_state']=='exact'
        assert status['chunk_covered']==status['meaningful_characters']==status['reader_covered']
        assert status['navigation_state']=='containing-book'
        assert {r[0] for r in store.db.execute('SELECT page_index FROM section_reader_spans WHERE version_id=?',(ids['cross'],))}=={0,1}
        assert store.db.execute('SELECT state FROM section_index WHERE version_id=?',(ids['candidate'],)).fetchone()[0]=='candidate-unreviewed'
        assert store.db.execute('SELECT count(*) FROM section_destinations WHERE reader_id=?',('other-edition',)).fetchone()[0]==0
        assert all('?page=' not in r[0] for r in store.db.execute('SELECT route FROM section_destinations WHERE route IS NOT NULL'))
        witnesses=verify_witnesses(snapshot,store.db,'run')
        assert witnesses['passed']>0 and witnesses['failed']==0
    finally:store.close();snapshot.close()


def test_unavailable_reader_does_not_become_a_text_destination(tmp_path):
    project,d,ids,snapshot,store,result=aligned_fixture(tmp_path,False)
    try:
        assert result=='completed'
        assert store.db.execute('SELECT count(*) FROM section_reader_spans').fetchone()[0]==0
        row=store.db.execute('SELECT * FROM section_destinations WHERE version_id=?',(ids['cross'],)).fetchone()
        assert row['state']=='unresolved' and row['reason']=='reader-body-not-offered-on-site'
        assert store.db.execute('SELECT chunk_state FROM section_alignment_status WHERE version_id=?',(ids['cross'],)).fetchone()[0]=='exact'
    finally:store.close();snapshot.close()


def test_corpus_swap_stops_instead_of_mixing_generations(tmp_path):
    project,d,ids=fixture_project(tmp_path);snapshot=Snapshot(project)
    try:
        with (project/'KnowledgeBase/knowledge.sqlite3').open('ab') as stream:stream.write(b'changed')
        with pytest.raises(StaleInput,match='corpus changed'):snapshot.current_document(d)
    finally:snapshot.close()


def test_failure_rolls_back_facts_and_checkpoint_and_resume_reuses_success(tmp_path):
    project,d,ids,snapshot,store,result=aligned_fixture(tmp_path)
    try:
        before=store.db.execute('SELECT count(*) FROM section_chunks').fetchone()[0]
        assert store.execute('job',lambda db:pytest.fail('must reuse successful checkpoint'))=='skipped'
        store.register('run','bad','alignment','bad','bad','test')
        def fail(db):
            db.execute("INSERT INTO alignment_documents VALUES('run','bad','partial',0,0,0,'{}')")
            raise StaleInput('changed source')
        assert store.execute('bad',fail)=='stale'
        assert store.db.execute("SELECT count(*) FROM alignment_documents WHERE document_id='bad'").fetchone()[0]==0
        assert not store.db.execute("SELECT 1 FROM checkpoints WHERE job_id='bad'").fetchone()
        assert store.db.execute('SELECT count(*) FROM section_chunks').fetchone()[0]==before
    finally:store.close();snapshot.close()


def test_query_exposes_pinned_source_coordinates_and_keeps_candidates_opt_in(tmp_path):
    project,d,ids,snapshot,store,result=aligned_fixture(tmp_path)
    try:
        contract={'section_database':snapshot.pointer['database'],'section_run':snapshot.section_run,
                  'corpus_build':snapshot.corpus_build}
        with store.db:store.db.execute('INSERT INTO alignment_runs VALUES(?,?,?,?,?)',('run','complete','now',json.dumps(contract),'{}'))
        root=output(project);root.mkdir(parents=True,exist_ok=True)
        (root/'latest-alignment.json').write_text(json.dumps({'run_id':'run','database':str(store.path)}))
        assert query(project,term='Repeat')['results']==[]
        candidate=query(project,term='Repeat',include_candidates=True)['results'][0]
        assert candidate['state']=='candidate-unreviewed'
        result=query(project,section=ids['cross'])
        assert result['corpus_build']=='fixture-new-corpus'
        row=result['results'][0]
        assert row['source_identity']['native_key']=='cross'
        assert {s['block_ordinal'] for s in row['source_segments']}=={0,1}
        assert row['chunks'] and row['reader_locations']
        assert row['destinations'][0]['state']=='containing-book'
    finally:store.close();snapshot.close()
