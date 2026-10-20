"""Read-only Windows Restart Manager lock-owner query; never closes an owner."""
import ctypes,json,os
import subprocess
import sys
from ctypes import wintypes as w
from pathlib import Path

class UniqueProcess(ctypes.Structure):
    _fields_=[('pid',w.DWORD),('startTime',w.FILETIME)]
class ProcessInfo(ctypes.Structure):
    _fields_=[('process',UniqueProcess),('appName',w.WCHAR*256),('serviceName',w.WCHAR*64),
        ('appType',w.DWORD),('status',w.ULONG),('sessionId',w.DWORD),('restartable',w.BOOL)]


def lock_owners(paths):
    """Query exact process creation identities without shutting down any holder."""
    if os.name!='nt':return {'available':False,'reason':'Windows Restart Manager unavailable'}
    import psutil
    paths=[str(Path(path).resolve()) for path in paths]
    rm=ctypes.WinDLL('rstrtmgr',use_last_error=True)
    rm.RmStartSession.argtypes=[ctypes.POINTER(w.DWORD),w.DWORD,w.LPWSTR]
    rm.RmRegisterResources.argtypes=[w.DWORD,w.UINT,ctypes.POINTER(w.LPCWSTR),w.UINT,ctypes.c_void_p,w.UINT,ctypes.c_void_p]
    rm.RmGetList.argtypes=[w.DWORD,ctypes.POINTER(w.UINT),ctypes.POINTER(w.UINT),ctypes.POINTER(ProcessInfo),ctypes.POINTER(w.DWORD)]
    rm.RmEndSession.argtypes=[w.DWORD]
    session=w.DWORD();key=ctypes.create_unicode_buffer(33)
    code=rm.RmStartSession(ctypes.byref(session),0,key)
    if code:raise OSError(code,'RmStartSession')
    try:
        files=(w.LPCWSTR*len(paths))(*paths)
        code=rm.RmRegisterResources(session,len(paths),files,0,None,0,None)
        if code:raise OSError(code,'RmRegisterResources')
        needed=w.UINT();count=w.UINT();reason=w.DWORD();info=None
        for _ in range(4):
            code=rm.RmGetList(session,ctypes.byref(needed),ctypes.byref(count),info,ctypes.byref(reason))
            if code!=234:break
            count=w.UINT(needed.value);info=(ProcessInfo*count.value)()
        if code:raise OSError(code,'RmGetList')
        rows=[]
        for item in (info[:count.value] if info is not None else []):
            stamp=(item.process.startTime.dwHighDateTime<<32)|item.process.startTime.dwLowDateTime
            created=stamp/10_000_000-11_644_473_600
            row={'pid':item.process.pid,'process_created':created,'start_filetime':stamp,
                'appName':item.appName,'serviceName':item.serviceName,'sessionId':item.sessionId}
            try:
                process=psutil.Process(item.process.pid)
                row['identity_matches']=abs(process.create_time()-created)<.02
                if row['identity_matches']:
                    row.update(executable=process.exe(),command=process.cmdline(),cwd=process.cwd())
            except (psutil.NoSuchProcess,psutil.AccessDenied) as error:
                row['inspection_error']=type(error).__name__
            rows.append(row)
        return {'available':True,'paths':paths,'holders':rows}
    finally:rm.RmEndSession(session)


def bounded_lock_owners(paths,timeout=5):
    """Isolate Restart Manager so a stuck Windows service cannot hold publication."""
    command=[sys.executable,'-X','utf8','-m','knowledge.database_lock_owners',*[str(Path(path).resolve()) for path in paths]]
    try:
        result=subprocess.run(command,cwd=Path(__file__).resolve().parent.parent,
            stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
            encoding='utf-8',timeout=timeout,check=False,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
    except subprocess.TimeoutExpired:
        return {'available':False,'reason':'Restart Manager diagnostic timed out','timeout_seconds':timeout}
    if result.returncode:
        return {'available':False,'reason':'Restart Manager diagnostic failed','exit_code':result.returncode,
            'error':result.stderr[-2000:]}
    try:return json.loads(result.stdout)
    except ValueError:
        return {'available':False,'reason':'Restart Manager returned invalid JSON'}


if __name__=='__main__':
    default=Path(__file__).resolve().parents[2]/'KnowledgeBase/knowledge.sqlite3'
    print(json.dumps(lock_owners(sys.argv[1:] or [default]),ensure_ascii=False))
