"""Download only explicitly named, previously identified Schaff IA TXT witnesses."""
from pathlib import Path
import argparse,datetime,hashlib,json,time,urllib.request,urllib.error

site=Path(__file__).resolve().parent.parent
data=site.parent/'Data'/'TheologicalReferenceLibrary'
out=data/'Extracted'/'Schaff-Herzog'/'IA'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--download',nargs='+',type=int,choices=[3,4,5,6,7,8,10,11,12],required=True)
args=parser.parse_args()
plans=json.loads((data/'download-additions.json').read_text(encoding='utf-8-sig'))
out.mkdir(parents=True,exist_ok=True)
for volume in args.download:
    planned=f'Encyclopedias/Schaff-Herzog/volume-{volume:02}-archive-ocr.txt'
    record=next(r for r in plans if r['file']==planned)
    target=out/Path(planned).name;receipt=target.with_suffix('.json')
    if receipt.exists():
        old=json.loads(receipt.read_text(encoding='utf-8'))
        if old['sourceUrl']!=record['url'] or hashlib.sha256(target.read_bytes()).hexdigest()!=old['sha256']:raise RuntimeError('Existing IA witness changed')
        print(json.dumps({'volume':volume,'state':'already downloaded'}),flush=True);continue
    if target.exists():raise RuntimeError('Unreceipted IA file exists; preserve for review')
    started=time.monotonic();raw=None
    for attempt,url in enumerate([record['url'],record['url']+'?download=1'],1):
        request=urllib.request.Request(url,headers={'User-Agent':'BibleProject-reference-comparison/1.0'})
        try:
            with urllib.request.urlopen(request,timeout=45) as response:
                raw=response.read(10_000_001);final=response.url;content_type=response.headers.get('Content-Type')
            break
        except (urllib.error.URLError,TimeoutError) as error:
            event={'volume':volume,'attempt':attempt,'url':url,'error':str(error),'at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
            with (out/'download-attempts.jsonl').open('a',encoding='utf-8') as stream:stream.write(json.dumps(event)+'\n')
            print(json.dumps(event),flush=True)
    if raw is None:continue
    if len(raw)>10_000_000 or raw.lstrip().lower().startswith((b'<!doctype',b'<html')):raise RuntimeError('Not the expected bounded TXT witness')
    if len(raw)!=record['expectedBytes']:raise RuntimeError(f'IA file size changed: {len(raw)} vs {record["expectedBytes"]}; review before accepting')
    text=raw.decode('utf-8-sig')
    result={'volume':volume,'sourceId':hashlib.sha256(planned.encode()).hexdigest()[:16],'plannedSourcePath':planned,'localFile':str(target.relative_to(data)).replace('\\','/'),'sourceUrl':record['url'],'finalUrl':final,'noteInherited':record['note'],'bytes':len(raw),'contentType':content_type,'sha256':hashlib.sha256(raw).hexdigest(),'downloadedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runtimeSeconds':round(time.monotonic()-started,2),'wordsIndication':len(text.split()),'completeness':'INCOMPLETE','reason':'Downloaded for comparison. Full-volume coverage has not yet been verified.'}
    temp=target.with_suffix('.txt.part');temp.write_bytes(raw);temp.rename(target)
    receipt.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=True),flush=True)
