"""Disposable failure/delta fixtures; actual native processor integration."""
import copy
import gzip
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from .inputs import packed,digest
from .jobs import JobStore,StaleInput
from .section_contract import xml_render,text_hash
from .refresh import perform,compare,ownership,make_plan,read_batch,ROOT,release
from .refresh_contract import (delta,fingerprints,encode,decode,hash_file,select_candidate,rollback_candidate,
                               atomic_json,verify_export,VERSION)
from .refresh_capture import code_identity,query_identity,runtime_identity
from .refresh_processors import Processors,stable_concepts
from .relationship_contract import CONFIG as REL_CONFIG
from .relationship_cocitations import CONFIG as JOINT_CONFIG

def config():
    return {'version':VERSION,'code':code_identity(),'rules':{'rules':[{'id':'prayer','topic':'prayer','phrase':'prayer','basis':'candidate','language':'en'}]},
            'parser':{'books':[{'code':'rom','name':'Romans'},{'code':'jhn','name':'John'}],'bounds':[['rom',8,39],['jhn',3,36]]},
            'relationships':copy.deepcopy(REL_CONFIG),'joint':copy.deepcopy(JOINT_CONFIG),'window_codepoints':1800,
            'reviews':{'state':'candidate-only'},'reader_code':[],'parents':{},'corpus_build':'disposable-fixture',
            'query_code':query_identity(),'runtime':runtime_identity()}

def item(root,ident,text=None):
    text=text or ('Prayer to God encourages faith and hope in Christ. Romans 8:1 and John 3:16 are cited in this sermon. '
                  'The preacher considers an objection and offers counsel to those who suffer, reminding them that God comforts believers. ')*4
    path=Path(root)/(ident+'.xml');raw=('<TEI><text><body><div><head>Prayer</head><p>'+text+'</p></div></body></text></TEI>').encode()
    path.write_bytes(raw);body=xml_render(raw)[0];original=hash_file(path)
    cache=Path(root)/(ident+'.jsonl');block={'text':body,'locator':'native','id':ident};cache.write_text(packed(block)+'\n',encoding='utf-8');sha=hash_file(cache)
    stream=hashlib.sha256();stream.update(packed({'ordinal':0,'locator':'native','sha256':text_hash(body),'id':ident}).encode())
    d={'document_id':ident,'title':'Prayer sermon '+ident,'source_path':str(path),'original_sha256':original,
       'cache_path':str(cache),'cache_expected_sha256':sha,'quality':{'body_stream_sha256':stream.hexdigest()},
       'language':'en','source_family':'disposable','author_label':'John Owen','memberships':[['author-john-owen','author']],
       'work_id':'work-'+ident,'work_verified':True,'edition_id':'edition-'+ident,'edition_verified':True,'readers':[]}
    chunk={'id':digest([ident,body]),'title':d['title'],'text':body,'locator':'native'}
    return {'descriptor':d,'adapter':'cache','sources':[{'path':str(cache),'sha256':sha,'bytes':cache.stat().st_size},{'path':str(path),'sha256':original,'bytes':len(raw)}],
            'corpus':{'record':{'id':ident,'source':str(path),'metadata':packed({'original_sha256':original})},'chunks':[chunk],'binding':'same-document-id-and-source-hash'},'readers':[]}

def batch(path,items,conf=None):
    value={'config':conf or config(),'items':items,'scope':{'type':'disposable-fixtures','source_population':len(items)}}
    Path(path).write_bytes(gzip.compress(packed(value).encode(),mtime=0));return Path(path)

class RefreshTest(unittest.TestCase):
    def setUp(self):
        base=ROOT/'disposable-tests';base.mkdir(parents=True,exist_ok=True)
        self.temp=tempfile.TemporaryDirectory(dir=base);self.root=Path(self.temp.name);self.global_path=self.root/'global.sqlite3'
    def tearDown(self):self.temp.cleanup()
    def run_batch(self,path,mode='selective',parent=None,limit=None):
        return perform(self.root,path,mode,parent,limit,global_path=self.global_path)
    def test_add_remove_and_native_clean_equivalence(self):
        a=item(self.root,'a');b=item(self.root,'b');c=item(self.root,'c')
        base=self.run_batch(batch(self.root/'base.gz',[a,b]),'clean')
        target=batch(self.root/'target.gz',[a,c]);selective=self.run_batch(target,parent=base['run_id']);clean=self.run_batch(target,'clean')
        self.assertEqual(selective['deltas'],{'unchanged':1,'added':1,'removed':1})
        db=sqlite3.connect(self.root/'refresh.sqlite3');db.row_factory=sqlite3.Row
        evidence=compare(db,selective['run_id'],clean['run_id']);self.assertTrue(evidence['ok'])
        self.assertEqual(db.execute('SELECT count(*) FROM tombstones WHERE run_id=?',(selective['run_id'],)).fetchone()[0],1)
        self.assertEqual(db.execute("SELECT count(*) FROM membership WHERE run_id=? AND action='reused'",(selective['run_id'],)).fetchone()[0],4)
        for stage in ('sections','alignment','concepts','relationships'):
            row=db.execute('SELECT o.* FROM membership m JOIN objects o ON o.id=m.object_id WHERE m.run_id=? AND m.stage=? LIMIT 1',(selective['run_id'],stage)).fetchone()
            self.assertTrue(sum(len(v) for v in decode(row).values()))
        db.close()
    def test_stable_occurrence_ids_preserve_native_duplicate_multiplicity(self):
        v={'windows':[{'id':1,'document_id':'d','version_id':'s','segment_ordinal':0,'start':0,'end':10,'text_sha256':'sha'}],
           'concept_occurrences':[{'id':1,'window_id':1,'literal':'same'},{'id':2,'window_id':1,'literal':'same'}],
           'reference_occurrences':[{'id':1,'window_id':1,'literal':'Romans 8:1'},{'id':2,'window_id':1,'literal':'Romans 8:1'}]}
        first=stable_concepts(copy.deepcopy(v));second=stable_concepts(copy.deepcopy(v))
        self.assertEqual(first,second)
        for table in ('concept_occurrences','reference_occurrences'):
            self.assertEqual(len(first[table]),2);self.assertEqual(len({r['id'] for r in first[table]}),2)
    def test_interruption_resume_and_idempotence(self):
        path=batch(self.root/'input.gz',[item(self.root,'a'),item(self.root,'b')])
        stopped=self.run_batch(path,'clean',limit=1);self.assertEqual(stopped['state'],'interrupted')
        db=sqlite3.connect(self.root/'refresh.sqlite3');before=db.execute('SELECT job_id,completed_at FROM checkpoints ORDER BY job_id').fetchall();db.close()
        result=self.run_batch(path,'clean');self.assertEqual(result['state'],'complete')
        self.run_batch(path,'clean');db=sqlite3.connect(self.root/'refresh.sqlite3')
        after=dict(db.execute('SELECT job_id,completed_at FROM checkpoints'))
        self.assertTrue(all(after[j]==stamp for j,stamp in before));self.assertEqual(db.execute('SELECT max(attempts) FROM jobs').fetchone()[0],1);db.close()
    def test_competing_global_owner(self):
        s=JobStore(self.global_path);s.acquire()
        try:
            with self.assertRaisesRegex(RuntimeError,'already owned'):
                with ownership(self.root,self.global_path):pass
        finally:s.close()
    def test_input_change_same_generation_rejected(self):
        a=item(self.root,'a');path=batch(self.root/'input.gz',[a]);self.run_batch(path,'clean',limit=1)
        Path(a['descriptor']['cache_path']).write_text('changed',encoding='utf-8')
        with self.assertRaises(StaleInput):self.run_batch(path,'clean')
    def test_corrupt_reused_facts_rejected(self):
        a=item(self.root,'a');p=batch(self.root/'base.gz',[a]);base=self.run_batch(p,'clean')
        db=sqlite3.connect(self.root/'refresh.sqlite3');db.execute("UPDATE objects SET payload=x'0001' WHERE stage='sections'");db.commit();db.close()
        with self.assertRaises(RuntimeError):self.run_batch(p,parent=base['run_id'])
    def test_narrow_unconsumed_metadata_reuse(self):
        a=item(self.root,'a');new=copy.deepcopy(a);new['descriptor']['unconsumed_owner_note']='changed'
        c=config();self.assertEqual(delta(a,new),'metadata-only')
        for stage in ('sections','concepts','alignment','relationships'):
            self.assertEqual(fingerprints(a,c,{'sections':'s','concepts':'c'})[stage],fingerprints(new,c,{'sections':'s','concepts':'c'})[stage])
    def test_reader_changes_only_alignment_fingerprint(self):
        a=item(self.root,'a');new=copy.deepcopy(a);new['readers']=[{'record':{'id':'r'},'blocks':[]}]
        oldfp=fingerprints(a,config(),{'sections':'s','concepts':'c'});newfp=fingerprints(new,config(),{'sections':'s','concepts':'c'})
        self.assertNotEqual(oldfp['alignment'],newfp['alignment']);self.assertEqual(oldfp['concepts'],newfp['concepts'])
    def test_rule_parser_and_config_invalidation(self):
        a=item(self.root,'a');c=config();p={'sections':'s','concepts':'c'};old=fingerprints(a,c,p)
        changed=copy.deepcopy(c);changed['rules']['rules'][0]['phrase']='hope'
        self.assertNotEqual(old['concepts'],fingerprints(a,changed,p)['concepts']);self.assertEqual(old['sections'],fingerprints(a,changed,p)['sections'])
        changed=copy.deepcopy(c);changed['relationships']['tokens_per_shingle']=8
        self.assertNotEqual(old['relationships'],fingerprints(a,changed,p)['relationships'])
        proc=Processors(changed,[a]);s=proc.compute('sections',a,{});concept=proc.compute('concepts',a,{'sections':s})
        r=proc.compute('relationships',a,{'sections':s,'concepts':concept});self.assertTrue(r['postings'])
    def test_moved_and_text_changed_classification(self):
        a=item(self.root,'a');m=copy.deepcopy(a);m['sources'][0]['path']='a-new-path'
        self.assertEqual(delta(a,m),'moved');m['sources'][0]['sha256']='new';self.assertEqual(delta(a,m),'text-changed')
        self.assertNotEqual(fingerprints(a,config(),{})['sections'],fingerprints(m,config(),{})['sections'])
    def test_atomic_facts_checkpoint_failure(self):
        with ownership(self.root,self.global_path) as (_,s):
            s.register('r','j','t','scope','fp','v')
            def fail(db):
                db.execute("INSERT INTO tombstones VALUES('r','d','p','test')");raise StaleInput('stale')
            self.assertEqual(s.execute('j',fail),'stale');self.assertEqual(s.db.execute('SELECT count(*) FROM tombstones').fetchone()[0],0)
            self.assertFalse(s.db.execute('SELECT * FROM checkpoints').fetchone())
    def candidate(self,name,ok=True):
        folder=self.root/'releases'/name;folder.mkdir(parents=True);path=folder/'facts.jsonl';path.write_text('{"candidate":true}\n',encoding='utf-8')
        atomic_json(folder/'manifest.json',{'run_id':name,'evaluation':{'ok':ok},'files':[{'path':path.name,'bytes':path.stat().st_size,'sha256':hash_file(path)}]});return folder
    def test_failed_evaluation_export_and_rollback_retain_last_good(self):
        first=self.candidate('first');second=self.candidate('second');bad=self.candidate('bad',False)
        select_candidate(self.root,first);before=(self.root/'candidate.json').read_bytes()
        with self.assertRaises(ValueError):select_candidate(self.root,bad)
        self.assertEqual(before,(self.root/'candidate.json').read_bytes())
        (second/'facts.jsonl').write_text('corrupt',encoding='utf-8')
        with self.assertRaises(StaleInput):select_candidate(self.root,second)
        self.assertEqual(before,(self.root/'candidate.json').read_bytes())
        third=self.candidate('third');select_candidate(self.root,third);rollback_candidate(self.root)
        self.assertEqual(before,(self.root/'candidate.json').read_bytes())
    def test_candidate_cas_and_output_boundary(self):
        first=self.candidate('first');select_candidate(self.root,first)
        with self.assertRaises(StaleInput):select_candidate(self.root,self.candidate('second'),expected='wrong')
        with self.assertRaises(ValueError):select_candidate(self.root,self.root/'outside')
    def test_review_change_retains_raw_facts(self):
        a=item(self.root,'a');old=config();new=copy.deepcopy(old);new['reviews']={'state':'withdrawn','evidence_fingerprint':'changed'}
        self.assertEqual(fingerprints(a,old,{'sections':'s','concepts':'c'}),fingerprints(a,new,{'sections':'s','concepts':'c'}))
    def test_actual_process_death_atomic_recovery(self):
        proc=subprocess.run([sys.executable,'-X','utf8','-m',__name__,'--crash-worker',str(self.root/'crash.sqlite3')],capture_output=True,
                            creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
        self.assertEqual(proc.returncode,19,proc.stderr.decode())
        store=JobStore(self.root/'crash.sqlite3');store.acquire()
        try:
            self.assertEqual(store.db.execute('SELECT count(*) FROM facts').fetchone()[0],0)
            self.assertFalse(store.db.execute('SELECT * FROM checkpoints').fetchone())
            self.assertEqual(store.db.execute("SELECT state FROM jobs WHERE id='j'").fetchone()[0],'pending')
            self.assertEqual(store.execute('j',lambda db:db.execute("INSERT INTO facts VALUES('resumed')").rowcount),'completed')
        finally:store.close()
    def test_each_changed_input_native_selective_matches_clean(self):
        a=item(self.root,'a');baseline=self.run_batch(batch(self.root/'base.gz',[a]),'clean')
        scenarios={}
        text=item(self.root,'newtext','Changed testimony: prayer, faith and hope. Romans 8:2. '*20)
        text['descriptor']['document_id']='a';text['corpus']['record']['id']='a';scenarios['text-changed']=(text,config())
        meta=copy.deepcopy(a);meta['descriptor']['author_label']='John Gill';meta['descriptor']['memberships']=[['author-john-gill','author']];scenarios['metadata-only']=(meta,config())
        moved=copy.deepcopy(a)
        for proof in moved['sources']:
            old=Path(proof['path']);new=self.root/('moved-'+old.name);new.write_bytes(old.read_bytes());proof['path']=str(new)
            if old.suffix=='.xml':moved['descriptor']['source_path']=str(new)
            else:moved['descriptor']['cache_path']=str(new)
        scenarios['moved']=(moved,config())
        reader=copy.deepcopy(a);body=reader['corpus']['chunks'][0]['text'];page=self.root/'page.json'
        page.write_text(packed({'blocks':[{'text':body,'locator':'page'}]}),encoding='utf-8')
        reader['readers']=[{'record':{'id':'reader-a','sha256':a['descriptor']['original_sha256'],'availability':'on-site-text','pages':1},
             'path':'captured-catalogue','file_sha256':'captured','blocks':[{'text':body,'locator':'page','page_index':0,'block_index':0,'page_path':str(page),'page_sha256':hash_file(page)}]}]
        scenarios['reader']=(reader,config())
        rules=config();rules['rules']['rules'][0]['phrase']='hope';scenarios['rules']=(a,rules)
        parser=config();parser['parser']['bounds'][0][2]=1;scenarios['parser']=(a,parser)
        rel=config();rel['relationships']['tokens_per_shingle']=8;scenarios['relationship-config']=(a,rel)
        joint=config();joint['joint']['max_ranges_per_window']=1;scenarios['joint-config']=(a,joint)
        review=config();review['reviews']={'state':'withdrawn','review_id':'fixture-review'};scenarios['review']=(a,review)
        for name,(target,conf) in scenarios.items():
            with self.subTest(name=name):
                path=batch(self.root/(name+'.gz'),[target],conf)
                selective=self.run_batch(path,parent=baseline['run_id']);clean=self.run_batch(path,'clean')
                db=sqlite3.connect(self.root/'refresh.sqlite3');db.row_factory=sqlite3.Row
                self.assertTrue(compare(db,selective['run_id'],clean['run_id'])['ok'])
                actions={r['stage']:r['action'] for r in db.execute('SELECT stage,action FROM membership WHERE run_id=?',(selective['run_id'],))}
                if name=='reader':self.assertEqual(actions,{'sections':'reused','alignment':'recomputed','concepts':'reused','relationships':'reused'})
                if name in ('review','joint-config'):self.assertEqual(set(actions.values()),{'reused'})
                if name=='rules':self.assertEqual(actions['sections'],'reused');self.assertEqual(actions['concepts'],'recomputed')
                if name=='relationship-config':self.assertEqual(actions['concepts'],'reused');self.assertEqual(actions['relationships'],'recomputed')
                db.close()
    def test_population_addition_changes_old_frequency_and_pairs(self):
        a=item(self.root,'a');b=item(self.root,'b');c=item(self.root,'c','Prayer strengthens hope in God. '*100)
        before=self.run_batch(batch(self.root/'base.gz',[a]),'clean')
        after=self.run_batch(batch(self.root/'target.gz',[a,b,c]),parent=before['run_id'])
        db=sqlite3.connect(self.root/'refresh.sqlite3');db.row_factory=sqlite3.Row
        from .refresh import object_row
        old=decode(object_row(db,before['population_object']));new=decode(object_row(db,after['population_object']))
        old_term=next(t for t in old['frequencies'] if t['term']=='prayer');new_term=next(t for t in new['frequencies'] if t['term']=='prayer')
        self.assertGreater(new_term['doc'],old_term['doc']);self.assertGreater(len(new['pair_evidence']),len(old['pair_evidence']))
        self.assertGreater(len(new['joint_pairs']),len(old['joint_pairs']))
        old_scores={r['id']:r['components']['lexical']['score'] for q in old['queries'] if q['mode']=='baseline' for r in q['result']['results'] if 'lexical' in r['components']}
        new_scores={r['id']:r['components']['lexical']['score'] for q in new['queries'] if q['mode']=='baseline' for r in q['result']['results'] if 'lexical' in r['components']}
        self.assertTrue(any(old_scores[wid]!=new_scores[wid] for wid in old_scores.keys()&new_scores.keys()))
        from .refresh import affected
        descendants=affected(db,'source',a['descriptor']['cache_path'])
        self.assertTrue({'sections','concepts','relationships','population'}<={r['stage'] for r in descendants});db.close()
    def test_real_export_failure_and_evaluation_failure_preserve_selection(self):
        a=item(self.root,'a');base=self.run_batch(batch(self.root/'base.gz',[a]),'clean')
        target=batch(self.root/'target.gz',[a,item(self.root,'b')]);selective=self.run_batch(target,parent=base['run_id']);clean=self.run_batch(target,'clean')
        select_candidate(self.root,self.candidate('last-good'));before=(self.root/'candidate.json').read_bytes()
        with patch('knowledge.library_analytics.refresh.compare',return_value={'ok':False}):
            with self.assertRaisesRegex(ValueError,'Equivalence failed'):release(self.root,selective['run_id'],clean['run_id'],self.global_path)
        with patch('knowledge.library_analytics.refresh.atomic_json',side_effect=OSError('simulated export storage failure')):
            with self.assertRaises(OSError):release(self.root,selective['run_id'],clean['run_id'],self.global_path)
        self.assertEqual(before,(self.root/'candidate.json').read_bytes());self.assertFalse((self.root/'releases'/selective['run_id']).exists())
        folder=release(self.root,selective['run_id'],clean['run_id'],self.global_path);verify_export(folder)
        self.assertEqual(folder,release(self.root,selective['run_id'],clean['run_id'],self.global_path))
        native=sqlite3.connect(folder/'query.sqlite3');self.assertTrue(native.execute('SELECT count(*) FROM windows').fetchone()[0]);native.close()
        Path(a['descriptor']['cache_path']).write_text('changed source after export',encoding='utf-8')
        with self.assertRaises(StaleInput):select_candidate(self.root,folder)
        self.assertEqual(before,(self.root/'candidate.json').read_bytes())

if __name__=='__main__':
    if '--crash-worker' in sys.argv:
        s=JobStore(sys.argv[-1]);s.acquire();s.db.execute('CREATE TABLE facts(value TEXT)');s.register('r','j','t','scope','fp','v')
        def crash(db):db.execute("INSERT INTO facts VALUES('uncommitted')");os._exit(19)
        s.execute('j',crash)
    else:unittest.main()
