import json,collections
from .inspect_inputs import OUT,BASE
from ..build import readonly
def main():
    i=json.loads((OUT/'inspection.json').read_text(encoding='utf-8'))
    for n in ['sections','alignment']:
        print(n,'\n'.join(i[n]['schema'][7:]));print(json.dumps(i[n]['samples'].get('research_scope',i[n]['samples'].get('alignment_scope')),ensure_ascii=False)[:14000])
    db=readonly(BASE/'Research Foundation/registry.sqlite3')
    print('entity kinds',[tuple(r) for r in db.execute('select namespace,kind,count(*) from entities group by namespace,kind')])
    print('relations',[tuple(r) for r in db.execute('select relation,count(*) from relations group by relation')])
    for r in db.execute("select * from entities where namespace not like 'library:%' limit 8"):print(dict(r))
    print('resources groups',[tuple(r) for r in db.execute("select group_id,count(*) from resources group by group_id")])
    for r in db.execute("select * from resources where group_id like '%language%' limit 4"):print(dict(r))
    print('owners',i['lease']['owners'])
    db.close()
    db=readonly(BASE/'library-knowledge/connected-research/sections.sqlite3')
    print('adapters',[tuple(r) for r in db.execute('select adapter,disposition,count(*) from research_scope where run_id=? group by adapter,disposition',('kr101-31239794030518bcb2299a31',))])
    for r in db.execute("select descriptor_json from research_scope where run_id=? and (descriptor_json like '%oracc%' or descriptor_json like '%language%') limit 8",('kr101-31239794030518bcb2299a31',)): print(r[0][:7000])
if __name__=='__main__':main()
