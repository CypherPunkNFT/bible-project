"""Add source metadata to acquired texts offline, preserving source assertions."""
import hashlib
import json
import re
from bs4 import BeautifulSoup
from bible.paths import SOURCES
from modern_texts_common import CACHE,REPORT,SITE,write

def main():
    canonical={}
    for p in (SITE/'content/library/catalog/assets').glob('*.json'):
        a=json.loads(p.read_text(encoding='utf-8'))
        if a.get('canonicalUrl'):canonical.setdefault(a['canonicalUrl'],[]).append(a['id'])
    for name in ['piper','rogers']:
        path=REPORT/(name+'-results.json')
        if not path.exists():continue
        records=json.loads(path.read_text(encoding='utf-8'))
        for url,r in records.items():
            r['existingCatalogAssetIds']=canonical.get(url,[])
            if name=='piper' and r.get('assets'):
                a=r['assets'][0];data=(SOURCES/a['relativePath']).read_bytes()
                s=BeautifulSoup(data,'html.parser')
                r['scripture']=[e.get_text(' ',strip=True) for e in s.select('a[data-grouping-type="Scripture"]')]
                r['sourceSeries']=[dict(label=e.get_text(' ',strip=True),url=e['href']) for e in s.select('a[data-grouping-type="Series"]')]
                r['sourceTopics']=[e.get_text(' ',strip=True) for e in s.select('a[data-grouping-type="Topic"]')]
                r['mainTextAssessment']='Source metadata, not a verse-by-verse exposition assessment'
            if name=='rogers':
                page=CACHE/'http'/(hashlib.sha256(url.encode()).hexdigest()+'.body')
                if page.exists():
                    s=BeautifulSoup(page.read_bytes(),'html.parser')
                    r['sourceDateLabels']=[e.get_text(' ',strip=True) for e in s.select('time')]
                for a in r.get('assets',[]):
                    if not a.get('derivedText'):continue
                    text=(SITE/a['derivedText']['path']).read_text(encoding='utf-8')
                    norm=re.sub(r'[ \t]+',' ',text)
                    date=re.search(r'Date Preached:\s*([^\n]+)',norm,re.I)
                    scripture=re.search(r'Main Scripture Text:\s*([^\n]+)',norm,re.I)
                    a['printedPreachingDate']=date.group(1).strip() if date else None
                    a['printedMainText']=scripture.group(1).strip() if scripture else None
                    if 'transcript' in a.get('linkLabel','').lower() and len(text.split())>=1500:
                        a['textKind']='publisher-labeled-transcript-with-possible-outline'
                    elif re.search(r'SERMON\s+TRANSCRIPT',text,re.I):a['textKind']='publisher-labeled-transcript'
                    else:a['textKind']='outline-or-other-needs-review'
                    a['transcriptReview']='Source label and text length checked; not collated against full audio'
                    a['derivedText']['method']='pypdf text extraction; no OCR or generated content'
                    write((SOURCES/a['relativePath']).parent/'provenance.json',a)
        write(path,records)
    print('Offline source metadata enrichment complete')

if __name__=='__main__':main()
