"""Reconcile page-level OCR triage, completed recovery and explicit exclusions."""
from collections import Counter
import hashlib
import json
import os
from pathlib import Path
from urllib.parse import quote
from bible.paths import SITE, SOURCES

OUT=SITE/'content/library/reports/ocr-completion'
LOCAL=SITE/'.local/library/ocr-completion'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def link(p):return quote(Path(os.path.relpath(p,OUT)).as_posix(),safe='/')

audit=read(OUT/'pdf-audit.json'); results=read(OUT/'ocr-results.json')
done={(r['sourceRelativePath'],p['page']) for r in results['documents'] for p in r['pages']}
piper=read(LOCAL/'triage-piper-sproul.json')
rogers=read(LOCAL/'triage-rogers-graham.json')
review={}
for r in piper['pages']:
    review[(r['relativePath'],r['page'])]=dict(disposition=r['classification'],basis=r.get('note',r.get('classificationMethod','')),evidence='triage-piper-sproul.json')
for r in rogers['records']:
    review[(r['sourceRelativePath'],r['page'])]=dict(disposition=r['decision'],basis=r.get('basis',''),evidence='triage-rogers-graham.json')
for filename in ['triage-tgc-first.json','triage-tgc-second.json']:
    for r in read(LOCAL/filename)['items']:
        source=r['sourceRelativePath'].replace('../sources/','')
        for p in r['excludedPages']:
            review[(source,p['pdfPage'])]=dict(disposition='deferred-specialized-or-difficult' if 'Deferred' in p['reason'] else 'no-body-text-gap',basis=p['reason'],evidence=filename)
rows=[]
for doc in audit['documents']:
    source=doc['relativePath']
    for page in doc.get('suspectPages',[]):
        key=(source,page['page']);item=dict(sourceRelativePath=source,pdfPage=page['page'],auditFlags=page['flags'])
        if key in done:item.update(disposition='ocr-completed',basis='Visually approved ordinary print, local Windows OCR; original preserved.',evidence='ocr-results.json')
        elif key in review:item.update(review[key])
        elif '/source-internet-archive/' in source:item.update(disposition='historical-source-text-reused-or-restoration-deferred',basis='Existing source OCR/alternate text crosswalk reviewed. No wholesale historical scan restoration under owner scope; exact page completeness not certified.',evidence='text-alternatives.json')
        elif '/source-spurgeon-gems/' in source:item.update(disposition='no-body-text-gap',basis='Existing text inspected: sermon header/footer or end-of-volume marker only, no page images or missing prose.',evidence='pdf-audit.json')
        elif '/source-zwemer-center/' in source:item.update(disposition='no-body-text-gap',basis='Visually verified chapter divider; headings already extracted.',evidence='zwemer-review.json')
        elif '/source-gospel-coalition/' in source:
            if '33c13a4d43aaec720e7a' in source:item.update(disposition='font-normalization-completed' if (OUT/'tgc-font-repair.json').exists() else 'font-normalization-pending',basis='Readable text with private-use font glyphs; no scan OCR required.',evidence='tgc-font-repair.json')
            else:item.update(disposition='no-body-text-gap',basis='Contact sheets inspected for remaining TGC flags: blanks, covers, title/dedication/divider pages or deliberately spaced title lettering. Blank page object checks supplement visual review.',evidence='tgc-remaining-triage.json')
        else:item.update(disposition='unresolved',basis='No matching triage decision')
        rows.append(item)
write(OUT/'page-dispositions.json',dict(scope='All page flags from acquired-PDF snapshot, not a full proofreading certificate.',counts=dict(Counter(r['disposition'] for r in rows)),pages=rows))
write(OUT/'tgc-remaining-triage.json',dict(reviewedOn='2026-10-05',method='Root inspected six rendered contact sheets containing 72 TGC pages; supplement with existing-text and no-content page-object checks. Separate difficult and OCR-assigned pages have individual triage records.',renders=[f'.local/library/ocr-completion/triage/tgc-sheet-{i}.png' for i in range(6)],pages=[r for r in rows if r.get('evidence')=='tgc-remaining-triage.json'],limits='Title, cover and decorative text is not claimed as complete prose transcription. Existing body text not proofread.'))
# Keep compact reusable triage without copying extracted source text into git.
for name,data,key in [('triage-piper-sproul.json',piper,'pages'),('triage-rogers-graham.json',rogers,'records')]:
    clean={k:v for k,v in data.items() if k not in [key,'samples']}
    clean[key]=[{k:v for k,v in r.items() if k not in ['text','existingText']} for r in data[key]]
    write(OUT/name,clean)
for name in ['triage-tgc-first.json','triage-tgc-second.json','triage-tgc-7c35-page3.json','magazine-corrected-regions.json']:
    write(OUT/name,read(LOCAL/name))
write(OUT/'ocr-decisions.json',read(LOCAL/'ocr-decisions.json'))
counts=Counter(r['disposition'] for r in rows)
summary=dict(auditedPdfFiles=audit['summary']['pdfFiles'],auditedPdfPages=audit['summary']['pageCount'],readErrors=audit['summary']['errors'],flaggedPages=len(rows),ocrDocuments=results['documentCount'],ocrPages=results['ocrPages'],ocrWords=results['ocrWords'],parallelOcrWorkers=results['parallelWorkers'],unresolvedTriagePages=counts.get('unresolved',0),snapshotPdfCountStillMatches=len(list((SOURCES/'library').rglob('*.pdf')))==audit['summary']['pdfFiles'],scope='Ordinary legible printed text; historical restoration and specialized scripts/layouts excluded.',fullProofreadingComplete=False)
summary['fontRepairedPages']=sum(len(read(OUT/name)['changedPages']) for name in ['font-repair.json','tgc-font-repair.json'] if (OUT/name).exists())
assert not counts.get('unresolved') and not counts.get('font-normalization-pending')
write(OUT/'summary.json',summary)
lines=['# Library OCR completion','',f"Audited **{summary['auditedPdfFiles']:,} acquired PDFs / {summary['auditedPdfPages']:,} pages**, with **{summary['readErrors']} read errors**. Ran **{summary['parallelOcrWorkers']} local OCR workers** and recovered **{summary['ocrPages']} approved pages in {summary['ocrDocuments']} documents**, yielding **{summary['ocrWords']:,} OCR words**. Filesystem PDF count still matches the audit snapshot: **{summary['snapshotPdfCountStillMatches']}**.",'', 'This completes the identified straightforward printed-text OCR jobs in the acquired-PDF snapshot. It does not certify every word or mean every cataloged work has been acquired. No new books or scans were downloaded. Original PDFs and old derived texts remain unchanged. Output is for the existing private reading scope; no public hosting or search permissions changed.','', '## Recovered reading text','', '| Work | Recovered PDF pages | Reading file |','|---|---|---|']
for r in results['documents']:
    p=SITE/r['derivedText'];assert hashlib.sha256(p.read_bytes()).hexdigest()==r['derivedSha256']
    assert hashlib.sha256((SOURCES/r['sourceRelativePath']).read_bytes()).hexdigest()==r['sourceSha256']
    preferred=LOCAL/'font-repair/readable.txt' if '3e2cdbe410efea6d860f' in r['sourceRelativePath'] and (OUT/'font-repair.json').exists() else p
    lines.append(f"| {r['title'].replace('|','/')} | {', '.join(str(x['page']) for x in r['pages'])} | [TXT]({link(preferred)}) |")
lines+=['','## Font repairs','']
for filename,label in [('font-repair.json','The Future of Justification'),('tgc-font-repair.json','Christian Truths in a Postmodern World')]:
    if (OUT/filename).exists():
        repair=read(OUT/filename)
        path=SITE/(repair['derivedText'] if 'derivedText' in repair else next(r['relativePath'] for r in repair['outputs'] if r['relativePath'].endswith('.txt')))
        lines.append(f'- {label}: [repair evidence]({filename}) and [reading text]({link(path)}). These repairs preserve readable source text without re-OCR of the whole work.')
lines+=['','## What remains outside this pass','', '- Historical Internet Archive scans: reuse the existing OCR and clean alternate editions in [the crosswalk](text-alternatives.json); difficult exact-edition restoration remains deferred. A low-text historical page is not automatically an OCR assignment.','- One nine-page Carson chapter with grainy mixed English/Greek, two copies of one dense rotated-header matrix, one Arabic names chart, and one music-score/lyrics layout remain explicitly deferred. See [page decisions](page-dispositions.json).','- Covers, photographs, blank pages, chapter dividers and sparse final outline pages were distinguished from missing prose. Repeated Rogers cover templates were classified by wording and position with representative visual checks; other named suspect groups were visually reviewed.','- Minor pre-existing OCR errors, punctuation, diacritics, table relationships and ordinary proofreading remain. This is recovery of identified text gaps, not scholarly collation.','', '## Verification and reuse','', 'Every recovered page retains original-PDF hash, physical page number, rendered-image hash, OCR engine/language, region geometry and derived-text hash. Multi-column magazine regions were corrected and rerun after boundary QA. [TGC quality review](tgc-ocr-quality.json) records remaining limits; selected source-verified corrections affect only new derived reading text.','', '[Full audit](pdf-audit.json) · [Page dispositions](page-dispositions.json) · [OCR results](ocr-results.json) · [Reproducible decisions](ocr-decisions.json) · [Summary](summary.json)','', 'Rebuild recovery with `python -X utf8 scripts/complete-library-ocr.py --decisions content/library/reports/ocr-completion/ocr-decisions.json --workers 3`; Windows English OCR is required. Existing successful OCR regions are reused. The complete PDF audit is resumable via `scripts/audit-library-ocr.py`.']
(OUT/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(summary),flush=True)
