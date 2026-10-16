"""Real child-process/HTTP recovery in an isolated fixture, never the corpus."""
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch
import psutil
from knowledge import native_supervisor as s, encoder_recovery as e
from knowledge.settings import write_json

STUB = '''import json,os,sys,time
from http.server import BaseHTTPRequestHandler,HTTPServer
if sys.argv[1]=='encoder':
 class Handler(BaseHTTPRequestHandler):
  def do_GET(self):
   failed=sys.argv[3]=='failed'
   body=json.dumps(dict(service='bible-project-encoder',pid=os.getpid(),error='CUDA error: fixture' if failed else None)).encode()
   self.send_response(503 if failed else 200);self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
  def log_message(self,*a):pass
 HTTPServer(('127.0.0.1',int(sys.argv[2])),Handler).serve_forever()
else:
 if sys.argv[1]=='replacement':
  from pathlib import Path
  Path(sys.argv[2]).write_text('one replacement resumed')
 while True:time.sleep(1)
'''


@unittest.skipUnless(os.name=='nt','Windows process launch contract')
class ProcessRecoveryTests(unittest.TestCase):
    def test_failed_encoder_and_worker_replaced_once(self):
        with tempfile.TemporaryDirectory() as tmp:
            state=Path(tmp);site=state/'site';site.mkdir()
            script=site/'stub.py';script.write_text(STUB)
            with socket.socket() as sock:
                sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
            config=dict(state_dir=state,site_dir=site,embedding=dict(daemon_url=f'http://127.0.0.1:{port}'))
            children=[];cores=[];encoders=[];launches=[]
            real_popen=subprocess.Popen
            def spawn(args):
                p=real_popen([sys._base_executable,str(script),*args],cwd=site,stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
                children.append(p);return p
            def row(p,role=None,parent=0):
                value=dict(pid=p.pid,parent=parent,created=psutil.Process(p.pid).create_time())
                if role:value['role']=role
                return value
            def inventory():
                return [row(p,role,parent) for p,role,parent in cores if p.poll() is None],[]
            def encoder_inventory(c):
                return [row(p) for p in encoders if p.poll() is None],[]
            def replacement(c):
                p=spawn(['replacement',str(state/'resumed')]);cores.append((p,'owner',0));launches.append(p.pid)
                return dict(pid=p.pid)
            def encoder_launch(args,**kwargs):
                self.assertEqual(args[-3:],['-m','knowledge','encoder'])
                self.assertEqual(kwargs['creationflags'],subprocess.CREATE_NO_WINDOW)
                p=spawn(['encoder',str(port),'healthy']);encoders.append(p);return p
            try:
                owner=spawn(['owner']);worker=spawn(['worker'])
                cores.extend([(owner,'owner',0),(worker,'embed',owner.pid)])
                encoders.append(spawn(['encoder',str(port),'failed']))
                for _ in range(50):
                    if e.health(config)['state']=='failed':break
                    time.sleep(.1)
                self.assertEqual(e.health(config)['state'],'failed')
                write_json(state/'native-supervisor/control.json',dict(enabled=True,mode='embedding_only',corpus_build='fixture',encoder_recovery=True))
                write_json(state/'embedding-progress.json',dict(state='running',pid=worker.pid,indexed=1,updated_at=s.stamp()))
                write_json(state/'intake-completion.json',dict(state='embedding',pid=owner.pid,updated_at=s.stamp()))
                with patch.object(s,'STARTUP',0),patch.object(s,'snapshot',side_effect=lambda c:inventory()), \
                     patch.object(e,'processes',side_effect=encoder_inventory),patch.object(e.subprocess,'Popen',side_effect=encoder_launch), \
                     patch.object(s,'launch_owner',side_effect=replacement):
                    report=s.tick(config)
                    self.assertEqual(report['state'],'restarted')
                    self.assertIsNotNone(owner.poll());self.assertIsNotNone(worker.poll())
                    self.assertEqual(e.health(config)['state'],'healthy')
                    for _ in range(50):
                        if (state/'resumed').exists():break
                        time.sleep(.1)
                    self.assertEqual((state/'resumed').read_text(),'one replacement resumed')
                    # A second tick during backoff cannot start another owner.
                    s.tick(config)
                    self.assertEqual(len(launches),1)
                    self.assertEqual(s.read(state/'native-supervisor/recovery.json')['attempts'],1)
            finally:
                for p in children:
                    if p.poll() is None:p.terminate()
                for p in children:p.wait(10)


if __name__=='__main__':unittest.main()
