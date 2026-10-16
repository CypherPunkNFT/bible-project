"""Read-only process/checkpoint observations for campaign reporting."""
from datetime import datetime, timezone


def process_status(checkpoint, role, site):
    import psutil
    pid = checkpoint.get('pid')
    if not isinstance(pid, int) or pid <= 0:
        return 'unknown'
    try:
        process = psutil.Process(pid)
        if not process.is_running():
            return 'missing'
        created = process.create_time()
        expected = checkpoint.get('process_created')
        if expected is not None and abs(created - float(expected)) > 1:
            return 'identity_mismatch'
        updated = datetime.fromisoformat(checkpoint['updated_at']).timestamp()
        if created > updated + 1:
            return 'identity_mismatch'
        command = process.cmdline()
        signature = ['-m', 'knowledge', 'embed'] if role == 'embedding' else ['-m', 'knowledge.finish_intake']
        matches = any(command[i:i + len(signature)] == signature for i in range(len(command)))
        from pathlib import Path
        if not matches or Path(process.cwd()).resolve() != site.resolve():
            return 'identity_mismatch'
        return 'alive'
    except psutil.NoSuchProcess:
        return 'missing'
    except (psutil.AccessDenied, OSError, ValueError, KeyError, TypeError):
        return 'unknown'


def observed_status(checkpoint, role, site, now=None, probe=process_status):
    """Keep original timestamps/counts; never rewrite worker-owned checkpoints."""
    result = dict(checkpoint)
    active = {'running'} if role == 'embedding' else {
        'starting', 'waiting_for_existing_owner', 'waiting_for_acquisitions',
        'preflight', 'building', 'starting_embeddings', 'waiting_for_encoder',
        'embedding', 'verifying', 'refreshing_late_acquisitions', 'running'}
    if checkpoint.get('state') not in active:
        return result
    now = now or datetime.now(timezone.utc)
    try:
        age = (now - datetime.fromisoformat(checkpoint['updated_at'])).total_seconds()
    except (KeyError, TypeError, ValueError):
        age = None
    status = probe(checkpoint, role, site)
    result['reported_state'] = checkpoint['state']
    result['health'] = dict(checked_at=now.isoformat(), process=status,
                          checkpoint_age_seconds=age, stale_after_seconds=600)
    if status in ('missing', 'identity_mismatch'):
        result['state'] = 'stopped'
    elif status != 'alive':
        result['state'] = 'unknown'
    elif age is None or age < 0 or age > 600:
        result['state'] = 'stale'
    if result['state'] != checkpoint['state']:
        if 'rate_per_second' in result:
            result['last_recorded_rate_per_second'] = result['rate_per_second']
            result['rate_per_second'] = None
    return result
