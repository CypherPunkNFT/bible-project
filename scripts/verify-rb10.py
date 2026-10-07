"""Verify RB10 immutable text witnesses, exact study joins and intake holds."""
import hashlib
import importlib.util
import json
import re
import sys
import zipfile
from pathlib import Path
from urllib.parse import unquote
from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
R=SITE/'content/library/reports/reformed-baptist-overnight/RB10'
def read(name):return json.loads((R/name).read_text(encoding='utf-8'))
def sha(raw):return hashlib.sha256(raw).hexdigest()
def main():
    checks=[]
    def passed(kind,**kw):checks.append(dict(kind=kind,passed=True,**kw))
    sp=importlib.util.spec_from_file_location('collector',SITE/'scripts/rb10-acquire.py')
    r=importlib.util.module_from_spec(sp);sp.loader.exec_module(r)
    manifest=read('acquisition-manifest.json');files=manifest['files'];assert len(files)==7
    assert not manifest['failures'] and not manifest['ingested'] and not manifest['embedded']
    targets={a['url']:a for a in read('targets.json')};quality=[]
    for a in files:
        p=(SOURCES/a['relativePath']).resolve();assert p.is_relative_to(SOURCES.resolve())
        raw=p.read_bytes();assert sha(raw)==a['sha256'] and len(raw)==a['byteCount']
        assert json.loads(p.with_name('provenance.json').read_text(encoding='utf-8'))==a
        d=a['derivedText'];rawtext=(SITE/d['path']).read_bytes();assert sha(rawtext)==d['sha256']
        t=(SITE/d['path']).read_text(encoding='utf-8');assert r.extract(raw,targets[a['url']])==t
        assert len(re.findall(r"\b[\w'-]+\b",t))==d['wordCount']>=targets[a['url']]['minimumWords']
        assert all(re.search(m,t,re.I) for m in targets[a['url']]['requiredMarkers'])
        assert a['edition']==targets[a['url']]['edition'] and a['evidenceOnly']
        assert a['theologicalEligibility']=='eligible-within-declared-subject-scope'
        assert not a['publicHostingAllowed'] and not a['publicFullTextIndexAllowed']
        q=dict(assetId=a['assetId'],words=d['wordCount'],replacementCharacters=t.count('\ufffd'),newOCR=False,separateImageAssets=False)
        if a['format']=='pdf':
            import pymupdf
            with pymupdf.open(stream=raw,filetype='pdf') as pdf:
                assert len(pdf)==226
                texts=[p.get_text() for p in pdf];assert sum(len(t.strip())>500 for t in texts)==202
                q.update(sourcePages=len(pdf),replacementPages=[i+1 for i,s in enumerate(texts) if '\ufffd' in s],quality='Existing narrative text; decorative leaders/index glyph diagnostics retained, not repaired.')
        elif a['format']=='epub':
            with zipfile.ZipFile(p) as z:assert z.testzip() is None
            assert 'TITLE ARTICLE ONE' not in t and 'FGB 184 Forgiveness 2Q 2003 REFORMAT' not in t
            year={'fgb-conscience':2022,'fgb-forgiveness':2003,'fgb-good-works':2007}[a['workId'].removeprefix('work-rb10-')]
            assert re.search(r'Copyright\s+'+str(year)+r'\s+Chapel Library',t)
            assert str(year) in a['edition']
            q['quality']='Complete EPUB spine replay; HTML head/export-title artifacts excluded; embedded artwork not separately acquired or rendered.'
        else:
            doc=r.base.soup(raw);assert len(doc.select(a['selector']))==1
            assert 'Go to Journal' not in t and q['replacementCharacters']==0
            date={'bingham-conscience':'March 19, 2026','lawrence-scrupulous':'March 25, 2026','reju-conscience':'March 2, 2026'}[a['workId'].removeprefix('work-rb10-')]
            assert date in doc.get_text(' ',strip=True) and date in a['edition']
            q['quality']='Complete exact authored wrapper; sibling journal promotion excluded; displayed author/date checked.'
        quality.append(q);passed('immutable-original-provenance-and-extraction-replay',assetId=a['assetId'])
    assert [sum(a['format']==fmt for a in files) for fmt in ['pdf','html','epub']]==[1,3,3]
    held=read('holdings-audit.json')['files'];assert len(held)==1138
    assert not {a['sha256'] for a in files}&{a['actualSha256'] for a in held}
    for a in held:
        assert sha((SOURCES/a['relativePath']).read_bytes())==a['actualSha256']
        if a.get('auditDerivative'):assert sha((SITE/a['auditDerivative']['path']).read_bytes())==a['auditDerivative']['sha256']
        passed('actual-held-original-hash',assetId=a['assetId'])
    data=read('chapter-map.json');works=data['works'];assert len(works)==19
    assert data['unitCount']==sum(len(w['locations']) for w in works)==513
    by={w['assetId']:w for w in works};loc={}
    for w in works:
        assert sha((SOURCES/w['relativePath']).read_bytes())==w['originalSha256']
        assert sha((SITE/w['derivative']['path']).read_bytes())==w['derivative']['sha256']
        lines=(SITE/w['derivative']['path']).read_text(encoding='utf-8').splitlines()
        if w['relativePath'].endswith('.epub'):
            with zipfile.ZipFile(SOURCES/w['relativePath']) as z:
                for u in w['locations']:
                    assert u['member'] in z.namelist()
                    doc=BeautifulSoup(z.read(u['member']),'html.parser');anchor=unquote(u['locator']).partition('#')[2]
                    exists=not anchor or doc.find(id=anchor) is not None or doc.find(attrs={'name':anchor}) is not None
                    assert exists==u['anchorPresent']
                    passed('actual-epub-member-and-anchor-status',assetId=w['assetId'],locator=u['locator'])
        else:
            for u in w['locations']:
                assert 1<=u['lineStart']<=u['lineEnd']<=len(lines)
                assert lines[u['lineStart']-1]==u['sourceLabel']
                if u.get('sourcePdfPageStart'):
                    assert lines[u['lineStart']-1]=='SOURCE PDF PAGE: '+str(u['sourcePdfPageStart'])
                    if u.get('printedPageStart'):assert u['printedPageStart']+w['printedPageOffset']==u['sourcePdfPageStart']
                passed('exact-derivative-heading-or-pdf-range',assetId=w['assetId'],locator=u['locator'])
        loc[w['assetId']]={u['locator']:u for u in w['locations']}
    paths=read('reading-paths.json')['paths'];assert len(paths)==13
    assert {'conscience','truthfulness','money','generosity','work','justice','forgiveness','sexual-holiness','neighbors'}<={p['topic'] for p in paths}
    for p in paths:
        assert p['purpose'] and p['limitations'] and not p['inferredFromVectors']
        for e in p['entries']:
            assert e['originalSha256']==by[e['assetId']]['originalSha256']
            assert e['locations'] and all(u['locator'] in loc[e['assetId']] for u in e['locations'])
        passed('qualified-ethical-question-to-exact-source-locations',topic=p['topic'])
    components=read('selected-components.json')['components'];assert len(components)==26
    for c in components:
        assert c['parentSha256']==by[c['parentAssetId']]['originalSha256']
        assert c['sourceLocator'] in loc[c['parentAssetId']]
        d=c['derivedText'];raw=(SITE/d['path']).read_bytes();assert sha(raw)==d['sha256']
        with zipfile.ZipFile(SOURCES/by[c['parentAssetId']]['relativePath']) as z:
            doc=BeautifulSoup(z.read(c['member']),'html.parser');body=(doc.body or doc).get_text('\n',strip=True)
            assert body==raw.decode('utf-8')
        assert c['author'] and c['holds'] and c['evidenceOnly'] and not c['eligibleForScopedIntake']
        passed('bylined-issue-component-extraction-replay-and-parent-join',title=c['title'])
    citations=read('passage-evidence.json')['entries'];assert len(citations)==18
    for e in citations:
        assert e['originalSha256']==by[e['assetId']]['originalSha256']
        assert e['locator'] in loc[e['assetId']] and not e['semanticInference']
        d=e['derivative'];assert sha((SITE/d['path']).read_bytes())==d['sha256']
        text=(SITE/d['path']).read_text(encoding='utf-8')
        observed=text[e['normalizedTextCharacterStart']:e['normalizedTextCharacterEnd']]
        assert observed==e['sourceCitation'] and re.fullmatch(e['sourceRegex'],observed,re.I)
        assert e['qualification'] and e['coverageKind']
        passed('literal-scripture-citation-at-exact-normalized-text-position',passage=e['passage'],assetId=e['assetId'])
    evidence=read('theological-evidence.json')
    for e in evidence['primaryCachedEvidence']:
        # A verification run reads its original cache; never refresh the web.
        key=sha(e['url'].encode());raw=(r.base.CACHE/'http'/f'{key}.body').read_bytes()
        assert sha(raw)==e['sha256'] and len(raw)==e['byteCount']
        passed('cached-primary-doctrinal-or-offer-evidence',url=e['url'])
    assert len(evidence['sixAnchors'])==6 and not evidence['globalAuthorApproval'] and not evidence['corpusLicenseEstablished']
    decisions=read('theological-decisions.json');assert len(decisions['decisions'])==7 and not decisions['corpusIntakeAuthorized']
    scopes=read('intake-scope.json')['files'];assert len(scopes)==7 and all(s['evidenceOnly'] and not s['eligibleForScopedIntake'] and not s['integrated'] for s in scopes)
    sys.path.insert(0,str(SITE))
    from knowledge.settings import load
    from knowledge.library import plan_library
    _,_,hints,derivatives,originals=plan_library(load());planned=[]
    for a in files:
        p=(SOURCES/a['relativePath']).resolve();assert p in originals
        assert hints[str(p)]['evidenceOnly'] and hints[str(p)]['sha256']==a['sha256']
        assert derivatives[str(p)]['sha256']==a['derivedText']['sha256']
        planned.append(dict(assetId=a['assetId'],evidenceOnly=True,planned=True))
    passed('read-only-intake-planner-seven-held-parents')
    def walk(x):
        if isinstance(x,dict):
            assert not {'firstText','firstPages','fullText','body','chapterContent'}&x.keys()
            for v in x.values():walk(v)
        elif isinstance(x,list):
            for v in x:walk(v)
    for p in R.glob('*.json'):walk(json.loads(p.read_text(encoding='utf-8-sig')))
    passed('versioned-metadata-excludes-private-bodies')
    r.base.write(R/'text-quality.json',dict(mission='RB10',witnesses=quality,noNewOCR=True,noSeparateImageAssets=True,reviewLimit='Integrity and targeted reading, not full critical collation of every word.'))
    r.base.write(R/'verification.json',dict(mission='RB10',checksPassed=True,checkCount=len(checks),checks=checks,extractionReplays=7,
      componentExtractionReplays=26,plannedIntakeRows=planned,dbTouched=False,embeddingLaunched=False,privateBodiesPublished=False,
      originalBytes=sum(a['byteCount'] for a in files),readableDerivativeWords=sum(a['derivedText']['wordCount'] for a in files)))
    print('VERIFIED',len(checks),'checks;',len(files),'extraction replays; no DB writes')
if __name__=='__main__':main()
