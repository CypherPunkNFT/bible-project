"""LA-01 coordinator: derived metadata and validated, unapplied corrections."""
import hashlib
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from .build import PROJECT, DEFAULT_OUT, dump, now
from .inputs import Inputs, digest, packed
from .jobs import JobStore, StaleInput, background_priority
from .normalize import VERSION as NORMALIZE_VERSION, normalized
from .identities import VERSION as IDENTITY_VERSION, validate_candidate, contributor_resolution, reconcile_reader

VERSION = 'la01-pipeline-v1'
BATCH = 1000
SCHEMA = '''
CREATE TABLE IF NOT EXISTS normalized_metadata(
 job_id TEXT,key TEXT,layer TEXT,language_raw TEXT,language TEXT,language_method TEXT,
 source_raw TEXT,source_family TEXT,genre_raw TEXT,genre TEXT,title_raw TEXT,title TEXT,
 author_raw TEXT,author_label TEXT,recovery_json TEXT,issues_json TEXT,input_fingerprint TEXT,
 PRIMARY KEY(job_id,key));
CREATE TABLE IF NOT EXISTS correction_candidates(job_id TEXT,key TEXT,state TEXT,reason TEXT,result_json TEXT,PRIMARY KEY(job_id,key));
CREATE TABLE IF NOT EXISTS contributor_resolutions(job_id TEXT,key TEXT,state TEXT,result_json TEXT,PRIMARY KEY(job_id,key));
CREATE TABLE IF NOT EXISTS reader_reconciliation(job_id TEXT,key TEXT,state TEXT,result_json TEXT,PRIMARY KEY(job_id,key));
CREATE TABLE IF NOT EXISTS archive_move_proofs(job_id TEXT,key TEXT,state TEXT,result_json TEXT,PRIMARY KEY(job_id,key));
CREATE TABLE IF NOT EXISTS input_versions(run_id TEXT,path TEXT,sha256 TEXT,size INTEGER,mtime_ns INTEGER,PRIMARY KEY(run_id,path));
'''


def batches(db, table, where='1=1', size=BATCH):
    last = 0
    while True:
        rows = db.execute(f'SELECT rowid input_rowid,* FROM {table} WHERE rowid>? AND ({where}) ORDER BY rowid LIMIT ?', (last, size)).fetchall()
        if not rows: break
        last = rows[-1]['input_rowid']
        yield [dict(row) for row in rows]


def selected(db, table, run):
    return db.execute(f'SELECT t.* FROM {table} t JOIN run_jobs r ON r.job_id=t.job_id WHERE r.run_id=? ORDER BY t.key', (run,))


def run_job(store, run, task, scope, payload, version, writer, progress):
    fingerprint = digest(payload)
    job = digest({'task':task, 'scope':scope, 'fingerprint':fingerprint, 'version':version})
    store.register(run, job, task, scope, fingerprint, version)
    state = store.execute(job, lambda db: writer(db, job))
    progress[state] = progress.get(state, 0) + 1
    if state in ('failed', 'stale'):
        print(packed({'task':task, 'scope':scope, 'state':state}), flush=True)
    return state


def json_results(db, table, job, rows):
    if table == 'correction_candidates':
        db.executemany('INSERT OR REPLACE INTO correction_candidates VALUES(?,?,?,?,?)',
            [(job, r['target_layer'] + ':' + r['target_id'] + ':' + r['field'] + ':' + r['proposed_value'], r['state'], r['reason'], packed(r)) for r in rows])
    else:
        key = {'contributor_resolutions':'contributor_id', 'reader_reconciliation':'reader_id', 'archive_move_proofs':'originalPath'}[table]
        db.executemany(f'INSERT OR REPLACE INTO {table} VALUES(?,?,?,?)', [(job, r[key], r['state'], packed(r)) for r in rows])
    return len(rows)


def normalize_stage(inputs, store, run, progress):
    n = 0
    for observations in batches(inputs.warehouse, 'observations'):
        live = inputs.live_metadata(observations)
        prepared = []
        for observation in observations:
            assertions, deps, issues = inputs.assertions(observation, live.get(observation['key']))
            if observation['key'] not in live:
                issues.append('current-source-record-missing')
            prepared.append((observation, assertions, deps, issues))
        scope = f"normalize:{observations[0]['input_rowid']}:{observations[-1]['input_rowid']}"
        def writer(db, job):
            values = []
            for observation, assertions, deps, issues in prepared:
                result = normalized(observation, assertions)
                result['issues'].extend(issues)
                values.append((job, result['key'], result['layer'], result['language_raw'], result['language'], result['language_method'],
                    result['source_raw'], result['source_family'], result['genre_raw'], result['genre'], result['title_raw'], result['title'],
                    result['author_raw'], result['author_label'], packed(result['recovery']), packed(result['issues']), digest({'observation':observation,'dependencies':deps})))
            db.executemany('INSERT OR REPLACE INTO normalized_metadata VALUES(' + ','.join('?' * 17) + ')', values)
            return len(values)
        run_job(store, run, 'normalize', scope, prepared, NORMALIZE_VERSION, writer, progress)
        n += len(observations)
        if n % 20000 == 0:
            print(packed({'phase':'normalize', 'observations':n, 'jobs':progress}), flush=True)
        time.sleep(.005)


def identities_stage(inputs, store, run, progress):
    n = 0
    for candidates in batches(inputs.warehouse, 'identity_backfill_candidates', size=100):
        prepared = []
        for candidate in candidates:
            target = inputs.current(candidate['target_layer'], candidate['target_id'])
            evidence_layer = 'reader' if candidate['target_layer'] == 'corpus' else 'corpus'
            evidence = inputs.current(evidence_layer, candidate['example_evidence_record'])
            work = candidate['proposed_value'] if candidate['field'] == 'work_id' else (target or {}).get('work_id') or (evidence or {}).get('work_id')
            edition = candidate['proposed_value'] if candidate['field'] == 'edition_id' else (target or {}).get('edition_id') or (evidence or {}).get('edition_id')
            canonical = {}
            for kind, ident in [('work',work), ('edition',edition)]:
                if ident: canonical[kind + ':' + ident] = inputs.canonical(kind, ident)
            prepared.append((candidate, target, evidence, canonical))
        scope = f"identity:{candidates[0]['input_rowid']}:{candidates[-1]['input_rowid']}"
        def writer(db, job):
            results = [validate_candidate(c, t, e, lambda kind, ident: canonical.get(kind + ':' + ident, (None, 'missing')))
                       for c, t, e, canonical in prepared]
            return json_results(db, 'correction_candidates', job, results)
        run_job(store, run, 'identity', scope, prepared, IDENTITY_VERSION, writer, progress)
        n += len(candidates)
        if n % 2000 == 0:
            print(packed({'phase':'identities', 'candidates':n, 'jobs':progress}), flush=True)
        time.sleep(.005)


def other_stages(inputs, store, run, progress):
    unresolved = [dict(r) for r in inputs.warehouse.execute('SELECT * FROM unresolved_contributors')]
    resolutions = [contributor_resolution(r, inputs) for r in unresolved]
    run_job(store, run, 'contributors', 'contributors', resolutions, IDENTITY_VERSION,
            lambda db, job: json_results(db, 'contributor_resolutions', job, resolutions), progress)
    print(packed({'phase':'contributors', 'resolutions':[{k:r.get(k) for k in ('contributor_id','state','name')} for r in resolutions]}), flush=True)
    proofs = []
    for move in inputs.moves:
        row = dict(move)
        path = Path(move['archivedPath'])
        original = Path(move['originalPath'])
        if not path.resolve().is_relative_to(inputs.project.resolve()):
            raise ValueError('Archive proof points outside project')
        actual = None
        if path.exists():
            before = path.stat()
            h = hashlib.sha256()
            with path.open('rb') as f:
                for block in iter(lambda:f.read(1024 * 1024), b''): h.update(block)
            after = path.stat()
            if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
                raise StaleInput('Archive original changed while hashing')
            actual = h.hexdigest()
            inputs.dependencies[str(path)] = {'sha256':actual, 'size':after.st_size, 'mtime_ns':after.st_mtime_ns}
        row.update(current_original_absent=not original.exists(), current_archive_sha256=actual,
                   move_ledger_sha256=inputs.moves_sha,
                   state='verified-excluded-archive' if not original.exists() and actual == move['sha256'] and move.get('disposition') == 'excluded-author'
                         and move.get('publishedInventoryMatched') and move.get('archiveBytesMatched') else 'unresolved')
        proofs.append(row)
    run_job(store, run, 'archive', 'archive-moves', proofs, IDENTITY_VERSION,
            lambda db, job: json_results(db, 'archive_move_proofs', job, proofs), progress)
    print(packed({'phase':'reader-reconciliation', 'state':'preparing-current-text-index'}), flush=True)
    inputs.current_text_links()
    inputs.current_intake_links()
    n = 0
    for rows in batches(inputs.warehouse, 'reader_crosswalk', 'readable_declared=1 AND corpus_text_matches=0', size=100):
        results = [reconcile_reader(row, inputs) for row in rows]
        scope = f"reader-reconciliation:{rows[0]['input_rowid']}:{rows[-1]['input_rowid']}"
        run_job(store, run, 'reader-reconciliation', scope, results, IDENTITY_VERSION,
                lambda db, job: json_results(db, 'reader_reconciliation', job, results), progress)
        n += len(rows)
        if n % 2000 == 0:
            print(packed({'phase':'reader-reconciliation', 'readers':n, 'jobs':progress}), flush=True)


def validate(store, run, inputs=None, project=PROJECT):
    db = store.db
    record = db.execute('SELECT * FROM runs WHERE id=?', (run,)).fetchone()
    if not record: raise ValueError('Unknown run')
    from .build import readonly
    source = inputs.warehouse if inputs else readonly(Path(record['warehouse']))
    expected = {
        'normalized_metadata':source.execute('SELECT count(*) FROM observations').fetchone()[0],
        'correction_candidates':source.execute('SELECT count(*) FROM identity_backfill_candidates').fetchone()[0],
        'contributor_resolutions':source.execute('SELECT count(*) FROM unresolved_contributors').fetchone()[0],
        'reader_reconciliation':source.execute('SELECT count(*) FROM reader_crosswalk WHERE readable_declared=1 AND corpus_text_matches=0').fetchone()[0]}
    actual = {table:db.execute(f'SELECT count(*) FROM {table} t JOIN run_jobs r ON r.job_id=t.job_id WHERE r.run_id=?', (run,)).fetchone()[0] for table in expected}
    states = [dict(r) for r in db.execute('SELECT j.task,j.state,count(*) jobs FROM run_jobs r JOIN jobs j ON j.id=r.job_id WHERE r.run_id=? GROUP BY j.task,j.state', (run,))]
    changed = inputs.changed_files() if inputs else []
    if not inputs:
        for dep in db.execute('SELECT * FROM input_versions WHERE run_id=?', (run,)):
            path = Path(dep['path'])
            if dep['sha256'] == 'missing':
                if path.exists(): changed.append(str(path))
            elif not path.exists(): changed.append(str(path))
            else:
                h = hashlib.sha256()
                with path.open('rb') as f:
                    for block in iter(lambda:f.read(1024 * 1024), b''): h.update(block)
                if h.hexdigest() != dep['sha256']: changed.append(str(path))
    if not inputs: source.close()
    integrity = db.execute('PRAGMA quick_check').fetchone()[0]
    orphan_results = db.execute("SELECT count(*) FROM checkpoints c JOIN jobs j ON j.id=c.job_id WHERE j.state!='succeeded'").fetchone()[0]
    accepted_invalid = 0
    changed_candidate_sources = []
    current = None
    if inputs is None:
        current = Inputs(project, record['warehouse'])
        current.prefetch_readers()
    for row in selected(db, 'correction_candidates', run):
        if row['state'] == 'accepted':
            candidate = json.loads(row['result_json'])
            if candidate['expected_old'] not in (None, '') or not candidate.get('target_fingerprint') or not candidate.get('canonical_evidence', {}).get('work'):
                accepted_invalid += 1
            if current:
                target = current.current(candidate['target_layer'], candidate['target_id'])
                evidence_layer = 'reader' if candidate['target_layer'] == 'corpus' else 'corpus'
                evidence = current.current(evidence_layer, candidate['example_evidence_record'])
                if not target or not evidence or target['fingerprint'] != candidate['target_fingerprint'] or evidence['fingerprint'] != candidate['evidence_fingerprint']:
                    changed_candidate_sources.append(row['key'])
    if current:
        changed.extend(current.changed_files())
        if current.versions() != current.initial_versions:
            changed_candidate_sources.append('current-input-database-changed-during-validation')
        current.close()
    versions_stable = inputs.versions() == inputs.initial_versions if inputs else None
    ok = integrity == 'ok' and expected == actual and not changed and not changed_candidate_sources and not orphan_results and not accepted_invalid and all(s['state'] == 'succeeded' for s in states)
    if inputs: ok = ok and versions_stable
    return {'ok':ok, 'sqlite_quick_check':integrity, 'expected_rows':expected, 'actual_rows':actual,
            'job_states':states, 'changed_dependencies':changed, 'input_database_versions_stable':versions_stable,
            'orphan_checkpoints':orphan_results, 'invalid_accepted_candidates':accepted_invalid,
            'changed_accepted_candidate_sources':changed_candidate_sources,
            'note':'Validation of derived LA-01 snapshot; no original, catalogue or vector correction was applied.'}


def export_run(store, run, root, validation):
    db = store.db
    release = root / 'releases' / run
    existing = db.execute('SELECT state,summary_json FROM runs WHERE id=?', (run,)).fetchone()
    if existing and existing['state'] == 'complete' and (release / 'release_manifest.json').exists():
        # Consumer pointers identify immutable generations, not a folder whose
        # contents change each time an operator asks for the same export.
        return json.loads(existing['summary_json'])
    release.mkdir(parents=True, exist_ok=True)
    counts = {}
    for table in ('correction_candidates','contributor_resolutions','reader_reconciliation','archive_move_proofs'):
        counts[table] = [dict(r) for r in db.execute(f'SELECT t.state,count(*) records FROM {table} t JOIN run_jobs r ON r.job_id=t.job_id WHERE r.run_id=? GROUP BY t.state', (run,))]
        with (release / (table + '.jsonl')).open('w', encoding='utf-8') as f:
            for row in selected(db, table, run): f.write(row['result_json'] + '\n')
    changed = recovered = issues = 0
    patches = 0
    with (release / 'metadata-refinements.jsonl').open('w', encoding='utf-8') as f:
        for row in selected(db, 'normalized_metadata', run):
            result = dict(row)
            recovery = json.loads(result.pop('recovery_json'))
            flags = json.loads(result.pop('issues_json'))
            is_changed = any(result[a] != result[b] for a,b in [('language_raw','language'),('source_raw','source_family'),('genre_raw','genre'),('title_raw','title'),('author_raw','author_label')])
            changed += is_changed
            recovered += bool(recovery)
            issues += bool(flags)
            if is_changed or recovery or flags:
                f.write(packed({**result,'recovery':recovery,'issues':flags}) + '\n')
    with (release / 'correction-batch.jsonl').open('w', encoding='utf-8') as f:
        for row in selected(db, 'correction_candidates', run):
            if row['state'] != 'accepted': continue
            result = json.loads(row['result_json'])
            patch = {'schema':'library-analytics-correction-v1', 'run_id':run,
                     'target':{'layer':result['target_layer'],'id':result['target_id'],'original_sha256':result['original_sha'],
                               'fingerprint':result['target_fingerprint'], 'location':result['target_location']},
                     'field':result['field'], 'expected_old':result['expected_old'], 'new_value':result['proposed_value'],
                     'validated_work_id':result['work_id'], 'validated_edition_id':result['edition_id'],
                     'canonical_evidence':result['canonical_evidence'], 'counterpart':result['evidence_location'],
                     'counterpart_fingerprint':result['evidence_fingerprint'], 'route':result['application_route'], 'applied':False}
            f.write(packed(patch) + '\n')
            patches += 1
    coverage = [dict(r) for r in db.execute('''SELECT t.layer,t.language,count(*) records,
        sum(t.language_raw!=t.language) normalized_language_records FROM normalized_metadata t
        JOIN run_jobs r ON r.job_id=t.job_id WHERE r.run_id=? GROUP BY t.layer,t.language ORDER BY t.layer,records DESC''', (run,))]
    dump(release / 'language-coverage.json', coverage)
    field_changes = dict(db.execute('''SELECT sum(t.language_raw!=t.language) language,
        sum(t.source_raw!=t.source_family) source,sum(t.genre_raw!=t.genre) genre,
        sum(t.title_raw!=t.title) title,sum(t.author_raw!=t.author_label) author_label
        FROM normalized_metadata t JOIN run_jobs r ON r.job_id=t.job_id WHERE r.run_id=?''', (run,)).fetchone())
    summary = {'run_id':run, 'processor':VERSION, 'created_at':now(), 'state':'complete' if validation['ok'] else 'needs-review',
               'database':str(store.path), 'validation':validation, 'dispositions':counts,
               'normalized_observations':validation['actual_rows']['normalized_metadata'],
               'records_with_derived_changes':changed, 'records_with_structured_recovery':recovered,
               'records_with_issues':issues, 'accepted_unapplied_fields':patches,
               'derived_field_changes':field_changes,
               'applied_canonical_changes':0,
               'scope':'LA-01 metadata refinement and reconciliation of selected warehouse generation; overlapping layers are not books.'}
    dump(release / 'summary.json', summary)
    manifest = {'run_id':run,'state':summary['state'],'files':[]}
    for path in sorted(release.glob('*')):
        if path.name == 'release_manifest.json': continue
        h = hashlib.sha256()
        with path.open('rb') as f:
            for block in iter(lambda:f.read(1024 * 1024), b''): h.update(block)
        manifest['files'].append({'name':path.name,'bytes':path.stat().st_size,'sha256':h.hexdigest()})
    dump(release / 'release_manifest.json', manifest)
    with db:
        db.execute('UPDATE runs SET state=?,updated_at=?,summary_json=? WHERE id=?', (summary['state'],time.time(),packed(summary),run))
    if validation['ok']:
        dump(root.parent / 'latest-refinement.json', {'run_id':run,'database':str(store.path),'summary':str(release / 'summary.json'),'release':str(release)})
    return summary


def run_pipeline(project=PROJECT, root=None, resume=False, run_id=None, warehouse=None):
    root = Path(root or DEFAULT_OUT / 'pipeline').resolve()
    if not root.is_relative_to((Path(project) / 'KnowledgeBase/library-analytics').resolve()):
        raise ValueError('Runtime output must remain in KnowledgeBase/library-analytics')
    background_priority()
    store = JobStore(root / 'pipeline.sqlite3')
    inputs = None
    active_run = False
    started = time.time()
    try:
        store.acquire()
        store.db.executescript(SCHEMA)
        if resume and not run_id:
            row = store.db.execute("SELECT id FROM runs WHERE state IN ('running','interrupted','failed') ORDER BY created_at DESC LIMIT 1").fetchone()
            if row: run_id = row['id']
        previous = store.db.execute('SELECT * FROM runs WHERE id=?',(run_id,)).fetchone() if run_id else None
        if run_id and not previous: raise ValueError('Unknown requested run')
        if previous and previous['state'] == 'complete':
            raise ValueError('Completed generations are immutable; start a new run to reuse matching jobs')
        if previous:
            warehouse = previous['warehouse']
        elif not warehouse:
            warehouse = json.loads((Path(project) / 'KnowledgeBase/library-analytics/latest.json').read_text(encoding='utf-8-sig'))['database']
        run_id = run_id or ('la01-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
        with store.db:
            store.db.execute("INSERT OR IGNORE INTO runs VALUES(?,?,?,'running',?,NULL)", (run_id,time.time(),time.time(),str(warehouse)))
            store.db.execute("UPDATE runs SET state='running',updated_at=? WHERE id=?", (time.time(),run_id))
        active_run = True
        inputs = Inputs(project, warehouse)
        print(packed({'phase':'prefetch', 'run_id':run_id}), flush=True)
        inputs.prefetch_readers()
        progress = {}
        normalize_stage(inputs, store, run_id, progress)
        identities_stage(inputs, store, run_id, progress)
        other_stages(inputs, store, run_id, progress)
        with store.db:
            store.db.execute('DELETE FROM input_versions WHERE run_id=?', (run_id,))
            store.db.executemany('INSERT INTO input_versions VALUES(?,?,?,?,?)',
                [(run_id,p,d['sha256'],d['size'],d['mtime_ns']) for p,d in inputs.dependencies.items()])
        print(packed({'phase':'validate','run_id':run_id,'jobs':progress}), flush=True)
        result = validate(store, run_id, inputs)
        summary = export_run(store, run_id, root, result)
        dump(root / 'last-run.json', {'run_id':run_id,'state':summary['state'],'jobs_this_invocation':progress,'seconds':round(time.time()-started,2)})
        print(packed({'phase':'finished', 'run_id':run_id,'state':summary['state'],'counts':summary['dispositions'],
                      'normalizations':summary['records_with_derived_changes'],'recovered':summary['records_with_structured_recovery'],
                      'jobs':progress,'seconds':round(time.time()-started,2)}), flush=True)
        return 0 if result['ok'] else 2
    except BaseException as exc:
        if store.acquired and active_run:
            with store.db:
                store.db.execute('UPDATE runs SET state=?,updated_at=? WHERE id=?', ('interrupted' if isinstance(exc,KeyboardInterrupt) else 'failed',time.time(),run_id))
        raise
    finally:
        if inputs: inputs.close()
        store.close()
