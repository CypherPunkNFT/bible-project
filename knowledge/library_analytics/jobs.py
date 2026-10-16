"""SQLite job ownership, crash recovery, and atomic result/checkpoint commits."""
import ctypes
import json
import os
import sqlite3
import time
import uuid
from pathlib import Path


def process_identity(pid):
    """Return a creation token, None for dead, or 'unknown' for inaccessible."""
    if os.name == 'nt':
        from ctypes import wintypes
        kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        kernel.OpenProcess.restype = wintypes.HANDLE
        kernel.GetProcessTimes.argtypes = [wintypes.HANDLE] + [ctypes.POINTER(wintypes.FILETIME)] * 4
        kernel.GetExitCodeProcess.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.DWORD)]
        kernel.CloseHandle.argtypes = [wintypes.HANDLE]
        handle = kernel.OpenProcess(0x1000, False, pid)
        if not handle:
            return None if ctypes.get_last_error() == 87 else 'unknown'
        try:
            code = wintypes.DWORD()
            if not kernel.GetExitCodeProcess(handle, ctypes.byref(code)):
                return 'unknown'
            if code.value != 259:
                return None
            times = [wintypes.FILETIME() for _ in range(4)]
            if not kernel.GetProcessTimes(handle, *[ctypes.byref(t) for t in times]):
                return 'unknown'
            return str((times[0].dwHighDateTime << 32) | times[0].dwLowDateTime)
        finally:
            kernel.CloseHandle(handle)
    try:
        raw = Path(f'/proc/{pid}/stat').read_text()
        return raw[raw.rfind(')') + 2:].split()[19]
    except FileNotFoundError:
        return None
    except OSError:
        return 'unknown'


def background_priority():
    """Correct pointer-width signatures matter for the Windows pseudo-handle."""
    if os.name != 'nt':
        os.nice(10)
        return
    from ctypes import wintypes
    kernel = ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.GetCurrentProcess.restype = wintypes.HANDLE
    kernel.SetPriorityClass.argtypes = [wintypes.HANDLE,wintypes.DWORD]
    kernel.SetPriorityClass.restype = wintypes.BOOL
    kernel.GetPriorityClass.argtypes = [wintypes.HANDLE]
    kernel.GetPriorityClass.restype = wintypes.DWORD
    handle = kernel.GetCurrentProcess()
    if not kernel.SetPriorityClass(handle,0x4000) or kernel.GetPriorityClass(handle)!=0x4000:
        raise OSError(ctypes.get_last_error(),'Unable to establish below-normal analytics priority')


SCHEMA = '''
CREATE TABLE IF NOT EXISTS coordinator(
 singleton INTEGER PRIMARY KEY CHECK(singleton=1),owner TEXT,pid INTEGER,process_token TEXT,heartbeat REAL);
CREATE TABLE IF NOT EXISTS jobs(
 id TEXT PRIMARY KEY,task TEXT,scope TEXT,fingerprint TEXT,version TEXT,
 state TEXT CHECK(state IN ('pending','running','succeeded','failed','stale')),
 owner TEXT,attempts INTEGER NOT NULL DEFAULT 0,heartbeat REAL,error TEXT,completed_at REAL);
CREATE TABLE IF NOT EXISTS job_attempts(
 id INTEGER PRIMARY KEY,job_id TEXT,owner TEXT,started_at REAL,ended_at REAL,state TEXT,error TEXT);
CREATE TABLE IF NOT EXISTS checkpoints(job_id TEXT PRIMARY KEY,completed_at REAL,rows INTEGER);
CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,created_at REAL,updated_at REAL,state TEXT,warehouse TEXT,summary_json TEXT);
CREATE TABLE IF NOT EXISTS run_jobs(run_id TEXT,scope TEXT,job_id TEXT,PRIMARY KEY(run_id,scope));
CREATE INDEX IF NOT EXISTS run_jobs_job ON run_jobs(job_id);
PRAGMA user_version=1;
'''


class JobStore:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.path, timeout=10)
        self.db.row_factory = sqlite3.Row
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('PRAGMA synchronous=FULL')
        self.db.execute('PRAGMA cache_size=-16384')
        self.db.execute('PRAGMA temp_store=FILE')
        self.db.executescript(SCHEMA)
        self.owner = uuid.uuid4().hex
        self.acquired = False

    def acquire(self):
        token = process_identity(os.getpid())
        if token in (None, 'unknown'):
            raise RuntimeError('Cannot establish coordinator process creation identity')
        with self.db:
            self.db.execute('BEGIN IMMEDIATE')
            old = self.db.execute('SELECT * FROM coordinator WHERE singleton=1').fetchone()
            if old:
                live = process_identity(old['pid'])
                if live == 'unknown' or live == old['process_token']:
                    raise RuntimeError(f"Analytics coordinator already owned by PID {old['pid']}; ownership cannot be safely recovered")
            # A graceful interruption may have removed the coordinator record.
            # Once the exclusive ownership check passes, no running lease remains valid.
            self.db.execute("UPDATE job_attempts SET state='abandoned',ended_at=? WHERE state='running'", (time.time(),))
            self.db.execute("UPDATE jobs SET state='pending',owner=NULL,error='Recovered abandoned process' WHERE state='running'")
            self.db.execute('INSERT OR REPLACE INTO coordinator VALUES(1,?,?,?,?)',
                            (self.owner, os.getpid(), token, time.time()))
        self.acquired = True

    def heartbeat(self):
        with self.db:
            changed = self.db.execute('UPDATE coordinator SET heartbeat=? WHERE owner=?', (time.time(), self.owner)).rowcount
            if not changed:
                raise RuntimeError('Lost coordinator ownership')

    def register(self, run, job_id, task, scope, fingerprint, version):
        with self.db:
            self.db.execute("INSERT OR IGNORE INTO jobs(id,task,scope,fingerprint,version,state) VALUES(?,?,?,?,?,'pending')",
                            (job_id, task, scope, fingerprint, version))
            self.db.execute('INSERT OR REPLACE INTO run_jobs VALUES(?,?,?)', (run, scope, job_id))

    def register_many(self, records):
        """Same job identities/ownership, one durable registration transaction."""
        with self.db:
            self.db.executemany("INSERT OR IGNORE INTO jobs(id,task,scope,fingerprint,version,state) VALUES(?,?,?,?,?,'pending')",
                [(job,task,scope,fingerprint,version) for run,job,task,scope,fingerprint,version in records])
            self.db.executemany('INSERT OR REPLACE INTO run_jobs VALUES(?,?,?)',
                [(run,scope,job) for run,job,task,scope,fingerprint,version in records])

    def execute_many(self, work, *, retry_failed=False, max_jobs=32):
        """Bounded group commits; each result/checkpoint remains atomic.

        Claims commit first. A per-job savepoint isolates bad input; successful
        facts and checkpoints commit together in the final group transaction.
        Process death rolls back that group; existing lease recovery resets its
        abandoned claims. Previously committed groups are never replayed.
        """
        if not self.acquired:raise RuntimeError('No coordinator ownership')
        if not 1<=max_jobs<=256 or len(work)>max_jobs or len({job for job,writer in work})!=len(work):
            raise ValueError('Expected distinct jobs within the declared bound (default 32, maximum 256)')
        result={};claimed=[]
        with self.db:
            self.db.execute('BEGIN IMMEDIATE')
            for job,writer in work:
                row=self.db.execute('SELECT state FROM jobs WHERE id=?',(job,)).fetchone()
                if not row:raise ValueError('Unregistered job')
                if row['state']=='succeeded':result[job]='skipped';continue
                if row['state'] in ('failed','stale') and not retry_failed:result[job]=row['state'];continue
                if row['state']=='running':raise RuntimeError('Attempt to claim a running job')
                self.db.execute("UPDATE jobs SET state='running',owner=?,attempts=attempts+1,heartbeat=?,error=NULL WHERE id=?",
                    (self.owner,time.time(),job))
                attempt=self.db.execute("INSERT INTO job_attempts(job_id,owner,started_at,state) VALUES(?,?,?,'running')",
                    (job,self.owner,time.time())).lastrowid
                claimed.append((job,writer,attempt))
        if not claimed:return result
        with self.db:
            self.db.execute('BEGIN IMMEDIATE')
            for job,writer,attempt in claimed:
                self.db.execute('SAVEPOINT job_result')
                try:
                    count=writer(self.db);stamp=time.time()
                    self.db.execute('INSERT OR REPLACE INTO checkpoints VALUES(?,?,?)',(job,stamp,count))
                    changed=self.db.execute("UPDATE jobs SET state='succeeded',completed_at=?,heartbeat=? WHERE id=? AND owner=? AND state='running'",
                        (stamp,stamp,job,self.owner)).rowcount
                    if changed!=1:raise RuntimeError('Job ownership changed during completion')
                    self.db.execute("UPDATE job_attempts SET state='succeeded',ended_at=? WHERE id=?",(stamp,attempt))
                    self.db.execute('RELEASE job_result');result[job]='completed'
                except Exception as exc:
                    self.db.execute('ROLLBACK TO job_result');self.db.execute('RELEASE job_result')
                    state='stale' if isinstance(exc,StaleInput) else 'failed'
                    self.db.execute('UPDATE jobs SET state=?,error=? WHERE id=?',(state,str(exc),job))
                    self.db.execute('UPDATE job_attempts SET state=?,ended_at=?,error=? WHERE id=?',(state,time.time(),str(exc),attempt))
                    result[job]=state
            self.db.execute('UPDATE coordinator SET heartbeat=? WHERE owner=?',(time.time(),self.owner))
        return result

    def execute(self, job_id, writer, *, retry_failed=False):
        """writer(db) results and success checkpoint commit together or neither."""
        with self.db:
            self.db.execute('BEGIN IMMEDIATE')
            row = self.db.execute('SELECT * FROM jobs WHERE id=?', (job_id,)).fetchone()
            if row['state'] == 'succeeded':
                return 'skipped'
            if row['state'] in ('failed', 'stale') and not retry_failed:
                return row['state']
            if row['state'] == 'running':
                raise RuntimeError('Attempt to claim a running job')
            self.db.execute("UPDATE jobs SET state='running',owner=?,attempts=attempts+1,heartbeat=?,error=NULL WHERE id=?",
                            (self.owner, time.time(), job_id))
            attempt = self.db.execute("INSERT INTO job_attempts(job_id,owner,started_at,state) VALUES(?,?,?,'running')",
                                      (job_id, self.owner, time.time())).lastrowid
        try:
            with self.db:
                self.db.execute('BEGIN IMMEDIATE')
                count = writer(self.db)
                stamp = time.time()
                self.db.execute('INSERT OR REPLACE INTO checkpoints VALUES(?,?,?)', (job_id, stamp, count))
                changed = self.db.execute("UPDATE jobs SET state='succeeded',completed_at=?,heartbeat=? WHERE id=? AND owner=? AND state='running'",
                                          (stamp, stamp, job_id, self.owner)).rowcount
                if changed != 1:
                    raise RuntimeError('Job ownership changed during completion')
                self.db.execute("UPDATE job_attempts SET state='succeeded',ended_at=? WHERE id=?", (stamp, attempt))
                self.db.execute('UPDATE coordinator SET heartbeat=? WHERE owner=?', (stamp, self.owner))
            return 'completed'
        except Exception as exc:
            state = 'stale' if isinstance(exc, StaleInput) else 'failed'
            with self.db:
                self.db.execute('UPDATE jobs SET state=?,error=? WHERE id=?', (state, str(exc), job_id))
                self.db.execute('UPDATE job_attempts SET state=?,ended_at=?,error=? WHERE id=?', (state, time.time(), str(exc), attempt))
            return state

    def close(self):
        if self.acquired:
            with self.db:
                self.db.execute("UPDATE job_attempts SET state='abandoned',ended_at=? WHERE owner=? AND state='running'", (time.time(), self.owner))
                self.db.execute("UPDATE jobs SET state='pending',owner=NULL,error='Coordinator interrupted' WHERE owner=? AND state='running'", (self.owner,))
                self.db.execute('DELETE FROM coordinator WHERE owner=?', (self.owner,))
        self.db.close()


class StaleInput(RuntimeError):
    pass
