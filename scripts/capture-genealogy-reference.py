from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204); self.headers_out(); self.end_headers()
    def headers_out(self):
        self.send_header('Access-Control-Allow-Origin','http://127.0.0.1:8931')
        self.send_header('Access-Control-Allow-Methods','POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Content-Type')
    def do_POST(self):
        if self.path!='/checkpoint' or self.headers.get('Origin')!='http://127.0.0.1:8931':
            self.send_error(403); return
        size=int(self.headers.get('Content-Length',0))
        if size>5000000: self.send_error(413); return
        report=json.loads(self.rfile.read(size))
        if report.get('format')!='bible-circular-layout-study': self.send_error(400); return
        target=root/'docs'/'genealogy-layouts'/'manual-2026-10-06.json'
        target.parent.mkdir(parents=True,exist_ok=True)
        if target.exists(): self.send_error(409); return
        target.write_text(json.dumps(report,indent=2),encoding='utf-8')
        self.send_response(200); self.headers_out(); self.end_headers(); self.wfile.write(b'saved')
        print(str(target),flush=True)
HTTPServer(('127.0.0.1',8938),Handler).serve_forever()
