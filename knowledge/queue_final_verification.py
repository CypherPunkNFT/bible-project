"""Authorize step five after the active embedding-only pass; never launch work here."""
import json
from .settings import load, write_json
from .native_supervisor import read, stamp


def queue(config):
    import msvcrt
    folder = config['state_dir']/'native-supervisor'
    with (folder/'supervisor.lock').open('a+b') as lock:
        lock.seek(0)
        msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        path = folder/'control.json'
        control = read(path)
        if control.get('mode') != 'embedding_only' or control.get('enabled') is not True:
            raise RuntimeError('Expected the authorized active embedding-only run')
        request = dict(state='queued', requested_at=stamp(), run_id=control['run_id'],
                       corpus_build=control['corpus_build'], scope='verification_and_late_acquisitions_only',
                       graph_authorized=False, mining_authorized=False)
        existing = control.get('verification_request')
        if existing:
            if existing.get('run_id') != request['run_id']:
                raise RuntimeError('Another verification request exists')
            return existing
        write_json(folder/'verification-before.json', control)
        write_json(path, dict(control, verification_request=request))
        write_json(folder/'verification-request.json', request)
        return request


if __name__ == '__main__':
    print(json.dumps(queue(load()), indent=2))
