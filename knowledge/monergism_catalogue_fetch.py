"""Cache the official free catalogue, bulk-channel page and source terms once."""
import re
import bulk_collect as b
c=b.Client(attempts=1,timeout=20)
for name,url in [
 ('monergism-bulk.html','https://www.monergism.com/blog/download-entire-monergism-ebook-library-1063-ebooks'),
 ('monergism-index.html','https://www.monergism.com/1100-free-ebooks-listed-alphabetically-author'),
 ('monergism-terms.html','https://www.monergism.com/monergism-copyright-permissions')]:
 try:
  body=c.cached(name,url).decode('utf-8','replace')
  print(name,len(body),flush=True)
  if 'bulk' in name:
   print('\n'.join(re.findall(r'.{0,100}(?:\.zip|Download latest|original zip).{0,150}',body,re.I)),flush=True)
  elif 'index' in name:
   match=re.search(r'.{0,200}John Owen.{0,600}',body,re.S)
   print(match[0] if match else 'No John Owen literal',flush=True)
  else:
   text=re.sub('<[^>]+>',' ',body)
   print('\n'.join(re.findall(r'.{0,100}(?:personal use|copyright|redistribut|download).{0,180}',text,re.I)[-18:]),flush=True)
 except Exception as e:print(name,'FAILED',str(e),flush=True)
