"""Build subject discovery from ALL packaged records, with exact attribution evidence.

No extraction, embedding, rights changes, fuzzy identity joins, or fixed-size selections.
Fields describe held works, not a contributor's qualifications or personal beliefs.
"""
import collections
import hashlib
import html
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public/content/teacher-library'
CONTENT = ROOT / 'content/teachers'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(value)).strip()


def key(value):
    return ''.join(c for c in unicodedata.normalize('NFKD', clean(value)).casefold() if not unicodedata.combining(c))


# Explicit bibliographic signals; the matching rule and example are retained.
PATTERNS = {
    'history': r'\bhistor\w*|\bchroni\w*|\bannals?\b|\bantiquit\w*|\bbiograph\w*|\bmemoirs?\b|\bmartyr\w*|\blife of\b',
    'texts': r'\bgramma\w*|\bsyntax\b|\bmanuscript\w*|\btextual\b|\bcanon\b|\btranslation\w*|\bseptuagint\w*|\bpeshitta\b|\bhebrew\b|\bgreek\b|\bphilolog\w*',
    'places': r'\barchaeolog\w*|\barcheolog\w*|\bgeograph\w*|\btopograph\w*|\bexcavat\w*|\bbiblical antiquities\b|\blocis sant\w*|\blocis sanct\w*|\batlas of\b',
    'reference': r'\bcommentar\w*|\bencyclop\w*|\bdictionar\w*|\bconcordanc\w*|\blexicon\w*|\bexposition\w*|\bannotation\w*',
    'theology': r'\btheolog\w*|\bdivinit\w*|\btrinit\w*|\bchristian\w*|\bsermons?\b|\bsalvation\b|\bfaith\b|\bchurch\b|\bdoctrin\w*|\breligio\w*|\bapolog\w*|\bgod\b|\bjesus\b|\bchrist\b|\bscriptur\w*|\bbible\b|\bgospel\w*|\bbaptis\w*|\bgrace\b|\bsanctification\b|\bjustification\b|\bcatechis\w*|\bconfession\w*|\bphilosoph\w*|\bmetaphysi\w*|\bethic\w*|\bhomil\w*|\bprayer\w*',
}
REGEX = {field: re.compile(pattern, re.I) for field, pattern in PATTERNS.items()}


def collections_for(work):
    source = work['source'].lower()
    result = []
    if 'ccel' in source or 'ccel.org/' in (work.get('sourceUrl') or ''): result.append('ccel')
    if 'csel' in source: result.append('latin-fathers')
    if source in {'first1k', 'pta', 'catenae'}: result.append('greek-patristic')
    if 'tcp' in source or 'text creation partnership' in source: result.append('early-print')
    return result


def classify(work):
    fields = {field: 'Title: ' + match.group() for field, regex in REGEX.items() if (match := regex.search(work['title']))}
    groups = collections_for(work)
    if 'latin-fathers' in groups or work['source'] in {'pta', 'catenae'} or 'ccel' in groups:
        fields.setdefault('theology', 'Patristic / Christian source collection')
    if work['source'] == 'first1k':
        fields.setdefault('texts', 'First1K Greek editions: ancient-language textual context')
    return fields


def main():
    catalogue = read(PUBLIC / 'catalogue.json')
    profiles = read(CONTENT / 'scholars.json')['scholars']
    profiles_by_id = {p['id']: p for p in profiles}
    overlay = read(CONTENT / 'field-attributions.json')
    records = {}
    for path in sorted((PUBLIC / 'records').glob('*.json')): records.update(read(path))
    aliases = {key(alias): name for name, names in overlay['aliases'].items() for alias in [name, *names]}
    canonical = lambda name: aliases.get(key(name), clean(name))
    profile_by_name = {key(canonical(name)): p for p in profiles for name in [p['name'], p['short']]}
    groups, identity = {}, {}

    def group(name):
        name = canonical(name)
        norm = key(name)
        if norm not in groups:
            profile = profile_by_name.get(norm)
            groups[norm] = {'id': profile['id'] if profile else 'field-' + hashlib.sha256(norm.encode()).hexdigest()[:20], 'name': profile['name'] if profile else name,
                'profileId': profile['id'] if profile else None, 'aliases': set(), 'contributorIds': [], 'roles': set(), 'traditions': set(), 'collections': set(), 'works': {}, 'supplements': {}, 'fields': {}}
        return groups[norm]

    for p in profiles:
        g = group(p['name'])
        g['profileId'] = p['id']
        g['id'] = p['id']
        g['fields'][p['field']] = {'count': 0, 'basis': 'Documented profile field', 'example': None}

    for person in catalogue['contributors']:
        profile = profiles_by_id.get(person.get('profileId'))
        g = group(profile['name'] if profile else person['name'])
        identity[person['id']] = g
        g['contributorIds'].append(person['id'])
        g['aliases'].add(person['name'])
        g['roles'].update(person['roles'])
        g['traditions'].update(person.get('traditions', []))

    def add(g, w, fields, supplemental=False, evidence='Constituent author named in the held volume title'):
        if w['id'] in g['works']: return
        g['works'][w['id']] = w
        g['collections'].update(collections_for(w))
        sample = {k: clean(w[k]) for k in ['id', 'title', 'source', 'availability']}
        if supplemental:
            g['supplements'][w['id']] = sample | {'basis': evidence}
            g['roles'].add('author in collected volume')
        for field, basis in fields.items():
            slot = g['fields'].setdefault(field, {'count': 0, 'basis': basis, 'example': sample})
            slot['count'] += 1
            # Prefer named, readable source texts over provisional IA records and long titles.
            old = slot['example']
            rank = lambda a: (a['availability'] == 'identity-review', a['availability'] != 'on-site-text', len(a['title']))
            if old is None or rank(sample) < rank(old): slot.update(example=sample, basis=basis)

    for w in records.values():
        fields = classify(w)
        for cid in set(w['contributors']):
            if cid in identity: add(identity[cid], w, fields)
        if 'ccel' in collections_for(w):
            match = re.match(r'^(ANF\d{2}|NPNF1-\d{2}|NPNF2-\d{2}|NPNF-\d{3})(?:\.|\s)', w['title'])
            for name in overlay['volumes'].get(match[1] if match else '', []):
                add(group(name), w, fields | {'theology': 'Constituent author named in held CCEL volume title'}, True)
            for item in overlay.get('contents', []):
                if match and item['volume'] == match[1]:
                    for name in item['authors']:
                        add(group(name), w, fields | {'theology': item['evidence']}, True, item['source'] + ': ' + item['evidence'])

    entries, unassigned = [], []
    for g in groups.values():
        if not g['fields']:
            unassigned.append({'name': g['name'], 'contributorIds': g['contributorIds'], 'records': len(g['works'])})
            continue
        entries.append({k: sorted(v) if isinstance(v, set) else v for k, v in g.items() if k not in {'works', 'supplements'}} |
            {'records': len(g['works']), 'readable': sum(w['availability'] == 'on-site-text' for w in g['works'].values()), 'supplements': list(g['supplements'].values())})
    entries.sort(key=lambda e: key(e['name']))
    counts = {field: sum(field in e['fields'] for e in entries) for field in PATTERNS}
    result = {'schemaVersion': 2, 'catalogueUpdatedAt': catalogue['updatedAt'],
        'catalogueSha256': hashlib.sha256((PUBLIC / 'catalogue.json').read_bytes()).hexdigest(),
        'coverage': {'scannedRecords': len(records), 'sourceContributors': len(catalogue['contributors']), 'includedNames': len(entries),
            'withoutSubjectMatch': len(unassigned), 'fieldCounts': counts,
            'collections': {c: sum(c in e['collections'] for e in entries) for c in ['ccel', 'latin-fathers', 'greek-patristic', 'early-print']}},
        'about': 'Subject discovery over every packaged record. Field placement describes recorded works, not qualifications. Exact source names remain unless an explicit alias is recorded. Fields overlap. Collections and pseudonymous credits are retained as such. No text or embedding was changed.',
        'entries': entries}
    report = {'coverage': result['coverage'], 'rules': PATTERNS, 'withoutSubjectMatch': unassigned,
        'note': 'These remaining source names remain accessible in the full acquired library; no subject was guessed to force full coverage.'}
    assert len({e['id'] for e in entries}) == len(entries), 'Duplicate discovery identity'
    assert {p['id'] for p in profiles} <= {e['profileId'] for e in entries}, 'A documented profile was dropped'
    represented = {cid for e in entries for cid in e['contributorIds']}
    latin = [w for w in records.values() if 'latin-fathers' in collections_for(w)]
    assert all(set(w['contributors']) <= represented for w in latin), 'A CSEL contributor was dropped'
    assert all(v['example'] is None or v['example']['id'] in records for e in entries for v in e['fields'].values()), 'Broken evidence link'
    outputs = {'field-shelves.json': json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n',
        'field-coverage.json': json.dumps(report, ensure_ascii=False, indent=2) + '\n'}
    for filename, text in outputs.items():
        target = CONTENT / filename
        if '--check' in sys.argv:
            if not target.exists() or target.read_text(encoding='utf-8') != text: raise SystemExit(f'Stale: {filename}; run scripts/build-scholar-fields.py')
        else: target.write_text(text, encoding='utf-8')
    print(json.dumps(result['coverage'], indent=2))
    print(f'Validated every profile, evidence destination and all {len(latin)} CSEL records.')


if __name__ == '__main__': main()
