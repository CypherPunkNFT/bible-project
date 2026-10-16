"""Fast generation-bound queries constrained to an existing entity or source scope."""
import argparse,json
from pathlib import Path
from .inputs import OUT,read
from ..build import readonly,dump
from ..inputs import packed

def entity_query(entity):
 active=read(OUT/'active-run.json');db=readonly(Path(active['database']))
 rows=[dict(r) for r in db.execute('''select h.*,w.path,w.asset_sha256,w.coordinate,w.locator,w.start,w.end,w.text from historical_links h indexed by history_entity join witnesses w on w.id=h.witness_id where h.run_id=? and h.entity_id=? order by h.id''',(active['run_id'],entity))];db.close();return {'run_id':active['run_id'],'entity_id':entity,'results':rows}

def scope_query(scope,entry=None,term=None,limit=20):
 active=read(OUT/'active-run.json');db=readonly(Path(active['database']));where='a.run_id=? and a.scope_id=?';args=[active['run_id'],scope]
 if entry:where+=" and json_extract(a.numbering_json,'$.entry_key')=?";args.append(entry)
 if term:where+=' and (s.text=? or t.text like ?)';args.extend([term,'%'+term+'%'])
 sql='''select a.*,s.path,s.asset_sha256,s.coordinate,s.locator source_locator,s.start source_start,s.end source_end,s.text source_text,t.locator target_locator,t.start target_start,t.end target_end,t.text target_text from language_alignments a indexed by languages_scope join witnesses s on s.id=a.source_witness join witnesses t on t.id=a.target_witness where '''+where+' limit ?'
 args.append(limit);rows=[dict(r) for r in db.execute(sql,args)];plan=[tuple(r) for r in db.execute('explain query plan '+sql,args)]
 deferrals=[dict(r) for r in db.execute('select reason,record_json from deferrals where run_id=? and scope_id=? limit 20',(active['run_id'],scope))]
 db.close();return {'run_id':active['run_id'],'scope_id':scope,'entry':entry,'term':term,'results':rows,'deferrals':deferrals,'query_plan':plan}

def examples():
 packet={'Merneptah':entity_query('evidence:BA-001'),'Tel_Dan':entity_query('evidence:BA-002'),'Hebrew_father':scope_query('lexicon:HebrewStrong.xml',entry='H1:0'),'Aramaic_father':scope_query('lexicon:HebrewStrong.xml',entry='H2:1'),'Q003424_translation':scope_query('resource:eaacf879-12e0-4563-ac2c-fe188d0f1bd6')}
 dump(OUT/'fast-located-examples.json',packet);print(packed({k:{'rows':len(v['results']),'plan':v.get('query_plan')} for k,v in packet.items()}))

def main():
 p=argparse.ArgumentParser();p.add_argument('--entity');p.add_argument('--scope');p.add_argument('--entry');p.add_argument('--term');p.add_argument('--examples',action='store_true');a=p.parse_args()
 if a.examples:examples()
 elif a.entity:print(packed(entity_query(a.entity)))
 elif a.scope:print(packed(scope_query(a.scope,a.entry,a.term)))
 else:p.error('Select --entity, --scope or --examples')
if __name__=='__main__':main()
