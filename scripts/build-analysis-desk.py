"""Small private presentation projection of saved KR results; no mining or models."""
from pathlib import Path
import hashlib,json,sqlite3,time
from datetime import datetime,timezone

SITE=Path(__file__).resolve().parents[1]
BASE=SITE.parent/'KnowledgeBase/library-knowledge/connected-research'
OUT=SITE/'.local/data-analysis'
PINS={'kr110':'kr110-54f0bfca9b30da6cc49b2347','kr120':'kr120-66a741ba22a7025744d3b98d','kr140':'kr140-3092a59f7c3f691bb7cdf4f9'}
DECISIONS={
 'kr110':{'recommendation':'Rework before relying on it','tone':'bad','job':'Find source passages for a study question.','headline':'A small retrieval gain, with more irrelevant results.','gain':'3 questions improved; 1 regressed. Net gain: 2 of 48.','use':'Use as a shortlist of passages to check yourself.','risk':'Top-five precision fell from 38.75% to 34.17%. Automatic answers and speaker attribution are not reliable.','measureNote':'48 reserved questions, reviewed by the implementation agent. This is retrieval usefulness, not independent theological approval.','featured':[{'outcome':'Improved','contains':'spiritual dryness','label':'Gain: spiritual dryness','why':'Find pastoral passages the baseline missed.'},{'outcome':'Improved','contains':'Brooks and Goodwin','label':'Gain: compare two authors','why':'Inspect the evidence and contributor ambiguity.'},{'outcome':'Regressed','contains':'1677','label':'Failure: confession history','why':'See where the new retrieval lost a useful result.'}]},
 'kr120':{'recommendation':'Keep narrowly: reference leads','tone':'warn','job':'Find passages worth comparing across works.','headline':'Some useful connections; wording matches are mostly noise.','gain':'Known reference-pair recovery rose from 2/16 to 9/16: seven additional pairs.','use':'Use shared-reference links to find related discussions; inspect both passages.','risk':'Only 11/24 reference pairs and 3/24 wording pairs were useful in the review sample. Matching does not establish influence.','measureNote':'Recovery on 16 known pairs and usefulness in a separate stratified sample are different tests. These are not population precision estimates.','featured':[{'contains':'Seeing Beauty','label':'Useful: Piper quotes Whitefield','why':'Read both ends of a named quotation.'},{'contains':'The Doctrine of the Atonement','label':'Useful: two texts on God’s word','why':'See a substantive shared-reference connection.'},{'outcome':'Not useful','contains':'Erroll Hulse','field':'author','label':'Failure: publisher boilerplate','why':'See a false connection caused by contact information.'}]},
 'kr140':{'recommendation':'Keep narrowly: source lookup','tone':'neutral','job':'Locate the source behind a historical claim or language aid.','headline':'Better source lookup; historical interpretation is unproven.','gain':'33/33 historical source-location cases found, up from 7/33.','use':'Use it to inspect source wording, date roles and dictionary entries.','risk':'Correct location is not historical truth or translation accuracy. A reviewed Tel Dan claim had only partial support.','measureNote':'Source-annotation checks measure location. The separate content review was only nine selected cases; no independent specialist reviewed them.','featured':[{'contains':'Merneptah','outcome':'Useful','label':'Useful: the Israel inscription','why':'See what the cited institutional summary actually says.'},{'contains':'Hebrew father','label':'Useful: a Hebrew dictionary entry','why':'See the original term beside its recorded English aid.'},{'outcome':'Limited','contains':'House of David','label':'Limitation: the Tel Dan claim','why':'The quotation supports less than the inherited claim.'}]},
}
proofs={}
def read(rel):
 p=BASE/rel;b=p.read_bytes();proofs[rel]=hashlib.sha256(b).hexdigest();return json.loads(b)
def write(name,v):
 p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);b=(json.dumps(v,ensure_ascii=False,separators=(',',':'))+'\n').encode()
 if not p.exists() or p.read_bytes()!=b:
  tmp=p.with_suffix('.tmp');tmp.write_bytes(b);tmp.replace(p)
def safe(v):
 if isinstance(v,dict):return {k:safe(x) for k,x in v.items() if k not in ['private','path','source_path','cache_path','sourcePath','extractedPath','source_registry','source_registry_paths']}
 if isinstance(v,list):return [safe(x) for x in v]
 if isinstance(v,str) and ('FortressOfSolitude' in v or '\\Users\\' in v):return 'Private source file'
 return v
def passage(r,relevant=None):
 p=r.get('provenance',{});span=r.get('source_span',{});readers=p.get('readers',[])
 return {'id':str(r.get('id','')),'title':p.get('title') or r.get('section_heading') or 'Untitled source','author':r.get('author_label') or p.get('author_label') or 'Author unrecorded','heading':r.get('section_heading'),'text':r.get('text',''),'context':r.get('context',''),'language':r.get('language'),'locator':span.get('locator') or 'Recorded source segment','start':r.get('start'),'end':r.get('end'),'sha256':r.get('text_sha256'),'relevant':relevant,'sourceId':r.get('document_id'),'workId':r.get('work_id'),'editionId':r.get('edition_id'),'credits':list(dict.fromkeys(x.get('credit','') for x in readers if x.get('credit'))),'cautions':list(dict.fromkeys(x.get('reviewWarning') for x in readers if x.get('reviewWarning'))),'licences':list(dict.fromkeys(x.get('licence','') for x in readers if x.get('licence'))),'reader':next((f"/teachers/works/{x['id']}" for x in readers if x.get('id')),None),'attribution':'Recorded source contributor; sentence-level speaker and endorsement are not established.'}
def entry(track,rawid,title,group,outcome,note,detail,**extra):
 ident=hashlib.sha256((track+':'+rawid).encode()).hexdigest()[:24]
 d={'id':ident,'track':track,'title':title,'group':group,'outcome':outcome,'note':note,**extra,**detail}
 write(f'{track}/details/{ident}.json',safe(d))
 return safe({k:d[k] for k in ['id','title','group','outcome','note',*extra]})
def assert_pin(v,track):assert v['run_id']==PINS[track],f'Unexpected {track} generation'
def editorial(track):
 d=dict(DECISIONS[track['id']]);features=[]
 for spec in d.pop('featured'):
  candidates=[r for r in track['records'] if (not spec.get('outcome') or r['outcome']==spec['outcome']) and spec['contains'].lower() in r.get(spec.get('field','title'),'').lower()]
  assert candidates,f'Missing editorial example: {spec}'
  features.append({'id':candidates[0]['id'],'label':spec['label'],'why':spec['why'],'outcome':candidates[0]['outcome']})
 track['decision']=d;track['featured']=features
 labels={'kr110':['Questions with useful evidence','Relevant results in the top five'],'kr120':['Useful wording pairs','Useful reference pairs','Known reference pairs recovered'],'kr140':['Historical source-location checks','Dictionary-entry location checks','Useful content in a small sample']}
 for metric,newlabel in zip(track['metrics'],labels[track['id']]):metric['label']=newlabel
 if track['id']=='kr140':
  track['metrics'][0]['unit']='test cases';track['metrics'][1]['unit']='test cases'
 track['overviewMetrics']=track['metrics'][:2] if track['id']=='kr110' else [track['metrics'][2]] if track['id']=='kr120' else [track['metrics'][0]]
 return track

def main():
 started=time.perf_counter();OUT.mkdir(parents=True,exist_ok=True)
 # KR-110: the entire reserved evaluation, with both saved ranking outputs.
 p=read('concepts/population.json');q=read(f"concepts/evaluations/{PINS['kr110']}/quality.json");assert_pin(p,'kr110');assert_pin(q,'kr110')
 ex=read('concepts/query-examples.json');assert_pin(ex,'kr110')
 ev=BASE/f"concepts/evaluations/{PINS['kr110']}/reserved-results.jsonl";proofs[str(ev.relative_to(BASE))]=hashlib.sha256(ev.read_bytes()).hexdigest()
 rows={v['id']:v for line in ev.read_text('utf-8').splitlines() if line.strip() for v in [json.loads(line)]}
 records=[]
 for judged in q['questions']:
  r=rows[judged['question_id']];b=judged['baseline']['success'];c=judged['concept']['success']
  outcome='Deferred' if judged['disposition'].startswith('deferred') or judged['disposition']=='capability-deferred' else 'Improved' if c and not b else 'Regressed' if b and not c else 'Useful' if c else 'Failed'
  modes={}
  for mode in ['baseline','concept']:
   relevant=set(judged[mode]['relevant_ranks'])
   modes[mode]=[passage(v,i+1 in relevant) for i,v in enumerate(r['outputs'][mode]['results'])]
  records.append(entry('kr110',r['id'],r['question'],r['family'],outcome,judged.get('notes',''),{'expected':r['expected_evidence'],'modes':modes,'baselineSuccess':b,'conceptSuccess':c,'failures':judged.get('failure_classes',[])},author=' · '.join(dict.fromkeys(v['author'] for v in modes['concept'] if v['author']!='Author unrecorded')),kind='Reserved question'))
 for i,e in enumerate(ex['examples']):
  records.append(entry('kr110',f'query-{i}',e['query'],'constrained-query','Query example','Saved constrained query; these passages have no separate usefulness judgment in this receipt.',{'constraints':e['constraints'],'modes':{'concept':[passage(r) for r in e['results']]},'failures':[]},kind='Saved query',author=' · '.join(dict.fromkeys(r.get('author_label','') for r in e['results']))))
 one={'id':'kr110','code':'KR-110','title':'Concepts & questions','description':'Find passages for a question, then inspect what was retrieved.','status':'Retrieval gate failed','statusTone':'bad','takeaway':'Two more questions completed; precision fell. Treat results as candidates.','run':PINS['kr110'],'date':'14 October 2026','reviewer':q['reviewer_type'],'counts':p['counts'],'metrics':[{'label':'Useful questions','before':23,'after':25,'total':48,'unit':'questions'},{'label':'Precision in top five','before':38.75,'after':34.1666666667,'total':100,'unit':'%'}],'families':q['by_family'],'records':records,'browseLabel':'48 reserved questions + 7 saved queries','limits':['13 questions were capability-deferred and remain in the denominator.','Author constraints identify source metadata, not who endorses every sentence.','This is a historical CPU snapshot. No vectors were selected by this processor.'],'report':'kr110.md'}
 editorial(one);write('kr110/index.json',one)
 # KR-120: every sampled pair, including failures, and both full saved contexts.
 p=read('relationships/population.json');q=read('relationships/quality.json');pool=read('relationships/evaluation-pool.json');assert_pin(p,'kr120');assert_pin(q,'kr120');assert_pin(pool,'kr120')
 judgments={r['sample_id']:r for r in q['judgments']};records=[]
 for pair in pool['samples']:
  j=judgments[pair['sample_id']];left=passage(pair['left']);right=passage(pair['right']);channel=pair['sample_channel']
  records.append(entry('kr120',pair['sample_id'],left['title']+' ↔ '+right['title'],channel,'Useful' if j['useful'] else 'Not useful',j['notes'],{'left':left,'right':right,'evidence':safe(pair['evidence']),'classification':j['classification'],'independence':pair['independence'],'quotationSupportedHere':j.get('quoted_author_attribution_supported',False)},author=left['author']+' · '+right['author'],displayTitle=left['author']+' ↔ '+right['author'],kind='Reviewed pair'))
 two={'id':'kr120','code':'KR-120','title':'Passage connections','description':'Compare shared wording and Bible-reference connections between works.','status':'Candidate connections only','statusTone':'warn','takeaway':'Shared references were more useful than wording matches. Reprints and boilerplate remain major noise.','run':PINS['kr120'],'date':'14 October 2026','reviewer':q['reviewer_type'],'counts':p['counts'],'metrics':[{'label':'Useful wording pairs','after':3,'total':24,'unit':'pairs'},{'label':'Useful shared-reference pairs','after':11,'total':24,'unit':'pairs'},{'label':'Reserved co-citation recovery','before':2,'after':9,'total':16,'unit':'known pairs'}],'classifications':{k:v['classifications'] for k,v in q['metrics'].items()},'records':records,'browseLabel':'All 48 reviewed pairs','limits':['Stratified sample: 3/24 and 11/24 are sample judgments, not population precision estimates.','Matching passages do not establish influence, agreement or independent works.','Canonical-reference mapping errors remain; source-span verification does not correct them.'],'report':'kr120.md'}
 editorial(two);write('kr120/index.json',two)
 # KR-140: all stored historical links and dates, plus the executed language examples.
 p=read('history-language/population-result.json');q=read('history-language/population-quality.json');review=read('history-language/content-review.json');fast=read('history-language/fast-located-examples.json');assert_pin(p,'kr140')
 db=sqlite3.connect((BASE/'history-language/history-language.sqlite3').as_uri()+'?mode=ro',uri=True,timeout=5);db.row_factory=sqlite3.Row;db.execute('PRAGMA query_only=ON');db.execute('PRAGMA cache_size=-8192')
 records=[];decisions={d['fact_id']:d for d in review['decisions']}
 for r in db.execute('SELECT h.*,w.text,w.locator,w.start,w.end,w.text_sha256 FROM historical_links h JOIN witnesses w ON w.id=h.witness_id AND w.run_id=h.run_id WHERE h.run_id=? ORDER BY h.scope_id,h.id',(PINS['kr140'],)):
  rec=json.loads(r['record_json']);d=decisions.get(r['id']);scope=db.execute('SELECT record_json FROM scope WHERE run_id=? AND scope_id=?',(PINS['kr140'],r['scope_id'])).fetchone();s=json.loads(scope[0]).get('record',{}) if scope else {}
  title=rec.get('claim') or rec.get('literal') or s.get('claim') or r['entity_id'];outcome=('Useful' if d['useful_within_declared_scope'] else 'Limited') if d else 'Unreviewed'
  group={'explicit-citation-claim':'Historical claims','explicit-citation-source':'Source bindings','full-title-lexical-mention':'Title mentions'}[r['basis']]
  records.append(entry('kr140',r['id'],title,group,outcome,d['notes'] if d else 'Located source annotation; no separate content-quality judgment for this record.',{'text':r['text'],'locator':r['locator'],'start':r['start'],'end':r['end'],'sha256':r['text_sha256'],'entity':r['entity_id'],'basis':r['basis'],'state':r['state'],'record':safe(rec),'sourceTitle':s.get('title') or s.get('sourceTitle') or 'Recorded historical source','sourceUrl':s.get('sourceUrl') or rec.get('sourceUrl'),'limits':s.get('limits',[]),'dates':s.get('dates',{}),'kind':'Historical link'},author=s.get('sourceRole',''),scope=r['scope_id']))
 assert len(records)==275
 for r in db.execute('SELECT * FROM dates WHERE run_id=? ORDER BY scope_id,role,id',(PINS['kr140'],)):
  records.append(entry('kr140',r['id'],f"{r['scope_id']} · {r['role']}",'Date records','Unknown' if r['state']=='unknown' else 'Recorded','Date roles are retained separately; a publication or review date is not the age of an object.',{'raw':r['raw'],'role':r['role'],'state':r['state'],'record':safe(json.loads(r['record_json'])),'kind':'Date record'},scope=r['scope_id'],author=''))
 db.close()
 for name,e in fast.items():
  if name in ['Merneptah','Tel_Dan']:continue
  for i,r in enumerate(e['results']):
   record=json.loads(r.get('record_json','{}'));d=decisions.get(r['id'])
   records.append(entry('kr140',r['id'],name.replace('_',' '),'Language examples',('Useful' if d['useful_within_declared_scope'] else 'Limited') if d else 'Unreviewed',d['notes'] if d else 'Saved source annotation; lexical glosses are not contextual translations.',{'source':{'text':r.get('source_text'),'language':r.get('source_language'),'locator':r.get('source_locator'),'start':r.get('source_start'),'end':r.get('source_end')},'target':{'text':r.get('target_text'),'language':r.get('target_language'),'locator':r.get('target_locator'),'start':r.get('target_start'),'end':r.get('target_end')},'relation':r['relation'],'record':safe(record),'credits':safe(json.loads(r.get('credits_json','{}'))),'deferrals':safe(e.get('deferrals',[]))},scope=r['scope_id'],kind='Language example',author=''))
 three={'id':'kr140','code':'KR-140','title':'History & languages','description':'Inspect historical source links, date roles and original-language aids.','status':'Located annotations','statusTone':'neutral','takeaway':'Useful as a source-location tool. Most “alignments” are dictionary or token glosses, not translated passages.','run':PINS['kr140'],'date':'14 October 2026','reviewer':'Source-annotation checks, then model-assisted implementation-agent review; no independent specialist.','counts':p['counts'],'metrics':[{'label':'Reserved historical locations','before':7,'after':33,'total':33,'unit':'positive cases'},{'label':'Reserved lexicon locations','before':21,'after':39,'total':39,'unit':'positive cases'},{'label':'Useful inspected content','after':8,'total':9,'unit':'selected cases'}],'adapters':q['adapters'],'records':records,'browseLabel':'275 historical links · 648 date records · 3 saved language queries','limits':['Historical location checks verify recorded annotations, not historical truth or original inscriptions.','The 8/9 content review was a small convenience sample, not a population or held-out quality estimate.','615,512 token glosses, 17,977 lexicon links and one labeled translation group are different units.','47,747 numeric or placeholder guidewords are not useful standalone English meanings.'],'report':'kr140.md'}
 three['browseLabel']='128 claim annotations · 128 source bindings · 19 title mentions · 648 date fields · 3 language examples'
 editorial(three);write('kr140/index.json',three)
 summary={'snapshot':'Historical releases · 14 October 2026','tracks':[{**{k:t[k] for k in ['id','code','title','description','status','statusTone','takeaway','browseLabel','date','run','decision','overviewMetrics','featured']},'metric':t['metrics'][0]} for t in [one,two,three]],'retired':'KR-130 arguments were rejected and deleted at the owner’s request.'}
 write('summary.json',summary)
 reports={'kr110':SITE/'knowledge/library_analytics/CONCEPTS-RESULT.md','kr120':SITE/'knowledge/library_analytics/RELATIONSHIPS-RESULT.md','kr140':BASE/'history-language/RESULT.md'}
 for key,p in reports.items():
  # Reports remain private; source excerpts/paths are never added to public/ or dist/.
  target=OUT/f'{key}.md';b=p.read_bytes()
  if not target.exists() or target.read_bytes()!=b:target.write_bytes(b)
 write('projection-manifest.json',{'schema':1,'pins':PINS,'inputSha256':proofs,'scope':'Saved evaluation/question/pair records plus all pinned historical links and dates; language examples are explicitly bounded. No new extraction or evaluation.','counts':{'kr110':len(one['records']),'kr120':len(two['records']),'kr140':len(three['records'])}})
 print(json.dumps({'output':str(OUT),'records':{'kr110':len(one['records']),'kr120':len(two['records']),'kr140':len(three['records'])},'seconds':round(time.perf_counter()-started,3)}))

if __name__=='__main__':main()
