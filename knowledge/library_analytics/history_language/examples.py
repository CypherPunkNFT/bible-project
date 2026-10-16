"""Actual located examples and aggregate coverage for the task handoff."""
import json
from pathlib import Path
from .inputs import OUT,read
from .processor import query
from ..build import readonly,dump
from ..inputs import packed

def main():
 active=read(OUT/'active-run.json');run=active['run_id'];db=readonly(Path(active['database']))
 tables={}
 for table,group in [('scope','adapter'),('results','state'),('language_alignments','relation'),('language_alignments','source_language'),('historical_links','basis'),('historical_links','state'),('dates','role'),('section_bindings','state')]:
  tables[table+'|'+group]=[dict(r) for r in db.execute('select '+group+',count(*) n from '+table+' where run_id=? group by '+group+' order by n desc',(run,))]
 tables['deferrals']=[dict(r) for r in db.execute("select case when reason like '%:definition-missing' then 'lexicon-definition-missing' when reason like '%:language-unassigned' then 'lexicon-language-unassigned' else reason end reason,count(*) n from deferrals where run_id=? group by 1 order by n desc",(run,))]
 tables['job_states']=[dict(r) for r in db.execute('select j.state,count(*) n from jobs j join run_jobs r on r.job_id=j.id where r.run_id=? group by j.state',(run,))]
 tables['numeric_or_empty_guidewords']=db.execute("select count(*) from language_alignments a join witnesses t on t.id=a.target_witness where a.run_id=? and a.relation='oracc-lexical-annotation' and (t.text glob '[0-9]' or t.text in ('','u','X','x'))",(run,)).fetchone()[0]
 examples={'historical_Merneptah':query('evidence:BA-001','history',3),'historical_Tel_Dan':query('evidence:BA-002','history',3),'ambiguous_Merneptah_entity_mention':query('archaeology:BA-001','history',3),'lexical_father':query('father','language',6),'translation_Q003424':query('Q003424','language',4)}
 for relation in ['oracc-lexical-annotation','explicit-labeled-translation-group']:
  examples[relation]=[dict(r) for r in db.execute('''select a.*,s.path,s.asset_sha256,s.coordinate,s.locator source_locator,s.start source_start,s.end source_end,s.text source_text,t.locator target_locator,t.start target_start,t.end target_end,t.text target_text from language_alignments a join witnesses s on s.id=a.source_witness join witnesses t on t.id=a.target_witness where a.run_id=? and a.relation=? and length(t.text)>4 order by a.id limit 8''',(run,relation))]
 dump(OUT/'coverage.json',tables);dump(OUT/'located-examples.json',examples)
 print(packed(tables));print(packed({k:v for k,v in examples.items() if k in ('oracc-lexical-annotation','explicit-labeled-translation-group')}))
 db.close()
if __name__=='__main__':main()
