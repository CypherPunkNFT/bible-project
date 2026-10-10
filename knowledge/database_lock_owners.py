"""Read-only Windows Restart Manager query for the Bible database lock."""
import ctypes,json
from ctypes import wintypes as w
from pathlib import Path

class UniqueProcess(ctypes.Structure):
    _fields_=[('pid',w.DWORD),('startTime',w.FILETIME)]
class ProcessInfo(ctypes.Structure):
    _fields_=[('process',UniqueProcess),('appName',w.WCHAR*256),('serviceName',w.WCHAR*64),
        ('appType',w.DWORD),('status',w.ULONG),('sessionId',w.DWORD),('restartable',w.BOOL)]
rm=ctypes.WinDLL('rstrtmgr',use_last_error=True)
rm.RmStartSession.argtypes=[ctypes.POINTER(w.DWORD),w.DWORD,w.LPWSTR]
rm.RmRegisterResources.argtypes=[w.DWORD,w.UINT,ctypes.POINTER(w.LPCWSTR),w.UINT,ctypes.c_void_p,w.UINT,ctypes.c_void_p]
rm.RmGetList.argtypes=[w.DWORD,ctypes.POINTER(w.UINT),ctypes.POINTER(w.UINT),ctypes.POINTER(ProcessInfo),ctypes.POINTER(w.DWORD)]
rm.RmEndSession.argtypes=[w.DWORD]
session=w.DWORD();key=ctypes.create_unicode_buffer(33)
code=rm.RmStartSession(ctypes.byref(session),0,key)
if code:raise OSError(code,'RmStartSession')
try:
    path=str((Path(__file__).resolve().parents[2]/'KnowledgeBase/knowledge.sqlite3').resolve())
    files=(w.LPCWSTR*1)(path)
    code=rm.RmRegisterResources(session,1,files,0,None,0,None)
    if code:raise OSError(code,'RmRegisterResources')
    needed=w.UINT();count=w.UINT();reason=w.DWORD()
    code=rm.RmGetList(session,ctypes.byref(needed),ctypes.byref(count),None,ctypes.byref(reason))
    rows=[]
    if code==234:
        count=w.UINT(needed.value);info=(ProcessInfo*count.value)()
        code=rm.RmGetList(session,ctypes.byref(needed),ctypes.byref(count),info,ctypes.byref(reason))
        if code:raise OSError(code,'RmGetList')
        rows=[{'pid':x.process.pid,'appName':x.appName,'serviceName':x.serviceName} for x in info[:count.value]]
    elif code:raise OSError(code,'RmGetList')
    print(json.dumps({'path':path,'holders':rows}))
finally:rm.RmEndSession(session)
