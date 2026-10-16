"""Bounded P5 capture; run with -B from Website. No vectors or shared writes."""
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[3]
sys.path.insert(0, str(SITE))
from knowledge.settings import load, write_json
from knowledge.store import connect, digest
from knowledge.research_foundation.contract import fingerprint
from knowledge.evidence_collections.connections import normalized, before_gap, locate, reader_blocks, NS
from knowledge.evidence_collections.crosswalk import reader_check
from knowledge.evidence_collections.capture import capture, verify
from knowledge.evidence_collections.contract import sha256_file, seal, validate

CONFIG = load()
OUT = CONFIG['state_dir'] / 'library-knowledge/parallel-preparation/05-source-locations'
OLD = CONFIG['state_dir'] / 'library-knowledge/ephesians-connections-20261012'

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

def dump(name, value):
    path = OUT / name
    if path.exists():
        raise ValueError('Refusing to overwrite existing P5 output: '+name)
    write_json(path, value)

def main():
    manifest_path = OLD / 'release-final/manifest.json'
    spec_path = OLD / 'spec.json'
    manifest = read(manifest_path)
    spec = read(spec_path)
    inputs = {str(p):sha256_file(p) for p in [manifest_path,spec_path,Path(__file__).resolve()]}
    selected=[]; proofs={}
    for entry in sorted(manifest['collections'], key=lambda e:e['chapter']):
        path=manifest_path.parent/entry['path']
        assert sha256_file(path)==entry['sha256']
        inputs[str(path)]=sha256_file(path)
        package=read(path)
        for role in ('hodge','calvin-sermons'):
            # Preserve stored structural order, not a reconstructed ordinal.
            row=next(c for c in package['connections'] if c['sourceRole']==role)
            selected.append(row)
            proofs[role]=next(s for s in package['sources'] if s['role']==role)
    assert len(selected)==12
    sources={}; failures=[]
    db=connect(CONFIG['db'],readonly=True)
    try:
        build=db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        for role, proof in proofs.items():
            try:
                db.execute('BEGIN')
                row=db.execute('SELECT * FROM documents WHERE id=?',(proof['documentId'],)).fetchone()
                if row is None:raise ValueError('Selected document absent')
                chunks=[dict(r) for r in db.execute('SELECT id,text,locator FROM chunks WHERE document_id=? ORDER BY rowid',(row['id'],))]
                db.rollback()
                original=Path(row['source'])
                assert sha256_file(original)==proof['sha256'], 'Original hash mismatch'
                inputs[str(original)]=proof['sha256']
                root=ET.parse(original).getroot()
                attribution=next(s['attribution'] for s in spec['sources'] if s['role']==role)
                for a in attribution.get('assertions',[]):
                    assert [normalized(''.join(e.itertext())) for e in root.findall(a['xpath'])]==a['expectedTexts']
                reader=reader_check(CONFIG['site_dir']/'public/content/teacher-library',proof['sha256'])
                blocks=reader_blocks(None,reader) if reader['status']=='readable-local-package' else []
                for page in reader['pageProofs']: inputs[page['path']]=sha256_file(page['path'])
                sources[role]=dict(root=root,chunks=chunks,attribution=attribution,reader=reader,blocks=blocks)
            except Exception as exc:
                db.rollback(); failures.append(dict(role=role,error=str(exc),retry=False))
    finally:db.close()
    entries=[]; choices=[]
    for old in selected:
        role=old['sourceRole']; source=sources.get(role)
        e=dict(id=old['id'],sourceDocumentId=old['sourceDocumentId'],sourceRole=role,
               chapter=old['chapter'],selector=old['selector'],heading=old['heading'],
               originalSha256=proofs[role]['sha256'],selectionPolicy='First stored matching connection per role per chapter',
               status='unresolved',samples=[],verseIds=[],referenceScope='chapter-only',publication='private')
        entries.append(e)
        if source is None:
            e['issue']='Source read failed; see failures';continue
        try:
            root=source['root']; matches=root.findall(e['selector'])
            assert len(matches)==1, 'Selector must be unique'
            element=matches[0]
            assert fingerprint(ET.tostring(element,encoding='unicode'))==old['sourceElementSha256'], 'Source element changed'
            e.update(sourceElementSha256=old['sourceElementSha256'],gapCount=sum(n.tag==NS+'gap' for n in element.iter()),
                     attribution=source['attribution'],readerState=source['reader']['status'],
                     readingRoute=source['reader']['readingRoute'])
            children=list(element)
            # Select only prose: skip epigraphs, heading summaries and Scripture tables.
            if role=='hodge':
                start=next(i for i,n in enumerate(children) if n.tag=='h3' and normalized(''.join(n.itertext())) in ('ANALYSIS.','COMMENTARY.'))
                candidates=[(i,n) for i,n in enumerate(children) if i>start and n.tag=='p' and n.get('class')=='normal'][:6]
                refs=[(i,n) for i,n in enumerate(children[:start]) if n.tag in ('p','h3')]
            else:
                candidates=[(i,n) for i,n in enumerate(children) if n.tag==NS+'p'][:6]
                refs=[(i,n) for i,n in enumerate(children) if n.tag==NS+'epigraph']
            e['referenceEvidence']=[dict(childIndex=i,tag=n.tag,text=normalized(''.join(n.itertext())),
                 hasEncodedGap=any(x.tag==NS+'gap' for x in n.iter()),kind='source-heading-or-scripture-quotation-not-exposition') for i,n in refs]
            e['referencePolicy']='Literal wording retained. No automated verse assignments from quotations, ranges or incidental citations.'
            attempts=[]
            # One useful sample per section is sufficient; do not pad to 24.
            for i,paragraph in candidates:
                prefix=before_gap(paragraph)
                phrase=' '.join(prefix.split()[:30])
                if len(phrase)<100:
                    attempts.append(dict(childIndex=i,outcome='short-intact-prefix'));continue
                try: hits=locate(phrase,source['chunks'])
                except ValueError:
                    attempts.append(dict(childIndex=i,outcome='ambiguous-repeated-phrase'));continue
                if len(hits)!=1:
                    attempts.append(dict(childIndex=i,outcome='ambiguous' if hits else 'no-match',matches=len(hits)));continue
                hit=hits[0]
                reader_matches=[dict(page=b['page'],locator=b['locator']) for b in source['blocks'] if phrase in normalized(b['text'])]
                text=''.join(paragraph.itertext())
                # Source offsets accompany exact XPath and paragraph fingerprint.
                phit=locate(phrase,[dict(id='paragraph',text=text,locator='source XML paragraph')])[0]
                ordinal=sum(n.tag==paragraph.tag for n in children[:i+1])
                paragraph_selector=e['selector']+f'/{paragraph.tag}[{ordinal}]'
                resolved=root.findall(paragraph_selector)
                assert len(resolved)==1 and resolved[0] is paragraph, 'Paragraph selector mismatch'
                sample=dict(phrase=phrase,chunkId=hit['chunkId'],start=hit['start'],end=hit['end'],
                    chunkSha256=hit['expectedChunkSha256'],corpusLocator=hit['locator'],
                    paragraphChildIndex=i,paragraphSelector=paragraph_selector,
                    paragraphElementSha256=fingerprint(ET.tostring(paragraph,encoding='unicode')),
                    sourceTextStart=phit['start'],sourceTextEnd=phit['end'],sourceOffsetUnit='unicode-code-points-in-paragraph-itertext',
                    intactPrefix=prefix,readerLocations=reader_matches,
                    readerIssue=None if reader_matches else 'No verified on-site location for this sample',
                    evidenceId='evidence:'+fingerprint([hit['chunkId'],hit['start'],hit['end']]))
                e['samples'].append(sample);e['status']='located';e['attempts']=attempts
                choices.append(dict(**{k:hit[k] for k in ('chunkId','start','end','expectedChunkSha256')},
                    speakerLabel=source['attribution']['author']+'; passage voice unresolved',role='unresolved',basis='literal-quotation',
                    attributionEvidence='Named source author; selected explanatory prose after chapter/sermon headings and Scripture quotation. Translator retained from original title where asserted.',
                    claim=f"A prose sample is literally located in the selected {role} source section headed: {e['heading']}",
                    reviewScope='AI-assisted literal location and source structure only; no doctrinal, speaker-position or verse-range approval.',
                    limits=['Provisional partial-corpus preparation.','Only a short sample; not the full argument.','Chapter linkage only; reference wording retained separately.',
                            'Source gaps elsewhere remain unresolved.','Publication and claim-specific review pending.']))
                break
            if not e['samples']:
                e['attempts']=attempts;e['issue']='No unique intact opening prose sample in first six eligible paragraphs'
        except Exception as exc:
            e['issue']=str(exc);failures.append(dict(section=e['id'],error=str(exc),retry=False))
    selection=dict(schemaVersion=1,track='P5',corpusBuild=build,upstreamCorpusBuild=manifest['corpusBuild'],
                   inputHashes=inputs,sections=entries,failures=failures,selectionLimit=12,sampleLimit=24,
                   requiresFinalSnapshotRecheck=True,publication='private')
    dump('selection.json',selection)
    collection=None; result={'valid':False,'reason':'No samples captured'}
    if choices:
        cspec=dict(id='collection:p5-ephesians-source-locations',title='P5 bounded Hodge and Calvin locations',
            question='Where is opening explanatory prose in the twelve selected source sections?',language='en',audience=['editors'],
            scope='Private chapter-linked location samples only; no comprehensive retrieval or approved answer.',
            topicIds=[],corpusBuild=build,reviewDate='2026-10-12',items=choices)
        dump('capture-spec.json',cspec)
        try:
            collection=capture(CONFIG,cspec)
            for item in collection['evidence']:
                role=next(r for r,p in proofs.items() if p['documentId']==item['anchor']['documentId'])
                item['attribution']['translator']=sources[role]['attribution'].get('translator')
            validate(seal(collection));dump('collection.json',collection)
            result=verify(CONFIG,collection)
        except Exception as exc:
            result={'valid':False,'reason':str(exc)}
    changed=[p for p,h in inputs.items() if not Path(p).is_file() or sha256_file(p)!=h]
    db=connect(CONFIG['db'],readonly=True)
    try:end_build=db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
    finally:db.close()
    counts=dict(attemptedSections=len(entries),locatedSections=sum(e['status']=='located' for e in entries),
        locatedSamples=sum(len(e['samples']) for e in entries),capturedSamples=len(collection['evidence']) if collection else 0,
        onSiteSamples=sum(bool(s['readerLocations']) for e in entries for s in e['samples']),
        chapterOnlyMappings=len(entries),explicitVerseMappings=0,distinctSelectedWorks=2,distinctNamedAuthors=2,
        unresolvedSections=sum(e['status']!='located' for e in entries),hardFailures=len(failures),
        ambiguityAttempts=sum(a['outcome'].startswith('ambiguous') for e in entries for a in e.get('attempts',[])))
    verification=dict(counts=counts,captureVerification=result,changedInputs=changed,corpusBuildBefore=build,corpusBuildAfter=end_build,
        currentAtVerification=bool(result.get('valid')) and not changed and build==end_build,
        requiresFinalSnapshotRecheck=True,publicExported=False,vectorOperations=False,sourceGapPolicy='Prefix ends at first encoded gap')
    dump('verification.json',verification)
    dump('unresolved.json',dict(sections=[dict(id=e['id'],issue=e.get('issue')) for e in entries if e['status']!='located'],
         pending=['Final corpus-snapshot revalidation','Claim-specific voice and doctrinal review','Public-use decisions and identity reconciliation',
                  'Explicit verse-range review; no verse IDs assigned','Hodge on-site reading unavailable in existing selected package'],failures=failures))
    print(json.dumps(verification,ensure_ascii=True))

if __name__=='__main__':main()
