"""Private publication and one CPU monitor, independent of the embedding watchdog."""
import json
import os
import shutil
import sqlite3
import time
from contextlib import closing
from pathlib import Path
from .core import Graph, checksum, dumps, identity, now, readonly, writer_lock
from ..settings import write_json


def read(path, default=None):
    return json.loads(Path(path).read_text('utf-8-sig')) if Path(path).exists() else default


def production_gate(config):
    state=config['state_dir']; coordination=state/'campaign-coordination'
    summary=read(coordination/'summary.json',{}); completion=read(state/'intake-completion.json',{}); embedding=read(state/'embedding-progress.json',{})
    handoffs=read(coordination/'published-handoffs.json',{}); verify=completion.get('verification',{})
    reasons=[]; build=verify.get('corpus_build')
    if summary.get('state')!='verified_complete': reasons.append('campaign coordinator has not verified completion')
    if completion.get('state')!='complete' or not verify.get('complete') or not verify.get('enrichment_ready'): reasons.append('intake verification incomplete')
    if embedding.get('state')!='complete' or embedding.get('remaining')!=0 or embedding.get('corpus_build')!=build: reasons.append('embedding completion/build parity pending')
    if not handoffs.get('preparationPublished') or handoffs.get('conflicts'): reasons.append('preparation handoffs unpublished or conflicting')
    if 'explicitTextDeferrals' not in handoffs or any(r.get('status')!='deferred_scan' for r in handoffs.get('explicitTextDeferrals',[])): reasons.append('explicit text deferrals not verified')
    for field in ('missing_vectors','stale_vectors','duplicate_vectors','foreign_key_errors','missing_library_files_since_snapshot','new_library_files_since_snapshot','changed_library_ledgers_since_snapshot','new_source_files_since_snapshot','changed_source_inputs_since_snapshot','missing_source_inputs_since_snapshot'):
        if verify.get(field,0): reasons.append(field+' is nonzero')
    if verify.get('sqlite_integrity')!='ok' or not verify.get('embedding_identity_matches') or verify.get('chunks')!=verify.get('vectors'): reasons.append('reported integrity/vector parity failed')
    if reasons: return dict(ready=False,reasons=reasons,corpusBuild=build)
    # No live DB handle is opened while waiting. Once status is ready, independently
    # compare publication inputs/deferrals and build with the actual read-only DB.
    with closing(readonly(config['db'])) as db:
        actual=db.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
        if actual!=build: reasons.append('actual corpus build differs from completion')
        plan=read(coordination/'intake-plan.json',{})
        for entry in plan.get('inputs',[]):
            published=db.execute('SELECT sha256 FROM files WHERE path=?',(entry['path'],)).fetchone()
            if not published or published[0]!=entry['sha256'] or checksum(entry['path'])!=entry['sha256']: reasons.append('changed/unpublished handoff: '+entry['path'])
        gaps=[dict(path=r[0],status=r[1]) for r in db.execute("SELECT path,status FROM library_files WHERE status IN ('error','unsupported','no_text','deferred_scan')")]
        if {dumps(r) for r in gaps}!={dumps(r) for r in handoffs['explicitTextDeferrals']}: reasons.append('actual text deferrals differ')
        for move in read(coordination/'archive-moves.json',{}).get('approvedMoves',[]):
            if db.execute('SELECT 1 FROM library_files WHERE sha256=?',(move['sha256'],)).fetchone() or db.execute('SELECT 1 FROM documents WHERE id=?',('library:text:'+move['sha256'],)).fetchone(): reasons.append('excluded archived body still published')
    return dict(ready=not reasons,reasons=reasons,corpusBuild=build,explicitTextDeferrals=handoffs['explicitTextDeferrals'])


def independent_parity(config,manifest):
    """Read one Lance version; never import an encoder or write vector state."""
    import lancedb
    state=config['state_dir']; graph=state/'graph-development'
    model={k:config['embedding'][k] for k in ('model','revision','dimensions','max_tokens')}
    if read(state/'embedding-model.json')!=model: raise RuntimeError('Embedding identity mismatch')
    vectors=lancedb.connect(str(config['vectors'])).open_table('passages').to_lance()
    # Disk-backed identity parity avoids two multi-million-entry Python sets.
    parity_path=graph/'parity-identities.sqlite3'
    with closing(sqlite3.connect(parity_path)) as audit:
        audit.execute('PRAGMA cache_size=-32768')
        audit.executescript('DROP TABLE IF EXISTS corpus_ids; DROP TABLE IF EXISTS vector_ids; CREATE TABLE corpus_ids(id TEXT PRIMARY KEY); CREATE TABLE vector_ids(id TEXT PRIMARY KEY);')
        with closing(readonly(manifest['corpusPath'])) as db:
            cursor=db.execute('SELECT id FROM chunks')
            while rows:=cursor.fetchmany(65536):
                audit.executemany('INSERT INTO corpus_ids VALUES(?)',rows); audit.commit()
        count=0
        for batch in vectors.to_batches(columns=['id'],batch_size=65536):
            ids=batch.column('id').to_pylist(); count+=len(ids)
            audit.executemany('INSERT OR IGNORE INTO vector_ids VALUES(?)',((id,) for id in ids)); audit.commit()
        chunks=audit.execute('SELECT count(*) FROM corpus_ids').fetchone()[0]
        unique=audit.execute('SELECT count(*) FROM vector_ids').fetchone()[0]
        missing=audit.execute('SELECT count(*) FROM corpus_ids c WHERE NOT EXISTS(SELECT 1 FROM vector_ids v WHERE v.id=c.id)').fetchone()[0]
        stale=audit.execute('SELECT count(*) FROM vector_ids v WHERE NOT EXISTS(SELECT 1 FROM corpus_ids c WHERE c.id=v.id)').fetchone()[0]
    result=dict(corpusBuild=manifest['corpusBuild'],chunks=chunks,vectors=count,missing=missing,stale=stale,duplicates=count-unique,
                modelIdentity=model,passed=not missing and not stale and count==unique,checkedAt=now(),lanceVersion=vectors.version)
    write_json(graph/'independent-parity.json',result)
    if not result['passed']: raise RuntimeError('Independent vector parity failed')
    return result


def publish(config,path,run,validation):
    with writer_lock(config['state_dir']):
        return _publish(config,path,run,validation)


def _publish(config,path,run,validation):
    root=config['state_dir']/'graph-development'
    if not validation.get('passed'): raise RuntimeError('Evidence validation failed; previous release retained')
    gate=production_gate(config)
    if not gate['ready']: raise RuntimeError('Production gate closed')
    db=Graph(path)
    try:
        record=db.db.execute('SELECT * FROM runs WHERE id=?',(run,)).fetchone()
        snapshot=json.loads(db.db.execute('SELECT manifest FROM snapshots WHERE id=?',(record['snapshot_id'],)).fetchone()[0])
        parity=read(root/'independent-parity.json',{})
        policy=read(root/'quality-policy.json',{})
        if record['mode']!='full' or record['state']!='extracted' or snapshot['corpusBuild']!=gate['corpusBuild'] or not parity.get('passed') or parity.get('corpusBuild')!=gate['corpusBuild'] or not policy.get('reviewComplete'):
            raise RuntimeError('Full extraction, independent parity and pilot quality review required')
        release=identity('release',run,validation,policy)
        metadata=dict(validation=validation,quality=policy,gate=gate,parity=parity,scope='PRIVATE; explicit evidence and labelled candidates',createdAt=now())
        db.db.execute('INSERT OR IGNORE INTO releases VALUES(?,?,?,?)',(release,run,1,dumps(metadata)))
        db.db.execute('INSERT OR IGNORE INTO release_membership SELECT ?,assertion_id FROM run_assertions WHERE run_id=?',(release,run)); db.db.commit()
        pointer=dict(releaseId=release,runId=run,graphPath=str(path),snapshotId=record['snapshot_id'],corpusBuild=gate['corpusBuild'],createdAt=now())
        current=root/'current-release.json'
        previous=read(current)
        if previous and previous.get('releaseId')!=release: write_json(root/'previous-release.json',previous)
        write_json(config['state_dir']/'enrichment-runs'/release.replace(':','-')/'manifest.json',pointer|metadata)
        write_json(current,pointer)
        return pointer
    finally: db.close()


def rollback(config):
    root=config['state_dir']/'graph-development'
    with writer_lock(config['state_dir']):
        previous=read(root/'previous-release.json')
        if not previous: raise RuntimeError('No previous private graph release')
        current=read(root/'current-release.json')
        write_json(root/'current-release.json',previous)
        if current: write_json(root/'previous-release.json',current)
        return previous


def report(config,monitor=None):
    root=config['state_dir']/'graph-development'; root.mkdir(parents=True,exist_ok=True)
    pilot=read(root/'latest-pilot.json',{}); full=read(root/'latest-full.json',{}); published=read(root/'current-release.json',{})
    latest=full or pilot; result=dict(updatedAt=now(),softwareImplemented=True,pilotTested=bool(pilot),fullCorpusScanned=bool(full),releaseValidated=bool(published),
        state='private_release_validated' if published else 'monitored_pending' if monitor else 'development',pilot=pilot,full=full,currentRelease=published,
        monitor=monitor or read(root/'monitor-state.json',{}),embedding=read(config['state_dir']/'embedding-progress.json',{}),
        progress=read(root/'run-progress.json',{}),quality=read(root/'quality-policy.json',{}),productionGate=production_gate(config),
        testResult=read(root/'tests.json',{}),coverage=dict(topicLanguage='English only',topicRules=24,interpretiveClaims='deferred',
        aliasResolution='unique full registry names or distinctive biblical names; ambiguous candidates retained',
        citations='literal named book chapter:verse, Roman numerals, lists/ranges; unknown edition/numbering remains unknown'),
        remainingUIIntegration='Add read-only local route using knowledge.enrichment.query.Tables; table evidence expansion then optional bounded paths. Existing service untouched.')
    cached=read(root/'summary.json',{})
    if latest and cached.get('countsRunId')==latest.get('runId'):
        for field in ('counts','validation','associationBounds','storage'):
            result[field]=cached.get(field,{})
    elif latest:
        db=readonly(latest['graphPath']); run=latest['runId']
        try:
            def groups(sql): return {r[0]:r[1] for r in db.execute(sql,(run,))}
            result['counts']=dict(assertionsByRelation=groups('SELECT a.relation,count(*) FROM assertions a JOIN run_assertions r ON r.assertion_id=a.id WHERE r.run_id=? GROUP BY a.relation'),
                assertionsByEvidenceClass=groups('SELECT a.basis,count(*) FROM assertions a JOIN run_assertions r ON r.assertion_id=a.id WHERE r.run_id=? GROUP BY a.basis'),
                observationsByMethod=groups('SELECT o.method,count(*) FROM observations o JOIN run_observations r ON r.observation_id=o.id WHERE r.run_id=? GROUP BY o.method'),
                unresolvedByReason=groups('SELECT reason,count(*) FROM candidates WHERE run_id=? GROUP BY reason'),
                entitiesByKind={r[0]:r[1] for r in db.execute('SELECT kind,count(*) FROM entities GROUP BY kind')},
                activeEntitiesByKind=groups('SELECT e.kind,count(*) FROM entities e JOIN run_entities r ON r.entity_id=e.id WHERE r.run_id=? GROUP BY e.kind'),
                eligibleDocumentsByLanguage=groups('SELECT language,count(*) FROM document_map WHERE run_id=? AND eligible=1 GROUP BY language'),
                eligibleDocuments=db.execute('SELECT count(*) FROM document_map WHERE run_id=? AND eligible=1',(run,)).fetchone()[0],
                documentsWithLocatedMatches=db.execute('SELECT count(DISTINCT document_id) FROM chunk_map WHERE run_id=?',(run,)).fetchone()[0],
                scannedDocuments=db.execute('SELECT count(*) FROM scan_counts WHERE run_id=?',(run,)).fetchone()[0],
                scannedChunks=db.execute('SELECT COALESCE(sum(chunks),0) FROM scan_counts WHERE run_id=?',(run,)).fetchone()[0],
                distinctKnownWorks=db.execute('SELECT count(DISTINCT work_id) FROM document_map WHERE run_id=?',(run,)).fetchone()[0],
                distinctKnownEditions=db.execute('SELECT count(DISTINCT edition_id) FROM document_map WHERE run_id=?',(run,)).fetchone()[0],
                duplicateWitnesses=db.execute("SELECT count(*) FROM document_witnesses WHERE run_id=? AND status='duplicate'",(run,)).fetchone()[0],
                originalWitnesses=db.execute('SELECT count(*) FROM document_witnesses WHERE run_id=?',(run,)).fetchone()[0],
                staleAssertionsExcluded=db.execute('SELECT count(*) FROM assertions WHERE id NOT IN (SELECT assertion_id FROM run_assertions WHERE run_id=?)',(run,)).fetchone()[0])
            result['validation']=read(root/('validation-'+run.split(':')[-1]+'.json'),{})
            result['associationBounds']=json.loads(db.execute('SELECT value FROM meta WHERE key=?',('association_bounds:'+run,)).fetchone()[0]) if db.execute('SELECT 1 FROM meta WHERE key=?',('association_bounds:'+run,)).fetchone() else {}
        finally: db.close()
        result['storage']=dict(graphBytes=Path(latest['graphPath']).stat().st_size,retainedCorpusBytes=latest['manifest']['bytes'])
    result['countsRunId']=latest.get('runId')
    result['fullCorpusScanned']=bool(full and result['quality'].get('citationsPassed'))
    result['fullExtractionCompleted']=bool(full)
    result['coverage']['citations']='Pilot only; production body citations deferred after failed precision/recall review' if not result['quality'].get('citationsPassed') else result['coverage']['citations']
    result['coverage']['bodyEntities']='Pilot only; production body entity aliases deferred after failed identity review' if not result['quality'].get('entitiesPassed') else 'English literal aliases'
    result['coverage']['passingTopicRules']=result['quality'].get('passingTopicRules',[])
    result['coverage']['deferredTopicRules']=result['quality'].get('deferredTopicRules',[])
    result['pilotSelection']=read(root/'pilot-selection.json',{})
    write_json(root/'summary.json',result)
    counts=result.get('counts',{}); unresolved=sum(counts.get('unresolvedByReason',{}).values())
    lines=['# Private knowledge graph execution report','',f"Updated {result['updatedAt']}. Software implemented: {result['softwareImplemented']}; pilot extracted: {bool(pilot)}; full corpus extracted: {bool(full)}; private release validated: {bool(published)}.",
       '',f"Snapshot: {latest.get('snapshotId','pending')}. Build: {latest.get('manifest',{}).get('corpusBuild','pending')}. Graph: {latest.get('graphPath','pending')}.",
       '',f"Pilot genres: {dumps(result['pilotSelection'].get('genreCounts',{}))}. Eligible snapshot documents: {counts.get('eligibleDocuments','pending')}; known works/editions: {counts.get('distinctKnownWorks','pending')}/{counts.get('distinctKnownEditions','pending')}; duplicate witnesses: {counts.get('duplicateWitnesses','pending')}.",
       '',f"Assertions by relation: {dumps(counts.get('assertionsByRelation',{}))}. Evidence classes: {dumps(counts.get('assertionsByEvidenceClass',{}))}. Observations: {dumps(counts.get('observationsByMethod',{}))}.",
       '',f"Unresolved candidates: {unresolved}; reasons: {dumps(counts.get('unresolvedByReason',{}))}. Stale assertions excluded: {counts.get('staleAssertionsExcluded',0)}. Three archived RB05 hashes are blocked and removed from graph input snapshots.",
       '',f"Validation: {dumps(result.get('validation',{}))}. Model review: {dumps({k:dict(correct=v['correct'],total=v['total']) for k,v in result['quality'].get('positiveReviews',{}).items()})}; independent windows: {result['quality'].get('independentWindows',0)}, explicit-reference recall {result['quality'].get('foundExplicitCitations',0)}/{result['quality'].get('explicitCitationTruth',0)}. Production citations/entities deferred: {not result['quality'].get('citationsPassed')}/{not result['quality'].get('entitiesPassed')}; passing topic rules {len(result['quality'].get('passingTopicRules',[]))}/24. Detailed decisions: quality-policy.json and model-review-decisions.json.",
       '',f"Monitor: {dumps(result['monitor'])}. Checkpoint: {dumps(result['progress'])}. Pending final-corpus gates: {dumps(result['productionGate'].get('reasons',[]))}.",
       '',f"Pilot body scan: {counts.get('scannedDocuments',0)} documents / {counts.get('scannedChunks',0)} chunks. Storage: {dumps(result.get('storage',{}))}. Coverage: {len(result['quality'].get('passingTopicRules',[]))} passing English topic rules; body citations/entities remain pilot-only; other languages and interpretation deferred. No public evidence export. UI integration pending; see HANDOFF.md."]
    (root/'REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    return {k:result[k] for k in ('state','pilotTested','fullCorpusScanned','releaseValidated','productionGate')}


def monitor(config):
    root=config['state_dir']/'graph-development'
    os.environ['CUDA_VISIBLE_DEVICES']=''; os.environ['OMP_NUM_THREADS']='1'; os.environ['ARROW_NUM_THREADS']='1'
    state=dict(pid=os.getpid(),startedAt=now(),state='waiting_for_verified_intake',cpuOnly=True,log=str(root/'monitor.log'))
    with writer_lock(config['state_dir'],'monitor.lock'):
        while True:
            try:
                from .runner import check_cancel
                check_cancel(config)
                gate=production_gate(config); state.update(updatedAt=now(),gate=gate)
                policy=read(root/'quality-policy.json',{})
                if gate['ready'] and policy.get('reviewComplete'):
                    state['state']='capturing_final_snapshot'; write_json(root/'monitor-state.json',state)
                    from .snapshot import capture
                    snapshot=capture(config)
                    independent_parity(config,snapshot)
                    from .runner import execute
                    result=execute(config,snapshot,'full')
                    from .validation import validate
                    validation=validate(result['graphPath'],result['runId'],config)
                    release=publish(config,result['graphPath'],result['runId'],validation)
                    state.update(state='private_release_validated',release=release,updatedAt=now()); write_json(root/'monitor-state.json',state); report(config,state)
                    print(dumps(state),flush=True); return
                state['state']='waiting_for_verified_intake' if not gate['ready'] else 'waiting_for_pilot_review'
                write_json(root/'monitor-state.json',state); report(config,state)
            except Exception as error:
                from .runner import Cancelled
                state.update(state='cancelled' if isinstance(error,Cancelled) else 'needs_attention',error=str(error),updatedAt=now())
                write_json(root/'monitor-state.json',state); report(config,state)
                print(dumps(state),flush=True)
                # Never retry bad inputs or failed validation indefinitely.
                return
            time.sleep(30)
