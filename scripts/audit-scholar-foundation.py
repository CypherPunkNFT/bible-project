"""Read-only corpus reconciliation and source-supported contributor facts.

Never extracts text, runs embeddings, edits intake databases, or publishes private paths.
Public facts contain only attribution metadata linked to existing public work records.
Detailed coverage/identity queues remain in Research, outside the website package.
"""
from pathlib import Path
from collections import Counter, defaultdict
import hashlib
import json
import re
import sqlite3
import sys
import unicodedata

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
REPORT = ROOT / 'Research/Scholars-foundation'
YEAR = 2026


def read(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFKD', s).casefold() if not unicodedata.combining(c))
    return re.sub(r'[^\w]+', ' ', s).strip()


def clean_name(value):
    """Mirror the existing credit-name cleaning only for linking source evidence, not merging identities."""
    s = re.sub(r'\([^)]*\)', '', str(value).split('\n')[0].strip())
    s = re.split(r',?\s+(?:\d{3,4}|d\. |b\. |fl\. )', s)[0].strip(' .,')
    s = re.sub(r'\s+(?:aut|edt|trl)\.?$', '', s).strip(' .,')
    if s.count(',') == 1:
        last, first = s.split(',')
        s = first.strip() + ' ' + last.strip()
    return re.sub(r'\s+', ' ', s).strip()


def era(year):
    return 'ancient' if year < 500 else 'medieval' if year < 1500 else 'early-modern' if year < 1800 else 'modern'


def parse_date(label):
    """Accept clear biographical suffixes only. Single unqualified years stay unresolved."""
    text = label.strip().rstrip('. ,;')
    text = re.sub(r'\s+(aut|edt|trl)\.?$', '', text, flags=re.I).strip(' .,')
    # Mixed BC/AD, centuries and uncertainty intervals need individual review.
    if re.search(r'cent\b|century|\bor\b', text, re.I):
        return None
    m = re.search(r'(?P<start>\d{1,4})\s*[?]?\s*[-\u2013\u2014]\s*(?:ca\.?\s*)?(?P<end>\d{1,4})\s*[?]?\s*(?P<bc>B\.?\s*C\.?(?:E\.?)?)?$', text, re.I)
    if m:
        start, end = int(m['start']), int(m['end'])
        if m['bc']:
            start, end = -start, -end
        if start == 0 or end == 0 or start > end or end > YEAR or end - start > 125:
            return None
        if re.search(r'\b(?:fl\.?|active)\s*$', text[:m.start()], re.I):
            return {'floruit': start, 'activeUntil': end, 'era': era(start), 'basis': 'source-active-range', 'approximate': '?' in text}
        if re.search(r'\b(?:d\.?|died|b\.?|born)\s*$', text[:m.start()], re.I):
            return None  # uncertain birth/death interval, not a lifespan
        return {'born': start, 'died': end, 'era': era(start), 'basis': 'source-life-range', 'approximate': bool(re.search(r'\bca\.?|\bc\.|\?|approximately', text, re.I))}
    m = re.search(r'\b(?P<role>b|born|d|died|fl)\.?\s*(?:ca\.?\s*)?(?P<year>\d{1,4})\s*(?P<bc>B\.?\s*C\.?(?:E\.?)?)?$', text, re.I)
    if m:
        y = int(m['year']) * (-1 if m['bc'] else 1)
        if y == 0 or y > YEAR:
            return None
        role = m['role'].lower()
        field = 'born' if role in {'b', 'born'} else 'died' if role in {'d', 'died'} else 'floruit'
        return {field: y, 'era': era(y) if field != 'died' else None, 'basis': 'source-' + field, 'approximate': bool(re.search(r'\bca\.?|\bc\.', text, re.I))}
    return None


def stream_private(path):
    """Stream the first object in the packer's 490 MB build-input without loading it all."""
    decoder = json.JSONDecoder()
    with path.open(encoding='utf-8-sig') as f:
        buf = f.read(65536)
        prefix = re.match(r'\s*\{\s*"private"\s*:\s*\{', buf)
        if not prefix:
            raise ValueError('Unexpected private build-input schema')
        buf = buf[prefix.end():]
        while True:
            buf = buf.lstrip(' \r\n\t,')
            if buf.startswith('}'):
                return
            try:
                key, end = decoder.raw_decode(buf)
                pos = end
                while buf[pos].isspace(): pos += 1
                if buf[pos] != ':': raise ValueError('Expected key separator')
                pos += 1
                while buf[pos].isspace(): pos += 1
                value, end = decoder.raw_decode(buf, pos)
            except (json.JSONDecodeError, IndexError):
                more = f.read(65536)
                if not more: raise ValueError('Truncated private build input')
                buf += more
                continue
            yield key, value
            buf = buf[end:]


def labels(row):
    for field in ['author', 'authorNames', 'editor', 'translator']:
        value = row.get(field)
        for label in value if isinstance(value, list) else re.split(r';\s*', str(value or '')):
            if isinstance(label, str) and label.strip(): yield field, label.strip()
    metadata = row.get('sourceMetadata')
    if isinstance(metadata, dict):
        value = metadata.get('creator', [])
        for label in value if isinstance(value, list) else [value]:
            if isinstance(label, str) and label.strip(): yield 'sourceMetadata.creator', label.strip()


def manifest_rows(value, inherited=None):
    if isinstance(value, dict):
        row = (inherited or {}) | value
        if (row.get('sha256') or row.get('originalSha256')) and (row.get('path') or row.get('relativePath')):
            yield row
        context = {k: row[k] for k in ['author', 'authorNames', 'editor', 'translator', 'title', 'source'] if k in row}
        for k, v in value.items():
            if k not in {'sourceMetadata', 'metadata'}: yield from manifest_rows(v, context)
    elif isinstance(value, list):
        for v in value: yield from manifest_rows(v, inherited)


ORG = re.compile(r'\b(?:university|society|ministries|ministry|school union|seminary|committee|association|church|synod|convention|board|institute|press|corporation|library|commission|bible project)\b', re.I)


def main():
    REPORT.mkdir(parents=True, exist_ok=True)
    catalog = read(SITE / 'public/content/teacher-library/catalogue.json')
    index = read(SITE / 'content/teachers/field-shelves.json')
    profiles = {p['id']: p for p in read(SITE / 'content/teachers/scholars.json')['scholars']}
    credits = {c['id']: c for c in catalog['contributors']}
    entries = list(index['entries'])
    represented = {cid for p in entries for cid in p['contributorIds']}
    entries += [dict(id=c['id'], name=c['name'], profileId=c.get('profileId'), aliases=[c['name']], contributorIds=[c['id']], fields={}, collections=[], roles=c['roles'], traditions=c['traditions'], supplements=[]) for c in credits.values() if c['id'] not in represented]
    entry_for_credit = {cid: p['id'] for p in entries for cid in p['contributorIds']}
    assert len(entry_for_credit) == len(credits)
    assert sum(len(p['contributorIds']) for p in entries) == len(credits)
    public = {}
    for p in sorted((SITE / 'public/content/teacher-library/records').glob('*.json')): public.update(read(p))
    hashes = {w['sha256'] for w in public.values() if w.get('sha256')}
    public_work_ids = {w['workId'] for w in public.values() if w.get('workId')}
    raw_dates = defaultdict(dict)
    names = defaultdict(set)
    for p in entries:
        for name in [p['name'], *p['aliases']]: names[norm(clean_name(re.sub(r'\s*\[[^]]*\]$', '', name)))].add(p['id'])
    print(f'Loaded {len(public)} packaged records and {len(entries)} contributor entries.', flush=True)
    private_count = 0
    for rid, item in stream_private(SITE / '.local/teacher-library/build-input.json'):
        private_count += 1
        record = public.get(rid)
        if not record: continue
        candidates = {entry_for_credit[cid] for cid in record['contributors'] if cid in entry_for_credit}
        for field, label in labels(item['row']):
            if not re.search(r'\d', label): continue
            key = norm(clean_name(label))
            matches = names.get(key, set()) & candidates
            # Exact name evidence only; do not attach a coauthor's dates to everyone in a volume.
            for eid in matches:
                raw_dates[eid].setdefault(label, {'label': label, 'workId': rid, 'field': field, 'sourceUrl': record.get('sourceUrl'), 'parsed': parse_date(label)})
    print(f'Recovered date evidence from {private_count} private packer inputs.', flush=True)
    facts, date_queue, kind_queue = {}, [], []
    duplicate_groups = defaultdict(list)
    for p in entries:
        profile = profiles.get(p.get('profileId'))
        evidence = list(raw_dates[p['id']].values())
        legacy = sorted({d for cid in p['contributorIds'] for d in credits[cid].get('sourceLifeDates', [])})
        variants = {json.dumps({k: e['parsed'].get(k) for k in ['born', 'died', 'floruit']}, sort_keys=True): e['parsed'] for e in evidence if e['parsed']}
        organization = bool(ORG.search(p['name'])) and not profile
        kind = 'person' if profile else 'organization-candidate' if organization else 'person-candidate' if variants else 'unresolved'
        dates = {'status': 'missing', 'era': None, 'evidence': evidence, 'legacyLabels': legacy}
        if profile:
            dates.update(status='documented-profile', era=profile.get('era') or era(profile['born']), born=profile['born'], died=profile['died'], basis='documented-profile', approximate=bool(profile.get('circa')))
        elif len(variants) == 1 and not organization:
            dates.update(next(iter(variants.values())), status='source-supported')
        elif len(variants) > 1:
            dates.update(status='conflicting')
        elif evidence or legacy:
            dates.update(status='needs-review')
        if dates['status'] in {'conflicting', 'needs-review'}:
            date_queue.append({'id': p['id'], 'name': p['name'], **dates})
        if kind in {'unresolved', 'organization-candidate'}:
            kind_queue.append({'id': p['id'], 'name': p['name'], 'kind': kind, 'basis': 'Source-name organization signal' if organization else 'No verified entity type'})
        cleaned = norm(clean_name(re.sub(r'\s*\[[^]]*\]$', '', p['name'])))
        words = cleaned.split()
        if len(words) % 2 == 0 and words[:len(words)//2] == words[len(words)//2:]: cleaned = ' '.join(words[:len(words)//2])
        duplicate_groups[cleaned].append({'id': p['id'], 'name': p['name'], 'dateLabels': legacy})
        facts[p['id']] = {'kind': kind, 'dates': dates, 'expertise': [profile['field']] if profile else [],
            'expertiseBasis': 'documented-profile' if profile else 'not-established',
            'subjects': {k: {'basis': v['basis'], 'workId': (v.get('example') or {}).get('id')} for k, v in p['fields'].items()},
            'recordedTraditions': p['traditions'], 'faith': profile['faith'] if profile else None,
            'collections': p['collections'], 'sourceContributorIds': p['contributorIds']}
    duplicates = [v for v in duplicate_groups.values() if len(v) > 1]
    for v in duplicates:
        for p in v: facts[p['id']]['identityReview'] = True

    coverage, gaps, unknown_names = {}, {}, defaultdict(lambda: {'labels': set(), 'sources': set(), 'examples': []})
    def inspect(source, key, sha, row, body=True):
        bucket = coverage.setdefault(source, Counter())
        bucket['observations'] += 1
        if not sha:
            bucket['withoutHash'] += 1
            return
        if sha in hashes:
            bucket['representedByRecordedHash'] += 1
            return
        if not body:
            bucket['metadataOrUnclassifiedFile'] += 1
            return
        bucket['unmatchedBodyObservations'] += 1
        gap = gaps.setdefault(sha, {'sha256': sha, 'sources': set(), 'paths': set(), 'titles': set(), 'labels': set()})
        gap['sources'].add(source); gap['paths'].add(str(key)); gap['titles'].add(str(row.get('title', '')))
        for _, label in labels(row):
            gap['labels'].add(label)
            cleaned = norm(clean_name(label))
            if cleaned and cleaned not in names:
                item = unknown_names[cleaned]; item['labels'].add(label); item['sources'].add(source)
                if len(item['examples']) < 3: item['examples'].append({'path': str(key), 'title': row.get('title'), 'sha256': sha})

    stock = ROOT / 'KnowledgeBase/campaign-stocktake/private-catalog.jsonl'
    with stock.open(encoding='utf-8-sig') as f:
        for line in f:
            row = json.loads(line); inspect('campaign-stocktake', row.get('path'), row.get('sha256'), row, bool(row.get('bodyCandidate') or row.get('classification') in {'work_text', 'text', 'body_text'}))
    manifests = sorted((SITE / 'content/library/reports').rglob('acquisition-manifest.json'))
    for path in manifests:
        for row in manifest_rows(read(path)):
            file = row.get('path') or row.get('relativePath')
            body = bool(row.get('bodyCandidate') or row.get('classification') == 'work_text' or Path(str(file)).suffix.lower() in {'.txt', '.pdf', '.html', '.htm', '.epub', '.xml'})
            inspect('acquisition-manifests', file, row.get('sha256') or row.get('originalSha256'), row, body)
    print(f'Reconciled stocktake and {len(manifests)} acquisition manifests.', flush=True)
    db = sqlite3.connect((ROOT / 'KnowledgeBase/knowledge.sqlite3').as_uri() + '?mode=ro', uri=True)
    db.execute('PRAGMA query_only=ON')
    db.execute('BEGIN')
    db_status = dict(db.execute('SELECT status,COUNT(*) FROM library_files GROUP BY status'))
    for path, sha, status, metadata in db.execute('SELECT path,sha256,status,metadata FROM library_files'):
        row = json.loads(metadata); acquisition = row.get('acquisition') or {}
        inspect('knowledge-library-' + status, path, sha, acquisition, status in {'indexed', 'no_text', 'deferred_scan'})
    knowledge_kinds = dict(db.execute('SELECT kind,COUNT(*) FROM documents GROUP BY kind'))
    db.close()
    foundation = sqlite3.connect((ROOT / 'KnowledgeBase/Research Foundation/registry.sqlite3').as_uri() + '?mode=ro', uri=True)
    foundation.execute('PRAGMA query_only=ON'); foundation.execute('BEGIN')
    foundation_counts = dict(foundation.execute('SELECT kind,COUNT(*) FROM entities GROUP BY kind'))
    for path, sha, raw in foundation.execute('SELECT path,sha256,record FROM resources'):
        row = json.loads(raw)
        inspect('research-foundation', path, sha, row.get('metadata') or {}, row.get('bodyCandidate') is True)
    foundation_contributors = []
    for eid, title, raw in foundation.execute("SELECT id,title,record FROM entities WHERE kind='contributor'"):
        item = json.loads(raw)
        if norm(clean_name(title or item.get('name', ''))) not in names:
            foundation_contributors.append({'id': eid, 'name': title, 'record': item})
    foundation.close()
    def serial(item):
        if isinstance(item, set): return sorted(item)
        raise TypeError(type(item).__name__)
    summary = {
        'packagedRecords': len(public), 'packagedDistinctRecordedHashes': len(hashes), 'sourceContributors': len(credits), 'catalogueEntries': len(entries),
        'documentedProfiles': len(profiles), 'legacyDateCredits': sum(bool(c.get('sourceLifeDates')) for c in credits.values()),
        'dateStatus': dict(Counter(f['dates']['status'] for f in facts.values())),
        'eras': dict(Counter(f['dates']['era'] or 'unknown' for f in facts.values())),
        'kinds': dict(Counter(f['kind'] for f in facts.values())),
        'subjectCounts': {k: sum(k in f['subjects'] for f in facts.values()) for k in index['coverage']['fieldCounts']},
        'expertiseCounts': {k: sum(k in f['expertise'] for f in facts.values()) for k in index['coverage']['fieldCounts']},
        'duplicateCandidateGroups': len(duplicates), 'identityReviewEntries': sum(bool(f.get('identityReview')) for f in facts.values()),
        'manifestFiles': len(manifests), 'coverage': coverage, 'knowledgeLibraryStatus': db_status, 'knowledgeDocumentKinds': knowledge_kinds,
        'foundationEntityKinds': foundation_counts, 'unmatchedBodyHashes': len(gaps), 'unmatchedNameCandidates': len(unknown_names),
        'unmatchedFoundationContributorRecords': len(foundation_contributors),
        'unknownAuthorPackagedRecords': sum(not w.get('authors') for w in public.values()),
    }
    source_hashes = {str(p.relative_to(SITE)).replace('\\', '/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in [SITE / 'public/content/teacher-library/catalogue.json', SITE / 'content/teachers/field-shelves.json', SITE / 'content/teachers/scholars.json']}
    public_facts = {'schemaVersion': 1, 'inputs': source_hashes, 'summary': {k: summary[k] for k in ['catalogueEntries', 'sourceContributors', 'documentedProfiles', 'dateStatus', 'eras', 'kinds', 'subjectCounts', 'expertiseCounts', 'identityReviewEntries']}, 'entries': facts}
    public_path = SITE / 'content/teachers/contributor-facts.json'
    text = json.dumps(public_facts, ensure_ascii=False, separators=(',', ':')) + '\n'
    if '--check' in sys.argv:
        assert public_path.read_text('utf-8') == text, 'Contributor facts are stale'
    else:
        public_path.write_text(text, encoding='utf-8')
        for name, value in [('coverage.json', summary), ('date-review.json', date_queue), ('identity-review.json', {'duplicateCandidates': duplicates, 'entityTypes': kind_queue}), ('missing-work-evidence.json', list(gaps.values())), ('missing-contributor-candidates.json', {'names': unknown_names, 'foundation': foundation_contributors})]:
            (REPORT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2, default=serial) + '\n', encoding='utf-8')
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)


if __name__ == '__main__': main()
