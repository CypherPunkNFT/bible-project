"""Move surname collisions and media announcements outside this intake."""
import msvcrt,re,shutil,time
from pathlib import Path
import bulk_collect as b
R=b.SITE/'content/library/reports/reformed-baptist-overnight/RB08'
f=b.read(R/'ia-filter.json');archive=(b.ROOT/'ARCHIVE/RB08-excluded').resolve()
archive.mkdir(parents=True,exist_ok=True)
with (R/'manifest.lock').open('a+b') as lock:
 lock.seek(0);lock.write(b'0');lock.flush();lock.seek(0)
 while True:
  try:msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1);break
  except OSError:time.sleep(.1)
 try:
  m=b.read(R/'acquisition-manifest.json');excluded=0
  for x in m['files']:
   if x.get('campaignMission')!='RB08' or not x.get('countAsBook',True):continue
   reason=''
   if x['source']=='ia' and not b.matches(x,f):reason='Outside approved author or institutional collection list'
   if x['source']=='aomin' and {14,1759,219,1913,1854,1856,1940}.intersection(x.get('sourceMetadata',{}).get('categories',[])):reason='Media programme or event category; not a written work'
   if not reason:continue
   original=Path(x['path']).resolve();target=(archive/original.name).resolve()
   if not original.is_relative_to(b.RAW.resolve()) or not target.is_relative_to(archive):raise ValueError('Unsafe exclusion path')
   if original.exists():shutil.move(original,target)
   x.update(path=str(target),countAsBook=False,disposition='excluded-from-mission',reason=reason);excluded+=1
  b.save(R/'acquisition-manifest.json',m);print('Excluded from library intake',excluded)
 finally:lock.seek(0);msvcrt.locking(lock.fileno(),msvcrt.LK_UNLCK,1)
