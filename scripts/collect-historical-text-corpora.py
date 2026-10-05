"""Collection-level ready-text acquisition; no scans, new OCR or model calls.

One author-organized ebook index; eligible historical authors only. Existing URLs
and work-title matches are reused. The acquisition unit is a collected work,
sermon collection, commentary or theological series, not isolated search hits.
"""
import argparse
import hashlib
import html
import io
import json
import os
import re
import time
import urllib.error
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from datetime import datetime,timezone
from html.parser import HTMLParser
from pathlib import Path,PurePosixPath
from urllib.parse import quote,unquote,urljoin,urlsplit
from bible.paths import SOURCES

SITE=Path(__file__).resolve().parents[1]
LIB=SITE/'content/library'
OUT=LIB/'reports/historical-text-corpora'
CACHE=SITE/'.local/library/historical-text-corpora'
OLD=SITE/'.local/library/run-modern-texts-2026-10-05/http'
INDEX='https://www.monergism.com/1100-free-ebooks-listed-alphabetically-author'
POLICY='https://www.monergism.com/monergism-copyright-permissions'
UA='BibleProjectLibrary/1.0 (private scholarly reading; named author collections)'
SELECTED=['john-calvin','william-perkins','john-owen','richard-sibbes','thomas-watson','john-flavel','thomas-goodwin','thomas-boston','jonathan-edwards','george-whitefield','john-newton','j-c-ryle','charles-hodge','b-b-warfield','herman-bavinck','geerhardus-vos','zacharias-ursinus','heinrich-bullinger','john-knox','francis-turretin','herman-witsius','william-ames','stephen-charnock','john-gill','abraham-kuyper','j-gresham-machen','a-a-hodge','archibald-alexander','louis-berkhof','samuel-m-zwemer']
COLLECTION=re.compile(r'\b(sermons|works|exposition|expositions|commentary|commentaries|lectures|discourses|collected|select|selected|complete|volume|volumes|epistles|gospels|systematic|body of|letters|treatises|decades)\b',re.I)
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def write(p,data):
    p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def norm(t): return re.sub(r'[^a-z0-9]','',t.lower())

def edition_label(row):
    label=row.get('displayTitle',row['editionTitle'])
    volume=re.search(r'\bVol(?:ume)?[ _]*([IVX]+|[1-9])(?=[ _.])',unquote(row['selectedUrl']),re.I)
    if volume and 'vol' not in label.lower():label+=' — Volume '+volume.group(1)
    return label
class Page(HTMLParser):
    def __init__(self): super().__init__(); self.links=[]; self.text=[]; self.href=None; self.label=[]; self.skip=0
    def handle_starttag(self,t,a):
        if t in ['script','style']: self.skip+=1
        if t=='a': self.href=dict(a).get('href'); self.label=[]
    def handle_endtag(self,t):
        if t in ['script','style']: self.skip=max(0,self.skip-1)
        if t=='a' and self.href:
            self.links.append((' '.join(self.label).strip(),self.href)); self.href=None
    def handle_data(self,t):
        if self.skip:return
        self.text.append(t)
        if self.href:self.label.append(t)
def parse(raw):
    p=Page(); p.feed(raw.decode('utf-8',errors='replace') if isinstance(raw,bytes) else raw); return p

def existing():
    urls={}; titles={}
    def walk(x):
        if isinstance(x,list):
            for y in x: yield from walk(y)
        elif isinstance(x,dict):
            if x.get('relativePath') and x.get('sha256'): yield x
            for k,v in x.items():
                if isinstance(v,(dict,list)):yield from walk(v)
    for folder in [LIB/'catalog/assets',LIB/'reports']:
        for p in folder.rglob('*.json'):
            if OUT in p.parents:continue
            try: data=read(p)
            except (OSError,ValueError):continue
            for f in walk(data):
                if not (SOURCES/f['relativePath']).is_file():continue
                for key in ['url','finalUrl','canonicalUrl']:
                    if f.get(key):urls[f[key]]=dict(relativePath=f['relativePath'],sha256=f['sha256'],evidence=p.relative_to(SITE).as_posix())
                if f.get('title'):titles[norm(f['title'])]=f['relativePath']
    # Root work titles with genuinely acquired text assets, not scan-only holdings.
    for p in (LIB/'catalog/assets').glob('*.json'):
        a=read(p)
        if a.get('acquisitionStatus')!='downloaded' or a.get('format') not in ['html','text','epub','other']:continue
        e=LIB/'catalog/editions'/(a['editionId']+'.json')
        if not e.exists():continue
        w=read(LIB/'catalog/works'/(read(e)['workId']+'.json'))
        titles[norm(w['title'])]=a['relativePath']
    return urls,titles

class Client:
    def __init__(self):
        self.last=0; self.robots={}; self.path=OUT/'http-evidence.json'
        self.meta=read(self.path) if self.path.exists() else {}
    def get(self,url):
        parts=urlsplit(url); url=parts._replace(path=quote(unquote(parts.path),safe='/')).geturl()
        key=hashlib.sha256(url.encode()).hexdigest(); dest=CACHE/'http'/(key+'.body')
        if url in self.meta:
            m=self.meta[url]; data=Path(m['path']).read_bytes(); assert hashlib.sha256(data).hexdigest()==m['sha256']; return data,m
        old=OLD/(key+'.body'); oldmeta=OLD/(key+'.json')
        if old.exists() and oldmeta.exists():
            data=old.read_bytes(); m=read(oldmeta); assert hashlib.sha256(data).hexdigest()==m['sha256']; m['path']=str(old); self.meta[url]=m; write(self.path,self.meta); return data,m
        origin=parts.scheme+'://'+parts.netloc
        if origin not in self.robots and not url.endswith('/robots.txt'):
            rp=urllib.robotparser.RobotFileParser()
            try:
                raw,_=self.get(origin+'/robots.txt'); rp.parse(raw.decode().splitlines())
            except urllib.error.HTTPError as e:
                if e.code!=404: raise
                rp.parse([])
            self.robots[origin]=rp
        if origin in self.robots and not self.robots[origin].can_fetch(UA,url):raise ValueError('robots excludes URL')
        time.sleep(max(0,1.2-(time.monotonic()-self.last)))
        req=urllib.request.Request(url,headers={'User-Agent':UA})
        try:
            with urllib.request.urlopen(req,timeout=30) as resp: data=resp.read(); final=resp.url; mime=resp.headers.get_content_type()
        finally:self.last=time.monotonic()
        dest.parent.mkdir(parents=True,exist_ok=True)
        if dest.exists():raise ValueError('Unmanifested cache file')
        dest.write_bytes(data)
        m=dict(url=url,finalUrl=final,path=str(dest),sha256=hashlib.sha256(data).hexdigest(),byteCount=len(data),mimeType=mime,retrievedAt=datetime.now(timezone.utc).isoformat())
        self.meta[url]=m; write(self.path,self.meta); return data,m

def discover(client):
    raw,_=client.get(INDEX); policy,_=client.get(POLICY)
    text=' '.join(parse(policy).text)
    assert 'personal study' in text and 'not be reposted' in text
    authors={a['id']:a for a in read(LIB/'authors.json')['authors']}
    aliases={}
    for slug in SELECTED:
        a=authors['author-'+slug]; assert a['eligibility']=='eligible'
        parts=a['name'].split(); aliases[norm(parts[-1]+', '+' '.join(parts[:-1]))]=a['id']
    for name,slug in [('Ryle, John Charles','j-c-ryle'),('Ryle, J.C.','j-c-ryle'),('Warfield, Benjamin B.','b-b-warfield'),('Warfield, Benjamin','b-b-warfield'),('Warfield, Banjamin','b-b-warfield'),('Warfield, B.B.','b-b-warfield'),('Hodge, A.A.','a-a-hodge'),('Hodge, Archibald Alexander','a-a-hodge'),('Bullinger, Henry','heinrich-bullinger'),('Zwemer, Samuel','samuel-m-zwemer')]:aliases[norm(name)]='author-'+slug
    found=[]
    # Each index entry is author text followed by a book anchor, separated by BR.
    for chunk in re.split(r'<br\s*/?>',raw.decode('utf-8',errors='replace'),flags=re.I):
        p=parse(chunk)
        for label,url in p.links:
            if not label:continue
            full=' '.join(p.text); pos=full.find(label); prefix=full[:pos].strip()
            matched=next((aid for alias,aid in aliases.items() if norm(prefix).endswith(alias)),None)
            if not matched:continue
            dest=urljoin(INDEX,url)
            if urlsplit(dest).hostname not in ['www.monergism.com','monergism.com']:continue
            if any(x['sourcePage']==dest for x in found):continue
            title=html.unescape(label).strip()
            found.append(dict(authorId=matched,author=authors[matched]['name'],title=title,sourcePage=dest,priority='collection' if COLLECTION.search(title) else 'individual-work',discoverySource=INDEX))
    assert len(found)>100,'Index parser requires review'
    urls,titles=existing()
    for row in found:
        if norm(row['title']) in titles:row['existingTitleMatch']=titles[norm(row['title'])]
    write(OUT/'author-collection-inventory.json',dict(date='2026-10-05',policyUrl=POLICY,scope='Eligible historic authors; priority collected sermons, works, commentaries and series. No claim every listed ebook is a complete author corpus.',entries=found))
    print('Index titles',len(found),'collection targets',sum(x['priority']=='collection' and not x.get('existingTitleMatch') for x in found),'authors',len({x['authorId'] for x in found}),flush=True)
    return found

def epub_text(data):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        container=ET.fromstring(z.read('META-INF/container.xml'))
        opf=next(e.get('full-path') for e in container.iter() if e.tag.endswith('rootfile'))
        root=ET.fromstring(z.read(opf)); base=PurePosixPath(opf).parent
        manifest={e.get('id'):e.get('href') for e in root.iter() if e.tag.endswith('}item')}
        spine=[e.get('idref') for e in root.iter() if e.tag.endswith('}itemref')]
        chunks=[]; measurements=[]
        for ident in spine:
            href=manifest[ident].split('#')[0]; name=str(base/unquote(href))
            page=parse(z.read(name)); text=' '.join(' '.join(page.text).split())
            chunks.append(text); measurements.append(dict(spineId=ident,path=name,words=len(text.split())))
        content='\n\n'.join(chunks)
        meta={name:[' '.join(e.itertext()) for e in root.iter() if e.tag.endswith('}'+name)] for name in ['title','creator','language','rights']}
        # Require sustained body text, not merely a cover, contents list or image captions.
        valid=sum(m['words']>=300 for m in measurements)>=2 or max((m['words'] for m in measurements),default=0)>=1500
        return content,dict(metadata=meta,spineItems=len(spine),spine=measurements,words=len(content.split()),substantialBody=valid)

def acquire(client,entries):
    path=OUT/'acquisition-results.json'; results=read(path) if path.exists() else {}
    urls,_=existing()
    targets=[e for e in entries if e['priority']=='collection' and not e.get('existingTitleMatch')]
    denied=0
    for row in targets:
        page=row['sourcePage']; key=page if not row.get('selectedVolumeUrl') else row['selectedVolumeUrl']
        if key in results:continue
        record=dict(**row,status='pending')
        try:
            raw,_=client.get(page); parsed=parse(raw)
            links=list(dict.fromkeys(urljoin(page,u) for _,u in parsed.links if urlsplit(u).path.lower().endswith('.epub') and urlsplit(urljoin(page,u)).hostname in ['www.monergism.com','monergism.com']))
            if not links:
                record.update(status='no-epub-offered',note='No scan/PDF fallback attempted. Listed for later text-format review.');results[key]=record;write(path,results);continue
            # Additional volume selection is explicit after collection-page review.
            url=row.get('selectedVolumeUrl',links[0]); assert url in links
            record.update(offeredEpubs=links,selectedUrl=url)
            if url in urls:
                record.update(status='already-acquired',existing=urls[url]);results[key]=record;write(path,results);continue
            data,meta=client.get(url); text,quality=epub_text(data)
            record['quality']=quality
            if not quality['substantialBody']:
                record.update(status='rejected-no-substantial-text',note='No OCR attempted.');results[key]=record;write(path,results);continue
            aid='asset-historical-ready-'+hashlib.sha256(url.encode()).hexdigest()[:18]
            folder=SOURCES/'library/source-monergism'/aid; folder.mkdir(parents=True,exist_ok=True)
            original=folder/'original.epub'
            if original.exists():assert hashlib.sha256(original.read_bytes()).hexdigest()==meta['sha256']
            else:original.write_bytes(data)
            derived=CACHE/'text'/(aid+'.txt');derived.parent.mkdir(parents=True,exist_ok=True)
            derived.write_text(text,encoding='utf-8',newline='\n')
            asset=dict(assetId=aid,url=url,finalUrl=meta.get('finalUrl'),relativePath=original.relative_to(SOURCES).as_posix(),sha256=meta['sha256'],byteCount=len(data),retrievedAt=meta.get('retrievedAt'),format='epub',authorId=row['authorId'],title=row['title'],sourcePage=page,policyUrl=POLICY,useScope='private-personal-educational-reading',publicHostingAllowed=False,publicFullTextIndexAllowed=False,derivedText=dict(path=derived.relative_to(SITE).as_posix(),sha256=hashlib.sha256(derived.read_bytes()).hexdigest(),words=quality['words'],method='EPUB package spine order; existing HTML text, no OCR or model calls'))
            record.update(status='acquired-ready-text',asset=asset)
            write(folder/'provenance.json',asset);urls[url]=asset;denied=0
        except Exception as exc:
            record.update(status='failed',error=str(exc))
            if isinstance(exc,urllib.error.HTTPError) and exc.code in [401,403,429]:denied+=1
            if isinstance(exc,urllib.error.HTTPError) and exc.code in [401,429]:denied=3
        results[key]=record;write(path,results)
        print(row['author'],record['status'],row['title'],flush=True)
        if denied>=3:print('Stopping after access denials; no bypass.',flush=True);break

def complete_volumes(client):
    results=read(OUT/'acquisition-results.json'); targets=[]
    reviewed_sets={'The Works of Jonathan Edwards', 'E Voto Dordraceno: Commentary on the Heidelberg Catechism', 'Dictaten Dogmatiek: Lectures on Dogmatics', 'An Exposition of the Epistle to the Hebrews', 'The Works of the Reverend George Whitefield, M.A.'}
    for key,row in results.items():
        if key!=row['sourcePage'] or row['title'] not in reviewed_sets:continue
        for url in row.get('offeredEpubs',[])[1:]:
            targets.append(dict(authorId=row['authorId'],author=row['author'],title=row['title'],sourcePage=row['sourcePage'],priority='collection',selectedVolumeUrl=url,discoverySource=INDEX))
    acquire(client,targets)

def reconcile():
    path=OUT/'acquisition-results.json'; results=read(path)
    manifest=read(LIB/'reports/text-backlog/ready-text-acquisition-manifest.json')['files']
    calvin=[r for r in manifest if r.get('relativePath') and '/calvin/' in r.get('url','')]
    for row in results.values():
        if row['status']!='acquired-ready-text':continue
        row['editionTitle']='; '.join(row['quality']['metadata']['title']) or row['title']
        row['asset']['title']=row['editionTitle']
        row['asset']['sourceIndexTitle']=row['title']
        text=(SITE/row['asset']['derivedText']['path']).read_text(encoding='utf-8')
        disclosure=re.search(r'(?:using|by|used)\s+Claude',text[:15000],re.I)
        row['reviewClass']='publisher-ai-edition-review' if disclosure else 'ready-text-not-fully-proofread'
        row['quality']['publisherAiDisclosure']=bool(disclosure)
        checked_titles={'Sixty-Six Sermons: On Important and Interesting Subjects','The Works of Jonathan Edwards','Lectures on Calvinism: The Stone Lectures of 1898','The Letters of John Newton','Expository Thoughts on the Gospels','The Works of the Reverend George Whitefield, M.A.'}
        if row['title'] in checked_titles and not row.get('selectedVolumeUrl'):
            row['quality']['bodySpotCheck']=dict(date='2026-10-05',method='Read 350-character samples at 10%, 50% and 90% of extracted text',finding='Readable sustained prose; limited sample, not full proofreading')
        if row['title'].startswith('Sixty-Six Sermons'):
            row['quality']['textualIssue']='Possible transcription typo Ho for He in sampled body text; original preserved. Text-ready does not mean typo-free.'
        if disclosure:
            row['quality']['disclosureLocator']=dict(derivedTextCharacterOffset=disclosure.start(),location='EPUB front matter: copyright or editorial note')
            row['reviewNote']='Publisher discloses model-generated transcription/translation. Retained as a separate review copy; excluded from the primary ready-text batch. No claim of verified historical wording.'
        if row['title']=='Lectures on Calvinism: The Stone Lectures of 1898':
            row['reviewNote']='EPUB title metadata says 1989–1899; the source index says 1898. Preserve this metadata error/conflict, and use the source-index title for display.'
            row['displayTitle']=row['title']
        if len(row.get('offeredEpubs',[]))>1:
            if row['title']=="Calvin's Commentaries":
                row['coverageNote']='This EPUB covers Genesis only. Reuse the previously acquired 45 CCEL commentary XML volumes for wider coverage; do not count this download as the whole collection. Manifest title correction supersedes the original acquisition sidecar label.'
                row['existingCollectionFiles']=[{k:f[k] for k in ['assetId','relativePath','sha256','url']} for f in calvin]
            elif row['title']=='Sermons on Ephesians':
                row['coverageNote']='Selected the historical Golding text. The second offered EPUB is explicitly the modernized edition; not a missing second volume.'
            else:
                row['coverageNote']='A separate volume of the linked set; use selectedUrl and EPUB metadata for volume identity. Source-page title alone is not a volume title.'
        row['quality']['readiness']='substantial existing body text; no OCR; not fully proofread'
    write(path,results)

def report():
    reconcile()
    inv=read(OUT/'author-collection-inventory.json')['entries']
    results=read(OUT/'acquisition-results.json') if (OUT/'acquisition-results.json').exists() else {}
    stats=Counter(r['status'] for r in results.values()); acquired=[r for r in results.values() if r['status']=='acquired-ready-text']
    primary=[r for r in acquired if r['reviewClass']=='ready-text-not-fully-proofread']
    flagged=[r for r in acquired if r['reviewClass']=='publisher-ai-edition-review']
    for r in acquired:
        a=r['asset'];assert hashlib.sha256((SOURCES/a['relativePath']).read_bytes()).hexdigest()==a['sha256']
        assert hashlib.sha256((SITE/a['derivedText']['path']).read_bytes()).hexdigest()==a['derivedText']['sha256']
    summary=dict(date='2026-10-05',indexedTitles=len(inv),indexedAuthors=len({r['authorId'] for r in inv}),collectionTargets=sum(r['priority']=='collection' and not r.get('existingTitleMatch') for r in inv),statusCounts=dict(stats),acquiredEditions=len(acquired),acquiredSourcePages=len({r['sourcePage'] for r in acquired}),acquiredAuthors=len({r['authorId'] for r in acquired}),extractedWords=sum(r['quality']['words'] for r in acquired),newScans=0,newOcr=0,limits=['Edition titles may describe selections, collected essays or complete works; no author-wide completeness assertion.','Text quality checks establish substantial extractable content, not full proofreading.','Original spelling/modernization and contributors remain in EPUB metadata.','Private reading acquisition only; no curated file republication or public full-text indexing.'])
    summary.update(primaryReadyTextEditions=len(primary),publisherAiEditionsRequiringReview=len(flagged),primaryExtractedWords=sum(r['quality']['words'] for r in primary))
    write(OUT/'summary.json',summary)
    lines=['# Historical ready-text collections','', 'One author-organized source inventory; collected works, sermon collections, commentaries and theological books acquired as EPUB with existing body text. No scan downloads, new OCR/transcription work, or isolated web-search downloads.','',f"Indexed **{len(inv)} titles across {summary['indexedAuthors']} eligible historical authors**. Acquired **{len(acquired)} ready-text editions across {summary['acquiredAuthors']} authors**, containing **{summary['extractedWords']:,} extracted words**. Word totals include repeated material across overlapping collections; they are not unique-word counts.",'', '[Source library]('+INDEX+') · [Permissions]('+POLICY+') · [Full inventory](author-collection-inventory.json) · [Acquisition and quality ledger](acquisition-results.json)','', 'Existing holdings are checked by source URL and normalized title before downloads. Title matches are reuse candidates, not proof of edition equivalence. Other modern-preacher collection jobs were not changed.','', '## Acquired editions','', '| Author | Edition | Extracted words | EPUB spine items |','|---|---|---:|---:|']
    lines[4]+=f" **{len(primary)} editions form the primary reading batch; {len(flagged)} publisher-disclosed AI transcription/translation editions are held separately for review.** Primary-batch words: **{summary['primaryExtractedWords']:,}**. Absence of a disclosure is not proof of human transcription. [Open local EPUB and TXT files](FILES.md)."
    for row in sorted(primary,key=lambda r:(r['author'],r['title'],r['selectedUrl'])):
        label=edition_label(row)
        lines.append(f"| {row['author']} | [{label.replace('|','/')}]({row['sourcePage']}) | {row['quality']['words']:,} | {row['quality']['spineItems']} |")
    lines+=['','## Publisher AI editions held for review','', 'These downloaded copies contain publisher disclosures of model-generated transcription or translation. They are excluded from the primary reading-batch count; historical wording and translation accuracy remain unverified. No AI transcription was run by this acquisition process.','', '| Author | Edition | Source |','|---|---|---|']
    for row in flagged:lines.append(f"| {row['author']} | {row['editionTitle']} | [Publisher]({row['sourcePage']}); copyright/editorial note in EPUB front matter |")
    lines+=['','## Collection coverage','', 'Spine items are EPUB packaging divisions, not sermon or chapter counts. The sermon counts in book titles are publisher claims until their contents have been individually reconciled.','', 'Calvin’s newly acquired commentary EPUB covers **Genesis only**; the wider commentary collection is already held as **45 CCEL XML volumes** in the [existing manifest](../text-backlog/ready-text-acquisition-manifest.json). The alternate modernized Ephesians sermon edition was not downloaded. Original-language, translation and modernization claims need edition-level assessment before recommended teaching or public use.','', '| Multi-volume source | Offered EPUBs | Acquired volumes |','|---|---:|---:|']
    for row in acquired:
        if row.get('selectedVolumeUrl') or len(row.get('offeredEpubs',[]))<2 or row['title'] in ["Calvin's Commentaries",'Sermons on Ephesians']:continue
        count=sum(r['sourcePage']==row['sourcePage'] for r in acquired)
        lines.append(f"| [{row['title']}]({row['sourcePage']}) | {len(row['offeredEpubs'])} | {count} |")
    lines+=['','## Exceptions and remaining discovery','', '| Author | Collection | Result |','|---|---|---|']
    for row in results.values():
        if row['status']=='acquired-ready-text':continue
        lines.append(f"| {row['author']} | [{row['title'].replace('|','/')}]({row['sourcePage']}) | {row['status']}: {row.get('error',row.get('note','existing source file reused'))} |")
    lines+=['','Individual works remain in the source inventory but were not this collection-first acquisition pass. The old advertised bulk ZIP was not used because prior verified research found no active ZIP links. Direct source-offered EPUBs provide a reproducible batch route.','', '## Storage and quality','', 'Original files: `BibleProject/sources/library/source-monergism/asset-historical-ready-*/original.epub`. Reading text: `Website/.local/library/historical-text-corpora/text/`. Each record preserves hashes, source links, EPUB title/creator/language/rights metadata and per-spine text counts. The EPUB reading order, rather than ZIP filename order, governs extraction.','', 'Files are private reading copies under source permissions; they are not deposited in git or published in the app. The manifest is a staging acquisition ledger. Complete-work identity, duplicate sections and author-versus-editor attribution require subsequent catalog reconciliation.','', 'Reproduce: `python -X utf8 scripts/collect-historical-text-corpora.py --report`. Explicit network acquisition uses `--discover --acquire`; completed and failed items are not re-requested automatically.']
    (OUT/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8',newline='\n')
    files=['# Acquired EPUBs and extracted reading text','', 'Local files from this batch. Readiness means substantial existing text, not full proofreading or permission to republish. Publisher AI editions remain flagged. Source pages and hashes are in [the ledger](acquisition-results.json).','', '| Author | Edition / source | Original EPUB | Reading TXT | Review |','|---|---|---|---|---|']
    for r in sorted(acquired,key=lambda r:(r['author'],r['editionTitle'],r['selectedUrl'])):
        a=r['asset']; ep=quote(Path(os.path.relpath(SOURCES/a['relativePath'],OUT)).as_posix(),safe='/'); tx=quote(Path(os.path.relpath(SITE/a['derivedText']['path'],OUT)).as_posix(),safe='/')
        title=edition_label(r)
        files.append(f"| {r['author']} | [{title.replace('|','/')}]({r['selectedUrl'].replace(' ','%20')}) | [EPUB]({ep}) | [TXT]({tx}) | {'Publisher AI: review required' if r in flagged else 'Ready text; not fully proofread'} |")
    (OUT/'FILES.md').write_text('\n'.join(files)+'\n',encoding='utf-8',newline='\n')
    links=re.findall(r'\]\((\.\.[^)]+)\)', '\n'.join(files))
    assert len(links)==2*len(acquired)
    assert all((OUT/unquote(link)).is_file() for link in links)
    assert len({r['asset']['sha256'] for r in acquired})==len(acquired)
    write(OUT/'validation.json',dict(date='2026-10-05',originalEpubHashesVerified=len(acquired),derivedTextHashesVerified=len(acquired),distinctOriginalHashes=len(acquired),localFileLinksVerified=len(links),packageSpineParsed=len(acquired),bodySpotCheckedEditions=sum('bodySpotCheck' in r['quality'] for r in acquired),noFullProofreading=True,publicPublicationChanged=False))
    print(json.dumps(summary),flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--discover',action='store_true');p.add_argument('--acquire',action='store_true');p.add_argument('--complete-volumes',action='store_true');p.add_argument('--report',action='store_true');args=p.parse_args()
    c=Client()
    entries=discover(c) if args.discover else read(OUT/'author-collection-inventory.json')['entries']
    if args.acquire:acquire(c,entries)
    if args.complete_volumes:complete_volumes(c)
    if args.report:report()
