"""Source identity ownership, protected fields, atomic recovery and rollback."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from .build import DEFAULT_OUT
from .apply import encoded,publish,rollback,package_updates,sha
from ..library_identity import load_identities,fill_identity,apply_hints,load_contributors,IDENTITY_FILE,CONTRIBUTOR_FILE


class ApplicationTests(unittest.TestCase):
    def setUp(self):
        root=DEFAULT_OUT/'test-runtime';root.mkdir(exist_ok=True)
        self.temp=tempfile.TemporaryDirectory(dir=root);self.project=Path(self.temp.name);self.site=self.project/'Website'
        self.site.mkdir();self.hash='a'*64
    def tearDown(self):self.temp.cleanup()
    def write(self,path,value):path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(encoded(value))
    def canonical(self):
        self.write(self.site/'content/library/catalog/works/w.json',{'id':'w','kind':'work'})
        self.write(self.site/'content/library/catalog/editions/e.json',{'id':'e','kind':'edition','workId':'w'})
    def folder(self):
        result=self.project/'KnowledgeBase/library-analytics/pipeline/applications/fixture';result.mkdir(parents=True);return result

    def test_work_only_fill_and_owner_conflicts(self):
        self.canonical();self.write(self.site/IDENTITY_FILE,{'schemaVersion':1,'records':[{'sha256':self.hash,'fields':{'workId':'w'}}]})
        corrections=load_identities(self.site)
        before={'sha256':self.hash,'workId':None,'licence':'restricted','availability':'permission-required','contributors':['editor'],'pageBundles':['pages/original']}
        after=fill_identity(before,corrections)
        self.assertEqual(after,before|{'workId':'w'});self.assertEqual(fill_identity(after,corrections),after)
        with self.assertRaises(ValueError):fill_identity(before|{'workId':'different'},corrections)
        hints={'path':{'sha256':self.hash,'manifests':set()}}
        apply_hints(hints,{},corrections,self.site/IDENTITY_FILE);self.assertEqual(hints['path']['workId'],'w')
        self.assertIn(str(self.site/IDENTITY_FILE),hints['path']['manifests'])

    def test_canonical_pair_and_rights_are_guarded(self):
        self.canonical()
        for fields in ({'workId':'w','licence':'Public domain'},{'workId':'w','editionId':'../e'},{'workId':'w','editionId':'e'}):
            self.write(self.site/IDENTITY_FILE,{'schemaVersion':1,'records':[{'sha256':self.hash,'fields':fields}]})
            if fields=={'workId':'w','editionId':'e'}:self.assertEqual(len(load_identities(self.site)),1)
            else:
                with self.assertRaises(ValueError):load_identities(self.site)
        self.write(self.site/'content/library/catalog/editions/e.json',{'id':'e','kind':'edition','workId':'different'})
        with self.assertRaises(ValueError):load_identities(self.site)

    def test_contributor_context_and_package_memberships_are_preserved(self):
        authority={'id':'assembly','name':'Church messengers','entityType':'institution','eligibility':'context-only','traditions':[]}
        self.write(self.site/'content/library/authors.json',{'authors':[authority]})
        self.write(self.site/CONTRIBUTOR_FILE,{'schemaVersion':1,'records':[{'id':'assembly','authority':'content/library/authors.json','sourceRecord':authority}]})
        authorities=load_contributors(self.site);folder=self.site/'public/content/teacher-library'
        record={'id':'held-a','sha256':self.hash,'workId':'w','editionId':None,'contributors':['assembly','editor'],
            'title':'Source text','language':'en','source':'source','genre':'text','availability':'permission-required',
            'pages':0,'pageBundles':[],'licence':'original licence','credit':'original credit','sourceUrl':'https://example.org/source'}
        self.write(folder/'records/aa.json',{'held-a':record});self.write(folder/'catalogue.json',{'contributors':[],'storage':'packed-v1'})
        corrections={self.hash:{'fields':{'workId':'w','editionId':'e'}}}
        updates,counts=package_updates(folder,corrections,authorities)
        changed=json.loads(updates[folder/'records/aa.json'])['held-a']
        self.assertEqual(changed,record|{'editionId':'e'});self.assertEqual(counts['fields'],1)
        entry=json.loads(updates[folder/'catalogue.json'])['contributors'][0]
        self.assertEqual((entry['entityType'],entry['eligibility'],entry['profileId']),('institution','context-only',None))
        for path,raw in updates.items():path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
        self.assertFalse(package_updates(folder,corrections,authorities)[0])
        self.write(self.site/'content/library/authors.json',{'authors':[authority|{'eligibility':'eligible'}]})
        with self.assertRaises(ValueError):load_contributors(self.site)

    def test_application_rollback_and_later_edit_protection(self):
        path=self.site/IDENTITY_FILE;self.write(path,{'old':True});before=path.read_bytes();folder=self.folder()
        publish(self.project,folder,{path:encoded({'new':True})});rollback(self.project,folder)
        self.assertEqual(path.read_bytes(),before)
        other=folder.with_name('second');other.mkdir();publish(self.project,other,{path:encoded({'new':True})})
        path.write_bytes(encoded({'third_party':True}))
        with self.assertRaises(ValueError):rollback(self.project,other)
        self.assertEqual(json.loads(path.read_bytes()),{'third_party':True})

    def test_failed_second_replace_restores_first_and_removes_new_files(self):
        first=self.site/IDENTITY_FILE;second=self.site/CONTRIBUTOR_FILE
        self.write(first,{'old':True});before=first.read_bytes();folder=self.folder()
        import os
        original=os.replace;calls=[]
        def fail_second(source,target):
            if Path(target) in (first,second):
                calls.append(target)
                if len(calls)==2:raise OSError('fixture publication failure')
            return original(source,target)
        with patch('knowledge.library_analytics.apply.os.replace',side_effect=fail_second):
            with self.assertRaises(OSError):publish(self.project,folder,{first:encoded({'new':True}),second:encoded({'new':True})})
        self.assertEqual(first.read_bytes(),before);self.assertFalse(second.exists())

    def test_recovery_after_replace_before_journal_checkpoint(self):
        path=self.site/IDENTITY_FILE;folder=self.folder()
        publish(self.project,folder,{path:encoded({'new':True})})
        journal=json.loads((folder/'file-journal.json').read_text(encoding='utf-8'));journal[0]['state']='prepared'
        self.write(folder/'file-journal.json',journal);rollback(self.project,folder)
        self.assertFalse(path.exists())

    def test_unowned_paths_are_rejected(self):
        folder=self.folder()
        with self.assertRaises(ValueError):publish(self.project,folder,{self.project/'KnowledgeBase/knowledge.sqlite3':b'bad'})

    def test_locked_checkpoint_does_not_block_recovery(self):
        path=self.site/IDENTITY_FILE;self.write(path,{'old':True});before=path.read_bytes();folder=self.folder()
        with patch('knowledge.library_analytics.apply.checkpoint',side_effect=PermissionError('locked journal')):
            with self.assertRaises(PermissionError):publish(self.project,folder,{path:encoded({'new':True})})
        self.assertEqual(path.read_bytes(),before)
        self.assertTrue(list(folder.glob('rollback-*.json')))

    def test_windows_journal_replace_is_not_required(self):
        path=self.site/IDENTITY_FILE;self.write(path,{'old':True});before=path.read_bytes();folder=self.folder()
        import os
        original=os.replace
        def locked_journal(source,target):
            if Path(target).name=='file-journal.json':raise PermissionError('Windows reader holds journal')
            return original(source,target)
        with patch('knowledge.library_analytics.apply.os.replace',side_effect=locked_journal):
            publish(self.project,folder,{path:encoded({'new':True})});rollback(self.project,folder)
        self.assertEqual(path.read_bytes(),before)

    def test_concurrent_edit_after_preparation_is_not_overwritten(self):
        path=self.site/IDENTITY_FILE;self.write(path,{'old':True});expected={path:sha(path.read_bytes())}
        self.write(path,{'external':True});folder=self.folder()
        with self.assertRaises(ValueError):publish(self.project,folder,{path:encoded({'proposal':True})},expected)
        self.assertEqual(json.loads(path.read_bytes()),{'external':True})

    def test_reader_owner_accepts_work_only_and_absent_corpus_fills(self):
        import importlib.util
        spec=importlib.util.spec_from_file_location('teacher_identity_owner',Path(__file__).resolve().parents[2]/'scripts/teacher_identity_overrides.py')
        owner=importlib.util.module_from_spec(spec);spec.loader.exec_module(owner)
        self.canonical()
        self.write(self.site/'content/teachers/edition-identities.json',{'records':[{'sha256':'b'*64,
            'fields':{'workId':'w','editionId':'e','authors':['Recorded translator']},'credits':[]}]})
        self.write(self.site/IDENTITY_FILE,{'schemaVersion':1,'records':[
            {'sha256':self.hash,'fields':{'workId':'w'}}, {'sha256':'c'*64,'fields':{'workId':'w'}}]})
        overrides=owner.load_overrides(self.site)
        self.assertEqual(overrides['b'*64]['fields']['authors'],['Recorded translator'])
        before={'id':'reader-existing','sha256':self.hash,'workId':None,'editionId':None,'credit':'keep this','availability':'metadata-only'}
        folder=self.site/'public/content/teacher-library';self.write(folder/'records/aa.json',{'reader-existing':before})
        self.write(folder/'catalogue.json',{'contributors':[]})
        fills={sha:row for sha,row in overrides.items() if row.get('fillOnly')}
        self.assertEqual(len(owner.apply_package(folder,fills)),1)
        self.assertEqual(json.loads((folder/'records/aa.json').read_bytes())['reader-existing'],before|{'workId':'w'})
        self.assertEqual(owner.apply_package(folder,fills),[])

    def test_owned_intake_consumes_fills_and_keeps_unchanged_body_chunk_ids(self):
        from knowledge.library import import_library
        from knowledge.store import SCHEMA,Writer,connect
        self.canonical();work=self.site/'content/library/catalog/works/w.json'
        self.write(work,{'id':'w','kind':'work','title':'Historic source'})
        cfg={'site_dir':self.site,'sources_dir':self.project/'sources','state_dir':self.project/'KnowledgeBase','chunk_chars':1500}
        raw=cfg['sources_dir']/'library/source.txt';raw.parent.mkdir(parents=True);raw.write_text('Grace and faith in the historical source.',encoding='utf-8')
        checksum=sha(raw.read_bytes())
        self.write(self.site/'content/library/reports/source.json',{'files':[{'relativePath':'library/source.txt','sha256':checksum,
            'title':'Historic source','credit':'Original credit','publicHostingAllowed':False}]})
        self.write(self.site/'content/library/catalog/assets/a.json',{'id':'a','kind':'asset','relativePath':'library/source.txt',
            'sha256':checksum,'editionId':'unregistered-legacy-edition','rights':{'attribution':'Original credit'}})
        cfg['state_dir'].mkdir(exist_ok=True)
        db=connect(cfg['state_dir']/'before.sqlite3');db.executescript(SCHEMA)
        try:
            result=import_library(Writer(db,cfg));self.assertEqual(result['errors'],[])
            body_ids=[r[0] for r in db.execute("SELECT id FROM chunks WHERE kind='library_text'")]
        finally:db.close()
        self.write(self.site/IDENTITY_FILE,{'schemaVersion':1,'records':[{'sha256':checksum,'fields':{'workId':'w','editionId':'e'}}]})
        db=connect(cfg['state_dir']/'after.sqlite3');db.executescript(SCHEMA)
        try:
            result=import_library(Writer(db,cfg));self.assertEqual(result['errors'],[])
            self.assertEqual([r[0] for r in db.execute("SELECT id FROM chunks WHERE kind='library_text'")],body_ids)
            metadata=json.loads(db.execute("SELECT metadata FROM documents WHERE kind='library_text'").fetchone()[0])
            self.assertEqual((metadata['work']['id'],metadata['edition']['id']),('w','e'))
            self.assertEqual(metadata['asset']['editionId'],'unregistered-legacy-edition')
            self.assertEqual(metadata['acquisition']['credit'],'Original credit')
            self.assertFalse(metadata['acquisition']['publicHostingAllowed'])
            self.assertFalse(metadata['public_publication'])
        finally:db.close()


if __name__=='__main__':unittest.main()
