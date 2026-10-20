"""Remove only page furniture from the saved Wace/Piercy extraction; no OCR."""
from pathlib import Path
import hashlib
import json
import re
import time
from datetime import datetime, timezone

started = time.perf_counter()
base = Path(__file__).resolve().parents[2] / 'Data/TheologicalReferenceLibrary/Extracted/Wace-Piercy'
meta = json.loads((base / 'wace-piercy-pdf-text.json').read_text(encoding='utf-8'))
raw = (base / meta['textFilename']).read_bytes()
assert hashlib.sha256(raw).hexdigest() == meta['textSha256'], 'Original extraction changed'
original = raw.decode('utf-8')
parts, pages, removed = [], [], []
offset = 0
headers = {'Title Page', 'A Dictionary of Christian Biography', 'Preface', 'List of Writers',
           'Indexes', 'Subject Index', 'Index of Names', 'Index of Scripture References',
           'Greek Words and Phrases', 'Latin Words and Phrases', 'Hebrew Words and Phrases',
           'French Words and Phrases', 'Index of Pages of the Print Edition'}
for p in meta['pages']:
    n = p['pdfPage']
    body = original[p['start']:p['end']]
    # Only an indented, known running header at the very beginning of a page.
    header = re.match(r'^ {20,}([^\n]+)\n', body)
    if header and (header[1].strip() in headers or re.fullmatch(r'[A-Z]', header[1].strip())):
        removed.append({'pdfPage': n, 'kind': 'running-header', 'text': header[0].rstrip()})
        body = body[header.end():]
    # The final, heavily indented footer must equal this PDF's known page sequence.
    footer = str(n - 5) if n >= 6 else {2: 'i', 3: 'ii', 4: 'iii', 5: 'iv'}.get(n)
    if footer:
        match = re.search(r'\n {20,}' + re.escape(footer) + r'\s*$', body)
        assert match, f'Unexpected footer on PDF page {n}'
        removed.append({'pdfPage': n, 'kind': 'footer', 'text': footer})
        body = body[:match.start()]
    body = body.strip('\n')
    if body:
        separator = '\n\n' if parts else ''
        parts.append(separator + body)
        offset += len(separator)
    pages.append({'pdfPage': n, 'originalStart': p['start'], 'originalEnd': p['end'],
                  'readingStart': offset, 'readingEnd': offset + len(body)})
    offset += len(body)
clean = ''.join(parts) + '\n'
assert '\f' not in clean and '[PDF page ' not in clean
assert 'mérovingienne: 913' in clean and 'Semiarianisme: 499' in clean
assert '\n1355\n' in clean, 'Meaningful index reference lost'
assert 'E. Orations and SERMONS.' in clean, 'Real section heading lost'
assert 'As God is\n\none, so His Word is one' in clean, 'Requested boundary not clean'
encoded = clean.encode('utf-8')
filename = 'wace-piercy-reading-text.txt'
(base / filename).write_bytes(encoded)
receipt = {'schemaVersion': 1, 'createdAt': datetime.now(timezone.utc).isoformat(),
           'sourceId': meta['sourceId'], 'originalTextFilename': meta['textFilename'],
           'originalTextSha256': meta['textSha256'], 'textFilename': filename,
           'textSha256': hashlib.sha256(encoded).hexdigest(), 'textBytes': len(encoded),
           'method': 'Saved per-page text only: omit inserted PDF markers/form feeds, remove known indented top running headers and exact sequential final footers; trim boundary blank lines. Body lines, references and hyphens unchanged.',
           'offsetUnit': 'Unicode codepoints; half-open offsets in decoded UTF-8',
           'counts': {'pages': len(pages), 'pageMarkers': original.count('[PDF page '),
                      'runningHeaders': sum(r['kind'] == 'running-header' for r in removed),
                      'footers': sum(r['kind'] == 'footer' for r in removed)},
           'completeness': 'Unchanged: full coverage remains unverified.',
           'runtimeSeconds': round(time.perf_counter() - started, 3),
           'pages': pages, 'removed': removed}
(base / 'reading-cleanup.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
assert hashlib.sha256((base / meta['textFilename']).read_bytes()).hexdigest() == meta['textSha256']
print(json.dumps({k: v for k, v in receipt.items() if k not in ('pages', 'removed')}, ensure_ascii=False))
