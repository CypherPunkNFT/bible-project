"""Bounded read-only observation of this repair, not a recurring watchdog."""
import json
import time
from .settings import load, write_json
from .native_supervisor import read, stamp
from .vectors import table


def main():
    config=load();state=config['state_dir']
    before=read(state/'embedding-repair-resume.json')['before']['indexed']
    first=None
    deadline=time.monotonic()+900
    while time.monotonic()<deadline:
        progress=read(state/'embedding-progress.json')
        print(json.dumps(dict(at=stamp(),state=progress.get('state'),indexed=progress.get('indexed'),pid=progress.get('pid'))),flush=True)
        if progress.get('indexed',0)>before and progress.get('state')=='running':
            if first is None:first=(time.monotonic(),progress['indexed'])
            if time.monotonic()-first[0]>=60 and progress['indexed']>first[1]:
                saved=table(config).count_rows()
                receipt=dict(at=stamp(),before=before,checkpoint=progress,saved_rows=saved,
                    new_rows=saved-before,observed_chunks_per_second=round((progress['indexed']-first[1])/(time.monotonic()-first[0]),2))
                write_json(state/'embedding-repair-verified.json',receipt)
                print(json.dumps(receipt),flush=True);return
        if progress.get('state')=='interrupted' and progress.get('pid') !=120508:
            raise RuntimeError(str(progress))
        time.sleep(15)
    raise RuntimeError('No sustained writes confirmed within observation window')


if __name__=='__main__':main()
