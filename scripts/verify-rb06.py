"""Verify RB06 original bytes, extraction replay, reading targets and intake holds."""
import hashlib
import importlib.util
import json
import re
import sys
import zipfile
from pathlib import Path
from urllib.parse import unquote
from xml.etree import ElementTree as ET

from bs4 import BeautifulSoup
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB06'


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    checks = []
    def passed(kind, **fields):
        checks.append(dict(kind=kind, passed=True, **fields))
    m = read('acquisition-manifest.json')
    files = m['files']
    by = {a['assetId']: a for a in files}
    assert len(files) == len(by) == len({a['url'] for a in files}) == len({a['sha256'] for a in files}) == 6
    assert not m['failures'] and not m['ingested'] and not m['embedded'] and not m['publicHostingAllowed']
    targets = {a['url']: a for a in read('targets.json')}
    assert targets.keys() == {a['url'] for a in files}
    spec = importlib.util.spec_from_file_location('rb06collector', SITE / 'scripts/rb06-acquire.py')
    collector = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(collector)
    for a in files:
        p = SOURCES / a['relativePath']
        assert p.resolve().is_relative_to(SOURCES.resolve())
        assert sha(p.read_bytes()) == a['sha256'] and p.stat().st_size == a['byteCount']
        assert json.loads(p.with_name('provenance.json').read_text(encoding='utf-8')) == a
        d = SITE / a['derivedText']['path']
        assert sha(d.read_bytes()) == a['derivedText']['sha256']
        t = d.read_text(encoding='utf-8')
        assert len(re.findall(r'\b[\w\x27-]+\b', t)) == a['derivedText']['wordCount']
        assert collector.extract(p.read_bytes(), targets[a['url']]) == t
        assert all(re.search(s, t, re.I) for s in targets[a['url']]['requiredMarkers'])
        assert a['evidenceOnly'] and not a['publicHostingAllowed'] and not a['publicFullTextIndexAllowed']
        assert a['rightsEvidence'] and a['retrievedAt']
        if a['format'] == 'pdf':
            pages = re.findall(r'^SOURCE PDF PAGE: (\d+)$', t, re.M)
            assert [int(s) for s in pages] == list(range(1, 48))
            for pg in [9, 12, 15, 17, 21, 26, 30, 34, 38, 41, 44, 47]:
                part = t.split('SOURCE PDF PAGE: ' + str(pg) + '\n', 1)[1].split('SOURCE PDF PAGE: ', 1)[0]
                assert 'Permissions:' in part and '1,000 physical copies' in part and 'do not alter' in part
            passed('offered-pdf47-pages-and-twelve-issue-permission-notices', assetId=a['assetId'])
        passed('immutable-original-provenance-and-extraction-replay', assetId=a['assetId'])
    held = read('holdings-audit.json')['files']
    assert len(held) >= 944
    assert not {a['sha256'] for a in files} & {a['actualSha256'] for a in held}
    for a in held:
        assert sha((SOURCES / a['relativePath']).read_bytes()) == a['actualSha256']
        if a.get('auditDerivative'):
            assert sha((SITE / a['auditDerivative']['path']).read_bytes()) == a['auditDerivative']['sha256']
        passed('audited-held-original-and-private-derivative', assetId=a['assetId'])
    wdata = read('chapter-map.json')
    works = wdata['works']
    wb = {w['assetId']: w for w in works}
    assert len(works) == len(wb) == 29
    assert wdata['unitCount'] == sum(len(w['locations']) for w in works) >= 581
    assert sum(w['status'] == 'new-witness' for w in works) == 6
    for w in works:
        p = SOURCES / w['relativePath']
        assert sha(p.read_bytes()) == w['originalSha256']
        if p.suffix == '.epub':
            with zipfile.ZipFile(p) as z:
                for c in w['locations']:
                    doc = BeautifulSoup(z.read(c['member']), 'html.parser')
                    anchor = unquote(c['locator']).partition('#')[2]
                    present = not anchor or doc.find(id=anchor) is not None or doc.find(attrs={'name': anchor}) is not None
                    assert present and c['anchorPresent']
                    passed('source-epub-member-and-anchor', assetId=w['assetId'], locator=c['locator'])
        elif p.suffix == '.xml':
            ids = {e.attrib['id'] for e in ET.fromstring(p.read_bytes()).iter() if 'id' in e.attrib}
            for c in w['locations']:
                assert c['xmlId'] in ids and c['locator'] == 'xml-id:' + c['xmlId']
                passed('source-xml-id', assetId=w['assetId'], locator=c['locator'])
        elif p.suffix == '.pdf':
            lines = (SITE / w['derivative']['path']).read_text(encoding='utf-8').splitlines()
            for c in w['locations']:
                assert 1 <= c['lineStart'] <= c['lineEnd'] <= len(lines)
                assert lines[c['lineStart'] - 1] == c['sourceLabel']
                assert c['pdfPageEnd'] < 39
                passed('exact-counseling-article-page-and-line-range', assetId=w['assetId'], locator=c['locator'])
        else:
            raise AssertionError(p)
    components = read('selected-components.json')['components']
    assert len(components) == len({c['componentId'] for c in components}) == 52
    assert not any(c['integrated'] or c['eligibleForScopedIntake'] or c['publicHostingAllowed'] for c in components)
    for c in components:
        a = by[c['parentWitnessAssetId']]
        assert c['originalSha256'] == a['sha256']
        if c.get('member'):
            with zipfile.ZipFile(SOURCES / a['relativePath']) as z:
                raw = z.read(c['member'])
                assert sha(raw) == c['memberSha256']
                soup = BeautifulSoup(raw, 'html.parser')
                expected = (soup.body or soup).get_text('\n', strip=True) + '\n'
        else:
            assert c['fullDerivativeSha256'] == a['derivedText']['sha256']
            lines = (SITE / a['derivedText']['path']).read_text(encoding='utf-8').splitlines()
            expected = '\n'.join(lines[c['lineStart']-1:c['lineEnd']]) + '\n'
        raw = (SITE / c['componentText']['path']).read_bytes()
        assert raw == expected.encode('utf-8') and sha(raw) == c['componentText']['sha256']
        assert len(re.findall(r'\b[\w\x27-]+\b', expected)) == c['componentText']['wordCount']
        passed('private-component-exact-source-replay-with-intake-hold', componentId=c['componentId'])
    routes = read('concern-map.json')['concerns']
    assert len(routes) == len({c['concern'] for c in routes}) == 11
    for route in routes:
        assert route['limitations'] and route['purpose'] and not route['inferredFromVectors']
        for e in route['entries']:
            w = wb[e['assetId']]
            assert e['originalSha256'] == w['originalSha256']
            for c in e['readingUnits']:
                assert any(c['locator'] == target['locator'] and c['title'] == target['title'] for target in w['locations'])
        passed('concern-route-resolves-to-hashed-original', concern=route['concern'])
    scopes = {a['assetId']: a for a in read('intake-scope.json')['files']}
    assert scopes.keys() == by.keys()
    assert all(s['evidenceOnly'] and s['originalSha256'] == by[aid]['sha256'] for aid, s in scopes.items())
    assert {aid for w in read('bibliography.json')['works'] for aid in w['assetIds']} == set(by)
    assert all(a['url'] in (SITE / 'SOURCES.md').read_text(encoding='utf-8') for a in files)
    passed('six-source-ledger-bibliography-and-parent-holds')
    overlap = read('work-overlaps.json')
    assert len(overlap['comparisons']) == 21 and not overlap['dbTouched']
    component_by_id = {c['componentId']: c for c in components}
    held_by_id = {a['assetId']: a for a in held}
    for row in overlap['comparisons']:
        c = component_by_id[row['componentId']]
        assert row['sourceOriginalSha256'] == c['originalSha256']
        target = component_by_id[row['targetComponentId']]['componentText'] if row.get('targetComponentId') else held_by_id[row['targetAssetId']]['auditDerivative']
        assert row['targetTextSha256'] == target['sha256']
        assert 0 <= row['matchedShingles'] <= row['distinctEightWordShingles']
        assert row['lexicalCoverage'] == round(row['matchedShingles']/max(1,row['distinctEightWordShingles']),4)
    passed('twenty-one-source-attributed-overlap-pairs-with-hashed-targets')
    forbidden = {'firstText', 'firstPages', 'fullText', 'body', 'chapterContent', 'description'}
    def walk(v):
        if isinstance(v, dict):
            assert not forbidden & v.keys(), forbidden & v.keys()
            for x in v.values():
                walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)
    for p in R.glob('*.json'):
        walk(json.loads(p.read_text(encoding='utf-8')))
    passed('versioned-metadata-excludes-private-bodies-and-publisher-descriptions')
    sys.path.insert(0, str(SITE))
    from knowledge.settings import load
    from knowledge.library import plan_library
    _, _, hints, derivatives, originals = plan_library(load())
    planned = []
    for a in files:
        p = (SOURCES / a['relativePath']).resolve()
        h, d = hints[str(p)], derivatives[str(p)]
        assert p in originals and h['sha256'] == a['sha256'] and h['evidenceOnly']
        assert Path(d['path']) == (SITE / a['derivedText']['path']).resolve() and d['sha256'] == a['derivedText']['sha256']
        planned.append(dict(assetId=a['assetId'], planned=True, evidenceOnly=True, title=h['title']))
    prior = json.loads((R.parent / 'RB01/acquisition-manifest.json').read_text(encoding='utf-8'))
    for aid in ['asset-rb01-9d92196f59fd67117d4a', 'asset-rb01-b0316e24a0234138ae8c']:
        a = next(a for a in prior['files'] if a['assetId'] == aid)
        p = (SOURCES / a['relativePath']).resolve()
        assert sha(p.read_bytes()) == a['sha256'] and hints[str(p)]['evidenceOnly']
        assert hints[str(p)]['author'] == a['author']
    passed('read-only-planner-six-originals-held-and-prior-reeves-samson-holds-preserved')
    result = dict(mission='RB06', checksPassed=True, checkCount=len(checks), checks=checks,
        extractionReplays=6, plannedIntakeRows=planned, originalBytes=sum(a['byteCount'] for a in files),
        readableDerivativeWords=sum(a['derivedText']['wordCount'] for a in files),
        countRule='Words include overlapping editions, editorial matter and unselected sections; not unique admitted words.',
        dbTouched=False, embeddingLaunched=False, privateBodiesPublished=False)
    (R / 'verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print('VERIFIED', len(checks), 'checks; six extraction replays; eleven routes and read-only intake holds; no DB writes')


if __name__ == '__main__':
    main()
