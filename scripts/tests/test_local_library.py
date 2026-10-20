"""Disposable reader-scope checks. Never open live corpus/curation databases."""
import contextlib
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC=importlib.util.spec_from_file_location('local_library',Path(__file__).resolve().parents[1]/'local_library.py')
reader=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(reader)


class ReaderScopeTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
  self.root=Path(self.temp.name);self.site=self.root/'Website';self.state=self.root/'KnowledgeBase'
  self.sources=self.root/'sources/library';self.private=self.site/'.local/local-library';self.scope=self.site/'scripts/local-reader-scope.json'
  for key,value in [('SITE',self.site),('STATE',self.state),('SOURCES',self.sources),('PRIVATE',self.private),('SCOPE',self.scope)]:
   p=patch.object(reader,key,value);p.start();self.addCleanup(p.stop)
  self.cache=self.state/'extracted-library/test.jsonl';self.cache.parent.mkdir(parents=True)
  self.text='First context. '+'Selected evidence and its context. '*1800
  self.cache.write_text(json.dumps({'locator':'EPUB section 1: text.xhtml','text':self.text})+'\n',encoding='utf-8')
  self.source=self.sources/'reviewed/original.epub';self.source.parent.mkdir(parents=True);self.source.write_bytes(b'original fixture source')
  self.sha=reader.digest(self.source);self.ident='local-'+self.sha;self.record_id='held-'+self.sha[:32]
  self.public={'id':self.record_id,'sha256':self.sha,'title':'Reviewed title','authors':['Unprofiled Author'],
   'contributors':['contributor-source-only'],'source':'recorded-source','sourceId':None,'sourceUrl':'https://source.example/copy',
   'language':'und','genre':'text','licence':'Private noncommercial reading only','credit':'Author; source',
   'workId':None,'editionId':None,'availability':'permission-required','pages':0,'reviewWarning':None}
  self.shard=self.site/'public/content/teacher-library/records'/(hashlib.sha256(self.record_id.encode()).hexdigest()[:2]+'.json')
  reader.write(self.shard,{self.record_id:self.public})
  self.item={'sha256':self.sha,'source':'reviewed/original.epub','cache':'test.jsonl','cacheSha256':reader.digest(self.cache),
   'recordId':self.record_id,'recordSha256':hashlib.sha256(json.dumps(self.public,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'evidence':'fixture'}
  self.save_scope()
  self.original={'schemaVersion':1,'builtAt':'profile-snapshot','sourceDatabase':'unchanged',
   'documents':{'local-existing':{'title':'Existing copy','unknownField':{'preserved':True}}},
   'bindings':{'work-existing':['local-existing']},'profiles':{'author-featured':['local-existing']},
   'contributors':{'contributor-featured':'author-featured'},'counts':{'profiles':1,'heldReadingCopies':1,'intakeFilesExamined':99},'scope':'unchanged'}
  self.private.mkdir(parents=True);self.index=self.private/'index.json'
  # Deliberately formatted: backup/rollback must preserve exact original bytes.
  self.before=(json.dumps(self.original,indent=2)+'\n').encode();self.index.write_bytes(self.before);self.expected=reader.digest(self.index)

 def save_scope(self):reader.write(self.scope,{'schemaVersion':1,'copies':[self.item]})
 def apply(self):
  with contextlib.redirect_stdout(io.StringIO()):reader.apply_reader_scope(self.expected)

 def test_exact_addition_preserves_existing_snapshot_and_use(self):
  self.apply();result=reader.read(self.index);row=result['documents'][self.ident]
  for key in ['profiles','contributors','builtAt','sourceDatabase','scope']:self.assertEqual(self.original[key],result[key])
  self.assertEqual(result['documents']['local-existing'],self.original['documents']['local-existing'])
  self.assertEqual(result['bindings']['work-existing'],['local-existing'])
  self.assertEqual(result['bindings'][self.record_id],[self.ident]);self.assertEqual(len(result['documents']),2)
  self.assertEqual(result['counts'],{**self.original['counts'],'heldReadingCopies':2})
  for key in ['authors','licence','credit','sourceUrl','workId','editionId']:self.assertEqual(row[key],self.public[key])
  self.assertEqual(row['authorIds'],self.public['contributors']);self.assertEqual(reader.read(self.shard)[self.record_id],self.public)
  # Another held file remains excluded without a reviewed manifest entry.
  (self.sources/'unspecified.epub').write_bytes(b'not scoped');self.assertEqual(len(result['documents']),2)

 def test_retry_is_byte_and_timestamp_idempotent(self):
  self.apply();data=self.index.read_bytes();stamp=self.index.stat().st_mtime_ns
  self.expected=reader.digest(self.index);self.apply()
  self.assertEqual(self.index.read_bytes(),data);self.assertEqual(self.index.stat().st_mtime_ns,stamp)

 def test_original_cache_and_metadata_drift_abort_without_mutation(self):
  for target in [self.source,self.cache,self.shard]:
   with self.subTest(target=target):
    data=target.read_bytes();target.write_bytes(data+b' ')
    # JSON whitespace alone preserves record identity, so change actual metadata.
    if target==self.shard:reader.write(target,{self.record_id:{**self.public,'credit':'Changed credit'}})
    with self.assertRaises(ValueError):self.apply()
    self.assertEqual(self.index.read_bytes(),self.before);target.write_bytes(data)

 def test_scope_paths_and_exact_identity_are_guarded(self):
  outside=self.root/'outside.epub';outside.write_bytes(self.source.read_bytes())
  for changes in [{'source':str(outside)},{'cache':str(outside)},{'recordId':'held-other'}]:
   with self.subTest(changes=changes):
    saved=copy.deepcopy(self.item);self.item.update(changes);self.save_scope()
    with self.assertRaises(ValueError):self.apply()
    self.assertEqual(self.index.read_bytes(),self.before);self.item=saved;self.save_scope()

 def test_lock_contention_never_reclaims_owner(self):
  with reader.index_owner():
   with self.assertRaisesRegex(ValueError,'owner'):self.apply()
   self.assertTrue((self.private/'index-write.lock').exists())
  self.assertEqual(self.index.read_bytes(),self.before)

 def test_compare_rejects_new_snapshot(self):
  self.index.write_bytes(self.before+b' ')
  with self.assertRaisesRegex(ValueError,'changed'):self.apply()
  self.assertEqual(self.index.read_bytes(),self.before+b' ')

 def test_late_publication_conflict_preserves_concurrent_change(self):
  actual=reader.index_hash;calls=0
  def changed():
   nonlocal calls
   calls+=1
   if calls==2:self.index.write_bytes(self.before+b' ')
   return actual()
  with reader.index_owner(),patch.object(reader,'index_hash',side_effect=changed):
   with self.assertRaisesRegex(ValueError,'changed'):reader.publish_index({**self.original,'added':True},self.expected)
  self.assertEqual(self.index.read_bytes(),self.before+b' ')
  self.assertFalse(list(self.private.glob('*.tmp')))

 def test_conflicting_document_or_binding_requires_review(self):
  for key,value in [('documents',{**self.original['documents'],self.ident:{'different':'identity'}}),('bindings',{self.record_id:['local-other']})]:
   with self.subTest(key=key):
    reader.write(self.index,{**self.original,key:value});self.expected=reader.digest(self.index);before=self.index.read_bytes()
    with self.assertRaises(ValueError):self.apply()
    self.assertEqual(self.index.read_bytes(),before)

 def test_prepared_pages_roundtrip_all_text_and_enforce_dependencies(self):
  row=reader.scoped_rows()[0];manifest=reader.prepare(row)
  text=''.join(b['text'] for n in range(manifest['pages']) for b in reader.read(self.private/'pages'/self.sha/(str(n)+'.json'))['blocks'])
  self.assertEqual(text,self.text);self.assertEqual(manifest['characters'],len(self.text));self.assertGreater(manifest['pages'],1)
  record=reader.record(row,manifest);self.assertEqual(record['contributors'],self.public['contributors']);self.assertEqual(record['availability'],'local-text')
  self.cache.write_text('changed',encoding='utf-8')
  with self.assertRaisesRegex(ValueError,'dependencies'):reader.prepare(row)

 def test_missing_or_changed_original_rejects_existing_pages(self):
  row=reader.scoped_rows()[0];reader.prepare(row);self.source.unlink()
  with self.assertRaises(FileNotFoundError):reader.prepare(row)

 def test_re_reviewed_extraction_regenerates_existing_pages(self):
  row=reader.scoped_rows()[0];reader.prepare(row)
  self.cache.write_text(json.dumps({'locator':'Reviewed revision','text':'Updated reviewed extraction'})+'\n',encoding='utf-8')
  row['cacheSha256']=reader.digest(self.cache)
  manifest=reader.prepare(row)
  self.assertEqual(manifest['characters'],len('Updated reviewed extraction'))
  self.assertEqual(reader.read(self.private/'pages'/self.sha/'0.json')['blocks'][0]['text'],'Updated reviewed extraction')
  self.assertEqual(manifest['readerDependencies']['cacheSha256'],row['cacheSha256'])

 def test_changed_use_metadata_rejects_prepared_scoped_copy(self):
  row=reader.scoped_rows()[0];reader.prepare(row)
  reader.write(self.shard,{self.record_id:{**self.public,'licence':'Changed use conditions'}})
  with self.assertRaisesRegex(ValueError,'attribution/use'):reader.prepare(row)

 def test_exact_backup_restore_and_changed_current_rollback_guard(self):
  self.apply();new_hash=reader.digest(self.index);self.assertEqual((self.private/'index-backups'/(self.expected+'.json')).read_bytes(),self.before)
  with contextlib.redirect_stdout(io.StringIO()):reader.restore_index(self.expected,new_hash)
  self.assertEqual(self.index.read_bytes(),self.before)
  self.index.write_bytes(self.before+b' ')
  with self.assertRaisesRegex(ValueError,'changed'):reader.restore_index(new_hash,self.expected)
  self.assertEqual(self.index.read_bytes(),self.before+b' ')

 def test_corrupt_backup_cannot_replace_index(self):
  self.apply();current=self.index.read_bytes();backup=self.private/'index-backups'/(self.expected+'.json');backup.write_bytes(b'bad')
  with self.assertRaisesRegex(ValueError,'mismatch'):reader.restore_index(self.expected,reader.digest(self.index))
  self.assertEqual(self.index.read_bytes(),current)


if __name__=='__main__':unittest.main()
