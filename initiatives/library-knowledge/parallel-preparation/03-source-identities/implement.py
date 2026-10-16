"""Apply the owner's approved P3 metadata corrections, preserving original bytes."""
from pathlib import Path
import copy
import hashlib
import json

ROOT=Path(__file__).resolve().parents[5]; SITE=ROOT/'Website'
PRIVATE=ROOT/'KnowledgeBase/library-knowledge/parallel-preparation/03-source-identities'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
crosswalk=read(PRIVATE/'identity-crosswalk.json')
changes=[]
def write(p,value):
    content=json.dumps(value,ensure_ascii=False,indent=2)+'\n'
    if p.exists() and p.read_text(encoding='utf-8-sig')==content:return
    if p.exists():
        backup=PRIVATE/'implementation-before'/p.relative_to(SITE)
        backup.parent.mkdir(parents=True,exist_ok=True)
        if not backup.exists():backup.write_bytes(p.read_bytes())
    p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content,encoding='utf-8',newline='\n');changes.append(str(p.relative_to(SITE)))
review={'date':'2026-10-12','reviewer':'Codex','kind':'ai-assisted','scope':'Owner-approved source-bound identity and edition metadata; no whole-text theological approval or new public clearance.'}
sources=read(SITE/'content/library/sources.json')
for new,old in [('source-tcp-bulk','source-eebo-tcp'),('source-ccel-expansion','source-ccel')]:
    if not any(s['id']==new for s in sources['sources']):
        s=copy.deepcopy(next(s for s in sources['sources'] if s['id']==old));s['id']=new
        s['acquisitionNote']+=' Existing campaign storage namespace; same upstream source. Registered without moving originals.'
        sources['sources'].append(s)
write(SITE/'content/library/sources.json',sources)
authors=[];overrides=[]
for node in crosswalk['sources']:
    role=node['role'];sha=node['sha256'];original=Path(node['path'])
    assert hashlib.sha256(original.read_bytes()).hexdigest()==sha
    source_url=node['existingUseAssertions']['registry'].get('url') or next((p['record']['finalUrl'] for p in node['identity']['proofs'] if p['kind']=='asset'),None)
    if not source_url:
        provenance=read(original.parent/'provenance.json');source_url=provenance['url']
    evidence={'url':source_url,'locator':'Held XML title/creator and publication headers; original SHA256 '+sha,'note':'Source-bound identity/date/role assertions verified by P3. Unknown composition and delivery dates remain unknown.','checkedOn':'2026-10-12'}
    if role in ['fergusson','calvin-sermons']:
        name='James Fergusson' if role=='fergusson' else 'Arthur Golding';aid='author-james-fergusson' if role=='fergusson' else 'author-arthur-golding'
        authors.append({'id':aid,'entityType':'person','name':name,'aliases':[],'cohort':'ephesians-source-identities','traditions':[],'eligibility':'provisional' if role=='fergusson' else 'context-only','rationale':'Named author in held TCP A41197.' if role=='fergusson' else 'Explicitly credited translator of TCP A17705, not its author.','receptionBasis':'Source-header identity only; no new biographical or doctrinal endorsement.','evidence':[evidence],'distinctives':[],'unresolved':['Independent biographical and whole-corpus theological review are outside this source-bound registration.'],'review':review})
    wid=node['identity']['workId'] or 'work-tcp-a41197'
    eid=node['identity']['editionId'] or 'edition-tcp-a41197-1659'
    assetid=node['registryClaims']['assetId']
    if role=='fergusson':
        work={'$schema':'../../schema.json','schemaVersion':1,'kind':'work','id':wid,'editorialState':'draft','notes':['Galatians and Ephesians container retained; no component work IDs allocated. Legacy acquisition work-tcp-A41197 retained in external identifiers.'],'reviews':[review],'title':'A brief exposition of the Epistles of Paul to the Galatians and Ephesians','alternateTitles':[],'creators':[{'authorId':'author-james-fergusson','role':'author'}],'genre':'commentary','role':'core-teaching','collections':[],'subjects':[],'occasions':[],'audiences':[],'depth':'unknown','era':'unknown','dates':[],'passages':[],'related':[],'externalIds':{'source-eebo-tcp':['A41197','work-tcp-A41197']},'evidence':[evidence]}
        write(SITE/f'content/library/catalog/works/{wid}.json',work)
        edition={'$schema':'../../schema.json','schemaVersion':1,'kind':'edition','id':eid,'editorialState':'draft','notes':[],'reviews':[],'workId':wid,'label':'TCP transcription of the 1659 Galatians and Ephesians exposition','languages':['en'],'contributors':[],'publisher':None,'dates':[],'abridgment':'unknown','modernization':'unknown','evidence':[]}
    else:edition=read(SITE/f'content/library/catalog/editions/{eid}.json')
    edition['languages']=['en']
    if evidence not in edition['evidence']:edition['evidence'].append(evidence)
    if review not in edition['reviews']:edition['reviews'].append(review)
    details={'printDate':node['dateRoles']['printEdition']['value'],'electronicDate':node['dateRoles']['electronicEdition']['value'],'printPublisher':node['publishers']['print'],'electronicPublisher':node['publishers']['electronic']}
    for key,label in [('printDate','Print source edition; exact header assertion'),('electronicDate','Electronic edition creation; exact header assertion')]:
        value=details[key]
        if value:
            event={'event':'edition-publication','value':value,'precision':'circa' if '[' in value else 'year' if len(value)==4 else 'month' if len(value)==7 else 'day','label':label,'evidence':[evidence]}
            if not any(d.get('value')==value and d.get('label')==label for d in edition['dates']):edition['dates'].append(event)
    edition['publisher']=details['electronicPublisher']
    for note in ['Print publisher: '+(details['printPublisher'] or 'unrecorded')+'.','Composition/delivery dates are not established by the electronic creation date.']:
        if note not in edition['notes']:edition['notes'].append(note)
    if role=='calvin-sermons':
        credit={'authorId':'author-arthur-golding','role':'translator'}
        if credit not in edition['contributors']:edition['contributors'].append(credit)
    if role=='calvin-commentary':
        note='Translator explicitly credited in the held DC.Creator header: Pringle, Rev. William. Display credit William Pringle; canonical contributor linkage remains unresolved.'
        if note not in edition['notes']:edition['notes'].append(note)
    write(SITE/f'content/library/catalog/editions/{eid}.json',edition)
    if role=='calvin-sermons':
        wp=SITE/f'content/library/catalog/works/{wid}.json';work=read(wp)
        legacy='Legacy acquisition work-tcp-A17705 references this selected source; keep it as an external assertion, not a second canonical work.'
        if legacy not in work['notes']:work['notes'].append(legacy)
        vals=work['externalIds'].setdefault('source-eebo-tcp',[])
        if 'work-tcp-A17705' not in vals:vals.append('work-tcp-A17705')
        write(wp,work)
    if node['identity']['assetId'] is None:
        prov=read(original.parent/'provenance.json')
        template=read(SITE/'content/library/catalog/assets/asset-ready-text-edition-l06-calvin-41.json')
        asset=copy.deepcopy(template)
        asset.update(id=assetid,editionId=eid,sourceId=original.parent.parent.name,canonicalUrl=source_url,finalUrl=prov['finalUrl'],relativePath=prov['relativePath'],sha256=sha,byteCount=original.stat().st_size,retrievedAt=prov['retrievedAt'].replace('+00:00','Z'),editorialState='draft',notes=['Existing held original registered in place; no acquisition, re-extraction or publication action.'],reviews=[review])
        asset['quality']={'state':'issues','reviewedBy':'Codex','reviewedOn':'2026-10-12','note':'Original bytes and metadata verified; transcription gaps and claim-level interpretation remain unreviewed.'}
        rights=asset['rights'];rights['evidence']=[evidence];rights['review']=review
        rights['attribution']='; '.join(r['name']+' ('+r['role']+')' for r in node['reviewedRoles'])+'; '+details['electronicPublisher']
        if role in ['fergusson','calvin-sermons']:
            rights.update(category='open-license',licenseId='CC0-1.0',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',conditions=['Retain source provenance and encoded gaps; dedication concerns transcription, not scan images.'],conditionsMet=True,unresolved=['Existing public reader availability retained; no new derivative publication review performed.'])
        else:rights['unresolved']=['Existing CCEL restricted disposition retained; this registration grants no public text permission.']
        # Keep public actions unknown, matching prior acquisition scope. Private
        # use is owner-authorized; existing TCP reader availability is untouched.
        rights['actions']={k:('allowed' if k in ['download','embed','indexMetadata','indexFullText'] else 'unknown') for k in rights['actions']}
        write(SITE/f'content/library/catalog/assets/{assetid}.json',asset)
    authors_display=[r['name'] for r in node['reviewedRoles'] if r['role']=='author']
    translators=[r['name'] for r in node['reviewedRoles'] if r['role']=='translator']
    credits=[{'name':r['name'],'role':r['role'],'contributorId':r['existingContributorId']} for r in node['reviewedRoles']]
    overrides.append({'sha256':sha,'evidence':[evidence],'credits':credits,'fields':{'authors':authors_display,'contributors':[c['id'] for c in node['contributorBindings']],'editors':[],'translators':translators,'language':'en','workId':wid,'editionId':eid,'editionDetails':details}})
write(SITE/'content/library/registry-extensions/ephesians-contributors.json',{'$schema':'../schema.json','schemaVersion':1,'kind':'author-registry','updated':'2026-10-12','authors':authors})
write(SITE/'content/teachers/edition-identities.json',{'schemaVersion':1,'records':overrides})
(PRIVATE/'implementation-changes.json').write_text(json.dumps({'changedFiles':changes,'originalsRehashed':4,'originalsMoved':0,'databaseWrites':0},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'changedFiles':len(changes),'records':changes},indent=2))
