"""Correct scheduler-default background priority for the current bounded test."""
import ctypes
import json
import re
import psutil
from .settings import load, write_json
from .native_supervisor import read, snapshot, stamp


if __name__ == '__main__':
    config = load()
    runtime = config['state_dir']/'native-supervisor'
    scope = read(runtime/'control.json').get('test_scope')
    if not scope:
        raise RuntimeError('No bounded test is active')
    rows, unknown = snapshot(config)
    if unknown or not rows or any(r['role'] not in ('owner', 'embed') for r in rows):
        raise RuntimeError('Cannot identify the bounded test processes')
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.OpenProcess.argtypes = [ctypes.c_ulong, ctypes.c_int, ctypes.c_ulong]
    kernel.OpenProcess.restype = ctypes.c_void_p
    kernel.SetProcessInformation.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_void_p, ctypes.c_ulong]
    kernel.SetProcessInformation.restype = ctypes.c_int
    kernel.CloseHandle.argtypes = [ctypes.c_void_p]
    evidence = dict(at=stamp(), processes=[])
    for row in rows:
        process = psutil.Process(row['pid'])
        if (abs(process.create_time()-row['created']) > .001 or
                json.loads(process.environ().get('BIBLE_RECOVERY_TEST_SCOPE', '{}')).get('test_id') != scope['test_id']):
            raise RuntimeError('Process identity is outside this bounded test')
        entry = dict(pid=process.pid, before_cpu=int(process.nice()), before_io=int(process.ionice()))
        process.nice(psutil.NORMAL_PRIORITY_CLASS)
        process.ionice(psutil.IOPRIO_NORMAL)
        handle = kernel.OpenProcess(0x0200 | 0x0400, False, process.pid)
        if not handle:
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            normal_memory_priority = ctypes.c_ulong(5)
            if not kernel.SetProcessInformation(handle, 0, ctypes.byref(normal_memory_priority), ctypes.sizeof(normal_memory_priority)):
                raise ctypes.WinError(ctypes.get_last_error())
        finally:
            kernel.CloseHandle(handle)
        entry.update(after_cpu=int(process.nice()), after_io=int(process.ionice()), memory_priority=5)
        evidence['processes'].append(entry)
    path = runtime/'task.xml'
    original = path.read_bytes()
    (runtime/scope['test_id']/'task-before-priority.xml').write_bytes(original)
    xml = original.decode('utf-16')
    xml = re.sub(r'<Priority>\d+</Priority>', '', xml).replace('</Settings>', '<Priority>4</Priority></Settings>')
    path.write_text(xml, encoding='utf-16')
    write_json(runtime/scope['test_id']/'priority-correction.json', evidence)
    print(json.dumps(evidence))
