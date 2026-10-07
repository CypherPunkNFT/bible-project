"""Verify RB05 immutable evidence, exact slices, holds and read-only intake hints."""
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
R=SITE/'content/library/reports/reformed-baptist-overnight/RB05'
def read(name):return json.loads((R/name).read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    checks=[]
    def passed(kind,**fields):checks.append(dict(kind=kind,passed=True,**fields))
    m=read('acquisition-manifest.json');files=m['files'];by={a['assetId']:a for a in files}
    assert len(files)==len(by)==len({a['url'] for a in files})==len({a['sha256'] for a in files})==8
    assert not m['ingested'] and not m['embedded'] and not m['publicHostingAllowed'] and not m['failures']
    targets={a['url']:a for a in read('targets.json')};assert targets.keys()=={a['url'] for a in files}
    spec=importlib.util.spec_from_file_location('collector',SITE/'scripts/rb05-acquire.py')
    collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)
    for a in files:
        p=SOURCES/a['relativePath']; assert p.resolve().is_relative_to(SOURCES.resolve())
        assert sha(p)==a['sha256'] and p.stat().st_size==a['byteCount']
        assert json.loads(p.with_name('provenance.json').read_text(encoding='utf-8'))==a
        d=SITE/a['derivedText']['path'];assert sha(d)==a['derivedText']['sha256']
        t=d.read_text(encoding='utf-8');assert len(re.findall(r'\b[\w\x27-]+\b',t))==a['derivedText']['wordCount']
        assert collector.extract(p.read_bytes(),targets[a['url']])==t
        assert all(re.search(s,t,re.I) for s in targets[a['url']]['requiredMarkers'])
        assert not a['publicHostingAllowed'] and not a['publicFullTextIndexAllowed']
        if a.get('rightsNoticePdfPages'):
            for pg in a['rightsNoticePdfPages']:
                page=t.split('SOURCE PDF PAGE: '+str(pg)+'\n',1)[1].split('SOURCE PDF PAGE: ',1)[0]
                assert 'permitted' in page.lower() and '1,000' in page and 'reproduce' in page.lower()
            passed('issue-specific-permission-pages',assetId=a['assetId'])
        passed('original-provenance-derivative-and-extraction-replay',assetId=a['assetId'])
    for a in read('holdings-audit.json')['files']:
        assert sha(SOURCES/a['relativePath'])==a['actualSha256']
        if a.get('auditDerivative'):assert sha(SITE/a['auditDerivative']['path'])==a['auditDerivative']['sha256']
        passed('held-original-audit',assetId=a['assetId'])
    works=read('chapter-map.json')['works'];assert len(works)==29
    for w in works:
        p=SOURCES/w['relativePath'];assert sha(p)==w['originalSha256']
        if p.suffix=='.epub':
            with zipfile.ZipFile(p) as z:
                for c in w['locations']:
                    doc=BeautifulSoup(z.read(c['member']),'html.parser');anchor=unquote(c['locator']).partition('#')[2]
                    present=not anchor or doc.find(id=anchor) is not None or doc.find(attrs={'name':anchor}) is not None
                    assert present and c['anchorPresent']
                    passed('held-epub-navigation-target',assetId=w['assetId'],locator=c['locator'])
        else:
            raw=SITE/w['derivative']['path'];assert sha(raw)==w['derivative']['sha256']
            lines=raw.read_text(encoding='utf-8').splitlines()
            for c in w['locations']:
                assert 1<=c['lineStart']<=c['lineEnd']<=len(lines)
                assert lines[c['lineStart']-1].strip()==c['sourceLabel'].strip()
                assert len(re.findall(r'\b[\w\x27-]+\b','\n'.join(lines[c['lineStart']-1:c['lineEnd']])))==c['readableWords']
                passed('exact-article-or-historical-component-locator',assetId=w['assetId'],locator=c['locator'])
    cs=read('selected-components.json')['components'];assert len(cs)==48
    fuller=json.loads((R.parent/'RB04/acquisition-manifest.json').read_text(encoding='utf-8'))
    fuller=next(a for a in fuller['files'] if 'fuller-collected' in a['workId'])
    by_components=by | {fuller['assetId']:fuller}
    fcs=read('fuller-components.json')['components'];assert len(fcs)==5
    cs+=fcs
    end_by={}
    for c in cs:
        a=by_components[c['parentWitnessAssetId']];assert c['originalSha256']==a['sha256'] and c['fullDerivativeSha256']==a['derivedText']['sha256']
        lines=(SITE/a['derivedText']['path']).read_text(encoding='utf-8').splitlines()
        expected='\n'.join(lines[c['lineStart']-1:c['lineEnd']])+'\n';p=SITE/c['componentText']['path']
        assert c['lineStart']>end_by.get(a['assetId'],0);end_by[a['assetId']]=c['lineEnd']
        assert p.read_bytes()==expected.encode('utf-8') and sha(p)==c['componentText']['sha256']
        assert c['componentText']['wordCount']==c['readableWords'] and not c['integrated'] and not c['publicHostingAllowed']
        passed('private-component-exact-source-slice',componentId=c['componentId'])
    scopes={a['assetId']:a for a in read('intake-scope.json')['files']};assert scopes.keys()==by.keys()
    assert sum(bool(a.get('evidenceOnly')) for a in files)==7
    for aid,s in scopes.items():assert s['evidenceOnly']==bool(by[aid]['evidenceOnly']) and s['originalSha256']==by[aid]['sha256']
    assert {aid for w in read('bibliography.json')['works'] for aid in w['assetIds']}==set(by)
    assert all(a['url'] in (SITE/'SOURCES.md').read_text(encoding='utf-8') for a in files)
    passed('source-ledger-bibliography-and-seven-parent-holds')
    forbidden={'firstText','firstPages','fullText','body','chapterContent'}
    def walk(v):
        if isinstance(v,dict):
            assert not forbidden & v.keys()
            for x in v.values():walk(x)
        elif isinstance(v,list):
            for x in v:walk(x)
    for p in R.glob('*.json'):walk(json.loads(p.read_text(encoding='utf-8')))
    passed('versioned-metadata-excludes-private-bodies')
    sys.path.insert(0,str(SITE))
    from knowledge.settings import load
    from knowledge.library import plan_library
    _,_,hints,derivatives,raw=plan_library(load());rows=[]
    for a in files:
        p=(SOURCES/a['relativePath']).resolve();h=hints[str(p)];d=derivatives[str(p)]
        assert p in raw and h['sha256']==a['sha256'] and bool(h.get('evidenceOnly'))==bool(a['evidenceOnly'])
        assert Path(d['path'])==(SITE/a['derivedText']['path']).resolve() and d['sha256']==a['derivedText']['sha256']
        rows.append(dict(assetId=a['assetId'],planned=True,evidenceOnly=bool(h.get('evidenceOnly')),title=h['title']))
    prior=json.loads((R.parent/'RB01/acquisition-manifest.json').read_text(encoding='utf-8'))
    for aid in ['asset-rb01-9d92196f59fd67117d4a','asset-rb01-b0316e24a0234138ae8c']:
        a=next(a for a in prior['files'] if a['assetId']==aid);p=(SOURCES/a['relativePath']).resolve();h=hints[str(p)]
        assert sha(p)==a['sha256'] and h['evidenceOnly'] and h['author']==a['author']
        if '9d9219' in aid:
            assert h['workId']!='work-rb01-dagg-church-order' and 'Stan Reeves' in h['author']
            assert h['rightsCategory']=='modern-editorial-rights-reserved'
        else:assert 'Samson' in h['author']
        assert json.loads(p.with_name('provenance.json').read_text(encoding='utf-8'))==a
        rows.append(dict(assetId=aid,correctionPlanned=True,evidenceOnly=True,title=h['title'],author=h['author']))
    passed('read-only-planner-eight-originals-and-two-prior-attribution-holds')
    result=dict(mission='RB05',checkCount=len(checks),checks=checks,intakePlannerRows=rows,
        dbTouched=False,embeddingLaunched=False,checksPassed=True,collectorExtractionReplays=8)
    (R/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print('VERIFIED',len(checks),'checks; eight extraction replays; read-only planner and corrections; no DB writes')

if __name__=='__main__':main()
