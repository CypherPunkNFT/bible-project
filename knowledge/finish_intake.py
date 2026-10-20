"""Native one-owner refresh, saved-vector resume and completion verification.

Uses the existing build/embed commands; no PowerShell, downloads or graph launch.
"""
import argparse
from contextlib import closing
import ctypes
import json
import os
import subprocess
import time
import urllib.error
import urllib.request
from datetime import datetime,timezone
from pathlib import Path
from .settings import load,write_json


def now():return datetime.now(timezone.utc).isoformat()
def read(path):return json.loads(Path(path).read_text(encoding='utf-8-sig')) if Path(path).exists() else {}
def hidden_flags():return subprocess.CREATE_NO_WINDOW|subprocess.DETACHED_PROCESS|subprocess.CREATE_NEW_PROCESS_GROUP if os.name=='nt' else 0


def drift_requires_refresh(verification):
    fields=('new_library_files_since_snapshot','changed_library_ledgers_since_snapshot',
        'new_source_files_since_snapshot','changed_source_inputs_since_snapshot',
        'missing_library_files_since_snapshot','missing_source_inputs_since_snapshot')
    if any(k not in verification for k in fields):raise ValueError('Incomplete source-drift verification')
    return any(verification[k] for k in fields)


def require_parity(verification):
    counters=('missing_vectors','stale_vectors','duplicate_vectors','foreign_key_errors')
    if (not verification.get('complete') or not verification.get('corpus_build')
        or verification.get('sqlite_integrity')!='ok' or not verification.get('embedding_identity_matches')
        or not verification.get('chunks') or verification.get('vectors')!=verification.get('chunks')
        or any(verification.get(k)!=0 for k in counters)):
        raise ValueError('Corpus/vector parity or integrity is incomplete')


def acquisition_owners(config):
    import psutil
    result=[]
    patterns=('bulk_collect.py collect','bulk-tcp.py','bulk-queue.py',
        'collect-expanded-libraries.py','collect-piper-books.py','knowledge.patristic_collect collect')
    project=str(config['state_dir'].parent).casefold()
    for p in psutil.process_iter(['pid','name']):
        if (p.info['name'] or '').casefold() not in ('python.exe','pythonw.exe'):continue
        try:
            command=' '.join(p.cmdline()).replace('\\','/').casefold()
            if project.replace('\\','/') in command and any(part in command for part in patterns):result.append(p.pid)
        except (psutil.NoSuchProcess,psutil.AccessDenied):continue
    return result


class Completion:
    def __init__(self,config):
        import psutil
        self.config=config;self.state=config['state_dir'];self.site=config['site_dir']
        self.python=self.state/'.venv/Scripts/python.exe';self.pid=os.getpid()
        self.created=psutil.Process().create_time();self.started=now()
        self.run_id='native-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')+'-'+str(self.pid)
        self.folder=self.state/'native-intake'/self.run_id;self.folder.mkdir(parents=True)
        self.phase='starting';self.child=None

    def status(self,phase=None,**extra):
        if phase:self.phase=phase
        value={'state':self.phase,'pid':self.pid,'process_created':self.created,'started_at':self.started,
            'updated_at':now(),'launcher':'native-python','run_id':self.run_id,
            'run_directory':str(self.folder),'enrichment_started':False,**extra}
        if self.child and self.child.poll() is None:value['child_pid']=self.child.pid
        write_json(self.state/'intake-completion.json',value)
        write_json(self.folder/'progress.json',value)
        return value

    def command(self,command):
        names={'build':'intake-build','embed':'embedding','verify':'intake-verification'}
        name=names[command]
        with (self.state/(name+'.log')).open('ab') as output,(self.state/(name+'-error.log')).open('ab') as error:
            self.child=subprocess.Popen([str(self.python),'-u','-m','knowledge',command],cwd=self.site,
                stdin=subprocess.DEVNULL,stdout=output,stderr=error,creationflags=hidden_flags())
            write_json(self.folder/(command+'-launch.json'),{'pid':self.child.pid,'command':command,
                'launched_at':now(),'stdout':str(self.state/(name+'.log')),'stderr':str(self.state/(name+'-error.log'))})
            while self.child.poll() is None:
                self.status();time.sleep(10)
            code=self.child.returncode;self.child=None
        if code:raise RuntimeError(command+' failed with exit '+str(code)+'; inspect '+name+'-error.log')

    def wait_existing(self):
        from .watchdog import inventory
        while True:
            owners=inventory(self.config)
            active=owners['build']+owners['embed']+owners['refresh']+owners['startup']
            if not active:break
            self.status('waiting_for_existing_owner',owner_pids=active);time.sleep(10)

    def wait_acquisitions(self):
        while True:
            owners=acquisition_owners(self.config)
            if not owners:return
            self.status('waiting_for_acquisitions',acquisition_pids=owners);time.sleep(10)

    def refresh(self):
        from .campaign_coordinator import archive_moves,prepare
        self.wait_acquisitions();self.wait_existing();self.status('preflight')
        archive_moves(self.config)
        if (self.state/'campaign-coordination/intake-plan.json').exists():prepare(self.config)
        self.status('building');self.command('build')

    def encoder(self):
        url=self.config['embedding']['daemon_url'].rstrip('/')+'/health'
        def health():
            try:
                with urllib.request.urlopen(url,timeout=3) as response:value=json.load(response)
            except (urllib.error.URLError,TimeoutError):return None
            if value.get('service')!='bible-project-encoder':raise RuntimeError('Embedding port belongs to another service')
            return value
        if health():return
        from .watchdog import inventory
        owners=inventory(self.config)['encoder']
        if not owners:
            with (self.state/'encoder.log').open('ab') as output,(self.state/'encoder-error.log').open('ab') as error:
                service=subprocess.Popen([str(self.python),'-u','-m','knowledge','encoder'],cwd=self.site,
                    stdin=subprocess.DEVNULL,stdout=output,stderr=error,creationflags=hidden_flags())
            write_json(self.folder/'encoder-launch.json',{'pid':service.pid,'launched_at':now()})
        for _ in range(60):
            if health():return
            self.status('waiting_for_encoder');time.sleep(1)
        raise RuntimeError('Bible encoder is not ready; inspect encoder-error.log')

    def run(self,refresh=True):
        from .embedding_scope import embedding_only, PENDING
        if refresh and embedding_only():
            raise RuntimeError('Embedding-only authorization prohibits a corpus refresh')
        if os.name!='nt':raise RuntimeError('Native completion launcher is currently Windows-only')
        import msvcrt
        with (self.state/'finish-intake.lock').open('a+b') as lock:
            lock.seek(0)
            try:msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
            except OSError:raise RuntimeError('Another completion owner holds finish-intake.lock')
            before={name:read(self.state/name) for name in ('embedding-progress.json','intake-completion.json','verification.json')}
            write_json(self.folder/'before.json',before)
            # Keep this explicitly authorized computation awake without a scheduler.
            ctypes.windll.kernel32.SetThreadExecutionState(0x80000001)
            try:
                self.wait_existing()
                if refresh:self.refresh()
                while True:
                    self.status('starting_embeddings');self.encoder()
                    self.status('embedding');self.command('embed')
                    if embedding_only():
                        progress = read(self.state/'embedding-progress.json')
                        if progress.get('state') != PENDING or progress.get('remaining') != 0:
                            raise RuntimeError('Embedding-only pass did not reach its terminal checkpoint')
                        self.status(PENDING, embedding=progress, verification_started=False)
                        from .campaign_coordinator import report
                        report(self.config)
                        return
                    self.wait_acquisitions();self.status('verifying')
                    if os.environ.get('BIBLE_VERIFY_ONLY') == '1':
                        self.command('verify')
                    verification=read(self.state/'verification.json')
                    require_parity(verification)
                    progress=read(self.state/'embedding-progress.json')
                    from .store import connect
                    # sqlite3.Connection.__exit__ commits/rolls back; it does not
                    # close the handle.  Keeping this connection alive across a
                    # late-source refresh prevents Windows publishing its rebuild.
                    with closing(connect(self.config['db'],readonly=True)) as published:
                        current_build=published.execute("SELECT value FROM meta WHERE key='built_at'").fetchone()[0]
                    if (progress.get('state')!='complete' or progress.get('corpus_build')!=current_build
                        or verification['corpus_build']!=current_build):raise RuntimeError('Completion receipts do not match the published corpus')
                    from .campaign_coordinator import archive_moves,final_handoffs,report
                    archive_moves(self.config)
                    if drift_requires_refresh(verification):
                        self.status('refreshing_late_acquisitions',verification=verification);self.refresh();continue
                    if not verification.get('enrichment_ready'):raise RuntimeError('Explicit text/source coverage gaps remain; inspect verification.json')
                    if os.environ.get('BIBLE_VERIFY_ONLY') != '1' and (self.state/'campaign-coordination/intake-plan.json').exists():final_handoffs(self.config)
                    self.status('complete',completed_at=now(),verification=verification)
                    report(self.config)
                    print(json.dumps({'state':'complete','run_id':self.run_id,'verification':verification}),flush=True)
                    return
            except BaseException as error:
                self.status('needs_attention',error=str(error));raise
            finally:ctypes.windll.kernel32.SetThreadExecutionState(0x80000000)


def launch(config,refresh):
    from .watchdog import inventory
    owners=inventory(config)
    if owners['monitor']:raise RuntimeError('An existing completion monitor is active: '+str(owners['monitor']))
    state=config['state_dir'];state.mkdir(parents=True,exist_ok=True)
    with (state/'intake-completion.log').open('ab') as output,(state/'intake-completion-error.log').open('ab') as error:
        process=subprocess.Popen([str(state/'.venv/Scripts/python.exe'),'-u','-m','knowledge.finish_intake',
            '--refresh' if refresh else '--resume'],cwd=config['site_dir'],stdin=subprocess.DEVNULL,
            stdout=output,stderr=error,creationflags=hidden_flags())
    receipt={'launched_pid':process.pid,'launched_at':now(),'refresh':refresh,'native':True,
        'stdout':str(state/'intake-completion.log'),'stderr':str(state/'intake-completion-error.log')}
    write_json(state/'native-intake-launch.json',receipt);print(json.dumps(receipt),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    mode=parser.add_mutually_exclusive_group(required=True);mode.add_argument('--refresh',action='store_true');mode.add_argument('--resume',action='store_true')
    parser.add_argument('--launch',action='store_true',help='Run one hidden completion process in the background')
    args=parser.parse_args();config=load()
    if args.launch:launch(config,args.refresh)
    else:Completion(config).run(args.refresh)
