"""L03 bibliography-first acquisition. Uses public IA API and immutable raw files."""
import argparse
import importlib.util
import json
import urllib.parse
from bible.paths import SITE

spec=importlib.util.spec_from_file_location('acquire',SITE/'scripts/collect-puritan-sermons.py')
acquire=importlib.util.module_from_spec(spec); spec.loader.exec_module(acquire)
acquire.ASSET_PREFIX='asset-l03-'
acquire.LOCAL=SITE/'.local/library/run-l03-historic-preaching-2026-10-05'
REPORT=SITE/'content/library/reports/historic-preaching'

def search():
 queries={
  'edwards':'creator:(Edwards, Jonathan) AND title:(works) AND year:[1830 TO 1845]',
  'whitefield':'creator:(Whitefield, George) AND (title:(works) OR title:(sermons)) AND year:[1771 TO 1830]',
  'newton':'creator:(Newton, John) AND (title:(works) OR title:(Messiah)) AND year:[1786 TO 1830]',
  'ryle':'creator:(Ryle) AND (title:(Christian race) OR title:(sermons)) AND year:[1850 TO 1910]',
 }
 for author,q in queries.items():
  url='https://archive.org/advancedsearch.php?'+urllib.parse.urlencode({'q':q,'output':'json','rows':100,'fl[]':'identifier,title,date,volume,creator'})
  p=acquire.fetch(url,acquire.LOCAL/'bibliography',author+'-search.json')
  data=json.loads(p.read_text(encoding='utf-8'))
  print(json.dumps(dict(author=author,**data['response'])),flush=True)

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('mode',choices=['search','metadata','download']);p.add_argument('items',nargs='*');a=p.parse_args()
 if a.mode=='search':search()
 elif a.mode=='metadata':
  for item in a.items:
   d=acquire.metadata(item);print(json.dumps(dict(item=item,metadata=d['metadata'],files=[(f['name'],f.get('size')) for f in d['files'] if f['name'].endswith(('.pdf','_djvu.txt','_scandata.xml'))])),flush=True)
 else:
  bibliography=json.loads((REPORT/'bibliography.json').read_text(encoding='utf-8'))
  allowed={v['item'] for a in bibliography['authors'] for v in a['selectedVolumes']}
  for item in a.items:
   if item not in allowed:raise ValueError('Establish selected bibliography before acquisition: '+item)
   acquire.download(item)
