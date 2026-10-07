"""Meaningful RB08 immutable source, locator, replay and read-only planner checks."""
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
R=SITE/'content/library/reports/reformed-baptist-overnight/RB08'
def read(name):return json.loads((R/name).read_text(encoding='utf-8'))
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
    checks=[]
    def passed(kind,**fields):checks.append(dict(kind=kind,passed=True,**fields))
    spec=importlib.util.spec_from_file_location('collector',SITE/'scripts/rb08-acquire.py')
    r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
    files=read('acquisition-manifest.json')['files'];assert len(files)==17
    targets={t['url']:t for t in read('targets.json')}
    assert {a['format'] for a in files}=={'html','pdf'}
    quality=[]
    for a in files:
        original=SOURCES/a['relativePath'];raw=original.read_bytes()
        assert sha(raw)==a['sha256'] and len(raw)==a['byteCount']
        provenance=json.loads(original.with_name('provenance.json').read_text(encoding='utf-8'))
        assert provenance==a
        d=a['derivedText'];p=SITE/d['path'];text=p.read_text(encoding='utf-8')
        assert sha(p.read_bytes())==d['sha256']
        assert r.extract(raw,targets[a['url']])==text
        assert len(re.findall(r"\b[\w'-]+\b",text))==d['wordCount']
        assert all(re.search(m,text,re.I) for m in targets[a['url']]['requiredMarkers'])
        assert a['evidenceOnly'] and a['theologicalEligibility']=='eligible-within-declared-subject-scope'
        assert not a['publicHostingAllowed'] and not a['publicFullTextIndexAllowed']
        if a['format']=='html':
            doc=r.base.soup(raw);assert len(doc.select(a['selector']))==1
            assert 'Related Articles' not in text and 'Leave a Reply' not in text
        else:
            import pymupdf
            with pymupdf.open(stream=raw,filetype='pdf') as pdf:
                pages=20 if a['workId']=='work-rb08-kruger-definition-canon' else 19
                assert len(pdf)==pages and all(len(p.get_text().strip())>1000 for p in pdf)
        quality.append(dict(assetId=a['assetId'],replacementCharacters=text.count('\ufffd'),
            readableWords=d['wordCount'],ocrPerformed=False,imageAssetsAcquired=False,
            quality='Complete offered main text structurally replayed; no critical-edition or Greek/font collation claimed.'))
        passed('original-provenance-derivative-extraction-and-main-body',assetId=a['assetId'])
    assert not any(q['replacementCharacters'] for q in quality)
    held=read('holdings-audit.json')['files'];assert len(held)==631
    assert not {a['sha256'] for a in files}&{a['actualSha256'] for a in held}
    for a in held:
        assert sha((SOURCES/a['relativePath']).read_bytes())==a['actualSha256']
        if a.get('auditDerivative'):assert sha((SITE/a['auditDerivative']['path']).read_bytes())==a['auditDerivative']['sha256']
        passed('actual-held-original-hash',assetId=a['assetId'])
    data=read('chapter-map.json');works=data['works'];assert len(works)==25
    assert data['unitCount']==sum(len(w['locations']) for w in works)==244
    by={w['assetId']:w for w in works}
    for w in works:
        assert sha((SOURCES/w['relativePath']).read_bytes())==w['originalSha256']
        assert sha((SITE/w['derivative']['path']).read_bytes())==w['derivative']['sha256']
        if w['relativePath'].endswith('.epub'):
            with zipfile.ZipFile(SOURCES/w['relativePath']) as z:
                for u in w['locations']:
                    doc=BeautifulSoup(z.read(u['member']),'html.parser')
                    anchor=unquote(u['locator']).partition('#')[2]
                    assert not anchor or doc.find(id=anchor) is not None or doc.find(attrs={'name':anchor}) is not None
                    assert u['anchorPresent']
                    passed('actual-epub-member-and-anchor',assetId=w['assetId'],locator=u['locator'])
        else:
            ls=(SITE/w['derivative']['path']).read_text(encoding='utf-8').splitlines()
            for u in w['locations']:
                assert 1<=u['lineStart']<=u['lineEnd']<=len(ls)
                assert ls[u['lineStart']-1]==u['sourceLabel']
                passed('edition-specific-line-range',assetId=w['assetId'],locator=u['locator'])
    assert by['asset-ready-library-33fd336f7c903f317e66']['locations'][0]['lineStart']==86
    routes=read('reading-paths.json')['paths'];assert len(routes)==10
    for p in routes:
        assert p['purpose'] and p['limitations'] and not p['inferredFromVectors']
        for e in p['entries']:
            assert e['originalSha256']==by[e['assetId']]['originalSha256']
            valid={u['locator'] for u in by[e['assetId']]['locations']}
            assert all(u['locator'] in valid for u in e['locations'])
        passed('question-to-witness-locations',question=p['question'])
    scopes=read('intake-scope.json')['files'];assert len(scopes)==17
    assert all(s['evidenceOnly'] and not s['eligibleForScopedIntake'] and not s['integrated'] for s in scopes)
    claims=read('claim-evidence.json')['claims'];assert len(claims)==7
    for c in claims:
        assert c['attributedClaim'] and not c['semanticInference'] and not c['coreTeachingApproved']
        for e in c['entries']:
            assert e['originalSha256']==by[e['assetId']]['originalSha256']
            assert all(u['locator'] in {v['locator'] for v in by[e['assetId']]['locations']} for u in e['locations'])
    passed('seven-attributed-work-arguments-with-exact-evidence')
    # A metadata bibliography can be planned without granting full-body intake.
    sys.path.insert(0,str(SITE))
    from knowledge.settings import load
    from knowledge.library import plan_library
    _,_,hints,derivatives,originals=plan_library(load())
    planned=[]
    for a in files:
        p=(SOURCES/a['relativePath']).resolve();h=hints[str(p)];d=derivatives[str(p)]
        assert p in originals and h['sha256']==a['sha256'] and h['evidenceOnly']
        assert Path(d['path'])==(SITE/a['derivedText']['path']).resolve() and d['sha256']==a['derivedText']['sha256']
        planned.append(dict(assetId=a['assetId'],evidenceOnly=True,planned=True))
    passed('read-only-intake-planner-seventeen-held-parents')
    def walk(x):
        if isinstance(x,dict):
            assert not {'firstText','firstPages','fullText','body','chapterContent'}&x.keys()
            for v in x.values():walk(v)
        elif isinstance(x,list):
            for v in x:walk(v)
    for p in R.glob('*.json'):walk(json.loads(p.read_text(encoding='utf-8')))
    passed('versioned-metadata-does-not-contain-private-bodies')
    r.base.write(R/'text-quality.json',dict(mission='RB08',witnesses=quality,noNewOCR=True,noImages=True))
    r.base.write(R/'verification.json',dict(mission='RB08',checksPassed=True,checkCount=len(checks),checks=checks,
        extractionReplays=17,plannedIntakeRows=planned,dbTouched=False,embeddingLaunched=False,privateBodiesPublished=False,
        originalBytes=sum(a['byteCount'] for a in files),readableDerivativeWords=sum(a['derivedText']['wordCount'] for a in files)))
    print('VERIFIED',len(checks),'checks;',len(files),'extraction replays; no DB writes')

if __name__=='__main__':main()
