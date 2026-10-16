"""Interrupt only the worker identified by a private analytics coordinator lease."""
import argparse
import ctypes
import os
import signal
from pathlib import Path
from .build import PROJECT,readonly
from .inputs import packed
from .jobs import process_identity


def counters(owner):
    """Read CPU and I/O for the exact leased Windows process, without control access."""
    if os.name!='nt' or not owner:return None
    from ctypes import wintypes
    class IO(ctypes.Structure):
        _fields_=[(n,ctypes.c_ulonglong) for n in ('read_operations','write_operations','other_operations','read_bytes','write_bytes','other_bytes')]
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.OpenProcess.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.DWORD];kernel.OpenProcess.restype=wintypes.HANDLE
    kernel.GetProcessTimes.argtypes=[wintypes.HANDLE]+[ctypes.POINTER(wintypes.FILETIME)]*4
    kernel.GetProcessIoCounters.argtypes=[wintypes.HANDLE,ctypes.POINTER(IO)];kernel.CloseHandle.argtypes=[wintypes.HANDLE]
    handle=kernel.OpenProcess(0x400,False,owner['pid'])
    if not handle:return {'state':'inaccessible'}
    try:
        times=[wintypes.FILETIME() for _ in range(4)]
        if not kernel.GetProcessTimes(handle,*[ctypes.byref(t) for t in times]):return {'state':'inaccessible'}
        values=[(t.dwHighDateTime<<32)|t.dwLowDateTime for t in times]
        if str(values[0])!=owner['process_token']:return {'state':'process-identity-changed'}
        result={'cpu_seconds':round((values[2]+values[3])/10000000,2)};io=IO()
        if kernel.GetProcessIoCounters(handle,ctypes.byref(io)):result.update({n:getattr(io,n) for n,_ in io._fields_})
        return result
    finally:kernel.CloseHandle(handle)


def _terminate(owner):
    """Terminate an already authorized process through a creation-bound handle."""
    if os.name=='nt':
        from ctypes import wintypes
        kernel=ctypes.WinDLL('kernel32',use_last_error=True)
        kernel.OpenProcess.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.DWORD];kernel.OpenProcess.restype=wintypes.HANDLE
        kernel.GetProcessTimes.argtypes=[wintypes.HANDLE]+[ctypes.POINTER(wintypes.FILETIME)]*4
        kernel.TerminateProcess.argtypes=[wintypes.HANDLE,wintypes.UINT];kernel.CloseHandle.argtypes=[wintypes.HANDLE]
        handle=kernel.OpenProcess(0x1001,False,owner['pid'])
        if not handle:raise OSError(ctypes.get_last_error(),'Cannot open the product worker')
        try:
            times=[wintypes.FILETIME() for _ in range(4)]
            if not kernel.GetProcessTimes(handle,*[ctypes.byref(t) for t in times]):raise OSError(ctypes.get_last_error(),'Cannot verify product worker identity')
            token=str((times[0].dwHighDateTime<<32)|times[0].dwLowDateTime)
            if token!=owner['process_token']:raise RuntimeError('Product worker process identity changed')
            if not kernel.TerminateProcess(handle,130):raise OSError(ctypes.get_last_error(),'Cannot interrupt product worker')
        finally:kernel.CloseHandle(handle)
    else:
        if process_identity(owner['pid'])!=owner['process_token']:raise RuntimeError('Product worker process identity changed')
        os.kill(owner['pid'],signal.SIGINT)


def interrupt(project=PROJECT,scope='products'):
    if scope not in ('products','consumers'):raise ValueError('Unknown private analytics scope')
    db=readonly(Path(project)/('KnowledgeBase/library-analytics/pipeline/'+scope+'.sqlite3'))
    try:owner=dict(db.execute('SELECT * FROM coordinator').fetchone() or {})
    finally:db.close()
    if not owner:raise RuntimeError('No '+scope+' worker owns the coordinator')
    _terminate(owner)
    print(packed({'state':'interrupted','pid':owner['pid'],'scope':'LA03 '+scope+' worker only',
        'recovery':'Resume recovers an unfinished analytics transaction; committed output/checkpoints are retained.'}),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--project',type=Path,default=PROJECT);parser.add_argument('--scope',choices=('products','consumers'),default='products')
    args=parser.parse_args();interrupt(args.project,args.scope)
