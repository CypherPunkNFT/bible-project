"""Curation durability and real located discovery, isolated from owner decisions."""
from pathlib import Path
import json,sqlite3,tempfile,unittest,uuid,hashlib
from knowledge.library_analytics.candidate_review import Curation,ReviewError,SITE,read,sha
from knowledge.library_analytics.jobs import JobStore

class ReviewTests(unittest.TestCase):
 def setUp(self):
  base=SITE/'.local/curation-tests';base.mkdir(exist_ok=True)
  self.tmp=tempfile.TemporaryDirectory(dir=base);self.root=Path(self.tmp.name)
  self.service=Curation(root=self.root/'review',shared=self.root/'shared.sqlite3')
  self.catalog=self.root/'catalog.json';self.catalog.write_bytes(self.service.catalog.read_bytes());self.service.catalog=self.catalog
  self.call(action='sync')
 def tearDown(self):self.tmp.cleanup()
 def call(self,**p):return self.service.mutate({'requestId':str(uuid.uuid4()),**p})
 def item(self,id='justification'):return next(x for x in self.service.get()['items'] if x['id']==id)
 def decision(self,status,id='justification',**extra):
  r=self.item(id);return self.call(action='decide',id=id,fingerprint=r['fingerprint'],expectedRevision=r['revision'],status=status,**extra)
 def test_initial_mapping_and_no_owner_approvals(self):
  state=self.service.get();self.assertEqual(state['counts']['pending'],21);self.assertEqual(state['counts']['approved'],0)
  marks=self.service.get('marks')['marks'];self.assertTrue(any(m['kind']=='pair' for m in marks));self.assertTrue(any(m['kind']=='language' for m in marks));self.assertEqual(sum(m['track']=='lk202' for m in marks),180)
 def test_approval_atomic_mapping_idempotence_and_stale_tab(self):
  r=self.item();p={'requestId':str(uuid.uuid4()),'action':'decide','id':r['id'],'fingerprint':r['fingerprint'],'expectedRevision':r['revision'],'status':'approved','note':'Include this narrow comparison.'}
  result=self.service.mutate(p);sequence=self.service.get()['sequence'];self.assertEqual(result,self.service.mutate(p));self.assertEqual(self.service.get()['sequence'],sequence)
  self.assertEqual(self.item()['status'],'approved');self.assertTrue(all(m['status']=='approved' for m in self.service.get('marks')['marks'] if m['candidateId']==r['id']))
  with self.assertRaises(ReviewError) as err:self.service.mutate({**p,'requestId':str(uuid.uuid4()),'status':'rejected'})
  self.assertEqual(err.exception.status,409)
  with self.assertRaises(ReviewError):self.service.mutate({**p,'status':'rejected'})
  self.assertEqual(self.service.get()['sequence'],sequence)
  work=read(self.service.root/'integration-queue.json');self.assertEqual(work['items'][0]['proposal']['id'],r['id'])
 def test_sync_preserves_decisions_and_projection_bytes(self):
  self.decision('approved');p=self.service.root/'SOURCE-REVIEW.md';before=p.read_bytes();mtime=p.stat().st_mtime_ns
  self.assertEqual(self.call(action='sync')['changed'],0);self.assertEqual(self.item()['status'],'approved');self.assertEqual(p.read_bytes(),before);self.assertEqual(p.stat().st_mtime_ns,mtime)
  pointer=read(self.service.root/'latest-curation.json');release=self.service.root/'releases'/pointer['release'];self.assertEqual(hashlib.sha256((release/'manifest.json').read_bytes()).hexdigest(),pointer['manifestSha256'])
  for f in read(release/'manifest.json')['files']:self.assertEqual(hashlib.sha256((release/f['name']).read_bytes()).hexdigest(),f['sha256'])
 def test_changed_proposal_invalidates_approval_without_erasing_history(self):
  self.decision('approved');previous=self.item()['fingerprint'];cat=read(self.catalog)
  next(c for c in cat['candidates'] if c['id']=='justification')['finding']+=' A changed editorial assertion needs review.'
  self.catalog.write_text(json.dumps(cat),'utf-8');self.assertTrue(self.service.get()['needsSync']);self.assertTrue(all(m['status']=='stale' for m in self.service.get('marks')['marks'] if m['candidateId']=='justification'));self.call(action='sync')
  item=self.item();self.assertEqual(item['status'],'stale');self.assertNotEqual(item['fingerprint'],previous)
  events=self.service.get('history','justification')['events'];self.assertTrue(any(e['to_status']=='approved' and e['fingerprint']==previous for e in events));self.assertEqual(events[0]['action'],'invalidate')
 def test_failed_transaction_replays_without_partial_decision(self):
  r=self.item();seq=self.service.get()['sequence'];p={'action':'decide','requestId':str(uuid.uuid4()),'id':r['id'],'fingerprint':r['fingerprint'],'expectedRevision':r['revision'],'status':'approved'}
  self.service.fail_before_checkpoint=True
  with self.assertRaises(RuntimeError):self.service.mutate(p)
  self.assertEqual(self.item()['status'],'pending');self.assertEqual(self.service.get()['sequence'],seq)
  db=self.service.ro();self.assertEqual(db.execute('SELECT count(*) FROM requests WHERE id=?',(p['requestId'],)).fetchone()[0],0);db.close()
  self.service.fail_before_checkpoint=False;self.service.mutate(p);self.assertEqual(self.item()['status'],'approved');self.assertEqual(self.service.get()['sequence'],seq+1)
 def test_live_writer_lease_is_not_taken_over(self):
  owner=JobStore(self.service.shared);owner.acquire()
  try:
   with self.assertRaises(ReviewError) as err:self.decision('approved')
   self.assertEqual(err.exception.status,409);self.assertEqual(self.item()['status'],'pending')
  finally:owner.close()
 def test_export_failure_does_not_report_committed_decision_as_rolled_back(self):
  original=self.service.export
  def broken(db):raise OSError('Disposable export failure')
  self.service.export=broken
  result=self.decision('approved');self.assertTrue(result['committed']);self.assertIn('warning',result);self.assertEqual(self.item()['status'],'approved');self.assertTrue(self.service.get()['needsExport'])
  self.service.export=original;self.call(action='sync');self.assertFalse(self.service.get()['needsExport'])
 def test_integration_requires_current_approval_and_receipt(self):
  with self.assertRaises(ReviewError):self.decision('integrated',destination='/study/test',integrationEvidence='fixture only')
  self.decision('approved')
  with self.assertRaises(ReviewError):self.decision('integrated',destination='/study/test')
  self.decision('integrated',destination='/study/test',integrationEvidence='Disposable test fixture; no real site changed.')
  self.assertEqual(self.item()['status'],'integrated');self.assertEqual(self.service.get('history','justification')['events'][0]['actor'],'owner')
 def test_discovery_requires_preparation_and_deduplicates(self):
  source={'track':'kr110','kind':'review','key':'aff6dbcc5dcf6e015b9f7336'}
  first=self.call(action='nominate',**source);again=self.call(action='nominate',**source);self.assertEqual(first['id'],again['id']);self.assertTrue(again['duplicate']);id=first['id']
  with self.assertRaises(ReviewError):self.decision('approved',id)
  r=self.item(id);self.call(action='prepare',id=id,expectedRevision=r['revision'],fingerprint=r['fingerprint'],proposal={'title':'Anxiety and prayer: a source reading path','finding':'Selected historical source passages connect prayer, trust and thanksgiving; attribution still needs careful source review.','benefit':'A reader can inspect the selected devotional arguments in their context.','placement':'Study → practical reading'},note='Disposable preparation fixture')
  self.assertEqual(self.item(id)['status'],'pending');self.decision('approved',id);self.assertEqual(self.item(id)['status'],'approved')
 def test_real_indexed_discovery_has_durable_cursor_and_new_sources(self):
  recipe={'action':'discover','track':'kr110','q':'sabbath','author':'Hodge','purpose':'Teachers → Hodge → study sources','family':'Bible reading'}
  first=self.call(**recipe);self.assertTrue(first['created'],first)
  second=self.call(**recipe);self.assertTrue(set(first['created']).isdisjoint(second['created']))
  for id in [*first['created'],*second['created']]:
   r=self.item(id);self.assertEqual(r['status'],'discovered');self.assertTrue(r['data']['sources'][0]['text']);self.assertEqual(sha(r['data']['sources'][0]['text']),r['data']['sources'][0]['sha256'])
  db=self.service.ro();row=db.execute('SELECT * FROM discovery_cursors').fetchone();self.assertEqual(row['batches'],2);self.assertGreater(row['visited'],0);db.close()

if __name__=='__main__':unittest.main()
