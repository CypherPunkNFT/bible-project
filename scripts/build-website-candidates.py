"""Private editorial shortlist from retained evidence, never a publication exporter."""
from pathlib import Path
import hashlib,json,time

SITE=Path(__file__).resolve().parents[1]
PROJECT=SITE.parent
ROOT=PROJECT/'KnowledgeBase/library-knowledge'
SAVED=SITE/'.local/data-analysis'
OUT=SAVED/'website-candidates.json'
proofs={}
def read(p):
 p=Path(p);b=p.read_bytes();proofs[str(p.relative_to(PROJECT)).replace('\\','/')]=hashlib.sha256(b).hexdigest();return json.loads(b)
def safe(v):
 if isinstance(v,dict):return {k:safe(x) for k,x in v.items() if k not in ('private','path','paths','sourcePath','source_path','source_registry','extractedPath')}
 if isinstance(v,list):return [safe(x) for x in v]
 if isinstance(v,str) and ('FortressOfSolitude' in v or '\\Users\\' in v):return 'Private source file'
 return v
def digest(text):return hashlib.sha256(text.encode('utf-8')).hexdigest()
def excerpt(text):
 # A visibly clipped literal preview, never a synthetic quotation.
 text=text.strip();return text[:650]+('…' if len(text)>650 else '')
def source(p):
 assert p.get('text'),'Source text missing'
 if p.get('sha256'):assert digest(p['text'])==p['sha256'],'Saved witness text changed'
 return {**p,'excerpt':excerpt(p['text']),'excerptSha256':digest(excerpt(p['text']))}
def main():
 started=time.monotonic();spec=read(SITE/'analysis-desk/candidates.editorial.json')
 indexes={t:read(SAVED/t/'index.json') for t in ['kr110','kr120','kr140']}
 pins={'kr110':'kr110-54f0bfca9b30da6cc49b2347','kr120':'kr120-66a741ba22a7025744d3b98d','kr140':'kr140-3092a59f7c3f691bb7cdf4f9'}
 assert {t:i['run'] for t,i in indexes.items()}==pins,'Editorial selection requires explicit review for changed generations'
 proofs['Website/scripts/build-website-candidates.py']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
 details={}
 def detail(t,r):
  if (t,r) not in details:details[t,r]=read(SAVED/t/'details'/(r+'.json'))
  return details[t,r]
 positives=[{'track':t,**r} for t,i in indexes.items() for r in i['records'] if r['outcome'] in ('Useful','Improved')]
 assert len(positives)==43
 selected={};candidates=[]
 for raw in spec['candidates']:
  c=dict(raw);c['sources']=[];c['evidenceLinks']=[]
  if c.get('origin')=='lk202':
   root=ROOT/'ephesians-connections-20261012/release-final';manifest=read(root/'manifest.json');chapters=[];connections=[]
   for item in manifest['collections']:
    path=root/item['path'];assert hashlib.sha256(path.read_bytes()).hexdigest()==item['sha256'];d=read(path)
    chapters.append({'chapter':d['chapter'],'coverage':d['coverage']})
    evid={e['id']:e['citation'] for e in d['collection']['evidence']}
    for r in d['connections']:
     e=evid.get(r.get('evidenceId'));connections.append({'id':r['id'],'chapter':d['chapter'],'sourceRole':r['sourceRole'],'heading':r['heading'],'relationship':r['relationship'],'gapCount':r['gapCount'],'sample':r.get('sample'),'readerRoute':r.get('readerRoute'),'readerLocations':r.get('readerLocations',[]),'readerIssue':r.get('readerIssue'),'corpusLocator':r.get('corpusLocator'),'author':r.get('attribution',{}).get('author'),'translator':r.get('attribution',{}).get('translator'),'attribution':r.get('attribution'),'quote':e.get('quote') if e else None})
   c['chapterGuide']={'chapters':chapters,'connections':connections,'corpusBuild':manifest['corpusBuild'],'located':sum(r['relationship']=='located-exposition' for r in connections),'structural':sum(r['relationship']=='structural-candidate' for r in connections),'conflicts':sum(r['relationship']=='reference-conflict' for r in connections)}
   assert c['chapterGuide']['located']==180 and c['chapterGuide']['structural']==54
   for role in ['fergusson','calvin-commentary']:
    found=next((x for x in connections if role in x['sourceRole'] and x['chapter']==4 and x.get('quote')),None)
    if found:c['sources'].append({'id':found['id'],'title':found['heading'],'author':found['author'],'text':found['quote'],'excerpt':found['quote'],'excerptSha256':digest(found['quote']),'locator':found['corpusLocator'],'reader':found['readerRoute'],'credits':[x for x in [found['author'],found['translator']] if x],'cautions':['Location/reference review only; full argument and source-use review pending.'],'attribution':found['attribution'].get('scope'),'language':'en'})
   c['review']='Saved AI-assisted location/reference review; no theological or publication approval.'
   c['evidenceLinks']=[{'href':'/data_analysis/api/website-candidates.json','label':'Export the full shortlist and all six chapter connection lists'}]
  else:
   t=c['track'];records=c.get('records') or [c['record']]
   for rid in records:
    d=detail(t,rid);assert d['outcome'] in ['Useful','Improved'],c['id'];selected[t,rid]=c['id']
    c['evidenceLinks'].append({'href':f'/data_analysis/{t}/?record={rid}#record-detail','label':'Inspect original evidence and saved review'})
    if t=='kr110':
     rows=[p for p in d['modes']['concept'] if p.get('relevant')]
     if c.get('windows'):
      rows=[next(p for p in rows if p['id']==wid) for wid in c['windows']]
     c['sources'].extend(source(p) for p in rows[:2])
    elif t=='kr120':
     match=next((e for e in d['evidence'] if e.get('left_literal') and e.get('right_literal') and e.get('channel')=='wording'),None)
     c['sources'].extend(source({**d[side],'highlight':match[side+'_literal'] if match else None}) for side in ['left','right'])
    else:
     c['sources'].extend(source({**d[side],'id':rid+':'+side,'title':d['title']+' · '+('original term' if side=='source' else 'recorded English aid'),'author':'Held lexicon editorial entry','credits':['Source author/editor credits retained; translator not inferred.'],'cautions':['A gloss does not select a contextual sense.']}) for side in ['source','target'])
    c.setdefault('savedReviewNotes',[]).append(d['note'])
   c['review']='Saved implementation-agent usefulness judgments, then editorial selection by the implementation agent. No independent human review.'
  candidates.append(c)
 # Every saved positive receives a disposition. These are not new quality labels.
 held=[]
 reasons={
  'aff20e23dd09b81575d195dc':'The strongest visible material includes unresolved sole-speaker credit. Defer until source roles and full passage context are established.',
  'f1f37cf9feedd119282ea008':'Useful passage retrieval, but author concentration and missing author labels weaken a new public reading collection. Prioritise the more complete Ephesians guide.',
  'e03c9bd1e492bd0825772b8f':'A one-tradition selection with unresolved source labels. It would not yet make a fair, attributed interpretation guide.',
  '48f46308ee8578d97a146455':'Polemical historical source pair with damaged text and claims requiring additional primary/source and doctrinal review. Not a leading general-reader addition.',
  'aff6dbcc5dcf6e015b9f7336':'Relevant practical material, but most selected source-author labels are missing. Complete attribution before recommending a public reading path.',
  'a9f56dfa4e4e2e1e17cc0b81':'The narrower Hodge passage is a clearer first candidate. This broader communion-preparation set requires careful tradition, context and eligibility distinctions.',
  '38eef6beddfafa89a8a6c001':'Editorial biography carried under Keach-level metadata. Verify the biographical author and historical claims before using it.',
  '7039ed0699ba950ae5a2a71b':'A signed Haykin foreword is mixed with Piper book metadata and related retellings. Correct roles and avoid duplicate corroboration.',
  'f33209cfcb9459e5ddedd911':'Scattered local Latin/English clauses and polemical contexts. No established added value over a properly credited dictionary or selected language note.',
  '6173939ebe2552668ef92a6b':'Secondary reporting of a Latin proposition, not a verified direct Luther quotation. Hold for source-chain research.',
  'b98813c77a1105ff324dcd82':'Wrong language metadata and unresolved appendix/translator identity. This is an interesting research lead, not a publishable Bunyan connection.',
  'fe21407275b8ed3e1b572405':'Another window of the same Welsh relationship; do not count it as another discovery. Language and appendix authorship remain unresolved.',
  'ebbc48aa48e2e38d9fec0205':'A potentially useful Spanish Bunyan/Brooks reading pair, but the translation editions and compilation roles still need identification. Hold behind the more fully attributed first comparisons.',
  '7045fb5f07c435af7d8027b8':"Rogers applies covenant promises to his political cause; the commentary has a different scope. A shared-reference link would be easy to mistake for support of his political inference.",
  '95df648d6d14d3779b40c0f1':'The anthology-level Chapel label does not identify its local author. Resolve that voice before building a public comparison with Reynolds.',
  '4f73d68fe8428cd07a204774':"A local bilingual thematic connection, with different larger arguments and translation/edition work outstanding. The more direct Hebrews 8 reading candidate is a clearer first use.",
  'd7050b6c24d71261bbbfa503':'Both sides retain collective contributor labels rather than identified excerpt authors. Do not publish an author comparison from these labels.',
  '85360063e105aa9c17d231c4':'The two references point to adjacent verses of one episode, and the particular author of the appended tract is unresolved. It is not two independent thematic signals or a secure two-author comparison.',
  'ab698951439532118cdf1660':'The conversion source has no recorded author label; the Edwards edition mixes contributor roles. Correct the local authorship before recommending this as an author comparison.',
  '75499b868867c94264657a4a':'The right excerpt names John Murray, but the left excerpt author remains unresolved under a collective contributor label. Verify that identity and the Spanish translation editions first.',
  'd6940f9fb12eba6db7cbe152':'Already covered more richly in the website archaeology material. The KR-140 museum-summary location adds no comparable new historical insight.',
  'b54a01b6c9f848085e6f983b':'One specialist edition translation group with restorations/lacunae and unreviewed semantic accuracy. Retain for research, not a general-reader translation feature.'
 }
 for r in positives:
  key=(r['track'],r['id'])
  if key in selected:continue
  held.append({'track':r['track'],'record':r['id'],'title':r['title'],'reason':reasons.get(r['id'],'The saved pair is useful as a research comparison, but local excerpt authorship or practical added value is weaker than the shortlisted comparisons. Resolve the source roles and review complete arguments before promotion.'),'href':f"/data_analysis/{r['track']}/?record={r['id']}#record-detail"})
 existing=read(SITE/'content/academic-research/06-discoveries-biblical-record.json')
 # Keep the proof of existing coverage, not a duplicate of the site's richer exhibit.
 objects=existing.get('objects',[]);merneptah=next(x for x in objects if x.get('id')=='merneptah')
 result=safe({'schema':1,'reviewDate':spec['reviewDate'],'scope':spec['scope'],'selectedRuns':pins,'reviewer':'Implementation agent, editorial selection from saved implementation-agent reviews; no independent human review.','candidates':candidates,'held':held,'audit':{'savedPositiveCasesScreened':len(positives),'savedPositiveCasesRepresented':len(selected),'candidates':len(candidates),'heldCases':len(held),'featureFamilies':len(set(c['family'] for c in candidates)),'publicationApprovedByThisReview':0},'existingCoverage':{'title':merneptah['name'],'summary':merneptah['summary'],'conclusion':'Retain and improve the existing archaeology presentation; do not add a second card merely because KR-140 located a shorter summary.','sourceFile':'content/academic-research/06-discoveries-biblical-record.json'},'inputSha256':proofs})
 assert len(selected)+len(held)==43
 OUT.parent.mkdir(parents=True,exist_ok=True);b=(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n').encode()
 if not OUT.exists() or OUT.read_bytes()!=b:
  tmp=OUT.with_suffix('.tmp');tmp.write_bytes(b);tmp.replace(OUT)
 print(json.dumps({'output':str(OUT),'bytes':len(b),'audit':result['audit'],'seconds':round(time.monotonic()-started,3)}))
if __name__=='__main__':main()
