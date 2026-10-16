"""LA-02 source offsets, scope coverage, restart and multilingual boundaries."""
import hashlib
import json
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path
from knowledge.enrichment.citations import CitationParser,boundary_citations
from .build import DEFAULT_OUT
from .quality import Quality
from .references import ReferenceScanner
from .structure import sections,xml_sections
from .text_pipeline import run_text,analyse,prepare,SCHEMA
from .verify_release import verify as verify_release
from .verify_text import verify as verify_witnesses
from .bundle_text import bundle,finish

BOOKS = [{'code':c,'name':n} for c,n in [('jhn','John'),('1jn','1 John'),('psa','Psalms'),('rom','Romans'),('heb','Hebrews'),('jud','Jude'),('2th','2 Thessalonians'),('1ti','1 Timothy')]]
BOUNDS = {(b['code'],c):200 for b in BOOKS for c in range(1,2 if b['code']=='jud' else 151)}


def keys(values):
    return sorted((h['start'],h['end'],h.get('book'),h.get('chapter'),h.get('verse'),h.get('endChapter'),h.get('endVerse'),h.get('reason')) for h in values)


class ReferencesTests(unittest.TestCase):
    def setUp(self):
        self.parser = CitationParser(BOOKS,BOUNDS)
        self.scanner = ReferenceScanner(self.parser)

    def test_accelerated_scan_equivalent_on_syntax_and_negative_boundaries(self):
        cases = ['John 3:16, 18; 4:1-3','1 John 2:20–21; I John 3:6','John3:16',
                 'Ps. cxix. 1. 3. 9.','Hebr. xii. ver. 2','John chapter 3 and Romans ch. 8.',
                 'I am John II and not a citation. John 3:201 is outside bounds.',
                 'The exposition of 1 John.\n2:3\n4:5\n', 'John\n3:16\n\n4:1\nprose interrupts\n5:2',
                 'John'+' '*500+'3:16', 'Rom. viii. i am uncertain.','John 3:16-4:3','Pſal. 57. 1',
                 'Jude 15.2 Theſ. 1.8, 9.',
                 'Rom. viii. i'+' '*500+'am uncertain.',
                 'Nothing to cite; chapter 3; 1962; this is 123; namesakes of John.',
                 'Hebr.\n'+''.join(str(i)+':2\n' for i in range(1,14))]
        for text in cases:
            with self.subTest(text=text[:80]):
                old,new = self.parser.extract(text),self.scanner.extract(text)
                self.assertEqual(keys(old[0]),keys(new[0]))
                self.assertEqual(keys(old[1]),keys(new[1]))
                for hit in new[0]: self.assertEqual(text[hit['start']:hit['end']],hit['literal'])

    def test_index_spans_are_heading_and_entry_not_a_growing_quote(self):
        text = 'John\n3:16\n4:1\n'
        hits,_ = self.scanner.extract(text)
        hit = next(h for h in hits if h.get('indexEntry')=='4:1')
        spans = self.scanner.spans(text,hit)
        self.assertEqual([text[a:b] for a,b in spans],['John','4:1'])

    def test_unrecognized_unicode_ordinal_does_not_abort_valid_neighbor(self):
        found,rejected = self.scanner.extract('John 3:16. Then ı Timothy 2:3.')
        self.assertTrue(any(h['book']=='jhn' and h['chapter']==3 for h in found))
        self.assertTrue(any(h['reason']=='unsupported-book-alias-normalization' for h in rejected))

    def test_cross_chunk_match_requires_same_document_and_section(self):
        left = {'id':'a','document_id':'d','text':'Read John 3:','locator':'Section · part 1'}
        right = {'id':'b','document_id':'d','text':'16 in context.','locator':'Section · part 2'}
        hits = boundary_citations(self.parser,left,right)
        self.assertEqual(len(hits),1)
        right['document_id'] = 'other'
        self.assertEqual(boundary_citations(self.parser,left,right),[])
        right['document_id'] = 'd';right['locator'] = 'different section'
        self.assertEqual(boundary_citations(self.parser,left,right),[])


class QualityStructureTests(unittest.TestCase):
    def test_metrics_preserve_script_and_quality_distinctions(self):
        q = Quality();q.add('Greek αβ and Latin text\n\ufffd\x01\n');q.add('Greek αβ and Latin text\n\ufffd\x01\n')
        r = q.result()
        self.assertEqual(r['replacement_characters'],2)
        self.assertEqual(r['control_characters'],2)
        self.assertEqual(r['repeated_blocks'],1)
        self.assertEqual(r['scripts']['GREEK'],4)
        self.assertEqual(r['repeated_lines'],2)

    def test_markers_are_printed_labels_not_reader_page_numbers(self):
        rows = list(sections({'text':'[Source page xii]\nCHAPTER IV\nText','locator':'A00001.xml'}))
        page = next(r for r in rows if r['kind']=='printed-page-marker')
        self.assertEqual(page['printed_page_label'],'xii');self.assertIsNone(page['page_ordinal'])

    def test_xml_structure_requires_original_hash_and_preserves_ids(self):
        root = DEFAULT_OUT/'test-runtime';root.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=root) as temp:
            path = Path(temp)/'source.xml'
            raw = b'<TEI><text><body><div xml:id="s1"><head>Section</head><pb n="xii"/><p>John 3:16</p></div></body></text></TEI>'
            path.write_bytes(raw)
            values,gap = xml_sections(path,hashlib.sha256(raw).hexdigest())
            self.assertIsNone(gap)
            self.assertEqual(next(v for v in values if v['kind']=='xml-div')['xml_id'],'s1')
            self.assertEqual(next(v for v in values if v['kind']=='xml-pb')['printed_page_label'],'xii')
            self.assertEqual(xml_sections(path,'b'*64)[1],'original-xml-hash-not-verified')


class PipelineTests(unittest.TestCase):
    def test_identical_bytes_at_changed_paths_or_assertions_invalidate_coordinates(self):
        root=DEFAULT_OUT/'test-runtime';root.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=root) as temp:
            a=Path(temp)/'a.jsonl';b=Path(temp)/'b.jsonl'
            a.write_text('{"text":"John 3:16"}\n',encoding='utf-8');b.write_bytes(a.read_bytes())
            d={'excluded_archive':False,'cache_path':str(a),'source_path':str(Path(temp)/'original.txt'),
               'original_sha256':None,'language':'en','kind':'library_text','body_adapter':'extraction-cache'}
            first,_=prepare(d,Path(temp)/'corpus.sqlite3')
            moved,_=prepare({**d,'cache_path':str(b)},Path(temp)/'corpus.sqlite3')
            asserted,_=prepare({**d,'original_sha256':'a'*64},Path(temp)/'corpus.sqlite3')
            self.assertEqual(first['body_sha256'],moved['body_sha256'])
            self.assertNotEqual(first,moved);self.assertNotEqual(first,asserted)

    def test_corpus_adapter_records_exact_two_chunk_boundary(self):
        root = DEFAULT_OUT/'test-runtime';root.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=root) as temp:
            path = Path(temp)/'corpus.sqlite3'
            c=sqlite3.connect(path)
            c.executescript('CREATE TABLE chunks(rowid INTEGER PRIMARY KEY,id TEXT,document_id TEXT,text TEXT,locator TEXT,language TEXT); CREATE INDEX chunks_doc ON chunks(document_id);')
            c.executemany('INSERT INTO chunks VALUES(?,?,?,?,?,?)',[(1,'a','d','Read John 3:','Section · part 1','en'),(2,'b','d','16 in context.','Section · part 2','en')])
            c.commit();c.close()
            output=sqlite3.connect(':memory:');output.row_factory=sqlite3.Row;output.executescript(SCHEMA)
            descriptor={'document_id':'d','excluded_archive':False,'cache_path':None,'source_path':str(Path(temp)/'source.txt'),
                        'original_sha256':None,'language':'en','body_adapter':'corpus-chunks'}
            analyse(output,'job',descriptor,str(path),ReferenceScanner(CitationParser(BOOKS,BOUNDS)))
            row=output.execute('SELECT * FROM literal_references').fetchone()
            self.assertEqual(row['coordinate'],'corpus-chunk-boundary')
            parts=json.loads(row['evidence_json'])['segments']
            self.assertEqual([p['chunk_id'] for p in parts],['a','b'])
            self.assertEqual([p['literal'] for p in parts],['John 3:','16'])
            self.assertEqual(output.execute('SELECT accepted FROM reference_coverage').fetchone()[0],1)
            output.close()

    def test_calibration_resumes_full_scope_and_keeps_nonenglish_coverage_partial(self):
        root = DEFAULT_OUT/'test-runtime';root.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=root) as temp:
            project = Path(temp);kb=project/'KnowledgeBase';kb.mkdir();cache=kb/'extracted-library';cache.mkdir()
            corpus=kb/'knowledge.sqlite3';db=sqlite3.connect(corpus)
            db.executescript('CREATE TABLE documents(id TEXT PRIMARY KEY,title TEXT,kind TEXT,language TEXT,source TEXT,metadata TEXT); CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE verses(book TEXT,chapter INTEGER,verse_end INTEGER,edition TEXT); CREATE TABLE chunks(rowid INTEGER PRIMARY KEY,id TEXT,document_id TEXT,text TEXT,locator TEXT,language TEXT); CREATE INDEX chunks_doc ON chunks(document_id);')
            db.execute('INSERT INTO meta VALUES(?,?)',('catalog',json.dumps({'books':BOOKS})))
            db.execute('INSERT INTO meta VALUES(?,?)',('built_at','fixture'))
            db.executemany('INSERT INTO verses VALUES(?,?,?,?)',[(b,c,v,'kjv') for (b,c),v in BOUNDS.items()])
            for ident,lang,text in [('a','en','CHAPTER I\nJohn 3:16.'),('b','grc','Greek αβ. John 3:16.')]:
                path=cache/(ident+'.jsonl');path.write_text(json.dumps({'text':text,'locator':ident})+'\n',encoding='utf-8')
                db.execute('INSERT INTO documents VALUES(?,?,?,?,?,?)',(ident,ident,'library_text',lang,str(project/(ident+'.txt')),json.dumps({'extraction_cache':str(path)})))
            db.commit();db.close()
            output=kb/'library-analytics/pipeline'
            def unreadable_a(descriptor,*args):
                if descriptor['document_id']=='a': raise OSError('fixture unreadable cache')
                return prepare(descriptor,*args)
            isolated=kb/'library-analytics/isolated'
            with patch('knowledge.library_analytics.text_pipeline.prepare',unreadable_a):
                self.assertEqual(run_text(project,isolated),2)
            self.assertFalse((isolated.parent/'latest-text-analysis.json').exists())
            f=sqlite3.connect(isolated/'pipeline.sqlite3')
            self.assertEqual(dict(f.execute('SELECT state,count(*) FROM jobs GROUP BY state')),{'failed':1,'succeeded':1})
            self.assertEqual(f.execute('SELECT count(*) FROM document_quality').fetchone()[0],1);f.close()
            def legacy_prepare(*args):
                value,files=prepare(*args);value.pop('coordinate_dependency',None)
                return value,files
            with patch('knowledge.library_analytics.text_pipeline.prepare',legacy_prepare):
                self.assertEqual(run_text(project,output,limit=1),0)
            self.assertFalse((output.parent/'latest-text-analysis.json').exists())
            self.assertEqual(run_text(project,output,resume=True),0)
            pointer=json.loads((output.parent/'latest-text-analysis.json').read_text());summary=json.loads(Path(pointer['summary']).read_text())
            self.assertEqual(summary['metrics']['completed_documents'],2)
            self.assertEqual(summary['table_rows']['literal_references'],2)
            self.assertEqual(summary['jobs_this_invocation'],{'skipped':1,'completed':1})
            self.assertTrue(any('language-specific' in c['coverage'] for c in summary['coverage'] if c['language']=='grc'))
            # Same cache bytes at a new path must yield new witness locations;
            # unchanged legacy inputs above were safely skipped instead.
            moved=cache/'a-moved.jsonl';moved.write_bytes((cache/'a.jsonl').read_bytes())
            d=sqlite3.connect(corpus)
            d.execute('UPDATE documents SET metadata=? WHERE id=?',(json.dumps({'extraction_cache':str(moved)}),'a'))
            d.commit();d.close()
            self.assertEqual(run_text(project,output),0)
            pointer=json.loads((output.parent/'latest-text-analysis.json').read_text())
            summary=json.loads(Path(pointer['summary']).read_text())
            self.assertEqual(summary['jobs_this_invocation'],{'completed':1,'skipped':1})
            d=sqlite3.connect(output/'pipeline.sqlite3');rows=d.execute('SELECT evidence_json FROM literal_references').fetchall()
            for row in rows:
                span=json.loads(row[0])['segments'][0];block=json.loads(Path(span['path']).read_text())
                self.assertEqual(block['text'][span['start']:span['end']],span['literal'])
            d.close()
            d=sqlite3.connect(output/'pipeline.sqlite3')
            moved_evidence=d.execute('SELECT l.evidence_json FROM literal_references l JOIN run_jobs r ON r.job_id=l.job_id WHERE r.run_id=? AND l.document_id=?',(pointer['run_id'],'a')).fetchone()[0]
            self.assertEqual(json.loads(moved_evidence)['segments'][0]['path'],str(moved));d.close()
            self.assertTrue(verify_witnesses(output,pointer['run_id'],samples=2)['ok'])
            self.assertTrue(verify_release(output,pointer['run_id'])['ok'])
            library_run=pointer['run_id']
            exported=Path(pointer['release'])/'literal_references.jsonl'
            original_export=exported.read_bytes()
            with exported.open('a',encoding='utf-8') as f: f.write('{}\n')
            tampered=verify_release(output,pointer['run_id'])
            self.assertFalse(tampered['ok'])
            self.assertIn('export-row-count-mismatch:literal_references.jsonl',tampered['errors'])
            self.assertIn('file-checksum-or-size-mismatch:literal_references.jsonl',tampered['errors'])
            exported.write_bytes(original_export)
            self.assertTrue(verify_release(output,library_run)['ok'])
            # Exercise the real run_text string-path descriptor and preparation
            # path; the standalone adapter fixture alone cannot catch this.
            d=sqlite3.connect(corpus)
            d.execute('INSERT INTO documents VALUES(?,?,?,?,?,?)',('r','reference','reference','en',str(project/'r.txt'),'{}'))
            d.executemany('INSERT INTO chunks VALUES(?,?,?,?,?,?)',[(1,'x','r','Read John 3:','Section · part 1','en'),(2,'y','r','16 in context.','Section · part 2','en')])
            d.commit();d.close()
            self.assertEqual(run_text(project,output,kinds=('reference',)),0)
            pointer=json.loads((output.parent/'latest-text-analysis.json').read_text())
            ref_summary=json.loads(Path(pointer['summary']).read_text())
            self.assertEqual(ref_summary['metrics']['completed_documents'],1)
            self.assertEqual(ref_summary['metrics']['text_blocks'],2)
            self.assertEqual(ref_summary['table_rows']['literal_references'],1)
            self.assertTrue(verify_witnesses(output,pointer['run_id'],samples=1)['ok'])
            self.assertTrue(verify_release(output,pointer['run_id'])['ok'])
            combined=bundle(output,[library_run,pointer['run_id']])
            self.assertEqual(combined['metrics']['completed_documents'],3)
            self.assertEqual(combined['table_rows']['literal_references'],3)
            with self.assertRaises(ValueError): bundle(output,[library_run,library_run])
            self.assertEqual(finish(output,[library_run,pointer['run_id']])['id'],combined['id'])
            bundle_pointer=output.parent/'latest-text-bundle.json'
            before=bundle_pointer.read_bytes()
            d=sqlite3.connect(output/'pipeline.sqlite3')
            d.execute("UPDATE text_runs SET state='failed' WHERE id=?",(pointer['run_id'],));d.commit();d.close()
            with self.assertRaises(RuntimeError): finish(output,[library_run,pointer['run_id']])
            self.assertEqual(bundle_pointer.read_bytes(),before)


if __name__=='__main__': unittest.main()
