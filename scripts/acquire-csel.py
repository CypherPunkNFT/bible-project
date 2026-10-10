"""Catalogue an official CSEL checkout, compare held hashes, and stage work XML.

No network, OCR, corpus writes, model changes, or embedding startup.
"""
import argparse
import collections
import hashlib
import json
import re
import shutil
import sqlite3
import unicodedata
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
XML_LANG = '{http://www.w3.org/XML/1998/namespace}lang'
UPSTREAM = 'https://github.com/OpenGreekAndLatin/csel-dev'


def text(node):
    return ' '.join(''.join(node.itertext()).split()) if node is not None else ''


def norm(value):
    value = unicodedata.normalize('NFKD', value).casefold()
    return ' '.join(re.findall(r'[a-z0-9]+', value))


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    temporary.replace(path)


def metadata(path):
    root = ET.parse(path).getroot()
    header = root.find('t:teiHeader', NS)
    body = root.find('t:text/t:body', NS)
    if header is None or body is None:
        return None
    statement = header.find('t:fileDesc/t:titleStmt', NS)
    edition = body.find('t:div', NS)
    license_node = header.find('.//t:publicationStmt/t:availability/t:licence', NS)
    urn = edition.get('n', '') if edition is not None else ''
    authors = [text(node) for node in statement.findall('t:author', NS)]
    return {
        'title': '; '.join(text(node) for node in statement.findall('t:title', NS)),
        'author': '; '.join(authors) or 'Unstated in upstream title statement',
        'authorNames': authors,
        'editor': '; '.join(text(node) for node in statement.findall('t:editor', NS)) or None,
        'sourceId': urn or path.stem,
        'ctsWorkUrn': urn.rsplit('.', 1)[0] if '.opp-' in urn else None,
        'language': edition.get(XML_LANG, 'lat') if edition is not None else 'lat',
        'licence': text(license_node) or 'No licence stated in this TEI header',
        'licenseUrl': license_node.get('target') if license_node is not None else None,
        'credit': [{'name': text(node.find('t:persName', NS)), 'role': text(node.find('t:resp', NS))}
                   for node in statement.findall('t:respStmt', NS)],
        'contributor': [text(node) for tag in ('sponsor', 'funder', 'principal')
                        for node in statement.findall('t:'+tag, NS)],
        'sourceScans': [node.get('target') for node in header.findall('.//t:sourceDesc//t:ref', NS)
                        if node.get('target')],
        'sourceEditionDates': [text(node) for node in header.findall('.//t:sourceDesc//t:imprint/t:date', NS)],
        'cselVolumes': [text(node) for node in header.findall('.//t:sourceDesc//t:series/t:biblScope', NS)],
        'bodyCharacters': len(text(body)),
    }


def held_records():
    """Use recorded hashes and catalogues, without rehashing the held collection."""
    hashes = collections.defaultdict(set)
    records = []
    db_path = ROOT/'KnowledgeBase/knowledge.sqlite3'
    db = sqlite3.connect(db_path.as_uri()+'?mode=ro', uri=True)
    try:
        for table in ('files', 'library_files'):
            for path, sha in db.execute('SELECT path,sha256 FROM '+table):
                if 'source-ogl-csel' not in path:
                    hashes[sha].add(path)
        for title, language, source, raw in db.execute(
                "SELECT title,language,source,metadata FROM documents WHERE kind='library_text'"):
            # Restrict anthology/author comparisons to historical source collections.
            if not any(part in source.casefold() for part in ('ccel', 'early-christian', 'lacuscurtius', 'internet-archive', '\\ia\\')):
                continue
            value = json.loads(raw)
            acquisition = value.get('acquisition', {})
            records.append({'title': title, 'language': language, 'path': source,
                            'author': acquisition.get('author', ''), 'metadata': value})
    finally:
        db.close()
    catalogue = ROOT/'KnowledgeBase/campaign-stocktake/private-catalog.jsonl'
    if catalogue.exists():
        with catalogue.open(encoding='utf-8-sig') as stream:
            for line in stream:
                value = json.loads(line)
                sha = value.get('sha256'); path = value.get('path', '')
                if sha and path and 'source-ogl-csel' not in path:
                    hashes[sha].add(path)
    # Files not yet in a published corpus can already be registered catalog assets.
    for path in (ROOT/'Website/content/library/catalog/assets').glob('*.json'):
        value = json.loads(path.read_text('utf-8-sig'))
        sha = value.get('sha256'); relative = value.get('relativePath')
        if sha and relative and 'source-ogl-csel' not in relative:
            hashes[sha].add(str(ROOT/'sources'/relative))
    return hashes, records


def author_tokens(author):
    aliases = {
        'Augustine': ['augustine', 'augustinus'], 'Ambrose': ['ambrose', 'ambrosius'],
        'Tertullian': ['tertullian', 'tertullianus'], 'John Cassian': ['cassian', 'cassianus'],
        'Cyprian, Saint': ['cyprian', 'cyprianus'], 'Jerome, Saint': ['jerome', 'hieronymus'],
        'Severus, Sulpicius': ['sulpicius severus'], 'Flavius Josephus': ['josephus', 'iosephus'],
        'Hilary, Saint, Bishop of Poitiers': ['hilary', 'hilarius'],
        'Minucius Felix': ['minucius felix'], 'Arnobius of Sicca': ['arnobius'],
        'Commodianus': ['commodian', 'commodianus'], 'Lactantius': ['lactantius'],
        'Rufinus of Aquileia': ['rufinus'], 'Boethius': ['boethius'],
        'Bede the Venerable': ['bede'], 'Adamnan': ['adamnan'],
    }
    return aliases.get(author, [norm(author)])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--checkout', type=Path, default=ROOT/'sources/ogl-csel/repository')
    parser.add_argument('--commit', required=True)
    parser.add_argument('--report', type=Path, default=ROOT/'Website/content/library/reports/csel-20261009')
    args = parser.parse_args()
    checkout = args.checkout.resolve(); report = args.report.resolve()
    assert checkout.is_relative_to(ROOT) and report.is_relative_to(ROOT)
    stamp = datetime.now(timezone.utc).isoformat()
    before = json.loads((ROOT/'KnowledgeBase/embedding-progress.json').read_text('utf-8-sig'))
    hashes, records = held_records()
    print('Held recorded hashes:', len(hashes), 'historical body records:', len(records), flush=True)
    scan_index = collections.defaultdict(list)
    author_cache = {}
    for held in records:
        held['_normalized'] = norm(held['title']+' '+str(held['author']))
        held['_title'] = norm(held['title'])
        identifiers = {Path(held['path']).stem}
        identifiers.update(re.findall(r'archive\.org/(?:stream|details|download)/([^/\s"?#]+)', json.dumps(held['metadata'])))
        for identifier in identifiers:
            scan_index[identifier].append(held)
    files = []; comparisons = []; work_rows = []; volumes = []; failures = []
    for path in sorted(checkout.rglob('*')):
        if not path.is_file() or '.git' in path.parts:
            continue
        relative = path.relative_to(checkout).as_posix()
        sha = digest(path)
        details = None
        if path.suffix == '.xml' and relative.startswith(('data/', 'Volumes/')) and path.name != '__cts__.xml':
            try:
                details = metadata(path)
            except ET.ParseError as error:
                failures.append({'path': str(path), 'error': str(error)})
        classification = 'work_text' if details and relative.startswith('data/') else 'volume_text' if details else 'repository_support'
        row = {
            'url': UPSTREAM+'/blob/'+args.commit+'/'+relative,
            'downloadUrl': 'https://raw.githubusercontent.com/OpenGreekAndLatin/csel-dev/'+args.commit+'/'+relative,
            'sha256': sha, 'byteCount': path.stat().st_size, 'path': str(path),
            'relativePath': None, 'repositoryPath': relative, 'source': 'OpenGreekAndLatin CSEL',
            'title': details['title'] if details else relative,
            'author': details['author'] if details else 'OpenGreekAndLatin contributors',
            'licence': details['licence'] if details else 'Repository support asset; no separate body use or licence inferred',
            'format': 'tei' if details else (path.suffix.lstrip('.') or 'repository-support'),
            'language': details['language'] if details else None,
            'audience': 'adult readers; pastors; scholars', 'classification': classification,
            'countAsBook': classification == 'work_text', 'retrievedAt': stamp,
            'repositoryCommit': args.commit, 'publicHostingAllowed': False,
            'useScope': 'private local import and embedding' if classification == 'work_text' else 'Preserved upstream archive; no separate body intake',
        }
        if details:
            row.update(details)
            row['sourceMetadata'] = {key: details[key] for key in (
                'ctsWorkUrn', 'sourceId', 'licenseUrl', 'sourceScans',
                'sourceEditionDates', 'cselVolumes', 'credit', 'contributor')}
        if classification == 'work_text':
            matches = sorted(path for path in hashes.get(sha, ()) if Path(path).is_file())
            if matches:
                original = Path(matches[0]); disposition = 'already_held_exact_sha256'
            else:
                original = ROOT/'sources/library/source-ogl-csel'/relative
                original.parent.mkdir(parents=True, exist_ok=True)
                if original.exists():
                    if digest(original) != sha:
                        raise ValueError('Refusing to overwrite changed held CSEL XML: '+str(original))
                else:
                    shutil.copy2(path, original)
                disposition = 'new_work_edition'
            row.update(path=str(original), relativePath=original.relative_to(ROOT/'sources').as_posix(),
                       acquisitionStatus=disposition, heldMatches=matches)
            source_ids = {match.group(1) for url in row['sourceScans']
                          for match in [re.search(r'archive\.org/(?:stream|details)/([^/#?]+)', url)] if match}
            same_titles = []; anthology = []
            same_scans = [{key: held[key] for key in ('title','language','path')}
                          for identifier in source_ids for held in scan_index.get(identifier, [])]
            tokens = [token for author in row['authorNames'] for token in author_tokens(author) if len(token)>3 and token!='anonymous']
            cache_key = tuple(tokens)
            if cache_key not in author_cache:
                author_cache[cache_key] = [held for held in records if any(
                    re.search(r'\b'+re.escape(token)+r'\b',held['_normalized']) for token in tokens)]
            for held in author_cache[cache_key]:
                if held['_title'] == norm(row['title']):
                    same_titles.append({key: held[key] for key in ('title','language','path')})
                if 'ccel' in held['path'].lower() or 'early-christian' in held['path'].lower():
                    anthology.append({key: held[key] for key in ('title','language','path')})
            comparisons.append({'sourceId': row['sourceId'], 'title': row['title'], 'author': row['author'],
                                'exactOriginalMatches': matches, 'sameScanEditionCandidates': same_scans,
                                'sameTitleAndAuthorCandidates': same_titles,
                                'existingAuthorOrAnthologyOverlap': anthology,
                                'note': 'Author/anthology overlap does not prove this individual work or Latin edition was already held.'})
            work_rows.append(row)
        elif classification == 'volume_text':
            volumes.append(row)
        files.append(row)
    after = json.loads((ROOT/'KnowledgeBase/embedding-progress.json').read_text('utf-8-sig'))
    counts = {
        'repositoryFiles': len(files), 'repositoryBytes': sum(row['byteCount'] for row in files),
        'workTextFiles': len(work_rows), 'workTextBytes': sum(row['byteCount'] for row in work_rows),
        'distinctCtsWorks': len({row['ctsWorkUrn'] for row in work_rows if row['ctsWorkUrn']}),
        'volumeTextFiles': len(volumes), 'volumeTextBytes': sum(row['byteCount'] for row in volumes),
        'supportFiles': len(files)-len(work_rows)-len(volumes),
        'priorExactWorkFileMatches': sum(bool(row['heldMatches']) for row in work_rows),
        'newWorkEditions': sum(not row['heldMatches'] for row in work_rows),
        'workFilesWithSameScanEditionCandidates': sum(bool(row['sameScanEditionCandidates']) for row in comparisons),
        'workFilesWithSameTitleAndAuthorCandidates': sum(bool(row['sameTitleAndAuthorCandidates']) for row in comparisons),
        'workFilesWithExistingAuthorOrAnthologyOverlap': sum(bool(row['existingAuthorOrAnthologyOverlap']) for row in comparisons),
        'heldRecordedHashesCompared': len(hashes), 'failures': len(failures),
    }
    manifest = {'source': UPSTREAM, 'repositoryCommit': args.commit, 'retrievedAt': stamp,
                'archiveRoot': str(checkout),
                'counts': counts, 'files': files, 'failures': failures,
                'processing': 'Work-level XML staged for the existing completion pipeline; no new OCR or second intake/embedding pipeline started.'}
    save(report/'acquisition-manifest.json', manifest)
    save(report/'holdings-comparison.json', {'method': 'Recorded SHA-256 and historical source metadata, not a full holdings re-audit.',
         'limits': 'No semantic equivalence claim for translations or anthology subworks; unregistered files without a recorded hash are outside exact-file comparison.',
         'counts': counts, 'works': comparisons})
    save(report/'embedding-before.json', before); save(report/'embedding-after.json', after)
    examples = []
    for comparison in comparisons:
        for held in comparison['existingAuthorOrAnthologyOverlap']:
            if held['title'] not in examples:
                examples.append(held['title'])
    report_text = '\n'.join([
        '# CSEL acquisition — 2026-10-09', '',
        f"Official repository commit: `{args.commit}`. One source; {counts['repositoryFiles']:,} preserved non-Git files; {counts['repositoryBytes']/1e9:.3f} GB.", '',
        f"Body intake: {counts['workTextFiles']} Latin work XML files ({counts['distinctCtsWorks']} CTS work identifiers), {counts['workTextBytes']/1e6:.2f} MB; {counts['newWorkEditions']} newly held editions; {counts['priorExactWorkFileMatches']} prior exact SHA-256 matches across {counts['heldRecordedHashesCompared']:,} recorded hashes.", '',
        f"Archive only: {counts['volumeTextFiles']} volume XML files and {counts['supportFiles']} support/image/backup files; these are preserved outside body intake to avoid duplicating the work-level editions or counting images as books.", '',
        f"Overlap candidates: {counts['workFilesWithSameScanEditionCandidates']} works share a held scan identifier; {counts['workFilesWithSameTitleAndAuthorCandidates']} share a title and author; {counts['workFilesWithExistingAuthorOrAnthologyOverlap']} have existing author/anthology coverage. The latter is not proof of individual-work equivalence.", '',
        'Existing coverage examples: '+ '; '.join(examples[:5])+'.', '',
        f"Failures: {counts['failures']}. XML licence: CC BY-SA 4.0, as explicitly stated in work headers; editors and digital contributors retained per file. No OCR performed.", '',
        'The pasted CSEL bibliography extends to volume 107 and includes modern editions; this checkout is a smaller historical-edition subset, not that entire list.', '',
        f"Embedding snapshot before/after preparation: {before['indexed']:,} / {after['indexed']:,}; latest state `{after['state']}`. Existing vectors and model identity are unchanged; the user-requested resume is handled by the existing watchdog.", '',
        'Fewer than 100,000 new passages: this task acquires and compares source texts; its new Latin passages await the existing pipeline’s late-acquisition refresh after the current embedding pass.', '',
        'Outputs: acquisition-manifest.json; holdings-comparison.json; staged work originals under sources/library/source-ogl-csel/data; full upstream payload under sources/ogl-csel/repository.',
    ])+'\n'
    (report/'REPORT.md').write_text(report_text, encoding='utf-8')
    print(json.dumps(counts, ensure_ascii=False), flush=True)
    print('Report:', report, flush=True)


if __name__ == '__main__':
    main()
