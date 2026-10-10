"""Resolve every active evidence record to the retained input, not live files."""
import json
import math
from functools import lru_cache
from .core import RELATIONS, dumps, now, readonly, text_hash
from .foundation import Inputs, field_value
from ..settings import write_json


def validate(path, run, config):
    db = readonly(path)
    manifest = json.loads(db.execute('SELECT s.manifest FROM snapshots s JOIN runs r ON r.snapshot_id=s.id WHERE r.id=?', (run,)).fetchone()[0])
    inputs = Inputs(manifest)
    errors, checked = [], 0
    def fail(id, reason):
        if len(errors) < 100:
            errors.append({'id': id, 'reason': reason})
    @lru_cache(maxsize=4096)
    def chunk(id):
        row = inputs.corpus.execute('SELECT * FROM chunks WHERE id=?', (id,)).fetchone()
        return dict(row) if row else None
    @lru_cache(maxsize=64)
    def projection_valid(id):
        projection=db.execute('SELECT run_id,parameters FROM derivations WHERE id=?',(id,)).fetchone()
        if not projection or projection['run_id']!=run: return False
        return not db.execute('''SELECT 1 FROM derivation_inputs i LEFT JOIN run_assertions r ON r.assertion_id=i.assertion_id AND r.run_id=?
                                 WHERE i.derivation_id=? AND r.assertion_id IS NULL LIMIT 1''',(run,id)).fetchone()
    total_errors = 0
    try:
        for row in db.execute('SELECT o.* FROM observations o JOIN run_observations r ON r.observation_id=o.id WHERE r.run_id=?', (run,)):
            checked += 1
            try:
                loc = json.loads(row['locator'])
                if row['method'] in ('literal_match', 'rule_candidate'):
                    body = chunk(row['chunk_id'])
                    if not body or text_hash(body['text']) != row['text_hash']:
                        raise ValueError('chunk missing or text hash changed')
                    if not (0 <= row['start'] < row['end'] <= len(body['text'])):
                        raise ValueError('invalid original code-point offsets')
                    if loc.get('segments'):
                        literals, previous = [], None
                        for segment in loc['segments']:
                            item = chunk(segment['chunkId'])
                            from .citations import section
                            if not item or text_hash(item['text']) != segment['textHash']:
                                raise ValueError('boundary witness text changed')
                            if previous and (item['document_id'] != previous['document_id'] or section(item['locator']) != section(previous['locator']) or item['rowid'] != previous['rowid']+1):
                                raise ValueError('unverified adjacency or section')
                            literal = item['text'][segment['start']:segment['end']]
                            if literal != segment['literal']:
                                raise ValueError('boundary witness offsets changed')
                            literals.append(literal); previous = item
                        literal = ' '.join(literals)
                    else:
                        literal = body['text'][row['start']:row['end']]
                    if literal != row['literal'] or loc['sourceLocator'] != body['locator']:
                        raise ValueError('literal or source locator mismatch')
                elif loc['store'] == 'inputs':
                    table = loc['table']
                    if table == 'records':
                        record = inputs.record(loc['id'])
                        if not record or record['sha256'] != row['source_hash']:
                            raise ValueError('frozen catalogue identity/hash mismatch')
                    elif table == 'overlays':
                        record = inputs.inputs.execute('SELECT metadata FROM overlays WHERE path=?', (loc['path'],)).fetchone()
                        if not record or not any(a['path']==row['source'] and a['sha256']==row['source_hash'] for a in manifest['artifacts']):
                            raise ValueError('frozen manifest evidence missing')
                    elif table == 'artifacts':
                        record = inputs.inputs.execute('SELECT metadata,sha256 FROM artifacts WHERE path=?', (loc['path'],)).fetchone()
                        if not record or record['sha256'] != row['source_hash']:
                            raise ValueError('frozen registry evidence missing')
                    else:
                        raise ValueError('unsupported evidence table')
                    literal = dumps(field_value(json.loads(record['metadata']), loc['fields']))
                    if literal != row['literal']:
                        raise ValueError('structured field mismatch')
                elif loc['store'] == 'corpus':
                    table = loc['table']
                    if table in ('chunks','documents'):
                        record = chunk(loc['id']) if table=='chunks' else inputs.corpus.execute('SELECT * FROM documents WHERE id=?', (loc['id'],)).fetchone()
                        if not record:
                            raise ValueError('source row missing')
                        value = dict(record)
                        if loc['fields'][0] == 'metadata':
                            value['metadata'] = json.loads(value['metadata'])
                        literal = dumps(field_value(value, loc['fields']))
                    elif table == 'edges':
                        # Integer row IDs deliberately play no part in identity.
                        record = inputs.corpus.execute('SELECT * FROM edges WHERE subject=? AND relation=? AND object=? AND source=? AND metadata=?',
                                                      (loc['subject'],loc['relation'],loc['object'],row['source'],dumps(loc['metadata']))).fetchone()
                        # Existing JSON may use different whitespace; compare parsed content.
                        if not record:
                            record = next((r for r in inputs.corpus.execute('SELECT * FROM edges WHERE subject=? AND relation=? AND object=? AND source=?',
                                          (loc['subject'],loc['relation'],loc['object'],row['source'])) if json.loads(r['metadata'])==loc['metadata']), None)
                        if not record:
                            raise ValueError('structured relationship absent')
                        literal = dumps({k:record[k] for k in ('subject','relation','object')} | {'metadata':json.loads(record['metadata'])})
                    elif table == 'references_to':
                        record = inputs.corpus.execute('SELECT * FROM references_to WHERE document_id=? AND edition=? AND start=? AND end=? AND source=?',
                                                      tuple(loc[k] for k in ('document_id','edition','start','end','source'))).fetchone()
                        if not record: raise ValueError('recorded reference missing')
                        literal = dumps(dict(record))
                    else: raise ValueError('unsupported corpus evidence table')
                    if literal != row['literal'] or inputs.source_hash(row['source']) != row['source_hash']:
                        raise ValueError('structured evidence/source hash mismatch')
                else:
                    raise ValueError('unsupported evidence store')
            except (ValueError, KeyError, TypeError, IndexError) as error:
                total_errors += 1; fail(row['id'], str(error))
            if checked % 10000 == 0:
                write_json(config['state_dir']/'graph-development/validation-progress.json', dict(runId=run,checked=checked,errors=total_errors,updatedAt=now()))
        edges = 0
        for row in db.execute('''SELECT a.*,s.kind sk,o.kind ok,EXISTS(
                              SELECT 1 FROM assertion_evidence e JOIN run_observations z ON z.observation_id=e.observation_id
                              WHERE e.assertion_id=a.id AND z.run_id=r.run_id) has_evidence
                              FROM run_assertions r JOIN assertions a ON a.id=r.assertion_id
                              JOIN entities s ON s.id=a.subject JOIN entities o ON o.id=a.object WHERE r.run_id=?''', (run,)):
            edges += 1
            allowed = RELATIONS.get(row['relation'])
            evidence=row['has_evidence']
            if not allowed or row['sk'] not in allowed[0] or row['ok'] not in allowed[1] or not evidence:
                total_errors += 1; fail(row['id'], 'invalid endpoints or no current-run evidence')
            if row['relation']=='shares_references':
                try:
                    metric=json.loads(row['qualifiers']); derivation=metric['derivationId']; projection=metric['projectionId']
                    link=db.execute('SELECT 1 FROM derivation_links WHERE child=? AND parent=?',(derivation,projection)).fetchone()
                    upstream=db.execute('''SELECT count(*) FROM derivation_inputs i LEFT JOIN run_assertions r ON r.assertion_id=i.assertion_id AND r.run_id=?
                                           WHERE i.derivation_id=? AND r.assertion_id IS NULL''',(run,derivation)).fetchone()[0]
                    if not link or upstream or not projection_valid(projection): raise ValueError('missing/stale derivation dependencies')
                    n=metric['eligibleIdentities']; expected=sum(math.log((1+n)/(1+f['documentFrequency']))+1 for f in metric['features'])
                    if abs(round(expected,6)-metric['score'])>1e-6: raise ValueError('non-reproducible bounded score')
                    for feature in metric['features']:
                        docs={r[0] for r in db.execute('''SELECT c.document_id FROM derivation_inputs i JOIN assertions a ON a.id=i.assertion_id
                                    JOIN chunk_map c ON c.chunk_id=substr(a.subject,7) AND c.run_id=? WHERE i.derivation_id=? AND a.object=? AND a.relation='cites_reference' ''',(run,derivation,feature['referenceId']))}
                        if not {row['subject'].removeprefix('document:'),row['object'].removeprefix('document:')}<=docs:
                            raise ValueError('shared-reference feature lacks both named source witnesses')
                except (ValueError,KeyError,TypeError) as error:
                    total_errors+=1; fail(row['id'],str(error))
            if edges%10000==0:
                write_json(config['state_dir']/'graph-development/validation-progress.json',dict(runId=run,phase='typed_assertions',checkedAssertions=edges,checkedObservations=checked,errors=total_errors,updatedAt=now()))
        integrity = db.execute('PRAGMA quick_check').fetchone()[0]
        fk = db.execute('PRAGMA foreign_key_check').fetchone()
        if integrity != 'ok' or fk:
            total_errors += 1; fail('database','integrity or foreign-key failure')
        result = dict(runId=run,checkedObservations=checked,checkedAssertions=edges,errors=total_errors,
                      examples=errors,integrity=integrity,passed=total_errors==0,updatedAt=now(),scope='100% active-run evidence and typed assertions')
        write_json(config['state_dir']/'graph-development'/('validation-'+run.split(':')[-1]+'.json'), result)
        return result
    finally:
        db.close(); inputs.close()
