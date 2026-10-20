"""Extract only the factual name/date columns from the held eight-page handout."""
from pathlib import Path
import hashlib,json,re
import pymupdf

site=Path(__file__).resolve().parent.parent
data=site.parent/'Data'/'TheologicalReferenceLibrary'
source='Scholar-Lists/carolina-100-philosophers-and-theologians.pdf'
doc=pymupdf.open(data/source)
records=[]
for page_number,page in enumerate(doc,1):
 words=page.get_text('words')
 starts=sorted([w for w in words if 70<w[0]<95 and re.fullmatch(r'\d{1,3}\.',w[4])],key=lambda w:w[1])
 for i,start in enumerate(starts):
  top=start[1]-1;bottom=starts[i+1][1]-1 if i+1<len(starts) else page.rect.height
  row=sorted([w for w in words if top<=w[1]<bottom],key=lambda w:(round(w[1],1),w[0]))
  name=' '.join(w[4] for w in row if 96<=w[0]<208)
  dates=' '.join(w[4] for w in row if 210<=w[0]<264).replace('- ','-')
  records.append({'number':int(start[4][:-1]),'name':name,'dates':dates,'pdfPage':page_number})
if [r['number'] for r in records]!=list(range(1,101)) or any(not r['name'] or not r['dates'] for r in records):
 raise RuntimeError('Could not verify all 100 name/date rows')
source_url='https://my.carolinau.edu/ICS/Portlets/ICS/Portlet.Resources/ViewHandler.ashx?id=59d10c3d-2ff8-4ca1-836a-cb8a56041a1d'
text='100 PHILOSOPHERS AND THEOLOGIANS\n\nSource: Carolina University course handout, credited to Prof. Moore.\n'+source_url+'\n\nNames and dates extracted from the saved handout. The list includes Christian and non-Christian thinkers. Original spellings and dates are retained as recorded; the list is not a ranking of 100 Christian scholars. PDF page numbers identify the source locations.\n\n'
text+='\n'.join(f"{r['number']}. {r['name']} — {r['dates']} [PDF page {r['pdfPage']}]" for r in records)+'\n'
out=data/'Derived'/'Scholar-Lists';out.mkdir(parents=True,exist_ok=True)
filename='carolina-philosophers-theologians.txt';(out/filename).write_text(text,encoding='utf-8')
metadata={'sourceFile':source,'sourceSha256':hashlib.sha256((data/source).read_bytes()).hexdigest(),'textFilename':filename,'textBytes':len(text.encode()),'textSha256':hashlib.sha256(text.encode()).hexdigest(),'entries':records,'textLabel':'Names and dates extracted from saved PDF','subtitle':'100 names and dates','quality':'All 100 numbered name/date rows extracted from the held PDF. Source spellings and dates are retained, with page locators. These are not all Christian scholars.'}
(out/'carolina-philosophers-theologians.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'entries':len(records),'pages':len(doc),'bytes':metadata['textBytes'],'first':records[0],'last':records[-1]},ensure_ascii=False))
