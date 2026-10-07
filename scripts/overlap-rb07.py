"""Offline lexical overlap hints, not authorship or unique-coverage judgments."""
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB07'


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def words(text):
    return re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower())


def shingles(text):
    ws = words(text)
    return {' '.join(ws[i:i+8]) for i in range(max(0, len(ws)-7))}


def main():
    components = read('selected-components.json')['components']
    works = read('chapter-map.json')['works']
    wb = {w['assetId']: w for w in works}
    held = {a['assetId']: a for a in read('holdings-audit.json')['files']}
    queries = []
    for c in components:
        work = wb[c['parentWitnessAssetId']]['workId']
        target = None
        if work == 'work-rb07-serampore-letters' and c['author'] == 'Andrew Fuller':
            target = 'asset-rb04-f9ea063dff9952ca931d'
        elif work == 'work-rb07-edward-judson-life':
            target = 'asset-expanded-8a632e04a7d6c4f7f70b'
        elif work == 'work-rb07-carey-smith-appendix-1885':
            target = next(w['assetId'] for w in works if w['workId'] == 'work-rb07-smith-carey-life')
        if target:
            text = (SITE / c['componentText']['path']).read_text(encoding='utf-8')
            queries.append((c, target, shingles(text)))
    grouped = defaultdict(list)
    for c, target, keys in queries:
        grouped[target].append((c, keys))
    results = []
    for target, group in grouped.items():
        w = wb[target]
        d = w['derivative']
        raw = (SITE / d['path']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == d['sha256']
        ws = words(raw.decode('utf-8'))
        wanted = set().union(*(keys for _, keys in group))
        matched = set()
        for i in range(max(0, len(ws)-7)):
            key = ' '.join(ws[i:i+8])
            if key in wanted:
                matched.add(key)
        for c, keys in group:
            n = len(keys & matched)
            results.append(dict(componentId=c['componentId'], title=c['title'],
                sourceOriginalSha256=c['originalSha256'], sourceTextSha256=c['componentText']['sha256'],
                targetAssetId=target, targetOriginalSha256=w['originalSha256'],
                targetTextSha256=d['sha256'], distinctEightWordShingles=len(keys),
                matchedShingles=n, lexicalCoverage=round(n/max(1,len(keys)),4),
                interpretation='Potential shared passage witness only. OCR, condensation, translation and short formulae affect recall; no automatic duplicate or novelty decision.'))
    prior = json.loads((R.parent / 'RB05/chapter-map.json').read_text(encoding='utf-8'))
    pfull = next(w for w in prior['works'] if w['assetId']=='asset-rb04-f9ea063dff9952ca931d')
    reused = [c for c in components if c['parentWitnessAssetId']==pfull['assetId']]
    intersections = []
    for c in reused:
        for u in pfull['locations']:
            lo,hi=max(c['lineStart'],u['lineStart']),min(c['lineEnd'],u['lineEnd'])
            if lo<=hi:
                intersections.append(dict(componentId=c['componentId'], priorTitle=u['title'], lineStart=lo,lineEnd=hi))
    value=dict(mission='RB07',algorithm='Case-folded alphabetic eight-word shingles; scan only query-set matches',
        comparisons=results,heldFullerPreparedComponents=len(reused),
        rb05FullerRangeIntersections=intersections,dbTouched=False,
        countRule='All eight Fuller components reuse one previously acquired edition, regardless of range intersection. No new Fuller whole-book acquisition.')
    (R/'work-overlaps.json').write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print('OVERLAP',len(results),'comparisons;',len(intersections),'RB05 range intersections')
    for row in results:
        print(row['title'],row['lexicalCoverage'])


if __name__=='__main__':
    main()
