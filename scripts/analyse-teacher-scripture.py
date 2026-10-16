"""CPU-only evidence analysis of the 39 profiled teachers lacking main-text mappings.

Reads intake metadata and existing extracted text, with local extraction fallback.
Writes only its own analysis directory. No models, vector access, corpus writes,
OCR, network requests, publication, recurring tasks, or automatic chart promotion.
Run using the Bible KnowledgeBase venv; --launch starts one hidden finite worker.
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
import time
from datetime import datetime, timezone

SITE = Path(__file__).resolve().parents[1]
STATE = SITE.parent / 'KnowledgeBase'
sys.path.insert(0, str(SITE / 'scripts'))
sys.path.insert(0, str(SITE))
from bible.study_refs import BOOK_BY_NAME, BOOK_NAME, RefError, Verses, normalise_book, parse_refs


def now():
    return datetime.now(timezone.utc).isoformat()


def read(file):
    return json.loads(Path(file).read_text(encoding='utf-8-sig'))


def write(file, value):
    file = Path(file)
    file.parent.mkdir(parents=True, exist_ok=True)
    tmp = file.with_suffix(file.suffix + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tmp.replace(file)


def name_key(value):
    value = re.sub(r'\([^)]*\)', '', str(value))
    value = re.split(r',?\s+(?:\d{3,4}|b\.|d\.|fl\.)', value)[0].strip(' .,')
    if value.count(',') == 1:
        last, first = value.split(',')
        value = first.strip() + ' ' + last.strip()
    return re.sub(r'[^a-z0-9]', '', value.casefold())


def identities(people):
    registry = {}
    files = [SITE / 'content/library/authors.json', *sorted((SITE / 'content/library/registry-extensions').glob('*.json'))]
    for file in files:
        for row in read(file).get('authors', []):
            registry[row['id']] = row
    aliases = collections.defaultdict(set)
    for ident, row in registry.items():
        for label in [row['name'], *row.get('aliases', [])]:
            if isinstance(label, str):
                aliases[name_key(label)].add(ident)
    for p in people:
        aliases[name_key(p['name'])].add(p['id'])
    # A token is usable only if it resolves to exactly one registry identity.
    return registry, {label: next(iter(ids)) for label, ids in aliases.items() if len(ids) == 1}


def authors_of(metadata, aliases):
    work = metadata.get('work') or {}
    primary = {c['authorId'] for c in work.get('creators', []) if c.get('authorId') and c.get('role', 'author') in ('author', 'attributed-author')}
    acquisition = metadata.get('acquisition') or {}
    extra, labels = set(), []
    author_id = acquisition.get('authorId')
    if isinstance(author_id, str):
        extra.add(author_id)
    for field in ['author', 'authors']:
        raw = acquisition.get(field)
        if isinstance(raw, str):
            labels.extend(re.split(r'\s*[;|]\s*', raw))
        elif isinstance(raw, list):
            labels.extend(x.get('name', '') if isinstance(x, dict) else x for x in raw)
    sm = acquisition.get('sourceMetadata') or {}
    if isinstance(sm, dict):
        for a in sm.get('authors') or []:
            if isinstance(a, dict):
                labels.append(a.get('name', ''))
    unresolved = []
    for label in labels:
        if not isinstance(label, str) or not label.strip():
            continue
        match = aliases.get(name_key(label))
        if match:
            extra.add(match)
        else:
            unresolved.append(label)
    # Mixed source bylines are retained even when a canonical parent lists one creator.
    matched = primary | extra
    mixed = len(matched) > 1 or bool(unresolved and (primary or extra))
    return matched, primary, mixed, unresolved


def roman_number(value):
    if value.isdigit():
        return value
    value = value.upper()
    numbers = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    result, previous = 0, 0
    for char in reversed(value):
        number = numbers[char]
        result += -number if number < previous else number
        previous = max(previous, number)
    # Refuse malformed Roman numeral sequences.
    def encode(n):
        s = ''
        for v, token in [(1000,'M'),(900,'CM'),(500,'D'),(400,'CD'),(100,'C'),(90,'XC'),(50,'L'),(40,'XL'),(10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')]:
            while n >= v:
                n -= v
                s += token
        return s
    if not result or encode(result) != value:
        raise RefError('Malformed Roman numeral: ' + value)
    return str(result)


forms = set(BOOK_NAME.values())
for alias in BOOK_BY_NAME:
    if len(alias) >= 3 and not alias[0].isdigit():
        forms.add(alias)
forms.update(['Ps', 'Ex', 'Mt', 'Jn', 'Lk', 'Eccles', 'Cant', 'Canticles'])
for numeral, book in [('1','Samuel'),('2','Samuel'),('1','Kings'),('2','Kings'),('1','Chronicles'),('2','Chronicles'),('1','Corinthians'),('2','Corinthians'),('1','Thessalonians'),('2','Thessalonians'),('1','Timothy'),('2','Timothy'),('1','Peter'),('2','Peter'),('1','John'),('2','John'),('3','John')]:
    for prefix in [numeral, 'I' * int(numeral)]:
        for b in [book, book[:3], book[:4]]:
            forms.add(prefix + ' ' + b)
book_pattern = '|'.join(re.escape(f).replace(r'\ ', r'\s*') for f in sorted(forms, key=len, reverse=True))
num = r'(?:\d{1,3}|[ivxlcdm]{1,8})'
REFERENCE = re.compile(r'(?<![\w])(?P<book>' + book_pattern + r')\.?\s*(?P<chapter>' + num + r')\s*[:.]\s*(?P<verse>' + num + r')(?:\s*[-–—]\s*' + num + r'(?:\s*[:.]\s*' + num + r')?)?(?:\s*[,]\s*' + num + r'(?:\s*[-–—]\s*' + num + r')?)*(?:\s+(?:and|&)\s+' + num + r')?(?:\s+f{1,2}\.)?(?![\w])', re.I)


def normalize_reference(raw):
    match = REFERENCE.fullmatch(raw)
    if not match:
        raise RefError('Unsupported reference form')
    book = match.group('book')
    book = {'eccles': 'Ecclesiastes', 'cant': 'Song of Solomon'}.get(book.lower(), book)
    code = normalise_book(book)
    tail = raw[match.end('book'):].lstrip('. ')
    tail = tail.replace('–', '-').replace('—', '-').replace('&', ',')
    tail = re.sub(r'\s+and\s+', ',', tail, flags=re.I)
    tail = re.sub(r'(?i)\b[ivxlcdm]+\b', lambda m: roman_number(m.group()), tail)
    tail = re.sub(r'(\d+)\s*\.\s*(?=\d)', r'\1:', tail)
    tail = re.sub(r'\s*([:,-])\s*', r'\1', tail)
    return BOOK_NAME[code] + ' ' + tail.strip()


def reference_evidence(text, verses):
    for match in REFERENCE.finditer(text):
        raw = match.group()
        line_start = text.rfind('\n', 0, match.start()) + 1
        line_end = text.find('\n', match.end())
        if line_end < 0:
            line_end = len(text)
        line = text[line_start:line_end].strip()
        prefix = text[max(0, line_start - 180):match.start()]
        context = text[max(0, match.start()-220): min(len(text), match.end()+420)]
        cue = re.search(r'(?i)\b(?:text|scripture|sermon|exposition)\s*[:.\-]?\s*$', prefix)
        standalone = line.strip(' .:;—–-"“”()[]') == raw.strip(' .:;—–-"“”()[]')
        kind = 'heading-candidate' if cue or standalone else 'citation'
        row = {'rawReference':raw, 'offset':match.start(), 'line':line[:500], 'excerpt':context, 'classification':kind, 'reviewStatus':'unreviewed'}
        try:
            normalized = normalize_reference(raw)
            spans = parse_refs(normalized, verses)
            if any(start > end for start, end in spans):
                raise RefError('Reversed reference range')
            row.update(normalizedReference=normalized, ranges=spans, verseValidation='valid')
        except (RefError, KeyError, ValueError) as exc:
            row.update(verseValidation='rejected', reason=str(exc))
        yield row


def snapshot(out, targets, aliases):
    db_path = STATE / 'knowledge.sqlite3'
    db = sqlite3.connect(db_path.as_uri() + '?mode=ro', uri=True, timeout=10)
    db.execute('PRAGMA query_only=ON')
    db.execute('PRAGMA cache_size=-8192')
    rows, totals = [], collections.Counter()
    progress = {'state':'snapshotting', 'startedAt':now(), 'pid':os.getpid(), 'targetTeachers':len(targets), 'mode':'cpu-explicit-references', 'sourceDatabase':str(db_path), 'scope':'Read-only intake snapshot; no vector access or shared-state mutation'}
    write(out / 'progress.json', progress)
    for path, sha, status, doc_id, raw in db.execute('SELECT path,sha256,status,document_id,metadata FROM library_files ORDER BY path'):
        totals['intakeRowsExamined'] += 1
        if totals['intakeRowsExamined'] % 2000 == 0:
            write(out / 'progress.json', progress | dict(totals) | {'updatedAt':now()})
        metadata = json.loads(raw)
        ids, primary, mixed, unresolved = authors_of(metadata, aliases)
        teacher_ids = sorted(ids & targets)
        if not teacher_ids:
            continue
        totals['selectedFiles'] += 1
        rows.append({'path':path, 'sha256':sha, 'status':status, 'documentId':doc_id, 'teacherIds':teacher_ids, 'canonicalAuthorIds':sorted(primary), 'mixedAttribution':mixed, 'unresolvedAuthorLabels':unresolved, 'metadata':metadata})
    db.close()
    # The SQLite read connection is closed before scanning any text.
    write(out / 'inventory.json', {'createdAt':now(), 'count':len(rows), 'counts':dict(totals), 'files':rows})
    return rows, totals, progress


def blocks_for(row):
    metadata = row['metadata']
    cache = Path(metadata.get('extraction_cache') or '')
    if cache.is_file() and cache.resolve().is_relative_to((STATE / 'extracted-library').resolve()):
        with cache.open(encoding='utf-8') as stream:
            for line in stream:
                if line.strip():
                    yield json.loads(line), 'existing-extraction-cache'
        return
    if row['status'] in ('metadata_or_asset', 'error', 'deferred_scan', 'no_text'):
        return
    derivative = metadata.get('derivative')
    source = Path(row['path'])
    if not source.resolve().is_relative_to((SITE.parent / 'sources/library').resolve()):
        raise ValueError('Source path outside held library')
    if not source.exists():
        raise FileNotFoundError(str(source))
    if source.suffix.lower() == '.xml' and not derivative:
        # XML fallback does not require BeautifulSoup or typing_extensions.
        from lxml import etree
        parser = etree.XMLParser(resolve_entities=False, no_network=True, recover=True, huge_tree=True)
        tree = etree.parse(str(source), parser)
        root = tree.getroot()
        bodies = root.xpath('//*[local-name()="body"]')
        selected = bodies[0] if bodies else root
        for element in selected.iter():
            if not isinstance(element.tag, str):
                continue
            tag = etree.QName(element).localname.lower()
            if tag in ('pb','page'):
                element.text = '\n[Source page ' + (element.get('n') or element.get('number') or 'unlabeled') + ']\n'
            elif tag == 'gap':
                element.text = ' [Editorial gap: ' + (element.get('reason') or 'unspecified') + '] '
            elif tag in ('p','div','div1','div2','head','title','l','br','lb','para'):
                element.tail = '\n' + (element.tail or '')
        text = ''.join(selected.itertext())
        yield {'locator':'XML body: ' + source.name, 'text':text}, 'local-cpu-xml-extraction'
        return
    # Cached-text and XML analysis do not import HTML/PDF dependencies.
    from knowledge.library_extract import extract, derivative_blocks
    if derivative and Path(derivative['path']).exists():
        file = Path(derivative['path']).resolve()
        if not file.is_relative_to(SITE) and not file.is_relative_to(SITE.parent / 'sources/library'):
            raise ValueError('Derivative outside allowed library paths')
        iterator = derivative_blocks(file, derivative)
    else:
        iterator = extract(source, (metadata.get('asset') or {}).get('format') or (metadata.get('acquisition') or {}).get('format', ''))
    for block in iterator:
        yield block, 'local-cpu-extraction'


def retry_errors(out):
    """Repair only failed files from the completed snapshot; preserve other evidence."""
    if (out / 'worker.lock').exists():
        raise ValueError('An analysis worker may still be active')
    summary = read(out / 'summary.json')
    if summary.get('state') != 'analysis-complete':
        raise ValueError('Retry requires a completed analysis')
    original = dict(summary)
    write(out / 'summary-before-error-repair.json', original)
    inventory = read(out / 'inventory.json')['files']
    errors = {x['path'] for x in summary['errors']}
    teachers = read(out / 'teacher-summary.json')
    by_teacher = {x['id']:x for x in teachers}
    completed = read(out / 'completed.json')
    verses = Verses(SITE / 'data')
    remaining, repaired = [], []
    for row in inventory:
        if row['path'] not in errors:
            continue
        key = hashlib.sha256((row['path'] + row['sha256']).encode()).hexdigest()
        file = out / 'evidence' / (key + '.json')
        result = read(file)
        previous = dict(result)
        result.update(references=[],textBlocks=0,textCharacters=0,state='analysed')
        result.pop('error',None)
        try:
            for index,(block,method) in enumerate(blocks_for(row)):
                text = block.get('text') or ''
                result['textBlocks'] += 1
                result['textCharacters'] += len(text)
                for ref in reference_evidence(text,verses):
                    if row['mixedAttribution']:
                        ref['classification']='mixed-author-review'
                    ref.update(locator=block.get('locator'),blockIndex=index,extractionMethod=method)
                    result['references'].append(ref)
            if not result['textCharacters']:
                result['state']='text-unavailable'
        except Exception as exc:
            result.update(state='error',error=str(exc))
            remaining.append({'path':row['path'],'error':str(exc)})
        result['reanalysedAt']=now()
        write(file,result)
        def stats(r):
            valid=[x for x in r['references'] if x['verseValidation']=='valid']
            return len(valid),sum(x['classification']=='heading-candidate' for x in valid),len(r['references'])-len(valid),r['textCharacters']
        before,after=stats(previous),stats(result)
        for n,field in enumerate(['referencesValidated','headingCandidates','referencesRejected','textCharactersScanned']):
            summary[field] += after[n]-before[n]
        for ident in row['teacherIds']:
            t=by_teacher[ident]
            t['textFiles'] += bool(result['textCharacters'])-bool(previous['textCharacters'])
            t['references'] += after[0]-before[0]
            t['headingCandidates'] += after[1]-before[1]
            t['errors'] += (result['state']=='error')-(previous['state']=='error')
        completed[key]['state']=result['state']
        if result['state']!='error':
            repaired.append(row['path'])
        print(json.dumps({'retried':row['path'],'state':result['state'],'references':after[0]},ensure_ascii=True),flush=True)
    summary.update(errors=remaining,errorRepairAt=now(),filesRepaired=len(repaired),teachersWithReferences=sum(bool(t['references']) for t in teachers),teachersWithHeadingCandidates=sum(bool(t['headingCandidates']) for t in teachers))
    write(out/'teacher-summary.json',teachers)
    write(out/'completed.json',completed)
    write(out/'error-repair.json',{'finishedAt':now(),'repaired':repaired,'remainingErrors':remaining,'scope':'Only the 16 previously failed XML files; original snapshot and other evidence retained'})
    write(out/'summary.json',summary)
    write(out/'progress.json',summary)


def analyse(out, limit=None):
    out.mkdir(parents=True, exist_ok=True)
    lock = out / 'worker.lock'
    with lock.open('x') as stream:
        stream.write(str(os.getpid()))
    try:
        people = read(SITE / 'src/data/teachers/people.json')['people']
        teachers = [p for p in people if not p['passages']]
        targets = {p['id'] for p in teachers}
        registry, aliases = identities(people)
        verses = Verses(SITE / 'data')
        write(out / 'teachers.json', [{'id':p['id'], 'name':p['name'], 'catalogueWorks':p['works'], 'previousHeldTextCount':p['heldTexts']} for p in teachers])
        inventory, counts, progress = snapshot(out, targets, aliases)
        by_teacher = {p['id']:collections.Counter() for p in teachers}
        completed = {}
        checkpoint = out / 'completed.json'
        if checkpoint.exists():
            completed = read(checkpoint)
        selected = inventory[:limit] if limit else inventory
        errors = []
        progress['state'] = 'analysing'
        for index, row in enumerate(selected, 1):
            # Content hash + path preserves editions; duplicate hashes can be grouped in review.
            key = hashlib.sha256((row['path'] + row['sha256']).encode()).hexdigest()
            output = out / 'evidence' / (key + '.json')
            if key in completed and output.exists():
                result = read(output)
            else:
                m = row['metadata']; work = m.get('work') or {}; acquisition = m.get('acquisition') or {}
                result = {k:v for k,v in row.items() if k != 'metadata'}
                result.update(title=work.get('title') or acquisition.get('title') or Path(row['path']).name, workId=work.get('id') or acquisition.get('workId'), source=acquisition.get('source'), sourceUrl=acquisition.get('url') or acquisition.get('canonicalUrl'), extractionCache=m.get('extraction_cache'), recordedTextSha256=m.get('text_sha256'), sourceHashVerification='intake snapshot hash; not recomputed in this analysis', references=[], textBlocks=0, textCharacters=0, state='analysed', automaticChartPromotion=False)
                try:
                    for block_index, (block, method) in enumerate(blocks_for(row)):
                        text = block.get('text') or ''
                        result['textBlocks'] += 1
                        result['textCharacters'] += len(text)
                        for evidence in reference_evidence(text, verses):
                            if row['mixedAttribution']:
                                evidence['classification'] = 'mixed-author-review'
                            evidence.update(locator=block.get('locator'), blockIndex=block_index, extractionMethod=method)
                            result['references'].append(evidence)
                    if not result['textCharacters']:
                        result['state'] = 'text-unavailable'
                except Exception as exc:
                    result['state'] = 'error'; result['error'] = str(exc)
                write(output, result)
                completed[key] = {'path':row['path'], 'evidence':str(output), 'state':result['state']}
            valid = [r for r in result['references'] if r['verseValidation'] == 'valid']
            headings = sum(r['classification'] == 'heading-candidate' for r in valid)
            counts['filesProcessed'] += 1
            counts['referencesValidated'] += len(valid)
            counts['headingCandidates'] += headings
            counts['referencesRejected'] += len(result['references']) - len(valid)
            counts['textCharactersScanned'] += result['textCharacters']
            for ident in row['teacherIds']:
                by_teacher[ident].update(files=1, textFiles=bool(result['textCharacters']), references=len(valid), headingCandidates=headings, mixedAuthorFiles=row['mixedAttribution'], errors=result['state']=='error')
            if result['state'] == 'error':
                errors.append({'path':row['path'], 'error':result['error']})
            if index % 10 == 0 or index == len(selected):
                write(checkpoint, completed)
                write(out / 'teacher-summary.json', [{'id':p['id'], 'name':p['name'], **by_teacher[p['id']]} for p in teachers])
                write(out / 'progress.json', progress | dict(counts) | {'updatedAt':now(), 'currentFile':row['path'], 'selectedFiles':len(inventory), 'runFiles':len(selected)})
                print(json.dumps({'files':index,'total':len(selected),'validatedReferences':counts['referencesValidated'],'headingCandidates':counts['headingCandidates']},ensure_ascii=True), flush=True)
        summary = progress | dict(counts) | {'state':'analysis-complete' if not limit else 'pilot-complete', 'finishedAt':now(), 'errors':errors, 'teachersWithReferences':sum(bool(c['references']) for c in by_teacher.values()), 'teachersWithHeadingCandidates':sum(bool(c['headingCandidates']) for c in by_teacher.values()), 'chartUpdates':0, 'nextStep':'Review heading candidates against excerpts and author/edition identities; only then create supported main-text overlays. Ordinary citations and mixed-author matches are not main-text mappings.', 'limitations':['The English reference recognizer handles Arabic/Roman chapter and verse numbers, not every language or OCR spelling.', 'A heading candidate can be a quoted heading, index entry, or secondary text and requires review.', 'Scope is the current read-only intake snapshot; later acquisitions require another run.', 'No source rights, attribution, editorial decisions or public text availability are changed.']}
        write(out / 'summary.json', summary)
        write(out / 'progress.json', summary)
    except Exception as exc:
        write(out / 'progress.json', {'state':'failed','at':now(),'pid':os.getpid(),'error':str(exc)})
        raise
    finally:
        lock.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=STATE / 'teacher-scripture-analysis' / 'cpu-20261014')
    parser.add_argument('--launch', action='store_true')
    parser.add_argument('--limit', type=int)
    parser.add_argument('--retry-errors', action='store_true')
    args = parser.parse_args()
    out = args.output.resolve()
    if not out.is_relative_to((STATE / 'teacher-scripture-analysis').resolve()):
        parser.error('Output must stay under KnowledgeBase/teacher-scripture-analysis')
    if args.retry_errors:
        if args.launch or args.limit:
            parser.error('--retry-errors cannot be combined with --launch or --limit')
        retry_errors(out)
    elif args.launch:
        out.mkdir(parents=True, exist_ok=True)
        if (out / 'worker.lock').exists():
            parser.error('A worker lock exists; inspect the saved progress before launching another')
        command = [sys.executable, '-X', 'utf8', '-u', str(Path(__file__).resolve()), '--output', str(out)]
        if args.limit:
            command += ['--limit', str(args.limit)]
        flags = subprocess.CREATE_NO_WINDOW | subprocess.DETACHED_PROCESS | subprocess.BELOW_NORMAL_PRIORITY_CLASS if os.name == 'nt' else 0
        with (out / 'worker.log').open('a', encoding='utf-8') as log:
            worker = subprocess.Popen(command, cwd=SITE, stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT, creationflags=flags, close_fds=True)
        receipt = {'state':'launched','launchedAt':now(),'pid':worker.pid,'command':command,'output':str(out),'mode':'cpu-only, one finite worker','recurringTask':False,'vectorsAccessed':False}
        write(out / 'launch.json', receipt)
        print(json.dumps(receipt,ensure_ascii=True))
    else:
        analyse(out, args.limit)


if __name__ == '__main__':
    main()
