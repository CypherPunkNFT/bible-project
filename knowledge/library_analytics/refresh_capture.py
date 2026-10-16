"""Capture immutable held-input batches under refresh; never edit originals."""
from collections import Counter,defaultdict
import gzip
import json
import sys
import sqlite3
import unicodedata
from importlib.metadata import version
from pathlib import Path
from .build import PROJECT,readonly
from .inputs import packed,digest
from . import section_alignment as sa
from . import concept_contract as cx,relationship_contract as rx,relationship_cocitations as joint
from .section_contract import checked_bytes
from .refresh_contract import atomic_json,hash_file,VERSION
from .refresh_environment import DEPENDENCIES,bootstrap
bootstrap()

def code_identity():
    root=Path(__file__).parent;common=['refresh_contract.py','refresh_processors.py','refresh.py','refresh_environment.py','inputs.py','jobs.py']
    groups={
      'sections':['section_catalog.py','section_contract.py','xml_bridge.py','structure.py'],
      'alignment':['section_alignment.py','alignment_contract.py','section_contract.py'],
      'concepts':['concept_index.py','concept_contract.py','concept_matcher_fast.py','references.py','normalize.py','section_contract.py','../enrichment/citations.py'],
      'relationships':['relationship_miner.py','relationship_contract.py','relationship_cocitations.py','section_contract.py']}
    return {k:{f:hash_file(root/f) for f in fs+common} for k,fs in groups.items()}

def query_identity():
    root=Path(__file__).parent
    return {f:hash_file(root/f) for f in ['concept_query.py','../enrichment/foundation.py']}

def runtime_identity():
    return {'python':sys.version,'sqlite':sqlite3.sqlite_version,'unicode':unicodedata.unidata_version,
            'lxml':version('lxml'),'beautifulsoup4':version('beautifulsoup4'),
            'typing_extensions':version('typing_extensions'),'typing_extensions_sha256':hash_file(DEPENDENCIES/'typing_extensions.py')}

def frozen_write(path,value):
    path=Path(path);raw=packed(value).encode()
    if path.exists():
        if gzip.decompress(path.read_bytes())!=raw:raise ValueError('Immutable capture already exists with different inputs')
    else:
        path.parent.mkdir(parents=True,exist_ok=True)
        temp=path.with_suffix('.tmp');temp.write_bytes(gzip.compress(raw,mtime=0));temp.replace(path)
    return {'path':str(path),'sha256':hash_file(path),'semantic_sha256':digest(value)}

def capture(root,cache_count=1000,entry_count=1000):
    root=Path(root);base=root.parent
    pointers={}
    for stage,file in [('sections',base/'latest-sections.json'),('alignment',base/'alignment/latest-alignment.json'),('concepts',base/'concepts/latest-concepts.json'),('relationships',base/'relationships/latest-relationships.json')]:
        p=json.loads(file.read_text('utf-8-sig'));manifest=Path(p['release'])/'release_manifest.json'
        m=json.loads(manifest.read_text('utf-8-sig'));proof=next(x for x in m['files'] if x.get('path',x.get('name'))=='summary.json')
        if hash_file(p['summary'])!=proof['sha256']:raise ValueError('Selected summary does not match immutable release')
        pointers[stage]={**p,'manifest_sha256':hash_file(manifest),'summary_sha256':hash_file(p['summary'])}
    sections=readonly(Path(pointers['sections']['database']))
    alignment=readonly(Path(pointers['alignment']['database']))
    section_summary=json.loads(Path(pointers['sections']['summary']).read_text('utf-8-sig'))
    alignment_summary=json.loads(Path(pointers['alignment']['summary']).read_text('utf-8-sig'))
    if alignment_summary['contract']['section_run']!=pointers['sections']['run_id']:raise ValueError('Incompatible historical inputs')
    text=readonly(Path(section_summary['contract']['text_bundle']['database']))
    parser=json.loads(text.execute('SELECT parser_json FROM text_runs WHERE id=?',(section_summary['contract']['text_bundle']['run_ids'][0],)).fetchone()[0]);text.close()
    snapshot=sa.Snapshot(PROJECT)
    if snapshot.corpus_build!=alignment_summary['contract']['corpus_build']:raise ValueError('Corpus differs from pinned historical build')
    support=[dict(r) for r in sections.execute("SELECT * FROM research_scope WHERE run_id=? AND disposition='supported' ORDER BY document_id",(pointers['sections']['run_id'],))]
    # Preserve the full historical calibration strata, then deterministic
    # source/format/language sampling. This scope is frozen before execution.
    cal=sections.execute("SELECT id FROM research_runs WHERE id LIKE '%calibration' AND state='complete' ORDER BY created_at DESC LIMIT 1").fetchone()
    selected=set(r[0] for r in sections.execute("SELECT document_id FROM research_scope WHERE run_id=? AND disposition='supported'",(cal[0],))) if cal else set()
    strata=Counter();extra=50;counts=Counter()
    for r in support:
        d=json.loads(r['descriptor_json']);key=(r['adapter'],Path(d.get('source_path','')).suffix,d.get('language'),d.get('source_family'))
        strata[key]+=1
        if strata[key]<=2:selected.add(r['document_id'])
    for r in sorted(support,key=lambda r:digest(r['document_id'])):
        adapter=r['adapter'];maximum=cache_count+extra if adapter=='cache' else entry_count
        if counts[adapter]<maximum:selected.add(r['document_id']);counts[adapter]+=1
    selected_rows=[r for r in support if r['document_id'] in selected]
    # XML/source group ordering amortizes native dictionary parsing.
    selected_rows.sort(key=lambda r:(json.loads(r['descriptor_json']).get('xml_link',{}).get('asset_path',''),r['document_id']))
    items=[];source_proofs={};work=__import__('sqlite3').connect(':memory:');work.row_factory=__import__('sqlite3').Row
    work.executescript(sa.SCHEMA)
    try:
        for n,r in enumerate(selected_rows):
            d=json.loads(r['descriptor_json']);sources=[]
            candidates=[]
            if d.get('xml_link'):candidates=[(d['xml_link']['asset_path'],d['xml_link']['asset_sha256'])]
            else:
                candidates=[(d['cache_path'],d['cache_expected_sha256'])]
                if Path(d['source_path']).suffix.lower() in ('.xml','.html','.htm','.xhtml','.epub') and d.get('original_sha256'):candidates.append((d['source_path'],d['original_sha256']))
            for path,expected in candidates:
                if path not in source_proofs:
                    _,p=checked_bytes(path,expected);source_proofs[path]={'path':p[0],'sha256':p[1],'bytes':p[2]}
                if source_proofs[path]['sha256']!=expected:raise ValueError('Source collision')
                sources.append(source_proofs[path])
            record,chunks,binding=snapshot.current_document(d)
            original=d.get('original_sha256') or d.get('xml_link',{}).get('asset_sha256')
            readers=[]
            for row in alignment.execute('SELECT * FROM reader_records INDEXED BY reader_original WHERE run_id=? AND original_sha256=? ORDER BY reader_id',(pointers['alignment']['run_id'],original)):
                rec=json.loads(row['record_json']);blocks=[]
                if rec.get('availability')=='on-site-text' and rec.get('pages'):
                    blocks=snapshot.reader_blocks(work,'capture',rec)
                readers.append({'record':rec,'blocks':blocks,'path':row['path'],'file_sha256':row['file_sha256']})
            items.append({'descriptor':d,'adapter':r['adapter'],'sources':sources,'corpus':{'record':record,'chunks':chunks,'binding':binding},'readers':readers})
            if n%100==0:print(packed({'phase':'capture','documents':n,'expected':len(selected_rows)}),flush=True)
        snapshot.unchanged_corpus()
        config={'version':VERSION,'code':code_identity(),'rules':cx.ruleset(PROJECT),'parser':parser,
                'relationships':rx.CONFIG,'joint':joint.CONFIG,'window_codepoints':cx.WINDOW,
                'reader_code':[{'path':p[0],'sha256':p[1]} for p in snapshot.reader_code],
                'query_code':query_identity(),'runtime':runtime_identity(),
                'reviews':{'state':'candidate-only','interpretation':'No transferred semantic review or public eligibility'},
                'parents':pointers,'corpus_build':snapshot.corpus_build}
        # Real held-input refresh changes selected membership, not original
        # bodies or fabricated source metadata. Failure/change fixtures are
        # independently created under the private disposable test directory.
        order=sorted(items,key=lambda x:digest(x['descriptor']['document_id']))
        removed=order[:50];added=order[-100:];common=order[50:-100]
        base_batch={'config':config,'items':common+removed,'scope':{'type':'held representative refresh population','source_population':len(support),'outside_declared_population':len(support)-len(common+removed),'selection':'all historical calibration strata plus deterministic cache/XML sample; membership baseline'}}
        target_batch={'config':config,'items':common+added,'scope':{'type':'held representative refresh population','source_population':len(support),'outside_declared_population':len(support)-len(common+added),'selection':'same fixed scope with 100 held additions and 50 membership removals; originals unchanged'}}
        inputs=root/'inputs'
        receipts={'baseline':frozen_write(inputs/('baseline-'+digest(base_batch)[:24]+'.json.gz'),base_batch),'target':frozen_write(inputs/('target-'+digest(target_batch)[:24]+'.json.gz'),target_batch),
                  'baseline_documents':len(base_batch['items']),'target_documents':len(target_batch['items']),'common':len(common),'added':len(added),'removed':len(removed),
                  'captured_source_bytes':sum(p['bytes'] for p in source_proofs.values()),'source_files':len(source_proofs),'parents':pointers,
                  'strata':[{'adapter':k[0],'suffix':k[1],'language':k[2],'family':k[3],'available':v} for k,v in strata.items()]}
        atomic_json(root/'capture.json',receipts);return receipts
    finally:sections.close();alignment.close();snapshot.close();work.close()
