"""Resumable, polite TCP divinity harvest using the publisher's own catalogue/URLs.
No page images, OCR, credentials, website crawling or public text publication.
"""
import argparse
import csv
import hashlib
import io
import json
import os
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path
from contextlib import closing

SITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SITE))
from knowledge.settings import load, write_json

UA = 'BibleProjectLocalResearch/1.0'
CATALOG = 'https://raw.githubusercontent.com/textcreationpartnership/Texts/master/TCP.csv'
URLS = 'https://raw.githubusercontent.com/textcreationpartnership/Texts/master/graball.sh'
AUTHORS = re.compile(r'^(?:Owen, John|Bunyan, John|Flavel, John|Manton, Thomas|Goodwin, (?:Thomas|John)|Watson, Thomas|Sibbes, Richard|Brooks, Thomas|Charnock, Stephen|Gurnall, William|Perkins, William|Ames, William|Gouge, William|Hildersam, Arthur|Hildersham, Arthur|Dod, John|Burroughs, Jeremiah|Caryl, Joseph|Greenham, Richard|Preston, John|Gataker, Thomas|Ball, John|Bolton, Robert|Sclater, William|Keach, Benjamin|Kiffin, William|Kiffen, William|Knollys, Hanserd|Spilsbury, John|Coxe, Nehemiah|Gill, John|Booth, Abraham|Fuller, Andrew|Edwards, Jonathan|Cotton, John|Mather, (?:Cotton|Increase)|Boston, Thomas|Dickinson, Jonathan|Whitefield, George|Newton, John|Baxter, Richard|Calvin, Jean|Luther, Martin|Zwingli, Ulrich|Bullinger, Heinrich|Bucer, Martin|Tyndale, William|Wycliffe, John|Coverdale, Miles|Foxe, John|Rogers, (?:Richard|John)|Harris, Robert|Hooker, Thomas|Shepard, Thomas|Durham, James|Rutherford, Samuel|Dickson, David|Fergusson, James|Hutcheson, George|Traill, Robert|Wadsworth, Thomas|Vincent, Thomas|Bridge, William|Marshall, Walter|Williams, Roger|Jewel, John|Ussher, James|Hall, Joseph|Davenant, John|Parker, Thomas|Oakes, Urian|Willard, Samuel|Davies, Samuel|Finney, William|Stennett, (?:Joseph|Samuel)|Beddome, Benjamin|Backus, Isaac|Gano, John|Evans, Caleb|Rippon, John|Robinson, Robert)', re.I)
SUBJECTS = re.compile(r'Puritans|Baptists|Calvinism|Presbyterian Church|Reformed Church|Congregational churches|Protestantism|Protestant churches|Sermons|Bible.*(?:Commentar|Criticism|Interpretation)|Theology.*Doctrinal|Christian life|Prayer', re.I)
DIVINITY = re.compile(r'sermon|theolog|divinity|Bible|Christian|religio|God|Christ|faith|doctrine|church|prayer|gospel|salvation|Scripture|catechism|confession', re.I)
EXCLUDE = re.compile(r'Catholic Church|Roman Catholic|Jesuits|Society of Jesus|Bellarmine|Bellarmino|Fisher, John, Saint|More, Thomas, Saint|Sales, Francis|Persons, Robert|Parsons, Robert|Campion, Edmund|Allen, William, Cardinal|Challoner, Richard|Douai|Douay|Brereley, John|Brierley, John|Bishop, William|Smith, Richard,.*Bishop|Gother, John|Cressy, Serenus|Rushworth, William|Dodd, Charles|White, Thomas, 1593|Alabaster, William|Hawarden, Edward|Erasmus|Aquinas|Thomas, Aquinas|Vives, Juan|Stapleton, Thomas|Harding, Thomas|Bonner, Edmund|Rastell, John|Biddle, John|Priestley, Joseph|Toland, John|Tindal, Matthew|Socinian|Unitarian|Quakers|Society of Friends|Fox, George|Barclay, Robert|Penn, William|Nayler, James|Hobbes, Thomas', re.I)


def stamp(): return datetime.now(timezone.utc).isoformat()
def digest(data): return hashlib.sha256(data).hexdigest()


class Fetcher:
    def __init__(self, cache, delay):
        self.cache, self.delay, self.last, self.rules = cache, delay, {}, {}
        cache.mkdir(parents=True, exist_ok=True)

    def request(self, url):
        host = urllib.parse.urlsplit(url).netloc
        if host not in self.rules:
            robots = urllib.robotparser.RobotFileParser()
            robots_url = 'https://' + host + '/robots.txt'
            try:
                with urllib.request.urlopen(urllib.request.Request(robots_url, headers={'User-Agent': UA}), timeout=30) as response:
                    raw = response.read(); robots.parse(raw.decode('utf-8', 'replace').splitlines())
                (self.cache / (host + '-robots.txt')).write_bytes(raw)
            except urllib.error.HTTPError as exc:
                if exc.code not in (404, 410): raise
                robots.parse([])
            self.rules[host] = robots
        robots = self.rules[host]
        if not robots.can_fetch(UA, url): raise RuntimeError('Robots disallows ' + url)
        delay = max(self.delay, robots.crawl_delay(UA) or robots.crawl_delay('*') or 0)
        rate = robots.request_rate(UA) or robots.request_rate('*')
        if rate: delay = max(delay, rate.seconds / rate.requests)
        for attempt in range(3):
            time.sleep(max(0, self.last.get(host, 0) + delay - time.monotonic()))
            self.last[host] = time.monotonic()
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60) as response:
                    final = response.url
                    if urllib.parse.urlsplit(final).hostname != urllib.parse.urlsplit(url).hostname:
                        raise RuntimeError('Unreviewed cross-host redirect: ' + final)
                    return response.read(), final
            except urllib.error.HTTPError as exc:
                if exc.code not in (429, 500, 502, 503, 504): raise
                pause = exc.headers.get('Retry-After', '')
                if pause.isdigit(): wait = int(pause)
                else:
                    try:
                        from email.utils import parsedate_to_datetime
                        wait = max(0, parsedate_to_datetime(pause).timestamp() - time.time())
                    except (ValueError, TypeError): wait = 30 * (attempt + 1)
                time.sleep(max(30, wait))
            except (TimeoutError, urllib.error.URLError):
                if attempt == 2: raise
                time.sleep(30 * (attempt + 1))
        raise RuntimeError('Retries exhausted: ' + url)

    def cached(self, url):
        p = self.cache / (digest(url.encode()) + '.body')
        if not p.exists():
            data, _ = self.request(url); p.write_bytes(data)
        return p.read_bytes()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--hours', type=float, default=12)
    parser.add_argument('--delay', type=float, default=2)
    parser.add_argument('--limit', type=int, default=0)
    parser.add_argument('--prepare-only', action='store_true')
    args = parser.parse_args()
    config = load(); state = config['state_dir'] / 'bulk-tcp'; state.mkdir(exist_ok=True)
    report = SITE / 'content/library/reports/bulk-acquisition/TCP'; report.mkdir(parents=True, exist_ok=True)
    import msvcrt
    with (state / 'collector.lock').open('a+b') as lock:
        lock.seek(0)
        try: msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError: print('TCP collector already active', flush=True); return 0
        fetch = Fetcher(state / 'http', args.delay)
        # Reuse the exact official catalogue fetched earlier today; old Restricted
        # labels predate Phase II's 2020 CC0 release. Only public offered XML URLs
        # present in TCP's own graball.sh are eligible, never subscription routes.
        cached = SITE / '.local/library/run-rb12-2026-10-07/http/6b6741e6ec6818df167052a2ef8ea86a2e9a5158d5b703b28e30d627206f292c.body'
        catalogue = cached.read_bytes() if cached.exists() else fetch.cached(CATALOG)
        official = SITE / '.local/library/tcp-graball.sh'
        offered = official.read_bytes() if official.exists() else fetch.cached(URLS)
        urls = {}
        for url in re.findall(r'https://raw\.githubusercontent\.com/[^\s]+\.xml', offered.decode('utf-8')):
            urls[urllib.parse.unquote(url.rsplit('/', 1)[-1]).removesuffix('.xml')] = url
        rows = list(csv.DictReader(io.StringIO(catalogue.decode('utf-8-sig'))))
        selected = []
        for row in rows:
            identity = row['TCP']; terms = row['Terms']; author = row['Author']; title = row['Title']
            # The catalogue/download script is a 2015 snapshot. Public Phase II
            # repositories now carry the 2020 CC0 release in their XML headers.
            # Apply TCP's published repository convention, never Michigan's
            # restricted/subscription endpoints; verify the text dedication below.
            if identity not in urls and identity[0] in 'AB':
                urls[identity] = f'https://raw.githubusercontent.com/textcreationpartnership/{identity}/master/{identity}.xml'
            if identity not in urls or EXCLUDE.search(author + ' ' + terms): continue
            if not (AUTHORS.search(author) or (SUBJECTS.search(terms) and DIVINITY.search(title + ' ' + terms))): continue
            if not DIVINITY.search(title + ' ' + terms): continue
            row['url'] = urls[identity]; row['selection'] = 'eligible-author' if AUTHORS.search(author) else 'Protestant-divinity-subject'
            selected.append(row)
        selected.sort(key=lambda x: (0 if x['TCP'][0] in 'AB' else 1 if x['TCP'][0] == 'K' else 2, -int(x['Pages']) if x['Pages'].isdigit() else 0, x['TCP']))
        write_json(report / 'collection-plan.json', {'catalogueUrl': CATALOG, 'catalogueSha256': digest(catalogue), 'urlList': URLS, 'urlListSha256': digest(offered), 'catalogueRecords': len(rows), 'selected': len(selected), 'collectionOrder': ['EEBO Phase I/II', 'ECCO', 'Evans'], 'exclusions': EXCLUDE.pattern, 'authorFilter': AUTHORS.pattern, 'subjectFilter': SUBJECTS.pattern, 'format': 'xml', 'licence': 'CC0-1.0', 'plannedUse': 'private local FTS5 and vector indexing', 'targets': selected})
        print('CATALOGUE', len(rows), 'SELECTED', len(selected), flush=True)
        if args.prepare_only: return 0
        manifest_path = report / 'acquisition-manifest.json'
        manifest = json.loads(manifest_path.read_text('utf-8-sig')) if manifest_path.exists() else {'mission': 'BULK-TCP', 'source': 'Text Creation Partnership official public distribution', 'licence': 'CC0-1.0', 'files': [], 'failures': [], 'publicHostingAllowed': False}
        completed = {x['tcpId'] for x in manifest['files']}; hashes = {x['sha256'] for x in manifest['files']}; held_ids = set()
        deferred = {x['tcpId'] for x in manifest.get('failures', [])}
        if config['db'].exists():
            with closing(sqlite3.connect(config['db'].resolve().as_uri() + '?mode=ro', uri=True)) as db:
                for checksum, url in db.execute("SELECT sha256,json_extract(metadata,'$.acquisition.url') FROM library_files"):
                    hashes.add(checksum)
                    if url and ('textcreationpartnership' in url.lower() or 'tcp' in url.lower()):
                        held_ids.update(re.findall(r'\b(?:[ABN]\d{5}|K\d{6}\.\d{3})\b', url))
        before = json.loads((config['state_dir'] / 'embedding-progress.json').read_text('utf-8-sig'))
        manifest.setdefault('passageTotalBefore', before.get('total'))
        start = time.monotonic(); deadline = start + args.hours * 3600; acquired = 0; skipped = 0
        def save(status):
            manifest.update(status=status, updatedAt=stamp(), pid=os.getpid(), distinctWorks=len({x['workId'] for x in manifest['files']}), byteCount=sum(x['byteCount'] for x in manifest['files']))
            write_json(manifest_path, manifest)
            write_json(state / 'progress.json', {'state': status, 'pid': os.getpid(), 'updatedAt': stamp(), 'targets': len(selected), 'filesAcquired': len(manifest['files']), 'bytes': manifest['byteCount'], 'failures': len(manifest['failures']), 'skippedHeld': skipped, 'passageTotalBefore': manifest['passageTotalBefore']})
        save('running')
        try:
            for row in selected:
                identity = row['TCP']
                if identity in completed or identity in held_ids or identity in deferred: skipped += 1; continue
                if time.monotonic() >= deadline or (args.limit and acquired >= args.limit): break
                try:
                    data, final = fetch.request(row['url'])
                    if b'<TEI' not in data[:2000] and b'<TEI.2' not in data[:2000]: raise ValueError('Not TCP XML text')
                    if not re.search(br'CC0|Creative Commons 0|creativecommons.org/publicdomain/zero', data[:50000], re.I): raise ValueError('No public CC0 text dedication in official XML header')
                    checksum = digest(data)
                    if checksum in hashes: completed.add(identity); skipped += 1; continue
                    asset = 'asset-bulk-tcp-' + identity.lower().replace('.', '-')
                    relative = Path('library/source-tcp-bulk') / asset / 'original.xml'
                    path = config['sources_dir'] / relative; path.parent.mkdir(parents=True, exist_ok=True)
                    if path.exists():
                        if digest(path.read_bytes()) != checksum: raise ValueError('Immutable original conflict')
                    else:
                        temp = path.with_suffix('.xml.part'); temp.write_bytes(data); temp.replace(path)
                    entry = {'tcpId': identity, 'assetId': asset, 'workId': 'work-tcp-' + identity, 'title': row['Title'], 'author': row['Author'] or 'Anonymous / catalogue unattributed', 'date': row['Date'], 'subjects': row['Terms'], 'url': row['url'], 'finalUrl': final, 'sha256': checksum, 'format': 'xml', 'licence': 'CC0-1.0', 'rightsEvidence': 'Official TCP public XML distribution and CC0 text dedication; images excluded', 'relativePath': relative.as_posix(), 'byteCount': len(data), 'retrievedAt': stamp(), 'evidenceOnly': False, 'privateLocalIndexAuthorized': True, 'publicHostingAllowed': False, 'collection': 'EEBO' if identity[0] in 'AB' else 'ECCO' if identity[0] == 'K' else 'Evans'}
                    write_json(path.parent / 'provenance.json', entry)
                    manifest['files'].append(entry); completed.add(identity); hashes.add(checksum); acquired += 1
                    print('ACQUIRED', identity, len(data), row['Title'][:100], flush=True)
                except Exception as exc:
                    manifest['failures'].append({'tcpId': identity, 'url': row['url'], 'at': stamp(), 'error': str(exc)})
                    print('FAILED', identity, str(exc), flush=True)
                if acquired % 10 == 0: save('running')
            remaining = [r['TCP'] for r in selected if r['TCP'] not in completed and r['TCP'] not in held_ids]
            manifest['remainingTargets'] = remaining
            save('checkpointed' if remaining else 'complete')
        except BaseException:
            save('interrupted'); raise
        print('DONE', acquired, 'new files;', len(manifest.get('remainingTargets', [])), 'remaining', flush=True)
    return 0

if __name__ == '__main__': sys.exit(main())
