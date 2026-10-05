"""Verify acquired bodies, source inventories and hashes without network access."""
import hashlib
import importlib.util
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
OUT = SITE / 'content/library/reports/ready-text-completion'
spec = importlib.util.spec_from_file_location('acquirer', SITE / 'scripts/finish-ready-texts.py')
a = importlib.util.module_from_spec(spec); spec.loader.exec_module(a)
read, write = a.read, a.write
NS = {'t': 'http://www.tei-c.org/ns/1.0'}


def check_file(f):
    raw = (SOURCES / f['relativePath']).read_bytes()
    assert len(raw) == f['byteCount'] and hashlib.sha256(raw).hexdigest() == f['sha256']
    return raw


def main():
    historical = read(OUT / 'historical-results.json')
    goodwin = [v for k, v in historical.items() if k.startswith('goodwin-')]
    assert sorted(v['volume'] for v in goodwin) == list(range(1, 13))
    roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
    for v in goodwin:
        raw = check_file(v['file'])
        assert hashlib.md5(raw).hexdigest() == v['sourceFile']['md5']
        assert int(v['metadata']['volume']) == v['volume']
        assert re.search(r'VOL\.?\s+' + roman[v['volume'] - 1] + r'\b', raw.decode('utf-8')[:20000])
    for row in historical.values(): check_file(row['file'])
    chapters = [v for k, v in historical.items() if k.startswith('machen-')]
    assert sorted(v['chapter'] for v in chapters) == list(range(1, 8))
    for row in chapters:
        html = check_file(row['file']).decode('utf-8', errors='replace')
        p = a.Page(); p.feed(html)
        assert re.search(r'Chapter\s+' + str(row['chapter']) + r'\b', ' '.join(p.text), re.I)
        assert len(' '.join(p.text)) > 10000
    savoy = ET.fromstring(check_file(historical['savoy-tcp']['file']))
    headings = [' '.join(e.itertext()) for e in savoy.findall('.//t:text//t:head', NS)]
    assert len([h for h in headings if h.startswith('CHAP.')]) == 32
    assert any('ORDER' in h and 'CHURCHES' in h for h in headings)
    for key in ['perkins', 'savoy-tcp']:
        root = ET.fromstring(check_file(historical[key]['file']))
        available = root.find('.//t:availability', NS)
        assert 'Creative' in ''.join(available.itertext())
        derivative = next(x for x in read(OUT / 'encoded-text-index.json') if x['key'] == key)
        raw = (SITE / derivative['derivedText']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == derivative['sha256']
        assert raw.count(b'[SOURCE GAP:') == historical[key]['editorialGaps']
    inventory = read(OUT / 'begg-titus-inventory.json')
    urls = [m['url'] for v in inventory for m in v['members']]
    sermons = read(OUT / 'begg-titus-results.json')
    assert len(urls) == len(set(urls)) == 17 and set(urls) == set(sermons)
    for s in sermons.values():
        assert s['status'] == 'acquired'
        p = a.SermonPage(); p.feed(check_file(s['file']).decode('utf-8'))
        text = ''.join(p.body).strip()
        raw = (SITE / s['derivedText']['path']).read_bytes()
        assert raw.decode('utf-8') == text and hashlib.sha256(raw).hexdigest() == s['derivedText']['sha256']
        assert s['metadata']['resource_date'] and s['metadata']['published_on']
        assert re.fullmatch(r'\d+:\d\d', s['metadata']['audio_duration'][0])
    letters = read(OUT / 'begg-letters-results.json')
    extra_inventory = read(OUT / 'begg-letters-inventory.json')
    extra_urls = {m['url'] for v in extra_inventory for m in v['members']}
    assert extra_urls == set(letters) and len(extra_urls) == 85
    for row in letters.values():
        p = a.SermonPage(); p.feed(check_file(row['file']).decode())
        if row['status'] == 'acquired':
            raw = (SITE / row['derivedText']['path']).read_bytes()
            assert raw.decode() == ''.join(p.body).strip()
            assert hashlib.sha256(raw).hexdigest() == row['derivedText']['sha256']
        else:
            assert len(''.join(p.body).split()) <= 500 and 'derivedText' not in row
    result = dict(status='passed', checks=['All historical file hashes and bytes', 'Goodwin volumes 1–12 against metadata, roman title labels and server MD5',
                  'Machen seven chapter bodies', 'Savoy 32 chapters and church order', 'CC0 XML availability and preserved gap markers',
                  'Begg complete 17-member Titus inventory, source transcript equality, dates and durations',
                  'Additional 85-member series inventory; acquired bodies separated from absent transcripts'],
                  historicalFiles=len(historical), goodwinVolumes=12, machenChapters=7, beggTranscripts=80,
                  limits='File, structure and provenance checks; not whole-book proofreading, theological endorsement or audio comparison.')
    write(OUT / 'validation.json', result)
    print(json.dumps(result))


if __name__ == '__main__': main()
