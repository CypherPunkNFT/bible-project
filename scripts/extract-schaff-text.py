"""Extract only selected receipt-bound Schaff PDFs' existing text, with page evidence.

No OCR. Each volume commits separately and can be resumed without overwriting outputs.
"""
from pathlib import Path
import argparse,hashlib,json,re,time,datetime
import pymupdf

site=Path(__file__).resolve().parent.parent
data=site.parent/'Data'/'TheologicalReferenceLibrary'
out=data/'Extracted'/'Schaff-Herzog'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--volumes',nargs='+',type=int,choices=range(1,14),required=True)
args=parser.parse_args()
receipt=json.loads((data/'download-receipt.json').read_text(encoding='utf-8-sig'))
byfile={r['file']:r for r in receipt['items'].values() if r['group']=='Schaff-Herzog'}
out.mkdir(parents=True,exist_ok=True)
for volume in args.volumes:
    started=time.monotonic();source=f'Encyclopedias/Schaff-Herzog/volume-{volume:02}.pdf'
    record=byfile[source];pdf=data/source
    if record['status']!='downloaded' or pdf.stat().st_size!=record['bytes']:raise RuntimeError('Source receipt mismatch: '+source)
    target=out/f'volume-{volume:02}-pdf-text.txt';meta=out/f'volume-{volume:02}-pdf-text.json'
    if meta.exists():
        old=json.loads(meta.read_text(encoding='utf-8'))
        if old['sourceFile']!=source or old['sourceReceiptSha256']!=record['sha256'] or hashlib.sha256(target.read_bytes()).hexdigest()!=old['textSha256']:raise RuntimeError('Existing extraction changed; preserve and review: '+str(meta))
        print(json.dumps({'volume':volume,'state':'already extracted','pages':old['pageCount']}),flush=True);continue
    if target.exists():raise RuntimeError('Unreceipted output exists: '+str(target))
    parts=[];pages=[];offset=0
    with pymupdf.open(pdf) as doc:
        metadata=doc.metadata
        for n,page in enumerate(doc,1):
            text=page.get_text('text',sort=True)
            prefix=f'\n\f\n[PDF page {n}]\n'
            start=offset+len(prefix);parts.extend([prefix,text]);offset=start+len(text)
            pages.append({'pdfPage':n,'start':start,'end':offset,'characters':len(text),'words':len(text.split()),'images':len(page.get_images()),'fonts':len(page.get_fonts()),'firstText':text.strip()[:180]})
    body=''.join(parts);raw=body.encode('utf-8')
    sparse=[p['pdfPage'] for p in pages if p['words']<80]
    sparse_images=[p['pdfPage'] for p in pages if p['words']<80 and p['images']]
    summary={'schemaVersion':1,'volume':volume,'sourceFile':source,'sourceId':hashlib.sha256(source.encode()).hexdigest()[:16],'sourceUrl':record['url'],'sourceBytes':record['bytes'],'sourceReceiptSha256':record['sha256'],'sourceHashBasis':'Inherited acquisition receipt; original bytes not rehashed. Size checked before and after extraction.','extractedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':"PyMuPDF get_text('text', sort=True), existing PDF text only; no OCR",'engine':pymupdf.VersionBind,'pageCount':len(pages),'sparsePagesUnder80Words':sparse,'sparsePagesWithImages':sparse_images,'textFilename':target.name,'textBytes':len(raw),'textSha256':hashlib.sha256(raw).hexdigest(),'offsetUnit':'Unicode codepoints, half-open, in the UTF-8 TXT after decoding','pdfMetadataInherited':metadata,'runtimeSeconds':round(time.monotonic()-started,3),'completeness':'INCOMPLETE','completenessReason':'Extraction saved; coverage review is pending. Nonempty text is not proof of complete body text.','pages':pages}
    if pdf.stat().st_size!=record['bytes']:raise RuntimeError('Source changed during extraction')
    temp=target.with_suffix('.txt.part');temp.write_bytes(raw);temp.rename(target)
    temp=meta.with_suffix('.json.part');temp.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');temp.rename(meta)
    print(json.dumps({k:summary[k] for k in ['volume','pageCount','textBytes','runtimeSeconds']}|{'sparsePages':len(sparse),'sparseImagePages':len(sparse_images)}),flush=True)
