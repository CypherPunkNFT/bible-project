"""Runs the pilot's items through the local model (HyperQwen on 127.0.0.1:18020, thinking off) with the same task text
Haiku gets. Usage: python run_local.py es|pt. Writes qwen-<lang>/<item>.json; finished items are skipped on a rerun."""
import json
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
HERE = Path(__file__).resolve().parent
URL = "http://127.0.0.1:18020/v1/chat/completions"


def translate(task: str, item: Path, out: Path) -> str:
    target = out / f"{item.stem}.json"
    if target.exists():
        return f"{item.stem} already done"
    body = {"model": "qwen3.8-27b", "max_tokens": 12000, "temperature": 0.3,
            "chat_template_kwargs": {"enable_thinking": False},
            "messages": [{"role": "system", "content": task}, {"role": "user", "content": item.read_text("utf-8")}]}
    request = urllib.request.Request(URL, json.dumps(body).encode("utf-8"), {"Content-Type": "application/json"})
    started = time.time()
    with urllib.request.urlopen(request, timeout=900) as response:
        reply = json.loads(response.read().decode("utf-8"))
    choice = reply["choices"][0]
    record = {"result": choice["message"]["content"], "finish_reason": choice.get("finish_reason"), "usage": reply.get("usage"), "seconds": round(time.time() - started, 1)}
    target.write_text(json.dumps(record, ensure_ascii=False, indent=1), "utf-8")
    return f"{item.stem} {record['seconds']}s {record['usage'].get('completion_tokens')} tokens {record['finish_reason']}"


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in ("es", "pt"):
        raise SystemExit("usage: python run_local.py es|pt")
    language = sys.argv[1]
    task = (HERE / f"task-{language}.txt").read_text("utf-8")
    out = HERE / f"qwen-{language}"
    out.mkdir(exist_ok=True)
    items = sorted((HERE / "items").glob("*.txt"))
    started = time.time()
    with ThreadPoolExecutor(16) as pool:
        futures = [pool.submit(translate, task, item, out) for item in items]
        for future in futures:
            try:
                print(future.result(), flush=True)
            except Exception as error:  # one failed item must not stop the rest; it is reported and rerun later
                print("FAILED:", type(error).__name__, error, flush=True)
    print(f"{language}: {len(list(out.glob('*.json')))}/{len(items)} done in {time.time() - started:.0f}s")
