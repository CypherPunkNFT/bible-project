"""Boundary, coordinate, invalidation and ownership checks on disposable inputs."""
import hashlib
import json
import io
import sqlite3
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch
from contextlib import redirect_stdout
from knowledge.library_extract import xml_text,html_text
from .section_contract import SCHEMA,SectionWriter,xml_render,html_render,resolve_segment,text_hash
from .section_catalog import document,calibration_scope,epub_sections
from .jobs import JobStore,StaleInput
from .inputs import packed
from .research_evaluation import questions


class Sections(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        self.db=sqlite3.connect(':memory:');self.db.row_factory=sqlite3.Row;self.db.executescript(SCHEMA)
        self.d={'document_id':'test-doc','title':'Test','work_verified':False,'edition_verified':False}

    def tearDown(self):self.db.close();self.temp.cleanup()

    def writer(self,texts):
        blocks=[{'ordinal':i,'text':s,'locator':'page '+str(i)} for i,s in enumerate(texts)]
        path=self.root/'cache.jsonl';raw=''.join(json.dumps(b)+'\n' for b in blocks).encode();path.write_bytes(raw)
        sha=hashlib.sha256(raw).hexdigest()
        return SectionWriter(self.db,'run',self.d,sha,blocks,'extraction-cache-block',str(path),sha)

    def test_xml_transform_and_native_hierarchy(self):
        raw=b'<TEI><teiHeader>header</teiHeader><text><body><div1 id="a"><head>Chapter I</head><p>Grace <hi>alone</hi>.</p><div2><head>Chapter I</head><p>A<word>B</word>C<gap reason="lost"/><pb n="4"/>end</p></div2></div1></body></text></TEI>'
        body,items=xml_render(raw);self.assertEqual(body,xml_text(raw));self.assertEqual(len(items),2)
        self.assertEqual(items[1]['parent'],items[0]['key']);self.assertNotEqual(items[0]['start'],items[1]['start'])
        self.assertIn('[Editorial gap: lost]',body);self.assertIn('[Source page 4]',body)
        w=self.writer([body]);w.add('document','document-representation','Test',0,len(body));w.native(items)
        self.assertEqual(w.count,3)

    def test_html_repeated_heading_is_positioned_without_find(self):
        raw=b'<html><body><nav>Skip</nav><h1>A <em>Title</em></h1><p>Chapter I</p><h2>Chapter I</h2><p>Text</p><h2>Chapter I</h2><p>Other</p><script>skip</script></body></html>'
        body,items=html_render(raw);self.assertEqual(body,html_text(raw));self.assertEqual(len(items),3)
        self.assertGreater(items[2]['start'],items[1]['start']);self.assertEqual(items[1]['parent'],items[0]['key'])
        self.assertEqual(body[items[1]['start']:items[1]['start']+9],'Chapter I')

    def test_entities_remain_literal_without_network_resolution(self):
        raw=b'<!DOCTYPE TEI [<!ENTITY x "secret">]><TEI><text><body><div><p>&x; tail</p></div></body></text></TEI>'
        self.assertEqual(xml_render(raw)[0],xml_text(raw));self.assertIn('&x;',xml_render(raw)[0])

    def test_epub_spine_order_and_native_heading_hierarchy(self):
        stream=io.BytesIO()
        html=b'<body><h1>Book</h1><p>Intro</p><h2>Chapter</h2><p>Body</p></body>'
        with zipfile.ZipFile(stream,'w') as z:
            z.writestr('META-INF/container.xml','<container><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>')
            z.writestr('OPS/book.opf','<package><manifest><item id="c" href="c.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c"/></spine></package>')
            z.writestr('OPS/c.xhtml',html)
        body=html_text(html);w=self.writer([body]);w.blocks[0]['locator']='EPUB section 1: OPS/c.xhtml'
        w.add('document','document-representation','Book',0,w.total)
        self.assertEqual(epub_sections(w,stream.getvalue(),w.blocks),3)
        self.assertEqual(self.db.execute("SELECT count(*) FROM sections WHERE kind='epub-spine-item'").fetchone()[0],1)
        self.assertEqual(self.db.execute('SELECT count(*) FROM sections WHERE parent_version_id IS NOT NULL').fetchone()[0],3)

    def test_changed_parent_versions_invalidate_children(self):
        w=self.writer(['abcdefgh']);w.add('parent','chapter','Parent',0,8)
        a=w.add('child','section','Child',1,3,'parent')
        w.add('parent','chapter','Parent',0,7)
        b=w.add('child','section','Child',1,3,'parent');self.assertNotEqual(a,b)

    def test_pdf_heading_span_crosses_pages_without_page_sections(self):
        w=self.writer(['CHAPTER I\nFirst page\n','continued second page\nCHAPTER II\nNext'])
        w.add('document','document-representation','Test',0,w.total);w.candidates()
        rows=self.db.execute("SELECT * FROM sections WHERE kind='heading-candidate' ORDER BY heading").fetchall()
        spans=self.db.execute('SELECT * FROM section_segments WHERE version_id=? ORDER BY ordinal',(rows[0]['version_id'],)).fetchall()
        self.assertEqual(len(spans),2);self.assertEqual(''.join(resolve_segment(s) for s in spans),'CHAPTER I\nFirst page\ncontinued second page\n')
        self.assertEqual(self.db.execute("SELECT count(*) FROM sections WHERE kind LIKE '%page%'").fetchone()[0],0)

    def test_roundtrip_unicode_and_changed_source_rejected(self):
        w=self.writer(['α χάρις — grace']);v=w.add('document','document-representation','Test',0,w.total)
        s=self.db.execute('SELECT * FROM section_segments WHERE version_id=?',(v,)).fetchone()
        self.assertEqual(resolve_segment(s),'α χάρις — grace')
        Path(s['path']).write_text('changed')
        with self.assertRaises(StaleInput):resolve_segment(s)

    def test_changed_boundary_new_version_stable_identity(self):
        w=self.writer(['CHAPTER I\nBody\nCHAPTER II\nEnd']);w.add('document','document-representation','Test',0,w.total)
        a=w.add('same','chapter','First',0,14,'document');b=w.add('same','chapter','First',0,15,'document')
        self.assertNotEqual(a,b)
        self.assertEqual(len({r[0] for r in self.db.execute("SELECT id FROM sections WHERE native_key='same'")}),1)

    def test_parent_containment_enforced(self):
        w=self.writer(['abcdefgh']);w.add('parent','chapter','Parent',2,6)
        with self.assertRaises(ValueError):w.add('child','section','Child',0,4,'parent')

    def test_atomic_resume_and_single_owner(self):
        path=self.root/'jobs.sqlite';store=JobStore(path);store.acquire();store.db.executescript(SCHEMA)
        other=JobStore(path)
        try:
            with self.assertRaises(RuntimeError):other.acquire()
            store.register('r','j','sections','d','fp','v')
            def fail(db):
                db.execute("INSERT INTO research_documents VALUES('r','d','x','x',0,0,'[]')")
                raise ValueError('deliberate failure')
            self.assertEqual(store.execute('j',fail),'failed')
            self.assertEqual(store.db.execute('SELECT count(*) FROM research_documents').fetchone()[0],0)
            self.assertEqual(store.execute('j',lambda db:0,retry_failed=True),'completed')
            self.assertEqual(store.execute('j',lambda db:1),'skipped')
            self.assertEqual(store.db.execute('SELECT attempts FROM jobs WHERE id=?',('j',)).fetchone()[0],2)
        finally:other.close();store.close()

    def test_group_commits_isolate_bad_input_and_reuse_good_jobs(self):
        store=JobStore(self.root/'batch.sqlite');store.acquire();store.db.executescript(SCHEMA)
        try:
            store.register_many([('r',job,'sections',job,'fp','v') for job in ('a','b','c')])
            def good(db,doc):
                db.execute('INSERT INTO research_documents VALUES(?,?,?,?,?,?,?)',('r',doc,'done','x',1,1,'[]'));return 1
            def bad(db):good(db,'bad');raise StaleInput('changed')
            result=store.execute_many([('a',lambda db:good(db,'a')),('b',bad),('c',lambda db:good(db,'c'))])
            self.assertEqual(result,{'a':'completed','b':'stale','c':'completed'})
            self.assertEqual([r[0] for r in store.db.execute('SELECT document_id FROM research_documents ORDER BY document_id')],['a','c'])
            self.assertEqual(store.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],2)
            self.assertEqual(store.execute_many([('a',lambda db:0),('b',lambda db:0)]),{'a':'skipped','b':'stale'})
        finally:store.close()

    def test_interrupted_group_rolls_back_facts_and_checkpoints(self):
        store=JobStore(self.root/'interrupted.sqlite');store.acquire();store.db.executescript(SCHEMA)
        store.register_many([('r',job,'sections',job,'fp','v') for job in ('a','b')])
        def good(db):db.execute("INSERT INTO research_documents VALUES('r','a','done','x',1,1,'[]')");return 1
        def interrupted(db):raise KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt):store.execute_many([('a',good),('b',interrupted)])
        self.assertEqual(store.db.execute('SELECT count(*) FROM research_documents').fetchone()[0],0)
        self.assertEqual(store.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],0)
        store.close();recovered=JobStore(self.root/'interrupted.sqlite');recovered.acquire()
        try:self.assertEqual([r[0] for r in recovered.db.execute('SELECT state FROM jobs ORDER BY id')],['pending','pending'])
        finally:recovered.close()

    def test_fresh_evaluation_is_frozen_balanced_and_unjudged(self):
        rows=questions();self.assertEqual(rows,questions());self.assertEqual(len(rows),120)
        self.assertEqual(len({r['id'] for r in rows}),120)
        for family in {r['family'] for r in rows}:
            self.assertEqual(sum(r['family']==family and r['split']=='reserved' for r in rows),8)
        self.assertTrue(all('unreviewed' in r['judgment_state'] for r in rows))

    def test_empty_source_has_no_invented_section(self):
        w=self.writer(['']);self.assertIsNone(w.add('document','document-representation','Empty',0,0));self.assertEqual(w.count,0)

    def test_cache_stream_changed_is_rejected(self):
        w=self.writer(['Body']);d={**self.d,'cache_path':w.path,'cache_expected_sha256':w.asset_hash,
            'source_path':str(self.root/'original.txt'),'quality':{'body_stream_sha256':'bad'}}
        with self.assertRaises(StaleInput):document(self.db,'r',d)

    def test_interrupted_full_population_matches_uninterrupted_release(self):
        from .section_catalog import run,output,query
        from .jobs import SCHEMA as JOB_SCHEMA
        from .products import SCHEMA as PRODUCT_SCHEMA
        from .text_pipeline import SCHEMA as TEXT_SCHEMA
        def fixture(project):
            analytics=project/'KnowledgeBase/library-analytics';analytics.mkdir(parents=True)
            text=sqlite3.connect(analytics/'text.sqlite3');text.executescript(TEXT_SCHEMA)
            products=sqlite3.connect(analytics/'products.sqlite3');products.executescript(JOB_SCHEMA+PRODUCT_SCHEMA)
            products.execute("INSERT INTO product_runs VALUES('parent','complete',0,0,'{}','{}','{}')")
            for i,body in enumerate(('CHAPTER I\nGrace','CHAPTER II\nFaith')):
                source=project/('source'+str(i)+'.txt');source.write_text(body)
                cache=project/('cache'+str(i)+'.jsonl');block={'text':body,'locator':source.name}
                cache.write_text(json.dumps(block)+'\n')
                sha=hashlib.sha256(cache.read_bytes()).hexdigest()
                stream=hashlib.sha256(packed({'ordinal':0,'locator':source.name,'sha256':text_hash(body),'id':None}).encode()).hexdigest()
                d={'document_id':'doc'+str(i),'kind':'library_text','title':'Title '+str(i),'language':'en',
                    'status':'completed','excluded_archive':False,'cache_path':str(cache),'source_path':str(source),
                    'source_family':'fixture','original_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
                    'text_run_id':'text','text_job_id':'tj'+str(i),'quality':{'body_stream_sha256':stream},
                    'work_verified':False,'edition_verified':False}
                products.execute('INSERT INTO document_dimensions(run_id,document_id,descriptor_json) VALUES(?,?,?)',('parent',d['document_id'],packed(d)))
                stat=cache.stat();text.execute('INSERT INTO text_input_files VALUES(?,?,?,?,?,?)',('text',d['document_id'],str(cache),sha,stat.st_size,stat.st_mtime_ns))
            text.commit();products.commit();text.close();products.close()
            summary=analytics/'summary.json';summary.write_text(packed({'state':'complete','text_bundle':{'database':str(analytics/'text.sqlite3'),'run_ids':['text']}}))
            (analytics/'latest-analytical-release.json').write_text(packed({'parent':{'run_id':'parent','database':str(analytics/'products.sqlite3'),'summary':str(summary)}}))
        first=self.root/'resume';first.mkdir();fixture(first)
        with patch('knowledge.library_analytics.section_catalog.background_priority'),redirect_stdout(io.StringIO()):
            self.assertEqual(run(first,calibrate=True),0)
            self.assertEqual(run(first,limit=1),0)
            db=sqlite3.connect(output(first)/'sections.sqlite3')
            full=db.execute("SELECT id FROM research_runs WHERE state='interrupted'").fetchone()[0];db.close()
            self.assertEqual(run(first,resume=True),0)
            summary=json.loads(Path(json.loads((output(first)/'latest-sections.json').read_text())['summary']).read_text())
            self.assertEqual(summary['validation']['accounted_supported_documents'],2)
            self.assertEqual(summary['counts']['sections'],4)
            self.assertEqual(query(first,'CHAPTER')['sections'],[])
            self.assertEqual(len(query(first,'CHAPTER',include_candidates=True)['sections']),2)
            windows=[json.loads(line) for line in (output(first)/'evaluations'/full/'source-windows.jsonl').read_text().splitlines()]
            for window in windows:
                i=window['document_id'][-1]
                original=hashlib.sha256((first/('source'+i+'.txt')).read_bytes()).hexdigest()
                self.assertEqual(window['independence_group'],original)
                self.assertEqual(window['split'],'reserved' if int(original[:8],16)%5 in (0,1) else 'development')
            db=sqlite3.connect(output(first)/'sections.sqlite3')
            attempts=db.execute("SELECT j.attempts FROM jobs j JOIN run_jobs r ON r.job_id=j.id WHERE r.run_id=? AND j.task='sections'",(full,)).fetchall()
            self.assertEqual(attempts,[(1,),(1,)])
            before=list(db.execute('SELECT version_id FROM run_sections WHERE run_id=? ORDER BY version_id',(full,)));db.close()
            release=output(first)/'releases'/full/'sections.jsonl';saved=release.read_bytes()
            self.assertEqual(run(first),0);self.assertEqual(release.read_bytes(),saved)
            alternate=output(first)/'uninterrupted'
            with patch('knowledge.library_analytics.section_catalog.output',return_value=alternate):
                self.assertEqual(run(first,calibrate=True),0);self.assertEqual(run(first),0)
            for name in ('sections.jsonl','section_segments.jsonl','documents.jsonl'):
                self.assertEqual((output(first)/'releases'/full/name).read_bytes(),
                    (alternate/'releases'/full/name).read_bytes())
            # A changed frozen cache must invalidate reuse, not silently return
            # a current complete result or mutate the last historical release.
            (first/'cache0.jsonl').write_text('changed')
            self.assertEqual(run(first),2);self.assertEqual(release.read_bytes(),saved)


if __name__=='__main__':unittest.main()
