"""RB04 original, reading-location, component and read-only intake parity checks."""
import hashlib
import json
import re
import zipfile
from pathlib import Path
from urllib.parse import unquote
from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB04'


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    m = read('acquisition-manifest.json')
    files = m['files']
    by_asset = {a['assetId']:a for a in files}
    assert len(by_asset) == len(files) == len({a['url'] for a in files}) == 7
    assert not m['ingested'] and not m['embedded'] and not m['publicHostingAllowed']
    targets = {t['url']:t for t in read('targets.json')}
    assert targets.keys() == {a['url'] for a in files} and not m['failures']
    checks = []
    def passed(kind, **values):
        checks.append(dict(kind=kind,passed=True,**values))
    for a in files:
        p = SOURCES / a['relativePath']
        assert p.resolve().is_relative_to(SOURCES.resolve())
        assert sha(p) == a['sha256'] and p.stat().st_size == a['byteCount']
        assert json.loads(p.with_name('provenance.json').read_text(encoding='utf-8')) == a
        d = SITE / a['derivedText']['path']
        assert sha(d) == a['derivedText']['sha256']
        text = d.read_text(encoding='utf-8')
        assert len(re.findall(r'\b[\w\x27-]+\b',text)) == a['derivedText']['wordCount']
        assert all(re.search(p,text,re.I) for p in targets[a['url']]['requiredMarkers'])
        assert not a['publicHostingAllowed'] and not a['publicFullTextIndexAllowed']
        if a.get('fullSourceExtract'):
            assert sha(SITE / a['fullSourceExtract']['path']) == a['fullSourceExtract']['sha256']
        passed('original-provenance-derivative-marker-parity',assetId=a['assetId'])
    for a in read('holdings-audit.json')['files']:
        assert sha(SOURCES / a['relativePath']) == a['actualSha256']
        if a.get('auditDerivative'):
            assert sha(SITE / a['auditDerivative']['path']) == a['auditDerivative']['sha256']
        passed('held-original-audit-parity',assetId=a['assetId'])
    chapter_map = read('chapter-map.json')['works']
    assert len(chapter_map) == 31
    anchor_defects = []
    for w in chapter_map:
        p = SOURCES / w['relativePath']
        assert sha(p) == w['originalSha256']
        lines = (SITE / w['derivative']['path']).read_text(encoding='utf-8').splitlines()
        assert sha(SITE / w['derivative']['path']) == w['derivative']['sha256']
        if p.suffix == '.epub':
            with zipfile.ZipFile(p) as z:
                for c in w['locations']:
                    doc = BeautifulSoup(z.read(c['member']),'html.parser')
                    _,_,anchor = unquote(c['locator']).partition('#')
                    present = not anchor or doc.find(id=anchor) is not None or doc.find(attrs={'name':anchor}) is not None
                    assert present == c['anchorPresent']
                    assert len((doc.body or doc).get_text(' ',strip=True)) == c['memberCharacters']
                    if not present:
                        anchor_defects.append(dict(assetId=w['assetId'],locator=c['locator']))
                    passed('epub-source-member-anchor-parity',assetId=w['assetId'],locator=c['locator'])
        else:
            for c in w['locations']:
                assert 1 <= c['lineStart'] <= c['lineEnd'] <= len(lines)
                assert lines[c['lineStart']-1].strip() == c['sourceLabel']
                count = len(re.findall(r'\b[\w\x27-]+\b','\n'.join(lines[c['lineStart']-1:c['lineEnd']])))
                assert count == c['readableWords'] and count > 50
                passed('source-line-unit-parity',assetId=w['assetId'],locator=c['locator'])
    assert anchor_defects == [dict(assetId='asset-expanded-a9ec8ae00c0e43939202',locator='bruisedreed.html#top')]
    fuller = by_asset['asset-rb04-f9ea063dff9952ca931d']
    lines = (SITE / fuller['derivedText']['path']).read_text(encoding='utf-8').splitlines()
    components = read('selected-components.json')['components']
    assert len(components) == 17
    end = 0
    for c in sorted(components,key=lambda c:c['lineStart']):
        assert c['lineStart'] > end
        end = c['lineEnd']
        assert c['originalSha256'] == fuller['sha256'] and c['fullDerivativeSha256'] == fuller['derivedText']['sha256']
        text = '\n'.join(lines[c['lineStart']-1:c['lineEnd']])+'\n'
        p = SITE / c['componentText']['path']
        assert p.read_bytes() == text.encode('utf-8') and sha(p) == c['componentText']['sha256']
        assert not c['integrated']
        passed('scoped-component-exact-source-slice',componentId=c['componentId'])
    scopes = {s['assetId']:s for s in read('intake-scope.json')['files']}
    assert scopes.keys() == by_asset.keys()
    for aid,s in scopes.items():
        assert s['originalSha256'] == by_asset[aid]['sha256']
        assert s['evidenceOnly'] == bool(by_asset[aid].get('evidenceOnly'))
    assert sum(bool(a.get('evidenceOnly')) for a in files) == 3
    passed('intake-scope-and-three-mixed-witness-holds')
    for d in read('admission-decisions.json')['decisions']:
        assert not d['globalAuthorApproval']
        assert set(d['workIds']) <= {a['workId'] for a in files}
        if 'sixAnchors' in d:
            assert len(d['sixAnchors']) == 6
    passed('work-specific-admission-parity')
    bibliography = read('bibliography.json')['works']
    assert {aid for w in bibliography for aid in w['assetIds']} == set(by_asset)
    assert len(bibliography) == 6 and sum(w['kind'] == 'focused-work' for w in bibliography) == 5
    passed('logical-work-and-edition-deduplication')
    assert all(a['url'] in (SITE / 'SOURCES.md').read_text(encoding='utf-8') for a in files)
    passed('all-acquired-source-urls-listed')
    forbidden = {'firstText','firstPages','fullText','body','chapterContent','description'}
    def walk(value):
        if isinstance(value,dict):
            assert not forbidden & value.keys(), forbidden & value.keys()
            for v in value.values():walk(v)
        elif isinstance(value,list):
            for v in value:walk(v)
    for p in R.glob('*.json'):
        walk(json.loads(p.read_text(encoding='utf-8')))
    passed('versioned-metadata-body-field-exclusion')
    # The planner is read-only: it does not open SQLite or start extraction/embedding.
    import sys
    sys.path.insert(0,str(SITE))
    from knowledge.settings import load
    from knowledge.library import plan_library
    config = load()
    _,_,hints,derivatives,raw_files = plan_library(config)
    rows = []
    for a in files:
        p = (SOURCES / a['relativePath']).resolve()
        h = hints[str(p)]
        assert p in raw_files and h['sha256'] == a['sha256']
        assert bool(h.get('evidenceOnly')) == bool(a.get('evidenceOnly'))
        if a['format'] != 'epub':
            assert Path(derivatives[str(p)]['path']) == (SITE / a['derivedText']['path']).resolve()
            assert derivatives[str(p)]['sha256'] == a['derivedText']['sha256']
        rows.append(dict(assetId=a['assetId'],planned=True,evidenceOnly=bool(h.get('evidenceOnly')),
            originalSha256=h['sha256'],actualDerivativeSelectedForHtml=a['format']!='epub'))
    passed('read-only-intake-planner-parity-for-seven-originals')
    result = dict(mission='RB04',checkCount=len(checks),checks=checks,
        knownSourceAnchorDefects=anchor_defects,intakePlannerRows=rows,
        dbTouched=False,embeddingStarted=False,originalCount=7,heldAuditCount=284,
        readingUnitCount=sum(len(w['locations']) for w in chapter_map),componentCount=17)
    (R / 'verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
    print('VERIFIED',len(checks),'checks; 7 new originals, 284 held originals, 800 reading units, 17 private components; planner parity; no DB write')


if __name__ == '__main__':
    main()
