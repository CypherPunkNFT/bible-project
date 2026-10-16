"""Freeze narrow source selection and immutable KR parent identities."""
import hashlib,json,sqlite3
from pathlib import Path
from .inspect_inputs import BASE,OUT
from .contract import SRUN,ARUN,CRITERIA,VERSION,SUPPLEMENT_CRITERIA
from ..build import readonly,dump
from ..concept_index import filehash
from ..inputs import digest,packed
from ..jobs import StaleInput,process_identity

# Registered entity namespaces. 'scripture-entities' is registered here for the registry read and is
# supplied today by the curated supplement below; the registry holds no row in it yet.
NAMESPACES=('historians','archaeology','scholars','scholars-find','evidence','scripture-entities')

def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def checked(path,expected=None):
 p=Path(path);before=p.stat();raw=p.read_bytes();after=p.stat()
 sha=hashlib.sha256(raw).hexdigest()
 if (before.st_size,before.st_mtime_ns)!=(after.st_size,after.st_mtime_ns) or (expected and sha!=expected):raise StaleInput('Changed source: '+str(p))
 return raw,sha
def split(adapter,scope,key=''):
 return 'reserved' if int(digest(adapter+'|'+scope+'|'+key)[:8],16)%5==0 else 'development'
def freeze_supplement():
 """Freeze the curated Scripture-identity dictionary beside the base selection, never inside it.

 The base selection is immutable by design, so this is a second independently frozen input with the
 same staleness discipline. On first call it builds and writes; thereafter it verifies and returns the
 on-disk record verbatim, so the contract hash (and therefore the run id) is stable.
 """
 from . import scripture_entities
 folder=OUT/'inputs';folder.mkdir(parents=True,exist_ok=True)
 record=folder/'supplement.json';entities=folder/'scripture-entities.json'
 if record.exists():
  supplement=read(record)
  for name,sha in supplement['frozen_files'].items():
   if filehash(folder/name)!=sha:raise StaleInput('Frozen supplement input modified: '+name)
  if supplement['criteria']!=SUPPLEMENT_CRITERIA:raise StaleInput('Frozen supplement criteria changed')
  for source in supplement['sources']:
   if filehash(source['path'])!=source['sha256']:raise StaleInput('Curated entity source changed: '+source['project_path'])
  return supplement
 for stray in folder.glob('*.json.tmp'):stray.unlink()
 built=scripture_entities.build()
 # Written first; the record that gates this function is written last, so a death between the two
 # rebuilds cleanly on the next call instead of wedging on a half-frozen supplement.
 dump(entities,built['entities'])
 supplement={'processor':VERSION,'criteria':SUPPLEMENT_CRITERIA,'namespace':built['namespace'],
  'sources':built['sources'],'counts':built['counts'],
  'merged_person_records':built['merged_person_records'],
  'unpinned_names_folded_into_pinned_places':built['unpinned_names_folded_into_pinned_places'],
  'research_snapshot':'Built from repository files only; no network acquisition and no registry write',
  'frozen_files':{entities.name:filehash(entities)}}
 dump(record,supplement)
 return read(record)

def supplement_entities():
 p=OUT/'inputs/scripture-entities.json'
 return read(p) if p.exists() else []

def freeze():
 OUT.mkdir(parents=True,exist_ok=True);folder=OUT/'inputs';folder.mkdir(exist_ok=True)
 if (folder/'selection.json').exists():
  selection=read(folder/'selection.json')
  for p,sha in selection['frozen_files'].items():
   if filehash(folder/p)!=sha:raise StaleInput('Frozen input modified: '+p)
  if read(folder/'criteria.json')!=CRITERIA:raise StaleInput('Frozen criteria changed')
  return {**selection,'supplement':freeze_supplement()}
 parents=[]
 for sub,run in [('',SRUN),('alignment/',ARUN)]:
  p=read(OUT.parent/(sub+('latest-sections.json' if not sub else 'latest-alignment.json')))
  if p['run_id']!=run:raise StaleInput('Expected historical release is no longer selected; resolve manually, do not silently adopt')
  summary=read(p['summary']);manifest=read(Path(p['release'])/'release_manifest.json')
  proof=next(x for x in manifest['files'] if x.get('name',x.get('path'))=='summary.json')
  if summary['state']!='complete' or summary['run_id']!=run or filehash(p['summary'])!=proof['sha256']:raise StaleInput('Invalid parent release')
  parents.append({**p,'summary_sha256':filehash(p['summary']),'manifest_sha256':filehash(Path(p['release'])/'release_manifest.json')})
 if read(parents[1]['summary'])['contract']['section_run']!=SRUN:raise StaleInput('Parent mismatch')
 db=readonly(BASE/'Research Foundation/registry.sqlite3');db.execute('BEGIN')
 citations=[dict(r) for r in db.execute('select * from citations order by id')]
 entities=[dict(r) for r in db.execute('select * from entities where namespace in ('+','.join('?'*len(NAMESPACES))+') order by id',NAMESPACES)]
 resources=[dict(r) for r in db.execute("select * from resources where (group_id='history:02-assyrian-archives' and (path like '%corpusjson%.json' or path like '%Repaired Source Records%.html')) or id in (select source_id from citations) or path like '%HebrewStrong.xml' or path like '%LexicalIndex.xml' order by id")]
 relations=[dict(r) for r in db.execute("select * from relations where relation in ('assesses','cites-held-source','describes-person','describes-manuscript','related-excavation','related-site-context') order by source_id,target_id,relation")]
 db.close()
 sec=readonly(Path(parents[0]['database']))
 lex=[dict(r) for r in sec.execute("select * from research_scope where run_id=? and disposition='supported' and adapter='xml-entry' and (descriptor_json like '%HebrewStrong.xml%' or descriptor_json like '%LexicalIndex.xml%') order by document_id",(SRUN,))]
 sec.close()
 values={'criteria.json':CRITERIA,'citations.json':citations,'entities.json':entities,'resources.json':resources,'relations.json':relations,'lexicon-scope.json':lex}
 for name,value in values.items():dump(folder/name,value)
 selection={'processor':VERSION,'parents':parents,'research_snapshot':'Selected rows from consistent read transaction; original registry unchanged',
  'frozen_files':{name:filehash(folder/name) for name in values},'counts':{k:len(v) for k,v in values.items() if isinstance(v,list)}}
 dump(folder/'selection.json',selection)
 return {**selection,'supplement':freeze_supplement()}

def source_scope():
 folder=OUT/'inputs';resources=read(folder/'resources.json');byid={r['id']:r for r in resources};rows=[]
 for c in read(folder/'citations.json'):
  rec=json.loads(c['record']);paths=[]
  for field,sha in [('sourcePath','sourceSha256'),('extractedPath','extractedSha256')]:
   if rec['private'].get(field):paths.append({'path':rec['private'][field],'sha256':rec['private'].get(sha)})
  rows.append({'id':c['id'],'adapter':'historical-citation','record':rec,'paths':paths,'resource':byid.get(c['source_id'])})
 for r in resources:
  path=r['path']
  if r['group_id']!='history:02-assyrian-archives':continue
  adapter='oracc-json' if 'corpusjson' in path and path.endswith('.json') else 'oracc-atf' if 'Repaired Source Records' in path and path.endswith('.html') else None
  if adapter:rows.append({'id':r['id'],'adapter':adapter,'record':json.loads(r['record']),'paths':[{'path':path,'sha256':r['sha256']}],'resource':r})
 grouped={}
 for row in read(folder/'lexicon-scope.json'):
  d=json.loads(row['descriptor_json']);x=d['xml_link'];grouped.setdefault(x['asset_path'],[]).append(d)
 for path,docs in grouped.items():
  matches=[r for r in resources if Path(r['path'])==Path(path)]
  rows.append({'id':'lexicon:'+Path(path).name,'adapter':'lexicon','record':docs,'paths':[{'path':path,'sha256':docs[0]['xml_link']['asset_sha256']}],'resource':matches[0] if len(matches)==1 else None})
 return sorted(rows,key=lambda r:(r['adapter'],r['id']))

def pin_sources():
 freeze();p=OUT/'inputs/scope.json'
 if p.exists():return read(p)
 rows=source_scope()
 for i,r in enumerate(rows):
  for proof in r['paths']:
   try:raw,sha=checked(proof['path'],proof['sha256']);proof.update(sha256=sha,size=len(raw))
   except (OSError,StaleInput) as exc:proof['error']=str(exc)
  if i%1000==0:print(packed({'phase':'pin','visited':i,'total':len(rows)}),flush=True)
 dump(p,rows);return rows

def owners():
 p=BASE/'library-analytics/pipeline/pipeline.sqlite3';db=readonly(p)
 result=[dict(r)|{'observed_token':process_identity(r['pid'])} for r in db.execute('select * from coordinator')];db.close();return result
