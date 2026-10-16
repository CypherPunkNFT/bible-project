"""Apply the bounded, source-reviewed CPU mapping batch; never promote raw candidates.

Checks canonical authors and current original hashes before writing one independent
passage overlay. Private excerpts and rejection decisions stay in the analysis folder.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

SITE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(SITE/'scripts'))
from bible.study_refs import Verses,parse_refs

ROOT=SITE.parent/'KnowledgeBase/teacher-scripture-analysis/cpu-20261014'
read=lambda p:json.loads(Path(p).read_text(encoding='utf-8'))
BATCH=[
 ('work-reconciled-ac4122ebeda7c03e105aaf39','author-richard-sibbes','Matthew 12:20','Opening body heading followed by its quoted text and exposition.'),
 ('work-reconciled-ae3a02c3c7589941ee418d75','author-thomas-watson','Matthew 5:1-12','Author and exposition range stated at the opening, followed by the preface and exposition.'),
 ('work-reconciled-a3ee6965adb3daafe6cff352','author-thomas-watson','2 Corinthians 7:1','Body page 1 states "2 Cor. 7. Chap. part of the 1. verse"; Watson explicitly expounds "my dearly Beloved". Acts 20:38 on the title page is an epigraph, not the sermon text.'),
 ('work-reconciled-56420513f543b9284bbc24f6','author-john-bunyan','Ephesians 3:18-19','Opening first part of the text; later major sections return to the same prayer and its second part.'),
 ('work-reconciled-8186c6927898b9beb2763456','author-john-bunyan','Titus 3:7-8','Opening quotation followed by introduction explaining the scope of these words.'),
 ('work-reconciled-865ad648283701d7e59a86a8','author-john-flavel','Revelation 3:17-18','Opening Touchstone quotation followed by Chapter I, Elucidation of the Text.'),
 ('work-reconciled-14e6f19277cb48eb4931605d','author-john-flavel','Isaiah 26:20','Opening text followed by Chapter I on its literal and real importance.'),
 ('work-reconciled-0b403d61df8597d40457941f','author-stephen-charnock','1 Corinthians 2:2; 1 Corinthians 5:7','The held volume contains two discourses, each with its own opening text and exposition; retain both texts on the one volume.'),
 ('work-reconciled-a16d2c71b71cec11fa60e94d','author-stephen-charnock','2 Corinthians 5:19','Opening identifies the sermon text; ensuing quoted words and doctrine concern God in Christ reconciling the world.'),
 ('work-reconciled-ff944096f114dc34ad894242','author-thomas-boston','Mark 10:21-22','Series opening Sermon I takes Mark 10:21; Sermon VII takes Mark 10:22. One held work, two contiguous verses.'),
]


def prepare():
 inventory=read(ROOT/'inventory.json')['files'];verses=Verses(SITE/'data')
 decisions=[];works={}
 for wid,author,reference,basis in BATCH:
  catalog=read(SITE/'content/library/catalog/works'/(wid+'.json'))
  creators={c['authorId'] for c in catalog.get('creators',[]) if c.get('role','author')=='author'}
  if creators!={author}:raise ValueError('Canonical author mismatch: '+wid)
  if any(p.get('role')=='main-text' and p.get('start') for p in catalog.get('passages',[])):raise ValueError('Existing main text must not be overwritten: '+wid)
  rows=[r for r in inventory if (r['metadata'].get('work') or {}).get('id')==wid and not r['mixedAttribution'] and r['teacherIds']==[author]]
  witnesses=[]
  for row in rows:
   key=hashlib.sha256((row['path']+row['sha256']).encode()).hexdigest()
   evidence=read(ROOT/'evidence'/(key+'.json'))
   if not evidence['textCharacters']:continue
   source=Path(row['path'])
   with source.open('rb') as stream:actual=hashlib.file_digest(stream,'sha256').hexdigest()
   if actual!=row['sha256']:raise ValueError('Original changed since scan: '+row['path'])
   candidates=[x for x in evidence['references'] if x.get('normalizedReference')==reference]
   witnesses.append({'sourcePath':row['path'],'sourceSha256':actual,'locator':candidates[0]['locator'] if candidates else 'Reviewed source body and discourse headings','sourceUrl':evidence.get('sourceUrl') or catalog['evidence'][0]['url'],'excerpts':candidates[:1],'evidenceFile':str(ROOT/'evidence'/(key+'.json'))})
  if not witnesses:raise ValueError('No intact source witness: '+wid)
  spans=parse_refs(reference,verses)
  if any(start>end for start,end in spans):raise ValueError('Reversed range: '+wid)
  entry={'passages':[{'reference':reference,'numberingSystem':'english','role':'main-text','start':start,'end':end,'verification':'verified','locator':witnesses[0]['sourceUrl']+'; '+witnesses[0]['locator']+'; source-reviewed 2026-10-14'} for start,end in spans]}
  works[wid]=entry
  decisions.append({'workId':wid,'authorId':author,'title':catalog['title'],'mainText':reference,'basis':basis,'witnesses':witnesses,'review':'Source excerpt and body context reviewed by Codex; bibliographic and main-text scope only, not whole-work endorsement.'})
 return {'kind':'passage-overlay','name':'cpu-reviewed-teachers-20261014','generatedBy':'scripts/apply-reviewed-teacher-mappings.py','generatedOn':'2026-10-14','method':'Bounded source-reviewed main-text batch. Current original hashes and canonical authors checked. No vector inference, index references, title-page epigraphs or ordinary supporting citations promoted.','counts':{'works':len(works),'teachers':len({d['authorId'] for d in decisions})},'works':works},decisions


def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
 overlay,decisions=prepare()
 target=SITE/'content/library/passage-overlays/cpu-reviewed-teachers-20261014.json'
 text=json.dumps(overlay,ensure_ascii=False,indent=2)+'\n'
 if args.check:
  if not target.exists() or target.read_text(encoding='utf-8')!=text:raise ValueError('Reviewed overlay is missing or stale')
 else:
  target.write_text(text,encoding='utf-8')
  (ROOT/'reviewed-mapping-batch.json').write_text(json.dumps({'decisions':decisions,'deferred':[{'authorId':'author-martyn-lloyd-jones','reason':'Verified section text awaits a reviewed section/volume representation; do not count the parent as a new sermon.'}],'rejected':[{'workId':'work-reconciled-a3ee6965adb3daafe6cff352','reference':'Acts 20:38','reason':'Title-page epigraph; actual sermon body explicitly states 2 Corinthians 7:1.'}],'duplicateEditions':'One selected catalogue work per reviewed title; additional witnesses/editions remain unpromoted. No catalogue records or held editions deleted.'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(overlay['counts']))


if __name__=='__main__':main()
