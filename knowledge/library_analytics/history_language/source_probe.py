import json
from .inspect_inputs import BASE
from ..build import readonly
def main():
 db=readonly(BASE/'Research Foundation/registry.sqlite3')
 for group in ['history:02-assyrian-archives','history:12-biblical-language-data']:
  rows=db.execute("select path,record from resources where group_id=? and path like '%.json' limit 2",(group,)).fetchall()
  for r in rows:
   print('RESOURCE',r['record'][:6000]);print('CONTENTS',open(r['path'],encoding='utf-8-sig').read()[:11000])
 db.close()
 db=readonly(BASE/'library-knowledge/connected-research/sections.sqlite3')
 for r in db.execute("select descriptor_json from research_scope where run_id=? and adapter='xml-entry' and descriptor_json like '%openscriptures%' limit 1",('kr101-31239794030518bcb2299a31',)):
  d=json.loads(r[0]);print('LEXICON DESCRIPTOR',r[0]);print('XML',open(d['source_path'],encoding='utf-8-sig').read()[:16000])
if __name__=='__main__':main()
