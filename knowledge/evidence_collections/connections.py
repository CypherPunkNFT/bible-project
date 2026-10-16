"""Private Ephesians section connections from explicit held source structure.

Preserves the existing capture and dependency contracts; no corpus/vector writes.
"""
import argparse
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

from ..research_foundation.contract import fingerprint
from ..settings import load, write_json
from ..store import connect, digest
from .assemble import dependency, implementation_dependencies, package_check, private_path, sealed, check_seal
from .capture import capture, verify as verify_capture
from .contract import sha256_file, seal, validate
from .crosswalk import read, reader_check

NS = '{http://www.tei-c.org/ns/1.0}'
MAX_VERSES = {1:23, 2:22, 3:21, 4:32, 5:33, 6:24}


def normalized(text):
    return ' '.join(text.split())


def before_gap(element):
    """Only the prefix before the first encoded gap; never erase a gap to quote."""
    parts = []
    def visit(node):
        if node.tag == NS+'gap':
            return False
        parts.append(node.text or '')
        for child in node:
            if not visit(child): return False
            parts.append(child.tail or '')
        return True
    visit(element)
    return normalized(''.join(parts))


def heading_verses(heading, chapter):
    if not re.match(r'^Vers(?:e|\.)', heading):
        raise ValueError('Expected explicit verse heading')
    numbers = [int(n) for n in re.findall(r'\b\d+\b', heading)]
    if not numbers or any(not 1 <= n <= MAX_VERSES[chapter] for n in numbers):
        raise ValueError('Verse heading outside Ephesians chapter')
    if numbers != sorted(set(numbers)):
        raise ValueError('Ambiguous verse sequence')
    return numbers


def locate(phrase, chunks):
    """Whitespace-only matching with offsets into the untouched corpus text."""
    hits = []
    for chunk in chunks:
        tokens = list(re.finditer(r'\S+', chunk['text']))
        text = ' '.join(m.group() for m in tokens)
        start = text.find(phrase)
        if start < 0: continue
        if text.find(phrase, start+1) >= 0:
            raise ValueError('Repeated phrase within a source chunk')
        positions = []
        for i, token in enumerate(tokens):
            if i: positions.append(tokens[i-1].end())
            positions.extend(range(token.start(), token.end()))
        hits.append(dict(chunkId=chunk['id'], start=positions[start], end=positions[start+len(phrase)-1]+1,
                         expectedChunkSha256=digest(chunk['text']), locator=chunk['locator']))
    return hits


def reader_blocks(package, proof):
    rid = proof['recordId']; result=[]; cache={}
    for page in proof['pageProofs']:
        path=page['path']
        if path not in cache: cache[path]=read(path)
        data=cache[path]; content=data.get(f"{rid}/{page['page']}",data)
        result.extend(dict(page=page['page'],locator=b['locator'],text=b['text']) for b in content['blocks'])
    return result


def bible_rows(db, chapter):
    return [dict(r) for r in db.execute("SELECT * FROM verses WHERE edition='kjv' AND book='EPH' AND chapter=? ORDER BY verse_start,id",(chapter,))]


def source_sections(role, root):
    """Returns source headings only. Generic body citations cannot become sections."""
    if role == 'fergusson':
        body=root.find('./{*}text/{*}body')
        scopes=[e for e in body if e.find('./{*}head') is not None and 'Ephesians' in ''.join(e.find('./{*}head').itertext())]
        if len(scopes)!=1:raise ValueError('Require unique Ephesians exposition')
        for chapter in scopes[0]:
            if chapter.get('type')!='chapter':continue
            number=int(chapter.get('n'))
            for index,section in enumerate([e for e in chapter if e.get('type')=='verse_and_explication'],1):
                heading=normalized(''.join(section.find('./{*}head').itertext()))
                yield dict(chapter=number,ordinal=index,heading=heading,
                           selector=f"./{{*}}text/{{*}}body/{{*}}div[2]/{{*}}div[@type='chapter'][@n='{number}']/{{*}}div[@type='verse_and_explication'][{index}]",
                           element=section,verses=heading_verses(heading,number),granularity='verse-section')
    elif role == 'calvin-commentary':
        for e in root.iter():
            match=re.fullmatch(r'Ephesians (\d+):\s*(\d+)(?:-(\d+))?',e.get('title',''))
            if not e.tag.startswith('div') or not match:continue
            chapter,first,last=map(int,(match[1],match[2],match[3] or match[2]))
            if not 1<=first<=last<=MAX_VERSES[chapter]:raise ValueError('Invalid commentary heading')
            yield dict(chapter=chapter,heading=e.get('title'),selector=f".//*[@id='{e.get('id')}']",element=e,
                       verses=list(range(first,last+1)),granularity='verse-section')
    elif role == 'calvin-sermons':
        words={'first':1,'second':2,'seconde':2,'third':3,'thirde':3,'fourth':4,'fourthe':4,'fifth':5,'sixth':6}
        for index,e in enumerate([e for e in root.iter() if e.get('type')=='sermon'],1):
            heading=normalized(''.join(e.find('./{*}head').itertext()))
            match=re.search(r'(first|seconde?|thirde?|fourthe?|fifth|sixth) Chapter',heading,re.I)
            if not match:raise ValueError('Sermon chapter unresolved')
            yield dict(chapter=words[match[1].lower()],heading=heading,selector=f".//{{*}}div[@type='sermon'][{index}]",
                       element=e,verses=[],granularity='chapter-only',ordinal=index)
    elif role == 'hodge':
        romans={'I':1,'II':2,'III':3,'IV':4,'V':5,'VI':6}
        for e in root.iter():
            match=re.match(r'Chapter ([IVX]+)\.',e.get('title',''))
            if not e.tag.startswith('div') or not match:continue
            yield dict(chapter=romans[match[1]],heading=e.get('title'),selector=f".//*[@id='{e.get('id')}']",
                       element=e,verses=[],granularity='chapter-only')
    else:raise ValueError('Unsupported selected source role')


def immutable_write(path, value):
    if path.exists():
        if read(path)!=value:raise ValueError('Existing artifacts differ; use a new private folder')
    else:write_json(path,value)


def build(config, spec_path, folder):
    folder=private_path(config,folder);spec_path=Path(spec_path).resolve();spec=read(spec_path)
    if spec.get('book')!='EPH' or len(spec['sources'])!=4 or {s['role'] for s in spec['sources']}!={'fergusson','calvin-commentary','calvin-sermons','hodge'}:
        raise ValueError('Require the four explicit Ephesians pilot sources')
    db=connect(config['db'],readonly=True)
    try:
        db.execute('BEGIN');corpus_build=db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        bible={ch:bible_rows(db,ch) for ch in MAX_VERSES}
        for ch,rows in bible.items():
            if [(r['verse_start'],r['verse_end']) for r in rows]!=[(i,i) for i in range(1,MAX_VERSES[ch]+1)]:
                raise ValueError('Main Bible verse coverage differs')
        sources={}
        for selected in spec['sources']:
            row=db.execute('SELECT * FROM documents WHERE id=?',(selected['documentId'],)).fetchone()
            if row is None:raise ValueError('Source absent')
            meta=json.loads(row['metadata']);path=Path(row['source'])
            if sha256_file(path)!=selected['sha256'] or meta['original_sha256']!=selected['sha256']:
                raise ValueError('Source hash changed')
            chunks=[dict(r) for r in db.execute('SELECT id,text,locator FROM chunks WHERE document_id=? ORDER BY rowid',(row['id'],))]
            sources[selected['role']]=dict(selected=selected,row=dict(row),meta=meta,chunks=chunks,path=path)
    finally:db.close()
    connections={ch:[] for ch in MAX_VERSES}; choices={ch:[] for ch in MAX_VERSES}; source_proofs=[]
    for role,source in sources.items():
        root=ET.parse(source['path']).getroot();reader=reader_check(config['site_dir']/'public/content/teacher-library',source['selected']['sha256'])
        attribution=source['selected']['attribution']
        if attribution.get('translator') and not attribution.get('assertions'):
            raise ValueError('Named translator requires exact source assertions')
        for assertion in attribution.get('assertions',[]):
            actual=[normalized(''.join(e.itertext())) for e in root.findall(assertion['xpath'])]
            if not actual or actual!=assertion['expectedTexts']:raise ValueError('Source attribution assertion changed')
        blocks=reader_blocks(None,reader) if reader['status']=='readable-local-package' else []
        source_proofs.append(dict(**source['selected'],sourcePath=str(source['path']),reader=reader,
                                 originalAttribution=source['meta'].get('acquisition',{}).get('author'),
                                 publicationSelected=False,publicUse='New output review pending'))
        for section in source_sections(role,root):
            ch=section['chapter'];element=section.pop('element')
            # Structural selectors must resolve to the exact inspected element.
            matches=root.findall(section['selector'])
            if len(matches)!=1 or matches[0] is not element:raise ValueError('Non-unique source selector')
            entry=dict(id='connection:'+fingerprint([source['row']['id'],section['selector']]),sourceDocumentId=source['row']['id'],
                       sourceRole=role,**section,sourceElementSha256=fingerprint(ET.tostring(element,encoding='unicode')),
                       gapCount=sum(e.tag==NS+'gap' for e in element.iter()),
                       referenceEvidenceKind='explicit-source-heading',relationship='structural-candidate',
                       verseIds=[r['id'] for r in bible[ch] if r['verse_start'] in section['verses']],
                       readerRoute=reader['readingRoute'],readerLocations=[],evidenceId=None,
                       review=dict(kind='ai-assisted',state='candidate',scope='Source heading and structure; no doctrinal approval.'),
                       attribution=source['selected']['attribution'],publication='private')
            if role in ('fergusson','calvin-commentary'):
                # Source-specific conflict established by the held heading and
                # the independent KJV verse text. Preserve, never silently fix.
                if role=='fergusson' and ch==1 and section['ordinal']==5:
                    if not section['heading'].startswith('Vers. 5, To the praise'):raise ValueError('Conflict evidence changed')
                    entry.update(relationship='reference-conflict',verseIds=[],suggestedReference='Ephesians 1:6',
                                 issue='Heading says verse 5; quoted words correspond to verse 6. Mapping withheld pending correction review.')
                else:
                    # Match a short gap-free prefix from exposition paragraphs,
                    # never the heading's Scripture quotation or a flattened gap.
                    hit=None;fallback=None
                    paragraphs=element.findall('./{*}p') if role=='fergusson' else [e for e in element if e.get('class')=='Commentary']
                    for paragraph in paragraphs:
                        prefix=before_gap(paragraph)
                        if len(prefix)<90:continue
                        # A paragraph can begin near a chunk boundary. Try a
                        # bounded set of intact prefixes/windows, never join
                        # across gaps or choose text outside this paragraph.
                        words=prefix.split()
                        for offset,width in ((0,25),(0,16),(15,25)):
                            phrase=' '.join(words[offset:offset+width])
                            if len(phrase)<80:continue
                            found=locate(phrase,source['chunks'])
                            if len(found)==1:
                                if fallback is None:fallback=(found[0],phrase)
                                if not blocks or any(phrase in normalized(b['text']) for b in blocks):
                                    hit=found[0];break
                        if hit is not None:break
                    if hit is None and fallback is not None:hit,phrase=fallback
                    if hit is None:
                        entry['issue']='No unique gap-free prose prefix aligned to one corpus chunk; remains candidate.'
                    else:
                        item=dict(**{k:v for k,v in hit.items() if k!='locator'},
                                  speakerLabel=source['selected']['attribution']['author']+'; local passage voice not independently adjudicated',
                                  role='unresolved',basis='literal-quotation',
                                  attributionEvidence='Named author of the held exposition; prose is in the explication/commentary element accompanying the explicit verse heading. No endorsement inference from a short excerpt.',
                                  claim=f"This held section places explanatory prose under Ephesians {ch}, explicit section verse labels {section['verses']}.",
                                  reviewScope='Limited source-location/reference alignment only; not a theological or full-section review.',
                                  limits=['Short location sample, not a complete argument.','Voice and any reported opposing position require claim-specific review.',
                                          'Encoded transcription gaps elsewhere in the section remain recorded.','Private evidence; publication review pending.'])
                        choices[ch].append(item)
                        entry.update(relationship='located-exposition',evidenceId='evidence:'+fingerprint([hit['chunkId'],hit['start'],hit['end']]),
                                     corpusLocator=hit['locator'],sample=phrase,
                                     review=dict(kind='ai-assisted',state='reviewed-limited',scope='Explicit heading, gap-free prose sample and corpus location; not doctrinal endorsement.'))
                        entry['readerLocations']=[dict(page=b['page'],locator=b['locator']) for b in blocks if phrase in normalized(b['text'])]
                        if not entry['readerLocations']:
                            entry['readerRoute']=None
                            entry['readerIssue']='Work readable, but sampled passage did not align.' if blocks else 'Exact edition has no verified on-site reading text.'
            connections[ch].append(entry)
    packages=[]
    for ch in MAX_VERSES:
        cspec=dict(id=f'collection:ephesians-{ch}-connections',title=f'Ephesians {ch}: held exposition connections',
                   question=f'Where does the selected held exposition discuss Ephesians {ch}?',language='en',audience=['readers','editors'],
                   scope='Private located-exposition samples and separate structural candidates; no approved doctrinal answer.',
                   topicIds=['topic:book-ephesians'],corpusBuild=corpus_build,reviewDate=spec['reviewDate'],items=choices[ch])
        collection=capture(config,cspec)
        # These are new captures. Record source-asserted translator information
        # in their initial limited review, without modifying legacy metadata.
        for item in collection['evidence']:
            source=next(s for s in sources.values() if s['row']['id']==item['anchor']['documentId'])
            item['attribution']['translator']=source['selected']['attribution'].get('translator')
        validate(seal(collection))
        deps=implementation_dependencies(config)+[dependency(config,'file',path=str(Path(__file__).resolve())),
              dependency(config,'file',path=str(spec_path)),dependency(config,'corpus-build')]
        for item in collection['evidence']:deps.append(dependency(config,'corpus-evidence',id=item['anchor']['chunkId']))
        for proof in source_proofs:
            deps.append(dependency(config,'file',path=proof['sourcePath']))
            for page in proof['reader']['pageProofs']:
                deps.append(dependency(config,'file',path=page['path']))
            rid=proof['reader']['recordId'];shard=digest(rid)[:2]
            record_path=config['site_dir']/'public/content/teacher-library/records'/(shard+'.json')
            if record_path.is_file():deps.append(dependency(config,'file',path=str(record_path)))
        covered={v for e in connections[ch] if e['relationship']=='located-exposition' for v in e['verseIds']}
        on_site={v for e in connections[ch] if e['relationship']=='located-exposition' and e['readerLocations'] for v in e['verseIds']}
        chapter=dict(schemaVersion=1,kind='private-scripture-connections',id=collection['id'],chapter=ch,
                     collection=collection,connections=connections[ch],sources=source_proofs,
                     bibleMainText=dict(relationship='main-text',edition='kjv',book='EPH',verseIds=[r['id'] for r in bible[ch]],fingerprint=fingerprint(bible[ch])),
                     coverage=dict(locatedVerseIds=[r['id'] for r in bible[ch] if r['id'] in covered],unresolvedVerseIds=[r['id'] for r in bible[ch] if r['id'] not in covered],
                                   onSiteLocatedVerseIds=[r['id'] for r in bible[ch] if r['id'] in on_site],
                                   withoutOnSiteLocatedVerseIds=[r['id'] for r in bible[ch] if r['id'] not in on_site],
                                   relationships=dict(Counter(e['relationship'] for e in connections[ch])),
                                   note='Located sampling does not imply complete commentary or reviewed doctrine for every verse.'),
                     dependencies=sorted({d['key']:d for d in deps}.values(),key=lambda d:d['key']),publication='private')
        packages.append(sealed(chapter))
    # All packages validate before any manifest becomes visible.
    for package in packages:
        if package_check(config,package)['state']!='current' or not verify_capture(config,package['collection'])['valid']:
            raise ValueError('Changed inputs during connection assembly')
    entries=[];reverse={}
    for package in packages:
        path=folder/'objects'/(package['integrity']+'.json');immutable_write(path,package)
        entries.append(dict(id=package['id'],chapter=package['chapter'],path=path.relative_to(folder).as_posix(),sha256=sha256_file(path),integrity=package['integrity']))
        for dep in package['dependencies']:reverse.setdefault(dep['key'],[]).append(package['id'])
    manifest=sealed(dict(schemaVersion=1,kind='private-ephesians-connections',corpusBuild=corpus_build,book='EPH',
                         collections=entries,dependents={k:sorted(v) for k,v in sorted(reverse.items())},publication='private',
                         relationPolicy=dict(mainText='Existing KJV verse IDs',explicitCitation='Heading quotes are reference evidence, not author exposition',
                                             locatedExposition='Unique gap-free prose sample plus explicit source heading',
                                             structuralCandidate='Source structure awaiting passage/voice review',semanticCandidate='None generated'),
                         counts=dict(chapters=6,connections=sum(len(p['connections']) for p in packages),
                                     capturedSamples=sum(len(p['collection']['evidence']) for p in packages),
                                     locatedVerses=sum(len(p['coverage']['locatedVerseIds']) for p in packages),
                                     onSiteLocatedVerses=sum(len(p['coverage']['onSiteLocatedVerseIds']) for p in packages),
                                     structuralCandidates=sum(e['relationship']=='structural-candidate' for p in packages for e in p['connections']),
                                     referenceConflicts=sum(e['relationship']=='reference-conflict' for p in packages for e in p['connections']),
                                     unresolvedVerses=sum(len(p['coverage']['unresolvedVerseIds']) for p in packages)),
                         limits=['AI-assisted location review, not independent human or doctrinal approval.','Public-use and canonical crosswalk checks for these new sources remain pending.',
                                 'Source spelling, translator attribution, gaps and reference conflicts retained.','No vector search, index/reference-table update, graph mutation or publication.']))
    immutable_write(folder/'manifest.json',manifest)
    return manifest['counts']


def check(config,folder):
    folder=private_path(config,folder);manifest=read(folder/'manifest.json');check_seal(manifest);rows=[];cache={}
    db=connect(config['db'],readonly=True)
    try:
        for entry in manifest['collections']:
            path=(folder/entry['path']).resolve()
            if not path.is_relative_to(folder) or sha256_file(path)!=entry['sha256']:raise ValueError('Package path/hash differs')
            package=read(path);result=package_check(config,package,cache)
            if package['integrity']!=entry['integrity'] or package['id']!=entry['id']:raise ValueError('Manifest identity differs')
            current=fingerprint(bible_rows(db,package['chapter']))
            if current!=package['bibleMainText']['fingerprint']:
                result['state']='stale';result['changedDependencies'].append(dict(kind='main-Bible-text',chapter=package['chapter']))
            rows.append(result)
    finally:db.close()
    return dict(valid=all(r['state']=='current' for r in rows),chapters=rows,publicExported=False,vectorsModified=False)


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['build','check'])
    parser.add_argument('--spec',type=Path);parser.add_argument('--folder',type=Path,required=True)
    args=parser.parse_args();config=load()
    if args.action=='build':
        if not args.spec:parser.error('--spec required')
        result=build(config,args.spec,args.folder)
    else:result=check(config,args.folder)
    print(json.dumps(result,indent=2))
    if result.get('valid') is False:raise SystemExit(1)


if __name__=='__main__':main()
