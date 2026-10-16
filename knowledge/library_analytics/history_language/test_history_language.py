import json,re,sqlite3,tempfile,unittest,subprocess,sys
from unittest.mock import patch
from pathlib import Path
from .adapters import atf_groups,quote_locations,normalize_with_map,lexicon,oracc_json,historical,mention_patterns
from .inputs import OUT,checked,split,NAMESPACES
from .contract import SCHEMA,SUPPLEMENT_CRITERIA
from .processor import process_row
from . import scripture_entities
from .evaluation import resolve_witness
from ..jobs import JobStore,StaleInput
from ..concept_index import filehash

class ContractTests(unittest.TestCase):
 def setUp(self):
  (OUT/'tests').mkdir(exist_ok=True);self.temp=tempfile.TemporaryDirectory(dir=OUT/'tests');self.root=Path(self.temp.name)
 def tearDown(self):self.temp.cleanup()
 def test_quote_whitespace_and_unicode_offsets(self):
  text='α𐀀\n  father\tand son\nω';a,b,method=quote_locations(text,'father and son')[0]
  self.assertEqual('father\tand son',text[a:b]);self.assertEqual('whitespace-normalized',method)
 def test_repeated_quote_keeps_multiple_witnesses(self):self.assertEqual(2,len(quote_locations('abc abc','abc')))
 def test_no_semantic_quote_substitution(self):self.assertEqual([],quote_locations('father','parent'))
 def test_atf_range_many_to_one(self):
  text="1'.\ta\n#note: alternate\n2'.\tb\n@translation labeled en project\n@(1' - 2') English\n$ lacuna\n"
  groups,errors=atf_groups(text);self.assertEqual([],errors);g=groups[0];self.assertEqual(['1\'','2\''],[x[0] for x in g['line_spans']]);self.assertEqual('English',text[g['target_start']:g['target_end']])
 def test_atf_does_not_zip_missing_label(self):
  groups,errors=atf_groups('1. a\n@translation labeled en project\n@(2) English');self.assertFalse(groups);self.assertTrue(errors)
 def test_atf_duplicate_labels_defer(self):
  groups,errors=atf_groups('1. a\n1. b\n@translation labeled en project\n@(1) English');self.assertFalse(groups);self.assertTrue(errors)
 def test_atf_no_language_marker_defer(self):self.assertFalse(atf_groups('1. a\n@(1) English')[0])
 def test_atf_reverse_range_defer(self):self.assertFalse(atf_groups('1. a\n2. b\n@translation labeled en project\n@(2 - 1) English')[0])
 def test_changed_input_rejected(self):
  p=self.root/'source.txt';p.write_text('old');sha=filehash(p);p.write_text('new')
  with self.assertRaises(StaleInput):checked(p,sha)
 def test_atomic_stale_job_has_no_facts_or_checkpoint(self):
  s=JobStore(self.root/'jobs.sqlite3');s.acquire();s.db.executescript('create table facts(value);');s.register('r','j','test','s','fp','v')
  def fail(db):db.execute('insert into facts values(1)');raise StaleInput('changed')
  self.assertEqual('stale',s.execute('j',fail));self.assertEqual(0,s.db.execute('select count(*) from facts').fetchone()[0]);self.assertEqual(0,s.db.execute('select count(*) from checkpoints').fetchone()[0]);s.close()
 def test_existing_live_lease_refused(self):
  a=JobStore(self.root/'jobs.sqlite3');b=JobStore(self.root/'jobs.sqlite3');a.acquire()
  try:
   with self.assertRaises(RuntimeError):b.acquire()
  finally:b.close();a.close()
 def test_completed_idempotent_and_resume(self):
  p=self.root/'jobs.sqlite3';a=JobStore(p);a.acquire();a.db.execute('create table facts(value)');a.register('r','j','test','s','fp','v');a.execute('j',lambda db:db.execute('insert into facts values(1)').rowcount);a.close()
  b=JobStore(p);b.acquire();self.assertEqual('skipped',b.execute('j',lambda db:1/0));self.assertEqual(1,b.db.execute('select count(*) from facts').fetchone()[0]);b.close()
 def test_oracc_source_ids_language_and_gloss(self):
  p=self.root/'q.json';p.write_text(json.dumps({'type':'cdl','textid':'Q1','project':'p','cdl':[{'node':'l','ref':'Q1.1.1','id':'t1','f':{'form':'ab','sense':'father','lang':'akk','pos':'N'}}]}))
  db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row;db.executescript(SCHEMA)
  row={'id':'resource:existing','adapter':'oracc-json','paths':[{'path':str(p),'sha256':filehash(p),'size':p.stat().st_size}],'record':{},'resource':{'id':'resource:existing'}}
  oracc_json(db,'r',row,{'source_docs':{}})
  a=db.execute('select * from language_alignments').fetchone();self.assertEqual('akk',a['source_language']);self.assertEqual('oracc-lexical-annotation',a['relation']);self.assertEqual('Q1.1.1',json.loads(a['numbering_json'])['ref'])
  for w in db.execute('select * from witnesses'):resolve_witness(w,{})
  self.assertEqual(0,db.execute('select count(*) from historical_links').fetchone()[0]);db.close()
 def test_split_stable_and_distinct(self):
  splits={split('a','s',str(i)) for i in range(100)};self.assertEqual({'development','reserved'},splits);self.assertEqual(split('a','s','5'),split('a','s','5'))
 def test_real_process_death_rolls_back_and_recovers_same_job(self):
  script=self.root/'crash.py';dbpath=self.root/'crash.sqlite3'
  script.write_text("import os,sys\nfrom knowledge.library_analytics.jobs import JobStore\ns=JobStore(sys.argv[1]);s.acquire();s.db.execute('create table facts(value)');s.register('r','j','test','scope','fp','v')\ndef crash(db):\n db.execute('insert into facts values(1)');os._exit(23)\ns.execute('j',crash)\n",encoding='utf-8')
  env=__import__('os').environ.copy();env['PYTHONPATH']=str(Path(__file__).resolve().parents[3])
  completed=subprocess.run([sys.executable,str(script),str(dbpath)],env=env,capture_output=True)
  self.assertEqual(23,completed.returncode,completed.stderr.decode(errors='replace'))
  recovered=JobStore(dbpath);recovered.acquire()
  try:
   self.assertEqual('pending',recovered.db.execute("select state from jobs where id='j'").fetchone()[0]);self.assertEqual(0,recovered.db.execute('select count(*) from facts').fetchone()[0]);self.assertEqual(0,recovered.db.execute('select count(*) from checkpoints').fetchone()[0])
   self.assertEqual('completed',recovered.execute('j',lambda db:db.execute('insert into facts values(1)').rowcount));self.assertEqual(1,recovered.db.execute('select count(*) from facts').fetchone()[0])
  finally:recovered.close()
 def test_lexicon_aramic_usage_is_not_hebrew_prose_translation(self):
  p=self.root/'HebrewStrong.xml';p.write_text('<lexicon><entry id="H2"><w xml:lang="arc">אַב</w><source>corresponding to H1</source><usage>father.</usage></entry></lexicon>',encoding='utf-8')
  db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row;db.executescript(SCHEMA)
  row={'id':'lexicon:test','adapter':'lexicon','paths':[{'path':str(p),'sha256':filehash(p)}],'record':[{'document_id':'existing:doc','xml_link':{'entry_key':'H2:0'}}],'resource':None}
  with patch('knowledge.library_analytics.history_language.adapters.bind_document'):
   lexicon(db,'r',row,{})
  a=db.execute('select * from language_alignments').fetchone();self.assertEqual('arc',a['source_language']);self.assertEqual('lexicon-usage-list',a['relation']);self.assertIsNone(json.loads(a['credits_json'])['translator'])
  self.assertEqual('H2',json.loads(a['numbering_json'])['native_entry']);db.close()
 def test_historical_dates_alternatives_and_identity_ambiguity_survive(self):
  p=self.root/'source.txt';p.write_text('Two readings of Flavius Josephus in 94 CE.',encoding='utf-8');proof={'path':str(p),'sha256':filehash(p)}
  rec={'claimId':'evidence:old','sourceId':'resource:old','quote':p.read_text(),'locator':'institutional summary','private':{'extractedPath':str(p)},'dates':{'objectOrWork':None,'discovery':None,'editionPublication':'2020','retrieval':None,'review':'2026'},'review':{'kind':'ai-assisted'},'limits':['Alterations debated'],'alternatives':[{'interpretation':'different reconstruction'}]}
  row={'id':'citation:old','adapter':'historical-citation','paths':[proof],'record':rec,'resource':{'id':'resource:old'}};db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row;db.executescript(SCHEMA)
  entities=[{'id':'historians:old','title':'Flavius Josephus','namespace':'historians'},{'id':'scholars:old','title':'Flavius Josephus','namespace':'scholars'}]
  historical(db,'r',row,{'relations':[],'entities':entities,'source_docs':{}})
  mention=db.execute("select ambiguity_json from historical_links where state='candidate-ambiguous'").fetchone();self.assertEqual(2,len(json.loads(mention[0])))
  preserved=json.loads(db.execute("select record_json from historical_links where basis='explicit-citation-claim'").fetchone()[0]);self.assertEqual(rec,preserved)
  dates=dict(db.execute('select role,raw from dates'));self.assertIsNone(dates['objectOrWork']);self.assertEqual('2020',dates['editionPublication']);self.assertEqual('94 CE',dates['mentioned-date-unassigned']);db.close()
 def test_same_source_and_extraction_path_is_one_dependency(self):
  p=self.root/'s.txt';p.write_text('actual source');proof={'path':str(p),'sha256':filehash(p),'size':p.stat().st_size}
  row={'id':'citation:test','adapter':'historical-citation','paths':[proof,dict(proof)],'record':{'sourceId':'resource:test','claimId':'evidence:test','dates':{},'locator':'held file','private':{'extractedPath':str(p)},'quote':None},'resource':None}
  db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row;db.executescript(SCHEMA);process_row(db,'r',row,{})
  self.assertEqual(1,db.execute('select count(*) from dependencies').fetchone()[0]);self.assertEqual(1,db.execute('select count(*) from results').fetchone()[0]);db.close()

class ScriptureEntityTests(unittest.TestCase):
 """The curated Scripture dictionary: built from repository files only, identity-safe, deterministic."""
 @classmethod
 def setUpClass(cls):cls.built=scripture_entities.build();cls.rows=cls.built['entities']
 def test_namespace_is_registered_for_the_selection(self):
  self.assertIn('scripture-entities',NAMESPACES)
  for name in ('historians','archaeology','scholars','scholars-find','evidence'):self.assertIn(name,NAMESPACES)
 def test_rows_have_registry_entity_shape(self):
  for row in self.rows:
   self.assertEqual({'id','kind','namespace','original_id','title','record'},set(row))
   self.assertEqual('scripture-entities',row['namespace']);self.assertTrue(row['title'].strip())
   self.assertIn(row['kind'],{'person','place','people-group'});json.loads(row['record'])
 def test_ids_are_unique_so_mention_links_cannot_collide(self):
  identifiers=[row['id'] for row in self.rows];self.assertEqual(len(identifiers),len(set(identifiers)))
 def test_person_researched_twice_is_one_identity_with_both_roles(self):
  self.assertEqual(['deborah-jdg-4-4','moses-exo-2-10','samuel-1sa-1-20'],self.built['merged_person_records'])
  moses=[r for r in self.rows if r['original_id']=='moses-exo-2-10']
  self.assertEqual(1,len(moses))
  record=json.loads(moses[0]['record']);self.assertEqual(['prophet','ruler'],sorted(x['role'] for x in record['roles']))
  self.assertEqual({'Research/People/prophets-wilderness-judges.md','Research/People/rulers-judges.md'},
   {x['dossier'] for x in record['roles']})
 def test_same_title_keeps_every_candidate_and_asserts_no_equality(self):
  zechariahs=[r for r in self.rows if r['title']=='Zechariah']
  self.assertGreater(len(zechariahs),1)
  for row in zechariahs:self.assertIn('not asserted to be the same referent',json.loads(row['record'])['identity'])
 def test_variant_titles_are_recorded_but_never_match_keys(self):
  titles={r['title'] for r in self.rows}
  variants={v for r in self.rows if r['kind']=='person' for v in json.loads(r['record'])['other_titles']}
  self.assertTrue(variants)
  keys={pattern.pattern for pattern,_ in mention_patterns(self.rows)}
  for variant in variants-titles:self.assertNotIn(r'(?<!\w)'+re.escape(variant)+r'(?!\w)',keys)
 def test_places_are_one_row_per_atlas_pin_titled_by_the_atlas(self):
  atlas={p['id']:p for p in scripture_entities.read_json(scripture_entities.PLACES)}
  pinned=[r for r in self.rows if r['kind']=='place' and r['original_id']]
  self.assertEqual(len(pinned),len({r['original_id'] for r in pinned}))
  for row in pinned:self.assertEqual(atlas[row['original_id']]['name'],row['title'])
 def test_annotated_research_labels_are_attestations_not_titles(self):
  jerusalem=[r for r in self.rows if r['kind']=='place' and r['title']=='Jerusalem']
  self.assertEqual(1,len(jerusalem))
  labels=json.loads(jerusalem[0]['record'])['research_labels']
  self.assertGreater(len(labels),1);self.assertIn('Jerusalem',labels)
 def test_unpinned_reference_does_not_split_a_pinned_place(self):
  folded=self.built['unpinned_names_folded_into_pinned_places']
  self.assertIn('Caesarea',folded)
  self.assertEqual(1,len([r for r in self.rows if r['kind']=='place' and r['title']=='Caesarea']))
 def test_no_pin_is_invented_for_an_unpinned_place(self):
  for row in self.rows:
   record=json.loads(row['record'])
   if row['kind']=='place' and not row['original_id']:self.assertIsNone(record['atlas'])
 def test_mention_minimum_excludes_the_titles_that_are_english_words(self):
  self.assertEqual(4,SUPPLEMENT_CRITERIA['mention_min_title_length']['scripture-entities'])
  keys={pattern.pattern for pattern,_ in mention_patterns(self.rows)}
  self.assertNotIn(r'(?<!\w)'+re.escape('So')+r'(?!\w)',keys)
  self.assertIn(r'(?<!\w)'+re.escape('David')+r'(?!\w)',keys)
 def test_existing_namespaces_keep_the_six_character_minimum(self):
  entities=[{'id':'scholars:x','title':'Petrie','namespace':'scholars'},
            {'id':'scholars:y','title':'Rost','namespace':'scholars'},
            {'id':'evidence:z','title':'Mesha Stele','namespace':'evidence'}]
  self.assertEqual(['scholars:x'],[eid for _,eid in mention_patterns(entities)])
 def test_build_is_byte_deterministic(self):
  self.assertEqual(json.dumps(self.built,sort_keys=True),json.dumps(scripture_entities.build(),sort_keys=True))
 def test_curated_sources_are_recorded_with_checksums(self):
  roles={s['role'] for s in self.built['sources']}
  self.assertEqual({'research-group-index','researched-figures','atlas-pins','tribe-records'},roles)
  for source in self.built['sources']:
   self.assertEqual(64,len(source['sha256']));self.assertGreater(source['bytes'],0)
   self.assertFalse(source['project_path'].startswith('/'))
 def test_missing_curated_source_raises_rather_than_degrading(self):
  with patch.object(scripture_entities,'PLACES',Path('no-such-places.json')):
   with self.assertRaises(OSError):scripture_entities.build()

if __name__=='__main__':unittest.main()
