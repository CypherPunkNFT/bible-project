import json
from .inspect_inputs import OUT,BASE
from ..build import readonly
def main():
 i=json.loads((OUT/'inspection.json').read_text(encoding='utf-8'))
 print('ALIGNMENT SCHEMA', '\n'.join(i['alignment']['schema'][7:]))
 db=readonly(BASE/'Research Foundation/registry.sqlite3')
 print('KINDS',[tuple(r) for r in db.execute("select namespace,kind,count(*) from entities where namespace not like 'library:%' group by namespace,kind")])
 print('RELATIONS',[tuple(r) for r in db.execute('select relation,count(*) from relations group by relation')])
 for ns in ['historians','archaeology','scholars-find']:
  for r in db.execute('select * from entities where namespace=? limit 1',(ns,)):print(dict(r))
 db.close()
 db=readonly(BASE/'library-knowledge/connected-research/sections.sqlite3')
 print('HISTORY SUPPORTED', [tuple(r) for r in db.execute("select json_extract(descriptor_json,'$.source_family'),count(*) from research_scope where run_id=? and disposition='supported' group by 1",('kr101-31239794030518bcb2299a31',))])
 for r in db.execute("select descriptor_json from research_scope where run_id=? and disposition='supported' and (descriptor_json like '%Assyrian%' or descriptor_json like '%oracc%') limit 2",('kr101-31239794030518bcb2299a31',)):print(r[0])
 for r in db.execute("select descriptor_json from research_scope where run_id=? and adapter='xml-entry' limit 1",('kr101-31239794030518bcb2299a31',)):print('XML',r[0])
if __name__=='__main__':main()
