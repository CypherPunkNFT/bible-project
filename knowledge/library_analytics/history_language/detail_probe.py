from .inspect_inputs import BASE
from ..build import readonly
from pathlib import Path
import json
def main():
 db=readonly(BASE/'Research Foundation/registry.sqlite3')
 for pattern in ['%Repaired Source Records%.html','%corpusjson%.json']:
  rows=db.execute('select path from resources where group_id=? and path like ? order by path',('history:02-assyrian-archives',pattern)).fetchall()
  print('COUNT',pattern,len(rows))
  for r in rows[:1]:print('PATH',r[0]);print(Path(r[0]).read_text(encoding='utf-8-sig')[:15000])
 for name in ['HebrewStrong.xml','BrownDriverBriggs.xml','LexicalIndex.xml']:
  p=next((BASE.parent/'sources/openscriptures').rglob(name));print(name,p.read_text(encoding='utf-8-sig')[:4500])
if __name__=='__main__':main()
