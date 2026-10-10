"""Source documentation inputs only; no corpus, manifest or original changes."""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse

OUT = Path(__file__).resolve().parent
SITE = OUT.parents[4]
ROOT = SITE.parent
CAT = ROOT / 'KnowledgeBase/campaign-stocktake/private-catalog.jsonl'

def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def identity(row):
    url = str(row.get('url') or '')
    host = (urlparse(url).hostname or '').removeprefix('www.')
    if host.endswith('archive.org'): return 'archive.org'
    if host in ('mirrorservice.org', 'mirrors.xmission.com', 'gutenberg.org'): return 'gutenberg.org'
    if host == 'raw.githubusercontent.com':
        owner = urlparse(url).path.strip('/').split('/')[0].lower()
        return 'github:' + owner
    if host == 'media.thegospelcoalition.org': return 'thegospelcoalition.org'
    if host == 'static.billygraham.org': return 'billygraham.org'
    if host == 'wp.me': return 'michaeljkruger.com'
    if host == 'jimhamilton.files.wordpress.com': return 'jimhamilton.info'
    if host == 'tabletalkmagazine.com': return 'ligonier.org'
    return host

def main():
    original = SITE / 'SOURCES.md'
    backup = OUT / 'SOURCES-before-reconciliation.md'
    if not backup.exists(): backup.write_bytes(original.read_bytes())
    groups, dominant = {}, defaultdict(Counter)
    rows = []
    with CAT.open(encoding='utf-8') as stream:
        for line in stream:
            row = json.loads(line); rows.append(row)
            key = identity(row)
            if key: dominant[str(row.get('source'))][key] += 1
    for row in rows:
        key = identity(row)
        if not key:
            counts = dominant[str(row.get('source'))]
            aliases = {'source-tcp-bulk': 'github:textcreationpartnership', 'source-love-worth-finding': 'lwf.org'}
            key = aliases.get(str(row.get('source'))) or (counts.most_common(1)[0][0] if counts else 'local-support')
        group = groups.setdefault(key, dict(id=key, files=0, bytes=0, formats=Counter(), statuses=Counter(),
            urls=[], licences=[], manifests=set(), aliases=set(), bodyCandidates=0, creditedFiles=0))
        group['files'] += 1; group['bytes'] += row['bytes']
        group['formats'][Path(row['path']).suffix.lower() or 'extensionless'] += 1
        group['statuses'][row['intakeStatus']] += 1
        group['bodyCandidates'] += bool(row.get('bodyCandidate'))
        group['creditedFiles'] += bool(row.get('contributor') or row.get('credit'))
        group['aliases'].add(str(row.get('source')))
        group['manifests'].update(row.get('manifests', []))
        for field, target in [('url', 'urls'), ('licence', 'licences')]:
            value = row.get(field)
            if value and value not in group[target]: group[target].append(value)
    for group in groups.values():
        for field in ('formats', 'statuses'): group[field] = dict(group[field])
        for field in ('manifests', 'aliases'): group[field] = sorted(group[field])
        group['urls'] = group['urls'][:8]
        group['licences'] = group['licences'][:12]
    registry = read(SITE / 'content/library/sources.json')
    result = dict(stocktakeSnapshot=read(ROOT / 'KnowledgeBase/campaign-stocktake/summary.json')['snapshotAt'],
        libraryFiles=len(rows), libraryBytes=sum(r['bytes'] for r in rows),
        groups=[groups[k] for k in sorted(groups)], existingSourceRegistry=registry['sources'])
    (OUT / 'source-inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('SOURCE GROUPS',len(groups))
    for k in sorted(groups):
        g=groups[k]; print(k,g['files'],g['bodyCandidates'],','.join(g['formats']),str(g['licences'][:1])[:105])

if __name__ == '__main__': main()
