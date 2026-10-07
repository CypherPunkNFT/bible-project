"""Literal Scripture citations in reviewed RB11 sections; no semantic inference."""
import hashlib,json,re
from pathlib import Path
SITE=Path(__file__).resolve().parents[1];R=SITE/'content/library/reports/reformed-baptist-overnight/RB11'
def main():
    works={w['key']:w for w in json.loads((R/'chapter-map.json').read_text('utf-8'))['works']};entries=[]
    selected=[
      ('chbc-prayer1',None,'Hebrews 4:14-16',r'Hebrews\s+4:14-16','approaching-God-through-Christ'),
      ('chbc-prayer1',None,'Romans 8:26-27',r'Romans\s+8:26-27','Spirit-and-prayer'),
      ('chbc-prayer1',None,'Galatians 4:6',r'Galatians\s+4:6','adoption-and-prayer'),
      ('chbc-prayer1',None,'Psalm 51:1-4',r'Psalm\s+51:1-4','confession'),
      ('chbc-prayer2',None,'John 15:7-8',r'John\s+15:7-8','word-shaped-petitions'),
      ('chbc-prayer2',None,'Ephesians 6:18',r'Ephesians\s+6:18','persevering-prayer'),
      ('chbc-prayer2',None,'Psalm 119:18',r'Psalm\s+119:18','praying-for-understanding'),
      ('chbc-prayer2',None,'Psalm 86:11',r'Psalm\s+86:11','undivided-heart'),
      ('dever-corporate',None,'John 13:34-35',r'John\s+13:34[–-]35','congregational-love'),
      ('hamilton-corporate',None,'Matthew 6:9-13',r'Matt\.\s*6:9[–-]13','our-Father-and-shared-petitions'),
      ('hamilton-corporate',None,'Acts 2:42',r'Acts\s+2:42','church-devoted-to-prayer'),
      ('hamilton-corporate',None,'Acts 4:24-30',r'Acts\s+4:24[–-]30','corporate-biblical-theology'),
      ('hamilton-corporate',None,'1 Timothy 2:1-2',r'1\s*Tim\.\s*2:1[–-]2','prayer-for-authorities'),
      ('mathis-habits','Chapter 7','Hebrews 7:25',r'Heb\.\s*7:25','Christ-interceding'),
      ('mathis-habits','Chapter 8','Matthew 6:5',r'Matthew\s+6:5','secret-prayer'),
      ('mathis-habits','Chapter 9','Acts 1:14',r'Acts\s+1:14','company-in-prayer'),
      ('mathis-habits','Chapter 14','Hebrews 12:22',r'Heb\.\s*12:22','gathered-worship')]
    for key,chapter,ref,pattern,topic in selected:
        w=works[key];text=(SITE/w['derivative']['path']).read_text('utf-8');start=0;end=len(text);u=w['locations'][0]
        if chapter:
            u=next(u for u in w['locations'] if u['title'].startswith(chapter+' '));marker='EPUB MEMBER: '+u['member']+'\n';start=text.index(marker)+len(marker);end=text.find('\n\nEPUB MEMBER:',start);end=len(text) if end<0 else end
        m=re.search(pattern,text[start:end],re.I);assert m,(key,ref)
        entries.append(dict(topic=topic,passage=ref,sourceCitation=m.group(),assetId=w['assetId'],originalSha256=w['originalSha256'],author=w['author'],title=u['title'],locator=u['locator'],derivative=w['derivative'],normalizedTextCharacterStart=start+m.start(),normalizedTextCharacterEnd=start+m.end(),sourceRegex=pattern,semanticInference=False,coverageKind='Explicit contextual citation, not full passage commentary',qualification='Retain the author’s contextual argument and source-specific worship/doctrine scope; citation alone is not project agreement.'))
    (R/'passage-evidence.json').write_text(json.dumps(dict(mission='RB11',entries=entries),ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    rows=['# RB11: Scripture grounds in the new witnesses','','Seventeen deliberately selected explicit citations retain exact source locators and normalized-text character positions in [passage-evidence.json](passage-evidence.json). Derivative hashes verify raw stored bytes; character positions use Python universal newlines. A citation does not establish exhaustive exposition or author-wide agreement.','','| Topic / passage | Author / source section |','|---|---|']
    rows+=['| '+e['topic']+' / '+e['passage']+' | '+e['author']+' — '+e['title']+' (`'+e['locator']+'`) |' for e in entries]
    (R/'SCRIPTURE-GROUNDS.md').write_text('\n'.join(rows)+'\n',encoding='utf-8',newline='\n');print('SCRIPTURE GROUNDS',len(entries),'literal citations')
if __name__=='__main__':main()
