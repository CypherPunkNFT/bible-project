"""Build exact feature/source connections from live citation registries and verified data inputs.

No inference from a biography's first book, name mentions, or library holdings.
"""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
inputs = {}


def read(path):
    raw = (ROOT / path).read_bytes()
    inputs[path] = hashlib.sha256(raw).hexdigest()
    return json.loads(raw.decode('utf-8-sig'))


def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values(): yield from walk(child)
    elif isinstance(value, list):
        for child in value: yield from walk(child)


def main():
    registry = read('content/feature-citations.json')
    features = []
    for feature in registry['features']:
        rows = []
        for page in feature['pages']:
            data = read(page['file'])
            used = {cid for obj in walk(data) for cid in obj.get('cites', []) if isinstance(cid, str)}
            for obj in walk(data):
                for c in obj.get('citations', []):
                    if not isinstance(c, dict) or not c.get('author') or not c.get('url'): continue
                    rows.append({'author': c['author'], 'title': c['title'], 'year': c.get('year', ''), 'url': c['url'],
                        'kind': 'citation' if c['id'] in used else 'bibliography',
                        'page': page['page'], 'address': page['address'], 'locator': c.get('where', ''), 'evidence': page['file'], 'citationId': c['id']})
        features.append({'id': feature['id'], 'label': feature['label'], 'rows': rows})

    # Published apologetics studies carry source references rather than author/title citation objects.
    sources = {}
    for path in sorted((ROOT / 'content/apologetics/sources').glob('*.json')):
        item = read(path.relative_to(ROOT).as_posix())
        if item.get('publication') == 'published': sources[item['id']] = item['content']
    rows = []
    for path in sorted((ROOT / 'content/apologetics/studies').glob('*.json')):
        item = read(path.relative_to(ROOT).as_posix())
        if item.get('publication') != 'published': continue
        for obj in walk(item['content']):
            for c in obj.get('citations', []):
                if not isinstance(c, dict) or c.get('kind') != 'source': continue
                source = sources[c['source']]
                rows.append({'author': source['author'], 'title': source['title'], 'year': '', 'url': source['url'], 'kind': 'citation',
                    'page': item['content']['title'], 'address': '/apologetics/study/' + item['id'], 'locator': c.get('locator', ''),
                    'evidence': path.relative_to(ROOT).as_posix(), 'citationId': c['source']})
    features.append({'id': 'apologetics', 'label': 'Apologetics studies', 'rows': rows})

    direct = read('content/teachers/feature-inputs.json')
    for feature in direct:
        target = next((f for f in features if f['id'] == feature['id']), None)
        if target is None:
            target = {'id': feature['id'], 'label': feature['label'], 'rows': []}
            features.append(target)
        for row in feature['rows']:
            path = row['evidence']
            raw = (ROOT / path).read_bytes()
            inputs[path] = hashlib.sha256(raw).hexdigest()
            assert row['verify'] in raw.decode('utf-8'), f'Missing data-input evidence: {path}: {row["verify"]}'
            target['rows'].append({k: v for k, v in row.items() if k != 'verify'} | {'kind': 'data', 'page': feature['label'], 'address': feature['address'], 'citationId': ''})

    # Keep different authors, editions, titles and source URLs distinct. Group only exact identities within a feature.
    for feature in features:
        groups = {}
        for row in feature.pop('rows'):
            key = tuple(row[k] for k in ['author', 'title', 'year', 'url', 'kind'])
            group = groups.setdefault(key, {k: row[k] for k in ['author', 'title', 'year', 'url', 'kind']} | {'uses': []})
            use = {k: row[k] for k in ['page', 'address', 'locator', 'evidence', 'citationId']}
            if use not in group['uses']: group['uses'].append(use)
        feature['sources'] = sorted(groups.values(), key=lambda s: (s['kind'] != 'data', s['author'].casefold(), s['title'].casefold()))
        for source in feature['sources']:
            source['id'] = hashlib.sha256(json.dumps([feature['id'], source['author'], source['title'], source['year'], source['url'], source['kind']]).encode()).hexdigest()[:16]
    order = ['topics', 'harmony', 'miracles', 'letters', 'people-rulers', 'people-apostles', 'people-prophets', 'apologetics']
    features.sort(key=lambda f: order.index(f['id']))
    output = {'schemaVersion': 1, 'inputs': inputs, 'features': features,
        'scope': 'Verified data inputs, registered page bibliographies and published apologetics study citations. Holdings and incidental name mentions are excluded.'}
    text = json.dumps(output, ensure_ascii=False, indent=2) + '\n'
    path = ROOT / 'content/teachers/feature-usage.json'
    if '--check' in sys.argv:
        assert path.read_text('utf-8') == text, 'Feature usage is stale'
    else: path.write_text(text, encoding='utf-8')
    print(json.dumps({f['label']: {'sourceRecords': len(f['sources']), 'uses': sum(len(s['uses']) for s in f['sources'])} for f in features}, indent=2))


if __name__ == '__main__': main()
