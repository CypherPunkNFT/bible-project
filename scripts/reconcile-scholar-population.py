"""Reconcile bibliographic metadata for the local Scholars page. No intake writes or jobs.

IDs, reviewed aliases and exact, unambiguous recorded labels establish joins. Similar
names are review candidates, never automatic identity merges. Text and private paths
are excluded. Source records, work identities and edition identities remain separate.
"""
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime, timezone
import copy, csv, hashlib, importlib.util, io, json, re, sqlite3, unicodedata, zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/content/scholar-population'

def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def encode(v): return json.dumps(v, ensure_ascii=False, separators=(',', ':'))
def key(v): return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', str(v)).casefold()).strip()
def digest(v): return hashlib.sha256(v.encode()).hexdigest()
def ro(p):
    db=sqlite3.connect(p.as_uri()+'?mode=ro', uri=True)
    db.execute('PRAGMA query_only=ON'); db.execute('BEGIN')
    return db
def write(p,v):
    p.parent.mkdir(parents=True,exist_ok=True)
    temp=p.with_suffix(p.suffix+'.tmp');temp.write_text(encode(v)+'\n',encoding='utf-8');temp.replace(p)
def load_module(name, filename):
    spec=importlib.util.spec_from_file_location(name, ROOT/'scripts'/filename)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    built=datetime.now(timezone.utc).isoformat()
    input_paths=[ROOT/p for p in ['content/teachers/scholars.json','src/data/teachers/scholars.json','content/teachers/field-shelves.json','content/teachers/contributor-facts.json','content/teachers/contributor-identities.json','content/teachers/field-attributions.json','public/content/teacher-library/catalogue.json']]
    inputs={str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in input_paths}
    cat=read(input_paths[-1]); index=read(ROOT/'content/teachers/field-shelves.json'); oldfacts=read(ROOT/'content/teachers/contributor-facts.json')
    profiles={p['id']:p for p in read(ROOT/'content/teachers/scholars.json')['scholars']}
    profile_data={p['id']:p for p in read(ROOT/'src/data/teachers/scholars.json')['scholars']}
    teacher_lives=read(ROOT/'content/teachers/lives.json')['people']
    teacher_data=read(ROOT/'src/data/teachers/people.json')['people']
    teacher_by_credit={}
    for t in teacher_data:
        life=teacher_lives.get(t['id'])
        if life:
            assert all(life.get(k)==t.get(k)for k in ['born','died']), 'Stale teacher life data: '+t['id']
            for cid in [t['id'],t.get('acquiredId')]:
                if cid:teacher_by_credit[cid]=t|life
    for rel in ['content/teachers/lives.json','src/data/teachers/people.json']:
        inputs[rel]=hashlib.sha256((ROOT/rel).read_bytes()).hexdigest()
    assert set(profiles)==set(profile_data), 'Generated and curated profile IDs disagree'
    for ident,p in profiles.items():
        assert all(p.get(k)==profile_data[ident].get(k) for k in ['name','born','died','field','faith']), f'Stale generated profile: {ident}'
    dates=load_module('scholar_dates','audit-scholar-foundation.py')
    subjects=load_module('scholar_subjects','build-scholar-fields.py')
    people={p['id']:copy.deepcopy(p) for p in index['entries']}
    credit_owner={}
    for p in people.values():
        for cid in p['contributorIds']:
            assert cid not in credit_owner, f'Duplicate source identity {cid}'
            credit_owner[cid]=p['id']
    public_people={c['id']:c for c in cat['contributors']}
    for c in cat['contributors']:
        if c['id'] not in credit_owner:
            people[c['id']]={'id':c['id'],'name':c['name'],'profileId':c.get('profileId'),'aliases':[c['name']],'contributorIds':[c['id']],'roles':c['roles'],'traditions':c['traditions'],'collections':[],'fields':{},'records':c['records'],'readable':c['readable'],'supplements':[]}
            credit_owner[c['id']]=c['id']
    baseline=len(people)
    registry={}; identity_records=read(ROOT/'content/teachers/contributor-identities.json')['records']
    registry_paths=[ROOT/'content/library/authors.json',*sorted((ROOT/'content/library/registry-extensions').glob('*.json'))]
    for p in registry_paths:
        j=read(p)
        inputs[str(p.relative_to(ROOT)).replace('\\','/')]=hashlib.sha256(p.read_bytes()).hexdigest()
        for a in j.get('authors',[]): registry[a['id']]=a|{'authority':str(p.relative_to(ROOT)).replace('\\','/')}
    for a in identity_records:
        previous=registry.get(a['id'])
        if previous: assert previous['name']==a['sourceRecord']['name'], 'Identity source drift'
        registry[a['id']]=a['sourceRecord']|{'authority':a['authority']}
    def ensure(cid, name=None, provenance='explicit contributor ID'):
        if cid in credit_owner:return credit_owner[cid]
        a=registry.get(cid,{})
        people[cid]={'id':cid,'name':a.get('name')or name or cid,'profileId':None,'aliases':a.get('aliases',[]),'contributorIds':[cid],'roles':[],'traditions':a.get('traditions',[]),'collections':[],'fields':{},'records':0,'readable':0,'supplements':[],'addedFrom':provenance}
        credit_owner[cid]=cid
        return cid
    for cid in registry:ensure(cid,provenance=registry[cid]['authority'])
    works={};editions={}; canonical_hashes={}
    for folder,target in [('works',works),('editions',editions)]:
        checks=[]
        for p in sorted((ROOT/'content/library/catalog'/folder).glob('*.json')):
            raw=p.read_bytes();v=json.loads(raw);assert v['id'] not in target
            target[v['id']]=v;checks.append(p.name+':'+hashlib.sha256(raw).hexdigest())
        canonical_hashes[folder]=digest('\n'.join(checks))
    for w in works.values():
        for c in w.get('creators',[]):
            if c.get('authorId'):ensure(c['authorId'],provenance='canonical work creator')
    for e in editions.values():
        for c in e.get('contributors',[]):
            if c.get('authorId'):ensure(c['authorId'],provenance='canonical edition contributor')
    after_registry=len(people)
    # Only explicit alias records count as personal aliases. Joint feature credits do not.
    overlay=read(ROOT/'content/teachers/field-attributions.json').get('aliases',{})
    for p in people.values():
        related=[registry[c] for c in p['contributorIds'] if c in registry]
        aliases={a for r in related for a in r.get('aliases',[])}
        for name,aa in overlay.items():
            if key(name)==key(p['name']):aliases.update(aa)
        p['verifiedAliases']=sorted(aliases-{p['name']})
        p['identity']={'status':'documented-profile' if p['profileId'] in profiles else 'registry-reviewed' if related else 'source-credit',
            'entityType':'person' if p['profileId'] in profiles else next((r.get('entityType') for r in related if r.get('entityType')),None),
            'authorities':related,'reviewRequired':bool(oldfacts['entries'].get(p['id'],{}).get('identityReview')),
            'joinBasis':'Existing field identity grouping and explicit source contributor IDs' if p['id'] in oldfacts['entries'] else 'Exact contributor ID; no inferred biography'}
        p['sourceLifeDates']=sorted({d for cid in p['contributorIds'] for d in public_people.get(cid,{}).get('sourceLifeDates',[])})
    # A label can join only one entry. Date-evidence labels are already tied to a source credit.
    label_owners=defaultdict(set)
    for p in people.values():
        for label in [p['name'],*p['aliases'],*p['verifiedAliases']]:label_owners[key(label)].add(p['id'])
        for e in oldfacts['entries'].get(p['id'],{}).get('dates',{}).get('evidence',[]):label_owners[key(e['label'])].add(p['id'])
    new_labels={};new_date_evidence=defaultdict(list)
    def label_person(label, role, record_id, field):
        label=str(label).strip()
        if not label or re.match(r'^(?:unknown|anonymous|unattributed)(?:\b|\s*[/(:])',label,re.I) or label.lower() in {'n/a','none','not stated'}:return None
        matches=label_owners.get(key(label),set())
        if len(matches)==1:return next(iter(matches))
        cid='intake-credit-'+digest(key(label))[:20]
        eid=ensure(cid,label,'Unmatched explicit intake '+field)
        new_labels[eid]=label
        if any(c.isdigit() for c in label) and len(new_date_evidence[eid])<30:
            new_date_evidence[eid].append({'label':label,'workId':record_id,'field':field,'parsed':dates.parse_date(label)})
        return eid
    records={};shelves={}
    for folder,target in [('records',records),('contributors',shelves)]:
        checks=[]
        for p in sorted((ROOT/'public/content/teacher-library'/folder).glob('*.json')):
            raw=p.read_bytes();j=json.loads(raw);assert not set(j)&set(target)
            target.update(j);checks.append(p.name+':'+hashlib.sha256(raw).hexdigest())
        inputs['public/content/teacher-library/'+folder]=digest('\n'.join(checks))
    public_count=len(records); all_records={};members=defaultdict(lambda:defaultdict(list));record_members=defaultdict(set)
    public_hash=defaultdict(list)
    for rid,r in records.items():
        assert rid==r['id']
        all_records[rid]={k:r.get(k) for k in ['id','title','workId','editionId','language','source','sourceId','sourceUrl','availability','reviewWarning','authors','editors','translators','licence','sha256']}
        all_records[rid].update(origin='packaged-record',publicReadable=r.get('availability')=='on-site-text' and r.get('pages',0)>0,localReadable=False,provenance=['public/content/teacher-library/records'])
        if r.get('sha256'):public_hash[r['sha256']].append(rid)
    def associate(eid,rid,role,basis):
        assert eid in people and rid in all_records
        value={'role':role,'basis':basis}
        if value not in members[eid][rid]:members[eid][rid].append(value)
        record_members[rid].add(eid)
    expected_shelves=defaultdict(set)
    for r in records.values():
        for cid in r.get('contributors',[]):expected_shelves[cid].add(r['id'])
    shelf_drift=[]
    for cid, rows in shelves.items():
        assert cid in credit_owner, f'Orphan contributor shard {cid}'
        actual={r['id'] for r in rows}
        expected=expected_shelves[cid]
        if actual!=expected:shelf_drift.append({'contributorId':cid,'shardOnly':sorted(actual-expected),'recordOnly':sorted(expected-actual)})
        for rid in actual|expected:
            assert rid in records, f'Shelf record missing: {rid}'
            basis='Contributor shard and record' if rid in actual&expected else 'Contributor shard only; membership needs review' if rid in actual else 'Record contributor ID only; shard membership needs review'
            associate(credit_owner[cid],rid,'recorded-contributor',basis+' '+cid+'; aggregate roles retained on contributor, not inferred per work')
    for p in people.values():
        for s in p['supplements']:
            assert s['id'] in all_records, 'Missing supplemental work'
            associate(p['id'],s['id'],'supplemental-credit',s['basis'])
    # Canonical work/edition credits are independent evidence, even without reading copies.
    work_members=defaultdict(lambda:defaultdict(list))
    for wid,w in works.items():
        for c in w.get('creators',[]):
            if c.get('authorId'):work_members[ensure(c['authorId'])][wid].append({'role':c.get('role','author'),'basis':'content/library/catalog/works/'+wid+'.json'})
    for eid,e in editions.items():
        for c in e.get('contributors',[]):
            if c.get('authorId') and e.get('workId') in works:work_members[ensure(c['authorId'])][e['workId']].append({'role':c.get('role','contributor'),'basis':'content/library/catalog/editions/'+eid+'.json','editionId':eid})
    local_path=ROOT/'.local/local-library/index.json';local=read(local_path) if local_path.exists() else None
    local_audit=read(ROOT/'.local/local-library/catalog-audit.json') if local else None
    local_docs=local['documents'] if local else {}
    local_hash={r['sha256']:r['id'] for r in local_docs.values()}
    local_bindings=defaultdict(list)
    if local:
        inputs['localReader']={'builtAt':local['builtAt'],'sha256':hashlib.sha256(local_path.read_bytes()).hexdigest(),'scope':local['scope']}
        for rid,ids in local['bindings'].items():
            for ident in ids:
                if ident in local_docs:local_bindings[rid].append(ident)
        for rid,r in local_docs.items():
            all_records[rid]={k:r.get(k) for k in ['id','title','workId','editionId','language','source','sourceId','sourceUrl','authors','licence','sha256']}
            all_records[rid].update(origin='local-reader',availability='local-copy',localReadable=True,publicReadable=False,provenance=['Read-only local reader index'],reviewWarning='Attribution conflict in reader metadata' if r.get('attributionConflict') else None,sharedCollection=bool(r.get('mixedAttribution')))
            for cid in r['authorIds']:associate(ensure(cid),rid,'recorded-local-author','Explicit reader author ID; shared collection/conflict flags retained')
        for rid,r in all_records.items():
            if r['origin']=='packaged-record' and r.get('sha256') in local_hash:
                r['localReadable']=True;r['localRecordId']=local_hash[r['sha256']]
    # Observe the live intake in one read transaction. Never import the job modules.
    intake=ro(ROOT.parent/'KnowledgeBase/knowledge.sqlite3')
    intake_counts=dict(intake.execute('SELECT status,COUNT(*) FROM library_files GROUP BY status'))
    intake_kinds=dict(intake.execute('SELECT kind,COUNT(*) FROM library_records GROUP BY kind'))
    unmatched_hashes=set();matched_hashes=set(); intake_unknown=set(); intake_observations=0
    def labels(a):
        for field,role in [('author','author'),('authors','author'),('authorNames','author'),('editor','editor'),('translator','translator'),('contributor','source-contributor')]:
            v=a.get(field,[])
            for item in v if isinstance(v,list) else [v]:
                if isinstance(item,str):
                    for label in re.split(r';\s*',item):yield field,role,label
        sm=a.get('sourceMetadata')or{}
        if isinstance(sm,dict):
            for field,role in [('authors','author'),('creator','source-creator'),('translator','translator')]:
                v=sm.get(field,[])
                for item in v if isinstance(v,list) else [v]:
                    if isinstance(item,dict) and isinstance(item.get('name'),str):yield 'sourceMetadata.'+field,role,item['name']
                    elif isinstance(item,str):yield 'sourceMetadata.'+field,role,item
    for sha,status,raw in intake.execute('SELECT sha256,status,metadata FROM library_files ORDER BY sha256,path'):
        if status not in {'indexed','deferred_scan','no_text','extraction_failed'}:continue
        m=json.loads(raw);a=m.get('acquisition')or{};w=m.get('work')or{};e=m.get('edition')or{}
        intake_observations+=1
        matches=public_hash.get(sha,[])
        if matches:matched_hashes.add(sha)
        else:unmatched_hashes.add(sha)
        rid=matches[0] if matches else 'intake-'+sha
        if rid not in all_records:
            all_records[rid]={'id':rid,'title':w.get('title')or a.get('title')or 'Untitled intake record','workId':w.get('id')or a.get('workId'),'editionId':e.get('id')or a.get('editionId'),'language':(e.get('languages')or[a.get('language')or'und'])[0],'source':a.get('source')or a.get('sourceId')or 'Intake metadata','sourceUrl':a.get('url')or a.get('canonicalUrl')or a.get('finalUrl'),'availability':'intake-metadata','origin':'intake-metadata','publicReadable':False,'localReadable':sha in local_hash,'sha256':sha,'provenance':['Read-only intake library_files snapshot'],'reviewWarning':None}
            if sha in local_hash:all_records[rid]['localRecordId']=local_hash[sha]
        row=all_records[rid];row['intakeStatus']=status
        row['intakeObservations']=row.get('intakeObservations',0)+1
        if 'Read-only intake library_files snapshot' not in row['provenance']:row['provenance'].append('Read-only intake library_files snapshot')
        # Preserve explicit, conflicting identities. Do not override original public IDs.
        wid=w.get('id')or a.get('workId');edid=e.get('id')or a.get('editionId')
        if wid and wid!=row.get('workId'):row.setdefault('intakeWorkIds',[]);row['intakeWorkIds']=sorted(set(row['intakeWorkIds']+[wid]))
        if edid and edid!=row.get('editionId'):row.setdefault('intakeEditionIds',[]);row['intakeEditionIds']=sorted(set(row['intakeEditionIds']+[edid]))
        explicit=[]
        for c in w.get('creators',[]):
            if c.get('authorId'):explicit.append((ensure(c['authorId']),c.get('role','author'),'Intake embedded work creator ID'))
        if isinstance(a.get('authorId'),str) and a['authorId'].startswith('author-'):explicit.append((ensure(a['authorId']),'author','Intake acquisition authorId'))
        for eid,role,basis in explicit:associate(eid,rid,role,basis)
        # Existing packaged attribution is authoritative for the same recorded hash.
        # Raw labels enrich uncredited records/new hashes; they do not duplicate known credits.
        if not matches or not record_members[rid]:
            for field,role,label in labels(a):
                eid=label_person(label,role,rid,field)
                if eid:associate(eid,rid,role,'Intake '+field+': '+label)
        if not record_members[rid]:intake_unknown.add(rid)
    intake.close()
    after_intake=len(people)
    print('Reconciled packaged, canonical and read-only intake metadata.',flush=True)
    # The source-use sections contain exact credits beyond the held library. Keep
    # these as source-credit entries, with their cited works and no invented lives.
    usage=read(ROOT/'content/teachers/feature-usage.json')
    source_aliases=read(ROOT/'content/teachers/source-profile-aliases.json')['aliases']
    inputs['content/teachers/feature-usage.json']=hashlib.sha256((ROOT/'content/teachers/feature-usage.json').read_bytes()).hexdigest()
    source_credits={}
    for feature in usage['features']:
        for source in feature['sources']:
            name=source['author'];rid='site-source-'+source['id']
            if name not in source_credits:
                exact=set(label_owners.get(key(name),set()))
                reviewed={p['id']for p in people.values()if p.get('profileId') and any(key(name)==key(a)for a in source_aliases.get(p['profileId'],[]))}
                candidates=reviewed or (exact if len(exact)==1 else set())
                if not candidates:candidates={ensure('site-credit-'+digest(key(name))[:20],name,'content/teachers/feature-usage.json exact source credit')}
                source_credits[name]=sorted(candidates)
            all_records.setdefault(rid,{'id':rid,'title':source['title'],'workId':None,'editionId':None,'language':'und','source':'Site feature source index','sourceUrl':source['url'],'availability':'source-link','origin':'site-source','publicReadable':False,'localReadable':False,'authors':[name],'publicationLabel':source['year'],'provenance':['content/teachers/feature-usage.json'],'reviewWarning':None,'features':[]})
            all_records[rid]['features'].append({'id':feature['id'],'kind':source['kind'],'uses':source['uses']})
            for eid in source_credits[name]:associate(eid,rid,'site-source-credit','Exact source credit: '+name+'; '+feature['id']+'; '+source['kind'])
    # Canonical credits join every record carrying that exact work/edition ID.
    creators_for=defaultdict(list)
    for eid,ww in work_members.items():
        for wid,credits in ww.items():creators_for[wid].append((eid,credits))
    for rid,r in all_records.items():
        for eid,credits in creators_for.get(r.get('workId'),[]):
            for c in credits:
                if c.get('editionId') and c['editionId']!=r.get('editionId'):continue
                associate(eid,rid,c['role'],c['basis'])
    # Every person now receives explicit unknown facts; the old file is never a total.
    for p in people.values():
        p.setdefault('verifiedAliases',[]);p.setdefault('sourceLifeDates',[])
        p.setdefault('identity',{'status':'unresolved','entityType':None,'authorities':[],'reviewRequired':True,'joinBasis':p.get('addedFrom','Unresolved source credit')})
        f=copy.deepcopy(oldfacts['entries'].get(p['id']))
        if not f:
            f={'kind':'unresolved','dates':{'status':'missing','era':None,'evidence':new_date_evidence[p['id']]},'expertise':[],'expertiseBasis':'not-established','subjects':{},'faith':None,'sourceContributorIds':p['contributorIds'],'recordedTraditions':p['traditions'],'collections':p['collections']}
            variants={encode(e['parsed']):e['parsed'] for e in new_date_evidence[p['id']] if e.get('parsed')}
            if len(variants)==1:f['dates'].update(next(iter(variants.values())),status='source-supported');f['kind']='person-candidate'
            elif len(variants)>1:f['dates']['status']='conflicting'
            elif new_date_evidence[p['id']]:f['dates']['status']='needs-review'
        profile=profiles.get(p['profileId'])
        teachers={teacher_by_credit[cid]['id']:teacher_by_credit[cid]for cid in p['contributorIds']if cid in teacher_by_credit}
        assert len(teachers)<=1, 'Multiple teacher profiles in one identity group: '+p['id']
        teacher=next(iter(teachers.values()),None)
        p['profileAvailability']={'scholarId':profile['id']if profile else None,'teacherId':teacher['id']if teacher else None}
        if teacher and not profile:
            prior=copy.deepcopy(f['dates'])
            source_conflict=prior['status']=='conflicting' or any(isinstance(e.get('parsed'),dict)and any(e['parsed'].get(k)not in (None,teacher.get(k))for k in ['born','died'])for e in prior.get('evidence',[]))
            f['dates'].update(status='documented-profile',era=dates.era(teacher['born']),born=teacher['born'],died=teacher['died'],approximate=bool(teacher.get('circa')),basis='content/teachers/lives.json',sourceConflict=source_conflict,previousSourceStatus=prior['status'])
            f['kind']='person'
            if source_conflict:p['identity']['reviewRequired']=True
        if profile:
            f['dates'].update(status='documented-profile',era=dates.era(profile['born']),born=profile['born'],died=profile['died'],approximate=bool(profile.get('circa')),basis='content/teachers/scholars.json')
            f.update(kind='person',expertise=[profile['field']],expertiseBasis='documented-profile',faith=profile['faith'])
        elif p['identity'].get('entityType')=='person':f['kind']='person'
        elif p['identity'].get('entityType') in {'institution','organization'}:f['kind']='organization-candidate'
        p['facts']=f
        p['roles']=set(p['roles']);p['collections']=set(p['collections'])
        for rid,credits in members[p['id']].items():
            r=all_records[rid]
            p['roles'].update(c['role'] for c in credits if c['role']!='recorded-contributor')
            # Existing field decisions stay; title-based additions retain their basis.
            for field,basis in subjects.classify({'title':r['title'],'source':r['source']or'','sourceUrl':r.get('sourceUrl')}).items():
                if field not in p['fields']:p['fields'][field]={'count':0,'basis':basis,'example':{'id':rid,'title':r['title'],'source':r['source'],'availability':r['availability']}}
            p['collections'].update(subjects.collections_for({'source':r['source']or'','sourceUrl':r.get('sourceUrl')}))
        for credits in work_members[p['id']].values():p['roles'].update(c['role'] for c in credits)
        p['roles']=sorted(p['roles']);p['collections']=sorted(p['collections'])
        f['subjects']={k:{'basis':v['basis'],'workId':(v.get('example')or{}).get('id')}for k,v in p['fields'].items()}
    # Similar recorded names remain distinct, but expose the review queue.
    names=defaultdict(set)
    for p in people.values():
        for n in [p['name'],*p['verifiedAliases']]:names[key(n)].add(p['id'])
    for p in people.values():
        candidates=sorted(set().union(*(names[key(n)] for n in [p['name'],*p['verifiedAliases']])) - {p['id']})
        p['identity']['candidateIds']=candidates
        if candidates:p['identity']['reviewRequired']=True
    edition_by_work=defaultdict(list)
    for e in editions.values():edition_by_work[e.get('workId')].append(e['id'])
    orphan_work_ids=sorted({r['workId'] for r in all_records.values() if r.get('workId') and r['workId'] not in works})
    orphan_edition_ids=sorted({r['editionId'] for r in all_records.values() if r.get('editionId') and r['editionId'] not in editions})
    # Metadata shards contain the complete associations; UI renders bounded batches.
    shards=defaultdict(dict);csv_people=[];csv_associations=[];all_group_count=0
    field_entry_ids={e['id']for e in index['entries']}
    for p in sorted(people.values(),key=lambda p:(key(p['name']),p['id'])):
        groups={}
        def group(wid=None,rid=None):
            ident=wid or rid
            if ident not in groups:
                w=works.get(wid,{})
                groups[ident]={'id':ident,'workId':wid,'title':w.get('title')or all_records.get(rid,{}).get('title')or ident,'canonical':wid in works if wid else False,'editionIds':edition_by_work.get(wid,[])[:],'credits':[],'records':[],'provenance':['content/library/catalog/works/'+wid+'.json'] if wid in works else []}
            return groups[ident]
        for wid,credits in work_members[p['id']].items():group(wid)['credits'].extend(credits)
        for rid,credits in members[p['id']].items():
            r=all_records[rid];g=group(r.get('workId'),rid)
            g['records'].append(r|{'credits':credits})
            if r.get('editionId') and r['editionId'] not in g['editionIds']:g['editionIds'].append(r['editionId'])
            csv_associations.append({'contributorId':p['id'],'recordId':rid,'workId':r.get('workId'),'editionId':r.get('editionId'),'credits':credits})
        rows=sorted(groups.values(),key=lambda g:(key(g['title']),g['id']))
        for g in rows:
            g['editions']=[{k:editions[eid].get(k) for k in ['id','workId','label','languages','dates','contributors','evidence']}for eid in g['editionIds'] if eid in editions]
        shards[digest(p['id'])[:2]][p['id']]=rows
        rr=[all_records[rid] for rid in members[p['id']]]
        p['counts']={'works':sum(g['canonical'] for g in rows),'workGroups':len(rows),'editions':len({e for g in rows for e in g['editionIds']}),'publicRecords':sum(r['origin']=='packaged-record'for r in rr),'localCopies':sum(r['origin']=='local-reader'for r in rr),'intakeRecords':sum(r['origin']=='intake-metadata'for r in rr),'siteSources':sum(r['origin']=='site-source'for r in rr),'publicReadable':sum(r['publicReadable']for r in rr),'localReadable':sum(r['origin']=='local-reader'for r in rr)}
        p['records']=len(rr);p['readable']=p['counts']['publicReadable']
        p['searchText']=' '.join(sorted({g['title']for g in rows})).lower()
        p['provenance']=sorted(set(['content/teachers/field-shelves.json']if p['id'] in field_entry_ids else[] )|{r['authority']for r in p['identity']['authorities']}|set('public/content/teacher-library/catalogue.json'for c in p['contributorIds']if c in public_people)|set(['Read-only intake metadata']if p['id']in new_labels else [])|set([p['addedFrom']]if p.get('addedFrom')else[])|set(['content/teachers/lives.json']if p['profileAvailability']['teacherId']else[]))
        csv_people.append({k:p[k] for k in ['id','name','contributorIds','aliases','verifiedAliases','roles','identity','facts','profileId','profileAvailability','counts','provenance']})
        all_group_count+=len(rows)
    unattributed=[r|{'contributorIds':sorted(record_members[rid])}for rid,r in all_records.items()if not record_members[rid]]
    no_author=[rid for rid,r in records.items()if not r.get('authors')]
    normalized_facts={p['id']:p['facts']for p in people.values()}
    summary={'contributors':len(people),'baselineMergedEntries':baseline,'sourceContributors':len(cat['contributors']),'sourceAuthorEntries':sum('author'in c['roles']for c in cat['contributors']),'registryAdditions':after_registry-baseline,'intakeCreditAdditions':after_intake-after_registry,'featureCreditAdditions':len(people)-after_intake,'featureCreditLabels':len(source_credits),'siteSourceRecords':sum(r['origin']=='site-source'for r in all_records.values()),'documentedProfiles':len(profiles),'publicRecords':public_count,'canonicalWorks':len(works),'canonicalEditions':len(editions),'localReadingCopies':len(local_docs),'intakeMetadataRecords':sum(r['origin']=='intake-metadata'for r in all_records.values()),'recordRepresentations':len(all_records),'recordContributorAssociations':len(csv_associations),'workContributorAssociations':sum(len(v)for v in work_members.values()),'unattributedRecords':len(unattributed),'publicWithoutAuthorLabels':len(no_author),'publicUnattributedRecords':sum(not record_members[rid]for rid in records),'datedBirths':sum(f['dates']['status']in{'documented-profile','source-supported'}and isinstance(f['dates'].get('born'),int)for f in normalized_facts.values()),'approximateBirths':sum(f['dates']['status']in{'documented-profile','source-supported'}and isinstance(f['dates'].get('born'),int)and bool(f['dates'].get('approximate'))for f in normalized_facts.values()),'floruitOnly':sum('floruit'in f['dates']and 'born'not in f['dates']for f in normalized_facts.values()),'deathOnly':sum('died'in f['dates']and 'born'not in f['dates']and 'floruit'not in f['dates']for f in normalized_facts.values()),'dateStatus':dict(Counter(f['dates']['status']for f in normalized_facts.values())),'eras':dict(Counter(f['dates'].get('era')or'unknown'for f in normalized_facts.values())),'identityReviewEntries':sum(p['identity']['reviewRequired']for p in people.values()),'kinds':dict(Counter(f['kind']for f in normalized_facts.values())),'unclassified':sum(not p['fields']for p in people.values())}
    reconciliation={'builtAt':built,'summary':summary,'inputs':inputs,'canonicalDigests':canonical_hashes,'packagedUpdatedAt':cat['updatedAt'],'oldFactsSummary':oldfacts['summary'],'missingOldFacts':[p['id']for p in people.values()if p['id']not in oldfacts['entries']],'orphanOldFacts':sorted(set(oldfacts['entries'])-set(people)),'shelfMembershipDrift':shelf_drift,'intake':{'fileStatuses':intake_counts,'recordKinds':intake_kinds,'bodyFileObservations':intake_observations,'publicMatchedBodyHashes':len(matched_hashes),'bodyHashesAbsentFromPublic':len(unmatched_hashes),'unattributedBodyRecords':len(intake_unknown)},'localReaderAudit':{k:local_audit[k]for k in ['builtAt','scope','totals','issues']}if local_audit else None,'unresolvedWorkIds':orphan_work_ids,'unresolvedEditionIds':orphan_edition_ids,'counting':'Contributors are source identities, organizations and unresolved credits, not a verified count of unique people. Works count canonical work IDs only. Groups without work IDs are separate record representations, never deduplicated by title. Public, local reader and intake records can represent the same file; counts do not sum to distinct books. Unattributed records are separate from people. Local reading is restricted to the existing loopback reader.'}
    summary['documentedTeacherProfiles']=sum(bool(p['profileAvailability']['teacherId'])for p in people.values())
    summary['documentedSourceConflicts']=sum(bool(p['facts']['dates'].get('sourceConflict'))for p in people.values())
    summary['publicReadingRecords']=sum(r['publicReadable']for r in all_records.values())
    summary['publicHeldRecords']=sum(r.get('availability')!='not-published'for r in records.values())
    summary['catalogueOnlyPublicRecords']=sum(r.get('availability')=='not-published'for r in records.values())
    reconciliation['sourceCreditMemberships']={'catalogueDeclared':sum(c['records']for c in cat['contributors']),'contributorShards':sum(len(rows)for rows in shelves.values()),'recordContributorIds':sum(len(set(r.get('contributors',[])))for r in records.values()),'missingFromShards':sum(len(d['recordOnly'])for d in shelf_drift),'shardOnly':sum(len(d['shardOnly'])for d in shelf_drift)}
    reconciliation['baselineMerge']={'fieldEntries':len(index['entries']),'fieldContributorIds':len({c for e in index['entries']for c in e['contributorIds']}),'fallbackEntries':baseline-len(index['entries']),'entriesWithoutSourceIds':sum(not p['contributorIds']for p in index['entries']),'groupsWithMultipleSourceIds':sum(len(p['contributorIds'])>1 for p in index['entries'])}
    fact_summary={'catalogueEntries':len(people),'sourceContributors':len(cat['contributors']),'documentedProfiles':len(profiles),'dateStatus':summary['dateStatus'],'eras':summary['eras'],'kinds':summary['kinds'],'subjectCounts':{k:sum(k in p['fields']for p in people.values())for k in subjects.PATTERNS},'expertiseCounts':{k:sum(k in p['facts']['expertise']for p in people.values())for k in subjects.PATTERNS},'identityReviewEntries':summary['identityReviewEntries']}
    manifest={'schemaVersion':1,'builtAt':built,'summary':summary,'reconciliation':reconciliation,'factSummary':fact_summary,'sourceCredits':source_credits,'entries':sorted(people.values(),key=lambda p:(key(p['name']),p['id']))}
    for shard,rows in shards.items():write(OUT/'contributors'/f'{shard}.json',rows)
    # Unattributed holdings are separately paged, including records without any usable credit.
    unattributed.sort(key=lambda r:(key(r['title']),r['id']))
    for offset in range(0,len(unattributed),100):write(OUT/'unattributed'/f'{offset//100}.json',unattributed[offset:offset+100])
    write(OUT/'reconciliation.json',reconciliation)
    write(OUT/'index.json',manifest)
    def csv_text(rows):
        if not rows:return ''
        fields=list(dict.fromkeys(k for r in rows for k in r))
        out=io.StringIO(newline='');writer=csv.DictWriter(out,fieldnames=fields);writer.writeheader()
        for r in rows:
            # Protect spreadsheet imports from formula interpretation, retaining JSON in nested cells.
            writer.writerow({k:encode(v)if isinstance(v,(dict,list))else "'"+v if isinstance(v,str)and v[:1]in'=+@-'else v for k,v in r.items()})
        return '\ufeff'+out.getvalue()
    with zipfile.ZipFile(OUT/'scholars-library-export.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
        for name,rows in [('contributors',csv_people),('record-credits',csv_associations),('records',list(all_records.values())),('works',list(works.values())),('editions',list(editions.values())),('unattributed-records',unattributed)]:z.writestr(name+'.csv',csv_text(rows))
        z.writestr('work-credits.csv',csv_text([{'contributorId':eid,'workId':wid,'credits':cc}for eid,ww in work_members.items()for wid,cc in ww.items()]))
        z.writestr('reconciliation.json',encode(reconciliation))
        z.writestr('README.txt','Local bibliographic snapshot '+built+'\n'+reconciliation['counting']+'\nIDs are the join keys. JSON-valued CSV cells preserve dates, evidence, credits, aliases and review scope. A leading apostrophe protects formula-like plain strings in spreadsheet imports. Private paths, source bodies and extraction caches are excluded. Source hashes identify metadata snapshots, not successful embedding or intake verification.\n')
    assert set(credit_owner)>=set(public_people)
    assert len({p['profileId']for p in people.values()if p['profileId']in profiles})==len(profiles)
    assert sum(summary['dateStatus'].values())==len(people)
    assert sum(summary['eras'].values())==len(people)
    print(json.dumps(summary,indent=2),flush=True)

if __name__=='__main__':main()
