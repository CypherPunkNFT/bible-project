"""Bounded edition-overlap audit: source credits + lexical corroboration, no DB."""
import hashlib
import json
import re
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
R = SITE / 'content/library/reports/reformed-baptist-overnight/RB06'


def read(name):
    return json.loads((R / name).read_text(encoding='utf-8'))


def shingles(text):
    words = re.findall(r'\w+', text.lower())
    return {' '.join(words[i:i+8]) for i in range(max(0, len(words)-7))}


def main():
    cs = read('selected-components.json')['components']
    held = {a['assetId']: a for a in read('holdings-audit.json')['files']}
    bytitle = {c['title']: c for c in cs}
    sermons = {int(re.search(r'SERM\.\s*(\d+)', c['title'])[1]): c for c in cs if 'SERM.' in c['title']}
    pairs = []
    for title in ['The Nature, Warrant, and History of Family Worship', 'The Father and Family Worship']:
        pairs.append((bytitle[title], held['asset-expanded-c17152ddf72a788ab047'], 'Source byline/work identity; same Alexander family-worship book'))
    for title in ['What God Is To Families', 'The Word of God and Family Prayer', 'Seven Reasons Families Should Pray']:
        pairs.append((bytitle[title], sermons[15], 'Explicit source credit names Doolittle family-prayer sermon; full offered sermon acquired in this mission'))
    for title in ['Tried by Fire', 'The Great Giver']:
        pairs.append((bytitle[title], held['asset-expanded-62708a1e243900f9118f'], 'Matching Pink Comfort for Christians chapter identities'))
    pairs.append((bytitle['The Bible and Consolation'], held['asset-expanded-8d4168fda1f1fa6bd5db'], 'Source work attribution to Buchanan Comfort in Affliction'))
    pairs.append((bytitle['Good Comes through Affliction'], held['asset-expanded-b966bc579a85483a2fe9'], 'Explicit source credit names Brooks Mute Christian under the Smarting Rod'))
    pairs.append((bytitle['Comfort for Suffering Saints'], held['asset-expanded-0a343b66028dd78febf5'], 'Zanchius predestination source-work attribution'))
    for c in cs:
        if c['parentWitnessAssetId'] == 'asset-rb06-684d3b71e51526d3c4ac':
            pairs.append((c, sermons[16], 'Explicit modern abridgment/paraphrase of Steele source sermon; lexical score cannot measure paraphrase fully'))
        if c['parentWitnessAssetId'] == 'asset-rb06-f46d96a2ea4c8be2dd78':
            pairs.append((c, sermons[17], 'Explicit modern abridgment/revision of Adams source sermon; omissions do not make new underlying work'))
    rows, target_cache = [], {}
    for c, target, basis in pairs:
        td = target.get('componentText', target.get('auditDerivative'))
        assert td
        key = td['path']
        if key not in target_cache:
            p = SITE / key
            assert hashlib.sha256(p.read_bytes()).hexdigest() == td['sha256']
            target_cache[key] = shingles(p.read_text(encoding='utf-8'))
        p = SITE / c['componentText']['path']
        assert hashlib.sha256(p.read_bytes()).hexdigest() == c['componentText']['sha256']
        s = shingles(p.read_text(encoding='utf-8'))
        matched = len(s & target_cache[key])
        rows.append(dict(componentId=c['componentId'], title=c['title'],
            targetAssetId=target.get('assetId', target.get('parentWitnessAssetId')),
            targetComponentId=target.get('componentId'), targetTitle=target['title'],
            sourceBasis=basis, sourceOriginalSha256=c['originalSha256'],
            targetTextSha256=td['sha256'], distinctEightWordShingles=len(s), matchedShingles=matched,
            lexicalCoverage=round(matched/max(1,len(s)),4),
            resolution='Link underlying work; preserve edited edition/rights/voice identity. Do not automatically drop pages or admit parent.'))
    out = dict(mission='RB06', comparisons=rows, method='Lowercase Unicode word tokens; distinct contiguous eight-word shingles; targeted source-identified pairs only.',
        limitations='Corroborates literal overlap, not semantic duplicate detection, exhaustive corpus search, unique-word count, or doctrinal approval. Low paraphrase score does not establish a new underlying work.', dbTouched=False)
    (R / 'work-overlaps.json').write_text(json.dumps(out, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
    print('CHECKED',len(rows),'source-attributed overlap pairs; no database, models or body publication')


if __name__ == '__main__':
    main()
