"""Tighten creator matching; retain out-of-scope acquisitions outside the library."""
import json,shutil
import bulk_collect as b
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB04'
p=R/'filters/ia.json';f=b.read(p)
processed=set()
for name in ['ia-acquisition.log','ia-remaining.log']:
 for line in (R/name).read_text('utf-8').splitlines():
  if line.startswith('ia ') and not line.startswith('ia catalogue'):processed.add(line.split()[1])
items=b.catalogue('ia',b.Client(),f);h=b.Holdings()
pending=[x for x in items if b.matches(x,f) and not h.held(x) and x['sourceId'] not in processed]
d=b.read(R/'ia-acquisition.json')
for x in pending[:4]:
 processed.add(x['sourceId'])
 d['failures'].append({k:x[k] for k in ['sourceId','url','title','author']}|{'error':'Deferred interrupted worker-pool request during canonical-author correction; no retry'})
b.save(R/'ia-acquisition.json',d)
f['authorMustStart']=True
for rule in f['authorIdentityRules']:
 if 'Watson' in rule['namePattern']:rule['requireReligiousSubjectsWhenUndated']=True
f['skipIds']=list(set(f['skipIds'])|processed);b.save(p,f)
screen=f|{'skipIds':[]};manifest=b.read(R/'acquisition-manifest.json');excluded=[]
for record in manifest['files']:
 if record.get('campaignMission')!='RB04' or record.get('source')!='ia' or not record.get('countAsBook',True):continue
 if b.matches(record,screen):continue
 original=b.Path(record['path']).resolve()
 if not original.is_relative_to((b.RAW/'ia').resolve()):raise ValueError('Unexpected original path')
 destination=(b.ROOT/'ARCHIVE/RB04-excluded-author'/original.name).resolve()
 if not destination.is_relative_to((b.ROOT/'ARCHIVE/RB04-excluded-author').resolve()):raise ValueError('Unsafe archive path')
 destination.parent.mkdir(parents=True,exist_ok=True);shutil.move(original,destination)
 record.update(path=str(destination),countAsBook=False,disposition='excluded-author',
   reason='Creator does not match the canonical historical mission author; retained outside library intake')
 excluded.append(record['sourceId'])
b.save(R/'acquisition-manifest.json',manifest)
selected=[x for x in items if b.matches(x,screen)]
d=b.read(R/'ia-acquisition.json');d.update(eligibleItems=len(selected),excludedAuthorOriginals=len(excluded));b.save(R/'ia-acquisition.json',d)
c=b.read(R/'mission.json');c['availabilityNotes'].append(f'{len(excluded)} originals from unrelated author-name matches were retained outside library intake and excluded from book counts.');b.save(R/'mission.json',c)
print(json.dumps({'eligibleCanonicalItems':len(selected),'remaining':sum(b.matches(x,f) and not h.held(x) for x in items),'excludedAuthorOriginals':excluded,'noRetries':True}))
