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

    # Other published apologetics pages also carry explicit source IDs.
    for folder, feature_id, label, route in [
        ('debates', 'debates', 'Debates and exchanges', '/apologetics/debates/'),
        ('worldviews', 'worldviews', 'Worldview studies', '/apologetics/worldviews/'),
        ('paths', 'apologetics-paths', 'Apologetics learning paths', '/apologetics/paths/'),
        ('practice', 'apologetics-practice', 'Conversation practice', '/apologetics/practice'),
    ]:
        rows = []
        for path in sorted((ROOT / ('content/apologetics/' + folder)).glob('*.json')):
            item = read(path.relative_to(ROOT).as_posix())
            if item.get('publication') != 'published': continue
            content = item['content']
            refs = []
            for obj in walk(content):
                if obj.get('kind') == 'source' and obj.get('source') in sources:
                    refs.append((obj['source'], obj.get('locator', '')))
                if isinstance(obj.get('source'), str) and obj['source'] in sources:
                    refs.append((obj['source'], 'Recorded page source'))
                for sid in obj.get('sources', []):
                    if isinstance(sid, str) and sid in sources: refs.append((sid, 'Recorded page bibliography'))
            for sid, locator in sorted(set(refs)):
                source = sources[sid]
                rows.append({'author': source['author'], 'title': source['title'], 'year': '', 'url': source['url'], 'kind': 'citation',
                    'page': content.get('title', content.get('label', item['id'])), 'address': route + item['id'] if route.endswith('/') else route,
                    'locator': locator, 'evidence': path.relative_to(ROOT).as_posix(), 'citationId': sid})
        if rows: features.append({'id': feature_id, 'label': label, 'rows': rows})

    sweep = read('content/teachers/site-source-sweep.json')
    for path, expected in sweep['inputs'].items():
        raw = (ROOT / path).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == expected, f'Site-source sweep is stale: {path}'
        inputs[path] = expected
    direct = read('content/teachers/feature-inputs.json') + sweep['features']
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
            default_kind = 'citation' if feature['id'] not in ['topics','harmony','miracles','letters','atlas','cross-references','bible-texts'] else 'data'
            target['rows'].append({k: v for k, v in row.items() if k != 'verify'} | {'kind': row.get('kind', default_kind), 'page': feature['label'], 'address': feature['address'], 'citationId': ''})

    # Keep different authors, editions, titles and source URLs distinct. Group only exact identities within a feature.
    for feature in features:
        groups = {}
        for row in feature.pop('rows'):
            key = tuple(row[k] for k in ['author', 'title', 'year', 'url', 'kind'])
            group = groups.setdefault(key, {k: row[k] for k in ['author', 'title', 'year', 'url', 'kind']} | {'uses': []})
            use = {k: row[k] for k in ['page', 'address', 'locator', 'evidence', 'citationId']}
            if row.get('consultation'): use['consultation'] = row['consultation']
            if use not in group['uses']: group['uses'].append(use)
        feature['sources'] = sorted(groups.values(), key=lambda s: (s['kind'] != 'data', s['author'].casefold(), s['title'].casefold()))
        for source in feature['sources']:
            source['id'] = hashlib.sha256(json.dumps([feature['id'], source['author'], source['title'], source['year'], source['url'], source['kind']]).encode()).hexdigest()[:16]
    order = ['topics', 'harmony', 'miracles', 'letters', 'people-rulers', 'people-apostles', 'people-prophets', 'apologetics']
    features.sort(key=lambda f: order.index(f['id']) if f['id'] in order else len(order))
    output = {'schemaVersion': 1, 'inputs': inputs, 'features': features,
        'scope': 'Verified chart data inputs, registered page bibliographies, source directories imported by live academic/theological studies, and published apologetics citations. Institutions identify source providers where no author is recorded. Consultation limits are retained. Holdings and incidental name mentions are excluded.'}
    text = json.dumps(output, ensure_ascii=False, indent=2) + '\n'
    path = ROOT / 'content/teachers/feature-usage.json'
    audit = {
        'schemaVersion': 1,
        'scope': output['scope'],
        'features': [{'id': f['id'], 'label': f['label'], 'sourceRecords': len(f['sources']),
            'pageConnections': sum(len(s['uses']) for s in f['sources']),
            'contributors': len({s['author'] for s in f['sources']}),
            'kinds': {kind: sum(s['kind'] == kind for s in f['sources']) for kind in ['data', 'citation', 'bibliography']}}
            for f in features],
        'summary': {'features': len(features), 'sourceRecords': sum(len(f['sources']) for f in features),
            'pageConnections': sum(len(s['uses']) for f in features for s in f['sources']),
            'creditLabels': len({s['author'] for f in features for s in f['sources']}), 'verifiedInputFiles': len(inputs)},
        'excluded': ['Unpublished research plans and acquisition archives', 'Library holdings without a live page citation or linked source directory',
            'Incidental personal-name matches', 'Navigation-only pages whose source connections are recorded on the linked studies'],
        'refresh': ['node scripts/collect-scholar-site-sources.mjs', 'python scripts/build-scholar-usage.py'],
    }
    audit_text = json.dumps(audit, ensure_ascii=False, indent=2) + '\n'
    audit_path = ROOT / 'content/teachers/site-source-audit.json'
    if '--check' in sys.argv:
        assert path.read_text('utf-8') == text, 'Feature usage is stale'
        assert audit_path.read_text('utf-8') == audit_text, 'Site-source audit is stale'
    else:
        path.write_text(text, encoding='utf-8')
        audit_path.write_text(audit_text, encoding='utf-8')
    print(json.dumps({f['label']: {'sourceRecords': len(f['sources']), 'uses': sum(len(s['uses']) for s in f['sources'])} for f in features}, indent=2))


if __name__ == '__main__': main()
