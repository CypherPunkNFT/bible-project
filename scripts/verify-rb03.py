"""Independent RB03 acquisition/map/intake parity checks, no DB writes."""
import hashlib
import json
from pathlib import Path
from xml.etree import ElementTree as ET
import zipfile

from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB03'


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def main():
    manifest = read('acquisition-manifest.json')
    files = manifest['files']
    by_asset = {a['assetId']: a for a in files}
    assert len(by_asset) == len(files) == len({a['url'] for a in files})
    assert manifest['ingested'] is False and manifest['embedded'] is False
    targets = {a['url'] for a in read('targets.json')}
    rejected = read('sparse-chapter-exceptions.json')['chapters']
    assert len(rejected) == len({a['url'] for a in rejected})
    assert targets == {a['url'] for a in files} | {a['url'] for a in rejected}
    assert not ({a['url'] for a in files} & {a['url'] for a in rejected})
    checks = []
    for a in files:
        p = SOURCES / a['relativePath']
        assert p.resolve().is_relative_to(SOURCES.resolve())
        assert hashlib.sha256(p.read_bytes()).hexdigest() == a['sha256']
        assert p.stat().st_size == a['byteCount']
        provenance = json.loads(p.with_name('provenance.json').read_text(encoding='utf-8'))
        assert provenance == a, a['assetId']
        derivative = SITE / a['derivedText']['path']
        assert hashlib.sha256(derivative.read_bytes()).hexdigest() == a['derivedText']['sha256']
        assert not a['publicHostingAllowed'] and not a['publicFullTextIndexAllowed']
        checks.append(dict(kind='original-provenance-derivative-parity', assetId=a['assetId'], passed=True))
    chapters = read('chapter-coverage.json')['chapters']
    henry = [c for c in chapters if c['author'] == 'Matthew Henry']
    assert len(henry) == 929 and sum(c['provenance'] == 'new' for c in henry) == 742
    assert len({(c['bookId'], c['chapter']) for c in henry}) == 929
    assert len({c['bookId'] for c in henry}) == 39
    henry_hashes, xml_nodes, epub_members = {}, {}, {}
    for c in henry:
        p = SOURCES / c['original']
        if p not in henry_hashes:
            henry_hashes[p] = hashlib.sha256(p.read_bytes()).hexdigest()
        assert henry_hashes[p] == c['originalSha256']
        if c['provenance'] == 'new':
            if p not in xml_nodes:
                xml_nodes[p] = {e.attrib['id']: e for e in ET.parse(p).iter() if 'id' in e.attrib}
            node = xml_nodes[p][c['locator']]
            assert node.attrib['title'] == c['xmlTitle']
            assert c['chapterWordCount'] > 100, c
        else:
            if p not in epub_members:
                with zipfile.ZipFile(p) as archive:
                    epub_members[p] = set(archive.namelist())
            assert c['locator'].split('#')[0] in epub_members[p]
    gill = [c for c in chapters if c['author'] == 'John Gill']
    assert len(gill) == sum(a['author'] == 'John Gill' for a in files)
    for c in gill:
        a = by_asset[c['assetId']]
        raw = json.loads((SOURCES / c['original']).read_text(encoding='utf-8'))
        assert raw['book']['id'] == c['bookId'] and raw['chapter']['number'] == c['chapter']
        assert c['originalSha256'] == a['sha256']
        assert c['entryNumbers'] == [e['number'] for e in raw['chapter']['content'] if e.get('type') == 'verse']
        assert c['contentRole'] == a['contentRole']
    scopes = {s['assetId']: s for s in read('intake-scope.json')['files']}
    assert scopes.keys() == by_asset.keys()
    for aid, s in scopes.items():
        assert s['originalSha256'] == by_asset[aid]['sha256']
        if by_asset[aid].get('contentRole') == 'cross-reference-pointers-only':
            assert s['candidateRole'] == 'source-reference-pointers'
    keach = read('keach-reading-map.json')['sections']
    assert len(keach) == 47
    assert len({(s['volume'], s['section']) for s in keach}) == 47
    assert read('keach-reuse-identity.json')['tocTitleParity']
    sources = (SITE / 'SOURCES.md').read_text(encoding='utf-8')
    assert all(a['url'] in sources for a in files)
    # Body-bearing keys are deliberately absent from all versioned metadata.
    forbidden = {'firstText', 'firstPages', 'introduction', 'fullText', 'body', 'chapterContent'}
    def walk(value):
        if isinstance(value, dict):
            assert not (forbidden & value.keys()), forbidden & value.keys()
            for v in value.values():
                walk(v)
        elif isinstance(value, list):
            for v in value:
                walk(v)
    for p in R.glob('*.json'):
        walk(json.loads(p.read_text(encoding='utf-8')))
    checks.extend([dict(kind='Henry-929-canonical-chapter-inventory', passed=True),
        dict(kind='Gill-component-and-source-role-parity', passed=True),
        dict(kind='Keach-47-reading-divisions-and-held-III-reuse', passed=True),
        dict(kind='Every-target-acquired-or-explicitly-rejected', passed=True),
        dict(kind='Every-source-listed', passed=True),
        dict(kind='Metadata-body-field-exclusion', passed=True),
        dict(kind='Intake-scope-asset-parity', passed=True)])
    (R / 'verification.json').write_text(json.dumps(dict(checkCount=len(checks), checks=checks,
        dbTouched=False, embeddingStarted=False), indent=2) + '\n', encoding='utf-8', newline='\n')
    print('VERIFIED', len(files), 'assets;', len(checks), 'checks;', len(henry), 'Henry chapters;', len(gill), 'Gill components;', len(keach), 'Keach divisions')


if __name__ == '__main__':
    main()
