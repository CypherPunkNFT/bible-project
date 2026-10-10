"""Inventory runtime URLs and dynamic outbound-link renderers for owner review.

Does not visit third-party destinations or modify site content. Acquisition archives
and reports are excluded; runtime source metadata is inventoried separately from
reading links and network dependencies. Static findings are candidates, not proof
that every record is rendered on a live route.
"""
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime, timezone
from urllib.parse import urlsplit
import csv
import json
import re

SITE = Path(__file__).resolve().parents[1]
OUT = SITE.parent / 'Research/Outbound-link-review'
URL = re.compile(r'https?://[^\s<>"\'`\\]+')
SUFFIXES = {'.tsx','.ts','.css','.json','.html','.md'}


def domain(url):
    try: return urlsplit(url.replace('${','')).netloc
    except ValueError: return 'dynamic-or-pattern'


def category(file, context, url):
    lower = (file+' '+context).lower()
    host = domain(url).lower()
    if 'teacher-library/records/' in file or 'content/sources/' in file or 'SourceDirectory' in file or 'source-directory' in file or '/sources/' in file:
        return 'source-directory-or-bottom-provenance'
    if file.startswith('src/pages/research/'):
        return 'local-research-prototype-review'
    if 'basereader' in lower or 'basisreader' in lower or 'familyStartingPoints'.lower() in lower or 'apologeticsparts' in lower:
        return 'inline-reading-or-citation-review'
    if any(s in lower for s in ['licenseurl','licenceurl','creditline','copyright','rightsurl','citation','sourceurl','sources and credits']):
        return 'attribution-or-citation-review-placement'
    if any(s in lower for s in ['fetch(', 'iframe','cdn.jsdelivr','fonts.googleapis','huggingface.co/','tile.openstreetmap','turnstile','api.','unpkg.com','maplibre','pmtiles']):
        return 'network-media-or-service-dependency'
    if any(s in lower for s in ['churchfamily.io','open source','sitefooter','homeabout','cypherpunknft/bible-project']):
        return 'project-or-community-link'
    if file.startswith('src/pages/places/history-collections'):
        return 'external-history-reading-review'
    if '/resources/' in file or '/learning' in file or '/life/' in file or 'learning' in lower:
        return 'external-learning-or-life-resource-review'
    if 'peoplegroups.org' in host:
        return 'external-organization-profile-review'
    if '/teachers/' in file:
        return 'unused-legacy-teachers-data' if file.endswith('teachers.json') or file.endswith('TeacherList.tsx') else 'teachers-link-review'
    return 'other-runtime-url-review'


def main():
    files = set()
    for root in ['src','public/content/apologetics','public/content/sources','public/content/teacher-library/records','content/apologetics','content/teachers','content/research','data']:
        base = SITE/root
        if base.exists(): files.update(p for p in base.rglob('*') if p.is_file() and p.suffix in SUFFIXES)
    for f in ['content/library/authors.json','content/library/sources.json','content/library/publication.json','content/feature-citations.json','public/index.html']:
        if (SITE/f).is_file(): files.add(SITE/f)
    rows, dynamic, scanned = [], [], 0
    for p in sorted(files):
        file = p.relative_to(SITE).as_posix()
        if re.search(r'\.(test|spec)\.|/tests/|/reports/|/ingestion/',file): continue
        text = p.read_text(encoding='utf-8-sig',errors='replace');scanned += 1
        for number,line in enumerate(text.splitlines(),1):
            # JSON is often minified: include a bounded local context rather than
            # retaining a megabyte-long line for each occurrence.
            for m in URL.finditer(line):
                u=m.group().rstrip('.,);]')
                if any(s in u for s in ['www.w3.org/','json-schema.org/','localhost','127.0.0.1']):continue
                context=line[max(0,m.start()-110):m.end()+110]
                if p.suffix in {'.ts','.tsx'} and line.lstrip().startswith('//'): continue
                rows.append({'file':file,'line':number,'url':u,'domain':domain(u),'category':category(file,context,u),'context':context[:450]})
            if p.suffix=='.tsx':
                for m in re.finditer(r'(?:href|src)=\{([^}\n]+)\}',line):
                    expr=m.group(1)
                    if 'href={`#' in m.group() or expr.startswith('"#'):continue
                    dynamic.append({'file':file,'line':number,'expression':expr,'context':line[max(0,m.start()-80):m.end()+130][:450]})
    OUT.mkdir(parents=True,exist_ok=True)
    summary={'updatedAt':datetime.now(timezone.utc).isoformat(),'scannedFiles':scanned,'urlOccurrences':len(rows),'uniqueUrls':len({r['url'] for r in rows}),'domains':len({r['domain'] for r in rows}),'dynamicAttributeSites':len(dynamic),'categories':dict(Counter(r['category'] for r in rows)),
             'scope':'Runtime source/data inventory, including source-only metadata and prototype code. Not a claim that every URL is a displayed outbound reading link. Runtime-generated templates are captured as templates; browser behaviour checked separately.'}
    (OUT/'inventory.json').write_text(json.dumps({'summary':summary,'occurrences':rows,'dynamicAttributes':dynamic},ensure_ascii=False),encoding='utf-8')
    for filename, data in [('occurrences.csv',rows),('dynamic-renderers.csv',dynamic)]:
        with (OUT/filename).open('w',encoding='utf-8-sig',newline='') as stream:
            writer=csv.DictWriter(stream,fieldnames=list(data[0]) if data else []);writer.writeheader();writer.writerows(data)
    groups=defaultdict(list)
    for r in rows: groups[(r['category'],r['file'])].append(r)
    lines=['# Outbound link inventory','',summary['scope'],'',f"Scanned {scanned:,} runtime/input files; {summary['urlOccurrences']:,} URL occurrences; {summary['uniqueUrls']:,} unique literal URLs/templates; {summary['domains']:,} domains; {len(dynamic):,} dynamic attributes (some are internal links).",'',
           'Full URLs, exact file/line locations and contexts are in occurrences.csv / inventory.json. Dynamic renderers require reviewing their data and placement, not counting every href as external. No acquisition reports, originals, or extraction-text pages are included.','',
           '| Classification | File | Occurrences | Example domain |','|---|---|---:|---|']
    for (cat,file),group in sorted(groups.items()):lines.append(f"| {cat} | {file} | {len(group):,} | {group[0]['domain']} |")
    (OUT/'INVENTORY.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    (OUT/'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    print(json.dumps(summary))


if __name__=='__main__':main()
