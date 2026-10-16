"""LA-04 source-bound metadata application; never runs intake or an encoder."""
import argparse
import hashlib
import json
import os
import uuid
from collections import Counter
from pathlib import Path
from .build import PROJECT,readonly,dump,now
from .inputs import Inputs,digest,packed
from .jobs import JobStore,background_priority
from ..library_identity import IDENTITY_FILE,CONTRIBUTOR_FILE,load_identities,load_contributors,fill_identity


def read(path):return json.loads(Path(path).read_text(encoding='utf-8-sig'))
def sha(raw):return hashlib.sha256(raw).hexdigest()
def encoded(value):return (json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n').encode('utf-8')


def release_inputs(project):
    out=project/'KnowledgeBase/library-analytics';pointer=read(out/'latest-refinement.json');folder=Path(pointer['release'])
    manifest=read(folder/'release_manifest.json');names={r['name']:r for r in manifest['files']}
    result={}
    for name in ('correction-batch.jsonl','contributor_resolutions.jsonl'):
        raw=(folder/name).read_bytes();proof=names[name]
        if len(raw)!=proof['bytes'] or sha(raw)!=proof['sha256']:raise ValueError('Changed accepted release: '+name)
        result[name]=[json.loads(line) for line in raw.decode('utf-8-sig').splitlines()]
    return pointer,result


def prepare(project=PROJECT):
    project=Path(project);site=project/'Website';pointer,released=release_inputs(project)
    warehouse=read(project/'KnowledgeBase/library-analytics/latest.json')['database']
    inputs=Inputs(project,warehouse);db=readonly(Path(pointer['database']));canonical_cache={}
    def canonical(kind,ident):
        key=(kind,ident)
        if key not in canonical_cache:canonical_cache[key]=inputs.canonical(kind,ident)
        return canonical_cache[key]
    try:
        source_preimages={str((site/name).resolve()):sha((site/name).read_bytes()) if (site/name).exists() else None for name in (IDENTITY_FILE,CONTRIBUTOR_FILE)}
        inputs.prefetch_readers()
        candidates={}
        for row in db.execute("SELECT c.result_json FROM correction_candidates c JOIN run_jobs r ON r.job_id=c.job_id WHERE r.run_id=? AND c.state='accepted'",(pointer['run_id'],)):
            value=json.loads(row[0]);candidates[(value['target_layer'],value['target_id'],value['field'])]=value
        existing=load_identities(site);fills={k:dict(v) | {'fields':dict(v['fields'])} for k,v in existing.items()};dispositions=[]
        from .identities import validate_candidate
        for patch in released['correction-batch.jsonl']:
            layer,ident=patch['target']['layer'],patch['target']['id'];key=(layer,ident,patch['field']);old=candidates[key]
            target=inputs.current(layer,ident);other=inputs.current('reader' if layer=='corpus' else 'corpus',old['example_evidence_record'])
            current=validate_candidate(old | {'state':'unique-proposal'},target,other,canonical)
            status=current['state'];reason=current['reason'];original=patch['target']['original_sha256']
            if status=='accepted':
                if target['fingerprint']!=patch['target']['fingerprint'] or other['fingerprint']!=patch['counterpart_fingerprint']:
                    status,reason='stale','record-fingerprint-changed'
                elif any(current['canonical_evidence'].get(k)!=v for k,v in patch['canonical_evidence'].items()):
                    status,reason='stale','canonical-evidence-changed'
            if status in ('accepted','already-correct'):
                fields={'workId':current['work_id']}
                if current.get('edition_id'):fields['editionId']=current['edition_id']
                previous=fills.get(original)
                durable=existing.get(original)
                was_registered=bool(durable) and all(durable['fields'].get(k)==v for k,v in fields.items())
                if previous and any(previous['fields'].get(k) not in (None,v) for k,v in fields.items()):
                    status,reason='rejected','durable-identity-conflict'
                else:
                    fills.setdefault(original,{'sha256':original,'fields':{},'basis':'same-recorded-original-hash + validated canonical binding','refinementRun':pointer['run_id']})['fields'].update(fields)
                    if status=='accepted' and was_registered:
                        status,reason='registered','existing-durable-identity-fill'
            dispositions.append({'target_layer':layer,'target_id':ident,'sha256':original,'field':patch['field'],
                'new_value':patch['new_value'],'state':status,'reason':reason})
        authorities=read(site/CONTRIBUTOR_FILE) if (site/CONTRIBUTOR_FILE).exists() else {'schemaVersion':1,'records':[]}
        authority_rows={r['id']:r for r in authorities['records']};contributor_results=[]
        for resolution in released['contributor_resolutions.jsonl']:
            ident=resolution['contributor_id'];current=inputs.author_rows.get(ident,[])
            expected=[r['record'] for r in resolution['evidence']]
            matches=[r for r in current if r['record'] in expected]
            if len(matches)!=1 or len({packed(r['record']) for r in current})!=1:
                contributor_results.append({'id':ident,'state':'unresolved','reason':'changed-or-ambiguous-source-authority'});continue
            selected=matches[0];row={'id':ident,'authority':str(Path(selected['path']).relative_to(site)).replace('\\','/'),
                'sourceRecord':selected['record'],'recordSha256':digest(selected['record'])}
            previous=authority_rows.get(ident)
            if previous and previous!=row:raise ValueError('Contributor source override conflict: '+ident)
            authority_rows[ident]=row;contributor_results.append({'id':ident,'state':'registered' if previous else 'accepted',
                'entity_type':selected['record'].get('entityType'),'eligibility':selected['record'].get('eligibility')})
        if inputs.versions()!=inputs.initial_versions or inputs.changed_files():raise ValueError('Inputs changed during preparation')
        return {'refinement_run':pointer['run_id'],'identity_source':{'schemaVersion':1,'records':[fills[k] for k in sorted(fills)]},
            'contributor_source':{'schemaVersion':1,'records':[authority_rows[k] for k in sorted(authority_rows)]},
            'fields':dispositions,'contributors':contributor_results,'dependencies':inputs.dependencies,'source_preimages':source_preimages}
    finally:inputs.close();db.close()


def package_updates(folder,corrections,authorities,preimages=None):
    """Only identity fields and six source-verified contributor metadata entries."""
    folder=Path(folder);updates={};membership={k:[] for k in authorities}
    def snapshot(path):
        raw=path.read_bytes()
        if preimages is not None:preimages[path.resolve()]=sha(raw)
        return json.loads(raw.decode('utf-8-sig'))
    if not (folder/'records').is_dir():return updates,{'records':0,'fields':0,'contributors':0}
    changed_records=changed_fields=0
    for path in sorted((folder/'records').glob('*.json')):
        data=snapshot(path);dirty=False
        for ident,record in data.items():
            after=fill_identity(record,corrections)
            differences={k for k in set(record)|set(after) if record.get(k)!=after.get(k)}
            if differences-{'workId','editionId'}:raise ValueError('Protected reader field changed')
            if differences:data[ident]=after;dirty=True;changed_records+=1;changed_fields+=len(differences)
            for cid in set(record.get('contributors',[])) & authorities.keys():membership[cid].append(after)
        if dirty:updates[path]=encoded(data)
    catalogue_path=folder/'catalogue.json';catalogue=snapshot(catalogue_path);entries={r['id']:r for r in catalogue['contributors']};changed_contributors=0
    packed_shelves={}
    for ident,a in authorities.items():
        rows=membership[ident]
        if not rows:continue
        value=dict(entries.get(ident,{}));old=dict(value)
        value.update({'id':ident,'name':a['name'],'entityType':a.get('entityType'),'eligibility':a.get('eligibility'),
            'traditions':a.get('traditions',[]),'side':'preachers' if a.get('eligibility')=='eligible' else 'scholars',
            'records':len(rows),'readable':sum(r['availability']=='on-site-text' for r in rows)})
        value.setdefault('profileId',None);value.setdefault('roles',[])
        if value!=old:changed_contributors+=1
        entries[ident]=value
        shelf=[{k:r[k] for k in ('id','title','language','source','availability','genre')} for r in sorted(rows,key=lambda r:r['id'])]
        if catalogue.get('storage')=='packed-v1':
            shard=hashlib.sha256(ident.encode()).hexdigest()[:2];path=folder/'contributors'/(shard+'.json')
            if path not in packed_shelves:
                packed_shelves[path]=snapshot(path) if path.exists() else {}
                if preimages is not None and not path.exists():preimages[path.resolve()]=None
            packed_shelves[path][ident]=shelf
        else:
            path=folder/'contributors'/(ident+'.json');updates[path]=encoded(shelf)
            if preimages is not None:preimages[path.resolve()]=sha(path.read_bytes()) if path.exists() else None
    for path,value in packed_shelves.items():updates[path]=encoded(value)
    catalogue['contributors']=sorted(entries.values(),key=lambda c:c['name'].casefold())
    if changed_contributors:updates[catalogue_path]=encoded(catalogue)
    return {p:raw for p,raw in updates.items() if not p.exists() or p.read_bytes()!=raw},{'records':changed_records,'fields':changed_fields,'contributors':changed_contributors}


def allowed(project,path):
    site=project/'Website';path=path.resolve()
    if path in {(site/IDENTITY_FILE).resolve(),(site/CONTRIBUTOR_FILE).resolve()}:return True
    for base in (site/'public/content/teacher-library',site/'.local/teacher-library-unpacked'):
        if path==base/'catalogue.json':return True
        if path.parent in (base/'records',base/'contributors') and path.suffix=='.json':return True
    return False


def durable_write(path,raw):
    """Fresh recovery files need no replacement of a file held by a Windows reader."""
    with Path(path).open('xb') as stream:
        stream.write(raw);stream.flush();os.fsync(stream.fileno())


def checkpoint(folder,row):
    with (folder/'file-events.jsonl').open('ab') as stream:
        stream.write(encoded({'path':row['path'],'state':row['state'],'at':now()}))
        stream.flush();os.fsync(stream.fileno())


def publish(project,folder,updates,expected=None):
    journal=[];(folder/'before').mkdir(parents=True);(folder/'after').mkdir()
    for number,(path,raw) in enumerate(sorted(updates.items(),key=lambda item:str(item[0]))):
        path=path.resolve()
        if not allowed(project,path):raise ValueError('Unowned application path: '+str(path))
        old=path.read_bytes() if path.exists() else None;name=str(number)+'.bin'
        if expected is not None and (sha(old) if old is not None else None)!=expected[path]:raise ValueError('Metadata changed since preparation: '+str(path))
        if old is not None:(folder/'before'/name).write_bytes(old)
        (folder/'after'/name).write_bytes(raw)
        journal.append({'path':str(path),'backup':name,'before_sha256':sha(old) if old is not None else None,'after_sha256':sha(raw),'state':'prepared'})
    durable_write(folder/'file-journal.json',encoded(journal))
    try:
        for row in journal:
            path=Path(row['path']);current=sha(path.read_bytes()) if path.exists() else None
            if current!=row['before_sha256']:raise ValueError('Source changed before application: '+str(path))
        for row in journal:
            path=Path(row['path']);current=sha(path.read_bytes()) if path.exists() else None
            if current!=row['before_sha256']:raise ValueError('Concurrent metadata writer: '+str(path))
            path.parent.mkdir(parents=True,exist_ok=True);temp=path.with_name(path.name+'.la04-'+uuid.uuid4().hex)
            temp.write_bytes((folder/'after'/row['backup']).read_bytes());os.replace(temp,path)
            row['state']='applied';checkpoint(folder,row)
    except BaseException:
        rollback(project,folder);raise
    return journal


def rollback(project,folder):
    project=Path(project).resolve();folder=Path(folder).resolve()
    if not folder.is_relative_to(project/'KnowledgeBase/library-analytics/pipeline/applications'):raise ValueError('Unowned rollback directory')
    journal=read(folder/'file-journal.json');conflicts=[];event_errors=[]
    rows={r['path']:r for r in journal};events=folder/'file-events.jsonl'
    if events.exists():
        for line in events.read_bytes().splitlines():
            try:event=json.loads(line)
            except (ValueError,UnicodeDecodeError):continue
            if event.get('path') in rows:rows[event['path']]['state']=event['state']
    for row in reversed(journal):
        path=Path(row['path']).resolve()
        if not allowed(project,path):raise ValueError('Unowned rollback path')
        actual=sha(path.read_bytes()) if path.exists() else None
        if actual==row['before_sha256']:row['state']='rolled-back';continue
        if actual!=row['after_sha256']:
            if row['state']=='prepared':row['state']='untouched-external-change'
            else:conflicts.append(str(path));row['state']='rollback-conflict'
            try:checkpoint(folder,row)
            except OSError as error:event_errors.append(str(error))
            continue
        if row['before_sha256'] is None:path.unlink()
        else:
            raw=(folder/'before'/row['backup']).read_bytes()
            if sha(raw)!=row['before_sha256']:raise ValueError('Changed rollback backup')
            temp=path.with_name(path.name+'.la04-rollback-'+uuid.uuid4().hex);temp.write_bytes(raw);os.replace(temp,path)
        row['state']='rolled-back'
        try:checkpoint(folder,row)
        except OSError as error:event_errors.append(str(error))
    # Recovery never depends on replacing or being able to append to the journal.
    for row in journal:
        if row['state']=='rolled-back':
            path=Path(row['path']);actual=sha(path.read_bytes()) if path.exists() else None
            if actual!=row['before_sha256']:raise ValueError('Rollback verification mismatch: '+str(path))
    durable_write(folder/('rollback-'+uuid.uuid4().hex+'.json'),encoded({'files':journal,'conflicts':conflicts,'event_errors':event_errors}))
    if conflicts:raise ValueError('Rollback preserved subsequent edits: '+packed(conflicts))
    return journal


def run(project=PROJECT,apply=False):
    project=Path(project).resolve();background_priority();out=project/'KnowledgeBase/library-analytics';root=out/'pipeline'
    shared=JobStore(root/'pipeline.sqlite3');inputs=None
    try:
        shared.acquire();plan=prepare(project);site=project/'Website'
        run_id='la04-'+now().replace(':','').replace('-','').replace('.','');folder=root/'applications'/run_id;folder.mkdir(parents=True)
        dump(folder/'application-plan.json',plan)
        corrections={r['sha256']:r for r in plan['identity_source']['records']}
        authorities={r['id']:r['sourceRecord'] for r in plan['contributor_source']['records']}
        updates={site/IDENTITY_FILE:encoded(plan['identity_source']),site/CONTRIBUTOR_FILE:encoded(plan['contributor_source'])};packages={}
        preimages={Path(k):v for k,v in plan['source_preimages'].items()}
        for base in (site/'public/content/teacher-library',site/'.local/teacher-library-unpacked'):
            changes,counts=package_updates(base,corrections,authorities,preimages);updates.update(changes);packages[str(base)]=counts
        updates={p:raw for p,raw in updates.items() if not p.exists() or p.read_bytes()!=raw}
        protected=project/'KnowledgeBase/embedding-progress.json';vector_status_sha=sha(protected.read_bytes()) if protected.exists() else None
        corpus=readonly(project/'KnowledgeBase/knowledge.sqlite3');version=corpus.execute('PRAGMA data_version').fetchone()[0]
        try:
            if apply:
                for name,proof in plan['dependencies'].items():
                    path=Path(name);actual=sha(path.read_bytes()) if path.exists() else 'missing'
                    if actual!=proof['sha256']:raise ValueError('Accepted evidence changed before publication: '+name)
            journal=publish(project,folder,updates,preimages) if apply else []
            if apply:
                load_identities(site);load_contributors(site)
                for row in journal:
                    if sha(Path(row['path']).read_bytes())!=row['after_sha256']:raise ValueError('Application post-image mismatch')
                for base in (site/'public/content/teacher-library',site/'.local/teacher-library-unpacked'):
                    remaining,_=package_updates(base,corrections,authorities)
                    if remaining:raise ValueError('Repeated metadata application is not idempotent')
            if corpus.execute('PRAGMA data_version').fetchone()[0]!=version:raise ValueError('Live corpus changed during metadata application')
            if protected.exists() and sha(protected.read_bytes())!=vector_status_sha:raise ValueError('Embedding state changed during metadata application')
        except BaseException:
            if apply and (folder/'file-journal.json').exists():rollback(project,folder)
            raise
        finally:corpus.close()
        counts=Counter(r['state'] for r in plan['fields']);layers={}
        for layer in ('reader','corpus'):layers[layer]=dict(Counter(r['state'] for r in plan['fields'] if r['target_layer']==layer))
        result={'run_id':run_id,'state':'complete' if apply else 'prepared','checked_at':now(),'refinement_run':plan['refinement_run'],
            'source_identity_records':len(corrections),'field_dispositions':dict(counts),'field_dispositions_by_layer':layers,
            'contributors':plan['contributors'],'packages':packages,'changed_files':len(journal),'planned_files':len(updates),
            'live_corpus_fields_applied':0,'corpus_fields_registered_for_owned_intake':sum(r['target_layer']=='corpus' and r['state'] in ('accepted','registered','already-correct') for r in plan['fields']),
            'corpus_unchanged':True,'embedding_progress_unchanged':True,'intake_started':False,'release':str(folder),
            'limits':['Corpus metadata is not changed here; source-bound fills are consumed by the existing intake owner on its next authorized run.',
                'Reader availability, page bundles, source credits, rights, contributor memberships and biographies are preserved.',
                'Earlier analytical releases remain dated immutable snapshots; changed reader metadata needs a future metadata refresh.']}
        dump(folder/'summary.json',result)
        if apply:dump(out/'latest-metadata-application.json',{'run_id':run_id,'state':result['state'],'summary':str(folder/'summary.json'),'release':str(folder)})
        print(json.dumps(result,ensure_ascii=True),flush=True);return result
    finally:shared.close()


def inspect(project=PROJECT):
    project=Path(project);out=project/'KnowledgeBase/library-analytics'
    pointer=json.loads((out/'latest-refinement.json').read_text(encoding='utf-8-sig'))
    rows=[json.loads(line) for line in (Path(pointer['release'])/'correction-batch.jsonl').read_text(encoding='utf-8-sig').splitlines()]
    counts=Counter((r['target']['layer'],r['field'],r['route'],bool(r['validated_edition_id'])) for r in rows)
    print(json.dumps({'run_id':pointer['run_id'],'fields':len(rows),'targets':len({(r['target']['layer'],r['target']['id']) for r in rows}),
        'originals':len({r['target']['original_sha256'] for r in rows}),
        'counts':[{'layer':k[0],'field':k[1],'route':k[2],'has_edition':k[3],'fields':n} for k,n in counts.items()],
        'samples':[{k:r[k] for k in ('target','field','new_value','validated_work_id','validated_edition_id','counterpart')} for r in rows[:3]]},ensure_ascii=True))


def verify(project,folder):
    """Check the actual application against its saved originals and current owners."""
    project=Path(project).resolve();folder=Path(folder).resolve();site=project/'Website'
    if not folder.is_relative_to(project/'KnowledgeBase/library-analytics/pipeline/applications'):raise ValueError('Unowned verification directory')
    result=read(folder/'summary.json');journal=read(folder/'file-journal.json')
    corrections=load_identities(site);authorities=load_contributors(site);counts=Counter()
    for row in journal:
        path=Path(row['path']).resolve()
        if not allowed(project,path):raise ValueError('Unowned verification path')
        raw=path.read_bytes()
        if sha(raw)!=row['after_sha256']:raise ValueError('Changed application output: '+str(path))
        staged=(folder/'after'/row['backup']).read_bytes()
        if sha(staged)!=row['after_sha256']:raise ValueError('Changed staged output')
        before=None
        if row['before_sha256'] is not None:
            saved=(folder/'before'/row['backup']).read_bytes()
            if sha(saved)!=row['before_sha256']:raise ValueError('Changed saved original')
            before=json.loads(saved)
        after=json.loads(raw)
        if path.parent.name=='records':
            if set(before)!=set(after):raise ValueError('Reader membership changed')
            label='packed' if path.is_relative_to(site/'public') else 'unpacked'
            for ident,old in before.items():
                new=after[ident];diff={k for k in set(old)|set(new) if old.get(k)!=new.get(k)}
                if diff-{'workId','editionId'}:raise ValueError('Protected reader metadata changed: '+ident)
                if diff:
                    if new!=fill_identity(old,corrections):raise ValueError('Unregistered reader identity change')
                    counts[label+'_changed_records']+=1;counts[label+'_changed_fields']+=len(diff)
        elif path.name=='catalogue.json':
            if {k:v for k,v in before.items() if k!='contributors'}!={k:v for k,v in after.items() if k!='contributors'}:raise ValueError('Catalogue contract changed')
            old={r['id']:r for r in before['contributors']};new={r['id']:r for r in after['contributors']}
            if set(old)-set(new) or (set(new)-set(old))-authorities.keys():raise ValueError('Unrelated catalogue membership changed')
            for ident,value in old.items():
                if ident not in authorities and new[ident]!=value:raise ValueError('Unrelated contributor changed')
        elif path.parent.name=='contributors' and isinstance(after,dict):
            old=before or {}
            if set(old)-set(after) or (set(after)-set(old))-authorities.keys():raise ValueError('Unrelated shelf membership changed')
            if any(value!=after.get(ident) for ident,value in old.items() if ident not in authorities):raise ValueError('Unrelated shelf changed')
    packages={}
    for base in (site/'public/content/teacher-library',site/'.local/teacher-library-unpacked'):
        pending,_=package_updates(base,corrections,authorities)
        if pending:raise ValueError('Metadata application is not idempotent')
        catalogue={r['id']:r for r in read(base/'catalogue.json')['contributors']};members=Counter()
        for path in (base/'records').glob('*.json'):
            for record in read(path).values():
                for ident in set(record.get('contributors',[])) & authorities.keys():members[ident]+=1
        for ident,authority in authorities.items():
            if catalogue[ident]['records']!=members[ident]:raise ValueError('Contributor membership count changed')
            for key in ('name','entityType','eligibility','traditions'):
                expected=authority.get(key,[] if key=='traditions' else None)
                if catalogue[ident][key]!=expected:raise ValueError('Contributor authority mismatch')
        packages[str(base)]=dict(members)
    import importlib.util
    spec=importlib.util.spec_from_file_location('la04_teacher_owner',site/'scripts/teacher_identity_overrides.py')
    owner=importlib.util.module_from_spec(spec);spec.loader.exec_module(owner);merged=owner.load_overrides(site)
    legacy=read(site/'content/teachers/edition-identities.json')['records']
    if any(merged[r['sha256']]['credits']!=r['credits'] or any(merged[r['sha256']]['fields'][k]!=v for k,v in r['fields'].items()) for r in legacy):raise ValueError('Legacy identity or credit changed')
    receipt={'run_id':result['run_id'],'verified_at':now(),'verified_files':len(journal),'reader_changes':dict(counts),
        'contributor_memberships':packages,'legacy_overrides_preserved':len(legacy),'owner_override_hashes':len(merged),
        'source_identity_hashes':len(corrections),'protected_reader_metadata_preserved':True,'idempotent_packages':True,
        'live_corpus_fields_applied':0,'corpus_fields_registered_for_owned_intake':result['corpus_fields_registered_for_owned_intake']}
    durable_write(folder/('verification-'+uuid.uuid4().hex+'.json'),encoded(receipt))
    print(json.dumps(receipt),flush=True);return receipt


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--project',type=Path,default=PROJECT)
    commands=parser.add_mutually_exclusive_group(required=True);commands.add_argument('--inspect',action='store_true');commands.add_argument('--prepare',action='store_true');commands.add_argument('--apply',action='store_true');commands.add_argument('--rollback',type=Path);commands.add_argument('--verify',type=Path)
    args=parser.parse_args()
    if args.inspect:inspect(args.project)
    elif args.verify:verify(args.project,args.verify)
    elif args.rollback:
        rows=rollback(args.project,args.rollback)
        print(json.dumps({'verified_files':len(rows),'states':dict(Counter(r['state'] for r in rows))}))
    else:run(args.project,apply=args.apply)
