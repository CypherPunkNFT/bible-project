"""Private library bulk collectors. Run from Website: python knowledge/bulk_collect.py --help."""
import argparse, configparser, csv, hashlib, html, io, json, re, sqlite3, statistics
import tarfile, time, urllib.error, urllib.parse, urllib.request, urllib.robotparser, zipfile, msvcrt, subprocess, os, struct, zlib
import threading
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from pathlib import Path
from datetime import datetime, timezone
from contextlib import closing

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
CACHE = ROOT / 'sources/bulk-catalogues'
REPORT = SITE / 'content/library/reports/reformed-baptist-overnight/RB00'
RAW = ROOT / 'sources/library/bulk'
UA = 'BibleProjectPrivateLibrary/1.0 (polite local research collector)'
SOURCES = ['tcp', 'sword', 'ccel', 'ia', 'gutenberg', 'monergism', 'chapel', 'founders', 'desiringgod', 'foundersjournal']
SWORD_AUTHORS = {'BaptistConfession1646':'Particular Baptist churches of London; Benjamin Cox',
    'BaptistConfession1689':'Particular Baptist churches of London', 'Institutes':'John Calvin',
    'CalvinCommentaries':'John Calvin', 'JCRHoliness':'J. C. Ryle', 'JEAffections':'Jonathan Edwards',
    'JESermons':'Jonathan Edwards', 'JOChrist':'John Owen', 'JOCommGod':'John Owen',
    'JOGlory':'John Owen', 'JOMortSin':'John Owen', 'Barnes':'Albert Barnes', 'Burkitt':'William Burkitt',
    'Clarke':'Adam Clarke', 'MHCC':'Matthew Henry', 'MHC':'Matthew Henry and continuators',
    'Lightfoot':'John Lightfoot', 'Luther':'Martin Luther', 'JFB':'Robert Jamieson; A. R. Fausset; David Brown',
    'KD':'C. F. Keil; Franz Delitzsch'}
SWORD_AUTHORS.update({'Abbott':'John S. C. Abbott; Jacob Abbott','DTN':'John Nelson Darby',
    'DutKant':'Dutch States Bible translators and annotators','DutKingComments':'Ger de Koning',
    'GerKingComments':'Ger de Koning','KingComments':'Ger de Koning','PorKingComments':'Ger de Koning',
    'Family':'Family Bible Notes contributors; Nazarene Users Group electronic edition',
    'FreCJE':'Jean Koechlin; Bibles et Publications Chretiennes',
    'Geneva':'Geneva Bible translators and annotators','PNT':'Barton Warren Johnson',
    'Rieger':'Carl Heinrich Rieger','RWP':'A. T. Robertson','Scofield':'C. I. Scofield',
    'TDavid':'Charles Haddon Spurgeon','TFG':'J. W. McGarvey; Philip Y. Pendleton',
    'TSK':'Treasury of Scripture Knowledge contributors','Wesley':'John Wesley'})
SWORD_AUTHORS.update({'AbbottSmith':'George Abbott-Smith','AbbottSmithStrongs':'George Abbott-Smith',
    'AmTract':'American Tract Society; William W. Rand (editor)','CBC':'Ashley S. Johnson',
    'Dodson':'Jonathan Dodson','Easton':'Matthew George Easton','FreGBM':'David Martin',
    'GreekHebrew':'Pierre Leblanc','HebrewGreek':'Pierre Leblanc','Hitchcock':'Roswell D. Hitchcock',
    'Josephus':'Flavius Josephus','MLStrong':'Henry George Liddell; Robert Scott',
    'Nave':'Orville J. Nave','OSHM':'Open Scriptures contributors','Packard':'David Packard',
    'FrePackard':'David Packard; French edition contributors','Robinson':'Maurice A. Robinson',
    'FreRobinson':'Maurice A. Robinson; French edition contributors',
    'VieRobinson':'Maurice A. Robinson; Vietnamese edition contributors',
    'SAOA':'Harriet N. Cook','Smith':'William Smith','Swe1917Of':'Swedish 1917 Bible translation contributors',
    'TCR':'Frank Charles Thompson','Torrey':'R. A. Torrey','Webster1828':'Noah Webster'})
SWORD_AUTHORS.update({name:'James Strong; module edition contributors' for name in
    ['StrongsGreek','StrongsHebrew','ChisStrongsGreek','ChisStrongsHebrew','ChitStrongsGreek',
     'ChitStrongsHebrew','FreStrongsGreek','FreStrongsHebrew','GerStrongsGreek','VieStrongsGreek']})

def now(): return datetime.now(timezone.utc).isoformat()
def save(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name+f'.{os.getpid()}.tmp')
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')
    # A concurrent intake reader or antivirus can briefly prevent Windows rename.
    # This retries only the local atomic write, never a network download.
    for attempt in range(25):
        try:tmp.replace(path);break
        except PermissionError:
            if attempt==24:raise
            time.sleep(.2)
def read(path, default=None):
    return json.loads(path.read_text('utf-8-sig')) if path.exists() else default

def append_manifest(record, update=False):
    lockpath = REPORT/'manifest.lock'
    with lockpath.open('a+b') as lock:
        lock.seek(0); lock.write(b'0'); lock.flush(); lock.seek(0)
        while True:
            try: msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1); break
            except OSError: time.sleep(.1)
        try:
            path = REPORT/'acquisition-manifest.json'
            manifest = read(path, {'mission':REPORT.name,'createdAt':now(),'files':[]})
            existing=next((x for x in manifest['files'] if x['sha256']==record['sha256']),None)
            if existing is None: manifest['files'].append(record)
            elif update: existing.update(record)
            save(path,manifest)
        finally:
            lock.seek(0); msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)

class Client:
    def __init__(self, attempts=3, timeout=120):
        self.robots, self.last, self.not_before = {}, {}, {}
        self.attempts, self.timeout = attempts, timeout
        self.concurrent=False
        self.rules_lock=threading.Lock()
        self.rate_lock=threading.Lock()
    def get(self, url, catalogue=False):
        with self.rules_lock:
            self.prepare(url)
        return self.request(url,catalogue)
    def prepare(self,url):
        parts = urllib.parse.urlsplit(url); host = parts.netloc
        if host not in self.robots:
            roboturl = f'{parts.scheme}://{host}/robots.txt'
            rp = urllib.robotparser.RobotFileParser()
            try:
                req = urllib.request.Request(roboturl, headers={'User-Agent': UA})
                body = urllib.request.urlopen(req, timeout=min(90,self.timeout)).read()
                rp.parse(body.decode('utf-8', 'replace').splitlines())
                CACHE.mkdir(parents=True, exist_ok=True)
                (CACHE / (host + '-robots.txt')).write_bytes(body)
            except urllib.error.HTTPError as e:
                if e.code != 404: raise
                rp.parse(['User-agent: *', 'Disallow:'])
            self.robots[host] = rp
            self.last[host] = time.monotonic()
    def request(self,url,catalogue=False):
        parts=urllib.parse.urlsplit(url);host=parts.netloc
        rp = self.robots[host]
        # Gutenberg explicitly permits its offline feeds; books only use a mirror.
        feed = host == 'www.gutenberg.org' and parts.path.startswith('/cache/epub/feeds/')
        if not feed and not rp.can_fetch(UA, url): raise RuntimeError('robots.txt disallows ' + url)
        delay = max(2, rp.crawl_delay(UA) or rp.crawl_delay('*') or 0)
        for attempt in range(self.attempts):
            with self.rate_lock:
                while True:
                    pause=max(0,delay-(time.monotonic()-self.last.get(host,0)),self.not_before.get(host,0)-time.monotonic())
                    if pause<=0:break
                    time.sleep(pause)
                self.last[host]=time.monotonic()
            try:
                req = urllib.request.Request(url, headers={'User-Agent': UA})
                class NoRedirect(urllib.request.HTTPRedirectHandler):
                    def redirect_request(self, req, fp, code, msg, headers, newurl): return None
                with urllib.request.build_opener(NoRedirect).open(req, timeout=self.timeout) as response:
                    final = response.url
                    if urllib.parse.urlsplit(final).netloc != host:
                        raise RuntimeError('Cross-host redirect requires explicit endpoint: ' + final)
                    data = response.read()
                    return data, final, dict(response.headers)
            except urllib.error.HTTPError as e:
                if e.code in (429,503):
                    retry_after=e.headers.get('Retry-After','30')
                    try: seconds=int(retry_after)
                    except ValueError:
                        from email.utils import parsedate_to_datetime
                        try: seconds=max(0,(parsedate_to_datetime(retry_after)-datetime.now(timezone.utc)).total_seconds())
                        except (ValueError,TypeError): seconds=30
                    self.not_before[host]=time.monotonic()+max(30,seconds)
                if e.code in (301,302,303,307,308):
                    target = urllib.parse.urljoin(url,e.headers['Location'])
                    targethost = urllib.parse.urlsplit(target).netloc
                    same_monergism = host in {'monergism.com','www.monergism.com'} and targethost in {'monergism.com','www.monergism.com'}
                    same_desiringgod = (host=='desiringgod.org' or host.endswith('.desiringgod.org')) and (targethost=='desiringgod.org' or targethost.endswith('.desiringgod.org'))
                    owner_roots=['michaeljkruger.com','thegospelcoalition.org','rts.edu','crossway.org','ligonier.org','aomin.org','reformation21.org','risenmotherhood.com']
                    same_owner=any((host==root or host.endswith('.'+root)) and (targethost==root or targethost.endswith('.'+root)) for root in owner_roots)
                    if targethost != host and not same_monergism and not same_desiringgod and not same_owner and not (host.endswith('archive.org') and targethost.endswith('.archive.org')):
                        raise RuntimeError('Unapproved cross-host redirect '+target)
                    return self.get(target,catalogue)
                if e.code not in (429, 500, 502, 503, 504) or attempt == self.attempts-1: raise
                time.sleep(max(30, int(e.headers.get('Retry-After', '30'))))
            except urllib.error.URLError:
                if attempt == self.attempts-1: raise
                time.sleep(10*(attempt+1))
            finally:
                if not self.concurrent:self.last[host] = time.monotonic()
        raise RuntimeError('request failed')
    def cached(self, name, url):
        path = CACHE / name
        if not path.exists():
            body, final, headers = self.get(url, True)
            path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(body)
            save(path.with_suffix(path.suffix + '.provenance.json'), {'url': url, 'finalUrl': final,
                 'sha256': hashlib.sha256(body).hexdigest(), 'bytes': len(body), 'acquiredAt': now(),
                 'title':name,'author':urllib.parse.urlsplit(url).netloc,'format':path.suffix.lstrip('.'),
                 'licence':'Provider catalogue/API/utility terms; preserved notices in original',
                 'audience':'research collectors','language':'en','path':str(path),'kind':'catalogueOrUtility'})
        return path.read_bytes()

def row(source, id, title, author='', subjects='', language='', **extra):
    return dict(source=source, sourceId=str(id), title=title, author=author, subjects=subjects,
                language=language, audience='pastors; scholars; adult readers', **extra)

def catalogue(source, client, filters=None):
    if source == 'foundersjournal':
        from bulk_journals import catalogue as journal_catalogue
        return journal_catalogue(source,client,filters or {})
    if (filters or {}).get('cataloguePath'):
        path=Path(filters['cataloguePath']).resolve()
        if not path.is_relative_to(CACHE.resolve()):raise ValueError('Local catalogue must stay within catalogue cache')
        return read(path)
    if source in {'founders','desiringgod'}:
        from bulk_ministry import catalogue as ministry_catalogue
        return ministry_catalogue(source,client,filters or {})
    query_override=(filters or {}).get('iaQuery') if source=='ia' else None
    query_key=hashlib.sha256(query_override.encode()).hexdigest()[:12] if query_override else None
    normalized = CACHE / (source + ('-'+query_key if query_key else '') + '.json')
    if normalized.exists(): return read(normalized)
    items = []
    if source == 'chapel':
        sitemap=client.cached('chapel-sitemap.xml','https://www.chapellibrary.org/sitemap.xml').decode('utf-8')
        urls=[html.unescape(u) for u in re.findall(r'<loc>(.*?)</loc>',sitemap)]
        pages={u.split('/')[4]:u for u in urls if '/book/' in u}
        offered={}
        for u in urls:
            if '/api/books/download?' not in u:continue
            q=urllib.parse.parse_qs(urllib.parse.urlsplit(u).query)
            code=q.get('code',[''])[0];fmt=q.get('format',[''])[0]
            if code and fmt in {'epub','pdf'}:offered.setdefault(code,{})[fmt]=u
        for code,formats in offered.items():
            landing=pages.get(code,'');slug=landing.rsplit('/',1)[-1] if landing else code
            if re.search(r'catalogue|catalog-|worksheet|order-form|instructions-for|answer-sheet',slug,re.I):continue
            fmt='epub' if 'epub' in formats else 'pdf'
            items.append(row(source,code,slug.replace('-',' '),'Chapel Library contributors','Christian life; prayer; pastoral care','',
                url=formats[fmt],format=fmt,landingPage=landing,offeredFormats=formats,
                licence='Publisher freely offered electronic edition for personal use; source notices retained',
                contributor='Chapel Library / Mount Zion Bible Church',policyUrl='https://www.chapellibrary.org/literature'))
    elif source == 'tcp':
        body = client.cached('TCP.csv', 'https://raw.githubusercontent.com/textcreationpartnership/Texts/master/TCP.csv')
        for x in csv.DictReader(io.StringIO(body.decode('utf-8-sig'))):
            id = x['TCP']; collection = 'Evans' if id.startswith('N') else 'ECCO' if id.startswith('K') else 'EEBO'
            items.append(row(source, id, x['Title'], x['Author'], x['Terms'], '', collection=collection,
                status=x['Status'], pages=x.get('Pages'), url=f'https://raw.githubusercontent.com/textcreationpartnership/{id}/master/{id}.xml',
                licence='CC0 1.0 (TCP encoded text only)', format='xml'))
    elif source == 'sword':
        body = client.cached('mods.d.tar.gz', 'https://www.crosswire.org/ftpmirror/pub/sword/raw/mods.d.tar.gz')
        with tarfile.open(fileobj=io.BytesIO(body), mode='r:gz') as archive:
            for member in archive:
                if not member.isfile() or not member.name.endswith('.conf'): continue
                text = archive.extractfile(member).read().decode('utf-8-sig', 'replace')
                id = re.search(r'^\[([^]]+)\]', text, re.M)
                if not id: continue
                conf = {}
                for key, val in re.findall(r'^([^=\r\n]+)=(.*)$', text, re.M): conf.setdefault(key.strip(), []).append(val.strip())
                val = lambda k: '; '.join(conf.get(k, []))
                items.append(row(source, id[1], val('Description'), SWORD_AUTHORS.get(id[1]) or val('Author') or val('TextSource'), val('Category'), val('Lang'),
                    url=f'https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/{id[1]}.zip',
                    licence=val('DistributionLicense'), format='zip', size=int(conf.get('InstallSize',['0'])[0]),
                    sizeBasis='installed bytes (conservative package estimate)', configuration=conf))
    elif source == 'ccel':
        body = client.cached('ccel-author.html', 'https://ccel.org/index/author').decode('utf-8')
        authors = {}
        for id, name in re.findall(r'title="View works by ([^"]+)"[^>]*>\s*([^<]+)', body):
            pass
        for match in re.finditer(r'<h5 class="browse_author_name">(.*?)</h5>(.*?)(?=<h5 class="browse_author_name">|$)', body, re.S):
            header, books = match.groups()
            author = html.unescape(re.sub('<[^>]+>', '', header)).strip()
            for url, title in re.findall(r'<a\s+href=\s*"(https://ccel.org/ccel/[^"?]+/[^"?]+)"[^>]*>(.*?)</a>', books, re.S):
                bits = urllib.parse.urlsplit(url).path.strip('/').split('/')
                if len(bits) != 3: continue
                id = '/'.join(bits[1:]); title = html.unescape(re.sub('<[^>]+>', '', title)).strip()
                items.append(row(source, id, title, author, '', 'en', url=url+'.xml', format='xml',
                    licence='CCEL personal/educational/non-profit use; electronic edition credit retained',
                    contributor='Christian Classics Ethereal Library', policyUrl='https://ccel.org/about/copyright.html'))
    elif source == 'monergism':
        index_url='https://www.monergism.com/1100-free-ebooks-listed-alphabetically-author'
        body=client.cached('monergism-index.html',index_url).decode('utf-8','replace')
        for block in re.split(r'<br\s*/?>',body,flags=re.I):
            links=list(re.finditer(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',block,re.S|re.I))
            for match in links:
                prefix=html.unescape(re.sub('<[^>]*>',' ',block[:match.start()])).strip()
                identity=re.search(r'([A-Z][A-Za-z.\' -]{1,45}),\s*([A-Z][A-Za-z.\' -]{1,45})\s*$',prefix)
                if not identity:continue
                author=', '.join(v.strip() for v in identity.groups())
                url=urllib.parse.urljoin(index_url,html.unescape(match[1]))
                if urllib.parse.urlsplit(url).netloc not in {'monergism.com','www.monergism.com'}:continue
                title=html.unescape(re.sub('<[^>]*>','',match[2])).strip()
                if not title:continue
                id=urllib.parse.urlsplit(url).path.strip('/')
                items.append(row(source,id,title,author,'','en',url=url,format='epub',
                    licence='Monergism edition: freely offered personal study, church and classroom use; private local research; original notices retained',
                    contributor='Monergism; edition and transcription contributors retained in original',
                    catalogueUrl=index_url,policyUrl='https://www.monergism.com/monergism-copyright-permissions'))
    elif source == 'gutenberg':
        body = client.cached('pg_catalog.csv', 'https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv')
        for x in csv.DictReader(io.StringIO(body.decode('utf-8-sig'))):
            if x['Type'] != 'Text': continue
            id = x['Text#']
            items.append(row(source, id, x['Title'], x['Authors'], x['Subjects']+'; '+x['Bookshelves'], x['Language'],
                url=f'https://www.gutenberg.org/cache/epub/{id}/pg{id}.txt', format='txt',
                licence='Project Gutenberg licence; underlying public-domain US texts', contributor='Project Gutenberg volunteers'))
    elif source == 'ia':
        query = query_override or 'collection:Princeton AND mediatype:texts AND date:[* TO 1930-12-31] AND NOT access-restricted-item:true'
        page = 1; cursor = None; total = None
        while True:
            params = [('q', query), ('count', '1000'), ('fields','identifier,title,creator,subject,publisher,language,date,rights,licenseurl,collection')]
            if cursor: params.append(('cursor',cursor))
            cache_name=f'ia-{query_key or "princeton"}-scrape-{page:03}.json'
            for attempt in range(client.attempts):
                result = json.loads(client.cached(cache_name, 'https://archive.org/services/search/v1/scrape?'+urllib.parse.urlencode(params)))
                if 'items' in result: break
                error_path=CACHE/'errors'/(cache_name+f'.{time.time_ns()}')
                error_path.parent.mkdir(exist_ok=True);(CACHE/cache_name).replace(error_path)
                if attempt==client.attempts-1: raise RuntimeError('IA search error: '+str(result))
                time.sleep(30)
            if total is None: total = result.get('total')
            for x in result['items']:
                def value(k):
                    v = x.get(k, ''); return '; '.join(v) if isinstance(v, list) else str(v)
                items.append(row(source, x['identifier'], value('title'), value('creator'), value('subject'), value('language'),
                    date=value('date'), publisher=value('publisher'), licence=value('licenseurl') or value('rights') or 'Historical edition published through 1930; public-domain US text; source electronic notices retained',
                    url='https://archive.org/metadata/'+x['identifier'], format='txt', collection=value('collection')))
            print('ia catalogue', page, len(items), total, flush=True)
            if not result.get('cursor') or not result['items']: break
            cursor = result['cursor']
            page += 1
    unique = {x['sourceId']: x for x in items}
    save(normalized, list(unique.values())); return list(unique.values())

def objects(value):
    if isinstance(value, dict):
        yield value
        for v in value.values(): yield from objects(v)
    elif isinstance(value, list):
        for v in value: yield from objects(v)

class Holdings:
    def __init__(self):
        self.hashes, self.ids, self.urls = set(), set(), set()
        database=ROOT/'KnowledgeBase/knowledge.sqlite3'
        if database.exists():
            with closing(sqlite3.connect(database.as_uri()+'?mode=ro',uri=True)) as db:
                for path,checksum in db.execute('SELECT path,sha256 FROM files'):
                    self.hashes.add(checksum)
                    p=Path(path)
                    if 'crosswire' in p.parts and p.suffix.lower()=='.zip' and p.is_file(): self.ids.add(('sword',p.stem))
        for p in (ROOT/'sources/crosswire').glob('*.zip'):
            self.ids.add(('sword',p.stem))
        raw_roots=[os.path.normcase(os.path.abspath(p))+os.sep for p in [ROOT/'sources',SITE/'sources',SITE/'.local/library']]
        confirmed={}
        for folder in [SITE/'content/library/catalog', SITE/'content/library/reports']:
            for path in folder.rglob('*.json'):
                try: data = read(path)
                except (ValueError, OSError): continue
                for x in objects(data):
                    paths = [x.get(k) for k in ['path','relativePath','sourceRelativePath','localPath']]
                    present = False
                    for value in paths:
                        if not isinstance(value,str): continue
                        if value in confirmed:
                            if confirmed[value]: present=True; break
                            continue
                        p = Path(value)
                        if p.suffix.lower() in ('.json','.md'):
                            confirmed[value]=False; continue
                        candidates = [p] if p.is_absolute() else [SITE/p, ROOT/'sources'/p, ROOT/p]
                        confirmed[value]=any(any(os.path.normcase(os.path.abspath(p)).startswith(root) for root in raw_roots)
                                             and p.is_file() for p in candidates)
                        if confirmed[value]: present=True; break
                    if not present: continue
                    for key in ['sha256','sourceSha256']: 
                        if x.get(key): self.hashes.add(x[key])
                    if x.get('source') in SOURCES and x.get('sourceId'): self.ids.add((x['source'], str(x['sourceId'])))
                    for key in ['url','canonicalUrl','finalUrl','sourceUrl','sourcePage','landingPage']:
                        if isinstance(x.get(key), str): self.urls.add(x[key])
        for url in self.urls:
            for pattern, source in [(r'textcreationpartnership/([ANKB]\d+)', 'tcp'),
                    (r'archive.org/(?:download|details|stream)/([^/?#]+)', 'ia'),
                    (r'crosswire[^ ]*/([^/]+)\.zip', 'sword'),
                    (r'gutenberg.org/(?:ebooks/|cache/epub/)(\d+)', 'gutenberg'),
                    (r'ccel.org/ccel/(?:[a-z]/)?([^/]+)/([^/.?#]+)', 'ccel')]:
                m = re.search(pattern, url)
                if m: self.ids.add((source, '/'.join(m.groups())))
    def held(self, x): return (x['source'], x['sourceId']) in self.ids or x['url'] in self.urls

def matches(x, filters):
    if filters.get('anyOf'):
        base={k:v for k,v in filters.items() if k!='anyOf'}
        return any(matches(x,base|branch) for branch in filters['anyOf'])
    if filters.get('includeTitlePattern') and not re.search(filters['includeTitlePattern'],x.get('title',''),re.I):return False
    if any(re.search(pattern,x.get('title',''),re.I) for pattern in filters.get('excludeTitlePatterns',[])):return False
    if x['sourceId'] in filters.get('skipIds',[]): return False
    author=x['author'].split(';')[0] if filters.get('primaryAuthorOnly') else x['author']
    for rule in filters.get('authorTitleRules',[]):
        if re.search(rule['namePattern'],author,re.I) and not re.search(rule['titlePattern'],x['title'],re.I):
            return False
    for rule in filters.get('authorIdentityRules',[]):
        if re.search(rule['namePattern'],author,re.I):
            if rule.get('allowedPattern') and not re.search(rule['allowedPattern'],author,re.I): return False
            year=re.search(r'\b(\d{4})\b',author)
            if year and rule.get('lifeYears') and int(year[1]) not in rule['lifeYears']: return False
            if not year and rule.get('requireReligiousSubjectsWhenUndated') and not re.search(
                    r'Bible|Christian|Theolog|Baptist|Puritan|Prayer|Sermon|Reformed|Doctrin|Church|God|Religion',x.get('subjects',''),re.I): return False
    for key, field in [('ids','sourceId'), ('authors','author'), ('subjects','subjects'), ('languages','language'), ('collections','collection')]:
        terms = filters.get(key, [])
        value=str(author if field=='author' else x.get(field,''))
        if key=='ids': matched=any(t.casefold()==value.casefold() for t in terms)
        elif key=='authors':
            normalized_author=re.sub(r'(?<=\w)\.(?=\s)','',value) if filters.get('authorMustStart') else value
            prefix=r'^\s*(?:(?:Rev|Dr)\.?\s+)?' if filters.get('authorMustStart') else r'(?<!\w)'
            matched=any(re.search(prefix+re.escape(re.sub(r'(?<=\w)\.(?=\s)','',t) if filters.get('authorMustStart') else t)+r'(?!\w)',normalized_author,re.I) for t in terms)
        else: matched=any(t.casefold() in value.casefold() for t in terms)
        if terms and not matched: return False
    excluded = filters.get('excludeAuthors', [])
    if any(t.casefold() in x['author'].casefold() for t in excluded): return False
    # Mixed catalogues require an approved author or explicit approved ID list.
    if not filters.get('authors') and not filters.get('ids') and not filters.get('approvedCollection'): return False
    if x['source'] == 'sword' and not filters.get('approvedCollection'):
        licence = x['licence'].casefold()
        if not any(v in licence for v in ['public domain','gpl','creative commons','cc by','copyrighted; free','copyrighted; permission']): return False
    return True

def acquire(x, client):
    if x['source']=='foundersjournal' and x.get('termId'):
        from bulk_journals import resolve
        x=resolve(x,client)
    if x['source'] in {'founders','desiringgod'}:
        from bulk_ministry import resolve
        x=resolve(x,client)
    url = x['url']
    if x['source'] == 'chapel':
        detail=json.loads(client.cached('chapel-detail-'+x['sourceId']+'.json',
            'https://www.chapellibrary.org/api/books/getdetail?code='+urllib.parse.quote(x['sourceId'])+'&language=EN'))
        if re.search(r'worksheet|answer sheet|order form|catalogue|catalog$',detail.get('title',''),re.I):
            raise RuntimeError('publisher administrative material; not a book')
        x=x|{'title':detail.get('title') or x['title'],
            'author':'; '.join(a['name'] for a in detail.get('authors',[]) if a.get('name')) or x['author'],
            'language':detail.get('isoLangCode') or detail.get('language',''), 'sourceMetadata':detail}
        if detail.get(x['format']+'Url'):
            url=urllib.parse.urljoin('https://www.chapellibrary.org/',detail[x['format']+'Url'])
    elif x['source'] == 'ia':
        metadata = json.loads(client.cached('ia-item-'+x['sourceId']+'.json', url))
        md = metadata.get('metadata', {})
        if str(md.get('access-restricted-item', '')).lower() == 'true': raise RuntimeError('restricted item')
        files = [f for f in metadata.get('files', []) if f['name'].endswith('_djvu.txt') and not f.get('private')]
        if not files:
            files=[f for f in metadata.get('files',[]) if f['name'].endswith('.epub') and not f.get('private')]
        if not files: raise RuntimeError('no existing downloadable djvu text or EPUB')
        f = files[0]; url = 'https://archive.org/download/'+x['sourceId']+'/'+urllib.parse.quote(f['name'])
        x = x | {'contributor': md.get('contributor'), 'credit': md.get('sponsor'), 'sourceMetadata': md,
                 'size': int(f.get('size', 0)), 'format':'epub' if f['name'].endswith('.epub') else 'txt'}
        x['licence']=md.get('licenseurl') or md.get('rights') or 'Historical edition published through 1930; public-domain US text; source electronic notices retained'
    elif x['source'] == 'monergism':
        page=client.cached('monergism-book-'+hashlib.sha256(url.encode()).hexdigest()[:20]+'.html',url).decode('utf-8','replace')
        offered=[]
        for quote,href in re.findall(r'<a\b[^>]*href=(["\'])(.*?)\1',page,re.I|re.S):
            target=urllib.parse.urljoin(url,html.unescape(href).strip())
            target=urllib.parse.quote(target,safe=':/?&=%#@+;,$-_.!~*\'()')
            parts=urllib.parse.urlsplit(target)
            if parts.netloc not in {'monergism.com','www.monergism.com'}:continue
            extension=Path(parts.path).suffix.lower()
            if extension in {'.epub','.pdf'}:offered.append((extension,target))
        offered.sort(key=lambda pair:pair[0]!='.epub')
        if not offered:raise RuntimeError('no complete official EPUB/PDF offered on catalogue page')
        extension,target=offered[0]
        x=x|{'landingPage':url,'format':extension[1:]}
        url=target
    elif x['source'] == 'gutenberg':
        id = x['sourceId']; prefix = '/'.join(id[:-1]) if len(id)>1 else '0'
        base = f'https://www.mirrorservice.org/sites/ftp.ibiblio.org/pub/docs/books/gutenberg/{prefix}/{id}/'
        listing = client.cached('pg-directory-'+id+'.html',base).decode('utf-8')
        names = re.findall(r'href="([^"/]+\.txt)"',listing)
        names.sort(key=lambda name: (not name.endswith('-0.txt'), name))
        if not names: raise RuntimeError('mirror has no offered full plain text original')
        url = base+names[0]
    if url in getattr(client,'held_urls',set()):return {'alreadyHeld':True},b''
    if x.get('cachedOriginal'):
        body=Path(x['cachedOriginal']).read_bytes();final=url;headers={'Content-Type':{'html':'text/html','json':'application/json'}.get(x['format'],'application/pdf')}
    else:body, final, headers = client.get(url)
    if len(body) < 500: raise RuntimeError('empty/short original')
    if x['format'] == 'xml' and not (b'<TEI' in body or b'<ThML' in body or b'<tei' in body): raise RuntimeError('not a complete offered XML text')
    if x['source']=='ccel':
        text = body.decode('utf-8','replace')
        content = re.search(r'<ThML.body[^>]*>(.*?)</ThML.body>',text,re.S)
        prose = re.sub(r'<a\b[^>]*>.*?</a>', '',content[1] if content else '',flags=re.S)
        prose = re.sub('<[^>]*>',' ',prose)
        if len(prose.split())<300: raise RuntimeError('catalogue/index wrapper, not a complete book')
    if x['source'] == 'tcp' and b'creativecommons.org/publicdomain/zero/1.0' not in body:
        raise RuntimeError('TCP encoded edition lacks CC0 release statement')
    if x['source']=='tcp':
        language=re.search(br'<language[^>]*ident="([^"]+)"',body)
        if language: x=x|{'language':language[1].decode('utf-8'),'contributor':'Text Creation Partnership; witness and transcription contributors in original TEI header'}
    if x['source']=='sword': x=x|{'author':SWORD_AUTHORS.get(x['sourceId']) or x['author'],
        'licence':x.get('licence') or 'CrossWire publicly offered module; source edition notices retained',
        'contributor':'CrossWire Bible Society; module contributors retained in configuration'}
    if x['format'] == 'txt' and (b'<html' in body[:500].lower() or b'<!doctype html' in body[:500].lower()): raise RuntimeError('HTML/login instead of text')
    if x['format'] == 'zip':
        with zipfile.ZipFile(io.BytesIO(body)) as z:
            if not any(n.startswith('modules/') for n in z.namelist()): raise RuntimeError('not a SWORD package')
    if x['format']=='epub':
        with zipfile.ZipFile(io.BytesIO(body)) as archive:
            if 'META-INF/container.xml' not in archive.namelist(): raise RuntimeError('not a readable offered EPUB')
    if x['format']=='pdf' and not body.startswith(b'%PDF-'):raise RuntimeError('not an offered PDF original')
    return x | {'url': url, 'finalUrl': final, 'sha256': hashlib.sha256(body).hexdigest(), 'bytes': len(body),
                'acquiredAt': now(), 'mimeType': headers.get('Content-Type'), 'useScope': 'private local import and embedding'}, body

def export_sword(record):
    conf=record.get('configuration',{}); driver=conf.get('ModDrv',[''])[0]
    if driver=='zCom4' and conf.get('CompressType',['ZIP'])[0]=='ZIP' and not conf.get('CipherKey'):
        blocks=[]
        with zipfile.ZipFile(record['path']) as archive:
            for name in sorted(n for n in archive.namelist() if n.endswith('.bzs')):
                index=archive.read(name); payload=archive.read(name[:-1]+'z')
                if len(index)%12: raise RuntimeError('invalid SWORD compressed block index')
                for number,(offset,size,expected) in enumerate(struct.iter_unpack('<III',index)):
                    if not size and not expected: continue
                    if offset+size>len(payload) or expected>256*1024*1024: raise RuntimeError('invalid SWORD compressed block bounds')
                    text=zlib.decompress(payload[offset:offset+size])
                    if len(text)!=expected: raise RuntimeError('SWORD block length verification failed')
                    blocks.append(f'\n[SWORD source block {name} {number}]\n'+text.decode('utf-8'))
        if not blocks: raise RuntimeError('no SWORD text blocks')
        output='\n'.join(blocks)
        method='SWORD zCom4 ZIP block decoding; every index bound, zlib checksum and uncompressed byte length verified; source block order retained'
        toolhash=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    else:
        return export_sword_tool(record)
    return save_sword_text(record,output,method,toolhash)

def save_sword_text(record,output,method,toolhash):
    output=re.sub(r'</(?:p|div|title|l|item)>','\n',output)
    text=html.unescape(re.sub('<[^>]+>',' ',output))
    derivative=SITE/'.local/library/sword'/(record['sourceId']+'.txt')
    derivative.parent.mkdir(parents=True,exist_ok=True); derivative.write_text(text,encoding='utf-8')
    return {'path':str(derivative),'sha256':hashlib.sha256(derivative.read_bytes()).hexdigest(),'bytes':derivative.stat().st_size,
            'format':'txt','method':method+'; markup tags stripped; original module retained','toolSha256':toolhash,
            **{key:record.get(key) for key in ['url','title','author','licence','audience','language','contributor','credit']}}

def export_sword_tool(record):
    tool = CACHE/'sword-tools/mod2imp.exe'
    if not tool.exists(): raise RuntimeError('Install official CrossWire mod2imp in sources/bulk-catalogues/sword-tools first')
    installed = CACHE/'sword-installed'/record['sourceId']; installed.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(record['path']) as archive:
        for name in archive.namelist():
            target=(installed/name).resolve()
            if not target.is_relative_to(installed.resolve()): raise RuntimeError('unsafe module archive path')
        archive.extractall(installed)
    env=os.environ.copy(); env['SWORD_PATH']=str(installed.resolve())
    result=subprocess.run([str(tool.resolve()),record['sourceId']],cwd=installed,env=env,capture_output=True,timeout=600)
    if result.returncode or len(result.stdout)<500: raise RuntimeError('SWORD export failed: '+result.stderr.decode('utf-8','replace')[:300])
    return save_sword_text(record,result.stdout.decode('utf-8','replace'),'official CrossWire mod2imp export',hashlib.sha256(tool.read_bytes()).hexdigest())

def acquisition_jobs(items,client,workers):
    if workers==1:
        for x in items:yield x,None
        return
    client.concurrent=True
    # A bounded pool, with one shared robots/rate/cooldown limiter for every request.
    with ThreadPoolExecutor(max_workers=workers) as executor:
        todo=iter(items);active={}
        def submit():
            x=next(todo,None)
            if x is not None:active[executor.submit(acquire,x,client)]=x
        for _ in range(workers):submit()
        while active:
            completed,_=wait(active,return_when=FIRST_COMPLETED)
            for future in completed:
                yield active.pop(future),future
                submit()

def collect(source, filters, limit):
    client = Client(attempts=1,timeout=20) if filters.get('deferHardDownloads') else Client()
    items = catalogue(source, client, filters); holdings = Holdings()
    client.held_urls=holdings.urls
    selected = [x for x in items if matches(x, filters)]
    pending = [x for x in selected if not holdings.held(x)]
    outcome = {'source':source,'catalogueItems':len(items),'catalogueUnheldItems':sum(not holdings.held(x) for x in items),'eligibleItems':len(selected), 'unheldBefore':len(pending),
               'filter':filters,'attempted':0,'downloaded':0,'duplicateHashes':0,'heldDuringRun':0,'failures':[], 'bytes':0, 'sampleSizes':[], 'state':'running','startedAt':now()}
    batch=filters.get('batchName','')
    if batch and not re.fullmatch(r'[A-Za-z0-9_-]+',batch): raise ValueError('unsafe batchName')
    status_path=REPORT/(source+('-test' if REPORT.name=='RB00' else '-acquisition')+('-'+batch if batch else '')+'.json')
    if filters.get('resumeStatus') and status_path.exists():
        outcome=read(status_path)
        outcome.update(state='running',filter=filters,resumedAt=now())
    save(status_path,outcome)
    holdings_updated=time.monotonic()
    workers=max(1,min(4,int(filters.get('downloadWorkers',1)))) if source=='ia' and not limit else 1
    for x,future in acquisition_jobs(pending,client,workers):
        if limit and outcome['downloaded']>=limit: break
        if time.monotonic()-holdings_updated>120:
            holdings=Holdings();holdings_updated=time.monotonic()
        if holdings.held(x):
            outcome['heldDuringRun']+=1;continue
        outcome['attempted'] += 1
        outcome.setdefault('attemptedSourceIds',[]).append(x['sourceId'])
        save(status_path,outcome)
        try:
            record, body = future.result() if future is not None else acquire(x, client)
            if record.get('alreadyHeld'):
                outcome['heldDuringRun']+=1
                outcome['updatedAt']=now();save(status_path,outcome)
                continue
            if filters.get('audienceProfile'):
                from bulk_audience import enrich
                record=enrich(record,filters,body)
            if record['sha256'] in holdings.hashes:
                outcome['duplicateHashes'] += 1
                print(source, x['sourceId'], 'held hash', flush=True)
                outcome['updatedAt']=now();save(status_path,outcome)
                continue
            filename = re.sub(r'[^A-Za-z0-9_.-]', '_', x['sourceId'])+'.'+record['format']
            path = RAW/source/filename; path.parent.mkdir(parents=True, exist_ok=True)
            temporary=path.with_name(path.name+f'.{os.getpid()}.part')
            temporary.write_bytes(body)
            temporary.replace(path)
            record['relativePath'] = path.relative_to(SITE.parent).as_posix()
            # Importer resolves sources/library paths relative to Website, so use absolute original path.
            record['path'] = str(path)
            record.pop('relativePath')
            if source=='sword':
                try: record['derivedText']=export_sword(record)
                except Exception as e: record['exportError']=str(e)
            record['campaignMission']=REPORT.name
            save(CACHE/'provenance'/source/(filename+'.json'), record)
            append_manifest(record)
            holdings.hashes.add(record['sha256']); holdings.ids.add((source,x['sourceId']))
            outcome['downloaded'] += 1; outcome['bytes'] += len(body); outcome['sampleSizes'].append(len(body))
            print(source, x['sourceId'], len(body), flush=True)
        except Exception as e:
            outcome['failures'].append({'sourceId':x['sourceId'],'url':x['url'],
                'title':x['title'],'author':x['author'],'error':str(e)})
            save(REPORT/(source+'-failed-downloads.json'),{'source':source,'updatedAt':now(),
                'items':outcome['failures'],'policy':'Deferred downloads; no automatic retries when deferHardDownloads is true'})
            print(source, x['sourceId'], 'FAILED', str(e), flush=True)
        outcome['updatedAt']=now();save(status_path, outcome)
    unheld = [x for x in pending if not holdings.held(x)]
    outcome['unheldAfter'] = len(unheld)
    mean = statistics.mean(outcome['sampleSizes']) if outcome['sampleSizes'] else None
    outcome['estimatedUnheldGB'] = sum(x.get('size') or mean or 0 for x in unheld)/1e9 if mean or any(x.get('size') for x in unheld) else None
    outcome['estimateBasis'] = 'SWORD InstallSize where available; otherwise arithmetic mean of downloaded originals; decimal GB; edition/item counts, not deduplicated works'
    outcome.update(state='complete',completedAt=now());save(status_path, outcome)
    return outcome

def main():
    global REPORT
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('command',choices=['catalogue','collect','export']); p.add_argument('--source',choices=SOURCES,required=True)
    p.add_argument('--filter',type=Path,help='JSON authors/subjects/ids/languages/collections/excludeAuthors lists; approvedCollection only for pre-screened collections')
    p.add_argument('--limit',type=int,default=20,help='0 collects all matches')
    p.add_argument('--mission',default='RB00',help='RB campaign report folder, e.g. RB01')
    args=p.parse_args()
    if not re.fullmatch(r'RB\d{2}',args.mission): p.error('--mission must be RB followed by two digits')
    REPORT=SITE/'content/library/reports/reformed-baptist-overnight'/args.mission
    REPORT.mkdir(parents=True,exist_ok=True)
    if args.command=='export':
        if args.source!='sword': p.error('export is for SWORD modules')
        path=REPORT/'acquisition-manifest.json'; manifest=read(path)
        for record in manifest['files']:
            if record['source']=='sword':
                record['author']=SWORD_AUTHORS.get(record['sourceId']) or record['author']
                record['contributor']='CrossWire Bible Society; module contributors retained in configuration'
                record['derivedText']=export_sword(record); append_manifest(record,update=True)
                print('exported',record['sourceId'],flush=True)
    elif args.command=='catalogue': print(args.source,len(catalogue(args.source,Client())))
    else:
        if not args.filter: p.error('collect requires an explicit screened filter')
        print(json.dumps(collect(args.source,read(args.filter),args.limit),indent=2))

if __name__=='__main__': main()
