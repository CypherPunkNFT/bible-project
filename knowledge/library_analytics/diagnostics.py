"""Read-only worker diagnostics, including long validation/export phases."""
import ctypes
import argparse
import json
import os
import time
from pathlib import Path
from ctypes import wintypes
from .build import DEFAULT_OUT, PROJECT, readonly
from .jobs import process_identity


def examples(db, run):
    """Small source/language sample for human interpretation review."""
    selected = {}
    for row in db.execute('''SELECT c.job_id,c.language,s.descriptor_json FROM reference_coverage c
        JOIN run_jobs r ON r.job_id=c.job_id JOIN text_scope s ON s.run_id=r.run_id AND s.document_id=c.document_id
        WHERE r.run_id=? AND c.accepted>0 ORDER BY c.document_id''',(run,)):
        d = json.loads(row['descriptor_json'])
        if row['language'] in ('en','enm','la','grc'):
            if d['source_family'] in ('ia','tcp','ccel','monergism','sword','gutenberg','chapel'):
                selected.setdefault((row['language'],d['source_family']), (dict(row),d))
    output = []
    for key in sorted(selected):
        row,d = selected[key]
        ref = db.execute('SELECT book,chapter,verse,end_chapter,end_verse,reference_kind,evidence_json FROM literal_references WHERE job_id=? LIMIT 1',(row['job_id'],)).fetchone()
        contexts = []
        for span in json.loads(ref['evidence_json'])['segments']:
            if span['coordinate']=='corpus-chunk':
                corpus = readonly(Path(span['path']))
                try: value = corpus.execute('SELECT text FROM chunks WHERE id=?',(span['chunk_id'],)).fetchone()[0]
                finally: corpus.close()
            else:
                with Path(span['path']).open(encoding='utf-8-sig') as stream:
                    for i,line in enumerate(stream):
                        if i==span['block_ordinal']:
                            value = json.loads(line)['text'];break
            contexts.append({'literal':span['literal'],'context':value[max(0,span['start']-100):span['end']+100]})
        output.append({'document_id':d['document_id'],'title':d['title'],'language':key[0],'source_family':key[1],
                       'reference':{k:ref[k] for k in ('book','chapter','verse','end_chapter','end_verse','reference_kind')},
                       'contexts':contexts})
    return output


def worker_counters(pid, token):
    if os.name != 'nt' or process_identity(pid) != token:
        return {'identity': process_identity(pid)}
    class IO(ctypes.Structure):
        _fields_ = [(name, ctypes.c_ulonglong) for name in
                    ('read_ops', 'write_ops', 'other_ops', 'read_bytes', 'write_bytes', 'other_bytes')]
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.GetProcessTimes.argtypes = [wintypes.HANDLE] + [ctypes.POINTER(wintypes.FILETIME)] * 4
    kernel.GetProcessIoCounters.argtypes = [wintypes.HANDLE, ctypes.POINTER(IO)]
    kernel.GetPriorityClass.argtypes = [wintypes.HANDLE]
    kernel.GetPriorityClass.restype = wintypes.DWORD
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    handle = kernel.OpenProcess(0x1000, False, pid)
    if not handle:
        return {'error': ctypes.get_last_error()}
    try:
        times = [wintypes.FILETIME() for _ in range(4)]
        counters = IO()
        if not kernel.GetProcessTimes(handle, *[ctypes.byref(t) for t in times]):
            raise OSError(ctypes.get_last_error())
        if not kernel.GetProcessIoCounters(handle, ctypes.byref(counters)):
            raise OSError(ctypes.get_last_error())
        seconds = lambda t: ((t.dwHighDateTime << 32) | t.dwLowDateTime) / 10_000_000
        return {**{name: getattr(counters, name) for name, _ in IO._fields_},
                'user_cpu_seconds': seconds(times[3]), 'kernel_cpu_seconds': seconds(times[2]),
                'priority_class': kernel.GetPriorityClass(handle)}
    finally:
        kernel.CloseHandle(handle)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--plans', action='store_true')
    parser.add_argument('--examples', action='store_true')
    parser.add_argument('--run')
    parser.add_argument('--population', action='store_true')
    args = parser.parse_args()
    if args.population:
        db = readonly(PROJECT / 'KnowledgeBase/knowledge.sqlite3')
        try:
            print(json.dumps([dict(r) for r in db.execute('SELECT kind,count(*) documents FROM documents GROUP BY kind')]))
        finally: db.close()
        return
    db = readonly(DEFAULT_OUT / 'pipeline/pipeline.sqlite3')
    owner = db.execute('SELECT * FROM coordinator').fetchone()
    record = db.execute('SELECT id,state FROM text_runs ORDER BY created_at DESC LIMIT 1').fetchone()
    if args.examples:
        print(json.dumps(examples(db,args.run or record['id'])))
        db.close()
        return
    plans = []
    if args.plans and record:
        query = '''SELECT count(*) FROM reference_coverage c JOIN run_jobs r ON r.job_id=c.job_id WHERE r.run_id=? AND
            (c.accepted!=(SELECT count(*) FROM literal_references l WHERE l.job_id=c.job_id AND l.document_id=c.document_id)
            OR c.rejected!=(SELECT count(*) FROM reference_rejections x WHERE x.job_id=c.job_id AND x.document_id=c.document_id))'''
        plans = [dict(r) for r in db.execute('EXPLAIN QUERY PLAN ' + query, (record['id'],))]
    db.close()
    print(json.dumps({'checked_at': time.time(), 'run': dict(record) if record else None,
                      'worker': dict(owner) if owner else None,
                      'counters': worker_counters(owner['pid'], owner['process_token']) if owner else None,
                      'validation_query_plan': plans}))


if __name__ == '__main__':
    main()
