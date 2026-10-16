"""LA03 role boundaries, lexical signatures, XML entry provenance and aggregate counts."""
import hashlib
import json
import sqlite3
import tempfile
import unittest
import contextlib
import io
from unittest.mock import patch
from pathlib import Path
from .build import DEFAULT_OUT
from .citation_roles import classify
from .text_features import Features,phrase_hash,anchor,WINDOW
from .xml_bridge import bridge
from .products import SCHEMA,aggregate,reuse,run,record_progress
from .inputs import packed
from .jobs import JobStore


class FakeReader:
    def __init__(self,text):self.text=text
    def get(self,span):return {'text':self.text}


def span(text,literal):
    a=text.index(literal);return {'start':a,'end':a+len(literal),'literal':literal}


class RoleTests(unittest.TestCase):
    def test_modules_indexes_isolated_addresses_and_prose_remain_distinct(self):
        cases=[('$$$John 3:16','module_entry_address'),('Refs: Rom 8:1; John 3:16;','cross_reference_list'),
               ('Read John 3:16 in its context.','prose_candidate'),('John 3:16\n','isolated_address')]
        for text,role in cases:
            self.assertEqual(classify('library_text','verse',[span(text,'John 3:16')],FakeReader(text))[0],role)
        self.assertEqual(classify('library_text','printed_index_entry',[{}],None)[0],'scripture_index')
        self.assertEqual(classify('bible','verse',[{}],None)[0],'bible_text_address')
        self.assertEqual(classify('reference','verse',[{}],None,'reference-library:theographic/json/a.json:key')[0],'source_dataset_association')
        longline='Long narrative '+('ordinary words '*10000)+' Refs:'+(' '*300)+'John 3:16'
        self.assertEqual(classify('library_text','verse',[span(longline,'John 3:16')],FakeReader(longline))[0],'cross_reference_list')
        for text,expected in [('αRefs: John 3:16','prose_candidate'),('Some prose\n [John 3:16].\nMore prose','isolated_address'),
                              ('$$$John 3:16\nOther text','module_entry_address')]:
            self.assertEqual(classify('library_text','verse',[span(text,'John 3:16')],FakeReader(text))[0],expected)

class FeatureTests(unittest.TestCase):
    def test_token_digest_is_independent_of_case_whitespace_and_block_partition(self):
        a=Features();a.add('First alpha beta gamma. LAST',0)
        b=Features();b.add('FIRST ALPHA\n',0);b.add('beta gamma last',1)
        self.assertEqual(a.result()['normalized_token_sha256'],b.result()['normalized_token_sha256'])
        self.assertEqual(a.terms,b.terms)
    def test_bible_windows_are_excluded_from_reuse_but_retained_in_vocabulary(self):
        last=next('word'+str(i) for i in range(10000) if not anchor('word'+str(i))&31)
        words=['faith','hope','charity','grace','truth','love','peace',last]
        phrase=' '.join(words);f=Features({phrase_hash(words)});f.add(phrase,0)
        self.assertEqual(f.result()['bible_windows_filtered'],1);self.assertFalse(f.signatures)
        self.assertEqual(f.total,WINDOW)

class XMLTests(unittest.TestCase):
    def test_dictionary_key_and_body_both_required_for_source_entry_link(self):
        root=DEFAULT_OUT/'test-runtime';root.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=root) as temp:
            project=Path(temp);folder=project/'sources/ccel';folder.mkdir(parents=True);kb=project/'KnowledgeBase';kb.mkdir()
            path=folder/'hitchcock-bible-names.xml';path.write_text('<thML><term id="a-p0.10">Abarim</term><def>Mountains</def></thML>')
            doc='reference-library:ccel/hitchcock-bible-names.xml:a-p0.10'
            c=sqlite3.connect(kb/'knowledge.sqlite3');c.executescript('CREATE TABLE chunks(document_id TEXT,text TEXT); CREATE INDEX chunks_doc ON chunks(document_id);')
            c.execute('INSERT INTO chunks VALUES(?,?)',(doc,'Abarim\nMountains'));c.commit();c.close()
            db=sqlite3.connect(':memory:');db.executescript(SCHEMA)
            sha=hashlib.sha256(path.read_bytes()).hexdigest()
            self.assertEqual(bridge(db,project,path,[{'document_id':doc}],sha,'job'),1)
            self.assertEqual(db.execute('SELECT state FROM xml_entry_links').fetchone()[0],'verified-source-entry')
            # Entry documents have no containing-asset original hash. Link them
            # through the verified XML asset, never by fabricating entry hashes.
            from .jobs import SCHEMA as JOBS_SCHEMA
            from .product_consumers import SCHEMA as CONSUMER_SCHEMA,xml_readers
            db.executescript(JOBS_SCHEMA);db.execute('INSERT INTO run_jobs VALUES(?,?,?)',('parent','xml','job'));db.commit()
            parent=project/'parent.sqlite3';copy=sqlite3.connect(parent);db.backup(copy);copy.close()
            reader_root=project/'Website/public/content/teacher-library';(reader_root/'records').mkdir(parents=True);(reader_root/'pages').mkdir()
            shard=reader_root/'records/test.json';shard.write_text(packed({'reader':{'id':'reader','sha256':sha,'availability':'on-site-text','pages':1,'pageBundles':['pages/first.json'],'credit':'Original contributor'}}))
            (reader_root/'pages/first.json').write_text('{}');st=shard.stat()
            consumer=sqlite3.connect(':memory:',uri=True);consumer.row_factory=sqlite3.Row;consumer.executescript(CONSUMER_SCHEMA)
            consumer.execute('ATTACH DATABASE ? AS products',(parent.as_uri()+'?mode=ro',))
            self.assertEqual(xml_readers(consumer,'parent','r',project,{str(shard):{'sha256':hashlib.sha256(shard.read_bytes()).hexdigest(),'size':st.st_size,'mtime_ns':st.st_mtime_ns}}),1)
            self.assertEqual(consumer.execute('SELECT document_id,route,state FROM xml_reader_links').fetchone()[:],(doc,'/teachers/works/reader','on-site-book-route'))
            with self.assertRaises(sqlite3.OperationalError):consumer.execute('DELETE FROM products.xml_entry_links')
            consumer.close()
            c=sqlite3.connect(kb/'knowledge.sqlite3');c.execute('UPDATE chunks SET text=?',('Other definition',));c.commit();c.close()
            bridge(db,project,path,[{'document_id':doc}],sha,'job2')
            self.assertEqual(db.execute('SELECT state FROM xml_entry_links WHERE job_id=?',('job2',)).fetchone()[0],'source-entry-body-mismatch')
            db.close()

class AggregatesTests(unittest.TestCase):
    def test_matrix_keeps_ranges_and_roles_and_excludes_unselected_generations(self):
        db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
        from .jobs import SCHEMA as JOBS_SCHEMA
        db.executescript(JOBS_SCHEMA+SCHEMA)
        db.execute('INSERT INTO run_jobs VALUES(?,?,?)',('r','doc','job'))
        for ident,role in [('one','prose_candidate'),('two','module_entry_address')]:
            db.execute('INSERT INTO reference_roles VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',('job','doc','textjob',ident,'jhn',3,16,3,18,'verse',role,'fixture'))
        db.execute('INSERT INTO reference_roles VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',('old','doc','textjob','older','jhn',3,16,3,18,'verse','prose_candidate','fixture'))
        aggregate(db,'r')
        rows=db.execute('SELECT role,matches,verse,end_verse FROM scripture_matrix').fetchall()
        self.assertEqual(len(rows),2);self.assertEqual(sum(r['matches'] for r in rows),2)
        self.assertTrue(all((r['verse'],r['end_verse'])==(16,18) for r in rows));db.close()

    def test_common_signature_buckets_do_not_generate_every_pair(self):
        from .jobs import SCHEMA as JOBS_SCHEMA
        db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row;db.executescript(JOBS_SCHEMA+SCHEMA)
        for i in range(28):
            doc='doc'+str(i);job='job'+str(i)
            values=['r',doc,'text','library_text',doc,'eng','sermon','fixture','',None,None,None,0,0,'completed',1000,0,'full','[]',None,'[]','{}']
            db.execute('INSERT INTO document_dimensions VALUES('+','.join('?'*22)+')',values)
            db.execute('INSERT INTO run_jobs VALUES(?,?,?)',('r',doc,job))
            db.execute('INSERT INTO document_features VALUES(?,?,?,?,?,?,?,?)',(job,doc,doc,200,200,200,1,'{"retained_signatures":8}'))
            for j in range(8):db.execute('INSERT INTO reuse_signatures VALUES(?,?,?,?,?)',(job,doc,str(j),'phrase','{}'))
        reuse(db,'r');self.assertEqual(db.execute('SELECT count(*) FROM reuse_candidates').fetchone()[0],0)
        db.execute("DELETE FROM run_jobs WHERE job_id IN ('job25','job26','job27')")
        reuse(db,'r');self.assertEqual(db.execute('SELECT count(*) FROM reuse_candidates').fetchone()[0],300)
        self.assertEqual(db.execute('SELECT min(signature_overlap),max(signature_overlap) FROM reuse_candidates').fetchone()[:],(1.,1.));db.close()


class PipelineTests(unittest.TestCase):
    def test_full_release_reuses_jobs_counts_range_once_and_rejects_changed_body(self):
        from .text_pipeline import SCHEMA as TEXT_SCHEMA
        from .jobs import SCHEMA as JOBS_SCHEMA
        root=DEFAULT_OUT/'test-runtime';root.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=root) as temp:
            project=Path(temp);kb=project/'KnowledgeBase';kb.mkdir();source=kb/'fixture-text.sqlite3'
            textdb=sqlite3.connect(source);textdb.executescript(JOBS_SCHEMA+TEXT_SCHEMA)
            corpus=sqlite3.connect(kb/'knowledge.sqlite3');corpus.executescript('CREATE TABLE verses(id TEXT,edition TEXT,text TEXT);');corpus.close()
            descriptors=[]
            for i in range(3):
                body='Read John 3:16-4:3 in context. '+(('faith charity communion' if i==0 else 'grace charity holiness' if i==1 else 'peace charity comfort')+' ')*20
                cache=kb/('body'+str(i)+'.jsonl');cache.write_text(packed({'text':body,'locator':'fixture'})+'\n',encoding='utf-8')
                sha=hashlib.sha256(body.encode()).hexdigest();doc='fixture'+str(i);textjob='text'+str(i)
                bodysha=hashlib.sha256(packed({'ordinal':0,'locator':'fixture','sha256':sha,'id':None}).encode()).hexdigest()
                literal='John 3:16-4:3';a=body.index(literal)
                witness={'block_ordinal':0,'start':a,'end':a+len(literal),'literal':literal,'text_sha256':sha}
                textdb.execute('INSERT INTO literal_references VALUES('+','.join('?'*12)+')',(textjob,'ref'+str(i),doc,'jhn',3,16,4,3,'verse','fixture',literal,packed({'segments':[witness]})))
                descriptors.append({'document_id':doc,'text_job_id':textjob,'kind':'library_text','title':doc,'language':'eng','genre':'sermon',
                    'source_family':('ia','internet-archive','fixture')[i],'author_label':'Example','original_sha256':None,'work_id':None,'edition_id':None,
                    'work_verified':False,'edition_verified':False,'status':'completed','characters':len(body),'references':1,
                    'citation_coverage':'full','quality':{'flags':[],'body_stream_sha256':bodysha},'era':None,'dates':[],
                    'readers':[],'memberships':[('person','author'),('person','editor')],'cache_path':str(cache)})
            textdb.commit();textdb.close()
            class FixtureInputs:
                def __init__(self,p):
                    self.project=Path(p);self.text=sqlite3.connect('file:'+source.as_posix()+'?mode=ro',uri=True);self.text.row_factory=sqlite3.Row
                    self.pointer={'run_ids':['text-fixture'],'database':str(source)}
                    self.bundle={'table_rows':{'literal_references':3,'document_quality':3}}
                    self.dependencies={};self.contributors={'person':{'id':'person','name':'Example','entityType':'person','identity_basis':'fixture'}}
                def documents(self):return iter(descriptors)
                def validate_dependencies(self):return []
                def close(self):self.text.close()
            with patch('knowledge.library_analytics.products.ProductInputs',FixtureInputs),contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(run(project),0)
                out=kb/'library-analytics';p1=json.loads((out/'latest-products.json').read_text());db=sqlite3.connect(p1['database'])
                first=db.execute('SELECT scope,job_id FROM run_jobs WHERE run_id=? AND scope LIKE ?',(p1['run_id'],'document:%')).fetchall()
                self.assertEqual(db.execute('SELECT prose_candidate_matches,documents FROM contributor_profiles WHERE run_id=?',(p1['run_id'],)).fetchone(),(3,3))
                self.assertEqual(db.execute('SELECT chapter,documents,matches FROM contributor_scripture WHERE run_id=? ORDER BY chapter',(p1['run_id'],)).fetchall(),[(3,3,3),(4,3,3)])
                self.assertEqual(db.execute('SELECT sum(matches) FROM scripture_matrix WHERE run_id=?',(p1['run_id'],)).fetchone()[0],3)
                self.assertGreater(db.execute('SELECT count(*) FROM vocabulary_profiles WHERE run_id=? AND tfidf IS NOT NULL',(p1['run_id'],)).fetchone()[0],0)
                db.close()
                from .product_consumers import run as consume
                self.assertEqual(consume(project),0)
                cp=json.loads((out/'latest-product-consumers.json').read_text());cdb=sqlite3.connect(cp['database'])
                self.assertEqual(cdb.execute('SELECT DISTINCT document_fraction FROM contributor_chapter_profiles').fetchall(),[(1.,)])
                self.assertEqual(cdb.execute("SELECT documents,source_channels FROM collection_contribution WHERE collection_id='internet-archive'").fetchone(),(2,2))
                self.assertEqual(cdb.execute("SELECT linked_documents,eligible_documents,document_fraction FROM collection_chapter_profiles WHERE collection_id='internet-archive' ORDER BY chapter").fetchall(),[(2,2,1.),(2,2,1.)])
                self.assertGreater(cdb.execute("SELECT count(*) FROM group_vocabulary WHERE group_kind='contributor' AND tfidf IS NOT NULL").fetchone()[0],0)
                self.assertEqual(cdb.execute('SELECT max(document_frequency),max(eligible_documents) FROM group_vocabulary').fetchone(),(1,3))
                cdb.close();self.assertEqual(consume(project),0)
                from .verify_products import verify
                self.assertTrue(verify(project)['ok'])
                # A valid SQLite row can still violate the lexical accounting contract.
                db=sqlite3.connect(p1['database'])
                selected=db.execute('SELECT rowid,count FROM vocabulary_counts LIMIT 1').fetchone()
                db.execute('UPDATE vocabulary_counts SET count=count+1 WHERE rowid=?',(selected[0],));db.commit()
                self.assertIn('full-lexical-counts',verify(project)['errors'])
                db.execute('UPDATE vocabulary_counts SET count=? WHERE rowid=?',(selected[1],selected[0]));db.commit();db.close()
                self.assertTrue(verify(project)['ok'])
                self.assertEqual(run(project),0)
                p2=json.loads((out/'latest-products.json').read_text());db=sqlite3.connect(p2['database'])
                second=db.execute('SELECT scope,job_id FROM run_jobs WHERE run_id=? AND scope LIKE ?',(p2['run_id'],'document:%')).fetchall()
                self.assertEqual(first,second);self.assertEqual(db.execute('SELECT count(*) FROM document_features').fetchone()[0],3);db.close()
                # A changed cache under the same captured LA02 job fails the body-stream gate.
                cache=Path(descriptors[0]['cache_path']);cache.write_text(packed({'text':'changed','locator':'fixture'})+'\n')
                descriptors[0]['text_job_id']='changed-source-job'
                self.assertEqual(run(project),2)
                self.assertEqual(json.loads((out/'latest-products.json').read_text()),p2)


class DependencyTests(unittest.TestCase):
    def test_report_uses_unicode_verified_receipt_without_rechecking(self):
        from .product_delivery import report_only
        from .build import dump
        root=DEFAULT_OUT/'test-runtime';root.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=root) as temp:
            project=Path(temp);out=project/'KnowledgeBase/library-analytics';out.mkdir(parents=True)
            parent={'run_id':'p'};consumer={'run_id':'c','parent_run':'p'}
            proof={'ok':True,'run_id':'p','consumer':{'run_id':'c'},'totals':{'vocabulary_rows':1},'context':'Ἰωάννης “text”'}
            dump(out/'proof.json',proof);dump(out/'latest-products.json',parent);dump(out/'latest-product-consumers.json',consumer)
            receipt={'state':'complete','parent':parent,'consumers':consumer,'verification':str(out/'proof.json'),'verified_at':'original-check-time'}
            dump(out/'latest-analytical-release.json',receipt)
            with patch('knowledge.library_analytics.product_delivery.result_document',return_value='report') as render,contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(report_only(project),0)
                self.assertEqual(render.call_args.args[1],proof)
                self.assertEqual(json.loads((out/'latest-analytical-release.json').read_text(encoding='utf-8'))['verified_at'],'original-check-time')
                proof['consumer']['run_id']='different';dump(out/'proof.json',proof)
                with self.assertRaises(RuntimeError):report_only(project)

    def test_integrity_check_scope_excludes_attached_parent(self):
        db=sqlite3.connect(':memory:')
        db.executescript("ATTACH DATABASE ':memory:' AS parent; CREATE TABLE parent.example(x CHECK(x>0)); PRAGMA ignore_check_constraints=ON; INSERT INTO parent.example VALUES(-1); PRAGMA ignore_check_constraints=OFF;")
        self.assertEqual(db.execute('PRAGMA main.quick_check').fetchall(),[('ok',)])
        self.assertTrue(any('CHECK constraint failed' in r[0] for r in db.execute('PRAGMA quick_check')))
        db.close()

    def test_vocabulary_pushdown_preserves_full_reference_ranking(self):
        from collections import Counter
        import math
        from .product_consumers import SCHEMA as consumer_schema,vocabulary
        db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
        db.executescript(consumer_schema)
        db.execute("ATTACH DATABASE ':memory:' AS products")
        db.executescript('''
          CREATE TABLE products.document_dimensions(run_id,document_id,source_family,language,genre);
          CREATE TABLE products.run_jobs(run_id,scope,job_id);
          CREATE TABLE products.document_features(job_id,tracked_tokens,vocabulary_complete);
          CREATE TABLE products.vocabulary_counts(job_id,document_id,term,count);
          CREATE INDEX products.vocabulary_order ON vocabulary_counts(job_id,count DESC,term);
          CREATE TABLE products.stratum_vocabulary(run_id,language,genre,term,tokens,documents);
        ''')
        docs=[]
        for i in range(8):
            lang,genre=('en','sermon') if i<3 else ('en','book') if i<6 else ('und','unknown')
            group='prose-'+str(i) if i<3 else 'books' if i<6 else 'unknown'
            terms=Counter({f'term{n:03}':1+(n+i)%7 for n in range(95)})
            terms['rare'+str(i)]=5;terms['low'+str(i)]=2
            doc='d'+str(i);docs.append((doc,lang,genre,group,terms))
            db.execute('INSERT INTO products.document_dimensions VALUES(?,?,?,?,?)',('p',doc,doc,lang,genre))
            db.execute('INSERT INTO products.run_jobs VALUES(?,?,?)',('p','document:'+doc,doc))
            db.execute('INSERT INTO products.document_features VALUES(?,?,1)',(doc,sum(terms.values())))
            db.executemany('INSERT INTO products.vocabulary_counts VALUES(?,?,?,?)',[(doc,doc,t,n) for t,n in terms.items()])
            db.execute('INSERT INTO source_collection_aliases VALUES(?,?,?,?)',('c',doc,group,'fixture'))
        strata={};groups={}
        for doc,lang,genre,group,terms in docs:
            s=strata.setdefault((lang,genre),{'n':0,'df':Counter(),'terms':Counter()})
            s['n']+=1;s['df'].update(terms.keys());s['terms'].update(terms)
            g=groups.setdefault((group,lang,genre),{'n':0,'df':Counter(),'terms':Counter()})
            g['n']+=1;g['df'].update(terms.keys());g['terms'].update(terms)
        for (lang,genre),s in strata.items():
            db.executemany('INSERT INTO products.stratum_vocabulary VALUES(?,?,?,?,?,?)',
                [('p',lang,genre,t,n,s['df'][t]) for t,n in s['terms'].items()])
        vocabulary(db,'p','c','collection')
        actual={(r['group_id'],r['language'],r['genre'],r['term']):dict(r) for r in db.execute("SELECT * FROM group_vocabulary WHERE run_id='c'")}
        expected={}
        for (group,lang,genre),g in groups.items():
            s=strata[(lang,genre)];comparable=lang=='en' and genre=='sermon' and s['n']>=3
            total=sum(g['terms'].values());ranked=[]
            for term,count in g['terms'].items():
                if comparable and (count<3 or s['df'][term]>s['n']*.8):continue
                score=count/total*(math.log((s['n']+1)/(s['df'][term]+1))+1) if comparable else None
                ranked.append((term,count,score))
            ranked.sort(key=lambda r:(-(r[2] if comparable else r[1]),r[0]))
            for term,count,score in ranked[:64]:expected[(group,lang,genre,term)]=(count,score,g,s)
        self.assertEqual(set(actual),set(expected))
        self.assertEqual(sum(k[0]=='unknown' for k in actual),64)
        for key,(count,score,g,s) in expected.items():
            row=actual[key];term=key[-1]
            self.assertEqual((row['count'],row['document_frequency'],row['eligible_documents'],row['stratum_document_frequency'],row['stratum_documents']),
                (count,g['df'][term],g['n'],s['df'][term],s['n']))
            if score is None:self.assertIsNone(row['tfidf'])
            else:self.assertAlmostEqual(row['tfidf'],score)
        db.close()

    def test_progress_copy_lock_cannot_stop_durable_processing(self):
        root=DEFAULT_OUT/'test-runtime';root.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=root) as temp:
            store=JobStore(Path(temp)/'jobs.sqlite3');store.db.executescript(SCHEMA)
            try:
                with patch('knowledge.library_analytics.products.dump',side_effect=PermissionError('Windows reader lock')),contextlib.redirect_stdout(io.StringIO()):
                    record_progress(store,'r',Path(temp),{'phase':'text-products','documents':50})
                self.assertEqual(json.loads(store.db.execute('SELECT metrics_json FROM product_metrics').fetchone()[0])['documents'],50)
            finally:store.close()
    def test_fresh_hashes_detect_same_size_same_timestamp_source_changes(self):
        import os
        from .product_dependencies import text_inputs
        root=DEFAULT_OUT/'test-runtime';root.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=root) as temp:
            path=Path(temp)/'body';path.write_bytes(b'good');stat=path.stat()
            db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
            db.execute('CREATE TABLE text_input_files(run_id TEXT,path TEXT,sha256 TEXT,size INTEGER,mtime_ns INTEGER)')
            db.execute('INSERT INTO text_input_files VALUES(?,?,?,?,?)',('r',str(path),hashlib.sha256(b'good').hexdigest(),stat.st_size,stat.st_mtime_ns))
            path.write_bytes(b'evil');os.utime(path,ns=(stat.st_atime_ns,stat.st_mtime_ns))
            self.assertFalse(text_inputs(db,['r'])['errors'])
            self.assertTrue(text_inputs(db,['r'],fresh_hashes=True)['errors']);db.close()

if __name__=='__main__':unittest.main()
