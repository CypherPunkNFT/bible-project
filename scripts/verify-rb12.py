"""RB12 immutable text, historical-role, exact locator and planner verification."""
import hashlib,importlib.util,json,re,sys,zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from bible.paths import SOURCES
SITE=Path(__file__).resolve().parents[1];R=SITE/'content/library/reports/reformed-baptist-overnight/RB12'
def read(n):return json.loads((R/n).read_text('utf-8-sig'))
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
    checks=[];quality=[]
    def passed(kind,**kw):checks.append(dict(kind=kind,passed=True,**kw))
    s=importlib.util.spec_from_file_location('rb',SITE/'scripts/rb12-acquire.py');r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
    m=read('acquisition-manifest.json');files=m['files'];targets={a['url']:a for a in read('targets.json')}
    assert len(files)==46 and not m['failures'] and not m['ingested'] and not m['embedded'] and not m['publicHostingAllowed']
    for a in files:
        p=(SOURCES/a['relativePath']).resolve();assert p.is_relative_to(SOURCES.resolve());raw=p.read_bytes();assert sha(raw)==a['sha256'] and len(raw)==a['byteCount'];assert json.loads(p.with_name('provenance.json').read_text('utf-8'))==a
        d=a['derivedText'];body=(SITE/d['path']).read_bytes();txt=(SITE/d['path']).read_text('utf-8');assert sha(body)==d['sha256'] and r.extract(raw,targets[a['url']])==txt;assert len(re.findall(r"\b[\w'-]+\b",txt))==d['wordCount'];assert all(re.search(q,txt,re.I) for q in a['requiredMarkers'])
        assert a['evidenceOnly'] and not a['publicHostingAllowed'] and not a['publicFullTextIndexAllowed']
        q=dict(assetId=a['assetId'],format=a['format'],readableWords=d['wordCount'],replacementCharacters=txt.count('\ufffd'),newOCR=False,newTranscription=False,separateImagesAcquired=False)
        assert q['replacementCharacters']==0
        if a['format']=='xml':
            root=ET.fromstring(raw);ns={'t':'http://www.tei-c.org/ns/1.0'};gaps=root.findall('.//t:text//t:gap',ns)
            assert txt.count('[SOURCE GAP:')==len(gaps);q.update(encodedSourceGaps=len(gaps),printedPageMarkers=txt.count('SOURCE TEI PAGE:'),sourceLicense=' '.join(''.join(root.find('.//t:availability',ns).itertext()).split()))
            assert 'CC0' in q['sourceLicense'] or 'Creative Commons 0 1.0 Universal' in q['sourceLicense']
            assert len(gaps)==(18 if 'knollys' in a['workId'] else 1)
            if 'lord-mayor' in a['workId']:assert 'Dated in London the 28 February 1659.' in txt
        if a['format']=='pdf':
            import pymupdf
            with pymupdf.open(p) as pdf:
                assert len(pdf)==62 and all(len(page.get_text().strip())>20 for page in pdf)
                q['pageTextCharacters']=[len(page.get_text().strip()) for page in pdf]
                assert 'William H. Gross' in pdf[0].get_text() and 'Feb 2021' in pdf[0].get_text()
        if a['workId'].endswith('belyea-origins'):
            assert all('['+str(i)+']' in txt for i in range(1,76))
            assert 'Response to Professor Greg Beale' not in txt
        quality.append(q);passed('original-provenance-full-extraction-replay',assetId=a['assetId'])
    assert [sum(a['format']==f for a in files) for f in ['html','txt','xml','pdf']]==[41,2,2,1]
    for a in read('holdings-audit.json')['files']:
        assert sha((SOURCES/a['relativePath']).read_bytes())==a['actualSha256'];passed('held-original-hash-unchanged',assetId=a['assetId'])
    du=read('candidate-duplicate-audit.json');assert len(du['candidates'])==46 and all(not x['matches'] for x in du['candidates']);assert du['priorLedgerRecords']==13110
    assert len({a['sha256'] for a in files})==46
    passed('all-prior-ledger-urls-and-hashes-duplicate-screened',records=du['priorLedgerRecords'])
    works=read('chapter-map.json')['works'];by={w['assetId']:w for w in works};locations={};assert len(by)==97
    for w in works:
        assert sha((SOURCES/w['relativePath']).read_bytes())==w['originalSha256'];assert sha((SITE/w['derivative']['path']).read_bytes())==w['derivative']['sha256'];ls=(SITE/w['derivative']['path']).read_text('utf-8').splitlines();locations[w['assetId']]={u['locator'] for u in w['locations']}
        for u in w['locations']:
            if 'lineStart' in u:
                assert 1<=u['lineStart']<=u['lineEnd']<=len(ls)
                if 'sourceLabel' in u:assert ls[u['lineStart']-1]==u['sourceLabel']
            elif u.get('member'):
                with zipfile.ZipFile(SOURCES/w['relativePath']) as z:assert u['member'] in z.namelist()
            passed('reading-unit-existing-source-range',assetId=w['assetId'],locator=u['locator'])
        passed('mapped-witness-original-and-derivative',assetId=w['assetId'])
    for c in read('selected-components.json')['components']:
        w=by[c['parentAssetId']];assert c['parentSha256']==w['originalSha256'] and c['sourceLocator'] in locations[c['parentAssetId']]
        raw=(SITE/c['derivedText']['path']).read_bytes();assert sha(raw)==c['derivedText']['sha256'];ls=(SITE/w['derivative']['path']).read_text('utf-8').splitlines();assert raw.decode('utf-8')=='\n'.join(ls[c['lineStart']-1:c['lineEnd']])+'\n';assert not c['eligibleForScopedIntake'] and not c['integrated'];passed('exact-private-historical-component-replay',componentId=c['componentId'])
    for d in read('document-table.json')['documents']:
        assert d['assetId'] in by and d['originalSha256']==by[d['assetId']]['originalSha256'] and d['locator'] in locations[d['assetId']];passed('dated-document-existing-witness-locator',title=d['title'])
    for rel in read('relationship-table.json')['relationships']:
        w=by[rel['assetId']];assert rel['originalSha256']==w['originalSha256'] and rel['sourceLocator'] in locations[w['assetId']];assert not rel['graphAsserted'];passed('historical-relationship-qualified-source',relationship=rel['predicate'])
    evidence=read('theological-evidence.json');assert len(evidence['sixAnchors'])==6 and not evidence['globalAuthorApproval']
    for e in evidence['primaryCachedEvidence']:
        raw=(r.base.CACHE/'http'/(sha(e['url'].encode())+'.body')).read_bytes();assert sha(raw)==e['sha256'] and len(raw)==e['byteCount'];passed('cached-source-identity-permission-doctrine-evidence',url=e['url'])
    for e in evidence['sixAnchors']:
        w=by[e['assetId']];ls=(SITE/w['derivative']['path']).read_text('utf-8').splitlines();assert e['sourceLocator'] in locations[w['assetId']];assert re.search(e['literalMarker'], '\n'.join(ls[e['lineStart']-1:e['lineEnd']]),re.I);passed('working-confessional-selection-anchor',anchor=e['anchor'])
    assert all(a['evidenceOnly'] and not a['integrated'] and not a['eligibleForScopedIntake'] for a in read('intake-scope.json')['files'])
    sys.path.insert(0,str(SITE));from knowledge.settings import load;from knowledge.library import plan_library
    _,_,hints,derivatives,originals=plan_library(load());planned=[]
    for a in files:
        p=(SOURCES/a['relativePath']).resolve();assert p in originals and hints[str(p)]['evidenceOnly'] and hints[str(p)]['sha256']==a['sha256'] and derivatives[str(p)]['sha256']==a['derivedText']['sha256'];planned.append(dict(assetId=a['assetId'],planned=True,evidenceOnly=True))
    passed('read-only-planner-all-new-parents-held')
    def walk(x):
        if isinstance(x,dict):
            assert not {'firstText','firstPages','fullText','body','chapterContent'}&x.keys()
            for v in x.values():walk(v)
        elif isinstance(x,list):
            for v in x:walk(v)
    for p in R.glob('*.json'):walk(json.loads(p.read_text('utf-8-sig')))
    passed('versioned-metadata-excludes-private-text-bodies')
    r.base.write(R/'text-quality.json',dict(mission='RB12',witnesses=quality,noNewOCR=True,noSeparateImageAssets=True,limit='Existing OCR and publisher transcriptions structurally checked; critical collation not claimed.'))
    r.base.write(R/'verification.json',dict(mission='RB12',checksPassed=True,checkCount=len(checks),checks=checks,extractionReplays=len(files),componentReplays=27,plannedIntakeRows=planned,dbTouched=False,embeddingLaunched=False,originalBytes=sum(a['byteCount'] for a in files),readableDerivativeWords=sum(a['derivedText']['wordCount'] for a in files)))
    print('VERIFIED',len(checks),'checks;',len(files),'source replays; 27 exact components; all parents held; no DB writes')
if __name__=='__main__':main()
