import json,sqlite3,tempfile,unittest
from pathlib import Path
from .extractor import extract,classify
from .contract import SCHEMA
from ..jobs import JobStore,StaleInput
from ..section_contract import resolve_segment,text_hash
from .processor import process,capture
from .inputs import Inputs,SECTION_RUN
from .reconstruct import resolve_segment as owned_resolve,NativeRenderUnavailable,SCHEMA as RECONSTRUCTION_SCHEMA

class ExtractionTests(unittest.TestCase):
    def test_objection_not_endorsed(self):
        r,_=extract('Some argue that faith cannot justify unless works are present.','Author')
        self.assertEqual(r[0]['kind'],'objection');self.assertIsNone(r[0]['speaker_label']);self.assertEqual(r[0]['endorsement'],'not-endorsed')
    def test_explicit_reply(self):self.assertEqual(classify('I answer that faith is not mere opinion.')['kind'],'reply')
    def test_named_quote(self):
        r,_=extract('Augustine says “Faith is not mere belief.”','Editor')
        self.assertEqual(r[0]['quotes'][0]['speaker_label'],'Augustine');self.assertEqual(r[0]['quotes'][0]['endorsement'],'unresolved')
    def test_pronoun_quote_unresolved(self):
        r,_=extract('He says “Faith is not mere belief.”','Editor');self.assertIsNone(r[0]['speaker_label']);self.assertIsNone(r[0]['quotes'][0]['speaker_label'])
    def test_not_only(self):self.assertEqual(classify('Faith is not only an opinion but also trust.')['negation'],'no-negation-cue')
    def test_composite_author(self):self.assertIsNone(classify('I affirm that faith means confidence.',author='Author; Translator')['speaker_label'])
    def test_qualifier_full_suffix(self):
        text='Faith is useful only if its object is true.';r,_=extract(text);q=r[0]['qualifications'][0];self.assertEqual(text[q['start']:q['end']],q['literal']);self.assertIn('its object is true',q['literal'])
    def test_long_s(self):self.assertEqual(classify('Auguſtine ſaith that faith cannot be absent.')['kind'],'reported-statement')
    def test_negation_not_logical_inversion(self):self.assertEqual(classify('It is not true that faith cannot save.')['negation'],'negation-cue')
    def test_unicode_offsets(self):
        t='😊 Some say “Faith is not hope.”';r,_=extract(t);self.assertEqual(t[r[0]['start']:r[0]['end']],r[0]['text'])
    def test_oversize_deferred(self):
        r,s=extract('Some say '+('long '*1000));self.assertFalse(r);self.assertEqual(s['oversize_clauses'],1)
    def test_line_wrap(self):
        r,_=extract('I answer that faith\nis not mere opinion.');self.assertIn('\n',r[0]['text'])
    def test_no_unmarked_generation(self):
        r,s=extract('The sky appears blue today.');self.assertFalse(r);self.assertEqual(s['unmarked_clauses'],1)
    def test_source_change_rejected(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as tmp:
            p=Path(tmp)/'x.jsonl';p.write_text(json.dumps({'text':'Faith means trust.'})+'\n','utf-8');import hashlib
            span={'path':str(p),'asset_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'coordinate':'extraction-cache-block','block_ordinal':0,'locator':'','start':0,'end':18,'block_text_sha256':text_hash('Faith means trust.'),'span_sha256':text_hash('Faith means trust.')}
            self.assertEqual(resolve_segment(span),'Faith means trust.');p.write_text('{}\n','utf-8')
            with self.assertRaises(StaleInput):resolve_segment(span)
    def test_unreconstructable_native_is_deferred_but_changed_bytes_rejected(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as tmp:
            import hashlib
            p=Path(tmp)/'x.html';p.write_bytes(b'<html><body>Faith means trust.</body></html>')
            span={'path':str(p),'asset_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'coordinate':'original-html-rendered','block_ordinal':0,'locator':'native-rendered-source','start':0,'end':18,'block_text_sha256':text_hash('Historical different render.'),'span_sha256':text_hash('Historical different render.')}
            with self.assertRaises(NativeRenderUnavailable):owned_resolve(span,{})
            p.write_bytes(b'changed original')
            with self.assertRaises(StaleInput):owned_resolve(span,{})

class AtomicTests(unittest.TestCase):
    def test_failed_facts_and_checkpoint_rollback_and_resume(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as tmp:
            p=Path(tmp)/'jobs.sqlite3';s=JobStore(p);s.acquire();s.db.execute('CREATE TABLE facts(x TEXT)');s.register('r','j','arguments','doc','fp','v')
            def bad(db):db.execute("INSERT INTO facts VALUES('partial')");raise ValueError('interrupt')
            self.assertEqual(s.execute('j',bad),'failed');self.assertEqual(s.db.execute('SELECT count(*) FROM facts').fetchone()[0],0);self.assertEqual(s.db.execute('SELECT count(*) FROM checkpoints').fetchone()[0],0);s.close()
            s=JobStore(p);s.acquire()
            def good(db):db.execute("INSERT INTO facts VALUES('complete')");return 1
            self.assertEqual(s.execute('j',good,retry_failed=True),'completed');self.assertEqual(s.execute('j',good),'skipped');self.assertEqual(s.db.execute('SELECT count(*) FROM facts').fetchone()[0],1);s.close()
    def test_live_owner_refusal(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as tmp:
            p=Path(tmp)/'jobs.sqlite3';a=JobStore(p);a.acquire();b=JobStore(p)
            with self.assertRaises(RuntimeError):b.acquire()
            b.close();a.close()
    def test_schema(self):
        db=sqlite3.connect(':memory:');db.executescript(SCHEMA);self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0],'ok');db.close()
    def test_actual_processor_nested_locations_links_and_rerun(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as tmp:
            body='Title.\n\nSome argue that faith cannot save unless works accompany it.\nI answer that faith saves because grace precedes works.\nAugustine says “Faith is not bare knowledge unless it trusts God.”'
            p=Path(tmp)/'source.jsonl';p.write_text(json.dumps({'text':body,'locator':'recorded block'})+'\n','utf-8');import hashlib
            base={'coordinate':'extraction-cache-block','path':str(p),'asset_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'block_ordinal':0,'locator':'recorded block','block_text_sha256':text_hash(body),'work_id':None,'edition_id':None,'state':'native-structure','ordinal':0}
            rows=[]
            for version,kind,a,b in [('root','document-representation',0,len(body)),('native','xml-section',8,len(body)),('objection','xml-section',8,body.index('\nI answer'))]:
                rows.append({**base,'version_id':version,'kind':kind,'start':a,'end':b,'span_sha256':text_hash(body[a:b])})
            class TinyInputs:
                prepared={}
                def segments(self,doc):return rows
            s=JobStore(Path(tmp)/'arguments.sqlite3');s.acquire();s.db.executescript(SCHEMA+RECONSTRUCTION_SCHEMA);s.register('r','j','arguments','doc','fp','test')
            metadata={'author_label':'Author','language':'en','memberships':[['person-editor','editor']],'readers':[{'credit':'Author and Translator','reviewWarning':'Specific Catholic caution retained'}]}
            row={'document_id':'doc','descriptor_json':json.dumps(metadata),'disposition':'supported','reason':'fixture','adapter':'cache'}
            tiny=TinyInputs();tiny.proofs=[];tiny.descriptors=lambda:iter([row]);s.register('r','scope','arguments','scope','fp','test');s.execute('scope',lambda db:capture(tiny,db,'r',False))
            self.assertEqual(s.execute('j',lambda db:process(TinyInputs(),db,'r',row)),'completed')
            objection=s.db.execute("SELECT * FROM statements WHERE kind='objection'").fetchone();self.assertEqual(objection['version_id'],'objection');self.assertEqual(objection['endorsement'],'not-endorsed')
            quote=s.db.execute("SELECT * FROM statements WHERE kind='quotation'").fetchone();self.assertEqual(quote['speaker_label'],'Augustine')
            self.assertTrue(s.db.execute('SELECT count(*) FROM qualifications WHERE statement_id=?',(quote['id'],)).fetchone()[0])
            # A reply in a different native section does not acquire a spurious link.
            self.assertEqual(s.db.execute("SELECT count(*) FROM argument_links WHERE kind='reply-to-candidate'").fetchone()[0],0)
            for r in s.db.execute('SELECT s.*,p.* FROM statements s JOIN source_spans p ON p.statement_id=s.id'):
                self.assertEqual(body[r['start']:r['end']],r['text'])
            for q in s.db.execute('SELECT * FROM qualifications'):self.assertEqual(body[q['start']:q['end']],q['literal'])
            before=s.db.execute('SELECT count(*) FROM statements').fetchone()[0]
            self.assertEqual(s.execute('j',lambda db:process(TinyInputs(),db,'r',row)),'skipped');self.assertEqual(s.db.execute('SELECT count(*) FROM statements').fetchone()[0],before);s.close()
            from unittest.mock import patch
            from . import query as query_module
            def query_inputs():
                obj=TinyInputs();obj.alignment=sqlite3.connect(':memory:');obj.alignment.row_factory=sqlite3.Row
                obj.alignment.executescript('CREATE TABLE section_chunks(run_id TEXT,version_id TEXT,segment_ordinal INTEGER,source_start INTEGER,source_end INTEGER); CREATE TABLE section_destinations(run_id TEXT,version_id TEXT);')
                obj.sections=sqlite3.connect(':memory:');obj.sections.row_factory=sqlite3.Row;obj.sections.executescript('CREATE TABLE sections(version_id TEXT,kind TEXT,state TEXT); CREATE TABLE run_sections(run_id TEXT,version_id TEXT);')
                for row in rows:obj.sections.execute('INSERT INTO sections VALUES(?,?,?)',(row['version_id'],row['kind'],row['state']));obj.sections.execute('INSERT INTO run_sections VALUES(?,?)',(SECTION_RUN,row['version_id']))
                obj.check=lambda **kwargs:None;obj.close=lambda:(obj.alignment.close(),obj.sections.close());return obj
            with patch.object(query_module,'ROOT',Path(tmp)),patch.object(query_module,'Inputs',query_inputs):
                result=query_module.query('faith',kind='objection',author='Author',rid='r')
                self.assertEqual(len(result['results']),1);self.assertEqual(result['results'][0]['contributors'][0]['role'],'editor');self.assertEqual(result['results'][0]['source_metadata']['readers'][0]['reviewWarning'],'Specific Catholic caution retained')
                self.assertEqual(result['results'][0]['section']['kind'],'xml-section')
                self.assertFalse(query_module.query('faith',author='Other author',rid='r')['results'])
                self.assertFalse(query_module.query('faith',rid='other generation')['results'])
    def test_skipped_source_stat_change_rejected(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as tmp:
            path=Path(tmp)/'input';path.write_bytes(b'original');st=path.stat();db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
            db.execute('CREATE TABLE research_inputs(run_id TEXT,path TEXT,size INTEGER,mtime_ns INTEGER)');db.execute('INSERT INTO research_inputs VALUES(?,?,?,?)',(SECTION_RUN,str(path),st.st_size,st.st_mtime_ns))
            i=Inputs.__new__(Inputs);i.proofs=[];i.sections=db;i.check();path.write_bytes(b'changed bytes')
            with self.assertRaises(StaleInput):i.check()
            with self.assertRaises(StaleInput):i.check_contract({'runtime_dependencies':{'python':'incompatible runtime'}})
            db.close()
if __name__=='__main__':unittest.main()
