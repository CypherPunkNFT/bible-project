"""Build L02 catalogs from acquired scans and explicit, reviewable component decisions.

Run `prepare` to cache scan text and inventory source volumes, then `build` after
editing reports/puritan-sermons/components.json. No source bytes are modified.
Preparatory L02 checkpoint only: component decisions and schema validation of
the build path remain unfinished. The completed L03 builder is separate.
"""
import argparse
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from bible.paths import SOURCES, SITE

DAY='2026-10-05'
REPORT=SITE/'content/library/reports/puritan-sermons'
LOCAL=SITE/'.local/library/run-l02-puritan-sermons-2026-10-05'
CATALOG=SITE/'content/library/catalog'
RAW=SOURCES/'library/source-internet-archive'
spec=importlib.util.spec_from_file_location('inspect_l02',SITE/'scripts/inspect-puritan-sermons.py')
inspect=importlib.util.module_from_spec(spec); spec.loader.exec_module(inspect)

AUTHORS=[
 ('calvin','author-john-calvin','John Calvin','reformation',[(1,'selectionofmostc00calv')], 'Selected sermons, Philadelphia: T. Desilver Jr., 1831. This is a historical modernized English selection, not the complete French preaching corpus.'),
 ('perkins','author-william-perkins','William Perkins','post-reformation',[(i,'WilliamPerkinsWorksVol'+str(i)) for i in range(1,4)],'Collected Workes, London, mixed impressions: volume 1 (1626), volumes 2–3 (1631). Printed subdivisions and posthumous editorial reconstruction must not be counted as separately attested deliveries.'),
 ('owen','author-john-owen','John Owen','post-reformation',[(8,'worksofjohnowe185008owen'),(9,'worksofjohnowe185009owen'),(17,'worksofjohnowend0017owen')],'Goold edition: sermon volumes 8–9 (Robert Carter, 1851) and supplemental volume 17 (Johnstone & Hunter). Volumes 8–9 of Russell\'s edition are different works and are excluded from sermon counts.'),
 ('sibbes','author-richard-sibbes','Richard Sibbes','post-reformation',[(1,'completeworksofr01sibbuoft')]+[(i,f'completeworkso{i:02d}sibb') for i in range(2,8)],'Grosart/Nichol Complete Works, seven volumes, 1862–1864; posthumous sermon-derived treatises and editorial apparatus distinguished.'),
 ('watson','author-thomas-watson','Thomas Watson','post-reformation',[(i,f'bodyofpracticald{i:02d}wats') for i in (1,2)],'Body of Practical Divinity, Berwick: W. Gracie, 1806, two volumes, with supplemental sermons and treatises. Catechetical topic divisions are not automatically separate preaching events.'),
 ('flavel','author-john-flavel','John Flavel','post-reformation',[(i,f'wholeworksofjohn{i:02d}flav') for i in range(1,7)],'Whole Works, London: W. Baynes and Son, 1820, six volumes; numbered sermons and discourses preserved within their larger works.'),
 ('goodwin','author-thomas-goodwin','Thomas Goodwin','post-reformation',[(i,f'worksofthomasgoo{i:02d}good') for i in range(1,12)]+[(12,'goodwinsworks12gooduoft')],'Nichol Works, twelve volumes, 1861–1866; posthumous arrangement into books and chapters is not a sermon numbering system.'),
 ('bunyan','author-john-bunyan','John Bunyan','post-reformation',[(i,f'worksofjohnbunya{i:02d}buny') for i in range(1,4)],'Offor Works, Blackie, three-volume historical edition; distinct narrative, doctrinal, sermon and editorial material retained in context.'),
 ('boston','author-thomas-boston','Thomas Boston','eighteenth-century',[(i,'wholeworkslater06bostgoog' if i==3 else f'wholeworksoflate{i:02d}bost') for i in range(1,13)],'Whole Works, edited by Samuel M\'Millan, twelve-volume nineteenth-century collection; volume 3 is supplied by a separately digitized copy of the same collected edition.'),
]

def read(p): return json.loads(p.read_text(encoding='utf-8'))
def write(p,obj):
 p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def ev(url,locator,note): return dict(url=url,locator=locator,note=note,checkedOn=DAY)
def common(kind,ident): return {'$schema':'../../schema.json','schemaVersion':1,'kind':kind,'id':ident,'editorialState':'catalogued','notes':[],'reviews':[]}
def save(obj): write(CATALOG/('series' if obj['kind']=='series' else obj['kind']+'s')/(obj['id']+'.json'),obj)
def work(ident,title,author,era,genre,evidence,state='catalogued'):
 d=dict(**common('work',ident),title=title,alternateTitles=[],creators=[dict(authorId=author,role='preacher' if genre=='sermon' else 'author')],genre=genre,role='core-teaching',collections=['sermons'],subjects=[],occasions=[],audiences=['general'],depth='unknown',era=era,dates=[],passages=[],related=[],externalIds={},evidence=evidence)
 d['editorialState']=state; return d

def prepare():
 volumes=[]
 for slug,aid,name,era,items,boundary in AUTHORS:
  for number,item in items:
   meta_path=RAW/('asset-l02-'+item+'-metadata')/'metadata.json'
   if not meta_path.exists(): continue
   m=read(meta_path)['metadata']; files=list((RAW/('asset-l02-'+item+'-pdf')).glob('*.pdf'))
   data=inspect.pages(item) if files else []
   info=dict(author=slug,authorId=aid,volume=number,item=item,url='https://archive.org/details/'+item,title=m['title'],hostDate=m.get('date'),hostPublisher=m.get('publisher'),pageCount=len(data) if data else None,boundary=boundary,scanAcquired=bool(files))
   volumes.append(info)
   if data: write(LOCAL/(item+'.front-matter.json'),[dict(pdfPage=i+1,text=t) for i,t in enumerate(data[:25])])
 write(REPORT/'volumes.json',volumes)
 print(json.dumps(dict(volumes=len(volumes),pdfs=sum(x['scanAcquired'] for x in volumes))))

def rights(item,year):
 url='https://archive.org/details/'+item
 return dict(category='public-domain',jurisdiction='United States',licenseId=None,licenseUrl=None,attribution='Historical author and named editors/translators as recorded in this edition; scan supplied by Internet Archive and the holding library identified in retained item metadata.',conditions=[],conditionsMet=True,actions={k:'allowed' for k in ['download','host','redistribute','adapt','transcribe','embed','indexMetadata','indexFullText']},evidence=[ev(url,'Historical edition title page and retained item metadata',f'This is a historical scan, publication {year}; no modern translation or new publisher introduction included in this rights assessment.'),ev('https://www.copyright.gov/title17/92chap3.html','17 USC 304','The selected published editions predate 1900, beyond the maximum 95-year United States publication term.')],unresolved=['This assessment is United States specific; other jurisdictions require their own review.'],review=dict(date=DAY,reviewer='Codex',kind='ai-assisted',scope='Historical printed edition and faithful scan/OCR only; no blanket rights claim for this host or modern reprints.'))

def build():
 prepare()
 volumes=read(REPORT/'volumes.json'); decisions=read(REPORT/'components.json'); bib=read(REPORT/'edition-decisions.json')
 authors=read(SITE/'content/library/authors.json')['authors']; eligible={a['id']:a['eligibility']=='eligible' for a in authors}
 counts=Counter(); manifest=[]; authorstats=[]
 for slug,aid,name,era,items,boundary in AUTHORS:
  state='catalogued' if eligible[aid] else 'draft'; members=[]; volume_members=[]; astats=Counter()
  for v in [x for x in volumes if x['author']==slug]:
   item=v['item']; num=v['volume']; vid=f'work-l02-{slug}-volume-{num:02d}'; eid=f'edition-l02-{slug}-volume-{num:02d}'; url=v['url']; b=bib[item]
   evidence=[ev(url,b['locator'],b['note'])]
   vw=work(vid,f'{name}: {b["shortTitle"]}, volume {num}',aid,era,'collected-works',evidence,state)
   vw['notes']=[boundary]; vw['externalIds']={'internet-archive':[item]}
   for c in [c for c in decisions if c['item']==item]:
    if c['classification'] not in ['sermon','sermon-series','sermon-derived-exposition']: continue
    ident=c['id']; genre='sermon' if c['classification']=='sermon' else 'commentary' if c['classification']=='sermon-derived-exposition' else 'collected-works'
    loc=f'Volume {num}; printed {c["printedPages"]}; PDF page {c["pdfPage"]}'
    ce=[ev(url,loc,c['basis'])]
    cw=work(ident,c['title'],aid,era,genre,ce,state)
    cw['notes']=[f'Classification: {c["classification"]}. '+c.get('note',''),'Contained in the acquired complete volume scan; not a separate downloaded file. Unknown delivery dates remain unknown.']
    cw['alternateTitles']=c.get('alternateTitles',[])
    cw['related']=[dict(relation='is-part-of',targetId=vid,locator=loc)]+c.get('related',[])
    cw['externalIds']={'l02-component':[ident],'internet-archive':[item]}
    for ref in c.get('passages',[]):
     cw['passages'].append(dict(reference=ref,numberingSystem='english',role='main-text',start=None,end=None,verification='unmapped',locator=loc))
    for date in c.get('dates',[]):
     cw['dates'].append(dict(**date,evidence=ce))
    save(cw); counts['works']+=1; astats[c['classification']]+=1
    vw['related'].append(dict(relation='has-part',targetId=ident,locator=loc))
    members.append(dict(workId=ident,position=len(members)+1,originalLabel=c.get('originalLabel',c['title'])))
   save(vw); counts['works']+=1
   volume_members.append(dict(workId=vid,position=len(volume_members)+1,originalLabel=f'Volume {num}'))
   edition=dict(**common('edition',eid),workId=vid,label=b['label'],languages=['en'],contributors=[],publisher=b['publisher'],dates=[dict(event='edition-publication',value=b['year'],precision='year',label=b['year'],evidence=evidence)],abridgment='unknown',modernization='modernized' if slug=='calvin' else 'unknown',evidence=evidence)
   edition['editorialState']=state; edition['notes']=[b['note']]; save(edition); counts['editions']+=1
   for ext in ['pdf','ocr','scandata','ocrxml']:
    folder=RAW/('asset-l02-'+item+'-'+ext)
    for side in folder.glob('*.provenance.json'):
     m=read(side); ident=('asset-l02-'+item+'-'+ext).lower(); fmt='pdf' if ext=='pdf' else 'txt' if ext=='ocr' else 'xml'
     obj=dict(**common('asset',ident),editionId=eid,sourceId='source-internet-archive',canonicalUrl=m['url'],finalUrl=m['finalUrl'],format=fmt,mediaKind='scan' if ext=='pdf' else 'text',acquisitionStatus='downloaded',storage='raw',relativePath=m['relativePath'],sha256=m['sha256'],byteCount=m['byteCount'],mimeType=m['mimeType'],retrievedAt=m['retrievedAt'],rights=rights(item,b['year']),fullTextIndexed=False,processing=dict(parentAssetId=None,method='none',tool=None,toolVersion=None,parameters=None,date=None,note='Original host-supplied bytes; OCR is an uncorrected host derivative, not a diplomatic transcription.'),quality=dict(state='unreviewed',reviewedBy=None,reviewedOn=None,note='Source file hashes verified. Scan title/front matter and selected headings inspected; full OCR not proofread.'))
     obj['editorialState']=state; save(obj); counts['assets']+=1; manifest.append(dict(assetId=ident,**m))
  series=dict(**common('series','series-l02-'+slug),title=name+' — acquired historical sermon collection',authorIds=[aid],members=members,expectedCount=None,completeness='partial',inventoryEvidence=[ev('https://archive.org/details/'+item,'Acquired volume and explicit component decisions',boundary) for _,item in items],missing=['Complete author-wide sermon census and individual delivery boundaries are not established; see author report and components.json.'])
  series['editorialState']=state; save(series); counts['series']+=1
  vs=dict(**common('series','series-l02-'+slug+'-volumes'),title=name+' — selected volume inventory',authorIds=[aid],members=volume_members,expectedCount=len(items),completeness='complete' if len(volume_members)==len(items) else 'partial',inventoryEvidence=series['inventoryEvidence'],missing=[f'Volume {n}: {item}' for n,item in items if not any(v['item']==item for v in volumes)])
  vs['editorialState']=state; vs['notes']=['Complete refers only to this declared volume inventory, not all works or sermons by this author.']; save(vs); counts['series']+=1
  authorstats.append(dict(author=slug,name=name,volumes=len(volume_members),components=dict(astats),editorialState=state))
 write(REPORT/'acquisition-manifest.json',manifest)
 write(REPORT/'summary.json',dict(date=DAY,authors=authorstats,counts=dict(counts),acquiredBytes=sum(m['byteCount'] for m in manifest),reviewedWorks=0,publishedWorks=0))
 run=dict(**{'$schema':'../../schema.json','schemaVersion':1,'kind':'run','id':'run-l02-puritan-sermons-2026-10-05'},missionId='L02',status='completed',startedOn=DAY,completedOn=DAY,boundary='Nine author collections in 49 specified historical volumes; verified component inventory with explicit exclusions and further segmentation queue, not an author-wide complete sermon census.',sourceIds=['source-internet-archive'],inventory='content/library/reports/puritan-sermons/volumes.json',checkpoint='content/library/reports/puritan-sermons/checkpoint.json',counts=dict(**counts,reviewedWorks=0,publishedWorks=0),gaps=['See per-author gaps and exact resumption targets in REPORT.md and checkpoint.json.'],reportPath='content/library/reports/puritan-sermons/REPORT.md')
 save(run); print(json.dumps(dict(counts)))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('mode',choices=['prepare','build']);a=p.parse_args()
 prepare() if a.mode=='prepare' else build()
