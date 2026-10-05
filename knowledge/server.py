"""Read-only local search UI/API. No connection to the public site's database or API."""
import json
import os
import threading
from contextlib import closing
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from .graph import neighbors
from .retrieval import search, status
from .store import connect


def serve(config, port=None):
    port = port or config["port"]
    static = Path(__file__).parent / "web"
    search_slots = threading.BoundedSemaphore(2)

    class Handler(BaseHTTPRequestHandler):
        timeout = 30
        def reply(self, code, value, mime="application/json; charset=utf-8"):
            body = value if isinstance(value, bytes) else json.dumps(value, ensure_ascii=False).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.headers.get("Host") not in (f"127.0.0.1:{port}", f"localhost:{port}"):
                return self.reply(403, {"error": "Local Bible knowledge service only"})
            origin = self.headers.get("Origin")
            if origin and origin not in (f"http://127.0.0.1:{port}", f"http://localhost:{port}"):
                return self.reply(403, {"error": "Cross-origin access is disabled"})
            url = urlparse(self.path)
            params = {key: values[0] for key, values in parse_qs(url.query).items()}
            try:
                if url.path in ("/", "/app.js", "/style.css"):
                    name = "index.html" if url.path == "/" else url.path[1:]
                    mime = {"index.html": "text/html", "app.js": "text/javascript", "style.css": "text/css"}[name]
                    return self.reply(200, (static / name).read_bytes(), mime + "; charset=utf-8")
                if url.path == "/health":
                    return self.reply(200, {"service": "bible-project-knowledge", "ready": config["db"].exists(), "pid": os.getpid()})
                if url.path == "/api/status":
                    return self.reply(200, status(config))
                if url.path == "/api/search":
                    if not search_slots.acquire(blocking=False):
                        return self.reply(429, {"error": "Two searches are already running; try again shortly"})
                    try:
                        result = search(config, params.get("q", ""), params.get("mode", "hybrid"), int(params.get("limit", "12")),
                                        **{key: params.get(key, "") for key in ("kind", "edition", "language", "book")})
                        return self.reply(200, result)
                    finally:
                        search_slots.release()
                if url.path == "/api/document":
                    with closing(connect(config["db"], readonly=True)) as db:
                        document = db.execute("SELECT * FROM documents WHERE id=?", (params.get("id", ""),)).fetchone()
                        if not document:
                            return self.reply(404, {"error": "Document not found"})
                        offset = max(0, int(params.get("offset", 0)))
                        if params.get("chunk"):
                            selected = db.execute("SELECT rowid FROM chunks WHERE id=? AND document_id=?", (params["chunk"], document["id"])).fetchone()
                            if selected:
                                preceding = db.execute("SELECT COUNT(*) FROM chunks WHERE document_id=? AND rowid<?", (document["id"], selected["rowid"])).fetchone()[0]
                                offset = max(0, preceding-1)
                        chunks = [dict(row) for row in db.execute("SELECT id,title,text,locator,link FROM chunks WHERE document_id=? ORDER BY rowid LIMIT 50 OFFSET ?", (document["id"], offset))]
                        return self.reply(200, {"document": dict(document), "chunks": chunks, "offset": offset, "more": len(chunks) == 50,
                            "references": [dict(row) for row in db.execute("SELECT * FROM references_to WHERE document_id=? LIMIT 100", (document["id"],))],
                            "connections": neighbors(db, document["id"])})
                if url.path == "/api/connections":
                    with closing(connect(config["db"], readonly=True)) as db:
                        return self.reply(200, neighbors(db, params.get("id", "")))
                if url.path == "/api/inventory":
                    with closing(connect(config["db"], readonly=True)) as db:
                        offset = max(0, int(params.get("offset", 0)))
                        return self.reply(200, [dict(row) for row in db.execute("SELECT * FROM files ORDER BY path LIMIT 100 OFFSET ?", (offset,))])
                return self.reply(404, {"error": "Not found"})
            except ValueError as exc:
                self.reply(400, {"error": str(exc)})
            except Exception as exc:
                self.reply(503, {"error": str(exc)})

        def log_message(self, *_):
            pass

    class LocalServer(ThreadingHTTPServer):
        allow_reuse_address = False

    server = LocalServer(("127.0.0.1", port), Handler)
    print(f"Bible Project knowledge: http://127.0.0.1:{port}", flush=True)
    server.serve_forever()
