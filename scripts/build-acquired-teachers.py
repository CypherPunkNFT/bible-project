"""Reconcile held teacher/contributor metadata and build first-party reading copies.

Reads recorded manifests and existing extraction caches; never writes intake state.
Unknown biography stays unknown. Public text requires a recorded usable licence.
"""
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter, defaultdict
import hashlib
import json
import os
import re
import shutil
import sys
import unicodedata

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
sys.path.insert(0, str(SITE))
from knowledge.library import objects
from knowledge.library_extract import extract, VERSION

OUT = SITE / '.local/teacher-library-unpacked'
PRIVATE = SITE / '.local/teacher-library'
REPORT = ROOT / 'Research/Teachers-library-update'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8', newline='\n')


def key(value):
    value = unicodedata.normalize('NFKD', value).casefold()
    return re.sub(r'[^a-z0-9]+', ' ', ''.join(c for c in value if not unicodedata.combining(c))).strip()


def name(value):
    value = str(value or '').split('\n')[0].strip()
    value = re.sub(r'\([^)]*\)', '', value)
    value = re.split(r',?\s+(?:\d{3,4}|d\. |b\. |fl\. )', value)[0].strip(' .,')
    value = re.sub(r'\s+(?:aut|edt|trl)\.?$', '', value).strip(' .,')
    if ',' in value:
        bits = value.split(',')
        if len(bits) == 2:
            value = bits[1].strip() + ' ' + bits[0].strip()
    value = re.sub(r'\s+', ' ', value).strip()
    if not value or len(value) > 95 or re.search(r'unknown|unattributed|anonymous|not individually|various|contributors|author id|author not|catalogue|unrecorded|individual bylines|multiple authors', value, re.I):
        return None
    return value


def local_path(row):
    raw = row.get('path') or row.get('relativePath') or row.get('sourceRelativePath')
    if not isinstance(raw, str):
        return None
    p = Path(raw)
    if not p.is_absolute():
        p = (ROOT / 'sources' if raw.replace('\\', '/').startswith('library/') else SITE) / p
    p = p.resolve()
    if not p.is_relative_to((ROOT / 'sources/library').resolve()):
        return None
    return p


def body(row, path):
    if not path or path.suffix.lower() not in {'.txt', '.xml', '.html', '.htm', '.epub', '.pdf'}:
        return False
    if any(x in path.name.lower() for x in ['provenance', 'metadata', '__cts__', '_scandata']):
        return False
    classification = row.get('classification', '')
    if classification and classification not in {'work_text', 'ready_text', 'body_text', 'text'}:
        return False
    return bool(row.get('bodyCandidate') or classification == 'work_text' or row.get('sha256'))


def allowed(row):
    # Some campaign IA records contain inconsistent item titles/attributions.
    # Retain the recorded provenance, but don't publish a reading copy on those
    # records until the item identity and edition rights have been reconciled.
    if row.get('source') == 'ia' and row.get('reviewStatus') != 'public-edition-verified':
        return False
    licence = str(row.get('licence') or row.get('license') or row.get('rightsCategory') or '')
    licence_url = str(row.get('licenseUrl') or '')
    actions = row.get('rights', {}).get('actions', {}) if isinstance(row.get('rights'), dict) else {}
    if row.get('publicHostingAllowed') is True or actions.get('host') == 'allowed':
        return True
    lower = (licence + ' ' + licence_url).lower()
    # Old publicHostingAllowed=False recorded the earlier owner's private-only
    # decision. This request authorises on-site copies where the actual licence
    # permits them, preserving all attribution and the same licence.
    if 'creativecommons.org/licenses/by-sa/' in lower or 'creativecommons.org/licenses/by/' in lower:
        return not any(x in lower for x in ['/by-nc', '/by-nd', 'noncommercial', 'non-commercial', 'no derivatives'])
    if re.search(r'\bcc0\b|creativecommons.org/publicdomain/zero', lower):
        return True
    return 'public domain' in lower and not re.search(r'private|personal|underlying|unclear|copyright retained|translation.*copyright|electronic.edition', lower)


def blocks(row, path):
    sha = row['sha256']
    fmt = str(row.get('format') or path.suffix.lstrip('.'))
    cachekey = hashlib.sha256((VERSION + sha + sha + fmt).encode()).hexdigest()
    cache = ROOT / 'KnowledgeBase/extracted-library' / (cachekey + '.jsonl')
    if cache.exists():
        with cache.open(encoding='utf-8') as stream:
            yield from (json.loads(line) for line in stream if line.strip())
    else:
        yield from extract(path, fmt)


def prepare_text(row, path, record):
    existing = OUT / 'text' / record['id']
    if existing.is_dir():
        pages = list(existing.glob('*.json'))
        if pages and all((existing / f'{n}.json').is_file() for n in range(len(pages))):
            record['pages'] = len(pages)
            record['availability'] = 'on-site-text'
            return
    pages, current, size = [], [], 0
    def flush():
        nonlocal current, size
        if current:
            pages.append(current)
            current, size = [], 0
    for block in blocks(row, path):
        text = block.get('text', '')
        if not isinstance(text, str) or not text.strip():
            continue
        # Preserve extracted text and genuine locators; render as React text.
        for start in range(0, len(text), 12000):
            part = text[start:start + 12000]
            if size + len(part) > 48000:
                flush()
            current.append({'locator': block.get('locator', path.name), 'text': part})
            size += len(part)
    flush()
    for number, parts in enumerate(pages):
        write(OUT / 'text' / record['id'] / f'{number}.json', {'blocks': parts})
    record['pages'] = len(pages)
    record['availability'] = 'on-site-text' if pages else 'text-unavailable'


def main():
    try:
        import ctypes
        ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)
    except (ImportError, AttributeError):
        pass
    authors = []
    for f in [SITE / 'content/library/authors.json', *sorted((SITE / 'content/library/registry-extensions').glob('*.json'))]:
        authors.extend(read(f).get('authors', []))
    lives = read(SITE / 'content/teachers/lives.json')['people']
    scholars = read(SITE / 'content/teachers/scholars.json')['scholars']
    aliases, identities = {}, {}
    for a in authors:
        label = {'id': a['id'], 'name': a['name'], 'side': 'preachers' if a.get('eligibility') == 'eligible' else 'scholars', 'traditions': a.get('traditions', []), 'profileId': a['id'] if a['id'] in lives else None}
        identities[a['id']] = label
        for value in [a['name'], *a.get('aliases', [])]:
            if name(value): aliases[key(name(value))] = a['id']
    for s in scholars:
        ident = aliases.get(key(name(s['name']) or s['name'])) or 'scholar-' + s['id']
        identities[ident] = {'id': ident, 'name': s['name'], 'side': 'scholars', 'traditions': [s['faith']], 'profileId': s['id']}
        for value in [s['name'], s['short']]: aliases[key(name(value) or value)] = ident
    # The owner's Baptist campaign selection, without inventing biographies.
    for label in read(SITE / 'content/teachers/acquired-selection.json')['preachers']:
        ident = aliases.get(key(label)) or 'contributor-' + hashlib.sha256(key(label).encode()).hexdigest()[:20]
        aliases[key(label)] = ident
        identities[ident] = identities.get(ident, {'id':ident,'name':label,'traditions':[],'profileId':None}) | {'side':'preachers'}
    # These are recorded aliases of existing people, not a fuzzy name join.
    for alias, ident in {'Charles Haddon Spurgeon':'author-charles-spurgeon','Charles H. Spurgeon':'author-charles-spurgeon','Dwight Lyman Moody':'author-d-l-moody','W. A. Criswell':'author-w-a-criswell','William A. Criswell':'author-w-a-criswell','Augustinus':'scholar-augustine','Aurelius Augustinus':'scholar-augustine','Thomas Aquinas':'scholar-aquinas'}.items():
        if ident in identities: aliases[key(alias)] = ident
    # Canonical works all receive an internal record. No external reading fallback.
    works, editions, url_to_work, assets = {}, {}, {}, []
    for f in sorted((SITE / 'content/library/catalog/works').glob('*.json')):
        w = read(f); works[w['id']] = w
    for f in sorted((SITE / 'content/library/catalog/editions').glob('*.json')):
        e = read(f); editions[e['id']] = e
    for f in sorted((SITE / 'content/library/catalog/assets').glob('*.json')):
        a = read(f); assets.append(a)
        wid = editions.get(a.get('editionId'), {}).get('workId')
        if wid:
            for u in [a.get('canonicalUrl'), a.get('finalUrl')]:
                if u: url_to_work[u] = wid
    rows = {}
    stock = ROOT / 'KnowledgeBase/campaign-stocktake/private-catalog.jsonl'
    with stock.open(encoding='utf-8-sig') as stream:
        for line in stream:
            row = json.loads(line); p = local_path(row)
            if body(row, p): rows[str(p)] = row
    manifests = sorted((SITE / 'content/library/reports').rglob('acquisition-manifest.json'))
    overlay = SITE / 'content/library/reports/campaign-reconciliation/catalogue/acquisition-manifest.json'
    # Match intake's documented precedence: reconciled attribution wins over
    # historical acquisition ledgers, without changing either source.
    if overlay in manifests:
        manifests.remove(overlay)
        manifests.append(overlay)
    for f in manifests:
        for row in objects(read(f)):
            p = local_path(row)
            if body(row, p): rows[str(p)] = rows.get(str(p), {}) | {k:v for k,v in row.items() if v is not None}
    # Late collectors have per-original provenance, including Criswell's full run.
    for folder, author in [('source-billy-graham', 'Billy Graham'), ('source-criswell', 'W. A. Criswell')]:
        for f in sorted((ROOT / 'sources/library' / folder).rglob('*provenance*.json')):
            meta = read(f)
            candidates = [f.with_name(f.name.replace('.provenance.json', ''))]
            if f.name == 'provenance.json': candidates = [p for p in f.parent.iterdir() if p.suffix.lower() in {'.html','.pdf','.txt','.epub'}]
            for p in candidates:
                if not p.is_file(): continue
                title = meta.get('title') or meta.get('sourceMetadata', {}).get('title')
                if not title:
                    u = meta.get('url','')
                    slug = u.rstrip('/').split('/')[-1]
                    title = slug.replace('-', ' ').title() if slug else p.parent.name
                row = meta | {'path':str(p), 'author':author, 'title':title, 'bodyCandidate':True, 'source':folder}
                rows[str(p)] = rows.get(str(p), {}) | row
    # Distinguish unprofiled homonyms when the source supplies different life
    # dates. Undated rows stay separate rather than being assigned a guessed life.
    date_variants = defaultdict(set)
    for row in rows.values():
        for field in ['author', 'authorNames', 'editor', 'translator']:
            values = row.get(field, [])
            for label in values if isinstance(values, list) else re.split(r';\s*', str(values or '')):
                clean = name(label)
                dates = re.findall(r'(?<!\d)(\d{3,4})(?!\d)', str(label or ''))
                if clean and dates:
                    date_variants[key(clean)].add('–'.join(dates))
    records, private, contributors, by_contributor = {}, {}, {}, defaultdict(list)
    route_by_work, seen, failures = {}, set(), []
    unknown = missing = 0
    def contributor(label, role):
        clean = name(label)
        if not clean: return None
        norm = key(clean)
        ident = aliases.get(norm)
        # A surname/name alone must not merge the poet John Owen with the
        # theologian, or the mathematician John Newton with the hymn writer.
        # Preserve source life dates as identity evidence before cleaning names.
        dates = re.findall(r'(?<!\d)(\d{3,4})(?!\d)', str(label or ''))
        if ident and identities[ident].get('profileId'):
            profile = identities[ident]['profileId']
            known = lives.get(profile) or next((s for s in scholars if s['id']==profile), {})
            expected = known.get('died') if re.search(r'\bd\.', str(label)) and len(dates)==1 else known.get('born')
            if dates and expected and abs(int(dates[0])-expected)>2:
                norm += ' source life dates ' + ' '.join(dates)
                clean += ' [' + '–'.join(dates) + ']'
                ident = None
        elif len(date_variants[norm]) > 1:
            evidence = '–'.join(dates) if dates else 'dates unrecorded'
            norm += ' source life dates ' + evidence
            clean += ' [' + evidence + ']'
            ident = aliases.get(norm)
        if not ident:
            ident = 'contributor-' + hashlib.sha256(norm.encode()).hexdigest()[:20]
            aliases[norm] = ident
            identities[ident] = {'id':ident,'name':clean,'side':'scholars','traditions':[],'profileId':None}
        entry = contributors.setdefault(ident, identities[ident] | {'roles':[], 'records':0, 'readable':0})
        if dates:
            evidence = '–'.join(dates)
            entry.setdefault('sourceLifeDates', [])
            if evidence not in entry['sourceLifeDates']: entry['sourceLifeDates'].append(evidence)
        if role not in entry['roles']: entry['roles'].append(role)
        return ident
    for pathstr, row in sorted(rows.items()):
        p = Path(pathstr)
        sha = row.get('sha256') or row.get('originalSha256')
        if not sha or not re.fullmatch('[0-9a-fA-F]{64}', sha):
            missing += 1; continue
        if sha in seen: continue
        if not p.is_file(): missing += 1; continue
        title = str(row.get('title') or '').strip()
        if not title: missing += 1; continue
        seen.add(sha)
        rid = 'held-' + sha[:32]
        source = str(row.get('source') or p.relative_to(ROOT / 'sources/library').parts[0])
        source_url = row.get('url') or row.get('canonicalUrl') or row.get('finalUrl') or row.get('sourcePage')
        if not isinstance(source_url, str) or not re.match(r'^https?://', source_url): source_url = None
        wid = row.get('workId') or row.get('originalWorkId') or url_to_work.get(row.get('url')) or url_to_work.get(row.get('finalUrl'))
        author_ids = []
        for label in row.get('authorNames') or re.split(r';\s*', str(row.get('author') or '')):
            if not re.search(r'\d{4}', str(label)):
                dated = next((part for part in re.split(r';\s*', str(row.get('author') or '')) if name(part)==name(label) and re.search(r'\d{4}', part)),None)
                label = dated or label
            ident = contributor(label, 'author')
            if ident and ident not in author_ids: author_ids.append(ident)
        if not author_ids: unknown += 1
        credits = []
        for role in ['editor','translator']:
            for label in row.get(role, []) if isinstance(row.get(role), list) else re.split(r';\s*', str(row.get(role) or '')):
                ident = contributor(label, role)
                if ident: credits.append(ident)
        # Only explicitly named contributors are catalogued; credited digital roles
        # are retained on the edition without inventing biography or faith.
        record = {'id':rid,'title':title,'authors':[contributors[i]['name'] for i in author_ids], 'contributors':author_ids + credits,
                  'language':row.get('language') or 'und','source':source,'sourceId':row.get('sourceId'),
                  'sourceUrl':source_url,
                  'licence':row.get('licence') or row.get('license') or row.get('licenseUrl') or row.get('rightsCategory') or 'Public display permission not established',
                  'credit':row.get('credit') or row.get('contributor'), 'editors':[contributors[i]['name'] for i in credits], 'licenseUrl':row.get('licenseUrl'), 'sha256':sha,
                  'genre':row.get('genre') or ('sermon' if 'criswell' in source or 'graham' in source and p.suffix.lower() in {'.html','.txt'} else 'text'),
                  'workId':wid if wid in works else None, 'editionId':row.get('editionId'),
                  'availability':'identity-review' if source=='ia' and row.get('reviewStatus')!='public-edition-verified' else 'permission-required','pages':0,'reviewWarning':None}
        if any(any('catholic' in t.lower() for t in identities[i]['traditions']) for i in author_ids) or 'summa' in p.name.lower():
            record['reviewWarning']='Catholic source: review doctrinal claims, including justification and Marian teachings, against the project standard; assess philosophical arguments separately. Review topics do not imply every author holds every listed position.'
        public = allowed(row)
        if public:
            try: prepare_text(row, p, record)
            except Exception as exc: record['availability']='text-unavailable'; failures.append({'id':rid,'error':str(exc)[:250]})
        else:
            stale = (OUT / 'text' / rid).resolve()
            if stale.is_dir():
                if not stale.is_relative_to((OUT / 'text').resolve()): raise ValueError('Unexpected output path')
                shutil.rmtree(stale)
        records[rid] = record
        private[rid] = {'path':pathstr,'row':row,'authors':author_ids,'workId':record['workId']}
        for ident in dict.fromkeys(author_ids + credits):
            by_contributor[ident].append(rid)
            contributors[ident]['records'] += 1
            contributors[ident]['readable'] += record['availability'] == 'on-site-text'
        if record['workId'] and (record['workId'] not in route_by_work or record['availability'] == 'on-site-text'):
            route_by_work[record['workId']] = rid
    # Join an edition to canonical works only on the same identified author and
    # exact normalised title. Never redirect to a merely similar book.
    title_index = {}
    for ident, ids in by_contributor.items():
        for rid in ids:
            if records[rid]['availability'] == 'on-site-text':
                title_index.setdefault((ident,key(records[rid]['title'])),rid)
    for wid,w in works.items():
        for c in w.get('creators',[]):
            rid = title_index.get((c['authorId'],key(w['title'])))
            if rid and (wid not in route_by_work or records[route_by_work[wid]]['availability']!='on-site-text'):
                route_by_work[wid] = rid
    # Canonical records preserve identities even where a public body is pending.
    for wid,w in works.items():
        if wid in route_by_work: continue
        rid = wid
        records[rid] = {'id':rid,'title':w['title'],'authors':[identities[c['authorId']]['name'] for c in w.get('creators',[]) if c['authorId'] in identities],
                        'contributors':[c['authorId'] for c in w.get('creators',[])], 'language':'und','source':'Canonical library catalogue',
                        'sourceId':None,'sourceUrl':next((e.get('url') for e in w.get('evidence',[]) if str(e.get('url','')).startswith('https://')),None),
                        'licence':'Public display permission not established','credit':None,'sha256':None,'genre':w.get('genre','text'),
                        'workId':wid,'editionId':None,'availability':'not-published','pages':0,'reviewWarning':None}
        route_by_work[wid] = rid
    # Small metadata shards avoid one browser download containing every work.
    shards = defaultdict(dict)
    for rid, record in records.items():
        shard = hashlib.sha256(rid.encode()).hexdigest()[:2]
        shards[shard][rid] = record
    for shard, rows_ in shards.items(): write(OUT / 'records' / (shard + '.json'), rows_)
    for ident, ids in by_contributor.items():
        write(OUT / 'contributors' / (ident + '.json'), [{k:records[rid][k] for k in ['id','title','language','source','availability','genre']} for rid in ids])
    ordered = sorted(contributors.values(), key=lambda c:c['name'].casefold())
    write(PRIVATE / 'teacher-input.json', {
        'addresses': {wid:'/teachers/works/'+rid for wid,rid in route_by_work.items() if records[rid]['availability']=='on-site-text'},
        'contributors': [c | {'titles':[records[r]['title'] for r in by_contributor[c['id']]],
                              'titleRoutes':{records[r]['title']:'/teachers/works/'+r for r in by_contributor[c['id']] if records[r]['availability']=='on-site-text'}} for c in ordered if c.get('profileId')]
    })
    summary = {'schemaVersion':1,'updatedAt':datetime.now(timezone.utc).isoformat(), 'heldTextRecords':len(private),
               'onSiteTexts':sum(v['availability']=='on-site-text' for v in records.values()), 'contributors':ordered,
               'unknownAuthorRecords':unknown,'missingMetadataOrFileRecords':missing,'extractionFailures':len(failures),
               'workRecordCount':len(records), 'ambiguousSourceNames':sum(len(v)>1 for v in date_variants.values()),
               'counting':'Held text representations, not distinct books or works. Contributor roles and source life-date labels are recorded separately; biography and faith remain unknown unless already documented.'}
    write(OUT / 'catalogue.json', summary)
    write(PRIVATE / 'build-input.json', {'private':private,'routes':route_by_work,'records':records,'contributors':ordered})
    write(REPORT / 'summary.json', {k:v for k,v in summary.items() if k!='contributors'} | {'namedContributors':len(ordered),'preacherContributors':sum(c['side']=='preachers' for c in ordered),'scholarContributors':sum(c['side']=='scholars' for c in ordered),'failures':failures})
    print(json.dumps({k:v for k,v in read(REPORT/'summary.json').items() if k!='failures'}))


if __name__ == '__main__': main()
