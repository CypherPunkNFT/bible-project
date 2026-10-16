"""Structural coverage checks against the reconciled snapshot; never starts jobs."""
from pathlib import Path
from collections import Counter
import csv,hashlib,io,json,zipfile

R=Path(__file__).resolve().parents[1];O=R/'public/content/scholar-population'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
p=read(O/'index.json');s=p['summary'];people={x['id']:x for x in p['entries']}
cat=read(R/'public/content/teacher-library/catalogue.json')
source=[cid for x in people.values()for cid in x['contributorIds']]
assert len(people)==len(p['entries'])==s['contributors']
assert len(source)==len(set(source)), 'An ID belongs to multiple people'
assert set(c['id']for c in cat['contributors'])<=set(source)
profiles={x['id']for x in read(R/'content/teachers/scholars.json')['scholars']}
assert {x['profileAvailability']['scholarId']for x in people.values()if x['profileAvailability']['scholarId']}==profiles
assert sum(s['dateStatus'].values())==sum(s['eras'].values())==len(people)
births=[x for x in people.values()if x['facts']['dates']['status']in{'documented-profile','source-supported'}and x['facts']['dates'].get('born')is not None]
assert len(births)==s['datedBirths']>len(profiles)
assert all(x['facts']['dates']['status']!='conflicting'for x in births)
assert s['datedBirths']+s['floruitOnly']+s['deathOnly']+s['dateStatus'].get('conflicting',0)+s['dateStatus'].get('needs-review',0)+s['dateStatus'].get('missing',0)==len(people)
records={};local=read(R/'.local/local-library/index.json')['documents']
for f in (R/'public/content/teacher-library/records').glob('*.json'):records.update(read(f))
association_count=0;work_ids=set();seen=set();record_ids=set();linked_public=set();linked_canonical=set();local_ids=set()
for shard in (O/'contributors').glob('*.json'):
 for ident,groups in read(shard).items():
  assert ident in people
  assert hashlib.sha256(ident.encode()).hexdigest()[:2]==shard.stem
  seen.add(ident);rr={};ww=set();ee=set()
  for g in groups:
   if g['canonical']:ww.add(g['workId']);work_ids.add(g['workId'])
   ee.update(g['editionIds'])
   for r in g['records']:
    assert r['id']not in rr, 'Record duplicated on contributor shelf'
    rr[r['id']]=r;record_ids.add(r['id'])
    if r['origin']=='packaged-record':
     assert r['id']in records;linked_public.add(r['id'])
     assert r['publicReadable']==(records[r['id']]['availability']=='on-site-text'and records[r['id']]['pages']>0)
    if r['origin']=='local-reader':assert r['id']in local;local_ids.add(r['id'])
    if r.get('localRecordId'):assert r['localRecordId']in local
    if r['publicReadable']:assert r['origin']=='packaged-record'
    assert 'path'not in r and 'cache'not in r and 'textPath'not in r
  c=people[ident]['counts']
  assert len(rr)==people[ident]['records']
  assert len(ww)==c['works'] and len(ee)==c['editions']
  assert sum(c[k]for k in ['publicRecords','localCopies','intakeRecords','siteSources'])==len(rr)
  association_count+=len(rr)
assert seen==set(people)
assert association_count==s['recordContributorAssociations']
assert len(work_ids)==s['canonicalWorks']
assert len(local_ids)==s['localReadingCopies']
assert len(linked_public)+s['publicUnattributedRecords']==len(records)
unattributed={}
for f in (O/'unattributed').glob('*.json'):
 for r in read(f):
  assert r['id']not in unattributed and r['id']not in record_ids
  assert not r['contributorIds'];unattributed[r['id']]=r
assert len(unattributed)==s['unattributedRecords']
assert len(record_ids|set(unattributed))==s['recordRepresentations']
for name,ids in p['sourceCredits'].items():assert ids and all(i in people for i in ids)
assert len(p['sourceCredits'])==s['featureCreditLabels']
with zipfile.ZipFile(O/'scholars-library-export.zip')as z:
 assert z.testzip()is None
 for file,count in [('contributors.csv',s['contributors']),('records.csv',s['recordRepresentations']),('record-credits.csv',s['recordContributorAssociations']),('works.csv',s['canonicalWorks']),('editions.csv',s['canonicalEditions']),('unattributed-records.csv',s['unattributedRecords'])]:
  assert sum(1 for _ in csv.DictReader(io.StringIO(z.read(file).decode('utf-8-sig'))))==count,file
print(json.dumps({'coverage':'passed','contributors':len(people),'births':len(births),'canonicalWorkCoverage':len(work_ids),'recordAssociations':association_count,'unattributedRecords':len(unattributed),'export':'all relational tables checked','readingLinks':'all public/local destinations structurally checked'},indent=2))
