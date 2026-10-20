"""Capture Part B receipts for chat transfer, without mutating running systems."""
import hashlib
import json
from pathlib import Path
import urllib.error
import urllib.request
from datetime import datetime, timezone
from knowledge.settings import load
from knowledge.native_supervisor import snapshot


def main():
    config=load();site=config['site_dir'];state=config['state_dir']
    folder=site/'initiatives/library-knowledge/distillation'
    target=folder/'handoff-2026-10-18.json'
    if target.exists():raise SystemExit('Handoff receipt exists; preserve it and choose a new dated path.')
    values={};fingerprints=[]
    for rel in ['embedding-progress.json','intake-completion.json','verification.json','embedding-model.json',
                'native-supervisor/status.json','native-supervisor/control.json','native-supervisor/recovery.json',
                'native-supervisor/alert.json','native-supervisor/arming-result.json',
                'native-supervisor/windowless-registration.json','embedding-repair-verified.json']:
        path=state/rel
        if not path.exists():continue
        raw=path.read_bytes();values[rel]=json.loads(raw.decode('utf-8-sig'))
        fingerprints.append(dict(path='KnowledgeBase/'+rel,sha256=hashlib.sha256(raw).hexdigest()))
    rows,unknown=snapshot(config)
    try:
        try:response=urllib.request.urlopen(config['embedding']['daemon_url']+'/health',timeout=3)
        except urllib.error.HTTPError as error:response=error
        with response:encoder=json.load(response)
    except Exception as error:encoder=dict(unavailable=type(error).__name__)
    model=config['embedding']
    result=dict(captured_at=datetime.now(timezone.utc).isoformat(),
        boundary='Read-only observations of files/processes/encoder health; not an atomic corpus snapshot or certification of completion',
        processes=rows,unknown_python_pids=unknown,encoder_health=encoder,
        configured_model={k:model[k] for k in ['model','revision','dimensions','max_tokens','batch_size','write_batch_size']},
        receipts=values,input_fingerprints=fingerprints)
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(output=str(target),captured_at=result['captured_at'],processes=rows,
        encoder=encoder,progress=values['embedding-progress.json'],supervisor=values['native-supervisor/status.json']),indent=2))
    for name in ['HANDOFF.md','NEW-CHAT-CONTEXT.md']:
        print(name)
        print('\n'.join((folder.parent/name).read_text('utf-8-sig').splitlines()[:18]))


if __name__=='__main__':main()
