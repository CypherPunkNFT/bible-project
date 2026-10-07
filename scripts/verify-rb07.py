"""Read-only RB07 integrity, location, overlap and intake-planner verification."""
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
R=SITE/'content/library/reports/reformed-baptist-overnight/RB07'


def read(name):
    return json.loads((R/name).read_text(encoding='utf-8'))


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    checks=[]
    def passed(kind,**fields):
        checks.append(dict(kind=kind,passed=True,**fields))
    spec=importlib.util.spec_from_file_location('rb07collector',SITE/'scripts/rb07-acquire.py')
    collector=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(collector)
    files=read('acquisition-manifest.json')['files']
    targets={a['url']:a for a in read('targets.json')}
    by={a['assetId']:a for a in files}
    assert len(files)==len(by)==7
    assert {a['format'] for a in files}<={'txt','html'}
    for a in files:
        p=SOURCES/a['relativePath'];raw=p.read_bytes()
        assert sha(raw)==a['sha256'] and len(raw)==a['byteCount']
        prov=json.loads((p.parent/'provenance.json').read_text(encoding='utf-8'))
        assert prov==a
        d=SITE/a['derivedText']['path'];derivative=d.read_bytes()
        assert sha(derivative)==a['derivedText']['sha256']
        # Immutable derivative bytes may retain Windows CRLF. Replay compares
        # normalized textual content while both byte hashes remain checked.
        t=d.read_text(encoding='utf-8')
        assert len(re.findall(r"\b[\w'-]+\b",t))==a['derivedText']['wordCount']
        assert collector.extract(raw,targets[a['url']])==t
        assert all(re.search(s,t,re.I) for s in targets[a['url']]['requiredMarkers'])
        assert a['evidenceOnly'] and not a['publicHostingAllowed'] and not a['publicFullTextIndexAllowed']
        assert a['rightsEvidence'] and a['retrievedAt']
        passed('text-original-provenance-and-extraction-replay',assetId=a['assetId'])
    held=read('holdings-audit.json')['files']
    assert len(held)==12
    assert not {a['sha256'] for a in files}&{a['actualSha256'] for a in held}
    for a in held:
        assert sha((SOURCES/a['relativePath']).read_bytes())==a['actualSha256']
        d=a.get('auditDerivative')
        if d:
            assert sha((SITE/d['path']).read_bytes())==d['sha256']
        passed('audited-held-original-and-private-derivative',assetId=a['assetId'])
    wdata=read('chapter-map.json');works=wdata['works'];wb={w['assetId']:w for w in works}
    assert len(works)==len(wb)==11
    assert wdata['unitCount']==sum(len(w['locations']) for w in works)==198
    assert sum(w['status']=='new-witness' for w in works)==7
    for w in works:
        p=SOURCES/w['relativePath']
        assert sha(p.read_bytes())==w['originalSha256']
        assert sha((SITE/w['derivative']['path']).read_bytes())==w['derivative']['sha256']
        if p.suffix=='.epub':
            with zipfile.ZipFile(p) as z:
                for u in w['locations']:
                    doc=BeautifulSoup(z.read(u['member']),'html.parser')
                    anchor=unquote(u['locator']).partition('#')[2]
                    assert not anchor or doc.find(id=anchor) is not None or doc.find(attrs={'name':anchor}) is not None
                    assert u['anchorPresent']
                    passed('held-epub-member-and-anchor',assetId=w['assetId'],locator=u['locator'])
        else:
            lines=(SITE/w['derivative']['path']).read_text(encoding='utf-8').splitlines()
            for u in w['locations']:
                assert 1<=u['lineStart']<=u['lineEnd']<=len(lines)
                assert lines[u['lineStart']-1]==u['sourceLabel']
                assert u['locator']==f"derivative-lines:{u['lineStart']}-{u['lineEnd']}"
                for note in u.get('sourceNotes',[]):
                    assert 12638<=note['lineStart']<=note['lineEnd']<=12833
                    assert lines[note['lineStart']-1].startswith(note['marker'])
                passed('edition-specific-line-location',assetId=w['assetId'],locator=u['locator'])
    cs=read('selected-components.json')['components'];cb={c['componentId']:c for c in cs}
    assert len(cs)==len(cb)==69
    assert not any(c['integrated'] or c['eligibleForScopedIntake'] or c['publicHostingAllowed'] for c in cs)
    for c in cs:
        w=wb[c['parentWitnessAssetId']]
        assert c['originalSha256']==w['originalSha256']
        assert c['fullDerivativeSha256']==w['derivative']['sha256']
        ls=(SITE/w['derivative']['path']).read_text(encoding='utf-8').splitlines()
        expected=('\n'.join(ls[c['lineStart']-1:c['lineEnd']])+'\n').encode('utf-8')
        raw=(SITE/c['componentText']['path']).read_bytes()
        assert raw==expected and sha(raw)==c['componentText']['sha256']
        assert len(re.findall(r"\b[\w'-]+\b",raw.decode('utf-8')))==c['componentText']['wordCount']
        passed('private-component-exact-source-replay-and-hold',componentId=c['componentId'])
    docs=read('document-map.json')['documents'];assert len(docs)==29
    for d in docs:
        w=wb[d['assetId']]
        assert d['originalSha256']==w['originalSha256'] and (d['date'] or d['recipient'])
        assert any(u['locator']==d['locator'] and u['title']==d['title'] for u in w['locations'])
        passed('source-attested-selected-document-record',assetId=d['assetId'],locator=d['locator'])
    routes=read('reading-paths.json')['paths'];assert len(routes)==10
    for p in routes:
        assert p['purpose'] and p['limitations'] and not p['inferredFromVectors']
        for e in p['entries']:
            w=wb[e['assetId']];assert e['originalSha256']==w['originalSha256']
            assert all(any(u['locator']==v['locator'] and u['title']==v['title'] for v in w['locations']) for u in e['readingUnits'])
        passed('study-path-resolves-to-hashed-original',question=p['question'])
    scopes={a['assetId']:a for a in read('intake-scope.json')['files']}
    assert scopes.keys()==by.keys()
    assert all(s['evidenceOnly'] and not s['integrated'] and not s['coreTeachingApproved'] and s['originalSha256']==by[aid]['sha256'] for aid,s in scopes.items())
    assert {aid for w in read('bibliography.json')['works'] for aid in w['assetIds']}==set(by)
    assert all(a['url'] in (SITE/'SOURCES.md').read_text(encoding='utf-8') for a in files)
    passed('seven-source-ledger-bibliography-and-parent-holds')
    overlaps=read('work-overlaps.json');assert len(overlaps['comparisons'])==10 and not overlaps['dbTouched']
    for row in overlaps['comparisons']:
        c=cb[row['componentId']];w=wb[row['targetAssetId']]
        assert row['sourceOriginalSha256']==c['originalSha256'] and row['sourceTextSha256']==c['componentText']['sha256']
        assert row['targetOriginalSha256']==w['originalSha256'] and row['targetTextSha256']==w['derivative']['sha256']
        assert 0<=row['matchedShingles']<=row['distinctEightWordShingles']
        assert row['lexicalCoverage']==round(row['matchedShingles']/max(1,row['distinctEightWordShingles']),4)
    passed('ten-source-hashed-overlap-comparisons')
    forbidden={'firstText','firstPages','fullText','body','chapterContent','description'}
    def walk(v):
        if isinstance(v,dict):
            assert not forbidden&v.keys(),forbidden&v.keys()
            for x in v.values():walk(x)
        elif isinstance(v,list):
            for x in v:walk(x)
    for p in R.glob('*.json'):
        walk(json.loads(p.read_text(encoding='utf-8')))
    passed('versioned-metadata-excludes-private-bodies')
    sys.path.insert(0,str(SITE))
    from knowledge.settings import load
    from knowledge.library import plan_library
    _,_,hints,derivatives,originals=plan_library(load())
    planned=[]
    for a in files:
        p=(SOURCES/a['relativePath']).resolve();h,d=hints[str(p)],derivatives[str(p)]
        assert p in originals and h['sha256']==a['sha256'] and h['evidenceOnly']
        assert Path(d['path'])==(SITE/a['derivedText']['path']).resolve() and d['sha256']==a['derivedText']['sha256']
        planned.append(dict(assetId=a['assetId'],planned=True,evidenceOnly=True,title=h['title']))
    passed('read-only-intake-planner-seven-originals-held')
    result=dict(mission='RB07',checksPassed=True,checkCount=len(checks),checks=checks,extractionReplays=7,
        plannedIntakeRows=planned,originalBytes=sum(a['byteCount'] for a in files),
        readableDerivativeWords=sum(a['derivedText']['wordCount'] for a in files),
        countRule='Words include overlapping editions, editor material and unselected/partial sections; not unique admitted words.',
        dbTouched=False,embeddingLaunched=False,privateBodiesPublished=False)
    (R/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print('VERIFIED',len(checks),'checks; seven extraction replays; exact components, tables and read-only planner holds')


if __name__=='__main__':
    main()
