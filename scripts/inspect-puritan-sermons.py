"""Local L02 scan inspection; PDF page numbers are one-based, never printed pages."""
import argparse
import importlib.util
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import pymupdf
from bible.paths import SOURCES, SITE

RAW=SOURCES/'library/source-internet-archive'
LOCAL=SITE/'.local/library/run-l02-puritan-sermons-2026-10-05'
ASSET_PREFIX='asset-l02-'

def pages(ident):
    cache=LOCAL/(ident+'.pages-v2.json')
    if cache.exists(): return json.loads(cache.read_text(encoding='utf-8'))
    p=next((RAW/(ASSET_PREFIX+ident+'-pdf')).glob('*.pdf'))
    with pymupdf.open(p) as d: data=[p.get_text() for p in d]
    if sum(bool(t.strip()) for t in data)<len(data)/10:
        xml=next((RAW/(ASSET_PREFIX+ident+'-ocrxml')).glob('*.xml'),None)
        if xml:
            root=ET.parse(xml).getroot()
            data=['\n'.join(' '.join(w.text or '' for w in line.findall('WORD')) for line in obj.findall('.//LINE')) for obj in root.findall('.//OBJECT')]
            with pymupdf.open(p) as d:
                if len(data)!=len(d): raise ValueError('OCR XML/PDF page-count mismatch')
    cache.parent.mkdir(parents=True,exist_ok=True)
    cache.write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')
    return data

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('item'); p.add_argument('--pages'); p.add_argument('--find'); p.add_argument('--limit',type=int,default=1800); p.add_argument('--render',action='store_true'); p.add_argument('--mission',choices=['L02','L03'],default='L02'); a=p.parse_args()
    if a.mission=='L03':
        ASSET_PREFIX='asset-l03-'; LOCAL=SITE/'.local/library/run-l03-historic-preaching-2026-10-05'
    data=pages(a.item)
    indexes=[]
    if a.pages:
        for bit in a.pages.split(','):
            lo,_,hi=bit.partition('-'); indexes.extend(range(int(lo)-1,int(hi or lo)))
    elif a.find: indexes=[i for i,t in enumerate(data) if re.search(a.find,t,re.I)]
    else: indexes=list(range(min(12,len(data))))
    for i in indexes:
        if a.render:
            with pymupdf.open(next((RAW/(ASSET_PREFIX+a.item+'-pdf')).glob('*.pdf'))) as d:
                out=LOCAL/(a.item+'-p'+str(i+1)+'.png'); d[i].get_pixmap(matrix=pymupdf.Matrix(1.4,1.4)).save(out); print(out)
        else: print('PDF PAGE',i+1,re.sub(r'\s+',' ',data[i])[:a.limit])
