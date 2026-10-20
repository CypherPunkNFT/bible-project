"""One held Wace/Piercy PDF: direct text extraction and bounded comparison evidence."""
from pathlib import Path
import datetime,hashlib,json,re,time,unicodedata
import pymupdf
site=Path(__file__).resolve().parent.parent;data=site.parent/'Data'/'TheologicalReferenceLibrary';out=data/'Extracted'/'Wace-Piercy'
records=[r for r in json.loads((data/'download-receipt.json').read_text(encoding='utf-8-sig'))['items'].values() if r['group']=='Christian-Biography']
source=next(r for r in records if r['file'].endswith('.pdf'));original_txt=next(r for r in records if r['file'].endswith('.txt'))
pdf=data/source['file'];txt_path=data/original_txt['file'];raw_txt=txt_path.read_bytes();original=raw_txt.decode('utf-8-sig')
if pdf.stat().st_size!=source['bytes'] or len(raw_txt)!=original_txt['bytes']:raise RuntimeError('Acquisition size mismatch')
out.mkdir(parents=True,exist_ok=True);target=out/'wace-piercy-pdf-text.txt';meta=out/'wace-piercy-pdf-text.json';started=time.monotonic()
if meta.exists():
    extraction=json.loads(meta.read_text(encoding='utf-8'));raw=target.read_bytes()
    if extraction['sourceReceiptSha256']!=source['sha256'] or hashlib.sha256(raw).hexdigest()!=extraction['textSha256']:raise RuntimeError('Existing extraction changed; preserve for review')
    text=raw.decode('utf-8');print(json.dumps({'state':'resuming saved extraction','pages':extraction['pageCount']}),flush=True)
else:
    if target.exists():raise RuntimeError('Existing unreceipted extraction; preserve for review')
    parts=[];pages=[];offset=0
    with pymupdf.open(pdf) as doc:
        metadata=doc.metadata
        for n,page in enumerate(doc,1):
            body=page.get_text('text',sort=True);prefix=f'\n\f\n[PDF page {n}]\n';start=offset+len(prefix);parts.extend([prefix,body]);offset=start+len(body)
            pages.append({'pdfPage':n,'start':start,'end':offset,'characters':len(body),'words':len(body.split()),'images':len(page.get_images()),'firstText':body.strip()[:180]})
            if n%500==0:print(json.dumps({'pagesProcessed':n,'totalPages':len(doc)}),flush=True)
    text=''.join(parts);raw=text.encode('utf-8')
    extraction={'schemaVersion':1,'sourceFile':source['file'],'sourceId':hashlib.sha256(source['file'].encode()).hexdigest()[:16],'sourceUrl':source['url'],'sourceBytes':source['bytes'],'sourceReceiptSha256':source['sha256'],'sourceHashBasis':'Inherited acquisition receipt; original size checked before and after extraction.','method':"PyMuPDF get_text('text',sort=True), existing text layer only; no OCR",'engine':pymupdf.VersionBind,'extractedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'pageCount':len(pages),'pdfMetadataInherited':metadata,'textFilename':target.name,'textBytes':len(raw),'textSha256':hashlib.sha256(raw).hexdigest(),'offsetUnit':'Unicode codepoints, half-open, in decoded TXT','runtimeSeconds':round(time.monotonic()-started,3),'completeness':'INCOMPLETE','completenessReason':'Direct extraction and bounded samples only. Full coverage not yet certified.','pages':pages}
    if pdf.stat().st_size!=source['bytes']:raise RuntimeError('PDF changed during extraction')
    part=target.with_suffix('.txt.part');part.write_bytes(raw);part.rename(target);part=meta.with_suffix('.json.part');part.write_text(json.dumps(extraction,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');part.rename(meta)
def normalize(value):
    value=re.sub(r'-\s*\n\s*','',value)
    return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',value).replace('\u2019',"'").replace('\u1fff',"'").replace('\u2018',"'").casefold()).strip()
def occurrences(value,needle):return [m.start() for m in re.finditer(re.escape(needle),value)]
needle='Ce bon homme';pdf_occ=[]
for p in extraction['pages']:
    body=text[p['start']:p['end']]
    for at in occurrences(body,needle):pdf_occ.append({'pdfPage':p['pdfPage'],'context':body[max(0,at-180):at+380]})
txt_occ=[{'offset':at,'context':original[max(0,at-180):at+400]} for at in occurrences(original,needle)]
index_pages=[p['pdfPage'] for p in extraction['pages'] if text[p['start']:p['end']].strip().startswith('Indexes')]
last_body=(index_pages[-1]-1) if index_pages else extraction['pageCount']-30
sample_pages=[100,1133,last_body]
normalized_original=normalize(original);samples=[]
for n in sample_pages:
    p=extraction['pages'][n-1];body=text[p['start']:p['end']];lines=[line.strip() for line in body.splitlines() if len(line.strip())>45]
    candidates=[]
    for i in range(max(0,len(lines)-2)):
        passage=' '.join(lines[i:i+2]);query=normalize(passage);at=normalized_original.find(query)
        if len(query)>85 and at>=0:candidates.append({'pdfPassage':passage,'matchedInOriginalTXT':True,'normalizedTxtOffset':at})
        if len(candidates)==2:break
    samples.append({'pdfPage':n,'pageWords':p['words'],'matches':candidates,'note':'Exact normalized passage matches are bounded samples, not a full-volume coverage test.'})
    with pymupdf.open(pdf) as doc:doc[n-1].get_pixmap(matrix=pymupdf.Matrix(1,1)).save(out/f'comparison-page-{n}.png')
with pymupdf.open(pdf) as doc:
    for p in pdf_occ:doc[p['pdfPage']-1].get_pixmap(matrix=pymupdf.Matrix(1.25,1.25)).save(out/f'french-page-{p["pdfPage"]}.png')
result={'schemaVersion':1,'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'One Wace/Piercy PDF and its original CCEL TXT; three body-page samples and the reported French index passage. No OCR, no other books.','extraction':{k:v for k,v in extraction.items() if k!='pages'},'originalTXT':{'sourceFile':original_txt['file'],'sourceId':hashlib.sha256(original_txt['file'].encode()).hexdigest()[:16],'sourceUrl':original_txt['url'],'bytes':len(raw_txt),'sha256':hashlib.sha256(raw_txt).hexdigest(),'matchesAcquisitionHash':hashlib.sha256(raw_txt).hexdigest()==original_txt['sha256'],'utf8Decoding':'strict successful','mojibakeMarkerCount':original.count('Ã'),'replacementCharacterCount':original.count('\ufffd'),'reference4948':[line for line in original.splitlines() if line.strip().startswith('4948.')]},'french':{'pdfOccurrences':pdf_occ,'txtOccurrences':txt_occ},'bodySamples':samples,'sparsePages':[{'pdfPage':p['pdfPage'],'words':p['words'],'images':p['images'],'firstText':p['firstText']} for p in extraction['pages'] if p['words']<80],'completeness':'INCOMPLETE','reviewState':'unverified','reason':'Bounded comparison performed. No full section/footnote/script coverage certification and no factual-reliability verdict.'}
(out/'comparison-review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pages':extraction['pageCount'],'textBytes':len(raw),'extractionSeconds':extraction['runtimeSeconds'],'frenchPdfPages':[p['pdfPage'] for p in pdf_occ],'frenchTxtOccurrences':len(txt_occ),'bodySamples':samples,'sparsePages':len(result['sparsePages']),'report':str(out/'comparison-review.json')},ensure_ascii=True),flush=True)
