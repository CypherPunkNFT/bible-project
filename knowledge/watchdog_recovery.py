"""Persistent, count-verified recovery timers; no subprocesses or vector writes."""
from datetime import datetime, timezone

CHECK_SECONDS = 60
STARTUP_SECONDS = 120
PROGRESS_SECONDS = 600
RECONCILE_SECONDS = 1800


def elapsed(value, now):
    try:
        return max(0, (now-datetime.fromisoformat(value.replace('Z','+00:00'))).total_seconds())
    except (AttributeError, TypeError, ValueError):
        return float('inf')


def plan(progress, completion, processes, now, previous=None, paused=False):
    state=dict(previous or {})
    stamp=now.isoformat()
    if paused:
        return 'paused', state
    if processes.get('build') or processes.get('refresh'):
        # Never interrupt a publication or count its time as an embedding stall.
        state.update(lastVectorAt=stamp,phaseAt=stamp,lastAttemptAt=stamp if state.get('stage') else state.get('lastAttemptAt'))
        return 'building', state
    if processes.get('verify'):
        state.update(lastVectorAt=stamp,phaseAt=stamp)
        return 'verifying', state
    build=progress.get('corpus_build')
    indexed=int(progress.get('indexed',0) or 0)
    phase=progress.get('state','unknown')
    if state.get('corpusBuild')!=build or 'indexed' not in state:
        state=dict(corpusBuild=build,indexed=indexed,lastVectorAt=stamp,phase=phase,phaseAt=stamp,stage=None,attempts=0)
    elif indexed>state['indexed']:
        state.update(indexed=indexed,lastVectorAt=stamp,stage=None,verifiedAt=stamp,
                     verifiedBy='saved vector count increased',lastError=None)
    elif indexed<state['indexed']:
        # Legitimate reconciliation can discard IDs absent from the current build.
        state.update(indexed=indexed,lastVectorAt=stamp)
    if phase!=state.get('phase'):
        state.update(phase=phase,phaseAt=stamp)
    if phase=='complete':
        state.update(stage=None,verifiedAt=stamp,verifiedBy='embedding completion status')
        if completion.get('state')=='complete': return 'complete',state
        if processes.get('monitor'):
            if completion.get('state') in ('waiting_for_acquisitions','waiting_for_source_database_reader','snapshot_complete_followup_pending'):
                return 'waiting_for_acquisition',state
            if elapsed(progress.get('updated_at'),now)<300 or elapsed(completion.get('updated_at') or completion.get('started_at'),now)<STARTUP_SECONDS:
                return 'verifying',state
        return 'resume_monitor',state
    current_phase=not state.get('stage') or progress.get('pid') in processes.get('embed',[])
    if phase=='waiting_for_gpu' and processes.get('embed') and current_phase:
        # Another application owns the GPU. Never kill it or the hardware lock.
        state.update(lastVectorAt=stamp)
        return 'waiting_for_gpu',state
    if phase=='optimizing' and processes.get('embed') and current_phase:
        return 'optimizing',state
    stage=state.get('stage')
    if stage:
        since=elapsed(state.get('lastAttemptAt'),now)
        if not processes.get('embed'):
            if since<STARTUP_SECONDS: return 'verifying_restart_startup',state
        elif phase=='reconciling':
            # A large corpus sort/read before the first new vector is legitimate.
            if since<RECONCILE_SECONDS: return 'verifying_restart_reconciliation',state
        elif since<PROGRESS_SECONDS:
            return 'verifying_restart_progress',state
        action='restart_hard'
    elif not processes.get('embed'):
        if processes.get('monitor') and completion.get('state') in ('waiting_for_acquisitions','waiting_for_source_database_reader'):
            return 'waiting_for_acquisition',state
        action='restart_soft'
    elif phase=='reconciling':
        if elapsed(state.get('phaseAt'),now)<RECONCILE_SECONDS: return 'reconciling',state
        action='restart_soft'
    elif elapsed(state.get('lastVectorAt'),now)<PROGRESS_SECONDS and elapsed(progress.get('updated_at'),now)<PROGRESS_SECONDS:
        return ('healthy' if processes.get('monitor') else 'attach_monitor'),state
    else:
        action='restart_soft'
    state.update(stage='hard' if action=='restart_hard' else 'soft',lastAttemptAt=stamp,
                 attempts=state.get('attempts',0)+1,baselineIndexed=indexed,
                 lastError=None,verifiedBy=None)
    return action,state
