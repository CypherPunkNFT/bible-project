"""Bounded source-only audit of the existing 21 candidates; never a pilot or writer.
Run with the existing Website Python environment from Website. Inputs are historical
KR/LK selections plus current retained originals, extraction and reader files.
Only this audit directory receives new files. Existing receipts are not overwritten.
"""
import hashlib, json, sqlite3, sys, time
from collections import Counter
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

OUT=Path(__file__).resolve().parent
SITE=OUT.parents[3]
PROJECT=SITE.parent
sys.path.insert(0,str(SITE))
from knowledge.library_analytics.section_contract import checked_bytes,cache_blocks,html_render,xml_render,text_hash
from knowledge.library_analytics.inputs import packed
from lxml import etree
import xml.etree.ElementTree as ET
from knowledge.research_foundation.contract import fingerprint
RUN='kr101-31239794030518bcb2299a31'
MAX_FILE=128*1024*1024
MAX_BYTES=512*1024*1024
MAX_SECONDS=180
started=time.monotonic()
inputs={}

def now():return datetime.now(timezone.utc).isoformat()
def checked(p,expected=None):
    p=Path(p).resolve()
    if not p.is_relative_to(PROJECT.resolve()):raise ValueError('Input outside project')
    if time.monotonic()-started>MAX_SECONDS:raise TimeoutError('Audit time bound')
    if p.stat().st_size>MAX_FILE:raise ValueError('Input exceeds audit bound')
    raw,proof=checked_bytes(p,expected)
    if str(p) in inputs and inputs[str(p)]['sha256']!=proof[1]:raise ValueError('Input changed during audit')
    inputs[str(p)]={'sha256':proof[1],'bytes':proof[2],'mtime_ns':proof[3]}
    if sum(x['bytes'] for x in inputs.values())>MAX_BYTES:raise ValueError('Audit byte bound')
    return raw

def load(p):return json.loads(checked(p).decode('utf-8-sig'))
def write_new(name,obj):
    with (OUT/name).open('x',encoding='utf-8',newline='\n') as f:
        json.dump(obj,f,ensure_ascii=False,indent=2);f.write('\n')

def same_span(body,source):
    a,b=source['start'],source['end']
    valid=isinstance(a,int) and isinstance(b,int) and 0<=a<=b<=len(body)
    match=valid and body[a:b]==source['text'] and text_hash(body[a:b])==source['sha256']
    context=source.get('context')
    at=body.find(context) if context else -1
    covers=at>=0 and at<=a and b<=at+len(context)
    return {'coordinate_unit':'Unicode codepoint; half-open','start':a,'end':b,
      'span_sha256':source['sha256'],'span_matches':match,'context_sha256':text_hash(context) if context else None,
      'context_matches_and_covers_span':covers,'context_start':at if covers else None,
      'source_annotations':sorted(set(__import__('re').findall(r'\[(?:Editorial gap:[^\]]*|Source page [^\]]*)\]',source['text'])))}

def reader(source,expected_sha):
    route=source.get('reader')
    if not route:return {'binding':'no-saved-reader','exact_passage':'not-checked'}
    rid=route.rsplit('/',1)[-1]
    shard=hashlib.sha256(rid.encode()).hexdigest()[:2]
    public=load(SITE/'public/content/teacher-library/records'/f'{shard}.json').get(rid)
    bindings=index['bindings'].get(rid,[])
    candidates=[index['documents'][key] for key in bindings if key in index['documents']]
    selected=next((r for r in candidates if r['sha256']==expected_sha),None)
    result={'route':route,'binding':'private-exact-copy' if selected else 'public-fallback' if public else 'missing',
       'public_record':public,'private_copy_ids':[r['id'] for r in candidates],
       'scope':'retained reader files; no preparation or live browser check in this audit'}
    pages=[]
    if selected:
        result['private_record']={k:selected.get(k) for k in ('id','sha256','workId','editionId','authors','authorIds','licence','credit','privateReaderScope','cacheSha256')}
        folder=SITE/'.local/local-library/pages'/expected_sha
        if not (folder/'manifest.json').is_file():
            result['exact_passage']='existing-cache-not-prepared';return result
        manifest=load(folder/'manifest.json');result['manifest']=manifest
        original=Path(selected['path']).stat()
        result['manifest_source_stamp_matches']=manifest.get('sourceStamp')==[original.st_size,original.st_mtime_ns]
        if not result['manifest_source_stamp_matches']:
            result['exact_passage']='stale-prepared-manifest';return result
        if manifest['pages']>300:result['exact_passage']='reader-page-bound-exceeded';return result
        for n in range(manifest['pages']):pages.append((n,load(folder/f'{n}.json')))
    elif public and public.get('sha256')==expected_sha and public.get('pages',0)>0:
        if public['pages']>300:result['exact_passage']='reader-page-bound-exceeded';return result
        bundles={}
        for n in range(public['pages']):
            part=public.get('pageBundles',[])[n]
            p=SITE/'public/content/teacher-library'/part
            if part not in bundles:
                raw=checked(p,Path(part).stem);bundles[part]=json.loads(raw)
            pages.append((n,bundles[part][f'{rid}/{n}']))
    else:
        result['exact_passage']='text-not-offered';return result
    text='';bounds=[]
    for n,page in pages:
        a=len(text);text+=''.join(b['text'] for b in page['blocks']);bounds.append((n,a,len(text)))
    at=text.find(source['text'])
    result['exact_passage']='literal-match' if at>=0 else 'not-literal-in-retained-pages'
    result['page_numbers']=[n+1 for n,a,b in bounds if at>=0 and b>at and a<at+len(source['text'])]
    result['page_links']=[route+'?page='+str(n) for n in result['page_numbers']]
    result['public_record']={k:public.get(k) for k in ('id','sha256','workId','editionId','availability','pages','licence','credit','authors')} if public else None
    return result

catalogue=load(SITE/'.local/data-analysis/website-candidates.json')
if len(catalogue['candidates'])!=21:raise ValueError('Changed candidate scope; review before rerun')
if sum(len(c['sources']) for c in catalogue['candidates'])!=39:raise ValueError('Changed source scope')
index=load(SITE/'.local/local-library/index.json')
prior=load(OUT.parent/'source-dependencies-2026-10-19.json')
provenance=[]
for rel,expected in catalogue['inputSha256'].items():
    raw=checked(PROJECT/rel,expected);provenance.append({'path':rel,'sha256':expected})
packages=[json.loads(checked(PROJECT/p)) for p in catalogue['inputSha256'] if '/release-final/objects/' in p]
connections={c['id']:(pkg,c) for pkg in packages for c in pkg['connections']}
docids=sorted({s['sourceId'] for c in catalogue['candidates'] for s in c['sources'] if s.get('sourceId')})
sections=PROJECT/'KnowledgeBase/library-knowledge/connected-research/sections.sqlite3'
with closing(sqlite3.connect(sections.resolve().as_uri()+'?mode=ro',uri=True,timeout=2)) as db:
    db.execute('PRAGMA query_only=ON')
    deadline=time.monotonic()+10
    db.set_progress_handler(lambda:time.monotonic()>deadline,10000)
    query='SELECT descriptor_json FROM research_scope WHERE run_id=? AND document_id=?'
    plan=[list(row) for row in db.execute('EXPLAIN QUERY PLAN '+query,(RUN,docids[0]))]
    descriptors={doc:json.loads(row[0]) if (row:=db.execute(query,(RUN,doc)).fetchone()) else None for doc in docids}
# The historical DB is now closed. No current corpus, vector or index is opened.
records=[]
for candidate in catalogue['candidates']:
    for source in candidate['sources']:
        r={'candidate':candidate['id'],'source_id':source['id'],'title':source.get('title'),
          'recorded_author':source.get('author'),'recorded_credits':source.get('credits'),
          'recorded_cautions':source.get('cautions'),'language':source.get('language'),
          'saved_locator':source.get('locator'),'excerpt_hash_matches':text_hash(source['excerpt'])==source['excerptSha256'],
          'semantic_generation':'unmapped to active reconciliation; hold','public_use':'output-specific review required'}
        try:
            if source.get('sourceId'):
                d=descriptors[source['sourceId']]
                if d is None:raise ValueError('No descriptor in pinned historical section run')
                raw=checked(d['source_path'],d['original_sha256'])
                cache=checked(d['cache_path'],d['cache_expected_sha256'])
                blocks=cache_blocks(cache)
                stream=hashlib.sha256()
                for b in blocks:stream.update(packed({'ordinal':b['ordinal'],'locator':b.get('locator'),'sha256':text_hash(b['text']),'id':b.get('id')}).encode())
                r.update(document_id=source['sourceId'],descriptor_sha256=text_hash(packed(d)),
                    original={'path':d['source_path'],'sha256':d['original_sha256'],'matches':True},
                    extraction={'path':d['cache_path'],'sha256':d['cache_expected_sha256'],
                      'blocks':len(blocks),'body_stream_matches':stream.hexdigest()==d['quality']['body_stream_sha256']},
                    historical_identity={k:d.get(k) for k in ('work_id','work_verified','edition_id','edition_verified','identity_basis','author_label','memberships')},
                    historical_quality=d.get('quality'),historical_readers=d.get('readers'))
                if source['locator']=='native-rendered-source':
                    body=(xml_render(raw) if Path(d['source_path']).suffix.lower()=='.xml' else html_render(raw))[0]
                    r['representation']='original native render via existing KR helper'
                else:
                    found=[b for b in blocks if b.get('locator')==source['locator']]
                    if len(found)!=1:raise ValueError('Locator is absent or ambiguous in pinned extraction')
                    body=found[0]['text'];r['representation']='pinned extraction-cache block'
                r['selected_evidence']=same_span(body,source)
                r['reader']=reader(source,d['original_sha256'])
            elif source['id'].startswith('connection:'):
                pkg,c=connections[source['id']]
                s=next(s for s in pkg['sources'] if s['documentId']==c['sourceDocumentId'])
                raw=checked(s['sourcePath'],s['sha256'])
                tree=ET.fromstring(raw)
                nodes=tree.findall(c['selector'])
                if len(nodes)!=1:raise ValueError('Native connection selector absent or ambiguous')
                node=nodes[0]
                element_hash=fingerprint(ET.tostring(node,encoding='unicode'))
                body=' '.join(''.join(node.itertext()).split());quote=' '.join(source['text'].split())
                r.update(document_id=c['sourceDocumentId'],original={'path':s['sourcePath'],'sha256':s['sha256'],'matches':True},
                   selected_evidence={'representation':'native XML selected element; whitespace collapsed',
                      'selector':c['selector'],'selector_element_sha256':element_hash,
                      'expected_element_sha256':c['sourceElementSha256'],'element_hash_matches':element_hash==c['sourceElementSha256'],
                      'quote_matches':quote in body,'quote_occurrences':body.count(quote),'quote_sha256':text_hash(source['text'])},
                   native_attribution=c.get('attribution'),
                   attribution_assertions_match=all([' '.join(''.join(e.itertext()).split()) for e in tree.findall(a['xpath'])]==a['expectedTexts'] for a in c.get('attribution',{}).get('assertions',[])),
                   historical_reader=s.get('reader'))
                r['reader']=reader(source,s['sha256'])
            else:
                slot='D11' if source['id'].startswith('43d343') else 'D12'
                p=next(x for x in prior['records'] if x['slot']==slot)
                raw=checked(p['original']['path'],p['original']['sha256'])
                tree=etree.fromstring(raw,etree.XMLParser(resolve_entities=False,no_network=True))
                nodes=tree.xpath(source['locator'])
                if len(nodes)!=1:raise ValueError('Lexicon selector absent or ambiguous')
                body=''.join(nodes[0].itertext()).strip()
                r.update(document_id=p['document_id'],original=p['original'],
                   selected_evidence={'representation':'native lexicon element; stripped itertext','selector':source['locator'],
                     'element':etree.QName(nodes[0]).localname,'start':source['start'],'end':source['end'],
                     'quote_sha256':text_hash(source['text']),'span_matches':body[source['start']:source['end']]==source['text']},
                   reader={'binding':'native-XML-control; no saved site route'},independence_group=p['original']['sha256'])
        except Exception as exc:r['inspection_hold']=type(exc).__name__+': '+str(exc)
        records.append(r)

for p in ('knowledge/library_analytics/section_contract.py','knowledge/library_analytics/inputs.py','knowledge/library_analytics/structure.py','scripts/local_library.py','src/pages/teachers/shared/acquired.ts','knowledge/evidence_collections/connections.py','knowledge/research_foundation/contract.py'):
    checked(SITE/p)
checked(__file__)
# Recheck every consumed input's stat: receipts are observations, not a locked backup.
changed=[p for p,v in inputs.items() if (Path(p).stat().st_size,Path(p).stat().st_mtime_ns)!=(v['bytes'],v['mtime_ns'])]
summary={'candidates':21,'source_cards':len(records),'normal_KR_cards':len(docids),
 'inspection_holds':sum('inspection_hold' in r for r in records),
 'exact_KR_spans':sum(r.get('selected_evidence',{}).get('span_matches',False) for r in records if r.get('source_id','').isdigit()),
 'exact_KR_contexts':sum(r.get('selected_evidence',{}).get('context_matches_and_covers_span',False) for r in records),
 'native_LK_quotes':sum(r.get('selected_evidence',{}).get('quote_matches',False) for r in records),
 'native_lexicon_spans':sum(r.get('selected_evidence',{}).get('span_matches',False) for r in records if ':' in r['source_id'] and not r['source_id'].startswith('connection:')),
 'reader_bindings':dict(Counter(r.get('reader',{}).get('binding','uninspected') for r in records)),
 'reader_passages':dict(Counter(r.get('reader',{}).get('exact_passage','not-checked') for r in records)),
 'inputs':len(inputs),'unique_input_bytes':sum(x['bytes'] for x in inputs.values()),'inputs_changed_at_closeout':changed,
 'seconds':round(time.monotonic()-started,3),'whole_book_fidelity':False,'public_use_clearance':False,
 'semantic_pilot_executed':False,'candidate_mutations':False,'generation_adapter_implemented':False}
result={'schema':1,'captured_at':now(),'purpose':'Source-only desk audit; not DIST-02 retrieval feasibility completion',
 'catalogue_sha256':inputs[str((SITE/'.local/data-analysis/website-candidates.json').resolve())]['sha256'],
 'selected_runs':catalogue['selectedRuns'],'historical_section_run':RUN,'historical_query_plan':plan,
 'bounds':{'file_bytes':MAX_FILE,'unique_input_bytes':MAX_BYTES,'seconds':MAX_SECONDS,'reader_pages_per_copy':300},
 'source_dependencies':provenance,'summary':summary,'records':records,'inputs':inputs,
 'limits':['No current corpus, vector/index or graph was opened.','Reader results are retained files, not new browser interaction tests.',
 'Declared historical identities and empty quality flags are not source certification.','Distinct hashes, cards and representations are not independent witnesses.',
 'Active-generation dependencies and candidate fingerprint adapter remain open.','No source repairs, curation writes, integration or publication.']}
write_new('audit.json',result)
print(json.dumps(summary,ensure_ascii=True))
