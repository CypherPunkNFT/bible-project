"""Official patristic bulk acquisition; existing text only, no network retries.

Run from Website: python -m knowledge.patristic_collect collect --report PATH.
Uses the shared HTTP/rate limiter and recorded-hash holdings reader. Original
repositories stay outside body intake; only readable work texts are staged.
"""
import argparse
import collections
import concurrent.futures
import hashlib
import importlib.util
import json
import re
import shutil
import subprocess
import threading
import urllib.error
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

from . import bulk_collect as bulk
from .library_extract import extraction_cache
from .settings import load

ROOT = bulk.ROOT
NS = {'t': 'http://www.tei-c.org/ns/1.0'}
LANG = '{http://www.w3.org/XML/1998/namespace}lang'
REPOS = {
    'first1k': ('OpenGreekAndLatin/First1KGreek', 'data'),
    'pta': ('PatristicTextArchive/pta_data', 'data'),
    'catenae': ('OpenGreekAndLatin/catenae-dev', ''),
}


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def words(node):
    return ' '.join(''.join(node.itertext()).split()) if node is not None else ''


def tei_metadata(path, source):
    root = ET.parse(path).getroot()
    header = root.find('t:teiHeader', NS)
    body = root.find('t:text/t:body', NS)
    if header is None or body is None:
        return None
    statement = header.find('t:fileDesc/t:titleStmt', NS)
    titles = [words(node) for node in statement.findall('t:title', NS)]
    authors = [words(node) for node in statement.findall('t:author', NS)]
    editions = [node for node in body.iter() if node.get('n', '').startswith('urn:cts:')]
    top_editions = [node for node in editions if node.get('type') in ('edition', 'translation')]
    edition = next(iter(top_editions or editions), None)
    urn = edition.get('n') if edition is not None else None
    language = (edition.get(LANG) if edition is not None else None) or root.find('t:text', NS).get(LANG)
    declared = [node.get('ident') for node in header.findall('.//t:langUsage/t:language', NS) if node.get('ident')]
    if not language:
        # Catena volumes are explicitly Greek/Latin and have no edition wrapper.
        language = 'grc' if 'grc' in declared else next(iter(declared), None)
    licences = [{'url': node.get('target'), 'statement': words(node)} for node in header.findall('.//t:availability/t:licence', NS)]
    if not licences and source == 'first1k':
        licences = [{'url': 'https://creativecommons.org/licenses/by-sa/4.0/', 'statement': 'CC BY-SA 4.0; repository licence'}]
    source_titles = [words(node) for node in header.findall('.//t:sourceDesc//t:monogr/t:title', NS)]
    if source == 'catenae':
        titles += source_titles
        titles.append('Volume '+path.stem.rsplit('_', 1)[-1])
    credits = [{'name': words(node.find('t:persName', NS)) or words(node.find('t:name', NS)),
                'role': words(node.find('t:resp', NS))} for node in statement.findall('t:respStmt', NS)]
    return {
        'title': '; '.join(titles), 'author': '; '.join(authors) or 'Authors not individually stated; historical patristic compilation',
        'editor': '; '.join(words(node) for node in header.findall('.//t:sourceDesc//t:editor', NS)) or None,
        'sourceId': urn or path.stem,
        'language': language or 'und', 'languages': declared,
        'licence': '; '.join(item['statement']+' ('+str(item['url'])+')' for item in licences) or 'Upstream historic text; no licence statement found',
        'credit': credits,
        'contributor': [words(node) for tag in ('sponsor','funder','principal','authority','distributor')
                        for node in header.findall('.//t:'+tag, NS)],
        'sourceMetadata': {
            'ctsEditionUrns': [node.get('n') for node in top_editions],
            'ctsWorkUrn': urn.rsplit('.',1)[0] if urn and len(urn.rsplit(':',1)[-1].split('.'))>=3 else None,
            'languages': declared, 'licences': licences, 'credit': credits,
            'sourceScans': [node.get('target') for node in header.findall('.//t:sourceDesc//t:ref', NS) if node.get('target')],
            'sourceEditionDates': [words(node) for node in header.findall('.//t:sourceDesc//t:imprint/t:date', NS)],
        },
        'bodyCharacters': len(words(body)),
    }


class Acquisition:
    def __init__(self, report):
        self.report = report
        report.mkdir(parents=True, exist_ok=True)
        self.config = load()
        self.lock = threading.RLock()
        self.files = []
        self.failures = []
        self.status = {}
        self.started = bulk.now()
        self.journal = report/'acquisition-manifest.jsonl'
        if self.journal.exists():
            raise RuntimeError('Existing acquisition journal: refusing an automatic rerun or retry')
        spec = importlib.util.spec_from_file_location('csel_holdings', bulk.SITE/'scripts/acquire-csel.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        self.hashes, historical = module.held_records()
        self.held_ccel = {}
        for row in historical:
            acq = row['metadata'].get('acquisition', {})
            url = acq.get('url') or acq.get('canonicalUrl') or ''
            for identifier in re.findall(r'/(anf\d{2}|npnf[12]\d{2})(?:[/.#?]|$)', url):
                self.held_ccel[identifier] = row
        bulk.save(report/'embedding-before.json', bulk.read(ROOT/'KnowledgeBase/embedding-progress.json'))
        self.flush()

    def flush(self):
        with self.lock:
            bulk.save(self.report/'acquisition-manifest.json', {
                'campaign': 'patristic-expansion-20261009', 'createdAt': self.started,
                'updatedAt': bulk.now(), 'sources': self.status, 'files': self.files,
                'policy': 'Official bulk channels; no download retries; private local intake; retain credits; no new OCR',
            })
            bulk.save(self.report/'failed-downloads.json', {'updatedAt':bulk.now(),'items':self.failures,'policy':'Deferred; no retries'})
            bulk.save(self.report/'status.json', {'updatedAt':bulk.now(),'sources':self.status,'files':len(self.files),'failures':len(self.failures)})

    def append(self, record):
        with self.lock:
            self.files.append(record)
            with self.journal.open('a', encoding='utf-8') as stream:
                stream.write(json.dumps(record, ensure_ascii=False)+'\n')
            if len(self.files)%64 == 0:
                self.flush()

    def failed(self, source, url, error, **extra):
        with self.lock:
            self.failures.append({'source':source,'url':url,'error':str(error),'recordedAt':bulk.now(),**extra})
            self.flush()
        print(source, 'DEFERRED', url, str(error), flush=True)

    def stage(self, path, record, source):
        checksum = record['sha256']
        with self.lock:
            matches = [p for p in self.hashes.get(checksum, ()) if Path(p).is_file()]
            if matches:
                original = Path(sorted(matches)[0]); outcome = 'reused_exact_sha256'
            else:
                relative = record['repositoryPath'] if source!='ccel' else record['sourceId']+'.txt'
                original = ROOT/'sources/library'/('source-patristic-'+source)/relative
                original.parent.mkdir(parents=True, exist_ok=True)
                if original.exists():
                    if sha(original)!=checksum:
                        raise ValueError('Refusing changed existing original: '+str(original))
                else:
                    shutil.copy2(path,original)
                self.hashes[checksum].add(str(original))
                outcome = 'newly_held_body'
        cache, selected, text_hash = extraction_cache(self.config, original, checksum, record['format'])
        characters = 0
        with cache.open(encoding='utf-8') as stream:
            for line in stream:
                characters += len(json.loads(line)['text'].strip())
        record.update(path=str(original), relativePath=original.relative_to(ROOT/'sources').as_posix(),
                      acquisitionStatus=outcome, extractedCharacters=characters,
                      extractionCache=str(cache), extractedTextSha256=text_hash,
                      useScope='private local import and embedding', countAsBook=True)
        return outcome, characters

    def repository(self, source):
        repo, subdirectory = REPOS[source]
        checkout = ROOT/'sources/patristic-bulk'/source/'repository'
        state = {'state':'cataloguing','repository':repo,'archiveFiles':0,'archiveBytes':0,
                 'bodyCandidates':0,'newlyHeldBodies':0,'reusedBodies':0,'emptyBodies':0,
                 'extractedCharacters':0,'processingFailures':0}
        with self.lock:self.status[source]=state
        commit = subprocess.check_output(['git','-C',str(checkout),'rev-parse','HEAD'],text=True).strip()
        state['commit'] = commit
        catalogue = []; work_ids = set(); languages = collections.Counter()
        for path in sorted(checkout.rglob('*')):
            if not path.is_file() or '.git' in path.parts:continue
            relative = path.relative_to(checkout).as_posix()
            checksum = sha(path)
            url = 'https://github.com/'+repo+'/blob/'+commit+'/'+relative
            candidate = path.suffix=='.xml' and path.name!='__cts__.xml' and (
                relative.startswith(subdirectory+'/') if subdirectory else bool(re.fullmatch(r'catenae_[1-8]\.xml',relative)))
            details = None
            if candidate:
                try: details=tei_metadata(path,source)
                except (ET.ParseError,ValueError) as error:
                    state['processingFailures']+=1;self.failed(source,url,error,path=str(path),kind='invalid_xml')
            record = {'url':url,'downloadUrl':'https://raw.githubusercontent.com/'+repo+'/'+commit+'/'+relative,
                      'sha256':checksum,'byteCount':path.stat().st_size,'path':str(path),'repositoryPath':relative,
                      'repositoryCommit':commit,'source':source,'title':relative,'author':repo.split('/')[0],
                      'licence':'Preserved repository support asset; no separate body licence inferred',
                      'format':path.suffix.lstrip('.') or 'repository-support','language':None,
                      'audience':'adult readers; pastors; scholars','countAsBook':False,
                      'retrievedAt':self.started,'publicHostingAllowed':False,
                      'classification':'repository_support','useScope':'Preserved archive; outside body intake'}
            state['archiveFiles']+=1;state['archiveBytes']+=record['byteCount']
            if details:
                record.update(details,format='tei',classification='work_text')
                catalogue.append({key:record.get(key) for key in ('sourceId','title','author','language','licence','repositoryPath','sourceMetadata')})
                state['bodyCandidates']+=1
                if not details['bodyCharacters']:
                    state['emptyBodies']+=1;record['classification']='empty_text_stub'
                else:
                    try:
                        outcome,chars=self.stage(path,record,source)
                        state['newlyHeldBodies' if outcome=='newly_held_body' else 'reusedBodies']+=1
                        state['extractedCharacters']+=chars
                        languages[record['language']]+=1
                        work_ids.add(details['sourceMetadata']['ctsWorkUrn'] or source+':'+relative)
                    except Exception as error:
                        state['processingFailures']+=1;record['processingError']=str(error)
                        self.failed(source,url,error,path=str(path),kind='text_preparation')
            self.append(record)
            if state['archiveFiles']%100==0:print(source,state['archiveFiles'],'files; bodies',state['newlyHeldBodies'],'new',state['reusedBodies'],'reused',flush=True)
        state.update(state='complete',distinctWorkIdentifiers=len(work_ids),languages=dict(languages),completedAt=bulk.now())
        bulk.save(ROOT/'sources/patristic-bulk/catalogues'/(source+'.json'),catalogue)
        self.flush();print(source,'COMPLETE',json.dumps(state),flush=True)

    def ccel(self):
        client = bulk.Client(attempts=1, timeout=60)
        state = {'state':'downloading','offeredTextVolumes':37,'heldBefore':0,'newlyHeldBodies':0,
                 'reusedBodies':0,'downloadedBytes':0,'extractedCharacters':0,'failures':0}
        with self.lock:self.status['ccel']=state
        catalogue = bulk.read(bulk.CACHE/'ccel.json',[])
        by_id = {item['sourceId'].split('/')[-1]:item for item in catalogue}
        identifiers = ['anf'+str(n).zfill(2) for n in range(1,10)] + ['npnf'+str(series)+str(n).zfill(2) for series in (1,2) for n in range(1,15)]
        selected = []
        blocked = None
        for identifier in identifiers:
            info = by_id.get(identifier,{})
            url = 'https://ccel.org/ccel/s/schaff/'+identifier+'/cache/'+identifier+'.txt'
            title = info.get('title') or identifier.upper()
            selected.append({'sourceId':identifier,'title':title,'author':info.get('author','Philip Schaff; Henry Wace; volume contributors'),'url':url})
            record = {'source':'ccel','sourceId':identifier,'title':title,'author':info.get('author') or 'Philip Schaff; Henry Wace; volume contributors',
                      'url':url,'format':'txt','language':'en','audience':'adult readers; pastors; scholars',
                      'licence':'Historical English text: public domain; CCEL electronic-edition personal/educational/non-profit use; original translator/editor and CCEL notices retained',
                      'credit':'Christian Classics Ethereal Library; contributors named in the full-volume original',
                      'contributor':'Christian Classics Ethereal Library','publicHostingAllowed':False,'retrievedAt':self.started,
                      'classification':'work_text','countAsBook':True,'useScope':'private local import and embedding'}
            if identifier in self.held_ccel:
                previous=self.held_ccel[identifier];original=Path(previous['path'])
                record.update(path=str(original),relativePath=original.relative_to(ROOT/'sources').as_posix(),
                              sha256=sha(original),byteCount=original.stat().st_size,acquisitionStatus='reused_source_id')
                state['heldBefore']+=1;state['reusedBodies']+=1;self.append(record)
                continue
            if blocked:
                state['failures']+=1;self.failed('ccel',url,'Not attempted after source block: '+blocked,sourceId=identifier,kind='blocked_queue')
                continue
            try:
                try:body,final,headers=client.get(url)
                except RuntimeError as error:
                    # Follow an ordinary canonical-host redirect through the same
                    # shared robots/rate checks; never bypass an access barrier.
                    prefix='Unapproved cross-host redirect '
                    target=str(error)[len(prefix):] if str(error).startswith(prefix) else ''
                    if urllib.parse.urlsplit(target).netloc not in ('ccel.org','www.ccel.org'):raise
                    body,final,headers=client.get(target)
                if len(body)<20000 or not re.search(br'(?i)(?:Title:|ANTE.NICENE|POST.NICENE)',body[:20000]):
                    raise ValueError('Response is not an offered whole-volume transcription')
                path=ROOT/'sources/patristic-bulk/ccel'/ (identifier+'.txt')
                path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(body)
                record.update(sha256=hashlib.sha256(body).hexdigest(),byteCount=len(body),finalUrl=final,
                              httpHeaders=headers,sourceMetadata={'collectionId':identifier,'offeredWholeVolume':True})
                outcome,chars=self.stage(path,record,'ccel')
                state['newlyHeldBodies' if outcome=='newly_held_body' else 'reusedBodies']+=1
                state['downloadedBytes']+=len(body);state['extractedCharacters']+=chars
                self.append(record);print('ccel',identifier,len(body),'bytes',outcome,flush=True)
            except Exception as error:
                state['failures']+=1;self.failed('ccel',url,error,sourceId=identifier,kind='download_or_text_preparation')
                if isinstance(error,urllib.error.HTTPError) and error.code in (401,403,429,503):blocked=str(error)
            self.flush()
        bulk.save(ROOT/'sources/patristic-bulk/catalogues/ccel-fathers.json',selected)
        state.update(state='complete' if not state['failures'] else 'complete_with_deferred_downloads',completedAt=bulk.now())
        self.flush();print('ccel COMPLETE',json.dumps(state),flush=True)

    def finish(self):
        after=bulk.read(ROOT/'KnowledgeBase/embedding-progress.json')
        before=bulk.read(self.report/'embedding-before.json')
        bulk.save(self.report/'embedding-after.json',after)
        originals=sum(s.get('archiveFiles',0) for s in self.status.values())+self.status.get('ccel',{}).get('newlyHeldBodies',0)
        archive_bytes=sum(s.get('archiveBytes',s.get('downloadedBytes',0)) for s in self.status.values())
        new=sum(s.get('newlyHeldBodies',0) for s in self.status.values())
        reused=sum(s.get('reusedBodies',0) for s in self.status.values())
        body_bytes=sum(row['byteCount'] for row in self.files if row.get('acquisitionStatus')=='newly_held_body')
        lines=['# Patristic expansion — 2026-10-09','',
               f'Four sources. {originals:,} acquired original/support files; {archive_bytes/1e9:.3f} GB preserved source payload. {new:,} newly held body-text files ({body_bytes/1e9:.3f} GB); {reused:,} bodies reused by source ID or exact SHA-256.','',
               '| Source | New body files | Reused body files | Work identifiers / offered volumes |',
               '|---|---:|---:|---:|']
        for source,state in self.status.items():
            lines.append(f"| {source} | {state.get('newlyHeldBodies',0):,} | {state.get('reusedBodies',0):,} | {state.get('distinctWorkIdentifiers',state.get('offeredTextVolumes',0)):,} |")
        lines+=['',f"Failures/deferred items: {len(self.failures):,}; see failed-downloads.json. No network retries. Empty upstream text stubs: {sum(s.get('emptyBodies',0) for s in self.status.values())}. Repository analyzed duplicates, catalogue XML and support files remain outside body intake.",'',
                'All newly staged originals have provenance, SHA-256, title, author, licence, format, audience and language metadata, and existing-text extraction caches. Upstream contributor and translator/editor notices are retained. No OCR or GPU preprocessing was run.','',
                f"Live embedded passages before/after acquisition: {before['indexed']:,} / {after['indexed']:,}; total corpus {after['total']:,}; state {after['state']}. This increase belongs to the existing corpus, not to these new downloads.",'',
                'New-source passage count is pending the existing completion pipeline’s late-acquisition refresh. Fewer than 100,000 newly incorporated passages during this acquisition is expected because the active embedding pass is preserved; source texts have been prepared without starting a second writer.','',
                'Outputs: acquisition-manifest.json and its append journal; failed-downloads.json; per-source local catalogues under sources/patristic-bulk/catalogues; raw repositories under sources/patristic-bulk; ready originals under sources/library/source-patristic-*; extraction caches under KnowledgeBase/extracted-library.']
        (self.report/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
        bulk.save(self.report/'summary.json',{'sources':self.status,'acquiredFiles':originals,'archiveBytes':archive_bytes,
            'newBodyFiles':new,'newBodyBytes':body_bytes,'reusedBodies':reused,'failures':len(self.failures),'embeddingBefore':before,'embeddingAfter':after})
        self.flush()


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('command',choices=('collect',))
    parser.add_argument('--report',type=Path,required=True)
    args=parser.parse_args()
    report=args.report.resolve()
    if not report.is_relative_to(bulk.SITE/'content/library/reports'):
        raise ValueError('Report must stay in this library’s report directory')
    runner=Acquisition(report)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        jobs={pool.submit(runner.repository,source):source for source in REPOS}
        jobs[pool.submit(runner.ccel)]='ccel'
        for job in concurrent.futures.as_completed(jobs):
            try:job.result()
            except Exception as error:
                source=jobs[job]
                runner.status.setdefault(source,{})['state']='failed'
                runner.failed(source,REPOS[source][0] if source in REPOS else 'ccel',error,kind='source_job')
    runner.finish()
    print('ACQUISITION COMPLETE',report,flush=True)


if __name__=='__main__':main()
