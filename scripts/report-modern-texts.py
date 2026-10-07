"""Build an honest acquisition ledger from on-disk modern collection results."""
import argparse
import collections
import hashlib
import json
import re
from datetime import datetime,timezone
from pathlib import Path
from bible.paths import SOURCES
from modern_texts_common import SITE,CACHE,REPORT,write

NAMES={'piper':'John Piper messages and writings','piper-books':'John Piper book editions',
       'rogers':'Adrian Rogers','packer':'J. I. Packer','graham':'Billy Graham','sproul':'R. C. Sproul books',
       'ready-library':'Ready author libraries (individual authors in manifest)',
       'begg':'Alistair Begg official sermon transcripts',
       'monergism-library':'Monergism curated reading editions (author review pending)',
       'ccel-expansion':'CCEL additional historical author editions'}

def main(verify=False):
    rows=[];files={};issues=[];reconciliation=[];all_records=[]
    for source,name in NAMES.items():
        p=REPORT/(source+'-results.json')
        if not p.exists():continue
        records=json.loads(p.read_text(encoding='utf-8'))
        all_records.extend(dict(source=source,**{k:v for k,v in r.items() if k!='source'}) for r in records.values())
        assets={a['assetId']:a for r in records.values() for a in r.get('assets',[])}
        for aid,a in assets.items():
            full=SOURCES/a['relativePath']
            if not full.is_file() or full.stat().st_size!=a['byteCount']:
                issues.append(dict(assetId=aid,issue='Missing file or size mismatch'))
            if verify and full.is_file() and hashlib.sha256(full.read_bytes()).hexdigest()!=a['sha256']:
                issues.append(dict(assetId=aid,issue='Original SHA-256 mismatch'))
            if a.get('derivedText'):
                dt=a['derivedText'];dp=SITE/dt['path']
                if not dp.is_file() or (verify and hashlib.sha256(dp.read_bytes()).hexdigest()!=dt['sha256']):
                    issues.append(dict(assetId=aid,issue='Derived text missing or SHA-256 mismatch'))
            files[aid]=dict(a,authorGroup=source)
        statuses=collections.Counter(r['status'] for r in records.values())
        rows.append(dict(source=source,name=name,recordsChecked=len(records),statuses=dict(statuses),
                         downloadedRecords=statuses['downloaded'],uniqueFiles=len(assets),
                         bytes=sum(a['byteCount'] for a in assets.values()),
                         pdfPages=sum(a.get('pageCount',0) for a in assets.values()),
                         extractedWords=sum(a.get('derivedText',{}).get('wordCount',0) for a in assets.values()),
                         bookSamples=sum(a.get('textKind')=='book-sample' for a in assets.values())))
    by_hash=collections.defaultdict(list)
    for a in files.values():by_hash[a['sha256']].append(a['assetId'])
    for h,ids in by_hash.items():
        if len(ids)>1:reconciliation.append(dict(sha256=h,assetIds=ids,relationship='exact-original-byte-duplicate'))
    summary=dict(updatedAt=datetime.now(timezone.utc).isoformat(),
      scope='Private noncommercial reading acquisition; no new public full-text publication or canonical core-teaching admission',
      sources=rows,uniqueOriginalFiles=len(files),uniqueOriginalChecksums=len(by_hash),
      originalBytes=sum(a['byteCount'] for a in files.values()),pdfPages=sum(a.get('pageCount',0) for a in files.values()),
      derivedTextFiles=sum(bool(a.get('derivedText')) for a in files.values()),
      extractedWords=sum(a.get('derivedText',{}).get('wordCount',0) for a in files.values()),
      verifiedAllFileHashes=verify,validationIssues=issues,
      note='Records, unique works, editions and files are not interchangeable. Extracted word totals include original quotation and repeated matter; PDF pages exclude HTML. No invented HTML page equivalents.')
    write(REPORT/'summary.json',summary)
    if verify:
        write(REPORT/'verification.json',dict(verifiedAt=summary['updatedAt'],filesChecked=len(files),issues=issues))
    write(REPORT/'acquisition-manifest.json',dict(sourceRoot=str(SOURCES),files=list(files.values())))
    write(REPORT/'reconciliation.json',dict(exactByteDuplicates=reconciliation,
         unresolved='Same sermon in different editions, rebroadcasts, alternate titles and books is not automatically merged.'))
    pdfs=[a for a in files.values() if a['format']=='pdf']
    titles={a['assetId']:r.get('title',a.get('title','Untitled')) for r in all_records for a in r.get('assets',[])}
    for a in pdfs:a['catalogTitle']=titles.get(a['assetId'],a.get('title','Untitled'))
    write(REPORT/'pdf-inventory.json',dict(status='Existing readable editions first; new scans and OCR deferred',files=pdfs))
    pdf_lines=['# Acquired PDF inventory','',
      'Actual acquired PDFs, including existing searchable editions offered by author libraries. New scans and OCR are deferred. Local files remain private reading copies.','',
      '| Author | Title | Pages | Original file | Source |','|---|---|---:|---|---|']
    for a in sorted(pdfs,key=lambda a:(a['authorGroup'],a['catalogTitle'] or '')):
        title=(a['catalogTitle'] or 'Untitled').replace('|','/')
        local=(SOURCES/a['relativePath']).as_posix()
        pdf_lines.append(f"| {a['authorGroup']} | {title} | {a.get('pageCount','')} | [PDF](<{local}>) | [Official/download source]({a['url']}) |")
    (REPORT/'PDF-INVENTORY.md').write_text('\n'.join(pdf_lines)+'\n',encoding='utf-8',newline='\n')
    body=['# Modern sermon texts and works acquisition','',
          'This collection preserves actual source files for private, noncommercial reading. It is separate from permission to host full text in the Bible Project app. The current counts below are regenerated from downloaded-file records and checked against files on disk.','',
          '**Current owner-directed scope: existing readable text first, acquired where permitted.** Piper HTML and offered EPUB/searchable-PDF library editions are being collected. New scans, OCR and audio transcription are deferred. See [author libraries](AUTHOR-LIBRARIES.md), [acquired PDF list](PDF-INVENTORY.md) and [source queue](SOURCE-QUEUE.md).','',
          'Updated '+summary['updatedAt']+'. See [live job state](job-state.json) for running and finished phases.','',
          '| Collection | Records downloaded | Unique original files | PDF pages | Extracted words |',
          '|---|---:|---:|---:|---:|']
    for r in rows:body.append(f"| {r['name']} | {r['downloadedRecords']:,} | {r['uniqueFiles']:,} | {r['pdfPages']:,} | {r['extractedWords']:,} |")
    body+=['',f"Total: **{summary['uniqueOriginalFiles']:,} original files**, **{summary['uniqueOriginalChecksums']:,} distinct file checksums**, **{summary['originalBytes']:,} bytes**, **{summary['pdfPages']:,} PDF pages** and **{summary['derivedTextFiles']:,} extracted text files**. Provenance sidecars, index pages and policy evidence are excluded from these content totals.",'',
      '## Corpus boundaries and gaps','',
      '- Piper: the official author message inventory contains 2,397 entries. Short player descriptions are recorded as text gaps. Manuscripts are not asserted to reproduce delivery word for word. Articles, interviews and book downloads have separate inventories when their phases run. Coauthor cases require review.',
      '- Rogers: 619 official transcript/outline landing pages. Several pages can offer the same PDF. The source manifests retain that relationship; file totals deduplicate repeated URLs. Publisher-labeled transcripts, outlines and uncertain classifications remain distinguishable.',
      '- Packer: 27 entries in the C. S. Lewis Institute author category. Offered main PDF links are collected; audio-only entries and missing grants remain explicit. Article and interview PDFs are not counted as sermons. Coauthors and excerpts require work-level review.',
      '- Graham: four identified official sermon/devotional PDFs. This is a discovery set, not a complete bibliography or a transcript counterpart to the audio archive. The research center holds further transcripts and manuscripts.',
      '- Sproul: two titles offered by a distributor that states special permission from Ligonier. PDF and EPUB are two formats of the same book. The wider Crucial Questions store offer requires its download/checkout workflow; sermon transcript corpus permission remains unresolved.',
      '- Criswell: the first official sitemap provides 2,000 sermon URLs; the advertised second and third sermon sitemap URLs returned 404. The public REST request returned 401. The complete 4,093-entry search archive has not been reconciled. Bulk text acquisition rights remain unresolved.',
      '- MacArthur: the legacy policy expressly permits specified sermon-series transcript uses. Its content links redirect to the current site, whose wildcard robots rule disallows crawling. No bulk crawl or alternate-host workaround is enabled.',
      '- Lloyd-Jones: the Trust states that text rights belong to publishers and its terms restrict systematic retrieval for a database. No transcript corpus has been acquired from that archive.','',
      '## Rights and editorial status','',
      'All acquired copies remain outside public publication. Personal-copy permissions do not establish public full-text hosting, public search, model-training or redistribution rights. See the [source queue](SOURCE-QUEUE.md) for unresolved access. No permission request has been sent. Selection of Graham, Rogers and Criswell for this acquisition does not silently change the broader Calvinist core-teaching roster.','',
      'Book samples are labeled `book-sample` and excluded from any assertion of complete book editions. Website dates, preaching dates printed inside PDFs, archive date labels and retrieval timestamps are kept distinct. Sermon audio has not been retranscribed by AI.','',
      '## Storage and verification','',
      'Original bytes: `BibleProject/sources/library/<source-id>/<asset-id>/`. Each file has its URL, retrieval time, byte count and SHA-256 in the [manifest](acquisition-manifest.json). Derived reading text is under `Website/.local/library/run-modern-texts-2026-10-05/text/`. Original bytes are never overwritten.','',
      'Source inventories and results are saved beside this report. Run `python -X utf8 scripts/report-modern-texts.py --verify` to check all original and derivative hashes. Run `python -X utf8 scripts/enrich-modern-texts.py` after the workers finish to regenerate Scripture and printed-date metadata without further downloads.','',
      'This acquisition ledger is a staging catalog, not a claim that every work has been integrated into the canonical catalog or the app search database. Record counts and extracted word totals are not counts of unique sermons or unique words.','']
    REPORT.mkdir(parents=True,exist_ok=True)
    (REPORT/'REPORT.md').write_text('\n'.join(body),encoding='utf-8',newline='\n')
    print(json.dumps(dict(files=len(files),bytes=summary['originalBytes'],pages=summary['pdfPages'],words=summary['extractedWords'],issues=len(issues))))
    if issues:raise SystemExit(1)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--verify',action='store_true');main(p.parse_args().verify)
