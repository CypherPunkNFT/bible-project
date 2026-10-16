"""Validate missing identity proposals without changing canonical inputs."""
from .inputs import digest

VERSION = 'la01-identities-v2'


def validate_candidate(candidate, target, evidence, canonical):
    result = dict(candidate)
    result.update(expected_old=None, state='unresolved', reason=None,
                  target_fingerprint=(target or {}).get('fingerprint'),
                  evidence_fingerprint=(evidence or {}).get('fingerprint'), canonical_evidence={})
    def disposition(state, reason):
        result.update(state=state, reason=reason)
        return result
    if candidate['state'] != 'unique-proposal':
        return disposition('rejected', 'ambiguous-proposal')
    if not target or not evidence:
        return disposition('stale', 'current-target-or-counterpart-missing')
    original = candidate['original_sha']
    if not original or target['original_sha'] != original or evidence['original_sha'] != original:
        return disposition('stale', 'current-original-hash-mismatch')
    field = candidate['field']
    proposed = candidate['proposed_value']
    if field not in ('work_id', 'edition_id'):
        return disposition('rejected', 'unsupported-field')
    if evidence.get(field) != proposed:
        return disposition('stale', 'counterpart-assertion-changed')
    existing = target.get(field)
    result['expected_old'] = existing
    if existing:
        return disposition('already-correct' if existing == proposed else 'rejected',
                           'already-populated' if existing == proposed else 'current-value-conflict')
    work_id = proposed if field == 'work_id' else target.get('work_id') or evidence.get('work_id')
    edition_id = proposed if field == 'edition_id' else target.get('edition_id') or evidence.get('edition_id')
    if not work_id:
        if edition_id:
            edition, eh = canonical('edition', edition_id)
            result['canonical_evidence']['edition'] = {'id':edition_id, 'sha256':eh}
            if not edition or edition.get('id') != edition_id or edition.get('kind') != 'edition':
                return disposition('unresolved', 'canonical-edition-unregistered-or-invalid')
        return disposition('unresolved', 'missing-work-for-edition-binding')
    work, wh = canonical('work', work_id)
    result['canonical_evidence']['work'] = {'id':work_id, 'sha256':wh}
    if not work or work.get('id') != work_id or work.get('kind') != 'work':
        return disposition('unresolved', 'canonical-work-unregistered-or-invalid')
    if target.get('work_id') and target['work_id'] != work_id:
        return disposition('rejected', 'target-work-binding-conflict')
    if evidence.get('work_id') and evidence['work_id'] != work_id:
        return disposition('rejected', 'counterpart-work-binding-conflict')
    if edition_id:
        edition, eh = canonical('edition', edition_id)
        result['canonical_evidence']['edition'] = {'id':edition_id, 'sha256':eh}
        if not edition or edition.get('id') != edition_id or edition.get('kind') != 'edition':
            return disposition('unresolved', 'canonical-edition-unregistered-or-invalid')
        if edition.get('workId') != work_id:
            return disposition('rejected', 'canonical-edition-work-binding-conflict')
        if target.get('edition_id') and target['edition_id'] != edition_id:
            return disposition('rejected', 'target-edition-binding-conflict')
        if evidence.get('edition_id') and evidence['edition_id'] != edition_id:
            return disposition('rejected', 'counterpart-edition-binding-conflict')
    result['work_id'] = work_id
    result['edition_id'] = edition_id
    result['target_location'] = target['location']
    result['evidence_location'] = evidence['location']
    result['application_route'] = 'teacher-identity-override' if candidate['target_layer'] == 'reader' and edition_id else 'existing-intake-coordinator'
    return disposition('accepted', 'same-recorded-hash-current-assertion-canonical-binding')


def contributor_resolution(row, inputs):
    entries = inputs.author_rows.get(row['contributor_id'], [])
    names = {e['record'].get('name') for e in entries if e['record'].get('name')}
    if len(names) == 1:
        record = entries[0]['record']
        return {**dict(row), 'state':'resolved-in-source-registry', 'name':record['name'],
                'entity_type':record.get('entityType'), 'eligibility':record.get('eligibility'),
                'evidence':entries, 'publication_state':'catalogue-metadata-not-applied'}
    return {**dict(row), 'state':'unresolved', 'reason':'conflicting-registry-names' if names else 'missing-authority-record', 'evidence':entries}


def reconcile_reader(row, inputs):
    """Return explicit match evidence, never deduplicate or restore exclusions."""
    current = inputs.current('reader', row['reader_id'])
    result = dict(row)
    result.update(state='unresolved', evidence=[], original_rehashed=False)
    if not current:
        result['state'] = 'current-reader-missing'
        return result
    result['current_reader_fingerprint'] = current['fingerprint']
    if current['original_sha'] != row['original_sha']:
        result['state'] = 'current-reader-hash-changed'
        return result
    for move in inputs.moves:
        if row['original_sha'] and move.get('sha256') == row['original_sha']:
            result.update(state='documented-archive-exclusion', evidence=[move],
                          note='Move ledger evidence; do not restore excluded original. Historical checksum proof, not a fresh rehash.')
            return result
    if not row['original_sha']:
        result['state'] = 'missing-recorded-hash'
        return result
    links = inputs.current_text_links()
    exact = links['original_sha'].get(row['original_sha'], [])
    if exact:
        result.update(state='current-corpus-text-hash-match', evidence=exact)
        return result
    found = inputs.corpus.execute("SELECT id,kind,source,metadata FROM documents WHERE id IN (?,?)",
        ('library:text:' + row['original_sha'], 'library:deferred:' + row['original_sha'])).fetchall()
    import json
    for doc in found:
        metadata = json.loads(doc['metadata'])
        if metadata.get('original_sha256') == row['original_sha']:
            result['evidence'].append({'document_id':doc['id'], 'kind':doc['kind'], 'basis':'current-original-hash'})
    if any(e['kind'] == 'library_text' for e in result['evidence']):
        result['state'] = 'current-corpus-text-hash-match'
        return result
    if result['evidence']:
        result['state'] = 'current-corpus-nontext-hash-match'
        return result
    for field in ('edition_id', 'asset_id', 'work_id'):
        value = current.get(field)
        if not value:
            continue
        records = links[field].get(value, [])
        if records:
            verified = []
            for record in records:
                verified.append({**record, 'basis':field})
            if verified:
                result['evidence'] = verified
                result['state'] = 'same-work-other-edition-candidate' if field == 'work_id' else 'alternate-representation-candidate'
                return result
    intake = inputs.current_intake_links().get(row['original_sha'], [])
    if intake:
        result['evidence'] = intake
        result['state'] = 'intake-deferred' if any(r['status'] == 'deferred' for r in intake) else 'intake-record-without-text-link'
        return result
    held = []
    missing = []
    # The baseline has no ANALYZE statistics; an equality on layer can otherwise
    # win over SHA and cause a 439k-row scan for every unmatched reader record.
    resources = inputs.warehouse.execute("SELECT native_id FROM observations INDEXED BY obs_hash WHERE original_sha=? AND layer='resource'", (row['original_sha'],)).fetchall()
    from pathlib import Path
    for resource in resources:
        live = inputs.registry.execute('SELECT id,path,sha256,availability FROM resources WHERE id=?', (resource['native_id'],)).fetchone()
        if live and live['sha256'] == row['original_sha'] and live['availability'] == 'held':
            path = Path(live['path'])
            evidence = {**dict(live), 'basis':'current-registry-recorded-hash', 'original_rehashed':False}
            if path.is_file():
                evidence['bytes'] = path.stat().st_size
                evidence['mtime_ns'] = path.stat().st_mtime_ns
                held.append(evidence)
            else:
                missing.append(evidence)
    if held:
        result.update(state='held-original-without-corpus-link', evidence=held,
                      note='Current held path exists; corpus/intake resolution is pending. This is not proof of a queued intake job or publication permission.')
        return result
    if missing:
        result.update(state='held-registry-path-missing', evidence=missing)
        return result
    result['state'] = 'unresolved-no-verified-corpus-link'
    return result
