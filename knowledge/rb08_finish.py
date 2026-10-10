"""Finish RB08 after its acquisition jobs; recover local writes and report numbers."""
import ctypes,hashlib,msvcrt,re,time
from pathlib import Path
import bulk_collect as b
import run_bulk_mission as runner
from collect_written_archive import parsed,cls
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB08';b.REPORT=R
kernel=ctypes.WinDLL('kernel32',use_last_error=True)
kernel.OpenProcess.argtypes=[ctypes.c_ulong,ctypes.c_bool,ctypes.c_ulong];kernel.OpenProcess.restype=ctypes.c_void_p
kernel.WaitForSingleObject.argtypes=[ctypes.c_void_p,ctypes.c_ulong];kernel.CloseHandle.argtypes=[ctypes.c_void_p]
handles={x['source']:kernel.OpenProcess(0x00100000,False,x['pid']) for x in b.read(R/'worker-pids.json',[])}
try:
 while True:
  active=[s for s,h in handles.items() if b.read(R/(s+'-acquisition.json'),{}).get('state')!='complete' and h and kernel.WaitForSingleObject(h,0)==258]
  if not active:break
  b.save(R/'rerun-progress.json',{'state':'collecting','activeSources':active,'updatedAt':b.now()});time.sleep(10)
finally:
 for handle in handles.values():
  if handle:kernel.CloseHandle(handle)

# Original download succeeded in these cases; recover its already-written provenance, not the URL.
state=b.read(R/'ia-acquisition.json',{});remaining=[];recovered=[]
screen=b.read(R/'ia-filter.json');screen.pop('skipIds',None);b.save(R/'ia-screen.json',screen)
for failure in state.get('failures',[]):
 name=re.sub('[^A-Za-z0-9_.-]','_',failure['sourceId'])+'.txt.json'
 provenance=b.CACHE/'provenance/ia'/name
 record=b.read(provenance)
 if 'acquisition-manifest.json' in failure['error'] and record and Path(record['path']).is_file() and b.matches(record,screen):
  b.append_manifest(record);recovered.append(failure|{'resolvedLocalWrite':True,'originalSaved':True})
 else:remaining.append(failure)
state['failures']=remaining;state['recoveredManifestWrites']=recovered;b.save(R/'ia-acquisition.json',state)
for source in ['aomin','kruger']:
 supplement=b.read(R/(source+'-papers-acquisition.json'),{})
 main=b.read(R/(source+'-acquisition.json'),{})
 main['failures']+=supplement.get('failures',[]);main['offeredPapers']=supplement.get('offeredPapers',0)
 b.save(R/(source+'-acquisition.json'),main)

with (R/'manifest.lock').open('a+b') as lock:
 lock.seek(0);lock.write(b'0');lock.flush();lock.seek(0)
 while True:
  try:msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1);break
  except OSError:time.sleep(.1)
 try:
  manifest=b.read(R/'acquisition-manifest.json')
  for record in manifest['files']:
   if record.get('campaignMission')=='RB08':record.update(privateLocalIndexAuthorized=True,publicHostingAllowed=False,publicFullTextIndexAllowed=False)
   if record.get('campaignMission')=='RB08' and record.get('source') in {'aomin','kruger'} and isinstance(record.get('sourceMetadata'),dict):
    record['sourceMetadata']={k:v for k,v in record['sourceMetadata'].items() if k not in {'content','excerpt','guid'}}
   if record.get('campaignMission')!='RB08' or record.get('source')!='desiringgod' or record['format']!='html' or not record.get('countAsBook',True):continue
   root=parsed(Path(record['path']).read_bytes());nodes=root.xpath('//*['+cls('resource__body')+']')
   if not nodes:continue
   node=nodes[0]
   for discard in node.xpath('.//script|.//style|.//nav|.//form|.//button'):
    discard.drop_tree()
   content=(record['title']+'\nJohn Piper\n\n'+'\n'.join(node.itertext()).strip()).encode('utf-8')
   target=b.SITE/'.local/library/written/desiringgod'/(re.sub('[^A-Za-z0-9_.-]','_',record['sourceId'])+'.txt')
   target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(content)
   record['derivedText']={'path':str(target),'sha256':hashlib.sha256(content).hexdigest(),'bytes':len(content),'format':'txt','title':record['title'],'author':record['author'],'url':record['url'],'licence':record['licence'],'language':'en','audience':record['audience'],'credit':record['credit'],'contributor':record['contributor'],'method':'Full offered resource body extracted from HTML; no OCR'}
  b.save(R/'acquisition-manifest.json',manifest)
 finally:lock.seek(0);msvcrt.locking(lock.fileno(),msvcrt.LK_UNLCK,1)

config=b.read(R/'mission.json')
for source in ['aomin','kruger','desiringgod']:
 b.save(R/(source+'-filter.json'),{'approvedCollection':True,'deferHardDownloads':True,'collection':'Official written author/ministry archive'})
 config['filters'][source]=source+'-filter.json'
config.update(finalizeOnly=True,waitForExisting=False)
config['finalScreens']={'ia':'ia-screen.json'}
config['sourceBlockers']=[{'source':'desiringgod','exitCode':'other-author-permission-required','log':'https://www.desiringgod.org/permissions','reason':'Piper personal/noncommercial permission collected; other authors and staff material require separate permission under the published policy.'},
 {'source':'ia','exitCode':'no-unrestricted-late-Oxford-records','log':'ia-late-oxford-blockers.json','reason':'No unrestricted 1931–1932 Warfield records returned; later Oxford originals remain unavailable on IA.'}]
config['availabilityNotes']=['No unrestricted IA Warfield records returned for 1931–1932; all ten Oxford originals could not be confirmed on IA. Monergism returned 25 held hashes plus one held ID across 27 selected Warfield/Gaussen works; one request failed.','Desiring God collection covers the permitted Piper archive; non-Piper material remains a collection permission gap. Intake publication has been blocked by the pre-existing TCP collector database handle (PID 96980); the completion command waits for that reader.',f'{len(recovered)} local manifest-write errors resolved from saved originals and provenance, without network retry. Written articles/papers/transcripts are originals, not books.']
b.save(R/'mission.json',config)
marker='## RB08 re-run: Scripture authority and apologetics - bulk channels'
sources=b.SITE/'SOURCES.md'
if marker not in sources.read_text(encoding='utf-8'):
 with sources.open('a',encoding='utf-8') as output:
  output.write('\n\n'+marker+'\n\n'+
   '- **TCP:** official TCP metadata and CC0 TEI/XML; Owen’s Divine Original; held IDs/hashes skipped.\n'+
   '- **CCEL:** official offered ThML/XML by screened historical authors; personal/educational source terms and edition credits retained.\n'+
   '- **Internet Archive:** official cursor catalogue, metadata and existing TXT/EPUB; screened historical authors and Princeton periodicals in institutional/microfilm collections, unrestricted editions through 1930; contributor/sponsor notices retained. Later Oxford records checked separately for explicit permission.\n'+
   '- **Gutenberg:** offline catalogue and approved mirror full texts; underlying public-domain works and Gutenberg notices retained.\n'+
   '- **Monergism:** [official offered ebook index](https://www.monergism.com/1100-free-ebooks-listed-alphabetically-author), complete Warfield/Gaussen editions; source notices retained and held hashes skipped.\n'+
   '- **Alpha and Omega Ministries:** [official public WordPress API](https://www.aomin.org/aoblog/wp-json/wp/v2/posts), complete rendered written posts; media/event categories excluded; author IDs and credits retained; private local study only.\n'+
   '- **Michael J. Kruger / Canon Fodder:** [official public WordPress API](https://michaeljkruger.com/wp-json/wp/v2/posts), full offered written posts, author metadata and original notices preserved; private local study only.\n'+
   '- **Desiring God:** [official Piper archive](https://www.desiringgod.org/authors/john-piper) and [permissions](https://www.desiringgod.org/permissions); personal/noncommercial Piper articles, complete written transcripts and offered books; copyrighted notices retained. Other-author/staff permission gap recorded once for the collection.\n')
runner.run(R/'mission.json')
