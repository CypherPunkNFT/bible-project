"""P3: selected-source identity sidecars. No shared writes; run with python -B."""
import hashlib
import json
import sqlite3
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

PROJECT = Path(__file__).resolve().parents[5]
SITE = PROJECT / 'Website'
OUT = PROJECT / 'KnowledgeBase/library-knowledge/parallel-preparation/03-source-identities'
sys.dont_write_bytecode = True
sys.path.insert(0, str(SITE))
from knowledge.evidence_collections.crosswalk import make_node, normalized
from knowledge.evidence_collections.contract import sha256_file
from knowledge.research_foundation.contract import fingerprint

def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def save(name, obj):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT/name).write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
def ro(p):
    db = sqlite3.connect(p.resolve().as_uri()+'?mode=ro', uri=True, timeout=5)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA query_only=ON')
    return db
def documents(ids):
    db=ro(PROJECT/'KnowledgeBase/knowledge.sqlite3')
    try:
        db.execute('BEGIN')
        return db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0], [dict(db.execute('SELECT * FROM documents WHERE id=?',(key,)).fetchone()) for key in ids]
    finally: db.close()
def resources(shas):
    db=ro(PROJECT/'KnowledgeBase/Research Foundation/registry.sqlite3')
    try:
        return {sha:[dict(r) for r in db.execute('SELECT * FROM resources WHERE sha256=? ORDER BY id',(sha,))] for sha in shas}
    finally: db.close()

def main():
    specpath=PROJECT/'KnowledgeBase/library-knowledge/ephesians-connections-20261012/spec.json'
    manifestpath=specpath.parent/'release-final/manifest.json'
    spec=read(specpath); manifest=read(manifestpath)
    tracked={}
    def track(p):
        p=Path(p); tracked[str(p)]=sha256_file(p) if p.is_file() else None
    for p in [specpath, manifestpath, Path(__file__), SITE/'knowledge/evidence_collections/crosswalk.py', SITE/'knowledge/research_foundation/contract.py']:
        track(p)
    for item in manifest['collections']:
        p=manifestpath.parent/item['path']; track(p)
        assert tracked[str(p)]==item['sha256'], 'Original pilot object hash mismatch'
    package=SITE/'public/content/teacher-library'
    catalogue=read(package/'catalogue.json')
    known_contributors={r['id']:r for r in catalogue['contributors']}
    authors_path=SITE/'content/library/authors.json'
    author_registry={r['id']:r for r in read(authors_path)['authors']}
    ids=[s['documentId'] for s in spec['sources']]
    shas=[s['sha256'] for s in spec['sources']]
    build, docs=documents(ids); registry=resources(shas)
    nodes=[]; header_outputs=[]; proposals=[]; assertions=[]; http=[]; expected_absent=[]
    for s, doc in zip(spec['sources'],docs):
        sha=s['sha256']; path=Path(doc['source']); track(path)
        assert tracked[str(path)]==sha
        meta=json.loads(doc['metadata']); rows=registry[sha]
        assert len(rows)==1, 'Explicit review required for ambiguous resource binding'
        rm=json.loads(rows[0]['record'])['metadata']
        claims={}; claim_sources={}; differences=[]
        for kind in ['work','edition','asset']:
            key=kind+'Id'
            values={v for v in [meta.get(kind,{}).get('id'),meta.get('acquisition',{}).get(key),rm.get(key)] if v}
            existing=[]
            for value in sorted(values):
                candidate=SITE/f'content/library/catalog/{kind}s/{value}.json'; track(candidate)
                if candidate.is_file(): existing.append(value)
            if len(values)>1:
                assert len(existing)==1 and existing[0]==rm.get(key), 'Ambiguous canonical assertions require review'
                differences.append({'field':key,'assertedValues':sorted(values),'selectedExistingCanonicalId':existing[0],'basis':'Exact-byte resource registry references the sole existing canonical record; preserve other acquisition ID as an unresolved legacy assertion, not a merged identity.'})
            claims[key]=existing[0] if existing else next(iter(values),None); claim_sources[key]=sorted(values)
            if claims[key]:
                cp=SITE/f'content/library/catalog/{kind}s/{claims[key]}.json'; track(cp)
                if not cp.exists(): expected_absent.append(str(cp))
        node=make_node(SITE, package, doc['id'],path,sha,claims,rows,[])
        assert node['resourceStatus']=='resolved'
        node.update(role=s['role'],documentFingerprint=fingerprint(doc),registryClaims=claims,canonicalClaimsEvidence=claim_sources,identityAssertionDifferences=differences)
        root=ET.parse(path).getroot()
        fields=list(node['header']['fields'])
        if root.tag=='ThML':
            extra={'publisher':'./ThML.head/electronicEdInfo/DC/DC.Publisher', 'language':'./ThML.head/electronicEdInfo/DC/DC.Language', 'sourceIdentifier':'./ThML.head/electronicEdInfo/DC/DC.Identifier', 'electronicVersion':'./ThML.head/electronicEdInfo/version'}
        else:
            base='./{*}teiHeader/{*}fileDesc/'
            extra={'sourceCreator':base+'sourceDesc/{*}biblFull/{*}titleStmt/{*}author', 'printDate':base+'sourceDesc/{*}biblFull/{*}publicationStmt/{*}date', 'printPublisher':base+'sourceDesc/{*}biblFull/{*}publicationStmt/{*}publisher', 'electronicPublisher':base+'publicationStmt/{*}publisher', 'sourceIdentifier':base+'publicationStmt/{*}idno', 'rightsStatement':base+'publicationStmt/{*}availability', 'language':'./{*}teiHeader/{*}profileDesc/{*}langUsage/{*}language'}
            extra={k:v.replace('/sourceDesc/','/{*}sourceDesc/').replace('/publicationStmt/','/{*}publicationStmt/') for k,v in extra.items()}
        for role,xp in extra.items():
            for i,el in enumerate(root.findall(xp)):
                txt=normalized(''.join(el.itertext()))
                if txt: fields.append(dict(role=role,xpath=xp,matchIndex=i,text=txt,attributes=el.attrib))
        for i,field in enumerate(fields):
            el=root.findall(field['xpath'])[field['matchIndex']]
            assert normalized(''.join(el.itertext()))==field['text'] and el.attrib==field['attributes']
            field['evidenceKey']=f"{s['role']}:header:{i}"
        def evidence(role): return [f['evidenceKey'] for f in fields if f['role']==role]
        rid='held-'+sha[:32]; shard=hashlib.sha256(rid.encode()).hexdigest()[:2]
        record_path=package/f'records/{shard}.json'; reader_record=read(record_path)[rid]
        # Bind selected records, not unrelated records sharing a shard.
        node['reader']['recordEvidence']={'path':str(record_path),'key':rid,'fingerprint':fingerprint(reader_record)}
        for proof in node['reader']['pageProofs']: track(proof['path'])
        contrib=[]
        for cid in reader_record['contributors']:
            record=known_contributors[cid]
            cshard=hashlib.sha256(cid.encode()).hexdigest()[:2]
            cp=package/f'contributors/{cshard}.json'
            selected=[r for r in read(cp).get(cid,[]) if r['id']==rid]
            assert len(selected)==1
            contrib.append(dict(id=cid,label=record['name'],exportedRecord=record,exportedFingerprint=fingerprint(record),selectedShelfRecord=selected[0],shelfPath=str(cp),canonicalAuthorRecord=author_registry.get(cid),canonicalAuthorFingerprint=fingerprint(author_registry[cid]) if cid in author_registry else None))
        node['contributorBindings']=contrib
        author=s['attribution']['author']; translator=s['attribution']['translator']
        def match_name(name): return next((x['id'] for x in contrib if x['label']==name),None)
        roles=[dict(name=author,role='author',existingContributorId=match_name(author),headerEvidence=evidence('creator'))]
        if translator:
            refs=[f['evidenceKey'] for f in fields if ('Pringle' in f['text'] if s['role']=='calvin-commentary' else 'Translated out of French into English by Arthur Golding' in f['text'])]
            roles.append(dict(name=translator,role='translator',existingContributorId=match_name(translator),headerEvidence=refs))
        node['reviewedRoles']=roles
        node['unassignedEditorialRole']={'editor':None,'reason':'No editor identity established in the inspected header; transcription/markup credits are not silently promoted to editor.'}
        dates={
            'calvin-commentary':(None,'1999-11-23',None),
            'hodge':('[1860]','2006-03-02','New York: Robert Carter and Bros.'),
            'fergusson':('1659','2004-11','Printed for the Company of Stationers'),
            'calvin-sermons':('1577','2005-10','[By Thomas Dawson] for Lucas Harison, and George Byshop'),
        }[s['role']]
        assert any(dates[1] in f['text'] for f in fields if f['role']=='electronicDateStatement')
        if dates[0]:
            assert any(dates[0] in f['text'] for f in fields if f['role'] in ['printDate','printSourceStatement'])
        if translator: assert roles[-1]['headerEvidence']
        assert all(r['headerEvidence'] for r in roles)
        node['dateRoles']={'composition':{'value':None,'status':'unknown'},'delivery':{'value':None,'status':'unknown'},'printEdition':{'value':dates[0],'status':'source-asserted' if dates[0] else 'unknown','evidence':evidence('printDate') or evidence('printSourceStatement'),'qualification':'Brackets retained; source statement, not independent bibliographic certification.'},'electronicEdition':{'value':dates[1],'status':'source-asserted','evidence':evidence('electronicDateStatement')}}
        node['publishers']={'print':dates[2],'printEvidence':evidence('printPublisher') or evidence('printSourceStatement'),'electronic':'Christian Classics Ethereal Library' if root.tag=='ThML' else 'Text Creation Partnership','electronicEvidence':evidence('publisher') or evidence('electronicPublisher')}
        node['workBoundary']={'scope':'Galatians and Ephesians in one held edition' if s['role'] in ['fergusson','calvin-commentary'] else 'Ephesians only; sermons' if s['role']=='calvin-sermons' else 'Ephesians commentary','componentCanonicalIds':None,'policy':'No new component work IDs; no merger between Calvin sermons and commentary.','evidence':evidence('title')}
        node['existingUseAssertions']={'privateAnalysis':'Authorized by owner; existing corpus scope retained','corpusScope':meta.get('scope'),'corpusPublicPublication':meta.get('public_publication'),'registry':{k:rm.get(k) for k in ['licence','useScope','publicHostingAllowed','publicFullTextIndexAllowed']},'readerAvailability':reader_record['availability'],'sourceRightsEvidence':evidence('rightsStatement'),'newPermissionDecision':False,'limit':'Different layers retain their existing assertions. Header rights wording does not expand public permissions; TCP reader availability and restrictive acquisition flags need explicit reconciliation.'}
        node['reader']['passageNavigation']='whole-work route only; page indices/locators separate; no verified deep links'
        node['review']={'kind':'ai-assisted','scope':'Bounded identity, header assertions and reader availability; not theological review or new rights clearance','date':'2026-10-12'}
        header_outputs.append({'documentId':doc['id'],'role':s['role'],'sourcePath':str(path),'sha256':sha,'fields':fields})
        # Probe only the known local preview, once per route/record/bundle.
        routes=[node['reader']['catalogueRoute'], '/content/teacher-library/records/'+shard+'.json']
        routes += ['/content/teacher-library/'+str(Path(x['path']).relative_to(package)).replace('\\','/') for x in node['reader']['pageProofs']]
        for route in dict.fromkeys(routes):
            if not route: continue
            try:
                with urlopen('http://127.0.0.1:8931'+route,timeout=8) as response:
                    body=response.read(); status=response.status
                item={'role':s['role'],'route':route,'status':status}
                if route.endswith('.json'):
                    data=json.loads(body)
                    if '/records/' in route: item['selectedRecordMatches']=data.get(rid)==reader_record
                    else: item['bundleSha256Matches']=hashlib.sha256(body).hexdigest()==Path(route).stem
                else: item['limit']='HTTP route response alone does not prove reader body availability.'
                http.append(item)
            except Exception as err: http.append({'role':s['role'],'route':route,'status':'unresolved','reason':str(err)})
        changes=[]
        if differences:
            changes.append({'field':'legacy acquisition identity references','differences':differences,'action':'Reconcile recorded references to verified existing canonical IDs; preserve legacy assertions and their provenance. Do not create a duplicate work or silently merge IDs.'})
        for kind in ['work','edition','asset']:
            if node['identity'][kind+'Id'] is None:
                proposed = {'work':{'title':doc['title'],'authorContributorReference':roles[0],'componentScope':node['workBoundary']},'edition':{'workId':node['identity']['workId'],'languages':['en'],'dates':node['dateRoles'],'publishers':node['publishers'],'contributors':roles[1:]},'asset':{'editionId':node['identity']['editionId'],'sha256':sha,'relativePath':str(path.relative_to(PROJECT/'sources')).replace('\\','/'),'byteCount':path.stat().st_size,'mimeType':'application/xml','sourceUrl':rm.get('url'),'existingRightsUnchanged':True}}[kind]
                changes.append({'field':kind+'Id','existingAcquisitionOrRegistryId':claims[kind+'Id'],'proposedCanonicalId':None,'proposedFields':proposed,'action':'Reconcile/register existing asserted identity if supported; allocate only in later canonical-owner task.','requiredEvidence':evidence('title')+evidence('sourceIdentifier')})
        if translator:
            changes.append({'field':'edition.contributors / reader role-specific credits','value':roles[-1],'action':'Attribute translator separately from author; resolve existing contributor identity without name-only merging.'})
        if reader_record.get('language')=='und': changes.append({'field':'edition.languages and reader.language','value':['en'],'evidence':evidence('language'),'action':'Apply only after validating header language assertion.'})
        if reader_record.get('editionId') is None and node['identity']['editionId']:
            changes.append({'field':'reader.editionId','value':node['identity']['editionId'],'action':'Populate from verified canonical chain after registration/reader integration review.'})
        changes.append({'field':'edition.dateRoles / publisher roles','value':{'dates':node['dateRoles'],'publishers':node['publishers']},'action':'Copy only supported, role-specific source assertions; retain unknown composition/delivery dates.'})
        if node['identity']['workId'] and reader_record.get('workId') is None:
            changes.append({'field':'reader.workId','value':node['identity']['workId'],'action':'Bind existing canonical work; no new identity.'})
        proposals.append({'documentId':doc['id'],'role':s['role'],'applied':False,'changes':changes,'preserve':['original bytes','existing resource/document IDs','edition separation','public disposition until separate review']})
        nodes.append(node)
    # Verify selected rows and files again. No live DB hashing or corpus enumeration.
    after_build, after_docs=documents(ids); after_registry=resources(shas)
    changed=[p for p,h in tracked.items() if (sha256_file(p) if Path(p).is_file() else None)!=h]
    rows_changed=docs!=after_docs or registry!=after_registry
    changed_records=[]
    for n in nodes:
        r=n['reader']['recordEvidence']
        if fingerprint(read(r['path']).get(r['key']))!=r['fingerprint']: changed_records.append(r['key'])
    current_contributors={r['id']:r for r in read(package/'catalogue.json')['contributors']}
    current_authors={r['id']:r for r in read(authors_path)['authors']}
    for n in nodes:
        for c in n['contributorBindings']:
            if current_contributors.get(c['id'])!=c['exportedRecord'] or current_authors.get(c['id'])!=c['canonicalAuthorRecord']: changed_records.append(c['id'])
            shelf=[r for r in read(c['shelfPath']).get(c['id'],[]) if r['id']==n['reader']['recordId']]
            if shelf!=[c['selectedShelfRecord']]: changed_records.append(c['id']+':shelf')
    counts={'selectedSources':4,'originalBindingsResolved':sum(n['sourceBinding']=='verified-original-bytes' for n in nodes),'resourceBindingsResolved':sum(n['resourceStatus']=='resolved' for n in nodes),'canonicalWorkResolved':sum(n['identity']['workId'] is not None for n in nodes),'canonicalEditionResolved':sum(n['identity']['editionId'] is not None for n in nodes),'canonicalAssetResolved':sum(n['identity']['assetId'] is not None for n in nodes),'canonicalChainsResolved':sum(n['identity']['status']=='resolved' for n in nodes),'onSiteReadable':sum(n['reader']['status']=='readable-local-package' for n in nodes),'catalogueOnly':sum(n['reader']['status']=='catalogue-only' for n in nodes),'readerPagesVerified':sum(n['reader'].get('pages',0) for n in nodes),'authorsSourceAsserted':4,'translatorRolesSourceAsserted':2,'translatorsWithExistingSelectedContributorBinding':sum(r['existingContributorId'] is not None for n in nodes for r in n['reviewedRoles'] if r['role']=='translator'),'printDatesSourceAsserted':sum(n['dateRoles']['printEdition']['value'] is not None for n in nodes),'electronicDatesSourceAsserted':4,'printPublishersSourceAsserted':3,'electronicPublishersSourceAsserted':4,'distinctNamedAuthors':3,'selectedSourceRepresentations':4,'headerAssertionsVerified':sum(len(h['fields']) for h in header_outputs)}
    unresolved={'canonicalWorks':4-counts['canonicalWorkResolved'],'canonicalEditions':4-counts['canonicalEditionResolved'],'canonicalAssets':4-counts['canonicalAssetResolved'],'completeCanonicalChains':4-counts['canonicalChainsResolved'],'exactEditionOnSiteTexts':counts['catalogueOnly'],'translatorContributorBindings':2-counts['translatorsWithExistingSelectedContributorBinding'],'legacyWorkIdDifferences':sum(len(n['identityAssertionDifferences']) for n in nodes),'printDates':1,'printPublishers':1,'compositionDates':4,'deliveryDates':4,'editorIdentities':4,'newOutputPublicUseReviews':4,'sourceNumberingConflictsCarriedForward':1}
    http_ok=all(r['status']==200 and r.get('selectedRecordMatches',True) and r.get('bundleSha256Matches',True) for r in http)
    validation={'valid':not(changed or rows_changed or changed_records or build!=after_build) and http_ok,'inputFilesChanged':changed,'selectedDatabaseRowsChanged':rows_changed,'selectedExportRecordsChanged':changed_records,'corpusBuildBefore':build,'corpusBuildAfter':after_build,'requiresFinalSnapshotRecheck':True,'http':http,'httpChecksPassed':http_ok,'counts':counts,'unresolvedCounts':unresolved,'assertions':'Header selectors/text/attributes, reviewed date values, original hashes, registry byte/path matches, canonical record links, all selected reader page bundle hashes, before/after selected inputs checked.','expectedMissingCanonicalFiles':expected_absent}
    # Rights remain recorded assertions, not refreshed legal advice or publication clearance.
    result={'schemaVersion':1,'track':'P3','createdAt':datetime.now(timezone.utc).isoformat(),'scope':'Four selected Ephesians source representations only; private provisional sidecar','corpusBuild':build,'selectionManifestIntegrity':manifest['integrity'],'inputFiles':[{'path':p,'sha256':h} for p,h in tracked.items()],'sources':nodes,'counts':counts,'unresolvedCounts':unresolved,'requiresFinalSnapshotRecheck':True}
    result['integrity']=fingerprint(result)
    save('identity-crosswalk.json',result)
    save('source-header-evidence.json',{'reviewKind':'ai-assisted','sources':header_outputs})
    save('registration-proposals.json',{'applied':False,'proposals':proposals,'additionalIdentityCandidate':{'name':'William Pringle','existingExportCandidate':next((r for r in catalogue['contributors'] if r.get('name')=='Pringle, William, tr'),None),'status':'unresolved; not bound by name similarity alone'},'limits':['No IDs allocated or canonical records changed.','Calvin sermon authors array currently includes Golding; restrict proposed role correction to this edition.','Calvin commentary header says Public Domain while registry retains restrictive acquisition disposition; no new clearance inferred.']})
    save('validation.json',validation)
    print(json.dumps({'valid':validation['valid'],'counts':counts,'unresolvedCounts':unresolved,'httpFailures':sum(x['status']!=200 for x in http)},indent=2))

if __name__=='__main__': main()
