"""Correct static supplement metrics and count previously held 1900s works offline."""
import json
import hashlib
import re
from pypdf import PdfReader
from bible.paths import SOURCES
from modern_texts_common import REPORT, SITE, write

snap = json.loads((REPORT/'holdings-audit.json').read_text(encoding='utf-8'))
by = {a['assetId']: a for a in snap['documents']}
for source in ['packer', 'graham', 'sproul']:
    path = REPORT/(source+'-results.json')
    rows = json.loads(path.read_text(encoding='utf-8'))
    for record in rows.values():
        for asset in record.get('assets', []):
            audited = by[asset['assetId']]
            if not record.get('title'): record['title'] = audited['catalogTitle']
            if not asset.get('title'): asset['title'] = audited['catalogTitle']
            if audited.get('auditTextPath'):
                text_path = SITE/audited['auditTextPath']
                asset['derivedText'] = dict(path=text_path.relative_to(SITE).as_posix(),
                    sha256=hashlib.sha256(text_path.read_bytes()).hexdigest(), wordCount=audited['auditedWords'],
                    method='Existing PDF text layer; local pypdf; no OCR', quality='unreviewed')
            if record.get('title') == 'Hymns for the Soul':
                asset['textKind'] = 'ministry-hymn-compilation-not-sole-billy-graham-authorship'
                asset['authorshipNote'] = 'Includes hymn stories, George Beverly Shea material and lyrics credited to other rightsholders. Do not count all words as Billy Graham preaching.'
    write(path, rows)

catalog = SITE/'content/library/catalog'
def read(kind):
    return {x['id']:x for p in (catalog/kind).glob('*.json') for x in [json.loads(p.read_text(encoding='utf-8'))]}
works, editions, assets = read('works'), read('editions'), read('assets')
groups = {}
for asset in assets.values():
    work = works.get(editions.get(asset.get('editionId'), {}).get('workId'), {})
    if work.get('era') not in ['twentieth-century', 'twenty-first-century'] or not asset.get('relativePath'): continue
    path = SOURCES/asset['relativePath']
    if not path.exists(): continue
    for creator in work.get('creators', []):
        group = groups.setdefault(creator['authorId'], {})
        entry = group.setdefault(work['id'], dict(title=work['title'], pages=0, words=None, files=[], wordMethod=None))
        entry['files'].append(str(path))
        if path.suffix.lower() == '.txt':
            entry['words'] = len(re.findall(r"\b[\w’'-]+\b", path.read_text(encoding='utf-8', errors='replace')))
            entry['wordMethod'] = 'Existing source-provided OCR, not newly generated or verified'
        elif path.suffix.lower() == '.pdf':
            reader = PdfReader(path)
            entry['pages'] = len(reader.pages)
            if entry['words'] is None:
                content = '\n'.join(p.extract_text() or '' for p in reader.pages)
                count = len(re.findall(r"\b[\w’'-]+\b", content))
                if count > 500:
                    entry['words'] = count
                    entry['wordMethod'] = 'Existing PDF text layer; unreviewed'
write(REPORT/'earlier-twentieth-century-holdings.json', groups)
print(json.dumps({a: [{k:v for k,v in x.items() if k != 'files'} for x in ws.values()] for a,ws in groups.items()}))
