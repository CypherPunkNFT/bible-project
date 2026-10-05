"""Reconcile L01 metadata against immutable PDFs; never generate or rewrite sermon text.

Requirements: PyMuPDF. Run after collect-spurgeon.py discover/fetch/support.
Header/index facts are catalog metadata, not a derivative full-text edition.
"""
import argparse
from collections import Counter, defaultdict
from datetime import datetime
import hashlib
import importlib.util
import json
import re
from pathlib import Path
import pymupdf
from bible.paths import SOURCES

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE / 'content/library'
REPORT = ROOT / 'reports/spurgeon'
RAW = SOURCES / 'library/source-spurgeon-gems'
DAY = '2026-10-05'
BASE = 'https://www.spurgeongems.org/'
POLICY = BASE + 'about-us/'
CATALOG = ROOT / 'catalog'
LOCAL = SITE / '.local/library/run-l01-spurgeon-2026-10-05'

def read(p): return json.loads(p.read_text(encoding='utf8'))
def write(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf8', newline='\n')
def evidence(url, locator, note): return dict(url=url, locator=locator, note=note, checkedOn=DAY)
def normalize(s): return re.sub(r'[^a-z0-9]', '', s.lower())
def label_key(s):
    s = re.sub(r'\s+', '', s).upper().replace('–','-').replace('—','-').replace(',','-')
    m = re.fullmatch(r'(\d+)-?(\d+|[A-Z])?', s)
    if not m: return None
    a, b = m.groups(); first = str(int(a))
    if not b: return first
    if b.isalpha(): return first+b
    last = int(a[:-len(b)]+b) if len(b)<len(a) else int(b)
    return first+'-'+str(last)
def work_id(label): return 'work-spurgeon-sermon-'+label_key(label).lower().zfill(4)
def sermon_key(row):
    # Verified against actual numbered PDF headings, whole-volume bookmarks and Scripture indexes.
    return {'asset-spurgeon-gems-chs1946':'1946','asset-spurgeon-gems-chs2843':'2843'}.get(row['assetId'],label_key(row['numberLabel']))
def volume_id(n): return f'work-spurgeon-volume-{n:02}'
def event(kind, value, label=None, ev=None):
    return dict(event=kind, value=value, precision='unknown' if value is None else {4:'year',7:'month',10:'day'}[len(value)],label=label,evidence=ev or [])

BOOKS = read(SITE/'content/apologetics/scripture-index.json')['books']
BOOKMAP = {b['name'].lower(): b for b in BOOKS}
BOOKMAP.update({'psalm':BOOKMAP['psalms'], 'canticles':BOOKMAP['song of songs'], 'song of solomon':BOOKMAP['song of songs'], 'solomon’s song':BOOKMAP['song of songs'], "solomon's song":BOOKMAP['song of songs'], 'revelations':BOOKMAP['revelation']})
BOOKPAT = '(?:'+ '|'.join(re.escape(k) for k in sorted(BOOKMAP,key=len,reverse=True))+')'
REF = re.compile(r'^('+BOOKPAT+r')[.,]?\s*(\d+[\d\s,;:\-–—.and]*?)[.\s]*$', re.I)
REF_END = re.compile(r'('+BOOKPAT+r')[.,]?\s*(\d+[\d\s,;:\-–—.and]*?)[.\s]*$', re.I)
MONTHS = '|'.join(datetime(2000,m,1).strftime('%B') for m in range(1,13))
DATE = re.compile(r'\b('+MONTHS+r'),?\s+(\d{1,2})(?:ST|ND|RD|TH)?\s*,?\s*(18\d{2}|19\d{2})\b',re.I)

def passage(ref, locator):
    result=dict(reference=ref,numberingSystem='english',role='main-text',start=None,end=None,verification='unmapped',locator=locator)
    m=REF.fullmatch(ref.strip())
    if not m:return result
    book, span=m.groups(); b=BOOKMAP[book.lower()]
    if len(b['chapters'])==1 and ':' not in span: span='1:'+span
    simple=re.fullmatch(r'(\d+):(\d+)(?:\s*[-–—]\s*(\d+))?',span.strip())
    if simple:
        ch, a, z=simple.groups(); ch,a,z=int(ch),int(a),int(z or a)
        if 0<ch<=len(b['chapters']) and 0<a<=z<=b['chapters'][ch-1]:
            result.update(start=b['num']*1000000+ch*1000+a,end=b['num']*1000000+ch*1000+z,verification='verified')
    return result

def parse_header(text):
    lines=[s.strip() for s in text.splitlines() if s.strip()]
    number_line=re.compile(r'^NOS?\.?\s+(\d+(?:\s*[-—–,]\s*\d+|[- ]?[AB])?)\.?$',re.I)
    numbered=next((i for i,s in enumerate(lines[:30]) if number_line.fullmatch(s)),None)
    title=None
    if numbered is not None:
        start=0
        for i in range(numbered):
            if re.match(r'^(?:\d+$|Volume\b|www\.|Sermons?\s+#|.*Pulpit$)',lines[i],re.I): start=i+1
        title=' '.join(lines[start:numbered]) or None
    refs=[]; first_ref=None
    for i,line in enumerate(lines[:60]):
        if first_ref is not None and i>first_ref and re.match(r'^(?:[A-Z]{2,}\b|I\s)',line) and not REF_END.search(line):
            break
        cleaned=re.sub(r'\s*\([^)]*\)$','',line).rstrip('*')
        for part in re.split(r',\s*&\s*|\s+and\s+(?=[A-Za-z])',cleaned):
            match=REF_END.search(part)
            if match and (match.start()==0 or part[match.start()-1] in '—–"” .') and (first_ref is None or i-first_ref<12):
                refs.append(match.group(0).rstrip('.')); first_ref=first_ref if first_ref is not None else i
    # A main text heading is normally within the opening matter. Do not harvest body citations.
    if first_ref is not None:
        header='\n'.join(lines[:first_ref+1])
    else:
        # Stop at the first prose paragraph, retaining all heading date/byline lines.
        stop=next((i for i,s in enumerate(lines) if i>5 and len(s)>85 and sum(c.islower() for c in s)>20), min(25,len(lines)))
        header='\n'.join(lines[:stop]); refs=[]
    dates=[]; readings=[]
    flat=' '.join(header.split())
    for m in DATE.finditer(flat):
        val=datetime.strptime(' '.join(m.groups()),'%B %d %Y').date().isoformat()
        preceding=flat[:m.start()]
        delivery=max(preceding.upper().rfind('DELIVER'),preceding.upper().rfind('PREACH'),preceding.upper().rfind('HELD AT'),preceding.upper().rfind('TOOK PLACE'))
        publication=preceding.upper().rfind('PUBLISH')
        reading=max(preceding.upper().rfind('READING'),preceding.upper().rfind('READ ON'))
        kind='original-publication' if publication>max(delivery,reading) else 'scheduled-reading' if reading>max(delivery,publication) else 'delivery' if delivery>=0 else None
        # Explicit dated guest address headings, without the word "delivered".
        if kind is None and re.search(r'BY THE REV\.',flat[m.end():],re.I): kind='delivery'
        label=flat[max(0,m.start()-65):m.end()]
        if kind: dates.append((kind,val,label))
    if not any(d[0]=='delivery' for d in dates):
        partial=re.search(r'(?:DELIVERED|PREACHED)[^.]*?\b(18\d{2})\b',flat,re.I)
        if partial and not DATE.search(partial.group(0)):
            dates.append(('delivery',partial.group(1),partial.group(0)))
    bylines=[s for s in lines[:35] if re.match(r'^(?:DELIVERED )?BY\s',s,re.I)]
    no=number_line.fullmatch(lines[numbered]) if numbered is not None else None
    return dict(pdfTitle=title,headerNumber=no.group(1) if no else None,mainTexts=refs,dates=dates,bylines=bylines,header=header)

def indexes():
    result={}
    for stem in ['chstix','sindex_ot','sindex_nt']:
        rows=[]
        with pymupdf.open(RAW/('asset-spurgeon-gems-'+stem.replace('_','-'))/(stem+'.pdf')) as doc:
            for page in doc:
                words=page.get_text('words')
                # The rightmost number column anchors rows; retain wrapped left cells.
                title=stem=='chstix'; xvol=420 if title else 172 if stem.endswith('ot') else 198
                xlink=None if title else 224 if stem.endswith('ot') else 250
                anchors=[w for w in words if 450<w[0]<530 and 50<w[1]<725 and label_key(w[4])]
                for j,w in enumerate(anchors):
                    end=anchors[j+1][1]-.8 if j+1<len(anchors) else 725
                    same=[t for t in words if abs(t[1]-w[1])<1 and xvol-1<=t[0]<xvol+30 and t[4].isdigit()]
                    if len(same)!=1:continue
                    left=[t[4] for t in words if 50<=t[0]<xvol-5 and w[1]-.8<=t[1]<end]
                    links=[t[4] for t in words if xlink and xlink-1<=t[0]<435 and w[1]-.8<=t[1]<end]
                    rows.append(dict(numberLabel=w[4],key=label_key(w[4]),volume=int(same[0][4]),value=' '.join(left),linkLabel=' '.join(links),page=page.number+1))
        result[stem]=rows
    write(REPORT/'reference-indexes.json',result)
    print(json.dumps({k:len(v) for k,v in result.items()}))

def extract():
    inv=read(REPORT/'inventory.json'); rows=[]; volumes=[]
    for v in inv['volumes']:
        n=v['volume']; asset=f'asset-spurgeon-gems-chsbm{n}'; p=RAW/asset/f'chsbm{n}.pdf'
        if not p.exists(): continue
        with pymupdf.open(p) as doc:
            first=doc[0].get_text(); toc=doc.get_toc(); entries=[]
            for level,title,page in toc:
                m=re.match(r'^(\d+(?:\s*[-–]\s*\d+|[- ]?[ABab])?)[\s\-–:]+(.+)',title.replace('\r',' '))
                if m and page>0:
                    item=parse_header(doc[page-1].get_text())
                    entries.append(dict(numberLabel=m.group(1),key=label_key(m.group(1)),bookmarkTitle=m.group(2).strip(),page=page,**item))
            volumes.append(dict(**v,assetId=asset,pages=len(doc),titlePage=first[:700],bookmarks=entries))
    for s in inv['sermons']:
        p=RAW/s['assetId']/Path(s['url']).name
        if not p.exists(): continue
        with pymupdf.open(p) as doc:
            item=parse_header(doc[0].get_text())
            notice=doc[-1].get_text()[-1600:]
            rows.append(dict(**s,**item,pages=len(doc),modernization='modernized' if re.search(r'minimal updating|modern English|today.s language',notice,re.I) else 'unknown',unabridgedNotice=bool(re.search(r'content is unabridged',notice,re.I))))
    write(LOCAL/'headers.json',rows); write(LOCAL/'volume-headers.json',volumes)
    print(json.dumps(dict(individualPdfs=len(rows),volumes=len(volumes),withMainTexts=sum(bool(r['mainTexts']) for r in rows),withDates=sum(bool(r['dates']) for r in rows))))

GUESTS = {
    '370':('w-brock','W. Brock'), '378':('octavius-winslow','Octavius Winslow'),
    '381':('hugh-stowell-brown','Hugh Stowell Brown'), '386':('john-bloomfield','John Bloomfield'),
    '387':('evan-probert','Evan Probert'), '388':('james-archer-spurgeon','J. A. Spurgeon'),
    '388A':('james-smith-cheltenham','James Smith of Cheltenham'),
    '388B':('william-oneill','William O’Neill'), '389-390':('henry-vincent','Henry Vincent'),
    '364A':('tabernacle-opening-committee','Metropolitan Tabernacle opening committee'),
    '1A':('unidentified-tabernacle-burning-author','Unidentified author: The Burning of the Metropolitan Tabernacle'),
    '1B':('unidentified-tabernacle-rebuilding-author','Unidentified author: Rebuilding the Metropolitan Tabernacle'),
}
MEETINGS={'268-270','331-332','369','371','372','376','377','380','385'}

def common(kind, ident):
    return {'$schema':'../../schema.json','schemaVersion':1,'kind':kind,'id':ident,'editorialState':'catalogued','notes':[],'reviews':[]}
def save(doc):
    folder='series' if doc['kind']=='series' else doc['kind']+'s'
    write(CATALOG/folder/(doc['id']+'.json'),doc)
def work(ident,title,genre,ev,creator='author-charles-spurgeon',role='core-teaching'):
    return dict(**common('work',ident),title=title,alternateTitles=[],creators=[dict(authorId=creator,role='speaker' if genre=='history' else 'author' if genre in ['article','letter','collected-works'] else 'preacher')],genre=genre,role=role,collections=['sermons'],subjects=[],occasions=[],audiences=['general'],depth='unknown',era='nineteenth-century',dates=[],passages=[],related=[],externalIds={},evidence=ev)
def rights():
    return dict(category='restricted-license',jurisdiction=None,licenseId='Spurgeon-Gems-free-unaltered',licenseUrl=POLICY,attribution='Charles H. Spurgeon and individually identified contributors; digital edition supplied by Spurgeon Gems (www.spurgeongems.org).',conditions=['Do not charge for the material.','Do not change the content.','Credit the author and Spurgeon Gems as source.'],conditionsMet=True,actions=dict(download='conditional',host='conditional',redistribute='conditional',adapt='denied',transcribe='unknown',embed='unknown',indexMetadata='allowed',indexFullText='unknown'),evidence=[evidence(POLICY,'Use of material permission','Published grant permits free, unchanged use with author and source credit; no unrestricted open license is claimed.')],unresolved=['Full-text indexing, modified editions, and commercial uses require a separate rights decision.'],review=dict(date=DAY,reviewer='Codex',kind='ai-assisted',scope='Verified website permission and retained raw PDFs with attribution; no public hosting or full-text indexing performed.'))
def make_asset(asset_id,edition_id,url):
    meta=RAW/asset_id/'provenance.json'; rec=read(meta) if meta.exists() else None
    obj=dict(**common('asset',asset_id),editionId=edition_id,sourceId='source-spurgeon-gems',canonicalUrl=url,finalUrl=rec['finalUrl'] if rec else None,format='pdf',mediaKind='text',acquisitionStatus='downloaded' if rec else 'not-acquired',storage='raw' if rec else 'none',relativePath=rec['relativePath'] if rec else None,sha256=rec['sha256'] if rec else None,byteCount=rec['byteCount'] if rec else None,mimeType=rec['mimeType'] if rec else None,retrievedAt=rec['retrievedAt'] if rec else None,rights=rights(),fullTextIndexed=False,processing=dict(parentAssetId=None,method='none',tool=None,toolVersion=None,parameters=None,date=None,note='Original downloaded bytes retained without content alteration; catalog metadata extraction is separate.'),quality=dict(state='unreviewed',reviewedBy=None,reviewedOn=None,note='PDF opened and headings machine-parsed; this does not certify the complete transcription.'))
    if asset_id in ['asset-spurgeon-gems-chs1','asset-spurgeon-gems-chsbm63']:
        obj['quality']=dict(state='sampled',reviewedBy='Codex',reviewedOn=DAY,note='First page rendered and inspected against extracted title, dates, and main text; remainder not visually verified.')
    if asset_id in ['asset-spurgeon-gems-chsbm43','asset-spurgeon-gems-chsbm45']:
        obj['quality']=dict(state='issues',reviewedBy='Codex',reviewedOn=DAY,note='The source PDF begins with an unrelated page from another volume; proper volume contents start on PDF page 2. Original bytes preserved. Use individual sermon PDFs where available.')
    save(obj);return obj
def edition(work_id,label,ev,modernization='unknown',complete=False):
    ident=work_id.replace('work-','edition-',1)+'-spurgeon-gems-2026'
    obj=dict(**common('edition',ident),workId=work_id,label=label,languages=['en'],contributors=[],publisher='Spurgeon Gems',dates=[event('edition-publication',None,'Digital edition publication date not established; retrieval date belongs to the asset.')],abridgment='complete' if complete else 'unknown',modernization=modernization,evidence=ev)
    obj['notes']=['Digital snapshot acquired 2026-10-05. The source reports an ongoing return to original wording; no blanket claim of original typography or wording is made.']
    save(obj);return obj

def build():
    inv=read(REPORT/'inventory.json'); headers={sermon_key(r):r for r in read(LOCAL/'headers.json')}
    overrides=read(REPORT/'verified-overrides.json')
    vols={v['volume']:v for v in read(LOCAL/'volume-headers.json')}; indices=read(REPORT/'reference-indexes.json')
    rows=inv['sermons']; inventory_ev=evidence(inv['source'],'63-volume numbered index','Snapshot retained with checksum; entry count includes guest addresses, historical documents, combined numbers, and suffixes.')
    index_map=defaultdict(list); scripture_map=defaultdict(list)
    # Published indexes and older volume bookmarks reverse 369/369A relative to today's download index.
    # The title and actual PDF opening matter establish the crosswalk, not number alone.
    crosswalk={'221':'221A','369':'369A','369A':'369'}
    for r in indices['chstix']:
        k=crosswalk.get(r['key'],r['key'])
        if normalize(r['value'])=='eternallifewithinpresentgrasp':k='1946'
        if normalize(r['value']) in ['seedbythewaysidethe','theseedbythewayside']:k='2843'
        index_map[k].append(r)
    for stem in ['sindex_ot','sindex_nt']:
        for r in indices[stem]:
            if not r['linkLabel'].lower().startswith('exposition'):
                scripture_map[crosswalk.get(r['key'],r['key'])].append(dict(**r,index=stem))
    authors=[]
    for key,(slug,name) in GUESTS.items():
        s=next(r for r in rows if label_key(r['numberLabel'])==key)
        authors.append(dict(id='author-'+slug,entityType='institution' if key=='364A' else 'person',name=name,aliases=[],cohort='spurgeon-volume-context',traditions=[],eligibility='context-only',rationale='Included only to identify a contributor or unresolved attribution in the acquired Spurgeon volumes; not admitted to the core teaching roster.',receptionBasis='Documentary inclusion in this identified volume, not an independent theological or reception assessment.',evidence=[evidence(s['url'],'Opening matter','Named contributor in the PDF, or explicitly unidentified author of this document; anonymous entries are separate placeholders, not a shared identity.')],distinctives=[],unresolved=['Independent biographical identity, theological eligibility and reception review are outside this Spurgeon inventory mission.'],review=dict(date=DAY,reviewer='Codex',kind='ai-assisted',scope='Contextual attribution only.')))
    write(ROOT/'registry-extensions/spurgeon-context-authors.json',{'$schema':'../schema.json','schemaVersion':1,'kind':'author-registry','updated':DAY,'authors':authors})
    records=[]; assets=[]; conflicts=[]; missing=[]; volume_summary=[]
    for s in rows:
        key=sermon_key(s); wid=work_id(key); h=headers.get(key); v=next(v for v in inv['volumes'] if v['volume']==s['volume'])
        if key=='221A':
            h=next(r for r in vols[4]['bookmarks'] if r['key']=='221')
            h={**h,'modernization':'modernized','unabridgedNotice':False}
        ev=[inventory_ev]; genre='history' if key in MEETINGS or key=='364A' else 'letter' if key=='221' else 'article' if key in ['1A','1B','2001A'] else 'sermon'
        creator='author-'+GUESTS[key][0] if key in GUESTS else 'author-charles-spurgeon'
        w=work(wid,s['title'],genre,ev,creator,'historical-context' if key in GUESTS or key in MEETINGS else 'core-teaching')
        if key=='364A':w['creators'][0]['role']='institution'
        w['externalIds']={'spurgeon-gems-index-number':[s['numberLabel']],'reconciled-sermon-number':[key],'published-volume':[str(s['volume'])]}
        w['related']=[dict(relation='is-part-of',targetId=volume_id(s['volume']),locator='Index entry '+s['numberLabel'])]
        w['dates']=[event('original-publication',str(v['publicationYear']),f"Volume {s['volume']} publication year; exact issue date not inferred.",[inventory_ev])]
        w['notes']=['Number is an edition/index identifier, not a count of distinct preached occasions.']
        if key!=label_key(s['numberLabel']):w['notes'].append(f"Index typo: displayed {s['numberLabel']}, but the linked document and published-volume heading identify {key}. Original index label retained.")
        if key in MEETINGS:w['notes'].append('Proceedings include Spurgeon and other speakers; creator here records his contribution, not sole authorship of the entire meeting report.')
        if key in GUESTS:w['notes'].append('Contextual volume contribution; not counted as a sermon preached by Charles H. Spurgeon.')
        variants=[]
        if h:
            pev=evidence(BASE+'chsbm4.pdf' if key=='221A' else s['url'],'PDF page 673' if key=='221A' else 'PDF opening matter','Title, main texts, and dates transcribed as catalog facts; source distinctions preserved.')
            ev.append(pev)
            variants.append(h['pdfTitle'])
            w['passages']=[passage(r,'Volume 4 PDF, page 673' if key=='221A' else 'Individual PDF, opening Scripture heading') for r in h['mainTexts']]
            for kind,value,label in h['dates']:
                if kind=='scheduled-reading': w['notes'].append(f'Scheduled reading: {value}. Source heading: {label}. This is not asserted as publication or delivery.')
                else:w['dates'].append(event(kind,value,label,[pev]))
            if not any(x['event']=='delivery' for x in w['dates']):w['dates'].append(event('delivery',None,'No unambiguous delivery date established from the inspected heading.',[pev]))
        else:missing.append(dict(numberLabel=s['numberLabel'],url=s['url'],reason='Individual PDF not yet acquired or parsed.'))
        # Preserve index references as evidence-based fallback, without claiming verse verification.
        if not w['passages'] and key not in GUESTS and key not in MEETINGS and key!='221':
            for r in scripture_map[key]:
                p=passage(r['value'],f"{r['index']}.pdf, page {r['page']}; source index main-text row")
                if p not in w['passages']:w['passages'].append(p)
                ev.append(evidence(BASE+r['index']+'.pdf',f"Page {r['page']}",'Main-text index row; appended expositions are excluded.'))
        for r in index_map[key]:
            variants.append(r['value']);ev.append(evidence(BASE+'chstix.pdf',f"Page {r['page']}; original number {r['numberLabel']}",'Alphabetical title variant; reconciled by title and numbering context.'))
        if key in overrides:
            fix=overrides[key]
            if 'title' in fix:
                variants.append(w['title']);w['title']=fix['title']
            w['passages']=[passage(r['reference'],f"Individual PDF, page {r['page']}; inspected passage introduction") for r in fix['mainTexts']]
            w['notes'].append(fix['note'])
            ev.append(evidence(s['url'],'Pages '+', '.join(str(r['page']) for r in fix['mainTexts']),fix['note']))
            if 'delivery' in fix:
                w['dates']=[d for d in w['dates'] if d['event']!='delivery']+[event('delivery',fix['delivery'],fix['dateLabel'],[evidence(s['url'],'Page 1','Delivery heading follows the editorial preface.')])]
        seen={normalize(w['title'])}
        for title in variants:
            if title and normalize(title) not in seen:
                # 221-A contains the pastoral letter first, followed by Comfort Proclaimed.
                if key=='221A' and normalize(title)=='apastoralletter':continue
                w['alternateTitles'].append(title);seen.add(normalize(title))
        if key=='221A':w['notes'].append('Incorrect individual index link: chs221-A.pdf contains A Pastoral Letter, not Comfort Proclaimed. Correct sermon acquired in chsbm4.pdf, pages 673–683, under historical number 221. Current index label 221-A is retained. The Scripture index row for 221 also disagrees (Jeremiah 5:22–23); the actual sermon heading reads Isaiah 40:1.')
        if key in ['369','369A']:w['notes'].append('Current individual index and older volume/title index reverse 369 and 369A. Identity follows document title/content; both original labels are retained in the reconciliation report.')
        bv=vols.get(s['volume'],{}); candidate=next((r for r in bv.get('bookmarks',[]) if r['key']==({'221':'221A','221A':'221','369':'369A','369A':'369'}.get(key,key))),None)
        working_refs=[p['reference'] for p in w['passages']]
        if candidate and h and working_refs and candidate['mainTexts'] and [normalize(x) for x in working_refs]!=[normalize(x) for x in candidate['mainTexts']]:
            conflicts.append(dict(numberLabel=s['numberLabel'],kind='heading-transcription-difference',individual=working_refs,volume=candidate['mainTexts'],volumePage=candidate['page'],volumeAssetId=bv['assetId'],note='Review candidate: may be an equivalent reference notation, extraction difference, or substantive source disagreement.'))
        save(w)
        e=edition(wid,'Spurgeon Gems volume 4 component, pages 673–683' if key=='221A' else 'Spurgeon Gems individual PDF; acquired 2026-10-05',ev,h['modernization'] if h else 'unknown',h['unabridgedNotice'] if h else False)
        if key=='221A':
            # This downloaded copy belongs to the pastoral letter, not the linked title.
            legacy=dict(e);legacy.update(id='edition-spurgeon-sermon-0221-spurgeon-gems-legacy',workId=work_id('221'),label='Spurgeon Gems older individual PDF of A Pastoral Letter, numbered 221-A')
            legacy['evidence']=[evidence(s['url'],'Both PDF pages','The linked document is a version of A Pastoral Letter; it contains no Comfort Proclaimed sermon.')];save(legacy)
            a=make_asset(s['assetId'],legacy['id'],s['url'])
        else:a=make_asset(s['assetId'],e['id'],s['url'])
        assets.append(a)
        records.append(dict(numberLabel=key,indexNumberLabel=s['numberLabel'],workId=wid,volume=s['volume'],title=w['title'],alternateTitles=w['alternateTitles'],genre=genre,creatorId=creator,mainTexts=w['passages'],dates=w['dates'],dateHeadings=[line for line in h['header'].splitlines() if re.search(MONTHS+r'|\b(?:18|19)\d{2}\b',line,re.I)] if h else [],scheduledReadingDates=[dict(value=d[1],label=d[2]) for d in h['dates'] if d[0]=='scheduled-reading'] if h else [],volumeLocator={'assetId':bv.get('assetId'),'page':candidate['page']} if candidate else None,assetId='asset-spurgeon-gems-chsbm4' if key=='221A' else a['id'],acquisitionStatus='contained-in-volume' if key=='221A' else a['acquisitionStatus']))
    assert len({r['workId'] for r in records})==len(records), 'Unresolved duplicate work identities'
    for v in inv['volumes']:
        n=v['volume']; wid=volume_id(n); name='The New Park Street Pulpit' if n<=6 else 'The Metropolitan Tabernacle Pulpit'
        w=work(wid,f'{name}, volume {n} ({v["publicationYear"]})','collected-works',[inventory_ev])
        w['dates']=[event('original-publication',str(v['publicationYear']),v['heading'],[inventory_ev])]
        members=[r for r in records if r['volume']==n]
        w['related']=[dict(relation='has-part',targetId=r['workId'],locator=r['numberLabel']) for r in members]
        w['externalIds']={'published-volume':[str(n)],'number-range':[str(v['start'])+'-'+str(v['end'])]};save(w)
        e=edition(wid,'Spurgeon Gems whole-volume booklet PDF; older digital edition; acquired 2026-10-05',[evidence(BASE+f'chsbm{n}.pdf','Title/opening pages and PDF bookmarks','Whole-volume digital edition kept separately from current individual PDFs.')],'modernized')
        a=make_asset(f'asset-spurgeon-gems-chsbm{n}',e['id'],BASE+f'chsbm{n}.pdf');assets.append(a)
        series=dict(**common('series',f'series-spurgeon-volume-{n:02}'),title=w['title'],authorIds=['author-charles-spurgeon'],members=[dict(workId=r['workId'],position=i+1,originalLabel=r['numberLabel']) for i,r in enumerate(members)],expectedCount=len(members),completeness='complete',inventoryEvidence=[inventory_ev],missing=[])
        series['notes']=['Complete metadata membership against the dated online volume index, not a claim of verified text or sole Spurgeon authorship. Prefaces and unnumbered supplementary matter are separately inventoried.'];save(series)
        volume_summary.append(dict(**v,indexedEntries=len(members),acquiredEntries=sum(r['acquisitionStatus'] in ['downloaded','contained-in-volume'] for r in members),wholeVolumeAcquired=a['acquisitionStatus']=='downloaded',pdfPages=vols.get(n,{}).get('pages')))
    save(dict(**common('series','series-spurgeon-published-pulpit-volumes'),title='Spurgeon published pulpit volumes, 1855–1917',authorIds=['author-charles-spurgeon'],members=[dict(workId=volume_id(v['volume']),position=v['volume'],originalLabel=v['heading']) for v in inv['volumes']],expectedCount=63,completeness='complete',inventoryEvidence=[inventory_ev],missing=[]))
    # Numeric positions differ from item counts: combined numbers occupy multiple slots,
    # while A/B publications may replace a base number.
    occupied=set(); replacements=[]; combined=[]
    for s in rows:
        k=sermon_key(s)
        if '-' in k:
            a,z=map(int,k.split('-'));occupied.update(range(a,z+1));combined.append(dict(label=s['numberLabel'],expanded=k))
        elif k[-1].isalpha():occupied.add(int(k[:-1]))
        else:occupied.add(int(k))
    numeric_gaps=sorted(set(range(1,3564))-occupied)
    plain={label_key(s['numberLabel']) for s in rows if s['numberLabel'].isdigit()}
    replacements=sorted({int(label_key(s['numberLabel'])[:-1]) for s in rows if label_key(s['numberLabel'])[-1].isalpha() and label_key(s['numberLabel'])[:-1] not in plain})
    all_raw=[]
    for p in sorted(RAW.glob('*/provenance.json')):
        m=read(p);all_raw.append(m)
    hashes=defaultdict(list)
    for m in all_raw:hashes[m['sha256']].append(m['assetId'])
    duplicates=[dict(sha256=k,assets=v) for k,v in hashes.items() if len(v)>1]
    write(REPORT/'sermons.json',records);write(REPORT/'volumes.json',volume_summary)
    write(REPORT/'acquisition-manifest.json',all_raw)
    write(REPORT/'reconciliation.json',dict(combinedNumbers=combined,suffixReplacements=replacements,numericGaps=numeric_gaps,missingIndividualPdfs=missing,incorrectIndividualLinks=[dict(indexNumber='221-A',expected='Comfort Proclaimed',received='A Pastoral Letter',recoveredFrom='chsbm4.pdf, pages 673–683')],exactDuplicateFiles=duplicates,editionScriptureDifferences=conflicts,indexNumberCrosswalk=[dict(indexNumber=k,currentIndividualNumber=v) for k,v in crosswalk.items()],indexTypos=[dict(assetId='asset-spurgeon-gems-chs1946',displayed='1956',corrected='1946'),dict(assetId='asset-spurgeon-gems-chs2843',displayed='1843',corrected='2843')]))
    counts=dict(works=len(rows)+63,editions=len(rows)+64,assets=len(assets),series=64,reviewedWorks=0,publishedWorks=0)
    summary=dict(**counts,indexedEntries=len(rows),downloadedIndividualPdfs=sum(r['acquisitionStatus']=='downloaded' for r in records),wholeVolumePdfs=sum(v['wholeVolumeAcquired'] for v in volume_summary),mainTextEntries=sum(bool(r['mainTexts']) for r in records),verifiedMainTextEntries=sum(any(p['verification']=='verified' for p in r['mainTexts']) for r in records),datedDeliveries=sum(any(d['event']=='delivery' and d['value'] for d in r['dates']) for r in records),exactPublicationDates=sum(any(d['event']=='original-publication' and d['precision']=='day' for d in r['dates']) for r in records),scheduledReadings=sum(bool(r['scheduledReadingDates']) for r in records),rawFiles=len(all_raw),rawBytes=sum(r['byteCount'] for r in all_raw),numericGaps=numeric_gaps,missingPdfs=len(missing),contextContributors=len(GUESTS),editionDifferences=len(conflicts))
    write(REPORT/'summary.json',summary)
    write(CATALOG/'runs/run-l01-spurgeon-2026-10-05.json',dict(**{'$schema':'../../schema.json','schemaVersion':1,'kind':'run','id':'run-l01-spurgeon-2026-10-05'},missionId='L01',status='complete' if not missing else 'in-progress',startedOn=DAY,completedOn=DAY if not missing else None,boundary='The 63 published pulpit volumes, 1855–1917, as inventoried by Spurgeon Gems on 2026-10-05; includes explicitly identified contextual contributions and documentary extras.',sourceIds=['source-spurgeon-gems'],inventory='content/library/reports/spurgeon/inventory.json',checkpoint='content/library/reports/spurgeon/acquisition-manifest.json',counts=counts,gaps=['Dates not documented in inspected sources remain unknown.','Whole-volume and individual editions differ; reconciliation report preserves conflicts.','Not an inventory of every Spurgeon anthology, translation, or previously unpublished sermon.'],reportPath='content/library/reports/spurgeon/REPORT.md'))
    print(json.dumps(summary))

def audit():
    rows=read(REPORT/'sermons.json'); raw=read(REPORT/'acquisition-manifest.json'); inv=read(REPORT/'inventory.json')
    headers=read(LOCAL/'headers.json'); issues=[]
    assert len(rows)==3568 and len({r['workId'] for r in rows})==3568
    assert len(read(REPORT/'volumes.json'))==63
    assert not read(REPORT/'reconciliation.json')['numericGaps']
    for m in raw:
        p=SOURCES/m['relativePath']; data=p.read_bytes()
        assert len(data)==m['byteCount'] and hashlib.sha256(data).hexdigest()==m['sha256'],str(p)
    volume_anomalies=[]
    for v in read(LOCAL/'volume-headers.json'):
        n=v['volume']; pattern=r'\bVOLUME\s+'+str(n)+r'\b'
        with pymupdf.open(RAW/v['assetId']/f'chsbm{n}.pdf') as doc:
            pages=[p.get_text() for p in list(doc.pages(0,min(3,len(doc))))]
        matched=next((i+1 for i,t in enumerate(pages) if re.search(pattern,t,re.I)),None)
        assert matched is not None,f'Expected volume {n} not established from opening pages'
        if matched!=1:volume_anomalies.append(dict(volume=n,assetId=v['assetId'],properContentsBeginAtPdfPage=matched,issue='Unrelated opening page from another volume; original source bytes retained.'))
    for h in headers:
        actual=label_key(h['headerNumber']) if h['headerNumber'] else None
        if actual and actual!=sermon_key(h):
            issues.append(dict(numberLabel=sermon_key(h),kind='header-number-difference',headerNumber=h['headerNumber'],url=h['url']))
    weekdays={'MONDAY':0,'TUESDAY':1,'WEDNESDAY':2,'THURSDAY':3,'FRIDAY':4,'SATURDAY':5,'SUNDAY':6,'SABBATH':6}
    for r in rows:
        for d in r['dates']+r['scheduledReadingDates']:
            if not d['value'] or len(d['value'])!=10:continue
            label=(d.get('label') or '').upper();matches=list(re.finditer(r'\b('+'|'.join(weekdays)+r')\b|LORD[’\']?S[- ]DAY',label))
            if matches:
                name=matches[-1].group(0);expected=weekdays.get(name,6)
                day=datetime.fromisoformat(d['value']).weekday()
                if day!=expected:issues.append(dict(numberLabel=r['numberLabel'],kind='source-weekday-date-disagreement',value=d['value'],label=d['label'],calendarWeekday=datetime.fromisoformat(d['value']).strftime('%A')))
            if d.get('event')=='delivery' and d['value']>'1892-01-31' and r['creatorId']=='author-charles-spurgeon':
                issues.append(dict(numberLabel=r['numberLabel'],kind='delivery-after-spurgeon-lifetime',value=d['value'],label=d['label']))
    no_main=[dict(numberLabel=r['numberLabel'],title=r['title'],genre=r['genre']) for r in rows if not r['mainTexts']]
    no_date=[r['numberLabel'] for r in rows if not any(d['event']=='delivery' and d['value'] for d in r['dates'])]
    unresolved=[dict(numberLabel=r['numberLabel'],references=[p['reference'] for p in r['mainTexts'] if p['verification']!='verified']) for r in rows if any(p['verification']!='verified' for p in r['mainTexts'])]
    write(REPORT/'metadata-review.json',dict(sourceIssues=issues,volumeOpeningPageAnomalies=volume_anomalies,noMainTextEstablished=no_main,noDeliveryDateEstablished=no_date,unmappedReferences=unresolved,note='Documented dates are preserved as printed. Weekday conflicts are review flags, not silently corrected dates. Unmapped references remain available as literal text.'))
    write(REPORT/'verification.json',dict(checkedOn=DAY,rawFilesVerified=len(raw),sha256Failures=0,indexedEntries=len(rows),uniqueWorkIds=len({r['workId'] for r in rows}),volumes=63,numericGaps=[],sourceIssues=len(issues),noMainTextEstablished=len(no_main),noDeliveryDateEstablished=len(no_date),unmappedReferenceEntries=len(unresolved),pdfTool='PyMuPDF '+pymupdf.VersionBind,visualSamples=['chs1.pdf page 1','chsbm63.pdf page 1','chstix.pdf page 1'],note='Structural/catalog and selected heading checks; not a full transcription or theological review.'))
    # Regression cases that would otherwise silently lose works or distort Scripture metadata.
    assert label_key('154-55')=='154-155' and label_key('1451A')=='1451A'
    lookup={r['numberLabel']:r for r in rows}
    assert lookup['1946']['title']=='Eternal Life Within Present Grasp'
    assert lookup['2843']['volume']==49
    assert lookup['221A']['assetId']=='asset-spurgeon-gems-chsbm4'
    assert lookup['221A']['mainTexts'][0]['reference']=='Isaiah 40:1'
    assert len(lookup['113']['mainTexts'])==7
    assert lookup['388']['creatorId']!='author-charles-spurgeon'
    print(json.dumps(dict(rawFilesVerified=len(raw),sourceIssues=len(issues),noMainTextEstablished=len(no_main),noDeliveryDateEstablished=len(no_date))))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('command',choices=['extract','indexes','build','audit']);args=parser.parse_args()
    {'extract':extract,'indexes':indexes,'build':build,'audit':audit}[args.command]()
