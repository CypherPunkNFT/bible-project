"""Small located content sample for candid implementation-agent review."""
from pathlib import Path
import json
from .inputs import OUT,read
from ..build import readonly,dump
from ..inputs import packed

def main():
 active=read(OUT/'active-run.json');run=active['run_id'];db=readonly(Path(active['database']));packet=[]
 for entity in ['evidence:BA-001','evidence:BA-002']:
  r=db.execute('''select h.*,w.path,w.asset_sha256,w.locator,w.start,w.end,w.text from historical_links h join witnesses w on w.id=h.witness_id where h.run_id=? and h.entity_id=? limit 1''',(run,entity)).fetchone()
  if r:packet.append({'kind':'historical','data':dict(r)})
 for scope in ['lexicon:HebrewStrong.xml','lexicon:LexicalIndex.xml']:
  rows=db.execute('''select a.*,s.path,s.locator source_locator,s.text source_text,t.locator target_locator,t.text target_text from language_alignments a join witnesses s on s.id=a.source_witness join witnesses t on t.id=a.target_witness where a.run_id=? and a.scope_id=? limit 2''',(run,scope)).fetchall()
  packet += [{'kind':'lexicon','data':dict(r)} for r in rows]
 for relation in ['oracc-lexical-annotation','explicit-labeled-translation-group']:
  rows=db.execute('''select a.*,s.path,s.locator source_locator,s.text source_text,t.locator target_locator,t.text target_text from language_alignments a join witnesses s on s.id=a.source_witness join witnesses t on t.id=a.target_witness where a.run_id=? and a.relation=? limit 2''',(run,relation)).fetchall()
  packet += [{'kind':relation,'data':dict(r)} for r in rows]
 dump(OUT/'content-review-packet.json',packet)
 for r in packet:print(packed(r))
 db.close()
if __name__=='__main__':main()
