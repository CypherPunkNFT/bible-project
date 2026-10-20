"""Record this bounded Schaff review; extraction and sample matches never auto-pass coverage."""
from pathlib import Path
import csv,datetime,hashlib,json,re
site=Path(__file__).resolve().parent.parent;data=site.parent/'Data'/'TheologicalReferenceLibrary';root=data/'Extracted'/'Schaff-Herzog'
receipt=json.loads((data/'download-receipt.json').read_text(encoding='utf-8-sig'));plans=json.loads((data/'download-additions.json').read_text(encoding='utf-8-sig'))
probes=json.loads((site/'.local/data-acquisition/schaff-comparison-probes.json').read_text(encoding='utf-8'))
probe_by_volume={p['volume']:p for p in probes};records=[];volumes=[]
scanned={3,4,5,6,7,8,10,11,12}
def source_id(file):return hashlib.sha256(file.encode()).hexdigest()[:16]
def entry(file,state,reason,steps,**extra):
    return {'sourceId':source_id(file),'sourceFile':file,'status':'INCOMPLETE','reviewState':state,'reason':reason,'steps':steps,**extra}
for volume in range(1,14):
    pdf=f'Encyclopedias/Schaff-Herzog/volume-{volume:02}.pdf';txt=pdf[:-4]+'.txt';m=json.loads((root/f'volume-{volume:02}-pdf-text.json').read_text(encoding='utf-8'))
    image_only=volume in scanned
    reason='Article prose is in page images. Existing PDF text contains headings/page labels, leaving the volume body unextracted.' if image_only else 'Every PDF page was processed. Full section, footnote and language coverage has not yet been verified.'
    steps={'saved':'done','coverage':'blocked' if image_only else 'pending','compared':'pending','complete':'pending'}
    metrics={'pdfPages':m['pageCount'],'pagesWithUnder80Words':len(m['sparsePagesUnder80Words']),'sparseImagePages':len(m['sparsePagesWithImages']),'extractionSeconds':m['runtimeSeconds'],'textBytes':m['textBytes'],'sourceReceiptSha256':m['sourceReceiptSha256'],'sourceHashBasis':m['sourceHashBasis'],'textSha256':m['textSha256']}
    records.append(entry(pdf,'known-gap' if image_only else 'unverified',reason,steps,readingFile=str((root/m['textFilename']).relative_to(data)).replace('\\','/'),textFilename=m['textFilename'],textLabel='Existing PDF text layer · page-located extraction',representationLabel='CCEL PDF text layer',readPriority=1,metrics=metrics))
    original=(data/txt).read_text(encoding='utf-8-sig');placeholders=len(re.findall(r'Image of page',original))
    txt_reason=f'The saved CCEL TXT contains {placeholders} image-page placeholders; sampled article prose is absent.' if image_only else 'Saved CCEL TXT has substantial text; correspondence with the full volume remains unverified.'
    if volume==13:txt_reason+=' The PDF extraction and TXT have substantially different word counts; the difference has not been reconciled.'
    records.append(entry(txt,'known-gap' if image_only else 'unverified',txt_reason,steps.copy(),representationLabel='Original CCEL TXT',readPriority=5,metrics={'imagePlaceholders':placeholders,'bytes':(data/txt).stat().st_size}))
    vol={'volume':volume,'status':'INCOMPLETE','reviewState':'known-gap' if image_only else 'unverified','reason':reason,'pdf':metrics,'comparison':None}
    ia_meta=root/'IA'/f'volume-{volume:02}-archive-ocr.json'
    if ia_meta.exists():
        download=json.loads(ia_meta.read_text(encoding='utf-8'));probe=probe_by_volume.get(volume)
        if probe and (len(probe['matches'])!=3 or not all(x['foundInIA'] for x in probe['matches'])):raise RuntimeError('Sample checks must be reviewed: '+str(volume))
        ia_reason='Located prose matches were found in the IA OCR for the sampled beginning/middle/end areas. Full page/section coverage, footnotes and reading order remain unverified; the IA scan and CCEL reprint are separate edition witnesses.' if probe else 'Previously identified IA OCR downloaded for reading. No page comparison or full-coverage review has been performed; the scanned edition remains a separate witness.'
        if volume==12:ia_reason+=' Appendix pagination needs reconciliation: IA ends at printed page 599; the CCEL TXT page index ends at 576.'
        comparison={**probe,'pdfSamplePages':{3:[30,271,534],6:[30,272,537],12:[30,157,307]}[volume],'scope':'Three rendered PDF page samples visually inspected per volume; targeted phrase checks in each text. This does not certify every intervening page.','ocrQuality':'Visible OCR errors remain, including names and line-break hyphenation.','editionCaution':'CCEL identifies a Baker reprint; IA is a separate scanned printing. Do not transfer page locators across them.','download':download} if probe else None
        date_note=' '.join(probe['titleDateEvidence']) if probe and probe['titleDateEvidence'] else 'Printing date has not been reconciled from the text.'
        records.append(entry(download['plannedSourcePath'],'unverified',ia_reason,{'saved':'done','coverage':'pending','compared':'sampled' if probe else 'pending','complete':'pending'},readingFile=download['localFile'],textFilename=Path(download['localFile']).name,textLabel='Internet Archive OCR · separate scanned edition',representationLabel='Alternate IA OCR · '+('sample comparison done' if probe else 'not yet reviewed'),bibliographicNote='Separate IA scanned edition. '+date_note+' The original acquisition plan recorded 1908; that inherited date is not treated as verified. The held CCEL PDF identifies a later Baker reprint.',readPriority=20,acquisition={'status':'downloaded','bytes':download['bytes'],'recordedAt':download['downloadedAt']},metrics={'bytes':download['bytes'],'sha256':download['sha256']},comparison=comparison))
        vol.update({'reviewState':'unverified','reason':ia_reason,'comparison':comparison})
    volumes.append(vol)
for plan in plans:
    if plan['group']!='Schaff-Herzog' or any(r['sourceId']==source_id(plan['file']) for r in records):continue
    records.append(entry(plan['file'],'unverified','Alternate OCR is identified but not saved or coverage-checked.',{'saved':'pending','coverage':'pending','compared':'pending','complete':'pending'},readPriority=0))
result={'schemaVersion':1,'updatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'New Schaff–Herzog: 13 held PDFs extracted; saved IA TXT witnesses are available for reading. Comparisons remain limited to volumes 3, 6 and 12.','policy':{'COMPLETE':'The intended volume and edition are identified, full text coverage is verified, known gaps resolved and evidence recorded. File existence, copyability, word counts and sample matches alone cannot pass this gate.','INCOMPLETE':'The completeness workflow is unfinished: a known gap exists or required coverage checks are pending. The reason distinguishes these states.','accuracy':'Coverage and transcription accuracy are separate. COMPLETE does not mean error-free OCR.','scope':'Status applies to a particular reading representation of a volume. A good alternate never makes the original representation complete.'},'summary':{'pdfsExtracted':13,'pdfPagesProcessed':sum(v['pdf']['pdfPages'] for v in volumes),'pdfsWithKnownBodyGaps':len(scanned),'iaWitnessesSampled':3,'iaTextsSaved':sum(1 for r in records if r.get('acquisition')),'completeVolumes':0,'runtimeExtractionSeconds':round(sum(v['pdf']['extractionSeconds'] for v in volumes),3)},'volumes':volumes,'representations':records}
(root/'completeness-review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
with (root/'completeness-review.csv').open('w',encoding='utf-8-sig',newline='') as stream:
    writer=csv.writer(stream);writer.writerow(['volume','status','review_state','pdf_pages','pdf_text_bytes','ia_sampled','reason'])
    for v in volumes:writer.writerow([v['volume'],v['status'],v['reviewState'],v['pdf']['pdfPages'],v['pdf']['textBytes'],bool(v['comparison']),v['reason']])
print(json.dumps(result['summary']|{'representationsReviewed':len(records),'report':str(root/'completeness-review.json')},ensure_ascii=True))
