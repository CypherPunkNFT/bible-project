"""Verify RB09 immutable sources, extraction replay, locators and intake holds."""
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
R=SITE/'content/library/reports/reformed-baptist-overnight/RB09'
def read(name):return json.loads((R/name).read_text(encoding='utf-8'))
def sha(raw):return hashlib.sha256(raw).hexdigest()
def main():
    checks=[]
    def passed(kind,**kw):checks.append(dict(kind=kind,passed=True,**kw))
    sp=importlib.util.spec_from_file_location('collector',SITE/'scripts/rb09-acquire.py')
    r=importlib.util.module_from_spec(sp);sp.loader.exec_module(r)
    files=read('acquisition-manifest.json')['files'];assert len(files)==13
    targets={a['url']:a for a in read('targets.json')}
    quality=[]
    for a in files:
        p=(SOURCES/a['relativePath']).resolve();assert p.is_relative_to(SOURCES.resolve())
        raw=p.read_bytes();assert sha(raw)==a['sha256'] and len(raw)==a['byteCount']
        assert json.loads(p.with_name('provenance.json').read_text(encoding='utf-8'))==a
        d=a['derivedText'];rawtext=(SITE/d['path']).read_bytes();assert sha(rawtext)==d['sha256']
        t=(SITE/d['path']).read_text(encoding='utf-8')
        assert r.extract(raw,targets[a['url']])==t
        assert len(re.findall(r"\b[\w'-]+\b",t))==d['wordCount']>=targets[a['url']]['minimumWords']
        assert all(re.search(m,t,re.I) for m in targets[a['url']]['requiredMarkers'])
        assert a['evidenceOnly'] and a['theologicalEligibility']=='eligible-within-declared-subject-scope'
        assert not a['publicHostingAllowed'] and not a['publicFullTextIndexAllowed']
        q=dict(assetId=a['assetId'],words=d['wordCount'],replacementCharacters=t.count('\ufffd'),ocrPerformed=False,imageAssetsAcquired=False)
        if a['format']=='html':
            doc=r.base.soup(raw);assert len(doc.select(a['selector']))==1
            assert 'Share this:' not in t and 'Follow Tom Ascol:' not in t and 'Leave a Reply' not in t
            assert q['replacementCharacters']==0
            q['quality']='Complete selected written body replayed; no unrelated navigation/comments/social controls.'
        else:
            import pymupdf
            with pymupdf.open(stream=raw,filetype='pdf') as pdf:
                texts=[p.get_text() for p in pdf]
                assert len(pdf)==a['expectedSourcePdfPages']
                assert len([t for t in texts if len(t.strip())>500])>len(pdf)*.70
                bad=[dict(sourcePdfPage=i+1,count=t.count('\ufffd')) for i,t in enumerate(texts) if '\ufffd' in t]
                if 'reading-word' in a['workId']:assert {x['sourcePdfPage'] for x in bad}=={8,9,10,12,13}
                elif 'interpreting-eden' in a['workId']:
                    assert all(x['sourcePdfPage']<=13 or x['sourcePdfPage']>=384 for x in bad)
                else:
                    # The unmapped glyph is a leading section bullet, not an
                    # inferred letter. Keep the exact extraction unchanged.
                    assert all(not line.strip() or line.lstrip().startswith('\ufffd')
                        for page in texts for line in page.splitlines() if '\ufffd' in line)
                q.update(sourcePages=len(pdf),substantialTextPages=len([t for t in texts if len(t.strip())>500]),
                  replacementPages=bad,quality=('Existing prose text; decorative leader/section-bullet mapping defects preserved and located, no invented repairs.' if bad else 'Existing prose text on every article page; zero replacement characters, no OCR or glyph repairs.'))
        quality.append(q);passed('immutable-original-provenance-and-extraction-replay',assetId=a['assetId'])
    assert sum(a['format']=='html' for a in files)==8 and sum(a['format']=='pdf' for a in files)==5
    held=read('holdings-audit.json')['files'];assert len(held)==819
    assert not {a['sha256'] for a in files}&{a['actualSha256'] for a in held}
    for a in held:
        assert sha((SOURCES/a['relativePath']).read_bytes())==a['actualSha256']
        if a.get('auditDerivative'):assert sha((SITE/a['auditDerivative']['path']).read_bytes())==a['auditDerivative']['sha256']
        passed('actual-held-original-hash',assetId=a['assetId'])
    contextual=read('contextual-holdings-audit.json');assert len(contextual['files'])==3 and contextual['newDownloads']==0
    for a in contextual['files']:
        raw=(SOURCES/a['relativePath']).read_bytes()
        assert sha(raw)==a['actualSha256'] and len(raw)==a['byteCount']
        assert a['role']=='historical-outside-bible-context-not-approved-Christian-doctrine'
        passed('supplementary-held-historical-original-not-doctrinal-admission',title=a['title'])
    data=read('chapter-map.json');works=data['works'];assert len(works)==25
    assert data['unitCount']==sum(len(w['locations']) for w in works)==2007
    by={w['assetId']:w for w in works};locations={}
    for w in works:
        assert sha((SOURCES/w['relativePath']).read_bytes())==w['originalSha256']
        assert sha((SITE/w['derivative']['path']).read_bytes())==w['derivative']['sha256']
        ls=(SITE/w['derivative']['path']).read_text(encoding='utf-8').splitlines()
        for u in w['locations']:
            locations.setdefault(w['assetId'],{})[u['locator']]=u
            if w['relativePath'].endswith('.epub'):
                with zipfile.ZipFile(SOURCES/w['relativePath']) as z:
                    assert u['member'] in z.namelist()
                    doc=BeautifulSoup(z.read(u['member']),'html.parser')
                    anchor=unquote(u['locator']).partition('#')[2]
                    exists=not anchor or doc.find(id=anchor) is not None or doc.find(attrs={'name':anchor}) is not None
                    assert exists==u['anchorPresent']
                    passed('actual-existing-epub-member-and-reported-anchor',assetId=w['assetId'],locator=u['locator'])
            else:
                assert 1<=u['lineStart']<=u['lineEnd']<=len(ls)
                assert ls[u['lineStart']-1]==u['sourceLabel']
                if u.get('sourcePdfPageStart'):
                    assert u['sourcePdfPageStart']==u['printedPageStart']+w['printedPageOffset']
                    assert u['sourcePdfPageEnd']==u['printedPageEnd']+w['printedPageOffset']
                    assert ls[u['lineStart']-1]=='SOURCE PDF PAGE: '+str(u['sourcePdfPageStart'])
                passed('exact-source-line-or-pdf-page-range',assetId=w['assetId'],locator=u['locator'])
    def entry(e):
        assert e['originalSha256']==by[e['assetId']]['originalSha256']
        assert e['locations'] and all(u['locator'] in locations[e['assetId']] for u in e['locations'])
    routes=read('reading-paths.json')['paths'];assert len(routes)==13
    for p in routes:
        assert p['purpose'] and p['limitations'] and not p['inferredFromVectors']
        for e in p['entries']:entry(e)
        passed('study-question-to-exact-source-locations',question=p['question'])
    coverage=read('passage-coverage.json')['entries'];assert len(coverage)==85
    for c in coverage:
        assert c['coverageKind'] and c['limitations'] and not c['semanticInference'];entry(c['entry'])
        passed('qualified-passage-to-source-section',passage=c['passage'])
    # Check three sustained verse examples against both chapter title and prose.
    for title,needle in [('33 Proverbs 10:1','Proverbs 10:1'),('34 Psalm 4:8','Psalm 4:8'),('35 Amos 1:3','Amos 1:3')]:
        w=next(w for w in works if w['workId']=='work-rb09-poythress-reading-word')
        u=next(u for u in w['locations'] if u['title']==title)
        ls=(SITE/w['derivative']['path']).read_text(encoding='utf-8').splitlines()
        assert needle in '\n'.join(ls[u['lineStart']-1:u['lineEnd']])
    passed('three-actual-sustained-examples-not-index-only')
    scopes=read('intake-scope.json')['files'];assert len(scopes)==13
    assert all(s['evidenceOnly'] and not s['eligibleForScopedIntake'] and not s['integrated'] for s in scopes)
    decisions=read('theological-decisions.json');assert len(decisions['decisions'])==5 and not decisions['globalAuthorApproval']
    for d in decisions['decisions']:
        assert len(d['sixAnchors'])==6 and d['limits'] and d['evidence']
        for e in d['evidence']:
            raw,m=r.base.fetch(e['url'])
            assert sha(raw)==e['sha256'] and m['sha256']==e['sha256']
    passed('primary-source-theological-and-personal-use-evidence')
    sys.path.insert(0,str(SITE))
    from knowledge.settings import load
    from knowledge.library import plan_library
    _,_,hints,derivatives,originals=plan_library(load());planned=[]
    for a in files:
        p=(SOURCES/a['relativePath']).resolve();assert p in originals
        assert hints[str(p)]['evidenceOnly'] and hints[str(p)]['sha256']==a['sha256']
        assert derivatives[str(p)]['sha256']==a['derivedText']['sha256']
        planned.append(dict(assetId=a['assetId'],evidenceOnly=True,planned=True))
    passed('read-only-intake-planner-thirteen-held-parents')
    def walk(x):
        if isinstance(x,dict):
            assert not {'firstText','firstPages','fullText','body','chapterContent'}&x.keys()
            for v in x.values():walk(v)
        elif isinstance(x,list):
            for v in x:walk(v)
    for p in R.glob('*.json'):walk(json.loads(p.read_text(encoding='utf-8')))
    passed('versioned-metadata-excludes-private-bodies')
    r.base.write(R/'text-quality.json',dict(mission='RB09',witnesses=quality,noNewOCR=True,noSeparateImageAssets=True,
      qualityLimit='Typography, decorative PDF leaders/bullets and diagrams are not a critical-edition collation; no invented glyph repairs.'))
    r.base.write(R/'verification.json',dict(mission='RB09',checksPassed=True,checkCount=len(checks),checks=checks,
      extractionReplays=len(files),plannedIntakeRows=planned,dbTouched=False,embeddingLaunched=False,privateBodiesPublished=False,
      originalBytes=sum(a['byteCount'] for a in files),readableDerivativeWords=sum(a['derivedText']['wordCount'] for a in files)))
    print('VERIFIED',len(checks),'checks;',len(files),'extraction replays; no DB writes')
if __name__=='__main__':main()
