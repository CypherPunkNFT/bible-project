"""Bible-only batch embedding service. Shares model files and a hardware lock, never KB data."""
import json
import math
import os
import subprocess
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse


def request_vectors(config, texts, kind="document"):
    cfg = config["embedding"]
    payload = json.dumps({"texts": texts, "kind": kind}, ensure_ascii=False).encode("utf-8")
    if len(texts) > 1 and (len(payload) > 262144 or len(texts) > 64):
        middle = len(texts) // 2
        return request_vectors(config, texts[:middle], kind) + request_vectors(config, texts[middle:], kind)
    request = urllib.request.Request(cfg["daemon_url"] + "/embed",
        payload, {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            result = json.load(response)
    except urllib.error.HTTPError as exc:
        raise RuntimeError(exc.read().decode("utf-8")) from exc
    if (result.get("model"), result.get("revision"), result.get("dimensions")) != (cfg["model"], cfg["revision"], cfg["dimensions"]):
        raise ValueError("Embedding model identity mismatch")
    vectors = result.get("vectors", [])
    if len(vectors) != len(texts):
        raise ValueError("Embedding count mismatch")
    for vector in vectors:
        if len(vector) != cfg["dimensions"] or not all(math.isfinite(x) for x in vector):
            raise ValueError("Invalid embedding dimensions or values")
        if abs(sum(x*x for x in vector)-1) > .02:
            raise ValueError("Embedding is not normalized")
    return vectors


class Encoder:
    def __init__(self, config):
        self.config, self.model, self.gpu_lock = config, None, None
        self.mutex = threading.Lock()
        self.last_used, self.batches = time.monotonic(), 0

    def load(self):
        if self.model is not None:
            return
        cfg = self.config["embedding"]
        # This is exclusively a GPU coordination lock used by the existing model service.
        # No shared corpus, database, vector table or service configuration is opened.
        lock_path = cfg["gpu_lock"]
        if not lock_path.parent.exists():
            lock_path = self.config["state_dir"] / "gpu.lock"
        handle = open(lock_path, "a+b")
        try:
            if os.name == "nt":
                import msvcrt
                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            free = subprocess.check_output(["nvidia-smi", "--query-gpu=memory.free", "--format=csv,noheader,nounits"], text=True, timeout=10)
            if int(free.strip().splitlines()[0]) < 10500:
                raise RuntimeError("Local GPU has less than 10,500 MB free; retry when available")
            os.environ["HF_HUB_OFFLINE"] = "1"
            os.environ["TRANSFORMERS_OFFLINE"] = "1"
            import torch
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(cfg["model"], revision=cfg["revision"], device="cuda",
                local_files_only=True, trust_remote_code=False, model_kwargs={"torch_dtype": torch.bfloat16})
            self.model.max_seq_length = cfg["max_tokens"]
            self.gpu_lock = handle
        except BaseException:
            handle.close()
            raise

    def encode(self, texts, kind):
        with self.mutex:
            self.load()
            prompt = self.model.prompts.get("query", "") if kind == "query" else ""
            lengths = [len(tokens) for tokens in self.model.tokenizer([prompt + text for text in texts], truncation=False)["input_ids"]]
            if max(lengths) > self.config["embedding"]["max_tokens"]:
                raise ValueError("Chunk exceeds model token limit; split it instead of silently truncating")
            import numpy as np
            kwargs = {"prompt_name": "query"} if kind == "query" else {}
            try:
                vectors = self.model.encode(texts, batch_size=min(len(texts), self.config["embedding"]["batch_size"]),
                                            normalize_embeddings=False, show_progress_bar=False, **kwargs)
            except Exception as exc:
                # Retry smaller batches for unusually dense multilingual text, preserving all input.
                import torch
                if not isinstance(exc, torch.cuda.OutOfMemoryError) or len(texts) == 1:
                    raise
                torch.cuda.empty_cache()
                vectors = self.model.encode(texts, batch_size=1, normalize_embeddings=False, show_progress_bar=False, **kwargs)
            vectors = vectors[:, :self.config["embedding"]["dimensions"]]
            vectors /= np.linalg.norm(vectors, axis=1, keepdims=True)
            self.last_used, self.batches = time.monotonic(), self.batches + 1
            return vectors.tolist()

    def idle_loop(self):
        while True:
            time.sleep(30)
            if time.monotonic()-self.last_used < 300:
                continue
            with self.mutex:
                if self.model is not None and time.monotonic()-self.last_used >= 300:
                    del self.model
                    self.model = None
                    import gc
                    import torch
                    gc.collect()
                    torch.cuda.empty_cache()
                    self.gpu_lock.close()
                    self.gpu_lock = None


def serve_encoder(config):
    encoder = Encoder(config)
    port = urlparse(config["embedding"]["daemon_url"]).port

    class Handler(BaseHTTPRequestHandler):
        timeout = 30
        def reply(self, code, payload):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def allowed(self):
            return self.headers.get("Host") in (f"127.0.0.1:{port}", f"localhost:{port}") and not self.headers.get("Origin")

        def do_GET(self):
            if not self.allowed() or self.path != "/health":
                return self.reply(403, {"error": "Local encoder only"})
            self.reply(200, {"service": "bible-project-encoder", "loaded": encoder.model is not None, "batches": encoder.batches, "pid": os.getpid()})

        def do_POST(self):
            if not self.allowed() or self.path != "/embed":
                return self.reply(403, {"error": "Local encoder only"})
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= 262144 or self.headers.get("Transfer-Encoding"):
                    return self.reply(400, {"error": "Invalid request size"})
                body = json.loads(self.rfile.read(length))
                texts, kind = body.get("texts"), body.get("kind", "document")
                if not isinstance(texts, list) or not 0 < len(texts) <= 64 or not all(isinstance(text, str) and 0 < len(text) <= 16000 for text in texts) or kind not in ("query", "document"):
                    return self.reply(400, {"error": "Invalid texts or embedding kind"})
                vectors = encoder.encode(texts, kind)
                cfg = config["embedding"]
                self.reply(200, {"vectors": vectors, "model": cfg["model"], "revision": cfg["revision"], "dimensions": cfg["dimensions"]})
            except Exception as exc:
                self.reply(503, {"error": str(exc)})

        def log_message(self, *_):
            pass

    class LocalServer(ThreadingHTTPServer):
        allow_reuse_address = False

    server = LocalServer(("127.0.0.1", port), Handler)
    threading.Thread(target=encoder.idle_loop, daemon=True).start()
    print(f"Bible-only encoder: http://127.0.0.1:{port}", flush=True)
    server.serve_forever()
