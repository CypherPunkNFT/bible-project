"""Consolidate existing library holdings only; no network or document processing."""
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

SITE=Path(__file__).resolve().parents[1]
LIB=SITE/'content/library'
OUT=LIB/'reports/text-backlog'
SOURCES=SITE.parent/'sources'
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def write(p,x): p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def ia(url):
    m=re.search(r'archive\.org/(?:details|download|metadata)/([^/?]+)',url or '')
    return m[1] if m else None
def rows(x):
    if isinstance(x,list):
        for y in x: yield from rows(y)
    elif isinstance(x,dict):
        if x.get('relativePath') and (x.get('url') or x.get('canonicalUrl')): yield x
        else:
            for y in x.values(): yield from rows(y)

def build():
    OUT.mkdir(parents=True,exist_ok=True)
    works={x['id']:x for p in (LIB/'catalog/works').glob('*.json') if (x:=read(p))}
    editions={x['id']:x for p in (LIB/'catalog/editions').glob('*.json') if (x:=read(p))}
    groups={}; assetgroups={}; iagroups={}; metadata={}
    def group(key,title,work=None):
        if key not in groups:
            groups[key]=dict(id=key,title=title,workId=work.get('id') if work else None,genre=work.get('genre') if work else 'unreconciled-volume',authorIds=[c['authorId'] for c in work.get('creators',[])] if work else [],files=[],sourceLinks=[],evidence=[])
        return groups[key]
    # Edition holdings, not thousands of sections masquerading as separate books.
    for p in sorted((LIB/'catalog/assets').glob('*.json')):
        a=read(p); eid=a['editionId']; e=editions.get(eid,{}); w=works.get(e.get('workId'),{})
        if a.get('mediaKind') not in ['text','scan']: continue
        g=group(eid,w.get('title',eid),w)
        assetgroups[a['id']]=eid
        url=a.get('canonicalUrl') or a.get('finalUrl')
        if url and url not in g['sourceLinks']: g['sourceLinks'].append(url)
        iid=ia(url)
        if iid: iagroups[iid]=eid
        g['evidence'].append(p.relative_to(SITE).as_posix())
        if a.get('relativePath'):
            g['files'].append(dict(path=a['relativePath'],format=a.get('format'),url=a.get('finalUrl') or url,assetId=a['id'],acquisitionStatus=a.get('acquisitionStatus')))
    inputs=[]
    for p in sorted((LIB/'reports').rglob('*.json')):
        if OUT in p.parents or ('manifest' not in p.name and 'checkpoint' not in p.name): continue
        data=read(p); matched=False
        for f in rows(data):
            rel=f['relativePath']; url=f.get('url') or f.get('canonicalUrl'); iid=ia(url)
            if rel.endswith('metadata.json') and iid and (SOURCES/rel).exists():
                try: metadata[iid]=read(SOURCES/rel).get('metadata',{})
                except (ValueError,OSError): pass
            ext=Path(urlparse(url).path).suffix.lower()
            if f.get('evidenceOnly') or ext not in ['.pdf','.txt','.html','.htm','.epub','.xml']: continue
            if Path(urlparse(url).path).name.lower() in ['robots.txt','readme.md','readme.txt'] or 'license-evidence' in rel: continue
            if 'scandata' in rel or ext=='.xml' and 'ccel' not in url: continue
            key=assetgroups.get(f.get('assetId')) or iagroups.get(iid) or ('ia:'+iid if iid else 'file:'+url)
            g=group(key,f.get('title') or f.get('workKey') or iid or Path(rel).name)
            if iid and iid not in iagroups: iagroups[iid]=key
            if not any(x['path']==rel for x in g['files']):
                g['files'].append(dict(path=rel,format=f.get('format') or ext[1:],url=url,assetId=f.get('assetId'),acquisitionStatus='manifest-listed'))
            if url not in g['sourceLinks']: g['sourceLinks'].append(url)
            evidence=p.relative_to(SITE).as_posix()
            if evidence not in g['evidence']: g['evidence'].append(evidence)
            matched=True
        if matched: inputs.append(p.relative_to(SITE).as_posix())
    # Bibliographic books without assets remain discovery tasks, not OCR jobs.
    bookgenres={'treatise','commentary','collected-works','devotional','biography','autobiography','history','journal','dictionary','catechism','confession','study-guide'}
    represented={g['workId'] for g in groups.values()}
    for w in works.values():
        if w['id'] in represented or w.get('genre') not in bookgenres or any(r.get('relation')=='is-part-of' for r in w.get('related',[])): continue
        g=group(w['id'],w['title'],w)
        g['sourceLinks']=list(dict.fromkeys(e['url'] for e in w.get('evidence',[]) if e.get('url')))
        g['evidence']=['content/library/catalog/works/'+w['id']+'.json']
    for g in groups.values():
        if g['id'].startswith('ia:'):
            m=metadata.get(g['id'][3:],{}); title=m.get('title')
            if title: g['title']='; '.join(title) if isinstance(title,list) else title
            g['sourceCreator']=m.get('creator'); g['sourceVolume']=m.get('volume')
        for f in g['files']:
            f['existsLocally']=(SOURCES/f['path']).is_file()
            t=(f['path']+' '+str(f.get('assetId'))).lower()
            f['textKind']='ocr' if '_djvu.txt' in t or '-ocr' in t else 'pdf' if f['format']=='pdf' or t.endswith('.pdf') else 'text-candidate'
        kinds={f['textKind'] for f in g['files'] if f['existsLocally']}
        g['status']='existing-text-review' if 'text-candidate' in kinds else 'existing-ocr-review' if 'ocr' in kinds else 'pdf-text-check-deferred' if 'pdf' in kinds else 'find-existing-text'
        g['nextAction']={'existing-text-review':'Use existing text first; confirm it is substantive and complete, not merely a landing page. No transcription presumed necessary.','existing-ocr-review':'Existing OCR is available. Check readability or locate a cleaner transcription before considering new OCR.','pdf-text-check-deferred':'Find an existing transcription or check the PDF text layer later. A PDF does not by itself establish a need for OCR.','find-existing-text':'Locate a permitted ready-made transcription first; bibliographic/source link is not an acquired text.'}[g['status']]
    holdings=sorted(groups.values(),key=lambda x:(x['status'],x['title'].lower(),x['id']))
    # Individual sermons/articles and other small units remain in the JSON appendix.
    books=[g for g in holdings if g['genre'] in bookgenres or g['id'].startswith('ia:')]
    unclassified=[g for g in holdings if g not in books and g['genre']=='unreconciled-volume']
    counts=dict(Counter(g['status'] for g in books))
    # Retain the baseline used by the source-resolution audit and never overwrite
    # its verified report with the earlier format-only classification.
    resolved=(OUT/'text-resolutions.json').exists()
    write(OUT/('format-inventory-current.json' if resolved else 'inventory.json'),dict(date='2026-10-05',scope='All identifiable edition/file holdings in current catalog and local acquisition manifests, plus unacquired root book records. Not an exhaustive wishlist of every possible Christian book.',limitations=['Statuses are based on file and catalog metadata; no new PDF text extraction, OCR, network access, or full-body inspection.','Different editions stay separate; unlinked records may still describe the same intellectual work.','Existing text may be incomplete or unproofread. Rights remain governed by original asset/source records.','Uncatalogued files without acquisition-manifest records and proposals appearing only in prose may be absent.'],bookHoldingCounts=counts,totalHoldings=len(holdings),bookHoldings=len(books),inputs=inputs,holdings=holdings))
    lines=['# Master text and transcription backlog','', 'Snapshot: 2026-10-05. Consolidates existing local records across library missions; no new research, downloads, OCR or PDF inspection.','', '**Use existing text first. Do not start transcription simply because a PDF exists.**','', 'This lists edition/volume holdings, not a deduplicated count of intellectual works. It includes acquired books and catalogued books awaiting text. Individual sermons and other short items are in the [full machine-readable inventory](inventory.json). Proposals appearing only in prose and unmanifested files may be absent.','',f'Book/volume holdings: **{len(books)}**. All holdings including short items: **{len(holdings)}**.','']
    labels={'existing-text-review':'Existing electronic text — inspect/use first','existing-ocr-review':'OCR already exists — review or replace with cleaner text','pdf-text-check-deferred':'PDF present — text layer/transcription check deferred','find-existing-text':'Catalogued or linked — find existing text first'}
    for status,label in labels.items():
        selected=[g for g in books if g['status']==status]
        lines += ['## '+label+f' ({len(selected)})','', '| Book / volume | Holding ID | Source |','|---|---|---|']
        for g in selected:
            title=g['title'].replace('|','/').replace('\n',' ')
            if g.get('sourceVolume'): title+=' — volume '+str(g['sourceVolume'])
            url=g['sourceLinks'][0] if g['sourceLinks'] else None
            lines.append(f"| {title} | `{g['id']}` | "+(f'[Source]({url})' if url else 'See catalog evidence')+' |')
        lines.append('')
    lines += ['## Files awaiting book/title reconciliation ('+str(len(unclassified))+')','', 'These are retained in the master list but excluded from book totals; their titles or unit types are not yet established in the catalog.','', '| File / provisional title | Status | Source |','|---|---|---|']
    for g in unclassified:
        lines.append('| '+g['title'].replace('|','/').replace('\n',' ')+' | '+g['status']+' | '+(('[Source]('+g['sourceLinks'][0]+')') if g['sourceLinks'] else 'See inventory')+' |')
    lines += ['', '## Exact files and provenance','', 'The JSON inventory records each file path, local existence, source URL, catalog/manifest evidence, status and next action. Metadata-based classification does not certify completeness, proofreading or reuse rights. Alternate editions and incomplete catalog reconciliation are kept visible.']
    (OUT/('FORMAT-INVENTORY.md' if resolved else 'REPORT.md')).write_text('\n'.join(lines)+'\n',encoding='utf-8',newline='\n')
    assert len({g['id'] for g in holdings})==len(holdings)
    assert all(g['evidence'] for g in holdings)
    print(json.dumps(dict(bookHoldings=len(books),allHoldings=len(holdings),bookStatusCounts=counts)))

if __name__=='__main__': build()
