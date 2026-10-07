"""RB11 local integrity, exact study joins, quotation boundaries and intake holds."""
import hashlib,importlib.util,json,re,sys,zipfile
from pathlib import Path
from bs4 import BeautifulSoup
from bible.paths import SOURCES
SITE=Path(__file__).resolve().parents[1];R=SITE/'content/library/reports/reformed-baptist-overnight/RB11'
def read(n):return json.loads((R/n).read_text('utf-8-sig'))
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
    checks=[]
    def passed(kind,**kw):checks.append(dict(kind=kind,passed=True,**kw))
    s=importlib.util.spec_from_file_location('r',SITE/'scripts/rb11-acquire.py');r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
    m=read('acquisition-manifest.json');files=m['files'];targets={a['url']:a for a in read('targets.json')};assert len(files)==6 and not m['failures'] and not m['ingested'] and not m['embedded'];quality=[]
    for a in files:
        p=(SOURCES/a['relativePath']).resolve();assert p.is_relative_to(SOURCES.resolve());raw=p.read_bytes();assert sha(raw)==a['sha256'] and len(raw)==a['byteCount'];assert json.loads(p.with_name('provenance.json').read_text('utf-8'))==a
        d=a['derivedText'];dr=(SITE/d['path']).read_bytes();text=(SITE/d['path']).read_text('utf-8');assert sha(dr)==d['sha256'];assert r.extract(raw,targets[a['url']])==text;assert len(re.findall(r"\b[\w'-]+\b",text))==d['wordCount'];assert all(re.search(q,text,re.I) for q in targets[a['url']]['requiredMarkers'])
        assert a['evidenceOnly'] and a['theologicalEligibility']=='eligible-within-declared-subject-scope' and not a['publicHostingAllowed'] and not a['publicFullTextIndexAllowed'];assert a['edition']==targets[a['url']]['edition']
        q=dict(assetId=a['assetId'],words=d['wordCount'],replacementCharacters=text.count('\ufffd'),noNewOCR=True,noImageExtraction=True)
        if a['format']=='epub':
            with zipfile.ZipFile(p) as z:
                assert z.testzip() is None;q['sourceReplacementByteMembers']=[dict(member=n,count=z.read(n).count(b'\xef\xbf\xbd')) for n in z.namelist() if z.read(n).count(b'\xef\xbf\xbd')]
            if 'spurgeon' in a['workId']:
                assert text.count('\ufffd')==9 and sum(x['count'] for x in q['sourceReplacementByteMembers'])==9
                q['limit']='Nine source-embedded replacement characters in Latin/accented/Hebrew terms in quoted notes; preserved, no inferred repair. This does not make the edition a critical transcription.'
            else:assert q['replacementCharacters']==0 and 'Copyright' in text and '2016' in text
        else:
            doc=BeautifulSoup(raw,'html.parser');assert len(doc.select(a['selector']))==1 and q['replacementCharacters']==0
            date={'chbc-prayer1':('Mar 26, 2023','March 26, 2023'),'chbc-prayer2':('Apr 02, 2023','April 2, 2023'),'dever-corporate':('February 26, 2010','February 26, 2010'),'hamilton-corporate':('February 25, 2010','February 25, 2010')}[a['workId'].removeprefix('work-rb11-')];assert date[0] in doc.get_text(' ',strip=True) and date[1] in a['edition'];q.update(selector=a['selector'],sourceDisplayedDate=date[0],normalizedDisplayedDate=date[1])
        quality.append(q);passed('immutable-original-provenance-complete-extraction-replay',assetId=a['assetId'])
    assert [sum(a['format']==f for a in files) for f in ['epub','html','pdf']]==[2,4,0]
    held=read('holdings-audit.json')['files'];assert len(held)==1119;assert not {a['sha256'] for a in files}&{a['actualSha256'] for a in held}
    for a in held:
        assert sha((SOURCES/a['relativePath']).read_bytes())==a['actualSha256']
        if a.get('auditDerivative'):assert sha((SITE/a['auditDerivative']['path']).read_bytes())==a['auditDerivative']['sha256']
        passed('actual-held-original-hash',assetId=a['assetId'])
    dup=read('candidate-duplicate-audit.json');assert dup['priorLedgerRecords']==13104 and len(dup['candidates'])==6 and all(not a['matches'] for a in dup['candidates']);passed('all-prior-ledger-url-and-hash-duplicate-screen')
    data=read('chapter-map.json');works=data['works'];assert len(works)==23 and data['unitCount']==sum(len(w['locations']) for w in works)==452;by={w['assetId']:w for w in works};locations={}
    for w in works:
        assert sha((SOURCES/w['relativePath']).read_bytes())==w['originalSha256'];assert sha((SITE/w['derivative']['path']).read_bytes())==w['derivative']['sha256'];lines=(SITE/w['derivative']['path']).read_text('utf-8').splitlines();locations[w['assetId']]={u['locator']:u for u in w['locations']}
        if w['relativePath'].endswith('.epub'):
            with zipfile.ZipFile(SOURCES/w['relativePath']) as z:
                for u in w['locations']:
                    assert u['member'] in z.namelist();doc=BeautifulSoup(z.read(u['member']),'html.parser');anchor=u['locator'].partition('#')[2];exists=not anchor or doc.find(id=anchor) is not None or doc.find(attrs={'name':anchor}) is not None;assert exists==u['anchorPresent'];passed('epub-member-and-source-anchor-status',assetId=w['assetId'],locator=u['locator'])
        else:
            for u in w['locations']:
                assert 1<=u['lineStart']<=u['lineEnd']<=len(lines) and lines[u['lineStart']-1]==u['sourceLabel'];passed('exact-written-body-line-range',assetId=w['assetId'],locator=u['locator'])
    for p in read('reading-paths.json')['paths']:
        assert p['limitations'] and not p['inferredFromVectors']
        for e in p['entries']:
            assert e['assetId'] in by and e['originalSha256']==by[e['assetId']]['originalSha256'];assert all(u==locations[e['assetId']][u['locator']] for u in e['locations']);passed('study-question-exact-source-join',question=p['question'],assetId=e['assetId'])
    ps=read('psalm-coverage.json');assert [p['chapter'] for p in ps['chapters']]==list(range(1,151));assert sum(p['status']=='new-readable-original' for p in ps['chapters'])==87
    for p in ps['chapters']:
        assert p['sourceLocator'] in locations[p['assetId']] and p['originalSha256']==by[p['assetId']]['originalSha256'] and p['anchorPresent']
        with zipfile.ZipFile(SOURCES/by[p['assetId']]['relativePath']) as z:
            doc=BeautifulSoup(z.read(p['member']),'html.parser');anchor=p['readableLocator'].partition('#')[2];assert not anchor or doc.find(id=anchor) is not None or doc.find(attrs={'name':anchor}) is not None
            assert any(h.get_text(' ',strip=True)==f'Psalm {p["chapter"]}' for h in doc.select('h3'))
        passed('actual-readable-psalm-heading-and-resolved-navigation',chapter=p['chapter'])
    cs=read('selected-components.json')['components'];assert len(cs)==8
    for c in cs:
        w=by[c['parentAssetId']];assert c['parentSha256']==w['originalSha256'] and c['sourceLocator'] in locations[c['parentAssetId']]
        raw=(SITE/c['derivedText']['path']).read_bytes();assert sha(raw)==c['derivedText']['sha256']
        with zipfile.ZipFile(SOURCES/w['relativePath']) as z:
            doc=BeautifulSoup(z.read(c['member']),'html.parser');strings=list((doc.body or doc).stripped_strings);body='\n'.join(strings[c['startStringIndex']:c['endStringIndexExclusive']])+'\n';assert body==raw.decode('utf-8');assert strings[c['startStringIndex']]=='EXPOSITION' and strings[c['endStringIndexExclusive']].startswith('EXPLANATORY NOTES');assert '\ufffd' not in body
        assert c['evidenceOnly'] and not c['eligibleForScopedIntake'];passed('exact-own-exposition-boundaries-and-component-replay',title=c['title'])
    for e in read('passage-evidence.json')['entries']:
        assert e['locator'] in locations[e['assetId']] and e['originalSha256']==by[e['assetId']]['originalSha256'];text=(SITE/e['derivative']['path']).read_text('utf-8');observed=text[e['normalizedTextCharacterStart']:e['normalizedTextCharacterEnd']];assert observed==e['sourceCitation'] and re.fullmatch(e['sourceRegex'],observed,re.I) and not e['semanticInference'];passed('literal-scripture-citation-exact-position',passage=e['passage'])
    ev=read('theological-evidence.json');assert len(ev['sixAnchors'])==6 and not ev['globalAuthorApproval'] and not ev['corpusLicenseEstablished']
    for e in ev['primaryCachedEvidence']:
        raw=(r.base.CACHE/'http'/(sha(e['url'].encode())+'.body')).read_bytes();assert sha(raw)==e['sha256'] and len(raw)==e['byteCount'];passed('cached-primary-doctrine-identity-offer-permission-evidence',url=e['url'])
    scopes=read('intake-scope.json')['files'];assert len(scopes)==6 and all(s['evidenceOnly'] and not s['eligibleForScopedIntake'] and not s['integrated'] for s in scopes)
    sys.path.insert(0,str(SITE));from knowledge.settings import load;from knowledge.library import plan_library
    _,_,hints,derivatives,originals=plan_library(load());planned=[]
    for a in files:
        p=(SOURCES/a['relativePath']).resolve();assert p in originals and hints[str(p)]['evidenceOnly'] and hints[str(p)]['sha256']==a['sha256'];assert derivatives[str(p)]['sha256']==a['derivedText']['sha256'];planned.append(dict(assetId=a['assetId'],planned=True,evidenceOnly=True))
    passed('read-only-intake-planner-six-held-parents')
    def walk(x):
        if isinstance(x,dict):
            assert not {'firstText','firstPages','fullText','body','chapterContent'}&x.keys()
            for v in x.values():walk(v)
        elif isinstance(x,list):
            for v in x:walk(v)
    for p in R.glob('*.json'):walk(json.loads(p.read_text('utf-8-sig')))
    passed('versioned-metadata-excludes-private-bodies')
    r.base.write(R/'text-quality.json',dict(mission='RB11',witnesses=quality,noNewOCR=True,noSeparateImageAssets=True))
    r.base.write(R/'verification.json',dict(mission='RB11',checksPassed=True,checkCount=len(checks),checks=checks,extractionReplays=6,componentExtractionReplays=8,plannedIntakeRows=planned,dbTouched=False,embeddingLaunched=False,originalBytes=sum(a['byteCount'] for a in files),readableDerivativeWords=sum(a['derivedText']['wordCount'] for a in files)))
    print('VERIFIED',len(checks),'checks; six parent and eight component replays; no DB writes')
if __name__=='__main__':main()
