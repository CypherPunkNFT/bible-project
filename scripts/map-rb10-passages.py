"""Rebuild eighteen deliberately selected literal RB10 Scripture/source connections."""
import json,re,hashlib
from pathlib import Path
SITE=Path(__file__).resolve().parents[1]
R=SITE/'content/library/reports/reformed-baptist-overnight/RB10'
w={x['key']:x for x in json.loads((R/'chapter-map.json').read_text())['works']};cs=json.loads((R/'selected-components.json').read_text())['components']
entries=[]
def add(key,title,pattern,reference,topic,qualification,component=False):
 if component:
  c=next(c for c in cs if c['title']==title);d=c['derivedText'];a=w[key];text=(SITE/d['path']).read_text(encoding='utf-8');start=0;end=len(text);locator=c['sourceLocator'];author=c['author']
 else:
  a=w[key];d=a['derivative'];text=(SITE/d['path']).read_text(encoding='utf-8');u=next(u for u in a['locations'] if u['title']==title);ls=text.splitlines(keepends=True);start=sum(len(s) for s in ls[:u['lineStart']-1]);end=sum(len(s) for s in ls[:u['lineEnd']]);locator=u['locator'];author=a['author']
 m=re.search(pattern,text[start:end],re.I);assert m,(key,title,pattern)
 entries.append(dict(topic=topic,passage=reference,sourceCitation=m.group(),assetId=a['assetId'],originalSha256=a['originalSha256'],author=author,title=title,locator=locator,derivative=d,normalizedTextCharacterStart=start+m.start(),normalizedTextCharacterEnd=start+m.end(),sourceRegex=pattern,coverageKind='Explicit citation within a selected contextual section, not complete verse-by-verse exposition',qualification=qualification,semanticInference=False))
S=r'\s*'
for ref,pat,topic in [('Romans 12:2',r'Romans\s+12:2','conscience-formation'),('Romans 2:15',r'Rom\.\s*2:15','conscience-accountability'),('Hebrews 3:13',r'Heb\.\s*3:13','conscience-fellowship')]:
 a=w['bingham-conscience'];add('bingham-conscience',a['title'],pat,ref,topic,'Complete authored essay; formation is subordinate to Scripture.')
for ref,pat in [('Romans 8:1',r'Romans\s+8:1'),('Matthew 11:30',r'Matt\.\s*11:30')]:
 add('lawrence-scrupulous',w['lawrence-scrupulous']['title'],pat,ref,'scrupulous-conscience','Gospel/pastoral reasoning, not a clinical diagnosis.')
for ref,pat in [('Romans 14:1',r'Romans\s+14:1'),('Romans 14:5',r'Romans\s+14:5'),('1 Peter 5:2',r'1\s*Pet\.\s*5:2')]:
 add('reju-conscience',w['reju-conscience']['title'],pat,ref,'conscience-freedom','Case reasoning does not impose a school policy.')
add('fgb-conscience','The Duties of Conscience',r'Rom\s+2:15','Romans 2:15','conscience-testimony','Perkins excerpt with compiler apparatus, not a newly acquired whole book.',True)
add('fgb-conscience','A Good Conscience',r'Heb\s+9:14','Hebrews 9:14','gospel-and-conscience','Pink contextual article; modern compilation rights retained.',True)
add('fgb-forgiveness','What Is Forgiveness?',r'Ephesians\s+4:32','Ephesians 4:32','forgiveness','Adams argument retains his promise conception; other contributors are compared separately.',True)
add('fgb-forgiveness','Conditional or Unconditional Forgiveness?',r'Luke\s+17:3','Luke 17:3','forgiveness-and-repentance','MacArthur distinction is attributed; not a synthesized project reconciliation rule.',True)
add('fgb-forgiveness','Divine Forgiveness Admired and Imitated',r'Colossians\s+3:13','Colossians 3:13','forgiveness-and-imitation','Spurgeon contextual sermon selection, not evidence every interpersonal case is identical.',True)
add('fgb-good-works','Works, Grace, and Salvation',r'Ephesians\s+2:8-10','Ephesians 2:8-10','grace-and-good-works','Lloyd-Jones contextual passage treatment distinguishes grace from merit.',True)
add('fgb-good-works','Zealous of Good Works',r'Titus\s+2:14','Titus 2:14','good-works','Manton contextual exposition retains historical applications and compiler notes.',True)
add('fgb-good-works','The Best Way to Provoke Good Works',r'Heb\s+10:24','Hebrews 10:24','encouraging-good-works','Bunyan excerpt does not establish acquisition of the entire underlying work.',True)
add('poythress-lordship','Work',r'Col\.\s*3:23','Colossians 3:23','work','Printed chapter 16 is contextual vocation reasoning, not a full Colossians commentary.')
add('poythress-lordship','Traps in Norms',r'2\s*Timothy\s+3:16[–-]17','2 Timothy 3:16-17','scripture-and-ethics','Printed chapter 18 subordinates ethical norms to Scripture; Presbyterian source context retained.')
(R/'passage-evidence.json').write_text(json.dumps(dict(mission='RB10',entries=entries,qualification='Eighteen deliberately selected literal source citations in new ethical witnesses. No automated verse coverage or DB/graph admission inferred.'),ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
rows=['# RB10: Scripture grounds visible in the new witnesses','','Eighteen selected explicit citations support the work-specific ethics review. These are qualified reading connections rather than claims of complete verse commentary. [Exact source/derivative hashes and normalized-text character positions](passage-evidence.json) reproduce each observation; character positions use Python universal-newline text, while the derivative SHA verifies original on-disk bytes.','','| Topic / passage | Actual author and source section | Qualification |','|---|---|---|']
for e in entries:rows.append('| '+e['topic']+' / '+e['passage']+' | '+e['author']+' - '+e['title']+' (`'+e['locator']+'`) | '+e['qualification']+' |')
rows+=['','All entries remain evidence-only under parent/component rights and contributor holds. Whole-issue notes and full works must be consulted for context; a literal citation is not by itself theological agreement. [Ethical question table](READING-MAP.md), [scope](THEOLOGICAL-SCOPE.md), [intake](INTAKE-NOTES.md).']
(R/'SCRIPTURE-GROUNDS.md').write_text('\n'.join(rows)+'\n',encoding='utf-8',newline='\n')
print('PASSAGE EVIDENCE',len(entries),'exact literal citation witnesses')
