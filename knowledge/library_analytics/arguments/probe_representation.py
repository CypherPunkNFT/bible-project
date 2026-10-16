"""Bounded diagnostic of one immutable failed representation; no writes upstream."""
import json
from collections import Counter
from .inputs import ROOT,read,Inputs,write_json
from ..section_contract import resolve_segment,checked_bytes,html_render,text_hash,cache_blocks
def main():
    i=Inputs();failures=read(ROOT/'failed-attempts.json')['failed_job_receipts'];out=[]
    for f in failures:
        if f['error']!='Block text changed':continue
        doc=f['scope'].removeprefix('document:');rows=i.segments(doc);seen=set()
        for r in rows:
            key=(r['path'],r['coordinate'],r['block_ordinal'],r['block_text_sha256'])
            if key in seen:continue
            seen.add(key);value={'document_id':doc,'path':r['path'],'coordinate':r['coordinate'],'block_ordinal':r['block_ordinal'],'expected_block_sha256':r['block_text_sha256']}
            try:resolve_segment(r,{});value['original_resolver']='passed'
            except Exception as e:
                value['original_resolver']=str(e);raw,_=checked_bytes(r['path'],r['asset_sha256']);value['source_bytes_match']=True;variants=[]
                if r['coordinate']=='original-html-rendered':
                    from bs4 import BeautifulSoup
                    value['autodetected_encoding']=BeautifulSoup(raw,'html.parser').original_encoding
                    for encoding in ['utf-8','utf-8-sig','windows-1252','latin-1']:
                        try:
                            body=html_render(raw.decode(encoding))[0];variants.append({'encoding':encoding,'sha256':text_hash(body),'matches_pinned_block':text_hash(body)==r['block_text_sha256'],'characters':len(body)})
                        except Exception as error:variants.append({'encoding':encoding,'error':str(error)})
                value['variants']=variants
            out.append(value)
    i.close();write_json(ROOT/'representation-diagnostic.json',out);print(json.dumps(out,indent=2))
if __name__=='__main__':main()
