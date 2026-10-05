"""Recover visually approved ordinary-print PDF pages, with parallel local OCR.

Raw PDFs and previous extracted text are immutable. Decisions identify page
numbers and optional normalized column rectangles; no automated OCR of scans
merely because their text counts are low. Results are private reading copies.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import pymupdf
from bible.paths import SITE, SOURCES

LOCAL=SITE/'.local/library/ocr-completion'
REPORT=SITE/'content/library/reports/ocr-completion'

def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,obj):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')

def run(decisions,workers):
    jobs=[]; documents=[]
    for item in decisions:
        source=(SOURCES/item['sourceRelativePath']).resolve()
        assert source.is_relative_to(SOURCES.resolve())
        digest=sha(source); ident='pdf-'+digest[:20]
        with pymupdf.open(source) as doc:
            assert len({p['page'] for p in item['pages']})==len(item['pages'])
            for page in item['pages']:
                assert 1<=page['page']<=len(doc)
                assert page['decision']=='ocr-legible-print'
                original=doc[page['page']-1]
                regions=page.get('regions',[[0,0,1,1]])
                for i,region in enumerate(regions):
                    assert 0<=region[0]<region[2]<=1 and 0<=region[1]<region[3]<=1
                    revision=f'-v{page["renderRevision"]}' if page.get('renderRevision') else ''
                    pid=f'{ident}-p{page["page"]:04d}-r{i+1}{revision}'
                    img=LOCAL/'images'/(pid+'.png');img.parent.mkdir(parents=True,exist_ok=True)
                    previous=LOCAL/'pages'/(pid+'.json')
                    if previous.exists():
                        old=read(previous)
                        assert old['source']['region']==region, 'Changed crop requires a new renderRevision'
                        assert old['source']['sourceSha256']==digest
                    bounds=original.rect
                    clip=pymupdf.Rect(bounds.x0+region[0]*bounds.width,bounds.y0+region[1]*bounds.height,bounds.x0+region[2]*bounds.width,bounds.y0+region[3]*bounds.height)
                    if not img.exists(): original.get_pixmap(matrix=pymupdf.Matrix(300/72,300/72),clip=clip,alpha=False).save(img)
                    jobs.append(dict(pageId=pid,imagePath=str(img),sourceRelativePath=item['sourceRelativePath'],sourceSha256=digest,pdfPage=page['page'],region=region,dpi=300,reason=page['reason']))
        documents.append(dict(**item,sourceSha256=digest,documentId=ident))
    chunks=[jobs[i::workers] for i in range(workers)]
    def worker(pair):
        i,chunk=pair
        if not chunk:return
        jp=LOCAL/f'jobs-{i}.json';write(jp,chunk)
        proc=subprocess.run(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',str(SITE/'scripts/ocr-print-pages.ps1'),'-JobsPath',str(jp),'-OutputDir',str(LOCAL/'pages')],capture_output=True,text=True,encoding='utf-8',errors='replace',creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
        (LOCAL/f'worker-{i}.log').write_text(proc.stdout+'\n'+proc.stderr,encoding='utf-8')
        if proc.returncode:raise RuntimeError(f'OCR worker {i} failed; see log')
    with ThreadPoolExecutor(max_workers=workers) as pool:list(pool.map(worker,enumerate(chunks)))
    outcomes=[]
    for item in documents:
        source=SOURCES/item['sourceRelativePath']; parts=[]; pages=[]
        overrides={p['page']:p for p in item['pages']}
        with pymupdf.open(source) as doc:
            for n,page in enumerate(doc,1):
                text=page.get_text(sort=True); method='existing-pdf-text'; evidence=[]
                if n in overrides:
                    text_parts=[]
                    for i,_ in enumerate(overrides[n].get('regions',[[0,0,1,1]])):
                        revision=f'-v{overrides[n]["renderRevision"]}' if overrides[n].get('renderRevision') else ''
                        jp=LOCAL/'pages'/f'{item["documentId"]}-p{n:04d}-r{i+1}{revision}.json';r=read(jp)
                        assert r['status']=='recognized',str(jp)
                        assert r['source']['sourceSha256']==item['sourceSha256']
                        assert sha(Path(r['imagePath']))==r['imageSha256']
                        part=r['text']
                        labels=overrides[n].get('regionLabels',[])
                        if i<len(labels) and labels[i]=='pullquote':part='[Pullquote]\n'+part+'\n[End pullquote]'
                        text_parts.append(part);evidence.append(jp.relative_to(SITE).as_posix())
                    text='\n\n'.join(text_parts);method='windows-ocr-visually-approved-print'
                    assert len(text.split())>=20,f'OCR unexpectedly short: {item["documentId"]} page {n}'
                    for correction in overrides[n].get('verifiedCorrections',[]):
                        assert correction['before'] in text, f'Correction anchor missing: {n}'
                        text=text.replace(correction['before'],correction['after'],1)
                pages.append(dict(pdfPage=n,method=method,wordCount=len(text.split()),ocrEvidence=evidence,verifiedCorrections=overrides.get(n,{}).get('verifiedCorrections',[])))
                parts.append(f'--- PDF PAGE {n} ---\n'+text)
        target=LOCAL/'text'/item['documentId']/'readable.txt';target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text('\n\n'.join(parts)+'\n',encoding='utf-8',newline='\n')
        write(target.parent/'page-map.json',pages)
        assert sha(source)==item['sourceSha256'],'Original changed'
        outcomes.append(dict(**item,derivedText=target.relative_to(SITE).as_posix(),derivedSha256=sha(target),totalPages=len(pages),ocrPages=len(overrides),ocrWords=sum(p['wordCount'] for p in pages if p['ocrEvidence']),pageMap=(target.parent/'page-map.json').relative_to(SITE).as_posix(),publicHostingAllowed=False,reviewStatus='machine-output-needs-proofreading'))
    write(REPORT/'ocr-results.json',dict(processedAt=datetime.now(timezone.utc).isoformat(),engine='Windows.Media.Ocr en-US',parallelWorkers=workers,documents=outcomes,documentCount=len(outcomes),ocrPages=sum(r['ocrPages'] for r in outcomes),ocrWords=sum(r['ocrWords'] for r in outcomes),originalsUnchanged=True,limitations=['Original page images govern disputed words.','Local OCR provides no confidence score; results are not full proofreading.','Existing text pages are preserved as extracted; only explicitly approved pages receive OCR.']))
    print(json.dumps(dict(documents=len(outcomes),ocrPages=sum(r['ocrPages'] for r in outcomes),ocrWords=sum(r['ocrWords'] for r in outcomes))),flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--decisions',type=Path,default=REPORT/'ocr-decisions.json');p.add_argument('--workers',type=int,default=3);a=p.parse_args()
    assert 1<=a.workers<=4
    run(read(a.decisions),a.workers)
